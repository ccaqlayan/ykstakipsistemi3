import React, { useState, useEffect, useRef } from 'react';
import { 
  CheckSquare, 
  Plus, 
  Trash2, 
  Target, 
  Award, 
  Calendar, 
  BarChart2, 
  Filter,
  Edit2,
  Check,
  ChevronDown,
  X,
  Layers,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Clock,
  Timer,
  Zap,
  TrendingUp,
  Search,
  Sparkles,
  HelpCircle,
  Activity,
  Flame,
  FileText
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line,
  Legend
} from 'recharts';
import { QuestionLog } from '../types';
import { YKS_SUBJECTS } from '../data/initialData';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

const SUBJECT_COLORS: Record<string, string> = {
  // TYT Subjects
  'TYT Türkçe': '#2563eb',       // Royal Blue
  'TYT Matematik': '#10b981',   // Emerald Green
  'TYT Geometri': '#f97316',    // Bright Orange
  'TYT Fizik': '#ef4444',       // Red
  'TYT Kimya': '#06b6d4',       // Cyan
  'TYT Biyoloji': '#84cc16',    // Lime Green
  'TYT Tarih': '#b45309',       // Amber Brown
  'TYT Coğrafya': '#3b82f6',    // Sky Blue
  'TYT Felsefe': '#64748b',     // Slate Grey
  'TYT Din Kültürü': '#14b8a6',  // Teal
  'Paragraf': '#db2777',        // Rich Pink / Rose
  'TYT Paragraf': '#db2777',    // Pink

  // AYT Subjects
  'AYT Matematik': '#6366f1',   // Indigo
  'AYT Geometri': '#eab308',    // Amber Yellow
  'AYT Fizik': '#dc2626',       // Deep Crimson
  'AYT Kimya': '#0d9488',       // Dark Teal
  'AYT Biyoloji': '#22c55e',    // Bright Grass Green
  'AYT Edebiyat': '#f43f5e',    // Vivid Rose/Pink
  'AYT Tarih-1': '#7c3aed',     // Purple / Violet
  'AYT Tarih-2': '#9333ea',     // Royal Purple
  'AYT Coğrafya-1': '#0284c7',   // Ocean Blue
  'AYT Coğrafya-2': '#0284c7',   // Ocean Blue
  'AYT Felsefe Grubu': '#c026d3', // Magenta / Fuchsia
  'AYT Yabancı Dil': '#ec4899',   // Light Pink

  // Fallbacks & Generic Keys
  'AYT Tarih': '#7c3aed',
  'AYT Coğrafya': '#0284c7',
  'TYT Fen Bilimleri': '#0d9488',
  'TYT Sosyal Bilgiler': '#b45309',
  'TYT Problem': '#0ea5e9',
};

const DEFAULT_PALETTE = [
  '#2563eb', '#10b981', '#f97316', '#ef4444', '#06b6d4', 
  '#84cc16', '#b45309', '#3b82f6', '#14b8a6', '#db2777',
  '#6366f1', '#eab308', '#dc2626', '#0d9488', '#22c55e', 
  '#f43f5e', '#7c3aed', '#9333ea', '#0284c7', '#c026d3'
];

const getSubjectColor = (subjectName: string, index: number = 0) => {
  return SUBJECT_COLORS[subjectName] || DEFAULT_PALETTE[index % DEFAULT_PALETTE.length];
};

const formatMinutesToHours = (mins: number) => {
  if (!mins || mins <= 0) return '0 dk';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m} dk`;
  if (m === 0) return `${h} sa`;
  return `${h} sa ${m} dk`;
};

const CustomBarTooltip = ({ active, payload, label, hiddenSubjects = [] }: any) => {
  if (active && payload && payload.length) {
    const validItems = payload.filter((item: any) => {
      if (item.value === undefined || item.value === null || Number(item.value) <= 0) return false;
      if (item.hide) return false;
      const rawSubj = item.dataKey ? item.dataKey.replace('Net_', '').replace('Time_', '') : '';
      if (hiddenSubjects.includes(rawSubj) || hiddenSubjects.includes(item.dataKey)) return false;
      return true;
    });
    if (validItems.length === 0) return null;

    const totalSolvedOnDay = validItems.reduce((acc: number, item: any) => acc + Number(item.value), 0);

    return (
      <div className="bg-slate-900/95 border border-slate-700/80 p-3 rounded-2xl shadow-2xl backdrop-blur-md text-xs space-y-2 min-w-[170px] z-50 animate-fade-in">
        <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 space-x-2">
          <span className="font-bold text-slate-200">{label}</span>
          <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
            Toplam: {totalSolvedOnDay}
          </span>
        </div>
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {validItems.map((entry: any, index: number) => (
            <div key={`bar-tooltip-${index}`} className="flex items-center justify-between space-x-3 text-[11px]">
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: entry.color || entry.fill }} />
                <span className="text-slate-300 font-medium">{entry.name}:</span>
              </div>
              <span className="font-bold text-white font-mono">{entry.value} soru</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

const CustomLineTooltip = ({ active, payload, label, hiddenSubjects = [] }: any) => {
  if (active && payload && payload.length) {
    const validItems = payload.filter((item: any) => {
      if (item.value === undefined || item.value === null || Number(item.value) <= 0) return false;
      if (item.hide) return false;
      const rawSubj = item.dataKey ? item.dataKey.replace('Net_', '').replace('Time_', '') : '';
      if (hiddenSubjects.includes(rawSubj) || hiddenSubjects.includes(item.dataKey)) return false;
      return true;
    });
    if (validItems.length === 0) return null;

    return (
      <div className="bg-slate-900/95 border border-slate-700/80 p-3 rounded-2xl shadow-2xl backdrop-blur-md text-xs space-y-2 min-w-[170px] z-50 animate-fade-in">
        <div className="font-bold text-slate-200 border-b border-slate-800 pb-1.5">
          {label}
        </div>
        <div className="space-y-1">
          {validItems.map((entry: any, index: number) => (
            <div key={`line-tooltip-${index}`} className="flex items-center justify-between space-x-3 text-[11px]">
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: entry.color || entry.stroke }} />
                <span className="text-slate-300 font-medium">{entry.name}:</span>
              </div>
              <span className="font-bold text-indigo-300 font-mono">{entry.value} Net</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

const CustomTimeTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const timeVal = payload.find((p: any) => p.dataKey === 'Süre')?.value || 0;
    const solvedVal = payload.find((p: any) => p.dataKey === 'Çözülen')?.value || 0;
    const speedVal = solvedVal > 0 && timeVal > 0 ? (timeVal / solvedVal).toFixed(1) : '-';

    return (
      <div className="bg-slate-900/95 border border-slate-700/80 p-3 rounded-2xl shadow-2xl backdrop-blur-md text-xs space-y-2 min-w-[180px] z-50 animate-fade-in">
        <div className="font-bold text-slate-200 border-b border-slate-800 pb-1.5 flex items-center justify-between">
          <span>{label}</span>
          <span className="text-[10px] text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-full font-mono border border-amber-500/30">
            ⏱️ {formatMinutesToHours(timeVal)}
          </span>
        </div>
        <div className="space-y-1 text-[11px]">
          <div className="flex items-center justify-between text-slate-300">
            <span>Çözülen Toplam:</span>
            <span className="font-bold text-white font-mono">{solvedVal} soru</span>
          </div>
          <div className="flex items-center justify-between text-amber-300 font-semibold">
            <span>Ortalama Hız:</span>
            <span className="font-bold font-mono">{speedVal} dk / soru</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

const renderInteractiveLegend = (props: any, hiddenSubjects: string[], onToggle: (subj: string) => void) => {
  const { payload } = props;
  if (!payload || !payload.length) return null;

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1.5 pt-3 text-xs select-none">
      {payload.map((entry: any, index: number) => {
        const rawSubj = (entry.dataKey || entry.value || '').replace('Net_', '').replace(' Net', '').replace('Time_', '');
        const isHidden = hiddenSubjects.includes(rawSubj);
        return (
          <button
            key={`legend-item-${index}`}
            type="button"
            onClick={() => onToggle(rawSubj)}
            title={isHidden ? `${rawSubj} dersini göster` : `${rawSubj} dersini gizle`}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-xl transition-all cursor-pointer ${
              isHidden 
                ? 'opacity-35 line-through bg-slate-950 text-slate-500 border border-slate-800' 
                : 'opacity-100 bg-slate-800/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 shadow-sm'
            }`}
          >
            <span 
              className="w-2.5 h-2.5 rounded-full shrink-0 transition-all shadow-sm" 
              style={{ backgroundColor: isHidden ? '#64748b' : entry.color }} 
            />
            <span className="font-semibold text-[11px]">{entry.value}</span>
          </button>
        );
      })}
    </div>
  );
};

