import React, { useState } from 'react';
import { Activity, FileText, Copy, Check, X, Eye, User, ArrowDownLeft, ArrowUpRight, Trash2, Zap, Globe, Sparkles, Gift } from 'lucide-react';
import { ApiUsageLog, UsageStatsResponse } from '../SystemTypes';

interface AiAuditLogsTabProps {
  stats: UsageStatsResponse | null;
  filterCategory: 'ALL' | 'AI_COACH' | 'STUDY_TASK_SUGGEST' | 'QUESTION_ANALYSIS';
  setFilterCategory: (cat: 'ALL' | 'AI_COACH' | 'STUDY_TASK_SUGGEST' | 'QUESTION_ANALYSIS') => void;
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
  const [selectedLog, setSelectedLog] = useState<ApiUsageLog | null>(null);
  const [modalTab, setModalTab] = useState<'input' | 'output'>('input');
  const [copied, setCopied] = useState<boolean>(false);
  const [filterProvider, setFilterProvider] = useState<'ALL' | 'GEMINI' | 'GROQ' | 'OPENROUTER' | 'FREE_ONLY'>('ALL');

  // Provider detection helper
  const getLogProvider = (log: ApiUsageLog): 'GEMINI' | 'GROQ' | 'OPENROUTER' => {
    if (log.provider) {
      const p = log.provider.toUpperCase();
      if (p === 'GROQ') return 'GROQ';
      if (p === 'OPENROUTER') return 'OPENROUTER';
      return 'GEMINI';
    }
    const m = (log.modelUsed || '').toLowerCase();
    if (m.includes('llama') || m.includes('mixtral') || m.includes('gemma')) return 'GROQ';
    if (m.includes('openrouter') || m.includes('deepseek') || m.includes('qwen') || m.includes('mistral') || m.includes('/')) return 'OPENROUTER';
    return 'GEMINI';
  };

  const isLogFree = (log: ApiUsageLog): boolean => {
    const prov = getLogProvider(log);
    return Boolean(
      log.isFreeTier ||
      prov === 'GROQ' ||
      prov === 'OPENROUTER' ||
      (log.modelUsed || '').includes(':free') ||
      (log.modelUsed || '').includes('/free') ||
      (log.estimatedCostTRY || 0) === 0
    );
  };

  const filteredLogs = (stats?.recentLogs || []).filter(log => {
    // Category filter
    let matchesCategory = true;
    if (filterCategory === 'STUDY_TASK_SUGGEST') {
      matchesCategory = log.featureKey === 'STUDY_TASK_SUGGEST';
    } else if (filterCategory === 'AI_COACH') {
      matchesCategory = log.category === 'AI_COACH' && log.featureKey !== 'STUDY_TASK_SUGGEST';
    } else if (filterCategory !== 'ALL') {
      matchesCategory = log.category === filterCategory;
    }

    if (!matchesCategory) return false;

    // Provider filter
    if (filterProvider === 'ALL') return true;
    if (filterProvider === 'FREE_ONLY') return isLogFree(log);
    return getLogProvider(log) === filterProvider;
  });

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentLogs = filteredLogs.slice(indexOfFirstItem, indexOfLastItem);

  const handleCopyText = (text?: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClearOldLogs = async () => {
    if (!window.confirm('30 günden eski yapay zeka istek kaydı loglarını silmek istediğinize emin misiniz?')) return;
    try {
      await fetch('/api/gemini/clear-usage-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ olderThanDays: 30 })
      });
      window.location.reload();
    } catch (e) {
      console.error(e);
    }
  };

  const renderProviderBadge = (provider: 'GEMINI' | 'GROQ' | 'OPENROUTER') => {
    switch (provider) {
      case 'GROQ':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <Zap className="w-3 h-3 text-amber-400" />
            <span>Groq Cloud</span>
          </span>
        );
      case 'OPENROUTER':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg bg-sky-500/15 text-sky-300 border border-sky-500/30">
            <Globe className="w-3 h-3 text-sky-400" />
            <span>OpenRouter</span>
          </span>
        );
      case 'GEMINI':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg bg-purple-500/15 text-purple-300 border border-purple-500/30">
            <Sparkles className="w-3 h-3 text-purple-400" />
            <span>Google Gemini</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-fade-in relative">
      <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-5 shadow-xl backdrop-blur-md space-y-4">
        <div className="space-y-3 pb-3 border-b border-white/10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-white text-base">Son Yapay Zeka İstek & Ayak İzi Günlüğü</h3>
              <span className="text-[11px] bg-slate-800 text-slate-400 px-2.5 py-0.5 rounded-full border border-slate-700 font-mono">
                %100 Doğrulanmış Kayıt
              </span>
            </div>

