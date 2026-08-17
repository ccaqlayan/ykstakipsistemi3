import { GoogleGenAI } from '@google/genai';
import { 
  getEffectiveGeminiApiKey, 
  getEffectiveGroqApiKey, 
  getEffectiveOpenRouterApiKey, 
  getEffectiveGithubApiKey,
  getEffectiveProviderMode,
  generateContentWithFallback,
  mapToActualGeminiModel
} from '../config';

export type AiProvider = 'GEMINI' | 'GROQ' | 'OPENROUTER' | 'GITHUB';
export type AiProviderMode = 'AUTO_FALLBACK' | 'GEMINI_ONLY' | 'GROQ_ONLY' | 'OPENROUTER_ONLY' | 'GITHUB_ONLY';

export interface UnifiedAiRequestOptions {
  prompt: string;
  systemInstruction?: string;
  imagePart?: {
    inlineData: {
      data: string;
      mimeType: string;
    };
  };
  imageUrl?: string;
  requireJson?: boolean;
  featureKey?: string;
  modelOverride?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface UnifiedAiResponse {
  text: string;
  providerUsed: AiProvider;
  modelUsed: string;
  promptTokens?: number;
  candidatesTokens?: number;
}

/**
 * Normalizes an image to base64 data URL for OpenAI-compatible APIs (Groq & OpenRouter).
 */
function getImageDataUrl(options: UnifiedAiRequestOptions): string | null {
  if (options.imagePart?.inlineData?.data) {
    const mime = options.imagePart.inlineData.mimeType || 'image/jpeg';
    return `data:${mime};base64,${options.imagePart.inlineData.data}`;
  }
  if (options.imageUrl && options.imageUrl.startsWith('data:image')) {
    return options.imageUrl;
  }
  if (options.imageUrl && (options.imageUrl.startsWith('http://') || options.imageUrl.startsWith('https://'))) {
    return options.imageUrl;
  }
  return null;
}

/**
 * 1. Call Google Gemini
 */
async function callGemini(options: UnifiedAiRequestOptions): Promise<UnifiedAiResponse> {
  const apiKey = getEffectiveGeminiApiKey();
  if (!apiKey) {
    throw new Error('Google Gemini API anahtarı tanımlanmamış.');
  }

  const ai = new GoogleGenAI({ apiKey });
  const contents: any[] = [];

  let imgPart = options.imagePart;
  if (!imgPart && options.imageUrl) {
    if (options.imageUrl.startsWith('data:image')) {
      const match = options.imageUrl.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
      if (match) {
        imgPart = {
          inlineData: {
            mimeType: match[1],
            data: match[2]
          }
        };
      }
    }
  }

  if (imgPart) {
    contents.push(imgPart);
  }
  contents.push({ text: options.prompt });

  const targetModel = mapToActualGeminiModel(options.modelOverride || 'SYSTEM_DEFAULT');
  
  const config: any = {
    maxOutputTokens: options.maxTokens || 4096,
    temperature: options.temperature ?? 0.3
  };

  if (options.systemInstruction) {
    config.systemInstruction = options.systemInstruction;
  }

  if (options.requireJson) {
    config.responseMimeType = 'application/json';
  }

  const { response, modelUsed } = await generateContentWithFallback(ai, {
    model: targetModel,
    contents,
    config
  });

  const text = cleanAiOutputText(response?.candidates?.[0]?.content?.parts?.[0]?.text || response?.text || '');
  const usage = response?.usageMetadata || {};

  return {
    text,
    providerUsed: 'GEMINI',
    modelUsed,
    promptTokens: usage.promptTokenCount || 0,
    candidatesTokens: usage.candidatesTokenCount || 0
  };
}

/**
 * 2. Call Groq Cloud API
 */
async function callGroq(options: UnifiedAiRequestOptions): Promise<UnifiedAiResponse> {
  const apiKey = getEffectiveGroqApiKey();
  if (!apiKey) {
    throw new Error('Groq Cloud API anahtarı tanımlanmamış.');
  }

  const imgDataUrl = getImageDataUrl(options);
  const hasImage = Boolean(imgDataUrl);

  const rawCandidateModels = hasImage
    ? ['qwen/qwen3.6-27b']
    : ['openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'qwen/qwen3.6-27b', 'llama-3.3-70b-specdec'];

  // 🚀 AI Failover & Cooldown Manager: Cooldown'da olmayan aktif Groq modellerini getir
  const { getActiveSequenceForProvider, recordModelExhaustion, recordModelSuccess } = await import('./aiFailoverManager');
  const candidateModels = getActiveSequenceForProvider('GROQ', rawCandidateModels);

  const messages: any[] = [];

  let userText = options.prompt;
  if (options.requireJson && !userText.toLowerCase().includes('json')) {
    userText += '\n\nIMPORTANT: Respond strictly with valid JSON format.';
  }

  if (options.systemInstruction) {
    messages.push({ role: 'system', content: options.systemInstruction });
  }

  if (hasImage && imgDataUrl) {
    messages.push({
      role: 'user',
      content: [
        { type: 'text', text: userText },
        { type: 'image_url', image_url: { url: imgDataUrl } }
      ]
    });
  } else {
    messages.push({ role: 'user', content: userText });
  }

  let lastError: any = null;
  // Groq Free Tier TPM limit is 8000 (input + max_tokens). For vision, cap max_tokens at 3800 so total requested never exceeds 8000 TPM.
  const allocatedMaxTokens = hasImage
    ? Math.min(options.maxTokens || 3800, 3800)
    : Math.min(options.maxTokens || 4096, 6000);

  for (const model of candidateModels) {
    try {
      const requestBody: any = {
        model,
        messages,
        max_tokens: allocatedMaxTokens,
        temperature: options.temperature ?? 0.3
      };

      // Explicitly disable reasoning tokens on Qwen to prevent token exhaust and speed up output
      if (model.includes('qwen')) {
        requestBody.reasoning_effort = 'none';
      }

      if (options.requireJson && !hasImage) {
        requestBody.response_format = { type: 'json_object' };
      }

      let res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(30000),
        body: JSON.stringify(requestBody)
      });

      // If Groq's strict JSON validator fails (e.g. json_validate_failed / max completion tokens), retry without strict response_format
      if (!res.ok && options.requireJson) {
        const errText = await res.clone().text();
        if (errText.includes('json_validate_failed') || errText.includes('Failed to generate JSON') || errText.includes('max completion tokens')) {
          console.warn(`[AI_GATEWAY] Groq strict JSON validation failed for ${model}, retrying in flexible mode...`);
          const fallbackBody = { ...requestBody };
          delete fallbackBody.response_format;
          res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            },
            signal: AbortSignal.timeout(30000),
            body: JSON.stringify(fallbackBody)
          });
        }
      }

      if (!res.ok) {
        const errBody = await res.text();
        // If error is caused by Groq's lack of image support (e.g. content must be a string or model not supporting vision), failover seamlessly
        if (hasImage && (errBody.includes('must be a string') || errBody.includes('model_not_found') || res.status === 400 || res.status === 404)) {
          console.warn(`[AI_GATEWAY] Groq does not support multimodal image input (${errBody.substring(0, 100)}). Auto-routing to available vision provider...`);
          if (getEffectiveGeminiApiKey()) {
            return await callGemini(options);
          }
          if (getEffectiveOpenRouterApiKey()) {
            return await callOpenRouter(options);
          }
          throw new Error('Groq Cloud şu anda sadece metin modellerini desteklemektedir. Fotoğraflı soru çözümü için lütfen Sistem Yönetimi > Model Ayarları bölümünden Google Gemini veya OpenRouter anahtarınızı aktif ediniz.');
        }

        // Check for rate limits / quota / service unavailable issues on Groq
        if (res.status === 429 || res.status === 503 || errBody.includes('rate_limit_exceeded') || errBody.includes('tokens per day') || errBody.includes('TPM') || errBody.includes('UNAVAILABLE') || errBody.includes('Service Unavailable')) {
          console.warn(`[AI_FAILOVER] Groq model ${model} limit/hizmet hatası aldı (${res.status}). Cooldown'a alındı.`);
          recordModelExhaustion('GROQ', model, errBody);
        }

        throw new Error(`Groq API Hatası (${res.status}): ${errBody.substring(0, 300)}`);
      }

      const data = await res.json();
      const choice = data?.choices?.[0];
      let rawText = '';
      if (typeof choice?.message?.content === 'string') {
        rawText = choice.message.content;
      } else if (Array.isArray(choice?.message?.content)) {
        rawText = choice.message.content
          .map((part: any) => (typeof part === 'string' ? part : part?.text || ''))
          .join('\n');
      } else if (choice?.message?.reasoning && typeof choice.message.reasoning === 'string') {
        rawText = choice.message.reasoning;
      } else if (typeof choice?.text === 'string') {
        rawText = choice.text;
      }

      const text = cleanAiOutputText(rawText);
      const usage = data?.usage || {};
      const resolvedModel = data?.model || model;

      if (!text || text.length < 5) {
        throw new Error(`Model ${model} geçerli bir içerik üretmedi.`);
      }

      // Record success in failover manager
      recordModelSuccess('GROQ', resolvedModel);

      return {
        text,
        providerUsed: 'GROQ',
        modelUsed: resolvedModel,
        promptTokens: usage.prompt_tokens || 0,
        candidatesTokens: usage.completion_tokens || 0
      };
    } catch (err: any) {
      lastError = err;
      console.warn(`[AI_GATEWAY] Groq model ${model} failed: ${err.message}. Trying next Groq model...`);
    }
  }

  throw lastError || new Error('Groq modelleri denenirken hata oluştu.');
}

