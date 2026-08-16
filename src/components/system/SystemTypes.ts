import { UserAccount } from '../../types';

export type SystemTab = 'AI' | 'STORAGE' | 'SETTINGS' | 'MESSAGES' | 'MOTIVATION' | 'VERSION';

export interface GitHubVersion {
  tag: string;
  name: string;
  commitSha: string;
  date: string;
  message: string;
  zipballUrl: string;
  isCurrent: boolean;
  author?: string;
}

export interface BackupInfo {
  filename: string;
  filepath: string;
  sizeBytes: number;
  sizeFormatted: string;
  createdAt: string;
  version: string;
  isAuto: boolean;
}

export interface UsageSummary {
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

export interface ModelUsage {
  model: string;
  calls: number;
  totalTokens: number;
  promptTokens: number;
  candidatesTokens: number;
  costUSD: number;
  costTRY: number;
}

export interface FeatureUsage {
  featureKey: string;
  featureName: string;
  category: string;
  calls: number;
  totalTokens: number;
  costTRY: number;
}

export interface ApiUsageLog {
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
  promptText?: string;
  responseText?: string;
  userId?: string;
  userName?: string;
  userRole?: string;
}

export interface UsageStatsResponse {
  success: boolean;
  summary: UsageSummary;
  modelUsage: ModelUsage[];
  featureUsage: FeatureUsage[];
  recentLogs: ApiUsageLog[];
}

export interface CoachDataItemConfig {
  enabled: boolean;
  limit?: number;
}

export type CoachDataSettingsMap = Record<string, CoachDataItemConfig>;

export interface ModelSettingsData {
  success: boolean;
  aiFeaturesEnabled?: boolean;
  savePromptLogs?: boolean;
  config: Record<string, string>;
  availableModels: { id: string; name: string; badge: string }[];
  features: { key: string; name: string; category: string; description: string }[];
  coachDataSettings?: CoachDataSettingsMap;
  hasApiKey?: boolean;
  maskedApiKey?: string;
  hasGroqKey?: boolean;
  maskedGroqKey?: string;
  hasOpenRouterKey?: boolean;
  maskedOpenRouterKey?: string;
  aiProviderMode?: 'AUTO_FALLBACK' | 'GEMINI_ONLY' | 'GROQ_ONLY' | 'OPENROUTER_ONLY';
}

export interface StorageFolderItem {
  path: string;
  label: string;
  description: string;
  bytes: number;
  sizeMB: number;
  fileCount: number;
  percentShare: number;
}

export interface StorageCollectionItem {
  id: string;
  name: string;
  docCount: number;
  sizeKB: number;
  percent: number;
  avgDocSizeKB: number;
  activity: string;
}

export interface StorageStatsResponse {
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

export interface SystemManagementViewProps {
  auditLogs?: any[];
  currentUser?: UserAccount;
  users?: UserAccount[];
  onSendMessage?: (receiverId: string, content: string, attachmentUrl?: string) => void;
}
