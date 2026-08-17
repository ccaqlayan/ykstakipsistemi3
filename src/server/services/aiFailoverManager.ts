import { db } from '../config';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export type AiProviderName = 'GEMINI' | 'GROQ' | 'OPENROUTER' | 'GITHUB';

export interface ModelCooldownEntry {
  provider: AiProviderName;
  modelId: string;
  cooldownUntil: number; // timestamp ms
  exhaustedAt: string;
  reason?: string;
  isIndefinite?: boolean; // 🔒 Süresiz pasife alınmış model
}

export interface AiFailoverState {
  cooldownHours: number; // default: 24
  activeProvider: AiProviderName;
  activeModelCursors: {
    GEMINI: string;
    GROQ: string;
    OPENROUTER: string;
    GITHUB: string;
  };
  customProviderOrder?: AiProviderName[];
  customModelOrder?: {
    GEMINI?: string[];
    GROQ?: string[];
    OPENROUTER?: string[];
    GITHUB?: string[];
  };
  customModels?: {
    GEMINI?: ProviderModelMetadata[];
    GROQ?: ProviderModelMetadata[];
    OPENROUTER?: ProviderModelMetadata[];
    GITHUB?: ProviderModelMetadata[];
  };
  cooldowns: Record<string, ModelCooldownEntry>; // key: `${provider}:${modelId}`
  updatedAt: string;
}

export interface ProviderModelMetadata {
  id: string;
  name: string;
  description: string;
  badge: string;
  isVisionCapable?: boolean;
}

