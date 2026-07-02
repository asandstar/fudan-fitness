// 空状态
import type { ReactNode } from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({ icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-bg-warm flex items-center justify-center text-text-tertiary mb-4">
        {icon ?? <Inbox size={28} />}
      </div>
      <h3 className="font-medium text-text-primary mb-1">{title}</h3>
      {description && <p className="text-sm text-text-secondary max-w-sm">{description}</p>}
      {actionLabel && onAction && (
        <button onClick={onAction} className="btn-outline mt-4 text-sm">
          {actionLabel}
        </button>
      )}
    </div>
  );
}
