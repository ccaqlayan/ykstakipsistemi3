import React, { useState } from 'react';
import { 
  Sparkles, 
  Check, 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  Repeat, 
  Calendar, 
  BookOpen, 
  Target, 
  School, 
  Youtube, 
  Timer,
  Database,
  Eye,
  ChevronDown,
  ChevronUp,
  Brain,
  BookMarked,
  ClipboardList
} from 'lucide-react';
import { ModelSettingsData, CoachDataSettingsMap } from '../SystemTypes';

interface AiQuerySettingsTabProps {
  modelSettings: ModelSettingsData | null;
  isCoachDataExpanded?: boolean;
  setIsCoachDataExpanded?: (val: boolean) => void;
  coachDataSaveMessage: string | null;
  savingCoachData: boolean;
  handleCoachDataToggle: (key: string, enabled: boolean) => void;
  handleCoachDataLimitChange: (key: string, limit: number) => void;
  handleCoachDataPromptLogToggle?: (enabled: boolean) => void;
  handleSaveCoachDataSettings: () => Promise<void>;
  defaultCoachDataSettings: CoachDataSettingsMap;
}

interface DataItemConfig {
  key: string;
  title: string;
  description: string;
  icon: React.FC<any>;
  hasLimit: boolean;
  min: number;
  max: number;
  defaultCfg: { enabled: boolean; limit?: number };
}

const coachDataItems: DataItemConfig[] = [
  {
    key: 'generalMocks',
    title: 'Son Genel Deneme Sınavları',
    description: 'Öğrencinin çözdüğü en son genel deneme sınavı netleri (TYT / AYT toplam ve ders netleri).',
    icon: FileText,
    hasLimit: true,
    min: 1,
    max: 15,
    defaultCfg: { enabled: true, limit: 3 }
  },
  {
    key: 'questionLogs',
    title: 'Son Soru Çözüm Kayıtları',
    description: 'Günlük çözülen ders ve konu bazlı soru sayıları, doğru/yanlış/boş oranları.',
    icon: CheckCircle2,
    hasLimit: true,
    min: 1,
    max: 25,
    defaultCfg: { enabled: true, limit: 5 }
  },
  {
    key: 'routines',
    title: 'Son Rutin Verileri',
    description: 'Öğrencinin günlük takip ettiği paragraf, problem, geometri vb. çalışma rutinleri.',
    icon: Repeat,
    hasLimit: true,
    min: 1,
    max: 15,
    defaultCfg: { enabled: true, limit: 3 }
  },
  {
    key: 'studyPlanSummary',
    title: 'Haftalık Çalışma Planı Özeti',
    description: 'Haftalık etüt ders çalışma programının tamamlama yüzdesi ve yapılan/kalan görevler.',
    icon: Calendar,
    hasLimit: false,
    min: 1,
    max: 10,
    defaultCfg: { enabled: true }
  },
  {
    key: 'resourceProgress',
    title: 'Kaynak Takibi Çözülme Özetleri',
    description: 'Soru bankaları ve konu anlatım kitaplarının ders bazlı çözülme durumu ve tamamlama oranları.',
    icon: BookOpen,
    hasLimit: false,
    min: 1,
    max: 10,
    defaultCfg: { enabled: true }
  },
  {
    key: 'branchExams',
    title: 'Son Branş Denemeleri',
    description: 'Matematik, Türkçe, Fen vb. ders bazlı branş denemesi netleri ve tarihleri.',
    icon: Target,
    hasLimit: true,
    min: 1,
    max: 20,
    defaultCfg: { enabled: true, limit: 3 }
  },
  {
    key: 'institutionalMocks',
    title: 'Kurumsal / Türkiye Geneli Denemeler',
    description: 'Okul bünyesinde uygulanan kurumsal deneme sonuçları ve başarı sıralamaları.',
    icon: School,
    hasLimit: true,
    min: 1,
    max: 15,
    defaultCfg: { enabled: true, limit: 3 }
  },
  {
    key: 'youtubeTracker',
    title: 'YouTube / Video Ders İlerleme Durumu',
    description: 'İzlenen YouTube oynatma listeleri, konu videoları ve ders tamamlama saatleri.',
    icon: Youtube,
    hasLimit: false,
    min: 1,
    max: 10,
    defaultCfg: { enabled: true }
  },
  {
    key: 'pomodoroHistory',
    title: 'Pomodoro Odaklanma İstatistikleri',
    description: 'Tamamlanan Pomodoro etüt oturumları ve odaklanma süresi kayıtları.',
    icon: Timer,
    hasLimit: true,
    min: 1,
    max: 20,
    defaultCfg: { enabled: true, limit: 3 }
  }
];

