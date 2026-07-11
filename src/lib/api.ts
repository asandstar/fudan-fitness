// 数据访问层 — 封装所有 Supabase CRUD 操作
// 认证方式：学号直查（不依赖 Supabase Auth）
// 预留：邮箱验证接口（studentIdToEmail），后续可升级
import { supabase, isSupabaseConfigured } from './supabase';
import type {
  User, CoachProfile, Venue, Appointment, CoachSlot,
  Announcement, Notification, TrainingRecord, BookingDraft
} from './types';

// ===== 工具函数 =====

/**
 * 学号 → 学生邮箱（预留，后续可接入 Supabase Auth 邮箱验证）
 * 规则：21级及以后用 @m.fudan.edu.cn，20级及之前用 @fudan.edu.cn
 */
export function studentIdToEmail(studentId: string): string {
  const prefix = studentId.substring(0, 2);
  const year = parseInt(prefix, 10);
  // 21级及以后（含25级、26级）用 @m.fudan.edu.cn
  const suffix = year >= 21 ? '@m.fudan.edu.cn' : '@fudan.edu.cn';
  return `${studentId}${suffix}`;
}

/**
 * 当前登录用户 ID 的本地存储 key
 */
const CURRENT_USER_KEY = 'ff_current_user_id';

function setCurrentUserId(userId: string | null) {
  if (typeof window === 'undefined') return;
  if (userId) {
    localStorage.setItem(CURRENT_USER_KEY, userId);
  } else {
    localStorage.removeItem(CURRENT_USER_KEY);
  }
}

function getCurrentUserId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(CURRENT_USER_KEY);
}

// ===== 认证操作（学号直查） =====

/**
 * 学号 + 密码登录
 * 直接查 profiles 表，不依赖 Supabase Auth
 */
export async function loginByStudentId(studentId: string, password: string): Promise<User> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase not configured');
  }
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('student_id', studentId)
    .eq('password', password)
    .single();

  if (error || !data) {
    throw new Error('学号或密码错误');
  }
  setCurrentUserId(data.id);
  return data as User;
}

/**
 * 注册新用户
 */
export async function registerByStudentId(params: {
  studentId: string;
  password: string;
  name: string;
  department: string;
  grade: string;
}): Promise<User> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase not configured');
  }
  const id = `u_${Date.now()}`;
  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id,
      student_id: params.studentId,
      password: params.password,
      name: params.name,
      department: params.department,
      grade: params.grade,
      role: 'member',
      violation_count: 0,
      banned_until: null,
      favorite_coaches: [],
    })
    .select()
    .single();

  if (error) throw error;
  setCurrentUserId(id);
  return data as User;
}

/**
 * 登出
 */
export async function signOut(): Promise<void> {
  setCurrentUserId(null);
}

/**
 * 获取当前登录用户
 */
export async function getCurrentUser(): Promise<User | null> {
  const userId = getCurrentUserId();
  if (!userId) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !data) return null;
  return data as User;
}

// ===== 场馆操作 =====

export async function getVenues(): Promise<Venue[]> {
  const { data, error } = await supabase
    .from('venues')
    .select('*')
    .order('display_order');
  if (error) throw error;
  return (data || []) as Venue[];
}

// ===== 教练操作 =====

export async function getCoaches(): Promise<CoachProfile[]> {
  const { data, error } = await supabase
    .from('coach_profiles')
    .select('*');
  if (error) throw error;
  return (data || []) as CoachProfile[];
}

export async function getCoachSlots(coachId?: string): Promise<CoachSlot[]> {
  let query = supabase.from('coach_slots').select('*');
  if (coachId) {
    query = query.eq('coach_id', coachId);
  }
  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as CoachSlot[];
}

export async function toggleSlot(slotId: string): Promise<void> {
  const { data: slot } = await supabase
    .from('coach_slots')
    .select('is_available')
    .eq('id', slotId)
    .single();

  if (!slot) throw new Error('Slot not found');

  const { error } = await supabase
    .from('coach_slots')
    .update({ is_available: !slot.is_available })
    .eq('id', slotId);
  if (error) throw error;
}

export async function addSlot(slot: Omit<CoachSlot, 'id'>): Promise<CoachSlot> {
  const { data, error } = await supabase
    .from('coach_slots')
    .insert(slot)
    .select()
    .single();
  if (error) throw error;
  return data as CoachSlot;
}

// ===== 预约操作 =====

export async function getAppointments(filters?: {
  studentId?: string;
  coachId?: string;
  status?: string;
}): Promise<Appointment[]> {
  let query = supabase.from('appointments').select('*');

  if (filters?.studentId) {
    query = query.eq('student_id', filters.studentId);
  }
  if (filters?.coachId) {
    query = query.eq('coach_id', filters.coachId);
  }
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []) as Appointment[];
}

