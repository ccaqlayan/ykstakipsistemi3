import { UserAccount, DirectMessage, ClassDefinition } from '../types';

/**
 * Resolves the creation or registration timestamp (in ms) of a user account.
 */
export function getUserCreationTime(user: UserAccount | null | undefined): number {
  if (!user) return 0;
  if (user.createdAt) {
    const t = new Date(user.createdAt).getTime();
    if (!isNaN(t) && t > 0) return t;
  }
  if ((user as any).registeredAt) {
    const t = new Date((user as any).registeredAt).getTime();
    if (!isNaN(t) && t > 0) return t;
  }
  if ((user as any).joinedAt) {
    const t = new Date((user as any).joinedAt).getTime();
    if (!isNaN(t) && t > 0) return t;
  }
  // If id has format student-<timestamp> or teacher-<timestamp>
  if (user.id) {
    const parts = user.id.split('-');
    if (parts.length >= 2) {
      const num = Number(parts[1]);
      if (!isNaN(num) && num > 1600000000000 && num < 2500000000000) {
        return num;
      }
    }
  }
  return 0;
}

/**
 * Robustly evaluate whether a message is unread for a specific user account.
 */
export function isMessageUnreadForUser(
  m: DirectMessage | null | undefined,
  user: UserAccount | null | undefined,
  classes?: ClassDefinition[]
): boolean {
  if (!m || !user || !m.senderId || m.senderId === user.id) return false;

  // 0. If user has already read the message via readBy array
  if (m.readBy && Array.isArray(m.readBy)) {
    const isReadByThisUser = m.readBy.some(r => {
      if (!r || !r.userId) return false;
      if (r.userId === user.id) return true;
      if (user.email && r.userId === user.email) return true;
      // Cross-match known demo user IDs and their Firestore Auth UIDs
      if (user.id === 'teacher-3' && r.userId === 'lK0LITqb2tbRa7pFI0r0Vf6Y2Al2') return true;
      if (user.id === 'lK0LITqb2tbRa7pFI0r0Vf6Y2Al2' && r.userId === 'teacher-3') return true;
      if (user.id === 'student-1' && r.userId === 'WMNlPvFggXQJk4DGF03v2vAPBjf1') return true;
      if (user.id === 'WMNlPvFggXQJk4DGF03v2vAPBjf1' && r.userId === 'student-1') return true;
      return false;
    });
    if (isReadByThisUser) return false;
  }

  const userCreatedAt = getUserCreationTime(user);
  const msgTime = m.timestampMs || (m.timestamp ? new Date(m.timestamp).getTime() : 0);

  // 1. Group Chat (class-group-...)
  if (m.receiverId?.startsWith('class-group-')) {
    const rawGroupId = m.receiverId.replace('class-group-', '').trim();
    const role = user.role;

    let isMember = false;
    if (role === 'admin' || role === 'school_counselor') {
      isMember = true;
    } else if (role === 'student') {
      const userClass = (user.className || '').trim().toLowerCase();
      if (classes && classes.length > 0) {
        const userClassDef = classes.find(c => (c.name || '').trim().toLowerCase() === userClass);
        if (userClassDef && (userClassDef.id === rawGroupId || userClassDef.name.toLowerCase() === rawGroupId.toLowerCase())) {
          isMember = true;
        }
      }
      if (!isMember && userClass) {
        const target = rawGroupId.toLowerCase();
        if (target === userClass || target.includes(userClass) || userClass.includes(target)) {
          isMember = true;
        }
      }
    } else if (role === 'teacher' || role === 'class_teacher') {
      const assigned = (user.assignedClassNames || []).map(c => c.trim().toLowerCase());
      if (classes && classes.length > 0) {
        const matchingClassDefs = classes.filter(c => 
          assigned.includes(c.name.toLowerCase()) || c.assignedTeacherIds?.includes(user.id)
        );
        if (matchingClassDefs.some(c => c.id === rawGroupId || c.name.toLowerCase() === rawGroupId.toLowerCase())) {
          isMember = true;
        }
      }
      if (!isMember) {
        const target = rawGroupId.toLowerCase();
        if (assigned.some(c => c === target || target.includes(c) || c.includes(target))) {
          isMember = true;
        }
      }
    }

    if (!isMember) return false;

    // Filter out group messages sent before user registered/joined
    if (userCreatedAt > 0 && role !== 'admin') {
      if (msgTime > 0 && msgTime < userCreatedAt) {
        return false;
      }
    }

    return true; // Not read by user yet
  }

  // 2. Broadcast Channel
  if (m.receiverId?.startsWith('broadcast-') || m.receiverId === 'broadcast-all') {
    const role = user.role;
    let relevant = false;
    if (m.receiverId === 'broadcast-all') relevant = true;
    if (m.receiverId === 'broadcast-students' && (role === 'student' || role === 'admin' || role === 'school_counselor' || role === 'class_teacher' || role === 'teacher')) relevant = true;
    if (m.receiverId === 'broadcast-teachers' && (role === 'teacher' || role === 'class_teacher' || role === 'school_counselor' || role === 'admin')) relevant = true;
    if (m.receiverId === 'broadcast-counselors' && (role === 'school_counselor' || role === 'admin' || role === 'class_teacher' || role === 'teacher')) relevant = true;

    if (!relevant) return false;

    // Filter out broadcast announcements sent before user registered/joined
    if (userCreatedAt > 0 && role !== 'admin') {
      if (msgTime > 0 && msgTime < userCreatedAt) {
        return false;
      }
    }

    return true; // Not read by user yet
  }

  // 3. Direct 1-on-1 Message
  if (m.receiverId === user.id || (user.email && (m as any).receiverEmail === user.email)) {
    return !m.isRead;
  }

  return false;
}

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