// 🎯 Default Quality Sequences for each Provider
export const PROVIDER_MODEL_SEQUENCES: Record<AiProviderName, ProviderModelMetadata[]> = {
  GEMINI: [
    { id: 'gemini-3.7-flash', name: 'Gemini 3.7 Flash', description: 'En Gelişmiş Akıl Yürütme & Yüksek Kalite', badge: 'Gelişmiş & Kalite', isVisionCapable: true },
    { id: 'gemini-3.6-flash', name: 'Gemini 3.6 Flash', description: 'Dengeli Hız, Yüksek Kalite & Güvenilirlik', badge: 'Dengeli', isVisionCapable: true },
    { id: 'gemini-3.5-flash', name: 'Gemini 3.5 Flash', description: 'Geniş Kapsamlı & Hızlı Problem Çözümü', badge: 'Flash Hızlı', isVisionCapable: true },
    { id: 'gemini-3.5-flash-lite', name: 'Gemini 3.5 Flash-Lite', description: 'Ultra Hafif, En Düşük Gecikme (~800ms) & Rahat Kota', badge: 'Ultra Hafif', isVisionCapable: true },
    { id: 'gemini-3.1-flash-lite', name: 'Gemini 3.1 Flash-Lite', description: 'Hızlı & Stabil Alternatif Yedek Model (~1.8sn)', badge: 'Lite Yedek', isVisionCapable: true },
    { id: 'gemini-3.1-pro', name: 'Gemini 3.1 Pro', description: 'Derin Analiz, Ağır Strateji & Büyük Bağlam', badge: 'Pro & Derinlik', isVisionCapable: true }
  ],
  GROQ: [
    { id: 'openai/gpt-oss-120b', name: 'GPT-OSS 120B', description: 'En Yüksek Muhakeme & Problem Çözme Kapasitesi', badge: '120B Amiral', isVisionCapable: false },
    { id: 'openai/gpt-oss-20b', name: 'GPT-OSS 20B', description: 'Ultra Hızlı Cevap Süresi & Düşük Gecikme', badge: 'Ultra Hızlı', isVisionCapable: false },
    { id: 'qwen/qwen3.6-27b', name: 'Qwen 3.6 27B', description: 'Matematik ve Kodlamada Dengeli Başarı', badge: '27B Dengeli', isVisionCapable: false },
    { id: 'groq/compound', name: 'Groq Compound', description: 'Akıllı Bileşik Muhakeme & Yüksek Hızlı Çıkarım', badge: 'Compound Güçlü', isVisionCapable: false },
    { id: 'groq/compound-mini', name: 'Groq Compound Mini', description: 'Ultra Hızlı & Kompakt Cevap Motoru', badge: 'Compound Mini', isVisionCapable: false }
  ],
  OPENROUTER: [
    { id: 'google/gemma-4-31b-it:free', name: 'Gemma 4 31B Free', description: 'Google Gemma Tabanlı Ücretsiz Lider Model', badge: ':free Lider', isVisionCapable: true },
    { id: 'google/gemma-4-26b-a4b-it:free', name: 'Gemma 4 26B Free', description: 'Hızlı Çıkarım & Dengeli Soru Çözümü', badge: ':free Hızlı', isVisionCapable: true },
    { id: 'nvidia/nemotron-3.5-lightning:free', name: 'Nemotron 3.5 Lightning Free', description: 'Nvidia Optimize Hızlı Mantık Motoru', badge: ':free Hafif', isVisionCapable: false },
    { id: 'nvidia/nemotron-3-ultra-550b-a55b:free', name: 'Nemotron 3 Ultra 550B Free', description: '550B Parametre Devasa Akıl Yürütme', badge: ':free 550B', isVisionCapable: false },
    { id: 'openai/gpt-oss-20b:free', name: 'GPT-OSS 20B Free', description: 'Açık Kaynak Hızlı Yedek Model', badge: ':free Açık', isVisionCapable: false },
    { id: 'z-ai/glm-5.2:free', name: 'GLM 5.2 Free', description: 'Çok Dilli & Geniş Kapsamlı Yedek', badge: ':free Yedek', isVisionCapable: false },
    { id: 'liquid/lfm-2.5-2.6b:free', name: 'LFM 2.5 Free', description: 'Temel Görevler İçin Son Savunma Hattı', badge: ':free Son Yedek', isVisionCapable: false }
  ],
  GITHUB: [
    { id: 'gpt-4o', name: 'GPT-4o (OpenAI)', description: 'En Gelişmiş OpenAI Zekası & Görsel Soru Çözümü', badge: 'GPT-4o Lider', isVisionCapable: true },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini (OpenAI)', description: 'Hızlı, Akıllı & Görsel Analiz Destekli', badge: 'GPT-4o Mini Hızlı', isVisionCapable: true },
    { id: 'meta-llama-3.2-11b-vision-instruct', name: 'Llama 3.2 11B Vision', description: 'Meta Açık Kaynak Görsel & Problem Çözümü', badge: '11B Vision', isVisionCapable: true },
    { id: 'Phi-3.5-vision-instruct', name: 'Phi 3.5 Vision', description: 'Microsoft Grafik ve Tablo Analizi', badge: 'Phi Vision', isVisionCapable: true }
  ]
};

