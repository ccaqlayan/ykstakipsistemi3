import path from 'path';
import fs from 'fs';
import { Router } from 'express';
import { GoogleGenAI } from '@google/genai';
import { setDoc, doc } from 'firebase/firestore';
import {
  db,
  PORT,
  isAiEnabledOrRespond,
  featureModelConfig,
  coachDataSettings,
  generateContentWithFallback,
  recordApiUsage,
  apiUsageLogsStore,
  anomalyLimitTRY,
  aiFeaturesEnabled,
  setAiFeaturesEnabled,
  aiCoachChatEnabled,
  setAiCoachChatEnabled,
  setAnomalyLimitTRY,
  setCoachDataSettings,
  setFeatureModelConfig,
  savePromptLogs,
  setSavePromptLogs,
  clearApiUsageLogs,
  uploadsDir,
  getEffectiveGeminiApiKey,
  setCustomGeminiApiKey,
  customGeminiApiKey,
  getEffectiveGroqApiKey,
  setCustomGroqApiKey,
  customGroqApiKey,
  getEffectiveOpenRouterApiKey,
  setCustomOpenRouterApiKey,
  customOpenRouterApiKey,
  getEffectiveCloudflareApiToken,
  setCustomCloudflareApiToken,
  customCloudflareApiToken,
  getEffectiveCloudflareAccountId,
  setCustomCloudflareAccountId,
  customCloudflareAccountId,
  getEffectiveProviderMode,
  setAiProviderMode,
  aiProviderMode,
  fetchLiveGoogleModels,
  mapToActualGeminiModel
} from '../config';
import { executeAiUnifiedRequest, testProviderApiKey } from '../services/aiProviderGateway';

const router = Router();

function formatGeminiErrorMessage(err: any, fallbackText: string): string {
  const msg = err?.message || String(err || '');
  if (msg.includes('free-models-per-day') || (msg.includes('OpenRouter') && msg.includes('429'))) {
    return 'OpenRouter günlük ücretsiz model kotası (50 istek/gün) doldu (429). Lütfen Sistem Yönetimi > Yapay Zeka sayfasından Google Gemini sağlayıcısını seçiniz veya çalışma modunu "Akıllı Otomatik Geçiş (AUTO_FALLBACK)" olarak ayarlayınız.';
  }
  if (msg.includes('Groq') && (msg.includes('429') || msg.includes('rate_limit_exceeded'))) {
    return 'Groq Cloud istek kotası aşıldı (429). Lütfen birkaç saniye sonra tekrar deneyiniz.';
  }
  if (err?.status === 401 || msg.includes('401') || msg.includes('UNAUTHENTICATED') || msg.includes('ACCESS_TOKEN_TYPE_UNSUPPORTED')) {
    return 'Yapay Zeka API Anahtarınız geçersiz veya süresi dolmuş (401). Lütfen Sistem Yönetimi > Yapay Zeka > Model Ayarları bölümünden geçerli bir API anahtarı tanımlayınız.';
  }
  if (err?.status === 429 || msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')) {
    return 'Yapay Zeka API istek kotası aşıldı (429). Lütfen birkaç saniye sonra tekrar deneyiniz veya diğer sağlayıcıya geçiniz.';
  }
  return msg || fallbackText;
}

async function resolveImagePart(imageUrl: string): Promise<{ inlineData: { mimeType: string; data: string } } | null> {
  if (!imageUrl || typeof imageUrl !== 'string') return null;

  // 1. Check for Base64 Data URL (data:image/png;base64,...)
  const matches = imageUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (matches) {
    return {
      inlineData: { mimeType: matches[1], data: matches[2] }
    };
  }

  // 2. Extract clean path without query parameters (?t=...)
  const cleanUrl = imageUrl.split('?')[0];

  // 3. Check local filesystem candidate paths
  let relativePath = cleanUrl;
  if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
    try {
      const parsedUrl = new URL(cleanUrl);
      relativePath = parsedUrl.pathname;
    } catch {}
  }

  const cleanRel = relativePath.replace(/^\/+/, '');
  const candidatePaths = [
    cleanRel,
    path.join(uploadsDir, cleanRel),
    path.join(process.cwd(), 'public', cleanRel),
    path.join(process.cwd(), cleanRel),
  ];

  if (relativePath.includes('/uploads/')) {
    const relSub = relativePath.split('/uploads/')[1];
    if (relSub) {
      candidatePaths.push(
        path.join(uploadsDir, relSub),
        path.join(process.cwd(), 'public', 'uploads', relSub),
        path.join(process.cwd(), 'uploads', relSub)
      );
    }
  }

  for (const cand of candidatePaths) {
    if (cand && fs.existsSync(cand)) {
      try {
        const buffer = fs.readFileSync(cand);
        const ext = path.extname(cand).toLowerCase();
        let mimeType = 'image/jpeg';
        if (ext === '.png') mimeType = 'image/png';
        else if (ext === '.webp') mimeType = 'image/webp';
        else if (ext === '.gif') mimeType = 'image/gif';
        return {
          inlineData: { mimeType, data: buffer.toString('base64') }
        };
      } catch (err) {
        console.error('Error reading local image candidate:', cand, err);
      }
    }
  }

  // 4. Remote HTTP / HTTPS image URL (convert relative path to absolute localhost URL if needed)
  let fullFetchUrl = cleanUrl;
  if (cleanUrl.startsWith('/')) {
    fullFetchUrl = `http://localhost:${PORT}${cleanUrl}`;
  }

  if (fullFetchUrl.startsWith('http://') || fullFetchUrl.startsWith('https://')) {
    try {
      const resp = await fetch(fullFetchUrl);
      if (resp.ok) {
        const arrayBuffer = await resp.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const contentType = resp.headers.get('content-type') || 'image/jpeg';
        return {
          inlineData: { mimeType: contentType.split(';')[0], data: buffer.toString('base64') }
        };
      }
    } catch (err) {
      console.error('Failed to fetch image URL in Gemini route:', err);
    }
  }

  return null;
}

function extractResponseText(response: any): string {
  if (!response) return '';
  if (typeof response.text === 'string' && response.text.trim()) {
    return response.text;
  }
  if (typeof response.text === 'function') {
    try {
      const txt = response.text();
      if (typeof txt === 'string' && txt.trim()) return txt;
    } catch {
      // Fallback
    }
  }
  if (response.candidates?.[0]?.content?.parts) {
    const parts = response.candidates[0].content.parts;
    const textStr = parts.map((p: any) => p.text || '').join('\n').trim();
    if (textStr) return textStr;
  }
  return typeof response === 'string' ? response : JSON.stringify(response);
}

function resolveUserInfo(reqBody: any) {
  const email = reqBody.userEmail || reqBody.profile?.email || reqBody.user?.email || '';
  const rawName = reqBody.userName || reqBody.profile?.name || reqBody.user?.name || reqBody.teacherName || reqBody.studentName || 'Sistem Kullanıcısı';
  const userName = email ? `${rawName} (${email})` : rawName;

  let rawRole = reqBody.userRole || reqBody.profile?.role || reqBody.user?.role || reqBody.role || '';
  let userRole = 'Öğrenci';
  if (rawRole === 'admin' || rawRole.toLowerCase().includes('admin')) {
    userRole = 'Sistem Yöneticisi (Admin)';
  } else if (rawRole === 'school_counselor' || rawRole.toLowerCase().includes('rehber')) {
    userRole = 'Okul Rehber Öğretmeni';
  } else if (rawRole === 'class_teacher' || rawRole.toLowerCase().includes('sınıf')) {
    userRole = 'Sınıf Öğretmeni';
  } else if (rawRole === 'teacher' || rawRole.toLowerCase().includes('öğretmen')) {
    userRole = 'Öğretmen';
  } else if (typeof rawRole === 'string' && rawRole.trim()) {
    userRole = rawRole;
  }

  const userId = reqBody.userId || reqBody.profile?.id || reqBody.user?.id || '';
  return { userName, userRole, userId };
}

