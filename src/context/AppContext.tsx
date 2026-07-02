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
    return { ok: true, appointment };
  }, [currentUser, appointments]);

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
      prev.map((a) => (a.id === appointmentId && a.status === 'pending' ? { ...a, status: 'approved' as const, updatedAt: new Date().toISOString() } : a)),
    );
  }, []);

  const coachRejectAppointment = useCallback((appointmentId: string, reason: string) => {
    setAppointments((prev) =>
      prev.map((a) =>
        a.id === appointmentId && a.status === 'pending'
          ? { ...a, status: 'rejected' as const, cancelReason: reason, updatedAt: new Date().toISOString() }
          : a,
      ),
    );
  }, []);

  const coachCompleteAppointment = useCallback((appointmentId: string) => {
    setAppointments((prev) =>
      prev.map((a) =>
        a.id === appointmentId && a.status === 'approved'
          ? { ...a, status: 'completed' as const, updatedAt: new Date().toISOString() }
          : a,
      ),
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
  }, [appointments]);

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
    setCoaches((prev) =>
      prev.map((c) =>
        c.id === coachId && c.certStatus === 'pending'
          ? { ...c, certStatus: 'approved' as const, certReviewedAt: new Date().toISOString() }
          : c,
      ),
    );
    // 同步用户角色 member → coach
    setUsers((prev) =>
      prev.map((u) => {
        const coach = coaches.find((c) => c.id === coachId);
        if (coach && u.id === coach.userId) return { ...u, role: 'coach' as const };
        return u;
      }),
    );
  }, [coaches]);

  const adminRejectCoach = useCallback((coachId: string, reason: string) => {
    setCoaches((prev) =>
      prev.map((c) =>
        c.id === coachId && c.certStatus === 'pending'
          ? { ...c, certStatus: 'rejected' as const, certReviewNote: reason, certReviewedAt: new Date().toISOString() }
          : c,
      ),
    );
  }, []);

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

  const value: AppContextValue = {
    users,
    venues,
    coaches,
    slots,
    appointments,
    announcements,
    violations,
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
