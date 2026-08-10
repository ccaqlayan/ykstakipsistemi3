import React from 'react';
import { BarChart2, PieChart as PieChartIcon, ArrowUpRight } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { GeneralMockExam, TopicErrorItem } from '../../types';
import { ERROR_REASON_LABELS } from './DashboardTypes';

export const renderMockChartWidget = (
  generalMocks: GeneralMockExam[],
  onNavigateTab: (tab: any) => void
) => {
  const last7Mocks = generalMocks.slice(-7);
  const chartData = last7Mocks.map((m, idx) => ({
    name: m.title.length > 12 ? `D-${generalMocks.length - last7Mocks.length + idx + 1}` : m.title,
    TYT: m.tyt.totalNet,
    AYT: m.ayt.totalNet
  }));

  return (
    <div className="bg-slate-900/90 backdrop-blur-xl border border-indigo-500/20 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0">
            <BarChart2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white">Deneme Net İlerleme Grafiği</h3>
            <p className="text-[11px] text-slate-400">Son 7 genel deneme sınavında zamana göre TYT ve AYT net değişimi</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onNavigateTab('mocks')}
          className="text-xs bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 px-3 py-1.5 rounded-xl font-semibold flex items-center space-x-1 transition-all cursor-pointer"
        >
          <span>Tüm Denemeler</span>
          <ArrowUpRight className="w-3 h-3" />
        </button>
      </div>

      {chartData.length > 0 ? (
        <div className="h-56 sm:h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorTYT" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorAYT" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#fff', fontSize: '12px' }}
              />
              <Area type="monotone" dataKey="TYT" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorTYT)" />
              <Area type="monotone" dataKey="AYT" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorAYT)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-40 flex items-center justify-center text-xs text-slate-400 italic bg-slate-950/40 rounded-2xl border border-slate-800">
          Grafik oluşturmak için henüz kaydedilmiş deneme sınavı bulunmuyor.
        </div>
      )}
    </div>
  );
};

export const renderErrorReasonsWidget = (
  topicErrors: TopicErrorItem[],
  onNavigateTab: (tab: any) => void
) => {
  const counts: Record<string, number> = {};
  topicErrors.forEach(err => {
    const reason = err.errorReason || 'bilgi_eksigi';
    counts[reason] = (counts[reason] || 0) + 1;
  });

  const pieData = Object.keys(ERROR_REASON_LABELS).map(key => ({
    key,
    name: ERROR_REASON_LABELS[key].label,
    value: counts[key] || 0,
    color: ERROR_REASON_LABELS[key].color
  })).filter(d => d.value > 0);

  const totalErrorsCount = topicErrors.length;

  return (
    <div className="bg-slate-900/90 backdrop-blur-xl border border-rose-500/20 rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 shadow-xl space-y-4">
      <div className="flex flex-row items-center justify-between gap-2">
        <div className="flex items-center space-x-2 sm:space-x-2.5 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-rose-600/20 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0">
            <PieChartIcon className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs sm:text-base font-bold text-white truncate">Yanlış Nedenleri Analizi</h3>
            <p className="text-[11px] text-slate-400 hidden md:block truncate">Hatalı çözülen soruların kök neden dağılımı</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onNavigateTab('errors')}
          className="text-[11px] sm:text-xs bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-xl font-semibold flex items-center space-x-1 transition-all cursor-pointer shrink-0 whitespace-nowrap"
        >
          <span>Hata Defteri</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {totalErrorsCount > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center pt-2">
          <div className="h-44 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={65}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#fff', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 text-xs">
            {pieData.map((d) => {
              const pct = Math.round((d.value / totalErrorsCount) * 100);
              return (
                <div key={d.key} className="flex items-center justify-between p-2 rounded-xl bg-slate-950/50 border border-slate-800">
                  <div className="flex items-center space-x-2">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                    <span className="text-slate-300 font-medium">{d.name}</span>
                  </div>
                  <span className="font-bold text-white font-mono">{d.value} ({pct}%)</span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="h-40 flex items-center justify-center text-xs text-slate-400 italic bg-slate-950/40 rounded-2xl border border-slate-800">
          Hata nedeni analizi için henüz yanlış soru kaydı bulunmuyor.
        </div>
      )}

      {topicErrors.length > 0 && (
        <div className="mt-4 pt-3.5 border-t border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-300">Son 3 Yanlış Soru & Hata Sebebi:</span>
            <button
              type="button"
              onClick={() => onNavigateTab('errors')}
              className="text-[11px] text-rose-400 hover:text-rose-300 font-semibold transition-colors cursor-pointer"
            >
              Tüm Hatalar ({topicErrors.length}) &rarr;
            </button>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {[...topicErrors]
              .map((err, index) => ({ err, index }))
              .sort((a, b) => {
                const timeA = new Date(a.err.date || 0).getTime();
                const timeB = new Date(b.err.date || 0).getTime();
                if (!isNaN(timeA) && !isNaN(timeB) && timeA !== timeB) {
                  return timeB - timeA;
                }
                return b.index - a.index;
              })
              .slice(0, 3)
              .map(({ err }) => {
                const reasonLabel = ERROR_REASON_LABELS[err.errorReason]?.label || err.errorReason || 'Bilgi Eksikliği';
                const noteText = err.solutionNotes || (err as any).notes;

                return (
                  <div key={err.id} className="p-2.5 sm:p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center space-x-2 flex-wrap sm:flex-nowrap">
                        <span className="font-bold text-white text-xs shrink-0">{err.subject}</span>
                        <span className="text-[10px] text-slate-500 hidden xs:inline">•</span>
                        <span className="text-slate-300 text-xs truncate max-w-full">{err.topicName || (err as any).topic}</span>
                      </div>
                      {noteText && (
                        <p className="text-[11px] text-slate-400 truncate italic">
                          "{noteText}"
                        </p>
                      )}
                    </div>
                    <div className="flex items-center justify-between sm:justify-end space-x-2 shrink-0 pt-1.5 sm:pt-0 border-t border-slate-900 sm:border-t-0">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-300 border border-rose-500/30 truncate max-w-[200px]">
                        {reasonLabel}
                      </span>
                      {err.revised ? (
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md shrink-0">Tekrar Edildi</span>
                      ) : (
                        <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md shrink-0">Bekliyor</span>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
};
