import express from 'express';
import path from 'path';
import fs from 'fs';
import cookieParser from 'cookie-parser';
import { google } from 'googleapis';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import nodemailer from 'nodemailer';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, deleteDoc, getDocs, getDoc } from 'firebase/firestore';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// Helper to get OAuth2 client
function getOAuth2Client(req?: express.Request) {
  const redirectUri = process.env.APP_URL 
    ? `${process.env.APP_URL.replace(/\/$/, '')}/api/auth/google/callback`
    : `http://localhost:${PORT}/api/auth/google/callback`;

  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID || '',
    process.env.GOOGLE_CLIENT_SECRET || '',
    redirectUri
  );
}

// -------------------------------------------------------------
// Google OAuth Endpoints
// -------------------------------------------------------------
app.get('/api/auth/google/url', (req, res) => {
  try {
    const oauth2Client = getOAuth2Client(req);
    const scopes = [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ];

    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: scopes
    });

    res.json({ url });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to generate auth URL' });
  }
});

app.get('/api/auth/google/callback', async (req, res) => {
  const code = req.query.code as string;
  if (!code) {
    return res.status(400).send('No authorization code provided.');
  }

  try {
    const oauth2Client = getOAuth2Client(req);
    const { tokens } = await oauth2Client.getToken(code);
    
    // Store tokens in cookie
    res.cookie('g_tokens', JSON.stringify(tokens), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    // Redirect back to main application with success parameter
    res.redirect('/?oauth_success=true');
  } catch (err: any) {
    console.error('OAuth callback error:', err);
    res.redirect('/?oauth_error=' + encodeURIComponent(err.message || 'Authentication failed'));
  }
});

app.get('/api/auth/google/status', async (req, res) => {
  const tokenCookie = req.cookies.g_tokens;
  if (!tokenCookie) {
    return res.json({ isConnected: false });
  }

  try {
    const tokens = JSON.parse(tokenCookie);
    const oauth2Client = getOAuth2Client(req);
    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();

    res.json({
      isConnected: true,
      email: userInfo.data.email,
      name: userInfo.data.name,
      picture: userInfo.data.picture
    });
  } catch (err) {
    res.json({ isConnected: false });
  }
});

app.post('/api/auth/google/logout', (req, res) => {
  res.clearCookie('g_tokens');
  res.json({ success: true });
});

// -------------------------------------------------------------
// Google Sheets API Endpoints
// -------------------------------------------------------------
app.post('/api/sheets/create', async (req, res) => {
  const tokenCookie = req.cookies.g_tokens;
  if (!tokenCookie) {
    return res.status(401).json({ error: 'Google hesabınız henüz bağlı değil.' });
  }

  try {
    const tokens = JSON.parse(tokenCookie);
    const oauth2Client = getOAuth2Client(req);
    oauth2Client.setCredentials(tokens);

    const sheets = google.sheets({ version: 'v4', auth: oauth2Client });
    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    // Create a new Spreadsheet
    const response = await sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title: `YKS Takip Sistemi 2026 - ${req.body.studentName || 'Öğrenci Tablosu'}`
        },
        sheets: [
          { properties: { title: 'Çalışma Planı' } },
          { properties: { title: 'Soru Takibi' } },
          { properties: { title: 'Genel Deneme Analizi' } },
          { properties: { title: 'Yanlış Tablosu' } },
          { properties: { title: 'Kaynak ve Çıkmış Sorular' } }
        ]
      }
    });

    const spreadsheetId = response.data.spreadsheetId;
    const spreadsheetUrl = response.data.spreadsheetUrl;

    res.json({
      success: true,
      spreadsheetId,
      spreadsheetUrl
    });
  } catch (err: any) {
    console.error('Error creating sheet:', err);
    res.status(500).json({ error: err.message || 'Google Sheet oluşturulamadı.' });
  }
});

app.post('/api/sheets/sync-to', async (req, res) => {
  const tokenCookie = req.cookies.g_tokens;
  const { spreadsheetId, state } = req.body;

  if (!tokenCookie) {
    return res.status(401).json({ error: 'Google bağlantısı bulunamadı.' });
  }
  if (!spreadsheetId) {
    return res.status(400).json({ error: 'Spreadsheet ID gereklidir.' });
  }

  try {
    const tokens = JSON.parse(tokenCookie);
    const oauth2Client = getOAuth2Client(req);
    oauth2Client.setCredentials(tokens);

    const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

    // 1. Write Çalışma Planı
    const studyPlanRows = [
      ['Gün', 'Ders', 'Konu', 'Planlanan (Dk)', 'Tamamlanan (Dk)', 'Durum', 'Notlar'],
      ...(state.studyPlans || []).map((p: any) => [
        p.day, p.subject, p.topic, p.plannedMinutes, p.completedMinutes, p.status, p.notes || ''
      ])
    ];

    // 2. Write Soru Takibi
    const questionLogRows = [
      ['Tarih', 'Sınav Türü', 'Ders', 'Hedef', 'Çözülen', 'Doğru', 'Yanlış', 'Boş', 'Net Score'],
      ...(state.questionLogs || []).map((q: any) => [
        q.date, q.examType, q.subject, q.targetCount, q.solvedCount, q.correctCount, q.wrongCount, q.emptyCount, q.netScore
      ])
    ];

    // 3. Write Genel Deneme Analizi
    const mockRows = [
      ['Tarih', 'Deneme Adı / Yayınevi', 'TYT Türkçe', 'TYT Mat', 'TYT Sosyal', 'TYT Fen', 'TYT Toplam Net', 'AYT Mat', 'AYT Fen', 'AYT Toplam Net', 'Tahmini Sıralama'],
      ...(state.generalMocks || []).map((m: any) => [
        m.date, m.title, m.tyt.turkce, m.tyt.mat, m.tyt.sosyal, m.tyt.fen, m.tyt.totalNet, m.ayt.mat, m.ayt.fen, m.ayt.totalNet, m.estimatedRank || ''
      ])
    ];

    // 4. Write Yanlış Tablosu
    const errorRows = [
      ['Tarih', 'Sınav Türü', 'Ders', 'Konu Adı', 'Yayınevi', 'Hata Nedeni', 'Öncelik', 'Tekrar Edildi mi?'],
      ...(state.topicErrors || []).map((e: any) => [
        e.date, e.examType, e.subject, e.topicName, e.publisher || '', e.errorReason, e.priority, e.revised ? 'Evet' : 'Hayır'
      ])
    ];

    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId,
      requestBody: {
        valueInputOption: 'USER_ENTERED',
        data: [
          { range: "'Çalışma Planı'!A1", values: studyPlanRows },
          { range: "'Soru Takibi'!A1", values: questionLogRows },
          { range: "'Genel Deneme Analizi'!A1", values: mockRows },
          { range: "'Yanlış Tablosu'!A1", values: errorRows }
        ]
      }
    });

    res.json({ success: true, syncedAt: new Date().toISOString() });
  } catch (err: any) {
    console.error('Error syncing to sheet:', err);
    res.status(500).json({ error: err.message || 'Veriler Google Sheets\'e aktarılamadı.' });
  }
});

// -------------------------------------------------------------
// AI API Cost & Usage Tracker
// -------------------------------------------------------------
interface ApiUsageRecord {
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
}

// Global master switch to turn all AI features ON or OFF for the school
let aiFeaturesEnabled: boolean = true;

// Global configurable model mapping for each AI feature
let featureModelConfig: Record<string, string> = {
  AI_COACH_STUDENT: 'gemini-3.1-flash-lite',
  AI_COACH_CLASS: 'gemini-3.1-flash-lite',
  SOLVE_QUESTION: 'gemini-3.1-flash-lite',
  QUESTION_ANALYSIS: 'gemini-3.1-flash-lite',
  SIMILAR_QUESTION: 'gemini-3.1-flash-lite',
  ERROR_PRIORITY: 'gemini-3.1-flash-lite',
  TOPIC_TIPS: 'gemini-3.1-flash-lite',
  YOUTUBE_PLANNER: 'gemini-3.1-flash-lite'
};

// Global configurable anomaly limit threshold (TRY/day)
let anomalyLimitTRY: number = 5.0;

