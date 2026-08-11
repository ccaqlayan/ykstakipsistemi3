import React, { useState } from 'react';
import { 
  Target, 
  Plus, 
  Trash2, 
  Edit2,
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Filter, 
  BookOpen,
  Star,
  Sparkles,
  X,
  Camera,
  UploadCloud,
  Maximize2,
  Loader2,
  Image as ImageIcon,
  BarChart2,
  TrendingUp,
  PieChart as PieChartIcon,
  Award,
  Zap,
  Activity,
  Layers,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Link,
  Brain,
  HelpCircle,
  ArrowLeft
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell, 
  AreaChart, 
  Area,
  ReferenceLine
} from 'recharts';
import { BranchExam, TopicErrorItem, ErrorReason, GeneralMockExam, ResourceItem, AuditLogItem, UserAccount } from '../types';
import { YKS_SUBJECTS, YKS_CURRICULUM_TOPICS, ERROR_REASON_LABELS } from '../data/initialData';
import { uploadQuestionErrorImage } from '../services/storageUpload';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { BranchAnalyticsTab } from './branch/BranchAnalyticsTab';
import { BranchErrorsTab } from './branch/BranchErrorsTab';
import { BranchListTab } from './branch/BranchListTab';
import { BranchModals } from './branch/BranchModals';

const ERROR_REASON_COLORS: Record<string, string> = {
  'bilgi_eksigi': '#ef4444',      // Red
  'dikkat_hatasi': '#f59e0b',     // Amber
  'zaman_yetmedi': '#3b82f6',     // Blue
  'iki_sik_arasinda': '#a855f7',  // Purple
  'soru_kokunu_yanlis_okuma': '#10b981', // Emerald
};

const SUBJECT_COLORS: Record<string, string> = {
  'TYT Türkçe': '#3b82f6',
  'TYT Matematik': '#10b981',
  'TYT Geometri': '#f97316',
  'TYT Fizik': '#ef4444',
  'TYT Kimya': '#06b6d4',
  'TYT Biyoloji': '#84cc16',
  'TYT Tarih': '#b45309',
  'TYT Coğrafya': '#0284c7',
  'TYT Felsefe': '#64748b',
  'TYT Din Kültürü': '#14b8a6',
  'Paragraf': '#ec4899',
  'AYT Matematik': '#6366f1',
  'AYT Geometri': '#eab308',
  'AYT Fizik': '#dc2626',
  'AYT Kimya': '#0d9488',
  'AYT Biyoloji': '#22c55e',
  'AYT Edebiyat': '#f43f5e',
  'AYT Tarih-1': '#8b5cf6',
  'AYT Tarih-2': '#a855f7',
  'AYT Coğrafya-1': '#0284c7',
  'AYT Coğrafya-2': '#0284c7',
  'AYT Felsefe Grubu': '#d946ef',
};

const DEFAULT_CHART_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#8b5cf6', '#3b82f6'];

// Client-side automatic image compression helper (max 1000px dimension, ~50-100KB output)
const compressImageFile = (file: File, maxDimension = 1000, quality = 0.65): Promise<{ dataUrl: string; originalKb: number; compressedKb: number }> => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Lütfen geçerli bir görsel dosyası (JPG, PNG vb.) seçin.'));
      return;
    }
    const originalKb = Math.round(file.size / 1024);
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Görsel dosyası okunamadı.'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Görsel işlenemedi.'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Sıkıştırma tuvali oluşturulamadı.'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        const compressedKb = Math.round((dataUrl.length * 3) / 4 / 1024);
        resolve({ dataUrl, originalKb, compressedKb });
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};

const parseCellContent = (content: string) => {
  const segments = content.split('<br>');
  return segments.map((seg, segIdx) => {
    const parts = seg.split('**');
    const elements = parts.map((part, i) => {
      if (i % 2 === 1) {
        return <strong key={i} className="text-amber-300 font-extrabold">{part}</strong>;
      }
      return part;
    });
    return (
      <div key={segIdx} className="py-0.5">
        {elements}
      </div>
    );
  });
};

