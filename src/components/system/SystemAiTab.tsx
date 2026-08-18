import React, { useState } from 'react';
import { 
  BarChart2, 
  Coins, 
  Cpu, 
  Brain, 
  Settings2, 
  Activity, 
  LayoutDashboard 
} from 'lucide-react';
import {
  UsageSummary,
  UsageStatsResponse,
  ModelSettingsData,
  CoachDataSettingsMap
} from './SystemTypes';
import { AiOverviewTab } from './ai/AiOverviewTab';
import { AiCostTab } from './ai/AiCostTab';
import { AiStatsTab } from './ai/AiStatsTab';
import { AiModelSettingsTab } from './ai/AiModelSettingsTab';
import { AiQuerySettingsTab } from './ai/AiQuerySettingsTab';
import { AiAuditLogsTab } from './ai/AiAuditLogsTab';

export type AiSubTab = 'overview' | 'cost' | 'stats' | 'models' | 'query' | 'audit_logs';

interface SystemAiTabProps {
  stats: UsageStatsResponse | null;
  summary: UsageSummary;
  modelSettings: ModelSettingsData | null;
  anomalyLimitTRY: number;
  setAnomalyLimitTRY: (val: number) => void;
  isSavingLimit: boolean;
  handleSaveAnomalyLimit: () => Promise<void>;
  handleToggleAiFeatures: (enabled: boolean) => Promise<void>;
  handleToggleAiCoachChat?: (enabled: boolean) => Promise<void>;
  savingModels: boolean;
  modelSaveMessage: string | null;
  showModelSelection: boolean;
  setShowModelSelection: (val: boolean) => void;
  handleSetAllModels: (modelId: string) => void;
  handleModelChange: (featureKey: string, newModelId: string) => void;
  handleSaveModelConfig: () => Promise<void>;
  handleSaveApiKey?: (apiKey: string) => Promise<void>;
  isSavingApiKey?: boolean;
  apiKeySaveMessage?: { text: string; isError?: boolean } | null;
  isCoachDataExpanded: boolean;
  setIsCoachDataExpanded: (val: boolean) => void;
  coachDataSaveMessage: string | null;
  savingCoachData: boolean;
  handleCoachDataToggle: (key: string, enabled: boolean) => void;
  handleCoachDataLimitChange: (key: string, limit: number) => void;
  handleCoachDataPromptLogToggle?: (enabled: boolean) => void;
  handleSaveCoachDataSettings: () => Promise<void>;
  defaultCoachDataSettings: CoachDataSettingsMap;
  dateFilter: '7days' | 'thisMonth' | 'allTime';
  setDateFilter: (filter: '7days' | 'thisMonth' | 'allTime') => void;
  filterCategory: 'ALL' | 'AI_COACH' | 'STUDY_TASK_SUGGEST' | 'QUESTION_ANALYSIS';
  setFilterCategory: (cat: 'ALL' | 'AI_COACH' | 'STUDY_TASK_SUGGEST' | 'QUESTION_ANALYSIS') => void;
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
  handleToggleAiCoachChat,
  savingModels,
  modelSaveMessage,
  showModelSelection,
  setShowModelSelection,
  handleSetAllModels,
  handleModelChange,
  handleSaveModelConfig,
  handleSaveApiKey,
  isSavingApiKey,
  apiKeySaveMessage,
  isCoachDataExpanded,
  setIsCoachDataExpanded,
  coachDataSaveMessage,
  savingCoachData,
  handleCoachDataToggle,
  handleCoachDataLimitChange,
  handleCoachDataPromptLogToggle,
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
  const [activeSubTab, setActiveSubTab] = useState<AiSubTab>('overview');

  const subTabs = [
    { id: 'overview' as const, label: '📊 Özet', icon: LayoutDashboard },
    { id: 'cost' as const, label: '💰 Maliyet', icon: Coins },
    { id: 'stats' as const, label: '📈 İstatistik', icon: BarChart2 },
    { id: 'models' as const, label: '⚙️ Model Ayarları', icon: Cpu },
    { id: 'query' as const, label: '🛠️ Sorgu Ayarları', icon: Settings2 },
    { id: 'audit_logs' as const, label: '👣 Ayakizi', icon: Activity },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* AI SUB-TAB NAVIGATION BAR */}
      <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-2 shadow-xl backdrop-blur-md">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5">
          {subTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer shadow-sm ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 border border-indigo-400/40'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border border-white/10'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-indigo-400'}`} />
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SUB-VIEW RENDERING */}
      {activeSubTab === 'overview' && (
        <AiOverviewTab
          summary={summary}
          stats={stats}
          modelSettings={modelSettings}
          onNavigateSubTab={(sub) => setActiveSubTab(sub)}
        />
      )}

      {activeSubTab === 'cost' && (
        <AiCostTab
          summary={summary}
          stats={stats}
          anomalyLimitTRY={anomalyLimitTRY}
          setAnomalyLimitTRY={setAnomalyLimitTRY}
          isSavingLimit={isSavingLimit}
          handleSaveAnomalyLimit={handleSaveAnomalyLimit}
        />
      )}

      {activeSubTab === 'stats' && (
        <AiStatsTab
          stats={stats}
          dateFilter={dateFilter}
          setDateFilter={setDateFilter}
        />
      )}

      {activeSubTab === 'models' && (
        <AiModelSettingsTab
          modelSettings={modelSettings}
          handleToggleAiFeatures={handleToggleAiFeatures}
          handleToggleAiCoachChat={handleToggleAiCoachChat}
          savingModels={savingModels}
          modelSaveMessage={modelSaveMessage}
          showModelSelection={showModelSelection}
          setShowModelSelection={setShowModelSelection}
          handleSetAllModels={handleSetAllModels}
          handleModelChange={handleModelChange}
          handleSaveModelConfig={handleSaveModelConfig}
          handleSaveApiKey={handleSaveApiKey}
          isSavingApiKey={isSavingApiKey}
          apiKeySaveMessage={apiKeySaveMessage}
        />
      )}

      {activeSubTab === 'query' && (
        <AiQuerySettingsTab
          modelSettings={modelSettings}
          isCoachDataExpanded={isCoachDataExpanded}
          setIsCoachDataExpanded={setIsCoachDataExpanded}
          coachDataSaveMessage={coachDataSaveMessage}
          savingCoachData={savingCoachData}
          handleCoachDataToggle={handleCoachDataToggle}
          handleCoachDataLimitChange={handleCoachDataLimitChange}
          handleCoachDataPromptLogToggle={handleCoachDataPromptLogToggle}
          handleSaveCoachDataSettings={handleSaveCoachDataSettings}
          defaultCoachDataSettings={defaultCoachDataSettings}
        />
      )}

      {activeSubTab === 'audit_logs' && (
        <AiAuditLogsTab
          stats={stats}
          filterCategory={filterCategory}
          setFilterCategory={setFilterCategory}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          itemsPerPage={itemsPerPage}
        />
      )}
    </div>
  );
};
