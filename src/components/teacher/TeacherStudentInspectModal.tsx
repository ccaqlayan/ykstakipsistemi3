import React from 'react';
import { 
  X, 
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
  FileSpreadsheet, 
  BookOpen, 
  Check,
  Trophy,
  Zap,
  Flame,
  Lock,
  Award,
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
  Target,
  Timer,
  LayoutGrid,
  Table
} from 'lucide-react';
import { BadgeShield } from '../badges/BadgeShield';
import { BADGE_DEFINITIONS, evaluateBadges } from '../../services/motivationEngine';
import { resolveStudentData } from '../../utils/studentDataUtils';
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
  Legend 
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

interface TeacherStudentInspectModalProps {
  selectedStudentUser: UserAccount | null;
  setSelectedStudentUser: (user: UserAccount | null) => void;
  inspectModalTab: 'performance' | 'planner' | 'questions' | 'resources' | 'mocks' | 'youtube' | 'audit_logs' | 'badges';
  setInspectModalTab: (tab: 'performance' | 'planner' | 'questions' | 'resources' | 'mocks' | 'youtube' | 'audit_logs' | 'badges') => void;
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

export const TeacherStudentInspectModal: React.FC<TeacherStudentInspectModalProps> = ({
  selectedStudentUser,
  setSelectedStudentUser,
  inspectModalTab,
  setInspectModalTab,
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
  if (!selectedStudentUser) return null;
  const stData = resolveStudentData(selectedStudentUser, studentsData);
  const [expandedPlaylistId, setExpandedPlaylistId] = React.useState<string | null>(null);
  const [youtubeSubjectFilter, setYoutubeSubjectFilter] = React.useState<string>('all');
  const [youtubeStatusFilter, setYoutubeStatusFilter] = React.useState<'all' | 'playlist' | 'single' | 'completed' | 'in_progress'>('all');
  const [youtubeSearchQuery, setYoutubeSearchQuery] = React.useState<string>('');
  const [plannerDayFilter, setPlannerDayFilter] = React.useState<string>('all');
  const [plannerStatusFilter, setPlannerStatusFilter] = React.useState<'all' | 'completed' | 'pending'>('all');
  const [plannerSubjectFilter, setPlannerSubjectFilter] = React.useState<string>('all');
  const [plannerSearchQuery, setPlannerSearchQuery] = React.useState<string>('');
  const [questionSubjectFilter, setQuestionSubjectFilter] = React.useState<string>('all');
  const [questionExamTypeFilter, setQuestionExamTypeFilter] = React.useState<'all' | 'TYT' | 'AYT'>('all');
  const [questionDateFilter, setQuestionDateFilter] = React.useState<'all' | '7days' | '30days'>('all');
  const [questionSearchQuery, setQuestionSearchQuery] = React.useState<string>('');
  const [questionViewMode, setQuestionViewMode] = React.useState<'cards' | 'table'>('cards');

  return (
    <div 
      onClick={() => setSelectedStudentUser(null)}
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900/95 backdrop-blur-2xl border border-white/15 rounded-3xl max-w-6xl w-full p-5 sm:p-8 shadow-2xl space-y-5 my-6 max-h-[92vh] overflow-y-auto"
      >
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <img 
                src={selectedStudentUser.avatarUrl || DEFAULT_AVATAR} 
                alt={selectedStudentUser.name}
                className="w-14 h-14 rounded-2xl object-cover border-2 border-indigo-500/40 shadow-lg"
              />
              <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-900 ${
                isUserOnline(selectedStudentUser) ? 'bg-emerald-500' : 'bg-slate-500'
              }`} />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="bg-indigo-500/20 text-indigo-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-indigo-500/30">
                  {selectedStudentUser.className || '12-A SAY'}
                </span>
                {isUserOnline(selectedStudentUser) ? (
                  <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-1"></span>
                    <span>Çevrimiçi</span>
                  </span>
                ) : (
                  <OfflineStatusDisplay user={selectedStudentUser} className="text-[11px] text-slate-400 font-medium px-2 py-0.5 rounded-full bg-white/5 border border-white/5 hover:bg-white/10 transition-colors" />
                )}
              </div>
              <h2 className="text-xl font-extrabold text-white mt-1">
                {selectedStudentUser.name}
              </h2>
            </div>
          </div>

          <button 
            onClick={() => setSelectedStudentUser(null)}
            className="text-slate-400 hover:text-white p-2 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors shrink-0"
            title="Kapat (Dışarıya da tıklayabilirsiniz)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-tabs in Inspect Modal */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:flex lg:flex-wrap gap-2 pb-3 border-b border-white/10">
          <button
            onClick={() => setInspectModalTab('performance')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center sm:justify-start space-x-1.5 ${
              inspectModalTab === 'performance'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 border border-indigo-400/40'
                : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border border-white/10'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-indigo-300 shrink-0" />
            <span className="truncate">Performans & Özet</span>
          </button>

          <button
            onClick={() => setInspectModalTab('badges')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center sm:justify-start space-x-1.5 ${
              inspectModalTab === 'badges'
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30 border border-amber-400/40'
                : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border border-white/10'
            }`}
          >
            <Trophy className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            <span className="truncate">Başarılar & Rozetler</span>
          </button>

          <button
            onClick={() => setInspectModalTab('planner')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center sm:justify-start space-x-1.5 ${
              inspectModalTab === 'planner'
                ? 'bg-fuchsia-600 text-white shadow-lg shadow-fuchsia-600/30 border border-fuchsia-400/40'
                : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border border-white/10'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-fuchsia-300 shrink-0" />
            <span className="truncate">Çalışma Planı</span>
          </button>

          <button
            onClick={() => setInspectModalTab('questions')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center sm:justify-start space-x-1.5 ${
              inspectModalTab === 'questions'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 border border-emerald-400/40'
                : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border border-white/10'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
            <span className="truncate">Soru Takibi</span>
          </button>

          <button
            onClick={() => setInspectModalTab('resources')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center sm:justify-start space-x-1.5 ${
              inspectModalTab === 'resources'
                ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/30 border border-teal-400/40'
                : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border border-white/10'
            }`}
          >
            <BookOpenCheck className="w-3.5 h-3.5 text-teal-300 shrink-0" />
            <span className="truncate">Kaynak Takibi</span>
          </button>

          <button
            onClick={() => setInspectModalTab('mocks')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center sm:justify-start space-x-1.5 ${
              inspectModalTab === 'mocks'
                ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/30 border border-sky-400/40'
                : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border border-white/10'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-sky-300 shrink-0" />
            <span className="truncate">Deneme Takibi</span>
          </button>

          <button
            onClick={() => setInspectModalTab('youtube')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center sm:justify-start space-x-1.5 ${
              inspectModalTab === 'youtube'
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30 border border-rose-400/40'
                : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border border-white/10'
            }`}
          >
            <Youtube className="w-3.5 h-3.5 text-rose-300 shrink-0" />
            <span className="truncate">YouTube Takibi</span>
          </button>

          <button
            onClick={() => setInspectModalTab('audit_logs')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center sm:justify-start space-x-1.5 ${
              inspectModalTab === 'audit_logs'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30 border border-purple-400/40'
                : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border border-white/10'
            }`}
          >
            <Footprints className="w-3.5 h-3.5 text-purple-300 shrink-0" />
            <span className="truncate">Ayak İzi</span>
          </button>
        </div>

        {/* TAB 1: PERFORMANCE & COACHING */}
        {inspectModalTab === 'performance' && (
          <div className="space-y-6">
            {(() => {
              const profile = stData?.profile;
              const mocks = stData?.generalMocks || [];
              const branchExams = stData?.branchExams || [];
              const questionLogs = stData?.questionLogs || [];
              const plans = stData?.studyPlans || [];
              const topicErrors = stData?.topicErrors || [];
              const unresolvedErrs = topicErrors.filter(e => !e.revised);

              const { allEarnedBadges: perfEarnedBadges, stats: perfStats, totalXp: perfTotalXp } = evaluateBadges(stData || ({} as any));
              const earnedBadgesCount = perfEarnedBadges.length;

              const totalSolved = questionLogs.reduce((sum, q) => sum + (q.solvedCount || 0), 0);
              const totalCorrect = questionLogs.reduce((sum, q) => sum + (q.correctCount || 0), 0);
              const totalWrong = questionLogs.reduce((sum, q) => sum + (q.wrongCount || 0), 0);
              const accuracyPct = totalSolved > 0 ? Math.round((totalCorrect / totalSolved) * 100) : 0;

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

              const teacherSubj = (teacher.role === 'teacher' && teacher.subject) ? teacher.subject.toLowerCase() : '';
              const subjectData = Object.entries(subjectMap).map(([subject, stats]) => ({
                subject,
                count: stats.solved,
                correct: stats.correct,
                wrong: stats.wrong,
                accuracy: stats.solved > 0 ? Math.round((stats.correct / stats.solved) * 100) : 0
              })).sort((a, b) => {
                if (teacherSubj) {
                  const aMatch = a.subject.toLowerCase().includes(teacherSubj) || teacherSubj.includes(a.subject.toLowerCase());
                  const bMatch = b.subject.toLowerCase().includes(teacherSubj) || teacherSubj.includes(b.subject.toLowerCase());
                  if (aMatch && !bMatch) return -1;
                  if (!aMatch && bMatch) return 1;
                }
                return b.count - a.count;
              });

              const dateMap: Record<string, { date: string; solved: number; correct: number }> = {};
              questionLogs.forEach(q => {
                const d = q.date || 'Tarihsiz';
                if (!dateMap[d]) {
                  dateMap[d] = { date: d, solved: 0, correct: 0 };
                }
                dateMap[d].solved += (q.solvedCount || 0);
                dateMap[d].correct += (q.correctCount || 0);
              });
              const questionTrendData = Object.values(dateMap).sort((a, b) => a.date.localeCompare(b.date));

              const mockChartData = mocks.map((m, idx) => ({
                name: m.title ? (m.title.length > 14 ? m.title.substring(0, 14) + '...' : m.title) : `Deneme ${idx + 1}`,
                TYT: m.tyt?.totalNet || 0,
                AYT: m.ayt?.totalNet || 0,
                date: m.date
              }));

              const completedPlans = plans.filter(p => p.status === 'completed');
              const inProgressPlans = plans.filter(p => p.status === 'in_progress');
              const pendingPlans = plans.filter(p => p.status === 'pending');
              const totalPlannedMins = plans.reduce((acc, p) => acc + (p.plannedMinutes || 0), 0);
              const totalCompletedMins = plans.reduce((acc, p) => acc + (p.completedMinutes || 0), 0);

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

              return (
                <>
                  {/* 📌 Son Veri Girişi (Last Data Entry Card) */}
                  <div className="bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 p-4 rounded-2xl border border-indigo-500/30 shadow-lg space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
                      <div className="flex items-center space-x-2.5">
                        <span className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                          <Clock className="w-4 h-4 text-indigo-300" />
                        </span>
                        <div>
                          <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-300 block">
                            Öğrencinin Son Veri Girişi
                          </span>
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
                        <span className={`px-3 py-1 rounded-xl text-xs font-bold border shadow-sm flex items-center space-x-1.5 ${latestEntry.badgeClass}`}>
                          {latestEntry.icon}
                          <span>{latestEntry.categoryLabel}</span>
                        </span>
                      )}
                    </div>

                    {latestEntry ? (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div className="space-y-0.5">
                          <div className="text-sm font-black text-white">{latestEntry.title}</div>
                          {latestEntry.subtitle && (
                            <div className="text-xs text-slate-300 font-medium">{latestEntry.subtitle}</div>
                          )}
                        </div>

                        {latestEntry.stats && latestEntry.stats.length > 0 && (
                          <div className="flex flex-wrap items-center gap-2.5 shrink-0 bg-slate-950/80 px-3.5 py-2 rounded-xl border border-white/10 font-mono text-xs">
                            {latestEntry.stats.map((stat, i) => (
                              <div key={i} className="flex items-center space-x-1">
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

                  {/* Target Profile Summary */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white/5 p-4 rounded-2xl border border-white/10 text-xs">
                    <div>
                      <span className="text-slate-400 block font-semibold">Hedef Üniversite / Bölüm</span>
                      <strong className="text-white font-black text-sm">{profile?.targetUniversity || 'Belirtilmedi'}</strong>
                      <div className="text-indigo-300 font-bold">{profile?.targetDepartment} ({profile?.targetField})</div>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-semibold">Hedef Derece Sıralama</span>
                      <strong className="text-amber-300 font-black text-base">{profile?.targetRank ? `#${profile.targetRank.toLocaleString()}` : '-'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-semibold">Hedef Sınav Netleri</span>
                      <div className="font-mono text-emerald-400 font-bold text-sm">TYT: {profile?.targetTYTNet || 0} Net • AYT: {profile?.targetAYTNet || 0} Net</div>
                    </div>
                  </div>

                  {/* Quick Summary KPI Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    <div className="bg-slate-900/90 p-4 rounded-2xl border border-indigo-500/30 space-y-1">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Toplam Soru</span>
                      <div className="text-2xl font-black text-indigo-400 font-mono">{totalSolved.toLocaleString()}</div>
                      <span className="text-[10px] text-slate-400 font-semibold">{totalCorrect} D / {totalWrong} Y</span>
                    </div>

                    <div className="bg-slate-900/90 p-4 rounded-2xl border border-emerald-500/30 space-y-1">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Doğruluk Oranı</span>
                      <div className="text-2xl font-black text-emerald-400 font-mono">%{accuracyPct}</div>
                      <span className="text-[10px] text-emerald-400/80 font-semibold">{totalCorrect} Soru Başarılı</span>
                    </div>

                    <div className="bg-slate-900/90 p-4 rounded-2xl border border-purple-500/30 space-y-1">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Denemeler</span>
                      <div className="text-2xl font-black text-purple-400 font-mono">{mocks.length + branchExams.length}</div>
                      <span className="text-[10px] text-slate-400 font-semibold">{mocks.length} Genel / {branchExams.length} Branş</span>
                    </div>

                    <div className="bg-slate-900/90 p-4 rounded-2xl border border-rose-500/30 space-y-1">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Çözülmeyen Hata</span>
                      <div className="text-2xl font-black text-rose-400 font-mono">{unresolvedErrs.length}</div>
                      <span className="text-[10px] text-rose-400/80 font-semibold">Konu Tekrarı Bekliyor</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setInspectModalTab('badges')}
                      className="bg-slate-900/90 hover:bg-amber-950/40 p-4 rounded-2xl border border-amber-500/30 hover:border-amber-400/60 space-y-1 text-left transition-all group cursor-pointer shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">Başarılar & Rozet</span>
                        <Trophy className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
                      </div>
                      <div className="text-2xl font-black text-amber-300 font-mono">{earnedBadgesCount} <span className="text-xs text-slate-400 font-normal">/ {BADGE_DEFINITIONS.length}</span></div>
                      <div className="text-[10px] text-amber-400/90 font-semibold flex items-center gap-1">
                        <Flame className="w-3 h-3 text-orange-400" />
                        <span>{perfStats.currentStreak} Gün • {perfTotalXp.toLocaleString('tr-TR')} XP</span>
                      </div>
                    </button>
                  </div>

                  {/* Coach Notes Input */}
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-200">Rehberlik & Koç Değerlendirme Notu</label>
                      <button
                        onClick={handleSaveCoachNotes}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl transition-all shadow-md"
                      >
                        Notu Kaydet
                      </button>
                    </div>
                    <textarea
                      rows={3}
                      value={editingCoachNotes}
                      onChange={(e) => setEditingCoachNotes(e.target.value)}
                      placeholder="Öğrencinin haftalık durumuna özel motivasyon veya rehberlik tavsiyelerinizi girin..."
                      className="w-full bg-slate-950/80 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  {/* Charts Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Mock Exam Trend */}
                    <div className="bg-slate-950/80 p-4 rounded-2xl border border-white/10 space-y-3">
                      <h3 className="text-xs font-bold text-white">Deneme Net Gelişim Trendi</h3>
                      {mockChartData.length === 0 ? (
                        <p className="text-xs text-slate-400 italic py-8 text-center">Henüz deneme kaydı yok.</p>
                      ) : (
                        <div className="h-56 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={mockChartData}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                              <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} />
                              <YAxis stroke="#94a3b8" fontSize={10} domain={[0, 120]} />
                              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }} />
                              <Legend wrapperStyle={{ fontSize: '11px' }} />
                              <Line type="monotone" dataKey="TYT" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 3 }} />
                              <Line type="monotone" dataKey="AYT" stroke="#34d399" strokeWidth={2.5} dot={{ r: 3 }} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </div>

                    {/* Question Trend */}
                    <div className="bg-slate-950/80 p-4 rounded-2xl border border-white/10 space-y-3">
                      <h3 className="text-xs font-bold text-white">Günlük Soru Çözüm Grafiği</h3>
                      {questionTrendData.length === 0 ? (
                        <p className="text-xs text-slate-400 italic py-8 text-center">Henüz soru çözüm kaydı yok.</p>
                      ) : (
                        <div className="h-56 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={questionTrendData}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                              <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} />
                              <YAxis stroke="#94a3b8" fontSize={10} />
                              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }} />
                              <Bar dataKey="solved" name="Çözülen Soru" fill="#818cf8" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {/* TAB 2: STUDY PLANNER */}
        {inspectModalTab === 'planner' && (
          <div className="space-y-6">
            {(() => {
              const plans = stData?.studyPlans || [];
              const totalPlannerTasks = plans.length;
              const completedPlannerTasks = plans.filter(p => p.status === 'completed').length;
              const pendingPlannerTasks = totalPlannerTasks - completedPlannerTasks;
              const totalPlannerMinutes = plans.reduce((acc, p) => acc + (p.plannedMinutes || 0), 0);
              const totalTargetQuestions = plans.reduce((acc, p) => acc + (p.targetQuestionCount || 0), 0);
              const plannerCompletionRate = totalPlannerTasks > 0 ? Math.round((completedPlannerTasks / totalPlannerTasks) * 100) : 0;
              const teacherSubj = (teacher.role === 'teacher' && teacher.subject) ? teacher.subject.toLowerCase() : '';

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
                <div className="space-y-6">
                  {/* Header & Actions */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/5 p-4 rounded-2xl border border-white/10">
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-fuchsia-400" />
                        <span>Haftalık Çalışma Programı</span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">Öğrenciye özel ders ve görev atayabilir, hazır şablon uygulayabilirsiniz.</p>
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
                    <div className="bg-slate-950/70 border border-white/10 rounded-2xl p-3.5 flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-400">Toplam Görev</span>
                        <Calendar className="w-4 h-4 text-fuchsia-400" />
                      </div>
                      <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-xl font-black text-white">{totalPlannerTasks}</span>
                        <span className="text-xs text-slate-400">görev</span>
                      </div>
                    </div>

                    <div className="bg-slate-950/70 border border-white/10 rounded-2xl p-3.5 flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-400">Tamamlanan</span>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-xl font-black text-emerald-400">{completedPlannerTasks}</span>
                        <span className="text-xs text-emerald-500/80 font-bold">/ {totalPlannerTasks} (%{plannerCompletionRate})</span>
                      </div>
                    </div>

                    <div className="bg-slate-950/70 border border-white/10 rounded-2xl p-3.5 flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-400">Bekleyen</span>
                        <Clock className="w-4 h-4 text-amber-400" />
                      </div>
                      <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-xl font-black text-amber-400">{pendingPlannerTasks}</span>
                        <span className="text-xs text-slate-400">görev</span>
                      </div>
                    </div>

                    <div className="bg-slate-950/70 border border-white/10 rounded-2xl p-3.5 flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-400">Toplam Süre</span>
                        <Timer className="w-4 h-4 text-sky-400" />
                      </div>
                      <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-xl font-black text-sky-400">
                          {Math.floor(totalPlannerMinutes / 60)}s {totalPlannerMinutes % 60}d
                        </span>
                        {totalTargetQuestions > 0 && (
                          <span className="text-[10px] text-amber-400 font-bold">• {totalTargetQuestions} S</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="bg-slate-950/60 border border-white/10 rounded-2xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        <Sparkles className="w-3.5 h-3.5 text-fuchsia-400" />
                        <span className="font-bold text-white">Program İlerlemesi</span>
                      </div>
                      <span className="font-mono font-bold text-fuchsia-400">
                        {completedPlannerTasks} / {totalPlannerTasks} Görev Yapıldı (%{plannerCompletionRate})
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/10">
                      <div 
                        className="h-full bg-gradient-to-r from-fuchsia-500 via-indigo-500 to-emerald-500 rounded-full transition-all duration-500 shadow-sm shadow-fuchsia-500/30"
                        style={{ width: `${plannerCompletionRate}%` }}
                      />
                    </div>
                  </div>

                  {/* Toolbar: Search & Filters */}
                  <div className="bg-slate-950/80 border border-white/10 rounded-2xl p-3.5 space-y-2.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      {/* Search Box */}
                      <div className="relative flex-1">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={plannerSearchQuery}
                          onChange={(e) => setPlannerSearchQuery(e.target.value)}
                          placeholder="Ders, konu, tip veya notlarda ara..."
                          className="w-full bg-slate-900/90 border border-white/10 rounded-xl pl-8 pr-7 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-fuchsia-500/50 transition-colors"
                        />
                        {plannerSearchQuery && (
                          <button
                            onClick={() => setPlannerSearchQuery('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs px-1"
                          >
                            ✕
                          </button>
                        )}
                      </div>

                      {/* Status Filter Buttons */}
                      <div className="flex items-center space-x-1 bg-slate-900/90 p-1 rounded-xl border border-white/10 shrink-0">
                        <button
                          onClick={() => setPlannerStatusFilter('all')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            plannerStatusFilter === 'all'
                              ? 'bg-fuchsia-600 text-white'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          Tümü ({totalPlannerTasks})
                        </button>
                        <button
                          onClick={() => setPlannerStatusFilter('completed')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center space-x-1 ${
                            plannerStatusFilter === 'completed'
                              ? 'bg-emerald-600 text-white'
                              : 'text-slate-400 hover:text-emerald-400'
                          }`}
                        >
                          <Check className="w-3 h-3" />
                          <span>Yapılanlar ({completedPlannerTasks})</span>
                        </button>
                        <button
                          onClick={() => setPlannerStatusFilter('pending')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center space-x-1 ${
                            plannerStatusFilter === 'pending'
                              ? 'bg-amber-600 text-white'
                              : 'text-slate-400 hover:text-amber-400'
                          }`}
                        >
                          <Clock className="w-3 h-3" />
                          <span>Bekleyenler ({pendingPlannerTasks})</span>
                        </button>
                      </div>
                    </div>

                    {/* Day Filter Chips */}
                    <div className="flex items-center gap-1 flex-wrap pt-1 border-t border-white/5">
                      <span className="text-[11px] font-bold text-slate-400 mr-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-fuchsia-400" /> Gün:
                      </span>
                      <button
                        onClick={() => setPlannerDayFilter('all')}
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg border transition-all cursor-pointer ${
                          plannerDayFilter === 'all'
                            ? 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-400/40 font-bold'
                            : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10 hover:text-slate-300'
                        }`}
                      >
                        Tümü
                      </button>
                      {DAYS.map(day => {
                        const count = plans.filter(p => p.day === day).length;
                        if (count === 0 && plannerDayFilter !== day) return null;
                        return (
                          <button
                            key={day}
                            onClick={() => setPlannerDayFilter(day)}
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg border transition-all cursor-pointer ${
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
                      <div className="flex items-center gap-1 flex-wrap pt-1 border-t border-white/5">
                        <span className="text-[11px] font-bold text-slate-400 mr-1 flex items-center gap-1">
                          <Filter className="w-3 h-3 text-indigo-400" /> Ders:
                        </span>
                        {plannerSubjects.map(subj => (
                          <button
                            key={subj}
                            onClick={() => setPlannerSubjectFilter(subj)}
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg border transition-all cursor-pointer ${
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

                  {/* Day Boards Grid */}
                  {plans.length === 0 ? (
                    <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl space-y-2">
                      <Calendar className="w-8 h-8 text-slate-500 mx-auto" />
                      <p className="text-xs text-slate-400">Bu öğrencinin haftalık planında kayıtlı görev bulunmuyor.</p>
                      {!isBranchTeacher && (
                        <button
                          onClick={() => setShowAddTaskToStudentModal(true)}
                          className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl transition-all inline-flex items-center space-x-1.5 cursor-pointer shadow-lg shadow-fuchsia-600/20 mt-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>İlk Görevi Ekle</span>
                        </button>
                      )}
                    </div>
                  ) : filteredPlans.length === 0 ? (
                    <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl space-y-2">
                      <Filter className="w-8 h-8 text-slate-500 mx-auto" />
                      <p className="text-xs text-slate-400">Uygulanan filtrelerle eşleşen görev bulunamadı.</p>
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {DAYS.map(day => {
                        const dayPlans = filteredPlans.filter(p => p.day === day);
                        if (dayPlans.length === 0) return null;

                        const dayCompleted = dayPlans.filter(p => p.status === 'completed').length;
                        const dayTotalMinutes = dayPlans.reduce((acc, p) => acc + (p.plannedMinutes || 0), 0);
                        const dayTotalQuestions = dayPlans.reduce((acc, p) => acc + (p.targetQuestionCount || 0), 0);
                        const dayPercent = Math.round((dayCompleted / dayPlans.length) * 100);

                        return (
                          <div key={day} className="bg-slate-950/80 border border-white/10 rounded-2xl p-4 space-y-3 flex flex-col justify-between shadow-xl">
                            <div className="space-y-2.5">
                              {/* Day Header */}
                              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                                <div className="flex items-center space-x-2">
                                  <div className={`w-2 h-2 rounded-full ${dayCompleted === dayPlans.length ? 'bg-emerald-400 ring-2 ring-emerald-400/20' : 'bg-fuchsia-400 ring-2 ring-fuchsia-400/20'}`} />
                                  <span className="text-xs font-black text-white uppercase tracking-wider">{day}</span>
                                </div>

                                <div className="flex items-center space-x-1.5">
                                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-lg border ${
                                    dayCompleted === dayPlans.length
                                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                      : 'bg-white/5 text-slate-400 border-white/10'
                                  }`}>
                                    {dayCompleted}/{dayPlans.length} (%{dayPercent})
                                  </span>
                                  <span className="text-[11px] text-slate-400 font-mono font-semibold">
                                    {dayTotalMinutes} dk
                                  </span>
                                </div>
                              </div>

                              {/* Mini Day Progress */}
                              <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full transition-all duration-300 ${
                                    dayCompleted === dayPlans.length ? 'bg-emerald-400' : 'bg-gradient-to-r from-fuchsia-500 to-indigo-500'
                                  }`}
                                  style={{ width: `${dayPercent}%` }}
                                />
                              </div>

                              {/* Task Cards in Day */}
                              <div className="space-y-2.5 pt-1">
                                {dayPlans.map(task => {
                                  const isMyBranch = teacherSubj && (task.subject || '').toLowerCase().includes(teacherSubj);
                                  const isCompleted = task.status === 'completed';

                                  return (
                                    <div 
                                      key={task.id} 
                                      className={`p-3.5 rounded-xl border transition-all space-y-2 relative group ${
                                        isCompleted
                                          ? 'bg-emerald-950/20 border-emerald-500/30 hover:border-emerald-500/50 shadow-sm'
                                          : isMyBranch
                                          ? 'bg-amber-950/20 border-amber-500/40 hover:border-amber-500/60 shadow-sm'
                                          : 'bg-slate-900/90 border-white/10 hover:border-white/20'
                                      }`}
                                    >
                                      {/* Top Row: Subject Pill & Badges & Actions */}
                                      <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center flex-wrap gap-1.5">
                                          <span className="text-[11px] font-black text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded-lg border border-indigo-500/30">
                                            {task.subject}
                                          </span>
                                          {task.taskType && (
                                            <span className="text-[9px] font-semibold text-slate-300 bg-white/10 px-1.5 py-0.5 rounded-lg border border-white/10">
                                              {task.taskType}
                                            </span>
                                          )}
                                          {isMyBranch && (
                                            <span className="text-[9px] font-bold bg-amber-500/30 text-amber-200 px-1.5 py-0.5 rounded-lg border border-amber-500/40 flex items-center gap-0.5">
                                              <Sparkles className="w-2.5 h-2.5" />
                                              Branşınız
                                            </span>
                                          )}
                                        </div>

                                        <div className="flex items-center space-x-1 shrink-0">
                                          <button
                                            onClick={() => handleToggleTaskStatusFromTeacher(selectedStudentUser.id, task.id, task.status)}
                                            className={`px-1.5 py-0.5 rounded-lg border transition-all cursor-pointer flex items-center space-x-1 text-[10px] font-bold ${
                                              isCompleted
                                                ? 'bg-emerald-500/25 text-emerald-300 border-emerald-500/50 hover:bg-emerald-500/35'
                                                : 'bg-white/5 text-slate-400 border-white/10 hover:text-white hover:bg-white/10'
                                            }`}
                                            title={isCompleted ? 'Tamamlandı işaretli' : 'Tamamlandı olarak işaretle'}
                                          >
                                            <CheckCircle2 className={`w-3 h-3 ${isCompleted ? 'text-emerald-400' : 'text-slate-400'}`} />
                                            <span>{isCompleted ? 'Yapıldı' : 'Yap'}</span>
                                          </button>

                                          {!isBranchTeacher && (
                                            <button
                                              onClick={() => handleDeleteTaskFromStudent(selectedStudentUser.id, task.id)}
                                              className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                                              title="Görevi Sil"
                                            >
                                              <Trash2 className="w-3 h-3" />
                                            </button>
                                          )}
                                        </div>
                                      </div>

                                      {/* Second Row: Topic Name (Alt Satırda Geniş ve Okunaklı) */}
                                      <div className="pt-0.5">
                                        <div className={`text-xs font-bold leading-relaxed break-words ${isCompleted ? 'text-emerald-200/90 line-through decoration-emerald-500/40' : 'text-white'}`}>
                                          {task.topic}
                                        </div>
                                        {task.notes && (
                                          <p className="text-[10px] text-slate-400 mt-1 bg-black/30 p-1.5 rounded-lg border border-white/5 italic">
                                            "{task.notes}"
                                          </p>
                                        )}
                                      </div>

                                      {/* Bottom Row: Metadata */}
                                      <div className="flex items-center justify-between pt-1.5 border-t border-white/5 text-[10px] font-medium">
                                        <div className="flex items-center space-x-2 text-slate-400">
                                          <span className="flex items-center space-x-1">
                                            <Clock className="w-3 h-3 text-sky-400" />
                                            <span className="font-mono text-slate-200 font-bold">{task.plannedMinutes || 0} dk</span>
                                          </span>
                                          {task.targetQuestionCount && task.targetQuestionCount > 0 ? (
                                            <span className="flex items-center space-x-0.5 text-amber-300">
                                              <Target className="w-3 h-3 text-amber-400" />
                                              <span className="font-mono font-bold">{task.targetQuestionCount} Soru</span>
                                            </span>
                                          ) : null}
                                        </div>

                                        <div>
                                          {isCompleted ? (
                                            <span className="inline-flex items-center space-x-0.5 text-[9px] font-bold text-emerald-400 bg-emerald-500/15 px-1.5 py-0.2 rounded-full border border-emerald-500/30">
                                              <Check className="w-2.5 h-2.5" />
                                              <span>Tamamlandı</span>
                                            </span>
                                          ) : (
                                            <span className="inline-flex items-center space-x-0.5 text-[9px] font-bold text-amber-400 bg-amber-500/15 px-1.5 py-0.2 rounded-full border border-amber-500/30">
                                              <Clock className="w-2.5 h-2.5" />
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

                            {/* Day Footer */}
                            {dayTotalQuestions > 0 && (
                              <div className="pt-1.5 border-t border-white/5 text-[9px] text-amber-300/80 font-mono font-semibold flex items-center justify-between">
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
          </div>
        )}

        {/* TAB 3: QUESTIONS */}
        {inspectModalTab === 'questions' && (
          <div className="space-y-6">
            {(() => {
              const logs = stData?.questionLogs || [];
              const totalSolved = logs.reduce((acc, l) => acc + (l.solvedCount || 0), 0);
              const totalCorrect = logs.reduce((acc, l) => acc + (l.correctCount || 0), 0);
              const totalWrong = logs.reduce((acc, l) => acc + (l.wrongCount || 0), 0);
              const totalEmpty = logs.reduce((acc, l) => acc + (l.emptyCount || 0), 0);
              const totalNet = logs.reduce((acc, l) => acc + (l.netScore !== undefined ? l.netScore : ((l.correctCount || 0) - (l.wrongCount || 0) * 0.25)), 0);
              const totalDurationMinutes = logs.reduce((acc, l) => acc + (l.durationMinutes || 0), 0);
              const accuracyPct = totalSolved > 0 ? Math.round((totalCorrect / totalSolved) * 100) : 0;
              const distinctDays = new Set(logs.map(l => l.date).filter(Boolean)).size;
              const teacherSubj = (teacher.role === 'teacher' && teacher.subject) ? teacher.subject.toLowerCase() : '';

              const subjectsList = ['all', ...Array.from(new Set(logs.map(l => l.subject).filter(Boolean)))];

              const now = new Date();
              const getCutoffDate = (days: number) => {
                const d = new Date(now);
                d.setDate(d.getDate() - days);
                return d.toISOString().split('T')[0];
              };

              const cutoff7 = getCutoffDate(7);
              const cutoff30 = getCutoffDate(30);

              const filteredLogs = logs.filter(log => {
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

              // 1. Daily Trends (Stacked Bar)
              const dailyMap: Record<string, { date: string; displayDate: string; solved: number; correct: number; wrong: number; empty: number; wrongAndEmpty: number; net: number }> = {};
              logs.forEach(l => {
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
                .map(d => ({ ...d, net: Number(d.net.toFixed(2)) }));

              // 2. Subject Breakdown for LAST 7 DAYS (Stacked Bar)
              const last7DaysLogs = logs.filter(l => l.date && l.date >= cutoff7);
              const logsForSubjectChart = last7DaysLogs.length > 0 ? last7DaysLogs : logs;
              const isUsingLast7Days = last7DaysLogs.length > 0;

              const subjectMap: Record<string, { subject: string; solved: number; correct: number; wrong: number; empty: number; wrongAndEmpty: number; accuracy: number }> = {};
              logsForSubjectChart.forEach(l => {
                const s = l.subject || 'Diğer';
                if (!subjectMap[s]) {
                  subjectMap[s] = { subject: s, solved: 0, correct: 0, wrong: 0, empty: 0, wrongAndEmpty: 0, accuracy: 0 };
                }
                const solved = (l.solvedCount || 0);
                const correct = (l.correctCount || 0);
                const wrong = (l.wrongCount || 0);
                const empty = (l.emptyCount || 0);
                subjectMap[s].solved += solved;
                subjectMap[s].correct += correct;
                subjectMap[s].wrong += wrong;
                subjectMap[s].empty += empty;
                subjectMap[s].wrongAndEmpty += (wrong + empty);
              });

              const subjectChartData = Object.values(subjectMap)
                .map(s => ({
                  ...s,
                  accuracy: s.solved > 0 ? Math.round((s.correct / s.solved) * 100) : 0
                }))
                .sort((a, b) => b.solved - a.solved)
                .slice(0, 8);

              return (
                <div className="space-y-5">
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/5 p-4 rounded-2xl border border-white/10">
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                        <CheckSquare className="w-4 h-4 text-amber-400" />
                        <span>Soru Çözüm Analizi ve Kayıtları</span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">Öğrencinin gün ve ders bazlı soru çözüm adetleri, doğruluk trendleri ve net skorları.</p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold px-3 py-1 rounded-xl font-mono">
                        {logs.length} Oturum • {totalSolved} Soru
                      </span>
                    </div>
                  </div>

                  {/* KPI Metrics Header */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-slate-950/70 border border-white/10 rounded-2xl p-3.5 flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-400">Toplam Çözülen</span>
                        <CheckSquare className="w-4 h-4 text-indigo-400" />
                      </div>
                      <div className="mt-2 flex items-baseline gap-1.5">
                        <span className="text-xl font-black text-white">{totalSolved}</span>
                        <span className="text-xs text-slate-400">soru</span>
                      </div>
                      <div className="mt-1 text-[10px] text-slate-500">
                        {distinctDays} aktif günde
                      </div>
                    </div>

                    <div className="bg-slate-950/70 border border-white/10 rounded-2xl p-3.5 flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-400">Doğru & Başarı</span>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div className="mt-2 flex items-baseline gap-1.5">
                        <span className="text-xl font-black text-emerald-400">{totalCorrect}</span>
                        <span className="text-xs font-bold text-emerald-500/90">(%{accuracyPct})</span>
                      </div>
                      <div className="mt-1 text-[10px] text-emerald-400/80 font-medium">
                        Net Doğruluk Oranı
                      </div>
                    </div>

                    <div className="bg-slate-950/70 border border-white/10 rounded-2xl p-3.5 flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-400">Yanlış & Boş</span>
                        <AlertTriangle className="w-4 h-4 text-rose-400" />
                      </div>
                      <div className="mt-2 flex items-baseline gap-1.5">
                        <span className="text-xl font-black text-rose-400">{totalWrong}</span>
                        <span className="text-xs text-slate-400 font-bold">/ {totalEmpty}B</span>
                      </div>
                      <div className="mt-1 text-[10px] text-rose-400/80">
                        Hata Oranı: %{totalSolved > 0 ? Math.round((totalWrong / totalSolved) * 100) : 0}
                      </div>
                    </div>

                    <div className="bg-slate-950/70 border border-white/10 rounded-2xl p-3.5 flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-400">Toplam Net</span>
                        <Target className="w-4 h-4 text-sky-400" />
                      </div>
                      <div className="mt-2 flex items-baseline gap-1.5">
                        <span className="text-xl font-black text-sky-400">{totalNet.toFixed(1)}</span>
                        <span className="text-xs text-sky-500 font-bold">net</span>
                      </div>
                      <div className="mt-1 text-[10px] text-slate-500">
                        Süre: {Math.floor(totalDurationMinutes / 60)}s {totalDurationMinutes % 60}d
                      </div>
                    </div>
                  </div>

                  {/* Visual Charts */}
                  {logs.length > 0 && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* Daily Chart (Yığmalı / Stacked Bar) */}
                      <div className="bg-slate-950/80 border border-white/10 rounded-2xl p-4 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
                            <h4 className="text-xs font-bold text-white">Günlük Trend (Son 14 Gün - Yığmalı)</h4>
                          </div>
                          <div className="flex items-center space-x-2 text-[10px] font-bold">
                            <span className="flex items-center space-x-1 text-emerald-400">
                              <span className="w-2 h-2 rounded-sm bg-emerald-500" />
                              <span>Doğru</span>
                            </span>
                            <span className="flex items-center space-x-1 text-rose-400">
                              <span className="w-2 h-2 rounded-sm bg-rose-500" />
                              <span>Yanlış/Boş</span>
                            </span>
                          </div>
                        </div>

                        <div className="h-40 w-full pt-1">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={dailyChartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                              <XAxis dataKey="displayDate" stroke="#94a3b8" fontSize={9} tickLine={false} />
                              <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} />
                              <Tooltip
                                contentStyle={{ backgroundColor: '#090d16', borderColor: '#ffffff20', borderRadius: '12px', fontSize: '10px', color: '#fff' }}
                                formatter={(val: any, name: any, item: any) => {
                                  if (name === 'correct') return [`${val} Soru`, 'Doğru'];
                                  if (name === 'wrongAndEmpty') return [`${val} Soru (${item.payload.wrong} Yanlış, ${item.payload.empty} Boş)`, 'Yanlış / Boş'];
                                  return [val, name];
                                }}
                                labelFormatter={(l: any, payload: any) => {
                                  const item = payload && payload[0]?.payload;
                                  return item ? `Tarih: ${item.date} (${item.solved} Soru, ${item.net} Net)` : `Tarih: ${l}`;
                                }}
                              />
                              <Bar dataKey="correct" fill="#10b981" stackId="dailyModalStack" name="correct" maxBarSize={22} />
                              <Bar dataKey="wrongAndEmpty" fill="#f43f5e" radius={[3, 3, 0, 0]} stackId="dailyModalStack" name="wrongAndEmpty" maxBarSize={22} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Subject Chart (Son 7 Gün - Yığmalı / Stacked Bar) */}
                      <div className="bg-slate-950/80 border border-white/10 rounded-2xl p-4 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
                            <h4 className="text-xs font-bold text-white">
                              Ders Dağılımı {isUsingLast7Days ? '(Son 7 Gün - Yığmalı)' : '(Tüm Kayıtlar)'}
                            </h4>
                          </div>
                          <div className="flex items-center space-x-2 text-[10px] font-bold">
                            <span className="flex items-center space-x-1 text-emerald-400">
                              <span className="w-2 h-2 rounded-sm bg-emerald-500" />
                              <span>Doğru</span>
                            </span>
                            <span className="flex items-center space-x-1 text-rose-400">
                              <span className="w-2 h-2 rounded-sm bg-rose-500" />
                              <span>Yanlış/Boş</span>
                            </span>
                          </div>
                        </div>

                        <div className="h-40 w-full pt-1">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={subjectChartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                              <XAxis dataKey="subject" stroke="#94a3b8" fontSize={9} tickLine={false} interval={0} />
                              <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} />
                              <Tooltip
                                contentStyle={{ backgroundColor: '#090d16', borderColor: '#ffffff20', borderRadius: '12px', fontSize: '10px', color: '#fff' }}
                                formatter={(val: any, name: any, item: any) => {
                                  if (name === 'correct') return [`${val} Soru (%${item.payload.accuracy} Başarı)`, 'Doğru'];
                                  if (name === 'wrongAndEmpty') return [`${val} Soru (${item.payload.wrong} Yanlış, ${item.payload.empty} Boş)`, 'Yanlış / Boş'];
                                  return [val, name];
                                }}
                                labelFormatter={(l: any, payload: any) => {
                                  const item = payload && payload[0]?.payload;
                                  return item ? `${item.subject} (${item.solved} Soru - Başarı %${item.accuracy})` : `${l}`;
                                }}
                              />
                              <Bar dataKey="correct" fill="#10b981" stackId="subjModalStack" name="correct" maxBarSize={24} />
                              <Bar dataKey="wrongAndEmpty" fill="#f43f5e" radius={[3, 3, 0, 0]} stackId="subjModalStack" name="wrongAndEmpty" maxBarSize={24} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Toolbar: Search & Filter */}
                  <div className="bg-slate-950/80 border border-white/10 rounded-2xl p-3.5 space-y-2.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div className="relative flex-1">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={questionSearchQuery}
                          onChange={(e) => setQuestionSearchQuery(e.target.value)}
                          placeholder="Ders, konu adı veya notlarda ara..."
                          className="w-full bg-slate-900/90 border border-white/10 rounded-xl pl-8 pr-7 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 transition-colors"
                        />
                        {questionSearchQuery && (
                          <button
                            onClick={() => setQuestionSearchQuery('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs px-1"
                          >
                            ✕
                          </button>
                        )}
                      </div>

                      {/* Exam Filter */}
                      <div className="flex items-center space-x-1 bg-slate-900/90 p-1 rounded-xl border border-white/10 shrink-0">
                        <button
                          onClick={() => setQuestionExamTypeFilter('all')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            questionExamTypeFilter === 'all' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          Tümü
                        </button>
                        <button
                          onClick={() => setQuestionExamTypeFilter('TYT')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            questionExamTypeFilter === 'TYT' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-indigo-400'
                          }`}
                        >
                          TYT
                        </button>
                        <button
                          onClick={() => setQuestionExamTypeFilter('AYT')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            questionExamTypeFilter === 'AYT' ? 'bg-fuchsia-600 text-white font-bold' : 'text-slate-400 hover:text-fuchsia-400'
                          }`}
                        >
                          AYT
                        </button>
                      </div>

                      {/* View Mode */}
                      <div className="flex items-center space-x-1 bg-slate-900/90 p-1 rounded-xl border border-white/10 shrink-0">
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
                          title="Tablo Görünümü"
                        >
                          <Table className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Subject Filter Chips */}
                    {subjectsList.length > 2 && (
                      <div className="flex items-center gap-1 flex-wrap pt-1 border-t border-white/5">
                        <span className="text-[11px] font-bold text-slate-400 mr-1 flex items-center gap-1">
                          <Filter className="w-3 h-3 text-amber-400" /> Ders:
                        </span>
                        {subjectsList.map(subj => {
                          const isMyBranch = teacherSubj && subj.toLowerCase().includes(teacherSubj);
                          return (
                            <button
                              key={subj}
                              onClick={() => setQuestionSubjectFilter(subj)}
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg border transition-all cursor-pointer flex items-center space-x-1 ${
                                questionSubjectFilter === subj
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-400/40 font-bold'
                                  : isMyBranch
                                  ? 'bg-amber-500/10 text-amber-200 border-amber-500/20 hover:bg-amber-500/20'
                                  : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10 hover:text-slate-300'
                              }`}
                            >
                              <span>{subj === 'all' ? 'Tümü' : subj}</span>
                              {isMyBranch && <span className="text-[8px] text-amber-300 font-bold">⭐</span>}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* List / Cards / Table */}
                  {logs.length === 0 ? (
                    <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl space-y-2">
                      <CheckSquare className="w-8 h-8 text-slate-500 mx-auto" />
                      <p className="text-xs text-slate-400">Bu öğrencinin henüz kayıtlı soru çözümü bulunmuyor.</p>
                    </div>
                  ) : filteredLogs.length === 0 ? (
                    <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl space-y-2">
                      <Filter className="w-8 h-8 text-slate-500 mx-auto" />
                      <p className="text-xs text-slate-400">Uygulanan filtrelerle eşleşen soru kaydı bulunamadı.</p>
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
                    /* CARD VIEW */
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
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
                            className={`p-3.5 rounded-xl border transition-all space-y-2.5 relative group ${
                              isMyBranch
                                ? 'bg-amber-950/20 border-amber-500/40 hover:border-amber-500/60 shadow-sm'
                                : 'bg-slate-950/80 border-white/10 hover:border-white/20'
                            }`}
                          >
                            {/* Top Row */}
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center flex-wrap gap-1.5">
                                <span className="text-[11px] font-black text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded-lg border border-indigo-500/30">
                                  {log.subject}
                                </span>
                                {log.examType && (
                                  <span className="text-[9px] font-bold text-slate-300 bg-white/10 px-1.5 py-0.5 rounded-lg border border-white/10">
                                    {log.examType}
                                  </span>
                                )}
                                {isMyBranch && (
                                  <span className="text-[9px] font-bold bg-amber-500/30 text-amber-200 px-1.5 py-0.5 rounded-lg border border-amber-500/40 flex items-center gap-0.5">
                                    <Sparkles className="w-2.5 h-2.5" />
                                    Branşınız
                                  </span>
                                )}
                              </div>

                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-lg border ${
                                logAccuracy >= 80
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                  : logAccuracy >= 50
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                  : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                              }`}>
                                %{logAccuracy} Başarı
                              </span>
                            </div>

                            {/* Second Row: Topic */}
                            <div className="pt-0.5">
                              <div className="text-xs font-bold text-white leading-relaxed break-words">
                                {log.topic || log.notes || 'Genel Soru Çözümü'}
                              </div>
                              {log.notes && log.topic && (
                                <p className="text-[10px] text-slate-400 mt-1 bg-black/30 p-1.5 rounded-lg border border-white/5 italic">
                                  "{log.notes}"
                                </p>
                              )}
                            </div>

                            {/* Mini Progress Bar */}
                            {solved > 0 && (
                              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden flex border border-white/10">
                                <div 
                                  className="h-full bg-emerald-500 transition-all duration-300"
                                  style={{ width: `${(correct / solved) * 100}%` }}
                                />
                                <div 
                                  className="h-full bg-rose-500 transition-all duration-300"
                                  style={{ width: `${(wrong / solved) * 100}%` }}
                                />
                                <div 
                                  className="h-full bg-slate-500 transition-all duration-300"
                                  style={{ width: `${(empty / solved) * 100}%` }}
                                />
                              </div>
                            )}

                            {/* Metrics Row */}
                            <div className="flex items-center justify-between pt-1.5 border-t border-white/5 text-[11px] font-mono">
                              <div className="flex items-center space-x-1.5">
                                <span className="font-bold text-white">{solved} Soru</span>
                                <span className="text-slate-500">•</span>
                                <span className="text-emerald-400 font-bold">{correct}D</span>
                                <span className="text-rose-400 font-bold">{wrong}Y</span>
                                {empty > 0 && <span className="text-slate-400">{empty}B</span>}
                              </div>

                              <span className="text-sky-300 font-bold bg-sky-500/10 px-1.5 py-0.2 rounded border border-sky-500/20">
                                {net.toFixed(2)} Net
                              </span>
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium pt-0.5">
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
                    /* TABLE VIEW */
                    <div className="overflow-x-auto rounded-2xl border border-white/10">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-white/10 text-slate-300 font-bold">
                          <tr>
                            <th className="p-3">Tarih</th>
                            <th className="p-3">Ders & Sınav</th>
                            <th className="p-3">Konu Başlığı</th>
                            <th className="p-3 text-center">Çözülen</th>
                            <th className="p-3 text-center text-emerald-400">Doğru</th>
                            <th className="p-3 text-center text-rose-400">Yanlış</th>
                            <th className="p-3 text-center text-slate-400">Boş</th>
                            <th className="p-3 text-center text-sky-400">Net</th>
                            <th className="p-3 text-center text-amber-400">Başarı %</th>
                            <th className="p-3 text-center">Süre</th>
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
                                <td className="p-3 text-slate-400 whitespace-nowrap">{log.date}</td>
                                <td className="p-3 font-bold text-white whitespace-nowrap">
                                  <div className="flex items-center gap-1">
                                    <span className="text-indigo-300 font-sans">{log.subject}</span>
                                    {log.examType && (
                                      <span className="text-[9px] bg-white/10 px-1 py-0.2 rounded text-slate-300 font-sans">
                                        {log.examType}
                                      </span>
                                    )}
                                    {isMyBranch && (
                                      <span className="text-[9px] bg-amber-500/30 text-amber-200 px-1 py-0.2 rounded font-sans">
                                        ⭐
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="p-3 font-bold text-white min-w-[160px]">
                                  <div className="font-sans text-xs">{log.topic || log.notes || 'Genel Soru Çözümü'}</div>
                                  {log.notes && log.topic && (
                                    <div className="text-[10px] text-slate-400 font-sans italic font-normal mt-0.5">
                                      "{log.notes}"
                                    </div>
                                  )}
                                </td>
                                <td className="p-3 text-center font-bold text-white">{solved}</td>
                                <td className="p-3 text-center text-emerald-400 font-bold">{correct}</td>
                                <td className="p-3 text-center text-rose-400 font-bold">{wrong}</td>
                                <td className="p-3 text-center text-slate-400">{empty}</td>
                                <td className="p-3 text-center text-sky-300 font-bold">{net.toFixed(2)}</td>
                                <td className="p-3 text-center">
                                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-lg border ${
                                    logAccuracy >= 80
                                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                      : logAccuracy >= 50
                                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                      : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                                  }`}>
                                    %{logAccuracy}
                                  </span>
                                </td>
                                <td className="p-3 text-center text-slate-400 text-[10px]">
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
          </div>
        )}

        {/* TAB 4: RESOURCES */}
        {inspectModalTab === 'resources' && (
          <div className="space-y-6">
            {(() => {
              const resources = stData?.resourceTrackers || stData?.resources || [];

              return (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                    <BookOpenCheck className="w-4 h-4 text-emerald-400" />
                    <span>Kaynak ve Soru Bankası Takibi ({resources.length})</span>
                  </h3>

                  {resources.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-8 text-center">Kayıtlı soru bankası/kaynak bulunmuyor.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {resources.map((res) => {
                        const pct = res.totalTestCount > 0 ? Math.round((res.completedTestCount / res.totalTestCount) * 100) : 0;

                        return (
                          <div key={res.id} className="bg-slate-950/80 border border-white/10 rounded-2xl p-4 space-y-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <span className="text-[10px] font-bold bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30">
                                  {res.subject} • {res.publisher}
                                </span>
                                <h4 className="text-sm font-bold text-white mt-1">{res.bookName}</h4>
                              </div>
                              <span className="text-xs font-mono font-bold text-emerald-400">%{pct}</span>
                            </div>

                            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                              <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${pct}%` }} />
                            </div>

                            <div className="text-[11px] text-slate-400 font-mono flex justify-between">
                              <span>Bitirilen: {res.completedTestCount} / {res.totalTestCount} Test</span>
                              <span>{res.status === 'completed' ? '✅ Bitti' : '⏳ Devam Ediyor'}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* TAB 5: MOCKS */}
        {inspectModalTab === 'mocks' && (
          <div className="space-y-6">
            {(() => {
              const mocks = stData?.generalMocks || [];
              const branchExams = stData?.branchExams || [];
              const topicErrors = stData?.topicErrors || [];

              return (
                <div className="space-y-6">
                  {/* General Mocks */}
                  <div className="bg-slate-950/80 p-5 rounded-2xl border border-white/10 space-y-3">
                    <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                      <BarChart3 className="w-4 h-4 text-sky-400" />
                      <span>Genel Deneme Sınavı Netleri ({mocks.length})</span>
                    </h3>

                    {mocks.length === 0 ? (
                      <p className="text-xs text-slate-400 italic py-4 text-center">Genel deneme kaydı bulunmuyor.</p>
                    ) : (
                      <div className="overflow-x-auto rounded-xl border border-white/10">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-white/10 text-slate-300 font-bold">
                            <tr>
                              <th className="p-3">Tarih</th>
                              <th className="p-3">Deneme Başlığı</th>
                              <th className="p-3 text-center text-indigo-400 font-bold">TYT Net</th>
                              <th className="p-3 text-center text-emerald-400 font-bold">AYT Net</th>
                              <th className="p-3 text-center text-amber-400">Sıralama</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/10 text-slate-200 font-mono">
                            {mocks.map((m) => (
                              <tr key={m.id} className="hover:bg-white/5">
                                <td className="p-3 text-slate-400">{m.date}</td>
                                <td className="p-3 font-bold text-white">{m.title}</td>
                                <td className="p-3 text-center text-indigo-400 font-bold">{m.tyt?.totalNet} Net</td>
                                <td className="p-3 text-center text-emerald-400 font-bold">{m.ayt?.totalNet} Net</td>
                                <td className="p-3 text-center text-amber-400 font-bold">{m.estimatedRank ? `#${m.estimatedRank}` : '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Branch Exams */}
                  <div className="bg-slate-950/80 p-5 rounded-2xl border border-white/10 space-y-3">
                    <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                      <BarChart3 className="w-4 h-4 text-purple-400" />
                      <span>Branş Denemeleri ({branchExams.length})</span>
                    </h3>

                    {branchExams.length === 0 ? (
                      <p className="text-xs text-slate-400 italic py-4 text-center">Branş denemesi kaydı bulunmuyor.</p>
                    ) : (
                      <div className="overflow-x-auto rounded-xl border border-white/10">
                        {(() => {
                          const teacherSubj = (teacher.role === 'teacher' && teacher.subject) ? teacher.subject.toLowerCase() : '';
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
                                  <th className="p-3">Tarih</th>
                                  <th className="p-3">Ders & Yayınevi</th>
                                  <th className="p-3 text-center text-emerald-400">Doğru</th>
                                  <th className="p-3 text-center text-rose-400">Yanlış</th>
                                  <th className="p-3 text-center text-slate-400">Boş</th>
                                  <th className="p-3 text-center text-indigo-400 font-bold">Net</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-white/10 text-slate-200 font-mono">
                                {sortedBranchExams.map((ex) => {
                                  const isMyBranch = teacherSubj && (ex.subject || '').toLowerCase().includes(teacherSubj);
                                  return (
                                    <tr key={ex.id} className={isMyBranch ? 'bg-amber-500/10 border-l-4 border-l-amber-400 hover:bg-amber-500/15' : 'hover:bg-white/5'}>
                                      <td className="p-3 text-slate-400">{ex.date}</td>
                                      <td className="p-3 font-bold text-white flex items-center gap-1.5">
                                        <span>{ex.subject}</span>
                                        {isMyBranch && <span className="text-[9px] bg-amber-500/30 text-amber-200 px-1.5 py-0.5 rounded border border-amber-400/40">Branşınız ⭐</span>}
                                        <span className="text-slate-400 font-normal">({ex.publisher})</span>
                                      </td>
                                      <td className="p-3 text-center text-emerald-400 font-bold">{ex.correct}</td>
                                      <td className="p-3 text-center text-rose-400 font-bold">{ex.wrong}</td>
                                      <td className="p-3 text-center text-slate-400">{ex.empty}</td>
                                      <td className="p-3 text-center text-indigo-400 font-bold">{ex.net} Net</td>
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
              );
            })()}
          </div>
        )}

        {/* TAB 6: YOUTUBE */}
        {inspectModalTab === 'youtube' && (
          <div className="space-y-6">
            {(() => {
              const youtubeVideos = stData?.youtubeVideos || (stData as any)?.youtubePlaylists || [];
              const ytSubjects: string[] = ['all', ...Array.from(new Set(youtubeVideos.map((y: any) => String(y.subject || '')).filter(Boolean)))];

              let totalYoutubeVideosOverall = 0;
              let totalYoutubeWatchedOverall = 0;
              let totalYoutubeDurationMinutes = 0;
              let totalPlaylistCount = 0;
              let totalSingleCount = 0;

              youtubeVideos.forEach((item: any) => {
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

              const formatDurationMinutes = (mins: number) => {
                if (!mins || mins <= 0) return '0 dk';
                const h = Math.floor(mins / 60);
                const m = mins % 60;
                if (h > 0) return m > 0 ? `${h} sa ${m} dk` : `${h} sa`;
                return `${m} dk`;
              };

              const filteredVideos = youtubeVideos.filter((item: any) => {
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

                if (youtubeSubjectFilter !== 'all') {
                  if (item.subject !== youtubeSubjectFilter) return false;
                }

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

              return (
                <div className="space-y-6">
                  {/* KPI Summary Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-white/5 border border-rose-500/30 rounded-2xl p-3.5 space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Takip Edilen Liste</span>
                      <span className="text-xl font-black text-rose-300 font-mono block">
                        {youtubeVideos.length} <span className="text-xs font-normal text-slate-400">İçerik</span>
                      </span>
                      <span className="text-[10px] text-rose-400 font-semibold block">{totalPlaylistCount} Playlist • {totalSingleCount} Tekil</span>
                    </div>

                    <div className="bg-white/5 border border-emerald-500/30 rounded-2xl p-3.5 space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">İzlenen Videolar</span>
                      <span className="text-xl font-black text-emerald-300 font-mono block">
                        {totalYoutubeWatchedOverall} <span className="text-xs font-normal text-slate-400">/ {totalYoutubeVideosOverall}</span>
                      </span>
                      <span className="text-[10px] text-emerald-400 font-semibold block">%{overallYoutubePct} Tamamlandı</span>
                    </div>

                    <div className="bg-white/5 border border-amber-500/30 rounded-2xl p-3.5 space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Kalan Video</span>
                      <span className="text-xl font-black text-amber-300 font-mono block">
                        {Math.max(0, totalYoutubeVideosOverall - totalYoutubeWatchedOverall)} <span className="text-xs font-normal text-slate-400">Video</span>
                      </span>
                      <span className="text-[10px] text-amber-400 font-semibold block">İzlenecek</span>
                    </div>

                    <div className="bg-white/5 border border-purple-500/30 rounded-2xl p-3.5 space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Toplam Ders Süresi</span>
                      <span className="text-xl font-black text-purple-300 font-mono block">
                        {formatDurationMinutes(totalYoutubeDurationMinutes)}
                      </span>
                      <span className="text-[10px] text-purple-400 font-semibold block">Tahmini Süre</span>
                    </div>
                  </div>

                  {/* Filters & Search Toolbar */}
                  <div className="bg-slate-950/80 p-4 rounded-2xl border border-white/10 space-y-3">
                    <div className="flex flex-col md:flex-row gap-2.5">
                      <div className="relative flex-1">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={youtubeSearchQuery}
                          onChange={(e) => setYoutubeSearchQuery(e.target.value)}
                          placeholder="Kanal, playlist, konu veya notlarda ara..."
                          className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-rose-500/50"
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

                      <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
                        {[
                          { key: 'all', label: 'Tümü' },
                          { key: 'playlist', label: '📂 Playlist' },
                          { key: 'single', label: '🎬 Tekil' },
                          { key: 'completed', label: '✅ Biten' },
                          { key: 'in_progress', label: '⏳ Kalan' }
                        ].map(tab => (
                          <button
                            key={tab.key}
                            onClick={() => setYoutubeStatusFilter(tab.key as any)}
                            className={`text-[11px] font-bold px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer whitespace-nowrap ${
                              youtubeStatusFilter === tab.key
                                ? 'bg-rose-600 text-white border-rose-400/50'
                                : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10 hover:text-slate-200'
                            }`}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {ytSubjects.length > 2 && (
                      <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-white/5">
                        <span className="text-[10px] font-bold text-slate-400 mr-1 flex items-center gap-1">
                          <Filter className="w-3 h-3" /> Ders:
                        </span>
                        {ytSubjects.map(subj => (
                          <button
                            key={subj}
                            onClick={() => setYoutubeSubjectFilter(subj)}
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg border transition-all cursor-pointer ${
                              youtubeSubjectFilter === subj
                                ? 'bg-rose-500/20 text-rose-300 border-rose-400/40 font-bold'
                                : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10'
                            }`}
                          >
                            {subj === 'all' ? 'Tüm Dersler' : subj}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Video & Playlist Cards Grid */}
                  {youtubeVideos.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 text-xs italic border border-dashed border-white/10 rounded-2xl">
                      Öğrenci henüz YouTube ders takibi eklememiş.
                    </div>
                  ) : filteredVideos.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-xs italic border border-dashed border-white/10 rounded-2xl space-y-2">
                      <p>Arama veya filtrelere uygun video bulunamadı.</p>
                      <button
                        onClick={() => { setYoutubeSearchQuery(''); setYoutubeSubjectFilter('all'); setYoutubeStatusFilter('all'); }}
                        className="text-rose-400 text-xs font-bold underline cursor-pointer"
                      >
                        Filtreleri Temizle
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {filteredVideos.map((item: any) => {
                        const isPlaylist = item.isPlaylist && item.playlistVideos && item.playlistVideos.length > 0;
                        const totalVids = isPlaylist ? item.playlistVideos.length : 1;
                        const watchedVids = isPlaylist 
                          ? item.playlistVideos.filter((v: any) => v.isWatched || v.watched).length 
                          : (item.isWatched ? 1 : 0);
                        const pct = totalVids > 0 ? Math.round((watchedVids / totalVids) * 100) : 0;
                        const isComplete = pct === 100;
                        const isMyBranch = teacherSubj && (item.subject || '').toLowerCase().includes(teacherSubj);
                        const isExpanded = expandedPlaylistId === item.id;
                        const itemDurationMins = isPlaylist
                          ? item.playlistVideos.reduce((acc: number, v: any) => acc + (v.durationMinutes || 45), 0)
                          : (item.durationMinutes || 45);

                        return (
                          <div 
                            key={item.id} 
                            className={`p-4 rounded-2xl border space-y-3 transition-all ${
                              isMyBranch 
                                ? 'bg-amber-500/10 border-amber-500/40' 
                                : 'bg-white/5 border-white/10 hover:border-white/20'
                            }`}
                          >
                            <div className="flex justify-between items-start gap-2">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[10px] font-bold bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-lg border border-rose-500/30 flex items-center gap-1">
                                  <Youtube className="w-3 h-3 text-rose-400 shrink-0" />
                                  <span>{item.channelName || 'YouTube'}</span>
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

                              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg border ${
                                isComplete 
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                                  : pct > 0 
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' 
                                  : 'bg-slate-800 text-slate-400 border-white/10'
                              }`}>
                                %{pct}
                              </span>
                            </div>

                            {item.playlistTitle && (
                              <div className="text-[11px] font-bold text-rose-300 bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded-xl flex items-center gap-1.5">
                                <Folder className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                                <span className="truncate">{item.playlistTitle}</span>
                              </div>
                            )}

                            <div>
                              <h4 className="text-sm font-bold text-white leading-snug">
                                {item.topicName || item.notes || 'YouTube Ders Videosu'}
                              </h4>
                              <div className="flex items-center gap-2.5 text-[10px] text-slate-400 font-mono mt-1">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-slate-500" />
                                  {formatDurationMinutes(itemDurationMins)}
                                </span>
                                <span>•</span>
                                <span>{isPlaylist ? `📂 ${totalVids} Bölüm` : '🎬 Tekil Video'}</span>
                              </div>
                            </div>

                            <div className="space-y-1">
                              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                                <div 
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    isComplete ? 'bg-emerald-500' : 'bg-gradient-to-r from-rose-500 to-amber-400'
                                  }`} 
                                  style={{ width: `${pct}%` }} 
                                />
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono flex justify-between">
                                <span>{watchedVids}/{totalVids} İzlendi</span>
                                <span className={isComplete ? 'text-emerald-400 font-bold' : pct > 0 ? 'text-amber-400' : 'text-slate-500'}>
                                  {isComplete ? '✅ Bitti' : pct > 0 ? '⏳ Devam Ediyor' : '○ Başlanmadı'}
                                </span>
                              </div>
                            </div>

                            {item.notes && (
                              <div className="bg-white/5 border border-white/10 rounded-xl p-2 text-xs text-slate-300 italic">
                                <span className="text-amber-300 font-bold not-italic mr-1">📝 Not:</span>
                                "{item.notes}"
                              </div>
                            )}

                            {item.videoUrl && (
                              <div className="pt-0.5">
                                <a
                                  href={item.videoUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center space-x-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 hover:text-rose-200 border border-rose-500/30 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all shadow-sm group"
                                >
                                  <Play className="w-3 h-3 text-rose-400 fill-current group-hover:scale-110 transition-transform" />
                                  <span>YouTube'da Aç</span>
                                  <ExternalLink className="w-2.5 h-2.5 text-rose-400/70" />
                                </a>
                              </div>
                            )}

                            {isPlaylist && (
                              <div className="border-t border-white/10 pt-2 space-y-1.5">
                                <button
                                  onClick={() => setExpandedPlaylistId(isExpanded ? null : item.id)}
                                  className="text-[11px] font-bold text-indigo-300 hover:text-indigo-200 transition-colors cursor-pointer w-full text-left flex items-center justify-between p-1 rounded hover:bg-white/5"
                                >
                                  <span className="flex items-center gap-1">
                                    {isExpanded ? <ChevronUp className="w-3 h-3 text-indigo-400" /> : <ChevronDown className="w-3 h-3 text-indigo-400" />}
                                    <span>{isExpanded ? 'Gizle' : `Videolar (${item.playlistVideos.length})`}</span>
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    {watchedVids}/{totalVids}
                                  </span>
                                </button>

                                {isExpanded && (
                                  <div className="space-y-1 max-h-48 overflow-y-auto pr-1 text-[11px] mt-1 border border-white/10 rounded-xl p-2 bg-slate-950/90">
                                    {item.playlistVideos.map((v: any, idx: number) => {
                                      const isVidWatched = v.isWatched || v.watched;
                                      return (
                                        <div 
                                          key={v.id || idx} 
                                          className={`flex items-center justify-between p-1.5 rounded border text-[11px] ${
                                            isVidWatched 
                                              ? 'bg-emerald-500/10 border-emerald-500/20 text-slate-200' 
                                              : 'bg-white/5 border-white/5 text-slate-300'
                                          }`}
                                        >
                                          <div className="flex items-center space-x-1.5 truncate pr-2">
                                            <span className="font-mono text-slate-500 shrink-0 text-[10px]">
                                              {idx + 1}.
                                            </span>
                                            <span className="truncate font-medium">{v.title || `Video ${idx + 1}`}</span>
                                            {v.durationMinutes && (
                                              <span className="text-[9px] text-slate-400 font-mono shrink-0">
                                                ({v.durationMinutes} dk)
                                              </span>
                                            )}
                                          </div>

                                          <div className="flex items-center space-x-1 shrink-0">
                                            <span className={`text-[9px] font-bold px-1 rounded ${
                                              isVidWatched 
                                                ? 'bg-emerald-500/20 text-emerald-300' 
                                                : 'bg-slate-800 text-slate-400'
                                            }`}>
                                              {isVidWatched ? '✓' : '○'}
                                            </span>
                                            {v.videoUrl && (
                                              <a 
                                                href={v.videoUrl} 
                                                target="_blank" 
                                                rel="noreferrer"
                                                className="text-slate-400 hover:text-rose-400 p-0.5"
                                              >
                                                <ExternalLink className="w-2.5 h-2.5" />
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
          </div>
        )}

        {/* TAB: ROZETLER VE BAŞARILAR (TEACHER READ-ONLY) */}
        {inspectModalTab === 'badges' && (
          <div className="space-y-6 animate-fadeIn">
            {(() => {
              const { allEarnedBadges, stats, totalXp } = evaluateBadges(stData);
              const earnedKeysSet = new Set(allEarnedBadges.map(b => b.key));
              const earnedCount = allEarnedBadges.length;
              const totalCount = BADGE_DEFINITIONS.length;

              return (
                <div className="space-y-6">
                  {/* Top Stats Banner */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-indigo-950/40 border border-amber-500/30">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-400/30">
                        <Trophy className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-xs text-slate-400 font-medium">Kazanılan Rozetler</div>
                        <div className="text-xl font-extrabold text-white">
                          {earnedCount} / {totalCount}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-2xl bg-orange-500/20 text-orange-400 border border-orange-400/30">
                        <Flame className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-xs text-slate-400 font-medium">Aktif Seri & Rekor</div>
                        <div className="text-xl font-extrabold text-orange-400">
                          {stats.currentStreak} Gün <span className="text-xs text-slate-400 font-normal">(Rekor: {stats.longestStreak})</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-400/30">
                        <Zap className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-xs text-slate-400 font-medium">Toplam Başarı Puanı</div>
                        <div className="text-xl font-extrabold text-amber-400">
                          {totalXp.toLocaleString('tr-TR')} XP
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Badges Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {BADGE_DEFINITIONS.map(badge => {
                      const isUnlocked = earnedKeysSet.has(badge.key);
                      const progress = badge.calcProgress(stData, stats);
                      const earnedInfo = allEarnedBadges.find(b => b.key === badge.key);

                      return (
                        <div
                          key={badge.key}
                          className={`flex flex-col items-center justify-between p-4 rounded-2xl border transition-all ${
                            isUnlocked
                              ? 'bg-slate-900/90 border-amber-500/30 shadow-md shadow-amber-500/10'
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
              );
            })()}
          </div>
        )}

        {/* TAB 7: AUDIT LOGS */}
        {inspectModalTab === 'audit_logs' && (
          <AuditLogsView
            currentUser={selectedStudentUser}
            auditLogs={auditLogs.filter(
              l => l.actorId === selectedStudentUser.id || l.targetUserId === selectedStudentUser.id
            )}
            classes={classes}
            studentsData={studentsData}
            allUsers={allUsers}
          />
        )}

      </div>
    </div>
  );
};
