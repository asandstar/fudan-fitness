'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  BAN_DURATION_DAYS,
  BAN_VIOLATION_COUNT,
  COACH_REVIEW_HOURS,
} from '@/lib/constants';
import type {
  Announcement,
  Appointment,
  BookingDraft,
  CoachProfile,
  CoachSlot,
  Notification,
  TrainingRecord,
  TrainingStats,
  User,
  Venue,
  ViolationRecord,
} from '@/lib/types';
import {
  canCancelFree,
  checkBanStatus,
  computeBanUntil,
  genId,
  isPendingExpired,
} from '@/lib/utils';
import {
  getVenues,
  getCoaches,
  getSlots,
  getAppointments,
  getAnnouncements,
  getNotifications,
  getTrainingRecords,
  login,
  logout,
  getCurrentUser,
  register as apiRegister,
  createBooking as apiCreateBooking,
  cancelBooking as apiCancelBooking,
  approveAppointment as apiApproveAppointment,
  rejectAppointment as apiRejectAppointment,
  completeAppointment as apiCompleteAppointment,
  updateCoachProfile as apiUpdateCoachProfile,
  applyCoach as apiApplyCoach,
  approveCoach as apiApproveCoach,
  rejectCoach as apiRejectCoach,
  deleteAnnouncement as apiDeleteAnnouncement,
  unbanUser as apiUnbanUser,
  markAllNotificationsRead as apiMarkAllNotificationsRead,
  deleteNotification as apiDeleteNotification,
  addSlot as apiAddSlot,
  toggleSlot as apiToggleSlot,
  createAnnouncement as apiCreateAnnouncement,
  addNotification as apiAddNotification,
  markNotificationRead as apiMarkNotificationRead,
  addTrainingRecord as apiAddTrainingRecord,
  toggleFavoriteCoach as apiToggleFavoriteCoach,
} from '@/lib/hybrid-store';

/** 错误归一化 — 将 unknown 转为可读字符串 */
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return '操作失败，请稍后重试';
}

interface AppContextValue {
  users: User[];
  venues: Venue[];
  coaches: CoachProfile[];
  slots: CoachSlot[];
  appointments: Appointment[];
  announcements: Announcement[];
  violations: ViolationRecord[];
  notifications: Notification[];
  trainingRecords: TrainingRecord[];

  currentUser: User | null;
  currentCoach: CoachProfile | null;
  isLoading: boolean;
  initError: string | null;
  login: (studentId: string, password: string) => Promise<User | null>;
  register: (params: { studentId: string; password: string; name: string; department: string; grade: string }) => Promise<User>;
  logout: () => Promise<void>;

  createBooking: (draft: BookingDraft) => Promise<{ ok: boolean; error?: string; appointment?: Appointment }>;
  cancelBooking: (appointmentId: string) => Promise<{ ok: boolean; isViolation?: boolean; error?: string }>;

  coachApproveAppointment: (appointmentId: string) => Promise<void>;
  coachRejectAppointment: (appointmentId: string, reason: string) => Promise<void>;
  coachCompleteAppointment: (appointmentId: string) => Promise<void>;
  coachToggleSlot: (slotId: string) => Promise<void>;
  coachAddSlot: (slot: Omit<CoachSlot, 'id'>) => Promise<void>;
  coachUpdateProfile: (patch: Partial<CoachProfile>) => Promise<void>;

  applyCoach: (draft: Partial<CoachProfile> & { specialties: string[]; styleDesc: string }) => Promise<void>;

  adminApproveCoach: (coachId: string) => Promise<void>;
  adminRejectCoach: (coachId: string, reason: string) => Promise<void>;
  adminPublishAnnouncement: (a: Omit<Announcement, 'id' | 'publishedAt'>) => Promise<void>;
  adminDeleteAnnouncement: (id: string) => Promise<void>;
  adminUnbanUser: (userId: string) => Promise<void>;

  addNotification: (notification: Omit<Notification, 'id' | 'read' | 'createdAt'>) => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  getUnreadCount: () => number;

  addTrainingRecord: (record: Omit<TrainingRecord, 'id' | 'createdAt'>) => Promise<void>;
  getTrainingStats: (userId: string) => TrainingStats;

