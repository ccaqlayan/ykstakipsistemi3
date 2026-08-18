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
  subject?: string; // For branch teacher (e.g., 'Matematik', 'Fizik')
  avatarUrl?: string;
  status?: 'active' | 'pending' | 'rejected';
  isOnline?: boolean;
  lastActiveAt?: string;
  phone?: string;
  prepSchool?: string;
  schoolNumber?: string;
  soundEnabled?: boolean;
  dashboardWidgets?: any[];
  failedLoginAttempts?: number;
  lockoutUntil?: string | null;
  isLocked?: boolean;
  mustChangePassword?: boolean;
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
  targetYDTNet?: number;
  targetLanguage?: string;
  coachName: string;
  coachNotes: string;
  avatarUrl?: string;
  highSchoolGpa?: number;
  phone?: string;
  prepSchool?: string;
  schoolNumber?: string;
}

export type DayOfWeek = 'Pazartesi' | 'Salı' | 'Çarşamba' | 'Perşembe' | 'Cuma' | 'Cumartesi' | 'Pazar';

export interface DailyStudyTimeLog {
  date: string; // ISO format: 'YYYY-MM-DD'
  day?: DayOfWeek;
  weekLabel?: string;
  minutes: number; // Toplam net çalışma süresi (dakika)
  notes?: string;
  updatedAt?: string;
}

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
  topic?: string;
  examType: 'TYT' | 'AYT' | 'YDT';
  targetCount: number;
  solvedCount: number;
  correctCount: number;
  wrongCount: number;
  emptyCount: number;
  blankCount?: number;
  netScore: number;
  durationMinutes?: number;
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
  examType: 'TYT' | 'AYT' | 'YDT';
  completedTopics?: string[]; // Çözülen konuların listesi
  notes?: string;
}

export interface PastExamItem {
  id: string;
  year: number; // 2018 - 2025
  examType: 'TYT' | 'AYT' | 'YDT';
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

export interface RepetitionLog {
  date: string; // ISO string veya YYYY-MM-DD
  selectedOption: 'A' | 'B' | 'C' | 'D' | 'E' | string;
  isCorrect: boolean;
  stage: number; // 1, 2, 3...
  notes?: string;
}

export interface TopicErrorItem {
  id: string;
  date: string;
  subject: string;
  examType: 'TYT' | 'AYT' | 'YDT';
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
  correctOption?: 'A' | 'B' | 'C' | 'D' | 'E' | string;
  similarQuestionsList?: Array<{ question: string; solution: string; correctAnswer: string }>;
  imageUrl?: string;
  examId?: string;
  examTypeRef?: 'book' | 'branch' | 'general';
  
