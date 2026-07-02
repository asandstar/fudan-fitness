'use client';

// 个人中心
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  UserCircle, Calendar, AlertTriangle, Ban, Dumbbell, ArrowRight,
  Clock, MapPin, X, Info, GraduationCap, Award,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { CAMPUS_LABELS, MAX_WEEKLY_BOOKINGS, PROFILE_TABS } from '@/lib/constants';
import {
  avatarInitial, canCancelFree, checkBanStatus, formatDate, formatDateTime,
  getWeeklyBookingCount, hoursUntilStart,
} from '@/lib/utils';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';
import Modal from '@/components/ui/Modal';
import Toast from '@/components/ui/Toast';
import type { Appointment } from '@/lib/types';

export default function ProfilePage() {
  const router = useRouter();
  const { currentUser, currentCoach, coaches, venues, appointments, cancelBooking, applyCoach } = useApp();
  const [tab, setTab] = useState<string>('all');
  const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [showApply, setShowApply] = useState(false);

  // Hooks 必须在 early return 之前调用
  const myAppointments = useMemo(
    () => (currentUser ? appointments.filter((a) => a.studentId === currentUser.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)) : []),
    [appointments, currentUser],
  );

  const filteredAppts = useMemo(() => {
    if (tab === 'all') return myAppointments;
    return myAppointments.filter((a) => a.status === tab);
  }, [myAppointments, tab]);

  if (!currentUser) {
    return (
      <div className="max-w-content mx-auto px-6 py-16 text-center">
        <UserCircle size={48} className="text-text-tertiary mx-auto mb-3" />
        <p className="text-text-secondary mb-4">请先登录查看个人中心</p>
        <Link href="/login" className="btn-primary">去登录</Link>
      </div>
    );
  }

  const banStatus = checkBanStatus(currentUser);
  const weeklyCount = getWeeklyBookingCount(appointments, currentUser.id);

  const coachOfAppt = (coachId: string) => coaches.find((c) => c.id === coachId);
  const venueOfAppt = (venueId: string) => venues.find((v) => v.id === venueId);

  const handleCancel = () => {
    if (!cancelTarget) return;
    const result = cancelBooking(cancelTarget.id);
    setCancelTarget(null);
    if (!result.ok) {
      setToast({ msg: result.error ?? '取消失败', type: 'error' });
      return;
    }
    if (result.isViolation) {
      setToast({ msg: '已取消,本次记违约一次(开课前 24h 内)', type: 'info' });
    } else {
      setToast({ msg: '已取消,不影响信用', type: 'success' });
    }
  };

  // 是否可取消(pending/approved 才可)
  const canCancel = (a: Appointment) => ['pending', 'approved'].includes(a.status);

  return (
    <div className="max-w-content mx-auto px-6 py-8">
      {/* 用户信息卡 */}
      <div className="card p-6 mb-6">
        <div className="flex items-start gap-4 flex-wrap">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary-light text-white flex items-center justify-center font-bold text-2xl shrink-0">
            {avatarInitial(currentUser.name)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1 className="text-xl font-bold text-text-primary">{currentUser.name}</h1>
              <span className="badge bg-primary-50 text-primary">
                {currentUser.role === 'admin' ? '管理员' : currentUser.role === 'coach' ? '认证教练' : '普通社员'}
              </span>
            </div>
            <p className="text-sm text-text-secondary flex items-center gap-3 flex-wrap">
              <span className="flex items-center gap-1"><GraduationCap size={12} /> {currentUser.department}</span>
              <span className="text-text-tertiary">{currentUser.grade}</span>
              <span className="text-text-tertiary">学号:{currentUser.studentId}</span>
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/booking" className="btn-primary text-sm">
              <Calendar size={14} /> 去预约
            </Link>
            {currentUser.role === 'coach' && currentCoach && (
              <Link href="/coach-center" className="btn-outline text-sm">
                <Dumbbell size={14} /> 教练中心
              </Link>
            )}
            {currentUser.role === 'admin' && (
              <Link href="/admin" className="btn-outline text-sm">
                管理后台 <ArrowRight size={14} />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* 额度 + 违约 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-text-secondary">本周预约额度</span>
            <Calendar size={16} className="text-primary" />
          </div>
          <div className="flex items-end gap-2 mb-2">
            <span className="text-2xl font-bold text-text-primary">{weeklyCount}</span>
            <span className="text-sm text-text-tertiary pb-1">/ {MAX_WEEKLY_BOOKINGS} 次</span>
          </div>
          <div className="w-full h-2 rounded-full bg-bg-warm overflow-hidden">
            <div
              className={`h-full transition-all ${weeklyCount >= MAX_WEEKLY_BOOKINGS ? 'bg-warning' : 'bg-primary'}`}
              style={{ width: `${Math.min(weeklyCount / MAX_WEEKLY_BOOKINGS * 100, 100)}%` }}
            />
          </div>
          <p className="text-xs text-text-tertiary mt-2">
            {weeklyCount >= MAX_WEEKLY_BOOKINGS ? '本周已满额,下周一重置' : `本周还可预约 ${MAX_WEEKLY_BOOKINGS - weeklyCount} 次`}
          </p>
        </div>

        <div className={`card p-5 ${banStatus.banned ? 'border-danger/30' : currentUser.violationCount > 0 ? 'border-warning/40' : ''}`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-text-secondary">违约记录</span>
            {banStatus.banned ? <Ban size={16} className="text-danger" /> : <AlertTriangle size={16} className={currentUser.violationCount > 0 ? 'text-warning' : 'text-text-tertiary'} />}
          </div>
          <div className="flex items-end gap-2 mb-2">
            <span className={`text-2xl font-bold ${banStatus.banned ? 'text-danger' : currentUser.violationCount > 0 ? 'text-warning' : 'text-text-primary'}`}>
              {currentUser.violationCount}
            </span>
            <span className="text-sm text-text-tertiary pb-1">/ 3 次(触发禁约)</span>
          </div>
          {banStatus.banned ? (
            <div className="p-2 rounded-md bg-danger/10 text-danger text-xs">
              已禁约 · 剩余 {banStatus.remainingDays} 天解除
            </div>
          ) : currentUser.violationCount > 0 ? (
            <p className="text-xs text-amber-700">已违约 {currentUser.violationCount} 次,3 次将禁约 30 天</p>
          ) : (
            <p className="text-xs text-text-tertiary">信用良好,继续保持</p>
          )}
        </div>
      </div>

      {/* 教练申请入口(普通社员) */}
      {currentUser.role === 'member' && !banStatus.banned && (
        <div className="card p-5 mb-6 bg-primary-50 border-primary">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary text-white flex items-center justify-center">
                <Award size={18} />
              </div>
              <div>
                <h3 className="font-medium text-text-primary">想成为认证教练?</h3>
                <p className="text-sm text-text-secondary">申请成为教练,带练社员、积累经验</p>
              </div>
            </div>
            <button onClick={() => setShowApply(true)} className="btn-outline text-sm">申请成为教练</button>
          </div>
        </div>
      )}

      {/* 我的预约 */}
      <div className="card p-5">
        <h2 className="text-lg font-semibold text-text-primary mb-4">我的预约</h2>

        {/* Tab */}
        <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
          {PROFILE_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`shrink-0 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                tab === t.key ? 'bg-primary text-white' : 'bg-bg-warm text-text-secondary hover:bg-primary-50 hover:text-primary'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* 列表 */}
        {filteredAppts.length === 0 ? (
          <EmptyState
            icon={<Calendar size={28} />}
            title="暂无预约记录"
            description={tab === 'all' ? '去预约页发起你的第一次带练吧' : '该分类下暂无预约'}
            actionLabel={tab === 'all' ? '去预约' : undefined}
            onAction={tab === 'all' ? () => router.push('/booking') : undefined}
          />
        ) : (
          <div className="space-y-3">
            {filteredAppts.map((a) => {
              const coach = coachOfAppt(a.coachId);
              const venue = venueOfAppt(a.venueId);
              const free = canCancelFree(a.date, a.startTime);
              const hrs = hoursUntilStart(a.date, a.startTime);
              const cancellable = canCancel(a);

              return (
                <div key={a.id} className="flex items-stretch rounded-lg border border-border-light overflow-hidden">
                  {/* 状态色条 */}
                  <div className={`w-1 ${a.status === 'pending' ? 'bg-warning' : a.status === 'approved' ? 'bg-success' : a.status === 'no_show' ? 'bg-danger' : 'bg-text-tertiary'}`} />

                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <StatusBadge status={a.status} />
                          <span className="text-sm font-medium text-text-primary">{venue?.name ?? '未知场馆'}</span>
                        </div>
                        <p className="text-xs text-text-secondary mb-1 flex items-center gap-1">
                          <Clock size={12} /> {formatDateTime(a.date, a.startTime, a.endTime)}
                        </p>
                        <p className="text-xs text-text-tertiary flex items-center gap-1">
                          <MapPin size={12} /> {venue ? CAMPUS_LABELS[venue.campus] : ''} · 教练:{coach?.name ?? '未知'}
                        </p>
                        {a.trainingNote && (
                          <p className="text-xs text-text-secondary mt-2 italic">需求:{a.trainingNote}</p>
                        )}
                        {a.cancelReason && ['cancelled', 'rejected', 'expired'].includes(a.status) && (
                          <p className="text-xs text-text-tertiary mt-2">原因:{a.cancelReason}</p>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        {cancellable && (
                          <button
                            onClick={() => setCancelTarget(a)}
                            className={`btn text-xs ${free ? 'btn-outline' : 'bg-warning/20 text-amber-700 hover:bg-warning/30'}`}
                          >
                            <X size={12} /> 取消预约
                          </button>
                        )}
                        {cancellable && !free && (
                          <span className="text-[10px] text-amber-700 flex items-center gap-0.5">
                            <AlertTriangle size={10} /> 距开课 {hrs}h,取消记违约
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 取消确认弹窗 */}
      <Modal open={!!cancelTarget} onClose={() => setCancelTarget(null)} title="确认取消预约?" size="sm">
        {cancelTarget && (() => {
          const free = canCancelFree(cancelTarget.date, cancelTarget.startTime);
          const hrs = hoursUntilStart(cancelTarget.date, cancelTarget.startTime);
          const venue = venueOfAppt(cancelTarget.venueId);
          return (
            <div>
              <div className="p-3 rounded-md bg-bg-warm mb-3 text-sm">
                <div className="font-medium text-text-primary">{venue?.name}</div>
                <div className="text-text-secondary text-xs mt-1">
                  {formatDateTime(cancelTarget.date, cancelTarget.startTime, cancelTarget.endTime)}
                </div>
              </div>
              {free ? (
                <div className="p-3 rounded-md bg-success/15 text-emerald-700 text-xs flex items-start gap-2 mb-4">
                  <Info size={14} className="mt-0.5 shrink-0" />
                  <span>距离开课超过 24 小时,本次取消<span className="font-medium">不影响信用记录</span>。</span>
                </div>
              ) : (
                <div className="p-3 rounded-md bg-warning/15 text-amber-700 text-xs flex items-start gap-2 mb-4">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                  <span>
                    距离开课仅 {hrs} 小时,取消将<span className="font-medium">记违约一次</span>。
                    当前违约 {currentUser.violationCount}/3 次,达到 3 次将禁约 30 天。
                  </span>
                </div>
              )}
              <div className="flex gap-2">
                <button onClick={() => setCancelTarget(null)} className="btn-ghost flex-1">再想想</button>
                <button
                  onClick={handleCancel}
                  className={`btn flex-1 ${free ? 'btn-primary' : 'bg-warning text-white hover:opacity-90'}`}
                >
                  确认取消
                </button>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* 教练申请弹窗 */}
      <CoachApplyModal open={showApply} onClose={() => setShowApply(false)} onApply={(d) => { applyCoach(d); setShowApply(false); setToast({ msg: '申请已提交,等待管理员审核', type: 'success' }); }} />

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

// 教练申请弹窗
function CoachApplyModal({ open, onClose, onApply }: {
  open: boolean;
  onClose: () => void;
  onApply: (d: { specialties: string[]; styleDesc: string; isBeginnerFriendly: boolean; isFemaleFriendly: boolean; venues: string[] }) => void;
}) {
  const { venues } = useApp();
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [specialtyInput, setSpecialtyInput] = useState('');
  const [styleDesc, setStyleDesc] = useState('');
  const [beginner, setBeginner] = useState(false);
  const [female, setFemale] = useState(false);
  const [venueIds, setVenueIds] = useState<string[]>([]);
  const [error, setError] = useState('');

  const bookable = venues.filter((v) => v.bookable);

  const toggleVenue = (id: string) => {
    setVenueIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const addSpecialty = () => {
    const v = specialtyInput.trim();
    if (v && !specialties.includes(v) && specialties.length < 5) {
      setSpecialties([...specialties, v]);
      setSpecialtyInput('');
    }
  };

  const submit = () => {
    if (specialties.length === 0) { setError('请至少添加一个擅长领域'); return; }
    if (!styleDesc.trim()) { setError('请填写带练风格'); return; }
    if (venueIds.length === 0) { setError('请至少选择一个关联场馆'); return; }
    setError('');
    onApply({ specialties, styleDesc: styleDesc.trim(), isBeginnerFriendly: beginner, isFemaleFriendly: female, venues: venueIds });
  };

  return (
    <Modal open={open} onClose={onClose} title="申请成为认证教练" size="lg">
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">擅长领域(最多 5 个)</label>
          <div className="flex gap-2">
            <input
              value={specialtyInput}
              onChange={(e) => setSpecialtyInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSpecialty())}
              placeholder="如:力量训练、有氧减脂"
              className="input flex-1"
            />
            <button onClick={addSpecialty} className="btn-outline text-sm">添加</button>
          </div>
          {specialties.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {specialties.map((s) => (
                <span key={s} className="badge bg-primary-50 text-primary">
                  {s}
                  <button onClick={() => setSpecialties(specialties.filter((x) => x !== s))} className="ml-1">
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">带练风格自述(100 字以内)</label>
          <textarea
            value={styleDesc}
            onChange={(e) => setStyleDesc(e.target.value.slice(0, 100))}
            className="textarea"
            rows={3}
            placeholder="介绍你的带练理念、适合什么类型的学员"
          />
          <div className="text-right text-xs text-text-tertiary">{styleDesc.length}/100</div>
        </div>

        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
            <input type="checkbox" checked={beginner} onChange={(e) => setBeginner(e.target.checked)} className="accent-primary" />
            新手友好
          </label>
          <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
            <input type="checkbox" checked={female} onChange={(e) => setFemale(e.target.checked)} className="accent-primary" />
            女生教练
          </label>
        </div>

        <div>
          <label className="block text-xs font-medium text-text-secondary mb-2">关联场馆(可多选)</label>
          <div className="flex flex-wrap gap-2">
            {bookable.map((v) => (
              <button
                key={v.id}
                onClick={() => toggleVenue(v.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-all ${
                  venueIds.includes(v.id) ? 'bg-primary text-white border-primary' : 'bg-surface border-border-light text-text-secondary hover:border-primary'
                }`}
              >
                {v.name}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-xs text-danger">{error}</p>}

        <div className="flex gap-2 pt-2 border-t border-border-light">
          <button onClick={onClose} className="btn-ghost flex-1">取消</button>
          <button onClick={submit} className="btn-primary flex-1">提交申请</button>
        </div>
      </div>
    </Modal>
  );
}
