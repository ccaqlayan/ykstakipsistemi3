import React, { useState, useEffect, useMemo } from 'react';
import { Sliders, LayoutGrid, Award } from 'lucide-react';
import { YKSDataState, StudentProfile, UserAccount, QuickNote } from '../types';
import { TargetModal } from './TargetModal';
import { WeeklyAiReportCardModal } from './reports/WeeklyAiReportCardModal';
import { getGradeLevel } from '../utils/gradeUtils';
import { 
  DashboardCustomizeModal, 
  DashboardWidgetConfig, 
  DEFAULT_DASHBOARD_WIDGETS 
} from './DashboardCustomizeModal';

// Subcomponents
import { DSH_STORAGE_KEY, mergeWidgetsWithDefaults } from './dashboard/DashboardTypes';
import { DashboardCountdownBar } from './dashboard/DashboardCountdownBar';
import { DashboardReadinessModal } from './dashboard/DashboardReadinessModal';
import { DashboardTargetBanner } from './dashboard/DashboardTargetBanner';
import { DashboardDailyRoutines } from './dashboard/DashboardDailyRoutines';
import { 
  renderKpiQuestions, 
  renderKpiMocks, 
  renderKpiErrors, 
  renderKpiResources 
} from './dashboard/DashboardKpiCards';
import { 
  renderSubjectProgressWidget, 
  renderBranchExamsWidget, 
  renderPastExamsWidget, 
  renderVideoLessonsWidget, 
  renderPomodoroStatsWidget 
} from './dashboard/DashboardSubjectWidget';
import { renderMockChartWidget, renderErrorReasonsWidget } from './dashboard/DashboardChartWidgets';
import { DashboardScheduleWidget } from './dashboard/DashboardScheduleWidget';
import { renderCoachNotes, renderQuickActions, renderAICoachSummaryWidget } from './dashboard/DashboardSideWidgets';
import { DashboardQuickNotes } from './dashboard/DashboardQuickNotes';
import { DashboardSubjectNotesModal } from './dashboard/DashboardSubjectNotesModal';
import { DashboardBadgesWidget } from './badges/DashboardBadgesWidget';

