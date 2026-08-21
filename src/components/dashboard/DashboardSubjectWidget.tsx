import React from 'react';
import { 
  Calculator, Atom, FlaskConical, Dna, Compass, Scroll, Globe, Lightbulb, 
  Languages, BookMarked, BookOpen, StickyNote, ArrowUpRight, Activity, 
  GraduationCap, Video, Timer 
} from 'lucide-react';
import { YKSDataState } from '../../types';
import { PAST_EXAM_QUESTIONS_DATA } from '../../data/pastQuestionsData';

interface DashboardSubjectWidgetProps {
  state: YKSDataState;
  onNavigateTab: (tab: any) => void;
  onOpenNotesModal: (subjectName: string) => void;
  config?: { subject?: string };
}

export const renderSubjectProgressWidget = (
  state: YKSDataState,
  onNavigateTab: (tab: any) => void,
  onOpenNotesModal: (subjectName: string) => void,
  config?: { subject?: string }
) => {
  const selectedSubj = config?.subject || 'TYT Matematik';
  const { questionLogs = [], resources = [] } = state;

  const getSubjectTheme = (subj: string) => {
    const normalized = subj.toLowerCase();
    if (normalized.includes('matematik') || normalized.includes('mat')) {
      return {
        icon: Calculator,
        textClass: 'text-cyan-400',
        hoverTextClass: 'hover:text-cyan-300',
        borderClass: 'border-cyan-500/30 hover:border-cyan-400/50 hover:shadow-cyan-500/5',
        bgClass: 'bg-cyan-500/10 border-cyan-500/20',
        titleColor: 'text-cyan-300',
        badgeBg: 'bg-cyan-500/20 border-cyan-500/30 text-cyan-300',
        barColor: 'bg-cyan-400'
      };
    }
    if (normalized.includes('fizik') || normalized.includes('fiz')) {
      return {
        icon: Atom,
        textClass: 'text-indigo-400',
        hoverTextClass: 'hover:text-indigo-300',
        borderClass: 'border-indigo-500/30 hover:border-indigo-400/50 hover:shadow-indigo-500/5',
        bgClass: 'bg-indigo-500/10 border-indigo-500/20',
        titleColor: 'text-indigo-300',
        badgeBg: 'bg-indigo-500/20 border-indigo-500/30 text-indigo-300',
        barColor: 'bg-indigo-400'
      };
    }
    if (normalized.includes('kimya') || normalized.includes('kim')) {
      return {
        icon: FlaskConical,
        textClass: 'text-emerald-400',
        hoverTextClass: 'hover:text-emerald-300',
        borderClass: 'border-emerald-500/30 hover:border-emerald-400/50 hover:shadow-emerald-500/5',
        bgClass: 'bg-emerald-500/10 border-emerald-500/20',
        titleColor: 'text-emerald-300',
        badgeBg: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300',
        barColor: 'bg-emerald-400'
      };
    }
    if (normalized.includes('biyoloji') || normalized.includes('biyo')) {
      return {
        icon: Dna,
        textClass: 'text-rose-400',
        hoverTextClass: 'hover:text-rose-300',
        borderClass: 'border-rose-500/30 hover:border-rose-400/50 hover:shadow-rose-500/5',
        bgClass: 'bg-rose-500/10 border-rose-500/20',
        titleColor: 'text-rose-300',
        badgeBg: 'bg-rose-500/20 border-rose-500/30 text-rose-300',
        barColor: 'bg-rose-400'
      };
    }
    if (normalized.includes('geometri') || normalized.includes('geo')) {
      return {
        icon: Compass,
        textClass: 'text-amber-400',
        hoverTextClass: 'hover:text-amber-300',
        borderClass: 'border-amber-500/30 hover:border-amber-400/50 hover:shadow-amber-500/5',
        bgClass: 'bg-amber-500/10 border-amber-500/20',
        titleColor: 'text-amber-300',
        badgeBg: 'bg-amber-500/20 border-amber-500/30 text-amber-300',
        barColor: 'bg-amber-400'
      };
    }
    if (normalized.includes('tarih') || normalized.includes('tar')) {
      return {
        icon: Scroll,
        textClass: 'text-orange-400',
        hoverTextClass: 'hover:text-orange-300',
        borderClass: 'border-orange-500/30 hover:border-orange-400/50 hover:shadow-orange-500/5',
        bgClass: 'bg-orange-500/10 border-orange-500/20',
        titleColor: 'text-orange-300',
        badgeBg: 'bg-orange-500/20 border-orange-500/30 text-orange-300',
        barColor: 'bg-orange-400'
      };
    }
    if (normalized.includes('coğrafya') || normalized.includes('coğ')) {
      return {
        icon: Globe,
        textClass: 'text-blue-400',
        hoverTextClass: 'hover:text-blue-300',
        borderClass: 'border-blue-500/30 hover:border-blue-400/50 hover:shadow-blue-500/5',
        bgClass: 'bg-blue-500/10 border-blue-500/20',
        titleColor: 'text-blue-300',
        badgeBg: 'bg-blue-500/20 border-blue-500/30 text-blue-300',
        barColor: 'bg-blue-400'
      };
    }
    if (normalized.includes('felsefe') || normalized.includes('fel')) {
      return {
        icon: Lightbulb,
        textClass: 'text-violet-400',
        hoverTextClass: 'hover:text-violet-300',
        borderClass: 'border-violet-500/30 hover:border-violet-400/50 hover:shadow-violet-500/5',
        bgClass: 'bg-violet-500/10 border-violet-500/20',
        titleColor: 'text-violet-300',
        badgeBg: 'bg-violet-500/20 border-violet-500/30 text-violet-300',
        barColor: 'bg-violet-400'
      };
    }
    if (normalized.includes('türkçe') || normalized.includes('tür') || normalized.includes('edebiyat') || normalized.includes('edeb')) {
      return {
        icon: Languages,
        textClass: 'text-pink-400',
        hoverTextClass: 'hover:text-pink-300',
        borderClass: 'border-pink-500/30 hover:border-pink-400/50 hover:shadow-pink-500/5',
        bgClass: 'bg-pink-500/10 border-pink-500/20',
        titleColor: 'text-pink-300',
        badgeBg: 'bg-pink-500/20 border-pink-500/30 text-pink-300',
        barColor: 'bg-pink-400'
      };
    }
    if (normalized.includes('din') || normalized.includes('ahlak')) {
      return {
        icon: BookMarked,
        textClass: 'text-teal-400',
        hoverTextClass: 'hover:text-teal-300',
        borderClass: 'border-teal-500/30 hover:border-teal-400/50 hover:shadow-teal-500/5',
        bgClass: 'bg-teal-500/10 border-teal-500/20',
        titleColor: 'text-teal-300',
        badgeBg: 'bg-teal-500/20 border-teal-500/30 text-teal-300',
        barColor: 'bg-teal-400'
      };
    }
    return {
      icon: BookOpen,
      textClass: 'text-sky-400',
      hoverTextClass: 'hover:text-sky-300',
      borderClass: 'border-sky-500/30 hover:border-sky-400/50 hover:shadow-sky-500/5',
      bgClass: 'bg-sky-500/10 border-sky-500/20',
      titleColor: 'text-sky-300',
      badgeBg: 'bg-sky-500/20 border-sky-500/30 text-sky-300',
      barColor: 'bg-sky-400'
    };
  };

  const theme = getSubjectTheme(selectedSubj);
  const SubjectIcon = theme.icon;

  const subjLogs = questionLogs.filter(q => q.subject.toLowerCase() === selectedSubj.toLowerCase());
  const subjSolved = subjLogs.reduce((acc, q) => acc + q.solvedCount, 0);
  const subjCorrect = subjLogs.reduce((acc, q) => acc + q.correctCount, 0);
  const accuracy = subjSolved > 0 ? Math.round((subjCorrect / subjSolved) * 100) : 0;

  const subjResources = resources.filter(r => r.subject.toLowerCase() === selectedSubj.toLowerCase());
  const totalSubjUnits = subjResources.reduce((acc, r) => acc + (r.totalUnits || 1), 0);
  const completedSubjUnits = subjResources.reduce((acc, r) => acc + (r.completedTopics ? r.completedTopics.length : (r.completedUnits || 0)), 0);
  const subjResourcePercent = totalSubjUnits > 0 ? Math.min(100, Math.round((completedSubjUnits / totalSubjUnits) * 100)) : 0;

  const subjNotes = state.subjectNotes?.[selectedSubj] || { studentNote: '', teacherNote: '' };
  const hasNote = !!(subjNotes.studentNote || subjNotes.teacherNote);

  return (
    <div className={`bg-white/5 backdrop-blur-md border ${theme.borderClass} rounded-2xl p-5 shadow-xl transition-all duration-300 hover:scale-[1.015] hover:shadow-2xl flex flex-col justify-between`}>
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2.5 min-w-0 flex-1">
            <div className={`w-8 h-8 rounded-xl ${theme.bgClass} ${theme.textClass} flex items-center justify-center shrink-0`}>
              <SubjectIcon className="w-4.5 h-4.5" />
            </div>
            <span className={`text-xs font-bold ${theme.titleColor} truncate`} title={`${selectedSubj} İlerlemesi`}>
              {selectedSubj}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenNotesModal(selectedSubj);
              }}
              title="Ders Notları ve Koç Notu"
              className={`relative p-1 rounded-lg bg-white/5 hover:bg-white/10 ${theme.textClass} ${theme.hoverTextClass} transition-all shrink-0 cursor-pointer`}
            >
              <StickyNote className="w-3.5 h-3.5" />
              {hasNote && (
                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-pink-500 rounded-full animate-pulse" />
              )}
            </button>
          </div>
        </div>

        <div className="text-2xl font-bold text-white font-mono">
          %{subjResourcePercent} <span className="text-xs font-normal text-slate-400">Konu Bitti</span>
        </div>

        <div className="w-full bg-white/10 h-2 rounded-full mt-2.5 overflow-hidden">
          <div 
            className={`${theme.barColor} h-full rounded-full transition-all duration-500 shadow-sm`} 
            style={{ width: `${subjResourcePercent}%` }}
          />
        </div>

        <div className="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-slate-800 text-[11px]">
          <div>
            <span className="text-slate-400 block">Çözülen Soru:</span>
            <strong className="text-white font-mono">{subjSolved} Soru</strong>
          </div>
          <div>
            <span className="text-slate-400 block">Doğru Oranı:</span>
            <strong className="text-emerald-400 font-mono">%{accuracy}</strong>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onNavigateTab('subject_progress')}
        className={`text-[11px] ${theme.textClass} ${theme.hoverTextClass} font-medium flex items-center mt-3 transition-colors cursor-pointer`}
      >
        <span>Tüm Müfredatı Detaylı İncele</span>
        <ArrowUpRight className="w-3 h-3 ml-0.5" />
      </button>
    </div>
  );
};

