import React from 'react';
import { CheckCircle2, ArrowUpRight, Check } from 'lucide-react';

interface DashboardDailyRoutinesProps {
  routines: any[];
  todayDayName: string;
  todaysCompletedCount: number;
  todaysRoutinesCount: number;
  overallPercent: number;
  onToggleRoutineDay: (routineId: string, dayName: string) => void;
  onNavigateTab: (tab: any) => void;
}

export const DashboardDailyRoutines: React.FC<DashboardDailyRoutinesProps> = ({
  routines,
  todayDayName,
  todaysCompletedCount,
  todaysRoutinesCount,
  overallPercent,
  onToggleRoutineDay,
  onNavigateTab
}) => {
  return (
    <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-xl space-y-4">
      <div className="flex flex-row items-center justify-between gap-2">
        <div className="flex items-center space-x-2 sm:space-x-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs sm:text-base font-bold text-white flex items-center space-x-1.5 truncate">
              <span className="truncate">Günlük Rutin Özeti</span>
              <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded-md shrink-0">
                {todayDayName}
              </span>
            </h3>
            <p className="text-[11px] text-slate-400 hidden md:block truncate">
              Bugün için tanımlı rutinler ve tek tıkla tamamlama listesi
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
          <div className="hidden lg:flex items-center space-x-3 text-xs">
            <span className="text-slate-400">Bugün: <strong className="text-white font-mono">{todaysCompletedCount}/{todaysRoutinesCount}</strong></span>
            <span className="text-slate-400">Haftalık: <strong className="text-emerald-400 font-mono">%{overallPercent}</strong></span>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('routines')}
            className="text-xs bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 px-3.5 py-2 sm:px-3 sm:py-1.5 rounded-xl font-semibold flex items-center space-x-1 transition-all cursor-pointer shrink-0 whitespace-nowrap min-h-[38px] sm:min-h-0"
          >
            <span>Tüm Rutinler</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {routines.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
          {routines.map((r) => {
            const isDoneToday = r.completedDays?.includes(todayDayName);
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => onToggleRoutineDay(r.id, todayDayName)}
                className={`flex items-center justify-between text-xs p-4 sm:p-3.5 rounded-2xl border text-left transition-all cursor-pointer active:scale-[0.98] min-h-[56px] sm:min-h-0 ${
                  isDoneToday
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-white/5 hover:bg-white/10 border-white/5 text-slate-300'
                }`}
              >
                <div className="flex items-center space-x-3 min-w-0 mr-2.5 flex-1">
                  <div className={`w-6 h-6 sm:w-5 sm:h-5 rounded-full flex items-center justify-center border transition-all shrink-0 ${
                    isDoneToday 
                      ? 'bg-emerald-500 border-emerald-400 text-slate-950 shadow-sm shadow-emerald-500/30' 
                      : 'bg-slate-800 border-slate-700 text-slate-500'
                  }`}>
                    {isDoneToday && <Check className="w-3.5 h-3.5 sm:w-3 sm:h-3 stroke-[3]" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="font-semibold block text-sm sm:text-sm text-slate-100 leading-snug break-normal">{r.title}</span>
                    {r.target && <span className="text-xs sm:text-[11px] text-slate-400 block mt-0.5 font-medium leading-tight">{r.target}</span>}
                  </div>
                </div>
                <span className={`text-[10px] sm:text-[9.5px] px-3 py-1.5 sm:px-2.5 sm:py-1 rounded-full font-bold shrink-0 ${
                  isDoneToday 
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                    : 'bg-slate-800 text-slate-500 border border-slate-700'
                }`}>
                  {isDoneToday ? 'Tamamlandı' : 'Yapılmadı'}
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-slate-400 italic text-center py-2">Henüz eklentisi yapılmış bir rutin bulunmuyor.</p>
      )}
    </div>
  );
};
