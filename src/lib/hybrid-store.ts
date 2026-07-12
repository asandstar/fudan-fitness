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

const SESSION_USER_KEY = 'ff_session_user_id';
const LEGACY_SESSION_KEYS = ['ff_current_user_id', 'ff_hybrid_current_user_id'];

function migrateSessionKeyIfNeeded(): void {
  if (typeof window === 'undefined') return;
  try {
    if (localStorage.getItem(SESSION_USER_KEY)) return;
    for (const oldKey of LEGACY_SESSION_KEYS) {
      const val = localStorage.getItem(oldKey);
      if (val !== null) {
        localStorage.setItem(SESSION_USER_KEY, val);
        localStorage.removeItem(oldKey);
        return;
      }
    }
  } catch {
    // ignore
  }
}

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
    migrateSessionKeyIfNeeded();
    return localStorage.getItem(SESSION_USER_KEY);
  } catch {
    return null;
  }
}

function setCurrentUserId(id: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (id) {
      localStorage.setItem(SESSION_USER_KEY, id);
      for (const oldKey of LEGACY_SESSION_KEYS) {
        localStorage.removeItem(oldKey);
      }
    } else {
      localStorage.removeItem(SESSION_USER_KEY);
      for (const oldKey of LEGACY_SESSION_KEYS) {
        localStorage.removeItem(oldKey);
      }
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

  // Phase 1B: 通知职责归 Context 层，数据层不再创建通知
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
  // Phase 1B: 通知职责归 Context 层
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
  // Phase 1B: 通知职责归 Context 层
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

async function mockRegister(params: {
  studentId: string;
  password: string;
  name: string;
  department: string;
  grade: string;
}): Promise<User> {
  const users = getMockUsers();
  if (users.find((u) => u.studentId === params.studentId)) {
    throw new Error('该学号已注册');
  }
  const newUser: User = {
    id: genId('u'),
    studentId: params.studentId,
    password: params.password,
    name: params.name,
    department: params.department,
    grade: params.grade,
    role: 'member',
    violationCount: 0,
    bannedUntil: null,
    favoriteCoaches: [],
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);
  writeLS('users', users);
  setCurrentUserId(newUser.id);
  return newUser;
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

// ===== Phase 1B: 9 个持久化方法 mock 实现 =====

async function mockCompleteAppointment(appointmentId: string): Promise<void> {
  const appointments = getMockAppointments();
  const idx = appointments.findIndex((a) => a.id === appointmentId);
  if (idx === -1) throw new Error('预约不存在');
  if (appointments[idx].status !== 'approved') {
    throw new Error('只有已确认的预约才能标记完成');
  }

  appointments[idx] = {
    ...appointments[idx],
    status: 'completed',
    updatedAt: new Date().toISOString(),
  };
  writeLS('appointments', appointments);

  // 同步增加教练 totalSessions
  const coaches = getMockCoaches();
  const coachIdx = coaches.findIndex((c) => c.id === appointments[idx].coachId);
  if (coachIdx !== -1) {
    coaches[coachIdx] = { ...coaches[coachIdx], totalSessions: coaches[coachIdx].totalSessions + 1 };
    writeLS('coaches', coaches);
  }
}

// 教练资料可编辑字段白名单 — 管理字段（certStatus/reviewedBy 等）禁止通过此入口修改
function filterCoachEditablePatch(patch: Partial<CoachProfile>): Partial<CoachProfile> {
  const safe: Partial<CoachProfile> = {};
  if (patch.specialties !== undefined) safe.specialties = patch.specialties;
  if (patch.styleDesc !== undefined) safe.styleDesc = patch.styleDesc;
  if (patch.isBeginnerFriendly !== undefined) safe.isBeginnerFriendly = patch.isBeginnerFriendly;
  if (patch.isFemaleFriendly !== undefined) safe.isFemaleFriendly = patch.isFemaleFriendly;
  if (patch.venues !== undefined) safe.venues = patch.venues;
  if (patch.trainingPhilosophy !== undefined) safe.trainingPhilosophy = patch.trainingPhilosophy;
  if (patch.rating !== undefined) safe.rating = patch.rating;
  if (patch.successCases !== undefined) safe.successCases = patch.successCases;
  return safe;
}

async function mockUpdateCoachProfile(coachId: string, patch: Partial<CoachProfile>): Promise<void> {
  const coaches = getMockCoaches();
  const idx = coaches.findIndex((c) => c.id === coachId);
  if (idx === -1) throw new Error('教练资料不存在');

  const safePatch = filterCoachEditablePatch(patch);
  coaches[idx] = { ...coaches[idx], ...safePatch };
  writeLS('coaches', coaches);
}

async function mockApplyCoach(
  draft: Omit<CoachProfile, 'id' | 'createdAt' | 'totalSessions' | 'totalStudents' | 'certStatus' | 'certAppliedAt'>,
): Promise<CoachProfile> {
  const currentUserId = getCurrentUserId();
  if (!currentUserId) throw new Error('请先登录');

  const coaches = getMockCoaches();
  // 防止重复申请
  const existing = coaches.find(
    (c) => c.userId === currentUserId && ['pending', 'approved'].includes(c.certStatus),
  );
  if (existing) throw new Error('您已有待审核或已通过的教练申请');

  const users = getMockUsers();
  const user = users.find((u) => u.id === currentUserId);
  if (!user) throw new Error('用户不存在');

  const newCoach: CoachProfile = {
    ...draft,
    id: genId('c'),
    userId: currentUserId,
    name: user.name,
    department: user.department,
    grade: user.grade,
    totalSessions: 0,
    totalStudents: 0,
    certStatus: 'pending',
    certAppliedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };
  coaches.push(newCoach);
  writeLS('coaches', coaches);
  return newCoach;
}

async function mockApproveCoach(coachId: string, reviewedBy: string): Promise<void> {
  const coaches = getMockCoaches();
  const idx = coaches.findIndex((c) => c.id === coachId);
  if (idx === -1) throw new Error('教练资料不存在');
  if (coaches[idx].certStatus !== 'pending') {
    throw new Error('该教练申请已处理');
  }

  coaches[idx] = {
    ...coaches[idx],
    certStatus: 'approved',
    certReviewedAt: new Date().toISOString(),
    reviewedBy,
  };
  writeLS('coaches', coaches);

  // 同步更新用户角色为 coach
  const users = getMockUsers();
  const userIdx = users.findIndex((u) => u.id === coaches[idx].userId);
  if (userIdx !== -1) {
    users[userIdx] = { ...users[userIdx], role: 'coach' };
    writeLS('users', users);
  }
}

async function mockRejectCoach(coachId: string, reason: string, reviewedBy: string): Promise<void> {
  const coaches = getMockCoaches();
  const idx = coaches.findIndex((c) => c.id === coachId);
  if (idx === -1) throw new Error('教练资料不存在');
  if (coaches[idx].certStatus !== 'pending') {
    throw new Error('该教练申请已处理');
  }

  coaches[idx] = {
    ...coaches[idx],
    certStatus: 'rejected',
    certReviewNote: reason,
    certReviewedAt: new Date().toISOString(),
    reviewedBy,
  };
  writeLS('coaches', coaches);
}

async function mockDeleteAnnouncement(id: string): Promise<void> {
  const announcements = getMockAnnouncements();
  const filtered = announcements.filter((a) => a.id !== id);
  writeLS('announcements', filtered);
}

async function mockUnbanUser(userId: string): Promise<void> {
  const users = getMockUsers();
  const idx = users.findIndex((u) => u.id === userId);
  if (idx === -1) throw new Error('用户不存在');
  users[idx] = { ...users[idx], violationCount: 0, bannedUntil: null };
  writeLS('users', users);
}

async function mockMarkAllNotificationsRead(userId: string): Promise<void> {
  const notifications = getMockNotifications();
  const updated = notifications.map((n) =>
    n.userId === userId ? { ...n, read: true } : n,
  );
  writeLS('notifications', updated);
}

async function mockDeleteNotification(notificationId: string, userId: string): Promise<void> {
  const notifications = getMockNotifications();
  const target = notifications.find((n) => n.id === notificationId);
  if (!target) throw new Error('通知不存在');
  if (target.userId !== userId) throw new Error('无权删除他人的通知');
  const filtered = notifications.filter((n) => n.id !== notificationId);
  writeLS('notifications', filtered);
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

export async function getSlots(coachId?: string): Promise<CoachSlot[]> {
  if (isSupabaseConfigured()) {
    return api.getCoachSlots(coachId);
  }
  const slots = await mockGetSlots();
  if (coachId) {
    return slots.filter(s => s.coachId === coachId);
  }
  return slots;
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

export async function createBooking(draft: BookingDraft & { studentId?: string }): Promise<Appointment> {
  if (isSupabaseConfigured()) {
    const studentId = draft.studentId || getCurrentUserId();
    if (!studentId) throw new Error('请先登录');
    return api.createAppointment({ ...draft, studentId });
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
    return api.toggleFavoriteCoach(userId, coachId);
  }
  return mockToggleFavoriteCoach(userId, coachId);
}

export async function login(studentId: string, password: string): Promise<User | null> {
  if (isSupabaseConfigured()) {
    return api.loginByStudentId(studentId, password);
  }
  return mockLogin(studentId, password);
}

export async function register(params: {
  studentId: string;
  password: string;
  name: string;
  department: string;
  grade: string;
}): Promise<User> {
  if (isSupabaseConfigured()) {
    return api.registerByStudentId(params);
  }
  return mockRegister(params);
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

// ===== Phase 1B: 9 个持久化方法路由 =====

/**
 * 教练完成带练
 * - 验证 appointment.status === 'approved'
 * - 更新 appointment.status = 'completed' + updatedAt
 * - 同步增加 coach.totalSessions（防重复）
 * - 通知由 Context 层负责
 */
export async function completeAppointment(appointmentId: string): Promise<void> {
  if (isSupabaseConfigured()) {
    return api.completeAppointment(appointmentId);
  }
  return mockCompleteAppointment(appointmentId);
}

/**
 * 教练更新自己的资料（白名单过滤管理字段）
 */
export async function updateCoachProfile(coachId: string, patch: Partial<CoachProfile>): Promise<void> {
  if (isSupabaseConfigured()) {
    return api.updateCoachProfile(coachId, patch);
  }
  return mockUpdateCoachProfile(coachId, patch);
}

/**
 * 学员申请教练 — 防止重复申请
 */
export async function applyCoach(
  draft: Omit<CoachProfile, 'id' | 'createdAt' | 'totalSessions' | 'totalStudents' | 'certStatus' | 'certAppliedAt'>,
): Promise<CoachProfile> {
  if (isSupabaseConfigured()) {
    return api.applyCoach(draft);
  }
  return mockApplyCoach(draft);
}

/**
 * 管理员通过教练申请 — 同时更新 certStatus + profiles.role
 */
export async function approveCoach(coachId: string, reviewedBy: string): Promise<void> {
  if (isSupabaseConfigured()) {
    return api.approveCoach(coachId, reviewedBy);
  }
  return mockApproveCoach(coachId, reviewedBy);
}

/**
 * 管理员拒绝教练申请 — 保存原因
 */
export async function rejectCoach(coachId: string, reason: string, reviewedBy: string): Promise<void> {
  if (isSupabaseConfigured()) {
    return api.rejectCoach(coachId, reason, reviewedBy);
  }
  return mockRejectCoach(coachId, reason, reviewedBy);
}

/**
 * 删除公告
 */
export async function deleteAnnouncement(id: string): Promise<void> {
  if (isSupabaseConfigured()) {
    return api.deleteAnnouncement(id);
  }
  return mockDeleteAnnouncement(id);
}

/**
 * 解禁用户 — 清零 violationCount + 清空 bannedUntil
 */
export async function unbanUser(userId: string): Promise<void> {
  if (isSupabaseConfigured()) {
    return api.unbanUser(userId);
  }
  return mockUnbanUser(userId);
}

/**
 * 标记当前用户所有通知为已读
 */
export async function markAllNotificationsRead(userId: string): Promise<void> {
  if (isSupabaseConfigured()) {
    return api.markAllNotificationsRead(userId);
  }
  return mockMarkAllNotificationsRead(userId);
}

/**
 * 删除通知 — 带归属校验
 */
export async function deleteNotification(notificationId: string, userId: string): Promise<void> {
  if (isSupabaseConfigured()) {
    return api.deleteNotification(notificationId, userId);
  }
  return mockDeleteNotification(notificationId, userId);
}
