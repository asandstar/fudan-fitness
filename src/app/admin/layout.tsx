// 管理员后台独立布局(不使用前台 NavBar)
import Link from 'next/link';
import { Shield, ArrowLeft } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <header className="bg-text-primary text-white sticky top-0 z-30" style={{ height: 'var(--nav-height)' }}>
        <div className="max-w-content mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Shield size={18} />
            </div>
            <div>
              <div className="font-bold text-sm">管理员后台</div>
              <div className="text-xs text-white/60">复旦健身社互助预约平台</div>
            </div>
          </div>
          <Link href="/" className="flex items-center gap-1 text-xs text-white/80 hover:text-white">
            <ArrowLeft size={12} /> 返回前台
          </Link>
        </div>
      </header>
      <div className="flex-1">{children}</div>
    </div>
  );
}
