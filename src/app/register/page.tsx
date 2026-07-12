'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Dumbbell, ArrowLeft, UserPlus, UserCircle } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { QUICK_LOGIN_ACCOUNTS } from '@/lib/mock-data';
import Toast from '@/components/ui/Toast';

export default function RegisterPage() {
  const router = useRouter();
  const { register, login } = useApp();
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [grade, setGrade] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!studentId || !password || !name) {
      setError('请填写学号、密码和姓名');
      return;
    }
    if (password.length < 6) {
      setError('密码至少6位');
      return;
    }
    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    setLoading(true);
    try {
      const user = await register({
        studentId,
        password,
        name,
        department,
        grade,
      });
      setToast({ msg: `注册成功,欢迎 ${user.name}`, type: 'success' });
      setTimeout(() => {
        router.push('/profile');
      }, 800);
    } catch (err) {
      const msg = (err as Error).message || '注册失败,请重试';
      setError(msg);
      setToast({ msg, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (sid: string, pwd: string) => {
    // 统一使用 loading 状态，避免注册和快捷登录同时操作
    if (loading) return;
    setLoading(true);
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
        setToast({ msg: '登录失败,请检查账号', type: 'error' });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : '登录失败,请稍后重试';
      setToast({ msg, type: 'error' });
    } finally {
      setLoading(false);
    }
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
            <h1 className="text-xl font-bold text-text-primary">注册复旦健身社</h1>
            <p className="text-sm text-text-secondary mt-1">填写信息完成注册,开启健身之旅</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">学号 <span className="text-danger">*</span></label>
              <input
                type="text"
                value={studentId}
                onChange={(e) => { setStudentId(e.target.value); setError(''); }}
                placeholder="请输入学号"
                className="input"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">姓名 <span className="text-danger">*</span></label>
              <input
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); setError(''); }}
                placeholder="请输入姓名"
                className="input"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">院系</label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="选填"
                  className="input"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">年级</label>
                <input
                  type="text"
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  placeholder="选填"
                  className="input"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">密码 <span className="text-danger">*</span></label>
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                placeholder="至少6位"
                className="input"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">确认密码 <span className="text-danger">*</span></label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                placeholder="再次输入密码"
                className="input"
              />
            </div>
            {error && <p className="text-xs text-danger">{error}</p>}
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              <UserPlus size={14} /> {loading ? '注册中...' : '立即注册'}
            </button>
          </form>

          <p className="text-center text-sm text-text-secondary mt-4">
            已有账号?{' '}
            <Link href="/login" className="text-primary hover:underline font-medium">
              去登录
            </Link>
          </p>

          <div className="my-5 flex items-center gap-3">
            <div className="flex-1 h-px bg-border-light" />
            <span className="text-xs text-text-tertiary">或使用Demo账号体验</span>
            <div className="flex-1 h-px bg-border-light" />
          </div>

          <div className="grid grid-cols-1 gap-2">
            {QUICK_LOGIN_ACCOUNTS.slice(0, 3).map((acc) => (
              <button
                key={acc.studentId}
                onClick={() => handleQuickLogin(acc.studentId, acc.password)}
                disabled={loading}
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
