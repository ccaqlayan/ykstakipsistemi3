import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft,
  TrendingUp, 
  Calendar, 
  CheckSquare, 
  BookOpenCheck, 
  BarChart3, 
  Youtube, 
  Footprints, 
  Plus, 
  Bookmark, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  BookOpen, 
  Check,
  Target,
  Flame,
  Award,
  ListChecks,
  Timer,
  Save,
  GraduationCap,
  Activity,
  FileSpreadsheet,
  Trophy,
  Zap,
  Lock,
  ExternalLink,
  Play,
  Search,
  Filter,
  Layers,
  ListVideo,
  Video,
  ChevronDown,
  ChevronUp,
  Folder,
  Sparkles,
  CheckCheck,
  LayoutGrid,
  Table,
  List,
  ChevronLeft,
  ChevronRight,
  Building2,
  School,
  FileText,
  Eye,
  ArrowRight
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  Cell, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid,
  AreaChart,
  Area
} from 'recharts';
import { 
  UserAccount, 
  YKSDataState, 
  AuditLogItem, 
  ClassDefinition, 
  DayOfWeek,
  InstitutionalMockExam
} from '../../types';
import { AuditLogsView } from '../AuditLogsView';
import { MockInstitutionalDetailView } from '../mocks/MockInstitutionalDetailView';
import { isUserOnline } from '../../utils/statusUtils';
import { UniversityLogo } from '../UniversityLogo';
import { BadgeShield } from '../badges/BadgeShield';
import { BADGE_DEFINITIONS, evaluateBadges } from '../../services/motivationEngine';
import { 
  YKS_CURRICULUM_TOPICS, 
  INITIAL_STATE, 
  INITIAL_STUDENT_2_STATE, 
  INITIAL_STUDENT_3_STATE, 
  INITIAL_STUDENT_4_STATE, 
  DEFAULT_AVATAR 
} from '../../data/initialData';
import { INITIAL_GLOBAL_STATE } from '../../services/storage';
import { resolveStudentData } from '../../utils/studentDataUtils';

const DAYS: DayOfWeek[] = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];

const TURKISH_MONTHS_LOCAL = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
];

const parseAnyDateToTime = (dateStr?: string | number): number => {
  if (!dateStr) return 0;
  if (typeof dateStr === 'number') return dateStr;
  
  const str = String(dateStr).trim();
  const time = Date.parse(str);
  if (!isNaN(time) && time > 0) return time;

  const dotParts = str.split(/[./-]/);
  if (dotParts.length === 3) {
    if (dotParts[0].length === 2 && dotParts[2].length === 4) {
      const day = parseInt(dotParts[0], 10);
      const month = parseInt(dotParts[1], 10) - 1;
      const year = parseInt(dotParts[2], 10);
      return new Date(year, month, day).getTime();
    } else if (dotParts[0].length === 4 && dotParts[2].length <= 2) {
      const year = parseInt(dotParts[0], 10);
      const month = parseInt(dotParts[1], 10) - 1;
      const day = parseInt(dotParts[2], 10);
      return new Date(year, month, day).getTime();
    }
  }
  return 0;
};

const formatEntryDateStr = (ts: number, fallbackStr?: string): string => {
  if (ts > 0) {
    const d = new Date(ts);
    const day = d.getDate();
    const month = TURKISH_MONTHS_LOCAL[d.getMonth()] || '';
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    if (d.getHours() !== 0 || d.getMinutes() !== 0) {
      return `${day} ${month} ${year}, ${hours}:${mins}`;
    }
    return `${day} ${month} ${year}`;
  }
  return fallbackStr || 'Tarihsiz';
};

const getRelativeTimeStr = (ts: number): string => {
  if (!ts) return '';
  const now = Date.now();
  const diffMs = now - ts;
  if (diffMs < 0) return 'Tarih belirtildi';
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 2) return 'Az önce';
  if (diffMins < 60) return `${diffMins} dk önce`;
  if (diffHours < 24) return `${diffHours} saat önce`;
  if (diffDays === 1) return 'Dün';
  if (diffDays < 30) return `${diffDays} gün önce`;
  return '';
};

export type InspectTabType = 
  | 'performance' 
  | 'badges'
  | 'planner' 
  | 'questions' 
  | 'topics' 
  | 'mocks' 
  | 'resources' 
  | 'routines' 
  | 'youtube' 
  | 'audit_logs';

interface TeacherStudentInspectViewProps {
  selectedStudentUser: UserAccount;
  initialTab?: InspectTabType;
  onBack: () => void;
  studentsData: Record<string, YKSDataState>;
  teacher: UserAccount;
  editingCoachNotes: string;
  setEditingCoachNotes: (notes: string) => void;
  handleSaveCoachNotes: () => void;
  setShowSaveTemplateModal: (show: boolean) => void;
  setShowAddTaskToStudentModal: (show: boolean) => void;
  isBranchTeacher: boolean;
  handleDeleteTaskFromStudent: (studentId: string, taskId: string) => void;
  handleToggleTaskStatusFromTeacher: (studentId: string, taskId: string, currentStatus: any) => void;
  classes: ClassDefinition[];
  allUsers: UserAccount[];
  auditLogs?: AuditLogItem[];
  OfflineStatusDisplay: React.FC<{ user: UserAccount; className?: string }>;
}

