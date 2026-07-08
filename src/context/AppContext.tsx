'use client';

// 全局应用状态
// MVP:持有 mock 数据的可变副本,提供所有读写操作
// 二期迁移:将下列方法替换为 Supabase API 调用,组件层无需改动
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  mockAnnouncements,
  mockAppointments,
  mockCoaches,
  mockSlots,
  mockUsers,
  mockVenues,
  mockViolations,
} from '@/lib/mock-data';
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
  shouldBan,
} from '@/lib/utils';

interface AppContextValue {
  // 数据
  users: User[];
  venues: Venue[];
  coaches: CoachProfile[];
  slots: CoachSlot[];
  appointments: Appointment[];
  announcements: Announcement[];
  violations: ViolationRecord[];
  notifications: Notification[];
  trainingRecords: TrainingRecord[];

  // 当前用户
  currentUser: User | null;
  currentCoach: CoachProfile | null; // 当前用户对应的教练资料(若 role=coach)
  login: (studentId: string, password: string) => User | null;
  logout: () => void;

  // 预约操作
  createBooking: (draft: BookingDraft) => { ok: boolean; error?: string; appointment?: Appointment };
  cancelBooking: (appointmentId: string) => { ok: boolean; isViolation?: boolean; error?: string };

  // 教练操作
  coachApproveAppointment: (appointmentId: string) => void;
  coachRejectAppointment: (appointmentId: string, reason: string) => void;
  coachCompleteAppointment: (appointmentId: string) => void;
  coachToggleSlot: (slotId: string) => void;
  coachAddSlot: (slot: Omit<CoachSlot, 'id'>) => void;
  coachUpdateProfile: (patch: Partial<CoachProfile>) => void;

  // 教练申请
  applyCoach: (draft: Partial<CoachProfile> & { specialties: string[]; styleDesc: string }) => void;

  // 管理员操作
  adminApproveCoach: (coachId: string) => void;
  adminRejectCoach: (coachId: string, reason: string) => void;
  adminPublishAnnouncement: (a: Omit<Announcement, 'id' | 'publishedAt'>) => void;
  adminDeleteAnnouncement: (id: string) => void;
  adminUnbanUser: (userId: string) => void;

  // 通知操作
  addNotification: (notification: Omit<Notification, 'id' | 'read' | 'createdAt'>) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  deleteNotification: (id: string) => void;
  getUnreadCount: () => number;

  // 训练打卡
  addTrainingRecord: (record: Omit<TrainingRecord, 'id' | 'createdAt'>) => void;
  getTrainingStats: (userId: string) => TrainingStats;

  // 收藏教练
  toggleFavoriteCoach: (coachId: string) => void;
  isCoachFavorited: (coachId: string) => boolean;

