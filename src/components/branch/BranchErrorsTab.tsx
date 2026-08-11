import React, { useState } from 'react';
import { 
  AlertTriangle, 
  BookOpen, 
  CheckCircle2, 
  Trash2, 
  Edit2, 
  Sparkles, 
  HelpCircle, 
  Maximize2, 
  Image as ImageIcon,
  Brain,
  X,
  FileText
} from 'lucide-react';
import { TopicErrorItem, BranchExam, ResourceItem } from '../../types';

interface BranchErrorsTabProps {
  topicErrors: TopicErrorItem[];
  filteredErrors: TopicErrorItem[];
  filterExamId: string | null;
  setFilterExamId: (val: string | null) => void;
  filterRevised: 'UNREVISED' | 'REVISED' | 'ALL';
  setFilterRevised: (val: 'UNREVISED' | 'REVISED' | 'ALL') => void;
  filterSubject: string;
  setFilterSubject: (val: string) => void;
  filterMatchStatus: string;
  setFilterMatchStatus: (val: string) => void;
  sortOption: string;
  setSortOption: (val: string) => void;
  branchExams: BranchExam[];
  resources: ResourceItem[];
  openAddErrorModal: (err?: TopicErrorItem) => void;
  setDeletingItem: (item: { type: 'error' | 'exam'; id: string; title: string }) => void;
  handleToggleErrorRevision: (id: string) => void;
  revisingIds: Record<string, boolean>;
  fadingOutIds: Record<string, boolean>;
  handleOpenTipModal: (subject: string, topicName: string) => void;
  handleOpenSolveModal: (errorItem: TopicErrorItem) => void;
  handleOpenSimilarModal: (errorItem: TopicErrorItem) => void;
  handleOpenQuestionReport: (errorItem: TopicErrorItem) => void;
  openImagePreview: (url: string, title: string) => void;
  ERROR_REASON_LABELS: Record<string, string>;
  ERROR_REASON_COLORS: Record<string, string>;
}