// In-memory runtime state
let failoverState: AiFailoverState = {
  cooldownHours: 24,
  activeProvider: 'GEMINI',
  activeModelCursors: {
    GEMINI: 'gemini-3.7-flash',
    GROQ: 'openai/gpt-oss-120b',
    OPENROUTER: 'google/gemma-4-31b-it:free',
    GITHUB: 'gpt-4o'
  },
  customProviderOrder: ['GEMINI', 'GROQ', 'OPENROUTER', 'GITHUB'],
  customModelOrder: {
    GEMINI: ['gemini-3.7-flash', 'gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-3.1-flash-lite', 'gemini-3.1-pro'],
    GROQ: ['openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'qwen/qwen3.6-27b', 'groq/compound', 'groq/compound-mini'],
    OPENROUTER: [
      'google/gemma-4-31b-it:free',
      'google/gemma-4-26b-a4b-it:free',
      'nvidia/nemotron-3.5-lightning:free',
      'nvidia/nemotron-3-ultra-550b-a55b:free',
      'openai/gpt-oss-20b:free',
      'z-ai/glm-5.2:free',
      'liquid/lfm-2.5-2.6b:free'
    ],
    GITHUB: ['gpt-4o', 'gpt-4o-mini', 'meta-llama-3.2-11b-vision-instruct', 'Phi-3.5-vision-instruct']
  },
  cooldowns: {},
  updatedAt: new Date().toISOString()
};

let isInitialized = false;

/**
 * Initializes failover state from Firestore
 */
export async function initFailoverStateFromFirestore() {
  if (isInitialized) return;
  try {
    if (!db) return;
    const docRef = doc(db, 'system_config', 'ai_failover_state');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as Partial<AiFailoverState>;
      if (typeof data.cooldownHours === 'number') {
        failoverState.cooldownHours = data.cooldownHours;
      }
      if (data.activeProvider && ['GEMINI', 'GROQ', 'OPENROUTER', 'GITHUB'].includes(data.activeProvider)) {
        failoverState.activeProvider = data.activeProvider;
      }
      if (data.activeModelCursors && typeof data.activeModelCursors === 'object') {
        failoverState.activeModelCursors = {
          ...failoverState.activeModelCursors,
          ...data.activeModelCursors
        };
      }
      if (Array.isArray(data.customProviderOrder) && data.customProviderOrder.length > 0) {
        const validProviders: AiProviderName[] = ['GEMINI', 'GROQ', 'OPENROUTER', 'GITHUB'];
        const filtered = data.customProviderOrder.filter(p => validProviders.includes(p));
        for (const vp of validProviders) {
          if (!filtered.includes(vp)) filtered.push(vp);
        }
        failoverState.customProviderOrder = filtered;
      }
      if (data.customModelOrder && typeof data.customModelOrder === 'object') {
        // Sanitize and purge decommissioned models
        const sanitized: Record<string, string[]> = {};
        for (const [pName, list] of Object.entries(data.customModelOrder)) {
          if (Array.isArray(list)) {
            const validDefaultIds = (PROVIDER_MODEL_SEQUENCES[pName as AiProviderName] || []).map(m => m.id);
            const filtered = list.filter(mId => mId !== 'llama-3.3-70b-specdec' && validDefaultIds.includes(mId));
            for (const vId of validDefaultIds) {
              if (!filtered.includes(vId)) filtered.push(vId);
            }
            sanitized[pName] = filtered;
          }
        }
        failoverState.customModelOrder = {
          ...failoverState.customModelOrder,
          ...sanitized
        };
      }
      if (data.customModels && typeof data.customModels === 'object') {
        failoverState.customModels = {
          ...failoverState.customModels,
          ...data.customModels
        };
      }
      if (data.cooldowns && typeof data.cooldowns === 'object') {
        // Clean expired cooldowns and decommissioned models on load
        const now = Date.now();
        const cleaned: Record<string, ModelCooldownEntry> = {};
        for (const [k, v] of Object.entries(data.cooldowns)) {
          if (v && (v.isIndefinite || (v.cooldownUntil && v.cooldownUntil > now)) && v.modelId !== 'llama-3.3-70b-specdec') {
            cleaned[k] = v;
          }
        }
        failoverState.cooldowns = cleaned;
      }
      console.log(`[AI_FAILOVER] Loaded failover state from Firestore. Active Provider: ${failoverState.activeProvider}, Active Cooldowns: ${Object.keys(failoverState.cooldowns).length}`);
      await syncToFirestore();
    }
  } catch (err: any) {
    console.warn('[AI_FAILOVER] Failed to load failover state from Firestore:', err.message);
  } finally {
    isInitialized = true;
  }
}

/**
 * Persists current state to Firestore asynchronously
 */
async function syncToFirestore() {
  try {
    failoverState.updatedAt = new Date().toISOString();
    if (!db) return;
    const docRef = doc(db, 'system_config', 'ai_failover_state');
    await setDoc(docRef, failoverState, { merge: true });
  } catch (err: any) {
    console.warn('[AI_FAILOVER] Failed to persist failover state to Firestore:', err.message);
  }
}