export const renderBranchExamsWidget = (
  branchExams: any[],
  onNavigateTab: (tab: any) => void
) => {
  const totalBranchCount = branchExams.length;
  const avgNet = totalBranchCount > 0 
    ? (branchExams.reduce((acc, b) => acc + b.net, 0) / totalBranchCount).toFixed(1)
    : '0';

  return (
    <div className="bg-white/5 backdrop-blur-md border border-emerald-500/30 rounded-2xl p-5 shadow-xl hover:border-emerald-400/50 transition-all flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-400">Branş Denemeleri</span>
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 flex items-center justify-center">
            <Activity className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-white font-mono">
          {totalBranchCount} <span className="text-xs font-normal text-slate-400">Deneme Çözüldü</span>
        </div>
        <div className="flex items-center justify-between text-xs text-slate-300 mt-2">
          <span>Ortalama Net:</span>
          <span className="font-bold text-emerald-400 font-mono">{avgNet} Net</span>
        </div>
        <p className="text-[11px] text-slate-400 mt-1 truncate">
          {totalBranchCount > 0 ? `Son: ${branchExams[branchExams.length - 1].subject} (${branchExams[branchExams.length - 1].net} Net)` : 'Henüz branş denemesi eklenmedi'}
        </p>
      </div>
      <button
        type="button"
        onClick={() => onNavigateTab('branches')}
        className="text-[11px] text-emerald-300 hover:text-emerald-200 font-medium flex items-center mt-3 transition-colors cursor-pointer"
      >
        <span>Branş Denemelerine Git</span>
        <ArrowUpRight className="w-3 h-3 ml-0.5" />
      </button>
    </div>
  );
};

