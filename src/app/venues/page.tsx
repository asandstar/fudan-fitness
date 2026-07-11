'use client';

// 场馆介绍页
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Dumbbell, Activity, StretchHorizontal, TrendingUp, ChevronRight, ExternalLink, Shield, Navigation, AlertTriangle } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { CAMPUS_LABELS } from '@/lib/constants';
import VenueCard from '@/components/ui/VenueCard';
import VenueHeatmap from '@/components/ui/VenueHeatmap';
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
  {
    icon: Dumbbell,
    title: '力量器械区',
    desc: '哑铃、杠铃、龙门架、高位下拉、坐姿推举、腿部推蹬等',
    detail: '适合增肌、力量提升、塑形训练。建议初学者从固定器械开始,掌握动作规范后再使用自由重量',
    tags: ['增肌', '力量', '塑形'],
    source: 'ACSM运动指南建议:每周进行2-3次力量训练,每次训练不同肌群',
  },
  {
    icon: Activity,
    title: '有氧训练区',
    desc: '跑步机、椭圆机、动感单车、划船机等心肺训练设备',
    detail: '适合减脂、心肺功能提升。建议每周进行3-5次,每次30-60分钟中等强度有氧运动',
    tags: ['减脂', '心肺', '耐力'],
    source: 'WHO推荐:成年人每周至少进行150分钟中等强度有氧活动',
  },
  {
    icon: StretchHorizontal,
    title: '拉伸放松区',
    desc: '瑜伽垫、泡沫轴、筋膜枪、拉伸架等放松恢复设备',
    detail: '训练前后必须进行10-15分钟拉伸,有效预防受伤、缓解肌肉酸痛、提升柔韧性',
    tags: ['放松', '柔韧性', '恢复'],
    source: 'NSCA建议:每次训练前后进行动态热身和静态拉伸',
  },
  {
    icon: TrendingUp,
    title: '自由重量区',
    desc: '深蹲架、卧推架、硬拉台、引体向上架等自由训练设备',
    detail: '适合进阶力量训练者。使用前请确保掌握标准动作,建议在教练指导下进行',
    tags: ['进阶', '爆发力', '极限'],
    source: '美国力量与体能协会(NSCA):自由重量训练能最大化刺激肌肉生长',
  },
];

