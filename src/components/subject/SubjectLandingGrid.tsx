import React from 'react';
import { 
  Sparkles, 
  BookOpen, 
  Calendar, 
  Search, 
  ChevronRight 
} from 'lucide-react';
import { FieldType } from '../../types';
import { SubjectCategory } from './SubjectTypes';

interface SubjectLandingGridProps {
  globalCurriculumStats: {
    totalTopics: number;
    totalCompleted: number;
    percent: number;
    totalTytTopics: number;
    totalTytCompleted: number;
    tytPercent: number;
    totalAytTopics: number;
    totalAytCompleted: number;
    aytPercent: number;
    totalQuestions: number;
    totalStudyMins: number;
    totalResources: number;
  };
  landingTimeRange: 'haftalik' | 'aylik' | 'tumu';
  setLandingTimeRange: (range: 'haftalik' | 'aylik' | 'tumu') => void;
  dailyAvgMins: number;
  selectedGroupFilter: string;
  setSelectedGroupFilter: (filter: string) => void;
  targetField: FieldType;
  getFieldTitle: (f: FieldType) => string;
  filteredCategoryStats: any[];
  setSelectedSubjectId: (id: string | null) => void;
  setDetailSubTab: (tab: any) => void;
  formatMinutes: (mins: number) => string;
}

