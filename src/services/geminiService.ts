import { YKSDataState, AICoachAdvice, ClassAICoachAdvice, UserAccount } from '../types';

export async function fetchAICoachAdvice(state: YKSDataState, currentUser?: UserAccount | null): Promise<{ advice: AICoachAdvice; aiUsage?: any }> {
  let pomodoroHistory = (state as any).pomodoroHistory;
  if (!pomodoroHistory) {
    try {
      pomodoroHistory = JSON.parse(localStorage.getItem('yks_pomodoro_history') || '[]');
    } catch {
      pomodoroHistory = [];
    }
  }

  const res = await fetch('/api/gemini/coach-advice', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userName: currentUser?.name || state.profile?.name || 'Öğrenci',
      userEmail: currentUser?.email || (state.profile as any)?.email || '',
      userRole: currentUser?.role || (state.profile as any)?.role || 'student',
      userId: currentUser?.id || (state.profile as any)?.id || '',
      profile: state.profile,
      questionLogs: state.questionLogs,
      generalMocks: state.generalMocks,
      topicErrors: state.topicErrors,
      routines: state.routines,
      studyPlans: state.studyPlans,
      resources: state.resources,
      branchExams: state.branchExams,
      institutionalMocks: state.institutionalMocks,
      youtubeVideos: state.youtubeVideos,
      pomodoroHistory,
      earnedBadges: state.earnedBadges,
      motivationStats: state.motivationStats
    })
  });

  if (!res.ok) {
    let errorMsg = 'Yapay zeka özellikleri şu an için kullanılamıyor, lütfen daha sonra tekrar deneyiniz.';
    try {
      const errData = await res.json();
      if (errData && errData.error) {
        errorMsg = errData.error;
      }
    } catch {
      // Fallback message
    }
    throw new Error(errorMsg);
  }

  const data = await res.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return { advice: data.advice, aiUsage: data.aiUsage };
}

export async function fetchClassAICoachAdvice(
  classSummaryData: {
    className: string;
    studentCount: number;
    averageTYTNet: number;
    averageAYTNet: number;
    totalQuestionsSolved: number;
    topStrugglingTopics: string[];
    studentsSummary: { name: string; tytNet: number; aytNet: number; topWeakTopic: string }[];
  },
  currentUser?: UserAccount | null
): Promise<{ advice: ClassAICoachAdvice; aiUsage?: any }> {
  const res = await fetch('/api/gemini/class-coach-advice', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userName: currentUser?.name || 'Öğretmen / Rehberlik',
      userEmail: currentUser?.email || '',
      userRole: currentUser?.role || 'class_teacher',
      userId: currentUser?.id || '',
      ...classSummaryData
    })
  });

  if (!res.ok) {
    let errorMsg = 'Yapay zeka özellikleri şu an için kullanılamıyor, lütfen daha sonra tekrar deneyiniz.';
    try {
      const errData = await res.json();
      if (errData && errData.error) {
        errorMsg = errData.error;
      }
    } catch {
      // Fallback message
    }
    throw new Error(errorMsg);
  }

  const data = await res.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return { advice: data.advice, aiUsage: data.aiUsage };
}

export async function sendAICoachChatMessage(
  message: string,
  chatHistory: { sender: 'user' | 'ai'; text: string }[],
  state: YKSDataState,
  currentUser?: UserAccount | null,
  classContext?: {
    className: string;
    studentCount: number;
    averageTYTNet: number;
    averageAYTNet: number;
    topStrugglingTopics: string[];
    studentsSummary?: { name: string; tytNet: number; aytNet: number; topWeakTopic: string }[];
  }
): Promise<{ reply: string; aiUsage?: any }> {
  const res = await fetch('/api/gemini/coach-chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      chatHistory,
      userName: currentUser?.name || state.profile?.name || 'Öğrenci',
      userEmail: currentUser?.email || (state.profile as any)?.email || '',
      userRole: currentUser?.role || (state.profile as any)?.role || 'student',
      userId: currentUser?.id || (state.profile as any)?.id || '',
      profile: state.profile,
      questionLogs: state.questionLogs,
      generalMocks: state.generalMocks,
      topicErrors: state.topicErrors,
      routines: state.routines,
      branchExams: state.branchExams,
      classContext
    })
  });

  if (!res.ok) {
    let errorMsg = `Sunucu hatası (${res.status}): Yapay zeka koç yanıtı alınamadı.`;
    try {
      const rawText = await res.text();
      try {
        const errData = JSON.parse(rawText);
        if (errData && errData.error) {
          errorMsg = errData.error;
        }
      } catch {
        if (rawText && rawText.length < 200) {
          errorMsg = rawText;
        }
      }
    } catch {
      // Fallback
    }
    throw new Error(errorMsg);
  }

  const data = await res.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return { reply: data.reply, aiUsage: data.aiUsage };
}

