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
  register as apiRegister,
  createBooking as apiCreateBooking,
  cancelBooking as apiCancelBooking,
  approveAppointment as apiApproveAppointment,
  rejectAppointment as apiRejectAppointment,
  addSlot as apiAddSlot,
  toggleSlot as apiToggleSlot,
  createAnnouncement as apiCreateAnnouncement,
  addNotification as apiAddNotification,
  markNotificationRead as apiMarkNotificationRead,
  addTrainingRecord as apiAddTrainingRecord,
  toggleFavoriteCoach as apiToggleFavoriteCoach,
} from '@/lib/hybrid-store';

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
  coachUpdateProfile: (patch: Partial<CoachProfile>) => void;

  applyCoach: (draft: Partial<CoachProfile> & { specialties: string[]; styleDesc: string }) => void;

  adminApproveCoach: (coachId: string) => void;
  adminRejectCoach: (coachId: string, reason: string) => void;
  adminPublishAnnouncement: (a: Omit<Announcement, 'id' | 'publishedAt'>) => Promise<void>;
  adminDeleteAnnouncement: (id: string) => void;
  adminUnbanUser: (userId: string) => void;

  addNotification: (notification: Omit<Notification, 'id' | 'read' | 'createdAt'>) => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  deleteNotification: (id: string) => void;
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

  const refreshData = useCallback(async () => {
    try {
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

      if (currentUser) {
        const [notifs, records] = await Promise.all([
          getNotifications(currentUser.id),
          getTrainingRecords(currentUser.id),
        ]);
        setNotifications(notifs);
        setTrainingRecords(records);
      }
    } catch {
      // ignore
    }
  }, [currentUser]);

  useEffect(() => {
    const init = async () => {
      try {
        const user = await login('', '');
        setCurrentUser(user);
        await refreshData();
      } catch {
        // ignore
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  const currentCoach = useMemo(
    () => (currentUser?.role === 'coach' ? coaches.find((c) => c.userId === currentUser.id) ?? null : null),
    [coaches, currentUser],
  );

  const loginHandler = useCallback(async (studentId: string, password: string): Promise<User | null> => {
    const user = await login(studentId, password);
    if (user) {
      setCurrentUser(user);
      await refreshData();
    }
    return user;
  }, [refreshData]);

  const registerHandler = useCallback(async (params: {
    studentId: string;
    password: string;
    name: string;
    department: string;
    grade: string;
  }): Promise<User> => {
    const user = await apiRegister(params);
    setCurrentUser(user);
    await refreshData();
    return user;
  }, [refreshData]);

  const logoutHandler = useCallback(async () => {
    await logout();
    setCurrentUser(null);
    setNotifications([]);
    setTrainingRecords([]);
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
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const deleteNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

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
    try {
      await apiApproveAppointment(appointmentId);
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
    } catch {
      // ignore
    }
  }, [addNotification]);

  const coachRejectAppointment = useCallback(async (appointmentId: string, reason: string) => {
    try {
      await apiRejectAppointment(appointmentId, reason);
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
    } catch {
      // ignore
    }
  }, [addNotification]);

  const coachCompleteAppointment = useCallback(async (appointmentId: string) => {
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

  const coachToggleSlot = useCallback(async (slotId: string) => {
    try {
      await apiToggleSlot(slotId);
      setSlots((prev) => prev.map((s) => (s.id === slotId ? { ...s, isAvailable: !s.isAvailable } : s)));
    } catch {
      // ignore
    }
  }, []);

  const coachAddSlot = useCallback(async (slot: Omit<CoachSlot, 'id'>) => {
    try {
      const newSlot = await apiAddSlot(slot);
      setSlots((prev) => [...prev, newSlot]);
    } catch {
      // ignore
    }
  }, []);

  const coachUpdateProfile = useCallback((patch: Partial<CoachProfile>) => {
    if (!currentCoach) return;
    setCoaches((prev) => prev.map((c) => (c.id === currentCoach.id ? { ...c, ...patch } : c)));
  }, [currentCoach]);

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
  }, [currentUser]);

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

  const adminPublishAnnouncement = useCallback(async (a: Omit<Announcement, 'id' | 'publishedAt'>) => {
    await apiCreateAnnouncement(a);
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

  const addTrainingRecord = useCallback(async (record: Omit<TrainingRecord, 'id' | 'createdAt'>) => {
    try {
      const newRecord = await apiAddTrainingRecord(record);
      setTrainingRecords((prev) => [newRecord, ...prev]);
    } catch {
      // ignore
    }
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