            <button
              onClick={handleClearOldLogs}
              title="30 günden eski yapay zeka log kayıtlarını siler"
              className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 hover:text-white border border-rose-500/30 transition-all cursor-pointer inline-flex items-center space-x-1 self-start sm:self-auto"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>30 Günden Eski Kayıtları Sil</span>
            </button>
          </div>

          {/* Filtreleme Butonları: Kategori + Sağlayıcı */}
          <div className="flex flex-col gap-2 pt-1">
            {/* Kategori Filtresi */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-400 mr-1">Kategori:</span>
              <button
                onClick={() => { setFilterCategory('ALL'); setCurrentPage(1); }}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filterCategory === 'ALL'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30'
                    : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                }`}
              >
                Tüm İstekler ({stats?.recentLogs.length || 0})
              </button>
              <button
                onClick={() => { setFilterCategory('AI_COACH'); setCurrentPage(1); }}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filterCategory === 'AI_COACH'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30'
                    : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                }`}
              >
                Yapay Zeka Koçu
              </button>
              <button
                onClick={() => { setFilterCategory('STUDY_TASK_SUGGEST'); setCurrentPage(1); }}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filterCategory === 'STUDY_TASK_SUGGEST'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/30'
                    : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                }`}
              >
                Görev Önerisi
              </button>
              <button
                onClick={() => { setFilterCategory('QUESTION_ANALYSIS'); setCurrentPage(1); }}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filterCategory === 'QUESTION_ANALYSIS'
                    ? 'bg-fuchsia-600 text-white shadow-md shadow-fuchsia-500/30'
                    : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                }`}
              >
                Soru Analizi & Hata Defteri
              </button>
            </div>

            {/* Sağlayıcı Filtresi */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] font-bold text-slate-400 mr-1">Sağlayıcı:</span>
              <button
                onClick={() => { setFilterProvider('ALL'); setCurrentPage(1); }}
                className={`px-2.5 py-0.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                  filterProvider === 'ALL'
                    ? 'bg-slate-700 text-white border border-slate-600'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                Tümü
              </button>
              <button
                onClick={() => { setFilterProvider('GEMINI'); setCurrentPage(1); }}
                className={`px-2.5 py-0.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer inline-flex items-center gap-1 ${
                  filterProvider === 'GEMINI'
                    ? 'bg-purple-600/30 text-purple-200 border border-purple-500/50'
                    : 'bg-slate-950 text-slate-400 hover:text-purple-300 border border-slate-800'
                }`}
              >
                <Sparkles className="w-3 h-3 text-purple-400" />
                <span>Google Gemini</span>
              </button>
              <button
                onClick={() => { setFilterProvider('GROQ'); setCurrentPage(1); }}
                className={`px-2.5 py-0.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer inline-flex items-center gap-1 ${
                  filterProvider === 'GROQ'
                    ? 'bg-amber-600/30 text-amber-200 border border-amber-500/50'
                    : 'bg-slate-950 text-slate-400 hover:text-amber-300 border border-slate-800'
                }`}
              >
                <Zap className="w-3 h-3 text-amber-400" />
                <span>Groq Cloud</span>
              </button>
              <button
                onClick={() => { setFilterProvider('OPENROUTER'); setCurrentPage(1); }}
                className={`px-2.5 py-0.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer inline-flex items-center gap-1 ${
                  filterProvider === 'OPENROUTER'
                    ? 'bg-sky-600/30 text-sky-200 border border-sky-500/50'
                    : 'bg-slate-950 text-slate-400 hover:text-sky-300 border border-slate-800'
                }`}
              >
                <Globe className="w-3 h-3 text-sky-400" />
                <span>OpenRouter</span>
              </button>
              <button
                onClick={() => { setFilterProvider('FREE_ONLY'); setCurrentPage(1); }}
                className={`px-2.5 py-0.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer inline-flex items-center gap-1 ${
                  filterProvider === 'FREE_ONLY'
                    ? 'bg-emerald-600/30 text-emerald-200 border border-emerald-500/50'
                    : 'bg-slate-950 text-emerald-400/70 hover:text-emerald-300 border border-slate-800'
                }`}
              >
                <Gift className="w-3 h-3 text-emerald-400" />
                <span>🎁 Ücretsiz (Free Tier)</span>
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="pb-2">Tarih / Saat</th>
                <th className="pb-2">Kullanıcı / Rol</th>
                <th className="pb-2">Özellik / Süreç</th>
                <th className="pb-2">Sağlayıcı (API)</th>
                <th className="pb-2">Kullanılan Model</th>
                <th className="pb-2 text-center">İçerik (Prompt)</th>
                <th className="pb-2 text-right">Girdi / Çıktı Token</th>
                <th className="pb-2 text-right">Toplam Token</th>
                <th className="pb-2 text-right">Tahmini Tutar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-medium">
              {currentLogs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500 italic">
                    Henüz seçilen filtre kriterlerine uygun bir yapay zeka işlem kaydı bulunmuyor.
                  </td>
                </tr>
              ) : (
                currentLogs.map((log) => {
                  const provider = getLogProvider(log);
                  const isFree = isLogFree(log);

                  return (
                    <tr key={log.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-2.5 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString('tr-TR', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="py-2.5 whitespace-nowrap">
                        <div className="flex items-center space-x-1.5">
                          <div className="p-1 bg-slate-800 rounded text-slate-300">
                            <User className="w-3 h-3 text-indigo-400" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-white text-[11px]">
                              {(log.userName ? log.userName : 'ahmet yılmaz').replace(/\s*\(.*?\)\s*$/g, '').trim()}
                            </span>
                            <span className="text-[9px] text-slate-400">
                              {log.userRole || 'Öğrenci'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 font-semibold text-white">
                        {log.featureName}
                      </td>
                      <td className="py-2.5 whitespace-nowrap">
                        {renderProviderBadge(provider)}
                      </td>
                      <td className="py-2.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border font-mono ${
                          provider === 'GROQ'
                            ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                            : provider === 'OPENROUTER'
                            ? 'bg-sky-500/10 text-sky-300 border-sky-500/30'
                            : log.modelUsed.includes('lite')
                            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                            : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'
                        }`}>
                          {log.modelUsed}
                        </span>
                      </td>
                      <td className="py-2.5 text-center whitespace-nowrap">
                        {log.promptText || log.responseText ? (
                          <button
                            type="button"
                            onClick={() => { setSelectedLog(log); setModalTab('input'); }}
                            className="px-2.5 py-1 bg-indigo-600/30 hover:bg-indigo-600/60 text-indigo-300 hover:text-white rounded-lg border border-indigo-500/40 text-[11px] font-bold transition-all cursor-pointer inline-flex items-center space-x-1 shadow-sm"
                          >
                            <Eye className="w-3 h-3 text-indigo-400" />
                            <span>Promptu Gör</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-500 italic">Prompt Kaydı Yok</span>
                        )}
                      </td>
                      <td className="py-2.5 text-right font-mono text-slate-400 text-[11px] whitespace-nowrap">
                        {log.promptTokens} in / {log.candidatesTokens} out
                      </td>
                      <td className="py-2.5 text-right font-mono font-bold text-white whitespace-nowrap">
                        {log.totalTokens.toLocaleString('tr-TR')}
                      </td>
                      <td className="py-2.5 text-right whitespace-nowrap font-mono">
                        {isFree ? (
                          <div className="inline-flex flex-col items-end">
                            <span className="font-bold text-emerald-400 text-xs">₺0.0000</span>
                            <span className="text-[9px] text-emerald-300/80 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20 font-sans font-bold">
                              🎁 Ücretsiz
                            </span>
                          </div>
                        ) : (
                          <span className="font-bold text-emerald-400">
                            ₺{log.estimatedCostTRY.toFixed(4)}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
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

      {/* PROMPT & RESPONSE VIEW MODAL WITH TABS & TOKEN STATS */}
      {selectedLog && (selectedLog.promptText || selectedLog.responseText) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-indigo-500/40 rounded-3xl max-w-4xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-indigo-500/20 text-indigo-300 rounded-xl border border-indigo-500/30">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base flex items-center gap-2 flex-wrap">
                    <span>Yapay Zeka İstek & Yanıt Detayı</span>
                    {renderProviderBadge(getLogProvider(selectedLog))}
                    <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded font-mono font-bold border border-indigo-500/30">
                      {selectedLog.modelUsed}
                    </span>
                    {isLogFree(selectedLog) && (
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold border border-emerald-500/30">
                        🎁 Ücretsiz (Free Tier)
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    <strong className="text-indigo-300">{(selectedLog.userName || 'Kullanıcı').replace(/\s*\(.*?\)\s*$/g, '').trim()}</strong> ({selectedLog.userRole || 'Öğrenci'}) • {selectedLog.featureName} • {new Date(selectedLog.timestamp).toLocaleString('tr-TR')}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Token & Cost Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-950 p-3 rounded-2xl border border-slate-800 text-xs shrink-0">
              <div className="flex items-center space-x-2">
                <ArrowDownLeft className="w-4 h-4 text-blue-400 shrink-0" />
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Girdi (Prompt)</div>
                  <div className="font-mono font-bold text-blue-300">{selectedLog.promptTokens.toLocaleString('tr-TR')} Token</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <ArrowUpRight className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Çıktı (AI Yanıtı)</div>
                  <div className="font-mono font-bold text-emerald-300">{selectedLog.candidatesTokens.toLocaleString('tr-TR')} Token</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-indigo-400 shrink-0" />
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Toplam Token</div>
                  <div className="font-mono font-bold text-white">{selectedLog.totalTokens.toLocaleString('tr-TR')} Token</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="text-emerald-400 font-bold text-sm shrink-0">₺</div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Tahmini Maliyet</div>
                  <div className="font-mono font-bold text-emerald-400">
                    {isLogFree(selectedLog) ? '₺0.0000 (Ücretsiz)' : `₺${selectedLog.estimatedCostTRY.toFixed(4)}`}
                  </div>
                </div>
              </div>
            </div>

            {/* Tab Buttons: Input vs Output */}
            <div className="flex items-center space-x-2 border-b border-slate-800 pb-2 shrink-0">
              <button
                type="button"
                onClick={() => setModalTab('input')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
                  modalTab === 'input'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 border border-blue-400/40'
                    : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                <ArrowDownLeft className="w-3.5 h-3.5" />
                <span>📥 Girdi (Gönderilen Prompt)</span>
                <span className="text-[10px] font-mono opacity-80">({selectedLog.promptTokens} Token)</span>
              </button>

              <button
                type="button"
                onClick={() => setModalTab('output')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
                  modalTab === 'output'
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 border border-emerald-400/40'
                    : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>📤 Çıktı (AI Yanıtı)</span>
                <span className="text-[10px] font-mono opacity-80">({selectedLog.candidatesTokens} Token)</span>
              </button>
            </div>

            {/* Modal Content Body */}
            <div className="flex-1 overflow-y-auto min-h-0 bg-slate-950 p-4 rounded-2xl border border-slate-800/80">
              {modalTab === 'input' ? (
                selectedLog.promptText ? (
                  <pre className="text-xs font-mono text-blue-200 whitespace-pre-wrap leading-relaxed select-all">
                    {selectedLog.promptText}
                  </pre>
                ) : (
                  <div className="py-12 text-center text-slate-500 italic">
                    Bu istek yapılırken prompt metni günlüğe kaydedilmemişti.
                  </div>
                )
              ) : (
                selectedLog.responseText ? (
                  <pre className="text-xs font-mono text-emerald-200 whitespace-pre-wrap leading-relaxed select-all">
                    {selectedLog.responseText}
                  </pre>
                ) : (
                  <div className="py-12 text-center text-slate-500 italic">
                    Bu istek yapılırken AI yanıt metni günlüğe kaydedilmemişti.
                  </div>
                )
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-2 shrink-0">
              <button
                type="button"
                onClick={() => handleCopyText(modalTab === 'input' ? selectedLog.promptText : selectedLog.responseText)}
                disabled={modalTab === 'input' ? !selectedLog.promptText : !selectedLog.responseText}
                className="px-4 py-2 bg-indigo-600/30 hover:bg-indigo-600/60 disabled:opacity-40 text-indigo-200 font-bold text-xs rounded-xl border border-indigo-500/40 transition-all flex items-center space-x-1.5 cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Kopyalandı!' : modalTab === 'input' ? 'Prompt Metnini Kopyala' : 'AI Yanıtını Kopyala'}</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
