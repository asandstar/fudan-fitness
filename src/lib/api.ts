// 数据访问层 — 封装所有 Supabase CRUD 操作
// 认证方式：学号直查（不依赖 Supabase Auth）
// 预留：邮箱验证接口（studentIdToEmail），后续可升级
import { supabase, isSupabaseConfigured } from './supabase';
import type {
  User, CoachProfile, Venue, Appointment, CoachSlot,
  Announcement, Notification, TrainingRecord, BookingDraft
} from './types';
import {
  userFromDbRow,
  userToDbUpdate,
  coachProfileFromDbRow,
  coachProfileToDbInsert,
  coachProfileToDbUpdate,
  coachProfileToSafeDbUpdate,
  venueFromDbRow,
  coachSlotFromDbRow,
  appointmentFromDbRow,
  announcementFromDbRow,
  notificationFromDbRow,
  trainingRecordFromDbRow,
  coachSlotToDbInsert,
  announcementToDbInsert,
  mapFromDb,
} from './db-mappers';

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
 * 当前登录用户 ID 的本地存储 key（规范键名）
 * 旧键：'ff_current_user_id'（api.ts 旧版）
 * 旧键：'ff_hybrid_current_user_id'（hybrid-store 旧版）
 * 规范键：'ff_session_user_id'
 */
const SESSION_USER_KEY = 'ff_session_user_id';
const LEGACY_KEYS = ['ff_current_user_id', 'ff_hybrid_current_user_id'];

function migrateSessionKeyIfNeeded(): void {
  if (typeof window === 'undefined') return;
  if (localStorage.getItem(SESSION_USER_KEY)) return;
  for (const oldKey of LEGACY_KEYS) {
    const val = localStorage.getItem(oldKey);
    if (val !== null) {
      localStorage.setItem(SESSION_USER_KEY, val);
      localStorage.removeItem(oldKey);
      return;
    }
  }
}

function setCurrentUserId(userId: string | null) {
  if (typeof window === 'undefined') return;
  if (userId) {
    localStorage.setItem(SESSION_USER_KEY, userId);
    for (const oldKey of LEGACY_KEYS) {
      localStorage.removeItem(oldKey);
    }
  } else {
    localStorage.removeItem(SESSION_USER_KEY);
    for (const oldKey of LEGACY_KEYS) {
      localStorage.removeItem(oldKey);
    }
  }
}

function getCurrentUserId(): string | null {
  if (typeof window === 'undefined') return null;
  migrateSessionKeyIfNeeded();
  return localStorage.getItem(SESSION_USER_KEY);
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
  return userFromDbRow(data);
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
  return userFromDbRow(data);
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
  return userFromDbRow(data);
}

// ===== 场馆操作 =====

export async function getVenues(): Promise<Venue[]> {
  const { data, error } = await supabase
    .from('venues')
    .select('*')
    .order('display_order');
  if (error) throw error;
  return mapFromDb(data || [], venueFromDbRow);
}

// ===== 教练操作 =====

export async function getCoaches(): Promise<CoachProfile[]> {
  const { data, error } = await supabase
    .from('coach_profiles')
    .select('*');
  if (error) throw error;
  return mapFromDb(data || [], coachProfileFromDbRow);
}

export async function getCoachSlots(coachId?: string): Promise<CoachSlot[]> {
  let query = supabase.from('coach_slots').select('*');
  if (coachId) {
    query = query.eq('coach_id', coachId);
  }
  const { data, error } = await query;
  if (error) throw error;
  return mapFromDb(data || [], coachSlotFromDbRow);
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
    .insert(coachSlotToDbInsert(slot))
    .select()
    .single();
  if (error) throw error;
  return coachSlotFromDbRow(data);
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
  return mapFromDb(data || [], appointmentFromDbRow);
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
  return appointmentFromDbRow(data);
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
  // 1. 读取预约，验证状态 + 获取 coachId
  const { data: appt, error: fetchErr } = await supabase
    .from('appointments')
    .select('id, status, coach_id')
    .eq('id', appointmentId)
    .single();
  if (fetchErr || !appt) throw new Error('预约不存在');
  if (appt.status !== 'approved') {
    throw new Error('只有已确认的预约才能标记完成');
  }

  // 2. 更新预约状态
  const { error: updateErr } = await supabase
    .from('appointments')
    .update({ status: 'completed', updated_at: new Date().toISOString() })
    .eq('id', appointmentId);
  if (updateErr) throw updateErr;

  // 3. 同步增加教练 totalSessions（非原子，留待 Phase 2 用 RPC 包裹）
  // 读取当前值再 +1，避免重复完成导致多加
  const { data: coach } = await supabase
    .from('coach_profiles')
    .select('total_sessions')
    .eq('id', appt.coach_id)
    .single();
  if (coach) {
    const { error: coachErr } = await supabase
      .from('coach_profiles')
      .update({ total_sessions: (coach.total_sessions ?? 0) + 1 })
      .eq('id', appt.coach_id);
    if (coachErr) throw coachErr;
  }
}

// ===== 通知操作 =====

export async function getNotifications(userId: string): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return mapFromDb(data || [], notificationFromDbRow);
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
  return mapFromDb(data || [], trainingRecordFromDbRow);
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
  return trainingRecordFromDbRow(data);
}

// ===== 公告操作 =====

export async function getAnnouncements(): Promise<Announcement[]> {
  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .eq('status', 'published')
    .order('published_at', { ascending: false });
  if (error) throw error;
  return mapFromDb(data || [], announcementFromDbRow);
}

