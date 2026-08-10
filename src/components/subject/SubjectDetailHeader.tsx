import React from 'react';
import { 
  ArrowLeft, 
  Filter, 
  Sparkles, 
  LayoutDashboard, 
  BookMarked, 
  BookOpen, 
  BarChart2, 
  Clock, 
  Target, 
  Youtube 
} from 'lucide-react';
import { DetailSubTab } from './SubjectTypes';

interface SubjectDetailHeaderProps {
  activeDetailData: any;
  activeRawCategoryData: any;
  setSelectedSubjectId: (id: string | null) => void;
  detailExamFilter: 'TÜMÜ' | 'TYT' | 'AYT';
  setDetailExamFilter: (filter: 'TÜMÜ' | 'TYT' | 'AYT') => void;
  detailSubTab: DetailSubTab;
  setDetailSubTab: (tab: DetailSubTab) => void;
  formatMinutes: (mins: number) => string;
}

export const SubjectDetailHeader: React.FC<SubjectDetailHeaderProps> = ({
  activeDetailData,
  activeRawCategoryData,
  setSelectedSubjectId,
  detailExamFilter,
  setDetailExamFilter,
  detailSubTab,
  setDetailSubTab,
  formatMinutes,
}) => {
  const category = activeDetailData.category;

  return (
    <div className="space-y-6">
      {/* Header Bar with Back Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/95 backdrop-blur-xl border border-slate-800 p-4 sm:p-6 rounded-3xl shadow-2xl relative overflow-hidden">
        <div className={`absolute top-0 right-0 w-96 h-96 bg-gradient-to-br ${category.gradient} opacity-10 rounded-full blur-3xl pointer-events-none`} />

        <div className="space-y-3 relative z-10">
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setSelectedSubjectId(null)}
              className="inline-flex items-center space-x-2 text-xs font-bold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 px-3.5 py-1.5 rounded-xl transition-all cursor-pointer shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Tüm Derslere Dön</span>
            </button>

            {/* Scope Filter Buttons: TÜMÜ | TYT | AYT */}
            <div className="inline-flex items-center p-1 bg-slate-950/90 border border-slate-800 rounded-xl space-x-1 shadow-inner">
              <span className="text-[10px] font-bold text-slate-400 px-2 flex items-center space-x-1">
                <Filter className="w-3 h-3 text-indigo-400" />
                <span className="hidden sm:inline">Kapsam:</span>
              </span>
              {(['TÜMÜ', 'TYT', 'AYT'] as const).map(scope => {
                const isDisabled = activeRawCategoryData ? (
                  (scope === 'TYT' && activeRawCategoryData.tytTopics.length === 0) ||
                  (scope === 'AYT' && activeRawCategoryData.aytTopics.length === 0)
                ) : false;

                return (
                  <button
                    key={scope}
                    disabled={isDisabled}
                    onClick={() => setDetailExamFilter(scope)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      detailExamFilter === scope
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/40 border border-indigo-400'
                        : isDisabled
                        ? 'opacity-40 cursor-not-allowed text-slate-600'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {scope}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center space-x-3.5">
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${category.gradient} flex items-center justify-center text-white shadow-lg shrink-0`}>
              <category.icon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {category.title}
                </h1>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${category.badgeBg}`}>
                  {category.examType}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                {category.subtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Overall Subject Progress Pill */}
        <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center space-x-4 shrink-0 relative z-10">
          <div className="text-center">
            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Müfredat Tamamlama</div>
            <div className="text-2xl font-black text-emerald-400 font-mono mt-0.5">
              %{activeDetailData.topicCompletionPercent}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5 font-medium">
              {activeDetailData.completedTopicsCount} / {activeDetailData.topics.length} Konu Bitti
            </div>
          </div>
          <div className="w-14 h-14 relative flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="28" cy="28" r="23" stroke="currentColor" strokeWidth="4.5" className="text-slate-800" fill="transparent" />
              <circle 
                cx="28" 
                cy="28" 
                r="23" 
                stroke="currentColor" 
                strokeWidth="4.5" 
                className="text-emerald-400 transition-all duration-1000" 
                fill="transparent"
                strokeDasharray={144}
                strokeDashoffset={144 - (144 * activeDetailData.topicCompletionPercent) / 100}
                strokeLinecap="round"
              />
            </svg>
            <Sparkles className="w-4 h-4 text-emerald-400 absolute" />
          </div>
        </div>
      </div>

      {/* MULTI-TAB NAVIGATION SCROLL BAR */}
      <div className="flex items-center gap-2 overflow-x-auto p-2 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl scrollbar-none snap-x">
        <button
          onClick={() => setDetailSubTab('overview')}
          className={`flex items-center justify-center space-x-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border shrink-0 whitespace-nowrap snap-start ${
            detailSubTab === 'overview'
              ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/30'
              : 'bg-slate-950/60 text-slate-400 border-slate-850 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <LayoutDashboard className="w-4 h-4 shrink-0" />
          <span className="whitespace-nowrap">Genel Özet</span>
        </button>

        <button
          onClick={() => setDetailSubTab('topics')}
          className={`flex items-center justify-center space-x-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border shrink-0 whitespace-nowrap snap-start ${
            detailSubTab === 'topics'
              ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/30'
              : 'bg-slate-950/60 text-slate-400 border-slate-850 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <BookMarked className="w-4 h-4 shrink-0" />
          <span className="whitespace-nowrap">Konular ({activeDetailData.completedTopicsCount}/{activeDetailData.topics.length})</span>
        </button>

        <button
          onClick={() => setDetailSubTab('resources')}
          className={`flex items-center justify-center space-x-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border shrink-0 whitespace-nowrap snap-start ${
            detailSubTab === 'resources'
              ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/30'
              : 'bg-slate-950/60 text-slate-400 border-slate-850 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <BookOpen className="w-4 h-4 shrink-0" />
          <span className="whitespace-nowrap">Kaynaklar ({activeDetailData.matchedResources.length})</span>
        </button>

        <button
          onClick={() => setDetailSubTab('questions')}
          className={`flex items-center justify-center space-x-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border shrink-0 whitespace-nowrap snap-start ${
            detailSubTab === 'questions'
              ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/30'
              : 'bg-slate-950/60 text-slate-400 border-slate-850 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <BarChart2 className="w-4 h-4 shrink-0" />
          <span className="whitespace-nowrap">Soru Takibi ({activeDetailData.totalSolvedQuestions})</span>
        </button>

        <button
          onClick={() => setDetailSubTab('study')}
          className={`flex items-center justify-center space-x-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border shrink-0 whitespace-nowrap snap-start ${
            detailSubTab === 'study'
              ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/30'
              : 'bg-slate-950/60 text-slate-400 border-slate-850 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <Clock className="w-4 h-4 shrink-0" />
          <span className="whitespace-nowrap">Süre ({formatMinutes(activeDetailData.totalStudyMinutes)})</span>
        </button>

        <button
          onClick={() => setDetailSubTab('mocks')}
          className={`flex items-center justify-center space-x-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border shrink-0 whitespace-nowrap snap-start ${
            detailSubTab === 'mocks'
              ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/30'
              : 'bg-slate-950/60 text-slate-400 border-slate-850 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <Target className="w-4 h-4 shrink-0" />
          <span className="whitespace-nowrap">Denemeler ({activeDetailData.branchExamCount + activeDetailData.generalExamCount})</span>
        </button>

        <button
          onClick={() => setDetailSubTab('youtube')}
          className={`flex items-center justify-center space-x-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border shrink-0 whitespace-nowrap snap-start ${
            detailSubTab === 'youtube' || detailSubTab === 'errors'
              ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/30'
              : 'bg-slate-950/60 text-slate-400 border-slate-850 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <Youtube className="w-4 h-4 shrink-0 text-rose-400" />
          <span className="whitespace-nowrap">Video & Hatalar ({activeDetailData.totalVideos + activeDetailData.totalErrors})</span>
        </button>
      </div>
    </div>
  );
};
