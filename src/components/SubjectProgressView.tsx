import React, { useState, useMemo, useEffect } from 'react';
import { YKSDataState, FieldType } from '../types';
import { YKS_CURRICULUM_TOPICS } from '../data/initialData';
import { X, Image as ImageIcon } from 'lucide-react';

// Subcomponent imports
import {
  SUBJECT_CATEGORIES,
  SubjectCategory,
  DetailSubTab,
  isTYTKey,
  isAYTKey,
  isWithinTimeRange,
  matchesExamScope,
  matchesSubjectCategory,
  computeStudyMinutes,
} from './subject/SubjectTypes';
import { SubjectLandingGrid } from './subject/SubjectLandingGrid';
import { SubjectDetailHeader } from './subject/SubjectDetailHeader';
import { SubjectDetailOverviewTab } from './subject/SubjectDetailOverviewTab';
import { SubjectTopicsTab } from './subject/SubjectTopicsTab';
import { SubjectResourcesTab } from './subject/SubjectResourcesTab';
import { SubjectQuestionsTab } from './subject/SubjectQuestionsTab';
import { SubjectStudyTab } from './subject/SubjectStudyTab';
import { SubjectMocksTab } from './subject/SubjectMocksTab';
import { SubjectVideoErrorsTab } from './subject/SubjectVideoErrorsTab';

interface SubjectProgressViewProps {
  state: YKSDataState;
  onUpdateTopicStatus?: (
    topicName: string,
    status: 'Çalışmadım' | 'Erteledim' | 'Zor Geldi' | 'Çalıştım' | 'Uzmanlaştım',
    isManual?: boolean
  ) => void;
  onNavigateTab?: (tab: string, opts?: { subTab?: 'resources' | 'topics'; subject?: string }) => void;
}

function getFieldTitle(field: FieldType): string {
  if (field === 'SAY') return 'Sayısal';
  if (field === 'EA') return 'Eşit Ağırlık';
  if (field === 'SÖZ') return 'Sözel';
  if (field === 'DİL') return 'Yabancı Dil (YDT)';
  return 'Sayısal';
}

export { SUBJECT_CATEGORIES };
export type { SubjectCategory };

