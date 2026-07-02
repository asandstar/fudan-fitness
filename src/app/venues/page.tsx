'use client';

// 场馆介绍页
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Dumbbell, Activity, StretchHorizontal, TrendingUp } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { CAMPUS_LABELS } from '@/lib/constants';
import VenueCard from '@/components/ui/VenueCard';
import type { VenueCampus } from '@/lib/types';

const TABS = [
  { key: 'bookable', label: '可预约场馆' },
  { key: 'all', label: '全部场馆' },
] as const;

const CAMPUS_FILTERS: { value: VenueCampus | 'all'; label: string }[] = [
  { value: 'all', label: '全部校区' },
  { value: 'handan-south', label: '邯郸南区' },
  { value: 'handan-north', label: '邯郸北区' },
  { value: 'wuliu', label: '五六教工会' },
  { value: 'jiangwan', label: '江湾' },
  { value: 'fenglin', label: '枫林' },
  { value: 'zhangjiang', label: '张江' },
];

const EQUIPMENTS = [
  { icon: Dumbbell, title: '力量器械', desc: '哑铃、杠铃、综合训练器' },
  { icon: Activity, title: '有氧设备', desc: '跑步机、椭圆机、动感单车' },
  { icon: StretchHorizontal, title: '拉伸区', desc: '瑜伽垫、泡沫轴、拉伸架' },
  { icon: TrendingUp, title: '自由重量', desc: '深蹲架、卧推架' },
];

export default function VenuesPage() {
  const { venues } = useApp();
  const [tab, setTab] = useState<typeof TABS[number]['key']>('bookable');
  const [campus, setCampus] = useState<VenueCampus | 'all'>('all');

  const filtered = useMemo(() => {
    let list = venues.slice().sort((a, b) => a.displayOrder - b.displayOrder);
    if (tab === 'bookable') list = list.filter((v) => v.bookable);
    if (campus !== 'all') list = list.filter((v) => v.campus === campus);
    return list;
  }, [venues, tab, campus]);

  const bookable = filtered.filter((v) => v.bookable);
  const flagship = filtered.find((v) => v.campus === 'jiangwan');
  const coming = filtered.filter((v) => !v.bookable && v.campus !== 'jiangwan');

  return (
    <div className="max-w-content mx-auto px-6 py-8">
      {/* 标题 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary mb-2">场馆介绍</h1>
        <p className="text-sm text-text-secondary">
          目前开放预约的场馆为<span className="text-primary font-medium">邯郸南区、邯郸北区、五六教工会</span>。
          江湾、枫林、张江校区场馆暂未开放预约,仅作展示。
        </p>
      </div>

      {/* Tab 切换 */}
      <div className="flex gap-2 mb-4 border-b border-border-light">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key
                ? 'border-primary text-primary'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 校区筛选 */}
      <div className="flex flex-wrap gap-2 mb-6">
        {CAMPUS_FILTERS.map((c) => (
          <button
            key={c.value}
            onClick={() => setCampus(c.value)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              campus === c.value
                ? 'bg-primary text-white'
                : 'bg-bg-warm text-text-secondary hover:bg-primary-50 hover:text-primary'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* 可预约场馆 */}
      {bookable.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-text-primary mb-4">可预约场馆 · {bookable.length} 个</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bookable.map((v) => (
              <VenueCard key={v.id} venue={v} variant="bookable" />
            ))}
          </div>
        </section>
      )}

      {/* 江湾旗舰 */}
      {flagship && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-text-primary mb-4">旗舰场馆</h2>
          <VenueCard venue={flagship} variant="flagship" />
        </section>
      )}

      {/* 枫林/张江 */}
      {coming.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-text-primary mb-4">其他校区</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {coming.map((v) => (
              <VenueCard key={v.id} venue={v} variant="coming" />
            ))}
          </div>
        </section>
      )}

      {/* 空状态 */}
      {filtered.length === 0 && (
        <div className="card p-12 text-center text-text-tertiary text-sm">
          该筛选条件下暂无场馆
        </div>
      )}

      {/* 器材指南轻量模块 */}
      <section className="mt-12 pt-8 border-t border-border-light">
        <h2 className="text-lg font-semibold text-text-primary mb-4">器材指南</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {EQUIPMENTS.map((e) => {
            const Icon = e.icon;
            return (
              <div key={e.title} className="card p-4">
                <div className="w-8 h-8 rounded-lg bg-primary-50 text-primary flex items-center justify-center mb-2">
                  <Icon size={14} />
                </div>
                <h3 className="text-sm font-medium text-text-primary mb-1">{e.title}</h3>
                <p className="text-xs text-text-secondary">{e.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <div className="mt-8 card p-6 bg-primary-50 border-primary text-center">
        <h3 className="font-semibold text-text-primary mb-2">准备好开始训练了吗?</h3>
        <p className="text-sm text-text-secondary mb-4">选择可预约场馆,立即预约认证教练</p>
        <Link href="/booking" className="btn-primary">
          立即预约 <Dumbbell size={14} />
        </Link>
      </div>
    </div>
  );
}
