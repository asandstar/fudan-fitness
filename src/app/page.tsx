'use client';

// 首页 — 全模块(含平台亮点+数据看板+训练计划)
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import {
  ArrowRight, Dumbbell, Users, Clock, Shield, Heart, Sparkles,
  TrendingUp, Activity, Dumbbell as DumbbellIcon, StretchHorizontal,
  Megaphone, ChevronRight, BookOpen, Star, Zap, MapPin, Award,
  Target, CheckCircle2, Flame, Trophy, CalendarDays, GraduationCap,
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

// 器材类型 → 渐变class映射
const EQUIPMENT_GRADIENTS: Record<string, string> = {
  '力量器械区': 'equipment-gradient-strength',
  '有氧训练区': 'equipment-gradient-cardio',
  '拉伸放松区': 'equipment-gradient-stretch',
  '自由重量区': 'equipment-gradient-freeweight',
};

const EQUIPMENTS = [
  {
    icon: DumbbellIcon,
    title: '力量器械区',
    desc: '哑铃、杠铃、龙门架、高位下拉、坐姿推举、腿部推蹬等',
    detail: '适合增肌、力量提升、塑形。建议初学者从固定器械开始',
    tags: ['增肌', '力量', '塑形'],
    gradientClass: 'equipment-gradient-strength',
  },
  {
    icon: Activity,
    title: '有氧训练区',
    desc: '跑步机、椭圆机、动感单车、划船机等心肺设备',
    detail: '适合减脂、心肺提升。建议每周3-5次,每次30-60分钟',
    tags: ['减脂', '心肺', '耐力'],
    gradientClass: 'equipment-gradient-cardio',
  },
  {
    icon: StretchHorizontal,
    title: '拉伸放松区',
    desc: '瑜伽垫、泡沫轴、筋膜枪、拉伸架等恢复设备',
    detail: '训练前后10-15分钟拉伸,预防受伤、缓解酸痛',
    tags: ['放松', '柔韧性', '恢复'],
    gradientClass: 'equipment-gradient-stretch',
  },
  {
    icon: TrendingUp,
    title: '自由重量区',
    desc: '深蹲架、卧推架、硬拉台、引体向上架等',
    detail: '适合进阶力量训练者。使用前请确保掌握标准动作',
    tags: ['进阶', '爆发力', '极限'],
    gradientClass: 'equipment-gradient-freeweight',
  },
];

// 平台亮点
const HIGHLIGHTS = [
  { icon: Award, title: '专业认证教练', desc: '所有教练经严格认证审核,平均带练经验2年以上', color: 'primary' },
  { icon: MapPin, title: '全覆盖6大校区', desc: '邯郸南区/北区、五六教工会、江湾、枫林、张江', color: 'info' },
  { icon: Shield, title: '科学训练体系', desc: '参考中国体育科学学会+国际权威标准,动作规范优先', color: 'success' },
  { icon: Users, title: '爱好者互助氛围', desc: '学生互助带练,零基础友好,无门槛参与', color: 'accent' },
];

const QUICK_LINKS = [
  { icon: MapPin, title: '健身房地图', desc: '查看全校区健身房位置', href: '/gym-map' },
  { icon: BookOpen, title: '器材指南', desc: '专业器材使用教程', href: '/equipment' },
];

// 平台数据
const PLATFORM_STATS = [
  { value: '200+', label: '累计服务社员', icon: Users },
  { value: '1280+', label: '完成带练次数', icon: CheckCircle2 },
  { value: '4.9', label: '教练平均评分', icon: Star },
  { value: '98%', label: '学员满意度', icon: TrendingUp },
];

// 训练计划推荐
const TRAINING_PLANS = [
  {
    name: '新手入门计划',
    weeks: 4,
    level: '零基础',
    goal: '建立正确训练习惯,掌握基本器械用法',
    schedule: ['周一: 上肢力量 + 有氧20min', '周三: 下肢力量 + 核心', '周五: 全身循环 + 拉伸30min'],
    tips: '前两周以动作为主,不追求大重量',
    icon: Sparkles,
  },
  {
    name: '减脂塑形计划',
    weeks: 6,
    level: '有基础',
    goal: '降低体脂率,塑造线条,提升心肺功能',
    schedule: ['周一: HIIT间歇训练40min', '周二: 力量+有氧组合', '周四: 纯有氧45min', '周六: 户外跑/游泳60min'],
    tips: '配合饮食控制,效果更佳',
    icon: Flame,
  },
  {
    name: '增肌增力计划',
    weeks: 8,
    level: '进阶',
    goal: '增加肌肉量,提升绝对力量水平',
    schedule: ['周一: 胸+三头', '周二: 背+二头', '周三: 休息/拉伸', '周四: 腿部+肩', '周六: 弱项强化'],
    tips: '保证充足蛋白质摄入和睡眠时间',
    icon: Zap,
  },
];

// 校区渐变映射
function getVenueGradient(campus: string): string {
  const map: Record<string, string> = {
    'handan-south': 'venue-gradient-handan-south',
    'handan-north': 'venue-gradient-handan-north',
    'wuliu': 'venue-gradient-wuliu',
    'jiangwan': 'venue-gradient-jiangwan',
    'fenglin': 'venue-gradient-fenglin',
    'zhangjiang': 'venue-gradient-zhangjiang',
  };
  return map[campus] || 'venue-gradient-handan-south';
}

const RULES = [
  '每位社员每周最多预约 3 次带练',
  '预约开始前 24 小时可免费取消,之后取消记违约',
  '违约 3 次将被禁约 30 天',
  '教练需在 12 小时内审核预约,超时自动取消',
  '同一教练同一时段只能被预约一次',
];

// 学员评价
const TESTIMONIALS = [
  {
    name: '陈思远',
    dept: '计算机学院',
    grade: '2022级',
    rating: 5,
    content: '第一次进健身房完全不知所措，幸好预约了新手友好的教练。动作讲解非常细致，现在我已经能独立完成基础训练了！',
    coach: '张教练',
    tag: '新手入门',
  },
  {
    name: '林雨萱',
    dept: '新闻学院',
    grade: '2023级',
    rating: 5,
    content: '女生教练真的很贴心！从器械使用到训练计划都考虑得很周到，训练氛围也很轻松，完全没有尴尬感。',
    coach: '李教练',
    tag: '女生友好',
  },
  {
    name: '王浩然',
    dept: '物理系',
    grade: '2021级',
    rating: 4,
    content: '跟着教练练了两个月，卧推从空杆进步到50kg。教练不仅教动作，还讲了很多训练原理，受益匪浅。',
    coach: '赵教练',
    tag: '增肌增力',
  },
  {
    name: '刘子琪',
    dept: '管理学院',
    grade: '2022级',
    rating: 5,
    content: '预约系统很方便，可以选择自己校区附近的健身房。教练会根据我的课表灵活安排时间，真的很适合学生党。',
    coach: '周教练',
    tag: '灵活预约',
  },
];

// FAQ
const FAQS = [
  {
    q: '我完全没有健身经验，可以预约教练吗？',
    a: '当然可以！平台专为新手设计，所有教练都经过认证审核。建议预约带「新手友好」标签的教练，他们会从基础动作开始耐心指导。',
  },
  {
    q: '预约带练需要收费吗？',
    a: '本平台为校内健身爱好者互助项目，带练服务完全免费。只需遵守预约规则，珍惜教练时间即可。',
  },
  {
    q: '临时有事不能去训练，怎么取消？',
    a: '开课前24小时可免费取消，不影响信用。24小时内取消将记违约一次，累计3次将禁约30天。',
  },
  {
    q: '女生可以指定女教练吗？',
    a: '可以。在教练筛选中选择「女生教练」，或预约时在备注中说明即可。平台有多位认证女生教练。',
  },
  {
    q: '我想成为认证教练，需要什么条件？',
    a: '在本校就读的健身爱好者均可申请。需在个人中心提交申请，填写擅长领域和带练风格，管理员审核通过后即可成为认证教练。',
  },
];

export default function HomePage() {
  const { venues, coaches, announcements, currentUser } = useApp();
  const [coachFilter, setCoachFilter] = useState<typeof COACH_FILTERS[number]['key']>('all');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
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
    { campus: 'jiangwan', bookable: true },
    { campus: 'fenglin', bookable: false },
    { campus: 'zhangjiang', bookable: false },
  ];

  return (
    <div>
      {/* 1. Hero 区 — CSS渐变背景 */}
      <section className="hero-gradient">
        <div className="relative max-w-content mx-auto px-6 py-20 md:py-28">
          <div className="max-w-2xl text-white relative z-10">
            <span className="badge bg-primary/90 text-white mb-4 inline-flex items-center gap-1">
              <Sparkles size={12} /> 互助带练 · 健身爱好者
            </span>
            <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-4">
              复旦健身爱好者<br />互助平台
            </h1>
            <p className="text-base md:text-lg text-white/85 mb-6 leading-relaxed">
              连接学员与认证教练,1 对 1 带练预约。零基础友好、女生友好,
              让科学训练触手可及。
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/booking" className="btn-primary text-base px-6 py-3">
                立即预约教练 <ArrowRight size={16} />
              </Link>
              <Link href="/match" className="inline-flex items-center gap-2 text-base px-6 py-3 bg-white/10 text-white hover:bg-white/20 rounded-md transition-colors border border-white/20">
                <Sparkles size={16} /> AI智能匹配
              </Link>
              <Link href="/venues" className="inline-flex items-center text-base px-6 py-3 bg-white/10 text-white hover:bg-white/20 rounded-md transition-colors border border-white/20">
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

      {/* 2. 平台亮点 */}
      <section className="max-w-content mx-auto px-6 py-10 -mt-8 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {HIGHLIGHTS.map((h) => {
            const Icon = h.icon;
            return (
              <div key={h.title} className="card p-4 flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl bg-${h.color}-50 text-${h.color} flex items-center justify-center shrink-0`}>
                  <Icon size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-text-primary mb-0.5">{h.title}</h3>
                  <p className="text-xs text-text-secondary leading-relaxed">{h.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* 快速入口 */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          {QUICK_LINKS.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.title}
                href={link.href}
                className="card p-4 flex items-center gap-3 hover:border-primary transition-colors group"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Icon size={18} className="text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-text-primary">{link.title}</h3>
                  <p className="text-xs text-text-secondary">{link.desc}</p>
                </div>
                <ChevronRight size={16} className="text-text-tertiary group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </Link>
            );
          })}
        </div>
      </section>

      {/* 3. 本周可约概览 */}
      <section className="max-w-content mx-auto px-6 py-10">
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
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${c.bookable ? 'bg-success/30 text-status-success' : 'bg-bg-warm text-text-tertiary'}`}>
                <Dumbbell size={18} />
              </div>
              <div className="text-sm font-medium text-text-primary">{CAMPUS_LABELS[c.campus]}</div>
              <div className={`text-xs mt-1 ${c.bookable ? 'text-status-success' : 'text-text-tertiary'}`}>
                {c.bookable ? '可预约' : '敬请期待'}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 4. 场馆详情 */}
      <section className="max-w-content mx-auto px-6 py-10 bg-bg-warm/50">
        <h2 className="section-title">场馆详情</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayVenues.filter((v) => v.bookable).map((v) => (
            <VenueCard key={v.id} venue={v} variant="bookable" />
          ))}
        </div>
      </section>

      {/* 5. 平台数据看板 */}
      <section className="max-w-content mx-auto px-6 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {PLATFORM_STATS.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="card p-5 text-center">
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
                  <Icon size={18} />
                </div>
                <div className="text-2xl font-bold text-text-primary mb-1">{s.value}</div>
                <div className="text-xs text-text-tertiary">{s.label}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 6. 近期可预约教练 */}
      <section className="max-w-content mx-auto px-6 py-10">
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

      {/* 7. 新手怎么开始 */}
      <section className="bg-bg-warm/50 py-10">
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

      {/* 8. 女生与新手友好支持 */}
      <section className="max-w-content mx-auto px-6 py-10">
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

      {/* 9. 器材指南 — 渐变+图标替代图片 */}
      <section className="bg-bg-warm/50 py-10">
        <div className="max-w-content mx-auto px-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="section-title">器材指南</h2>
            <Link href="/equipment" className="text-sm text-primary hover:underline flex items-center gap-1">
              查看详细手册 <ChevronRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {EQUIPMENTS.map((e) => {
              const Icon = e.icon;
              return (
                <div key={e.title} className="card overflow-hidden hover:shadow-lg transition-shadow group">
                  {/* 渐变头部区域 + 大图标 */}
                  <div className={`relative h-32 ${e.gradientClass} flex items-center justify-center`}>
                    <Icon size={48} strokeWidth={1.5} className="text-white/90 group-hover:scale-110 transition-transform duration-300" />
                    {/* 标签浮在右下角 */}
                    <div className="absolute bottom-3 left-3 right-3 flex gap-1 justify-end">
                      {e.tags.map((tag) => (
                        <span key={tag} className="px-2 py-0.5 rounded-full bg-white/25 text-white text-xs backdrop-blur-sm">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium text-text-primary mb-1">{e.title}</h3>
                    <p className="text-sm text-text-secondary mb-2">{e.desc}</p>
                    <p className="text-xs text-text-tertiary line-clamp-2">{e.detail}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 10. 训练计划推荐 (新增) */}
      <section className="max-w-content mx-auto px-6 py-10">
        <h2 className="section-title">热门训练计划</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {TRAINING_PLANS.map((plan) => {
            const PlanIcon = plan.icon;
            return (
              <div key={plan.name} className="card p-5 hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-primary-50 text-primary flex items-center justify-center shrink-0">
                    <PlanIcon size={18} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-text-primary">{plan.name}</h3>
                    <div className="flex items-center gap-2 text-xs text-text-tertiary mt-0.5">
                      <CalendarDays size={11} /> {plan.weeks}周 · <Target size={11} /> {plan.level}
                    </div>
                  </div>
                </div>
                <p className="text-sm text-text-secondary mb-3"><strong>目标:</strong> {plan.goal}</p>
                <div className="mb-3">
                  <p className="text-xs font-medium text-text-tertiary mb-1.5">每周安排</p>
                  <ul className="space-y-1">
                    {plan.schedule.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-text-secondary">
                        <CheckCircle2 size={12} className="text-success mt-0.3 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-warning/10 text-xs text-text-secondary">
                  <GraduationCap size={14} className="text-warning shrink-0 mt-0.5" />
                  <span>{plan.tips}</span>
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-4 text-center text-sm text-text-tertiary">
          需要个性化训练计划? <Link href="/booking" className="text-primary hover:underline">预约教练</Link> 可获取一对一指导
        </p>
      </section>

      {/* 10.5 学员评价 */}
      <section className="bg-bg-warm/50 py-10">
        <div className="max-w-content mx-auto px-6">
          <h2 className="section-title">学员反馈</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="card p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-light text-white flex items-center justify-center font-bold text-sm">
                      {t.name[0]}
                    </div>
                    <div>
                      <div className="font-medium text-text-primary text-sm">{t.name}</div>
                      <div className="text-xs text-text-tertiary">{t.dept} · {t.grade}</div>
                    </div>
                  </div>
                  <span className="badge bg-primary-50 text-primary text-xs">{t.tag}</span>
                </div>
                <div className="flex items-center gap-0.5 mb-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={12} className={i < t.rating ? 'text-warning fill-warning' : 'text-text-tertiary'} />
                  ))}
                </div>
                <p className="text-sm text-text-secondary leading-relaxed">"{t.content}"</p>
                <p className="text-xs text-text-tertiary mt-2">—— 教练 {t.coach} 带练</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 11. 预约规则 */}
      <section className="max-w-content mx-auto px-6 py-10">
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

      {/* 11.5 常见问题 */}
      <section className="max-w-content mx-auto px-6 py-10">
        <h2 className="section-title">常见问题</h2>
        <div className="space-y-2">
          {FAQS.map((faq, i) => (
            <div key={i} className="card overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-bg-warm/50 transition-colors"
              >
                <span className="font-medium text-text-primary text-sm">{faq.q}</span>
                <ChevronRight
                  size={16}
                  className={`text-text-tertiary transition-transform shrink-0 ml-2 ${openFaq === i ? 'rotate-90' : ''}`}
                />
              </button>
              {openFaq === i && (
                <div className="px-4 pb-4 text-sm text-text-secondary leading-relaxed animate-fade-in">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 12. 最新公告 */}
      <section className="bg-bg-warm/50 py-10">
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

      {/* 13. 关于平台 */}
      <section className="max-w-content mx-auto px-6 py-10">
        <div className="card p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary text-white flex items-center justify-center mx-auto mb-4">
            <Dumbbell size={32} />
          </div>
          <h2 className="text-2xl font-bold text-text-primary mb-3">复旦健身爱好者互助平台</h2>
          <p className="text-sm text-text-secondary max-w-2xl mx-auto leading-relaxed mb-6">
            复旦大学学生健身爱好者自发组织的互助项目,致力于为参与者提供科学的训练指导、
            安全的进阶路径和友好的训练氛围。平台由爱好者社区维护,所有教练均经过认证审核。
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-text-secondary">
            <span className="flex items-center gap-2"><Clock size={14} /> 周一至周日 08:00-22:00</span>
            <span className="flex items-center gap-2"><Users size={14} /> 服务社员 200+ 人</span>
            <span className="flex items-center gap-2"><Shield size={14} /> 认证教练 {approvedCoaches.length} 位</span>
            <span className="flex items-center gap-2"><Trophy size={14} /> 覆盖 6 大校区</span>
          </div>
        </div>
      </section>
    </div>
  );
}
