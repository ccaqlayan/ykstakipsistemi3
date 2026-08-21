import React from 'react';
import { Timer, Calendar, GraduationCap, Award } from 'lucide-react';
import { GradeLevel, getGradeYksTargetYear } from '../../utils/gradeUtils';

interface DashboardCountdownBarProps {
  daysLeft: number;
  timeBreakdown: { months: number; days: number };
  gradeLevel?: GradeLevel;
  onClick?: () => void;
}

export const DashboardCountdownBar: React.FC<DashboardCountdownBarProps> = ({
  daysLeft,
  timeBreakdown,
  gradeLevel = '12',
  onClick
}) => {
  const isEarlyGrade = gradeLevel === '9' || gradeLevel === '10';
  const isGrade11 = gradeLevel === '11';
  const yksTargetYear = getGradeYksTargetYear(gradeLevel);

  let labelText = 'YKS Sınavına Kalan Süre:';
  let badgeColor = 'emerald';
  let titleDetail = 'YKS Genel Hazırlık & Performans Durumunuzu İnceleyin';

  if (isEarlyGrade) {
    labelText = gradeLevel === '9' 
      ? '9. Sınıf Yazılıları & OBP Maratonu:' 
      : '10. Sınıf Yazılıları & Alan Yönelimi:';
    badgeColor = 'indigo';
    titleDetail = 'Okul yazılı notları ve OBP karne hesaplamanızı inceleyin';
  } else if (isGrade11) {
    labelText = '11. Sınıf Yazılıları & YKS 2027 Temeli:';
    badgeColor = 'sky';
  }

  return (
    <div 
      onClick={onClick}
      className="bg-slate-900/90 backdrop-blur-md border border-indigo-500/20 hover:border-emerald-500/40 rounded-2xl px-3 py-2.5 sm:px-4 sm:py-3 shadow-lg flex items-center justify-between gap-2 sm:gap-4 relative z-40 group cursor-pointer flex-nowrap whitespace-nowrap transition-all hover:bg-slate-850"
      title={`Tıklayarak ${titleDetail}`}
    >
      <div className="flex items-center space-x-2 sm:space-x-3 shrink min-w-0 overflow-hidden">
        <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-${badgeColor}-500/20 border border-${badgeColor}-500/30 text-${badgeColor}-400 flex items-center justify-center shrink-0`}>
          {isEarlyGrade ? (
            <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-pulse" />
          ) : (
            <Timer className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-pulse" />
          )}
        </div>
        <span className="text-xs sm:text-sm font-semibold text-slate-200 truncate whitespace-nowrap">
          {labelText}
        </span>
      </div>

      <div className="relative shrink-0">
        <div className={`flex items-center space-x-1.5 sm:space-x-2 bg-${badgeColor}-500/10 border border-${badgeColor}-500/30 px-2.5 py-1 sm:px-3.5 sm:py-1 rounded-xl shrink-0 group-hover:bg-${badgeColor}-500/20 group-hover:border-${badgeColor}-400/50 transition-all`}>
          <span className={`text-sm sm:text-lg font-black text-${badgeColor}-400 font-mono`}>{daysLeft}</span>
          <span className={`text-[10px] sm:text-xs font-bold text-${badgeColor}-300 uppercase`}>GÜN</span>
        </div>

        <div className="absolute right-0 top-full mt-2 hidden group-hover:flex flex-col bg-slate-950 border border-emerald-500/40 p-3 rounded-2xl shadow-2xl z-50 min-w-[240px] pointer-events-none animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider mb-1 flex items-center space-x-1">
            <Calendar className="w-3.5 h-3.5 text-emerald-400" />
            <span>Sınav & Hedef Detayı</span>
          </div>
          <div className="text-xs font-medium text-slate-200">
            Hedef YKS Yılı: <span className="font-bold text-white">YKS {yksTargetYear}</span>
          </div>
          <div className="text-xs font-medium text-slate-200 mt-1">
            Kalan Süre: <span className="font-bold text-emerald-300">{timeBreakdown.months} Ay {timeBreakdown.days} Gün</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1 pt-1 border-t border-slate-800">
            {isEarlyGrade 
              ? 'Lise diploma notu (OBP) YKS yerleştirmesine %12 doğrudan etki eder.'
              : `YKS maratonuna toplam ${daysLeft} gün kaldı.`}
          </div>
        </div>
      </div>
    </div>
  );
};
