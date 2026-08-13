import React, { useEffect, useState, useMemo } from 'react';
import { ArrowLeft, GraduationCap, SlidersHorizontal, Award, TrendingUp, BarChart2, Sparkles, History, X } from 'lucide-react';
import { InstitutionalMockExam } from '../../types';

interface MockInstitutionalDetailViewProps {
  selectedInstitutionalExam: InstitutionalMockExam | null;
  setSelectedInstitutionalExam: (exam: InstitutionalMockExam | null) => void;
  allInstitutionalExams?: InstitutionalMockExam[];
}

export const MockInstitutionalDetailView: React.FC<MockInstitutionalDetailViewProps> = ({
  selectedInstitutionalExam,
  setSelectedInstitutionalExam,
  allInstitutionalExams = []
}) => {
  const [selectedTopicHistory, setSelectedTopicHistory] = useState<{
    subjectName: string;
    topicName: string;
  } | null>(null);

  useEffect(() => {
    if (selectedInstitutionalExam) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [selectedInstitutionalExam]);

  const normalizeText = (str: string) => {
    return (str || '')
      .toLowerCase()
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      .replace(/[^a-z0-9]/g, '');
  };

  // Find all exams belonging to the current student
  const studentExams = useMemo(() => {
    if (!selectedInstitutionalExam || !allInstitutionalExams.length) return [];
    return allInstitutionalExams.filter(ex => {
      if (selectedInstitutionalExam.studentId && ex.studentId) {
        return ex.studentId === selectedInstitutionalExam.studentId;
      }
      if (selectedInstitutionalExam.schoolNumber && ex.schoolNumber) {
        return ex.schoolNumber === selectedInstitutionalExam.schoolNumber;
      }
      return normalizeText(ex.studentName) === normalizeText(selectedInstitutionalExam.studentName);
    }).sort((a, b) => new Date(b.examDate).getTime() - new Date(a.examDate).getTime());
  }, [selectedInstitutionalExam, allInstitutionalExams]);

  // Extract performance history for selected topic
  const topicHistoryList = useMemo(() => {
    if (!selectedTopicHistory) return [];
    const normTarget = normalizeText(selectedTopicHistory.topicName);

    const results: Array<{
      examId: string;
      examTitle: string;
      examDate: string;
      subjectName: string;
      topicName: string;
      questionCount: number;
      correct: number;
      wrong: number;
      empty: number;
      successRate: number;
    }> = [];

    studentExams.forEach(ex => {
      ex.subjects?.forEach(sub => {
        sub.topics?.forEach(top => {
          const normTop = normalizeText(top.topicName);
          if (normTop === normTarget || normTop.includes(normTarget) || normTarget.includes(normTop)) {
            results.push({
              examId: ex.id,
              examTitle: ex.examTitle,
              examDate: ex.examDate,
              subjectName: sub.subjectName,
              topicName: top.topicName,
              questionCount: top.questionCount || (top.correct + top.wrong + top.empty),
              correct: top.correct,
              wrong: top.wrong,
              empty: top.empty,
              successRate: top.successRate
            });
          }
        });
      });
    });

    return results;
  }, [selectedTopicHistory, studentExams]);

  // Topic summary statistics
  const topicSummary = useMemo(() => {
    if (topicHistoryList.length === 0) return null;
    const totalQuestions = topicHistoryList.reduce((acc, curr) => acc + curr.questionCount, 0);
    const totalCorrect = topicHistoryList.reduce((acc, curr) => acc + curr.correct, 0);
    const totalWrong = topicHistoryList.reduce((acc, curr) => acc + curr.wrong, 0);
    const totalEmpty = topicHistoryList.reduce((acc, curr) => acc + curr.empty, 0);
    const avgSuccessRate = Math.round(
      topicHistoryList.reduce((acc, curr) => acc + curr.successRate, 0) / topicHistoryList.length
    );

    return {
      totalExams: topicHistoryList.length,
      totalQuestions,
      totalCorrect,
      totalWrong,
      totalEmpty,
      avgSuccessRate
    };
  }, [topicHistoryList]);

  if (!selectedInstitutionalExam) return null;

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Topic History Modal */}
      {selectedTopicHistory && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-slate-900 border border-indigo-500/30 rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-5 relative my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-indigo-500/20 border border-indigo-500/30 rounded-2xl text-indigo-400">
                  <History className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <span>{selectedTopicHistory.topicName}</span>
                    <span className="text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full">
                      {selectedTopicHistory.subjectName}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">Önceki kurumsal deneme sınavlarındaki kazanım performansı</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTopicHistory(null)}
                className="p-2 rounded-xl bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Topic Overall Summary */}
            {topicSummary && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950 p-4 rounded-2xl border border-white/10 font-mono text-center">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-500 font-sans uppercase font-bold block">Toplam Sınav</span>
                  <span className="text-sm font-extrabold text-white">{topicSummary.totalExams} Sınav</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-500 font-sans uppercase font-bold block">Soru Sayısı</span>
                  <span className="text-sm font-extrabold text-indigo-300">{topicSummary.totalQuestions} Soru</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-500 font-sans uppercase font-bold block">D / Y / B</span>
                  <span className="text-xs font-bold text-slate-300">
                    <strong className="text-emerald-400">{topicSummary.totalCorrect}D</strong>{' '}
                    <strong className="text-rose-400">{topicSummary.totalWrong}Y</strong>{' '}
                    <strong className="text-slate-400">{topicSummary.totalEmpty}B</strong>
                  </span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-500 font-sans uppercase font-bold block">Ort. Başarı</span>
                  <span className={`text-sm font-black ${
                    topicSummary.avgSuccessRate >= 70
                      ? 'text-emerald-400'
                      : topicSummary.avgSuccessRate >= 45
                        ? 'text-indigo-400'
                        : 'text-rose-400'
                  }`}>
                    %{topicSummary.avgSuccessRate}
                  </span>
                </div>
              </div>
            )}

            {/* Exam History List */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                <BarChart2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>Sınav Bazlı Kazanım İlerlemesi ({topicHistoryList.length})</span>
              </h4>

              {topicHistoryList.length === 0 ? (
                <div className="py-8 text-center text-slate-400 bg-slate-950 rounded-2xl border border-white/5 text-xs">
                  Bu kazanım için geçmiş deneme sınav kaydı bulunamadı.
                </div>
              ) : (
                <div className="max-h-72 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                  {topicHistoryList.map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-950 p-3.5 rounded-2xl border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-indigo-500/30 transition-all"
                    >
                      <div className="space-y-0.5">
                        <div className="text-xs font-extrabold text-white flex items-center space-x-2">
                          <span>{item.examTitle}</span>
                          {item.examId === selectedInstitutionalExam.id && (
                            <span className="text-[9px] font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.5 rounded">
                              Mevcut Karne
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">{item.examDate || 'Tarih Belirtilmemiş'}</div>
                      </div>

                      <div className="flex items-center space-x-4 shrink-0">
                        <div className="text-xs font-mono text-slate-300">
                          <span className="text-emerald-400 font-bold">{item.correct}D</span> •{' '}
                          <span className="text-rose-400 font-bold">{item.wrong}Y</span> •{' '}
                          <span className="text-slate-500 font-bold">{item.empty}B</span>
                        </div>

                        <div className="flex items-center space-x-2">
                          <div className="w-16 bg-slate-900 rounded-full h-1.5 overflow-hidden border border-white/5 hidden sm:block">
                            <div
                              className={`h-full rounded-full ${
                                item.successRate >= 70
                                  ? 'bg-emerald-500'
                                  : item.successRate >= 45
                                    ? 'bg-indigo-500'
                                    : 'bg-rose-500'
                              }`}
                              style={{ width: `${Math.max(5, item.successRate)}%` }}
                            />
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                              item.successRate >= 70
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : item.successRate >= 45
                                  ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}
                          >
                            %{item.successRate}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer Guidance */}
            <div className="bg-indigo-500/10 border border-indigo-500/20 p-3.5 rounded-2xl flex items-start space-x-3 text-xs">
              <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <p className="text-indigo-200 text-[11px] leading-relaxed">
                Öğrencinin bu kazanımdaki önceki deneme sınav performansları listelenmektedir. Başarı oranı düşük çıkan sınav konuları için çalışma planında bu konuya ağırlık verebilirsiniz.
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedTopicHistory(null)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-extrabold text-xs px-5 py-2 rounded-xl border border-slate-700 transition-all cursor-pointer"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Breadcrumbs / Back button */}
      <div className="flex items-center space-x-2">
        <button
          type="button"
          onClick={() => setSelectedInstitutionalExam(null)}
          className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold border border-slate-700/60 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-indigo-400" />
          <span>Geri Dön</span>
        </button>
        <span className="text-slate-500 text-xs font-medium">/</span>
        <span className="text-slate-400 text-xs font-medium truncate max-w-xs">{selectedInstitutionalExam.examTitle}</span>
      </div>

      {/* Detailed Report Card Card View */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center space-x-3.5">
            <div className="bg-indigo-500/10 p-3 rounded-2xl border border-indigo-500/30 text-indigo-400">
              <GraduationCap className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Kurumsal Deneme Sonuç Karnesi
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 font-medium">
                {selectedInstitutionalExam.examTitle} • {selectedInstitutionalExam.examDate}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSelectedInstitutionalExam(null)}
            className="bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 hover:text-indigo-300 font-extrabold text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer border border-indigo-500/20 self-start sm:self-center"
          >
            Kapat ve Listeye Dön
          </button>
        </div>

        {/* Student & Overall Rank Stats Header */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex items-center space-x-3.5">
            <div className="bg-sky-500/10 p-2.5 rounded-xl text-sky-400 shrink-0">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Öğrenci Bilgileri</span>
              <div className="text-sm font-extrabold text-white mt-0.5">{selectedInstitutionalExam.studentName}</div>
              <div className="text-xs text-slate-400 font-medium">{selectedInstitutionalExam.className} {selectedInstitutionalExam.schoolNumber ? `• No: ${selectedInstitutionalExam.schoolNumber}` : ''}</div>
            </div>
          </div>

          {/* Display primary score */}
          {(() => {
            let bestScoreType = 'SAY';
            let bestScore = selectedInstitutionalExam.scores.sayScore || 0;

            if ((selectedInstitutionalExam.scores.eaScore || 0) > bestScore) {
              bestScoreType = 'EA';
              bestScore = selectedInstitutionalExam.scores.eaScore || 0;
            }
            if ((selectedInstitutionalExam.scores.sozScore || 0) > bestScore) {
              bestScoreType = 'SÖZ';
              bestScore = selectedInstitutionalExam.scores.sozScore || 0;
            }

            if (bestScore === 0 && selectedInstitutionalExam.scores.sayScore !== undefined) {
              bestScoreType = 'SAY';
              bestScore = selectedInstitutionalExam.scores.sayScore;
            }

            return (
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex items-center space-x-3.5">
                <div className="bg-emerald-500/10 p-2.5 rounded-xl text-emerald-400 shrink-0">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Öncelikli Başarı Puanı</span>
                  <div className="text-sm font-extrabold text-white mt-0.5">{bestScore > 0 ? `${bestScore} Puan` : 'Hesaplanmadı'}</div>
                  <div className="text-xs text-emerald-400 font-bold">{bestScoreType} Alan Puanı</div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Detailed Rank & Percentile Breakdown Cards */}
        {(() => {
          let bestScoreType = 'SAY';
          let bestScore = selectedInstitutionalExam.scores.sayScore || 0;
          let classRank = selectedInstitutionalExam.scores.sayClassRank;
          let classTotal = selectedInstitutionalExam.scores.sayClassTotal;
          let instRank = selectedInstitutionalExam.scores.sayInstitutionRank;
          let instTotal = selectedInstitutionalExam.scores.sayInstitutionTotal;
          let genRank = selectedInstitutionalExam.scores.sayGeneralRank;
          let genTotal = selectedInstitutionalExam.scores.sayGeneralTotal;

          if ((selectedInstitutionalExam.scores.eaScore || 0) > bestScore) {
            bestScoreType = 'EA';
            bestScore = selectedInstitutionalExam.scores.eaScore || 0;
            classRank = selectedInstitutionalExam.scores.eaClassRank;
            classTotal = selectedInstitutionalExam.scores.eaClassTotal;
            instRank = selectedInstitutionalExam.scores.eaInstitutionRank;
            instTotal = selectedInstitutionalExam.scores.eaInstitutionTotal;
            genRank = selectedInstitutionalExam.scores.eaGeneralRank;
            genTotal = selectedInstitutionalExam.scores.eaGeneralTotal;
          }
          if ((selectedInstitutionalExam.scores.sozScore || 0) > bestScore) {
            bestScoreType = 'SÖZ';
            bestScore = selectedInstitutionalExam.scores.sozScore || 0;
            classRank = selectedInstitutionalExam.scores.sozClassRank;
            classTotal = selectedInstitutionalExam.scores.sozClassTotal;
            instRank = selectedInstitutionalExam.scores.sozInstitutionRank;
            instTotal = selectedInstitutionalExam.scores.sozInstitutionTotal;
            genRank = selectedInstitutionalExam.scores.sozGeneralRank;
            genTotal = selectedInstitutionalExam.scores.sozGeneralTotal;
          }

          if (bestScore === 0 && selectedInstitutionalExam.scores.sayScore !== undefined) {
            bestScoreType = 'SAY';
            bestScore = selectedInstitutionalExam.scores.sayScore;
            classRank = selectedInstitutionalExam.scores.sayClassRank;
            classTotal = selectedInstitutionalExam.scores.sayClassTotal;
            instRank = selectedInstitutionalExam.scores.sayInstitutionRank;
            instTotal = selectedInstitutionalExam.scores.sayInstitutionTotal;
            genRank = selectedInstitutionalExam.scores.sayGeneralRank;
            genTotal = selectedInstitutionalExam.scores.sayGeneralTotal;
          }

          // Fallbacks for participant counts if specific area total is not defined, BUT verify fallback is >= rank
          const generalParticipantFallback = selectedInstitutionalExam.scores.generalParticipantCount;
          const institutionParticipantFallback = selectedInstitutionalExam.scores.institutionParticipantCount;
          const classParticipantFallback = selectedInstitutionalExam.scores.classParticipantCount;

          if (!classTotal && classParticipantFallback && (!classRank || classParticipantFallback >= classRank)) {
            classTotal = classParticipantFallback;
          }
          if (!instTotal && institutionParticipantFallback && (!instRank || institutionParticipantFallback >= instRank)) {
            instTotal = institutionParticipantFallback;
          }
          if (!genTotal && generalParticipantFallback && (!genRank || generalParticipantFallback >= genRank)) {
            genTotal = generalParticipantFallback;
          }

          const calculateRankStats = (rank?: number, rawTotal?: number) => {
            if (!rank || rank <= 0) {
              return {
                displayRank: 'Derece Yok',
                percentileStr: '-',
                percentileVal: 0,
                fillPercentage: 0,
                hasData: false,
                totalNum: undefined
              };
            }

            let validTotal = rawTotal && rawTotal > 0 ? rawTotal : undefined;
            const isTotalInconsistent = !!(validTotal && validTotal < rank);

            if (isTotalInconsistent) {
              // Cap validTotal to rank if rawTotal was smaller than rank (data inconsistency)
              validTotal = rank;
            }

            if (!validTotal) {
              return {
                displayRank: `${rank}. Derece`,
                percentileStr: 'Katılımcı Sayısı Yok',
                percentileVal: 0,
                fillPercentage: 100,
                hasData: true,
                totalNum: undefined
              };
            }

            const percentile = Math.min(100, Math.max(0.01, (rank / validTotal) * 100));
            const fillPercentage = Math.max(4, Math.min(100, ((validTotal - rank + 1) / validTotal) * 100));

            return {
              displayRank: rawTotal && !isTotalInconsistent
                ? `${rank}. / ${rawTotal.toLocaleString('tr-TR')} Kişi`
                : `${rank}. Derece (En az ${rank} Kişi)`,
              percentileStr: `%${percentile < 1 ? percentile.toFixed(2) : percentile.toFixed(1)} Dilim`,
              percentileVal: percentile,
              fillPercentage,
              hasData: true,
              totalNum: validTotal
            };
          };

          const classStats = calculateRankStats(classRank, classTotal);
          const instStats = calculateRankStats(instRank, instTotal);
          const genStats = calculateRankStats(genRank, genTotal);

          return (
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-indigo-400" />
                <span>Dereceler & Yüzdelik Dilim Analizi ({bestScoreType})</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Sınıf Derecesi */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold text-indigo-400 uppercase tracking-wider">Sınıf Derecesi</span>
                    {classStats.percentileVal > 0 && (
                      <span className="text-xs font-black text-indigo-300 bg-indigo-500/20 border border-indigo-500/30 px-2 py-0.5 rounded-md">
                        {classStats.percentileStr}
                      </span>
                    )}
                  </div>
                  <div className="text-base sm:text-lg font-black text-white">{classStats.displayRank}</div>
                  <div className="space-y-1">
                    <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-white/5">
                      <div 
                        className="bg-gradient-to-r from-indigo-500 to-indigo-400 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${classStats.fillPercentage}%` }} 
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-500 font-semibold">
                      <span>1. Sıra</span>
                      <span>{classStats.totalNum ? `${classStats.totalNum} Kişi` : 'Son Sıra'}</span>
                    </div>
                  </div>
                </div>

                {/* Okul / Kurum Derecesi */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-wider">Okul / Kurum Derecesi</span>
                    {instStats.percentileVal > 0 && (
                      <span className="text-xs font-black text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                        {instStats.percentileStr}
                      </span>
                    )}
                  </div>
                  <div className="text-base sm:text-lg font-black text-white">{instStats.displayRank}</div>
                  <div className="space-y-1">
                    <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-white/5">
                      <div 
                        className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${instStats.fillPercentage}%` }} 
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-500 font-semibold">
                      <span>1. Sıra</span>
                      <span>{instStats.totalNum ? `${instStats.totalNum} Kişi` : 'Son Sıra'}</span>
                    </div>
                  </div>
                </div>

                {/* İl / Genel Derecesi */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold text-amber-400 uppercase tracking-wider">İl / Genel Derecesi</span>
                    {genStats.percentileVal > 0 && (
                      <span className="text-xs font-black text-amber-300 bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 rounded-md">
                        {genStats.percentileStr}
                      </span>
                    )}
                  </div>
                  <div className="text-base sm:text-lg font-black text-white">{genStats.displayRank}</div>
                  <div className="space-y-1">
                    <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-white/5">
                      <div 
                        className="bg-gradient-to-r from-amber-500 to-amber-400 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${genStats.fillPercentage}%` }} 
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-500 font-semibold">
                      <span>1. Sıra</span>
                      <span>{genStats.totalNum ? `${genStats.totalNum.toLocaleString('tr-TR')} Kişi` : 'Son Sıra'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Subject Net Summary Table */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
            <BarChart2 className="w-4 h-4 text-indigo-400" />
            <span>Ders Netleri & Karşılaştırmalı Ortalama Analizi</span>
          </h3>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-bold text-[10px] sm:text-xs">
                  <th className="p-4">Ders Adı</th>
                  <th className="p-4 text-center">Doğru</th>
                  <th className="p-4 text-center">Yanlış</th>
                  <th className="p-4 text-center">Net Skor</th>
                  <th className="p-4 text-center">Sınıf Ort.</th>
                  <th className="p-4 text-center">Okul Ort.</th>
                  <th className="p-4 text-center">Başarı Oranı</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/60 text-slate-300">
                {selectedInstitutionalExam.subjects.map((sub, sIdx) => {
                  return (
                    <tr key={sIdx} className="hover:bg-white/5 transition-colors">
                      <td className="p-4 font-extrabold text-white">{sub.subjectName}</td>
                      <td className="p-4 text-center text-emerald-400 font-bold">{sub.correct}</td>
                      <td className="p-4 text-center text-rose-400 font-bold">{sub.wrong}</td>
                      <td className="p-4 text-center font-black text-indigo-300">{sub.net}</td>
                      <td className="p-4 text-center text-slate-400 font-mono font-bold">{sub.classAvgNet !== undefined ? sub.classAvgNet : '-'}</td>
                      <td className="p-4 text-center text-slate-400 font-mono font-bold">{sub.institutionAvgNet !== undefined ? sub.institutionAvgNet : '-'}</td>
                      <td className="p-4 text-center">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold ${
                          sub.successRate >= 70
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : sub.successRate >= 45
                              ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          %{sub.successRate}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Subject Topic Level Breakdown Section */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
            <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
            <span>Konu & Kazanım Seviyesinde Detaylı Rapor</span>
            <span className="text-[10px] text-slate-400 font-normal lowercase tracking-normal font-sans">
              (Geçmiş analizi görmek için kazanım adına tıklayın)
            </span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {selectedInstitutionalExam.subjects.filter(s => s.topics && s.topics.length > 0).map((sub, sIdx) => (
              <div key={sIdx} className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden flex flex-col h-full">
                <div className="bg-slate-900 px-4 py-3 border-b border-slate-800/60 flex items-center justify-between">
                  <span className="text-xs font-extrabold text-white">{sub.subjectName} Konu Dağılımları</span>
                  <span className="text-[10px] text-indigo-300 font-bold bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                    {sub.topics.length} Kazanım
                  </span>
                </div>
                <div className="p-4 divide-y divide-slate-900/60 space-y-1">
                  {sub.topics.map((top, tIdx) => (
                    <div key={tIdx} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => setSelectedTopicHistory({ subjectName: sub.subjectName, topicName: top.topicName })}
                        className="text-slate-300 font-semibold hover:text-indigo-300 hover:underline text-left flex items-center space-x-1.5 group cursor-pointer"
                        title="Bu kazanımın geçmiş denemelerdeki performansını gör"
                      >
                        <span>{top.topicName}</span>
                        <History className="w-3.5 h-3.5 text-indigo-400 opacity-60 group-hover:opacity-100 transition-opacity" />
                      </button>
                      <div className="flex items-center space-x-3 shrink-0 self-end sm:self-center">
                        <span className="text-[11px] text-slate-400 font-mono font-medium">
                          D: <strong className="text-emerald-400 font-bold">{top.correct}</strong> | Y: <strong className="text-rose-400 font-bold">{top.wrong}</strong> | B: <strong className="text-slate-500 font-bold">{top.empty}</strong>
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                          top.successRate >= 70
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : top.successRate >= 45
                              ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          %{top.successRate} Başarı
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer advice */}
        <div className="bg-indigo-500/5 border border-indigo-500/20 p-5 rounded-2xl flex items-start space-x-3.5">
          <Sparkles className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-white">Yapay Zeka Rehberlik Önerisi</h4>
            <p className="text-xs text-indigo-200 mt-1 leading-relaxed font-medium">
              Bu karnedeki düşük başarı oranına sahip (<span className="text-rose-400 font-semibold">%45'in altındaki</span>) konuları öncelikli hata listenize ekleyerek yapay zeka destekli çalışma programınızı güncelleyebilirsiniz. Detaylı analizlerinizi tamamlamak için sol menüdeki "Hata Defteri" sekmesini de aktif kullanmanız önerilir.
            </p>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={() => setSelectedInstitutionalExam(null)}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-extrabold text-xs px-6 py-3 rounded-xl transition-all cursor-pointer border border-slate-700"
          >
            Kapat ve Listeye Dön
          </button>
        </div>
      </div>
    </div>
  );
};

