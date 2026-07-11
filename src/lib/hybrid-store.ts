import { isSupabaseConfigured } from './supabase';
import * as api from './api';
import { mockVenues, mockCoaches, mockSlots, mockAppointments, mockAnnouncements, mockUsers } from './mock-data';
import type {
  Venue,
  CoachProfile,
  CoachSlot,
  Appointment,
  Announcement,
  Notification,
  TrainingRecord,
  BookingDraft,
  User,
} from './types';
import { genId } from './utils';

const LS_PREFIX = 'ff_hybrid_';

function readLS<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(LS_PREFIX + key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeLS<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LS_PREFIX + key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

function getMockVenues(): Venue[] {
  return readLS<Venue[]>('venues', mockVenues);
}

function getMockCoaches(): CoachProfile[] {
  return readLS<CoachProfile[]>('coaches', mockCoaches);
}

function getMockSlots(): CoachSlot[] {
  return readLS<CoachSlot[]>('slots', mockSlots);
}

function getMockAppointments(): Appointment[] {
  return readLS<Appointment[]>('appointments', mockAppointments);
}

function getMockAnnouncements(): Announcement[] {
  return readLS<Announcement[]>('announcements', mockAnnouncements);
}

function getMockUsers(): User[] {
  return readLS<User[]>('users', mockUsers);
}

function getMockNotifications(): Notification[] {
  return readLS<Notification[]>('notifications', []);
}

function getMockTrainingRecords(): TrainingRecord[] {
  return readLS<TrainingRecord[]>('training_records', []);
}

function getCurrentUserId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(LS_PREFIX + 'current_user_id');
  } catch {
    return null;
  }
}

function setCurrentUserId(id: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (id) {
      localStorage.setItem(LS_PREFIX + 'current_user_id', id);
    } else {
      localStorage.removeItem(LS_PREFIX + 'current_user_id');
    }
  } catch {
    // ignore
  }
}

async function mockGetVenues(): Promise<Venue[]> {
  return getMockVenues().sort((a, b) => a.displayOrder - b.displayOrder);
}

async function mockGetCoaches(): Promise<CoachProfile[]> {
  return getMockCoaches();
}

async function mockGetSlots(): Promise<CoachSlot[]> {
  return getMockSlots();
}