/**
 * Checks if a specific model is currently in cooldown or indefinitely disabled
 */
export function isModelInCooldown(provider: AiProviderName, modelId: string): boolean {
  const key = `${provider}:${modelId}`;
  const entry = failoverState.cooldowns[key];
  if (!entry) return false;
  if (entry.isIndefinite) return true;
  if (Date.now() > entry.cooldownUntil) {
    // Expired, clean it up
    delete failoverState.cooldowns[key];
    syncToFirestore().catch(() => {});
    return false;
  }
  return true;
}

/**
 * Gets the remaining cooldown in milliseconds for a model, or 0 if available
 */
export function getModelRemainingCooldownMs(provider: AiProviderName, modelId: string): number {
  const key = `${provider}:${modelId}`;
  const entry = failoverState.cooldowns[key];
  if (!entry) return 0;
  if (entry.isIndefinite) return 999999999;
  const rem = entry.cooldownUntil - Date.now();
  if (rem <= 0) {
    delete failoverState.cooldowns[key];
    syncToFirestore().catch(() => {});
    return 0;
  }
  return rem;
}

/**
 * Checks if an entire provider has all its models in cooldown
 */
export function isProviderCompletelyExhausted(provider: AiProviderName): boolean {
  const defaultSeq = PROVIDER_MODEL_SEQUENCES[provider] || [];
  const customList = failoverState.customModels?.[provider] || [];
  const seq = [...defaultSeq, ...customList];
  if (seq.length === 0) return false;
  return seq.every(m => isModelInCooldown(provider, m.id));
}

/**
 * Returns the active available models sequence for a provider, respecting custom order, starting from the current cursor and skipping cooled-down models
 */
export function getActiveSequenceForProvider(provider: AiProviderName, baseSequence?: string[]): string[] {
  const defaultList = (PROVIDER_MODEL_SEQUENCES[provider] || []).map(m => m.id);
  const customAddedList = (failoverState.customModels?.[provider] || []).map(m => m.id);
  const combinedDefault = [...defaultList, ...customAddedList];
  const customOrder = failoverState.customModelOrder?.[provider];

  let fullList: string[] = [];
  if (customOrder && customOrder.length > 0) {
    fullList = [...customOrder];
    for (const mId of combinedDefault) {
      if (!fullList.includes(mId)) {
        fullList.push(mId);
      }
    }
  } else if (baseSequence && baseSequence.length > 0) {
    fullList = [...baseSequence];
    for (const mId of combinedDefault) {
      if (!fullList.includes(mId)) {
        fullList.push(mId);
      }
    }
  } else {
    fullList = combinedDefault;
  }

  const available = fullList.filter(mId => !isModelInCooldown(provider, mId));
  if (available.length === 0) {
    // If all are cooled down, return fullList as fallback attempt
    return fullList;
  }

  // If active cursor is in available list, rotate array so active cursor is first
  const activeCursor = failoverState.activeModelCursors[provider];
  if (activeCursor && available.includes(activeCursor)) {
    const idx = available.indexOf(activeCursor);
    return [...available.slice(idx), ...available.slice(0, idx)];
  }

  return available;
}

/**
 * Records that a model has hit rate limit / quota exhaustion.
 * Enters cooldown for configured hours (default 24h) and advances cursor to next available model.
 */
