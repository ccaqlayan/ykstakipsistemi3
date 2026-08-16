import { GoogleGenAI } from '@google/genai';
import { 
  getEffectiveGeminiApiKey, 
  getEffectiveGroqApiKey, 
  getEffectiveOpenRouterApiKey, 
  getEffectiveProviderMode,
  generateContentWithFallback,
  mapToActualGeminiModel
} from '../config';

export type AiProvider = 'GEMINI' | 'GROQ' | 'OPENROUTER';
export type AiProviderMode = 'AUTO_FALLBACK' | 'GEMINI_ONLY' | 'GROQ_ONLY' | 'OPENROUTER_ONLY';

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

  const targetModel = mapToActualGeminiModel(options.modelOverride || 'gemini-3.5-flash-lite');
  
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

  const text = response?.candidates?.[0]?.content?.parts?.[0]?.text || response?.text || '';
  const usage = response?.usageMetadata || {};

  return {
    text: text.trim(),
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

  // Groq decommissioned Llama 3.2 Vision models on their platform
  if (hasImage) {
    throw new Error('Groq Cloud şu anda görsel (Vision) modellerini desteklememektedir (Llama 3.2 Vision modelleri Groq tarafından kullanımdan kaldırılmıştır). Görsel analiz Google Gemini veya OpenRouter üzerinden işlenmektedir.');
  }

  const model = 'llama-3.3-70b-versatile';

  const messages: any[] = [];

  if (options.systemInstruction) {
    messages.push({ role: 'system', content: options.systemInstruction });
  }

  messages.push({ role: 'user', content: options.prompt });

  const requestBody: any = {
    model,
    messages,
    max_tokens: options.maxTokens || 4096,
    temperature: options.temperature ?? 0.3
  };

  if (options.requireJson) {
    requestBody.response_format = { type: 'json_object' };
  }

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Groq API Hatası (${res.status}): ${errBody.substring(0, 300)}`);
  }

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content || '';
  const usage = data?.usage || {};

  return {
    text: text.trim(),
    providerUsed: 'GROQ',
    modelUsed: model,
    promptTokens: usage.prompt_tokens || 0,
    candidatesTokens: usage.completion_tokens || 0
  };
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

  // Use openrouter/free auto-router as primary (auto-picks best available free model)
  // then fall back to specific free models if the auto-router fails
  const candidateModels = hasImage
    ? [
        'openrouter/free',
        'meta-llama/llama-3.2-11b-vision-instruct:free',
        'qwen/qwen-2.5-vl-72b-instruct:free',
        'google/gemini-2.0-flash-exp:free',
        'google/gemini-flash-1.5:free'
      ]
    : [
        'openrouter/free',
        'meta-llama/llama-3.3-70b-instruct:free',
        'deepseek/deepseek-chat:free',
        'qwen/qwen-2.5-72b-instruct:free',
        'google/gemini-2.0-flash-exp:free',
        'microsoft/phi-4-reasoning-plus:free'
      ];

  const messages: any[] = [];

  if (options.systemInstruction) {
    messages.push({ role: 'system', content: options.systemInstruction });
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
        body: JSON.stringify(requestBody)
      });

      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(`OpenRouter API Hatası (${res.status}): ${errBody.substring(0, 300)}`);
      }

      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content || '';
      const usage = data?.usage || {};
      const resolvedModel = data?.model || model;

      return {
        text: text.trim(),
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
 * Universal Unified Execution Engine with Failover Pipeline
 * Order: Gemini -> Groq -> OpenRouter
 */
export async function executeAiUnifiedRequest(options: UnifiedAiRequestOptions): Promise<UnifiedAiResponse> {
  const mode = getEffectiveProviderMode();

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

  // Mode 4: AUTO_FALLBACK (Gemini -> Groq -> OpenRouter)
  const providersToTry: { name: AiProvider; fn: () => Promise<UnifiedAiResponse> }[] = [];

  if (getEffectiveGeminiApiKey()) {
    providersToTry.push({ name: 'GEMINI', fn: () => callGemini(options) });
  }
  if (getEffectiveGroqApiKey()) {
    providersToTry.push({ name: 'GROQ', fn: () => callGroq(options) });
  }
  if (getEffectiveOpenRouterApiKey()) {
    providersToTry.push({ name: 'OPENROUTER', fn: () => callOpenRouter(options) });
  }

  if (providersToTry.length === 0) {
    // If no key is set, attempt Gemini so accurate error is returned
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
  provider: 'gemini' | 'groq' | 'openrouter',
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
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${trimmed}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: 'Test ping. Respond with OK.' }],
          max_tokens: 10
        })
      });
      if (!res.ok) {
        const body = await res.text();
        return { success: false, message: `Groq Doğrulama Hatası (${res.status}): ${body.substring(0, 200)}` };
      }
      return { success: true, message: 'Groq Cloud bağlantısı başarılı!', modelUsed: 'llama-3.3-70b-versatile' };
    }

    if (provider === 'openrouter') {
      // Use openrouter/auto as primary, then specific free models as fallback
      const testModels = [
        'openrouter/free',
        'meta-llama/llama-3.3-70b-instruct:free',
        'google/gemini-3.5-flash-lite-exp:free',
        'qwen/qwen-2.5-72b-instruct:free',
        'microsoft/phi-4-reasoning-plus:free',
        'mistralai/mistral-7b-instruct:free'
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

    return { success: false, message: 'Bilinmeyen sağlayıcı.' };
  } catch (err: any) {
    return { success: false, message: err.message || 'Bağlantı testi sırasında hata oluştu.' };
  }
}
