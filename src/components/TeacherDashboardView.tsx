import React, { useState, useEffect } from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend, 
  Cell 
} from 'recharts';
import { 
  Users, 
  UserCheck, 
  BarChart3, 
  TrendingUp, 
  XCircle,
  AlertCircle,
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  Filter, 
  Plus, 
  BookOpen, 
  Award, 
  Edit, 
  Eye, 
  MessageSquare, 
  Calendar, 
  ChevronRight,
  ChevronLeft,
  School,
  X,
  Sparkles,
  Target,
  Bookmark,
  Download,
  Copy,
  Trash2,
  Check,
  ArrowRightLeft,
  FolderPlus,
  Clock,
  Layers,
  GripVertical,
  UserPlus,
  UserMinus,
  GraduationCap,
  ShieldCheck,
  ShieldAlert,
  Building2,
  BookOpenCheck,
  Youtube,
  CheckSquare,
  FileSpreadsheet,
  Footprints,
  ChevronDown,
  ChevronUp,
  ListChecks,
  StickyNote
} from 'lucide-react';
import { 
  UserAccount, 
  ClassDefinition, 
  ClassFieldType,
  YKSDataState, 
  StudentProfile, 
  StudyPlanItem, 
  StudyProgramTemplate, 
  DayOfWeek,
  FieldType,
  AuditLogItem,
  TopicErrorItem,
  SchoolExam
} from '../types';
import { getGradeLevel, GradeLevel } from '../utils/gradeUtils';
import { YKS_SUBJECTS, YKS_CURRICULUM_TOPICS, DEFAULT_TASK_TYPES, DEFAULT_AVATAR } from '../data/initialData';
import { isUserOnline, getUserLastSeenText, getExactLastSeenText, isStudentActive } from '../utils/statusUtils';
import { TemplateWeeklyPreviewModal } from './TemplateWeeklyPreviewModal';
import { TemplateFullBuilderView } from './TemplateFullBuilderView';
import { UniversityLogoManagerModal } from './UniversityLogoManagerModal';
import { AuditLogsView } from './AuditLogsView';
import { TeacherSummaryTab } from './teacher/TeacherSummaryTab';
import { TeacherStudentsTab } from './teacher/TeacherStudentsTab';
import { TeacherTemplatesTab } from './teacher/TeacherTemplatesTab';
import { TeacherTeachersTab } from './teacher/TeacherTeachersTab';
import { TeacherStudentInspectView } from './teacher/TeacherStudentInspectView';
import { subscribeToPresence } from '../services/firebase';
import { resolveStudentData } from '../utils/studentDataUtils';

interface TeacherDashboardViewProps {
  teacher: UserAccount;
  classes: ClassDefinition[];
  allUsers: UserAccount[];
  studentsData: Record<string, YKSDataState>;
  programTemplates?: StudyProgramTemplate[];
  auditLogs?: AuditLogItem[];
  activeTeacherSubView?: 'summary' | 'students' | 'teachers' | 'templates';
  onUpdateStudentProfile: (studentId: string, updatedProfile: StudentProfile) => void;
  onCreateClass: (className: string, field: ClassFieldType, description?: string, gradeLevel?: GradeLevel) => void;
  onAssignStudentClass: (studentId: string, newClassName: string) => void;
  onUpdateStudentStudyPlans: (studentId: string, updatedPlans: StudyPlanItem[]) => void;
  onUpdateStudentTopicErrors?: (studentId: string, updatedErrors: TopicErrorItem[], actionDescription?: string) => void;
  onUpdateStudentSchoolExams?: (studentId: string, updatedExams: SchoolExam[], actionDescription?: string) => void;
  onSaveProgramTemplate: (template: Omit<StudyProgramTemplate, 'id' | 'createdAt'>) => void;
  onUpdateProgramTemplate?: (template: StudyProgramTemplate) => void;
  onDeleteProgramTemplate: (templateId: string) => void;
  onApplyTemplateToStudent: (studentId: string, templateId: string, mode: 'overwrite' | 'merge') => void;
  onUpdateTeacherAssignedClasses?: (teacherId: string, assignedClassNames: string[]) => void;
  onUpdateTeacherAccount?: (updatedTeacher: UserAccount) => void;
  onUpdateStudentAccount?: (updatedStudent: UserAccount) => void;
  onDeleteStudentAccount?: (studentId: string) => void;
  onDeleteClass?: (classId: string) => void;
  onUpdateClass?: (updatedClass: ClassDefinition) => void;
  onCreateTeacherAccount?: (teacher: Omit<UserAccount, 'id'>) => void;
  onDeleteTeacherAccount?: (teacherId: string) => void;
  onCreateStudentAccount?: (student: Omit<UserAccount, 'id'>) => void;
  onApproveStudent?: (studentId: string) => void;
  onRejectStudent?: (studentId: string) => void;
  onUpdateStudentSubjectNotes?: (studentId: string, subjectName: string, notes: { studentNote?: string; teacherNote?: string }) => void;
  onUnlockUserAccount?: (userId: string) => void;
  onPreviewStudent?: (student: UserAccount) => void;
}

const DAYS: DayOfWeek[] = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];

const OfflineStatusDisplay: React.FC<{ user: UserAccount, className?: string }> = ({ user, className }) => {
  const [showExact, setShowExact] = React.useState(false);
  return (
    <div 
      className={`cursor-pointer ${className || ''}`}
      onClick={(e) => { e.stopPropagation(); setShowExact(!showExact); }}
      title="Kesin son görülme zamanını gör"
    >
      {showExact ? getExactLastSeenText(user) : getUserLastSeenText(user)}
    </div>
  );
};

const ALL_SUBJECTS = [...YKS_SUBJECTS.TYT, ...YKS_SUBJECTS.AYT];

