import React from 'react';
import { Clock, ArrowUpRight, Calendar } from 'lucide-react';
import { PaginationControls } from './PaginationControls';

interface SubjectStudyTabProps {
  activeDetailData: any;
  studyPage: number;
  setStudyPage: (p: number) => void;
  formatMinutes: (mins: number) => string;
  onNavigateTab?: (tab: string, opts?: any) => void;
}

export const SubjectStudyTab: React.FC<SubjectStudyTabProps> = ({
  activeDetailData,
  studyPage,
  setStudyPage,
  formatMinutes,
  onNavigateTab,
}) => {
  const planMins = activeDetailData.matchedPlans.reduce((acc: number, p: any) => {
    if ((p.completedMinutes || 0) > 0) return acc + p.completedMinutes;
    if (p.status === 'completed') return acc + (p.plannedMinutes || 0);
    return acc;
  }, 0);

  const examMins = activeDetailData.matchedBranchExams.reduce((acc: number, b: any) => acc + (b.durationMinutes || 0), 0);

  const videoMins = activeDetailData.matchedVideos.reduce((acc: number, v: any) => {
    if (!v.isWatched) return acc;
    if ((v.durationMinutes || 0) > 0) return acc + v.durationMinutes;
    if (v.playlistVideos && v.playlistVideos.length > 0) {
      return acc + v.playlistVideos.filter((pv: any) => pv.isWatched).reduce((sum: number, pv: any) => sum + (pv.durationMinutes || 0), 0);
    }
    return acc + 30;
  }, 0);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-5 shadow-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <Clock className="w-5 h-5 text-indigo-400" />
            <span>Ders Çalışma Süreleri ve Program Oturumları</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Çalışma programı, branş denemeleri ve izlenen video derslerin toplam süre dökümü
          </p>
        </div>
        {onNavigateTab && (
          <button
            onClick={() => onNavigateTab('planner')}
            className="text-xs bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 px-3 py-1.5 rounded-xl font-semibold flex items-center space-x-1.5 transition-all cursor-pointer"
          >
            <span>Çalışma Planı</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Study Time Source Breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-850 text-center">
          <div className="text-[10px] text-slate-400 font-bold uppercase">Program Çalışması</div>
          <div className="text-lg font-black text-indigo-400 font-mono mt-1">{formatMinutes(planMins)}</div>
        </div>

        <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-850 text-center">
          <div className="text-[10px] text-slate-400 font-bold uppercase">Branş Denemeleri</div>
          <div className="text-lg font-black text-amber-400 font-mono mt-1">{formatMinutes(examMins)}</div>
        </div>

        <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-850 text-center">
          <div className="text-[10px] text-slate-400 font-bold uppercase">Video Dersler</div>
          <div className="text-lg font-black text-rose-400 font-mono mt-1">{formatMinutes(videoMins)}</div>
        </div>

        <div className="bg-slate-950 p-3.5 rounded-2xl border border-indigo-500/30 bg-indigo-500/5 text-center">
          <div className="text-[10px] text-indigo-300 font-bold uppercase">Toplam Süre</div>
          <div className="text-lg font-black text-emerald-400 font-mono mt-1">{formatMinutes(activeDetailData.totalStudyMinutes)}</div>
        </div>
      </div>

      {activeDetailData.matchedPlans.length > 0 ? (
        (() => {
          const plansPerPage = 8;
          const totalPlanPages = Math.ceil(activeDetailData.matchedPlans.length / plansPerPage);
          const paginatedPlans = activeDetailData.matchedPlans.slice((studyPage - 1) * plansPerPage, studyPage * plansPerPage);

          return (
            <>
              <div className="space-y-3">
                {paginatedPlans.map((plan: any) => {
                  const displayMins = (plan.completedMinutes || 0) > 0 
                    ? plan.completedMinutes 
                    : (plan.status === 'completed' ? (plan.plannedMinutes || 0) : 0);

                  let dateLabel = plan.day;
                  if (plan.archived && plan.date) {
                    try {
                      const d = new Date(plan.date);
                      if (!isNaN(d.getTime())) {
                        const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
                        dateLabel = `${d.getDate()} ${months[d.getMonth()]} (${plan.day})`;
                      }
                    } catch (e) {
                      // fallback
                    }
                  }

                  return (
                    <div key={plan.id} className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-2xl flex items-center justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="flex items-center space-x-1 bg-slate-900 border border-slate-800/80 text-[10px] font-bold text-indigo-300 px-2.5 py-0.5 rounded-lg shrink-0">
                            <Calendar className="w-3 h-3 text-indigo-400" />
                            <span>{dateLabel}</span>
                          </div>
                          <span className="text-xs font-bold text-slate-100">{plan.topic}</span>
                          {plan.taskType && (
                            <span className="text-[10px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded font-semibold">
                              {plan.taskType}
                            </span>
                          )}
                        </div>
                        {plan.notes && <p className="text-[11px] text-slate-400 mt-0.5 italic">"{plan.notes}"</p>}
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-bold font-mono text-emerald-400">
                          {displayMins} / {plan.plannedMinutes || 0} dk
                        </div>
                        <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${
                          plan.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {plan.status === 'completed' ? 'Tamamlandı' : 'Bekliyor'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <PaginationControls
                currentPage={studyPage}
                totalPages={totalPlanPages}
                onPageChange={setStudyPage}
              />
            </>
          );
        })()
      ) : (
        <div className="text-center py-8 bg-slate-950/50 rounded-2xl border border-slate-850 text-xs text-slate-400 italic">
          Bu ders için planlanmış çalışma oturumu bulunmuyor.
        </div>
      )}
    </div>
  );
};
