import React from 'react';
import { 
  Brain, 
  Bot, 
  Zap, 
  Check, 
  ChevronDown, 
  ChevronUp 
} from 'lucide-react';
import { ModelSettingsData } from '../SystemTypes';

interface AiModelSettingsTabProps {
  modelSettings: ModelSettingsData | null;
  handleToggleAiFeatures: (enabled: boolean) => Promise<void>;
  savingModels: boolean;
  modelSaveMessage: string | null;
  showModelSelection: boolean;
  setShowModelSelection: (val: boolean) => void;
  handleSetAllModels: (modelId: string) => void;
  handleModelChange: (featureKey: string, newModelId: string) => void;
  handleSaveModelConfig: () => Promise<void>;
}

export const AiModelSettingsTab: React.FC<AiModelSettingsTabProps> = ({
  modelSettings,
  handleToggleAiFeatures,
  savingModels,
  modelSaveMessage,
  showModelSelection,
  setShowModelSelection,
  handleSetAllModels,
  handleModelChange,
  handleSaveModelConfig
}) => {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* YAPAY ZEKA MODÜLLERİ VE MODEL SEÇİMİ YÖNETİM PANELI */}
      <div className="bg-slate-900/90 border border-purple-500/40 rounded-3xl p-6 shadow-2xl backdrop-blur-md space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-2xl shadow-lg shadow-purple-500/20 border border-purple-400/30">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <span>Yapay Zeka Modülleri & Model Seçimi Yapılandırması</span>
                <span className="text-[10px] bg-purple-500/20 text-purple-300 font-bold px-2.5 py-0.5 rounded-full border border-purple-500/30">
                  Yönetici Kontrolü
                </span>
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Sistemdeki her bir yapay zeka alanının (Koçluk, Soru Çözümü, Benzer Soru Üretimi vb.) hangi Gemini modelini kullanacağını özelleştirin.
              </p>
            </div>
          </div>

          {modelSaveMessage && (
            <div className="flex items-center space-x-2 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs px-3.5 py-2 rounded-xl animate-fade-in">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-semibold">{modelSaveMessage}</span>
            </div>
          )}
        </div>

        {/* Master AI Toggle Bar */}
        <div className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-center justify-between gap-4 ${
          modelSettings?.aiFeaturesEnabled !== false
            ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
            : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
        }`}>
          <div className="flex items-center space-x-3">
            <div className={`p-2.5 rounded-xl border shrink-0 ${
              modelSettings?.aiFeaturesEnabled !== false
                ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                : 'bg-rose-500/20 border-rose-500/30 text-rose-400'
            }`}>
              <Bot className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="font-bold text-sm text-white">Yapay Zeka Sistem Durumu (Genel Okul Anahtarı)</h4>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                  modelSettings?.aiFeaturesEnabled !== false
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                }`}>
                  {modelSettings?.aiFeaturesEnabled !== false ? 'SİSTEM AKTİF' : 'SİSTEM KAPALI'}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                {modelSettings?.aiFeaturesEnabled !== false
                  ? 'Tüm yapay zeka servisleri (Koçluk, Soru Çözücü, Benzer Soru Üretici vb.) aktif ve öğrenciler ile öğretmenler için açık durumdadır.'
                  : '⚠️ Okul Rehber Öğretmeni / Yönetici kararıyla tüm yapay zeka özellikleri geçici olarak tamamen KAPATILMIŞTIR.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleToggleAiFeatures(modelSettings?.aiFeaturesEnabled === false ? true : false)}
            disabled={savingModels}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 shrink-0 cursor-pointer shadow-lg ${
              modelSettings?.aiFeaturesEnabled !== false
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>{modelSettings?.aiFeaturesEnabled !== false ? 'Yapay Zeka Özelliklerini Kapat' : 'Yapay Zeka Özelliklerini Aç'}</span>
          </button>
        </div>

        {/* Toggle Configuration Button */}
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={() => setShowModelSelection(!showModelSelection)}
            className="flex items-center space-x-2 px-5 py-3 bg-purple-600/10 hover:bg-purple-600/25 text-purple-300 font-bold text-xs rounded-xl border border-purple-500/30 transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
          >
            {showModelSelection ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            <span>{showModelSelection ? 'Yapılandırma Seçeneklerini Gizle' : 'Model Seçimi Yapılandırma Seçeneklerini Göster & Düzenle'}</span>
          </button>
        </div>

        {/* Collapsible Model List & Save Button */}
        {showModelSelection && (
          <div className="space-y-4 pt-2 animate-fade-in">
            {/* Hızlı Toplu Model Değiştirme Butonları */}
            <div className="bg-slate-900/60 border border-indigo-500/20 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <h5 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                  <span>Hızlı Toplu Model Değiştirme</span>
                </h5>
                <p className="text-[10px] text-slate-400">
                  Tüm yapay zeka sistem özelliklerinin aktif modelini tek tıkla aynı anda değiştirebilirsiniz.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {modelSettings?.availableModels.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleSetAllModels(m.id)}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-bold border border-slate-700 bg-slate-800 hover:bg-slate-750 hover:text-white text-slate-300 transition-all cursor-pointer shadow-sm active:scale-95 flex items-center gap-1"
                    title={`Tüm modelleri ${m.name} olarak ayarla`}
                  >
                    <span>Hepsini</span>
                    <span className="text-indigo-400 font-extrabold">{m.id.replace('gemini-', '')}</span>
                    <span>Yap</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="divide-y divide-slate-800">
                {modelSettings?.features.map((feature) => {
                  const currentModelId = modelSettings.config[feature.key] || 'gemini-3.1-flash-lite';
                  return (
                    <div
                      key={feature.key}
                      className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-900/30 transition-colors"
                    >
                      <div className="space-y-1 max-w-xl">
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase border ${
                            feature.category === 'Yapay Zeka Koçluğu'
                              ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                              : feature.category === 'Ders Planlama'
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                              : 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30'
                          }`}>
                            {feature.category}
                          </span>
                        </div>
                        <h4 className="font-bold text-white text-sm mt-0.5">{feature.name}</h4>
                        <p className="text-xs text-slate-400 leading-relaxed mt-0.5">{feature.description}</p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs font-semibold text-slate-300 shrink-0">Aktif Model:</span>
                        <select
                          value={currentModelId}
                          onChange={(e) => handleModelChange(feature.key, e.target.value)}
                          disabled={savingModels}
                          className="bg-slate-900 text-white font-medium text-xs px-3 py-1.5 rounded-xl border border-indigo-500/40 focus:outline-none focus:border-indigo-400 transition-all cursor-pointer w-full md:w-[240px]"
                        >
                          {modelSettings.availableModels.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name} [{m.badge}]
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Save Button at the Bottom of the List */}
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleSaveModelConfig}
                disabled={savingModels}
                className="flex items-center space-x-2 px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                {savingModels ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Kaydediliyor...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Model Yapılandırmasını Kaydet</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
