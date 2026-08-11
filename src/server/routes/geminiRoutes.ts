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
  setAnomalyLimitTRY,
  setCoachDataSettings,
  setFeatureModelConfig,
  savePromptLogs,
  setSavePromptLogs,
  clearApiUsageLogs,
  uploadsDir
} from '../config';

const router = Router();

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

  // 3. Check for local upload relative path or URL containing /uploads/
  let relativePath = cleanUrl;
  if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
    try {
      const parsedUrl = new URL(cleanUrl);
      relativePath = parsedUrl.pathname;
    } catch {}
  }

  if (relativePath.includes('/uploads/')) {
    const relSubPath = relativePath.split('/uploads/')[1];
    if (relSubPath) {
      const fullPath = path.join(uploadsDir, relSubPath);
      if (fs.existsSync(fullPath)) {
        const buffer = fs.readFileSync(fullPath);
        const ext = path.extname(relSubPath).toLowerCase();
        let mimeType = 'image/jpeg';
        if (ext === '.png') mimeType = 'image/png';
        else if (ext === '.webp') mimeType = 'image/webp';
        else if (ext === '.gif') mimeType = 'image/gif';
        return {
          inlineData: { mimeType, data: buffer.toString('base64') }
        };
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

// Helper summarizers for AI prompts
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
// Gemini AI Endpoints
// -------------------------------------------------------------

router.post('/coach-advice', async (req, res) => {
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

    const responseText = extractResponseText(response);
    const parsedData = JSON.parse(responseText || '{}');

    const { userName, userRole, userId } = resolveUserInfo(req.body);

    const usageRecord = recordApiUsage({
      featureKey: 'AI_COACH_STUDENT',
      featureName: 'Öğrenci Bireysel Yapay Zeka Koç Tavsiyesi',
      category: 'AI_COACH',
      modelUsed,
      promptTokens: response.usageMetadata?.promptTokenCount || Math.ceil(prompt.length / 4),
      candidatesTokens: response.usageMetadata?.candidatesTokenCount || Math.ceil(responseText.length / 4),
      promptText: prompt,
      responseText,
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
    console.error('Gemini AI Coach error:', err);
    res.status(500).json({ error: err.message || 'Yapay Zeka koç tavsiyesi üretilemedi.' });
  }
});

router.post('/class-coach-advice', async (req, res) => {
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

    const responseText = extractResponseText(response);
    const parsedData = JSON.parse(responseText || '{}');

    const { userName, userRole, userId } = resolveUserInfo(req.body);

    const usageRecord = recordApiUsage({
      featureKey: 'AI_COACH_CLASS',
      featureName: 'Sınıf / Okul Genel Koç Analizi',
      category: 'AI_COACH',
      modelUsed,
      promptTokens: response.usageMetadata?.promptTokenCount || Math.ceil(prompt.length / 4),
      candidatesTokens: response.usageMetadata?.candidatesTokenCount || Math.ceil(responseText.length / 4),
      promptText: prompt,
      responseText,
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
    console.error('Gemini Class AI Coach error:', err);
    res.status(500).json({ error: err.message || 'Yapay Zeka sınıf koçluk tavsiyesi üretilemedi.' });
  }
});

router.post('/analyze-error-priority', async (req, res) => {
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
  "rating": 5,
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

    const responseText = extractResponseText(response);
    const parsedData = JSON.parse(responseText || '{}');

    const { userName, userRole, userId } = resolveUserInfo(req.body);

    const usageRecord = recordApiUsage({
      featureKey: 'ERROR_PRIORITY',
      featureName: 'Öncelikli Hata Konuları Analizi',
      category: 'QUESTION_ANALYSIS',
      modelUsed,
      promptTokens: response.usageMetadata?.promptTokenCount || Math.ceil(prompt.length / 4),
      candidatesTokens: response.usageMetadata?.candidatesTokenCount || Math.ceil(responseText.length / 4),
      promptText: prompt,
      responseText,
      userId,
      userName,
      userRole
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

router.post('/topic-mistake-tips', async (req, res) => {
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

    const responseText = extractResponseText(response);
    const parsedData = JSON.parse(responseText || '{}');

    const { userName, userRole, userId } = resolveUserInfo(req.body);

    const usageRecord = recordApiUsage({
      featureKey: 'TOPIC_TIPS',
      featureName: 'Konu Bazlı Pratik Taktikler',
      category: 'QUESTION_ANALYSIS',
      modelUsed,
      promptTokens: response.usageMetadata?.promptTokenCount || Math.ceil(prompt.length / 4),
      candidatesTokens: response.usageMetadata?.candidatesTokenCount || Math.ceil(responseText.length / 4),
      promptText: prompt,
      responseText,
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
    console.error('Gemini mistake tips error:', err);
    res.status(500).json({ error: err.message || 'Yapay zeka konu ipuçları üretilemedi.' });
  }
});

router.post('/solve-question', async (req, res) => {
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
    const imagePart = imageUrl ? await resolveImagePart(imageUrl) : null;

    if (solutionText || existingAnalysis) {
      const textPart = {
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
      };
      contents = imagePart ? [imagePart, textPart] : [textPart];
    } else {
      if (!imagePart) {
        return res.status(400).json({ error: 'Görsel dosyasına ulaşılamadı veya format geçersiz.' });
      }

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
- KESİNLİKLE LaTeX formatı ($...$, $$...$$, \\implies, \\cdot, \\frac vb.) KULLANMA.
- Matematiksel ve geometrik ifadeleri herkesin kolayca okuyabileceği, normal bilgisayar klavyesi karakterleriyle düz metin olarak yaz.`
      };

      contents = [imagePart, textPart];
    }

    const targetModel = featureModelConfig['SOLVE_QUESTION'] || 'gemini-3.1-flash-lite';
    const { response, modelUsed } = await generateContentWithFallback(ai, {
      model: targetModel,
      contents
    });

    const responseText = extractResponseText(response);

    const { userName, userRole, userId } = resolveUserInfo(req.body);

    const promptSummary = solutionText || existingAnalysis || `Hata Defteri Soru Görsel Çözüm Analizi (${subject || ''} - ${topicName || ''})`;
    const usageRecord = recordApiUsage({
      featureKey: 'SOLVE_QUESTION',
      featureName: 'Hata Defteri Soru Çözümü',
      category: 'QUESTION_ANALYSIS',
      modelUsed,
      promptTokens: response.usageMetadata?.promptTokenCount || 2000,
      candidatesTokens: response.usageMetadata?.candidatesTokenCount || Math.ceil(responseText.length / 4),
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
    console.error('Gemini question solver error:', err);
    res.status(500).json({ error: err.message || 'Yapay zeka soru çözümü üretilemedi.' });
  }
});

router.post('/similar-questions', async (req, res) => {
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
    const imagePart = imageUrl ? await resolveImagePart(imageUrl) : null;

    if (solutionText || existingAnalysis) {
      const textPart = {
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
      };
      contents = imagePart ? [imagePart, textPart] : [textPart];
    } else {
      if (!imagePart) {
        return res.status(400).json({ error: 'Görsel dosyasına ulaşılamadı veya format geçersiz.' });
      }

      const textPart = {
        text: `Sen Türkiye YKS (Yükseköğretim Kurumları Sınavı) hazırlık sürecindeki öğrencilere rehberlik eden ve soru üreten uzman bir öğretmenisin.
Görseldeki soruyu ve konuyu (${subject} - ${topicName}) incele.
Bu soruya benzer tarzda, öğrencinin konuyu pekiştirmesini ve mantığını kavramasını sağlayacak SADECE 1 (BİR) tane kaliteli, yeni benzer soru üret.

Kesinlikle selamlaşma, "İşte senin için soru", "Başarılar dilerim" gibi hiçbir konuşma cümlesi ekleme. Direkt soruyu, çözümünü ve doğru cevabını JSON alanlarında doldur.

ÖNEMLİ MATEMATİKSEL BİÇİMLENDİRME KURALLARI:
- KESİNLİKLE LaTeX formatı ($...$, $$...$$, \\implies, \\cdot, \\frac vb.) KULLANMA.
- Matematiksel ve geometrik ifadeleri herkesin kolayca okuyabileceği, normal bilgisayar klavyesi karakterleriyle düz metin olarak yaz.`
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
    const responseText = extractResponseText(response);
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

    const { userName, userRole, userId } = resolveUserInfo(req.body);

    const promptSummary = solutionText || existingAnalysis || `Benzer Soru Üretimi Promptu (${subject || ''} - ${topicName || ''})`;
    const usageRecord = recordApiUsage({
      featureKey: 'SIMILAR_QUESTION',
      featureName: 'Benzer Soru Üretimi',
      category: 'QUESTION_ANALYSIS',
      modelUsed,
      promptTokens: response.usageMetadata?.promptTokenCount || 1800,
      candidatesTokens: response.usageMetadata?.candidatesTokenCount || Math.ceil(responseText.length / 4),
      promptText: promptSummary,
      responseText,
      userId,
      userName,
      userRole
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

router.post('/analyze-question-details', async (req, res) => {
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
    const imagePart = imageUrl ? await resolveImagePart(imageUrl) : null;

    if (solutionText || existingAnalysis) {
      const textPart = {
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
- Çeldirici Analizi Kuralı: Soruda şıklar (A, B, C, D, E) varsa TÜM şıkların ayrı ayrı çeldirici analizini yap. Eğer soruda şık yoksa "Olası Hatalı Yaklaşımlar / Hatalı Cevaplar" analizi yap.
- KESİNLİKLE LaTeX formatı ($...$, $$...$$, \\implies, \\cdot, \\frac vb.) KULLANMA.
- Tablonun Markdown sözdizimini bozacak karakterler kullanmaktan kaçın.`
      };
      contents = imagePart ? [imagePart, textPart] : [textPart];
    } else {
      if (!imagePart) {
        return res.status(400).json({ error: 'Görsel dosyasına ulaşılamadı veya format geçersiz.' });
      }

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
- Çeldirici Analizi Kuralı: Soruda şıklar (A, B, C, D, E) varsa TÜM şıkların ayrı ayrı çeldirici analizini yap. Eğer soruda şık yoksa "Olası Hatalı Yaklaşımlar / Hatalı Cevaplar" analizi yap.
- KESİNLİKLE LaTeX formatı ($...$, $$...$$, \\implies, \\cdot, \\frac vb.) KULLANMA.
- Tablonun Markdown sözdizimini bozacak karakterler kullanmaktan kaçın.`
      };

      contents = [imagePart, textPart];
    }

    const targetModel = featureModelConfig['QUESTION_ANALYSIS'] || 'gemini-3.1-flash-lite';
    const { response, modelUsed } = await generateContentWithFallback(ai, {
      model: targetModel,
      contents
    });

    const responseText = extractResponseText(response);

    const { userName, userRole, userId } = resolveUserInfo(req.body);

    const promptSummary = solutionText || existingAnalysis || `Detaylı Soru & Çeldirici Analizi Promptu (${subject || ''} - ${topicName || ''})`;
    const usageRecord = recordApiUsage({
      featureKey: 'QUESTION_ANALYSIS',
      featureName: 'Detaylı Soru & Çeldirici Analizi',
      category: 'QUESTION_ANALYSIS',
      modelUsed,
      promptTokens: response.usageMetadata?.promptTokenCount || 2100,
      candidatesTokens: response.usageMetadata?.candidatesTokenCount || Math.ceil(responseText.length / 4),
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
    console.error('Gemini question analysis error:', err);
    res.status(500).json({ error: err.message || 'Yapay zeka soru analizi üretilemedi.' });
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

router.get('/model-settings', (req, res) => {
  res.json({
    success: true,
    aiFeaturesEnabled,
    savePromptLogs,
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

router.post('/model-settings', (req, res) => {
  const { config, aiFeaturesEnabled: newEnabledState, savePromptLogs: newSavePromptLogs, anomalyLimitTRY: newAnomalyLimit, coachDataSettings: newCoachDataSettings } = req.body;
  if (typeof newEnabledState === 'boolean') {
    setAiFeaturesEnabled(newEnabledState);
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
      sanitized[k] = (v === 'gemini-2.5-flash-lite' || v === 'gemini-3.5-flash-lite') ? 'gemini-3.1-flash-lite' : String(v);
    }
    setFeatureModelConfig({ ...featureModelConfig, ...sanitized });
  }

  if (db) {
    setDoc(doc(db, 'system_config', 'gemini_settings'), {
      aiFeaturesEnabled,
      savePromptLogs,
      featureModelConfig,
      anomalyLimitTRY,
      coachDataSettings
    }).catch(err => console.error('Failed to save settings to Firestore:', err));
  }

  return res.json({ 
    success: true, 
    aiFeaturesEnabled,
    savePromptLogs,
    config: featureModelConfig, 
    anomalyLimitTRY,
    coachDataSettings,
    message: aiFeaturesEnabled 
      ? 'Yapay zeka ayarları başarıyla güncellendi ve sistem aktif kılındı.'
      : 'Tüm yapay zeka servisleri rehber öğretmen / yönetici kararıyla KAPATILDI.'
  });
});

export default router;
