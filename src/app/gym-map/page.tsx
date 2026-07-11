'use client';

import { useState } from 'react';
import { MapPin, Phone, Clock, ArrowRight, X, Building2 } from 'lucide-react';
import { mockVenues } from '@/lib/mock-data';

const campusData = [
  {
    id: 'handan',
    name: '邯郸校区',
    mapUrl: 'https://aka.doubaocdn.com/s/r80U1wju77',
    venues: mockVenues.filter(v => ['handan-south', 'handan-north', 'wuliu'].includes(v.campus)),
    gymLocations: [
      { name: '南区健身房', x: 52, y: 58, venueId: 'v1' },
      { name: '北区健身房', x: 48, y: 28, venueId: 'v2' },
      { name: '工会健身房', x: 42, y: 42, venueId: 'v3' },
    ],
  },
  {
    id: 'fenglin',
    name: '枫林校区',
    mapUrl: 'https://aka.doubaocdn.com/s/EwC11wju77',
    venues: mockVenues.filter(v => v.campus === 'fenglin'),
    gymLocations: [
      { name: '综合体育馆健身房', x: 58, y: 48, venueId: 'v5' },
    ],
  },
  {
    id: 'jiangwan',
    name: '江湾校区',
    mapUrl: 'https://aka.doubaocdn.com/s/75p31wju77',
    venues: mockVenues.filter(v => v.campus === 'jiangwan'),
    gymLocations: [
      { name: '体育馆健身房', x: 48, y: 68, venueId: 'v4' },
    ],
  },
  {
    id: 'zhangjiang',
    name: '张江校区',
    mapUrl: 'https://aka.doubaocdn.com/s/6J8U1wju77',
    venues: mockVenues.filter(v => v.campus === 'zhangjiang'),
    gymLocations: [
      { name: '学生活动中心健身房', x: 50, y: 35, venueId: 'v6' },
    ],
  },
];

