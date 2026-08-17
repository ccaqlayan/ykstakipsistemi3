import { YKSDataState, UserAccount } from '../types';
import { createEmptyStudentData } from '../data/initialData';

/**
 * Resolves full YKSDataState for any student with 100% guarantee.
 * - Every account is treated as a real account.
 * - Never overwrites user data with demo or initial state mock data.
 * - Ensures newly created or missing accounts have a clean empty structure.
 */
export function resolveStudentData(
  student: { id: string; email?: string; name?: string; className?: string } | UserAccount | string,
  studentsData?: Record<string, YKSDataState>
): YKSDataState {
  const studentObj = typeof student === 'string' ? { id: student } : student;
  const studentId = studentObj?.id || '';
  const name = (studentObj as any)?.name || '';
  const className = (studentObj as any)?.className || '';

  const rawData: any = (studentsData && studentsData[studentId]) || {};
  const emptyBase = createEmptyStudentData(name || rawData.profile?.name || 'Öğrenci', className || rawData.profile?.className || '12-A SAY');

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


