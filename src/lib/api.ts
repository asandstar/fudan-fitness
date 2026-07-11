// 数据访问层 — 封装所有 Supabase CRUD 操作
import { supabase, isSupabaseConfigured } from './supabase';
import type { 
  User, CoachProfile, Venue, Appointment, CoachSlot, 
  Announcement, Notification, TrainingRecord, BookingDraft 
} from './types';

// ===== 认证操作 =====

export async function signIn(email: string, password: string) {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase not configured');
  }
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

export async function signUp(
  email: string, 
  password: string, 
  profile: { studentId: string; name: string; department: string; grade: string }
) {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase not configured');
  }
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        student_id: profile.studentId,
        name: profile.name,
        department: profile.department,
        grade: profile.grade,
      },
    },
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  
  // 获取 profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  
  return profile as User | null;
}

// ===== 场馆操作 =====

export async function getVenues(): Promise<Venue[]> {
  const { data, error } = await supabase
    .from('venues')
    .select('*')
    .order('display_order');
  if (error) throw error;
  return data || [];
}

// ===== 教练操作 =====

export async function getCoaches(): Promise<CoachProfile[]> {
  const { data, error } = await supabase
    .from('coach_profiles')
    .select(`
      *,
      profiles:user_id (name, department, grade)
    `);
  if (error) throw error;
  return data || [];
}

export async function getCoachSlots(coachId: string): Promise<CoachSlot[]> {
  const { data, error } = await supabase
    .from('coach_slots')
    .select('*')
    .eq('coach_id', coachId);
  if (error) throw error;
  return data || [];
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
  return data;
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
  return data || [];
}

export async function createAppointment(draft: BookingDraft): Promise<Appointment> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('appointments')
    .insert({
      student_id: user.id,
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
  return data;
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
  return data || [];
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
      ...notification,
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
  return data || [];
}

export async function addTrainingRecord(
  record: Omit<TrainingRecord, 'id' | 'createdAt'>
): Promise<TrainingRecord> {
  const { data, error } = await supabase
    .from('training_records')
    .insert(record)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ===== 公告操作 =====

export async function getAnnouncements(): Promise<Announcement[]> {
  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .eq('status', 'published')
    .order('published_at', { ascending: false });
  if (error) throw error;
  return data || [];
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

export async function toggleFavoriteCoach(coachId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // 获取当前收藏列表
  const { data: profile } = await supabase
    .from('profiles')
    .select('favorite_coaches')
    .eq('id', user.id)
    .single();

  const favorites: string[] = profile?.favorite_coaches || [];
  const newFavorites = favorites.includes(coachId)
    ? favorites.filter(id => id !== coachId)
    : [...favorites, coachId];

  const { error } = await supabase
    .from('profiles')
    .update({ favorite_coaches: newFavorites })
    .eq('id', user.id);
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