export interface SmartAddParsedFields {
  subject?: string;
  topicName?: string;
  publisher?: string;
  mockTitle?: string;
  totalQuestions?: number;
  correct?: number;
  wrong?: number;
  empty?: number;
  net?: number;
  durationMinutes?: number;
  date?: string;
  time?: string;
  errorReason?: string;
  examType?: string;
  bookName?: string;
  routineTitle?: string;
  tytNets?: {
    turkce?: number;
    sosyal?: number;
    matematik?: number;
    fen?: number;
    [key: string]: any;
  };
  aytNets?: {
    matematik?: number;
    fen?: number;
    edebiyatSos1?: number;
    edebiyat?: number;
    sos2?: number;
    sosyal?: number;
    [key: string]: any;
  };
  ydtNet?: number;
  notes?: string;
  [key: string]: any;
}

export interface SmartAddParsedResult {
  intent: 'QUESTION_LOG' | 'TOPIC_ERROR' | 'BRANCH_EXAM' | 'GENERAL_MOCK' | 'STUDY_PLAN' | 'STUDY_SESSION' | 'RESOURCE_BOOK' | 'ROUTINE';
  targetTab: 'questions' | 'errors' | 'branches' | 'mocks' | 'planner' | 'study' | 'resources' | 'routines';
  confidence: number;
  summary: string;
  explanation?: string;
  fields: SmartAddParsedFields;
}

export async function parseUserQuickAddIntent(
  prompt: string,
  currentUser?: UserAccount | null
): Promise<{ data: SmartAddParsedResult; aiUsage?: any }> {
  const todayDate = new Date().toISOString().split('T')[0];

  const res = await fetch('/api/gemini/parse-intent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt,
      todayDate,
      userName: currentUser?.name || 'Öğrenci',
      userEmail: currentUser?.email || '',
      userRole: currentUser?.role || 'student',
      userId: currentUser?.id || ''
    })
  });

  if (!res.ok) {
    let errorMsg = 'Yapay zeka niyet analizi yapılamadı.';
    try {
      const errData = await res.json();
      if (errData && errData.error) {
        errorMsg = errData.error;
      }
    } catch {
      // Fallback
    }
    throw new Error(errorMsg);
  }

  const result = await res.json();
  if (result.error) {
    throw new Error(result.error);
  }
  return { data: result.data, aiUsage: result.aiUsage };
}

export interface WeeklyReportCardData {
  headline: string;
  overallScore: number;
  overallEvaluation: string;
  estimatedRankBand: string;
  rankBandExplanation: string;
  topStrengths: Array<{
    subject: string;
    detail: string;
  }>;
  criticalFocusAreas: Array<{
    subject: string;
    topic: string;
    actionAdvice: string;
  }>;
  goldenActionStrategies: string[];
  coachMotivationNote: string;
}

export async function generateWeeklyAiReportCard(
  payload: {
    studentName?: string;
    targetField?: string;
    targetGoal?: string;
    weekLabel?: string;
    weeklyStats?: any;
    subjectBreakdown?: any[];
    latestMocks?: any[];
    topMistakeTopics?: any[];
  },
  currentUser?: UserAccount | null
): Promise<{ data: WeeklyReportCardData; aiUsage?: any }> {
  const res = await fetch('/api/gemini/generate-weekly-report-card', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...payload,
      userName: currentUser?.name || 'Öğrenci',
      userEmail: currentUser?.email || '',
      userRole: currentUser?.role || 'student',
      userId: currentUser?.id || ''
    })
  });

  if (!res.ok) {
    let errorMsg = 'Haftalık yapay zeka karnesi oluşturulamadı.';
    try {
      const errData = await res.json();
      if (errData && errData.error) {
        errorMsg = errData.error;
      }
    } catch {}
    throw new Error(errorMsg);
  }

  const result = await res.json();
  if (result.error) {
    throw new Error(result.error);
  }
  return { data: result.data, aiUsage: result.aiUsage };
}

