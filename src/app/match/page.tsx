'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Sparkles, Target, Users, MapPin, Star, Zap, ChevronRight, Check, Dumbbell } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { matchCoaches, type MatchPreferences } from '@/lib/utils';
import { CAMPUS_LABELS } from '@/lib/constants';
import type { VenueCampus } from '@/lib/types';

const TRAINING_GOALS = [
  { value: '增肌', label: '增肌', icon: '💪' },
  { value: '减脂', label: '减脂', icon: '🔥' },
  { value: '塑形', label: '塑形', icon: '✨' },
  { value: '体能', label: '体能', icon: '⚡' },
  { value: '新手', label: '新手入门', icon: '🚶' },
];

const GENDER_OPTIONS = [
  { value: 'any', label: '不限' },
  { value: 'female', label: '女生教练' },
  { value: 'male', label: '男生教练' },
];

const CAMPUS_OPTIONS: { value: VenueCampus | 'any'; label: string }[] = [
  { value: 'any', label: '不限校区' },
  { value: 'handan-south', label: CAMPUS_LABELS['handan-south'] },
  { value: 'handan-north', label: CAMPUS_LABELS['handan-north'] },
  { value: 'wuliu', label: CAMPUS_LABELS['wuliu'] },
];

export default function MatchPage() {
  const router = useRouter();
  const { coaches, currentUser } = useApp();

  const [step, setStep] = useState(1);
  const [preferences, setPreferences] = useState<MatchPreferences>({
    trainingGoal: '',
    genderPreference: 'any',
    isBeginner: false,
    preferredCampus: null,
  });
  const [results, setResults] = useState<any[]>([]);
  const [isMatching, setIsMatching] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      router.push('/login');
    }
  }, [currentUser, router]);

  if (!currentUser) {
    return (
      <div className="max-w-content mx-auto px-6 py-16 text-center">
        <p className="text-text-secondary mb-4">请先登录后再使用智能匹配</p>
        <Link href="/login" className="btn-primary">去登录</Link>
      </div>
    );
  }

  const handleNextStep = () => {
    if (step === 1 && !preferences.trainingGoal) return;
    if (step === 2) {
      setIsMatching(true);
      setTimeout(() => {
        const matched = matchCoaches(coaches, preferences);
        setResults(matched);
        setIsMatching(false);
        setStep(3);
      }, 800);
    }
    setStep((s) => s + 1);
  };

  const handleBackStep = () => {
    setStep((s) => s - 1);
  };

  const handleBookCoach = (coachId: string) => {
    router.push(`/booking?coach=${coachId}`);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600';
    if (score >= 60) return 'text-primary';
    if (score >= 40) return 'text-amber-600';
    return 'text-text-tertiary';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-emerald-100';
    if (score >= 60) return 'bg-primary-100';
    if (score >= 40) return 'bg-amber-100';
    return 'bg-bg-warm';
  };

  return (
    <div className="max-w-content mx-auto px-6 py-8">
      <div className="flex items-center gap-2 mb-6">
        <button onClick={() => router.push('/')} className="text-sm text-text-secondary hover:text-primary">
          <ArrowLeft size={16} />
        </button>
        <h1 className="text-2xl font-bold text-text-primary">智能匹配教练</h1>
      </div>

      <div className="card p-6 max-w-2xl mx-auto">
        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                step > s ? 'bg-success text-emerald-700' : step === s ? 'bg-primary text-white' : 'bg-bg-warm text-text-tertiary'
              }`}>
                {step > s ? <Check size={16} /> : s}
              </div>
              {s < 3 && (
                <div className={`w-12 h-0.5 mx-2 ${step > s ? 'bg-success' : 'bg-border-light'}`} />
              )}
            </div>
          ))}
        </div>

        {step === 1 && (
          <div className="animate-fade-in">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-4">
                <Target className="text-primary" size={32} />
              </div>
              <h2 className="text-xl font-bold text-text-primary mb-2">你的训练目标是什么?</h2>
              <p className="text-sm text-text-secondary">选择一个最符合你当前需求的目标</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {TRAINING_GOALS.map((goal) => (
                <button
                  key={goal.value}
                  onClick={() => setPreferences((p) => ({ ...p, trainingGoal: goal.value }))}
                  className={`p-4 rounded-xl border-2 text-center transition-all ${
                    preferences.trainingGoal === goal.value
                      ? 'border-primary bg-primary-50'
                      : 'border-border-light hover:border-primary/50'
                  }`}
                >
                  <span className="text-2xl block mb-2">{goal.icon}</span>
                  <span className={`text-sm font-medium ${
                    preferences.trainingGoal === goal.value ? 'text-primary' : 'text-text-primary'
                  }`}>
                    {goal.label}
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={handleNextStep}
                disabled={!preferences.trainingGoal}
                className="btn-primary"
              >
                下一步 <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-fade-in">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-accent-light flex items-center justify-center mx-auto mb-4">
                <Users className="text-accent" size={32} />
              </div>
              <h2 className="text-xl font-bold text-text-primary mb-2">进一步完善偏好</h2>
              <p className="text-sm text-text-secondary">这些信息将帮助我们为你匹配最合适的教练</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  <Users size={14} className="inline mr-1" />
                  教练性别偏好
                </label>
                <div className="flex gap-2">
                  {GENDER_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setPreferences((p) => ({ ...p, genderPreference: option.value as any }))}
                      className={`flex-1 py-2 px-4 rounded-lg border-2 text-sm font-medium transition-all ${
                        preferences.genderPreference === option.value
                          ? 'border-primary bg-primary-50 text-primary'
                          : 'border-border-light hover:border-primary/50'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  <Sparkles size={14} className="inline mr-1" />
                  是否是健身新手?
                </label>
                <div className="flex gap-2">
                  {[
                    { value: true, label: '是,我是新手' },
                    { value: false, label: '不是,有一定基础' },
                  ].map((option) => (
                    <button
                      key={String(option.value)}
                      onClick={() => setPreferences((p) => ({ ...p, isBeginner: option.value }))}
                      className={`flex-1 py-2 px-4 rounded-lg border-2 text-sm font-medium transition-all ${
                        preferences.isBeginner === option.value
                          ? 'border-primary bg-primary-50 text-primary'
                          : 'border-border-light hover:border-primary/50'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  <MapPin size={14} className="inline mr-1" />
                  偏好校区
                </label>
                <div className="flex flex-wrap gap-2">
                  {CAMPUS_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setPreferences((p) => ({
                        ...p,
                        preferredCampus: option.value === 'any' ? null : option.value,
                      }))}
                      className={`py-2 px-4 rounded-lg border-2 text-sm font-medium transition-all ${
                        preferences.preferredCampus === (option.value === 'any' ? null : option.value)
                          ? 'border-primary bg-primary-50 text-primary'
                          : 'border-border-light hover:border-primary/50'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-between">
              <button onClick={handleBackStep} className="btn-ghost">返回</button>
              <button onClick={handleNextStep} className="btn-primary">
                开始匹配 <Sparkles size={14} />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="animate-fade-in">
            {isMatching ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-primary animate-pulse-soft flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="text-white" size={32} />
                </div>
                <p className="text-text-secondary">正在分析你的需求...</p>
                <p className="text-sm text-text-tertiary mt-2">AI 正在为你匹配最合适的教练</p>
              </div>
            ) : (
              <>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-success/30 flex items-center justify-center mx-auto mb-4">
                    <Star className="text-emerald-600" size={32} />
                  </div>
                  <h2 className="text-xl font-bold text-text-primary mb-2">匹配结果</h2>
                  <p className="text-sm text-text-secondary">为你找到了 {results.length} 位适合的教练</p>
                </div>

                {results.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-text-secondary">暂无符合条件的教练</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {results.map((result, index) => (
                      <div
                        key={result.coachId}
                        className="card p-4 animate-slide-up"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <div className="flex items-start gap-4">
                          <div className="relative">
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-primary-light text-white flex items-center justify-center text-xl font-bold">
                              {result.coachName.charAt(result.coachName.length - 1)}
                            </div>
                            <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full ${getScoreBg(result.matchScore)} ${getScoreColor(result.matchScore)} flex items-center justify-center text-xs font-bold`}>
                              {result.matchScore}
                            </div>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold text-text-primary">{result.coachName}</span>
                              <span className="text-xs text-text-tertiary">{result.department}</span>
                              {result.isBeginnerFriendly && (
                                <span className="badge bg-success/20 text-emerald-700 text-xs">新手友好</span>
                              )}
                              {result.isFemaleFriendly && (
                                <span className="badge bg-accent/20 text-accent text-xs">女生友好</span>
                              )}
                            </div>

                            <div className="flex flex-wrap gap-1.5 mb-2">
                              {result.specialties.map((s: string) => (
                                <span key={s} className="badge bg-primary-50 text-primary text-xs">
                                  {s}
                                </span>
                              ))}
                            </div>

                            <div className="flex flex-wrap gap-2">
                              {result.matchDetails.map((detail: string, i: number) => (
                                <span key={i} className="flex items-center gap-1 text-xs text-text-secondary">
                                  <Zap size={10} className="text-amber-500" />
                                  {detail}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-2">
                            <div className={`text-2xl font-bold ${getScoreColor(result.matchScore)}`}>
                              {result.matchScore}%
                            </div>
                            <button
                              onClick={() => handleBookCoach(result.coachId)}
                              className="btn-primary text-sm flex items-center gap-1"
                            >
                              <Dumbbell size={14} />
                              预约
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-6 flex justify-between">
                  <button onClick={handleBackStep} className="btn-ghost">重新选择</button>
                  <Link href="/booking" className="btn-outline">
                    浏览全部教练
                  </Link>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}