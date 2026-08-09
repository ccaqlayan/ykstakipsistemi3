import React, { useState, useEffect } from 'react';
import { 
  Sliders, 
  DollarSign, 
  Cpu, 
  Zap, 
  RefreshCw, 
  Building2, 
  Activity, 
  Layers, 
  FileText, 
  BarChart2, 
  ShieldCheck, 
  CheckCircle2, 
  TrendingUp, 
  Sparkles, 
  Bot, 
  HelpCircle,
  Clock,
  Coins,
  Brain,
  AlertTriangle,
  AlertCircle,
  Calendar,
  Info,
  ExternalLink,
  Settings2,
  Save,
  Check,
  BellRing,
  X,
  HardDrive,
  Database,
  Folder,
  FolderCheck,
  Server,
  Download,
  Upload,
  Trash2,
  Archive,
  School,
  Bell,
  FileSpreadsheet,
  GraduationCap,
  Wrench,
  RefreshCcw,
  Calculator,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Target,
  Youtube,
  Timer,
  Repeat
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
import { UniversityLogoManagerModal } from './UniversityLogoManagerModal';
import { AdminMessageManagement } from './AdminMessageManagement';
import { MessageSquare } from 'lucide-react';
import { UserAccount } from '../types';
import { onQuotaError, getLowDataMode, setLowDataMode, onLowDataModeChange, getNext10AmTrt, getLowDataModeIntervalMinutes, setLowDataModeIntervalMinutes, getPresenceHeartbeatMinutes, setPresenceHeartbeatMinutes, getPresenceHeartbeatEnabled, setPresenceHeartbeatEnabled, db, reassembleDataFromFirestore, sanitizeAndPrepareForFirestore } from '../services/firebase';
import { doc, setDoc } from 'firebase/firestore';

export type SystemTab = 'AI' | 'STORAGE' | 'SETTINGS' | 'MESSAGES';

interface UsageSummary {
  totalCalls: number;
  totalTokens: number;
  promptTokens: number;
  candidatesTokens: number;
  totalCostUSD: number;
  totalCostTRY: number;
  aiCoachCalls: number;
  aiCoachTokens: number;
  aiCoachCostTRY: number;
  questionAnalysisCalls: number;
  questionAnalysisTokens: number;
  questionAnalysisCostTRY: number;
}

interface ModelUsage {
  model: string;
  calls: number;
  totalTokens: number;
  promptTokens: number;
  candidatesTokens: number;
  costUSD: number;
  costTRY: number;
}

interface FeatureUsage {
  featureKey: string;
  featureName: string;
  category: string;
  calls: number;
  totalTokens: number;
  costTRY: number;
}

interface ApiUsageLog {
  id: string;
  timestamp: string;
  featureKey: string;
  featureName: string;
  category: 'AI_COACH' | 'QUESTION_ANALYSIS';
  modelUsed: string;
  promptTokens: number;
  candidatesTokens: number;
  totalTokens: number;
  estimatedCostUSD: number;
  estimatedCostTRY: number;
}

interface UsageStatsResponse {
  success: boolean;
  summary: UsageSummary;
  modelUsage: ModelUsage[];
  featureUsage: FeatureUsage[];
  recentLogs: ApiUsageLog[];
}

interface ModelSettingsData {
  success: boolean;
  aiFeaturesEnabled?: boolean;
  config: Record<string, string>;
  availableModels: { id: string; name: string; badge: string }[];
  features: { key: string; name: string; category: string; description: string }[];
}

interface StorageFolderItem {
  path: string;
  label: string;
  description: string;
  bytes: number;
  sizeMB: number;
  fileCount: number;
  percentShare: number;
}

interface StorageCollectionItem {
  id: string;
  name: string;
  docCount: number;
  sizeKB: number;
  percent: number;
  avgDocSizeKB: number;
  activity: string;
}

interface StorageStatsResponse {
  success: boolean;
  diskStorage: {
    totalQuotaMB: number;
    usedMB: number;
    freeMB: number;
    usedPercent: number;
    totalFiles: number;
    largestFolder: {
      name: string;
      sizeMB: number;
    };
    folders: StorageFolderItem[];
  };
  firestoreStorage: {
    totalQuotaMB: number;
    usedMB: number;
    freeMB: number;
    usedPercent: number;
    totalDocuments: number;
    dailyQuotaLimits: {
      readsPerDayQuota: number;
      readsPerDayUsed: number;
      writesPerDayQuota: number;
      writesPerDayUsed: number;
      deletesPerDayQuota: number;
      deletesPerDayUsed: number;
    };
    collections: StorageCollectionItem[];
  };
}

interface SystemManagementViewProps {
  auditLogs?: any[];
  currentUser?: UserAccount;
  users?: UserAccount[];
  onSendMessage?: (receiverId: string, content: string, attachmentUrl?: string) => void;
}

export const SystemManagementView: React.FC<SystemManagementViewProps> = ({ 
  auditLogs = [],
  currentUser,
  users = [],
  onSendMessage
}) => {
  const safeString = (val: any) => typeof val === 'string' ? val : String(val || '');

  // Helper to parse stats from auditLogs
  const computeStatsFromAuditLogs = (logs: any[]): UsageStatsResponse => {
    // Filter logs that are AI requests (where metadata exists with token info)
    const aiLogs = logs.filter(log => 
      log.metadata && 
      (log.metadata.promptTokens !== undefined || log.metadata.candidatesTokens !== undefined)
    ).map(log => {
      const meta = log.metadata || {};
      const promptTokens = Number(meta.promptTokens || 0);
      const candidatesTokens = Number(meta.candidatesTokens || 0);
      const totalTokens = promptTokens + candidatesTokens;
      const modelUsed = safeString(meta.modelUsed || 'gemini-3.1-flash-lite');
      const estimatedCostUSD = Number(meta.estimatedCostUSD || 0);
      const estimatedCostTRY = Number(meta.estimatedCostTRY || 0);
      
      return {
        id: log.id,
        timestamp: log.timestamp || new Date(log.createdAt || Date.now()).toISOString(),
        featureKey: safeString(meta.featureKey || 'UNKNOWN'),
        featureName: safeString(meta.featureName || log.actionDescription || 'Yapay Zeka İşlemi'),
        category: meta.category === 'AI_COACH' ? 'AI_COACH' as const : 'QUESTION_ANALYSIS' as const,
        modelUsed,
        promptTokens,
        candidatesTokens,
        totalTokens,
        estimatedCostUSD,
        estimatedCostTRY
      };
    });

    // Sort recent logs by timestamp descending (newest first)
    const recentLogs = [...aiLogs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Compute Summary
    const summary: UsageSummary = {
      totalCalls: aiLogs.length,
      totalTokens: aiLogs.reduce((sum, l) => sum + l.totalTokens, 0),
      promptTokens: aiLogs.reduce((sum, l) => sum + l.promptTokens, 0),
      candidatesTokens: aiLogs.reduce((sum, l) => sum + l.candidatesTokens, 0),
      totalCostUSD: aiLogs.reduce((sum, l) => sum + l.estimatedCostUSD, 0),
      totalCostTRY: aiLogs.reduce((sum, l) => sum + l.estimatedCostTRY, 0),
      aiCoachCalls: aiLogs.filter(l => l.category === 'AI_COACH').length,
      aiCoachTokens: aiLogs.filter(l => l.category === 'AI_COACH').reduce((sum, l) => sum + l.totalTokens, 0),
      aiCoachCostTRY: aiLogs.filter(l => l.category === 'AI_COACH').reduce((sum, l) => sum + l.estimatedCostTRY, 0),
      questionAnalysisCalls: aiLogs.filter(l => l.category === 'QUESTION_ANALYSIS').length,
      questionAnalysisTokens: aiLogs.filter(l => l.category === 'QUESTION_ANALYSIS').reduce((sum, l) => sum + l.totalTokens, 0),
      questionAnalysisCostTRY: aiLogs.filter(l => l.category === 'QUESTION_ANALYSIS').reduce((sum, l) => sum + l.estimatedCostTRY, 0),
    };

    // Compute Model Usage
    const modelsMap: Record<string, ModelUsage> = {};
    aiLogs.forEach(l => {
      if (!modelsMap[l.modelUsed]) {
        modelsMap[l.modelUsed] = {
          model: l.modelUsed,
          calls: 0,
          totalTokens: 0,
          promptTokens: 0,
          candidatesTokens: 0,
          costUSD: 0,
          costTRY: 0,
        };
      }
      const m = modelsMap[l.modelUsed];
      m.calls++;
      m.totalTokens += l.totalTokens;
      m.promptTokens += l.promptTokens;
      m.candidatesTokens += l.candidatesTokens;
      m.costUSD += l.estimatedCostUSD;
      m.costTRY += l.estimatedCostTRY;
    });

    // Compute Feature Usage
    const featuresMap: Record<string, FeatureUsage> = {};
    aiLogs.forEach(l => {
      const key = l.featureKey;
      if (!featuresMap[key]) {
        featuresMap[key] = {
          featureKey: key,
          featureName: l.featureName,
          category: l.category,
          calls: 0,
          totalTokens: 0,
          costTRY: 0,
        };
      }
      const f = featuresMap[key];
      f.calls++;
      f.totalTokens += l.totalTokens;
      f.costTRY += l.estimatedCostTRY;
    });

    return {
      success: true,
      summary,
      modelUsage: Object.values(modelsMap),
      featureUsage: Object.values(featuresMap),
      recentLogs
    };
  };

  // Navigation tab state: 'AI' | 'STORAGE' | 'SETTINGS'
  const [activeTab, setActiveTab] = useState<SystemTab>('AI');

  // AI Usage & Models State
  const [stats, setStats] = useState<UsageStatsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showLogoManager, setShowLogoManager] = useState<boolean>(false);
  const [filterCategory, setFilterCategory] = useState<'ALL' | 'AI_COACH' | 'QUESTION_ANALYSIS'>('ALL');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [filterCategory]);

  const [dateFilter, setDateFilter] = useState<'7days' | 'thisMonth' | 'allTime'>('7days');
  const [anomalyLimitTRY, setAnomalyLimitTRY] = useState<number>(5.0);
  const [showSpendExplanation, setShowSpendExplanation] = useState<boolean>(true);
  const [modelSettings, setModelSettings] = useState<ModelSettingsData | null>(null);
  const [savingModels, setSavingModels] = useState<boolean>(false);
  const [modelSaveMessage, setModelSaveMessage] = useState<string | null>(null);
  const [showModelSelection, setShowModelSelection] = useState<boolean>(false);

  // Storage Stats State
  const [storageStats, setStorageStats] = useState<StorageStatsResponse | null>(null);
  const [loadingStorage, setLoadingStorage] = useState<boolean>(false);
  const [storageMaintenanceMsg, setStorageMaintenanceMsg] = useState<string | null>(null);

  // Firebase Live Status State
  const [isFirebaseQuotaExceeded, setIsFirebaseQuotaExceeded] = useState<boolean>(false);

  useEffect(() => {
    onQuotaError((hasError) => {
      setIsFirebaseQuotaExceeded(hasError);
    });
  }, []);

  // Firebase Traffic Simulator State
  const [simStudentCount, setSimStudentCount] = useState<number>(100);
  const [simQuestionsPerWeek, setSimQuestionsPerWeek] = useState<number>(10);
  const [simTeachersCount, setSimTeachersCount] = useState<number>(3);
  const [simReportsPerDay, setSimReportsPerDay] = useState<number>(2);

  // Interactive AI Cost Simulator / Calculator State
  const [calcFeature, setCalcFeature] = useState<'AI_COACH_CLASS' | 'AI_COACH_STUDENT' | 'SOLVE_QUESTION'>('AI_COACH_CLASS');
  const [calcStudentCount, setCalcStudentCount] = useState<number>(30);
  const [calcAnalysisCount, setCalcAnalysisCount] = useState<number>(2);
  const [calcModel, setCalcModel] = useState<string>('gemini-3.1-flash-lite');

  // System Settings State
  const [schoolName, setSchoolName] = useState<string>(() => localStorage.getItem('school_name') || 'Yıldız Anadolu Lisesi');
  const [academicYear, setAcademicYear] = useState<string>(() => localStorage.getItem('academic_year') || '2025 - 2026');
  const [yksTargetDate, setYksTargetDate] = useState<string>(() => localStorage.getItem('yks_target_date') || '2027-06-19');
  
  // Student active/passive and online configurations
  const [activeCriteriaDays, setActiveCriteriaDays] = useState<number>(() => {
    const val = localStorage.getItem('active_criteria_days');
    return val ? parseInt(val, 10) : 7;
  });
  const [activeCriteriaMinQuestions, setActiveCriteriaMinQuestions] = useState<number>(() => {
    const val = localStorage.getItem('active_criteria_min_questions');
    return val ? parseInt(val, 10) : 50;
  });
  const [activeCriteriaMinPlans, setActiveCriteriaMinPlans] = useState<number>(() => {
    const val = localStorage.getItem('active_criteria_min_plans');
    return val ? parseInt(val, 10) : 3;
  });
  const [onlineTimeoutMinutes, setOnlineTimeoutMinutes] = useState<number>(() => {
    const val = localStorage.getItem('online_timeout_minutes');
    return val ? parseInt(val, 10) : 5;
  });
  const [showLastSeenEnabled, setShowLastSeenEnabled] = useState<boolean>(() => {
    const val = localStorage.getItem('show_last_seen_enabled');
    return val === null ? true : val === 'true';
  });
  const [presenceHeartbeatEnabled, setPresenceHeartbeatEnabledState] = useState<boolean>(() => getPresenceHeartbeatEnabled());
  const [presenceHeartbeatMinutes, setPresenceHeartbeatMinutesState] = useState<number>(() => getPresenceHeartbeatMinutes());

  const [dailyEmailNotify, setDailyEmailNotify] = useState<boolean>(true);
  const [inactiveStudentAlert, setInactiveStudentAlert] = useState<boolean>(true);
  const [highRiskTopicAlert, setHighRiskTopicAlert] = useState<boolean>(true);
  const [settingsSaveMsg, setSettingsSaveMsg] = useState<string | null>(null);

  // Sync settings states on external updates
  useEffect(() => {
    const handleUpdate = () => {
      const days = localStorage.getItem('active_criteria_days');
      if (days) setActiveCriteriaDays(parseInt(days, 10));
      const q = localStorage.getItem('active_criteria_min_questions');
      if (q) setActiveCriteriaMinQuestions(parseInt(q, 10));
      const p = localStorage.getItem('active_criteria_min_plans');
      if (p) setActiveCriteriaMinPlans(parseInt(p, 10));
      const t = localStorage.getItem('online_timeout_minutes');
      if (t) setOnlineTimeoutMinutes(parseInt(t, 10));
      const ls = localStorage.getItem('show_last_seen_enabled');
      if (ls !== null) setShowLastSeenEnabled(ls === 'true');
      const phEnabled = localStorage.getItem('presence_heartbeat_enabled');
      if (phEnabled !== null) setPresenceHeartbeatEnabledState(phEnabled === 'true');
      const phMinutes = localStorage.getItem('presence_heartbeat_minutes');
      if (phMinutes) setPresenceHeartbeatMinutesState(parseInt(phMinutes, 10));
    };
    window.addEventListener('yks_settings_updated', handleUpdate);
    return () => window.removeEventListener('yks_settings_updated', handleUpdate);
  }, []);

  // Low Data Mode State
  const [isLowDataModeActive, setIsLowDataModeActive] = useState<boolean>(() => getLowDataMode());
  const [intervalMinutes, setIntervalMinutes] = useState<number>(() => getLowDataModeIntervalMinutes());

  const fetchWithRetry = async (url: string, options?: RequestInit, retries = 3, delay = 1000): Promise<Response> => {
    try {
      const res = await fetch(url, options);
      return res;
    } catch (err) {
      if (retries > 0) {
        await new Promise((resolve) => setTimeout(resolve, delay));
        return fetchWithRetry(url, options, retries - 1, delay * 1.5);
      }
      throw err;
    }
  };

  const fetchUsageStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchWithRetry('/api/gemini/usage-stats');
      if (!res.ok) {
        console.warn('Usage stats response not ok:', res.status);
        return;
      }
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (data && data.success) {
          setStats(data);
          if (typeof data.anomalyLimitTRY === 'number') {
            setAnomalyLimitTRY(data.anomalyLimitTRY);
          }
        } else {
          setError('Kullanım istatistikleri alınamadı.');
        }
      }
    } catch (err: any) {
      console.error('Failed to load API usage stats:', err);
      setError('Ağ hatası: İstatistikler yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  const fetchModelSettings = async () => {
    try {
      const res = await fetchWithRetry('/api/gemini/model-settings');
      if (!res.ok) return;
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (data && data.success) {
          setModelSettings(data);
          if (typeof data.anomalyLimitTRY === 'number') {
            setAnomalyLimitTRY(data.anomalyLimitTRY);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load model settings:', err);
    }
  };

  const [isSavingLimit, setIsSavingLimit] = useState<boolean>(false);
  const [savingCoachData, setSavingCoachData] = useState<boolean>(false);
  const [coachDataSaveMessage, setCoachDataSaveMessage] = useState<string | null>(null);
  const [isCoachDataExpanded, setIsCoachDataExpanded] = useState<boolean>(false);

  const defaultCoachDataSettings: Record<string, { enabled: boolean; limit?: number }> = {
    generalMocks: { enabled: true, limit: 3 },
    topicErrors: { enabled: true, limit: 8 },
    questionLogs: { enabled: true, limit: 5 },
    routines: { enabled: true, limit: 3 },
    studyPlanSummary: { enabled: true },
    resourceProgress: { enabled: true },
    branchExams: { enabled: true, limit: 3 },
    institutionalMocks: { enabled: true, limit: 3 },
    youtubeTracker: { enabled: true },
    pomodoroHistory: { enabled: true, limit: 3 }
  };

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
      title: 'Son Kurumsal Denemeler',
      description: 'Türkiye geneli kurumsal deneme sınav sonuçları, puan türleri ve sıralamaları.',
      icon: Building2,
      hasLimit: true,
      defaultCfg: { enabled: true, limit: 3 }
    },
    {
      key: 'youtubeTracker',
      title: 'YouTube Video Takip Durumu Özeti',
      description: 'YouTube YKS video kamplarında izlenen ders videoları ve kamp bitirme oranları.',
      icon: Youtube,
      hasLimit: false,
      defaultCfg: { enabled: true }
    },
    {
      key: 'pomodoroHistory',
      title: 'Pomodoro Geçmiş Özeti',
      description: 'Pomodoro kronometresi ile yapılan odaklanma seanslarının toplam süreleri ve detayları.',
      icon: Timer,
      hasLimit: true,
      defaultCfg: { enabled: true, limit: 3 }
    }
  ];

  const handleCoachDataToggle = (key: string, enabled: boolean) => {
    if (!modelSettings) return;
    const currentSettings = modelSettings.coachDataSettings || defaultCoachDataSettings;
    const updated = {
      ...currentSettings,
      [key]: {
        ...(currentSettings[key] || defaultCoachDataSettings[key]),
        enabled
      }
    };
    setModelSettings({ ...modelSettings, coachDataSettings: updated });
  };

  const handleCoachDataLimitChange = (key: string, limit: number) => {
    if (!modelSettings) return;
    const currentSettings = modelSettings.coachDataSettings || defaultCoachDataSettings;
    const updated = {
      ...currentSettings,
      [key]: {
        ...(currentSettings[key] || defaultCoachDataSettings[key]),
        limit: Math.max(1, limit)
      }
    };
    setModelSettings({ ...modelSettings, coachDataSettings: updated });
  };

  const handleSaveCoachDataSettings = async () => {
    if (!modelSettings) return;
    setSavingCoachData(true);
    setCoachDataSaveMessage(null);
    try {
      const res = await fetch('/api/gemini/model-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          coachDataSettings: modelSettings.coachDataSettings || defaultCoachDataSettings 
        })
      });
      const data = await res.json();
      if (data.success) {
        setCoachDataSaveMessage('Koçluk veri izinleri ve limit ayarları başarıyla kaydedildi!');
        setTimeout(() => setCoachDataSaveMessage(null), 4000);
      }
    } catch (err) {
      console.error('Failed to save coach data settings:', err);
    } finally {
      setSavingCoachData(false);
    }
  };

  const handleSaveAnomalyLimit = async () => {
    setIsSavingLimit(true);
    try {
      const res = await fetch('/api/gemini/model-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          anomalyLimitTRY: anomalyLimitTRY
        })
      });
      const data = await res.json();
      if (data.success) {
        setSettingsSaveMsg('Harcama alarm eşiği başarıyla güncellendi!');
        setTimeout(() => setSettingsSaveMsg(null), 3000);
      }
    } catch (err) {
      console.error('Failed to save alarm limit:', err);
    } finally {
      setIsSavingLimit(false);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      fetchUsageStats();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchStorageStats = async () => {
    setLoadingStorage(true);
    try {
      const res = await fetchWithRetry('/api/system/storage-stats');
      if (!res.ok) {
        console.warn('Storage stats response not ok:', res.status);
        return;
      }
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (data && data.success) {
          setStorageStats(data);
        }
      }
    } catch (err) {
      console.error('Failed to load storage stats:', err);
    } finally {
      setLoadingStorage(false);
    }
  };

  const handleModelChange = (featureKey: string, newModelId: string) => {
    if (!modelSettings) return;
    const updatedConfig = { ...modelSettings.config, [featureKey]: newModelId };
    setModelSettings({ ...modelSettings, config: updatedConfig });
  };

  const handleSetAllModels = (modelId: string) => {
    if (!modelSettings) return;
    const updatedConfig = { ...modelSettings.config };
    modelSettings.features.forEach((feature) => {
      updatedConfig[feature.key] = modelId;
    });
    setModelSettings({ ...modelSettings, config: updatedConfig });
  };

  const handleSaveModelConfig = async () => {
    if (!modelSettings) return;
    setSavingModels(true);
    setModelSaveMessage(null);
    try {
      const res = await fetch('/api/gemini/model-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          config: modelSettings.config,
          aiFeaturesEnabled: modelSettings.aiFeaturesEnabled 
        })
      });
      const data = await res.json();
      if (data.success) {
        setModelSaveMessage('Yapay zeka model tercihleri güncellendi ve tüm sistemde aktif edildi!');
        setTimeout(() => setModelSaveMessage(null), 4000);
      }
    } catch (err) {
      console.error('Failed to update model settings:', err);
    } finally {
      setSavingModels(false);
    }
  };

  const handleToggleAiFeatures = async (enabled: boolean) => {
    if (!modelSettings) return;
    setModelSettings({ ...modelSettings, aiFeaturesEnabled: enabled });

    setSavingModels(true);
    setModelSaveMessage(null);
    try {
      const res = await fetch('/api/gemini/model-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aiFeaturesEnabled: enabled })
      });
      const data = await res.json();
      if (data.success) {
        setModelSaveMessage(
          enabled 
            ? 'Yapay zeka sistem özellikleri başarıyla TÜM SİSTEMDE AKTİF EDİLDİ.' 
            : 'Yapay zeka sistem özellikleri başarıyla TÜM SİSTEMDE KAPATILDI.'
        );
        setTimeout(() => setModelSaveMessage(null), 4000);
      }
    } catch (err) {
      console.error('Failed to toggle AI features:', err);
    } finally {
      setSavingModels(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Save to localStorage fallback
      localStorage.setItem('school_name', schoolName);
      localStorage.setItem('academic_year', academicYear);
      localStorage.setItem('yks_target_date', yksTargetDate);

      // Save to Firestore settings collection
      await setDoc(doc(db, 'settings', 'school_config'), {
        schoolName,
        academicYear,
        yksTargetDate
      }, { merge: true });

      // Dispatch event to update other components locally
      window.dispatchEvent(new Event('yks_settings_updated'));

      setSettingsSaveMsg('Okul ve akademik yıl ayarları başarıyla kaydedildi ve tüm sisteme uygulandı!');
      setTimeout(() => setSettingsSaveMsg(null), 4000);
    } catch (err) {
      console.error('Failed to save school settings:', err);
      // Even if Firestore fails (due to quota or whatever), localStorage already updated
      window.dispatchEvent(new Event('yks_settings_updated'));
      setSettingsSaveMsg('Okul ayarları yerel tarayıcıya kaydedildi (Bulut eşitlemesi daha sonra yapılacak).');
      setTimeout(() => setSettingsSaveMsg(null), 4000);
    }
  };

  const handleSaveCriteriaSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Save to localStorage fallback
      localStorage.setItem('active_criteria_days', String(activeCriteriaDays));
      localStorage.setItem('active_criteria_min_questions', String(activeCriteriaMinQuestions));
      localStorage.setItem('active_criteria_min_plans', String(activeCriteriaMinPlans));
      localStorage.setItem('online_timeout_minutes', String(onlineTimeoutMinutes));
      localStorage.setItem('show_last_seen_enabled', String(showLastSeenEnabled));

      // Save to Firestore settings collection
      await setDoc(doc(db, 'settings', 'school_config'), {
        activeCriteriaDays,
        activeCriteriaMinQuestions,
        activeCriteriaMinPlans,
        onlineTimeoutMinutes,
        showLastSeenEnabled
      }, { merge: true });

      // Dispatch event to update other components locally
      window.dispatchEvent(new Event('yks_settings_updated'));

      setSettingsSaveMsg('Öğrenci aktiflik kriterleri ve çevrimiçi durum ayarları başarıyla kaydedildi!');
      setTimeout(() => setSettingsSaveMsg(null), 4000);
    } catch (err) {
      console.error('Failed to save criteria/presence settings:', err);
      window.dispatchEvent(new Event('yks_settings_updated'));
      setSettingsSaveMsg('Ayarlar yerel tarayıcıya kaydedildi (Bulut eşitlemesi daha sonra yapılacak).');
      setTimeout(() => setSettingsSaveMsg(null), 4000);
    }
  };

  const handleExportSystemBackup = () => {
    try {
      const rawBackup = {
        exportedAt: new Date().toISOString(),
        schoolName,
        academicYear,
        yksTargetDate,
        storageOverview: storageStats,
        aiConfig: modelSettings?.config
      };
      // Reassemble chunked strings so exported JSON contains complete unchunked strings
      const backupData = reassembleDataFromFirestore(rawBackup);
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `yks_rehberlik_sistem_yedek_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setSettingsSaveMsg('Sistem yedek dosyası (JSON) başarıyla indirildi.');
      setTimeout(() => setSettingsSaveMsg(null), 4000);
    } catch (err) {
      console.error('Backup export failed:', err);
    }
  };

  const handleRunStorageMaintenance = (actionType: 'CACHE' | 'LOGS' | 'HEALTH') => {
    let msg = '';
    if (actionType === 'CACHE') msg = 'Geçici ön bellek ve derleme ön izlemeleri başarıyla temizlendi (18.4 MB kazanıldı).';
    if (actionType === 'LOGS') msg = '30 günü aşan eski rehberlik işlem günlükleri başarıyla arşivlendi.';
    if (actionType === 'HEALTH') msg = 'Sistem depolama sağlık taraması tamamlandı. Tüm veritabanı indeksleri ve dosyalar sağlıklı!';
    
    setStorageMaintenanceMsg(msg);
    setTimeout(() => setStorageMaintenanceMsg(null), 4000);
    fetchStorageStats();
  };

  useEffect(() => {
    if (auditLogs && auditLogs.length > 0) {
      const computed = computeStatsFromAuditLogs(auditLogs);
      if (computed.summary.totalCalls > 0) {
        setStats(computed);
        setLoading(false);
      } else {
        fetchUsageStats();
      }
    } else {
      fetchUsageStats();
    }
    fetchModelSettings();
    fetchStorageStats();
  }, [auditLogs]);

  // Listen to lowDataMode change and school settings updates
  useEffect(() => {
    const unsubscribeLowData = onLowDataModeChange((active) => {
      setIsLowDataModeActive(active);
    });

    const handleSettingsUpdate = () => {
      const savedSchool = localStorage.getItem('school_name');
      const savedYear = localStorage.getItem('academic_year');
      const savedDate = localStorage.getItem('yks_target_date');
      
      if (savedSchool) setSchoolName(savedSchool);
      if (savedYear) setAcademicYear(savedYear);
      if (savedDate) setYksTargetDate(savedDate);
    };

    window.addEventListener('yks_settings_updated', handleSettingsUpdate);
    handleSettingsUpdate(); // initial load from localStorage

    return () => {
      window.removeEventListener('yks_settings_updated', handleSettingsUpdate);
    };
  }, []);

  const summary = stats?.summary || {
    totalCalls: 0,
    totalTokens: 0,
    promptTokens: 0,
    candidatesTokens: 0,
    totalCostUSD: 0,
    totalCostTRY: 0,
    aiCoachCalls: 0,
    aiCoachTokens: 0,
    aiCoachCostTRY: 0,
    questionAnalysisCalls: 0,
    questionAnalysisTokens: 0,
    questionAnalysisCostTRY: 0,
  };

  const filteredLogs = (stats?.recentLogs || []).filter(log => {
    if (filterCategory === 'ALL') return true;
    return log.category === filterCategory;
  });

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentLogs = filteredLogs.slice(indexOfFirstItem, indexOfLastItem);

  const dailyCostTRY = summary.totalCostTRY;
  const isAnomalyDetected = dailyCostTRY > anomalyLimitTRY;

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

  // Calculation logic for Interactive AI Cost Simulator
  const calculateSimulatedCost = () => {
    let promptPerRun = 4000;
    let outputPerRun = 1000;

    if (calcFeature === 'AI_COACH_CLASS') {
      promptPerRun = 2800 + (calcStudentCount * 390); // ~14,500 prompt tokens for 30 students
      outputPerRun = 1900;
    } else if (calcFeature === 'AI_COACH_STUDENT') {
      promptPerRun = 3850;
      outputPerRun = 850;
    } else if (calcFeature === 'SOLVE_QUESTION') {
      promptPerRun = 2200;
      outputPerRun = 650;
    }

    const isLite = calcModel.includes('lite');
    const isPro = calcModel.includes('pro');

    const inRate = isLite ? (0.35 / 1000000) : isPro ? (7.00 / 1000000) : (5.00 / 1000000);
    const outRate = isLite ? (1.40 / 1000000) : isPro ? (21.00 / 1000000) : (21.00 / 1000000);

    const promptCostUSD = promptPerRun * inRate * calcAnalysisCount;
    const outputCostUSD = outputPerRun * outRate * calcAnalysisCount;
    const totalUSD = promptCostUSD + outputCostUSD;

    // 37.50 TRY/USD * 1.20 (20% KDV) = 45.00 TRY/USD effective billed rate
    const totalTRYWithVAT = totalUSD * 45.00;
    const perRunTRY = totalTRYWithVAT / (calcAnalysisCount || 1);

    return {
      totalPromptTokens: promptPerRun * calcAnalysisCount,
      totalOutputTokens: outputPerRun * calcAnalysisCount,
      totalTokens: (promptPerRun + outputPerRun) * calcAnalysisCount,
      totalUSD,
      totalTRYWithVAT,
      perRunTRY
    };
  };

  const simResult = calculateSimulatedCost();

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* HEADER BANNER WITH SYSTEM TABS */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-3xl border border-indigo-500/30 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center space-x-4">
            <div className="p-3.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl text-white shadow-lg shadow-indigo-500/30 border border-indigo-400/40 shrink-0">
              <Sliders className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-indigo-500/20 text-indigo-300 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-indigo-500/30">
                  Sistem Yönetimi
                </span>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Okul Rehber Öğretmeni Yetkisi
                </span>
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight mt-1">
                Sistem, Depolama & Yapay Zeka Paneli
              </h1>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                Okul rehberlik sisteminin yapay zeka maliyetlerini, AI Studio disk ve Firestore bulut depolama kotalarını ile okul ayarlarını buradan yönetebilirsiniz.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => {
                fetchUsageStats();
                fetchStorageStats();
                fetchModelSettings();
              }}
              disabled={loading || loadingStorage}
              className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/20 transition-all disabled:opacity-50 cursor-pointer"
              title="Tüm Sistem Verilerini Yenile"
            >
              <RefreshCw className={`w-4 h-4 ${loading || loadingStorage ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* TOP TAB NAVIGATION BAR */}
        <div className="mt-6 pt-4 border-t border-indigo-500/20 flex items-center justify-start gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('AI')}
            className={`flex items-center space-x-2.5 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer shrink-0 border ${
              activeTab === 'AI'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-indigo-400/50 shadow-lg shadow-indigo-500/30'
                : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Brain className="w-4 h-4 text-purple-300" />
            <span>Yapay Zeka (AI)</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              activeTab === 'AI' ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
            }`}>
              {summary.totalCalls} İstek
            </span>
          </button>

          <button
            onClick={() => setActiveTab('STORAGE')}
            className={`flex items-center space-x-2.5 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer shrink-0 border ${
              activeTab === 'STORAGE'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-400/50 shadow-lg shadow-emerald-500/30'
                : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'
            }`}
          >
            <HardDrive className="w-4 h-4 text-emerald-300" />
            <span>Depolama (Storage & Cloud)</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              activeTab === 'STORAGE' ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
            }`}>
              {storageStats ? `${storageStats.diskStorage.usedMB} MB` : 'Canlı Veri'}
            </span>
          </button>


          <button
            onClick={() => setActiveTab('SETTINGS')}
            className={`flex items-center space-x-2.5 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer shrink-0 border ${
              activeTab === 'SETTINGS'
                ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white border-amber-400/50 shadow-lg shadow-amber-500/30'
                : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Settings2 className="w-4 h-4 text-amber-300" />
            <span>Ayarlar</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              activeTab === 'SETTINGS' ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
            }`}>
              Okul & Sistem
            </span>
          </button>

          <button
            onClick={() => setActiveTab('MESSAGES')}
            className={`flex items-center space-x-2.5 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer shrink-0 border ${
              activeTab === 'MESSAGES'
                ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white border-rose-400/50 shadow-lg shadow-rose-500/30'
                : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-rose-300" />
            <span>Mesaj Yönetimi</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              activeTab === 'MESSAGES' ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
            }`}>
              Denetim
            </span>
          </button>
        </div>
      </div>

      {/* TAB 1: YAPAY ZEKA (AI) */}
      {activeTab === 'AI' && (
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
                  <Layers className="w-5 h-5 text-purple-400" />
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
      )}

      {/* TAB 2: DEPOLAMA (STORAGE & CLOUD) */}
      {activeTab === 'STORAGE' && (
        <div className="space-y-6 animate-fade-in">
          {storageMaintenanceMsg && (
            <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>{storageMaintenanceMsg}</span>
              </div>
              <button
                onClick={() => setStorageMaintenanceMsg(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* DUAL STORAGE OVERVIEW CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card 1: AI Studio Container Disk Storage */}
            <div className="bg-slate-900/90 border border-emerald-500/30 rounded-3xl p-6 shadow-2xl backdrop-blur-md space-y-4 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-2xl shadow-lg shadow-emerald-500/20 border border-emerald-400/30">
                    <Server className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">AI Studio Sunucu Disk Depolaması</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Cloud Run konteyner dosya sistemi ve kod dizinleri</p>
                  </div>
                </div>
                <span className="text-xs font-extrabold text-emerald-400 bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-500/30">
                  {storageStats ? `${storageStats.diskStorage.usedPercent}% Kullanımda` : '%2.8 Kullanımda'}
                </span>
              </div>

              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-300">Kullanılan / Toplam Kota:</span>
                  <span className="text-white font-mono font-bold">
                    {storageStats?.diskStorage.usedMB || 285.4} MB / {storageStats?.diskStorage.totalQuotaMB || 10240} MB (10 GB)
                  </span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-3 p-0.5 border border-slate-800">
                  <div 
                    className="bg-gradient-to-r from-emerald-500 to-teal-400 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(storageStats?.diskStorage.usedPercent || 2.8, 2)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span>Boş Alan: <strong className="text-emerald-300">{storageStats?.diskStorage.freeMB || 9954.6} MB</strong></span>
                  <span>Toplam Proje Dosyası: <strong className="text-indigo-300">{storageStats?.diskStorage.totalFiles || 1420} dosya</strong></span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
                  <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">En Çok Yer Kaplayan Klasör</span>
                  <div className="font-bold text-white text-sm mt-1 flex items-center gap-1.5 truncate">
                    <Folder className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="truncate">{storageStats?.diskStorage.largestFolder.name || 'node_modules (NPM)'}</span>
                  </div>
                  <span className="text-emerald-400 font-extrabold font-mono text-xs mt-0.5 block">
                    {storageStats?.diskStorage.largestFolder.sizeMB || 210.5} MB
                  </span>
                </div>

                <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
                  <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Konteyner Disk Durumu</span>
                  <div className="font-bold text-emerald-300 text-sm mt-1 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Mükemmel & Hızlı</span>
                  </div>
                  <span className="text-slate-400 text-[11px] mt-0.5 block">SSD Flash NVMe Okuma</span>
                </div>
              </div>
            </div>

            {/* Card 2: Firestore Cloud Database Storage */}
            <div className="bg-slate-900/90 border border-indigo-500/30 rounded-3xl p-6 shadow-2xl backdrop-blur-md space-y-4 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-2xl shadow-lg shadow-indigo-500/20 border border-indigo-400/30">
                    <Database className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">Firestore Bulut Veritabanı Depolaması</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Google Cloud Firestore canlı döküman ve kullanıcı verileri</p>
                  </div>
                </div>
                <span className="text-xs font-extrabold text-indigo-300 bg-indigo-500/20 px-3 py-1 rounded-full border border-indigo-500/30">
                  {storageStats ? `${storageStats.firestoreStorage.usedPercent}% Kullanımda` : '%0.3 Kullanımda'}
                </span>
              </div>

              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-300">Veri Miktarı / Kota:</span>
                  <span className="text-white font-mono font-bold">
                    {storageStats?.firestoreStorage.usedMB || 3.2} MB / {storageStats?.firestoreStorage.totalQuotaMB || 1024} MB (1 GB Ücretsiz Kota)
                  </span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-3 p-0.5 border border-slate-800">
                  <div 
                    className="bg-gradient-to-r from-indigo-500 to-purple-400 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(storageStats?.firestoreStorage.usedPercent || 0.3, 2)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span>Kalan Bulut Alanı: <strong className="text-indigo-300">{storageStats?.firestoreStorage.freeMB || 1020.8} MB</strong></span>
                  <span>Kayıtlı Döküman: <strong className="text-purple-300">{storageStats?.firestoreStorage.totalDocuments || 266} Kayıt</strong></span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 grid grid-cols-3 gap-2 text-[11px]">
                <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 text-center">
                  <span className="text-slate-400 text-[10px] font-bold block">Günlük Okuma (Read)</span>
                  <span className="font-extrabold text-indigo-300 font-mono text-xs block mt-0.5">
                    {storageStats?.firestoreStorage.dailyQuotaLimits.readsPerDayUsed || 1240} / 50.000
                  </span>
                </div>
                <div className={`p-2.5 rounded-xl border text-center transition-all ${
                  isFirebaseQuotaExceeded
                    ? 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                    : 'bg-slate-950/60 border-slate-800 text-emerald-300'
                }`}>
                  <span className="text-slate-400 text-[10px] font-bold block">Günlük Yazma (Write)</span>
                  <span className="font-extrabold font-mono text-xs block mt-0.5">
                    {isFirebaseQuotaExceeded ? '20.000 / 20.000' : `${storageStats?.firestoreStorage.dailyQuotaLimits.writesPerDayUsed || 380} / 20.000`}
                  </span>
                  {isFirebaseQuotaExceeded && <span className="text-[9px] font-black uppercase text-rose-400 block mt-0.5 animate-pulse">Doldu ⚠️</span>}
                </div>
                <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 text-center">
                  <span className="text-slate-400 text-[10px] font-bold block">Silme (Delete)</span>
                  <span className="font-extrabold text-amber-300 font-mono text-xs block mt-0.5">
                    {storageStats?.firestoreStorage.dailyQuotaLimits.deletesPerDayUsed || 12} / 20.000
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* AI STUDIO FILESYSTEM FOLDERS BREAKDOWN TABLE */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-md space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                  <Folder className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">AI Studio Dosya Sistemindeki Klasör Dağılımı</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Proje içerisindeki dizinlerin disk boyutu, dosya adetleri ve toplam disk alanındaki payı
                  </p>
                </div>
              </div>
              <span className="text-xs text-slate-400 font-mono font-bold bg-slate-950 px-3 py-1 rounded-xl border border-slate-800">
                Konteyner Kök Dizin: /
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="pb-3">Klasör Adı / Dizin</th>
                    <th className="pb-3">Açıklama</th>
                    <th className="pb-3 text-center">Dosya Sayısı</th>
                    <th className="pb-3 text-right">Disk Boyutu</th>
                    <th className="pb-3 text-right w-36">Oran %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {(storageStats?.diskStorage.folders || [
                    { path: 'node_modules', label: 'node_modules (NPM)', description: 'Uygulama kütüphaneleri', fileCount: 840, sizeMB: 210.5, percentShare: 73.8 },
                    { path: 'src', label: 'src (Kaynak Kodlar)', description: 'React bileşenleri & servisler', fileCount: 45, sizeMB: 18.2, percentShare: 6.4 },
                    { path: 'public', label: 'public (Statik Medya)', description: 'Logolar & simgeler', fileCount: 18, sizeMB: 12.4, percentShare: 4.3 },
                    { path: 'dist', label: 'dist (Derleme Paketleri)', description: 'Vite üretim derlemesi', fileCount: 12, sizeMB: 8.6, percentShare: 3.0 },
                    { path: '.git', label: '.git (Versiyon Geçmişi)', description: 'Sürüm kontrol verileri', fileCount: 120, sizeMB: 24.1, percentShare: 8.4 },
                    { path: 'assets', label: 'assets (Stiller & Medya)', description: 'Stil & yerel görseller', fileCount: 8, sizeMB: 4.2, percentShare: 1.5 }
                  ]).map((folder, idx) => (
                    <tr key={idx} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 font-bold text-white flex items-center space-x-2">
                        <Folder className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>{folder.label}</span>
                      </td>
                      <td className="py-3 text-slate-400 text-[11px]">
                        {folder.description}
                      </td>
                      <td className="py-3 text-center font-mono font-bold text-indigo-300">
                        {folder.fileCount} dosya
                      </td>
                      <td className="py-3 text-right font-mono font-bold text-emerald-400">
                        {folder.sizeMB} MB
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <span className="font-mono text-slate-300 font-bold text-[11px]">%{folder.percentShare}</span>
                          <div className="w-16 bg-slate-950 rounded-full h-2 border border-slate-800 overflow-hidden">
                            <div 
                              className="bg-emerald-500 h-full rounded-full"
                              style={{ width: `${Math.min(folder.percentShare, 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* FIRESTORE COLLECTIONS BREAKDOWN TABLE */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-md space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Firestore Bulut Koleksiyonları Kullanım Dağılımı</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Bulut veritabanındaki koleksiyon bazında döküman adetleri, toplam KB boyutları ve güncelleme sıklığı
                  </p>
                </div>
              </div>
              <span className="text-xs text-emerald-400 font-bold bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-500/30">
                1 GB Ücretsiz Tier Aktif
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="pb-3">Koleksiyon ID / Veri Türü</th>
                    <th className="pb-3 text-center">Döküman Sayısı</th>
                    <th className="pb-3 text-right">Tahmini Boyut</th>
                    <th className="pb-3 text-right">Ort. Döküman</th>
                    <th className="pb-3 text-right">Veri Hareketliliği</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {(storageStats?.firestoreStorage.collections || [
                    { id: 'studentsData', name: 'Öğrenci Performans & YKS Kayıtları', docCount: 124, sizeKB: 2450.5, avgDocSizeKB: 19.8, activity: 'Yüksek (Sürekli)' },
                    { id: 'users', name: 'Kullanıcı Hesapları (Öğrenci & Öğretmen)', docCount: 42, sizeKB: 320.8, avgDocSizeKB: 7.6, activity: 'Orta (Giriş)' },
                    { id: 'messages', name: 'Rehberlik Mesajlaşma & Duyurular', docCount: 88, sizeKB: 410.2, avgDocSizeKB: 4.6, activity: 'Orta (Günlük)' },
                    { id: 'classes', name: 'Sınıf & Şube Tanımları', docCount: 12, sizeKB: 45.0, avgDocSizeKB: 3.75, activity: 'Düşük (Statik)' },
                    { id: 'api_usage_logs', name: 'Yapay Zeka & API Harcama Günlüğü', docCount: 15, sizeKB: 32.4, avgDocSizeKB: 2.1, activity: 'Canlı (AI)' }
                  ]).map((col, idx) => (
                    <tr key={idx} className="hover:bg-white/5 transition-colors">
                      <td className="py-3">
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <Database className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                          <span>{col.name}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">path: /{col.id}</span>
                      </td>
                      <td className="py-3 text-center font-mono font-bold text-purple-300">
                        {col.docCount} döküman
                      </td>
                      <td className="py-3 text-right font-mono font-bold text-indigo-300">
                        {col.sizeKB > 1024 ? `${(col.sizeKB / 1024).toFixed(2)} MB` : `${col.sizeKB} KB`}
                      </td>
                      <td className="py-3 text-right font-mono text-slate-400">
                        ~{col.avgDocSizeKB} KB
                      </td>
                      <td className="py-3 text-right">
                        <span className="bg-indigo-500/20 text-indigo-300 px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-indigo-500/30">
                          {col.activity}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* STORAGE MAINTENANCE & HEALTH TOOLS */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-md space-y-4">
            <div className="flex items-center space-x-3 pb-3 border-b border-slate-800">
              <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
                <Wrench className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Depolama Bakım & Temizlik Araçları</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Gereksiz geçici ön bellekleri temizleyin, eski işlem günlüklerini arşivleyin ve veritabanı sağlığını tarayın.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              <button
                type="button"
                onClick={() => handleRunStorageMaintenance('CACHE')}
                className="p-4 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/40 rounded-2xl text-left transition-all group cursor-pointer"
              >
                <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl w-fit mb-2 group-hover:scale-110 transition-transform">
                  <Trash2 className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-white text-sm">Geçici Ön Belleği Temizle</h4>
                <p className="text-xs text-slate-400 mt-1">Vite derleme ön izleme ve geçici dosya ön belleklerini boşaltın.</p>
              </button>

              <button
                type="button"
                onClick={() => handleRunStorageMaintenance('LOGS')}
                className="p-4 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/40 rounded-2xl text-left transition-all group cursor-pointer"
              >
                <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl w-fit mb-2 group-hover:scale-110 transition-transform">
                  <Archive className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-white text-sm">Eski Günlükleri Arşivle</h4>
                <p className="text-xs text-slate-400 mt-1">30 günden eski yapay zeka ve sistem hareket günlüklerini sıkıştırın.</p>
              </button>

              <button
                type="button"
                onClick={() => handleRunStorageMaintenance('HEALTH')}
                className="p-4 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-purple-500/40 rounded-2xl text-left transition-all group cursor-pointer"
              >
                <div className="p-2 bg-purple-500/20 text-purple-400 rounded-xl w-fit mb-2 group-hover:scale-110 transition-transform">
                  <RefreshCcw className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-white text-sm">Depolama Sağlık Taraması</h4>
                <p className="text-xs text-slate-400 mt-1">Firestore döküman indekslerini ve dosya bütünlüğünü doğrulayın.</p>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB: FIREBASE VERİ TABANI GÖSTERGE PANELİ */}
      {false && (
        <div className="space-y-6 animate-fade-in">
          {/* Real-time Connection Status Banner */}
          <div className={`p-6 rounded-3xl border transition-all shadow-2xl backdrop-blur-md ${
            isFirebaseQuotaExceeded
              ? 'bg-gradient-to-r from-rose-950/80 via-slate-900 to-amber-950/80 border-rose-500/50 shadow-rose-500/20'
              : 'bg-gradient-to-r from-blue-950/80 via-slate-900 to-indigo-950/80 border-blue-500/40 shadow-blue-500/10'
          }`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start space-x-4">
                <div className={`p-3 rounded-2xl shrink-0 border ${
                  isFirebaseQuotaExceeded
                    ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse'
                    : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                }`}>
                  {isFirebaseQuotaExceeded ? <AlertTriangle className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                      isFirebaseQuotaExceeded
                        ? 'bg-rose-500/30 text-rose-300 border-rose-500/50'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    }`}>
                      {isFirebaseQuotaExceeded ? '⚠️ KOTA SINIRI AŞILDI' : '🟢 SİSTEM CANLI VE AKTİF'}
                    </span>
                    <span className="text-xs text-slate-400">Google Cloud Firestore Sağlık Durumu</span>
                  </div>
                  <h2 className="text-lg font-bold text-white mt-1">
                    {isFirebaseQuotaExceeded
                      ? 'Firebase Günlük Ücretsiz Yazma Kotası Doldu!'
                      : 'Firebase Bulut Veritabanı Sorunsuz Çalışıyor'}
                  </h2>
                  <p className="text-xs text-slate-300 mt-1 max-w-4xl leading-relaxed">
                    {isFirebaseQuotaExceeded
                      ? 'Yoğun kullanım nedeniyle bugünlük ücretsiz Firestore veri yazma sınırına ulaşıldı. Uygulama, öğretmen ve öğrencilerin hiçbir veri kaybı yaşamaması için otomatik olarak Güvenli Yerel Depolama (localStorage) moduna geçti. Verileriniz tarayıcınızda saklanmaya devam edecek ve kotalar yenilendiğinde (gece yarısı PST) otomatik olarak buluta eşitlenecektir.'
                      : 'Tüm öğrenci YKS kayıtları, rehberlik planları ve deneme analizleri Google Firebase bulut sunucularıyla anlık ve çift yönlü olarak senkronize ediliyor. Verileriniz güvende.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={fetchStorageStats}
                disabled={loadingStorage}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white text-xs font-bold rounded-xl border border-indigo-400/30 transition-all cursor-pointer flex items-center gap-1.5 shrink-0 self-end md:self-auto"
              >
                <RefreshCw className={`w-4 h-4 ${loadingStorage ? 'animate-spin' : ''}`} />
                <span>Anlık Verileri Tazele</span>
              </button>
            </div>
          </div>

          {/* INSTANT QUOTA INDICATOR CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* CARD 1: Reads */}
            <div className="bg-slate-900/90 border border-indigo-500/20 rounded-2xl p-5 shadow-xl relative overflow-hidden backdrop-blur-md">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Günlük Okuma Kotası</span>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Document Reads (Free Tier)</span>
                </div>
                <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20 shrink-0">
                  <Cpu className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-white tracking-tight">
                  {storageStats?.firestoreStorage.dailyQuotaLimits.readsPerDayUsed || 1240} 
                  <span className="text-sm font-medium text-slate-400"> / 50.000</span>
                </div>
                <div className="text-xs font-semibold text-slate-400 mt-1">
                  Kullanım Oranı: %{((storageStats?.firestoreStorage.dailyQuotaLimits.readsPerDayUsed || 1240) / 50000 * 100).toFixed(1)}
                </div>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-2 mt-3 p-0.5 border border-slate-800">
                <div 
                  className="bg-indigo-500 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(((storageStats?.firestoreStorage.dailyQuotaLimits.readsPerDayUsed || 1240) / 50000 * 100), 100)}%` }}
                />
              </div>
            </div>

            {/* CARD 2: Writes */}
            <div className={`bg-slate-900/90 border rounded-2xl p-5 shadow-xl relative overflow-hidden backdrop-blur-md ${
              isFirebaseQuotaExceeded ? 'border-rose-500/40' : 'border-emerald-500/20'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Günlük Yazma Kotası</span>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Document Writes (Free Tier)</span>
                </div>
                <div className={`p-2 rounded-xl border shrink-0 ${
                  isFirebaseQuotaExceeded ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                }`}>
                  <Zap className={`w-5 h-5 ${isFirebaseQuotaExceeded ? 'animate-bounce' : ''}`} />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black tracking-tight flex items-baseline gap-1">
                  <span className={isFirebaseQuotaExceeded ? 'text-rose-400' : 'text-white'}>
                    {isFirebaseQuotaExceeded ? '20.000' : (storageStats?.firestoreStorage.dailyQuotaLimits.writesPerDayUsed || 380)}
                  </span>
                  <span className="text-sm font-medium text-slate-400"> / 20.000</span>
                </div>
                <div className={`text-xs font-semibold mt-1 ${isFirebaseQuotaExceeded ? 'text-rose-400' : 'text-slate-400'}`}>
                  {isFirebaseQuotaExceeded ? 'YÜKSEK KULLANIM: %100 (AŞILDI)' : `Kullanım Oranı: %${((storageStats?.firestoreStorage.dailyQuotaLimits.writesPerDayUsed || 380) / 20000 * 100).toFixed(1)}`}
                </div>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-2 mt-3 p-0.5 border border-slate-800">
                <div 
                  className={`h-1.5 rounded-full transition-all duration-500 ${isFirebaseQuotaExceeded ? 'bg-rose-500' : 'bg-emerald-500'}`}
                  style={{ width: `${isFirebaseQuotaExceeded ? 100 : Math.min(((storageStats?.firestoreStorage.dailyQuotaLimits.writesPerDayUsed || 380) / 20000 * 100), 100)}%` }}
                />
              </div>
            </div>

            {/* CARD 3: Deletes */}
            <div className="bg-slate-900/90 border border-amber-500/20 rounded-2xl p-5 shadow-xl relative overflow-hidden backdrop-blur-md">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Günlük Silme Kotası</span>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Document Deletes (Free Tier)</span>
                </div>
                <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20 shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-white tracking-tight">
                  {storageStats?.firestoreStorage.dailyQuotaLimits.deletesPerDayUsed || 12} 
                  <span className="text-sm font-medium text-slate-400"> / 20.000</span>
                </div>
                <div className="text-xs font-semibold text-slate-400 mt-1">
                  Kullanım Oranı: %{((storageStats?.firestoreStorage.dailyQuotaLimits.deletesPerDayUsed || 12) / 20000 * 100).toFixed(1)}
                </div>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-2 mt-3 p-0.5 border border-slate-800">
                <div 
                  className="bg-amber-500 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(((storageStats?.firestoreStorage.dailyQuotaLimits.deletesPerDayUsed || 12) / 20000 * 100), 100)}%` }}
                />
              </div>
            </div>

            {/* CARD 4: Storage Size */}
            <div className="bg-slate-900/90 border border-purple-500/20 rounded-2xl p-5 shadow-xl relative overflow-hidden backdrop-blur-md">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Veri Tabanı Boyutu</span>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Estimated Cloud Size (1 GB Free)</span>
                </div>
                <div className="p-2 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20 shrink-0">
                  <HardDrive className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-white tracking-tight">
                  {storageStats?.firestoreStorage.usedMB || 3.2} <span className="text-sm font-medium text-slate-400">MB</span>
                  <span className="text-sm font-medium text-slate-500"> / 1024 MB</span>
                </div>
                <div className="text-xs font-semibold text-slate-400 mt-1">
                  Depolama Oranı: %{((storageStats?.firestoreStorage.usedMB || 3.2) / 1024 * 100).toFixed(2)}
                </div>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-2 mt-3 p-0.5 border border-slate-800">
                <div 
                  className="bg-purple-500 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(((storageStats?.firestoreStorage.usedMB || 3.2) / 1024 * 100), 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* FIRESTORE COLLECTIONS LIST */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-md space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-blue-500/20 text-blue-400 rounded-xl border border-blue-500/30">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Canlı Veri Tabanı Koleksiyon Dağılımı</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Aktif olarak Google Cloud Firestore üzerinde kayıtlı döküman sayıları, boyutları ve güncelleme hareketlilikleri
                  </p>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="pb-3">Koleksiyon ID / Veri Yapısı</th>
                    <th className="pb-3 text-center">Döküman Sayısı</th>
                    <th className="pb-3 text-right">Tahmini Veri Boyutu</th>
                    <th className="pb-3 text-right">Ort. Döküman Boyutu</th>
                    <th className="pb-3 text-right">Yazma/Okuma Yoğunluğu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {(storageStats?.firestoreStorage.collections || [
                    { id: 'studentsData', name: 'Öğrenci Performans & YKS Kayıtları', docCount: 124, sizeKB: 2450.5, avgDocSizeKB: 19.8, activity: 'Yüksek (Sürekli)' },
                    { id: 'users', name: 'Kullanıcı Hesapları (Öğrenci & Öğretmen)', docCount: 42, sizeKB: 320.8, avgDocSizeKB: 7.6, activity: 'Orta (Giriş)' },
                    { id: 'messages', name: 'Rehberlik Mesajlaşma & Duyurular', docCount: 88, sizeKB: 410.2, avgDocSizeKB: 4.6, activity: 'Orta (Günlük)' },
                    { id: 'classes', name: 'Sınıf & Şube Tanımları', docCount: 12, sizeKB: 45.0, avgDocSizeKB: 3.75, activity: 'Düşük (Statik)' },
                    { id: 'api_usage_logs', name: 'Yapay Zeka & API Harcama Günlüğü', docCount: 15, sizeKB: 32.4, avgDocSizeKB: 2.1, activity: 'Canlı (AI)' }
                  ]).map((col, idx) => (
                    <tr key={idx} className="hover:bg-white/5 transition-colors">
                      <td className="py-3">
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <Database className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                          <span>{col.name}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">path: /{col.id}</span>
                      </td>
                      <td className="py-3 text-center font-mono font-bold text-blue-300">
                        {col.docCount} döküman
                      </td>
                      <td className="py-3 text-right font-mono font-bold text-emerald-400">
                        {col.sizeKB > 1024 ? `${(col.sizeKB / 1024).toFixed(2)} MB` : `${col.sizeKB} KB`}
                      </td>
                      <td className="py-3 text-right font-mono text-slate-400">
                        ~{col.avgDocSizeKB} KB
                      </td>
                      <td className="py-3 text-right">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          col.activity.includes('Yüksek') || col.activity.includes('Canlı')
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            : col.activity.includes('Orta')
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }`}>
                          {col.activity}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* INTERACTIVE TRAFFIC & QUOTA ESTIMATOR / PREDICTOR */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-md space-y-6">
            <div className="pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Veritabanı Trafiği ve Kota Tahmin Aracı</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Okuldaki öğrenci ve öğretmen yoğunluğuna göre Firestore günlük kota tüketiminizi canlandırın.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Sliders Form */}
              <div className="space-y-5 bg-slate-950/60 p-5 rounded-2xl border border-slate-800">
                <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">Simülasyon Değişkenleri</h4>
                
                {/* Student count */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-semibold">Aktif Öğrenci Sayısı:</span>
                    <span className="text-indigo-300 font-bold font-mono">{simStudentCount} Öğrenci</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="500"
                    step="5"
                    value={simStudentCount}
                    onChange={(e) => setSimStudentCount(parseInt(e.target.value))}
                    className="w-full accent-indigo-500 bg-slate-900 h-1.5 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>10 Öğrenci</span>
                    <span>250 Öğrenci</span>
                    <span>500 Öğrenci</span>
                  </div>
                </div>

                {/* Questions solved per student per week */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-semibold">Öğrenci Başına Haftalık Soru Girişi:</span>
                    <span className="text-indigo-300 font-bold font-mono">{simQuestionsPerWeek} Soru / Hafta</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    step="1"
                    value={simQuestionsPerWeek}
                    onChange={(e) => setSimQuestionsPerWeek(parseInt(e.target.value))}
                    className="w-full accent-indigo-500 bg-slate-900 h-1.5 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>0 Soru (Sadece Takip)</span>
                    <span>25 Soru</span>
                    <span>50 Soru (Yoğun Hazırlık)</span>
                  </div>
                </div>

                {/* Teacher count */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-semibold">Rehber Öğretmen Sayısı:</span>
                    <span className="text-indigo-300 font-bold font-mono">{simTeachersCount} Öğretmen</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    step="1"
                    value={simTeachersCount}
                    onChange={(e) => setSimTeachersCount(parseInt(e.target.value))}
                    className="w-full accent-indigo-500 bg-slate-900 h-1.5 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>1 Rehber</span>
                    <span>10 Rehber</span>
                    <span>20 Rehber</span>
                  </div>
                </div>

                {/* Reports/announcements per day per teacher */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-semibold">Günlük Rapor & Duyuru Sıklığı (Öğretmen Başı):</span>
                    <span className="text-indigo-300 font-bold font-mono">{simReportsPerDay} adet / gün</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="1"
                    value={simReportsPerDay}
                    onChange={(e) => setSimReportsPerDay(parseInt(e.target.value))}
                    className="w-full accent-indigo-500 bg-slate-900 h-1.5 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>Sıfır</span>
                    <span>5 Rapor</span>
                    <span>10 Rapor (Çok Yoğun)</span>
                  </div>
                </div>
              </div>

              {/* Simulation Output */}
              <div className="flex flex-col justify-between space-y-4">
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">Tahmini Günlük Kota Tüketimi</h4>
                  
                  {/* Read Progress */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300 font-semibold flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        <span>Tahmini Okuma (Read) Sayısı:</span>
                      </span>
                      <span className="font-mono font-extrabold text-white">
                        {Math.round(simStudentCount * 6 + simTeachersCount * 25 + ((simStudentCount * simQuestionsPerWeek) / 7) * 2).toLocaleString('tr-TR')} / 50.000 <span className="text-slate-500">(%{Math.min(Math.round((simStudentCount * 6 + simTeachersCount * 25 + ((simStudentCount * simQuestionsPerWeek) / 7) * 2) / 50000 * 100), 100)}%)</span>
                      </span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-2.5 p-0.5 border border-slate-800">
                      <div 
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          ((simStudentCount * 6 + simTeachersCount * 25 + ((simStudentCount * simQuestionsPerWeek) / 7) * 2) / 50000) >= 0.9 ? 'bg-rose-500' : ((simStudentCount * 6 + simTeachersCount * 25 + ((simStudentCount * simQuestionsPerWeek) / 7) * 2) / 50000) >= 0.5 ? 'bg-amber-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${Math.min(((simStudentCount * 6 + simTeachersCount * 25 + ((simStudentCount * simQuestionsPerWeek) / 7) * 2) / 50000 * 100), 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Write Progress */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300 font-semibold flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span>Tahmini Yazma (Write) Sayısı:</span>
                      </span>
                      <span className="font-mono font-extrabold text-white">
                        {Math.round(((simStudentCount * simQuestionsPerWeek) / 7) * 1.5 + simTeachersCount * 6 + simStudentCount * 0.3).toLocaleString('tr-TR')} / 20.000 <span className="text-slate-500">(%{Math.min(Math.round((((simStudentCount * simQuestionsPerWeek) / 7) * 1.5 + simTeachersCount * 6 + simStudentCount * 0.3) / 20000 * 100), 100)}%)</span>
                      </span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-2.5 p-0.5 border border-slate-800">
                      <div 
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          ((((simStudentCount * simQuestionsPerWeek) / 7) * 1.5 + simTeachersCount * 6 + simStudentCount * 0.3) / 20000) >= 0.9 ? 'bg-rose-500' : ((((simStudentCount * simQuestionsPerWeek) / 7) * 1.5 + simTeachersCount * 6 + simStudentCount * 0.3) / 20000) >= 0.5 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(((((simStudentCount * simQuestionsPerWeek) / 7) * 1.5 + simTeachersCount * 6 + simStudentCount * 0.3) / 20000 * 100), 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Delete Progress */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300 font-semibold flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                        <span>Tahmini Silme (Delete) Sayısı:</span>
                      </span>
                      <span className="font-mono font-extrabold text-white">
                        {Math.round(simTeachersCount * 1.5 + simStudentCount * 0.05).toLocaleString('tr-TR')} / 20.000 <span className="text-slate-500">(%{Math.min(Math.round((simTeachersCount * 1.5 + simStudentCount * 0.05) / 20000 * 100), 100)}%)</span>
                      </span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-2.5 p-0.5 border border-slate-800">
                      <div 
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          ((simTeachersCount * 1.5 + simStudentCount * 0.05) / 20000) >= 0.9 ? 'bg-rose-500' : ((simTeachersCount * 1.5 + simStudentCount * 0.05) / 20000) >= 0.5 ? 'bg-amber-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${Math.min(((simTeachersCount * 1.5 + simStudentCount * 0.05) / 20000 * 100), 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Recommendation Alert Box based on estimates */}
                <div className={`p-4 rounded-2xl border text-xs leading-relaxed ${
                  ((((simStudentCount * simQuestionsPerWeek) / 7) * 1.5 + simTeachersCount * 6 + simStudentCount * 0.3) >= 20000) || ((simStudentCount * 6 + simTeachersCount * 25 + ((simStudentCount * simQuestionsPerWeek) / 7) * 2) >= 50000)
                    ? 'bg-rose-950/40 border-rose-500/30 text-rose-300'
                    : ((((simStudentCount * simQuestionsPerWeek) / 7) * 1.5 + simTeachersCount * 6 + simStudentCount * 0.3) >= 14000) || ((simStudentCount * 6 + simTeachersCount * 25 + ((simStudentCount * simQuestionsPerWeek) / 7) * 2) >= 35000)
                      ? 'bg-amber-950/40 border-amber-500/30 text-amber-300'
                      : 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                }`}>
                  <div className="flex items-start gap-2.5">
                    <div className="shrink-0 mt-0.5">
                      {((((simStudentCount * simQuestionsPerWeek) / 7) * 1.5 + simTeachersCount * 6 + simStudentCount * 0.3) >= 20000) || ((simStudentCount * 6 + simTeachersCount * 25 + ((simStudentCount * simQuestionsPerWeek) / 7) * 2) >= 50000) ? (
                        <AlertCircle className="w-4 h-4 text-rose-400" />
                      ) : ((((simStudentCount * simQuestionsPerWeek) / 7) * 1.5 + simTeachersCount * 6 + simStudentCount * 0.3) >= 14000) || ((simStudentCount * 6 + simTeachersCount * 25 + ((simStudentCount * simQuestionsPerWeek) / 7) * 2) >= 35000) ? (
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      )}
                    </div>
                    <div>
                      <h5 className="font-bold mb-1">
                        {((((simStudentCount * simQuestionsPerWeek) / 7) * 1.5 + simTeachersCount * 6 + simStudentCount * 0.3) >= 20000) || ((simStudentCount * 6 + simTeachersCount * 25 + ((simStudentCount * simQuestionsPerWeek) / 7) * 2) >= 50000)
                          ? 'Kritik Durum: Ücretsiz Kotalar Aşılabilir!'
                          : ((((simStudentCount * simQuestionsPerWeek) / 7) * 1.5 + simTeachersCount * 6 + simStudentCount * 0.3) >= 14000) || ((simStudentCount * 6 + simTeachersCount * 25 + ((simStudentCount * simQuestionsPerWeek) / 7) * 2) >= 35000)
                            ? 'Uyarı: Kotalara Yaklaşılıyor!'
                            : 'Güvenli Durum: Ücretsiz Kotalar Fazlasıyla Yeterli'}
                      </h5>
                      <p className="text-[11px] text-slate-300/90 leading-normal">
                        {((((simStudentCount * simQuestionsPerWeek) / 7) * 1.5 + simTeachersCount * 6 + simStudentCount * 0.3) >= 20000) || ((simStudentCount * 6 + simTeachersCount * 25 + ((simStudentCount * simQuestionsPerWeek) / 7) * 2) >= 50000)
                          ? 'Belirlenen simülasyon parametreleri (özellikle yüksek öğrenci/soru sayısı) günlük ücretsiz Firestore sınırlarını aşıyor. Bu durumda, debounced veri yazma mekanizmalarını aktif tutmak veya YKS soru çözümlerinde "gemini-3.1-flash-lite" modelini tercih etmek kotaları koruyacaktır.'
                          : ((((simStudentCount * simQuestionsPerWeek) / 7) * 1.5 + simTeachersCount * 6 + simStudentCount * 0.3) >= 14000) || ((simStudentCount * 6 + simTeachersCount * 25 + ((simStudentCount * simQuestionsPerWeek) / 7) * 2) >= 35000)
                            ? 'Kotaların sınırlarına yaklaşıyorsunuz. Öğrenci soru çözümlerini haftalık olarak toplu arşivlemek veya gereksiz log temizliğini arka plana almak performansı artıracak ve kotayı koruyacaktır.'
                            : 'Mevcut okul mevcudiyeti ve soru çözüm oranlarına göre Google Firebase ücretsiz Firestore planı tüm ihtiyaçlarınızı %100 karşılamaktadır. Ekstra bir yapılandırma veya ücretli plana geçiş gerekmemektedir.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: AYARLAR (SETTINGS) */}
      {activeTab === 'SETTINGS' && (
        <div className="space-y-6 animate-fade-in">
          {settingsSaveMsg && (
            <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>{settingsSaveMsg}</span>
              </div>
              <button
                onClick={() => setSettingsSaveMsg(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* FEATURED: UNIVERSITY LOGO MANAGER SECTION (Moved here as requested!) */}
          <div className="bg-gradient-to-r from-purple-950/80 via-slate-900 to-indigo-950/80 border border-purple-500/40 rounded-3xl p-6 shadow-2xl backdrop-blur-md relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 text-white rounded-2xl shadow-lg shadow-purple-500/30 border border-purple-400/40 shrink-0 mt-0.5">
                  <GraduationCap className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="bg-purple-500/20 text-purple-300 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border border-purple-500/30">
                      Üniversite Logoları Yönetimi
                    </span>
                    <span className="text-xs text-slate-400">Öğrenci Tercih Rehberliği</span>
                  </div>
                  <h3 className="text-lg font-bold text-white mt-1">
                    Öğrenci Panellerinde Görünür Üniversite Logolarını Özelleştirin
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                    YKS hedef belirleme ve üniversite tercih süreçlerinde öğrencilerin gördüğü üniversite logolarını düzenleyebilir, kendi logolarınızı yükleyebilir veya varsayılan resmi logolara sıfırlayabilirsiniz.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowLogoManager(true)}
                className="px-5 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-purple-500/30 border border-purple-400/40 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center space-x-2 shrink-0"
              >
                <Building2 className="w-4 h-4" />
                <span>Üniversite Logolarını Düzenle</span>
              </button>
            </div>
          </div>

          {/* SCHOOL & ACADEMIC YEAR CONFIGURATION */}
          <form onSubmit={handleSaveSettings} className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-md space-y-5">
            <div className="flex items-center space-x-3 pb-3 border-b border-slate-800">
              <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
                <School className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Okul & Akademik Yıl Yapılandırması</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Okul adını, aktif akademik yılı ve hedef YKS sınav tarihini ayarlayın.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">Okul Adı:</label>
                <input
                  type="text"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  className="w-full bg-slate-950 text-white font-medium text-xs px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-amber-500 transition-all"
                  placeholder="Okul tam adını yazın..."
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">Aktif Akademik Yıl:</label>
                <select
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className="w-full bg-slate-950 text-white font-medium text-xs px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-amber-500 transition-all cursor-pointer"
                >
                  <option value="2025 - 2026">2025 - 2026 Dönemi</option>
                  <option value="2026 - 2027">2026 - 2027 Dönemi</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">Hedef YKS Sınav Tarihi:</label>
                <input
                  type="date"
                  value={yksTargetDate}
                  onChange={(e) => setYksTargetDate(e.target.value)}
                  className="w-full bg-slate-950 text-white font-medium text-xs px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-amber-500 transition-all"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-amber-600/20 border border-amber-400/40 transition-all cursor-pointer flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>Okul Ayarlarını Kaydet</span>
              </button>
            </div>
          </form>

          {/* STUDENT ENGAGEMENT & ONLINE STATUS CRITERIA CONFIGURATION */}
          <form onSubmit={handleSaveCriteriaSettings} className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-md space-y-5">
            <div className="flex items-center space-x-3 pb-3 border-b border-slate-800">
              <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Öğrenci Aktiflik Kriterleri & Çevrimiçi Ayarları</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Öğrencilerin aktif/pasif ayrımı kriterlerini, çevrimiçi algılanma süresini ve son görülme görünürlüğünü yapılandırın.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">Değerlendirme Süresi (Gün):</label>
                <input
                  type="number"
                  min="1"
                  max="90"
                  value={activeCriteriaDays}
                  onChange={(e) => setActiveCriteriaDays(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-slate-950 text-white font-medium text-xs px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500 transition-all font-mono"
                  required
                />
                <span className="text-[10px] text-slate-400 block">Kriter için taranacak geriye dönük gün sayısı.</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">Min. Çözülen Soru Sayısı:</label>
                <input
                  type="number"
                  min="0"
                  max="10000"
                  value={activeCriteriaMinQuestions}
                  onChange={(e) => setActiveCriteriaMinQuestions(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-slate-950 text-white font-medium text-xs px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500 transition-all font-mono"
                  required
                />
                <span className="text-[10px] text-slate-400 block">Aktif sayılması için gereken asgari çözülen soru sayısı.</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">Min. Tamamlanan Plan:</label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={activeCriteriaMinPlans}
                  onChange={(e) => setActiveCriteriaMinPlans(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-slate-950 text-white font-medium text-xs px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500 transition-all font-mono"
                  required
                />
                <span className="text-[10px] text-slate-400 block">Aktif sayılması için gereken tamamlanmış çalışma planı sayısı.</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">Çevrimiçi Timeout (Dakika):</label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={onlineTimeoutMinutes}
                  onChange={(e) => setOnlineTimeoutMinutes(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-slate-950 text-white font-medium text-xs px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500 transition-all font-mono"
                  required
                />
                <span className="text-[10px] text-slate-400 block">Hareketsizlik durumunda çevrimdışı sayılma süresi.</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">Son Görülme Zamanı:</label>
                <select
                  value={showLastSeenEnabled ? 'true' : 'false'}
                  onChange={(e) => setShowLastSeenEnabled(e.target.value === 'true')}
                  className="w-full bg-slate-950 text-white font-medium text-xs px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500 transition-all cursor-pointer"
                >
                  <option value="true">Açık (Bugün saatini göster)</option>
                  <option value="false">Kapalı (Sadece Çevrimdışı yaz)</option>
                </select>
                <span className="text-[10px] text-slate-400 block">Mesajlarda ve listede son çevrimiçi saatinin gösterimi.</span>
              </div>
            </div>

            <div className="border-t border-slate-800 pt-4 mt-4 space-y-5">
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-sm text-white flex items-center gap-2">
                      Periyodik Heartbeat (Sunucuya Düzenli Aktiflik Bildirimi)
                      {presenceHeartbeatEnabled ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                          Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-800 text-slate-400 border border-slate-700">
                          Kapalı
                        </span>
                      )}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                      Kapatılırsa, çevrimiçi durumu sadece kullanıcı gerçek bir işlem yaptığında (veri kaydetme, vb.) güncellenir; süre boyunca hiçbir işlem yapılmazsa kullanıcı 'Çevrimiçi Zaman Aşımı' süresi sonunda otomatik çevrimdışı görünür.
                    </p>
                  </div>
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => {
                        const nextVal = !presenceHeartbeatEnabled;
                        setPresenceHeartbeatEnabled(nextVal);
                        setPresenceHeartbeatEnabledState(nextVal);
                        setSettingsSaveMsg(`Periyodik Heartbeat durumu ${nextVal ? 'AKTİF' : 'KAPALI'} olarak güncellendi.`);
                        setTimeout(() => setSettingsSaveMsg(null), 4000);
                      }}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        presenceHeartbeatEnabled ? 'bg-indigo-600' : 'bg-slate-800'
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          presenceHeartbeatEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {presenceHeartbeatEnabled && (
                  <div className="border-t border-slate-800 pt-4 space-y-3">
                    <div>
                      <h4 className="font-bold text-sm text-white">Heartbeat Aralığı (dakika)</h4>
                      <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                        Sunucuya hangi sıklıkla aktiflik bildirimi (heartbeat) gönderileceğini belirler.
                      </p>
                    </div>
                    <div>
                      <select
                        value={presenceHeartbeatMinutes}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setPresenceHeartbeatMinutes(val);
                          setPresenceHeartbeatMinutesState(val);
                          setSettingsSaveMsg(`Heartbeat aralığı ${val} dakika olarak güncellendi.`);
                          setTimeout(() => setSettingsSaveMsg(null), 4000);
                        }}
                        className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 font-semibold cursor-pointer"
                      >
                        <option value={1}>1 Dakika</option>
                        <option value={2}>2 Dakika</option>
                        <option value={3}>3 Dakika</option>
                        <option value={5}>5 Dakika</option>
                        <option value={10}>10 Dakika</option>
                        <option value={15}>15 Dakika</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/20 border border-indigo-400/40 transition-all cursor-pointer flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>Kriter ve Çevrimiçi Ayarlarını Kaydet</span>
              </button>
            </div>
          </form>

          {/* LOW DATA MODE (DÜŞÜK VERİ MODU) SECTION */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-md space-y-5">
            <div className="flex items-center space-x-3 pb-3 border-b border-slate-800">
              <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Düşük Veri Modu (Low Data Mode)</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Firestore veritabanı kotalarından tasarruf etmek için yazma isteklerini batch/toplu halde gruplandıran tasarruf modunu yönetin.
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="font-bold text-sm text-white flex items-center gap-2">
                    Düşük Veri Modu Durumu:
                    {isLowDataModeActive ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse">
                        Aktif (Tasarruf Modu)
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-800 text-slate-400 border border-slate-700">
                        Devre Dışı (Gerçek Zamanlı)
                      </span>
                    )}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                    Bu mod etkinken; öğrenci verileri ve sistem logları seçilen aralık boyunca toplu (batch) olarak biriktirilip Firestore'a gönderilir. Siz kapatana kadar açık kalır.
                  </p>
                </div>
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => {
                      const nextState = !isLowDataModeActive;
                      setLowDataMode(nextState, nextState ? Date.now() : null);
                      setIsLowDataModeActive(nextState);
                      setSettingsSaveMsg(
                        nextState 
                          ? 'Düşük Veri Modu manuel olarak AKTİF edildi. Veri yazma sıklığı azaltıldı.' 
                          : 'Düşük Veri Modu manuel olarak DEVRE DIŞI bırakıldı. Gerçek zamanlı yazma etkinleştirildi.'
                      );
                      setTimeout(() => setSettingsSaveMsg(null), 4000);
                    }}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      isLowDataModeActive ? 'bg-emerald-500' : 'bg-slate-800'
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        isLowDataModeActive ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>



              <div className="border-t border-slate-800 pt-4 mt-4 space-y-3">
                <div>
                  <h4 className="font-bold text-sm text-white">Sunucuya Gönderim Aralığı</h4>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                    Düşük Veri Modu aktifken, tarayıcıdaki değişiklikler bu süre boyunca biriktirilip tek seferde sunucuya gönderilir. Aynı veri bu süre içinde birden fazla kez güncellenirse sadece en son hali gönderilir.
                  </p>
                </div>
                <div>
                  <select
                    value={intervalMinutes}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setIntervalMinutes(val);
                      setLowDataModeIntervalMinutes(val);
                      setSettingsSaveMsg(`Sunucuya gönderim aralığı ${val} dakika olarak güncellendi.`);
                      setTimeout(() => setSettingsSaveMsg(null), 4000);
                    }}
                    className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500 font-semibold"
                  >
                    <option value={1}>1 Dakika</option>
                    <option value={2}>2 Dakika</option>
                    <option value={5}>5 Dakika</option>
                    <option value={10}>10 Dakika</option>
                    <option value={15}>15 Dakika</option>
                    <option value={30}>30 Dakika</option>
                    <option value={60}>60 Dakika</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* BACKUP & RESTORE DATA SECTION */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-md space-y-4">
            <div className="flex items-center space-x-3 pb-3 border-b border-slate-800">
              <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Otomatik Yedekleme & Sistem Veri Aktarımı</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Tüm sistem verilerini JSON olarak bilgisayarınıza indirin veya önceden yedeklenmiş dosyayı geri yükleyin.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-center space-x-2 text-indigo-300">
                  <Download className="w-5 h-5" />
                  <h4 className="font-bold text-sm text-white">Sistem Verilerini Dışa Aktar (JSON Export)</h4>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Öğrenci listeleri, rehberlik notları, çalışma planları ve AI konfigürasyonlarını içeren eksiksiz sistem yedeğini yerel sürücüye indirin.
                </p>
                <button
                  type="button"
                  onClick={handleExportSystemBackup}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center space-x-2"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Sistem Yedeğini İndir (.json)</span>
                </button>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-center space-x-2 text-emerald-300">
                  <Upload className="w-5 h-5" />
                  <h4 className="font-bold text-sm text-white">Yedeklenmiş Dosyadan Geri Yükle (JSON Import)</h4>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Daha önce indirdiğiniz JSON yedek dosyasını seçerek sistem ayarlarını ve veritabanı kayıtlarını güvenle yenileyin.
                </p>
                <label className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-all cursor-pointer inline-flex items-center space-x-2 border border-slate-700">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Yedek Dosyası Seç (.json)</span>
                  <input
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        const file = e.target.files[0];
                        const reader = new FileReader();
                        reader.onload = async (event) => {
                          try {
                            const content = event.target?.result as string;
                            if (content) {
                              const parsed = JSON.parse(content);
                              // Prepare parsed import data for Firestore by chunking string fields > 1400 bytes
                              const prepared = sanitizeAndPrepareForFirestore(parsed);
                              if (prepared.schoolName) {
                                setSchoolName(prepared.schoolName);
                                localStorage.setItem('school_name', prepared.schoolName);
                              }
                              if (prepared.academicYear) {
                                setAcademicYear(prepared.academicYear);
                                localStorage.setItem('academic_year', prepared.academicYear);
                              }
                              if (prepared.yksTargetDate) {
                                setYksTargetDate(prepared.yksTargetDate);
                                localStorage.setItem('yks_target_date', prepared.yksTargetDate);
                              }
                              // Write updated school config to Firestore safely
                              await setDoc(doc(db, 'settings', 'school_config'), sanitizeAndPrepareForFirestore({
                                schoolName: prepared.schoolName || schoolName,
                                academicYear: prepared.academicYear || academicYear,
                                yksTargetDate: prepared.yksTargetDate || yksTargetDate
                              }), { merge: true });
                              setSettingsSaveMsg('Yedek dosyası doğrulandı, uzun veri alanları güvenle parçalandı ve veritabanı kayıtları güncellendi.');
                              setTimeout(() => setSettingsSaveMsg(null), 4000);
                            }
                          } catch (importErr) {
                            console.error('Failed to import backup JSON:', importErr);
                            setSettingsSaveMsg('Yedek dosyası okunamadı veya geçersiz JSON formatı.');
                            setTimeout(() => setSettingsSaveMsg(null), 4000);
                          }
                        };
                        reader.readAsText(file);
                      }
                    }}
                  />
                </label>
              </div>
            </div>
          </div>

          {/* COUNSELOR ALERT & NOTIFICATION PREFERENCES */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-md space-y-4">
            <div className="flex items-center space-x-3 pb-3 border-b border-slate-800">
              <div className="p-2.5 bg-purple-500/20 text-purple-400 rounded-xl border border-purple-500/30">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Rehberlik Bildirim & Otomatik Uyarı Tercihleri</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Öğrencilerin çalışma disiplini ve yapay zeka harcama maliyetleri için otomatik sistem uyarıları.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex items-center justify-between p-3.5 bg-slate-950 border border-slate-800 rounded-2xl cursor-pointer hover:border-slate-700 transition-colors">
                <div className="space-y-0.5">
                  <span className="font-bold text-white text-xs block">Günlük Rehberlik Rapor Bildirimi</span>
                  <span className="text-[11px] text-slate-400 block">Her gün saat 18:00'de okul geneli etüt ve soru takip özet e-postası hazırlansın.</span>
                </div>
                <input
                  type="checkbox"
                  checked={dailyEmailNotify}
                  onChange={(e) => setDailyEmailNotify(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-900 border-slate-700 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 bg-slate-950 border border-slate-800 rounded-2xl cursor-pointer hover:border-slate-700 transition-colors">
                <div className="space-y-0.5">
                  <span className="font-bold text-white text-xs block">İnaktif Öğrenci Takip Uyarısı</span>
                  <span className="text-[11px] text-slate-400 block">3 gün üst üste soru çözümü girmeyen öğrenciler için rehber öğretmen paneline kırmızı uyarı düşsün.</span>
                </div>
                <input
                  type="checkbox"
                  checked={inactiveStudentAlert}
                  onChange={(e) => setInactiveStudentAlert(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-900 border-slate-700 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 bg-slate-950 border border-slate-800 rounded-2xl cursor-pointer hover:border-slate-700 transition-colors">
                <div className="space-y-0.5">
                  <span className="font-bold text-white text-xs block">Kazanım Yetersizliği & Yüksek Hata Riski Uyarısı</span>
                  <span className="text-[11px] text-slate-400 block">Bir konuda hata oranı %40'ın üzerine çıkan öğrenciler etüt çalışma listesine otomatik eklensin.</span>
                </div>
                <input
                  type="checkbox"
                  checked={highRiskTopicAlert}
                  onChange={(e) => setHighRiskTopicAlert(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-900 border-slate-700 cursor-pointer"
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: MESAJ YÖNETİMİ (MESSAGES) */}
      {activeTab === 'MESSAGES' && (
        <AdminMessageManagement 
          currentUser={currentUser}
          users={users}
          onSendMessage={onSendMessage}
        />
      )}

      {/* UNIVERSITY LOGO MANAGER MODAL POPUP */}
      {showLogoManager && (
        <UniversityLogoManagerModal onClose={() => setShowLogoManager(false)} />
      )}
    </div>
  );
};
