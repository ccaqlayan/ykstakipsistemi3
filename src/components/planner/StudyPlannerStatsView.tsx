import React from 'react';
import { 
  PieChart, 
  TrendingUp, 
  BarChart3, 
  CalendarDays, 
  Award, 
  Clock, 
  Sparkles, 
  History, 
  Calendar, 
  CheckCircle, 
  Check 
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend 
} from 'recharts';
import { StudyPlanItem, DayOfWeek } from '../../types';

interface StudyPlannerStatsViewProps {
  viewMode: 'board' | 'daily' | 'stats';
  activeSubTab: 'tracker' | 'history';
  DAYS: DayOfWeek[];
  activePlans: StudyPlanItem[];
  orderedWeeks: string[];
  activeHistoryWeek: string;
  setSelectedHistoryWeek: (week: string) => void;
  historyWeeksPage: number;
  setHistoryWeeksPage: React.Dispatch<React.SetStateAction<number>>;
  subjectChartScope: 'total' | 'selected';
  setSubjectChartScope: (scope: 'total' | 'selected') => void;
  subjectChartMetric: 'duration' | 'question';
  setSubjectChartMetric: (metric: 'duration' | 'question') => void;
  getWeeklyStats: () => any[];
  getSubjectDistributionStats: () => any[];
  getPlansForWeek: (weekLabel: string) => StudyPlanItem[];
}