async function mockGetAppointments(filters?: {
  studentId?: string;
  coachId?: string;
  status?: string;
}): Promise<Appointment[]> {
  let result = getMockAppointments();
  if (filters?.studentId) {
    result = result.filter((a) => a.studentId === filters.studentId);
  }
  if (filters?.coachId) {
    result = result.filter((a) => a.coachId === filters.coachId);
  }
  if (filters?.status) {
    result = result.filter((a) => a.status === filters.status);
  }
  return result.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

async function mockCreateBooking(draft: BookingDraft): Promise<Appointment> {
  const currentUserId = getCurrentUserId();
  if (!currentUserId) throw new Error('请先登录');

  const users = getMockUsers();
  const currentUser = users.find((u) => u.id === currentUserId);
  if (!currentUser) throw new Error('请先登录');

  const appointment: Appointment = {
    id: genId('a'),
    studentId: currentUserId,
    coachId: draft.coachId,
    venueId: draft.venueId,
    date: draft.date,
    startTime: draft.startTime,
    endTime: draft.endTime,
    status: 'pending',
    trainingNote: draft.trainingNote,
    createdAt: new Date().toISOString(),
  };

  const appointments = getMockAppointments();
  appointments.push(appointment);
  writeLS('appointments', appointments);

  const coaches = getMockCoaches();
  const coach = coaches.find((c) => c.id === draft.coachId);
  if (coach) {
    await mockAddNotification({
      userId: coach.userId,
      type: 'booking_approved',
      title: '新的预约请求',
      content: `${currentUser.name} 预约了您的带练时段: ${draft.date} ${draft.startTime}-${draft.endTime}`,
      relatedId: appointment.id,
    });
  }

  await mockAddNotification({
    userId: currentUserId,
    type: 'booking_approved',
    title: '预约提交成功',
    content: `您已预约 ${coach?.name || ''} 的带练时段: ${draft.date} ${draft.startTime}-${draft.endTime}, 等待教练审核`,
    relatedId: appointment.id,
  });

  return appointment;
}

async function mockCancelBooking(id: string, reason?: string): Promise<void> {
  const appointments = getMockAppointments();
  const idx = appointments.findIndex((a) => a.id === id);
  if (idx === -1) throw new Error('预约不存在');

  appointments[idx] = {
    ...appointments[idx],
    status: 'cancelled',
    cancelReason: reason || '学员主动取消',
    cancelledAt: new Date().toISOString(),
    cancelledBy: 'student',
  };
  writeLS('appointments', appointments);
}

async function mockApproveAppointment(id: string): Promise<void> {
  const appointments = getMockAppointments();
  const idx = appointments.findIndex((a) => a.id === id);
  if (idx === -1) throw new Error('预约不存在');

  appointments[idx] = {
    ...appointments[idx],
    status: 'approved',
    updatedAt: new Date().toISOString(),
  };
  writeLS('appointments', appointments);

  await mockAddNotification({
    userId: appointments[idx].studentId,
    type: 'booking_approved',
    title: '预约已确认',
    content: `您的预约已被教练确认: ${appointments[idx].date} ${appointments[idx].startTime}-${appointments[idx].endTime}`,
    relatedId: id,
  });
}

async function mockRejectAppointment(id: string, reason: string): Promise<void> {
  const appointments = getMockAppointments();
  const idx = appointments.findIndex((a) => a.id === id);
  if (idx === -1) throw new Error('预约不存在');

  appointments[idx] = {
    ...appointments[idx],
    status: 'rejected',
    cancelReason: reason,
    updatedAt: new Date().toISOString(),
  };
  writeLS('appointments', appointments);

  await mockAddNotification({
    userId: appointments[idx].studentId,
    type: 'booking_rejected',
    title: '预约被拒绝',
    content: `您的预约被教练拒绝: ${reason}`,
    relatedId: id,
  });
}

async function mockAddSlot(slot: Omit<CoachSlot, 'id'>): Promise<CoachSlot> {
  const newSlot: CoachSlot = {
    ...slot,
    id: genId('s'),
  };
  const slots = getMockSlots();
  slots.push(newSlot);
  writeLS('slots', slots);
  return newSlot;
}

async function mockToggleSlot(id: string): Promise<void> {
  const slots = getMockSlots();
  const idx = slots.findIndex((s) => s.id === id);
  if (idx === -1) throw new Error('时段不存在');
  slots[idx] = { ...slots[idx], isAvailable: !slots[idx].isAvailable };
  writeLS('slots', slots);
}

async function mockGetAnnouncements(): Promise<Announcement[]> {
  return getMockAnnouncements()
    .filter((a) => a.status === 'published')
    .sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
}

async function mockCreateAnnouncement(data: Omit<Announcement, 'id' | 'publishedAt'>): Promise<void> {
  const announcement: Announcement = {
    ...data,
    id: genId('ann'),
    publishedAt: new Date().toISOString(),
  };
  const announcements = getMockAnnouncements();
  announcements.unshift(announcement);
  writeLS('announcements', announcements);
}

async function mockGetNotifications(userId: string): Promise<Notification[]> {
  return getMockNotifications()
    .filter((n) => n.userId === userId)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

async function mockAddNotification(data: Omit<Notification, 'id' | 'read' | 'createdAt'>): Promise<void> {
  const notification: Notification = {
    ...data,
    id: genId('n'),
    read: false,
    createdAt: new Date().toISOString(),
  };
  const notifications = getMockNotifications();
  notifications.unshift(notification);
  writeLS('notifications', notifications);
}

async function mockMarkNotificationRead(id: string): Promise<void> {
  const notifications = getMockNotifications();
  const idx = notifications.findIndex((n) => n.id === id);
  if (idx === -1) return;
  notifications[idx] = { ...notifications[idx], read: true };
  writeLS('notifications', notifications);
}

async function mockGetTrainingRecords(userId: string): Promise<TrainingRecord[]> {
  return getMockTrainingRecords()
    .filter((r) => r.userId === userId)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

async function mockAddTrainingRecord(record: Omit<TrainingRecord, 'id' | 'createdAt'>): Promise<TrainingRecord> {
  const newRecord: TrainingRecord = {
    ...record,
    id: genId('tr'),
    createdAt: new Date().toISOString(),
  };
  const records = getMockTrainingRecords();
  records.unshift(newRecord);
  writeLS('training_records', records);
  return newRecord;
}

async function mockToggleFavoriteCoach(userId: string, coachId: string): Promise<void> {
  const users = getMockUsers();
  const idx = users.findIndex((u) => u.id === userId);
  if (idx === -1) throw new Error('用户不存在');

  const favorites = users[idx].favoriteCoaches || [];
  const newFavorites = favorites.includes(coachId)
    ? favorites.filter((id) => id !== coachId)
    : [...favorites, coachId];

  users[idx] = { ...users[idx], favoriteCoaches: newFavorites };
  writeLS('users', users);
}

async function mockLogin(studentId: string, password: string): Promise<User | null> {
  const users = getMockUsers();
  const user = users.find((u) => u.studentId === studentId && u.password === password);
  if (user) {
    setCurrentUserId(user.id);
    return user;
  }
  return null;
}

async function mockLogout(): Promise<void> {
  setCurrentUserId(null);
}

async function mockGetCurrentUser(): Promise<User | null> {
  const userId = getCurrentUserId();
  if (!userId) return null;
  const users = getMockUsers();
  return users.find((u) => u.id === userId) || null;
}

export async function getVenues(): Promise<Venue[]> {
  if (isSupabaseConfigured()) {
    return api.getVenues();
  }
  return mockGetVenues();
}

export async function getCoaches(): Promise<CoachProfile[]> {
  if (isSupabaseConfigured()) {
    return api.getCoaches();
  }
  return mockGetCoaches();
}

export async function getSlots(): Promise<CoachSlot[]> {
  if (isSupabaseConfigured()) {
    throw new Error('Supabase API does not have a getSlots function');
  }
  return mockGetSlots();
}

export async function getAppointments(filters?: {
  studentId?: string;
  coachId?: string;
  status?: string;
}): Promise<Appointment[]> {
  if (isSupabaseConfigured()) {
    return api.getAppointments(filters);
  }
  return mockGetAppointments(filters);
}

export async function createBooking(draft: BookingDraft): Promise<Appointment> {
  if (isSupabaseConfigured()) {
    return api.createAppointment(draft);
  }
  return mockCreateBooking(draft);
}

export async function cancelBooking(id: string, reason?: string): Promise<void> {
  if (isSupabaseConfigured()) {
    return api.cancelAppointment(id, reason);
  }
  return mockCancelBooking(id, reason);
}

export async function approveAppointment(id: string): Promise<void> {
  if (isSupabaseConfigured()) {
    return api.approveAppointment(id);
  }
  return mockApproveAppointment(id);
}

export async function rejectAppointment(id: string, reason: string): Promise<void> {
  if (isSupabaseConfigured()) {
    return api.rejectAppointment(id, reason);
  }
  return mockRejectAppointment(id, reason);
}

export async function addSlot(slot: Omit<CoachSlot, 'id'>): Promise<CoachSlot> {
  if (isSupabaseConfigured()) {
    return api.addSlot(slot);
  }
  return mockAddSlot(slot);
}

export async function toggleSlot(id: string): Promise<void> {
  if (isSupabaseConfigured()) {
    return api.toggleSlot(id);
  }
  return mockToggleSlot(id);
}

export async function getAnnouncements(): Promise<Announcement[]> {
  if (isSupabaseConfigured()) {
    return api.getAnnouncements();
  }
  return mockGetAnnouncements();
}

export async function createAnnouncement(data: Omit<Announcement, 'id' | 'publishedAt'>): Promise<void> {
  if (isSupabaseConfigured()) {
    return api.createAnnouncement(data);
  }
  return mockCreateAnnouncement(data);
}

export async function getNotifications(userId: string): Promise<Notification[]> {
  if (isSupabaseConfigured()) {
    return api.getNotifications(userId);
  }
  return mockGetNotifications(userId);
}

export async function addNotification(data: Omit<Notification, 'id' | 'read' | 'createdAt'>): Promise<void> {
  if (isSupabaseConfigured()) {
    return api.addNotification(data);
  }
  return mockAddNotification(data);
}

export async function markNotificationRead(id: string): Promise<void> {
  if (isSupabaseConfigured()) {
    return api.markNotificationRead(id);
  }
  return mockMarkNotificationRead(id);
}

export async function getTrainingRecords(userId: string): Promise<TrainingRecord[]> {
  if (isSupabaseConfigured()) {
    return api.getTrainingRecords(userId);
  }
  return mockGetTrainingRecords(userId);
}

export async function addTrainingRecord(record: Omit<TrainingRecord, 'id' | 'createdAt'>): Promise<TrainingRecord> {
  if (isSupabaseConfigured()) {
    return api.addTrainingRecord(record);
  }
  return mockAddTrainingRecord(record);
}

export async function toggleFavoriteCoach(userId: string, coachId: string): Promise<void> {
  if (isSupabaseConfigured()) {
    return api.toggleFavoriteCoach(coachId);
  }
  return mockToggleFavoriteCoach(userId, coachId);
}

export async function login(studentId: string, password: string): Promise<User | null> {
  if (isSupabaseConfigured()) {
    return api.getCurrentUser();
  }
  return mockLogin(studentId, password);
}

export async function logout(): Promise<void> {
  if (isSupabaseConfigured()) {
    return api.signOut();
  }
  return mockLogout();
}

export async function getCurrentUser(): Promise<User | null> {
  if (isSupabaseConfigured()) {
    return api.getCurrentUser();
  }
  return mockGetCurrentUser();
}
