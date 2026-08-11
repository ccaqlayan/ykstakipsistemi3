import React from 'react';
import { 
  Target, 
  TrendingUp, 
  AlertTriangle, 
  Clock, 
  Filter, 
  BarChart2, 
  Sparkles, 
  PieChart as PieChartIcon, 
  Activity, 
  BookOpen 
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell, 
  ReferenceLine 
} from 'recharts';

interface BranchAnalyticsTabProps {
  totalBranchExamsCount: number;
  analyzedBranchExamsCount: number;
  analyzedBranchExamsPercentage: number;
  avgNetOverall: string | number;
  unrevisedErrorsCount: number;
  revisedErrorsCount: number;
  revisionPercentage: number;
  totalDurationMinutes: number;
  avgDurationMinutes: string | number;
  chartExamType: 'ALL' | 'TYT' | 'AYT';
  setChartExamType: (val: 'ALL' | 'TYT' | 'AYT') => void;
  chartSubject: string;
  setChartSubject: (val: string) => void;
  chartLimit: '10' | '30' | 'ALL';
  setChartLimit: (val: '10' | '30' | 'ALL') => void;
  netChartData: any[];
  branchSubjectStats: any[];
  errorReasonStats: any[];
  topProblematicTopics: any[];
  ERROR_REASON_COLORS: Record<string, string>;
  ERROR_REASON_LABELS: Record<string, string>;
  DEFAULT_CHART_COLORS: string[];
  SUBJECT_COLORS: Record<string, string>;
}

