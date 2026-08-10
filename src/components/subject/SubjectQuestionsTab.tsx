import React from 'react';
import { BarChart2, ArrowUpRight } from 'lucide-react';
import { PaginationControls } from './PaginationControls';

interface SubjectQuestionsTabProps {
  activeDetailData: any;
  questionPage: number;
  setQuestionPage: (p: number) => void;
  onNavigateTab?: (tab: string, opts?: any) => void;
}

export const SubjectQuestionsTab: React.FC<SubjectQuestionsTabProps> = ({
  activeDetailData,
  questionPage,
  setQuestionPage,
  onNavigateTab,
}) => {
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-5 shadow-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <BarChart2 className="w-5 h-5 text-emerald-400" />
            <span>Soru Çözüm Analizi ve Kayıtlar</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Bu derste girilen soru çözümleri ve doğruluk performansı
          </p>
        </div>
        {onNavigateTab && (
          <button
            onClick={() => onNavigateTab('questions')}
            className="text-xs bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 px-3 py-1.5 rounded-xl font-semibold flex items-center space-x-1.5 transition-all cursor-pointer"
          >
            <span>Soru Girişi Yap</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Accuracy KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-850 text-center">
          <div className="text-[10px] text-slate-400 font-bold uppercase">Toplam Soru</div>
          <div className="text-xl font-black text-white font-mono mt-1">{activeDetailData.totalSolvedQuestions}</div>
        </div>

        <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-850 text-center">
          <div className="text-[10px] text-slate-400 font-bold uppercase">Doğru</div>
          <div className="text-xl font-black text-emerald-400 font-mono mt-1">{activeDetailData.totalCorrectQuestions}</div>
        </div>

        <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-850 text-center">
          <div className="text-[10px] text-slate-400 font-bold uppercase">Yanlış</div>
          <div className="text-xl font-black text-rose-400 font-mono mt-1">{activeDetailData.totalWrongQuestions}</div>
        </div>

        <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-850 text-center">
          <div className="text-[10px] text-slate-400 font-bold uppercase">Boş</div>
          <div className="text-xl font-black text-amber-400 font-mono mt-1">{activeDetailData.totalEmptyQuestions}</div>
        </div>
      </div>

      {/* Recent Question Logs Table */}
      {activeDetailData.matchedLogs.length > 0 ? (
        (() => {
          const logsPerPage = 8;
          const totalLogPages = Math.ceil(activeDetailData.matchedLogs.length / logsPerPage);
          const paginatedLogs = activeDetailData.matchedLogs.slice((questionPage - 1) * logsPerPage, questionPage * logsPerPage);

          return (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold">
                    <tr>
                      <th className="p-3 rounded-l-xl">Tarih</th>
                      <th className="p-3">Sınav Tipi</th>
                      <th className="p-3">Çözülen</th>
                      <th className="p-3">Doğru</th>
                      <th className="p-3">Yanlış</th>
                      <th className="p-3">Boş</th>
                      <th className="p-3 rounded-r-xl">Net</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {paginatedLogs.map((log: any) => (
                      <tr key={log.id} className="hover:bg-slate-950/40 transition-colors">
                        <td className="p-3 font-semibold text-white">{log.date}</td>
                        <td className="p-3">
                          <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[10px] font-bold">
                            {log.examType}
                          </span>
                        </td>
                        <td className="p-3 font-mono font-bold text-white">{log.solvedCount}</td>
                        <td className="p-3 font-mono text-emerald-400 font-bold">{log.correctCount}</td>
                        <td className="p-3 font-mono text-rose-400 font-bold">{log.wrongCount}</td>
                        <td className="p-3 font-mono text-amber-400 font-bold">{log.emptyCount}</td>
                        <td className="p-3 font-mono text-indigo-400 font-extrabold">{log.netScore} Net</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <PaginationControls
                currentPage={questionPage}
                totalPages={totalLogPages}
                onPageChange={setQuestionPage}
              />
            </>
          );
        })()
      ) : (
        <div className="text-center py-8 bg-slate-950/50 rounded-2xl border border-slate-850 text-xs text-slate-400 italic">
          Bu ders için henüz soru çözümü kaydedilmedi.
        </div>
      )}
    </div>
  );
};
