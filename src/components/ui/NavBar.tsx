'use client';

// 顶部导航栏
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Menu, X, Dumbbell, LogOut, User as UserIcon, Bell, Sun, Moon } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useTheme } from '@/context/ThemeContext';
import { avatarInitial } from '@/lib/utils';
import NotificationCenter from './NotificationCenter';

const NAV_LINKS = [
  { href: '/', label: '首页' },
  { href: '/venues', label: '场馆介绍' },
  { href: '/booking', label: '预约带练' },
  { href: '/profile', label: '个人中心' },
];

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, logout, getUnreadCount } = useApp();
  const { theme, toggleTheme } = useTheme();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const unreadCount = getUnreadCount();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    router.push('/');
  };

  return (
    <header className={`sticky top-0 z-40 transition-all duration-300 ${scrolled ? 'bg-surface shadow-md' : 'bg-surface/95 backdrop-blur'} border-b border-border-light`} style={{ height: 'var(--nav-height)' }}>
      <div className="max-w-content mx-auto px-6 h-full flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-text-primary">
          <span className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white">
            <Dumbbell size={18} />
          </span>
          <span className="hidden sm:inline">复旦健身社</span>
        </Link>

        {/* 桌面导航 */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="relative px-3 py-2 text-sm font-medium text-text-secondary hover:text-primary transition-colors"
              style={isActive(link.href) ? { color: 'var(--color-primary)' } : undefined}
            >
              {link.label}
              <span
                className="nav-indicator absolute left-1/2 -translate-x-1/2 bottom-1 h-0.5 bg-primary transition-all"
                style={{ width: isActive(link.href) ? '20px' : '0' }}
              />
            </Link>
          ))}
        </nav>

        {/* 右侧用户区 */}
        <div className="flex items-center gap-2">
          {currentUser ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setNotificationOpen(true);
                  setUserMenuOpen(false);
                }}
                className="relative p-2 rounded-full hover:bg-bg-warm transition-colors"
                aria-label="通知"
              >
                <Bell size={18} className="text-text-secondary" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-danger text-white text-xs flex items-center justify-center font-medium animate-bounce-in">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              <div className="relative">
                <button
                  onClick={() => {
                    setUserMenuOpen((v) => !v);
                    setNotificationOpen(false);
                  }}
                  className="flex items-center gap-2 px-2 py-1 rounded-full hover:bg-bg-warm transition-colors"
                >
                  <span className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-medium">
                    {avatarInitial(currentUser.name)}
                  </span>
                  <span className="hidden sm:inline text-sm font-medium text-text-primary">{currentUser.name}</span>
                </button>
              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 z-20 w-48 bg-surface rounded-lg shadow-lg border border-border-light py-1">
                    <div className="px-3 py-2 border-b border-border-light">
                      <div className="text-sm font-medium text-text-primary">{currentUser.name}</div>
                      <div className="text-xs text-text-tertiary">{currentUser.department}</div>
                    </div>
                    <button
                      onClick={() => { toggleTheme(); setUserMenuOpen(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:bg-bg-warm"
                    >
                      {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
                      {theme === 'dark' ? '浅色模式' : '暗色模式'}
                    </button>
                    <Link
                      href="/profile"
                      className="flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:bg-bg-warm"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <UserIcon size={14} /> 个人中心
                    </Link>
                    {currentUser.role === 'coach' && (
                      <Link
                        href="/coach-center"
                        className="flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:bg-bg-warm"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Dumbbell size={14} /> 教练中心
                      </Link>
                    )}
                    {currentUser.role === 'admin' && (
                      <Link
                        href="/admin"
                        className="flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:bg-bg-warm"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <UserIcon size={14} /> 管理员后台
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-danger hover:bg-bg-warm"
                    >
                      <LogOut size={14} /> 退出登录
                    </button>
                  </div>
                </>
              )}
              </div>
            </div>
          ) : (
            <Link href="/login" className="btn-primary text-sm">
              登录
            </Link>
          )}

          {/* 移动汉堡 */}
          <button
            className="md:hidden p-2 text-text-primary"
            onClick={() => setDrawerOpen(true)}
            aria-label="打开菜单"
          >
            <Menu size={20} />
          </button>
        </div>
      </div>

      {/* 移动抽屉 */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-72 bg-surface shadow-xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border-light">
              <span className="font-bold">菜单</span>
              <button onClick={() => setDrawerOpen(false)} aria-label="关闭">
                <X size={20} />
              </button>
            </div>
            <nav className="flex-1 py-2">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="mobile-nav-item block px-4 py-3 text-sm font-medium text-text-primary hover:bg-bg-warm"
                  style={isActive(link.href) ? { backgroundColor: 'var(--color-primary-50)', color: 'var(--color-primary)' } : undefined}
                  onClick={() => setDrawerOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              {currentUser?.role === 'coach' && (
                <Link
                  href="/coach-center"
                  className="mobile-nav-item block px-4 py-3 text-sm font-medium text-text-primary hover:bg-bg-warm"
                  onClick={() => setDrawerOpen(false)}
                >
                  教练中心
                </Link>
              )}
              {currentUser?.role === 'admin' && (
                <Link
                  href="/admin"
                  className="mobile-nav-item block px-4 py-3 text-sm font-medium text-text-primary hover:bg-bg-warm"
                  onClick={() => setDrawerOpen(false)}
                >
                  管理员后台
                </Link>
              )}
            </nav>
          </div>
        </div>
      )}

      <NotificationCenter open={notificationOpen} onClose={() => setNotificationOpen(false)} />
    </header>
  );
}