export const renderPastExamsWidget = (
  completedPastTopics: string[] = [],
  onNavigateTab: (tab: any) => void
) => {
  const isTopicDone = (subject: string, topic: string) => {
    return (
      completedPastTopics.includes(`${subject}:${topic}`) ||
      completedPastTopics.includes(`${subject}::${topic}`) ||
      completedPastTopics.includes(topic)
    );
  };

  const totalTopics = PAST_EXAM_QUESTIONS_DATA.length;
  const solvedPastTopics = PAST_EXAM_QUESTIONS_DATA.filter((p) => isTopicDone(p.subject, p.topic));
  const solvedCount = solvedPastTopics.length;
  const pastPercent = totalTopics > 0 ? Math.round((solvedCount / totalTopics) * 100) : 0;

  return (
    <div className="bg-white/5 backdrop-blur-md border border-amber-500/30 rounded-2xl p-5 shadow-xl hover:border-amber-400/50 transition-all flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-400">ÖSYM Çıkmış Sorular</span>
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 flex items-center justify-center">
            <GraduationCap className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-white font-mono">
          {solvedCount} <span className="text-xs font-normal text-slate-400">/ {totalTopics} Konu</span>
        </div>
        <div className="w-full bg-white/10 h-2 rounded-full mt-2.5 overflow-hidden">
          <div 
            className="bg-amber-400 h-full rounded-full transition-all duration-500 shadow-sm" 
            style={{ width: `${Math.min(pastPercent, 100)}%` }}
          />
        </div>
        <div className="flex justify-between items-center text-[11px] text-slate-400 mt-1.5">
          <span>Çözülme Oranı</span>
          <span className="font-semibold text-amber-300">%{pastPercent}</span>
        </div>
      </div>
      <button
        type="button"
        onClick={() => onNavigateTab('past_questions')}
        className="text-[11px] text-amber-300 hover:text-amber-200 font-medium flex items-center mt-3 transition-colors cursor-pointer"
      >
        <span>Çıkmış Sorulara Git</span>
        <ArrowUpRight className="w-3 h-3 ml-0.5" />
      </button>
    </div>
  );
};