/**
 * Cleans thinking tokens, safety guard artifacts (e.g. "User Safety: safe") and markdown wrappers from model output.
 */
export function cleanAiOutputText(rawText: string): string {
  if (!rawText) return '';
  let text = rawText.trim();
  // Strip reasoning / thinking blocks: <think>...</think>
  text = text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  // Strip safety guard preambles (case-insensitive, multi-line)
  text = text.replace(/^(?:(?:User|Assistant)\s+)?Safety(?:\s+Assessment|\s+Status)?:\s*safe\s*/gim, '').trim();
  text = text.replace(/^User Safety:\s*safe\s*/gim, '').trim();
  text = text.replace(/^Assistant Safety:\s*safe\s*/gim, '').trim();
  text = text.replace(/^Safety:\s*safe\s*/gim, '').trim();
  return text.trim();
}

/**
 * 3. Call OpenRouter API
 */
async function callOpenRouter(options: UnifiedAiRequestOptions): Promise<UnifiedAiResponse> {
  const apiKey = getEffectiveOpenRouterApiKey();
  if (!apiKey) {
    throw new Error('OpenRouter API anahtarı tanımlanmamış.');
  }

  const imgDataUrl = getImageDataUrl(options);
  const hasImage = Boolean(imgDataUrl);

  const rawCandidateModels = hasImage
    ? [
        'dots-studio/dots-3-note-preview:free',
        'google/gemma-4-26b-a4b-it:free',
        'google/gemma-4-31b-it:free',
        'nvidia/nemotron-nano-12b-v2-vl:free',
        'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free'
      ]
    : [
        'google/gemma-4-31b-it:free',
        'google/gemma-4-26b-a4b-it:free',
        'nvidia/nemotron-3.5-lightning:free',
        'nvidia/nemotron-3-ultra-550b-a55b:free',
        'nvidia/nemotron-3-super-120b-a12b:free',
        'openai/gpt-oss-20b:free',
        'z-ai/glm-5.2:free',
        'liquid/lfm-2.5-2.6b:free'
      ];

  // 🚀 AI Failover & Cooldown Manager: Cooldown'da olmayan aktif OpenRouter modellerini getir
  const { getActiveSequenceForProvider, recordModelExhaustion, recordModelSuccess } = await import('./aiFailoverManager');
  const candidateModels = getActiveSequenceForProvider('OPENROUTER', rawCandidateModels);

  const messages: any[] = [];

  if (options.systemInstruction) {
    messages.push({ role: 'system', content: options.systemInstruction });
  }

  if (options.requireJson) {
    messages.push({ role: 'system', content: 'You must respond strictly with valid JSON format. Do not include introductory text or commentary.' });
  }

  if (hasImage && imgDataUrl) {
    messages.push({
      role: 'user',
      content: [
        { type: 'text', text: options.prompt },
        { type: 'image_url', image_url: { url: imgDataUrl } }
      ]
    });
  } else {
    messages.push({ role: 'user', content: options.prompt });
  }

  let lastError: any = null;

  for (const model of candidateModels) {
    try {
      const requestBody: any = {
        model,
        messages,
        max_tokens: options.maxTokens || 4096,
        temperature: options.temperature ?? 0.3
      };

      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'YKS Takip Sistemi'
        },
        signal: AbortSignal.timeout(20000), // 20sn model bazlı zaman aşımı (sıradaki ücretsiz modele hızlı failover)
        body: JSON.stringify(requestBody)
      });

      if (!res.ok) {
        const errBody = await res.text();
        // Cooldown record for failed OpenRouter model
        if (res.status === 429 || res.status === 402 || res.status === 503 || res.status === 502 || res.status === 504 || errBody.includes('rate_limit') || errBody.includes('quota') || errBody.includes('UNAVAILABLE') || errBody.includes('Service Unavailable')) {
          console.warn(`[AI_FAILOVER] OpenRouter model ${model} limit/hizmet hatası aldı (${res.status}). Cooldown'a alındı.`);
          recordModelExhaustion('OPENROUTER', model, errBody);
        }
        throw new Error(`OpenRouter API Hatası (${res.status}): ${errBody.substring(0, 300)}`);
      }

      const data = await res.json();
      const choice = data?.choices?.[0];
      let rawText = '';
      if (typeof choice?.message?.content === 'string') {
        rawText = choice.message.content;
      } else if (Array.isArray(choice?.message?.content)) {
        rawText = choice.message.content
          .map((part: any) => (typeof part === 'string' ? part : part?.text || ''))
          .join('\n');
      } else if (choice?.message?.reasoning && typeof choice.message.reasoning === 'string') {
        rawText = choice.message.reasoning;
      } else if (typeof choice?.text === 'string') {
        rawText = choice.text;
      }

      const text = cleanAiOutputText(rawText);
      const usage = data?.usage || {};
      const resolvedModel = data?.model || model;

      // Validate output: If empty or only safety check returned without actual content, reject and try next model
      if (!text || text.length < 8 || /^safe$/i.test(text)) {
        throw new Error(`Model ${model} geçerli bir içerik üretmedi (boş veya geçersiz çıktı döndü).`);
      }

      // Record success in failover manager
      recordModelSuccess('OPENROUTER', resolvedModel);

      return {
        text,
        providerUsed: 'OPENROUTER',
        modelUsed: resolvedModel,
        promptTokens: usage.prompt_tokens || 0,
        candidatesTokens: usage.completion_tokens || 0
      };
    } catch (err: any) {
      lastError = err;
      console.warn(`[AI_GATEWAY] OpenRouter model ${model} failed: ${err.message}. Trying next free model...`);
    }
  }

  throw lastError || new Error('OpenRouter tüm ücretsiz modelleri denenirken hata oluştu.');
}