export async function createAnnouncement(
  announcement: Omit<Announcement, 'id' | 'publishedAt'>
): Promise<void> {
  const { error } = await supabase
    .from('announcements')
    .insert(announcementToDbInsert({ ...announcement, publishedAt: new Date().toISOString() }));
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

/**
 * 通过教练申请 — 同时更新 certStatus + profiles.role
 * 非原子操作（两张表），留待 Phase 2 用 RPC 包裹
 */
export async function approveCoach(coachId: string, reviewedBy: string): Promise<void> {
  // 1. 读取教练资料，验证当前状态 + 获取 userId
  const { data: coach, error: fetchErr } = await supabase
    .from('coach_profiles')
    .select('id, cert_status, user_id')
    .eq('id', coachId)
    .single();
  if (fetchErr || !coach) throw new Error('教练资料不存在');
  if (coach.cert_status !== 'pending') {
    throw new Error('该教练申请已处理');
  }

  // 2. 更新教练资料
  const { error: coachErr } = await supabase
    .from('coach_profiles')
    .update({
      cert_status: 'approved',
      cert_reviewed_at: new Date().toISOString(),
      reviewed_by: reviewedBy,
    })
    .eq('id', coachId);
  if (coachErr) throw coachErr;

  // 3. 同步更新用户角色为 coach
  if (coach.user_id) {
    const { error: roleErr } = await supabase
      .from('profiles')
      .update({ role: 'coach' })
      .eq('id', coach.user_id);
    if (roleErr) throw roleErr;
  }
}

export async function rejectCoach(coachId: string, reason: string, reviewedBy: string): Promise<void> {
  // 1. 验证当前状态
  const { data: coach, error: fetchErr } = await supabase
    .from('coach_profiles')
    .select('id, cert_status')
    .eq('id', coachId)
    .single();
  if (fetchErr || !coach) throw new Error('教练资料不存在');
  if (coach.cert_status !== 'pending') {
    throw new Error('该教练申请已处理');
  }

  const { error } = await supabase
    .from('coach_profiles')
    .update({
      cert_status: 'rejected',
      cert_review_note: reason,
      cert_reviewed_at: new Date().toISOString(),
      reviewed_by: reviewedBy,
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
  return mapFromDb(data || [], userFromDbRow);
}

// ===== 教练资料更新（Phase 1B） =====

/**
 * 更新教练资料 — 白名单过滤，只允许更新可编辑字段
 * 禁止通过此方法修改 id、userId、certStatus、reviewedBy、certReviewedAt 等管理字段
 * 白名单由 db-mappers.coachProfileToSafeDbUpdate 强制执行
 */
export async function updateCoachProfile(coachId: string, patch: Partial<CoachProfile>): Promise<void> {
  const dbPatch = coachProfileToSafeDbUpdate(patch);
  if (Object.keys(dbPatch).length === 0) return;
  const { error } = await supabase
    .from('coach_profiles')
    .update(dbPatch)
    .eq('id', coachId);
  if (error) throw error;
}

/**
 * 学员申请教练 — 防止重复申请
 * 不修改 profiles.role（由 adminApproveCoach 负责角色升级）
 */
export async function applyCoach(
  draft: Omit<CoachProfile, 'id' | 'createdAt' | 'totalSessions' | 'totalStudents' | 'certStatus' | 'certAppliedAt'>,
): Promise<CoachProfile> {
  const userId = getCurrentUserId();
  if (!userId) throw new Error('请先登录');

  // 防止重复申请：检查是否已有 pending 或 approved 的教练资料
  const { data: existing } = await supabase
    .from('coach_profiles')
    .select('id, cert_status')
    .eq('user_id', userId)
    .in('cert_status', ['pending', 'approved'])
    .maybeSingle();
  if (existing) throw new Error('您已有待审核或已通过的教练申请');

  // 读取用户信息填充 name/department/grade
  const { data: user, error: userErr } = await supabase
    .from('profiles')
    .select('id, name, department, grade')
    .eq('id', userId)
    .single();
  if (userErr || !user) throw new Error('用户不存在');

  const newProfile = {
    user_id: userId,
    name: user.name,
    department: user.department,
    grade: user.grade,
    specialties: draft.specialties,
    style_desc: draft.styleDesc,
    is_beginner_friendly: draft.isBeginnerFriendly ?? false,
    is_female_friendly: draft.isFemaleFriendly ?? false,
    total_sessions: 0,
    total_students: 0,
    cert_status: 'pending' as const,
    cert_applied_at: new Date().toISOString(),
    venues: draft.venues ?? [],
    created_at: new Date().toISOString(),
    training_philosophy: draft.trainingPhilosophy,
  };

  const { data, error } = await supabase
    .from('coach_profiles')
    .insert(newProfile)
    .select()
    .single();
  if (error) throw error;
  return coachProfileFromDbRow(data);
}

/**
 * 获取单个教练资料（用于 completeAppointment 时读取 totalSessions）
 */
export async function getCoachById(coachId: string): Promise<CoachProfile | null> {
  const { data, error } = await supabase
    .from('coach_profiles')
    .select('*')
    .eq('id', coachId)
    .single();
  if (error || !data) return null;
  return coachProfileFromDbRow(data);
}

// ===== 通知批量操作（Phase 1B） =====

/**
 * 标记当前用户所有通知为已读
 */
export async function markAllNotificationsRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false);
  if (error) throw error;
}

/**
 * 删除指定通知 — 带归属校验，只能删除自己的通知
 */
export async function deleteNotification(notificationId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId)
    .eq('user_id', userId);
  if (error) throw error;
}

// ===== 用户角色更新（Phase 1B — adminApproveCoach 需要） =====

/**
 * 更新用户角色 — 仅供管理员审核教练通过时调用
 */
export async function updateUserRole(userId: string, role: User['role']): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update(userToDbUpdate({ role }))
    .eq('id', userId);
  if (error) throw error;
}
