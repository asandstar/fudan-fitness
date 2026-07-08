'use client';

// 教练卡片 — 含评分星级和评价摘要
import { BadgeCheck, Sparkles, Users as UsersIcon, Star, Heart } from 'lucide-react';
import type { CoachProfile } from '@/lib/types';
import { avatarInitial } from '@/lib/utils';
import { useApp } from '@/context/AppContext';

interface CoachCardProps {
  coach: CoachProfile;
  onBook?: (coachId: string) => void;
  compact?: boolean;
  showFavorite?: boolean;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={11}
          className={i <= Math.round(rating) ? 'text-warning fill-warning' : 'text-border-light'}
        />
      ))}
      <span className="text-xs text-text-tertiary ml-1">{rating.toFixed(1)}</span>
    </div>
  );
}

export default function CoachCard({ coach, onBook, compact, showFavorite = true }: CoachCardProps) {
  const { isCoachFavorited, toggleFavoriteCoach, currentUser } = useApp();
  const isFavorited = isCoachFavorited(coach.id);

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavoriteCoach(coach.id);
  };

  return (
    <div className="card p-5 flex flex-col relative">
      {showFavorite && currentUser && currentUser.role === 'member' && (
        <button
          onClick={handleFavorite}
          className="absolute top-3 right-3 p-1.5 rounded-full transition-all hover:scale-110 z-10"
        >
          <Heart
            size={18}
            className={isFavorited ? 'text-danger fill-danger' : 'text-text-tertiary hover:text-danger'}
          />
        </button>
      )}
      <div className="flex items-start gap-3 mb-3">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary-light text-white flex items-center justify-center font-bold text-lg shrink-0">
          {avatarInitial(coach.name)}
        </div>
        <div className="flex-1 min-w-0 pr-6">
          <div className="flex items-center gap-1">
            <h3 className="font-bold text-text-primary truncate">{coach.name}</h3>
            {coach.certStatus === 'approved' && (
              <BadgeCheck size={16} className="text-primary shrink-0" />
            )}
          </div>
          <p className="text-xs text-text-tertiary mt-0.5">{coach.department} · {coach.grade}</p>
          <div className="flex items-center gap-3 mt-1 text-xs text-text-secondary">
            <span className="flex items-center gap-0.5"><UsersIcon size={11} /> {coach.totalSessions} 次</span>
            {coach.rating && <StarRating rating={coach.rating} />}
          </div>
        </div>
      </div>

      {!compact && (
        <>
          <p className="text-sm text-text-secondary mb-2 line-clamp-2 italic">"{coach.styleDesc}"</p>
          
          {/* 训练理念 */}
          {coach.trainingPhilosophy && (
            <p className="text-xs text-text-tertiary mb-3 line-clamp-2 border-l-2 border-primary/30 pl-2">
              {coach.trainingPhilosophy}
            </p>
          )}

          {/* 最新学员评价 */}
          {coach.studentReviews && coach.studentReviews.length > 0 && (
            <div className="mb-3 p-2.5 rounded-md bg-bg-warm">
              <div className="flex items-center gap-1 mb-1">
                <Star size={10} className="text-warning fill-warning" />
                <span className="text-xs font-medium text-text-secondary">学员评价</span>
              </div>
              <p className="text-xs text-text-tertiary line-clamp-2">
                "{coach.studentReviews[0].content}"
              </p>
            </div>
          )}
        </>
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
