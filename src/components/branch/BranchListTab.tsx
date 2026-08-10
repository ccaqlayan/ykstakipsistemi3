import React from 'react';
import { 
  Target, 
  CheckCircle2, 
  Clock, 
  Edit2, 
  Trash2, 
  ChevronLeft, 
  ChevronRight 
} from 'lucide-react';
import { BranchExam } from '../../types';

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
};