const errorBookDataItems: DataItemConfig[] = [
  {
    key: 'topicErrors',
    title: 'Eksik / Yanlış Yapılan Konular (Hata Defteri)',
    description: 'Hata defterinde biriken en çok yanlış yapılan konular ve soru hata nedenleri.',
    icon: AlertTriangle,
    hasLimit: true,
    min: 1,
    max: 30,
    defaultCfg: { enabled: true, limit: 8 }
  }
];

const studyPlannerDataItems: DataItemConfig[] = [
  {
    key: 'studyPlannerTask',
    title: 'Çalışma Planı Görev Önerisi (Ana Özellik)',
    description: 'Yapay zekanın görev önerisi üretip üretmeyeceğini kontrol eder. Kapatılırsa buton görünmez.',
    icon: ClipboardList,
    hasLimit: false,
    min: 1,
    max: 10,
    defaultCfg: { enabled: true }
  },
  {
    key: 'lastWeekPlans',
    title: 'Geçen Haftanın Plan Geçmişi (Referans)',
    description: 'Önerilen görevi belirlerken geçen haftanın etüt planını ve tamamlanan konuları prompt verilerine ekler. (Varsayılan: KAPALI)',
    icon: Calendar,
    hasLimit: false,
    min: 1,
    max: 10,
    defaultCfg: { enabled: false }
  },
  {
    key: 'generalMocks',
    title: 'Son Genel Deneme Netleri (Referans)',
    description: 'Görev önerisi için hangi derste zayıf olunduğunu tespit eden genel deneme net verileri.',
    icon: FileText,
    hasLimit: true,
    min: 1,
    max: 10,
    defaultCfg: { enabled: true, limit: 3 }
  },
  {
    key: 'branchExams',
    title: 'Son Branş Denemeleri (Referans)',
    description: 'Derse özel zayıf konuların tespiti için branş denemesi netleri.',
    icon: Target,
    hasLimit: true,
    min: 1,
    max: 10,
    defaultCfg: { enabled: true, limit: 3 }
  },
  {
    key: 'topicErrors',
    title: 'Hata Defteri Konuları (Referans)',
    description: 'Hata defterindeki zayıf konulara öncelik vererek görev önerisi oluşturur.',
    icon: AlertTriangle,
    hasLimit: true,
    min: 1,
    max: 20,
    defaultCfg: { enabled: true, limit: 8 }
  },
  {
    key: 'questionLogs',
    title: 'Son Soru Çözüm Kayıtları (Referans)',
    description: 'Az çözülen veya düşük net yapılan derslere odaklanmak için soru takip verileri.',
    icon: CheckCircle2,
    hasLimit: true,
    min: 1,
    max: 15,
    defaultCfg: { enabled: true, limit: 5 }
  }
];

