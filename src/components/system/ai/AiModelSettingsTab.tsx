import React, { useState, useEffect } from 'react';
import { 
  Key, 
  ShieldCheck, 
  AlertCircle, 
  ExternalLink, 
  Check, 
  Eye, 
  EyeOff, 
  Brain, 
  Sparkles, 
  Bot, 
  Zap, 
  ChevronUp, 
  ChevronDown,
  RefreshCw,
  Cpu,
  Layers,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Play,
  CheckCircle2,
  Server,
  Clock,
  RotateCcw,
  Compass,
  Activity,
  Hourglass,
  Radio,
  FlaskConical,
  Copy,
  CheckCheck,
  PauseCircle,
  PlayCircle,
  X,
  Send,
  Terminal
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
  handleSaveApiKey?: (apiKey: string) => Promise<void>;
  isSavingApiKey?: boolean;
  apiKeySaveMessage?: { text: string; isError?: boolean } | null;
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
  handleSaveModelConfig,
  handleSaveApiKey,
  isSavingApiKey,
  apiKeySaveMessage
}) => {
  // Key inputs
  const [geminiKeyInput, setGeminiKeyInput] = useState('');
  const [showGeminiKey, setShowGeminiKey] = useState(false);

  const [groqKeyInput, setGroqKeyInput] = useState('');
  const [showGroqKey, setShowGroqKey] = useState(false);

  const [openRouterKeyInput, setOpenRouterKeyInput] = useState('');
  const [showOpenRouterKey, setShowOpenRouterKey] = useState(false);

  // Saving states
  const [savingProvider, setSavingProvider] = useState<'gemini' | 'groq' | 'openrouter' | null>(null);
  const [saveMessages, setSaveMessages] = useState<Record<string, { text: string; isError?: boolean }>>({});

  // Testing states
  const [testingProvider, setTestingProvider] = useState<'gemini' | 'groq' | 'openrouter' | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string; modelUsed?: string }>>({});

  // Mode state
  const [providerMode, setProviderMode] = useState<'AUTO_FALLBACK' | 'GEMINI_ONLY' | 'GROQ_ONLY' | 'OPENROUTER_ONLY'>(
    modelSettings?.aiProviderMode || 'AUTO_FALLBACK'
  );
  const [isSavingMode, setIsSavingMode] = useState(false);

  useEffect(() => {
    if (modelSettings?.aiProviderMode) {
      setProviderMode(modelSettings.aiProviderMode);
    }
  }, [modelSettings?.aiProviderMode]);

  // 🚀 Live Failover & Cooldown Management State
  const [failoverData, setFailoverData] = useState<any>(null);
  const [loadingFailover, setLoadingFailover] = useState(false);
  const [isResettingFailover, setIsResettingFailover] = useState(false);
  const [actionModelKey, setActionModelKey] = useState<string | null>(null);
  const [failoverFeedback, setFailoverFeedback] = useState<{ text: string; isError?: boolean } | null>(null);

  const fetchFailoverStatus = async () => {
    try {
      const res = await fetch('/api/gemini/failover-status');
      if (res.ok) {
        const data = await res.json();
        setFailoverData(data);
      }
    } catch (err) {
      console.warn('Failed to fetch failover status:', err);
    }
  };

  useEffect(() => {
    fetchFailoverStatus();
    const interval = setInterval(fetchFailoverStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleResetAllFailover = async () => {
    setIsResettingFailover(true);
    setFailoverFeedback(null);
    try {
      const res = await fetch('/api/gemini/failover-reset', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setFailoverData(data);
        setFailoverFeedback({ text: 'Tüm model limitleri ve bekleme süreleri sıfırlandı. Sıra en baştaki modele alındı.' });
      } else {
        setFailoverFeedback({ text: data.error || 'Sıfırlama başarısız oldu.', isError: true });
      }
    } catch (err: any) {
      setFailoverFeedback({ text: err.message || 'Sunucu hatası', isError: true });
    } finally {
      setIsResettingFailover(false);
    }
  };

  const handleForceActive = async (provider: string, modelId: string) => {
    setActionModelKey(`${provider}:${modelId}`);
    setFailoverFeedback(null);
    try {
      const res = await fetch('/api/gemini/failover-set-active', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, modelId })
      });
      const data = await res.json();
      if (data.success) {
        setFailoverData(data);
        setFailoverFeedback({ text: `${modelId} modeli başarıyla aktif 1. sıraya çekildi!` });
      } else {
        setFailoverFeedback({ text: data.error || 'İşlem başarısız.', isError: true });
      }
    } catch (err: any) {
      setFailoverFeedback({ text: err.message || 'Sunucu hatası', isError: true });
    } finally {
      setActionModelKey(null);
    }
  };

  const handleSetCooldownDuration = async (hours: number) => {
    setFailoverFeedback(null);
    try {
      const res = await fetch('/api/gemini/failover-set-duration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hours })
      });
      const data = await res.json();
      if (data.success) {
        setFailoverData(data);
        setFailoverFeedback({ text: `Model limit bekleme süresi ${hours} saat olarak kaydedildi.` });
      } else {
        setFailoverFeedback({ text: data.error || 'Ayar kaydedilemedi', isError: true });
      }
    } catch (err: any) {
      setFailoverFeedback({ text: err.message || 'Ayar kaydedilemedi', isError: true });
    }
  };

  const handleReorderModel = async (provider: string, modelId: string, direction: 'UP' | 'DOWN') => {
    setActionModelKey(`${provider}:${modelId}:${direction}`);
    setFailoverFeedback(null);
    try {
      const res = await fetch('/api/gemini/failover-reorder-models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, modelId, direction })
      });
      const data = await res.json();
      if (data.success) {
        setFailoverData(data);
        setFailoverFeedback({ text: `Model sırası başarıyla güncellendi.` });
      } else {
        setFailoverFeedback({ text: data.error || 'Sıra değiştirilemedi.', isError: true });
      }
    } catch (err: any) {
      setFailoverFeedback({ text: err.message || 'Sunucu hatası', isError: true });
    } finally {
      setActionModelKey(null);
    }
  };

  // 🧪 Single Model Test & Analysis Modal State
  const [testModalModel, setTestModalModel] = useState<any>(null);
  const [testPromptInput, setTestPromptInput] = useState('YKS 2026 sınavına hazırlanan bir sayısal öğrencisi için 1 haftalık acil matematik çalışma ve motivasyon taktiği ver.');
  const [isTestingModel, setIsTestingModel] = useState(false);
  const [testResultData, setTestResultData] = useState<{ success: boolean; latencyMs?: number; output?: string; error?: string; rawError?: string } | null>(null);
  const [copiedResult, setCopiedResult] = useState(false);

  const handleOpenTestModal = (provName: string, mod: any) => {
    setTestModalModel({
      provider: provName,
      ...mod
    });
    setTestResultData(null);
    setCopiedResult(false);
  };

  const handleCloseTestModal = () => {
    setTestModalModel(null);
    setTestResultData(null);
    setIsTestingModel(false);
    setCopiedResult(false);
  };

  const handleRunModelTest = async () => {
    if (!testModalModel) return;
    setIsTestingModel(true);
    setTestResultData(null);
    try {
      const res = await fetch('/api/gemini/failover-test-model', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: testModalModel.provider,
          modelId: testModalModel.id,
          prompt: testPromptInput
        })
      });
      const data = await res.json();
      setTestResultData(data);
    } catch (err: any) {
      setTestResultData({
        success: false,
        error: err.message || 'Sunucuya bağlanılamadı.',
        latencyMs: 0
      });
    } finally {
      setIsTestingModel(false);
    }
  };

  const handleModalToggleStatus = async (action: 'FORCE_ACTIVE' | 'SET_COOLDOWN' | 'CLEAR_COOLDOWN') => {
    if (!testModalModel) return;
    try {
      const res = await fetch('/api/gemini/failover-toggle-model-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: testModalModel.provider,
          modelId: testModalModel.id,
          action
        })
      });
      const data = await res.json();
      if (data.success) {
        setFailoverData(data);
        const targetProv = (data.providers || []).find((p: any) => p.name === testModalModel.provider);
        const updatedMod = targetProv?.models?.find((m: any) => m.id === testModalModel.id);
        if (updatedMod) {
          setTestModalModel({
            provider: testModalModel.provider,
            ...updatedMod
          });
        }
        setFailoverFeedback({ text: `${testModalModel.name} durumu başarıyla güncellendi!` });
      }
    } catch (err: any) {
      console.warn('Status toggle error:', err);
    }
  };

  const verifiedModels = [
    { id: 'SYSTEM_DEFAULT', name: '⚡ Sistem Otomatik (Önerilen Kalite Zinciri: 3.7 ➔ 3.6 ➔ 3.5 ➔ Pro)', badge: 'Varsayılan & Önerilen' },
    { id: 'gemini-3.7-flash', name: 'Gemini 3.7 Flash (En Gelişmiş Akıl Yürütme & Hızlı)', badge: 'Gelişmiş' },
    { id: 'gemini-3.6-flash', name: 'Gemini 3.6 Flash (Dengeli Hız & Kalite)', badge: 'Dengeli' },
    { id: 'gemini-3.5-flash-lite', name: 'Gemini 3.5 Flash-Lite (En Ekonomik & Ultra Hafif)', badge: 'Ekonomik' },
    { id: 'gemini-3.1-pro', name: 'Gemini 3.1 Pro (Derin Strateji & Ağır Analiz)', badge: 'Pro' }
  ];

  const displayModels = (modelSettings?.availableModels && modelSettings.availableModels.length > 0)
    ? modelSettings.availableModels.filter(m => verifiedModels.some(v => v.id === m.id))
    : verifiedModels;
  const activeModelsList = displayModels.length > 0 ? displayModels : verifiedModels;

  // Single provider save handler
  const handleSaveIndividualKey = async (provider: 'gemini' | 'groq' | 'openrouter', keyValue: string) => {
    if (!keyValue.trim()) return;
    setSavingProvider(provider);
    setSaveMessages(prev => ({ ...prev, [provider]: undefined as any }));

    try {
      const payload: any = {};
      if (provider === 'gemini') payload.geminiApiKey = keyValue.trim();
      if (provider === 'groq') payload.groqApiKey = keyValue.trim();
      if (provider === 'openrouter') payload.openRouterApiKey = keyValue.trim();

      const res = await fetch('/api/gemini/model-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const contentType = res.headers.get('content-type') || '';
      let data: any = {};
      if (contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const rawText = await res.text();
        throw new Error(rawText ? rawText.substring(0, 150) : `Sunucu hatası (${res.status})`);
      }

      if (data.success) {
        setSaveMessages(prev => ({
          ...prev,
          [provider]: { text: `${provider.toUpperCase()} API Anahtarı başarıyla kaydedildi ve aktif edildi!` }
        }));
        if (provider === 'gemini') setGeminiKeyInput('');
        if (provider === 'groq') setGroqKeyInput('');
        if (provider === 'openrouter') setOpenRouterKeyInput('');

        // Also trigger parent callback if available
        if (provider === 'gemini' && handleSaveApiKey) {
          // Handled
        }
      } else {
        setSaveMessages(prev => ({
          ...prev,
          [provider]: { text: data.error || 'Anahtar kaydedilemedi.', isError: true }
        }));
      }
    } catch (err: any) {
      setSaveMessages(prev => ({
        ...prev,
        [provider]: { text: err.message || 'Sunucuya bağlanılamadı.', isError: true }
      }));
    } finally {
      setSavingProvider(null);
    }
  };

  // Provider test handler
  const handleTestProvider = async (provider: 'gemini' | 'groq' | 'openrouter', customKey?: string) => {
    setTestingProvider(provider);
    setTestResults(prev => ({ ...prev, [provider]: undefined as any }));

    try {
      const res = await fetch('/api/gemini/test-provider-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, apiKey: customKey?.trim() || undefined })
      });
      
      const contentType = res.headers.get('content-type') || '';
      let data: any = {};
      if (contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const rawText = await res.text();
        throw new Error(rawText ? rawText.substring(0, 150) : `Sunucu hatası (${res.status})`);
      }

      setTestResults(prev => ({
        ...prev,
        [provider]: {
          success: data.success,
          message: data.message || (data.success ? 'Bağlantı başarılı!' : 'Bağlantı başarısız.'),
          modelUsed: data.modelUsed
        }
      }));
    } catch (err: any) {
      setTestResults(prev => ({
        ...prev,
        [provider]: { success: false, message: err.message || 'Sunucuya bağlanılamadı.' }
      }));
    } finally {
      setTestingProvider(null);
    }
  };

  // Provider mode save handler
  const handleSelectMode = async (mode: 'AUTO_FALLBACK' | 'GEMINI_ONLY' | 'GROQ_ONLY' | 'OPENROUTER_ONLY') => {
    setProviderMode(mode);
    setIsSavingMode(true);
    try {
      await fetch('/api/gemini/model-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aiProviderMode: mode })
      });
    } catch (err) {
      console.error('Failed to save provider mode:', err);
    } finally {
      setIsSavingMode(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. ÜÇLÜ SAĞLAYICI GEÇİŞ MİMARİSİ VE ÇALIŞMA MODU SEÇİCİ */}
      <div className="bg-slate-900/90 border border-indigo-500/40 rounded-3xl p-6 shadow-2xl backdrop-blur-md space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white rounded-2xl shadow-lg shadow-indigo-500/20 border border-indigo-400/30">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <span>Üçlü Akıllı Sağlayıcı Ağ Geçidi (Zero-Cost Failover)</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                  %100 Ücretsiz Havuz
                </span>
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Google Gemini, Groq Cloud ve OpenRouter kotalarını birleştirerek sınırsız ve kesintisiz sıfır maliyetli yapay zeka gücü sağlar.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Çalışma Modu:</span>
            {providerMode === 'AUTO_FALLBACK' && (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm">
                <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
                <span>🔄 Akıllı Otomatik Geçiş (Gemini ➔ Groq ➔ OpenRouter)</span>
              </span>
            )}
            {providerMode === 'GEMINI_ONLY' && (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-sm">
                <Cpu className="w-3.5 h-3.5 text-blue-400" />
                <span>🔷 Yalnızca Google Gemini</span>
              </span>
            )}
            {providerMode === 'GROQ_ONLY' && (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>⚡ Yalnızca Groq Cloud</span>
              </span>
            )}
            {providerMode === 'OPENROUTER_ONLY' && (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm">
                <Server className="w-3.5 h-3.5 text-cyan-400" />
                <span>🌐 Yalnızca OpenRouter :free</span>
              </span>
            )}
            {isSavingMode && (
              <span className="inline-flex items-center gap-1 text-[11px] text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20 font-medium">
                <span className="w-2.5 h-2.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                <span>Kaydediliyor...</span>
              </span>
            )}
          </div>
        </div>

        {/* Canlı Geçiş Hattı Şeması */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Aktif Otomatik Geçiş Hattı (Pipeline)</span>
            <span className="text-indigo-400 font-normal lowercase">istekler sırayla denenir</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
            {/* 1. Sıra: Gemini */}
            <div className={`p-3 rounded-xl border transition-all flex items-center justify-between ${
              modelSettings?.hasApiKey 
                ? 'bg-indigo-950/40 border-indigo-500/40 text-indigo-200' 
                : 'bg-slate-900/60 border-slate-800 text-slate-400 opacity-60'
            }`}>
              <div className="flex items-center space-x-2.5">
                <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow">1</span>
                <div>
                  <div className="font-bold text-xs text-white">Google Gemini</div>
                  <div className="text-[10px] text-slate-300">Birincil Vision Motoru</div>
                </div>
              </div>
              {modelSettings?.hasApiKey ? (
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded border border-emerald-500/30">Aktif</span>
              ) : (
                <span className="text-[10px] bg-rose-500/20 text-rose-300 font-bold px-2 py-0.5 rounded border border-rose-500/30">Anahtar Yok</span>
              )}
            </div>

            {/* 2. Sıra: Groq */}
            <div className={`p-3 rounded-xl border transition-all flex items-center justify-between ${
              modelSettings?.hasGroqKey 
                ? 'bg-amber-950/40 border-amber-500/40 text-amber-200' 
                : 'bg-slate-900/60 border-slate-800 text-slate-400 opacity-60'
            }`}>
              <div className="flex items-center space-x-2.5">
                <span className="w-6 h-6 rounded-lg bg-amber-600 text-white font-bold text-xs flex items-center justify-center shadow">2</span>
                <div>
                  <div className="font-bold text-xs text-white">Groq Cloud</div>
                  <div className="text-[10px] text-slate-300">Ultra Hızlı Llama 3.2/3.3</div>
                </div>
              </div>
              {modelSettings?.hasGroqKey ? (
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded border border-emerald-500/30">Aktif</span>
              ) : (
                <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded border border-amber-500/30">Yedek Bekliyor</span>
              )}
            </div>

            {/* 3. Sıra: OpenRouter */}
            <div className={`p-3 rounded-xl border transition-all flex items-center justify-between ${
              modelSettings?.hasOpenRouterKey 
                ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-200' 
                : 'bg-slate-900/60 border-slate-800 text-slate-400 opacity-60'
            }`}>
              <div className="flex items-center space-x-2.5">
                <span className="w-6 h-6 rounded-lg bg-cyan-600 text-white font-bold text-xs flex items-center justify-center shadow">3</span>
                <div>
                  <div className="font-bold text-xs text-white">OpenRouter :free</div>
                  <div className="text-[10px] text-slate-300">Limitsiz DeepSeek / Qwen</div>
                </div>
              </div>
              {modelSettings?.hasOpenRouterKey ? (
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded border border-emerald-500/30">Aktif</span>
              ) : (
                <span className="text-[10px] bg-cyan-500/20 text-cyan-300 font-bold px-2 py-0.5 rounded border border-cyan-500/30">Yedek Bekliyor</span>
              )}
            </div>
          </div>
        </div>

        {/* Çalışma Modu Seçici Butonları */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300">Geçiş & Öncelik Tercihi Seçimi:</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => handleSelectMode('AUTO_FALLBACK')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                providerMode === 'AUTO_FALLBACK'
                  ? 'bg-indigo-600/30 border-indigo-400 text-white shadow-lg shadow-indigo-600/20 ring-1 ring-indigo-400'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <div className="font-bold text-xs flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
                <span>🔄 Akıllı Otomatik Geçiş</span>
              </div>
              <p className="text-[11px] text-slate-300 mt-1">Önerilen: Gemini ➔ Groq ➔ OpenRouter</p>
            </button>

            <button
              type="button"
              onClick={() => handleSelectMode('GEMINI_ONLY')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                providerMode === 'GEMINI_ONLY'
                  ? 'bg-blue-600/30 border-blue-400 text-white shadow-lg shadow-blue-600/20 ring-1 ring-blue-400'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <div className="font-bold text-xs flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-blue-400" />
                <span>🔷 Yalnızca Gemini</span>
              </div>
              <p className="text-[11px] text-slate-300 mt-1">Sadece Google Gemini API kullanır.</p>
            </button>

            <button
              type="button"
              onClick={() => handleSelectMode('GROQ_ONLY')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                providerMode === 'GROQ_ONLY'
                  ? 'bg-amber-600/30 border-amber-400 text-white shadow-lg shadow-amber-600/20 ring-1 ring-amber-400'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <div className="font-bold text-xs flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>⚡ Yalnızca Groq</span>
              </div>
              <p className="text-[11px] text-slate-300 mt-1">Sadece Groq Cloud modellerini kullanır.</p>
            </button>

            <button
              type="button"
              onClick={() => handleSelectMode('OPENROUTER_ONLY')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                providerMode === 'OPENROUTER_ONLY'
                  ? 'bg-cyan-600/30 border-cyan-400 text-white shadow-lg shadow-cyan-600/20 ring-1 ring-cyan-400'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <div className="font-bold text-xs flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-cyan-400" />
                <span>🌐 Yalnızca OpenRouter</span>
              </div>
              <p className="text-[11px] text-slate-300 mt-1">Sadece OpenRouter :free havuzunu kullanır.</p>
            </button>
          </div>
        </div>
      </div>

      {/* 🧭 CANLI MODEL SIRASI & AKILLI FAILOVER PANELİ (CIRCUIT BREAKER) */}
      <div className="bg-slate-900/90 border border-slate-800/80 rounded-3xl p-6 shadow-2xl backdrop-blur-md relative overflow-hidden space-y-5">
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-tr from-indigo-600/30 to-purple-600/30 text-indigo-400 rounded-2xl border border-indigo-500/30 shadow-inner">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Canlı Model Sırası & Akıllı Failover Durumu</span>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                    <Radio className="w-2.5 h-2.5 animate-pulse text-emerald-400" />
                    Canlı Takip
                  </span>
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Model kotası dolduğunda her seferinde en baştan denemek yerine kalan süre boyunca sıradaki aktif modelden kesintisiz devam edilir.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Cooldown duration selector */}
            <div className="flex items-center gap-2 bg-slate-950/70 border border-slate-800 px-3 py-1.5 rounded-xl">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-xs text-slate-300 font-medium">Limit Bekleme Süresi:</span>
              <select
                value={failoverData?.cooldownHours || 24}
                onChange={(e) => handleSetCooldownDuration(Number(e.target.value))}
                className="bg-slate-900 text-indigo-300 font-bold text-xs border border-slate-700 rounded-lg px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-indigo-400 cursor-pointer"
              >
                <option value={1}>1 Saat</option>
                <option value={6}>6 Saat</option>
                <option value={12}>12 Saat</option>
                <option value={24}>24 Saat (1 Gün)</option>
                <option value={48}>48 Saat (2 Gün)</option>
                <option value={72}>72 Saat (3 Gün)</option>
              </select>
            </div>

            {/* Reset All button */}
            <button
              type="button"
              onClick={handleResetAllFailover}
              disabled={isResettingFailover}
              className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 hover:text-white border border-indigo-500/40 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 disabled:opacity-50"
              title="Tüm sağlayıcıların ve modellerin bekleme listesini sıfırlar ve 1. sıraya çeker"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isResettingFailover ? 'animate-spin' : ''}`} />
              <span>Sırayı Başa Al & Sıfırla</span>
            </button>
          </div>
        </div>

        {failoverFeedback && (
          <div className={`p-3 rounded-2xl border text-xs flex items-center justify-between animate-in fade-in slide-in-from-top-1 ${
            failoverFeedback.isError
              ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
              : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
          }`}>
            <div className="flex items-center gap-2">
              {failoverFeedback.isError ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>{failoverFeedback.text}</span>
            </div>
            <button onClick={() => setFailoverFeedback(null)} className="text-slate-400 hover:text-white text-xs font-bold px-2 py-0.5">✕</button>
          </div>
        )}

        {/* 3 Provider Flow Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {(failoverData?.providers || [
            { name: 'GEMINI', displayName: 'Google Gemini', isActiveProvider: true, isCompletelyExhausted: false, activeModelId: 'gemini-3.7-flash', models: [] },
            { name: 'GROQ', displayName: 'Groq Cloud', isActiveProvider: false, isCompletelyExhausted: false, activeModelId: 'openai/gpt-oss-120b', models: [] },
            { name: 'OPENROUTER', displayName: 'OpenRouter :free', isActiveProvider: false, isCompletelyExhausted: false, activeModelId: 'google/gemma-4-31b-it:free', models: [] }
          ]).map((prov: any) => {
            const isCurrentActiveProvider = failoverData?.activeProvider === prov.name;
            const isExhausted = prov.isCompletelyExhausted;

            return (
              <div
                key={prov.name}
                className={`rounded-2xl border p-4 flex flex-col justify-between space-y-3 transition-all ${
                  isCurrentActiveProvider
                    ? 'bg-slate-950/90 border-indigo-500/60 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500/40'
                    : isExhausted
                    ? 'bg-rose-950/10 border-rose-900/40 opacity-75'
                    : 'bg-slate-950/50 border-slate-800/80'
                }`}
              >
                {/* Header */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                    <h4 className="font-bold text-white text-xs">{prov.displayName}</h4>
                  </div>
                  {isCurrentActiveProvider ? (
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-extrabold px-2 py-0.5 rounded-full border border-emerald-500/40 flex items-center gap-1">
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      Aktif Sağlayıcı
                    </span>
                  ) : isExhausted ? (
                    <span className="text-[10px] bg-rose-500/20 text-rose-300 font-bold px-2 py-0.5 rounded-full border border-rose-500/30">
                      Tüm Modeller Dolu
                    </span>
                  ) : (
                    <span className="text-[10px] bg-slate-800 text-slate-400 font-medium px-2 py-0.5 rounded-full">
                      Yedek Sırada
                    </span>
                  )}
                </div>

                {/* Model Sequence List */}
                <div className="space-y-3">
                  {(prov.models || []).map((mod: any, idx: number) => {
                    const isModActive = mod.isActive;
                    const isModInCooldown = mod.isInCooldown;
                    const isOperating = actionModelKey?.startsWith(`${prov.name}:${mod.id}`);
                    const totalModels = prov.models?.length || 0;

                    return (
                      <div
                        key={mod.id}
                        className={`p-3.5 rounded-2xl border text-xs transition-all flex flex-col gap-2.5 ${
                          isModActive
                            ? 'bg-indigo-950/50 border-indigo-500/60 text-white shadow-md shadow-indigo-500/10 ring-1 ring-indigo-500/30'
                            : isModInCooldown
                            ? 'bg-rose-950/20 border-rose-800/40 text-slate-300'
                            : 'bg-slate-900/70 border-slate-800/70 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        {/* 1. EN ÜST SATIR (TEK BAŞINA): Sıra No + Model Tam İsmi + Vision Rozeti */}
                        <div className="flex items-center justify-between gap-2 pb-1 border-b border-slate-800/50">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className="text-xs font-black font-mono text-indigo-400 bg-indigo-950/90 border border-indigo-500/40 px-2 py-0.5 rounded-lg shrink-0">
                              {idx + 1}
                            </span>
                            <span className="font-bold text-sm text-white tracking-wide break-words">
                              {mod.name}
                            </span>
                          </div>
                          {mod.isVisionCapable && (
                            <span className="text-indigo-300 text-[10px] font-semibold bg-indigo-500/20 border border-indigo-500/30 px-2 py-0.5 rounded-md shrink-0 flex items-center gap-1">
                              <span>📷 Vision</span>
                            </span>
                          )}
                        </div>

                        {/* 2. ORTA SATIR: Model Açıklaması & Rozeti */}
                        <div className="flex flex-col gap-1 text-[11px] pl-1">
                          <div className="flex items-center gap-1.5">
                            {mod.badge && (
                              <span className="font-semibold text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-indigo-300 border border-indigo-500/30 shrink-0">
                                {mod.badge}
                              </span>
                            )}
                          </div>
                          {mod.description && (
                            <p className="text-slate-300 text-xs leading-relaxed mt-0.5">
                              {mod.description}
                            </p>
                          )}
                        </div>

                        {/* 3. ALT SATIR: Canlı Durum (Sol) ve İşlem Butonları (Sağ) */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/60 mt-0.5">
                          {/* Durum Göstergesi */}
                          <div className="flex items-center text-xs font-medium">
                            {isModInCooldown ? (
                              <span className="text-rose-300 flex items-center gap-1.5 font-medium">
                                <Hourglass className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                                <span>Limit Doldu ({mod.remainingFormatted || '24h'} kaldı)</span>
                              </span>
                            ) : isModActive ? (
                              <span className="text-emerald-400 flex items-center gap-1.5 font-semibold">
                                <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                                <span>Şu Anda Aktif Model</span>
                              </span>
                            ) : (
                              <span className="text-slate-400 flex items-center gap-1.5 text-[11px]">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                                <span>Sırada Bekliyor</span>
                              </span>
                            )}
                          </div>

                          {/* Buton Grubu: Test Et + Sıralama (Yukarı / Aşağı) & Önceliğe Al */}
                          <div className="flex items-center gap-1.5 ml-auto">
                            {/* Test Et Butonu */}
                            <button
                              type="button"
                              onClick={() => handleOpenTestModal(prov.name, mod)}
                              className="px-2.5 py-1 rounded-xl bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 hover:text-white border border-indigo-500/40 transition-all cursor-pointer shadow-sm flex items-center gap-1 text-xs font-bold"
                              title="Bu modelin çıktısını test et ve açılır pencerede incele"
                            >
                              <FlaskConical className="w-3.5 h-3.5 text-indigo-400" />
                              <span>Test Et</span>
                            </button>

                            {/* Yukarı Taşı */}
                            <button
                              type="button"
                              onClick={() => handleReorderModel(prov.name, mod.id, 'UP')}
                              disabled={idx === 0 || isOperating}
                              className="p-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer shadow-sm"
                              title="Bu modeli 1 sıra yukarı taşı (önceliğini artır)"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>

                            {/* Aşağı Taşı */}
                            <button
                              type="button"
                              onClick={() => handleReorderModel(prov.name, mod.id, 'DOWN')}
                              disabled={idx === totalModels - 1 || isOperating}
                              className="p-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer shadow-sm"
                              title="Bu modeli 1 sıra aşağı taşı"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>

                            {/* Önceliğe Al / Aktif Yap Butonu */}
                            <button
                              type="button"
                              onClick={() => handleForceActive(prov.name, mod.id)}
                              disabled={isModActive || isOperating}
                              className={`text-xs font-bold px-3 py-1 rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
                                isModActive
                                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 cursor-default shadow-sm'
                                  : 'bg-indigo-600/30 hover:bg-indigo-600/50 border-indigo-500/40 text-indigo-200 hover:text-white active:scale-95'
                              }`}
                              title="Bu modeli sıranın en başına al ve bekleme süresi varsa temizle"
                            >
                              {isOperating ? (
                                <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                              ) : isModActive ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>Aktif</span>
                                </>
                              ) : (
                                <>
                                  <Play className="w-3.5 h-3.5" />
                                  <span>Önceliğe Al</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. ÜÇ AYRI API ANAHTARI YÖNETİM KARTLARI */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* KART 1: GOOGLE GEMINI */}
        <div className="bg-slate-900/90 border border-indigo-500/40 rounded-3xl p-5 shadow-xl backdrop-blur-md flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-indigo-600/30 text-indigo-400 rounded-xl border border-indigo-500/30">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">Google Gemini</h4>
                  <p className="text-[10px] text-slate-400">Günde 1.500 Ücretsiz İstek</p>
                </div>
              </div>
              {modelSettings?.hasApiKey ? (
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  {modelSettings.maskedApiKey || 'Aktif'}
                </span>
              ) : (
                <span className="text-[10px] bg-rose-500/20 text-rose-300 font-bold px-2 py-0.5 rounded-full border border-rose-500/30 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Tanımsız
                </span>
              )}
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              YKS soru fotoğrafları çözümü, vision OCR ve koçluk için birincil motor.
            </p>

            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 underline font-medium"
            >
              <span>Google AI Studio'dan Ücretsiz Key Al</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            {saveMessages['gemini'] && (
              <div className={`text-xs p-2 rounded-xl border ${saveMessages['gemini'].isError ? 'bg-rose-500/20 border-rose-500/40 text-rose-300' : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'}`}>
                {saveMessages['gemini'].text}
              </div>
            )}

            {testResults['gemini'] && (
              <div className={`text-xs p-2 rounded-xl border ${testResults['gemini'].success ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' : 'bg-rose-500/20 border-rose-500/40 text-rose-300'}`}>
                {testResults['gemini'].message}
              </div>
            )}

            <div className="relative">
              <input
                type={showGeminiKey ? 'text' : 'password'}
                value={geminiKeyInput}
                onChange={(e) => setGeminiKeyInput(e.target.value)}
                placeholder={modelSettings?.hasApiKey ? `Mevcut: ${modelSettings.maskedApiKey}` : 'AIzaSy... anahtarınızı yapıştırın'}
                className="w-full bg-slate-950/90 text-white placeholder-slate-500 text-xs font-mono px-3.5 py-2.5 rounded-xl border border-slate-700 focus:border-indigo-500 focus:outline-none pr-9"
              />
              <button
                type="button"
                onClick={() => setShowGeminiKey(!showGeminiKey)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1"
              >
                {showGeminiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              disabled={savingProvider === 'gemini' || !geminiKeyInput.trim()}
              onClick={() => handleSaveIndividualKey('gemini', geminiKeyInput)}
              className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow"
            >
              {savingProvider === 'gemini' ? <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              <span>Kaydet</span>
            </button>

            <button
              type="button"
              disabled={testingProvider === 'gemini' || (!geminiKeyInput.trim() && !modelSettings?.hasApiKey)}
              onClick={() => handleTestProvider('gemini', geminiKeyInput)}
              className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 border border-slate-700"
              title="Canlı Bağlantıyı Test Et"
            >
              {testingProvider === 'gemini' ? <span className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" /> : <Zap className="w-3.5 h-3.5 text-indigo-400" />}
              <span>Test</span>
            </button>
          </div>
        </div>

        {/* KART 2: GROQ CLOUD */}
        <div className="bg-slate-900/90 border border-amber-500/40 rounded-3xl p-5 shadow-xl backdrop-blur-md flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-amber-600/30 text-amber-400 rounded-xl border border-amber-500/30">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">Groq Cloud</h4>
                  <p className="text-[10px] text-slate-400">Ultra Hızlı LPU Çıkarsama</p>
                </div>
              </div>
              {modelSettings?.hasGroqKey ? (
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  {modelSettings.maskedGroqKey || 'Aktif'}
                </span>
              ) : (
                <span className="text-[10px] bg-rose-500/20 text-rose-300 font-bold px-2 py-0.5 rounded-full border border-rose-500/30 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Tanımsız
                </span>
              )}
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Llama 3.2 Vision ve Llama 3.3 70B modelleriyle saniyenin altında yanıt veren yedek motor.
            </p>

            <a
              href="https://console.groq.com/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 underline font-medium"
            >
              <span>Groq Console'dan Ücretsiz Key Al</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            {saveMessages['groq'] && (
              <div className={`text-xs p-2 rounded-xl border ${saveMessages['groq'].isError ? 'bg-rose-500/20 border-rose-500/40 text-rose-300' : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'}`}>
                {saveMessages['groq'].text}
              </div>
            )}

            {testResults['groq'] && (
              <div className={`text-xs p-2 rounded-xl border ${testResults['groq'].success ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' : 'bg-rose-500/20 border-rose-500/40 text-rose-300'}`}>
                {testResults['groq'].message}
              </div>
            )}

            <div className="relative">
              <input
                type={showGroqKey ? 'text' : 'password'}
                value={groqKeyInput}
                onChange={(e) => setGroqKeyInput(e.target.value)}
                placeholder={modelSettings?.hasGroqKey ? `Mevcut: ${modelSettings.maskedGroqKey}` : 'gsk_... anahtarınızı yapıştırın'}
                className="w-full bg-slate-950/90 text-white placeholder-slate-500 text-xs font-mono px-3.5 py-2.5 rounded-xl border border-slate-700 focus:border-amber-500 focus:outline-none pr-9"
              />
              <button
                type="button"
                onClick={() => setShowGroqKey(!showGroqKey)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1"
              >
                {showGroqKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              disabled={savingProvider === 'groq' || !groqKeyInput.trim()}
              onClick={() => handleSaveIndividualKey('groq', groqKeyInput)}
              className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow"
            >
              {savingProvider === 'groq' ? <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              <span>Kaydet</span>
            </button>

            <button
              type="button"
              disabled={testingProvider === 'groq' || (!groqKeyInput.trim() && !modelSettings?.hasGroqKey)}
              onClick={() => handleTestProvider('groq', groqKeyInput)}
              className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 border border-slate-700"
              title="Canlı Bağlantıyı Test Et"
            >
              {testingProvider === 'groq' ? <span className="w-3.5 h-3.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" /> : <Zap className="w-3.5 h-3.5 text-amber-400" />}
              <span>Test</span>
            </button>
          </div>
        </div>

        {/* KART 3: OPENROUTER */}
        <div className="bg-slate-900/90 border border-cyan-500/40 rounded-3xl p-5 shadow-xl backdrop-blur-md flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-cyan-600/30 text-cyan-400 rounded-xl border border-cyan-500/30">
                  <Server className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">OpenRouter</h4>
                  <p className="text-[10px] text-slate-400">Limitsiz :free Model Havuzu</p>
                </div>
              </div>
              {modelSettings?.hasOpenRouterKey ? (
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  {modelSettings.maskedOpenRouterKey || 'Aktif'}
                </span>
              ) : (
                <span className="text-[10px] bg-rose-500/20 text-rose-300 font-bold px-2 py-0.5 rounded-full border border-rose-500/30 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Tanımsız
                </span>
              )}
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              DeepSeek-R1 ve Qwen-2.5-VL gibi açık kaynaklı devasa ücretsiz modellere erişim sağlayan 3. kademe motor.
            </p>

            <a
              href="https://openrouter.ai/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 underline font-medium"
            >
              <span>OpenRouter'dan Ücretsiz Key Al</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            {saveMessages['openrouter'] && (
              <div className={`text-xs p-2 rounded-xl border ${saveMessages['openrouter'].isError ? 'bg-rose-500/20 border-rose-500/40 text-rose-300' : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'}`}>
                {saveMessages['openrouter'].text}
              </div>
            )}

            {testResults['openrouter'] && (
              <div className={`text-xs p-2 rounded-xl border ${testResults['openrouter'].success ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' : 'bg-rose-500/20 border-rose-500/40 text-rose-300'}`}>
                {testResults['openrouter'].message}
              </div>
            )}

            <div className="relative">
              <input
                type={showOpenRouterKey ? 'text' : 'password'}
                value={openRouterKeyInput}
                onChange={(e) => setOpenRouterKeyInput(e.target.value)}
                placeholder={modelSettings?.hasOpenRouterKey ? `Mevcut: ${modelSettings.maskedOpenRouterKey}` : 'sk-or-v1-... anahtarınızı yapıştırın'}
                className="w-full bg-slate-950/90 text-white placeholder-slate-500 text-xs font-mono px-3.5 py-2.5 rounded-xl border border-slate-700 focus:border-cyan-500 focus:outline-none pr-9"
              />
              <button
                type="button"
                onClick={() => setShowOpenRouterKey(!showOpenRouterKey)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1"
              >
                {showOpenRouterKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              disabled={savingProvider === 'openrouter' || !openRouterKeyInput.trim()}
              onClick={() => handleSaveIndividualKey('openrouter', openRouterKeyInput)}
              className="flex-1 py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow"
            >
              {savingProvider === 'openrouter' ? <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              <span>Kaydet</span>
            </button>

            <button
              type="button"
              disabled={testingProvider === 'openrouter' || (!openRouterKeyInput.trim() && !modelSettings?.hasOpenRouterKey)}
              onClick={() => handleTestProvider('openrouter', openRouterKeyInput)}
              className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 border border-slate-700"
              title="Canlı Bağlantıyı Test Et"
            >
              {testingProvider === 'openrouter' ? <span className="w-3.5 h-3.5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" /> : <Zap className="w-3.5 h-3.5 text-cyan-400" />}
              <span>Test</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. YAPAY ZEKA MODÜLLERİ VE MODEL SEÇİMİ YÖNETİM PANELI */}
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
                Sistemdeki her bir yapay zeka alanının (Koçluk, Soru Çözümü, Benzer Soru Üretimi vb.) hangi modeli kullanacağını özelleştirin.
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
          <div className="space-y-6 pt-4 border-t border-slate-800 animate-fade-in">
            {/* Hızlı Toplu Model Seçimi */}
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span>Hızlı Toplu Model Seçimi:</span>
                </span>
                <span className="text-[11px] text-slate-400">Tek tıkla tüm modülleri ayarlayın</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
                <button
                  type="button"
                  onClick={() => handleSetAllModels('SYSTEM_DEFAULT')}
                  className="px-3 py-2 bg-gradient-to-r from-purple-600/30 to-indigo-600/30 hover:from-purple-600/50 hover:to-indigo-600/50 text-white border border-purple-400/50 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm ring-1 ring-purple-400/30"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-purple-300" />
                  <span>⚡ Sistem Otomatik</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSetAllModels('gemini-3.7-flash')}
                  className="px-3 py-2 bg-amber-600/20 hover:bg-amber-600/40 text-amber-200 border border-amber-500/40 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>🎯 3.7 Flash</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSetAllModels('gemini-3.6-flash')}
                  className="px-3 py-2 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-200 border border-emerald-500/40 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>🚀 3.6 Flash</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSetAllModels('gemini-3.5-flash-lite')}
                  className="px-3 py-2 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-200 border border-indigo-500/40 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Zap className="w-3.5 h-3.5 text-indigo-400" />
                  <span>⚡ 3.5 Flash-Lite</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSetAllModels('gemini-3.1-pro')}
                  className="px-3 py-2 bg-purple-600/20 hover:bg-purple-600/40 text-purple-200 border border-purple-500/40 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Brain className="w-3.5 h-3.5 text-purple-400" />
                  <span>🧠 3.1 Pro</span>
                </button>
              </div>
            </div>

            {/* Feature Selectors Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {modelSettings?.features.map((feat) => {
                const currentModelId = modelSettings.config?.[feat.key] || 'SYSTEM_DEFAULT';
                const isAuto = currentModelId === 'SYSTEM_DEFAULT' || !currentModelId;
                return (
                  <div 
                    key={feat.key} 
                    className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-3 shadow-inner"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-bold text-xs text-white flex items-center gap-1.5">
                          <span>{feat.name}</span>
                        </h4>
                        <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-700 shrink-0">
                          {feat.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                        {feat.description}
                      </p>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Kullanılacak Model:
                        </label>
                        {isAuto ? (
                          <span className="text-[10px] bg-purple-500/20 text-purple-300 font-bold px-2 py-0.5 rounded border border-purple-500/30 flex items-center gap-1">
                            <RefreshCw className="w-2.5 h-2.5" />
                            Otomatik Kalite Zinciri
                          </span>
                        ) : (
                          <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded border border-amber-500/30">
                            Sabit Tercih
                          </span>
                        )}
                      </div>
                      <select
                        value={currentModelId}
                        onChange={(e) => handleModelChange(feat.key, e.target.value)}
                        className="w-full bg-slate-900 text-white text-xs font-medium px-3 py-2 rounded-xl border border-slate-700 focus:border-purple-500 focus:outline-none cursor-pointer"
                      >
                        {activeModelsList.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} {m.badge ? `[${m.badge}]` : ''}
                          </option>
                        ))}
                      </select>
                      {isAuto ? (
                        <p className="text-[10px] text-indigo-300/90 mt-1.5 flex items-center gap-1">
                          <span>🔄</span>
                          <span>Gemini 3.7 Flash ile başlar, kota dolarsa 3.6 ➔ 3.5 ➔ Pro'ya otomatik geçer.</span>
                        </p>
                      ) : (
                        <p className="text-[10px] text-amber-300/90 mt-1.5 flex items-center gap-1">
                          <span>🛡️</span>
                          <span>Öncelikli modeldir; kotası dolarsa sistem anında sıradaki modele kesintisiz geçer.</span>
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Save Config Button */}
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleSaveModelConfig}
                disabled={savingModels}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-purple-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center space-x-2"
              >
                {savingModels ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Kaydediliyor...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Model Tercihlerini Kaydet & Aktifleştir</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 🧪 SINGLE MODEL TEST & OUTPUT INTERPRETATION MODAL */}
      {testModalModel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-indigo-500/50 rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden relative">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/70">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
                  <FlaskConical className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">
                      {testModalModel.name}
                    </h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-indigo-950 text-indigo-300 border border-indigo-500/40">
                      {testModalModel.provider}
                    </span>
                    {testModalModel.isVisionCapable && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        📷 Vision
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Model Çıktı Testi, Hız Ölçümü & Erken Aktif/Pasif Yönetimi
                  </p>
                </div>
              </div>

              <button
                onClick={handleCloseTestModal}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Durum & Erken Aksiyon Barı */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-xs text-slate-400 font-medium">Modelin Sistemdeki Anlık Durumu:</div>
                  <div className="mt-1">
                    {testModalModel.isInCooldown ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-300 bg-rose-500/20 border border-rose-500/40 px-3 py-1 rounded-xl">
                        <Hourglass className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                        <span>Limit Doldu / Devre Dışı ({testModalModel.remainingFormatted || 'Beklemede'})</span>
                      </span>
                    ) : testModalModel.isActive ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-500/40 px-3 py-1 rounded-xl">
                        <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                        <span>🟢 Şu Anda 1. Sırada Aktif Kullanılan Model</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-300 bg-slate-800 border border-slate-700 px-3 py-1 rounded-xl">
                        <span>⚪ Sırada Bekliyor (Hazır / Yedek)</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Erken Aktif / Pasif Butonları */}
                <div className="flex flex-wrap items-center gap-2">
                  {!testModalModel.isActive && (
                    <button
                      type="button"
                      onClick={() => handleModalToggleStatus('FORCE_ACTIVE')}
                      className="px-3 py-1.5 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 hover:text-white border border-emerald-500/40 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                      title="Bu modeli doğrudan 1. sıraya alır ve varsa bekleme süresini sıfırlar"
                    >
                      <PlayCircle className="w-4 h-4 text-emerald-400" />
                      <span>1. Sıraya Al & Aktif Et</span>
                    </button>
                  )}

                  {testModalModel.isInCooldown ? (
                    <button
                      type="button"
                      onClick={() => handleModalToggleStatus('CLEAR_COOLDOWN')}
                      className="px-3 py-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 hover:text-white border border-indigo-500/40 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                      title="Bekleme süresini sıfırlar ve modeli tekrar hazır duruma getirir"
                    >
                      <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                      <span>Beklemeyi Kaldır (Hazır Yap)</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleModalToggleStatus('SET_COOLDOWN')}
                      className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 hover:text-white border border-rose-500/40 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                      title="Modeli manuel olarak bekleme havuzuna alır (isteklerde kullanılmaz)"
                    >
                      <PauseCircle className="w-4 h-4 text-rose-400" />
                      <span>Manuel Pasife Al (Devre Dışı)</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Test Prompt Input */}
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Test İstemi (Prompt):</span>
                  </label>
                  {/* Quick Presets */}
                  <div className="flex flex-wrap items-center gap-1 text-[10px]">
                    <span className="text-slate-500">Hazır Şablonlar:</span>
                    <button
                      type="button"
                      onClick={() => setTestPromptInput('YKS 2026 sınavına hazırlanan bir sayısal öğrencisi için 1 haftalık acil matematik çalışma ve motivasyon taktiği ver.')}
                      className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-all cursor-pointer"
                    >
                      Matematik Tavsiyesi
                    </button>
                    <button
                      type="button"
                      onClick={() => setTestPromptInput('TYT Türkçe paragraf netlerini 30+ seviyesine çıkarmak için 3 somut strateji yaz.')}
                      className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-all cursor-pointer"
                    >
                      Paragraf Stratejisi
                    </button>
                    <button
                      type="button"
                      onClick={() => setTestPromptInput('Sistem testi: 12 ile 18 sayılarının EKOK ve EBOB değerlerini açıkla.')}
                      className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-all cursor-pointer"
                    >
                      Hızlı Matematik
                    </button>
                  </div>
                </div>

                <textarea
                  value={testPromptInput}
                  onChange={(e) => setTestPromptInput(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-2xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-400 leading-relaxed font-mono"
                  placeholder="Modele gönderilecek test promptunu buraya yazın..."
                />
              </div>

              {/* Test Start Button & Latency */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {testResultData && (
                    <div className="flex items-center gap-2 text-xs">
                      {testResultData.success ? (
                        <span className="px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Cevap Başarılı</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>Hata Oluştu</span>
                        </span>
                      )}
                      {typeof testResultData.latencyMs === 'number' && testResultData.latencyMs > 0 && (
                        <span className="px-2.5 py-1 rounded-xl bg-slate-800 text-indigo-300 border border-slate-700 font-mono font-bold flex items-center gap-1">
                          <Zap className="w-3 h-3 text-amber-400" />
                          <span>{testResultData.latencyMs} ms</span>
                          <span className="text-[10px] text-slate-400">({(testResultData.latencyMs / 1000).toFixed(2)} sn)</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleRunModelTest}
                  disabled={isTestingModel || !testPromptInput.trim()}
                  className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-2xl text-xs font-bold transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
                >
                  {isTestingModel ? (
                    <>
                      <RotateCcw className="w-4 h-4 animate-spin" />
                      <span>Model Çalıştırılıyor...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Testi Başlat & Çıktıyı İncele</span>
                    </>
                  )}
                </button>
              </div>

              {/* Model Output / Error Inspection Box */}
              {testResultData && (
                <div className="space-y-2 animate-fade-in pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <span>Model Çıktısı & Cevap Analizi:</span>
                    </span>
                    {testResultData.output && (
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(testResultData.output || '');
                          setCopiedResult(true);
                          setTimeout(() => setCopiedResult(false), 2000);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium flex items-center gap-1 transition-all cursor-pointer"
                      >
                        {copiedResult ? <CheckCheck className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedResult ? 'Kopyalandı!' : 'Metni Kopyala'}</span>
                      </button>
                    )}
                  </div>

                  {testResultData.success && testResultData.output && (
                    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs text-slate-200 leading-relaxed font-sans max-h-80 overflow-y-auto whitespace-pre-wrap select-text">
                      {testResultData.output}
                    </div>
                  )}

                  {!testResultData.success && (
                    <div className="bg-rose-950/30 border border-rose-500/50 rounded-2xl p-4 space-y-2">
                      <div className="flex items-center gap-2 text-rose-300 font-bold text-xs">
                        <AlertCircle className="w-4 h-4" />
                        <span>{testResultData.error || 'Model çağrısı başarısız oldu.'}</span>
                      </div>
                      {testResultData.rawError && (
                        <pre className="p-3 bg-black/50 border border-rose-900/40 rounded-xl text-[11px] font-mono text-rose-200/90 overflow-x-auto whitespace-pre-wrap">
                          {testResultData.rawError}
                        </pre>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between text-xs text-slate-400">
              <span>Model ID: <code className="text-indigo-300 font-mono">{testModalModel.id}</code></span>
              <button
                type="button"
                onClick={handleCloseTestModal}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-all cursor-pointer"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