export const StudyPlannerStatsView: React.FC<StudyPlannerStatsViewProps> = ({
  viewMode,
  activeSubTab,
  DAYS,
  activePlans,
  orderedWeeks,
  activeHistoryWeek,
  setSelectedHistoryWeek,
  historyWeeksPage,
  setHistoryWeeksPage,
  subjectChartScope,
  setSubjectChartScope,
  subjectChartMetric,
  setSubjectChartMetric,
  getWeeklyStats,
  getSubjectDistributionStats,
  getPlansForWeek,
}) => {
  return (
    <>
      {/* VIEW 3: WEEKLY STATS OVERVIEW */}
      {viewMode === 'stats' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4 backdrop-blur-md">
          <h2 className="text-base font-black text-white flex items-center space-x-2">
            <PieChart className="w-5 h-5 text-indigo-400" />
            <span>Haftalık Çalışma Performansı & Ders Dağılımı</span>
          </h2>

          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full text-left text-xs text-slate-200">
              <thead className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Gün</th>
                  <th className="py-3.5 px-4 min-w-[280px]">Planlanan Dersler & Konular</th>
                  <th className="py-3.5 px-4 text-center">Hedef Süre</th>
                  <th className="py-3.5 px-4 text-center">Gerçekleşen Süre</th>
                  <th className="py-3.5 px-4 text-center">İlerleme</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {DAYS.map((day) => {
                  const dayPlans = activePlans.filter((p) => p.day === day);
                  const dayPlannedMins = dayPlans.reduce((sum, p) => sum + (p.plannedMinutes || 0), 0);
                  const dayCompletedMins = dayPlans.reduce((sum, p) => sum + (p.completedMinutes || 0), 0);
                  const dayPercent = dayPlannedMins > 0 ? Math.round((dayCompletedMins / dayPlannedMins) * 100) : 0;

                  return (
                    <tr key={day} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-4 px-4 font-bold text-white">
                        {day}
                      </td>
                      <td className="py-4 px-4">
                        {dayPlans.length === 0 ? (
                          <span className="text-slate-600 italic">Ders planlanmadı</span>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {dayPlans.map((plan) => (
                              <span
                                key={plan.id}
                                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                                  plan.status === 'completed'
                                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                                    : 'bg-slate-950 border-slate-800 text-slate-200'
                                }`}
                              >
                                {plan.subject}: {plan.topic} ({plan.plannedMinutes}m)
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4 text-center font-mono font-bold">
                        {dayPlannedMins} dk
                      </td>
                      <td className="py-4 px-4 text-center font-mono font-bold text-emerald-400">
                        {dayCompletedMins} dk
                      </td>
                      <td className="py-4 px-4 text-center font-mono font-bold text-indigo-300">
                        %{dayPercent}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 4: PLAN ARCHIVE & PAST STATISTICS VIEW */}
      {activeSubTab === 'history' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* HISTORY ANALYTICS INSIGHTS */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center space-x-3.5">
              <div className="w-10 h-10 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400 shrink-0">
                <CalendarDays className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase">Kayıtlı Geçmiş Hafta</div>
                <div className="text-lg font-black text-white font-mono">{orderedWeeks.length} Hafta</div>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center space-x-3.5">
              <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400 shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase">Ortalama Uyum Oranı</div>
                <div className="text-lg font-black text-emerald-400 font-mono">
                  {orderedWeeks.length > 0 
                    ? Math.round(getWeeklyStats().reduce((sum, w) => sum + (w['Görev Uyumu (%)'] || 0), 0) / orderedWeeks.length)
                    : 0}%
                </div>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center space-x-3.5">
              <div className="w-10 h-10 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-center justify-center text-purple-400 shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase">Toplam Çalışma Süresi</div>
                <div className="text-lg font-black text-white font-mono">
                  {getWeeklyStats().reduce((sum, w) => sum + (w['Çalışma Süresi (Saat)'] || 0), 0).toFixed(1)} Saat
                </div>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center space-x-3.5">
              <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center text-amber-400 shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase">En Çok Çalışılan Ders</div>
                <div className="text-sm font-black text-amber-300 truncate max-w-[150px]">
                  {(() => {
                    const subStats = getSubjectDistributionStats();
                    if (subStats.length === 0) return 'Veri Yok';
                    const maxSub = subStats.reduce((max, s) => s['Tamamlanan (Saat)'] > max['Tamamlanan (Saat)'] ? s : max, subStats[0]);
                    return maxSub ? `${maxSub.name} (${maxSub['Tamamlanan (Saat)']} sa)` : 'Veri Yok';
                  })()}
                </div>
              </div>
            </div>
          </div>

          {/* CHARTS SECTIONS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* AREA CHART - WEEKLY COMPLIANCE & STUDY HOURS */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-black text-white flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-indigo-400" />
                  <span>Haftalık Çalışma Performans Grafiği</span>
                </h3>
              </div>
              <div className="h-64 w-full">
                {orderedWeeks.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-xs text-slate-500 italic">
                    Grafik oluşturmak için henüz geçmiş arşiv bulunmuyor.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={[...getWeeklyStats()].reverse()} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorCompliance" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="name" stroke="#64748b" style={{ fontSize: '10px', fontWeight: 'bold' }} />
                      <YAxis stroke="#64748b" style={{ fontSize: '10px' }} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px', color: '#fff' }} />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                      <Area type="monotone" name="Görev Uyumu (%)" dataKey="Görev Uyumu (%)" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorCompliance)" />
                      <Area type="monotone" name="Çalışma Süresi (Saat)" dataKey="Çalışma Süresi (Saat)" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorHours)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* BAR CHART - SUBJECT DISTRIBUTION */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 gap-3">
                <h3 className="text-sm font-black text-white flex items-center space-x-2">
                  <BarChart3 className="w-4 h-4 text-purple-400" />
                  <span>Ders Bazlı Çalışma Dağılımı</span>
                </h3>
                
                <div className="flex flex-wrap items-center gap-2">
                  {/* Scope Toggle */}
                  <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-850 shrink-0 select-none">
                    <button
                      type="button"
                      onClick={() => setSubjectChartScope('total')}
                      className={`px-2.5 py-1 text-[10px] font-black rounded-lg transition-all cursor-pointer ${
                        subjectChartScope === 'total'
                          ? 'bg-purple-600/90 text-white shadow-sm shadow-purple-600/20'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Toplam Saat
                    </button>
                    <button
                      type="button"
                      onClick={() => setSubjectChartScope('selected')}
                      className={`px-2.5 py-1 text-[10px] font-black rounded-lg transition-all cursor-pointer ${
                        subjectChartScope === 'selected'
                          ? 'bg-purple-600/90 text-white shadow-sm shadow-purple-600/20'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Seçili Hafta
                    </button>
                  </div>

                  {/* Metric Toggle */}
                  <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-850 shrink-0 select-none">
                    <button
                      type="button"
                      onClick={() => setSubjectChartMetric('duration')}
                      className={`px-2.5 py-1 text-[10px] font-black rounded-lg transition-all cursor-pointer ${
                        subjectChartMetric === 'duration'
                          ? 'bg-indigo-600/90 text-white shadow-sm shadow-indigo-600/20'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Süre (Saat)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSubjectChartMetric('question')}
                      className={`px-2.5 py-1 text-[10px] font-black rounded-lg transition-all cursor-pointer ${
                        subjectChartMetric === 'question'
                          ? 'bg-indigo-600/90 text-white shadow-sm shadow-indigo-600/20'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Soru (Adet)
                    </button>
                  </div>
                </div>
              </div>
              <div className="h-64 w-full">
                {orderedWeeks.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-xs text-slate-500 italic">
                    Ders bazlı istatistik oluşturmak için henüz geçmiş arşiv bulunmuyor.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={getSubjectDistributionStats()} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="name" stroke="#64748b" style={{ fontSize: '10px', fontWeight: 'bold' }} />
                      <YAxis stroke="#64748b" style={{ fontSize: '10px' }} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px', color: '#fff' }} />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                      {subjectChartMetric === 'duration' ? (
                        <Bar name="Tamamlanan (Saat)" dataKey="Tamamlanan (Saat)" fill="#a855f7" radius={[4, 4, 0, 0]} />
                      ) : (
                        <Bar name="Tamamlanan (Soru)" dataKey="Tamamlanan (Soru)" fill="#ec4899" radius={[4, 4, 0, 0]} />
                      )}
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {/* DETAILED LOGS GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Weeks Selector Cards */}
            <div className="lg:col-span-4 space-y-3">
              <div className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2 pl-1 flex items-center space-x-1.5">
                <History className="w-3.5 h-3.5" />
                <span>Geçmiş Haftalar</span>
              </div>
              {orderedWeeks.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-slate-800 rounded-2xl text-slate-500 text-xs bg-slate-900/10">
                  Arşivlenmiş hafta bulunmamaktadır. Sağ üstteki "Haftayı Arşive Kaldır" butonu ile mevcut haftanızı buraya ekleyebilirsiniz.
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5 max-h-[460px] overflow-y-auto pr-1">
                    {(() => {
                      const ITEMS_PER_PAGE = 5;
                      const startIndex = (historyWeeksPage - 1) * ITEMS_PER_PAGE;
                      const paginatedWeeks = orderedWeeks.slice(startIndex, startIndex + ITEMS_PER_PAGE);

                      return paginatedWeeks.map((weekLabel) => {
                        const weekPlans = getPlansForWeek(weekLabel);
                        const total = weekPlans.length;
                        const completed = weekPlans.filter(p => p.status === 'completed').length;
                        const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
                        const isSelected = activeHistoryWeek === weekLabel;

                        return (
                          <button
                            key={weekLabel}
                            onClick={() => setSelectedHistoryWeek(weekLabel)}
                            className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 cursor-pointer ${
                              isSelected
                                ? 'bg-gradient-to-br from-indigo-950/75 to-slate-900 border-indigo-500/80 shadow-md ring-1 ring-indigo-500/30'
                                : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-black text-white">{weekLabel}</span>
                              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-bold px-2 py-0.5 rounded-full border border-indigo-500/30">
                                {percent}% Başarı
                              </span>
                            </div>
                            
                            <div className="text-[10px] text-slate-400 font-semibold mt-1">
                              {completed} / {total} Ders Görevi Tamamlandı
                            </div>

                            <div className="w-full h-1.5 bg-slate-950 rounded-full mt-3 overflow-hidden border border-white/5">
                              <div
                                className={`h-full transition-all duration-500 rounded-full ${
                                  percent >= 85 
                                    ? 'bg-emerald-500' 
                                    : percent >= 60 
                                    ? 'bg-indigo-500' 
                                    : 'bg-amber-500'
                                }`}
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </button>
                        );
                      });
                    })()}
                  </div>

                  {/* Pagination Controls */}
                  {(() => {
                    const ITEMS_PER_PAGE = 5;
                    const totalHistoryPages = Math.ceil(orderedWeeks.length / ITEMS_PER_PAGE);
                    if (totalHistoryPages <= 1) return null;

                    return (
                      <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-800 text-[11px] font-bold">
                        <button
                          type="button"
                          onClick={() => setHistoryWeeksPage(p => Math.max(1, p - 1))}
                          disabled={historyWeeksPage === 1}
                          className="px-3 py-2 rounded-xl border border-slate-850 bg-slate-900/40 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 cursor-pointer transition-colors"
                        >
                          &larr; Önceki
                        </button>
                        <span className="text-slate-400 font-mono font-bold">
                          {historyWeeksPage} / {totalHistoryPages}
                        </span>
                        <button
                          type="button"
                          onClick={() => setHistoryWeeksPage(p => Math.min(totalHistoryPages, p + 1))}
                          disabled={historyWeeksPage === totalHistoryPages}
                          className="px-3 py-2 rounded-xl border border-slate-850 bg-slate-900/40 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 cursor-pointer transition-colors"
                        >
                          Sonraki &rarr;
                        </button>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Right Column: Detailed Day List */}
            <div className="lg:col-span-8 space-y-4">
              {orderedWeeks.length === 0 ? (
                <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-10 text-center text-slate-500 text-xs">
                  Ayrıntılı raporu görüntülemek için lütfen sol taraftan bir hafta seçin veya yeni bir hafta arşivleyin.
                </div>
              ) : (
                <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur-md space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
                    <div>
                      <h3 className="text-lg font-black text-white flex items-center space-x-2.5">
                        <Calendar className="w-5 h-5 text-purple-400" />
                        <span>{activeHistoryWeek} Detaylı Raporu</span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">
                        Bu hafta uyguladığınız ders programı ve detaylı ders performansı.
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-xs font-bold text-slate-300 bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      <span>
                        Uyum Oranı: {(() => {
                          const plans = getPlansForWeek(activeHistoryWeek);
                          const tot = plans.length;
                          const cmp = plans.filter(p => p.status === 'completed').length;
                          return tot > 0 ? Math.round((cmp / tot) * 100) : 0;
                        })()}%
                      </span>
                    </div>
                  </div>

                  {/* AI COACH FEEDBACK BASED ON COMPLIANCE */}
                  {(() => {
                    const plans = getPlansForWeek(activeHistoryWeek);
                    const tot = plans.length;
                    const cmp = plans.filter(p => p.status === 'completed').length;
                    const percent = tot > 0 ? Math.round((cmp / tot) * 100) : 0;

                    let title = 'Yeterli Veri Yok';
                    let feedback = 'Haftalık uyumunuzu görmek için lütfen arşivleri oluşturun.';
                    let colorClass = 'bg-slate-950 border-slate-800 text-slate-300';
                    let icon = 'ℹ️';

                    if (tot > 0) {
                      if (percent >= 85) {
                        title = 'Kusursuz Performans!';
                        feedback = 'Harika bir hafta geçirdin! Programına neredeyse kusursuz uydun. Bu tempo ve disiplin seni doğrudan YKS hedefindeki üniversiteye ulaştıracak! Kendinle gurur duy ve asla gevşeme. 🌟';
                        colorClass = 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300';
                        icon = '🌟';
                      } else if (percent >= 60) {
                        title = 'Güzel Çaba, Potansiyel Yüksek!';
                        feedback = 'Güzel bir çaba! Bazı hedefler ertelenmiş olsa da genel uyumun gayet iyi. Bir sonraki hafta eksik kaldığın konulara biraz daha ağırlık vererek fark yaratabilirsin. İstikrar en büyük anahtardır! 👍';
                        colorClass = 'bg-indigo-950/40 border-indigo-500/30 text-indigo-300';
                        icon = '👍';
                      } else {
                        title = 'Taktiksel Değişim Zamanı';
                        feedback = 'Bu hafta planına sadık kalmakta biraz zorlanmışsın. Hiç sorun değil! Kendini hırpalamadan, planındaki ders sürelerini biraz düşürerek daha sürdürülebilir bir tempo bulmaya çalış. Ders programını hafifletmek verimini artırabilir. 🎯';
                        colorClass = 'bg-amber-950/40 border-amber-500/30 text-amber-300';
                        icon = '🎯';
                      }
                    }

                    return (
                      <div className={`p-4 rounded-2xl border flex items-start space-x-3.5 ${colorClass}`}>
                        <span className="text-xl shrink-0 mt-0.5">{icon}</span>
                        <div className="space-y-1">
                          <div className="text-xs font-black uppercase tracking-wider">{title}</div>
                          <p className="text-xs font-medium leading-relaxed opacity-90">{feedback}</p>
                        </div>
                      </div>
                    );
                  })()}

                  {/* TASK ITEMS LIST FOR SELECTED WEEK */}
                  <div className="space-y-5 max-h-[500px] overflow-y-auto pr-1">
                    {DAYS.map((day) => {
                      const plans = getPlansForWeek(activeHistoryWeek).filter(p => p.day === day);
                      if (plans.length === 0) return null;

                      return (
                        <div key={day} className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-4 space-y-3.5 shadow-sm transition-all hover:border-slate-800">
                          <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
                            <div className="flex items-center space-x-2">
                              <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full shrink-0" />
                              <span className="text-xs font-black text-indigo-300 tracking-wider uppercase font-mono">{day} Günü</span>
                            </div>
                            <span className="text-[10px] text-slate-400 bg-slate-900 border border-slate-800 px-2.5 py-0.5 rounded-full font-bold">
                              {plans.length} Ders Görevi
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {plans.map((p) => (
                              <div
                                key={p.id}
                                className={`p-3.5 rounded-xl border flex flex-col justify-between space-y-2 transition-all hover:bg-slate-900/30 ${
                                  p.status === 'completed'
                                    ? 'bg-emerald-950/10 border-emerald-500/20 text-slate-300'
                                    : 'bg-slate-900/10 border-slate-800/80'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0 space-y-1">
                                    <div className="flex flex-wrap items-center gap-1.5">
                                      <span className="text-[11px] font-black text-white bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800 truncate max-w-[150px]">
                                        {p.subject}
                                      </span>
                                      {p.taskType && (
                                        <span className="text-[9px] font-black text-amber-400 bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 rounded-full">
                                          {p.taskType}
                                        </span>
                                      )}
                                    </div>
                                    <h4 className="text-xs font-bold text-slate-200 line-clamp-2">{p.topic}</h4>
                                  </div>

                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 ${
                                    p.status === 'completed'
                                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  }`}>
                                    {p.status === 'completed' ? '✓ Bitti' : '⏳ Bekliyor'}
                                  </span>
                                </div>

                                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1.5 border-t border-slate-800/60">
                                  <span>Hedef: {p.plannedMinutes}dk</span>
                                  {p.targetQuestionCount ? (
                                    <span className="text-emerald-400 font-bold">{p.targetQuestionCount} Soru</span>
                                  ) : null}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
