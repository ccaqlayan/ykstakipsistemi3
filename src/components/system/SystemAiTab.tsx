import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  Zap, 
  CheckCircle2, 
  Sparkles, 
  Bot, 
  Clock, 
  Coins, 
  Brain, 
  AlertTriangle, 
  Calendar, 
  Settings2, 
  Save, 
  Check, 
  BellRing, 
  BarChart2, 
  Activity, 
  ChevronDown, 
  ChevronUp, 
  Repeat, 
  BookOpen, 
  Target, 
  School, 
  Youtube, 
  Timer, 
  FileText,
  RefreshCw
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import {
  UsageSummary,
  ModelUsage,
  FeatureUsage,
  ApiUsageLog,
  UsageStatsResponse,
  ModelSettingsData,
  CoachDataSettingsMap
} from './SystemTypes';

interface SystemAiTabProps {
  stats: UsageStatsResponse | null;
  summary: UsageSummary;
  modelSettings: ModelSettingsData | null;
  anomalyLimitTRY: number;
  setAnomalyLimitTRY: (val: number) => void;
  isSavingLimit: boolean;
  handleSaveAnomalyLimit: () => Promise<void>;
  handleToggleAiFeatures: (enabled: boolean) => Promise<void>;
  savingModels: boolean;
  modelSaveMessage: string | null;
  showModelSelection: boolean;
  setShowModelSelection: (val: boolean) => void;
  handleSetAllModels: (modelId: string) => void;
  handleModelChange: (featureKey: string, newModelId: string) => void;
  handleSaveModelConfig: () => Promise<void>;
  isCoachDataExpanded: boolean;
  setIsCoachDataExpanded: (val: boolean) => void;
  coachDataSaveMessage: string | null;
  savingCoachData: boolean;
  handleCoachDataToggle: (key: string, enabled: boolean) => void;
  handleCoachDataLimitChange: (key: string, limit: number) => void;
  handleSaveCoachDataSettings: () => Promise<void>;
  defaultCoachDataSettings: CoachDataSettingsMap;
  dateFilter: '7days' | 'thisMonth' | 'allTime';
  setDateFilter: (filter: '7days' | 'thisMonth' | 'allTime') => void;
  filterCategory: 'ALL' | 'AI_COACH' | 'QUESTION_ANALYSIS';
  setFilterCategory: (cat: 'ALL' | 'AI_COACH' | 'QUESTION_ANALYSIS') => void;
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  itemsPerPage: number;
}

