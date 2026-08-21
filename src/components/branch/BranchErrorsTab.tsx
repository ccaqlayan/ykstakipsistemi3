import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  AlertTriangle, 
  BookOpen, 
  CheckCircle2, 
  Trash2, 
  Edit2, 
  Sparkles, 
  HelpCircle, 
  Maximize2, 
  Image as ImageIcon,
  Brain,
  X,
  FileText,
  Star,
  Loader2,
  Bot,
  RotateCcw,
  Zap,
  Target,
  Info,
  Filter,
  Clock,
  Play,
  Camera,
  Calendar,
  Folder,
  FolderOpen,
  Table,
  Layers,
  LayoutGrid,
  Check,
  Printer
} from 'lucide-react';
import { TopicErrorItem, BranchExam, ResourceItem, GeneralMockExam, UserAccount } from '../../types';
import { 
  getDueRepetitionQuestions, 
  isQuestionDue, 
  getUserRepetitionIntervals,
  getIncludeRevisedInRepetition,
  getTodayDateString,
  calculateNextReviewDate,
  addDaysToDate,
  getRepetitionStageInfo
} from '../../services/spacedRepetition';
import { formatDisplayDate, formatCompactDisplayDate } from '../../utils/dateUtils';

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

interface BranchErrorsTabProps {
  topicErrors: TopicErrorItem[];
  filteredErrors: TopicErrorItem[];
  filterExamId: string | null;
  setFilterExamId: (val: string | null) => void;
  filterRevised: 'UNREVISED' | 'REVISED' | 'ALL';
  setFilterRevised: (val: 'UNREVISED' | 'REVISED' | 'ALL') => void;
  filterSubject: string;
  setFilterSubject: (val: string) => void;
  filterMatchStatus: string;
  setFilterMatchStatus: (val: string) => void;
  sortOption: string;
  setSortOption: (val: string) => void;
  branchExams: BranchExam[];
  generalMocks?: GeneralMockExam[];
  resources: ResourceItem[];
  openAddErrorModal: (err?: TopicErrorItem) => void;
  setDeletingItem: (item: { type: 'error' | 'exam'; id: string; title: string }) => void;
  handleToggleErrorRevision: (id: string) => void;
  revisingIds: Record<string, boolean>;
  fadingOutIds: Record<string, boolean>;
  handleOpenTipModal: (subject: string, topicName: string) => void;
  handleOpenSolveModal: (errorItem: TopicErrorItem) => void;
  handleOpenSimilarModal: (errorItem: TopicErrorItem) => void;
  handleOpenQuestionReport: (errorItem: TopicErrorItem) => void;
  openImagePreview: (url: string, title: string) => void;
  ERROR_REASON_LABELS: Record<string, string>;
  ERROR_REASON_COLORS: Record<string, string>;
  hideHeroHeader?: boolean;
  onUpdateTopicError?: (err: TopicErrorItem) => void;
  previewStudentUser?: UserAccount | null;
  onStartRepetitionSession?: (questions?: TopicErrorItem[]) => void;
  onOpenRepetitionSettings?: () => void;
  onOpenErrorExamPrint?: () => void;
}

