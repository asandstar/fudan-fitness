'use client';

import type { ReactNode } from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  variant?: 'default' | 'booking' | 'notification' | 'record';
}

const variantStyles = {
  default: 'bg-bg-warm text-text-tertiary',
  booking: 'bg-primary-50 text-primary',
  notification: 'bg-info/20 text-info',
  record: 'bg-accent-light text-accent',
};

const variantIcons = {
  default: Inbox,
  booking: Inbox,
  notification: Inbox,
  record: Inbox,
};

export default function EmptyState({ icon, title, description, actionLabel, onAction, variant = 'default' }: EmptyStateProps) {
  const Icon = icon ? () => icon : variantIcons[variant];
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-in">
      <div className={`w-20 h-20 rounded-2xl ${variantStyles[variant]} flex items-center justify-center mb-5 animate-slide-up`}>
        <Icon size={32} />
      </div>
      <h3 className="font-semibold text-text-primary text-lg mb-2 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        {title}
      </h3>
      {description && (
        <p className="text-sm text-text-secondary max-w-md leading-relaxed animate-slide-up" style={{ animationDelay: '0.15s' }}>
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="btn-outline mt-5 text-sm animate-slide-up"
          style={{ animationDelay: '0.2s' }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
