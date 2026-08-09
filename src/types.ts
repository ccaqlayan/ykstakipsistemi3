export type FieldType = 'SAY' | 'EA' | 'SÖZ' | 'DİL';

export type UserRole = 'student' | 'class_teacher' | 'school_counselor' | 'teacher' | 'admin';

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  password: string; // Plain password for app demonstration
  role: UserRole;
  className?: string; // For student, e.g. '12-A SAY'
  assignedClassNames?: string[]; // For teacher, e.g. ['12-A SAY', '12-B EA']
  title?: string;
  avatarUrl?: string;
  status?: 'active' | 'pending' | 'rejected';
  isOnline?: boolean;
  lastActiveAt?: string;
  phone?: string;
  prepSchool?: string;
  schoolNumber?: string;
  soundEnabled?: boolean;
  dashboardWidgets?: any[];
}

export interface ClassDefinition {
  id: string;
  name: string; // e.g. '12-A SAY'
  description?: string;
  field?: FieldType;
  assignedTeacherIds: string[];
  classCoachAdvices?: ClassAICoachAdvice[];
}

export interface StudentProfile {
  name: string;
  highSchool: string;
  className?: string;
  targetField: FieldType;
  targetUniversity: string;
  targetDepartment: string;
  targetRank: number;
  targetTYTNet: number;
  targetAYTNet: number;
  coachName: string;
  coachNotes: string;
  avatarUrl?: string;
  highSchoolGpa?: number;
  phone?: string;
  prepSchool?: string;
  schoolNumber?: string;
}

export type DayOfWeek = 'Pazartesi' | 'Salı' | 'Çarşamba' | 'Perşembe' | 'Cuma' | 'Cumartesi' | 'Pazar';

export interface StudyPlanItem {
  id: string;
  day: DayOfWeek;
  subject: string;
  topic: string;
  taskType?: string;
  plannedMinutes: number;
  completedMinutes: number;
  status: 'pending' | 'in_progress' | 'completed';
  date?: string;
  notes?: string;
  reflection?: string;
  targetQuestionCount?: number;
  weekLabel?: string;
  archived?: boolean;
}

export interface StudyProgramTemplateItem {
  day: DayOfWeek;
  subject: string;
  topic: string;
  taskType?: string;
  plannedMinutes: number;
  notes?: string;
  targetQuestionCount?: number;
}

export interface StudyProgramTemplate {
  id: string;
  title: string;
  description?: string;
  targetField?: FieldType | 'TÜMÜ';
  createdByName?: string;
  createdAt: string;
  items: StudyProgramTemplateItem[];
}

export interface QuestionLog {
  id: string;
  date: string;
  subject: string;
  examType: 'TYT' | 'AYT';
  targetCount: number;
  solvedCount: number;
  correctCount: number;
  wrongCount: number;
  emptyCount: number;
  netScore: number;
  notes?: string;
  studyPlanId?: string;
}

export interface ResourceItem {
  id: string;
  subject: string;
  bookTitle: string;
  publisher: string;
  totalUnits: number; // Toplam Test veya Konu sayısı
  completedUnits: number; // Çözülen Test veya Konu sayısı
  status: 'not_started' | 'in_progress' | 'completed';
  examType: 'TYT' | 'AYT';
  completedTopics?: string[]; // Çözülen konuların listesi
  notes?: string;
}

export interface PastExamItem {
  id: string;
  year: number; // 2018 - 2025
  examType: 'TYT' | 'AYT';
  subject: string;
  solved: boolean;
  correctCount?: number;
  wrongCount?: number;
  netScore?: number;
  analyzed: boolean;
  notes?: string;
}

export type ErrorReason = 
  | 'bilgi_eksigi' 
  | 'dikkat_hatasi' 
  | 'zaman_yetmedi' 
  | 'iki_sik_arasinda' 
  | 'soru_kokunu_yanlis_okuma';

export interface TopicErrorItem {
  id: string;
  date: string;
  subject: string;
  examType: 'TYT' | 'AYT';
  topicName: string;
  publisher?: string;
  errorReason: ErrorReason;
  priority: 'high' | 'medium' | 'low' | string | number;
  revised: boolean;
  solutionNotes?: string;
  aiFeedback?: string;
  aiAnalysis?: string;
  aiSolution?: string;
  aiSolutionCorrectAnswer?: string;
  similarQuestionsList?: Array<{ question: string; solution: string; correctAnswer: string }>;
  imageUrl?: string;
  examId?: string;
  examTypeRef?: 'book' | 'branch' | 'general';
}

