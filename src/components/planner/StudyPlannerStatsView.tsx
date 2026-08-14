import React, { useState, useMemo } from 'react';
import { 
  PieChart, 
  TrendingUp, 
  BarChart3, 
  CalendarDays, 
  Award, 
  Clock, 
  Sparkles, 
  History, 
  Calendar, 
  CheckCircle, 
  Check,
  Settings2,
  SlidersHorizontal,
  Target,
  Zap,
  Activity,
  ChevronDown,
  Info,
  Timer
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  LineChart,
  Line,
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend,
  ReferenceLine
} from 'recharts';
import { StudyPlanItem, DayOfWeek, DailyStudyTimeLog } from '../../types';
import { isVideoTask } from '../../utils/youtubeUtils';
import { isSameWeekLabel } from '../../utils/dateUtils';
import { DEFAULT_DAILY_STUDY_LOGS } from '../../data/initialData';

interface StudyPlannerStatsViewProps {
  viewMode: 'board' | 'daily' | 'stats';
  activeSubTab: 'tracker' | 'history';
  DAYS: DayOfWeek[];
  activePlans: StudyPlanItem[];
  orderedWeeks: string[];
  activeHistoryWeek: string;
  setSelectedHistoryWeek: (week: string) => void;
  historyWeeksPage: number;
  setHistoryWeeksPage: React.Dispatch<React.SetStateAction<number>>;
  subjectChartScope: 'total' | 'selected';
  setSubjectChartScope: (scope: 'total' | 'selected') => void;
  subjectChartMetric: 'duration' | 'question';
  setSubjectChartMetric: (metric: 'duration' | 'question') => void;
  getWeeklyStats: () => any[];
  getSubjectDistributionStats: () => any[];
  getPlansForWeek: (weekLabel: string) => StudyPlanItem[];
  getEffectiveDayStudyMinutes?: (day: DayOfWeek, dateKey?: string) => { minutes: number; isManual: boolean; notes?: string };
  weekDaysMap?: Record<string, { isoDate: string; displayDate: string }>;
  dailyStudyLogs?: Record<string, DailyStudyTimeLog>;
  today?: DayOfWeek;
  openDailyStudyLogModal?: (day: DayOfWeek) => void;
  getSubjectTheme?: (subject: string) => any;
  currentWeekLabel?: string;
}

