import { YKSDataState, AICoachAdvice, ClassAICoachAdvice } from '../types';

export async function fetchAICoachAdvice(state: YKSDataState): Promise<{ advice: AICoachAdvice; aiUsage?: any }> {
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
      pomodoroHistory
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

export async function fetchClassAICoachAdvice(classSummaryData: {
  className: string;
  studentCount: number;
  averageTYTNet: number;
  averageAYTNet: number;
  totalQuestionsSolved: number;
  topStrugglingTopics: string[];
  studentsSummary: { name: string; tytNet: number; aytNet: number; topWeakTopic: string }[];
}): Promise<{ advice: ClassAICoachAdvice; aiUsage?: any }> {
  const res = await fetch('/api/gemini/class-coach-advice', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(classSummaryData)
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