  toggleFavoriteCoach: (coachId: string) => Promise<void>;
  isCoachFavorited: (coachId: string) => boolean;

  sweepExpired: () => Promise<void>;
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<User[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [coaches, setCoaches] = useState<CoachProfile[]>([]);
  const [slots, setSlots] = useState<CoachSlot[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [violations, setViolations] = useState<ViolationRecord[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [trainingRecords, setTrainingRecords] = useState<TrainingRecord[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  const loadPublicData = useCallback(async () => {
    const [vs, cs, ss, aps, ans] = await Promise.all([
      getVenues(),
      getCoaches(),
      getSlots(),
      getAppointments(),
      getAnnouncements(),
    ]);
    setVenues(vs);
    setCoaches(cs);
    setSlots(ss);
    setAppointments(aps);
    setAnnouncements(ans);
  }, []);

  const loadUserData = useCallback(async (user: User) => {
    const [notifs, records] = await Promise.all([
      getNotifications(user.id),
      getTrainingRecords(user.id),
    ]);
    setNotifications(notifs);
    setTrainingRecords(records);
  }, []);

  const refreshData = useCallback(async () => {
    try {
      await loadPublicData();
      if (currentUser) {
        await loadUserData(currentUser);
      }
    } catch (err) {
      console.warn('refreshData failed', err);
    }
  }, [currentUser, loadPublicData, loadUserData]);

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      try {
        await loadPublicData();
        const user = await getCurrentUser();
        if (!cancelled) {
          setCurrentUser(user);
          if (user) {
            await loadUserData(user);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setInitError(err instanceof Error ? err.message : '初始化失败');
          console.error('App init failed', err);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };
    init();
    return () => {
      cancelled = true;
    };
  }, [loadPublicData, loadUserData]);

  const currentCoach = useMemo(
    () => (currentUser?.role === 'coach' ? coaches.find((c) => c.userId === currentUser.id) ?? null : null),
    [coaches, currentUser],
  );

  const loginHandler = useCallback(async (studentId: string, password: string): Promise<User | null> => {
    const user = await login(studentId, password);
    if (user) {
      setCurrentUser(user);
      await loadUserData(user);
    }
    return user;
  }, [loadUserData]);

  const registerHandler = useCallback(async (params: {
    studentId: string;
    password: string;
    name: string;
    department: string;
    grade: string;
  }): Promise<User> => {
    const user = await apiRegister(params);
    setCurrentUser(user);
    await loadUserData(user);
    return user;
  }, [loadUserData]);

  const logoutHandler = useCallback(async () => {
    await logout();
    setCurrentUser(null);
    setNotifications([]);
    setTrainingRecords([]);
    setViolations([]);
  }, []);

  const addNotification = useCallback(async (notification: Omit<Notification, 'id' | 'read' | 'createdAt'>) => {
    await apiAddNotification(notification);
    if (currentUser && notification.userId === currentUser.id) {
      setNotifications((prev) => [{ ...notification, id: genId('n'), read: false, createdAt: new Date().toISOString() }, ...prev]);
    }
  }, [currentUser]);

  const markNotificationRead = useCallback(async (id: string) => {
    await apiMarkNotificationRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const markAllNotificationsRead = useCallback(async () => {
    if (!currentUser) throw new Error('请先登录');
    await apiMarkAllNotificationsRead(currentUser.id);
    setNotifications((prev) => prev.map((n) => (n.userId === currentUser.id ? { ...n, read: true } : n)));
  }, [currentUser]);

  const deleteNotification = useCallback(async (id: string) => {
    if (!currentUser) throw new Error('请先登录');
    await apiDeleteNotification(id, currentUser.id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, [currentUser]);

  const getUnreadCount = useCallback(() => {
    if (!currentUser) return 0;
    return notifications.filter((n) => n.userId === currentUser.id && !n.read).length;
  }, [notifications, currentUser]);

  const sweepExpired = useCallback(async () => {
    setAppointments((prev) =>
      prev.map((a) => {
        if (a.status === 'pending' && isPendingExpired(a.createdAt, COACH_REVIEW_HOURS)) {
          return {
            ...a,
            status: 'expired' as const,
            cancelReason: '教练 12 小时内未审核,系统自动取消',
            cancelledBy: 'system' as const,
            cancelledAt: new Date().toISOString(),
          };
        }
        return a;
      }),
    );
  }, []);

  const createBooking = useCallback(async (draft: BookingDraft): Promise<{ ok: boolean; error?: string; appointment?: Appointment }> => {
    if (!currentUser) return { ok: false, error: '请先登录' };

    const ban = checkBanStatus(currentUser);
    if (ban.banned) {
      return { ok: false, error: `您已被禁约,剩余 ${ban.remainingDays} 天解除` };
    }

    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setHours(0, 0, 0, 0);
    const day = weekStart.getDay();
    weekStart.setDate(weekStart.getDate() - (day === 0 ? 6 : day - 1));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const weekCount = appointments.filter((a) => {
      if (a.studentId !== currentUser.id) return false;
      if (!['pending', 'approved', 'completed'].includes(a.status)) return false;
      const d = new Date(`${a.date}T00:00:00`);
      return d >= weekStart && d <= weekEnd;
    }).length;

    if (weekCount >= 3) {
      return { ok: false, error: '本周已预约 3 次,已达上限' };
    }

    const conflict = appointments.some(
      (a) =>
        a.coachId === draft.coachId &&
        a.venueId === draft.venueId &&
        a.date === draft.date &&
        a.startTime === draft.startTime &&
        ['pending', 'approved'].includes(a.status),
    );
    if (conflict) {
      return { ok: false, error: '该教练此时段已被预约,请选择其他时段' };
    }

    try {
      const appointment = await apiCreateBooking({ ...draft, studentId: currentUser.id });
      setAppointments((prev) => [...prev, appointment]);

      const coach = coaches.find((c) => c.id === draft.coachId);
      if (coach) {
        await addNotification({
          userId: coach.userId,
          type: 'booking_approved',
          title: '新的预约请求',
          content: `${currentUser.name} 预约了您的带练时段: ${draft.date} ${draft.startTime}-${draft.endTime}`,
          relatedId: appointment.id,
        });
      }

      await addNotification({
        userId: currentUser.id,
        type: 'booking_approved',
        title: '预约提交成功',
        content: `您已预约 ${coach?.name || ''} 的带练时段: ${draft.date} ${draft.startTime}-${draft.endTime}, 等待教练审核`,
        relatedId: appointment.id,
      });

      return { ok: true, appointment };
    } catch (err) {
      return { ok: false, error: (err as Error).message };
    }
  }, [currentUser, appointments, coaches, addNotification]);

  const cancelBooking = useCallback(async (appointmentId: string): Promise<{ ok: boolean; isViolation?: boolean; error?: string }> => {
    if (!currentUser) return { ok: false, error: '请先登录' };
    const appt = appointments.find((a) => a.id === appointmentId);
    if (!appt) return { ok: false, error: '预约不存在' };
    if (appt.studentId !== currentUser.id) return { ok: false, error: '无权操作' };
    if (!['pending', 'approved'].includes(appt.status)) return { ok: false, error: '该预约已不可取消' };

    const free = canCancelFree(appt.date, appt.startTime);

    try {
      await apiCancelBooking(appointmentId, free ? '学员主动取消(>24h)' : '学员开课前 24h 内取消(记违约)');
      setAppointments((prev) =>
        prev.map((a) =>
          a.id === appointmentId
            ? {
                ...a,
                status: 'cancelled' as const,
                cancelledAt: new Date().toISOString(),
                cancelledBy: 'student' as const,
                cancelReason: free ? '学员主动取消(>24h)' : '学员开课前 24h 内取消(记违约)',
              }
            : a,
        ),
      );

      if (!free) {
        const vr: ViolationRecord = {
          id: genId('vr'),
          userId: currentUser.id,
          appointmentId,
          violationType: 'late_cancel',
          description: `${appt.date} ${appt.startTime} 预约在开课前 24 小时内取消`,
          createdAt: new Date().toISOString(),
        };
        setViolations((prev) => [...prev, vr]);

        setUsers((prev) =>
          prev.map((u) => {
            if (u.id !== currentUser.id) return u;
            const newCount = u.violationCount + 1;
            const shouldBanUser = newCount >= BAN_VIOLATION_COUNT;
            return {
              ...u,
              violationCount: newCount,
              bannedUntil: shouldBanUser ? computeBanUntil(BAN_DURATION_DAYS) : u.bannedUntil,
            };
          }),
        );
        return { ok: true, isViolation: true };
      }

      return { ok: true, isViolation: false };
    } catch (err) {
      return { ok: false, error: (err as Error).message };
    }
  }, [currentUser, appointments]);

  const coachApproveAppointment = useCallback(async (appointmentId: string) => {
    // 1. 在 state 中查找目标预约，验证当前状态
    const appt = appointments.find((a) => a.id === appointmentId);
    if (!appt) throw new Error('预约不存在');
    if (appt.status !== 'pending') throw new Error('该预约当前状态不可审核');

    // 2. 调用数据层持久化
    await apiApproveAppointment(appointmentId);

    // 3. 更新 state（纯函数 updater，无副作用）
    const now = new Date().toISOString();
    setAppointments((prev) =>
      prev.map((a) => (a.id === appointmentId ? { ...a, status: 'approved' as const, updatedAt: now } : a)),
    );

    // 4. 在 updater 之外发送通知（Strict Mode 安全）
    try {
      await addNotification({
        userId: appt.studentId,
        type: 'booking_approved',
        title: '预约已确认',
        content: `您的预约已被教练确认: ${appt.date} ${appt.startTime}-${appt.endTime}`,
        relatedId: appt.id,
      });
    } catch (notifErr) {
      // 通知发送失败不阻断主流程，仅记录日志
      console.warn('发送预约确认通知失败', getErrorMessage(notifErr));
    }
  }, [appointments, addNotification]);

  const coachRejectAppointment = useCallback(async (appointmentId: string, reason: string) => {
    const appt = appointments.find((a) => a.id === appointmentId);
    if (!appt) throw new Error('预约不存在');
    if (appt.status !== 'pending') throw new Error('该预约当前状态不可审核');

    await apiRejectAppointment(appointmentId, reason);

    const now = new Date().toISOString();
    setAppointments((prev) =>
      prev.map((a) =>
        a.id === appointmentId
          ? { ...a, status: 'rejected' as const, cancelReason: reason, updatedAt: now }
          : a,
      ),
    );

    try {
      await addNotification({
        userId: appt.studentId,
        type: 'booking_rejected',
        title: '预约被拒绝',
        content: `您的预约被教练拒绝: ${reason}`,
        relatedId: appt.id,
      });
    } catch (notifErr) {
      console.warn('发送预约拒绝通知失败', getErrorMessage(notifErr));
    }
  }, [appointments, addNotification]);

  const coachCompleteAppointment = useCallback(async (appointmentId: string) => {
    // 1. 在 state 中查找目标预约，验证当前状态
    const appt = appointments.find((a) => a.id === appointmentId);
    if (!appt) throw new Error('预约不存在');
    if (appt.status !== 'approved') throw new Error('只有已确认的预约才能标记完成');

    // 2. 调用数据层持久化（含教练 totalSessions 增加，数据层负责防重复）
    await apiCompleteAppointment(appointmentId);

    // 3. 更新 appointment state（纯函数 updater）
    const now = new Date().toISOString();
    setAppointments((prev) =>
      prev.map((a) => (a.id === appointmentId ? { ...a, status: 'completed' as const, updatedAt: now } : a)),
    );

    // 4. 更新教练 totalSessions（同步 state 与数据层一致）
    setCoaches((prev) =>
      prev.map((c) => (c.id === appt.coachId ? { ...c, totalSessions: c.totalSessions + 1 } : c)),
    );

    // 5. 在 updater 之外发送通知
    try {
      await addNotification({
        userId: appt.studentId,
        type: 'booking_completed',
        title: '训练已完成',
        content: `您与教练的带练已完成: ${appt.date} ${appt.startTime}-${appt.endTime}, 记得打卡记录训练成果哦!`,
        relatedId: appt.id,
      });
    } catch (notifErr) {
      console.warn('发送训练完成通知失败', getErrorMessage(notifErr));
    }
  }, [appointments, addNotification]);

  const coachToggleSlot = useCallback(async (slotId: string) => {
    await apiToggleSlot(slotId);
    setSlots((prev) => prev.map((s) => (s.id === slotId ? { ...s, isAvailable: !s.isAvailable } : s)));
  }, []);

  const coachAddSlot = useCallback(async (slot: Omit<CoachSlot, 'id'>) => {
    const newSlot = await apiAddSlot(slot);
    setSlots((prev) => [...prev, newSlot]);
  }, []);

  const coachUpdateProfile = useCallback(async (patch: Partial<CoachProfile>) => {
    if (!currentCoach) throw new Error('当前用户不是教练');
    // 数据层负责白名单过滤管理字段
    await apiUpdateCoachProfile(currentCoach.id, patch);
    setCoaches((prev) => prev.map((c) => (c.id === currentCoach.id ? { ...c, ...patch } : c)));
  }, [currentCoach]);

  const applyCoach = useCallback(async (draft: Partial<CoachProfile> & { specialties: string[]; styleDesc: string }) => {
    if (!currentUser) throw new Error('请先登录');

    // 数据层负责防止重复申请 + 填充用户信息 + 持久化
    const newCoach = await apiApplyCoach({
      userId: currentUser.id,
      name: currentUser.name,
      department: currentUser.department,
      grade: currentUser.grade,
      specialties: draft.specialties,
      styleDesc: draft.styleDesc,
      isBeginnerFriendly: draft.isBeginnerFriendly ?? false,
      isFemaleFriendly: draft.isFemaleFriendly ?? false,
      venues: draft.venues ?? [],
      trainingPhilosophy: draft.trainingPhilosophy,
      rating: draft.rating,
      successCases: draft.successCases,
    });
    setCoaches((prev) => [...prev, newCoach]);
  }, [currentUser]);

  const adminApproveCoach = useCallback(async (coachId: string) => {
    // 客户端权限校验（后端权限留待 Phase 2 RLS）
    if (!currentUser || currentUser.role !== 'admin') {
      throw new Error('无权限执行此操作');
    }

    const coach = coaches.find((c) => c.id === coachId);
    if (!coach) throw new Error('教练资料不存在');
    if (coach.certStatus !== 'pending') throw new Error('该教练申请已处理');

    // 数据层负责同时更新 certStatus + profiles.role
    await apiApproveCoach(coachId, currentUser.id);

    const now = new Date().toISOString();
    setCoaches((prev) =>
      prev.map((c) =>
        c.id === coachId
          ? { ...c, certStatus: 'approved' as const, certReviewedAt: now, reviewedBy: currentUser.id }
          : c,
      ),
    );
    setUsers((prev) =>
      prev.map((u) => (u.id === coach.userId ? { ...u, role: 'coach' as const } : u)),
    );

    try {
      await addNotification({
        userId: coach.userId,
        type: 'coach_approved',
        title: '教练认证通过',
        content: '恭喜!您的教练认证申请已通过,现在可以开始接受预约了',
        relatedId: coach.id,
      });
    } catch (notifErr) {
      console.warn('发送教练认证通过通知失败', getErrorMessage(notifErr));
    }
  }, [currentUser, coaches, addNotification]);

  const adminRejectCoach = useCallback(async (coachId: string, reason: string) => {
    if (!currentUser || currentUser.role !== 'admin') {
      throw new Error('无权限执行此操作');
    }

    const coach = coaches.find((c) => c.id === coachId);
    if (!coach) throw new Error('教练资料不存在');
    if (coach.certStatus !== 'pending') throw new Error('该教练申请已处理');

    await apiRejectCoach(coachId, reason, currentUser.id);

    const now = new Date().toISOString();
    setCoaches((prev) =>
      prev.map((c) =>
        c.id === coachId
          ? {
              ...c,
              certStatus: 'rejected' as const,
              certReviewNote: reason,
              certReviewedAt: now,
              reviewedBy: currentUser.id,
            }
          : c,
      ),
    );

    try {
      await addNotification({
        userId: coach.userId,
        type: 'coach_rejected',
        title: '教练认证未通过',
        content: `您的教练认证申请未通过,原因: ${reason}`,
        relatedId: coach.id,
      });
    } catch (notifErr) {
      console.warn('发送教练认证拒绝通知失败', getErrorMessage(notifErr));
    }
  }, [currentUser, coaches, addNotification]);

  const adminPublishAnnouncement = useCallback(async (a: Omit<Announcement, 'id' | 'publishedAt'>) => {
    await apiCreateAnnouncement(a);
    setAnnouncements((prev) => [
      { ...a, id: genId('ann'), publishedAt: new Date().toISOString() },
      ...prev,
    ]);
  }, []);

  const adminDeleteAnnouncement = useCallback(async (id: string) => {
    await apiDeleteAnnouncement(id);
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const adminUnbanUser = useCallback(async (userId: string) => {
    if (!currentUser || currentUser.role !== 'admin') {
      throw new Error('无权限执行此操作');
    }
    await apiUnbanUser(userId);
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, bannedUntil: null, violationCount: 0 } : u)),
    );
  }, [currentUser]);

  const addTrainingRecord = useCallback(async (record: Omit<TrainingRecord, 'id' | 'createdAt'>) => {
    const newRecord = await apiAddTrainingRecord(record);
    setTrainingRecords((prev) => [newRecord, ...prev]);
  }, []);

  const getTrainingStats = useCallback((userId: string): TrainingStats => {
    const userRecords = trainingRecords.filter((r) => r.userId === userId);
    
    const totalWorkouts = userRecords.length;
    const totalDuration = userRecords.reduce((sum, r) => sum + r.duration, 0);
    const totalCalories = userRecords.reduce((sum, r) => sum + r.calories, 0);

    const dates = [...new Set(userRecords.map((r) => r.date))].sort();
    
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = dates.length - 1; i >= 0; i--) {
      const recordDate = new Date(dates[i]);
      recordDate.setHours(0, 0, 0, 0);
      
      const diffDays = Math.floor((today.getTime() - recordDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) {
        tempStreak++;
        currentStreak = tempStreak;
      } else if (diffDays === tempStreak) {
        tempStreak++;
        currentStreak = tempStreak;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 0;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    const dayNames = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    const weeklyData = dayNames.map((day, index) => {
      const dayCount = userRecords.filter((r) => {
        const d = new Date(r.date);
        const dayOfWeek = d.getDay();
        const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        return adjustedDay === index;
      }).length;
      return { day, count: dayCount };
    });

    return {
      totalWorkouts,
      totalDuration,
      totalCalories,
      currentStreak,
      longestStreak,
      weeklyData,
    };
  }, [trainingRecords]);

  const toggleFavoriteCoach = useCallback(async (coachId: string) => {
    if (!currentUser) return;
    await apiToggleFavoriteCoach(currentUser.id, coachId);
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id !== currentUser.id) return u;
        const favorites = u.favoriteCoaches || [];
        const newFavorites = favorites.includes(coachId)
          ? favorites.filter((id) => id !== coachId)
          : [...favorites, coachId];
        return { ...u, favoriteCoaches: newFavorites };
      }),
    );
    if (currentUser.id === currentUser.id) {
      setCurrentUser((prev) => {
        if (!prev) return prev;
        const favorites = prev.favoriteCoaches || [];
        const newFavorites = favorites.includes(coachId)
          ? favorites.filter((id) => id !== coachId)
          : [...favorites, coachId];
        return { ...prev, favoriteCoaches: newFavorites };
      });
    }
  }, [currentUser]);

  const isCoachFavorited = useCallback((coachId: string): boolean => {
    if (!currentUser) return false;
    return currentUser.favoriteCoaches?.includes(coachId) || false;
  }, [currentUser]);

  const value: AppContextValue = {
    users,
    venues,
    coaches,
    slots,
    appointments,
    announcements,
    violations,
    notifications,
    trainingRecords,
    currentUser,
    currentCoach,
    isLoading,
    initError,
    login: loginHandler,
    register: registerHandler,
    logout: logoutHandler,
    createBooking,
    cancelBooking,
    coachApproveAppointment,
    coachRejectAppointment,
    coachCompleteAppointment,
    coachToggleSlot,
    coachAddSlot,
    coachUpdateProfile,
    applyCoach,
    adminApproveCoach,
    adminRejectCoach,
    adminPublishAnnouncement,
    adminDeleteAnnouncement,
    adminUnbanUser,
    addNotification,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification,
    getUnreadCount,
    addTrainingRecord,
    getTrainingStats,
    toggleFavoriteCoach,
    isCoachFavorited,
    sweepExpired,
    refreshData,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-text-secondary">加载中...</p>
        </div>
      </div>
    );
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}