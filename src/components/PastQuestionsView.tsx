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
  Award,
  Sparkles,
  Layers,
  BarChart2,
  HelpCircle,
  ArrowUpDown
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
  const [examTypeFilter, setExamTypeFilter] = useState<'ALL' | 'TYT' | 'AYT'>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [importanceFilter, setImportanceFilter] = useState<'ALL' | 'high' | 'medium' | 'standard'>('ALL');
  const [completionFilter, setCompletionFilter] = useState<'ALL' | 'completed' | 'pending'>('ALL');
  const [sortBy, setSortBy] = useState<'default' | 'total_desc' | 'importance'>('default');

  // Available subjects list combining TYT & AYT
  const allSubjects = useMemo(() => {
    return [...YKS_SUBJECTS.TYT, ...YKS_SUBJECTS.AYT];
  }, []);

  // Filter subjects based on examTypeFilter dropdown
  const filteredSubjectOptions = useMemo(() => {
    if (examTypeFilter === 'TYT') return YKS_SUBJECTS.TYT;
    if (examTypeFilter === 'AYT') return YKS_SUBJECTS.AYT;
    return allSubjects;
  }, [examTypeFilter, allSubjects]);

  // Handle subject selection when changing exam type filter
  const handleExamTypeFilterChange = (type: 'ALL' | 'TYT' | 'AYT') => {
    setExamTypeFilter(type);
    if (type === 'TYT' && !YKS_SUBJECTS.TYT.includes(selectedSubject)) {
      setSelectedSubject(YKS_SUBJECTS.TYT[0]);
    } else if (type === 'AYT' && !YKS_SUBJECTS.AYT.includes(selectedSubject)) {
      setSelectedSubject(YKS_SUBJECTS.AYT[0]);
    }
  };

  // Get topics for selected subject
  const currentSubjectTopics = useMemo(() => {
    return PAST_EXAM_QUESTIONS_DATA.filter((item) => item.subject === selectedSubject);
  }, [selectedSubject]);

  // Apply search & extra filters
  const displayedTopics = useMemo(() => {
    let list = [...currentSubjectTopics];

    if (searchTerm.trim() !== '') {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (t) => t.topic.toLowerCase().includes(q) || (t.description && t.description.toLowerCase().includes(q))
      );
    }

    if (importanceFilter !== 'ALL') {
      list = list.filter((t) => t.importance === importanceFilter);
    }

    if (completionFilter !== 'ALL') {
      list = list.filter((t) => {
        const topicKey = `${t.subject}:${t.topic}`;
        const isCompleted = completedPastTopics.includes(topicKey);
        return completionFilter === 'completed' ? isCompleted : !isCompleted;
      });
    }

    if (sortBy === 'total_desc') {
      list.sort((a, b) => b.totalQuestions - a.totalQuestions);
    } else if (sortBy === 'importance') {
      const priority = { high: 3, medium: 2, standard: 1 };
      list.sort((a, b) => priority[b.importance] - priority[a.importance]);
    }

    return list;
  }, [currentSubjectTopics, searchTerm, importanceFilter, completionFilter, sortBy, completedPastTopics]);

  // Statistical calculations
  const totalQuestionsInSubject = useMemo(() => {
    return currentSubjectTopics.reduce((acc, t) => acc + t.totalQuestions, 0);
  }, [currentSubjectTopics]);

  const topTopicInSubject = useMemo(() => {
    if (currentSubjectTopics.length === 0) return null;
    return [...currentSubjectTopics].sort((a, b) => b.totalQuestions - a.totalQuestions)[0];
  }, [currentSubjectTopics]);

  const completedTopicsCount = useMemo(() => {
    return currentSubjectTopics.filter((t) => {
      const topicKey = `${t.subject}:${t.topic}`;
      return completedPastTopics.includes(topicKey);
    }).length;
  }, [currentSubjectTopics, completedPastTopics]);

  const progressPercentage = currentSubjectTopics.length > 0
    ? Math.round((completedTopicsCount / currentSubjectTopics.length) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 border border-indigo-500/20 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-medium mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              ÖSYM YKS 2018 - 2025 Analiz Arşivi
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
              <FileText className="w-8 h-8 text-indigo-400" />
              Çıkmış Sorular Konu Dağılımı
            </h1>
            <p className="text-slate-400 text-sm mt-1 max-w-2xl">
              ÖSYM'nin son 8 yılda sorduğu tüm soruların konu bazlı istatistiklerini inceleyin, 
              çözdüğünüz konuları işaretleyerek eksiklerinizi tamamlayın.
            </p>
          </div>

          <div className="bg-slate-900/80 backdrop-blur-md p-4 rounded-xl border border-slate-800 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-lg">
              %{progressPercentage}
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">Bu Dersteki İlerlemeniz</div>
              <div className="text-sm font-semibold text-white mt-0.5">
                {completedTopicsCount} / {currentSubjectTopics.length} Konu Çözüldü
              </div>
              <div className="w-32 bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
                <div 
                  className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Controls & Dropdown Selector Bar */}
      <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 shadow-lg space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">

          {/* Exam Type Toggle Filter */}
          <div className="md:col-span-3">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Sınav Türü Filtresi
            </label>
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                id="past-questions-filter-all"
                onClick={() => handleExamTypeFilterChange('ALL')}
                className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  examTypeFilter === 'ALL'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Tümü
              </button>
              <button
                id="past-questions-filter-tyt"
                onClick={() => handleExamTypeFilterChange('TYT')}
                className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  examTypeFilter === 'TYT'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                TYT
              </button>
              <button
                id="past-questions-filter-ayt"
                onClick={() => handleExamTypeFilterChange('AYT')}
                className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  examTypeFilter === 'AYT'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                AYT
              </button>
            </div>
          </div>
          
          {/* Main Course / Subject Dropdown (Required explicitly by user) */}
          <div className="md:col-span-4">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Ders Seçin (Açılır Menü)
            </label>
            <div className="relative">
              <select
                id="past-questions-subject-select"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full bg-slate-950 border-2 border-indigo-500/40 focus:border-indigo-500 text-white font-medium rounded-xl px-4 py-2.5 text-sm outline-none transition-all appearance-none cursor-pointer"
              >
                {(examTypeFilter === 'ALL' || examTypeFilter === 'TYT') && (
                  <optgroup label="--- TYT DERSLERİ ---">
                    {YKS_SUBJECTS.TYT.map((sub) => (
                      <option key={sub} value={sub}>
                        📘 {sub}
                      </option>
                    ))}
                  </optgroup>
                )}
                {(examTypeFilter === 'ALL' || examTypeFilter === 'AYT') && (
                  <optgroup label="--- AYT DERSLERİ ---">
                    {YKS_SUBJECTS.AYT.map((sub) => (
                      <option key={sub} value={sub}>
                        📙 {sub}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-indigo-400 font-bold text-xs">
                ▼
              </div>
            </div>
          </div>

          {/* Search Box */}
          <div className="md:col-span-5">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Konu Ara
            </label>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="past-questions-search-input"
                type="text"
                placeholder="Örn: Paragraf, Türev, Elektrik..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white rounded-xl pl-10 pr-4 py-2 text-sm outline-none"
              />
            </div>
          </div>

        </div>

        {/* Secondary Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-400 font-medium flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Filtrele:
            </span>

            {/* Importance Filter */}
            <select
              id="past-questions-importance-select"
              value={importanceFilter}
              onChange={(e) => setImportanceFilter(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 text-slate-300 rounded-lg px-2.5 py-1 text-xs outline-none focus:border-indigo-500"
            >
              <option value="ALL">Tüm Önem Düzeyleri</option>
              <option value="high">🔥 Yüksek Önemli (Çok Çıkanlar)</option>
              <option value="medium">⚡ Orta Önemli</option>
              <option value="standard">📌 Standart Önemli</option>
            </select>

            {/* Completion Status Filter */}
            <select
              id="past-questions-completion-select"
              value={completionFilter}
              onChange={(e) => setCompletionFilter(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 text-slate-300 rounded-lg px-2.5 py-1 text-xs outline-none focus:border-indigo-500"
            >
              <option value="ALL">Tüm Durumlar</option>
              <option value="completed">✅ Çözülen Konular</option>
              <option value="pending">⏳ Henüz Çözülmeyenler</option>
            </select>

            {/* Sort Order */}
            <select
              id="past-questions-sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 text-slate-300 rounded-lg px-2.5 py-1 text-xs outline-none focus:border-indigo-500"
            >
              <option value="default">Varsayılan Konu Sırası</option>
              <option value="total_desc">En Çok Soru Çıkandan En Aza</option>
              <option value="importance">Önem Derecesine Göre</option>
            </select>
          </div>

          <div className="text-slate-400 font-medium">
            Gösterilen: <span className="text-white font-bold">{displayedTopics.length}</span> / {currentSubjectTopics.length} Konu
          </div>
        </div>
      </div>

      {/* Overview Stat Cards for Selected Subject */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-800 flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-400">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400">Toplam Çıkmış Soru (2018-2025)</div>
            <div className="text-xl font-bold text-white mt-0.5">
              {totalQuestionsInSubject} Soru
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">{selectedSubject} müfredatında</div>
          </div>
        </div>

        <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-800 flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-400">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400">En Çok Soru Çıkan Konu</div>
            <div className="text-sm font-bold text-amber-300 mt-0.5 truncate max-w-[200px]">
              {topTopicInSubject ? topTopicInSubject.topic : 'Kayıt Yok'}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {topTopicInSubject ? `${topTopicInSubject.totalQuestions} Soru (${(topTopicInSubject.totalQuestions / 8).toFixed(1)} soru/yıl)` : ''}
            </div>
          </div>
        </div>

        <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-800 flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400">Öğrenci Çalışma Durumu</div>
            <div className="text-xl font-bold text-white mt-0.5">
              {completedTopicsCount} / {currentSubjectTopics.length} Konu
            </div>
            <div className="text-[11px] text-emerald-400 font-medium mt-0.5">
              Tamamlanma oranı %{progressPercentage}
            </div>
          </div>
        </div>
      </div>

      {/* Main Past Exam Questions Table (Konu Konu Tablo) */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-400" />
              {selectedSubject} - Konulara Göre Yıllık Soru Tablosu
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold border border-slate-700">
              8 Yıl (2018 - 2025)
            </span>
          </div>

          <div className="text-xs text-slate-400 hidden sm:block">
            💡 Konu solundaki kutucuğa tıklayarak tamamlandı durumunu güncelleyebilirsiniz.
          </div>
        </div>

        {displayedTopics.length === 0 ? (
          <div className="p-12 text-center">
            <HelpCircle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-300">Konu Bulunamadı</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Arama kriterlerinize veya seçilen filtrelere uygun çıkmış soru kaydı bulunamadı.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/90 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  <th className="py-3.5 px-4 text-center w-12">Durum</th>
                  <th className="py-3.5 px-4 min-w-[220px]">Konu Adı</th>
                  <th className="py-3.5 px-4 text-center">Önem</th>
                  <th className="py-3.5 px-2 text-center bg-indigo-950/30 text-indigo-300 font-bold">2025</th>
                  <th className="py-3.5 px-2 text-center">2024</th>
                  <th className="py-3.5 px-2 text-center">2023</th>
                  <th className="py-3.5 px-2 text-center">2022</th>
                  <th className="py-3.5 px-2 text-center">2021</th>
                  <th className="py-3.5 px-2 text-center">2020</th>
                  <th className="py-3.5 px-2 text-center">2019</th>
                  <th className="py-3.5 px-2 text-center">2018</th>
                  <th className="py-3.5 px-4 text-right bg-slate-950 text-white font-bold">Toplam</th>
                  <th className="py-3.5 px-4 text-right text-slate-400">Ort./Yıl</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {displayedTopics.map((topicItem) => {
                  const topicKey = `${topicItem.subject}:${topicItem.topic}`;
                  const isCompleted = completedPastTopics.includes(topicKey);
                  const avgPerYear = (topicItem.totalQuestions / 8).toFixed(1);

                  return (
                    <tr 
                      key={topicItem.id}
                      className={`hover:bg-slate-800/50 transition-colors ${
                        isCompleted ? 'bg-emerald-950/10' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-4 text-center">
                        <button
                          id={`toggle-past-topic-${topicItem.id}`}
                          onClick={() => onTogglePastTopic(topicKey)}
                          title={isCompleted ? 'Tamamlanmadı yap' : 'Tamamlandı yap'}
                          className="text-slate-400 hover:text-emerald-400 transition-colors focus:outline-none"
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400 fill-emerald-500/20" />
                          ) : (
                            <Circle className="w-5 h-5 text-slate-600 hover:text-slate-400" />
                          )}
                        </button>
                      </td>

                      {/* Topic Name */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-200 flex items-center gap-2">
                          <span className={isCompleted ? 'line-through text-slate-400' : ''}>
                            {topicItem.topic}
                          </span>
                        </div>
                        {topicItem.description && (
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {topicItem.description}
                          </div>
                        )}
                      </td>

                      {/* Importance Badge */}
                      <td className="py-3 px-4 text-center">
                        {topicItem.importance === 'high' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 font-medium text-[10px]">
                            <Flame className="w-3 h-3 fill-red-500/30" /> Yüksek
                          </span>
                        )}
                        {topicItem.importance === 'medium' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-medium text-[10px]">
                            ⚡ Orta
                          </span>
                        )}
                        {topicItem.importance === 'standard' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-medium text-[10px]">
                            Standart
                          </span>
                        )}
                      </td>

                      {/* 2025 - 2018 Columns */}
                      <td className="py-3 px-2 text-center font-bold text-indigo-300 bg-indigo-950/20">
                        {topicItem.yearCounts[2025] > 0 ? (
                          <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-200">
                            {topicItem.yearCounts[2025]}
                          </span>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>

                      <td className="py-3 px-2 text-center text-slate-300">
                        {topicItem.yearCounts[2024] > 0 ? topicItem.yearCounts[2024] : <span className="text-slate-600">-</span>}
                      </td>

                      <td className="py-3 px-2 text-center text-slate-300">
                        {topicItem.yearCounts[2023] > 0 ? topicItem.yearCounts[2023] : <span className="text-slate-600">-</span>}
                      </td>

                      <td className="py-3 px-2 text-center text-slate-300">
                        {topicItem.yearCounts[2022] > 0 ? topicItem.yearCounts[2022] : <span className="text-slate-600">-</span>}
                      </td>

                      <td className="py-3 px-2 text-center text-slate-300">
                        {topicItem.yearCounts[2021] > 0 ? topicItem.yearCounts[2021] : <span className="text-slate-600">-</span>}
                      </td>

                      <td className="py-3 px-2 text-center text-slate-300">
                        {topicItem.yearCounts[2020] > 0 ? topicItem.yearCounts[2020] : <span className="text-slate-600">-</span>}
                      </td>

                      <td className="py-3 px-2 text-center text-slate-300">
                        {topicItem.yearCounts[2019] > 0 ? topicItem.yearCounts[2019] : <span className="text-slate-600">-</span>}
                      </td>

                      <td className="py-3 px-2 text-center text-slate-300">
                        {topicItem.yearCounts[2018] > 0 ? topicItem.yearCounts[2018] : <span className="text-slate-600">-</span>}
                      </td>

                      {/* Total Questions Count */}
                      <td className="py-3 px-4 text-right bg-slate-950 font-bold text-white">
                        <span className="inline-block px-2 py-0.5 rounded bg-slate-800 text-indigo-300 font-mono">
                          {topicItem.totalQuestions}
                        </span>
                      </td>

                      {/* Avg per year */}
                      <td className="py-3 px-4 text-right text-slate-400 font-mono">
                        {avgPerYear}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
          <div>
            📌 <strong className="text-slate-300">İpucu:</strong> YÖK/ÖSYM soru trendlerini yakalamak için son 3 yıla (2023-2025) özellikle ağırlık verin.
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-indigo-400" /> TYT & AYT Soru Arşivi
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
