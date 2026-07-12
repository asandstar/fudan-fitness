'use client';

// Mock 登录页(支持学号密码 + 一键账号)
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Dumbbell, ArrowLeft, LogIn, UserCircle } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { QUICK_LOGIN_ACCOUNTS } from '@/lib/mock-data';
import Toast from '@/components/ui/Toast';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useApp();
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const handleLogin = async (sid: string, pwd: string) => {
    // 防重复提交
    if (submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const user = await login(sid, pwd);
      if (user) {
        setToast({ msg: `欢迎回来,${user.name}`, type: 'success' });
        setTimeout(() => {
          if (user.role === 'admin') router.push('/admin');
          else if (user.role === 'coach') router.push('/coach-center');
          else router.push('/profile');
        }, 600);
      } else {
        setError('学号或密码错误');
        setToast({ msg: '登录失败,请检查账号', type: 'error' });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : '登录失败,请稍后重试';
      setError(msg);
      setToast({ msg, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId || !password) {
      setError('请输入学号和密码');
      return;
    }
    await handleLogin(studentId, password);
  };

  const handleQuick = async (sid: string, pwd: string) => {
    setStudentId(sid);
    setPassword(pwd);
    await handleLogin(sid, pwd);
  };

  return (
    <div className="min-h-[calc(100vh-var(--nav-height))] flex items-center justify-center px-4 py-10 bg-bg-warm">
      <div className="w-full max-w-md">
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-primary mb-4">
          <ArrowLeft size={14} /> 返回首页
        </Link>

        <div className="card p-6">
          <div className="flex flex-col items-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center text-white mb-3">
              <Dumbbell size={28} />
            </div>
            <h1 className="text-xl font-bold text-text-primary">登录复旦健身社</h1>
            <p className="text-sm text-text-secondary mt-1">MVP Demo · 任意账号密码见下方一键登录</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">学号</label>
              <input
                type="text"
                value={studentId}
                onChange={(e) => { setStudentId(e.target.value); setError(''); }}
                placeholder="请输入学号"
                className="input"
                disabled={submitting}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">密码</label>
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                placeholder="请输入密码"
                className="input"
                disabled={submitting}
              />
            </div>
            {error && <p className="text-xs text-danger">{error}</p>}
            <button type="submit" className="btn-primary w-full" disabled={submitting}>
              <LogIn size={14} /> {submitting ? '登录中...' : '登录'}
            </button>
          </form>

          <p className="text-center text-sm text-text-secondary mt-4">
            没有账号?{' '}
            <Link href="/register" className="text-primary hover:underline font-medium">
              立即注册
            </Link>
          </p>

          <div className="my-5 flex items-center gap-3">
            <div className="flex-1 h-px bg-border-light" />
            <span className="text-xs text-text-tertiary">一键登录(Demo)</span>
            <div className="flex-1 h-px bg-border-light" />
          </div>

          <div className="grid grid-cols-1 gap-2">
            {QUICK_LOGIN_ACCOUNTS.map((acc) => (
              <button
                key={acc.studentId}
                onClick={() => handleQuick(acc.studentId, acc.password)}
                disabled={submitting}
                className="flex items-center gap-3 p-3 rounded-lg border border-border-light hover:border-primary hover:bg-primary-50 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="w-9 h-9 rounded-full bg-primary-50 text-primary flex items-center justify-center">
                  <UserCircle size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-text-primary">{acc.label}</div>
                  <div className="text-xs text-text-tertiary truncate">{acc.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <p className="text-center text-xs text-text-tertiary mt-4">
          平台仅供复旦健身社内部使用 · 不做真实校园认证
        </p>
      </div>

      {toast && (
        <Toast
          message={toast.msg}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
