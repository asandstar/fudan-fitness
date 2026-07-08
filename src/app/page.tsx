'use client';

// 首页 — 10 个模块
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import {
  ArrowRight, Dumbbell, Users, Clock, Shield, Heart, Sparkles,
  TrendingUp, Activity, Dumbbell as DumbbellIcon, StretchHorizontal,
  Megaphone, ChevronRight, BookOpen,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { CAMPUS_LABELS } from '@/lib/constants';
import VenueCard from '@/components/ui/VenueCard';
import CoachCard from '@/components/ui/CoachCard';
import type { VenueCampus } from '@/lib/types';

const COACH_FILTERS = [
  { key: 'all', label: '全部' },
  { key: 'beginner', label: '新手友好' },
  { key: 'female', label: '女生教练' },
] as const;

const BEGINNER_STEPS = [
  { num: '01', title: '浏览教练', desc: '在"近期可预约教练"中筛选新手友好标签,阅读教练风格描述' },
  { num: '02', title: '选择时段', desc: '点击"预约 TA"进入预约页,选择合适场馆和时段' },
  { num: '03', title: '提交需求', desc: '填写训练目标(可选),提交后等待教练确认即可' },
];

const FRIENDLY_SUPPORTS = [
  { icon: Heart, title: '女生教练专属', desc: '多位认证女生教练,适合女生入门训练' },
  { icon: Sparkles, title: '新手专属时段', desc: '每周固定新手友好时段,教练耐心带练' },
  { icon: Shield, title: '隐私保护', desc: '可指定女生教练,训练需求可备注隐私要求' },
  { icon: Users, title: '小班带练', desc: '1对1带练为主,避免大课环境的尴尬' },
  { icon: BookOpen, title: '动作规范优先', desc: '所有教练认证审核,注重动作安全与规范' },
  { icon: TrendingUp, title: '渐进式计划', desc: '教练可根据你的基础制定渐进式训练计划' },
];

const EQUIPMENTS = [
  {
    icon: DumbbellIcon,
    title: '力量器械区',
    desc: '哑铃、杠铃、龙门架、高位下拉、坐姿推举、腿部推蹬等综合训练器',
    detail: '适合增肌、力量提升、塑形训练。建议初学者从固定器械开始,掌握动作规范后再使用自由重量',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=gym%20weight%20training%20equipment%20dumbbells%20barbells%20cable%20machine%20professional%20fitness&image_size=square',
    tags: ['增肌', '力量', '塑形'],
  },
  {
    icon: Activity,
    title: '有氧训练区',
    desc: '跑步机、椭圆机、动感单车、划船机等心肺训练设备',
    detail: '适合减脂、心肺功能提升。建议每周进行3-5次,每次30-60分钟中等强度有氧运动',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=gym%20cardio%20equipment%20treadmills%20elliptical%20stationary%20bike%20clean%20modern&image_size=square',
    tags: ['减脂', '心肺', '耐力'],
  },
  {
    icon: StretchHorizontal,
    title: '拉伸放松区',
    desc: '瑜伽垫、泡沫轴、筋膜枪、拉伸架等放松恢复设备',
    detail: '训练前后必须进行10-15分钟拉伸,有效预防受伤、缓解肌肉酸痛、提升柔韧性',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=yoga%20stretching%20area%20yoga%20mats%20foam%20rollers%20relaxation%20peaceful%20gym&image_size=square',
    tags: ['放松', '柔韧性', '恢复'],
  },
  {
    icon: TrendingUp,
    title: '自由重量区',
    desc: '深蹲架、卧推架、硬拉台、引体向上架等自由训练设备',
    detail: '适合进阶力量训练者。使用前请确保掌握标准动作,建议在教练指导下进行',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=free%20weight%20gym%20area%20squat%20rack%20bench%20press%20power%20lifting%20professional&image_size=square',
    tags: ['进阶', '爆发力', '极限'],
  },
];

const RULES = [
  '每位社员每周最多预约 3 次带练',
  '预约开始前 24 小时可免费取消,之后取消记违约',
  '违约 3 次将被禁约 30 天',
  '教练需在 12 小时内审核预约,超时自动取消',
  '同一教练同一时段只能被预约一次',
];

export default function HomePage() {
  const { venues, coaches, announcements, currentUser } = useApp();
  const [coachFilter, setCoachFilter] = useState<typeof COACH_FILTERS[number]['key']>('all');
  const router = useRouter();

  const handleBookCoach = (coachId: string) => {
    router.push(`/booking?coach=${coachId}`);
  };

  const bookableVenues = useMemo(() => venues.filter((v) => v.bookable).sort((a, b) => a.displayOrder - b.displayOrder), [venues]);
  const displayVenues = useMemo(() => venues.slice().sort((a, b) => a.displayOrder - b.displayOrder), [venues]);

  const approvedCoaches = useMemo(() => coaches.filter((c) => c.certStatus === 'approved'), [coaches]);
  const filteredCoaches = useMemo(() => {
    if (coachFilter === 'beginner') return approvedCoaches.filter((c) => c.isBeginnerFriendly);
    if (coachFilter === 'female') return approvedCoaches.filter((c) => c.isFemaleFriendly);
    return approvedCoaches;
  }, [approvedCoaches, coachFilter]);

  const sortedAnnouncements = useMemo(() => {
    const pinned = announcements.filter((a) => a.status === 'published' && a.isPinned);
    const others = announcements.filter((a) => a.status === 'published' && !a.isPinned);
    return [...pinned, ...others].slice(0, 3);
  }, [announcements]);

  const campusOverview: { campus: VenueCampus; bookable: boolean }[] = [
    { campus: 'handan-south', bookable: true },
    { campus: 'handan-north', bookable: true },
    { campus: 'wuliu', bookable: true },
    { campus: 'jiangwan', bookable: false },
    { campus: 'fenglin', bookable: false },
    { campus: 'zhangjiang', bookable: false },
  ];

  return (
    <div>
      {/* 1. Hero 区 */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20university%20fitness%20gym%20interior%20with%20students%20working%20out%20clean%20bright%20professional%20equipment%20dumbbells%20treadmills%20warm%20lighting%20campus%20environment&image_size=landscape_16_9')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/30" />
        <div className="relative max-w-content mx-auto px-6 py-20 md:py-28">
          <div className="max-w-2xl text-white">
            <span className="badge bg-primary/90 text-white mb-4">
              <Sparkles size={12} /> 互助带练 · 学生社团
            </span>
            <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-4">
              复旦健身社<br />互助预约平台
            </h1>
            <p className="text-base md:text-lg text-white/85 mb-6 leading-relaxed">
              连接学员与认证教练,1 对 1 带练预约。零基础友好、女生友好,
              让科学训练触手可及。
            </p>
            <div className="flex flex-wrap gap-3">
          <Link href="/booking" className="btn-primary text-base px-6 py-3">
            立即预约教练 <ArrowRight size={16} />
          </Link>
          <Link href="/match" className="btn-ghost text-base px-6 py-3 bg-white/10 text-white hover:bg-white/20 flex items-center gap-2">
            <Sparkles size={16} /> AI智能匹配
          </Link>
          <Link href="/venues" className="btn-ghost text-base px-6 py-3 bg-white/10 text-white hover:bg-white/20">
            了解场馆
          </Link>
        </div>
            {!currentUser && (
              <p className="mt-4 text-sm text-white/70">
                新用户? <Link href="/login" className="text-primary-light underline">点此登录</Link> · Demo 账号一键体验
              </p>
            )}
          </div>
        </div>
      </section>

      {/* 2. 本周可约概览 */}
      <section className="max-w-content mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-text-primary">本周可约概览</h2>
          <Link href="/venues" className="text-sm text-primary hover:underline flex items-center gap-1">
            全部场馆 <ChevronRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {campusOverview.map((c) => (
            <Link
              key={c.campus}
              href="/venues"
              className="card p-4 flex flex-col items-center text-center hover:border-primary"
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${c.bookable ? 'bg-success/30 text-emerald-700' : 'bg-bg-warm text-text-tertiary'}`}>
                <Dumbbell size={18} />
              </div>
              <div className="text-sm font-medium text-text-primary">{CAMPUS_LABELS[c.campus]}</div>
              <div className={`text-xs mt-1 ${c.bookable ? 'text-emerald-600' : 'text-text-tertiary'}`}>
                {c.bookable ? '可预约' : '敬请期待'}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. 场馆详情 */}
      <section className="max-w-content mx-auto px-6 py-12 bg-bg-warm/50">
        <h2 className="section-title">场馆详情</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayVenues.filter((v) => v.bookable).map((v) => (
            <VenueCard key={v.id} venue={v} variant="bookable" />
          ))}
        </div>
      </section>

      {/* 4. 近期可预约教练 */}
      <section className="max-w-content mx-auto px-6 py-12">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <h2 className="text-xl font-semibold text-text-primary">近期可预约教练</h2>
          <div className="flex gap-2">
            {COACH_FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setCoachFilter(f.key)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  coachFilter === f.key
                    ? 'bg-primary text-white'
                    : 'bg-bg-warm text-text-secondary hover:bg-primary-50 hover:text-primary'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCoaches.slice(0, 6).map((c) => (
            <CoachCard key={c.id} coach={c} onBook={handleBookCoach} />
          ))}
        </div>
        {filteredCoaches.length === 0 && (
          <p className="text-center text-sm text-text-tertiary py-8">暂无符合条件的教练</p>
        )}
      </section>

      {/* 5. 新手怎么开始 */}
      <section className="bg-bg-warm/50 py-12">
        <div className="max-w-content mx-auto px-6">
          <h2 className="section-title">新手怎么开始</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {BEGINNER_STEPS.map((s) => (
              <div key={s.num} className="card p-6">
                <div className="text-primary font-bold text-2xl mb-2" style={{ fontFamily: 'var(--font-mono)' }}>{s.num}</div>
                <h3 className="font-semibold text-text-primary mb-2">{s.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 p-4 rounded-lg bg-primary-50 text-sm text-text-secondary flex items-start gap-2">
            <Sparkles size={16} className="text-primary mt-0.5 shrink-0" />
            <span>建议:第一次预约可选择带"新手友好"标签的教练,并提前在训练需求中说明自己的基础和目标。</span>
          </div>
        </div>
      </section>

      {/* 6. 女生与新手友好支持 */}
      <section className="max-w-content mx-auto px-6 py-12">
        <h2 className="section-title">女生与新手友好支持</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FRIENDLY_SUPPORTS.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.title} className="card p-5 flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent-light text-accent flex items-center justify-center shrink-0">
                  <Icon size={18} />
                </div>
                <div>
                  <h3 className="font-medium text-text-primary mb-1">{s.title}</h3>
                  <p className="text-sm text-text-secondary">{s.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 7. 器材指南 */}
      <section className="bg-bg-warm/50 py-12">
        <div className="max-w-content mx-auto px-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="section-title">器材指南</h2>
            <Link href="/equipment" className="text-sm text-primary hover:underline flex items-center gap-1">
              查看详细 <ChevronRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {EQUIPMENTS.map((e) => {
              const Icon = e.icon;
              return (
                <div key={e.title} className="card overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative h-32 overflow-hidden">
                    <img
                      src={e.image}
                      alt={e.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-3 left-3 flex gap-1">
                      {e.tags.map((tag) => (
                        <span key={tag} className="px-2 py-0.5 rounded-full bg-white/20 text-white text-xs backdrop-blur">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-primary-50 text-primary flex items-center justify-center">
                        <Icon size={16} />
                      </div>
                      <h3 className="font-medium text-text-primary">{e.title}</h3>
                    </div>
                    <p className="text-sm text-text-secondary mb-2">{e.desc}</p>
                    <p className="text-xs text-text-tertiary line-clamp-2">{e.detail}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 8. 预约规则 */}
      <section className="max-w-content mx-auto px-6 py-12">
        <h2 className="section-title">预约规则</h2>
        <div className="card p-6">
          <ul className="space-y-3">
            {RULES.map((r, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-text-secondary">
                <span className="w-6 h-6 rounded-full bg-primary-50 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                  {i + 1}
                </span>
                <span className="leading-relaxed pt-0.5">{r}</span>
              </li>
            ))}
          </ul>
          <div className="mt-5 pt-5 border-t border-border-light">
            <Link href="/booking" className="btn-primary text-sm">
              我已了解,去预约 <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* 9. 最新公告 */}
      <section className="bg-bg-warm/50 py-12">
        <div className="max-w-content mx-auto px-6">
          <h2 className="section-title">最新公告</h2>
          <div className="space-y-3">
            {sortedAnnouncements.map((a) => (
              <div key={a.id} className="card p-4 flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-info/20 text-info flex items-center justify-center shrink-0">
                  <Megaphone size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {a.isPinned && <span className="badge bg-danger/15 text-danger">置顶</span>}
                    <h3 className="font-medium text-text-primary text-sm">{a.title}</h3>
                  </div>
                  <p className="text-xs text-text-secondary mt-1 line-clamp-2">{a.content}</p>
                  <p className="text-xs text-text-tertiary mt-1">
                    {new Date(a.publishedAt).toLocaleDateString('zh-CN')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 10. 关于社团 */}
      <section className="max-w-content mx-auto px-6 py-12">
        <div className="card p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary text-white flex items-center justify-center mx-auto mb-4">
            <Dumbbell size={32} />
          </div>
          <h2 className="text-2xl font-bold text-text-primary mb-3">复旦健身社</h2>
          <p className="text-sm text-text-secondary max-w-2xl mx-auto leading-relaxed mb-6">
            复旦大学学生自发组织的健身互助社团,致力于为社员提供科学的训练指导、
            安全的进阶路径和友好的训练氛围。平台由社团内部维护,所有教练均经过认证审核。
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-text-secondary">
            <span className="flex items-center gap-2"><Clock size={14} /> 周一至周日 08:00-22:00</span>
            <span className="flex items-center gap-2"><Users size={14} /> 服务社员 200+ 人</span>
            <span className="flex items-center gap-2"><Shield size={14} /> 认证教练 {approvedCoaches.length} 位</span>
          </div>
        </div>
      </section>
    </div>
  );
}
