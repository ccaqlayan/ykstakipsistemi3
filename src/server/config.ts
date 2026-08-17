import express from 'express';
import path from 'path';
import fs from 'fs';
import { google } from 'googleapis';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, getDocs, deleteDoc } from 'firebase/firestore';
import { GoogleGenAI } from '@google/genai';

export const PORT = process.env.PORT || 3000;
export const JWT_SECRET = process.env.JWT_SECRET || 'yks-takip-super-secret-key-2026';
export const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
export const uploadsDir = path.join(process.cwd(), 'public', 'uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

export let db: any = null;

// Global dynamic Gemini API key
export let customGeminiApiKey: string = '';
export function setCustomGeminiApiKey(val: string) { customGeminiApiKey = val; }
export function getEffectiveGeminiApiKey(): string { 
  return (customGeminiApiKey || process.env.GEMINI_API_KEY || '').trim(); 
}

// Global dynamic Groq API key
export let customGroqApiKey: string = '';
export function setCustomGroqApiKey(val: string) { customGroqApiKey = val; }
export function getEffectiveGroqApiKey(): string { 
  return (customGroqApiKey || process.env.GROQ_API_KEY || '').trim(); 
}

// Global dynamic OpenRouter API key
export let customOpenRouterApiKey: string = '';
export function setCustomOpenRouterApiKey(val: string) { customOpenRouterApiKey = val; }
export function getEffectiveOpenRouterApiKey(): string { 
  return (customOpenRouterApiKey || process.env.OPENROUTER_API_KEY || '').trim(); 
}

// Global AI Provider Failover Mode
export type AiProviderMode = 'AUTO_FALLBACK' | 'GEMINI_ONLY' | 'GROQ_ONLY' | 'OPENROUTER_ONLY';
export let aiProviderMode: AiProviderMode = 'AUTO_FALLBACK';
export function setAiProviderMode(val: AiProviderMode) { aiProviderMode = val; }
export function getEffectiveProviderMode(): AiProviderMode { return aiProviderMode; }

// Global master switch to turn all AI features ON or OFF for the school
export let aiFeaturesEnabled: boolean = true;
export function setAiFeaturesEnabled(val: boolean) { aiFeaturesEnabled = val; }

// Global configurable model mapping for each AI feature
export let featureModelConfig: Record<string, string> = {
  AI_COACH_STUDENT: 'SYSTEM_DEFAULT',
  AI_COACH_CLASS: 'SYSTEM_DEFAULT',
  SOLVE_QUESTION: 'SYSTEM_DEFAULT',
  QUESTION_ANALYSIS: 'SYSTEM_DEFAULT',
  SIMILAR_QUESTION: 'SYSTEM_DEFAULT',
  ERROR_PRIORITY: 'SYSTEM_DEFAULT',
  TOPIC_TIPS: 'SYSTEM_DEFAULT',
  YOUTUBE_PLANNER: 'SYSTEM_DEFAULT',
  PDF_REPORT_PARSE: 'SYSTEM_DEFAULT'
};
export function setFeatureModelConfig(cfg: Record<string, string>) { featureModelConfig = cfg; }

// Global configurable anomaly limit threshold (TRY/day)
export let anomalyLimitTRY: number = 5.0;
export function setAnomalyLimitTRY(val: number) { anomalyLimitTRY = val; }

// Global configurable AI Coach Data settings
export let coachDataSettings: Record<string, { enabled: boolean; limit?: number }> = {
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
export let savePromptLogs = true;
export function setSavePromptLogs(val: boolean) { savePromptLogs = val; }
export function setCoachDataSettings(cfg: Record<string, { enabled: boolean; limit?: number }>) { coachDataSettings = cfg; }

export interface ApiUsageRecord {
  id: string;
  timestamp: string;
  featureKey: string;
  featureName: string;
  category: 'AI_COACH' | 'QUESTION_ANALYSIS';
  provider?: 'GEMINI' | 'GROQ' | 'OPENROUTER' | string;
  isFreeTier?: boolean;
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

export let apiUsageLogsStore: ApiUsageRecord[] = [];

export async function initFirebaseAndLogs() {
  if (fs.existsSync(configPath)) {
    try {
      const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
      db = firebaseConfig.firestoreDatabaseId 
        ? getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId)
        : getFirestore(firebaseApp);
      console.log('Firebase initialized in server.ts');

      // Load gemini settings from Firestore if they exist
      try {
        const settingsSnap = await getDocs(collection(db, 'system_config'));
        const settingsDoc = settingsSnap.docs.find(d => d.id === 'gemini_settings');
        if (settingsDoc) {
          const sData = settingsDoc.data();
          if (typeof sData.geminiApiKey === 'string' && sData.geminiApiKey.trim()) {
            customGeminiApiKey = sData.geminiApiKey.trim();
          }
          if (typeof sData.groqApiKey === 'string' && sData.groqApiKey.trim()) {
            customGroqApiKey = sData.groqApiKey.trim();
          }
          if (typeof sData.openRouterApiKey === 'string' && sData.openRouterApiKey.trim()) {
            customOpenRouterApiKey = sData.openRouterApiKey.trim();
          }
          if (sData.aiProviderMode && ['AUTO_FALLBACK', 'GEMINI_ONLY', 'GROQ_ONLY', 'OPENROUTER_ONLY'].includes(sData.aiProviderMode)) {
            aiProviderMode = sData.aiProviderMode;
          }
          if (typeof sData.aiFeaturesEnabled === 'boolean') {
            aiFeaturesEnabled = sData.aiFeaturesEnabled;
          }
          if (typeof sData.savePromptLogs === 'boolean') {
            savePromptLogs = sData.savePromptLogs;
          }
          if (sData.featureModelConfig && typeof sData.featureModelConfig === 'object') {
            const sanitized: Record<string, string> = {};
            for (const [k, v] of Object.entries(sData.featureModelConfig)) {
              const val = String(v || '').trim();
              if (!val || val === 'SYSTEM_DEFAULT' || val === 'auto') {
                sanitized[k] = 'SYSTEM_DEFAULT';
              } else {
                sanitized[k] = mapToActualGeminiModel(val);
              }
            }
            featureModelConfig = { ...featureModelConfig, ...sanitized };
          }
          if (typeof sData.anomalyLimitTRY === 'number') {
            anomalyLimitTRY = sData.anomalyLimitTRY;
          }
          if (sData.coachDataSettings && typeof sData.coachDataSettings === 'object') {
            coachDataSettings = { ...coachDataSettings, ...sData.coachDataSettings };
          }
          console.log('Loaded multi-provider AI settings from Firestore.');
        }
      } catch (err) {
        console.warn('Failed to load gemini settings from Firestore (could be quota exceeded):', err);
      }

      // Load logs from Firestore
      try {
        const logsSnap = await getDocs(collection(db, 'api_usage_logs'));
        const logs: ApiUsageRecord[] = [];
        logsSnap.forEach(d => {
          if (d.id !== '_clear_api_logs_marker_v1') {
            logs.push(d.data() as ApiUsageRecord);
          }
        });
        logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        apiUsageLogsStore = logs;
        console.log(`Loaded ${logs.length} API usage logs from Firestore.`);
      } catch (err) {
        console.warn('Failed to load API usage logs from Firestore (could be quota exceeded):', err);
      }
    } catch (e) {
      console.error('Error initializing Firebase in server.ts:', e);
    }
  } else {
    console.warn('firebase-applet-config.json not found in server.ts');
  }
}

export function isAiEnabledOrRespond(res: express.Response): boolean {
  if (!aiFeaturesEnabled) {
    res.status(403).json({
      success: false,
      error: 'Yapay zeka özellikleri sistem ayarlarında devre dışı bırakılmıştır.'
    });
    return false;
  }
  return true;
}

export function recordApiUsage(params: {
  featureKey: string;
  featureName: string;
  category: 'AI_COACH' | 'QUESTION_ANALYSIS';
  provider?: 'GEMINI' | 'GROQ' | 'OPENROUTER' | string;
  isFreeTier?: boolean;
  modelUsed: string;
  promptTokens: number;
  candidatesTokens: number;
  promptText?: string;
  responseText?: string;
  userId?: string;
  userName?: string;
  userRole?: string;
}) {
  const model = (params.modelUsed || '').toLowerCase();
  
  // Auto-detect provider if not explicitly passed
  let provider = (params.provider || '').toUpperCase();
  if (!provider) {
    if (model.includes('llama') || model.includes('mixtral') || model.includes('gemma')) {
      provider = 'GROQ';
    } else if (model.includes('openrouter') || model.includes('deepseek') || model.includes('qwen') || model.includes('mistral') || model.includes('phi-') || model.includes('/')) {
      provider = 'OPENROUTER';
    } else {
      provider = 'GEMINI';
    }
  }

  // Check if this is a zero-cost free-tier query (Groq, OpenRouter :free, or explicit free tier)
  const isFree = Boolean(
    params.isFreeTier ||
    provider === 'GROQ' ||
    provider === 'OPENROUTER' ||
    model.includes(':free') ||
    model.includes('/free')
  );

  let inputRate = 5.00 / 1000000;
  let outputRate = 21.00 / 1000000;

  if (isFree) {
    inputRate = 0;
    outputRate = 0;
  } else if (model.includes('gemini-3.1-pro') || model.includes('gemini-3-pro')) {
    inputRate = 7.00 / 1000000;
    outputRate = 21.00 / 1000000;
  } else if (model.includes('gemini-2.5-pro')) {
    inputRate = 5.00 / 1000000;
    outputRate = 20.00 / 1000000;
  } else if (model.includes('gemini-3.6-flash')) {
    inputRate = 5.00 / 1000000;
    outputRate = 21.00 / 1000000;
  } else if (model.includes('gemini-3.5-flash-lite') || model.includes('gemini-3.1-flash-lite')) {
    inputRate = 0.35 / 1000000;
    outputRate = 1.40 / 1000000;
  } else if (model.includes('gemini-3.5-flash')) {
    inputRate = 5.00 / 1000000;
    outputRate = 21.00 / 1000000;
  } else if (model.includes('gemini-2.5-flash-lite') || model.includes('lite')) {
    inputRate = 0.35 / 1000000;
    outputRate = 1.40 / 1000000;
  } else if (model.includes('gemini-2.5-flash') || model.includes('flash')) {
    inputRate = 5.00 / 1000000;
    outputRate = 21.00 / 1000000;
  }

  const estimatedCostUSD = isFree ? 0 : (params.promptTokens * inputRate) + (params.candidatesTokens * outputRate);
  const BILLED_USD_TO_TRY_RATE = 45.00;
  const estimatedCostTRY = isFree ? 0 : estimatedCostUSD * BILLED_USD_TO_TRY_RATE;

  const record: ApiUsageRecord = {
    id: `use-log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
    featureKey: params.featureKey,
    featureName: params.featureName,
    category: params.category,
    provider,
    isFreeTier: isFree,
    modelUsed: params.modelUsed,
    promptTokens: params.promptTokens,
    candidatesTokens: params.candidatesTokens,
    totalTokens: params.promptTokens + params.candidatesTokens,
    estimatedCostUSD,
    estimatedCostTRY,
    promptText: savePromptLogs ? (params.promptText || undefined) : undefined,
    responseText: savePromptLogs ? (params.responseText || undefined) : undefined,
    userId: params.userId || undefined,
    userName: params.userName || undefined,
    userRole: params.userRole || undefined
  };

  apiUsageLogsStore.unshift(record);
  if (apiUsageLogsStore.length > 500) {
    apiUsageLogsStore = apiUsageLogsStore.slice(0, 500);
  }

  if (db) {
    try {
      const cleanData = JSON.parse(JSON.stringify(record));
      setDoc(doc(db, 'api_usage_logs', record.id), cleanData).catch(err => {
        console.warn('Failed to persist api log to firestore:', err.message);
      });
    } catch (e) {
      console.warn('Failed to persist api log to firestore:', e);
    }
  }

  return record;
}

export async function clearApiUsageLogs(olderThanDays = 30) {
  const cutoffTime = Date.now() - (olderThanDays * 24 * 60 * 60 * 1000);

  const logsToDelete = apiUsageLogsStore.filter(log => {
    const logTime = new Date(log.timestamp).getTime();
    return isNaN(logTime) || logTime < cutoffTime;
  });

  const remainingLogs = apiUsageLogsStore.filter(log => {
    const logTime = new Date(log.timestamp).getTime();
    return !isNaN(logTime) && logTime >= cutoffTime;
  });

  apiUsageLogsStore.length = 0;
  apiUsageLogsStore.push(...remainingLogs);

  if (db) {
    try {
      const snap = await getDocs(collection(db, 'api_usage_logs'));
      const deletePromises: Promise<any>[] = [];
      snap.forEach(d => {
        const data = d.data();
        const t = data.timestamp ? new Date(data.timestamp).getTime() : 0;
        if (isNaN(t) || t < cutoffTime) {
          deletePromises.push(deleteDoc(doc(db, 'api_usage_logs', d.id)).catch(() => {}));
        }
      });
      await Promise.all(deletePromises);
    } catch (e) {
      console.warn('Failed to clear firestore api logs:', e);
    }
  }

  return { deletedCount: logsToDelete.length };
}

export async function fetchLiveGoogleModels(): Promise<{ id: string; name: string; badge: string }[]> {
  return [
    { id: 'SYSTEM_DEFAULT', name: '⚡ Sistem Otomatik (Önerilen Kalite Zinciri: 3.7 ➔ 3.6 ➔ 3.5 ➔ Pro)', badge: 'Varsayılan & Önerilen' },
    { id: 'gemini-3.7-flash', name: 'Gemini 3.7 Flash (En Gelişmiş Akıl Yürütme & Hızlı)', badge: 'Gelişmiş' },
    { id: 'gemini-3.6-flash', name: 'Gemini 3.6 Flash (Dengeli Hız & Kalite)', badge: 'Dengeli' },
    { id: 'gemini-3.5-flash-lite', name: 'Gemini 3.5 Flash-Lite (En Ekonomik & Ultra Hafif)', badge: 'Ekonomik' },
    { id: 'gemini-3.1-pro', name: 'Gemini 3.1 Pro (Derin Strateji & Ağır Analiz)', badge: 'Pro' }
  ];
}

export function mapToActualGeminiModel(modelId?: string): string {
  const m = (modelId || '').trim();
  if (!m || m === 'SYSTEM_DEFAULT' || m === 'auto' || m === 'system_auto') return 'gemini-3.7-flash';
  // Map deprecated models to current active Gemini 3.x models
  const deprecatedMap: Record<string, string> = {
    'gemini-2.0-flash': 'gemini-3.7-flash',
    'gemini-2.0-flash-lite': 'gemini-3.5-flash-lite',
    'gemini-2.5-flash': 'gemini-3.6-flash',
    'gemini-2.5-pro': 'gemini-3.1-pro',
    'gemini-1.5-flash': 'gemini-3.7-flash',
    'gemini-1.5-pro': 'gemini-3.1-pro',
    'gemini-flash-lite-latest': 'gemini-3.5-flash-lite'
  };
  if (deprecatedMap[m]) return deprecatedMap[m];
  if (m.startsWith('gemma')) return 'gemini-3.5-flash-lite';
  return m;
}

export async function generateContentWithFallback(
  ai: any,
  options: {
    model: string;
    contents: any;
    config?: any;
  }
) {
  const requestedModel = options.model || 'SYSTEM_DEFAULT';
  const primaryApiModel = mapToActualGeminiModel(requestedModel);

  // Quality-first fallback hierarchy: 3.7 Flash -> 3.6 Flash -> 3.5 Flash-Lite -> 3.1 Pro
  const staticFallbacks = ['gemini-3.7-flash', 'gemini-3.6-flash', 'gemini-3.5-flash-lite', 'gemini-3.1-pro'];

  const fallbackList: { requested: string; apiModel: string }[] = [
    { requested: requestedModel, apiModel: primaryApiModel }
  ];

  for (const sf of staticFallbacks) {
    if (sf !== primaryApiModel) {
      fallbackList.push({ requested: sf, apiModel: sf });
    }
  }

  const uniqueList: { requested: string; apiModel: string }[] = [];
  const seenApiModels = new Set<string>();

  for (const item of fallbackList) {
    if (!seenApiModels.has(item.apiModel)) {
      seenApiModels.add(item.apiModel);
      uniqueList.push(item);
    }
  }

  let lastError: any = null;

  for (const item of uniqueList) {
    let retries = 1;
    while (retries >= 0) {
      try {
        console.log(`Generating content using API model: ${item.apiModel} (Requested config model: ${requestedModel}, Retries left: ${retries})`);
        const mergedConfig = {
          maxOutputTokens: 2048,
          ...(options.config || {})
        };
        const response = await ai.models.generateContent({
          model: item.apiModel,
          contents: options.contents,
          config: mergedConfig,
        });
        const reportedModel = (item.apiModel === primaryApiModel) ? requestedModel : item.requested;
        return { response, modelUsed: reportedModel };
      } catch (err: any) {
        lastError = err;
        console.warn(`Model ${item.apiModel} failed (Retries left: ${retries}):`, err.message || err);
        const errMsg = err?.message || String(err || '');
        const isAuthError = err.status === 401 || errMsg.includes('401') || errMsg.includes('UNAUTHENTICATED') || errMsg.includes('ACCESS_TOKEN_TYPE_UNSUPPORTED') || errMsg.includes('invalid authentication credentials');
        if (isAuthError) {
          // Immediately throw authentication failure so user gets the accurate 401 message
          throw err;
        }
        const isNotFound = err.status === 404 || errMsg.includes('not found') || errMsg.includes('no longer available') || errMsg.includes('unsupported') || errMsg.includes('Thinking is not enabled');
        if (isNotFound) {
          break; // Model not available or invalid arguments, try next fallback model immediately
        }
        retries--;
        if (retries >= 0) {
          await new Promise((resolve) => setTimeout(resolve, 800));
        }
      }
    }
  }

  throw lastError || new Error('All Gemini model fallbacks exhausted.');
}

export function getOAuth2Client(req?: express.Request) {
  const redirectUri = process.env.APP_URL 
    ? `${process.env.APP_URL.replace(/\/$/, '')}/api/auth/google/callback`
    : `http://localhost:${PORT}/api/auth/google/callback`;

  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID || '',
    process.env.GOOGLE_CLIENT_SECRET || '',
    redirectUri
  );
}

// Verification codes memory storage
export const verificationCodes = new Map<string, { code: string; expiresAt: number }>();
export const codeRequestTimestamps = new Map<string, number[]>();
export const registrationRequestTimestamps = new Map<string, number[]>();

export async function sendEmailHelper(to: string, subject: string, htmlContent: string): Promise<{ success: boolean; method?: string; error?: string }> {
  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
  const smtpPort = parseInt(process.env.SMTP_PORT || '587');
  const smtpUser = process.env.SMTP_USER || '';
  const smtpPass = process.env.SMTP_PASS || '';
  const smtpFrom = process.env.SMTP_FROM || '"YKS Takip Sistemi" <no-reply@yksyolarkadasim.com>';
  const resendApiKey = process.env.RESEND_API_KEY || '';

  if (resendApiKey) {
    try {
      console.log(`Sending email to ${to} via Resend API...`);
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: smtpFrom.includes('<') ? smtpFrom : `"YKS Takip Sistemi" <onboarding@resend.dev>`,
          to: [to],
          subject: subject,
          html: htmlContent
        })
      });
      const data = await response.json() as any;
      if (response.ok) {
        console.log(`Email successfully sent via Resend API. ID: ${data.id}`);
        return { success: true, method: 'Resend API' };
      } else {
        console.error('Resend API error:', data);
        throw new Error(data.message || 'Resend API returned an error');
      }
    } catch (err: any) {
      console.error('Failed to send via Resend API, will try SMTP next if available...', err.message);
    }
  }

  if (smtpUser && smtpPass) {
    try {
      console.log(`Sending email to ${to} via SMTP (${smtpHost})...`);
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass
        }
      });

      await transporter.sendMail({
        from: smtpFrom,
        to,
        subject,
        html: htmlContent
      });

      console.log(`Email successfully sent via SMTP to ${to}`);
      return { success: true, method: 'SMTP' };
    } catch (err: any) {
      console.error('SMTP Error:', err);
      return { success: false, error: err.message || 'SMTP sending failed' };
    }
  }

  return { success: false, error: 'E-posta servis sağlayıcısı (SMTP veya Resend) yapılandırılmamış.' };
}

