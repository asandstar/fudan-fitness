'use client';

import { useEffect } from 'react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

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
    success: 'bg-success/95 text-emerald-900',
    error: 'bg-danger/95 text-white',
    info: 'bg-info/95 text-blue-900',
  };

  const IconMap = {
    success: CheckCircle2,
    error: XCircle,
    info: Info,
  };

  const Icon = IconMap[type];

  return (
    <div className="fixed top-20 right-4 z-50 animate-bounce-in">
      <div className={`flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl ${colorMap[type]} animate-slide-up`}>
        <Icon size={18} className="flex-shrink-0" />
        <span className="text-sm font-medium">{message}</span>
        <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100 transition-opacity" aria-label="关闭">
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
