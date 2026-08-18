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