interface DashboardViewProps {
  state: YKSDataState;
  currentUser?: UserAccount | null;
  onNavigateTab: (tab: any) => void;
  onOpenProfile: () => void;
  onUpdateRoutines?: (routines: any[], actionText?: string) => void;
  onUpdateStudentProfile?: (updatedStudentProfile: StudentProfile) => void;
  onUpdateSubjectNotes?: (subjectName: string, notes: { studentNote?: string; teacherNote?: string }) => void;
  onUpdateDashboardWidgets?: (widgets: DashboardWidgetConfig[]) => void;
  onUpdateQuickNotes?: (notes: QuickNote[], actionText?: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  state,
  currentUser,
  onNavigateTab,
  onOpenProfile,
  onUpdateRoutines,
  onUpdateStudentProfile,
  onUpdateSubjectNotes,
  onUpdateDashboardWidgets,
  onUpdateQuickNotes
}) => {
  const { 
    profile, 
    questionLogs = [], 
    generalMocks = [], 
    topicErrors = [], 
    studyPlans = [], 
    resources = [],
    branchExams = [],
    pastExams = [],
    youtubeVideos = [],
    coachAdvices = [],
    quickNotes = []
  } = state;

  const [showTargetModal, setShowTargetModal] = useState(false);
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  const [showReadinessModal, setShowReadinessModal] = useState(false);
  const [showWeeklyReportModal, setShowWeeklyReportModal] = useState(false);

  // Schedule Widget tab state (Yesterday, Today, Tomorrow)
  const [scheduleDayTab, setScheduleDayTab] = useState<'yesterday' | 'today' | 'tomorrow'>('today');
  const [scheduleViewMode, setScheduleViewMode] = useState<'tabs' | 'grid'>('tabs');

  // Subject progress notes modal states
  const [activeNotesSubject, setActiveNotesSubject] = useState<string | null>(null);
  const [studentNoteDraft, setStudentNoteDraft] = useState('');
  const [teacherNoteDraft, setTeacherNoteDraft] = useState('');

  const handleOpenNotesModal = (subjectName: string) => {
    setActiveNotesSubject(subjectName);
    const existingNotes = state.subjectNotes?.[subjectName] || { studentNote: '', teacherNote: '' };
    setStudentNoteDraft(existingNotes.studentNote || '');
    setTeacherNoteDraft(existingNotes.teacherNote || '');
  };

  const handleSaveNotes = () => {
    if (activeNotesSubject && onUpdateSubjectNotes) {
      onUpdateSubjectNotes(activeNotesSubject, {
        studentNote: studentNoteDraft,
        teacherNote: teacherNoteDraft
      });
      setActiveNotesSubject(null);
    }
  };

  // Widget Configuration State
  const [widgets, setWidgets] = useState<DashboardWidgetConfig[]>(() => {
    const cloudWidgets = state.dashboardWidgets || currentUser?.dashboardWidgets;
    if (cloudWidgets && Array.isArray(cloudWidgets) && cloudWidgets.length > 0) {
      return mergeWidgetsWithDefaults(cloudWidgets);
    }
    try {
      const saved = localStorage.getItem(DSH_STORAGE_KEY);
      if (saved) {
        const parsed: DashboardWidgetConfig[] = JSON.parse(saved);
        return mergeWidgetsWithDefaults(parsed);
      }
    } catch (err) {
      console.error('Failed to load dashboard widgets from localStorage', err);
    }
    return DEFAULT_DASHBOARD_WIDGETS;
  });

  useEffect(() => {
    const cloudWidgets = state.dashboardWidgets || currentUser?.dashboardWidgets;
    if (cloudWidgets && Array.isArray(cloudWidgets) && cloudWidgets.length > 0) {
      setWidgets(mergeWidgetsWithDefaults(cloudWidgets));
    }
  }, [state.dashboardWidgets, currentUser?.dashboardWidgets]);

  const handleSaveWidgets = (updated: DashboardWidgetConfig[]) => {
    setWidgets(updated);
    try {
      localStorage.setItem(DSH_STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to save dashboard widgets to localStorage', err);
    }
    if (onUpdateDashboardWidgets) {
      onUpdateDashboardWidgets(updated);
    }
  };

  const handleResetWidgets = () => {
    setWidgets(DEFAULT_DASHBOARD_WIDGETS);
    try {
      localStorage.removeItem(DSH_STORAGE_KEY);
    } catch (err) {
      console.error('Failed to reset dashboard widgets', err);
    }
    if (onUpdateDashboardWidgets) {
      onUpdateDashboardWidgets(DEFAULT_DASHBOARD_WIDGETS);
    }
  };

  // Routines State and Helpers
  const DEFAULT_ROUTINES = [
    { id: 'rot-1', title: 'Paragraf Çözümü', target: '20 Soru', completedDays: [] },
    { id: 'rot-2', title: 'Problem Çözümü', target: '15 Soru', completedDays: [] },
    { id: 'rot-3', title: 'Geometri Rutini', target: '10 Soru', completedDays: [] }
  ];

  const rawRoutines = state.routines && state.routines.length > 0 ? state.routines : DEFAULT_ROUTINES;
  const routines = rawRoutines.filter((r: any) => !r.isDeleted);

  const getTurkishDayName = (): string => {
    const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
    const todayIndex = new Date().getDay();
    return days[todayIndex];
  };

  const todayDayName = getTurkishDayName();
  const todaysRoutinesCount = routines.length;
  const todaysCompletedCount = routines.filter((r: any) => r.completedDays?.includes(todayDayName)).length;
  const overallTotalCheckboxes = routines.length * 7;
  const overallCompletedCheckboxes = routines.reduce((acc: number, r: any) => acc + (r.completedDays?.length || 0), 0);
  const overallPercent = overallTotalCheckboxes > 0 ? Math.round((overallCompletedCheckboxes / overallTotalCheckboxes) * 100) : 0;

  const handleToggleRoutineDay = (routineId: string, dayName: string) => {
    if (!onUpdateRoutines) return;
    
    let actionText = '';
    
    const updated = rawRoutines.map((r: any) => {
      if (r.id === routineId) {
        const completed = r.completedDays || [];
        const isCompleted = completed.includes(dayName);
        
        if (isCompleted) {
          actionText = `"${r.title}" rutini (${dayName}) için tamamlanmadı olarak işaretlendi.`;
        } else {
          actionText = `"${r.title}" rutini (${dayName}) için tamamlandı olarak işaretlendi.`;
        }
        
        return {
          ...r,
          completedDays: isCompleted 
            ? completed.filter((d: string) => d !== dayName)
            : [...completed, dayName]
        };
      }
      return r;
    });
    
    onUpdateRoutines(updated, actionText);
  };

  // Countdown
  const [daysLeft, setDaysLeft] = useState(0);
  const [timeBreakdown, setTimeBreakdown] = useState<{ months: number; days: number }>({ months: 0, days: 0 });

  useEffect(() => {
    const updateTimer = () => {
      const savedDateStr = localStorage.getItem('yks_target_date') || '2027-06-19';
      const yksTargetDate = new Date(`${savedDateStr}T10:00:00`);
      const now = new Date();
      const diff = yksTargetDate.getTime() - now.getTime();
      if (diff > 0) {
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        setDaysLeft(days);

        let months = (yksTargetDate.getFullYear() - now.getFullYear()) * 12 + (yksTargetDate.getMonth() - now.getMonth());
        let tempDate = new Date(now.getFullYear(), now.getMonth() + months, now.getDate());
        if (tempDate > yksTargetDate) {
          months--;
          tempDate = new Date(now.getFullYear(), now.getMonth() + months, now.getDate());
        }
        const remDays = Math.floor((yksTargetDate.getTime() - tempDate.getTime()) / (1000 * 60 * 60 * 24));
        setTimeBreakdown({ months, days: remDays });
      } else {
        setDaysLeft(0);
        setTimeBreakdown({ months: 0, days: 0 });
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000);

    window.addEventListener('yks_settings_updated', updateTimer);
    return () => {
      clearInterval(interval);
      window.removeEventListener('yks_settings_updated', updateTimer);
    };
  }, []);

  // General KPI Calculations
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);
  const sevenDaysCutoffStr = sevenDaysAgo.toISOString().split('T')[0];

  const last7DaysQuestionLogs = questionLogs.filter((q) => q.date && q.date >= sevenDaysCutoffStr);
  const logsFor7Days = last7DaysQuestionLogs.length > 0 ? last7DaysQuestionLogs : questionLogs.slice(-7);

  const totalQuestionsSolved = logsFor7Days.reduce((acc, q) => acc + q.solvedCount, 0);
  const totalQuestionsTarget = logsFor7Days.reduce((acc, q) => acc + q.targetCount, 0);
  const questionTargetPercent = totalQuestionsTarget > 0 
    ? Math.round((totalQuestionsSolved / totalQuestionsTarget) * 100) 
    : 0;

  const isDilField = profile?.targetField === 'DİL' || (profile?.targetField as string) === 'DIL';

  const sortedMocks = useMemo(() => {
    return [...generalMocks].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [generalMocks]);

  const latestMock = sortedMocks.length > 0 ? sortedMocks[0] : null;
  const latestTYTMock = sortedMocks.find(m => m.tyt && m.tyt.totalNet !== undefined && (m.examType === 'TYT' || m.examType === 'TYT_AYT' || m.examType === 'TYT_DIL' || m.tyt.totalNet > 0));
  const latestAYTMock = sortedMocks.find(m => m.ayt && m.ayt.totalNet !== undefined && (m.examType === 'AYT' || m.examType === 'TYT_AYT' || m.ayt.totalNet > 0));
  const latestYDTMock = sortedMocks.find(m => m.ydt && m.ydt.net !== undefined && (m.examType === 'DIL' || m.examType === 'TYT_DIL' || Number(m.ydt.net) > 0));

  const latestTYTNet = latestTYTMock?.tyt?.totalNet ?? (latestMock ? latestMock.tyt.totalNet : 0);
  const latestAYTNet = isDilField 
    ? (latestYDTMock?.ydt?.net ?? latestAYTMock?.ayt?.totalNet ?? (latestMock ? latestMock.ayt.totalNet : 0))
    : (latestAYTMock?.ayt?.totalNet ?? (latestMock ? latestMock.ayt.totalNet : 0));

  const pendingTopicErrors = topicErrors.filter((e) => !e.revised);

  // Resource Tracking stats
  const totalResources = resources.length;
  const completedResources = resources.filter((r) => r.status === 'completed').length;
  
  let totalResourceUnits = 0;
  let completedResourceUnits = 0;
  resources.forEach((r) => {
    const comp = r.completedTopics ? r.completedTopics.length : (r.completedUnits || 0);
    const tot = r.totalUnits || 1;
    completedResourceUnits += comp;
    totalResourceUnits += tot;
  });
  const resourcePercent = totalResourceUnits > 0 
    ? Math.min(100, Math.round((completedResourceUnits / totalResourceUnits) * 100))
    : 0;

  const gradeLevel = getGradeLevel(profile?.className || currentUser?.className);

  // Individual Widget Renderer Switcher
  const renderWidget = (widget: DashboardWidgetConfig) => {
    if (widget.id === 'subject_progress_widget' || widget.id.startsWith('subject_progress')) {
      return renderSubjectProgressWidget(state, onNavigateTab, handleOpenNotesModal, widget.config);
    }
    switch (widget.id) {
      case 'countdown': 
        return (
          <DashboardCountdownBar 
            daysLeft={daysLeft} 
            timeBreakdown={timeBreakdown} 
            gradeLevel={gradeLevel}
            onClick={() => setShowReadinessModal(true)} 
          />
        );
      case 'target_banner': 
        return (
          <DashboardTargetBanner 
            profile={profile} 
            latestTYTNet={latestTYTNet} 
            latestAYTNet={latestAYTNet} 
            gradeLevel={gradeLevel}
            schoolExams={state.schoolExams || []}
            onOpenTargetModal={() => setShowTargetModal(true)} 
          />
        );
      case 'badges_widget':
        return <DashboardBadgesWidget studentData={state} studentName={currentUser?.name} />;
      case 'daily_routines': 
        return (
          <DashboardDailyRoutines 
            routines={routines} 
            todayDayName={todayDayName} 
            todaysCompletedCount={todaysCompletedCount} 
            todaysRoutinesCount={todaysRoutinesCount} 
            overallPercent={overallPercent} 
            onToggleRoutineDay={handleToggleRoutineDay} 
            onNavigateTab={onNavigateTab} 
          />
        );
      case 'kpi_questions': 
        return renderKpiQuestions(totalQuestionsSolved, totalQuestionsTarget, questionTargetPercent, onNavigateTab);
      case 'kpi_mocks': 
        return renderKpiMocks(latestMock, latestTYTNet, latestAYTNet, onNavigateTab, isDilField);
      case 'kpi_errors': 
        return renderKpiErrors(pendingTopicErrors, onNavigateTab);
      case 'kpi_resources': 
        return renderKpiResources(completedResources, totalResources, resourcePercent, onNavigateTab);
      case 'branch_exams_widget': 
        return renderBranchExamsWidget(branchExams, onNavigateTab);
      case 'past_exams_widget': 
        return renderPastExamsWidget(pastExams, onNavigateTab);
      case 'video_lessons_widget': 
        return renderVideoLessonsWidget(youtubeVideos, onNavigateTab);
      case 'pomodoro_stats_widget': 
        return renderPomodoroStatsWidget(studyPlans, onNavigateTab);
      case 'mock_chart_widget': 
        return renderMockChartWidget(generalMocks, onNavigateTab);
      case 'error_reasons_widget': 
        return renderErrorReasonsWidget(topicErrors, onNavigateTab);
      case 'weekly_schedule': 
        return (
          <DashboardScheduleWidget 
            studyPlans={studyPlans} 
            scheduleDayTab={scheduleDayTab} 
            setScheduleDayTab={setScheduleDayTab} 
            scheduleViewMode={scheduleViewMode} 
            setScheduleViewMode={setScheduleViewMode} 
            onNavigateTab={onNavigateTab} 
          />
        );
      case 'coach_notes': 
        return renderCoachNotes(profile, onNavigateTab);
      case 'ai_coach_summary': 
        return renderAICoachSummaryWidget(coachAdvices, onNavigateTab);
      case 'quick_actions': 
        return renderQuickActions(onNavigateTab);
      case 'quick_notes': 
        return (
          <DashboardQuickNotes 
            quickNotes={quickNotes} 
            onUpdateQuickNotes={onUpdateQuickNotes} 
          />
        );
      default: 
        return null;
    }
  };

  const renderDashboardContent = () => {
    const activeWidgets = widgets.filter(w => w.visible).sort((a, b) => a.order - b.order);

    if (activeWidgets.length === 0) {
      return (
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 text-center space-y-4 my-6">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Tüm Özet Modülleri Gizlendi</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              Sayfada gösterilecek modül bulunmuyor. Sayfayı özelleştirmek ve modülleri tekrar görünür yapmak için düzenle butonuna tıkla.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowCustomizeModal(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-4 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-indigo-600/30 inline-flex items-center space-x-2 cursor-pointer"
          >
            <Sliders className="w-4 h-4" />
            <span>Modülleri Düzenle</span>
          </button>
        </div>
      );
    }

    const elements: React.ReactNode[] = [];
    let i = 0;

    while (i < activeWidgets.length) {
      const current = activeWidgets[i];

      // Group contiguous KPI cards
      if (current.category === 'kpis') {
        const kpiGroup: DashboardWidgetConfig[] = [];
        while (i < activeWidgets.length && activeWidgets[i].category === 'kpis') {
          kpiGroup.push(activeWidgets[i]);
          i++;
        }
        elements.push(
          <div key={`kpi-group-${i}`} className={`grid grid-cols-1 sm:grid-cols-2 ${kpiGroup.length >= 3 ? 'lg:grid-cols-4' : kpiGroup.length === 2 ? 'lg:grid-cols-2' : ''} gap-4`}>
            {kpiGroup.map(w => (
              <React.Fragment key={w.id}>
                {renderWidget(w)}
              </React.Fragment>
            ))}
          </div>
        );
        continue;
      }

      // Group contiguous Charts
      if (current.category === 'charts') {
        const chartGroup: DashboardWidgetConfig[] = [];
        while (i < activeWidgets.length && activeWidgets[i].category === 'charts') {
          chartGroup.push(activeWidgets[i]);
          i++;
        }
        elements.push(
          <div key={`chart-group-${i}`} className={`grid grid-cols-1 ${chartGroup.length > 1 ? 'lg:grid-cols-2' : ''} gap-6`}>
            {chartGroup.map(w => (
              <React.Fragment key={w.id}>
                {renderWidget(w)}
              </React.Fragment>
            ))}
          </div>
        );
        continue;
      }

      // Group contiguous Content items
      if (current.category === 'content') {
        const contentGroup: DashboardWidgetConfig[] = [];
        while (i < activeWidgets.length && activeWidgets[i].category === 'content') {
          contentGroup.push(activeWidgets[i]);
          i++;
        }

        const hasSchedule = contentGroup.some(w => w.id === 'weekly_schedule');
        const rightSideItems = contentGroup.filter(w => w.id === 'coach_notes' || w.id === 'ai_coach_summary' || w.id === 'quick_actions' || w.id === 'quick_notes');

        if (hasSchedule && rightSideItems.length > 0) {
          elements.push(
            <div key={`content-group-${i}`} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                {renderWidget(contentGroup.find(w => w.id === 'weekly_schedule')!)}
              </div>
              <div className="space-y-4">
                {rightSideItems.map(w => (
                  <React.Fragment key={w.id}>
                    {renderWidget(w)}
                  </React.Fragment>
                ))}
              </div>
            </div>
          );
        } else {
          contentGroup.forEach(w => {
            elements.push(
              <div key={w.id}>
                {renderWidget(w)}
              </div>
            );
          });
        }
        continue;
      }

      // Standalone header items
      elements.push(
        <div key={current.id} className={current.id === 'countdown' ? 'relative z-20' : current.id === 'target_banner' ? 'relative z-10' : ''}>
          {renderWidget(current)}
        </div>
      );
      i++;
    }

    return <div className="space-y-6">{elements}</div>;
  };

  return (
    <div className="space-y-5">
      
      {/* Top Header Bar with Customization Trigger Button */}
      <div className="flex flex-row items-center justify-between gap-2.5 bg-slate-900/80 backdrop-blur-md px-3 py-2.5 sm:px-4 sm:py-3 rounded-2xl border border-indigo-500/20 shadow-md">
        <div className="flex items-center space-x-2.5 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shadow-inner shrink-0">
            <Sliders className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xs sm:text-base md:text-lg font-bold text-white leading-tight truncate">Genel Özet & Performans</h1>
            <p className="text-[11px] text-slate-400 hidden md:block truncate">YKS çalışma sürecinin genel görünümü, hedeflerin ve kişiselleştirilebilir analiz kutucukları</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          {/* 📊 Haftalık AI Karnesi Butonu */}
          <button
            type="button"
            onClick={() => setShowWeeklyReportModal(true)}
            title="Bu haftanın yapay zeka gelişim karnesi ve YKS sıralama tahminini görüntüle"
            className="bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-indigo-500/20 hover:from-amber-500/30 hover:to-indigo-500/30 text-amber-300 hover:text-white border border-amber-500/40 px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl font-bold transition-all shadow-md shadow-amber-500/10 flex items-center space-x-1.5 cursor-pointer active:scale-95 whitespace-nowrap"
          >
            <Award className="w-4 h-4 text-amber-400 animate-pulse" />
            <span className="text-xs font-black">Haftalık AI Karnesi</span>
          </button>

          <button
            type="button"
            onClick={() => setShowCustomizeModal(true)}
            title="Dashboard modüllerini göster/gizle ve sırala"
            className="bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-400/40 px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl font-bold transition-all shadow-lg shadow-indigo-600/30 flex items-center space-x-1.5 cursor-pointer active:scale-95 whitespace-nowrap"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-xs">Modülleri Özelleştir</span>
          </button>
        </div>
      </div>

      {/* Main Dynamic Dashboard Content */}
      {renderDashboardContent()}

      {/* 📊 Haftalık AI Başarı Karnesi Modalı */}
      {showWeeklyReportModal && (
        <WeeklyAiReportCardModal
          isOpen={showWeeklyReportModal}
          onClose={() => setShowWeeklyReportModal(false)}
          currentUser={currentUser}
          profile={profile}
          questionLogs={questionLogs}
          generalMocks={generalMocks}
          studyPlans={studyPlans}
          schoolExams={state.schoolExams}
        />
      )}

      {/* Target Edit Modal */}
      {showTargetModal && (
        <TargetModal
          profile={profile}
          onSave={(updatedProfile) => {
            if (onUpdateStudentProfile) {
              onUpdateStudentProfile(updatedProfile);
            }
          }}
          onClose={() => setShowTargetModal(false)}
          onOpenFullProfile={onOpenProfile}
        />
      )}

      {/* Customize Dashboard Layout Modal */}
      {showCustomizeModal && (
        <DashboardCustomizeModal
          widgets={widgets}
          onSave={handleSaveWidgets}
          onReset={handleResetWidgets}
          onClose={() => setShowCustomizeModal(false)}
        />
      )}

      {/* Subject Notes Modal */}
      <DashboardSubjectNotesModal
        activeNotesSubject={activeNotesSubject}
        studentNoteDraft={studentNoteDraft}
        setStudentNoteDraft={setStudentNoteDraft}
        teacherNoteDraft={teacherNoteDraft}
        setTeacherNoteDraft={setTeacherNoteDraft}
        currentUser={currentUser}
        onSaveNotes={handleSaveNotes}
        onClose={() => setActiveNotesSubject(null)}
        onUpdateSubjectNotes={onUpdateSubjectNotes}
      />

      {/* YKS Genel Hazırlık & Performans Durumu Modalı */}
      {showReadinessModal && (
        <DashboardReadinessModal
          state={state}
          daysLeft={daysLeft}
          timeBreakdown={timeBreakdown}
          onNavigateTab={onNavigateTab}
          onClose={() => setShowReadinessModal(false)}
        />
      )}

    </div>
  );
};