export default function GymMapPage() {
  const [activeCampus, setActiveCampus] = useState('handan');
  const [selectedVenue, setSelectedVenue] = useState<string | null>(null);

  const currentCampus = campusData.find(c => c.id === activeCampus)!;
  const selectedVenueData = selectedVenue ? mockVenues.find(v => v.id === selectedVenue) : null;

  return (
    <div className="min-h-screen bg-bg">
      <main className="max-w-content mx-auto px-6 py-8">
        <div className="mb-6">
          <div className="flex flex-wrap gap-3">
            {campusData.map(campus => (
              <button
                key={campus.id}
                onClick={() => {
                  setActiveCampus(campus.id);
                  setSelectedVenue(null);
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  activeCampus === campus.id
                    ? 'bg-primary text-white shadow-lg shadow-primary/30'
                    : 'bg-surface text-text-secondary border border-border-light hover:bg-bg-warm'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  {campus.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="card overflow-hidden">
              <div className="relative aspect-[4/3] bg-bg-warm">
                <img
                  src={currentCampus.mapUrl}
                  alt={`${currentCampus.name}地图`}
                  className="w-full h-full object-contain"
                  loading="lazy"
                />
                <div className="absolute inset-0 pointer-events-none">
                  {currentCampus.gymLocations.map((loc, index) => {
                    const venue = mockVenues.find(v => v.id === loc.venueId);
                    return (
                      <button
                        key={loc.name}
                        onClick={() => {
                          if (venue) setSelectedVenue(venue.id);
                        }}
                        className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-auto z-10 group"
                        style={{ left: `${loc.x}%`, top: `${loc.y}%` }}
                      >
                        <div className={`w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/40 transition-all duration-300 hover:scale-125 ${
                          selectedVenue === loc.venueId ? 'ring-4 ring-surface scale-125' : ''
                        }`}>
                          <span className="text-white font-bold text-xs">{index + 1}</span>
                        </div>
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap bg-surface text-text-primary text-xs px-2 py-1 rounded-md shadow-md z-20">
                          {loc.name}
                        </div>
                      </button>
                    );
                  })}
                </div>
                <div className="absolute bottom-4 right-4 bg-surface/90 backdrop-blur-sm rounded-lg px-4 py-2 shadow-md">
                  <p className="text-xs text-text-secondary font-medium">点击标记查看详情</p>
                </div>
              </div>
              <div className="p-4 bg-bg-warm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400"></div>
                      <span className="text-sm text-text-secondary">健身房位置</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-text-secondary">
                    <MapPin className="w-4 h-4" />
                    <span>{currentCampus.name}</span>
                    <span className="text-text-tertiary">|</span>
                    <span>{currentCampus.venues.length}个健身房</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {selectedVenueData ? (
              <div className="card overflow-hidden animate-fade-in">
                <div className="h-2 bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-500"></div>
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-text-primary mb-1">{selectedVenueData.name}</h3>
                      <p className="text-sm text-primary font-medium">{currentCampus.name}</p>
                    </div>
                    <button
                      onClick={() => setSelectedVenue(null)}
                      className="w-8 h-8 rounded-full bg-bg-warm flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-text-secondary">详细位置</p>
                        <p className="text-text-primary">{selectedVenueData.address}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0">
                        <Phone className="w-4 h-4 text-status-success" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-text-secondary">联系电话</p>
                        <p className="text-text-primary">{selectedVenueData.contactPhone || '暂无'}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center flex-shrink-0">
                        <Clock className="w-4 h-4 text-status-warning" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-text-secondary">开放时间</p>
                        <p className="text-text-primary">{selectedVenueData.openTime} - {selectedVenueData.closeTime}</p>
                      </div>
                    </div>

                    {selectedVenueData.features && selectedVenueData.features.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-text-secondary mb-2">场馆特色</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedVenueData.features.map((feature, idx) => (
                            <span key={idx} className="px-3 py-1 rounded-full bg-bg-warm text-sm text-text-secondary">
                              {feature}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 pt-4 border-t border-border-light">
                    <p className="text-sm text-text-secondary mb-3">{selectedVenueData.description}</p>
                    <button className="w-full py-2.5 bg-primary hover:bg-primary text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2">
                      <span>查看场馆详情</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="card p-6">
                <h3 className="text-lg font-bold text-text-primary mb-4">校区健身房列表</h3>
                <div className="space-y-3">
                  {currentCampus.venues.map((venue, index) => (
                    <button
                      key={venue.id}
                      onClick={() => setSelectedVenue(venue.id)}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 flex items-center gap-4 ${
                        selectedVenue === venue.id
                          ? 'border-primary bg-primary-50'
                          : 'border-border-light hover:border-border hover:bg-bg-warm'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                        selectedVenue === venue.id ? 'bg-primary' : 'bg-gradient-to-br from-blue-500 to-cyan-400'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-text-primary">{venue.name}</p>
                        <p className="text-sm text-text-secondary">{venue.address}</p>
                      </div>
                      <ArrowRight className={`w-5 h-5 transition-transform ${selectedVenue === venue.id ? 'text-primary translate-x-1' : 'text-text-tertiary'}`} />
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl p-6 text-white">
              <h3 className="font-bold text-lg mb-2">💪 健身小贴士</h3>
              <p className="text-sm opacity-90">选择离你最近的健身房，坚持规律训练。合理安排训练时间，避开高峰时段。</p>
            </div>
          </div>
        </div>

        <div className="mt-8 card p-6">
          <h3 className="text-lg font-bold text-text-primary mb-4">全校区健身房一览</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-light">
                  <th className="text-left py-3 px-4 font-medium text-text-secondary">校区</th>
                  <th className="text-left py-3 px-4 font-medium text-text-secondary">健身房名称</th>
                  <th className="text-left py-3 px-4 font-medium text-text-secondary">位置</th>
                  <th className="text-left py-3 px-4 font-medium text-text-secondary">开放时间</th>
                  <th className="text-left py-3 px-4 font-medium text-text-secondary">联系电话</th>
                </tr>
              </thead>
              <tbody>
                {mockVenues.map(venue => (
                  <tr key={venue.id} className="border-b border-border-light hover:bg-bg-warm">
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 rounded-full bg-primary-50 text-primary text-sm font-medium">
                        {venue.campus.includes('handan') ? '邯郸' : venue.campus === 'fenglin' ? '枫林' : venue.campus === 'jiangwan' ? '江湾' : '张江'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-text-primary">{venue.name}</td>
                    <td className="py-3 px-4 text-text-secondary text-sm">{venue.address}</td>
                    <td className="py-3 px-4 text-text-secondary text-sm">{venue.openTime} - {venue.closeTime}</td>
                    <td className="py-3 px-4 text-text-secondary text-sm">{venue.contactPhone || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <footer className="bg-surface border-t border-border-light mt-12">
        <div className="max-w-content mx-auto px-6 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <span>信息来源：《复旦体育打卡地图》</span>
              <span className="text-text-tertiary">|</span>
              <span>复旦研究生公众号</span>
            </div>
            <a
              href="https://www.toutiao.com/article/7067406348891292192/?&source=m_redirect&wid=1783495816705"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              <span>原文链接</span>
              <ArrowRight className="w-3 h-3" />
            </a>
          </div>
          <p className="text-center text-xs text-text-tertiary mt-4">
            图片来源：复旦研究生公众号《复旦体育打卡地图》，仅供校园健身服务参考使用
          </p>
        </div>
      </footer>
    </div>
  );
}