function summarizeMocksForPrompt(mocks: any[], limit: number = 3) {
  return (mocks || []).slice(-limit).map(m => ({
    title: m.title || 'Genel Deneme',
    date: m.date,
    tytNet: m.tyt?.totalNet,
    aytNet: m.ayt?.totalNet,
    ydtNet: m.ydt?.net
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

function cleanAndParseJson(raw: string): any {
  let cleaned = (raw || '').trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/```\s*$/, '').trim();
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```[a-zA-Z]*\n?/, '').replace(/\n?```$/, '').trim();
  }
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    try {
      return JSON.parse(cleaned.substring(firstBrace, lastBrace + 1));
    } catch {}
  }
  const firstBracket = cleaned.indexOf('[');
  const lastBracket = cleaned.lastIndexOf(']');
  if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
    try {
      return JSON.parse(cleaned.substring(firstBracket, lastBracket + 1));
    } catch {}
  }
  return JSON.parse(cleaned);
}

function hasAnyAiApiKey(): boolean {
  return Boolean(getEffectiveGeminiApiKey() || getEffectiveGroqApiKey() || getEffectiveOpenRouterApiKey() || getEffectiveCloudflareApiToken());
}

// -------------------------------------------------------------
// Unified AI Endpoints (Gemini -> Groq -> OpenRouter)
// -------------------------------------------------------------

router.post('/coach-advice', async (req, res) => {
  if (!isAiEnabledOrRespond(res)) return;
  if (!hasAnyAiApiKey()) {
    return res.status(400).json({ error: 'Yapay zeka API anahtarı tanımlı değil. Lütfen Sistem Yönetimi > Yapay Zeka sayfasından en az bir API anahtarı (Gemini, Groq veya OpenRouter) girin.' });
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
    earnedBadges,
    motivationStats,
    stressProfile,
    coachDataSettings: customSettings
  } = req.body;

  const settings = customSettings || coachDataSettings;
  const isDilField = profile?.targetField === 'DİL' || profile?.targetField === 'DIL';
  const studentClassName = profile?.className || '';
  const gradeLevel = (() => {
    const trimmed = (studentClassName || '').trim().toUpperCase();
    const numMatch = trimmed.match(/^(9|10|11|12)/);
    if (numMatch) return numMatch[1];
    if (trimmed.includes('9.') || trimmed.startsWith('9')) return '9';
    if (trimmed.includes('10.') || trimmed.startsWith('10')) return '10';
    if (trimmed.includes('11.') || trimmed.startsWith('11')) return '11';
    if (trimmed.includes('12.') || trimmed.startsWith('12') || trimmed.includes('MEZUN')) return '12';
    return '12';
  })();

  const isEarlyHighSchool = gradeLevel === '9' || gradeLevel === '10';
  const isEleventhGrade = gradeLevel === '11';

  try {
    let prompt = '';

    if (isEarlyHighSchool) {
      prompt = `
Sen MEB Türkiye Yüzyılı Maarif Modeli ve lise okul ders başarısı / yazılı sınavları odaklı uzman bir Lise Akademik Koçusun.
Bu öğrenci ${gradeLevel}. Sınıf kademesindedir.
ÖNEMLİ KURAL: Öğrenciye KESİNLİKLE erken YKS stresi, AYT neti veya üniversite sıralama baskısı YÜKLEME.
Öğrencinin birincil akademik hedefleri şunlardır:
1. Okul derslerini (Matematik, Fizik, Kimya, Biyoloji, Türk Dili ve Edebiyatı, Tarih, Coğrafya vb.) derinlemesine kavramak ve MEB temalarını öğrenmek,
2. 1. ve 2. dönem okul yazılı sınavlarından 90+ alarak OBP'sini (Ortaöğretim Başarı Puanı) en üst seviyeye çıkarmak,
3. Düzenli günlük ders çalışma alışkanlığı, ödev tamamlama ve her gün düzenli kitap okuma/paragraf rutini kazanmaktır.
${gradeLevel === '10' ? '4. 11. sınıfa geçerken doğru alan seçimi (Sayısal, Eşit Ağırlık, Sözel, Dil) farkındalığı kazanmaktır.' : ''}

ÖĞRENCİ BİLGİLERİ:
- Öğrenci Adı: ${profile?.name || 'Öğrenci'}
- Okul: ${profile?.highSchool || 'Anadolu Lisesi'}
- Sınıf: ${studentClassName || `${gradeLevel}. Sınıf`} (${gradeLevel}. Sınıf MEB Maarif Modeli)
- Alan İlgisi: ${profile?.targetField || 'SAY'}
`;
    } else if (isEleventhGrade) {
      prompt = `
Sen 11. Sınıf Akademik Başarı ve 1. Aşama (TYT) Temel Ön Hazırlık Koçusun.
Bu öğrenci 11. Sınıf kademesindedir.
Öğrencinin iki temel akademik hedefi vardır:
1. 11. sınıf okul derslerini (Matematik, Fizik, Kimya, Biyoloji veya Edebiyat/Tarih/Coğrafya) eksiksiz öğrenip okul yazılı sınavlarında 90+ alarak OBP ortalamasını korumak (11. sınıf konuları AYT'nin temelini oluşturur),
2. 1. Aşama (TYT) için temel ön hazırlık yapmak (düzenli problem, paragraf rutini ve 9-10. sınıf temel eksiklerini hafif tempoyla toparlamak).

ÖĞRENCİ BİLGİLERİ:
- Öğrenci Adı: ${profile?.name || 'Öğrenci'}
- Okul: ${profile?.highSchool || 'Anadolu Lisesi'}
- Sınıf: ${studentClassName || '11. Sınıf'} (11. Sınıf Lise & TYT Ön Hazırlık)
- Alanı: ${profile?.targetField || 'SAY'}
`;
    } else {
      prompt = `
Sen Türkiye YKS (Yükseköğretim Kurumları Sınavı) derece hazırlık konusunda uzman, motivasyonu yüksek ve analitik bir Rehberlik ve Öğrenci Koçusun.
${isDilField ? 'NOT: Bu öğrenci YKS DİL (YDT) alanındadır. Haftalık reçete ve analizlerinde YDT 80 soru ile TYT dengesine özel odaklan.' : ''}

ÖĞRENCİ BİLGİLERİ:
- Öğrenci Adı: ${profile?.name || 'Öğrenci'}
- Okul: ${profile?.highSchool || 'Anadolu Lisesi'}
- Sınıf: ${studentClassName || '12. Sınıf'}
- Alanı: ${profile?.targetField || 'SAY'} ${isDilField ? `(Yabancı Dil: ${profile?.targetLanguage || 'İngilizce'})` : ''}
- Hedef Üniversite & Bölüm: ${profile?.targetUniversity || ''} ${profile?.targetDepartment || ''}
- Hedef Sıralama: ${profile?.targetRank || 5000}
- Hedef Netler: TYT ${profile?.targetTYTNet || 100} Net, ${isDilField ? `YDT (${profile?.targetLanguage || 'İngilizce'}) ${profile?.targetYDTNet || 75} Net` : `AYT ${profile?.targetAYTNet || 70} Net`}
`;
    }

    if (settings.generalMocks?.enabled !== false && !isEarlyHighSchool) {
      const limit = settings.generalMocks?.limit || 3;
      prompt += `\nSON DENEME NETLERİ:\n${JSON.stringify(summarizeMocksForPrompt(generalMocks, limit))}\n`;
    }

    if (settings.topicErrors?.enabled !== false) {
      const limit = settings.topicErrors?.limit || 8;
      prompt += `\nEKSİK / YANLIŞ YAPILAN KONULAR (HATA TABLOSU):\n${JSON.stringify(summarizeErrorsForPrompt(topicErrors, limit))}\n`;
    }

    if (settings.questionLogs?.enabled !== false) {
      const limit = settings.questionLogs?.limit || 5;
      prompt += `\nSON SORU ÇÖZÜM VERİLERİ:\n${JSON.stringify(summarizeQuestionLogsForPrompt(questionLogs, limit))}\n`;
    }

    if (settings.routines?.enabled !== false) {
      const limit = settings.routines?.limit || 3;
      prompt += `\nSON RUTİN VERİLERİ (KİTAP / PROBLEM / DERS RUTİNLERİ):\n${JSON.stringify(summarizeRoutinesForPrompt(routines, limit))}\n`;
    }

    if (settings.studyPlanSummary?.enabled !== false) {
      prompt += `\nHAFTALIK ÇALIŞMA PLANI ÖZETİ:\n${JSON.stringify(summarizeStudyPlansForPrompt(studyPlans))}\n`;
    }

    if (settings.resourceProgress?.enabled !== false) {
      prompt += `\nKAYNAK TAKİBİ VE ÇÖZÜLME ÖZETİ:\n${JSON.stringify(summarizeResourcesForPrompt(resources))}\n`;
    }

    if (settings.branchExams?.enabled !== false && !isEarlyHighSchool) {
      const limit = settings.branchExams?.limit || 3;
      prompt += `\nSON BRANŞ DENEMELERİ:\n${JSON.stringify(summarizeBranchExamsForPrompt(branchExams, limit))}\n`;
    }

    if (settings.institutionalMocks?.enabled !== false) {
      const limit = settings.institutionalMocks?.limit || 3;
      prompt += `\nSON KURUMSAL / KDS DENEME VE YAZILI SONUÇLARI:\n${JSON.stringify(summarizeInstitutionalMocksForPrompt(institutionalMocks, limit))}\n`;
    }

    if (settings.youtubeTracker?.enabled !== false) {
      prompt += `\nYOUTUBE VİDEO DERS TAKİP ÖZETİ:\n${JSON.stringify(summarizeYoutubeForPrompt(youtubeVideos))}\n`;
    }

    if (settings.pomodoroHistory?.enabled !== false) {
      const limit = settings.pomodoroHistory?.limit || 3;
      prompt += `\nPOMODORO GEÇMİŞİ ÖZETİ:\n${JSON.stringify(summarizePomodoroForPrompt(pomodoroHistory, limit))}\n`;
    }

    if (earnedBadges || motivationStats) {
      const badgeSummary = {
        totalBadgesEarned: (earnedBadges || []).length,
        currentStreakDays: motivationStats?.currentStreak || 0,
        longestStreakDays: motivationStats?.longestStreak || 0,
        badgesList: (earnedBadges || []).map((b: any) => b.key)
      };
      prompt += `\nÖĞRENCİNİN KAZANDIĞI 3D ROZETLER & ÇALIŞMA SERİSİ (MOTİVASYON BİLGİSİ):\n${JSON.stringify(badgeSummary)}\n(Öğrenciyi kazandığı bu rozetler ve çalışma serisi için motive et, tebrik et ve devamlılığını öv.)\n`;
    }

    // Stres/Motivasyon ton yönergesi
    if (stressProfile) {
      const toneGuide: Record<string, string> = {
        calm: 'Öğrenci motivasyonu ve performansı iyi durumda. Analitik, hedefe yönelik ve verimliliğe odaklı bir ton kullan. Performans artışı için somut stratejiler öner.',
        mildly_stressed: 'Öğrenci hafif stres veya yorgunluk yaşıyor olabilir. Önce empati kurarak başla, ardından öneri sun. Yargılayıcı veya baskı oluşturucu bir dil KULLANMA. Küçük kazanımlara dikkat çek.',
        burnt_out: 'Öğrenci ciddi düzeyde yorgun veya tükenmiş görünüyor. Performans baskısından önce psikolojik güvenlik ver. "Bu hissin normal olduğunu" belirt. Çok küçük, başarılabilir tek bir adım öner. Nazik, anlayışlı ve destekleyici ol. Kesinlikle yargılama. Mümkünse kısa mola veya nefes egzersizi önerisi de ekle.',
      };
      const guide = toneGuide[stressProfile.stressLevel] || toneGuide.calm;
      prompt += `\n## ÖĞRENCİNİN DUYGUSAL/MOTİVASYON DURUMU (ZORUNLU KULLANİLA)\nStres Seviyesi: ${stressProfile.stressLevel} (Skor: ${stressProfile.score}/100)\nDurum Özeti: ${stressProfile.summary}\nTON YÖNERGESİ — BU KURALI MUTLAKA UYGULA:\n${guide}\n`;
    }

    if (isEarlyHighSchool) {
      prompt += `
Lütfen bu verileri detaylıca analiz et ve öğrenciye özel Türkçe Lise Okul Dersleri ve Yazılı Hazırlık Koçluk Raporu üret.
Cevabın YALNIZCA geçerli bir JSON objesi olmalıdır. Şeması:
{
  "generalEvaluation": "${gradeLevel}. sınıf düzeyine uygun okul ders başarısı, yazılı sınav hazırlığı ve çalışma disiplini değerlendirmesi (2-3 cümle)",
  "strengths": ["Güçlü olunan 3 lise dersi veya konu alanı"],
  "weakAreas": ["Okul yazılılarında ve derslerde acil toparlanması gereken 2-3 zayıf konu"],
  "actionPlan": ["Bu hafta okul ders başarısını ve yazılı hazırlığını artıracak 4 somut aksiyon adımı"],
  "motivationalQuote": "${gradeLevel}. sınıf lise başarısı ve azim için ilham verici motive edici söz",
  "weeklyPrescription": [
    {
      "subject": "Ders Adı (Örn: Matematik, Fizik, Kimya, Biyoloji, Türk Dili ve Edebiyatı vb.)",
      "targetQuestions": 150,
      "focusTopics": ["Konu 1", "Konu 2"],
      "actionType": "question_solving",
      "description": "Bu hafta bu derste hangi MEB kazanımına odaklanmalı, yazılı sınav için nasıl çalışmalı?",
      "priority": "high"
    }
  ]
}
      `;
    } else if (isEleventhGrade) {
      prompt += `
Lütfen bu verileri detaylıca analiz et ve öğrenciye özel Türkçe 11. Sınıf Akademik Başarı ve 1. Aşama (TYT) Ön Hazırlık Koçluk Raporu üret.
Cevabın YALNIZCA geçerli bir JSON objesi olmalıdır. Şeması:
{
  "generalEvaluation": "11. sınıf okul dersleri, OBP ve 1. Aşama (TYT) ön hazırlık dengesi değerlendirmesi (2-3 cümle)",
  "strengths": ["11. sınıf dersleri ve temel çalışmalarda güçlü olunan 3 alan"],
  "weakAreas": ["Geliştirilmesi gereken 11. sınıf konuları veya TYT ön hazırlık eksikleri"],
  "actionPlan": ["11. sınıf ders başarısı + 1. aşama ön hazırlık için 4 somut aksiyon adımı"],
  "motivationalQuote": "11. sınıf öğrencisi için güçlü bir lise & gelecek motivasyon sözü",
  "weeklyPrescription": [
    {
      "subject": "Ders Adı (Örn: 11. Sınıf Matematik, Fizik, TYT Paragraf/Problem vb.)",
      "targetQuestions": 200,
      "focusTopics": ["Konu 1", "Konu 2"],
      "actionType": "question_solving",
      "description": "11. sınıf yazılı başarısı veya TYT temel ön hazırlığı için haftalık hedef açıklaması",
      "priority": "high"
    }
  ]
}
      `;
    } else {
      prompt += `
Lütfen bu verileri detaylıca analiz et ve öğrenciye özel Türkçe YKS Koçluk Raporu ve Haftalık Çalışma Reçetesi üret.
Cevabın YALNIZCA geçerli bir JSON objesi olmalıdır. Şeması:
{
  "generalEvaluation": "Öğrencinin genel performans ve gidişat değerlendirmesi (2-3 cümle)",
  "strengths": ["Güçlü olunan 3 alan veya ders"],
  "weakAreas": ["Acil geliştirilmesi gereken 2-3 zayıf alan veya soru türü"],
  "actionPlan": ["Bu hafta için 3-4 somut, uygulanabilir ve net odaklı aksiyon önerisi"],
  "motivationalQuote": "İlham verici, güçlü bir YKS motivasyon sözü",
  "weeklyPrescription": [
    {
      "subject": "Ders Adı (Örn: Matematik, Fizik, Türkçe, Biyoloji vb.)",
      "targetQuestions": 200,
      "focusTopics": ["Konu 1", "Konu 2"],
      "actionType": "question_solving",
      "description": "Bu hafta bu derste neye odaklanmalı, kaç soru çözmeli, hangi taktik uygulanmalı?",
      "priority": "high"
    }
  ],
  "targetGapAnalysis": {
    "currentTytNet": 75.5,
    "targetTytNet": 95.0,
    "tytGap": 19.5,
    "currentAytNet": 45.0,
    "targetAytNet": 65.0,
    "aytGap": 20.0,
    "highYieldTopics": [
      {
        "subject": "Ders Adı",
        "topic": "Konu Adı",
        "estimatedNetGain": 2.5,
        "examQuestionCount": 3,
        "reason": "ÖSYM'de düzenli soru çıkan ve öğrencinin hata defterinde eksik görünen bu konunun toparlanması en hızlı net getirecektir."
      }
    ]
  }
}
      `;
    }

    const targetModel = featureModelConfig['AI_COACH_STUDENT'] || 'SYSTEM_DEFAULT';
    const unifiedResult = await executeAiUnifiedRequest({
      prompt,
      requireJson: true,
      featureKey: 'AI_COACH_STUDENT',
      modelOverride: targetModel
    });

    const parsedData = cleanAndParseJson(unifiedResult.text);
    const { userName, userRole, userId } = resolveUserInfo(req.body);

    const usageRecord = recordApiUsage({
      featureKey: 'AI_COACH_STUDENT',
      featureName: 'Öğrenci Bireysel Yapay Zeka Koç Tavsiyesi',
      category: 'AI_COACH',
      provider: unifiedResult.providerUsed,
      modelUsed: unifiedResult.modelUsed,
      promptTokens: unifiedResult.promptTokens || Math.ceil(prompt.length / 4),
      candidatesTokens: unifiedResult.candidatesTokens || Math.ceil(unifiedResult.text.length / 4),
      promptText: prompt,
      responseText: unifiedResult.text,
      userId,
      userName,
      userRole
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
    console.error('Unified AI Coach error:', err);
    res.status(500).json({ error: formatGeminiErrorMessage(err, 'Yapay Zeka koç tavsiyesi üretilemedi.') });
  }
});

router.post('/class-coach-advice', async (req, res) => {
  if (!isAiEnabledOrRespond(res)) return;
  if (!hasAnyAiApiKey()) {
    return res.status(400).json({ error: 'Yapay zeka API anahtarı tanımlı değil. Lütfen Sistem Yönetimi > Yapay Zeka sayfasından en az bir API anahtarı girin.' });
  }

  const { className, studentCount, averageTYTNet, averageAYTNet, totalQuestionsSolved, topStrugglingTopics, studentsSummary } = req.body;

  try {
    const gradeLevel = (() => {
      const trimmed = (className || '').trim().toUpperCase();
      const numMatch = trimmed.match(/^(9|10|11|12)/);
      if (numMatch) return numMatch[1];
      if (trimmed.includes('9.') || trimmed.startsWith('9')) return '9';
      if (trimmed.includes('10.') || trimmed.startsWith('10')) return '10';
      if (trimmed.includes('11.') || trimmed.startsWith('11')) return '11';
      if (trimmed.includes('12.') || trimmed.startsWith('12') || trimmed.includes('MEZUN')) return '12';
      return '12';
    })();

    const isEarlyHighSchool = gradeLevel === '9' || gradeLevel === '10';
    const isEleventhGrade = gradeLevel === '11';

    let prompt = '';
    if (isEarlyHighSchool) {
      prompt = `
Sen MEB Türkiye Yüzyılı Maarif Modeli ve lise başarı/yazılı sınav odaklı lise kademe rehberlik uzmanı ve sınıf koçusun.
Bu sınıf ${gradeLevel}. Sınıf kademesindedir. Müfredat MEB Türkiye Yüzyılı Maarif Modeli beceri ve tema temellidir.
Öğrencilerin birincil akademik odağı: Okul yazılı sınavları (1. ve 2. dönem), OBP (Ortaöğretim Başarı Puanı) kazanımı, temel ders kavramları ve haftalık düzenli çalışma disiplinidir. (Erken YKS kaygısı yerine okul derslerindeki kavrayış ve not ortalaması önceliklidir).

SINIF VERİLERİ VE GENEL PERFORMANS ÖZETİ:
- Sınıf Adı: ${className || `${gradeLevel}-A`} (${gradeLevel}. Sınıf - MEB Maarif Modeli)
- Öğrenci Sayısı: ${studentCount || 0}
- Sınıf Toplam Çözülen Soru Sayısı: ${totalQuestionsSolved || 0}
- Sınıfın En Çok Zorlandığı ve Hata Yaptığı Konular: ${JSON.stringify(topStrugglingTopics || [])}

ÖĞRENCİ BAZLI ÖZET:
${JSON.stringify(studentsSummary || [])}

Lütfen bu ${gradeLevel}. sınıf şubesinin tüm verilerini detaylıca analiz et ve sınıf rehber öğretmenine özel MEB Maarif Modeli ve okul ders başarısı/yazılı hazırlık odaklı bir Türkçe Sınıf Koçluk Raporu ve Ders Bazlı Haftalık Sınıf Etüt Reçetesi üret.
Cevabın YALNIZCA geçerli bir JSON objesi olmalıdır. Şeması:
{
  "generalEvaluation": "${gradeLevel}. sınıf düzeyine uygun akademik gelişim, ders disiplini ve yazılı sınav performansı değerlendirmesi (3-4 cümle)",
  "strengths": ["Sınıfın öne çıkan 3-4 güçlü yönü (konu kavrayışı, yazılı başarısı, etüt katılımı vb.)"],
  "weakAreas": ["Sınıfça acil müdahale edilmesi gereken 2-3 zayıf alan veya konu eksikliği"],
  "weeklyPrescription": [
    {
      "subject": "Ders Adı (Örn: Matematik, Fizik, Türk Dili ve Edebiyatı vb.)",
      "targetQuestions": 150,
      "focusTopics": ["Konu 1", "Konu 2"],
      "description": "Sınıf geneli bu haftalık yazılı hazırlık, MEB kazanım kavrama ve ödev tavsiyesi",
      "priority": "high"
    }
  ],
  "actionPlan": ["Rehber öğretmen için bu haftalık 4 somut sınıf içi aksiyon ve okul dersi pekiştirme önerisi"],
  "motivationalQuote": "${gradeLevel}. sınıf öğrencilerine ve öğretmenlerine ilham verici lise başarı ve motivasyon mesajı"
}
      `;
    } else if (isEleventhGrade) {
      prompt = `
Sen MEB 11. Sınıf İleri Düzey Akademik Program ve YKS Temel Hazırlık/AYT Başlangıç rehberlik uzmanı ve sınıf koçusun.
Bu sınıf 11. Sınıf kademesindedir. Öğrencilerin odağı: 11. sınıf okul dersleri, yazılı sınavları, OBP ve TYT temelini güçlendirip 11. sınıf AYT konularını sağlam öğrenmektir.

SINIF VERİLERİ VE GENEL PERFORMANS ÖZETİ:
- Sınıf Adı: ${className || '11-A'} (11. Sınıf)
- Öğrenci Sayısı: ${studentCount || 0}
- Sınıfın Ortalama TYT Neti: ${averageTYTNet || 0} Net
- Sınıf Toplam Çözülen Soru Sayısı: ${totalQuestionsSolved || 0}
- Sınıfın En Çok Zorlandığı ve Hata Yaptığı Konular: ${JSON.stringify(topStrugglingTopics || [])}

ÖĞRENCİ BAZLI ÖZET:
${JSON.stringify(studentsSummary || [])}

Lütfen bu 11. sınıf şubesinin tüm verilerini analiz et ve sınıf rehber öğretmenine özel 11. sınıf okul başarısı, OBP ve YKS temel atma odaklı bir Türkçe Sınıf Koçluk Raporu ve Ders Bazlı Haftalık Sınıf Etüt Reçetesi üret.
Cevabın YALNIZCA geçerli bir JSON objesi olmalıdır. Şeması:
{
  "generalEvaluation": "11. sınıf düzeyine uygun akademik gelişim, OBP ve YKS hazırlık başlangıcı değerlendirmesi (3-4 cümle)",
  "strengths": ["Sınıfın öne çıkan 3-4 güçlü yönü"],
  "weakAreas": ["Sınıfça acil müdahale edilmesi gereken 2-3 zayıf alan veya konu eksikliği"],
  "weeklyPrescription": [
    {
      "subject": "Ders Adı (Örn: Matematik, Fizik, Kimya vb.)",
      "targetQuestions": 200,
      "focusTopics": ["Konu 1", "Konu 2"],
      "description": "11. sınıf ders başarısı ve TYT/AYT temeli için haftalık hedef",
      "priority": "high"
    }
  ],
  "actionPlan": ["Rehber öğretmen için bu haftalık 4 somut sınıf içi aksiyon ve etüt önerisi"],
  "motivationalQuote": "11. sınıf öğrencilerine ve öğretmenlerine ilham verici güçlü bir motivasyon mesajı"
}
      `;
    } else {
      prompt = `
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

Lütfen bu sınıfın tüm verilerini detaylıca analiz et ve sınıf rehber öğretmenine özel detaylı bir Türkçe YKS Sınıf Koçluk Raporu ve Ders Bazlı Haftalık Sınıf Etüt Reçetesi üret.
Cevabın YALNIZCA geçerli bir JSON objesi olmalıdır. Şeması:
{
  "generalEvaluation": "Sınıfın genel akademik performansı, çalışma temposu ve gidişat değerlendirmesi (3-4 cümle)",
  "strengths": ["Sınıfın öne çıkan 3-4 güçlü yönü"],
  "weakAreas": ["Sınıfça acil müdahale edilmesi gereken 2-3 zayıf alan veya konu eksikliği"],
  "weeklyPrescription": [
    {
      "subject": "Ders Adı (Örn: Matematik, Fizik, Türkçe vb.)",
      "targetQuestions": 250,
      "focusTopics": ["Konu 1", "Konu 2"],
      "description": "Sınıf geneli bu haftalık ödev, etüt ve soru hedefi tavsiyesi",
      "priority": "high"
    }
  ],
  "actionPlan": ["Rehber öğretmen için bu haftalık 4 somut sınıf içi aksiyon ve etüt önerisi"],
  "motivationalQuote": "Sınıfa ve öğretmenine ilham verici güçlü bir YKS motivasyon mesajı"
}
      `;
    }

    const targetModel = featureModelConfig['AI_COACH_CLASS'] || 'SYSTEM_DEFAULT';
    const unifiedResult = await executeAiUnifiedRequest({
      prompt,
      requireJson: true,
      featureKey: 'AI_COACH_CLASS',
      modelOverride: targetModel
    });

    const parsedData = cleanAndParseJson(unifiedResult.text);
    const { userName, userRole, userId } = resolveUserInfo(req.body);

    const usageRecord = recordApiUsage({
      featureKey: 'AI_COACH_CLASS',
      featureName: 'Sınıf / Okul Genel Koç Analizi',
      category: 'AI_COACH',
      provider: unifiedResult.providerUsed,
      modelUsed: unifiedResult.modelUsed,
      promptTokens: unifiedResult.promptTokens || Math.ceil(prompt.length / 4),
      candidatesTokens: unifiedResult.candidatesTokens || Math.ceil(unifiedResult.text.length / 4),
      promptText: prompt,
      responseText: unifiedResult.text,
      userId,
      userName,
      userRole
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
    console.error('Unified Class AI Coach error:', err);
    res.status(500).json({ error: formatGeminiErrorMessage(err, 'Yapay Zeka sınıf koçluk tavsiyesi üretilemedi.') });
  }
});

// ─────────────────────────────────────────────────────────────
// INTERACTIVE AI COACH MENTOR CHAT ENDPOINT
// ─────────────────────────────────────────────────────────────
router.post('/coach-chat', async (req, res) => {
  if (!isAiEnabledOrRespond(res)) return;
  if (!aiCoachChatEnabled) {
    return res.status(403).json({ error: 'Yapay Zeka Koç Canlı Sohbet özelliği sistem yöneticisi tarafından geçici olarak devre dışı bırakılmıştır.' });
  }
  if (!hasAnyAiApiKey()) {
    return res.status(400).json({ error: 'Yapay zeka API anahtarı tanımlı değil. Lütfen Sistem Yönetimi > Yapay Zeka sayfasından bir API anahtarı tanımlayınız.' });
  }

  const {
    message,
    chatHistory = [],
    profile,
    questionLogs,
    generalMocks,
    topicErrors,
    routines,
    branchExams,
    classContext,
    stressProfile
  } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Mesaj boş olamaz.' });
  }

  try {
    const isTeacherMode = !!classContext || req.body.userRole === 'class_teacher' || req.body.userRole === 'school_counselor' || req.body.userRole === 'teacher' || req.body.userRole === 'admin';
    const studentClass = profile?.className || '';
    let contextPrompt = '';

    if (isTeacherMode && classContext) {
      contextPrompt = `
KULLANICI: Öğretmen / Okul Rehberlik Uzmanı
İNCELEME YAPILAN SINIF: ${classContext.className || '12-A SAY'}
- Sınıf Mevcudu: ${classContext.studentCount || 0} Öğrenci
- Sınıf Ortalama TYT Neti: ${classContext.averageTYTNet || 0} Net
- Sınıf Ortalama AYT Neti: ${classContext.averageAYTNet || 0} Net
- Sınıfın En Çok Zorlandığı Ortak Konular: ${JSON.stringify(classContext.topStrugglingTopics || [])}
- Sınıf Öğrenci Detayları: ${JSON.stringify(classContext.studentsSummary || [])}
`;
    } else {
      const isDilField = profile?.targetField === 'DİL' || profile?.targetField === 'DIL';
      let gradeNote = '';
      if (studentClass.startsWith('9') || studentClass.includes('9-')) {
        gradeNote = '- Kademe: 9. Sınıf (Lise 1 - Maarif Modeli). Öğrencinin odağı lise ders başarısı, yazılı sınavlar ve OBP temelidir.';
      } else if (studentClass.startsWith('10') || studentClass.includes('10-')) {
        gradeNote = '- Kademe: 10. Sınıf (Lise 2). Öğrencinin odağı alan seçimi (SAY/EA/SÖZ/DİL) ve yazılı ortalamasıdır.';
      } else if (studentClass.startsWith('11') || studentClass.includes('11-')) {
        gradeNote = '- Kademe: 11. Sınıf (AYT Temeli). Öğrencinin odağı 11. sınıf AYT konuları ve yazılılardır.';
      }

      contextPrompt = `
ÖĞRENCİ PROFİLİ & HEDEFLERİ:
- İsim: ${profile?.name || 'Öğrenci'}
- Sınıf: ${studentClass || '12. Sınıf'}
${gradeNote ? `${gradeNote}\n` : ''}- Alan: ${profile?.targetField || 'SAY'} ${isDilField ? `(Yabancı Dil: ${profile?.targetLanguage || 'İngilizce'})` : ''}
- Hedef: ${profile?.targetUniversity || ''} ${profile?.targetDepartment || ''} (Hedef Sıralama: ${profile?.targetRank || 5000})
- Hedef Netler: TYT ${profile?.targetTYTNet || 100} Net, ${isDilField ? `YDT (${profile?.targetLanguage || 'İngilizce'}) ${profile?.targetYDTNet || 75} Net` : `AYT ${profile?.targetAYTNet || 70} Net`}
`;

      if (generalMocks && generalMocks.length > 0) {
        const recentMocks = generalMocks.slice(-3);
        contextPrompt += `\nSON GENEL DENEMELER:\n${JSON.stringify(recentMocks.map((m: any) => ({
          name: m.examName || m.title,
          tytTotalNet: m.tyt?.totalNet,
          aytTotalNet: isDilField ? undefined : m.ayt?.totalNet,
          ydtNet: isDilField ? (m.ydt?.net ?? 0) : undefined,
          date: m.date
        })))}\n`;
      }

      if (topicErrors && topicErrors.length > 0) {
        const unrevised = topicErrors.filter((e: any) => !e.revised).slice(-6);
        contextPrompt += `\nHATA DEFTERİNDEKİ KRİTİK EKSİK KONULAR:\n${JSON.stringify(unrevised.map((e: any) => ({
          subject: e.subject,
          topic: e.topicName || e.topic,
          errorReason: e.errorReason
        })))}\n`;
      }

      if (questionLogs && questionLogs.length > 0) {
        const totalSolved = questionLogs.reduce((acc: number, q: any) => acc + (q.solvedCount || 0), 0);
        contextPrompt += `\nTOPLAM ÇÖZÜLEN SORU SAYISI: ${totalSolved}\n`;
      }

      // Stres/Motivasyon tonu (sadece öğrenci modunda)
      if (stressProfile && !isTeacherMode) {
        const toneMap: Record<string, string> = {
          calm: 'Analitik ve hedefe yönelik ol. Performans artışı için somut stratejiler öner.',
          mildly_stressed: 'Önce empati kur, sonra öneri sun. Yargılayıcı dil KULLANMA.',
          burnt_out: 'Performans baskısı verme. Psikolojik güvenlik ver, küçük adım öner, nazik ol.',
        };
        const guide = toneMap[stressProfile.stressLevel] || toneMap.calm;
        contextPrompt += `\n## ÖĞRENCİNİN DUYGUSAL DURUMU (ZORUNLU UYGULA)\nStres Seviyesi: ${stressProfile.stressLevel} (Skor: ${stressProfile.score}/100)\nDurum: ${stressProfile.summary}\nTon: ${guide}\n`;
      }
    }

    // Format chat history
    let formattedHistory = '';
    if (Array.isArray(chatHistory) && chatHistory.length > 0) {
      formattedHistory = '\nÖNCEKİ SOHBET GEÇMİŞİ:\n' + chatHistory.slice(-6).map((msg: any) => {
        return `${msg.sender === 'user' ? (isTeacherMode ? 'Öğretmen' : 'Öğrenci') : 'YKS Koçu'}: ${msg.text}`;
      }).join('\n') + '\n';
    }

    const isStudentGrade9or10 = (studentClass.startsWith('9') || studentClass.startsWith('10') || studentClass.includes('9-') || studentClass.includes('10-') || studentClass.includes('9.') || studentClass.includes('10.'));
    const isStudentGrade11 = (studentClass.startsWith('11') || studentClass.includes('11-') || studentClass.includes('11.'));

    let studentPrompt = '';
    if (isStudentGrade9or10) {
      studentPrompt = `
Sen MEB Türkiye Yüzyılı Maarif Modeli lise okul ders başarısı, 1. ve 2. dönem yazılı sınavları ve OBP hazırlığı konusunda uzman, cana yakın, motive edici, sabırlı ve tecrübeli bir Lise Akademik Koçu ve Mentorüsün.
Karşındaki öğrenci ${studentClass || 'Lise'} kademesindedir.

${contextPrompt}
${formattedHistory}
ÖĞRENCİNİN YENİ MESAJI:
"${message}"

KESİN VE TAVİZSİZ KOÇLUK KURALLARI (ÇOK ÖNEMLİ):
1. ÖĞRENCİYE ASLA ERKEN YKS BASKISI VEYA AYT NET STRESİ YÜKLEME.
2. Öğrencinin asıl hedefi: Okul derslerini (Matematik, Fizik, Kimya, Biyoloji, Türk Dili ve Edebiyatı, Tarih, Coğrafya vb.) çok iyi öğrenmek, yazılı sınavlardan 90+ alarak OBP'sini (Ortaöğretim Başarı Puanı) en yüksekte tutmak, ödevlerini düzenli yapmak ve her gün düzenli kitap/paragraf okumaktır. (10. sınıfta ise ayrıca 11. sınıfa geçerken alan seçimi farkındalığı sağla).
3. Ders dışı gereksiz sohbetlere girmeden öğrenciyi okul derslerine, yazılı sınav ipuçlarına ve düzenli çalışma rutinlerine motive et.
4. Samimi, enerjik, yapıcı ve profesyonel bir Türkçe kullan. Zengin ve okunabilir Markdown formatında yanıt ver.
`;
    } else if (isStudentGrade11) {
      studentPrompt = `
Sen 11. Sınıf Akademik Başarı ve 1. Aşama (TYT) Temel Ön Hazırlık Koçusun.
Karşındaki öğrenci 11. Sınıftadır.

${contextPrompt}
${formattedHistory}
ÖĞRENCİNİN YENİ MESAJI:
"${message}"

KESİN VE TAVİZSİZ KOÇLUK KURALLARI (ÇOK ÖNEMLİ):
1. 11. sınıf okul dersleri başarısı ve yazılı sınavlar (OBP) birinci önceliktir çünkü 11. sınıf konuları AYT'nin belkemiğidir.
2. Aynı zamanda 1. Aşama (TYT) için temel ön hazırlık desteği ver (düzenli problem, paragraf rutini, 9-10 eksiklerini hafif tempoyla tamamlama).
3. Erken AYT paniği yerine 11. sınıf konularını sağlam öğrenmesini sağla.
4. Samimi, enerjik, yapıcı ve profesyonel bir Türkçe kullan. Zengin ve okunabilir Markdown formatında yanıt ver.
`;
    } else {
      studentPrompt = `
Sen Türkiye YKS (${profile?.targetField === 'DİL' || profile?.targetField === 'DIL' ? 'TYT ve YDT Yabancı Dil' : 'TYT ve AYT'}) sınavına hazırlanan öğrencilere rehberlik eden, cana yakın, son derece motive edici, analitik, taktiksel, tavizsiz ve tecrübeli bir Yapay Zeka YKS Öğrenci Koçu ve Mentorüsün.

${contextPrompt}
${formattedHistory}
ÖĞRENCİNİN YENİ MESAJI:
"${message}"

KESİN VE TAVİZSİZ KOÇLUK KURALLARI (ÇOK ÖNEMLİ):
1. KOÇLUK VE MENTORLUK KİMLİĞİNDEN NE OLURSA OLSUN ASLA ÇIKMA.
2. DERS VE YKS DIŞI MUHABBETLERE KESİNLİKLE GİRME / KATILMA.
3. LAFI VE ODAĞI DERHAL VE AKILLICA DERSLERE GETİR.
4. ÖĞRENCİYİ DERSE MOTİVE EDECEK SOMUT VE ETKİLİ YÖNTEMLER DENE (Pomodoro, soru kotası, hedef hatırlatma).
5. Samimi, enerjik, kararlı, yapıcı ve profesyonel bir Türkçe kullan. Zengin ve okunabilir Markdown formatında metin döndür.
`;
    }

    const prompt = isTeacherMode ? `
Sen Türkiye YKS hazırlık süreçlerinde uzman, zeki, analitik ve pedagojik vizyonu yüksek bir YKS Sınıf Rehberliği ve Okul Koçluk Danışmanısın.
Karşındaki kişi bir Sınıf Rehber Öğretmeni / Okul Rehberlik Uzmanıdır ve seçili sınıf (${classContext?.className || '12-A SAY'}) hakkında senden pedagojik, akademik ve etüt planlama tavsiyesi almaktadır.

${contextPrompt}
${formattedHistory}
ÖĞRETMENİN YENİ MESAJI:
"${message}"

GÖREVİN VE YANIT KURALLARIN:
1. Öğretmenin seçili sınıfa ait akademik gidişat, etüt açılması gereken konular, sınıf motivasyonu, seviye gruplaması ve rehberlik taktikleri konusundaki sorusuna net, analitik, uygulanabilir ve profesyonel çözümler sun.
2. Sınıfın ortak hata konuları ve deneme net ortalamaları üzerinden nokta atışı öneriler ver.
3. Samimi, saygılı, mesleki dayanışma içeren yapıcı bir üslup kullan. Yanıtını zengin, okunaklı Markdown formatında döndür.
` : studentPrompt;

    const targetModel = featureModelConfig['AI_COACH_CHAT'] || featureModelConfig['AI_COACH_STUDENT'] || 'SYSTEM_DEFAULT';
    const unifiedResult = await executeAiUnifiedRequest({
      prompt,
      requireJson: false,
      featureKey: 'AI_COACH_CHAT',
      modelOverride: targetModel
    });

    const { userName, userRole, userId } = resolveUserInfo(req.body);

    const usageRecord = recordApiUsage({
      featureKey: 'AI_COACH_CHAT',
      featureName: 'Yapay Zeka Koç Canlı Sohbet',
      category: 'AI_COACH',
      provider: unifiedResult.providerUsed,
      modelUsed: unifiedResult.modelUsed,
      promptTokens: unifiedResult.promptTokens || Math.ceil(prompt.length / 4),
      candidatesTokens: unifiedResult.candidatesTokens || Math.ceil(unifiedResult.text.length / 4),
      promptText: prompt,
      responseText: unifiedResult.text,
      userId,
      userName,
      userRole
    });

    res.json({
      success: true,
      reply: unifiedResult.text,
      aiUsage: usageRecord
    });
  } catch (err: any) {
    console.error('AI Coach Chat error:', err);
    res.status(500).json({ error: formatGeminiErrorMessage(err, 'Yapay Zeka Koç yanıtı oluşturulamadı.') });
  }
});

router.post('/analyze-error-priority', async (req, res) => {
  if (!isAiEnabledOrRespond(res)) return;
  if (!hasAnyAiApiKey()) {
    return res.status(400).json({ error: 'Yapay zeka API anahtarı tanımlı değil.' });
  }

  const { subject, topicName, errorReason, solutionNotes, publisher } = req.body;

  try {
    const prompt = `YKS Koçusun. Verilen deneme hatasını teşhis et ve 1-10 arası öncelik puanı ("rating") belirle.

Ders: ${subject || '-'} | Konu: ${topicName || '-'} | Yayın: ${publisher || '-'} | Hata Nedeni: ${errorReason || '-'} | Çözüm Notu: ${solutionNotes || '-'}

KURALLAR:
1. "analysis" metnine başlık/etiket kesinlikle ekleme (doğrudan metni yaz).
2. İlk cümlede bu konudan YKS'de (TYT/AYT) her yıl ortalama kaç soru çıktığını belirt.
3. Ardından hata nedeni ve konuya göre 1-2 cümlelik net ve yapıcı hata teşhisi yaz.
4. Çıkma sıklığı ve hata türüne göre 1-10 arası "rating" ver (10: kritik, 1: düşük).

JSON:
{
  "rating": 8,
  "analysis": "Bu konudan YKS'de her yıl ortalama 2 soru çıkmaktadır. ..."
}`;

    const targetModel = featureModelConfig['ERROR_PRIORITY'] || 'SYSTEM_DEFAULT';
    const unifiedResult = await executeAiUnifiedRequest({
      prompt,
      requireJson: true,
      featureKey: 'ERROR_PRIORITY',
      modelOverride: targetModel
    });

    const parsedData = cleanAndParseJson(unifiedResult.text);
    const { userName, userRole, userId } = resolveUserInfo(req.body);

    const usageRecord = recordApiUsage({
      featureKey: 'ERROR_PRIORITY',
      featureName: 'Öncelikli Hata Konuları Analizi',
      category: 'QUESTION_ANALYSIS',
      provider: unifiedResult.providerUsed,
      modelUsed: unifiedResult.modelUsed,
      promptTokens: unifiedResult.promptTokens || Math.ceil(prompt.length / 4),
      candidatesTokens: unifiedResult.candidatesTokens || Math.ceil(unifiedResult.text.length / 4),
      promptText: prompt,
      responseText: unifiedResult.text,
      userId,
      userName,
      userRole
    });

    const parsedRating = parseInt(parsedData.rating, 10);
    const finalRating = isNaN(parsedRating) ? 7 : Math.min(10, Math.max(1, parsedRating));

    let cleanAnalysis = (parsedData.analysis || 'Konu önemi ve hata nedeni analiz edildi.').trim();
    cleanAnalysis = cleanAnalysis.replace(/^(?:🔍\s*)?(?:\*\*)?Hata Teşhisi:?(?:\*\*)?\s*/i, '').trim();

    res.json({
      success: true,
      rating: finalRating,
      analysis: cleanAnalysis,
      aiUsage: usageRecord
    });
  } catch (err: any) {
    console.error('Unified error priority analyzer error:', err);
    res.status(500).json({ error: formatGeminiErrorMessage(err, 'Yapay zeka öncelik analizi yapılamadı.') });
  }
});

router.post('/topic-mistake-tips', async (req, res) => {
  if (!isAiEnabledOrRespond(res)) return;
  if (!hasAnyAiApiKey()) {
    return res.status(400).json({ error: 'Yapay zeka API anahtarı tanımlı değil.' });
  }

  const { subject, topicName } = req.body;
  if (!subject || !topicName) {
    return res.status(400).json({ error: 'Ders ve konu adı gereklidir.' });
  }

  try {
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

    const targetModel = featureModelConfig['TOPIC_TIPS'] || 'SYSTEM_DEFAULT';
    const unifiedResult = await executeAiUnifiedRequest({
      prompt,
      requireJson: true,
      featureKey: 'TOPIC_TIPS',
      modelOverride: targetModel
    });

    const parsedData = cleanAndParseJson(unifiedResult.text);
    const { userName, userRole, userId } = resolveUserInfo(req.body);

    const usageRecord = recordApiUsage({
      featureKey: 'TOPIC_TIPS',
      featureName: 'Konu Bazlı Pratik Taktikler',
      category: 'QUESTION_ANALYSIS',
      provider: unifiedResult.providerUsed,
      modelUsed: unifiedResult.modelUsed,
      promptTokens: unifiedResult.promptTokens || Math.ceil(prompt.length / 4),
      candidatesTokens: unifiedResult.candidatesTokens || Math.ceil(unifiedResult.text.length / 4),
      promptText: prompt,
      responseText: unifiedResult.text,
      userId,
      userName,
      userRole
    });

    res.json({
      success: true,
      mistakes: parsedData.mistakes || [],
      tips: parsedData.tips || [],
      summary: parsedData.summary || 'Bu konuda bol bol soru çözerek pratik yapmalısın!',
      aiUsage: usageRecord
    });
  } catch (err: any) {
    console.error('Unified mistake tips error:', err);
    res.status(500).json({ error: formatGeminiErrorMessage(err, 'Yapay zeka konu ipuçları üretilemedi.') });
  }
});

router.post('/solve-question', async (req, res) => {
  if (!isAiEnabledOrRespond(res)) return;
  if (!hasAnyAiApiKey()) {
    return res.status(400).json({ error: 'Yapay zeka API anahtarı tanımlı değil.' });
  }

  const { imageUrl, solutionText, existingAnalysis, subject, topicName } = req.body;
  if (!imageUrl && !solutionText && !existingAnalysis) {
    return res.status(400).json({ error: 'Soru görseli veya önceden çözülmüş soru metni gereklidir.' });
  }

  try {
    const imagePart = imageUrl ? await resolveImagePart(imageUrl) : null;
    let promptText = '';

    if (imagePart || imageUrl) {
      promptText = `Sen Türkiye YKS (TYT-AYT) sınavlarında öğrencilere soru çözen kıdemli ve uzman bir matematik/fen öğretmenisin.
Görseldeki soruyu dikkatle incele (Ders: ${subject || 'YKS'}, Konu: ${topicName || 'Genel'}).
Öğrencinin konuyu tam olarak kavramasını sağlayacak açık, anlaşılır ve hatasız bir çözüm sun.

KURALLAR VE ÇÖZÜM DÜZENİ:
1. Görseldeki Soruyu Oku:
   - Soru kökünü, tüm sayıları, denklemleri, sembolleri ve seçenekleri (A, B, C, D, E) dikkatle incele.
   - Sadece görselde yer alan gerçek sayı ve sembolleri kullan.

2. Adım Adım İşlemsel Çözüm:
   - Doğrudan matematiksel/fiziksel işlemleri yap, genel geçer veya teorik tavsiyeler yazma.
   - Soruda durumlar varsa (örneğin mutlak değer veya parçalı fonksiyon için 1. Durum, 2. Durum vb.) her durumu ayrı başlık altında incele.
   - Tüm ara işlem basamaklarını ve bulunan kökleri/değerleri satır satır yaz.
   - Soruda istenen nihai işlemi (kökler toplamı, en büyük/en küçük değer, oran vb.) açıkça hesapla.
   - Tüm formülleri ve matematiksel sembolleri LaTeX ($...$ veya $$...$$) formatında yaz.

3. Doğru Cevap:
   - Bulduğun sonucu seçeneklerle (A, B, C, D, E) karşılaştır ve doğru seçeneği belirt:
   **Doğru Cevap: [Harf] ([Değer])**

4. İpucu:
   - Bu soru tipinde dikkat edilmesi gereken önemli bir püf noktasını kısaca belirt.

Doğrudan çözüme başla, selamlama veya giriş cümlesi yazma.`;
    } else {
      promptText = `Sen Türkiye YKS (TYT-AYT) sınavlarında öğrencilere soru çözen kıdemli ve uzman bir matematik/fen öğretmenisin.
Aşağıdaki soru metnini dikkatle incele (Ders: ${subject || 'YKS'}, Konu: ${topicName || 'Genel'}):
---
${solutionText || existingAnalysis}
---
Öğrencinin konuyu tam olarak kavramasını sağlayacak açık, anlaşılır ve hatasız bir adım adım çözüm sun.

KURALLAR VE ÇÖZÜM DÜZENİ:
1. Adım Adım İşlemsel Çözüm:
   - Doğrudan matematiksel/fiziksel işlemleri yap.
   - Durumları (1. Durum, 2. Durum vb.) ayrı başlıklar altında incele.
   - Tüm ara işlem basamaklarını ve bulunan kökleri/değerleri satır satır yaz.
   - Soruda istenen nihai işlemi açıkça hesapla.
   - Tüm formülleri ve matematiksel sembolleri LaTeX ($...$ veya $$...$$) formatında yaz.

2. Doğru Cevap:
   - Bulduğun sonucu ve doğru seçeneği belirt:
   **Doğru Cevap: [Harf] ([Değer])**

3. İpucu:
   - Bu soru tipinde dikkat edilmesi gereken önemli bir püf noktasını kısaca belirt.

Doğrudan çözüme başla, selamlama veya giriş cümlesi yazma.`;
    }

    const targetModel = featureModelConfig['SOLVE_QUESTION'] || 'SYSTEM_DEFAULT';
    const unifiedResult = await executeAiUnifiedRequest({
      prompt: promptText,
      imagePart: imagePart || undefined,
      imageUrl: (imageUrl || '').startsWith('data:image') || (imageUrl || '').startsWith('http') ? imageUrl : undefined,
      featureKey: 'SOLVE_QUESTION',
      modelOverride: targetModel
    });

    const responseText = unifiedResult.text;
    const { userName, userRole, userId } = resolveUserInfo(req.body);

    const promptSummary = solutionText || existingAnalysis || `Hata Defteri Soru Görsel Çözüm Analizi (${subject || ''} - ${topicName || ''})`;
    const usageRecord = recordApiUsage({
      featureKey: 'SOLVE_QUESTION',
      featureName: 'Hata Defteri Soru Çözümü',
      category: 'QUESTION_ANALYSIS',
      provider: unifiedResult.providerUsed,
      modelUsed: unifiedResult.modelUsed,
      promptTokens: unifiedResult.promptTokens || 2000,
      candidatesTokens: unifiedResult.candidatesTokens || Math.ceil(responseText.length / 4),
      promptText: promptSummary,
      responseText,
      userId,
      userName,
      userRole
    });

    res.json({
      success: true,
      solution: responseText || 'Soru çözümü üretilemedi.',
      aiUsage: usageRecord
    });
  } catch (err: any) {
    console.error('Unified question solver error:', err);
    res.status(500).json({ error: formatGeminiErrorMessage(err, 'Yapay zeka soru çözümü üretilemedi.') });
  }
});

router.post('/similar-questions', async (req, res) => {
  if (!isAiEnabledOrRespond(res)) return;
  if (!hasAnyAiApiKey()) {
    return res.status(400).json({ error: 'Yapay zeka API anahtarı tanımlı değil.' });
  }

  const { imageUrl, solutionText, existingAnalysis, subject, topicName } = req.body;
  if (!imageUrl && !solutionText && !existingAnalysis) {
    return res.status(400).json({ error: 'Soru görseli veya önceden çözülmüş soru metni gereklidir.' });
  }

  try {
    const imagePart = imageUrl ? await resolveImagePart(imageUrl) : null;
    let promptText = '';

    if (solutionText || existingAnalysis) {
      promptText = `Sen Türkiye YKS (Yükseköğretim Kurumları Sınavı) hazırlık sürecindeki öğrencilere rehberlik eden ve soru üreten uzman bir öğretmenisin.
Öğrencinin daha önce çözülmüş/analiz edilmiş sorusu aşağıdaki gibidir:
---
Ders: ${subject || ''}
Konu: ${topicName || ''}
Önceki Soru Çözümü / Detayı:
${solutionText || existingAnalysis}
---
Yapay zeka hafızandaki bu soruya ve konusuna (${subject} - ${topicName}) benzer tarzda, öğrencinin konuyu pekiştirmesini ve mantığını kavramasını sağlayacak SADECE 1 (BİR) tane kaliteli, yeni benzer soru üret.

Yanıtını YALNIZCA geçerli bir JSON objesi olarak dön:
{
  "question": "Soru metni ve A, B, C, D, E şıkları",
  "solution": "Adım adım detaylı Türkçe çözüm",
  "correctAnswer": "Doğru seçenek (örn: C seçeneğidir)"
}

ÖNEMLİ MATEMATİKSEL BİÇİMLENDİRME KURALLARI:
- Soruda, şıklarda ve çözümde geçen TÜM matematiksel/fiziksel ifadeleri, fonksiyon tanımlarını (örn: $f(x) = 2x^3 - 9x^2 + 12x - 1$), aralıkları (örn: $[0, 3]$), denklemleri (örn: $x = 1$, $f'(x) = 0$), kesirleri (örn: $\\frac{a}{b}$), köklü ifadeleri (örn: $\\sqrt{x}$) ve şıkları KESİNLİKLE dolar işareti arasına alarak ($...$) standart LaTeX formatında yaz.`;
    } else {
      if (!imagePart && !imageUrl) {
        return res.status(400).json({ error: 'Görsel dosyasına ulaşılamadı veya format geçersiz.' });
      }

      promptText = `Sen Türkiye YKS (Yükseköğretim Kurumları Sınavı) hazırlık sürecindeki öğrencilere rehberlik eden ve soru üreten uzman bir öğretmenisin.
Görseldeki soruyu ve konuyu (${subject} - ${topicName}) incele.
Bu soruya benzer tarzda, öğrencinin konuyu pekiştirmesini ve mantığını kavramasını sağlayacak SADECE 1 (BİR) tane kaliteli, yeni benzer soru üret.

Yanıtını YALNIZCA geçerli bir JSON objesi olarak dön:
{
  "question": "Soru metni ve A, B, C, D, E şıkları",
  "solution": "Adım adım detaylı Türkçe çözüm",
  "correctAnswer": "Doğru seçenek (örn: C seçeneğidir)"
}

ÖNEMLİ MATEMATİKSEL BİÇİMLENDİRME KURALLARI:
- Soruda, şıklarda ve çözümde geçen TÜM matematiksel/fiziksel ifadeleri, fonksiyon tanımlarını (örn: $f(x) = 2x^3 - 9x^2 + 12x - 1$), aralıkları (örn: $[0, 3]$), denklemleri (örn: $x = 1$, $f'(x) = 0$), kesirleri (örn: $\\frac{a}{b}$), köklü ifadeleri (örn: $\\sqrt{x}$) ve şıkları KESİNLİKLE dolar işareti arasına alarak ($...$) standart LaTeX formatında yaz.`;
    }

    const targetModel = featureModelConfig['SIMILAR_QUESTION'] || 'SYSTEM_DEFAULT';
    const unifiedResult = await executeAiUnifiedRequest({
      prompt: promptText,
      imagePart: imagePart || undefined,
      imageUrl: (imageUrl || '').startsWith('data:image') || (imageUrl || '').startsWith('http') ? imageUrl : undefined,
      requireJson: true,
      featureKey: 'SIMILAR_QUESTION',
      modelOverride: targetModel
    });

    const parsedData = cleanAndParseJson(unifiedResult.text);
    const { userName, userRole, userId } = resolveUserInfo(req.body);

    const promptSummary = solutionText || existingAnalysis || `Benzer Soru Üretimi Promptu (${subject || ''} - ${topicName || ''})`;
    const usageRecord = recordApiUsage({
      featureKey: 'SIMILAR_QUESTION',
      featureName: 'Benzer Soru Üretimi',
      category: 'QUESTION_ANALYSIS',
      provider: unifiedResult.providerUsed,
      modelUsed: unifiedResult.modelUsed,
      promptTokens: unifiedResult.promptTokens || 1800,
      candidatesTokens: unifiedResult.candidatesTokens || Math.ceil(unifiedResult.text.length / 4),
      promptText: promptSummary,
      responseText: unifiedResult.text,
      userId,
      userName,
      userRole
    });

    res.json({
      success: true,
      similarQuestions: parsedData,
      aiUsage: usageRecord
    });
  } catch (err: any) {
    console.error('Unified similar questions error:', err);
    res.status(500).json({ error: formatGeminiErrorMessage(err, 'Yapay zeka benzer sorular üretemedi.') });
  }
});

router.post('/analyze-question-details', async (req, res) => {
  if (!isAiEnabledOrRespond(res)) return;
  if (!hasAnyAiApiKey()) {
    return res.status(400).json({ error: 'Yapay zeka API anahtarı tanımlı değil.' });
  }

  const { imageUrl, solutionText, existingAnalysis, subject, topicName } = req.body;
  if (!imageUrl && !solutionText && !existingAnalysis) {
    return res.status(400).json({ error: 'Soru görseli veya önceden çözülmüş soru metni gereklidir.' });
  }

  try {
    const imagePart = imageUrl ? await resolveImagePart(imageUrl) : null;
    let promptText = '';

    if (solutionText || existingAnalysis) {
      promptText = `Sen Türkiye YKS (Yükseköğretim Kurumları Sınavı) hazırlık sürecindeki öğrencilere rehberlik eden uzman bir öğretmen ve soru analistisin.
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
| **Çeldirici Analizi** | |
| **A Şıkkı Çeldiricisi** | [A şıkkı çeldirici analizi] |
| **B Şıkkı Çeldiricisi** | [B şıkkı çeldirici analizi] |
| **C Şıkkı Çeldiricisi** | [C şıkkı çeldirici analizi] |
| **D Şıkkı Çeldiricisi** | [D şıkkı çeldirici analizi] |
| **E Şıkkı Çeldiricisi** | [E şıkkı çeldirici analizi] |

ÖNEMLİ KURALLAR:
- Çeldirici Analizi Kuralı: Soruda şıklar (A, B, C, D, E) varsa TÜM şıkların ayrı ayrı çeldirici analizini yap. Eğer soruda şık yoksa "Olası Hatalı Yaklaşımlar / Hatalı Cevaplar" analizi yap.
- Matematiksel/fiziksel ifadelerde standart LaTeX ($...$) veya net semboller kullanabilirsin.
- Tablonun Markdown sözdizimini bozacak karakterler kullanmaktan kaçın.`;
    } else {
      if (!imagePart && !imageUrl) {
        return res.status(400).json({ error: 'Görsel dosyasına ulaşılamadı veya format geçersiz.' });
      }

      promptText = `Sen Türkiye YKS (Yükseköğretim Kurumları Sınavı) hazırlık sürecindeki öğrencilere rehberlik eden uzman bir öğretmen ve soru analistiysen.
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
| **Çeldirici Analizi** | |
| **A Şıkkı Çeldiricisi** | [A şıkkı çeldirici analizi] |
| **B Şıkkı Çeldiricisi** | [B şıkkı çeldirici analizi] |
| **C Şıkkı Çeldiricisi** | [C şıkkı çeldirici analizi] |
| **D Şıkkı Çeldiricisi** | [D şıkkı çeldirici analizi] |
| **E Şıkkı Çeldiricisi** | [E şıkkı çeldirici analizi] |

ÖNEMLİ KURALLAR:
- Çeldirici Analizi Kuralı: Soruda şıklar (A, B, C, D, E) varsa TÜM şıkların ayrı ayrı çeldirici analizini yap. Eğer soruda şık yoksa "Olası Hatalı Yaklaşımlar / Hatalı Cevaplar" analizi yap.
- Matematiksel/fiziksel ifadelerde standart LaTeX ($...$) veya net semboller kullanabilirsin.
- Tablonun Markdown sözdizimini bozacak karakterler kullanmaktan kaçın.`;
    }

    const targetModel = featureModelConfig['QUESTION_ANALYSIS'] || 'SYSTEM_DEFAULT';
    const unifiedResult = await executeAiUnifiedRequest({
      prompt: promptText,
      imagePart: imagePart || undefined,
      imageUrl: (imageUrl || '').startsWith('data:image') || (imageUrl || '').startsWith('http') ? imageUrl : undefined,
      featureKey: 'QUESTION_ANALYSIS',
      modelOverride: targetModel
    });

    const responseText = unifiedResult.text;
    const { userName, userRole, userId } = resolveUserInfo(req.body);

    const promptSummary = solutionText || existingAnalysis || `Detaylı Soru & Çeldirici Analizi Promptu (${subject || ''} - ${topicName || ''})`;
    const usageRecord = recordApiUsage({
      featureKey: 'QUESTION_ANALYSIS',
      featureName: 'Detaylı Soru & Çeldirici Analizi',
      category: 'QUESTION_ANALYSIS',
      provider: unifiedResult.providerUsed,
      modelUsed: unifiedResult.modelUsed,
      promptTokens: unifiedResult.promptTokens || 2100,
      candidatesTokens: unifiedResult.candidatesTokens || Math.ceil(responseText.length / 4),
      promptText: promptSummary,
      responseText,
      userId,
      userName,
      userRole
    });

    res.json({
      success: true,
      analysis: responseText || 'Soru analizi yapılamadı.',
      aiUsage: usageRecord
    });
  } catch (err: any) {
    console.error('Unified question analysis error:', err);
    res.status(500).json({ error: formatGeminiErrorMessage(err, 'Yapay zeka soru analizi üretilemedi.') });
  }
});

router.post('/analyze-photo-question-full', async (req, res) => {
  if (!isAiEnabledOrRespond(res)) return;
  if (!hasAnyAiApiKey()) {
    return res.status(400).json({ error: 'Yapay zeka API anahtarı tanımlı değil. Lütfen Sistem Yönetimi > Yapay Zeka sayfasından en az bir API anahtarı giriniz.' });
  }

  const { imageUrl, solutionText, existingAnalysis, subject, topicName } = req.body;
  if (!imageUrl && !solutionText && !existingAnalysis) {
    return res.status(400).json({ error: 'Soru görseli veya önceden çözülmüş soru metni gereklidir.' });
  }

  try {
    const imagePart = imageUrl ? await resolveImagePart(imageUrl) : null;
    if (!imagePart && !solutionText && !existingAnalysis && !imageUrl) {
      return res.status(400).json({ error: 'Görsel dosyasına ulaşılamadı veya format geçersiz.' });
    }

    const textPrompt = `Sen Türkiye YKS (TYT-AYT) sınavlarına öğrenci hazırlayan kıdemli bir branş öğretmeni ve soru analistisin.
Görseldeki soruyu (Ders: ${subject || 'YKS'}, Konu: ${topicName || 'Genel'}) dikkatle incele ve yanıtını YALNIZCA geçerli bir JSON nesnesi olarak döndür.

KURALLAR:
1. Soru Çözümü (solution):
   - Görseldeki soru metnini, verilen tüm sayıları, denklemleri ve seçenekleri dikkatle incele.
   - Sadece görseldeki gerçek sayı ve ifadelerle işlem yap.
   - Varsa durumları (1. Durum, 2. Durum vb.) ve tüm ara basamakları satır satır yaz.
   - Tüm formülleri standart LaTeX ($...$) formatında yaz.
   - Çözümün sonunda "Doğru Cevap: [Harf] ([Değer])" ve "İpucu: [Püf noktası]" bölümlerini ekle.

2. Doğru Seçenek (correctAnswerLetter):
   - Bulduğun nihai sonuç görseldeki seçeneklerden hangisiyle eşleşiyorsa yalnızca o harfi yaz (A, B, C, D veya E).

3. Soru Analiz Karnesi (analysis):
   - Markdown tablosu formatında MEB kazanımı, tahmini zorluk ve seçeneklerin çeldirici analizini oluştur.

4. 2 Adet Özgün Benzer Soru (similarQuestions):
   - Aynı konuyu ölçen, farklı sayılar içeren 2 adet özgün soru, 5 şık ve adım adım çözümlerini hazırla.

JSON ŞEMASI:
{
  "solution": "1. Durum:\\n[Tüm işlemler]\\n\\n2. Durum:\\n[Tüm işlemler]\\n\\nDoğru Cevap: [Şık] ([Değer])\\n\\nİpucu: [Püf noktası]",
  "correctAnswerLetter": "A",
  "analysis": "**SORU ANALİZİ**\\n\\n| Kriter | Değerlendirme |\\n| :--- | :--- |\\n| **Ders** | ${subject || 'YKS'} |\\n| **Konu** | ${topicName || 'Genel'} |\\n| **Kazanım** | [Kazanım] |\\n| **Zorluk** | [Zorluk] |\\n| **Çeldirici Analizi** | [Şıkların analizi] |",
  "similarQuestions": [
    {
      "question": "Özgün soru metni...",
      "options": ["A) ...", "B) ...", "C) ...", "D) ...", "E) ..."],
      "solution": "Adım adım çözüm...",
      "correctAnswer": "A"
    },
    {
      "question": "Özgün soru metni...",
      "options": ["A) ...", "B) ...", "C) ...", "D) ...", "E) ..."],
      "solution": "Adım adım çözüm...",
      "correctAnswer": "B"
    }
  ]
}`;

    console.log(`[PHOTO_ANALYSIS] Starting unified analysis for subject=${subject}, topic=${topicName}, hasImage=${!!imagePart || !!imageUrl}`);
    const targetModel = featureModelConfig['SOLVE_QUESTION'] || featureModelConfig['SIMILAR_QUESTION'] || 'SYSTEM_DEFAULT';
    
    const unifiedResult = await executeAiUnifiedRequest({
      prompt: textPrompt,
      imagePart: imagePart || undefined,
      imageUrl: (imageUrl || '').startsWith('data:image') || (imageUrl || '').startsWith('http') ? imageUrl : undefined,
      requireJson: true,
      featureKey: 'PHOTO_QUESTION_FULL_ANALYSIS',
      modelOverride: targetModel,
      maxTokens: 6000
    });

    const responseText = unifiedResult.text;
    console.log(`[PHOTO_ANALYSIS] Raw response length=${responseText?.length}, provider=${unifiedResult.providerUsed}, model=${unifiedResult.modelUsed}`);
    
    let parsedData: any = {};
    const raw = responseText || '';

    let cleaned = raw.trim();
    const codeBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) {
      cleaned = codeBlockMatch[1].trim();
    }
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }

    try {
      parsedData = JSON.parse(cleaned);
    } catch (e1) {
      try {
        // Fix unescaped newlines/tabs inside string literals
        const sanitized = cleaned.replace(/"((?:\\.|[^"\\])*)"/gs, (match) => {
          return match
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r')
            .replace(/\t/g, '\\t');
        });
        parsedData = JSON.parse(sanitized);
      } catch (e2) {
        console.warn('[PHOTO_ANALYSIS] JSON parse failed, falling back to robust regex extraction:', raw.substring(0, 150));
        parsedData = {
          solution: '',
          correctAnswerLetter: '',
          analysis: '',
          similarQuestions: []
        };

        // Extract solution
        const solMatch = cleaned.match(/"solution"\s*:\s*"([\s\S]*?)(?="\s*,\s*"(?:correctAnswerLetter|analysis|similarQuestions)|"\s*})/);
        if (solMatch) {
          parsedData.solution = solMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
        }

        // Extract correctAnswerLetter
        const ansMatch = cleaned.match(/"correctAnswerLetter"\s*:\s*"([A-Ea-e])"/);
        if (ansMatch) {
          parsedData.correctAnswerLetter = ansMatch[1].toUpperCase();
        }

        // Extract analysis
        const anaMatch = cleaned.match(/"analysis"\s*:\s*"([\s\S]*?)(?="\s*,\s*"(?:similarQuestions|solution|correctAnswerLetter)|"\s*})/);
        if (anaMatch) {
          parsedData.analysis = anaMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
        }

        // Extract similarQuestions
        const simMatch = cleaned.match(/"similarQuestions"\s*:\s*(\[[\s\S]*?\])/);
        if (simMatch) {
          try {
            parsedData.similarQuestions = JSON.parse(simMatch[1]);
          } catch {}
        }
      }
    }

    // Safety fallback: If solution is still empty, use the raw responseText
    if (!parsedData.solution && raw) {
      parsedData.solution = raw
        .replace(/^```(?:json)?\s*/, '')
        .replace(/\s*```$/, '')
        .replace(/"solution"\s*:\s*"/, '')
        .trim();
    }

    let simQs: any[] = [];
    if (Array.isArray(parsedData.similarQuestions)) {
      simQs = parsedData.similarQuestions;
    } else if (parsedData.similarQuestion && typeof parsedData.similarQuestion === 'object') {
      simQs = [parsedData.similarQuestion];
    }

    const { userName, userRole, userId } = resolveUserInfo(req.body);
    const usageRecord = recordApiUsage({
      featureKey: 'PHOTO_QUESTION_FULL_ANALYSIS',
      featureName: 'Fotoğraflı Soru Bütünleşik AI Analizi (Çözüm + 3 Benzer Soru + Karne)',
      category: 'QUESTION_ANALYSIS',
      provider: unifiedResult.providerUsed,
      modelUsed: unifiedResult.modelUsed,
      promptTokens: unifiedResult.promptTokens || 2500,
      candidatesTokens: unifiedResult.candidatesTokens || Math.ceil((responseText || '').length / 4),
      promptText: `Fotoğraflı Soru Bütünleşik Analiz (${subject || ''} - ${topicName || ''})`,
      responseText,
      userId,
      userName,
      userRole
    });

    res.json({
      success: true,
      solution: parsedData.solution || null,
      correctAnswerLetter: parsedData.correctAnswerLetter || null,
      similarQuestions: simQs,
      analysis: parsedData.analysis || null,
      aiUsage: usageRecord
    });
  } catch (err: any) {
    console.error('Gemini full photo analysis error:', err);
    res.status(500).json({ error: formatGeminiErrorMessage(err, 'Bütünleşik soru analizi yapılamadı.') });
  }
});

