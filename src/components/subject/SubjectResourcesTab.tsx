import React from 'react';
import { BookOpen, ArrowUpRight } from 'lucide-react';
import { PaginationControls } from './PaginationControls';

interface SubjectResourcesTabProps {
  activeDetailData: any;
  resourcePage: number;
  setResourcePage: (p: number) => void;
  onNavigateTab?: (tab: string, opts?: any) => void;
}

export const SubjectResourcesTab: React.FC<SubjectResourcesTabProps> = ({
  activeDetailData,
  resourcePage,
  setResourcePage,
  onNavigateTab,
}) => {
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            <span>Ders Kaynakları ve Kitap İlerlemeleri</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Bu derse ait soru bankaları ve test kitaplarının ünite tamamlama takibi
          </p>
        </div>
        {onNavigateTab && (
          <button
            onClick={() => onNavigateTab('resources')}
            className="text-xs bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 px-3 py-1.5 rounded-xl font-semibold flex items-center space-x-1.5 transition-all cursor-pointer"
          >
            <span>Kaynak Yönetimi</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {activeDetailData.matchedResources.length > 0 ? (
        (() => {
          const resPerPage = 6;
          const totalResPages = Math.ceil(activeDetailData.matchedResources.length / resPerPage);
          const paginatedResources = activeDetailData.matchedResources.slice((resourcePage - 1) * resPerPage, resourcePage * resPerPage);

          return (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {paginatedResources.map((res: any) => {
                  const percent = res.totalUnits > 0 ? Math.round((res.completedUnits / res.totalUnits) * 100) : 0;
                  return (
                    <div key={res.id} className="bg-slate-950/70 border border-slate-800 p-4 rounded-2xl space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">{res.publisher}</span>
                          <h4 className="text-sm font-bold text-white">{res.bookTitle}</h4>
                        </div>
                        <span className="text-[10px] font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 px-2 py-0.5 rounded-md">
                          {res.examType}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-slate-400">
                          <span>Çözülen Test / Ünite</span>
                          <span className="font-bold text-white">{res.completedUnits} / {res.totalUnits} (%{percent})</span>
                        </div>
                        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                          <div style={{ width: `${percent}%` }} className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full" />
                        </div>
                      </div>
                      {res.notes && (
                        <p className="text-xs text-slate-400 italic bg-slate-900/50 p-2 rounded-xl border border-slate-800">
                          "{res.notes}"
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
              <PaginationControls
                currentPage={resourcePage}
                totalPages={totalResPages}
                onPageChange={setResourcePage}
              />
            </>
          );
        })()
      ) : (
        <div className="text-center py-10 bg-slate-950/50 rounded-2xl border border-slate-850">
          <BookOpen className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <p className="text-xs text-slate-400 italic">Bu ders için eklenmiş bir kaynak bulunmuyor.</p>
        </div>
      )}
    </div>
  );
};