export const BranchAnalyticsTab: React.FC<BranchAnalyticsTabProps> = ({
  totalBranchExamsCount,
  analyzedBranchExamsCount,
  analyzedBranchExamsPercentage,
  avgNetOverall,
  unrevisedErrorsCount,
  revisedErrorsCount,
  revisionPercentage,
  totalDurationMinutes,
  avgDurationMinutes,
  chartExamType,
  setChartExamType,
  chartSubject,
  setChartSubject,
  chartLimit,
  setChartLimit,
  netChartData,
  branchSubjectStats,
  errorReasonStats,
  topProblematicTopics,
  ERROR_REASON_COLORS,
  ERROR_REASON_LABELS,
  DEFAULT_CHART_COLORS,
  SUBJECT_COLORS,
}) => {
  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Top KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Toplam Deneme</span>
            <Target className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-white">{totalBranchExamsCount}</span>
            <span className="text-[10px] text-emerald-400 font-mono font-semibold" title={`${analyzedBranchExamsCount} / ${totalBranchExamsCount} Deneme Analiz Edildi`}>
              %{analyzedBranchExamsPercentage} Analiz Edildi
            </span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Net Ortalaması</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-400">{avgNetOverall}</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Hata Defteri</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-rose-400">{unrevisedErrorsCount}</span>
            <span className="text-[10px] text-slate-400 font-mono">
              {revisedErrorsCount} tekrar (%{revisionPercentage})
            </span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Toplam Süre</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-bold text-amber-300">
              {totalDurationMinutes > 0 ? `${Math.floor(totalDurationMinutes / 60)}s ${totalDurationMinutes % 60}dk` : '0dk'}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              Ort. {avgDurationMinutes} dk/deneme
            </span>
          </div>
        </div>
      </div>

      {/* Chart Section 1: Net Gelişim Trendi */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/60">
          <div className="flex items-center space-x-2">
            <BarChart2 className="w-5 h-5 text-indigo-400 shrink-0" />
            <div>
              <h3 className="text-sm font-bold text-white">Branş Denemeleri Net Gelişim Trendi</h3>
              <p className="text-[11px] text-slate-400">Zaman içindeki başarı ivmenizi grafik üzerinde inceleyin</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => { setChartExamType('ALL'); setChartSubject('ALL'); }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${chartExamType === 'ALL' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Tümü
              </button>
              <button
                onClick={() => { setChartExamType('TYT'); setChartSubject('ALL'); }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${chartExamType === 'TYT' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                TYT
              </button>
              <button
                onClick={() => { setChartExamType('AYT'); setChartSubject('ALL'); }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${chartExamType === 'AYT' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                AYT
              </button>
            </div>

            {chartExamType !== 'ALL' && (
              <select
                value={chartSubject}
                onChange={(e) => setChartSubject(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-300 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="ALL">Tüm Dersler</option>
                {branchSubjectStats
                  .filter(s => s.examType === chartExamType)
                  .map(s => (
                    <option key={s.subject} value={s.subject}>{s.subject}</option>
                  ))
                }
              </select>
            )}

            <select
              value={chartLimit}
              onChange={(e) => setChartLimit(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-300 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="10">Son 10 Deneme</option>
              <option value="30">Son 30 Deneme</option>
              <option value="ALL">Tüm Kayıtlar</option>
            </select>
          </div>
        </div>

        {netChartData.length > 0 ? (
          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={netChartData} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="shortName" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} domain={[0, 'auto']} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#fff', fontSize: '12px' }}
                  formatter={(value: any) => [`${value} Net`, 'Net']}
                  labelFormatter={(label, items) => {
                    if (items && items.length > 0 && items[0].payload) {
                      const p = items[0].payload;
                      const title = p.fullTitle || (p.subject ? `${p.subject} - ${p.publisher || 'Branş Denemesi'}` : label);
                      const date = p.dateStr || p.date || '';
                      return date ? `${title} (${date})` : title;
                    }
                    return label;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="net"
                  stroke="#6366f1"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#0f172a' }}
                  activeDot={{ r: 6, fill: '#818cf8' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="py-12 text-center border border-dashed border-slate-800 rounded-xl">
            <Filter className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-400 font-semibold">Seçili kriterlerde gösterilecek deneme verisi bulunamadı.</p>
          </div>
        )}
      </div>

      {/* Grid: Subject Performance & Error Reasons */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left: Branch Subject Stats Cards & Net Averages */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/60">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">Ders Bazlı Ortalamalar</h3>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">Doğru / Yanlış / Net</span>
          </div>

          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
            {branchSubjectStats.length > 0 ? (
              branchSubjectStats.map((stat) => (
                <div key={stat.subject} className="bg-slate-950 border border-slate-800/80 p-3 rounded-xl flex items-center justify-between">
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <span 
                      className="w-2.5 h-2.5 rounded-full shrink-0" 
                      style={{ backgroundColor: SUBJECT_COLORS[stat.subject] || '#6366f1' }}
                    />
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-white truncate">{stat.subject}</h4>
                      <p className="text-[10px] text-slate-400">{stat.count} Deneme Ortalaması</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 shrink-0 text-right">
                    <div className="text-[11px] font-mono text-slate-300">
                      <span className="text-emerald-400 font-bold">{stat.avgCorrect}D</span> / <span className="text-rose-400 font-bold">{stat.avgWrong}Y</span>
                    </div>
                    <div className="bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-lg">
                      <span className="text-xs font-black text-indigo-300 font-mono">{stat.avgNet} Net</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 text-center py-6">Henüz ders ortalaması verisi yok.</p>
            )}
          </div>
        </div>

        {/* Right: Error Reasons Distribution Pie Chart */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/60">
            <div className="flex items-center space-x-2">
              <PieChartIcon className="w-4 h-4 text-rose-400" />
              <h3 className="text-sm font-bold text-white">Hata Nedenleri Dağılımı</h3>
            </div>
            <span className="text-[10px] text-slate-400">Tüm Hata Defteri</span>
          </div>

          {errorReasonStats.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 items-center gap-4">
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={errorReasonStats}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="count"
                    >
                      {errorReasonStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#fff', fontSize: '11px' }}
                      formatter={(val: any) => [`${val} Soru`, 'Hata Sayısı']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-2">
                {errorReasonStats.map((item) => (
                  <div key={item.reason} className="flex items-center justify-between text-xs p-1.5 rounded-lg bg-slate-950/60 border border-slate-800/50">
                    <div className="flex items-center space-x-2 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-slate-300 font-semibold truncate">{item.label}</span>
                    </div>
                    <span className="font-mono font-bold text-white shrink-0 ml-2">
                      {item.count} <span className="text-[10px] text-slate-400 font-normal">(%{item.percentage})</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-12 text-center">
              <p className="text-xs text-slate-500">Hata nedenleri analizi için henüz kayıt girilmedi.</p>
            </div>
          )}
        </div>

      </div>

      {/* Top Problematic Topics Ranking */}
      {topProblematicTopics.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/60">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-rose-500" />
              <h3 className="text-sm font-bold text-white">En Çok Yanlış Yapılan Konular (Top 5)</h3>
            </div>
            <span className="text-[10px] text-rose-400 font-mono font-bold">Öncelikli Tekrar Liste</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-2.5">
            {topProblematicTopics.map((item, idx) => (
              <div key={idx} className="bg-slate-950 border border-slate-800 p-3 rounded-xl flex items-center justify-between md:flex-col md:items-start md:justify-between space-y-1">
                <div>
                  <span className="text-[10px] font-bold uppercase text-indigo-400 tracking-wider block">{item.subject}</span>
                  <h4 className="text-xs font-bold text-slate-200 line-clamp-2 title-tooltip" title={item.topic}>
                    {item.topic}
                  </h4>
                </div>
                <div className="shrink-0 bg-rose-500/10 border border-rose-500/20 text-rose-400 font-black text-xs px-2.5 py-1 rounded-lg font-mono">
                  {item.count} Yanlış
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