export function getAuthUserFromRequest(req: express.Request): { uid: string; id: string; role: string; name?: string } | null {
  let token = req.cookies.session_token;
  if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const userId = decoded.uid || decoded.id;
    return {
      uid: userId,
      id: userId,
      role: decoded.role || 'student',
      name: decoded.name
    };
  } catch (err) {
    return null;
  }
}

export async function removeStorageFileInternal(pathOrUrl: string) {
  if (!pathOrUrl) return;
  let storagePath = pathOrUrl;
  if (pathOrUrl.includes('/o/')) {
    const parts = pathOrUrl.split('/o/');
    if (parts[1]) {
      storagePath = decodeURIComponent(parts[1].split('?')[0]);
    }
  } else if (pathOrUrl.startsWith('/uploads/')) {
    storagePath = pathOrUrl.replace('/uploads/', '').split('?')[0];
  }

  if (fs.existsSync(configPath)) {
    try {
      const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      const { initializeApp: initAdmin, getApps: getAdminApps } = await import('firebase-admin/app');
      const { getStorage: getAdminStorage } = await import('firebase-admin/storage');

      if (getAdminApps().length === 0) {
        initAdmin({
          projectId: firebaseConfig.projectId,
          storageBucket: firebaseConfig.storageBucket || `${firebaseConfig.projectId}.firebasestorage.app`
        });
      }
      const bucketName = firebaseConfig.storageBucket || `${firebaseConfig.projectId}.firebasestorage.app`;
      const bucket = getAdminStorage().bucket(bucketName);
      await bucket.file(storagePath).delete({ ignoreNotFound: true });
    } catch (e: any) {
      console.warn('Firebase Storage delete warning:', e.message);
    }
  }

  const localFilePath = path.join(uploadsDir, storagePath);
  if (fs.existsSync(localFilePath)) {
    fs.unlinkSync(localFilePath);
  }
}

export function computeDirectoryInfo(dirPath: string, maxDepth = 4, currentDepth = 0): { bytes: number; fileCount: number } {
  let bytes = 0;
  let fileCount = 0;
  if (currentDepth > maxDepth) return { bytes, fileCount };
  try {
    if (!fs.existsSync(dirPath)) return { bytes: 0, fileCount: 0 };
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        const sub = computeDirectoryInfo(fullPath, maxDepth, currentDepth + 1);
        bytes += sub.bytes;
        fileCount += sub.fileCount;
      } else if (entry.isFile()) {
        try {
          const stats = fs.statSync(fullPath);
          bytes += stats.size;
          fileCount++;
        } catch (_) {}
      }
    }
  } catch (_) {}
  return { bytes, fileCount };
}

export function verifyAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const token = req.cookies.session_token;
  if (!token) {
    return res.status(401).json({ success: false, error: 'Oturum bulunamadı. Lütfen tekrar giriş yapın.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { uid: string; role: string };
    if (decoded.role === 'admin') {
      next();
    } else {
      return res.status(403).json({ success: false, error: 'Bu işlemi gerçekleştirmek için yetkiniz yok.' });
    }
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Geçersiz oturum. Lütfen tekrar giriş yapın.' });
  }
}
