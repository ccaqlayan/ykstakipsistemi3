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
import { uploadQuestionErrorImage } from '../services/storageUpload';
import { YKS_SUBJECTS, ERROR_REASON_LABELS, YKS_CURRICULUM_TOPICS } from '../data/initialData';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

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
  const [filterMatchStatus, setFilterMatchStatus] = useState<string>('ALL');

  // Topic tips state
  const [activeTipTopic, setActiveTipTopic] = useState<{ subject: string; topicName: string } | null>(null);
  const [tipLoading, setTipLoading] = useState<boolean>(false);
  const [topicTipData, setTopicTipData] = useState<{
    mistakes: Array<{ mistake: string; correction: string }>;
    tips: string[];
    summary: string;
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
  const [aiModalTab, setAiModalTab] = useState<'solution' | 'similar'>('solution');

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

  // Filters
  const [filterRevised, setFilterRevised] = useState<string>('UNREVISED');
  const [filterSubject, setFilterSubject] = useState<string>('ALL');
  const [sortOption, setSortOption] = useState<string>('date_desc');
  const [filterExamId, setFilterExamId] = useState<string | null>(null);

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
          summary: data.summary,
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
    } else {
      setSolveSolution(null);
      setSimilarQuestionsList([]);
      setActiveSimilarIdx(0);
    }
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
        <div className="space-y-6 animate-fade-in">
          
          {/* Top KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between shadow-sm">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold">Toplam Deneme</span>
                <Target className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-black text-white">{totalBranchExamsCount}</span>
                <span className="text-[10px] text-emerald-400 font-mono font-semibold" title={`${analyzedBranchExamsCount} / ${totalBranchExamsCount} Deneme Analiz Edildi`}>
                  %{analyzedBranchExamsPercentage} Analiz Edildi
                </span>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between shadow-sm">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold">Net Ortalaması</span>
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-black text-emerald-400">{avgNetOverall}</span>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between shadow-sm">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold">Hata Defteri</span>
                <AlertTriangle className="w-4 h-4 text-rose-400" />
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-black text-rose-400">{unrevisedErrorsCount}</span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {revisedErrorsCount} tekrar (%{revisionPercentage})
                </span>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between shadow-sm">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold">Toplam Süre</span>
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-xl font-bold text-amber-300">
                  {totalDurationMinutes > 0 ? `${Math.floor(totalDurationMinutes / 60)}s ${totalDurationMinutes % 60}dk` : '0dk'}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  Ort. {avgDurationMinutes} dk/deneme
                </span>
              </div>
            </div>
          </div>

          {/* Chart Section 1: Net Gelişim Trendi */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4 transition-all duration-300 hover:scale-[1.015] hover:shadow-xl hover:shadow-indigo-500/5 hover:border-slate-700/80">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                  <TrendingUp className="w-4 h-4 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Branş Denemeleri Net Gelişim Grafiği</h3>
                  <p className="text-[11px] text-slate-400">Tarihsel net değişim süreci ve ortalama çizgisi</p>
                </div>
              </div>

              {/* Filters for Line Chart */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Limit Toggle */}
                <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex space-x-1">
                  {(['10', '30', 'ALL'] as const).map(limit => (
                    <button
                      key={limit}
                      onClick={() => setChartLimit(limit)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        chartLimit === limit
                          ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/20'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {limit === '10' ? 'Son 10' : limit === '30' ? 'Son 30' : 'Tümü'}
                    </button>
                  ))}
                </div>

                {/* Exam Type Toggle */}
                <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex space-x-1">
                  {(['ALL', 'TYT', 'AYT'] as const).map(type => (
                    <button
                      key={type}
                      onClick={() => setChartExamType(type)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        chartExamType === type
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {type === 'ALL' ? 'Tümü' : type}
                    </button>
                  ))}
                </div>

                <select
                  value={chartSubject}
                  onChange={(e) => setChartSubject(e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer max-w-[160px] truncate"
                >
                  <option value="ALL">Tüm Dersler</option>
                  {chartAvailableSubjects.map(sub => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>
            </div>

            {trendChartData.length === 0 ? (
              <div className="py-12 text-center border border-dashed border-slate-800 rounded-xl space-y-2">
                <Activity className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400">Seçili filtreye uygun branş denemesi kaydı bulunamadı.</p>
                <button
                  onClick={handleOpenAddExamModal}
                  className="inline-flex items-center space-x-1 text-xs text-indigo-400 hover:text-indigo-300 font-semibold pt-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Yeni Deneme Ekle</span>
                </button>
              </div>
            ) : (
              <div className="h-64 sm:h-72 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <defs>
                      <linearGradient id="colorNetGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis 
                      dataKey="displayLabel" 
                      stroke="#64748b" 
                      fontSize={10} 
                      tick={{ fill: '#94a3b8', fontSize: 10 }}
                      angle={-30}
                      textAnchor="end"
                      interval={0}
                      height={50}
                      dy={5}
                      tickLine={false} 
                      axisLine={{ stroke: '#334155' }}
                    />
                    <YAxis 
                      stroke="#64748b" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={{ stroke: '#334155' }}
                    />
                    <Tooltip content={<CustomChartTooltip />} />
                    {filteredAvgNet > 0 && (
                      <ReferenceLine 
                        y={filteredAvgNet} 
                        stroke="#10b981" 
                        strokeDasharray="4 4" 
                        label={{ 
                          value: `Ort: ${filteredAvgNet}`, 
                          fill: '#10b981', 
                          fontSize: 10, 
                          position: 'insideTopRight' 
                        }} 
                      />
                    )}
                    <Area 
                      type="monotone" 
                      dataKey="net" 
                      stroke="#6366f1" 
                      strokeWidth={3} 
                      fillOpacity={1} 
                      fill="url(#colorNetGradient)" 
                      dot={{ r: 4, fill: '#818cf8', strokeWidth: 2, stroke: '#1e1b4b' }}
                      activeDot={{ r: 6, fill: '#6366f1', stroke: '#ffffff', strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Chart Section 2 & 3: Grid layout for Subject Avg & Error Reason */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            
            {/* Chart 2: Ders Bazlı Ortalama Netler */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4 transition-all duration-300 hover:scale-[1.015] hover:shadow-xl hover:shadow-emerald-500/5 hover:border-slate-700/80">
              <div className="flex items-center space-x-2 pb-3 border-b border-slate-800/80">
                <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                  <BarChart2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Ders Bazlı Ortalama Netler</h3>
                  <p className="text-[11px] text-slate-400">En yüksek performanstan düşüğe sıralama</p>
                </div>
              </div>

              {subjectAvgChartData.length === 0 ? (
                <div className="py-12 text-center border border-dashed border-slate-800 rounded-xl">
                  <p className="text-xs text-slate-400">Veri bulunmuyor.</p>
                </div>
              ) : (
                <div className="h-60 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={subjectAvgChartData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis 
                        dataKey="subject" 
                        stroke="#64748b" 
                        fontSize={9} 
                        tickLine={false} 
                        interval={0}
                        angle={-25}
                        textAnchor="end"
                        axisLine={{ stroke: '#334155' }}
                      />
                      <YAxis 
                        stroke="#64748b" 
                        fontSize={10} 
                        tickLine={false} 
                        axisLine={{ stroke: '#334155' }}
                      />
                      <Tooltip content={<CustomChartTooltip />} />
                      <Bar dataKey="avgNet" radius={[6, 6, 0, 0]}>
                        {subjectAvgChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Chart 3: Hata Nedenleri Dağılımı */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4 flex flex-col justify-between transition-all duration-300 hover:scale-[1.015] hover:shadow-xl hover:shadow-rose-500/5 hover:border-slate-700/80">
              <div className="flex items-center space-x-2 pb-3 border-b border-slate-800/80">
                <div className="p-2 bg-rose-500/10 rounded-xl border border-rose-500/20">
                  <PieChartIcon className="w-4 h-4 text-rose-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Hata Nedenleri Dağılımı</h3>
                  <p className="text-[11px] text-slate-400">Yanlışların kök neden analizi</p>
                </div>
              </div>

              {errorReasonChartData.length === 0 ? (
                <div className="py-12 text-center border border-dashed border-slate-800 rounded-xl">
                  <p className="text-xs text-slate-400">Hata kaydı bulunmuyor.</p>
                </div>
              ) : (
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-1">
                  <div className="h-52 w-52 shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={errorReasonChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="count"
                        >
                          {errorReasonChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} stroke="#0f172a" strokeWidth={2} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomChartTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Legend list */}
                  <div className="flex-1 space-y-2 w-full">
                    {errorReasonChartData.map((item) => (
                      <div key={item.reason} className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-950/60 border border-slate-800/60">
                        <div className="flex items-center space-x-2 truncate pr-2">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                          <span className="text-slate-200 font-medium truncate">{item.name}</span>
                        </div>
                        <div className="flex items-center space-x-2 shrink-0">
                          <span className="font-bold text-white">{item.count}</span>
                          <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded font-mono">
                            %{item.percentage}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Chart Section 4: En Çok Yanlış Yapılan Konular */}
          {topErrorTopicsData.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4 transition-all duration-300 hover:scale-[1.015] hover:shadow-xl hover:shadow-amber-500/5 hover:border-slate-700/80">
              <div className="flex items-center space-x-2 pb-3 border-b border-slate-800/80">
                <div className="p-2 bg-amber-500/10 rounded-xl border border-amber-500/20">
                  <Award className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">En Çok Hata Yapılan Konular</h3>
                  <p className="text-[11px] text-slate-400">Tekrar ve soru çözümüne öncelik verilmesi gereken alanlar</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {topErrorTopicsData.map((item, idx) => (
                  <div key={idx} className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl flex items-center justify-between gap-2 hover:border-amber-500/40 transition-colors">
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block truncate">
                        {item.subject}
                      </span>
                      <h4 className="text-xs font-bold text-slate-200 truncate mt-0.5">
                        {item.topicName}
                      </h4>
                    </div>
                    <div className="shrink-0 bg-rose-500/10 border border-rose-500/20 text-rose-400 font-black text-xs px-2.5 py-1 rounded-lg font-mono">
                      {item.count} Yanlış
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* SUBTAB 1: YANLIŞ TABLOSU (Eksik Konu Analizi) */}
      {activeSubTab === 'errors' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/60">
            <h2 className="text-sm font-bold text-white flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              <span>Yanlış Yapılan Konular ve Çözüm Takibi</span>
              {filterExamId && (() => {
                const sampleErr = topicErrors.find(e => e.examId === filterExamId);
                const sourceName = sampleErr?.publisher || 'Seçilen Kaynak';
                return (
                  <span className="ml-2 text-xs font-normal text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded-lg border border-indigo-500/20 truncate max-w-[250px]">
                    📌 Kaynak: {sourceName}
                  </span>
                );
              })()}
            </h2>
            {filterExamId && (
              <button
                type="button"
                onClick={() => setFilterExamId(null)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer shadow-sm flex items-center space-x-1 shrink-0"
              >
                <span>Filtreyi Kaldır ({topicErrors.filter(e => e.examId === filterExamId).length} Soru)</span>
              </button>
            )}
          </div>
            
          <div className="flex flex-col gap-3 w-full">
            {/* Satır 2: Durum Filtresi (Yanyana Kaymalı Sekmeler + Sayılar) */}
            <div className="flex items-center space-x-2 overflow-x-auto pb-1 no-scrollbar">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">Durum:</span>
              <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
                <button
                  type="button"
                  onClick={() => { setFilterRevised('UNREVISED'); setFilterExamId(null); }}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                    filterRevised === 'UNREVISED' && !filterExamId
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  Bekleyenler ({topicErrors.filter(e => !e.revised).length})
                </button>
                <button
                  type="button"
                  onClick={() => { setFilterRevised('REVISED'); setFilterExamId(null); }}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                    filterRevised === 'REVISED' && !filterExamId
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  Tekrar Edilenler ({topicErrors.filter(e => e.revised).length})
                </button>
                <button
                  type="button"
                  onClick={() => { setFilterRevised('ALL'); setFilterExamId(null); }}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                    filterRevised === 'ALL' && !filterExamId
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  Tümü ({topicErrors.length})
                </button>
              </div>
            </div>

            {/* Satır 3: Ders, Eşleşme ve Sıralama Açılır Menüleri */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              {/* Ders Filtresi */}
              <div className="flex items-center space-x-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ders:</span>
                <select
                  value={filterSubject}
                  onChange={(e) => { setFilterSubject(e.target.value); setFilterExamId(null); }}
                  className="bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 max-w-[180px] truncate cursor-pointer"
                >
                  <option value="ALL">Tüm Dersler ({topicErrors.length})</option>
                  {Array.from(new Set(topicErrors.map((err) => err.subject)))
                    .filter((sub): sub is string => typeof sub === 'string')
                    .sort((a, b) => a.localeCompare(b, 'tr'))
                    .map((sub) => {
                      const count = topicErrors.filter(e => e.subject === sub).length;
                      return (
                        <option key={sub} value={sub}>{sub} ({count})</option>
                      );
                    })}
                </select>
              </div>

              {/* Eşleşme Filtresi */}
              <div className="flex items-center space-x-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Eşleşme:</span>
                <select
                  value={filterMatchStatus}
                  onChange={(e) => { setFilterMatchStatus(e.target.value); setFilterExamId(null); }}
                  className="bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="ALL">Tüm Kaynaklar</option>
                  <option value="MATCHED">Eşleşme Olanlar</option>
                  <option value="BOOK">Kitap Eşleşmeleri</option>
                  <option value="EXAM">Deneme Eşleşmeleri</option>
                  <option value="NOT_MATCHED">Eşleşme Olmayanlar</option>
                </select>
              </div>

              {/* Sıralama */}
              <div className="flex items-center space-x-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sırala:</span>
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="priority_desc">Öncelik (Yüksek → Düşük)</option>
                  <option value="priority_asc">Öncelik (Düşük → Yüksek)</option>
                  <option value="date_desc">Tarih (En Yeni → En Eski)</option>
                  <option value="date_asc">Tarih (En Eski → En Yeni)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Öğrenciye Özel Kullanışlı Çalışma ve Yönlendirme Kartı */}
          <div className="bg-slate-950/90 border border-indigo-500/20 rounded-xl p-4 flex items-start space-x-3 text-slate-300 shadow-md">
            <Sparkles className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5 animate-pulse" />
            <div className="text-xs space-y-1">
              <span className="font-bold text-slate-200 block text-sm">💡 Rehber Öğretmen Önerisi ve Hata Eritme Sistemi</span>
              {filterMatchStatus === 'ALL' && (
                <p className="text-slate-400 leading-relaxed">
                  Şu an tüm hatalarını görüntülüyorsun. Hataları daha verimli eritmek için <strong>Eşleşme</strong> filtresini kullanabilir veya kartların altındaki eşleşme kutucuklarına tıklayarak ilgili kaynağa ait tüm hataları hemen filtreleyebilirsin.
                </p>
              )}
              {filterMatchStatus === 'MATCHED' && (
                <p className="text-slate-400 leading-relaxed">
                  <strong>Tüm Eşleşmeler Filtresi:</strong> Bu listedeki hatalar doğrudan çözdüğün bir denemeden veya takip ettiğin bir kitaptan geliyor. Hatalı soruları kaynak kitaplarında veya deneme kitapçığında fiziksel olarak işaretleyip, üzerlerinden geçerek tekrar çözmeyi ihmal etme! Bu, gerçek sınav netlerini artırmanın en kesin yoludur.
                </p>
              )}
              {filterMatchStatus === 'BOOK' && (
                <p className="text-slate-400 leading-relaxed">
                  <strong>📚 Soru Bankası Analizi:</strong> Soru bankalarında takıldığın konuları görüyorsun. İlgili testleri tekrar gözden geçirmek, çözümlü videoları izlemek ve formülleri odanın duvarına asmak için mükemmel bir fırsat! Eksiklerini burada kapatıp denemelere güçlü girmelisin.
                </p>
              )}
              {filterMatchStatus === 'EXAM' && (
                <p className="text-slate-400 leading-relaxed">
                  <strong>⏱️ Sınav Esnası Hataları:</strong> Deneme sınavlarında süre baskısı altındayken yaptığın hatalar. Bunlar genellikle konu eksiğinden ziyade dikkat dağınıklığı, yanlış okuma veya formülü hatırlayamamaktan kaynaklanır. Yanlarındaki hata nedenlerini mutlaka incele!
                </p>
              )}
              {filterMatchStatus === 'NOT_MATCHED' && (
                <p className="text-slate-400 leading-relaxed">
                  <strong>✏️ Serbest Hatalar:</strong> Henüz bir kitap veya deneme ile ilişkilendirmediğin serbest hatalar. Bu hataları düzenleyip ders seçerek bir kaynakla veya denemeyle eşleştirebilirsin. Böylece çalışma planında daha sistematik bir takip sağlayabilirsin.
                </p>
              )}
            </div>
          </div>

          {sortedErrors.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-xs text-slate-400">Tebrikler! Seçili filtrede bekleyen eksik konu bulunmuyor.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {sortedErrors.map((err) => (
                <div
                  key={err.id}
                  className={`rounded-xl border transition-all duration-500 space-y-2 relative group ${
                    fadingOutIds[err.id]
                      ? 'max-h-0 !p-0 !m-0 opacity-0 scale-95 border-transparent overflow-hidden pointer-events-none'
                      : 'max-h-[500px] p-4 ' + (err.revised
                          ? 'bg-slate-950/60 border-slate-800 opacity-75'
                          : 'bg-slate-800/60 border-rose-500/30 hover:border-rose-500/60')
                  }`}
                >
                  {/* AI Feedback Hover Overlay */}
                  {err.aiFeedback && activeAiFeedbackId === err.id && (
                    <div 
                      className="absolute inset-0 bg-slate-950/95 border-2 border-indigo-500/50 rounded-xl p-4 flex flex-col justify-between z-10 animate-fade-in shadow-xl shadow-indigo-500/10"
                    >
                      <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                        {/* Header: Ders Adı / Yıldızlama / Yapay Zeka */}
                        <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-2">
                          <span className="text-[10px] font-extrabold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                            {err.subject}
                          </span>
                          <span className="text-slate-500 text-xs">/</span>
                          {renderPriorityBadge(err.priority)}
                          <span className="text-slate-500 text-xs">/</span>
                          <div className="flex items-center space-x-1 text-[10px] font-extrabold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                            <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" />
                            <span>Yapay Zeka Analizi</span>
                          </div>
                        </div>

                        {/* Content: Hata Yorumu / Konu İpucu */}
                        <div className="space-y-3 pt-1">
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">🧠 Hata Yorumu</span>
                            <p className="text-xs text-slate-200 leading-relaxed font-medium bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                              "{err.aiFeedback}"
                            </p>
                          </div>

                          {err.solutionNotes && (
                            <div className="space-y-1">
                              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">💡 Konu İpucu & Not</span>
                              <p className="text-xs text-slate-300 leading-relaxed font-medium italic bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                                "{err.solutionNotes}"
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Footer with Close Button */}
                      <div className="flex items-center justify-between border-t border-slate-800/80 pt-2 mt-2">
                        <span className="text-[9px] text-slate-500">Yapay Zeka destekli hata analizi</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveAiFeedbackId(null);
                          }}
                          className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold px-3 py-1 rounded-lg transition-colors cursor-pointer"
                        >
                          Kapat
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start justify-between gap-2 min-w-0">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 shrink-0">
                          {err.subject}
                        </span>

                        <span className="text-slate-600 text-[10px] select-none">/</span>

                        {renderPriorityBadge(err.priority)}

                        <span className="text-slate-600 text-[10px] select-none">/</span>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveSupportItem(err);
                            setActiveSupportTab('menu');
                            setSupportFeedbackText(null);
                            setSupportFeedbackError(null);
                            setSupportAnalysisText(null);
                            setSupportAnalysisError(null);
                          }}
                          className="text-[10px] font-bold text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 px-2.5 py-0.5 rounded border border-indigo-500/20 flex items-center space-x-1 cursor-pointer transition-all shrink-0 shadow-sm"
                          title="Yapay Zeka Desteği"
                        >
                          <Brain className="w-3 h-3 text-indigo-400 animate-pulse" />
                          <span>Yapay Zeka Desteği</span>
                        </button>
                      </div>
                      <h3 className="text-sm font-bold text-white mt-1.5 flex flex-wrap items-center gap-1.5 sm:gap-2 min-w-0">
                        {err.imageUrl && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openImagePreview(err.imageUrl!, `${err.subject} - ${err.topicName}`);
                            }}
                            className="p-1 sm:px-2 sm:py-1 rounded-md bg-indigo-500/20 hover:bg-indigo-500/35 text-indigo-300 hover:text-white border border-indigo-500/40 transition-all flex flex-col sm:flex-row items-center justify-center sm:space-x-1 cursor-pointer shrink-0 shadow-sm"
                            title="Soru fotoğrafını görmek için tıklayın"
                          >
                            <Camera className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-indigo-400" />
                            <span className="text-[8px] sm:text-[10px] font-bold tracking-tight sm:tracking-wide leading-none mt-0.5 sm:mt-0">Fotoğraf</span>
                          </button>
                        )}
                        <span 
                          onClick={() => handleFetchTopicTips(err.subject, err.topicName)}
                          className="break-words min-w-0 cursor-pointer hover:text-indigo-400 border-b border-dashed border-indigo-500/20 hover:border-indigo-400/60 pb-0.5 transition-all inline-flex items-center space-x-1"
                          title="Bu konudaki yaygın hatalar ve yapay zeka ipuçları için tıklayın"
                        >
                          <span>{err.topicName}</span>
                          <Sparkles className="w-3 h-3 text-amber-400 animate-pulse inline-block shrink-0" />
                        </span>
                      </h3>
                      {err.publisher && (
                        <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                          <p className="text-[11px] text-slate-400 truncate">{err.publisher}</p>
                          {err.examId && (
                            <button
                              type="button"
                              onClick={() => setFilterExamId(err.examId || null)}
                              className={`inline-flex items-center space-x-1 text-[9px] font-bold px-1.5 py-0.5 rounded cursor-pointer hover:opacity-80 transition-all ${
                                err.examTypeRef === 'book'
                                  ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                                  : err.examTypeRef === 'branch' 
                                  ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20' 
                                  : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                              }`}
                              title="Bu kaynak ile eşleşen diğer hataları görmek için tıklayın"
                            >
                              <Link className="w-2.5 h-2.5 shrink-0" />
                              <span>
                                {err.examTypeRef === 'book' 
                                  ? 'Kitap Eşleşmesi' 
                                  : err.examTypeRef === 'branch' 
                                  ? 'Branş Eşleşmesi' 
                                  : 'Genel Eşleşme'}
                              </span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-1 shrink-0 bg-slate-900/80 p-1 rounded-lg border border-slate-800">
                      <button
                        onClick={() => handleOpenEditErrorModal(err)}
                        className="text-slate-400 hover:text-indigo-400 p-1.5 transition-colors rounded-md hover:bg-slate-800 cursor-pointer"
                        title="Hatayı Düzenle"
                      >
                        <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>
                      <button
                        onClick={() => setDeletingItem({ type: 'error', id: err.id, title: `${err.subject} - ${err.topicName}` })}
                        className="text-slate-400 hover:text-rose-400 p-1.5 transition-colors rounded-md hover:bg-slate-800 cursor-pointer"
                        title="Hatayı Sil"
                      >
                        <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="text-xs bg-slate-950 p-2.5 rounded-lg border border-slate-800 space-y-1">
                    <div className="text-slate-300">
                      <strong className="text-slate-400">Hata Nedeni:</strong>{' '}
                      <span className="text-rose-300 font-medium">
                        {ERROR_REASON_LABELS[err.errorReason] || err.errorReason}
                      </span>
                    </div>
                    {err.solutionNotes && (
                      <div className="text-slate-400 italic">"{err.solutionNotes}"</div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[11px] font-mono text-slate-500">{err.date}</span>

                    {(() => {
                      const isTemporarilyRevised = !!revisingIds[err.id];
                      const isRevised = err.revised || isTemporarilyRevised;

                      return (
                        <button
                          onClick={() => {
                            if (err.revised) {
                              // If already permanently revised, toggle it back immediately
                              onUpdateTopicError({
                                ...err,
                                revised: false
                              });
                            } else if (!isTemporarilyRevised) {
                              // Show "Tekrar Edildi" instantly in UI
                              setRevisingIds(prev => ({ ...prev, [err.id]: true }));
                              
                              // If we are showing only unrevised topics, start fade out 600ms before removing
                              if (filterRevised === 'UNREVISED') {
                                setTimeout(() => {
                                  setFadingOutIds(prev => ({ ...prev, [err.id]: true }));
                                }, 2400);
                              }

                              // Persist as revised in state / DB after 3 seconds
                              setTimeout(() => {
                                onUpdateTopicError({
                                  ...err,
                                  revised: true
                                });
                                setRevisingIds(prev => {
                                  const updated = { ...prev };
                                  delete updated[err.id];
                                  return updated;
                                });
                                setFadingOutIds(prev => {
                                  const updated = { ...prev };
                                  delete updated[err.id];
                                  return updated;
                                });
                              }, 3000);
                            }
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                            isRevised
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-rose-600 hover:bg-rose-500 text-white shadow-sm cursor-pointer'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{isRevised ? 'Tekrar Edildi' : 'Tekrar Ettim'}</span>
                        </button>
                      );
                    })()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 2: BRANŞ DENEME LİSTESİ */}
      {activeSubTab === 'branch_list' && (() => {
        // Compute unique subjects present in branchExams
        const enteredSubjects = Array.from(new Set(branchExams.map(ex => ex.subject)))
          .filter((s): s is string => Boolean(s))
          .sort((a, b) => a.localeCompare(b, 'tr'));

        // Filter branch exams based on selected subject filter
        const filteredExams = listSubjectFilter === 'ALL'
          ? branchExams
          : branchExams.filter(ex => ex.subject === listSubjectFilter);

        // Sort descending by date
        const sortedExams = [...filteredExams].sort((a, b) => 
          (b.date || '').localeCompare(a.date || '')
        );

        // Pagination calculations
        const ITEMS_PER_PAGE = 20;
        const totalPages = Math.ceil(sortedExams.length / ITEMS_PER_PAGE) || 1;
        const safePage = Math.min(listCurrentPage, totalPages);
        const startIndex = (safePage - 1) * ITEMS_PER_PAGE;
        const paginatedExams = sortedExams.slice(startIndex, startIndex + ITEMS_PER_PAGE);

        return (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            
            {/* Header & Subject Filter Buttons */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center space-x-2">
                  <Target className="w-4 h-4 text-indigo-400" />
                  <span>Çözülen Branş Denemeleri Geçmişi</span>
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Sistemde toplam <span className="text-indigo-400 font-bold">{branchExams.length}</span> adet branş denemesi kayıtlıdır
                </p>
              </div>

              {/* Subject Filter Buttons Bar */}
              {enteredSubjects.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1 lg:pt-0">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                    Ders Filtresi:
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setListSubjectFilter('ALL');
                      setListCurrentPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                      listSubjectFilter === 'ALL'
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 ring-1 ring-indigo-400'
                        : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                    }`}
                  >
                    <span>Tümü</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${listSubjectFilter === 'ALL' ? 'bg-indigo-700 text-white' : 'bg-slate-800 text-slate-400'}`}>
                      {branchExams.length}
                    </span>
                  </button>

                  {enteredSubjects.map((sub) => {
                    const count = branchExams.filter(e => e.subject === sub).length;
                    const isSelected = listSubjectFilter === sub;
                    return (
                      <button
                        key={sub}
                        type="button"
                        onClick={() => {
                          setListSubjectFilter(sub);
                          setListCurrentPage(1);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 ring-1 ring-indigo-400'
                            : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                        }`}
                      >
                        <span>{sub}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-indigo-700 text-white' : 'bg-slate-800 text-slate-400'}`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Table or Empty State */}
            {sortedExams.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl space-y-2">
                <Target className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400">
                  {listSubjectFilter === 'ALL'
                    ? 'Henüz branş denemesi kaydedilmedi.'
                    : `"${listSubjectFilter}" dersine ait kaydedilmiş branş denemesi bulunamadı.`}
                </p>
                {listSubjectFilter !== 'ALL' && (
                  <button
                    onClick={() => {
                      setListSubjectFilter('ALL');
                      setListCurrentPage(1);
                    }}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer underline"
                  >
                    Tüm Denemeleri Göster
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto rounded-xl border border-slate-800/80">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-950">
                        <th className="p-3">Tarih</th>
                        <th className="p-3">Sınav</th>
                        <th className="p-3">Ders</th>
                        <th className="p-3">Yayınevi / Yayın Adı</th>
                        <th className="p-3 text-center text-emerald-400">Doğru</th>
                        <th className="p-3 text-center text-rose-400">Yanlış</th>
                        <th className="p-3 text-center text-slate-400">Boş</th>
                        <th className="p-3 text-center text-indigo-400 font-bold">Net</th>
                        <th className="p-3 text-center">Süre</th>
                        <th className="p-3 text-center">Analiz Durumu</th>
                        <th className="p-3 text-right">İşlem</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                      {paginatedExams.map((ex) => (
                        <tr key={ex.id} className="hover:bg-slate-800/60 transition-colors">
                          <td className="p-3 font-mono text-slate-300 whitespace-nowrap">{ex.date}</td>
                          <td className="p-3 font-bold text-indigo-400 whitespace-nowrap">{ex.examType}</td>
                          <td className="p-3 font-semibold text-white whitespace-nowrap">{ex.subject}</td>
                          <td className="p-3 text-slate-300 font-medium">
                            {ex.publisher}
                            {ex.notes && <span className="block text-[10px] text-slate-500 italic mt-0.5">{ex.notes}</span>}
                          </td>
                          <td className="p-3 text-center font-mono text-emerald-400 font-bold">{String(ex.correct).replace('.', ',')}</td>
                          <td className="p-3 text-center font-mono text-rose-400">{String(ex.wrong).replace('.', ',')}</td>
                          <td className="p-3 text-center font-mono text-slate-400">{String(ex.empty).replace('.', ',')}</td>
                          <td className="p-3 text-center font-mono text-indigo-400 font-extrabold text-sm">{String(ex.net).replace('.', ',')}</td>
                          <td className="p-3 text-center font-mono text-slate-400 whitespace-nowrap">{ex.durationMinutes ? `${ex.durationMinutes} dk` : '-'}</td>
                          <td className="p-3 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => {
                                if (onUpdateBranchExam) {
                                  onUpdateBranchExam({
                                    ...ex,
                                    isAnalyzed: !ex.isAnalyzed
                                  });
                                }
                              }}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all inline-flex items-center space-x-1 cursor-pointer border ${
                                ex.isAnalyzed
                                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25'
                                  : 'bg-amber-500/15 text-amber-300 border-amber-500/30 hover:bg-amber-500/25'
                              }`}
                              title="Analiz durumunu değiştirmek için tıklayın"
                            >
                              {ex.isAnalyzed ? (
                                <>
                                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                  <span>Analiz Edildi</span>
                                </>
                              ) : (
                                <>
                                  <Clock className="w-3 h-3 text-amber-400" />
                                  <span>Analiz Bekliyor</span>
                                </>
                              )}
                            </button>
                          </td>
                          <td className="p-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end space-x-1">
                              <button
                                onClick={() => handleOpenEditExamModal(ex)}
                                className="text-slate-500 hover:text-indigo-400 p-1.5 transition-colors rounded-lg hover:bg-slate-800 cursor-pointer"
                                title="Denemeyi Düzenle"
                              >
                                <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              </button>
                              <button
                                onClick={() => setDeletingItem({ type: 'exam', id: ex.id, title: `${ex.date} ${ex.subject} (${ex.publisher || 'Branş Denemesi'})` })}
                                className="text-slate-500 hover:text-rose-400 p-1.5 transition-colors rounded-lg hover:bg-slate-800 cursor-pointer"
                                title="Denemeyi Sil"
                              >
                                <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination controls when > 20 items or > 1 total page */}
                {sortedExams.length > 20 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800/80 text-xs">
                    <div className="text-slate-400 font-medium">
                      Toplam <span className="font-bold text-slate-200">{sortedExams.length}</span> kayıttan{' '}
                      <span className="font-bold text-indigo-400">{startIndex + 1} - {Math.min(startIndex + ITEMS_PER_PAGE, sortedExams.length)}</span> arası gösteriliyor (Sayfa {safePage} / {totalPages})
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <button
                        type="button"
                        disabled={safePage === 1}
                        onClick={() => setListCurrentPage(prev => Math.max(prev - 1, 1))}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center space-x-1 ${
                          safePage === 1
                            ? 'bg-slate-950 text-slate-600 border border-slate-800/60 cursor-not-allowed opacity-50'
                            : 'bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white border border-slate-700 cursor-pointer'
                        }`}
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        <span>Önceki</span>
                      </button>

                      <div className="flex items-center space-x-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                          <button
                            key={pageNum}
                            type="button"
                            onClick={() => setListCurrentPage(pageNum)}
                            className={`w-8 h-8 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                              safePage === pageNum
                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                                : 'bg-slate-950 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800'
                            }`}
                          >
                            {pageNum}
                          </button>
                        ))}
                      </div>

                      <button
                        type="button"
                        disabled={safePage === totalPages}
                        onClick={() => setListCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center space-x-1 ${
                          safePage === totalPages
                            ? 'bg-slate-950 text-slate-600 border border-slate-800/60 cursor-not-allowed opacity-50'
                            : 'bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white border border-slate-700 cursor-pointer'
                        }`}
                      >
                        <span>Sonraki</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

          </div>
        );
      })()}

      {/* Modal: Add/Edit Topic Error */}
      {showAddErrorModal && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) { setShowAddErrorModal(false); setEditingError(null); } }}
        >
          {(() => {
            const isEditing = editingError !== null;
            const showStep2 = isEditing || errorSubject !== '';
            const showStep3 = isEditing || (showStep2 && topicName.trim() !== '');
            const showStep4 = isEditing || (showStep3 && errorReason !== '');
            const showPrioritySection = isEditing || !!aiFeedback;
            const isFormValid = errorPublisher.trim() !== '' && errorSubject !== '' && topicName.trim() !== '' && errorReason !== '';

            return (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-5 md:p-6 shadow-2xl space-y-3 max-h-[90vh] overflow-y-auto animate-fade-in">
                <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                  <h3 className="text-sm md:text-base font-bold text-white flex items-center space-x-1.5">
                    <BookOpen className="w-4 h-4 text-rose-400" />
                    <span>{isEditing ? 'Hata Kaydını Düzenle' : 'Hata Defterine Ekle'}</span>
                  </h3>
                  <button 
                    type="button" 
                    onClick={() => { setShowAddErrorModal(false); setEditingError(null); }}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleCreateTopicError} className="space-y-3">
                  {/* Step 1: Publisher & Subject (Always Visible) */}
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 mb-1">Ders Seçimi</label>
                        <select
                          required
                          value={errorSubject}
                          onChange={(e) => {
                            const sub = e.target.value;
                            setErrorSubject(sub);
                            setTopicName('');
                            setIsCustomTopic(false);
                            setErrorReason('' as any);
                            setSelectedExamRef('other');
                            setErrorPublisher('');
                          }}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium cursor-pointer transition-colors"
                        >
                          <option value="">-- Ders Seçiniz --</option>
                          {Array.from(new Set(YKS_SUBJECTS.AYT.concat(YKS_SUBJECTS.TYT))).map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 mb-1">Sınav / Kaynak Eşleşmesi</label>
                        <select
                          disabled={!errorSubject}
                          value={selectedExamRef}
                          onChange={(e) => handleExamRefChange(e.target.value)}
                          className={`w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium transition-colors ${
                            !errorSubject ? 'cursor-not-allowed opacity-50 bg-slate-900 border-slate-800' : 'cursor-pointer'
                          }`}
                        >
                          {!errorSubject ? (
                            <option value="other">-- Önce Ders Seçiniz --</option>
                          ) : (
                            <>
                              <option value="other">Diğer / Manuel Giriş</option>
                              {matchingBooks.length > 0 && (
                                <optgroup label="Kitap Kaynak Takibi">
                                  {matchingBooks.map((book) => (
                                    <option key={`book_${book.id}`} value={`book_${book.id}`}>
                                      {`[Kitap] ${book.publisher} - ${book.bookTitle}`}
                                    </option>
                                  ))}
                                </optgroup>
                              )}
                              {matchingBranchExams.length > 0 && (
                                <optgroup label="Son 3 Branş Denemesi">
                                  {matchingBranchExams.map((b) => (
                                    <option key={`branch_${b.id}`} value={`branch_${b.id}`}>
                                      {`[Branş] ${b.publisher} - ${b.date}`}
                                    </option>
                                  ))}
                                </optgroup>
                              )}
                              {last3GeneralMocks.length > 0 && (
                                <optgroup label="Son 3 Genel Deneme">
                                  {last3GeneralMocks.map((g) => (
                                    <option key={`general_${g.id}`} value={`general_${g.id}`}>
                                      {`[Genel] ${g.title} - ${g.date}`}
                                    </option>
                                  ))}
                                </optgroup>
                              )}
                            </>
                          )}
                        </select>
                      </div>
                    </div>

                    {selectedExamRef === 'other' ? (
                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 mb-1">Yayınevi / Deneme / Kaynak Kitap Adı</label>
                        <input
                          type="text"
                          required
                          placeholder="Ör: Bilgi Sarmal 15li Deneme #3 veya Palme Soru Bankası"
                          value={errorPublisher}
                          onChange={(e) => setErrorPublisher(e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium transition-colors"
                        />
                      </div>
                    ) : (
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 mb-1">Eşleştirilen Sınav / Kaynak Kitap</label>
                        <input
                          type="text"
                          disabled
                          value={errorPublisher}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-400 font-medium focus:outline-none cursor-not-allowed"
                        />
                      </div>
                    )}
                  </div>

                  {/* Step 2: Topic Selector (Animated based on showStep2) */}
                  <div className={`transition-all duration-500 ease-in-out overflow-hidden ${
                    showStep2 
                      ? 'max-h-[220px] opacity-100 mt-3 translate-y-0 pointer-events-auto' 
                      : 'max-h-0 opacity-0 mt-0 -translate-y-2 pointer-events-none'
                  }`}>
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-bold text-slate-300">Yanlış Yapılan Konu Adı</label>
                      <select
                        value={isCustomTopic ? 'custom' : topicName}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === 'custom') {
                            setIsCustomTopic(true);
                            setTopicName('');
                          } else {
                            setIsCustomTopic(false);
                            setTopicName(val);
                          }
                          setErrorReason('' as any);
                        }}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-semibold text-rose-300 cursor-pointer transition-colors"
                      >
                        <option value="">-- Konu Seçiniz --</option>
                        {(YKS_CURRICULUM_TOPICS[errorSubject] || []).map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                        <option value="custom">✍️ Diğer / Özel Konu Yaz...</option>
                      </select>

                      {isCustomTopic && (
                        <input
                          type="text"
                          required
                          placeholder="Ör: Türevde Max-Min Problemleri veya Elektrostatik"
                          value={topicName}
                          onChange={(e) => setTopicName(e.target.value)}
                          className="w-full bg-slate-800 border border-indigo-500/50 rounded-xl px-3 py-2 text-xs text-white focus:outline-none mt-1 animate-fade-in font-medium transition-all"
                        />
                      )}
                    </div>
                  </div>

                  {/* Step 3: Error Reason Selector (Animated based on showStep3) */}
                  <div className={`transition-all duration-500 ease-in-out overflow-hidden ${
                    showStep3 
                      ? 'max-h-[120px] opacity-100 mt-3 translate-y-0 pointer-events-auto' 
                      : 'max-h-0 opacity-0 mt-0 -translate-y-2 pointer-events-none'
                  }`}>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">Hata Nedeni</label>
                      <select
                        value={errorReason}
                        onChange={(e) => setErrorReason(e.target.value as any)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium cursor-pointer transition-colors"
                      >
                        <option value="">-- Hata Nedeni Seçiniz --</option>
                        <option value="bilgi_eksigi">Bilgi Eksikliği (Konuyu tam bilmiyorum)</option>
                        <option value="dikkat_hatasi">Dikkat / İşlem Hatası</option>
                        <option value="zaman_yetmedi">Zaman Yetmedi / Süre Baskısı</option>
                        <option value="iki_sik_arasinda">İki Şık Arasında Kaldım</option>
                        <option value="soru_kokunu_yanlis_okuma">Soru Kökünü Yanlış Okudum</option>
                      </select>
                    </div>
                  </div>

                  {/* Step 4: Notes (Animated based on showStep4) */}
                  <div className={`transition-all duration-500 ease-in-out overflow-hidden ${
                    showStep4 
                      ? 'max-h-[120px] opacity-100 mt-3 translate-y-0 pointer-events-auto' 
                      : 'max-h-0 opacity-0 mt-0 -translate-y-2 pointer-events-none'
                  }`}>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">Açıklama</label>
                      <input
                        type="text"
                        placeholder="Ör: Kök bulma formülünde işaret kuralı tekrar edilecek."
                        value={solutionNotes}
                        onChange={(e) => setSolutionNotes(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium transition-colors"
                      />
                    </div>
                  </div>

                  {/* Optional Question Photo Upload (Animated based on showStep4) */}
                  <div className={`transition-all duration-500 ease-in-out overflow-hidden ${
                    showStep4 
                      ? 'max-h-[300px] opacity-100 mt-3 translate-y-0 pointer-events-auto' 
                      : 'max-h-0 opacity-0 mt-0 -translate-y-2 pointer-events-none'
                  }`}>
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-bold text-slate-300 flex items-center justify-between">
                        <span className="flex items-center space-x-1">
                          <Camera className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Soru Fotoğrafı (İsteğe Bağlı)</span>
                        </span>
                        {errorImageUrl && (
                          <span className="text-[10px] text-emerald-400 font-semibold flex items-center space-x-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Yüklendi</span>
                          </span>
                        )}
                      </label>

                      {errorImageUrl ? (
                        <div className="relative rounded-xl border border-indigo-500/40 bg-slate-950 p-2.5 space-y-2 animate-fade-in">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center space-x-3 overflow-hidden">
                              <img 
                                src={errorImageUrl} 
                                alt="Soru Görseli Önizleme" 
                                className="w-12 h-12 object-cover rounded-lg border border-slate-800 shrink-0"
                              />
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-white truncate">Soru Fotoğrafı Yüklendi</p>
                                {imageStats ? (
                                  <p className="text-[10px] text-emerald-400 font-medium mt-0.5">
                                    Sıkıştırıldı: <span className="line-through text-slate-500">{imageStats.originalKb} KB</span> ➔ <strong className="text-emerald-300">{imageStats.compressedKb} KB</strong>
                                    {imageStats.originalKb > imageStats.compressedKb && (
                                      <span className="text-emerald-400/90 ml-1">
                                        (%{Math.max(0, Math.round((1 - imageStats.compressedKb / imageStats.originalKb) * 100))} Tasarruf)
                                      </span>
                                    )}
                                  </p>
                                ) : (
                                  <p className="text-[10px] text-slate-400 mt-0.5">Otomatik hatırlanacak görsel</p>
                                )}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setErrorImageUrl('');
                                setImageStats(null);
                                setImageError(null);
                              }}
                              className="text-rose-400 hover:text-rose-300 p-2 rounded-lg hover:bg-rose-500/10 transition-colors shrink-0 cursor-pointer"
                              title="Fotoğrafı Kaldır"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>


                        </div>
                      ) : (
                        <div className="relative">
                          <label className={`w-full flex flex-col items-center justify-center p-3 rounded-xl border-2 border-dashed transition-all cursor-pointer ${
                            isCompressingImage 
                              ? 'border-indigo-500 bg-indigo-500/5' 
                              : 'border-slate-700/80 hover:border-indigo-500/80 bg-slate-800/50 hover:bg-slate-800'
                          }`}>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageFileChange}
                              disabled={isCompressingImage}
                              className="hidden"
                            />
                            {isCompressingImage ? (
                              <div className="flex items-center space-x-2 py-1 text-indigo-300">
                                <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                                <span className="text-xs font-semibold">Görsel sıkıştırılıyor ve optimize ediliyor...</span>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-2 text-slate-400 hover:text-slate-200">
                                <UploadCloud className="w-4 h-4 text-indigo-400" />
                                <span className="text-xs font-semibold">Sorunun Fotoğrafını Yükle</span>
                                <span className="text-[10px] text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">Otomatik Sıkıştırma</span>
                              </div>
                            )}
                          </label>
                          {imageError && (
                            <p className="text-[10px] text-rose-400 font-medium mt-1">{imageError}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Step 5: AI Priority Analysis Button (Animated based on aiButtonFaded) */}
                  <div className={`transition-all duration-500 ease-in-out overflow-hidden ${
                    aiButtonFaded 
                      ? 'max-h-0 opacity-0 mt-0 pointer-events-none scale-95' 
                      : 'max-h-[120px] opacity-100 mt-3 scale-100 pointer-events-auto'
                  }`}>
                    <button
                      type="button"
                      disabled={isAnalyzing || !isFormValid || aiSuccess}
                      onClick={handleAIAnalyzePriority}
                      className={`w-full flex items-center justify-center space-x-2 py-2 px-4 rounded-xl text-xs font-bold transition-all duration-300 shadow-md ${
                        aiSuccess
                          ? 'bg-emerald-600 text-white shadow-emerald-600/20'
                          : !isFormValid
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                          : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white active:scale-[0.98] shadow-indigo-600/20 cursor-pointer'
                      }`}
                    >
                      {isAnalyzing ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Yapay Zeka Analiz Ediyor...</span>
                        </>
                      ) : aiSuccess ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                          <span>Yapay Zeka Analizi Başarılı! ✨</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                          <span>Yapay Zeka Analizi Yap</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* AI Feedback Display (Animated based on aiFeedback) */}
                  <div className={`transition-all duration-500 ease-in-out overflow-hidden ${
                    aiFeedback 
                      ? 'max-h-[500px] opacity-100 mt-3 scale-100 pointer-events-auto border border-indigo-500/30 p-3 bg-indigo-950/40 rounded-xl' 
                      : 'max-h-0 opacity-0 mt-0 scale-95 pointer-events-none border-transparent p-0'
                  }`}>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-1.5 text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>YKS Yapay Zeka Analizi</span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed font-medium">{aiFeedback}</p>
                    </div>
                  </div>

                  {/* Step 6: Priority Level Selection (Animated based on showPrioritySection) */}
                  <div className={`transition-all duration-500 ease-in-out overflow-hidden ${
                    showPrioritySection 
                      ? 'max-h-[120px] opacity-100 mt-3 translate-y-0 pointer-events-auto' 
                      : 'max-h-0 opacity-0 mt-0 -translate-y-2 pointer-events-none'
                  }`}>
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-300 flex items-center justify-between">
                        <span>Öncelik Seviyesi (1-5 Yıldız)</span>
                        <span className="text-[9px] text-slate-400 font-normal">Değiştirmek için yıldızlara tıklayabilirsiniz</span>
                      </label>
                      <div className="flex items-center space-x-1.5 bg-slate-850 p-2 rounded-xl border border-slate-800/80">
                        {[1, 2, 3, 4, 5].map((star) => {
                          const currentVal = typeof priority === 'number' 
                            ? priority 
                            : priority === 'high' 
                            ? 5 
                            : priority === 'medium' 
                            ? 3 
                            : priority === 'low' 
                            ? 1 
                            : parseInt(priority as string, 10) || 5;

                          return (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setPriority(star)}
                              className="p-0.5 hover:scale-110 transition-transform focus:outline-none cursor-pointer"
                              title={`${star} Yıldız`}
                            >
                              <Star
                                className={`w-5.5 h-5.5 ${
                                  star <= currentVal 
                                    ? 'text-amber-400 fill-amber-400' 
                                    : 'text-slate-600 hover:text-slate-500'
                                }`}
                              />
                            </button>
                          );
                        })}
                        <span className="text-[10px] text-slate-300 ml-2 font-semibold">
                          {(() => {
                            const currentVal = typeof priority === 'number' 
                              ? priority 
                              : priority === 'high' 
                              ? 5 
                              : priority === 'medium' 
                              ? 3 
                              : priority === 'low' 
                              ? 1 
                              : parseInt(priority as string, 10) || 5;
                            
                            if (currentVal >= 5) return '🔥 5/5 Kritik Öncelik (Acil Tekrar)';
                            if (currentVal === 4) return '🔴 4/5 Yüksek Öncelik';
                            if (currentVal === 3) return '🟡 3/5 Orta Öncelik';
                            if (currentVal === 2) return '🔵 2/5 Düşük-Orta Öncelik';
                            return '🟢 1/5 Düşük Öncelik';
                          })()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Footer buttons */}
                  <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => { setShowAddErrorModal(false); setEditingError(null); }}
                      className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white cursor-pointer transition-colors"
                    >
                      İptal
                    </button>
                    <button
                      type="submit"
                      disabled={!isFormValid}
                      className={`text-xs font-bold px-5 py-2 rounded-xl transition-all shadow-md ${
                        isFormValid
                          ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30 cursor-pointer'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                      }`}
                    >
                      {isEditing ? 'Güncelle' : 'Kaydet'}
                    </button>
                  </div>
                </form>
              </div>
            );
          })()}
        </div>
      )}

      {/* Modal: Add/Edit Branch Exam */}
      {showAddExamModal && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) { setShowAddExamModal(false); setEditingExam(null); } }}
        >
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">
              {editingExam ? 'Branş Denemesini Düzenle' : 'Yeni Branş Denemesi Gir'}
            </h3>

            <form onSubmit={handleCreateBranchExam} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Tarih</label>
                  <input
                    type="date"
                    required
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
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
                      setExamSubject(YKS_SUBJECTS[val][0]);
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="TYT">TYT</option>
                    <option value="AYT">AYT</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Ders</label>
                  <select
                    value={examSubject}
                    onChange={(e) => setExamSubject(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    {YKS_SUBJECTS[examType].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Yayınevi / Deneme Adı</label>
                  <input
                    type="text"
                    required
                    placeholder="Ör: 3D Yayınları Deneme #4"
                    value={publisher}
                    onChange={(e) => setPublisher(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-emerald-400 mb-1">Doğru</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="0"
                    value={correct}
                    onChange={(e) => setCorrect(sanitizeNetInput(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-rose-400 mb-1">Yanlış</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="0"
                    value={wrong}
                    onChange={(e) => setWrong(sanitizeNetInput(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Boş</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="0"
                    value={empty}
                    onChange={(e) => setEmpty(sanitizeNetInput(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Çözüm Süresi (Dakika)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Ör: 60"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(sanitizeNetInput(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Deneme Analizi Durumu</span>
                  <span className="text-[10px] text-slate-400 font-normal">Doğru, yanlış ve boş soru incelemesi</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAnalyzed(true)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 border cursor-pointer ${
                      isAnalyzed
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm shadow-emerald-500/20'
                        : 'bg-slate-800/80 text-slate-400 border-slate-700/60 hover:text-slate-200'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Analiz Edildi</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsAnalyzed(false)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 border cursor-pointer ${
                      !isAnalyzed
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm shadow-amber-500/20'
                        : 'bg-slate-800/80 text-slate-400 border-slate-700/60 hover:text-slate-200'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Analiz Edilmedi</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddExamModal(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-5 py-2 rounded-xl transition-all shadow-md"
                >
                  {editingExam ? 'Güncelle' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2-Step Confirmation Modal for Branch Exam / Topic Error Deletion */}
      <ConfirmDeleteModal
        isOpen={!!deletingItem}
        title={deletingItem?.type === 'error' ? "Konu Hatasını Sil" : "Branş Denemesini Sil"}
        itemName={deletingItem?.title}
        onConfirm={() => {
          if (deletingItem) {
            if (deletingItem.type === 'error') {
              onDeleteTopicError(deletingItem.id);
            } else {
              onDeleteBranchExam(deletingItem.id);
            }
            setDeletingItem(null);
          }
        }}
        onClose={() => setDeletingItem(null)}
      />

      {/* Lightbox Modal for Question Image */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => handleClosePreviewImage()}
        >
          <div 
            className="relative max-w-5xl w-full bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl flex flex-col space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex items-center justify-between border-b border-slate-800 pb-2.5">
              <h3 className="text-xs md:text-sm font-bold text-white flex items-center space-x-2 truncate">
                <Camera className="w-4 h-4 text-indigo-400" />
                <span>{previewImage.title} - Soru Fotoğrafı</span>
              </h3>
              <button
                onClick={() => handleClosePreviewImage()}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className={`w-full max-h-[70vh] overflow-y-auto grid ${(solveLoading || solveSolution || solveError || similarLoading || similarQuestionsList.length > 0 || similarError) ? 'grid-cols-1 lg:grid-cols-2 gap-4' : 'grid-cols-1'} bg-slate-950 rounded-xl p-3 border border-slate-800`}>
              {/* Sol Taraf / Soru Görseli */}
              <div className="flex flex-col items-center justify-center bg-slate-950/40 p-2 rounded-lg border border-slate-800/20">
                <img 
                  src={previewImage.url} 
                  alt="Soru Fotoğrafı Detayı" 
                  className="max-h-[55vh] w-auto max-w-full object-contain rounded-lg shadow-md"
                />
              </div>

              {/* Sağ Taraf / Yapay Zeka Çözüm & Benzer Soru Paneli */}
              {(solveLoading || solveSolution || solveError || similarLoading || similarQuestionsList.length > 0 || similarError) && (
                <div className="flex flex-col bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 overflow-y-auto space-y-3 min-h-[350px] lg:max-h-[55vh]">
                  {/* Tabs */}
                  <div className="flex border-b border-slate-800 pb-1 mb-2">
                    <button
                      type="button"
                      onClick={() => setAiModalTab('solution')}
                      className={`flex-1 pb-2 text-xs font-bold border-b-2 text-center transition-colors flex items-center justify-center space-x-1.5 cursor-pointer ${
                        aiModalTab === 'solution'
                          ? 'border-amber-500 text-amber-400 font-extrabold'
                          : 'border-transparent text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Soru Çözümü</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAiModalTab('similar')}
                      className={`flex-1 pb-2 text-xs font-bold border-b-2 text-center transition-colors flex items-center justify-center space-x-1.5 cursor-pointer ${
                        aiModalTab === 'similar'
                          ? 'border-indigo-500 text-indigo-400 font-extrabold'
                          : 'border-transparent text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Brain className="w-3.5 h-3.5" />
                      <span>Benzer Sorular</span>
                    </button>
                  </div>

                  {aiModalTab === 'solution' ? (
                    <div className="flex-1 flex flex-col space-y-3 min-h-0">
                      <div className="flex items-center space-x-1.5 border-b border-slate-800/60 pb-1">
                        <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                        <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider">YKS Yapay Zeka Soru Çözüm Adımları</span>
                      </div>

                      {solveLoading && (
                        <div className="flex flex-col items-center justify-center py-12 space-y-3 flex-1 text-center">
                          <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
                          <div className="space-y-1">
                            <p className="text-xs font-bold text-slate-200">Görsel Okunuyor ve Soru Çözülüyor...</p>
                            <p className="text-[10px] text-slate-400 max-w-[280px] mx-auto">
                              Gemini, soru üzerindeki şekilleri, formülleri ve metinleri analiz edip adım adım çözüm hazırlıyor. Lütfen bekleyin.
                            </p>
                          </div>
                        </div>
                      )}

                      {solveError && (
                        <div className="flex flex-col items-center justify-center py-12 space-y-3 text-center flex-1">
                          <AlertTriangle className="w-8 h-8 text-rose-500" />
                          <p className="text-xs text-rose-400 font-semibold">{solveError}</p>
                          <button
                            type="button"
                            onClick={() => handleSolveQuestion(previewImage.url, previewImage.title)}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                          >
                            Yeniden Dene
                          </button>
                        </div>
                      )}

                      {solveSolution && (
                        <div className="space-y-3 text-slate-200 overflow-y-auto pr-1">
                          {formatSolutionText(solveSolution)}
                        </div>
                      )}

                      {!solveLoading && !solveSolution && !solveError && (
                        <div className="flex flex-col items-center justify-center py-12 space-y-2 text-center flex-1">
                          <HelpCircle className="w-8 h-8 text-slate-600" />
                          <p className="text-xs text-slate-400">Bu sorunun çözümünü görmek için aşağıdaki "Yapay Zeka ile Çöz" butonuna basın.</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col space-y-3 min-h-0">
                      <div className="flex items-center space-x-1.5 border-b border-slate-800/60 pb-1">
                        <Brain className="w-4 h-4 text-indigo-400 animate-pulse" />
                        <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider">Benzer Pekiştirme Soruları</span>
                      </div>

                      {similarLoading && (
                        <div className="flex flex-col items-center justify-center py-12 space-y-3 flex-1 text-center">
                          <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
                          <div className="space-y-1">
                            <p className="text-xs font-bold text-slate-200">Benzer Soru Üretiliyor...</p>
                            <p className="text-[10px] text-slate-400 max-w-[280px] mx-auto">
                              Gemini, bu soruya benzer zorlukta ve kazanımda sizin için yeni bir özgün soru tasarlıyor. Çözümüyle birlikte hazırlanıyor.
                            </p>
                          </div>
                        </div>
                      )}

                      {similarError && (
                        <div className="flex flex-col items-center justify-center py-12 space-y-3 text-center flex-1">
                          <AlertTriangle className="w-8 h-8 text-rose-500" />
                          <p className="text-xs text-rose-400 font-semibold">{similarError}</p>
                          <button
                            type="button"
                            onClick={() => handleGenerateSimilarQuestions(previewImage.url, previewImage.title)}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                          >
                            Yeniden Dene
                          </button>
                        </div>
                      )}

                      {similarQuestionsList.length > 0 && (
                        <div className="space-y-4 text-slate-200 overflow-y-auto pr-1">
                          {/* Soru Navigasyon Sekmeleri */}
                          {similarQuestionsList.length > 1 && (
                            <div className="flex items-center space-x-2 bg-slate-950 p-2 rounded-xl border border-slate-800">
                              <span className="text-[10px] font-bold text-slate-400">Üretilen Sorular ({similarQuestionsList.length}/3):</span>
                              <div className="flex items-center space-x-1.5 flex-wrap">
                                {similarQuestionsList.map((_, idx) => (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() => {
                                      setActiveSimilarIdx(idx);
                                      setShowSimilarSolution(false);
                                    }}
                                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                                      activeSimilarIdx === idx
                                        ? 'bg-indigo-600 text-white shadow-md'
                                        : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800'
                                    }`}
                                  >
                                    Soru {idx + 1}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Soru İçeriği */}
                          {similarQuestionsList[activeSimilarIdx] && (
                            <div className="space-y-4">
                              <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 space-y-3">
                                <div className="flex items-center space-x-2 text-xs font-bold text-indigo-400">
                                  <HelpCircle className="w-4 h-4 text-indigo-400" />
                                  <span>Yapay Zeka Benzer Soru ({activeSimilarIdx + 1} / {similarQuestionsList.length})</span>
                                </div>
                                <div className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium whitespace-pre-wrap">
                                  {similarQuestionsList[activeSimilarIdx].question}
                                </div>
                              </div>

                              {/* Çözümü Göster/Gizle Butonu */}
                              <div className="flex flex-col space-y-3">
                                <button
                                  type="button"
                                  onClick={() => setShowSimilarSolution(!showSimilarSolution)}
                                  className="w-full flex items-center justify-between bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 rounded-xl p-3 text-xs font-bold text-indigo-300 transition-colors cursor-pointer"
                                >
                                  <div className="flex items-center space-x-2">
                                    <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                                    <span>{showSimilarSolution ? 'Çözümü ve Doğru Cevabı Gizle' : 'Çözümü ve Doğru Cevabı Göster'}</span>
                                  </div>
                                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${showSimilarSolution ? 'rotate-180' : ''}`} />
                                </button>

                                {/* Çözüm ve Cevap Alanı */}
                                {showSimilarSolution && (
                                  <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-xl p-4 space-y-3 animate-fade-in">
                                    <div className="space-y-1.5">
                                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">💡 Detaylı Çözüm</span>
                                      <div className="space-y-1 text-xs text-slate-300 leading-relaxed font-medium pl-1 overflow-y-auto max-h-[300px] pr-1">
                                        {formatSolutionText(similarQuestionsList[activeSimilarIdx].solution)}
                                      </div>
                                    </div>
                                    
                                    {similarQuestionsList[activeSimilarIdx].correctAnswer && (
                                      <div className="pt-2.5 border-t border-emerald-500/10 flex items-center space-x-1.5 text-xs">
                                        <span className="font-bold text-emerald-400">Doğru Cevap:</span>
                                        <span className="font-bold text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                          {similarQuestionsList[activeSimilarIdx].correctAnswer}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {!similarLoading && similarQuestionsList.length === 0 && !similarError && (
                        <div className="flex flex-col items-center justify-center py-12 space-y-2 text-center flex-1">
                          <HelpCircle className="w-8 h-8 text-slate-600" />
                          <p className="text-xs text-slate-400">Bu soruya benzer yeni sorular üretmek için aşağıdaki "Benzer Soru Sor" butonuna basın (Maksimum 3 soru).</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="w-full flex flex-col sm:flex-row gap-2 sm:justify-between sm:items-center border-t border-slate-800 pt-3">
              <div className="flex flex-wrap gap-2">
                {/* Yapay Zeka Çözüm Butonu */}
                <button
                  type="button"
                  disabled={solveLoading}
                  onClick={() => {
                    handleSolveQuestion(previewImage.url, previewImage.title);
                    setAiModalTab('solution');
                  }}
                  className={`flex items-center space-x-1.5 text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer ${
                    solveSolution
                      ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20 hover:bg-amber-500/20'
                      : 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white shadow-lg shadow-amber-500/10'
                  }`}
                >
                  {solveLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Çözüm Üretiliyor...</span>
                    </>
                  ) : solveSolution ? (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                      <span>Çözümü İncele</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                      <span>Yapay Zeka ile Çöz</span>
                    </>
                  )}
                </button>

                {/* Benzer Soru Sor Butonu */}
                <button
                  type="button"
                  disabled={similarLoading || similarQuestionsList.length >= 3}
                  onClick={() => {
                    handleGenerateSimilarQuestions(previewImage.url, previewImage.title);
                    setAiModalTab('similar');
                  }}
                  className={`flex items-center space-x-1.5 text-xs font-bold px-4 py-2 rounded-xl transition-all ${
                    similarQuestionsList.length >= 3
                      ? 'bg-slate-800 text-slate-400 cursor-not-allowed opacity-80'
                      : similarQuestionsList.length > 0
                      ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 hover:bg-indigo-500/25 cursor-pointer'
                      : 'bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white shadow-lg shadow-indigo-500/10 cursor-pointer'
                  }`}
                >
                  {similarLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Sorular Hazırlanıyor...</span>
                    </>
                  ) : similarQuestionsList.length >= 3 ? (
                    <>
                      <Brain className="w-4 h-4 text-slate-400" />
                      <span>Benzer Soru Hakkı Doldu (3/3)</span>
                    </>
                  ) : similarQuestionsList.length > 0 ? (
                    <>
                      <Brain className="w-4 h-4 text-indigo-400 animate-pulse" />
                      <span>Yeniden Benzer Soru Sor ({similarQuestionsList.length}/3)</span>
                    </>
                  ) : (
                    <>
                      <Brain className="w-4 h-4 text-indigo-300 animate-pulse" />
                      <span>Benzer Soru Sor</span>
                    </>
                  )}
                </button>

                {/* Soruyu Analiz Et Butonu */}
                <button
                  type="button"
                  onClick={() => {
                    const matchingError = topicErrors.find(e => e.imageUrl === previewImage.url || `${e.subject} - ${e.topicName}` === previewImage.title);
                    if (matchingError) {
                      setActiveSupportItem(matchingError);
                      handleSupportGetAnalysis(matchingError);
                    } else {
                      const parts = previewImage.title.split(' - ');
                      const tempItem: TopicErrorItem = {
                        id: 'temp-' + Date.now(),
                        subject: parts[0] || 'Genel',
                        topicName: parts[1] || previewImage.title,
                        examType: 'TYT',
                        imageUrl: previewImage.url,
                        errorReason: 'bilgi_eksigi',
                        priority: 5,
                        revised: false,
                        date: new Date().toISOString()
                      };
                      setActiveSupportItem(tempItem);
                      handleSupportGetAnalysis(tempItem);
                    }
                  }}
                  className="flex items-center space-x-1.5 text-xs font-bold px-4 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/25 text-purple-300 border border-purple-500/30 transition-all cursor-pointer shadow-sm"
                  title="Soru Zorluk Derecesi ve Detaylı Analiz"
                >
                  <Brain className="w-4 h-4 text-purple-400 animate-pulse" />
                  <span>Soruyu Analiz Et</span>
                </button>
              </div>

              <button
                onClick={() => handleClosePreviewImage()}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-4 py-2 rounded-xl transition-colors cursor-pointer"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Topic Tip Modal */}
      {activeTipTopic && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => {
            setActiveTipTopic(null);
            setTopicTipData(null);
            setTipError(null);
          }}
        >
          <div 
            className="relative max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl flex flex-col space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
                <div>
                  <h3 className="text-sm font-bold text-white leading-tight">Konu Analizi & Yaygın Hatalar</h3>
                  <p className="text-[10px] text-slate-400">{activeTipTopic.subject} ➔ {activeTipTopic.topicName}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setActiveTipTopic(null);
                  setTopicTipData(null);
                  setTipError(null);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto space-y-4 pr-1">
              {tipLoading && (
                <div className="flex flex-col items-center justify-center py-16 space-y-3 text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-slate-200">YKS Yapay Zeka Rehberi Konuyu İnceliyor...</p>
                    <p className="text-[10px] text-slate-400 max-w-[320px] mx-auto">
                      Sistemimiz bu konudaki en sık yapılan öğrenci hatalarını derliyor ve sınav taktiklerini hazırlıyor.
                    </p>
                  </div>
                </div>
              )}

              {tipError && (
                <div className="flex flex-col items-center justify-center py-12 space-y-3 text-center">
                  <AlertTriangle className="w-8 h-8 text-rose-500 animate-bounce" />
                  <p className="text-xs text-rose-400 font-semibold">{tipError}</p>
                  <button
                    onClick={() => handleFetchTopicTips(activeTipTopic.subject, activeTipTopic.topicName)}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors cursor-pointer"
                  >
                    Yeniden Dene
                  </button>
                </div>
              )}

              {topicTipData && (
                <div className="space-y-4 text-xs">
                  {/* Sık Yapılan Hatalar */}
                  <div className="space-y-2.5">
                    <h4 className="font-bold text-rose-400 flex items-center space-x-1.5 uppercase tracking-wider text-[10px]">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Sık Yapılan Hatalar ve Doğruları</span>
                    </h4>
                    <div className="space-y-2">
                      {topicTipData.mistakes.map((item, idx) => (
                        <div key={idx} className="border-l-2 border-rose-500/30 pl-3 py-1 space-y-1 bg-rose-500/5 rounded-r-lg">
                          <p className="text-slate-300">
                            <strong className="text-rose-400 font-bold">❌ Yanlış Düşünce:</strong> {item.mistake}
                          </p>
                          <p className="text-slate-300">
                            <strong className="text-emerald-400 font-bold">👉 Doğru Bilgi:</strong> {item.correction}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Sınav Taktikleri */}
                  {topicTipData.tips.length > 0 && (
                    <div className="space-y-2.5 pt-2">
                      <h4 className="font-bold text-amber-400 flex items-center space-x-1.5 uppercase tracking-wider text-[10px]">
                        <Zap className="w-3.5 h-3.5" />
                        <span>Sınavda Hayat Kurtaracak Püf Noktaları</span>
                      </h4>
                      <ul className="space-y-1.5">
                        {topicTipData.tips.map((tip, idx) => (
                          <li key={idx} className="flex items-start space-x-2 text-slate-300 leading-relaxed pl-1">
                            <span className="text-amber-400 shrink-0 select-none mt-0.5 font-bold">★</span>
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Rehberlik Özeti */}
                  {topicTipData.summary && (
                    <div className="bg-slate-950/80 border border-indigo-500/20 rounded-xl p-3.5 mt-3">
                      <p className="text-slate-300 italic leading-relaxed text-center font-medium">
                        "{topicTipData.summary}"
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-slate-800 pt-3">
              {returnToSupportItem ? (
                <button
                  onClick={() => {
                    const itemToRestore = returnToSupportItem;
                    setActiveTipTopic(null);
                    setTopicTipData(null);
                    setTipError(null);
                    setReturnToSupportItem(null);
                    setActiveSupportItem(itemToRestore);
                    setActiveSupportTab('menu');
                  }}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-4 py-2 rounded-xl transition-colors cursor-pointer flex items-center space-x-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Geri Dön</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    setActiveTipTopic(null);
                    setTopicTipData(null);
                    setTipError(null);
                  }}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-4 py-2 rounded-xl transition-colors cursor-pointer flex items-center space-x-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Geri Dön</span>
                </button>
              )}

              <button
                onClick={() => {
                  setActiveTipTopic(null);
                  setTopicTipData(null);
                  setTipError(null);
                  setReturnToSupportItem(null);
                }}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors cursor-pointer"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Yapay Zeka Destek Merkezi Modal */}
      {activeSupportItem && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setActiveSupportItem(null)}
        >
          <div 
            className="relative max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl flex flex-col space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Brain className="w-5 h-5 text-indigo-400 animate-pulse" />
                <div>
                  <h3 className="text-sm font-bold text-white leading-tight">Yapay Zeka Destek Merkezi</h3>
                  <p className="text-[10px] text-slate-400">{activeSupportItem.subject} ➔ {activeSupportItem.topicName}</p>
                </div>
              </div>
              <button
                onClick={() => setActiveSupportItem(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="max-h-[60vh] overflow-y-auto space-y-4 pr-1">
              {activeSupportTab === 'menu' && (
                <div className="space-y-2.5">
                  <p className="text-xs text-slate-300 font-medium mb-3">
                    Hatalı sorunuz için faydalanmak istediğiniz yapay zeka desteğini seçin:
                  </p>
                  
                  {/* Option 1: Yaptiginiz hatanin yapay zeka yorumunu ogren */}
                  <button
                    type="button"
                    onClick={() => handleSupportGetFeedback(activeSupportItem)}
                    className="w-full text-left bg-slate-950/60 hover:bg-indigo-950/30 border border-slate-800 hover:border-indigo-500/40 rounded-xl p-4 transition-all flex items-center justify-between group cursor-pointer"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="bg-indigo-500/10 p-2 rounded-lg border border-indigo-500/20 text-indigo-400 group-hover:bg-indigo-500/20 transition-colors shrink-0">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-100 group-hover:text-indigo-300 transition-colors">
                          Yaptığınız Hatanın Yapay Zeka Yorumunu Öğren
                        </h4>
                        <p className="text-[10px] text-slate-400 mt-0.5 font-medium leading-relaxed">
                          Yaptığınız hatanın nedenini, dikkat dağılması unsurlarını ve çözüm önerilerini görün.
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors shrink-0 ml-2" />
                  </button>

                  {/* Option 2: Bu konudaki yaygin hatalari ve ipuclarini ogren */}
                  <button
                    type="button"
                    onClick={() => {
                      setReturnToSupportItem(activeSupportItem);
                      setActiveSupportItem(null);
                      handleFetchTopicTips(activeSupportItem.subject, activeSupportItem.topicName);
                    }}
                    className="w-full text-left bg-slate-950/60 hover:bg-emerald-950/30 border border-slate-800 hover:border-emerald-500/40 rounded-xl p-4 transition-all flex items-center justify-between group cursor-pointer"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20 text-emerald-400 group-hover:bg-emerald-500/20 transition-colors shrink-0">
                        <Zap className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-100 group-hover:text-emerald-300 transition-colors">
                          Bu Konudaki Yaygın Hataları ve İpuçlarını Öğren
                        </h4>
                        <p className="text-[10px] text-slate-400 mt-0.5 font-medium leading-relaxed">
                          YKS öğrencilerinin bu konuda en sık yaptığı hataları inceleyin ve hayati tüyolar alın.
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors shrink-0 ml-2" />
                  </button>

                  {/* Photo-loaded Options */}
                  {activeSupportItem.imageUrl ? (
                    <div className="space-y-2.5 pt-3 border-t border-slate-800/80 mt-3">
                      <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block mb-1">
                        📸 Görsel Desteği ile Akıllı Çözümler
                      </span>
                      
                      {/* Option 3: Yapay zeka ile soruyu coz */}
                      <button
                        type="button"
                        onClick={() => {
                          const imgUrl = activeSupportItem.imageUrl!;
                          const titleStr = `${activeSupportItem.subject} - ${activeSupportItem.topicName}`;
                          setActiveSupportItem(null);
                          openImagePreview(imgUrl, titleStr);
                          setAiModalTab('solution');
                          handleSolveQuestion(imgUrl, titleStr);
                        }}
                        className="w-full text-left bg-slate-950/60 hover:bg-indigo-950/30 border border-slate-800 hover:border-indigo-500/40 rounded-xl p-4 transition-all flex items-center justify-between group cursor-pointer"
                      >
                        <div className="flex items-start space-x-3">
                          <div className="bg-indigo-500/10 p-2 rounded-lg border border-indigo-500/20 text-indigo-300 group-hover:bg-indigo-500/20 transition-colors shrink-0">
                            <HelpCircle className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-100 group-hover:text-indigo-300 transition-colors">
                              Yapay Zeka ile Soruyu Çöz
                            </h4>
                            <p className="text-[10px] text-slate-400 mt-0.5 font-medium leading-relaxed">
                              Yüklü soru fotoğrafını yapay zekaya göndererek adım adım detaylı çözümünü alın.
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors shrink-0 ml-2" />
                      </button>

                      {/* Option 4: Benzer sorular ile konuyu pekistir */}
                      <button
                        type="button"
                        onClick={() => {
                          const imgUrl = activeSupportItem.imageUrl!;
                          const titleStr = `${activeSupportItem.subject} - ${activeSupportItem.topicName}`;
                          const matchingError = topicErrors.find(e => e.id === activeSupportItem.id || e.imageUrl === imgUrl || `${e.subject} - ${e.topicName}` === titleStr);
                          const existingList = matchingError?.similarQuestionsList || activeSupportItem.similarQuestionsList || [];

                          setActiveSupportItem(null);
                          openImagePreview(imgUrl, titleStr);
                          setAiModalTab('similar');

                          // Only trigger auto-generation if student hasn't generated ANY question yet
                          if (!existingList || existingList.length === 0) {
                            handleGenerateSimilarQuestions(imgUrl, titleStr);
                          }
                        }}
                        className="w-full text-left bg-slate-950/60 hover:bg-indigo-950/30 border border-slate-800 hover:border-indigo-500/40 rounded-xl p-4 transition-all flex items-center justify-between group cursor-pointer"
                      >
                        <div className="flex items-start space-x-3">
                          <div className="bg-indigo-500/10 p-2 rounded-lg border border-indigo-500/20 text-indigo-300 group-hover:bg-indigo-500/20 transition-colors shrink-0">
                            <Brain className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <h4 className="text-xs font-bold text-slate-100 group-hover:text-indigo-300 transition-colors">
                                Benzer Sorular ile Konuyu Pekiştir
                              </h4>
                              {(() => {
                                const matchingError = topicErrors.find(e => e.id === activeSupportItem.id || e.imageUrl === activeSupportItem.imageUrl);
                                const existingList = matchingError?.similarQuestionsList || activeSupportItem.similarQuestionsList || [];
                                if (existingList.length > 0) {
                                  return (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                      {existingList.length} Soru Kayıtlı
                                    </span>
                                  );
                                }
                                return null;
                              })()}
                            </div>
                            <p className="text-[10px] text-slate-400 mt-0.5 font-medium leading-relaxed">
                              {(() => {
                                const matchingError = topicErrors.find(e => e.id === activeSupportItem.id || e.imageUrl === activeSupportItem.imageUrl);
                                const existingList = matchingError?.similarQuestionsList || activeSupportItem.similarQuestionsList || [];
                                if (existingList.length > 0) {
                                  return `Daha önce üretilmiş ${existingList.length} adet benzer soruyu inceleyin veya yeni soru üretin.`;
                                }
                                return 'Bu soruya benzer yeni TYT/AYT uyumlu soru üretin, kendinizi test edin.';
                              })()}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors shrink-0 ml-2" />
                      </button>

                      {/* Option 5: Hatali sorunun analizini yap, zorlugunu ogren */}
                      <button
                        type="button"
                        onClick={() => handleSupportGetAnalysis(activeSupportItem)}
                        className="w-full text-left bg-slate-950/60 hover:bg-amber-950/30 border border-slate-800 hover:border-amber-500/40 rounded-xl p-4 transition-all flex items-center justify-between group cursor-pointer"
                      >
                        <div className="flex items-start space-x-3">
                          <div className="bg-amber-500/10 p-2 rounded-lg border border-amber-500/20 text-amber-400 group-hover:bg-amber-500/20 transition-colors shrink-0">
                            <Sparkles className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-100 group-hover:text-amber-300 transition-colors">
                              Hatalı Sorunun Analizini Yap, Zorluğunu Öğren
                            </h4>
                            <p className="text-[10px] text-slate-400 mt-0.5 font-medium leading-relaxed">
                              Soru kazanımı, zorluk seviyesi, okuma/çözme süresi, ayırt ediciliği ve çeldirici analizini alın.
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-colors shrink-0 ml-2" />
                      </button>
                    </div>
                  ) : null}
                </div>
              )}

              {/* FEEDBACK TAB (Option 1 Result) */}
              {activeSupportTab === 'feedback' && (
                <div className="space-y-4">
                  {supportFeedbackLoading && (
                    <div className="flex flex-col items-center justify-center py-16 space-y-3 text-center">
                      <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-slate-200">Hata Yorumu Hazırlanıyor...</p>
                        <p className="text-[10px] text-slate-400">YKS Yapay Zeka Rehberi hatanızı analiz ediyor.</p>
                      </div>
                    </div>
                  )}

                  {supportFeedbackError && (
                    <div className="flex flex-col items-center justify-center py-12 space-y-3 text-center">
                      <AlertTriangle className="w-8 h-8 text-rose-500 animate-bounce" />
                      <p className="text-xs text-rose-400 font-semibold">{supportFeedbackError}</p>
                      <button
                        onClick={() => handleSupportGetFeedback(activeSupportItem)}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors cursor-pointer"
                      >
                        Yeniden Dene
                      </button>
                    </div>
                  )}

                  {supportFeedbackText && (
                    <div className="space-y-4">
                      <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-4 space-y-3">
                        <div className="flex items-center space-x-2 text-xs font-bold text-amber-400">
                          <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                          <span>Yazar & Yapay Zeka Hata Yorumu</span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium bg-slate-900/60 p-3 rounded-lg border border-slate-800/80 whitespace-pre-wrap">
                          "{supportFeedbackText}"
                        </p>
                      </div>

                      {activeSupportItem.solutionNotes && (
                        <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-4 space-y-2">
                          <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">💡 Sizin İpucu Notunuz</span>
                          <p className="text-xs text-slate-300 leading-relaxed font-medium italic bg-slate-900/40 p-3 rounded-lg border border-slate-800/80">
                            "{activeSupportItem.solutionNotes}"
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ANALYSIS TAB (Option 5 Result) */}
              {activeSupportTab === 'analysis' && (
                <div className="space-y-4">
                  {supportAnalysisLoading && (
                    <div className="flex flex-col items-center justify-center py-16 space-y-3 text-center">
                      <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-slate-200">Soru Analizi Yapılıyor...</p>
                        <p className="text-[10px] text-slate-400 max-w-[340px] mx-auto">
                          Görseldeki soru analiz ediliyor; MEB kazanımı, zorluk seviyesi ve çeldirici nitelikleri hesaplanıyor.
                        </p>
                      </div>
                    </div>
                  )}

                  {supportAnalysisError && (
                    <div className="flex flex-col items-center justify-center py-12 space-y-3 text-center">
                      <AlertTriangle className="w-8 h-8 text-rose-500 animate-bounce" />
                      <p className="text-xs text-rose-400 font-semibold">{supportAnalysisError}</p>
                      <button
                        onClick={() => handleSupportGetAnalysis(activeSupportItem)}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors cursor-pointer"
                      >
                        Yeniden Dene
                      </button>
                    </div>
                  )}

                  {supportAnalysisText && (
                    <div className="space-y-4">
                      {formatAnalysisTable(supportAnalysisText)}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-between border-t border-slate-800 pt-3">
              {activeSupportTab !== 'menu' ? (
                <button
                  onClick={() => setActiveSupportTab('menu')}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-4 py-2 rounded-xl transition-colors cursor-pointer"
                >
                  Geri Dön
                </button>
              ) : <div />}
              
              <button
                onClick={() => setActiveSupportItem(null)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors cursor-pointer"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
