'use client';

// 个人中心
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  UserCircle, Calendar, AlertTriangle, Ban, Dumbbell, ArrowRight,
  Clock, MapPin, X, Info, GraduationCap, Award, TrendingUp, Target, CheckCircle2,
  Flame, Activity, Star, Zap, Heart, CalendarDays, Trophy, Medal, Sunrise, Sparkles,
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
import type { Appointment, TrainingRecord } from '@/lib/types';

export default function ProfilePage() {
  const router = useRouter();
  const { currentUser, currentCoach, coaches, venues, appointments, trainingRecords, cancelBooking, applyCoach, addTrainingRecord, getTrainingStats } = useApp();
  const [tab, setTab] = useState<string>('all');
  const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [showApply, setShowApply] = useState(false);
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [checkInAppointment, setCheckInAppointment] = useState<Appointment | null>(null);

  const trainingStats = useMemo(() => {
    if (!currentUser) return null;
    return getTrainingStats(currentUser.id);
  }, [currentUser, getTrainingStats]);

  const userTrainingRecords = useMemo(() => {
    if (!currentUser) return [];
    return trainingRecords.filter((r) => r.userId === currentUser.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [trainingRecords, currentUser]);

  const completedAppointments = useMemo(() => {
    if (!currentUser) return [];
    return appointments.filter((a) => a.studentId === currentUser.id && a.status === 'completed');
  }, [appointments, currentUser]);

  // 成就徽章计算
  const achievements = useMemo(() => {
    if (!currentUser) return [];
    const records = userTrainingRecords;
    const stats = trainingStats;

    const badgeDefs = [
      {
        id: 'first_workout',
        name: '初次打卡',
        desc: '完成第一次训练打卡',
        icon: Star,
        color: 'text-warning',
        bgColor: 'bg-warning/10',
        unlocked: records.length >= 1,
      },
      {
        id: 'streak_3',
        name: '坚持3天',
        desc: '连续打卡3天',
        icon: Flame,
        color: 'text-danger',
        bgColor: 'bg-danger/10',
        unlocked: (stats?.currentStreak ?? 0) >= 3,
      },
      {
        id: 'streak_7',
        name: '坚持7天',
        desc: '连续打卡7天',
        icon: Trophy,
        color: 'text-primary',
        bgColor: 'bg-primary-50',
        unlocked: (stats?.currentStreak ?? 0) >= 7,
      },
      {
        id: 'ten_workouts',
        name: '十练达人',
        desc: '累计完成10次训练',
        icon: Medal,
        color: 'text-accent',
        bgColor: 'bg-accent/10',
        unlocked: records.length >= 10,
      },
      {
        id: 'variety',
        name: '多面手',
        desc: '尝试3种及以上训练类型',
        icon: Sparkles,
        color: 'text-info',
        bgColor: 'bg-info/10',
        unlocked: new Set(records.map((r) => r.workoutType)).size >= 3,
      },
      {
        id: 'calorie_king',
        name: '热量达人',
        desc: '单次训练消耗500+千卡',
        icon: Zap,
        color: 'text-status-success',
        bgColor: 'bg-success/10',
        unlocked: records.some((r) => r.calories >= 500),
      },
    ];

    return badgeDefs;
  }, [currentUser, userTrainingRecords, trainingStats]);

  const handleCheckIn = (appointment: Appointment) => {
    setCheckInAppointment(appointment);
    setShowCheckIn(true);
  };

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
            <p className="text-xs text-status-warning">已违约 {currentUser.violationCount} 次,3 次将禁约 30 天</p>
          ) : (
            <p className="text-xs text-text-tertiary">信用良好,继续保持</p>
          )}
        </div>
      </div>

      {/* 教练申请入口(普通社员) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="card p-4 text-center">
          <div className="w-8 h-8 rounded-lg bg-primary-50 text-primary flex items-center justify-center mx-auto mb-2">
            <Calendar size={16} />
          </div>
          <div className="text-xl font-bold text-text-primary">{myAppointments.length}</div>
          <div className="text-xs text-text-tertiary">累计预约</div>
        </div>
        <div className="card p-4 text-center">
          <div className="w-8 h-8 rounded-lg bg-success/20 text-status-success flex items-center justify-center mx-auto mb-2">
            <CheckCircle2 size={16} />
          </div>
          <div className="text-xl font-bold text-text-primary">
            {myAppointments.filter((a) => a.status === 'completed').length}
          </div>
          <div className="text-xs text-text-tertiary">已完成</div>
        </div>
        <div className="card p-4 text-center">
          <div className="w-8 h-8 rounded-lg bg-info/20 text-status-info flex items-center justify-center mx-auto mb-2">
            <Target size={16} />
          </div>
          <div className="text-xl font-bold text-text-primary">
            {Math.round((myAppointments.filter((a) => a.status === 'completed').length / Math.max(myAppointments.length, 1)) * 100)}%
          </div>
          <div className="text-xs text-text-tertiary">完成率</div>
        </div>
        <div className="card p-4 text-center">
          <div className="w-8 h-8 rounded-lg bg-accent/20 text-accent flex items-center justify-center mx-auto mb-2">
            <TrendingUp size={16} />
          </div>
          <div className="text-xl font-bold text-text-primary">
            {myAppointments.filter((a) => ['pending', 'approved'].includes(a.status)).length}
          </div>
          <div className="text-xs text-text-tertiary">进行中</div>
        </div>
      </div>

      {/* 成就徽章 */}
      <div className="card p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
            <Trophy size={18} className="text-warning" /> 我的成就
          </h2>
          <span className="text-xs text-text-tertiary">
            已解锁 {achievements.filter((a) => a.unlocked).length}/{achievements.length}
          </span>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {achievements.map((badge) => {
            const Icon = badge.icon;
            return (
              <div
                key={badge.id}
                className={`flex flex-col items-center text-center p-3 rounded-xl transition-all ${
                  badge.unlocked
                    ? `${badge.bgColor} scale-100`
                    : 'bg-bg-warm opacity-50 grayscale'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${badge.unlocked ? badge.bgColor : 'bg-gray-200'}`}>
                  <Icon size={20} className={badge.unlocked ? badge.color : 'text-gray-400'} />
                </div>
                <span className={`text-xs font-medium ${badge.unlocked ? 'text-text-primary' : 'text-text-tertiary'}`}>
                  {badge.name}
                </span>
                <span className="text-[10px] text-text-tertiary mt-0.5">{badge.desc}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 训练趋势图 */}
      {trainingStats && (
        <div className="card p-5 mb-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-primary" /> 最近7天训练趋势
          </h2>
          <div className="flex items-end gap-2 h-32">
            {trainingStats.weeklyData.map((item) => {
              const maxCount = Math.max(...trainingStats.weeklyData.map((d) => d.count), 1);
              const heightPercent = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
              return (
                <div key={item.day} className="flex-1 flex flex-col items-center gap-1">
                  <div className="text-xs text-text-tertiary">{item.count > 0 ? `${item.count}次` : ''}</div>
                  <div className="w-full bg-bg-warm rounded-t-md relative overflow-hidden" style={{ height: '80px' }}>
                    <div
                      className={`absolute bottom-0 left-0 right-0 rounded-t-md transition-all duration-500 ${
                        item.count > 0 ? 'bg-primary' : 'bg-transparent'
                      }`}
                      style={{ height: `${Math.max(heightPercent, item.count > 0 ? 8 : 0)}%` }}
                    />
                  </div>
                  <div className="text-xs text-text-secondary font-medium">{item.day}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 训练打卡统计 */}
      {trainingStats && (
        <div className="card p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
              <Flame size={18} className="text-danger" /> 训练打卡
            </h2>
            {completedAppointments.length > 0 && userTrainingRecords.length < completedAppointments.length && (
              <button onClick={() => setShowCheckIn(true)} className="btn-primary text-sm flex items-center gap-1">
                <Star size={14} /> 去打卡
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className="p-3 rounded-lg bg-danger/10">
              <div className="flex items-center gap-2 mb-1">
                <Flame size={14} className="text-danger" />
                <span className="text-xs text-text-secondary">连续打卡</span>
              </div>
              <div className="text-xl font-bold text-text-primary">{trainingStats.currentStreak}<span className="text-xs font-normal text-text-tertiary ml-1">天</span></div>
            </div>
            <div className="p-3 rounded-lg bg-success/10">
              <div className="flex items-center gap-2 mb-1">
                <CalendarDays size={14} className="text-status-success" />
                <span className="text-xs text-text-secondary">累计训练</span>
              </div>
              <div className="text-xl font-bold text-text-primary">{trainingStats.totalWorkouts}<span className="text-xs font-normal text-text-tertiary ml-1">次</span></div>
            </div>
            <div className="p-3 rounded-lg bg-primary-50">
              <div className="flex items-center gap-2 mb-1">
                <Clock size={14} className="text-primary" />
                <span className="text-xs text-text-secondary">训练时长</span>
              </div>
              <div className="text-xl font-bold text-text-primary">{Math.round(trainingStats.totalDuration / 60)}<span className="text-xs font-normal text-text-tertiary ml-1">小时</span></div>
            </div>
            <div className="p-3 rounded-lg bg-warning/10">
              <div className="flex items-center gap-2 mb-1">
                <Zap size={14} className="text-status-warning" />
                <span className="text-xs text-text-secondary">消耗热量</span>
              </div>
              <div className="text-xl font-bold text-text-primary">{trainingStats.totalCalories}<span className="text-xs font-normal text-text-tertiary ml-1">千卡</span></div>
            </div>
          </div>

          {/* 训练数据可视化：饼图 + 本月日历 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* 训练类型分布饼图 */}
            <div className="p-4 rounded-lg bg-bg-warm">
              <div className="text-xs font-medium text-text-secondary mb-3">训练类型分布</div>
              <TrainingTypePieChart records={userTrainingRecords} />
            </div>

            {/* 本月训练日历 */}
            <div className="p-4 rounded-lg bg-bg-warm">
              <div className="text-xs font-medium text-text-secondary mb-3">本月训练日历</div>
              <MonthlyCalendar records={userTrainingRecords} />
            </div>
          </div>

          {/* 本周打卡日历 */}
          <div className="p-4 rounded-lg bg-bg-warm">
            <div className="text-xs font-medium text-text-secondary mb-3">本周训练分布</div>
            <div className="flex gap-1">
              {trainingStats.weeklyData.map((item) => (
                <div key={item.day} className="flex-1 text-center">
                  <div className="text-xs text-text-tertiary mb-1">{item.day}</div>
                  <div className={`w-full aspect-square rounded-md flex items-center justify-center text-xs font-medium transition-all ${
                    item.count === 0 ? 'bg-surface text-text-tertiary' :
                    item.count === 1 ? 'bg-success/30 text-status-success' :
                    'bg-success text-white'
                  }`}>
                    {item.count}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 打卡记录 */}
          {userTrainingRecords.length > 0 && (
            <div className="mt-4">
              <div className="text-xs font-medium text-text-secondary mb-2">最近打卡</div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {userTrainingRecords.slice(0, 5).map((record) => (
                  <div key={record.id} className="flex items-center justify-between p-3 rounded-md bg-surface">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        record.intensity === 'high' ? 'bg-danger/20 text-danger' :
                        record.intensity === 'medium' ? 'bg-warning/20 text-status-warning' :
                        'bg-success/20 text-status-success'
                      }`}>
                        {record.intensity === 'high' ? <Zap size={14} /> :
                         record.intensity === 'medium' ? <Activity size={14} /> :
                         <Heart size={14} />}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-text-primary">{record.workoutType}</div>
                        <div className="text-xs text-text-tertiary">{record.date} · {record.duration}分钟 · {record.calories}千卡</div>
                      </div>
                    </div>
                    {record.note && (
                      <div className="text-xs text-text-secondary truncate max-w-32">{record.note}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

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

      {/* 推荐行动卡片 */}
      {(() => {
        const upcoming = myAppointments.find((a) => ['pending', 'approved'].includes(a.status));
        const thisWeekWorkouts = trainingStats?.weeklyData.reduce((sum, d) => sum + (d.count > 0 ? 1 : 0), 0) ?? 0;

        if (upcoming) {
          const venue = venueOfAppt(upcoming.venueId);
          const coach = coachOfAppt(upcoming.coachId);
          return (
            <div className="card p-5 mb-6 bg-gradient-to-r from-primary-50 to-blue-50 border-primary">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary text-white flex items-center justify-center">
                  <Calendar size={18} />
                </div>
                <div>
                  <h3 className="font-medium text-text-primary">下次训练提醒</h3>
                  <p className="text-sm text-text-secondary">
                    {upcoming.date} {upcoming.startTime} · {venue?.name}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <Dumbbell size={14} className="text-primary" />
                <span>教练: {coach?.name} · 记得提前10分钟到达场馆</span>
              </div>
            </div>
          );
        }

        if (thisWeekWorkouts < 2 && trainingStats) {
          return (
            <div className="card p-5 mb-6 bg-warning/10 border-warning/30">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-warning text-white flex items-center justify-center">
                    <Zap size={18} />
                  </div>
                  <div>
                    <h3 className="font-medium text-text-primary">本周训练加油！</h3>
                    <p className="text-sm text-text-secondary">本周已训练 {thisWeekWorkouts} 次，再坚持一下达成目标</p>
                  </div>
                </div>
                <Link href="/booking" className="btn-primary text-sm">
                  预约训练 <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          );
        }

        return (
          <div className="card p-5 mb-6 bg-primary-50 border-primary">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary text-white flex items-center justify-center">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h3 className="font-medium text-text-primary">开启你的训练之旅</h3>
                  <p className="text-sm text-text-secondary">预约一位认证教练，开始科学健身</p>
                </div>
              </div>
              <Link href="/booking" className="btn-primary text-sm">
                去预约 <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        );
      })()}

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
                            className={`btn text-xs ${free ? 'btn-outline' : 'bg-warning/20 text-status-warning hover:bg-warning/30'}`}
                          >
                            <X size={12} /> 取消预约
                          </button>
                        )}
                        {cancellable && !free && (
                          <span className="text-[10px] text-status-warning flex items-center gap-0.5">
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
                <div className="p-3 rounded-md bg-success/15 text-status-success text-xs flex items-start gap-2 mb-4">
                  <Info size={14} className="mt-0.5 shrink-0" />
                  <span>距离开课超过 24 小时,本次取消<span className="font-medium">不影响信用记录</span>。</span>
                </div>
              ) : (
                <div className="p-3 rounded-md bg-warning/15 text-status-warning text-xs flex items-start gap-2 mb-4">
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

      {/* 训练打卡弹窗 */}
      <TrainingCheckInModal
        open={showCheckIn}
        onClose={() => { setShowCheckIn(false); setCheckInAppointment(null); }}
        onCheckIn={(record) => { addTrainingRecord(record); setToast({ msg: '打卡成功!继续保持!', type: 'success' }); }}
        completedAppointments={completedAppointments}
      />

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

// 训练打卡弹窗
function TrainingCheckInModal({ open, onClose, onCheckIn, completedAppointments }: {
  open: boolean;
  onClose: () => void;
  onCheckIn: (record: Omit<TrainingRecord, 'id' | 'createdAt'>) => void;
  completedAppointments: Appointment[];
}) {
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [workoutType, setWorkoutType] = useState('');
  const [duration, setDuration] = useState(60);
  const [intensity, setIntensity] = useState<'low' | 'medium' | 'high'>('medium');
  const [calories, setCalories] = useState(300);
  const [note, setNote] = useState('');

  const WORKOUT_TYPES = ['力量训练', '有氧', 'HIIT', '瑜伽', '普拉提', '跑步', '游泳', '其他'];

  const handleSubmit = () => {
    if (!selectedAppointment) return;
    if (!workoutType) return;
    onCheckIn({
      userId: selectedAppointment.studentId,
      appointmentId: selectedAppointment.id,
      date: selectedAppointment.date,
      duration,
      workoutType,
      intensity,
      calories,
      note: note || undefined,
    });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="训练打卡" size="lg">
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-2">选择已完成的训练</label>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {completedAppointments.map((appt) => (
              <button
                key={appt.id}
                onClick={() => setSelectedAppointment(appt)}
                className={`w-full p-3 rounded-md text-left border transition-all ${
                  selectedAppointment?.id === appt.id ? 'border-primary bg-primary-50' : 'border-border-light hover:border-primary'
                }`}
              >
                <div className="text-sm font-medium text-text-primary">{appt.date}</div>
                <div className="text-xs text-text-tertiary">{appt.startTime}-{appt.endTime}</div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-text-secondary mb-2">训练类型</label>
          <div className="flex flex-wrap gap-2">
            {WORKOUT_TYPES.map((type) => (
              <button
                key={type}
                onClick={() => setWorkoutType(type)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-all ${
                  workoutType === type ? 'bg-primary text-white border-primary' : 'border-border-light text-text-secondary hover:border-primary'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">训练时长(分钟)</label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(Math.max(10, Math.min(180, parseInt(e.target.value) || 60)))}
              className="input"
              min={10}
              max={180}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">消耗热量(千卡)</label>
            <input
              type="number"
              value={calories}
              onChange={(e) => setCalories(Math.max(50, Math.min(1500, parseInt(e.target.value) || 300)))}
              className="input"
              min={50}
              max={1500}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-text-secondary mb-2">训练强度</label>
          <div className="flex gap-2">
            {(['low', 'medium', 'high'] as const).map((level) => (
              <button
                key={level}
                onClick={() => setIntensity(level)}
                className={`flex-1 py-2 px-3 rounded-md text-xs font-medium border transition-all ${
                  intensity === level ? level === 'high' ? 'bg-danger text-white border-danger' :
                  level === 'medium' ? 'bg-warning text-white border-warning' :
                  'bg-success text-white border-success' :
                  'border-border-light text-text-secondary hover:border-primary'
                }`}
              >
                {level === 'low' ? '轻松' : level === 'medium' ? '适中' : '高强度'}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">训练感受(可选)</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, 200))}
            className="textarea"
            rows={3}
            placeholder="记录本次训练的感受和成果..."
          />
          <div className="text-right text-xs text-text-tertiary">{note.length}/200</div>
        </div>

        <div className="flex gap-2 pt-2 border-t border-border-light">
          <button onClick={onClose} className="btn-ghost flex-1">取消</button>
          <button onClick={handleSubmit} disabled={!selectedAppointment || !workoutType} className="btn-primary flex-1 disabled:opacity-50">
            完成打卡
          </button>
        </div>
      </div>
    </Modal>
  );
}

function TrainingTypePieChart({ records }: { records: TrainingRecord[] }) {
  const typeCount: Record<string, number> = {};
  records.forEach((r) => {
    typeCount[r.workoutType] = (typeCount[r.workoutType] || 0) + 1;
  });

  const types = Object.entries(typeCount).sort((a, b) => b[1] - a[1]);
  const total = records.length;

  const COLORS = [
    '#3b82f6',
    '#10b981',
    '#f59e0b',
    '#ef4444',
    '#8b5cf6',
    '#ec4899',
    '#06b6d4',
  ];

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-text-tertiary text-xs">
        <Dumbbell size={32} className="mb-2 opacity-30" />
        暂无训练记录
      </div>
    );
  }

  let cumulative = 0;
  const gradientStops = types.map(([type, count], i) => {
    const start = (cumulative / total) * 360;
    cumulative += count;
    const end = (cumulative / total) * 360;
    return `${COLORS[i % COLORS.length]} ${start}deg ${end}deg`;
  });

  return (
    <div className="flex items-center gap-4">
      <div
        className="w-24 h-24 rounded-full shrink-0 relative"
        style={{
          background: `conic-gradient(${gradientStops.join(', ')})`,
        }}
      >
        <div className="absolute inset-2 rounded-full bg-bg-warm flex items-center justify-center">
          <div className="text-center">
            <div className="text-lg font-bold text-text-primary">{total}</div>
            <div className="text-[10px] text-text-tertiary">总次数</div>
          </div>
        </div>
      </div>
      <div className="flex-1 space-y-1.5 min-w-0">
        {types.slice(0, 4).map(([type, count], i) => (
          <div key={type} className="flex items-center gap-2 text-xs">
            <div
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: COLORS[i % COLORS.length] }}
            />
            <span className="text-text-secondary truncate">{type}</span>
            <span className="text-text-tertiary ml-auto">{count}次</span>
          </div>
        ))}
        {types.length > 4 && (
          <div className="text-[10px] text-text-tertiary">
            还有 {types.length - 4} 种类型
          </div>
        )}
      </div>
    </div>
  );
}

function MonthlyCalendar({ records }: { records: TrainingRecord[] }) {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDayOfWeek = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

  const recordDates = new Set(records.map((r) => r.date));

  const cells: (number | null)[] = [];
  for (let i = 0; i < startDayOfWeek; i++) {
    cells.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(d);
  }

  const formatDate = (day: number) => {
    const m = String(month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${year}-${m}-${d}`;
  };

  const todayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  return (
    <div>
      <div className="text-center text-sm font-medium text-text-primary mb-2">
        {year}年{month + 1}月
      </div>
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-center text-[10px] text-text-tertiary py-1">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((day, i) => {
          if (day === null) {
            return <div key={i} className="aspect-square" />;
          }
          const dateStr = formatDate(day);
          const hasRecord = recordDates.has(dateStr);
          const isToday = dateStr === todayStr;
          const isFuture = day > today.getDate();

          return (
            <div
              key={i}
              className={`aspect-square rounded-sm flex items-center justify-center text-[10px] font-medium transition-all ${
                hasRecord
                  ? 'bg-success text-white'
                  : isToday
                  ? 'bg-primary/10 text-primary border border-primary/30'
                  : isFuture
                  ? 'text-text-tertiary/40'
                  : 'text-text-tertiary bg-surface'
              }`}
            >
              {day}
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex items-center justify-center gap-3 text-[10px] text-text-tertiary">
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 rounded-sm bg-success" />
          <span>已训练</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 rounded-sm bg-primary/10 border border-primary/30" />
          <span>今天</span>
        </div>
      </div>
    </div>
  );
}
