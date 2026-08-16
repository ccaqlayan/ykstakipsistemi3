import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, ArrowDown, ArrowUp, CheckCircle2, Pencil, Clock, SlidersHorizontal, 
  ChevronDown, Calculator, Trash2, Search, Sparkles, Globe, Filter, Calendar,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Users
} from 'lucide-react';
import { GeneralMockExam, InstitutionalMockExam, MockExamType } from '../../types';

interface MockTableSectionProps {
  mockListTab: 'individual' | 'institutional';
  setMockListTab: (tab: 'individual' | 'institutional') => void;
  generalMocks: GeneralMockExam[];
  institutionalMocks: InstitutionalMockExam[];
  sortOrder: 'asc' | 'desc';
  setSortOrder: React.Dispatch<React.SetStateAction<'asc' | 'desc'>>;
  sortedGeneralMocks: GeneralMockExam[];
  setSelectedInstitutionalExam: (exam: InstitutionalMockExam | null) => void;
  handleStartEdit: (mock: GeneralMockExam) => void;
  onUpdateMock: (mock: GeneralMockExam) => void;
  expandedMockDetails: Record<string, boolean>;
  toggleExpandMockDetails: (id: string) => void;
  setCalcMock: (mock: GeneralMockExam | null) => void;
  setShowAllFields: (show: boolean) => void;
  setDeletingMock: (mock: { id: string; title: string } | null) => void;
}

export const getEffectiveMockExamType = (mock: GeneralMockExam): MockExamType => {
  const hasTyt = (mock.tyt?.totalNet || 0) > 0;
  const hasAyt = (mock.ayt?.totalNet || 0) > 0;
  const hasYdt = (mock.ydt?.net !== undefined && mock.ydt?.net !== null && Number(mock.ydt.net) > 0) || (mock.ydt && Object.keys(mock.ydt).length > 0 && mock.ydt.net !== undefined);

  if (mock.examType === 'DIL') return 'DIL';
  if (mock.examType === 'TYT_DIL') return 'TYT_DIL';
  if (mock.examType === 'TYT_AYT') return 'TYT_AYT';
  if (mock.examType === 'AYT' && !hasTyt) return 'AYT';

  if (hasYdt && !hasAyt && !hasTyt) return 'DIL';
  if (hasYdt && hasTyt && !hasAyt) return 'TYT_DIL';
  if (hasTyt && hasAyt) return 'TYT_AYT';
  if (hasAyt && !hasTyt) return 'AYT';

  if (mock.examType) return mock.examType;
  if (hasYdt) return 'DIL';
  return 'TYT';
};

const formatMockDate = (dateStr?: string) => {
  if (!dateStr) return { short: '-', full: '-' };
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d.getTime())) return { short: dateStr, full: dateStr };
  const dayNum = d.getDate();
  const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
  const daysShort = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
  const dayNameIndex = d.getDay();
  return {
    short: `${dayNum} ${months[d.getMonth()]} ${daysShort[dayNameIndex]}`,
    full: `${dayNum} ${months[d.getMonth()]} ${d.getFullYear()}`
  };
};

const getPageNumbers = (current: number, total: number) => {
  if (total <= 5) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  if (current <= 3) {
    return [1, 2, 3, 4, '...', total];
  }
  if (current >= total - 2) {
    return [1, '...', total - 3, total - 2, total - 1, total];
  }
  return [1, '...', current - 1, current, current + 1, '...', total];
};

