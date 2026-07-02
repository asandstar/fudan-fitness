'use client';

// 成功 Toast(右上角,自动消失)
import { useEffect } from 'react';
import { CheckCircle2, X } from 'lucide-react';

interface ToastProps {
  message: string;
  onClose: () => void;
  duration?: number;
  type?: 'success' | 'error' | 'info';
}

export default function Toast({ message, onClose, duration = 3000, type = 'success' }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onClose, duration);
    return () => clearTimeout(t);
  }, [onClose, duration]);

  const colorMap = {
    success: 'bg-success/90 text-emerald-900',
    error: 'bg-danger/90 text-white',
    info: 'bg-info/90 text-blue-900',
  };

  const Icon = type === 'success' ? CheckCircle2 : type === 'error' ? CheckCircle2 : CheckCircle2;

  return (
    <div className="fixed top-20 right-4 z-50 animate-in slide-in-from-top">
      <div className={`flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg ${colorMap[type]}`}>
        <Icon size={18} />
        <span className="text-sm font-medium">{message}</span>
        <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100" aria-label="关闭">
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
