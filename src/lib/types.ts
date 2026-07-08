// 核心类型定义 — 复旦健身社互助预约平台

// 用户角色
export type UserRole = 'member' | 'coach' | 'admin';

// 预约状态
export type BookingStatus =
  | 'pending'      // 待审核
  | 'approved'     // 已确认
  | 'completed'    // 已完成
  | 'cancelled'    // 已取消
  | 'rejected'     // 已拒绝
  | 'expired'      // 已过期
  | 'no_show';     // 违约

// 校区
export type VenueCampus =
  | 'handan-south'
  | 'handan-north'
  | 'wuliu'
  | 'jiangwan'
  | 'fenglin'
  | 'zhangjiang';

// 教练认证状态
export type CertStatus = 'none' | 'pending' | 'approved' | 'rejected';

// 用户
export interface User {
  id: string;
  studentId: string;
  password: string;          // Mock 阶段明文
  name: string;
  department: string;
  grade: string;
  role: UserRole;
  avatarUrl?: string;
  violationCount: number;
  bannedUntil: string | null; // ISO 字符串
  createdAt: string;
}

// 场馆
export interface Venue {
  id: string;
  name: string;
  campus: VenueCampus;
  address: string;
  openTime: string;          // HH:mm
  closeTime: string;
  capacity: number;
  facilities: string[];
  description: string;
  bookable: boolean;
  displayOrder: number;
  imageUrl?: string;
}

// 教练资料
export interface CoachProfile {
  id: string;
  userId: string;
  name: string;
  department: string;
  grade: string;
  specialties: string[];
  styleDesc: string;
  isBeginnerFriendly: boolean;
  isFemaleFriendly: boolean;
  totalSessions: number;
  totalStudents: number;
  certStatus: CertStatus;
  certAppliedAt?: string;
  certReviewedAt?: string;
  certReviewNote?: string;
  reviewedBy?: string;
  venues: string[];          // 关联场馆 ID
  createdAt: string;
}

// 教练可用时段
export interface CoachSlot {
  id: string;
  coachId: string;
  venueId: string;
  date: string;              // YYYY-MM-DD
  startTime: string;         // HH:mm
  endTime: string;
  isAvailable: boolean;
}

// 预约记录
export interface Appointment {
  id: string;
  studentId: string;         // 用户 ID (u1, u2 ...)
  coachId: string;
  venueId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  trainingNote?: string;
  cancelReason?: string;
  cancelledAt?: string;
  cancelledBy?: 'student' | 'coach' | 'system';
  createdAt: string;
  updatedAt?: string;
}

// 预约草稿(向导中间状态)
export interface BookingDraft {
  venueId: string;
  date: string;
  startTime: string;
  endTime: string;
  coachId: string;
  trainingNote: string;
}

// 公告
export interface Announcement {
  id: string;
  title: string;
  content: string;
  isPinned: boolean;
  status: 'published' | 'draft';
  publishedAt: string;
}

// 违约记录
export interface ViolationRecord {
  id: string;
  userId: string;
  appointmentId: string;
  violationType: 'late_cancel' | 'no_show';
  description: string;
  createdAt: string;
}

// 禁约状态
export interface BanStatus {
  banned: boolean;
  remainingDays?: number;
}

// 通知类型
export type NotificationType = 'booking_approved' | 'booking_rejected' | 'booking_cancelled' | 'booking_completed' | 'coach_approved' | 'coach_rejected' | 'system';

// 通知
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  content: string;
  read: boolean;
  createdAt: string;
  relatedId?: string; // 关联的预约ID、教练ID等
}

// 训练打卡记录
export interface TrainingRecord {
  id: string;
  userId: string;
  appointmentId: string;
  date: string;              // YYYY-MM-DD
  duration: number;          // 分钟
  workoutType: string;       // 训练类型：力量训练、有氧、HIIT、瑜伽等
  intensity: 'low' | 'medium' | 'high';
  calories: number;          // 消耗卡路里
  note?: string;             // 训练感受/成果
  photoUrl?: string;         // 可选的打卡照片
  createdAt: string;
}

// 训练统计
export interface TrainingStats {
  totalWorkouts: number;
  totalDuration: number;     // 分钟
  totalCalories: number;
  currentStreak: number;     // 当前连续打卡天数
  longestStreak: number;     // 最长连续打卡天数
  weeklyData: { day: string; count: number }[];
}
