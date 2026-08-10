import React, { useState, useMemo } from 'react';
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

  const selectedExamRecord = useMemo(() => {
    if (!selectedExamRecordId) return null;
    return examsToUse.find(e => e.id === selectedExamRecordId) || null;
  }, [examsToUse, selectedExamRecordId]);

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

          <div className="flex items-center gap-2.5 overflow-x-auto pb-1 pt-1 scrollbar-thin">
            <button
              type="button"
              onClick={() => setSelectedClassFilter('all')}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all shrink-0 flex items-center space-x-2 ${
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
                  className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all shrink-0 flex items-center space-x-2 ${
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

          {onDeleteAllInstitutionalExams && examsToUse.length > 0 && (
            <button
              onClick={() => setShowDeleteAllConfirm(true)}
              className="px-3 py-2 rounded-xl text-xs font-bold text-rose-300 hover:text-white bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-all shrink-0 flex items-center space-x-1"
              title="Sistemdeki Tüm Kurumsal Denemeleri Temizle"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Hepsini Sil</span>
            </button>
          )}
        </div>
      </div>

      {/* Reports Table & Inspect Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className={`${selectedExamRecord ? 'lg:col-span-7' : 'lg:col-span-12'} transition-all`}>
          <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <FileText className="w-4 h-4 text-amber-400" />
                <span>Karne Listesi ({filteredExams.length})</span>
              </h3>
              <span className="text-xs text-slate-400">Detay ve konu analizi için satıra tıklayın</span>
            </div>

            {filteredExams.length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <p className="text-xs font-semibold">Seçili filtrelere uygun sınav karnesi bulunamadı.</p>
              </div>
            ) : (
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
                    {filteredExams.map((ex) => {
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
            )}
          </div>
        </div>

        {/* Selected Exam Drawer */}
        {selectedExamRecord && (
          <div className="lg:col-span-5 bg-slate-900/90 border border-indigo-500/30 rounded-2xl p-5 space-y-4 backdrop-blur-xl shadow-2xl sticky top-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center space-x-2 text-white font-bold text-sm">
                <BarChart3 className="w-4 h-4 text-indigo-400" />
                <span>Karne Detayı & Konu Analizi</span>
              </div>
              <button
                onClick={() => setSelectedExamRecordId(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-white/10 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-sm text-white">{selectedExamRecord.studentName}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {selectedExamRecord.className || 'Sınıf Yok'}
                </span>
              </div>
              <p className="text-slate-400">{selectedExamRecord.examTitle} ({selectedExamRecord.examDate})</p>

              {/* Ranks & Scores */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10 text-center font-mono">
                <div className="bg-white/5 p-2 rounded-lg">
                  <span className="text-[10px] text-slate-400 block font-sans">SAY Puan</span>
                  <span className="font-bold text-amber-400">
                    {selectedExamRecord.scores?.sayScore ? selectedExamRecord.scores.sayScore.toFixed(2) : '-'}
                  </span>
                </div>
                <div className="bg-white/5 p-2 rounded-lg">
                  <span className="text-[10px] text-slate-400 block font-sans">Kurum Sırası</span>
                  <span className="font-bold text-indigo-300">
                    {formatRankWithTotal(selectedExamRecord.scores?.sayInstitutionRank, selectedExamRecord.scores?.sayInstitutionTotal)}
                  </span>
                </div>
                <div className="bg-white/5 p-2 rounded-lg">
                  <span className="text-[10px] text-slate-400 block font-sans">Genel Sıra</span>
                  <span className="font-bold text-emerald-300">
                    {formatRankWithTotal(selectedExamRecord.scores?.sayGeneralRank, selectedExamRecord.scores?.sayGeneralTotal)}
                  </span>
                </div>
              </div>
            </div>

            {/* Subject Net Table */}
            {selectedExamRecord.subjects && selectedExamRecord.subjects.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Ders Net Detayları</h4>
                <div className="max-h-64 overflow-y-auto border border-white/10 rounded-xl bg-slate-950 p-2 space-y-1">
                  {selectedExamRecord.subjects.map((sub, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-white/5 rounded-lg text-xs">
                      <span className="font-semibold text-slate-200">{sub.subjectName}</span>
                      <div className="flex items-center space-x-3 font-mono">
                        <span className="text-emerald-400">{sub.correct}D</span>
                        <span className="text-rose-400">{sub.wrong}Y</span>
                        <span className="font-bold text-amber-400">{(sub.net ?? 0).toFixed(2)} Net</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
