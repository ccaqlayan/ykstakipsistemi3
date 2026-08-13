import React, { useState, useMemo, useEffect } from 'react';
import { 
  Award, 
  Sparkles, 
  CheckCircle2, 
  Edit3, 
  ChevronDown, 
  Users, 
  Sliders, 
  Filter, 
  Search, 
  AlertTriangle, 
  Trash2, 
  ChevronRight, 
  FileText, 
  TrendingUp, 
  BarChart3, 
  HelpCircle,
  UserX,
  Link,
  X
} from 'lucide-react';
import { InstitutionalMockExam, UserAccount, YKSDataState, formatRankWithTotal } from '../../types';
import { MockInstitutionalDetailView } from '../mocks/MockInstitutionalDetailView';

interface BulkImportHistoryTabProps {
  examsToUse: InstitutionalMockExam[];
  studentUsers: UserAccount[];
  availableClasses: string[];
  studentsData: Record<string, YKSDataState>;
  onUpdateInstitutionalExam?: (exam: InstitutionalMockExam) => void;
  onDeleteInstitutionalExam?: (examId: string | string[]) => void;
  onDeleteAllInstitutionalExams?: () => Promise<void> | void;
  setMatchModalExam: (exam: InstitutionalMockExam | null) => void;
  setEditModalExam: (exam: InstitutionalMockExam | null) => void;
  setDeleteConfirmExam: (exam: InstitutionalMockExam | null) => void;
  setEditingSeriesExam: (info: { examTitle: string; latestDate?: string; count: number } | null) => void;
  setShowClassMappingModal: (show: boolean) => void;
  setShowDeleteAllConfirm: (show: boolean) => void;
}