export function recordModelExhaustion(provider: AiProviderName, modelId: string, errorReason?: string, cooldownHoursOverride?: number) {
  const key = `${provider}:${modelId}`;
  const effectiveCooldownHours = cooldownHoursOverride !== undefined ? cooldownHoursOverride : failoverState.cooldownHours;
  const cooldownDurationMs = effectiveCooldownHours * 60 * 60 * 1000;
  const cooldownUntil = Date.now() + cooldownDurationMs;

  failoverState.cooldowns[key] = {
    provider,
    modelId,
    cooldownUntil,
    exhaustedAt: new Date().toISOString(),
    reason: (errorReason || 'Quota / Rate limit reached').substring(0, 200)
  };

  console.warn(`[AI_FAILOVER] ⏳ Model ${provider}:${modelId} entered cooldown until ${new Date(cooldownUntil).toLocaleString()} (${effectiveCooldownHours} hours). Reason: ${errorReason || 'Rate limit'}`);

  // Advance cursor to next model
  const customSeq = failoverState.customModelOrder?.[provider] || (PROVIDER_MODEL_SEQUENCES[provider] || []).map(m => m.id);
  const nextAvailable = customSeq.find(mId => mId !== modelId && !isModelInCooldown(provider, mId));
  if (nextAvailable) {
    failoverState.activeModelCursors[provider] = nextAvailable;
    console.log(`[AI_FAILOVER] ➡️ Advanced ${provider} active model cursor to: ${nextAvailable}`);
  } else {
    console.warn(`[AI_FAILOVER] ⚠️ All models for ${provider} are now in cooldown!`);
  }

  syncToFirestore().catch(() => {});
}

/**
 * Records a successful response for a model, ensuring it remains the active cursor
 */
export function recordModelSuccess(provider: AiProviderName, modelId: string) {
  // Clear any accidental cooldown entry for this working model
  const key = `${provider}:${modelId}`;
  if (failoverState.cooldowns[key]) {
    delete failoverState.cooldowns[key];
  }
  failoverState.activeModelCursors[provider] = modelId;
  failoverState.activeProvider = provider;
}

/**
 * Resets all cooldowns and sets cursors back to the primary models
 */
export async function resetAllFailovers(): Promise<AiFailoverState> {
  failoverState.cooldowns = {};
  failoverState.activeProvider = 'GEMINI';
  const geminiFirst = failoverState.customModelOrder?.GEMINI?.[0] || 'gemini-3.7-flash';
  const groqFirst = failoverState.customModelOrder?.GROQ?.[0] || 'openai/gpt-oss-120b';
  const openRouterFirst = failoverState.customModelOrder?.OPENROUTER?.[0] || 'google/gemma-4-31b-it:free';
  const githubFirst = failoverState.customModelOrder?.GITHUB?.[0] || 'gpt-4o';

  failoverState.activeModelCursors = {
    GEMINI: geminiFirst,
    GROQ: groqFirst,
    OPENROUTER: openRouterFirst,
    GITHUB: githubFirst
  };
  await syncToFirestore();
  console.log('[AI_FAILOVER] 🔄 All cooldowns have been reset by admin.');
  return failoverState;
}

/**
 * Forces a specific model to be active and clears its cooldown
 */
export async function forceActiveModel(provider: AiProviderName, modelId: string): Promise<AiFailoverState> {
  const key = `${provider}:${modelId}`;
  if (failoverState.cooldowns[key]) {
    delete failoverState.cooldowns[key];
  }
  failoverState.activeProvider = provider;
  failoverState.activeModelCursors[provider] = modelId;
  await syncToFirestore();
  console.log(`[AI_FAILOVER] 🎯 Admin forced active model: ${provider}:${modelId}`);
  return failoverState;
}

/**
 * Manually sets a model into cooldown (passive / deactivated)
 */
export async function setManualModelCooldown(provider: AiProviderName, modelId: string, hours?: number): Promise<AiFailoverState> {
  recordModelExhaustion(provider, modelId, 'Yönetici tarafından manuel pasife alındı', hours);
  return failoverState;
}

/**
 * Manually sets a model into indefinite passive state (never expires until admin manually activates)
 */
