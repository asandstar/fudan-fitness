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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">复旦健身房地图</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">全校区健身房位置查询</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
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
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
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
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
              <div className="relative aspect-[4/3] bg-gray-100 dark:bg-gray-800">
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
                          selectedVenue === loc.venueId ? 'ring-4 ring-white dark:ring-gray-800 scale-125' : ''
                        }`}>
                          <span className="text-white font-bold text-xs">{index + 1}</span>
                        </div>
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap bg-gray-900 dark:bg-gray-700 text-white text-xs px-2 py-1 rounded-md shadow-lg z-20">
                          {loc.name}
                        </div>
                      </button>
                    );
                  })}
                </div>
                <div className="absolute bottom-4 right-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg">
                  <p className="text-xs text-gray-600 dark:text-gray-300 font-medium">点击标记查看详情</p>
                </div>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400"></div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">健身房位置</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <MapPin className="w-4 h-4" />
                    <span>{currentCampus.name}</span>
                    <span className="text-gray-300">|</span>
                    <span>{currentCampus.venues.length}个健身房</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {selectedVenueData ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden animate-fade-in">
                <div className="h-2 bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-500"></div>
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{selectedVenueData.name}</h3>
                      <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">{currentCampus.name}</p>
                    </div>
                    <button
                      onClick={() => setSelectedVenue(null)}
                      className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">详细位置</p>
                        <p className="text-gray-900 dark:text-white">{selectedVenueData.address}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-green-50 dark:bg-green-500/20 flex items-center justify-center flex-shrink-0">
                        <Phone className="w-4 h-4 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">联系电话</p>
                        <p className="text-gray-900 dark:text-white">{selectedVenueData.contactPhone || '暂无'}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                        <Clock className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">开放时间</p>
                        <p className="text-gray-900 dark:text-white">{selectedVenueData.openTime} - {selectedVenueData.closeTime}</p>
                      </div>
                    </div>

                    {selectedVenueData.features && selectedVenueData.features.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">场馆特色</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedVenueData.features.map((feature, idx) => (
                            <span key={idx} className="px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-sm text-gray-700 dark:text-gray-300">
                              {feature}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{selectedVenueData.description}</p>
                    <button className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2">
                      <span>查看场馆详情</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">校区健身房列表</h3>
                <div className="space-y-3">
                  {currentCampus.venues.map((venue, index) => (
                    <button
                      key={venue.id}
                      onClick={() => setSelectedVenue(venue.id)}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 flex items-center gap-4 ${
                        selectedVenue === venue.id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                        selectedVenue === venue.id ? 'bg-blue-600' : 'bg-gradient-to-br from-blue-500 to-cyan-400'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">{venue.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{venue.address}</p>
                      </div>
                      <ArrowRight className={`w-5 h-5 transition-transform ${selectedVenue === venue.id ? 'text-blue-600 translate-x-1' : 'text-gray-400'}`} />
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-gradient-to-br from-blue-500 to-cyan-400 rounded-2xl p-6 text-white">
              <h3 className="font-bold text-lg mb-2">💪 健身小贴士</h3>
              <p className="text-sm opacity-90">选择离你最近的健身房，坚持规律训练。合理安排训练时间，避开高峰时段。</p>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">全校区健身房一览</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">校区</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">健身房名称</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">位置</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">开放时间</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">联系电话</th>
                </tr>
              </thead>
              <tbody>
                {mockVenues.map(venue => (
                  <tr key={venue.id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 text-sm font-medium">
                        {venue.campus.includes('handan') ? '邯郸' : venue.campus === 'fenglin' ? '枫林' : venue.campus === 'jiangwan' ? '江湾' : '张江'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{venue.name}</td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400 text-sm">{venue.address}</td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400 text-sm">{venue.openTime} - {venue.closeTime}</td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400 text-sm">{venue.contactPhone || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-12">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <span>信息来源：《复旦体育打卡地图》</span>
              <span className="text-gray-300">|</span>
              <span>复旦研究生公众号</span>
            </div>
            <a
              href="https://www.toutiao.com/article/7067406348891292192/?&source=m_redirect&wid=1783495816705"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              <span>原文链接</span>
              <ArrowRight className="w-3 h-3" />
            </a>
          </div>
          <p className="text-center text-xs text-gray-400 mt-4">
            图片来源：复旦研究生公众号《复旦体育打卡地图》，仅供校园健身服务参考使用
          </p>
        </div>
      </footer>
    </div>
  );
}