export interface BranchExam {
  id: string;
  date: string;
  subject: string;
  examType: 'TYT' | 'AYT';
  publisher: string;
  correct: number;
  wrong: number;
  empty: number;
  net: number;
  durationMinutes?: number;
  notes?: string;
  isAnalyzed?: boolean;
}

export interface SubSubjectScore {
  correct?: number;
  wrong?: number;
  empty?: number;
  net: number;
}

export interface TytDetails {
  turkce?: SubSubjectScore;
  tarih?: SubSubjectScore;
  cografya?: SubSubjectScore;
  felsefe?: SubSubjectScore;
  din?: SubSubjectScore;
  matematik?: SubSubjectScore;
  geometri?: SubSubjectScore;
  fizik?: SubSubjectScore;
  kimya?: SubSubjectScore;
  biyoloji?: SubSubjectScore;
}

export interface AytDetails {
  matematik?: SubSubjectScore;
  geometri?: SubSubjectScore;
  fizik?: SubSubjectScore;
  kimya?: SubSubjectScore;
  biyoloji?: SubSubjectScore;
  edebiyat?: SubSubjectScore;
  tarih1?: SubSubjectScore;
  cografya1?: SubSubjectScore;
  tarih2?: SubSubjectScore;
  cografya2?: SubSubjectScore;
  felsefe2?: SubSubjectScore;
  din2?: SubSubjectScore;
}

export interface GeneralMockExam {
  id: string;
  title: string;
  date: string;
  tyt: {
    turkce: number;
    sosyal: number;
    mat: number;
    fen: number;
    totalNet: number;
    details?: TytDetails;
  };
  ayt: {
    mat: number;
    fen: number;
    edebiyatSos1: number;
    sos2: number;
    totalNet: number;
    details?: AytDetails;
  };
  estimatedRank?: number;
  notes?: string;
  isAnalyzed?: boolean;
}

export interface InstitutionalTopicDetail {
  topicName: string;
  questionCount: number;
  correct: number;
  wrong: number;
  empty: number;
  successRate: number;
}

export interface InstitutionalSubjectDetail {
  subjectName: string;
  questionCount: number;
  correct: number;
  wrong: number;
  net: number;
  successRate: number;
  classAvgNet?: number;
  institutionAvgNet?: number;
  generalAvgNet?: number;
  topics: InstitutionalTopicDetail[];
}

export interface InstitutionalMockExam {
  id: string;
  examTitle: string; // e.g. "ÖZDEBİR YKS TYT-1 Denemesi"
  examDate: string; // YYYY-MM-DD
  examType?: 'TYT' | 'AYT' | 'Ara Sınıf' | string;
  createdByName?: string;
  createdById?: string;
  createdAt: string;
  studentId?: string;
  studentName: string;
  schoolNumber?: string;
  className?: string;
  scores: {
    sayScore?: number;
    eaScore?: number;
    sozScore?: number;
    sayClassRank?: number;
    sayClassTotal?: number;
    sayInstitutionRank?: number;
    sayInstitutionTotal?: number;
    sayGeneralRank?: number;
    sayGeneralTotal?: number;
    eaClassRank?: number;
    eaClassTotal?: number;
    eaInstitutionRank?: number;
    eaInstitutionTotal?: number;
    eaGeneralRank?: number;
    eaGeneralTotal?: number;
    sozClassRank?: number;
    sozClassTotal?: number;
    sozInstitutionRank?: number;
    sozInstitutionTotal?: number;
    sozGeneralRank?: number;
    sozGeneralTotal?: number;
    classParticipantCount?: number;
    institutionParticipantCount?: number;
    generalParticipantCount?: number;
  };
  subjects: InstitutionalSubjectDetail[];
}

export const formatRankWithTotal = (rank?: number, total?: number): string => {
  if (!rank || rank <= 0) return '-';
  if (total && total > 0) {
    return `${rank}/${total}`;
  }
  return `${rank}`;
};

export interface YouTubePlaylistVideo {
  id: string;
  title: string;
  durationMinutes: number;
  isWatched: boolean;
  videoUrl: string;
}

export interface YouTubeVideoItem {
  id: string;
  subject: string;
  channelName: string;
  topicName: string;
  playlistTitle?: string;
  videoUrl?: string;
  durationMinutes?: number;
  isWatched: boolean;
  notes?: string;
  isPlaylist?: boolean;
  playlistVideos?: YouTubePlaylistVideo[];
}