export const StudyPlannerStatsView: React.FC<StudyPlannerStatsViewProps> = ({
  viewMode,
  activeSubTab,
  DAYS,
  activePlans,
  orderedWeeks,
  activeHistoryWeek,
  setSelectedHistoryWeek,
  historyWeeksPage,
  setHistoryWeeksPage,
  subjectChartScope,
  setSubjectChartScope,
  subjectChartMetric,
  setSubjectChartMetric,
  getWeeklyStats,
  getSubjectDistributionStats,
  getPlansForWeek,
  getEffectiveDayStudyMinutes,
  weekDaysMap,
  dailyStudyLogs,
  today,
  openDailyStudyLogModal,
  getSubjectTheme,
  currentWeekLabel
}) => {
  // Active Week Chart State & Settings
  const [activeChartType, setActiveChartType] = useState<'bar' | 'area' | 'line'>('bar');
  const [activeChartComparePlan, setActiveChartComparePlan] = useState<boolean>(true);
  const [activeChartUnit, setActiveChartUnit] = useState<'hours' | 'minutes'>('hours');
  const [activeChartShowTarget, setActiveChartShowTarget] = useState<boolean>(true);
  const [activeChartTargetHours, setActiveChartTargetHours] = useState<number>(6);
  const [showActiveChartSettings, setShowActiveChartSettings] = useState<boolean>(false);

  // Active Week Daily Stats Calculation
  const activeWeekDailyStats = useMemo(() => {
    return DAYS.map(day => {
      const dayPlans = activePlans.filter(p => p.day === day);
      const dayPlannedMins = dayPlans.reduce((sum, p) => sum + (p.plannedMinutes || 0), 0);
      const dayCompletedMins = dayPlans.reduce((sum, p) => sum + (p.completedMinutes || 0), 0);
      const dateInfo = weekDaysMap?.[day];
      const dateKey = dateInfo?.isoDate;
      const displayDate = dateInfo?.displayDate || '';
      
      const effectiveLog = getEffectiveDayStudyMinutes 
        ? getEffectiveDayStudyMinutes(day, dateKey)
        : { minutes: dayCompletedMins, isManual: false };

      const effectiveMins = effectiveLog.minutes;
      const isManual = effectiveLog.isManual;
      const notes = effectiveLog.notes;
      const completedTasksCount = dayPlans.filter(p => p.status === 'completed').length;
      const totalTasksCount = dayPlans.length;
      const progressPercent = dayPlannedMins > 0 ? Math.round((effectiveMins / dayPlannedMins) * 100) : 0;

      const effectiveVal = activeChartUnit === 'hours' ? Number((effectiveMins / 60).toFixed(1)) : effectiveMins;
      const plannedVal = activeChartUnit === 'hours' ? Number((dayPlannedMins / 60).toFixed(1)) : dayPlannedMins;
      const taskVal = activeChartUnit === 'hours' ? Number((dayCompletedMins / 60).toFixed(1)) : dayCompletedMins;

      return {
        day,
        shortDay: day.substring(0, 3),
        displayDate,
        dateKey,
        dayPlans,
        dayPlannedMins,
        dayCompletedMins,
        effectiveMins,
        isManual,
        notes,
        completedTasksCount,
        totalTasksCount,
        progressPercent,
        'Çalışma Süresi': effectiveVal,
        'Hedef Süre': plannedVal,
        'Görev Süresi': taskVal,
        effectiveHours: Number((effectiveMins / 60).toFixed(1)),
        plannedHours: Number((dayPlannedMins / 60).toFixed(1)),
        taskHours: Number((dayCompletedMins / 60).toFixed(1)),
        isToday: day === today
      };
    });
  }, [DAYS, activePlans, weekDaysMap, getEffectiveDayStudyMinutes, today, activeChartUnit]);

  const activeWeekTotals = useMemo(() => {
    const totalPlannedMins = activeWeekDailyStats.reduce((s, d) => s + d.dayPlannedMins, 0);
    const totalCompletedTaskMins = activeWeekDailyStats.reduce((s, d) => s + d.dayCompletedMins, 0);
    const totalEffectiveStudyMins = activeWeekDailyStats.reduce((s, d) => s + d.effectiveMins, 0);
    const totalTasks = activeWeekDailyStats.reduce((s, d) => s + d.totalTasksCount, 0);
    const totalCompletedTasks = activeWeekDailyStats.reduce((s, d) => s + d.completedTasksCount, 0);
    const overallPercent = totalPlannedMins > 0 ? Math.round((totalEffectiveStudyMins / totalPlannedMins) * 100) : 0;
    const maxStudyDay = activeWeekDailyStats.reduce((max, d) => d.effectiveMins > max.effectiveMins ? d : max, activeWeekDailyStats[0]);
    const avgDailyMins = Math.round(totalEffectiveStudyMins / 7);

    return {
      totalPlannedMins,
      totalCompletedTaskMins,
      totalEffectiveStudyMins,
      totalTasks,
      totalCompletedTasks,
      overallPercent,
      maxStudyDay,
      avgDailyMins,
      avgDailyHours: (avgDailyMins / 60).toFixed(1),
      totalEffectiveHours: (totalEffectiveStudyMins / 60).toFixed(1),
      totalPlannedHours: (totalPlannedMins / 60).toFixed(1),
      unitLabel: activeChartUnit === 'hours' ? 'sa' : 'dk'
    };
  }, [activeWeekDailyStats, activeChartUnit]);

  const activeWeekSubjectStats = useMemo(() => {
    const map: Record<string, { planned: number; completed: number; tasks: number; completedTasks: number }> = {};
    activePlans.forEach(p => {
      if (!map[p.subject]) {
        map[p.subject] = { planned: 0, completed: 0, tasks: 0, completedTasks: 0 };
      }
      map[p.subject].planned += p.plannedMinutes || 0;
      map[p.subject].completed += p.completedMinutes || 0;
      map[p.subject].tasks += 1;
      if (p.status === 'completed') {
        map[p.subject].completedTasks += 1;
      }
    });
    return Object.keys(map).map(subj => {
      const p = map[subj];
      const percent = p.planned > 0 ? Math.round((p.completed / p.planned) * 100) : 0;
      return {
        name: subj,
        plannedMins: p.planned,
        completedMins: p.completed,
        plannedHours: Number((p.planned / 60).toFixed(1)),
        completedHours: Number((p.completed / 60).toFixed(1)),
        tasks: p.tasks,
        completedTasks: p.completedTasks,
        percent
      };
    }).sort((a, b) => b.completedMins - a.completedMins);
  }, [activePlans]);

  // Custom Active Chart Tooltip
  const CustomActiveChartTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      return (
        <div className="bg-slate-950 border border-slate-700 rounded-2xl p-3.5 shadow-2xl backdrop-blur-md text-xs space-y-2 max-w-xs">
          <div className="font-black text-white border-b border-slate-800 pb-1.5 flex items-center justify-between gap-2">
            <span className="flex items-center space-x-1.5">
              <span>{dataPoint.day}</span>
              {dataPoint.displayDate && <span className="text-slate-400 font-normal">({dataPoint.displayDate})</span>}
              {dataPoint.isToday && <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-bold">BUGÜN</span>}
            </span>
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border whitespace-nowrap ${
              dataPoint.isManual
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
            }`}>
              {dataPoint.isManual ? '⏱️ NET KRONOMETRE' : '📋 GÖREV BAZLI'}
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-emerald-400 font-bold">
              <span className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
                <span>Gerçekleşen Çalışma:</span>
              </span>
              <span className="font-mono text-sm">
                {Math.floor(dataPoint.effectiveMins / 60)} sa {dataPoint.effectiveMins % 60} dk
              </span>
            </div>

            {dataPoint.dayPlannedMins > 0 && (
              <div className="flex items-center justify-between text-indigo-300">
                <span className="flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-400 inline-block"></span>
                  <span>Hedef Görev Süresi:</span>
                </span>
                <span className="font-mono">
                  {Math.floor(dataPoint.dayPlannedMins / 60)} sa {dataPoint.dayPlannedMins % 60} dk
                </span>
              </div>
            )}

            <div className="flex items-center justify-between text-slate-400 text-[11px] pt-0.5 border-t border-slate-800">
              <span>Görev İlerlemesi:</span>
              <span className="font-mono font-bold text-white">
                {dataPoint.completedTasksCount} / {dataPoint.totalTasksCount} Görev (%{dataPoint.progressPercent})
              </span>
            </div>
          </div>

          {dataPoint.notes && (
            <div className="text-[11px] text-slate-300 italic bg-slate-900/90 p-2 rounded-lg border border-slate-800">
              "{dataPoint.notes}"
            </div>
          )}
        </div>
      );
    }
    return null;
  };
  // Net Study Duration Chart State & Settings
  const [netChartScope, setNetChartScope] = useState<'selected_week' | 'all_weeks' | 'all_days'>('selected_week');
  const [netChartType, setNetChartType] = useState<'bar' | 'area' | 'line'>('bar');
  const [netChartCompareTasks, setNetChartCompareTasks] = useState<boolean>(true);
  const [netChartShowTargetLine, setNetChartShowTargetLine] = useState<boolean>(true);
  const [netChartTargetHours, setNetChartTargetHours] = useState<number>(6);
  const [netChartShowAvgLine, setNetChartShowAvgLine] = useState<boolean>(true);
  const [netChartUnit, setNetChartUnit] = useState<'hours' | 'minutes'>('hours');
  const [showNetChartSettings, setShowNetChartSettings] = useState<boolean>(false);

  const mergedDailyLogs = useMemo(() => {
    return { ...DEFAULT_DAILY_STUDY_LOGS, ...(dailyStudyLogs || {}) };
  }, [dailyStudyLogs]);

  // Compute Net Study Chart Data based on netChartScope
  const netStudyChartData = useMemo(() => {
    if (netChartScope === 'selected_week') {
      const plans = getPlansForWeek(activeHistoryWeek);
      return DAYS.map(day => {
        const dayPlans = plans.filter(p => p.day === day);
        const taskCompletedMins = dayPlans.reduce((sum, p) => sum + (p.completedMinutes || 0), 0);
        const taskPlannedMins = dayPlans.reduce((sum, p) => sum + (p.plannedMinutes || 0), 0);

        // Find matching log in mergedDailyLogs
        const matchingLogKey = Object.keys(mergedDailyLogs).find(k => {
          const log = mergedDailyLogs[k];
          return log && log.day === day && isSameWeekLabel(log.weekLabel || '', activeHistoryWeek);
        });
        const log = matchingLogKey ? mergedDailyLogs[matchingLogKey] : undefined;
        const rawNetMins = log ? log.minutes : taskCompletedMins;
        const isManual = Boolean(log);

        const netVal = netChartUnit === 'hours' ? Number((rawNetMins / 60).toFixed(1)) : rawNetMins;
        const taskVal = netChartUnit === 'hours' ? Number((taskCompletedMins / 60).toFixed(1)) : taskCompletedMins;
        const plannedVal = netChartUnit === 'hours' ? Number((taskPlannedMins / 60).toFixed(1)) : taskPlannedMins;

        return {
          name: day.substring(0, 3),
          fullName: day,
          'Net Çalışma': netVal,
          'Görev Süresi': taskVal,
          'Planlanan Süre': plannedVal,
          rawNetMinutes: rawNetMins,
          rawTaskMinutes: taskCompletedMins,
          isManual,
          notes: log?.notes
        };
      });
    }

    if (netChartScope === 'all_weeks') {
      const reversedWeeks = [...orderedWeeks].reverse();
      return reversedWeeks.map(weekLabel => {
        const plans = getPlansForWeek(weekLabel);
        const totalTaskMins = plans.reduce((sum, p) => sum + (p.completedMinutes || 0), 0);
        const totalPlannedMins = plans.reduce((sum, p) => sum + (p.plannedMinutes || 0), 0);

        // Sum net minutes for each day of that week
        const totalNetMins = DAYS.reduce((sum, day) => {
          const matchingLogKey = Object.keys(mergedDailyLogs).find(k => {
            const log = mergedDailyLogs[k];
            return log && log.day === day && isSameWeekLabel(log.weekLabel || '', weekLabel);
          });
          if (matchingLogKey && mergedDailyLogs[matchingLogKey]) {
            return sum + mergedDailyLogs[matchingLogKey].minutes;
          }
          const dayTaskMin = plans.filter(p => p.day === day).reduce((s, p) => s + (p.completedMinutes || 0), 0);
          return sum + dayTaskMin;
        }, 0);

        const netVal = netChartUnit === 'hours' ? Number((totalNetMins / 60).toFixed(1)) : totalNetMins;
        const taskVal = netChartUnit === 'hours' ? Number((totalTaskMins / 60).toFixed(1)) : totalTaskMins;
        const plannedVal = netChartUnit === 'hours' ? Number((totalPlannedMins / 60).toFixed(1)) : totalPlannedMins;

        return {
          name: weekLabel,
          fullName: weekLabel,
          'Net Çalışma': netVal,
          'Görev Süresi': taskVal,
          'Planlanan Süre': plannedVal,
          rawNetMinutes: totalNetMins,
          rawTaskMinutes: totalTaskMins,
          isManual: true
        };
      });
    }

    if (netChartScope === 'all_days') {
      const sortedKeys = Object.keys(mergedDailyLogs).sort();
      return sortedKeys.map(key => {
        const log = mergedDailyLogs[key];
        const rawNetMins = log.minutes;
        const netVal = netChartUnit === 'hours' ? Number((rawNetMins / 60).toFixed(1)) : rawNetMins;
        const displayLabel = log.date ? log.date.substring(5) : (log.day || key);

        return {
          name: displayLabel,
          fullName: `${log.date || ''} (${log.day || ''})`,
          'Net Çalışma': netVal,
          'Görev Süresi': netVal,
          'Planlanan Süre': netVal,
          rawNetMinutes: rawNetMins,
          rawTaskMinutes: rawNetMins,
          isManual: true,
          notes: log.notes
        };
      });
    }

    return [];
  }, [netChartScope, activeHistoryWeek, orderedWeeks, mergedDailyLogs, netChartUnit, DAYS]);

  // Derived Metrics for Net Chart
  const netMetrics = useMemo(() => {
    if (netStudyChartData.length === 0) {
      return { totalHours: '0', avgHours: '0', avgVal: 0, maxVal: 0, maxName: '-', targetMetCount: 0, targetTotal: 0, diffHours: '0', unitLabel: 'sa' };
    }
    const totalMinutes = netStudyChartData.reduce((sum, d: any) => sum + (d.rawNetMinutes || 0), 0);
    const totalTaskMinutes = netStudyChartData.reduce((sum, d: any) => sum + (d.rawTaskMinutes || 0), 0);
    const avgMinutes = Math.round(totalMinutes / netStudyChartData.length);
    const maxItem = netStudyChartData.reduce((max: any, d: any) => (d['Net Çalışma'] > (max?.['Net Çalışma'] || 0) ? d : max), netStudyChartData[0]);
    
    const targetThreshold = netChartUnit === 'hours' ? netChartTargetHours : netChartTargetHours * 60;
    const targetMetCount = netStudyChartData.filter((d: any) => d['Net Çalışma'] >= targetThreshold).length;
    const diffMins = totalMinutes - totalTaskMinutes;

    return {
      totalHours: (totalMinutes / 60).toFixed(1),
      avgHours: (avgMinutes / 60).toFixed(1),
      avgVal: netChartUnit === 'hours' ? Number((avgMinutes / 60).toFixed(1)) : avgMinutes,
      maxVal: maxItem ? maxItem['Net Çalışma'] : 0,
      maxName: maxItem ? maxItem.fullName || maxItem.name : '-',
      targetMetCount,
      targetTotal: netStudyChartData.length,
      diffHours: (diffMins / 60).toFixed(1),
      unitLabel: netChartUnit === 'hours' ? 'sa' : 'dk'
    };
  }, [netStudyChartData, netChartTargetHours, netChartUnit]);

  // Custom Net Study Tooltip Component
  const CustomNetTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      return (
        <div className="bg-slate-950 border border-slate-750 rounded-2xl p-3.5 shadow-2xl backdrop-blur-md text-xs space-y-2 max-w-xs border-slate-700">
          <div className="font-black text-white border-b border-slate-800 pb-1.5 flex items-center justify-between gap-2">
            <span>{dataPoint.fullName || label}</span>
            {dataPoint.isManual && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 whitespace-nowrap">
                ⏱️ NET KRONOMETRE
              </span>
            )}
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-emerald-400 font-bold">
              <span className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
                <span>Net Çalışma:</span>
              </span>
              <span className="font-mono text-sm">{dataPoint['Net Çalışma']} {netMetrics.unitLabel}</span>
            </div>
            {netChartCompareTasks && dataPoint['Görev Süresi'] !== undefined && (
              <div className="flex items-center justify-between text-indigo-300 font-medium">
                <span className="flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-400 inline-block"></span>
                  <span>Görev Süresi:</span>
                </span>
                <span className="font-mono">{dataPoint['Görev Süresi']} {netMetrics.unitLabel}</span>
              </div>
            )}
          </div>
          {dataPoint.notes && (
            <div className="text-[11px] text-slate-300 italic bg-slate-900/90 p-2 rounded-lg border border-slate-800">
              "{dataPoint.notes}"
            </div>
          )}
        </div>
      );
    }
    return null;
  };
  return (
    <>
      {/* VIEW 3: WEEKLY STATS OVERVIEW */}
      {viewMode === 'stats' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* ACTIVE WEEK HEADER */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl backdrop-blur-md">
            <div className="space-y-1">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
                  <PieChart className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-white flex items-center space-x-2">
                    <span>Haftalık Çalışma İstatistikleri & Performans</span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    {currentWeekLabel ? `${currentWeekLabel} Haftası` : 'Aktif Hafta'} gün bazlı çalışma süresi grafiği ve ders tamamlama analizi
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 self-start sm:self-auto">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                <Calendar className="w-3.5 h-3.5 mr-1.5 text-indigo-400" />
                <span>{currentWeekLabel || 'Bu Hafta'}</span>
              </span>
            </div>
          </div>

          {/* ACTIVE WEEK 4 KPI CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center space-x-3.5">
              <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400 shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Gerçekleşen Çalışma</div>
                <div className="text-lg font-black text-emerald-400 font-mono">
                  {Math.floor(activeWeekTotals.totalEffectiveStudyMins / 60)} sa {activeWeekTotals.totalEffectiveStudyMins % 60} dk
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  Görev: {Math.floor(activeWeekTotals.totalCompletedTaskMins / 60)} sa {activeWeekTotals.totalCompletedTaskMins % 60} dk
                </div>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center space-x-3.5">
              <div className="w-10 h-10 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400 shrink-0">
                <Target className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Planlanan Hedef Süre</div>
                <div className="text-lg font-black text-white font-mono">
                  {Math.floor(activeWeekTotals.totalPlannedMins / 60)} sa {activeWeekTotals.totalPlannedMins % 60} dk
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  Toplam {activeWeekTotals.totalTasks} Görev
                </div>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center space-x-3.5">
              <div className="w-10 h-10 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-center justify-center text-purple-400 shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Haftalık Tamamlama</div>
                <div className="text-lg font-black text-purple-300 font-mono">
                  %{activeWeekTotals.overallPercent}
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  {activeWeekTotals.totalCompletedTasks} / {activeWeekTotals.totalTasks} Görev Bitti
                </div>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center space-x-3.5">
              <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center text-amber-400 shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-bold text-slate-400 uppercase">En Verimli Gün</div>
                <div className="text-sm font-black text-amber-300 truncate">
                  {activeWeekTotals.maxStudyDay?.effectiveMins > 0 
                    ? `${activeWeekTotals.maxStudyDay.day} (${Math.floor(activeWeekTotals.maxStudyDay.effectiveMins / 60)} sa ${activeWeekTotals.maxStudyDay.effectiveMins % 60} dk)`
                    : 'Henüz Veri Yok'}
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  Ortalama: {activeWeekTotals.avgDailyHours} sa / gün
                </div>
              </div>
            </div>
          </div>

          {/* ACTIVE WEEK VISUALS: DAILY STUDY CHART + SUBJECT BREAKDOWN */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* HERO ACTIVE WEEK DAILY STUDY TIME CHART */}
            <div className="lg:col-span-8 bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4 backdrop-blur-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3.5">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-black text-white flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    <span>Günlük Çalışma Süresi Grafiği</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Net çalışma süresi girildiyse net kronometre, girilmediyse görev süresi baz alınır.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Chart Type Selector */}
                  <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
                    <button
                      type="button"
                      onClick={() => setActiveChartType('bar')}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                        activeChartType === 'bar'
                          ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Çubuk
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveChartType('area')}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                        activeChartType === 'area'
                          ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Alan
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveChartType('line')}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                        activeChartType === 'line'
                          ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Çizgi
                    </button>
                  </div>

                  {/* Unit Selector */}
                  <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
                    <button
                      type="button"
                      onClick={() => setActiveChartUnit('hours')}
                      className={`px-2 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                        activeChartUnit === 'hours'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Saat
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveChartUnit('minutes')}
                      className={`px-2 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                        activeChartUnit === 'minutes'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Dk
                    </button>
                  </div>

                  {/* Settings Button */}
                  <button
                    type="button"
                    onClick={() => setShowActiveChartSettings(!showActiveChartSettings)}
                    className={`flex items-center space-x-1 px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all border cursor-pointer ${
                      showActiveChartSettings
                        ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <Settings2 className="w-3.5 h-3.5" />
                    <span>Ayarlar</span>
                  </button>
                </div>
              </div>

              {/* Active Chart Settings Subpanel */}
              {showActiveChartSettings && (
                <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-3.5 space-y-3 animate-in slide-in-from-top-2 duration-200 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center space-x-3">
                      <span className="font-bold text-slate-300 flex items-center space-x-1.5">
                        <Target className="w-3.5 h-3.5 text-amber-400" />
                        <span>Günlük Hedef Çizgisi:</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setActiveChartShowTarget(!activeChartShowTarget)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded cursor-pointer ${
                          activeChartShowTarget ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-slate-800 text-slate-500'
                        }`}
                      >
                        {activeChartShowTarget ? 'Açık' : 'Kapalı'}
                      </button>
                      {activeChartShowTarget && (
                        <div className="flex items-center gap-1">
                          {[4, 5, 6, 7, 8].map(h => (
                            <button
                              key={h}
                              type="button"
                              onClick={() => setActiveChartTargetHours(h)}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                                activeChartTargetHours === h
                                  ? 'bg-amber-500 text-slate-950'
                                  : 'bg-slate-800 text-slate-400 hover:text-white'
                              }`}
                            >
                              {h} sa
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-300">Planlanan Süre:</span>
                      <button
                        type="button"
                        onClick={() => setActiveChartComparePlan(!activeChartComparePlan)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded cursor-pointer ${
                          activeChartComparePlan ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40' : 'bg-slate-800 text-slate-500'
                        }`}
                      >
                        {activeChartComparePlan ? 'Gösteriliyor' : 'Gizli'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Chart Canvas */}
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  {activeChartType === 'bar' ? (
                    <BarChart data={activeWeekDailyStats} margin={{ top: 15, right: 15, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="activeNetBarGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" stopOpacity={1}/>
                          <stop offset="100%" stopColor="#059669" stopOpacity={0.8}/>
                        </linearGradient>
                        <linearGradient id="activePlanBarGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#6366f1" stopOpacity={0.7}/>
                          <stop offset="100%" stopColor="#4338ca" stopOpacity={0.5}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="day" stroke="#64748b" style={{ fontSize: '11px', fontWeight: 'bold' }} />
                      <YAxis stroke="#64748b" style={{ fontSize: '10px' }} unit={` ${activeWeekTotals.unitLabel}`} />
                      <Tooltip content={<CustomActiveChartTooltip />} />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                      {activeChartShowTarget && (
                        <ReferenceLine 
                          y={activeChartUnit === 'hours' ? activeChartTargetHours : activeChartTargetHours * 60} 
                          stroke="#f59e0b" 
                          strokeDasharray="4 4" 
                          strokeWidth={2}
                          label={{ value: `🎯 Hedef: ${activeChartTargetHours} sa`, fill: '#f59e0b', fontSize: 10, position: 'top' }} 
                        />
                      )}
                      <Bar name="Gerçekleşen Çalışma" dataKey="Çalışma Süresi" fill="url(#activeNetBarGrad)" radius={[6, 6, 0, 0]} />
                      {activeChartComparePlan && (
                        <Bar name="Hedef Süre" dataKey="Hedef Süre" fill="url(#activePlanBarGrad)" radius={[6, 6, 0, 0]} />
                      )}
                    </BarChart>
                  ) : activeChartType === 'area' ? (
                    <AreaChart data={activeWeekDailyStats} margin={{ top: 15, right: 15, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="activeAreaGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="activePlanAreaGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="day" stroke="#64748b" style={{ fontSize: '11px', fontWeight: 'bold' }} />
                      <YAxis stroke="#64748b" style={{ fontSize: '10px' }} unit={` ${activeWeekTotals.unitLabel}`} />
                      <Tooltip content={<CustomActiveChartTooltip />} />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                      {activeChartShowTarget && (
                        <ReferenceLine 
                          y={activeChartUnit === 'hours' ? activeChartTargetHours : activeChartTargetHours * 60} 
                          stroke="#f59e0b" 
                          strokeDasharray="4 4" 
                          strokeWidth={2}
                          label={{ value: `🎯 Hedef: ${activeChartTargetHours} sa`, fill: '#f59e0b', fontSize: 10, position: 'top' }} 
                        />
                      )}
                      <Area type="monotone" name="Gerçekleşen Çalışma" dataKey="Çalışma Süresi" stroke="#10b981" strokeWidth={3} fill="url(#activeAreaGrad)" />
                      {activeChartComparePlan && (
                        <Area type="monotone" name="Hedef Süre" dataKey="Hedef Süre" stroke="#6366f1" strokeWidth={2} strokeDasharray="3 3" fill="url(#activePlanAreaGrad)" />
                      )}
                    </AreaChart>
                  ) : (
                    <LineChart data={activeWeekDailyStats} margin={{ top: 15, right: 15, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="day" stroke="#64748b" style={{ fontSize: '11px', fontWeight: 'bold' }} />
                      <YAxis stroke="#64748b" style={{ fontSize: '10px' }} unit={` ${activeWeekTotals.unitLabel}`} />
                      <Tooltip content={<CustomActiveChartTooltip />} />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                      {activeChartShowTarget && (
                        <ReferenceLine 
                          y={activeChartUnit === 'hours' ? activeChartTargetHours : activeChartTargetHours * 60} 
                          stroke="#f59e0b" 
                          strokeDasharray="4 4" 
                          strokeWidth={2}
                          label={{ value: `🎯 Hedef: ${activeChartTargetHours} sa`, fill: '#f59e0b', fontSize: 10, position: 'top' }} 
                        />
                      )}
                      <Line type="monotone" name="Gerçekleşen Çalışma" dataKey="Çalışma Süresi" stroke="#10b981" strokeWidth={3.5} dot={{ r: 4, fill: '#10b981' }} activeDot={{ r: 6 }} />
                      {activeChartComparePlan && (
                        <Line type="monotone" name="Hedef Süre" dataKey="Hedef Süre" stroke="#6366f1" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 3, fill: '#6366f1' }} activeDot={{ r: 5 }} />
                      )}
                    </LineChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>

            {/* ACTIVE WEEK SUBJECT BREAKDOWN CARD */}
            <div className="lg:col-span-4 bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4 backdrop-blur-md flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-black text-white flex items-center space-x-2 border-b border-slate-800/80 pb-3">
                  <BarChart3 className="w-4 h-4 text-purple-400" />
                  <span>Ders Dağılımı (Bu Hafta)</span>
                </h3>

                <div className="mt-3.5 space-y-2.5 max-h-56 overflow-y-auto pr-1">
                  {activeWeekSubjectStats.length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-500 italic">
                      Henüz bu hafta için planlanmış ders bulunmuyor.
                    </div>
                  ) : (
                    activeWeekSubjectStats.map((subj) => {
                      const theme = getSubjectTheme ? getSubjectTheme(subj.name) : null;
                      return (
                        <div key={subj.name} className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-2.5 space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className={`font-bold px-2 py-0.5 rounded-lg border text-[11px] ${
                              theme?.badgeClass || 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                            }`}>
                              {subj.name}
                            </span>
                            <span className="font-mono font-bold text-emerald-400">
                              {Math.floor(subj.completedMins / 60)} sa {subj.completedMins % 60} dk
                            </span>
                          </div>
                          
                          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                            <div 
                              className="bg-emerald-500 h-1.5 rounded-full transition-all"
                              style={{ width: `${Math.min(subj.percent, 100)}%` }}
                            />
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-slate-400">
                            <span>Hedef: {Math.floor(subj.plannedMins / 60)} sa {subj.plannedMins % 60} dk</span>
                            <span className="font-semibold text-slate-300">{subj.completedTasks}/{subj.tasks} Görev (%{subj.percent})</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Ders Çeşidi:</span>
                <span className="font-bold text-white font-mono">{activeWeekSubjectStats.length} Farklı Ders</span>
              </div>
            </div>
          </div>

          {/* REDESIGNED & ORGANIZED ACTIVE WEEK PERFORMANCE TABLE */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4 backdrop-blur-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
              <div>
                <h3 className="text-base font-black text-white flex items-center space-x-2">
                  <CalendarDays className="w-5 h-5 text-indigo-400" />
                  <span>Gün Bazlı Detaylı Çalışma & Görev Tablosu</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Her gün için planlanan dersler, gerçekleşen görev süreleri ve net kronometre kayıtları
                </p>
              </div>

              <span className="text-xs text-slate-400 italic">
                * Süre kutucuğuna tıklayarak doğrudan net çalışma sürenizi güncelleyebilirsiniz.
              </span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="w-full text-left text-xs text-slate-200">
                <thead className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3.5 px-4">Gün & Tarih</th>
                    <th className="py-3.5 px-4 min-w-[280px]">Planlanan Dersler & Görevler</th>
                    <th className="py-3.5 px-4 text-center">Hedef Görev</th>
                    <th className="py-3.5 px-4 text-center">Görev Süresi</th>
                    <th className="py-3.5 px-4 text-center">Günün Çalışma Süresi</th>
                    <th className="py-3.5 px-4 text-center">Verimlilik / Durum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {activeWeekDailyStats.map((row) => {
                    const hasTasks = row.dayPlans.length > 0;
                    return (
                      <tr 
                        key={row.day} 
                        className={`transition-colors ${
                          row.isToday 
                            ? 'bg-indigo-950/20 hover:bg-indigo-950/30' 
                            : 'hover:bg-slate-800/40'
                        }`}
                      >
                        {/* Day & Date */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <div>
                              <div className="font-black text-white text-sm flex items-center space-x-1.5">
                                <span>{row.day}</span>
                                {row.isToday && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                    BUGÜN
                                  </span>
                                )}
                              </div>
                              {row.displayDate && (
                                <div className="text-[11px] text-slate-400 font-medium">
                                  {row.displayDate}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Subject & Topics list */}
                        <td className="py-4 px-4">
                          {!hasTasks ? (
                            <span className="text-slate-600 italic text-xs">Bu gün için ders görevi planlanmadı</span>
                          ) : (
                            <div className="flex flex-wrap gap-1.5">
                              {row.dayPlans.map((plan) => {
                                const theme = getSubjectTheme ? getSubjectTheme(plan.subject) : null;
                                return (
                                  <span
                                    key={plan.id}
                                    className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                                      plan.status === 'completed'
                                        ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                                        : plan.status === 'in_progress'
                                        ? 'bg-amber-950/40 border-amber-500/40 text-amber-300'
                                        : 'bg-slate-950 border-slate-800 text-slate-300'
                                    }`}
                                  >
                                    <span className="text-[10px]">
                                      {plan.status === 'completed' ? '✅' : plan.status === 'in_progress' ? '⚡' : '⏳'}
                                    </span>
                                    <span className="font-bold text-slate-100">{plan.subject}:</span>
                                    <span className="truncate max-w-[140px]">{plan.topic}</span>
                                    <span className="text-[10px] text-slate-400 font-mono">({plan.plannedMinutes}m)</span>
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </td>

                        {/* Planned target time */}
                        <td className="py-4 px-4 text-center font-mono whitespace-nowrap">
                          <div className="font-bold text-slate-200">
                            {Math.floor(row.dayPlannedMins / 60)} sa {row.dayPlannedMins % 60} dk
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {row.totalTasksCount} Görev
                          </div>
                        </td>

                        {/* Task completed duration & progress */}
                        <td className="py-4 px-4 text-center font-mono whitespace-nowrap">
                          <div className="font-bold text-slate-300">
                            {Math.floor(row.dayCompletedMins / 60)} sa {row.dayCompletedMins % 60} dk
                          </div>
                          <div className="w-16 mx-auto bg-slate-800 rounded-full h-1 mt-1 overflow-hidden">
                            <div 
                              className="bg-indigo-500 h-1 rounded-full"
                              style={{ width: `${Math.min(row.dayPlannedMins > 0 ? (row.dayCompletedMins / row.dayPlannedMins) * 100 : 0, 100)}%` }}
                            />
                          </div>
                        </td>

                        {/* Günün Çalışma Süresi (Net/Görev click-to-edit badge) */}
                        <td className="py-4 px-4 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => openDailyStudyLogModal && openDailyStudyLogModal(row.day)}
                            className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-black border transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-sm ${
                              row.isManual
                                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/25 shadow-emerald-950/40'
                                : row.effectiveMins > 0
                                ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30 hover:bg-indigo-500/25'
                                : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:bg-slate-800'
                            }`}
                            title={row.notes ? `Not: ${row.notes}` : 'Net süreyi düzenle'}
                          >
                            <span>
                              {Math.floor(row.effectiveMins / 60)} sa {row.effectiveMins % 60} dk
                            </span>
                            {row.isManual ? (
                              <span className="text-[9px] font-sans px-1 rounded bg-emerald-500/20 text-emerald-300 uppercase tracking-tighter">
                                NET
                              </span>
                            ) : row.effectiveMins > 0 ? (
                              <span className="text-[9px] font-sans px-1 rounded bg-slate-800 text-slate-400 uppercase tracking-tighter">
                                GÖREV
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-500">+</span>
                            )}
                          </button>
                        </td>

                        {/* Verimlilik / Başarı Rozeti */}
                        <td className="py-4 px-4 text-center whitespace-nowrap">
                          {row.dayPlannedMins === 0 && row.effectiveMins === 0 ? (
                            <span className="text-slate-600 text-[11px] italic">—</span>
                          ) : row.progressPercent >= 100 ? (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                              <span>🌟</span>
                              <span>%{row.progressPercent}</span>
                            </span>
                          ) : row.progressPercent >= 75 ? (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-teal-500/20 text-teal-300 border border-teal-500/40">
                              <span>✅</span>
                              <span>%{row.progressPercent}</span>
                            </span>
                          ) : row.progressPercent >= 50 ? (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                              <span>⚡</span>
                              <span>%{row.progressPercent}</span>
                            </span>
                          ) : row.effectiveMins > 0 ? (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-orange-500/20 text-orange-300 border border-orange-500/40">
                              <span>⏳</span>
                              <span>%{row.progressPercent}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-800 text-slate-400">
                              <span>⭕</span>
                              <span>%0</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>

                {/* TABLE SUMMARY FOOTER ROW */}
                <tfoot className="bg-slate-950 font-black text-xs border-t-2 border-slate-700">
                  <tr>
                    <td className="py-3.5 px-4 text-white uppercase tracking-wider">
                      Genel Toplam (7 Gün)
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {activeWeekTotals.totalTasks} Görev Planlandı ({activeWeekTotals.totalCompletedTasks} Tamamlandı)
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-slate-300">
                      {Math.floor(activeWeekTotals.totalPlannedMins / 60)} sa {activeWeekTotals.totalPlannedMins % 60} dk
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-slate-300">
                      {Math.floor(activeWeekTotals.totalCompletedTaskMins / 60)} sa {activeWeekTotals.totalCompletedTaskMins % 60} dk
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-emerald-400 text-sm">
                      {Math.floor(activeWeekTotals.totalEffectiveStudyMins / 60)} sa {activeWeekTotals.totalEffectiveStudyMins % 60} dk
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-mono font-bold">
                        %{activeWeekTotals.overallPercent}
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 4: PLAN ARCHIVE & PAST STATISTICS VIEW */}
      {activeSubTab === 'history' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* HISTORY ANALYTICS INSIGHTS */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center space-x-3.5">
              <div className="w-10 h-10 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400 shrink-0">
                <CalendarDays className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase">Kayıtlı Geçmiş Hafta</div>
                <div className="text-lg font-black text-white font-mono">{orderedWeeks.length} Hafta</div>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center space-x-3.5">
              <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400 shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase">Ortalama Uyum Oranı</div>
                <div className="text-lg font-black text-emerald-400 font-mono">
                  {orderedWeeks.length > 0 
                    ? Math.round(getWeeklyStats().reduce((sum, w) => sum + (w['Görev Uyumu (%)'] || 0), 0) / orderedWeeks.length)
                    : 0}%
                </div>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center space-x-3.5">
              <div className="w-10 h-10 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-center justify-center text-purple-400 shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase">Toplam Çalışma Süresi</div>
                <div className="text-lg font-black text-white font-mono">
                  {getWeeklyStats().reduce((sum, w) => sum + (w['Çalışma Süresi (Saat)'] || 0), 0).toFixed(1)} Saat
                </div>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center space-x-3.5">
              <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center text-amber-400 shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase">En Çok Çalışılan Ders</div>
                <div className="text-sm font-black text-amber-300 truncate max-w-[150px]">
                  {(() => {
                    const subStats = getSubjectDistributionStats();
                    if (subStats.length === 0) return 'Veri Yok';
                    const maxSub = subStats.reduce((max, s) => s['Tamamlanan (Saat)'] > max['Tamamlanan (Saat)'] ? s : max, subStats[0]);
                    return maxSub ? `${maxSub.name} (${maxSub['Tamamlanan (Saat)']} sa)` : 'Veri Yok';
                  })()}
                </div>
              </div>
            </div>
          </div>

          {/* HERO CHART: NET ÇALIŞMA SÜRELERİ & KRONOMETRE ANALİZ GRAFİĞİ */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 backdrop-blur-md">
            
            {/* Header & Controls Bar */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                    <Timer className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white flex items-center space-x-2">
                      <span>Net Çalışma Süresi & Kronometre Takip Grafiği</span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Kronometreyle tuttuğunuz net çalışma süreleri ve görev sürelerinin periyodik analizi
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons & Selectors */}
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Scope Switcher */}
                <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
                  <button
                    type="button"
                    onClick={() => setNetChartScope('selected_week')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      netChartScope === 'selected_week'
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Seçili Hafta Günleri
                  </button>
                  <button
                    type="button"
                    onClick={() => setNetChartScope('all_weeks')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      netChartScope === 'all_weeks'
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Haftalık Trend
                  </button>
                  <button
                    type="button"
                    onClick={() => setNetChartScope('all_days')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      netChartScope === 'all_days'
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Tüm Günler
                  </button>
                </div>

                {/* Chart Type Switcher */}
                <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
                  <button
                    type="button"
                    onClick={() => setNetChartType('bar')}
                    className={`px-2.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      netChartType === 'bar'
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title="Çubuk Grafik"
                  >
                    Çubuk
                  </button>
                  <button
                    type="button"
                    onClick={() => setNetChartType('area')}
                    className={`px-2.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      netChartType === 'area'
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title="Alan Grafiği"
                  >
                    Alan
                  </button>
                  <button
                    type="button"
                    onClick={() => setNetChartType('line')}
                    className={`px-2.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      netChartType === 'line'
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title="Çizgi Grafik"
                  >
                    Çizgi
                  </button>
                </div>

                {/* Settings Toggle Button */}
                <button
                  type="button"
                  onClick={() => setShowNetChartSettings(!showNetChartSettings)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                    showNetChartSettings
                      ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Settings2 className="w-3.5 h-3.5" />
                  <span>Grafik Ayarları</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showNetChartSettings ? 'rotate-180' : ''}`} />
                </button>
              </div>
            </div>

            {/* EXPANDABLE SETTINGS PANEL */}
            {showNetChartSettings && (
              <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-4 space-y-3.5 animate-in slide-in-from-top-2 duration-200">
                <div className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Grafik Görünüm ve Hedef Parametreleri</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  {/* Target Line Setting */}
                  <div className="bg-slate-900/90 border border-slate-800/80 p-3 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-300 flex items-center space-x-1.5">
                        <Target className="w-3.5 h-3.5 text-amber-400" />
                        <span>Günlük Hedef Çizgisi:</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setNetChartShowTargetLine(!netChartShowTargetLine)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded cursor-pointer ${
                          netChartShowTargetLine ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-slate-800 text-slate-500'
                        }`}
                      >
                        {netChartShowTargetLine ? 'Açık' : 'Kapalı'}
                      </button>
                    </div>
                    {netChartShowTargetLine && (
                      <div className="flex items-center gap-1 pt-1">
                        {[4, 5, 6, 7, 8].map(h => (
                          <button
                            key={h}
                            type="button"
                            onClick={() => setNetChartTargetHours(h)}
                            className={`flex-1 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                              netChartTargetHours === h
                                ? 'bg-amber-500 text-slate-950 shadow-sm'
                                : 'bg-slate-800 text-slate-400 hover:text-white'
                            }`}
                          >
                            {h} sa
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Task Comparison Setting */}
                  <div className="bg-slate-900/90 border border-slate-800/80 p-3 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-300 flex items-center space-x-1.5">
                        <Activity className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Görev Süresi Kıyası:</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setNetChartCompareTasks(!netChartCompareTasks)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded cursor-pointer ${
                          netChartCompareTasks ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40' : 'bg-slate-800 text-slate-500'
                        }`}
                      >
                        {netChartCompareTasks ? 'Gösteriliyor' : 'Gizli'}
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-tight">
                      Ders planındaki tamamlanan görev sürelerini yanına ekler.
                    </p>
                  </div>

                  {/* Average Line Setting */}
                  <div className="bg-slate-900/90 border border-slate-800/80 p-3 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-300 flex items-center space-x-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                        <span>Ortalama Çizgisi:</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setNetChartShowAvgLine(!netChartShowAvgLine)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded cursor-pointer ${
                          netChartShowAvgLine ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40' : 'bg-slate-800 text-slate-500'
                        }`}
                      >
                        {netChartShowAvgLine ? 'Açık' : 'Kapalı'}
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-tight">
                      Dönem içi ortalama süreyi pembe referans çizgisi ile belirtir.
                    </p>
                  </div>

                  {/* Unit Setting */}
                  <div className="bg-slate-900/90 border border-slate-800/80 p-3 rounded-xl space-y-2">
                    <span className="font-bold text-slate-300 flex items-center space-x-1.5">
                      <Clock className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Süre Birimi:</span>
                    </span>
                    <div className="flex items-center gap-1.5 pt-0.5">
                      <button
                        type="button"
                        onClick={() => setNetChartUnit('hours')}
                        className={`flex-1 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
                          netChartUnit === 'hours'
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        Saat (sa)
                      </button>
                      <button
                        type="button"
                        onClick={() => setNetChartUnit('minutes')}
                        className={`flex-1 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
                          netChartUnit === 'minutes'
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        Dakika (dk)
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Metrics Bar inside Hero Card */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1">
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Dönem Net Toplamı</div>
                <div className="text-sm font-black text-emerald-400 font-mono mt-0.5">{netMetrics.totalHours} Saat</div>
              </div>
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Ortalama Net Süre</div>
                <div className="text-sm font-black text-white font-mono mt-0.5">{netMetrics.avgHours} sa / gün</div>
              </div>
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Zirve Değer</div>
                <div className="text-sm font-black text-amber-300 font-mono mt-0.5 truncate">
                  {netMetrics.maxVal} {netMetrics.unitLabel} <span className="text-[10px] text-slate-400 font-normal">({netMetrics.maxName})</span>
                </div>
              </div>
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Hedefi Aşanlar</div>
                <div className="text-sm font-black text-indigo-300 font-mono mt-0.5">
                  {netMetrics.targetMetCount} / {netMetrics.targetTotal} ({netMetrics.targetTotal > 0 ? Math.round((netMetrics.targetMetCount / netMetrics.targetTotal) * 100) : 0}%)
                </div>
              </div>
              <div className="col-span-2 sm:col-span-1 bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Net / Görev Farkı</div>
                <div className="text-sm font-black text-emerald-300 font-mono mt-0.5">
                  {Number(netMetrics.diffHours) >= 0 ? `+${netMetrics.diffHours}` : netMetrics.diffHours} Saat
                </div>
              </div>
            </div>

            {/* Recharts Chart Rendering */}
            <div className="h-72 w-full pt-2">
              {netStudyChartData.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-xs text-slate-500 italic">
                  Görüntülenecek net çalışma verisi bulunmuyor.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  {netChartType === 'bar' ? (
                    <BarChart data={netStudyChartData} margin={{ top: 15, right: 15, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="netBarGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" stopOpacity={1}/>
                          <stop offset="100%" stopColor="#059669" stopOpacity={0.8}/>
                        </linearGradient>
                        <linearGradient id="taskBarGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#6366f1" stopOpacity={0.8}/>
                          <stop offset="100%" stopColor="#4338ca" stopOpacity={0.6}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="name" stroke="#64748b" style={{ fontSize: '11px', fontWeight: 'bold' }} />
                      <YAxis stroke="#64748b" style={{ fontSize: '10px' }} unit={` ${netMetrics.unitLabel}`} />
                      <Tooltip content={<CustomNetTooltip />} />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                      {netChartShowTargetLine && (
                        <ReferenceLine 
                          y={netChartUnit === 'hours' ? netChartTargetHours : netChartTargetHours * 60} 
                          stroke="#f59e0b" 
                          strokeDasharray="4 4" 
                          strokeWidth={2}
                          label={{ value: `🎯 Hedef: ${netChartTargetHours} sa`, fill: '#f59e0b', fontSize: 10, position: 'top' }} 
                        />
                      )}
                      {netChartShowAvgLine && (
                        <ReferenceLine 
                          y={netMetrics.avgVal} 
                          stroke="#ec4899" 
                          strokeDasharray="3 3" 
                          strokeWidth={1.5}
                          label={{ value: `📊 Ort: ${netMetrics.avgHours} sa`, fill: '#ec4899', fontSize: 10, position: 'insideBottomRight' }} 
                        />
                      )}
                      <Bar name="Net Çalışma Süresi" dataKey="Net Çalışma" fill="url(#netBarGrad)" radius={[6, 6, 0, 0]} />
                      {netChartCompareTasks && (
                        <Bar name="Planlanan Görev Süresi" dataKey="Görev Süresi" fill="url(#taskBarGrad)" radius={[6, 6, 0, 0]} />
                      )}
                    </BarChart>
                  ) : netChartType === 'area' ? (
                    <AreaChart data={netStudyChartData} margin={{ top: 15, right: 15, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="netAreaGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="taskAreaGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="name" stroke="#64748b" style={{ fontSize: '11px', fontWeight: 'bold' }} />
                      <YAxis stroke="#64748b" style={{ fontSize: '10px' }} unit={` ${netMetrics.unitLabel}`} />
                      <Tooltip content={<CustomNetTooltip />} />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                      {netChartShowTargetLine && (
                        <ReferenceLine 
                          y={netChartUnit === 'hours' ? netChartTargetHours : netChartTargetHours * 60} 
                          stroke="#f59e0b" 
                          strokeDasharray="4 4" 
                          strokeWidth={2}
                          label={{ value: `🎯 Hedef: ${netChartTargetHours} sa`, fill: '#f59e0b', fontSize: 10, position: 'top' }} 
                        />
                      )}
                      {netChartShowAvgLine && (
                        <ReferenceLine 
                          y={netMetrics.avgVal} 
                          stroke="#ec4899" 
                          strokeDasharray="3 3" 
                          strokeWidth={1.5}
                          label={{ value: `📊 Ort: ${netMetrics.avgHours} sa`, fill: '#ec4899', fontSize: 10, position: 'insideBottomRight' }} 
                        />
                      )}
                      <Area type="monotone" name="Net Çalışma Süresi" dataKey="Net Çalışma" stroke="#10b981" strokeWidth={3} fill="url(#netAreaGrad)" />
                      {netChartCompareTasks && (
                        <Area type="monotone" name="Planlanan Görev Süresi" dataKey="Görev Süresi" stroke="#6366f1" strokeWidth={2} strokeDasharray="3 3" fill="url(#taskAreaGrad)" />
                      )}
                    </AreaChart>
                  ) : (
                    <LineChart data={netStudyChartData} margin={{ top: 15, right: 15, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="name" stroke="#64748b" style={{ fontSize: '11px', fontWeight: 'bold' }} />
                      <YAxis stroke="#64748b" style={{ fontSize: '10px' }} unit={` ${netMetrics.unitLabel}`} />
                      <Tooltip content={<CustomNetTooltip />} />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                      {netChartShowTargetLine && (
                        <ReferenceLine 
                          y={netChartUnit === 'hours' ? netChartTargetHours : netChartTargetHours * 60} 
                          stroke="#f59e0b" 
                          strokeDasharray="4 4" 
                          strokeWidth={2}
                          label={{ value: `🎯 Hedef: ${netChartTargetHours} sa`, fill: '#f59e0b', fontSize: 10, position: 'top' }} 
                        />
                      )}
                      {netChartShowAvgLine && (
                        <ReferenceLine 
                          y={netMetrics.avgVal} 
                          stroke="#ec4899" 
                          strokeDasharray="3 3" 
                          strokeWidth={1.5}
                          label={{ value: `📊 Ort: ${netMetrics.avgHours} sa`, fill: '#ec4899', fontSize: 10, position: 'insideBottomRight' }} 
                        />
                      )}
                      <Line type="monotone" name="Net Çalışma Süresi" dataKey="Net Çalışma" stroke="#10b981" strokeWidth={3.5} dot={{ r: 4, fill: '#10b981' }} activeDot={{ r: 6 }} />
                      {netChartCompareTasks && (
                        <Line type="monotone" name="Planlanan Görev Süresi" dataKey="Görev Süresi" stroke="#6366f1" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 3, fill: '#6366f1' }} activeDot={{ r: 5 }} />
                      )}
                    </LineChart>
                  )}
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* CHARTS SECTIONS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* AREA CHART - WEEKLY COMPLIANCE & STUDY HOURS */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-black text-white flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-indigo-400" />
                  <span>Haftalık Çalışma Performans Grafiği</span>
                </h3>
              </div>
              <div className="h-64 w-full">
                {orderedWeeks.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-xs text-slate-500 italic">
                    Grafik oluşturmak için henüz geçmiş arşiv bulunmuyor.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={[...getWeeklyStats()].reverse()} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorCompliance" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="name" stroke="#64748b" style={{ fontSize: '10px', fontWeight: 'bold' }} />
                      <YAxis stroke="#64748b" style={{ fontSize: '10px' }} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px', color: '#fff' }} />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                      <Area type="monotone" name="Görev Uyumu (%)" dataKey="Görev Uyumu (%)" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorCompliance)" />
                      <Area type="monotone" name="Çalışma Süresi (Saat)" dataKey="Çalışma Süresi (Saat)" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorHours)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* BAR CHART - SUBJECT DISTRIBUTION */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 gap-3">
                <h3 className="text-sm font-black text-white flex items-center space-x-2">
                  <BarChart3 className="w-4 h-4 text-purple-400" />
                  <span>Ders Bazlı Çalışma Dağılımı</span>
                </h3>
                
                <div className="flex flex-wrap items-center gap-2">
                  {/* Scope Toggle */}
                  <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-850 shrink-0 select-none">
                    <button
                      type="button"
                      onClick={() => setSubjectChartScope('total')}
                      className={`px-2.5 py-1 text-[10px] font-black rounded-lg transition-all cursor-pointer ${
                        subjectChartScope === 'total'
                          ? 'bg-purple-600/90 text-white shadow-sm shadow-purple-600/20'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Toplam Saat
                    </button>
                    <button
                      type="button"
                      onClick={() => setSubjectChartScope('selected')}
                      className={`px-2.5 py-1 text-[10px] font-black rounded-lg transition-all cursor-pointer ${
                        subjectChartScope === 'selected'
                          ? 'bg-purple-600/90 text-white shadow-sm shadow-purple-600/20'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Seçili Hafta
                    </button>
                  </div>

                  {/* Metric Toggle */}
                  <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-850 shrink-0 select-none">
                    <button
                      type="button"
                      onClick={() => setSubjectChartMetric('duration')}
                      className={`px-2.5 py-1 text-[10px] font-black rounded-lg transition-all cursor-pointer ${
                        subjectChartMetric === 'duration'
                          ? 'bg-indigo-600/90 text-white shadow-sm shadow-indigo-600/20'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Süre (Saat)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSubjectChartMetric('question')}
                      className={`px-2.5 py-1 text-[10px] font-black rounded-lg transition-all cursor-pointer ${
                        subjectChartMetric === 'question'
                          ? 'bg-indigo-600/90 text-white shadow-sm shadow-indigo-600/20'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Soru (Adet)
                    </button>
                  </div>
                </div>
              </div>
              <div className="h-64 w-full">
                {orderedWeeks.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-xs text-slate-500 italic">
                    Ders bazlı istatistik oluşturmak için henüz geçmiş arşiv bulunmuyor.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={getSubjectDistributionStats()} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="name" stroke="#64748b" style={{ fontSize: '10px', fontWeight: 'bold' }} />
                      <YAxis stroke="#64748b" style={{ fontSize: '10px' }} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px', color: '#fff' }} />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                      {subjectChartMetric === 'duration' ? (
                        <Bar name="Tamamlanan (Saat)" dataKey="Tamamlanan (Saat)" fill="#a855f7" radius={[4, 4, 0, 0]} />
                      ) : (
                        <Bar name="Tamamlanan (Soru)" dataKey="Tamamlanan (Soru)" fill="#ec4899" radius={[4, 4, 0, 0]} />
                      )}
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {/* DETAILED LOGS GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Weeks Selector Cards */}
            <div className="lg:col-span-4 space-y-3">
              <div className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2 pl-1 flex items-center space-x-1.5">
                <History className="w-3.5 h-3.5" />
                <span>Geçmiş Haftalar</span>
              </div>
              {orderedWeeks.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-slate-800 rounded-2xl text-slate-500 text-xs bg-slate-900/10">
                  Arşivlenmiş hafta bulunmamaktadır. Sağ üstteki "Haftayı Arşive Kaldır" butonu ile mevcut haftanızı buraya ekleyebilirsiniz.
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5 max-h-[460px] overflow-y-auto pr-1">
                    {(() => {
                      const ITEMS_PER_PAGE = 5;
                      const startIndex = (historyWeeksPage - 1) * ITEMS_PER_PAGE;
                      const paginatedWeeks = orderedWeeks.slice(startIndex, startIndex + ITEMS_PER_PAGE);

                      return paginatedWeeks.map((weekLabel) => {
                        const weekPlans = getPlansForWeek(weekLabel);
                        const total = weekPlans.length;
                        const completed = weekPlans.filter(p => p.status === 'completed').length;
                        const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
                        const isSelected = isSameWeekLabel(activeHistoryWeek, weekLabel);

                        return (
                          <button
                            key={weekLabel}
                            onClick={() => setSelectedHistoryWeek(weekLabel)}
                            className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 cursor-pointer ${
                              isSelected
                                ? 'bg-gradient-to-br from-indigo-950/75 to-slate-900 border-indigo-500/80 shadow-md ring-1 ring-indigo-500/30'
                                : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-black text-white">{weekLabel}</span>
                              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-bold px-2 py-0.5 rounded-full border border-indigo-500/30">
                                {percent}% Başarı
                              </span>
                            </div>
                            
                            <div className="text-[10px] text-slate-400 font-semibold mt-1">
                              {completed} / {total} Ders Görevi Tamamlandı
                            </div>

                            <div className="w-full h-1.5 bg-slate-950 rounded-full mt-3 overflow-hidden border border-white/5">
                              <div
                                className={`h-full transition-all duration-500 rounded-full ${
                                  percent >= 85 
                                    ? 'bg-emerald-500' 
                                    : percent >= 60 
                                    ? 'bg-indigo-500' 
                                    : 'bg-amber-500'
                                }`}
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </button>
                        );
                      });
                    })()}
                  </div>

                  {/* Pagination Controls */}
                  {(() => {
                    const ITEMS_PER_PAGE = 5;
                    const totalHistoryPages = Math.ceil(orderedWeeks.length / ITEMS_PER_PAGE);
                    if (totalHistoryPages <= 1) return null;

                    return (
                      <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-800 text-[11px] font-bold">
                        <button
                          type="button"
                          onClick={() => setHistoryWeeksPage(p => Math.max(1, p - 1))}
                          disabled={historyWeeksPage === 1}
                          className="px-3 py-2 rounded-xl border border-slate-850 bg-slate-900/40 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 cursor-pointer transition-colors"
                        >
                          &larr; Önceki
                        </button>
                        <span className="text-slate-400 font-mono font-bold">
                          {historyWeeksPage} / {totalHistoryPages}
                        </span>
                        <button
                          type="button"
                          onClick={() => setHistoryWeeksPage(p => Math.min(totalHistoryPages, p + 1))}
                          disabled={historyWeeksPage === totalHistoryPages}
                          className="px-3 py-2 rounded-xl border border-slate-850 bg-slate-900/40 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 cursor-pointer transition-colors"
                        >
                          Sonraki &rarr;
                        </button>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Right Column: Detailed Day List */}
            <div className="lg:col-span-8 space-y-4">
              {orderedWeeks.length === 0 ? (
                <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-10 text-center text-slate-500 text-xs">
                  Ayrıntılı raporu görüntülemek için lütfen sol taraftan bir hafta seçin veya yeni bir hafta arşivleyin.
                </div>
              ) : (
                <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur-md space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
                    <div>
                      <h3 className="text-lg font-black text-white flex items-center space-x-2.5">
                        <Calendar className="w-5 h-5 text-purple-400" />
                        <span>{activeHistoryWeek} Detaylı Raporu</span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">
                        Bu hafta uyguladığınız ders programı ve detaylı ders performansı.
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-xs font-bold text-slate-300 bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      <span>
                        Uyum Oranı: {(() => {
                          const plans = getPlansForWeek(activeHistoryWeek);
                          const tot = plans.length;
                          const cmp = plans.filter(p => p.status === 'completed').length;
                          return tot > 0 ? Math.round((cmp / tot) * 100) : 0;
                        })()}%
                      </span>
                    </div>
                  </div>

                  {/* AI COACH FEEDBACK BASED ON COMPLIANCE */}
                  {(() => {
                    const plans = getPlansForWeek(activeHistoryWeek);
                    const tot = plans.length;
                    const cmp = plans.filter(p => p.status === 'completed').length;
                    const percent = tot > 0 ? Math.round((cmp / tot) * 100) : 0;

                    let title = 'Yeterli Veri Yok';
                    let feedback = 'Haftalık uyumunuzu görmek için lütfen arşivleri oluşturun.';
                    let colorClass = 'bg-slate-950 border-slate-800 text-slate-300';
                    let icon = 'ℹ️';

                    if (tot > 0) {
                      if (percent >= 85) {
                        title = 'Kusursuz Performans!';
                        feedback = 'Harika bir hafta geçirdin! Programına neredeyse kusursuz uydun. Bu tempo ve disiplin seni doğrudan YKS hedefindeki üniversiteye ulaştıracak! Kendinle gurur duy ve asla gevşeme. 🌟';
                        colorClass = 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300';
                        icon = '🌟';
                      } else if (percent >= 60) {
                        title = 'Güzel Çaba, Potansiyel Yüksek!';
                        feedback = 'Güzel bir çaba! Bazı hedefler ertelenmiş olsa da genel uyumun gayet iyi. Bir sonraki hafta eksik kaldığın konulara biraz daha ağırlık vererek fark yaratabilirsin. İstikrar en büyük anahtardır! 👍';
                        colorClass = 'bg-indigo-950/40 border-indigo-500/30 text-indigo-300';
                        icon = '👍';
                      } else {
                        title = 'Taktiksel Değişim Zamanı';
                        feedback = 'Bu hafta planına sadık kalmakta biraz zorlanmışsın. Hiç sorun değil! Kendini hırpalamadan, planındaki ders sürelerini biraz düşürerek daha sürdürülebilir bir tempo bulmaya çalış. Ders programını hafifletmek verimini artırabilir. 🎯';
                        colorClass = 'bg-amber-950/40 border-amber-500/30 text-amber-300';
                        icon = '🎯';
                      }
                    }

                    return (
                      <div className={`p-4 rounded-2xl border flex items-start space-x-3.5 ${colorClass}`}>
                        <span className="text-xl shrink-0 mt-0.5">{icon}</span>
                        <div className="space-y-1">
                          <div className="text-xs font-black uppercase tracking-wider">{title}</div>
                          <p className="text-xs font-medium leading-relaxed opacity-90">{feedback}</p>
                        </div>
                      </div>
                    );
                  })()}

                  {/* TASK ITEMS LIST FOR SELECTED WEEK */}
                  <div className="space-y-5 max-h-[500px] overflow-y-auto pr-1">
                    {DAYS.map((day) => {
                      const plans = getPlansForWeek(activeHistoryWeek).filter(p => p.day === day);
                      if (plans.length === 0) return null;

                      return (
                        <div key={day} className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-4 space-y-3.5 shadow-sm transition-all hover:border-slate-800">
                          <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
                            <div className="flex items-center space-x-2">
                              <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full shrink-0" />
                              <span className="text-xs font-black text-indigo-300 tracking-wider uppercase font-mono">{day} Günü</span>
                            </div>
                            <span className="text-[10px] text-slate-400 bg-slate-900 border border-slate-800 px-2.5 py-0.5 rounded-full font-bold">
                              {plans.length} Ders Görevi
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {plans.map((p) => (
                              <div
                                key={p.id}
                                className={`p-3.5 rounded-xl border flex flex-col justify-between space-y-2 transition-all hover:bg-slate-900/30 ${
                                  p.status === 'completed'
                                    ? 'bg-emerald-950/10 border-emerald-500/20 text-slate-300'
                                    : 'bg-slate-900/10 border-slate-800/80'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0 space-y-1">
                                    <div className="flex flex-wrap items-center gap-1.5">
                                      <span className="text-[11px] font-black text-white bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800 truncate max-w-[150px]">
                                        {p.subject}
                                      </span>
                                      {p.taskType && (
                                        <span className="text-[9px] font-black text-amber-400 bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 rounded-full">
                                          {p.taskType}
                                        </span>
                                      )}
                                    </div>
                                    <h4 className="text-xs font-bold text-slate-200 line-clamp-2">{p.topic}</h4>
                                  </div>

                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 ${
                                    p.status === 'completed'
                                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  }`}>
                                    {p.status === 'completed' ? '✓ Bitti' : '⏳ Bekliyor'}
                                  </span>
                                </div>

                                {!isVideoTask(p) && (
                                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1.5 border-t border-slate-800/60">
                                    <span>Hedef: {p.plannedMinutes}dk</span>
                                    {p.targetQuestionCount ? (
                                      <span className="text-emerald-400 font-bold">{p.targetQuestionCount} Soru</span>
                                    ) : null}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
