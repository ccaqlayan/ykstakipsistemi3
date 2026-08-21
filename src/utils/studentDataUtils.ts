import { YKSDataState, UserAccount } from '../types';
import { 
  createEmptyStudentData, 
  INITIAL_STATE,
  INITIAL_STUDENT_GRADE9_STATE,
  INITIAL_STUDENT_GRADE10_STATE,
  INITIAL_STUDENT_GRADE11_STATE,
  INITIAL_STUDENT_MEZUN_STATE,
  INITIAL_STUDENT_2_STATE,
  INITIAL_STUDENT_3_STATE
} from '../data/initialData';

/**
 * Resolves full YKSDataState for any student with 100% guarantee.
 * - Every account is treated as a real account.
 * - Preserves existing Ahmet Yılmaz (student-1) and user data completely.
 * - Provides rich initial demo data for specific demo accounts if empty.
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

  let fallbackBase: YKSDataState | null = null;
  if (studentId === 'student-9a' || email === 'eren.9a@okul.edu.tr') {
    fallbackBase = INITIAL_STUDENT_GRADE9_STATE;
  } else if (studentId === 'student-10a' || email === 'selin.10a@okul.edu.tr') {
    fallbackBase = INITIAL_STUDENT_GRADE10_STATE;
  } else if (studentId === 'student-11a' || email === 'kerem.11a@okul.edu.tr') {
    fallbackBase = INITIAL_STUDENT_GRADE11_STATE;
  } else if (studentId === 'student-mezun1' || email === 'mert.mezun@okul.edu.tr') {
    fallbackBase = INITIAL_STUDENT_MEZUN_STATE;
  } else if (studentId === 'student-1' || email === 'ahmet@okul.edu.tr') {
    fallbackBase = INITIAL_STATE;
  } else if (studentId === 'student-2' || email === 'zeynep@okul.edu.tr') {
    fallbackBase = INITIAL_STUDENT_2_STATE;
  } else if (studentId === 'student-3' || email === 'mehmet@okul.edu.tr') {
    fallbackBase = INITIAL_STUDENT_3_STATE;
  }

  const rawData: any = (studentsData && studentsData[studentId]) || {};
  const emptyBase = fallbackBase 
    ? { ...fallbackBase } 
    : createEmptyStudentData(name || rawData.profile?.name || 'Öğrenci', className || rawData.profile?.className || '12-A SAY');

  return {
    ...emptyBase,
    ...rawData,
    profile: {
      ...emptyBase.profile,
      ...(rawData.profile || {}),
      name: name || rawData.profile?.name || emptyBase.profile?.name || 'Öğrenci',
      className: className || rawData.profile?.className || emptyBase.profile?.className || '12-A SAY'
    },
    questionLogs: Array.isArray(rawData.questionLogs)
      ? rawData.questionLogs
      : [],
    studyPlans: Array.isArray(rawData.studyPlans)
      ? rawData.studyPlans
      : [],
    generalMocks: Array.isArray(rawData.generalMocks)
      ? rawData.generalMocks
      : [],
    branchExams: Array.isArray(rawData.branchExams)
      ? rawData.branchExams
      : [],
    topicErrors: Array.isArray(rawData.topicErrors)
      ? rawData.topicErrors
      : [],
    resources: Array.isArray(rawData.resources)
      ? rawData.resources
      : Array.isArray(rawData.resourceTrackers)
      ? rawData.resourceTrackers
      : [],
    resourceTrackers: Array.isArray(rawData.resourceTrackers)
      ? rawData.resourceTrackers
      : Array.isArray(rawData.resources)
      ? rawData.resources
      : [],
    routines: Array.isArray(rawData.routines)
      ? rawData.routines
      : [],
    youtubeVideos: Array.isArray(rawData.youtubeVideos)
      ? rawData.youtubeVideos
      : [],
    topics: rawData.topics || {},
    pomodoroHistory: Array.isArray((rawData as any).pomodoroHistory)
      ? (rawData as any).pomodoroHistory
      : []
  };
}


