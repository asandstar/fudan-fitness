'use client';

// 教练卡片
import { BadgeCheck, Sparkles, Users as UsersIcon } from 'lucide-react';
import type { CoachProfile } from '@/lib/types';
import { avatarInitial } from '@/lib/utils';

interface CoachCardProps {
  coach: CoachProfile;
  onBook?: (coachId: string) => void;
  compact?: boolean;
}

export default function CoachCard({ coach, onBook, compact }: CoachCardProps) {
  return (
    <div className="card p-5 flex flex-col">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary-light text-white flex items-center justify-center font-bold text-lg shrink-0">
          {avatarInitial(coach.name)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <h3 className="font-bold text-text-primary truncate">{coach.name}</h3>
            {coach.certStatus === 'approved' && (
              <BadgeCheck size={16} className="text-primary shrink-0" />
            )}
          </div>
          <p className="text-xs text-text-tertiary mt-0.5">{coach.department} · {coach.grade}</p>
          <div className="flex items-center gap-2 mt-1 text-xs text-text-secondary">
            <span className="flex items-center gap-0.5"><UsersIcon size={11} /> {coach.totalSessions} 次</span>
          </div>
        </div>
      </div>

      {!compact && (
        <p className="text-sm text-text-secondary mb-3 line-clamp-2 italic">"{coach.styleDesc}"</p>
      )}

      <div className="flex flex-wrap gap-1.5 mb-3">
        {coach.specialties.map((s) => (
          <span key={s} className="badge bg-primary-50 text-primary">{s}</span>
        ))}
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {coach.isBeginnerFriendly && (
          <span className="badge bg-accent-light text-accent"><Sparkles size={10} /> 新手友好</span>
        )}
        {coach.isFemaleFriendly && (
          <span className="badge bg-accent-light text-accent">女生教练</span>
        )}
      </div>

      {onBook && (
        <button
          onClick={() => onBook(coach.id)}
          className="btn-primary w-full mt-auto text-sm"
        >
          预约 TA
        </button>
      )}
    </div>
  );
}