const formatAnalysisTable = (text: string) => {
  if (!text || !text.includes('|')) {
    return <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">{text}</p>;
  }

  const lines = text.split('\n');
  const rows: string[][] = [];

  lines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed.startsWith('|')) {
      if (trimmed.includes('---')) {
        return; // skip separator row
      }
      const cells = trimmed
        .split('|')
        .map(c => c.trim())
        .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1); // remove outer empty elements
      if (cells.length > 0) {
        rows.push(cells);
      }
    }
  });

  if (rows.length === 0) {
    return <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">{text}</p>;
  }

  const header = rows[0];
  const bodyRows = rows.slice(1);

  return (
    <div className="overflow-x-auto w-full border border-slate-800 rounded-xl bg-slate-900/60 shadow-lg my-3">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-950 border-b border-slate-800">
            {header.map((cell, idx) => (
              <th key={idx} className="p-3 text-xs font-bold text-indigo-300 uppercase tracking-wider">
                {cell.replace(/\*\*/g, '')}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60">
          {bodyRows.map((row, rowIdx) => (
            <tr key={rowIdx} className="hover:bg-slate-900/30 transition-colors">
              {row.map((cell, cellIdx) => (
                <td key={cellIdx} className={`p-3 text-xs leading-relaxed font-medium ${cellIdx === 0 ? 'text-indigo-400 font-semibold bg-slate-950/20 w-1/3' : 'text-slate-200'}`}>
                  {parseCellContent(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

interface BranchExamViewProps {
  currentUser?: UserAccount;
  mode?: 'errors' | 'branches';
  branchExams: BranchExam[];
  topicErrors: TopicErrorItem[];
  generalMocks?: GeneralMockExam[];
  resources?: ResourceItem[];
  onAddBranchExam: (exam: Omit<BranchExam, 'id'>) => void;
  onUpdateBranchExam?: (exam: BranchExam) => void;
  onDeleteBranchExam: (id: string) => void;
  onAddTopicError: (err: Omit<TopicErrorItem, 'id'>) => void;
  onUpdateTopicError: (err: TopicErrorItem) => void;
  onDeleteTopicError: (id: string) => void;
  topicTipsCache?: Record<string, { mistakes: Array<{ mistake: string; correction: string }>; tips: string[] }>;
  onUpdateTopicTipsCache?: (cacheKey: string, data: { mistakes: Array<{ mistake: string; correction: string }>; tips: string[] }) => void;
  theme?: 'dark' | 'light';
  onAddAuditLog?: (
    description: string,
    category: AuditLogItem['category'],
    actionType: string,
    undoFn?: () => void,
    targetUserId?: string,
    targetUserName?: string,
    metadata?: Record<string, any>
  ) => void;
}

const CustomChartTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900/95 border border-slate-700/80 backdrop-blur-md p-3 rounded-xl shadow-xl text-xs space-y-1.5 z-50 min-w-[180px]">
        <div className="font-bold text-white border-b border-slate-800 pb-1 flex justify-between items-center gap-2">
          <span>{data.subject || data.name || data.displayLabel || label}</span>
          {data.examType && (
            <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">
              {data.examType}
            </span>
          )}
        </div>
        {data.publisher && (
          <p className="text-[11px] text-slate-400 italic">{data.publisher}</p>
        )}
        {data.date && (
          <p className="text-[10px] text-slate-400 font-mono">Tarih: {data.date}</p>
        )}
        {(data.net !== undefined || data.avgNet !== undefined || data.count !== undefined) && (
          <div className="pt-1 flex items-center justify-between text-indigo-300 font-extrabold text-xs">
            <span>{data.net !== undefined ? 'Net:' : data.avgNet !== undefined ? 'Ort. Net:' : 'Hata Sayısı:'}</span>
            <span className="text-sm">
              {data.net !== undefined 
                ? String(data.net).replace('.', ',') 
                : data.avgNet !== undefined 
                ? String(data.avgNet).replace('.', ',') 
                : data.count}
            </span>
          </div>
        )}
        {data.correct !== undefined && (
          <div className="flex items-center justify-between text-[11px] text-slate-300 pt-0.5 border-t border-slate-800/80">
            <span className="text-emerald-400 font-semibold">D: {data.correct}</span>
            <span className="text-rose-400 font-semibold">Y: {data.wrong}</span>
            <span className="text-slate-400 font-semibold">B: {data.empty}</span>
          </div>
        )}
        {data.durationMinutes ? (
          <p className="text-[10px] text-slate-400 font-mono pt-0.5">Süre: {data.durationMinutes} dk</p>
        ) : null}
        {data.maxNet !== undefined && (
          <p className="text-[10px] text-emerald-400 font-mono">En Yüksek Net: {data.maxNet}</p>
        )}
      </div>
    );
  }
  return null;
};

export const BranchExamView: React.FC<BranchExamViewProps> = ({
  currentUser,
  mode,
  branchExams,
  topicErrors,
  generalMocks = [],
  resources = [],
  onAddBranchExam,
  onUpdateBranchExam,
  onDeleteBranchExam,
  onAddTopicError,
  onUpdateTopicError,
  onDeleteTopicError,
  topicTipsCache,
  onUpdateTopicTipsCache,
  theme,
  onAddAuditLog
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'analytics' | 'branch_list' | 'errors'>(
    mode === 'branches' ? 'analytics' : mode === 'errors' ? 'errors' : 'analytics'
  );

  React.useEffect(() => {
    if (mode) {
      setActiveSubTab(mode === 'branches' ? 'analytics' : 'errors');
    }
  }, [mode]);

  // Chart Filters
  const [chartExamType, setChartExamType] = useState<'ALL' | 'TYT' | 'AYT'>('ALL');
  const [chartSubject, setChartSubject] = useState<string>('ALL');
  const [chartLimit, setChartLimit] = useState<'10' | '30' | 'ALL'>('10');

  React.useEffect(() => {
    if (chartExamType === 'TYT') {
      const isTyt = YKS_SUBJECTS.TYT.includes(chartSubject) || 
                    branchExams.some(e => e.subject === chartSubject && e.examType === 'TYT');
      if (chartSubject !== 'ALL' && !isTyt) {
        setChartSubject('ALL');
      }
    } else if (chartExamType === 'AYT') {
      const isAyt = YKS_SUBJECTS.AYT.includes(chartSubject) || 
                    branchExams.some(e => e.subject === chartSubject && e.examType === 'AYT');
      if (chartSubject !== 'ALL' && !isAyt) {
        setChartSubject('ALL');
      }
    }
  }, [chartExamType, chartSubject, branchExams]);

  // Branch Exam History List Filters & Pagination
  const [listSubjectFilter, setListSubjectFilter] = useState<string>('ALL');
  const [listCurrentPage, setListCurrentPage] = useState<number>(1);
  const [showAddExamModal, setShowAddExamModal] = useState(false);
  const [showAddErrorModal, setShowAddErrorModal] = useState(false);
  const [editingError, setEditingError] = useState<TopicErrorItem | null>(null);
  const [editingExam, setEditingExam] = useState<BranchExam | null>(null);
  const [deletingItem, setDeletingItem] = useState<{ type: 'error' | 'exam'; id: string; title: string } | null>(null);

  // Branch Exam Form
  const [examDate, setExamDate] = useState(new Date().toISOString().split('T')[0]);
  const [examSubject, setExamSubject] = useState(YKS_SUBJECTS.AYT[0]);
  const [examType, setExamType] = useState<'TYT' | 'AYT'>('AYT');
  const [publisher, setPublisher] = useState('');
  const [correct, setCorrect] = useState<number | string>('');
  const [wrong, setWrong] = useState<number | string>('');
  const [empty, setEmpty] = useState<number | string>('');
  const [durationMinutes, setDurationMinutes] = useState<number | string>('');
  const [isAnalyzed, setIsAnalyzed] = useState<boolean>(false);

  // Helper for input sanitization (convert dot to comma for display, remove leading zero like 015 -> 15)
  const sanitizeNetInput = (rawVal: string): string => {
    if (rawVal === '' || rawVal === null || rawVal === undefined) return '';
    let cleaned = String(rawVal).replace(/\./g, ',');
    cleaned = cleaned.replace(/[^0-9,-]/g, '');

    if (cleaned.indexOf('-') > 0) {
      cleaned = cleaned.charAt(0) + cleaned.slice(1).replace(/-/g, '');
    }

    const parts = cleaned.split(',');
    if (parts.length > 2) {
      cleaned = parts[0] + ',' + parts.slice(1).join('');
    }

    if (/^-?0+[1-9]/.test(cleaned)) {
      cleaned = cleaned.replace(/^(-?)0+([1-9])/, '$1$2');
    } else if (/^-?00+$/.test(cleaned)) {
      cleaned = cleaned.replace(/^(-?)0+$/, '$10');
    } else if (/^-?00+,/.test(cleaned)) {
      cleaned = cleaned.replace(/^(-?)0+,/, '$10,');
    }

    return cleaned;
  };

  const parseNetVal = (val: number | string): number => {
    if (val === '' || val === undefined || val === null) return 0;
    const num = Number(String(val).replace(',', '.'));
    return isNaN(num) ? 0 : num;
  };

  // Topic Error Form
  const [errorSubject, setErrorSubject] = useState('');
  const [topicName, setTopicName] = useState('');
  const [isCustomTopic, setIsCustomTopic] = useState(false);
  const [errorPublisher, setErrorPublisher] = useState('');
  const [selectedExamRef, setSelectedExamRef] = useState<string>('other');
  const [errorReason, setErrorReason] = useState<ErrorReason>('' as any);
  const [priority, setPriority] = useState<string | number>(5);
  const [solutionNotes, setSolutionNotes] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiFeedback, setAiFeedback] = useState('');
  const [aiSuccess, setAiSuccess] = useState(false);
  const [aiButtonFaded, setAiButtonFaded] = useState(false);
  const [activeAiFeedbackId, setActiveAiFeedbackId] = useState<string | null>(null);
  const [revisingIds, setRevisingIds] = useState<Record<string, boolean>>({});
  const [fadingOutIds, setFadingOutIds] = useState<Record<string, boolean>>({});

  // Photo Upload State
  const [errorImageUrl, setErrorImageUrl] = useState<string>('');
  const [isCompressingImage, setIsCompressingImage] = useState<boolean>(false);
  const [imageStats, setImageStats] = useState<{ originalKb: number; compressedKb: number } | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

  // Match status filter
  const [filterExamId, setFilterExamId] = useState<string | null>(null);
  const [filterRevised, setFilterRevised] = useState<'UNREVISED' | 'REVISED' | 'ALL'>('UNREVISED');
  const [filterSubject, setFilterSubject] = useState<string>('ALL');
  const [sortOption, setSortOption] = useState<string>('priority_desc');
  const [filterMatchStatus, setFilterMatchStatus] = useState<string>('ALL');

  // Topic tips state
  const [activeTipTopic, setActiveTipTopic] = useState<{ subject: string; topicName: string } | null>(null);
  const [tipLoading, setTipLoading] = useState<boolean>(false);
  const [topicTipData, setTopicTipData] = useState<{
    mistakes: Array<{ mistake: string; correction: string }>;
    tips: string[];
    summary?: string;
  } | null>(null);
  const [tipError, setTipError] = useState<string | null>(null);

  // Question solver state
  const [solveLoading, setSolveLoading] = useState<boolean>(false);
  const [solveSolution, setSolveSolution] = useState<string | null>(null);
  const [solveError, setSolveError] = useState<string | null>(null);

  // Similar questions generator state
  const [similarLoading, setSimilarLoading] = useState<boolean>(false);
  const [similarQuestionsList, setSimilarQuestionsList] = useState<Array<{ question: string; solution: string; correctAnswer: string }>>([]);
  const [activeSimilarIdx, setActiveSimilarIdx] = useState<number>(0);
  const [showSimilarSolution, setShowSimilarSolution] = useState<boolean>(false);
  const [similarError, setSimilarError] = useState<string | null>(null);

  // Question report card state
  const [reportLoading, setReportLoading] = useState<boolean>(false);
  const [reportText, setReportText] = useState<string | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);
  const [aiModalTab, setAiModalTab] = useState<'solution' | 'similar' | 'report'>('solution');

  // AI Support menu and sub-features states
  const [activeSupportItem, setActiveSupportItem] = useState<TopicErrorItem | null>(null);
  const [returnToSupportItem, setReturnToSupportItem] = useState<TopicErrorItem | null>(null);
  const [activeSupportTab, setActiveSupportTab] = useState<'menu' | 'feedback' | 'analysis'>('menu');
  const [supportFeedbackLoading, setSupportFeedbackLoading] = useState<boolean>(false);
  const [supportFeedbackText, setSupportFeedbackText] = useState<string | null>(null);
  const [supportFeedbackError, setSupportFeedbackError] = useState<string | null>(null);
  const [supportAnalysisLoading, setSupportAnalysisLoading] = useState<boolean>(false);
  const [supportAnalysisText, setSupportAnalysisText] = useState<string | null>(null);
  const [supportAnalysisError, setSupportAnalysisError] = useState<string | null>(null);

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processImageFile(file);
    e.target.value = '';
  };

  const processImageFile = async (file: File) => {
    setIsCompressingImage(true);
    setImageError(null);
    try {
      const errId = editingError?.id || ('err-' + Date.now() + '-' + Math.floor(Math.random() * 100000));
      const targetUserId = currentUser?.id || 'anonymous';
      const uploadRes = await uploadQuestionErrorImage(file, targetUserId, errId);
      setErrorImageUrl(uploadRes.url);
      setImageStats({ originalKb: uploadRes.originalKb, compressedKb: uploadRes.compressedKb });
    } catch (err: any) {
      setImageError(err.message || 'Soru fotoğrafı yüklenirken bir hata oluştu.');
    } finally {
      setIsCompressingImage(false);
    }
  };



  const handleOpenAddErrorModal = () => {
    setEditingError(null);
    setErrorSubject('');
    setTopicName('');
    setIsCustomTopic(false);
    setErrorPublisher('');
    setSelectedExamRef('other');
    setErrorReason('' as any);
    setPriority(5);
    setSolutionNotes('');
    setIsAnalyzing(false);
    setAiFeedback('');
    setAiSuccess(false);
    setAiButtonFaded(false);
    setErrorImageUrl('');
    setIsCompressingImage(false);
    setImageStats(null);
    setImageError(null);
    setShowAddErrorModal(true);
  };

  const handleOpenEditErrorModal = (err: TopicErrorItem) => {
    setEditingError(err);
    setErrorSubject(err.subject);
    setTopicName(err.topicName);
    setErrorPublisher(err.publisher || '');
    if (err.examId && err.examTypeRef) {
      setSelectedExamRef(`${err.examTypeRef}_${err.examId}`);
    } else {
      setSelectedExamRef('other');
    }
    setErrorReason(err.errorReason);
    
    // Map legacy priority text to stars
    const initialPriority = err.priority === 'high' 
      ? 5 
      : err.priority === 'medium' 
      ? 3 
      : err.priority === 'low' 
      ? 1 
      : err.priority;
    setPriority(initialPriority);
    
    setSolutionNotes(err.solutionNotes || '');
    setIsAnalyzing(false);
    setAiFeedback(err.aiFeedback || '');
    setAiSuccess(!!err.aiFeedback);
    setAiButtonFaded(!!err.aiFeedback);
    setErrorImageUrl(err.imageUrl || '');
    setIsCompressingImage(false);
    setImageStats(null);
    setImageError(null);
    
    // Check if the loaded topic name is in the curriculum topics list for this subject
    const isCurriculum = (YKS_CURRICULUM_TOPICS[err.subject] || []).includes(err.topicName);
    setIsCustomTopic(!isCurriculum);
    setShowAddErrorModal(true);
  };

  const handleSupportGetFeedback = async (itemOverride?: TopicErrorItem) => {
    const item = itemOverride || activeSupportItem;
    if (!item) return;
    setActiveSupportTab('feedback');
    setSupportFeedbackError(null);
    setSupportFeedbackText(null);

    if (item.aiFeedback) {
      setSupportFeedbackText(item.aiFeedback);
      return;
    }

    setSupportFeedbackLoading(true);
    try {
      const response = await fetch('/api/gemini/analyze-error-priority', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: item.subject,
          topicName: item.topicName,
          errorReason: item.errorReason,
          solutionNotes: item.solutionNotes || '',
          publisher: item.publisher || ''
        })
      });

      if (!response.ok) {
        let errText = 'Yapay zeka özellikleri şu an için kullanılamıyor, lütfen daha sonra tekrar deneyiniz.';
        try {
          const errData = await response.json();
          if (errData && errData.error) errText = errData.error;
        } catch {}
        throw new Error(errText);
      }

      const data = await response.json();
      if (data.success) {
        setSupportFeedbackText(data.analysis);
        if (onAddAuditLog) {
          onAddAuditLog(
            `Hata Defteri "${item.subject} - ${item.topicName}" sorusu için Yapay Zeka hata yorumunu kullandı.`,
            'system',
            'AI_ERROR_FEEDBACK',
            undefined,
            undefined,
            undefined,
            data.aiUsage
          );
        }
        // Save to db permanently!
        const updatedItem = { ...item, aiFeedback: data.analysis };
        onUpdateTopicError(updatedItem);
        setActiveSupportItem(updatedItem);
      } else {
        throw new Error(data.error || 'Yorum üretilemedi.');
      }
    } catch (err: any) {
      console.error(err);
      setSupportFeedbackError(err.message || 'Bağlantı hatası oluştu.');
    } finally {
      setSupportFeedbackLoading(false);
    }
  };

  const handleSupportGetAnalysis = async (itemOverride?: TopicErrorItem) => {
    const item = itemOverride || activeSupportItem;
    if (!item) return;
    setActiveSupportTab('analysis');
    setSupportAnalysisError(null);
    setSupportAnalysisText(null);

    if (item.aiAnalysis) {
      setSupportAnalysisText(item.aiAnalysis);
      return;
    }

    setSupportAnalysisLoading(true);
    try {
      const solutionContext = item.aiSolution || solveSolution || supportFeedbackText || undefined;

      const response = await fetch('/api/gemini/analyze-question-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: item.imageUrl,
          solutionText: solutionContext,
          subject: item.subject,
          topicName: item.topicName
        })
      });

      if (!response.ok) {
        let errText = 'Yapay zeka özellikleri şu an için kullanılamıyor, lütfen daha sonra tekrar deneyiniz.';
        try {
          const errData = await response.json();
          if (errData && errData.error) errText = errData.error;
        } catch {}
        throw new Error(errText);
      }

      const data = await response.json();
      if (data.success) {
        setSupportAnalysisText(data.analysis);
        if (onAddAuditLog) {
          onAddAuditLog(
            `Hata Defteri "${item.subject} - ${item.topicName}" sorusu için Yapay Zeka detaylı soru analizini inceledi.`,
            'system',
            'AI_QUESTION_ANALYSIS',
            undefined,
            undefined,
            undefined,
            data.aiUsage
          );
        }
        // Save to db permanently!
        const updatedItem = { ...item, aiAnalysis: data.analysis };
        onUpdateTopicError(updatedItem);
        setActiveSupportItem(updatedItem);
      } else {
        throw new Error(data.error || 'Analiz üretilemedi.');
      }
    } catch (err: any) {
      console.error(err);
      setSupportAnalysisError(err.message || 'Bağlantı hatası oluştu.');
    } finally {
      setSupportAnalysisLoading(false);
    }
  };

  const handleFetchTopicTips = async (subject: string, topicName: string) => {
    setActiveTipTopic({ subject, topicName });
    setTipLoading(true);
    setTopicTipData(null);
    setTipError(null);

    const cacheKey = `${subject}::${topicName}`;
    if (topicTipsCache && topicTipsCache[cacheKey]) {
      setTopicTipData(topicTipsCache[cacheKey]);
      setTipLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/gemini/topic-mistake-tips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subject, topicName }),
      });

      if (!response.ok) {
        let errText = 'Yapay zeka özellikleri şu an için kullanılamıyor, lütfen daha sonra tekrar deneyiniz.';
        try {
          const errData = await response.json();
          if (errData && errData.error) errText = errData.error;
        } catch {}
        throw new Error(errText);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Yapay zeka servisi şu anda meşgul. Lütfen tekrar deneyin.');
      }

      const data = await response.json();
      if (data.success) {
        const tipObj = {
          mistakes: data.mistakes,
          tips: data.tips,
          summary: data.summary || '',
        };
        setTopicTipData(tipObj);
        if (onUpdateTopicTipsCache) {
          onUpdateTopicTipsCache(cacheKey, tipObj);
        }
        if (onAddAuditLog) {
          onAddAuditLog(
            `Hata Defterinde "${subject} - ${topicName}" konusu için Yapay Zeka yaygın hataları ve ipuçlarını inceledi.`,
            'system',
            'AI_TOPIC_TIPS',
            undefined,
            undefined,
            undefined,
            data.aiUsage
          );
        }
      } else {
        throw new Error(data.error || 'İpuçları üretilemedi.');
      }
    } catch (err: any) {
      console.error(err);
      setTipError(err.message || 'Bağlantı hatası oluştu.');
    } finally {
      setTipLoading(false);
    }
  };

  const handleSolveQuestion = async (imageUrl: string, title: string) => {
    const matchingError = topicErrors.find(e => e.imageUrl === imageUrl || `${e.subject} - ${e.topicName}` === title);
    if (matchingError && matchingError.aiSolution) {
      setSolveSolution(matchingError.aiSolution);
      setSolveLoading(false);
      setSolveError(null);
      return;
    }

    setSolveLoading(true);
    setSolveSolution(null);
    setSolveError(null);

    // Extract subject and topic from title
    const parts = title.split(' - ');
    const subject = parts[0] || '';
    const topicName = parts[1] || '';
    const solutionContext = matchingError?.aiAnalysis || supportAnalysisText || undefined;

    try {
      const response = await fetch('/api/gemini/solve-question', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl,
          solutionText: solutionContext,
          subject,
          topicName
        }),
      });

      if (!response.ok) {
        let errText = 'Yapay zeka özellikleri şu an için kullanılamıyor, lütfen daha sonra tekrar deneyiniz.';
        try {
          const errData = await response.json();
          if (errData && errData.error) errText = errData.error;
        } catch {}
        throw new Error(errText);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Yapay zeka servisi şu anda meşgul. Lütfen tekrar deneyin.');
      }

      const data = await response.json();
      if (data.success) {
        setSolveSolution(data.solution);
        if (matchingError) {
          const updated = { ...matchingError, aiSolution: data.solution };
          onUpdateTopicError(updated);
        }
        if (onAddAuditLog) {
          onAddAuditLog(
            `Hata Defteri "${title}" sorusu için Yapay Zeka adım adım görsel çözüm üretti.`,
            'system',
            'AI_QUESTION_SOLVE',
            undefined,
            undefined,
            undefined,
            data.aiUsage
          );
        }
      } else {
        throw new Error(data.error || 'Soru çözümü üretilemedi.');
      }
    } catch (err: any) {
      console.error(err);
      setSolveError(err.message || 'Bağlantı hatası oluştu.');
    } finally {
      setSolveLoading(false);
    }
  };

  const handleGenerateSimilarQuestions = async (imageUrl: string, title: string) => {
    const matchingError = topicErrors.find(e => e.imageUrl === imageUrl || `${e.subject} - ${e.topicName}` === title);
    const currentList = matchingError?.similarQuestionsList || similarQuestionsList || [];

    if (currentList.length >= 3) {
      setSimilarError('Benzer soru sorgulama hakkınız doldu (Maksimum 3 soru üretildi). Eski soruları yukarıdaki sekmelerden inceleyebilirsiniz.');
      return;
    }

    setSimilarLoading(true);
    setSimilarError(null);

    // Extract subject and topic from title
    const parts = title.split(' - ');
    const subject = parts[0] || '';
    const topicName = parts[1] || '';
    const solutionContext = matchingError?.aiSolution || solveSolution || matchingError?.aiAnalysis || supportAnalysisText || undefined;

    try {
      const response = await fetch('/api/gemini/similar-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl,
          solutionText: solutionContext,
          subject,
          topicName
        }),
      });

      if (!response.ok) {
        let errText = 'Yapay zeka özellikleri şu an için kullanılamıyor, lütfen daha sonra tekrar deneyiniz.';
        try {
          const errData = await response.json();
          if (errData && errData.error) errText = errData.error;
        } catch {}
        throw new Error(errText);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Yapay zeka servisi şu anda meşgul. Lütfen tekrar deneyin.');
      }

      const data = await response.json();
      if (data.success && data.similarQuestions) {
        const newItems = Array.isArray(data.similarQuestions) ? data.similarQuestions : [data.similarQuestions];
        const updatedList = [...currentList, ...newItems].slice(0, 3);
        
        setSimilarQuestionsList(updatedList);
        setActiveSimilarIdx(updatedList.length - 1);
        setShowSimilarSolution(false);

        if (matchingError) {
          const updated = { ...matchingError, similarQuestionsList: updatedList };
          onUpdateTopicError(updated);
        }
        if (onAddAuditLog) {
          onAddAuditLog(
            `Hata Defteri "${title}" sorusu için Yapay Zeka benzer özgün soru üretti.`,
            'system',
            'AI_GENERATE_SIMILAR',
            undefined,
            undefined,
            undefined,
            data.aiUsage
          );
        }
      } else {
        throw new Error(data.error || 'Benzer sorular üretilemedi.');
      }
    } catch (err: any) {
      console.error(err);
      setSimilarError(err.message || 'Bağlantı hatası oluştu.');
    } finally {
      setSimilarLoading(false);
    }
  };

  const openImagePreview = (url: string, title: string) => {
    const matchingError = topicErrors.find(e => e.imageUrl === url || `${e.subject} - ${e.topicName}` === title);
    if (matchingError) {
      setSolveSolution(matchingError.aiSolution || null);
      setSimilarQuestionsList(matchingError.similarQuestionsList || []);
      setActiveSimilarIdx(0);
      setReportText(matchingError.aiAnalysis || null);
    } else {
      setSolveSolution(null);
      setSimilarQuestionsList([]);
      setActiveSimilarIdx(0);
      setReportText(null);
    }
    setAiModalTab('solution');
    setPreviewImage({ url, title });
  };

  const handleClosePreviewImage = () => {
    setPreviewImage(null);
    setSolveSolution(null);
    setSolveLoading(false);
    setSolveError(null);
    setSimilarQuestionsList([]);
    setActiveSimilarIdx(0);
    setShowSimilarSolution(false);
    setSimilarLoading(false);
    setSimilarError(null);
    setReportText(null);
    setReportLoading(false);
    setReportError(null);
    setAiModalTab('solution');
  };

  const formatSolutionText = (text: string) => {
    if (!text) return null;
    // Pre-process text to insert line breaks before step markers or section headings if squished into a single block
    let formattedText = text
      .replace(/([^\n])\s*(Adım \d+[:\.-])/gi, '$1\n\n$2')
      .replace(/([^\n])\s*(\d+\.\s+)/g, '$1\n$2')
      .replace(/([^\n])\s*([A-E]\)\s+)/g, '$1\n$2')
      .replace(/([^\n])\s*(Çözüm[:\.-])/gi, '$1\n\n$2')
      .replace(/([^\n])\s*(Doğru Cevap[:\.-])/gi, '$1\n\n$2')
      .replace(/([^\n])\s*(Sonuç[:\.-])/gi, '$1\n\n$2');

    return formattedText.split('\n').map((line, idx) => {
      let cleaned = line
        .replace(/\$\$/g, '')
        .replace(/\$/g, '')
        .replace(/\\implies/g, ' ➔ ')
        .replace(/\\cdot/g, ' · ')
        .replace(/\\equiv/g, ' ≡ ')
        .replace(/\\approx/g, ' ≈ ')
        .replace(/\\ne/g, ' ≠ ')
        .replace(/\\le/g, ' ≤ ')
        .replace(/\\ge/g, ' ≥ ')
        .replace(/\\infty/g, ' ∞ ')
        .replace(/\\pm/g, ' ± ')
        .replace(/\\times/g, ' × ')
        .replace(/\\div/g, ' ÷ ')
        .replace(/\\alpha/g, 'α')
        .replace(/\\beta/g, 'β')
        .replace(/\\theta/g, 'θ')
        .replace(/\\pi/g, 'π')
        .replace(/\\sqrt\{([^}]+)\}/g, 'kök($1)')
        .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1 / $2)')
        .replace(/\\Delta/g, 'Δ');

      // Replace **bold** with <strong>
      const parts = cleaned.split('**');
      const elements = parts.map((part, i) => {
        if (i % 2 === 1) {
          return <strong key={i} className="text-amber-300 font-bold">{part}</strong>;
        }
        return part;
      });

      if (cleaned.trim().startsWith('- ') || cleaned.trim().startsWith('* ')) {
        return (
          <li key={idx} className="ml-4 list-disc text-slate-300 pl-1 py-0.5 text-xs leading-relaxed">
            {elements}
          </li>
        );
      }
      if (cleaned.trim().match(/^\d+\./) || cleaned.trim().toLowerCase().startsWith('adım ')) {
        return (
          <div key={idx} className="text-xs text-slate-200 pl-3 font-semibold leading-relaxed my-2 border-l-2 border-emerald-400 py-1 bg-emerald-950/30 rounded-r-lg space-y-1">
            {elements}
          </div>
        );
      }
      if (cleaned.trim() === '') {
        return <div key={idx} className="h-2" />;
      }
      return (
        <p key={idx} className="text-xs text-slate-300 leading-relaxed font-normal py-0.5">
          {elements}
        </p>
      );
    });
  };

  const matchingBooks = React.useMemo(() => {
    if (!errorSubject) return [];
    return resources.filter(r => r.subject === errorSubject);
  }, [resources, errorSubject]);

  const matchingBranchExams = React.useMemo(() => {
    if (!errorSubject) return [];
    return [...branchExams]
      .filter(b => b.subject === errorSubject)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 3);
  }, [branchExams, errorSubject]);

  const last3GeneralMocks = React.useMemo(() => {
    return [...generalMocks]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 3);
  }, [generalMocks]);

  const handleExamRefChange = (val: string) => {
    setSelectedExamRef(val);
    if (val !== 'other') {
      const parts = val.split('_');
      const type = parts[0];
      const id = parts.slice(1).join('_');
      if (type === 'book') {
        const matchingBook = resources.find(r => r.id === id);
        if (matchingBook) {
          setErrorPublisher(`${matchingBook.publisher} (${matchingBook.bookTitle})`);
        }
      } else if (type === 'branch') {
        const matchingBranch = branchExams.find(b => b.id === id);
        if (matchingBranch) {
          setErrorPublisher(`${matchingBranch.publisher} (${matchingBranch.subject} Branş)`);
          setErrorSubject(matchingBranch.subject);
          setTopicName('');
          setIsCustomTopic(false);
          setErrorReason('' as any);
        }
      } else if (type === 'general') {
        const matchingGeneral = generalMocks.find(g => g.id === id);
        if (matchingGeneral) {
          setErrorPublisher(matchingGeneral.title);
        }
      }
    } else {
      setErrorPublisher('');
    }
  };

  const renderPriorityBadge = (p: any) => {
    let numeric = parseInt(p, 10);
    if (isNaN(numeric)) {
      numeric = p === 'high' ? 5 : p === 'low' ? 1 : 3;
    }
    numeric = Math.max(1, Math.min(5, numeric));

    let starColor = 'text-amber-400 fill-amber-400';
    let bgBorder = 'bg-amber-500/15 border-amber-500/30';
    let verbalLabel = 'Orta Öncelik';
    
    if (numeric >= 5) {
      starColor = 'text-rose-400 fill-rose-400';
      bgBorder = 'bg-rose-500/15 border-rose-500/30';
      verbalLabel = 'Çok Yüksek Öncelik';
    } else if (numeric === 4) {
      starColor = 'text-amber-400 fill-amber-400';
      bgBorder = 'bg-amber-500/15 border-amber-500/30';
      verbalLabel = 'Yüksek Öncelik';
    } else if (numeric === 3) {
      starColor = 'text-yellow-400 fill-yellow-400';
      bgBorder = 'bg-yellow-500/10 border-yellow-500/20';
      verbalLabel = 'Orta Öncelik';
    } else if (numeric === 2) {
      starColor = 'text-sky-400 fill-sky-400';
      bgBorder = 'bg-sky-500/10 border-sky-500/20';
      verbalLabel = 'Düşük Öncelik';
    } else {
      starColor = 'text-slate-400 fill-slate-400';
      bgBorder = 'bg-slate-800 border-slate-700/50';
      verbalLabel = 'Çok Düşük Öncelik';
    }

    const emptyCount = 5 - numeric;

    return (
      <div 
        className={`px-1.5 py-0.5 rounded flex items-center space-x-0.5 border ${bgBorder}`}
        title={`${numeric}/5 Öncelik - ${verbalLabel}`}
      >
        {Array.from({ length: numeric }).map((_, idx) => (
          <Star key={`filled-${idx}`} className={`w-3 h-3 ${starColor}`} />
        ))}
        {Array.from({ length: emptyCount }).map((_, idx) => (
          <Star key={`empty-${idx}`} className="w-3 h-3 text-slate-600/60 fill-none" />
        ))}
      </div>
    );
  };

  const handleOpenAddExamModal = () => {
    setEditingExam(null);
    setExamDate(new Date().toISOString().split('T')[0]);
    setExamType('AYT');
    setExamSubject(YKS_SUBJECTS.AYT[0]);
    setPublisher('');
    setCorrect('');
    setWrong('');
    setEmpty('');
    setDurationMinutes('');
    setIsAnalyzed(false);
    setShowAddExamModal(true);
  };

  const handleOpenEditExamModal = (ex: BranchExam) => {
    setEditingExam(ex);
    setExamDate(ex.date);
    setExamType(ex.examType);
    setExamSubject(ex.subject);
    setPublisher(ex.publisher);
    setCorrect(ex.correct ?? '');
    setWrong(ex.wrong ?? '');
    setEmpty(ex.empty ?? '');
    setDurationMinutes(ex.durationMinutes ?? '');
    setIsAnalyzed(ex.isAnalyzed ?? false);
    setShowAddExamModal(true);
  };

  const handleCreateBranchExam = (e: React.FormEvent) => {
    e.preventDefault();
    const c = parseNetVal(correct);
    const w = parseNetVal(wrong);
    const emp = parseNetVal(empty);
    const dur = parseNetVal(durationMinutes) || 60;
    const net = Math.max(0, c - w * 0.25);

    if (editingExam) {
      if (onUpdateBranchExam) {
        onUpdateBranchExam({
          ...editingExam,
          date: examDate,
          subject: examSubject,
          examType,
          publisher: publisher || 'Yayınevi Branş Denemesi',
          correct: c,
          wrong: w,
          empty: emp,
          net: Number(net.toFixed(2)),
          durationMinutes: dur,
          isAnalyzed
        });
      }
      setEditingExam(null);
    } else {
      onAddBranchExam({
        date: examDate,
        subject: examSubject,
        examType,
        publisher: publisher || 'Yayınevi Branş Denemesi',
        correct: c,
        wrong: w,
        empty: emp,
        net: Number(net.toFixed(2)),
        durationMinutes: dur,
        isAnalyzed
      });
    }

    setPublisher('');
    setShowAddExamModal(false);
  };

  const handleAIAnalyzePriority = async () => {
    if (!topicName.trim()) return;
    setIsAnalyzing(true);
    setAiFeedback('');
    setAiSuccess(false);
    setAiButtonFaded(false);

    try {
      const response = await fetch('/api/gemini/analyze-error-priority', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: errorSubject,
          topicName,
          errorReason,
          solutionNotes,
          publisher: errorPublisher
        })
      });

      if (!response.ok) {
        let errText = 'Yapay zeka özellikleri şu an için kullanılamıyor, lütfen daha sonra tekrar deneyiniz.';
        try {
          const errData = await response.json();
          if (errData && errData.error) errText = errData.error;
        } catch {}
        throw new Error(errText);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Yapay zeka servisi şu anda meşgul veya sunucu güncelleniyor. Lütfen birkaç saniye sonra tekrar deneyin.');
      }

      const data = await response.json();
      if (data.success) {
        setPriority(data.rating);
        setAiSuccess(true);
        // Delay of 1.5 seconds to transition smoothly
        setTimeout(() => {
          setAiFeedback(data.analysis);
          setAiButtonFaded(true);
        }, 1500);
        if (onAddAuditLog) {
          onAddAuditLog(
            `Hata Defterinde "${errorSubject} - ${topicName}" için Yapay Zeka Öncelik Analizi yapıldı.`,
            'system',
            'AI_ERROR_PRIORITY_ANALYSIS',
            undefined,
            undefined,
            undefined,
            data.aiUsage
          );
        }
      }
    } catch (err: any) {
      console.error('AI priority analysis failed:', err);
      // Fallback calculation in case of failure or offline mode
      let fallbackRating = 3;
      if (errorReason === 'bilgi_eksigi') {
        fallbackRating = 4;
      }
      const importantSubjects = ['Türev', 'İntegral', 'Trigonometri', 'Paragraf', 'Problemler', 'Optik', 'Limit', 'Fonksiyonlar'];
      if (importantSubjects.some(sub => topicName.toLowerCase().includes(sub.toLowerCase()))) {
        fallbackRating += 1;
      }
      fallbackRating = Math.min(fallbackRating, 5);
      setPriority(fallbackRating);
      
      setAiSuccess(true);
      setTimeout(() => {
        setAiFeedback(`Yapay zeka analiz servisiyle bağlantı kurulamadı. Hataya ve konuya göre otomatik olarak ${fallbackRating} yıldız belirlendi.`);
        setAiButtonFaded(true);
      }, 1500);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCreateTopicError = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicName.trim()) return;

    let finalPublisher = errorPublisher;
    let finalExamId: string | undefined = undefined;
    let finalExamTypeRef: 'book' | 'branch' | 'general' | undefined = undefined;

    if (selectedExamRef && selectedExamRef !== 'other') {
      const parts = selectedExamRef.split('_');
      const type = parts[0] as 'book' | 'branch' | 'general';
      const id = parts.slice(1).join('_');
      finalExamId = id;
      finalExamTypeRef = type;
      if (type === 'book') {
        const matchingBook = resources.find(r => r.id === id);
        if (matchingBook) {
          finalPublisher = `${matchingBook.publisher} (${matchingBook.bookTitle})`;
        }
      } else if (type === 'branch') {
        const matchingBranch = branchExams.find(b => b.id === id);
        if (matchingBranch) {
          finalPublisher = `${matchingBranch.publisher} (${matchingBranch.subject} Branş)`;
        }
      } else if (type === 'general') {
        const matchingGeneral = generalMocks.find(g => g.id === id);
        if (matchingGeneral) {
          finalPublisher = matchingGeneral.title;
        }
      }
    }

    let inferredExamType: 'TYT' | 'AYT' = 'TYT';
    if (YKS_SUBJECTS.AYT.includes(errorSubject)) {
      inferredExamType = 'AYT';
    } else if (YKS_SUBJECTS.TYT.includes(errorSubject)) {
      inferredExamType = 'TYT';
    } else {
      inferredExamType = examType;
    }

    if (editingError) {
      onUpdateTopicError({
        ...editingError,
        subject: errorSubject,
        examType: inferredExamType,
        topicName,
        publisher: finalPublisher,
        examId: finalExamId,
        examTypeRef: finalExamTypeRef,
        errorReason,
        priority,
        solutionNotes,
        aiFeedback: aiFeedback || editingError.aiFeedback,
        imageUrl: errorImageUrl
      });
      setEditingError(null);
    } else {
      onAddTopicError({
        date: new Date().toISOString().split('T')[0],
        subject: errorSubject,
        examType: inferredExamType,
        topicName,
        publisher: finalPublisher,
        examId: finalExamId,
        examTypeRef: finalExamTypeRef,
        errorReason,
        priority,
        revised: false,
        solutionNotes,
        aiFeedback,
        imageUrl: errorImageUrl
      });
    }

    setTopicName('');
    setSolutionNotes('');
    setErrorImageUrl('');
    setImageStats(null);
    setImageError(null);
    setShowAddErrorModal(false);
  };

  const openAddErrorModal = (err?: TopicErrorItem) => {
    if (err) {
      handleOpenEditErrorModal(err);
    } else {
      handleOpenAddErrorModal();
    }
  };

  const handleToggleErrorRevision = (id: string) => {
    const err = topicErrors.find(e => e.id === id);
    if (err) {
      onUpdateTopicError({ ...err, revised: !err.revised });
    }
  };

  const handleOpenTipModal = (subject: string, topicName: string) => {
    handleFetchTopicTips(subject, topicName);
  };

  const handleOpenSolveModal = (errorItem: TopicErrorItem) => {
    if (errorItem.imageUrl) {
      openImagePreview(errorItem.imageUrl, `${errorItem.subject} - ${errorItem.topicName}`);
      setAiModalTab('solution');
      if (!errorItem.aiSolution) {
        handleSolveQuestion(errorItem.imageUrl, `${errorItem.subject} - ${errorItem.topicName}`);
      }
    }
  };

  const handleOpenSimilarModal = (errorItem: TopicErrorItem) => {
    if (errorItem.imageUrl) {
      openImagePreview(errorItem.imageUrl, `${errorItem.subject} - ${errorItem.topicName}`);
      setAiModalTab('similar');
      const existingList = errorItem.similarQuestionsList || [];
      if (existingList.length === 0) {
        handleGenerateSimilarQuestions(errorItem.imageUrl, `${errorItem.subject} - ${errorItem.topicName}`);
      }
    }
  };

  const handleGenerateQuestionReport = async (errorItem: TopicErrorItem) => {
    const imageUrl = errorItem.imageUrl;
    const title = `${errorItem.subject} - ${errorItem.topicName}`;
    const matchingError = topicErrors.find(e => e.imageUrl === imageUrl || `${e.subject} - ${e.topicName}` === title);
    
    if (matchingError?.aiAnalysis) {
      setReportText(matchingError.aiAnalysis);
      return;
    }

    setReportLoading(true);
    setReportError(null);
    setReportText(null);

    const solutionContext = matchingError?.aiSolution || solveSolution || matchingError?.aiAnalysis || undefined;

    try {
      const response = await fetch('/api/gemini/analyze-question-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl,
          solutionText: solutionContext,
          subject: errorItem.subject,
          topicName: errorItem.topicName
        })
      });

      if (!response.ok) {
        let errText = 'Yapay zeka özellikleri şu an için kullanılamıyor, lütfen daha sonra tekrar deneyiniz.';
        try {
          const errData = await response.json();
          if (errData && errData.error) errText = errData.error;
        } catch {}
        throw new Error(errText);
      }

      const data = await response.json();
      if (data.success && data.analysis) {
        setReportText(data.analysis);
        if (matchingError) {
          const updated = { ...matchingError, aiAnalysis: data.analysis };
          onUpdateTopicError(updated);
        }
        if (onAddAuditLog) {
          onAddAuditLog(
            `Hata Defteri "${title}" sorusu için Soru Karnesi oluşturuldu.`,
            'system',
            'AI_QUESTION_ANALYSIS',
            undefined,
            undefined,
            undefined,
            data.aiUsage
          );
        }
      } else {
        throw new Error(data.error || 'Soru karnesi oluşturulamadı.');
      }
    } catch (err: any) {
      console.error(err);
      setReportError(err.message || 'Bağlantı hatası oluştu.');
    } finally {
      setReportLoading(false);
    }
  };

  const handleOpenQuestionReport = (errorItem: TopicErrorItem) => {
    if (errorItem.imageUrl) {
      openImagePreview(errorItem.imageUrl, `${errorItem.subject} - ${errorItem.topicName}`);
      setAiModalTab('report');
      if (errorItem.aiAnalysis) {
        setReportText(errorItem.aiAnalysis);
      } else {
        handleGenerateQuestionReport(errorItem);
      }
    }
  };

  const handleAIAnalyzeError = () => {
    handleAIAnalyzePriority();
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleImageFileChange(e);
  };

  const handleRemoveImage = () => {
    setErrorImageUrl('');
    setImageStats(null);
    setImageError(null);
  };

  const handleConfirmDelete = () => {
    if (!deletingItem) return;
    if (deletingItem.type === 'error') {
      onDeleteTopicError(deletingItem.id);
    } else {
      onDeleteBranchExam(deletingItem.id);
    }
    setDeletingItem(null);
  };



  const filteredErrors = topicErrors.filter((e) => {
    if (filterExamId) return e.examId === filterExamId;
    // 1. Durum Filtresi
    if (filterRevised === 'UNREVISED') return !e.revised;
    if (filterRevised === 'REVISED') return e.revised;
    return true;
  }).filter((e) => {
    if (filterExamId) return true;
    // 2. Ders Filtresi
    if (filterSubject === 'ALL') return true;
    return e.subject === filterSubject;
  }).filter((e) => {
    if (filterExamId) return true;
    // 3. Eşleşme Filtresi
    if (filterMatchStatus === 'ALL') return true;
    if (filterMatchStatus === 'MATCHED') return !!e.examId;
    if (filterMatchStatus === 'NOT_MATCHED') return !e.examId;
    if (filterMatchStatus === 'BOOK') return e.examId && e.examTypeRef === 'book';
    if (filterMatchStatus === 'EXAM') return e.examId && (e.examTypeRef === 'branch' || e.examTypeRef === 'general');
    return true;
  });

  const sortedErrors = [...filteredErrors].sort((a, b) => {
    if (sortOption === 'priority_desc') {
      const valA = typeof a.priority === 'number' ? a.priority : parseInt(a.priority as string, 10) || 3;
      const valB = typeof b.priority === 'number' ? b.priority : parseInt(b.priority as string, 10) || 3;
      return valB - valA;
    }
    if (sortOption === 'priority_asc') {
      const valA = typeof a.priority === 'number' ? a.priority : parseInt(a.priority as string, 10) || 3;
      const valB = typeof b.priority === 'number' ? b.priority : parseInt(b.priority as string, 10) || 3;
      return valA - valB;
    }
    if (sortOption === 'date_desc') {
      const dateA = a.date || '';
      const dateB = b.date || '';
      return dateB.localeCompare(dateA);
    }
    if (sortOption === 'date_asc') {
      const dateA = a.date || '';
      const dateB = b.date || '';
      return dateA.localeCompare(dateB);
    }
    return 0;
  });

  // Computed Stats & Chart Datasets
  const totalBranchExamsCount = branchExams.length;
  const analyzedBranchExamsCount = branchExams.filter(e => e.isAnalyzed).length;
  const analyzedBranchExamsPercentage = totalBranchExamsCount > 0 ? Math.round((analyzedBranchExamsCount / totalBranchExamsCount) * 100) : 0;
  const totalTopicErrorsCount = topicErrors.length;
  const revisedErrorsCount = topicErrors.filter(e => e.revised).length;
  const unrevisedErrorsCount = totalTopicErrorsCount - revisedErrorsCount;
  const revisionPercentage = totalTopicErrorsCount > 0 ? Math.round((revisedErrorsCount / totalTopicErrorsCount) * 100) : 0;

  const totalNetsOverall = branchExams.reduce((acc, ex) => acc + parseNetVal(ex.net), 0);
  const avgNetOverall = totalBranchExamsCount > 0 ? (totalNetsOverall / totalBranchExamsCount).toFixed(2).replace('.', ',') : '0,00';
  const maxNetOverall = totalBranchExamsCount > 0 ? Math.max(...branchExams.map(ex => parseNetVal(ex.net))) : 0;
  
  const totalDurationMinutes = branchExams.reduce((acc, ex) => acc + (ex.durationMinutes || 0), 0);
  const avgDurationMinutes = totalBranchExamsCount > 0 ? Math.round(totalDurationMinutes / totalBranchExamsCount) : 0;

  // Available subjects for chart dropdown
  const chartAvailableSubjects = Array.from(
    new Set(
      branchExams
        .filter(e => {
          if (chartExamType === 'TYT') return e.examType === 'TYT' || YKS_SUBJECTS.TYT.includes(e.subject);
          if (chartExamType === 'AYT') return e.examType === 'AYT' || YKS_SUBJECTS.AYT.includes(e.subject);
          return true;
        })
        .map(e => e.subject)
    )
  )
    .filter((s): s is string => Boolean(s))
    .sort((a, b) => a.localeCompare(b, 'tr'));

  // 1. Trend Line Dataset
  const trendRawData = branchExams
    .filter(ex => {
      if (chartExamType !== 'ALL' && ex.examType !== chartExamType) return false;
      if (chartSubject !== 'ALL' && ex.subject !== chartSubject) return false;
      return true;
    })
    .sort((a, b) => (a.date || '').localeCompare(b.date || ''));

  const trendChartDataAll = trendRawData.map((ex, idx) => ({
    id: ex.id,
    displayLabel: `${ex.date ? ex.date.slice(5) : ''} (${ex.subject ? ex.subject.replace('AYT ', '').replace('TYT ', '') : ''})`,
    date: ex.date,
    subject: ex.subject,
    examType: ex.examType,
    publisher: ex.publisher || 'Branş Denemesi',
    net: parseNetVal(ex.net),
    correct: parseNetVal(ex.correct),
    wrong: parseNetVal(ex.wrong),
    empty: parseNetVal(ex.empty),
    durationMinutes: ex.durationMinutes || 0
  }));

  const trendChartData = chartLimit === '10'
    ? trendChartDataAll.slice(-10)
    : chartLimit === '30'
    ? trendChartDataAll.slice(-30)
    : trendChartDataAll;

  const filteredAvgNet = trendChartData.length > 0 
    ? Math.round((trendChartData.reduce((acc, c) => acc + c.net, 0) / trendChartData.length) * 100) / 100 
    : 0;

  // 2. Subject Average Net Bar Chart Dataset
  const subjectStatsMap: Record<string, { subject: string; examType: string; count: number; totalNet: number; maxNet: number }> = {};
  branchExams.forEach(ex => {
    const net = parseNetVal(ex.net);
    if (!subjectStatsMap[ex.subject]) {
      subjectStatsMap[ex.subject] = {
        subject: ex.subject,
        examType: ex.examType,
        count: 0,
        totalNet: 0,
        maxNet: net
      };
    }
    const curr = subjectStatsMap[ex.subject];
    curr.count += 1;
    curr.totalNet += net;
    curr.maxNet = Math.max(curr.maxNet, net);
  });

  const subjectAvgChartData = Object.values(subjectStatsMap).map(s => ({
    subject: s.subject,
    examType: s.examType,
    count: s.count,
    avgNet: Math.round((s.totalNet / s.count) * 100) / 100,
    maxNet: s.maxNet,
    color: SUBJECT_COLORS[s.subject] || '#6366f1'
  })).sort((a, b) => b.avgNet - a.avgNet);

  // 3. Error Reason Pie/Donut Dataset
  const errorReasonMap: Record<string, number> = {};
  topicErrors.forEach(err => {
    const reason = err.errorReason || 'other';
    errorReasonMap[reason] = (errorReasonMap[reason] || 0) + 1;
  });

  const errorReasonChartData = Object.entries(errorReasonMap).map(([reason, count]) => ({
    reason,
    name: ERROR_REASON_LABELS[reason as ErrorReason] || reason,
    count,
    percentage: totalTopicErrorsCount > 0 ? Math.round((count / totalTopicErrorsCount) * 100) : 0,
    color: ERROR_REASON_COLORS[reason] || '#64748b'
  })).sort((a, b) => b.count - a.count);

  // 4. Top Error Topics Dataset
  const topicErrorMap: Record<string, { topicName: string; subject: string; count: number }> = {};
  topicErrors.forEach(err => {
    const key = `${err.subject} - ${err.topicName}`;
    if (!topicErrorMap[key]) {
      topicErrorMap[key] = {
        topicName: err.topicName,
        subject: err.subject,
        count: 0
      };
    }
    topicErrorMap[key].count += 1;
  });

  const topErrorTopicsData = Object.values(topicErrorMap)
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  return (
    <div className="space-y-6">
      
      {/* Header & Section Selector */}
      <div className="flex flex-col gap-4 bg-slate-900 p-5 rounded-2xl border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center space-x-2">
              {mode === 'errors' ? (
                <>
                  <BookOpen className="w-5 h-5 text-rose-400" />
                  <span>Hata Defteri (Yanlış Tablosu)</span>
                </>
              ) : mode === 'branches' ? (
                <>
                  <Target className="w-5 h-5 text-indigo-400" />
                  <span>Branş Deneme Analizi</span>
                </>
              ) : (
                <>
                  <Target className="w-5 h-5 text-indigo-400" />
                  <span>Branş Denemeleri Analizi & Yanlış Tablosu</span>
                </>
              )}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              {mode === 'errors'
                ? 'Yanlış yaptığınız eksik konuları kaydedin, YKS Yapay Zeka yorumlarını inceleyin ve çözüm takibini yapın.'
                : mode === 'branches'
                ? 'Ders bazlı branş denemelerinizi kaydedin, net analizlerinizi ve ilerlemenizi görün.'
                : 'Ders bazlı branş denemelerinizi kaydedin, yanlış yaptığınız eksik konuları tespit edip tekrar edin.'
              }
            </p>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {activeSubTab === 'errors' ? (
              <button
                onClick={handleOpenAddErrorModal}
                id="add-error-topic-btn"
                className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center space-x-1 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Hata Ekle</span>
              </button>
            ) : (
              <button
                onClick={handleOpenAddExamModal}
                id="add-branch-exam-btn"
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center space-x-1 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Branş Denemesi Gir</span>
              </button>
            )}
          </div>
        </div>

        {/* Subtabs Selector Bar */}
        {mode !== 'errors' && (
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/60">
            <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex flex-wrap gap-1">
              <button
                onClick={() => setActiveSubTab('analytics')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                  activeSubTab === 'analytics'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <BarChart2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>Grafik & Analiz</span>
              </button>

              <button
                onClick={() => setActiveSubTab('branch_list')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                  activeSubTab === 'branch_list'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Target className="w-3.5 h-3.5" />
                <span>Deneme Geçmişi ({branchExams.length})</span>
              </button>

              {mode !== 'branches' && (
                <button
                  onClick={() => setActiveSubTab('errors')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                    activeSubTab === 'errors'
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  <span>Yanlış Tablosu ({topicErrors.filter(e => !e.revised).length} Bekleyen)</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* SUBTAB 0: GRAFİK & ANALİZ (CHARTS DASHBOARD) */}
      {activeSubTab === 'analytics' && (
        <BranchAnalyticsTab
          totalBranchExamsCount={totalBranchExamsCount}
          analyzedBranchExamsCount={analyzedBranchExamsCount}
          analyzedBranchExamsPercentage={analyzedBranchExamsPercentage}
          avgNetOverall={avgNetOverall}
          unrevisedErrorsCount={unrevisedErrorsCount}
          revisedErrorsCount={revisedErrorsCount}
          revisionPercentage={revisionPercentage}
          totalDurationMinutes={totalDurationMinutes}
          avgDurationMinutes={avgDurationMinutes}
          chartExamType={chartExamType}
          setChartExamType={setChartExamType}
          chartSubject={chartSubject}
          setChartSubject={setChartSubject}
          chartLimit={chartLimit}
          setChartLimit={setChartLimit}
          netChartData={trendChartData}
          branchSubjectStats={subjectAvgChartData}
          errorReasonStats={errorReasonChartData}
          topProblematicTopics={topErrorTopicsData}
          ERROR_REASON_COLORS={ERROR_REASON_COLORS}
          ERROR_REASON_LABELS={ERROR_REASON_LABELS}
          DEFAULT_CHART_COLORS={DEFAULT_CHART_COLORS}
          SUBJECT_COLORS={SUBJECT_COLORS}
        />
      )}

      {/* SUBTAB 1: HATA DEFTERİ & SORU BANKASI */}
      {activeSubTab === 'errors' && (
        <BranchErrorsTab
          topicErrors={topicErrors}
          filteredErrors={filteredErrors}
          filterExamId={filterExamId}
          setFilterExamId={setFilterExamId}
          filterRevised={filterRevised}
          setFilterRevised={setFilterRevised}
          filterSubject={filterSubject}
          setFilterSubject={setFilterSubject}
          filterMatchStatus={filterMatchStatus}
          setFilterMatchStatus={setFilterMatchStatus}
          sortOption={sortOption}
          setSortOption={setSortOption}
          branchExams={branchExams}
          resources={resources}
          openAddErrorModal={openAddErrorModal}
          setDeletingItem={setDeletingItem}
          handleToggleErrorRevision={handleToggleErrorRevision}
          revisingIds={revisingIds}
          fadingOutIds={fadingOutIds}
          handleOpenTipModal={handleOpenTipModal}
          handleOpenSolveModal={handleOpenSolveModal}
          handleOpenSimilarModal={handleOpenSimilarModal}
          handleOpenQuestionReport={handleOpenQuestionReport}
          openImagePreview={openImagePreview}
          ERROR_REASON_LABELS={ERROR_REASON_LABELS}
          ERROR_REASON_COLORS={ERROR_REASON_COLORS}
        />
      )}

      {/* SUBTAB 2: BRANŞ DENEMELERİ LİSTESİ */}
      {activeSubTab === 'branch_list' && (
        <BranchListTab
          branchExams={branchExams}
          listSubjectFilter={listSubjectFilter}
          setListSubjectFilter={setListSubjectFilter}
          listCurrentPage={listCurrentPage}
          setListCurrentPage={setListCurrentPage}
          onUpdateBranchExam={onUpdateBranchExam}
          handleOpenEditExamModal={handleOpenEditExamModal}
          setDeletingItem={setDeletingItem}
        />
      )}

      {/* ALL MODALS CONTAINER */}
      <BranchModals
        showAddErrorModal={showAddErrorModal}
        setShowAddErrorModal={setShowAddErrorModal}
        editingError={editingError}
        setEditingError={setEditingError}
        errorSubject={errorSubject}
        setErrorSubject={setErrorSubject}
        topicName={topicName}
        setTopicName={setTopicName}
        isCustomTopic={isCustomTopic}
        setIsCustomTopic={setIsCustomTopic}
        errorPublisher={errorPublisher}
        setErrorPublisher={setErrorPublisher}
        selectedExamRef={selectedExamRef}
        setSelectedExamRef={setSelectedExamRef}
        errorReason={errorReason}
        setErrorReason={setErrorReason}
        priority={priority}
        setPriority={setPriority}
        solutionNotes={solutionNotes}
        setSolutionNotes={setSolutionNotes}
        isAnalyzing={isAnalyzing}
        aiFeedback={aiFeedback}
        setAiFeedback={setAiFeedback}
        aiSuccess={aiSuccess}
        aiButtonFaded={aiButtonFaded}
        errorImageUrl={errorImageUrl}
        setErrorImageUrl={setErrorImageUrl}
        isCompressingImage={isCompressingImage}
        imageStats={imageStats}
        imageError={imageError}
        handleCreateTopicError={handleCreateTopicError}
        handleAIAnalyzeError={handleAIAnalyzeError}
        handleImageSelect={handleImageSelect}
        handleRemoveImage={handleRemoveImage}
        branchExams={branchExams}
        resources={resources}
        last3GeneralMocks={last3GeneralMocks}
        YKS_CURRICULUM_TOPICS={YKS_CURRICULUM_TOPICS}
        ERROR_REASON_LABELS={ERROR_REASON_LABELS}
        showAddExamModal={showAddExamModal}
        setShowAddExamModal={setShowAddExamModal}
        editingExam={editingExam}
        setEditingExam={setEditingExam}
        examDate={examDate}
        setExamDate={setExamDate}
        examType={examType}
        setExamType={setExamType}
        examSubject={examSubject}
        setExamSubject={setExamSubject}
        publisher={publisher}
        setPublisher={setPublisher}
        correct={correct}
        setCorrect={setCorrect}
        wrong={wrong}
        setWrong={setWrong}
        empty={empty}
        setEmpty={setEmpty}
        durationMinutes={durationMinutes}
        setDurationMinutes={setDurationMinutes}
        isAnalyzed={isAnalyzed}
        setIsAnalyzed={setIsAnalyzed}
        handleCreateBranchExam={handleCreateBranchExam}
        YKS_SUBJECTS={YKS_SUBJECTS}
        deletingItem={deletingItem}
        setDeletingItem={setDeletingItem}
        handleConfirmDelete={handleConfirmDelete}
        activeTipTopic={activeTipTopic}
        setActiveTipTopic={setActiveTipTopic}
        tipLoading={tipLoading}
        topicTipData={topicTipData}
        tipError={tipError}
        handleFetchTopicTips={handleFetchTopicTips}
        solveSolution={solveSolution}
        setSolveSolution={setSolveSolution}
        solveLoading={solveLoading}
        solveError={solveError}
        similarLoading={similarLoading}
        similarQuestionsList={similarQuestionsList}
        similarError={similarError}
        activeSimilarIdx={activeSimilarIdx}
        setActiveSimilarIdx={setActiveSimilarIdx}
        aiModalTab={aiModalTab}
        setAiModalTab={setAiModalTab}
        previewImage={previewImage}
        setPreviewImage={setPreviewImage}
        handleSolveQuestion={handleSolveQuestion}
        handleGenerateSimilarQuestions={handleGenerateSimilarQuestions}
        handleOpenQuestionReport={handleOpenQuestionReport}
        handleGenerateQuestionReport={handleGenerateQuestionReport}
        reportLoading={reportLoading}
        reportText={reportText}
        reportError={reportError}
        activeSupportItem={activeSupportItem}
        setActiveSupportItem={setActiveSupportItem}
        activeSupportTab={activeSupportTab}
        setActiveSupportTab={setActiveSupportTab}
        supportFeedbackLoading={supportFeedbackLoading}
        supportFeedbackError={supportFeedbackError}
        supportFeedbackText={supportFeedbackText}
        supportAnalysisLoading={supportAnalysisLoading}
        supportAnalysisError={supportAnalysisError}
        supportAnalysisText={supportAnalysisText}
        handleSupportGetFeedback={handleSupportGetFeedback}
        handleSupportGetAnalysis={handleSupportGetAnalysis}
        formatAnalysisTable={formatAnalysisTable}
        setReturnToSupportItem={setReturnToSupportItem}
        openImagePreview={openImagePreview}
        topicErrors={topicErrors}
      />

    </div>
  );
};
