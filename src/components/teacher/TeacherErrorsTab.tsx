import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Clock,
  Edit2,
  Eye,
  Filter,
  Image as ImageIcon,
  Layers,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  Star,
  Tag,
  Trash2,
  X,
  ZoomIn,
  Flame,
  Check,
  FileSpreadsheet,
  HelpCircle,
  BrainCircuit,
  MessageSquareQuote,
  LayoutGrid,
  Table as TableIcon,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Calendar
} from 'lucide-react';
import { TopicErrorItem, BranchExam, ResourceItem, GeneralMockExam, UserAccount, ErrorReason } from '../../types';
import { YKS_CURRICULUM_TOPICS } from '../../data/initialData';
import { calculateNextReviewDate, getTodayDateString, getUserRepetitionIntervals } from '../../services/spacedRepetition';
import { formatDisplayDate } from '../../utils/dateUtils';
import { LatexRenderer } from '../common/LatexRenderer';


const ALL_SUBJECTS = Object.keys(YKS_CURRICULUM_TOPICS);

const ERROR_REASON_LABELS: Record<string, string> = {
  'bilgi_eksigi': 'Bilgi Eksikliği',
  'dikkat_hatasi': 'Dikkat / İşlem Hatası',
  'zaman_yetmedi': 'Süre Yetmedi',
  'iki_sik_arasinda': 'İki Şık Arasında Kalma',
  'soru_kokunu_yanlis_okuma': 'Soru Kökünü Yanlış Okuma',
};

const ERROR_REASON_COLORS: Record<string, { bg: string; text: string; border: string; iconBg: string }> = {
  'bilgi_eksigi': {
    bg: 'bg-rose-500/15',
    text: 'text-rose-300',
    border: 'border-rose-500/30',
    iconBg: 'bg-rose-500/20'
  },
  'dikkat_hatasi': {
    bg: 'bg-amber-500/15',
    text: 'text-amber-300',
    border: 'border-amber-500/30',
    iconBg: 'bg-amber-500/20'
  },
  'zaman_yetmedi': {
    bg: 'bg-sky-500/15',
    text: 'text-sky-300',
    border: 'border-sky-500/30',
    iconBg: 'bg-sky-500/20'
  },
  'iki_sik_arasinda': {
    bg: 'bg-purple-500/15',
    text: 'text-purple-300',
    border: 'border-purple-500/30',
    iconBg: 'bg-purple-500/20'
  },
  'soru_kokunu_yanlis_okuma': {
    bg: 'bg-emerald-500/15',
    text: 'text-emerald-300',
    border: 'border-emerald-500/30',
    iconBg: 'bg-emerald-500/20'
  }
};

interface TeacherErrorsTabProps {
  topicErrors: TopicErrorItem[];
  branchExams?: BranchExam[];
  generalMocks?: GeneralMockExam[];
  resources?: ResourceItem[];
  studentUser: UserAccount;
  teacherUser: UserAccount;
  isBranchTeacher: boolean;
  onUpdateTopicError?: (studentId: string, error: TopicErrorItem, actionDescription?: string) => void;
  onAddTopicError?: (studentId: string, error: Omit<TopicErrorItem, 'id'>, actionDescription?: string) => void;
  onDeleteTopicError?: (studentId: string, errorId: string, actionDescription?: string) => void;
}

