import { YKSDataState, UserAccount } from '../types';
import { 
  INITIAL_STATE, 
  INITIAL_STUDENT_2_STATE, 
  INITIAL_STUDENT_3_STATE, 
  INITIAL_STUDENT_4_STATE 
} from '../data/initialData';
import { INITIAL_GLOBAL_STATE } from '../services/storage';

/**
 * Resolves full YKSDataState for any student with 100% guarantee.
 * - Handles Demo accounts (student-1 / Ahmet Yılmaz, student-2 / Zeynep, student-3 / Mehmet, student-4 / Burak)
 * - Merges any existing Firestore/state data safely without wiping user-entered records
 * - Ensures newly created/custom students always have valid arrays and profile data
 */
export function resolveStudentData(
  student: { id: string; email?: string; name?: string; className?: string } | UserAccount | string,
  studentsData?: Record<string, YKSDataState>
): YKSDataState {
  const studentObj = typeof student === 'string' ? { id: student } : student;
  const studentId = studentObj?.id || '';
  const email = (studentObj as any)?.email || '';
  const name = (studentObj as any)?.name || '';
  const className = (studentObj as any)?.className || '';

  const isAhmet = studentId === 'student-1' || email === 'ahmet@okul.edu.tr' || name.toLowerCase().includes('ahmet');
  const isBurak = studentId === 'student-4' || email === 'burak@okul.edu.tr' || name.toLowerCase().includes('burak');
  const isZeynep = studentId === 'student-2' || email === 'zeynep@okul.edu.tr' || name.toLowerCase().includes('zeynep');
  const isMehmet = studentId === 'student-3' || email === 'mehmet@okul.edu.tr' || name.toLowerCase().includes('mehmet');

  const baseDefaults: YKSDataState = isAhmet
    ? INITIAL_STATE
    : isBurak
    ? INITIAL_STUDENT_4_STATE
    : isZeynep
    ? INITIAL_STUDENT_2_STATE
    : isMehmet
    ? INITIAL_STUDENT_3_STATE
    : (INITIAL_GLOBAL_STATE.studentsData?.[studentId] || {
        profile: {
          name: name || 'Öğrenci',
          className: className || '12-A SAY',
          targetUniversity: 'Hedef Belirlenmedi',
          targetDepartment: '',
          targetField: 'SAY',
          targetRank: 50000,
          currentTYTNet: 0,
          currentAYTNet: 0,
          dailyGoalQuestions: 150,
          dailyGoalHours: 4,
          coachName: '',
          coachNotes: ''
        },
        questionLogs: [],
        studyPlans: [],
        generalMocks: [],
        branchExams: [],
        topicErrors: [],
        resources: [],
        resourceTrackers: [],
        routines: [],
        youtubeVideos: [],
        topics: {},
        pomodoroHistory: []
      });

  const rawData = (studentsData && studentsData[studentId])
    || (isAhmet ? INITIAL_STATE : undefined)
    || (isBurak ? INITIAL_STUDENT_4_STATE : undefined)
    || (isZeynep ? INITIAL_STUDENT_2_STATE : undefined)
    || (isMehmet ? INITIAL_STUDENT_3_STATE : undefined)
    || INITIAL_GLOBAL_STATE.studentsData?.[studentId]
    || {};

  return {
    ...baseDefaults,
    ...rawData,
    profile: {
      ...baseDefaults.profile,
      ...(rawData.profile || {}),
      name: name || rawData.profile?.name || baseDefaults.profile?.name || 'Öğrenci',
      className: className || rawData.profile?.className || baseDefaults.profile?.className || '12-A SAY'
    },
    questionLogs: (Array.isArray(rawData.questionLogs)
      ? rawData.questionLogs
      : (baseDefaults.questionLogs || [])).map(log => {
        if (log.topic && log.topic.trim()) return log;
        const initialMatch = INITIAL_STATE.questionLogs.find(iLog => iLog.id === log.id || (iLog.date === log.date && iLog.subject === log.subject));
        return {
          ...log,
          topic: initialMatch?.topic || log.notes || 'Genel Soru Çözümü'
        };
      }),
    studyPlans: Array.isArray(rawData.studyPlans)
      ? rawData.studyPlans
      : (baseDefaults.studyPlans || []),
    generalMocks: Array.isArray(rawData.generalMocks)
      ? rawData.generalMocks
      : (baseDefaults.generalMocks || []),
    branchExams: Array.isArray(rawData.branchExams)
      ? rawData.branchExams
      : (baseDefaults.branchExams || []),
    topicErrors: Array.isArray(rawData.topicErrors)
      ? rawData.topicErrors
      : (baseDefaults.topicErrors || []),
    resources: Array.isArray(rawData.resources)
      ? rawData.resources
      : Array.isArray(rawData.resourceTrackers)
      ? rawData.resourceTrackers
      : (baseDefaults.resources || []),
    resourceTrackers: Array.isArray(rawData.resourceTrackers)
      ? rawData.resourceTrackers
      : Array.isArray(rawData.resources)
      ? rawData.resources
      : (baseDefaults.resourceTrackers || baseDefaults.resources || []),
    routines: Array.isArray(rawData.routines)
      ? rawData.routines
      : (baseDefaults.routines || []),
    youtubeVideos: Array.isArray(rawData.youtubeVideos)
      ? rawData.youtubeVideos
      : (baseDefaults.youtubeVideos || []),
    topics: rawData.topics || baseDefaults.topics || {},
    pomodoroHistory: Array.isArray((rawData as any).pomodoroHistory)
      ? (rawData as any).pomodoroHistory
      : (baseDefaults.pomodoroHistory || [])
  };
}

