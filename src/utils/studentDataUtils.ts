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
 * - Merges any existing Firestore/state data with default mock and curriculum data
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

  const isDemo = isAhmet || isBurak || isZeynep || isMehmet;

  return {
    ...baseDefaults,
    ...rawData,
    profile: {
      ...baseDefaults.profile,
      ...(rawData.profile || {}),
      name: name || rawData.profile?.name || baseDefaults.profile?.name || 'Öğrenci',
      className: className || rawData.profile?.className || baseDefaults.profile?.className || '12-A SAY'
    },
    questionLogs: ((rawData.questionLogs && rawData.questionLogs.length > 0)
      ? rawData.questionLogs
      : (isDemo ? baseDefaults.questionLogs : [])).map(log => {
        if (log.topic && log.topic.trim()) return log;
        const initialMatch = INITIAL_STATE.questionLogs.find(iLog => iLog.id === log.id || (iLog.date === log.date && iLog.subject === log.subject));
        return {
          ...log,
          topic: initialMatch?.topic || log.notes || 'Genel Soru Çözümü'
        };
      }),
    studyPlans: (rawData.studyPlans && rawData.studyPlans.length > 0)
      ? rawData.studyPlans
      : (isDemo ? baseDefaults.studyPlans : []),
    generalMocks: (rawData.generalMocks && rawData.generalMocks.length > 0)
      ? rawData.generalMocks
      : (isDemo ? baseDefaults.generalMocks : []),
    branchExams: (rawData.branchExams && rawData.branchExams.length > 0)
      ? rawData.branchExams
      : (isDemo ? baseDefaults.branchExams : []),
    topicErrors: (rawData.topicErrors && rawData.topicErrors.length > 0)
      ? rawData.topicErrors
      : (isDemo ? baseDefaults.topicErrors : []),
    resources: (rawData.resources && rawData.resources.length > 0)
      ? rawData.resources
      : (rawData.resourceTrackers && rawData.resourceTrackers.length > 0)
      ? rawData.resourceTrackers
      : (isDemo ? (baseDefaults.resources || []) : []),
    resourceTrackers: (rawData.resourceTrackers && rawData.resourceTrackers.length > 0)
      ? rawData.resourceTrackers
      : (rawData.resources && rawData.resources.length > 0)
      ? rawData.resources
      : (isDemo ? (baseDefaults.resourceTrackers || baseDefaults.resources || []) : []),
    routines: (rawData.routines && rawData.routines.length > 0)
      ? rawData.routines
      : (isDemo ? (baseDefaults.routines || []) : []),
    youtubeVideos: (rawData.youtubeVideos && rawData.youtubeVideos.length > 0)
      ? rawData.youtubeVideos
      : (isDemo ? (baseDefaults.youtubeVideos || []) : []),
    topics: rawData.topics || baseDefaults.topics || {},
    pomodoroHistory: (rawData as any).pomodoroHistory || (baseDefaults as any).pomodoroHistory || []
  };
}
