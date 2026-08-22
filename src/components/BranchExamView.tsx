import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
import { ImageCropperModal } from './common/ImageCropperModal';
import { SpacedRepetitionModal } from './branch/SpacedRepetitionModal';
import { RepetitionSettingsModal } from './branch/RepetitionSettingsModal';
import { RepetitionAlertModal } from './branch/RepetitionAlertModal';
import { ErrorExamPrintModal } from './branch/ErrorExamPrintModal';
import { 
  getDueRepetitionQuestions, 
  calculateNextReviewDate, 
  getUserRepetitionIntervals,
  getTodayDateString 
} from '../services/spacedRepetition';
import { LatexRenderer } from './common/LatexRenderer';


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
  // Handle both <br> and \n as line separators, and strip **bold** markers
  const normalized = content
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/\\n/g, '\n');
  const segments = normalized.split('\n');
  return segments.map((seg, segIdx) => {
    const stripped = seg.replace(/\*\*/g, '').trim();
    if (!stripped) return null;
    return (
      <div key={segIdx} className="py-0.5 text-xs leading-relaxed">
        {stripped}
      </div>
    );
  }).filter(Boolean);
};

const formatAnalysisTable = (text: string) => {
  if (!text) return <p className="text-xs text-slate-400 italic">İçerik bulunamadı.</p>;

  // 1. Multi-stage normalization: handle \n, <br>, and multi-pipe delimiters (|| or | | or | \n |)
  let cleanText = text
    .replace(/\\n/g, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/\|\s*\|\s*/g, '\n| ')
    .replace(/\|\s*\n\s*\|/g, '\n| ');

  const rawLines = cleanText.split('\n');
  const tableEntries: Array<{ key: string; val: string; isHeader?: boolean }> = [];
  let detectedTitle = 'SORU ANALİZ KARNESİ';

  rawLines.forEach(line => {
    let trimmed = line.trim();
    if (!trimmed) return;

    // Detect title (e.g. **SORU ANALİZİ**)
    if (trimmed.toLowerCase().includes('soru analizi') || trimmed.toLowerCase().includes('soru karnesi')) {
      const cleanTitle = trimmed.replace(/[\*\#|]/g, '').trim();
      if (cleanTitle) detectedTitle = cleanTitle.toUpperCase();
      return;
    }

    // Skip table separators (---|---, :---) and header labels ("Kriter", "Değerlendirme")
    if (trimmed.includes('---') || trimmed.includes(':---')) return;
    if (/^\|?\s*Kriter\s*\|\s*Değerlendirme\s*\|?$/i.test(trimmed)) return;

    // Helper to process key-value pair and handle distractor analysis splitting
    const processEntry = (k: string, v: string) => {
      let cleanK = k.replace(/[\*\#]/g, '').trim();
      let cleanV = v.replace(/[\*\#]/g, '').trim();

      if (!cleanK || cleanK.toLowerCase().includes('kriter')) return;

      // Check if this is the "Çeldirici Analizi" header or entry
      if (cleanK.toLowerCase().includes('çeldirici analizi')) {
        // Push the Çeldirici Analizi header row with empty value
        tableEntries.push({ key: 'Çeldirici Analizi', val: '', isHeader: true });

        // If cleanV has content, check if it contains A: or option text
        if (cleanV) {
          const match = cleanV.match(/^([A-Ea-e])[\:\)\.\-]\s*(.*)$/);
          if (match) {
            const letter = match[1].toUpperCase();
            const rest = match[2].trim();
            tableEntries.push({ key: `${letter} Şıkkı Çeldiricisi`, val: rest });
          } else {
            tableEntries.push({ key: 'A Şıkkı Çeldiricisi', val: cleanV });
          }
        }
        return;
      }

      // Check if cleanK is a single letter option (A, B, C, D, E) or "A Şıkkı"
      const letterMatch = cleanK.match(/^([A-Ea-e])(?:\s*Şıkkı|\s*Seçeneği|\s*Şıkkı\s*Çeldiricisi)?$/i);
      if (letterMatch) {
        cleanK = `${letterMatch[1].toUpperCase()} Şıkkı Çeldiricisi`;
      } else if (cleanK.length === 1 && ['A', 'B', 'C', 'D', 'E'].includes(cleanK.toUpperCase())) {
        cleanK = `${cleanK.toUpperCase()} Şıkkı Çeldiricisi`;
      }

      tableEntries.push({ key: cleanK, val: cleanV });
    };

    // A) If line contains pipe '|'
    if (trimmed.includes('|')) {
      const parts = trimmed
        .split('|')
        .map(p => p.trim())
        .filter(Boolean);

      if (parts.length >= 2) {
        let k = parts[0];
        let v = parts.slice(1).join(' · ');
        processEntry(k, v);
        return;
      } else if (parts.length === 1) {
        let k = parts[0];
        processEntry(k, '');
        return;
      }
    }

    // B) If line contains colon ':' (Key: Value)
    const colonIdx = trimmed.indexOf(':');
    if (colonIdx > 0) {
      let k = trimmed.slice(0, colonIdx).replace(/^[-*•|]\s*/, '').trim();
      let v = trimmed.slice(colonIdx + 1).replace(/\|$/, '').trim();
      processEntry(k, v);
      return;
    }
  });

  if (tableEntries.length > 0) {
    return (
      <div className="space-y-2">
        <p className="text-xs font-extrabold text-amber-300 mb-2 tracking-wide uppercase">{detectedTitle}</p>
        <div className="overflow-x-auto w-full border border-slate-800 rounded-xl bg-slate-900/80 shadow-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800">
                <th className="p-3 text-xs font-bold text-indigo-300 uppercase tracking-wider w-1/3 border-r border-slate-800">
                  KRİTER
                </th>
                <th className="p-3 text-xs font-bold text-indigo-300 uppercase tracking-wider">
                  DEĞERLENDİRME
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {tableEntries.map((entry, idx) => {
                const isDistractorHeader = entry.key.toLowerCase().includes('çeldirici analizi') || entry.isHeader;
                return (
                  <tr 
                    key={idx} 
                    className={`transition-colors ${
                      isDistractorHeader ? 'bg-indigo-950/30' : 'hover:bg-slate-900/40'
                    }`}
                  >
                    <td className={`p-3 text-xs leading-relaxed align-top border-r border-slate-800/60 ${
                      isDistractorHeader 
                        ? 'text-amber-300 font-extrabold bg-slate-950/80' 
                        : 'font-bold text-indigo-400 bg-slate-950/40'
                    }`}>
                      {entry.key}
                    </td>
                    <td className="p-3 text-xs leading-relaxed text-slate-200 align-top">
                      {entry.val ? parseCellContent(entry.val) : <span className="text-slate-600 italic"></span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Fallback: Plain formatted text if no structured key-value entries found
  return <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">{cleanText.replace(/\*\*/g, '')}</p>;
};

interface BranchExamViewProps {
  currentUser?: UserAccount;
  previewStudentUser?: UserAccount | null;
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
  previewStudentUser,
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
  const [showErrorExamPrintModal, setShowErrorExamPrintModal] = useState(false);

  // Branch Exam Form
  const [examDate, setExamDate] = useState(new Date().toISOString().split('T')[0]);
  const [examSubject, setExamSubject] = useState(YKS_SUBJECTS.TYT[0]);
  const [examType, setExamType] = useState<'TYT' | 'AYT' | 'YDT'>('TYT');
  const [publisher, setPublisher] = useState('');
  const [correct, setCorrect] = useState<number | string>('');
  const [wrong, setWrong] = useState<number | string>('');
  const [empty, setEmpty] = useState<number | string>('');
  const [durationMinutes, setDurationMinutes] = useState<number | string>('');
  const [examNotes, setExamNotes] = useState<string>('');
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
  const [selectedRawFile, setSelectedRawFile] = useState<File | null>(null);
  const [showCropperModal, setShowCropperModal] = useState<boolean>(false);

  // 🔁 Spaced Repetition (Aralıklı Tekrar) & Correct Option State
  const [correctOption, setCorrectOption] = useState<string>('');
  const [showRepetitionModal, setShowRepetitionModal] = useState<boolean>(false);
  const [repetitionSessionQuestions, setRepetitionSessionQuestions] = useState<TopicErrorItem[]>([]);
  const [showRepetitionSettingsModal, setShowRepetitionSettingsModal] = useState<boolean>(false);
  const [repetitionSettingsVer, setRepetitionSettingsVer] = useState<number>(0);
  const [showAlertModal, setShowAlertModal] = useState<boolean>(false);
  const [repetitionWarningModal, setRepetitionWarningModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    targetError?: TopicErrorItem;
  } | null>(null);

  const [filterExamId, setFilterExamId] = useState<string | null>(null);
  const [filterRevised, setFilterRevised] = useState<'UNREVISED' | 'REVISED' | 'ALL'>('UNREVISED');
  const [filterSubject, setFilterSubject] = useState<string>('ALL');
  const [sortOption, setSortOption] = useState<string>('NEWEST');
  const [filterMatchStatus, setFilterMatchStatus] = useState<string>('ALL');

  // ── AI SMART ADD PREFILL EVENT & MOUNT CACHE LISTENER ──
  useEffect(() => {
    const applyPrefill = (detail: any) => {
      if (!detail) return;
      const f = detail.fields || {};

      if (detail.intent === 'TOPIC_ERROR') {
        setActiveSubTab('errors');
        setEditingError(null);
        if (f.subject) setErrorSubject(f.subject);
        if (f.topicName) {
          setTopicName(f.topicName);
          setIsCustomTopic(true);
        }
        if (f.publisher) setErrorPublisher(f.publisher);
        if (f.errorReason) setErrorReason(f.errorReason as any);
        if (f.notes) setSolutionNotes(f.notes);
        setShowAddErrorModal(true);
      } else if (detail.intent === 'BRANCH_EXAM') {
        setActiveSubTab('branch_list');
        setEditingExam(null);
        if (f.subject) {
          setExamSubject(f.subject);
          if (f.subject.startsWith('AYT')) setExamType('AYT');
          else if (f.subject.startsWith('YDT')) setExamType('YDT');
          else setExamType('TYT');
        }
        if (f.publisher) setPublisher(f.publisher);
        if (f.correct !== undefined && f.correct !== '') setCorrect(f.correct);
        if (f.wrong !== undefined && f.wrong !== '') setWrong(f.wrong);
        if (f.empty !== undefined && f.empty !== '') setEmpty(f.empty);
        if (f.durationMinutes !== undefined && f.durationMinutes !== '') setDurationMinutes(f.durationMinutes);
        if (f.date) setExamDate(f.date);
        if (f.notes) setExamNotes(f.notes);
        setShowAddExamModal(true);
      }
    };

    const cached = (window as any).__lastSmartAddPrefill;
    if (cached && (cached.intent === 'TOPIC_ERROR' || cached.intent === 'BRANCH_EXAM') && Date.now() - cached.timestamp < 3500) {
      applyPrefill(cached);
      delete (window as any).__lastSmartAddPrefill;
    }

    const handleSmartAddPrefill = (e: any) => {
      applyPrefill(e.detail);
    };

    window.addEventListener('yks_smart_add_prefill', handleSmartAddPrefill);
    return () => window.removeEventListener('yks_smart_add_prefill', handleSmartAddPrefill);
  }, []);

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

  // Oturum açıldığında veya sayfa yüklendiğinde tekrar zamanı gelen sorular için tek seferlik hatırlatıcı
  useEffect(() => {
    const due = getDueRepetitionQuestions(topicErrors);
    const hasDismissed = sessionStorage.getItem('repetition_alert_dismissed_session');
    if (due.length > 0 && !hasDismissed && !previewStudentUser) {
      setShowAlertModal(true);
      sessionStorage.setItem('repetition_alert_dismissed_session', 'true');
    }
  }, [topicErrors, previewStudentUser, repetitionSettingsVer]);

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedRawFile(file);
    setShowCropperModal(true);
    e.target.value = '';
  };

  const handleCropComplete = async (croppedFile: File, _previewDataUrl: string) => {
    setShowCropperModal(false);
    await processImageFile(croppedFile);
  };

  const handleUseOriginal = async (originalFile: File) => {
    setShowCropperModal(false);
    await processImageFile(originalFile);
  };

  const handleReCrop = () => {
    if (selectedRawFile || errorImageUrl) {
      setShowCropperModal(true);
    }
  };

  const handleRemoveImage = () => {
    setErrorImageUrl('');
    setImageStats(null);
    setImageError(null);
    setSelectedRawFile(null);
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
    setSelectedRawFile(null);
    setShowCropperModal(false);
    setCorrectOption('');
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
    setCorrectOption(err.correctOption || err.aiSolutionCorrectAnswer || '');
    
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
    setSelectedRawFile(null);
    setShowCropperModal(false);
    
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

    if (previewStudentUser) {
      setSupportFeedbackError('Öğrenci önizleme modunda yapay zeka koçluk tavsiyesi üretilemez (Salt Okunur).');
      return;
    }

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

    if (previewStudentUser) {
      setSupportAnalysisError('Öğrenci önizleme modunda yapay zeka detaylı analizi üretilemez (Salt Okunur).');
      return;
    }

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
    // If imageUrl is present, do NOT pass old analysis text as solutionText to prevent hallucination
    const solutionContext = imageUrl ? undefined : (matchingError?.aiAnalysis || supportAnalysisText || undefined);

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
    const normalizeUrl = (u: string) => (u || '').split('?')[0];
    const normUrl = normalizeUrl(url);
    const matchingError = topicErrors.find(e => 
      (e.imageUrl && (e.imageUrl === url || normalizeUrl(e.imageUrl) === normUrl)) ||
      `${e.subject} - ${e.topicName}` === title ||
      title.includes(e.topicName)
    );
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
    return (
      <div className="space-y-2">
        <LatexRenderer content={text} />
      </div>
    );
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
    if (val && val !== 'other') {
      const separator = val.includes(':') ? ':' : '_';
      const parts = val.split(separator);
      const type = parts[0];
      const id = parts.slice(1).join(separator);
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
      numeric = p === 'high' ? 9 : p === 'low' ? 3 : 6;
    } else if (numeric <= 5) {
      numeric = numeric * 2;
    }
    numeric = Math.max(1, Math.min(10, numeric));

    const pct = (numeric / 10) * 100;
    const barGradient = numeric >= 8 ? 'from-rose-500 to-red-600' : numeric >= 5 ? 'from-amber-500 to-orange-500' : 'from-indigo-500 to-blue-600';
    const textColor = numeric >= 8 ? 'text-rose-400' : numeric >= 5 ? 'text-amber-400' : 'text-indigo-400';
    const verbalLabel = numeric >= 8 ? 'Kritik Öncelik' : numeric >= 5 ? 'Orta Öncelik' : 'Düşük Öncelik';

    return (
      <div 
        className="px-2 py-1 bg-slate-900/90 border border-slate-800 rounded-xl flex items-center space-x-2 shadow-sm"
        title={`${numeric}/10 Öncelik - ${verbalLabel}`}
      >
        <span className={`text-[11px] font-bold font-mono ${textColor}`}>{numeric}/10</span>
        <div className="w-12 h-1.5 bg-slate-800 rounded-full overflow-hidden shrink-0 border border-slate-700/50">
          <div className={`h-full bg-gradient-to-r ${barGradient} rounded-full`} style={{ width: `${pct}%` }} />
        </div>
      </div>
    );
  };

  const handleOpenAddExamModal = () => {
    setEditingExam(null);
    setExamDate(new Date().toISOString().split('T')[0]);
    setExamType('TYT');
    setExamSubject(YKS_SUBJECTS.TYT[0]);
    setPublisher('');
    setCorrect('');
    setWrong('');
    setEmpty('');
    setDurationMinutes('');
    setExamNotes('');
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
    setExamNotes(ex.notes ?? '');
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
          isAnalyzed,
          notes: examNotes.trim() || undefined
        });
      }
      setEditingExam(null);
    } else {
      // Find previous branch exam of the same subject for net comparison
      const prevSameSubjectExams = branchExams
        .filter(b => b.subject === examSubject && b.examType === examType)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      const prevNet = prevSameSubjectExams.length > 0 ? prevSameSubjectExams[0].net : 0;
      const hasPrevious = prevSameSubjectExams.length > 0;

      window.dispatchEvent(new CustomEvent('yks_trigger_motivation', {
        detail: {
          type: 'branch_added',
          payload: {
            subject: examSubject,
            newNet: Number(net.toFixed(2)),
            oldNet: prevNet,
            hasPrevious
          }
        }
      }));

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
        isAnalyzed,
        notes: examNotes.trim() || undefined
      });
    }

    setPublisher('');
    setCorrect('');
    setWrong('');
    setEmpty('');
    setDurationMinutes('');
    setExamNotes('');
    setIsAnalyzed(false);
    setShowAddExamModal(false);
  };

  const handleAIAnalyzePriority = async () => {
    if (!topicName.trim()) return;
    if (previewStudentUser) {
      setAiFeedback('Öğrenci önizleme modunda yapay zeka öncelik analizi yapılamaz (Salt Okunur).');
      return;
    }
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
        setAiFeedback(data.analysis);
        setAiButtonFaded(true);
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
      setAiFeedback(`Yapay zeka analiz servisiyle bağlantı kurulamadı. Hataya ve konuya göre otomatik olarak ${fallbackRating} yıldız belirlendi.`);
      setAiButtonFaded(true);
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
      const separator = selectedExamRef.includes(':') ? ':' : '_';
      const parts = selectedExamRef.split(separator);
      const type = parts[0] as 'book' | 'branch' | 'general';
      const id = parts.slice(1).join(separator);
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

    let inferredExamType: 'TYT' | 'AYT' | 'YDT' = 'TYT';
    if (YKS_SUBJECTS.AYT.includes(errorSubject)) {
      inferredExamType = 'AYT';
    } else if (YKS_SUBJECTS.TYT.includes(errorSubject)) {
      inferredExamType = 'TYT';
    } else {
      inferredExamType = examType;
    }

    const todayStr = getTodayDateString();
    const intervals = getUserRepetitionIntervals();

    if (editingError) {
      const isAddingPhotoNow = !editingError.imageUrl && !!errorImageUrl;
      const nextReviewDate = editingError.nextReviewDate || (errorImageUrl ? calculateNextReviewDate(todayStr, editingError.repetitionStage ?? 0, intervals) : undefined);

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
        correctOption: correctOption.toUpperCase().trim() || editingError.correctOption || undefined,
        aiFeedback: aiFeedback || editingError.aiFeedback,
        imageUrl: errorImageUrl || undefined,
        nextReviewDate,
        repetitionStage: editingError.repetitionStage ?? 0
      });
      setEditingError(null);
    } else {
      onAddTopicError({
        date: todayStr,
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
        correctOption: correctOption.toUpperCase().trim() || undefined,
        repetitionStage: 0,
        nextReviewDate: errorImageUrl ? calculateNextReviewDate(todayStr, 0, intervals) : undefined,
        aiFeedback,
        imageUrl: errorImageUrl || undefined
      });
    }

    setTopicName('');
    setSolutionNotes('');
    setErrorImageUrl('');
    setCorrectOption('');
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
    if (previewStudentUser) return;
    const err = topicErrors.find(e => e.id === id);
    if (err) {
      onUpdateTopicError({ ...err, revised: !err.revised });
    }
  };

  const handleOpenTipModal = (subject: string, topicName: string) => {
    handleFetchTopicTips(subject, topicName);
  };

  const handleFetchFullPhotoAnalysis = async (errorItem: TopicErrorItem, targetTab: 'solution' | 'similar' | 'report', force = false) => {
    if (!errorItem.imageUrl) return;

    const title = `${errorItem.subject} - ${errorItem.topicName}`;
    
    // Only open preview if modal is not already showing this image
    // (avoid re-calling openImagePreview which resets state via React async setState)
    const normalizeUrl = (u: string) => (u || '').split('?')[0];
    const alreadyOpen = previewImage && (
      previewImage.url === errorItem.imageUrl ||
      normalizeUrl(previewImage.url) === normalizeUrl(errorItem.imageUrl) ||
      previewImage.title === title
    );
    if (!alreadyOpen) {
      openImagePreview(errorItem.imageUrl, title);
    }
    setAiModalTab(targetTab);

    // Find current error item in state (use stored AI data only, NOT current state vars to avoid stale reads)
    const matchingError = topicErrors.find(e => e.id === errorItem.id || e.imageUrl === errorItem.imageUrl || normalizeUrl(e.imageUrl || '') === normalizeUrl(errorItem.imageUrl) || `${e.subject} - ${e.topicName}` === title) || errorItem;

    // Read existing data exclusively from the persisted errorItem data (not from potentially stale state)
    const existingSol = matchingError.aiSolution || null;
    const existingAnalysis = matchingError.aiAnalysis || null;
    const existingSimilar = (matchingError.similarQuestionsList && matchingError.similarQuestionsList.length > 0)
      ? matchingError.similarQuestionsList
      : null;

    // Populate UI with any already-cached data
    if (existingSol) setSolveSolution(existingSol);
    if (existingAnalysis) {
      setReportText(existingAnalysis);
      setSupportAnalysisText(existingAnalysis);
    }
    if (existingSimilar) {
      setSimilarQuestionsList(existingSimilar);
      setActiveSimilarIdx(0);
    }

    // If the requested tab already has persisted data and force is false, no need to call API
    const hasTargetData =
      (targetTab === 'solution' && !!existingSol) ||
      (targetTab === 'report' && !!existingAnalysis) ||
      (targetTab === 'similar' && !!existingSimilar);

    if (hasTargetData && !force) {
      return;
    }

    if (previewStudentUser) {
      if (targetTab === 'solution') setSolveError('Öğrenci önizleme modunda yapay zeka çözümü üretilemez (Salt Okunur).');
      else if (targetTab === 'similar') setSimilarError('Öğrenci önizleme modunda benzer soru üretilemez (Salt Okunur).');
      else setReportError('Öğrenci önizleme modunda soru karnesi üretilemez (Salt Okunur).');
      return;
    }

    setSolveLoading(true);
    setReportLoading(true);
    setSimilarLoading(true);
    setSolveError(null);
    setReportError(null);
    setSimilarError(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 180000);

    try {
      const response = await fetch('/api/gemini/analyze-photo-question-full', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          imageUrl: errorItem.imageUrl,
          subject: errorItem.subject,
          topicName: errorItem.topicName,
          // Only pass solutionText if force is false and no imageUrl is present
          solutionText: (force || errorItem.imageUrl) ? undefined : (existingSol || existingAnalysis || undefined)
        })
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        let errText = 'Yapay zeka yanıt üretemedi, lütfen yeniden deneyin.';
        try {
          const errData = await response.json();
          if (errData && errData.error) errText = errData.error;
        } catch {}
        throw new Error(errText);
      }

      const data = await response.json();
      if (data.success) {
        const sol = data.solution || existingSol;
        if (sol) setSolveSolution(sol);

        const rep = data.analysis || existingAnalysis;
        if (rep) {
          setReportText(rep);
          setSupportAnalysisText(rep);
        }

        let simList = existingSimilar || [];
        // similarQuestions is now an array of {question, solution, correctAnswer}
        if (Array.isArray(data.similarQuestions) && data.similarQuestions.length > 0) {
          simList = data.similarQuestions;
          setSimilarQuestionsList(simList);
          setActiveSimilarIdx(0);
        } else if (existingSimilar && existingSimilar.length > 0) {
          setSimilarQuestionsList(existingSimilar);
        }

        const autoCorrectOption = data.correctAnswerLetter || data.correctAnswer || matchingError.correctOption;
        if (autoCorrectOption) {
          setCorrectOption(autoCorrectOption);
        }

        const updatedError = {
          ...matchingError,
          ...(sol ? { aiSolution: sol } : {}),
          ...(rep ? { aiAnalysis: rep } : {}),
          ...(simList.length > 0 ? { similarQuestionsList: simList } : {}),
          ...(autoCorrectOption ? { correctOption: autoCorrectOption } : {})
        };
        onUpdateTopicError(updatedError);

        if (onAddAuditLog) {
          onAddAuditLog(
            `Hata Defteri "${title}" sorusu için Bütünleşik Yapay Zeka Analizi (Çözüm + Benzer Soru + Soru Karnesi) tek sorgu ile üretildi.`,
            'system',
            'AI_FULL_PHOTO_ANALYSIS',
            undefined,
            undefined,
            undefined,
            data.aiUsage
          );
        }
      } else {
        throw new Error(data.error || 'Fotoğraflı soru bütünleşik analizi yapılamadı.');
      }
    } catch (err: any) {
      console.error(err);
      const isAbort = err.name === 'AbortError' || String(err).includes('aborted');
      const msg = isAbort 
        ? 'İşlem zaman aşımına uğradı (180sn). Lütfen tekrar deneyin.'
        : (err.message || 'Çözüm oluşturulamadı.');
      setSolveError(msg);
      setReportError(msg);
      setSimilarError(msg);
    } finally {
      setSolveLoading(false);
      setReportLoading(false);
      setSimilarLoading(false);
    }
  };

  const handleOpenSolveModal = (errorItem: TopicErrorItem) => {
    if (errorItem.imageUrl) {
      handleFetchFullPhotoAnalysis(errorItem, 'solution');
    } else {
      openImagePreview(errorItem.imageUrl || '', `${errorItem.subject} - ${errorItem.topicName}`);
      setAiModalTab('solution');
      if (!errorItem.aiSolution) {
        handleSolveQuestion(errorItem.imageUrl || '', `${errorItem.subject} - ${errorItem.topicName}`);
      }
    }
  };

  const handleOpenSimilarModal = (errorItem: TopicErrorItem) => {
    if (errorItem.imageUrl) {
      handleFetchFullPhotoAnalysis(errorItem, 'similar');
    } else {
      openImagePreview(errorItem.imageUrl || '', `${errorItem.subject} - ${errorItem.topicName}`);
      setAiModalTab('similar');
      const existingList = errorItem.similarQuestionsList || [];
      if (existingList.length === 0) {
        handleGenerateSimilarQuestions(errorItem.imageUrl || '', `${errorItem.subject} - ${errorItem.topicName}`);
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
      handleFetchFullPhotoAnalysis(errorItem, 'report');
    } else {
      openImagePreview(errorItem.imageUrl || '', `${errorItem.subject} - ${errorItem.topicName}`);
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

  const handleConfirmDelete = () => {
    if (!deletingItem) return;
    if (deletingItem.type === 'error') {
      onDeleteTopicError(deletingItem.id);
    } else {
      onDeleteBranchExam(deletingItem.id);
    }
    setDeletingItem(null);
  };



  const isBookMatch = (e: TopicErrorItem) => {
    if (e.examTypeRef === 'book') return true;
    if (e.examId && resources.some(r => r.id === e.examId)) return true;
    if (e.publisher) {
      const pubLower = e.publisher.toLowerCase();
      if (resources.some(r => (r.publisher && pubLower.includes(r.publisher.toLowerCase())) || (r.bookTitle && pubLower.includes(r.bookTitle.toLowerCase())))) {
        return true;
      }
    }
    return false;
  };

  const isExamMatch = (e: TopicErrorItem) => {
    if (e.examTypeRef === 'branch' || e.examTypeRef === 'general') return true;
    if (e.examId && (branchExams.some(b => b.id === e.examId) || generalMocks.some(g => g.id === e.examId))) return true;
    if (e.publisher) {
      const pubLower = e.publisher.toLowerCase();
      if (branchExams.some(b => b.publisher && pubLower.includes(b.publisher.toLowerCase()))) return true;
      if (generalMocks.some(g => g.title && pubLower.includes(g.title.toLowerCase()))) return true;
      if (pubLower.includes('deneme') || pubLower.includes('branş') || pubLower.includes('genel')) return true;
    }
    return false;
  };

  const isMatchedAny = (e: TopicErrorItem) => {
    return isBookMatch(e) || isExamMatch(e) || !!e.examId || !!e.examTypeRef;
  };

  const isErrorMatchingFilterSource = (e: TopicErrorItem, filterId: string) => {
    if (!filterId) return true;
    if (e.examId && e.examId === filterId) return true;
    const fLower = filterId.trim().toLowerCase();
    const pLower = (e.publisher || '').trim().toLowerCase();
    if (pLower && (pLower === fLower || pLower.includes(fLower) || fLower.includes(pLower))) return true;

    const matchedBook = resources.find(r => r.id === filterId || (r.publisher && r.publisher.toLowerCase() === fLower));
    if (matchedBook) {
      if (e.examId === matchedBook.id) return true;
      if (pLower && matchedBook.publisher && (pLower.includes(matchedBook.publisher.toLowerCase()) || matchedBook.publisher.toLowerCase().includes(pLower))) return true;
    }

    const matchedBranch = branchExams.find(b => b.id === filterId || (b.publisher && b.publisher.toLowerCase() === fLower));
    if (matchedBranch) {
      if (e.examId === matchedBranch.id) return true;
      if (pLower && matchedBranch.publisher && (pLower.includes(matchedBranch.publisher.toLowerCase()) || matchedBranch.publisher.toLowerCase().includes(pLower))) return true;
    }

    const matchedGeneral = (generalMocks || []).find(g => g.id === filterId || (g.title && g.title.toLowerCase() === fLower));
    if (matchedGeneral) {
      if (e.examId === matchedGeneral.id) return true;
      if (pLower && matchedGeneral.title && (pLower.includes(matchedGeneral.title.toLowerCase()) || matchedGeneral.title.toLowerCase().includes(pLower))) return true;
    }

    return false;
  };

  const filteredErrors = topicErrors.filter((e) => {
    if (filterExamId) {
      return isErrorMatchingFilterSource(e, filterExamId);
    }
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
    if (filterMatchStatus === 'MATCHED') return isMatchedAny(e);
    if (filterMatchStatus === 'NOT_MATCHED') return !isMatchedAny(e);
    if (filterMatchStatus === 'BOOK') return isBookMatch(e);
    if (filterMatchStatus === 'EXAM') return isExamMatch(e);
    return true;
  });

  const sortedErrors = [...filteredErrors].sort((a, b) => {
    const opt = (sortOption || 'NEWEST').toUpperCase();
    if (opt === 'PRIORITY_DESC') {
      const valA = typeof a.priority === 'number' ? a.priority : parseInt(a.priority as string, 10) || 3;
      const valB = typeof b.priority === 'number' ? b.priority : parseInt(b.priority as string, 10) || 3;
      if (valB !== valA) return valB - valA;
      const dateA = a.date || '';
      const dateB = b.date || '';
      const dateCmp = dateB.localeCompare(dateA);
      if (dateCmp !== 0) return dateCmp;
      return (b.id || '').localeCompare(a.id || '');
    }
    if (opt === 'PRIORITY_ASC') {
      const valA = typeof a.priority === 'number' ? a.priority : parseInt(a.priority as string, 10) || 3;
      const valB = typeof b.priority === 'number' ? b.priority : parseInt(b.priority as string, 10) || 3;
      if (valA !== valB) return valA - valB;
      const dateA = a.date || '';
      const dateB = b.date || '';
      const dateCmp = dateB.localeCompare(dateA);
      if (dateCmp !== 0) return dateCmp;
      return (b.id || '').localeCompare(a.id || '');
    }
    if (opt === 'NEWEST' || opt === 'DATE_DESC') {
      const dateA = a.date || '';
      const dateB = b.date || '';
      const dateCmp = dateB.localeCompare(dateA);
      if (dateCmp !== 0) return dateCmp;
      return (b.id || '').localeCompare(a.id || '');
    }
    if (opt === 'OLDEST' || opt === 'DATE_ASC') {
      const dateA = a.date || '';
      const dateB = b.date || '';
      const dateCmp = dateA.localeCompare(dateB);
      if (dateCmp !== 0) return dateCmp;
      return (a.id || '').localeCompare(b.id || '');
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

  const trendChartDataAll = trendRawData.map((ex, idx) => {
    let dateFormatted = ex.date || '';
    if (ex.date) {
      const d = new Date(ex.date + 'T00:00:00');
      if (!isNaN(d.getTime())) {
        const dayNum = d.getDate();
        const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
        dateFormatted = `${dayNum} ${months[d.getMonth()]}`;
      }
    }
    const subjClean = ex.subject ? ex.subject.replace('AYT ', '').replace('TYT ', '') : '';
    const shortName = `${dateFormatted} (${subjClean})`;
    const fullTitle = `${ex.subject || ''} - ${ex.publisher || 'Branş Denemesi'}`;
    const dateStr = ex.date || '';

    return {
      id: ex.id,
      shortName,
      fullTitle,
      dateStr,
      displayLabel: shortName,
      date: ex.date,
      subject: ex.subject,
      examType: ex.examType,
      publisher: ex.publisher || 'Branş Denemesi',
      net: parseNetVal(ex.net),
      correct: parseNetVal(ex.correct),
      wrong: parseNetVal(ex.wrong),
      empty: parseNetVal(ex.empty),
      durationMinutes: ex.durationMinutes || 0
    };
  });

  const trendChartData = chartLimit === '10'
    ? trendChartDataAll.slice(-10)
    : chartLimit === '30'
    ? trendChartDataAll.slice(-30)
    : trendChartDataAll;

  const filteredAvgNet = trendChartData.length > 0 
    ? Math.round((trendChartData.reduce((acc, c) => acc + c.net, 0) / trendChartData.length) * 100) / 100 
    : 0;

  // 2. Subject Average Net Bar Chart Dataset
  const subjectStatsMap: Record<string, { 
    subject: string; 
    examType: string; 
    count: number; 
    totalNet: number; 
    totalCorrect: number; 
    totalWrong: number; 
    totalEmpty: number; 
    maxNet: number 
  }> = {};

  branchExams.forEach(ex => {
    const net = parseNetVal(ex.net);
    const c = parseNetVal(ex.correct);
    const w = parseNetVal(ex.wrong);
    const emp = parseNetVal(ex.empty);

    if (!subjectStatsMap[ex.subject]) {
      subjectStatsMap[ex.subject] = {
        subject: ex.subject,
        examType: ex.examType,
        count: 0,
        totalNet: 0,
        totalCorrect: 0,
        totalWrong: 0,
        totalEmpty: 0,
        maxNet: net
      };
    }
    const curr = subjectStatsMap[ex.subject];
    curr.count += 1;
    curr.totalNet += net;
    curr.totalCorrect += c;
    curr.totalWrong += w;
    curr.totalEmpty += emp;
    curr.maxNet = Math.max(curr.maxNet, net);
  });

  const subjectAvgChartData = Object.values(subjectStatsMap).map(s => ({
    subject: s.subject,
    examType: s.examType,
    count: s.count,
    avgNet: Math.round((s.totalNet / s.count) * 100) / 100,
    avgCorrect: Math.round((s.totalCorrect / s.count) * 10) / 10,
    avgWrong: Math.round((s.totalWrong / s.count) * 10) / 10,
    avgEmpty: Math.round((s.totalEmpty / s.count) * 10) / 10,
    maxNet: s.maxNet,
    color: SUBJECT_COLORS[s.subject] || '#6366f1'
  })).sort((a, b) => b.avgNet - a.avgNet);

  // 3. Error Reason Pie/Donut Dataset
  const errorReasonMap: Record<string, number> = {};
  topicErrors.forEach(err => {
    const reason = err.errorReason || 'other';
    errorReasonMap[reason] = (errorReasonMap[reason] || 0) + 1;
  });

  const errorReasonChartData = Object.entries(errorReasonMap).map(([reason, count]) => {
    const labelText = ERROR_REASON_LABELS[reason as ErrorReason] || reason;
    return {
      reason,
      name: labelText,
      label: labelText,
      count,
      percentage: totalTopicErrorsCount > 0 ? Math.round((count / totalTopicErrorsCount) * 100) : 0,
      color: ERROR_REASON_COLORS[reason] || '#64748b'
    };
  }).sort((a, b) => b.count - a.count);

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
    .map(item => ({
      ...item,
      topic: item.topicName,
      topicName: item.topicName
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      
      {/* Header & Section Selector */}
      {mode !== 'errors' && (
        <div className="flex flex-col gap-3 sm:gap-4 bg-slate-900 p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-white flex items-center space-x-2">
                {mode === 'branches' ? (
                  <>
                    <Target className="w-5 h-5 text-indigo-400 shrink-0" />
                    <span>Branş Deneme Analizi</span>
                  </>
                ) : (
                  <>
                    <Target className="w-5 h-5 text-indigo-400 shrink-0" />
                    <span>Branş Denemeleri Analizi & Yanlış Tablosu</span>
                  </>
                )}
              </h1>
              <p className="hidden landscape:block sm:block text-xs text-slate-400 mt-1">
                {mode === 'branches'
                  ? 'Ders bazlı branş denemelerinizi kaydedin, net analizlerinizi ve ilerlemenizi görün.'
                  : 'Ders bazlı branş denemelerinizi kaydedin, yanlış yaptığınız eksik konuları tespit edip tekrar edin.'
                }
              </p>
            </div>

            <div className="hidden sm:flex items-center space-x-2 shrink-0">
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
        </div>
      )}

      {/* SUBTAB 0: GRAFİK & ANALİZ (CHARTS DASHBOARD) */}
      {activeSubTab === 'analytics' && (
        <BranchAnalyticsTab
          branchExams={branchExams}
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
          filteredErrors={sortedErrors}
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
          generalMocks={generalMocks}
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
          hideHeroHeader={mode !== 'errors'}
          onUpdateTopicError={onUpdateTopicError}
          previewStudentUser={previewStudentUser}
          onStartRepetitionSession={(questions) => {
            const list = (questions && questions.length > 0) 
              ? questions 
              : getDueRepetitionQuestions(topicErrors);

            if (questions && questions.length === 1) {
              const q = questions[0];
              const hasAnswer = Boolean(q.correctOption?.trim() || q.aiSolutionCorrectAnswer?.trim());
              if (!hasAnswer) {
                setRepetitionWarningModal({
                  isOpen: true,
                  title: 'Doğru Cevap Belirtilmemiş',
                  message: 'Bu sorunun doğru cevabı girilmemiş. Kör tekrar modunda test edebilmek için lütfen "Düzenle" butonuna basarak doğru cevap şıkkını (A, B, C, D veya E) kaydedin veya Yapay Zeka Çözümü ile doğru cevabı oluşturun.',
                  targetError: q
                });
                return;
              }
            }

            const validList = list.filter(e => Boolean(e.imageUrl) && Boolean(e.correctOption?.trim() || e.aiSolutionCorrectAnswer?.trim()));
            if (validList.length === 0) {
              setRepetitionWarningModal({
                isOpen: true,
                title: 'Kör Tekrar Başlatılamadı',
                message: 'Kör tekrar testi yapabilmek için soruların fotoğraflı olması ve doğru cevap şıkkının (A, B, C, D veya E) girilmiş olması gerekir. Lütfen hata kayıtlarınızı düzenleyerek doğru şıklarını kaydediniz.'
              });
              return;
            }

            setRepetitionSessionQuestions(validList);
            setShowRepetitionModal(true);
          }}
          onOpenRepetitionSettings={() => setShowRepetitionSettingsModal(true)}
          onOpenErrorExamPrint={() => setShowErrorExamPrintModal(true)}
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
        correctOption={correctOption}
        setCorrectOption={setCorrectOption}
        handleCreateTopicError={handleCreateTopicError}
        handleAIAnalyzeError={handleAIAnalyzeError}
        handleImageSelect={handleImageFileChange}
        handleRemoveImage={handleRemoveImage}
        handleReCrop={handleReCrop}
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
        examNotes={examNotes}
        setExamNotes={setExamNotes}
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
        handleFetchFullPhotoAnalysis={handleFetchFullPhotoAnalysis}
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

      {/* ✂️ Soru Fotoğrafı Kırpma Modalı (Mobil ve Dokunmatik Uyumlu) */}
      <ImageCropperModal
        isOpen={showCropperModal}
        imageFile={selectedRawFile}
        imageUrl={!selectedRawFile && errorImageUrl ? errorImageUrl : undefined}
        onClose={() => setShowCropperModal(false)}
        onCropComplete={handleCropComplete}
        onUseOriginal={selectedRawFile ? handleUseOriginal : undefined}
      />

      {/* 🧠 Aralıklı Tekrar Kör Modalı (Spaced Repetition) */}
      <SpacedRepetitionModal
        isOpen={showRepetitionModal}
        onClose={() => setShowRepetitionModal(false)}
        dueQuestions={repetitionSessionQuestions}
        onUpdateTopicError={onUpdateTopicError}
        onOpenSolutionModal={(err) => handleOpenSolveModal(err)}
        onOpenSimilarModal={(err) => handleOpenSimilarModal(err)}
      />

      {/* ⚙️ Aralıklı Tekrar Ayarları Modalı */}
      <RepetitionSettingsModal
        isOpen={showRepetitionSettingsModal}
        onClose={() => setShowRepetitionSettingsModal(false)}
        onSave={() => setRepetitionSettingsVer(v => v + 1)}
      />

      {/* 🔔 Giriş / Sayfa Açılış Tekrar Hatırlatma Modalı */}
      <RepetitionAlertModal
        isOpen={showAlertModal}
        onClose={() => setShowAlertModal(false)}
        dueQuestions={getDueRepetitionQuestions(topicErrors)}
        onStartRepetition={() => {
          const due = getDueRepetitionQuestions(topicErrors);
          const validList = due.filter(e => Boolean(e.imageUrl) && Boolean(e.correctOption?.trim() || e.aiSolutionCorrectAnswer?.trim()));
          if (validList.length === 0) {
            setRepetitionWarningModal({
              isOpen: true,
              title: 'Tekrar Soruları Eksik',
              message: 'Tekrar zamanı gelen soruların henüz doğru cevap şıkları kaydedilmemiş. Lütfen hata defterindeki soruları düzenleyerek doğru şıklarını (A, B, C, D veya E) kaydediniz.'
            });
            return;
          }
          setRepetitionSessionQuestions(validList);
          setShowRepetitionModal(true);
        }}
      />

      {/* 📄 Hata Tekrar Denemesi & Soru Kitapçığı Yazdırma / PDF Modalı */}
      <ErrorExamPrintModal
        isOpen={showErrorExamPrintModal}
        onClose={() => setShowErrorExamPrintModal(false)}
        topicErrors={topicErrors}
        currentUser={previewStudentUser || currentUser}
      />

      {/* ⚠️ Doğru Cevap Eksik / Kör Tekrar Bilgilendirme Modalı (Site Temasına Uygun) */}
      {repetitionWarningModal?.isOpen && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={(e) => { if (e.target === e.currentTarget) setRepetitionWarningModal(null); }}
        >
          <div className="bg-slate-900 border border-amber-500/30 rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl shadow-amber-950/40 space-y-4 animate-scale-in relative overflow-hidden my-auto modal-dialog-card">
            {/* Glow background accent */}
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
            
            {/* Header with Icon */}
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0 shadow-inner">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-white">
                    {repetitionWarningModal.title}
                  </h3>
                  {repetitionWarningModal.targetError && (
                    <span className="text-[11px] font-bold text-amber-300/90 block mt-0.5">
                      {repetitionWarningModal.targetError.subject} • {repetitionWarningModal.targetError.topicName}
                    </span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRepetitionWarningModal(null)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                title="Kapat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Message Body */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-2">
              <p className="text-xs text-slate-200 leading-relaxed font-medium">
                {repetitionWarningModal.message}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
              {repetitionWarningModal.targetError ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      const err = repetitionWarningModal.targetError!;
                      setRepetitionWarningModal(null);
                      handleOpenEditErrorModal(err);
                    }}
                    className="w-full sm:flex-1 py-2.5 px-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center space-x-1.5 shadow-lg shadow-indigo-600/30 cursor-pointer active:scale-95"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Hata Kaydını Düzenle</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const err = repetitionWarningModal.targetError!;
                      setRepetitionWarningModal(null);
                      handleOpenSolveModal(err);
                    }}
                    className="w-full sm:flex-1 py-2.5 px-3.5 bg-slate-800 hover:bg-slate-750 text-cyan-300 hover:text-cyan-200 border border-cyan-500/30 font-bold text-xs rounded-xl transition-all flex items-center justify-center space-x-1.5 cursor-pointer active:scale-95"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Yapay Zeka Çözümü</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setRepetitionWarningModal(null)}
                  className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-indigo-600/30 cursor-pointer active:scale-95"
                >
                  Anladım
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── FLOATING ACTION BUTTON (+ FAB) ── */}
      {activeSubTab === 'errors' || mode === 'errors' ? (
        <button
          onClick={handleOpenAddErrorModal}
          id="fab-add-branch-error-btn"
          aria-label="Yeni Hata Kaydı Ekle"
          title="Yeni Hata Kaydı Ekle"
          className="fixed bottom-20 sm:bottom-8 right-4 sm:right-8 z-40 bg-gradient-to-tr from-rose-600 via-pink-600 to-rose-500 hover:from-rose-500 hover:to-pink-500 text-white p-3.5 sm:px-5 sm:py-3.5 rounded-full sm:rounded-2xl shadow-[0_10px_25px_rgba(244,63,94,0.45)] border border-rose-400/40 cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center gap-2 group ring-4 ring-rose-500/20 backdrop-blur-md"
        >
          <Plus className="w-6 h-6 sm:w-5 sm:h-5 transition-transform duration-300 group-hover:rotate-90 stroke-[2.5]" />
          <span className="hidden sm:inline font-bold text-sm tracking-wide text-white drop-shadow-sm">
            Yeni Hata Kaydı
          </span>
        </button>
      ) : (
        <button
          onClick={handleOpenAddExamModal}
          id="fab-add-branch-exam-btn"
          aria-label="Yeni Branş Denemesi Gir"
          title="Yeni Branş Denemesi Gir"
          className="fixed bottom-20 sm:bottom-8 right-4 sm:right-8 z-40 bg-gradient-to-tr from-indigo-600 via-purple-600 to-indigo-500 hover:from-indigo-500 hover:to-purple-500 text-white p-3.5 sm:px-5 sm:py-3.5 rounded-full sm:rounded-2xl shadow-[0_10px_25px_rgba(99,102,241,0.45)] border border-indigo-400/40 cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center gap-2 group ring-4 ring-indigo-500/20 backdrop-blur-md"
        >
          <Plus className="w-6 h-6 sm:w-5 sm:h-5 transition-transform duration-300 group-hover:rotate-90 stroke-[2.5]" />
          <span className="hidden sm:inline font-bold text-sm tracking-wide text-white drop-shadow-sm">
            Yeni Branş Denemesi
          </span>
        </button>
      )}

    </div>
  );
};
