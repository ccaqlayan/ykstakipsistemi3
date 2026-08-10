import React from 'react';
import { Target, BarChart2, ArrowUpRight, ChevronUp, ChevronDown, FileText, AlertCircle } from 'lucide-react';
import { PaginationControls } from './PaginationControls';
import { getSubjectGeneralMockSummary, errorReasonLabels } from './SubjectTypes';

interface SubjectMocksTabProps {
  activeDetailData: any;
  mockTypeTab: 'all' | 'branch' | 'general';
  setMockTypeTab: (tab: 'all' | 'branch' | 'general') => void;
  mockPage: number;
  setMockPage: (p: number) => void;
  generalMockPage: number;
  setGeneralMockPage: (p: number) => void;
  expandedMockIds: Record<string, boolean>;
  setExpandedMockIds: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  onNavigateTab?: (tab: string, opts?: any) => void;
}

export const SubjectMocksTab: React.FC<SubjectMocksTabProps> = ({
  activeDetailData,
  mockTypeTab,
  setMockTypeTab,
  mockPage,
  setMockPage,
  generalMockPage,
  setGeneralMockPage,
  expandedMockIds,
  setExpandedMockIds,
  onNavigateTab,
}) => {
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-5 shadow-2xl">
      {/* Header & Sub-Tab Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <Target className="w-5 h-5 text-amber-400" />
            <span>Deneme Sınavları & Net Performansı</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Bu derse özel branş denemeleri ve genel deneme sınavı soru dökümleri
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Toggle Pills */}
          <div className="bg-slate-950 p-1 rounded-2xl border border-slate-800 flex items-center gap-1 text-xs">
            <button
              onClick={() => setMockTypeTab('all')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                mockTypeTab === 'all'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Tümü ({activeDetailData.branchExamCount + activeDetailData.generalExamCount})
            </button>

            <button
              onClick={() => setMockTypeTab('branch')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                mockTypeTab === 'branch'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Branş ({activeDetailData.branchExamCount})
            </button>

            <button
              onClick={() => setMockTypeTab('general')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                mockTypeTab === 'general'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Genel Denemeler ({activeDetailData.generalExamCount})
            </button>
          </div>

          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('branches')}
              className="text-xs bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 px-3 py-2 rounded-xl font-semibold flex items-center space-x-1.5 transition-all cursor-pointer"
              title="Denemeler Sekmesine Git"
            >
              <span>Denemeler Modülü</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* SECTION 1: BRANŞ DENEMELERİ */}
      {(mockTypeTab === 'all' || mockTypeTab === 'branch') && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase text-amber-400 tracking-wider flex items-center space-x-1.5">
              <Target className="w-4 h-4" />
              <span>Branş Denemesi Kayıtları ({activeDetailData.matchedBranchExams.length})</span>
            </h4>
          </div>

          {activeDetailData.matchedBranchExams.length > 0 ? (
            (() => {
              const examsPerPage = 5;
              const totalExamPages = Math.ceil(activeDetailData.matchedBranchExams.length / examsPerPage);
              const paginatedExams = activeDetailData.matchedBranchExams.slice((mockPage - 1) * examsPerPage, mockPage * examsPerPage);

              return (
                <>
                  <div className="overflow-x-auto rounded-2xl border border-slate-800">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold">
                        <tr>
                          <th className="p-3">Tarih</th>
                          <th className="p-3">Yayın</th>
                          <th className="p-3">Süre</th>
                          <th className="p-3">Doğru</th>
                          <th className="p-3">Yanlış</th>
                          <th className="p-3">Boş</th>
                          <th className="p-3">Net</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850 bg-slate-950/40">
                        {paginatedExams.map((exam: any) => (
                          <tr key={exam.id} className="hover:bg-slate-900/60 transition-colors">
                            <td className="p-3 font-semibold text-white">{exam.date}</td>
                            <td className="p-3 text-amber-300 font-medium">{exam.publisher}</td>
                            <td className="p-3 font-mono text-slate-400">{exam.durationMinutes || 0} dk</td>
                            <td className="p-3 font-mono text-emerald-400 font-bold">{exam.correct}</td>
                            <td className="p-3 font-mono text-rose-400 font-bold">{exam.wrong}</td>
                            <td className="p-3 font-mono text-amber-400 font-bold">{exam.empty}</td>
                            <td className="p-3 font-mono text-amber-400 font-black">{exam.net} Net</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {totalExamPages > 1 && (
                    <PaginationControls
                      currentPage={mockPage}
                      totalPages={totalExamPages}
                      onPageChange={setMockPage}
                    />
                  )}
                </>
              );
            })()
          ) : (
            <div className="text-center py-6 bg-slate-950/50 rounded-2xl border border-slate-850 text-xs text-slate-400 italic">
              Bu ders için henüz branş denemesi kaydedilmedi.
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: GENEL DENEMELER */}
      {(mockTypeTab === 'all' || mockTypeTab === 'general') && (
        <div className="space-y-4 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <h4 className="text-xs font-black uppercase text-indigo-400 tracking-wider flex items-center space-x-1.5">
              <BarChart2 className="w-4 h-4" />
              <span>Genel Deneme Sınavları ({activeDetailData.matchedGeneralMocks.length})</span>
            </h4>
            <span className="text-[11px] text-slate-400">
              Genel deneme kartındaki "Soru Detayları" ile o derse ait soru ve konu analizini inceleyin
            </span>
          </div>

          {activeDetailData.matchedGeneralMocks.length > 0 ? (
            (() => {
              const generalMocksPerPage = 5;
              const totalGeneralPages = Math.ceil(activeDetailData.matchedGeneralMocks.length / generalMocksPerPage);
              const paginatedGeneralMocks = activeDetailData.matchedGeneralMocks.slice((generalMockPage - 1) * generalMocksPerPage, generalMockPage * generalMocksPerPage);

              return (
                <>
                  <div className="space-y-3">
                    {paginatedGeneralMocks.map((mock: any) => {
                      const summary = getSubjectGeneralMockSummary(
                        mock, 
                        activeDetailData.category, 
                        activeDetailData.matchedLogs, 
                        activeDetailData.matchedErrors
                      );

                      const isExpanded = Boolean(expandedMockIds[mock.id]);

                      return (
                        <div 
                          key={mock.id} 
                          className="bg-slate-950/80 border border-slate-800 hover:border-indigo-500/40 rounded-2xl p-4 transition-all space-y-3"
                        >
                          {/* Card Header */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-black text-xs shrink-0">
                                TG
                              </div>
                              <div>
                                <div className="flex items-center space-x-2 flex-wrap">
                                  <h5 className="text-sm font-bold text-white">{mock.title}</h5>
                                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                                    {mock.date}
                                  </span>
                                  {mock.estimatedRank && (
                                    <span className="text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2 py-0.5 rounded font-bold font-mono">
                                      Sıralama: #{mock.estimatedRank}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-400 mt-0.5">
                                  {summary.subjectLabel} • Genel Toplam Net: <strong className="text-indigo-300 font-mono">TYT: {mock.tyt?.totalNet || 0}</strong> | <strong className="text-purple-300 font-mono">AYT: {mock.ayt?.totalNet || 0}</strong>
                                </p>
                              </div>
                            </div>

                            {/* Subject Net Highlight Pills */}
                            <div className="flex items-center gap-2 self-start sm:self-center">
                              {summary.tytNet !== null && (
                                <div className="bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-xl text-center">
                                  <span className="text-[9px] uppercase font-bold text-indigo-400 block">{summary.tytLabel}</span>
                                  <span className="text-xs font-black font-mono text-indigo-300">{summary.tytNet} Net</span>
                                </div>
                              )}

                              {summary.aytNet !== null && (
                                <div className="bg-purple-500/10 border border-purple-500/20 px-3 py-1.5 rounded-xl text-center">
                                  <span className="text-[9px] uppercase font-bold text-purple-400 block">{summary.aytLabel}</span>
                                  <span className="text-xs font-black font-mono text-purple-300">{summary.aytNet} Net</span>
                                </div>
                              )}

                              <button
                                onClick={() => setExpandedMockIds(prev => ({ ...prev, [mock.id]: !prev[mock.id] }))}
                                className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1 transition-all cursor-pointer ml-1"
                              >
                                <span className="text-[11px]">
                                  {isExpanded ? 'Gizle' : 'Deneme Detayları'}
                                </span>
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>

                          {/* Expandable Details */}
                          {isExpanded && (
                            <div className="pt-3 border-t border-slate-850 space-y-3">
                              {/* Full Exam Net Breakdown Table */}
                              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-3">
                                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                                  <span className="text-xs font-black text-indigo-300 uppercase tracking-wider flex items-center space-x-1.5">
                                    <BarChart2 className="w-4 h-4 text-indigo-400" />
                                    <span>Sınav Genel Net Dağılımı (Tüm Testler)</span>
                                  </span>
                                  <span className="text-[11px] font-mono text-slate-400 font-bold">
                                    Genel Toplam: <strong className="text-indigo-300">{(mock.tyt?.totalNet || 0) + (mock.ayt?.totalNet || 0)} Net</strong>
                                  </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                                  {/* TYT Breakdown */}
                                  <div className="bg-slate-900/80 p-3 rounded-xl border border-indigo-500/20 space-y-2">
                                    <div className="flex justify-between items-center pb-1 border-b border-slate-800">
                                      <span className="font-extrabold text-indigo-300 text-xs">TYT Netleri</span>
                                      <span className="font-mono font-black text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded text-[11px]">
                                        Toplam: {mock.tyt?.totalNet || 0} Net
                                      </span>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-center text-[11px]">
                                      <div className="bg-slate-950 p-1.5 rounded-lg border border-slate-800">
                                        <span className="text-[9px] text-slate-400 block font-sans">Türkçe</span>
                                        <span className="font-bold text-white">{mock.tyt?.turkce ?? 0}</span>
                                      </div>
                                      <div className="bg-slate-950 p-1.5 rounded-lg border border-slate-800">
                                        <span className="text-[9px] text-slate-400 block font-sans">Sosyal</span>
                                        <span className="font-bold text-white">{mock.tyt?.sosyal ?? 0}</span>
                                      </div>
                                      <div className="bg-slate-950 p-1.5 rounded-lg border border-slate-800">
                                        <span className="text-[9px] text-slate-400 block font-sans">Matematik</span>
                                        <span className="font-bold text-white">{mock.tyt?.mat ?? 0}</span>
                                      </div>
                                      <div className="bg-slate-950 p-1.5 rounded-lg border border-slate-800">
                                        <span className="text-[9px] text-slate-400 block font-sans">Fen</span>
                                        <span className="font-bold text-white">{mock.tyt?.fen ?? 0}</span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* AYT Breakdown */}
                                  <div className="bg-slate-900/80 p-3 rounded-xl border border-purple-500/20 space-y-2">
                                    <div className="flex justify-between items-center pb-1 border-b border-slate-800">
                                      <span className="font-extrabold text-purple-300 text-xs">AYT Netleri</span>
                                      <span className="font-mono font-black text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded text-[11px]">
                                        Toplam: {mock.ayt?.totalNet || 0} Net
                                      </span>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-center text-[11px]">
                                      <div className="bg-slate-950 p-1.5 rounded-lg border border-slate-800">
                                        <span className="text-[9px] text-slate-400 block font-sans">Matematik</span>
                                        <span className="font-bold text-white">{mock.ayt?.mat ?? 0}</span>
                                      </div>
                                      <div className="bg-slate-950 p-1.5 rounded-lg border border-slate-800">
                                        <span className="text-[9px] text-slate-400 block font-sans">Fen</span>
                                        <span className="font-bold text-white">{mock.ayt?.fen ?? 0}</span>
                                      </div>
                                      <div className="bg-slate-950 p-1.5 rounded-lg border border-slate-800">
                                        <span className="text-[9px] text-slate-400 block font-sans">Ed.-Sos1</span>
                                        <span className="font-bold text-white">{mock.ayt?.edebiyatSos1 ?? 0}</span>
                                      </div>
                                      <div className="bg-slate-950 p-1.5 rounded-lg border border-slate-800">
                                        <span className="text-[9px] text-slate-400 block font-sans">Sosyal-2</span>
                                        <span className="font-bold text-white">{mock.ayt?.sos2 ?? 0}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Subject Specific Analysis */}
                              <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-white flex items-center space-x-1.5">
                                    <FileText className="w-4 h-4 text-indigo-400" />
                                    <span>{activeDetailData.category.title} - Soru ve Konu Analizi</span>
                                  </span>
                                  {summary.totalQuestionsFromLogs > 0 && (
                                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded font-bold">
                                      {summary.totalQuestionsFromLogs} Soru Detayı Kayıtlı
                                    </span>
                                  )}
                                </div>

                                {/* Question Log Entries for this mock */}
                                {summary.matchingLogs.length > 0 ? (
                                  <div className="space-y-2">
                                    {summary.matchingLogs.map((log: any) => (
                                      <div key={log.id} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                                        <div>
                                          <span className="font-bold text-white">{log.subject}</span>
                                          {log.notes && (
                                            <p className="text-[11px] text-slate-400 mt-0.5 italic">"{log.notes}"</p>
                                          )}
                                        </div>
                                        <div className="flex items-center space-x-3 font-mono text-xs">
                                          <span className="text-slate-300">Soru: <strong>{log.solvedCount}</strong></span>
                                          <span className="text-emerald-400">Doğru: <strong>{log.correctCount}</strong></span>
                                          <span className="text-rose-400">Yanlış: <strong>{log.wrongCount}</strong></span>
                                          <span className="text-amber-400">Boş: <strong>{log.emptyCount}</strong></span>
                                          <span className="text-indigo-300 font-black bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20">
                                            {log.netScore} Net
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-xs text-slate-300 bg-slate-950 p-3 rounded-xl border border-slate-850">
                                    <span>
                                      Bu genel deneme sınavında {activeDetailData.category.title} dersi net skorları: 
                                      <strong className="text-indigo-300 font-mono ml-1.5">
                                        {summary.tytNet !== null ? `${summary.tytLabel}: ${summary.tytNet} Net` : ''} 
                                        {summary.aytNet !== null ? ` | ${summary.aytLabel}: ${summary.aytNet} Net` : ''}
                                      </strong>
                                    </span>
                                  </div>
                                )}

                                {/* Matching Topic Errors */}
                                {summary.matchingErrors.length > 0 && (
                                  <div className="pt-2 border-t border-slate-800 space-y-2">
                                    <span className="text-xs font-bold text-purple-300 flex items-center space-x-1.5">
                                      <AlertCircle className="w-4 h-4 text-purple-400" />
                                      <span>Bu Denemeden Kaydedilen Hata Defteri Soru Detayları ({summary.matchingErrors.length}):</span>
                                    </span>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                      {summary.matchingErrors.map((err: any) => (
                                        <div key={err.id} className="bg-slate-950 p-2.5 rounded-xl border border-purple-500/20 text-xs space-y-1">
                                          <div className="flex justify-between items-center">
                                            <span className="font-bold text-white">{err.topicName || err.subject}</span>
                                            <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded font-semibold">
                                              {errorReasonLabels[err.errorReason] || err.errorReason}
                                            </span>
                                          </div>
                                          {err.solutionNotes && (
                                            <p className="text-[11px] text-slate-400 italic">Çözüm Notu: {err.solutionNotes}</p>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {mock.notes && (
                                  <p className="text-[11px] text-slate-400 bg-slate-950/60 p-2.5 rounded-xl border border-slate-850 italic">
                                    Genel Deneme Notu: {mock.notes}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {totalGeneralPages > 1 && (
                    <PaginationControls
                      currentPage={generalMockPage}
                      totalPages={totalGeneralPages}
                      onPageChange={setGeneralMockPage}
                    />
                  )}
                </>
              );
            })()
          ) : (
            <div className="text-center py-6 bg-slate-950/50 rounded-2xl border border-slate-850 text-xs text-slate-400 italic">
              Henüz kaydedilmiş genel deneme bulunmuyor.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