/**
 * Helper to call GitHub Models Inference API across supported endpoints
 */
async function callGithubInferenceApi(apiKey: string, body: any, timeoutMs = 25000): Promise<Response> {
  const trimmed = apiKey.trim();
  const endpoints = [
    'https://models.github.ai/inference/chat/completions',
    'https://models.inference.ai.azure.com/chat/completions'
  ];

  let lastRes: Response | null = null;
  let lastErr: any = null;

  for (const ep of endpoints) {
    try {
      const res = await fetch(ep, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${trimmed}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'YKS-Takip-Sistemi'
        },
        signal: AbortSignal.timeout(timeoutMs),
        body: JSON.stringify(body)
      });
      if (res.ok) {
        return res;
      }
      lastRes = res;
    } catch (e: any) {
      lastErr = e;
    }
  }

  if (lastRes) return lastRes;
  throw lastErr || new Error('GitHub Models servisine bağlanılamadı.');
}

/**
 * Call GitHub Models (Azure AI Inference / GitHub Models API) with automatic model fallback
 */
export async function callGithubModels(options: UnifiedAiRequestOptions): Promise<UnifiedAiResponse> {
  const apiKey = getEffectiveGithubApiKey();
  if (!apiKey) {
    throw new Error('GitHub Models API Token (Personal Access Token) sistemde tanımlanmamış.');
  }

  const { getActiveSequenceForProvider, recordModelExhaustion, recordModelSuccess } = await import('./aiFailoverManager');
  const candidateModels = getActiveSequenceForProvider('GITHUB', [
    'gpt-4o',
    'gpt-4o-mini',
    'meta-llama-3.2-11b-vision-instruct',
    'Phi-3.5-vision-instruct'
  ]);

  const imgDataUrl = getImageDataUrl(options);
  const messages: any[] = [];

  if (options.systemInstruction) {
    messages.push({ role: 'system', content: options.systemInstruction });
  }

  if (imgDataUrl) {
    messages.push({
      role: 'user',
      content: [
        { type: 'text', text: options.prompt },
        { type: 'image_url', image_url: { url: imgDataUrl } }
      ]
    });
  } else {
    messages.push({ role: 'user', content: options.prompt });
  }

  let lastError: any = null;

  for (const model of candidateModels) {
    try {
      const requestBody: any = {
        model,
        messages,
        max_tokens: options.maxTokens || 4096,
        temperature: options.temperature ?? 0.3
      };

      const res = await callGithubInferenceApi(apiKey, requestBody, 25000);

      if (!res.ok) {
        const errBody = await res.text();
        if (res.status === 429 || res.status === 402 || res.status === 503 || res.status === 502 || res.status === 504 || errBody.includes('rate_limit') || errBody.includes('quota') || errBody.includes('exceeded')) {
          console.warn(`[AI_FAILOVER] GitHub Model ${model} limit hatası aldı (${res.status}). Cooldown'a alındı.`);
          recordModelExhaustion('GITHUB', model, errBody);
        }
        throw new Error(`GitHub Models API Hatası (${res.status}): ${errBody.substring(0, 300)}`);
      }

      const data = await res.json();
      const choice = data?.choices?.[0];
      let rawText = '';
      if (typeof choice?.message?.content === 'string') {
        rawText = choice.message.content;
      } else if (Array.isArray(choice?.message?.content)) {
        rawText = choice.message.content
          .map((part: any) => (typeof part === 'string' ? part : part?.text || ''))
          .join('\n');
      } else if (choice?.message?.reasoning && typeof choice.message.reasoning === 'string') {
        rawText = choice.message.reasoning;
      } else if (typeof choice?.text === 'string') {
        rawText = choice.text;
      }

      const text = cleanAiOutputText(rawText);
      const usage = data?.usage || {};
      const resolvedModel = data?.model || model;

      if (!text || text.length < 8) {
        throw new Error(`Model ${model} geçerli bir içerik üretmedi.`);
      }

      recordModelSuccess('GITHUB', resolvedModel);

      return {
        text,
        providerUsed: 'GITHUB',
        modelUsed: resolvedModel,
        promptTokens: usage.prompt_tokens || 0,
        candidatesTokens: usage.completion_tokens || 0
      };
    } catch (err: any) {
      lastError = err;
      console.warn(`[AI_GATEWAY] GitHub Model ${model} failed: ${err.message}. Trying next model...`);
    }
  }

  throw lastError || new Error('GitHub Models tüm modelleri denenirken hata oluştu.');
}