export async function setIndefinitePassive(provider: AiProviderName, modelId: string): Promise<AiFailoverState> {
  const key = `${provider}:${modelId}`;
  failoverState.cooldowns[key] = {
    provider,
    modelId,
    cooldownUntil: Date.now() + 100 * 365 * 24 * 60 * 60 * 1000,
    exhaustedAt: new Date().toISOString(),
    reason: 'Yönetici tarafından süresiz pasife alındı',
    isIndefinite: true
  };

  // Advance cursor if this model was active
  const defaultSeq = (PROVIDER_MODEL_SEQUENCES[provider] || []).map(m => m.id);
  const customAddedList = (failoverState.customModels?.[provider] || []).map(m => m.id);
  const combined = [...defaultSeq, ...customAddedList];
  const customSeq = failoverState.customModelOrder?.[provider] || combined;
  const nextAvailable = customSeq.find(mId => mId !== modelId && !isModelInCooldown(provider, mId));
  if (nextAvailable) {
    failoverState.activeModelCursors[provider] = nextAvailable;
    console.log(`[AI_FAILOVER] 🔒 Model ${provider}:${modelId} indefinitely deactivated. Cursor moved to: ${nextAvailable}`);
  }
  await syncToFirestore();
  return failoverState;
}

/**
 * Manually removes cooldown / indefinite passive for a model (makes it active/ready in sequence)
 */
export async function clearModelCooldown(provider: AiProviderName, modelId: string): Promise<AiFailoverState> {
  const key = `${provider}:${modelId}`;
  if (failoverState.cooldowns[key]) {
    delete failoverState.cooldowns[key];
    await syncToFirestore();
    console.log(`[AI_FAILOVER] 🔓 Admin cleared cooldown for model: ${provider}:${modelId}`);
  }
  return failoverState;
}

/**
 * Adds a new custom model to a provider sequence
 */
export async function addCustomModel(provider: AiProviderName, model: ProviderModelMetadata): Promise<AiFailoverState> {
  if (!failoverState.customModels) {
    failoverState.customModels = {};
  }
  if (!failoverState.customModels[provider]) {
    failoverState.customModels[provider] = [];
  }

  // Check if model with same ID already exists
  const existingIdx = failoverState.customModels[provider]!.findIndex(m => m.id === model.id);
  if (existingIdx !== -1) {
    failoverState.customModels[provider]![existingIdx] = model;
  } else {
    failoverState.customModels[provider]!.push(model);
  }

  // Ensure it's present in customModelOrder
  if (!failoverState.customModelOrder) {
    failoverState.customModelOrder = {};
  }
  if (!failoverState.customModelOrder[provider]) {
    const defaultSeq = (PROVIDER_MODEL_SEQUENCES[provider] || []).map(m => m.id);
    failoverState.customModelOrder[provider] = [...defaultSeq];
  }
  if (!failoverState.customModelOrder[provider]!.includes(model.id)) {
    failoverState.customModelOrder[provider]!.push(model.id);
  }

  await syncToFirestore();
  console.log(`[AI_FAILOVER] ➕ Added custom model ${provider}:${model.id} (${model.name})`);
  return failoverState;
}

/**
 * Removes a custom model from a provider sequence
 */
export async function removeCustomModel(provider: AiProviderName, modelId: string): Promise<AiFailoverState> {
  if (failoverState.customModels?.[provider]) {
    failoverState.customModels[provider] = failoverState.customModels[provider]!.filter(m => m.id !== modelId);
  }
  if (failoverState.customModelOrder?.[provider]) {
    failoverState.customModelOrder[provider] = failoverState.customModelOrder[provider]!.filter(id => id !== modelId);
  }
  const key = `${provider}:${modelId}`;
  if (failoverState.cooldowns[key]) {
    delete failoverState.cooldowns[key];
  }
  // If active cursor was on this model, advance to next
  if (failoverState.activeModelCursors[provider] === modelId) {
    const defaultSeq = (PROVIDER_MODEL_SEQUENCES[provider] || []).map(m => m.id);
    const customAddedList = (failoverState.customModels?.[provider] || []).map(m => m.id);
    const combined = [...defaultSeq, ...customAddedList];
    const customSeq = failoverState.customModelOrder?.[provider] || combined;
    failoverState.activeModelCursors[provider] = customSeq[0] || '';
  }
  await syncToFirestore();
  console.log(`[AI_FAILOVER] 🗑️ Removed custom model ${provider}:${modelId}`);
  return failoverState;
}