export const TeacherDashboardView: React.FC<TeacherDashboardViewProps> = ({
  teacher,
  classes,
  allUsers,
  studentsData,
  programTemplates = [],
  auditLogs = [],
  activeTeacherSubView,
  onUpdateStudentProfile,
  onCreateClass,
  onAssignStudentClass,
  onUpdateStudentStudyPlans,
  onUpdateStudentTopicErrors,
  onUpdateStudentSchoolExams,
  onSaveProgramTemplate,
  onUpdateProgramTemplate,
  onDeleteProgramTemplate,
  onApplyTemplateToStudent,
  onUpdateTeacherAssignedClasses,
  onUpdateTeacherAccount,
  onDeleteClass,
  onUpdateClass,
  onCreateTeacherAccount,
  onDeleteTeacherAccount,
  onCreateStudentAccount,
  onUpdateStudentAccount,
  onDeleteStudentAccount,
  onApproveStudent,
  onRejectStudent,
  onUpdateStudentSubjectNotes,
  onUnlockUserAccount,
  onPreviewStudent
}) => {
  // Check role
  const isAdmin = teacher.role === 'admin';
  const isSchoolCounselor = teacher.role === 'school_counselor' || teacher.role === 'admin';
  const isClassTeacher = teacher.role === 'class_teacher';
  const isBranchTeacher = teacher.role === 'teacher';

  // Navigation tab inside Teacher Dashboard
  const [activeTeacherView, setActiveTeacherView] = useState<'summary' | 'students' | 'teachers' | 'templates'>(activeTeacherSubView || 'summary');

  // Modal state for full weekly template preview & drag-and-drop editor
  const [weeklyPreviewTemplate, setWeeklyPreviewTemplate] = useState<StudyProgramTemplate | null>(null);

  useEffect(() => {
    if (activeTeacherSubView) {
      setActiveTeacherView(activeTeacherSubView);
    }
  }, [activeTeacherSubView]);

  const [presenceMap, setPresenceMap] = useState<Record<string, { isOnline: boolean; lastActiveAt: string }>>({});

  useEffect(() => {
    const unsubscribe = subscribeToPresence((map) => setPresenceMap(map));
    return () => unsubscribe();
  }, []);

  // Drag and drop state for study planner
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverDay, setDragOverDay] = useState<DayOfWeek | null>(null);

  // New Student Account Modal State
  const [showCreateStudentModal, setShowCreateStudentModal] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [newStudentClass, setNewStudentClass] = useState<string>('');

  // New Teacher Account Modal State
  const [showCreateTeacherModal, setShowCreateTeacherModal] = useState(false);
  const [newTeacherName, setNewTeacherName] = useState('');
  const [newTeacherEmail, setNewTeacherEmail] = useState('');
  const [newTeacherPassword, setNewTeacherPassword] = useState('123456');
  const [newTeacherTitle, setNewTeacherTitle] = useState('Branş Öğretmeni');
  const [newTeacherRole, setNewTeacherRole] = useState<'class_teacher' | 'teacher' | 'school_counselor'>('teacher');
  const [newTeacherSubject, setNewTeacherSubject] = useState('Matematik');
  const [newTeacherAssignedClasses, setNewTeacherAssignedClasses] = useState<string[]>([]);
  const [teacherSearchTerm, setTeacherSearchTerm] = useState('');

  // Edit Teacher Account Modal State
  const [showEditTeacherModal, setShowEditTeacherModal] = useState(false);
  const [editingTeacherId, setEditingTeacherId] = useState('');
  const [editTeacherName, setEditTeacherName] = useState('');
  const [editTeacherEmail, setEditTeacherEmail] = useState('');
  const [editTeacherTitle, setEditTeacherTitle] = useState('');
  const [editTeacherRole, setEditTeacherRole] = useState<'class_teacher' | 'teacher' | 'school_counselor'>('teacher');
  const [editTeacherSubject, setEditTeacherSubject] = useState('');
  const [editTeacherPassword, setEditTeacherPassword] = useState('');
  const [newStudentPassword, setNewStudentPassword] = useState('123456');

  // Edit Student Account Modal State
  const [showEditStudentModal, setShowEditStudentModal] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState('');
  const [editStudentName, setEditStudentName] = useState('');
  const [editStudentEmail, setEditStudentEmail] = useState('');
  const [editStudentClassName, setEditStudentClassName] = useState('');
  const [editStudentPassword, setEditStudentPassword] = useState('');

  // Available classes
  const availableClasses = isSchoolCounselor
    ? Array.from(new Set([...classes.map(c => c.name), ...allUsers.map(u => u.className).filter(Boolean) as string[]]))
    : (teacher.assignedClassNames || ['12-A SAY']);

  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Selected student for detailed inspection modal
  const [selectedStudentUser, setSelectedStudentUser] = useState<UserAccount | null>(null);
  const [inspectModalTab, setInspectModalTab] = useState<'performance' | 'planner' | 'questions' | 'resources' | 'mocks' | 'youtube' | 'audit_logs' | 'badges'>('performance');
  const [studentAuditPage, setStudentAuditPage] = useState<number>(1);
  const [expandedResourceIds, setExpandedResourceIds] = useState<string[]>([]);
  const [editingCoachNotes, setEditingCoachNotes] = useState('');

  // Subject notes state variables for Teacher
  const [activeNotesSubject, setActiveNotesSubject] = useState<string | null>(null);
  const [studentNoteDraft, setStudentNoteDraft] = useState('');
  const [teacherNoteDraft, setTeacherNoteDraft] = useState('');

  const handleOpenSubjectNotes = (subjectName: string) => {
    if (!selectedStudentUser) return;
    setActiveNotesSubject(subjectName);
    const studentData = resolveStudentData(selectedStudentUser, studentsData);
    const existingNotes = (studentData as any)?.subjectNotes?.[subjectName] || { studentNote: '', teacherNote: '' };
    setStudentNoteDraft(existingNotes.studentNote || '');
    setTeacherNoteDraft(existingNotes.teacherNote || '');
  };

  const handleSaveSubjectNotes = () => {
    if (!selectedStudentUser || !activeNotesSubject || !onUpdateStudentSubjectNotes) return;
    if (isBranchTeacher) {
      alert('Branş öğretmenlerinin ders notu düzenleme yetkisi yoktur.');
      return;
    }
    onUpdateStudentSubjectNotes(selectedStudentUser.id, activeNotesSubject, {
      studentNote: studentNoteDraft,
      teacherNote: teacherNoteDraft
    });
    setActiveNotesSubject(null);
  };

  const handleToggleTaskStatusFromTeacher = (studentId: string, taskId: string, currentStatus: any) => {
    if (isBranchTeacher) {
      alert('Branş öğretmenlerinin görev durumu değiştirme yetkisi yoktur.');
      return;
    }
    const studentData = resolveStudentData(studentId, studentsData);
    if (!studentData) return;
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    const updatedPlans = (studentData.studyPlans || []).map(p => 
      p.id === taskId ? { ...p, status: newStatus as any } : p
    );
    onUpdateStudentStudyPlans(studentId, updatedPlans);
  };

  useEffect(() => {
    setStudentAuditPage(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const mainElem = document.querySelector('main');
    if (mainElem) mainElem.scrollTo({ top: 0, behavior: 'smooth' });
  }, [selectedStudentUser?.id, inspectModalTab, activeTeacherSubView]);

  // Modals state
  const [showCreateClassModal, setShowCreateClassModal] = useState(false);
  const [showEditClassModal, setShowEditClassModal] = useState(false);
  const [classToEdit, setClassToEdit] = useState<ClassDefinition | null>(null);
  const [editClassNameInput, setEditClassNameInput] = useState('');
  const [editClassDescInput, setEditClassDescInput] = useState('');
  const [editClassFieldInput, setEditClassFieldInput] = useState<ClassFieldType>('SAY');
  const [editClassGradeLevel, setEditClassGradeLevel] = useState<GradeLevel>('12');
  const [newClassNameInput, setNewClassNameInput] = useState('');
  const [newClassDescInput, setNewClassDescInput] = useState('');
  const [newClassFieldInput, setNewClassFieldInput] = useState<ClassFieldType>('ORTAK');
  const [newClassGradeLevel, setNewClassGradeLevel] = useState<GradeLevel>('9');
  const [showLogoManager, setShowLogoManager] = useState(false);

  const [reassigningStudent, setReassigningStudent] = useState<UserAccount | null>(null);
  const [targetClassChoice, setTargetClassChoice] = useState('');

  // Teacher Class Assignment Modal for Counselor
  const [showAssignTeacherModal, setShowAssignTeacherModal] = useState(false);
  const [selectedTeacherForAssignment, setSelectedTeacherForAssignment] = useState<UserAccount | null>(null);
  const [assignedClassesForSelectedTeacher, setAssignedClassesForSelectedTeacher] = useState<string[]>([]);

  // Class-Centric Teacher Assignment Modal
  const [showClassTeacherAssignModal, setShowClassTeacherAssignModal] = useState(false);
  const [selectedClassForTeacherAssign, setSelectedClassForTeacherAssign] = useState<ClassDefinition | null>(null);
  const [selectedTeacherIdsForClass, setSelectedTeacherIdsForClass] = useState<string[]>([]);
  const [classTeacherSearchTerm, setClassTeacherSearchTerm] = useState('');

  // Save current student plan as template modal
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [newTemplateTitle, setNewTemplateTitle] = useState('');
  const [newTemplateDesc, setNewTemplateDesc] = useState('');
  const [newTemplateField, setNewTemplateField] = useState<FieldType | 'TÜMÜ'>('TÜMÜ');

  // Apply template modal
  const [showApplyTemplateModal, setShowApplyTemplateModal] = useState(false);
  const [selectedTemplateToApply, setSelectedTemplateToApply] = useState<StudyProgramTemplate | null>(null);
  const [targetStudentIdForApply, setTargetStudentIdForApply] = useState<string>('');
  const [applyMode, setApplyMode] = useState<'overwrite' | 'merge'>('overwrite');

  // Student deletion (School Counselor only, 3 confirmation steps)
  const [studentToDelete, setStudentToDelete] = useState<UserAccount | null>(null);
  const [deleteConfirmationStep, setDeleteConfirmationStep] = useState<number>(1); // 1, 2, 3
  const [typedConfirmName, setTypedConfirmName] = useState<string>('');

  // Teacher deletion (School Counselor only, 3 confirmation steps)
  const [teacherToDelete, setTeacherToDelete] = useState<UserAccount | null>(null);
  const [deleteTeacherConfirmationStep, setDeleteTeacherConfirmationStep] = useState<number>(1);
  const [typedTeacherConfirmName, setTypedTeacherConfirmName] = useState<string>('');

  // Add task to student modal (inside inspect modal)
  const [showAddTaskToStudentModal, setShowAddTaskToStudentModal] = useState(false);
  const [newTaskDay, setNewTaskDay] = useState<DayOfWeek>('Pazartesi');
  const [newTaskSubject, setNewTaskSubject] = useState<string>(ALL_SUBJECTS[0]);
  const [newTaskTopic, setNewTaskTopic] = useState<string>('');
  const [newTaskType, setNewTaskType] = useState<string>(DEFAULT_TASK_TYPES[0]);
  const [newTaskMinutes, setNewTaskMinutes] = useState<number>(60);
  const [newTaskNotes, setNewTaskNotes] = useState<string>('');

  // Template creation modal (from scratch)
  const [showCreateTemplateModal, setShowCreateTemplateModal] = useState(false);
  const [createTplTitle, setCreateTplTitle] = useState('');
  const [createTplDesc, setCreateTplDesc] = useState('');
  const [createTplField, setCreateTplField] = useState<FieldType | 'TÜMÜ'>('TÜMÜ');
  const [createTplItems, setCreateTplItems] = useState<{ day: DayOfWeek; subject: string; topic: string; taskType?: string; plannedMinutes: number; notes?: string }[]>([]);
  const [tplItemDay, setTplItemDay] = useState<DayOfWeek>('Pazartesi');
  const [tplItemSubject, setTplItemSubject] = useState<string>(ALL_SUBJECTS[0]);
  const [tplItemTopic, setTplItemTopic] = useState<string>('');
  const [tplItemType, setTplItemType] = useState<string>(DEFAULT_TASK_TYPES[0]);
  const [tplItemMinutes, setTplItemMinutes] = useState<number>(60);
  const [tplItemNotes, setTplItemNotes] = useState<string>('');

  // Expanded template preview ID
  const [previewTemplateId, setPreviewTemplateId] = useState<string | null>(null);

  // Filter student users
  const pendingStudents = allUsers.filter((u) => u.role === 'student' && u.status === 'pending');
  const allUsersWithPresence = allUsers.map(u => ({
    ...u,
    isOnline: presenceMap[u.id]?.isOnline ?? false,
    lastActiveAt: presenceMap[u.id]?.lastActiveAt ?? u.lastActiveAt
  }));
  const studentUsers = allUsersWithPresence.filter((u) => u.role === 'student' && u.status !== 'pending' && u.status !== 'rejected');

  const filteredStudents = studentUsers.filter((st) => {
    const studentClass = st.className || '12-A SAY';
    const matchesSearch = st.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          st.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          studentClass.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;

    // Sınıf rehber öğretmeni ise sadece kendi atandığı sınıfların öğrencilerini görebilir
    if (!isSchoolCounselor) {
      if (!availableClasses.includes(studentClass)) return false;
    }

    if (selectedClassFilter === 'ALL') {
      return true;
    }
    return studentClass === selectedClassFilter;
  });

  // KPI metrics
  let totalStudentsCount = filteredStudents.length;
  let sumTYTNet = 0;
  let countTYT = 0;
  let sumAYTNet = 0;
  let countAYT = 0;
  let totalQuestionsSolvedInClass = 0;
  let totalUnresolvedErrorsInClass = 0;

  filteredStudents.forEach((st) => {
    const data = resolveStudentData(st, studentsData);
    if (data) {
      if (data.generalMocks && data.generalMocks.length > 0) {
        const sortedMocks = [...data.generalMocks].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const latestTYTMock = sortedMocks.find(m => m.tyt && m.tyt.totalNet !== undefined && (m.examType === 'TYT' || m.examType === 'TYT_AYT' || m.examType === 'TYT_DIL' || m.tyt.totalNet > 0));
        const latestAYTMock = sortedMocks.find(m => m.ayt && m.ayt.totalNet !== undefined && (m.examType === 'AYT' || m.examType === 'TYT_AYT' || m.ayt.totalNet > 0));
        const latestYDTMock = sortedMocks.find(m => m.ydt && m.ydt.net !== undefined && (m.examType === 'DIL' || m.examType === 'TYT_DIL' || Number(m.ydt.net) > 0));

        const isStudentDil = data.profile?.targetField === 'DİL' || (data.profile?.targetField as string) === 'DIL';
        const t = latestTYTMock?.tyt?.totalNet;
        const a = isStudentDil ? (latestYDTMock?.ydt?.net ?? latestAYTMock?.ayt?.totalNet) : latestAYTMock?.ayt?.totalNet;

        if (t !== undefined && t > 0) {
          sumTYTNet += t;
          countTYT++;
        }
        if (a !== undefined && a > 0) {
          sumAYTNet += a;
          countAYT++;
        }
      }
      if (data.questionLogs) {
        data.questionLogs.forEach((q) => {
          totalQuestionsSolvedInClass += q.solvedCount || 0;
        });
      }
      if (data.topicErrors) {
        totalUnresolvedErrorsInClass += data.topicErrors.filter((e) => !e.revised).length;
      }
    }
  });

  const avgTYTNet = countTYT > 0 ? (sumTYTNet / countTYT).toFixed(1) : '0.0';
  const avgAYTNet = countAYT > 0 ? (sumAYTNet / countAYT).toFixed(1) : '0.0';

  // --- General Summary (Genel Özet) Calculations ---
  const isStudentActiveInSystem = (studentId: string) => {
    const stUser = studentUsers.find(u => u.id === studentId) || { id: studentId };
    const data = resolveStudentData(stUser, studentsData);
    return isStudentActive(studentId, data);
  };

  const assignedStudentsList = studentUsers.filter((st) => {
    const studentClass = st.className || '12-A SAY';
    if (!isSchoolCounselor) {
      if (!availableClasses.includes(studentClass)) return false;
    }
    return true;
  });

  let totalWeeklyQuestions = 0;
  let totalWeeklyMinutes = 0;
  let totalCompletedPlans = 0;
  let totalPlansCount = 0;
  let activeStudentCountOverall = 0;

  assignedStudentsList.forEach((st) => {
    if (isStudentActiveInSystem(st.id)) {
      activeStudentCountOverall++;
    }
    const data = resolveStudentData(st, studentsData);
    if (data) {
      (data.questionLogs || []).forEach((ql) => {
        totalWeeklyQuestions += (ql.solvedCount || 0) || ((ql.correctCount || 0) + (ql.wrongCount || 0) + (ql.blankCount || 0));
      });
      (data.studyPlans || []).forEach((sp) => {
        totalPlansCount++;
        if (sp.status === 'completed') {
          totalCompletedPlans++;
          totalWeeklyMinutes += sp.plannedMinutes || 45;
        }
      });
    }
  });

  const weeklyStudyHours = Math.round(totalWeeklyMinutes / 60);
  const planCompletionRate = totalPlansCount > 0 ? Math.round((totalCompletedPlans / totalPlansCount) * 100) : 0;

  const classSummaries = availableClasses.map((clsName) => {
    const clsStudents = studentUsers.filter((st) => (st.className || '12-A SAY') === clsName);
    const registeredCount = clsStudents.length;
    const activeCount = clsStudents.filter((st) => isStudentActiveInSystem(st.id)).length;
    
    let clsQuestions = 0;
    let clsTYTSum = 0;
    let clsTYTCount = 0;
    let clsAYTSum = 0;
    let clsAYTCount = 0;

    clsStudents.forEach((st) => {
      const data = resolveStudentData(st, studentsData);
      if (data) {
        (data.questionLogs || []).forEach((ql) => {
          clsQuestions += (ql.solvedCount || 0) || ((ql.correctCount || 0) + (ql.wrongCount || 0) + (ql.blankCount || 0));
        });
        if (data.generalMocks && data.generalMocks.length > 0) {
          const sortedMocks = [...data.generalMocks].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          const latestTYTMock = sortedMocks.find(m => m.tyt && m.tyt.totalNet !== undefined && (m.examType === 'TYT' || m.examType === 'TYT_AYT' || m.examType === 'TYT_DIL' || m.tyt.totalNet > 0));
          const latestAYTMock = sortedMocks.find(m => m.ayt && m.ayt.totalNet !== undefined && (m.examType === 'AYT' || m.examType === 'TYT_AYT' || m.ayt.totalNet > 0));
          const latestYDTMock = sortedMocks.find(m => m.ydt && m.ydt.net !== undefined && (m.examType === 'DIL' || m.examType === 'TYT_DIL' || Number(m.ydt.net) > 0));

          const isStudentDil = data.profile?.targetField === 'DİL' || (data.profile?.targetField as string) === 'DIL';
          const t = latestTYTMock?.tyt?.totalNet;
          const a = isStudentDil ? (latestYDTMock?.ydt?.net ?? latestAYTMock?.ayt?.totalNet) : latestAYTMock?.ayt?.totalNet;

          if (t !== undefined && t > 0) {
            clsTYTSum += t;
            clsTYTCount++;
          }
          if (a !== undefined && a > 0) {
            clsAYTSum += a;
            clsAYTCount++;
          }
        }
      }
    });

    const avgTYT = clsTYTCount > 0 ? (clsTYTSum / clsTYTCount).toFixed(1) : '0';
    const avgAYT = clsAYTCount > 0 ? (clsAYTSum / clsAYTCount).toFixed(1) : '0';
    const activePercent = registeredCount > 0 ? Math.round((activeCount / registeredCount) * 100) : 0;

    return {
      className: clsName,
      registeredCount,
      activeCount,
      activePercent,
      totalQuestions: clsQuestions,
      avgTYT,
      avgAYT
    };
  });

  // Open student inspection modal
  const handleOpenInspectStudent = (
    student: UserAccount, 
    initialTab: 'performance' | 'planner' | 'questions' | 'resources' | 'mocks' | 'youtube' | 'audit_logs' | 'badges' = 'performance'
  ) => {
    setSelectedStudentUser(student);
    setInspectModalTab(initialTab);
    const data = resolveStudentData(student, studentsData);
    if (data && data.profile) {
      setEditingCoachNotes(data.profile.coachNotes || '');
    } else {
      setEditingCoachNotes('');
    }
  };

  // Save coach note
  const handleSaveCoachNotes = () => {
    if (!selectedStudentUser) return;
    const currentData = resolveStudentData(selectedStudentUser, studentsData);
    if (currentData) {
      const updatedProf: StudentProfile = {
        ...currentData.profile,
        coachName: teacher.name,
        coachNotes: editingCoachNotes
      };
      onUpdateStudentProfile(selectedStudentUser.id, updatedProf);
    }
    alert(`Sayın ${teacher.name}, ${selectedStudentUser.name} için koçluk notunuz başarıyla kaydedildi.`);
  };

  // Save current student plan as template
  const handleSaveCurrentStudentPlanAsTemplateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentUser || !newTemplateTitle.trim()) return;

    const studentData = resolveStudentData(selectedStudentUser, studentsData);
    const plans = studentData?.studyPlans || [];

    if (plans.length === 0) {
      alert('Bu öğrencinin haftalık çalışma planında henüz görev bulunmamaktadır.');
      return;
    }

    const templateItems = plans.map(p => ({
      day: p.day,
      subject: p.subject,
      topic: p.topic,
      plannedMinutes: p.plannedMinutes,
      notes: p.notes
    }));

    onSaveProgramTemplate({
      title: newTemplateTitle.trim(),
      description: newTemplateDesc.trim() || `${selectedStudentUser.name} isimli öğrencinin haftalık çalışma programından kaydedilmiştir.`,
      targetField: newTemplateField,
      createdByName: teacher.name,
      items: templateItems
    });

    setNewTemplateTitle('');
    setNewTemplateDesc('');
    setShowSaveTemplateModal(false);
    alert(`"${newTemplateTitle}" başlıklı çalışma programı şablonu başarıyla kütüphaneye kaydedildi!`);
  };

  // Add task to current inspected student
  const handleAddTaskToStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentUser || !newTaskTopic.trim()) return;
    if (isBranchTeacher) {
      alert('Branş öğretmenlerinin çalışma planı atama/değiştirme yetkisi yoktur.');
      return;
    }

    const currentPlans = resolveStudentData(selectedStudentUser, studentsData).studyPlans || [];
    const newItem: StudyPlanItem = {
      id: 'plan-' + Date.now(),
      day: newTaskDay,
      subject: newTaskSubject,
      topic: newTaskTopic.trim(),
      taskType: newTaskType || DEFAULT_TASK_TYPES[0],
      plannedMinutes: Number(newTaskMinutes) || 60,
      completedMinutes: 0,
      status: 'pending',
      notes: newTaskNotes.trim()
    };

    onUpdateStudentStudyPlans(selectedStudentUser.id, [newItem, ...currentPlans]);
    setNewTaskTopic('');
    setNewTaskNotes('');
    setShowAddTaskToStudentModal(false);
  };

  // Delete single task from student's plan
  const handleDeleteTaskFromStudent = (studentId: string, taskId: string) => {
    if (isBranchTeacher) {
      alert('Branş öğretmenlerinin çalışma planı silme yetkisi yoktur.');
      return;
    }
    const currentPlans = resolveStudentData(studentId, studentsData).studyPlans || [];
    const updated = currentPlans.filter(p => p.id !== taskId);
    onUpdateStudentStudyPlans(studentId, updated);
  };

  // Apply template submit
  const handleApplyTemplateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplateToApply || !targetStudentIdForApply) return;
    if (isBranchTeacher) {
      alert('Branş öğretmenlerinin şablon uygulama yetkisi yoktur.');
      return;
    }

    const targetStudent = allUsers.find(u => u.id === targetStudentIdForApply);
    onApplyTemplateToStudent(targetStudentIdForApply, selectedTemplateToApply.id, applyMode);

    setShowApplyTemplateModal(false);
    alert(`"${selectedTemplateToApply.title}" programı ${targetStudent?.name || 'öğrenciye'} başarıyla uygulandı.`);
  };

  // Add item to new template draft (from scratch)
  const handleAddDraftItemToTemplate = () => {
    if (!tplItemTopic.trim()) return;
    setCreateTplItems(prev => [
      ...prev,
      {
        day: tplItemDay,
        subject: tplItemSubject,
        topic: tplItemTopic.trim(),
        taskType: tplItemType || DEFAULT_TASK_TYPES[0],
        plannedMinutes: Number(tplItemMinutes) || 60,
        notes: tplItemNotes.trim()
      }
    ]);
    setTplItemTopic('');
    setTplItemNotes('');
  };

  // Submit create template from scratch
  const handleCreateTemplateFromScratchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createTplTitle.trim()) return;
    if (createTplItems.length === 0) {
      alert('Lütfen şablona en az bir ders/görev maddesi ekleyin.');
      return;
    }

    onSaveProgramTemplate({
      title: createTplTitle.trim(),
      description: createTplDesc.trim(),
      targetField: createTplField,
      createdByName: teacher.name,
      items: createTplItems
    });

    setCreateTplTitle('');
    setCreateTplDesc('');
    setCreateTplItems([]);
    setShowCreateTemplateModal(false);
    alert('Yeni çalışma programı şablonu kütüphaneye eklendi.');
  };

  // Handle create class submit
  const handleCreateClassSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassNameInput.trim()) return;
    const finalField: ClassFieldType = (newClassGradeLevel === '9' || newClassGradeLevel === '10') ? 'ORTAK' : newClassFieldInput;
    onCreateClass(newClassNameInput.trim(), finalField, newClassDescInput.trim(), newClassGradeLevel);
    setNewClassNameInput('');
    setNewClassDescInput('');
    setNewClassFieldInput('ORTAK');
    setNewClassGradeLevel('9');
    setShowCreateClassModal(false);
  };

  // Handle reassign student class submit
  const handleReassignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reassigningStudent || !targetClassChoice) return;
    if (isBranchTeacher) {
      alert('Branş öğretmenlerinin sınıf değiştirme yetkisi yoktur.');
      return;
    }
    onAssignStudentClass(reassigningStudent.id, targetClassChoice);
    setReassigningStudent(null);
  };

  // Handle task drag-and-drop between days in student planner modal
  const handleTeacherTaskDrop = (targetDay: DayOfWeek) => {
    if (isBranchTeacher) {
      setDraggedTaskId(null);
      setDragOverDay(null);
      alert('Branş öğretmenlerinin çalışma planını düzenleme yetkisi yoktur.');
      return;
    }
    if (!draggedTaskId || !selectedStudentUser) return;
    const currentStudentPlans = resolveStudentData(selectedStudentUser, studentsData).studyPlans || [];
    const updatedPlans = currentStudentPlans.map(task => {
      if (task.id === draggedTaskId) {
        return { ...task, day: targetDay };
      }
      return task;
    });
    onUpdateStudentStudyPlans(selectedStudentUser.id, updatedPlans);
    setDraggedTaskId(null);
    setDragOverDay(null);
  };

  if (selectedStudentUser) {
    return (
      <div className="space-y-6 font-sans">
        <TeacherStudentInspectView
          selectedStudentUser={selectedStudentUser}
          initialTab={inspectModalTab}
          onBack={() => setSelectedStudentUser(null)}
          studentsData={studentsData}
          teacher={teacher}
          editingCoachNotes={editingCoachNotes}
          setEditingCoachNotes={setEditingCoachNotes}
          handleSaveCoachNotes={handleSaveCoachNotes}
          setShowSaveTemplateModal={setShowSaveTemplateModal}
          setShowAddTaskToStudentModal={setShowAddTaskToStudentModal}
          isBranchTeacher={isBranchTeacher}
          handleDeleteTaskFromStudent={handleDeleteTaskFromStudent}
          handleToggleTaskStatusFromTeacher={handleToggleTaskStatusFromTeacher}
          classes={classes}
          allUsers={allUsers}
          auditLogs={auditLogs}
          OfflineStatusDisplay={OfflineStatusDisplay}
          programTemplates={programTemplates}
          onApplyTemplateToStudent={onApplyTemplateToStudent}
          onUpdateStudentStudyPlans={onUpdateStudentStudyPlans}
          onUpdateStudentTopicErrors={onUpdateStudentTopicErrors}
          onUpdateStudentSchoolExams={onUpdateStudentSchoolExams}
          onPreviewStudent={onPreviewStudent}
        />

        {/* MODAL: SAVE STUDENT PROGRAM AS TEMPLATE */}
        {showSaveTemplateModal && (
          <div 
            className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget) setShowSaveTemplateModal(false); }}
          >
            <div className="bg-slate-900/95 backdrop-blur-2xl border border-white/15 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <Bookmark className="w-5 h-5 text-amber-400" />
                  <span>Programı Şablon Olarak Kaydet</span>
                </h3>
                <button onClick={() => setShowSaveTemplateModal(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveCurrentStudentPlanAsTemplateSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Şablon Başlığı</label>
                  <input
                    type="text"
                    required
                    placeholder="Ör: 12. Sınıf Derece Haftalık Programı"
                    value={newTemplateTitle}
                    onChange={(e) => setNewTemplateTitle(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Açıklama (Opsiyonel)</label>
                  <textarea
                    rows={2}
                    placeholder="Programın odak noktası ve tavsiyeler..."
                    value={newTemplateDesc}
                    onChange={(e) => setNewTemplateDesc(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Hedef Alan</label>
                  <select
                    value={newTemplateField}
                    onChange={(e) => setNewTemplateField(e.target.value as any)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white font-bold focus:outline-none"
                  >
                    <option value="TÜMÜ">Tüm Alanlar</option>
                    <option value="SAY">SAY (Sayısal)</option>
                    <option value="EA">EA (Eşit Ağırlık)</option>
                    <option value="SÖZ">SÖZ (Sözel)</option>
                    <option value="DİL">DİL (Yabancı Dil)</option>
                  </select>
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowSaveTemplateModal(false)}
                    className="px-4 py-2 text-slate-400 hover:text-white"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-amber-600/30"
                  >
                    Kütüphaneye Kaydet
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: ADD TASK TO STUDENT */}
        {showAddTaskToStudentModal && (
          <div 
            className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget) setShowAddTaskToStudentModal(false); }}
          >
            <div className="bg-slate-900/95 backdrop-blur-2xl border border-white/15 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <Plus className="w-5 h-5 text-indigo-400" />
                  <span>Öğrenciye Yeni Görev / Çalışma Ekle</span>
                </h3>
                <button onClick={() => setShowAddTaskToStudentModal(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddTaskToStudentSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Gün</label>
                  <select
                    value={newTaskDay}
                    onChange={(e) => setNewTaskDay(e.target.value as any)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white font-bold focus:outline-none"
                  >
                    {['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'].map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Ders</label>
                  <select
                    value={newTaskSubject}
                    onChange={(e) => {
                      setNewTaskSubject(e.target.value);
                      const subTopics = YKS_CURRICULUM_TOPICS[e.target.value] || [];
                      if (subTopics.length > 0) setNewTaskTopic(subTopics[0]);
                      else setNewTaskTopic('');
                    }}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white font-bold focus:outline-none"
                  >
                    {isBranchTeacher && teacher.subject ? (
                      <option value={teacher.subject}>{teacher.subject} (Kendi Branşınız)</option>
                    ) : (
                      ALL_SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Konu / Açıklama</label>
                  <input
                    type="text"
                    required
                    placeholder="Ör: Türev - İkinci Türev Test 3"
                    value={newTaskTopic}
                    onChange={(e) => setNewTaskTopic(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Çalışma Tipi</label>
                    <select
                      value={newTaskType}
                      onChange={(e) => setNewTaskType(e.target.value)}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white font-bold focus:outline-none"
                    >
                      {DEFAULT_TASK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Planlanan Süre (Dk)</label>
                    <input
                      type="number"
                      required
                      min={10}
                      max={300}
                      step={5}
                      value={newTaskMinutes}
                      onChange={(e) => setNewTaskMinutes(Number(e.target.value))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-400 font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddTaskToStudentModal(false)}
                    className="px-4 py-2 text-slate-400 hover:text-white"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-600/30"
                  >
                    Görevi Ekle
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      
      {/* Top Header & View Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white/5 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-xl">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-fuchsia-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white font-bold shadow-lg shadow-fuchsia-600/30 border border-fuchsia-400/40 shrink-0">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs bg-fuchsia-500/20 text-fuchsia-300 font-bold px-2.5 py-0.5 rounded-full border border-fuchsia-500/30 uppercase tracking-wider">
                Öğretmen / Koç Paneli
              </span>
              <span className="text-xs text-slate-400">Hoş geldiniz, {teacher.name}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
              Sınıf Takip
            </h1>
          </div>
        </div>

        <div className="flex flex-col sm:items-end gap-2 shrink-0">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                if (!newStudentClass && availableClasses.length > 0) {
                  setNewStudentClass(availableClasses[0]);
                }
                setShowCreateStudentModal(true);
              }}
              id="create-student-btn-top"
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all flex items-center space-x-1.5 shadow-lg shadow-indigo-600/30 border border-indigo-400/40 cursor-pointer"
            >
              <UserPlus className="w-4 h-4 text-indigo-200" />
              <span>Yeni Öğrenci Ekle</span>
            </button>

            <button
              onClick={() => {
                if (!isSchoolCounselor) {
                  alert('Yeni öğretmen hesabı tanımlama yetkisi yalnızca Okul Rehber Öğretmenine aittir.');
                  return;
                }
                setNewTeacherName('');
                setNewTeacherEmail('');
                setNewTeacherPassword('123456');
                setNewTeacherTitle('Sınıf Rehber Öğretmeni');
                setNewTeacherAssignedClasses([]);
                setShowCreateTeacherModal(true);
              }}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all flex items-center space-x-1.5 shadow-lg shadow-indigo-600/30 border border-indigo-400/40 cursor-pointer"
            >
              <UserCheck className="w-4 h-4 text-indigo-200" />
              <span>Yeni Öğretmen Ekle</span>
            </button>
          </div>

          <button
            onClick={() => setShowCreateClassModal(true)}
            className="bg-slate-800/80 hover:bg-slate-700 text-indigo-300 hover:text-white text-xs font-bold px-3.5 py-1.5 rounded-xl transition-all flex items-center space-x-1.5 border border-indigo-500/30 shadow-md self-end cursor-pointer"
          >
            <Plus className="w-4 h-4 text-indigo-400" />
            <span>Sınıf Ekle</span>
          </button>
        </div>
      </div>

      {/* Onay Bekleyen Öğrenci Kayıtları Bölümü (Her İki Görünüm İçin) */}
      {pendingStudents.length > 0 && (
        <div className="bg-amber-950/60 border border-amber-500/40 rounded-3xl p-5 shadow-2xl backdrop-blur-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b border-amber-500/20 pb-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-300 flex items-center justify-center font-bold animate-pulse shrink-0">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <span>Onay Bekleyen Öğrenci Başvuruları</span>
                  <span className="text-xs bg-amber-500 text-slate-950 font-black px-2.5 py-0.5 rounded-full font-mono">
                    {pendingStudents.length} Kayıt
                  </span>
                </h3>
                <p className="text-xs text-amber-200/80 mt-0.5">
                  Öğrenciler kayıt oluşturduğunda burada listelenir. Onaylandıktan sonra öğrenci panellerine giriş hakkı kazanırlar.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {pendingStudents.map((pStudent) => (
              <div
                key={pStudent.id}
                className="bg-slate-900/90 border border-amber-500/30 rounded-2xl p-4 flex flex-col justify-between space-y-3"
              >
                <div className="flex items-start space-x-3">
                  <img
                    src={pStudent.avatarUrl || DEFAULT_AVATAR}
                    alt={pStudent.name}
                    className="w-10 h-10 rounded-xl object-cover border border-amber-500/30 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold text-white truncate">{pStudent.name}</h4>
                    <p className="text-[11px] text-slate-400 truncate">{pStudent.email}</p>
                    <span className="inline-block text-[10px] bg-indigo-500/20 text-indigo-300 font-semibold px-2 py-0.5 rounded mt-1 border border-indigo-500/30">
                      Sınıf: {pStudent.className || 'Atanmamış'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-2 border-t border-slate-800">
                  <button
                    onClick={() => onApproveStudent && onApproveStudent(pStudent.id)}
                    className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all border border-emerald-400/40 flex items-center justify-center space-x-1.5 shadow-md shadow-emerald-600/20"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Onayla</span>
                  </button>

                  <button
                    onClick={() => onRejectStudent && onRejectStudent(pStudent.id)}
                    className="flex-1 py-2 px-3 bg-rose-600/80 hover:bg-rose-600 text-white font-bold text-xs rounded-xl transition-all border border-rose-400/40 flex items-center justify-center space-x-1.5"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Reddet</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 0: GENERAL SUMMARY (GENEL ÖZET) */}
      {activeTeacherView === 'summary' && (
        <TeacherSummaryTab
          assignedStudentsList={assignedStudentsList}
          activeStudentCountOverall={activeStudentCountOverall}
          totalWeeklyQuestions={totalWeeklyQuestions}
          weeklyStudyHours={weeklyStudyHours}
          planCompletionRate={planCompletionRate}
          totalCompletedPlans={totalCompletedPlans}
          totalPlansCount={totalPlansCount}
          classSummaries={classSummaries}
          setShowCreateClassModal={setShowCreateClassModal}
          setSelectedClassFilter={setSelectedClassFilter}
          setActiveTeacherView={setActiveTeacherView}
        />
      )}


      {/* VIEW 1: STUDENTS & CLASSES */}
      {activeTeacherView === 'students' && (
        <TeacherStudentsTab
          totalStudentsCount={totalStudentsCount}
          avgTYTNet={avgTYTNet}
          avgAYTNet={avgAYTNet}
          totalQuestionsSolvedInClass={totalQuestionsSolvedInClass}
          totalUnresolvedErrorsInClass={totalUnresolvedErrorsInClass}
          selectedClassFilter={selectedClassFilter}
          setSelectedClassFilter={setSelectedClassFilter}
          isSchoolCounselor={isSchoolCounselor}
          availableClasses={availableClasses}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          newStudentClass={newStudentClass}
          setNewStudentClass={setNewStudentClass}
          setShowCreateStudentModal={setShowCreateStudentModal}
          filteredStudents={filteredStudents}
          studentsData={studentsData}
          handleOpenInspectStudent={handleOpenInspectStudent}
          isBranchTeacher={isBranchTeacher}
          setEditingStudentId={setEditingStudentId}
          setEditStudentName={setEditStudentName}
          setEditStudentEmail={setEditStudentEmail}
          setEditStudentClassName={setEditStudentClassName}
          setEditStudentPassword={setEditStudentPassword}
          setShowEditStudentModal={setShowEditStudentModal}
          onDeleteStudentAccount={onDeleteStudentAccount}
          setStudentToDelete={setStudentToDelete}
          setDeleteConfirmationStep={setDeleteConfirmationStep}
          setTypedConfirmName={setTypedConfirmName}
          OfflineStatusDisplay={OfflineStatusDisplay}
          onUnlockUserAccount={onUnlockUserAccount}
          onPreviewStudent={onPreviewStudent}
        />
      )}


      {/* VIEW 2: PROGRAM TEMPLATES & REUSABLE LIBRARY */}
      {activeTeacherView === 'templates' && (
        <TeacherTemplatesTab
          programTemplates={programTemplates}
          setShowCreateTemplateModal={setShowCreateTemplateModal}
          setWeeklyPreviewTemplate={setWeeklyPreviewTemplate}
          setSelectedTemplateToApply={setSelectedTemplateToApply}
          setTargetStudentIdForApply={setTargetStudentIdForApply}
          studentUsers={studentUsers}
          setShowApplyTemplateModal={setShowApplyTemplateModal}
          onDeleteProgramTemplate={onDeleteProgramTemplate}
        />
      )}


      {/* VIEW 3: TEACHERS & CLASS DEFINITIONS MANAGEMENT */}
      {activeTeacherView === 'teachers' && isSchoolCounselor && (
        <TeacherTeachersTab
          allUsers={allUsers}
          classes={classes}
          teacher={teacher}
          setShowCreateClassModal={setShowCreateClassModal}
          onUpdateClass={onUpdateClass}
          setClassToEdit={setClassToEdit}
          setEditClassNameInput={setEditClassNameInput}
          setEditClassDescInput={setEditClassDescInput}
          setEditClassFieldInput={setEditClassFieldInput}
          setEditClassGradeLevel={setEditClassGradeLevel}
          setShowEditClassModal={setShowEditClassModal}
          setSelectedClassForTeacherAssign={setSelectedClassForTeacherAssign}
          setSelectedTeacherIdsForClass={setSelectedTeacherIdsForClass}
          setClassTeacherSearchTerm={setClassTeacherSearchTerm}
          setShowClassTeacherAssignModal={setShowClassTeacherAssignModal}
          teacherSearchTerm={teacherSearchTerm}
          setTeacherSearchTerm={setTeacherSearchTerm}
          setNewTeacherName={setNewTeacherName}
          setNewTeacherEmail={setNewTeacherEmail}
          setNewTeacherPassword={setNewTeacherPassword}
          setNewTeacherTitle={setNewTeacherTitle}
          setNewTeacherRole={setNewTeacherRole}
          newTeacherSubject={newTeacherSubject}
          setNewTeacherSubject={setNewTeacherSubject}
          setNewTeacherAssignedClasses={setNewTeacherAssignedClasses}
          setShowCreateTeacherModal={setShowCreateTeacherModal}
          setEditingTeacherId={setEditingTeacherId}
          setEditTeacherName={setEditTeacherName}
          setEditTeacherEmail={setEditTeacherEmail}
          setEditTeacherTitle={setEditTeacherTitle}
          setEditTeacherRole={setEditTeacherRole}
          editTeacherSubject={editTeacherSubject}
          setEditTeacherSubject={setEditTeacherSubject}
          setShowEditTeacherModal={setShowEditTeacherModal}
          setSelectedTeacherForAssignment={setSelectedTeacherForAssignment}
          setAssignedClassesForSelectedTeacher={setAssignedClassesForSelectedTeacher}
          setShowAssignTeacherModal={setShowAssignTeacherModal}
          setTeacherToDelete={setTeacherToDelete}
          setDeleteTeacherConfirmationStep={setDeleteTeacherConfirmationStep}
          setTypedTeacherConfirmName={setTypedTeacherConfirmName}
          onUnlockUserAccount={onUnlockUserAccount}
          setEditTeacherPassword={setEditTeacherPassword}
        />
      )}



      {/* MODAL: SAVE STUDENT PROGRAM AS TEMPLATE */}
      {showSaveTemplateModal && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowSaveTemplateModal(false); }}
        >
          <div className="bg-slate-900/95 backdrop-blur-2xl border border-white/15 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Bookmark className="w-5 h-5 text-amber-400" />
                <span>Programı Şablon Olarak Kaydet</span>
              </h3>
              <button onClick={() => setShowSaveTemplateModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCurrentStudentPlanAsTemplateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Şablon Başlığı</label>
                <input
                  type="text"
                  required
                  placeholder="Ör: 12. Sınıf Derece Haftalık Programı"
                  value={newTemplateTitle}
                  onChange={(e) => setNewTemplateTitle(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Açıklama (Opsiyonel)</label>
                <textarea
                  rows={2}
                  placeholder="Programın odak noktası ve tavsiyeler..."
                  value={newTemplateDesc}
                  onChange={(e) => setNewTemplateDesc(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Hedef Alan</label>
                <select
                  value={newTemplateField}
                  onChange={(e) => setNewTemplateField(e.target.value as any)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white font-bold focus:outline-none"
                >
                  <option value="TÜMÜ">Tüm Alanlar</option>
                  <option value="SAY">SAY (Sayısal)</option>
                  <option value="EA">EA (Eşit Ağırlık)</option>
                  <option value="SÖZ">SÖZ (Sözel)</option>
                  <option value="DİL">DİL (Yabancı Dil)</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSaveTemplateModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-amber-600/30"
                >
                  Kütüphaneye Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: APPLY TEMPLATE TO STUDENT */}
      {showApplyTemplateModal && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowApplyTemplateModal(false); }}
        >
          <div className="bg-slate-900/95 backdrop-blur-2xl border border-white/15 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Download className="w-5 h-5 text-indigo-400" />
                <span>Şablon Programı Öğrenciye Uygula</span>
              </h3>
              <button onClick={() => setShowApplyTemplateModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApplyTemplateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Uygulanacak Şablon</label>
                <select
                  value={selectedTemplateToApply?.id || ''}
                  onChange={(e) => {
                    const found = programTemplates.find(t => t.id === e.target.value);
                    if (found) setSelectedTemplateToApply(found);
                  }}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white font-bold focus:outline-none text-indigo-300"
                >
                  {programTemplates.map(t => (
                    <option key={t.id} value={t.id}>{t.title} ({t.items.length} Görev)</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Hedef Öğrenci</label>
                <select
                  value={targetStudentIdForApply}
                  onChange={(e) => setTargetStudentIdForApply(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white font-bold focus:outline-none"
                >
                  {studentUsers.map(st => (
                    <option key={st.id} value={st.id}>{st.name} ({st.className || '12-A'})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Uygulama Yöntemi</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setApplyMode('overwrite')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      applyMode === 'overwrite'
                        ? 'bg-fuchsia-600/20 border-fuchsia-500 text-white font-bold'
                        : 'bg-white/5 border-white/10 text-slate-400'
                    }`}
                  >
                    <div className="font-bold">Değiştir (Overwrite)</div>
                    <div className="text-[10px] opacity-80 mt-0.5">Eski haftalık plan silinir, yeni şablon yüklenir.</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setApplyMode('merge')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      applyMode === 'merge'
                        ? 'bg-indigo-600/20 border-indigo-500 text-white font-bold'
                        : 'bg-white/5 border-white/10 text-slate-400'
                    }`}
                  >
                    <div className="font-bold">Birleştir (Merge)</div>
                    <div className="text-[10px] opacity-80 mt-0.5">Mevcut programa şablon görevleri eklenir.</div>
                  </button>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowApplyTemplateModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-600/30"
                >
                  Programa Yükle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD TASK TO STUDENT (MANUAL) */}
      {showAddTaskToStudentModal && selectedStudentUser && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowAddTaskToStudentModal(false); }}
        >
          <div className="bg-slate-900/95 backdrop-blur-2xl border border-white/15 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Plus className="w-5 h-5 text-fuchsia-400" />
                <span>{selectedStudentUser.name} — Görev Ekle</span>
              </h3>
              <button onClick={() => setShowAddTaskToStudentModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddTaskToStudentSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Hangi Gün?</label>
                <select
                  value={newTaskDay}
                  onChange={(e) => setNewTaskDay(e.target.value as DayOfWeek)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white font-bold"
                >
                  {DAYS.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Ders</label>
                <select
                  value={newTaskSubject}
                  onChange={(e) => setNewTaskSubject(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white font-bold"
                >
                  {ALL_SUBJECTS.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Müfredat Konusu (Otomatik Liste)
                </label>
                <select
                  onChange={(e) => {
                    if (e.target.value) setNewTaskTopic(e.target.value);
                  }}
                  value={(YKS_CURRICULUM_TOPICS[newTaskSubject] || []).includes(newTaskTopic) ? newTaskTopic : ''}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-indigo-300 font-medium mb-2"
                >
                  <option value="">-- {newTaskSubject} Konusu Seçin --</option>
                  {(YKS_CURRICULUM_TOPICS[newTaskSubject] || []).map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>

                <label className="block text-slate-300 font-semibold mb-1">Çalışılacak Konu / Özel Başlık</label>
                <input
                  type="text"
                  required
                  placeholder="Ör: Türev Alma Kuralları veya 30 Paragraf"
                  value={newTaskTopic}
                  onChange={(e) => setNewTaskTopic(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-fuchsia-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Görev Tanımı (Görev Tipi)</label>
                <select
                  value={newTaskType}
                  onChange={(e) => setNewTaskType(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-amber-300 font-bold"
                >
                  {DEFAULT_TASK_TYPES.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Hedef Süre (Dakika)</label>
                  <input
                    type="number"
                    min={15}
                    step={15}
                    value={newTaskMinutes}
                    onChange={(e) => setNewTaskMinutes(Number(e.target.value))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-fuchsia-400 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Not (Opsiyonel)</label>
                  <input
                    type="text"
                    placeholder="Ör: Kronometre tut"
                    value={newTaskNotes}
                    onChange={(e) => setNewTaskNotes(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-fuchsia-400"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddTaskToStudentModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-fuchsia-600/30"
                >
                  Görevi Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FULL PAGE: CREATE TEMPLATE FROM SCRATCH */}
      {showCreateTemplateModal && (
        <TemplateFullBuilderView
          teacherName={teacher.name}
          onSave={(tpl) => {
            onSaveProgramTemplate(tpl);
            setShowCreateTemplateModal(false);
            alert(`"${tpl.title}" başlıklı çalışma programı şablonu kütüphaneye başarıyla kaydedildi.`);
          }}
          onClose={() => setShowCreateTemplateModal(false)}
        />
      )}

      {/* MODAL: CREATE CLASS */}
      {showCreateClassModal && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
          onClick={(e) => { if (e.target === e.currentTarget) setShowCreateClassModal(false); }}
        >
          <div className="bg-slate-900/95 backdrop-blur-2xl border border-white/15 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <School className="w-5 h-5 text-fuchsia-400" />
                <span>Yeni Sınıf Tanımla</span>
              </h3>
              <button onClick={() => setShowCreateClassModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateClassSubmit} className="space-y-4 text-xs">
              {/* 1. Sınıf Kademesi / Seviyesi Seçimi */}
              <div>
                <label className="block font-semibold text-slate-200 mb-1.5 flex items-center justify-between">
                  <span>Sınıf Seviyesi (Kademe)</span>
                  <span className="text-[10px] text-fuchsia-300 font-normal">Zorunlu</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { value: '9' as GradeLevel, label: '9. Sınıf', sub: 'Lise 1', badge: 'Maarif Modeli' },
                    { value: '10' as GradeLevel, label: '10. Sınıf', sub: 'Lise 2', badge: 'Maarif Modeli' },
                    { value: '11' as GradeLevel, label: '11. Sınıf', sub: 'Lise 3', badge: 'Alan & YKS' },
                    { value: '12' as GradeLevel, label: '12. Sınıf', sub: 'YKS Maraton', badge: 'Tam YKS' },
                    { value: 'mezun' as GradeLevel, label: 'Mezun', sub: 'YKS Derece', badge: 'Mezun' }
                  ].map((g) => {
                    const isSelected = newClassGradeLevel === g.value;
                    return (
                      <button
                        key={g.value}
                        type="button"
                        onClick={() => {
                          setNewClassGradeLevel(g.value);
                          if (g.value === '9' || g.value === '10') {
                            setNewClassFieldInput('ORTAK');
                          } else if (newClassFieldInput === 'ORTAK') {
                            setNewClassFieldInput('SAY');
                          }
                        }}
                        className={`p-2.5 rounded-2xl border text-left transition-all relative overflow-hidden ${
                          isSelected
                            ? 'bg-gradient-to-br from-fuchsia-600/30 to-purple-600/20 border-fuchsia-400 text-white shadow-md shadow-fuchsia-600/20 ring-1 ring-fuchsia-400'
                            : 'bg-slate-950/60 border-white/10 text-slate-400 hover:text-slate-200 hover:border-white/20'
                        }`}
                      >
                        <div className="font-bold text-xs">{g.label}</div>
                        <div className="text-[10px] opacity-75 mt-0.5">{g.sub}</div>
                        <span className={`inline-block mt-1 text-[9px] px-1.5 py-0.2 rounded font-semibold ${
                          isSelected ? 'bg-fuchsia-500/30 text-fuchsia-200' : 'bg-white/5 text-slate-400'
                        }`}>
                          {g.badge}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Hızlı Şube Öneri Butonları */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1 flex items-center justify-between">
                  <span>Hızlı Şube Adı Şablonları</span>
                  <span className="text-[10px] text-slate-500">Tek tıkla doldur</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {(newClassGradeLevel === '9'
                    ? [
                        { name: '9-A', field: 'ORTAK' as ClassFieldType },
                        { name: '9-B', field: 'ORTAK' as ClassFieldType },
                        { name: '9-C', field: 'ORTAK' as ClassFieldType },
                        { name: '9-D', field: 'ORTAK' as ClassFieldType },
                        { name: '9-E', field: 'ORTAK' as ClassFieldType }
                      ]
                    : newClassGradeLevel === '10'
                    ? [
                        { name: '10-A', field: 'ORTAK' as ClassFieldType },
                        { name: '10-B', field: 'ORTAK' as ClassFieldType },
                        { name: '10-C', field: 'ORTAK' as ClassFieldType },
                        { name: '10-D', field: 'ORTAK' as ClassFieldType },
                        { name: '10-E', field: 'ORTAK' as ClassFieldType }
                      ]
                    : newClassGradeLevel === '11'
                    ? [
                        { name: '11-A SAY', field: 'SAY' as ClassFieldType },
                        { name: '11-B EA', field: 'EA' as ClassFieldType },
                        { name: '11-C SÖZ', field: 'SÖZ' as ClassFieldType },
                        { name: '11-D DİL', field: 'DİL' as ClassFieldType }
                      ]
                    : newClassGradeLevel === '12'
                    ? [
                        { name: '12-A SAY', field: 'SAY' as ClassFieldType },
                        { name: '12-B EA', field: 'EA' as ClassFieldType },
                        { name: '12-C SÖZ', field: 'SÖZ' as ClassFieldType },
                        { name: '12-D DİL', field: 'DİL' as ClassFieldType }
                      ]
                    : [
                        { name: 'Mezun-1 SAY', field: 'SAY' as ClassFieldType },
                        { name: 'Mezun-2 EA', field: 'EA' as ClassFieldType },
                        { name: 'Mezun-3 SÖZ', field: 'SÖZ' as ClassFieldType },
                        { name: 'Mezun-4 DİL', field: 'DİL' as ClassFieldType }
                      ]
                  ).map((sugg) => (
                    <button
                      key={sugg.name}
                      type="button"
                      onClick={() => {
                        setNewClassNameInput(sugg.name);
                        setNewClassFieldInput(sugg.field);
                      }}
                      className="px-2.5 py-1 bg-white/5 hover:bg-fuchsia-500/20 hover:border-fuchsia-400/40 text-slate-300 hover:text-white rounded-lg border border-white/10 text-[11px] font-mono font-bold transition-all"
                    >
                      + {sugg.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Sınıf Adı ve Alan Girişi */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Sınıf Şube Adı
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ör: 9-A veya 12-C SÖZ"
                    value={newClassNameInput}
                    onChange={(e) => setNewClassNameInput(e.target.value.toUpperCase())}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white font-mono font-bold uppercase focus:outline-none focus:border-fuchsia-400"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Alan Türü
                  </label>
                  {newClassGradeLevel === '9' || newClassGradeLevel === '10' ? (
                    <div className="w-full bg-purple-950/40 border border-purple-500/30 rounded-xl px-3 py-2 text-purple-200 font-semibold flex items-center justify-between">
                      <span>Ortak (Maarif Modeli)</span>
                      <span className="text-[9px] bg-purple-500/20 px-1.5 py-0.5 rounded border border-purple-400/30">MEB</span>
                    </div>
                  ) : (
                    <select
                      value={newClassFieldInput}
                      onChange={(e) => setNewClassFieldInput(e.target.value as ClassFieldType)}
                      className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-fuchsia-400 font-semibold"
                    >
                      <option value="SAY">Sayısal (SAY)</option>
                      <option value="EA">Eşit Ağırlık (EA)</option>
                      <option value="SÖZ">Sözel (SÖZ)</option>
                      <option value="DİL">Yabancı Dil (DİL)</option>
                    </select>
                  )}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Açıklama (Opsiyonel)
                </label>
                <input
                  type="text"
                  placeholder="Ör: 9. Sınıf Maarif Modeli A Şubesi veya Sayısal Derece Grubu"
                  value={newClassDescInput}
                  onChange={(e) => setNewClassDescInput(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-fuchsia-400"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowCreateClassModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-fuchsia-600/30 border border-fuchsia-400/40"
                >
                  Sınıfı Oluştur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT CLASS */}
      {showEditClassModal && classToEdit && (
        <div 
          className="fixed inset-0 z-[60] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
          onClick={(e) => { if (e.target === e.currentTarget) setShowEditClassModal(false); }}
        >
          <div className="bg-slate-900/95 backdrop-blur-2xl border border-white/15 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Edit className="w-5 h-5 text-emerald-400" />
                <span>Sınıfı Düzenle</span>
              </h3>
              <button onClick={() => setShowEditClassModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (editClassNameInput.trim()) {
                const finalField: ClassFieldType = (editClassGradeLevel === '9' || editClassGradeLevel === '10') ? 'ORTAK' : editClassFieldInput;
                if (onUpdateClass) {
                  onUpdateClass({
                    ...classToEdit,
                    name: editClassNameInput.trim().toUpperCase(),
                    gradeLevel: editClassGradeLevel,
                    description: editClassDescInput.trim(),
                    field: finalField
                  });
                }
                setShowEditClassModal(false);
                setClassToEdit(null);
              }
            }} className="space-y-4 text-xs">
              {/* Sınıf Kademesi Seçimi */}
              <div>
                <label className="block font-semibold text-slate-200 mb-1.5">Sınıf Seviyesi (Kademe)</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { value: '9' as GradeLevel, label: '9. Sınıf', sub: 'Lise 1', badge: 'Maarif Modeli' },
                    { value: '10' as GradeLevel, label: '10. Sınıf', sub: 'Lise 2', badge: 'Maarif Modeli' },
                    { value: '11' as GradeLevel, label: '11. Sınıf', sub: 'Lise 3', badge: 'Alan & YKS' },
                    { value: '12' as GradeLevel, label: '12. Sınıf', sub: 'YKS Maraton', badge: 'Tam YKS' },
                    { value: 'mezun' as GradeLevel, label: 'Mezun', sub: 'YKS Derece', badge: 'Mezun' }
                  ].map((g) => {
                    const isSelected = editClassGradeLevel === g.value;
                    return (
                      <button
                        key={g.value}
                        type="button"
                        onClick={() => {
                          setEditClassGradeLevel(g.value);
                          if (g.value === '9' || g.value === '10') {
                            setEditClassFieldInput('ORTAK');
                          } else if (editClassFieldInput === 'ORTAK') {
                            setEditClassFieldInput('SAY');
                          }
                        }}
                        className={`p-2.5 rounded-2xl border text-left transition-all ${
                          isSelected
                            ? 'bg-gradient-to-br from-emerald-600/30 to-teal-600/20 border-emerald-400 text-white shadow-md shadow-emerald-600/20 ring-1 ring-emerald-400'
                            : 'bg-slate-950/60 border-white/10 text-slate-400 hover:text-slate-200 hover:border-white/20'
                        }`}
                      >
                        <div className="font-bold text-xs">{g.label}</div>
                        <div className="text-[10px] opacity-75 mt-0.5">{g.sub}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Sınıf Şubesi</label>
                  <input 
                    type="text" 
                    autoFocus
                    required
                    value={editClassNameInput}
                    onChange={(e) => setEditClassNameInput(e.target.value.toUpperCase())}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 uppercase font-bold font-mono"
                    placeholder="12-A SAY"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Alan Türü
                  </label>
                  {editClassGradeLevel === '9' || editClassGradeLevel === '10' ? (
                    <div className="w-full bg-teal-950/40 border border-teal-500/30 rounded-xl px-3 py-2 text-teal-200 font-semibold flex items-center justify-between">
                      <span>Ortak (Maarif Modeli)</span>
                      <span className="text-[9px] bg-teal-500/20 px-1.5 py-0.5 rounded border border-teal-400/30">MEB</span>
                    </div>
                  ) : (
                    <select
                      value={editClassFieldInput}
                      onChange={(e) => setEditClassFieldInput(e.target.value as ClassFieldType)}
                      className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 font-semibold"
                    >
                      <option value="SAY">Sayısal (SAY)</option>
                      <option value="EA">Eşit Ağırlık (EA)</option>
                      <option value="SÖZ">Sözel (SÖZ)</option>
                      <option value="DİL">Yabancı Dil (DİL)</option>
                    </select>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Açıklama veya Not (Opsiyonel)</label>
                <input 
                  type="text" 
                  value={editClassDescInput}
                  onChange={(e) => setEditClassDescInput(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  placeholder="Sayısal ağırlıklı sınıf..."
                />
              </div>

              <div className="pt-2 flex justify-end space-x-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowEditClassModal(false)}
                  className="text-slate-400 font-semibold text-xs hover:text-white transition-colors"
                >
                  İptal
                </button>
                <button 
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-600/30 border border-emerald-400/40"
                >
                  Değişiklikleri Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REASSIGN STUDENT CLASS */}
      {reassigningStudent && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setReassigningStudent(null); }}
        >
          <div className="bg-slate-900/95 backdrop-blur-2xl border border-white/15 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <School className="w-5 h-5 text-indigo-400" />
                <span>Sınıf Değiştir</span>
              </h3>
              <button onClick={() => setReassigningStudent(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-300">
              <strong className="text-white font-bold">{reassigningStudent.name}</strong> isimli öğrencinin yeni sınıfını seçin:
            </div>

            <form onSubmit={handleReassignSubmit} className="space-y-4 text-xs">
              <div>
                <select
                  value={targetClassChoice}
                  onChange={(e) => setTargetClassChoice(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none font-semibold text-indigo-300"
                >
                  {[
                    { key: '9' as GradeLevel, label: '🎓 9. Sınıflar (Maarif Modeli)' },
                    { key: '10' as GradeLevel, label: '🎓 10. Sınıflar (Maarif Modeli)' },
                    { key: '11' as GradeLevel, label: '📘 11. Sınıflar (Alan & YKS)' },
                    { key: '12' as GradeLevel, label: '🎯 12. Sınıflar (YKS Maratonu)' },
                    { key: 'mezun' as GradeLevel, label: '🏆 Mezun Grupları' },
                  ].map(g => {
                    const matching = classes.filter(c => (c.gradeLevel || getGradeLevel(c.name)) === g.key);
                    if (matching.length === 0) return null;
                    return (
                      <optgroup key={g.key} label={g.label} className="bg-slate-900 text-slate-300 font-bold">
                        {matching.map(c => (
                          <option key={c.id || c.name} value={c.name} className="bg-slate-950 text-white font-normal">
                            {c.name} {c.description ? `(${c.description})` : ''}
                          </option>
                        ))}
                      </optgroup>
                    );
                  })}
                </select>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReassigningStudent(null)}
                  className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-600/30 border border-indigo-400/40"
                >
                  Sınıfı Güncelle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CLASS-CENTRIC TEACHER ASSIGNMENT */}
      {showClassTeacherAssignModal && selectedClassForTeacherAssign && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowClassTeacherAssignModal(false); }}
        >
          <div className="bg-slate-900/95 backdrop-blur-2xl border border-purple-500/30 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4 shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/40 text-purple-300 flex items-center justify-center">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Sınıf Öğretmen Atama Paneli</h3>
                  <p className="text-[11px] text-purple-300">Sınıfa Özel Rehber / Ders Öğretmeni Ataması</p>
                </div>
              </div>
              <button onClick={() => setShowClassTeacherAssignModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Selected Class Banner & Switcher */}
            <div className="bg-gradient-to-r from-purple-900/30 via-slate-900 to-emerald-900/20 border border-purple-500/30 p-4 rounded-2xl space-y-2 shrink-0">
              <div className="flex items-center justify-between">
                <label className="text-xs text-slate-300 font-bold flex items-center space-x-1.5">
                  <School className="w-4 h-4 text-emerald-400" />
                  <span>Atama Yapılan Sınıf:</span>
                </label>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded font-mono font-bold">
                  {allUsers.filter(u => u.role === 'student' && u.className === selectedClassForTeacherAssign.name).length} Kayıtlı Öğrenci
                </span>
              </div>

              <select
                value={selectedClassForTeacherAssign.id}
                onChange={(e) => {
                  const targetCls = classes.find(c => c.id === e.target.value) || null;
                  if (targetCls) {
                    setSelectedClassForTeacherAssign(targetCls);
                    const assignedIds = allUsers
                      .filter(u => (u.role === 'class_teacher' || u.role === 'teacher' || u.role === 'school_counselor') && u.assignedClassNames?.includes(targetCls.name))
                      .map(u => u.id);
                    setSelectedTeacherIdsForClass(assignedIds);
                  }
                }}
                className="w-full bg-slate-950 border border-purple-500/40 rounded-xl px-3 py-2 text-white font-bold text-sm focus:outline-none focus:border-purple-400"
              >
                {classes.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} Şubesi {c.description ? `(${c.description})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Teacher Selection List */}
            <div className="space-y-3 flex-1 overflow-hidden flex flex-col text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-300 font-semibold">Bu Sınıfa Atanacak Öğretmenler:</span>
                <span className="text-[11px] text-purple-300 font-mono font-bold bg-purple-500/20 px-2 py-0.5 rounded border border-purple-500/30">
                  {selectedTeacherIdsForClass.length} Öğretmen Seçili
                </span>
              </div>

              {/* Search input */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Öğretmen ismi veya şubeye göre ara..."
                  value={classTeacherSearchTerm}
                  onChange={(e) => setClassTeacherSearchTerm(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-400"
                />
              </div>

              {/* Teachers */}
              <div className="overflow-y-auto pr-1 space-y-2 flex-1 max-h-[300px]">
                {allUsers
                  .filter(u => u.role === 'class_teacher' || u.role === 'teacher' || u.role === 'school_counselor')
                  .filter(u => {
                    if (!classTeacherSearchTerm.trim()) return true;
                    const term = classTeacherSearchTerm.toLowerCase();
                    const assignedStr = (u.assignedClassNames || []).join(' ').toLowerCase();
                    return u.name.toLowerCase().includes(term) || (u.title || '').toLowerCase().includes(term) || assignedStr.includes(term);
                  })
                  .map(tUser => {
                    const isChecked = selectedTeacherIdsForClass.includes(tUser.id);
                    const assignedClasses = tUser.assignedClassNames || [];
                    const hasAssignedClasses = assignedClasses.length > 0;
                    const assignedClassesText = hasAssignedClasses
                      ? `(Atanmış Sınıf: ${assignedClasses.join(', ')})`
                      : '(Atanmış Sınıf Yok)';

                    return (
                      <div
                        key={tUser.id}
                        onClick={() => {
                          setSelectedTeacherIdsForClass(prev => 
                            prev.includes(tUser.id)
                              ? prev.filter(id => id !== tUser.id)
                              : [...prev, tUser.id]
                          );
                        }}
                        className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between gap-2 ${
                          isChecked
                            ? 'bg-purple-600/20 border-purple-500/50 text-white shadow-md'
                            : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center space-x-3 min-w-0">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="w-4 h-4 rounded border-white/20 text-purple-600 focus:ring-purple-500 cursor-pointer shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center space-x-2 flex-wrap">
                              <span className="font-bold text-white text-xs truncate">{tUser.name}</span>
                              <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-semibold border border-slate-700 shrink-0">
                                {tUser.title || 'Öğretmen'}
                              </span>
                            </div>
                            <p className="text-[11px] mt-0.5 font-mono truncate">
                              {hasAssignedClasses ? (
                                <span className="text-purple-300 font-semibold">{assignedClassesText}</span>
                              ) : (
                                <span className="text-slate-500">{assignedClassesText}</span>
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="shrink-0">
                          {isChecked ? (
                            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-lg border border-emerald-500/30">
                              Atandı
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-700">
                              Seç
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-white/10 shrink-0 text-xs">
              <button
                type="button"
                onClick={() => setShowClassTeacherAssignModal(false)}
                className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!selectedClassForTeacherAssign) return;
                  const className = selectedClassForTeacherAssign.name;
                  const teacherUsers = allUsers.filter(u => u.role === 'class_teacher' || u.role === 'teacher' || u.role === 'school_counselor');

                  teacherUsers.forEach(tUser => {
                    const currentClasses = tUser.assignedClassNames || [];
                    const isCurrentlyAssigned = currentClasses.includes(className);
                    const shouldBeAssigned = selectedTeacherIdsForClass.includes(tUser.id);

                    if (shouldBeAssigned && !isCurrentlyAssigned) {
                      const newClasses = [...currentClasses, className];
                      if (onUpdateTeacherAssignedClasses) {
                        onUpdateTeacherAssignedClasses(tUser.id, newClasses);
                      }
                    } else if (!shouldBeAssigned && isCurrentlyAssigned) {
                      const newClasses = currentClasses.filter(c => c !== className);
                      if (onUpdateTeacherAssignedClasses) {
                        onUpdateTeacherAssignedClasses(tUser.id, newClasses);
                      }
                    }
                  });

                  setShowClassTeacherAssignModal(false);
                  alert(`Sayın ${teacher.name}, "${className}" sınıfı için öğretmen atamaları başarıyla kaydedildi.`);
                }}
                className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-purple-600/30 border border-purple-400/40"
              >
                Atamaları Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ASSIGN CLASSES TO TEACHERS (OKUL REHBER ÖĞRETMENİ YETKİSİ) */}
      {showAssignTeacherModal && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowAssignTeacherModal(false); }}
        >
          <div className="bg-slate-900/95 backdrop-blur-2xl border border-purple-500/30 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/40 text-purple-300 flex items-center justify-center">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Öğretmen Sınıf Atama Yönetimi</h3>
                  <p className="text-[11px] text-purple-300">Okul Rehberlik Yetkilisi Sınıf Atama Paneli</p>
                </div>
              </div>
              <button onClick={() => setShowAssignTeacherModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">Atama Yapılacak Sınıf Rehber Öğretmeni:</label>
                <select
                  value={selectedTeacherForAssignment?.id || ''}
                  onChange={(e) => {
                    const found = allUsers.find(u => u.id === e.target.value) || null;
                    setSelectedTeacherForAssignment(found);
                    setAssignedClassesForSelectedTeacher(found?.assignedClassNames || []);
                  }}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none font-bold text-purple-300"
                >
                  {allUsers.filter(u => u.role === 'class_teacher' || u.role === 'teacher').map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.title || 'Sınıf Öğretmeni'})</option>
                  ))}
                </select>
              </div>

              {selectedTeacherForAssignment && (
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">{selectedTeacherForAssignment.name} Sorumlu Olacağı Sınıflar:</span>
                    <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded font-mono">
                      {assignedClassesForSelectedTeacher.length} Sınıf Seçili
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {classes.map((cls) => {
                      const isChecked = assignedClassesForSelectedTeacher.includes(cls.name);
                      return (
                        <div
                          key={cls.id}
                          onClick={() => {
                            if (isChecked) {
                              setAssignedClassesForSelectedTeacher(prev => prev.filter(c => c !== cls.name));
                            } else {
                              setAssignedClassesForSelectedTeacher(prev => [...prev, cls.name]);
                            }
                          }}
                          className={`p-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all flex items-center space-x-2 ${
                            isChecked
                              ? 'bg-purple-600/20 border-purple-500/50 text-white shadow-sm'
                              : 'bg-white/5 border-white/10 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="rounded border-white/20 text-purple-600 focus:ring-purple-500"
                          />
                          <span>{cls.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAssignTeacherModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                >
                  İptal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!selectedTeacherForAssignment) return;
                    if (onUpdateTeacherAssignedClasses) {
                      onUpdateTeacherAssignedClasses(selectedTeacherForAssignment.id, assignedClassesForSelectedTeacher);
                    }
                    setShowAssignTeacherModal(false);
                    alert(`Sayın ${teacher.name}, ${selectedTeacherForAssignment.name} için atanmış sınıflar güncellendi: [${assignedClassesForSelectedTeacher.join(', ')}]`);
                  }}
                  className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-purple-600/30 border border-purple-400/40"
                >
                  Atamaları Kaydet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREATE NEW TEACHER ACCOUNT */}
      {showCreateTeacherModal && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowCreateTeacherModal(false); }}
        >
          <div className="bg-slate-900/95 backdrop-blur-2xl border border-purple-500/30 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center space-x-2">
                <UserPlus className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-bold text-white">Yeni Öğretmen Hesabı Tanımla</h3>
              </div>
              <button onClick={() => setShowCreateTeacherModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newTeacherName.trim() || !newTeacherEmail.trim()) return;
                if (onCreateTeacherAccount) {
                  onCreateTeacherAccount({
                    name: newTeacherName.trim(),
                    email: newTeacherEmail.trim(),
                    password: newTeacherPassword || '123456',
                    role: newTeacherRole,
                    title: newTeacherTitle.trim() || (newTeacherRole === 'teacher' ? `${newTeacherSubject} Öğretmeni` : 'Sınıf Rehber Öğretmeni'),
                    subject: newTeacherRole === 'teacher' ? newTeacherSubject : undefined,
                    assignedClassNames: newTeacherAssignedClasses,
                    mustChangePassword: true
                  });
                }
                setShowCreateTeacherModal(false);
                alert(`Yeni öğretmen hesabı tanımlandı: ${newTeacherName}`);
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Ad Soyad</label>
                <input
                  type="text"
                  required
                  placeholder="Ör: Elif Yılmaz"
                  value={newTeacherName}
                  onChange={(e) => setNewTeacherName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">E-posta Adresi</label>
                <input
                  type="email"
                  required
                  placeholder="elif.yilmaz@okul.k12.tr"
                  value={newTeacherEmail}
                  onChange={(e) => setNewTeacherEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Unvan / Açıklama</label>
                <input
                  type="text"
                  placeholder="Ör: Matematik Zümre Başkanı & 12-A Rehber Öğretmeni"
                  value={newTeacherTitle}
                  onChange={(e) => setNewTeacherTitle(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Giriş Şifresi <span className="text-[11px] text-amber-400 font-normal ml-1">(İlk girişte değiştirilecektir)</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Varsayılan: 123456"
                  value={newTeacherPassword}
                  onChange={(e) => setNewTeacherPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-400 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Rol / Yetki Tipi</label>
                <select
                  value={newTeacherRole}
                  onChange={(e) => setNewTeacherRole(e.target.value as any)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-400 font-bold"
                >
                  <option value="teacher">Branş Öğretmeni</option>
                  <option value="class_teacher">Sınıf Rehber Öğretmeni</option>
                  <option value="school_counselor">Okul Rehber Öğretmeni</option>
                </select>
              </div>

              {newTeacherRole === 'teacher' && (
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Öğretmen Branşı / Dersi</label>
                  <select
                    value={newTeacherSubject}
                    onChange={(e) => setNewTeacherSubject(e.target.value)}
                    className="w-full bg-slate-950 border border-purple-500/40 rounded-xl px-3 py-2 text-purple-200 font-bold focus:outline-none"
                  >
                    <option value="Matematik">Matematik</option>
                    <option value="Fizik">Fizik</option>
                    <option value="Kimya">Kimya</option>
                    <option value="Biyoloji">Biyoloji</option>
                    <option value="Türkçe">Türkçe / Türk Dili ve Edebiyatı</option>
                    <option value="Tarih">Tarih</option>
                    <option value="Coğrafya">Coğrafya</option>
                    <option value="Felsefe">Felsefe</option>
                    <option value="Din Kültürü">Din Kültürü ve Ahlak Bilgisi</option>
                    <option value="İngilizce">İngilizce / Yabancı Dil</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Atanacak Sınıflar</label>
                <div className="grid grid-cols-2 gap-1.5 p-2 bg-white/5 rounded-xl border border-white/10 max-h-32 overflow-y-auto">
                  {classes.map((cls) => {
                    const isChecked = newTeacherAssignedClasses.includes(cls.name);
                    return (
                      <label key={cls.id} className="flex items-center space-x-2 text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) {
                              setNewTeacherAssignedClasses(prev => prev.filter(c => c !== cls.name));
                            } else {
                              setNewTeacherAssignedClasses(prev => [...prev, cls.name]);
                            }
                          }}
                          className="rounded border-white/20 text-purple-600 focus:ring-purple-500"
                        />
                        <span>{cls.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowCreateTeacherModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-4 py-2 rounded-xl shadow-lg shadow-purple-600/30 border border-purple-400/40"
                >
                  Hesabı Oluştur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT STUDENT ACCOUNT */}
      {showEditStudentModal && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowEditStudentModal(false); }}
        >
          <div className="bg-slate-900/95 backdrop-blur-2xl border border-indigo-500/30 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">Öğrenci Bilgilerini Düzenle</h3>
              </div>
              <button onClick={() => setShowEditStudentModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!editStudentName.trim() || !editStudentEmail.trim()) return;
                const existingUser = allUsers.find(u => u.id === editingStudentId);
                if (existingUser && onUpdateStudentAccount) {
                  onUpdateStudentAccount({
                    ...existingUser,
                    name: editStudentName.trim(),
                    email: editStudentEmail.trim(),
                    className: editStudentClassName.trim() || undefined,
                    password: '' // Don't write password in plaintext
                  });
                  
                  if (editStudentPassword.trim()) {
                     fetch('/api/auth/reset-password', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: editStudentEmail.trim(), newPassword: editStudentPassword.trim() })
                     }).catch(e => console.error("Password reset failed", e));
                  }
                }
                setShowEditStudentModal(false);
                alert(`Öğrenci hesabı güncellendi: ${editStudentName}`);
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Ad Soyad</label>
                <input
                  type="text"
                  required
                  placeholder="Ör: Ahmet Yılmaz"
                  value={editStudentName}
                  onChange={(e) => setEditStudentName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">E-posta</label>
                <input
                  type="email"
                  required
                  placeholder="ahmet.yilmaz@okul.com"
                  value={editStudentEmail}
                  onChange={(e) => setEditStudentEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Sınıf</label>
                <select
                  value={editStudentClassName}
                  onChange={(e) => setEditStudentClassName(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-400"
                >
                  <option value="">Sınıf Seçiniz</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Şifre Güncelle <span className="text-[10px] text-slate-400 font-normal">(İsteğe Bağlı)</span>
                </label>
                <input
                  type="text"
                  placeholder="Değiştirmek istemiyorsanız boş bırakın..."
                  value={editStudentPassword}
                  onChange={(e) => setEditStudentPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-400 font-mono font-bold"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowEditStudentModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-xl shadow-lg shadow-indigo-600/30 border border-indigo-400/40"
                >
                  Değişiklikleri Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT TEACHER ACCOUNT */}
      {showEditTeacherModal && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowEditTeacherModal(false); }}
        >
          <div className="bg-slate-900/95 backdrop-blur-2xl border border-purple-500/30 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center space-x-2">
                <UserCheck className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-bold text-white">Öğretmen Bilgilerini Düzenle</h3>
              </div>
              <button onClick={() => setShowEditTeacherModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!editTeacherName.trim() || !editTeacherEmail.trim()) return;
                const existingUser = allUsers.find(u => u.id === editingTeacherId);
                if (existingUser && onUpdateTeacherAccount) {
                  const updatedUser = {
                    ...existingUser,
                    name: editTeacherName.trim(),
                    email: editTeacherEmail.trim(),
                    title: editTeacherTitle.trim(),
                    role: editTeacherRole,
                    subject: editTeacherRole === 'teacher' ? editTeacherSubject : undefined
                  };

                  if (editTeacherPassword.trim()) {
                    fetch('/api/auth/reset-password', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ email: editTeacherEmail.trim(), newPassword: editTeacherPassword.trim() })
                    }).catch(e => console.error("Teacher password reset failed", e));
                    updatedUser.mustChangePassword = true;
                  }

                  onUpdateTeacherAccount(updatedUser);
                }
                setShowEditTeacherModal(false);
                alert(`Öğretmen hesabı güncellendi: ${editTeacherName}`);
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Ad Soyad</label>
                <input
                  type="text"
                  required
                  placeholder="Ör: Elif Yılmaz"
                  value={editTeacherName}
                  onChange={(e) => setEditTeacherName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">E-posta</label>
                <input
                  type="email"
                  required
                  placeholder="elif.yilmaz@okul.com"
                  value={editTeacherEmail}
                  onChange={(e) => setEditTeacherEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Unvan</label>
                <input
                  type="text"
                  placeholder="Ör: Sınıf Rehber Öğretmeni, Matematik Zümre Başkanı vb."
                  value={editTeacherTitle}
                  onChange={(e) => setEditTeacherTitle(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Sistem Yetki Rolü</label>
                <select
                  value={editTeacherRole}
                  onChange={(e) => setEditTeacherRole(e.target.value as any)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-400 font-bold"
                >
                  <option value="teacher">Branş Öğretmeni</option>
                  <option value="class_teacher">Sınıf Rehber Öğretmeni</option>
                  <option value="school_counselor">Okul Rehber Öğretmeni</option>
                </select>
              </div>

              {editTeacherRole === 'teacher' && (
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Öğretmen Branşı / Dersi</label>
                  <select
                    value={editTeacherSubject || 'Matematik'}
                    onChange={(e) => setEditTeacherSubject(e.target.value)}
                    className="w-full bg-slate-950 border border-purple-500/40 rounded-xl px-3 py-2 text-purple-200 font-bold focus:outline-none"
                  >
                    <option value="Matematik">Matematik</option>
                    <option value="Fizik">Fizik</option>
                    <option value="Kimya">Kimya</option>
                    <option value="Biyoloji">Biyoloji</option>
                    <option value="Türkçe">Türkçe / Türk Dili ve Edebiyatı</option>
                    <option value="Tarih">Tarih</option>
                    <option value="Coğrafya">Coğrafya</option>
                    <option value="Felsefe">Felsefe</option>
                    <option value="Din Kültürü">Din Kültürü ve Ahlak Bilgisi</option>
                    <option value="İngilizce">İngilizce / Yabancı Dil</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Şifre Güncelle <span className="text-[10px] text-slate-400 font-normal">(İsteğe Bağlı)</span>
                </label>
                <input
                  type="text"
                  placeholder="Değiştirmek istemiyorsanız boş bırakın..."
                  value={editTeacherPassword}
                  onChange={(e) => setEditTeacherPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-400 font-mono font-bold"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowEditTeacherModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-4 py-2 rounded-xl shadow-lg shadow-purple-600/30 border border-purple-400/40"
                >
                  Değişiklikleri Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE NEW STUDENT ACCOUNT */}
      {showCreateStudentModal && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowCreateStudentModal(false); }}
        >
          <div className="bg-slate-900/95 backdrop-blur-2xl border border-indigo-500/30 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center space-x-2">
                <UserPlus className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">Yeni Öğrenci Ekle</h3>
              </div>
              <button onClick={() => setShowCreateStudentModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newStudentName.trim() || !newStudentEmail.trim()) return;
                const targetClass = newStudentClass || (availableClasses.length > 0 ? availableClasses[0] : '12-A SAY');
                if (onCreateStudentAccount) {
                  onCreateStudentAccount({
                    name: newStudentName.trim(),
                    email: newStudentEmail.trim(),
                    password: newStudentPassword.trim() || '123456',
                    role: 'student',
                    className: targetClass,
                    avatarUrl: `https://images.unsplash.com/photo-${1534528741775 + Math.floor(Math.random() * 50)}?w=150&auto=format&fit=crop&q=80`,
                    mustChangePassword: true
                  });
                }
                setShowCreateStudentModal(false);
                setNewStudentName('');
                setNewStudentEmail('');
                setNewStudentPassword('123456');
                alert(`"${newStudentName.trim()}" isimli öğrenci (${targetClass}) başarıyla eklendi.`);
              }}
              className="space-y-3.5 text-xs"
            >
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Öğrenci Ad Soyad</label>
                <input
                  type="text"
                  required
                  placeholder="Ör: Burak Yılmaz"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">E-posta Adresi</label>
                <input
                  type="email"
                  required
                  placeholder="burak.yilmaz@ogrenci.k12.tr"
                  value={newStudentEmail}
                  onChange={(e) => setNewStudentEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Giriş Şifresi <span className="text-[11px] text-amber-400 font-normal ml-1">(İlk girişte değiştirilecektir)</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Varsayılan: 123456"
                  value={newStudentPassword}
                  onChange={(e) => setNewStudentPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-400 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Kayıt Edilecek Sınıf</label>
                <select
                  value={newStudentClass || (availableClasses.length > 0 ? availableClasses[0] : '12-A SAY')}
                  onChange={(e) => setNewStudentClass(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-400"
                >
                  {[
                    { key: '9' as GradeLevel, label: '🎓 9. Sınıflar (Maarif Modeli)' },
                    { key: '10' as GradeLevel, label: '🎓 10. Sınıflar (Maarif Modeli)' },
                    { key: '11' as GradeLevel, label: '📘 11. Sınıflar (Alan & YKS)' },
                    { key: '12' as GradeLevel, label: '🎯 12. Sınıflar (YKS Maratonu)' },
                    { key: 'mezun' as GradeLevel, label: '🏆 Mezun Grupları' },
                  ].map(g => {
                    const matching = classes.filter(c => (c.gradeLevel || getGradeLevel(c.name)) === g.key);
                    if (matching.length === 0) return null;
                    return (
                      <optgroup key={g.key} label={g.label} className="bg-slate-900 text-slate-300 font-bold">
                        {matching.map(c => (
                          <option key={c.id || c.name} value={c.name} className="bg-slate-950 text-white font-normal">
                            {c.name} {c.description ? `(${c.description})` : ''}
                          </option>
                        ))}
                      </optgroup>
                    );
                  })}
                </select>
              </div>

              <div className="bg-indigo-500/10 border border-indigo-500/20 p-3 rounded-xl text-[11px] text-indigo-300">
                💡 Öğrenci eklendikten sonra doğrudan sınıf listesinde görüntülenecek, kişisel haftalık çalışma planı ve performans takibi aktifleşecektir.
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowCreateStudentModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-xl shadow-lg shadow-indigo-600/30 border border-indigo-400/40"
                >
                  Öğrenciyi Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: FULL WEEKLY TEMPLATE PREVIEW & DRAG-AND-DROP EDITOR */}
      {weeklyPreviewTemplate && (
        <TemplateWeeklyPreviewModal
          template={weeklyPreviewTemplate}
          onClose={() => setWeeklyPreviewTemplate(null)}
          onSave={(updated) => {
            if (onUpdateProgramTemplate) {
              onUpdateProgramTemplate(updated);
            }
            setWeeklyPreviewTemplate(null);
          }}
          onApplyToStudent={(tpl) => {
            setSelectedTemplateToApply(tpl);
            setWeeklyPreviewTemplate(null);
            setShowApplyTemplateModal(true);
          }}
        />
      )}

      {/* MODAL: 3-STEP STUDENT DELETION CONFIRMATION FOR REHBER ÖĞRETMEN */}
      {studentToDelete && (
        <div 
          className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => {
            setStudentToDelete(null);
            setDeleteConfirmationStep(1);
            setTypedConfirmName('');
          }}
        >
          <div 
            className="bg-slate-900 border border-rose-500/30 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center space-x-2 text-rose-400">
                <ShieldAlert className="w-5 h-5" />
                <h3 className="text-base font-bold text-white">Güvenli Öğrenci Silme Yetkilendirmesi</h3>
              </div>
              <button 
                onClick={() => {
                  setStudentToDelete(null);
                  setDeleteConfirmationStep(1);
                  setTypedConfirmName('');
                }} 
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stepper indicator */}
            <div className="flex items-center justify-between bg-slate-950/50 p-3 rounded-2xl border border-white/5">
              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Silme Güvenlik Adımları</span>
              <div className="flex items-center space-x-1.5">
                {[1, 2, 3].map((s) => (
                  <div 
                    key={s} 
                    className={`h-2.5 rounded-full transition-all duration-300 ${
                      deleteConfirmationStep === s 
                        ? 'w-7 bg-rose-500' 
                        : deleteConfirmationStep > s 
                        ? 'w-2.5 bg-rose-500/40' 
                        : 'w-2.5 bg-slate-800'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Step Content */}
            <div className="space-y-4 text-xs">
              {deleteConfirmationStep === 1 && (
                <div className="space-y-3.5 animate-in fade-in duration-150">
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-300 font-medium leading-relaxed">
                    <strong>UYARI 1:</strong> <span className="font-bold text-white">{studentToDelete.name}</span> isimli öğrenci hesabını sistemden silmek üzeresiniz. Bu işlem öğrencinin sisteme girişini sonlandıracaktır.
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    Öğrencinin silinme işlemini başlatmak istediğinizden emin misiniz? Devam etmek için aşağıdaki onay butonuna tıklayın.
                  </p>
                  <button
                    onClick={() => setDeleteConfirmationStep(2)}
                    className="w-full py-2.5 px-4 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 font-bold rounded-xl border border-rose-500/30 hover:border-rose-500/50 transition-all flex items-center justify-center space-x-2"
                  >
                    <span>Evet, Silmek İstiyorum (1/3 Onaylandı)</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {deleteConfirmationStep === 2 && (
                <div className="space-y-3.5 animate-in fade-in duration-150">
                  <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-2xl text-rose-300 font-medium leading-relaxed">
                    <strong>KENDİNDEN EMİN MİSİNİZ? (UYARI 2):</strong> Bu işlem öğrenciye ait;
                    <ul className="list-disc pl-4 mt-2 space-y-1 text-slate-300 font-semibold">
                      <li>Haftalık Ders Çalışma Programları</li>
                      <li>Soru Takip ve Günlük Soru Sayısı Logları</li>
                      <li>Deneme Sınavı Netleri ve Akademik Başarı Grafikleri</li>
                      <li>Tüm Hedef ve Kişisel Ayarlarını</li>
                    </ul>
                    <span className="mt-2 block font-extrabold text-white text-[11px] uppercase tracking-wider text-center bg-rose-500/20 p-2 rounded-xl">
                      GERİ DÖNDÜRÜLEMEZ ŞEKİLDE KALICI OLARAK YOK EDECEKTİR!
                    </span>
                  </div>
                  <p className="text-slate-300 leading-relaxed text-[11px]">
                    Öğretmenler tarafından yapılan tüm koçluk notları da silinecektir. Devam etmeyi onaylıyor musunuz?
                  </p>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setDeleteConfirmationStep(1)}
                      className="w-1/3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-all"
                    >
                      Geri Dön
                    </button>
                    <button
                      onClick={() => setDeleteConfirmationStep(3)}
                      className="w-2/3 py-2.5 px-4 bg-rose-600/30 hover:bg-rose-600/40 text-rose-200 font-bold rounded-xl border border-rose-500/40 hover:border-rose-500 transition-all flex items-center justify-center space-x-2"
                    >
                      <span>Onaylıyorum (2/3 Onaylandı)</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {deleteConfirmationStep === 3 && (
                <div className="space-y-3.5 animate-in fade-in duration-150">
                  <div className="p-3 bg-red-500/20 border border-red-500/40 rounded-2xl text-red-200 font-bold leading-relaxed text-center">
                    ⚠️ KRİTİK GÜVENLİK ADIMI (3/3)
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    Silme işlemini tamamlamak için lütfen öğrencinin tam adını (<strong className="text-white select-all">{studentToDelete.name}</strong>) aşağıdaki kutuya yazın:
                  </p>
                  <input
                    type="text"
                    placeholder="Öğrenci Adını Girin..."
                    value={typedConfirmName}
                    onChange={(e) => setTypedConfirmName(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-red-500 text-xs font-bold text-center"
                  />
                  <div className="flex space-x-2 pt-1">
                    <button
                      onClick={() => setDeleteConfirmationStep(2)}
                      className="w-1/3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-all"
                    >
                      Geri Dön
                    </button>
                    <button
                      disabled={typedConfirmName.trim() !== studentToDelete.name}
                      onClick={() => {
                        if (onDeleteStudentAccount) {
                          onDeleteStudentAccount(studentToDelete.id);
                        }
                        setStudentToDelete(null);
                        setDeleteConfirmationStep(1);
                        setTypedConfirmName('');
                        alert(`"${studentToDelete.name}" öğrencisi ve tüm verileri başarıyla ve güvenle sistemden tamamen silindi.`);
                      }}
                      className={`w-2/3 py-2.5 px-4 font-bold rounded-xl border transition-all flex items-center justify-center space-x-2 ${
                        typedConfirmName.trim() === studentToDelete.name
                          ? 'bg-red-600 hover:bg-red-500 text-white border-red-400 shadow-lg shadow-red-600/30'
                          : 'bg-slate-800 text-slate-500 border-white/5 cursor-not-allowed'
                      }`}
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Kalıcı Olarak Sil (3/3)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: 3-STEP TEACHER DELETION CONFIRMATION */}
      {teacherToDelete && (
        <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-red-500/30 rounded-2xl max-w-md w-full p-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-white/5">
              <div className="p-2.5 bg-rose-500/20 rounded-xl border border-rose-500/30">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">Öğretmen Silme İşlemi</h3>
                <p className="text-xs text-rose-400 font-medium">Bu işlem geri alınamaz!</p>
              </div>
            </div>

            {/* Stepper indicator */}
            <div className="flex items-center justify-between bg-slate-950/50 p-3 rounded-2xl border border-white/5 mb-4">
              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Silme Güvenlik Adımları</span>
              <div className="flex items-center space-x-1.5">
                {[1, 2, 3].map((s) => (
                  <div 
                    key={s} 
                    className={`h-2.5 rounded-full transition-all duration-300 ${
                      deleteTeacherConfirmationStep === s 
                        ? 'w-7 bg-rose-500' 
                        : deleteTeacherConfirmationStep > s 
                        ? 'w-2.5 bg-rose-500/40' 
                        : 'w-2.5 bg-slate-800'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Step Content */}
            <div className="space-y-4 text-xs">
              {deleteTeacherConfirmationStep === 1 && (
                <div className="space-y-3.5 animate-in fade-in duration-150">
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-300 font-medium leading-relaxed">
                    <strong>UYARI 1:</strong> <span className="font-bold text-white">{teacherToDelete.name}</span> isimli öğretmen hesabını sistemden silmek üzeresiniz. Bu işlem öğretmenin sisteme girişini sonlandıracaktır.
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    Öğretmenin silinme işlemini başlatmak istediğinizden emin misiniz? Devam etmek için aşağıdaki onay butonuna tıklayın.
                  </p>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setTeacherToDelete(null);
                        setDeleteTeacherConfirmationStep(1);
                        setTypedTeacherConfirmName('');
                      }}
                      className="w-1/3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-all"
                    >
                      İptal
                    </button>
                    <button
                      onClick={() => setDeleteTeacherConfirmationStep(2)}
                      className="w-2/3 py-2.5 px-4 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 font-bold rounded-xl border border-rose-500/30 hover:border-rose-500/50 transition-all flex items-center justify-center space-x-2"
                    >
                      <span>Evet, Silmek İstiyorum (1/3 Onaylandı)</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {deleteTeacherConfirmationStep === 2 && (
                <div className="space-y-3.5 animate-in fade-in duration-150">
                  <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-2xl text-rose-300 font-medium leading-relaxed">
                    <strong>KENDİNDEN EMİN MİSİNİZ? (UYARI 2):</strong> Bu işlem öğretmene ait hesap verilerini ve sisteme erişimini kalıcı olarak kaldıracaktır. Sınıf atamaları iptal edilecektir.
                    <span className="mt-2 block font-extrabold text-white text-[11px] uppercase tracking-wider text-center bg-rose-500/20 p-2 rounded-xl">
                      GERİ DÖNDÜRÜLEMEZ ŞEKİLDE KALICI OLARAK YOK EDECEKTİR!
                    </span>
                  </div>
                  <p className="text-slate-300 leading-relaxed text-[11px]">
                    Devam etmeyi onaylıyor musunuz?
                  </p>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setDeleteTeacherConfirmationStep(1)}
                      className="w-1/3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-all"
                    >
                      Geri Dön
                    </button>
                    <button
                      onClick={() => setDeleteTeacherConfirmationStep(3)}
                      className="w-2/3 py-2.5 px-4 bg-rose-600/30 hover:bg-rose-600/40 text-rose-200 font-bold rounded-xl border border-rose-500/40 hover:border-rose-500 transition-all flex items-center justify-center space-x-2"
                    >
                      <span>Onaylıyorum (2/3 Onaylandı)</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {deleteTeacherConfirmationStep === 3 && (
                <div className="space-y-3.5 animate-in fade-in duration-150">
                  <div className="p-3 bg-red-500/20 border border-red-500/40 rounded-2xl text-red-200 font-bold leading-relaxed text-center">
                    ⚠️ KRİTİK GÜVENLİK ADIMI (3/3)
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    Silme işlemini tamamlamak için lütfen öğretmenin tam adını (<strong className="text-white select-all">{teacherToDelete.name}</strong>) aşağıdaki kutuya yazın:
                  </p>
                  <input
                    type="text"
                    placeholder="Öğretmen Adını Girin..."
                    value={typedTeacherConfirmName}
                    onChange={(e) => setTypedTeacherConfirmName(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-red-500 text-xs font-bold text-center"
                  />
                  <div className="flex space-x-2 pt-1">
                    <button
                      onClick={() => setDeleteTeacherConfirmationStep(2)}
                      className="w-1/3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-all"
                    >
                      Geri Dön
                    </button>
                    <button
                      onClick={() => {
                        if (typedTeacherConfirmName.trim() === teacherToDelete.name) {
                          if (onDeleteTeacherAccount) {
                            onDeleteTeacherAccount(teacherToDelete.id);
                          }
                          setTeacherToDelete(null);
                          setDeleteTeacherConfirmationStep(1);
                          setTypedTeacherConfirmName('');
                          alert(`"${teacherToDelete.name}" öğretmeni başarıyla sistemden silindi.`);
                        }
                      }}
                      className={`w-2/3 py-2.5 px-4 font-bold rounded-xl border transition-all flex items-center justify-center space-x-2 ${
                        typedTeacherConfirmName.trim() === teacherToDelete.name
                          ? 'bg-red-600 hover:bg-red-500 text-white border-red-400 shadow-lg shadow-red-600/30'
                          : 'bg-slate-800 text-slate-500 border-white/5 cursor-not-allowed'
                      }`}
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Kalıcı Olarak Sil (3/3)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showLogoManager && (
        <UniversityLogoManagerModal onClose={() => setShowLogoManager(false)} />
      )}

      {/* Teacher's Subject Notes & Coaching Notes Modal */}
      {activeNotesSubject && selectedStudentUser && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-indigo-500/30 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative animate-in zoom-in-95 duration-200">
            
            {/* Close Button */}
            <button
              onClick={() => setActiveNotesSubject(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Title */}
            <div className="flex items-center space-x-2 pb-2 border-b border-white/10">
              <StickyNote className="w-5 h-5 text-indigo-400" />
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white">{selectedStudentUser.name} - {activeNotesSubject} Notları</h3>
                <p className="text-[10px] text-slate-400">Öğrenci özel çalışma notları ve koçluk yönlendirmeleri</p>
              </div>
            </div>

            {/* Note Fields */}
            <div className="space-y-4">
              
              {/* STUDENT NOTE (Read-Only for Teacher) */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Öğrencininin Özel Notu (Salt Okunur)
                </label>
                <div className="bg-slate-950/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-300 italic min-h-[80px] whitespace-pre-wrap select-none">
                  {studentNoteDraft || 'Öğrenci henüz bu derse özel bir not eklememiş.'}
                </div>
                <p className="text-[10px] text-slate-500 italic">
                  Bu not sadece öğrenci tarafından düzenlenebilir.
                </p>
              </div>

              {/* TEACHER NOTE (Editable for Teacher) */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider block">
                  Koçluk & Öğretmen Notu (Düzenlenebilir)
                </label>
                <textarea
                  rows={4}
                  value={teacherNoteDraft}
                  onChange={(e) => setTeacherNoteDraft(e.target.value)}
                  placeholder="Öğrenciniz için bu derse özel koçluk tavsiyeleri ve yönlendirmeleri yazın..."
                  className="w-full bg-slate-950 border border-indigo-500/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500/50 transition-all font-sans resize-none"
                />
                <p className="text-[10px] text-indigo-400/80 italic font-medium">
                  Bu not öğrencinin paneline ders kutucuğunda anında yansıyacaktır.
                </p>
              </div>

            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setActiveNotesSubject(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
              >
                Kapat
              </button>
              {onUpdateStudentSubjectNotes && (
                <button
                  type="button"
                  onClick={handleSaveSubjectNotes}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-900 bg-indigo-400 hover:bg-indigo-300 transition-colors cursor-pointer"
                >
                  Kaydet
                </button>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
