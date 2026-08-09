import { UserAccount } from '../types';

/**
 * Get configured active/passive and presence parameters from localStorage with sensible fallbacks.
 */
export function getStatusConfig() {
  const daysStr = localStorage.getItem('active_criteria_days');
  const questionsStr = localStorage.getItem('active_criteria_min_questions');
  const plansStr = localStorage.getItem('active_criteria_min_plans');
  const timeoutStr = localStorage.getItem('online_timeout_minutes');
  const showLastSeenStr = localStorage.getItem('show_last_seen_enabled');

  return {
    activeCriteriaDays: daysStr ? parseInt(daysStr, 10) : 7,
    activeCriteriaMinQuestions: questionsStr ? parseInt(questionsStr, 10) : 50,
    activeCriteriaMinPlans: plansStr ? parseInt(plansStr, 10) : 3,
    onlineTimeoutMinutes: timeoutStr ? parseInt(timeoutStr, 10) : 5,
    showLastSeenEnabled: showLastSeenStr === null ? true : showLastSeenStr === 'true'
  };
}

/**
 * Dynamically check if a user is online based on their isOnline status and last active timestamp.
 */
export function isUserOnline(user: UserAccount | null | undefined): boolean {
  if (!user) return false;
  if (!user.isOnline) return false;
  if (!user.lastActiveAt) return false;

  const config = getStatusConfig();
  const lastActiveTime = new Date(user.lastActiveAt).getTime();
  if (isNaN(lastActiveTime)) return false;

  const elapsedMs = Date.now() - lastActiveTime;
  const timeoutMs = config.onlineTimeoutMinutes * 60 * 1000;

  return elapsedMs < timeoutMs;
}

/**
 * Get user last seen status text for messaging and student views.
 * If user is online, returns "Çevrimiçi".
 * Otherwise, formats son görülme today time or "Çevrimdışı".
 */
export function getExactLastSeenText(user: UserAccount | null | undefined): string {
  if (!user || !user.lastActiveAt) return 'Hiç girmedi';
  
  const activeDate = new Date(user.lastActiveAt);
  if (isNaN(activeDate.getTime())) return 'Hiç girmedi';

  const today = new Date();
  const isToday = activeDate.getDate() === today.getDate() &&
                  activeDate.getMonth() === today.getMonth() &&
                  activeDate.getFullYear() === today.getFullYear();

  const day = String(activeDate.getDate()).padStart(2, '0');
  const month = String(activeDate.getMonth() + 1).padStart(2, '0');
  const year = activeDate.getFullYear();
  const hours = String(activeDate.getHours()).padStart(2, '0');
  const minutes = String(activeDate.getMinutes()).padStart(2, '0');

  if (isToday) {
    return `Son görülme bugün ${hours}:${minutes}`;
  }

  return `Son görülme ${day}.${month}.${year} ${hours}:${minutes}`;
}

export function getUserLastSeenText(user: UserAccount | null | undefined): string {
  if (!user) return 'Çevrimdışı';
  if (isUserOnline(user)) return 'Çevrimiçi';

  const config = getStatusConfig();
  if (!config.showLastSeenEnabled) {
    return 'Çevrimdışı';
  }

  if (!user.lastActiveAt) {
    return 'Çevrimdışı';
  }

  const activeDate = new Date(user.lastActiveAt);
  if (isNaN(activeDate.getTime())) {
    return 'Çevrimdışı';
  }

  const today = new Date();
  const isToday = activeDate.getDate() === today.getDate() &&
                  activeDate.getMonth() === today.getMonth() &&
                  activeDate.getFullYear() === today.getFullYear();

  const day = String(activeDate.getDate()).padStart(2, '0');
  const month = String(activeDate.getMonth() + 1).padStart(2, '0');
  const year = activeDate.getFullYear();
  const hours = String(activeDate.getHours()).padStart(2, '0');
  const minutes = String(activeDate.getMinutes()).padStart(2, '0');

  if (isToday) {
    return `Son görülme bugün ${hours}:${minutes}`;
  }

  return `Son görülme ${day}.${month}.${year} ${hours}:${minutes}`;
}

/**
 * Robustly evaluate if a student is active or passive based on configurable parameters.
 * Evaluates questions solved and completed study plans within the specified days window.
 */
export function isStudentActive(studentId: string, studentData: any): boolean {
  if (!studentData) return false;

  const config = getStatusConfig();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - config.activeCriteriaDays);

  let solvedQuestionsCount = 0;
  let completedPlansCount = 0;

  // 1. Calculate solved questions within cutoff
  if (studentData.questionLogs && Array.isArray(studentData.questionLogs)) {
    studentData.questionLogs.forEach((ql: any) => {
      const qlDate = new Date(ql.date);
      if (isNaN(qlDate.getTime()) || qlDate >= cutoffDate) {
        solvedQuestionsCount += (ql.solvedCount || 0);
      }
    });
  }

  // 2. Calculate completed study plans within cutoff
  if (studentData.studyPlans && Array.isArray(studentData.studyPlans)) {
    studentData.studyPlans.forEach((sp: any) => {
      if (sp.status === 'completed') {
        if (sp.date) {
          const spDate = new Date(sp.date);
          if (isNaN(spDate.getTime()) || spDate >= cutoffDate) {
            completedPlansCount++;
          }
        } else {
          // Fallback if no date field is on the study plan item
          completedPlansCount++;
        }
      }
    });
  }

  // Active if either metric meets/exceeds its configured threshold
  return (solvedQuestionsCount >= config.activeCriteriaMinQuestions) || 
         (completedPlansCount >= config.activeCriteriaMinPlans);
}
