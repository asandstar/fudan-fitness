// 业务规则常量
import type { BookingStatus, VenueCampus } from './types';

// 预约限制
export const MAX_WEEKLY_BOOKINGS = 3;       // 每周最多预约次数
export const FREE_CANCEL_HOURS = 24;        // 免费取消时间窗口(小时)
export const COACH_REVIEW_HOURS = 12;       // 教练审核时限(小时)
export const BAN_VIOLATION_COUNT = 3;       // 触发禁约的违约次数
export const BAN_DURATION_DAYS = 30;        // 禁约天数

// 时段设置
export const SLOT_DURATION_MINUTES = 60;
export const BOOKING_WINDOW_DAYS = 7;       // 可预约未来天数
export const EARLIEST_SLOT_HOUR = 8;
export const LATEST_SLOT_HOUR = 22;

// 训练需求字数上限
export const TRAINING_NOTE_MAX = 200;

// 状态颜色映射(用于 StatusBadge)
export const STATUS_COLORS: Record<BookingStatus, string> = {
  pending: 'bg-warning/20 text-warning',
  approved: 'bg-success/30 text-emerald-700',
  completed: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-gray-100 text-gray-500',
  rejected: 'bg-gray-100 text-gray-500',
  expired: 'bg-gray-100 text-gray-500',
  no_show: 'bg-danger/15 text-danger',
};

// 状态文本映射
export const STATUS_LABELS: Record<BookingStatus, string> = {
  pending: '待审核',
  approved: '已确认',
  completed: '已完成',
  cancelled: '已取消',
  rejected: '已拒绝',
  expired: '已过期',
  no_show: '违约',
};

// 状态左侧色条(BookingCard)
export const STATUS_BAR_COLORS: Record<BookingStatus, string> = {
  pending: 'bg-warning',
  approved: 'bg-success',
  completed: 'bg-text-tertiary',
  cancelled: 'bg-text-tertiary',
  rejected: 'bg-text-tertiary',
  expired: 'bg-text-tertiary',
  no_show: 'bg-danger',
};

// 校区名称映射
export const CAMPUS_LABELS: Record<VenueCampus, string> = {
  'handan-south': '邯郸南区',
  'handan-north': '邯郸北区',
  'wuliu': '五六教工会',
  'jiangwan': '江湾',
  'fenglin': '枫林',
  'zhangjiang': '张江',
};

// 个人中心预约 Tab
export const PROFILE_TABS = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待审核' },
  { key: 'approved', label: '已确认' },
  { key: 'completed', label: '已完成' },
  { key: 'cancelled', label: '已取消' },
  { key: 'no_show', label: '违约' },
] as const;

// 教练中心 Tab
export const COACH_TABS = [
  { key: 'pending', label: '待审核' },
  { key: 'approved', label: '已确认' },
  { key: 'rejected', label: '已拒绝' },
  { key: 'completed', label: '带练记录' },
] as const;

// 管理员后台 Tab
export const ADMIN_TABS = [
  { key: 'coaches', label: '教练审核' },
  { key: 'announcements', label: '公告发布' },
  { key: 'appointments', label: '预约记录' },
  { key: 'blacklist', label: '黑名单' },
] as const;