export const BulkImportHistoryTab: React.FC<BulkImportHistoryTabProps> = ({
  examsToUse,
  studentUsers,
  availableClasses,
  studentsData,
  onUpdateInstitutionalExam,
  onDeleteInstitutionalExam,
  onDeleteAllInstitutionalExams,
  setMatchModalExam,
  setEditModalExam,
  setDeleteConfirmExam,
  setEditingSeriesExam,
  setShowClassMappingModal,
  setShowDeleteAllConfirm
}) => {
  // Filter states
  const [examTypeFilter, setExamTypeFilter] = useState<string>('all');
  const [selectedExamId, setSelectedExamId] = useState<string>('all');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const [matchFilter, setMatchFilter] = useState<'all' | 'matched' | 'unmatched'>('all');
  const [selectedExamRecordId, setSelectedExamRecordId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination states
  const [itemsPerPage, setItemsPerPage] = useState<number>(30);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Summaries calculation
  const examSummaries = useMemo(() => {
    const map = new Map<string, { examTitle: string; examType: string; count: number; maxScore: number; latestDate: string }>();
    examsToUse.forEach(ex => {
      const key = ex.examTitle || 'İsimsiz Sınav';
      const existing = map.get(key);
      const score = ex.scores?.sayScore || ex.scores?.eaScore || ex.scores?.sozScore || 0;
      const dateStr = ex.examDate || '';

      if (existing) {
        existing.count += 1;
        if (score > existing.maxScore) existing.maxScore = score;
        if (dateStr && dateStr > existing.latestDate) existing.latestDate = dateStr;
      } else {
        map.set(key, {
          examTitle: key,
          examType: ex.examType || 'TYT',
          count: 1,
          maxScore: score,
          latestDate: dateStr
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => (b.latestDate || '').localeCompare(a.latestDate || ''));
  }, [examsToUse]);

  const filteredExamSummaries = useMemo(() => {
    if (examTypeFilter === 'all') return examSummaries;
    return examSummaries.filter(e => e.examType === examTypeFilter);
  }, [examSummaries, examTypeFilter]);

  const top3Exams = useMemo(() => {
    return filteredExamSummaries.slice(0, 3);
  }, [filteredExamSummaries]);

  const otherExams = useMemo(() => {
    return filteredExamSummaries.slice(3);
  }, [filteredExamSummaries]);

  const examsForClassFilter = useMemo(() => {
    if (selectedExamId === 'all') return examsToUse;
    return examsToUse.filter(e => e.examTitle === selectedExamId);
  }, [examsToUse, selectedExamId]);

  const uniqueClassSummaries = useMemo(() => {
    const classMap = new Map<string, { className: string; count: number }>();
    examsForClassFilter.forEach(e => {
      const cls = e.className || 'Sınıfsız';
      const existing = classMap.get(cls);
      if (existing) existing.count += 1;
      else classMap.set(cls, { className: cls, count: 1 });
    });
    return Array.from(classMap.values()).sort((a, b) => a.className.localeCompare(b.className));
  }, [examsForClassFilter]);

  const matchedCount = useMemo(() => examsToUse.filter(e => !!e.studentId).length, [examsToUse]);
  const unmatchedCount = useMemo(() => examsToUse.filter(e => !e.studentId).length, [examsToUse]);

  const filteredExams = useMemo(() => {
    return examsToUse.filter(ex => {
      if (examTypeFilter !== 'all' && ex.examType !== examTypeFilter) return false;
      if (selectedExamId !== 'all' && ex.examTitle !== selectedExamId) return false;
      if (selectedClassFilter !== 'all' && (ex.className || 'Sınıfsız') !== selectedClassFilter) return false;
      if (matchFilter === 'matched' && !ex.studentId) return false;
      if (matchFilter === 'unmatched' && !!ex.studentId) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const mName = (ex.studentName || '').toLowerCase().includes(q);
        const mNo = (ex.schoolNumber || '').includes(q);
        const mTitle = (ex.examTitle || '').toLowerCase().includes(q);
        return mName || mNo || mTitle;
      }
      return true;
    });
  }, [examsToUse, examTypeFilter, selectedExamId, selectedClassFilter, matchFilter, searchTerm]);

  // Reset page when filters or itemsPerPage change
  useEffect(() => {
    setCurrentPage(1);
  }, [examTypeFilter, selectedExamId, selectedClassFilter, matchFilter, searchTerm, itemsPerPage]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredExams.length / itemsPerPage));
  }, [filteredExams.length, itemsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedExams = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredExams.slice(start, start + itemsPerPage);
  }, [filteredExams, currentPage, itemsPerPage]);

  const startItemIndex = filteredExams.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItemIndex = Math.min(currentPage * itemsPerPage, filteredExams.length);

  const getPageNumbers = (current: number, total: number) => {
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    if (current <= 4) {
      return [1, 2, 3, 4, 5, '...', total];
    }
    if (current >= total - 3) {
      return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
    }
    return [1, '...', current - 1, current, current + 1, '...', total];
  };

  const selectedExamRecord = useMemo(() => {
    if (!selectedExamRecordId) return null;
    return examsToUse.find(e => e.id === selectedExamRecordId) || null;
  }, [examsToUse, selectedExamRecordId]);

  if (selectedExamRecord) {
    return (
      <MockInstitutionalDetailView
        selectedInstitutionalExam={selectedExamRecord}
        setSelectedInstitutionalExam={(exam) => setSelectedExamRecordId(exam ? exam.id : null)}
      />
    );
  }

  return (
    <div className="space-y-6 w-full animate-fade-in">
      {/* STACKED FULL-WIDTH SELECTION CARDS */}
      <div className="space-y-4 w-full">
        {/* TOP BOX: Deneme Seçim Ekranı */}
        <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-5 space-y-4 backdrop-blur-xl shadow-xl w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-amber-500/20 border border-amber-500/30 rounded-xl text-amber-400">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <span>Deneme Sınavı Seçimi</span>
                  {selectedExamId !== 'all' && (
                    <span className="text-xs font-bold text-amber-300 bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 rounded-md">
                      Seçili: {selectedExamId}
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-400">Önce sınav türünü seçin, ardından denemenizi seçin</p>
              </div>
            </div>

            {/* Sınav Türü Seçim Tabları */}
            <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-white/10 shrink-0">
              {['all', 'TYT', 'AYT', 'Ara Sınıf'].map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setExamTypeFilter(t);
                    setSelectedExamId('all');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    examTypeFilter === t
                      ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {t === 'all' ? 'Tüm Türler' : t}
                </button>
              ))}
            </div>
          </div>

          {/* Son 3 Deneme Cards */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-300 font-bold">
              <span className="flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Öne Çıkan / Son Yüklenen Denemeler (Son 3)</span>
              </span>
              {selectedExamId !== 'all' && (
                <button
                  onClick={() => setSelectedExamId('all')}
                  className="text-[11px] text-amber-400 hover:text-amber-300 underline font-semibold"
                >
                  Tüm Denemeleri Göster
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div
                onClick={() => setSelectedExamId('all')}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  selectedExamId === 'all'
                    ? 'bg-amber-500/25 border-amber-500 shadow-lg shadow-amber-500/20 text-white ring-2 ring-amber-500/50'
                    : 'bg-slate-950/80 border-white/10 text-slate-300 hover:border-amber-500/40 hover:bg-slate-950'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-extrabold text-xs text-white block">Tüm Denemeler</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {filteredExamSummaries.length} Adet {examTypeFilter !== 'all' ? examTypeFilter : ''} Denemesi
                    </span>
                  </div>
                  {selectedExamId === 'all' && <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />}
                </div>
                <div className="mt-3 pt-2 border-t border-white/5 text-[10px] text-amber-300/80 font-semibold">
                  Filtresiz Tüm Karneleri Listele
                </div>
              </div>

              {top3Exams.map((ex) => {
                const isSelected = selectedExamId === ex.examTitle;
                return (
                  <div
                    key={ex.examTitle}
                    onClick={() => setSelectedExamId(ex.examTitle)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between relative group ${
                      isSelected
                        ? 'bg-amber-500/25 border-amber-500 shadow-lg shadow-amber-500/20 text-white ring-2 ring-amber-500/50'
                        : 'bg-slate-950/80 border-white/10 text-slate-300 hover:border-amber-500/40 hover:bg-slate-950'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1.5">
                      <div className="min-w-0 flex-1">
                        <span className="font-extrabold text-xs text-white block truncate" title={ex.examTitle}>
                          {ex.examTitle}
                        </span>
                        <span className="text-[10px] text-amber-400/90 font-mono font-semibold block mt-0.5">
                          {ex.examType} • {ex.latestDate || 'Tarih Yok'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingSeriesExam({
                              examTitle: ex.examTitle,
                              latestDate: ex.latestDate,
                              count: ex.count
                            });
                          }}
                          className="p-1 rounded bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 border border-amber-500/30 opacity-60 hover:opacity-100 transition-all"
                          title="Deneme Bilgilerini Düzenle / Sil"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />}
                      </div>
                    </div>
                    <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[11px] font-medium text-slate-400">
                      <span>{ex.count} Katılımcı</span>
                      <span className="font-bold text-amber-300">Max: {ex.maxScore}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Other Exams Dropdown */}
          {otherExams.length > 0 && (
            <div className="pt-2 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-300">
                <ChevronDown className="w-4 h-4 text-indigo-400" />
                <span>Diğer Denemeler ({otherExams.length} deneme listede):</span>
              </div>
              <select
                value={otherExams.some(e => e.examTitle === selectedExamId) ? selectedExamId : 'none'}
                onChange={(e) => {
                  if (e.target.value !== 'none') {
                    setSelectedExamId(e.target.value);
                  }
                }}
                className="w-full sm:w-80 bg-slate-950 border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white font-semibold focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="none">-- Diğer Denemeler Arasından Seçin --</option>
                {otherExams.map((ex) => (
                  <option key={ex.examTitle} value={ex.examTitle}>
                    {ex.examTitle} ({ex.count} Katılımcı - Max: {ex.maxScore})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* BOTTOM BOX: Sınıf Seçim Ekranı */}
        <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-5 space-y-3 backdrop-blur-xl shadow-xl w-full">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-indigo-500/20 border border-indigo-500/30 rounded-xl text-indigo-400">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <span>Sınıf / Şube Seçimi</span>
                  {selectedClassFilter !== 'all' && (
                    <span className="text-xs font-bold text-indigo-300 bg-indigo-500/20 border border-indigo-500/30 px-2 py-0.5 rounded-md">
                      Seçili: {selectedClassFilter}
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-400">Raporlanan öğrenci listesini sınıfa göre daraltın</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setShowClassMappingModal(true)}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-indigo-300 hover:text-white hover:bg-indigo-600/30 transition-all border border-indigo-500/30 bg-indigo-500/10 shadow-sm"
              >
                <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                <span>Sınıf Eşleştirme</span>
              </button>
              <span className="text-xs font-extrabold text-indigo-400 bg-indigo-500/10 px-2.5 py-1.5 rounded-xl border border-indigo-500/20">
                {uniqueClassSummaries.length} Sınıf Bulundu
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 pb-1 pt-1">
            <button
              type="button"
              onClick={() => setSelectedClassFilter('all')}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-2 ${
                selectedClassFilter === 'all'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'bg-slate-950/80 border border-white/10 text-slate-300 hover:text-white hover:bg-slate-950'
              }`}
            >
              <span>Tüm Sınıflar</span>
              <span className="px-2 py-0.5 rounded text-[10px] bg-black/40 font-mono">
                {examsForClassFilter.length}
              </span>
            </button>

            {uniqueClassSummaries.map((cls) => {
              const isSelected = selectedClassFilter === cls.className;
              return (
                <button
                  key={cls.className}
                  type="button"
                  onClick={() => setSelectedClassFilter(cls.className)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-2 ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                      : 'bg-slate-950/80 border border-white/10 text-slate-300 hover:text-white hover:bg-slate-950'
                  }`}
                >
                  <span>{cls.className}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-black/40 font-mono">
                    {cls.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Match Status Segmented Filter Bar */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setMatchFilter('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
            matchFilter === 'all'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'bg-white/5 text-slate-400 hover:text-white'
          }`}
        >
          <span>Tüm Karneler</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-black/30 font-mono">{examsToUse.length}</span>
        </button>
        <button
          type="button"
          onClick={() => setMatchFilter('matched')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
            matchFilter === 'matched'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
              : 'bg-white/5 text-slate-400 hover:text-white'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Eşleşmiş Karneler</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-black/30 font-mono">{matchedCount}</span>
        </button>
        <button
          type="button"
          onClick={() => setMatchFilter('unmatched')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
            matchFilter === 'unmatched'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
              : unmatchedCount > 0
              ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20'
              : 'bg-white/5 text-slate-400 hover:text-white'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          <span>Eşleşmemiş Karneler</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-black/30 font-mono">{unmatchedCount}</span>
        </button>
      </div>

      {/* Search & Active Filter Bar */}
      <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center space-x-1.5 text-xs text-slate-400 font-bold mr-1">
            <Filter className="w-4 h-4 text-indigo-400" />
            <span>Seçili Filtre:</span>
          </div>
          <span className="text-xs font-bold text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-xl">
            {selectedClassFilter === 'all' ? 'Tüm Sınıflar' : selectedClassFilter}
          </span>
          <span className="text-slate-600 font-bold">•</span>
          <span className="text-xs font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl">
            {selectedExamId === 'all' ? 'Tüm Denemeler' : selectedExamId}
          </span>
          <span className="text-xs font-extrabold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 ml-1">
            {filteredExams.length} Karne Bulundu
          </span>

          {(selectedClassFilter !== 'all' || selectedExamId !== 'all' || matchFilter !== 'all' || searchTerm) && (
            <button
              onClick={() => {
                setSelectedClassFilter('all');
                setSelectedExamId('all');
                setMatchFilter('all');
                setSearchTerm('');
              }}
              className="text-xs text-rose-400 hover:text-rose-300 underline ml-2 font-semibold"
            >
              Filtreleri Temizle
            </button>
          )}
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Öğrenci veya sınav ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Reports Table */}
      <div className="w-full">
        <div className="w-full">
          <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-3 gap-2">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <span>Karne Listesi ({filteredExams.length})</span>
                  {filteredExams.length > 0 && (
                    <span className="text-xs text-slate-400 font-mono font-normal">
                      ({startItemIndex}-{endItemIndex})
                    </span>
                  )}
                </h3>
              </div>

              <div className="flex items-center space-x-3 text-xs">
                <div className="flex items-center space-x-1.5 text-slate-400 font-medium">
                  <span>Sayfa başına:</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => setItemsPerPage(Number(e.target.value))}
                    className="bg-slate-950 border border-white/15 rounded-lg px-2 py-1 text-xs text-white font-bold focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={30}>30 (Varsayılan)</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={200}>200</option>
                  </select>
                </div>
              </div>
            </div>

            {filteredExams.length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <p className="text-xs font-semibold">Seçili filtrelere uygun sınav karnesi bulunamadı.</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto rounded-xl border border-white/10">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-950/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-white/10">
                        <th className="p-3">Öğrenci & Okul No</th>
                        <th className="p-3">Sınıf</th>
                        <th className="p-3">Deneme Sınavı</th>
                        <th className="p-3 text-center">Tür</th>
                        <th className="p-3 text-right">Puan / Derece</th>
                        <th className="p-3 text-center">İşlem</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-xs text-slate-300">
                      {paginatedExams.map((ex) => {
                        const isSelected = selectedExamRecordId === ex.id;
                        const hasAccount = !!ex.studentId;
                        const primaryScore = ex.scores?.sayScore || ex.scores?.eaScore || ex.scores?.sozScore || 0;

                        return (
                          <tr
                            key={ex.id}
                            onClick={() => setSelectedExamRecordId(ex.id)}
                            className={`cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-indigo-600/20 border-l-4 border-l-indigo-500'
                                : 'hover:bg-white/5'
                            }`}
                          >
                            <td className="p-3 font-semibold text-white">
                              <div className="flex items-center space-x-2">
                                <span>{ex.studentName}</span>
                                {ex.schoolNumber && (
                                  <span className="text-[10px] text-indigo-400 font-mono">#{ex.schoolNumber}</span>
                                )}
                                {!hasAccount && (
                                  <span
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setMatchModalExam(ex);
                                    }}
                                    className="text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded hover:bg-amber-500/30 transition-all cursor-pointer"
                                    title="Hesapla Eşleştir"
                                  >
                                    Hesap Yok
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="p-3 text-slate-400">{ex.className || '-'}</td>
                            <td className="p-3 font-medium text-slate-200">
                              <div>{ex.examTitle}</div>
                              <span className="text-[10px] text-slate-500">{ex.examDate}</span>
                            </td>
                            <td className="p-3 text-center">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                {ex.examType}
                              </span>
                            </td>
                            <td className="p-3 text-right font-mono font-bold text-amber-400">
                              {primaryScore ? primaryScore.toFixed(2) : '-'}
                            </td>
                            <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-center space-x-1">
                                <button
                                  onClick={() => setEditModalExam(ex)}
                                  className="p-1 text-slate-400 hover:text-white rounded hover:bg-white/10"
                                  title="Düzenle"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setDeleteConfirmExam(ex)}
                                  className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-rose-500/10"
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

                {totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between pt-3 border-t border-white/10 text-xs gap-3">
                    <div className="text-slate-400 font-medium">
                      Gösterilen: <strong className="text-amber-300 font-mono">{startItemIndex}-{endItemIndex}</strong> / <strong className="text-slate-200 font-mono">{filteredExams.length}</strong> karne
                    </div>

                    <div className="flex items-center space-x-1 overflow-x-auto max-w-full pb-1 sm:pb-0">
                      <button
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(1)}
                        className="px-2 py-1 rounded-lg bg-slate-950 border border-white/10 text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold transition-all cursor-pointer"
                        title="İlk Sayfa"
                      >
                        «
                      </button>
                      <button
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        className="px-2.5 py-1 rounded-lg bg-slate-950 border border-white/10 text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold transition-all cursor-pointer"
                      >
                        Önceki
                      </button>

                      {getPageNumbers(currentPage, totalPages).map((p, idx) => (
                        typeof p === 'number' ? (
                          <button
                            key={idx}
                            onClick={() => setCurrentPage(p)}
                            className={`min-w-[28px] h-7 px-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
                              currentPage === p
                                ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20'
                                : 'bg-slate-950 border border-white/10 text-slate-300 hover:text-white hover:bg-slate-800'
                            }`}
                          >
                            {p}
                          </button>
                        ) : (
                          <span key={idx} className="px-1 text-slate-500 font-bold select-none">...</span>
                        )
                      ))}

                      <button
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        className="px-2.5 py-1 rounded-lg bg-slate-950 border border-white/10 text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold transition-all cursor-pointer"
                      >
                        Sonraki
                      </button>
                      <button
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(totalPages)}
                        className="px-2 py-1 rounded-lg bg-slate-950 border border-white/10 text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold transition-all cursor-pointer"
                        title="Son Sayfa"
                      >
                        »
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