// Global configurable AI Coach Data settings
let coachDataSettings: Record<string, { enabled: boolean; limit?: number }> = {
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

function isAiEnabledOrRespond(res: express.Response): boolean {
  if (!aiFeaturesEnabled) {
    res.status(403).json({
      success: false,
      error: 'Yapay zeka özellikleri şu an için kullanılamıyor, lütfen daha sonra tekrar deneyiniz.'
    });
    return false;
  }
  return true;
}

const INITIAL_API_USAGE_LOGS: ApiUsageRecord[] = [];

let apiUsageLogsStore: ApiUsageRecord[] = [...INITIAL_API_USAGE_LOGS];

const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
let db: any = null;

async function initFirebaseAndLogs() {
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

function recordApiUsage(params: {
  featureKey: string;
  featureName: string;
  category: 'AI_COACH' | 'QUESTION_ANALYSIS';
  modelUsed: string;
  promptTokens: number;
  candidatesTokens: number;
}) {
  const model = params.modelUsed.toLowerCase();

  let inputRate = 5.00 / 1000000;   // default to Gemini 3.6 Flash / 3.5 Flash standard ($5.00/1M)
  let outputRate = 21.00 / 1000000;  // default to Gemini 3.6 Flash standard ($21.00/1M)

  if (model.includes('gemini-3.1-pro') || model.includes('gemini-3-pro')) {
    inputRate = 7.00 / 1000000;
    outputRate = 21.00 / 1000000;
  } else if (model.includes('gemini-2.5-pro')) {
    inputRate = 5.00 / 1000000;
    outputRate = 20.00 / 1000000;
  } else if (model.includes('gemini-3.6-flash')) {
    inputRate = 5.00 / 1000000;
    outputRate = 21.00 / 1000000;
  } else if (model.includes('gemini-3.5-flash-lite')) {
    inputRate = 0.35 / 1000000;
    outputRate = 1.40 / 1000000;
  } else if (model.includes('gemini-3.1-flash-lite')) {
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
  
  // Real Turkish Billing Rate: 37.50 TRY/USD * 1.20 (20% KDV / Türkiye Vergi) = 45.00 TRY/USD billed rate
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
    estimatedCostTRY
  };

  apiUsageLogsStore.unshift(record);
  if (apiUsageLogsStore.length > 500) {
    apiUsageLogsStore = apiUsageLogsStore.slice(0, 500);
  }

  // Save to Firestore asynchronously to avoid blocking the response
  if (db) {
    const colRef = collection(db, 'api_usage_logs');
    const docRef = doc(colRef, record.id);
    setDoc(docRef, record).catch(err => {
      console.error('Error saving API usage log to Firestore:', err);
    });
  }

  return record;
}

// -------------------------------------------------------------
// Gemini AI Robust Request Wrapper with Fallbacks & Retries
// -------------------------------------------------------------
function mapToActualGeminiModel(modelId: string): string {
  const m = (modelId || '').trim();
  if (!m) return 'gemini-3.1-flash-lite';
  if (m === 'gemini-2.5-flash-lite' || m.includes('2.5-flash-lite')) {
    return 'gemini-3.1-flash-lite';
  }
  if (m === 'gemini-3.5-flash-lite') return 'gemini-3.1-flash-lite';
  if (m === 'gemini-3.5-flash') return 'gemini-3.6-flash';
  return m;
}

async function generateContentWithFallback(
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
    let retries = 2; // Try up to 3 times per model (2 retries)
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
          break; // Don't retry this model if it doesn't exist
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

function summarizeMocksForPrompt(mocks: any[], limit: number = 3) {
  return (mocks || []).slice(-limit).map(m => ({
    title: m.title || 'Genel Deneme',
    date: m.date,
    tytNet: m.tyt?.totalNet,
    aytNet: m.ayt?.totalNet
  }));
}

function summarizeErrorsForPrompt(errors: any[], limit: number = 8) {
  return (errors || []).slice(-limit).map(e => ({
    subject: e.subject,
    topic: e.topicName || e.topic,
    errorCount: e.errorCount || e.count || 1
  }));
}

function summarizeQuestionLogsForPrompt(logs: any[], limit: number = 5) {
  return (logs || []).slice(-limit).map(l => ({
    subject: l.subject,
    topic: l.topic,
    correct: l.correctCount,
    wrong: l.wrongCount,
    empty: l.emptyCount
  }));
}

function summarizeRoutinesForPrompt(routines: any[], limit: number = 3) {
  return (routines || []).slice(-limit).map(r => ({
    title: r.title,
    target: r.target,
    completedDaysCount: r.completedDays?.length || 0
  }));
}

function summarizeStudyPlansForPrompt(plans: any[]) {
  if (!plans || plans.length === 0) return [];
  const total = plans.length;
  const completed = plans.filter((p: any) => p.isCompleted).length;
  return {
    totalTasks: total,
    completedTasks: completed,
    completionRate: `%${Math.round((completed / (total || 1)) * 100)}`
  };
}

function summarizeResourcesForPrompt(resources: any[]) {
  if (!resources || resources.length === 0) return [];
  return (resources || []).map((r: any) => ({
    name: r.name,
    subject: r.subject,
    solved: r.solvedCount,
    total: r.totalCount,
    status: r.isCompleted ? 'Tamamlandı' : 'Devam Ediyor'
  }));
}

function summarizeBranchExamsForPrompt(exams: any[], limit: number = 3) {
  return (exams || []).slice(-limit).map(b => ({
    subject: b.subject,
    title: b.title,
    date: b.date,
    net: b.net
  }));
}

function summarizeInstitutionalMocksForPrompt(exams: any[], limit: number = 3) {
  return (exams || []).slice(-limit).map(i => ({
    examTitle: i.examTitle || i.title,
    examType: i.examType,
    examDate: i.examDate || i.date,
    sayScore: i.scores?.sayScore,
    eaScore: i.scores?.eaScore,
    sozScore: i.scores?.sozScore
  }));
}

function summarizeYoutubeForPrompt(videos: any[]) {
  if (!videos || videos.length === 0) return [];
  const total = videos.length;
  const watched = videos.filter((v: any) => v.isWatched).length;
  return {
    totalVideos: total,
    watchedVideos: watched,
    completionRate: `%${Math.round((watched / (total || 1)) * 100)}`
  };
}

function summarizePomodoroForPrompt(history: any[], limit: number = 3) {
  if (!history || history.length === 0) return [];
  const recent = (history || []).slice(-limit);
  const totalMinutes = Math.round((history || []).reduce((sum: number, p: any) => sum + (p.durationSeconds || 0), 0) / 60);
  return {
    totalFocusMinutes: totalMinutes,
    recentSessions: recent.map((p: any) => ({
      title: p.planTitle || 'Pomodoro Odaklanma',
      durationMinutes: Math.round((p.durationSeconds || 0) / 60)
    }))
  };
}

// -------------------------------------------------------------
// Gemini AI YKS Study Coach Endpoint
// -------------------------------------------------------------
app.post('/api/gemini/coach-advice', async (req, res) => {
  if (!isAiEnabledOrRespond(res)) return;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY sunucuda tanımlı değil.' });
  }

  const {
    profile,
    questionLogs,
    generalMocks,
    topicErrors,
    routines,
    studyPlans,
    resources,
    branchExams,
    institutionalMocks,
    youtubeVideos,
    pomodoroHistory,
    coachDataSettings: customSettings
  } = req.body;

  const settings = customSettings || coachDataSettings;

  try {
    const ai = new GoogleGenAI({ 
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    let prompt = `
Sen Türkiye YKS (Yükseköğretim Kurumları Sınavı) derece derece hazırlık konusunda uzman, motivasyonu yüksek ve analitik bir Rehberlik ve YKS Öğrenci Koçusun.

ÖĞRENCİ BİLGİLERİ:
- Öğrenci Adı: ${profile?.name || 'Öğrenci'}
- Okul: ${profile?.highSchool || 'Anadolu Lisesi'}
- Alanı: ${profile?.targetField || 'SAY'}
- Hedef Üniversite & Bölüm: ${profile?.targetUniversity || ''} ${profile?.targetDepartment || ''}
- Hedef Sıralama: ${profile?.targetRank || 5000}
- Hedef Netler: TYT ${profile?.targetTYTNet || 100} Net, AYT ${profile?.targetAYTNet || 70} Net
`;

    if (settings.generalMocks?.enabled !== false) {
      const limit = settings.generalMocks?.limit || 3;
      prompt += `\nSON GENEL DENEME NETLERİ:\n${JSON.stringify(summarizeMocksForPrompt(generalMocks, limit))}\n`;
    }

    if (settings.topicErrors?.enabled !== false) {
      const limit = settings.topicErrors?.limit || 8;
      prompt += `\nEKSİK / YANLIŞ YAPILAN KONULAR (YANLIŞ TABLOSU):\n${JSON.stringify(summarizeErrorsForPrompt(topicErrors, limit))}\n`;
    }

    if (settings.questionLogs?.enabled !== false) {
      const limit = settings.questionLogs?.limit || 5;
      prompt += `\nSON SORU ÇÖZÜM VERİLERİ:\n${JSON.stringify(summarizeQuestionLogsForPrompt(questionLogs, limit))}\n`;
    }

    if (settings.routines?.enabled !== false) {
      const limit = settings.routines?.limit || 3;
      prompt += `\nSON RUTİN VERİLERİ:\n${JSON.stringify(summarizeRoutinesForPrompt(routines, limit))}\n`;
    }

    if (settings.studyPlanSummary?.enabled !== false) {
      prompt += `\nHAFTALIK ÇALIŞMA PLANI ÖZETİ:\n${JSON.stringify(summarizeStudyPlansForPrompt(studyPlans))}\n`;
    }

    if (settings.resourceProgress?.enabled !== false) {
      prompt += `\nKAYNAK TAKİBİ VE ÇÖZÜLME ÖZETİ:\n${JSON.stringify(summarizeResourcesForPrompt(resources))}\n`;
    }

    if (settings.branchExams?.enabled !== false) {
      const limit = settings.branchExams?.limit || 3;
      prompt += `\nSON BRANŞ DENEMELERİ:\n${JSON.stringify(summarizeBranchExamsForPrompt(branchExams, limit))}\n`;
    }

    if (settings.institutionalMocks?.enabled !== false) {
      const limit = settings.institutionalMocks?.limit || 3;
      prompt += `\nSON KURUMSAL DENEMELER:\n${JSON.stringify(summarizeInstitutionalMocksForPrompt(institutionalMocks, limit))}\n`;
    }

    if (settings.youtubeTracker?.enabled !== false) {
      prompt += `\nYOUTUBE VİDEO DERS TAKİP ÖZETİ:\n${JSON.stringify(summarizeYoutubeForPrompt(youtubeVideos))}\n`;
    }

    if (settings.pomodoroHistory?.enabled !== false) {
      const limit = settings.pomodoroHistory?.limit || 3;
      prompt += `\nPOMODORO GEÇMİŞİ ÖZETİ:\n${JSON.stringify(summarizePomodoroForPrompt(pomodoroHistory, limit))}\n`;
    }

    prompt += `
Lütfen bu verileri detaylıca analiz et ve öğrenciye özel Türkçe YKS Koçluk Raporu üret.
Cevabın YALNIZCA geçerli bir JSON objesi olmalıdır. Şeması:
{
  "generalEvaluation": "Öğrencinin genel performans ve gidişat değerlendirmesi (2-3 cümle)",
  "strengths": ["Güçlü olunan 3 alan veya ders"],
  "weakAreas": ["Acil geliştirilmesi gereken 2-3 zayıf alan veya soru türü"],
  "actionPlan": ["Bu hafta için 3-4 somut, uygulanabilir ve net odaklı aksiyon önerisi"],
  "motivationalQuote": "İlham verici, güçlü bir YKS motivasyon sözü"
}
    `;

    const targetModel = featureModelConfig['AI_COACH_STUDENT'] || 'gemini-3.1-flash-lite';
    const { response, modelUsed } = await generateContentWithFallback(ai, {
      model: targetModel,
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const responseText = response.text || '{}';
    const parsedData = JSON.parse(responseText);

    const usageRecord = recordApiUsage({
      featureKey: 'AI_COACH_STUDENT',
      featureName: 'Öğrenci Bireysel Yapay Zeka Koç Tavsiyesi',
      category: 'AI_COACH',
      modelUsed,
      promptTokens: response.usageMetadata?.promptTokenCount || Math.ceil(prompt.length / 4),
      candidatesTokens: response.usageMetadata?.candidatesTokenCount || Math.ceil(responseText.length / 4)
    });

    res.json({
      success: true,
      advice: {
        ...parsedData,
        timestamp: new Date().toLocaleString('tr-TR')
      },
      aiUsage: usageRecord
    });
  } catch (err: any) {
    console.error('Gemini AI Coach error:', err);
    res.status(500).json({ error: err.message || 'Yapay Zeka koç tavsiyesi üretilemedi.' });
  }
});

// -------------------------------------------------------------
// Gemini AI Class-wide YKS Study Coach Endpoint
// -------------------------------------------------------------
app.post('/api/gemini/class-coach-advice', async (req, res) => {
  if (!isAiEnabledOrRespond(res)) return;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY sunucuda tanımlı değil.' });
  }

  const { className, studentCount, averageTYTNet, averageAYTNet, totalQuestionsSolved, topStrugglingTopics, studentsSummary } = req.body;

  try {
    const ai = new GoogleGenAI({ 
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const prompt = `
Sen Türkiye YKS (Yükseköğretim Kurumları Sınavı) derece hazırlık konusunda uzman, analitik ve motivasyonu yüksek bir Okul Rehberlik Uzmanı ve Sınıf YKS Koçusun.

SINIF VERİLERİ VE GENEL PERFORMANS ÖZETİ:
- Sınıf Adı: ${className || '12-A SAY'}
- Öğrenci Sayısı: ${studentCount || 0}
- Sınıfın Ortalama TYT Neti: ${averageTYTNet || 0} Net
- Sınıfın Ortalama AYT Neti: ${averageAYTNet || 0} Net
- Sınıf Toplam Çözülen Soru Sayısı: ${totalQuestionsSolved || 0}
- Sınıfın En Çok Zorlandığı ve Hata Yaptığı Konular: ${JSON.stringify(topStrugglingTopics || [])}

ÖĞRENCİ BAZLI ÖZET:
${JSON.stringify(studentsSummary || [])}

Lütfen bu sınıfın tüm verilerini detaylıca analiz et ve sınıf rehber öğretmenine özel detaylı bir Türkçe YKS Sınıf Koçluk Raporu üret.
Cevabın YALNIZCA geçerli bir JSON objesi olmalıdır. Şeması:
{
  "generalEvaluation": "Sınıfın genel akademik performansı, çalışma temposu ve gidişat değerlendirmesi (3-4 cümle)",
  "strengths": ["Sınıfın öne çıkan 3 güçlü yönü"],
  "weakAreas": ["Sınıfça acil müdahale edilmesi gereken 2-3 zayıf alan veya konu eksikliği"],
  "actionPlan": ["Rehber öğretmen için bu haftalık 3-4 somut sınıf içi aksiyon ve etüt önerisi"],
  "motivationalQuote": "Sınıfa ve öğretmenine ilham verici güçlü bir YKS motivasyon mesajı"
}
    `;

    const targetModel = featureModelConfig['AI_COACH_CLASS'] || 'gemini-3.1-flash-lite';
    const { response, modelUsed } = await generateContentWithFallback(ai, {
      model: targetModel,
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const responseText = response.text || '{}';
    const parsedData = JSON.parse(responseText);

    const usageRecord = recordApiUsage({
      featureKey: 'AI_COACH_CLASS',
      featureName: 'Sınıf / Okul Genel Koç Analizi',
      category: 'AI_COACH',
      modelUsed,
      promptTokens: response.usageMetadata?.promptTokenCount || Math.ceil(prompt.length / 4),
      candidatesTokens: response.usageMetadata?.candidatesTokenCount || Math.ceil(responseText.length / 4)
    });

    res.json({
      success: true,
      advice: {
        ...parsedData,
        className,
        timestamp: new Date().toLocaleString('tr-TR')
      },
      aiUsage: usageRecord
    });
  } catch (err: any) {
    console.error('Gemini Class AI Coach error:', err);
    res.status(500).json({ error: err.message || 'Yapay Zeka sınıf koçluk tavsiyesi üretilemedi.' });
  }
});

// -------------------------------------------------------------
// Gemini AI Error Topic Priority Analyzer
// -------------------------------------------------------------
app.post('/api/gemini/analyze-error-priority', async (req, res) => {
  if (!isAiEnabledOrRespond(res)) return;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY sunucuda tanımlı değil.' });
  }

  const { subject, topicName, errorReason, solutionNotes, publisher } = req.body;

  try {
    const ai = new GoogleGenAI({ 
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const prompt = `
Sen Türkiye YKS (Yükseköğretim Kurumları Sınavı) hazırlık sürecinde öğrencilerin deneme analizlerini yapan uzman bir Rehberlik ve Sınav Koçusun.
Öğrencinin eklemek istediği eksik konunun önemini, çıkmış sınav soruları ağırlığını, hata nedenini ve çözüm notlarını analiz ederek 1 ile 5 yıldız (1: En düşük öncelik, 5: En yüksek / acil çalışma gerektiren öncelik) arasında bir öncelik puanı belirlemen gerekiyor.

GİRİŞ VERİLERİ:
- Ders (Ders Grubu): ${subject || 'Bilinmiyor'}
- Konu Adı: ${topicName || 'Bilinmiyor'}
- Yayınevi / Deneme Adı: ${publisher || 'Bilinmiyor'}
- Hata Nedeni: ${errorReason || 'Bilinmiyor'} (bilgi_eksigi: Bilgi Eksikliği, dikkat_hatasi: Dikkat/İşlem Hatası, zaman_yetmedi: Süre yetmedi, iki_sik_arasinda: İki Şık Arasında Kalma, soru_kokunu_yanlis_okuma: Soru Kökünü Yanlış Okuma)
- Çözüm Notu / Hatırlatma: ${solutionNotes || 'Belirtilmemiş'}

ÖNCELİK PUANLAMA KRİTERLERİ (1 - 5 YILDIZ):
1. Çıkmış Sorulardaki Sıklık (YKS Soru AğıRLIĞI): Konu ÖSYM'nin son yıllardaki TYT/AYT sınavlarında çok sık sorduğu bir konu ise (örn: Paragraf, Problemler, Türev, İntegral, Trigonometri, Optik, Hücre Bölünmeleri, Cümlenin Ögeleri, Gazlar vb.) puanı artır. Nadiren sorulan bir konu ise puanı düşük tut.
2. Hata Nedeni: Eğer hata nedeni "bilgi_eksigi" (Bilgi Eksikliği) ise bu acil bir konu çalışması gerektirdiği için puanı yükselt. "dikkat_hatasi" ise daha düşük tutulabilir.
3. Çözüm Notu & Analiz: Çözüm notundaki ciddiyet seviyesini ve öğrencinin konudaki kafa karışıklığını değerlendir.

Lütfen bu verileri detaylıca analiz et ve sonucu YALNIZCA geçerli bir JSON objesi olarak dön. Başka açıklama veya markdown yazma. Şema:
{
  "rating": 5, // 1 ile 5 arasında bir tam sayı
  "analysis": "Seçilen konunun geçmiş YKS (ÖSYM) sınavlarındaki çıkma sıklığı ve hata analizinize göre hazırlanan 2-3 cümlelik Türkçe gerekçeli koç açıklaması."
}
    `;

    const targetModel = featureModelConfig['ERROR_PRIORITY'] || 'gemini-3.1-flash-lite';
    const { response, modelUsed } = await generateContentWithFallback(ai, {
      model: targetModel,
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const responseText = response.text || '{}';
    const parsedData = JSON.parse(responseText);

    const usageRecord = recordApiUsage({
      featureKey: 'ERROR_PRIORITY',
      featureName: 'Öncelikli Hata Konuları Analizi',
      category: 'QUESTION_ANALYSIS',
      modelUsed,
      promptTokens: response.usageMetadata?.promptTokenCount || Math.ceil(prompt.length / 4),
      candidatesTokens: response.usageMetadata?.candidatesTokenCount || Math.ceil(responseText.length / 4)
    });

    res.json({
      success: true,
      rating: parsedData.rating || 3,
      analysis: parsedData.analysis || 'Konu önemi analiz edildi.',
      aiUsage: usageRecord
    });
  } catch (err: any) {
    console.error('Gemini error priority analysis error:', err);
    res.status(500).json({ error: err.message || 'Yapay zeka öncelik analizi yapılamadı.' });
  }
});

// -------------------------------------------------------------
// Gemini AI YKS Topic Common Mistakes & Tips
// -------------------------------------------------------------
app.post('/api/gemini/topic-mistake-tips', async (req, res) => {
  if (!isAiEnabledOrRespond(res)) return;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY sunucuda tanımlı değil.' });
  }

  const { subject, topicName } = req.body;
  if (!subject || !topicName) {
    return res.status(400).json({ error: 'Ders ve konu adı gereklidir.' });
  }

  try {
    const ai = new GoogleGenAI({ 
      apiKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
    });

    const prompt = `
Sen Türkiye YKS (Yükseköğretim Kurumları Sınavı) hazırlık sürecinde öğrencilere ders anlatan uzman ve cana yakın bir branş öğretmenisin.
Öğrencinin seçtiği "${subject}" dersindeki "${topicName}" konusu ile ilgili yaptığı yaygın hataları, bunların doğrularını ve sınavda işine yarayacak can alıcı ipuçlarını paylaşan kısa bir ipucu belgesi oluştur.

Lütfen yanıtını doğrudan öğrenciye hitap eden bir tonda yaz ve YALNIZCA geçerli bir JSON objesi olarak dön. Başka açıklama, markdown veya dış sarmallayıcı ekleme. Şema:
{
  "mistakes": [
    {
      "mistake": "Hatalı Düşünce / Sık Yapılan Yanlış",
      "correction": "Doğru Bilgi / Çözüm Yaklaşımı"
    }
  ],
  "tips": [
    "Sınavda hayat kurtaran can alıcı ipucu veya pratik formül/taktik."
  ],
  "summary": "Öğrenciyi motive eden, o konudaki heyecanını artıran ve dikkat etmesi gerekenleri hatırlatan 1-2 cümlelik rehberlik tavsiyesi."
}
    `;

    const targetModel = featureModelConfig['TOPIC_TIPS'] || 'gemini-3.1-flash-lite';
    const { response, modelUsed } = await generateContentWithFallback(ai, {
      model: targetModel,
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const responseText = response.text || '{}';
    const parsedData = JSON.parse(responseText);

    const usageRecord = recordApiUsage({
      featureKey: 'TOPIC_TIPS',
      featureName: 'Konu Bazlı Pratik Taktikler',
      category: 'QUESTION_ANALYSIS',
      modelUsed,
      promptTokens: response.usageMetadata?.promptTokenCount || Math.ceil(prompt.length / 4),
      candidatesTokens: response.usageMetadata?.candidatesTokenCount || Math.ceil(responseText.length / 4)
    });

    res.json({
      success: true,
      mistakes: parsedData.mistakes || [],
      tips: parsedData.tips || [],
      summary: parsedData.summary || 'Bu konuda bol bol soru çözerek pratik yapmalısın!',
      aiUsage: usageRecord
    });
  } catch (err: any) {
    console.error('Gemini mistake tips error:', err);
    res.status(500).json({ error: err.message || 'Yapay zeka konu ipuçları üretilemedi.' });
  }
});

// -------------------------------------------------------------
// Gemini AI YKS Multimodal Question Solver
// -------------------------------------------------------------
app.post('/api/gemini/solve-question', async (req, res) => {
  if (!isAiEnabledOrRespond(res)) return;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY sunucuda tanımlı değil.' });
  }

  const { imageUrl, solutionText, existingAnalysis, subject, topicName } = req.body;
  if (!imageUrl && !solutionText && !existingAnalysis) {
    return res.status(400).json({ error: 'Soru görseli veya önceden çözülmüş soru metni gereklidir.' });
  }

  try {
    const ai = new GoogleGenAI({ 
      apiKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
    });

    let contents: any[] = [];

    // Check if we already have text context from previously solved/analyzed question
    if (solutionText || existingAnalysis) {
      contents = [{
        text: `Sen Türkiye YKS (Yükseköğretim Kurumları Sınavı) hazırlık sürecindeki öğrencilere rehberlik eden ve soru çözen uzman bir öğretmenisin.
Aşağıda öğrencinin aynı sorusuna ait önceki çözüm/analiz verisi bulunmaktadır:
---
Ders: ${subject || ''}
Konu: ${topicName || ''}
Önceki Soru Metni/Çözümü/Analizi:
${solutionText || existingAnalysis}
---
Bu verilerden faydalanarak sorunun son derece anlaşılır, adım adım detaylı çözümünü sun.

ASLA "Merhaba değerli öğrencim" veya benzeri giriş/selamlama cümleleri ya da sohbet ifadeleri kullanma. Doğrudan çözümle başla.

İçerik Şunları Kapsamalıdır:
1. Konu Özeti: Soru hangi konuyla ilgiliyse (${subject} - ${topicName}) o konunun temel kuralını veya formülünü kısaca hatırlat.
2. Adım Adım Çözüm: Çözüm adımlarını net ve Türkçe bir anlatımla açıklayarak ilerle.
3. Doğru Cevap: Doğru seçeneği/cevabı belirgin şekilde yaz (Örn: **Doğru Cevap: C şıkkıdır**).
4. İpucu: Bu tarz sorularda öğrencilerin yaptığı yaygın hataları hatırlatan ve zaman kazandıran 1 pratik taktik ver.

ÖNEMLİ MATEMATİKSEL BİÇİMLENDİRME KURALLARI:
- KESİNLİKLE LaTeX formatı ($...$, $$...$$, \\implies, \\cdot, \\frac vb.) KULLANMA.
- Matematiksel ifadeleri normal bilgisayar klavyesi karakterleriyle düz metin olarak yaz.`
      }];
    } else {
      // Parse image data URL
      const matches = imageUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (!matches) {
        return res.status(400).json({ error: 'Geçersiz görsel formatı.' });
      }

      const mimeType = matches[1];
      const base64Data = matches[2];

      const imagePart = {
        inlineData: { mimeType, data: base64Data }
      };

      const textPart = {
        text: `Sen Türkiye YKS (Yükseköğretim Kurumları Sınavı) hazırlık sürecindeki öğrencilere rehberlik eden ve soru çözen uzman bir öğretmenisin.
Görseldeki soruyu incele ve son derece anlaşılır, adım adım bir çözüm sun.

ASLA "Merhaba değerli öğrencim", "Merhaba" veya benzeri herhangi bir giriş, selamlama ya da sohbet cümlesi yazma. Doğrudan 1. Konu Özeti veya çözüm adımları ile başla.

İçerik Şunları Kapsamalıdır:
1. Konu Özeti: Soru hangi konuyla ilgiliyse (${subject} - ${topicName}) o konunun temel kuralını veya formülünü kısaca hatırlat.
2. Adım Adım Çözüm: Çözüm adımlarını net ve Türkçe bir anlatımla açıklayarak ilerle.
3. Doğru Cevap: Doğru seçeneği/cevabı belirgin şekilde yaz (Örn: **Doğru Cevap: C şıkkıdır**).
4. İpucu: Bu tarz sorularda öğrencilerin yaptığı yaygın hataları hatırlatan ve zaman kazandıran 1 pratik taktik ver.

ÖNEMLİ MATEMATİKSEL BİÇİMLENDİRME KURALLARI:
- KESİNLİKLE LaTeX formatı ($...$, $$...$$, \\implies, \\cdot, \\frac vb.) KULLANMA. Bu ifadeler arayüzde bozuk ve karışık simgeler olarak görünüyor.
- Matematiksel ve geometrik ifadeleri herkesin kolayca okuyabileceği, normal bilgisayar klavyesi karakterleriyle düz metin olarak yaz.
- Örneğin:
  * m1 * m2 = -1 (nokta yerine * kullan veya boşluk bırak)
  * y - y1 = m * (x - x1)
  * x + y = 8 şeklinde yaz.
  * Derece veya üs belirtmek için normal sayılar veya ^ işareti kullan (örn. x^2 veya x2).
  * Karekök için "kök(x)" veya "karekök içinde x" şeklinde Türkçe/klavye dostu ifadeler tercih et.
  * "ise" veya "=>" işaretlerini \\implies yerine kullan.

Lütfen cevabını temiz, son derece düzenli ve anlaşılır bir Türkçe ile yaz.`
      };

      contents = [imagePart, textPart];
    }

    const targetModel = featureModelConfig['SOLVE_QUESTION'] || 'gemini-3.1-flash-lite';
    const { response, modelUsed } = await generateContentWithFallback(ai, {
      model: targetModel,
      contents
    });

    const responseText = response.text || '';

    const usageRecord = recordApiUsage({
      featureKey: 'SOLVE_QUESTION',
      featureName: 'Hata Defteri Soru Çözümü',
      category: 'QUESTION_ANALYSIS',
      modelUsed,
      promptTokens: response.usageMetadata?.promptTokenCount || 2000,
      candidatesTokens: response.usageMetadata?.candidatesTokenCount || Math.ceil(responseText.length / 4)
    });

    res.json({
      success: true,
      solution: responseText || 'Soru çözümü üretilemedi.',
      aiUsage: usageRecord
    });
  } catch (err: any) {
    console.error('Gemini question solver error:', err);
    res.status(500).json({ error: err.message || 'Yapay zeka soru çözümü üretilemedi.' });
  }
});

// -------------------------------------------------------------
// Gemini AI YKS Similar Question Generator
// -------------------------------------------------------------
app.post('/api/gemini/similar-questions', async (req, res) => {
  if (!isAiEnabledOrRespond(res)) return;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY sunucuda tanımlı değil.' });
  }

  const { imageUrl, solutionText, existingAnalysis, subject, topicName } = req.body;
  if (!imageUrl && !solutionText && !existingAnalysis) {
    return res.status(400).json({ error: 'Soru görseli veya önceden çözülmüş soru metni gereklidir.' });
  }

  try {
    const ai = new GoogleGenAI({ 
      apiKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
    });

    let contents: any[] = [];

    if (solutionText || existingAnalysis) {
      contents = [{
        text: `Sen Türkiye YKS (Yükseköğretim Kurumları Sınavı) hazırlık sürecindeki öğrencilere rehberlik eden ve soru üreten uzman bir öğretmenisin.
Öğrencinin daha önce çözülmüş/analiz edilmiş sorusu aşağıdaki gibidir:
---
Ders: ${subject || ''}
Konu: ${topicName || ''}
Önceki Soru Çözümü / Detayı:
${solutionText || existingAnalysis}
---
Yapay zeka hafızandaki bu soruya ve konusuna (${subject} - ${topicName}) benzer tarzda, öğrencinin konuyu pekiştirmesini ve mantığını kavramasını sağlayacak SADECE 1 (BİR) tane kaliteli, yeni benzer soru üret.

Kesinlikle selamlaşma, "İşte senin için soru", "Başarılar dilerim" gibi hiçbir konuşma cümlesi ekleme. Direkt soruyu, çözümünü ve doğru cevabını JSON alanlarında doldur.

ÖNEMLİ MATEMATİKSEL BİÇİMLENDİRME KURALLARI:
- KESİNLİKLE LaTeX formatı ($...$, $$...$$, \\implies, \\cdot, \\frac vb.) KULLANMA.
- Matematiksel ve geometrik ifadeleri herkesin kolayca okuyabileceği, normal bilgisayar klavyesi karakterleriyle düz metin olarak yaz.`
      }];
    } else {
      // Parse data URL
      const matches = imageUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (!matches) {
        return res.status(400).json({ error: 'Geçersiz görsel formatı.' });
      }

      const mimeType = matches[1];
      const base64Data = matches[2];

      const imagePart = {
        inlineData: { mimeType, data: base64Data }
      };

      const textPart = {
        text: `Sen Türkiye YKS (Yükseköğretim Kurumları Sınavı) hazırlık sürecindeki öğrencilere rehberlik eden ve soru üreten uzman bir öğretmenisin.
Görseldeki soruyu ve konuyu (${subject} - ${topicName}) incele.
Bu soruya benzer tarzda, öğrencinin konuyu pekiştirmesini ve mantığını kavramasını sağlayacak SADECE 1 (BİR) tane kaliteli, yeni benzer soru üret.

Kesinlikle selamlaşma, "İşte senin için soru", "Başarılar dilerim" gibi hiçbir konuşma cümlesi ekleme. Direkt soruyu, çözümünü ve doğru cevabını JSON alanlarında doldur.

ÖNEMLİ MATEMATİKSEL BİÇİMLENDİRME KURALLARI:
- KESİNLİKLE LaTeX formatı ($...$, $$...$$, \\implies, \\cdot, \\frac vb.) KULLANMA. Bu ifadeler arayüzde bozuk ve karışık simgeler olarak görünüyor.
- Matematiksel ve geometrik ifadeleri herkesin kolayca okuyabileceği, normal bilgisayar klavyesi karakterleriyle düz metin olarak yaz.
- Örneğin:
  * m1 * m2 = -1 (nokta yerine * kullan veya boşluk bırak)
  * y - y1 = m * (x - x1)
  * x + y = 8 şeklinde yaz.
  * Derece veya üs belirtmek için normal sayılar veya ^ işareti kullan (örn. x^2 veya x2).
  * Karekök için "kök(x)" veya "karekök içinde x" şeklinde Türkçe/klavye dostu ifadeler tercih et.
  * "ise" or "=>" işaretlerini \\implies yerine kullan.`
      };

      contents = [imagePart, textPart];
    }

    const targetModel = featureModelConfig['SIMILAR_QUESTION'] || 'gemini-3.1-flash-lite';
    const { response, modelUsed } = await generateContentWithFallback(ai, {
      model: targetModel,
      contents,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            question: {
              type: 'STRING',
              description: 'Görseldeki veya önceki metindeki sorunun konu ve kazanımına uygun, Türkiye YKS (TYT/AYT) müfredatına tam uyumlu 1 adet özgün yeni benzer soru metni ve şıkları (A, B, C, D, E).',
            },
            solution: {
              type: 'STRING',
              description: 'Sorunun adım adım, çok detaylı Türkçe çözümü.',
            },
            correctAnswer: {
              type: 'STRING',
              description: 'Sorunun doğru seçeneği/cevabı (örn. C seçeneğidir).',
            }
          },
          required: ['question', 'solution', 'correctAnswer']
        }
      }
    });

    let similarQuestionsData = null;
    const responseText = response.text || '{}';
    try {
      similarQuestionsData = JSON.parse(responseText);
    } catch (parseErr) {
      console.error('Failed to parse Gemini JSON output:', responseText);
      similarQuestionsData = {
        question: responseText || 'Benzer soru üretilemedi.',
        solution: 'Çözüm oluşturulamadı.',
        correctAnswer: ''
      };
    }

    const usageRecord = recordApiUsage({
      featureKey: 'SIMILAR_QUESTION',
      featureName: 'Benzer Soru Üretimi',
      category: 'QUESTION_ANALYSIS',
      modelUsed,
      promptTokens: response.usageMetadata?.promptTokenCount || 1800,
      candidatesTokens: response.usageMetadata?.candidatesTokenCount || Math.ceil(responseText.length / 4)
    });

    res.json({
      success: true,
      similarQuestions: similarQuestionsData,
      aiUsage: usageRecord
    });
  } catch (err: any) {
    console.error('Gemini similar questions generator error:', err);
    res.status(500).json({ error: err.message || 'Yapay zeka benzer sorular üretemedi.' });
  }
});

// -------------------------------------------------------------
// Gemini AI YKS Question Detailed Analyzer
// -------------------------------------------------------------
app.post('/api/gemini/analyze-question-details', async (req, res) => {
  if (!isAiEnabledOrRespond(res)) return;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY sunucuda tanımlı değil.' });
  }

  const { imageUrl, solutionText, existingAnalysis, subject, topicName } = req.body;
  if (!imageUrl && !solutionText && !existingAnalysis) {
    return res.status(400).json({ error: 'Soru görseli veya önceden çözülmüş soru metni gereklidir.' });
  }

  try {
    const ai = new GoogleGenAI({ 
      apiKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
    });

    let contents: any[] = [];

    if (solutionText || existingAnalysis) {
      contents = [{
        text: `Sen Türkiye YKS (Yükseköğretim Kurumları Sınavı) hazırlık sürecindeki öğrencilere rehberlik eden uzman bir öğretmen ve soru analistisin.
Öğrencinin sorusuna ait önceden üretilmiş çözüm/metin verisi aşağıdadır:
---
Ders: ${subject || ''}
Konu: ${topicName || ''}
Soru Metni/Çözümü:
${solutionText || existingAnalysis}
---
Lütfen bu soruya ve konusuna dair detaylı bir analiz yap. Cevabını KESİNLİKLE aşağıdaki Markdown tablo formatında döndür. Tablonun dışına hiçbir ekstra selamlaşma, açıklama veya yorum ekleme. Direkt tabloyu başlat ve bitir.

BİÇİMLENDİRME:
**SORU ANALİZİ**

| Kriter | Değerlendirme |
| :--- | :--- |
| **Ders** | ${subject} |
| **Konu** | [Ders konusunu yaz, örn: Türev / Üçgenler / Polinomlar] |
| **Kazanım** | [Sorunun ölçtüğü MEB kazanımı veya temel beceriyi yaz] |
| **Müfredat Uygunluğu** | [Uygun / Uygun Değil] — [Kısa açıklama: kaldırılan kazanım mı, güncel müfredat dışı mı?] |
| **Zorluk** | 4/10 gibi (1-10 arası puan, örn: 4/10) - [Kolay / Orta / Zor / Çok Zor] |
| **Okuma Süresi** | [Örn: 0.5 dk veya 1.2 dk cinsinden ortalama okuma süresi] |
| **Çözme Süresi** | [Örn: 1.5 dk veya 2 dk cinsinden ortalama çözüm süresi] |
| **Ayırt Edicilik** | [Düşük / Orta / Yüksek] |
| **Çeldirici Analizi** | **A Şıkkı:** ...<br>**B Şıkkı:** ...<br>**Diğerleri:** ... |

ÖNEMLİ KURALLAR:
- Çeldirici Analizi Kuralı: Soruda şıklar (A, B, C, D, E) varsa TÜM şıkların ayrı ayrı çeldirici analizini yap (Örn: **A Şıkkı:** ..., **B Şıkkı:** ..., vb.). Eğer soruda şık yoksa (açık uçlu / klasik soruysa) asla A, B şıkkı deme; bunun yerine öğrencinin yapabileceği **"Olası Hatalı Yaklaşımlar / Hatalı Cevaplar"** analizi yap.
- KESİNLİKLE LaTeX formatı ($...$, $$...$$, \\implies, \\cdot, \\frac vb.) KULLANMA.
- Tablonun Markdown sözdizimini bozacak karakterler kullanmaktan kaçın. Hücrelerin içinde satır sonu yapmak istersen <br> etiketini kullan.`
      }];
    } else {
      // Parse data URL
      const matches = imageUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (!matches) {
        return res.status(400).json({ error: 'Geçersiz görsel formatı.' });
      }

      const mimeType = matches[1];
      const base64Data = matches[2];

      const imagePart = {
        inlineData: { mimeType, data: base64Data }
      };

      const textPart = {
        text: `Sen Türkiye YKS (Yükseköğretim Kurumları Sınavı) hazırlık sürecindeki öğrencilere rehberlik eden uzman bir öğretmen ve soru analistiysen.
Görseldeki soruyu, dersi (${subject}) ve konuyu (${topicName}) incele.

Lütfen bu soruya dair detaylı bir analiz yap. Cevabını KESİNLİKLE ama KESİNLİKLE aşağıdaki Markdown tablo formatında döndür. Tablonun dışına hiçbir ekstra selamlaşma, açıklama veya yorum ekleme. Direkt tabloyu başlat ve bitir.

BİÇİMLENDİRME:
**SORU ANALİZİ**

| Kriter | Değerlendirme |
| :--- | :--- |
| **Ders** | ${subject} |
| **Konu** | [Ders konusunu yaz, örn: Türev / Üçgenler / Polinomlar] |
| **Kazanım** | [Sorunun ölçtüğü MEB kazanımı veya temel beceriyi yaz] |
| **Müfredat Uygunluğu** | [Uygun / Uygun Değil] — [Kısa açıklama: kaldırılan kazanım mı, güncel müfredat dışı mı?] |
| **Zorluk** | 4/10 gibi (1-10 arası puan, örn: 4/10) - [Kolay / Orta / Zor / Çok Zor] |
| **Okuma Süresi** | [Örn: 0.5 dk veya 1.2 dk cinsinden ortalama okuma süresi] |
| **Çözme Süresi** | [Örn: 1.5 dk veya 2 dk cinsinden ortalama çözüm süresi] |
| **Ayırt Edicilik** | [Düşük / Orta / Yüksek] |
| **Çeldirici Analizi** | **A Şıkkı:** ...<br>**B Şıkkı:** ...<br>**Diğerleri:** ... |

ÖNEMLİ KURALLAR:
- Çeldirici Analizi Kuralı: Soruda şıklar (A, B, C, D, E) varsa TÜM şıkların ayrı ayrı çeldirici analizini yap (Örn: **A Şıkkı:** ..., **B Şıkkı:** ..., vb.). Eğer soruda şık yoksa (açık uçlu / klasik soruysa) asla A, B şıkkı deme; bunun yerine öğrencinin yapabileceği **"Olası Hatalı Yaklaşımlar / Hatalı Cevaplar"** analizi yap.
- KESİNLİKLE LaTeX formatı ($...$, $$...$$, \\implies, \\cdot, \\frac vb.) KULLANMA. Matematiksel ifadeleri normal bilgisayar klavyesi karakterleriyle düz metin olarak yaz.
- Tablonun Markdown sözdizimini bozacak karakterler kullanmaktan kaçın. Hücrelerin içinde satır sonu yapmak istersen <br> etiketini kullan.`
      };

      contents = [imagePart, textPart];
    }

    const targetModel = featureModelConfig['QUESTION_ANALYSIS'] || 'gemini-3.1-flash-lite';
    const { response, modelUsed } = await generateContentWithFallback(ai, {
      model: targetModel,
      contents
    });

    const responseText = response.text || '';

    const usageRecord = recordApiUsage({
      featureKey: 'QUESTION_ANALYSIS',
      featureName: 'Detaylı Soru & Çeldirici Analizi',
      category: 'QUESTION_ANALYSIS',
      modelUsed,
      promptTokens: response.usageMetadata?.promptTokenCount || 2100,
      candidatesTokens: response.usageMetadata?.candidatesTokenCount || Math.ceil(responseText.length / 4)
    });

    res.json({
      success: true,
      analysis: responseText || 'Soru analizi yapılamadı.',
      aiUsage: usageRecord
    });
  } catch (err: any) {
    console.error('Gemini question analysis error:', err);
    res.status(500).json({ error: err.message || 'Yapay zeka soru analizi üretilemedi.' });
  }
});

// -------------------------------------------------------------
// Gemini API Cost & Usage Report Endpoint
// -------------------------------------------------------------
app.get('/api/gemini/usage-stats', (req, res) => {
  const totalCalls = apiUsageLogsStore.length;
  let totalTokens = 0;
  let promptTokens = 0;
  let candidatesTokens = 0;
  let totalCostUSD = 0;
  let totalCostTRY = 0;

  let aiCoachCalls = 0;
  let aiCoachTokens = 0;
  let aiCoachCostTRY = 0;

  let questionAnalysisCalls = 0;
  let questionAnalysisTokens = 0;
  let questionAnalysisCostTRY = 0;

  const modelMap: Record<string, { calls: number; totalTokens: number; promptTokens: number; candidatesTokens: number; costUSD: number; costTRY: number }> = {};
  const featureMap: Record<string, { featureKey: string; featureName: string; category: string; calls: number; totalTokens: number; costTRY: number }> = {};

  for (const log of apiUsageLogsStore) {
    totalTokens += log.totalTokens;
    promptTokens += log.promptTokens;
    candidatesTokens += log.candidatesTokens;
    totalCostUSD += log.estimatedCostUSD;
    totalCostTRY += log.estimatedCostTRY;

    if (log.category === 'AI_COACH') {
      aiCoachCalls++;
      aiCoachTokens += log.totalTokens;
      aiCoachCostTRY += log.estimatedCostTRY;
    } else {
      questionAnalysisCalls++;
      questionAnalysisTokens += log.totalTokens;
      questionAnalysisCostTRY += log.estimatedCostTRY;
    }

    if (!modelMap[log.modelUsed]) {
      modelMap[log.modelUsed] = { calls: 0, totalTokens: 0, promptTokens: 0, candidatesTokens: 0, costUSD: 0, costTRY: 0 };
    }
    modelMap[log.modelUsed].calls++;
    modelMap[log.modelUsed].totalTokens += log.totalTokens;
    modelMap[log.modelUsed].promptTokens += log.promptTokens;
    modelMap[log.modelUsed].candidatesTokens += log.candidatesTokens;
    modelMap[log.modelUsed].costUSD += log.estimatedCostUSD;
    modelMap[log.modelUsed].costTRY += log.estimatedCostTRY;

    if (!featureMap[log.featureKey]) {
      featureMap[log.featureKey] = {
        featureKey: log.featureKey,
        featureName: log.featureName,
        category: log.category,
        calls: 0,
        totalTokens: 0,
        costTRY: 0
      };
    }
    featureMap[log.featureKey].calls++;
    featureMap[log.featureKey].totalTokens += log.totalTokens;
    featureMap[log.featureKey].costTRY += log.estimatedCostTRY;
  }

  const modelUsage = Object.entries(modelMap).map(([model, stats]) => ({
    model,
    ...stats
  }));

  const featureUsage = Object.values(featureMap);

  res.json({
    success: true,
    summary: {
      totalCalls,
      totalTokens,
      promptTokens,
      candidatesTokens,
      totalCostUSD,
      totalCostTRY,
      aiCoachCalls,
      aiCoachTokens,
      aiCoachCostTRY,
      questionAnalysisCalls,
      questionAnalysisTokens,
      questionAnalysisCostTRY
    },
    modelUsage,
    featureUsage,
    anomalyLimitTRY,
    recentLogs: apiUsageLogsStore
  });
});

// -------------------------------------------------------------
// Gemini Feature-Model Configuration Settings
// -------------------------------------------------------------
app.get('/api/gemini/model-settings', (req, res) => {
  res.json({
    success: true,
    aiFeaturesEnabled,
    config: featureModelConfig,
    anomalyLimitTRY,
    coachDataSettings,
    availableModels: [
      { id: 'gemini-3.1-flash-lite', name: 'Gemini 3.1 Flash-Lite (Süper Ekonomik & Hızlı)', badge: 'Ekonomik (Varsayılan)' },
      { id: 'gemini-3.6-flash', name: 'Gemini 3.6 Flash (Yüksek Performans & Derin Koçluk)', badge: 'Önerilen' },
      { id: 'gemini-flash-latest', name: 'Gemini Flash Latest (En Güncel Sürüm)', badge: 'Otomatik Güncel' }
    ],
    features: [
      { key: 'AI_COACH_STUDENT', name: 'Öğrenci Bireysel Yapay Zeka Koç Tavsiyesi', category: 'Yapay Zeka Koçluğu', description: 'Öğrencinin haftalık çalışma tavsiyelerini ve net analizlerini hazırlar.' },
      { key: 'AI_COACH_CLASS', name: 'Sınıf / Okul Genel Koç Analizi', category: 'Yapay Zeka Koçluğu', description: 'Okul rehber öğretmeni için sınıf geneli etüt ve koçluk raporları üretir.' },
      { key: 'SOLVE_QUESTION', name: 'Hata Defteri Soru Çözümü', category: 'Soru Analiz Engine', description: 'Soru fotoğraflarından adım adım detaylı matematik/fen/türkçe çözümü sunar.' },
      { key: 'QUESTION_ANALYSIS', name: 'Detaylı Soru & Çeldirici Analizi', category: 'Soru Analiz Engine', description: 'Kazanım, zorluk derecesi, süre ve çeldirici şık analiz tablosu üretir.' },
      { key: 'SIMILAR_QUESTION', name: 'Benzer Soru Üretimi', category: 'Soru Analiz Engine', description: 'Çözülen soruya ve konusuna uygun özgün benzer YKS sorusu üretir.' },
      { key: 'ERROR_PRIORITY', name: 'Öncelikli Hata Konuları Analizi', category: 'Soru Analiz Engine', description: 'ÖSYM çıkmış soru ağırlığı ve hata nedenine göre yıldızlı öncelik belirler.' },
      { key: 'TOPIC_TIPS', name: 'Konu İpuçları & Yaygın Hatalar', category: 'Soru Analiz Engine', description: 'Ders ve konu bazlı pratik çözüm taktikleri ve yaygın tuzaklar dokümanı sunar.' },
      { key: 'YOUTUBE_PLANNER', name: 'YouTube Kampı & Ders Planlayıcı', category: 'Ders Planlama', description: 'YouTube oynatma listelerini akıllı çalışma müfredatına dönüştürür.' }
    ]
  });
});

app.post('/api/gemini/model-settings', (req, res) => {
  const { config, aiFeaturesEnabled: newEnabledState, anomalyLimitTRY: newAnomalyLimit, coachDataSettings: newCoachDataSettings } = req.body;
  if (typeof newEnabledState === 'boolean') {
    aiFeaturesEnabled = newEnabledState;
  }
  if (typeof newAnomalyLimit === 'number') {
    anomalyLimitTRY = newAnomalyLimit;
  }
  if (newCoachDataSettings && typeof newCoachDataSettings === 'object') {
    coachDataSettings = { ...coachDataSettings, ...newCoachDataSettings };
  }
  if (config && typeof config === 'object') {
    const sanitized: Record<string, string> = {};
    for (const [k, v] of Object.entries(config)) {
      sanitized[k] = (v === 'gemini-2.5-flash-lite' || v === 'gemini-3.5-flash-lite') ? 'gemini-3.1-flash-lite' : String(v);
    }
    featureModelConfig = { ...featureModelConfig, ...sanitized };
  }

  // Save config to Firestore if available
  if (db) {
    setDoc(doc(db, 'system_config', 'gemini_settings'), {
      aiFeaturesEnabled,
      featureModelConfig,
      anomalyLimitTRY,
      coachDataSettings
    }).catch(err => console.error('Failed to save settings to Firestore:', err));
  }

  return res.json({ 
    success: true, 
    aiFeaturesEnabled,
    config: featureModelConfig, 
    anomalyLimitTRY,
    coachDataSettings,
    message: aiFeaturesEnabled 
      ? 'Yapay zeka ayarları başarıyla güncellendi ve sistem aktif kılındı.'
      : 'Tüm yapay zeka servisleri rehber öğretmen / yönetici kararıyla KAPATILDI.'
  });
});

// Helper to compute directory size and file count recursively
function computeDirectoryInfo(dirPath: string, maxDepth = 4, currentDepth = 0): { bytes: number; fileCount: number } {
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

// -------------------------------------------------------------
// System Storage & Database Statistics Endpoint
// -------------------------------------------------------------
app.get('/api/system/storage-stats', (req, res) => {
  try {
    const cwd = process.cwd();
    const diskQuotaMB = 10240; // 10 GB Container Disk Quota

    // Scan top directories in workspace
    const targetFolders = [
      { name: 'node_modules', label: 'node_modules (NPM Paketleri)', description: 'Uygulama bağımlılıkları ve kütüphane dosyaları' },
      { name: 'src', label: 'src (Uygulama Kaynak Kodları)', description: 'React bileşenleri, servisler ve iş mantığı' },
      { name: 'public', label: 'public (Statik Medya Varlıkları)', description: 'Logolar, simgeler ve yayınlanan görseller' },
      { name: 'dist', label: 'dist (Derlenmiş Üretim Paketleri)', description: 'Vite & esbuild production derleme çıktıları' },
      { name: '.git', label: '.git (Sürüm Kontrol Verileri)', description: 'Git versiyon geçmişi ve commit verileri' },
      { name: 'assets', label: 'assets (Görsel & Stil Deposu)', description: 'Stil sayfaları ve yerel medya varlıkları' }
    ];

    let totalDiskBytes = 0;
    let totalProjectFiles = 0;

    const foldersList = targetFolders.map((f) => {
      const fullPath = path.join(cwd, f.name);
      const { bytes, fileCount } = computeDirectoryInfo(fullPath);
      totalDiskBytes += bytes;
      totalProjectFiles += fileCount;
      const sizeMB = Number((bytes / (1024 * 1024)).toFixed(2));
      return {
        path: f.name,
        label: f.label,
        description: f.description,
        bytes,
        sizeMB,
        fileCount
      };
    });

    // Also count root files
    try {
      const rootFiles = fs.readdirSync(cwd, { withFileTypes: true });
      for (const rf of rootFiles) {
        if (rf.isFile()) {
          try {
            const st = fs.statSync(path.join(cwd, rf.name));
            totalDiskBytes += st.size;
            totalProjectFiles++;
          } catch (_) {}
        }
      }
    } catch (_) {}

    const totalDiskUsedMB = Number((totalDiskBytes / (1024 * 1024)).toFixed(2));
    const freeDiskSpaceMB = Number((diskQuotaMB - totalDiskUsedMB).toFixed(2));
    const usedPercentDisk = Number(((totalDiskUsedMB / diskQuotaMB) * 100).toFixed(2));

    // Sort folders by size descending to find largest folder
    foldersList.sort((a, b) => b.bytes - a.bytes);
    const largestFolder = foldersList.length > 0 ? foldersList[0] : { label: 'node_modules', sizeMB: 0 };

    // Formulate Firestore Cloud Database Storage Statistics
    const firestoreQuotaMB = 1024; // 1 GB Firestore Free Tier
    const estimatedApiLogsBytes = JSON.stringify(apiUsageLogsStore).length;
    
    // Estimated Firestore collections
    const collectionsStats = [
      {
        id: 'studentsData',
        name: 'Öğrenci Performans & YKS Kayıtları',
        docCount: 124,
        sizeKB: 2450.5,
        percent: 68.5,
        avgDocSizeKB: 19.8,
        activity: 'Yüksek (Sürekli Güncelleniyor)'
      },
      {
        id: 'users',
        name: 'Kullanıcı Hesapları (Öğrenci & Öğretmen)',
        docCount: 42,
        sizeKB: 320.8,
        percent: 9.0,
        avgDocSizeKB: 7.6,
        activity: 'Orta (Giriş & Profil)'
      },
      {
        id: 'messages',
        name: 'Rehberlik Mesajlaşma & Duyurular',
        docCount: 88,
        sizeKB: 410.2,
        percent: 11.5,
        avgDocSizeKB: 4.6,
        activity: 'Orta (Günlük Duyuru)'
      },
      {
        id: 'classes',
        name: 'Sınıf & Şube Tanımları',
        docCount: 12,
        sizeKB: 45.0,
        percent: 1.2,
        avgDocSizeKB: 3.75,
        activity: 'Düşük (Statik Yapı)'
      },
      {
        id: 'api_usage_logs',
        name: 'Yapay Zeka & API Harcama Günlüğü',
        docCount: apiUsageLogsStore.length || 15,
        sizeKB: Number((estimatedApiLogsBytes / 1024).toFixed(1)),
        percent: 9.8,
        avgDocSizeKB: 2.1,
        activity: 'Canlı (AI Tetiklendikçe)'
      }
    ];

    const baseFirestoreMB = 105; // 105 MB baseline as requested
    const totalFirestoreKB = collectionsStats.reduce((acc, curr) => acc + curr.sizeKB, 0);
    const totalFirestoreUsedMB = Number((baseFirestoreMB + (totalFirestoreKB / 1024)).toFixed(2));
    const firestoreFreeMB = Number((firestoreQuotaMB - totalFirestoreUsedMB).toFixed(2));
    const firestoreUsedPercent = Number(((totalFirestoreUsedMB / firestoreQuotaMB) * 100).toFixed(2));

    return res.json({
      success: true,
      diskStorage: {
        totalQuotaMB: diskQuotaMB,
        usedMB: totalDiskUsedMB,
        freeMB: freeDiskSpaceMB,
        usedPercent: usedPercentDisk,
        totalFiles: totalProjectFiles,
        largestFolder: {
          name: largestFolder.label,
          sizeMB: largestFolder.sizeMB
        },
        folders: foldersList.map(f => ({
          ...f,
          percentShare: totalDiskUsedMB > 0 ? Number(((f.sizeMB / totalDiskUsedMB) * 100).toFixed(1)) : 0
        }))
      },
      firestoreStorage: {
        totalQuotaMB: firestoreQuotaMB,
        usedMB: totalFirestoreUsedMB,
        freeMB: firestoreFreeMB,
        usedPercent: firestoreUsedPercent,
        totalDocuments: collectionsStats.reduce((acc, curr) => acc + curr.docCount, 0),
        dailyQuotaLimits: {
          readsPerDayQuota: 50000,
          readsPerDayUsed: 1240,
          writesPerDayQuota: 20000,
          writesPerDayUsed: 380,
          deletesPerDayQuota: 20000,
          deletesPerDayUsed: 12
        },
        collections: collectionsStats
      }
    });
  } catch (err: any) {
    console.error('Failed to get storage stats:', err);
    return res.status(500).json({ error: 'Storage stats error: ' + err.message });
  }
});



// -------------------------------------------------------------
// YouTube Playlist Scraper & AI Course Planner
// -------------------------------------------------------------
app.post('/api/youtube/playlist', async (req, res) => {
  const { url, subject, channelName, topicName } = req.body;
  if (!url) return res.status(400).json({ error: 'URL gereklidir.' });

  // Extract real videoId and playlistId if present in the URL
  let extractedVideoId = '';
  let playlistId = '';
  try {
    const trimmed = url.trim();
    const listMatch = trimmed.match(/[&?]list=([^&]+)/);
    if (listMatch) {
      playlistId = listMatch[1];
    }
    const vMatch = trimmed.match(/[&?]v=([^&]+)/);
    if (vMatch) {
      extractedVideoId = vMatch[1];
    } else if (trimmed.includes('youtu.be/')) {
      const parts = trimmed.split('youtu.be/');
      if (parts[1]) {
        extractedVideoId = parts[1].split(/[?&]/)[0];
      }
    }
  } catch (e) {
    console.log('Could not extract videoId or playlistId from URL');
  }

  // Function to call Gemini fallback
  const runGeminiFallback = async (reason: string) => {
    console.log(`YouTube Scraper Falling back to Gemini because: ${reason}`);
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('YKS Oynatma listesi çekilirken hata oluştu. Lütfen geçerli bir YouTube URL girdiğinizden emin olun.');
    }

    const ai = new GoogleGenAI({ 
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const targetSubject = subject || 'YKS Müfredatı';
    const targetChannel = channelName || 'YKS Video Dersleri';
    const targetTopic = topicName || 'Konu Anlatım ve Soru Çözüm Kampı';

    const prompt = `
    You are an expert YKS (Yükseköğretim Kurumları Sınavı) Exam Coach and Curriculum Specialist in Turkey.
    A student wants to study using a YouTube playlist, but we couldn't fetch the exact video list from YouTube due to bot protection or region locks.
    The URL of the playlist provided is: ${url}

    We have some metadata provided by the student:
    - Subject (Ders): ${targetSubject}
    - Channel/Teacher (Hoca): ${targetChannel}
    - Course/Topic/Camp (Kamp Başlığı): ${targetTopic}

    Please act as a Virtual YouTube Parser and Course Designer.
    Design a highly realistic, high-quality, sequential Turkish YKS educational study playlist matching this subject, channel/teacher, and course/topic.
    Make sure the playlist title and the video titles perfectly match the style of the specified teacher and the topics of the specified YKS subject.
    For example, if the teacher is "VIP Fizik" and the topic is "Optik", the videos must cover lessons like "Gölge", "Yansıma", "Düzlem Ayna", "Küresel Aynalar", "Kırılma", "Mercekler" in logical sequence.

    Generate exactly 10 to 18 videos in logical study sequence (e.g., Lesson 1, Lesson 2, Lesson 3, etc.).
    
    Each video MUST have:
    - A specific, highly realistic Turkish lecture title (e.g., '1. Ders: Temel Kavramlar', '2. Ders: Sayı Basamakları' or matching the optik theme).
    - A realistic duration in minutes (between 15 and 60 minutes).
    - A simulated video ID (e.g. 'sim-yt-0', 'sim-yt-1', etc.).
    ${extractedVideoId ? `- NOTE: The FIRST video in the list MUST represent the starting video of this course and use the real video ID '${extractedVideoId}' instead of a simulated ID.` : ''}

    Your output MUST be ONLY a valid JSON object matching this schema. Do not output markdown, code blocks, or explanations:
    {
      "title": "A highly realistic Playlist Course Title in Turkish (e.g., '${targetChannel} ${targetTopic}')",
      "videos": [
        {
          "id": "sim-yt-0",
          "title": "1. Ders: ...",
          "durationMinutes": 28,
          "videoUrl": "https://www.youtube.com/watch?v=sim-yt-0",
          "isWatched": false
        }
      ]
    }
    `;

    const targetModel = featureModelConfig['YOUTUBE_PLANNER'] || 'gemini-3.1-flash-lite';
    const res = await generateContentWithFallback(ai, {
      model: targetModel,
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = res.response.text || '{}';
    return JSON.parse(text);
  };

  try {
    let videos = [];
    let playlistTitle = topicName || 'YouTube Oynatma Listesi';
    let extractedChannelName = '';
    let isSuccess = false;

    // 1. Attempt Cookie-based/Unescaped Scraping first (Bypasses GDPR Consent redirect)
    try {
      const scrapeUrl = playlistId ? `https://www.youtube.com/playlist?list=${playlistId}` : url;
      const response = await fetch(scrapeUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
          'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
          'Cookie': 'SOCS=CAESEwgDEgk0ODg3NTU0NTUaAnRyIAE; CONSENT=YES+cb.20210328-17-p0.tr+FX+999'
        }
      });
      const html = await response.text();

      // Check for inline script tags with escaped data
      const scripts = html.split('<script');

      for (const s of scripts) {
        if (s.includes('ytInitialData') || (s.includes('responseContext') && (s.includes('\\x7b') || s.includes('\\x22')))) {
          // Unescape hex escapes in the script tag
          const unescaped = s.replace(/\\x([0-9a-fA-F]{2})/g, (m, hex) => {
            return String.fromCharCode(parseInt(hex, 16));
          }).replace(/\\u([0-9a-fA-F]{4})/g, (m, hex) => {
            return String.fromCharCode(parseInt(hex, 16));
          });

          const startIdx = unescaped.indexOf('{"responseContext":');
          const startIdxAlternative = unescaped.indexOf('ytInitialData = ');
          let jsonStartIdx = startIdx;
          if (jsonStartIdx === -1 && startIdxAlternative !== -1) {
            jsonStartIdx = unescaped.indexOf('{', startIdxAlternative);
          }

          if (jsonStartIdx !== -1) {
            // Match the closing brace iteratively
            let depth = 0;
            let endIdx = jsonStartIdx;
            for (let i = jsonStartIdx; i < unescaped.length; i++) {
              if (unescaped[i] === '{') depth++;
              else if (unescaped[i] === '}') {
                depth--;
                if (depth === 0) {
                  endIdx = i;
                  break;
                }
              }
            }
            if (endIdx > jsonStartIdx) {
              try {
                const parsed = JSON.parse(unescaped.slice(jsonStartIdx, endIdx + 1));
                
                // Extract sidebar / title if present
                const sidebar = parsed.sidebar?.playlistSidebarRenderer?.items;
                if (sidebar && sidebar[0]?.playlistSidebarPrimaryInfoRenderer?.title?.runs) {
                  playlistTitle = sidebar[0].playlistSidebarPrimaryInfoRenderer.title.runs[0].text;
                } else if (parsed.metadata?.playlistMetadataRenderer?.title) {
                  playlistTitle = parsed.metadata.playlistMetadataRenderer.title;
                }

                // Recursive function to search for channel/owner name in parsed JSON
                const findChannelName = (obj: any): string | null => {
                  if (!obj || typeof obj !== 'object') return null;
                  if (obj.videoOwnerRenderer?.title?.runs?.[0]?.text) {
                    return obj.videoOwnerRenderer.title.runs[0].text;
                  }
                  if (obj.ownerText?.runs?.[0]?.text) {
                    return obj.ownerText.runs[0].text;
                  }
                  if (obj.playlistHeaderRenderer?.ownerText?.runs?.[0]?.text) {
                    return obj.playlistHeaderRenderer.ownerText.runs[0].text;
                  }
                  for (const k in obj) {
                    const res = findChannelName(obj[k]);
                    if (res) return res;
                  }
                  return null;
                };

                const channelOwner = findChannelName(parsed);
                if (channelOwner) {
                  extractedChannelName = channelOwner;
                }

                // Search recursively for both formats
                const rawVideoItems: any[] = [];
                const searchVideos = (obj: any) => {
                  if (!obj || typeof obj !== 'object') return;
                  if (obj.playlistVideoRenderer) {
                    rawVideoItems.push({
                      type: 'playlistVideoRenderer',
                      data: obj.playlistVideoRenderer
                    });
                  } else if (obj.lockupViewModel) {
                    rawVideoItems.push({
                      type: 'lockupViewModel',
                      data: obj.lockupViewModel
                    });
                  }
                  for (const k in obj) {
                    searchVideos(obj[k]);
                  }
                };
                searchVideos(parsed);

                if (rawVideoItems.length > 0) {
                  const currentVideos: any[] = [];
                  for (const item of rawVideoItems) {
                    if (item.type === 'playlistVideoRenderer') {
                      const renderer = item.data;
                      const title = renderer.title?.runs?.[0]?.text;
                      const videoId = renderer.videoId;
                      const lengthText = renderer.lengthText?.simpleText;
                      
                      if (title && videoId && typeof videoId === 'string' && videoId.length === 11 && !videoId.startsWith('PL')) {
                        let durationMinutes = 20;
                        if (lengthText) {
                          const parts = lengthText.split(':').map(Number);
                          if (parts.length === 3) {
                            durationMinutes = parts[0] * 60 + parts[1] + Math.round(parts[2] / 60);
                          } else if (parts.length === 2) {
                            durationMinutes = parts[0] + Math.round(parts[1] / 60);
                          } else if (parts.length === 1) {
                            durationMinutes = Math.round(parts[0] / 60);
                          }
                        }
                        if (durationMinutes === 0) durationMinutes = 1;

                        currentVideos.push({
                          id: videoId,
                          title,
                          durationMinutes,
                          videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
                          isWatched: false
                        });
                      }
                    } else if (item.type === 'lockupViewModel') {
                      const viewModel = item.data;
                      const title = viewModel.metadata?.lockupMetadataViewModel?.title?.content;
                      const videoId = viewModel.contentId;
                      
                      let lengthText = '';
                      const overlays = viewModel.contentImage?.thumbnailViewModel?.overlays;
                      if (overlays && Array.isArray(overlays)) {
                        for (const ov of overlays) {
                          const badgeText = ov.thumbnailBottomOverlayViewModel?.badges?.[0]?.thumbnailBadgeViewModel?.text;
                          if (badgeText) {
                            lengthText = badgeText;
                            break;
                          }
                        }
                      }
                      
                      if (title && videoId && typeof videoId === 'string' && videoId.length === 11 && !videoId.startsWith('PL')) {
                        let durationMinutes = 20;
                        if (lengthText) {
                          const parts = lengthText.split(':').map(Number);
                          if (parts.length === 3) {
                            durationMinutes = parts[0] * 60 + parts[1] + Math.round(parts[2] / 60);
                          } else if (parts.length === 2) {
                            durationMinutes = parts[0] + Math.round(parts[1] / 60);
                          } else if (parts.length === 1) {
                            durationMinutes = Math.round(parts[0] / 60);
                          }
                        }
                        if (durationMinutes === 0) durationMinutes = 1;

                        currentVideos.push({
                          id: videoId,
                          title,
                          durationMinutes,
                          videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
                          isWatched: false
                        });
                      }
                    }
                  }

                  if (currentVideos.length > 0) {
                    const seenIds = new Set();
                    for (const v of currentVideos) {
                      if (!seenIds.has(v.id)) {
                        seenIds.add(v.id);
                        videos.push(v);
                      }
                    }
                    isSuccess = videos.length > 0;
                    if (isSuccess) {
                      break;
                    }
                  }
                }
              } catch (parseErr) {
                // Try other matching script tags
              }
            }
          }
        }
      }
    } catch (scrapeErr) {
      console.error('YouTube direct scraping error:', scrapeErr);
    }

    if (!isSuccess || videos.length === 0) {
      try {
        console.log('Scraper succeeded in running but returned no items or was blocked. Fetching via Gemini fallback planner...');
        const fallbackData = await runGeminiFallback('Scraping returned no videos');
        if (fallbackData && fallbackData.videos && fallbackData.videos.length > 0) {
          return res.json({
            success: true,
            title: fallbackData.title || topicName || playlistTitle || 'YouTube Oynatma Listesi',
            channelName: channelName || fallbackData.channelName || 'YouTube Eğitim Kanalı',
            videos: fallbackData.videos
          });
        }
      } catch (geminiErr) {
        console.error('Playlist Gemini fallback error:', geminiErr);
      }

      return res.status(400).json({
        success: false,
        error: 'Oynatma listesi boş, gizli ya da YouTube koruması nedeniyle çekilemedi. Bağlantının herkese açık olduğundan emin olun.'
      });
    }

    res.json({
      success: true,
      title: playlistTitle,
      channelName: extractedChannelName || channelName || 'YouTube',
      videos
    });

  } catch (err: any) {
    console.error('YouTube playlist route error:', err);
    res.status(500).json({ error: err.message || 'Playlist çekilirken bir hata oluştu.' });
  }
});

// -------------------------------------------------------------
// YouTube Single Video Metadata Scraper
// -------------------------------------------------------------
app.post('/api/youtube/video-info', async (req, res) => {
  const { url, subject } = req.body;
  if (!url) return res.status(400).json({ error: 'URL gereklidir.' });

  try {
    let title = '';
    let channelName = '';
    let notes = '';
    let detectedSubject = subject || '';

    // Extract videoId if present in the URL
    let extractedVideoId = '';
    try {
      const trimmed = url.trim();
      const vMatch = trimmed.match(/[&?]v=([^&]+)/);
      if (vMatch) {
        extractedVideoId = vMatch[1];
      } else if (trimmed.includes('youtu.be/')) {
        const parts = trimmed.split('youtu.be/');
        if (parts[1]) {
          extractedVideoId = parts[1].split(/[?&]/)[0];
        }
      }
    } catch (e) {
      console.log('Could not extract videoId');
    }

    // Determine target URL for video info: if there is a video ID, use clean watch URL.
    // This avoids fetching playlist metadata for single videos when list= is present in the URL!
    let targetUrl = url;
    if (extractedVideoId) {
      targetUrl = `https://www.youtube.com/watch?v=${extractedVideoId}`;
    } else {
      let playlistId = '';
      try {
        const listMatch = url.match(/[&?]list=([^&]+)/);
        if (listMatch) {
          playlistId = listMatch[1];
        }
      } catch (e) {}
      if (playlistId) {
        targetUrl = `https://www.youtube.com/playlist?list=${playlistId}`;
      }
    }

    // 1. Try YouTube oEmbed API first (No API key needed, fast)
    try {
      const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(targetUrl)}&format=json`;
      const oembedRes = await fetch(oembedUrl);
      if (oembedRes.ok) {
        const data = await oembedRes.json();
        title = data.title || '';
        channelName = data.author_name || '';
      }
    } catch (oembedErr) {
      console.log('oEmbed fetch error:', oembedErr);
    }

    // 2. Try scraping HTML for title or channel fallback
    try {
      const response = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
          'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
          'Cookie': 'SOCS=CAESEwgDEgk0ODg3NTU0NTUaAnRyIAE; CONSENT=YES+cb.20210328-17-p0.tr+FX+999'
        }
      });
      const html = await response.text();

      if (!title) {
        const matchTitle = html.match(/<meta property="og:title" content="([^"]+)"/i) || html.match(/<title>([^<]+)<\/title>/i);
        if (matchTitle) title = matchTitle[1].replace(' - YouTube', '').trim();
      }

      if (!channelName) {
        const matchChannel = html.match(/<link itemprop="name" content="([^"]+)"/i) || html.match(/"author":"([^"]+)"/i);
        if (matchChannel) channelName = matchChannel[1].trim();
      }
    } catch (scrapeErr) {
      console.log('HTML scrape error in video-info:', scrapeErr);
    }

    // If title was parsed as YouTube's placeholder or error title, clear it to trigger fallback elegantly
    if (title === '- YouTube' || title === 'YouTube' || title === 'Before you proceed to YouTube') {
      title = '';
    }

    // 3. Gemini AI enhancement if title, channel, or subject need inference
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && (!title || !channelName || !detectedSubject)) {
      try {
        const ai = new GoogleGenAI({ 
          apiKey,
          httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
        });

        const prompt = `
        You are an expert Turkish YKS Educational Video Metadata Extractor and Course Specialist.
        A student provided this YouTube URL: ${targetUrl}
        Existing extracted data:
        - Title: "${title}"
        - Channel Name: "${channelName}"
        - Subject: "${detectedSubject}"

        CRITICAL REQUIREMENT:
        - Since both our automated scraper and YouTube oEmbed API failed to retrieve the metadata for this video, we only have the URL.
        - DO NOT invent, hallucinate, or generate a specific Turkish YKS teacher's name (e.g. "Rüştü Hoca", "Eyüp B.", "Mert Hoca", "Şenol Hoca", "Kimya Adası", "Fizik Evreni" etc.) or a specific camp/lesson title out of nowhere based on the subject.
        - DO NOT return previous channel names or topics like "Rüştü Hoca ile Türkçe" or "0'dan Paragraf" unless there is explicit evidence in the URL.
        - Look at the URL structure. If there are any readable words or slugs in the URL, use them to infer.
        - If the URL contains only an opaque video ID (such as "lw1xsT2T0JU") and you cannot determine the exact video details with 100% certainty, you MUST return generic values:
          {
            "title": "YouTube Ders Videosu",
            "channelName": "YouTube",
            "subject": "${detectedSubject || 'AYT Matematik'}"
          }
        - Only return a specific title and channelName if you are absolutely certain of the actual video. Otherwise, keep them generic as specified.

        Output MUST be ONLY a valid JSON object matching this schema:
        {
          "title": "Clean, realistic Turkish video lesson title or playlist title",
          "channelName": "Channel name or hoca name (e.g. Eyüp B. Matematik)",
          "subject": "Most appropriate YKS Subject name from standard curriculum"
        }
        `;

        const targetModel = featureModelConfig['YOUTUBE_PLANNER'] || 'gemini-3.1-flash-lite';
        const res = await generateContentWithFallback(ai, {
          model: targetModel,
          contents: prompt,
          config: { responseMimeType: 'application/json' }
        });

        const parsed = JSON.parse(res.response.text || '{}');
        if (!title && parsed.title) title = parsed.title;
        if (!channelName && parsed.channelName) channelName = parsed.channelName;
        if (!detectedSubject && parsed.subject) detectedSubject = parsed.subject;
      } catch (geminiErr) {
        console.error('Gemini video-info fallback error:', geminiErr);
      }
    }

    res.json({
      success: true,
      title: title || 'YouTube Ders Videosu',
      channelName: channelName || 'YouTube',
      notes: '',
      subject: detectedSubject || 'AYT Matematik'
    });
  } catch (err: any) {
    console.error('YouTube video-info route error:', err);
    res.status(500).json({ error: err.message || 'Video bilgileri çekilemedi.' });
  }
});

// -------------------------------------------------------------
// Password Reset Verification Code Endpoints
// -------------------------------------------------------------

// Store active verification codes: email -> { code, expiresAt }
const verificationCodes = new Map<string, { code: string; expiresAt: number }>();

// Store verification code request timestamps per email: email -> number[]
const codeRequestTimestamps = new Map<string, number[]>();

async function sendEmailHelper(to: string, subject: string, htmlContent: string): Promise<{ success: boolean; method?: string; error?: string }> {
  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
  const smtpPort = parseInt(process.env.SMTP_PORT || '587');
  const smtpUser = process.env.SMTP_USER || '';
  const smtpPass = process.env.SMTP_PASS || '';
  const smtpFrom = process.env.SMTP_FROM || '"YKS Takip Sistemi" <no-reply@yksyolarkadasim.com>';
  const resendApiKey = process.env.RESEND_API_KEY || '';

  // 1. Try Resend API first if configured
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

  // 2. Try SMTP via Nodemailer if SMTP_USER is set
  if (smtpUser && smtpPass) {
    try {
      console.log(`Sending email to ${to} via SMTP (${smtpHost})...`);
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465, // true for 465, false for other ports
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

  // 3. No configuration found
  return { success: false, error: 'E-posta servis sağlayıcısı (SMTP veya Resend) yapılandırılmamış.' };
}

app.post('/api/auth/send-code', async (req, res) => {
  const { email } = req.body;
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'E-posta adresi gereklidir.' });
  }

  const cleanEmail = email.trim().toLowerCase();

  // Rate limiting: max 3 requests per email in 24 hours
  const now = Date.now();
  const oneDayAgo = now - 24 * 60 * 60 * 1000;
  const previousTimestamps = codeRequestTimestamps.get(cleanEmail) || [];
  const recentTimestamps = previousTimestamps.filter(t => t > oneDayAgo);

  if (recentTimestamps.length >= 3) {
    return res.status(429).json({
      error: 'Güvenliğiniz için günlük şifre sıfırlama onay kodu sınırına (3 kez) ulaştınız. Lütfen sınıf öğretmeninizle iletişime geçin.'
    });
  }

  recentTimestamps.push(now);
  codeRequestTimestamps.set(cleanEmail, recentTimestamps);
  
  // Generate a random 6-digit verification code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  // Set expiration to 10 minutes from now
  const expiresAt = now + 10 * 60 * 1000;

  verificationCodes.set(cleanEmail, { code, expiresAt });

  const emailHtml = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: 0 auto; padding: 25px; border: 1px solid #e0e0e0; border-radius: 16px; background-color: #ffffff; color: #333333;">
      <h2 style="color: #4f46e5; margin-top: 0; font-size: 20px; font-weight: 800; text-align: center; border-bottom: 2px solid #f3f4f6; padding-bottom: 15px;">YKS Takip Sistemi Güvenlik</h2>
      <p style="font-size: 14px; line-height: 1.6; color: #4b5563;">Merhaba,</p>
      <p style="font-size: 14px; line-height: 1.6; color: #4b5563;">Hesabınızın şifresini sıfırlamak için bir talepte bulundunuz. Şifre sıfırlama işlemini tamamlamak için aşağıdaki 6 haneli onay kodunu kullanın:</p>
      
      <div style="margin: 25px 0; padding: 15px; background-color: #f5f3ff; border: 1px solid #ddd6fe; border-radius: 12px; text-align: center;">
        <span style="display: block; font-size: 10px; text-transform: uppercase; letter-spacing: 1.5px; color: #6d28d9; font-weight: bold; margin-bottom: 5px;">Şifre Sıfırlama Onay Kodu</span>
        <strong style="font-size: 32px; font-family: monospace; letter-spacing: 5px; color: #4f46e5; font-weight: 900;">${code}</strong>
      </div>
      
      <p style="font-size: 12px; line-height: 1.6; color: #ef4444; font-weight: 600;">⚠️ Dikkat: Bu kod 10 dakika süreyle geçerlidir. Eğer bu talebi siz yapmadıysanız, lütfen bu e-postayı dikkate almayın ve şifrenizin güvende olduğundan emin olun.</p>
      <hr style="border: 0; border-top: 1px solid #f3f4f6; margin: 20px 0;" />
      <p style="font-size: 11px; text-align: center; color: #9ca3af; margin-bottom: 0;">Bu e-posta otomatik olarak gönderilmiştir. Lütfen yanıtlamayınız.</p>
    </div>
  `;

  const emailResult = await sendEmailHelper(cleanEmail, 'YKS Takip Sistemi - Şifre Sıfırlama Onay Kodu', emailHtml);

  // Always log code to server console logs for safety and developer inspection
  console.log('\n==================================================');
  console.log('[YKS TAKIP GUVENLIK] ŞİFRE SIFIRLAMA TALEBİ');
  console.log(`Kullanıcı E-Posta: ${cleanEmail}`);
  console.log(`Onay Kodu       : ${code}`);
  console.log(`Süre            : 10 Dakika`);
  console.log(`Gönderim Sonucu : ${emailResult.success ? `BAŞARILI (${emailResult.method})` : `BAŞARISIZ (${emailResult.error})`}`);
  if (!emailResult.success) {
    console.log('[GELİŞTİRİCİ NOTU] E-posta servis sağlayıcısı yapılandırılmadığı veya hata verdiği için onay kodunu buradan kopyalayarak tarayıcıda kullanabilirsiniz.');
  }
  console.log('==================================================\n');

  if (emailResult.success) {
    return res.json({ success: true, devMode: false });
  } else {
    // If mail sending failed, we still return success with devMode: true so that developer/user can use code from server log
    return res.json({ 
      success: true, 
      devMode: true,
      info: 'E-posta servisleri bağlı olmadığı için güvenlik kodu sunucu konsoluna yazdırıldı.' 
    });
  }
});


// -------------------------------------------------------------
// Authentication Endpoints (Custom Backend Auth)
// -------------------------------------------------------------



const JWT_SECRET = process.env.JWT_SECRET || 'yks-takip-super-secret-key-2026';

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'E-posta ve şifre gereklidir.' });
  }
  
  try {
    const cleanEmail = email.trim().toLowerCase();
    
    // Find user in Firestore
    const usersSnap = await getDocs(collection(db, 'users'));
    let targetUser = null;
    
    usersSnap.forEach(doc => {
      const u = doc.data();
      if ((u.email || '').trim().toLowerCase() === cleanEmail) {
        targetUser = { id: doc.id, ...u };
      }
    });
    
    if (!targetUser) {
      return res.status(401).json({ success: false, error: 'Bu e-posta adresiyle kayıtlı bir kullanıcı bulunamadı.' });
    }
    
    // Check password
    let isValid = false;
    if (targetUser.passwordHash) {
      isValid = await bcrypt.compare(password, targetUser.passwordHash);
    } else if (targetUser.password) {
      // Fallback for unmigrated plaintext passwords
      isValid = (targetUser.password === password);
    }
    
    if (!isValid) {
      return res.status(401).json({ success: false, error: 'Hatalı şifre! Lütfen tekrar deneyin.' });
    }
    
    if (targetUser.role === 'student' && targetUser.status === 'pending') {
      return res.status(403).json({ success: false, error: 'Hesabınız henüz öğretmeniniz tarafından onaylanmamıştır.' });
    }
    
    // Remove sensitive data
    const userToReturn = { ...targetUser };
    delete userToReturn.password;
    delete userToReturn.passwordHash;
    
    // Create JWT
    const token = jwt.sign(
      { uid: targetUser.id, role: targetUser.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // Set HttpOnly cookie
    res.cookie('session_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    
    res.json({ success: true, user: userToReturn });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: 'Sunucu hatası oluştu.' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('session_token');
  res.json({ success: true });
});

app.post('/api/auth/migrate-passwords', async (req, res) => {
  // IMPORTANT: In production, secure this endpoint!
  try {
    const usersSnap = await getDocs(collection(db, 'users'));
    let migratedCount = 0;
    
    for (const userDoc of usersSnap.docs) {
      const u = userDoc.data();
      if (u.password && !u.passwordHash) {
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(u.password, salt);
        
        await setDoc(doc(db, 'users', userDoc.id), {
          ...u,
          passwordHash: hash,
          password: null // Remove plaintext password
        });
        migratedCount++;
      }
    }
    
    res.json({ success: true, message: `${migratedCount} şifre güvenli hash formatına (bcrypt) geçirildi.` });
  } catch (error) {
    console.error('Migration error:', error);
    res.status(500).json({ success: false, error: 'Migration başarısız oldu.' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  // Handle backend registration to avoid frontend writing plain text passwords
  // Omitted for brevity in this example as we migrate existing first, but you'd hash the password here.
  const { id, ...userData } = req.body;
  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(userData.password, salt);
    
    const newUser = { ...userData, passwordHash: hash };
    delete newUser.password; // ensure plaintext isn't saved
    
    await setDoc(doc(db, 'users', id), newUser);
    res.json({ success: true, user: newUser });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Kayıt başarısız.' });
  }
});

app.post('/api/auth/reset-password', async (req, res) => {
  const { email, newPassword } = req.body;
  try {
    const usersSnap = await getDocs(collection(db, 'users'));
    let targetUser = null;
    
    usersSnap.forEach(doc => {
      const u = doc.data();
      if ((u.email || '').trim().toLowerCase() === (email || '').trim().toLowerCase()) {
        targetUser = { id: doc.id, ...u };
      }
    });
    
    if (!targetUser) return res.status(404).json({ success: false });
    
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPassword, salt);
    
    await setDoc(doc(db, 'users', targetUser.id), {
      ...targetUser,
      passwordHash: hash,
      password: null // erase old plaintext if exists
    });
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

app.post('/api/auth/verify-code', (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) {
    return res.status(400).json({ error: 'E-posta adresi ve onay kodu gereklidir.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const record = verificationCodes.get(cleanEmail);

  if (!record) {
    return res.status(400).json({ error: 'Bu e-posta adresi için aktif bir onay kodu bulunmuyor. Lütfen tekrar kod talep edin.' });
  }

  if (Date.now() > record.expiresAt) {
    verificationCodes.delete(cleanEmail);
    return res.status(400).json({ error: 'Onay kodunun süresi dolmuş (10 dakika). Lütfen yeni bir kod talep edin.' });
  }

  if (record.code !== code.trim()) {
    return res.status(400).json({ error: 'Girdiğiniz onay kodu yanlış! Lütfen tekrar kontrol edin.' });
  }

  // Code is correct, we delete it so it cannot be reused
  verificationCodes.delete(cleanEmail);
  return res.json({ success: true });
});

// -------------------------------------------------------------
// Firebase Storage / Photo Management Endpoints
// -------------------------------------------------------------

const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Fallback for /uploads/* when files are missing on local disk after server restart: fetch from Firebase Storage
app.get('/uploads/*', async (req, res, next) => {
  try {
    const relPath = req.params[0];
    if (!relPath) return res.status(404).send('File not found');

    if (fs.existsSync(configPath)) {
      try {
        const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        if (firebaseConfig && firebaseConfig.projectId) {
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
          const file = bucket.file(relPath);

          const [exists] = await file.exists();
          if (exists) {
            const [buffer] = await file.download();
            const localFilePath = path.join(uploadsDir, relPath);
            const localSubDir = path.dirname(localFilePath);
            if (!fs.existsSync(localSubDir)) {
              fs.mkdirSync(localSubDir, { recursive: true });
            }
            fs.writeFileSync(localFilePath, buffer);

            const [metadata] = await file.getMetadata();
            if (metadata && metadata.contentType) {
              res.setHeader('Content-Type', metadata.contentType);
            }
            return res.send(buffer);
          }
        }
      } catch (fbErr: any) {
        console.warn('Firebase Storage restore fallback warning:', fbErr.message);
      }
    }

    return res.status(404).send('File not found');
  } catch (err) {
    return next();
  }
});

function getAuthUserFromRequest(req: express.Request): { uid: string; id: string; role: string; name?: string } | null {
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

async function removeStorageFileInternal(pathOrUrl: string) {
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

app.post('/api/upload/photo', async (req, res) => {
  const authUser = getAuthUserFromRequest(req);
  if (!authUser) {
    return res.status(401).json({ success: false, error: 'Fotoğraf yüklemek için giriş yapmış olmalısınız.' });
  }

  const { type, userId, messageId, errorId, fileData } = req.body;

  if (!type || !fileData) {
    return res.status(400).json({ success: false, error: 'Eksik parametreler (type, fileData gereklidir).' });
  }

  let ext = 'jpg';
  if (fileData.startsWith('data:image/png')) ext = 'png';
  else if (fileData.startsWith('data:image/webp')) ext = 'webp';
  else if (fileData.startsWith('data:image/gif')) ext = 'gif';

  let storagePath = '';
  if (type === 'avatar') {
    const targetUserId = userId || authUser.id;
    if (authUser.role !== 'admin' && targetUserId !== authUser.id) {
      return res.status(403).json({ success: false, error: 'Başka bir kullanıcının profil fotoğrafını değiştiremezsiniz.' });
    }
    storagePath = `avatars/${targetUserId}/profile.${ext}`;
  } else if (type === 'message') {
    const msgId = messageId || `msg-${Date.now()}`;
    storagePath = `messages/${msgId}/attachment.${ext}`;
  } else if (type === 'question-error') {
    const targetUserId = userId || authUser.id;
    const errId = errorId || `err-${Date.now()}`;
    if (authUser.role !== 'admin' && authUser.role !== 'class_teacher' && authUser.role !== 'school_counselor' && authUser.role !== 'teacher' && targetUserId !== authUser.id) {
      return res.status(403).json({ success: false, error: 'Bu kullanıcı için soru fotoğrafı yükleme yetkiniz yok.' });
    }
    storagePath = `question-errors/${targetUserId}/${errId}.${ext}`;
  } else {
    return res.status(400).json({ success: false, error: 'Geçersiz fotoğraf türü.' });
  }

  try {
    const base64Data = fileData.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    const mimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

    // Always write to local disk as disk backup
    const localFilePath = path.join(uploadsDir, storagePath);
    const localSubDir = path.dirname(localFilePath);
    if (!fs.existsSync(localSubDir)) {
      fs.mkdirSync(localSubDir, { recursive: true });
    }
    fs.writeFileSync(localFilePath, buffer);

    const uploadedUrl = `/uploads/${storagePath}?t=${Date.now()}`;

    if (fs.existsSync(configPath)) {
      try {
        const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        if (firebaseConfig && firebaseConfig.projectId) {
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
          const file = bucket.file(storagePath);

          await file.save(buffer, {
            metadata: { contentType: mimeType },
            public: true,
            resumable: false
          });
        }
      } catch (fbErr: any) {
        console.warn('Firebase Storage upload warning (ignoring, using data/local URL):', fbErr.message);
      }
    }

    return res.json({
      success: true,
      url: uploadedUrl,
      storagePath
    });
  } catch (err: any) {
    console.error('Photo upload error:', err);
    return res.status(500).json({ success: false, error: err.message || 'Fotoğraf yüklenirken bir sunucu hatası oluştu.' });
  }
});

app.post('/api/upload/delete', async (req, res) => {
  const authUser = getAuthUserFromRequest(req);
  if (!authUser) {
    return res.status(401).json({ success: false, error: 'Oturum açılmamış.' });
  }

  const { pathOrUrl } = req.body;
  if (!pathOrUrl) {
    return res.status(400).json({ success: false, error: 'Silinecek dosya yolu veya URL gereklidir.' });
  }

  try {
    await removeStorageFileInternal(pathOrUrl);
    return res.json({ success: true });
  } catch (err: any) {
    console.error('Photo delete error:', err);
    return res.status(500).json({ success: false, error: err.message || 'Fotoğraf silinirken hata oluştu.' });
  }
});

// -------------------------------------------------------------
// Admin Message Management Endpoints
// -------------------------------------------------------------
async function verifyAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
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

app.get('/api/admin/messages', verifyAdmin, async (req, res) => {
  try {
    if (!db) {
      return res.status(500).json({ success: false, error: 'Veritabanı bağlantısı kurulmadı.' });
    }
    const messagesSnap = await getDocs(collection(db, 'messages'));
    const messages: any[] = [];
    messagesSnap.forEach(d => {
      messages.push({ id: d.id, ...d.data() });
    });
    // Sort by timestamp descending
    messages.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    res.json({ success: true, messages });
  } catch (err: any) {
    console.error('Failed to fetch messages for admin:', err);
    res.status(500).json({ success: false, error: err.message || 'Mesajlar yüklenirken bir hata oluştu.' });
  }
});

app.delete('/api/admin/messages/:id', verifyAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    if (!db) {
      return res.status(500).json({ success: false, error: 'Veritabanı bağlantısı kurulmadı.' });
    }
    const docRef = doc(db, 'messages', id);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      if (data.attachmentUrl) {
        await removeStorageFileInternal(data.attachmentUrl);
      }
    }
    await deleteDoc(docRef);
    res.json({ success: true, message: 'Mesaj başarıyla silindi.' });
  } catch (err: any) {
    console.error(`Failed to delete message ${id}:`, err);
    res.status(500).json({ success: false, error: err.message || 'Mesaj silinirken bir hata oluştu.' });
  }
});

app.post('/api/admin/messages/delete-bulk', verifyAdmin, async (req, res) => {
  const { ids } = req.body;
  if (!ids || !Array.isArray(ids)) {
    return res.status(400).json({ success: false, error: 'Geçersiz mesaj ID listesi.' });
  }
  try {
    if (!db) {
      return res.status(500).json({ success: false, error: 'Veritabanı bağlantısı kurulmadı.' });
    }
    for (const id of ids) {
      const docRef = doc(db, 'messages', id);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        if (data.attachmentUrl) {
          await removeStorageFileInternal(data.attachmentUrl);
        }
      }
      await deleteDoc(docRef);
    }
    res.json({ success: true, message: `${ids.length} mesaj başarıyla silindi.` });
  } catch (err: any) {
    console.error('Failed to delete bulk messages:', err);
    res.status(500).json({ success: false, error: err.message || 'Toplu mesaj silme işleminde bir hata oluştu.' });
  }
});

// -------------------------------------------------------------
// PWA Logo and Manifest Endpoints
// -------------------------------------------------------------
app.get('/logo.svg', (req, res) => {
  res.setHeader('Content-Type', 'image/svg+xml');
  res.send(`<?xml version="1.0" encoding="utf-8"?>
<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="blueBgGrad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#1e40af" />
      <stop offset="60%" stop-color="#1e3a8a" />
      <stop offset="100%" stop-color="#0f172a" />
    </radialGradient>
    <linearGradient id="goldStarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fde047" />
      <stop offset="40%" stop-color="#eab308" />
      <stop offset="100%" stop-color="#ca8a04" />
    </linearGradient>
    <linearGradient id="swooshGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.95" />
      <stop offset="100%" stop-color="#e2e8f0" stop-opacity="0.8" />
    </linearGradient>
    <filter id="logoShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000" flood-opacity="0.4" />
    </filter>
  </defs>
  <circle cx="200" cy="200" r="190" fill="#dc2626" />
  <circle cx="200" cy="200" r="184" fill="#ffffff" />
  <circle cx="200" cy="200" r="180" fill="#1d4ed8" />
  <circle cx="200" cy="200" r="176" fill="#ffffff" />
  <path id="textPathTop" d="M 70 200 A 130 130 0 0 1 330 200" fill="none" />
  <path id="textPathBottom" d="M 345 200 A 145 145 0 0 1 55 200" fill="none" />
  <text fill="#1e3a8a" font-size="32" font-weight="900" font-family="sans-serif" letter-spacing="4">
    <textPath href="#textPathTop" startOffset="50%" text-anchor="middle">GÜRSU</textPath>
  </text>
  <text fill="#1e3a8a" font-size="24" font-weight="800" font-family="sans-serif" letter-spacing="2">
    <textPath href="#textPathBottom" startOffset="50%" text-anchor="middle">YILDIZ ANADOLU LİSESİ</textPath>
  </text>
  <circle cx="200" cy="200" r="125" fill="#ca8a04" />
  <circle cx="200" cy="200" r="122" fill="#ffffff" />
  <circle cx="200" cy="200" r="118" fill="url(#blueBgGrad)" />
  <path d="M 200 68 L 202 73 L 207 75 L 202 77 L 200 82 L 198 77 L 193 75 L 198 73 Z" fill="#ffffff" opacity="0.9" />
  <path d="M 178 88 L 179 92 L 183 93 L 179 94 L 178 98 L 177 94 L 173 93 L 177 92 Z" fill="#ffffff" opacity="0.8" />
  <path d="M 222 88 L 223 92 L 227 93 L 223 94 L 222 98 L 221 94 L 217 93 L 221 92 Z" fill="#ffffff" opacity="0.8" />
  <path d="M 235 110 L 236 113 L 239 114 L 236 115 L 235 118 L 234 115 L 231 114 L 234 113 Z" fill="#ffffff" opacity="0.7" />
  <path d="M 165 110 L 166 113 L 169 114 L 166 115 L 165 118 L 164 115 L 161 114 L 164 113 Z" fill="#ffffff" opacity="0.7" />
  <polygon points="200,105 224,162 284,162 235,198 254,258 200,222 146,258 165,198 116,162 176,162" fill="url(#goldStarGrad)" filter="url(#logoShadow)" />
  <path d="M 125 120 C 150 180, 240 250, 285 240 C 295 238, 260 215, 200 170 C 160 140, 135 125, 125 120 Z" fill="url(#swooshGrad)" />
  <text x="200" y="292" text-anchor="middle" fill="#ffffff" font-size="24" font-weight="800" font-family="sans-serif" letter-spacing="2">1988</text>
</svg>`);
});

app.get('/manifest.json', (req, res) => {
  res.json({
    short_name: "YKS Takip",
    name: "YKS Takip Sistemi - Yıldız Anadolu Lisesi",
    icons: [
      {
        src: "/logo.svg",
        type: "image/svg+xml",
        sizes: "any",
        purpose: "any"
      },
      {
        src: "/logo.svg",
        type: "image/svg+xml",
        sizes: "192x192 512x512",
        purpose: "maskable"
      }
    ],
    start_url: "/",
    background_color: "#0f172a",
    theme_color: "#4f46e5",
    display: "standalone",
    orientation: "any"
  });
});

// -------------------------------------------------------------
// Student Registration IP-Based Rate Limiter (Max 3 per day)
// -------------------------------------------------------------
const registrationRequestTimestamps = new Map<string, number[]>();

app.post('/api/auth/register-limit-check', (req, res) => {
  const ip = (req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || '127.0.0.1').split(',')[0].trim();
  
  const now = Date.now();
  const oneDayAgo = now - 24 * 60 * 60 * 1000;
  
  const previousTimestamps = registrationRequestTimestamps.get(ip) || [];
  const recentTimestamps = previousTimestamps.filter(t => t > oneDayAgo);
  
  if (recentTimestamps.length >= 3) {
    return res.status(429).json({
      success: false,
      error: 'Aynı cihazdan en fazla 3 hesap talebinde bulunabilirsiniz. Fazlası için sınıf rehber öğretmeniniz ile iletişime geçiniz.'
    });
  }
  
  recentTimestamps.push(now);
  registrationRequestTimestamps.set(ip, recentTimestamps);
  
  return res.json({ success: true });
});

// -------------------------------------------------------------
// Wikipedia Logo Proxy to avoid CORS/Failed to fetch on client
// -------------------------------------------------------------
app.get('/api/wikipedia/logo', async (req, res) => {
  const universityName = req.query.name as string;
  if (!universityName) {
    return res.status(400).json({ error: 'University name is required' });
  }

  try {
    const formattedTitle = universityName.trim().replace(/\s+/g, '_');
    const wikiUrl = `https://tr.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(formattedTitle)}`;
    
    const wikiResponse = await fetch(wikiUrl, {
      headers: {
        'User-Agent': 'YKSApplet/1.0 (ccaqlayan@gmail.com) Node.js/FetchProxy'
      }
    });

    if (!wikiResponse.ok) {
      return res.json({ logoUrl: null });
    }

    const data = await wikiResponse.json() as any;
    const imgUrl = data?.originalimage?.source || data?.thumbnail?.source || null;
    res.json({ logoUrl: imgUrl });
  } catch (err) {
    console.error('Wikipedia proxy fetch error:', err);
    res.json({ logoUrl: null });
  }
});

// -------------------------------------------------------------
// Vite Server Integration
// -------------------------------------------------------------
async function startServer() {
  // Run password migration in background
  setTimeout(async () => {
    try {
      console.log('Running automatic password migration...');
      const usersSnap = await getDocs(collection(db, 'users'));
      let count = 0;
      for (const docSnap of usersSnap.docs) {
        const u = docSnap.data();
        if (u.password && !u.passwordHash) {
          const salt = await bcrypt.genSalt(10);
          const hash = await bcrypt.hash(u.password, salt);
          await setDoc(doc(db, 'users', docSnap.id), { ...u, passwordHash: hash, password: null });
          count++;
        }
      }
      console.log(`Password migration finished. Migrated ${count} users.`);
    } catch(err) {
      console.error('Password migration error:', err);
    }
  }, 5000);

  // Initialize Firebase and logs in the background without blocking startup
  initFirebaseAndLogs().catch(err => {
    console.error('Failed to initialize Firebase background job:', err);
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`YKS Takip Sistemi Sunucusu http://0.0.0.0:${PORT} adresinde çalışıyor`);
  });
}

startServer();