export const AiQuerySettingsTab: React.FC<AiQuerySettingsTabProps> = ({
  modelSettings,
  coachDataSaveMessage,
  savingCoachData,
  handleCoachDataToggle,
  handleCoachDataLimitChange,
  handleCoachDataPromptLogToggle,
  handleSaveCoachDataSettings,
  defaultCoachDataSettings
}) => {
  const isPromptLogEnabled = modelSettings?.savePromptLogs !== false;
  const [expandedSection, setExpandedSection] = useState<'coach' | 'errorbook' | 'planner' | null>(null);
  const [sectionSaved, setSectionSaved] = useState<Record<string, boolean>>({});

  const toggleSection = (section: 'coach' | 'errorbook' | 'planner') => {
    setExpandedSection(prev => prev === section ? null : section);
  };

  const handleSaveSection = async (section: string) => {
    await handleSaveCoachDataSettings();
    setSectionSaved(prev => ({ ...prev, [section]: true }));
    setTimeout(() => setSectionSaved(prev => ({ ...prev, [section]: false })), 3000);
  };

  const renderDataItem = (item: DataItemConfig) => {
    const cfg = (modelSettings?.coachDataSettings || defaultCoachDataSettings)[item.key] || item.defaultCfg;
    const currentLimit = cfg.limit ?? item.defaultCfg.limit ?? 3;

    return (
      <div 
        key={item.key} 
        className={`p-4 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
          cfg.enabled 
            ? 'bg-slate-900/40 hover:bg-slate-900/70' 
            : 'bg-slate-950/40 opacity-50'
        }`}
      >
        {/* Left Info & Icon */}
        <div className="flex items-start space-x-3.5 max-w-xl">
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
                  Son {currentLimit} kayıt
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">
              {item.description}
            </p>
          </div>
        </div>

        {/* Right Controls: Range Slider & Toggle Switch */}
        <div className="flex flex-wrap items-center gap-4 shrink-0 self-start lg:self-center">
          {/* Slider Control for Limit */}
          {item.hasLimit && cfg.enabled && (
            <div className="flex items-center space-x-3 bg-slate-900/90 border border-slate-800/80 px-3.5 py-2 rounded-xl shadow-md">
              <span className="text-[11px] text-slate-400 font-semibold whitespace-nowrap">
                Limit:
              </span>
              <input
                type="range"
                min={item.min}
                max={item.max}
                step="1"
                value={currentLimit}
                onChange={(e) => handleCoachDataLimitChange(item.key, parseInt(e.target.value) || 1)}
                className="w-28 sm:w-36 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400 transition-all"
              />
              <span className="text-xs font-mono font-bold text-indigo-300 w-14 text-right">
                {currentLimit} Adet
              </span>
            </div>
          )}

          {/* Toggle Switch */}
          <div className="flex items-center space-x-2.5 bg-slate-900/60 border border-slate-800/60 px-3 py-1.5 rounded-xl">
            <span className="text-[11px] text-slate-400 font-semibold">
              {cfg.enabled ? 'Aktif' : 'Pasif'}
            </span>
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
        </div>
      </div>
    );
  };

  const enabledCoachCount = coachDataItems.filter(item => {
    const cfg = (modelSettings?.coachDataSettings || defaultCoachDataSettings)[item.key] || item.defaultCfg;
    return cfg.enabled;
  }).length;

  const enabledErrorCount = errorBookDataItems.filter(item => {
    const cfg = (modelSettings?.coachDataSettings || defaultCoachDataSettings)[item.key] || item.defaultCfg;
    return cfg.enabled;
  }).length;

  const enabledPlannerCount = studyPlannerDataItems.filter(item => {
    const cfg = (modelSettings?.coachDataSettings || defaultCoachDataSettings)[item.key] || item.defaultCfg;
    return cfg.enabled;
  }).length;

  return (
    <div className="space-y-5 animate-fade-in">

      {/* ── 1. PROMPT LOGGING TOGGLE (EN ÜSTTE) ── */}
      <div className={`p-5 rounded-2xl border transition-all ${
        isPromptLogEnabled
          ? 'bg-purple-950/40 border-purple-500/40 text-purple-200'
          : 'bg-slate-900/80 border-slate-800 text-slate-400'
      }`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className={`p-2.5 rounded-xl border shrink-0 mt-0.5 ${
              isPromptLogEnabled
                ? 'bg-purple-500/20 border-purple-500/30 text-purple-300'
                : 'bg-slate-800 border-slate-700 text-slate-500'
            }`}>
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="font-bold text-sm text-white">Gönderilen Prompt Metinlerini Günlüğe Kaydet (Prompt Log Kaydı)</h4>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                  isPromptLogEnabled
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  {isPromptLogEnabled ? 'KAYIT AKTİF' : 'KAYIT KAPALI'}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Bu seçenek açıldığında yapay zekaya gönderilen ham <span className="text-indigo-300 font-semibold font-mono inline-flex items-center gap-1"><Eye className="w-3 h-3 inline" /> Prompt</span> metni ve yanıtı günlük kayıtlarına eklenir. Ayakizi sayfasından "Promptu Gör" butonuyla inceleyebilirsiniz.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 shrink-0 self-end sm:self-center">
            <span className="text-xs font-bold text-slate-300">
              {isPromptLogEnabled ? 'Açık' : 'Kapalı'}
            </span>
            <button
              type="button"
              onClick={() => handleCoachDataPromptLogToggle && handleCoachDataPromptLogToggle(!isPromptLogEnabled)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isPromptLogEnabled ? 'bg-purple-600' : 'bg-slate-800'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  isPromptLogEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* ── 2. YAPAY ZEKA KOÇU ACCORDION ── */}
      <div className="bg-slate-900/90 border border-indigo-500/30 rounded-2xl overflow-hidden shadow-xl backdrop-blur-md">
        {/* Header */}
        <div
          className="flex items-center justify-between p-5 cursor-pointer hover:bg-slate-800/50 transition-colors select-none"
          onClick={() => toggleSection('coach')}
        >
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-gradient-to-br from-indigo-600 to-blue-600 text-white rounded-xl shadow-md border border-indigo-400/30">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Yapay Zeka Koçu — Prompt Veri Ayarları</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Yapay zeka koçunun tavsiye üretirken hangi öğrenci verilerini kullanacağını ve kayıt limitlerini belirleyin.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3 shrink-0">
            <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-bold px-2.5 py-1 rounded-full border border-indigo-500/30">
              {enabledCoachCount}/{coachDataItems.length} Aktif
            </span>
            {sectionSaved['coach'] && (
              <div className="flex items-center space-x-1.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[11px] px-2.5 py-1 rounded-lg animate-fade-in">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-semibold">Kaydedildi!</span>
              </div>
            )}
            <div className={`p-1.5 rounded-lg transition-colors ${expandedSection === 'coach' ? 'bg-indigo-600/30 text-indigo-300' : 'bg-slate-800 text-slate-400'}`}>
              {expandedSection === 'coach' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </div>
        </div>

        {/* Expandable Content */}
        {expandedSection === 'coach' && (
          <div className="border-t border-slate-800 animate-fade-in">
            <div className="divide-y divide-slate-800/80">
              {coachDataItems.map(renderDataItem)}
            </div>
            <div className="flex justify-end p-4 border-t border-slate-800">
              <div className="flex items-center space-x-3">
                {sectionSaved['coach'] && (
                  <div className="flex items-center space-x-1.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[11px] px-2.5 py-1 rounded-lg animate-fade-in">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="font-semibold">Kaydedildi!</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => handleSaveSection('coach')}
                  disabled={savingCoachData}
                  className="flex items-center space-x-2 px-5 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                >
                  {savingCoachData ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Kaydediliyor...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Yapay Zeka Koçu Ayarlarını Kaydet</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── 3. HATA DEFTERİ ACCORDION ── */}
      <div className="bg-slate-900/90 border border-amber-500/30 rounded-2xl overflow-hidden shadow-xl backdrop-blur-md">
        {/* Header */}
        <div
          className="flex items-center justify-between p-5 cursor-pointer hover:bg-slate-800/50 transition-colors select-none"
          onClick={() => toggleSection('errorbook')}
        >
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-gradient-to-br from-amber-600 to-orange-600 text-white rounded-xl shadow-md border border-amber-400/30">
              <BookMarked className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Hata Defteri — Prompt Veri Ayarları</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Hata defteri soru analizi ve öncelik puanlaması yapılırken kullanılacak veri izinleri ve kayıt limitlerini belirleyin.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3 shrink-0">
            <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2.5 py-1 rounded-full border border-amber-500/30">
              {enabledErrorCount}/{errorBookDataItems.length} Aktif
            </span>
            {sectionSaved['errorbook'] && (
              <div className="flex items-center space-x-1.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[11px] px-2.5 py-1 rounded-lg animate-fade-in">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-semibold">Kaydedildi!</span>
              </div>
            )}
            <div className={`p-1.5 rounded-lg transition-colors ${expandedSection === 'errorbook' ? 'bg-amber-600/30 text-amber-300' : 'bg-slate-800 text-slate-400'}`}>
              {expandedSection === 'errorbook' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </div>
        </div>

        {/* Expandable Content */}
        {expandedSection === 'errorbook' && (
          <div className="border-t border-slate-800 animate-fade-in">
            <div className="divide-y divide-slate-800/80">
              {errorBookDataItems.map(renderDataItem)}
            </div>
            <div className="flex justify-end p-4 border-t border-slate-800">
              <div className="flex items-center space-x-3">
                {sectionSaved['errorbook'] && (
                  <div className="flex items-center space-x-1.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[11px] px-2.5 py-1 rounded-lg animate-fade-in">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="font-semibold">Kaydedildi!</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => handleSaveSection('errorbook')}
                  disabled={savingCoachData}
                  className="flex items-center space-x-2 px-5 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-amber-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                >
                  {savingCoachData ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Kaydediliyor...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Hata Defteri Ayarlarını Kaydet</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* ── 4. ÇALIŞMA PLANI GÖREV ÖNERİSİ ACCORDION ── */}
      <div className="bg-slate-900/90 border border-emerald-500/30 rounded-2xl overflow-hidden shadow-xl backdrop-blur-md">
        {/* Header */}
        <div
          className="flex items-center justify-between p-5 cursor-pointer hover:bg-slate-800/50 transition-colors select-none"
          onClick={() => toggleSection('planner')}
        >
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-gradient-to-br from-emerald-600 to-teal-600 text-white rounded-xl shadow-md border border-emerald-400/30">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Çalışma Planı — Yapay Zeka Görev Önerisi Veri Ayarları</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                "Yeni Görev Ekle" modalındaki Yapay Zeka Önersin butonunun hangi verileri kullanacağını ve aktif olup olmayacağını belirleyin.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3 shrink-0">
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2.5 py-1 rounded-full border border-emerald-500/30">
              {enabledPlannerCount}/{studyPlannerDataItems.length} Aktif
            </span>
            {sectionSaved['planner'] && (
              <div className="flex items-center space-x-1.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[11px] px-2.5 py-1 rounded-lg animate-fade-in">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-semibold">Kaydedildi!</span>
              </div>
            )}
            <div className={`p-1.5 rounded-lg transition-colors ${expandedSection === 'planner' ? 'bg-emerald-600/30 text-emerald-300' : 'bg-slate-800 text-slate-400'}`}>
              {expandedSection === 'planner' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </div>
        </div>

        {/* Expandable Content */}
        {expandedSection === 'planner' && (
          <div className="border-t border-slate-800 animate-fade-in">
            <div className="divide-y divide-slate-800/80">
              {studyPlannerDataItems.map(renderDataItem)}
            </div>
            <div className="flex justify-end p-4 border-t border-slate-800">
              <div className="flex items-center space-x-3">
                {sectionSaved['planner'] && (
                  <div className="flex items-center space-x-1.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[11px] px-2.5 py-1 rounded-lg animate-fade-in">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="font-semibold">Kaydedildi!</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => handleSaveSection('planner')}
                  disabled={savingCoachData}
                  className="flex items-center space-x-2 px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                >
                  {savingCoachData ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Kaydediliyor...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Çalışma Planı Ayarlarını Kaydet</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
