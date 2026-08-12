import React, { useState } from 'react';
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
  FileSpreadsheet
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
  CartesianGrid
} from 'recharts';
import { 
  UserAccount, 
  YKSDataState, 
  AuditLogItem, 
  ClassDefinition, 
  DayOfWeek 
} from '../../types';
import { AuditLogsView } from '../AuditLogsView';
import { isUserOnline } from '../../utils/statusUtils';
import { UniversityLogo } from '../UniversityLogo';
import { YKS_CURRICULUM_TOPICS } from '../../data/initialData';

const DAYS: DayOfWeek[] = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';

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
  const [activeTab, setActiveTab] = useState<InspectTabType>('performance');
  const [isNotesSavedToast, setIsNotesSavedToast] = useState(false);

  const stData = (studentsData[selectedStudentUser.id] || {}) as Partial<YKSDataState> & { 
    topics?: Record<string, Record<string, boolean>>; 
    pomodoroHistory?: any[]; 
    youtubePlaylists?: any[];
  };
  const profile = stData.profile;
  const mocks = stData.generalMocks || [];
  const branchExams = stData.branchExams || [];
  const questionLogs = stData.questionLogs || [];
  const plans = stData.studyPlans || [];
  const topicErrors = stData.topicErrors || [];
  const resources = stData.resourceTrackers || stData.resources || [];
  const routinesList = stData.routines || [];
  const pomodoros = stData.pomodoroHistory || [];
  const youtubeList = stData.youtubeVideos || (stData as any).youtubePlaylists || [];
  const topicsState = stData.topics || {};

  // YouTube Summary Metrics Calculation
  let totalYoutubeVideosOverall = 0;
  let totalYoutubeWatchedOverall = 0;
  youtubeList.forEach(item => {
    if (item.isPlaylist && item.playlistVideos && item.playlistVideos.length > 0) {
      totalYoutubeVideosOverall += item.playlistVideos.length;
      totalYoutubeWatchedOverall += item.playlistVideos.filter((v: any) => v.isWatched || v.watched).length;
    } else {
      totalYoutubeVideosOverall += 1;
      if (item.isWatched) totalYoutubeWatchedOverall += 1;
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

  topicErrors.forEach(e => {
    const ts = parseAnyDateToTime(e.date);
    entryCandidates.push({
      timestamp: ts,
      formattedDate: formatEntryDateStr(ts, e.date),
      relativeTime: getRelativeTimeStr(ts),
      categoryLabel: 'Konu Hatası',
      badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />,
      title: `${e.subject} • ${e.topicName}`,
      subtitle: `Hata Nedeni: ${e.errorReason || 'Belirtilmedi'}`,
      stats: [
        { label: 'Durum', value: e.revised ? 'Tekrar Edildi' : 'Tekrar Bekliyor', colorClass: e.revised ? 'text-emerald-400' : 'text-amber-400 font-bold' }
      ]
    });
  });

  auditLogs
    .filter(a => a.targetUserId === selectedStudentUser.id || a.actorId === selectedStudentUser.id)
    .forEach(a => {
      const ts = parseAnyDateToTime(a.timestamp);
      entryCandidates.push({
        timestamp: ts,
        formattedDate: formatEntryDateStr(ts, a.timestamp),
        relativeTime: getRelativeTimeStr(ts),
        categoryLabel: 'Sistem İşlemi',
        badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
        icon: <Footprints className="w-3.5 h-3.5 text-purple-400" />,
        title: a.actionDescription || a.actionType,
        subtitle: `Kullanıcı: ${a.actorName} (${a.actorRole === 'student' ? 'Öğrenci' : a.actorRole})`
      });
    });

  entryCandidates.sort((a, b) => b.timestamp - a.timestamp);
  const latestEntry = entryCandidates.length > 0 ? entryCandidates[0] : null;

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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
          
          <div className="bg-slate-950/60 border border-indigo-500/30 rounded-2xl p-3.5 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Toplam Çözülen Soru</span>
            <div className="text-lg font-black text-indigo-300 font-mono">{totalSolved.toLocaleString()}</div>
            <span className="text-[10px] text-emerald-400 font-semibold block">Doğruluk: %{accuracyPct}</span>
          </div>

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
          
          {/* ROW 1: CORE PERFORMANCE & PLANNING (5 TABS) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            <button
              onClick={() => setActiveTab('performance')}
              className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer text-center w-full shadow-sm ${
                activeTab === 'performance'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 border border-indigo-400/40'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border border-white/10'
              }`}
            >
              <TrendingUp className="w-4 h-4 text-indigo-300 shrink-0" />
              <span>Performans & Koçluk</span>
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
          
          {/* 📌 Son Veri Girişi (Last Data Entry Card) */}
          <div className="bg-slate-900/90 border border-indigo-500/30 rounded-3xl p-6 shadow-2xl backdrop-blur-2xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
              <div className="flex items-center space-x-3">
                <span className="p-2.5 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shadow-inner">
                  <Clock className="w-5 h-5 text-indigo-300" />
                </span>
                <div>
                  <h3 className="font-bold text-white text-base">Öğrencinin Son Veri Girişi & Aktivitesi</h3>
                  {latestEntry ? (
                    <div className="text-xs text-slate-400 font-medium flex items-center space-x-2 mt-0.5">
                      <span>{latestEntry.formattedDate}</span>
                      {latestEntry.relativeTime && (
                        <>
                          <span>•</span>
                          <span className="text-emerald-400 font-bold">{latestEntry.relativeTime}</span>
                        </>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-500">Henüz veri kaydı bulunmuyor</span>
                  )}
                </div>
              </div>

              {latestEntry && (
                <span className={`px-3 py-1.5 rounded-xl text-xs font-bold border shadow-sm flex items-center space-x-1.5 ${latestEntry.badgeClass}`}>
                  {latestEntry.icon}
                  <span>{latestEntry.categoryLabel}</span>
                </span>
              )}
            </div>

            {latestEntry ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs bg-slate-950/60 p-4 rounded-2xl border border-white/5">
                <div className="space-y-1">
                  <div className="text-base font-black text-white">{latestEntry.title}</div>
                  {latestEntry.subtitle && (
                    <div className="text-xs text-slate-300 font-medium">{latestEntry.subtitle}</div>
                  )}
                </div>

                {latestEntry.stats && latestEntry.stats.length > 0 && (
                  <div className="flex flex-wrap items-center gap-3 shrink-0 bg-slate-900 px-4 py-2.5 rounded-xl border border-white/10 font-mono text-xs shadow-inner">
                    {latestEntry.stats.map((stat, i) => (
                      <div key={i} className="flex items-center space-x-1.5">
                        <span className="text-slate-400">{stat.label}:</span>
                        <strong className={stat.colorClass}>{stat.value}</strong>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">Öğrenciye ait henüz bir soru çözümü, deneme veya ders çalışma kaydı bulunmuyor.</p>
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
              <div>
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-5 h-5 text-rose-400" />
                    <h3 className="font-bold text-white text-base">Acil Müdahale Konuları</h3>
                  </div>
                  <span className="text-xs font-bold text-rose-300 bg-rose-500/20 px-2.5 py-0.5 rounded-lg border border-rose-500/30">
                    {unresolvedErrs.length} Konu Hatalı
                  </span>
                </div>

                <div className="space-y-2 mt-3 max-h-48 overflow-y-auto pr-1">
                  {unresolvedErrs.length === 0 ? (
                    <div className="text-center py-6 text-slate-400 text-xs italic">
                      Çözülmemiş acil konu hatası bulunmuyor. 🎉
                    </div>
                  ) : (
                    unresolvedErrs.slice(0, 5).map(errItem => (
                      <div key={errItem.id} className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 text-xs space-y-1">
                        <div className="flex justify-between font-bold text-rose-200">
                          <span>{errItem.subject}</span>
                          <span className="text-[10px] text-slate-400">{errItem.date}</span>
                        </div>
                        <p className="text-slate-300 text-[11px]">{errItem.topicName} ({errItem.errorReason || errItem.solutionNotes || 'Konu Hatası'})</p>
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

      {/* TAB 2: STUDY PLANNER */}
      {activeTab === 'planner' && (
        <div className="bg-slate-900/90 border border-white/15 rounded-3xl p-6 shadow-2xl backdrop-blur-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div>
              <h3 className="text-base font-bold text-white">Haftalık Ders Çalışma Programı</h3>
              <p className="text-xs text-slate-400 mt-0.5">Öğrencinin haftalık ders çalışma takvimini yönetin ve yeni görev atayın.</p>
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

          {plans.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-white/10 rounded-2xl space-y-3">
              <Calendar className="w-10 h-10 text-slate-500 mx-auto" />
              <p className="text-xs text-slate-400 font-medium">Bu öğrencinin haftalık planında henüz kayıtlı görev bulunmuyor.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {DAYS.map(day => {
                const dayPlans = plans.filter(p => p.day === day);
                if (dayPlans.length === 0) return null;

                return (
                  <div key={day} className="bg-slate-950/80 border border-white/10 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                      <span className="text-xs font-black text-fuchsia-400 uppercase tracking-wider">{day}</span>
                      <span className="text-[10px] text-slate-400 font-mono font-semibold">{dayPlans.length} Görev</span>
                    </div>

                    <div className="space-y-2">
                      {dayPlans.map(task => {
                        const isMyBranch = teacherSubj && (task.subject || '').toLowerCase().includes(teacherSubj);
                        return (
                          <div 
                            key={task.id} 
                            className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs ${
                              isMyBranch 
                                ? 'bg-amber-500/10 border-amber-500/40' 
                                : 'bg-white/5 border-white/10'
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center space-x-1.5">
                                <span className="font-bold text-indigo-300">{task.subject}:</span>
                                <span className="text-white font-medium truncate">{task.topic}</span>
                                {isMyBranch && (
                                  <span className="text-[9px] bg-amber-500/30 text-amber-200 px-1.5 py-0.2 rounded font-semibold shrink-0">
                                    Branşınız ⭐
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                                {task.plannedMinutes} Dk • {task.taskType || 'Konu Çalışması'}
                              </div>
                            </div>

                            <div className="flex items-center space-x-1.5 shrink-0">
                              <button
                                onClick={() => handleToggleTaskStatusFromTeacher(selectedStudentUser.id, task.id, task.status)}
                                className={`p-1.5 rounded-lg border transition-all ${
                                  task.status === 'completed'
                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                    : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
                                }`}
                                title={task.status === 'completed' ? 'Tamamlandı' : 'Tamamlandı olarak işaretle'}
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>

                              {!isBranchTeacher && (
                                <button
                                  onClick={() => handleDeleteTaskFromStudent(selectedStudentUser.id, task.id)}
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                                  title="Görevi Sil"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: QUESTIONS */}
      {activeTab === 'questions' && (
        <div className="bg-slate-900/90 border border-white/15 rounded-3xl p-6 shadow-2xl backdrop-blur-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <CheckSquare className="w-5 h-5 text-amber-400" />
                <span>Soru Çözüm Kayıtları ve Analizi ({questionLogs.length})</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Öğrencinin gün bazlı soru çözüm adetleri ve doğru/yanlış oranları.</p>
            </div>
          </div>

          {questionLogs.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-400 italic border border-dashed border-white/10 rounded-2xl">
              Soru çözme kaydı bulunmuyor.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-white/10">
              {(() => {
                const sortedLogs = [...questionLogs].sort((a, b) => {
                  if (teacherSubj) {
                    const aMatch = (a.subject || '').toLowerCase().includes(teacherSubj) || teacherSubj.includes((a.subject || '').toLowerCase());
                    const bMatch = (b.subject || '').toLowerCase().includes(teacherSubj) || teacherSubj.includes((b.subject || '').toLowerCase());
                    if (aMatch && !bMatch) return -1;
                    if (!aMatch && bMatch) return 1;
                  }
                  return 0;
                });

                return (
                  <table className="w-full text-left text-xs">
                    <thead className="bg-white/10 text-slate-300 font-bold">
                      <tr>
                        <th className="p-3.5">Tarih</th>
                        <th className="p-3.5">Ders & Konu</th>
                        <th className="p-3.5 text-center">Çözülen</th>
                        <th className="p-3.5 text-center text-emerald-400">Doğru</th>
                        <th className="p-3.5 text-center text-rose-400">Yanlış</th>
                        <th className="p-3.5 text-center text-slate-400">Boş</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10 text-slate-200 font-mono">
                      {sortedLogs.map((log) => {
                        const isMyBranch = teacherSubj && (log.subject || '').toLowerCase().includes(teacherSubj);
                        return (
                          <tr key={log.id} className={isMyBranch ? 'bg-amber-500/10 border-l-4 border-l-amber-400 hover:bg-amber-500/15' : 'hover:bg-white/5'}>
                            <td className="p-3.5 text-slate-400">{log.date}</td>
                            <td className="p-3.5 font-bold text-white flex items-center gap-1.5">
                              <span>{log.subject}</span>
                              {isMyBranch && <span className="text-[9px] bg-amber-500/30 text-amber-200 px-1.5 py-0.5 rounded border border-amber-400/40">Branşınız ⭐</span>}
                              <span className="text-slate-400 font-normal">({log.topic})</span>
                            </td>
                            <td className="p-3.5 text-center font-bold text-indigo-300">{log.solvedCount}</td>
                            <td className="p-3.5 text-center text-emerald-400 font-bold">{log.correctCount}</td>
                            <td className="p-3.5 text-center text-rose-400 font-bold">{log.wrongCount}</td>
                            <td className="p-3.5 text-center text-slate-400">{log.emptyCount || 0}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: SUBJECT & TOPIC PROGRESS */}
      {activeTab === 'topics' && (
        <div className="bg-slate-900/90 border border-white/15 rounded-3xl p-6 shadow-2xl backdrop-blur-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <ListChecks className="w-5 h-5 text-teal-400" />
                <span>Müfredat ve Konu Tamamlama İlerlemesi</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">TYT ve AYT derslerindeki tamamlanmış ve eksik konuların detaylı listesi.</p>
            </div>

            <span className="bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-bold px-3 py-1.5 rounded-xl font-mono">
              %{topicCompletionPct} Tamamlandı ({completedTopicsCount}/{totalTopicsCount})
            </span>
          </div>

          {subjectProgressList.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-400 italic border border-dashed border-white/10 rounded-2xl">
              Henüz konu ilerleme kaydı bulunmuyor.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {subjectProgressList.map(subjItem => {
                const isMyBranch = teacherSubj && subjItem.subjectName.toLowerCase().includes(teacherSubj);

                return (
                  <div 
                    key={subjItem.subjectName} 
                    className={`p-4.5 rounded-2xl border space-y-3 ${
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
                            <span className="text-[9px] bg-amber-500/30 text-amber-200 px-1.5 py-0.2 rounded font-semibold">
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

                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 text-xs pt-1">
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
      )}

      {/* TAB 5: MOCKS & BRANCH EXAMS */}
      {activeTab === 'mocks' && (
        <div className="space-y-6">
          
          {/* General Mocks Table */}
          <div className="bg-slate-900/90 border border-white/15 rounded-3xl p-6 shadow-2xl backdrop-blur-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-sky-400" />
              <span>Genel Deneme Sınavı Netleri ({mocks.length})</span>
            </h3>

            {mocks.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 italic border border-dashed border-white/10 rounded-2xl">
                Genel deneme kaydı bulunmuyor.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-white/10">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/10 text-slate-300 font-bold">
                    <tr>
                      <th className="p-3.5">Tarih</th>
                      <th className="p-3.5">Deneme Başlığı</th>
                      <th className="p-3.5 text-center text-indigo-400 font-bold">TYT Net</th>
                      <th className="p-3.5 text-center text-emerald-400 font-bold">AYT Net</th>
                      <th className="p-3.5 text-center text-amber-400">Sıralama</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10 text-slate-200 font-mono">
                    {mocks.map((m) => (
                      <tr key={m.id} className="hover:bg-white/5">
                        <td className="p-3.5 text-slate-400">{m.date}</td>
                        <td className="p-3.5 font-bold text-white">{m.title}</td>
                        <td className="p-3.5 text-center text-indigo-400 font-bold">{m.tyt?.totalNet} Net</td>
                        <td className="p-3.5 text-center text-emerald-400 font-bold">{m.ayt?.totalNet} Net</td>
                        <td className="p-3.5 text-center text-amber-400 font-bold">{m.estimatedRank ? `#${m.estimatedRank}` : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Branch Exams Table */}
          <div className="bg-slate-900/90 border border-white/15 rounded-3xl p-6 shadow-2xl backdrop-blur-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-purple-400" />
              <span>Branş Denemeleri ({branchExams.length})</span>
            </h3>

            {branchExams.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 italic border border-dashed border-white/10 rounded-2xl">
                Branş denemesi kaydı bulunmuyor.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-white/10">
                {(() => {
                  const sortedBranchExams = [...branchExams].sort((a, b) => {
                    if (teacherSubj) {
                      const aMatch = (a.subject || '').toLowerCase().includes(teacherSubj) || teacherSubj.includes((a.subject || '').toLowerCase());
                      const bMatch = (b.subject || '').toLowerCase().includes(teacherSubj) || teacherSubj.includes((b.subject || '').toLowerCase());
                      if (aMatch && !bMatch) return -1;
                      if (!aMatch && bMatch) return 1;
                    }
                    return 0;
                  });

                  return (
                    <table className="w-full text-left text-xs">
                      <thead className="bg-white/10 text-slate-300 font-bold">
                        <tr>
                          <th className="p-3.5">Tarih</th>
                          <th className="p-3.5">Ders & Yayınevi</th>
                          <th className="p-3.5 text-center text-emerald-400">Doğru</th>
                          <th className="p-3.5 text-center text-rose-400">Yanlış</th>
                          <th className="p-3.5 text-center text-slate-400">Boş</th>
                          <th className="p-3.5 text-center text-indigo-400 font-bold">Net</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10 text-slate-200 font-mono">
                        {sortedBranchExams.map((ex) => {
                          const isMyBranch = teacherSubj && (ex.subject || '').toLowerCase().includes(teacherSubj);
                          return (
                            <tr key={ex.id} className={isMyBranch ? 'bg-amber-500/10 border-l-4 border-l-amber-400 hover:bg-amber-500/15' : 'hover:bg-white/5'}>
                              <td className="p-3.5 text-slate-400">{ex.date}</td>
                              <td className="p-3.5 font-bold text-white flex items-center gap-1.5">
                                <span>{ex.subject}</span>
                                {isMyBranch && <span className="text-[9px] bg-amber-500/30 text-amber-200 px-1.5 py-0.5 rounded border border-amber-400/40">Branşınız ⭐</span>}
                                <span className="text-slate-400 font-normal">({ex.publisher})</span>
                              </td>
                              <td className="p-3.5 text-center text-emerald-400 font-bold">{ex.correct}</td>
                              <td className="p-3.5 text-center text-rose-400 font-bold">{ex.wrong}</td>
                              <td className="p-3.5 text-center text-slate-400">{ex.empty}</td>
                              <td className="p-3.5 text-center text-indigo-400 font-bold">{ex.net} Net</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  );
                })()}
              </div>
            )}
          </div>

        </div>
      )}

      {/* TAB 6: RESOURCES */}
      {activeTab === 'resources' && (
        <div className="bg-slate-900/90 border border-white/15 rounded-3xl p-6 shadow-2xl backdrop-blur-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <BookOpenCheck className="w-5 h-5 text-emerald-400" />
                <span>Kaynak Kitap ve Soru Bankası İlerlemesi ({resources.length})</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Öğrencinin takip ettiği soru bankaları ve test tamamlama oranları.</p>
            </div>
          </div>

          {resources.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-400 italic border border-dashed border-white/10 rounded-2xl">
              Kayıtlı soru bankası/kaynak bulunmuyor.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {resources.map((res: any) => {
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
      )}

      {/* TAB 7: ROUTINES & POMODORO */}
      {activeTab === 'routines' && (
        <div className="space-y-6">
          
          {/* Daily Routines Card */}
          <div className="bg-slate-900/90 border border-white/15 rounded-3xl p-6 shadow-2xl backdrop-blur-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Flame className="w-5 h-5 text-orange-400" />
              <span>Günlük Çalışma Rutinleri (Paragraf & Problem)</span>
            </h3>

            {routinesList.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {routinesList.map(r => (
                  <div key={r.id} className="bg-slate-950/80 border border-white/10 rounded-2xl p-4 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-orange-300">📖 {r.title}</span>
                      <span className="font-mono font-black text-amber-400 text-sm">{r.completedDays ? r.completedDays.length : 0} Gün 🔥</span>
                    </div>
                    <p className="text-[11px] text-slate-400">Tamamlanan Günler: {r.completedDays?.join(', ') || 'Henüz tamamlanmadı'}</p>
                  </div>
                ))}
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
      {activeTab === 'youtube' && (
        <div className="bg-slate-900/90 border border-white/15 rounded-3xl p-6 shadow-2xl backdrop-blur-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Youtube className="w-5 h-5 text-rose-400" />
                <span>YouTube Ders İzleme ve Playlist Takibi ({youtubeList.length})</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Öğrencinin takip ettiği YouTube ders kanalları, oynatma listeleri ve izlenen video durumları.</p>
            </div>

            <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold px-3 py-1.5 rounded-xl font-mono">
              %{overallYoutubePct} İzlendi ({totalYoutubeWatchedOverall}/{totalYoutubeVideosOverall} Video)
            </span>
          </div>

          {youtubeList.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-400 italic border border-dashed border-white/10 rounded-2xl">
              Takip edilen YouTube ders videosu veya oynatma listesi bulunmuyor.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {youtubeList.map((item: any) => {
                const isPlaylist = item.isPlaylist && item.playlistVideos && item.playlistVideos.length > 0;
                const totalVids = isPlaylist ? item.playlistVideos.length : 1;
                const watchedVids = isPlaylist 
                  ? item.playlistVideos.filter((v: any) => v.isWatched || v.watched).length 
                  : (item.isWatched ? 1 : 0);
                const pct = totalVids > 0 ? Math.round((watchedVids / totalVids) * 100) : 0;
                const title = item.playlistTitle || item.topicName || item.notes || 'YouTube Ders Videosu';

                return (
                  <div key={item.id} className="bg-slate-950/80 border border-white/10 rounded-2xl p-5 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <span className="text-[10px] font-bold bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded border border-rose-500/30">
                            {item.channelName || 'YouTube'} • {item.subject || 'Ders'}
                          </span>
                          <span className="text-[9px] bg-white/10 text-slate-300 px-1.5 py-0.5 rounded border border-white/10 font-semibold">
                            {isPlaylist ? 'Playlist' : 'Tekil Video'}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-white mt-1.5">{title}</h4>
                      </div>
                      <span className="text-xs font-mono font-bold text-rose-400">%{pct}</span>
                    </div>

                    <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                      <div className="bg-rose-500 h-full rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                    </div>

                    <div className="text-[11px] text-slate-400 font-mono flex justify-between pt-1">
                      <span>İzlenen: {watchedVids} / {totalVids} Video</span>
                      <span>{pct === 100 ? '✅ Tamamlandı' : '⏳ İzleniyor'}</span>
                    </div>

                    {isPlaylist && (
                      <div className="space-y-1 max-h-32 overflow-y-auto pr-1 text-[11px] pt-1 border-t border-white/5">
                        {item.playlistVideos.slice(0, 5).map((v: any, idx: number) => (
                          <div key={v.id || idx} className="flex justify-between text-slate-300">
                            <span className="truncate pr-2">{v.title || `Video ${idx + 1}`}</span>
                            <span className={(v.isWatched || v.watched) ? 'text-emerald-400 font-bold shrink-0' : 'text-slate-500 shrink-0'}>
                              {(v.isWatched || v.watched) ? '✓ İzlendi' : '○ İzlenmedi'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

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