/**
 * Universal Unified Execution Engine with Failover Pipeline
 * Order: Gemini -> Groq -> OpenRouter -> GitHub Models (with 0ms skip for completely exhausted providers)
 */
export async function executeAiUnifiedRequest(options: UnifiedAiRequestOptions): Promise<UnifiedAiResponse> {
  const mode = getEffectiveProviderMode();
  const imgDataUrl = getImageDataUrl(options);
  const hasImage = Boolean(imgDataUrl);

  // If request contains an image and mode is GROQ_ONLY:
  // Automatically use Gemini, GitHub Models, or OpenRouter for image reasoning
  if (hasImage && mode === 'GROQ_ONLY') {
    if (getEffectiveGeminiApiKey()) {
      console.log('[AI_GATEWAY] Image detected in GROQ_ONLY mode. Seamlessly routing to Google Gemini Vision...');
      try {
        return await callGemini(options);
      } catch (err: any) {
        console.warn('[AI_GATEWAY] Gemini failed for image in GROQ_ONLY mode...', err);
      }
    }
    if (getEffectiveGithubApiKey()) {
      console.log('[AI_GATEWAY] Image detected in GROQ_ONLY mode. Seamlessly routing to GitHub GPT-4o Vision...');
      try {
        return await callGithubModels(options);
      } catch (err: any) {
        console.warn('[AI_GATEWAY] GitHub Models failed for image in GROQ_ONLY mode...', err);
      }
    }
    if (getEffectiveOpenRouterApiKey()) {
      console.log('[AI_GATEWAY] Image detected in GROQ_ONLY mode. Seamlessly routing to OpenRouter Vision...');
      try {
        return await callOpenRouter(options);
      } catch (err: any) {
        console.warn('[AI_GATEWAY] OpenRouter failed for image in GROQ_ONLY mode...', err);
      }
    }
  }

  // Mode 1: GEMINI_ONLY
  if (mode === 'GEMINI_ONLY') {
    return await callGemini(options);
  }

  // Mode 2: GROQ_ONLY
  if (mode === 'GROQ_ONLY') {
    return await callGroq(options);
  }

  // Mode 3: OPENROUTER_ONLY
  if (mode === 'OPENROUTER_ONLY') {
    return await callOpenRouter(options);
  }

  // Mode 4: GITHUB_ONLY
  if (mode === 'GITHUB_ONLY') {
    return await callGithubModels(options);
  }

  // Mode 5: AUTO_FALLBACK (Dynamic Sequence Configured by Admin)
  const { isProviderCompletelyExhausted, getProviderSequence } = await import('./aiFailoverManager');
  const providerOrder = getProviderSequence();

  const providerMap: Record<AiProvider, {
    name: AiProvider;
    hasKey: boolean;
    isExhausted: boolean;
    fn: () => Promise<UnifiedAiResponse>;
  }> = {
    GEMINI: {
      name: 'GEMINI',
      hasKey: Boolean(getEffectiveGeminiApiKey()),
      isExhausted: isProviderCompletelyExhausted('GEMINI'),
      fn: () => callGemini(options)
    },
    GROQ: {
      name: 'GROQ',
      hasKey: Boolean(getEffectiveGroqApiKey()),
      isExhausted: isProviderCompletelyExhausted('GROQ'),
      fn: () => callGroq(options)
    },
    OPENROUTER: {
      name: 'OPENROUTER',
      hasKey: Boolean(getEffectiveOpenRouterApiKey()),
      isExhausted: isProviderCompletelyExhausted('OPENROUTER'),
      fn: () => callOpenRouter(options)
    },
    GITHUB: {
      name: 'GITHUB',
      hasKey: Boolean(getEffectiveGithubApiKey()),
      isExhausted: isProviderCompletelyExhausted('GITHUB'),
      fn: () => callGithubModels(options)
    }
  };

  const providersToTry: { name: AiProvider; fn: () => Promise<UnifiedAiResponse> }[] = [];

  for (const pName of providerOrder) {
    const p = providerMap[pName];
    if (p && p.hasKey && !p.isExhausted) {
      providersToTry.push({ name: p.name, fn: p.fn });
    }
  }

  // If all were exhausted or none found, fallback to all available keyed providers in user's sequence
  if (providersToTry.length === 0) {
    for (const pName of providerOrder) {
      const p = providerMap[pName];
      if (p && p.hasKey) {
        providersToTry.push({ name: p.name, fn: p.fn });
      }
    }
  }

  if (providersToTry.length === 0) {
    providersToTry.push({ name: 'GEMINI', fn: () => callGemini(options) });
  }

  let lastError: any = null;

  for (const p of providersToTry) {
    try {
      console.log(`[AI_GATEWAY] Attempting request using provider: ${p.name}`);
      const result = await p.fn();
      console.log(`[AI_GATEWAY] Request succeeded with provider: ${p.name} (model: ${result.modelUsed})`);
      return result;
    } catch (err: any) {
      lastError = err;
      console.warn(`[AI_GATEWAY] Provider ${p.name} failed: ${err.message || err}. Falling back to next provider...`);
    }
  }

  throw lastError || new Error('Tüm yapay zeka sağlayıcıları tüketildi veya yanıt vermedi.');
}