export interface AICoachAdvice {
  id?: string;
  timestamp: string;
  generalEvaluation: string;
  strengths: string[];
  weakAreas: string[];
  actionPlan: string[];
  motivationalQuote: string;
}

export interface ClassAICoachAdvice {
  id?: string;
  classId?: string;
  className: string;
  timestamp: string;
  createdByName?: string;
  createdByRole?: string;
  createdById?: string;
  generalEvaluation: string;
  strengths: string[];
  weakAreas: string[];
  actionPlan: string[];
  motivationalQuote: string;
}

export interface GoogleSheetsStatus {
  isConnected: boolean;
  userEmail?: string;
  sheetId?: string;
  sheetUrl?: string;
  lastSyncedAt?: string;
}

export interface RoutineHistoryEntry {
  weekLabel: string; // e.g., '20-26 Temmuz'
  completedDays: string[];
}

export interface QuickNote {
  id: string;
  text: string;
  createdAt: string;
  color?: 'amber' | 'emerald' | 'sky' | 'rose' | 'purple' | 'slate';
  isPinned?: boolean;
  order?: number;
}

export interface RoutineItem {
  id: string;
  title: string;
  target?: string;
  completedDays: string[]; // e.g., ['Pazartesi', 'Salı']
  history?: RoutineHistoryEntry[];
}

export interface YKSDataState {
  profile: StudentProfile;
  studyPlans: StudyPlanItem[];
  questionLogs: QuestionLog[];
  resources: ResourceItem[];
  pastExams: PastExamItem[];
  branchExams: BranchExam[];
  topicErrors: TopicErrorItem[];
  generalMocks: GeneralMockExam[];
  youtubeVideos: YouTubeVideoItem[];
  coachAdvices: AICoachAdvice[];
  sheetsStatus: GoogleSheetsStatus;
  completedPastTopics?: string[];
  favoriteBooks?: string[];
  topicStatuses?: Record<string, 'Çalışmadım' | 'Erteledim' | 'Zor Geldi' | 'Çalıştım' | 'Uzmanlaştım'>;
  manuallyChangedTopicStatuses?: string[];
  routines?: RoutineItem[];
  subjectNotes?: Record<string, { studentNote?: string; teacherNote?: string }>;
  topicTipsCache?: Record<string, { mistakes: Array<{ mistake: string; correction: string }>; tips: string[] }>;
  dashboardWidgets?: any[];
  quickNotes?: QuickNote[];
  taskTypes?: string[];
  institutionalMocks?: InstitutionalMockExam[];
}

export interface AuditLogItem {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  actorClassName?: string;
  targetUserId?: string;
  targetUserName?: string;
  actionType: string;
  actionDescription: string;
  category: 'study' | 'exam' | 'profile' | 'management' | 'template' | 'system' | 'social';
  deviceType?: 'Mobil' | 'Tablet' | 'Masaüstü' | string;
  ipAddress?: string;
  metadata?: Record<string, any>;
}

export interface RecommendedChannel {
  id?: string;
  subject: string;
  name: string;
  subscribersText: string;
  subscribersCount: number;
  url: string;
  isCustom?: boolean;
  isDeleted?: boolean;
}

export interface RecommendedBook {
  id?: string;
  subject: string;
  category: string;
  publisher: string;
  name: string;
  difficulty: string;
  difficultyValue: number;
  reason: string;
  isPopular: boolean;
  isCustom?: boolean;
  isDeleted?: boolean;
}

export interface DirectMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  senderAvatar?: string;
  receiverId: string;
  receiverName: string;
  receiverRole: UserRole;
  receiverAvatar?: string;
  content: string;
  timestamp: string;
  timestampMs?: number;
  isRead: boolean;
  readAt?: string;
  readBy?: { userId: string; readAt: string }[];
  isDelivered?: boolean;
  attachmentUrl?: string;
  replyTo?: {
    id: string;
    senderName: string;
    content: string;
    attachmentUrl?: string;
  };
  isDeleted?: boolean;
  deletedAt?: string;
  isEdited?: boolean;
  editedAt?: string;
}

export interface AppGlobalState {
  currentUser: UserAccount | null;
  users: UserAccount[];
  classes: ClassDefinition[];
  studentsData: Record<string, YKSDataState>; // Keyed by student user id
  programTemplates?: StudyProgramTemplate[];
  auditLogs?: AuditLogItem[];
  customRecommendations?: {
    channels: RecommendedChannel[];
    books: RecommendedBook[];
  };
  messages?: DirectMessage[];
  institutionalMockExams?: InstitutionalMockExam[];
}