export const SystemAiTab: React.FC<SystemAiTabProps> = ({
  stats,
  summary,
  modelSettings,
  anomalyLimitTRY,
  setAnomalyLimitTRY,
  isSavingLimit,
  handleSaveAnomalyLimit,
  handleToggleAiFeatures,
  savingModels,
  modelSaveMessage,
  showModelSelection,
  setShowModelSelection,
  handleSetAllModels,
  handleModelChange,
  handleSaveModelConfig,
  isCoachDataExpanded,
  setIsCoachDataExpanded,
  coachDataSaveMessage,
  savingCoachData,
  handleCoachDataToggle,
  handleCoachDataLimitChange,
  handleSaveCoachDataSettings,
  defaultCoachDataSettings,
  dateFilter,
  setDateFilter,
  filterCategory,
  setFilterCategory,
  currentPage,
  setCurrentPage,
  itemsPerPage,
}) => {
  const dailyCostTRY = summary.totalCostTRY;
  const isAnomalyDetected = dailyCostTRY > anomalyLimitTRY;

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

  const getDailyChartData = () => {
    const dailyMap: { 
      [dateKey: string]: { 
        dateLabel: string; 
        totalTokens: number; 
        liteModelTokens: number; 
        liteModelCalls: number; 
        coachModelTokens: number;
        estimatedCostTRY: number;
      } 
    } = {};

    let daysToInclude = 7;
    if (dateFilter === 'thisMonth') daysToInclude = 30;
    if (dateFilter === 'allTime') daysToInclude = 60;

    const today = new Date();
    for (let i = daysToInclude - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().split('T')[0];
      const dateLabel = d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' });
      dailyMap[dateKey] = {
        dateLabel,
        totalTokens: 0,
        liteModelTokens: 0,
        liteModelCalls: 0,
        coachModelTokens: 0,
        estimatedCostTRY: 0
      };
    }

    if (stats?.recentLogs && stats.recentLogs.length > 0) {
      stats.recentLogs.forEach(log => {
        const dateKey = new Date(log.timestamp).toISOString().split('T')[0];
        if (!dailyMap[dateKey]) {
          const dateLabel = new Date(log.timestamp).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' });
          dailyMap[dateKey] = {
            dateLabel,
            totalTokens: 0,
            liteModelTokens: 0,
            liteModelCalls: 0,
            coachModelTokens: 0,
            estimatedCostTRY: 0
          };
        }

        dailyMap[dateKey].totalTokens += log.totalTokens;
        dailyMap[dateKey].estimatedCostTRY += log.estimatedCostTRY;

        if (log.modelUsed.includes('lite')) {
          dailyMap[dateKey].liteModelTokens += log.totalTokens;
          dailyMap[dateKey].liteModelCalls += 1;
        } else {
          dailyMap[dateKey].coachModelTokens += log.totalTokens;
        }
      });
    }

    const dataList = Object.values(dailyMap);
    const totalActivity = dataList.reduce((acc, curr) => acc + curr.totalTokens, 0);

    if (totalActivity === 0) {
      const sampleMultipliers = [0.7, 0.9, 1.2, 0.8, 1.4, 1.1, 1.5, 0.9, 1.3, 1.0];
      return dataList.map((item, idx) => {
        const mult = sampleMultipliers[idx % sampleMultipliers.length];
        const liteTokens = Math.round(18000 * mult);
        const coachTokens = Math.round(22000 * mult);
        const liteCalls = Math.round(7 * mult);
        return {
          ...item,
          totalTokens: liteTokens + coachTokens,
          liteModelTokens: liteTokens,
          liteModelCalls: liteCalls,
          coachModelTokens: coachTokens,
          estimatedCostTRY: Number(((liteTokens * 0.000042) + (coachTokens * 0.00042)).toFixed(3))
        };
      });
    }

    return dataList;
  };

  const chartData = getDailyChartData();

  const CustomChartTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900/95 border border-indigo-500/40 p-3.5 rounded-2xl shadow-2xl backdrop-blur-md space-y-2 text-xs">
          <div className="font-bold text-white border-b border-slate-800 pb-1 flex items-center justify-between gap-4">
            <span>📅 {data.dateLabel} (Günlük AI Özeti)</span>
            <span className="text-emerald-400 font-extrabold">₺{data.estimatedCostTRY.toFixed(3)}</span>
          </div>
          <div className="space-y-1 font-medium">
            <div className="flex items-center justify-between gap-4 text-indigo-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-400" />
                <span>Toplam Jeton:</span>
              </span>
              <span className="font-bold font-mono">{data.totalTokens.toLocaleString('tr-TR')}</span>
            </div>
            <div className="flex items-center justify-between gap-4 text-emerald-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Gemini-2.5-Flash-Lite Jeton:</span>
              </span>
              <span className="font-bold font-mono">{data.liteModelTokens.toLocaleString('tr-TR')}</span>
            </div>
            <div className="flex items-center justify-between gap-4 text-amber-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>Flash-Lite Çağrı Yoğunluğu:</span>
              </span>
              <span className="font-bold font-mono">{data.liteModelCalls} İstek</span>
            </div>
            <div className="flex items-center justify-between gap-4 text-purple-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-400" />
                <span>YKS Koç Modeli (Gemini 3.6):</span>
              </span>
              <span className="font-bold font-mono">{data.coachModelTokens.toLocaleString('tr-TR')}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const filteredLogs = (stats?.recentLogs || []).filter(log => {
    if (filterCategory === 'ALL') return true;
    return log.category === filterCategory;
  });

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentLogs = filteredLogs.slice(indexOfFirstItem, indexOfLastItem);

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
              <p className="text-xs text-slate-300 mt-1 max-w-3xl">
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

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-5 shadow-xl relative overflow-hidden backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tahmini Toplam Maliyet</span>
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <Coins className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-emerald-400 tracking-tight">
              ₺{summary.totalCostTRY.toFixed(3)}
            </div>
            <div className="text-xs font-semibold text-slate-400 mt-1 flex items-center gap-1">
              <span>(${(summary.totalCostUSD).toFixed(4)} USD)</span>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-white/10 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Yapay Zeka Koçu:</span>
            <span className="font-bold text-indigo-300">₺{summary.aiCoachCostTRY.toFixed(3)}</span>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-indigo-500/30 rounded-2xl p-5 shadow-xl relative overflow-hidden backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Toplam AI Sorguları</span>
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <Zap className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-white tracking-tight">
              {summary.totalCalls} <span className="text-sm font-medium text-slate-400">İstek</span>
            </div>
            <div className="text-xs font-semibold text-slate-400 mt-1">
              {summary.aiCoachCalls} Koç / {summary.questionAnalysisCalls} Soru Analiz
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-white/10 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Soru Analizi Maliyeti:</span>
            <span className="font-bold text-fuchsia-300">₺{summary.questionAnalysisCostTRY.toFixed(3)}</span>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-purple-500/30 rounded-2xl p-5 shadow-xl relative overflow-hidden backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Harcanan Toplam Jeton</span>
            <div className="p-2 bg-purple-500/20 text-purple-400 rounded-xl border border-purple-500/30">
              <Cpu className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-purple-300 tracking-tight">
              {summary.totalTokens.toLocaleString('tr-TR')} <span className="text-sm font-medium text-slate-400">Tokens</span>
            </div>
            <div className="text-xs font-semibold text-slate-400 mt-1">
              {summary.promptTokens.toLocaleString('tr-TR')} Girdi / {summary.candidatesTokens.toLocaleString('tr-TR')} Çıktı
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-white/10 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Ortalama İstek Başına:</span>
            <span className="font-bold text-purple-300">
              {summary.totalCalls > 0 ? Math.round(summary.totalTokens / summary.totalCalls) : 0} Token
            </span>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-fuchsia-500/30 rounded-2xl p-5 shadow-xl relative overflow-hidden backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Aktif Model Yapılandırması</span>
            <div className="p-2 bg-fuchsia-500/20 text-fuchsia-400 rounded-xl border border-fuchsia-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium">YKS Koçluğu:</span>
              <span className="font-bold text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded border border-indigo-500/30">
                {modelSettings?.config?.['AI_COACH_STUDENT'] || 'gemini-3.1-flash-lite'}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium">Hata Defteri:</span>
              <span className="font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30">
                {modelSettings?.config?.['SOLVE_QUESTION'] || 'gemini-3.1-flash-lite'}
              </span>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-white/10 text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>Dinamik Özelleştirilebilir Altyapı</span>
          </div>
        </div>
      </div>

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
            <span>{showModelSelection ? 'Yapılandırma Seçeneklerini Kapat' : 'Model Seçimi Yapılandırma Seçeneklerini Düzenle'}</span>
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

      {/* YAPAY ZEKA KOÇU VERİ YAPILANDIRMASI PANELİ */}
      <div className="bg-slate-900/90 border border-indigo-500/40 rounded-3xl p-6 shadow-2xl backdrop-blur-md space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start space-x-3">
            <div className="p-3 bg-gradient-to-br from-indigo-600 to-fuchsia-600 text-white rounded-2xl shadow-lg shadow-indigo-500/20 border border-indigo-400/30 shrink-0 mt-0.5">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base flex flex-wrap items-center gap-2">
                <span>Yapay Zeka Koçunda Kullanılacak Veri İzinleri & Limit Seçimi</span>
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

            <button
              type="button"
              onClick={() => setIsCoachDataExpanded(!isCoachDataExpanded)}
              className="flex items-center space-x-2 px-4 py-2 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 hover:text-white font-bold text-xs rounded-xl border border-indigo-500/40 transition-all cursor-pointer shadow-md active:scale-95"
            >
              <span>{isCoachDataExpanded ? 'Seçenekleri Gizle' : 'Veri Seçeneklerini & Limitleri Yapılandır'}</span>
              {isCoachDataExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* AÇILAN DETAY SEÇENEKLERİ */}
        {isCoachDataExpanded && (
          <div className="pt-4 border-t border-slate-800/80 space-y-5 animate-fade-in">
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
                    <span>Veri İzinleri Yapılandırmasını Kaydet</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* RECHARTS CHART */}
      <div className="bg-slate-900/90 border border-indigo-500/30 rounded-3xl p-6 shadow-2xl backdrop-blur-md space-y-4 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-2xl shadow-lg shadow-indigo-500/20 border border-indigo-400/30">
              <BarChart2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <span>Günlük API Jeton Harcamaları & Model Kullanım Yoğunluğu</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                  Recharts Analizi
                </span>
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Günlük toplam token harcama trendi ve ekonomik soru analiz modellerinin kullanım sıklığı.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 shrink-0">
            <button
              onClick={() => setDateFilter('7days')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                dateFilter === '7days'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Son 7 Gün</span>
            </button>
            <button
              onClick={() => setDateFilter('thisMonth')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                dateFilter === 'thisMonth'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Bu Ay</span>
            </button>
            <button
              onClick={() => setDateFilter('allTime')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                dateFilter === 'allTime'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Tüm Zamanlar</span>
            </button>
          </div>
        </div>

        <div className="h-[320px] w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorTotalTokens" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0}/>
                </linearGradient>
                <linearGradient id="colorLiteTokens" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.5}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
              <XAxis dataKey="dateLabel" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis yAxisId="left" stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`} />
              <YAxis yAxisId="right" orientation="right" stroke="#f59e0b" fontSize={11} tickLine={false} tickFormatter={(val) => `${val} req`} />
              <Tooltip content={<CustomChartTooltip />} />
              <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />
              <Area yAxisId="left" type="monotone" dataKey="totalTokens" name="Toplam Jeton" stroke="#818cf8" strokeWidth={2.5} fillOpacity={1} fill="url(#colorTotalTokens)" />
              <Area yAxisId="left" type="monotone" dataKey="liteModelTokens" name="Flash-Lite Jeton" stroke="#34d399" strokeWidth={2.5} fillOpacity={1} fill="url(#colorLiteTokens)" />
              <Line yAxisId="right" type="monotone" dataKey="liteModelCalls" name="Sorgu Yoğunluğu" stroke="#fbbf24" strokeWidth={2.5} dot={{ r: 4, fill: "#fbbf24" }} activeDot={{ r: 7 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* TABLES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-5 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
            <div className="flex items-center space-x-2">
              <Cpu className="w-5 h-5 text-indigo-400" />
              <h3 className="font-bold text-white text-base">Kullanılan Gemini Modelleri</h3>
            </div>
            <span className="text-xs text-slate-400">Model bazlı birim maliyet analizi</span>
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
                      <span className="bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded font-bold">
                        {m.calls}
                      </span>
                    </td>
                    <td className="py-2.5 text-right font-mono">
                      {m.totalTokens.toLocaleString('tr-TR')}
                    </td>
                    <td className="py-2.5 text-right font-bold text-emerald-400">
                      ₺{m.costTRY.toFixed(4)}
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
            <span className="text-xs text-slate-400">Süreç bazında dağılım</span>
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
                      <span className="bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded font-bold">
                        {f.calls}
                      </span>
                    </td>
                    <td className="py-2.5 text-right font-mono">
                      {f.totalTokens.toLocaleString('tr-TR')}
                    </td>
                    <td className="py-2.5 text-right font-bold text-emerald-400">
                      ₺{f.costTRY.toFixed(4)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* LOGS TABLE */}
      <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-5 shadow-xl backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-white/10">
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-white text-base">Son Yapay Zeka İstek Günlüğü</h3>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setFilterCategory('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterCategory === 'ALL'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30'
                  : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              Tüm İstekler ({stats?.recentLogs.length || 0})
            </button>
            <button
              onClick={() => setFilterCategory('AI_COACH')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterCategory === 'AI_COACH'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30'
                  : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              Yapay Zeka Koçu
            </button>
            <button
              onClick={() => setFilterCategory('QUESTION_ANALYSIS')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterCategory === 'QUESTION_ANALYSIS'
                  ? 'bg-fuchsia-600 text-white shadow-md shadow-fuchsia-500/30'
                  : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              Soru Analizi & Hata Defteri
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="pb-2">Tarih / Saat</th>
                <th className="pb-2">Özellik / Süreç</th>
                <th className="pb-2">Kullanılan Model</th>
                <th className="pb-2 text-right">Girdi / Çıktı Token</th>
                <th className="pb-2 text-right">Toplam Token</th>
                <th className="pb-2 text-right">Tahmini Tutar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-medium">
              {currentLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 italic">
                    Henüz seçilen kategoride kaydedilmiş bir işlem bulunmuyor.
                  </td>
                </tr>
              ) : (
                currentLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-2.5 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString('tr-TR', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="py-2.5 font-semibold text-white">
                      {log.featureName}
                    </td>
                    <td className="py-2.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        log.modelUsed.includes('lite')
                          ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                          : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'
                      }`}>
                        {log.modelUsed}
                      </span>
                    </td>
                    <td className="py-2.5 text-right font-mono text-slate-400 text-[11px]">
                      {log.promptTokens} in / {log.candidatesTokens} out
                    </td>
                    <td className="py-2.5 text-right font-mono font-bold text-white">
                      {log.totalTokens.toLocaleString('tr-TR')}
                    </td>
                    <td className="py-2.5 text-right font-bold text-emerald-400">
                      ₺{log.estimatedCostTRY.toFixed(4)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-white/5 mt-4 text-xs gap-3">
            <span className="text-slate-400 text-center sm:text-left">
              Toplam <span className="font-bold text-white">{filteredLogs.length}</span> istekten <span className="font-bold text-white">{indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredLogs.length)}</span> arası gösteriliyor
            </span>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-slate-950 disabled:cursor-not-allowed font-semibold transition-all cursor-pointer"
              >
                Önceki
              </button>
              {Array.from({ length: totalPages }).map((_, i) => {
                const pageNum = i + 1;
                if (totalPages > 5 && Math.abs(currentPage - pageNum) > 1 && pageNum !== 1 && pageNum !== totalPages) {
                  if (pageNum === 2 || pageNum === totalPages - 1) {
                    return <span key={pageNum} className="text-slate-500 px-1 select-none">...</span>;
                  }
                  return null;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 rounded-lg font-bold transition-all text-xs cursor-pointer ${
                      currentPage === pageNum
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20 border border-indigo-500/30'
                        : 'bg-slate-950 border border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-slate-950 disabled:cursor-not-allowed font-semibold transition-all cursor-pointer"
              >
                Sonraki
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
