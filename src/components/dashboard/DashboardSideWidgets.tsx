import React from 'react';
import { MessageSquareQuote, Sparkles, Play, ArrowUpRight } from 'lucide-react';
import { StudentProfile, AICoachAdvice } from '../../types';

export const renderCoachNotes = (
  profile: StudentProfile,
  onNavigateTab: (tab: any) => void
) => (
  <div className="bg-indigo-600/20 backdrop-blur-xl border border-indigo-500/30 rounded-3xl p-6 shadow-xl relative overflow-hidden">
    <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />
    
    <div className="flex items-center space-x-2 text-indigo-300 mb-3">
      <MessageSquareQuote className="w-5 h-5 text-indigo-400" />
      <h3 className="text-sm font-bold text-white">Sınıf Rehber Öğretmeninin Değerlendirmesi</h3>
    </div>
    
    <p className="text-xs text-indigo-100 leading-relaxed italic bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
      "{profile.coachNotes || 'Koçunuz henüz özel bir değerlendirme notu eklemedi.'}"
    </p>

    <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
      <span className="text-slate-300">Koç: <strong className="text-white">{profile.coachName || 'Atanmadı'}</strong></span>
      <button
        type="button"
        onClick={() => onNavigateTab('ai_coach')}
        className="text-purple-300 hover:text-white font-semibold flex items-center space-x-1 cursor-pointer"
      >
        <Sparkles className="w-3.5 h-3.5 text-purple-300" />
        <span>Yapay Zeka Analizi</span>
      </button>
    </div>
  </div>
);

export const renderQuickActions = (
  onNavigateTab: (tab: any) => void
) => (
  <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-5 space-y-2.5 shadow-xl">
    <div className="text-xs font-semibold text-slate-400 px-1 mb-2">Hızlı İşlemler</div>

    <button
      type="button"
      onClick={() => onNavigateTab('pomodoro')}
      className="w-full flex items-center justify-between px-4 py-3 bg-indigo-600/20 hover:bg-indigo-600/30 backdrop-blur-md border border-indigo-500/30 rounded-2xl text-xs font-semibold text-indigo-200 transition-all shadow-md cursor-pointer"
    >
      <span className="flex items-center space-x-2">
        <Play className="w-4 h-4 text-indigo-400" />
        <span>Pomodoro Odaklanma Modu</span>
      </span>
      <ArrowUpRight className="w-3.5 h-3.5" />
    </button>

    <button
      type="button"
      onClick={() => onNavigateTab('questions')}
      className="w-full flex items-center justify-between px-4 py-3 bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl text-xs font-semibold text-slate-200 transition-all cursor-pointer"
    >
      <span>Günlük Soru Kaydı Ekle</span>
      <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
    </button>

    <button
      type="button"
      onClick={() => onNavigateTab('mocks')}
      className="w-full flex items-center justify-between px-4 py-3 bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl text-xs font-semibold text-slate-200 transition-all cursor-pointer"
    >
      <span>Yeni Genel Deneme Gir</span>
      <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
    </button>
  </div>
);

export const renderAICoachSummaryWidget = (
  coachAdvices: AICoachAdvice[],
  onNavigateTab: (tab: any) => void
) => {
  const latestAdvice = coachAdvices.length > 0 ? coachAdvices[coachAdvices.length - 1] : null;

  return (
    <div className="bg-gradient-to-br from-indigo-950/80 via-purple-950/60 to-slate-900 border border-purple-500/30 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden flex flex-col justify-between">
      <div className="absolute -right-10 -bottom-10 w-36 h-36 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-600/20 border border-purple-500/30 text-purple-300 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-purple-300" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white">Yapay Zeka Koç Analizi Özeti</h3>
              <p className="text-[11px] text-purple-300/80">
                {latestAdvice?.timestamp ? `Son Analiz: ${latestAdvice.timestamp}` : 'Gemini AI Koç Değerlendirmesi'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab('ai_coach')}
            className="text-xs bg-purple-600/30 hover:bg-purple-600/40 text-purple-200 border border-purple-500/40 px-3 py-1.5 rounded-xl font-semibold flex items-center space-x-1 transition-all cursor-pointer"
          >
            <span>Koça Git</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {latestAdvice ? (
          <div className="space-y-3">
            <p className="text-xs text-slate-200 leading-relaxed bg-white/5 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 italic">
              "{latestAdvice.generalEvaluation}"
            </p>

            {latestAdvice.actionPlan && latestAdvice.actionPlan.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-bold text-purple-300 uppercase tracking-wider block">
                  Öne Çıkan Aksiyon Maddeleri:
                </span>
                <ul className="space-y-1 text-xs text-slate-300">
                  {latestAdvice.actionPlan.slice(0, 3).map((item, idx) => (
                    <li key={idx} className="flex items-start space-x-2">
                      <span className="text-purple-400 font-bold">•</span>
                      <span className="line-clamp-1">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center space-y-2">
            <p className="text-xs text-slate-300 italic">
              Henüz Yapay Zeka Koç analizi oluşturulmadı. Performans verilerine göre kişiselleştirilmiş analiz almak için Yapay Zeka Koçu sekmesini ziyaret et.
            </p>
            <button
              type="button"
              onClick={() => onNavigateTab('ai_coach')}
              className="text-xs bg-purple-600 hover:bg-purple-500 text-white font-bold px-3.5 py-1.5 rounded-xl transition-all inline-flex items-center space-x-1 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Yapay Zeka Analizi Başlat</span>
            </button>
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
        <span>Kişisel Öğrenme Asistanı</span>
        <button
          type="button"
          onClick={() => onNavigateTab('ai_coach')}
          className="text-purple-300 hover:text-white font-medium transition-colors cursor-pointer"
        >
          Detaylı Raporu Oku &rarr;
        </button>
      </div>
    </div>
  );
};
