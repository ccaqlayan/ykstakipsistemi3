import React from 'react';
import { 
  Sparkles, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  Repeat, 
  Calendar, 
  BookOpen, 
  Target, 
  School, 
  Youtube, 
  Timer 
} from 'lucide-react';
import { ModelSettingsData, CoachDataSettingsMap } from '../SystemTypes';

interface AiQuerySettingsTabProps {
  modelSettings: ModelSettingsData | null;
  isCoachDataExpanded: boolean;
  setIsCoachDataExpanded: (val: boolean) => void;
  coachDataSaveMessage: string | null;
  savingCoachData: boolean;
  handleCoachDataToggle: (key: string, enabled: boolean) => void;
  handleCoachDataLimitChange: (key: string, limit: number) => void;
  handleSaveCoachDataSettings: () => Promise<void>;
  defaultCoachDataSettings: CoachDataSettingsMap;
}

export const AiQuerySettingsTab: React.FC<AiQuerySettingsTabProps> = ({
  modelSettings,
  isCoachDataExpanded,
  setIsCoachDataExpanded,
  coachDataSaveMessage,
  savingCoachData,
  handleCoachDataToggle,
  handleCoachDataLimitChange,
  handleSaveCoachDataSettings,
  defaultCoachDataSettings
}) => {
  const coachDataItems = [
    {
      key: 'generalMocks',
      title: 'Son Genel Deneme Sınavları',
      description: 'Öğrencinin çözdüğü en son genel deneme sınavı netleri (TYT / AYT toplam ve ders netleri).',
      icon: FileText,
      hasLimit: true,
      defaultCfg: { enabled: true, limit: 3 }
    },
    {
      key: 'topicErrors',
      title: 'Eksik / Yanlış Yapılan Konular (Hata Defteri)',
      description: 'Hata defterinde biriken en çok yanlış yapılan konular ve soru hata nedenleri.',
      icon: AlertTriangle,
      hasLimit: true,
      defaultCfg: { enabled: true, limit: 8 }
    },
    {
      key: 'questionLogs',
      title: 'Son Soru Çözüm Kayıtları',
      description: 'Günlük çözülen ders ve konu bazlı soru sayıları, doğru/yanlış/boş oranları.',
      icon: CheckCircle2,
      hasLimit: true,
      defaultCfg: { enabled: true, limit: 5 }
    },
    {
      key: 'routines',
      title: 'Son Rutin Verileri',
      description: 'Öğrencinin günlük takip ettiği paragraf, problem, geometri vb. çalışma rutinleri.',
      icon: Repeat,
      hasLimit: true,
      defaultCfg: { enabled: true, limit: 3 }
    },
    {
      key: 'studyPlanSummary',
      title: 'Haftalık Çalışma Planı Özeti',
      description: 'Haftalık etüt ders çalışma programının tamamlama yüzdesi ve yapılan/kalan görevler.',
      icon: Calendar,
      hasLimit: false,
      defaultCfg: { enabled: true }
    },
    {
      key: 'resourceProgress',
      title: 'Kaynak Takibi Çözülme Özetleri',
      description: 'Soru bankaları ve konu anlatım kitaplarının ders bazlı çözülme durumu ve tamamlama oranları.',
      icon: BookOpen,
      hasLimit: false,
      defaultCfg: { enabled: true }
    },
    {
      key: 'branchExams',
      title: 'Son Branş Denemeleri',
      description: 'Matematik, Türkçe, Fen vb. ders bazlı branş denemesi netleri ve tarihleri.',
      icon: Target,
      hasLimit: true,
      defaultCfg: { enabled: true, limit: 3 }
    },
    {
      key: 'institutionalMocks',
      title: 'Kurumsal / Türkiye Geneli Denemeler',
      description: 'Okul bünyesinde uygulanan kurumsal deneme sonuçları ve başarı sıralamaları.',
      icon: School,
      hasLimit: true,
      defaultCfg: { enabled: true, limit: 3 }
    },
    {
      key: 'youtubeTracker',
      title: 'YouTube / Video Ders İlerleme Durumu',
      description: 'İzlenen YouTube oynatma listeleri, konu videoları ve ders tamamlama saatleri.',
      icon: Youtube,
      hasLimit: false,
      defaultCfg: { enabled: true }
    },
    {
      key: 'pomodoroHistory',
      title: 'Pomodoro Odaklanma İstatistikleri',
      description: 'Tamamlanan Pomodoro etüt oturumları ve odaklanma süresi kayıtları.',
      icon: Timer,
      hasLimit: true,
      defaultCfg: { enabled: true, limit: 3 }
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-slate-900/90 border border-indigo-500/40 rounded-3xl p-6 shadow-2xl backdrop-blur-md space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-start space-x-3">
            <div className="p-3 bg-gradient-to-br from-indigo-600 to-fuchsia-600 text-white rounded-2xl shadow-lg shadow-indigo-500/20 border border-indigo-400/30 shrink-0 mt-0.5">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base flex flex-wrap items-center gap-2">
                <span>Yapay Zeka Koçunda Kullanılacak Veri İzinleri & Sorgu Limit Seçimi</span>
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-bold px-2.5 py-0.5 rounded-full border border-indigo-500/30">
                  Prompt Optimizasyonu
                </span>
              </h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Öğrenci genel yapay zeka koçu tavsiyesi üretilirken prompta eklenecek veri türlerini ve gönderilecek kayıt limitlerini özelleştirin.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 shrink-0 self-end md:self-center">
            {coachDataSaveMessage && (
              <div className="flex items-center space-x-2 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs px-3 py-1.5 rounded-xl animate-fade-in">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="font-semibold">{coachDataSaveMessage}</span>
              </div>
            )}
          </div>
        </div>

        {/* VERİ İZİNLERİ SEÇENEKLERİ LİSTESİ */}
        <div className="pt-2 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {coachDataItems.map((item) => {
              const cfg = (modelSettings?.coachDataSettings || defaultCoachDataSettings)[item.key] || item.defaultCfg;
              return (
                <div 
                  key={item.key} 
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                    cfg.enabled 
                      ? 'bg-slate-950/70 border-indigo-500/30 hover:border-indigo-500/50' 
                      : 'bg-slate-950/30 border-slate-800/80 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start space-x-3">
                      <div className={`p-2.5 rounded-xl border shrink-0 mt-0.5 ${
                        cfg.enabled 
                          ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-300' 
                          : 'bg-slate-800 border-slate-700 text-slate-500'
                      }`}>
                        <item.icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-bold text-xs text-white">{item.title}</h4>
                          {item.hasLimit && cfg.enabled && (
                            <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded font-mono font-bold border border-indigo-500/30">
                              Son {cfg.limit ?? item.defaultCfg.limit} kayıt
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    {/* Switch */}
                    <button
                      type="button"
                      onClick={() => handleCoachDataToggle(item.key, !cfg.enabled)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        cfg.enabled ? 'bg-indigo-600' : 'bg-slate-800'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          cfg.enabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Limit counter input */}
                  {item.hasLimit && cfg.enabled && (
                    <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400 font-medium">Prompta gönderilecek son kayıt sayısı:</span>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          min="1"
                          max="50"
                          value={cfg.limit ?? item.defaultCfg.limit}
                          onChange={(e) => handleCoachDataLimitChange(item.key, parseInt(e.target.value) || 1)}
                          className="w-16 bg-slate-900 border border-indigo-500/40 text-white font-mono text-xs text-center rounded-lg py-1 px-2 focus:outline-none focus:border-indigo-400"
                        />
                        <span className="text-[10px] text-slate-500 font-bold">Adet</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={handleSaveCoachDataSettings}
              disabled={savingCoachData}
              className="flex items-center space-x-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              {savingCoachData ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Kaydediliyor...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Sorgu & Veri İzinleri Yapılandırmasını Kaydet</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