  // 🔁 Aralıklı Tekrar (Spaced Repetition) Alanları
  repetitionStage?: number; // 0 = Henüz tekrarlanmadı, 1 = 1. Tekrar yapıldı, 2 = 2. Tekrar yapıldı, 3 = Tamamlandı (Pekiştirildi)
  nextReviewDate?: string; // YYYY-MM-DD
  lastReviewDate?: string; // YYYY-MM-DD
  lastReviewResult?: 'CORRECT' | 'WRONG';
  repetitionHistory?: RepetitionLog[];
  customIntervals?: number[];
}

export interface BranchExam {
  id: string;
  date: string;
  subject: string;
  examType: 'TYT' | 'AYT' | 'YDT';
  publisher: string;
  correct: number;
  wrong: number;
  empty: number;
  net: number;
  durationMinutes?: number;
  duration?: number;
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
  sosyal?: SubSubjectScore;
  mat?: SubSubjectScore;
  fen?: SubSubjectScore;
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
  mat?: SubSubjectScore;
  fen?: SubSubjectScore;
  edebiyatSos1?: SubSubjectScore;
  sos2?: SubSubjectScore;
}

export type MockExamType = 'TYT' | 'AYT' | 'DIL' | 'TYT_AYT' | 'TYT_DIL';

export interface GeneralMockExam {
  id: string;
  title: string;
  date: string;
  examType?: MockExamType;
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
  ydt?: {
    net: number;
    correct?: number;
    wrong?: number;
    empty?: number;
    language?: string;
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
  opticalAnswers?: string; // e.g. "ADCcdACEEd aaEAddBdBEaBcdeEBCdBCBDBDCCC"
  answerKey?: string; // e.g. "ADCAAACEECCCCCEAAEBCBECBDBCEBCEBCBDBDCCC"
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
  totalNet?: number;
  opticalAnswers?: Record<string, string>; // { "TYT Türkçe": "ADCcd...", "TYT Sosyal": "bC ba...", ... }
  answerKeys?: Record<string, string>; // { "TYT Türkçe": "ADCAA...", ... }
  scores: {
    tytScore?: number;
    tytGeneralAvg?: number;
    tytClassRank?: number;
    tytClassTotal?: number;
    tytInstitutionRank?: number;
    tytInstitutionTotal?: number;
    tytDistrictRank?: number;
    tytCityRank?: number;
    tytGeneralRank?: number;
    tytGeneralTotal?: number;
    sayScore?: number;
    sayGeneralAvg?: number;
    sayClassRank?: number;
    sayClassTotal?: number;
    sayInstitutionRank?: number;
    sayInstitutionTotal?: number;
    sayDistrictRank?: number;
    sayCityRank?: number;
    sayGeneralRank?: number;
    sayGeneralTotal?: number;
    eaScore?: number;
    eaGeneralAvg?: number;
    eaClassRank?: number;
    eaClassTotal?: number;
    eaInstitutionRank?: number;
    eaInstitutionTotal?: number;
    eaDistrictRank?: number;
    eaCityRank?: number;
    eaGeneralRank?: number;
    eaGeneralTotal?: number;
    sozScore?: number;
    sozGeneralAvg?: number;
    sozClassRank?: number;
    sozClassTotal?: number;
    sozInstitutionRank?: number;
    sozInstitutionTotal?: number;
    sozDistrictRank?: number;
    sozCityRank?: number;
    sozGeneralRank?: number;
    sozGeneralTotal?: number;
    classParticipantCount?: number;
    institutionParticipantCount?: number;
    districtParticipantCount?: number;
    cityParticipantCount?: number;
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
  createdAt?: string;
}

export interface AICoachPrescriptionItem {
  subject: string;
  targetQuestions: number;
  focusTopics: string[];
  actionType?: 'question_solving' | 'topic_review' | 'mock_exam' | 'routine';
  description: string;
  priority: 'high' | 'medium' | 'low';
}

export interface AICoachHighYieldTopic {
  subject: string;
  topic: string;
  estimatedNetGain: number;
  examQuestionCount?: number;
  reason: string;
}

export interface AICoachTargetGap {
  currentTytNet: number;
  targetTytNet: number;
  tytGap: number;
  currentAytNet: number;
  targetAytNet: number;
  aytGap: number;
  highYieldTopics: AICoachHighYieldTopic[];
}

export interface AICoachChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export interface AICoachAdvice {
  id?: string;
  timestamp: string;
  generalEvaluation: string;
  strengths: string[];
  weakAreas: string[];
  actionPlan: string[];
  motivationalQuote: string;
  weeklyPrescription?: AICoachPrescriptionItem[];
  targetGapAnalysis?: AICoachTargetGap;
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
  weeklyPrescription?: AICoachPrescriptionItem[];
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
  isDeleted?: boolean;
}

export interface YKSDataState {
  profile: StudentProfile;
  studyPlans: StudyPlanItem[];
  questionLogs: QuestionLog[];
  resources: ResourceItem[];
  resourceTrackers?: any[];
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
  dailyStudyLogs?: Record<string, DailyStudyTimeLog>;
  earnedBadges?: EarnedBadge[];
  motivationStats?: MotivationStats;
}

export type BadgeTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'legendary';
export type BadgeCategory = 'streak' | 'mock' | 'topic' | 'question' | 'resource' | 'routine';

export interface EarnedBadge {
  key: string;
  earnedAt: string;
  unlockedValue?: number;
  metadata?: Record<string, any>;
}

export interface MotivationStats {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string;
  totalStudyDays: number;
  lastStreakUpdate?: string;
}

export interface MotivationToastItem {
  id: string;
  type: 'streak' | 'mock' | 'topic' | 'plan' | 'question' | 'routine' | 'general';
  title: string;
  message: string;
  icon?: string;
  variant?: 'gold' | 'emerald' | 'cyan' | 'purple' | 'rose' | 'amber';
  timestamp?: number;
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
  avatarUrl?: string;
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
  originalContent?: string;
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
  customMotivationMessages?: Record<string, string>;
}

export interface ParsedStudentRow {
  fileStudentName: string;
  fileSchoolNumber: string;
  fileClassName: string;
  matchedStudentId: string | null;
  selectedClassForMatch?: string;
  matchScore: number;
  matchReason: string;
  isSelected: boolean;
  tytScore?: number;
  tytGeneralAvg?: number;
  tytClassRank?: number;
  tytClassTotal?: number;
  tytInstitutionRank?: number;
  tytInstitutionTotal?: number;
  tytDistrictRank?: number;
  tytCityRank?: number;
  tytGeneralRank?: number;
  tytGeneralTotal?: number;
  sayScore: number;
  sayGeneralAvg?: number;
  eaScore: number;
  eaGeneralAvg?: number;
  sozScore: number;
  sozGeneralAvg?: number;
  sayClassRank: number;
  sayClassTotal?: number;
  sayInstitutionRank: number;
  sayInstitutionTotal?: number;
  sayDistrictRank?: number;
  sayCityRank?: number;
  sayGeneralRank: number;
  sayGeneralTotal?: number;
  eaClassRank: number;
  eaClassTotal?: number;
  eaInstitutionRank: number;
  eaInstitutionTotal?: number;
  eaDistrictRank?: number;
  eaCityRank?: number;
  eaGeneralRank: number;
  eaGeneralTotal?: number;
  sozClassRank: number;
  sozClassTotal?: number;
  sozInstitutionRank: number;
  sozInstitutionTotal?: number;
  sozDistrictRank?: number;
  sozCityRank?: number;
  sozGeneralRank: number;
  sozGeneralTotal?: number;
  classParticipantCount?: number;
  institutionParticipantCount?: number;
  districtParticipantCount?: number;
  cityParticipantCount?: number;
  generalParticipantCount?: number;
  totalNet?: number;
  opticalAnswers?: Record<string, string>;
  answerKeys?: Record<string, string>;
  subjects: InstitutionalSubjectDetail[];
}


