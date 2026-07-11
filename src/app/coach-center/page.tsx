'use client';

// 教练中心
import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Dumbbell, Calendar, Check, X, Clock, MapPin, UserCircle,
  Pencil, CheckCircle2, History, Plus,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { CAMPUS_LABELS, COACH_TABS } from '@/lib/constants';
import { avatarInitial, formatDate, formatDateTime, getNextNDays, weekdayLabel } from '@/lib/utils';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';
import Modal from '@/components/ui/Modal';
import Toast from '@/components/ui/Toast';
import type { Appointment } from '@/lib/types';

export default function CoachCenterPage() {
  const {
    currentUser, currentCoach, venues, users, slots, appointments,
    coachApproveAppointment, coachRejectAppointment, coachCompleteAppointment,
    coachToggleSlot, coachAddSlot, coachUpdateProfile,
  } = useApp();
  const [tab, setTab] = useState<string>('pending');
  const [rejectTarget, setRejectTarget] = useState<Appointment | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [showAddSlot, setShowAddSlot] = useState(false);

  // Hooks 必须在 early return 之前调用
  const myReceived = useMemo(
    () => (currentCoach ? appointments.filter((a) => a.coachId === currentCoach.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)) : []),
    [appointments, currentCoach],
  );
  const filteredReceived = useMemo(() => {
    if (tab === 'completed') return myReceived.filter((a) => a.status === 'completed');
    return myReceived.filter((a) => a.status === tab);
  }, [myReceived, tab]);

  const mySlots = useMemo(
    () => (currentCoach ? slots.filter((s) => s.coachId === currentCoach.id) : []),
    [slots, currentCoach],
  );

  if (!currentUser) {
    return (
      <div className="max-w-content mx-auto px-6 py-16 text-center">
        <UserCircle size={48} className="text-text-tertiary mx-auto mb-3" />
        <p className="text-text-secondary mb-4">请先登录</p>
        <Link href="/login" className="btn-primary">去登录</Link>
      </div>
    );
  }

  if (currentUser.role !== 'coach' || !currentCoach) {
    return (
      <div className="max-w-content mx-auto px-6 py-16 text-center">
        <Dumbbell size={48} className="text-text-tertiary mx-auto mb-3" />
        <h2 className="text-lg font-medium text-text-primary mb-2">仅认证教练可访问</h2>
        <p className="text-sm text-text-secondary mb-4">如果你是普通社员,可在个人中心申请成为教练</p>
        <Link href="/profile" className="btn-outline">前往个人中心</Link>
      </div>
    );
  }

  const studentOf = (sid: string) => users.find((u) => u.id === sid);
  const venueOf = (vid: string) => venues.find((v) => v.id === vid);

  const handleApprove = (a: Appointment) => {
    coachApproveAppointment(a.id);
    setToast({ msg: '已通过预约', type: 'success' });
  };
  const handleReject = () => {
    if (!rejectTarget) return;
    if (!rejectReason.trim()) { setToast({ msg: '请填写拒绝原因', type: 'error' }); return; }
    coachRejectAppointment(rejectTarget.id, rejectReason.trim());
    setRejectTarget(null);
    setRejectReason('');
    setToast({ msg: '已拒绝预约', type: 'info' });
  };
  const handleComplete = (a: Appointment) => {
    coachCompleteAppointment(a.id);
    setToast({ msg: '已标记完成,累计带练 +1', type: 'success' });
  };

  return (
    <div className="max-w-content mx-auto px-6 py-8">
      {/* 教练资料卡 */}
      <div className="card p-6 mb-6">
        <div className="flex items-start gap-4 flex-wrap">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary-light text-white flex items-center justify-center font-bold text-2xl shrink-0">
            {avatarInitial(currentCoach.name)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1 className="text-xl font-bold text-text-primary">{currentCoach.name}</h1>
              <span className="badge bg-success/30 text-status-success">认证教练</span>
            </div>
            <p className="text-sm text-text-secondary mb-2">{currentUser.department} · {currentUser.grade}</p>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {currentCoach.specialties.map((s) => (
                <span key={s} className="badge bg-primary-50 text-primary">{s}</span>
              ))}
              {currentCoach.isBeginnerFriendly && <span className="badge bg-accent-light text-accent">新手友好</span>}
              {currentCoach.isFemaleFriendly && <span className="badge bg-accent-light text-accent">女生教练</span>}
            </div>
            <p className="text-xs text-text-secondary italic">"{currentCoach.styleDesc}"</p>
            <div className="flex gap-4 mt-2 text-xs text-text-tertiary">
              <span>累计带练 {currentCoach.totalSessions} 次</span>
              <span>服务社员 {currentCoach.totalStudents} 人</span>
            </div>
          </div>
          <button onClick={() => setShowProfileEdit(true)} className="btn-outline text-sm">
            <Pencil size={14} /> 编辑资料
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* 左:收到的预约 */}
        <div>
          <div className="card p-5">
            <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Calendar size={18} /> 收到的预约
            </h2>

            <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
              {COACH_TABS.map((t) => (
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

            {filteredReceived.length === 0 ? (
              <EmptyState
                icon={<Calendar size={28} />}
                title="暂无预约"
                description={tab === 'pending' ? '有新的预约时会显示在这里' : '该分类下暂无记录'}
              />
            ) : (
              <div className="space-y-3">
                {filteredReceived.map((a) => {
                  const stu = studentOf(a.studentId);
                  const venue = venueOf(a.venueId);
                  return (
                    <div key={a.id} className="rounded-lg border border-border-light p-4">
                      <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
                        <div className="flex items-center gap-2">
                          <StatusBadge status={a.status} />
                          <span className="text-sm font-medium text-text-primary">{venue?.name}</span>
                        </div>
                        <span className="text-xs text-text-tertiary">{formatDateTime(a.date, a.startTime, a.endTime)}</span>
                      </div>
                      <div className="text-xs text-text-secondary space-y-1">
                        <p>学员:{stu?.name ?? '未知'} · {stu?.department}</p>
                        <p className="flex items-center gap-1"><MapPin size={11} /> {venue ? CAMPUS_LABELS[venue.campus] : ''}</p>
                        {a.trainingNote && <p className="italic">需求:{a.trainingNote}</p>}
                        {a.cancelReason && <p className="text-text-tertiary">原因:{a.cancelReason}</p>}
                      </div>
                      {a.status === 'pending' && (
                        <div className="flex gap-2 mt-3">
                          <button onClick={() => handleApprove(a)} className="btn-primary text-xs flex-1">
                            <Check size={12} /> 通过
                          </button>
                          <button onClick={() => { setRejectTarget(a); setRejectReason(''); }} className="btn-ghost text-xs flex-1 border border-border">
                            <X size={12} /> 拒绝
                          </button>
                        </div>
                      )}
                      {a.status === 'approved' && (
                        <div className="mt-3">
                          <button onClick={() => handleComplete(a)} className="btn-outline text-xs w-full">
                            <CheckCircle2 size={12} /> 标记课程完成
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* 右:时段管理 */}
        <aside>
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                <Clock size={16} /> 我的可约时段
              </h2>
              <button onClick={() => setShowAddSlot(true)} className="btn-outline text-xs px-2 py-1">
                <Plus size={12} /> 添加
              </button>
            </div>
            {mySlots.length === 0 ? (
              <p className="text-xs text-text-tertiary text-center py-4">暂未设置可约时段</p>
            ) : (
              <div className="space-y-2">
                {mySlots.map((s) => {
                  const venue = venueOf(s.venueId);
                  return (
                    <div key={s.id} className={`p-2 rounded-md border text-xs ${s.isAvailable ? 'border-success/40 bg-success/10' : 'border-border-light bg-bg-warm opacity-60'}`}>
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-text-primary">{formatDate(new Date(`${s.date}T00:00:00`))} {weekdayLabel(new Date(`${s.date}T00:00:00`))}</span>
                        <button onClick={() => coachToggleSlot(s.id)} className={`text-[10px] ${s.isAvailable ? 'text-status-success' : 'text-text-tertiary'}`}>
                          {s.isAvailable ? '已开放' : '已关闭'}
                        </button>
                      </div>
                      <div className="text-text-secondary mt-0.5">{s.startTime}-{s.endTime} · {venue?.name}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="card p-5 mt-4">
            <h2 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
              <History size={16} /> 带练统计
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-md bg-bg-warm">
                <div className="text-2xl font-bold text-primary">{currentCoach.totalSessions}</div>
                <div className="text-xs text-text-tertiary">累计带练次数</div>
              </div>
              <div className="p-3 rounded-md bg-bg-warm">
                <div className="text-2xl font-bold text-primary">{currentCoach.totalStudents}</div>
                <div className="text-xs text-text-tertiary">服务社员数</div>
              </div>
              <div className="p-3 rounded-md bg-success/10">
                <div className="text-2xl font-bold text-status-success">
                  {myReceived.filter((a) => a.status === 'completed').length}
                </div>
                <div className="text-xs text-text-tertiary">已完成课程</div>
              </div>
              <div className="p-3 rounded-md bg-info/10">
                <div className="text-2xl font-bold text-status-info">
                  {Math.round((myReceived.filter((a) => a.status === 'approved').length / Math.max(myReceived.length, 1)) * 100)}%
                </div>
                <div className="text-xs text-text-tertiary">通过率</div>
              </div>
              <div className="p-3 rounded-md bg-primary-50">
                <div className="text-2xl font-bold text-primary">
                  {mySlots.filter((s) => s.isAvailable).length}
                </div>
                <div className="text-xs text-text-tertiary">开放时段</div>
              </div>
              <div className="p-3 rounded-md bg-accent/10">
                <div className="text-2xl font-bold text-accent">
                  {myReceived.filter((a) => a.status === 'pending').length}
                </div>
                <div className="text-xs text-text-tertiary">待处理预约</div>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* 拒绝弹窗 */}
      <Modal open={!!rejectTarget} onClose={() => setRejectTarget(null)} title="拒绝预约" size="sm">
        {rejectTarget && (
          <div>
            <p className="text-sm text-text-secondary mb-3">
              请填写拒绝原因(学员可见):
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="例如:该时段已满,请改约其他时间"
              className="textarea"
              rows={3}
            />
            <div className="flex gap-2 mt-3">
              <button onClick={() => setRejectTarget(null)} className="btn-ghost flex-1">取消</button>
              <button onClick={handleReject} className="btn-danger flex-1">确认拒绝</button>
            </div>
          </div>
        )}
      </Modal>

      {/* 资料编辑弹窗 */}
      <ProfileEditModal
        open={showProfileEdit}
        onClose={() => setShowProfileEdit(false)}
        coach={currentCoach}
        venues={venues.filter((v) => v.bookable)}
        onSave={(patch) => { coachUpdateProfile(patch); setShowProfileEdit(false); setToast({ msg: '资料已更新', type: 'success' }); }}
      />

      {/* 添加时段弹窗 */}
      <AddSlotModal
        open={showAddSlot}
        onClose={() => setShowAddSlot(false)}
        coachId={currentCoach.id}
        venues={venues.filter((v) => v.bookable)}
        onAdd={(slot) => { coachAddSlot(slot); setShowAddSlot(false); setToast({ msg: '时段已添加', type: 'success' }); }}
      />

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

// 资料编辑
function ProfileEditModal({ open, onClose, coach, venues, onSave }: {
  open: boolean;
  onClose: () => void;
  coach: { specialties: string[]; styleDesc: string; isBeginnerFriendly: boolean; isFemaleFriendly: boolean; venues: string[] };
  venues: { id: string; name: string }[];
  onSave: (patch: { specialties: string[]; styleDesc: string; isBeginnerFriendly: boolean; isFemaleFriendly: boolean; venues: string[] }) => void;
}) {
  const [specialties, setSpecialties] = useState(coach.specialties);
  const [input, setInput] = useState('');
  const [styleDesc, setStyleDesc] = useState(coach.styleDesc);
  const [beginner, setBeginner] = useState(coach.isBeginnerFriendly);
  const [female, setFemale] = useState(coach.isFemaleFriendly);
  const [venueIds, setVenueIds] = useState(coach.venues);

  const add = () => {
    const v = input.trim();
    if (v && !specialties.includes(v) && specialties.length < 5) {
      setSpecialties([...specialties, v]);
      setInput('');
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="编辑教练资料" size="lg">
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">擅长领域</label>
          <div className="flex gap-2">
            <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), add())} className="input flex-1" placeholder="回车添加" />
            <button onClick={add} className="btn-outline text-sm">添加</button>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {specialties.map((s) => (
              <span key={s} className="badge bg-primary-50 text-primary">{s}<button onClick={() => setSpecialties(specialties.filter((x) => x !== s))} className="ml-1"><X size={10} /></button></span>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">带练风格(100 字)</label>
          <textarea value={styleDesc} onChange={(e) => setStyleDesc(e.target.value.slice(0, 100))} className="textarea" rows={3} />
        </div>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={beginner} onChange={(e) => setBeginner(e.target.checked)} className="accent-primary" /> 新手友好</label>
          <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={female} onChange={(e) => setFemale(e.target.checked)} className="accent-primary" /> 女生教练</label>
        </div>
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-2">关联场馆</label>
          <div className="flex flex-wrap gap-2">
            {venues.map((v) => (
              <button key={v.id} onClick={() => setVenueIds(venueIds.includes(v.id) ? venueIds.filter((x) => x !== v.id) : [...venueIds, v.id])}
                className={`px-3 py-1.5 rounded-md text-xs border ${venueIds.includes(v.id) ? 'bg-primary text-white border-primary' : 'bg-surface border-border-light text-text-secondary'}`}>
                {v.name}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2 pt-2 border-t border-border-light">
          <button onClick={onClose} className="btn-ghost flex-1">取消</button>
          <button onClick={() => onSave({ specialties, styleDesc, isBeginnerFriendly: beginner, isFemaleFriendly: female, venues: venueIds })} className="btn-primary flex-1">保存</button>
        </div>
      </div>
    </Modal>
  );
}

// 添加时段
function AddSlotModal({ open, onClose, coachId, venues, onAdd }: {
  open: boolean;
  onClose: () => void;
  coachId: string;
  venues: { id: string; name: string }[];
  onAdd: (slot: { coachId: string; venueId: string; date: string; startTime: string; endTime: string; isAvailable: boolean }) => void;
}) {
  const days = getNextNDays(7);
  const [venueId, setVenueId] = useState(venues[0]?.id ?? '');
  const [date, setDate] = useState(formatDate(days[0]));
  const [startTime, setStartTime] = useState('10:00');

  const submit = () => {
    const [h] = startTime.split(':').map(Number);
    const endH = String(h + 1).padStart(2, '0');
    onAdd({ coachId, venueId, date, startTime, endTime: `${endH}:00`, isAvailable: true });
  };

  return (
    <Modal open={open} onClose={onClose} title="添加可约时段" size="sm">
      <div className="space-y-3">
        <div>
          <label className="block text-xs text-text-secondary mb-1">场馆</label>
          <select value={venueId} onChange={(e) => setVenueId(e.target.value)} className="input">
            {venues.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-text-secondary mb-1">日期</label>
          <select value={date} onChange={(e) => setDate(e.target.value)} className="input">
            {days.map((d) => {
              const ds = formatDate(d);
              return <option key={ds} value={ds}>{ds} {weekdayLabel(d)}</option>;
            })}
          </select>
        </div>
        <div>
          <label className="block text-xs text-text-secondary mb-1">开始时间</label>
          <select value={startTime} onChange={(e) => setStartTime(e.target.value)} className="input">
            {Array.from({ length: 14 }, (_, i) => i + 8).map((h) => {
              const t = `${String(h).padStart(2, '0')}:00`;
              return <option key={t} value={t}>{t}</option>;
            })}
          </select>
        </div>
        <div className="flex gap-2 pt-2 border-t border-border-light">
          <button onClick={onClose} className="btn-ghost flex-1">取消</button>
          <button onClick={submit} className="btn-primary flex-1">添加</button>
        </div>
      </div>
    </Modal>
  );
}
