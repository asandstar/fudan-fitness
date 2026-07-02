// 错误状态
import type { ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  title: string;
  description?: string;
  retryLabel?: string;
  onRetry?: () => void;
}

export default function ErrorState({ title, description, retryLabel, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-danger/10 flex items-center justify-center text-danger mb-4">
        <AlertCircle size={28} />
      </div>
      <h3 className="font-medium text-text-primary mb-1">{title}</h3>
      {description && <p className="text-sm text-text-secondary max-w-sm">{description}</p>}
      {retryLabel && onRetry && (
        <button onClick={onRetry} className="btn-outline mt-4 text-sm">
          <RefreshCw size={14} /> {retryLabel}
        </button>
      )}
    </div>
  );
}
