import React from 'react';
import { ArrowLeft, GraduationCap, SlidersHorizontal, Award, TrendingUp, BarChart2, Sparkles } from 'lucide-react';
import { InstitutionalMockExam } from '../../types';

interface MockInstitutionalDetailViewProps {
  selectedInstitutionalExam: InstitutionalMockExam | null;
  setSelectedInstitutionalExam: (exam: InstitutionalMockExam | null) => void;
}

export const MockInstitutionalDetailView: React.FC<MockInstitutionalDetailViewProps> = ({
  selectedInstitutionalExam,
  setSelectedInstitutionalExam
}) => {
  if (!selectedInstitutionalExam) return null;

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
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

        {/* Student & Overall Rank Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

          {/* Display primary score and ranks */}
          {(() => {
            // Determine best score
            let bestScoreType = 'SAY';
            let bestScore = selectedInstitutionalExam.scores.sayScore || 0;
            let classRank = selectedInstitutionalExam.scores.sayClassRank;
            let instRank = selectedInstitutionalExam.scores.sayInstitutionRank;
            let genRank = selectedInstitutionalExam.scores.sayGeneralRank;

            if ((selectedInstitutionalExam.scores.eaScore || 0) > bestScore) {
              bestScoreType = 'EA';
              bestScore = selectedInstitutionalExam.scores.eaScore || 0;
              classRank = selectedInstitutionalExam.scores.eaClassRank;
              instRank = selectedInstitutionalExam.scores.eaInstitutionRank;
              genRank = selectedInstitutionalExam.scores.eaGeneralRank;
            }
            if ((selectedInstitutionalExam.scores.sozScore || 0) > bestScore) {
              bestScoreType = 'SÖZ';
              bestScore = selectedInstitutionalExam.scores.sozScore || 0;
              classRank = selectedInstitutionalExam.scores.sozClassRank;
              instRank = selectedInstitutionalExam.scores.sozInstitutionRank;
              genRank = selectedInstitutionalExam.scores.sozGeneralRank;
            }

            if (bestScore === 0 && selectedInstitutionalExam.scores.sayScore !== undefined) {
              bestScoreType = 'SAY';
              bestScore = selectedInstitutionalExam.scores.sayScore;
              classRank = selectedInstitutionalExam.scores.sayClassRank;
              instRank = selectedInstitutionalExam.scores.sayInstitutionRank;
              genRank = selectedInstitutionalExam.scores.sayGeneralRank;
            }

            return (
              <>
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

                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex items-center space-x-3.5">
                  <div className="bg-amber-500/10 p-2.5 rounded-xl text-amber-400 shrink-0">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Genel & Sınıf Derecesi</span>
                    <div className="text-sm font-extrabold text-white mt-0.5">
                      {classRank ? `Sınıf: ${classRank}.` : 'Derece Yok'}
                    </div>
                    <div className="text-xs text-slate-400 font-medium">
                      {instRank ? `Okul: ${instRank}.` : ''} {genRank ? `| İl/Genel: ${genRank}.` : ''}
                    </div>
                  </div>
                </div>
              </>
            );
          })()}
        </div>

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

        {/* Subject Topic Level Breakdown Section (Fully scrollable) */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
            <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
            <span>Konu & Kazanım Seviyesinde Detaylı Rapor</span>
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
                      <span className="text-slate-300 font-semibold">{top.topicName}</span>
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
