'use client';

// 通用弹窗(强制关闭按钮 + 遮罩 + Esc 关闭)
import { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  closeOnMask?: boolean; // 默认 false(防误关)
}

export default function Modal({ open, onClose, title, children, size = 'md', closeOnMask = false }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  const sizeClass = size === 'sm' ? 'max-w-sm' : size === 'lg' ? 'max-w-2xl' : 'max-w-md';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={closeOnMask ? onClose : undefined}
      />
      <div className={`relative w-full ${sizeClass} bg-surface rounded-xl shadow-xl max-h-[90vh] flex flex-col`}>
        {title && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-border-light">
            <h3 className="font-bold text-text-primary">{title}</h3>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-text-tertiary hover:text-text-primary hover:bg-bg-warm"
              aria-label="关闭"
            >
              <X size={18} />
            </button>
          </div>
        )}
        {!title && (
          <button
            onClick={onClose}
            className="absolute right-3 top-3 p-1 rounded-md text-text-tertiary hover:text-text-primary hover:bg-bg-warm z-10"
            aria-label="关闭"
          >
            <X size={18} />
          </button>
        )}
        <div className="overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  );
}
