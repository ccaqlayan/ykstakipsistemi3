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

// Global master switch to turn all AI features ON or OFF for the school
export let aiFeaturesEnabled: boolean = true;
export function setAiFeaturesEnabled(val: boolean) { aiFeaturesEnabled = val; }

// Global configurable model mapping for each AI feature
export let featureModelConfig: Record<string, string> = {
  AI_COACH_STUDENT: 'gemini-3.1-flash-lite',
  AI_COACH_CLASS: 'gemini-3.1-flash-lite',
  SOLVE_QUESTION: 'gemini-3.1-flash-lite',
  QUESTION_ANALYSIS: 'gemini-3.1-flash-lite',
  SIMILAR_QUESTION: 'gemini-3.1-flash-lite',
  ERROR_PRIORITY: 'gemini-3.1-flash-lite',
  TOPIC_TIPS: 'gemini-3.1-flash-lite',
  YOUTUBE_PLANNER: 'gemini-3.1-flash-lite'
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
          if (typeof sData.aiFeaturesEnabled === 'boolean') {
            aiFeaturesEnabled = sData.aiFeaturesEnabled;
          }
          if (typeof sData.savePromptLogs === 'boolean') {
            savePromptLogs = sData.savePromptLogs;
          }
          if (sData.featureModelConfig && typeof sData.featureModelConfig === 'object') {
            const sanitized: Record<string, string> = {};
            for (const [k, v] of Object.entries(sData.featureModelConfig)) {
              sanitized[k] = (v === 'gemini-2.5-flash-lite' || v === 'gemini-3.5-flash-lite') ? 'gemini-3.1-flash-lite' : String(v);
            }
            featureModelConfig = { ...featureModelConfig, ...sanitized };
          }
          if (typeof sData.anomalyLimitTRY === 'number') {
            anomalyLimitTRY = sData.anomalyLimitTRY;
          }
          if (sData.coachDataSettings && typeof sData.coachDataSettings === 'object') {
            coachDataSettings = { ...coachDataSettings, ...sData.coachDataSettings };
          }
          console.log('Loaded gemini settings from Firestore.');
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
  modelUsed: string;
  promptTokens: number;
  candidatesTokens: number;
  promptText?: string;
  responseText?: string;
  userId?: string;
  userName?: string;
  userRole?: string;
}) {
  const model = params.modelUsed.toLowerCase();

  let inputRate = 5.00 / 1000000;
  let outputRate = 21.00 / 1000000;

  if (model.includes('gemini-3.1-pro') || model.includes('gemini-3-pro')) {
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

  const estimatedCostUSD = (params.promptTokens * inputRate) + (params.candidatesTokens * outputRate);
  const BILLED_USD_TO_TRY_RATE = 45.00;
  const estimatedCostTRY = estimatedCostUSD * BILLED_USD_TO_TRY_RATE;

  const record: ApiUsageRecord = {
    id: `use-log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
    featureKey: params.featureKey,
    featureName: params.featureName,
    category: params.category,
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

export function mapToActualGeminiModel(modelId: string): string {
  const m = (modelId || '').trim();
  if (!m) return 'gemini-3.1-flash-lite';
  if (m === 'gemini-2.5-flash-lite' || m.includes('2.5-flash-lite')) {
    return 'gemini-3.1-flash-lite';
  }
  if (m === 'gemini-3.5-flash-lite') return 'gemini-3.1-flash-lite';
  if (m === 'gemini-3.5-flash') return 'gemini-3.6-flash';
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
  const requestedModel = options.model || 'gemini-3.1-flash-lite';
  const primaryApiModel = mapToActualGeminiModel(requestedModel);

  const fallbackList = [
    { requested: requestedModel, apiModel: primaryApiModel },
    { requested: 'gemini-3.1-flash-lite', apiModel: 'gemini-3.1-flash-lite' },
    { requested: 'gemini-3.6-flash', apiModel: 'gemini-3.6-flash' },
    { requested: 'gemini-flash-latest', apiModel: 'gemini-flash-latest' }
  ];

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
    let retries = 2;
    while (retries >= 0) {
      try {
        console.log(`Generating content using API model: ${item.apiModel} (Requested config model: ${requestedModel}, Retries left: ${retries})`);
        const mergedConfig = {
          maxOutputTokens: 2048,
          thinkingConfig: { thinkingBudget: 0 },
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
        if (err.status === 404 || err.message?.includes('not found') || err.message?.includes('unsupported model')) {
          break;
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
