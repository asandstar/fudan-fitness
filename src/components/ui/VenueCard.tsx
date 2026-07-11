'use client';

// 场馆卡片(3 变体:bookable/flagship/coming) — CSS渐变头部，无外部图片
import Link from 'next/link';
import { MapPin, Clock, Users, ArrowRight, Dumbbell, AlertTriangle, Navigation, Info } from 'lucide-react';
import { CAMPUS_LABELS } from '@/lib/constants';
import type { Venue } from '@/lib/types';

interface VenueCardProps {
  venue: Venue;
  variant?: 'bookable' | 'flagship' | 'coming';
  onBook?: () => void;
}

// 校区 → 渐变class映射
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

export default function VenueCard({ venue, variant = 'bookable', onBook }: VenueCardProps) {
  const gradientClass = getVenueGradient(venue.campus);

  if (variant === 'flagship') {
    return (
      <div className="card overflow-hidden flex flex-col md:flex-row">
        <div className={`relative w-full md:w-1/2 h-48 md:h-auto min-h-[200px] ${gradientClass} flex items-center justify-center`}>
          <Dumbbell size={64} strokeWidth={1} className="text-white/30" />
          <span className="absolute top-3 left-3 badge bg-white/20 text-white backdrop-blur-sm">展示中</span>
          <span className="absolute top-3 right-3 badge bg-white/25 text-white backdrop-blur-sm">旗舰</span>
        </div>
        <div className="flex-1 p-5">
          <h3 className="font-bold text-text-primary text-lg mb-1">{venue.name}</h3>
          <p className="text-xs text-text-tertiary mb-3">{CAMPUS_LABELS[venue.campus]}</p>
          <p className="text-sm text-text-secondary mb-4">{venue.description}</p>

          {venue.features && venue.features.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {venue.features.map((f) => (
                <span key={f} className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">
                  {f}
                </span>
              ))}
            </div>
          )}

          {venue.layoutInfo && (
            <p className="text-xs text-text-tertiary mb-2"><Info size={10} className="inline mr-1" />{venue.layoutInfo}</p>
          )}

          <div className="flex flex-wrap gap-1.5 mb-3">
            {venue.facilities.map((f) => (
              <span key={f} className="badge bg-bg-warm text-text-secondary">{f}</span>
            ))}
          </div>
          <div className="flex items-center gap-4 text-xs text-text-tertiary">
            <span className="flex items-center gap-1"><Clock size={12} /> {venue.openTime}-{venue.closeTime}</span>
            <span className="flex items-center gap-1"><Users size={12} /> 容纳 {venue.capacity}人</span>
          </div>
          <p className="mt-3 text-xs text-text-tertiary italic">该场馆暂未开放预约,仅供展示</p>
        </div>
      </div>
    );
  }

  if (variant === 'coming') {
    return (
      <div className="card p-5 opacity-90">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-bold text-text-primary">{venue.name}</h3>
          <span className="badge bg-bg-warm text-text-tertiary">敬请期待</span>
        </div>
        <p className="text-xs text-text-tertiary mb-2">{CAMPUS_LABELS[venue.campus]}</p>
        <p className="text-sm text-text-secondary line-clamp-2">{venue.description}</p>
        <div className="flex items-center gap-3 mt-3 text-xs text-text-tertiary">
          <span className="flex items-center gap-1"><Clock size={12} /> {venue.openTime}-{venue.closeTime}</span>
        </div>
      </div>
    );
  }

  // bookable — 渐变头部
  return (
    <div className="card overflow-hidden flex flex-col group">
      <div className={`relative h-28 ${gradientClass} flex items-center justify-center`}>
        <Dumbbell size={40} strokeWidth={1.2} className="text-white/25 group-hover:scale-110 transition-transform duration-300" />
        <span className="absolute top-2 right-2 badge bg-white/20 text-white text-xs backdrop-blur-sm">可预约</span>
      </div>
      <div className="p-5 flex flex-col flex-1">
        <div className="mb-2">
          <h3 className="font-bold text-text-primary text-lg">{venue.name}</h3>
          <p className="text-xs text-text-tertiary mt-0.5 flex items-center gap-1">
            <MapPin size={12} /> {venue.address}
          </p>
        </div>

        <p className="text-sm text-text-secondary mt-2 mb-3 flex-1">{venue.description}</p>

        {/* 高峰时段提示 */}
        {venue.peakHours && (
          <div className="flex items-start gap-1.5 mb-2 text-xs text-warning bg-warning/10 px-2.5 py-1.5 rounded-md">
            <AlertTriangle size={12} className="shrink-0 mt-0.3" />
            <span>{venue.peakHours}</span>
          </div>
        )}

        {/* 场馆特色 */}
        {venue.features && venue.features.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {venue.features.map((f) => (
              <span key={f} className="px-2 py-0.5 rounded-full bg-success/10 text-status-success text-xs">
                {f}
              </span>
            ))}
          </div>
        )}

        {/* 器材概览 */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {venue.facilities.slice(0, 4).map((f) => (
            <span key={f} className="badge bg-primary-50 text-primary text-xs">{f}</span>
          ))}
          {venue.facilities.length > 4 && (
            <span className="badge bg-bg-warm text-text-tertiary text-xs">+{venue.facilities.length - 4}</span>
          )}
        </div>

        {/* 交通指引 */}
        {venue.transportation && (
          <div className="flex items-start gap-1.5 text-xs text-text-tertiary mb-2">
            <Navigation size={11} className="shrink-0 mt-0.3" />
            <span>{venue.transportation}</span>
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-text-tertiary mt-auto pt-3 border-t border-border-light">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1"><Clock size={12} /> {venue.openTime}-{venue.closeTime}</span>
            <span className="flex items-center gap-1"><Users size={12} /> {venue.capacity}人</span>
          </div>
        </div>

        {onBook ? (
          <button onClick={onBook} className="btn-primary w-full mt-3 text-sm">
            去预约 <ArrowRight size={14} />
          </button>
        ) : (
          <Link href={`/booking?venue=${venue.id}`} className="btn-primary w-full mt-3 text-sm">
            去预约 <ArrowRight size={14} />
          </Link>
        )}
      </div>
    </div>
  );
}
