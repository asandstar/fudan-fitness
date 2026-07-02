// 状态徽章
import { STATUS_COLORS, STATUS_LABELS } from '@/lib/constants';
import type { BookingStatus } from '@/lib/types';

export default function StatusBadge({ status }: { status: BookingStatus }) {
  return (
    <span className={`badge ${STATUS_COLORS[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}