export const TeacherStudentInspectView: React.FC<TeacherStudentInspectViewProps> = ({
  selectedStudentUser,
  initialTab = 'performance',
  onBack,
  studentsData,
  teacher,
  editingCoachNotes,
  setEditingCoachNotes,
  handleSaveCoachNotes,
  setShowSaveTemplateModal,
  setShowAddTaskToStudentModal,
  isBranchTeacher,
  handleDeleteTaskFromStudent,
  handleToggleTaskStatusFromTeacher,
  classes,
  allUsers,
  auditLogs = [],
  OfflineStatusDisplay
}) => {
  const [activeTab, setActiveTab] = useState<InspectTabType>(initialTab || 'performance');

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  const [isNotesSavedToast, setIsNotesSavedToast] = useState(false);
  const [showAllTopics, setShowAllTopics] = useState(false);
  const [resourceSubjectFilter, setResourceSubjectFilter] = useState<string>('all');
  const [expandedPlaylistId, setExpandedPlaylistId] = useState<string | null>(null);
  const [youtubeSubjectFilter, setYoutubeSubjectFilter] = useState<string>('all');
  const [youtubeStatusFilter, setYoutubeStatusFilter] = useState<'all' | 'playlist' | 'single' | 'completed' | 'in_progress'>('all');
  const [youtubeSearchQuery, setYoutubeSearchQuery] = useState<string>('');
  const [plannerDayFilter, setPlannerDayFilter] = useState<string>('all');
  const [plannerStatusFilter, setPlannerStatusFilter] = useState<'all' | 'completed' | 'pending'>('all');
  const [plannerSubjectFilter, setPlannerSubjectFilter] = useState<string>('all');
  const [plannerSearchQuery, setPlannerSearchQuery] = useState<string>('');
  const [questionSubjectFilter, setQuestionSubjectFilter] = useState<string>('all');
  const [questionExamTypeFilter, setQuestionExamTypeFilter] = useState<'all' | 'TYT' | 'AYT'>('all');
  const [questionDateFilter, setQuestionDateFilter] = useState<'all' | '7days' | '30days'>('all');
  const [questionSearchQuery, setQuestionSearchQuery] = useState<string>('');
  const [questionViewMode, setQuestionViewMode] = useState<'cards' | 'table'>('cards');
  const [mockSubTab, setMockSubTab] = useState<'general' | 'branch' | 'institutional'>('general');
  const [selectedInstitutionalExam, setSelectedInstitutionalExam] = useState<InstitutionalMockExam | null>(null);
  const [generalMockSearch, setGeneralMockSearch] = useState<string>('');
  const [generalMockTypeFilter, setGeneralMockTypeFilter] = useState<'all' | 'TYT' | 'AYT'>('all');
  const [generalMockViewMode, setGeneralMockViewMode] = useState<'cards' | 'table'>('cards');
  const [generalMockPage, setGeneralMockPage] = useState<number>(1);

  const [branchMockSubjectFilter, setBranchMockSubjectFilter] = useState<string>('all');
  const [branchMockSearch, setBranchMockSearch] = useState<string>('');
  const [branchExamViewMode, setBranchExamViewMode] = useState<'cards' | 'table'>('cards');
  const [branchExamPage, setBranchExamPage] = useState<number>(1);

  const [institutionalMockSearch, setInstitutionalMockSearch] = useState<string>('');
  const [institutionalMockTypeFilter, setInstitutionalMockTypeFilter] = useState<'all' | 'TYT' | 'AYT'>('all');
  const [institutionalMockViewMode, setInstitutionalMockViewMode] = useState<'cards' | 'table'>('cards');
  const [institutionalMockPage, setInstitutionalMockPage] = useState<number>(1);

  const stData = resolveStudentData(selectedStudentUser, studentsData);
  const profile = stData.profile;
  const mocks = stData.generalMocks || [];
  const branchExams = stData.branchExams || [];
  const institutionalMocks: InstitutionalMockExam[] = (stData.institutionalMocks as InstitutionalMockExam[]) || [];
  const questionLogs = stData.questionLogs || [];
  const plans = stData.studyPlans || [];
  const topicErrors = stData.topicErrors || [];
  const resources = stData.resourceTrackers || stData.resources || [];
  const routinesList = stData.routines || [];
  const pomodoros = stData.pomodoroHistory || [];
  const youtubeList = stData.youtubeVideos || (stData as any).youtubePlaylists || [];
  const topicsState = stData.topics || {};

  // Badges & Motivation engine calculation
  const { allEarnedBadges, stats: motivationStats, totalXp } = evaluateBadges(stData as any);
  const earnedKeysSet = new Set(allEarnedBadges.map(b => b.key));
  const earnedCount = allEarnedBadges.length;
  const totalBadgesCount = BADGE_DEFINITIONS.length;

  // YouTube Summary Metrics Calculation
  let totalYoutubeVideosOverall = 0;
  let totalYoutubeWatchedOverall = 0;
  let totalYoutubeDurationMinutes = 0;
  let totalPlaylistCount = 0;
  let totalSingleCount = 0;

  youtubeList.forEach(item => {
    const isPl = item.isPlaylist && item.playlistVideos && item.playlistVideos.length > 0;
    if (isPl) {
      totalPlaylistCount += 1;
      totalYoutubeVideosOverall += item.playlistVideos.length;
      totalYoutubeWatchedOverall += item.playlistVideos.filter((v: any) => v.isWatched || v.watched).length;
      const plDur = item.playlistVideos.reduce((sum: number, v: any) => sum + (v.durationMinutes || 45), 0);
      totalYoutubeDurationMinutes += (item.durationMinutes || plDur);
    } else {
      totalSingleCount += 1;
      totalYoutubeVideosOverall += 1;
      if (item.isWatched) totalYoutubeWatchedOverall += 1;
      totalYoutubeDurationMinutes += (item.durationMinutes || 45);
    }
  });

  const overallYoutubePct = totalYoutubeVideosOverall > 0 
    ? Math.round((totalYoutubeWatchedOverall / totalYoutubeVideosOverall) * 100) 
    : 0;

  const teacherSubj = (teacher.role === 'teacher' && teacher.subject) ? teacher.subject.toLowerCase() : '';

  // Comprehensive Summary Metrics
  const totalSolved = questionLogs.reduce((sum, q) => sum + (q.solvedCount || 0), 0);
  const totalCorrect = questionLogs.reduce((sum, q) => sum + (q.correctCount || 0), 0);
  const totalWrong = questionLogs.reduce((sum, q) => sum + (q.wrongCount || 0), 0);
  const accuracyPct = totalSolved > 0 ? Math.round((totalCorrect / totalSolved) * 100) : 0;

  const totalPlannedMins = plans.reduce((acc, p) => acc + (p.plannedMinutes || 0), 0);
  const totalCompletedMins = plans.reduce((acc, p) => acc + (p.completedMinutes || 0), 0);
  const weeklyStudyHours = Math.round(totalCompletedMins / 60);

  const completedPlansCount = plans.filter(p => p.status === 'completed').length;
  const totalPlansCount = plans.length;
  const planCompletionPct = totalPlansCount > 0 ? Math.round((completedPlansCount / totalPlansCount) * 100) : 0;

  // Last 3 Mocks Averages
  const latestMocks = [...mocks].slice(-3);
  const avgTYTNet = latestMocks.length > 0 
    ? Number((latestMocks.reduce((sum, m) => sum + (m.tyt?.totalNet || 0), 0) / latestMocks.length).toFixed(1))
    : 0;
  const avgAYTNet = latestMocks.length > 0
    ? Number((latestMocks.reduce((sum, m) => sum + (m.ayt?.totalNet || 0), 0) / latestMocks.length).toFixed(1))
    : 0;

  // Unresolved Errors
  const unresolvedErrs = topicErrors.filter(e => !e.revised);

  // UNIFIED TOPIC PROGRESS CALCULATION
  const topicStatuses = stData.topicStatuses || {};
  const completedPastTopics = stData.completedPastTopics || [];

  const allSubjectKeys = Array.from(new Set([
    ...Object.keys(YKS_CURRICULUM_TOPICS),
    ...Object.keys(topicsState)
  ]));

  let totalTopicsCount = 0;
  let completedTopicsCount = 0;

  const subjectProgressList = allSubjectKeys.map(subjectName => {
    const standardTopics = YKS_CURRICULUM_TOPICS[subjectName] || [];
    const customTopics = topicsState[subjectName] ? Object.keys(topicsState[subjectName]) : [];
    const allTopicsForSubj = Array.from(new Set([...standardTopics, ...customTopics]));

    const topicsDetail = allTopicsForSubj.map(tName => {
      const isDoneInState = topicsState[subjectName]?.[tName] === true;
      const isDoneInStatus = topicStatuses[tName] === 'Çalıştım' || topicStatuses[tName] === 'Uzmanlaştım';
      const isDoneInPast = completedPastTopics.includes(tName);
      const isDoneInPlans = plans.some(p => (p.subject === subjectName || p.subject?.includes(subjectName.replace('TYT ', '').replace('AYT ', ''))) && p.topic?.toLowerCase() === tName.toLowerCase() && p.status === 'completed');
      const isDoneInQuestions = questionLogs.some(q => q.topic?.toLowerCase() === tName.toLowerCase() && ((q.solvedCount || 0) > 0 || (q.correctCount || 0) > 0));

      const isDone = isDoneInState || isDoneInStatus || isDoneInPast || isDoneInPlans || isDoneInQuestions;
      const isInProgress = !isDone && (
        topicStatuses[tName] === 'Zor Geldi' || 
        topicStatuses[tName] === 'Erteledim' ||
        plans.some(p => p.topic?.toLowerCase() === tName.toLowerCase()) ||
        questionLogs.some(q => q.topic?.toLowerCase() === tName.toLowerCase())
      );

      return {
        name: tName,
        isDone,
        isInProgress
      };
    });

    const doneCount = topicsDetail.filter(t => t.isDone).length;
    const inProgressCount = topicsDetail.filter(t => t.isInProgress).length;
    const totalCount = topicsDetail.length;
    const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

    totalTopicsCount += totalCount;
    completedTopicsCount += doneCount;

    return {
      subjectName,
      totalCount,
      doneCount,
      inProgressCount,
      pct,
      topics: topicsDetail
    };
  }).sort((a, b) => {
    if (teacherSubj) {
      const aMatch = a.subjectName.toLowerCase().includes(teacherSubj) || teacherSubj.includes(a.subjectName.toLowerCase());
      const bMatch = b.subjectName.toLowerCase().includes(teacherSubj) || teacherSubj.includes(b.subjectName.toLowerCase());
      if (aMatch && !bMatch) return -1;
      if (!aMatch && bMatch) return 1;
    }
    return b.pct - a.pct;
  });

  const topicCompletionPct = totalTopicsCount > 0 ? Math.round((completedTopicsCount / totalTopicsCount) * 100) : 0;

  // LATEST DATA ENTRY CALCULATION
  const entryCandidates: Array<{
    timestamp: number;
    formattedDate: string;
    relativeTime: string;
    categoryLabel: string;
    badgeClass: string;
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
    stats?: Array<{ label: string; value: string; colorClass: string }>;
  }> = [];

  questionLogs.forEach(q => {
    const ts = parseAnyDateToTime(q.date);
    entryCandidates.push({
      timestamp: ts,
      formattedDate: formatEntryDateStr(ts, q.date),
      relativeTime: getRelativeTimeStr(ts),
      categoryLabel: 'Soru Çözümü',
      badgeClass: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
      icon: <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />,
      title: `${q.subject}${q.topic ? ' • ' + q.topic : ''} (${q.examType || 'Soru'})`,
      subtitle: q.notes ? `Not: ${q.notes}` : undefined,
      stats: [
        { label: 'Çözülen', value: `${q.solvedCount || 0} Soru`, colorClass: 'text-indigo-300 font-bold' },
        { label: 'Doğru/Yanlış', value: `${q.correctCount || 0} D / ${q.wrongCount || 0} Y`, colorClass: 'text-emerald-400 font-bold' },
        { label: 'Net', value: `${q.netScore || 0}`, colorClass: 'text-amber-300 font-bold' }
      ]
    });
  });

  mocks.forEach(m => {
    const ts = parseAnyDateToTime(m.date);
    entryCandidates.push({
      timestamp: ts,
      formattedDate: formatEntryDateStr(ts, m.date),
      relativeTime: getRelativeTimeStr(ts),
      categoryLabel: 'Genel Deneme',
      badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
      icon: <BarChart3 className="w-3.5 h-3.5 text-purple-400" />,
      title: m.title || 'Genel Deneme Sınavı',
      subtitle: m.notes ? `Not: ${m.notes}` : undefined,
      stats: [
        { label: 'TYT Net', value: `${m.tyt?.totalNet || 0}`, colorClass: 'text-sky-300 font-bold' },
        { label: 'AYT Net', value: `${m.ayt?.totalNet || 0}`, colorClass: 'text-emerald-400 font-bold' }
      ]
    });
  });

  branchExams.forEach(b => {
    const ts = parseAnyDateToTime(b.date);
    entryCandidates.push({
      timestamp: ts,
      formattedDate: formatEntryDateStr(ts, b.date),
      relativeTime: getRelativeTimeStr(ts),
      categoryLabel: 'Branş Denemesi',
      badgeClass: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
      icon: <FileSpreadsheet className="w-3.5 h-3.5 text-sky-400" />,
      title: `${b.subject} Branş Denemesi (${b.publisher || 'Genel Yayın'})`,
      subtitle: b.notes ? `Not: ${b.notes}` : undefined,
      stats: [
        { label: 'Net', value: `${b.net || 0}`, colorClass: 'text-amber-300 font-bold' },
        { label: 'D/Y/B', value: `${b.correct || 0} D / ${b.wrong || 0} Y / ${b.empty || 0} B`, colorClass: 'text-slate-300' }
      ]
    });
  });

  plans.filter(p => p.status === 'completed' || (p.completedMinutes && p.completedMinutes > 0)).forEach(p => {
    const ts = parseAnyDateToTime(p.date);
    entryCandidates.push({
      timestamp: ts,
      formattedDate: formatEntryDateStr(ts, p.date),
      relativeTime: getRelativeTimeStr(ts),
      categoryLabel: 'Ders Çalışması',
      badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      icon: <BookOpen className="w-3.5 h-3.5 text-emerald-400" />,
      title: `${p.subject}${p.topic ? ' • ' + p.topic : ''}`,
      subtitle: p.reflection || p.notes ? `Yorum: ${p.reflection || p.notes}` : undefined,
      stats: [
        { label: 'Çalışılan Süre', value: `${p.completedMinutes || 0} dk`, colorClass: 'text-emerald-300 font-bold' },
        { label: 'Hedef Süre', value: `${p.plannedMinutes || 0} dk`, colorClass: 'text-slate-300' }
      ]
    });
  });

  // NOTE: auditLogs (system events like logout) are intentionally excluded – only lesson-related entries shown.

  entryCandidates.sort((a, b) => b.timestamp - a.timestamp);
  const latestEntries = entryCandidates.slice(0, 3);

  const onNotesSave = () => {
    handleSaveCoachNotes();
    setIsNotesSavedToast(true);
    setTimeout(() => setIsNotesSavedToast(false), 3000);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* TOP WORKSPACE NAVIGATION & PROFILE HEADER */}
      <div className="bg-slate-900/90 border border-white/15 rounded-3xl p-6 shadow-2xl backdrop-blur-2xl space-y-6">
        
        {/* Navigation Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <button
            onClick={onBack}
            className="self-start bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-4 py-2.5 rounded-2xl transition-all border border-white/15 flex items-center space-x-2 shadow-md group cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform text-indigo-400" />
            <span>← Sınıf Öğrenci Listesine Dön</span>
          </button>

          <div className="flex items-center space-x-3 flex-wrap">
            {teacher.role === 'teacher' && teacher.subject && (
              <span className="bg-gradient-to-r from-amber-500/20 to-purple-500/20 border border-amber-500/40 text-amber-300 font-bold text-xs px-3 py-1.5 rounded-xl shadow-sm flex items-center space-x-1.5">
                <span>⭐ Branşınız ({teacher.subject}) Verileri Önceliklidir</span>
              </span>
            )}
            <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold px-3 py-1.5 rounded-xl">
              Öğrenci Yönetim Paneli
            </span>
          </div>
        </div>

        {/* Profile Card & Target Info */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start space-x-4">
            <div className="relative shrink-0">
              <img 
                src={selectedStudentUser.avatarUrl || DEFAULT_AVATAR} 
                alt={selectedStudentUser.name}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-400/60 shadow-xl"
              />
              <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-900 ${
                isUserOnline(selectedStudentUser) ? 'bg-emerald-500' : 'bg-slate-500'
              }`} />
            </div>

            <div className="space-y-1">
              <div className="flex items-center space-x-2 flex-wrap">
                <h1 className="text-2xl font-black text-white">{selectedStudentUser.name}</h1>
                <span className="text-xs font-bold bg-indigo-500/20 text-indigo-300 px-2.5 py-0.5 rounded-lg border border-indigo-500/30 font-mono">
                  {selectedStudentUser.className || 'Sınıfsız'}
                </span>
                <OfflineStatusDisplay user={selectedStudentUser} />
              </div>
              <p className="text-xs text-slate-400 font-mono">{selectedStudentUser.email}</p>
              
              {profile && (
                <div className="flex items-center space-x-3 text-xs pt-1 flex-wrap gap-y-1">
                  <span className="text-slate-300 flex items-center space-x-1">
                    <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
                    <strong>Alan:</strong> {profile.targetField || 'SAY'}
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-300">
                    <strong>Hedef Sıralama:</strong> #{profile.targetRank ? profile.targetRank.toLocaleString() : '10,000'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Target University Banner */}
          {profile && profile.targetUniversity && (
            <div className="bg-slate-950/80 border border-white/10 rounded-2xl p-4 flex items-center space-x-4 min-w-[280px]">
              <UniversityLogo 
                universityName={profile.targetUniversity} 
                className="w-12 h-12 rounded-xl object-contain bg-white/5 p-1 border border-white/10 shrink-0" 
              />
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 block">Hedef Üniversite & Bölüm</span>
                <h4 className="text-sm font-bold text-white truncate">{profile.targetUniversity}</h4>
                <p className="text-xs text-indigo-300 font-medium truncate">{profile.targetDepartment || 'Bilgisayar Mühendisliği'}</p>
              </div>
            </div>
          )}
        </div>

        {/* EXECUTIVE KPI SUMMARY CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 pt-2">
          
          <div className="bg-slate-950/60 border border-indigo-500/30 rounded-2xl p-3.5 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Toplam Çözülen Soru</span>
            <div className="text-lg font-black text-indigo-300 font-mono">{totalSolved.toLocaleString()}</div>
            <span className="text-[10px] text-emerald-400 font-semibold block">Doğruluk: %{accuracyPct}</span>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab('badges')}
            className="bg-slate-950/60 hover:bg-amber-950/40 border border-amber-500/30 hover:border-amber-400/60 rounded-2xl p-3.5 space-y-1 text-left transition-all group cursor-pointer shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">Başarılar & Rozet</span>
              <Trophy className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-lg font-black text-amber-300 font-mono">{earnedCount} <span className="text-xs font-normal text-slate-400">/ {totalBadgesCount}</span></div>
            <span className="text-[10px] text-amber-400/90 font-semibold block">{motivationStats.currentStreak} Gün Seri • {totalXp.toLocaleString('tr-TR')} XP</span>
          </button>

          <div className="bg-slate-950/60 border border-purple-500/30 rounded-2xl p-3.5 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Haftalık Çalışma</span>
            <div className="text-lg font-black text-purple-300 font-mono">{weeklyStudyHours} <span className="text-xs font-normal text-slate-400">Saat</span></div>
            <span className="text-[10px] text-purple-400 font-semibold block">Uyum: %{planCompletionPct}</span>
          </div>

          <div className="bg-slate-950/60 border border-sky-500/30 rounded-2xl p-3.5 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Son Deneme Ort.</span>
            <div className="text-lg font-black text-sky-300 font-mono">TYT {avgTYTNet} / AYT {avgAYTNet}</div>
            <span className="text-[10px] text-sky-400 font-semibold block">{latestMocks.length} Deneme Ort.</span>
          </div>

          <div className="bg-slate-950/60 border border-emerald-500/30 rounded-2xl p-3.5 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Konu Bitiş Oranı</span>
            <div className="text-lg font-black text-emerald-300 font-mono">%{topicCompletionPct}</div>
            <span className="text-[10px] text-emerald-400 font-semibold block">{completedTopicsCount} / {totalTopicsCount} Konu</span>
          </div>

          <div className="bg-slate-950/60 border border-rose-500/30 rounded-2xl p-3.5 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Açık Hatalı Konular</span>
            <div className="text-lg font-black text-rose-300 font-mono">{unresolvedErrs.length} <span className="text-xs font-normal text-slate-400">Hata</span></div>
            <span className="text-[10px] text-rose-400 font-semibold block">Acil İnceleme</span>
          </div>

          <div className="bg-slate-950/60 border border-amber-500/30 rounded-2xl p-3.5 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Aktif Kaynaklar</span>
            <div className="text-lg font-black text-amber-300 font-mono">{resources.length} <span className="text-xs font-normal text-slate-400">Kitap</span></div>
            <span className="text-[10px] text-amber-400 font-semibold block">Takip Ediliyor</span>
          </div>

        </div>

        {/* WORKSPACE MAIN NAVIGATION TABS - 2 CLEAN SPACIOUS ROWS */}
        <div className="space-y-2 pt-3 border-t border-white/10">
          
          {/* ROW 1: CORE PERFORMANCE, BADGES & PLANNING (6 TABS) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            <button
              onClick={() => setActiveTab('performance')}
              className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer text-center w-full shadow-sm ${
                activeTab === 'performance'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 border border-indigo-400/40'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border border-white/10'
              }`}
            >
              <TrendingUp className="w-4 h-4 text-indigo-300 shrink-0" />
              <span>Performans & Özet</span>
            </button>

            <button
              onClick={() => setActiveTab('badges')}
              className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer text-center w-full shadow-sm ${
                activeTab === 'badges'
                  ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30 border border-amber-400/40'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border border-white/10'
              }`}
            >
              <Trophy className="w-4 h-4 text-amber-300 shrink-0" />
              <span>Başarılar & Rozetler</span>
            </button>

            <button
              onClick={() => setActiveTab('planner')}
              className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer text-center w-full shadow-sm ${
                activeTab === 'planner'
                  ? 'bg-fuchsia-600 text-white shadow-lg shadow-fuchsia-600/30 border border-fuchsia-400/40'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border border-white/10'
              }`}
            >
              <Calendar className="w-4 h-4 text-fuchsia-300 shrink-0" />
              <span>Çalışma Programı</span>
            </button>

            <button
              onClick={() => setActiveTab('questions')}
              className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer text-center w-full shadow-sm ${
                activeTab === 'questions'
                  ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30 border border-amber-400/40'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border border-white/10'
              }`}
            >
              <CheckSquare className="w-4 h-4 text-amber-300 shrink-0" />
              <span>Soru Takibi</span>
            </button>

            <button
              onClick={() => setActiveTab('topics')}
              className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer text-center w-full shadow-sm ${
                activeTab === 'topics'
                  ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/30 border border-teal-400/40'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border border-white/10'
              }`}
            >
              <ListChecks className="w-4 h-4 text-teal-300 shrink-0" />
              <span>Konu İlerlemesi</span>
            </button>

            <button
              onClick={() => setActiveTab('mocks')}
              className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer text-center w-full shadow-sm ${
                activeTab === 'mocks'
                  ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/30 border border-sky-400/40'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border border-white/10'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-sky-300 shrink-0" />
              <span>Deneme Analizi</span>
            </button>
          </div>

          {/* ROW 2: RESOURCES, ROUTINES, YOUTUBE & LOGS (4 TABS) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              onClick={() => setActiveTab('resources')}
              className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer text-center w-full shadow-sm ${
                activeTab === 'resources'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 border border-emerald-400/40'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border border-white/10'
              }`}
            >
              <BookOpenCheck className="w-4 h-4 text-emerald-300 shrink-0" />
              <span>Kaynak Kitaplar</span>
            </button>

            <button
              onClick={() => setActiveTab('routines')}
              className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer text-center w-full shadow-sm ${
                activeTab === 'routines'
                  ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/30 border border-orange-400/40'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border border-white/10'
              }`}
            >
              <Timer className="w-4 h-4 text-orange-300 shrink-0" />
              <span>Rutinler & Odaklanma</span>
            </button>

            <button
              onClick={() => setActiveTab('youtube')}
              className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer text-center w-full shadow-sm ${
                activeTab === 'youtube'
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30 border border-rose-400/40'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border border-white/10'
              }`}
            >
              <Youtube className="w-4 h-4 text-rose-300 shrink-0" />
              <span>YouTube Takibi</span>
            </button>

            <button
              onClick={() => setActiveTab('audit_logs')}
              className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer text-center w-full shadow-sm ${
                activeTab === 'audit_logs'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30 border border-purple-400/40'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border border-white/10'
              }`}
            >
              <Footprints className="w-4 h-4 text-purple-300 shrink-0" />
              <span>Öğrenci Ayak İzi</span>
            </button>
          </div>

        </div>

      </div>

      {/* TAB 1: COACHING & EXECUTIVE PERFORMANCE */}
      {activeTab === 'performance' && (
        <div className="space-y-6">
          
          {/* 📌 Son 3 Veri Girişi – Compact List */}
          <div className="bg-slate-900/90 border border-indigo-500/30 rounded-2xl px-5 py-4 shadow-xl backdrop-blur-2xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-indigo-400 shrink-0" />
                <span className="text-sm font-bold text-white">Son Ders Aktiviteleri</span>
              </div>
              {latestEntries.length > 0 && (
                <span className="text-[10px] font-bold text-indigo-300 bg-indigo-500/15 border border-indigo-500/30 px-2 py-0.5 rounded-lg font-mono">
                  {latestEntries.length} kayıt
                </span>
              )}
            </div>

            {latestEntries.length > 0 ? (
              <div className="divide-y divide-white/5">
                {latestEntries.map((entry, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-3 py-2.5 group"
                  >
                    {/* Left: icon + title + category badge + stats inline */}
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`p-1.5 rounded-lg border shrink-0 ${entry.badgeClass}`}>
                        {entry.icon}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors truncate">
                            {entry.title}
                          </span>
                          <span className={`px-1.5 py-px rounded text-[9px] font-bold border shrink-0 ${entry.badgeClass}`}>
                            {entry.categoryLabel}
                          </span>
                        </div>
                        {/* Stats on second line */}
                        {entry.stats && entry.stats.length > 0 && (
                          <div className="flex items-center gap-2 mt-0.5">
                            {entry.stats.map((stat, i) => (
                              <span key={i} className="text-[10px] font-mono text-slate-400">
                                <span className="text-slate-500">{stat.label}: </span>
                                <span className={stat.colorClass}>{stat.value}</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: relative time with full date as native tooltip */}
                    <div className="shrink-0 text-right">
                      {entry.relativeTime ? (
                        <span
                          title={entry.formattedDate}
                          className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md cursor-default hover:bg-emerald-500/20 hover:text-emerald-300 transition-colors"
                        >
                          {entry.relativeTime}
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-slate-500">{entry.formattedDate}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic py-1">Henüz ders aktivitesi kaydı bulunmuyor.</p>
            )}
          </div>
          
          {/* Coach Notes Editor & Immediate Action Alerts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Coach Notes Box */}
            <div className="lg:col-span-2 bg-slate-900/90 border border-indigo-500/30 rounded-3xl p-6 shadow-2xl backdrop-blur-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center space-x-2">
                  <BookOpen className="w-5 h-5 text-indigo-400" />
                  <h3 className="font-bold text-white text-base">Öğrenciye Özel Rehberlik ve Koç Değerlendirme Notu</h3>
                </div>
                
                {isNotesSavedToast && (
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-500/30 animate-pulse">
                    ✓ Not Kaydedildi!
                  </span>
                )}
              </div>

              <textarea
                value={editingCoachNotes}
                onChange={(e) => setEditingCoachNotes(e.target.value)}
                placeholder="Öğrenci hakkında rehberlik gözlemleriniz, hedef stratejisi, haftalık ödev takibi ve önerilerinizi buraya yazabilirsiniz..."
                className="w-full h-36 bg-slate-950/80 border border-white/10 rounded-2xl p-4 text-sm text-white focus:outline-none focus:border-indigo-400 resize-none font-sans"
              />

              <div className="flex justify-end">
                <button
                  onClick={onNotesSave}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-600/30 border border-indigo-400/40 flex items-center space-x-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Koç Notunu Kaydet</span>
                </button>
              </div>
            </div>

            {/* Topic Errors & Critical Alerts */}
            <div className="bg-slate-900/90 border border-rose-500/30 rounded-3xl p-6 shadow-2xl backdrop-blur-2xl space-y-4 flex flex-col justify-between">
              <div className="flex flex-col min-h-0">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-5 h-5 text-rose-400" />
                    <h3 className="font-bold text-white text-base">Acil Müdahale Konuları</h3>
                  </div>
                  <span className="text-xs font-bold text-rose-300 bg-rose-500/20 px-2.5 py-0.5 rounded-lg border border-rose-500/30">
                    {unresolvedErrs.length} Konu Hatalı
                  </span>
                </div>

                <div className="space-y-2 mt-3 overflow-y-auto max-h-[220px] pr-1">
                  {unresolvedErrs.length === 0 ? (
                    <div className="text-center py-6 text-slate-400 text-xs italic">
                      Çözülmemiş acil konu hatası bulunmuyor. 🎉
                    </div>
                  ) : (
                    unresolvedErrs.slice(0, 5).map(errItem => (
                      <div key={errItem.id} className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-2.5 text-xs space-y-1">
                        <div className="flex justify-between font-bold text-rose-200">
                          <span>{errItem.subject}</span>
                          <span className="text-[10px] text-slate-400">{errItem.date}</span>
                        </div>
                        <p className="text-slate-300 text-[11px] leading-tight">{errItem.topicName} ({errItem.errorReason || errItem.solutionNotes || 'Konu Hatası'})</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <p className="text-[10px] text-slate-400 border-t border-white/10 pt-2">
                * Bu konular öğrencinin denemelerde ve soru çözümlerinde sıkça hata yaptığı alanlardan derlenmiştir.
              </p>
            </div>

          </div>

          {/* Charts Row: Subject Distribution & Mock Progress */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Chart 1: Subject Question Distribution */}
            <div className="bg-slate-900/90 border border-white/15 rounded-3xl p-6 shadow-2xl backdrop-blur-2xl space-y-4">
              <h3 className="font-bold text-white text-base flex items-center space-x-2">
                <BarChart3 className="w-5 h-5 text-indigo-400" />
                <span>Ders Bazlı Çözülen Soru Sayıları</span>
              </h3>

              {(() => {
                const subjectMap: Record<string, { solved: number; correct: number; wrong: number }> = {};
                questionLogs.forEach(q => {
                  const subj = q.subject || 'Diğer';
                  if (!subjectMap[subj]) {
                    subjectMap[subj] = { solved: 0, correct: 0, wrong: 0 };
                  }
                  subjectMap[subj].solved += (q.solvedCount || 0);
                  subjectMap[subj].correct += (q.correctCount || 0);
                  subjectMap[subj].wrong += (q.wrongCount || 0);
                });

                const subjectData = Object.entries(subjectMap).map(([subject, stats]) => ({
                  subject,
                  count: stats.solved,
                  correct: stats.correct,
                  wrong: stats.wrong,
                })).sort((a, b) => {
                  if (teacherSubj) {
                    const aMatch = a.subject.toLowerCase().includes(teacherSubj) || teacherSubj.includes(a.subject.toLowerCase());
                    const bMatch = b.subject.toLowerCase().includes(teacherSubj) || teacherSubj.includes(b.subject.toLowerCase());
                    if (aMatch && !bMatch) return -1;
                    if (!aMatch && bMatch) return 1;
                  }
                  return b.count - a.count;
                });

                if (subjectData.length === 0) {
                  return <div className="py-16 text-center text-xs text-slate-400 italic">Soru çözüm grafiği için veri bulunmuyor.</div>;
                }

                return (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={subjectData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                        <XAxis dataKey="subject" stroke="#94a3b8" fontSize={11} interval={0} angle={-25} textAnchor="end" />
                        <YAxis stroke="#94a3b8" fontSize={11} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                          itemStyle={{ color: '#fff' }}
                        />
                        <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]}>
                          {subjectData.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={teacherSubj && entry.subject.toLowerCase().includes(teacherSubj) ? '#f59e0b' : '#6366f1'} 
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                );
              })()}
            </div>

            {/* Chart 2: Mock Exam Net Change Trend */}
            <div className="bg-slate-900/90 border border-white/15 rounded-3xl p-6 shadow-2xl backdrop-blur-2xl space-y-4">
              <h3 className="font-bold text-white text-base flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                <span>Genel Deneme Net Değişim Çizgisi</span>
              </h3>

              {(() => {
                const mockChartData = mocks.map((m, idx) => ({
                  name: m.title ? (m.title.length > 12 ? m.title.substring(0, 12) + '...' : m.title) : `Deneme ${idx + 1}`,
                  TYT: m.tyt?.totalNet || 0,
                  AYT: m.ayt?.totalNet || 0,
                  date: m.date
                }));

                if (mockChartData.length === 0) {
                  return <div className="py-16 text-center text-xs text-slate-400 italic">Deneme değişim grafiği için veri bulunmuyor.</div>;
                }

                return (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={mockChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} interval={0} angle={-25} textAnchor="end" />
                        <YAxis stroke="#94a3b8" fontSize={11} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                          itemStyle={{ color: '#fff' }}
                        />
                        <Line type="monotone" dataKey="TYT" stroke="#818cf8" strokeWidth={3} dot={{ r: 4 }} />
                        <Line type="monotone" dataKey="AYT" stroke="#34d399" strokeWidth={3} dot={{ r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                );
              })()}
            </div>

          </div>

        </div>
      )}

      {/* TAB: BADGES & ACHIEVEMENTS */}
      {activeTab === 'badges' && (
        <div className="space-y-6 animate-fade-in">
          {/* Top Header Card */}
          <div className="bg-slate-900/90 border border-amber-500/30 rounded-3xl p-6 shadow-2xl backdrop-blur-2xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <Trophy className="w-5 h-5 text-amber-400" />
                  <span>3D Kristal Başarı Rozetleri & Oyunlaştırma Vitrini</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Öğrencinin soru çözümleri, çalışma süreleri, deneme netleri ve günlük rutinleri ile kazandığı rozetler.
                </p>
              </div>
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold px-3 py-1.5 rounded-xl font-mono">
                {earnedCount} / {totalBadgesCount} Rozet Kazanıldı
              </span>
            </div>

            {/* Top 3 Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-950/80 border border-amber-500/20">
                <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-400/30 shrink-0">
                  <Trophy className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs text-slate-400 font-medium">Kazanılan Rozetler</div>
                  <div className="text-xl font-extrabold text-white">
                    {earnedCount} <span className="text-xs text-slate-400 font-normal">/ {totalBadgesCount}</span>
                  </div>
                  <div className="text-[10px] text-amber-400 font-semibold mt-0.5">
                    %{totalBadgesCount > 0 ? Math.round((earnedCount / totalBadgesCount) * 100) : 0} Tamamlandı
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-950/80 border border-orange-500/20">
                <div className="p-3 rounded-2xl bg-orange-500/20 text-orange-400 border border-orange-400/30 shrink-0">
                  <Flame className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs text-slate-400 font-medium">Aktif Seri & Rekor</div>
                  <div className="text-xl font-extrabold text-orange-400">
                    {motivationStats.currentStreak} Gün
                  </div>
                  <div className="text-[10px] text-slate-400 font-semibold mt-0.5">
                    En Uzun Seri: {motivationStats.longestStreak} Gün
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-950/80 border border-indigo-500/20">
                <div className="p-3 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-400/30 shrink-0">
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs text-slate-400 font-medium">Toplam Başarı Puanı</div>
                  <div className="text-xl font-extrabold text-amber-400">
                    {totalXp.toLocaleString('tr-TR')} XP
                  </div>
                  <div className="text-[10px] text-indigo-300 font-semibold mt-0.5">
                    Seviye: {Math.floor(totalXp / 500) + 1}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Badges Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {BADGE_DEFINITIONS.map(badge => {
              const isUnlocked = earnedKeysSet.has(badge.key);
              const progress = badge.calcProgress(stData as any, motivationStats);
              const earnedInfo = allEarnedBadges.find(b => b.key === badge.key);

              return (
                <div
                  key={badge.key}
                  className={`flex flex-col items-center justify-between p-4 rounded-2xl border transition-all ${
                    isUnlocked
                      ? 'bg-slate-900/90 border-amber-500/30 shadow-md shadow-amber-500/10 hover:border-amber-400/60'
                      : 'bg-slate-900/30 border-slate-800/60 opacity-60'
                  }`}
                >
                  <div className="w-full flex items-center justify-between text-[10px] mb-2">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-bold uppercase">
                      {badge.tier}
                    </span>
                    {isUnlocked ? (
                      <span className="text-emerald-400 font-bold">Açıldı</span>
                    ) : (
                      <span className="text-slate-500 flex items-center gap-1 font-semibold">
                        <Lock className="w-3 h-3" />
                        Kilitli
                      </span>
                    )}
                  </div>

                  <div className="my-2">
                    <BadgeShield
                      iconType={badge.iconType}
                      tier={badge.tier}
                      isUnlocked={isUnlocked}
                      size="md"
                    />
                  </div>

                  <div className="text-center w-full mt-1">
                    <h4 className="text-xs font-bold text-white line-clamp-1">{badge.name}</h4>
                    <p className="text-[10px] text-slate-400 line-clamp-2 mt-1">{badge.description}</p>
                  </div>

                  <div className="w-full mt-3 pt-2 border-t border-slate-800 text-[10px]">
                    {isUnlocked ? (
                      <div className="flex items-center justify-between text-amber-400 font-bold">
                        <span>+{badge.xpReward} XP</span>
                        <span className="text-slate-400 font-normal">
                          {earnedInfo?.earnedAt ? new Date(earnedInfo.earnedAt).toLocaleDateString('tr-TR') : 'Kazanıldı'}
                        </span>
                      </div>
                    ) : (
                      <div className="text-center text-slate-400">
                        {progress.label} (%{Math.round(progress.percent)})
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: STUDY PLANNER */}
      {activeTab === 'planner' && (() => {
        const totalPlannerTasks = plans.length;
        const completedPlannerTasks = plans.filter(p => p.status === 'completed').length;
        const pendingPlannerTasks = totalPlannerTasks - completedPlannerTasks;
        const totalPlannerMinutes = plans.reduce((acc, p) => acc + (p.plannedMinutes || 0), 0);
        const totalTargetQuestions = plans.reduce((acc, p) => acc + (p.targetQuestionCount || 0), 0);
        const plannerCompletionRate = totalPlannerTasks > 0 ? Math.round((completedPlannerTasks / totalPlannerTasks) * 100) : 0;

        const plannerSubjects = ['all', ...Array.from(new Set(plans.map((p: any) => String(p.subject || '')).filter(Boolean)))];

        const filteredPlans = plans.filter(p => {
          if (plannerDayFilter !== 'all' && p.day !== plannerDayFilter) return false;
          if (plannerStatusFilter === 'completed' && p.status !== 'completed') return false;
          if (plannerStatusFilter === 'pending' && p.status === 'completed') return false;
          if (plannerSubjectFilter !== 'all' && p.subject !== plannerSubjectFilter) return false;
          if (plannerSearchQuery.trim()) {
            const q = plannerSearchQuery.toLowerCase();
            const matchSubject = (p.subject || '').toLowerCase().includes(q);
            const matchTopic = (p.topic || '').toLowerCase().includes(q);
            const matchNotes = (p.notes || '').toLowerCase().includes(q);
            const matchType = (p.taskType || '').toLowerCase().includes(q);
            if (!matchSubject && !matchTopic && !matchNotes && !matchType) return false;
          }
          return true;
        });

        return (
          <div className="bg-slate-900/90 border border-white/15 rounded-3xl p-6 shadow-2xl backdrop-blur-2xl space-y-6">
            {/* Header & Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-fuchsia-400" />
                  <span>Haftalık Ders Çalışma Programı</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Öğrencinin haftalık ders çalışma takvimini yönetin, ilerlemesini takip edin ve yeni görevler atayın.</p>
              </div>

              {!isBranchTeacher && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowSaveTemplateModal(true)}
                    className="bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 font-bold text-xs px-3 py-2 rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                    <span>Şablon Olarak Kaydet</span>
                  </button>
                  <button
                    onClick={() => setShowAddTaskToStudentModal(true)}
                    className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all shadow-md shadow-fuchsia-600/20 flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Yeni Görev Ekle</span>
                  </button>
                </div>
              )}
            </div>

            {/* KPI Metrics Header */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-950/70 border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400">Toplam Görev</span>
                  <Calendar className="w-4 h-4 text-fuchsia-400" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-white">{totalPlannerTasks}</span>
                  <span className="text-xs text-slate-400">görev</span>
                </div>
              </div>

              <div className="bg-slate-950/70 border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400">Tamamlanan</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-emerald-400">{completedPlannerTasks}</span>
                  <span className="text-xs text-emerald-500/80 font-bold">/ {totalPlannerTasks} (%{plannerCompletionRate})</span>
                </div>
              </div>

              <div className="bg-slate-950/70 border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400">Bekleyen Görev</span>
                  <Clock className="w-4 h-4 text-amber-400" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-amber-400">{pendingPlannerTasks}</span>
                  <span className="text-xs text-slate-400">kaldı</span>
                </div>
              </div>

              <div className="bg-slate-950/70 border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400">Toplam Süre</span>
                  <Timer className="w-4 h-4 text-sky-400" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-sky-400">
                    {Math.floor(totalPlannerMinutes / 60)}s {totalPlannerMinutes % 60}d
                  </span>
                  {totalTargetQuestions > 0 && (
                    <span className="text-xs text-amber-400 font-bold">• {totalTargetQuestions} Soru</span>
                  )}
                </div>
              </div>
            </div>

            {/* Global Progress Bar */}
            <div className="bg-slate-950/60 border border-white/10 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-3.5 h-3.5 text-fuchsia-400" />
                  <span className="font-bold text-white">Haftalık Görev İlerleme Durumu</span>
                </div>
                <span className="font-mono font-bold text-fuchsia-400">
                  {completedPlannerTasks} / {totalPlannerTasks} Görev Yapıldı (%{plannerCompletionRate})
                </span>
              </div>
              <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden border border-white/10">
                <div 
                  className="h-full bg-gradient-to-r from-fuchsia-500 via-indigo-500 to-emerald-500 rounded-full transition-all duration-500 shadow-sm shadow-fuchsia-500/30"
                  style={{ width: `${plannerCompletionRate}%` }}
                />
              </div>
            </div>

            {/* Filter & Search Toolbar */}
            <div className="bg-slate-950/80 border border-white/10 rounded-2xl p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Search Box */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={plannerSearchQuery}
                    onChange={(e) => setPlannerSearchQuery(e.target.value)}
                    placeholder="Ders, konu başlığı, görev tipi veya notlarda ara..."
                    className="w-full bg-slate-900/90 border border-white/10 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-fuchsia-500/50 transition-colors"
                  />
                  {plannerSearchQuery && (
                    <button
                      onClick={() => setPlannerSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs px-1"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Status Filter Buttons */}
                <div className="flex items-center space-x-1.5 bg-slate-900/90 p-1 rounded-xl border border-white/10 shrink-0">
                  <button
                    onClick={() => setPlannerStatusFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      plannerStatusFilter === 'all'
                        ? 'bg-fuchsia-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Tümü ({totalPlannerTasks})
                  </button>
                  <button
                    onClick={() => setPlannerStatusFilter('completed')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center space-x-1 ${
                      plannerStatusFilter === 'completed'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-emerald-400'
                    }`}
                  >
                    <Check className="w-3 h-3" />
                    <span>Yapılanlar ({completedPlannerTasks})</span>
                  </button>
                  <button
                    onClick={() => setPlannerStatusFilter('pending')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center space-x-1 ${
                      plannerStatusFilter === 'pending'
                        ? 'bg-amber-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-amber-400'
                    }`}
                  >
                    <Clock className="w-3 h-3" />
                    <span>Bekleyenler ({pendingPlannerTasks})</span>
                  </button>
                </div>
              </div>

              {/* Day Filter Chips */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-white/5">
                <span className="text-[11px] font-bold text-slate-400 mr-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-fuchsia-400" /> Gün:
                </span>
                <button
                  onClick={() => setPlannerDayFilter('all')}
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                    plannerDayFilter === 'all'
                      ? 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-400/40 font-bold'
                      : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10 hover:text-slate-300'
                  }`}
                >
                  Tüm Günler
                </button>
                {DAYS.map(day => {
                  const count = plans.filter(p => p.day === day).length;
                  if (count === 0 && plannerDayFilter !== day) return null;
                  return (
                    <button
                      key={day}
                      onClick={() => setPlannerDayFilter(day)}
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                        plannerDayFilter === day
                          ? 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-400/40 font-bold'
                          : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10 hover:text-slate-300'
                      }`}
                    >
                      {day} ({count})
                    </button>
                  );
                })}
              </div>

              {/* Subject Filter Chips */}
              {plannerSubjects.length > 2 && (
                <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-white/5">
                  <span className="text-[11px] font-bold text-slate-400 mr-1 flex items-center gap-1">
                    <Filter className="w-3 h-3 text-indigo-400" /> Ders:
                  </span>
                  {plannerSubjects.map(subj => (
                    <button
                      key={subj}
                      onClick={() => setPlannerSubjectFilter(subj)}
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                        plannerSubjectFilter === subj
                          ? 'bg-indigo-500/20 text-indigo-300 border-indigo-400/40 font-bold'
                          : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10 hover:text-slate-300'
                      }`}
                    >
                      {subj === 'all' ? 'Tüm Dersler' : subj}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* List & Day Boards */}
            {plans.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-white/10 rounded-2xl space-y-3">
                <Calendar className="w-10 h-10 text-slate-500 mx-auto" />
                <p className="text-sm text-slate-400 font-medium">Bu öğrencinin haftalık planında henüz kayıtlı görev bulunmuyor.</p>
                {!isBranchTeacher && (
                  <button
                    onClick={() => setShowAddTaskToStudentModal(true)}
                    className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all inline-flex items-center space-x-1.5 cursor-pointer shadow-lg shadow-fuchsia-600/20 mt-2"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Hemen İlk Görevi Ekle</span>
                  </button>
                )}
              </div>
            ) : filteredPlans.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-white/10 rounded-2xl space-y-3">
                <Filter className="w-10 h-10 text-slate-500 mx-auto" />
                <p className="text-sm text-slate-400 font-medium">Uygulanan filtrelerle veya arama terimiyle eşleşen görev bulunamadı.</p>
                <button
                  onClick={() => {
                    setPlannerDayFilter('all');
                    setPlannerStatusFilter('all');
                    setPlannerSubjectFilter('all');
                    setPlannerSearchQuery('');
                  }}
                  className="text-xs text-fuchsia-400 hover:text-fuchsia-300 underline font-semibold cursor-pointer"
                >
                  Filtreleri Temizle
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {DAYS.map(day => {
                  const dayPlans = filteredPlans.filter(p => p.day === day);
                  if (dayPlans.length === 0) return null;

                  const dayCompleted = dayPlans.filter(p => p.status === 'completed').length;
                  const dayTotalMinutes = dayPlans.reduce((acc, p) => acc + (p.plannedMinutes || 0), 0);
                  const dayTotalQuestions = dayPlans.reduce((acc, p) => acc + (p.targetQuestionCount || 0), 0);
                  const dayPercent = Math.round((dayCompleted / dayPlans.length) * 100);

                  return (
                    <div key={day} className="bg-slate-950/80 border border-white/10 rounded-3xl p-5 space-y-4 shadow-xl flex flex-col justify-between">
                      <div className="space-y-3">
                        {/* Day Card Header */}
                        <div className="flex items-center justify-between border-b border-white/10 pb-3">
                          <div className="flex items-center space-x-2.5">
                            <div className={`w-2.5 h-2.5 rounded-full ${dayCompleted === dayPlans.length ? 'bg-emerald-400 ring-4 ring-emerald-400/20' : 'bg-fuchsia-400 ring-4 ring-fuchsia-400/20'}`} />
                            <span className="text-sm font-black text-white uppercase tracking-wider">{day}</span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border ${
                              dayCompleted === dayPlans.length
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                : 'bg-white/5 text-slate-400 border-white/10'
                            }`}>
                              {dayCompleted}/{dayPlans.length} Yapıldı (%{dayPercent})
                            </span>
                            <span className="text-xs text-slate-400 font-mono font-semibold">
                              {dayTotalMinutes} dk
                            </span>
                          </div>
                        </div>

                        {/* Mini Day Progress Bar */}
                        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-300 ${
                              dayCompleted === dayPlans.length ? 'bg-emerald-400' : 'bg-gradient-to-r from-fuchsia-500 to-indigo-500'
                            }`}
                            style={{ width: `${dayPercent}%` }}
                          />
                        </div>

                        {/* Task Cards in Day */}
                        <div className="space-y-3 pt-1">
                          {dayPlans.map(task => {
                            const isMyBranch = teacherSubj && (task.subject || '').toLowerCase().includes(teacherSubj);
                            const isCompleted = task.status === 'completed';

                            return (
                              <div 
                                key={task.id} 
                                className={`p-4 rounded-2xl border transition-all space-y-2.5 relative group ${
                                  isCompleted
                                    ? 'bg-emerald-950/20 border-emerald-500/30 hover:border-emerald-500/50 shadow-md shadow-emerald-500/5'
                                    : isMyBranch
                                    ? 'bg-amber-950/20 border-amber-500/40 hover:border-amber-500/60 shadow-md shadow-amber-500/5'
                                    : 'bg-slate-900/90 border-white/10 hover:border-white/20'
                                }`}
                              >
                                {/* Top Row: Subject Pill & Badges & Quick Actions */}
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-center flex-wrap gap-1.5">
                                    {/* Subject Badge */}
                                    <span className="text-xs font-black text-indigo-300 bg-indigo-500/20 px-2.5 py-0.5 rounded-lg border border-indigo-500/30">
                                      {task.subject}
                                    </span>

                                    {/* Task Type Badge */}
                                    {task.taskType && (
                                      <span className="text-[10px] font-semibold text-slate-300 bg-white/10 px-2 py-0.5 rounded-lg border border-white/10">
                                        {task.taskType}
                                      </span>
                                    )}

                                    {/* Teacher's Branch Badge */}
                                    {isMyBranch && (
                                      <span className="text-[10px] font-bold bg-amber-500/30 text-amber-200 px-2 py-0.5 rounded-lg border border-amber-500/40 flex items-center gap-1">
                                        <Sparkles className="w-2.5 h-2.5" />
                                        Branşınız
                                      </span>
                                    )}
                                  </div>

                                  {/* Action Buttons */}
                                  <div className="flex items-center space-x-1.5 shrink-0">
                                    <button
                                      onClick={() => handleToggleTaskStatusFromTeacher(selectedStudentUser.id, task.id, task.status)}
                                      className={`px-2 py-1 rounded-xl border transition-all cursor-pointer flex items-center space-x-1 text-xs font-bold ${
                                        isCompleted
                                          ? 'bg-emerald-500/25 text-emerald-300 border-emerald-500/50 hover:bg-emerald-500/35'
                                          : 'bg-white/5 text-slate-400 border-white/10 hover:text-white hover:bg-white/10'
                                      }`}
                                      title={isCompleted ? 'Tamamlandı (Geri almak için tıklayın)' : 'Tamamlandı olarak işaretle'}
                                    >
                                      <CheckCircle2 className={`w-3.5 h-3.5 ${isCompleted ? 'text-emerald-400' : 'text-slate-400'}`} />
                                      <span className="text-[10px]">{isCompleted ? 'Yapıldı' : 'Tamamla'}</span>
                                    </button>

                                    {!isBranchTeacher && (
                                      <button
                                        onClick={() => handleDeleteTaskFromStudent(selectedStudentUser.id, task.id)}
                                        className="p-1.5 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                                        title="Görevi Sil"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {/* Second Row: Topic Name (Alt Satırda Geniş, Kalın ve Tam Okunaklı) */}
                                <div className="pt-0.5">
                                  <div className={`text-sm font-bold leading-relaxed break-words ${isCompleted ? 'text-emerald-200/90 line-through decoration-emerald-500/40' : 'text-white'}`}>
                                    {task.topic}
                                  </div>
                                  {task.notes && (
                                    <p className="text-[11px] text-slate-400 mt-1.5 bg-black/30 p-2 rounded-xl border border-white/5 italic">
                                      "{task.notes}"
                                    </p>
                                  )}
                                </div>

                                {/* Bottom Row: Metadata Tags (Duration, Target Questions, Status) */}
                                <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px] font-medium">
                                  <div className="flex items-center space-x-3 text-slate-400">
                                    <span className="flex items-center space-x-1">
                                      <Clock className="w-3.5 h-3.5 text-sky-400" />
                                      <span className="font-mono text-slate-200 font-bold">{task.plannedMinutes || 0} dk</span>
                                    </span>

                                    {task.targetQuestionCount && task.targetQuestionCount > 0 ? (
                                      <span className="flex items-center space-x-1 text-amber-300">
                                        <Target className="w-3.5 h-3.5 text-amber-400" />
                                        <span className="font-mono font-bold">{task.targetQuestionCount} Soru</span>
                                      </span>
                                    ) : null}
                                  </div>

                                  <div>
                                    {isCompleted ? (
                                      <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/30">
                                        <Check className="w-3 h-3" />
                                        <span>Tamamlandı</span>
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-500/30">
                                        <Clock className="w-3 h-3" />
                                        <span>Bekliyor</span>
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Day Summary Footer */}
                      {dayTotalQuestions > 0 && (
                        <div className="pt-2 border-t border-white/5 text-[10px] text-amber-300/80 font-mono font-semibold flex items-center justify-between">
                          <span>Günün Soru Hedefi:</span>
                          <span className="font-bold">{dayTotalQuestions} Soru</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}

      {/* TAB 3: QUESTIONS */}
      {activeTab === 'questions' && (() => {
        const totalSolved = questionLogs.reduce((acc, l) => acc + (l.solvedCount || 0), 0);
        const totalCorrect = questionLogs.reduce((acc, l) => acc + (l.correctCount || 0), 0);
        const totalWrong = questionLogs.reduce((acc, l) => acc + (l.wrongCount || 0), 0);
        const totalEmpty = questionLogs.reduce((acc, l) => acc + (l.emptyCount || 0), 0);
        const totalNet = questionLogs.reduce((acc, l) => acc + (l.netScore !== undefined ? l.netScore : ((l.correctCount || 0) - (l.wrongCount || 0) * 0.25)), 0);
        const totalDurationMinutes = questionLogs.reduce((acc, l) => acc + (l.durationMinutes || 0), 0);
        const accuracyPct = totalSolved > 0 ? Math.round((totalCorrect / totalSolved) * 100) : 0;
        const distinctDays = new Set(questionLogs.map(l => l.date).filter(Boolean)).size;

        const subjectsList = ['all', ...Array.from(new Set(questionLogs.map(l => l.subject).filter(Boolean)))];

        // Date calculation for filtering
        const now = new Date();
        const getCutoffDate = (days: number) => {
          const d = new Date(now);
          d.setDate(d.getDate() - days);
          return d.toISOString().split('T')[0];
        };

        const cutoff7 = getCutoffDate(7);
        const cutoff30 = getCutoffDate(30);

        // Filtered logs
        const filteredLogs = questionLogs.filter(log => {
          if (questionSubjectFilter !== 'all' && log.subject !== questionSubjectFilter) return false;
          if (questionExamTypeFilter !== 'all' && log.examType !== questionExamTypeFilter) return false;
          if (questionDateFilter === '7days' && log.date && log.date < cutoff7) return false;
          if (questionDateFilter === '30days' && log.date && log.date < cutoff30) return false;
          if (questionSearchQuery.trim()) {
            const q = questionSearchQuery.toLowerCase();
            const matchSubj = (log.subject || '').toLowerCase().includes(q);
            const matchTopic = (log.topic || '').toLowerCase().includes(q);
            const matchNotes = (log.notes || '').toLowerCase().includes(q);
            if (!matchSubj && !matchTopic && !matchNotes) return false;
          }
          return true;
        }).sort((a, b) => {
          if (teacherSubj) {
            const aMatch = (a.subject || '').toLowerCase().includes(teacherSubj) || teacherSubj.includes((a.subject || '').toLowerCase());
            const bMatch = (b.subject || '').toLowerCase().includes(teacherSubj) || teacherSubj.includes((b.subject || '').toLowerCase());
            if (aMatch && !bMatch) return -1;
            if (!aMatch && bMatch) return 1;
          }
          return (b.date || '').localeCompare(a.date || '');
        });

        // 1. Chart Data: Daily Trends (Aggregated by Date - Last 14 Active Days - Stacked)
        const dailyMap: Record<string, { date: string; displayDate: string; solved: number; correct: number; wrong: number; empty: number; wrongAndEmpty: number; net: number }> = {};
        questionLogs.forEach(l => {
          if (!l.date) return;
          const key = l.date;
          if (!dailyMap[key]) {
            const parts = key.split('-');
            const displayDate = parts.length === 3 ? `${parts[2]}/${parts[1]}` : key;
            dailyMap[key] = { date: key, displayDate, solved: 0, correct: 0, wrong: 0, empty: 0, wrongAndEmpty: 0, net: 0 };
          }
          const solved = (l.solvedCount || 0);
          const correct = (l.correctCount || 0);
          const wrong = (l.wrongCount || 0);
          const empty = (l.emptyCount || 0);
          dailyMap[key].solved += solved;
          dailyMap[key].correct += correct;
          dailyMap[key].wrong += wrong;
          dailyMap[key].empty += empty;
          dailyMap[key].wrongAndEmpty += (wrong + empty);
          dailyMap[key].net += (l.netScore !== undefined ? l.netScore : (correct - wrong * 0.25));
        });

        const dailyChartData = Object.values(dailyMap)
          .sort((a, b) => a.date.localeCompare(b.date))
          .slice(-14)
          .map(d => ({
            ...d,
            net: Number(d.net.toFixed(2))
          }));

        // 2. Chart Data: Last 7 Days with Subject Breakdown (X-axis: Days, Stacked Bars: Subjects)
        const last7DaysLogs = questionLogs.filter(l => l.date && l.date >= cutoff7);
        const logsFor7Days = last7DaysLogs.length > 0 ? last7DaysLogs : questionLogs.slice(-25);
        const isUsingLast7Days = last7DaysLogs.length > 0;

        // Collect unique dates in this range (chronologically sorted)
        const dateSet = Array.from(new Set(logsFor7Days.map(l => l.date).filter(Boolean))).sort();
        const recent7Dates = dateSet.slice(-7);

        // Collect all distinct subjects present in these 7 dates
        const distinctSubjectsIn7Days = Array.from(new Set(
          logsFor7Days
            .filter(l => l.date && recent7Dates.includes(l.date))
            .map(l => l.subject || 'Diğer')
        ));

        // Build stacked chart rows per date
        const last7DaysSubjectChartData = recent7Dates.map(d => {
          const parts = d.split('-');
          const displayDate = parts.length === 3 ? `${parts[2]}/${parts[1]}` : d;
          const dayLogs = logsFor7Days.filter(l => l.date === d);

          const row: Record<string, any> = {
            date: d,
            displayDate,
            total: 0
          };

          distinctSubjectsIn7Days.forEach(s => {
            row[s] = 0;
          });

          dayLogs.forEach(l => {
            const s = l.subject || 'Diğer';
            const count = (l.solvedCount || 0);
            row[s] = (row[s] || 0) + count;
            row.total += count;
          });

          return row;
        });

        const SUBJECT_PALETTE: Record<string, string> = {
          'Matematik': '#6366f1',
          'TYT Matematik': '#6366f1',
          'AYT Matematik': '#4f46e5',
          'Geometri': '#818cf8',
          'Türkçe': '#ec4899',
          'TYT Türkçe': '#ec4899',
          'Edebiyat': '#db2777',
          'Fizik': '#06b6d4',
          'TYT Fizik': '#06b6d4',
          'AYT Fizik': '#0891b2',
          'Kimya': '#10b981',
          'TYT Kimya': '#10b981',
          'AYT Kimya': '#059669',
          'Biyoloji': '#84cc16',
          'TYT Biyoloji': '#84cc16',
          'AYT Biyoloji': '#65a30d',
          'Tarih': '#f59e0b',
          'TYT Tarih': '#f59e0b',
          'AYT Tarih': '#d97706',
          'Coğrafya': '#ea580c',
          'TYT Coğrafya': '#ea580c',
          'AYT Coğrafya': '#c2410c',
          'Felsefe': '#a855f7',
          'Din Kültürü': '#14b8a6',
          'İngilizce': '#3b82f6',
        };
        const FALLBACK_COLORS = ['#6366f1', '#ec4899', '#06b6d4', '#10b981', '#f59e0b', '#8b5cf6', '#ea580c', '#14b8a6', '#84cc16', '#3b82f6', '#e11d48', '#f97316'];
        const getSubjectColor = (subj: string, index: number) => {
          return SUBJECT_PALETTE[subj] || FALLBACK_COLORS[index % FALLBACK_COLORS.length];
        };

        return (
          <div className="bg-slate-900/90 border border-white/15 rounded-3xl p-6 shadow-2xl backdrop-blur-2xl space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <CheckSquare className="w-5 h-5 text-amber-400" />
                  <span>Soru Çözüm Kayıtları ve Performans Analizi</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Öğrencinin gün ve ders bazlı soru çözüm adetleri, doğruluk trendleri ve net skorları.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold px-3 py-1.5 rounded-xl font-mono">
                  {questionLogs.length} Oturum • {totalSolved} Soru
                </span>
              </div>
            </div>

            {/* KPI Metrics Header */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {/* Card 1: Toplam Çözülen */}
              <div className="bg-slate-950/70 border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400">Toplam Çözülen</span>
                  <CheckSquare className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-white">{totalSolved}</span>
                  <span className="text-xs text-slate-400">soru</span>
                </div>
                <div className="mt-1 text-[10px] text-slate-500 font-medium">
                  {distinctDays} aktif çalışma gününde
                </div>
              </div>

              {/* Card 2: Doğru & Başarı Oranı */}
              <div className="bg-slate-950/70 border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400">Doğru Sayısı</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-emerald-400">{totalCorrect}</span>
                  <span className="text-xs font-bold text-emerald-500/90">(%{accuracyPct})</span>
                </div>
                <div className="mt-1 text-[10px] text-emerald-400/80 font-medium">
                  Net Doğruluk Oranı
                </div>
              </div>

              {/* Card 3: Yanlış & Boş */}
              <div className="bg-slate-950/70 border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400">Yanlış & Boş</span>
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                </div>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-rose-400">{totalWrong}</span>
                  <span className="text-xs text-slate-400 font-bold">/ {totalEmpty} boş</span>
                </div>
                <div className="mt-1 text-[10px] text-rose-400/80 font-medium">
                  Hata Oranı: %{totalSolved > 0 ? Math.round((totalWrong / totalSolved) * 100) : 0}
                </div>
              </div>

              {/* Card 4: Toplam Net Skoru */}
              <div className="bg-slate-950/70 border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400">Toplam Net</span>
                  <Target className="w-4 h-4 text-sky-400" />
                </div>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-sky-400">{totalNet.toFixed(1)}</span>
                  <span className="text-xs text-sky-500 font-bold">net</span>
                </div>
                <div className="mt-1 text-[10px] text-slate-500 font-medium">
                  Oturum başı: {questionLogs.length > 0 ? (totalNet / questionLogs.length).toFixed(1) : 0} net
                </div>
              </div>

              {/* Card 5: Toplam Süre */}
              <div className="bg-slate-950/70 border border-white/10 rounded-2xl p-4 flex flex-col justify-between col-span-2 sm:col-span-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400">Çözüm Süresi</span>
                  <Timer className="w-4 h-4 text-amber-400" />
                </div>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-amber-400">
                    {Math.floor(totalDurationMinutes / 60)}s {totalDurationMinutes % 60}d
                  </span>
                </div>
                <div className="mt-1 text-[10px] text-amber-300/80 font-medium">
                  {totalSolved > 0 ? (totalDurationMinutes / totalSolved).toFixed(1) : 0} dk / soru
                </div>
              </div>
            </div>

            {/* Visual Charts Section */}
            {questionLogs.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Chart 1: Daily Question & Correct Trend */}
                <div className="bg-slate-950/80 border border-white/10 rounded-3xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="w-4 h-4 text-indigo-400" />
                      <h4 className="text-xs font-bold text-white">Günlük Soru Çözüm Trendi (Son 14 Gün)</h4>
                    </div>
                    <div className="flex items-center space-x-3 text-[10px] font-bold">
                      <span className="flex items-center space-x-1 text-emerald-400">
                        <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                        <span>Doğru</span>
                      </span>
                      <span className="flex items-center space-x-1 text-rose-400">
                        <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" />
                        <span>Yanlış / Boş</span>
                      </span>
                    </div>
                  </div>

                  <div className="h-48 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dailyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                        <XAxis dataKey="displayDate" stroke="#94a3b8" fontSize={10} tickLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#090d16', borderColor: '#ffffff20', borderRadius: '12px', fontSize: '11px', color: '#fff' }}
                          formatter={(val: any, name: any, item: any) => {
                            if (name === 'correct') return [`${val} Soru`, 'Doğru'];
                            if (name === 'wrongAndEmpty') return [`${val} Soru (${item.payload.wrong} Yanlış, ${item.payload.empty} Boş)`, 'Yanlış / Boş'];
                            return [val, name];
                          }}
                          labelFormatter={(l: any, payload: any) => {
                            const item = payload && payload[0]?.payload;
                            return item ? `Tarih: ${item.date} (Toplam: ${item.solved} Soru, ${item.net} Net)` : `Tarih: ${l}`;
                          }}
                        />
                        <Bar dataKey="correct" fill="#10b981" stackId="dailyStack" name="correct" maxBarSize={28} />
                        <Bar dataKey="wrongAndEmpty" fill="#f43f5e" radius={[4, 4, 0, 0]} stackId="dailyStack" name="wrongAndEmpty" maxBarSize={28} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart 2: Subject Distribution (Son 7 Gün - X ekseninde günler, sütunda o gün çözülen dersler) */}
                <div className="bg-slate-950/80 border border-white/10 rounded-3xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <BarChart3 className="w-4 h-4 text-emerald-400" />
                      <h4 className="text-xs font-bold text-white">
                        Ders Bazlı Soru Dağılımı {isUsingLast7Days ? '(Son 7 Gün)' : '(Son Kayıtlar)'}
                      </h4>
                    </div>
                    <div className="flex items-center space-x-2 text-[10px] font-bold overflow-x-auto max-w-[200px] scrollbar-none">
                      {distinctSubjectsIn7Days.slice(0, 4).map((subj, idx) => (
                        <span key={subj} className="flex items-center space-x-1 whitespace-nowrap text-slate-300">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getSubjectColor(subj, idx) }} />
                          <span>{subj}</span>
                        </span>
                      ))}
                      {distinctSubjectsIn7Days.length > 4 && (
                        <span className="text-slate-500 font-mono text-[9px]">+{distinctSubjectsIn7Days.length - 4}</span>
                      )}
                    </div>
                  </div>

                  <div className="h-48 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={last7DaysSubjectChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                        <XAxis dataKey="displayDate" stroke="#94a3b8" fontSize={10} tickLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#090d16', borderColor: '#ffffff20', borderRadius: '12px', fontSize: '11px', color: '#fff' }}
                          formatter={(val: any, name: any) => {
                            if (!val || val === 0) return null as any;
                            return [`${val} Soru`, name];
                          }}
                          labelFormatter={(l: any, payload: any) => {
                            const item = payload && payload[0]?.payload;
                            return item ? `Tarih: ${item.date} (Günlük Toplam: ${item.total} Soru)` : `Tarih: ${l}`;
                          }}
                        />
                        {distinctSubjectsIn7Days.map((subj, sIdx) => {
                          const color = getSubjectColor(subj, sIdx);
                          const isTop = sIdx === distinctSubjectsIn7Days.length - 1;
                          return (
                            <Bar
                              key={subj}
                              dataKey={subj}
                              fill={color}
                              stackId="daySubjectsStack"
                              name={subj}
                              radius={isTop ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                              maxBarSize={32}
                            />
                          );
                        })}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* Filter Toolbar */}
            <div className="bg-slate-950/80 border border-white/10 rounded-2xl p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Search Box */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={questionSearchQuery}
                    onChange={(e) => setQuestionSearchQuery(e.target.value)}
                    placeholder="Ders, konu adı veya notlarda ara..."
                    className="w-full bg-slate-900/90 border border-white/10 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 transition-colors"
                  />
                  {questionSearchQuery && (
                    <button
                      onClick={() => setQuestionSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs px-1"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Exam Type Filter Buttons */}
                <div className="flex items-center space-x-1.5 bg-slate-900/90 p-1 rounded-xl border border-white/10 shrink-0">
                  <button
                    onClick={() => setQuestionExamTypeFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      questionExamTypeFilter === 'all'
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Tüm Sınavlar
                  </button>
                  <button
                    onClick={() => setQuestionExamTypeFilter('TYT')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      questionExamTypeFilter === 'TYT'
                        ? 'bg-indigo-600 text-white font-bold shadow-sm'
                        : 'text-slate-400 hover:text-indigo-400'
                    }`}
                  >
                    TYT
                  </button>
                  <button
                    onClick={() => setQuestionExamTypeFilter('AYT')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      questionExamTypeFilter === 'AYT'
                        ? 'bg-fuchsia-600 text-white font-bold shadow-sm'
                        : 'text-slate-400 hover:text-fuchsia-400'
                    }`}
                  >
                    AYT
                  </button>
                </div>

                {/* Date Filter & View Switcher */}
                <div className="flex items-center space-x-2 shrink-0">
                  <div className="flex items-center space-x-1 bg-slate-900/90 p-1 rounded-xl border border-white/10">
                    <button
                      onClick={() => setQuestionDateFilter('all')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                        questionDateFilter === 'all' ? 'bg-white/15 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Tümü
                    </button>
                    <button
                      onClick={() => setQuestionDateFilter('7days')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                        questionDateFilter === '7days' ? 'bg-white/15 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Son 7 Gün
                    </button>
                    <button
                      onClick={() => setQuestionDateFilter('30days')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                        questionDateFilter === '30days' ? 'bg-white/15 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Son 30 Gün
                    </button>
                  </div>

                  {/* View Mode Toggle */}
                  <div className="flex items-center space-x-1 bg-slate-900/90 p-1 rounded-xl border border-white/10">
                    <button
                      onClick={() => setQuestionViewMode('cards')}
                      className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                        questionViewMode === 'cards' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                      }`}
                      title="Kart Görünümü"
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setQuestionViewMode('table')}
                      className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                        questionViewMode === 'table' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                      }`}
                      title="Detaylı Tablo Görünümü"
                    >
                      <Table className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Subject Filter Chips */}
              {subjectsList.length > 2 && (
                <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-white/5">
                  <span className="text-[11px] font-bold text-slate-400 mr-1 flex items-center gap-1">
                    <Filter className="w-3 h-3 text-amber-400" /> Ders:
                  </span>
                  {subjectsList.map(subj => {
                    const isMyBranch = teacherSubj && subj.toLowerCase().includes(teacherSubj);
                    return (
                      <button
                        key={subj}
                        onClick={() => setQuestionSubjectFilter(subj)}
                        className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all cursor-pointer flex items-center space-x-1 ${
                          questionSubjectFilter === subj
                            ? 'bg-amber-500/20 text-amber-300 border-amber-400/40 font-bold'
                            : isMyBranch
                            ? 'bg-amber-500/10 text-amber-200 border-amber-500/20 hover:bg-amber-500/20'
                            : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10 hover:text-slate-300'
                        }`}
                      >
                        <span>{subj === 'all' ? 'Tüm Dersler' : subj}</span>
                        {isMyBranch && <span className="text-[9px] text-amber-300 font-bold">⭐</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* List / Cards / Table */}
            {questionLogs.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-white/10 rounded-2xl space-y-3">
                <CheckSquare className="w-10 h-10 text-slate-500 mx-auto" />
                <p className="text-sm text-slate-400 font-medium">Bu öğrencinin henüz kayıtlı soru çözümü bulunmuyor.</p>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-white/10 rounded-2xl space-y-3">
                <Filter className="w-10 h-10 text-slate-500 mx-auto" />
                <p className="text-sm text-slate-400 font-medium">Uygulanan filtrelerle eşleşen soru kaydı bulunamadı.</p>
                <button
                  onClick={() => {
                    setQuestionSubjectFilter('all');
                    setQuestionExamTypeFilter('all');
                    setQuestionDateFilter('all');
                    setQuestionSearchQuery('');
                  }}
                  className="text-xs text-amber-400 hover:text-amber-300 underline font-semibold cursor-pointer"
                >
                  Filtreleri Temizle
                </button>
              </div>
            ) : questionViewMode === 'cards' ? (
              /* CARD VIEW (Modern Grid) */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredLogs.map(log => {
                  const isMyBranch = teacherSubj && (log.subject || '').toLowerCase().includes(teacherSubj);
                  const solved = log.solvedCount || 0;
                  const correct = log.correctCount || 0;
                  const wrong = log.wrongCount || 0;
                  const empty = log.emptyCount || 0;
                  const net = log.netScore !== undefined ? log.netScore : (correct - wrong * 0.25);
                  const logAccuracy = solved > 0 ? Math.round((correct / solved) * 100) : 0;

                  return (
                    <div 
                      key={log.id} 
                      className={`p-4 rounded-2xl border transition-all space-y-3 relative group ${
                        isMyBranch
                          ? 'bg-amber-950/20 border-amber-500/40 hover:border-amber-500/60 shadow-md shadow-amber-500/5'
                          : 'bg-slate-950/80 border-white/10 hover:border-white/20'
                      }`}
                    >
                      {/* Top Row: Badges & Accuracy */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center flex-wrap gap-1.5">
                          {/* Subject Pill */}
                          <span className="text-xs font-black text-indigo-300 bg-indigo-500/20 px-2.5 py-0.5 rounded-lg border border-indigo-500/30">
                            {log.subject}
                          </span>

                          {/* Exam Type */}
                          {log.examType && (
                            <span className="text-[10px] font-bold text-slate-300 bg-white/10 px-2 py-0.5 rounded-lg border border-white/10">
                              {log.examType}
                            </span>
                          )}

                          {/* Branch Badge */}
                          {isMyBranch && (
                            <span className="text-[10px] font-bold bg-amber-500/30 text-amber-200 px-2 py-0.5 rounded-lg border border-amber-500/40 flex items-center gap-1">
                              <Sparkles className="w-2.5 h-2.5" />
                              Branşınız
                            </span>
                          )}
                        </div>

                        {/* Accuracy Pill */}
                        <div className="flex items-center space-x-1.5 shrink-0">
                          <span className={`text-[11px] font-black px-2 py-0.5 rounded-lg border ${
                            logAccuracy >= 80
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                              : logAccuracy >= 50
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                              : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                          }`}>
                            %{logAccuracy} Başarı
                          </span>
                        </div>
                      </div>

                      {/* Second Row: Topic (Alt Satırda Geniş & Kalın) */}
                      <div className="pt-0.5">
                        <div className="text-sm font-bold text-white leading-relaxed break-words">
                          {log.topic || log.notes || 'Genel Soru Çözümü'}
                        </div>
                        {log.notes && log.topic && (
                          <p className="text-[11px] text-slate-400 mt-1 bg-black/30 p-2 rounded-xl border border-white/5 italic">
                            "{log.notes}"
                          </p>
                        )}
                      </div>

                      {/* 3-Color Mini Accuracy Bar */}
                      {solved > 0 && (
                        <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden flex border border-white/10">
                          <div 
                            className="h-full bg-emerald-500 transition-all duration-300"
                            style={{ width: `${(correct / solved) * 100}%` }}
                            title={`Doğru: ${correct}`}
                          />
                          <div 
                            className="h-full bg-rose-500 transition-all duration-300"
                            style={{ width: `${(wrong / solved) * 100}%` }}
                            title={`Yanlış: ${wrong}`}
                          />
                          <div 
                            className="h-full bg-slate-500 transition-all duration-300"
                            style={{ width: `${(empty / solved) * 100}%` }}
                            title={`Boş: ${empty}`}
                          />
                        </div>
                      )}

                      {/* Bottom Row: Detailed Metrics */}
                      <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs font-mono">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-white">{solved} Soru</span>
                          <span className="text-slate-500">•</span>
                          <span className="text-emerald-400 font-bold">{correct} D</span>
                          <span className="text-rose-400 font-bold">{wrong} Y</span>
                          {empty > 0 && <span className="text-slate-400">{empty} B</span>}
                        </div>

                        <div className="flex items-center space-x-2">
                          <span className="text-sky-300 font-bold bg-sky-500/10 px-2 py-0.5 rounded-lg border border-sky-500/20">
                            {net.toFixed(2)} Net
                          </span>
                        </div>
                      </div>

                      {/* Card Footer: Date & Duration */}
                      <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium pt-1">
                        <span className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          <span>{log.date}</span>
                        </span>
                        {log.durationMinutes ? (
                          <span className="flex items-center space-x-1 text-amber-400/90 font-mono">
                            <Clock className="w-3 h-3" />
                            <span>{log.durationMinutes} dk</span>
                          </span>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* TABLE VIEW (Enriched Table) */
              <div className="overflow-x-auto rounded-2xl border border-white/10">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/10 text-slate-300 font-bold">
                    <tr>
                      <th className="p-3.5">Tarih</th>
                      <th className="p-3.5">Ders & Sınav</th>
                      <th className="p-3.5">Konu Başlığı</th>
                      <th className="p-3.5 text-center">Çözülen</th>
                      <th className="p-3.5 text-center text-emerald-400">Doğru</th>
                      <th className="p-3.5 text-center text-rose-400">Yanlış</th>
                      <th className="p-3.5 text-center text-slate-400">Boş</th>
                      <th className="p-3.5 text-center text-sky-400">Net</th>
                      <th className="p-3.5 text-center text-amber-400">Başarı %</th>
                      <th className="p-3.5 text-center">Süre</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10 text-slate-200 font-mono">
                    {filteredLogs.map((log) => {
                      const isMyBranch = teacherSubj && (log.subject || '').toLowerCase().includes(teacherSubj);
                      const solved = log.solvedCount || 0;
                      const correct = log.correctCount || 0;
                      const wrong = log.wrongCount || 0;
                      const empty = log.emptyCount || 0;
                      const net = log.netScore !== undefined ? log.netScore : (correct - wrong * 0.25);
                      const logAccuracy = solved > 0 ? Math.round((correct / solved) * 100) : 0;

                      return (
                        <tr key={log.id} className={isMyBranch ? 'bg-amber-500/10 border-l-4 border-l-amber-400 hover:bg-amber-500/15' : 'hover:bg-white/5'}>
                          <td className="p-3.5 text-slate-400 whitespace-nowrap">{log.date}</td>
                          <td className="p-3.5 font-bold text-white whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <span className="text-indigo-300 font-sans">{log.subject}</span>
                              {log.examType && (
                                <span className="text-[10px] bg-white/10 px-1.5 py-0.2 rounded text-slate-300 font-sans">
                                  {log.examType}
                                </span>
                              )}
                              {isMyBranch && (
                                <span className="text-[9px] bg-amber-500/30 text-amber-200 px-1.5 py-0.5 rounded border border-amber-400/40 font-sans">
                                  Branşınız ⭐
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-3.5 font-bold text-white min-w-[180px]">
                            <div className="font-sans text-xs">{log.topic || log.notes || 'Genel Soru Çözümü'}</div>
                            {log.notes && log.topic && (
                              <div className="text-[10px] text-slate-400 font-sans italic font-normal mt-0.5">
                                "{log.notes}"
                              </div>
                            )}
                          </td>
                          <td className="p-3.5 text-center font-bold text-white">{solved}</td>
                          <td className="p-3.5 text-center text-emerald-400 font-bold">{correct}</td>
                          <td className="p-3.5 text-center text-rose-400 font-bold">{wrong}</td>
                          <td className="p-3.5 text-center text-slate-400">{empty}</td>
                          <td className="p-3.5 text-center text-sky-300 font-bold">{net.toFixed(2)}</td>
                          <td className="p-3.5 text-center">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${
                              logAccuracy >= 80
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                : logAccuracy >= 50
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                            }`}>
                              %{logAccuracy}
                            </span>
                          </td>
                          <td className="p-3.5 text-center text-slate-400 text-[11px]">
                            {log.durationMinutes ? `${log.durationMinutes} dk` : '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })()}

      {/* TAB 4: SUBJECT & TOPIC PROGRESS */}
      {activeTab === 'topics' && (() => {
        const studentField = profile?.targetField || 'SAY';
        const fieldKeywords: Record<string, string[]> = {
          'SAY': ['Matematik', 'Fizik', 'Kimya', 'Biyoloji', 'TYT'],
          'EA':  ['Matematik', 'Edebiyat', 'Tarih', 'Coğrafya', 'TYT'],
          'SÖZ': ['Edebiyat', 'Tarih', 'Coğrafya', 'Felsefe', 'Dil', 'TYT'],
          'DİL': ['Dil', 'İngilizce', 'TYT'],
        };
        const keywords = fieldKeywords[studentField] || [];
        const fieldFiltered = showAllTopics 
          ? subjectProgressList 
          : subjectProgressList.filter(s => keywords.some(kw => s.subjectName.toLowerCase().includes(kw.toLowerCase())));
        const displayList = fieldFiltered.length > 0 ? fieldFiltered : subjectProgressList;

        return (
          <div className="bg-slate-900/90 border border-white/15 rounded-3xl p-6 shadow-2xl backdrop-blur-2xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <ListChecks className="w-5 h-5 text-teal-400" />
                  <span>Müfredat ve Konu Tamamlama İlerlemesi</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {showAllTopics ? 'Tüm dersler gösteriliyor.' : `Öğrencinin alanı (${studentField}) dersleri gösteriliyor.`}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-bold px-3 py-1.5 rounded-xl font-mono">
                  %{topicCompletionPct} ({completedTopicsCount}/{totalTopicsCount})
                </span>
                <button
                  onClick={() => setShowAllTopics(v => !v)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                    showAllTopics
                      ? 'bg-indigo-600 text-white border-indigo-400/40'
                      : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                  }`}
                >
                  {showAllTopics ? 'Alanı Göster' : 'Tümünü Göster'}
                </button>
              </div>
            </div>

            {displayList.length === 0 ? (
              <div className="py-16 text-center text-xs text-slate-400 italic border border-dashed border-white/10 rounded-2xl">
                Henüz konu ilerleme kaydı bulunmuyor.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayList.map(subjItem => {
                  const isMyBranch = teacherSubj && subjItem.subjectName.toLowerCase().includes(teacherSubj);

                  return (
                    <div 
                      key={subjItem.subjectName} 
                      className={`p-4 rounded-2xl border space-y-3 ${
                        isMyBranch 
                          ? 'bg-amber-500/10 border-amber-500/40 shadow-lg shadow-amber-500/5' 
                          : 'bg-slate-950/80 border-white/10'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center space-x-1.5">
                            <h4 className="font-bold text-white text-sm">{subjItem.subjectName}</h4>
                            {isMyBranch && (
                              <span className="text-[9px] bg-amber-500/30 text-amber-200 px-1.5 py-0.5 rounded font-semibold">
                                Branşınız ⭐
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {subjItem.doneCount} / {subjItem.totalCount} Bitti
                          </span>
                        </div>
                        <span className="text-xs font-mono font-bold text-teal-400">%{subjItem.pct}</span>
                      </div>

                      <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div className="bg-teal-500 h-full rounded-full transition-all duration-500" style={{ width: `${subjItem.pct}%` }} />
                      </div>

                      <div className="space-y-1 max-h-40 overflow-y-auto pr-1 text-xs pt-1">
                        {subjItem.topics.map(topic => (
                          <div key={topic.name} className="flex items-center justify-between text-slate-300 py-0.5 border-b border-white/5 last:border-0">
                            <span className="truncate pr-2">{topic.name}</span>
                            <span className={
                              topic.isDone 
                                ? 'text-emerald-400 font-bold shrink-0' 
                                : topic.isInProgress 
                                ? 'text-amber-400 font-bold shrink-0' 
                                : 'text-slate-500 shrink-0'
                            }>
                              {topic.isDone ? '✓ Bitti' : topic.isInProgress ? '⏳ Çalışılıyor' : '○ Eksik'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}

      {/* TAB 5: MOCKS & BRANCH EXAMS */}
      {activeTab === 'mocks' && (
        <div className="space-y-6">
          {selectedInstitutionalExam ? (
            /* INSTITUTIONAL REPORT CARD (KARNE) FULL VIEW */
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-slate-900/90 border border-white/15 rounded-2xl p-4 shadow-xl backdrop-blur-2xl">
                <button
                  onClick={() => setSelectedInstitutionalExam(null)}
                  className="flex items-center space-x-2 px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-bold rounded-xl transition-all border border-emerald-400/30 cursor-pointer shadow-md"
                >
                  <ArrowLeft className="w-4 h-4 text-emerald-400" />
                  <span>← Kurumsal Denemeler Listesine Dön</span>
                </button>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-slate-300 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
                    Sınav: <strong className="text-white">{selectedInstitutionalExam.examTitle || selectedInstitutionalExam.title}</strong>
                  </span>
                </div>
              </div>

              <MockInstitutionalDetailView
                selectedInstitutionalExam={selectedInstitutionalExam}
                setSelectedInstitutionalExam={setSelectedInstitutionalExam}
                allInstitutionalExams={institutionalMocks}
              />
            </div>
          ) : (
            /* MAIN MOCK EXAM ANALYSIS HUB */
            <div className="bg-slate-900/90 border border-white/15 rounded-3xl p-6 shadow-2xl backdrop-blur-2xl space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center space-x-2">
                    <BarChart3 className="w-5 h-5 text-sky-400" />
                    <span>Deneme Sınavları & Analiz Merkezi</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Genel denemeler, branş denemeleri ve okul/kurumsal karne sonuçlarının kapsamlı analizi.
                  </p>
                </div>

                {/* Sub-Tab Switcher (Genel / Branş / Kurumsal) */}
                <div className="flex items-center space-x-1.5 bg-slate-950/80 p-1.5 rounded-2xl border border-white/10">
                  <button
                    onClick={() => setMockSubTab('general')}
                    className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      mockSubTab === 'general'
                        ? 'bg-sky-600 text-white shadow-md shadow-sky-500/20'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    <span>Genel Denemeler ({mocks.length})</span>
                  </button>
                  <button
                    onClick={() => setMockSubTab('branch')}
                    className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      mockSubTab === 'branch'
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Branş Denemeleri ({branchExams.length})</span>
                  </button>
                  <button
                    onClick={() => setMockSubTab('institutional')}
                    className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      mockSubTab === 'institutional'
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <School className="w-3.5 h-3.5" />
                    <span>Kurumsal Denemeler ({institutionalMocks.length})</span>
                  </button>
                </div>
              </div>

              {/* ------------------------------------------------------------- */}
              {/* SUB-TAB 1: GENEL DENEMELER */}
              {/* ------------------------------------------------------------- */}
              {mockSubTab === 'general' && (() => {
                const tytNets = mocks.map(m => m.tyt?.totalNet || 0).filter(n => n > 0);
                const aytNets = mocks.map(m => m.ayt?.totalNet || 0).filter(n => n > 0);
                const maxTYT = tytNets.length > 0 ? Math.max(...tytNets) : 0;
                const avgTYT = tytNets.length > 0 ? (tytNets.reduce((a, b) => a + b, 0) / tytNets.length).toFixed(1) : '0';
                const maxAYT = aytNets.length > 0 ? Math.max(...aytNets) : 0;
                const avgAYT = aytNets.length > 0 ? (aytNets.reduce((a, b) => a + b, 0) / aytNets.length).toFixed(1) : '0';

                // Chart 1: Net Progression Data
                const netTrendData = [...mocks]
                  .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
                  .slice(-12)
                  .map(m => {
                    const parts = (m.date || '').split('-');
                    const displayDate = parts.length === 3 ? `${parts[2]}/${parts[1]}` : m.date;
                    return {
                      date: m.date,
                      displayDate,
                      title: m.title,
                      tytNet: m.tyt?.totalNet || 0,
                      aytNet: m.ayt?.totalNet || 0,
                      totalNet: ((m.tyt?.totalNet || 0) + (m.ayt?.totalNet || 0)).toFixed(1)
                    };
                  });

                // Chart 2: Estimated Rank Change Progression
                const rankTrendData = [...mocks]
                  .filter(m => m.estimatedRank && m.estimatedRank > 0)
                  .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
                  .slice(-12)
                  .map(m => {
                    const parts = (m.date || '').split('-');
                    const displayDate = parts.length === 3 ? `${parts[2]}/${parts[1]}` : m.date;
                    return {
                      date: m.date,
                      displayDate,
                      title: m.title,
                      rank: m.estimatedRank,
                      tytNet: m.tyt?.totalNet || 0,
                      aytNet: m.ayt?.totalNet || 0
                    };
                  });

                const filteredGeneralMocks = mocks.filter(m => {
                  if (generalMockSearch.trim()) {
                    const q = generalMockSearch.toLowerCase();
                    const matchTitle = (m.title || '').toLowerCase().includes(q);
                    const matchPublisher = (m.publisher || '').toLowerCase().includes(q);
                    if (!matchTitle && !matchPublisher) return false;
                  }
                  if (generalMockTypeFilter === 'TYT' && !(m.tyt?.totalNet && m.tyt.totalNet > 0)) return false;
                  if (generalMockTypeFilter === 'AYT' && !(m.ayt?.totalNet && m.ayt.totalNet > 0)) return false;
                  return true;
                }).sort((a, b) => (b.date || '').localeCompare(a.date || ''));

                const GENERAL_PER_PAGE = 6;
                const totalGeneralPages = Math.ceil(filteredGeneralMocks.length / GENERAL_PER_PAGE) || 1;
                const currentGenPage = Math.min(generalMockPage, totalGeneralPages);
                const paginatedGeneralMocks = filteredGeneralMocks.slice((currentGenPage - 1) * GENERAL_PER_PAGE, currentGenPage * GENERAL_PER_PAGE);

                return (
                  <div className="space-y-6">
                    {/* KPI Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="bg-slate-950/70 border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-400">Toplam Genel Deneme</span>
                          <FileSpreadsheet className="w-4 h-4 text-sky-400" />
                        </div>
                        <div className="mt-2 flex items-baseline gap-1.5">
                          <span className="text-2xl font-black text-white">{mocks.length}</span>
                          <span className="text-xs text-slate-400">sınav</span>
                        </div>
                        <div className="mt-1 text-[10px] text-sky-400/90 font-medium">TYT & AYT Bireysel Denemeler</div>
                      </div>

                      <div className="bg-slate-950/70 border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-400">TYT Net Durumu</span>
                          <TrendingUp className="w-4 h-4 text-indigo-400" />
                        </div>
                        <div className="mt-2 flex items-baseline gap-1.5">
                          <span className="text-2xl font-black text-indigo-400">{maxTYT}</span>
                          <span className="text-xs text-slate-400 font-bold">En Yüksek (Ort: {avgTYT})</span>
                        </div>
                        <div className="mt-1 text-[10px] text-slate-400">Hedef: {profile?.targetTYTNet || 100} Net</div>
                      </div>

                      <div className="bg-slate-950/70 border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-400">AYT Net Durumu</span>
                          <TrendingUp className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div className="mt-2 flex items-baseline gap-1.5">
                          <span className="text-2xl font-black text-emerald-400">{maxAYT}</span>
                          <span className="text-xs text-slate-400 font-bold">En Yüksek (Ort: {avgAYT})</span>
                        </div>
                        <div className="mt-1 text-[10px] text-slate-400">Hedef: {profile?.targetAYTNet || 75} Net</div>
                      </div>

                      <div className="bg-slate-950/70 border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-400">Tahmini Başarı Sırası</span>
                          <Trophy className="w-4 h-4 text-amber-400" />
                        </div>
                        <div className="mt-2 flex items-baseline gap-1.5">
                          <span className="text-2xl font-black text-amber-400">
                            {mocks[0]?.estimatedRank ? `#${mocks[0].estimatedRank.toLocaleString('tr-TR')}` : 'Hesaplanıyor'}
                          </span>
                        </div>
                        <div className="mt-1 text-[10px] text-amber-400/80 font-medium">Hedef: #{profile?.targetRank?.toLocaleString('tr-TR') || 20000}</div>
                      </div>
                    </div>

                    {/* Analytics Charts */}
                    {mocks.length > 0 && (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Chart 1: Net Progression */}
                        <div className="bg-slate-950/80 border border-white/10 rounded-3xl p-5 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <TrendingUp className="w-4 h-4 text-sky-400" />
                              <h4 className="text-xs font-bold text-white">TYT & AYT Net İlerleme Grafiği</h4>
                            </div>
                            <div className="flex items-center space-x-3 text-[10px] font-bold">
                              <span className="flex items-center space-x-1 text-indigo-400">
                                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                                <span>TYT Net</span>
                              </span>
                              <span className="flex items-center space-x-1 text-emerald-400">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                                <span>AYT Net</span>
                              </span>
                            </div>
                          </div>

                          <div className="h-48 w-full pt-2">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={netTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                  <linearGradient id="tytGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                  </linearGradient>
                                  <linearGradient id="aytGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                                <XAxis dataKey="displayDate" stroke="#94a3b8" fontSize={10} tickLine={false} />
                                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                                <Tooltip
                                  contentStyle={{ backgroundColor: '#090d16', borderColor: '#ffffff20', borderRadius: '12px', fontSize: '11px', color: '#fff' }}
                                  formatter={(val: any, name: any) => [
                                    `${val} Net`,
                                    name === 'tytNet' ? 'TYT Net' : name === 'aytNet' ? 'AYT Net' : 'Net'
                                  ]}
                                  labelFormatter={(l: any, payload: any) => {
                                    const item = payload && payload[0]?.payload;
                                    return item ? `${item.title} (${item.date})` : `${l}`;
                                  }}
                                />
                                <Area type="monotone" dataKey="tytNet" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#tytGrad)" name="tytNet" />
                                <Area type="monotone" dataKey="aytNet" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#aytGrad)" name="aytNet" />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        {/* Chart 2: Estimated Rank Change Progression */}
                        <div className="bg-slate-950/80 border border-white/10 rounded-3xl p-5 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Trophy className="w-4 h-4 text-amber-400" />
                              <h4 className="text-xs font-bold text-white">Tahmini YKS Sıralama Değişim Trendi</h4>
                            </div>
                            <span className="text-[10px] text-amber-300 font-mono bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                              Hedef: #{profile?.targetRank?.toLocaleString('tr-TR') || '20.000'}
                            </span>
                          </div>

                          <div className="h-48 w-full pt-2">
                            {rankTrendData.length === 0 ? (
                              <div className="h-full flex items-center justify-center text-xs text-slate-500 italic">
                                Sıralama hesabı yapılan deneme kaydı henüz yok.
                              </div>
                            ) : (
                              <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={rankTrendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                                  <XAxis dataKey="displayDate" stroke="#94a3b8" fontSize={10} tickLine={false} />
                                  <YAxis 
                                    stroke="#94a3b8" 
                                    fontSize={10} 
                                    tickLine={false} 
                                    reversed={true}
                                    tickFormatter={(v) => `#${(v >= 1000 ? `${Math.round(v / 1000)}k` : v)}`}
                                  />
                                  <Tooltip
                                    contentStyle={{ backgroundColor: '#090d16', borderColor: '#ffffff20', borderRadius: '12px', fontSize: '11px', color: '#fff' }}
                                    formatter={(val: any, name: any, item: any) => [
                                      `#${Number(val).toLocaleString('tr-TR')} (TYT: ${item.payload.tytNet}N, AYT: ${item.payload.aytNet}N)`,
                                      'Tahmini Başarı Sırası'
                                    ]}
                                    labelFormatter={(l: any, payload: any) => {
                                      const item = payload && payload[0]?.payload;
                                      return item ? `${item.title} (${item.date})` : `${l}`;
                                    }}
                                  />
                                  <Line 
                                    type="monotone" 
                                    dataKey="rank" 
                                    stroke="#f59e0b" 
                                    strokeWidth={3} 
                                    dot={{ r: 4, fill: '#f59e0b', strokeWidth: 2, stroke: '#fff' }} 
                                    activeDot={{ r: 6, fill: '#fbbf24' }} 
                                    name="rank" 
                                  />
                                </LineChart>
                              </ResponsiveContainer>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Toolbar: Search & Filters & View Mode */}
                    <div className="bg-slate-950/80 border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="relative flex-1">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={generalMockSearch}
                          onChange={(e) => {
                            setGeneralMockSearch(e.target.value);
                            setGeneralMockPage(1);
                          }}
                          placeholder="Deneme adı veya yayıncıda ara..."
                          className="w-full bg-slate-900/90 border border-white/10 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500/50 transition-colors"
                        />
                        {generalMockSearch && (
                          <button
                            onClick={() => {
                              setGeneralMockSearch('');
                              setGeneralMockPage(1);
                            }}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs px-1"
                          >
                            ✕
                          </button>
                        )}
                      </div>

                      <div className="flex items-center space-x-2.5 flex-wrap">
                        {/* Type Filters */}
                        <div className="flex items-center space-x-1.5 bg-slate-900/90 p-1 rounded-xl border border-white/10 shrink-0">
                          <button
                            onClick={() => {
                              setGeneralMockTypeFilter('all');
                              setGeneralMockPage(1);
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                              generalMockTypeFilter === 'all' ? 'bg-sky-600 text-white font-bold shadow-md shadow-sky-500/20' : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            Tüm Sınavlar
                          </button>
                          <button
                            onClick={() => {
                              setGeneralMockTypeFilter('TYT');
                              setGeneralMockPage(1);
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                              generalMockTypeFilter === 'TYT' ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-500/20' : 'text-slate-400 hover:text-indigo-400'
                            }`}
                          >
                            TYT İçerenler
                          </button>
                          <button
                            onClick={() => {
                              setGeneralMockTypeFilter('AYT');
                              setGeneralMockPage(1);
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                              generalMockTypeFilter === 'AYT' ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-500/20' : 'text-slate-400 hover:text-emerald-400'
                            }`}
                          >
                            AYT İçerenler
                          </button>
                        </div>

                        {/* View Mode Toggle */}
                        <div className="flex items-center space-x-1 bg-slate-900/90 p-1 rounded-xl border border-white/10 shrink-0">
                          <button
                            type="button"
                            onClick={() => setGeneralMockViewMode('cards')}
                            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                              generalMockViewMode === 'cards' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                            }`}
                            title="Kart Görünümü"
                          >
                            <LayoutGrid className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setGeneralMockViewMode('table')}
                            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                              generalMockViewMode === 'table' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                            }`}
                            title="Detaylı Liste / Tablo Görünümü"
                          >
                            <Table className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Mocks Grid Cards OR Table */}
                    {filteredGeneralMocks.length === 0 ? (
                      <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl space-y-2">
                        <FileSpreadsheet className="w-8 h-8 text-slate-500 mx-auto" />
                        <p className="text-xs text-slate-400">Eşleşen genel deneme sınavı kaydı bulunamadı.</p>
                      </div>
                    ) : generalMockViewMode === 'cards' ? (
                      /* CARD VIEW */
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {paginatedGeneralMocks.map((mock) => {
                          const tytNet = mock.tyt?.totalNet || 0;
                          const aytNet = mock.ayt?.totalNet || 0;

                          return (
                            <div
                              key={mock.id}
                              className="bg-slate-950/80 border border-white/10 hover:border-sky-500/40 rounded-2xl p-4 space-y-3 shadow-xl transition-all"
                            >
                              {/* Top Row: Title & Date */}
                              <div className="flex items-start justify-between gap-2">
                                <div className="space-y-0.5">
                                  <h4 className="text-sm font-bold text-white leading-tight">
                                    {mock.title}
                                  </h4>
                                  {mock.publisher && (
                                    <span className="text-[11px] text-slate-400 font-medium">
                                      {mock.publisher}
                                    </span>
                                  )}
                                </div>
                                <span className="text-[11px] text-slate-400 font-mono bg-white/5 px-2 py-0.5 rounded-lg border border-white/10 shrink-0 flex items-center space-x-1">
                                  <Calendar className="w-3 h-3 text-slate-500" />
                                  <span>{mock.date}</span>
                                </span>
                              </div>

                              {/* Net Highlights */}
                              <div className="grid grid-cols-3 gap-2 bg-slate-900/90 p-2.5 rounded-xl border border-white/5 font-mono text-center">
                                <div>
                                  <span className="text-[10px] text-indigo-400 font-sans block">TYT Net</span>
                                  <span className="text-base font-black text-indigo-300">{tytNet > 0 ? `${tytNet} Net` : '-'}</span>
                                </div>
                                <div>
                                  <span className="text-[10px] text-emerald-400 font-sans block">AYT Net</span>
                                  <span className="text-base font-black text-emerald-300">{aytNet > 0 ? `${aytNet} Net` : '-'}</span>
                                </div>
                                <div>
                                  <span className="text-[10px] text-amber-400 font-sans block">Tahmini Sıra</span>
                                  <span className="text-sm font-black text-amber-300">
                                    {mock.estimatedRank ? `#${mock.estimatedRank.toLocaleString('tr-TR')}` : '-'}
                                  </span>
                                </div>
                              </div>

                              {/* Subject Breakdown Badges */}
                              {mock.tyt && (
                                <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[10px] font-mono border-t border-white/5">
                                  <span className="text-slate-500 font-sans">TYT Detay:</span>
                                  {mock.tyt.turkishNet !== undefined && (
                                    <span className="bg-pink-500/15 text-pink-300 px-1.5 py-0.5 rounded border border-pink-500/20">
                                      TR: {mock.tyt.turkishNet}
                                    </span>
                                  )}
                                  {mock.tyt.mathNet !== undefined && (
                                    <span className="bg-indigo-500/15 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-500/20">
                                      MAT: {mock.tyt.mathNet}
                                    </span>
                                  )}
                                  {mock.tyt.scienceNet !== undefined && (
                                    <span className="bg-emerald-500/15 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/20">
                                      FEN: {mock.tyt.scienceNet}
                                    </span>
                                  )}
                                  {mock.tyt.socialNet !== undefined && (
                                    <span className="bg-amber-500/15 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/20">
                                      SOS: {mock.tyt.socialNet}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      /* TABLE VIEW */
                      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/80 shadow-xl">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-white/10 bg-slate-900/90 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                              <th className="py-3 px-4">Sınav Adı & Yayın</th>
                              <th className="py-3 px-4">Tarih</th>
                              <th className="py-3 px-4 text-center">TYT Net</th>
                              <th className="py-3 px-4 text-center">AYT Net</th>
                              <th className="py-3 px-4 text-center">Toplam Net</th>
                              <th className="py-3 px-4 text-center">Tahmini Sıra</th>
                              <th className="py-3 px-4 text-right">Puan</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5 font-mono">
                            {paginatedGeneralMocks.map(mock => {
                              const tytNet = mock.tyt?.totalNet || 0;
                              const aytNet = mock.ayt?.totalNet || 0;
                              const totalNet = (tytNet + aytNet).toFixed(2);
                              return (
                                <tr key={mock.id} className="hover:bg-white/5 transition-colors">
                                  <td className="py-3 px-4">
                                    <div className="font-bold text-white font-sans text-xs">{mock.title}</div>
                                    <div className="text-[10px] text-slate-400 font-sans">{mock.publisher || 'Bireysel Deneme'}</div>
                                  </td>
                                  <td className="py-3 px-4 text-slate-400 text-[11px] whitespace-nowrap">{mock.date}</td>
                                  <td className="py-3 px-4 text-center">
                                    {tytNet > 0 ? (
                                      <span className="font-black text-indigo-300">{tytNet} Net</span>
                                    ) : (
                                      <span className="text-slate-600">-</span>
                                    )}
                                  </td>
                                  <td className="py-3 px-4 text-center">
                                    {aytNet > 0 ? (
                                      <span className="font-black text-emerald-300">{aytNet} Net</span>
                                    ) : (
                                      <span className="text-slate-600">-</span>
                                    )}
                                  </td>
                                  <td className="py-3 px-4 text-center">
                                    <span className="font-black text-sky-400">{totalNet} Net</span>
                                  </td>
                                  <td className="py-3 px-4 text-center">
                                    {mock.estimatedRank ? (
                                      <span className="text-amber-400 font-bold">#{mock.estimatedRank.toLocaleString('tr-TR')}</span>
                                    ) : (
                                      <span className="text-slate-600">-</span>
                                    )}
                                  </td>
                                  <td className="py-3 px-4 text-right text-amber-300 font-bold">
                                    {mock.score ? `${mock.score.toFixed(1)} P` : '-'}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Pagination Bar */}
                    {filteredGeneralMocks.length > GENERAL_PER_PAGE && (
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-white/10 text-xs">
                        <span className="text-slate-400 font-medium">
                          Toplam <strong className="text-white font-mono">{filteredGeneralMocks.length}</strong> sınavdan{' '}
                          <strong className="text-white font-mono">
                            {(currentGenPage - 1) * GENERAL_PER_PAGE + 1}-{Math.min(currentGenPage * GENERAL_PER_PAGE, filteredGeneralMocks.length)}
                          </strong>{' '}
                          arası gösteriliyor
                        </span>

                        <div className="flex items-center space-x-1.5">
                          <button
                            type="button"
                            onClick={() => setGeneralMockPage(Math.max(1, currentGenPage - 1))}
                            disabled={currentGenPage === 1}
                            className="p-1.5 rounded-lg border border-white/10 bg-slate-900/90 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                            title="Önceki Sayfa"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>

                          {Array.from({ length: totalGeneralPages }, (_, i) => i + 1).map((pageNum) => (
                            <button
                              key={pageNum}
                              type="button"
                              onClick={() => setGeneralMockPage(pageNum)}
                              className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer font-mono ${
                                currentGenPage === pageNum
                                  ? 'bg-sky-600 text-white shadow-md shadow-sky-500/20'
                                  : 'bg-slate-900/90 border border-white/10 text-slate-400 hover:text-white hover:border-white/20'
                              }`}
                            >
                              {pageNum}
                            </button>
                          ))}

                          <button
                            type="button"
                            onClick={() => setGeneralMockPage(Math.min(totalGeneralPages, currentGenPage + 1))}
                            disabled={currentGenPage === totalGeneralPages}
                            className="p-1.5 rounded-lg border border-white/10 bg-slate-900/90 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                            title="Sonraki Sayfa"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* ------------------------------------------------------------- */}
              {/* SUB-TAB 2: BRANŞ DENEMELERİ */}
              {/* ------------------------------------------------------------- */}
              {mockSubTab === 'branch' && (() => {
                const sortedBranchExams = [...branchExams].sort((a, b) => {
                  if (teacherSubj) {
                    const aMatch = (a.subject || '').toLowerCase().includes(teacherSubj) || teacherSubj.includes((a.subject || '').toLowerCase());
                    const bMatch = (b.subject || '').toLowerCase().includes(teacherSubj) || teacherSubj.includes((b.subject || '').toLowerCase());
                    if (aMatch && !bMatch) return -1;
                    if (!aMatch && bMatch) return 1;
                  }
                  return (b.date || '').localeCompare(a.date || '');
                });

                const branchSubjects = ['all', ...Array.from(new Set(branchExams.map(b => b.subject).filter(Boolean)))];

                // KPI calculations
                const totalBranchCount = branchExams.length;
                const avgBranchNet = totalBranchCount > 0 ? (branchExams.reduce((acc, b) => acc + (b.net || 0), 0) / totalBranchCount).toFixed(1) : 0;
                const teacherBranchExams = teacherSubj ? branchExams.filter(b => (b.subject || '').toLowerCase().includes(teacherSubj)) : [];

                // Chart: Subject Breakdown in Branch Exams
                const branchSubjectMap: Record<string, { subject: string; count: number; totalNet: number; avgNet: number }> = {};
                branchExams.forEach(b => {
                  const s = b.subject || 'Diğer';
                  if (!branchSubjectMap[s]) {
                    branchSubjectMap[s] = { subject: s, count: 0, totalNet: 0, avgNet: 0 };
                  }
                  branchSubjectMap[s].count += 1;
                  branchSubjectMap[s].totalNet += (b.net || 0);
                });

                const branchChartData = Object.values(branchSubjectMap)
                  .map(s => ({
                    ...s,
                    avgNet: Number((s.totalNet / s.count).toFixed(1))
                  }))
                  .sort((a, b) => b.count - a.count);

                const filteredBranchExams = sortedBranchExams.filter(ex => {
                  if (branchMockSubjectFilter !== 'all' && ex.subject !== branchMockSubjectFilter) return false;
                  if (branchMockSearch.trim()) {
                    const q = branchMockSearch.toLowerCase();
                    const matchSubj = (ex.subject || '').toLowerCase().includes(q);
                    const matchPub = (ex.publisher || '').toLowerCase().includes(q);
                    if (!matchSubj && !matchPub) return false;
                  }
                  return true;
                });

                    const BRANCH_PER_PAGE = 6;
                    const totalBranchPages = Math.ceil(filteredBranchExams.length / BRANCH_PER_PAGE) || 1;
                    const currentBrPage = Math.min(branchExamPage, totalBranchPages);
                    const paginatedBranchExams = filteredBranchExams.slice((currentBrPage - 1) * BRANCH_PER_PAGE, currentBrPage * BRANCH_PER_PAGE);

                    return (
                      <div className="space-y-6">
                        {/* KPI Metrics */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div className="bg-slate-950/70 border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-slate-400">Toplam Branş Denemesi</span>
                              <Layers className="w-4 h-4 text-purple-400" />
                            </div>
                            <div className="mt-2 flex items-baseline gap-1.5">
                              <span className="text-2xl font-black text-white">{totalBranchCount}</span>
                              <span className="text-xs text-slate-400">deneme</span>
                            </div>
                            <div className="mt-1 text-[10px] text-purple-400/90 font-medium">{branchSubjects.length - 1} farklı derste</div>
                          </div>

                          <div className="bg-slate-950/70 border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-slate-400">Ortalama Branş Neti</span>
                              <Target className="w-4 h-4 text-indigo-400" />
                            </div>
                            <div className="mt-2 flex items-baseline gap-1.5">
                              <span className="text-2xl font-black text-indigo-400">{avgBranchNet}</span>
                              <span className="text-xs text-slate-400 font-bold">Net</span>
                            </div>
                            <div className="mt-1 text-[10px] text-slate-400">Tüm branş denemeleri ortalaması</div>
                          </div>

                          <div className="bg-slate-950/70 border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-slate-400">Branşınızdaki Denemeler</span>
                              <Sparkles className="w-4 h-4 text-amber-400" />
                            </div>
                            <div className="mt-2 flex items-baseline gap-1.5">
                              <span className="text-2xl font-black text-amber-400">{teacherBranchExams.length}</span>
                              <span className="text-xs text-slate-400">deneme</span>
                            </div>
                            <div className="mt-1 text-[10px] text-amber-400/80 font-medium">
                              {teacher.subject ? `${teacher.subject} Alanınız` : 'Branş Seçilmedi'}
                            </div>
                          </div>

                          <div className="bg-slate-950/70 border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-slate-400">En Çok Çözülen Ders</span>
                              <Award className="w-4 h-4 text-emerald-400" />
                            </div>
                            <div className="mt-2 flex items-baseline gap-1.5 truncate">
                              <span className="text-lg font-black text-emerald-400 truncate">
                                {branchChartData[0]?.subject || '-'}
                              </span>
                              {branchChartData[0] && (
                                <span className="text-xs text-slate-400">({branchChartData[0].count} Adet)</span>
                              )}
                            </div>
                            <div className="mt-1 text-[10px] text-slate-500 font-medium">Lider branş denemesi</div>
                          </div>
                        </div>

                        {/* Chart: Branch Exams Distribution */}
                        {branchExams.length > 0 && (
                          <div className="bg-slate-950/80 border border-white/10 rounded-3xl p-5 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <BarChart3 className="w-4 h-4 text-purple-400" />
                                <h4 className="text-xs font-bold text-white">Ders Bazlı Branş Deneme Çözüm ve Net Ortalamaları</h4>
                              </div>
                              <span className="text-[10px] text-slate-400 font-mono">Ders Dağılımı</span>
                            </div>

                            <div className="h-48 w-full pt-2">
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={branchChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                                  <XAxis dataKey="subject" stroke="#94a3b8" fontSize={10} tickLine={false} />
                                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                                  <Tooltip
                                    contentStyle={{ backgroundColor: '#090d16', borderColor: '#ffffff20', borderRadius: '12px', fontSize: '11px', color: '#fff' }}
                                    formatter={(val: any, name: any) => [
                                      name === 'count' ? `${val} Deneme` : `${val} Net`,
                                      name === 'count' ? 'Çözülen Deneme Sayısı' : 'Ortalama Net'
                                    ]}
                                  />
                                  <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={32} name="count">
                                    {branchChartData.map((entry, index) => {
                                      const isMyBranch = teacherSubj && entry.subject.toLowerCase().includes(teacherSubj);
                                      return (
                                        <Cell 
                                          key={`cell-branch-${index}`} 
                                          fill={isMyBranch ? '#f59e0b' : '#a855f7'} 
                                        />
                                      );
                                    })}
                                  </Bar>
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                        )}

                        {/* Toolbar: Search, Subject Filters & View Mode */}
                        <div className="bg-slate-950/80 border border-white/10 rounded-2xl p-4 space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="relative flex-1">
                              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                              <input
                                type="text"
                                value={branchMockSearch}
                                onChange={(e) => {
                                  setBranchMockSearch(e.target.value);
                                  setBranchExamPage(1);
                                }}
                                placeholder="Ders adı veya yayınevinde ara..."
                                className="w-full bg-slate-900/90 border border-white/10 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 transition-colors"
                              />
                              {branchMockSearch && (
                                <button
                                  onClick={() => {
                                    setBranchMockSearch('');
                                    setBranchExamPage(1);
                                  }}
                                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs px-1"
                                >
                                  ✕
                                </button>
                              )}
                            </div>

                            {/* View Mode Toggle */}
                            <div className="flex items-center space-x-1 bg-slate-900/90 p-1 rounded-xl border border-white/10 shrink-0 self-end sm:self-auto">
                              <button
                                type="button"
                                onClick={() => setBranchExamViewMode('cards')}
                                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                                  branchExamViewMode === 'cards' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                                }`}
                                title="Kart Görünümü"
                              >
                                <LayoutGrid className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setBranchExamViewMode('table')}
                                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                                  branchExamViewMode === 'table' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                                }`}
                                title="Detaylı Liste / Tablo Görünümü"
                              >
                                <Table className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {branchSubjects.length > 2 && (
                            <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-white/5">
                              <span className="text-[11px] font-bold text-slate-400 mr-1 flex items-center gap-1">
                                <Filter className="w-3 h-3 text-purple-400" /> Ders:
                              </span>
                              {branchSubjects.map(subj => {
                                const isMyBranch = teacherSubj && subj.toLowerCase().includes(teacherSubj);
                                return (
                                  <button
                                    key={subj}
                                    onClick={() => {
                                      setBranchMockSubjectFilter(subj);
                                      setBranchExamPage(1);
                                    }}
                                    className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all cursor-pointer flex items-center space-x-1 ${
                                      branchMockSubjectFilter === subj
                                        ? 'bg-purple-600 text-white font-bold'
                                        : isMyBranch
                                        ? 'bg-amber-500/10 text-amber-200 border-amber-500/20 hover:bg-amber-500/20'
                                        : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10 hover:text-slate-300'
                                    }`}
                                  >
                                    <span>{subj === 'all' ? 'Tüm Dersler' : subj}</span>
                                    {isMyBranch && <span className="text-[9px] text-amber-300 font-bold">⭐</span>}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Branch Exams Cards OR Table */}
                        {filteredBranchExams.length === 0 ? (
                          <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl space-y-2">
                            <Layers className="w-8 h-8 text-slate-500 mx-auto" />
                            <p className="text-xs text-slate-400">Eşleşen branş denemesi kaydı bulunamadı.</p>
                          </div>
                        ) : branchExamViewMode === 'cards' ? (
                          /* CARD VIEW */
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                            {paginatedBranchExams.map((ex) => {
                              const isMyBranch = teacherSubj && (ex.subject || '').toLowerCase().includes(teacherSubj);
                              return (
                                <div
                                  key={ex.id}
                                  className={`p-4 rounded-2xl border transition-all space-y-2.5 ${
                                    isMyBranch
                                      ? 'bg-amber-950/20 border-amber-500/40 hover:border-amber-500/60 shadow-md shadow-amber-500/5'
                                      : 'bg-slate-950/80 border-white/10 hover:border-white/20'
                                  }`}
                                >
                                  {/* Top Row: Subject & Publisher */}
                                  <div className="flex items-start justify-between gap-2">
                                    <div>
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="text-xs font-black text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded-lg border border-purple-500/30">
                                          {ex.subject}
                                        </span>
                                        {isMyBranch && (
                                          <span className="text-[9px] bg-amber-500/30 text-amber-200 px-1.5 py-0.5 rounded border border-amber-400/40 font-bold">
                                            Branşınız ⭐
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-xs font-bold text-white mt-1">
                                        {ex.publisher || 'Branş Denemesi'}
                                      </div>
                                    </div>

                                    <span className="text-xs font-black text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded-lg border border-purple-500/20">
                                      {ex.net} Net
                                    </span>
                                  </div>

                                  {/* Stats Row */}
                                  <div className="flex items-center justify-between text-xs font-mono bg-slate-900/90 p-2 rounded-xl border border-white/5">
                                    <span className="text-emerald-400 font-bold">{ex.correct} Doğru</span>
                                    <span className="text-rose-400 font-bold">{ex.wrong} Yanlış</span>
                                    <span className="text-slate-400">{ex.empty} Boş</span>
                                  </div>

                                  {/* Footer */}
                                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium pt-0.5">
                                    <span className="flex items-center space-x-1">
                                      <Calendar className="w-3 h-3 text-slate-500" />
                                      <span>{ex.date}</span>
                                    </span>
                                    {ex.duration ? (
                                      <span className="flex items-center space-x-1 text-purple-400 font-mono">
                                        <Clock className="w-3 h-3" />
                                        <span>{ex.duration} dk</span>
                                      </span>
                                    ) : null}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          /* TABLE VIEW */
                          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/80 shadow-xl">
                            <table className="w-full text-left text-xs border-collapse">
                              <thead>
                                <tr className="border-b border-white/10 bg-slate-900/90 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                                  <th className="py-3 px-4">Ders</th>
                                  <th className="py-3 px-4">Yayın / Deneme</th>
                                  <th className="py-3 px-4">Tarih</th>
                                  <th className="py-3 px-4 text-center">D / Y / B</th>
                                  <th className="py-3 px-4 text-center">Net</th>
                                  <th className="py-3 px-4 text-center">Başarı Oranı</th>
                                  <th className="py-3 px-4 text-right">Süre</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-white/5 font-mono">
                                {paginatedBranchExams.map(ex => {
                                  const isMyBranch = teacherSubj && (ex.subject || '').toLowerCase().includes(teacherSubj);
                                  const totalQ = (ex.correct || 0) + (ex.wrong || 0) + (ex.empty || 0);
                                  const acc = totalQ > 0 ? Math.round(((ex.correct || 0) / totalQ) * 100) : 0;
                                  return (
                                    <tr key={ex.id} className={`hover:bg-white/5 transition-colors ${isMyBranch ? 'bg-amber-500/5' : ''}`}>
                                      <td className="py-3 px-4">
                                        <div className="flex items-center gap-1.5">
                                          <span className="font-bold text-purple-300 font-sans text-xs">{ex.subject}</span>
                                          {isMyBranch && <span className="text-[9px] text-amber-300 bg-amber-500/20 px-1.5 py-0.5 rounded font-bold font-sans">⭐ Branşınız</span>}
                                        </div>
                                      </td>
                                      <td className="py-3 px-4 text-white font-sans text-xs">{ex.publisher || 'Branş Denemesi'}</td>
                                      <td className="py-3 px-4 text-slate-400 text-[11px] whitespace-nowrap">{ex.date}</td>
                                      <td className="py-3 px-4 text-center">
                                        <span className="text-emerald-400 font-bold">{ex.correct}D</span>{' '}
                                        <span className="text-rose-400 font-bold">{ex.wrong}Y</span>{' '}
                                        <span className="text-slate-400">{ex.empty}B</span>
                                      </td>
                                      <td className="py-3 px-4 text-center">
                                        <span className="font-black text-purple-300 text-sm">{ex.net} Net</span>
                                      </td>
                                      <td className="py-3 px-4 text-center">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                          acc >= 80 ? 'bg-emerald-500/20 text-emerald-300' : acc >= 50 ? 'bg-indigo-500/20 text-indigo-300' : 'bg-rose-500/20 text-rose-300'
                                        }`}>
                                          %{acc}
                                        </span>
                                      </td>
                                      <td className="py-3 px-4 text-right text-slate-400 text-xs">
                                        {ex.duration ? `${ex.duration} dk` : '-'}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {/* Pagination Bar */}
                        {filteredBranchExams.length > BRANCH_PER_PAGE && (
                          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-white/10 text-xs">
                            <span className="text-slate-400 font-medium">
                              Toplam <strong className="text-white font-mono">{filteredBranchExams.length}</strong> sınavdan{' '}
                              <strong className="text-white font-mono">
                                {(currentBrPage - 1) * BRANCH_PER_PAGE + 1}-{Math.min(currentBrPage * BRANCH_PER_PAGE, filteredBranchExams.length)}
                              </strong>{' '}
                              arası gösteriliyor
                            </span>

                            <div className="flex items-center space-x-1.5">
                              <button
                                type="button"
                                onClick={() => setBranchExamPage(Math.max(1, currentBrPage - 1))}
                                disabled={currentBrPage === 1}
                                className="p-1.5 rounded-lg border border-white/10 bg-slate-900/90 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                                title="Önceki Sayfa"
                              >
                                <ChevronLeft className="w-4 h-4" />
                              </button>

                              {Array.from({ length: totalBranchPages }, (_, i) => i + 1).map((pageNum) => (
                                <button
                                  key={pageNum}
                                  type="button"
                                  onClick={() => setBranchExamPage(pageNum)}
                                  className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer font-mono ${
                                    currentBrPage === pageNum
                                      ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
                                      : 'bg-slate-900/90 border border-white/10 text-slate-400 hover:text-white hover:border-white/20'
                                  }`}
                                >
                                  {pageNum}
                                </button>
                              ))}

                              <button
                                type="button"
                                onClick={() => setBranchExamPage(Math.min(totalBranchPages, currentBrPage + 1))}
                                disabled={currentBrPage === totalBranchPages}
                                className="p-1.5 rounded-lg border border-white/10 bg-slate-900/90 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                                title="Sonraki Sayfa"
                              >
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}

              {/* ------------------------------------------------------------- */}
              {/* SUB-TAB 3: KURUMSAL DENEMELER (KARNELER) */}
              {/* ------------------------------------------------------------- */}
              {mockSubTab === 'institutional' && (() => {
                const extractInstStats = (exam: InstitutionalMockExam) => {
                  if (!exam) return {
                    totalNet: 0,
                    totalCorrect: 0,
                    totalWrong: 0,
                    totalEmpty: 0,
                    totalQuestions: 0,
                    score: 0,
                    scoreType: 'SAY',
                    schoolRank: undefined as number | undefined,
                    schoolTotal: undefined as number | undefined,
                    classRank: undefined as number | undefined,
                    classTotal: undefined as number | undefined,
                    generalRank: undefined as number | undefined,
                    generalTotal: undefined as number | undefined,
                    subjects: [] as InstitutionalSubjectDetail[]
                  };

                  const subjects = exam.subjects || [];
                  let totalNet = 0;
                  let totalCorrect = 0;
                  let totalWrong = 0;
                  let totalQuestions = 0;

                  subjects.forEach(s => {
                    const net = s.net !== undefined ? s.net : (s.correct - (s.wrong || 0) * 0.25);
                    totalNet += net;
                    totalCorrect += (s.correct || 0);
                    totalWrong += (s.wrong || 0);
                    totalQuestions += (s.questionCount || (s.correct + s.wrong + (s.empty || 0)));
                  });

                  const totalEmpty = Math.max(0, totalQuestions - (totalCorrect + totalWrong));

                  const scores = exam.scores || {};
                  let score = scores.sayScore || 0;
                  let scoreType = 'SAY';
                  let schoolRank = scores.sayInstitutionRank;
                  let schoolTotal = scores.sayInstitutionTotal;
                  let classRank = scores.sayClassRank;
                  let classTotal = scores.sayClassTotal;
                  let generalRank = scores.sayGeneralRank;
                  let generalTotal = scores.sayGeneralTotal;

                  if ((scores.eaScore || 0) > score) {
                    score = scores.eaScore || 0;
                    scoreType = 'EA';
                    schoolRank = scores.eaInstitutionRank;
                    schoolTotal = scores.eaInstitutionTotal;
                    classRank = scores.eaClassRank;
                    classTotal = scores.eaClassTotal;
                    generalRank = scores.eaGeneralRank;
                    generalTotal = scores.eaGeneralTotal;
                  }
                  if ((scores.sozScore || 0) > score) {
                    score = scores.sozScore || 0;
                    scoreType = 'SÖZ';
                    schoolRank = scores.sozInstitutionRank;
                    schoolTotal = scores.sozInstitutionTotal;
                    classRank = scores.sozClassRank;
                    classTotal = scores.sozClassTotal;
                    generalRank = scores.sozGeneralRank;
                    generalTotal = scores.sozGeneralTotal;
                  }

                  // Fallbacks for participant counts if specific area total is not set
                  if (!schoolTotal && scores.institutionParticipantCount) {
                    schoolTotal = scores.institutionParticipantCount;
                  }
                  if (!classTotal && scores.classParticipantCount) {
                    classTotal = scores.classParticipantCount;
                  }
                  if (!generalTotal && scores.generalParticipantCount) {
                    generalTotal = scores.generalParticipantCount;
                  }

                  // Flat field fallbacks if present in legacy records
                  if (!schoolRank && (exam as any).schoolRank) schoolRank = (exam as any).schoolRank;
                  if (!generalRank && (exam as any).generalRank) generalRank = (exam as any).generalRank;
                  if (!classRank && (exam as any).classRank) classRank = (exam as any).classRank;
                  if (!schoolTotal && (exam as any).schoolTotalCount) schoolTotal = (exam as any).schoolTotalCount;
                  if (!generalTotal && (exam as any).generalTotalCount) generalTotal = (exam as any).generalTotalCount;
                  if (score === 0 && (exam as any).score) score = (exam as any).score;
                  if (totalNet === 0 && (exam as any).totalNet) totalNet = (exam as any).totalNet;

                  return {
                    totalNet: Number(totalNet.toFixed(2)),
                    totalCorrect,
                    totalWrong,
                    totalEmpty,
                    totalQuestions,
                    score: Number(score.toFixed(1)),
                    scoreType,
                    schoolRank,
                    schoolTotal,
                    classRank,
                    classTotal,
                    generalRank,
                    generalTotal,
                    subjects
                  };
                };

                const totalInstCount = institutionalMocks.length;
                const sortedInstMocks = [...institutionalMocks].sort((a, b) => (b.examDate || '').localeCompare(a.examDate || ''));
                const latestExam = sortedInstMocks[0];
                const latestStats = latestExam ? extractInstStats(latestExam) : null;

                // Find best ranks across all exams
                const allStats = institutionalMocks.map(ex => ({ exam: ex, stats: extractInstStats(ex) }));
                const validSchoolRanks = allStats.filter(s => s.stats.schoolRank && s.stats.schoolRank > 0);
                const bestSchoolItem = validSchoolRanks.length > 0 
                  ? validSchoolRanks.reduce((min, cur) => (cur.stats.schoolRank! < min.stats.schoolRank! ? cur : min))
                  : null;

                const validGeneralRanks = allStats.filter(s => s.stats.generalRank && s.stats.generalRank > 0);
                const bestGeneralItem = validGeneralRanks.length > 0
                  ? validGeneralRanks.reduce((min, cur) => (cur.stats.generalRank! < min.stats.generalRank! ? cur : min))
                  : null;

                // Chart: Trend of institutional exam scores
                const instTrendData = [...institutionalMocks]
                  .sort((a, b) => (a.examDate || '').localeCompare(b.examDate || ''))
                  .slice(-10)
                  .map(ex => {
                    const parts = (ex.examDate || '').split('-');
                    const displayDate = parts.length === 3 ? `${parts[2]}/${parts[1]}` : ex.examDate;
                    const st = extractInstStats(ex);
                    return {
                      date: ex.examDate,
                      displayDate,
                      title: ex.examTitle || (ex as any).title,
                      totalNet: st.totalNet,
                      score: st.score,
                      schoolRank: st.schoolRank || 0,
                      generalRank: st.generalRank || 0
                    };
                  });

                const filteredInstMocks = sortedInstMocks.filter(ex => {
                  if (institutionalMockSearch.trim()) {
                    const q = institutionalMockSearch.toLowerCase();
                    const matchTitle = (ex.examTitle || (ex as any).title || '').toLowerCase().includes(q);
                    const matchPub = (ex.createdByName || (ex as any).publisher || '').toLowerCase().includes(q);
                    if (!matchTitle && !matchPub) return false;
                  }
                  if (institutionalMockTypeFilter === 'TYT' && ex.examType !== 'TYT') return false;
                  if (institutionalMockTypeFilter === 'AYT' && ex.examType !== 'AYT') return false;
                  return true;
                });

                const INST_PER_PAGE = 6;
                const totalInstPages = Math.ceil(filteredInstMocks.length / INST_PER_PAGE) || 1;
                const currentInstPage = Math.min(institutionalMockPage, totalInstPages);
                const paginatedInstMocks = filteredInstMocks.slice((currentInstPage - 1) * INST_PER_PAGE, currentInstPage * INST_PER_PAGE);

                return (
                  <div className="space-y-6">
                    {/* KPI Metrics */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="bg-slate-950/70 border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-400">Toplam Kurumsal Karne</span>
                          <School className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div className="mt-2 flex items-baseline gap-1.5">
                          <span className="text-2xl font-black text-white">{totalInstCount}</span>
                          <span className="text-xs text-slate-400">karne</span>
                        </div>
                        <div className="mt-1 text-[10px] text-emerald-400/90 font-medium">Okul & Kurum Denemeleri</div>
                      </div>

                      <div className="bg-slate-950/70 border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-400">Son Deneme Neti</span>
                          <Target className="w-4 h-4 text-sky-400" />
                        </div>
                        <div className="mt-2 flex items-baseline gap-1.5">
                          <span className="text-2xl font-black text-sky-400">{latestStats ? `${latestStats.totalNet}` : '0'}</span>
                          <span className="text-xs text-slate-400 font-bold">Net</span>
                        </div>
                        <div className="mt-1 text-[10px] text-slate-400 truncate max-w-[180px]">
                          {latestExam ? (latestExam.examTitle || (latestExam as any).title) : 'Henüz Sınav Yok'}
                        </div>
                      </div>

                      <div className="bg-slate-950/70 border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-400">En İyi Okul Sırası</span>
                          <Trophy className="w-4 h-4 text-amber-400" />
                        </div>
                        <div className="mt-2 flex items-baseline gap-1.5">
                          <span className="text-2xl font-black text-amber-400">
                            {bestSchoolItem?.stats.schoolRank ? `#${bestSchoolItem.stats.schoolRank}` : '-'}
                          </span>
                          {bestSchoolItem?.stats.schoolTotal && (
                            <span className="text-xs text-slate-400 font-bold">/ {bestSchoolItem.stats.schoolTotal}</span>
                          )}
                        </div>
                        <div className="mt-1 text-[10px] text-amber-400/80 font-medium">
                          {bestSchoolItem ? `Derece: İlk %${((bestSchoolItem.stats.schoolRank! / (bestSchoolItem.stats.schoolTotal || 1)) * 100).toFixed(1)}` : 'Okul Sıralama Durumu'}
                        </div>
                      </div>

                      <div className="bg-slate-950/70 border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-400">En İyi Genel Sıralama</span>
                          <Award className="w-4 h-4 text-purple-400" />
                        </div>
                        <div className="mt-2 flex items-baseline gap-1.5">
                          <span className="text-2xl font-black text-purple-400">
                            {bestGeneralItem?.stats.generalRank ? `#${bestGeneralItem.stats.generalRank.toLocaleString('tr-TR')}` : '-'}
                          </span>
                          {bestGeneralItem?.stats.generalTotal && (
                            <span className="text-xs text-slate-400 font-bold">/ {bestGeneralItem.stats.generalTotal.toLocaleString('tr-TR')}</span>
                          )}
                        </div>
                        <div className="mt-1 text-[10px] text-purple-300/80 font-medium">
                          {bestGeneralItem ? `İlk %${((bestGeneralItem.stats.generalRank! / (bestGeneralItem.stats.generalTotal || 1)) * 100).toFixed(1)}` : 'Türkiye Geneli Derece'}
                        </div>
                      </div>
                    </div>

                    {/* Chart: Kurumsal Sınav Net Gelişimi */}
                    {institutionalMocks.length > 0 && (
                      <div className="bg-slate-950/80 border border-white/10 rounded-3xl p-5 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <TrendingUp className="w-4 h-4 text-emerald-400" />
                            <h4 className="text-xs font-bold text-white">Kurumsal Deneme Net Gelişim Trendi</h4>
                          </div>
                          <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                            Resmi Karne Sonuçları
                          </span>
                        </div>

                        <div className="h-48 w-full pt-2">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={instTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                              <XAxis dataKey="displayDate" stroke="#94a3b8" fontSize={10} tickLine={false} />
                              <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                              <Tooltip
                                contentStyle={{ backgroundColor: '#090d16', borderColor: '#ffffff20', borderRadius: '12px', fontSize: '11px', color: '#fff' }}
                                formatter={(val: any, name: any, item: any) => [
                                  `${val} Net (${item.payload.score > 0 ? `${item.payload.score} P` : ''} ${item.payload.schoolRank ? `• Okul: #${item.payload.schoolRank}` : ''})`,
                                  'Toplam Net & Puan'
                                ]}
                                labelFormatter={(l: any, payload: any) => {
                                  const item = payload && payload[0]?.payload;
                                  return item ? `${item.title} (${item.date})` : `${l}`;
                                }}
                              />
                              <Line type="monotone" dataKey="totalNet" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6, fill: '#34d399' }} name="totalNet" />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}

                    {/* Toolbar: Search, Exam Type & View Mode */}
                    <div className="bg-slate-950/80 border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="relative flex-1">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={institutionalMockSearch}
                          onChange={(e) => {
                            setInstitutionalMockSearch(e.target.value);
                            setInstitutionalMockPage(1);
                          }}
                          placeholder="Sınav adı veya yayınevinde ara..."
                          className="w-full bg-slate-900/90 border border-white/10 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
                        />
                        {institutionalMockSearch && (
                          <button
                            onClick={() => {
                              setInstitutionalMockSearch('');
                              setInstitutionalMockPage(1);
                            }}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs px-1"
                          >
                            ✕
                          </button>
                        )}
                      </div>

                      <div className="flex items-center space-x-2.5 flex-wrap">
                        <div className="flex items-center space-x-1.5 bg-slate-900/90 p-1 rounded-xl border border-white/10 shrink-0">
                          <button
                            onClick={() => {
                              setInstitutionalMockTypeFilter('all');
                              setInstitutionalMockPage(1);
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                              institutionalMockTypeFilter === 'all' ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-500/20' : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            Tüm Karneler ({institutionalMocks.length})
                          </button>
                          <button
                            onClick={() => {
                              setInstitutionalMockTypeFilter('TYT');
                              setInstitutionalMockPage(1);
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                              institutionalMockTypeFilter === 'TYT' ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-500/20' : 'text-slate-400 hover:text-indigo-400'
                            }`}
                          >
                            TYT Karneleri
                          </button>
                          <button
                            onClick={() => {
                              setInstitutionalMockTypeFilter('AYT');
                              setInstitutionalMockPage(1);
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                              institutionalMockTypeFilter === 'AYT' ? 'bg-fuchsia-600 text-white font-bold shadow-md shadow-fuchsia-500/20' : 'text-slate-400 hover:text-fuchsia-400'
                            }`}
                          >
                            AYT Karneleri
                          </button>
                        </div>

                        {/* View Mode Toggle */}
                        <div className="flex items-center space-x-1 bg-slate-900/90 p-1 rounded-xl border border-white/10 shrink-0">
                          <button
                            type="button"
                            onClick={() => setInstitutionalMockViewMode('cards')}
                            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                              institutionalMockViewMode === 'cards' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                            }`}
                            title="Kart Görünümü"
                          >
                            <LayoutGrid className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setInstitutionalMockViewMode('table')}
                            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                              institutionalMockViewMode === 'table' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                            }`}
                            title="Detaylı Liste / Tablo Görünümü"
                          >
                            <Table className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Institutional Mock Exam Report Cards Grid OR Table */}
                    {filteredInstMocks.length === 0 ? (
                      <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl space-y-2">
                        <School className="w-8 h-8 text-slate-500 mx-auto" />
                        <p className="text-xs text-slate-400">Bu öğrenciye ait kayıtlı kurumsal deneme karnesi bulunamadı.</p>
                      </div>
                    ) : institutionalMockViewMode === 'cards' ? (
                      /* CARD VIEW */
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {paginatedInstMocks.map((exam) => {
                          const examTitle = exam.examTitle || (exam as any).title;
                          const stats = extractInstStats(exam);

                          const schoolPercentile = stats.schoolRank && stats.schoolTotal && stats.schoolTotal > 0
                            ? ((stats.schoolRank / stats.schoolTotal) * 100).toFixed(1)
                            : null;

                          const generalPercentile = stats.generalRank && stats.generalTotal && stats.generalTotal > 0
                            ? ((stats.generalRank / stats.generalTotal) * 100).toFixed(1)
                            : null;

                          return (
                            <div
                              key={exam.id}
                              className="bg-slate-950/90 border border-white/10 hover:border-emerald-500/50 rounded-2xl p-5 space-y-4 shadow-xl transition-all relative group flex flex-col justify-between"
                            >
                              {/* Top Row: Title, Publisher, Exam Type, Total Net & Score */}
                              <div className="space-y-3">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="space-y-1.5 flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-lg border ${
                                        exam.examType === 'TYT'
                                          ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                                          : exam.examType === 'AYT'
                                          ? 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30'
                                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                      }`}>
                                        {exam.examType || 'Kurumsal Deneme'}
                                      </span>
                                      {(exam.createdByName || (exam as any).publisher) && (
                                        <span className="text-[11px] font-bold text-slate-300 bg-white/10 px-2 py-0.5 rounded-md border border-white/5 truncate max-w-[160px]">
                                          {exam.createdByName || (exam as any).publisher}
                                        </span>
                                      )}
                                    </div>

                                    <h4 className="text-base font-black text-white leading-snug tracking-tight">
                                      {examTitle}
                                    </h4>
                                  </div>

                                  <div className="text-right shrink-0 bg-slate-900/90 border border-white/10 px-3.5 py-2 rounded-xl">
                                    <span className="text-lg font-black text-emerald-400 font-mono block">
                                      {stats.totalNet.toFixed(2)} Net
                                    </span>
                                    {stats.score > 0 && (
                                      <span className="text-[11px] text-amber-400 font-mono font-bold block">
                                        {stats.score.toFixed(1)} Puan <span className="text-[9px] text-slate-400 font-sans">({stats.scoreType})</span>
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* 3-Column Ranking Badges Grid */}
                                <div className="grid grid-cols-3 gap-2 bg-slate-900/90 p-3 rounded-xl border border-white/10 font-mono text-center">
                                  {/* 1. Okul Sırası */}
                                  <div className="space-y-0.5">
                                    <span className="text-[10px] text-emerald-400 font-sans block font-bold">🏫 Okul Sırası</span>
                                    <span className="text-sm font-black text-white">
                                      {stats.schoolRank ? `#${stats.schoolRank}` : '-'}
                                    </span>
                                    {stats.schoolTotal ? (
                                      <span className="text-[9px] text-slate-400 block">/ {stats.schoolTotal} Kişi</span>
                                    ) : null}
                                    {schoolPercentile && (
                                      <span className="text-[9px] text-emerald-400/90 font-sans font-semibold block">İlk %{schoolPercentile}</span>
                                    )}
                                  </div>

                                  {/* 2. Sınıf Sırası */}
                                  <div className="space-y-0.5 border-x border-white/5 px-1">
                                    <span className="text-[10px] text-sky-400 font-sans block font-bold">👥 Sınıf Sırası</span>
                                    <span className="text-sm font-black text-white">
                                      {stats.classRank ? `#${stats.classRank}` : '-'}
                                    </span>
                                    {stats.classTotal ? (
                                      <span className="text-[9px] text-slate-400 block">/ {stats.classTotal} Kişi</span>
                                    ) : (
                                      <span className="text-[9px] text-slate-500 block">Sınıf</span>
                                    )}
                                  </div>

                                  {/* 3. Genel Sıra */}
                                  <div className="space-y-0.5">
                                    <span className="text-[10px] text-purple-400 font-sans block font-bold">🌍 Genel / TR</span>
                                    <span className="text-sm font-black text-white">
                                      {stats.generalRank ? `#${stats.generalRank.toLocaleString('tr-TR')}` : '-'}
                                    </span>
                                    {stats.generalTotal ? (
                                      <span className="text-[9px] text-slate-400 block">/ {stats.generalTotal.toLocaleString('tr-TR')}</span>
                                    ) : null}
                                    {generalPercentile && (
                                      <span className="text-[9px] text-purple-300 font-sans font-semibold block">İlk %{generalPercentile}</span>
                                    )}
                                  </div>
                                </div>

                                {/* Subject Nets Detailed Chips */}
                                {stats.subjects && stats.subjects.length > 0 && (
                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1">
                                    {stats.subjects.map(s => {
                                      const sNet = s.net !== undefined ? s.net : (s.correct - (s.wrong || 0) * 0.25);
                                      return (
                                        <div
                                          key={s.subjectName}
                                          className="bg-slate-900/80 border border-white/5 p-2 rounded-xl text-center space-y-0.5"
                                        >
                                          <div className="text-[10px] text-slate-400 font-semibold truncate" title={s.subjectName}>
                                            {s.subjectName}
                                          </div>
                                          <div className="text-xs font-black text-emerald-300 font-mono">
                                            {sNet.toFixed(2)} Net
                                          </div>
                                          <div className="text-[9px] text-slate-500 font-mono">
                                            {s.correct}D {s.wrong}Y {s.empty ? `${s.empty}B` : ''}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>

                              {/* Card Action Footer */}
                              <div className="flex items-center justify-between pt-3 border-t border-white/10 mt-auto">
                                <div className="flex items-center space-x-2 text-[11px] text-slate-400 font-mono">
                                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                                  <span>{exam.examDate}</span>
                                  {stats.totalQuestions > 0 && (
                                    <span className="text-slate-500 text-[10px]">
                                      • {stats.totalCorrect}D {stats.totalWrong}Y {stats.totalEmpty}B
                                    </span>
                                  )}
                                </div>

                                <button
                                  type="button"
                                  onClick={() => setSelectedInstitutionalExam(exam)}
                                  className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-emerald-500/20 cursor-pointer group-hover:scale-105"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>Karneyi İncele</span>
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      /* TABLE VIEW */
                      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/80 shadow-xl">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-white/10 bg-slate-900/90 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                              <th className="py-3 px-4">Sınav Adı & Yayın</th>
                              <th className="py-3 px-4">Tarih</th>
                              <th className="py-3 px-4 text-center">Net & Puan</th>
                              <th className="py-3 px-4 text-center">Okul Sırası</th>
                              <th className="py-3 px-4 text-center">Sınıf Sırası</th>
                              <th className="py-3 px-4 text-center">Genel Sıra</th>
                              <th className="py-3 px-4 text-right">İşlem</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5 font-mono">
                            {paginatedInstMocks.map(exam => {
                              const stats = extractInstStats(exam);
                              const examTitle = exam.examTitle || (exam as any).title;
                              return (
                                <tr key={exam.id} className="hover:bg-white/5 transition-colors">
                                  <td className="py-3 px-4">
                                    <div className="flex items-center gap-1.5">
                                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border font-sans ${
                                        exam.examType === 'TYT' ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' : 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30'
                                      }`}>
                                        {exam.examType || 'TYT'}
                                      </span>
                                      <span className="font-bold text-white font-sans text-xs">{examTitle}</span>
                                    </div>
                                    <div className="text-[10px] text-slate-400 font-sans mt-0.5">{exam.createdByName || (exam as any).publisher || 'Kurumsal Deneme'}</div>
                                  </td>
                                  <td className="py-3 px-4 text-slate-400 text-[11px] whitespace-nowrap">{exam.examDate}</td>
                                  <td className="py-3 px-4 text-center">
                                    <div className="font-black text-emerald-400 text-xs">{stats.totalNet.toFixed(2)} Net</div>
                                    {stats.score > 0 && <div className="text-[10px] text-amber-400 font-bold">{stats.score.toFixed(1)} P</div>}
                                  </td>
                                  <td className="py-3 px-4 text-center">
                                    <span className="font-bold text-white">{stats.schoolRank ? `#${stats.schoolRank}` : '-'}</span>
                                    {stats.schoolTotal ? <span className="text-slate-500 text-[10px] block">/{stats.schoolTotal}</span> : null}
                                  </td>
                                  <td className="py-3 px-4 text-center">
                                    <span className="font-bold text-white">{stats.classRank ? `#${stats.classRank}` : '-'}</span>
                                    {stats.classTotal ? <span className="text-slate-500 text-[10px] block">/{stats.classTotal}</span> : null}
                                  </td>
                                  <td className="py-3 px-4 text-center">
                                    <span className="font-bold text-purple-300">{stats.generalRank ? `#${stats.generalRank.toLocaleString('tr-TR')}` : '-'}</span>
                                    {stats.generalTotal ? <span className="text-slate-500 text-[10px] block">/{stats.generalTotal.toLocaleString('tr-TR')}</span> : null}
                                  </td>
                                  <td className="py-3 px-4 text-right">
                                    <button
                                      type="button"
                                      onClick={() => setSelectedInstitutionalExam(exam)}
                                      className="inline-flex items-center space-x-1 px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-[11px] font-bold rounded-xl transition-all shadow-sm cursor-pointer"
                                    >
                                      <Eye className="w-3 h-3" />
                                      <span>Karne İncele</span>
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Pagination Bar */}
                    {filteredInstMocks.length > INST_PER_PAGE && (
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-white/10 text-xs">
                        <span className="text-slate-400 font-medium">
                          Toplam <strong className="text-white font-mono">{filteredInstMocks.length}</strong> sınavdan{' '}
                          <strong className="text-white font-mono">
                            {(currentInstPage - 1) * INST_PER_PAGE + 1}-{Math.min(currentInstPage * INST_PER_PAGE, filteredInstMocks.length)}
                          </strong>{' '}
                          arası gösteriliyor
                        </span>

                        <div className="flex items-center space-x-1.5">
                          <button
                            type="button"
                            onClick={() => setInstitutionalMockPage(Math.max(1, currentInstPage - 1))}
                            disabled={currentInstPage === 1}
                            className="p-1.5 rounded-lg border border-white/10 bg-slate-900/90 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                            title="Önceki Sayfa"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>

                          {Array.from({ length: totalInstPages }, (_, i) => i + 1).map((pageNum) => (
                            <button
                              key={pageNum}
                              type="button"
                              onClick={() => setInstitutionalMockPage(pageNum)}
                              className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer font-mono ${
                                currentInstPage === pageNum
                                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                                  : 'bg-slate-900/90 border border-white/10 text-slate-400 hover:text-white hover:border-white/20'
                              }`}
                            >
                              {pageNum}
                            </button>
                          ))}

                          <button
                            type="button"
                            onClick={() => setInstitutionalMockPage(Math.min(totalInstPages, currentInstPage + 1))}
                            disabled={currentInstPage === totalInstPages}
                            className="p-1.5 rounded-lg border border-white/10 bg-slate-900/90 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                            title="Sonraki Sayfa"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* TAB 6: RESOURCES */}
      {activeTab === 'resources' && (() => {
        const resSubjects = ['all', ...Array.from(new Set(resources.map((r: any) => r.subject).filter(Boolean)))];
        const filteredResources = resourceSubjectFilter === 'all' ? resources : resources.filter((r: any) => r.subject === resourceSubjectFilter);
        return (
        <div className="bg-slate-900/90 border border-white/15 rounded-3xl p-6 shadow-2xl backdrop-blur-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-white/10 pb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <BookOpenCheck className="w-5 h-5 text-emerald-400" />
                <span>Kaynak Kitap ve Soru Bankası İlerlemesi ({filteredResources.length}/{resources.length})</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Öğrencinin takip ettiği soru bankaları ve test tamamlama oranları.</p>
            </div>
            {resSubjects.length > 1 && (
              <div className="flex flex-wrap gap-1.5 shrink-0">
                {resSubjects.map(subj => (
                  <button
                    key={subj}
                    onClick={() => setResourceSubjectFilter(subj)}
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                      resourceSubjectFilter === subj
                        ? 'bg-emerald-600 text-white border-emerald-400/40 shadow-sm'
                        : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    {subj === 'all' ? 'Tümü' : subj}
                  </button>
                ))}
              </div>
            )}
          </div>

          {resources.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-400 italic border border-dashed border-white/10 rounded-2xl">
              Kayıtlı soru bankası/kaynak bulunmuyor.
            </div>
          ) : filteredResources.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 italic border border-dashed border-white/10 rounded-2xl">
              Bu derse ait kayıtlı kaynak bulunmuyor.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredResources.map((res: any) => {
                const bookName = res.bookTitle || res.bookName || 'Soru Bankası';
                const totalCount = res.totalUnits || res.totalTestCount || 0;
                const completedCount = res.completedUnits || res.completedTestCount || 0;
                const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
                const isMyBranch = teacherSubj && (res.subject || '').toLowerCase().includes(teacherSubj);

                const explicitTopics = res.completedTopics || [];
                const questionLogTopics = questionLogs
                  .filter(q => q.subject && res.subject && (q.subject.toLowerCase() === res.subject.toLowerCase() || q.subject.toLowerCase().includes(res.subject.toLowerCase()) || res.subject.toLowerCase().includes(q.subject.toLowerCase())))
                  .map(q => q.topic)
                  .filter((t): t is string => Boolean(t));

                const allSolvedTopics = Array.from(new Set([...explicitTopics, ...questionLogTopics]));

                // Get curriculum topics for missing topics calculation
                const currKey = Object.keys(YKS_CURRICULUM_TOPICS).find(k => 
                  res.subject && (k.toLowerCase().includes(res.subject.toLowerCase()) || res.subject.toLowerCase().includes(k.toLowerCase().replace('tyt ', '').replace('ayt ', '')))
                );
                const allCurriculumTopics = currKey ? YKS_CURRICULUM_TOPICS[currKey] : (YKS_CURRICULUM_TOPICS[res.subject] || []);
                const missingTopics = allCurriculumTopics.filter(t => !allSolvedTopics.some(st => st.toLowerCase() === t.toLowerCase()));

                return (
                  <div 
                    key={res.id} 
                    className={`p-5 rounded-2xl border space-y-3 ${
                      isMyBranch 
                        ? 'bg-amber-500/10 border-amber-500/40 shadow-lg' 
                        : 'bg-slate-950/80 border-white/10'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <span className="text-[10px] font-bold bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30">
                            {res.subject} • {res.publisher || 'Yayınevi'}
                          </span>
                          {isMyBranch && (
                            <span className="text-[9px] bg-amber-500/30 text-amber-200 px-1.5 py-0.2 rounded font-semibold">
                              Branşınız ⭐
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-bold text-white mt-1.5">{bookName}</h4>
                      </div>
                      <span className="text-xs font-mono font-bold text-emerald-400">%{pct}</span>
                    </div>

                    <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                    </div>

                    <div className="text-[11px] text-slate-400 font-mono flex justify-between pt-1 border-b border-white/5 pb-2">
                      <span>Bitirilen: {completedCount} / {totalCount} Test / Ünite</span>
                      <span>{res.status === 'completed' ? '✅ Bitti' : '⏳ Devam Ediyor'}</span>
                    </div>

                    {/* Solved Topics List */}
                    <div className="space-y-1.5 pt-1 border-b border-white/5 pb-2">
                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                        <span>Çözülen Konular ({allSolvedTopics.length})</span>
                        {allSolvedTopics.length > 0 && <span className="text-emerald-400 font-mono">✓ Tamamlandı</span>}
                      </div>
                      {allSolvedTopics.length > 0 ? (
                        <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1">
                          {allSolvedTopics.map((topicName, idx) => (
                            <span 
                              key={idx} 
                              className="text-[10px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-md flex items-center space-x-1"
                            >
                              <span>✓ {topicName}</span>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[10px] text-slate-500 italic">Henüz çözülen konu işaretlenmedi.</p>
                      )}
                    </div>

                    {/* Missing / Remaining Topics List */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                        <span>Kalan / Eksik Konular ({missingTopics.length})</span>
                        {missingTopics.length > 0 && <span className="text-amber-400 font-mono">○ Çözülecek</span>}
                      </div>
                      {missingTopics.length > 0 ? (
                        <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1">
                          {missingTopics.map((topicName, idx) => (
                            <span 
                              key={idx} 
                              className="text-[10px] bg-slate-800/80 text-slate-400 border border-white/10 px-2 py-0.5 rounded-md flex items-center space-x-1"
                            >
                              <span>○ {topicName}</span>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[10px] text-emerald-400 italic font-semibold">Tüm müfredat konuları çözüldü! 🎉</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        );
      })()}

      {/* TAB 7: ROUTINES & POMODORO */}
      {activeTab === 'routines' && (
        <div className="space-y-6">
          
          {/* Daily Routines Card - Weekly Heatmap */}
          <div className="bg-slate-900/90 border border-white/15 rounded-3xl p-6 shadow-2xl backdrop-blur-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Flame className="w-5 h-5 text-orange-400" />
              <span>Günlük Çalışma Rutinleri — Haftalık Görünüm</span>
            </h3>

            {routinesList.length > 0 ? (
              <div className="space-y-4">
                {routinesList.map(r => {
                  const doneDays: string[] = r.completedDays || [];
                  const weekDays = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
                  const fullDayMap: Record<string, string> = {
                    'Pzt': 'Pazartesi', 'Sal': 'Salı', 'Çar': 'Çarşamba',
                    'Per': 'Perşembe', 'Cum': 'Cuma', 'Cmt': 'Cumartesi', 'Paz': 'Pazar'
                  };
                  // Match both short and full day names
                  const isDayDone = (short: string) =>
                    doneDays.some(d => d === short || d === fullDayMap[short] || (fullDayMap[short] && d.includes(fullDayMap[short].substring(0, 3))));
                  const doneCount = weekDays.filter(isDayDone).length;

                  return (
                    <div key={r.id} className="bg-slate-950/80 border border-white/10 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-orange-300">📖 {r.title}</span>
                        <span className="text-xs font-mono font-black text-amber-400">
                          {doneCount}/7 Gün {doneCount >= 5 ? '🔥' : doneCount >= 3 ? '✅' : doneCount > 0 ? '⚠️' : '❌'}
                        </span>
                      </div>
                      {/* Weekly Heatmap */}
                      <div className="flex gap-2">
                        {weekDays.map(day => {
                          const done = isDayDone(day);
                          return (
                            <div key={day} className="flex-1 flex flex-col items-center gap-1">
                              <div className={`w-full h-8 rounded-lg border flex items-center justify-center text-xs font-bold transition-all ${
                                done
                                  ? 'bg-emerald-500/30 border-emerald-500/60 text-emerald-300 shadow-sm shadow-emerald-500/20'
                                  : 'bg-slate-800/60 border-white/5 text-slate-600'
                              }`}>
                                {done ? '✓' : '○'}
                              </div>
                              <span className={`text-[9px] font-bold ${done ? 'text-emerald-400' : 'text-slate-600'}`}>{day}</span>
                            </div>
                          );
                        })}
                      </div>
                      {r.completedDays && r.completedDays.length > 0 && (
                        <p className="text-[10px] text-slate-500 font-mono">
                          Tamamlanan: {r.completedDays.join(' · ')}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-slate-400 italic border border-dashed border-white/10 rounded-2xl">
                Rutin takibi bulunmuyor.
              </div>
            )}
          </div>

          {/* Pomodoro Focus Sessions */}
          <div className="bg-slate-900/90 border border-white/15 rounded-3xl p-6 shadow-2xl backdrop-blur-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Timer className="w-5 h-5 text-purple-400" />
              <span>Pomodoro Odaklanma Oturumları ({pomodoros.length})</span>
            </h3>

            {pomodoros.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 italic border border-dashed border-white/10 rounded-2xl">
                Pomodoro oturum kaydı bulunmuyor.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {pomodoros.map((p, idx) => (
                  <div key={idx} className="bg-slate-950/80 border border-white/10 rounded-2xl p-4 space-y-1 text-xs">
                    <div className="flex justify-between font-bold text-white">
                      <span>{p.subject || 'Ders Çalışması'}</span>
                      <span className="text-purple-400 font-mono">{p.durationMinutes} Dk</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block font-mono">{p.date || 'Tarihsiz'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* TAB 8: YOUTUBE TRACKER */}
      {activeTab === 'youtube' && (() => {
        const ytSubjects: string[] = ['all', ...Array.from(new Set(youtubeList.map((y: any) => String(y.subject || '')).filter(Boolean)))];

        // Filter items
        const filteredYoutubeList = youtubeList.filter(item => {
          // Search query filter
          if (youtubeSearchQuery.trim()) {
            const q = youtubeSearchQuery.toLowerCase();
            const matchChannel = (item.channelName || '').toLowerCase().includes(q);
            const matchTopic = (item.topicName || '').toLowerCase().includes(q);
            const matchPlaylist = (item.playlistTitle || '').toLowerCase().includes(q);
            const matchNotes = (item.notes || '').toLowerCase().includes(q);
            const matchSubVideos = item.playlistVideos?.some((v: any) => (v.title || '').toLowerCase().includes(q));
            if (!matchChannel && !matchTopic && !matchPlaylist && !matchNotes && !matchSubVideos) {
              return false;
            }
          }

          // Subject filter
          if (youtubeSubjectFilter !== 'all') {
            if (item.subject !== youtubeSubjectFilter) return false;
          }

          // Status / Type filter
          const isPlaylist = item.isPlaylist && item.playlistVideos && item.playlistVideos.length > 0;
          const totalVids = isPlaylist ? item.playlistVideos.length : 1;
          const watchedVids = isPlaylist 
            ? item.playlistVideos.filter((v: any) => v.isWatched || v.watched).length 
            : (item.isWatched ? 1 : 0);
          const isComplete = totalVids > 0 && watchedVids === totalVids;

          if (youtubeStatusFilter === 'playlist' && !isPlaylist) return false;
          if (youtubeStatusFilter === 'single' && isPlaylist) return false;
          if (youtubeStatusFilter === 'completed' && !isComplete) return false;
          if (youtubeStatusFilter === 'in_progress' && isComplete) return false;

          return true;
        });

        const formatDurationMinutes = (mins: number) => {
          if (!mins || mins <= 0) return '0 dk';
          const h = Math.floor(mins / 60);
          const m = mins % 60;
          if (h > 0) return m > 0 ? `${h} sa ${m} dk` : `${h} sa`;
          return `${m} dk`;
        };

        return (
          <div className="bg-slate-900/90 border border-white/15 rounded-3xl p-6 shadow-2xl backdrop-blur-2xl space-y-6">
            
            {/* Header & KPI Summary */}
            <div className="space-y-4 border-b border-white/10 pb-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center space-x-2">
                    <Youtube className="w-5 h-5 text-rose-500" />
                    <span>YouTube Ders İzleme ve Playlist Takibi</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Öğrencinin takip ettiği YouTube ders kanalları, oynatma listeleri, süreler ve tamamlanma oranları.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold px-3 py-1.5 rounded-xl font-mono flex items-center gap-1.5">
                    <CheckCheck className="w-4 h-4 text-rose-400" />
                    <span>%{overallYoutubePct} İzleme Oranı</span>
                  </span>
                  <span className="bg-white/10 text-slate-300 border border-white/10 text-xs font-bold px-3 py-1.5 rounded-xl font-mono">
                    {totalYoutubeWatchedOverall} / {totalYoutubeVideosOverall} Video
                  </span>
                </div>
              </div>

              {/* 4 Mini KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="bg-slate-950/60 border border-rose-500/30 rounded-2xl p-3.5 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Takip Edilen Liste</span>
                  <div className="text-lg font-black text-rose-300 font-mono">
                    {youtubeList.length} <span className="text-xs font-normal text-slate-400">İçerik</span>
                  </div>
                  <span className="text-[10px] text-rose-400 font-semibold block">
                    {totalPlaylistCount} Playlist • {totalSingleCount} Tekil
                  </span>
                </div>

                <div className="bg-slate-950/60 border border-emerald-500/30 rounded-2xl p-3.5 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tamamlanan Videolar</span>
                  <div className="text-lg font-black text-emerald-300 font-mono">
                    {totalYoutubeWatchedOverall} <span className="text-xs font-normal text-slate-400">/ {totalYoutubeVideosOverall}</span>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-semibold block">
                    %{overallYoutubePct} İlerleme
                  </span>
                </div>

                <div className="bg-slate-950/60 border border-amber-500/30 rounded-2xl p-3.5 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Kalan Video Sayısı</span>
                  <div className="text-lg font-black text-amber-300 font-mono">
                    {Math.max(0, totalYoutubeVideosOverall - totalYoutubeWatchedOverall)} <span className="text-xs font-normal text-slate-400">Video</span>
                  </div>
                  <span className="text-[10px] text-amber-400 font-semibold block">İzlenmeyi Bekliyor</span>
                </div>

                <div className="bg-slate-950/60 border border-purple-500/30 rounded-2xl p-3.5 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tahmini Ders Süresi</span>
                  <div className="text-lg font-black text-purple-300 font-mono">
                    {formatDurationMinutes(totalYoutubeDurationMinutes)}
                  </div>
                  <span className="text-[10px] text-purple-400 font-semibold block">Toplam Video Süresi</span>
                </div>
              </div>

              {/* Filters & Search Toolbar */}
              <div className="flex flex-col md:flex-row gap-3 pt-2">
                {/* Search Box */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={youtubeSearchQuery}
                    onChange={(e) => setYoutubeSearchQuery(e.target.value)}
                    placeholder="Kanal, playlist, ders konusu veya notlarda ara..."
                    className="w-full bg-slate-950/80 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-rose-500/50 transition-colors"
                  />
                  {youtubeSearchQuery && (
                    <button 
                      onClick={() => setYoutubeSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs"
                    >
                      Temizle
                    </button>
                  )}
                </div>

                {/* Status / Type Filter Buttons */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
                  {[
                    { key: 'all', label: 'Tümü' },
                    { key: 'playlist', label: '📂 Playlistler' },
                    { key: 'single', label: '🎬 Tekil' },
                    { key: 'completed', label: '✅ Tamamlanan' },
                    { key: 'in_progress', label: '⏳ Devam Eden' }
                  ].map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => setYoutubeStatusFilter(tab.key as any)}
                      className={`text-[11px] font-bold px-3 py-1.5 rounded-xl border transition-all cursor-pointer whitespace-nowrap ${
                        youtubeStatusFilter === tab.key
                          ? 'bg-rose-600 text-white border-rose-400/50 shadow-md shadow-rose-950/40'
                          : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10 hover:text-slate-200'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subject Filter Chips */}
              {ytSubjects.length > 2 && (
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-[11px] font-bold text-slate-400 mr-1 flex items-center gap-1">
                    <Filter className="w-3 h-3" /> Ders:
                  </span>
                  {ytSubjects.map(subj => (
                    <button
                      key={subj}
                      onClick={() => setYoutubeSubjectFilter(subj)}
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                        youtubeSubjectFilter === subj
                          ? 'bg-rose-500/20 text-rose-300 border-rose-400/40 font-bold'
                          : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10 hover:text-slate-300'
                      }`}
                    >
                      {subj === 'all' ? 'Tüm Dersler' : subj}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* List & Cards */}
            {youtubeList.length === 0 ? (
              <div className="py-16 text-center text-xs text-slate-400 italic border border-dashed border-white/10 rounded-2xl">
                Takip edilen YouTube ders videosu veya oynatma listesi bulunmuyor.
              </div>
            ) : filteredYoutubeList.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 italic border border-dashed border-white/10 rounded-2xl space-y-2">
                <p>Seçilen filtrelere veya aramaya uygun video/playlist bulunamadı.</p>
                <button
                  onClick={() => { setYoutubeSearchQuery(''); setYoutubeSubjectFilter('all'); setYoutubeStatusFilter('all'); }}
                  className="text-rose-400 text-xs font-bold underline cursor-pointer"
                >
                  Filtreleri Sıfırla
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredYoutubeList.map((item: any) => {
                  const isPlaylist = item.isPlaylist && item.playlistVideos && item.playlistVideos.length > 0;
                  const totalVids = isPlaylist ? item.playlistVideos.length : 1;
                  const watchedVids = isPlaylist 
                    ? item.playlistVideos.filter((v: any) => v.isWatched || v.watched).length 
                    : (item.isWatched ? 1 : 0);
                  const pct = totalVids > 0 ? Math.round((watchedVids / totalVids) * 100) : 0;
                  const isComplete = pct === 100;
                  const isMyBranch = teacherSubj && (item.subject || '').toLowerCase().includes(teacherSubj);
                  const isExpanded = expandedPlaylistId === item.id;

                  // Compute playlist total minutes
                  const itemDurationMins = isPlaylist
                    ? item.playlistVideos.reduce((acc: number, v: any) => acc + (v.durationMinutes || 45), 0)
                    : (item.durationMinutes || 45);

                  return (
                    <div 
                      key={item.id} 
                      className={`p-5 rounded-2xl border space-y-3.5 transition-all duration-300 ${
                        isMyBranch 
                          ? 'bg-amber-500/10 border-amber-500/40 shadow-lg shadow-amber-950/20' 
                          : 'bg-slate-950/85 border-white/10 hover:border-white/20'
                      }`}
                    >
                      {/* Card Header Pills */}
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-bold bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-lg border border-rose-500/30 flex items-center gap-1">
                            <Youtube className="w-3 h-3 text-rose-400 shrink-0" />
                            <span>{item.channelName || 'YouTube Kanalı'}</span>
                          </span>
                          <span className="text-[10px] font-bold bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-lg border border-indigo-500/30">
                            {item.subject || 'Ders'}
                          </span>
                          {isMyBranch && (
                            <span className="text-[9px] bg-amber-500/30 text-amber-200 px-1.5 py-0.5 rounded-md font-semibold">
                              Branşınız ⭐
                            </span>
                          )}
                        </div>

                        <span className={`text-[10px] font-mono font-black px-2 py-0.5 rounded-lg border ${
                          isComplete 
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                            : pct > 0 
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' 
                            : 'bg-slate-800 text-slate-400 border-white/10'
                        }`}>
                          %{pct}
                        </span>
                      </div>

                      {/* Playlist Banner (If part of a playlist or is playlist) */}
                      {item.playlistTitle && (
                        <div className="text-[11px] font-bold text-rose-300 bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded-xl flex items-center gap-1.5">
                          <Folder className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                          <span className="truncate">{item.playlistTitle}</span>
                        </div>
                      )}

                      {/* Topic / Video Title */}
                      <div>
                        <h4 className="text-sm font-bold text-white leading-snug">
                          {item.topicName || item.notes || 'YouTube Ders Videosu'}
                        </h4>
                        <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono mt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-500" />
                            {formatDurationMinutes(itemDurationMins)}
                          </span>
                          <span>•</span>
                          <span>{isPlaylist ? `📂 ${totalVids} Bölüm` : '🎬 Tekil Ders'}</span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-1">
                        <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              isComplete ? 'bg-emerald-500' : 'bg-gradient-to-r from-rose-500 to-amber-400'
                            }`} 
                            style={{ width: `${pct}%` }} 
                          />
                        </div>

                        <div className="text-[11px] text-slate-400 font-mono flex justify-between pt-0.5">
                          <span>{watchedVids} / {totalVids} Video İzlendi</span>
                          <span className={isComplete ? 'text-emerald-400 font-bold' : pct > 0 ? 'text-amber-400' : 'text-slate-500'}>
                            {isComplete ? '✅ Tamamlandı' : pct > 0 ? '⏳ Devam Ediyor' : '○ Başlanmadı'}
                          </span>
                        </div>
                      </div>

                      {/* Notes Box */}
                      {item.notes && (
                        <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-slate-300 italic">
                          <span className="text-amber-300 font-bold not-italic mr-1.5">📝 Öğrenci Notu:</span>
                          "{item.notes}"
                        </div>
                      )}

                      {/* Direct YouTube Link Button */}
                      {item.videoUrl && (
                        <div className="pt-1">
                          <a
                            href={item.videoUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center space-x-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 hover:text-rose-200 border border-rose-500/30 hover:border-rose-400/50 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm group"
                          >
                            <Play className="w-3.5 h-3.5 text-rose-400 fill-current group-hover:scale-110 transition-transform" />
                            <span>YouTube'da Aç</span>
                            <ExternalLink className="w-3 h-3 text-rose-400/70" />
                          </a>
                        </div>
                      )}

                      {/* Expandable Playlist Sub-Videos Drawer */}
                      {isPlaylist && (
                        <div className="border-t border-white/10 pt-2.5 space-y-2">
                          <button
                            onClick={() => setExpandedPlaylistId(isExpanded ? null : item.id)}
                            className="text-xs font-bold text-indigo-300 hover:text-indigo-200 transition-colors cursor-pointer w-full text-left flex items-center justify-between p-1 rounded-lg hover:bg-white/5"
                          >
                            <span className="flex items-center gap-1">
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-indigo-400" /> : <ChevronDown className="w-3.5 h-3.5 text-indigo-400" />}
                              <span>{isExpanded ? 'Videoları Gizle' : `Oynatma Listesini İncele (${item.playlistVideos.length} Video)`}</span>
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono font-normal">
                              {watchedVids}/{totalVids} izlendi
                            </span>
                          </button>

                          {isExpanded && (
                            <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1 text-xs mt-1 border border-white/10 rounded-xl p-2.5 bg-slate-900/90">
                              {item.playlistVideos.map((v: any, idx: number) => {
                                const isVidWatched = v.isWatched || v.watched;
                                return (
                                  <div 
                                    key={v.id || idx} 
                                    className={`flex items-center justify-between p-2 rounded-lg border transition-all text-xs ${
                                      isVidWatched 
                                        ? 'bg-emerald-500/10 border-emerald-500/20 text-slate-200' 
                                        : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10'
                                    }`}
                                  >
                                    <div className="flex items-center space-x-2 truncate pr-2">
                                      <span className="text-[10px] font-mono text-slate-400 shrink-0 w-4">
                                        {idx + 1}.
                                      </span>
                                      <span className="truncate font-medium">{v.title || `Video ${idx + 1}`}</span>
                                      {v.durationMinutes && (
                                        <span className="text-[10px] text-slate-400 font-mono shrink-0">
                                          ({v.durationMinutes} dk)
                                        </span>
                                      )}
                                    </div>

                                    <div className="flex items-center space-x-2 shrink-0">
                                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                        isVidWatched 
                                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                                          : 'bg-slate-800 text-slate-400 border border-white/10'
                                      }`}>
                                        {isVidWatched ? '✓ İzlendi' : '○ İzlenmedi'}
                                      </span>
                                      {v.videoUrl && (
                                        <a 
                                          href={v.videoUrl} 
                                          target="_blank" 
                                          rel="noreferrer"
                                          className="text-slate-400 hover:text-rose-400 transition-colors p-1"
                                          title="Videoyu Aç"
                                        >
                                          <ExternalLink className="w-3 h-3" />
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}

      {/* TAB 9: AUDIT LOGS */}
      {activeTab === 'audit_logs' && (
        <div className="bg-slate-900/90 border border-white/15 rounded-3xl p-6 shadow-2xl backdrop-blur-2xl space-y-4">
          <div className="flex items-center space-x-2 border-b border-white/10 pb-4">
            <Footprints className="w-5 h-5 text-purple-400" />
            <h3 className="text-base font-bold text-white">Öğrenci Ayak İzi (Sistem İşlem Zaman Çizelgesi)</h3>
          </div>
          <AuditLogsView auditLogs={auditLogs.filter(l => l.actorId === selectedStudentUser.id)} currentUser={teacher} />
        </div>
      )}

    </div>
  );
};
