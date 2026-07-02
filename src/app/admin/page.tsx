'use client';

// 管理员后台 — 4 Tab:教练审核 / 公告发布 / 预约记录 / 黑名单
import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  UserCheck, Megaphone, Calendar, Ban, Check, X, Pin, Trash2,
  Shield, Search, RefreshCw,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { ADMIN_TABS, CAMPUS_LABELS, STATUS_LABELS } from '@/lib/constants';
import { avatarInitial, formatDate, formatDateTime } from '@/lib/utils';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';
import Modal from '@/components/ui/Modal';
import Toast from '@/components/ui/Toast';
import type { CoachProfile } from '@/lib/types';

const NAV_ITEMS = [
  { key: 'coaches', label: '教练审核', icon: UserCheck },
  { key: 'announcements', label: '公告发布', icon: Megaphone },
  { key: 'appointments', label: '预约记录', icon: Calendar },
  { key: 'blacklist', label: '黑名单', icon: Ban },
];

export default function AdminPage() {
  const {
    currentUser, users, coaches, venues, appointments, announcements,
    adminApproveCoach, adminRejectCoach, adminPublishAnnouncement, adminDeleteAnnouncement, adminUnbanUser,
  } = useApp();
  const [tab, setTab] = useState<string>('coaches');
  const [rejectCoach, setRejectCoach] = useState<CoachProfile | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);

  // 公告编辑
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annPinned, setAnnPinned] = useState(false);

  // 预约筛选
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterKeyword, setFilterKeyword] = useState('');

  // Hooks 必须在 early return 之前调用
  const filteredAppts = useMemo(() => {
    let list = appointments.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (filterStatus !== 'all') list = list.filter((a) => a.status === filterStatus);
    if (filterKeyword.trim()) {
      const kw = filterKeyword.trim();
      list = list.filter((a) => {
        const stu = users.find((u) => u.id === a.studentId);
        const coach = coaches.find((c) => c.id === a.coachId);
        const venue = venues.find((v) => v.id === a.venueId);
        return [stu?.name, coach?.name, venue?.name].some((n) => n?.includes(kw));
      });
    }
    return list;
  }, [appointments, filterStatus, filterKeyword, users, coaches, venues]);

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="max-w-content mx-auto px-6 py-16 text-center">
        <Shield size={48} className="text-text-tertiary mx-auto mb-3" />
        <h2 className="text-lg font-medium text-text-primary mb-2">仅管理员可访问</h2>
        <p className="text-sm text-text-secondary mb-4">请使用管理员账号登录</p>
        <Link href="/login" className="btn-primary">去登录</Link>
      </div>
    );
  }

  const pendingCoaches = coaches.filter((c) => c.certStatus === 'pending');
  const bannedUsers = users.filter((u) => {
    if (!u.bannedUntil) return false;
    return new Date(u.bannedUntil) > new Date();
  });

  const handleApproveCoach = (c: CoachProfile) => {
    adminApproveCoach(c.id);
    setToast({ msg: `已通过 ${c.name} 的教练申请`, type: 'success' });
  };
  const handleRejectCoach = () => {
    if (!rejectCoach) return;
    if (!rejectReason.trim()) { setToast({ msg: '请填写驳回原因', type: 'error' }); return; }
    adminRejectCoach(rejectCoach.id, rejectReason.trim());
    setToast({ msg: `已驳回 ${rejectCoach.name} 的申请`, type: 'info' });
    setRejectCoach(null);
    setRejectReason('');
  };
  const handlePublishAnn = () => {
    if (!annTitle.trim() || !annContent.trim()) { setToast({ msg: '标题和内容不能为空', type: 'error' }); return; }
    adminPublishAnnouncement({ title: annTitle.trim(), content: annContent.trim(), isPinned: annPinned, status: 'published' });
    setAnnTitle(''); setAnnContent(''); setAnnPinned(false);
    setToast({ msg: '公告已发布', type: 'success' });
  };
  const handleUnban = (userId: string) => {
    adminUnbanUser(userId);
    const u = users.find((x) => x.id === userId);
    setToast({ msg: `已解除 ${u?.name ?? ''} 的禁约`, type: 'success' });
  };

  const studentOf = (sid: string) => users.find((u) => u.id === sid);
  const coachOf = (cid: string) => coaches.find((c) => c.id === cid);
  const venueOf = (vid: string) => venues.find((v) => v.id === vid);

  return (
    <div className="max-w-content mx-auto px-6 py-6 flex gap-6">
      {/* 左侧导航 */}
      <aside className="w-48 shrink-0 hidden md:block">
        <nav className="card p-2 sticky top-20">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                onClick={() => setTab(item.key)}
                className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  tab === item.key ? 'bg-primary text-white' : 'text-text-secondary hover:bg-bg-warm'
                }`}
              >
                <Icon size={16} /> {item.label}
                {item.key === 'coaches' && pendingCoaches.length > 0 && (
                  <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded-full ${tab === item.key ? 'bg-white/20' : 'bg-danger text-white'}`}>
                    {pendingCoaches.length}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* 右侧内容 */}
      <div className="flex-1 min-w-0">
        {/* 移动端 Tab */}
        <div className="md:hidden flex gap-1 mb-4 overflow-x-auto">
          {NAV_ITEMS.map((item) => (
            <button key={item.key} onClick={() => setTab(item.key)}
              className={`shrink-0 px-3 py-1.5 rounded-md text-xs font-medium ${tab === item.key ? 'bg-primary text-white' : 'bg-bg-warm text-text-secondary'}`}>
              {item.label}
            </button>
          ))}
        </div>

        {/* 1. 教练审核 */}
        {tab === 'coaches' && (
          <div className="card p-5">
            <h2 className="text-lg font-semibold text-text-primary mb-4">教练审核 · 待审 {pendingCoaches.length} 人</h2>
            {pendingCoaches.length === 0 ? (
              <EmptyState icon={<UserCheck size={28} />} title="暂无待审核申请" description="新申请会显示在这里" />
            ) : (
              <div className="space-y-3">
                {pendingCoaches.map((c) => (
                  <div key={c.id} className="rounded-lg border border-border-light p-4">
                    <div className="flex items-start gap-3 flex-wrap">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary-light text-white flex items-center justify-center font-bold shrink-0">
                        {avatarInitial(c.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-text-primary">{c.name}</h3>
                          <span className="text-xs text-text-tertiary">{c.department} · {c.grade}</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {c.specialties.map((s) => <span key={s} className="badge bg-primary-50 text-primary">{s}</span>)}
                          {c.isBeginnerFriendly && <span className="badge bg-accent-light text-accent">新手友好</span>}
                          {c.isFemaleFriendly && <span className="badge bg-accent-light text-accent">女生教练</span>}
                        </div>
                        <p className="text-sm text-text-secondary italic">"{c.styleDesc}"</p>
                        <p className="text-xs text-text-tertiary mt-2">申请时间:{new Date(c.certAppliedAt ?? '').toLocaleString('zh-CN')}</p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button onClick={() => handleApproveCoach(c)} className="btn-primary text-xs">
                          <Check size={12} /> 通过
                        </button>
                        <button onClick={() => { setRejectCoach(c); setRejectReason(''); }} className="btn-ghost text-xs border border-border">
                          <X size={12} /> 驳回
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 2. 公告发布 */}
        {tab === 'announcements' && (
          <div className="space-y-4">
            <div className="card p-5">
              <h2 className="text-lg font-semibold text-text-primary mb-4">发布公告</h2>
              <div className="space-y-3">
                <input value={annTitle} onChange={(e) => setAnnTitle(e.target.value)} placeholder="公告标题" className="input" />
                <textarea value={annContent} onChange={(e) => setAnnContent(e.target.value)} placeholder="公告内容" className="textarea" rows={4} />
                <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
                  <input type="checkbox" checked={annPinned} onChange={(e) => setAnnPinned(e.target.checked)} className="accent-primary" />
                  <Pin size={14} /> 置顶
                </label>
                <button onClick={handlePublishAnn} className="btn-primary">
                  <Megaphone size={14} /> 发布
                </button>
              </div>
            </div>

            <div className="card p-5">
              <h3 className="font-semibold text-text-primary mb-3">已发布公告 · {announcements.length} 条</h3>
              <div className="space-y-2">
                {announcements.map((a) => (
                  <div key={a.id} className="p-3 rounded-md border border-border-light flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {a.isPinned && <span className="badge bg-danger/15 text-danger"><Pin size={10} /> 置顶</span>}
                        <span className="text-sm font-medium text-text-primary">{a.title}</span>
                      </div>
                      <p className="text-xs text-text-secondary mt-1 line-clamp-2">{a.content}</p>
                      <p className="text-xs text-text-tertiary mt-1">{new Date(a.publishedAt).toLocaleString('zh-CN')}</p>
                    </div>
                    <button onClick={() => adminDeleteAnnouncement(a.id)} className="text-text-tertiary hover:text-danger p-1" aria-label="删除">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 3. 预约记录 */}
        {tab === 'appointments' && (
          <div className="card p-5">
            <h2 className="text-lg font-semibold text-text-primary mb-4">预约记录 · 共 {filteredAppts.length} 条</h2>

            <div className="flex flex-wrap gap-2 mb-4">
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="input w-auto">
                <option value="all">全部状态</option>
                {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <div className="relative flex-1 min-w-[180px]">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
                <input value={filterKeyword} onChange={(e) => setFilterKeyword(e.target.value)} placeholder="搜索学员/教练/场馆" className="input pl-8" />
              </div>
            </div>

            {filteredAppts.length === 0 ? (
              <EmptyState icon={<Calendar size={28} />} title="暂无预约记录" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-text-tertiary border-b border-border-light">
                      <th className="py-2 pr-3">学员</th>
                      <th className="py-2 pr-3">教练</th>
                      <th className="py-2 pr-3">场馆</th>
                      <th className="py-2 pr-3">时间</th>
                      <th className="py-2 pr-3">状态</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAppts.map((a) => (
                      <tr key={a.id} className="border-b border-border-light hover:bg-bg-warm/50">
                        <td className="py-2 pr-3">{studentOf(a.studentId)?.name ?? '—'}</td>
                        <td className="py-2 pr-3">{coachOf(a.coachId)?.name ?? '—'}</td>
                        <td className="py-2 pr-3 text-xs">{venueOf(a.venueId)?.name ?? '—'}</td>
                        <td className="py-2 pr-3 text-xs text-text-secondary">{formatDateTime(a.date, a.startTime, a.endTime)}</td>
                        <td className="py-2 pr-3"><StatusBadge status={a.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 4. 黑名单 */}
        {tab === 'blacklist' && (
          <div className="card p-5">
            <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Ban size={18} /> 黑名单管理 · {bannedUsers.length} 人
            </h2>
            {bannedUsers.length === 0 ? (
              <EmptyState icon={<Ban size={28} />} title="暂无被封禁用户" description="违约 3 次的用户会自动进入黑名单" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-text-tertiary border-b border-border-light">
                      <th className="py-2 pr-3">用户</th>
                      <th className="py-2 pr-3">学号</th>
                      <th className="py-2 pr-3">院系</th>
                      <th className="py-2 pr-3">违约次数</th>
                      <th className="py-2 pr-3">禁约到期</th>
                      <th className="py-2 pr-3">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bannedUsers.map((u) => {
                      const days = Math.ceil((new Date(u.bannedUntil!).getTime() - Date.now()) / (24 * 60 * 60 * 1000));
                      return (
                        <tr key={u.id} className="border-b border-border-light hover:bg-bg-warm/50">
                          <td className="py-2 pr-3 font-medium">{u.name}</td>
                          <td className="py-2 pr-3 text-xs">{u.studentId}</td>
                          <td className="py-2 pr-3 text-xs">{u.department}</td>
                          <td className="py-2 pr-3"><span className="badge bg-danger/15 text-danger">{u.violationCount} 次</span></td>
                          <td className="py-2 pr-3 text-xs text-text-secondary">剩余 {days} 天</td>
                          <td className="py-2 pr-3">
                            <button onClick={() => handleUnban(u.id)} className="btn-outline text-xs px-2 py-1">
                              <RefreshCw size={12} /> 解除禁约
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 驳回教练弹窗 */}
      <Modal open={!!rejectCoach} onClose={() => setRejectCoach(null)} title="驳回教练申请" size="sm">
        {rejectCoach && (
          <div>
            <p className="text-sm text-text-secondary mb-3">驳回 {rejectCoach.name} 的申请,请填写原因(申请人可重新申请):</p>
            <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="例如:擅长领域描述不够具体,建议补充训练经验" className="textarea" rows={3} />
            <div className="flex gap-2 mt-3">
              <button onClick={() => setRejectCoach(null)} className="btn-ghost flex-1">取消</button>
              <button onClick={handleRejectCoach} className="btn-danger flex-1">确认驳回</button>
            </div>
          </div>
        )}
      </Modal>

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