/**
 * Reorders a model inside a provider sequence (moves up or down)
 */
export async function reorderModel(provider: AiProviderName, modelId: string, direction: 'UP' | 'DOWN'): Promise<AiFailoverState> {
  const defaultSeq = (PROVIDER_MODEL_SEQUENCES[provider] || []).map(m => m.id);
  const customAddedList = (failoverState.customModels?.[provider] || []).map(m => m.id);
  const combined = [...defaultSeq, ...customAddedList];

  const currentOrder = failoverState.customModelOrder?.[provider] && failoverState.customModelOrder[provider]!.length > 0
    ? [...failoverState.customModelOrder[provider]!]
    : [...combined];

  const idx = currentOrder.indexOf(modelId);
  if (idx !== -1) {
    if (direction === 'UP' && idx > 0) {
      const temp = currentOrder[idx];
      currentOrder[idx] = currentOrder[idx - 1];
      currentOrder[idx - 1] = temp;
    } else if (direction === 'DOWN' && idx < currentOrder.length - 1) {
      const temp = currentOrder[idx];
      currentOrder[idx] = currentOrder[idx + 1];
      currentOrder[idx + 1] = temp;
    }

    if (!failoverState.customModelOrder) {
      failoverState.customModelOrder = {};
    }
    failoverState.customModelOrder[provider] = currentOrder;
    await syncToFirestore();
    console.log(`[AI_FAILOVER] 🔀 Reordered models for ${provider}:`, currentOrder);
  }
  return failoverState;
}

/**
 * Gets the current ordered sequence of AI Providers
 */
export function getProviderSequence(): AiProviderName[] {
  const validNames: AiProviderName[] = ['GEMINI', 'GROQ', 'OPENROUTER', 'GITHUB'];
  const current = failoverState.customProviderOrder;
  if (Array.isArray(current) && current.length > 0) {
    const filtered = current.filter(p => validNames.includes(p));
    for (const v of validNames) {
      if (!filtered.includes(v)) filtered.push(v);
    }
    return filtered;
  }
  return validNames;
}

/**
 * Reorders the custom sequence of AI Providers and saves to Firestore
 */
export async function reorderProviders(newOrder: AiProviderName[]): Promise<AiFailoverState> {
  const validNames: AiProviderName[] = ['GEMINI', 'GROQ', 'OPENROUTER', 'GITHUB'];
  const filtered = (newOrder || []).filter(p => validNames.includes(p));
  for (const v of validNames) {
    if (!filtered.includes(v)) filtered.push(v);
  }
  failoverState.customProviderOrder = filtered;
  await syncToFirestore();
  console.log('[AI_FAILOVER] 🔀 Reordered providers sequence:', filtered);
  return failoverState;
}

/**
 * Moves a provider one position left or right in the provider sequence
 */
export async function moveProvider(provider: AiProviderName, direction: 'left' | 'right'): Promise<AiFailoverState> {
  const seq = [...getProviderSequence()];
  const idx = seq.indexOf(provider);
  if (idx === -1) return failoverState;

  if (direction === 'left' && idx > 0) {
    const tmp = seq[idx - 1];
    seq[idx - 1] = seq[idx];
    seq[idx] = tmp;
    return reorderProviders(seq);
  } else if (direction === 'right' && idx < seq.length - 1) {
    const tmp = seq[idx + 1];
    seq[idx + 1] = seq[idx];
    seq[idx] = tmp;
    return reorderProviders(seq);
  }
  return failoverState;
}

/**
 * Updates the cooldown duration (in hours)
 */
export async function setCooldownHours(hours: number): Promise<AiFailoverState> {
  if (hours > 0 && hours <= 168) {
    failoverState.cooldownHours = hours;
    await syncToFirestore();
  }
  return failoverState;
}

