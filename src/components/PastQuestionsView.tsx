import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Search, 
  Filter, 
  CheckCircle2, 
  Circle, 
  Flame, 
  TrendingUp, 
  BookOpen, 
  Sparkles, 
  Layers, 
  HelpCircle, 
  CheckCheck, 
  RotateCcw, 
  Target, 
  X,
  Zap,
  GraduationCap
} from 'lucide-react';
import { PAST_EXAM_QUESTIONS_DATA, PastTopicData } from '../data/pastQuestionsData';
import { YKS_SUBJECTS } from '../data/initialData';

interface PastQuestionsViewProps {
  completedPastTopics?: string[];
  onTogglePastTopic: (topicKey: string) => void;
}

export const PastQuestionsView: React.FC<PastQuestionsViewProps> = ({
  completedPastTopics = [],
  onTogglePastTopic
}) => {
  const [selectedSubject, setSelectedSubject] = useState<string>('TYT Türkçe');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [completionFilter, setCompletionFilter] = useState<'ALL' | 'completed' | 'pending'>('ALL');
  const [sortBy, setSortBy] = useState<'total_desc' | 'default' | 'latest_2025'>('default');

  // Topics for selected subject (when not searching globally)
  const currentSubjectTopics = useMemo(() => {
    return PAST_EXAM_QUESTIONS_DATA.filter((item) => item.subject === selectedSubject);
  }, [selectedSubject]);

  // Max questions in single topic for sparkline scale
  const maxTopicQuestions = useMemo(() => {
    if (currentSubjectTopics.length === 0) return 1;
    return Math.max(...currentSubjectTopics.map(t => t.totalQuestions));
  }, [currentSubjectTopics]);

  // Total questions in 8-year archive for selected subject
  const totalQuestionsInSubject = useMemo(() => {
    return currentSubjectTopics.reduce((acc, t) => acc + t.totalQuestions, 0);
  }, [currentSubjectTopics]);

  // Total average questions per YKS exam for selected subject (e.g. 40 in TYT Türkçe, 14 in AYT Fizik)
  const totalSubjectExamQuestions = useMemo(() => {
    return currentSubjectTopics.reduce((acc, t) => acc + (t.totalQuestions / 8), 0);
  }, [currentSubjectTopics]);

  // Helper to check topic completed status across : and :: formats
  const isTopicCompleted = (subject: string, topicName: string) => {
    return (
      completedPastTopics.includes(`${subject}:${topicName}`) ||
      completedPastTopics.includes(`${subject}::${topicName}`) ||
      completedPastTopics.includes(topicName)
    );
  };

  // Average questions solved/completed based on student's checked topics for selected subject
  const completedQuestionsAvg = useMemo(() => {
    return currentSubjectTopics
      .filter((t) => isTopicCompleted(t.subject, t.topic))
      .reduce((acc, t) => acc + (t.totalQuestions / 8), 0);
  }, [currentSubjectTopics, completedPastTopics]);

  // Percentage of question coverage for the exam
  const questionCoveragePercentage = useMemo(() => {
    if (totalSubjectExamQuestions <= 0) return 0;
    return Math.min(100, Math.max(0, (completedQuestionsAvg / totalSubjectExamQuestions) * 100));
  }, [completedQuestionsAvg, totalSubjectExamQuestions]);

  const remainingQuestionsAvg = useMemo(() => {
    return Math.max(0, totalSubjectExamQuestions - completedQuestionsAvg);
  }, [totalSubjectExamQuestions, completedQuestionsAvg]);

  // Count of completed topics in selected subject
  const completedTopicsCount = useMemo(() => {
    return currentSubjectTopics.filter((t) => isTopicCompleted(t.subject, t.topic)).length;
  }, [currentSubjectTopics, completedPastTopics]);

  const topicCountPercentage = currentSubjectTopics.length > 0
    ? Math.round((completedTopicsCount / currentSubjectTopics.length) * 100)
    : 0;

  const topTopicInSubject = useMemo(() => {
    if (currentSubjectTopics.length === 0) return null;
    return [...currentSubjectTopics].sort((a, b) => b.totalQuestions - a.totalQuestions)[0];
  }, [currentSubjectTopics]);

  // Global Search or Subject Topics List
  const isGlobalSearchActive = searchTerm.trim().length > 0;

  const displayedTopics = useMemo(() => {
    let list: PastTopicData[];

    if (isGlobalSearchActive) {
      // Search across ALL subjects in the curriculum
      const q = searchTerm.toLowerCase().trim();
      list = PAST_EXAM_QUESTIONS_DATA.filter(
        (t) =>
          t.topic.toLowerCase().includes(q) ||
          (t.description && t.description.toLowerCase().includes(q)) ||
          t.subject.toLowerCase().includes(q)
      );
    } else {
      list = [...currentSubjectTopics];
    }

    if (completionFilter !== 'ALL') {
      list = list.filter((t) => {
        const isCompleted = isTopicCompleted(t.subject, t.topic);
        return completionFilter === 'completed' ? isCompleted : !isCompleted;
      });
    }

    if (sortBy === 'total_desc') {
      list.sort((a, b) => b.totalQuestions - a.totalQuestions);
    } else if (sortBy === 'latest_2025') {
      list.sort((a, b) => (b.yearCounts[2025] || 0) - (a.yearCounts[2025] || 0));
    }

    return list;
  }, [isGlobalSearchActive, searchTerm, currentSubjectTopics, completionFilter, sortBy, completedPastTopics]);

  // Bulk actions for current subject
  const handleMarkAllCompleted = () => {
    currentSubjectTopics.forEach(t => {
      const topicKey = `${t.subject}:${t.topic}`;
      if (!isTopicCompleted(t.subject, t.topic)) {
        onTogglePastTopic(topicKey);
      }
    });
  };

  const handleResetAllCompleted = () => {
    currentSubjectTopics.forEach(t => {
      const topicKey = `${t.subject}:${t.topic}`;
      if (isTopicCompleted(t.subject, t.topic)) {
        onTogglePastTopic(topicKey);
      }
    });
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      
      {/* ── 1. HERO BANNER & QUESTION COVERAGE POWER ── */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-7 border border-indigo-500/25 shadow-2xl backdrop-blur-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>ÖSYM YKS 2018 - 2025 Analiz Arşivi</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <FileText className="w-8 h-8 text-indigo-400 shrink-0" />
              <span>Çıkmış Sorular</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              ÖSYM'nin son 8 yılda sorduğu tüm soruların konu ağırlıklarını inceleyin. Çözdüğünüz konuları işaretledikçe, 
              sınavdaki soru potansiyelinizin yüzde kaçını kapsadığınızı anlık takip edin.
            </p>
          </div>

          {/* 🎯 Sınav Soru Kapsama Gücü Kartı */}
          <div className="bg-slate-950/80 backdrop-blur-md p-5 rounded-2xl border border-indigo-500/30 shadow-xl flex flex-col justify-between w-full lg:w-80 shrink-0 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-indigo-300 uppercase tracking-wider flex items-center space-x-1.5">
                <Target className="w-4 h-4 text-emerald-400" />
                <span>Sınav Soru Kapsaması</span>
              </span>
              <span className="text-xs font-mono font-bold text-indigo-300 bg-indigo-950/60 px-2.5 py-0.5 rounded-lg border border-indigo-500/30">
                {selectedSubject}
              </span>
            </div>

            <div className="flex items-baseline justify-between">
              <div className="flex items-baseline space-x-1.5">
                <span className="text-3xl font-black text-white font-mono tracking-tight">
                  %{questionCoveragePercentage.toFixed(1)}
                </span>
                <span className="text-xs font-bold text-slate-400">Kapsandı</span>
              </div>

              <div className="text-right">
                <span className="text-xs font-extrabold text-emerald-400 font-mono block">
                  {completedQuestionsAvg.toFixed(1)} / {totalSubjectExamQuestions.toFixed(1)} Soru
                </span>
                <span className="text-[10px] text-slate-400">
                  (Kalan: {remainingQuestionsAvg.toFixed(1)} soru)
                </span>
              </div>
            </div>

            {/* Glowing Dual Progress Bar */}
            <div className="space-y-1">
              <div className="w-full bg-slate-900 h-3 rounded-full overflow-hidden border border-slate-800 p-0.5">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    questionCoveragePercentage >= 80 
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-md shadow-emerald-500/30' 
                      : questionCoveragePercentage >= 40 
                      ? 'bg-gradient-to-r from-indigo-500 via-amber-500 to-emerald-400' 
                      : 'bg-gradient-to-r from-indigo-600 to-indigo-400'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(0, questionCoveragePercentage))}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                <span>{completedTopicsCount} / {currentSubjectTopics.length} Konu Bitti</span>
                <span>%{topicCountPercentage} Konu Oranı</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. GLOBAL SEARCH & GROUPED SUBJECT SELECTOR ── */}
      <div className="bg-slate-900/90 rounded-3xl p-5 sm:p-6 border border-slate-800 shadow-xl space-y-5 backdrop-blur-md">
        
        {/* Global Search Bar Across All Subjects */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-400 pointer-events-none" />
          <input
            id="past-questions-global-search-input"
            type="text"
            placeholder="Tüm dersler içinde konu ara (Örn: Türev, Paragraf, Elektrik, Hücre Bölünmeleri)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border-2 border-indigo-500/30 focus:border-indigo-500 text-white text-sm font-semibold rounded-2xl pl-12 pr-12 py-3.5 outline-none shadow-inner transition-all placeholder:text-slate-500"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
              title="Aramayı Temizle"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Global Search Active Banner */}
        {isGlobalSearchActive && (
          <div className="p-3 bg-indigo-950/60 border border-indigo-500/40 rounded-2xl flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2 text-indigo-200 font-bold">
              <Search className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>
                Tüm YKS müfredatında <strong className="text-white font-extrabold">"{searchTerm}"</strong> araması: 
                <span className="text-amber-300 font-mono ml-1 font-black">{displayedTopics.length}</span> konu bulundu
              </span>
            </div>
            <button
              type="button"
              onClick={clearSearch}
              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-all cursor-pointer flex items-center space-x-1 shrink-0"
            >
              <span>Ders Görünümüne Dön</span>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* GROUPED SUBJECT BUTTONS: TYT & AYT Distinct Rows */}
        <div className="space-y-3.5 pt-1">
          
          {/* Row 1: TYT Dersleri */}
          <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-850 space-y-2">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-lg bg-sky-500/15 border border-sky-500/30 text-sky-400 text-[11px] font-black uppercase tracking-wider flex items-center space-x-1">
                <GraduationCap className="w-3 h-3" />
                <span>TYT Dersleri</span>
              </span>
              <span className="text-[11px] text-slate-500">Temel Yeterlilik Testi</span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {YKS_SUBJECTS.TYT.map((sub) => {
                const isSelected = selectedSubject === sub && !isGlobalSearchActive;
                const displayName = sub.replace(/^TYT\s+/, '');

                return (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => {
                      setSelectedSubject(sub);
                      if (isGlobalSearchActive) setSearchTerm('');
                    }}
                    className={`text-xs px-3 py-1.5 rounded-xl border font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-sky-600 border-sky-400 text-white shadow-md shadow-sky-600/30 ring-2 ring-sky-400/40 scale-105'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 hover:bg-slate-850'
                    }`}
                  >
                    {displayName}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Row 2: AYT Dersleri */}
          <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-850 space-y-2">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[11px] font-black uppercase tracking-wider flex items-center space-x-1">
                <GraduationCap className="w-3 h-3" />
                <span>AYT Dersleri</span>
              </span>
              <span className="text-[11px] text-slate-500">Alan Yeterlilik Testleri</span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {YKS_SUBJECTS.AYT.map((sub) => {
                const isSelected = selectedSubject === sub && !isGlobalSearchActive;
                const displayName = sub.replace(/^AYT\s+/, '');

                return (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => {
                      setSelectedSubject(sub);
                      if (isGlobalSearchActive) setSearchTerm('');
                    }}
                    className={`text-xs px-3 py-1.5 rounded-xl border font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-600 border-amber-400 text-white shadow-md shadow-amber-600/30 ring-2 ring-amber-400/40 scale-105'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 hover:bg-slate-850'
                    }`}
                  >
                    {displayName}
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* Row 3: Status Filters, Sort, and Bulk Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-850 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-400 font-bold flex items-center gap-1 mr-1">
              <Filter className="w-3.5 h-3.5 text-indigo-400" />
              <span>Görünüm:</span>
            </span>

            {/* Completion Filter Pills */}
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setCompletionFilter('ALL')}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  completionFilter === 'ALL'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Tümü ({isGlobalSearchActive ? displayedTopics.length : currentSubjectTopics.length})
              </button>
              <button
                type="button"
                onClick={() => setCompletionFilter('completed')}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                  completionFilter === 'completed'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <CheckCircle2 className="w-3 h-3 text-emerald-300" />
                <span>Çözülenler</span>
              </button>
              <button
                type="button"
                onClick={() => setCompletionFilter('pending')}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  completionFilter === 'pending'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                ⏳ Çözülecekler
              </button>
            </div>

            {/* Sort Order Dropdown */}
            <select
              id="past-questions-sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 text-slate-300 font-semibold rounded-xl px-3 py-1.5 text-xs outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="default">📋 Müfredat / Konu Sırasına Göre</option>
              <option value="total_desc">📊 Ortalama Soru Sayısına Göre (Çoktan Aza)</option>
              <option value="latest_2025">🔥 2025 YKS'de En Çok Çıkanlar</option>
            </select>
          </div>

          {/* Quick Bulk Action Buttons for current subject */}
          {!isGlobalSearchActive && (
            <div className="flex items-center space-x-2">
              {completedTopicsCount < currentSubjectTopics.length && (
                <button
                  type="button"
                  onClick={handleMarkAllCompleted}
                  className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-emerald-950/60 text-slate-400 hover:text-emerald-300 border border-slate-800 hover:border-emerald-500/40 text-[11px] font-bold transition-all flex items-center space-x-1.5 cursor-pointer"
                  title="Bu dersteki tüm konuları çözüldü olarak işaretle"
                >
                  <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Tümünü Çözüldü Yap</span>
                </button>
              )}

              {completedTopicsCount > 0 && (
                <button
                  type="button"
                  onClick={handleResetAllCompleted}
                  className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800 text-[11px] font-bold transition-all flex items-center space-x-1.5 cursor-pointer"
                  title="Bu dersteki tüm işaretleri sıfırla"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                  <span>Sıfırla</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── 3. OVERVIEW KPI CARDS (For Selected Subject) ── */}
      {!isGlobalSearchActive && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Card 1: Total Exam Questions Archive */}
          <div className="bg-slate-900/80 rounded-3xl p-5 border border-slate-800 shadow-xl flex items-center space-x-4 backdrop-blur-md">
            <div className="p-3.5 bg-indigo-500/15 rounded-2xl border border-indigo-500/30 text-indigo-400 shrink-0">
              <BookOpen className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Toplam Çıkmış Soru</span>
              <div className="text-xl font-black text-white mt-0.5 font-mono">
                {totalQuestionsInSubject} Soru
              </div>
              <span className="text-[11px] text-slate-500 truncate block">
                2018 - 2025 Arşivi (Yıllık ort. ~{totalSubjectExamQuestions.toFixed(0)} soru)
              </span>
            </div>
          </div>

          {/* Card 2: Top Subject Question Leader */}
          <div className="bg-slate-900/80 rounded-3xl p-5 border border-slate-800 shadow-xl flex items-center space-x-4 backdrop-blur-md">
            <div className="p-3.5 bg-amber-500/15 rounded-2xl border border-amber-500/30 text-amber-400 shrink-0">
              <Flame className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">En Çok Soru Çıkan Konu</span>
              <div className="text-sm font-extrabold text-amber-300 mt-0.5 truncate">
                {topTopicInSubject ? topTopicInSubject.topic : 'Kayıt Yok'}
              </div>
              <span className="text-[11px] text-amber-400/80 font-mono font-bold truncate block">
                {topTopicInSubject ? `${topTopicInSubject.totalQuestions} Soru • (${(topTopicInSubject.totalQuestions / 8).toFixed(1)} soru/yıl)` : ''}
              </span>
            </div>
          </div>

          {/* Card 3: Student Study Progress */}
          <div className="bg-slate-900/80 rounded-3xl p-5 border border-slate-800 shadow-xl flex items-center space-x-4 backdrop-blur-md">
            <div className="p-3.5 bg-emerald-500/15 rounded-2xl border border-emerald-500/30 text-emerald-400 shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Çözülen Soru Potansiyeli</span>
              <div className="text-xl font-black text-white mt-0.5 font-mono flex items-baseline space-x-1.5">
                <span>%{questionCoveragePercentage.toFixed(1)}</span>
                <span className="text-xs text-slate-400 font-normal">({completedQuestionsAvg.toFixed(1)} soru)</span>
              </div>
              <span className="text-[11px] text-emerald-400 font-bold truncate block">
                {completedTopicsCount} / {currentSubjectTopics.length} Konu Tamamlandı
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── 4. MAIN PAST EXAM QUESTIONS TABLE ── */}
      <div className="bg-slate-900/90 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl backdrop-blur-md">
        
        {/* Table Header Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-950/80">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white tracking-tight flex items-center gap-2">
                <span>{isGlobalSearchActive ? `"${searchTerm}" Arama Sonuçları` : `${selectedSubject} Çıkmış Soru Dağılımı`}</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-900 text-indigo-300 font-bold border border-indigo-500/30">
                  8 Yıl (2018 - 2025)
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Konuyu bitirdiğinizde solundaki kutucuğa tıklayarak tamamlandı olarak işaretleyin.
              </p>
            </div>
          </div>

          <div className="text-xs font-mono font-bold text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1 rounded-xl">
            {displayedTopics.length} Konu Listeleniyor
          </div>
        </div>

        {displayedTopics.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-14 h-14 mx-auto rounded-full bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <HelpCircle className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-bold text-white">Konu Kaydı Bulunamadı</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {isGlobalSearchActive 
                ? `"${searchTerm}" aramasına uygun hiçbir YKS çıkmış soru konusu bulunamadı.` 
                : 'Arama kriterlerinize veya seçilen filtrelere uygun çıkmış soru kaydı bulunamadı.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950 text-[11px] uppercase tracking-wider text-slate-300 border-b border-slate-800 select-none">
                  <th className="py-4 px-4 text-center w-14 font-black">Durum</th>
                  <th className="py-4 px-4 min-w-[240px] font-black">Konu Adı & Kapsamı</th>
                  <th className="py-4 px-2.5 text-center bg-indigo-950/60 text-indigo-200 font-black border-x border-indigo-500/30">2025</th>
                  <th className="py-4 px-2.5 text-center font-bold">2024</th>
                  <th className="py-4 px-2.5 text-center font-bold">2023</th>
                  <th className="py-4 px-2.5 text-center font-bold">2022</th>
                  <th className="py-4 px-2.5 text-center font-bold">2021</th>
                  <th className="py-4 px-2.5 text-center font-bold">2020</th>
                  <th className="py-4 px-2.5 text-center font-bold">2019</th>
                  <th className="py-4 px-2.5 text-center font-bold">2018</th>
                  <th className="py-4 px-4 text-center font-black bg-slate-950 text-white">Toplam</th>
                  <th className="py-4 px-5 text-right font-black min-w-[170px] text-amber-300">Yıllık Ortalama</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-xs">
                {displayedTopics.map((topicItem, index) => {
                  const topicKey = `${topicItem.subject}:${topicItem.topic}`;
                  const isCompleted = isTopicCompleted(topicItem.subject, topicItem.topic);
                  const avgPerYear = (topicItem.totalQuestions / 8).toFixed(1);
                  const numAvg = topicItem.totalQuestions / 8;
                  const ratioToMax = Math.min(100, Math.max(8, (topicItem.totalQuestions / (maxTopicQuestions || 1)) * 100));

                  return (
                    <tr 
                      key={`${topicItem.subject}-${topicItem.id || index}`}
                      className={`transition-all group border-b border-slate-850/80 ${
                        isCompleted 
                          ? 'bg-emerald-950/20 hover:bg-emerald-950/30 border-emerald-500/30' 
                          : index % 2 === 0 
                          ? 'bg-slate-900/60 hover:bg-indigo-950/30' 
                          : 'bg-slate-950/70 hover:bg-indigo-950/30'
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          id={`toggle-past-topic-${topicItem.id}`}
                          type="button"
                          onClick={() => onTogglePastTopic(topicKey)}
                          title={isCompleted ? 'İşareti kaldır (Çözülmedi)' : 'Çözüldü olarak işaretle'}
                          className="p-1 rounded-lg transition-transform hover:scale-110 focus:outline-none cursor-pointer"
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400 fill-emerald-500/20 shadow-sm" />
                          ) : (
                            <Circle className="w-5 h-5 text-slate-600 hover:text-indigo-400 transition-colors" />
                          )}
                        </button>
                      </td>

                      {/* Topic Name & Subject Badge if Global Search */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {isGlobalSearchActive && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedSubject(topicItem.subject);
                                setSearchTerm('');
                              }}
                              className="px-2 py-0.5 rounded-md bg-indigo-950 border border-indigo-500/40 text-indigo-300 font-extrabold text-[10px] hover:bg-indigo-900 transition-colors cursor-pointer"
                              title="Bu dersin sayfasına geç"
                            >
                              {topicItem.subject}
                            </button>
                          )}
                          <span className={`font-extrabold text-sm tracking-tight transition-colors ${
                            isCompleted ? 'text-slate-400 line-through' : 'text-white group-hover:text-indigo-200'
                          }`}>
                            {topicItem.topic}
                          </span>
                        </div>
                        {topicItem.description && (
                          <div className="text-[11px] text-slate-400 mt-1 font-medium leading-relaxed">
                            {topicItem.description}
                          </div>
                        )}
                      </td>

                      {/* 2025 - Highlighted Column */}
                      <td className="py-3.5 px-2.5 text-center font-black bg-indigo-950/40 border-x border-indigo-500/20">
                        {topicItem.yearCounts[2025] > 0 ? (
                          <span className="inline-block px-2 py-0.5 rounded-lg bg-indigo-500/30 border border-indigo-400/40 text-indigo-100 font-mono font-bold shadow-sm">
                            {topicItem.yearCounts[2025]}
                          </span>
                        ) : (
                          <span className="text-slate-600 font-mono">-</span>
                        )}
                      </td>

                      {/* 2024 - 2018 Columns */}
                      <td className="py-3.5 px-2.5 text-center font-mono font-semibold">
                        {topicItem.yearCounts[2024] > 0 ? (
                          <span className="text-slate-200">{topicItem.yearCounts[2024]}</span>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>

                      <td className="py-3.5 px-2.5 text-center font-mono font-semibold">
                        {topicItem.yearCounts[2023] > 0 ? (
                          <span className="text-slate-200">{topicItem.yearCounts[2023]}</span>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>

                      <td className="py-3.5 px-2.5 text-center font-mono font-semibold">
                        {topicItem.yearCounts[2022] > 0 ? (
                          <span className="text-slate-200">{topicItem.yearCounts[2022]}</span>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>

                      <td className="py-3.5 px-2.5 text-center font-mono font-semibold">
                        {topicItem.yearCounts[2021] > 0 ? (
                          <span className="text-slate-200">{topicItem.yearCounts[2021]}</span>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>

                      <td className="py-3.5 px-2.5 text-center font-mono font-semibold">
                        {topicItem.yearCounts[2020] > 0 ? (
                          <span className="text-slate-200">{topicItem.yearCounts[2020]}</span>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>

                      <td className="py-3.5 px-2.5 text-center font-mono font-semibold">
                        {topicItem.yearCounts[2019] > 0 ? (
                          <span className="text-slate-200">{topicItem.yearCounts[2019]}</span>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>

                      <td className="py-3.5 px-2.5 text-center font-mono font-semibold">
                        {topicItem.yearCounts[2018] > 0 ? (
                          <span className="text-slate-200">{topicItem.yearCounts[2018]}</span>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>

                      {/* Total Questions (8 Years) */}
                      <td className="py-3.5 px-4 text-center bg-slate-950/80">
                        <span className="inline-block px-2.5 py-1 rounded-xl bg-slate-900 text-white font-mono font-black border border-slate-800 shadow-inner">
                          {topicItem.totalQuestions}
                        </span>
                      </td>

                      {/* 🌟 Prominent Yıllık Ortalama with Visual Indicator */}
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex flex-col items-end space-y-1">
                          {/* Visual Pill Badge */}
                          <div className="flex items-center space-x-1.5">
                            {numAvg >= 4 ? (
                              <span className="px-2.5 py-0.5 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-300 font-black text-xs font-mono shadow-sm flex items-center space-x-1">
                                <Flame className="w-3.5 h-3.5 text-rose-400 fill-rose-500/30" />
                                <span>{avgPerYear} Soru/Yıl</span>
                              </span>
                            ) : numAvg >= 2 ? (
                              <span className="px-2.5 py-0.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 font-extrabold text-xs font-mono shadow-sm flex items-center space-x-1">
                                <Zap className="w-3 h-3 text-amber-400" />
                                <span>{avgPerYear} Soru/Yıl</span>
                              </span>
                            ) : numAvg >= 1 ? (
                              <span className="px-2 py-0.5 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-bold text-xs font-mono">
                                <span>{avgPerYear} Soru/Yıl</span>
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 font-semibold text-xs font-mono">
                                <span>{avgPerYear} Soru/Yıl</span>
                              </span>
                            )}
                          </div>

                          {/* Mini Sparkline Bar showing proportional weight */}
                          <div className="w-24 bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800/80">
                            <div 
                              className={`h-full rounded-full ${
                                numAvg >= 4 
                                  ? 'bg-rose-500' 
                                  : numAvg >= 2 
                                  ? 'bg-amber-500' 
                                  : numAvg >= 1 
                                  ? 'bg-indigo-500' 
                                  : 'bg-slate-600'
                              }`}
                              style={{ width: `${ratioToMax}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
          <div className="flex items-center space-x-2">
            <span className="text-amber-400 font-bold">💡 Sınav Stratejisi:</span>
            <span>
              Yıllık ortalaması <strong className="text-white font-mono">2.0+</strong> olan kritik konuları öncelikle tamamlayarak sınav kapsamınızı hızla yükseltebilirsiniz.
            </span>
          </div>
          <div className="flex items-center space-x-2 shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-slate-300 font-semibold">ÖSYM Resmi YKS Verileri</span>
          </div>
        </div>

      </div>
    </div>
  );
};