export const renderVideoLessonsWidget = (
  youtubeVideos: any[],
  onNavigateTab: (tab: any) => void
) => {
  const totalVideos = youtubeVideos.length;
  const watchedVideos = youtubeVideos.filter(v => v.isWatched).length;
  const videoPercent = totalVideos > 0 ? Math.round((watchedVideos / totalVideos) * 100) : 0;

  return (
    <div className="bg-white/5 backdrop-blur-md border border-purple-500/30 rounded-2xl p-5 shadow-xl hover:border-purple-400/50 transition-all flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-400">Video Ders & Oynatma Listesi</span>
          <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-300 flex items-center justify-center">
            <Video className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-white font-mono">
          {watchedVideos} <span className="text-xs font-normal text-slate-400">/ {totalVideos} İzlenen Ders</span>
        </div>
        <div className="w-full bg-white/10 h-2 rounded-full mt-2.5 overflow-hidden">
          <div 
            className="bg-purple-400 h-full rounded-full transition-all duration-500 shadow-sm" 
            style={{ width: `${Math.min(videoPercent, 100)}%` }}
          />
        </div>
        <div className="flex justify-between items-center text-[11px] text-slate-400 mt-1.5">
          <span>İzleme Tamamlama</span>
          <span className="font-semibold text-purple-300">%{videoPercent}</span>
        </div>
      </div>
      <button
        type="button"
        onClick={() => onNavigateTab('youtube')}
        className="text-[11px] text-purple-300 hover:text-purple-200 font-medium flex items-center mt-3 transition-colors cursor-pointer"
      >
        <span>Ders Videolarına Git</span>
        <ArrowUpRight className="w-3 h-3 ml-0.5" />
      </button>
    </div>
  );
};

export const renderPomodoroStatsWidget = (
  studyPlans: any[],
  onNavigateTab: (tab: any) => void
) => {
  const completedMinutes = studyPlans
    .filter(p => p.status === 'completed')
    .reduce((acc, p) => acc + (p.completedMinutes || p.plannedMinutes || 0), 0);
  
  const focusHours = (completedMinutes / 60).toFixed(1);

  return (
    <div className="bg-white/5 backdrop-blur-md border border-indigo-500/30 rounded-2xl p-5 shadow-xl hover:border-indigo-400/50 transition-all flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-400">Pomodoro Odaklanma Saati</span>
          <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 flex items-center justify-center">
            <Timer className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-white font-mono">
          {focusHours} <span className="text-xs font-normal text-slate-400">Saat Odaklanıldı</span>
        </div>
        <p className="text-xs text-slate-400 mt-2">
          Kronometre ile kaydedilen ve tamamlanan çalışma süreleri toplamı
        </p>
      </div>
      <button
        type="button"
        onClick={() => onNavigateTab('pomodoro')}
        className="text-[11px] text-indigo-300 hover:text-indigo-200 font-medium flex items-center mt-3 transition-colors cursor-pointer"
      >
        <span>Pomodoro Odasına Git</span>
        <ArrowUpRight className="w-3 h-3 ml-0.5" />
      </button>
    </div>
  );
};
