import React, { useState } from 'react';
import { 
  Award, 
  Search, 
  CheckCircle2, 
  Circle, 
  Flame, 
  BarChart3, 
  BookOpen, 
  Calendar, 
  Sparkles, 
  Info, 
  Filter,
  CheckSquare,
  TrendingUp,
  FileCheck
} from 'lucide-react';
import { PastExamItem } from '../types';
import { PAST_EXAM_DISTRIBUTIONS, PAST_EXAM_YEARS, SubjectQuestionDistribution } from '../data/pastExamData';

interface PastExamsViewProps {
  pastExams: PastExamItem[];
  completedPastTopics?: string[];
  onToggleTopicCompleted: (topicKey: string) => void;
  onTogglePastExamSolved: (id: string) => void;
  onUpdatePastExamNet?: (id: string, correct: number, wrong: number, net: number) => void;
}

export const PastExamsView: React.FC<PastExamsViewProps> = ({
  pastExams,
  completedPastTopics = [],
  onToggleTopicCompleted,
  onTogglePastExamSolved,
  onUpdatePastExamNet
}) => {
  const [activeTab, setActiveTab] = useState<'matrix' | 'yearly_exams'>('matrix');
  const [examTypeFilter, setExamTypeFilter] = useState<'ALL' | 'TYT' | 'AYT'>('ALL');
  const [selectedSubject, setSelectedSubject] = useState<string>('TYT Türkçe');
  const [searchQuery, setSearchQuery] = useState('');
  const [showOnlyHighImportance, setShowOnlyHighImportance] = useState(false);

  // Available subjects based on exam filter
  const allSubjectKeys = Object.keys(PAST_EXAM_DISTRIBUTIONS);
  const filteredSubjectKeys = allSubjectKeys.filter((subj) => {
    const data = PAST_EXAM_DISTRIBUTIONS[subj];
    if (examTypeFilter === 'TYT') return data.examType === 'TYT';
    if (examTypeFilter === 'AYT') return data.examType === 'AYT';
    return true;
  });

  // Current selected subject data
  const currentDistribution: SubjectQuestionDistribution = PAST_EXAM_DISTRIBUTIONS[selectedSubject] || PAST_EXAM_DISTRIBUTIONS['TYT Türkçe'];

  // Filter topics inside subject
  const filteredTopics = currentDistribution.topics.filter((topic) => {
    const matchesSearch = topic.topicName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (topic.notes && topic.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesImportance = !showOnlyHighImportance || topic.importance === 'high';
    return matchesSearch && matchesImportance;
  });

  // Calculate totals for selected subject
  const subjectTotalQuestions = currentDistribution.topics.reduce((sum, topic) => {
    return sum + Object.values(topic.counts).reduce((a, b) => a + b, 0);
  }, 0);

  // Helper to check if a past topic is marked as completed (supports both :: and : formats)
  const isTopicCompleted = (subject: string, topicName: string) => {
    return (
      completedPastTopics.includes(`${subject}::${topicName}`) ||
      completedPastTopics.includes(`${subject}:${topicName}`) ||
      completedPastTopics.includes(topicName)
    );
  };

  const subjectCompletedCount = currentDistribution.topics.filter((topic) => 
    isTopicCompleted(selectedSubject, topic.topicName)
  ).length;

  const subjectCompletionPercentage = currentDistribution.topics.length > 0 
    ? Math.round((subjectCompletedCount / currentDistribution.topics.length) * 100) 
    : 0;

  // Find most asked topic in this subject
  let topTopicName = '-';
  let topTopicCount = 0;
  currentDistribution.topics.forEach((t) => {
    const total = Object.values(t.counts).reduce((a, b) => a + b, 0);
    if (total > topTopicCount) {
      topTopicCount = total;
      topTopicName = t.topicName;
    }
  });

  // Yearly column sums
  const yearlySums: Record<number, number> = {};
  PAST_EXAM_YEARS.forEach((yr) => {
    yearlySums[yr] = currentDistribution.topics.reduce((sum, t) => sum + (t.counts[yr] || 0), 0);
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900/60 via-slate-900/80 to-purple-900/60 border border-indigo-500/30 rounded-3xl p-6 md:p-8 backdrop-blur-xl relative overflow-hidden shadow-2xl">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-2 text-indigo-400 font-bold text-xs uppercase tracking-widest mb-1">
              <Award className="w-4 h-4 text-indigo-400" />
              <span>ÖSYM Sınav Arşivi ve Soru Analiz Bankası</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2">
              ÖSYM Çıkmış Sorular Dağılımı
              <span className="text-xs font-bold px-2.5 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full">
                2018 - 2025 YKS
              </span>
            </h1>
            <p className="text-slate-300 text-xs md:text-sm mt-1 max-w-2xl leading-relaxed">
              Ders ve konu bazında ÖSYM'nin çıkmış tüm soru dağılımlarını inceleyin, en çok soru gelen konuları tespit edin ve çözdüğünüz konuları işaretleyin.
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="flex items-center p-1 bg-slate-950/60 border border-slate-800 rounded-2xl">
            <button
              onClick={() => setActiveTab('matrix')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'matrix'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Konu Dağılım Tablosu</span>
            </button>
            <button
              onClick={() => setActiveTab('yearly_exams')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'yearly_exams'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileCheck className="w-4 h-4" />
              <span>Çıkmış Deneme Takibi</span>
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'matrix' ? (
        <>
          {/* Controls Bar: Exam Type Filter & Subject Dropdown */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 md:p-5 backdrop-blur-md shadow-xl space-y-4">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              
              {/* Subject Selection Dropdown (AÇILIR MENÜ) */}
              <div className="flex-1 space-y-1.5">
                <label className="text-xs font-extrabold text-indigo-300 uppercase tracking-wider flex items-center space-x-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Ders Seçiniz (Açılır Menü):</span>
                </label>
                <select
                  id="select-subject-past-exams"
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full bg-slate-950 border-2 border-indigo-500/40 focus:border-indigo-400 text-white text-sm md:text-base font-bold rounded-xl px-4 py-3 outline-none transition-all shadow-inner hover:border-indigo-500/70"
                >
                  {filteredSubjectKeys.map((subj) => {
                    const info = PAST_EXAM_DISTRIBUTIONS[subj];
                    return (
                      <option key={subj} value={subj} className="bg-slate-900 text-white font-medium">
                        [{info.examType}] {subj} ({info.topics.length} Konu)
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Exam Type Quick Filter (Tümü / TYT / AYT) */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
                  <Filter className="w-3.5 h-3.5" />
                  <span>Sınav Türü:</span>
                </label>
                <div className="flex items-center bg-slate-950 border border-slate-800 p-1 rounded-xl">
                  <button
                    onClick={() => {
                      setExamTypeFilter('ALL');
                    }}
                    className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                      examTypeFilter === 'ALL' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Tümü
                  </button>
                  <button
                    onClick={() => {
                      setExamTypeFilter('TYT');
                      if (!selectedSubject.startsWith('TYT')) {
                        setSelectedSubject('TYT Türkçe');
                      }
                    }}
                    className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                      examTypeFilter === 'TYT' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    TYT
                  </button>
                  <button
                    onClick={() => {
                      setExamTypeFilter('AYT');
                      if (!selectedSubject.startsWith('AYT')) {
                        setSelectedSubject('AYT Matematik');
                      }
                    }}
                    className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                      examTypeFilter === 'AYT' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    AYT
                  </button>
                </div>
              </div>

            </div>

            {/* Sub-Filters: Search & High Importance Toggle */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Konularda veya notlarda ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 outline-none transition-all placeholder:text-slate-500"
                />
              </div>

              <div className="flex items-center space-x-4 w-full sm:w-auto justify-between sm:justify-end">
                <button
                  onClick={() => setShowOnlyHighImportance(!showOnlyHighImportance)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                    showOnlyHighImportance
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  <Flame className={`w-3.5 h-3.5 ${showOnlyHighImportance ? 'text-amber-400 fill-amber-400' : ''}`} />
                  <span>Sadece Çok Çıkan Konular</span>
                </button>
              </div>
            </div>
          </div>

          {/* Statistics Grid for Selected Subject */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center space-x-4">
              <div className="w-11 h-11 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400 font-bold">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-slate-400 uppercase">Seçili Ders</div>
                <div className="text-base font-black text-white truncate max-w-[170px]">{selectedSubject}</div>
                <div className="text-[10px] text-indigo-300 font-semibold">{currentDistribution.topics.length} Konu Mevcut</div>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center space-x-4">
              <div className="w-11 h-11 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-center justify-center text-purple-400 font-bold">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-slate-400 uppercase">Toplam Çıkmış Soru</div>
                <div className="text-xl font-black text-white">{subjectTotalQuestions} Soru</div>
                <div className="text-[10px] text-purple-300 font-semibold">2018 - 2025 Toplamı</div>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center space-x-4">
              <div className="w-11 h-11 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center text-amber-400 font-bold">
                <Flame className="w-5 h-5 fill-amber-500/20" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-slate-400 uppercase">En Çok Çıkan Konu</div>
                <div className="text-xs font-extrabold text-amber-300 truncate max-w-[170px]" title={topTopicName}>{topTopicName}</div>
                <div className="text-[10px] text-slate-400 font-semibold">{topTopicCount} Soru Çıktı</div>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-[11px] font-bold text-slate-400 uppercase">Çözüm İlerlemen</div>
                <div className="text-xs font-black text-emerald-400">{subjectCompletionPercentage}%</div>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                <div 
                  className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${subjectCompletionPercentage}%` }}
                />
              </div>
              <div className="text-[10px] text-slate-400 font-medium text-right">
                {subjectCompletedCount} / {currentDistribution.topics.length} Konu Tamamlandı
              </div>
            </div>

          </div>

          {/* Main Distribution Matrix Table */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-md">
            
            {/* Table Header Controls */}
            <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-black text-white flex items-center space-x-2">
                  <span>{selectedSubject} ÖSYM Çıkmış Soru Dağılımı (2018 - 2025)</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Yeşil onay butonlarına tıklayarak çözdüğünüz ÖSYM konularını işaretleyebilirsiniz.
                </p>
              </div>

              {/* Color legend */}
              <div className="flex items-center space-x-3 text-[10px] text-slate-400 font-medium">
                <div className="flex items-center space-x-1">
                  <span className="w-2.5 h-2.5 rounded-sm bg-slate-800 border border-slate-700 inline-block" />
                  <span>0</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="w-2.5 h-2.5 rounded-sm bg-indigo-950/80 border border-indigo-700/50 inline-block" />
                  <span>1-2</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="w-2.5 h-2.5 rounded-sm bg-purple-900/60 border border-purple-600/60 inline-block" />
                  <span>3-4</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="w-2.5 h-2.5 rounded-sm bg-amber-500/30 border border-amber-500/60 inline-block" />
                  <span>5+</span>
                </div>
              </div>
            </div>

            {/* Table Scroll Container */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950 border-b border-slate-800 text-[11px] font-extrabold text-slate-300 uppercase tracking-wider">
                    <th className="p-3.5 text-center w-12">Durum</th>
                    <th className="p-3.5 min-w-[220px]">Konu Adı</th>
                    {PAST_EXAM_YEARS.map((yr) => (
                      <th key={yr} className="p-3.5 text-center min-w-[55px] font-mono">
                        {yr}
                      </th>
                    ))}
                    <th className="p-3.5 text-center font-bold text-indigo-300 min-w-[70px]">Toplam</th>
                    <th className="p-3.5 text-center font-bold text-slate-400 min-w-[65px]">Ort.</th>
                    <th className="p-3.5 min-w-[180px]">ÖSYM Notu & İpucu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {filteredTopics.length === 0 ? (
                    <tr>
                      <td colSpan={13} className="p-8 text-center text-slate-400 font-medium">
                        Arama kriterlerinize uygun konu bulunamadı.
                      </td>
                    </tr>
                  ) : (
                    filteredTopics.map((topic, index) => {
                      const topicKey = `${selectedSubject}::${topic.topicName}`;
                      const isCompleted = isTopicCompleted(selectedSubject, topic.topicName);
                      
                      const totalQuestions = Object.values(topic.counts).reduce((a, b) => a + b, 0);
                      const avgPerYear = (totalQuestions / PAST_EXAM_YEARS.length).toFixed(1);

                      return (
                        <tr 
                          key={topic.topicName}
                          className={`transition-colors hover:bg-slate-800/40 ${
                            isCompleted ? 'bg-emerald-950/10' : index % 2 === 0 ? 'bg-slate-900/20' : 'bg-transparent'
                          }`}
                        >
                          {/* Status Checkbox */}
                          <td className="p-3 text-center">
                            <button
                              onClick={() => onToggleTopicCompleted(topicKey)}
                              title={isCompleted ? "Tamamlandı olarak işaretli" : "Tamamlandı olarak işaretle"}
                              className="p-1 rounded-lg hover:scale-110 transition-transform text-slate-400 hover:text-white"
                            >
                              {isCompleted ? (
                                <CheckCircle2 className="w-5 h-5 text-emerald-400 fill-emerald-400/20" />
                              ) : (
                                <Circle className="w-5 h-5 text-slate-600 hover:text-slate-400" />
                              )}
                            </button>
                          </td>

                          {/* Topic Name */}
                          <td className="p-3 font-semibold text-slate-200">
                            <div className="flex items-center space-x-2">
                              {topic.importance === 'high' && (
                                <span title="🔥 Çok Soru Çıkan Kritik Konu" className="inline-flex">
                                  <Flame className="w-4 h-4 text-amber-400 fill-amber-400 flex-shrink-0" />
                                </span>
                              )}
                              <span className={isCompleted ? "line-through text-slate-400 font-normal" : "text-white"}>
                                {topic.topicName}
                              </span>
                            </div>
                          </td>

                          {/* Yearly Counts */}
                          {PAST_EXAM_YEARS.map((yr) => {
                            const cnt = topic.counts[yr] || 0;
                            let bgClass = "bg-slate-950/40 text-slate-600";
                            if (cnt >= 5) bgClass = "bg-amber-500/20 text-amber-300 font-black border border-amber-500/40";
                            else if (cnt >= 3) bgClass = "bg-purple-900/40 text-purple-200 font-extrabold border border-purple-700/40";
                            else if (cnt >= 1) bgClass = "bg-indigo-950/60 text-indigo-300 font-bold border border-indigo-800/30";

                            return (
                              <td key={yr} className="p-2 text-center">
                                <span className={`inline-block px-2 py-1 rounded-lg text-xs font-mono w-8 text-center ${bgClass}`}>
                                  {cnt}
                                </span>
                              </td>
                            );
                          })}

                          {/* Total Questions */}
                          <td className="p-3 text-center font-black font-mono text-indigo-300 bg-indigo-500/5">
                            {totalQuestions}
                          </td>

                          {/* Yearly Average */}
                          <td className="p-3 text-center font-semibold font-mono text-slate-300">
                            {avgPerYear}
                          </td>

                          {/* Notes */}
                          <td className="p-3 text-slate-400 text-[11px] leading-relaxed">
                            {topic.notes ? (
                              <div className="flex items-start space-x-1.5 text-indigo-300/90">
                                <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                                <span>{topic.notes}</span>
                              </div>
                            ) : (
                              <span className="text-slate-600">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                
                {/* Table Footer - Yearly Sums */}
                <tfoot>
                  <tr className="bg-slate-950 font-extrabold border-t-2 border-slate-800 text-white">
                    <td colSpan={2} className="p-3.5 text-right text-xs uppercase text-indigo-300">
                      Yıl Bazlı Toplam Soru Sayısı:
                    </td>
                    {PAST_EXAM_YEARS.map((yr) => (
                      <td key={yr} className="p-3.5 text-center font-mono text-xs text-amber-300">
                        {yearlySums[yr]}
                      </td>
                    ))}
                    <td className="p-3.5 text-center font-mono text-xs text-indigo-400 bg-indigo-950/40">
                      {subjectTotalQuestions}
                    </td>
                    <td colSpan={2} className="p-3.5 text-slate-400 text-[11px] font-normal italic">
                      ÖSYM YKS soru dağılım matrisi (2018-2025)
                    </td>
                  </tr>
                </tfoot>

              </table>
            </div>

          </div>
        </>
      ) : (
        /* Yearly Full Exam Solver Tracker Sub-View */
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-6 backdrop-blur-md shadow-2xl">
          <div>
            <h2 className="text-lg font-black text-white flex items-center space-x-2">
              <FileCheck className="w-5 h-5 text-indigo-400" />
              <span>ÖSYM YKS Çıkmış Deneme Sınavları Çözüm Listesi</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Son 8 yılın (2018 - 2025) tam çıkmış TYT ve AYT denemelerini ne zaman çözdüğünüzü ve net sonuçlarınızı takip edin.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pastExams.map((exam) => (
              <div 
                key={exam.id}
                className={`p-4 rounded-2xl border transition-all ${
                  exam.solved
                    ? 'bg-slate-900/90 border-indigo-500/40 shadow-lg shadow-indigo-500/5'
                    : 'bg-slate-950/60 border-slate-800 opacity-80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => onTogglePastExamSolved(exam.id)}
                      className="p-1 rounded-lg hover:scale-110 transition-all text-slate-400 hover:text-white"
                    >
                      {exam.solved ? (
                        <CheckCircle2 className="w-6 h-6 text-emerald-400 fill-emerald-400/20" />
                      ) : (
                        <Circle className="w-6 h-6 text-slate-600" />
                      )}
                    </button>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-black px-2 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-md">
                          {exam.year} {exam.examType}
                        </span>
                        <h3 className="text-sm font-bold text-white">{exam.subject}</h3>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        {exam.solved ? `Çözüldü • Net: ${exam.netScore ?? '-'} Net` : 'Henüz çözülmedi'}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    {exam.solved && exam.netScore !== undefined && (
                      <div className="text-lg font-black text-emerald-400 font-mono">
                        {exam.netScore} Net
                      </div>
                    )}
                  </div>
                </div>

                {exam.notes && (
                  <div className="mt-3 pt-2 border-t border-slate-800 text-xs text-slate-400 italic">
                    "{exam.notes}"
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