router.get('/usage-stats', (req, res) => {
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

router.post('/clear-usage-logs', async (req, res) => {
  const olderThanDays = typeof req.body.olderThanDays === 'number' ? req.body.olderThanDays : 30;
  const result = await clearApiUsageLogs(olderThanDays);
  res.json({
    success: true,
    message: `${olderThanDays} günden eski log kayıtları başarıyla temizlendi.`,
    deletedCount: result.deletedCount
  });
});

router.get('/model-settings', async (req, res) => {
  const currentKey = getEffectiveGeminiApiKey();
  const groqKey = getEffectiveGroqApiKey();
  const openRouterKey = getEffectiveOpenRouterApiKey();
  const cloudflareToken = getEffectiveCloudflareApiToken();
  const cloudflareAccountId = getEffectiveCloudflareAccountId();
  
  const mask = (k: string) => k ? (k.length > 10 ? `${k.slice(0, 6)}...${k.slice(-4)}` : '***') : '';

  const liveModels = await fetchLiveGoogleModels();

  res.json({
    success: true,
    aiFeaturesEnabled,
    aiCoachChatEnabled,
    savePromptLogs,
    config: featureModelConfig,
    anomalyLimitTRY,
    coachDataSettings,
    aiProviderMode: getEffectiveProviderMode(),
    hasApiKey: Boolean(currentKey),
    maskedApiKey: mask(currentKey),
    hasGroqKey: Boolean(groqKey),
    maskedGroqKey: mask(groqKey),
    hasOpenRouterKey: Boolean(openRouterKey),
    maskedOpenRouterKey: mask(openRouterKey),
    hasCloudflareToken: Boolean(cloudflareToken),
    maskedCloudflareToken: mask(cloudflareToken),
    hasCloudflareAccountId: Boolean(cloudflareAccountId),
    maskedCloudflareAccountId: mask(cloudflareAccountId),
    availableModels: liveModels,
    features: [
      { key: 'AI_COACH_STUDENT', name: 'Öğrenci Bireysel Yapay Zeka Koç Tavsiyesi', category: 'Yapay Zeka Koçluğu', description: 'Öğrencinin haftalık çalışma tavsiyelerini ve net analizlerini hazırlar.' },
      { key: 'AI_COACH_CHAT', name: 'Yapay Zeka Koç Canlı Sohbet', category: 'Yapay Zeka Koçluğu', description: 'Öğrencinin YKS koçu ile interaktif ve anlık rehberlik sohbeti yapmasını sağlar.' },
      { key: 'AI_COACH_CLASS', name: 'Sınıf / Okul Genel Koç Analizi', category: 'Yapay Zeka Koçluğu', description: 'Okul rehber öğretmeni için sınıf geneli etüt ve koçluk raporları üretir.' },
      { key: 'SOLVE_QUESTION', name: 'Hata Defteri Soru Çözümü', category: 'Soru Analiz Engine', description: 'Soru fotoğraflarından adım adım detaylı matematik/fen/türkçe çözümü sunar.' },
      { key: 'QUESTION_ANALYSIS', name: 'Detaylı Soru & Çeldirici Analizi', category: 'Soru Analiz Engine', description: 'Kazanım, zorluk derecesi, süre ve çeldirici şık analiz tablosu üretir.' },
      { key: 'SIMILAR_QUESTION', name: 'Benzer Soru Üretimi', category: 'Soru Analiz Engine', description: 'Çözülen soruya ve konusuna uygun özgün benzer YKS sorusu üretir.' },
      { key: 'ERROR_PRIORITY', name: 'Öncelikli Hata Konuları Analizi', category: 'Soru Analiz Engine', description: 'ÖSYM çıkmış soru ağırlığı ve hata nedenine göre yıldızlı öncelik belirler.' },
      { key: 'TOPIC_TIPS', name: 'Konu İpuçları & Yaygın Hatalar', category: 'Soru Analiz Engine', description: 'Ders ve konu bazlı pratik çözüm taktikleri ve yaygın tuzaklar dokümanı sunar.' },
      { key: 'YOUTUBE_PLANNER', name: 'YouTube Kampı & Ders Planlayıcı', category: 'Ders Planlama', description: 'YouTube oynatma listelerini akıllı çalışma müfredatına dönüştürür.' },
      { key: 'PDF_REPORT_PARSE', name: 'PDF Sonuç Belgesi & Karne Ayrıştırma', category: 'Toplu Veri & İçe Aktarma', description: 'Toplu PDF sınav sonuç belgelerini en düşük token ile analiz edip öğrenci karnelerine ve konu analizlerine dönüştürür.' }
    ]
  });
});

router.post('/refresh-models', async (req, res) => {
  const models = await fetchLiveGoogleModels();
  res.json({ success: true, models });
});

router.post('/test-provider-key', async (req, res) => {
  const { provider, apiKey, accountId } = req.body;
  if (!provider || !['gemini', 'groq', 'openrouter', 'cloudflare'].includes(provider)) {
    return res.status(400).json({ success: false, message: 'Geçersiz sağlayıcı belirtildi.' });
  }

  const effectiveKey = apiKey || (
    provider === 'gemini' ? getEffectiveGeminiApiKey() :
    provider === 'groq' ? getEffectiveGroqApiKey() :
    provider === 'cloudflare' ? getEffectiveCloudflareApiToken() :
    getEffectiveOpenRouterApiKey()
  );

  const effectiveAccountId = accountId || getEffectiveCloudflareAccountId();

  const result = await testProviderApiKey(provider, effectiveKey, effectiveAccountId);
  res.json(result);
});

router.post('/model-settings', async (req, res) => {
  const { 
    config, 
    aiFeaturesEnabled: newEnabledState, 
    aiCoachChatEnabled: newCoachChatEnabled,
    savePromptLogs: newSavePromptLogs, 
    anomalyLimitTRY: newAnomalyLimit, 
    coachDataSettings: newCoachDataSettings, 
    geminiApiKey: newApiKey,
    groqApiKey: newGroqKey,
    openRouterApiKey: newOpenRouterKey,
    cloudflareApiToken: newCloudflareToken,
    cloudflareAccountId: newCloudflareAccountId,
    aiProviderMode: newProviderMode
  } = req.body;
  
  if (typeof newApiKey === 'string') {
    setCustomGeminiApiKey(newApiKey.trim());
  }

  if (typeof newGroqKey === 'string') {
    setCustomGroqApiKey(newGroqKey.trim());
  }

  if (typeof newOpenRouterKey === 'string') {
    setCustomOpenRouterApiKey(newOpenRouterKey.trim());
  }

  if (typeof newCloudflareToken === 'string') {
    setCustomCloudflareApiToken(newCloudflareToken.trim());
  }

  if (typeof newCloudflareAccountId === 'string') {
    setCustomCloudflareAccountId(newCloudflareAccountId.trim());
  }

  if (newProviderMode && ['AUTO_FALLBACK', 'GEMINI_ONLY', 'GROQ_ONLY', 'OPENROUTER_ONLY', 'CLOUDFLARE_ONLY'].includes(newProviderMode)) {
    setAiProviderMode(newProviderMode);
  }

  if (typeof newEnabledState === 'boolean') {
    setAiFeaturesEnabled(newEnabledState);
  }
  if (typeof newCoachChatEnabled === 'boolean') {
    setAiCoachChatEnabled(newCoachChatEnabled);
  }
  if (typeof newSavePromptLogs === 'boolean') {
    setSavePromptLogs(newSavePromptLogs);
  }
  if (typeof newAnomalyLimit === 'number') {
    setAnomalyLimitTRY(newAnomalyLimit);
  }
  if (newCoachDataSettings && typeof newCoachDataSettings === 'object') {
    setCoachDataSettings({ ...coachDataSettings, ...newCoachDataSettings });
  }
  if (config && typeof config === 'object') {
    const sanitized: Record<string, string> = {};
    for (const [k, v] of Object.entries(config)) {
      sanitized[k] = mapToActualGeminiModel(String(v));
    }
    setFeatureModelConfig({ ...featureModelConfig, ...sanitized });
  }

  if (db) {
    setDoc(doc(db, 'system_config', 'gemini_settings'), {
      aiFeaturesEnabled,
      savePromptLogs,
      featureModelConfig,
      anomalyLimitTRY,
      coachDataSettings,
      aiProviderMode: getEffectiveProviderMode(),
      ...(customGeminiApiKey ? { geminiApiKey: customGeminiApiKey } : {}),
      ...(customGroqApiKey ? { groqApiKey: customGroqApiKey } : {}),
      ...(customOpenRouterApiKey ? { openRouterApiKey: customOpenRouterApiKey } : {}),
      ...(customCloudflareApiToken ? { cloudflareApiToken: customCloudflareApiToken } : {}),
      ...(customCloudflareAccountId ? { cloudflareAccountId: customCloudflareAccountId } : {})
    }).catch(err => console.error('Failed to save settings to Firestore:', err));
  }

  const currentKey = getEffectiveGeminiApiKey();
  const groqKey = getEffectiveGroqApiKey();
  const openRouterKey = getEffectiveOpenRouterApiKey();
  const cloudflareToken = getEffectiveCloudflareApiToken();
  const cloudflareAccountId = getEffectiveCloudflareAccountId();
  const mask = (k: string) => k ? (k.length > 10 ? `${k.slice(0, 6)}...${k.slice(-4)}` : '***') : '';

  return res.json({ 
    success: true, 
    aiFeaturesEnabled,
    savePromptLogs,
    config: featureModelConfig, 
    anomalyLimitTRY,
    coachDataSettings,
    aiProviderMode: getEffectiveProviderMode(),
    hasApiKey: Boolean(currentKey),
    maskedApiKey: mask(currentKey),
    hasGroqKey: Boolean(groqKey),
    maskedGroqKey: mask(groqKey),
    hasOpenRouterKey: Boolean(openRouterKey),
    maskedOpenRouterKey: mask(openRouterKey),
    hasCloudflareToken: Boolean(cloudflareToken),
    maskedCloudflareToken: mask(cloudflareToken),
    hasCloudflareAccountId: Boolean(cloudflareAccountId),
    maskedCloudflareAccountId: mask(cloudflareAccountId),
    message: aiFeaturesEnabled 
      ? 'Yapay zeka çoklu sağlayıcı ayarları ve API anahtarları (Cloudflare / OpenRouter / Groq / Gemini) başarıyla güncellendi.'
      : 'Tüm yapay zeka servisleri rehber öğretmen / yönetici kararıyla KAPATILDI.'
  });
});

// -------------------------------------------------------------
// AI Model Sırası & Akıllı Failover / Cooldown API Uç Noktaları
// -------------------------------------------------------------
router.get('/failover-status', async (req, res) => {
  try {
    const { getFailoverStatus } = await import('../services/aiFailoverManager');
    const status = getFailoverStatus();
    res.json(status);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/failover-reset', async (req, res) => {
  try {
    const { resetAllFailovers, getFailoverStatus } = await import('../services/aiFailoverManager');
    await resetAllFailovers();
    const status = getFailoverStatus();
    res.json({
      success: true,
      message: 'Tüm model limitleri ve bekleme süreleri sıfırlandı. Sıra en başa alındı.',
      ...status
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/failover-set-active', async (req, res) => {
  try {
    const { provider, modelId } = req.body;
    if (!provider || !modelId) {
      return res.status(400).json({ success: false, error: 'Sağlayıcı ve model ID zorunludur.' });
    }
    const { forceActiveModel, getFailoverStatus } = await import('../services/aiFailoverManager');
    await forceActiveModel(provider, modelId);
    const status = getFailoverStatus();
    res.json({
      success: true,
      message: `${modelId} modeli başarıyla aktif önceliğe alındı ve varsa limiti temizlendi.`,
      ...status
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/failover-set-duration', async (req, res) => {
  try {
    const { hours } = req.body;
    const numHours = Number(hours) || 24;
    const { setCooldownHours, getFailoverStatus } = await import('../services/aiFailoverManager');
    await setCooldownHours(numHours);
    const status = getFailoverStatus();
    res.json({
      success: true,
      message: `Model limit bekleme süresi ${numHours} saat olarak ayarlandı.`,
      ...status
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/failover-reorder-models', async (req, res) => {
  try {
    const { provider, modelId, direction } = req.body;
    if (!provider || !modelId || !direction || !['UP', 'DOWN'].includes(direction)) {
      return res.status(400).json({ success: false, error: 'Sağlayıcı, model ID ve yön (UP/DOWN) zorunludur.' });
    }
    const { reorderModel, getFailoverStatus } = await import('../services/aiFailoverManager');
    await reorderModel(provider, modelId, direction);
    const status = getFailoverStatus();
    res.json({
      success: true,
      message: `Model sırası başarıyla güncellendi.`,
      ...status
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/failover-reorder-providers', async (req, res) => {
  try {
    const { provider, direction, order } = req.body;
    const { moveProvider, reorderProviders, getFailoverStatus } = await import('../services/aiFailoverManager');
    
    if (Array.isArray(order) && order.length > 0) {
      await reorderProviders(order);
    } else if (provider && direction) {
      const dir = String(direction).toLowerCase() === 'left' ? 'left' : 'right';
      await moveProvider(provider, dir);
    } else {
      return res.status(400).json({ success: false, error: 'order dizisi veya provider ile direction zorunludur.' });
    }

    const status = getFailoverStatus();
    res.json({
      success: true,
      message: 'Sağlayıcı sırası başarıyla güncellendi.',
      ...status
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/failover-test-model', async (req, res) => {
  try {
    const { provider, modelId, prompt, imageBase64, imageMimeType } = req.body;
    if (!provider || !modelId) {
      return res.status(400).json({ success: false, error: 'Sağlayıcı ve model ID zorunludur.' });
    }
    const { testSingleModel } = await import('../services/aiProviderGateway');
    const result = await testSingleModel(provider, modelId, prompt, imageBase64, imageMimeType);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/failover-toggle-model-status', async (req, res) => {
  try {
    const { provider, modelId, action, hours } = req.body;
    if (!provider || !modelId || !action) {
      return res.status(400).json({ success: false, error: 'Sağlayıcı, model ID ve eylem zorunludur.' });
    }
    const { 
      forceActiveModel, 
      setManualModelCooldown, 
      setIndefinitePassive, 
      clearModelCooldown, 
      getFailoverStatus 
    } = await import('../services/aiFailoverManager');
    
    if (action === 'FORCE_ACTIVE') {
      await forceActiveModel(provider, modelId);
    } else if (action === 'SET_COOLDOWN') {
      await setManualModelCooldown(provider, modelId, hours || 24);
    } else if (action === 'SET_INDEFINITE_PASSIVE') {
      await setIndefinitePassive(provider, modelId);
    } else if (action === 'CLEAR_COOLDOWN') {
      await clearModelCooldown(provider, modelId);
    }

    const status = getFailoverStatus();
    res.json({
      success: true,
      message: `Model durumu güncellendi.`,
      ...status
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/failover-update-model-vision', async (req, res) => {
  try {
    const { provider, modelId, isVisionCapable } = req.body;
    if (!provider || !modelId || typeof isVisionCapable !== 'boolean') {
      return res.status(400).json({ success: false, error: 'Sağlayıcı, model ID ve isVisionCapable (boolean) zorunludur.' });
    }
    const { updateModelVisionCapability, getFailoverStatus } = await import('../services/aiFailoverManager');
    await updateModelVisionCapability(provider, modelId, isVisionCapable);
    const status = getFailoverStatus();
    res.json({
      success: true,
      message: `${modelId} modelinin Vision yeteneği başarıyla ${isVisionCapable ? 'AKTİF' : 'PASİF'} yapıldı.`,
      ...status
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/failover-add-custom-model', async (req, res) => {
  try {
    const { provider, id, name, description, badge, isVisionCapable } = req.body;
    if (!provider || !id || !name) {
      return res.status(400).json({ success: false, error: 'Sağlayıcı, model ID ve model ismi zorunludur.' });
    }
    const { addCustomModel, getFailoverStatus } = await import('../services/aiFailoverManager');
    await addCustomModel(provider, {
      id: id.trim(),
      name: name.trim(),
      description: (description || '').trim(),
      badge: (badge || 'Özel Model').trim(),
      isVisionCapable: Boolean(isVisionCapable)
    });
    const status = getFailoverStatus();
    res.json({
      success: true,
      message: `Yeni model başarıyla eklendi.`,
      ...status
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/failover-remove-custom-model', async (req, res) => {
  try {
    const { provider, modelId } = req.body;
    if (!provider || !modelId) {
      return res.status(400).json({ success: false, error: 'Sağlayıcı ve model ID zorunludur.' });
    }
    const { removeCustomModel, getFailoverStatus } = await import('../services/aiFailoverManager');
    await removeCustomModel(provider, modelId);
    const status = getFailoverStatus();
    res.json({
      success: true,
      message: `Model listeden kaldırıldı.`,
      ...status
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});


// -------------------------------------------------------------
// Çalışma Planı Yapay Zeka Görev Önerisi
// -------------------------------------------------------------
router.post('/suggest-study-task', async (req, res) => {
  if (!isAiEnabledOrRespond(res)) return;
  const apiKey = getEffectiveGeminiApiKey();
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY sunucuda tanımlı değil.' });
  }

  const {
    profile,
    targetDay,
    currentWeekPlans,
    lastWeekPlans,
    generalMocks,
    branchExams,
    topicErrors,
    questionLogs,
    taskTypes,
    coachDataSettings: customSettings
  } = req.body;

  const settings = customSettings || coachDataSettings;
  const plannerSettings = settings.studyPlannerTask || { enabled: true };

  try {
    const ai = new GoogleGenAI({ apiKey: (apiKey || '').trim() });

    let prompt = `
Sen Türkiye YKS (Yükseköğretim Kurumları Sınavı) hazırlık sürecinde uzman bir rehber öğretmen ve çalışma planı danışmanısın.

ÖĞRENCİ BİLGİLERİ:
- Öğrenci Adı: ${profile?.name || 'Öğrenci'}
- Alan: ${profile?.targetField || 'SAY'}
- Hedef Üniversite/Bölüm: ${profile?.targetUniversity || ''} ${profile?.targetDepartment || ''}
- Hedef Sıralama: ${profile?.targetRank || 5000}
- Hedef Netler: TYT ${profile?.targetTYTNet || 100} Net, AYT ${profile?.targetAYTNet || 70} Net
- Okul: ${profile?.highSchool || 'Anadolu Lisesi'}

HEDEF GÜN: ${targetDay || 'Belirtilmedi'}
`;

    // Bu hafta mevcut görevler
    if (currentWeekPlans && currentWeekPlans.length > 0) {
      const summary = currentWeekPlans.map((p: any) => ({
        gün: p.day,
        ders: p.subject,
        konu: p.topic,
        süre: `${p.plannedMinutes} dk`,
        durum: p.status
      }));
      prompt += `\nBU HAFTA MEVCUT PLANLANMIŞ GÖREVLER:\n${JSON.stringify(summary)}\n`;
    } else {
      prompt += `\nBU HAFTA HENÜZ PLANLANMIŞ GÖREV YOK.\n`;
    }

    // Geçen hafta planı (admin ayarında lastWeekPlans.enabled === true ise eklenir)
    if (settings.lastWeekPlans?.enabled === true && lastWeekPlans && lastWeekPlans.length > 0) {
      const lastWeekSummary = lastWeekPlans.slice(-10).map((p: any) => ({
        ders: p.subject,
        konu: p.topic,
        süre: `${p.completedMinutes || 0}/${p.plannedMinutes} dk`,
        durum: p.status
      }));
      prompt += `\nGEÇEN HAFTA TAMAMLANAN GÖREVLER (referans için):\n${JSON.stringify(lastWeekSummary)}\n`;
    }

    // Deneme netleri
    if (plannerSettings.enabled !== false && settings.generalMocks?.enabled !== false) {
      const limit = settings.generalMocks?.limit || 3;
      prompt += `\nSON GENEL DENEME NETLERİ:\n${JSON.stringify(summarizeMocksForPrompt(generalMocks, limit))}\n`;
    }

    // Branş denemeleri
    if (plannerSettings.enabled !== false && settings.branchExams?.enabled !== false) {
      const limit = settings.branchExams?.limit || 3;
      prompt += `\nSON BRANŞ DENEMELERİ:\n${JSON.stringify(summarizeBranchExamsForPrompt(branchExams, limit))}\n`;
    }

    // Hata defteri
    if (plannerSettings.enabled !== false && settings.topicErrors?.enabled !== false) {
      const limit = settings.topicErrors?.limit || 8;
      prompt += `\nEKSİK / YANLIŞ YAPILAN KONULAR:\n${JSON.stringify(summarizeErrorsForPrompt(topicErrors, limit))}\n`;
    }

    // Soru logları
    if (plannerSettings.enabled !== false && settings.questionLogs?.enabled !== false) {
      const limit = settings.questionLogs?.limit || 5;
      prompt += `\nSON SORU ÇÖZÜM VERİLERİ:\n${JSON.stringify(summarizeQuestionLogsForPrompt(questionLogs, limit))}\n`;
    }

    const taskTypesList = (taskTypes || ['Konu Tekrarı', 'Soru Çözme', 'Deneme', 'Video İzle', 'Diğer']).join(', ');
    prompt += `
MEVCUT GÖREV TİPLERİ: ${taskTypesList}

GÖREV:
Yukarıdaki verileri analiz ederek bu öğrencinin ${targetDay || 'bugün'} için çalışma planına eklemesi gereken EN UYGUN 1 (bir) görevi öner.

Dikkat edilecekler:
- Bu hafta zaten planlı olan derslerle çakışma olsa bile, gerçekten zayıf olan bir konu varsa önceliklendir.
- Geçen haftanın planından tamamlanmamış görevler varsa önce onları tamamlamayı öner.
- Hata defterindeki en kritik konuya odaklan.
- Önerilen süre 30-120 dakika arasında olmalı, 15'in katı olmalı.
- Soru sayısı hedefi varsa 10'un katı olmalı.
- "reason" alanında 1-2 cümle ile NEDEN bu görevi önerdiğini açıkça belirt.

Yanıtın YALNIZCA geçerli bir JSON objesi olmalıdır:
{
  "subject": "Ders adı (örn: Matematik)",
  "topic": "Konu adı (örn: Türev)",
  "taskType": "Görev tipi (mevcut görev tiplerinden biri)",
  "plannedMinutes": 60,
  "targetQuestionCount": 40,
  "notes": "Kısa not veya kaynak önerisi (opsiyonel, boş olabilir)",
  "reason": "Bu görevi neden önerdiğine dair 1-2 cümle açıklama"
}
`;

    const targetModel = featureModelConfig['AI_COACH_STUDENT'] || 'gemini-3.5-flash-lite';
    const unifiedResult = await executeAiUnifiedRequest({
      prompt,
      requireJson: true,
      featureKey: 'STUDY_TASK_SUGGEST',
      modelOverride: targetModel
    });

    const parsedData = cleanAndParseJson(unifiedResult.text);
    const { userName, userRole, userId } = resolveUserInfo(req.body);

    const usageRecord = recordApiUsage({
      featureKey: 'STUDY_TASK_SUGGEST',
      featureName: 'Çalışma Planı Yapay Zeka Görev Önerisi',
      category: 'AI_COACH',
      provider: unifiedResult.providerUsed,
      modelUsed: unifiedResult.modelUsed,
      promptTokens: unifiedResult.promptTokens || Math.ceil(prompt.length / 4),
      candidatesTokens: unifiedResult.candidatesTokens || Math.ceil(unifiedResult.text.length / 4),
      promptText: prompt,
      responseText: unifiedResult.text,
      userId,
      userName,
      userRole
    });

    res.json({
      success: true,
      suggestion: parsedData,
      aiUsage: usageRecord
    });
  } catch (err: any) {
    console.error('Unified study planner error:', err);
    res.status(500).json({ error: formatGeminiErrorMessage(err, 'Yapay zeka görev önerisi üretilemedi.') });
  }
});

// PDF Exam Reports Parser Endpoint (Token-Optimized Batch Extraction)
router.post('/parse-pdf-exam-reports', async (req, res) => {
  if (!isAiEnabledOrRespond(res)) return;

  const { pagesText } = req.body;
  if (!Array.isArray(pagesText) || pagesText.length === 0) {
    return res.status(400).json({ error: 'Ayrıştırılacak sayfa metinleri bulunamadı.' });
  }

  if (!hasAnyAiApiKey()) {
    return res.status(400).json({
      error: 'Yapay Zeka API Anahtarı eksik. Lütfen Sistem Yönetimi > Yapay Zeka sayfasından en az bir API anahtarı giriniz.'
    });
  }

  try {
    const targetModel = featureModelConfig['PDF_REPORT_PARSE'] || 'gemini-3.5-flash-lite';

    const prompt = `Sen Türkiye YKS (TYT ve AYT) sınav sonuç belgelerini (karne) ayrıştıran uzman bir veri analistisin.
Sana verilen metinler, optik/yayın evlerinin (ÜçDörtBeş, Ulti, Hız ve Renk, Özdebir, 3D, Limit, vb.) karne sayfalarından çıkarılmıştır.

GÖREVİN:
Her sayfa için aşağıdaki bilgileri eksiksiz ve en yüksek doğrulukla JSON formatında çıkar:

1. SINAV VE ÖĞRENCİ BİLGİLERİ:
   - Sınav Başlığı ("examTitle"): Sayfanın en üstündeki yayın ve sınav adı (örn: "ÜÇDÖRTBEŞ AYT TÜRKİYE GENELİ BÜYÜK PROVA", "ULTİ YAYINLARI TÜRKİYE GENELİ AYT DENEME", "HIZ VE RENK TYT 1")
   - Sınav Türü ("examType"): "TYT" veya "AYT"
   - Öğrenci Bilgileri: Ad Soyad ("studentName"), Numara ("schoolNumber"), Sınıf ("className", örn: "12-A", "12-B", "12-C", "12-D", "12-E")

2. PUANLAR, DERECELER VE KATILIM SAYILARI (ÇOK ÖNEMLİ):
   Sayfanın üst kısmındaki 'Puan Türü | Puan | Genel Ortalama | Dereceler (Snf, Kurum, İlçe, İl, Genel)' tablosunu dikkatle oku:
   - AYT için SÖZ, SAY, EA satırları:
     * sayScore: SAY Puanı (ondalık virgülü noktaya çevir, örn: 303.088)
     * sayClassRank: SAY 'Snf' derecesi (örn: 7)
     * sayInstitutionRank: SAY 'Kurum' derecesi (örn: 17)
     * sayGeneralRank: SAY 'Genel' derecesi (örn: 47174)
     * eaScore: EA Puanı (örn: 249.258), eaClassRank (Snf), eaInstitutionRank (Kurum), eaGeneralRank (Genel)
     * sozScore: SÖZ Puanı (örn: 203.183), sozClassRank (Snf), sozInstitutionRank (Kurum), sozGeneralRank (Genel)
   - TYT için TYT satırı:
     * tytScore: TYT Puanı (örn: 336.319)
     * tytClassRank: TYT 'Snf' derecesi
     * tytInstitutionRank: TYT 'Kurum' derecesi
     * tytGeneralRank: TYT 'Genel' derecesi
   - 'Katılımlar:' satırı (Dereceler tablosunun hemen altındaki satır):
     * classParticipantCount: 'Snf' altındaki katılım sayısı (örn: 21)
     * institutionParticipantCount: 'Kurum' altındaki katılım sayısı (örn: 83)
     * generalParticipantCount: 'Genel' altındaki katılım sayısı (örn: 194065 veya 71520)

3. DERS VE KONU ANALİZİ TABLOLARI ("subjects"):
   Sol tablodaki tüm dersleri ("Türkçe", "Tarih-1", "Coğrafya-1", "Felsefe", "Din Kül. ve Ahl. Bil.", "TYT Sosyal", "Matematik-1", "Geometri", "TYT Matematik", "Fizik", "Kimya", "Biyoloji", "TYT Fen", "Matematik-2", "Edebiyat-Sosyal-1", "Sosyal-2", "Fen Bilimleri") 'subjects' dizisine ekle:
   - subjectName: Ders adı
   - questionCount (Soru sayısı), correct (Doğru), wrong (Yanlış), net (Net), successRate (Başarı %), classAvgNet (Sınıf Ort), institutionAvgNet (Kurum Ort), generalAvgNet (Genel Ort)
   
   KAZANIM ANALİZLERİ ("topics" - TÜM KONULARI EKSİKSİZ DOLDUR):
   Sağ taraftaki 'DERSLERE GÖRE ANALİZ' başlığı altındaki her bir alt konuyu (Örn: Matematik-2, Geometri, Fizik, Kimya, Biyoloji, Türkçe, Edebiyat, Tarih, Coğrafya altındaki tüm satırları) ilgili dersin 'topics' dizisine ekle:
   - topicName: Konu Adı (örn: "Aralık Kavramı ve Basit Eşitsizlikler", "Vektörler", "GAZLAR", "Sinir Sistemi")
   - questionCount: S (Soru sayısı, tam sayı)
   - correct: D (Doğru sayısı, tam sayı)
   - wrong: Y (Yanlış sayısı, tam sayı)
   - empty: Boş sayısı (questionCount - correct - wrong, tam sayı)
   - successRate: B% (Başarı yüzdesi, tam sayı)
   Her dersin altındaki konuları eksiksiz çıkar, hiçbir konuyu atlama!

4. CEVAP VE OPTİK KAĞIT ŞERİDİ BİLGİLERİ ("opticalAnswers" & "answerKeys"):
   Sayfada yer alan öğrenci cevap dizilimlerini ve cevap anahtarlarını çıkar:
   - "opticalAnswers": Öğrencinin optik şeridindeki harf dizilimi (örn: "ADCcdACEEd aaEAddBdBEaBcdeEBCdBCBDBDCCC").
     * Büyük harfler (A, B, C, D, E): DOĞRU cevaplanan sorular
     * Küçük harfler (a, b, c, d, e): YANLIŞ cevaplanan sorular
     * Boşluklar (' '): BOŞ bırakılan sorular
   - "answerKeys": Sınavın doğru cevap anahtarı harf dizilimi (örn: "ADCCDACEEDAADD...").

DİKKAT:
- Yalnızca geçerli JSON formatı üret.

SAYFA METİNLERİ:
${pagesText.map((p: any, idx: number) => `--- SAYFA ${p.pageIndex || (idx + 1)} ---\n${p.text}`).join('\n\n')}

İstenen JSON Yapısı:
{
  "examTitle": "string",
  "examType": "TYT" | "AYT",
  "reports": [
    {
      "pageIndex": number,
      "studentName": "string",
      "schoolNumber": "string",
      "className": "string",
      "opticalAnswers": {
        "TYT Türkçe": "string",
        "TYT Sosyal": "string",
        "TYT Matematik": "string",
        "TYT Fen": "string",
        "Matematik": "string",
        "Fen Bilimleri": "string",
        "Edebiyat-Sosyal-1": "string",
        "Sosyal-2": "string"
      },
      "answerKeys": {
        "TYT Türkçe": "string",
        "TYT Sosyal": "string",
        "TYT Matematik": "string",
        "TYT Fen": "string"
      },
      "scores": {
        "tytScore": number,
        "sayScore": number,
        "eaScore": number,
        "sozScore": number,
        "sayClassRank": number,
        "sayInstitutionRank": number,
        "sayGeneralRank": number,
        "eaClassRank": number,
        "eaInstitutionRank": number,
        "eaGeneralRank": number,
        "sozClassRank": number,
        "sozInstitutionRank": number,
        "sozGeneralRank": number,
        "tytClassRank": number,
        "tytInstitutionRank": number,
        "tytGeneralRank": number,
        "classParticipantCount": number,
        "institutionParticipantCount": number,
        "generalParticipantCount": number
      },
      "subjects": [
        {
          "subjectName": "string",
          "questionCount": number,
          "correct": number,
          "wrong": number,
          "net": number,
          "successRate": number,
          "classAvgNet": number,
          "institutionAvgNet": number,
          "generalAvgNet": number,
          "opticalAnswers": "string",
          "answerKey": "string",
          "topics": [
            {
              "topicName": "string",
              "questionCount": number,
              "correct": number,
              "wrong": number,
              "empty": number,
              "successRate": number
            }
          ]
        }
      ]
    }
  ]
}
`;

    const unifiedResult = await executeAiUnifiedRequest({
      prompt,
      requireJson: true,
      featureKey: 'PDF_REPORT_PARSE',
      modelOverride: targetModel,
      maxTokens: 8192
    });

    const parsedData = cleanAndParseJson(unifiedResult.text);
    const { userName, userRole, userId } = resolveUserInfo(req.body);

    const usageRecord = recordApiUsage({
      featureKey: 'PDF_REPORT_PARSE',
      featureName: 'PDF Sınav Sonuç Belgesi Ayrıştırma',
      category: 'QUESTION_ANALYSIS',
      provider: unifiedResult.providerUsed,
      modelUsed: unifiedResult.modelUsed,
      promptTokens: unifiedResult.promptTokens || Math.ceil(prompt.length / 4),
      candidatesTokens: unifiedResult.candidatesTokens || Math.ceil((unifiedResult.text || '').length / 4),
      promptText: prompt,
      responseText: unifiedResult.text,
      userId,
      userName,
      userRole
    });

    res.json({
      success: true,
      data: parsedData,
      aiUsage: usageRecord
    });
  } catch (err: any) {
    console.error('Unified PDF report parse error:', err);
    res.status(500).json({ error: formatGeminiErrorMessage(err, 'PDF sınav sonuç belgesi ayrıştırılırken hata oluştu.') });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/gemini/parse-intent
// Doğal dil ile söylenen veri ekleme niyetini (Soru, Hata, Branş/Genel Deneme,
// Ders Programı, vb.) analiz edip hedef modül ve doldurulacak alanları çıkaran yapay zeka motoru.
// ─────────────────────────────────────────────────────────────────────────────
router.post('/parse-intent', async (req, res) => {
  if (!isAiEnabledOrRespond(res)) return;

  try {
    const { prompt: userPrompt, todayDate } = req.body;
    if (!userPrompt || typeof userPrompt !== 'string' || !userPrompt.trim()) {
      return res.status(400).json({ error: 'Lütfen eklemek istediğiniz işlemi belirten bir metin giriniz.' });
    }

    const currentDateStr = todayDate || new Date().toISOString().split('T')[0];

    const systemPrompt = `Sen Türkiye'deki YKS (TYT / AYT / YDT) sınavına hazırlanan öğrenciler için geliştirilmiş YKS Takip Sistemi'nin "Akıllı Veri Giriş ve Niyet Ayrıştırıcı" Yapay Zeka Asistanısın.

GÖREVİN:
Kullanıcının doğal dille yazdığı cümleyi analiz edip:
1. Hangi modüle veri eklemek istediğini (intent & targetTab) belirlemek.
2. Cümledeki tüm verileri (ders, konu, doğru, yanlış, boş, net, süre, yayın, tarih, notlar vb.) çıkarıp yapılandırılmış JSON nesnesine dönüştürmek.

BUGÜNÜN TARİHİ: ${currentDateStr}

MÜMKÜN NİYETLER (intents):
- "QUESTION_LOG": Soru çözüm kaydı (Örn: "Bugün TYT Matematikten 50 soru çözdüm 42 doğru 5 yanlış 45 dk")
  targetTab: "questions"
- "TOPIC_ERROR": Hata defteri / yanlış yapılan soru kaydı (Örn: "AYT Fizik elektrostatik konusunda hata yaptım ekleyelim", "Türevden yanlışım var hata defterine atalım")
  targetTab: "errors"
- "BRANCH_EXAM": Branş denemesi kaydı (Örn: "345 TYT Türkçe branş denemesi çözdüm 35 doğru 4 yanlış 45 dakika sürdü", "Apotemi AYT Matematik denemesi 32 net")
  targetTab: "branches"
- "GENERAL_MOCK": Genel deneme sınavı (TYT/AYT/YDT) kaydı (Örn: "Özdebir Türkiye Geneli TYT Denemesi netlerim: Türkçe 32, Sosyal 15, Mat 30, Fen 16", "3D AYT denemesi çözdüm Mat 35 Fen 32", "YDT İngilizce 72 net")
  targetTab: "mocks"
- "STUDY_PLAN": Haftalık ders çalışma programına görev/plan ekleme (Örn: "Yarın saat 14:00'te Geometri üçgenler tekrarı yapalım", "Pazartesi günü Paragraf ve Problem koy")
  targetTab: "planner"
- "STUDY_SESSION": Ders çalışma süresi / günlük net süre kaydı (Örn: "Bugün 3 saat Matematik, 1.5 saat Fizik çalıştım", "Bugün 4 saat ders çalıştım")
  targetTab: "planner"
- "RESOURCE_BOOK": Kaynak kitap ekleme (Örn: "Apotemi AYT Kimya Organik soru bankası aldım ekleyelim")
  targetTab: "resources"
- "ROUTINE": Günlük rutin / alışkanlık ekleme (Örn: "Her gün 20 paragraf çözme rutini ekle")
  targetTab: "routines"

GÜNLÜK ÇALIŞMA SÜRESİ (STUDY_SESSION) ÖZEL KURALLARI:
- targetTab her zaman "planner" olmalıdır.
- Cümledeki tüm çalışma sürelerini toplayıp dakika cinsinden "durationMinutes" alanına yaz (Örn: "3 saat Matematik, 1.5 saat Fizik" -> 3 * 60 + 1.5 * 60 = 270 dakika).
- Hangi derslere ne kadar çalışıldığını anlaşılır şekilde "notes" alanına aktar (Örn: "3 saat Matematik, 1.5 saat Fizik").
- summary alanına Türkçe net özet yaz (Örn: "Net Çalışma Süresi: 4.5 Saat (270 dk)").

GENEL DENEME (GENERAL_MOCK) ÖZEL KURALLARI:
- Deneme adını "mockTitle" alanına ata (Örn: "Özdebir Türkiye Geneli TYT Denemesi", "3D Türkiye Geneli AYT-1", vb.).
- "examType" alanını belirle ("TYT", "AYT", "TYT_AYT", "DIL", "TYT_DIL").
- Belirtilen ders netlerini "tytNets" ve "aytNets" nesneleri içine ayrıştır:
  - tytNets: { "turkce": 32, "sosyal": 15, "matematik": 30, "fen": 16 }
  - aytNets: { "matematik": 35, "fen": 32, "edebiyatSos1": 30, "sos2": 28 }
  - ydtNet: 72 (Varsa)

DERS ADI STANDARTLARI (subject):
- "TYT Türkçe", "TYT Matematik", "TYT Geometri", "TYT Fizik", "TYT Kimya", "TYT Biyoloji", "TYT Tarih", "TYT Coğrafya", "TYT Felsefe", "TYT Din Kültürü"
- "AYT Matematik", "AYT Geometri", "AYT Fizik", "AYT Kimya", "AYT Biyoloji", "AYT Edebiyat", "AYT Tarih-1", "AYT Tarih-2", "AYT Coğrafya-1", "AYT Coğrafya-2", "AYT Felsefe Grubu", "AYT Din Kültürü"
- "YDT İngilizce", "YDT Almanca", "YDT Fransızca"
Eğer sadece "Matematik" denmişse ve bağlam net değilse varsayılan "TYT Matematik" veya "AYT Matematik" olarak uygun olanı seç.

SAYISAL KURALLAR:
- Doğru (correct), Yanlış (wrong), Boş (empty), Toplam Soru (totalQuestions) sayılarını hesapla veya çıkar.
- Net hesaplama kuralı: net = correct - (wrong * 0.25).
- Süre: Dakika cinsine çevir (durationMinutes). Örn: "1.5 saat" -> 90, "45 dk" -> 45.
- Tarih: "bugün" -> ${currentDateStr}, "dün" -> 1 gün öncesi, "yarın" -> 1 gün sonrası.

YANIT FORMATI:
SADECE aşağıdaki JSON şemasına tam uyan geçerli bir JSON nesnesi döndür, markdown formatlama (kod bloğu) dışında hiçbir metin yazma:

{
  "intent": "QUESTION_LOG" | "TOPIC_ERROR" | "BRANCH_EXAM" | "GENERAL_MOCK" | "STUDY_PLAN" | "STUDY_SESSION" | "RESOURCE_BOOK" | "ROUTINE",
  "targetTab": "questions" | "errors" | "branches" | "mocks" | "planner" | "study" | "resources" | "routines",
  "confidence": 0.95,
  "summary": "Kısa ve anlaşılır Türkçe özet başlık (Örn: Özdebir TYT Denemesi - 93 Net)",
  "explanation": "Tespit edilen işlem hakkında 1 cümlelik açıklama",
  "fields": {
    "mockTitle": "Özdebir Türkiye Geneli TYT Denemesi (Varsa)",
    "subject": "TYT Matematik (Varsa)",
    "topicName": "Fonksiyonlar (Varsa)",
    "publisher": "Özdebir (Varsa)",
    "totalQuestions": 50,
    "correct": 42,
    "wrong": 5,
    "empty": 3,
    "net": 40.75,
    "durationMinutes": 45,
    "date": "${currentDateStr}",
    "time": "14:00 (Varsa)",
    "errorReason": "Dikkat Hatası (Varsa)",
    "examType": "TYT (Varsa: TYT, AYT, TYT_AYT, DIL, TYT_DIL)",
    "bookName": "Kitap adı (Varsa)",
    "routineTitle": "Rutin başlığı (Varsa)",
    "tytNets": {
      "turkce": 32,
      "sosyal": 15,
      "matematik": 30,
      "fen": 16
    },
    "aytNets": {
      "matematik": 35,
      "fen": 30,
      "edebiyatSos1": 28,
      "sos2": 24
    },
    "ydtNet": 70,
    "notes": "Ek not veya açıklama"
  }
}

KULLANICININ GİRDİĞİ METİN:
"${userPrompt}"`;

    const targetModel = featureModelConfig['SMART_ADD_INTENT'] || 'SYSTEM_DEFAULT';

    const unifiedResult = await executeAiUnifiedRequest({
      prompt: systemPrompt,
      requireJson: true,
      featureKey: 'SMART_ADD_INTENT',
      modelOverride: targetModel,
      maxTokens: 2048
    });

    const parsedData = cleanAndParseJson(unifiedResult.text);
    const { userName, userRole, userId } = resolveUserInfo(req.body);

    const usageRecord = recordApiUsage({
      featureKey: 'SMART_ADD_INTENT',
      featureName: 'Yapay Zeka ile Akıllı Hızlı Ekleme',
      category: 'AI_COACH',
      provider: unifiedResult.providerUsed,
      modelUsed: unifiedResult.modelUsed,
      promptTokens: unifiedResult.promptTokens || Math.ceil(systemPrompt.length / 4),
      candidatesTokens: unifiedResult.candidatesTokens || Math.ceil((unifiedResult.text || '').length / 4),
      promptText: userPrompt,
      responseText: unifiedResult.text,
      userId,
      userName,
      userRole
    });

    res.json({
      success: true,
      data: parsedData,
      aiUsage: usageRecord
    });
  } catch (err: any) {
    console.error('AI parse intent error:', err);
    res.status(500).json({ error: formatGeminiErrorMessage(err, 'Yapay zeka niyet analizi sırasında bir hata oluştu.') });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/gemini/generate-weekly-report-card
// Öğrencinin haftalık çalışma, soru, hata, süre ve deneme sınavı performansını
// bütüncül olarak analiz edip tahmini YKS sıralama bandı ve koçluk karnesi üreten yapay zeka motoru.
// ─────────────────────────────────────────────────────────────────────────────
router.post('/generate-weekly-report-card', async (req, res) => {
  if (!isAiEnabledOrRespond(res)) return;

  try {
    const { 
      studentName,
      targetField,
      targetGoal,
      weekLabel,
      weeklyStats,
      subjectBreakdown,
      latestMocks,
      topMistakeTopics,
      gradeLevel,
      schoolExamsSummary,
      targetGpa,
      obpScore
    } = req.body;

    const isGrade9or10 = gradeLevel === '9' || gradeLevel === '10';
    const isGrade11 = gradeLevel === '11';

    const studentInfo = `ÖĞRENCİ BİLGİLERİ:
- İsim: ${studentName || 'Öğrenci'}
- Sınıf Kademesi: ${gradeLevel ? `${gradeLevel}. Sınıf` : '12. Sınıf / YKS'}
- Alan: ${targetField || 'SAY'}
- Hedef / Üniversite / OBP: ${targetGoal || (targetGpa ? `Hedef OBP: ${targetGpa}` : 'İlk 20.000')}
- Değerlendirilen Hafta: ${weekLabel || 'Bu Hafta'}
${schoolExamsSummary ? `- Okul Yazılı Sınavları & OBP Durumu:\n${schoolExamsSummary}` : ''}
${obpScore ? `- Güncel OBP / Diploma Tahmini: ${obpScore}` : ''}

HAFTALIK İSTATİSTİKLER:
- Toplam Çözülen Soru: ${weeklyStats?.totalSolved || 0} / Hedef: ${weeklyStats?.targetSolved || 0}
- Tamamlama Oranı: %${weeklyStats?.completionRate || 0}
- Net Çalışma Süresi: ${weeklyStats?.totalStudyHours || '0'} Saat
- Bu Haftaki Hata Sayısı: ${weeklyStats?.mistakeCount || 0}
- Pekiştirilen / Tekrar Edilen Hata: ${weeklyStats?.pekiştirilenHataCount || 0}

DERSLERE GÖRE DAĞILIM:
${(subjectBreakdown || []).map((s: any) => `- ${s.subject}: ${s.solved} soru (${s.correct} Doğru, ${s.wrong} Yanlış, %${s.accuracy || 0} Başarı)`).join('\n') || 'Veri bulunmuyor.'}

SON DENEME / KDS SINAVI SONUÇLARI:
${(latestMocks || []).map((m: any) => `- ${m.title || m.date}: TYT/KDS Net: ${m.tytNet || 0}, AYT Net: ${m.aytNet || 0}`).join('\n') || 'Henüz deneme verisi girilmemiş.'}

EN ÇOK HATA YAPILAN / TEKRAR BEKLEYEN KONULAR:
${(topMistakeTopics || []).map((t: any) => `- ${t.subject} - ${t.topic} (${t.count} Hata)`).join('\n') || 'Kritik hata birikimi yok.'}`;

    const systemPrompt = `Sen Türkiye'nin en tecrübeli, pedagojik ve stratejik Lise & YKS Uzman Koçu ve Rehberlik Danışmanısın.
Görevin aşağıdaki öğrenci verilerini analiz ederek öğrenciye ve velisine moral veren, gerçekçi, motivasyon artıran ve nokta atışı stratejiler sunan bir "Haftalık Yapay Zeka Başarı Karnesi" hazırlamaktır.

${studentInfo}

ÖNEMLİ DEĞERLENDİRME KRİTERLERİ:
${isGrade9or10 ? `
1. Tahmini Başarı Bandı (estimatedRankBand): Bu öğrenci 9 veya 10. sınıf öğrencisidir (MEB Türkiye Yüzyılı Maarif Modeli). YKS genel sıralaması yerine "Takdir Belgesi Bandı (88 - 94 OBP)" veya "Teşekkür Belgesi Bandı (76 - 84 OBP)" gibi yazılı sınav ve OBP odaklı başarı bandı belirle.
2. Güçlü Yönler: Öğrencinin bu hafta ivme kazandığı okul derslerini veya düzenli soru çözme alışkanlığını takdir et.
3. Kritik Gelişim Alanları: Yaklaşan 1. veya 2. dönem yazılı sınavları için en kritik 2 ders/konu tavsiyesi ver.
4. Altın Stratejiler: Okul yazılılarına hazırlık, Maarif Modeli kavram pekiştirmesi ve günlük düzenli tekrar için 3 uygulanabilir madde yaz.
` : isGrade11 ? `
1. Tahmini Başarı Bandı (estimatedRankBand): 11. sınıf öğrencisi için "Yüksek OBP & İlk 25.000 YKS Temeli" gibi hem okul yazılı başarısı hem de YKS temelini yansıtan bir bant belirle.
2. Güçlü Yönler: 11. sınıf alan derslerindeki kavrayışını ve soru çözümlerini öne çıkar.
3. Kritik Gelişim Alanları: 11. sınıf okul dersleri ve TYT tekrarı için 2 kritik alan belirle.
4. Altın Stratejiler: 11. sınıf derslerini yüksek tutarak OBP'yi koruma ve TYT temelini güçlendirme amaçlı 3 strateji yaz.
` : `
1. Tahmini Sıralama Bandı: Öğrencinin netlerine, alanına ve soru temposuna göre gerçekçi bir YKS Türkiye Sıralaması bandı tahmin et (Örn: "12.000 - 18.000" veya "35.000 - 48.000").
2. Güçlü Yönler: Öğrencinin bu hafta ivme kazandığı en güçlü 2 alanı takdir et.
3. Kritik Gelişim Alanları: En çok hata yaptığı veya net artışı için en kritik 2 konuyu net tavsiyelerle belirt.
4. Altın Stratejiler: Gelecek hafta için uygulanabilir, net 3 madde halinde eylem adımı yaz.
`}

YANIT FORMATI:
SADECE aşağıdaki JSON şemasına tam uyan geçerli bir JSON nesnesi döndür, markdown formatlama (kod bloğu) dışında hiçbir metin yazma:

{
  "headline": "Haftanın İvme Başlığı (Örn: 'Disiplinli Çalışma ve İstikrarlı Net Artışı')",
  "overallScore": 85,
  "overallEvaluation": "Öğrencinin haftalık genel temposunu, güçlü yanlarını ve gelişimini özetleyen 2-3 cümlelik koçluk değerlendirmesi.",
  "estimatedRankBand": "15.000 - 22.000",
  "rankBandExplanation": "Mevcut netlerin ve çalışma disiplinin seni hedefine yaklaştırıyor...",
  "topStrengths": [
    {
      "subject": "TYT Matematik",
      "detail": "Problemlerde yakaladığın %88 doğruluk oranı haftanın en büyük kazanımı oldu."
    },
    {
      "subject": "Düzenli Tekrar",
      "detail": "Hata defterindeki 12 soruyu pekiştirerek öğrenme kalıcılığını sağladın."
    }
  ],
  "criticalFocusAreas": [
    {
      "subject": "AYT Fizik",
      "topic": "Elektromanyetizma",
      "actionAdvice": "Bu konuda hata oranı yüksek. Hafta başında 2 test tarama ve özet video tekrarı planlanmalı."
    },
    {
      "subject": "Geometri",
      "topic": "Üçgende Alan",
      "actionAdvice": "Günlük 10 soru geometri rutini ekleyerek hız ve görme kabiliyetini pekiştir."
    }
  ],
  "goldenActionStrategies": [
    "1. Sabah saatlerini en zorlandığın ders olan AYT Fizik çalışmalarına ayır.",
    "2. Günlük 20 Paragraf rutinini aksatmadan devam ettirerek okuma hızını koru.",
    "3. Hafta sonu çözülecek TYT denemesinde süre yönetimini Türkçe 45 dk olarak sınırla."
  ],
  "coachMotivationNote": "Unutma; şampiyonlar büyük günlerde değil, her gün masaya koydukları küçük adımlarla yetişir. Bu hafta gösterdiğin gayret hedefine giden yolda çok kıymetli! 🚀"
}`;

    const targetModel = featureModelConfig['WEEKLY_REPORT_CARD'] || featureModelConfig['AI_COACH'] || 'SYSTEM_DEFAULT';

    const unifiedResult = await executeAiUnifiedRequest({
      prompt: systemPrompt,
      requireJson: true,
      featureKey: 'WEEKLY_REPORT_CARD',
      modelOverride: targetModel,
      maxTokens: 2500
    });

    const parsedData = cleanAndParseJson(unifiedResult.text);
    const { userName, userRole, userId } = resolveUserInfo(req.body);

    const usageRecord = recordApiUsage({
      featureKey: 'WEEKLY_REPORT_CARD',
      featureName: 'Haftalık Yapay Zeka Başarı Karnesi',
      category: 'AI_COACH',
      provider: unifiedResult.providerUsed,
      modelUsed: unifiedResult.modelUsed,
      promptTokens: unifiedResult.promptTokens || Math.ceil(systemPrompt.length / 4),
      candidatesTokens: unifiedResult.candidatesTokens || Math.ceil((unifiedResult.text || '').length / 4),
      promptText: studentInfo,
      responseText: unifiedResult.text,
      userId,
      userName,
      userRole
    });

    res.json({
      success: true,
      data: parsedData,
      aiUsage: usageRecord
    });
  } catch (err: any) {
    console.error('Weekly report card error:', err);
    res.status(500).json({ error: formatGeminiErrorMessage(err, 'Haftalık yapay zeka karnesi oluşturulurken bir hata meydana geldi.') });
  }
});

export default router;
