import React from 'react';
import { 
  X, 
  Sparkles, 
  TrendingUp, 
  CheckCircle2, 
  BookOpen, 
  GraduationCap, 
  Target, 
  Flame, 
  ArrowRight,
  Clock,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { YKSDataState, StudentProfile } from '../../types';
import { TabType } from '../Sidebar';

interface DashboardReadinessModalProps {
  state: YKSDataState;
  daysLeft: number;
  timeBreakdown: { months: number; days: number };
  onNavigateTab: (tab: TabType) => void;
  onClose: () => void;
}

export const DashboardReadinessModal: React.FC<DashboardReadinessModalProps> = ({
  state,
  daysLeft,
  timeBreakdown,
  onNavigateTab,
  onClose
}) => {
  const { 
    profile, 
    questionLogs = [], 
    generalMocks = [], 
    resources = [], 
    routines = [],
    studyPlans = [],
    pastExams = []
  } = state;

  // 1. Soru Takibi Skoru (Son 7 gün hedeflenen vs çözülen)
  const totalQuestionsSolved = questionLogs.reduce((acc, q) => acc + q.solvedCount, 0);
  const totalQuestionsTarget = questionLogs.reduce((acc, q) => acc + q.targetCount, 0);
  const questionScore = totalQuestionsTarget > 0 
    ? Math.min(100, Math.round((totalQuestionsSolved / totalQuestionsTarget) * 100))
    : (totalQuestionsSolved > 0 ? 50 : 0);

  // 2. Kaynak Takibi Skoru
  let totalResourceUnits = 0;
  let completedResourceUnits = 0;
  resources.forEach((r) => {
    totalResourceUnits += (r.totalUnits || 0);
    completedResourceUnits += (r.completedUnits || 0);
  });
  const resourceScore = totalResourceUnits > 0
    ? Math.min(100, Math.round((completedResourceUnits / totalResourceUnits) * 100))
    : (resources.length > 0 ? 30 : 0);

  // 3. Rutin Sadakat Skoru
  const activeRoutines = routines.filter((r: any) => !r.isDeleted);
  const totalRoutineBoxes = activeRoutines.length * 7;
  const completedRoutineBoxes = activeRoutines.reduce((acc: number, r: any) => acc + (r.completedDays?.length || 0), 0);
  const routineScore = totalRoutineBoxes > 0 
    ? Math.min(100, Math.round((completedRoutineBoxes / totalRoutineBoxes) * 100)) 
    : 0;

  // 4. Deneme Performansı Skoru (Hedef TYT/AYT ile son net karşılaştırması)
  const latestMock = generalMocks.length > 0 ? generalMocks[generalMocks.length - 1] : null;
  const currentTYT = latestMock?.tyt?.totalNet || 0;
  const targetTYT = profile?.targetTYTNet || 100;
  const mockScore = targetTYT > 0 
    ? Math.min(100, Math.round((currentTYT / targetTYT) * 100))
    : 0;

  // 5. Çıkmış Soru & Çalışma Planı Skoru
  const completedPlansCount = studyPlans.filter(p => p.status === 'completed').length;
  const totalPlansCount = studyPlans.length;
  const planScore = totalPlansCount > 0 
    ? Math.min(100, Math.round((completedPlansCount / totalPlansCount) * 100))
    : 0;

  // Genel Hazırlık Durumu Hesaplaması (Ağırlıklı Ortalama)
  const overallReadinessPercent = Math.round(
    (questionScore * 0.25) + 
    (resourceScore * 0.25) + 
    (mockScore * 0.25) + 
    (routineScore * 0.15) + 
    (planScore * 0.10)
  );

  // En Zayıf Alan Tespiti
  const areas = [
    { name: 'Soru Çözüm Hedefleri', score: questionScore, tab: 'questions' as TabType, advice: 'Haftalık soru hedeflerini tamamlayarak tempoyu artır.' },
    { name: 'Kaynak Kitap Bitirme', score: resourceScore, tab: 'resources' as TabType, advice: 'Soru bankalarındaki test ve üniteleri bitirmeye odaklan.' },
    { name: 'Deneme Netleri', score: mockScore, tab: 'mocks' as TabType, advice: 'Genel ve branş denemeleri çözerek eksiklerini analiz et.' },
    { name: 'Günlük Rutinler', score: routineScore, tab: 'routines' as TabType, advice: 'Paragraf, problem ve geometri rutinlerini her gün aksatmadan tamamla.' },
  ];
  const weakestArea = [...areas].sort((a, b) => a.score - b.score)[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-indigo-500/30 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-indigo-500/20 bg-gradient-to-r from-slate-950 via-indigo-950/80 to-slate-950 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shadow-lg">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>YKS Genel Hazırlık Durumu</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold border border-emerald-500/40">
                  %{overallReadinessPercent}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Sınava <strong className="text-white">{daysLeft} gün</strong> ({timeBreakdown.months} ay {timeBreakdown.days} gün) kaldı
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          
          {/* Main Hero Gauge Card */}
          <div className="bg-gradient-to-br from-indigo-950/80 via-slate-900 to-slate-950 border border-indigo-500/30 rounded-2xl p-5 shadow-xl text-center relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
            
            <div className="text-[11px] font-bold uppercase tracking-widest text-indigo-300 mb-1">
              {profile.targetUniversity ? `${profile.targetUniversity} • ${profile.targetDepartment}` : 'YKS Derece Hedefi'}
            </div>
            <div className="text-3xl sm:text-4xl font-black text-white font-mono tracking-tight my-2">
              Genel Hazırlık: <span className="text-emerald-400">%{overallReadinessPercent}</span>
            </div>

            {/* Glowing Big Progress Bar */}
            <div className="w-full bg-slate-950 h-4 rounded-full overflow-hidden border border-indigo-500/30 p-0.5 max-w-md mx-auto my-3">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-emerald-400 to-teal-300 transition-all duration-700 shadow-md shadow-emerald-500/40"
                style={{ width: `${Math.min(100, Math.max(5, overallReadinessPercent))}%` }}
              />
            </div>

            <p className="text-xs text-slate-300 max-w-lg mx-auto">
              {overallReadinessPercent >= 75 
                ? '🔥 Harika gidiyorsun! Çalışma disiplinin ve konu ilerlemen hedefin için çok güçlü.'
                : overallReadinessPercent >= 40 
                ? '⚡ İyi bir ivme yakaladın. Rutinlerini aksatmadan ve deneme analizlerine odaklanarak hazırlığını hızlandırabilirsin.'
                : '🚀 Henüz yolun başındasın. Eksiklerini adım adım tamamlayarak hazırlık oranını hızla artırabilirsin!'}
            </p>
          </div>

          {/* Breakdown Items */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Performans Bileşenleri
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              
              {/* Soru Hedefleri */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                    <span>Soru Hedefleri</span>
                  </span>
                  <span className="font-mono font-bold text-indigo-300">%{questionScore}</span>
                </div>
                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                  <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${questionScore}%` }} />
                </div>
                <div className="text-[10px] text-slate-400">
                  {totalQuestionsSolved} / {totalQuestionsTarget || '—'} Soru Çözüldü
                </div>
              </div>

              {/* Kaynak Kitaplar */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-300 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-amber-400" />
                    <span>Kaynak Kitaplar</span>
                  </span>
                  <span className="font-mono font-bold text-amber-300">%{resourceScore}</span>
                </div>
                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: `${resourceScore}%` }} />
                </div>
                <div className="text-[10px] text-slate-400">
                  {completedResourceUnits} / {totalResourceUnits || '—'} Test / Ünite
                </div>
              </div>

              {/* Deneme Netleri */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-300 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    <span>Deneme Performansı</span>
                  </span>
                  <span className="font-mono font-bold text-emerald-300">%{mockScore}</span>
                </div>
                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${mockScore}%` }} />
                </div>
                <div className="text-[10px] text-slate-400">
                  Son TYT: {currentTYT} Net (Hedef: {targetTYT})
                </div>
              </div>

              {/* Günlük Rutinler */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-300 flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-rose-400" />
                    <span>Rutin Sadakati</span>
                  </span>
                  <span className="font-mono font-bold text-rose-300">%{routineScore}</span>
                </div>
                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                  <div className="bg-rose-500 h-full rounded-full" style={{ width: `${routineScore}%` }} />
                </div>
                <div className="text-[10px] text-slate-400">
                  Haftalık {completedRoutineBoxes} / {totalRoutineBoxes} Rutin İşaretlendi
                </div>
              </div>

            </div>
          </div>

          {/* Weakest Area / Smart Recommendation */}
          {weakestArea && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0 mt-0.5">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-amber-300">
                    Öncelikli Gelişim Alanı: {weakestArea.name} (%{weakestArea.score})
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">{weakestArea.advice}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateTab(weakestArea.tab);
                }}
                className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md flex items-center space-x-1 shrink-0 cursor-pointer"
              >
                <span>Bölüme Git</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-indigo-600/30 cursor-pointer"
          >
            Anladım
          </button>
        </div>

      </div>
    </div>
  );
};