export const TeacherErrorsTab: React.FC<TeacherErrorsTabProps> = ({
  topicErrors = [],
  branchExams = [],
  generalMocks = [],
  resources = [],
  studentUser,
  teacherUser,
  isBranchTeacher,
  onUpdateTopicError,
  onAddTopicError,
  onDeleteTopicError
}) => {
  // Filters & State
  const [subjectFilter, setSubjectFilter] = useState<string>(() => {
    if (isBranchTeacher && teacherUser.subject) {
      const match = ALL_SUBJECTS.find(s => s.toLowerCase().includes(teacherUser.subject!.toLowerCase()));
      return match || 'all';
    }
    return 'all';
  });
  const [statusFilter, setStatusFilter] = useState<'all' | 'unrevised' | 'revised'>('all');
  const [reasonFilter, setReasonFilter] = useState<string>('all');
  const [hasPhotoFilter, setHasPhotoFilter] = useState<'all' | 'with_photo' | 'no_photo'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'priority' | 'subject'>('newest');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Interactive Modals
  const [previewImageUrl, setPreviewImageUrl] = useState<{ url: string; title: string } | null>(null);
  const [inspectErrorItem, setInspectErrorItem] = useState<TopicErrorItem | null>(null);
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TopicErrorItem | null>(null);
  const [inlineEditingId, setInlineEditingId] = useState<string | null>(null);
  const [inlineNoteText, setInlineNoteText] = useState<string>('');
  const [expandedAiDetails, setExpandedAiDetails] = useState<Record<string, boolean>>({});

  // Form State for Add / Edit Modal
  const [formSubject, setFormSubject] = useState<string>('TYT Matematik');
  const [formTopicName, setFormTopicName] = useState<string>('');
  const [formExamType, setFormExamType] = useState<'TYT' | 'AYT' | 'YDT'>('TYT');
  const [formPublisher, setFormPublisher] = useState<string>('');
  const [formErrorReason, setFormErrorReason] = useState<ErrorReason>('bilgi_eksigi');
  const [formPriority, setFormPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [formSolutionNotes, setFormSolutionNotes] = useState<string>('');
  const [formImageUrl, setFormImageUrl] = useState<string>('');
  const [formRevised, setFormRevised] = useState<boolean>(false);

  // Statistics
  const totalCount = topicErrors.length;
  const unresolvedErrs = useMemo(() => topicErrors.filter(e => !e.revised), [topicErrors]);
  const resolvedErrs = useMemo(() => topicErrors.filter(e => e.revised), [topicErrors]);
  const resolutionPct = totalCount > 0 ? Math.round((resolvedErrs.length / totalCount) * 100) : 0;

  // Most common error topics
  const topErrorTopics = useMemo(() => {
    const counts: Record<string, { count: number; subject: string }> = {};
    topicErrors.forEach(err => {
      const topic = err.topicName || 'Belirtilmemiş Konu';
      if (!counts[topic]) {
        counts[topic] = { count: 0, subject: err.subject };
      }
      counts[topic].count += 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 4);
  }, [topicErrors]);

  // Filter and Sort Logic
  const filteredErrors = useMemo(() => {
    return topicErrors.filter(err => {
      // Subject filter
      if (subjectFilter !== 'all') {
        const errSub = (err.subject || '').toLowerCase();
        const filtSub = subjectFilter.toLowerCase();
        if (!errSub.includes(filtSub) && !filtSub.includes(errSub)) {
          return false;
        }
      }

      // Status filter
      if (statusFilter === 'unrevised' && err.revised) return false;
      if (statusFilter === 'revised' && !err.revised) return false;

      // Reason filter
      if (reasonFilter !== 'all' && err.errorReason !== reasonFilter) return false;

      // Photo filter
      if (hasPhotoFilter === 'with_photo' && !err.imageUrl) return false;
      if (hasPhotoFilter === 'no_photo' && err.imageUrl) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTopic = (err.topicName || '').toLowerCase().includes(q);
        const matchSub = (err.subject || '').toLowerCase().includes(q);
        const matchPub = (err.publisher || '').toLowerCase().includes(q);
        const matchNotes = (err.solutionNotes || '').toLowerCase().includes(q);
        const matchAi = (err.aiAnalysis || err.aiSolution || err.aiFeedback || '').toLowerCase().includes(q);
        if (!matchTopic && !matchSub && !matchPub && !matchNotes && !matchAi) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'newest') {
        const tA = a.date ? new Date(a.date.replace(' ', 'T')).getTime() : 0;
        const tB = b.date ? new Date(b.date.replace(' ', 'T')).getTime() : 0;
        return tB - tA;
      }
      if (sortBy === 'oldest') {
        const tA = a.date ? new Date(a.date.replace(' ', 'T')).getTime() : 0;
        const tB = b.date ? new Date(b.date.replace(' ', 'T')).getTime() : 0;
        return tA - tB;
      }
      if (sortBy === 'priority') {
        const getPrioVal = (p: any) => (p === 'high' ? 3 : p === 'medium' ? 2 : 1);
        return getPrioVal(b.priority) - getPrioVal(a.priority);
      }
      if (sortBy === 'subject') {
        return (a.subject || '').localeCompare(b.subject || '', 'tr');
      }
      return 0;
    });
  }, [topicErrors, subjectFilter, statusFilter, reasonFilter, hasPhotoFilter, searchQuery, sortBy]);

  // Toggle Revision Status
  const handleToggleRevision = (errItem: TopicErrorItem) => {
    if (!onUpdateTopicError) return;
    const newRevised = !errItem.revised;
    const updated: TopicErrorItem = {
      ...errItem,
      revised: newRevised
    };
    const actionDesc = newRevised
      ? `${teacherUser.name} (${teacherUser.role === 'school_counselor' ? 'Okul Rehber Öğretmeni' : 'Öğretmen'}), ${studentUser.name} öğrencisinin "${errItem.subject} - ${errItem.topicName}" hatasını PEKİŞTİRİLDİ olarak onayladı.`
      : `${teacherUser.name}, ${studentUser.name} öğrencisinin "${errItem.subject} - ${errItem.topicName}" pekiştirme durumunu geri aldı.`;

    onUpdateTopicError(studentUser.id, updated, actionDesc);
  };

  // Inline Note Save
  const handleSaveInlineNote = (errItem: TopicErrorItem) => {
    if (!onUpdateTopicError) return;
    const updated: TopicErrorItem = {
      ...errItem,
      solutionNotes: inlineNoteText.trim()
    };
    const actionDesc = `${teacherUser.name}, ${studentUser.name} öğrencisinin "${errItem.subject} - ${errItem.topicName}" hata defteri notunu güncelledi.`;
    onUpdateTopicError(studentUser.id, updated, actionDesc);
    setInlineEditingId(null);
    setInlineNoteText('');
  };

  // Open Add/Edit Modal
  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormSubject(isBranchTeacher && teacherUser.subject ? (ALL_SUBJECTS.find(s => s.includes(teacherUser.subject!)) || 'TYT Matematik') : 'TYT Matematik');
    setFormTopicName('');
    setFormExamType('TYT');
    setFormPublisher('');
    setFormErrorReason('bilgi_eksigi');
    setFormPriority('medium');
    setFormSolutionNotes('');
    setFormImageUrl('');
    setFormRevised(false);
    setIsAddEditModalOpen(true);
  };

  const handleOpenEditModal = (item: TopicErrorItem) => {
    setEditingItem(item);
    setFormSubject(item.subject || 'TYT Matematik');
    setFormTopicName(item.topicName || '');
    setFormExamType(item.examType || (item.subject?.startsWith('AYT') ? 'AYT' : 'TYT'));
    setFormPublisher(item.publisher || '');
    setFormErrorReason(item.errorReason || 'bilgi_eksigi');
    setFormPriority((item.priority as any) || 'medium');
    setFormSolutionNotes(item.solutionNotes || '');
    setFormImageUrl(item.imageUrl || '');
    setFormRevised(!!item.revised);
    setIsAddEditModalOpen(true);
  };

  // Submit Modal Form
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTopicName.trim()) {
      alert('Lütfen konu adını belirtin.');
      return;
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day} ${hours}:${minutes}`;

    if (editingItem && onUpdateTopicError) {
      const updated: TopicErrorItem = {
        ...editingItem,
        subject: formSubject,
        topicName: formTopicName.trim(),
        examType: formExamType,
        publisher: formPublisher.trim() || undefined,
        errorReason: formErrorReason,
        priority: formPriority,
        solutionNotes: formSolutionNotes.trim() || undefined,
        imageUrl: formImageUrl.trim() || undefined,
        revised: formRevised
      };
      const desc = `${teacherUser.name}, ${studentUser.name} öğrencisinin "${formSubject} - ${formTopicName}" hata kaydını güncelledi.`;
      onUpdateTopicError(studentUser.id, updated, desc);
    } else if (onAddTopicError) {
      const todayStr = getTodayDateString();
      const intervals = getUserRepetitionIntervals();
      const nextReviewDate = formImageUrl.trim() ? calculateNextReviewDate(dateStr || todayStr, 0, intervals) : undefined;
      const newErr: Omit<TopicErrorItem, 'id'> = {
        date: dateStr || todayStr,
        subject: formSubject,
        topicName: formTopicName.trim(),
        examType: formExamType,
        publisher: formPublisher.trim() || undefined,
        errorReason: formErrorReason,
        priority: formPriority,
        solutionNotes: formSolutionNotes.trim() || undefined,
        imageUrl: formImageUrl.trim() || undefined,
        revised: formRevised,
        repetitionStage: 0,
        nextReviewDate
      };
      const desc = `${teacherUser.name}, ${studentUser.name} öğrencisi için hata defterine yeni soru kaydetti: "${formSubject} - ${formTopicName}".`;
      onAddTopicError(studentUser.id, newErr, desc);
    }

    setIsAddEditModalOpen(false);
  };

  // Delete Error Item
  const handleDelete = (errItem: TopicErrorItem) => {
    if (!onDeleteTopicError) return;
    if (confirm(`"${errItem.subject} - ${errItem.topicName}" hata kaydını silmek istediğinize emin misiniz?`)) {
      const desc = `${teacherUser.name}, ${studentUser.name} öğrencisinin hata defterinden "${errItem.subject} - ${errItem.topicName}" kaydını sildi.`;
      onDeleteTopicError(studentUser.id, errItem.id, desc);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* 🌟 HERO EXECUTIVE BANNER */}
      <div className="bg-gradient-to-r from-slate-900 via-rose-950/40 to-slate-900 border border-rose-500/30 rounded-3xl p-6 shadow-2xl backdrop-blur-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center shadow-lg shadow-rose-500/20">
                <AlertTriangle className="w-6 h-6 text-rose-400" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">Hata Defteri & Yanlış Soru İnceleme</h2>
                  <span className="bg-rose-500/20 text-rose-300 text-xs font-black px-2.5 py-0.5 rounded-full border border-rose-500/30">
                    {totalCount} Soru
                  </span>
                </div>
                <p className="text-xs text-slate-300 font-medium leading-relaxed">
                  Öğrencinin branş denemelerinden, genel denemelerden ve soru bankalarından kaydettiği hatalı soruları, yapay zeka analizlerini ve pekiştirme durumunu takip edin.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3 shrink-0 flex-wrap gap-y-2">
            <button
              onClick={handleOpenAddModal}
              className="bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-xs px-4 py-2.5 rounded-2xl transition-all shadow-lg shadow-rose-600/30 border border-rose-400/40 flex items-center space-x-2 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>+ Öğrenciye Hata Kaydı Ekle</span>
            </button>
          </div>
        </div>

        {/* 📊 4 EXECUTIVE KPI CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-white/10 mt-6">
          <div className="bg-slate-950/60 border border-white/10 rounded-2xl p-3.5 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Toplam Kayıtlı Hata</span>
            <div className="text-xl font-black text-white font-mono">{totalCount}</div>
            <span className="text-[10px] text-slate-400 font-medium">Hata Defteri Havuzu</span>
          </div>

          <div className="bg-slate-950/60 border border-rose-500/30 rounded-2xl p-3.5 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block">Tekrar Bekleyen (Açık)</span>
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            </div>
            <div className="text-xl font-black text-rose-300 font-mono">{unresolvedErrs.length}</div>
            <span className="text-[10px] text-rose-400 font-semibold">Pekiştirilmesi Gereken</span>
          </div>

          <div className="bg-slate-950/60 border border-emerald-500/30 rounded-2xl p-3.5 space-y-1">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">Pekiştirilen (Çözülen)</span>
            <div className="text-xl font-black text-emerald-300 font-mono">{resolvedErrs.length}</div>
            <span className="text-[10px] text-emerald-400 font-semibold">Kazanım Sağlandı</span>
          </div>

          <div className="bg-slate-950/60 border border-amber-500/30 rounded-2xl p-3.5 space-y-1">
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">Pekiştirme Başarısı</span>
            <div className="text-xl font-black text-amber-300 font-mono">%{resolutionPct}</div>
            <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-amber-500 to-emerald-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${resolutionPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* 🔥 TOP ERROR TOPICS BADGES */}
        {topErrorTopics.length > 0 && (
          <div className="pt-4 border-t border-white/10 mt-4 flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
            <span className="text-[11px] font-bold text-slate-400 flex items-center space-x-1 shrink-0">
              <Flame className="w-3.5 h-3.5 text-rose-400" />
              <span>En Çok Hata Yapılan Konular:</span>
            </span>
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              {topErrorTopics.map(([topic, data], idx) => (
                <button
                  key={idx}
                  onClick={() => setSearchQuery(topic)}
                  className="bg-rose-500/15 hover:bg-rose-500/30 border border-rose-500/30 text-rose-200 text-xs px-2.5 py-1 rounded-xl font-semibold transition-all flex items-center space-x-1.5 cursor-pointer"
                >
                  <span>{topic}</span>
                  <span className="bg-rose-500/30 text-white font-mono px-1.5 py-0.2 rounded-md text-[10px]">
                    {data.count} hata
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 🔍 FILTERS & CONTROLS TOOLBAR */}
      <div className="bg-slate-900/90 border border-white/15 rounded-3xl p-5 shadow-xl backdrop-blur-2xl space-y-4">
        
        {/* Row 1: Search & View Mode Switcher */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Konu, ders, kaynak kitap veya çözüm notlarında ara..."
              className="w-full bg-slate-950 border border-white/10 rounded-2xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <div className="bg-slate-950 p-1 rounded-2xl border border-white/10 flex items-center space-x-1">
              <button
                onClick={() => setViewMode('cards')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                  viewMode === 'cards'
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Kartlar</span>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>Tablo</span>
              </button>
            </div>
          </div>
        </div>

        {/* Row 2: Filter Selectors */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-2 border-t border-white/10 text-xs">
          
          {/* Subject Filter */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Ders Filtresi</label>
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="w-full bg-slate-950 border border-white/10 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-rose-500 cursor-pointer"
            >
              <option value="all">Tüm Dersler</option>
              {isBranchTeacher && teacherUser.subject && (
                <option value={teacherUser.subject}>⭐ Branşınız ({teacherUser.subject})</option>
              )}
              {ALL_SUBJECTS.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Pekiştirme Durumu</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full bg-slate-950 border border-white/10 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-rose-500 cursor-pointer"
            >
              <option value="all">Tümü ({totalCount})</option>
              <option value="unrevised">⏳ Tekrar Bekleyen ({unresolvedErrs.length})</option>
              <option value="revised">✓ Pekiştirilen ({resolvedErrs.length})</option>
            </select>
          </div>

          {/* Error Reason Filter */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Hata Nedeni</label>
            <select
              value={reasonFilter}
              onChange={(e) => setReasonFilter(e.target.value)}
              className="w-full bg-slate-950 border border-white/10 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-rose-500 cursor-pointer"
            >
              <option value="all">Tüm Hata Nedenleri</option>
              {Object.entries(ERROR_REASON_LABELS).map(([k, label]) => (
                <option key={k} value={k}>{label}</option>
              ))}
            </select>
          </div>

          {/* Photo Filter */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Soru Görseli</label>
            <select
              value={hasPhotoFilter}
              onChange={(e) => setHasPhotoFilter(e.target.value as any)}
              className="w-full bg-slate-950 border border-white/10 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-rose-500 cursor-pointer"
            >
              <option value="all">Tüm Sorular</option>
              <option value="with_photo">📷 Fotoğraflı Sorular</option>
              <option value="no_photo">📝 Yalnızca Metin</option>
            </select>
          </div>

          {/* Sort Filter */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Sıralama</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full bg-slate-950 border border-white/10 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-rose-500 cursor-pointer"
            >
              <option value="newest">En Yeni Eklenen</option>
              <option value="oldest">En Eski Eklenen</option>
              <option value="priority">Öncelik Puanı (Yüksek → Düşük)</option>
              <option value="subject">Ders Adına Göre</option>
            </select>
          </div>

        </div>

      </div>

      {/* 📇 CARDS VIEW OR 📋 TABLE VIEW */}
      {filteredErrors.length === 0 ? (
        <div className="bg-slate-900/90 border border-white/15 rounded-3xl p-12 text-center space-y-4 shadow-xl">
          <div className="w-16 h-16 rounded-3xl bg-slate-800/80 border border-white/10 flex items-center justify-center mx-auto text-slate-400">
            <BookOpen className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">Eşleşen Hata Kaydı Bulunamadı</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              {topicErrors.length === 0
                ? 'Öğrencinin henüz hata defterinde kayıtlı bir sorusu bulunmamaktadır.'
                : 'Uygulanan filtrelerle eşleşen soru kaydı bulunamadı. Filtreleri temizlemeyi deneyin.'}
            </p>
          </div>
          {topicErrors.length > 0 && (
            <button
              onClick={() => {
                setSubjectFilter('all');
                setStatusFilter('all');
                setReasonFilter('all');
                setHasPhotoFilter('all');
                setSearchQuery('');
              }}
              className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all border border-white/15"
            >
              Filtreleri Sıfırla
            </button>
          )}
        </div>
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredErrors.map((errItem) => {
            const reasonStyle = ERROR_REASON_COLORS[errItem.errorReason] || {
              bg: 'bg-slate-500/15',
              text: 'text-slate-300',
              border: 'border-slate-500/30',
              iconBg: 'bg-slate-500/20'
            };
            const reasonLabel = ERROR_REASON_LABELS[errItem.errorReason] || 'Hata Nedeni Belirtilmedi';
            const isAiExpanded = !!expandedAiDetails[errItem.id];

            return (
              <div
                key={errItem.id}
                className={`bg-slate-900/90 border rounded-3xl p-5 shadow-xl transition-all duration-300 space-y-4 backdrop-blur-2xl flex flex-col justify-between ${
                  errItem.revised
                    ? 'border-emerald-500/30 hover:border-emerald-500/50 bg-slate-900/60'
                    : 'border-rose-500/30 hover:border-rose-500/50'
                }`}
              >
                {/* Card Header */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <span className="text-xs font-black bg-indigo-500/20 text-indigo-300 px-2.5 py-0.5 rounded-lg border border-indigo-500/30">
                          {errItem.subject}
                        </span>
                        {errItem.priority === 'high' && (
                          <span className="text-[10px] font-extrabold bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-lg border border-rose-500/30 flex items-center space-x-1">
                            <Flame className="w-3 h-3 text-rose-400" />
                            <span>Yüksek Öncelik</span>
                          </span>
                        )}
                        {errItem.date && (
                          <span className="text-[10px] font-bold bg-slate-800 text-slate-300 px-2 py-0.5 rounded-lg border border-slate-700 flex items-center space-x-1 shadow-sm" title={`Eklenme Tarihi: ${formatDisplayDate(errItem.date)}`}>
                            <Calendar className="w-3 h-3 text-indigo-400" />
                            <span>{formatDisplayDate(errItem.date)}</span>
                          </span>
                        )}
                      </div>
                      <h4 className="text-base font-bold text-white leading-snug">
                        {errItem.topicName || 'Konu Belirtilmedi'}
                      </h4>
                    </div>

                    {/* Quick Status Toggle Button */}
                    <button
                      onClick={() => handleToggleRevision(errItem)}
                      title={errItem.revised ? 'Pekiştirildi (Tekrar açmak için tıklayın)' : 'Tekrar Bekliyor (Pekiştirildi olarak işaretlemek için tıklayın)'}
                      className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-1.5 cursor-pointer shadow-sm ${
                        errItem.revised
                          ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                          : 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40'
                      }`}
                    >
                      {errItem.revised ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Pekiştirildi ✓</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-3.5 h-3.5 text-rose-400" />
                          <span>Tekrar Bekliyor</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Badges Bar: Error Reason & Publisher */}
                  <div className="flex items-center space-x-2 flex-wrap gap-y-1 text-[11px]">
                    <span className={`px-2.5 py-1 rounded-xl border font-bold flex items-center space-x-1 ${reasonStyle.bg} ${reasonStyle.text} ${reasonStyle.border}`}>
                      <AlertTriangle className="w-3 h-3 shrink-0" />
                      <span>{reasonLabel}</span>
                    </span>

                    {errItem.publisher && (
                      <span className="bg-slate-950 border border-white/10 text-slate-300 px-2.5 py-1 rounded-xl font-medium flex items-center space-x-1">
                        <BookOpen className="w-3 h-3 text-indigo-400 shrink-0" />
                        <span>{errItem.publisher}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Soru Görseli (Varsa) */}
                {errItem.imageUrl && (
                  <div className="relative group rounded-2xl overflow-hidden border border-white/10 bg-slate-950/80 max-h-48 flex items-center justify-center">
                    <img
                      src={errItem.imageUrl}
                      alt={errItem.topicName}
                      className="w-full h-44 object-contain transition-transform group-hover:scale-105"
                    />
                    <div 
                      onClick={() => setPreviewImageUrl({ url: errItem.imageUrl!, title: `${errItem.subject} - ${errItem.topicName}` })}
                      className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2 cursor-pointer"
                    >
                      <span className="bg-indigo-600 text-white font-bold text-xs px-3 py-1.5 rounded-xl flex items-center space-x-1.5 shadow-lg">
                        <ZoomIn className="w-3.5 h-3.5" />
                        <span>HD Görseli Büyüt</span>
                      </span>
                    </div>
                  </div>
                )}

                {/* Öğrenci Çözüm / Hata Notu */}
                {errItem.solutionNotes && (
                  <div className="bg-slate-950/70 border border-white/10 rounded-2xl p-3 space-y-1">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">Çözüm / Öğrenci Notu</span>
                    <p className="text-xs text-slate-200 leading-relaxed font-sans whitespace-pre-wrap">
                      {errItem.solutionNotes}
                    </p>
                  </div>
                )}

                {/* Inline Note Editor for Teacher */}
                {inlineEditingId === errItem.id ? (
                  <div className="bg-slate-950 border border-indigo-500/40 rounded-2xl p-3 space-y-2">
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">Öğretmen Rehberlik / Çözüm Notu</span>
                    <textarea
                      value={inlineNoteText}
                      onChange={(e) => setInlineNoteText(e.target.value)}
                      placeholder="Öğrenciye bu soru için koçluk veya çözüm tavsiyesi yazın..."
                      rows={3}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-400"
                    />
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => setInlineEditingId(null)}
                        className="text-slate-400 hover:text-white text-xs px-2.5 py-1"
                      >
                        İptal
                      </button>
                      <button
                        onClick={() => handleSaveInlineNote(errItem)}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-3 py-1.5 rounded-xl shadow-md cursor-pointer"
                      >
                        Kaydet
                      </button>
                    </div>
                  </div>
                ) : null}

                {/* 🤖 Yapay Zeka Çözüm & Analiz Genişletilebilir Alan */}
                {(errItem.aiAnalysis || errItem.aiSolution || errItem.aiFeedback) && (
                  <div className="bg-purple-950/20 border border-purple-500/30 rounded-2xl p-3 space-y-2">
                    <button
                      onClick={() => setExpandedAiDetails(prev => ({ ...prev, [errItem.id]: !prev[errItem.id] }))}
                      className="w-full flex items-center justify-between text-xs font-bold text-purple-300 hover:text-purple-200 cursor-pointer"
                    >
                      <div className="flex items-center space-x-1.5">
                        <BrainCircuit className="w-3.5 h-3.5 text-purple-400" />
                        <span>Yapay Zeka Koç Çözüm & Analizi</span>
                      </div>
                      {isAiExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    {isAiExpanded && (
                      <div className="pt-2 border-t border-purple-500/20 text-xs text-slate-200 space-y-3 leading-relaxed">
                        {errItem.aiSolution && (
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider block">Adım Adım Çözüm:</span>
                            <div className="bg-slate-950/70 p-3 rounded-xl border border-white/5">
                              <LatexRenderer content={errItem.aiSolution} />
                            </div>
                          </div>
                        )}
                        {errItem.aiAnalysis && (
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">Kazanım & Çeldirici Analizi:</span>
                            <div className="bg-slate-950/70 p-3 rounded-xl border border-white/5">
                              <LatexRenderer content={errItem.aiAnalysis} />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Footer Action Buttons */}
                <div className="flex items-center justify-between pt-3 border-t border-white/10 text-xs">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setInlineEditingId(errItem.id);
                        setInlineNoteText(errItem.solutionNotes || '');
                      }}
                      className="bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white px-2.5 py-1.5 rounded-xl border border-white/10 transition-all flex items-center space-x-1 cursor-pointer"
                      title="Öğretmen notu ekle / düzenle"
                    >
                      <Edit2 className="w-3 h-3 text-indigo-400" />
                      <span>Not Ekle</span>
                    </button>
                    
                    <button
                      onClick={() => handleOpenEditModal(errItem)}
                      className="bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white px-2.5 py-1.5 rounded-xl border border-white/10 transition-all flex items-center space-x-1 cursor-pointer"
                      title="Düzenle"
                    >
                      <Tag className="w-3 h-3 text-slate-400" />
                      <span>Düzenle</span>
                    </button>
                  </div>

                  <button
                    onClick={() => handleDelete(errItem)}
                    className="text-slate-500 hover:text-rose-400 p-1.5 hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer"
                    title="Hata kaydını sil"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        /* 📋 COMPACT TABLE VIEW */
        <div className="bg-slate-900/90 border border-white/15 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950 border-b border-white/10 text-slate-400 uppercase tracking-wider font-bold text-[10px]">
                  <th className="p-4 w-12">Görsel</th>
                  <th className="p-4">Ders & Konu</th>
                  <th className="p-4">Hata Nedeni</th>
                  <th className="p-4">Kaynak</th>
                  <th className="p-4">Öncelik</th>
                  <th className="p-4">Durum</th>
                  <th className="p-4 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-200 font-medium">
                {filteredErrors.map((errItem) => {
                  const reasonLabel = ERROR_REASON_LABELS[errItem.errorReason] || 'Belirtilmedi';
                  const reasonStyle = ERROR_REASON_COLORS[errItem.errorReason] || {
                    bg: 'bg-slate-500/15',
                    text: 'text-slate-300',
                    border: 'border-slate-500/30'
                  };

                  return (
                    <tr key={errItem.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-4">
                        {errItem.imageUrl ? (
                          <button
                            onClick={() => setPreviewImageUrl({ url: errItem.imageUrl!, title: `${errItem.subject} - ${errItem.topicName}` })}
                            className="w-10 h-10 rounded-xl overflow-hidden border border-white/15 bg-slate-950 flex items-center justify-center group cursor-pointer hover:border-rose-400 transition-all"
                          >
                            <img src={errItem.imageUrl} alt="Soru" className="w-full h-full object-cover group-hover:scale-110" />
                          </button>
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-slate-950 border border-white/10 flex items-center justify-center text-slate-600">
                            <ImageIcon className="w-4 h-4" />
                          </div>
                        )}
                      </td>

                      <td className="p-4">
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-black bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-md border border-indigo-500/30">
                            {errItem.subject}
                          </span>
                          <h5 className="text-xs font-bold text-white pt-1">{errItem.topicName}</h5>
                          {errItem.date && (
                            <span className="text-[10px] text-slate-400 flex items-center gap-1 pt-0.5">
                              <Calendar className="w-3 h-3 text-slate-500" />
                              <span>{formatDisplayDate(errItem.date)}</span>
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-lg border text-[10px] font-bold inline-block ${reasonStyle.bg} ${reasonStyle.text} ${reasonStyle.border}`}>
                          {reasonLabel}
                        </span>
                      </td>

                      <td className="p-4 text-slate-400 text-xs">
                        {errItem.publisher || '—'}
                      </td>

                      <td className="p-4">
                        {errItem.priority === 'high' ? (
                          <span className="text-rose-400 font-bold flex items-center space-x-1">
                            <Flame className="w-3 h-3" />
                            <span>Yüksek</span>
                          </span>
                        ) : (
                          <span className="text-slate-400">Normal</span>
                        )}
                      </td>

                      <td className="p-4">
                        <button
                          onClick={() => handleToggleRevision(errItem)}
                          className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all flex items-center space-x-1 cursor-pointer ${
                            errItem.revised
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          }`}
                        >
                          {errItem.revised ? <Check className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          <span>{errItem.revised ? 'Pekiştirildi' : 'Bekliyor'}</span>
                        </button>
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => handleOpenEditModal(errItem)}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                            title="Düzenle"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(errItem)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                            title="Sil"
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
        </div>
      )}

      {/* 🖼️ HD IMAGE PREVIEW MODAL */}
      {previewImageUrl && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setPreviewImageUrl(null)}
        >
          <div 
            className="bg-slate-900 border border-white/20 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-slate-950">
              <div className="flex items-center space-x-2">
                <ImageIcon className="w-4 h-4 text-indigo-400" />
                <h4 className="text-sm font-bold text-white truncate">{previewImageUrl.title}</h4>
              </div>
              <button
                onClick={() => setPreviewImageUrl(null)}
                className="text-slate-400 hover:text-white p-1 rounded-xl hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 flex-1 overflow-auto flex items-center justify-center bg-slate-950/60">
              <img
                src={previewImageUrl.url}
                alt={previewImageUrl.title}
                className="max-h-[75vh] w-auto object-contain rounded-2xl shadow-2xl border border-white/10"
              />
            </div>

            <div className="p-3 bg-slate-950 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
              <span>HD Soru Önizlemesi</span>
              <a
                href={previewImageUrl.url}
                target="_blank"
                rel="noreferrer"
                className="text-indigo-400 hover:text-indigo-300 font-bold flex items-center space-x-1"
              >
                <span>Yeni Sekmede Aç ↗</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ✏️ ADD / EDIT ERROR MODAL */}
      {isAddEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-slate-900 border border-white/20 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 my-8">
            
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-300">
                  {editingItem ? <Edit2 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingItem ? 'Hata Kaydını Düzenle' : 'Öğrenciye Hata Kaydı Ekle'}
                  </h3>
                  <p className="text-xs text-slate-400">{studentUser.name} ({studentUser.className || 'Sınıfsız'})</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddEditModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-xl hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Ders</label>
                  <select
                    value={formSubject}
                    onChange={(e) => setFormSubject(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
                  >
                    {ALL_SUBJECTS.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Sınav Türü</label>
                  <select
                    value={formExamType}
                    onChange={(e) => setFormExamType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
                  >
                    <option value="TYT">TYT</option>
                    <option value="AYT">AYT</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Konu Adı *</label>
                <input
                  type="text"
                  value={formTopicName}
                  onChange={(e) => setFormTopicName(e.target.value)}
                  placeholder="Örn: Fonksiyonlarda Bileşke, Newton Kanunları..."
                  required
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Hata Nedeni</label>
                  <select
                    value={formErrorReason}
                    onChange={(e) => setFormErrorReason(e.target.value as any)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
                  >
                    {Object.entries(ERROR_REASON_LABELS).map(([k, label]) => (
                      <option key={k} value={k}>{label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Öncelik Seviyesi</label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as any)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
                  >
                    <option value="high">🔥 Yüksek Öncelik</option>
                    <option value="medium">⚡ Normal Öncelik</option>
                    <option value="low">🌱 Düşük Öncelik</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Kaynak / Yayın Adı</label>
                <input
                  type="text"
                  value={formPublisher}
                  onChange={(e) => setFormPublisher(e.target.value)}
                  placeholder="Örn: 3D TYT Matematik, Bilgi Sarmal Branş Denemesi..."
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Soru Görsel Bağlantısı (URL / Resim Linki)</label>
                <input
                  type="text"
                  value={formImageUrl}
                  onChange={(e) => setFormImageUrl(e.target.value)}
                  placeholder="https://... (varsa soru fotoğraf URL'si)"
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Öğretmen / Çözüm Notları</label>
                <textarea
                  value={formSolutionNotes}
                  onChange={(e) => setFormSolutionNotes(e.target.value)}
                  placeholder="Soru çözümü, dikkat edilmesi gereken kural veya koçluk notu..."
                  rows={3}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="formRevisedCheckbox"
                  checked={formRevised}
                  onChange={(e) => setFormRevised(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 bg-slate-950 border-white/20 focus:ring-0 cursor-pointer"
                />
                <label htmlFor="formRevisedCheckbox" className="text-xs text-slate-200 font-semibold cursor-pointer">
                  Bu konu / soru pekiştirildi olarak işaretlensin
                </label>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsAddEditModalOpen(false)}
                  className="bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs px-4 py-2.5 rounded-xl border border-white/10"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-rose-600/30 border border-rose-400/40 cursor-pointer"
                >
                  {editingItem ? 'Değişiklikleri Kaydet' : 'Hata Defterine Kaydet'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
