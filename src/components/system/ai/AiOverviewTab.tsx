import React from 'react';
import { 
  Coins, 
  Zap, 
  Cpu, 
  Sparkles, 
  Bot, 
  CheckCircle2, 
  AlertTriangle,
  Brain,
  Layers,
  ArrowRight
} from 'lucide-react';
import { UsageSummary, ModelSettingsData, UsageStatsResponse } from '../SystemTypes';

interface AiOverviewTabProps {
  summary: UsageSummary;
  stats: UsageStatsResponse | null;
  modelSettings: ModelSettingsData | null;
  onNavigateSubTab: (subTab: 'overview' | 'cost' | 'stats' | 'models' | 'query' | 'audit_logs') => void;
}

export const AiOverviewTab: React.FC<AiOverviewTabProps> = ({
  summary,
  stats,
  modelSettings,
  onNavigateSubTab
}) => {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Master System Status Banner */}
      <div className={`p-6 rounded-3xl border transition-all shadow-2xl backdrop-blur-md ${
        modelSettings?.aiFeaturesEnabled !== false
          ? 'bg-gradient-to-r from-slate-900 via-indigo-950/70 to-slate-900 border-indigo-500/40 shadow-indigo-500/10'
          : 'bg-gradient-to-r from-rose-950/90 via-slate-900 to-rose-950/90 border-rose-500/50 shadow-rose-500/20'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-4">
            <div className={`p-3.5 rounded-2xl shrink-0 border ${
              modelSettings?.aiFeaturesEnabled !== false
                ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
                : 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse'
            }`}>
              <Bot className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                  modelSettings?.aiFeaturesEnabled !== false
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                }`}>
                  {modelSettings?.aiFeaturesEnabled !== false ? '🟢 YAPAY ZEKA SİSTEMİ AKTİF' : '🔴 SİSTEM KAPALI'}
                </span>
                <span className="text-xs text-slate-400 font-mono">Okul Geneli Servis Durumu</span>
              </div>
              <h2 className="text-xl font-bold text-white mt-1">
                {modelSettings?.aiFeaturesEnabled !== false
                  ? 'Yapay Zeka Koçu & Soru Analiz Servisleri Çalışıyor'
                  : 'Yapay Zeka Özellikleri Geçici Olarak Durduruldu'}
              </h2>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                YKS hazırlık sürecinde öğrencilere bireysel rehberlik, deneme analizi, hata defteri soru çözümü ve çalışma programı tavsiyeleri aktif durumdadır.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigateSubTab('models')}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 border border-indigo-400/40 transition-all flex items-center justify-center space-x-2 shrink-0 cursor-pointer self-start sm:self-center"
          >
            <span>Model Ayarlarına Git</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div 
          onClick={() => onNavigateSubTab('cost')}
          className="bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-5 shadow-xl hover:border-emerald-500/60 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tahmini Toplam Maliyet</span>
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30 group-hover:scale-110 transition-transform">
              <Coins className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-emerald-400 tracking-tight font-mono">
              ₺{summary.totalCostTRY.toFixed(3)}
            </div>
            <div className="text-xs font-semibold text-slate-400 mt-1">
              (${(summary.totalCostUSD).toFixed(4)} USD)
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-white/10 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Koçluk Harcaması:</span>
            <span className="font-bold text-indigo-300 font-mono">₺{summary.aiCoachCostTRY.toFixed(3)}</span>
          </div>
        </div>

        <div 
          onClick={() => onNavigateSubTab('stats')}
          className="bg-slate-900/90 border border-indigo-500/30 rounded-2xl p-5 shadow-xl hover:border-indigo-500/60 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Toplam AI Sorguları</span>
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30 group-hover:scale-110 transition-transform">
              <Zap className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-white tracking-tight font-mono">
              {summary.totalCalls} <span className="text-sm font-medium text-slate-400">İstek</span>
            </div>
            <div className="text-xs font-semibold text-slate-400 mt-1">
              {summary.aiCoachCalls} Koç / {summary.questionAnalysisCalls} Soru Analiz
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-white/10 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Soru Analizi Tutar:</span>
            <span className="font-bold text-fuchsia-300 font-mono">₺{summary.questionAnalysisCostTRY.toFixed(3)}</span>
          </div>
        </div>

        <div 
          onClick={() => onNavigateSubTab('stats')}
          className="bg-slate-900/90 border border-purple-500/30 rounded-2xl p-5 shadow-xl hover:border-purple-500/60 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Harcanan Toplam Jeton</span>
            <div className="p-2 bg-purple-500/20 text-purple-400 rounded-xl border border-purple-500/30 group-hover:scale-110 transition-transform">
              <Cpu className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-purple-300 tracking-tight font-mono">
              {summary.totalTokens.toLocaleString('tr-TR')} <span className="text-sm font-medium text-slate-400 font-sans">Token</span>
            </div>
            <div className="text-xs font-semibold text-slate-400 mt-1 font-mono">
              {summary.promptTokens.toLocaleString('tr-TR')} In / {summary.candidatesTokens.toLocaleString('tr-TR')} Out
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-white/10 text-[11px] text-slate-400 flex items-center justify-between">
            <span>İstek Başına Ortalama:</span>
            <span className="font-bold text-purple-300 font-mono">
              {summary.totalCalls > 0 ? Math.round(summary.totalTokens / summary.totalCalls) : 0} Token
            </span>
          </div>
        </div>

        <div 
          onClick={() => onNavigateSubTab('models')}
          className="bg-slate-900/90 border border-fuchsia-500/30 rounded-2xl p-5 shadow-xl hover:border-fuchsia-500/60 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Aktif Model Konfigürasyonu</span>
            <div className="p-2 bg-fuchsia-500/20 text-fuchsia-400 rounded-xl border border-fuchsia-500/30 group-hover:scale-110 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2.5 space-y-1 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-300 font-medium">YKS Koçluğu:</span>
              <span className="font-bold text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded border border-indigo-500/30 font-mono text-[11px]">
                {modelSettings?.config?.['AI_COACH_STUDENT'] || 'gemini-3.1-flash-lite'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-300 font-medium">Hata Defteri:</span>
              <span className="font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30 font-mono text-[11px]">
                {modelSettings?.config?.['SOLVE_QUESTION'] || 'gemini-3.1-flash-lite'}
              </span>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-white/10 text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>Dinamik Ayarlanabilir Altyapı</span>
          </div>
        </div>
      </div>

      {/* Feature & Model Summary Quick Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Model Quick Table */}
        <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Cpu className="w-4 h-4 text-indigo-400" />
              <span>Aktif Kullanılan Gemini Modelleri</span>
            </h3>
            <button
              onClick={() => onNavigateSubTab('models')}
              className="text-[11px] text-indigo-400 hover:text-indigo-300 font-bold hover:underline"
            >
              Tümünü Yönet →
            </button>
          </div>
          <div className="space-y-2">
            {(stats?.modelUsage || []).map((m, idx) => (
              <div key={idx} className="p-3 bg-slate-950/70 border border-white/5 rounded-xl flex items-center justify-between text-xs font-mono">
                <div>
                  <span className="font-bold text-white block font-sans">{m.model}</span>
                  <span className="text-[10px] text-slate-400 font-sans">{m.calls} Çağrı • {m.totalTokens.toLocaleString('tr-TR')} Token</span>
                </div>
                <span className="font-bold text-emerald-400 text-sm">₺{m.costTRY.toFixed(3)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Query Data Permissions Overview Card */}
        <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Brain className="w-4 h-4 text-fuchsia-400" />
              <span>Sorgu & Prompt Veri İzinleri Özeti</span>
            </h3>
            <button
              onClick={() => onNavigateSubTab('query')}
              className="text-[11px] text-fuchsia-400 hover:text-fuchsia-300 font-bold hover:underline"
            >
              Ayarları Düzenle →
            </button>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Yapay zeka koçu öğrencilere özel tavsiye raporu hazırlarken haftalık ders çalışma planı, hata defteri konuları, deneme sınavı netleri ve çalışma rutinlerini analiz etmektedir.
          </p>
          <div className="pt-2 flex flex-wrap gap-1.5 text-[10px] font-bold">
            <span className="bg-indigo-500/20 text-indigo-300 px-2.5 py-1 rounded-lg border border-indigo-500/30">✓ Genel Denemeler (Son 3)</span>
            <span className="bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-lg border border-emerald-500/30">✓ Hata Defteri (Son 8)</span>
            <span className="bg-amber-500/20 text-amber-300 px-2.5 py-1 rounded-lg border border-amber-500/30">✓ Soru Çözüm Kayıtları (Son 5)</span>
            <span className="bg-purple-500/20 text-purple-300 px-2.5 py-1 rounded-lg border border-purple-500/30">✓ Çalışma Rutinleri (Son 3)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