const SubjectProgressView: React.FC<SubjectProgressViewProps> = ({
  state,
  onUpdateTopicStatus,
  onNavigateTab
}) => {
  // ==== MAIN NAVIGATION STATE ====
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [detailSubTab, setDetailSubTab] = useState<DetailSubTab>('overview');
  const [detailExamFilter, setDetailExamFilter] = useState<'TÜMÜ' | 'TYT' | 'AYT'>('TÜMÜ');

  // ==== LANDING GRID STATE ====
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('ALANIM');
  const [searchQuery, setSearchQuery] = useState('');
  const [landingTimeRange, setLandingTimeRange] = useState<'haftalik' | 'aylik' | 'tumu'>('tumu');

  // ==== TOPICS TAB STATE ====
  const [topicSearchQuery, setTopicSearchQuery] = useState('');
  const [topicStatusFilter, setTopicStatusFilter] = useState('ALL');
  const [topicPage, setTopicPage] = useState(1);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [curriculumViewMode, setCurriculumViewMode] = useState<'status' | 'resource'>('status');

  // ==== QUESTIONS / RESOURCES / STUDY / MOCK / VIDEO STATE ====
  const [questionPage, setQuestionPage] = useState(1);
  const [resourcePage, setResourcePage] = useState(1);
  const [studyPage, setStudyPage] = useState(1);
  const [mockPage, setMockPage] = useState(1);
  const [generalMockPage, setGeneralMockPage] = useState(1);
  const [videoPage, setVideoPage] = useState(1);
  const [errorPage, setErrorPage] = useState(1);
  const [mockTypeTab, setMockTypeTab] = useState<'all' | 'branch' | 'general'>('all');
  const [expandedMockIds, setExpandedMockIds] = useState<Record<string, boolean>>({});

  // ==== LIGHTBOX STATE ====
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  // Reset pagination when subject/tab changes
  useEffect(() => {
    setTopicPage(1);
    setQuestionPage(1);
    setResourcePage(1);
    setStudyPage(1);
    setMockPage(1);
    setGeneralMockPage(1);
    setVideoPage(1);
    setErrorPage(1);
    setMockTypeTab('all');
    setExpandedMockIds({});
    setTopicSearchQuery('');
    setTopicStatusFilter('ALL');
    setDetailExamFilter('TÜMÜ');
  }, [selectedSubjectId, detailSubTab]);

  // Derive topic statuses from state
  const topicStatuses = useMemo(() => {
    return state.topicStatuses || {};
  }, [state.topicStatuses]);

  // Completed past topics (from archived study plans)
  const completedPastTopics = useMemo(() => {
    const completed: string[] = [];
    (state.studyPlans || []).forEach(p => {
      if (p.status === 'completed' && p.topic && p.archived) {
        completed.push(p.topic);
      }
    });
    return completed;
  }, [state.studyPlans]);

  // Target field from state
  const targetField: FieldType = useMemo(() => {
    return (state.profile?.targetField as FieldType) || 'SAY';
  }, [state.profile]);

  // Category statistics
  const categoryStats = useMemo(() => {
    return SUBJECT_CATEGORIES.map(category => {
      // Build topic groups from curriculum
      const topicGroups: { keyName: string; topics: string[] }[] = [];
      category.curriculumKeys.forEach(key => {
        const topics = YKS_CURRICULUM_TOPICS[key];
        if (topics && topics.length > 0) {
          topicGroups.push({ keyName: key, topics });
        }
      });

      let allTopics: string[] = [];
      topicGroups.forEach(g => allTopics.push(...g.topics));
      const uniqueTopics = Array.from(new Set(allTopics));

      let completedTopicsCount = 0;
      let masteredCount = 0;
      let workedCount = 0;
      let hardCount = 0;
      let postponedCount = 0;
      let notStartedCount = 0;

      uniqueTopics.forEach(t => {
        const status = topicStatuses[t];
        const isPastCompleted = completedPastTopics.includes(t);

        if (status === 'Uzmanlaştım') {
          masteredCount++;
          completedTopicsCount++;
        } else if (status === 'Çalıştım' || isPastCompleted) {
          workedCount++;
          completedTopicsCount++;
        } else if (status === 'Zor Geldi') {
          hardCount++;
        } else if (status === 'Erteledim') {
          postponedCount++;
        } else {
          notStartedCount++;
        }
      });

      const topicCompletionPercent = uniqueTopics.length > 0
        ? Math.round((completedTopicsCount / uniqueTopics.length) * 100)
        : 0;

      // TYT / AYT split topics
      const tytTopics = uniqueTopics.filter(t =>
        topicGroups.some(g => isTYTKey(g.keyName) && g.topics.includes(t))
      );
      const aytTopics = uniqueTopics.filter(t =>
        topicGroups.some(g => isAYTKey(g.keyName) && g.topics.includes(t))
      );

      const tytCompletedTopicsCount = tytTopics.filter(t => {
        const st = topicStatuses[t];
        return st === 'Uzmanlaştım' || st === 'Çalıştım' || completedPastTopics.includes(t);
      }).length;
      const aytCompletedTopicsCount = aytTopics.filter(t => {
        const st = topicStatuses[t];
        return st === 'Uzmanlaştım' || st === 'Çalıştım' || completedPastTopics.includes(t);
      }).length;

      const tytCompletionPercent = tytTopics.length > 0
        ? Math.round((tytCompletedTopicsCount / tytTopics.length) * 100)
        : 0;
      const aytCompletionPercent = aytTopics.length > 0
        ? Math.round((aytCompletedTopicsCount / aytTopics.length) * 100)
        : 0;

      // Resources
      const matchedResources = (state.resources || []).filter(r =>
        matchesSubjectCategory(r.subject, category)
      );
      const totalResourceUnits = matchedResources.reduce((acc, r) => acc + (r.totalUnits || 0), 0);
      const completedResourceUnits = matchedResources.reduce((acc, r) => acc + (r.completedUnits || 0), 0);
      const resourcePercent = totalResourceUnits > 0
        ? Math.round((completedResourceUnits / totalResourceUnits) * 100)
        : 0;

      // Question Logs
      const matchedLogs = (state.questionLogs || [])
        .filter(l => matchesSubjectCategory(l.subject, category) && isWithinTimeRange(l.date, landingTimeRange))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const totalSolvedQuestions = matchedLogs.reduce((acc, l) => acc + (l.solvedCount || 0), 0);
      const totalCorrectQuestions = matchedLogs.reduce((acc, l) => acc + (l.correctCount || 0), 0);
      const totalWrongQuestions = matchedLogs.reduce((acc, l) => acc + (l.wrongCount || 0), 0);
      const totalEmptyQuestions = matchedLogs.reduce((acc, l) => acc + (l.emptyCount || 0), 0);
      const questionAccuracy = (totalCorrectQuestions + totalWrongQuestions + totalEmptyQuestions) > 0
        ? Math.round((totalCorrectQuestions / (totalCorrectQuestions + totalWrongQuestions + totalEmptyQuestions)) * 100)
        : 0;

      // Study Plans
      const matchedPlans = (state.studyPlans || [])
        .filter(p => matchesSubjectCategory(p.subject, category) && isWithinTimeRange(p.date, landingTimeRange))
        .sort((a, b) => {
          const timeA = a.date ? new Date(a.date).getTime() : 0;
          const timeB = b.date ? new Date(b.date).getTime() : 0;
          return timeB - timeA;
        });

      // Branch Exams
      const matchedBranchExams = (state.branchExams || [])
        .filter(b => matchesSubjectCategory(b.subject, category) && isWithinTimeRange(b.date, landingTimeRange))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const branchExamCount = matchedBranchExams.length;
      const avgBranchNet = branchExamCount > 0
        ? (matchedBranchExams.reduce((acc, b) => acc + (b.net || 0), 0) / branchExamCount).toFixed(1)
        : '0.0';

      // General Mocks
      const matchedGeneralMocks = (state.generalMocks || [])
        .filter(g => isWithinTimeRange(g.date, landingTimeRange))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const generalExamCount = matchedGeneralMocks.length;

      // YouTube Videos
      const matchedVideos = (state.youtubeVideos || []).filter(v => matchesSubjectCategory(v.subject, category));
      const totalVideos = matchedVideos.length;
      const watchedVideos = matchedVideos.filter(v => v.isWatched).length;

      // Study minutes
      const totalStudyMinutes = computeStudyMinutes(matchedPlans, matchedBranchExams, matchedVideos);

      // Active days
      const categoryDates = new Set<string>();
      matchedPlans.forEach(p => {
        if (p.date && ((p.completedMinutes || 0) > 0 || p.status === 'completed')) {
          const dStr = p.date.trim().split(' ')[0];
          if (dStr) categoryDates.add(dStr);
        }
      });
      matchedBranchExams.forEach(b => {
        if (b.date) {
          const dStr = b.date.trim().split(' ')[0];
          if (dStr) categoryDates.add(dStr);
        }
      });
      matchedLogs.forEach(l => {
        if (l.date && (l.solvedCount || 0) > 0) {
          const dStr = l.date.trim().split(' ')[0];
          if (dStr) categoryDates.add(dStr);
        }
      });
      const activeDaysCount = Math.max(1, categoryDates.size);

      // Topic Errors
      const matchedErrors = (state.topicErrors || []).filter(e =>
        matchesSubjectCategory(e.subject, category) && isWithinTimeRange(e.date, landingTimeRange)
      );
      const totalErrors = matchedErrors.length;
      const revisedErrors = matchedErrors.filter(e => e.revised).length;

      return {
        category,
        topicGroups,
        topics: uniqueTopics,
        completedTopicsCount,
        masteredCount,
        workedCount,
        hardCount,
        postponedCount,
        notStartedCount,
        topicCompletionPercent,
        matchedResources,
        totalResourceUnits,
        completedResourceUnits,
        resourcePercent,
        matchedLogs,
        totalSolvedQuestions,
        totalCorrectQuestions,
        totalWrongQuestions,
        totalEmptyQuestions,
        questionAccuracy,
        matchedPlans,
        totalStudyMinutes,
        matchedBranchExams,
        branchExamCount,
        avgBranchNet,
        matchedGeneralMocks,
        generalExamCount,
        matchedVideos,
        totalVideos,
        watchedVideos,
        matchedErrors,
        totalErrors,
        revisedErrors,
        tytTopics,
        tytCompletedTopicsCount,
        tytCompletionPercent,
        aytTopics,
        aytCompletedTopicsCount,
        aytCompletionPercent,
        activeDaysCount,
      };
    });
  }, [state, topicStatuses, completedPastTopics, landingTimeRange]);

  // Filtered list for landing grid
  const filteredCategoryStats = useMemo(() => {
    return categoryStats.filter(cs => {
      const cat = cs.category;
      const matchesSearch = searchQuery === '' ||
        cat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cat.subtitle.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (selectedGroupFilter === 'ALANIM') {
        return cat.fields.includes(targetField);
      }
      if (selectedGroupFilter === 'ALL') return true;
      if (selectedGroupFilter === 'TYT') return cat.examType.includes('TYT');
      if (selectedGroupFilter === 'AYT') return cat.examType.includes('AYT');
      if (selectedGroupFilter === 'DİL') return cat.fields.includes('DİL') || cat.group === 'Genel';
      if (selectedGroupFilter === 'Sayısal' || selectedGroupFilter === 'SAY') return cat.fields.includes('SAY') || cat.group === 'Sayısal';
      if (selectedGroupFilter === 'Eşit Ağırlık' || selectedGroupFilter === 'EA') return cat.fields.includes('EA') || cat.group === 'Eşit Ağırlık';
      if (selectedGroupFilter === 'Sözel' || selectedGroupFilter === 'SÖZ') return cat.fields.includes('SÖZ') || cat.group === 'Sözel';
      return cat.group === selectedGroupFilter;
    });
  }, [categoryStats, searchQuery, selectedGroupFilter, targetField]);

  // Global curriculum stats
  const globalCurriculumStats = useMemo(() => {
    let totalTopics = 0;
    let totalCompleted = 0;
    let totalTytTopics = 0;
    let totalTytCompleted = 0;
    let totalAytTopics = 0;
    let totalAytCompleted = 0;

    filteredCategoryStats.forEach(cs => {
      totalTopics += cs.topics.length;
      totalCompleted += cs.completedTopicsCount;
      totalTytTopics += cs.tytTopics.length;
      totalTytCompleted += cs.tytCompletedTopicsCount;
      totalAytTopics += cs.aytTopics.length;
      totalAytCompleted += cs.aytCompletedTopicsCount;
    });

    const percent = totalTopics > 0 ? Math.round((totalCompleted / totalTopics) * 100) : 0;
    const tytPercent = totalTytTopics > 0 ? Math.round((totalTytCompleted / totalTytTopics) * 100) : 0;
    const aytPercent = totalAytTopics > 0 ? Math.round((totalAytCompleted / totalAytTopics) * 100) : 0;

    const totalQuestions = filteredCategoryStats.reduce((acc, cs) => acc + cs.totalSolvedQuestions, 0);
    const totalStudyMins = filteredCategoryStats.reduce((acc, cs) => acc + cs.totalStudyMinutes, 0);
    const totalResources = filteredCategoryStats.reduce((acc, cs) => acc + cs.matchedResources.length, 0);

    return {
      totalTopics, totalCompleted, percent,
      totalTytTopics, totalTytCompleted, tytPercent,
      totalAytTopics, totalAytCompleted, aytPercent,
      totalQuestions, totalStudyMins, totalResources
    };
  }, [filteredCategoryStats]);

  // Global active days count
  const globalActiveDaysCount = useMemo(() => {
    const globalDates = new Set<string>();
    (state.studyPlans || []).forEach(p => {
      if (p.date && isWithinTimeRange(p.date, landingTimeRange) && ((p.completedMinutes || 0) > 0 || p.status === 'completed')) {
        const dStr = p.date.trim().split(' ')[0];
        if (dStr) globalDates.add(dStr);
      }
    });
    (state.branchExams || []).forEach(b => {
      if (b.date && isWithinTimeRange(b.date, landingTimeRange)) {
        const dStr = b.date.trim().split(' ')[0];
        if (dStr) globalDates.add(dStr);
      }
    });
    (state.questionLogs || []).forEach(l => {
      if (l.date && isWithinTimeRange(l.date, landingTimeRange) && (l.solvedCount || 0) > 0) {
        const dStr = l.date.trim().split(' ')[0];
        if (dStr) globalDates.add(dStr);
      }
    });
    return Math.max(1, globalDates.size);
  }, [landingTimeRange, state.studyPlans, state.branchExams, state.questionLogs]);

  const dailyAvgMins = useMemo(() => {
    return Math.round(globalCurriculumStats.totalStudyMins / globalActiveDaysCount);
  }, [globalCurriculumStats.totalStudyMins, globalActiveDaysCount]);

  // Active raw category data (before exam scope filter)
  const activeRawCategoryData = useMemo(() => {
    if (!selectedSubjectId) return null;
    return categoryStats.find(cs => cs.category.id === selectedSubjectId) || null;
  }, [selectedSubjectId, categoryStats]);

  // Active detail data (with exam scope filter applied)
  const activeDetailData = useMemo(() => {
    if (!activeRawCategoryData) return null;

    if (detailExamFilter === 'TÜMÜ') {
      return activeRawCategoryData;
    }

    const { category, topicGroups } = activeRawCategoryData;

    const filteredTopicGroups = topicGroups.filter(g => {
      if (detailExamFilter === 'TYT') return isTYTKey(g.keyName);
      if (detailExamFilter === 'AYT') return isAYTKey(g.keyName);
      return true;
    });

    let allTopics: string[] = [];
    filteredTopicGroups.forEach(g => allTopics.push(...g.topics));
    const uniqueTopics = Array.from(new Set(allTopics));

    let completedTopicsCount = 0;
    let masteredCount = 0;
    let workedCount = 0;
    let hardCount = 0;
    let postponedCount = 0;
    let notStartedCount = 0;

    uniqueTopics.forEach(t => {
      const status = topicStatuses[t];
      const isPastCompleted = completedPastTopics.includes(t);

      if (status === 'Uzmanlaştım') {
        masteredCount++;
        completedTopicsCount++;
      } else if (status === 'Çalıştım' || isPastCompleted) {
        workedCount++;
        completedTopicsCount++;
      } else if (status === 'Zor Geldi') {
        hardCount++;
      } else if (status === 'Erteledim') {
        postponedCount++;
      } else {
        notStartedCount++;
      }
    });

    const topicCompletionPercent = uniqueTopics.length > 0
      ? Math.round((completedTopicsCount / uniqueTopics.length) * 100)
      : 0;

    const matchedResources = activeRawCategoryData.matchedResources.filter(r => matchesExamScope(r, detailExamFilter));
    const totalResourceUnits = matchedResources.reduce((acc, r) => acc + (r.totalUnits || 0), 0);
    const completedResourceUnits = matchedResources.reduce((acc, r) => acc + (r.completedUnits || 0), 0);
    const resourcePercent = totalResourceUnits > 0 ? Math.round((completedResourceUnits / totalResourceUnits) * 100) : 0;

    const matchedLogs = activeRawCategoryData.matchedLogs.filter(l => matchesExamScope(l, detailExamFilter));
    const totalSolvedQuestions = matchedLogs.reduce((acc, l) => acc + (l.solvedCount || 0), 0);
    const totalCorrectQuestions = matchedLogs.reduce((acc, l) => acc + (l.correctCount || 0), 0);
    const totalWrongQuestions = matchedLogs.reduce((acc, l) => acc + (l.wrongCount || 0), 0);
    const totalEmptyQuestions = matchedLogs.reduce((acc, l) => acc + (l.emptyCount || 0), 0);
    const questionAccuracy = (totalCorrectQuestions + totalWrongQuestions + totalEmptyQuestions) > 0
      ? Math.round((totalCorrectQuestions / (totalCorrectQuestions + totalWrongQuestions + totalEmptyQuestions)) * 100)
      : 0;

    const matchedPlans = [...activeRawCategoryData.matchedPlans]
      .filter(p => matchesExamScope(p, detailExamFilter))
      .sort((a, b) => {
        const timeA = a.date ? new Date(a.date).getTime() : 0;
        const timeB = b.date ? new Date(b.date).getTime() : 0;
        return timeB - timeA;
      });

    const matchedBranchExams = [...activeRawCategoryData.matchedBranchExams]
      .filter(b => matchesExamScope(b, detailExamFilter))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const branchExamCount = matchedBranchExams.length;
    const avgBranchNet = branchExamCount > 0
      ? (matchedBranchExams.reduce((acc, b) => acc + (b.net || 0), 0) / branchExamCount).toFixed(1)
      : '0.0';

    const matchedGeneralMocks = [...(activeRawCategoryData.matchedGeneralMocks || [])]
      .filter(g => {
        if (detailExamFilter === 'TYT') return Boolean(g.tyt && g.tyt.totalNet > 0);
        if (detailExamFilter === 'AYT') return Boolean(g.ayt && g.ayt.totalNet > 0);
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const generalExamCount = matchedGeneralMocks.length;

    const matchedVideos = activeRawCategoryData.matchedVideos.filter(v => matchesExamScope(v, detailExamFilter));
    const totalVideos = matchedVideos.length;
    const watchedVideos = matchedVideos.filter(v => v.isWatched).length;

    const totalStudyMinutes = computeStudyMinutes(matchedPlans, matchedBranchExams, matchedVideos);

    const matchedErrors = activeRawCategoryData.matchedErrors.filter(e => matchesExamScope(e, detailExamFilter));
    const totalErrors = matchedErrors.length;
    const revisedErrors = matchedErrors.filter(e => e.revised).length;

    return {
      category,
      topicGroups: filteredTopicGroups,
      topics: uniqueTopics,
      completedTopicsCount,
      masteredCount,
      workedCount,
      hardCount,
      postponedCount,
      notStartedCount,
      topicCompletionPercent,
      matchedResources,
      totalResourceUnits,
      completedResourceUnits,
      resourcePercent,
      matchedLogs,
      totalSolvedQuestions,
      totalCorrectQuestions,
      totalWrongQuestions,
      totalEmptyQuestions,
      questionAccuracy,
      matchedPlans,
      totalStudyMinutes,
      matchedBranchExams,
      branchExamCount,
      avgBranchNet,
      matchedGeneralMocks,
      generalExamCount,
      matchedVideos,
      totalVideos,
      watchedVideos,
      matchedErrors,
      totalErrors,
      revisedErrors,
      tytTopics: activeRawCategoryData.tytTopics,
      tytCompletedTopicsCount: activeRawCategoryData.tytCompletedTopicsCount,
      tytCompletionPercent: activeRawCategoryData.tytCompletionPercent,
      aytTopics: activeRawCategoryData.aytTopics,
      aytCompletedTopicsCount: activeRawCategoryData.aytCompletedTopicsCount,
      aytCompletionPercent: activeRawCategoryData.aytCompletionPercent,
      activeDaysCount: activeRawCategoryData.activeDaysCount,
    };
  }, [activeRawCategoryData, detailExamFilter, topicStatuses, completedPastTopics]);

  // Resource-based topic solved stats
  const resourceTopicStats = useMemo(() => {
    if (!activeDetailData) {
      return {
        solved3PlusCount: 0,
        solved2Count: 0,
        solved1Count: 0,
        solved0Count: 0,
        totalTopicsSolvedInResources: 0,
        resourceSolvedPercent: 0,
      };
    }

    const topics = activeDetailData.topics;
    const matchedResources = activeDetailData.matchedResources;

    let solved3PlusCount = 0;
    let solved2Count = 0;
    let solved1Count = 0;
    let solved0Count = 0;

    topics.forEach((tName: string) => {
      const resCount = matchedResources.filter((r: any) => (r.completedTopics || []).includes(tName)).length;
      if (resCount >= 3) solved3PlusCount++;
      else if (resCount === 2) solved2Count++;
      else if (resCount === 1) solved1Count++;
      else solved0Count++;
    });

    const totalTopicsSolvedInResources = solved1Count + solved2Count + solved3PlusCount;
    const resourceSolvedPercent = topics.length > 0
      ? Math.round((totalTopicsSolvedInResources / topics.length) * 100)
      : 0;

    return { solved3PlusCount, solved2Count, solved1Count, solved0Count, totalTopicsSolvedInResources, resourceSolvedPercent };
  }, [activeDetailData]);

  // Utility helpers
  const formatMinutes = (mins: number) => {
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    if (hours === 0) return `${remainingMins} dk`;
    if (remainingMins === 0) return `${hours} sa`;
    return `${hours} sa ${remainingMins} dk`;
  };

  const getStatusBadge = (topicName: string) => {
    const status = topicStatuses[topicName];
    const isPastCompleted = completedPastTopics.includes(topicName);

    if (status === 'Uzmanlaştım') return { label: 'Uzmanlaştım', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' };
    if (status === 'Çalıştım' || isPastCompleted) return { label: 'Çalıştım', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' };
    if (status === 'Zor Geldi') return { label: 'Zor Geldi', color: 'bg-rose-500/20 text-rose-300 border-rose-500/30' };
    if (status === 'Erteledim') return { label: 'Erteledim', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
    return { label: 'Çalışmadım', color: 'bg-slate-800 text-slate-400 border-slate-700' };
  };

  const toggleSection = (keyName: string) => {
    setExpandedSections(prev => ({ ...prev, [keyName]: !prev[keyName] }));
  };

  return (
    <div className="space-y-6 pb-12" id="subject-progress-view-root">

      {activeDetailData ? (
        /* SECTION 1: DETAILED SUMMARY VIEW FOR SELECTED SUBJECT */
        <div className="space-y-6 animate-in fade-in duration-300">
          <SubjectDetailHeader
            activeDetailData={activeDetailData}
            activeRawCategoryData={activeRawCategoryData}
            setSelectedSubjectId={setSelectedSubjectId}
            detailExamFilter={detailExamFilter}
            setDetailExamFilter={setDetailExamFilter}
            detailSubTab={detailSubTab}
            setDetailSubTab={setDetailSubTab}
            formatMinutes={formatMinutes}
          />

          {/* TAB 0: OVERVIEW */}
          {detailSubTab === 'overview' && (
            <SubjectDetailOverviewTab
              activeDetailData={activeDetailData}
              setDetailSubTab={setDetailSubTab}
              formatMinutes={formatMinutes}
            />
          )}

          {/* TAB 1: TOPICS */}
          {detailSubTab === 'topics' && (
            <SubjectTopicsTab
              activeDetailData={activeDetailData}
              detailExamFilter={detailExamFilter}
              topicStatuses={topicStatuses}
              completedPastTopics={completedPastTopics}
              topicSearchQuery={topicSearchQuery}
              setTopicSearchQuery={setTopicSearchQuery}
              topicStatusFilter={topicStatusFilter}
              setTopicStatusFilter={setTopicStatusFilter}
              topicPage={topicPage}
              setTopicPage={setTopicPage}
              expandedSections={expandedSections}
              toggleSection={toggleSection}
              curriculumViewMode={curriculumViewMode}
              setCurriculumViewMode={setCurriculumViewMode}
              resourceTopicStats={resourceTopicStats}
              getStatusBadge={getStatusBadge}
              onNavigateTab={onNavigateTab}
              onUpdateTopicStatus={onUpdateTopicStatus}
            />
          )}

          {/* TAB 2: RESOURCES */}
          {detailSubTab === 'resources' && (
            <SubjectResourcesTab
              activeDetailData={activeDetailData}
              resourcePage={resourcePage}
              setResourcePage={setResourcePage}
              onNavigateTab={onNavigateTab}
            />
          )}

          {/* TAB 3: QUESTIONS */}
          {detailSubTab === 'questions' && (
            <SubjectQuestionsTab
              activeDetailData={activeDetailData}
              questionPage={questionPage}
              setQuestionPage={setQuestionPage}
              onNavigateTab={onNavigateTab}
            />
          )}

          {/* TAB 4: STUDY */}
          {detailSubTab === 'study' && (
            <SubjectStudyTab
              activeDetailData={activeDetailData}
              studyPage={studyPage}
              setStudyPage={setStudyPage}
              formatMinutes={formatMinutes}
              onNavigateTab={onNavigateTab}
            />
          )}

          {/* TAB 5: MOCKS */}
          {detailSubTab === 'mocks' && (
            <SubjectMocksTab
              activeDetailData={activeDetailData}
              mockTypeTab={mockTypeTab}
              setMockTypeTab={setMockTypeTab}
              mockPage={mockPage}
              setMockPage={setMockPage}
              generalMockPage={generalMockPage}
              setGeneralMockPage={setGeneralMockPage}
              expandedMockIds={expandedMockIds}
              setExpandedMockIds={setExpandedMockIds}
              onNavigateTab={onNavigateTab}
            />
          )}

          {/* TAB 6: YOUTUBE & ERRORS */}
          {(detailSubTab === 'youtube' || detailSubTab === 'errors') && (
            <SubjectVideoErrorsTab
              activeDetailData={activeDetailData}
              videoPage={videoPage}
              setVideoPage={setVideoPage}
              errorPage={errorPage}
              setErrorPage={setErrorPage}
              setPreviewImageUrl={setPreviewImageUrl}
              onNavigateTab={onNavigateTab}
            />
          )}
        </div>
      ) : (
        /* SECTION 2: MAIN GRID VIEW FOR ALL SUBJECTS */
        <SubjectLandingGrid
          globalCurriculumStats={globalCurriculumStats}
          landingTimeRange={landingTimeRange}
          setLandingTimeRange={setLandingTimeRange}
          dailyAvgMins={dailyAvgMins}
          selectedGroupFilter={selectedGroupFilter}
          setSelectedGroupFilter={setSelectedGroupFilter}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          targetField={targetField}
          getFieldTitle={getFieldTitle}
          filteredCategoryStats={filteredCategoryStats}
          setSelectedSubjectId={setSelectedSubjectId}
          setDetailSubTab={setDetailSubTab}
          formatMinutes={formatMinutes}
        />
      )}

      {/* IMAGE LIGHTBOX MODAL */}
      {previewImageUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setPreviewImageUrl(null)}
        >
          <div
            className="relative max-w-4xl w-full bg-slate-950 border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewImageUrl(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 rounded-full border border-slate-700 transition-colors cursor-pointer"
              title="Kapat"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-purple-400" />
              Soru Görseli Detayı
            </h3>

            <div className="w-full flex justify-center overflow-auto max-h-[80vh] rounded-2xl bg-slate-900/60 p-2 border border-slate-850">
              <img
                src={previewImageUrl}
                alt="Soru Görseli"
                className="max-h-[75vh] w-auto object-contain rounded-xl border border-slate-800 shadow-xl"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubjectProgressView;