/**
 * Gets detailed formatted status of all providers and models for Admin UI
 */
export function getFailoverStatus() {
  const providers: Array<{
    name: AiProviderName;
    displayName: string;
    isActiveProvider: boolean;
    isCompletelyExhausted: boolean;
    activeModelId: string;
    models: Array<{
      id: string;
      name: string;
      description: string;
      badge: string;
      isVisionCapable?: boolean;
      isActive: boolean;
      isInCooldown: boolean;
      isIndefinite: boolean;
      isCustom: boolean;
      remainingCooldownMs: number;
      remainingFormatted?: string;
      reason?: string;
    }>;
  }> = [];

  const providerNames: AiProviderName[] = getProviderSequence();
  const displayNames: Record<AiProviderName, string> = {
    GEMINI: 'Google Gemini',
    GROQ: 'Groq Cloud',
    OPENROUTER: 'OpenRouter :free',
    GITHUB: 'GitHub Models (GPT-4o)'
  };

  const now = Date.now();

  for (const p of providerNames) {
    const defaultSeq = PROVIDER_MODEL_SEQUENCES[p] || [];
    const customAdded = failoverState.customModels?.[p] || [];
    const allKnown = [...defaultSeq, ...customAdded];
    const customOrder = failoverState.customModelOrder?.[p];
    
    // Sort all models according to customOrder
    let seq = [...allKnown];
    if (customOrder && customOrder.length > 0) {
      seq.sort((a, b) => {
        const idxA = customOrder.indexOf(a.id);
        const idxB = customOrder.indexOf(b.id);
        const posA = idxA === -1 ? 999 : idxA;
        const posB = idxB === -1 ? 999 : idxB;
        return posA - posB;
      });
    }

    const activeModelId = failoverState.activeModelCursors[p] || seq[0]?.id || '';
    const isExhausted = seq.length > 0 && seq.every(m => isModelInCooldown(p, m.id));

    const models = seq.map(m => {
      const key = `${p}:${m.id}`;
      const entry = failoverState.cooldowns[key];
      const isIndefinite = Boolean(entry?.isIndefinite);
      const isInCooldown = entry ? (isIndefinite || entry.cooldownUntil > now) : false;
      const remainingCooldownMs = isIndefinite ? 999999999 : (isInCooldown ? entry.cooldownUntil - now : 0);
      const isCustom = customAdded.some(c => c.id === m.id);
      
      let remainingFormatted = '';
      if (isIndefinite) {
        remainingFormatted = 'Süresiz Pasif';
      } else if (isInCooldown && remainingCooldownMs > 0) {
        const totalMinutes = Math.floor(remainingCooldownMs / (60 * 1000));
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        if (hours > 0) {
          remainingFormatted = `${hours} sa ${minutes} dk`;
        } else {
          remainingFormatted = `${minutes} dk`;
        }
      }

      return {
        id: m.id,
        name: m.name,
        description: m.description,
        badge: m.badge,
        isVisionCapable: m.isVisionCapable,
        isActive: m.id === activeModelId && !isInCooldown,
        isInCooldown,
        isIndefinite,
        isCustom,
        remainingCooldownMs,
        remainingFormatted,
        reason: entry?.reason
      };
    });

    providers.push({
      name: p,
      displayName: displayNames[p],
      isActiveProvider: failoverState.activeProvider === p,
      isCompletelyExhausted: isExhausted,
      activeModelId,
      models
    });
  }

  return {
    success: true,
    cooldownHours: failoverState.cooldownHours,
    activeProvider: failoverState.activeProvider,
    activeModelCursors: failoverState.activeModelCursors,
    customModelOrder: failoverState.customModelOrder,
    providerOrder: providerNames,
    providers,
    cooldownCount: Object.keys(failoverState.cooldowns).length,
    updatedAt: failoverState.updatedAt
  };
}