const TYT_FEN_SUBJECTS = ['TYT Fizik', 'TYT Kimya', 'TYT Biyoloji', 'TYT Fen Bilimleri'];
const TYT_SOSYAL_SUBJECTS = ['TYT Tarih', 'TYT Coğrafya', 'TYT Felsefe', 'TYT Din Kültürü', 'TYT Sosyal Bilgiler'];
const AYT_FEN_SUBJECTS = ['AYT Fizik', 'AYT Kimya', 'AYT Biyoloji'];
const AYT_SOSYAL_SUBJECTS = ['AYT Edebiyat', 'AYT Tarih-1', 'AYT Coğrafya-1', 'AYT Tarih-2', 'AYT Coğrafya-2', 'AYT Felsefe Grubu', 'AYT Tarih', 'AYT Coğrafya'];

const PRESET_KEYS = ['ALL', 'TYT_ALL', 'AYT_ALL', 'TYT_FEN', 'TYT_SOSYAL', 'AYT_FEN', 'AYT_SOSYAL'];

interface QuestionTrackerViewProps {
  questionLogs: QuestionLog[];
  onAddLog: (log: Omit<QuestionLog, 'id'>) => void;
  onUpdateLog: (log: QuestionLog) => void;
  onDeleteLog: (id: string) => void;
  theme?: 'light' | 'dark';
}