export const SubjectLandingGrid: React.FC<SubjectLandingGridProps> = ({
  globalCurriculumStats,
  landingTimeRange,
  setLandingTimeRange,
  dailyAvgMins,
  selectedGroupFilter,
  setSelectedGroupFilter,
  targetField,
  getFieldTitle,
  filteredCategoryStats,
  setSelectedSubjectId,
  setDetailSubTab,
  formatMinutes,
}) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 p-5 sm:p-6 rounded-3xl shadow-2xl relative overflow-hidden space-y-4">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-indigo-500/20 to-fuchsia-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>Ders İlerleme & İnceleme Paneli</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Ders İlerlemelerim
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl">
              YKS müfredatındaki derslerinizin konu tamamlama oranları, çözülen soru sayıları, çalışma süreleri ve deneme performanslarının bütüncül özeti.
            </p>
          </div>

          {/* Overall Progress Stat Card */}
          <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center space-x-4 shrink-0">
            <div className="text-center">
              <div className="text-[10px] text-slate-400 font-bold uppercase">Genel Müfredat</div>
              <div className="text-2xl font-black text-emerald-400 font-mono mt-0.5">%{globalCurriculumStats.percent}</div>
              <div className="text-[10px] text-slate-400 mt-0.5 font-medium">{globalCurriculumStats.totalCompleted} / {globalCurriculumStats.totalTopics} Konu</div>
            </div>
            <div className="w-14 h-14 relative flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="28" cy="28" r="22" stroke="currentColor" strokeWidth="4" className="text-slate-800" fill="transparent" />
                <circle 
                  cx="28" 
                  cy="28" 
                  r="22" 
                  stroke="currentColor" 
                  strokeWidth="4" 
                  className="text-emerald-400 transition-all duration-1000" 
                  fill="transparent"
                  strokeDasharray={138}
                  strokeDashoffset={138 - (138 * globalCurriculumStats.percent) / 100}
                  strokeLinecap="round"
                />
              </svg>
              <BookOpen className="w-4 h-4 text-emerald-400 absolute" />
            </div>
          </div>
        </div>

        {/* Landing Time Range Selector Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80 relative z-10">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-300">
            <Calendar className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>Özet Bilgi Zaman Aralığı:</span>
          </div>
          <div className="inline-flex items-center p-1 bg-slate-950/90 border border-slate-800 rounded-2xl space-x-1 shadow-inner">
            {[
              { id: 'haftalik', label: 'Haftalık (Son 7 Gün)' },
              { id: 'aylik', label: 'Aylık (Son 30 Gün)' },
              { id: 'tumu', label: 'Tüm Zamanlar' }
            ].map(r => (
              <button
                key={r.id}
                onClick={() => setLandingTimeRange(r.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  landingTimeRange === r.id
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/40 border border-indigo-400'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Global Top KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between">
          <div className="text-[10px] text-slate-400 font-bold uppercase mb-2">Müfredat Tamamlama</div>
          <div className="grid grid-cols-2 gap-3 divide-x divide-slate-800">
            <div>
              <div className="text-[9px] text-blue-400 font-bold uppercase tracking-wider">TYT</div>
              <div className="text-base font-black text-white font-mono mt-0.5">%{globalCurriculumStats.tytPercent}</div>
              <div className="w-full bg-slate-950 h-1.5 rounded-full mt-1.5 overflow-hidden">
                <div 
                  style={{ width: `${globalCurriculumStats.tytPercent}%` }}
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                />
              </div>
              <div className="text-[10px] text-slate-400 font-medium mt-1.5">{globalCurriculumStats.totalTytCompleted}/{globalCurriculumStats.totalTytTopics} Konu</div>
            </div>
            <div className="pl-3">
              <div className="text-[9px] text-pink-400 font-bold uppercase tracking-wider">AYT</div>
              <div className="text-base font-black text-white font-mono mt-0.5">%{globalCurriculumStats.aytPercent}</div>
              <div className="w-full bg-slate-950 h-1.5 rounded-full mt-1.5 overflow-hidden">
                <div 
                  style={{ width: `${globalCurriculumStats.aytPercent}%` }}
                  className="h-full bg-pink-500 rounded-full transition-all duration-500"
                />
              </div>
              <div className="text-[10px] text-slate-400 font-medium mt-1.5">{globalCurriculumStats.totalAytCompleted}/{globalCurriculumStats.totalAytTopics} Konu</div>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
          <div className="text-[10px] text-slate-400 font-bold uppercase">
            {landingTimeRange === 'haftalik' ? 'Soru (Son 7 Gün)' : landingTimeRange === 'aylik' ? 'Soru (Son 30 Gün)' : 'Toplam Soru (Tümü)'}
          </div>
          <div className="text-xl font-black text-indigo-400 font-mono mt-1">{globalCurriculumStats.totalQuestions.toLocaleString('tr-TR')}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Soru Kaydı</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="text-[10px] text-slate-400 font-bold uppercase">
              {landingTimeRange === 'haftalik' ? 'Çalışma (Son 7 Gün)' : landingTimeRange === 'aylik' ? 'Çalışma (Son 30 Gün)' : 'Toplam Çalışma (Tümü)'}
            </div>
            <div className="text-xl font-black text-cyan-400 font-mono mt-1">{formatMinutes(globalCurriculumStats.totalStudyMins)}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Tamamlanan Süre</div>
          </div>
          <div className="text-[10.5px] text-emerald-400 font-bold border-t border-slate-800/60 pt-1.5 mt-1.5">
            Günlük Ort: {formatMinutes(dailyAvgMins)}
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
          <div className="text-[10px] text-slate-400 font-bold uppercase">Kayıtlı Kaynak</div>
          <div className="text-xl font-black text-amber-400 font-mono mt-1">{globalCurriculumStats.totalResources} Kitap</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Takip Listesinde</div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-4 bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
          {/* Filter Pills */}
          <div className="flex items-center space-x-1.5 overflow-x-auto scrollbar-none pb-1 sm:pb-0">
            {[
              { id: 'ALANIM', label: `⭐ Alanım (${getFieldTitle(targetField)})` },
              { id: 'ALL', label: 'Tüm Dersler' },
              { id: 'Sayısal', label: 'Sayısal' },
              { id: 'Eşit Ağırlık', label: 'Eşit Ağırlık' },
              { id: 'Sözel', label: 'Sözel' },
              { id: 'DİL', label: 'Yabancı Dil' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setSelectedGroupFilter(f.id)}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all whitespace-nowrap cursor-pointer ${
                  selectedGroupFilter === f.id
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                    : 'bg-slate-950 text-slate-400 border-slate-850 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Profile Field Banner */}
        {selectedGroupFilter === 'ALANIM' && (
          <div className="bg-indigo-950/40 border border-indigo-500/30 px-4 py-2.5 rounded-2xl flex items-center justify-between text-xs text-indigo-200 shadow-lg">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>
                Profilindeki alan hedefine <strong>({getFieldTitle(targetField)})</strong> özel alan derslerin gösteriliyor.
              </span>
            </div>
            <button
              onClick={() => setSelectedGroupFilter('ALL')}
              className="text-[11px] font-bold text-indigo-300 hover:text-white underline cursor-pointer shrink-0 ml-2 text-nowrap"
            >
              Tüm Dersleri Gör
            </button>
          </div>
        )}
      </div>

      {/* Subject Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredCategoryStats.map(stat => {
          const cat: SubjectCategory = stat.category;
          const Icon = cat.icon;

          return (
            <div
              key={cat.id}
              onClick={() => {
                setSelectedSubjectId(cat.id);
                setDetailSubTab('overview');
              }}
              className={`bg-slate-900/90 hover:bg-slate-900 border ${cat.borderColor} hover:border-indigo-500/50 rounded-3xl p-5 shadow-xl transition-all hover:scale-[1.01] cursor-pointer space-y-4 group relative overflow-hidden`}
            >
              <div className={`absolute top-0 right-0 w-40 h-40 bg-gradient-to-br ${cat.gradient} opacity-5 group-hover:opacity-10 rounded-full blur-2xl transition-opacity pointer-events-none`} />

              {/* Top Bar: Icon + Subject Info */}
              <div className="flex items-start justify-between relative z-10">
                <div className="flex items-center space-x-3">
                  <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${cat.gradient} flex items-center justify-center text-white shadow-md shrink-0 group-hover:scale-105 transition-transform`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-white group-hover:text-indigo-300 transition-colors">
                      {cat.title}
                    </h3>
                    <p className="text-[11px] text-slate-400 line-clamp-1">{cat.subtitle}</p>
                  </div>
                </div>
              </div>

              {/* Progress Bar & Percentage */}
              <div className="space-y-2 relative z-10">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">Genel Müfredat</span>
                  <span className="font-black text-emerald-400 font-mono text-sm">%{stat.topicCompletionPercent}</span>
                </div>
                <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
                  <div 
                    style={{ width: `${stat.topicCompletionPercent}%` }}
                    className={`h-full rounded-full bg-gradient-to-r ${cat.gradient} transition-all duration-700`} 
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                  <span>{stat.completedTopicsCount} / {stat.topics.length} Toplam Konu</span>
                  {stat.masteredCount > 0 && <span className="text-emerald-400 font-semibold">{stat.masteredCount} Uzman</span>}
                </div>

                {/* Separate TYT & AYT Progress Sub-cards */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {stat.tytTopics.length > 0 && (
                    <div className="bg-slate-950/80 border border-blue-500/25 rounded-xl p-2 space-y-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-bold text-blue-400 flex items-center space-x-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block" />
                          <span>TYT</span>
                        </span>
                        <span className="font-mono font-bold text-white">%{stat.tytCompletionPercent}</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                        <div 
                          style={{ width: `${stat.tytCompletionPercent}%` }}
                          className="h-full bg-blue-500 rounded-full transition-all duration-500"
                        />
                      </div>
                      <div className="text-[9px] text-slate-400 text-right font-mono">
                        {stat.tytCompletedTopicsCount}/{stat.tytTopics.length} Konu
                      </div>
                    </div>
                  )}

                  {stat.aytTopics.length > 0 && (
                    <div className="bg-slate-950/80 border border-purple-500/25 rounded-xl p-2 space-y-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-bold text-purple-400 flex items-center space-x-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 inline-block" />
                          <span>AYT</span>
                        </span>
                        <span className="font-mono font-bold text-white">%{stat.aytCompletionPercent}</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                        <div 
                          style={{ width: `${stat.aytCompletionPercent}%` }}
                          className="h-full bg-purple-500 rounded-full transition-all duration-500"
                        />
                      </div>
                      <div className="text-[9px] text-slate-400 text-right font-mono">
                        {stat.aytCompletedTopicsCount}/{stat.aytTopics.length} Konu
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Summary Pill Badges */}
              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-850 relative z-10">
                <div className="bg-slate-950/70 p-2 rounded-xl border border-slate-850">
                  <div className="text-[9.5px] text-slate-400 font-semibold">Çözülen Soru</div>
                  <div className="font-bold text-white font-mono">{stat.totalSolvedQuestions} Soru</div>
                </div>

                <div className="bg-slate-950/70 p-2 rounded-xl border border-slate-850">
                  <div className="text-[9.5px] text-slate-400 font-semibold">Çalışma Süresi</div>
                  <div className="font-bold text-indigo-400 font-mono">
                    {formatMinutes(stat.totalStudyMinutes)}
                    <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                      ({formatMinutes(Math.round(stat.totalStudyMinutes / stat.activeDaysCount))}/gün)
                    </span>
                  </div>
                </div>

                <div className="bg-slate-950/70 p-2 rounded-xl border border-slate-850">
                  <div className="text-[9.5px] text-slate-400 font-semibold">Kaynak Kitap</div>
                  <div className="font-bold text-cyan-400 font-mono">{stat.matchedResources.length} Kitap</div>
                </div>

                <div className="bg-slate-950/70 p-2 rounded-xl border border-slate-850">
                  <div className="text-[9.5px] text-slate-400 font-semibold">Branş Denemesi</div>
                  <div className="font-bold text-amber-400 font-mono">{stat.branchExamCount} Deneme</div>
                </div>
              </div>

              {/* Bottom Action CTA */}
              <div className="flex items-center justify-between text-xs font-bold text-indigo-400 group-hover:text-indigo-300 pt-1 relative z-10">
                <span>Ayrıntılı Ders Özeti</span>
                <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          );
        })}
      </div>

      {filteredCategoryStats.length === 0 && (
        <div className="text-center py-12 bg-slate-900/60 rounded-3xl border border-slate-800 space-y-2">
          <Search className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-white">Aramanıza Uygun Ders Bulunamadı</h3>
          <p className="text-xs text-slate-400">Filtreleri değiştirmeyi veya farklı bir ders aramayı deneyebilirsiniz.</p>
        </div>
      )}
    </div>
  );
};
