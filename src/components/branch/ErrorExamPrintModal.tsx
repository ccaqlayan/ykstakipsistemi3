import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Printer, 
  X, 
  FileText, 
  CheckSquare, 
  Square, 
  Settings2, 
  Sparkles, 
  Filter, 
  BookOpen, 
  Target, 
  Layers, 
  Eye, 
  HelpCircle, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  RotateCcw, 
  Download, 
  LayoutGrid, 
  Columns, 
  Check, 
  Search,
  Shuffle,
  AlertTriangle,
  Calendar,
  Award
} from 'lucide-react';
import { TopicErrorItem, UserAccount } from '../../types';
import { 
  getTodayDateString, 
  formatDisplayDate, 
  formatCompactDisplayDate 
} from '../../utils/dateUtils';
import { 
  isQuestionDue, 
  getUserRepetitionIntervals, 
  getIncludeRevisedInRepetition,
  extractOptionLetter 
} from '../../services/spacedRepetition';

interface ErrorExamPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  topicErrors: TopicErrorItem[];
  currentUser?: UserAccount | null;
  defaultInstitutionName?: string;
}

export const ErrorExamPrintModal: React.FC<ErrorExamPrintModalProps> = ({
  isOpen,
  onClose,
  topicErrors,
  currentUser,
  defaultInstitutionName = 'YKS Hazırlık & Takip Sistemi'
}) => {
  // ── FILTER STATES ──
  const [statusFilter, setStatusFilter] = useState<'all' | 'unrevised' | 'revised'>('unrevised');
  const [onlyDueFilter, setOnlyDueFilter] = useState<boolean>(false);
  const [subjectFilter, setSubjectFilter] = useState<string>('ALL');
  const [onlyPhotosFilter, setOnlyPhotosFilter] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeSidebarTab, setActiveSidebarTab] = useState<'select' | 'options'>('select');

  // ── SELECTION STATE ──
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // ── BOOKLET CUSTOMIZATION STATES ──
  const todayFormatted = formatCompactDisplayDate(getTodayDateString());
  const [testTitle, setTestTitle] = useState<string>(`YKS Hata Tekrar Testi - ${todayFormatted}`);
  const [institutionName, setInstitutionName] = useState<string>(defaultInstitutionName);
  const [studentName, setStudentName] = useState<string>(currentUser?.name || 'YKS Adayı');
  const [layoutMode, setLayoutMode] = useState<'2cols' | '1col'>('2cols');
  const [solutionAreaSize, setSolutionAreaSize] = useState<'none' | 'compact' | 'normal' | 'large'>('normal');
  const [includeAnswerKey, setIncludeAnswerKey] = useState<boolean>(true);
  const [includeOpticalBubbles, setIncludeOpticalBubbles] = useState<boolean>(true);
  const [includeTopicMeta, setIncludeTopicMeta] = useState<boolean>(true);
  const [includeErrorReason, setIncludeErrorReason] = useState<boolean>(false);

  // ── DERIVED LISTS ──
  const intervals = getUserRepetitionIntervals();
  const incRev = getIncludeRevisedInRepetition();
  const todayStr = getTodayDateString();

  // Tüm benzersiz dersler
  const availableSubjects = useMemo(() => {
    const subs = new Set<string>();
    topicErrors.forEach(e => {
      if (e.subject) subs.add(e.subject);
    });
    return Array.from(subs).sort();
  }, [topicErrors]);

  // Filtrelenmiş soru havuzu
  const filteredQuestions = useMemo(() => {
    return topicErrors.filter(item => {
      // 1. Fotoğraf filtresi
      if (onlyPhotosFilter && (!item.imageUrl || item.imageUrl.trim() === '')) {
        return false;
      }

      // 2. Durum filtresi (Pekiştirildi / Bekliyor)
      if (statusFilter === 'unrevised' && item.revised) return false;
      if (statusFilter === 'revised' && !item.revised) return false;

      // 3. Tekrar zamanı gelenler filtresi (Due)
      if (onlyDueFilter && !isQuestionDue(item, intervals, todayStr, incRev)) {
        return false;
      }

      // 4. Ders filtresi
      if (subjectFilter !== 'ALL' && item.subject !== subjectFilter) {
        return false;
      }

      // 5. Arama metni
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const sub = (item.subject || '').toLowerCase();
        const top = (item.topicName || '').toLowerCase();
        const pub = (item.publisher || '').toLowerCase();
        const note = (item.solutionNotes || '').toLowerCase();
        if (!sub.includes(q) && !top.includes(q) && !pub.includes(q) && !note.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [topicErrors, onlyPhotosFilter, statusFilter, onlyDueFilter, subjectFilter, searchQuery, intervals, todayStr, incRev]);

  // Modal ilk açıldığında filtrelenen soruları varsayılan olarak seç
  useEffect(() => {
    if (isOpen) {
      const initialSet = new Set<string>();
      filteredQuestions.slice(0, 20).forEach(q => initialSet.add(q.id));
      setSelectedIds(initialSet);
    }
  }, [isOpen]);

  // Seçili sorular listesi (Sıralı)
  const selectedQuestions = useMemo(() => {
    return topicErrors.filter(item => selectedIds.has(item.id));
  }, [topicErrors, selectedIds]);

  if (!isOpen) return null;

  // ── SELECTION HANDLERS ──
  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAllFiltered = () => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      filteredQuestions.forEach(q => next.add(q.id));
      return next;
    });
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleSelectRandom = (count: number) => {
    const shuffled = [...filteredQuestions].sort(() => 0.5 - Math.random());
    const picked = shuffled.slice(0, count);
    const next = new Set<string>();
    picked.forEach(q => next.add(q.id));
    setSelectedIds(next);
  };

  // ── PRINT HANDLER (ISOLATED 1:1 IFRAME MOTORU) ──
  const handleTriggerPrint = () => {
    const printDoc = document.getElementById('error-exam-print-document');
    if (!printDoc) {
      window.print();
      return;
    }

    // Varsa eski iframe'i kaldır
    const oldIframe = document.getElementById('error-exam-print-iframe');
    if (oldIframe) oldIframe.remove();

    // Yeni gizli iframe oluştur
    const iframe = document.createElement('iframe');
    iframe.id = 'error-exam-print-iframe';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const pri = iframe.contentWindow;
    if (!pri) {
      window.print();
      return;
    }

    // Mevcut stilleri topla
    let styleHtml = '';
    document.querySelectorAll('style, link[rel="stylesheet"]').forEach((node) => {
      styleHtml += node.outerHTML;
    });

    pri.document.open();
    pri.document.write(`
      <!DOCTYPE html>
      <html lang="tr">
        <head>
          <meta charset="utf-8" />
          <title>${testTitle} - ${studentName}</title>
          ${styleHtml}
          <style>
            @page {
              size: A4 portrait;
              margin: 10mm 10mm 12mm 10mm;
            }
            body {
              background-color: #ffffff !important;
              background: #ffffff !important;
              color: #000000 !important;
              margin: 0 !important;
              padding: 0 !important;
              font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .no-print { display: none !important; }
            .print-avoid-break {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            .print-page-break {
              page-break-before: always !important;
              break-before: page !important;
            }
            img {
              max-width: 100% !important;
              height: auto !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          </style>
        </head>
        <body class="bg-white text-black p-0 m-0">
          ${printDoc.innerHTML}
        </body>
      </html>
    `);
    pri.document.close();

    setTimeout(() => {
      pri.focus();
      pri.print();
    }, 450);
  };

  const modalContent = (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex flex-col items-center justify-between p-2 sm:p-4 select-none overflow-hidden animate-fade-in">
      
      {/* ── 1. MODAL TOP HEADER ── */}
      <div className="w-full max-w-7xl bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl p-3 sm:p-4 shadow-2xl flex flex-wrap items-center justify-between gap-3 shrink-0 z-20">
        
        {/* Sol Başlık & Sayaç */}
        <div className="flex items-center space-x-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 shrink-0">
            <Printer className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-2 flex-wrap">
              <h2 className="text-sm sm:text-base font-black text-white truncate">
                Özel Hata Tekrar Testi & Çıktı Alma
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                {selectedQuestions.length} Soru Seçildi
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate">
              Hatalarından özel test kitapçığı oluştur, A4 formatında çıktı al veya PDF olarak kaydet.
            </p>
          </div>
        </div>

        {/* Sağ Butonlar */}
        <div className="flex items-center space-x-2 shrink-0">
          <button
            type="button"
            onClick={handleTriggerPrint}
            disabled={selectedQuestions.length === 0}
            className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-black rounded-xl transition-all shadow-lg shadow-emerald-600/30 flex items-center space-x-2 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Yazdır / PDF Olarak Kaydet</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-all cursor-pointer"
            title="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

      </div>

      {/* ── 2. MODAL MAIN BODY (SOL PANEL: FİLTRE & AYARLAR, SAĞ PANEL: CANLI A4 ÖNİZLEME) ── */}
      <div className="w-full max-w-7xl flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 overflow-hidden mt-3">
        
        {/* ── SOL SÜTUN (KONTROL & AYARLAR PANELİ) (lg:col-span-4) ── */}
        <div className="lg:col-span-4 bg-slate-900/95 border border-slate-800 rounded-3xl p-3 sm:p-4 flex flex-col justify-between overflow-hidden shadow-xl space-y-3">
          
          {/* Tab Switcher: Soru Seçimi vs Kitapçık Ayarları */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950/80 border border-slate-800 rounded-2xl shrink-0">
            <button
              type="button"
              onClick={() => setActiveSidebarTab('select')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
                activeSidebarTab === 'select'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Soru Seçimi ({selectedQuestions.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSidebarTab('options')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
                activeSidebarTab === 'options'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span>Kitapçık Ayarları</span>
            </button>
          </div>

          {/* TAB 1: SORU SEÇİMİ */}
          {activeSidebarTab === 'select' && (
            <div className="flex-1 flex flex-col min-h-0 space-y-2.5 overflow-hidden">
              
              {/* Filtre Kontrolleri */}
              <div className="space-y-2 shrink-0 bg-slate-950/50 p-2.5 rounded-2xl border border-slate-800/80">
                {/* Durum Filtre Butonları */}
                <div className="grid grid-cols-3 gap-1">
                  <button
                    type="button"
                    onClick={() => setStatusFilter('unrevised')}
                    className={`py-1 px-1.5 rounded-lg text-[10.5px] font-bold transition-all truncate text-center cursor-pointer ${
                      statusFilter === 'unrevised'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    ⏳ Bekleyenler
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('revised')}
                    className={`py-1 px-1.5 rounded-lg text-[10.5px] font-bold transition-all truncate text-center cursor-pointer ${
                      statusFilter === 'revised'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    ✓ Pekiştirilenler
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('all')}
                    className={`py-1 px-1.5 rounded-lg text-[10.5px] font-bold transition-all truncate text-center cursor-pointer ${
                      statusFilter === 'all'
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    🌟 Tümü
                  </button>
                </div>

                {/* Ders Seçici & Arama */}
                <div className="grid grid-cols-2 gap-1.5">
                  <select
                    value={subjectFilter}
                    onChange={(e) => setSubjectFilter(e.target.value)}
                    className="bg-slate-900 border border-slate-700/80 rounded-xl px-2 py-1.5 text-xs text-slate-200 font-bold focus:outline-none focus:border-indigo-400"
                  >
                    <option value="ALL">📚 Tüm Dersler</option>
                    {availableSubjects.map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>

                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Konu / kaynak ara..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-6 pr-2 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400"
                    />
                    <Search className="w-3 h-3 text-slate-500 absolute left-2 top-2.5" />
                  </div>
                </div>

                {/* Ek Toggle Filtreler */}
                <div className="flex items-center justify-between text-[11px] pt-1">
                  <label className="flex items-center space-x-1.5 text-slate-300 cursor-pointer font-medium">
                    <input
                      type="checkbox"
                      checked={onlyDueFilter}
                      onChange={(e) => setOnlyDueFilter(e.target.checked)}
                      className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0 cursor-pointer"
                    />
                    <span>Sadece Bugün Tekrarı Olanlar</span>
                  </label>

                  <label className="flex items-center space-x-1.5 text-slate-300 cursor-pointer font-medium">
                    <input
                      type="checkbox"
                      checked={onlyPhotosFilter}
                      onChange={(e) => setOnlyPhotosFilter(e.target.checked)}
                      className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0 cursor-pointer"
                    />
                    <span>Görselli Sorular</span>
                  </label>
                </div>
              </div>

              {/* Hızlı Seçim Aksiyonları */}
              <div className="flex items-center justify-between text-xs text-slate-400 shrink-0 px-1">
                <span className="font-bold text-white text-[11px]">
                  Bulunan: {filteredQuestions.length} Soru
                </span>
                <div className="flex items-center space-x-1.5">
                  <button
                    type="button"
                    onClick={handleSelectAllFiltered}
                    className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold underline cursor-pointer"
                  >
                    Tümünü Seç
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={handleClearSelection}
                    className="text-[10px] text-rose-400 hover:text-rose-300 font-bold underline cursor-pointer"
                  >
                    Temizle
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => handleSelectRandom(10)}
                    className="text-[10px] text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer flex items-center space-x-0.5"
                    title="Rastgele 10 Soru Seç"
                  >
                    <Shuffle className="w-2.5 h-2.5 inline" />
                    <span>Rastgele 10</span>
                  </button>
                </div>
              </div>

              {/* Scroll Edilebilir Soru Listesi (Checkbox'lı) */}
              <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar min-h-0">
                {filteredQuestions.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 text-xs">
                    Filtrelere uygun soru bulunamadı.
                  </div>
                ) : (
                  filteredQuestions.map((item) => {
                    const isSelected = selectedIds.has(item.id);
                    return (
                      <div
                        key={item.id}
                        onClick={() => handleToggleSelect(item.id)}
                        className={`p-2 rounded-2xl border transition-all cursor-pointer flex items-center space-x-2.5 ${
                          isSelected
                            ? 'bg-indigo-950/40 border-indigo-500/50 shadow-sm'
                            : 'bg-slate-950/40 border-slate-800/80 hover:bg-slate-850 hover:border-slate-700'
                        }`}
                      >
                        {/* Checkbox */}
                        <div className={`w-4 h-4 rounded-md flex items-center justify-center border shrink-0 transition-all ${
                          isSelected
                            ? 'bg-indigo-600 border-indigo-400 text-white'
                            : 'border-slate-600 bg-slate-900 text-transparent'
                        }`}>
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>

                        {/* Fotoğraf Küçük Önizleme */}
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt=""
                            className="w-10 h-10 rounded-lg object-cover border border-slate-700 shrink-0 bg-slate-900"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600 shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                        )}

                        {/* Metin Detayları */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center space-x-1.5">
                            <span className="text-[10px] font-black text-indigo-400 truncate">
                              {item.subject}
                            </span>
                            {item.revised ? (
                              <span className="text-[8.5px] px-1 rounded bg-emerald-500/20 text-emerald-300 font-bold">✓ Pekiştirildi</span>
                            ) : (
                              <span className="text-[8.5px] px-1 rounded bg-rose-500/20 text-rose-300 font-bold">Bekliyor</span>
                            )}
                          </div>
                          <h5 className="text-xs font-bold text-white truncate">
                            {item.topicName}
                          </h5>
                          <p className="text-[9.5px] text-slate-400 truncate">
                            {item.publisher || 'Kaynak Belirtilmedi'} • {formatCompactDisplayDate(item.date)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

            </div>
          )}

          {/* TAB 2: KİTAPÇIK & BASKI AYARLARI */}
          {activeSidebarTab === 'options' && (
            <div className="flex-1 flex flex-col min-h-0 space-y-3 overflow-y-auto pr-1 custom-scrollbar">
              
              {/* Test Başlığı & Kurum */}
              <div className="space-y-1.5 bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
                <label className="text-[11px] font-bold text-slate-300">Test Başlığı:</label>
                <input
                  type="text"
                  value={testTitle}
                  onChange={(e) => setTestTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-bold focus:outline-none focus:border-indigo-400"
                />

                <label className="text-[11px] font-bold text-slate-300 pt-1 block">Kurum / Alt Başlık:</label>
                <input
                  type="text"
                  value={institutionName}
                  onChange={(e) => setInstitutionName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-400"
                />

                <label className="text-[11px] font-bold text-slate-300 pt-1 block">Öğrenci Adı:</label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-400"
                />
              </div>

              {/* Sayfa Düzeni (1 Sütun vs 2 Sütun ÖSYM) */}
              <div className="space-y-1.5 bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
                <label className="text-[11px] font-bold text-slate-300">Sayfa Düzeni (Layout):</label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setLayoutMode('2cols')}
                    className={`p-2 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer ${
                      layoutMode === '2cols'
                        ? 'bg-indigo-600/30 border-indigo-400 text-indigo-200 shadow-sm'
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Columns className="w-4 h-4" />
                    <span>2 Sütun (ÖSYM Deneme)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLayoutMode('1col')}
                    className={`p-2 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer ${
                      layoutMode === '1col'
                        ? 'bg-indigo-600/30 border-indigo-400 text-indigo-200 shadow-sm'
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    <LayoutGrid className="w-4 h-4" />
                    <span>1 Sütun (Geniş Çözüm)</span>
                  </button>
                </div>
              </div>

              {/* Çözüm Alanı Boyutu */}
              <div className="space-y-1.5 bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
                <label className="text-[11px] font-bold text-slate-300">Çözüm / Not Alanı Boşluğu:</label>
                <div className="grid grid-cols-4 gap-1">
                  {(['none', 'compact', 'normal', 'large'] as const).map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSolutionAreaSize(size)}
                      className={`py-1.5 rounded-lg border text-[10.5px] font-bold capitalize transition-all cursor-pointer ${
                        solutionAreaSize === size
                          ? 'bg-indigo-600 text-white border-indigo-400'
                          : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
                      }`}
                    >
                      {size === 'none' ? 'Yok' : size === 'compact' ? 'Az' : size === 'normal' ? 'Orta' : 'Geniş'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ekstra Baskı Seçenekleri */}
              <div className="space-y-2 bg-slate-950/60 p-3 rounded-2xl border border-slate-800 text-xs text-slate-300">
                <label className="flex items-center space-x-2 cursor-pointer font-medium">
                  <input
                    type="checkbox"
                    checked={includeAnswerKey}
                    onChange={(e) => setIncludeAnswerKey(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0 cursor-pointer"
                  />
                  <span>En Sona Cevap Anahtarı Tablosu Ekle</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer font-medium">
                  <input
                    type="checkbox"
                    checked={includeOpticalBubbles}
                    onChange={(e) => setIncludeOpticalBubbles(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0 cursor-pointer"
                  />
                  <span>Optik Kodlama Kutucukları (A B C D E)</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer font-medium">
                  <input
                    type="checkbox"
                    checked={includeTopicMeta}
                    onChange={(e) => setIncludeTopicMeta(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0 cursor-pointer"
                  />
                  <span>Soru Üstünde Ders, Konu ve Kaynak Bilgisi</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer font-medium">
                  <input
                    type="checkbox"
                    checked={includeErrorReason}
                    onChange={(e) => setIncludeErrorReason(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0 cursor-pointer"
                  />
                  <span>Hata Sebebini Göster (Örn: Dikkat / Bilgi Eksikliği)</span>
                </label>
              </div>

            </div>
          )}

        </div>

        {/* ── SAĞ SÜTUN (CANLI A4 BASKI ÖNİZLEMESİ) (lg:col-span-8) ── */}
        <div className="lg:col-span-8 bg-slate-950 border border-slate-800 rounded-3xl p-3 sm:p-5 flex flex-col items-center overflow-y-auto custom-scrollbar shadow-inner relative">
          
          {selectedQuestions.length === 0 ? (
            <div className="my-auto text-center space-y-3 p-8 max-w-sm">
              <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center mx-auto text-slate-500 border border-slate-800">
                <FileText className="w-7 h-7" />
              </div>
              <h4 className="text-sm font-bold text-slate-300">Henüz Soru Seçilmedi</h4>
              <p className="text-xs text-slate-500">
                Sol panelden test kitapçığına eklemek istediğiniz hataları seçerek canlı baskı önizlemesini görebilirsiniz.
              </p>
            </div>
          ) : (
            /* 📄 A4 BASKI DOKÜMANI KAPSAYICISI (#error-exam-print-document) */
            <div 
              id="error-exam-print-document"
              className="w-full max-w-[210mm] bg-white text-slate-900 rounded-lg shadow-2xl p-6 sm:p-8 space-y-6 text-left"
              style={{ minHeight: '297mm' }}
            >
              
              {/* 1. TEST KİTAPÇIK ÜST BAŞLIĞI (HEADER) */}
              <div className="border-b-2 border-slate-900 pb-3 flex items-start justify-between gap-4">
                <div className="space-y-0.5 min-w-0">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">
                    {institutionName}
                  </span>
                  <h1 className="text-lg sm:text-xl font-black text-black tracking-tight uppercase">
                    {testTitle}
                  </h1>
                  <p className="text-[11px] text-slate-600 font-medium">
                    Kişiye Özel Pekiştirme ve Hata Tekrar Soru Kitapçığı
                  </p>
                </div>

                {/* Sağ Öğrenci & Tarih Bilgi Kutusu */}
                <div className="border border-slate-400 rounded-lg p-2 text-right text-[10.5px] shrink-0 bg-slate-50 space-y-0.5 min-w-[140px]">
                  <div><span className="text-slate-500">Aday:</span> <strong className="text-black font-bold">{studentName}</strong></div>
                  <div><span className="text-slate-500">Tarih:</span> <span className="text-slate-700 font-mono">{formatDisplayDate(todayStr)}</span></div>
                  <div><span className="text-slate-500">Soru Sayısı:</span> <strong className="text-black font-bold">{selectedQuestions.length} Soru</strong></div>
                </div>
              </div>

              {/* 2. SORULAR LİSTESİ (1 SÜTUN VEYA 2 SÜTUN ÖSYM DÜZENİ) */}
              <div className={layoutMode === '2cols' ? 'grid grid-cols-1 sm:grid-cols-2 gap-6' : 'space-y-6'}>
                {selectedQuestions.map((q, index) => {
                  const qNum = index + 1;
                  const correctRaw = q.correctOption || q.aiSolutionCorrectAnswer || '';
                  const correctLetter = extractOptionLetter(correctRaw);

                  return (
                    <div 
                      key={q.id} 
                      className="print-avoid-break border-b border-slate-300 pb-4 space-y-2 last:border-0"
                    >
                      {/* Soru Üst Başlık & Numarası */}
                      <div className="flex items-center justify-between border-b border-slate-200 pb-1 text-slate-800">
                        <div className="flex items-center space-x-2 min-w-0">
                          <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-black text-[10.5px] flex items-center justify-center shrink-0">
                            {qNum}
                          </span>
                          {includeTopicMeta && (
                            <div className="min-w-0 text-[10.5px]">
                              <strong className="text-black">{q.subject}</strong>
                              <span className="text-slate-500 truncate"> • {q.topicName}</span>
                            </div>
                          )}
                        </div>

                        {includeTopicMeta && q.publisher && (
                          <span className="text-[9.5px] text-slate-500 italic shrink-0 max-w-[100px] truncate">
                            {q.publisher}
                          </span>
                        )}
                      </div>

                      {/* Hata Sebebi (Varsa & İstenirse) */}
                      {includeErrorReason && q.errorReason && (
                        <div className="text-[9px] text-slate-500 font-semibold italic">
                          Hata Türü: {q.errorReason}
                        </div>
                      )}

                      {/* Soru Görseli */}
                      {q.imageUrl ? (
                        <div className="my-1.5 flex justify-center bg-white rounded">
                          <img
                            src={q.imageUrl}
                            alt={`Soru ${qNum}`}
                            className="max-h-72 object-contain rounded border border-slate-200"
                          />
                        </div>
                      ) : (
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs text-slate-700 italic">
                          [Görsel Bulunmuyor] - {q.solutionNotes || 'Soru notu belirtilmemiş.'}
                        </div>
                      )}

                      {/* Optik Kodlama Kutucukları */}
                      {includeOpticalBubbles && (
                        <div className="flex items-center justify-between pt-1 text-[10px] text-slate-600">
                          <span className="font-bold text-[9px] text-slate-400">Cevabınız:</span>
                          <div className="flex items-center space-x-1.5 font-bold font-mono">
                            {['A', 'B', 'C', 'D', 'E'].map(opt => (
                              <span
                                key={opt}
                                className="w-4 h-4 rounded-full border border-slate-400 text-slate-700 flex items-center justify-center text-[9px]"
                              >
                                {opt}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* El Yazısı / Not Çözüm Alanı */}
                      {solutionAreaSize !== 'none' && (
                        <div 
                          className={`w-full border border-dashed border-slate-300 rounded p-1.5 text-[9px] text-slate-400 flex flex-col justify-between ${
                            solutionAreaSize === 'compact' ? 'h-10' : solutionAreaSize === 'normal' ? 'h-20' : 'h-32'
                          }`}
                        >
                          <span>Çözüm / Karalama Alanı:</span>
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>

              {/* 3. CEVAP ANAHTARI SAYFASI (Eğer Seçildiyse) */}
              {includeAnswerKey && (
                <div className="print-page-break border-t-2 border-slate-900 pt-4 mt-8 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-300 pb-2">
                    <div className="flex items-center space-x-2">
                      <Award className="w-4 h-4 text-slate-800" />
                      <h3 className="text-sm font-black text-black uppercase tracking-wider">
                        Cevap Anahtarı & Konu Dağılımı
                      </h3>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {selectedQuestions.length} Soru
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10.5px]">
                    {selectedQuestions.map((q, idx) => {
                      const qNum = idx + 1;
                      const correctRaw = q.correctOption || q.aiSolutionCorrectAnswer || '';
                      const correctLetter = extractOptionLetter(correctRaw) || '-';

                      return (
                        <div 
                          key={q.id}
                          className="p-1.5 bg-slate-50 border border-slate-200 rounded flex items-center justify-between"
                        >
                          <div className="flex items-center space-x-1.5 min-w-0">
                            <span className="font-black text-black">#{qNum}</span>
                            <span className="text-[9.5px] text-slate-600 truncate">{q.subject}</span>
                          </div>
                          <span className="w-5 h-5 rounded bg-slate-900 text-white font-black text-xs flex items-center justify-center shrink-0">
                            {correctLetter}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="text-[9.5px] text-slate-500 text-center pt-2 italic">
                    YKS Takip Sistemi • Akıllı Hata Defteri Pekiştirme Modülü
                  </div>
                </div>
              )}

            </div>
          )}

        </div>

      </div>

    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};
