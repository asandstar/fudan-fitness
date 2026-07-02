'use client';

// 场馆卡片(3 变体:bookable/flagship/coming)
import Link from 'next/link';
import { MapPin, Clock, Users, ArrowRight } from 'lucide-react';
import { CAMPUS_LABELS } from '@/lib/constants';
import type { Venue } from '@/lib/types';

interface VenueCardProps {
  venue: Venue;
  variant?: 'bookable' | 'flagship' | 'coming';
  onBook?: () => void;
}

export default function VenueCard({ venue, variant = 'bookable', onBook }: VenueCardProps) {
  if (variant === 'flagship') {
    return (
      <div className="card overflow-hidden flex flex-col md:flex-row">
        <div className="relative w-full md:w-1/2 h-48 md:h-auto min-h-[200px] bg-gradient-to-br from-info/30 to-primary/20">
          {venue.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={venue.imageUrl} alt={venue.name} className="absolute inset-0 w-full h-full object-cover" />
          ) : null}
          <span className="absolute top-3 left-3 badge bg-info/90 text-white">展示中</span>
          <span className="absolute top-3 right-3 badge bg-primary text-white">旗舰</span>
        </div>
        <div className="flex-1 p-5">
          <h3 className="font-bold text-text-primary text-lg mb-1">{venue.name}</h3>
          <p className="text-xs text-text-tertiary mb-3">{CAMPUS_LABELS[venue.campus]}</p>
          <p className="text-sm text-text-secondary mb-4">{venue.description}</p>
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

  // bookable
  return (
    <div className="card p-5 flex flex-col">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="font-bold text-text-primary text-lg">{venue.name}</h3>
          <p className="text-xs text-text-tertiary mt-0.5 flex items-center gap-1">
            <MapPin size={12} /> {venue.address}
          </p>
        </div>
        <span className="badge bg-success/30 text-emerald-700">可预约</span>
      </div>

      <p className="text-sm text-text-secondary mt-2 mb-3">{venue.description}</p>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {venue.facilities.map((f) => (
          <span key={f} className="badge bg-primary-50 text-primary">{f}</span>
        ))}
      </div>

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
  );
}