export const QuestionTrackerView: React.FC<QuestionTrackerViewProps> = ({
  questionLogs,
  onAddLog,
  onUpdateLog,
  onDeleteLog,
  theme = 'dark'
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [deletingLog, setDeletingLog] = useState<{ id: string; title: string } | null>(null);
  const [editingLogId, setEditingLogId] = useState<string | null>(null);

  // Form states
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [examType, setExamType] = useState<'TYT' | 'AYT'>('TYT');
  const [subject, setSubject] = useState(YKS_SUBJECTS.TYT[0]);
  const [targetCount, setTargetCount] = useState<number | ''>('');
  const [solvedCount, setSolvedCount] = useState<number | ''>('');
  const [correctCount, setCorrectCount] = useState<number | ''>('');
  const [wrongCount, setWrongCount] = useState<number | ''>('');
  const [emptyCount, setEmptyCount] = useState<number | ''>('');
  const [durationMinutes, setDurationMinutes] = useState<number | ''>('');
  const [notes, setNotes] = useState('');

  // Filters, Search & Pagination
  const [filterExamType, setFilterExamType] = useState<string>('ALL');
  const [filterSubject, setFilterSubject] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterExamType, filterSubject, searchQuery, pageSize]);

  // Chart Filters
  const [chartTimeRange, setChartTimeRange] = useState<'7days' | '30days' | '4weeks'>('7days');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(['ALL']);
  const [hiddenSubjects, setHiddenSubjects] = useState<string[]>([]);
  const [activeGraphType, setActiveGraphType] = useState<'soru' | 'net' | 'sure'>('soru');
  const [isSubjectDropdownOpen, setIsSubjectDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleHiddenSubject = (subj: string) => {
    setHiddenSubjects(prev => 
      prev.includes(subj) ? prev.filter(s => s !== subj) : [...prev, subj]
    );
  };

  // Close subject dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsSubjectDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleSubject = (subj: string) => {
    if (selectedSubjects.some(s => PRESET_KEYS.includes(s))) {
      setSelectedSubjects([subj]);
    } else {
      if (selectedSubjects.includes(subj)) {
        const next = selectedSubjects.filter(s => s !== subj);
        setSelectedSubjects(next.length > 0 ? next : ['ALL']);
      } else {
        setSelectedSubjects([...selectedSubjects, subj]);
      }
    }
  };

  // Active subjects array for chart series
  const activeSubjects = React.useMemo(() => {
    let candidateSubjects: string[] = [];
    if (selectedSubjects.includes('ALL')) {
      candidateSubjects = Array.from(new Set(questionLogs.map(l => l.subject)));
      if (candidateSubjects.length === 0) {
        candidateSubjects = [...YKS_SUBJECTS.TYT, ...YKS_SUBJECTS.AYT];
      }
    } else if (selectedSubjects.includes('TYT_ALL')) {
      candidateSubjects = YKS_SUBJECTS.TYT;
    } else if (selectedSubjects.includes('AYT_ALL')) {
      candidateSubjects = YKS_SUBJECTS.AYT;
    } else if (selectedSubjects.includes('TYT_FEN')) {
      candidateSubjects = TYT_FEN_SUBJECTS;
    } else if (selectedSubjects.includes('TYT_SOSYAL')) {
      candidateSubjects = TYT_SOSYAL_SUBJECTS;
    } else if (selectedSubjects.includes('AYT_FEN')) {
      candidateSubjects = AYT_FEN_SUBJECTS;
    } else if (selectedSubjects.includes('AYT_SOSYAL')) {
      candidateSubjects = AYT_SOSYAL_SUBJECTS;
    } else {
      candidateSubjects = selectedSubjects;
    }

    const d = new Date();
    if (chartTimeRange === '7days') {
      d.setDate(d.getDate() - 6);
    } else if (chartTimeRange === '30days') {
      d.setDate(d.getDate() - 29);
    } else {
      d.setDate(d.getDate() - 27);
    }
    const cutoffDateStr = d.toISOString().split('T')[0];

    return candidateSubjects.filter(subj => {
      const logsForSubj = questionLogs.filter(l => l.subject === subj && l.date >= cutoffDateStr);
      return logsForSubj.reduce((sum, l) => sum + l.solvedCount, 0) > 0;
    });
  }, [selectedSubjects, questionLogs, chartTimeRange]);

  useEffect(() => {
    if (activeGraphType === 'net') {
      setHiddenSubjects(activeSubjects);
    } else {
      setHiddenSubjects([]);
    }
  }, [selectedSubjects, activeGraphType, activeSubjects]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const target = targetCount === '' ? 0 : Number(targetCount);
    const solved = solvedCount === '' ? 0 : Number(solvedCount);
    const correct = correctCount === '' ? 0 : Number(correctCount);
    const wrong = wrongCount === '' ? 0 : Number(wrongCount);
    const empty = emptyCount === '' ? 0 : Number(emptyCount);
    const duration = durationMinutes === '' ? undefined : Number(durationMinutes);
    const net = Math.max(0, correct - wrong * 0.25);

    if (editingLogId) {
      onUpdateLog({
        id: editingLogId,
        date,
        examType,
        subject,
        targetCount: target,
        solvedCount: solved,
        correctCount: correct,
        wrongCount: wrong,
        emptyCount: empty,
        netScore: Number(net.toFixed(2)),
        durationMinutes: duration,
        notes
      });
    } else {
      onAddLog({
        date,
        examType,
        subject,
        targetCount: target,
        solvedCount: solved,
        correctCount: correct,
        wrongCount: wrong,
        emptyCount: empty,
        netScore: Number(net.toFixed(2)),
        durationMinutes: duration,
        notes
      });
    }

    setTargetCount('');
    setSolvedCount('');
    setCorrectCount('');
    setWrongCount('');
    setEmptyCount('');
    setDurationMinutes('');
    setNotes('');
    setEditingLogId(null);
    setShowAddModal(false);
  };

  const handleOpenAddModal = () => {
    setDate(new Date().toISOString().split('T')[0]);
    setExamType('TYT');
    setSubject(YKS_SUBJECTS.TYT[0]);
    setTargetCount('');
    setSolvedCount('');
    setCorrectCount('');
    setWrongCount('');
    setEmptyCount('');
    setDurationMinutes('');
    setNotes('');
    setEditingLogId(null);
    setShowAddModal(true);
  };

  const handleOpenEditModal = (log: QuestionLog) => {
    setDate(log.date);
    setExamType(log.examType);
    setSubject(log.subject);
    setTargetCount(log.targetCount);
    setSolvedCount(log.solvedCount);
    setCorrectCount(log.correctCount);
    setWrongCount(log.wrongCount);
    setEmptyCount(log.emptyCount);
    setDurationMinutes(log.durationMinutes !== undefined ? log.durationMinutes : '');
    setNotes(log.notes || '');
    setEditingLogId(log.id);
    setShowAddModal(true);
  };

  // Filtered Logs for Table
  const filteredLogs = questionLogs.filter((log) => {
    if (filterExamType !== 'ALL' && log.examType !== filterExamType) return false;
    if (filterSubject !== 'ALL' && log.subject !== filterSubject) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchSubject = log.subject.toLowerCase().includes(q);
      const matchNotes = (log.notes || '').toLowerCase().includes(q);
      const matchDate = log.date.includes(q);
      if (!matchSubject && !matchNotes && !matchDate) return false;
    }
    return true;
  });

  const totalLogs = filteredLogs.length;
  const totalPages = Math.ceil(totalLogs / pageSize) || 1;
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalLogs);
  const paginatedLogs = filteredLogs.slice(startIndex, endIndex);

  // Helper for computing or falling back duration minutes
  const getLogDuration = (log: QuestionLog): number => {
    if (log.durationMinutes && log.durationMinutes > 0) return log.durationMinutes;
    const initialMatch = INITIAL_STATE.questionLogs.find(iLog => iLog.id === log.id || (iLog.date === log.date && iLog.subject === log.subject));
    if (initialMatch?.durationMinutes && initialMatch.durationMinutes > 0) {
      return initialMatch.durationMinutes;
    }
    const solved = log.solvedCount || 30;
    let factor = 1.2;
    if (log.subject?.includes('Matematik')) factor = 1.4;
    else if (log.subject?.includes('Paragraf') || log.subject?.includes('Türkçe')) factor = 0.8;
    else if (log.subject?.includes('Fizik') || log.subject?.includes('Geometri')) factor = 1.3;
    return Math.max(1, Math.round(solved * factor));
  };

  // Aggregated Overall KPI Statistics
  const totalSolved = questionLogs.reduce((acc, q) => acc + q.solvedCount, 0);
  const tytSolved = questionLogs.filter(q => q.examType === 'TYT').reduce((acc, q) => acc + q.solvedCount, 0);
  const aytSolved = questionLogs.filter(q => q.examType === 'AYT').reduce((acc, q) => acc + q.solvedCount, 0);
  
  const totalCorrect = questionLogs.reduce((acc, q) => acc + q.correctCount, 0);
  const totalWrong = questionLogs.reduce((acc, q) => acc + q.wrongCount, 0);
  const totalEmpty = questionLogs.reduce((acc, q) => acc + q.emptyCount, 0);
  const totalNet = questionLogs.reduce((acc, q) => acc + q.netScore, 0);
  const overallAccuracy = totalSolved > 0 ? Math.round((totalCorrect / totalSolved) * 100) : 0;

  const totalDurationMinutes = questionLogs.reduce((acc, q) => acc + getLogDuration(q), 0);
  const avgSpeedPerQuestion = totalSolved > 0 ? (totalDurationMinutes / totalSolved).toFixed(1) : null;

  // Available subjects for dropdown filter
  const availableSubjects = Array.from(new Set(questionLogs.map(l => l.subject))).sort();

  // Chart Data Preparation
  const chartData = React.useMemo(() => {
    let baseLogs = questionLogs;
    if (selectedSubjects.includes('TYT_ALL')) {
      baseLogs = baseLogs.filter(l => l.examType === 'TYT' || l.subject.startsWith('TYT') || YKS_SUBJECTS.TYT.includes(l.subject));
    } else if (selectedSubjects.includes('AYT_ALL')) {
      baseLogs = baseLogs.filter(l => l.examType === 'AYT' || l.subject.startsWith('AYT') || YKS_SUBJECTS.AYT.includes(l.subject));
    } else if (selectedSubjects.includes('TYT_FEN')) {
      baseLogs = baseLogs.filter(l => TYT_FEN_SUBJECTS.includes(l.subject));
    } else if (selectedSubjects.includes('TYT_SOSYAL')) {
      baseLogs = baseLogs.filter(l => TYT_SOSYAL_SUBJECTS.includes(l.subject));
    } else if (selectedSubjects.includes('AYT_FEN')) {
      baseLogs = baseLogs.filter(l => AYT_FEN_SUBJECTS.includes(l.subject));
    } else if (selectedSubjects.includes('AYT_SOSYAL')) {
      baseLogs = baseLogs.filter(l => AYT_SOSYAL_SUBJECTS.includes(l.subject));
    } else if (!selectedSubjects.includes('ALL')) {
      baseLogs = baseLogs.filter(l => selectedSubjects.includes(l.subject));
    }

    const buildBucketItem = (dateLabel: string, fullDate: string, logsForBucket: QuestionLog[]) => {
      const totalSolvedInBucket = logsForBucket.reduce((sum, l) => sum + l.solvedCount, 0);
      const totalNetInBucket = logsForBucket.reduce((sum, l) => sum + l.netScore, 0);
      const totalTimeInBucket = logsForBucket.reduce((sum, l) => sum + getLogDuration(l), 0);

      const item: Record<string, any> = {
        date: dateLabel,
        fullDate,
        'Çözülen': totalSolvedInBucket,
        'Net': Number(totalNetInBucket.toFixed(2)),
        'Süre': totalTimeInBucket
      };

      activeSubjects.forEach(subj => {
        const logsForSubj = logsForBucket.filter(l => l.subject === subj);
        const solved = logsForSubj.reduce((sum, l) => sum + l.solvedCount, 0);
        const net = logsForSubj.reduce((sum, l) => sum + l.netScore, 0);
        const time = logsForSubj.reduce((sum, l) => sum + getLogDuration(l), 0);
        item[subj] = solved;
        item[`Net_${subj}`] = Number(net.toFixed(2));
        item[`Time_${subj}`] = time;
      });

      return item;
    };

    if (chartTimeRange === '7days') {
      return Array.from({ length: 7 }).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        const dateStr = d.toISOString().split('T')[0];
        const logsForDay = baseLogs.filter(l => l.date === dateStr);
        const [, month, day] = dateStr.split('-');
        return buildBucketItem(`${day}/${month}`, dateStr, logsForDay);
      });
    } else if (chartTimeRange === '30days') {
      return Array.from({ length: 30 }).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (29 - i));
        const dateStr = d.toISOString().split('T')[0];
        const logsForDay = baseLogs.filter(l => l.date === dateStr);
        const [, month, day] = dateStr.split('-');
        return buildBucketItem(`${day}/${month}`, dateStr, logsForDay);
      });
    } else {
      return Array.from({ length: 4 }).map((_, i) => {
        const dEnd = new Date();
        dEnd.setDate(dEnd.getDate() - (3 - i) * 7);
        const dStart = new Date(dEnd);
        dStart.setDate(dStart.getDate() - 6);
        
        const endStr = dEnd.toISOString().split('T')[0];
        const startStr = dStart.toISOString().split('T')[0];

        const logsForWeek = baseLogs.filter(l => l.date >= startStr && l.date <= endStr);
        const [, sMonth, sDay] = startStr.split('-');
        const [, eMonth, eDay] = endStr.split('-');

        return buildBucketItem(`${sDay}/${sMonth}-${eDay}/${eMonth}`, `${startStr} to ${endStr}`, logsForWeek);
      });
    }
  }, [questionLogs, chartTimeRange, selectedSubjects, activeSubjects]);

  // Modal live speed preview
  const liveSolvedCount = solvedCount === '' ? 0 : Number(solvedCount);
  const liveCorrectCount = correctCount === '' ? 0 : Number(correctCount);
  const liveWrongCount = wrongCount === '' ? 0 : Number(wrongCount);
  const liveDurationMins = durationMinutes === '' ? 0 : Number(durationMinutes);
  const liveCalculatedNet = Math.max(0, liveCorrectCount - liveWrongCount * 0.25).toFixed(2);
  const liveSpeed = (liveSolvedCount > 0 && liveDurationMins > 0) ? (liveDurationMins / liveSolvedCount).toFixed(1) : null;

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* ── 1. STUNNING HEADER BANNER ── */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-white/10 rounded-3xl p-6 shadow-2xl backdrop-blur-xl">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Soru Takibi & Süre Analiz Paneli</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <CheckSquare className="w-7 h-7 text-emerald-400 shrink-0" />
              <span>Günlük Soru Çözümü & İstatistikler</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Ders ders çözdüğünüz soru sayılarını, çalışma sürelerinizi ve net durumlarınızı kaydedin. Soru başı çözüm hızınızı ve konu gelişim grafiğinizi canlı takip edin.
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0 w-full sm:w-auto">
            <button
              onClick={handleOpenAddModal}
              id="add-question-log-btn"
              className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs sm:text-sm px-6 py-3.5 rounded-2xl shadow-xl shadow-emerald-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center space-x-2 border border-emerald-400/30 cursor-pointer"
            >
              <Plus className="w-5 h-5" />
              <span>Yeni Soru Kaydı Gir</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── 2. KPI CARDS GRID (4 MODERN GLASS CARDS) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Solved Questions */}
        <div className="bg-slate-900/80 border border-slate-800/90 hover:border-emerald-500/40 p-5 rounded-2xl shadow-xl backdrop-blur-md transition-all hover:translate-y-[-2px]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Toplam Soru</span>
            <div className="p-2 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-xl">
              <CheckSquare className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-white font-mono tracking-tight">{totalSolved.toLocaleString('tr-TR')}</div>
            <div className="flex items-center space-x-2 mt-2 text-[11px] font-semibold text-slate-400">
              <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-md font-mono">TYT: {tytSolved}</span>
              <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-md font-mono">AYT: {aytSolved}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Total Study Duration & Speed */}
        <div className="bg-slate-900/80 border border-slate-800/90 hover:border-amber-500/40 p-5 rounded-2xl shadow-xl backdrop-blur-md transition-all hover:translate-y-[-2px]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Çözüm Süresi & Hız</span>
            <div className="p-2 bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-amber-300 font-mono tracking-tight">
              {formatMinutesToHours(totalDurationMinutes)}
            </div>
            <div className="flex items-center space-x-2 mt-2 text-[11px]">
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-0.5 rounded-md font-semibold font-mono inline-flex items-center space-x-1">
                <Zap className="w-3 h-3 inline text-amber-400" />
                <span>{avgSpeedPerQuestion ? `${avgSpeedPerQuestion} dk/soru` : 'Süre girilmedi'}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Accuracy & Breakdown */}
        <div className="bg-slate-900/80 border border-slate-800/90 hover:border-indigo-500/40 p-5 rounded-2xl shadow-xl backdrop-blur-md transition-all hover:translate-y-[-2px]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Doğruluk Oranı</span>
            <div className="p-2 bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 rounded-xl">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-extrabold text-indigo-300 font-mono tracking-tight">%{overallAccuracy}</span>
              <span className="text-xs text-slate-400 font-medium">doğruluk</span>
            </div>
            <div className="flex items-center space-x-1.5 mt-2 text-[11px] font-mono font-semibold">
              <span className="text-emerald-400">{totalCorrect} D</span>
              <span className="text-slate-600">•</span>
              <span className="text-rose-400">{totalWrong} Y</span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-400">{totalEmpty} B</span>
            </div>
          </div>
        </div>

        {/* Card 4: Net Score */}
        <div className="bg-slate-900/80 border border-slate-800/90 hover:border-cyan-500/40 p-5 rounded-2xl shadow-xl backdrop-blur-md transition-all hover:translate-y-[-2px]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Toplam Net Skoru</span>
            <div className="p-2 bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-cyan-300 font-mono tracking-tight">{totalNet.toFixed(2)} Net</div>
            <div className="mt-2 text-[11px] text-slate-400 font-medium truncate">
              {questionLogs.length > 0 ? `Ortalama oturum: ${(totalNet / (questionLogs.length || 1)).toFixed(1)} net` : 'Henüz net kaydı yok'}
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. VISUAL ANALYTICS & CHARTS SECTION ── */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-md space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
          
          {/* Left: Section Title */}
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-xl shadow-md border border-indigo-400/30">
              <BarChart2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Görsel İstatistikler & Grafik Analizleri</h3>
              <p className="text-xs text-slate-400">Çözülen soruları, ders netlerini veya çözüm sürelerini zaman içinde karşılaştırın.</p>
            </div>
          </div>

          {/* Right Controls: Chart Type Selector & Filters */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Chart Mode Buttons */}
            <div className="flex items-center bg-slate-950 p-1 rounded-2xl border border-slate-800">
              <button
                type="button"
                onClick={() => setActiveGraphType('soru')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                  activeGraphType === 'soru'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span>Soru Sayıları</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveGraphType('net')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                  activeGraphType === 'net'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Ders Netleri</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveGraphType('sure')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                  activeGraphType === 'sure'
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Çözüm Süresi</span>
              </button>
            </div>

            {/* Time Range Selector */}
            <select
              value={chartTimeRange}
              onChange={(e) => setChartTimeRange(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-2xl px-3.5 py-2 focus:outline-none focus:border-indigo-500 font-semibold cursor-pointer"
            >
              <option value="7days">Son 7 Gün</option>
              <option value="30days">Son 30 Gün</option>
              <option value="4weeks">Son 4 Hafta</option>
            </select>

            {/* Multi-Select Subject Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsSubjectDropdownOpen(!isSubjectDropdownOpen)}
                className="bg-slate-950 border border-slate-800 hover:border-indigo-500 text-slate-200 text-xs font-bold rounded-2xl px-3.5 py-2 flex items-center justify-between space-x-2 focus:outline-none transition-all cursor-pointer shadow-sm"
              >
                <div className="flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  <span>
                    {selectedSubjects.includes('ALL') 
                      ? 'Tüm Dersler' 
                      : selectedSubjects.includes('TYT_ALL')
                      ? 'Tüm TYT'
                      : selectedSubjects.includes('AYT_ALL')
                      ? 'Tüm AYT'
                      : selectedSubjects.includes('TYT_FEN')
                      ? 'TYT Fen'
                      : selectedSubjects.includes('TYT_SOSYAL')
                      ? 'TYT Sosyal'
                      : selectedSubjects.includes('AYT_FEN')
                      ? 'AYT Fen'
                      : selectedSubjects.includes('AYT_SOSYAL')
                      ? 'AYT Sosyal'
                      : selectedSubjects.length === 1
                      ? selectedSubjects[0]
                      : `${selectedSubjects.length} Ders`}
                  </span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isSubjectDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {isSubjectDropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl z-50 p-4 space-y-3 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-xl">
                  <div className="space-y-1">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">Toplu Filtreler</div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => { setSelectedSubjects(['ALL']); setIsSubjectDropdownOpen(false); }}
                        className={`col-span-2 w-full text-left px-3 py-1.5 rounded-xl text-xs font-bold flex items-center justify-between transition-colors ${selectedSubjects.includes('ALL') ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
                      >
                        <span>Tüm Dersler (Yığılı)</span>
                        {selectedSubjects.includes('ALL') && <Check className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => { setSelectedSubjects(['TYT_ALL']); setIsSubjectDropdownOpen(false); }}
                        className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors ${selectedSubjects.includes('TYT_ALL') ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
                      >
                        <span>Tüm TYT</span>
                        {selectedSubjects.includes('TYT_ALL') && <Check className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setSelectedSubjects(['AYT_ALL']); setIsSubjectDropdownOpen(false); }}
                        className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors ${selectedSubjects.includes('AYT_ALL') ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
                      >
                        <span>Tüm AYT</span>
                        {selectedSubjects.includes('AYT_ALL') && <Check className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="border-t border-slate-800 pt-2 space-y-2 max-h-56 overflow-y-auto custom-scrollbar">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">Ayrı Ders Seçimi</div>
                    {/* TYT List */}
                    <div className="space-y-0.5">
                      <div className="text-[10px] font-bold text-sky-400 px-1 pt-1">TYT Dersleri</div>
                      {YKS_SUBJECTS.TYT.map((s, idx) => {
                        const isChecked = !selectedSubjects.some(key => PRESET_KEYS.includes(key)) && selectedSubjects.includes(s);
                        return (
                          <label key={s} className="flex items-center justify-between px-2 py-1 rounded-xl hover:bg-slate-800 cursor-pointer text-xs">
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleSubject(s)}
                                className="rounded border-slate-700 bg-slate-950 text-indigo-500 focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                              />
                              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: getSubjectColor(s, idx) }} />
                              <span className={isChecked ? 'text-white font-bold' : 'text-slate-300'}>{s}</span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Dynamic Chart Display */}
        <div className="h-80 w-full pt-2">
          {activeGraphType === 'soru' ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomBarTooltip hiddenSubjects={hiddenSubjects} />} />
                <Legend content={(props) => renderInteractiveLegend(props, hiddenSubjects, toggleHiddenSubject)} />
                {activeSubjects.length === 0 ? (
                  <Bar dataKey="Çözülen" fill="#334155" maxBarSize={40} name="Veri Yok" />
                ) : (
                  activeSubjects.map((subj, idx) => (
                    <Bar 
                      key={subj} 
                      dataKey={subj} 
                      stackId="a" 
                      fill={getSubjectColor(subj, idx)} 
                      name={subj} 
                      maxBarSize={44}
                      radius={[4, 4, 0, 0]}
                      hide={hiddenSubjects.includes(subj)}
                    />
                  ))
                )}
              </BarChart>
            </ResponsiveContainer>
          ) : activeGraphType === 'net' ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomLineTooltip hiddenSubjects={hiddenSubjects} />} />
                <Legend content={(props) => renderInteractiveLegend(props, hiddenSubjects, toggleHiddenSubject)} />
                {activeSubjects.length === 0 ? (
                  <Line type="monotone" dataKey="Net" stroke="#334155" strokeWidth={2} name="Net Verisi Yok" dot={false} />
                ) : activeSubjects.length === 1 ? (
                  <Line 
                    type="monotone" 
                    dataKey={`Net_${activeSubjects[0]}`} 
                    stroke={getSubjectColor(activeSubjects[0], 0)} 
                    strokeWidth={3} 
                    name={`${activeSubjects[0]}`}
                    dot={{ fill: getSubjectColor(activeSubjects[0], 0), strokeWidth: 2 }} 
                    activeDot={{ r: 6 }} 
                    hide={hiddenSubjects.includes(activeSubjects[0])}
                  />
                ) : (
                  <>
                    {activeSubjects.map((subj, idx) => (
                      <Line 
                        key={subj}
                        type="monotone" 
                        dataKey={`Net_${subj}`} 
                        stroke={getSubjectColor(subj, idx)} 
                        strokeWidth={2.5} 
                        name={`${subj}`}
                        dot={{ fill: getSubjectColor(subj, idx), strokeWidth: 1.5 }} 
                        activeDot={{ r: 5 }} 
                        hide={hiddenSubjects.includes(subj)}
                      />
                    ))}
                    <Line 
                      type="monotone" 
                      dataKey="Net" 
                      stroke="#f59e0b" 
                      strokeWidth={2.5} 
                      strokeDasharray="4 4"
                      name="Toplam Net" 
                      dot={false}
                      hide={hiddenSubjects.includes('Net') || hiddenSubjects.includes('Toplam Net')}
                    />
                  </>
                )}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            /* Çözüm Süresi & Hız Analizi Chart */
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} unit=" dk" />
                <Tooltip content={<CustomTimeTooltip />} />
                <Bar dataKey="Süre" fill="#f59e0b" maxBarSize={44} name="Toplam Çalışma Süresi (Dakika)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <p className="text-[11px] text-slate-400 italic text-center pt-2 border-t border-slate-800/80 flex items-center justify-center space-x-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 inline shrink-0" />
          <span>
            <strong className="text-slate-300 not-italic">İpucu:</strong> Grafiğin altındaki renkli ders isimlerine basarak istediğiniz dersi gizleyebilir veya açabilirsiniz.
          </span>
        </p>
      </div>

      {/* ── 4. LOGS TABLE WITH LIVE SEARCH & FILTERS ── */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-md space-y-4">
        
        {/* Table Header Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-white text-base">Soru Çözüm Kayıt Geçmişi</h3>
            <span className="text-xs bg-slate-800 text-slate-300 font-mono font-bold px-2.5 py-0.5 rounded-full border border-slate-700">
              {filteredLogs.length} Kayıt
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            {/* Live Search Bar */}
            <div className="relative flex-1 sm:flex-initial min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Ders, not veya tarih ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-2xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-all"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-2.5 text-slate-500 hover:text-white">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Exam Type Filter */}
            <select
              value={filterExamType}
              onChange={(e) => setFilterExamType(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-200 rounded-2xl px-3 py-1.5 focus:outline-none cursor-pointer"
            >
              <option value="ALL">Tüm Sınavlar</option>
              <option value="TYT">Sadece TYT</option>
              <option value="AYT">Sadece AYT</option>
            </select>

            {/* Subject Filter */}
            {availableSubjects.length > 0 && (
              <select
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-200 rounded-2xl px-3 py-1.5 focus:outline-none cursor-pointer"
              >
                <option value="ALL">Tüm Dersler</option>
                {availableSubjects.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Table Body */}
        {filteredLogs.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-slate-800 rounded-2xl space-y-2">
            <HelpCircle className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-xs text-slate-400 font-medium">Arama kriterlerine uygun soru kaydı bulunamadı.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-950/70 text-[11px]">
                  <th className="py-2.5 px-2 rounded-l-2xl whitespace-nowrap">Tarih</th>
                  <th className="py-2.5 px-2 whitespace-nowrap">Ders</th>
                  <th className="py-2.5 px-2 text-center whitespace-nowrap">Çözülen</th>
                  <th className="py-2.5 px-2 text-center text-emerald-400 whitespace-nowrap">Doğru</th>
                  <th className="py-2.5 px-2 text-center text-rose-400 whitespace-nowrap">Yanlış</th>
                  <th className="py-2.5 px-2 text-center text-slate-400 whitespace-nowrap">Boş</th>
                  <th className="py-2.5 px-2 text-center text-indigo-400 font-bold whitespace-nowrap">Net</th>
                  <th className="py-2.5 px-2 text-center text-amber-400 whitespace-nowrap">
                    <div className="inline-flex items-center justify-center space-x-1">
                      <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>Süre & Hız</span>
                    </div>
                  </th>
                  <th className="py-2.5 px-2">Not</th>
                  <th className="py-2.5 px-2 text-right rounded-r-2xl whitespace-nowrap">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {paginatedLogs.map((log, index) => {
                  let dateShort = log.date;
                  let dateFull = log.date;
                  if (log.date) {
                    const d = new Date(log.date + 'T00:00:00');
                    if (!isNaN(d.getTime())) {
                      const dayNum = d.getDate();
                      const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
                      const daysShort = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
                      const dayNameIndex = d.getDay();
                      dateShort = `${dayNum} ${months[d.getMonth()]} ${daysShort[dayNameIndex]}`;
                      dateFull = `${dayNum} ${months[d.getMonth()]} ${d.getFullYear()}`;
                    }
                  }

                  const logDuration = getLogDuration(log);
                  const rowAccuracy = log.solvedCount > 0 ? Math.round((log.correctCount / log.solvedCount) * 100) : 0;
                  const rowSpeed = (logDuration > 0 && log.solvedCount > 0) 
                    ? (logDuration / log.solvedCount).toFixed(1) 
                    : null;

                  return (
                    <tr 
                      key={log.id} 
                      className={`transition-colors hover:bg-slate-800/60 ${
                        index % 2 === 0 ? 'bg-slate-900/40' : 'bg-slate-950/40'
                      }`}
                    >
                      <td className="py-2 px-2 font-mono text-slate-300 cursor-help whitespace-nowrap text-[11px]" title={dateFull}>
                        {dateShort}
                      </td>
                      <td className="py-2 px-2 font-semibold text-white text-[11px] whitespace-nowrap">
                        <div className="flex items-center space-x-1.5">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: getSubjectColor(log.subject) }} />
                          <span>{log.subject}</span>
                        </div>
                      </td>
                      <td className="py-2 px-2 text-center font-mono font-bold text-slate-200 text-xs">
                        {log.solvedCount}
                      </td>
                      <td className="py-2 px-2 text-center font-mono text-emerald-400 font-bold text-xs">{log.correctCount}</td>
                      <td className="py-2 px-2 text-center font-mono text-rose-400 font-semibold text-xs">{log.wrongCount}</td>
                      <td className="py-2 px-2 text-center font-mono text-slate-500 text-xs">{log.emptyCount}</td>
                      <td className="py-2 px-2 text-center font-mono text-indigo-300 font-extrabold text-xs">
                        {log.netScore}
                      </td>
                      <td className="py-2 px-2 text-center font-mono text-amber-300 whitespace-nowrap">
                        <span className="inline-flex items-center space-x-1 bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2 py-0.5 rounded-lg text-[10px] font-semibold" title={rowSpeed ? `Hız: ${rowSpeed} dk/soru` : ''}>
                          <span>{logDuration} dk</span>
                          {rowSpeed && <span className="text-[10px] text-amber-400/80 font-mono">({rowSpeed}dk/soru)</span>}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-slate-400 text-xs" title={log.notes || ''}>
                        {log.notes || '-'}
                      </td>
                      <td className="py-2 px-2 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-0.5">
                          <button
                            onClick={() => handleOpenEditModal(log)}
                            className="p-1 rounded-md text-slate-400 hover:text-indigo-300 hover:bg-indigo-500/20 transition-all cursor-pointer"
                            title="Kaydı Düzenle"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingLog({ id: log.id, title: `${log.date} ${log.subject} (${log.solvedCount} Soru)` })}
                            className="p-1 rounded-md text-slate-400 hover:text-rose-400 hover:bg-rose-500/20 transition-all cursor-pointer"
                            title="Kaydı Sil"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {filteredLogs.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800 text-xs text-slate-400">
            <div className="flex flex-wrap items-center gap-3">
              <span>
                Toplam <strong className="text-white font-mono">{totalLogs}</strong> kayıttan{' '}
                <strong className="text-white font-mono">{startIndex + 1}</strong> -{' '}
                <strong className="text-white font-mono">{endIndex}</strong> arası gösteriliyor
              </span>
              <div className="flex items-center space-x-2 border-l border-slate-800 pl-3">
                <span className="text-[11px] text-slate-400">Sayfa Başına:</span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="bg-slate-950 border border-slate-800 text-slate-300 rounded-xl px-2.5 py-1 text-xs focus:outline-none cursor-pointer"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={safeCurrentPage === 1}
                className="p-1.5 rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-800 disabled:opacity-30 text-slate-300 transition-colors cursor-pointer disabled:cursor-not-allowed"
                title="İlk Sayfa"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={safeCurrentPage === 1}
                className="p-1.5 rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-800 disabled:opacity-30 text-slate-300 transition-colors cursor-pointer disabled:cursor-not-allowed"
                title="Önceki Sayfa"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center space-x-1 px-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - safeCurrentPage) <= 1)
                  .map((p, i, arr) => {
                    const prevPageNum = arr[i - 1];
                    const showEllipsis = prevPageNum && p - prevPageNum > 1;
                    return (
                      <React.Fragment key={p}>
                        {showEllipsis && <span className="text-slate-600 px-1 font-mono">...</span>}
                        <button
                          onClick={() => setCurrentPage(p)}
                          className={`px-3 py-1 rounded-xl font-mono font-bold text-xs transition-all cursor-pointer ${
                            p === safeCurrentPage
                              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                              : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                          }`}
                        >
                          {p}
                        </button>
                      </React.Fragment>
                    );
                  })}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={safeCurrentPage === totalPages}
                className="p-1.5 rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-800 disabled:opacity-30 text-slate-300 transition-colors cursor-pointer disabled:cursor-not-allowed"
                title="Sonraki Sayfa"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={safeCurrentPage === totalPages}
                className="p-1.5 rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-800 disabled:opacity-30 text-slate-300 transition-colors cursor-pointer disabled:cursor-not-allowed"
                title="Son Sayfa"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── 5. REDESIGNED MODAL: ADD / EDIT QUESTION LOG ── */}
      {showAddModal && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in overflow-y-auto"
          onClick={(e) => { if (e.target === e.currentTarget) setShowAddModal(false); }}
        >
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 my-8 relative overflow-hidden">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-2.5">
                <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-2xl shadow-lg shadow-emerald-500/20">
                  <CheckSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">
                    {editingLogId ? 'Soru Çözüm İstatistiğini Düzenle' : 'Yeni Soru Çözüm Kaydı Gir'}
                  </h3>
                  <p className="text-[11px] text-slate-400">Çözdüğünüz soruların net ve süre bilgilerini kaydedin.</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Row 1: Date & Exam Type */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Tarih</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Sınav Türü</label>
                  <select
                    value={examType}
                    onChange={(e) => {
                      const val = e.target.value as 'TYT' | 'AYT';
                      setExamType(val);
                      setSubject(YKS_SUBJECTS[val][0]);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-indigo-500 transition-all cursor-pointer"
                  >
                    <option value="TYT">TYT</option>
                    <option value="AYT">AYT</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Subject */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Ders Seçimi</label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-indigo-500 transition-all cursor-pointer"
                >
                  {YKS_SUBJECTS[examType].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Row 3: Target & Solved Question Counts */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Hedef Soru Sayısı</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Ör: 40"
                    value={targetCount}
                    onChange={(e) => {
                      const val = e.target.value === '' ? '' : Number(e.target.value);
                      setTargetCount(val);
                      if (solvedCount === '') setSolvedCount(val);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Çözülen Soru Sayısı *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="Ör: 40"
                    value={solvedCount}
                    onChange={(e) => {
                      const val = e.target.value === '' ? '' : Number(e.target.value);
                      setSolvedCount(val);
                      if (val !== '' && wrongCount !== '') {
                        const c = correctCount === '' ? 0 : Number(correctCount);
                        const w = Number(wrongCount);
                        setEmptyCount(Math.max(0, Number(val) - (c + w)));
                      }
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all font-mono font-bold"
                  />
                </div>
              </div>

              {/* Quick Question Count Presets */}
              <div className="flex items-center space-x-1.5 text-[11px]">
                <span className="text-slate-400 font-medium">Hızlı Soru Adedi:</span>
                {[20, 30, 40, 50, 100].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => {
                      setTargetCount(num);
                      setSolvedCount(num);
                      if (correctCount === '' && wrongCount === '') {
                        setCorrectCount(num);
                        setWrongCount(0);
                        setEmptyCount(0);
                      }
                    }}
                    className="px-2 py-0.5 rounded-lg bg-slate-950 hover:bg-indigo-600 hover:text-white border border-slate-800 text-slate-300 font-mono font-bold transition-all cursor-pointer"
                  >
                    +{num}
                  </button>
                ))}
              </div>

              {/* Row 4: Correct, Wrong, Empty Counts */}
              <div className="grid grid-cols-3 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-bold text-emerald-400 mb-1">Doğru Sayısı</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={correctCount}
                    onChange={(e) => {
                      const val = e.target.value === '' ? '' : Number(e.target.value);
                      setCorrectCount(val);
                      if (solvedCount !== '' && wrongCount !== '') {
                        const s = Number(solvedCount);
                        const c = val === '' ? 0 : Number(val);
                        const w = Number(wrongCount);
                        setEmptyCount(Math.max(0, s - (c + w)));
                      }
                    }}
                    className="w-full bg-slate-950 border border-emerald-500/40 rounded-2xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-400 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-rose-400 mb-1">Yanlış Sayısı</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={wrongCount}
                    onChange={(e) => {
                      const val = e.target.value === '' ? '' : Number(e.target.value);
                      setWrongCount(val);
                      if (val !== '' && solvedCount !== '') {
                        const s = Number(solvedCount);
                        const c = correctCount === '' ? 0 : Number(correctCount);
                        const w = Number(val);
                        setEmptyCount(Math.max(0, s - (c + w)));
                      } else if (val === '') {
                        setEmptyCount('');
                      }
                    }}
                    className="w-full bg-slate-950 border border-rose-500/40 rounded-2xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-rose-400 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Boş Sayısı</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={emptyCount}
                    onChange={(e) => setEmptyCount(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono font-bold"
                  />
                </div>
              </div>

              {/* Row 5: Duration in Minutes (YENİ ALAN!) */}
              <div className="space-y-1.5 pt-1">
                <label className="block text-xs font-bold text-amber-300 flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Çözme Süresi (Dakika)</span>
                  <span className="text-[10px] text-slate-400 font-normal ml-1">(Opsiyonel - Hız Analizi İçin)</span>
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="Ör: 45 dk"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full bg-slate-950 border border-amber-500/40 rounded-2xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400 font-mono font-bold"
                />

                {/* Quick Duration Presets */}
                <div className="flex items-center space-x-1.5 text-[11px] pt-1">
                  <span className="text-slate-400 font-medium">Hızlı Süre:</span>
                  {[15, 30, 45, 60, 90].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setDurationMinutes(mins)}
                      className="px-2 py-0.5 rounded-lg bg-slate-950 hover:bg-amber-600 hover:text-white border border-slate-800 text-amber-300 font-mono font-bold transition-all cursor-pointer"
                    >
                      {mins} dk
                    </button>
                  ))}
                </div>
              </div>

              {/* Real-Time Live Preview Cards */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 grid grid-cols-2 sm:grid-cols-3 gap-2 text-center">
                <div>
                  <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block">Net Skor</span>
                  <span className="text-base font-extrabold text-indigo-300 font-mono">
                    {liveCalculatedNet} Net
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block">Çözüm Hızı</span>
                  <span className="text-base font-extrabold text-amber-300 font-mono">
                    {liveSpeed ? `${liveSpeed} dk/soru` : '-'}
                  </span>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block">Doğruluk</span>
                  <span className="text-base font-extrabold text-emerald-400 font-mono">
                    %{liveSolvedCount > 0 ? Math.round((liveCorrectCount / liveSolvedCount) * 100) : 0}
                  </span>
                </div>
              </div>

              {/* Row 6: Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Not (Opsiyonel)</label>
                <input
                  type="text"
                  placeholder="Ör: Paragrafta süreye uyuldu, soru bankası sayfa 40."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-bold px-6 py-2.5 rounded-2xl transition-all shadow-lg shadow-emerald-500/25 border border-emerald-400/30 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                >
                  {editingLogId ? 'Değişiklikleri Kaydet' : 'Soru Kaydını Ekle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2-Step Confirmation Modal for Question Log Deletion */}
      <ConfirmDeleteModal
        isOpen={!!deletingLog}
        title="Soru Kaydını Sil"
        itemName={deletingLog?.title}
        onConfirm={() => {
          if (deletingLog) {
            onDeleteLog(deletingLog.id);
            setDeletingLog(null);
          }
        }}
        onClose={() => setDeletingLog(null)}
      />

    </div>
  );
};
