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
  ChevronsRight
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

const CustomBarTooltip = ({ active, payload, label, hiddenSubjects = [] }: any) => {
  if (active && payload && payload.length) {
    const validItems = payload.filter((item: any) => {
      if (item.value === undefined || item.value === null || Number(item.value) <= 0) return false;
      if (item.hide) return false;
      const rawSubj = item.dataKey ? item.dataKey.replace('Net_', '') : '';
      if (hiddenSubjects.includes(rawSubj) || hiddenSubjects.includes(item.dataKey)) return false;
      return true;
    });
    if (validItems.length === 0) return null;

    const totalSolvedOnDay = validItems.reduce((acc: number, item: any) => acc + Number(item.value), 0);

    return (
      <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-2xl text-xs space-y-2 min-w-[150px] z-50">
        <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 space-x-2">
          <span className="font-bold text-slate-200">{label}</span>
          <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-bold px-1.5 py-0.5 rounded">
            Toplam: {totalSolvedOnDay}
          </span>
        </div>
        <div className="space-y-1">
          {validItems.map((entry: any, index: number) => (
            <div key={`bar-tooltip-${index}`} className="flex items-center justify-between space-x-3">
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color || entry.fill }} />
                <span className="text-slate-300 font-medium">{entry.name}:</span>
              </div>
              <span className="font-bold text-white">{entry.value} soru</span>
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
      const rawSubj = item.dataKey ? item.dataKey.replace('Net_', '') : '';
      if (hiddenSubjects.includes(rawSubj) || hiddenSubjects.includes(item.dataKey)) return false;
      return true;
    });
    if (validItems.length === 0) return null;

    return (
      <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-2xl text-xs space-y-2 min-w-[150px] z-50">
        <div className="font-bold text-slate-200 border-b border-slate-800 pb-1.5">
          {label}
        </div>
        <div className="space-y-1">
          {validItems.map((entry: any, index: number) => (
            <div key={`line-tooltip-${index}`} className="flex items-center justify-between space-x-3">
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color || entry.stroke }} />
                <span className="text-slate-300 font-medium">{entry.name}:</span>
              </div>
              <span className="font-bold text-indigo-300">{entry.value} Net</span>
            </div>
          ))}
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
        const rawSubj = (entry.dataKey || entry.value || '').replace('Net_', '').replace(' Net', '');
        const isHidden = hiddenSubjects.includes(rawSubj);
        return (
          <button
            key={`legend-item-${index}`}
            type="button"
            onClick={() => onToggle(rawSubj)}
            title={isHidden ? `${rawSubj} dersini göster` : `${rawSubj} dersini gizle`}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              isHidden 
                ? 'opacity-35 line-through bg-slate-950 text-slate-500 border border-slate-800/80' 
                : 'opacity-100 bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700/80 shadow-sm'
            }`}
          >
            <span 
              className="w-2.5 h-2.5 rounded-full shrink-0 transition-all" 
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
  const [notes, setNotes] = useState('');

  // Filters & Pagination
  const [filterExamType, setFilterExamType] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filterExamType, pageSize]);

  // Chart Filters
  const [chartTimeRange, setChartTimeRange] = useState<'7days' | '30days' | '4weeks'>('7days');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(['ALL']);
  const [hiddenSubjects, setHiddenSubjects] = useState<string[]>([]);
  const [activeGraphType, setActiveGraphType] = useState<'soru' | 'net'>('soru');
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

  // Compute active subjects array for stacked chart series (Only subjects with > 0 solved questions in the current period)
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

    // Determine cutoff date for chart time range
    const d = new Date();
    if (chartTimeRange === '7days') {
      d.setDate(d.getDate() - 6);
    } else if (chartTimeRange === '30days') {
      d.setDate(d.getDate() - 29);
    } else {
      d.setDate(d.getDate() - 27);
    }
    const cutoffDateStr = d.toISOString().split('T')[0];

    // Filter candidate subjects to those with > 0 solved questions in the period
    const nonZeroSubjects = candidateSubjects.filter(subj => {
      const logsForSubj = questionLogs.filter(l => l.subject === subj && l.date >= cutoffDateStr);
      const totalSolved = logsForSubj.reduce((sum, l) => sum + l.solvedCount, 0);
      return totalSolved > 0;
    });

    return nonZeroSubjects;
  }, [selectedSubjects, questionLogs, chartTimeRange]);

  // Reset hidden subjects when selectedSubjects, activeGraphType or activeSubjects changes
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
        notes
      });
    }

    setTargetCount('');
    setSolvedCount('');
    setCorrectCount('');
    setWrongCount('');
    setEmptyCount('');
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
    setNotes(log.notes || '');
    setEditingLogId(log.id);
    setShowAddModal(true);
  };

  const filteredLogs = questionLogs.filter((log) => {
    if (filterExamType === 'ALL') return true;
    return log.examType === filterExamType;
  });

  const totalLogs = filteredLogs.length;
  const totalPages = Math.ceil(totalLogs / pageSize) || 1;
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalLogs);
  const paginatedLogs = filteredLogs.slice(startIndex, endIndex);

  const totalSolved = questionLogs.reduce((acc, q) => acc + q.solvedCount, 0);
  const totalCorrect = questionLogs.reduce((acc, q) => acc + q.correctCount, 0);
  const totalWrong = questionLogs.reduce((acc, q) => acc + q.wrongCount, 0);
  const overallAccuracy = totalSolved > 0 ? Math.round((totalCorrect / totalSolved) * 100) : 0;

  // Chart Data Preparation (Supports Multi-Subject Stacked Breakdown)
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

      const item: Record<string, any> = {
        date: dateLabel,
        fullDate,
        'Çözülen': totalSolvedInBucket,
        'Net': Number(totalNetInBucket.toFixed(2))
      };

      activeSubjects.forEach(subj => {
        const logsForSubj = logsForBucket.filter(l => l.subject === subj);
        const solved = logsForSubj.reduce((sum, l) => sum + l.solvedCount, 0);
        const net = logsForSubj.reduce((sum, l) => sum + l.netScore, 0);
        item[subj] = solved;
        item[`Net_${subj}`] = Number(net.toFixed(2));
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
      // 4 weeks
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

  return (
    <div className="space-y-6">
      
      {/* Title & Quick Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-5 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center space-x-2">
            <CheckSquare className="w-5 h-5 text-emerald-400" />
            <span>Günlük Soru Takibi & Net İstatistikleri</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Çözdüğünüz soru, doğru/yanlış/boş sayılarını ve net hesaplamasını ders ders kaydedin. Haftalık gelişiminizi takip edin.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          id="add-question-log-btn"
          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Yeni Soru Kaydı Gir</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-center">
          <div className="text-xs text-slate-400 font-medium">Toplam Çözülen Soru</div>
          <div className="text-2xl font-bold text-white font-mono mt-1">{totalSolved}</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-center">
          <div className="text-xs text-slate-400 font-medium">Doğruluk Oranı (%)</div>
          <div className="text-2xl font-bold text-emerald-400 font-mono mt-1">%{overallAccuracy}</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-center">
          <div className="text-xs text-slate-400 font-medium">Toplam Doğru / Yanlış</div>
          <div className="text-2xl font-bold text-indigo-400 font-mono mt-1">
            {totalCorrect} D / <span className="text-rose-400">{totalWrong} Y</span>
          </div>
        </div>
      </div>

      {/* Chart Filters Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <BarChart2 className="w-5 h-5 text-indigo-400" />
            <span className="text-sm font-bold text-white">Grafik Görünümü & Ders Karşılaştırma</span>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <select
              value={chartTimeRange}
              onChange={(e) => setChartTimeRange(e.target.value as any)}
              className="bg-slate-950 border border-slate-700 text-slate-300 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 w-full sm:w-auto"
            >
              <option value="7days">Son 7 Gün</option>
              <option value="30days">Aylık (Son 30 Gün)</option>
              <option value="4weeks">Hafta Hafta (Son 4 Hafta)</option>
            </select>

            {/* Multi-Select Subject Dropdown */}
            <div className="relative w-full sm:w-auto" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsSubjectDropdownOpen(!isSubjectDropdownOpen)}
                className="w-full sm:w-auto bg-slate-950 border border-slate-700 hover:border-indigo-500 text-slate-200 text-xs font-semibold rounded-xl px-3.5 py-2 flex items-center justify-between space-x-2 focus:outline-none transition-all shadow-sm"
              >
                <div className="flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  <span>
                    {selectedSubjects.includes('ALL') 
                      ? 'Tüm Dersler (Yığılı)' 
                      : selectedSubjects.includes('TYT_ALL')
                      ? 'Tüm TYT Dersleri'
                      : selectedSubjects.includes('AYT_ALL')
                      ? 'Tüm AYT Dersleri'
                      : selectedSubjects.includes('TYT_FEN')
                      ? 'TYT Fen Dersleri'
                      : selectedSubjects.includes('TYT_SOSYAL')
                      ? 'TYT Sosyal Dersleri'
                      : selectedSubjects.includes('AYT_FEN')
                      ? 'AYT Fen Dersleri'
                      : selectedSubjects.includes('AYT_SOSYAL')
                      ? 'AYT Sosyal Dersleri'
                      : selectedSubjects.length === 1
                      ? selectedSubjects[0]
                      : `${selectedSubjects.length} Ders Seçildi`}
                  </span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isSubjectDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Multi-Select Menu */}
              {isSubjectDropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50 p-3 space-y-3 animate-in fade-in zoom-in-95 duration-150">
                  
                  {/* Preset Buttons */}
                  <div className="space-y-1">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">Toplu Filtreler</div>
                    <div className="grid grid-cols-2 gap-1">
                      <button
                        type="button"
                        onClick={() => { setSelectedSubjects(['ALL']); setIsSubjectDropdownOpen(false); }}
                        className={`col-span-2 w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors ${selectedSubjects.includes('ALL') ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
                      >
                        <span>Tüm Dersler (Yığılı)</span>
                        {selectedSubjects.includes('ALL') && <Check className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => { setSelectedSubjects(['TYT_ALL']); setIsSubjectDropdownOpen(false); }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors ${selectedSubjects.includes('TYT_ALL') ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
                      >
                        <span>Tüm TYT</span>
                        {selectedSubjects.includes('TYT_ALL') && <Check className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setSelectedSubjects(['AYT_ALL']); setIsSubjectDropdownOpen(false); }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors ${selectedSubjects.includes('AYT_ALL') ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
                      >
                        <span>Tüm AYT</span>
                        {selectedSubjects.includes('AYT_ALL') && <Check className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => { setSelectedSubjects(['TYT_FEN']); setIsSubjectDropdownOpen(false); }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors ${selectedSubjects.includes('TYT_FEN') ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
                      >
                        <span>TYT Fen</span>
                        {selectedSubjects.includes('TYT_FEN') && <Check className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setSelectedSubjects(['AYT_FEN']); setIsSubjectDropdownOpen(false); }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors ${selectedSubjects.includes('AYT_FEN') ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
                      >
                        <span>AYT Fen</span>
                        {selectedSubjects.includes('AYT_FEN') && <Check className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => { setSelectedSubjects(['TYT_SOSYAL']); setIsSubjectDropdownOpen(false); }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors ${selectedSubjects.includes('TYT_SOSYAL') ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
                      >
                        <span>TYT Sosyal</span>
                        {selectedSubjects.includes('TYT_SOSYAL') && <Check className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setSelectedSubjects(['AYT_SOSYAL']); setIsSubjectDropdownOpen(false); }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors ${selectedSubjects.includes('AYT_SOSYAL') ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
                      >
                        <span>AYT Sosyal</span>
                        {selectedSubjects.includes('AYT_SOSYAL') && <Check className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Individual Checkbox Selection */}
                  <div className="border-t border-slate-800 pt-2 space-y-2 max-h-56 overflow-y-auto custom-scrollbar">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ayrı Ders Seçimi (Çoklu)</span>
                      {!selectedSubjects.some(s => PRESET_KEYS.includes(s)) && (
                        <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded-md">
                          {selectedSubjects.length} seçili
                        </span>
                      )}
                    </div>

                    {/* TYT Group */}
                    <div className="space-y-0.5">
                      <div className="text-[10px] font-bold text-sky-400 px-1 pt-1">TYT Dersleri</div>
                      {YKS_SUBJECTS.TYT.map((s, idx) => {
                        const isChecked = !selectedSubjects.some(key => PRESET_KEYS.includes(key)) && selectedSubjects.includes(s);
                        return (
                          <label key={s} className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-slate-800 cursor-pointer text-xs">
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

                    {/* AYT Group */}
                    <div className="space-y-0.5 pt-1.5 border-t border-slate-800/60">
                      <div className="text-[10px] font-bold text-fuchsia-400 px-1">AYT Dersleri</div>
                      {YKS_SUBJECTS.AYT.map((s, idx) => {
                        const isChecked = !selectedSubjects.some(key => PRESET_KEYS.includes(key)) && selectedSubjects.includes(s);
                        return (
                          <label key={s} className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-slate-800 cursor-pointer text-xs">
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

        {/* Grafik Türü Seçeneği */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-slate-800/60">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-300">Grafik Türü:</span>
          </div>
          <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setActiveGraphType('soru')}
              className={`flex-1 sm:flex-initial text-center px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeGraphType === 'soru'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10 font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              Günlük Soru Sayıları
            </button>
            <button
              type="button"
              onClick={() => setActiveGraphType('net')}
              className={`flex-1 sm:flex-initial text-center px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeGraphType === 'net'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10 font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              Ders Net Sayıları
            </button>
          </div>
        </div>

        {/* Selected Subjects Badges */}
        {!selectedSubjects.some(s => PRESET_KEYS.includes(s)) && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-800/80">
            <span className="text-xs text-slate-400 font-medium mr-1">Karşılaştırılan Dersler:</span>
            {selectedSubjects.map((s, idx) => (
              <span key={s} className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs bg-slate-800 border border-slate-700 text-slate-200">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getSubjectColor(s, idx) }} />
                <span className="font-semibold">{s}</span>
                <button onClick={() => toggleSubject(s)} className="text-slate-400 hover:text-rose-400 transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            <button
              onClick={() => setSelectedSubjects(['ALL'])}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold underline ml-1"
            >
              Temizle
            </button>
          </div>
        )}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-4">
        {activeGraphType === 'soru' ? (
          /* Stacked Bar Chart - Solved Questions */
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <BarChart2 className="w-4 h-4 text-emerald-400" />
                  <span>Çözülen Soru Sayısı (Yığılı Sütun)</span>
                </h3>
                <span className="text-[11px] text-slate-400 font-medium bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                  {activeSubjects.length} Ders Yığılı
                </span>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                    <XAxis dataKey="date" stroke="var(--chart-axis)" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--chart-axis)" fontSize={11} tickLine={false} axisLine={false} />
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
                          maxBarSize={40} 
                          hide={hiddenSubjects.includes(subj)}
                        />
                      ))
                    )}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 italic text-center mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-center space-x-1.5">
              <span>💡</span>
              <span>
                <strong className="text-slate-300 not-italic">İpucu:</strong> Grafiğin altındaki ders isimlerine basarak istediğiniz dersi gizleyebilir veya açabilirsiniz.
              </span>
            </p>
          </div>
        ) : (
          /* Line Chart - Net Score */
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <BarChart2 className="w-4 h-4 text-indigo-400" />
                  <span>Ders Bazlı Net Karşılaştırması</span>
                </h3>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                    <XAxis dataKey="date" stroke="var(--chart-axis)" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--chart-axis)" fontSize={11} tickLine={false} axisLine={false} />
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
                          stroke={theme === 'light' ? '#000000' : '#e2e8f0'} 
                          strokeWidth={2} 
                          strokeDasharray="4 4"
                          name="Toplam Net" 
                          dot={false}
                          hide={hiddenSubjects.includes('Net') || hiddenSubjects.includes('Toplam Net')}
                        />
                      </>
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 italic text-center mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-center space-x-1.5">
              <span>💡</span>
              <span>
                <strong className="text-slate-300 not-italic">İpucu:</strong> Grafiğin altındaki renkli ders isimlerine basarak istediğiniz dersi gizleyebilir veya açabilirsiniz.
              </span>
            </p>
          </div>
        )}
      </div>

      {/* Logs Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        
        {/* Table Filter */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-white">Soru Kayıt Geçmişi</span>
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={filterExamType}
              onChange={(e) => setFilterExamType(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
            >
              <option value="ALL">Tüm Sınavlar (TYT & AYT)</option>
              <option value="TYT">Sadece TYT</option>
              <option value="AYT">Sadece AYT</option>
            </select>
          </div>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-slate-800 rounded-xl">
            <p className="text-xs text-slate-400">Henüz soru kaydı bulunmuyor.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-950/70">
                  <th className="p-3 rounded-l-lg">Tarih</th>
                  <th className="p-3">Sınav</th>
                  <th className="p-3">Ders</th>
                  <th className="p-3 text-center">Soru</th>
                  <th className="p-3 text-center text-emerald-400">Doğru</th>
                  <th className="p-3 text-center text-rose-400">Yanlış</th>
                  <th className="p-3 text-center text-slate-400">Boş</th>
                  <th className="p-3 text-center text-indigo-400 font-bold">Net</th>
                  <th className="p-3">Not</th>
                  <th className="p-3 text-right rounded-r-lg">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {paginatedLogs.map((log, index) => {
                  // Format Date
                  let dateShort = log.date;
                  let dateFull = log.date;
                  if (log.date) {
                    const d = new Date(log.date + 'T00:00:00');
                    if (!isNaN(d.getTime())) {
                      const dayNum = d.getDate();
                      const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
                      const daysShort = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
                      const daysFull = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
                      const dayNameIndex = d.getDay(); // 0 is Sunday
                      const dayNameFull = dayNameIndex === 0 ? 'Pazar' : daysFull[dayNameIndex - 1];

                      dateShort = `${dayNum} ${months[d.getMonth()]}, ${daysShort[dayNameIndex]}`;
                      const pad = (n: number) => n.toString().padStart(2, '0');
                      dateFull = `${pad(dayNum)}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${dayNameFull}`;
                    }
                  }

                  return (
                    <tr 
                      key={log.id} 
                      className={`transition-colors hover:bg-slate-800/60 ${
                        index % 2 === 0 ? 'bg-slate-900/50' : 'bg-slate-950/40'
                      }`}
                    >
                      <td className="p-3 font-mono text-slate-300 cursor-help whitespace-nowrap" title={dateFull}>
                        {dateShort}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.examType === 'TYT' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        }`}>
                          {log.examType}
                        </span>
                      </td>
                      <td className="p-3 font-semibold text-white">{log.subject}</td>
                      <td 
                        className="p-3 text-center font-mono text-white font-bold cursor-help"
                        title={`Hedef: ${log.targetCount} Çözülen: ${log.solvedCount}`}
                      >
                        {log.solvedCount}
                      </td>
                      <td className="p-3 text-center font-mono text-emerald-400 font-bold">{log.correctCount}</td>
                      <td className="p-3 text-center font-mono text-rose-400">{log.wrongCount}</td>
                      <td className="p-3 text-center font-mono text-slate-400">{log.emptyCount}</td>
                      <td className="p-3 text-center font-mono text-indigo-400 font-extrabold text-sm">
                        {log.netScore}
                      </td>
                      <td className="p-3 text-slate-400 truncate max-w-[160px]" title={log.notes || ''}>{log.notes || '-'}</td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleOpenEditModal(log)}
                            className="text-slate-500 hover:text-indigo-400 transition-colors p-1 cursor-pointer"
                            title="Kaydı Düzenle"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingLog({ id: log.id, title: `${log.date} ${log.subject} (${log.solvedCount} Soru)` })}
                            className="text-slate-500 hover:text-rose-400 transition-colors p-1 cursor-pointer"
                            title="Kaydı Sil"
                          >
                            <Trash2 className="w-4 h-4" />
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
                  className="bg-slate-950 border border-slate-800 text-slate-300 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              {/* First Page */}
              <button
                onClick={() => setCurrentPage(1)}
                disabled={safeCurrentPage === 1}
                className="p-1.5 rounded-lg border border-slate-800 bg-slate-950 hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-slate-950 text-slate-300 transition-colors cursor-pointer disabled:cursor-not-allowed"
                title="İlk Sayfa"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>

              {/* Prev Page */}
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={safeCurrentPage === 1}
                className="p-1.5 rounded-lg border border-slate-800 bg-slate-950 hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-slate-950 text-slate-300 transition-colors cursor-pointer disabled:cursor-not-allowed"
                title="Önceki Sayfa"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Page Numbers */}
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
                          className={`px-3 py-1 rounded-lg font-mono font-bold text-xs transition-all cursor-pointer ${
                            p === safeCurrentPage
                              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                              : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                          }`}
                        >
                          {p}
                        </button>
                      </React.Fragment>
                    );
                  })}
              </div>

              {/* Next Page */}
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={safeCurrentPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-800 bg-slate-950 hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-slate-950 text-slate-300 transition-colors cursor-pointer disabled:cursor-not-allowed"
                title="Sonraki Sayfa"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              {/* Last Page */}
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={safeCurrentPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-800 bg-slate-950 hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-slate-950 text-slate-300 transition-colors cursor-pointer disabled:cursor-not-allowed"
                title="Son Sayfa"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Modal: Add Question Log */}
      {showAddModal && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowAddModal(false); }}
        >
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">{editingLogId ? 'Günlük Soru İstatistiğini Düzenle' : 'Günlük Soru İstatistiği Ekle'}</h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Tarih</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Sınav Türü</label>
                  <select
                    value={examType}
                    onChange={(e) => {
                      const val = e.target.value as 'TYT' | 'AYT';
                      setExamType(val);
                      setSubject(YKS_SUBJECTS[val][0]);
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="TYT">TYT</option>
                    <option value="AYT">AYT</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Ders</label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                >
                  {YKS_SUBJECTS[examType].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Hedef Soru</label>
                  <input
                    type="number"
                    min="1"
                    value={targetCount}
                    onChange={(e) => {
                      const val = e.target.value === '' ? '' : Number(e.target.value);
                      setTargetCount(val);
                      setSolvedCount(val);
                      if (val !== '' && wrongCount !== '') {
                        const c = correctCount === '' ? 0 : Number(correctCount);
                        const w = Number(wrongCount);
                        setEmptyCount(Math.max(0, Number(val) - (c + w)));
                      }
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Çözülen Toplam</label>
                  <input
                    type="number"
                    min="1"
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
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-emerald-400 mb-1">Doğru Sayısı</label>
                  <input
                    type="number"
                    min="0"
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
                    className="w-full bg-slate-800 border border-emerald-500/40 rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-rose-400 mb-1">Yanlış Sayısı</label>
                  <input
                    type="number"
                    min="0"
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
                    className="w-full bg-slate-800 border border-rose-500/40 rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Boş Sayısı</label>
                  <input
                    type="number"
                    min="0"
                    value={emptyCount}
                    onChange={(e) => setEmptyCount(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Live Calculated Net Preview */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                <span className="text-xs text-slate-400">Hesaplanan Net Score: </span>
                <span className="text-base font-extrabold text-indigo-400 font-mono ml-2">
                  {(Math.max(0, (correctCount === '' ? 0 : Number(correctCount)) - (wrongCount === '' ? 0 : Number(wrongCount)) * 0.25)).toFixed(2)} Net
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Not (Opsiyonel)</label>
                <input
                  type="text"
                  placeholder="Ör: Paragrafta süreye uyuldu."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-5 py-2 rounded-xl transition-all shadow-md shadow-emerald-600/30"
                >
                  Kaydet
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
