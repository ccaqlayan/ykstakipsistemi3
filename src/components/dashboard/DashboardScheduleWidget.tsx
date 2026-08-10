import React from 'react';
import { CalendarDays, List, LayoutGrid, ArrowUpRight, Clock, BookOpen, CheckCircle2, Flame, Plus } from 'lucide-react';
import { StudyPlanItem, DayOfWeek } from '../../types';

interface DashboardScheduleWidgetProps {
  studyPlans: StudyPlanItem[];
  scheduleDayTab: 'yesterday' | 'today' | 'tomorrow';
  setScheduleDayTab: (tab: 'yesterday' | 'today' | 'tomorrow') => void;
  scheduleViewMode: 'tabs' | 'grid';
  setScheduleViewMode: (mode: 'tabs' | 'grid') => void;
  onNavigateTab: (tab: any) => void;
}

export const DashboardScheduleWidget: React.FC<DashboardScheduleWidgetProps> = ({
  studyPlans = [],
  scheduleDayTab,
  setScheduleDayTab,
  scheduleViewMode,
  setScheduleViewMode,
  onNavigateTab
}) => {
  const getScheduleDayData = (offset: number) => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + offset);
    
    const year = targetDate.getFullYear();
    const month = String(targetDate.getMonth() + 1).padStart(2, '0');
    const day = String(targetDate.getDate()).padStart(2, '0');
    const isoDateStr = `${year}-${month}-${day}`;

    const daysMap: DayOfWeek[] = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
    const dayName = daysMap[targetDate.getDay()];

    const activePlans = (studyPlans || []).filter(p => !p.archived);

    const yesterdayObj = new Date();
    yesterdayObj.setDate(yesterdayObj.getDate() - 1);
    const yesterdayIso = `${yesterdayObj.getFullYear()}-${String(yesterdayObj.getMonth() + 1).padStart(2, '0')}-${String(yesterdayObj.getDate()).padStart(2, '0')}`;

    const todayObj = new Date();
    const todayIso = `${todayObj.getFullYear()}-${String(todayObj.getMonth() + 1).padStart(2, '0')}-${String(todayObj.getDate()).padStart(2, '0')}`;

    const tomorrowObj = new Date();
    tomorrowObj.setDate(tomorrowObj.getDate() + 1);
    const tomorrowIso = `${tomorrowObj.getFullYear()}-${String(tomorrowObj.getMonth() + 1).padStart(2, '0')}-${String(tomorrowObj.getDate()).padStart(2, '0')}`;

    const matchedPlans = activePlans.filter(p => {
      const planDayClean = p.day ? p.day.trim().toLocaleLowerCase('tr-TR') : '';
      const targetDayClean = (dayName || '').trim().toLocaleLowerCase('tr-TR');
      const planDateIso = p.date ? p.date.split('T')[0].trim() : '';

      if (planDateIso && planDateIso === isoDateStr) {
        return true;
      }

      if (planDayClean && planDayClean === targetDayClean) {
        if (offset === 0 && planDateIso && (planDateIso === yesterdayIso || planDateIso === tomorrowIso)) {
          return false;
        }
        if (offset === -1 && planDateIso && (planDateIso === todayIso || planDateIso === tomorrowIso)) {
          return false;
        }
        if (offset === 1 && planDateIso && (planDateIso === todayIso || planDateIso === yesterdayIso)) {
          return false;
        }
        return true;
      }

      return false;
    });

    const completedCount = matchedPlans.filter(p => 
      p.status === 'completed' || p.reflection === 'Çalıştım' || p.reflection === 'Uzmanlaştım'
    ).length;
    const totalMinutes = matchedPlans.reduce((acc, p) => acc + (p.plannedMinutes || 0), 0);
    const totalQuestions = matchedPlans.reduce((acc, p) => acc + (p.targetQuestionCount || 0), 0);

    const formattedDate = targetDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });

    return {
      offset,
      isoDateStr,
      dayName,
      formattedDate,
      plans: matchedPlans,
      completedCount,
      totalCount: matchedPlans.length,
      totalMinutes,
      totalQuestions
    };
  };

  const yesterdayData = getScheduleDayData(-1);
  const todayData = getScheduleDayData(0);
  const tomorrowData = getScheduleDayData(1);

  const activeData = scheduleDayTab === 'yesterday' 
    ? yesterdayData 
    : scheduleDayTab === 'tomorrow' 
    ? tomorrowData 
    : todayData;

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-5 sm:p-6 shadow-xl space-y-5">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div>
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <CalendarDays className="w-5 h-5 text-cyan-400" />
            <span>Dün, Bugün & Yarın Çalışma Özeti</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Günlük yapılalacak dersler ve çalışma durumu takibi
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          {/* View Mode Toggle */}
          <div className="hidden sm:flex items-center bg-slate-900/60 p-1 rounded-xl border border-white/10">
            <button
              type="button"
              onClick={() => setScheduleViewMode('tabs')}
              title="Sekmeli Görünüm"
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center space-x-1 cursor-pointer ${
                scheduleViewMode === 'tabs' ? 'bg-indigo-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Sekmeli</span>
            </button>
            <button
              type="button"
              onClick={() => setScheduleViewMode('grid')}
              title="3 Gün Yan Yana Görünüm"
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center space-x-1 cursor-pointer ${
                scheduleViewMode === 'grid' ? 'bg-indigo-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>3 Günlük Akış</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab('planner')}
            className="text-xs bg-white/10 hover:bg-white/15 text-indigo-300 border border-white/15 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl transition-all font-semibold flex items-center space-x-1 backdrop-blur-md cursor-pointer"
          >
            <span>Tüm Program</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* TABBED VIEW MODE */}
      {scheduleViewMode === 'tabs' && (
        <div className="space-y-4">
          
          {/* Day Selector Tabs */}
          <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-900/60 rounded-2xl border border-white/10">
            
            {/* Yesterday Tab */}
            <button
              type="button"
              onClick={() => setScheduleDayTab('yesterday')}
              className={`relative flex flex-col items-center justify-center py-2.5 px-2 rounded-xl transition-all cursor-pointer ${
                scheduleDayTab === 'yesterday'
                  ? 'bg-gradient-to-r from-slate-800 to-slate-800 text-white border border-slate-700 shadow-md ring-1 ring-slate-600'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <span className="text-xs font-bold">Dün</span>
              <span className="text-[10px] text-slate-400 mt-0.5">{yesterdayData.dayName}</span>
              <span className={`text-[10px] mt-1 px-2 py-0.5 rounded-full font-mono font-semibold ${
                yesterdayData.completedCount === yesterdayData.totalCount && yesterdayData.totalCount > 0
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-white/10 text-slate-300'
              }`}>
                {yesterdayData.completedCount}/{yesterdayData.totalCount} Tamam
              </span>
            </button>

            {/* Today Tab */}
            <button
              type="button"
              onClick={() => setScheduleDayTab('today')}
              className={`relative flex flex-col items-center justify-center py-2.5 px-2 rounded-xl transition-all cursor-pointer ${
                scheduleDayTab === 'today'
                  ? 'bg-gradient-to-r from-cyan-600/30 to-indigo-600/30 text-white border border-cyan-500/50 shadow-lg ring-2 ring-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <div className="flex items-center space-x-1">
                <span className="text-xs font-bold text-cyan-300">Bugün</span>
                <span className="text-[10px]">⭐</span>
              </div>
              <span className="text-[10px] text-cyan-200/80 mt-0.5">{todayData.dayName}</span>
              <span className={`text-[10px] mt-1 px-2 py-0.5 rounded-full font-mono font-semibold ${
                todayData.completedCount === todayData.totalCount && todayData.totalCount > 0
                  ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                  : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
              }`}>
                {todayData.completedCount}/{todayData.totalCount} Tamam
              </span>
            </button>

            {/* Tomorrow Tab */}
            <button
              type="button"
              onClick={() => setScheduleDayTab('tomorrow')}
              className={`relative flex flex-col items-center justify-center py-2.5 px-2 rounded-xl transition-all cursor-pointer ${
                scheduleDayTab === 'tomorrow'
                  ? 'bg-gradient-to-r from-slate-800 to-slate-800 text-white border border-slate-700 shadow-md ring-1 ring-slate-600'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <span className="text-xs font-bold">Yarın</span>
              <span className="text-[10px] text-slate-400 mt-0.5">{tomorrowData.dayName}</span>
              <span className="text-[10px] mt-1 px-2 py-0.5 rounded-full font-mono font-semibold bg-white/10 text-slate-300">
                {tomorrowData.totalCount} Görev
              </span>
            </button>

          </div>

          {/* Selected Day Info Banner */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-white">{activeData.formattedDate}, {activeData.dayName}</span>
              <span className="text-[11px] text-slate-400 font-mono">
                ({activeData.totalCount} Çalışma Planı)
              </span>
            </div>

            <div className="flex items-center space-x-3 text-xs">
              {activeData.totalMinutes > 0 && (
                <span className="text-slate-300 flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{activeData.totalMinutes} dk Hedef</span>
                </span>
              )}
              {activeData.totalQuestions > 0 && (
                <span className="text-slate-300 flex items-center space-x-1">
                  <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{activeData.totalQuestions} Soru</span>
                </span>
              )}
            </div>
          </div>

          {/* Day Task List */}
          {activeData.plans.length > 0 ? (
            <div className="space-y-2.5">
              {activeData.plans.map((plan) => {
                const isCompleted = plan.status === 'completed' || plan.reflection === 'Çalıştım' || plan.reflection === 'Uzmanlaştım';
                const isInProgress = plan.status === 'in_progress';
                const isPostponed = plan.reflection === 'Erteledim';
                const isHard = plan.reflection === 'Zor Geldi';

                return (
                  <div 
                    key={plan.id}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-2xl border transition-all gap-3 ${
                      isCompleted
                        ? 'bg-emerald-500/10 border-emerald-500/20 hover:border-emerald-500/40'
                        : isInProgress
                        ? 'bg-amber-500/10 border-amber-500/20 hover:border-amber-500/40'
                        : 'bg-white/5 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-start space-x-3 min-w-0">
                      <div className="mt-0.5 shrink-0">
                        {isCompleted ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        ) : isInProgress ? (
                          <Flame className="w-5 h-5 text-amber-400 animate-pulse" />
                        ) : (
                          <Clock className="w-5 h-5 text-slate-400" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-md">
                            {plan.subject}
                          </span>
                          {plan.taskType && (
                            <span className="text-[10px] text-slate-300 bg-white/10 px-2 py-0.5 rounded-md font-medium">
                              {plan.taskType}
                            </span>
                          )}
                        </div>

                        <div className="text-xs font-semibold text-white truncate">
                          {plan.topic}
                        </div>

                        {plan.notes && (
                          <div className="text-[11px] text-slate-400 line-clamp-1 italic">
                            "{plan.notes}"
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end space-x-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
                      <div className="flex items-center space-x-2 text-[11px] font-mono text-slate-300">
                        {plan.plannedMinutes > 0 && <span>{plan.plannedMinutes} dk</span>}
                        {plan.targetQuestionCount && plan.targetQuestionCount > 0 && (
                          <span className="text-cyan-300">• {plan.targetQuestionCount} Soru</span>
                        )}
                      </div>

                      <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold border backdrop-blur-md shrink-0 ${
                        isCompleted
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : isInProgress
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          : isPostponed
                          ? 'bg-orange-500/20 text-orange-300 border-orange-500/30'
                          : isHard
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}>
                        {isCompleted ? 'Tamamlandı' : isInProgress ? 'Devam Ediyor' : isPostponed ? 'Erteledim' : isHard ? 'Zor Geldi' : 'Bekliyor'}
                      </span>
                    </div>

                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 px-4 bg-white/5 rounded-2xl border border-dashed border-white/10 space-y-3">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <CalendarDays className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-white">
                  {activeData.formattedDate} için ders planı bulunmuyor
                </h4>
                <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
                  Çalışma programınıza yeni konu anlatımı veya soru çözümü eklemek için planlayıcıyı kullanabilirsiniz.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('planner')}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-900 bg-cyan-400 hover:bg-cyan-300 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Bu Güne Ders Ekle</span>
              </button>
            </div>
          )}

        </div>
      )}

      {/* GRID VIEW MODE (3 Days Side by Side) */}
      {scheduleViewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[yesterdayData, todayData, tomorrowData].map((dayData) => {
            const isToday = dayData.offset === 0;
            const isYesterday = dayData.offset === -1;

            return (
              <div 
                key={dayData.offset}
                className={`rounded-2xl p-4 border flex flex-col justify-between space-y-3 ${
                  isToday
                    ? 'bg-gradient-to-b from-cyan-950/30 to-slate-900/60 border-cyan-500/40 shadow-lg ring-1 ring-cyan-500/30'
                    : 'bg-white/5 border-white/10'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between pb-2 mb-3 border-b border-white/10">
                    <div className="flex items-center space-x-1.5">
                      <span className={`text-xs font-bold ${isToday ? 'text-cyan-300' : 'text-white'}`}>
                        {isYesterday ? 'Dün' : isToday ? 'Bugün ⭐' : 'Yarın'}
                      </span>
                      <span className="text-[10px] text-slate-400">({dayData.dayName})</span>
                    </div>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-white/10 text-slate-300">
                      {dayData.completedCount}/{dayData.totalCount}
                    </span>
                  </div>

                  {dayData.plans.length > 0 ? (
                    <div className="space-y-2">
                      {dayData.plans.map((p) => {
                        const isDone = p.status === 'completed' || p.reflection === 'Çalıştım' || p.reflection === 'Uzmanlaştım';
                        return (
                          <div 
                            key={p.id}
                            className={`p-2.5 rounded-xl border text-xs space-y-1 ${
                              isDone 
                                ? 'bg-emerald-500/10 border-emerald-500/20' 
                                : 'bg-slate-950/60 border-white/10'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-cyan-300 truncate text-[11px]">{p.subject}</span>
                              {isDone ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              ) : (
                                <span className="text-[9px] text-slate-400 font-mono">{p.plannedMinutes}dk</span>
                              )}
                            </div>
                            <div className="text-[11px] font-medium text-slate-200 truncate">{p.topic}</div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-[11px] text-slate-500 italic">
                      Planlanmış ders yok
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setScheduleDayTab(isYesterday ? 'yesterday' : isToday ? 'today' : 'tomorrow');
                    setScheduleViewMode('tabs');
                  }}
                  className="w-full text-center py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-bold text-slate-300 transition-colors cursor-pointer"
                >
                  Detayları Göster
                </button>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
