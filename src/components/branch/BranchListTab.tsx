import React, { useState, useEffect } from 'react';
import { 
  Target, 
  CheckCircle2, 
  Clock, 
  Edit2, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  Search,
  X,
  FileText,
  Filter,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { BranchExam } from '../../types';
import { YKS_SUBJECTS } from '../../data/initialData';

const SUBJECT_COLORS: Record<string, string> = {
  'TYT Türkçe': '#2563eb',
  'TYT Matematik': '#10b981',
  'TYT Geometri': '#f97316',
  'TYT Fizik': '#ef4444',
  'TYT Kimya': '#06b6d4',
  'TYT Biyoloji': '#84cc16',
  'TYT Tarih': '#b45309',
  'TYT Coğrafya': '#3b82f6',
  'TYT Felsefe': '#64748b',
  'TYT Din Kültürü': '#14b8a6',
  'Paragraf': '#db2777',
  'AYT Matematik': '#6366f1',
  'AYT Geometri': '#eab308',
  'AYT Fizik': '#dc2626',
  'AYT Kimya': '#0d9488',
  'AYT Biyoloji': '#22c55e',
  'AYT Edebiyat': '#f43f5e',
  'AYT Tarih-1': '#7c3aed',
  'AYT Tarih-2': '#9333ea',
  'AYT Coğrafya-1': '#0284c7',
  'AYT Coğrafya-2': '#0284c7',
  'AYT Felsefe Grubu': '#c026d3',
};

const DEFAULT_PALETTE = ['#2563eb', '#10b981', '#f97316', '#ef4444', '#06b6d4', '#6366f1', '#eab308', '#dc2626'];

const getSubjectColor = (subj: string) => {
  return SUBJECT_COLORS[subj] || DEFAULT_PALETTE[0];
};

const formatBranchDate = (dateStr?: string) => {
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

interface BranchListTabProps {
  branchExams: BranchExam[];
  listSubjectFilter: string;
  setListSubjectFilter: (val: string) => void;
  listCurrentPage: number;
  setListCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  onUpdateBranchExam?: (exam: BranchExam) => void;
  handleOpenEditExamModal: (exam: BranchExam) => void;
  setDeletingItem: (item: { type: 'error' | 'exam'; id: string; title: string }) => void;
}

export const BranchListTab: React.FC<BranchListTabProps> = ({
  branchExams,
  listSubjectFilter,
  setListSubjectFilter,
  listCurrentPage,
  setListCurrentPage,
  onUpdateBranchExam,
  handleOpenEditExamModal,
  setDeletingItem,
}) => {
  const [filterExamType, setFilterExamType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [pageSize, setPageSize] = useState<number>(20);

  // Reset pagination when filters change
  useEffect(() => {
    setListCurrentPage(1);
  }, [listSubjectFilter, filterExamType, searchQuery, pageSize, setListCurrentPage]);

  // Compute unique subjects
  const enteredSubjects = Array.from(new Set(branchExams.map(ex => ex.subject)))
    .filter((s): s is string => Boolean(s))
    .sort((a, b) => a.localeCompare(b, 'tr'));

  // Filter exams
  const filteredExams = branchExams.filter((ex) => {
    if (filterExamType !== 'ALL' && ex.examType !== filterExamType) return false;
    if (listSubjectFilter !== 'ALL' && ex.subject !== listSubjectFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchSubj = (ex.subject || '').toLowerCase().includes(q);
      const matchPub = (ex.publisher || '').toLowerCase().includes(q);
      const matchNotes = (ex.notes || '').toLowerCase().includes(q);
      const matchDate = (ex.date || '').toLowerCase().includes(q);
      if (!matchSubj && !matchPub && !matchNotes && !matchDate) return false;
    }
    return true;
  });

  // Sort descending by date
  const sortedExams = [...filteredExams].sort((a, b) => 
    (b.date || '').localeCompare(a.date || '')
  );

  // Pagination calculations
  const totalLogs = sortedExams.length;
  const totalPages = Math.ceil(totalLogs / pageSize) || 1;
  const safePage = Math.min(Math.max(1, listCurrentPage), totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalLogs);
  const paginatedExams = sortedExams.slice(startIndex, endIndex);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-md space-y-4">
      
      {/* Table Header & Controls Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">Çözülen Branş Denemeleri Geçmişi</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Toplam <strong className="text-indigo-300 font-mono">{branchExams.length}</strong> branş denemesi kaydı bulunuyor
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {/* Live Search */}
          <div className="relative flex-1 sm:flex-initial min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 sm:top-2.5" />
            <input
              type="text"
              placeholder="Yayın, ders veya not ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-2xl pl-9 pr-8 py-2.5 sm:py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-all min-h-[44px] sm:min-h-0"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-3 sm:top-2.5 text-slate-500 hover:text-white p-0.5">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Exam Type Filter */}
          <select
            value={filterExamType}
            onChange={(e) => setFilterExamType(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-200 rounded-2xl px-3.5 py-2.5 sm:py-1.5 focus:outline-none cursor-pointer min-h-[44px] sm:min-h-0"
          >
            <option value="ALL">Tüm Sınavlar</option>
            <option value="TYT">Sadece TYT</option>
            <option value="AYT">Sadece AYT</option>
          </select>

          {/* Subject Filter Dropdown */}
          <select
            value={listSubjectFilter}
            onChange={(e) => setListSubjectFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-200 rounded-2xl px-3.5 py-2.5 sm:py-1.5 focus:outline-none cursor-pointer min-h-[44px] sm:min-h-0 max-w-[210px] truncate"
          >
            <option value="ALL">Tüm Dersler ({branchExams.length})</option>
            {enteredSubjects.map((sub) => {
              const count = branchExams.filter(e => e.subject === sub).length;
              return (
                <option key={sub} value={sub}>{sub} ({count})</option>
              );
            })}
          </select>

          {/* Page Size Dropdown */}
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-200 rounded-2xl px-3.5 py-2.5 sm:py-1.5 focus:outline-none cursor-pointer min-h-[44px] sm:min-h-0"
          >
            <option value={10}>10 Kayıt</option>
            <option value={20}>20 Kayıt</option>
            <option value={50}>50 Kayıt</option>
            <option value={100}>100 Kayıt</option>
          </select>
        </div>
      </div>

      {/* Table Body or Empty State */}
      {sortedExams.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-slate-800 rounded-2xl space-y-2">
          <HelpCircle className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="text-xs text-slate-400 font-medium">Arama kriterlerine uygun branş denemesi kaydı bulunamadı.</p>
          {(listSubjectFilter !== 'ALL' || filterExamType !== 'ALL' || searchQuery) && (
            <button
              onClick={() => {
                setListSubjectFilter('ALL');
                setFilterExamType('ALL');
                setSearchQuery('');
              }}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer underline inline-block"
            >
              Filtreleri Temizle
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-950/70 text-[11px]">
                  <th className="py-2.5 px-2 rounded-l-2xl whitespace-nowrap">Tarih</th>
                  <th className="py-2.5 px-2 whitespace-nowrap">Ders</th>
                  <th className="py-2.5 px-2">Yayınevi / Yayın Adı</th>
                  <th className="py-2.5 px-2 text-center text-emerald-400 whitespace-nowrap">Doğru</th>
                  <th className="py-2.5 px-2 text-center text-rose-400 whitespace-nowrap">Yanlış</th>
                  <th className="py-2.5 px-2 text-center text-slate-400 whitespace-nowrap">Boş</th>
                  <th className="py-2.5 px-2 text-center text-indigo-400 font-bold whitespace-nowrap">Net</th>
                  <th className="py-2.5 px-2 text-center text-amber-400 whitespace-nowrap">
                    <div className="inline-flex items-center justify-center space-x-1">
                      <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>Süre & Hız</span>
                    </div>
                  </th>
                  <th className="py-2.5 px-2 text-center whitespace-nowrap">Analiz</th>
                  <th className="py-2.5 px-2 text-right rounded-r-2xl whitespace-nowrap">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {paginatedExams.map((ex, index) => {
                  const dateInfo = formatBranchDate(ex.date);
                  const numCorrect = Number(String(ex.correct).replace(',', '.'));
                  const numWrong = Number(String(ex.wrong).replace(',', '.'));
                  const numEmpty = Number(String(ex.empty).replace(',', '.'));
                  const totalSolved = (numCorrect || 0) + (numWrong || 0) + (numEmpty || 0);
                  const durMinutes = ex.durationMinutes || 0;
                  const rowSpeed = (durMinutes > 0 && totalSolved > 0) 
                    ? (durMinutes / totalSolved).toFixed(1) 
                    : null;

                  return (
                    <tr 
                      key={ex.id} 
                      className={`transition-colors hover:bg-slate-800/60 ${
                        index % 2 === 0 ? 'bg-slate-900/40' : 'bg-slate-950/40'
                      }`}
                    >
                      {/* Tarih */}
                      <td className="py-2 px-2 font-mono text-slate-300 cursor-help whitespace-nowrap text-[11px]" title={dateInfo.full}>
                        {dateInfo.short}
                      </td>

                      {/* Ders */}
                      <td className="py-2 px-2 font-semibold text-white text-[11px] whitespace-nowrap">
                        <div className="flex items-center space-x-1.5">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: getSubjectColor(ex.subject) }} />
                          <span>{ex.subject}</span>
                        </div>
                      </td>

                      {/* Yayınevi & Not */}
                      <td className="py-2 px-2 text-slate-200 text-xs">
                        <div className="font-semibold text-slate-200">{ex.publisher || 'Branş Denemesi'}</div>
                        {ex.notes && (
                          <div className="text-[10px] text-slate-400 italic truncate max-w-[220px]" title={ex.notes}>
                            {ex.notes}
                          </div>
                        )}
                      </td>

                      {/* Doğru / Yanlış / Boş / Net */}
                      <td className="py-2 px-2 text-center font-mono text-emerald-400 font-bold text-xs">{String(ex.correct).replace('.', ',')}</td>
                      <td className="py-2 px-2 text-center font-mono text-rose-400 font-semibold text-xs">{String(ex.wrong).replace('.', ',')}</td>
                      <td className="py-2 px-2 text-center font-mono text-slate-500 text-xs">{String(ex.empty).replace('.', ',')}</td>
                      <td className="py-2 px-2 text-center font-mono text-indigo-300 font-extrabold text-xs">{String(ex.net).replace('.', ',')}</td>

                      {/* Süre & Hız */}
                      <td className="py-2 px-2 text-center font-mono text-amber-300 whitespace-nowrap">
                        {durMinutes > 0 ? (
                          <span className="inline-flex items-center space-x-1 bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2 py-0.5 rounded-lg text-[10px] font-semibold" title={rowSpeed ? `Hız: ${rowSpeed} dk/soru` : ''}>
                            <span>{durMinutes} dk</span>
                            {rowSpeed && <span className="text-[10px] text-amber-400/80 font-mono">({rowSpeed}dk/soru)</span>}
                          </span>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>

                      {/* Analiz Durumu */}
                      <td className="py-2 px-2 text-center whitespace-nowrap">
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
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all inline-flex items-center space-x-1 cursor-pointer border ${
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
                              <span>Bekliyor</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* İşlem Butonları */}
                      <td className="py-2 px-2 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-0.5">
                          <button
                            onClick={() => handleOpenEditExamModal(ex)}
                            className="p-1 rounded-md text-slate-400 hover:text-indigo-300 hover:bg-indigo-500/20 transition-all cursor-pointer"
                            title="Denemeyi Düzenle"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingItem({ type: 'exam', id: ex.id, title: `${ex.date} ${ex.subject} (${ex.publisher || 'Branş Denemesi'})` })}
                            className="p-1 rounded-md text-slate-400 hover:text-rose-400 hover:bg-rose-500/20 transition-all cursor-pointer"
                            title="Denemeyi Sil"
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

          {/* Pagination Controls */}
          {totalLogs > pageSize && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800 text-xs">
              <div className="text-slate-400">
                Toplam <strong className="text-slate-200">{totalLogs}</strong> kayıttan <strong className="text-indigo-400">{startIndex + 1}-{endIndex}</strong> arası gösteriliyor (Sayfa {safePage} / {totalPages})
              </div>

              <div className="flex items-center space-x-1">
                <button
                  disabled={safePage === 1}
                  onClick={() => setListCurrentPage(p => Math.max(1, p - 1))}
                  className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center space-x-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Önceki</span>
                </button>

                <div className="flex items-center space-x-1 px-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pNum) => (
                    <button
                      key={pNum}
                      onClick={() => setListCurrentPage(pNum)}
                      className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        safePage === pNum
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                          : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      {pNum}
                    </button>
                  ))}
                </div>

                <button
                  disabled={safePage === totalPages}
                  onClick={() => setListCurrentPage(p => Math.min(totalPages, p + 1))}
                  className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center space-x-1"
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
};