export const MockTableSection: React.FC<MockTableSectionProps> = ({
  mockListTab,
  setMockListTab,
  generalMocks,
  institutionalMocks,
  sortOrder,
  setSortOrder,
  sortedGeneralMocks,
  setSelectedInstitutionalExam,
  handleStartEdit,
  onUpdateMock,
  expandedMockDetails,
  toggleExpandMockDetails,
  setCalcMock,
  setShowAllFields,
  setDeletingMock
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [examTypeFilter, setExamTypeFilter] = useState<'all' | 'TYT' | 'AYT' | 'DIL' | 'TYT_AYT'>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, examTypeFilter, sortOrder, mockListTab]);

  const totalCount = sortedGeneralMocks.length;
  const tytCount = sortedGeneralMocks.filter(m => {
    const t = getEffectiveMockExamType(m);
    return t === 'TYT' || (m.tyt?.totalNet || 0) > 0;
  }).length;
  const aytCount = sortedGeneralMocks.filter(m => {
    const t = getEffectiveMockExamType(m);
    return t === 'AYT' || t === 'TYT_AYT' || (m.ayt?.totalNet || 0) > 0;
  }).length;
  const dilCount = sortedGeneralMocks.filter(m => {
    const t = getEffectiveMockExamType(m);
    return t === 'DIL' || t === 'TYT_DIL' || (m.ydt?.net !== undefined && m.ydt.net > 0);
  }).length;
  const tytAytCount = sortedGeneralMocks.filter(m => {
    const t = getEffectiveMockExamType(m);
    return t === 'TYT_AYT' || ((m.tyt?.totalNet || 0) > 0 && (m.ayt?.totalNet || 0) > 0);
  }).length;

  const filteredGeneralMocks = sortedGeneralMocks.filter(m => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchQuery = (
        m.title.toLowerCase().includes(q) ||
        (m.notes && m.notes.toLowerCase().includes(q)) ||
        (m.date && m.date.includes(q)) ||
        (m.ydt?.language && m.ydt.language.toLowerCase().includes(q))
      );
      if (!matchQuery) return false;
    }

    if (examTypeFilter === 'all') return true;
    const type = getEffectiveMockExamType(m);
    if (examTypeFilter === 'TYT') {
      return type === 'TYT' || (type !== 'AYT' && type !== 'DIL' && (m.tyt?.totalNet || 0) > 0);
    }
    if (examTypeFilter === 'AYT') {
      return type === 'AYT' || type === 'TYT_AYT' || (m.ayt?.totalNet || 0) > 0;
    }
    if (examTypeFilter === 'DIL') {
      return type === 'DIL' || type === 'TYT_DIL' || (m.ydt?.net !== undefined && m.ydt.net > 0);
    }
    if (examTypeFilter === 'TYT_AYT') {
      return type === 'TYT_AYT' || ((m.tyt?.totalNet || 0) > 0 && (m.ayt?.totalNet || 0) > 0);
    }
    return true;
  });

  const totalGeneralPages = Math.ceil(filteredGeneralMocks.length / itemsPerPage) || 1;
  const safeGeneralPage = Math.min(Math.max(1, currentPage), totalGeneralPages);
  const paginatedGeneralMocks = filteredGeneralMocks.slice(
    (safeGeneralPage - 1) * itemsPerPage,
    safeGeneralPage * itemsPerPage
  );

  const renderPaginationControls = (current: number, total: number, totalItems: number, onPageChange: (p: number) => void) => {
    if (totalItems === 0) return null;

    const start = (current - 1) * itemsPerPage + 1;
    const end = Math.min(current * itemsPerPage, totalItems);
    const pageNumbers = getPageNumbers(current, total);

    return (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-800/80 text-xs">
        <div className="flex flex-wrap items-center gap-3 text-slate-400 font-medium">
          <div>
            Toplam <strong className="text-white font-mono">{totalItems}</strong> denemeden{' '}
            <strong className="text-indigo-300 font-mono">{start}-{end}</strong> arası gösteriliyor
          </div>

          <div className="flex items-center space-x-1.5 bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-500">Sayfa Başı:</span>
            {[5, 10, 20, 50].map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => {
                  setItemsPerPage(size);
                  setCurrentPage(1);
                }}
                className={`px-2 py-0.5 rounded-lg font-mono font-bold text-[11px] transition-all cursor-pointer ${
                  itemsPerPage === size
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        {total > 1 && (
          <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-2xl border border-slate-800 self-center sm:self-auto">
            <button
              type="button"
              disabled={current === 1}
              onClick={() => onPageChange(1)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
              title="İlk Sayfa"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>

            <button
              type="button"
              disabled={current === 1}
              onClick={() => onPageChange(current - 1)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
              title="Önceki Sayfa"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center space-x-1 px-1">
              {pageNumbers.map((p, idx) => {
                if (p === '...') {
                  return (
                    <span key={`dots-${idx}`} className="px-1.5 text-slate-600 font-bold">
                      ...
                    </span>
                  );
                }
                const pageNum = Number(p);
                const isActive = current === pageNum;
                return (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => onPageChange(pageNum)}
                    className={`w-7 h-7 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-center ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              disabled={current === total}
              onClick={() => onPageChange(current + 1)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
              title="Sonraki Sayfa"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              disabled={current === total}
              onClick={() => onPageChange(total)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
              title="Son Sayfa"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-2xl backdrop-blur-md">
      {mockListTab === 'individual' && generalMocks.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2.5 pb-4 border-b border-slate-800/80">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-300">
            <Filter className="w-4 h-4 text-indigo-400" />
            <span>Sınav Türüne Göre Filtrele:</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1 rounded-2xl border border-slate-800">
            <button
              type="button"
              onClick={() => setExamTypeFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                examTypeFilter === 'all'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <span>Tümü</span>
              <span className="font-mono text-[11px] opacity-75">({totalCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setExamTypeFilter('TYT')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                examTypeFilter === 'TYT'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-indigo-300 hover:bg-slate-900'
              }`}
            >
              <span>TYT</span>
              <span className="font-mono text-[11px] opacity-75">({tytCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setExamTypeFilter('AYT')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                examTypeFilter === 'AYT'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-emerald-300 hover:bg-slate-900'
              }`}
            >
              <span>AYT</span>
              <span className="font-mono text-[11px] opacity-75">({aytCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setExamTypeFilter('DIL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                examTypeFilter === 'DIL'
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                  : 'text-slate-400 hover:text-sky-300 hover:bg-slate-900'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>DİL (YDT)</span>
              <span className="font-mono text-[11px] opacity-75">({dilCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setExamTypeFilter('TYT_AYT')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                examTypeFilter === 'TYT_AYT'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-slate-400 hover:text-purple-300 hover:bg-slate-900'
              }`}
            >
              <span>TYT + AYT</span>
              <span className="font-mono text-[11px] opacity-75">({tytAytCount})</span>
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <button
            type="button"
            onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
            className="flex items-center space-x-1.5 text-xs font-bold text-slate-300 hover:text-white transition-colors cursor-pointer bg-slate-950 px-3.5 py-2 rounded-2xl border border-slate-800 shadow-sm shrink-0"
          >
            <span>Sıralama:</span>
            <span className="text-indigo-400 font-mono">
              {sortOrder === 'desc' ? 'Yeni -> Eski' : 'Eski -> Yeni'}
            </span>
            {sortOrder === 'desc' ? (
              <ArrowDown className="w-3.5 h-3.5 text-indigo-400" />
            ) : (
              <ArrowUp className="w-3.5 h-3.5 text-indigo-400" />
            )}
          </button>

          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Deneme adı, yayın veya notlarda ara..."
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-4 py-2 text-xs font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/80 transition-all shadow-sm"
            />
          </div>
        </div>

        {mockListTab === 'individual' && generalMocks.length > 0 && (
          <div className="flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1.5 rounded-2xl text-xs text-emerald-300 font-semibold shadow-sm shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>{generalMocks.filter(m => m.isAnalyzed).length} / {generalMocks.length} Analiz Edildi</span>
          </div>
        )}
      </div>

      {mockListTab === 'institutional' ? (
        (() => {
          const sortedInstitutionalMocks = [...institutionalMocks].sort((a, b) => {
            const dateA = new Date(a.examDate).getTime() || 0;
            const dateB = new Date(b.examDate).getTime() || 0;
            return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
          });

          const totalInstPages = Math.ceil(sortedInstitutionalMocks.length / itemsPerPage) || 1;
          const safeInstPage = Math.min(Math.max(1, currentPage), totalInstPages);
          const paginatedInstitutionalMocks = sortedInstitutionalMocks.slice(
            (safeInstPage - 1) * itemsPerPage,
            safeInstPage * itemsPerPage
          );

          return sortedInstitutionalMocks.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-800 rounded-3xl space-y-2">
              <GraduationCap className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-400 font-medium">Okul tarafından yüklenmiş kurumsal deneme karneniz bulunmuyor.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-900/90 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-bold text-[11px]">
                      <th className="p-3.5">Sınav Adı</th>
                      <th className="p-3.5">Tarih</th>
                      <th className="p-3.5">Tür</th>
                      <th className="p-3.5">Puan & Dereceler (Snf / Kurum / Genel)</th>
                      <th className="p-3.5 text-center">Katılımcı</th>
                      <th className="p-3.5 text-right">Eylem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900/60 text-slate-300">
                    {paginatedInstitutionalMocks.map((exam) => {
                      const dateInfo = formatMockDate(exam.examDate);
                      const displayScores: Array<{ label: string; score: number; classRank?: number; classTotal?: number; instRank?: number; instTotal?: number; genRank?: number; genTotal?: number; badgeColor: string }> = [];

                      if (exam.scores.tytScore !== undefined && exam.scores.tytScore > 0) {
                        displayScores.push({
                          label: 'TYT',
                          score: exam.scores.tytScore,
                          classRank: exam.scores.tytClassRank,
                          classTotal: exam.scores.tytClassTotal || exam.scores.classParticipantCount,
                          instRank: exam.scores.tytInstitutionRank,
                          instTotal: exam.scores.tytInstitutionTotal || exam.scores.institutionParticipantCount,
                          genRank: exam.scores.tytGeneralRank,
                          genTotal: exam.scores.tytGeneralTotal || exam.scores.generalParticipantCount,
                          badgeColor: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                        });
                      }
                      if (exam.scores.sayScore !== undefined && exam.scores.sayScore > 0) {
                        displayScores.push({
                          label: 'SAY',
                          score: exam.scores.sayScore,
                          classRank: exam.scores.sayClassRank,
                          classTotal: exam.scores.sayClassTotal || exam.scores.classParticipantCount,
                          instRank: exam.scores.sayInstitutionRank,
                          instTotal: exam.scores.sayInstitutionTotal || exam.scores.institutionParticipantCount,
                          genRank: exam.scores.sayGeneralRank,
                          genTotal: exam.scores.sayGeneralTotal || exam.scores.generalParticipantCount,
                          badgeColor: 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                        });
                      }
                      if (exam.scores.eaScore !== undefined && exam.scores.eaScore > 0) {
                        displayScores.push({
                          label: 'EA',
                          score: exam.scores.eaScore,
                          classRank: exam.scores.eaClassRank,
                          classTotal: exam.scores.eaClassTotal || exam.scores.classParticipantCount,
                          instRank: exam.scores.eaInstitutionRank,
                          instTotal: exam.scores.eaInstitutionTotal || exam.scores.institutionParticipantCount,
                          genRank: exam.scores.eaGeneralRank,
                          genTotal: exam.scores.eaGeneralTotal || exam.scores.generalParticipantCount,
                          badgeColor: 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                        });
                      }
                      if (exam.scores.sozScore !== undefined && exam.scores.sozScore > 0) {
                        displayScores.push({
                          label: 'SÖZ',
                          score: exam.scores.sozScore,
                          classRank: exam.scores.sozClassRank,
                          classTotal: exam.scores.sozClassTotal || exam.scores.classParticipantCount,
                          instRank: exam.scores.sozInstitutionRank,
                          instTotal: exam.scores.sozInstitutionTotal || exam.scores.institutionParticipantCount,
                          genRank: exam.scores.sozGeneralRank,
                          genTotal: exam.scores.sozGeneralTotal || exam.scores.generalParticipantCount,
                          badgeColor: 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                        });
                      }

                      return (
                        <tr key={exam.id} className="hover:bg-slate-900/50 transition-colors group">
                          {/* Sınav Adı */}
                          <td className="p-3.5 font-extrabold text-white max-w-xs truncate">
                            <div className="flex items-center space-x-2">
                              <span className="truncate group-hover:text-indigo-300 transition-colors">{exam.examTitle}</span>
                            </div>
                            <div className="text-[11px] text-slate-500 font-normal font-sans mt-0.5">
                              {exam.studentName} {exam.schoolNumber ? `(#${exam.schoolNumber})` : ''}
                            </div>
                          </td>

                          {/* Tarih */}
                          <td className="p-3.5 font-mono text-slate-300 whitespace-nowrap">
                            <span className="text-xs">{dateInfo.short}</span>
                          </td>

                          {/* Sınav Türü */}
                          <td className="p-3.5 whitespace-nowrap">
                            <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-xl border border-indigo-500/20 uppercase">
                              {exam.examType || 'Kurumsal'}
                            </span>
                          </td>

                          {/* Puan & Dereceler */}
                          <td className="p-3.5">
                            {displayScores.length === 0 ? (
                              <span className="text-slate-500 italic text-[11px]">Puan Girilmedi</span>
                            ) : (
                              <div className="space-y-1.5 font-mono text-[11px]">
                                {displayScores.map((sc, sIdx) => (
                                  <div key={sIdx} className="flex flex-wrap items-center gap-2">
                                    <span className={`px-2 py-0.5 rounded-lg border font-bold text-[10px] ${sc.badgeColor}`}>
                                      {sc.label}
                                    </span>
                                    <strong className="text-white text-xs font-bold">{sc.score} Puan</strong>
                                    
                                    <div className="flex items-center space-x-1.5 text-[10px] text-slate-400">
                                      {sc.classRank ? (
                                        <span className="bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 text-emerald-400 font-semibold" title="Sınıf Derecesi">
                                          Snf: {sc.classRank}{sc.classTotal ? `/${sc.classTotal}` : ''}
                                        </span>
                                      ) : null}

                                      {sc.instRank ? (
                                        <span className="bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 text-indigo-300 font-semibold" title="Kurum/Okul Derecesi">
                                          Kurum: {sc.instRank}{sc.instTotal ? `/${sc.instTotal}` : ''}
                                        </span>
                                      ) : null}

                                      {sc.genRank ? (
                                        <span className="bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 text-amber-300 font-semibold" title="Genel Derece">
                                          Genel: #{sc.genRank.toLocaleString('tr-TR')}
                                        </span>
                                      ) : null}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>

                          {/* Katılımcı Sayısı */}
                          <td className="p-3.5 text-center whitespace-nowrap font-mono text-xs text-slate-400">
                            {exam.scores.classParticipantCount ? (
                              <span className="inline-flex items-center space-x-1 bg-slate-900 px-2.5 py-1 rounded-xl border border-slate-800">
                                <Users className="w-3 h-3 text-indigo-400" />
                                <span>{exam.scores.classParticipantCount} Öğr.</span>
                              </span>
                            ) : (
                              '-'
                            )}
                          </td>

                          {/* Eylem: Karneyi Görüntüle */}
                          <td className="p-3.5 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => setSelectedInstitutionalExam(exam)}
                              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all cursor-pointer inline-flex items-center space-x-1.5 shadow-md shadow-indigo-600/30 hover:scale-[1.02]"
                            >
                              <GraduationCap className="w-4 h-4" />
                              <span>Karneyi Görüntüle</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {renderPaginationControls(safeInstPage, totalInstPages, sortedInstitutionalMocks.length, (p) => setCurrentPage(p))}
            </div>
          );
        })()
      ) : filteredGeneralMocks.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-slate-800 rounded-3xl space-y-1">
          <p className="text-xs text-slate-400 font-medium">Arama kriterlerine veya kayıtlara uygun genel deneme bulunamadı.</p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-[11px] font-bold text-indigo-400 hover:underline cursor-pointer"
            >
              Aramayı Temizle
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2.5">
            {paginatedGeneralMocks.map((mock) => {
              const dateInfo = formatMockDate(mock.date);
              const type = getEffectiveMockExamType(mock);
              const hasTyt = type === 'TYT' || type === 'TYT_AYT' || type === 'TYT_DIL' || (mock.tyt?.totalNet || 0) > 0;
              const hasAyt = type === 'AYT' || type === 'TYT_AYT' || (mock.ayt?.totalNet || 0) > 0;
              const hasYdt = type === 'DIL' || type === 'TYT_DIL' || (mock.ydt?.net !== undefined && mock.ydt.net > 0);
              const hasDetails = (mock.tyt?.details && Object.keys(mock.tyt.details).length > 0) || (mock.ayt?.details && Object.keys(mock.ayt.details).length > 0);

              return (
                <div
                  key={mock.id}
                  className="bg-slate-950/80 border border-slate-800/80 hover:border-indigo-500/40 rounded-2xl p-3.5 sm:p-4 hover:bg-slate-900/40 transition-all duration-200 shadow-sm hover:shadow-md flex flex-col gap-2.5 group animate-fade-in"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-800/70">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-300 bg-slate-900 px-2.5 py-0.5 rounded-lg border border-slate-800 flex items-center gap-1.5 shadow-sm" title={dateInfo.full}>
                        <Calendar className="w-3 h-3 text-indigo-400" />
                        <span>{dateInfo.short}</span>
                      </span>

                      <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-lg border uppercase tracking-wider flex items-center gap-1 shadow-sm ${
                        type === 'DIL'
                          ? 'bg-sky-500/10 text-sky-400 border-sky-500/30'
                          : type === 'TYT_DIL'
                          ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                          : type === 'AYT'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : type === 'TYT_AYT'
                          ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                          : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                      }`}>
                        {type === 'DIL' || type === 'TYT_DIL' ? <Globe className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
                        <span>{type === 'DIL' ? 'DİL' : type === 'TYT_DIL' ? 'TYT + DİL' : type === 'AYT' ? 'AYT' : type === 'TYT_AYT' ? 'TYT + AYT' : 'TYT'}</span>
                      </span>

                      <h3 className="text-sm font-extrabold text-white group-hover:text-indigo-300 transition-colors">
                        {mock.title}
                      </h3>

                      {mock.notes && (
                        <span className="text-[11px] text-slate-400 italic bg-slate-900/60 px-2 py-0.5 rounded-lg border border-slate-800/60 max-w-xs truncate" title={mock.notes}>
                          💬 {mock.notes}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {mock.estimatedRank && (
                        <div className="inline-flex items-center space-x-1 bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded-lg text-xs font-black text-amber-300 font-mono shadow-sm" title="Tahmini YKS Sıralaması">
                          <Sparkles className="w-3 h-3 text-amber-400" />
                          <span>#{new Intl.NumberFormat('tr-TR').format(mock.estimatedRank)}</span>
                        </div>
                      )}

                      <div className="bg-slate-900 px-2.5 py-1 rounded-xl border border-slate-800 text-xs font-mono font-bold flex items-center space-x-2 shadow-sm">
                        {hasTyt && (
                          <span className="flex items-center gap-1">
                            <span className="text-[10px] text-slate-400 font-sans">TYT:</span>
                            <strong className="text-indigo-300 font-black">{String(mock.tyt.totalNet).replace('.', ',')}</strong>
                          </span>
                        )}

                        {hasTyt && hasAyt && <span className="text-slate-700">|</span>}

                        {hasAyt && (
                          <span className="flex items-center gap-1">
                            <span className="text-[10px] text-slate-400 font-sans">AYT:</span>
                            <strong className="text-emerald-300 font-black">{String(mock.ayt.totalNet).replace('.', ',')}</strong>
                          </span>
                        )}

                        {hasYdt && (
                          <span className="flex items-center gap-1">
                            <span className="text-[10px] text-slate-400 font-sans">{mock.ydt?.language || 'YDT'}:</span>
                            <strong className="text-sky-300 font-black">{String(mock.ydt?.net ?? 0).replace('.', ',')}</strong>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-1.5 ml-1">
                        <button
                          type="button"
                          onClick={() => onUpdateMock({ ...mock, isAnalyzed: !mock.isAnalyzed })}
                          className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all inline-flex items-center space-x-1 cursor-pointer border shadow-sm ${
                            mock.isAnalyzed
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25'
                              : 'bg-amber-500/15 text-amber-300 border-amber-500/30 hover:bg-amber-500/25'
                          }`}
                          title="Soru ve hata analiz durumunu değiştirmek için tıklayın"
                        >
                          {mock.isAnalyzed ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              <span>Analiz Edildi</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3 text-amber-400" />
                              <span>Bekliyor</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => {
                            setCalcMock(mock);
                            setShowAllFields(false);
                          }}
                          className="flex items-center space-x-1 px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 cursor-pointer shadow-sm"
                          title="YKS Puan & Sıralama Hesapla"
                        >
                          <Calculator className="w-3 h-3 text-indigo-400" />
                          <span>Puan Hesapla</span>
                        </button>

                        <button
                          onClick={() => handleStartEdit(mock)}
                          className="p-1 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 rounded-lg transition-all cursor-pointer shadow-sm"
                          title="Denemeyi Düzenle"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => setDeletingMock({ id: mock.id, title: `${mock.date} - ${mock.title}` })}
                          className="p-1 text-slate-500 hover:text-rose-400 bg-slate-900 hover:bg-rose-500/10 border border-slate-800 hover:border-rose-500/30 rounded-lg transition-all cursor-pointer shadow-sm"
                          title="Denemeyi Sil"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
                    {hasTyt && (
                      <>
                        <div className="bg-slate-900 border border-slate-800/90 px-2.5 py-1 rounded-xl flex items-center gap-1.5 shadow-sm">
                          <span className="text-slate-400 font-sans text-[11px]">Türkçe:</span>
                          <strong className="text-indigo-300 font-bold">{String(mock.tyt.turkce).replace('.', ',')}</strong>
                          {mock.tyt.details?.turkce && (
                            <span className="text-[10px] text-slate-500 font-sans">({mock.tyt.details.turkce.correct}D {mock.tyt.details.turkce.wrong}Y)</span>
                          )}
                        </div>

                        <div className="bg-slate-900 border border-slate-800/90 px-2.5 py-1 rounded-xl flex items-center gap-1.5 shadow-sm">
                          <span className="text-slate-400 font-sans text-[11px]">Sosyal:</span>
                          <strong className="text-indigo-300 font-bold">{String(mock.tyt.sosyal).replace('.', ',')}</strong>
                          {mock.tyt.details?.sosyal && (
                            <span className="text-[10px] text-slate-500 font-sans">({mock.tyt.details.sosyal.correct}D {mock.tyt.details.sosyal.wrong}Y)</span>
                          )}
                        </div>

                        <div className="bg-slate-900 border border-slate-800/90 px-2.5 py-1 rounded-xl flex items-center gap-1.5 shadow-sm">
                          <span className="text-slate-400 font-sans text-[11px]">Matematik:</span>
                          <strong className="text-indigo-300 font-bold">{String(mock.tyt.mat).replace('.', ',')}</strong>
                          {mock.tyt.details?.mat && (
                            <span className="text-[10px] text-slate-500 font-sans">({mock.tyt.details.mat.correct}D {mock.tyt.details.mat.wrong}Y)</span>
                          )}
                        </div>

                        <div className="bg-slate-900 border border-slate-800/90 px-2.5 py-1 rounded-xl flex items-center gap-1.5 shadow-sm">
                          <span className="text-slate-400 font-sans text-[11px]">Fen:</span>
                          <strong className="text-indigo-300 font-bold">{String(mock.tyt.fen).replace('.', ',')}</strong>
                          {mock.tyt.details?.fen && (
                            <span className="text-[10px] text-slate-500 font-sans">({mock.tyt.details.fen.correct}D {mock.tyt.details.fen.wrong}Y)</span>
                          )}
                        </div>
                      </>
                    )}

                    {hasAyt && (
                      <>
                        <div className="bg-slate-900 border border-slate-800/90 px-2.5 py-1 rounded-xl flex items-center gap-1.5 shadow-sm">
                          <span className="text-slate-400 font-sans text-[11px]">AYT Mat:</span>
                          <strong className="text-emerald-300 font-bold">{String(mock.ayt.mat).replace('.', ',')}</strong>
                          {mock.ayt.details?.mat && (
                            <span className="text-[10px] text-slate-500 font-sans">({mock.ayt.details.mat.correct}D {mock.ayt.details.mat.wrong}Y)</span>
                          )}
                        </div>

                        {(mock.ayt.fen !== undefined && (mock.ayt.fen > 0 || (mock.ayt.edebiyatSos1 === 0 && mock.ayt.sos2 === 0))) && (
                          <div className="bg-slate-900 border border-slate-800/90 px-2.5 py-1 rounded-xl flex items-center gap-1.5 shadow-sm">
                            <span className="text-slate-400 font-sans text-[11px]">AYT Fen:</span>
                            <strong className="text-emerald-300 font-bold">{String(mock.ayt.fen).replace('.', ',')}</strong>
                            {mock.ayt.details?.fen && (
                              <span className="text-[10px] text-slate-500 font-sans">({mock.ayt.details.fen.correct}D {mock.ayt.details.fen.wrong}Y)</span>
                            )}
                          </div>
                        )}

                        {(mock.ayt.edebiyatSos1 !== undefined && mock.ayt.edebiyatSos1 > 0) && (
                          <div className="bg-slate-900 border border-slate-800/90 px-2.5 py-1 rounded-xl flex items-center gap-1.5 shadow-sm">
                            <span className="text-slate-400 font-sans text-[11px]">Edebiyat-Sos1:</span>
                            <strong className="text-emerald-300 font-bold">{String(mock.ayt.edebiyatSos1).replace('.', ',')}</strong>
                            {mock.ayt.details?.edebiyatSos1 && (
                              <span className="text-[10px] text-slate-500 font-sans">({mock.ayt.details.edebiyatSos1.correct}D {mock.ayt.details.edebiyatSos1.wrong}Y)</span>
                            )}
                          </div>
                        )}

                        {(mock.ayt.sos2 !== undefined && mock.ayt.sos2 > 0) && (
                          <div className="bg-slate-900 border border-slate-800/90 px-2.5 py-1 rounded-xl flex items-center gap-1.5 shadow-sm">
                            <span className="text-slate-400 font-sans text-[11px]">Sosyal-2:</span>
                            <strong className="text-emerald-300 font-bold">{String(mock.ayt.sos2).replace('.', ',')}</strong>
                            {mock.ayt.details?.sos2 && (
                              <span className="text-[10px] text-slate-500 font-sans">({mock.ayt.details.sos2.correct}D {mock.ayt.details.sos2.wrong}Y)</span>
                            )}
                          </div>
                        )}
                      </>
                    )}

                    {hasYdt && (
                      <div className="bg-sky-500/10 border border-sky-500/25 px-2.5 py-1 rounded-xl flex items-center gap-1.5 shadow-sm">
                        <Globe className="w-3.5 h-3.5 text-sky-400" />
                        <span className="text-sky-400 font-sans text-[11px]">{mock.ydt?.language || 'YDT'}:</span>
                        <strong className="text-white font-bold">{String(mock.ydt?.net ?? 0).replace('.', ',')} Net</strong>
                        {mock.ydt && (mock.ydt.correct !== undefined || mock.ydt.wrong !== undefined) && (
                          <span className="text-[10px] text-sky-300/70 font-sans">({mock.ydt.correct ?? 0}D {mock.ydt.wrong ?? 0}Y)</span>
                        )}
                      </div>
                    )}

                    {hasDetails && (
                      <button
                        type="button"
                        onClick={() => toggleExpandMockDetails(mock.id)}
                        className="text-[11px] font-sans font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors cursor-pointer bg-slate-900/80 hover:bg-slate-900 px-2.5 py-1 rounded-xl border border-slate-800 ml-auto shadow-sm"
                        title="Alt ders detaylarını aç/kapat"
                      >
                        <SlidersHorizontal className="w-3 h-3 text-indigo-400" />
                        <span>{expandedMockDetails[mock.id] ? 'Detayı Kapat' : 'Alt Dersler'}</span>
                        <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${expandedMockDetails[mock.id] ? 'rotate-180' : ''}`} />
                      </button>
                    )}
                  </div>

                  {hasDetails && expandedMockDetails[mock.id] && (
                    <div className="mt-1 p-3 bg-slate-900/90 border border-slate-800 rounded-xl space-y-2.5 animate-fade-in font-mono text-[11px]">
                      {mock.tyt?.details && (
                        <div>
                          <div className="text-[10px] font-bold text-indigo-400 mb-1.5 flex items-center gap-1 font-sans uppercase tracking-wider">
                            <span>TYT Alt Dersler</span>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1.5 text-slate-300">
                            {mock.tyt.details.matematik && (
                              <div className="bg-slate-950 px-2 py-1.5 rounded-lg border border-slate-800 flex items-center justify-between">
                                <span className="text-slate-400 text-[10px] font-sans">Matematik</span>
                                <strong className="text-indigo-300 text-xs">{String(mock.tyt.details.matematik.net).replace('.', ',')}</strong>
                              </div>
                            )}
                            {mock.tyt.details.geometri && (
                              <div className="bg-slate-950 px-2 py-1.5 rounded-lg border border-slate-800 flex items-center justify-between">
                                <span className="text-slate-400 text-[10px] font-sans">Geometri</span>
                                <strong className="text-purple-300 text-xs">{String(mock.tyt.details.geometri.net).replace('.', ',')}</strong>
                              </div>
                            )}
                            {mock.tyt.details.fizik && (
                              <div className="bg-slate-950 px-2 py-1.5 rounded-lg border border-slate-800 flex items-center justify-between">
                                <span className="text-slate-400 text-[10px] font-sans">Fizik</span>
                                <strong className="text-sky-300 text-xs">{String(mock.tyt.details.fizik.net).replace('.', ',')}</strong>
                              </div>
                            )}
                            {mock.tyt.details.kimya && (
                              <div className="bg-slate-950 px-2 py-1.5 rounded-lg border border-slate-800 flex items-center justify-between">
                                <span className="text-slate-400 text-[10px] font-sans">Kimya</span>
                                <strong className="text-teal-300 text-xs">{String(mock.tyt.details.kimya.net).replace('.', ',')}</strong>
                              </div>
                            )}
                            {mock.tyt.details.biyoloji && (
                              <div className="bg-slate-950 px-2 py-1.5 rounded-lg border border-slate-800 flex items-center justify-between">
                                <span className="text-slate-400 text-[10px] font-sans">Biyoloji</span>
                                <strong className="text-emerald-300 text-xs">{String(mock.tyt.details.biyoloji.net).replace('.', ',')}</strong>
                              </div>
                            )}
                            {mock.tyt.details.tarih && (
                              <div className="bg-slate-950 px-2 py-1.5 rounded-lg border border-slate-800 flex items-center justify-between">
                                <span className="text-slate-400 text-[10px] font-sans">Tarih</span>
                                <strong className="text-amber-300 text-xs">{String(mock.tyt.details.tarih.net).replace('.', ',')}</strong>
                              </div>
                            )}
                            {mock.tyt.details.cografya && (
                              <div className="bg-slate-950 px-2 py-1.5 rounded-lg border border-slate-800 flex items-center justify-between">
                                <span className="text-slate-400 text-[10px] font-sans">Coğrafya</span>
                                <strong className="text-orange-300 text-xs">{String(mock.tyt.details.cografya.net).replace('.', ',')}</strong>
                              </div>
                            )}
                            {mock.tyt.details.felsefe && (
                              <div className="bg-slate-950 px-2 py-1.5 rounded-lg border border-slate-800 flex items-center justify-between">
                                <span className="text-slate-400 text-[10px] font-sans">Felsefe</span>
                                <strong className="text-fuchsia-300 text-xs">{String(mock.tyt.details.felsefe.net).replace('.', ',')}</strong>
                              </div>
                            )}
                            {mock.tyt.details.din && (
                              <div className="bg-slate-950 px-2 py-1.5 rounded-lg border border-slate-800 flex items-center justify-between">
                                <span className="text-slate-400 text-[10px] font-sans">Din Kültürü</span>
                                <strong className="text-pink-300 text-xs">{String(mock.tyt.details.din.net).replace('.', ',')}</strong>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {mock.ayt?.details && (
                        <div>
                          <div className="text-[10px] font-bold text-emerald-400 mb-1.5 flex items-center gap-1 font-sans uppercase tracking-wider">
                            <span>AYT Alt Dersler</span>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1.5 text-slate-300">
                            {mock.ayt.details.matematik && (
                              <div className="bg-slate-950 px-2 py-1.5 rounded-lg border border-slate-800 flex items-center justify-between">
                                <span className="text-slate-400 text-[10px] font-sans">AYT Mat</span>
                                <strong className="text-purple-300 text-xs">{String(mock.ayt.details.matematik.net).replace('.', ',')}</strong>
                              </div>
                            )}
                            {mock.ayt.details.geometri && (
                              <div className="bg-slate-950 px-2 py-1.5 rounded-lg border border-slate-800 flex items-center justify-between">
                                <span className="text-slate-400 text-[10px] font-sans">AYT Geo</span>
                                <strong className="text-fuchsia-300 text-xs">{String(mock.ayt.details.geometri.net).replace('.', ',')}</strong>
                              </div>
                            )}
                            {mock.ayt.details.fizik && (
                              <div className="bg-slate-950 px-2 py-1.5 rounded-lg border border-slate-800 flex items-center justify-between">
                                <span className="text-slate-400 text-[10px] font-sans">AYT Fizik</span>
                                <strong className="text-sky-300 text-xs">{String(mock.ayt.details.fizik.net).replace('.', ',')}</strong>
                              </div>
                            )}
                            {mock.ayt.details.kimya && (
                              <div className="bg-slate-950 px-2 py-1.5 rounded-lg border border-slate-800 flex items-center justify-between">
                                <span className="text-slate-400 text-[10px] font-sans">AYT Kimya</span>
                                <strong className="text-teal-300 text-xs">{String(mock.ayt.details.kimya.net).replace('.', ',')}</strong>
                              </div>
                            )}
                            {mock.ayt.details.biyoloji && (
                              <div className="bg-slate-950 px-2 py-1.5 rounded-lg border border-slate-800 flex items-center justify-between">
                                <span className="text-slate-400 text-[10px] font-sans">AYT Biyoloji</span>
                                <strong className="text-emerald-300 text-xs">{String(mock.ayt.details.biyoloji.net).replace('.', ',')}</strong>
                              </div>
                            )}
                            {mock.ayt.details.edebiyat && (
                              <div className="bg-slate-950 px-2 py-1.5 rounded-lg border border-slate-800 flex items-center justify-between">
                                <span className="text-slate-400 text-[10px] font-sans">Edebiyat</span>
                                <strong className="text-rose-300 text-xs">{String(mock.ayt.details.edebiyat.net).replace('.', ',')}</strong>
                              </div>
                            )}
                            {mock.ayt.details.tarih1 && (
                              <div className="bg-slate-950 px-2 py-1.5 rounded-lg border border-slate-800 flex items-center justify-between">
                                <span className="text-slate-400 text-[10px] font-sans">Tarih-1</span>
                                <strong className="text-amber-300 text-xs">{String(mock.ayt.details.tarih1.net).replace('.', ',')}</strong>
                              </div>
                            )}
                            {mock.ayt.details.cografya1 && (
                              <div className="bg-slate-950 px-2 py-1.5 rounded-lg border border-slate-800 flex items-center justify-between">
                                <span className="text-slate-400 text-[10px] font-sans">Coğrafya-1</span>
                                <strong className="text-orange-300 text-xs">{String(mock.ayt.details.cografya1.net).replace('.', ',')}</strong>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {renderPaginationControls(safeGeneralPage, totalGeneralPages, filteredGeneralMocks.length, (p) => setCurrentPage(p))}
        </div>
      )}
    </div>
  );
};
