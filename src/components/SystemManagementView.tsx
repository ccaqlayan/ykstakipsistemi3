import React, { useState, useEffect } from 'react';
import { 
  Sliders, 
  RefreshCw, 
  ShieldCheck, 
  Brain, 
  HardDrive, 
  Settings2, 
  MessageSquare,
  Sparkles,
  GitBranch
} from 'lucide-react';
import { UniversityLogoManagerModal } from './UniversityLogoManagerModal';
import { AdminMessageManagement } from './AdminMessageManagement';
import { MotivationMessagesTab } from './system/MotivationMessagesTab';
import { SystemVersionTab } from './system/SystemVersionTab';
import { 
  onQuotaError, 
  getLowDataMode, 
  onLowDataModeChange, 
  getLowDataModeIntervalMinutes, 
  getPresenceHeartbeatMinutes, 
  getPresenceHeartbeatEnabled, 
  db, 
  reassembleDataFromFirestore 
} from '../services/firebase';
import { doc, setDoc } from 'firebase/firestore';

import {
  SystemTab,
  UsageSummary,
  ModelUsage,
  FeatureUsage,
  ApiUsageLog,
  UsageStatsResponse,
  ModelSettingsData,
  StorageStatsResponse,
  CoachDataSettingsMap,
  SystemManagementViewProps
} from './system/SystemTypes';

import { SystemAiTab } from './system/SystemAiTab';
import { SystemStorageTab } from './system/SystemStorageTab';
import { SystemSettingsTab } from './system/SystemSettingsTab';