export const BranchErrorsTab: React.FC<BranchErrorsTabProps> = ({
  topicErrors,
  filteredErrors,
  filterExamId,
  setFilterExamId,
  filterRevised,
  setFilterRevised,
  filterSubject,
  setFilterSubject,
  filterMatchStatus,
  setFilterMatchStatus,
  sortOption,
  setSortOption,
  branchExams,
  resources,
  openAddErrorModal,
  setDeletingItem,
  handleToggleErrorRevision,
  revisingIds,
  fadingOutIds,
  handleOpenTipModal,
  handleOpenSolveModal,
  handleOpenSimilarModal,
  handleOpenQuestionReport,
  openImagePreview,
  ERROR_REASON_LABELS,
  ERROR_REASON_COLORS,
}) => {
  const [activeAiAnalysis, setActiveAiAnalysis] = useState<{ topicName: string; subject: string; text: string } | null>(null);

  const renderPriorityBar = (p: any) => {
    let val = parseInt(p, 10);
    if (isNaN(val)) {
      val = p === 'high' ? 8 : p === 'low' ? 3 : 5;
    }
    const pct = Math.min(100, Math.max(10, (val / 10) * 100));
    const solidBg = val >= 7 ? 'bg-rose-500' : val >= 4 ? 'bg-amber-500' : 'bg-indigo-500';
    const textColor = val >= 7 ? 'text-rose-400' : val >= 4 ? 'text-amber-400' : 'text-indigo-400';

    return (
      <div className="flex items-center space-x-2 shrink-0">
        <span className={`text-xs font-bold ${textColor}`}>Öncelik: {val}/10</span>
        <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden shrink-0">
          <div className={`h-full ${solidBg} rounded-full transition-all duration-300`} style={{ width: `${pct}%` }} />
        </div>
      </div>
    );
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
      
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/60">
        <h2 className="text-sm font-bold text-white flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-rose-500" />
          <span>Yanlış Yapılan Konular ve Çözüm Takibi</span>
          {filterExamId && (() => {
            const sampleErr = topicErrors.find(e => e.examId === filterExamId);
            const sourceName = sampleErr?.publisher || 'Seçilen Kaynak';
            return (
              <span className="ml-2 text-xs font-normal text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded-lg border border-indigo-500/20 truncate max-w-[250px]">
                📌 Kaynak: {sourceName}
              </span>
            );
          })()}
        </h2>
        {filterExamId && (
          <button
            type="button"
            onClick={() => setFilterExamId(null)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer shadow-sm flex items-center space-x-1 shrink-0"
          >
            <span>Filtreyi Kaldır ({topicErrors.filter(e => e.examId === filterExamId).length} Soru)</span>
          </button>
        )}
      </div>
        
      <div className="flex flex-col gap-3 w-full">
        {/* Durum Filtresi */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 no-scrollbar">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">Durum:</span>
          <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
            <button
              type="button"
              onClick={() => { setFilterRevised('UNREVISED'); setFilterExamId(null); }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                filterRevised === 'UNREVISED' && !filterExamId
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              Bekleyenler ({topicErrors.filter(e => !e.revised).length})
            </button>
            <button
              type="button"
              onClick={() => { setFilterRevised('REVISED'); setFilterExamId(null); }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                filterRevised === 'REVISED' && !filterExamId
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              Tekrar Edilenler ({topicErrors.filter(e => e.revised).length})
            </button>
            <button
              type="button"
              onClick={() => { setFilterRevised('ALL'); setFilterExamId(null); }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                filterRevised === 'ALL' && !filterExamId
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              Tümü ({topicErrors.length})
            </button>
          </div>
        </div>

        {/* Ders, Eşleşme ve Sıralama */}
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <div className="flex items-center space-x-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ders:</span>
            <select
              value={filterSubject}
              onChange={(e) => { setFilterSubject(e.target.value); setFilterExamId(null); }}
              className="bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 max-w-[180px] truncate cursor-pointer"
            >
              <option value="ALL">Tüm Dersler ({topicErrors.length})</option>
              {Array.from(new Set(topicErrors.map((err) => err.subject)))
                .filter((sub): sub is string => typeof sub === 'string')
                .sort((a, b) => a.localeCompare(b, 'tr'))
                .map((sub) => {
                  const count = topicErrors.filter(e => e.subject === sub).length;
                  return (
                    <option key={sub} value={sub}>{sub} ({count})</option>
                  );
                })}
            </select>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Eşleşme:</span>
            <select
              value={filterMatchStatus}
              onChange={(e) => { setFilterMatchStatus(e.target.value); setFilterExamId(null); }}
              className="bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="ALL">Tüm Kaynaklar</option>
              <option value="MATCHED">Eşleşme Olanlar</option>
              <option value="BOOK">Kitap Eşleşmeleri</option>
              <option value="EXAM">Deneme Eşleşmeleri</option>
              <option value="NOT_MATCHED">Eşleşme Olmayanlar</option>
            </select>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sırala:</span>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="NEWEST">Yeniden Eskiye</option>
              <option value="OLDEST">Eskiden Yeniye</option>
              <option value="PRIORITY_DESC">Öncelik (Yüksek - Düşük)</option>
              <option value="PRIORITY_ASC">Öncelik (Düşük - Yüksek)</option>
            </select>
          </div>
        </div>
      </div>

      {filteredErrors.length === 0 ? (
        <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl">
          <BookOpen className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <p className="text-xs text-slate-400 font-semibold">Bu görünümde kayıtlı soru hatası bulunmuyor.</p>
        </div>
      ) : (
        <div className="space-y-3 pt-2">
          {filteredErrors.map((item) => {
            const isRevised = !!item.revised;
            const isFading = !!fadingOutIds[item.id];
            const reasonColor = ERROR_REASON_COLORS[item.errorReason] || '#ef4444';
            const reasonLabel = ERROR_REASON_LABELS[item.errorReason] || item.errorReason;

            return (
              <div 
                key={item.id} 
                className={`bg-slate-950 border border-slate-800/80 rounded-xl p-4 transition-all hover:border-slate-700/80 space-y-3 ${
                  isFading ? 'opacity-30 scale-98 filter blur-[1px]' : ''
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-black text-indigo-400 uppercase tracking-wider">{item.subject}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider" style={{ backgroundColor: `${reasonColor}20`, color: reasonColor, border: `1px solid ${reasonColor}40` }}>
                        {reasonLabel}
                      </span>
                      {item.priority !== undefined && renderPriorityBar(item.priority)}
                    </div>
                    <h3 className="text-sm font-bold text-white leading-snug">{item.topicName}</h3>
                    {item.publisher && (
                      <p className="text-[11px] text-slate-400 font-medium">
                        Kaynak: <span className="text-slate-200">{item.publisher}</span>
                      </p>
                    )}
                  </div>

                  <div className="flex items-center space-x-1.5 shrink-0 self-end sm:self-start">
                    <button
                      type="button"
                      onClick={() => openAddErrorModal(item)}
                      className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                      title="Hata Kaydını Düzenle"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingItem({ type: 'error', id: item.id, title: `${item.subject} - ${item.topicName}` })}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                      title="Sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Soru Görseli Varsa: Küçük Görsel ve Sağında Dikey Yapay Zeka Butonları */}
                {item.imageUrl && (
                  <div className="flex flex-col sm:flex-row items-start gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                    <div className="relative group rounded-xl overflow-hidden border border-slate-800 bg-slate-900 shrink-0 w-28 h-24 sm:w-36 sm:h-28">
                      <img 
                        src={item.imageUrl} 
                        alt={item.topicName} 
                        className="w-full h-full object-cover cursor-pointer group-hover:scale-105 transition-transform duration-300"
                        onClick={() => openImagePreview(item.imageUrl!, `${item.subject} - ${item.topicName}`)}
                      />
                      <div 
                        className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                        onClick={() => openImagePreview(item.imageUrl!, `${item.subject} - ${item.topicName}`)}
                      >
                        <div className="bg-slate-900/90 text-white text-[10px] font-bold px-2 py-1 rounded-lg border border-slate-700 shadow-lg flex items-center space-x-1">
                          <Maximize2 className="w-3 h-3 text-indigo-400" />
                          <span>Büyüt</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5 flex-1 min-w-0 justify-center">
                      <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">Yapay Zeka Destek Araçları</span>
                      <button
                        type="button"
                        onClick={() => handleOpenSolveModal(item)}
                        className="px-2.5 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 w-fit"
                      >
                        <Brain className="w-3.5 h-3.5 text-purple-400" />
                        <span>Çözüm Rehberi</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenSimilarModal(item)}
                        className="px-2.5 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 w-fit"
                      >
                        <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Benzer Soru Oluştur</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenQuestionReport(item)}
                        className="px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 w-fit"
                      >
                        <FileText className="w-3.5 h-3.5 text-amber-400" />
                        <span>{item.aiAnalysis ? 'Soru Karnesi' : 'Soru Karnesi Oluştur'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Çözüm / Notlar */}
                {item.solutionNotes && (
                  <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Çözüm Notları & Püf Noktaları</span>
                    <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">{item.solutionNotes}</p>
                  </div>
                )}

                {/* Alt Aksiyon Butonları */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-900">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {(item.aiFeedback || item.aiAnalysis) && (
                      <button
                        type="button"
                        onClick={() => setActiveAiAnalysis({
                          subject: item.subject,
                          topicName: item.topicName,
                          text: item.aiFeedback || item.aiAnalysis || ''
                        })}
                        className="px-2.5 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                        <span>Hata Analizi</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleOpenTipModal(item.subject, item.topicName)}
                      className="px-2.5 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Konu İpucu</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    disabled={revisingIds[item.id]}
                    onClick={() => handleToggleErrorRevision(item.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1 ${
                      isRevised
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-rose-600 hover:bg-rose-500 text-white shadow-sm cursor-pointer'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{isRevised ? 'Tekrar Edildi' : 'Tekrar Ettim'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Kaydedilmiş Hata Analizi Görünümü */}
      {activeAiAnalysis && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setActiveAiAnalysis(null); }}
        >
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-5 md:p-6 shadow-2xl space-y-4 animate-fade-in max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">{activeAiAnalysis.topicName}</h3>
                  <p className="text-[10px] text-purple-400 font-bold uppercase">{activeAiAnalysis.subject} - Kaydedilmiş Hata Analizi</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setActiveAiAnalysis(null)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 bg-indigo-950/40 border border-indigo-500/30 rounded-xl space-y-2 text-xs">
              <p className="text-slate-200 leading-relaxed whitespace-pre-line font-medium">
                {activeAiAnalysis.text}
              </p>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setActiveAiAnalysis(null)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
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