const SOURCES = [
  { name: 'ACSM', fullName: '美国运动医学会', url: 'https://www.acsm.org/', desc: '全球最权威的运动科学与医学专业组织' },
  { name: 'NSCA', fullName: '美国国家体能协会', url: 'https://www.nsca.com/', desc: '体能训练领域的国际权威机构' },
  { name: 'WHO', fullName: '世界卫生组织', url: 'https://www.who.int/', desc: '全球公共卫生领域的权威机构' },
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

      {/* 场馆人流热力图 */}
      <section className="mb-10">
        <VenueHeatmap venues={venues} />
      </section>

      {/* 器材指南详细模块 */}
      <section className="mt-12 pt-8 border-t border-border-light">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-text-primary">器材指南</h2>
          <Link href="/equipment" className="text-sm text-primary hover:underline flex items-center gap-1">
            完整器材手册 <ChevronRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {EQUIPMENTS.map((e) => {
            const Icon = e.icon;
            return (
              <div key={e.title} className="card p-5">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary-50 text-primary flex items-center justify-center shrink-0">
                    <Icon size={20} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-medium text-text-primary">{e.title}</h3>
                      <div className="flex gap-1">
                        {e.tags.map((tag) => (
                          <span key={tag} className="px-2 py-0.5 rounded-full bg-primary-50 text-primary text-xs">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-text-secondary mb-2">{e.desc}</p>
                    <p className="text-xs text-text-tertiary mb-3">{e.detail}</p>
                    <div className="flex items-center gap-2 text-xs text-info bg-info/10 px-3 py-2 rounded-lg">
                      <ExternalLink size={12} />
                      <span>{e.source}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 权威信息源 */}
        <div className="mt-6 p-5 rounded-lg bg-bg-warm">
          <h3 className="text-sm font-medium text-text-primary mb-3">参考资料来源</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {SOURCES.map((s) => (
              <div key={s.name} className="flex items-center gap-3 p-3 rounded-md bg-surface border border-border-light">
                <div className="w-8 h-8 rounded-lg bg-primary-50 text-primary flex items-center justify-center font-bold text-sm">
                  {s.name}
                </div>
                <div>
                  <div className="text-sm font-medium text-text-primary">{s.fullName}</div>
                  <div className="text-xs text-text-tertiary">{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 场馆对比表 */}
      <section className="mt-12 pt-10 border-t border-border-light">
        <h2 className="text-lg font-semibold text-text-primary mb-4">场馆对比</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-bg-warm">
                <th className="text-left p-3 font-medium text-text-primary">场馆名称</th>
                <th className="text-left p-3 font-medium text-text-primary">校区</th>
                <th className="text-left p-3 font-medium text-text-primary">开放时间</th>
                <th className="text-center p-3 font-medium text-text-primary">容量</th>
                <th className="text-center p-3 font-medium text-text-primary">状态</th>
              </tr>
            </thead>
            <tbody>
              {venues.slice().sort((a, b) => a.displayOrder - b.displayOrder).map((v) => (
                <tr key={v.id} className="border-b border-border-light hover:bg-bg-warm/50 transition-colors">
                  <td className="p-3 font-medium text-text-primary">{v.name}</td>
                  <td className="p-3 text-text-secondary">{CAMPUS_LABELS[v.campus]}</td>
                  <td className="p-3 text-text-secondary">{v.openTime}-{v.closeTime}</td>
                  <td className="p-3 text-center">{v.capacity}人</td>
                  <td className="p-3 text-center">
                    {v.bookable ? (
                      <span className="badge bg-success/30 text-status-success">可预约</span>
                    ) : (
                      <span className="badge bg-bg-warm text-text-tertiary">展示中</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 通用使用须知 */}
      <section className="mt-12 p-6 rounded-lg bg-warning/5 border border-warning/20">
        <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
          <Shield size={18} className="text-warning" /> 场馆使用须知
        </h2>
        <ul className="space-y-2">
          {[
            '所有场馆均需携带校园卡刷卡进入',
            '必须穿着运动鞋(禁止拖鞋、皮鞋、高跟鞋)',
            '训练结束后请将器材归位到原位置',
            '禁止在力量区域内奔跑、追逐或打闹',
            '大重量自由重量训练建议结伴进行,确保安全',
            '保持场地清洁,带走个人垃圾',
            '如发现器材损坏请及时告知管理人员',
          ].map((rule, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
              <AlertTriangle size={14} className="text-warning shrink-0 mt-0.3" />
              <span>{rule}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* CTA */}
      <div className="mt-8 card p-6 bg-primary-50 border border-primary/30 text-center">
        <h3 className="font-semibold text-text-primary mb-2">准备好开始训练了吗?</h3>
        <p className="text-sm text-text-secondary mb-4">选择可预约场馆,立即预约认证教练</p>
        <Link href="/booking" className="btn-primary">
          立即预约 <Dumbbell size={14} />
        </Link>
      </div>

      {/* 信息来源标注 */}
      <div className="mt-8 p-4 rounded-lg bg-bg-warm border border-border-light">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <ExternalLink size={14} />
            <span>信息来源：《复旦体育打卡地图》- 复旦研究生公众号</span>
          </div>
          <a
            href="https://www.toutiao.com/article/7067406348891292192/?&source=m_redirect&wid=1783495816705"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            查看原文 <ChevronRight size={12} />
          </a>
        </div>
        <p className="text-xs text-text-tertiary mt-2 text-center">
          场馆位置信息参考自复旦研究生公众号文章，仅供校园健身服务参考使用
        </p>
      </div>
    </div>
  );
}
