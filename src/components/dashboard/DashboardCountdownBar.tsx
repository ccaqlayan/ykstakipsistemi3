import React from 'react';
import { Timer, Calendar } from 'lucide-react';

interface DashboardCountdownBarProps {
  daysLeft: number;
  timeBreakdown: { months: number; days: number };
}

export const DashboardCountdownBar: React.FC<DashboardCountdownBarProps> = ({
  daysLeft,
  timeBreakdown
}) => {
  return (
    <div 
      className="bg-slate-900/90 backdrop-blur-md border border-indigo-500/20 rounded-2xl px-3 py-2.5 sm:px-4 sm:py-3 shadow-lg flex items-center justify-between gap-2 sm:gap-4 relative z-40 group cursor-pointer flex-nowrap whitespace-nowrap"
      title={`Sınav Tarihi: 19 Haziran 2027 • Kalan Süre: ${timeBreakdown.months} Ay ${timeBreakdown.days} Gün (Toplam ${daysLeft} Gün)`}
    >
      <div className="flex items-center space-x-2 sm:space-x-3 shrink min-w-0 overflow-hidden">
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
          <Timer className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-pulse" />
        </div>
        <span className="text-xs sm:text-sm font-semibold text-slate-200 truncate whitespace-nowrap">
          YKS Sınavına Kalan Süre:
        </span>
      </div>

      <div className="relative shrink-0">
        <div className="flex items-center space-x-1.5 sm:space-x-2 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 sm:px-3.5 sm:py-1 rounded-xl shrink-0 group-hover:bg-emerald-500/20 group-hover:border-emerald-400/50 transition-all">
          <span className="text-sm sm:text-lg font-black text-emerald-400 font-mono">{daysLeft}</span>
          <span className="text-[10px] sm:text-xs font-bold text-emerald-300 uppercase">GÜN</span>
        </div>

        <div className="absolute right-0 top-full mt-2 hidden group-hover:flex flex-col bg-slate-950 border border-emerald-500/40 p-3 rounded-2xl shadow-2xl z-50 min-w-[220px] pointer-events-none animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider mb-1 flex items-center space-x-1">
            <Calendar className="w-3.5 h-3.5 text-emerald-400" />
            <span>Sınav Detayı</span>
          </div>
          <div className="text-xs font-medium text-slate-200">
            Sınav Tarihi: <span className="font-bold text-white">19 Haziran 2027</span>
          </div>
          <div className="text-xs font-medium text-slate-200 mt-1">
            Kalan Süre: <span className="font-bold text-emerald-300">{timeBreakdown.months} Ay {timeBreakdown.days} Gün</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1 pt-1 border-t border-slate-800">
            Toplam {daysLeft} gün kaldı
          </div>
        </div>
      </div>
    </div>
  );
};
