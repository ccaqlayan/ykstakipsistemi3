import React from 'react';
import { 
  AlertTriangle, 
  BellRing, 
  Settings2, 
  Save, 
  RefreshCw, 
  Coins, 
  Cpu, 
  Sparkles 
} from 'lucide-react';
import { UsageSummary, UsageStatsResponse } from '../SystemTypes';

interface AiCostTabProps {
  summary: UsageSummary;
  stats: UsageStatsResponse | null;
  anomalyLimitTRY: number;
  setAnomalyLimitTRY: (val: number) => void;
  isSavingLimit: boolean;
  handleSaveAnomalyLimit: () => Promise<void>;
}

export const AiCostTab: React.FC<AiCostTabProps> = ({
  summary,
  stats,
  anomalyLimitTRY,
  setAnomalyLimitTRY,
  isSavingLimit,
  handleSaveAnomalyLimit
}) => {
  const dailyCostTRY = summary.totalCostTRY;
  const isAnomalyDetected = dailyCostTRY > anomalyLimitTRY;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* MALİYET ALARMI & ANOMALİ TESPİT GÖSTERGESİ */}
      <div className={`p-5 rounded-3xl border transition-all shadow-2xl backdrop-blur-md ${
        isAnomalyDetected
          ? 'bg-gradient-to-r from-rose-950/90 via-slate-900 to-amber-950/90 border-rose-500/50 shadow-rose-500/20'
          : 'bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/80 border-emerald-500/30 shadow-emerald-500/10'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start space-x-4">
            <div className={`p-3 rounded-2xl shrink-0 border ${
              isAnomalyDetected
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse'
                : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
            }`}>
              {isAnomalyDetected ? <AlertTriangle className="w-6 h-6" /> : <BellRing className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                  isAnomalyDetected
                    ? 'bg-rose-500/30 text-rose-300 border-rose-500/50 animate-bounce'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                }`}>
                  {isAnomalyDetected ? '⚠️ DİKKAT: MALİYET ALARMI!' : '🟢 NORMAL SİSTEM BÜTÇESİ'}
                </span>
                <span className="text-xs text-slate-400">Rehber Öğretmen Bütçe Takibi</span>
              </div>
              <h2 className="text-lg font-bold text-white mt-1">
                {isAnomalyDetected
                  ? 'API Harcamasında Ani Yükselme (Anomali) Saptandı!'
                  : 'API Harcamaları ve Bütçe Limiti Güvenli Seviyede'}
              </h2>
              <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
                {isAnomalyDetected
                  ? `Mevcut toplam harcama (₺${dailyCostTRY.toFixed(3)}) belirlediğiniz günlük ₺${anomalyLimitTRY.toFixed(2)} bütçe limitini aştı! Son dönemde yoğun görsel soru çözümü veya sürekli koçluk raporu üretilmiş olabilir.`
                  : `Mevcut harcama (₺${dailyCostTRY.toFixed(3)}), belirlediğiniz ₺${anomalyLimitTRY.toFixed(2)} harcama eşiğinin altında seyrediyor. Sistem stabil çalışıyor.`}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-start md:items-end gap-2 shrink-0 bg-slate-950/60 p-3 rounded-2xl border border-white/10">
            <span className="text-[11px] text-slate-300 font-semibold flex items-center gap-1">
              <Settings2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Alarm Eşiği (TL / Gün):</span>
            </span>
            <div className="flex items-center gap-2">
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">₺</span>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={anomalyLimitTRY}
                  onChange={(e) => setAnomalyLimitTRY(parseFloat(e.target.value) || 0)}
                  className="w-20 bg-slate-900 text-white text-xs font-bold pl-5 pr-1.5 py-1 rounded-lg border border-slate-800 focus:outline-none focus:border-indigo-500 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
              <button
                type="button"
                onClick={handleSaveAnomalyLimit}
                disabled={isSavingLimit}
                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white text-xs font-bold rounded-lg border border-indigo-400/30 transition-all cursor-pointer flex items-center gap-1"
              >
                {isSavingLimit ? (
                  <RefreshCw className="w-3 h-3 animate-spin" />
                ) : (
                  <Save className="w-3 h-3" />
                )}
                <span>Kaydet</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* DETAILED COST TABLES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-5 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
            <div className="flex items-center space-x-2">
              <Cpu className="w-5 h-5 text-indigo-400" />
              <h3 className="font-bold text-white text-base">Model Bazlı Birim Maliyet Analizi</h3>
            </div>
            <span className="text-xs text-slate-400">Gemini Modelleri</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="pb-2">Model Adı</th>
                  <th className="pb-2 text-center">İstek</th>
                  <th className="pb-2 text-right">Toplam Token</th>
                  <th className="pb-2 text-right">Tahmini TL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-medium">
                {(stats?.modelUsage || []).map((m, idx) => (
                  <tr key={idx} className="hover:bg-white/5 transition-colors">
                    <td className="py-2.5">
                      <div className="font-bold text-white">{m.model}</div>
                      <div className="text-[10px] text-slate-400">
                        {m.model.includes('lite') ? 'Hata Defteri & Görsel Analiz (Ekonomik)' : 'YKS Koç Raporları (Detaylı)'}
                      </div>
                    </td>
                    <td className="py-2.5 text-center">
                      <span className="bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded font-bold font-mono">
                        {m.calls}
                      </span>
                    </td>
                    <td className="py-2.5 text-right font-mono">
                      {m.totalTokens.toLocaleString('tr-TR')}
                    </td>
                    <td className="py-2.5 text-right font-mono">
                      {m.costTRY === 0 ? (
                        <span className="font-bold text-emerald-400 text-xs inline-flex items-center gap-1">
                          <span>₺0.0000</span>
                          <span className="text-[9px] bg-emerald-500/10 px-1 py-0.2 rounded border border-emerald-500/20 text-emerald-300">Free</span>
                        </span>
                      ) : (
                        <span className="font-bold text-emerald-400">
                          ₺{m.costTRY.toFixed(4)}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-5 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <h3 className="font-bold text-white text-base">Modül & Özellik Harcamaları</h3>
            </div>
            <span className="text-xs text-slate-400">Süreç Dağılımı</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="pb-2">Özellik / Modül</th>
                  <th className="pb-2 text-center">İstek</th>
                  <th className="pb-2 text-right">Tokens</th>
                  <th className="pb-2 text-right">Tutar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-medium">
                {(stats?.featureUsage || []).map((f, idx) => (
                  <tr key={idx} className="hover:bg-white/5 transition-colors">
                    <td className="py-2.5">
                      <div className="font-bold text-white">{f.featureName}</div>
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                        f.category === 'AI_COACH' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-fuchsia-500/20 text-fuchsia-300'
                      }`}>
                        {f.category === 'AI_COACH' ? 'Yapay Zeka Koçu' : 'Soru Analizi'}
                      </span>
                    </td>
                    <td className="py-2.5 text-center">
                      <span className="bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded font-bold font-mono">
                        {f.calls}
                      </span>
                    </td>
                    <td className="py-2.5 text-right font-mono">
                      {f.totalTokens.toLocaleString('tr-TR')}
                    </td>
                    <td className="py-2.5 text-right font-mono">
                      {f.costTRY === 0 ? (
                        <span className="font-bold text-emerald-400 text-xs inline-flex items-center gap-1">
                          <span>₺0.0000</span>
                          <span className="text-[9px] bg-emerald-500/10 px-1 py-0.2 rounded border border-emerald-500/20 text-emerald-300">Free</span>
                        </span>
                      ) : (
                        <span className="font-bold text-emerald-400">
                          ₺{f.costTRY.toFixed(4)}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