/**
 * Test Connection for a specific Provider Key
 */
export async function testProviderApiKey(
  provider: 'gemini' | 'groq' | 'openrouter' | 'github',
  apiKey: string
): Promise<{ success: boolean; message: string; modelUsed?: string }> {
  const trimmed = (apiKey || '').trim();
  if (!trimmed) {
    return { success: false, message: 'API anahtarı boş olamaz.' };
  }

  try {
    if (provider === 'gemini') {
      const ai = new GoogleGenAI({ apiKey: trimmed });
      const res = await ai.models.generateContent({
        model: 'gemini-3.5-flash-lite',
        contents: 'Merhaba, bu bir test mesajıdır. Tek kelimeyle "Bağlantı Başarılı" yanıtını ver.'
      });
      const text = res?.text || '';
      return { success: true, message: 'Google Gemini bağlantısı başarılı!', modelUsed: 'gemini-3.5-flash-lite' };
    }

    if (provider === 'groq') {
      try {
        const modelsRes = await fetch('https://api.groq.com/openai/v1/models', {
          headers: {
            'Authorization': `Bearer ${trimmed}`
          },
          signal: AbortSignal.timeout(10000)
        });
        if (!modelsRes.ok) {
          const body = await modelsRes.text();
          return { success: false, message: `Groq Doğrulama Hatası (${modelsRes.status}): ${body.substring(0, 200)}` };
        }

        const modelsData = await modelsRes.json() as any;
        const availableModelIds: string[] = (modelsData.data || []).map((m: any) => m.id);
        
        const preferredModels = [
          'openai/gpt-oss-120b',
          'openai/gpt-oss-20b',
          'qwen/qwen3.6-27b',
          'groq/compound',
          'groq/compound-mini'
        ];
        const selectedModel = preferredModels.find(m => availableModelIds.includes(m)) 
          || availableModelIds.find(id => !id.includes('whisper') && !id.includes('guard'))
          || availableModelIds[0] 
          || 'openai/gpt-oss-120b';

        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${trimmed}`,
            'Content-Type': 'application/json'
          },
          signal: AbortSignal.timeout(15000),
          body: JSON.stringify({
            model: selectedModel,
            messages: [{ role: 'user', content: 'Test ping. Respond with OK.' }],
            max_tokens: 10
          })
        });
        if (!res.ok) {
          const body = await res.text();
          return { success: false, message: `Groq Doğrulama Hatası (${modelsRes.status}): ${body.substring(0, 200)}` };
        }
        return { success: true, message: 'Groq Cloud bağlantısı başarılı!', modelUsed: selectedModel };
      } catch (err: any) {
        return { success: false, message: `Groq Bağlantı Hatası: ${err.message}` };
      }
    }

    if (provider === 'openrouter') {
      const testModels = [
        'google/gemma-4-26b-a4b-it:free',
        'openrouter/free',
        'google/gemma-4-31b-it:free',
        'nvidia/nemotron-3.5-lightning:free',
        'openai/gpt-oss-20b:free'
      ];

      let lastTestErr: string = '';
      for (const testModel of testModels) {
        try {
          const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${trimmed}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': 'http://localhost:3000',
              'X-Title': 'YKS Takip Sistemi'
            },
            signal: AbortSignal.timeout(10000),
            body: JSON.stringify({
              model: testModel,
              messages: [{ role: 'user', content: 'Test. Respond with OK.' }],
              max_tokens: 5
            })
          });
          if (res.ok) {
            const data = await res.json();
            const resolvedModel = data?.model || testModel;
            return { success: true, message: `OpenRouter bağlantısı başarılı! [${resolvedModel}]`, modelUsed: resolvedModel };
          } else {
            const body = await res.text();
            lastTestErr = `(${res.status}): ${body.substring(0, 180)}`;
          }
        } catch (mErr: any) {
          lastTestErr = mErr.message || String(mErr);
        }
      }

      return { success: false, message: `OpenRouter Doğrulama Hatası: ${lastTestErr}` };
    }

    if (provider === 'github') {
      try {
        const res = await callGithubInferenceApi(trimmed, {
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: 'Test. Respond with OK.' }],
          max_tokens: 5
        }, 15000);

        if (!res.ok) {
          const body = await res.text();
          return { success: false, message: `GitHub Models Doğrulama Hatası (${res.status}): ${body.substring(0, 200)}` };
        }
        return { success: true, message: 'GitHub Models (GPT-4o & GPT-4o Mini) bağlantısı başarılı!', modelUsed: 'gpt-4o-mini' };
      } catch (err: any) {
        return { success: false, message: `GitHub Models Bağlantı Hatası: ${err.message}` };
      }
    }

    return { success: false, message: 'Bilinmeyen sağlayıcı.' };
  } catch (err: any) {
    return { success: false, message: err.message || 'Bağlantı testi sırasında hata oluştu.' };
  }
}

/**
 * Tests an individual specific AI model and returns its response, latency and error details
 * Supports both text prompts and vision/image testing
 */
export async function testSingleModel(
  provider: 'GEMINI' | 'GROQ' | 'OPENROUTER' | 'GITHUB',
  modelId: string,
  prompt?: string,
  imageBase64?: string,
  imageMimeType?: string
): Promise<{
  success: boolean;
  model: string;
  provider: string;
  latencyMs: number;
  output?: string;
  error?: string;
  rawError?: string;
}> {
  const startTime = Date.now();
  const testPrompt = (prompt || (imageBase64 ? 'Bu görseldeki soruyu incele, adım adım çöz ve doğru cevabı belirt.' : 'YKS 2026 sınavına hazırlanan bir öğrenci için hızlı 2 maddelik ders çalışma ve motivasyon tavsiyesi ver.')).trim();

  try {
    if (provider === 'GEMINI') {
      const apiKey = getEffectiveGeminiApiKey();
      if (!apiKey) throw new Error('Google Gemini API anahtarı sisteme girilmemiş.');
      const { mapToActualGeminiModel } = await import('../config');
      const actualModel = mapToActualGeminiModel(modelId);
      const ai = new GoogleGenAI({ apiKey });

      const parts: any[] = [];
      if (imageBase64) {
        let cleanBase64 = imageBase64;
        let mime = imageMimeType || 'image/jpeg';
        const match = imageBase64.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
        if (match) {
          mime = match[1];
          cleanBase64 = match[2];
        }
        parts.push({
          inlineData: {
            mimeType: mime,
            data: cleanBase64
          }
        });
      }
      parts.push({ text: testPrompt });

      const res = await ai.models.generateContent({
        model: actualModel,
        contents: [{ role: 'user', parts }],
        config: { maxOutputTokens: 1024 }
      });
      const latencyMs = Date.now() - startTime;
      const text = res.text || '';
      return { success: true, model: actualModel, provider, latencyMs, output: text };
    }

    if (provider === 'GROQ') {
      const apiKey = getEffectiveGroqApiKey();
      if (!apiKey) throw new Error('Groq Cloud API anahtarı sisteme girilmemiş.');

      let messageContent: any = testPrompt;
      if (imageBase64) {
        const fullDataUrl = imageBase64.startsWith('data:')
          ? imageBase64
          : `data:${imageMimeType || 'image/jpeg'};base64,${imageBase64}`;
        messageContent = [
          { type: 'text', text: testPrompt },
          { type: 'image_url', image_url: { url: fullDataUrl } }
        ];
      }

      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(25000),
        body: JSON.stringify({
          model: modelId,
          messages: [{ role: 'user', content: messageContent }],
          max_tokens: 1024
        })
      });
      const latencyMs = Date.now() - startTime;
      if (!res.ok) {
        const body = await res.text();
        return { success: false, model: modelId, provider, latencyMs, error: `Groq Hatası (${res.status})`, rawError: body };
      }
      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content || data?.choices?.[0]?.text || '';
      return { success: true, model: modelId, provider, latencyMs, output: text };
    }

    if (provider === 'OPENROUTER') {
      const apiKey = getEffectiveOpenRouterApiKey();
      if (!apiKey) throw new Error('OpenRouter API anahtarı sisteme girilmemiş.');

      let messageContent: any = testPrompt;
      if (imageBase64) {
        const fullDataUrl = imageBase64.startsWith('data:')
          ? imageBase64
          : `data:${imageMimeType || 'image/jpeg'};base64,${imageBase64}`;
        messageContent = [
          { type: 'text', text: testPrompt },
          { type: 'image_url', image_url: { url: fullDataUrl } }
        ];
      }

      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'YKS Takip Sistemi'
        },
        signal: AbortSignal.timeout(25000),
        body: JSON.stringify({
          model: modelId,
          messages: [{ role: 'user', content: messageContent }],
          max_tokens: 1024
        })
      });
      const latencyMs = Date.now() - startTime;
      if (!res.ok) {
        const body = await res.text();
        return { success: false, model: modelId, provider, latencyMs, error: `OpenRouter Hatası (${res.status})`, rawError: body };
      }
      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content || data?.choices?.[0]?.text || '';
      return { success: true, model: modelId, provider, latencyMs, output: text };
    }

    if (provider === 'GITHUB') {
      const apiKey = getEffectiveGithubApiKey();
      if (!apiKey) throw new Error('GitHub Models Token sisteme girilmemiş.');

      let messageContent: any = testPrompt;
      if (imageBase64) {
        const fullDataUrl = imageBase64.startsWith('data:')
          ? imageBase64
          : `data:${imageMimeType || 'image/jpeg'};base64,${imageBase64}`;
        messageContent = [
          { type: 'text', text: testPrompt },
          { type: 'image_url', image_url: { url: fullDataUrl } }
        ];
      }

      const res = await callGithubInferenceApi(apiKey, {
        model: modelId,
        messages: [{ role: 'user', content: messageContent }],
        max_tokens: 1024
      }, 25000);

      const latencyMs = Date.now() - startTime;
      if (!res.ok) {
        const body = await res.text();
        return { success: false, model: modelId, provider, latencyMs, error: `GitHub Models Hatası (${res.status})`, rawError: body };
      }
      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content || data?.choices?.[0]?.text || '';
      return { success: true, model: modelId, provider, latencyMs, output: text };
    }

    throw new Error('Geçersiz sağlayıcı.');
  } catch (err: any) {
    const latencyMs = Date.now() - startTime;
    return {
      success: false,
      model: modelId,
      provider,
      latencyMs,
      error: err.message || 'Model test edilirken hata oluştu.',
      rawError: String(err)
    };
  }
}