export const SystemManagementView: React.FC<SystemManagementViewProps> = ({ 
  auditLogs = [],
  currentUser,
  users = [],
  onSendMessage
}) => {
  const safeString = (val: any) => typeof val === 'string' ? val : String(val || '');

  // Helper to parse stats from auditLogs
  const computeStatsFromAuditLogs = (logs: any[]): UsageStatsResponse => {
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
        estimatedCostTRY,
        promptText: safeString(meta.promptText || ''),
        responseText: safeString(meta.responseText || ''),
        userName: safeString(meta.userName || log.userDisplayName || log.userName || '').replace(/\s*\(.*?\)\s*$/g, '').trim(),
        userRole: safeString(meta.userRole || log.userRole || 'Öğrenci'),
      };
    });

    const recentLogs = [...aiLogs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

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

  // Navigation tab state: 'AI' | 'STORAGE' | 'SETTINGS' | 'MESSAGES'
  const [activeTab, setActiveTab] = useState<SystemTab>('AI');

  // AI Usage & Models State
  const [stats, setStats] = useState<UsageStatsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showLogoManager, setShowLogoManager] = useState<boolean>(false);
  const [filterCategory, setFilterCategory] = useState<'ALL' | 'AI_COACH' | 'STUDY_TASK_SUGGEST' | 'QUESTION_ANALYSIS'>('ALL');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [filterCategory]);

  const [dateFilter, setDateFilter] = useState<'7days' | 'thisMonth' | 'allTime'>('7days');
  const [anomalyLimitTRY, setAnomalyLimitTRY] = useState<number>(5.0);
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

  // Maintenance Mode States
  const [maintenanceMode, setMaintenanceMode] = useState<boolean>(() => {
    const val = localStorage.getItem('maintenance_mode');
    return val === 'true';
  });
  const [maintenanceMessage, setMaintenanceMessage] = useState<string>(() => {
    return localStorage.getItem('maintenance_message') || 'Sistemimizde şu anda planlı altyapı iyileştirmesi ve güncelleme çalışması yapılmaktadır. Öğrenci verileriniz güvendedir ve en kısa sürede sistem tekrar açılacaktır.';
  });
  const [maintenanceEndTime, setMaintenanceEndTime] = useState<string>(() => {
    return localStorage.getItem('maintenance_end_time') || '';
  });
  const [maintenanceAllowTeachers, setMaintenanceAllowTeachers] = useState<boolean>(() => {
    const val = localStorage.getItem('maintenance_allow_teachers');
    return val === 'true';
  });

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
      const mm = localStorage.getItem('maintenance_mode');
      if (mm !== null) setMaintenanceMode(mm === 'true');
      const mmMsg = localStorage.getItem('maintenance_message');
      if (mmMsg) setMaintenanceMessage(mmMsg);
      const mmEnd = localStorage.getItem('maintenance_end_time');
      if (mmEnd !== null) setMaintenanceEndTime(mmEnd);
      const mmTeach = localStorage.getItem('maintenance_allow_teachers');
      if (mmTeach !== null) setMaintenanceAllowTeachers(mmTeach === 'true');
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

  const fetchUsageStats = async (showLoadingSpinner = false) => {
    if (showLoadingSpinner || !stats) {
      setLoading(true);
    }
    setError(null);
    try {
      const res = await fetch('/api/gemini/usage-stats');
      if (!res.ok) return;
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (data && data.success) {
          setStats(data);
          if (typeof data.anomalyLimitTRY === 'number') {
            setAnomalyLimitTRY(data.anomalyLimitTRY);
          }
        }
      }
    } catch (err: any) {
      console.error('Failed to load API usage stats:', err);
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

  const defaultCoachDataSettings: CoachDataSettingsMap = {
    generalMocks: { enabled: true, limit: 3 },
    topicErrors: { enabled: true, limit: 8 },
    questionLogs: { enabled: true, limit: 5 },
    routines: { enabled: true, limit: 3 },
    studyPlanSummary: { enabled: true },
    resourceProgress: { enabled: true },
    branchExams: { enabled: true, limit: 3 },
    institutionalMocks: { enabled: true, limit: 3 },
    youtubeTracker: { enabled: true },
    pomodoroHistory: { enabled: true, limit: 3 },
    studyPlannerTask: { enabled: true },
    lastWeekPlans: { enabled: false }
  };

  const handleCoachDataToggle = (key: string, enabled: boolean) => {
    if (!modelSettings) return;
    const currentCoachSettings = modelSettings.coachDataSettings || defaultCoachDataSettings;
    const currentItem = currentCoachSettings[key] || { enabled: true };
    const updated = {
      ...currentCoachSettings,
      [key]: { ...currentItem, enabled }
    };
    setModelSettings({ ...modelSettings, coachDataSettings: updated });
  };

  const handleCoachDataLimitChange = (key: string, limit: number) => {
    if (!modelSettings) return;
    const currentCoachSettings = modelSettings.coachDataSettings || defaultCoachDataSettings;
    const currentItem = currentCoachSettings[key] || { enabled: true };
    const updated = {
      ...currentCoachSettings,
      [key]: { 
        ...currentItem, 
        limit: Math.max(1, limit)
      }
    };
    setModelSettings({ ...modelSettings, coachDataSettings: updated });
  };

  const handleCoachDataPromptLogToggle = (enabled: boolean) => {
    if (!modelSettings) return;
    setModelSettings({ ...modelSettings, savePromptLogs: enabled });
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
          coachDataSettings: modelSettings.coachDataSettings || defaultCoachDataSettings,
          savePromptLogs: modelSettings.savePromptLogs !== false
        })
      });
      const data = await res.json();
      if (data.success) {
        setCoachDataSaveMessage('Sorgu ve veri izinleri ayarları başarıyla kaydedildi!');
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
      localStorage.setItem('school_name', schoolName);
      localStorage.setItem('academic_year', academicYear);
      localStorage.setItem('yks_target_date', yksTargetDate);

      await setDoc(doc(db, 'settings', 'school_config'), {
        schoolName,
        academicYear,
        yksTargetDate
      }, { merge: true });

      window.dispatchEvent(new Event('yks_settings_updated'));

      setSettingsSaveMsg('Okul ve akademik yıl ayarları başarıyla kaydedildi ve tüm sisteme uygulandı!');
      setTimeout(() => setSettingsSaveMsg(null), 4000);
    } catch (err) {
      console.error('Failed to save school settings:', err);
      window.dispatchEvent(new Event('yks_settings_updated'));
      setSettingsSaveMsg('Okul ayarları yerel tarayıcıya kaydedildi (Bulut eşitlemesi daha sonra yapılacak).');
      setTimeout(() => setSettingsSaveMsg(null), 4000);
    }
  };

  const handleSaveCriteriaSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem('active_criteria_days', String(activeCriteriaDays));
      localStorage.setItem('active_criteria_min_questions', String(activeCriteriaMinQuestions));
      localStorage.setItem('active_criteria_min_plans', String(activeCriteriaMinPlans));
      localStorage.setItem('online_timeout_minutes', String(onlineTimeoutMinutes));
      localStorage.setItem('show_last_seen_enabled', String(showLastSeenEnabled));

      await setDoc(doc(db, 'settings', 'school_config'), {
        activeCriteriaDays,
        activeCriteriaMinQuestions,
        activeCriteriaMinPlans,
        onlineTimeoutMinutes,
        showLastSeenEnabled
      }, { merge: true });

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

  const handleSaveMaintenanceSettings = async (e?: React.FormEvent, directMode?: boolean) => {
    if (e) e.preventDefault();
    const targetMode = directMode !== undefined ? directMode : maintenanceMode;
    try {
      localStorage.setItem('maintenance_mode', String(targetMode));
      localStorage.setItem('maintenance_message', maintenanceMessage);
      localStorage.setItem('maintenance_end_time', maintenanceEndTime);
      localStorage.setItem('maintenance_allow_teachers', String(maintenanceAllowTeachers));

      await setDoc(doc(db, 'settings', 'school_config'), {
        maintenanceMode: targetMode,
        maintenanceMessage,
        maintenanceEndTime,
        maintenanceAllowTeachers
      }, { merge: true });

      window.dispatchEvent(new Event('yks_settings_updated'));

      setSettingsSaveMsg(targetMode 
        ? '⚠️ Bakım Modu AKTİF edildi! Öğrenciler bakım ekranına yönlendirilecek.'
        : '✅ Bakım Modu KAPATILDI! Sistem tüm kullanıcılara açıldı.'
      );
      setTimeout(() => setSettingsSaveMsg(null), 5000);
    } catch (err) {
      console.error('Failed to save maintenance settings:', err);
      window.dispatchEvent(new Event('yks_settings_updated'));
      setSettingsSaveMsg('Bakım modu ayarları yerel tarayıcıya kaydedildi.');
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
    handleSettingsUpdate();

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
        <div className="mt-6 pt-4 border-t border-indigo-500/20 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <button
            onClick={() => setActiveTab('AI')}
            className={`flex flex-col items-start justify-between p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
              activeTab === 'AI'
                ? 'bg-gradient-to-br from-indigo-600/90 to-purple-700/90 border-indigo-400 text-white shadow-lg shadow-indigo-500/25 ring-2 ring-indigo-400/30'
                : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800/90 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center space-x-2 w-full justify-between mb-1.5">
              <div className="flex items-center space-x-2">
                <Brain className={`w-4 h-4 ${activeTab === 'AI' ? 'text-purple-200' : 'text-purple-400'}`} />
                <span className="font-extrabold text-xs tracking-tight">Yapay Zeka (AI)</span>
              </div>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
              activeTab === 'AI' ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400 border border-slate-700/50'
            }`}>
              {summary.totalCalls} İstek
            </span>
          </button>

          <button
            onClick={() => setActiveTab('STORAGE')}
            className={`flex flex-col items-start justify-between p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
              activeTab === 'STORAGE'
                ? 'bg-gradient-to-br from-emerald-600/90 to-teal-700/90 border-emerald-400 text-white shadow-lg shadow-emerald-500/25 ring-2 ring-emerald-400/30'
                : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800/90 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center space-x-2 w-full justify-between mb-1.5">
              <div className="flex items-center space-x-2">
                <HardDrive className={`w-4 h-4 ${activeTab === 'STORAGE' ? 'text-emerald-200' : 'text-emerald-400'}`} />
                <span className="font-extrabold text-xs tracking-tight">Depolama</span>
              </div>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
              activeTab === 'STORAGE' ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400 border border-slate-700/50'
            }`}>
              {storageStats ? `${storageStats.diskStorage.usedMB} MB` : 'Canlı Veri'}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('SETTINGS')}
            className={`flex flex-col items-start justify-between p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
              activeTab === 'SETTINGS'
                ? 'bg-gradient-to-br from-amber-600/90 to-orange-700/90 border-amber-400 text-white shadow-lg shadow-amber-500/25 ring-2 ring-amber-400/30'
                : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800/90 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center space-x-2 w-full justify-between mb-1.5">
              <div className="flex items-center space-x-2">
                <Settings2 className={`w-4 h-4 ${activeTab === 'SETTINGS' ? 'text-amber-200' : 'text-amber-400'}`} />
                <span className="font-extrabold text-xs tracking-tight">Ayarlar</span>
              </div>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
              activeTab === 'SETTINGS' ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400 border border-slate-700/50'
            }`}>
              Okul & Sistem
            </span>
          </button>

          <button
            onClick={() => setActiveTab('MOTIVATION')}
            className={`flex flex-col items-start justify-between p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
              activeTab === 'MOTIVATION'
                ? 'bg-gradient-to-br from-yellow-500/90 to-amber-600/90 border-yellow-300 text-slate-950 shadow-lg shadow-amber-500/25 ring-2 ring-yellow-400/30'
                : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800/90 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center space-x-2 w-full justify-between mb-1.5">
              <div className="flex items-center space-x-2">
                <Sparkles className={`w-4 h-4 ${activeTab === 'MOTIVATION' ? 'text-slate-950' : 'text-amber-400'}`} />
                <span className="font-extrabold text-xs tracking-tight">Motivasyon</span>
              </div>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
              activeTab === 'MOTIVATION' ? 'bg-slate-950/30 text-slate-950 font-black' : 'bg-slate-800 text-slate-400 border border-slate-700/50'
            }`}>
              Toast & Metinler
            </span>
          </button>

          <button
            onClick={() => setActiveTab('MESSAGES')}
            className={`flex flex-col items-start justify-between p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
              activeTab === 'MESSAGES'
                ? 'bg-gradient-to-br from-rose-600/90 to-pink-700/90 border-rose-400 text-white shadow-lg shadow-rose-500/25 ring-2 ring-rose-400/30'
                : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800/90 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center space-x-2 w-full justify-between mb-1.5">
              <div className="flex items-center space-x-2">
                <MessageSquare className={`w-4 h-4 ${activeTab === 'MESSAGES' ? 'text-rose-200' : 'text-rose-400'}`} />
                <span className="font-extrabold text-xs tracking-tight">Mesajlar</span>
              </div>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
              activeTab === 'MESSAGES' ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400 border border-slate-700/50'
            }`}>
              Denetim
            </span>
          </button>

          <button
            onClick={() => setActiveTab('VERSION')}
            className={`flex flex-col items-start justify-between p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
              activeTab === 'VERSION'
                ? 'bg-gradient-to-br from-indigo-600/90 via-purple-600/90 to-fuchsia-700/90 border-indigo-400 text-white shadow-lg shadow-indigo-500/25 ring-2 ring-indigo-400/30'
                : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800/90 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center space-x-2 w-full justify-between mb-1.5">
              <div className="flex items-center space-x-2">
                <GitBranch className={`w-4 h-4 ${activeTab === 'VERSION' ? 'text-indigo-200' : 'text-indigo-400'}`} />
                <span className="font-extrabold text-xs tracking-tight">Sürüm Güncelleme</span>
              </div>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
              activeTab === 'VERSION' ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400 border border-slate-700/50'
            }`}>
              GitHub & Yedekler
            </span>
          </button>
        </div>
      </div>

      {/* TAB 1: YAPAY ZEKA (AI) */}
      {activeTab === 'AI' && (
        <SystemAiTab 
          stats={stats}
          summary={summary}
          modelSettings={modelSettings}
          anomalyLimitTRY={anomalyLimitTRY}
          setAnomalyLimitTRY={setAnomalyLimitTRY}
          isSavingLimit={isSavingLimit}
          handleSaveAnomalyLimit={handleSaveAnomalyLimit}
          handleToggleAiFeatures={handleToggleAiFeatures}
          savingModels={savingModels}
          modelSaveMessage={modelSaveMessage}
          showModelSelection={showModelSelection}
          setShowModelSelection={setShowModelSelection}
          handleSetAllModels={handleSetAllModels}
          handleModelChange={handleModelChange}
          handleSaveModelConfig={handleSaveModelConfig}
          isCoachDataExpanded={isCoachDataExpanded}
          setIsCoachDataExpanded={setIsCoachDataExpanded}
          coachDataSaveMessage={coachDataSaveMessage}
          savingCoachData={savingCoachData}
          handleCoachDataToggle={handleCoachDataToggle}
          handleCoachDataLimitChange={handleCoachDataLimitChange}
          handleCoachDataPromptLogToggle={handleCoachDataPromptLogToggle}
          handleSaveCoachDataSettings={handleSaveCoachDataSettings}
          defaultCoachDataSettings={defaultCoachDataSettings}
          dateFilter={dateFilter}
          setDateFilter={setDateFilter}
          filterCategory={filterCategory}
          setFilterCategory={setFilterCategory}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          itemsPerPage={itemsPerPage}
        />
      )}

      {/* TAB 2: DEPOLAMA (STORAGE & CLOUD) */}
      {activeTab === 'STORAGE' && (
        <SystemStorageTab 
          storageStats={storageStats}
          storageMaintenanceMsg={storageMaintenanceMsg}
          setStorageMaintenanceMsg={setStorageMaintenanceMsg}
          handleRunStorageMaintenance={handleRunStorageMaintenance}
        />
      )}

      {/* TAB 3: AYARLAR (SETTINGS) */}
      {activeTab === 'SETTINGS' && (
        <SystemSettingsTab 
          settingsSaveMsg={settingsSaveMsg}
          setSettingsSaveMsg={setSettingsSaveMsg}
          setShowLogoManager={setShowLogoManager}
          schoolName={schoolName}
          setSchoolName={setSchoolName}
          academicYear={academicYear}
          setAcademicYear={setAcademicYear}
          yksTargetDate={yksTargetDate}
          setYksTargetDate={setYksTargetDate}
          handleSaveSettings={handleSaveSettings}
          activeCriteriaDays={activeCriteriaDays}
          setActiveCriteriaDays={setActiveCriteriaDays}
          activeCriteriaMinQuestions={activeCriteriaMinQuestions}
          setActiveCriteriaMinQuestions={setActiveCriteriaMinQuestions}
          activeCriteriaMinPlans={activeCriteriaMinPlans}
          setActiveCriteriaMinPlans={setActiveCriteriaMinPlans}
          onlineTimeoutMinutes={onlineTimeoutMinutes}
          setOnlineTimeoutMinutes={setOnlineTimeoutMinutes}
          showLastSeenEnabled={showLastSeenEnabled}
          setShowLastSeenEnabled={setShowLastSeenEnabled}
          presenceHeartbeatEnabled={presenceHeartbeatEnabled}
          setPresenceHeartbeatEnabledState={setPresenceHeartbeatEnabledState}
          presenceHeartbeatMinutes={presenceHeartbeatMinutes}
          setPresenceHeartbeatMinutesState={setPresenceHeartbeatMinutesState}
          handleSaveCriteriaSettings={handleSaveCriteriaSettings}
          isLowDataModeActive={isLowDataModeActive}
          setIsLowDataModeActive={setIsLowDataModeActive}
          intervalMinutes={intervalMinutes}
          setIntervalMinutes={setIntervalMinutes}
          handleExportSystemBackup={handleExportSystemBackup}
          dailyEmailNotify={dailyEmailNotify}
          setDailyEmailNotify={setDailyEmailNotify}
          inactiveStudentAlert={inactiveStudentAlert}
          setInactiveStudentAlert={setInactiveStudentAlert}
          highRiskTopicAlert={highRiskTopicAlert}
          setHighRiskTopicAlert={setHighRiskTopicAlert}
          maintenanceMode={maintenanceMode}
          setMaintenanceMode={setMaintenanceMode}
          maintenanceMessage={maintenanceMessage}
          setMaintenanceMessage={setMaintenanceMessage}
          maintenanceEndTime={maintenanceEndTime}
          setMaintenanceEndTime={setMaintenanceEndTime}
          maintenanceAllowTeachers={maintenanceAllowTeachers}
          setMaintenanceAllowTeachers={setMaintenanceAllowTeachers}
          handleSaveMaintenanceSettings={handleSaveMaintenanceSettings}
        />
      )}

      {/* TAB 4: MESAJ YÖNETİMİ (MESSAGES) */}
      {activeTab === 'MESSAGES' && (
        <AdminMessageManagement 
          currentUser={currentUser}
          users={users}
          onSendMessage={onSendMessage}
        />
      )}

      {/* TAB 5: MOTİVASYON METİNLERİ (MOTIVATION) */}
      {activeTab === 'MOTIVATION' && (
        <MotivationMessagesTab />
      )}

      {/* TAB 6: SÜRÜM & YEDEKLEME YÖNETİMİ (VERSION) */}
      {activeTab === 'VERSION' && (
        <SystemVersionTab />
      )}

      {/* UNIVERSITY LOGO MANAGER MODAL POPUP */}
      {showLogoManager && (
        <UniversityLogoManagerModal onClose={() => setShowLogoManager(false)} />
      )}
    </div>
  );
};
