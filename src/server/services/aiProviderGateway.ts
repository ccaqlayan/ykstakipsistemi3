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

  // Active Groq models: qwen/qwen3.6-27b for vision; gpt-oss-120b, 20b etc. for text
  const candidateModels = hasImage
    ? [
        'qwen/qwen3.6-27b'
      ]
    : [
        'openai/gpt-oss-120b',
        'openai/gpt-oss-20b',
        'qwen/qwen3.6-27b',
        'llama-3.3-70b-specdec'
      ];

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

  // Vision models prioritized for multimodal requests, top-rated text models for text
  const candidateModels = hasImage
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
 * Universal Unified Execution Engine with Failover Pipeline
 * Order: Gemini -> Groq -> OpenRouter
 */
export async function executeAiUnifiedRequest(options: UnifiedAiRequestOptions): Promise<UnifiedAiResponse> {
  const mode = getEffectiveProviderMode();
  const imgDataUrl = getImageDataUrl(options);
  const hasImage = Boolean(imgDataUrl);

  // If request contains an image and mode is GROQ_ONLY:
  // Since Groq API currently only provides text LLMs, automatically use Gemini or OpenRouter for image reasoning if keys exist
  if (hasImage && mode === 'GROQ_ONLY') {
    if (getEffectiveGeminiApiKey()) {
      console.log('[AI_GATEWAY] Image detected in GROQ_ONLY mode. Seamlessly routing to Google Gemini Vision...');
      try {
        return await callGemini(options);
      } catch (err: any) {
        console.warn('[AI_GATEWAY] Gemini failed for image in GROQ_ONLY mode, continuing with Groq/OpenRouter fallback...', err);
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

  // Mode 4: AUTO_FALLBACK (Gemini -> Groq -> OpenRouter)
  // When an image is present, prioritize vision-capable providers (Gemini -> OpenRouter -> Groq)
  const providersToTry: { name: AiProvider; fn: () => Promise<UnifiedAiResponse> }[] = [];

  if (hasImage) {
    if (getEffectiveGeminiApiKey()) {
      providersToTry.push({ name: 'GEMINI', fn: () => callGemini(options) });
    }
    if (getEffectiveOpenRouterApiKey()) {
      providersToTry.push({ name: 'OPENROUTER', fn: () => callOpenRouter(options) });
    }
    if (getEffectiveGroqApiKey()) {
      providersToTry.push({ name: 'GROQ', fn: () => callGroq(options) });
    }
  } else {
    if (getEffectiveGeminiApiKey()) {
      providersToTry.push({ name: 'GEMINI', fn: () => callGemini(options) });
    }
    if (getEffectiveGroqApiKey()) {
      providersToTry.push({ name: 'GROQ', fn: () => callGroq(options) });
    }
    if (getEffectiveOpenRouterApiKey()) {
      providersToTry.push({ name: 'OPENROUTER', fn: () => callOpenRouter(options) });
    }
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
          'llama-3.3-70b-specdec'
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
          return { success: false, message: `Groq Doğrulama Hatası (${res.status}): ${body.substring(0, 200)}` };
        }
        return { success: true, message: 'Groq Cloud bağlantısı başarılı!', modelUsed: selectedModel };
      } catch (err: any) {
        return { success: false, message: `Groq Bağlantı Hatası: ${err.message}` };
      }
    }

    if (provider === 'openrouter') {
      // Use specific active free models
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

    return { success: false, message: 'Bilinmeyen sağlayıcı.' };
  } catch (err: any) {
    return { success: false, message: err.message || 'Bağlantı testi sırasında hata oluştu.' };
  }
}