export const BranchErrorsTab: React.FC<BranchErrorsTabProps> = ({
  topicErrors,
  filteredErrors,
  filterExamId,
  setFilterExamId,
  filterRevised,
  setFilterRevised,
  filterSubject,
  setFilterSubject,
  filterMatchStatus,
  setFilterMatchStatus,
  sortOption,
  setSortOption,
  branchExams,
  generalMocks = [],
  resources,
  openAddErrorModal,
  setDeletingItem,
  handleToggleErrorRevision,
  revisingIds,
  fadingOutIds,
  handleOpenTipModal,
  handleOpenSolveModal,
  handleOpenSimilarModal,
  handleOpenQuestionReport,
  openImagePreview,
  ERROR_REASON_LABELS,
  ERROR_REASON_COLORS,
  hideHeroHeader = false,
  onUpdateTopicError,
  previewStudentUser,
  onStartRepetitionSession,
  onOpenRepetitionSettings,
  onOpenErrorExamPrint,
}) => {
  const [activeAiErrorItem, setActiveAiErrorItem] = useState<TopicErrorItem | null>(null);
  const [isAnalyzingActiveError, setIsAnalyzingActiveError] = useState(false);
  const [analysisErrorMsg, setAnalysisErrorMsg] = useState<string | null>(null);
  const [inlineEditingErrorId, setInlineEditingErrorId] = useState<string | null>(null);
  const [inlineNotesText, setInlineNotesText] = useState<string>('');

  // 🔀 Görünüm Modu State (Liste vs Tablo vs Galeri - Varsayılan: Galeri)
  const [viewMode, setViewMode] = useState<'list' | 'table' | 'gallery'>(() => {
    try {
      const saved = localStorage.getItem('yks_error_notebook_view_mode');
      if (saved === 'list' || saved === 'table' || saved === 'gallery') return saved;
      return 'gallery';
    } catch {
      return 'gallery';
    }
  });

  const handleSetViewMode = (mode: 'list' | 'table' | 'gallery') => {
    setViewMode(mode);
    try {
      localStorage.setItem('yks_error_notebook_view_mode', mode);
    } catch {}
  };

  // 📁 Ders Klasörleri Hesaplama (Subject Folders Data)
  const subjectFolders = useMemo(() => {
    const subSet = Array.from(new Set(topicErrors.map(e => e.subject)))
      .filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
      .sort((a, b) => a.localeCompare(b, 'tr'));

    const list: Array<{
      subject: string;
      isAll: boolean;
      total: number;
      pending: number;
      revised: number;
      rate: number;
      color: string;
      topTopics: Array<{ topic: string; count: number }>;
    }> = [];

    // 1. Tüm Dersler Ana Klasörü (Master Folder)
    const allTotal = topicErrors.length;
    const allPending = topicErrors.filter(e => !e.revised).length;
    const allRevised = topicErrors.filter(e => e.revised).length;
    const allRate = allTotal > 0 ? Math.round((allRevised / allTotal) * 100) : 0;
    
    const allTopicCounts: Record<string, number> = {};
    topicErrors.forEach(e => {
      const t = e.topicName?.trim() || 'Genel';
      allTopicCounts[t] = (allTopicCounts[t] || 0) + 1;
    });
    const allTopTopics = Object.entries(allTopicCounts)
      .map(([topic, count]) => ({ topic, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    list.push({
      subject: 'ALL',
      isAll: true,
      total: allTotal,
      pending: allPending,
      revised: allRevised,
      rate: allRate,
      color: '#6366f1',
      topTopics: allTopTopics,
    });

    // 2. Her Bir Ders İçin Ayrı Klasör (Subject Folder)
    subSet.forEach(sub => {
      const subErrors = topicErrors.filter(e => e.subject === sub);
      const total = subErrors.length;
      const pending = subErrors.filter(e => !e.revised).length;
      const revised = subErrors.filter(e => e.revised).length;
      const rate = total > 0 ? Math.round((revised / total) * 100) : 0;
      const color = SUBJECT_COLORS[sub] || '#8b5cf6';

      const topicCounts: Record<string, number> = {};
      subErrors.forEach(e => {
        const t = e.topicName?.trim() || 'Genel';
        topicCounts[t] = (topicCounts[t] || 0) + 1;
      });
      const topTopics = Object.entries(topicCounts)
        .map(([topic, count]) => ({ topic, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);

      list.push({
        subject: sub,
        isAll: false,
        total,
        pending,
        revised,
        rate,
        color,
        topTopics,
      });
    });

    return list;
  }, [topicErrors]);

  const handleSaveInlineNote = (errItem: TopicErrorItem) => {
    if (!onUpdateTopicError) return;
    const updated: TopicErrorItem = {
      ...errItem,
      solutionNotes: inlineNotesText.trim()
    };
    onUpdateTopicError(updated);
    setInlineEditingErrorId(null);
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

  const isErrorMatchingFilterSource = (e: TopicErrorItem, filterId: string | null) => {
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

  const getFilterSourceDisplayName = (filterId: string | null) => {
    if (!filterId) return '';
    const directErr = topicErrors.find(e => e.examId === filterId || e.publisher === filterId || (e.publisher && e.publisher.toLowerCase().includes(filterId.toLowerCase())));
    if (directErr?.publisher) return directErr.publisher;

    const book = resources.find(r => r.id === filterId || r.publisher?.toLowerCase() === filterId.toLowerCase());
    if (book) return `${book.publisher}${book.bookTitle ? ` (${book.bookTitle})` : ''}`;

    const branch = branchExams.find(b => b.id === filterId || b.publisher?.toLowerCase() === filterId.toLowerCase());
    if (branch) return `${branch.publisher} (${branch.subject} Branş)`;

    const mock = (generalMocks || []).find(g => g.id === filterId || g.title?.toLowerCase() === filterId.toLowerCase());
    if (mock) return mock.title;

    return filterId;
  };

  const handleRunAiAnalysis = async (errItem: TopicErrorItem) => {
    if (previewStudentUser) {
      setAnalysisErrorMsg('Öğrenci önizleme modunda yapay zeka hata analizi çalıştırılamaz (Salt Okunur).');
      return;
    }
    setIsAnalyzingActiveError(true);
    setAnalysisErrorMsg(null);
    try {
      const res = await fetch('/api/gemini/analyze-error-priority', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: errItem.subject,
          topicName: errItem.topicName,
          errorReason: errItem.errorReason,
          solutionNotes: errItem.solutionNotes,
          publisher: errItem.publisher
        })
      });
      if (!res.ok) {
        let errStr = 'Yapay zeka analiz servisine bağlanılamadı.';
        try {
          const errData = await res.json();
          if (errData.error) errStr = errData.error;
        } catch {}
        throw new Error(errStr);
      }
      const data = await res.json();
      if (data.success) {
        const updated: TopicErrorItem = {
          ...errItem,
          priority: data.rating || errItem.priority || 7,
          aiFeedback: data.analysis
        };
        if (onUpdateTopicError) {
          onUpdateTopicError(updated);
        }
        setActiveAiErrorItem(updated);
      } else {
        throw new Error(data.error || 'Analiz sonucu alınamadı.');
      }
    } catch (err: any) {
      setAnalysisErrorMsg(err.message || 'Yapay zeka analizi oluşturulurken bir hata oluştu.');
    } finally {
      setIsAnalyzingActiveError(false);
    }
  };

  const renderPriorityBar = (p: any) => {
    let val = parseInt(p, 10);
    if (isNaN(val)) {
      val = p === 'high' ? 9 : p === 'low' ? 3 : 6;
    }
    const pct = Math.min(100, Math.max(10, (val / 10) * 100));
    const barGradient = val >= 8 ? 'from-rose-500 to-red-600' : val >= 5 ? 'from-amber-500 to-orange-500' : 'from-indigo-500 to-blue-600';
    const textColor = val >= 8 ? 'text-rose-400' : val >= 5 ? 'text-amber-400' : 'text-indigo-400';

    return (
      <div className="flex items-center space-x-2 shrink-0">
        <span className={`text-xs font-bold font-mono ${textColor}`}>Öncelik: {val}/10</span>
        <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden shrink-0 border border-slate-700/50 p-0.5">
          <div className={`h-full bg-gradient-to-r ${barGradient} rounded-full transition-all duration-300 shadow-sm`} style={{ width: `${pct}%` }} />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 font-sans animate-fade-in">
      
      {/* ── HERO HEADER BANNER (MOBILE-OPTIMIZED) ── */}
      {!hideHeroHeader && (
        <div className="bg-gradient-to-r from-slate-900 via-rose-950/30 to-slate-900 p-3.5 sm:p-5 md:p-6 rounded-2xl sm:rounded-3xl border border-slate-800 shadow-2xl backdrop-blur-md relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
          <div className="space-y-1 sm:space-y-1.5 z-10">
            <div className="hidden landscape:inline-flex sm:inline-flex items-center space-x-2 bg-rose-500/10 border border-rose-500/20 px-3 py-1 rounded-full text-xs font-bold text-rose-300">
              <Sparkles className="w-3.5 h-3.5 text-rose-400" />
              <span>YKS Sıfır Hata & Yapay Zeka Çözüm Merkezi</span>
            </div>
            <h1 className="text-lg sm:text-xl md:text-2xl font-black text-white tracking-tight flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-rose-500 shrink-0 animate-pulse" />
              <span>Hata Defteri & Yanlış Tablosu</span>
            </h1>
            <p className="hidden landscape:block sm:block text-xs text-slate-400 max-w-2xl leading-relaxed">
              Deneme sınavları ve soru bankalarında yanlış yaptığınız konuları analiz edin, yapay zeka ile adım adım çözümlerini inceleyin ve tekrar ederek tam hakimiyet sağlayın.
            </p>
          </div>

          <div className="hidden sm:flex items-center space-x-2.5 shrink-0 z-10">
            {onOpenErrorExamPrint && (
              <button
                type="button"
                onClick={onOpenErrorExamPrint}
                className="bg-slate-800/90 hover:bg-slate-750 text-indigo-300 hover:text-white text-xs font-bold px-4 py-3 rounded-2xl transition-all shadow-lg border border-indigo-500/30 flex items-center justify-center space-x-2 cursor-pointer group hover:border-indigo-400"
                title="Hata defterindeki sorulardan özel test hazırla ve PDF/yazıcı çıktısı al"
              >
                <Printer className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
                <span>📄 Test Oluştur & Yazdır</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => openAddErrorModal()}
              className="bg-gradient-to-r from-rose-600 via-purple-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white text-xs font-bold px-5 py-3 rounded-2xl transition-all shadow-xl shadow-rose-600/30 flex items-center justify-center space-x-2 cursor-pointer border border-rose-400/30 group"
            >
              <AlertTriangle className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span>+ Yeni Hata Kaydı Ekle</span>
            </button>
          </div>
        </div>
      )}

      {/* 🔁 ARALIKLI TEKRAR BİLDİRİM BANNER'I */}
      {(() => {
        const dueQuestions = getDueRepetitionQuestions(topicErrors);
        return (
          <div className="bg-gradient-to-r from-purple-950/70 via-indigo-950/60 to-slate-900/90 border border-purple-500/40 p-4 sm:p-5 rounded-3xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 relative overflow-hidden backdrop-blur-md">
            <div className="flex items-center space-x-3.5 min-w-0">
              <div className="w-11 h-11 rounded-2xl bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center justify-center shrink-0 shadow-inner">
                <Brain className="w-6 h-6 text-purple-400" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center space-x-2">
                  <h4 className="text-xs sm:text-sm font-black text-white truncate">
                    {dueQuestions.length > 0
                      ? `🔁 ${dueQuestions.length} Adet Sorunun Aralıklı Tekrar Zamanı Geldi!`
                      : '🧠 Aralıklı Tekrar Sistemi (Hafıza Güçlendirici)'}
                  </h4>
                  <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/30 font-bold shrink-0">
                    Kör Tekrar
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  {dueQuestions.length > 0 
                    ? 'Soruları ipuçsuz ve çözümsüz olarak kendi hafızanla çöz, bilgiyi kalıcı hale getir.'
                    : 'Hata defterine eklediğin sorular 1, 3 ve 7 gün aralıklarla hafızanı tazelemek için karşına gelir.'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto justify-end shrink-0 flex-wrap">
              {onOpenErrorExamPrint && (
                <button
                  type="button"
                  onClick={onOpenErrorExamPrint}
                  className="p-2.5 bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-300 hover:text-white rounded-xl border border-indigo-500/30 transition-all cursor-pointer shadow-sm flex items-center space-x-1.5 text-xs font-bold"
                  title="Tekrar Sorularından Test Kitapçığı Hazırla ve Yazdır"
                >
                  <Printer className="w-4 h-4 text-indigo-400" />
                  <span className="hidden md:inline">Test Çıktısı Al</span>
                </button>
              )}

              {onOpenRepetitionSettings && (
                <button
                  type="button"
                  onClick={onOpenRepetitionSettings}
                  className="p-2.5 bg-slate-800/90 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-all cursor-pointer shadow-sm flex items-center space-x-1 text-xs font-bold"
                  title="Aralıklı Tekrar Ayarlarını Düzenle"
                >
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span className="hidden md:inline">Tekrar Ayarları</span>
                </button>
              )}

              {onStartRepetitionSession && (
                <button
                  type="button"
                  onClick={() => {
                    const incRev = getIncludeRevisedInRepetition();
                    const intervals = getUserRepetitionIntervals();
                    const fallbackList = topicErrors.filter(e => Boolean(e.imageUrl) && (incRev ? (e.repetitionStage ?? 0) < intervals.length : !e.revised));
                    onStartRepetitionSession(dueQuestions.length > 0 ? dueQuestions : fallbackList);
                  }}
                  className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-black rounded-xl shadow-lg shadow-purple-600/30 flex items-center space-x-1.5 transition-all cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-200" />
                  <span>
                    {dueQuestions.length > 0 ? `Tekrarı Başlat (${dueQuestions.length})` : 'Tekrar Seansı Başlat'}
                  </span>
                </button>
              )}
            </div>
          </div>
        );
      })()}

      {/* ── 4 KPI SUMMARY METRIC CARDS (KOMPAKT MİNİ İSTATİSTİK ŞERİDİ) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        {/* Card 1: Toplam Yanlış */}
        <div className="bg-slate-900/90 border border-slate-800 p-3 sm:p-3.5 rounded-2xl shadow-md backdrop-blur-md relative overflow-hidden group hover:border-rose-500/40 transition-all min-h-[80px]">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] sm:text-[10.5px] font-semibold text-slate-400 block truncate">Toplam Yanlış</span>
              <div className="flex items-baseline space-x-1.5">
                <span className="text-base sm:text-lg font-black text-white font-mono">{topicErrors.length}</span>
                <span className="text-[10px] text-slate-500 font-medium">Soru</span>
              </div>
            </div>
          </div>
          <span className="absolute bottom-2.5 right-2.5 sm:bottom-3 sm:right-3 text-[9px] sm:text-[9.5px] bg-rose-500/15 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-md font-semibold font-mono shrink-0">
            Havuz
          </span>
        </div>

        {/* Card 2: Bekleyen Tekrarlar */}
        <div className="bg-slate-900/90 border border-slate-800 p-3 sm:p-3.5 rounded-2xl shadow-md backdrop-blur-md relative overflow-hidden group hover:border-amber-500/40 transition-all min-h-[80px]">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
              <BookOpen className="w-4 h-4 text-amber-400" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] sm:text-[10.5px] font-semibold text-slate-400 block truncate">Bekleyen Tekrar</span>
              <div className="flex items-baseline space-x-1.5">
                <span className="text-base sm:text-lg font-black text-amber-400 font-mono">{topicErrors.filter(e => !e.revised).length}</span>
                <span className="text-[10px] text-slate-500 font-medium">Soru</span>
              </div>
            </div>
          </div>
          <span className="absolute bottom-2.5 right-2.5 sm:bottom-3 sm:right-3 text-[9px] sm:text-[9.5px] bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-md font-semibold font-mono shrink-0">
            %{topicErrors.length > 0 ? Math.round((topicErrors.filter(e => e.revised).length / topicErrors.length) * 100) : 0} Oran
          </span>
        </div>

        {/* Card 3: Tekrar Edilenler */}
        <div className="bg-slate-900/90 border border-slate-800 p-3 sm:p-3.5 rounded-2xl shadow-md backdrop-blur-md relative overflow-hidden group hover:border-emerald-500/40 transition-all min-h-[80px]">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] sm:text-[10.5px] font-semibold text-slate-400 block truncate">Pekiştirilen</span>
              <div className="flex items-baseline space-x-1.5">
                <span className="text-base sm:text-lg font-black text-emerald-400 font-mono">{topicErrors.filter(e => e.revised).length}</span>
                <span className="text-[10px] text-slate-500 font-medium">Soru</span>
              </div>
            </div>
          </div>
          <span className="absolute bottom-2.5 right-2.5 sm:bottom-3 sm:right-3 text-[9px] sm:text-[9.5px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-md font-semibold font-mono shrink-0">
            Tamamlandı
          </span>
        </div>

        {/* Card 4: AI & Görselli */}
        <div className="bg-slate-900/90 border border-slate-800 p-3 sm:p-3.5 rounded-2xl shadow-md backdrop-blur-md relative overflow-hidden group hover:border-purple-500/40 transition-all min-h-[80px]">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
              <Brain className="w-4 h-4 text-purple-400" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] sm:text-[10.5px] font-semibold text-slate-400 block truncate">Görselli & AI</span>
              <div className="flex items-baseline space-x-1.5">
                <span className="text-base sm:text-lg font-black text-purple-400 font-mono">{topicErrors.filter(e => e.imageUrl || e.aiAnalysis || e.aiFeedback).length}</span>
                <span className="text-[10px] text-slate-500 font-medium">Soru</span>
              </div>
            </div>
          </div>
          <span className="absolute bottom-2.5 right-2.5 sm:bottom-3 sm:right-3 text-[9px] sm:text-[9.5px] bg-purple-500/15 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-md font-semibold font-mono shrink-0">
            AI Destekli
          </span>
        </div>
      </div>

      {/* ── 📁 DERS KLASÖRLERİ (KOMPAKT YATAY BUTON ŞERİDİ) ── */}
      {topicErrors.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                <Folder className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>Ders Klasörleri</span>
                <span className="text-[9.5px] font-mono font-bold text-indigo-300 bg-indigo-500/20 border border-indigo-500/30 px-1.5 py-0.2 rounded-full">
                  {subjectFolders.length > 1 ? `${subjectFolders.length - 1} Ders` : '1 Klasör'}
                </span>
              </h3>
            </div>
            <span className="text-[10.5px] text-slate-400 hidden sm:inline font-medium">
              Ders butonuna tıklayarak ilgili hataları filtreleyin
            </span>
          </div>

          {/* Horizontal scrollable compact folder pill bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1.5 pt-0.5 scrollbar-none snap-x -mx-1 px-1">
            {subjectFolders.map((folder) => {
              const isSelected = (folder.isAll && (filterSubject === 'ALL' || !filterSubject)) || (!folder.isAll && filterSubject === folder.subject);
              const folderColor = folder.color;

              return (
                <button
                  key={folder.subject}
                  type="button"
                  onClick={() => {
                    setFilterSubject(folder.isAll ? 'ALL' : folder.subject);
                    setFilterExamId(null);
                  }}
                  className={`shrink-0 px-3 py-2 rounded-2xl transition-all duration-200 cursor-pointer snap-start flex items-center space-x-2 text-xs font-bold border select-none ${
                    isSelected
                      ? 'bg-slate-900 text-white shadow-md scale-[1.02]'
                      : 'bg-slate-900/60 hover:bg-slate-900 text-slate-300 hover:text-white border-slate-800 hover:border-slate-700'
                  }`}
                  style={{
                    borderColor: isSelected ? folderColor : undefined,
                    boxShadow: isSelected ? `0 4px 15px -4px ${folderColor}60` : undefined,
                  }}
                  title={
                    folder.topTopics.length > 0
                      ? `${folder.isAll ? 'Tüm Dersler' : folder.subject}: ${folder.total} Soru (${folder.pending} Bekleyen) • En Çok Hata: ${folder.topTopics.map(t => `${t.topic} (${t.count})`).join(', ')}`
                      : `${folder.isAll ? 'Tüm Dersler' : folder.subject}: ${folder.total} Soru`
                  }
                >
                  <div
                    className="w-5 h-5 rounded-lg flex items-center justify-center shrink-0 border"
                    style={{
                      backgroundColor: `${folderColor}20`,
                      color: folderColor,
                      borderColor: `${folderColor}40`,
                    }}
                  >
                    {isSelected ? (
                      <FolderOpen className="w-3 h-3" />
                    ) : (
                      <Folder className="w-3 h-3" />
                    )}
                  </div>

                  <span className="truncate max-w-[140px] sm:max-w-[180px]">
                    {folder.isAll ? '🗂️ Tüm Dersler' : folder.subject}
                  </span>

                  <span 
                    className="text-[10px] font-mono px-1.5 py-0.2 rounded-md font-bold"
                    style={{
                      backgroundColor: isSelected ? `${folderColor}30` : 'rgba(255,255,255,0.06)',
                      color: isSelected ? '#ffffff' : folderColor,
                    }}
                  >
                    {folder.total}
                  </span>

                  {folder.rate > 0 && (
                    <span className="text-[9.5px] text-emerald-400 font-mono hidden md:inline">
                      %{folder.rate}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── FILTER & SORT HUB ── */}
      <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 shadow-xl space-y-4">
        
        {/* Top Line: Status Filter Pills + View Mode Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 w-fit overflow-x-auto">
            <button
              type="button"
              onClick={() => { setFilterRevised('UNREVISED'); setFilterExamId(null); }}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                filterRevised === 'UNREVISED' && !filterExamId
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              ⏳ Bekleyenler ({topicErrors.filter(e => !e.revised).length})
            </button>
            <button
              type="button"
              onClick={() => { setFilterRevised('REVISED'); setFilterExamId(null); }}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                filterRevised === 'REVISED' && !filterExamId
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              ✅ Tekrar Edilenler ({topicErrors.filter(e => e.revised).length})
            </button>
            <button
              type="button"
              onClick={() => { setFilterRevised('ALL'); setFilterExamId(null); }}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                filterRevised === 'ALL' && !filterExamId
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              📋 Tümü ({topicErrors.length})
            </button>
          </div>

          {/* 🔀 Görünüm Değiştirici Switch (Liste vs Tablo vs Galeri) */}
          <div className="flex items-center bg-slate-950 p-1 rounded-2xl border border-slate-800 shadow-inner shrink-0 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => handleSetViewMode('list')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
              }`}
              title="Zengin Kart Liste Görünümü"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Liste</span>
            </button>
            <button
              type="button"
              onClick={() => handleSetViewMode('table')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
              }`}
              title="Kompakt Veri Tablosu Görünümü"
            >
              <Table className="w-3.5 h-3.5" />
              <span>Tablo</span>
            </button>
            <button
              type="button"
              onClick={() => handleSetViewMode('gallery')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'gallery'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
              }`}
              title="Pinterest/Instagram Tarzı Görsel Galeri"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Galeri</span>
            </button>
          </div>
        </div>

        {/* Info Tip Note (Placed under status tabs) */}
        <div className="flex items-center space-x-2 text-[11px] text-slate-400 bg-slate-950/70 border border-slate-800/80 px-3.5 py-2 rounded-2xl w-full">
          <Info className="w-4 h-4 text-indigo-400 shrink-0" />
          <span>
            <strong>Hızlı Filtreleme:</strong> Kartlardaki <span className="text-emerald-300 font-bold">📖 Kitap</span> veya <span className="text-indigo-300 font-bold">🎯 Deneme</span> simgesine tıklayarak yalnızca o kaynağa ait yanlışlarınızı filtreleyebilirsiniz.
          </span>
        </div>

        {/* Bottom Line: Select Dropdowns (Ders, Eşleşme, Sırala Yanyana) */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-800/80">
          <div className="flex items-center space-x-2 bg-slate-950/90 border border-slate-800 px-3.5 py-2 rounded-2xl shadow-sm">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Ders:</span>
            {(() => {
              const statusPool = topicErrors.filter((err) => {
                if (filterExamId && !isErrorMatchingFilterSource(err, filterExamId)) return false;
                if (filterRevised === 'UNREVISED' && err.revised) return false;
                if (filterRevised === 'REVISED' && !err.revised) return false;
                if (filterMatchStatus === 'MATCHED' && !isMatchedAny(err)) return false;
                if (filterMatchStatus === 'NOT_MATCHED' && isMatchedAny(err)) return false;
                if (filterMatchStatus === 'BOOK' && !isBookMatch(err)) return false;
                if (filterMatchStatus === 'EXAM' && !isExamMatch(err)) return false;
                return true;
              });

              const subjectOptions = Array.from(new Set(statusPool.map((err) => err.subject)))
                .filter((sub): sub is string => typeof sub === 'string')
                .map((sub) => ({
                  subject: sub,
                  count: statusPool.filter(e => e.subject === sub).length
                }))
                .filter(item => item.count > 0)
                .sort((a, b) => a.subject.localeCompare(b.subject, 'tr'));

              return (
                <select
                  value={filterSubject}
                  onChange={(e) => { setFilterSubject(e.target.value); setFilterExamId(null); }}
                  className="bg-transparent text-xs font-bold text-slate-200 focus:outline-none cursor-pointer max-w-[200px] truncate"
                >
                  <option value="ALL" className="bg-slate-900 text-white">Tüm Dersler ({statusPool.length})</option>
                  {subjectOptions.map(({ subject, count }) => (
                    <option key={subject} value={subject} className="bg-slate-900 text-white">
                      {subject} ({count})
                    </option>
                  ))}
                </select>
              );
            })()}
          </div>

          <div className="flex items-center space-x-2 bg-slate-950/90 border border-slate-800 px-3.5 py-2 rounded-2xl shadow-sm">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Eşleşme:</span>
            <select
              value={filterMatchStatus}
              onChange={(e) => { setFilterMatchStatus(e.target.value); setFilterExamId(null); }}
              className="bg-transparent text-xs font-bold text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900 text-white">Tüm Kaynaklar</option>
              <option value="MATCHED" className="bg-slate-900 text-white">Eşleşme Olanlar</option>
              <option value="BOOK" className="bg-slate-900 text-white">Kitap Eşleşmeleri</option>
              <option value="EXAM" className="bg-slate-900 text-white">Deneme Eşleşmeleri</option>
              <option value="NOT_MATCHED" className="bg-slate-900 text-white">Eşleşme Olmayanlar</option>
            </select>
          </div>

          <div className="flex items-center space-x-2 bg-slate-950/90 border border-slate-800 px-3.5 py-2 rounded-2xl shadow-sm">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Sırala:</span>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="NEWEST" className="bg-slate-900 text-white">Yeniden Eskiye</option>
              <option value="OLDEST" className="bg-slate-900 text-white">Eskiden Yeniye</option>
              <option value="PRIORITY_DESC" className="bg-slate-900 text-white">Öncelik (Yüksek - Düşük)</option>
              <option value="PRIORITY_ASC" className="bg-slate-900 text-white">Öncelik (Düşük - Yüksek)</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── AYRI KUTUCUK: ÖZEL KAYNAK FİLTRESİ AKTİF BİLGİ ALANI ── */}
      {filterExamId && (() => {
        const sourceName = getFilterSourceDisplayName(filterExamId);
        const count = topicErrors.filter(e => isErrorMatchingFilterSource(e, filterExamId)).length;
        return (
          <div className="bg-indigo-950/60 border border-indigo-500/40 p-4 sm:p-5 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xl backdrop-blur-md animate-fade-in">
            <div className="flex items-center space-x-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0 text-indigo-300 shadow-sm">
                <Filter className="w-5 h-5" />
              </div>
              <div className="min-w-0 space-y-0.5">
                <span className="text-[11px] font-black text-indigo-300 uppercase tracking-wider block">
                  📌 Özel Kaynak Filtresi Aktif:
                </span>
                <p className="text-sm sm:text-base font-extrabold text-white truncate">
                  {sourceName}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setFilterExamId(null)}
              className="bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-bold px-4 py-2.5 rounded-2xl transition-all cursor-pointer shadow-lg shadow-indigo-600/30 shrink-0 flex items-center justify-center space-x-2 self-start sm:self-auto"
            >
              <span>Filtreyi Temizle</span>
              <span className="bg-indigo-950/60 px-2 py-0.5 rounded-xl text-[11px] font-mono">
                {count} Soru
              </span>
            </button>
          </div>
        );
      })()}

      {filteredErrors.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/60 rounded-3xl border border-slate-800 space-y-3 shadow-xl">
          <div className="w-14 h-14 rounded-3xl bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto text-slate-500">
            <BookOpen className="w-7 h-7" />
          </div>
          <h3 className="text-sm font-bold text-white">Seçilen Görünümde Hata Kaydı Bulunmuyor</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Hata Defterinize henüz soru eklenmemiş veya uygulanan filtrelerle eşleşen kayıt bulunamadı.
          </p>
          <button
            type="button"
            onClick={() => openAddErrorModal()}
            className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer shadow-md mt-2"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>+ İlk Hata Kaydını Ekle</span>
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* ── 📊 TABLO GÖRÜNÜMÜ (DATA GRID) ── */
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl shadow-xl backdrop-blur-md overflow-hidden animate-fade-in">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs text-slate-300 min-w-[880px]">
              <thead className="bg-slate-950/90 text-slate-400 uppercase text-[10px] font-black tracking-wider border-b border-slate-800">
                <tr>
                  <th scope="col" className="py-4 px-4 w-16 text-center">Görsel</th>
                  <th scope="col" className="py-4 px-4 min-w-[220px]">Ders & Konu</th>
                  <th scope="col" className="py-4 px-4 min-w-[160px]">Kaynak / Yayın</th>
                  <th scope="col" className="py-4 px-4 min-w-[140px]">Hata Sebebi</th>
                  <th scope="col" className="py-4 px-4 min-w-[130px]">Öncelik & Tarih</th>
                  <th scope="col" className="py-4 px-4 text-center min-w-[130px]">Tekrar Durumu</th>
                  <th scope="col" className="py-4 px-4 text-right min-w-[160px]">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredErrors.map((item) => {
                  const isRevised = !!item.revised;
                  const reasonColor = ERROR_REASON_COLORS[item.errorReason] || '#ef4444';
                  const reasonLabel = ERROR_REASON_LABELS[item.errorReason] || item.errorReason;
                  const isFading = !!fadingOutIds[item.id];
                  const subColor = SUBJECT_COLORS[item.subject] || '#6366f1';

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-indigo-500/5 transition-colors group ${
                        isRevised ? 'bg-emerald-950/10' : ''
                      } ${isFading ? 'opacity-30 filter blur-[1px]' : ''}`}
                    >
                      {/* 1. Görsel */}
                      <td className="py-3.5 px-4 text-center">
                        {item.imageUrl ? (
                          <div
                            onClick={() => openImagePreview(item.imageUrl!, `${item.subject} - ${item.topicName}`)}
                            className="w-11 h-11 rounded-2xl overflow-hidden border border-slate-700/80 bg-slate-950 mx-auto cursor-pointer relative group/img shadow-md hover:border-indigo-400 transition-all hover:scale-110"
                            title="Büyük görseli görüntüle"
                          >
                            <img
                              src={item.imageUrl}
                              alt={item.topicName}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-slate-950/50 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                              <Maximize2 className="w-3.5 h-3.5 text-white" />
                            </div>
                          </div>
                        ) : (
                          <div
                            onClick={() => openAddErrorModal(item)}
                            className="w-11 h-11 rounded-2xl border border-dashed border-slate-800 hover:border-indigo-500/50 bg-slate-950/60 mx-auto flex items-center justify-center text-slate-500 hover:text-indigo-400 cursor-pointer transition-colors shadow-inner"
                            title="Fotoğraf ekle"
                          >
                            <Camera className="w-4 h-4" />
                          </div>
                        )}
                      </td>

                      {/* 2. Ders & Konu */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1 min-w-0">
                          <span
                            className="text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider inline-block border"
                            style={{
                              backgroundColor: `${subColor}15`,
                              color: subColor,
                              borderColor: `${subColor}35`,
                            }}
                          >
                            {item.subject}
                          </span>
                          <p className="font-extrabold text-white text-xs leading-snug">
                            {item.topicName}
                          </p>
                          {item.solutionNotes && (
                            <p className="text-[11px] text-slate-400 line-clamp-1 italic">
                              "{item.solutionNotes}"
                            </p>
                          )}
                        </div>
                      </td>

                      {/* 3. Kaynak / Yayın */}
                      <td className="py-3.5 px-4">
                        {item.publisher ? (
                          <div className="flex flex-col gap-1">
                            <span className="font-semibold text-slate-200 text-xs flex items-center gap-1.5">
                              {isBookMatch(item) ? (
                                <BookOpen className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              ) : isExamMatch(item) ? (
                                <Target className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                              ) : null}
                              <span className="truncate max-w-[180px]">{item.publisher}</span>
                            </span>
                            {(isBookMatch(item) || isExamMatch(item)) && (
                              <button
                                type="button"
                                onClick={() => setFilterExamId(item.examId || item.publisher || null)}
                                className="text-[9.5px] text-indigo-400 hover:text-indigo-300 font-bold underline text-left cursor-pointer"
                              >
                                Bu Kaynağı Filtrele
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-500 text-[11px] italic">-</span>
                        )}
                      </td>

                      {/* 4. Hata Sebebi */}
                      <td className="py-3.5 px-4">
                        <span
                          className="text-[10px] px-2.5 py-1 rounded-xl font-bold uppercase tracking-wider inline-block shadow-sm"
                          style={{
                            backgroundColor: `${reasonColor}20`,
                            color: reasonColor,
                            border: `1px solid ${reasonColor}40`,
                          }}
                        >
                          {reasonLabel}
                        </span>
                      </td>

                      {/* 5. Öncelik & Tarih */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1.5">
                          {item.priority !== undefined ? (
                            renderPriorityBar(item.priority)
                          ) : (
                            <span className="text-slate-500 text-[10px] font-mono">-</span>
                          )}
                          {item.date && (
                            <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-500 shrink-0" />
                              <span>{formatCompactDisplayDate(item.date)}</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 6. Tekrar Durumu */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex flex-col items-center gap-1.5">
                          {/* Durum Rozeti (Salt Bilgi) */}
                          <span className={`px-2 py-0.5 rounded-lg text-[9.5px] font-bold border inline-flex items-center space-x-1 ${
                            isRevised
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                              : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                          }`}>
                            {isRevised ? (
                              <>
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                <span>Pekiştirildi</span>
                              </>
                            ) : (
                              <>
                                <Clock className="w-3 h-3 text-rose-400" />
                                <span>Tekrar Bekliyor</span>
                              </>
                            )}
                          </span>

                          {/* Onay Kutusu / Eylem Butonu (Checkbox) */}
                          <button
                            type="button"
                            disabled={revisingIds[item.id]}
                            onClick={() => handleToggleErrorRevision(item.id)}
                            className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all inline-flex items-center space-x-1.5 cursor-pointer shadow-sm border ${
                              isRevised
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                                : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-emerald-500/50 hover:text-emerald-300 hover:bg-emerald-950/30'
                            }`}
                            title={isRevised ? 'Pekiştirildi (Tekrar beklemeye almak için tıklayın)' : 'Bu soruyu pekiştirdiyseniz tıklayın'}
                          >
                            <div className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition-all ${
                              isRevised ? 'bg-emerald-500 border-emerald-400 text-white' : 'border-slate-500 bg-slate-900 text-transparent'
                            }`}>
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </div>
                            <span>{isRevised ? 'Pekiştirildi' : 'Pekiştirdim'}</span>
                          </button>

                          {/* Aşama / Tekrar Sayısı Rozeti */}
                          {(() => {
                            const info = getRepetitionStageInfo(item);
                            return (
                              <span className={`text-[9px] px-2 py-0.5 rounded-md border font-bold ${info.badgeClass}`}>
                                {info.shortLabel}
                              </span>
                            );
                          })()}
                        </div>
                      </td>

                      {/* 7. İşlemler */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {item.imageUrl && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleOpenSolveModal(item)}
                                className="p-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-xl transition-all cursor-pointer shadow-sm hover:scale-105"
                                title="Yapay Zeka Çözüm Rehberi"
                              >
                                <Brain className="w-3.5 h-3.5 text-purple-400" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenSimilarModal(item)}
                                className="p-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-xl transition-all cursor-pointer shadow-sm hover:scale-105"
                                title="Benzer Soru Üret"
                              >
                                <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
                              </button>
                            </>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setActiveAiErrorItem(item);
                              setAnalysisErrorMsg(null);
                            }}
                            className="p-2 bg-slate-800 hover:bg-purple-950/40 text-slate-300 hover:text-purple-300 border border-slate-700/80 hover:border-purple-500/40 rounded-xl transition-all cursor-pointer shadow-sm hover:scale-105"
                            title="Hata Analizi"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                          </button>

                          <button
                            type="button"
                            onClick={() => openAddErrorModal(item)}
                            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 rounded-xl transition-all cursor-pointer shadow-sm hover:scale-105"
                            title="Düzenle"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeletingItem({ type: 'error', id: item.id, title: `${item.subject} - ${item.topicName}` })}
                            className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl transition-all cursor-pointer shadow-sm hover:scale-105"
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
      ) : viewMode === 'gallery' ? (
        /* ── 🖼️ GÖRSEL GALERİ GÖRÜNÜMÜ (PINTEREST / INSTAGRAM GRID) ── */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4.5 animate-fade-in">
          {filteredErrors.map((item) => {
            const isRevised = !!item.revised;
            const isFading = !!fadingOutIds[item.id];
            const reasonColor = ERROR_REASON_COLORS[item.errorReason] || '#ef4444';
            const reasonLabel = ERROR_REASON_LABELS[item.errorReason] || item.errorReason;
            const subColor = SUBJECT_COLORS[item.subject] || '#6366f1';

            return (
              <div
                key={item.id}
                className={`bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 rounded-3xl overflow-hidden shadow-xl transition-all duration-300 flex flex-col justify-between group hover:shadow-2xl hover:scale-[1.015] backdrop-blur-md relative ${
                  isRevised ? 'border-emerald-500/30' : ''
                } ${isFading ? 'opacity-30 filter blur-[1px]' : ''}`}
              >
                {/* 1. Üst Görsel / Kapak Alanı */}
                <div className="aspect-[4/3] relative overflow-hidden bg-slate-950 flex items-center justify-center">
                  {item.imageUrl ? (
                    <>
                      <img
                        src={item.imageUrl}
                        alt={item.topicName}
                        className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500 cursor-pointer"
                        onClick={() => openImagePreview(item.imageUrl!, `${item.subject} - ${item.topicName}`)}
                      />
                      {/* Gradient Dark Vignette Overlay */}
                      <div
                        className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-transparent to-slate-950/60 pointer-events-none"
                      />
                      {/* Hover Zoom Overlay */}
                      <div
                        onClick={() => openImagePreview(item.imageUrl!, `${item.subject} - ${item.topicName}`)}
                        className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                      >
                        <div className="bg-slate-900/90 text-white text-[10px] font-bold px-3 py-1.5 rounded-xl border border-slate-700 shadow-xl flex items-center space-x-1.5 backdrop-blur-md">
                          <Maximize2 className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Tam Ekran İncele</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    /* Fotoğraf Yoksa: Özel Gradient Kart */
                    <div
                      onClick={() => openAddErrorModal(item)}
                      className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800/80 cursor-pointer group/nopic hover:bg-slate-900/80 transition-colors"
                      title="Bu soruya fotoğraf ekle"
                    >
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center border shadow-inner transition-transform group-hover/nopic:scale-110 mb-2"
                        style={{
                          backgroundColor: `${subColor}15`,
                          borderColor: `${subColor}30`,
                          color: subColor,
                        }}
                      >
                        <Camera className="w-6 h-6" />
                      </div>
                      <span className="text-[11px] font-bold text-slate-300">Fotoğraf Eklenmemiş</span>
                      <span className="text-[9.5px] text-indigo-400 font-semibold underline mt-0.5">+ Fotoğraf Ekle</span>
                    </div>
                  )}

                  {/* Üst Rozetler Satırı (Ders & Hata Sebebi) - Asla Üst Üste Binmez */}
                  <div className="absolute top-2.5 inset-x-2.5 z-10 flex items-center justify-between gap-1.5 pointer-events-none">
                    <span
                      className="text-[9.5px] font-black px-2 py-0.5 rounded-lg uppercase tracking-wider backdrop-blur-md border shadow-md truncate max-w-[48%] shrink"
                      style={{
                        backgroundColor: `${subColor}35`,
                        color: '#ffffff',
                        borderColor: `${subColor}60`,
                        textShadow: '0 1px 2px rgba(0,0,0,0.8)',
                      }}
                      title={item.subject}
                    >
                      {item.subject}
                    </span>

                    <span
                      className="text-[9px] px-2 py-0.5 rounded-lg font-extrabold uppercase tracking-wider backdrop-blur-md border shadow-md truncate max-w-[48%] shrink"
                      style={{
                        backgroundColor: `${reasonColor}40`,
                        color: '#ffffff',
                        borderColor: `${reasonColor}65`,
                        textShadow: '0 1px 2px rgba(0,0,0,0.8)',
                      }}
                      title={reasonLabel}
                    >
                      {reasonLabel}
                    </span>
                  </div>

                  {/* Sol Alt: Aralıklı Tekrar Sayısı / Aşama Rozeti */}
                  <div className="absolute bottom-2.5 left-2.5 z-10 pointer-events-none">
                    {(() => {
                      const info = getRepetitionStageInfo(item);
                      return (
                        <span className={`text-[9.5px] px-2 py-0.5 rounded-lg border backdrop-blur-md shadow-md flex items-center space-x-1 font-bold ${info.badgeClass}`}>
                          <span>{info.shortLabel}</span>
                        </span>
                      );
                    })()}
                  </div>

                  {/* Sağ Alt: Tekrar Durumu Rozeti (Salt Bilgi) */}
                  <div className="absolute bottom-2.5 right-2.5 z-10 pointer-events-none">
                    <span
                      className={`text-[9.5px] px-2 py-0.5 rounded-lg font-bold border backdrop-blur-md shadow-md flex items-center space-x-1 ${
                        isRevised
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      }`}
                    >
                      {isRevised ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>Pekiştirildi</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-3 h-3 text-rose-400" />
                          <span>Tekrar Bekliyor</span>
                        </>
                      )}
                    </span>
                  </div>
                </div>

                {/* 2. Kart Gövdesi & Detayları */}
                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <h4
                      className="text-sm font-extrabold text-white leading-snug line-clamp-2"
                      title={item.topicName}
                    >
                      {item.topicName}
                    </h4>

                    {/* Kaynak / Yayın & Tarih */}
                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                      {item.publisher ? (
                        <span className="font-semibold text-slate-300 truncate max-w-[140px] flex items-center gap-1">
                          {isBookMatch(item) ? (
                            <BookOpen className="w-3 h-3 text-emerald-400 shrink-0" />
                          ) : isExamMatch(item) ? (
                            <Target className="w-3 h-3 text-indigo-400 shrink-0" />
                          ) : null}
                          <span className="truncate">{item.publisher}</span>
                        </span>
                      ) : (
                        <span className="text-slate-500 italic">Kaynak Yok</span>
                      )}

                      {item.date && (
                        <span className="text-[10px] text-slate-400 font-mono shrink-0">
                          {formatCompactDisplayDate(item.date)}
                        </span>
                      )}
                    </div>

                    {/* Varsa Hata Notu */}
                    {item.solutionNotes && (
                      <p className="text-[11px] text-slate-300 bg-slate-950/70 p-2 rounded-xl border border-white/5 line-clamp-2 italic">
                        "{item.solutionNotes}"
                      </p>
                    )}
                  </div>

                  {/* 3. Kart Alt Aksiyon Butonları */}
                  <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between gap-1.5">
                    {/* Sol Taraf: Onay Kutusu / Eylem Butonu (Checkbox) */}
                    <button
                      type="button"
                      disabled={revisingIds[item.id]}
                      onClick={() => handleToggleErrorRevision(item.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 border shadow-sm ${
                        isRevised
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                          : 'bg-slate-800 hover:bg-emerald-950/40 text-slate-300 hover:text-emerald-300 border-slate-700/80 hover:border-emerald-500/40'
                      }`}
                      title={isRevised ? 'Pekiştirildi (Tekrar beklemeye almak için tıklayın)' : 'Bu soruyu pekiştirdiyseniz tıklayın'}
                    >
                      <div className={`w-4 h-4 rounded-md flex items-center justify-center border transition-all ${
                        isRevised ? 'bg-emerald-500 border-emerald-400 text-white' : 'border-slate-500 bg-slate-900/80 text-transparent'
                      }`}>
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                      <span>{isRevised ? 'Pekiştirildi' : 'Pekiştirdim'}</span>
                    </button>

                    {/* Sağ Taraf: Düzenle ve Sil */}
                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => openAddErrorModal(item)}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 rounded-xl transition-all cursor-pointer shadow-sm hover:scale-105"
                        title="Düzenle"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeletingItem({ type: 'error', id: item.id, title: `${item.subject} - ${item.topicName}` })}
                        className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl transition-all cursor-pointer shadow-sm hover:scale-105"
                        title="Sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ── 📑 LİSTE GÖRÜNÜMÜ (ZENGİN KART AKIŞI) ── */
        <div className="space-y-4">
          {filteredErrors.map((item) => {
            const isRevised = !!item.revised;
            const isFading = !!fadingOutIds[item.id];
            const reasonColor = ERROR_REASON_COLORS[item.errorReason] || '#ef4444';
            const reasonLabel = ERROR_REASON_LABELS[item.errorReason] || item.errorReason;

            return (
              <div 
                key={item.id} 
                className={`bg-slate-900/90 border border-slate-800 hover:border-indigo-500/40 rounded-3xl p-5 shadow-xl transition-all space-y-4 relative overflow-hidden backdrop-blur-md ${
                  isRevised ? 'opacity-85 border-emerald-500/30' : ''
                } ${
                  isFading ? 'opacity-30 scale-98 filter blur-[1px]' : ''
                }`}
              >
                {/* Top Row: Subject Badge, Reason, Priority & Controls */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-black text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded-lg uppercase tracking-wider">
                        {item.subject}
                      </span>
                      <span className="text-[10px] px-2.5 py-0.5 rounded-lg font-bold uppercase tracking-wider shadow-sm" style={{ backgroundColor: `${reasonColor}20`, color: reasonColor, border: `1px solid ${reasonColor}40` }}>
                        {reasonLabel}
                      </span>
                      {item.priority !== undefined && renderPriorityBar(item.priority)}

                      {/* Durum Rozeti (Salt Bilgi) */}
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-lg font-bold border flex items-center space-x-1 shadow-sm ${
                        isRevised
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                          : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                      }`}>
                        {isRevised ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>Pekiştirildi</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3 text-rose-400" />
                            <span>Tekrar Bekliyor</span>
                          </>
                        )}
                      </span>

                      {/* Eklenme Tarihi Rozeti */}
                      {item.date && (
                        <span className="text-[10px] px-2 py-0.5 rounded-lg font-bold bg-slate-800/90 text-slate-300 border border-slate-700/80 flex items-center space-x-1" title={`Eklenme Tarihi: ${formatDisplayDate(item.date)}`}>
                          <Calendar className="w-3 h-3 text-indigo-400 shrink-0" />
                          <span>{formatCompactDisplayDate(item.date)}</span>
                        </span>
                      )}

                      {/* Aralıklı Tekrar Durum Rozeti (Tüm Sorularda) */}
                      {(() => {
                        const info = getRepetitionStageInfo(item);
                        return (
                          <span className={`text-[10px] px-2 py-0.5 rounded-lg border font-bold flex items-center space-x-1 shadow-sm ${info.badgeClass}`}>
                            <span>{info.label}</span>
                          </span>
                        );
                      })()}
                    </div>
                    <h3 className="text-base font-extrabold text-white leading-snug tracking-tight">
                      {item.topicName}
                    </h3>
                    <div className="text-xs text-slate-400 font-medium flex items-center gap-2 flex-wrap pt-0.5">
                      {item.date && (
                        <span className="text-slate-300 font-semibold flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-indigo-400 shrink-0" />
                          <span>Eklenme: {formatCompactDisplayDate(item.date)}</span>
                        </span>
                      )}
                      {item.publisher && (
                        <span>• Kaynak / Yayın: <span className="text-slate-200 font-bold">{item.publisher}</span></span>
                      )}
                      {isBookMatch(item) && (
                        <button
                          type="button"
                          onClick={() => setFilterExamId(item.examId || item.publisher || null)}
                          className="inline-flex items-center space-x-1.5 text-[10px] bg-emerald-500/15 hover:bg-emerald-500/30 active:bg-emerald-500/40 text-emerald-300 border border-emerald-500/30 hover:border-emerald-500/60 px-2.5 py-0.5 rounded-lg font-bold transition-all cursor-pointer shadow-sm hover:scale-105"
                          title={`"${item.publisher}" kitabına ait tüm hataları filtrele`}
                        >
                          <span>📖 Kitap Eşleşmeli</span>
                          <Filter className="w-3 h-3 text-emerald-400" />
                        </button>
                      )}
                      {isExamMatch(item) && (
                        <button
                          type="button"
                          onClick={() => setFilterExamId(item.examId || item.publisher || null)}
                          className="inline-flex items-center space-x-1.5 text-[10px] bg-indigo-500/15 hover:bg-indigo-500/30 active:bg-indigo-500/40 text-indigo-300 border border-indigo-500/30 hover:border-indigo-500/60 px-2.5 py-0.5 rounded-lg font-bold transition-all cursor-pointer shadow-sm hover:scale-105"
                          title={`"${item.publisher}" denemesine ait tüm hataları filtrele`}
                        >
                          <span>🎯 Deneme Eşleşmeli</span>
                          <Filter className="w-3 h-3 text-indigo-400" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Actions: Edit & Delete */}
                  <div className="flex items-center space-x-1 shrink-0 self-end sm:self-start bg-slate-950 p-1 rounded-2xl border border-slate-800">
                    <button
                      type="button"
                      onClick={() => openAddErrorModal(item)}
                      className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-slate-900 rounded-xl transition-colors cursor-pointer"
                      title="Hata Kaydını Düzenle"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingItem({ type: 'error', id: item.id, title: `${item.subject} - ${item.topicName}` })}
                      className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded-xl transition-colors cursor-pointer"
                      title="Sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Soru Görseli Varsa: Görsel & AI Destek Araçları Panel */}
                {item.imageUrl && (
                  <div className="flex flex-col sm:flex-row items-start gap-4 bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800">
                    <div className="relative group rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 shrink-0 w-32 h-28 sm:w-40 sm:h-32 shadow-md">
                      <img 
                        src={item.imageUrl} 
                        alt={item.topicName} 
                        className="w-full h-full object-cover cursor-pointer group-hover:scale-105 transition-transform duration-300"
                        onClick={() => openImagePreview(item.imageUrl!, `${item.subject} - ${item.topicName}`)}
                      />
                      <div 
                        className="absolute inset-0 bg-slate-950/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                        onClick={() => openImagePreview(item.imageUrl!, `${item.subject} - ${item.topicName}`)}
                      >
                        <div className="bg-slate-900/90 text-white text-[10px] font-bold px-2.5 py-1 rounded-xl border border-slate-700 shadow-lg flex items-center space-x-1.5">
                          <Maximize2 className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Görseli Büyüt</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 flex-1 min-w-0 justify-center">
                      <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider flex items-center space-x-1">
                        <Sparkles className="w-3 h-3 text-purple-400" />
                        <span>Yapay Zeka Destek Araçları</span>
                      </span>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenSolveModal(item)}
                          className="px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 shadow-sm"
                        >
                          <Brain className="w-3.5 h-3.5 text-purple-400" />
                          <span>Çözüm Rehberi</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenSimilarModal(item)}
                          className="px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 shadow-sm"
                        >
                          <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Benzer Soru Oluştur</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenQuestionReport(item)}
                          className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 shadow-sm"
                        >
                          <FileText className="w-3.5 h-3.5 text-amber-400" />
                          <span>{item.aiAnalysis ? 'Soru Karnesi' : 'Soru Karnesi Oluştur'}</span>
                        </button>

                        {onStartRepetitionSession && (
                          <button
                            type="button"
                            onClick={() => onStartRepetitionSession([item])}
                            className="px-3 py-1.5 bg-gradient-to-r from-purple-600/80 to-indigo-600/80 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 shadow-sm"
                            title="Bu soruyu kör tekrar moduyla çöz"
                          >
                            <Play className="w-3 h-3 text-purple-200" />
                            <span>Kör Tekrar Et</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Soru Görseli Yoksa: Fotoğraf Ekleme & Bilgi Paneli */}
                {!item.imageUrl && (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-950/60 p-3.5 rounded-2xl border border-dashed border-slate-800 hover:border-indigo-500/40 transition-all">
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                        <Camera className="w-4 h-4 text-slate-400" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-slate-300 truncate">Fotoğraf Eklenmemiş</span>
                          <span className="text-[9px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700 font-semibold shrink-0">
                            Aralıklı Tekrar Pasif
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Soru fotoğrafı ekleyerek bu hatayı aralıklı tekrar sistemine ve yapay zeka çözümlerine dahil edebilirsiniz.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => openAddErrorModal(item)}
                      className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 hover:border-indigo-500/50 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm hover:scale-102 shrink-0"
                      title="Bu soruya fotoğraf eklemek için düzenleme penceresini aç"
                    >
                      <Camera className="w-3.5 h-3.5 text-indigo-400" />
                      <span>+ Soru Fotoğrafı Ekle</span>
                    </button>
                  </div>
                )}

                {/* Hata Notu (İnline Düzenlenebilir) */}
                {inlineEditingErrorId === item.id ? (
                  <div className="bg-slate-950 p-3 rounded-2xl border border-indigo-500/50 space-y-2 animate-fade-in shadow-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Edit2 className="w-3 h-3" />
                        <span>Hata Notunu Düzenle</span>
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">Enter: Kaydet | Esc: İptal</span>
                    </div>
                    <textarea
                      rows={2}
                      value={inlineNotesText}
                      onChange={(e) => setInlineNotesText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSaveInlineNote(item);
                        } else if (e.key === 'Escape') {
                          setInlineEditingErrorId(null);
                        }
                      }}
                      className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium transition-colors resize-y"
                      placeholder="Hata veya çözüm notu yazın..."
                      autoFocus
                    />
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        type="button"
                        onClick={() => setInlineEditingErrorId(null)}
                        className="px-2.5 py-1 text-slate-400 hover:text-white text-[11px] font-semibold transition-colors cursor-pointer rounded-lg hover:bg-slate-900"
                      >
                        İptal
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveInlineNote(item)}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold px-3 py-1 rounded-lg transition-all shrink-0 cursor-pointer shadow-sm"
                      >
                        Kaydet
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => {
                      setInlineEditingErrorId(item.id);
                      setInlineNotesText(item.solutionNotes || '');
                    }}
                    className="bg-slate-950/70 hover:bg-slate-950 border border-slate-800/80 hover:border-indigo-500/40 px-3.5 py-2.5 rounded-2xl cursor-pointer transition-all flex items-center justify-between group/note shadow-sm"
                    title="Hata notunu düzenlemek için tıklayın"
                  >
                    <div className="text-xs flex items-center gap-1.5 min-w-0 flex-1 flex-wrap">
                      <span className="text-[11px] font-bold text-slate-400 group-hover/note:text-indigo-400 shrink-0 transition-colors">
                        Hata Notu:
                      </span>
                      <span className={`font-medium break-words ${item.solutionNotes ? 'text-slate-200' : 'text-slate-500 italic'}`}>
                        {item.solutionNotes || 'Not eklemek için tıklayın...'}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 group-hover/note:text-indigo-400 flex items-center gap-1 opacity-0 group-hover/note:opacity-100 transition-all font-medium shrink-0 ml-2">
                      <Edit2 className="w-3 h-3" />
                      <span>Düzenle</span>
                    </span>
                  </div>
                )}

                {/* Alt Aksiyon Butonları */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/60">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveAiErrorItem(item);
                        setAnalysisErrorMsg(null);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 shadow-sm border ${
                        item.aiFeedback
                          ? 'bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border-purple-500/40'
                          : 'bg-slate-900 hover:bg-purple-950/40 text-slate-400 hover:text-purple-300 border-slate-800 hover:border-purple-500/30'
                      }`}
                      title="Yapay Zeka Hata Analizi ve Koçluk Tavsiyesi"
                    >
                      <Sparkles className={`w-3.5 h-3.5 ${item.aiFeedback ? 'text-purple-400' : 'text-slate-500'}`} />
                      <span>Hata Analizi</span>
                      {!item.aiFeedback && (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenTipModal(item.subject, item.topicName)}
                      className="px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 shadow-sm"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Konu İpucu</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    disabled={revisingIds[item.id]}
                    onClick={() => handleToggleErrorRevision(item.id)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer shadow-md border ${
                      isRevised
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                        : 'bg-slate-800 hover:bg-emerald-950/40 text-slate-300 hover:text-emerald-300 border-slate-700 hover:border-emerald-500/50'
                    }`}
                    title={isRevised ? 'Pekiştirildi (Tekrar beklemeye almak için tıklayın)' : 'Bu soruyu pekiştirdiyseniz tıklayın'}
                  >
                    <div className={`w-4 h-4 rounded-md flex items-center justify-center border transition-all ${
                      isRevised ? 'bg-emerald-500 border-emerald-400 text-white' : 'border-slate-500 bg-slate-900 text-transparent'
                    }`}>
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                    <span>{isRevised ? 'Pekiştirildi' : 'Pekiştirdim'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Hata Analizi (Kayıtlı veya Talep Üzerine Analiz) */}
      {activeAiErrorItem && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 z-[100] bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={(e) => { if (e.target === e.currentTarget && !isAnalyzingActiveError) setActiveAiErrorItem(null); }}
        >
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-5 sm:p-6 shadow-2xl space-y-4 animate-fade-in max-h-[90vh] overflow-y-auto custom-scrollbar my-auto modal-dialog-card">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl text-white shadow-lg shadow-purple-600/30">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-white">{activeAiErrorItem.topicName}</h3>
                  <div className="flex items-center space-x-2 mt-0.5">
                    <span className="text-[10px] text-purple-400 font-bold uppercase">{activeAiErrorItem.subject}</span>
                    {activeAiErrorItem.publisher && (
                      <>
                        <span className="text-slate-600 text-xs">•</span>
                        <span className="text-[10px] text-slate-400 font-medium">{activeAiErrorItem.publisher}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <button 
                type="button" 
                disabled={isAnalyzingActiveError}
                onClick={() => setActiveAiErrorItem(null)}
                className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Meta Badges & Priority Progress Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-950/70 rounded-2xl border border-slate-800 text-xs">
              <div className="flex items-center space-x-2">
                <span className="text-slate-400 font-bold text-[11px]">Hata Nedeni:</span>
                <span className={`px-2.5 py-1 rounded-xl font-bold text-[11px] border ${ERROR_REASON_COLORS[activeAiErrorItem.errorReason] || 'bg-slate-800 text-slate-300 border-slate-700'}`}>
                  {ERROR_REASON_LABELS[activeAiErrorItem.errorReason] || activeAiErrorItem.errorReason}
                </span>
              </div>

              {activeAiErrorItem.priority !== undefined && (() => {
                let val = parseInt(activeAiErrorItem.priority as any, 10);
                if (isNaN(val)) {
                  val = activeAiErrorItem.priority === 'high' ? 9 : activeAiErrorItem.priority === 'low' ? 3 : 6;
                }
                const pct = Math.min(100, Math.max(10, (val / 10) * 100));
                const barGradient = val >= 8 ? 'from-rose-500 to-red-600' : val >= 5 ? 'from-amber-500 to-orange-500' : 'from-indigo-500 to-blue-600';
                const textColor = val >= 8 ? 'text-rose-400' : val >= 5 ? 'text-amber-400' : 'text-indigo-400';
                const labelText = val >= 8 ? 'Kritik Öncelik' : val >= 5 ? 'Orta Öncelik' : 'Düşük Öncelik';

                return (
                  <div className="flex items-center space-x-3 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-xl ml-auto">
                    <div className="flex flex-col text-right">
                      <span className="text-[9.5px] uppercase tracking-wider text-slate-400 font-bold">{labelText}</span>
                      <span className={`text-xs font-black font-mono ${textColor}`}>
                        {val} <span className="text-[10px] text-slate-400 font-normal">/ 10</span>
                      </span>
                    </div>
                    <div className="w-24 sm:w-28 h-2.5 bg-slate-800/90 rounded-full overflow-hidden p-0.5 border border-slate-700/50 shrink-0">
                      <div 
                        className={`h-full bg-gradient-to-r ${barGradient} rounded-full transition-all duration-500 shadow-sm`} 
                        style={{ width: `${pct}%` }} 
                      />
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* CASE A: Analysis Exists */}
            {activeAiErrorItem.aiFeedback ? (
              <div className="space-y-4">
                <div className="p-4 bg-indigo-950/30 border border-indigo-500/25 rounded-2xl space-y-2 text-xs leading-relaxed">
                  <div className="text-slate-200 whitespace-pre-line font-medium leading-relaxed">
                    {activeAiErrorItem.aiFeedback}
                  </div>
                </div>

                {analysisErrorMsg && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300">
                    {analysisErrorMsg}
                  </div>
                )}

                <div className="flex justify-end pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setActiveAiErrorItem(null)}
                    className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-lg shadow-purple-600/25"
                  >
                    Kapat
                  </button>
                </div>
              </div>
            ) : (
              /* CASE B: No Analysis Yet (Empty State with Button) */
              <div className="py-6 text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-3xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shadow-inner">
                  <Bot className="w-8 h-8" />
                </div>
                
                <div className="space-y-1.5 max-w-md mx-auto">
                  <h4 className="text-sm font-bold text-white">Henüz Yapay Zeka Hata Analizi Alınmamış</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Bu sorunun kaynak yayın bilgisi, konu kazanımı ve hata türüne göre ÖSYM sınav ağırlığını, hata teşhisini ve çalışma tavsiyesini içeren detaylı koçluk analizini tek tıkla oluşturabilirsiniz.
                  </p>
                </div>

                {analysisErrorMsg && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 max-w-md mx-auto">
                    {analysisErrorMsg}
                  </div>
                )}

                <div className="pt-2 flex justify-center">
                  <button
                    type="button"
                    disabled={isAnalyzingActiveError}
                    onClick={() => handleRunAiAnalysis(activeAiErrorItem)}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-2xl text-xs font-black transition-all cursor-pointer shadow-xl shadow-purple-600/30 flex items-center space-x-2 disabled:opacity-50"
                  >
                    {isAnalyzingActiveError ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Yapay Zeka Analizi Yapılıyor...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-amber-300" />
                        <span>🤖 Yapay Zeka Hata Analizi Yap</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
