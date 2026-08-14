import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, ArrowDown, ArrowUp, CheckCircle2, Pencil, Clock, SlidersHorizontal, 
  ChevronDown, Calculator, Trash2, Search, Sparkles, Globe, Filter,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {paginatedInstitutionalMocks.map((exam) => {
                  const dateInfo = formatMockDate(exam.examDate);
                  const displayScores = [];
                  if (exam.scores.sayScore !== undefined) {
                    displayScores.push({ label: 'SAY', score: exam.scores.sayScore, rank: exam.scores.sayClassRank, total: exam.scores.sayClassTotal });
                  }
                  if (exam.scores.eaScore !== undefined) {
                    displayScores.push({ label: 'EA', score: exam.scores.eaScore, rank: exam.scores.eaClassRank, total: exam.scores.eaClassTotal });
                  }
                  if (exam.scores.sozScore !== undefined) {
                    displayScores.push({ label: 'SÖZ', score: exam.scores.sozScore, rank: exam.scores.sozClassRank, total: exam.scores.sozClassTotal });
                  }

                  return (
                    <div
                      key={exam.id}
                      className="bg-slate-950/80 border border-slate-800/80 rounded-3xl p-5 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4 animate-fade-in relative group shadow-sm hover:shadow-lg"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-mono font-bold text-slate-300 bg-slate-900 px-2.5 py-1 rounded-xl border border-slate-800 cursor-help" title={dateInfo.full}>
                            {dateInfo.short}
                          </span>
                          <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-xl border border-indigo-500/20 uppercase">
                            {exam.examType || 'Kurumsal'}
                          </span>
                        </div>

                        <h3 className="text-sm font-black text-white mt-3 line-clamp-2">
                          {exam.examTitle}
                        </h3>

                        {exam.scores.classParticipantCount && (
                          <p className="text-[11px] text-slate-400 font-semibold mt-1.5 flex items-center space-x-1 font-mono">
                            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Katılımcı Sayısı: {exam.scores.classParticipantCount} Öğrenci</span>
                          </p>
                        )}

                        {displayScores.length > 0 && (
                          <div className="grid grid-cols-3 gap-2 mt-4">
                            {displayScores.map((sc, idx) => (
                              <div key={idx} className="bg-slate-900/80 border border-slate-800/60 rounded-2xl p-2.5 text-center">
                                <span className="text-[10px] text-slate-400 font-bold block">{sc.label} Puanı</span>
                                <strong className="text-indigo-300 text-sm font-mono block mt-0.5">{sc.score}</strong>
                                {sc.rank && (
                                  <span className="text-[9px] text-emerald-400 font-mono mt-0.5 block">Sıra: {sc.rank} / {sc.total || '-'}</span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="pt-3 border-t border-slate-900/60 flex items-center justify-between gap-2">
                        <div className="text-[11px] text-slate-500 font-medium truncate">
                          {exam.studentName} {exam.schoolNumber ? `(#${exam.schoolNumber})` : ''}
                        </div>

                        <button
                          type="button"
                          onClick={() => setSelectedInstitutionalExam(exam)}
                          className="bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-bold px-4 py-2 rounded-2xl transition-all cursor-pointer flex items-center space-x-1.5 shadow-sm"
                        >
                          <GraduationCap className="w-4 h-4" />
                          <span>Karnemi Görüntüle</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
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
          <div className="space-y-3">
            {paginatedGeneralMocks.map((mock) => {
            const dateInfo = formatMockDate(mock.date);
            const type = getEffectiveMockExamType(mock);

            return (
              <div
                key={mock.id}
                className="bg-slate-950/80 border border-slate-800/80 rounded-3xl p-4 hover:border-slate-700 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4 animate-fade-in shadow-sm hover:shadow-lg"
              >
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-300 bg-slate-900 px-2.5 py-1 rounded-xl border border-slate-800 cursor-help" title={dateInfo.full}>
                      {dateInfo.short}
                    </span>

                    <span className={`text-xs font-black px-2.5 py-1 rounded-xl border uppercase tracking-wider ${
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
                      {type === 'DIL' ? 'DİL (YDT)' : type === 'TYT_DIL' ? 'TYT + DİL' : type === 'AYT' ? 'AYT' : type === 'TYT_AYT' ? 'TYT + AYT' : 'TYT'}
                    </span>

                    {mock.estimatedRank && (
                      <span className="text-xs font-mono font-black text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-xl flex items-center space-x-1" title="Tahmini YKS Sıralaması">
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        <span>#{new Intl.NumberFormat('tr-TR').format(mock.estimatedRank)}</span>
                      </span>
                    )}

                    <h3 className="text-sm font-extrabold text-white ml-1 break-words">
                      {mock.title}
                    </h3>
                  </div>

                {mock.notes && (
                  <p className="text-xs text-slate-400 mt-1 italic">{mock.notes}</p>
                )}

                {/* TYT & AYT & YDT Breakdown */}
                <div className="flex flex-wrap gap-2 text-[11px] text-slate-300 mt-2 font-mono">
                  {/* TYT Summary */}
                  {(mock.tyt.totalNet > 0 || type === 'TYT' || type === 'TYT_AYT' || type === 'TYT_DIL') && (
                    <span className="bg-slate-900 px-2 py-1 rounded border border-slate-800">
                      <span className="text-indigo-400 font-bold mr-1">TYT</span>
                      TÜR: <strong>{String(mock.tyt.turkce).replace('.', ',')}</strong> | MAT: <strong>{String(mock.tyt.mat).replace('.', ',')}</strong> | SOS: <strong>{String(mock.tyt.sosyal).replace('.', ',')}</strong> | FEN: <strong>{String(mock.tyt.fen).replace('.', ',')}</strong>
                    </span>
                  )}

                  {/* AYT Summary */}
                  {(mock.ayt.totalNet > 0 || type === 'AYT' || type === 'TYT_AYT') && (
                    <span className="bg-slate-900 px-2 py-1 rounded border border-slate-800">
                      <span className="text-emerald-400 font-bold mr-1">AYT</span>
                      MAT: <strong>{String(mock.ayt.mat).replace('.', ',')}</strong> | FEN: <strong>{String(mock.ayt.fen).replace('.', ',')}</strong>
                      {mock.ayt.edebiyatSos1 !== undefined && mock.ayt.edebiyatSos1 > 0 && (
                        <> | EDB-SOS1: <strong>{String(mock.ayt.edebiyatSos1).replace('.', ',')}</strong></>
                      )}
                      {mock.ayt.sos2 !== undefined && mock.ayt.sos2 > 0 && (
                        <> | SOS2: <strong>{String(mock.ayt.sos2).replace('.', ',')}</strong></>
                      )}
                    </span>
                  )}

                  {/* YDT Summary */}
                  {(mock.ydt?.net !== undefined && (mock.ydt.net > 0 || type === 'DIL' || type === 'TYT_DIL')) && (
                    <span className="bg-slate-900 px-2 py-1 rounded border border-slate-800 flex items-center gap-1">
                      <Globe className="w-3 h-3 text-sky-400" />
                      <span className="text-sky-400 font-bold mr-1">{mock.ydt.language || 'YDT'}</span>
                      <strong>{String(mock.ydt.net).replace('.', ',')} Net</strong>
                      {(mock.ydt.correct !== undefined || mock.ydt.wrong !== undefined) && (
                        <span className="text-[10px] text-slate-500 ml-1">({mock.ydt.correct ?? 0}D {mock.ydt.wrong ?? 0}Y)</span>
                      )}
                    </span>
                  )}
                </div>

                {/* Granular Sub-subject Breakdown Accordion Toggle */}
                {(mock.tyt.details || mock.ayt.details) && (
                  <div>
                    <button
                      type="button"
                      onClick={() => toggleExpandMockDetails(mock.id)}
                      className="mt-2 text-[11px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <SlidersHorizontal className="w-3 h-3 text-indigo-400" />
                      <span>{expandedMockDetails[mock.id] ? 'Ayrıntılı Ders Detaylarını Gizle' : 'Ayrıntılı Ders Detaylarını Göster (Mat/Geo, Fiz/Kim/Biyo...)'}</span>
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expandedMockDetails[mock.id] ? 'rotate-180' : ''}`} />
                    </button>

                    {expandedMockDetails[mock.id] && (
                      <div className="mt-2.5 p-3 bg-slate-900/90 border border-slate-800/80 rounded-xl space-y-3 text-[11px] font-mono animate-fade-in">
                        {/* TYT Sub-subjects */}
                        {mock.tyt.details && (
                          <div>
                            <div className="text-[11px] font-bold text-indigo-400 mb-1.5 flex items-center gap-1">
                              <span>TYT Alt Ders Netleri</span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 text-slate-300">
                              {mock.tyt.details.matematik && (
                                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                                  <span className="text-slate-400 block text-[10px]">Matematik</span>
                                  <strong className="text-indigo-300 text-xs">{String(mock.tyt.details.matematik.net).replace('.', ',')} Net</strong>
                                  {mock.tyt.details.matematik.correct !== undefined && (
                                    <span className="text-[10px] text-slate-500 block">({mock.tyt.details.matematik.correct}D {mock.tyt.details.matematik.wrong}Y)</span>
                                  )}
                                </div>
                              )}
                              {mock.tyt.details.geometri && (
                                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                                  <span className="text-slate-400 block text-[10px]">Geometri</span>
                                  <strong className="text-purple-300 text-xs">{String(mock.tyt.details.geometri.net).replace('.', ',')} Net</strong>
                                  {mock.tyt.details.geometri.correct !== undefined && (
                                    <span className="text-[10px] text-slate-500 block">({mock.tyt.details.geometri.correct}D {mock.tyt.details.geometri.wrong}Y)</span>
                                  )}
                                </div>
                              )}
                              {mock.tyt.details.fizik && (
                                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                                  <span className="text-slate-400 block text-[10px]">Fizik</span>
                                  <strong className="text-sky-300 text-xs">{String(mock.tyt.details.fizik.net).replace('.', ',')} Net</strong>
                                  {mock.tyt.details.fizik.correct !== undefined && (
                                    <span className="text-[10px] text-slate-500 block">({mock.tyt.details.fizik.correct}D {mock.tyt.details.fizik.wrong}Y)</span>
                                  )}
                                </div>
                              )}
                              {mock.tyt.details.kimya && (
                                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                                  <span className="text-slate-400 block text-[10px]">Kimya</span>
                                  <strong className="text-teal-300 text-xs">{String(mock.tyt.details.kimya.net).replace('.', ',')} Net</strong>
                                  {mock.tyt.details.kimya.correct !== undefined && (
                                    <span className="text-[10px] text-slate-500 block">({mock.tyt.details.kimya.correct}D {mock.tyt.details.kimya.wrong}Y)</span>
                                  )}
                                </div>
                              )}
                              {mock.tyt.details.biyoloji && (
                                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                                  <span className="text-slate-400 block text-[10px]">Biyoloji</span>
                                  <strong className="text-emerald-300 text-xs">{String(mock.tyt.details.biyoloji.net).replace('.', ',')} Net</strong>
                                  {mock.tyt.details.biyoloji.correct !== undefined && (
                                    <span className="text-[10px] text-slate-500 block">({mock.tyt.details.biyoloji.correct}D {mock.tyt.details.biyoloji.wrong}Y)</span>
                                  )}
                                </div>
                              )}
                              {mock.tyt.details.tarih && (
                                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                                  <span className="text-slate-400 block text-[10px]">Tarih</span>
                                  <strong className="text-amber-300 text-xs">{String(mock.tyt.details.tarih.net).replace('.', ',')} Net</strong>
                                </div>
                              )}
                              {mock.tyt.details.cografya && (
                                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                                  <span className="text-slate-400 block text-[10px]">Coğrafya</span>
                                  <strong className="text-orange-300 text-xs">{String(mock.tyt.details.cografya.net).replace('.', ',')} Net</strong>
                                </div>
                              )}
                              {mock.tyt.details.felsefe && (
                                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                                  <span className="text-slate-400 block text-[10px]">Felsefe</span>
                                  <strong className="text-fuchsia-300 text-xs">{String(mock.tyt.details.felsefe.net).replace('.', ',')} Net</strong>
                                </div>
                              )}
                              {mock.tyt.details.din && (
                                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                                  <span className="text-slate-400 block text-[10px]">Din Kültürü</span>
                                  <strong className="text-pink-300 text-xs">{String(mock.tyt.details.din.net).replace('.', ',')} Net</strong>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* AYT Sub-subjects */}
                        {mock.ayt.details && (
                          <div>
                            <div className="text-[11px] font-bold text-emerald-400 mb-1.5 flex items-center gap-1">
                              <span>AYT Alt Ders Netleri</span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 text-slate-300">
                              {mock.ayt.details.matematik && (
                                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                                  <span className="text-slate-400 block text-[10px]">AYT Matematik</span>
                                  <strong className="text-purple-300 text-xs">{String(mock.ayt.details.matematik.net).replace('.', ',')} Net</strong>
                                  {mock.ayt.details.matematik.correct !== undefined && (
                                    <span className="text-[10px] text-slate-500 block">({mock.ayt.details.matematik.correct}D {mock.ayt.details.matematik.wrong}Y)</span>
                                  )}
                                </div>
                              )}
                              {mock.ayt.details.geometri && (
                                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                                  <span className="text-slate-400 block text-[10px]">AYT Geometri</span>
                                  <strong className="text-fuchsia-300 text-xs">{String(mock.ayt.details.geometri.net).replace('.', ',')} Net</strong>
                                  {mock.ayt.details.geometri.correct !== undefined && (
                                    <span className="text-[10px] text-slate-500 block">({mock.ayt.details.geometri.correct}D {mock.ayt.details.geometri.wrong}Y)</span>
                                  )}
                                </div>
                              )}
                              {mock.ayt.details.fizik && (
                                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                                  <span className="text-slate-400 block text-[10px]">AYT Fizik</span>
                                  <strong className="text-sky-300 text-xs">{String(mock.ayt.details.fizik.net).replace('.', ',')} Net</strong>
                                  {mock.ayt.details.fizik.correct !== undefined && (
                                    <span className="text-[10px] text-slate-500 block">({mock.ayt.details.fizik.correct}D {mock.ayt.details.fizik.wrong}Y)</span>
                                  )}
                                </div>
                              )}
                              {mock.ayt.details.kimya && (
                                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                                  <span className="text-slate-400 block text-[10px]">AYT Kimya</span>
                                  <strong className="text-teal-300 text-xs">{String(mock.ayt.details.kimya.net).replace('.', ',')} Net</strong>
                                  {mock.ayt.details.kimya.correct !== undefined && (
                                    <span className="text-[10px] text-slate-500 block">({mock.ayt.details.kimya.correct}D {mock.ayt.details.kimya.wrong}Y)</span>
                                  )}
                                </div>
                              )}
                              {mock.ayt.details.biyoloji && (
                                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                                  <span className="text-slate-400 block text-[10px]">AYT Biyoloji</span>
                                  <strong className="text-emerald-300 text-xs">{String(mock.ayt.details.biyoloji.net).replace('.', ',')} Net</strong>
                                  {mock.ayt.details.biyoloji.correct !== undefined && (
                                    <span className="text-[10px] text-slate-500 block">({mock.ayt.details.biyoloji.correct}D {mock.ayt.details.biyoloji.wrong}Y)</span>
                                  )}
                                </div>
                              )}
                              {mock.ayt.details.edebiyat && (
                                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                                  <span className="text-slate-400 block text-[10px]">Edebiyat</span>
                                  <strong className="text-rose-300 text-xs">{String(mock.ayt.details.edebiyat.net).replace('.', ',')} Net</strong>
                                </div>
                              )}
                              {mock.ayt.details.tarih1 && (
                                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                                  <span className="text-slate-400 block text-[10px]">Tarih-1</span>
                                  <strong className="text-amber-300 text-xs">{String(mock.ayt.details.tarih1.net).replace('.', ',')} Net</strong>
                                </div>
                              )}
                              {mock.ayt.details.cografya1 && (
                                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                                  <span className="text-slate-400 block text-[10px]">Coğrafya-1</span>
                                  <strong className="text-orange-300 text-xs">{String(mock.ayt.details.cografya1.net).replace('.', ',')} Net</strong>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Totals & Actions (Right Bottom Area) */}
              <div className="flex flex-wrap items-center justify-between lg:justify-end gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-800/80 w-full lg:w-auto">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  {(mock.tyt.totalNet > 0 || type === 'TYT' || type === 'TYT_AYT' || type === 'TYT_DIL') && (
                    <div className="text-center px-2 sm:px-3">
                      <div className="text-[10px] text-slate-400">TYT Toplam</div>
                      <div className="text-base sm:text-lg font-bold text-indigo-400 font-mono">{String(mock.tyt.totalNet).replace('.', ',')}</div>
                    </div>
                  )}

                  {(mock.ayt.totalNet > 0 || type === 'AYT' || type === 'TYT_AYT') && (
                    <div className="text-center px-2 sm:px-3 border-l border-slate-800">
                      <div className="text-[10px] text-slate-400">AYT Toplam</div>
                      <div className="text-base sm:text-lg font-bold text-emerald-400 font-mono">{String(mock.ayt.totalNet).replace('.', ',')}</div>
                    </div>
                  )}

                  {(mock.ydt?.net !== undefined && (mock.ydt.net > 0 || type === 'DIL' || type === 'TYT_DIL')) && (
                    <div className="text-center px-2 sm:px-3 border-l border-slate-800">
                      <div className="text-[10px] text-sky-400">YDT Toplam</div>
                      <div className="text-base sm:text-lg font-bold text-sky-300 font-mono">{String(mock.ydt.net).replace('.', ',')}</div>
                    </div>
                  )}

                  {mock.estimatedRank && (
                    <div className="text-center px-2 sm:px-3 border-l border-slate-800">
                      <div className="text-[10px] text-slate-400">Tahmini Sıra</div>
                      <div className="text-xs sm:text-sm font-bold text-amber-400 font-mono">#{mock.estimatedRank}</div>
                    </div>
                  )}
                </div>

                {/* Sağ Alt Köşe Aksiyon Butonları */}
                <div className="flex items-center space-x-2 shrink-0">
                  {/* Analiz Edildi / Bekliyor Butonu */}
                  <button
                    type="button"
                    onClick={() => onUpdateMock({ ...mock, isAnalyzed: !mock.isAnalyzed })}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all inline-flex items-center space-x-1.5 cursor-pointer border shadow-sm ${
                      mock.isAnalyzed
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25'
                        : 'bg-amber-500/15 text-amber-300 border-amber-500/30 hover:bg-amber-500/25'
                    }`}
                    title="Soru ve hata analiz durumunu değiştirmek için tıklayın"
                  >
                    {mock.isAnalyzed ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Analiz Edildi</span>
                      </>
                    ) : (
                      <>
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        <span>Bekliyor</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      setCalcMock(mock);
                      setShowAllFields(false);
                    }}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 cursor-pointer shadow-sm"
                    title="YKS Puan & Sıralama Hesapla"
                  >
                    <Calculator className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Puan Hesapla</span>
                  </button>

                  <button
                    onClick={() => setDeletingMock({ id: mock.id, title: `${mock.date} - ${mock.title}` })}
                    className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
                    title="Denemeyi Sil"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        </div>

        {/* Individual Pagination Controls */}
        {renderPaginationControls(safeGeneralPage, totalGeneralPages, filteredGeneralMocks.length, (p) => setCurrentPage(p))}
      </div>
      )}
    </div>
  );
};
