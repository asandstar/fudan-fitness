'use client';

import { useState } from 'react';
import { ThermometerSun, Clock, TrendingDown, Info } from 'lucide-react';
import type { Venue } from '@/lib/types';

interface VenueHeatmapProps {
  venues: Venue[];
}

const DAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
const HOURS = ['08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21'];

function generateHeatData(venueId: string): number[][] {
  const data: number[][] = [];
  const seed = venueId.charCodeAt(venueId.length - 1);

  for (let d = 0; d < 7; d++) {
    const row: number[] = [];
    for (let h = 0; h < HOURS.length; h++) {
      let base = 0.2;

      if (h >= 2 && h <= 4) base += 0.3;
      if (h >= 7 && h <= 10) base += 0.5;

      if (d >= 5) {
        base += 0.15;
        if (h >= 4 && h <= 7) base += 0.2;
      }

      const noise = ((seed * (d + 1) * (h + 1)) % 100) / 100 * 0.15;
      const value = Math.min(1, Math.max(0, base + noise - 0.1));

      row.push(value);
    }
    data.push(row);
  }

  return data;
}

function getHeatColor(value: number): string {
  if (value < 0.2) return 'bg-heat-low';
  if (value < 0.4) return 'bg-heat-low-medium';
  if (value < 0.6) return 'bg-heat-medium';
  if (value < 0.8) return 'bg-heat-high';
  return 'bg-heat-peak';
}

function getCrowdLevel(value: number): { label: string; color: string } {
  if (value < 0.2) return { label: '人很少', color: 'text-emerald-700' };
  if (value < 0.4) return { label: '较少', color: 'text-emerald-600' };
  if (value < 0.6) return { label: '适中', color: 'text-amber-600' };
  if (value < 0.8) return { label: '较多', color: 'text-orange-600' };
  return { label: '高峰期', color: 'text-red-600' };
}

function findBestTimes(data: number[][]): { day: string; time: string }[] {
  const results: { day: string; time: string; value: number }[] = [];

  for (let d = 0; d < 7; d++) {
    for (let h = 0; h < HOURS.length; h++) {
      results.push({ day: DAYS[d], time: `${HOURS[h]}:00`, value: data[d][h] });
    }
  }

  results.sort((a, b) => a.value - b.value);
  return results.slice(0, 3).map(({ day, time }) => ({ day, time }));
}

export default function VenueHeatmap({ venues }: VenueHeatmapProps) {
  const bookableVenues = venues.filter((v) => v.bookable);
  const [selectedVenueId, setSelectedVenueId] = useState(bookableVenues[0]?.id || '');

  const heatData = generateHeatData(selectedVenueId);
  const bestTimes = findBestTimes(heatData);
  const selectedVenue = venues.find((v) => v.id === selectedVenueId);

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
            <ThermometerSun size={18} className="text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-text-primary">场馆人流热力图</h2>
            <p className="text-xs text-text-tertiary">查看各时段人流分布，错峰训练更舒适</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {bookableVenues.map((v) => (
          <button
            key={v.id}
            onClick={() => setSelectedVenueId(v.id)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              selectedVenueId === v.id
                ? 'bg-primary text-white'
                : 'bg-bg-warm text-text-secondary hover:bg-primary-50 hover:text-primary'
            }`}
          >
            {v.name.replace('邯郸', '').replace('健身房', '')}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[600px]">
          <div className="flex mb-1">
            <div className="w-12 shrink-0" />
            {HOURS.map((h) => (
              <div key={h} className="flex-1 text-center text-[10px] text-text-tertiary">
                {h}
              </div>
            ))}
          </div>

          {DAYS.map((day, dIdx) => (
            <div key={day} className="flex items-center gap-1 mb-1">
              <div className="w-12 shrink-0 text-xs text-text-secondary text-right pr-2">
                {day}
              </div>
              {HOURS.map((h, hIdx) => {
                const value = heatData[dIdx][hIdx];
                const level = getCrowdLevel(value);
                return (
                  <div
                    key={h}
                    className={`flex-1 aspect-square rounded-sm ${getHeatColor(value)} transition-all hover:scale-110 hover:z-10 cursor-pointer relative group`}
                  >
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-gray-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20">
                      {day} {h}:00
                      <span className={`block text-center ${level.color.replace('text-', 'text-')}`}>
                        {level.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-border-light">
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-heat-low" />
            <span className="text-text-tertiary">人少</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-heat-medium" />
            <span className="text-text-tertiary">适中</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-heat-high" />
            <span className="text-text-tertiary">较多</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-heat-peak" />
            <span className="text-text-tertiary">高峰</span>
          </div>
        </div>
      </div>

      {selectedVenue && (
        <div className="mt-4 p-4 rounded-lg bg-success/10 border border-success/20">
          <div className="flex items-start gap-3">
            <TrendingDown size={18} className="text-success shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-text-primary mb-2">
                {selectedVenue.name} · 最佳训练时间
              </h3>
              <div className="flex flex-wrap gap-2">
                {bestTimes.map((t, i) => (
                  <div
                    key={i}
                    className="px-3 py-1.5 rounded-md bg-surface text-xs text-text-primary font-medium shadow-sm border border-border-light"
                  >
                    {t.day} {t.time}
                  </div>
                ))}
              </div>
              <p className="text-xs text-text-secondary mt-2 flex items-center gap-1">
                <Info size={12} />
                建议选择以上时段训练，器械更充裕，体验更佳
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