  // 模拟 cron:进入页面时扫描过期 pending
  sweepExpired: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [venues] = useState<Venue[]>(mockVenues);
  const [coaches, setCoaches] = useState<CoachProfile[]>(mockCoaches);
  const [slots, setSlots] = useState<CoachSlot[]>(mockSlots);
  const [appointments, setAppointments] = useState<Appointment[]>(mockAppointments);
  const [announcements, setAnnouncements] = useState<Announcement[]>(mockAnnouncements);
  const [violations, setViolations] = useState<ViolationRecord[]>(mockViolations);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [trainingRecords, setTrainingRecords] = useState<TrainingRecord[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // 从 localStorage 恢复登录态
  useEffect(() => {
    try {
      const saved = localStorage.getItem('ff_current_user_id');
      if (saved && mockUsers.some((u) => u.id === saved)) {
        setCurrentUserId(saved);
      }
    } catch {
      // ignore
    }
  }, []);

  // 持久化登录态
  useEffect(() => {
    try {
      if (currentUserId) localStorage.setItem('ff_current_user_id', currentUserId);
      else localStorage.removeItem('ff_current_user_id');
    } catch {
      // ignore
    }
  }, [currentUserId]);

  // 模拟 cron:挂载时扫描超过 12h 未审核的 pending,标记为 expired
  const sweepExpired = useCallback(() => {
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

  useEffect(() => {
    sweepExpired();
  }, [sweepExpired]);

  // ===== 通知操作 =====
  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'read' | 'createdAt'>) => {
    const newNotification: Notification = {
      ...notification,
      id: genId('n'),
      read: false,
      createdAt: new Date().toISOString(),
    };
    setNotifications((prev) => [newNotification, ...prev]);
  }, []);

  const markNotificationRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const deleteNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const getUnreadCount = useCallback(() => {
    if (!currentUserId) return 0;
    return notifications.filter((n) => n.userId === currentUserId && !n.read).length;
  }, [notifications, currentUserId]);

  const currentUser = useMemo(
    () => users.find((u) => u.id === currentUserId) ?? null,
    [users, currentUserId],
  );

  const currentCoach = useMemo(
    () => (currentUser?.role === 'coach' ? coaches.find((c) => c.userId === currentUser.id) ?? null : null),
    [coaches, currentUser],
  );

  // ===== 登录 =====
  const login = useCallback((studentId: string, password: string): User | null => {
    const u = users.find((x) => x.studentId === studentId && x.password === password);
    if (u) setCurrentUserId(u.id);
    return u ?? null;
  }, [users]);

  const logout = useCallback(() => setCurrentUserId(null), []);

  // ===== 创建预约(含三重校验) =====
  const createBooking = useCallback((draft: BookingDraft): { ok: boolean; error?: string; appointment?: Appointment } => {
    if (!currentUser) return { ok: false, error: '请先登录' };

    const ban = checkBanStatus(currentUser);
    if (ban.banned) {
      return { ok: false, error: `您已被禁约,剩余 ${ban.remainingDays} 天解除` };
    }

    // 本周额度
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

    // 时段冲突
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

    const appointment: Appointment = {
      id: genId('a'),
      studentId: currentUser.id,
      coachId: draft.coachId,
      venueId: draft.venueId,
      date: draft.date,
      startTime: draft.startTime,
      endTime: draft.endTime,
      status: 'pending',
      trainingNote: draft.trainingNote,
      createdAt: new Date().toISOString(),
    };
    setAppointments((prev) => [...prev, appointment]);

    // 发送通知给教练
    const coach = coaches.find((c) => c.id === draft.coachId);
    if (coach) {
      addNotification({
        userId: coach.userId,
        type: 'booking_approved',
        title: '新的预约请求',
        content: `${currentUser.name} 预约了您的带练时段: ${draft.date} ${draft.startTime}-${draft.endTime}`,
        relatedId: appointment.id,
      });
    }

    // 发送通知给学员
    addNotification({
      userId: currentUser.id,
      type: 'booking_approved',
      title: '预约提交成功',
      content: `您已预约 ${coach?.name || ''} 的带练时段: ${draft.date} ${draft.startTime}-${draft.endTime}, 等待教练审核`,
      relatedId: appointment.id,
    });

    return { ok: true, appointment };
  }, [currentUser, appointments, coaches, addNotification]);

  // ===== 取消预约(含 24h 违约判定) =====
  const cancelBooking = useCallback((appointmentId: string): { ok: boolean; isViolation?: boolean; error?: string } => {
    if (!currentUser) return { ok: false, error: '请先登录' };
    const appt = appointments.find((a) => a.id === appointmentId);
    if (!appt) return { ok: false, error: '预约不存在' };
    if (appt.studentId !== currentUser.id) return { ok: false, error: '无权操作' };
    if (!['pending', 'approved'].includes(appt.status)) return { ok: false, error: '该预约已不可取消' };

    const free = canCancelFree(appt.date, appt.startTime);
    const nowIso = new Date().toISOString();

    setAppointments((prev) =>
      prev.map((a) =>
        a.id === appointmentId
          ? {
              ...a,
              status: 'cancelled' as const,
              cancelledAt: nowIso,
              cancelledBy: 'student' as const,
              cancelReason: free ? '学员主动取消(>24h)' : '学员开课前 24h 内取消(记违约)',
            }
          : a,
      ),
    );

    if (!free) {
      // 记违约
      const vr: ViolationRecord = {
        id: genId('vr'),
        userId: currentUser.id,
        appointmentId,
        violationType: 'late_cancel',
        description: `${appt.date} ${appt.startTime} 预约在开课前 24 小时内取消`,
        createdAt: nowIso,
      };
      setViolations((prev) => [...prev, vr]);

      // 更新用户违约次数,触发禁约
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
  }, [currentUser, appointments]);

  // ===== 教练审核预约 =====
  const coachApproveAppointment = useCallback((appointmentId: string) => {
    setAppointments((prev) =>
      prev.map((a) => {
        if (a.id === appointmentId && a.status === 'pending') {
          const updated = { ...a, status: 'approved' as const, updatedAt: new Date().toISOString() };
          addNotification({
            userId: a.studentId,
            type: 'booking_approved',
            title: '预约已确认',
            content: `您的预约已被教练确认: ${a.date} ${a.startTime}-${a.endTime}`,
            relatedId: a.id,
          });
          return updated;
        }
        return a;
      }),
    );
  }, [addNotification]);

  const coachRejectAppointment = useCallback((appointmentId: string, reason: string) => {
    setAppointments((prev) =>
      prev.map((a) => {
        if (a.id === appointmentId && a.status === 'pending') {
          const updated = { ...a, status: 'rejected' as const, cancelReason: reason, updatedAt: new Date().toISOString() };
          addNotification({
            userId: a.studentId,
            type: 'booking_rejected',
            title: '预约被拒绝',
            content: `您的预约被教练拒绝: ${reason}`,
            relatedId: a.id,
          });
          return updated;
        }
        return a;
      }),
    );
  }, [addNotification]);

  const coachCompleteAppointment = useCallback((appointmentId: string) => {
    setAppointments((prev) =>
      prev.map((a) => {
        if (a.id === appointmentId && a.status === 'approved') {
          const updated = { ...a, status: 'completed' as const, updatedAt: new Date().toISOString() };
          addNotification({
            userId: a.studentId,
            type: 'booking_completed',
            title: '训练已完成',
            content: `您与教练的带练已完成: ${a.date} ${a.startTime}-${a.endTime}, 记得打卡记录训练成果哦!`,
            relatedId: a.id,
          });
          return updated;
        }
        return a;
      }),
    );
    // 教练累计次数 +1
    setCoaches((prev) =>
      prev.map((c) => {
        const appt = appointments.find((a) => a.id === appointmentId);
        if (appt && c.id === appt.coachId) {
          return { ...c, totalSessions: c.totalSessions + 1 };
        }
        return c;
      }),
    );
  }, [appointments, addNotification]);

  // ===== 教练时段管理 =====
  const coachToggleSlot = useCallback((slotId: string) => {
    setSlots((prev) => prev.map((s) => (s.id === slotId ? { ...s, isAvailable: !s.isAvailable } : s)));
  }, []);

  const coachAddSlot = useCallback((slot: Omit<CoachSlot, 'id'>) => {
    setSlots((prev) => [...prev, { ...slot, id: genId('s') }]);
  }, []);

  const coachUpdateProfile = useCallback((patch: Partial<CoachProfile>) => {
    if (!currentCoach) return;
    setCoaches((prev) => prev.map((c) => (c.id === currentCoach.id ? { ...c, ...patch } : c)));
  }, [currentCoach]);

  // ===== 教练申请 =====
  const applyCoach = useCallback((draft: Partial<CoachProfile> & { specialties: string[]; styleDesc: string }) => {
    if (!currentUser) return;
    const newCoach: CoachProfile = {
      id: genId('c'),
      userId: currentUser.id,
      name: currentUser.name,
      department: currentUser.department,
      grade: currentUser.grade,
      specialties: draft.specialties,
      styleDesc: draft.styleDesc,
      isBeginnerFriendly: draft.isBeginnerFriendly ?? false,
      isFemaleFriendly: draft.isFemaleFriendly ?? false,
      totalSessions: 0,
      totalStudents: 0,
      certStatus: 'pending',
      certAppliedAt: new Date().toISOString(),
      venues: draft.venues ?? [],
      createdAt: new Date().toISOString(),
    };
    setCoaches((prev) => [...prev, newCoach]);
    // 用户角色不变(仍是 member),待管理员通过后切换为 coach
  }, [currentUser]);

  // ===== 管理员操作 =====
  const adminApproveCoach = useCallback((coachId: string) => {
    const coach = coaches.find((c) => c.id === coachId);
    setCoaches((prev) =>
      prev.map((c) => {
        if (c.id === coachId && c.certStatus === 'pending') {
          const updated = { ...c, certStatus: 'approved' as const, certReviewedAt: new Date().toISOString() };
          if (coach) {
            addNotification({
              userId: coach.userId,
              type: 'coach_approved',
              title: '教练认证通过',
              content: '恭喜!您的教练认证申请已通过,现在可以开始接受预约了',
              relatedId: coach.id,
            });
          }
          return updated;
        }
        return c;
      }),
    );
    // 同步用户角色 member → coach
    setUsers((prev) =>
      prev.map((u) => {
        if (coach && u.id === coach.userId) return { ...u, role: 'coach' as const };
        return u;
      }),
    );
  }, [coaches, addNotification]);

  const adminRejectCoach = useCallback((coachId: string, reason: string) => {
    const coach = coaches.find((c) => c.id === coachId);
    setCoaches((prev) =>
      prev.map((c) => {
        if (c.id === coachId && c.certStatus === 'pending') {
          const updated = { ...c, certStatus: 'rejected' as const, certReviewNote: reason, certReviewedAt: new Date().toISOString() };
          if (coach) {
            addNotification({
              userId: coach.userId,
              type: 'coach_rejected',
              title: '教练认证未通过',
              content: `您的教练认证申请未通过,原因: ${reason}`,
              relatedId: coach.id,
            });
          }
          return updated;
        }
        return c;
      }),
    );
  }, [coaches, addNotification]);

  const adminPublishAnnouncement = useCallback((a: Omit<Announcement, 'id' | 'publishedAt'>) => {
    setAnnouncements((prev) => [
      { ...a, id: genId('ann'), publishedAt: new Date().toISOString() },
      ...prev,
    ]);
  }, []);

  const adminDeleteAnnouncement = useCallback((id: string) => {
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const adminUnbanUser = useCallback((userId: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, bannedUntil: null, violationCount: 0 } : u)),
    );
  }, []);

  // ===== 训练打卡 =====
  const addTrainingRecord = useCallback((record: Omit<TrainingRecord, 'id' | 'createdAt'>) => {
    const newRecord: TrainingRecord = {
      ...record,
      id: genId('tr'),
      createdAt: new Date().toISOString(),
    };
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

  // ===== 收藏/取消收藏教练 =====
  const toggleFavoriteCoach = useCallback((coachId: string) => {
    if (!currentUser) return;
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
    login,
    logout,
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
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp 必须在 AppProvider 内使用');
  return ctx;
}

// shouldBan 导出供组件使用
export { shouldBan };