export async function createAppointment(draft: BookingDraft & { studentId: string }): Promise<Appointment> {
  const { data, error } = await supabase
    .from('appointments')
    .insert({
      student_id: draft.studentId,
      coach_id: draft.coachId,
      venue_id: draft.venueId,
      date: draft.date,
      start_time: draft.startTime,
      end_time: draft.endTime,
      training_note: draft.trainingNote,
      status: 'pending',
    })
    .select()
    .single();
  if (error) throw error;
  return data as Appointment;
}

export async function cancelAppointment(
  appointmentId: string,
  reason?: string
): Promise<void> {
  const { error } = await supabase
    .from('appointments')
    .update({
      status: 'cancelled',
      cancel_reason: reason,
      cancelled_at: new Date().toISOString(),
    })
    .eq('id', appointmentId);
  if (error) throw error;
}

export async function approveAppointment(appointmentId: string): Promise<void> {
  const { error } = await supabase
    .from('appointments')
    .update({ status: 'approved' })
    .eq('id', appointmentId);
  if (error) throw error;
}

export async function rejectAppointment(
  appointmentId: string,
  reason: string
): Promise<void> {
  const { error } = await supabase
    .from('appointments')
    .update({
      status: 'rejected',
      cancel_reason: reason,
    })
    .eq('id', appointmentId);
  if (error) throw error;
}

export async function completeAppointment(appointmentId: string): Promise<void> {
  const { error } = await supabase
    .from('appointments')
    .update({ status: 'completed' })
    .eq('id', appointmentId);
  if (error) throw error;
}

// ===== 通知操作 =====

export async function getNotifications(userId: string): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []) as Notification[];
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId);
  if (error) throw error;
}

export async function addNotification(
  notification: Omit<Notification, 'id' | 'read' | 'createdAt'>
): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .insert({
      user_id: notification.userId,
      type: notification.type,
      title: notification.title,
      content: notification.content,
      related_id: notification.relatedId,
      read: false,
    });
  if (error) throw error;
}

// ===== 训练记录操作 =====

export async function getTrainingRecords(userId: string): Promise<TrainingRecord[]> {
  const { data, error } = await supabase
    .from('training_records')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []) as TrainingRecord[];
}

export async function addTrainingRecord(
  record: Omit<TrainingRecord, 'id' | 'createdAt'>
): Promise<TrainingRecord> {
  const { data, error } = await supabase
    .from('training_records')
    .insert({
      user_id: record.userId,
      appointment_id: record.appointmentId,
      date: record.date,
      duration: record.duration,
      workout_type: record.workoutType,
      intensity: record.intensity,
      calories: record.calories,
      note: record.note,
    })
    .select()
    .single();
  if (error) throw error;
  return data as TrainingRecord;
}

// ===== 公告操作 =====

export async function getAnnouncements(): Promise<Announcement[]> {
  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .eq('status', 'published')
    .order('published_at', { ascending: false });
  if (error) throw error;
  return (data || []) as Announcement[];
}

export async function createAnnouncement(
  announcement: Omit<Announcement, 'id' | 'publishedAt'>
): Promise<void> {
  const { error } = await supabase
    .from('announcements')
    .insert(announcement);
  if (error) throw error;
}

export async function deleteAnnouncement(id: string): Promise<void> {
  const { error } = await supabase
    .from('announcements')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// ===== 收藏教练操作 =====

export async function toggleFavoriteCoach(userId: string, coachId: string): Promise<void> {
  // 获取当前收藏列表
  const { data: profile } = await supabase
    .from('profiles')
    .select('favorite_coaches')
    .eq('id', userId)
    .single();

  const favorites: string[] = profile?.favorite_coaches || [];
  const newFavorites = favorites.includes(coachId)
    ? favorites.filter(id => id !== coachId)
    : [...favorites, coachId];

  const { error } = await supabase
    .from('profiles')
    .update({ favorite_coaches: newFavorites })
    .eq('id', userId);
  if (error) throw error;
}

// ===== 管理员操作 =====

export async function approveCoach(coachId: string): Promise<void> {
  const { error } = await supabase
    .from('coach_profiles')
    .update({
      cert_status: 'approved',
      cert_reviewed_at: new Date().toISOString(),
    })
    .eq('id', coachId);
  if (error) throw error;
}

export async function rejectCoach(coachId: string, reason: string): Promise<void> {
  const { error } = await supabase
    .from('coach_profiles')
    .update({
      cert_status: 'rejected',
      cert_review_note: reason,
      cert_reviewed_at: new Date().toISOString(),
    })
    .eq('id', coachId);
  if (error) throw error;
}

export async function unbanUser(userId: string): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({
      banned_until: null,
      violation_count: 0,
    })
    .eq('id', userId);
  if (error) throw error;
}

// ===== 获取所有用户（管理员） =====

export async function getAllUsers(): Promise<User[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []) as User[];
}
