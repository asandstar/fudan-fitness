'use client';

// 教练预约页 — 3 步向导(核心页面)
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, ArrowRight, Check, AlertCircle, Clock, Shield,
  Loader2, Info, Ban, CalendarDays, MapPin, UserCircle,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { CAMPUS_LABELS, MAX_WEEKLY_BOOKINGS, TRAINING_NOTE_MAX } from '@/lib/constants';
import {
  avatarInitial, checkBanStatus, getWeeklyBookingCount, formatDate, getNextNDays, weekdayLabel,
} from '@/lib/utils';
import TimeSlotGrid from '@/components/ui/TimeSlotGrid';
import CoachCard from '@/components/ui/CoachCard';
import Modal from '@/components/ui/Modal';
import Toast from '@/components/ui/Toast';
import AITrainingSuggestion from '@/components/ui/AITrainingSuggestion';
import type { BookingDraft } from '@/lib/types';

const STEPS = [
  { num: 1, label: '选择场馆' },
  { num: 2, label: '选择时段' },
  { num: 3, label: '确认预约' },
];

export default function BookingPage() {
  return (
    <Suspense fallback={<div className="max-w-content mx-auto px-6 py-16 text-center text-text-tertiary">加载中...</div>}>
      <BookingInner />
    </Suspense>
  );
}

function BookingInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { venues, coaches, slots, appointments, currentUser, createBooking } = useApp();

  const [step, setStep] = useState(1);
  const [venueId, setVenueId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedStartTime, setSelectedStartTime] = useState<string | null>(null);
  const [selectedEndTime, setSelectedEndTime] = useState<string | null>(null);
  const [coachId, setCoachId] = useState<string | null>(null);
  const [trainingNote, setTrainingNote] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [error, setError] = useState('');

  const days = useMemo(() => getNextNDays(7), []);

  // 从 URL 预选场馆和教练
  useEffect(() => {
    const v = searchParams.get('venue');
    if (v && venues.some((x) => x.id === v && x.bookable)) setVenueId(v);
    const c = searchParams.get('coach');
    if (c && coaches.some((x) => x.id === c)) setCoachId(c);
  }, [searchParams, venues, coaches]);

  // 登录检查
  useEffect(() => {
    if (!currentUser) {
      setToast({ msg: '请先登录', type: 'error' });
      setTimeout(() => router.push('/login'), 800);
    }
  }, [currentUser, router]);

  const bookableVenues = useMemo(() => venues.filter((v) => v.bookable).sort((a, b) => a.displayOrder - b.displayOrder), [venues]);
  const selectedVenue = useMemo(() => venues.find((v) => v.id === venueId), [venues, venueId]);

  // 禁约 / 额度
  const banStatus = currentUser ? checkBanStatus(currentUser) : { banned: false };
  const weeklyCount = currentUser ? getWeeklyBookingCount(appointments, currentUser.id) : 0;
  const quotaExceeded = weeklyCount >= MAX_WEEKLY_BOOKINGS;

  // 该场馆可用时段
  const venueSlots = useMemo(() => slots.filter((s) => s.venueId === venueId), [slots, venueId]);

  // 已被预约的时段集合(date|startTime)
  const occupiedSlots = useMemo(() => {
    const set = new Set<string>();
    for (const a of appointments) {
      if (['pending', 'approved'].includes(a.status) && a.venueId === venueId) {
        set.add(`${a.date}|${a.startTime}`);
      }
    }
    return set;
  }, [appointments, venueId]);

  // 选中时段下可用教练(排冲突)
  const availableCoaches = useMemo(() => {
    if (!selectedDate || !selectedStartTime || !venueId) return [];
    const slotCoachIds = venueSlots
      .filter((s) => s.date === selectedDate && s.startTime === selectedStartTime && s.isAvailable)
      .map((s) => s.coachId);
    // 排除该时段已被预约的教练
    const occupiedCoachIds = new Set(
      appointments
        .filter(
          (a) =>
            a.venueId === venueId &&
            a.date === selectedDate &&
            a.startTime === selectedStartTime &&
            ['pending', 'approved'].includes(a.status),
        )
        .map((a) => a.coachId),
    );
    return coaches.filter((c) => c.certStatus === 'approved' && slotCoachIds.includes(c.id) && !occupiedCoachIds.has(c.id));
  }, [venueSlots, selectedDate, selectedStartTime, venueId, appointments, coaches]);

  const selectedCoach = useMemo(() => coaches.find((c) => c.id === coachId), [coaches, coachId]);

  // ===== 拦截:未登录/禁约/满额 =====
  if (!currentUser) {
    return (
      <div className="max-w-content mx-auto px-6 py-16 text-center">
        <p className="text-text-secondary mb-4">请先登录后再预约</p>
        <Link href="/login" className="btn-primary">去登录</Link>
      </div>
    );
  }

  if (banStatus.banned) {
    return (
      <div className="max-w-content mx-auto px-6 py-8">
        <div className="card p-8 border-danger/30 bg-danger/5 text-center">
          <div className="w-14 h-14 rounded-full bg-danger/15 text-danger flex items-center justify-center mx-auto mb-4">
            <Ban size={28} />
          </div>
          <h2 className="text-lg font-bold text-danger mb-2">您已被禁约</h2>
          <p className="text-sm text-text-secondary mb-1">
            因累计违约 {currentUser.violationCount} 次,您的预约功能已被暂停。
          </p>
          <p className="text-sm text-text-secondary mb-4">
            禁约解除时间:剩余 <span className="font-bold text-danger">{banStatus.remainingDays}</span> 天
          </p>
          <p className="text-xs text-text-tertiary mb-4">如认为有误,可联系管理员在后台解除禁约。</p>
          <Link href="/profile" className="btn-outline">返回个人中心</Link>
        </div>
      </div>
    );
  }

  // ===== 步骤切换 =====
  const handleVenueSelect = (id: string) => {
    setVenueId(id);
    setSelectedDate(null);
    setSelectedStartTime(null);
    setSelectedEndTime(null);
    setCoachId(null);
    setStep(2);
  };

  const handleSlotSelect = (date: string, startTime: string, endTime: string) => {
    if (!startTime) {
      // 仅选了日期
      setSelectedDate(date);
      setSelectedStartTime(null);
      setSelectedEndTime(null);
      setCoachId(null);
      return;
    }
    setSelectedDate(date);
    setSelectedStartTime(startTime);
    setSelectedEndTime(endTime);
    setCoachId(null);
  };

  const handleCoachSelect = (id: string) => {
    setCoachId(id);
  };

  const goStep3 = () => {
    if (!coachId) {
      setError('请选择一位教练');
      return;
    }
    setError('');
    setStep(3);
  };

  // ===== 提交预约(防重复点击) =====
  const handleSubmit = async () => {
    if (submitting) return;
    if (!venueId || !selectedDate || !selectedStartTime || !selectedEndTime || !coachId) {
      setError('预约信息不完整');
      return;
    }
    setSubmitting(true);
    setError('');

    // 模拟异步
    await new Promise((r) => setTimeout(r, 600));

    const draft: BookingDraft = {
      venueId,
      date: selectedDate,
      startTime: selectedStartTime,
      endTime: selectedEndTime,
      coachId,
      trainingNote: trainingNote.slice(0, TRAINING_NOTE_MAX),
    };
    const result = await createBooking(draft);
    setSubmitting(false);

    if (!result.ok) {
      setError(result.error ?? '预约失败');
      setToast({ msg: result.error ?? '预约失败', type: 'error' });
      return;
    }

    setShowConfirm(false);
    setToast({ msg: '预约提交成功,等待教练审核', type: 'success' });
    setTimeout(() => router.push('/profile'), 1000);
  };

  return (
    <div className="max-w-content mx-auto px-6 py-8">
      {/* 顶部额度提示 */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">预约带练</h1>
          <p className="text-sm text-text-secondary mt-1">选择场馆、时段和教练,完成预约</p>
        </div>
        <div className={`px-4 py-2 rounded-lg text-sm font-medium ${quotaExceeded ? 'bg-warning/20 text-status-warning' : 'bg-primary-50 text-primary'}`}>
          本周已预约 <span className="font-bold">{weeklyCount}</span> / {MAX_WEEKLY_BOOKINGS} 次
        </div>
      </div>

      {/* 满额提示 */}
      {quotaExceeded && (
        <div className="mb-4 p-3 rounded-lg bg-warning/15 text-status-warning text-sm flex items-center gap-2">
          <AlertCircle size={16} /> 本周预约次数已达上限({MAX_WEEKLY_BOOKINGS} 次),无法继续预约。下周一再试。
        </div>
      )}

      {/* 步骤指示器 */}
      <div className="card p-4 mb-6">
        <div className="flex items-center justify-between">
          {STEPS.map((s, i) => (
            <div key={s.num} className="flex items-center flex-1 last:flex-none">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  step > s.num ? 'bg-success text-white' : step === s.num ? 'bg-primary text-white' : 'bg-bg-warm text-text-tertiary'
                }`}>
                  {step > s.num ? <Check size={16} /> : s.num}
                </div>
                <span className={`text-sm font-medium hidden sm:inline ${step >= s.num ? 'text-text-primary' : 'text-text-tertiary'}`}>
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-3 ${step > s.num ? 'bg-success' : 'bg-border-light'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 步骤 1:选择场馆 */}
      {step === 1 && (
        <div>
          <h2 className="text-lg font-semibold text-text-primary mb-4">选择场馆(仅可预约场馆)</h2>
          {quotaExceeded ? (
            <div className="card p-8 text-center">
              <AlertCircle size={32} className="text-warning mx-auto mb-3" />
              <p className="text-text-secondary mb-4">本周已满额,无法选择场馆</p>
              <Link href="/profile" className="btn-outline">查看我的预约</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {bookableVenues.map((v) => (
                <button
                  key={v.id}
                  onClick={() => handleVenueSelect(v.id)}
                  disabled={quotaExceeded}
                  className="card p-5 text-left hover:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-text-primary">{v.name}</h3>
                    <span className="badge bg-success/30 text-status-success">可预约</span>
                  </div>
                  <p className="text-xs text-text-tertiary mb-2 flex items-center gap-1">
                    <MapPin size={12} /> {CAMPUS_LABELS[v.campus]}
                  </p>
                  <p className="text-sm text-text-secondary mb-3">{v.description}</p>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {v.facilities.slice(0, 3).map((f) => (
                      <span key={f} className="badge bg-primary-50 text-primary">{f}</span>
                    ))}
                  </div>
                  <div className="text-xs text-text-tertiary flex items-center gap-1">
                    <Clock size={12} /> {v.openTime}-{v.closeTime}
                  </div>
                  <div className="mt-3 text-primary text-sm font-medium flex items-center gap-1">
                    选择此场馆 <ArrowRight size={14} />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 步骤 2:选择时段+教练 */}
      {step === 2 && selectedVenue && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => setStep(1)} className="text-sm text-text-secondary hover:text-primary flex items-center gap-1">
                <ArrowLeft size={14} /> 返回选择场馆
              </button>
              <span className="text-sm font-medium text-text-primary">{selectedVenue.name}</span>
            </div>

            <TimeSlotGrid
              days={days}
              slots={venueSlots}
              occupiedSlots={occupiedSlots}
              selectedDate={selectedDate}
              selectedStartTime={selectedStartTime}
              onSelect={handleSlotSelect}
            />

            {/* 教练选择面板 */}
            {selectedDate && selectedStartTime && (
              <div className="mt-6">
                <h3 className="text-base font-semibold text-text-primary mb-3">
                  可用教练 · {availableCoaches.length} 位
                  <span className="text-xs text-text-tertiary ml-2 font-normal">
                    {formatDate(new Date(`${selectedDate}T00:00:00`))} {selectedStartTime}-{selectedEndTime}
                  </span>
                </h3>
                {availableCoaches.length === 0 ? (
                  <div className="card p-6 text-center text-sm text-text-tertiary">
                    该时段暂无可用教练,请选择其他时段
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {availableCoaches.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => handleCoachSelect(c.id)}
                        className={`card p-4 text-left transition-all ${
                          coachId === c.id ? 'border-primary ring-2 ring-primary-50' : 'hover:border-primary'
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-light text-white flex items-center justify-center font-bold">
                            {avatarInitial(c.name)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1">
                              <span className="font-medium text-text-primary text-sm truncate">{c.name}</span>
                              {coachId === c.id && <Check size={14} className="text-primary" />}
                            </div>
                            <p className="text-xs text-text-tertiary">{c.department}</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {c.specialties.slice(0, 2).map((s) => (
                            <span key={s} className="badge bg-primary-50 text-primary text-[10px]">{s}</span>
                          ))}
                        </div>
                        <p className="text-xs text-text-secondary line-clamp-2 italic">"{c.styleDesc}"</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 训练需求 */}
            {coachId && (
              <div className="mt-6 card p-4">
                <label className="block text-sm font-medium text-text-primary mb-2">
                  训练需求 / 目标 <span className="text-text-tertiary font-normal">(可选)</span>
                </label>
                <textarea
                  value={trainingNote}
                  onChange={(e) => setTrainingNote(e.target.value.slice(0, TRAINING_NOTE_MAX))}
                  placeholder="例如:零基础想学基本器械使用;想减脂;希望纠正深蹲动作等"
                  className="textarea"
                  rows={3}
                />
                <div className="text-right text-xs text-text-tertiary mt-1">
                  {trainingNote.length} / {TRAINING_NOTE_MAX}
                </div>
              </div>
            )}

            {/* 下一步 */}
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setStep(1)} className="btn-ghost">返回修改</button>
              <button
                onClick={goStep3}
                disabled={!coachId}
                className="btn-primary"
              >
                下一步:确认 <ArrowRight size={14} />
              </button>
            </div>
            {error && <p className="text-xs text-danger mt-2 text-right">{error}</p>}
          </div>

          {/* 右侧栏 */}
          <aside className="lg:sticky lg:top-20 self-start space-y-4">
            <AITrainingSuggestion onSuggestion={setTrainingNote} />
            
            <div className="card p-5">
              <h3 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
                <Info size={16} className="text-primary" /> 预约须知
              </h3>
              <ul className="space-y-2 text-xs text-text-secondary">
                <li className="flex items-start gap-2"><Shield size={12} className="text-primary mt-0.5 shrink-0" /> 每周最多预约 3 次</li>
                <li className="flex items-start gap-2"><Clock size={12} className="text-primary mt-0.5 shrink-0" /> 开课前 24h 可免费取消</li>
                <li className="flex items-start gap-2"><AlertCircle size={12} className="text-primary mt-0.5 shrink-0" /> 24h 内取消记违约,3 次禁约 30 天</li>
                <li className="flex items-start gap-2"><UserCircle size={12} className="text-primary mt-0.5 shrink-0" /> 教练 12h 内审核,超时自动取消</li>
                <li className="flex items-start gap-2"><CalendarDays size={12} className="text-primary mt-0.5 shrink-0" /> 同一教练同时段仅可被预约一次</li>
              </ul>
            </div>
          </aside>
        </div>
      )}

      {/* 步骤 3:确认 */}
      {step === 3 && selectedVenue && selectedCoach && (
        <div className="max-w-2xl mx-auto">
          <button onClick={() => setStep(2)} className="text-sm text-text-secondary hover:text-primary flex items-center gap-1 mb-4">
            <ArrowLeft size={14} /> 返回修改
          </button>

          <div className="card p-6">
            <h2 className="text-lg font-bold text-text-primary mb-4">确认预约信息</h2>

            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between py-2 border-b border-border-light">
                <span className="text-sm text-text-tertiary">场馆</span>
                <span className="text-sm font-medium text-text-primary">{selectedVenue.name}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border-light">
                <span className="text-sm text-text-tertiary">时间</span>
                <span className="text-sm font-medium text-text-primary">
                  {formatDate(new Date(`${selectedDate!}T00:00:00`))} {weekdayLabel(new Date(`${selectedDate!}T00:00:00`))} {selectedStartTime}-{selectedEndTime}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border-light">
                <span className="text-sm text-text-tertiary">教练</span>
                <span className="text-sm font-medium text-text-primary">{selectedCoach.name} · {selectedCoach.department}</span>
              </div>
              <div className="py-2">
                <div className="text-sm text-text-tertiary mb-1">训练需求</div>
                <div className="text-sm text-text-primary p-3 rounded-md bg-bg-warm min-h-[60px]">
                  {trainingNote || '(未填写)'}
                </div>
              </div>
            </div>

            {/* 规则提醒 */}
            <div className="p-3 rounded-lg bg-warning/10 text-status-warning text-xs space-y-1 mb-5">
              <p className="font-medium flex items-center gap-1"><AlertCircle size={12} /> 提交前请确认:</p>
              <p>· 开课前 24 小时可免费取消,之后取消将记违约一次</p>
              <p>· 教练需在 12 小时内审核,超时系统自动取消</p>
              <p>· 请按时到场,未到场将记违约</p>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setStep(2)} className="btn-ghost flex-1">返回修改</button>
              <button
                onClick={() => setShowConfirm(true)}
                disabled={submitting}
                className="btn-primary flex-1"
              >
                确认提交预约
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 确认弹窗 */}
      <Modal open={showConfirm} onClose={() => !submitting && setShowConfirm(false)} title="确认提交预约?" size="sm">
        <p className="text-sm text-text-secondary mb-4">
          提交后预约状态为<span className="text-primary font-medium">待审核</span>,教练将在 12 小时内审核。
        </p>
        <div className="flex gap-2">
          <button onClick={() => setShowConfirm(false)} disabled={submitting} className="btn-ghost flex-1">
            取消
          </button>
          <button onClick={handleSubmit} disabled={submitting} className="btn-primary flex-1">
            {submitting ? (
              <><Loader2 size={14} className="animate-spin" /> 提交中...</>
            ) : (
              '确认预约'
            )}
          </button>
        </div>
        {error && <p className="text-xs text-danger mt-3">{error}</p>}
      </Modal>

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
