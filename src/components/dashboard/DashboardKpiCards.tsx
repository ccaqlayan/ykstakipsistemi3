import React from 'react';
import { CheckCircle2, ArrowUpRight, TrendingUp, AlertTriangle, BookCheck } from 'lucide-react';
import { GeneralMockExam, TopicErrorItem } from '../../types';

interface DashboardKpiCardsProps {
  totalQuestionsSolved: number;
  totalQuestionsTarget: number;
  questionTargetPercent: number;
  latestMock: GeneralMockExam | null;
  latestTYTNet: number;
  latestAYTNet: number;
  pendingTopicErrors: TopicErrorItem[];
  completedResources: number;
  totalResources: number;
  resourcePercent: number;
  onNavigateTab: (tab: any) => void;
}

export const renderKpiQuestions = (
  totalQuestionsSolved: number,
  totalQuestionsTarget: number,
  questionTargetPercent: number,
  onNavigateTab: (tab: any) => void
) => (
  <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-xl hover:border-white/20 transition-all flex flex-col justify-between">
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-slate-400">Soru Hedef Başarısı (Son 7 Gün)</span>
        <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 flex items-center justify-center">
          <CheckCircle2 className="w-4 h-4" />
        </div>
      </div>
      <div className="text-2xl font-bold text-white font-mono">
        {totalQuestionsSolved} <span className="text-xs font-normal text-slate-400">/ {totalQuestionsTarget} Soru</span>
      </div>
      <div className="w-full bg-white/10 h-2 rounded-full mt-3 overflow-hidden">
        <div 
          className="bg-indigo-500 h-full rounded-full transition-all duration-500 shadow-sm" 
          style={{ width: `${Math.min(questionTargetPercent, 100)}%` }}
        />
      </div>
      <div className="flex justify-between items-center text-[11px] text-slate-400 mt-1.5">
        <span>Tamamlama</span>
        <span className="font-semibold text-indigo-300">%{questionTargetPercent}</span>
      </div>
    </div>
    <button
      type="button"
      onClick={() => onNavigateTab('questions')}
      className="text-[11px] text-indigo-300 hover:text-indigo-200 font-medium flex items-center mt-3 transition-colors cursor-pointer"
    >
      <span>Soru Takibine Git</span>
      <ArrowUpRight className="w-3 h-3 ml-0.5" />
    </button>
  </div>
);

export const renderKpiMocks = (
  latestMock: GeneralMockExam | null,
  latestTYTNet: number,
  latestAYTNet: number,
  onNavigateTab: (tab: any) => void,
  isDil: boolean = false
) => (
  <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-xl hover:border-white/20 transition-all flex flex-col justify-between">
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-slate-400">Son Deneme Performansı</span>
        <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 flex items-center justify-center">
          <TrendingUp className="w-4 h-4" />
        </div>
      </div>
      <div className="flex items-baseline space-x-2">
        <span className="text-xl font-bold text-white font-mono">TYT: {latestTYTNet}</span>
        <span className="text-sm font-semibold text-emerald-400 font-mono">{isDil ? 'YDT' : 'AYT'}: {latestAYTNet}</span>
      </div>
      <p className="text-xs text-slate-400 mt-2 truncate">
        {latestMock ? latestMock.title : 'Henüz deneme girilmedi'}
      </p>
    </div>
    <button
      type="button"
      onClick={() => onNavigateTab('mocks')}
      className="text-[11px] text-indigo-300 hover:text-white font-medium flex items-center mt-3 transition-colors cursor-pointer"
    >
      <span>Deneme Grafiğini Gör</span>
      <ArrowUpRight className="w-3 h-3 ml-0.5" />
    </button>
  </div>
);

export const renderKpiErrors = (
  pendingTopicErrors: TopicErrorItem[],
  onNavigateTab: (tab: any) => void
) => (
  <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-xl hover:border-white/20 transition-all flex flex-col justify-between">
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-slate-400">Yanlış Defteri (Eksik Konular)</span>
        <div className="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 flex items-center justify-center">
          <AlertTriangle className="w-4 h-4" />
        </div>
      </div>
      <div className="text-2xl font-bold text-white font-mono">
        {pendingTopicErrors.length} <span className="text-xs font-normal text-slate-400">Bekleyen Hata</span>
      </div>
      <p className="text-xs text-slate-400 mt-2">
        {pendingTopicErrors.length > 0 ? 'Tekrar edilmeyi bekleyen yanlışlar var.' : 'Tüm yanlışlar tekrar edildi! 🎉'}
      </p>
    </div>
    <button
      type="button"
      onClick={() => onNavigateTab('errors')}
      className="text-[11px] text-rose-300 hover:text-rose-200 font-medium flex items-center mt-3 transition-colors cursor-pointer"
    >
      <span>Hata Defterine Git</span>
      <ArrowUpRight className="w-3 h-3 ml-0.5" />
    </button>
  </div>
);

export const renderKpiResources = (
  completedResources: number,
  totalResources: number,
  resourcePercent: number,
  onNavigateTab: (tab: any) => void
) => (
  <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-xl hover:border-white/20 transition-all flex flex-col justify-between">
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-slate-400">Kaynak Takibi (Soru Bankaları)</span>
        <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 flex items-center justify-center">
          <BookCheck className="w-4 h-4" />
        </div>
      </div>
      <div className="text-2xl font-bold text-white font-mono">
        {completedResources} <span className="text-xs font-normal text-slate-400">/ {totalResources} Kitap</span>
      </div>
      <div className="flex items-center justify-between text-xs text-slate-400 mt-2">
        <span>Konu İlerlemesi:</span>
        <span className="font-bold text-amber-300">%{resourcePercent}</span>
      </div>
      <div className="w-full bg-white/10 h-2 rounded-full mt-1.5 overflow-hidden">
        <div 
          className="bg-amber-400 h-full rounded-full transition-all duration-500 shadow-sm" 
          style={{ width: `${resourcePercent}%` }}
        />
      </div>
    </div>
    <button
      type="button"
      onClick={() => onNavigateTab('resources')}
      className="text-[11px] text-amber-300 hover:text-amber-200 font-medium flex items-center mt-3 transition-colors cursor-pointer"
    >
      <span>Kaynak Takibine Git</span>
      <ArrowUpRight className="w-3 h-3 ml-0.5" />
    </button>
  </div>
);
