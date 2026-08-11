import React from 'react';
import { Activity } from 'lucide-react';
import { ApiUsageLog, UsageStatsResponse } from '../SystemTypes';

interface AiAuditLogsTabProps {
  stats: UsageStatsResponse | null;
  filterCategory: 'ALL' | 'AI_COACH' | 'QUESTION_ANALYSIS';
  setFilterCategory: (cat: 'ALL' | 'AI_COACH' | 'QUESTION_ANALYSIS') => void;
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  itemsPerPage: number;
}

export const AiAuditLogsTab: React.FC<AiAuditLogsTabProps> = ({
  stats,
  filterCategory,
  setFilterCategory,
  currentPage,
  setCurrentPage,
  itemsPerPage
}) => {
  const filteredLogs = (stats?.recentLogs || []).filter(log => {
    if (filterCategory === 'ALL') return true;
    return log.category === filterCategory;
  });

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentLogs = filteredLogs.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-5 shadow-xl backdrop-blur-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-white text-base">Son Yapay Zeka İstek & Ayak İzi Günlüğü</h3>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => { setFilterCategory('ALL'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterCategory === 'ALL'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30'
                  : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              Tüm İstekler ({stats?.recentLogs.length || 0})
            </button>
            <button
              onClick={() => { setFilterCategory('AI_COACH'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterCategory === 'AI_COACH'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30'
                  : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              Yapay Zeka Koçu
            </button>
            <button
              onClick={() => { setFilterCategory('QUESTION_ANALYSIS'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterCategory === 'QUESTION_ANALYSIS'
                  ? 'bg-fuchsia-600 text-white shadow-md shadow-fuchsia-500/30'
                  : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              Soru Analizi & Hata Defteri
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="pb-2">Tarih / Saat</th>
                <th className="pb-2">Özellik / Süreç</th>
                <th className="pb-2">Kullanılan Model</th>
                <th className="pb-2 text-right">Girdi / Çıktı Token</th>
                <th className="pb-2 text-right">Toplam Token</th>
                <th className="pb-2 text-right">Tahmini Tutar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-medium">
              {currentLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 italic">
                    Henüz seçilen kategoride kaydedilmiş bir işlem bulunmuyor.
                  </td>
                </tr>
              ) : (
                currentLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-2.5 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString('tr-TR', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="py-2.5 font-semibold text-white">
                      {log.featureName}
                    </td>
                    <td className="py-2.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        log.modelUsed.includes('lite')
                          ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                          : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'
                      }`}>
                        {log.modelUsed}
                      </span>
                    </td>
                    <td className="py-2.5 text-right font-mono text-slate-400 text-[11px]">
                      {log.promptTokens} in / {log.candidatesTokens} out
                    </td>
                    <td className="py-2.5 text-right font-mono font-bold text-white">
                      {log.totalTokens.toLocaleString('tr-TR')}
                    </td>
                    <td className="py-2.5 text-right font-bold text-emerald-400 font-mono">
                      ₺{log.estimatedCostTRY.toFixed(4)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-white/5 mt-4 text-xs gap-3">
            <span className="text-slate-400 text-center sm:text-left">
              Toplam <span className="font-bold text-white">{filteredLogs.length}</span> istekten <span className="font-bold text-white">{indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredLogs.length)}</span> arası gösteriliyor
            </span>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-slate-950 disabled:cursor-not-allowed font-semibold transition-all cursor-pointer"
              >
                Önceki
              </button>
              {Array.from({ length: totalPages }).map((_, i) => {
                const pageNum = i + 1;
                if (totalPages > 5 && Math.abs(currentPage - pageNum) > 1 && pageNum !== 1 && pageNum !== totalPages) {
                  if (pageNum === 2 || pageNum === totalPages - 1) {
                    return <span key={pageNum} className="text-slate-500 px-1 select-none">...</span>;
                  }
                  return null;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 rounded-lg font-bold transition-all text-xs cursor-pointer ${
                      currentPage === pageNum
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20 border border-indigo-500/30'
                        : 'bg-slate-950 border border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-slate-950 disabled:cursor-not-allowed font-semibold transition-all cursor-pointer"
              >
                Sonraki
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
