'use client';

// 时段选择器(周历网格)
// 行 = 08:00-22:00(14行), 列 = 未来7天
import { useMemo } from 'react';
import { Check, Lock } from 'lucide-react';
import type { CoachSlot } from '@/lib/types';
import { EARLIEST_SLOT_HOUR, LATEST_SLOT_HOUR } from '@/lib/constants';
import { formatDate, weekdayLabel } from '@/lib/utils';

interface TimeSlotGridProps {
  days: Date[];                    // 可选日期(未来7天)
  slots: CoachSlot[];              // 该场馆所有可用时段
  occupiedSlots: Set<string>;      // 已被预约的 "date|startTime" 集合
  selectedDate: string | null;     // YYYY-MM-DD
  selectedStartTime: string | null;
  onSelect: (date: string, startTime: string, endTime: string) => void;
}

const HOURS: number[] = [];
for (let h = EARLIEST_SLOT_HOUR; h < LATEST_SLOT_HOUR; h++) HOURS.push(h);

export default function TimeSlotGrid({
  days,
  slots,
  occupiedSlots,
  selectedDate,
  selectedStartTime,
  onSelect,
}: TimeSlotGridProps) {
  // 场馆+日期 → 可用小时集合(从 slots 推导,排除已占用)
  const availableMap = useMemo(() => {
    const map = new Map<string, { endTime: string; available: boolean }>();
    for (const s of slots) {
      const key = `${s.date}|${s.startTime}`;
      const occupied = occupiedSlots.has(key);
      map.set(key, {
        endTime: s.endTime,
        available: s.isAvailable && !occupied,
      });
    }
    return map;
  }, [slots, occupiedSlots]);

  return (
    <div className="card p-4 overflow-hidden">
      {/* 日期选择器(横向) */}
      <div className="mb-4">
        <p className="text-xs text-text-tertiary mb-2">选择日期(未来 7 天)</p>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {days.map((d) => {
            const dateStr = formatDate(d);
            const isSelected = selectedDate === dateStr;
            const isToday = dateStr === formatDate(new Date());
            return (
              <button
                key={dateStr}
                onClick={() => onSelect(dateStr, '', '')}
                className={`shrink-0 w-16 py-2 rounded-lg border text-center transition-all ${
                  isSelected
                    ? 'bg-primary text-white border-primary'
                    : 'bg-surface border-border-light hover:border-primary text-text-primary'
                }`}
              >
                <div className="text-xs opacity-80">{weekdayLabel(d)}</div>
                <div className="text-sm font-bold">{d.getDate()}</div>
                {isToday && <div className="text-[10px] opacity-70">今天</div>}
              </button>
            );
          })}
        </div>
      </div>

      {/* 时段网格 */}
      {!selectedDate ? (
        <div className="py-8 text-center text-sm text-text-tertiary">
          请先选择日期
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[280px]">
            {/* 表头:日期 */}
            <div className="grid grid-cols-[60px_1fr] gap-2 mb-2">
              <div className="text-xs text-text-tertiary text-right pr-2 pt-1">时间</div>
              <div className="text-sm font-medium text-text-primary">
                {(() => {
                  const d = new Date(`${selectedDate}T00:00:00`);
                  return `${d.getMonth() + 1}月${d.getDate()}日 ${weekdayLabel(d)}`;
                })()}
              </div>
            </div>

            {/* 时段列表 */}
            <div className="space-y-1.5">
              {HOURS.map((h) => {
                const startTime = `${String(h).padStart(2, '0')}:00`;
                const endTime = `${String(h + 1).padStart(2, '0')}:00`;
                const key = `${selectedDate}|${startTime}`;
                const info = availableMap.get(key);
                const available = info?.available ?? false;
                const isSelected = selectedDate === selectedDate && selectedStartTime === startTime;

                return (
                  <div key={h} className="grid grid-cols-[60px_1fr] gap-2 items-center">
                    <div className="text-xs text-text-tertiary text-right pr-2 font-mono">
                      {startTime}
                    </div>
                    <button
                      disabled={!available}
                      onClick={() => available && onSelect(selectedDate, startTime, endTime)}
                      className={`w-full py-2.5 rounded-md text-sm font-medium transition-all border ${
                        isSelected
                          ? 'bg-primary text-white border-primary'
                          : available
                            ? 'bg-success/20 text-emerald-700 border-success/40 hover:bg-success/30'
                            : 'bg-bg-warm text-text-tertiary border-border-light cursor-not-allowed'
                      }`}
                    >
                      {isSelected ? (
                        <span className="flex items-center justify-center gap-1">
                          <Check size={12} /> 已选 {startTime}-{endTime}
                        </span>
                      ) : available ? (
                        <span>{startTime}-{endTime} · 可约</span>
                      ) : (
                        <span className="flex items-center justify-center gap-1 text-text-tertiary">
                          <Lock size={11} /> 不可约
                        </span>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
