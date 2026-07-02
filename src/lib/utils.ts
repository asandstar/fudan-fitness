// 工具函数
import type { Appointment, BanStatus, User } from './types';
import {
  BAN_DURATION_DAYS,
  BAN_VIOLATION_COUNT,
  BOOKING_WINDOW_DAYS,
  COACH_REVIEW_HOURS,
  FREE_CANCEL_HOURS,
} from './constants';

/** 格式化日期为 YYYY-MM-DD */
export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** 当前自然周起止(周一 00:00 ~ 周日 23:59:59) */
export function getWeekRange(referenceDate: Date = new Date()): { start: Date; end: Date } {
  const date = new Date(referenceDate);
  date.setHours(0, 0, 0, 0);
  const day = date.getDay();
  const diff = date.getDate() - (day === 0 ? 6 : day - 1);
  const monday = new Date(date);
  monday.setDate(diff);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { start: monday, end: sunday };
}

/** 计算用户本周已预约次数(pending/approved/completed 计入) */
export function getWeeklyBookingCount(
  appointments: Appointment[],
  studentId: string,
  referenceDate: Date = new Date(),
): number {
  const { start, end } = getWeekRange(referenceDate);
  return appointments.filter((a) => {
    if (a.studentId !== studentId) return false;
    if (!['pending', 'approved', 'completed'].includes(a.status)) return false;
    const slotDate = new Date(`${a.date}T00:00:00`);
    return slotDate >= start && slotDate <= end;
  }).length;
}

/** 距开始时间是否超过 N 小时(默认 24h) */
export function canCancelFree(
  bookingDate: string,
  bookingStartTime: string,
  hours: number = FREE_CANCEL_HOURS,
): boolean {
  const start = new Date(`${bookingDate}T${bookingStartTime}:00`);
  return start.getTime() - Date.now() > hours * 60 * 60 * 1000;
}

/** 距开始时间的剩余小时数(用于显示) */
export function hoursUntilStart(bookingDate: string, bookingStartTime: string): number {
  const start = new Date(`${bookingDate}T${bookingStartTime}:00`);
  return Math.round((start.getTime() - Date.now()) / (60 * 60 * 1000));
}

/** 检查用户禁约状态 */
export function checkBanStatus(user: User): BanStatus {
  if (!user.bannedUntil) return { banned: false };
  const banEnd = new Date(user.bannedUntil);
  if (banEnd <= new Date()) return { banned: false };
  const remainingMs = banEnd.getTime() - Date.now();
  const remainingDays = Math.ceil(remainingMs / (24 * 60 * 60 * 1000));
  return { banned: true, remainingDays };
}

/** 检查时段冲突:同一教练同时段是否已被预约(pending/approved) */
export function checkSlotConflict(
  appointments: Appointment[],
  coachId: string,
  venueId: string,
  date: string,
  startTime: string,
): boolean {
  return appointments.some(
    (a) =>
      a.coachId === coachId &&
      a.venueId === venueId &&
      a.date === date &&
      a.startTime === startTime &&
      ['pending', 'approved'].includes(a.status),
  );
}

/** 获取未来 N 天日期列表(含今天) */
export function getNextNDays(n: number): Date[] {
  const dates: Date[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < n; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push(d);
  }
  return dates;
}

/** 周几中文 */
export function weekdayLabel(date: Date): string {
  const labels = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return labels[date.getDay()];
}

/** 格式化时间显示 */
export function formatTimeRange(start: string, end: string): string {
  return `${start}-${end}`;
}

/** 判断 pending 预约是否超过 12h 未审核(模拟 cron) */
export function isPendingExpired(createdAt: string, hours: number = COACH_REVIEW_HOURS): boolean {
  const created = new Date(createdAt);
  return Date.now() - created.getTime() > hours * 60 * 60 * 1000;
}

/** 计算禁约到期日(从今天起 N 天) */
export function computeBanUntil(days: number = BAN_DURATION_DAYS): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

/** 触发禁约阈值 */
export function shouldBan(violationCount: number): boolean {
  return violationCount >= BAN_VIOLATION_COUNT;
}

/** 生成简短 ID */
export function genId(prefix: string): string {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

/** 头像首字母(取姓名最后一个字,适配中文) */
export function avatarInitial(name: string): string {
  if (!name) return '?';
  return name.charAt(name.length - 1);
}

/** 截断文本 */
export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max) + '...';
}

/** 格式化日期为中文显示(M月D日 周X) */
export function formatDateChinese(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`);
  return `${d.getMonth() + 1}月${d.getDate()}日 ${weekdayLabel(d)}`;
}

/** 格式化日期时间(完整) */
export function formatDateTime(dateStr: string, startTime: string, endTime: string): string {
  return `${formatDateChinese(dateStr)} ${startTime}-${endTime}`;
}

export { BOOKING_WINDOW_DAYS };
