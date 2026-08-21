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
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  targetField: FieldType;
  getFieldTitle: (f: FieldType) => string;
  filteredCategoryStats: any[];
  setSelectedSubjectId: (id: string | null) => void;
  setDetailSubTab: (tab: any) => void;
  formatMinutes: (mins: number) => string;
  gradeLevel?: string;
  isEarly?: boolean;
}

export const SubjectLandingGrid: React.FC<SubjectLandingGridProps> = ({
  globalCurriculumStats,
  landingTimeRange,
  setLandingTimeRange,
  dailyAvgMins,
  selectedGroupFilter,
  setSelectedGroupFilter,
  searchQuery,
  setSearchQuery,
  targetField,
  getFieldTitle,
  filteredCategoryStats,
  setSelectedSubjectId,
  setDetailSubTab,
  formatMinutes,
  gradeLevel = '12',
  isEarly = false,
}) => {
  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* ── HERO HEADER BANNER ── */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 p-6 sm:p-7 rounded-3xl border border-slate-800 shadow-2xl backdrop-blur-md relative overflow-hidden space-y-5">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-indigo-500/20 via-purple-500/10 to-fuchsia-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full text-xs font-bold text-indigo-300">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>
                {isEarly 
                  ? `${gradeLevel}. Sınıf MEB Maarif Modeli Ders & Konu Takibi` 
                  : gradeLevel === '11' 
                  ? '11. Sınıf MEB Müfredatı Ders & Konu Takibi' 
                  : 'YKS Ders İlerleme & İnceleme Paneli'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {isEarly || gradeLevel === '11' ? `${gradeLevel}. Sınıf Ders İlerlemelerim` : 'Ders İlerlemelerim'}
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm max-w-2xl leading-relaxed">
              {isEarly || gradeLevel === '11'
                ? `${gradeLevel}. sınıf müfredatındaki tüm derslerinizin konu tamamlama oranları, çözülen soru sayıları ve çalışma süreleri özeti.`
                : 'YKS müfredatındaki tüm derslerinizin konu tamamlama oranları, çözülen soru sayıları, çalışma süreleri ve deneme performanslarının bütüncül özeti.'}
            </p>
          </div>

          {/* Overall Progress Gauge Widget */}
          <div className="bg-slate-950/80 border border-slate-800/80 p-4.5 rounded-2xl flex items-center space-x-4 shrink-0 shadow-xl backdrop-blur-md">
            <div className="text-center">
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                {isEarly ? `${gradeLevel}. Sınıf Müfredatı` : 'Genel Müfredat'}
              </div>
              <div className="text-3xl font-black text-emerald-400 font-mono mt-0.5">%{globalCurriculumStats.percent}</div>
              <div className="text-[10px] text-slate-400 mt-0.5 font-medium">{globalCurriculumStats.totalCompleted} / {globalCurriculumStats.totalTopics} Konu</div>
            </div>
            <div className="w-16 h-16 relative flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="32" cy="32" r="26" stroke="currentColor" strokeWidth="5" className="text-slate-800" fill="transparent" />
                <circle 
                  cx="32" 
                  cy="32" 
                  r="26" 
                  stroke="currentColor" 
                  strokeWidth="5" 
                  className="text-emerald-400 transition-all duration-1000" 
                  fill="transparent"
                  strokeDasharray={163}
                  strokeDashoffset={163 - (163 * globalCurriculumStats.percent) / 100}
                  strokeLinecap="round"
                />
              </svg>
              <BookOpen className="w-5 h-5 text-emerald-400 absolute" />
            </div>
          </div>
        </div>

        {/* Landing Time Range Selector Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800/80 relative z-10">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-300">
            <Calendar className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>Özet İstatistik Zaman Aralığı:</span>
          </div>
          <div className="inline-flex items-center p-1 bg-slate-950 border border-slate-800 rounded-2xl space-x-1 shadow-inner">
            {[
              { id: 'haftalik', label: 'Haftalık (Son 7 Gün)' },
              { id: 'aylik', label: 'Aylık (Son 30 Gün)' },
              { id: 'tumu', label: 'Tüm Zamanlar' }
            ].map(r => (
              <button
                key={r.id}
                onClick={() => setLandingTimeRange(r.id as any)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  landingTimeRange === r.id
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/40 border border-indigo-400/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── 4 GLOBAL TOP KPI CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: TYT & AYT Split Progress or Maarif Single Progress */}
        <div className="bg-slate-900/90 border border-slate-800 p-4.5 rounded-3xl shadow-xl backdrop-blur-md flex flex-col justify-between hover:border-slate-700 transition-all">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Müfredat Tamamlama</div>
          {isEarly ? (
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">{gradeLevel}. Sınıf Maarif</span>
                <span className="text-xl font-black text-white font-mono">%{globalCurriculumStats.percent}</span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full mt-2 overflow-hidden border border-slate-800">
                <div 
                  style={{ width: `${globalCurriculumStats.percent}%` }}
                  className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500 rounded-full transition-all duration-500"
                />
              </div>
              <div className="text-[10px] text-slate-400 font-medium mt-2 flex items-center justify-between">
                <span>Tamamlanan Konu:</span>
                <span className="font-mono text-indigo-300 font-bold">{globalCurriculumStats.totalCompleted} / {globalCurriculumStats.totalTopics}</span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 divide-x divide-slate-800">
              <div>
                <div className="text-[10px] text-sky-400 font-bold uppercase tracking-wider">TYT</div>
                <div className="text-xl font-black text-white font-mono mt-0.5">%{globalCurriculumStats.tytPercent}</div>
                <div className="w-full bg-slate-950 h-1.5 rounded-full mt-1.5 overflow-hidden">
                  <div 
                    style={{ width: `${globalCurriculumStats.tytPercent}%` }}
                    className="h-full bg-sky-500 rounded-full transition-all duration-500"
                  />
                </div>
                <div className="text-[10px] text-slate-400 font-medium mt-1.5">{globalCurriculumStats.totalTytCompleted}/{globalCurriculumStats.totalTytTopics} Konu</div>
              </div>
              <div className="pl-3">
                <div className="text-[10px] text-purple-400 font-bold uppercase tracking-wider">AYT</div>
                <div className="text-xl font-black text-white font-mono mt-0.5">%{globalCurriculumStats.aytPercent}</div>
                <div className="w-full bg-slate-950 h-1.5 rounded-full mt-1.5 overflow-hidden">
                  <div 
                    style={{ width: `${globalCurriculumStats.aytPercent}%` }}
                    className="h-full bg-purple-500 rounded-full transition-all duration-500"
                  />
                </div>
                <div className="text-[10px] text-slate-400 font-medium mt-1.5">{globalCurriculumStats.totalAytCompleted}/{globalCurriculumStats.totalAytTopics} Konu</div>
              </div>
            </div>
          )}
        </div>

        {/* Card 2: Soru Çözüm Sayısı */}
        <div className="bg-slate-900/90 border border-slate-800 p-4.5 rounded-3xl shadow-xl backdrop-blur-md flex flex-col justify-between hover:border-slate-700 transition-all">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            {landingTimeRange === 'haftalik' ? 'Soru (Son 7 Gün)' : landingTimeRange === 'aylik' ? 'Soru (Son 30 Gün)' : 'Toplam Soru (Tümü)'}
          </div>
          <div className="text-3xl font-black text-indigo-400 font-mono mt-1">{globalCurriculumStats.totalQuestions.toLocaleString('tr-TR')}</div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">Soru Kaydı Girişi Yapıldı</div>
        </div>

        {/* Card 3: Çalışma Süresi & Ortalama */}
        <div className="bg-slate-900/90 border border-slate-800 p-4.5 rounded-3xl shadow-xl backdrop-blur-md flex flex-col justify-between hover:border-slate-700 transition-all">
          <div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              {landingTimeRange === 'haftalik' ? 'Çalışma (Son 7 Gün)' : landingTimeRange === 'aylik' ? 'Çalışma (Son 30 Gün)' : 'Toplam Çalışma (Tümü)'}
            </div>
            <div className="text-3xl font-black text-cyan-400 font-mono mt-1">{formatMinutes(globalCurriculumStats.totalStudyMins)}</div>
          </div>
          <div className="text-[11px] text-emerald-400 font-bold border-t border-slate-800/80 pt-2 mt-2 font-mono">
            Günlük Ort: {formatMinutes(dailyAvgMins)}
          </div>
        </div>

        {/* Card 4: Kayıtlı Kaynak Kitaplar */}
        <div className="bg-slate-900/90 border border-slate-800 p-4.5 rounded-3xl shadow-xl backdrop-blur-md flex flex-col justify-between hover:border-slate-700 transition-all">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Kayıtlı Kaynak Kitaplar</div>
          <div className="text-3xl font-black text-amber-400 font-mono mt-1">{globalCurriculumStats.totalResources} Kitap</div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">Ders İlerleme Takibinde</div>
        </div>
      </div>

      {/* ── SEARCH & FILTER HUB ── */}
      <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Live Subject Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
            <input
              type="text"
              placeholder="Ders ara... (Ör: Matematik, Fizik, Türk Dili ve Edebiyatı, Kimya)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-11 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-white text-xs font-bold px-2 py-0.5 rounded-md bg-slate-900"
              >
                Temizle
              </button>
            )}
          </div>

          {/* Filter Pills (Hidden for 9th and 10th grades) */}
          {!isEarly && (
            <div className="flex items-center space-x-1.5 overflow-x-auto custom-scrollbar pb-1 md:pb-0">
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
                  className={`text-xs font-bold px-3.5 py-2 rounded-xl border transition-all whitespace-nowrap cursor-pointer ${
                    selectedGroupFilter === f.id
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-850 hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Profile Field Banner (Hidden for 9th and 10th grades) */}
        {!isEarly && selectedGroupFilter === 'ALANIM' && (
          <div className="bg-indigo-950/40 border border-indigo-500/30 px-4 py-3 rounded-2xl flex items-center justify-between text-xs text-indigo-200 shadow-lg">
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

      {/* ── COURSE CARDS GRID ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
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
              className={`bg-slate-900/90 hover:bg-slate-900 border ${cat.borderColor} hover:border-indigo-500/50 rounded-3xl p-5 sm:p-6 shadow-xl transition-all hover:scale-[1.01] cursor-pointer space-y-4 group relative overflow-hidden`}
            >
              <div className={`absolute top-0 right-0 w-48 h-48 bg-gradient-to-br ${cat.gradient} opacity-5 group-hover:opacity-10 rounded-full blur-2xl transition-opacity pointer-events-none`} />

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
