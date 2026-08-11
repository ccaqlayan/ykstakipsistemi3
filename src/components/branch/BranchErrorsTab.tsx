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
  hideHeroHeader?: boolean;
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
  hideHeroHeader = false,
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
    <div className="space-y-6 font-sans animate-fade-in">
      
      {/* ── HERO HEADER BANNER ── */}
      {!hideHeroHeader && (
        <div className="bg-gradient-to-r from-slate-900 via-rose-950/30 to-slate-900 p-6 sm:p-7 rounded-3xl border border-slate-800 shadow-2xl backdrop-blur-md relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2 z-10">
            <div className="inline-flex items-center space-x-2 bg-rose-500/10 border border-rose-500/20 px-3 py-1 rounded-full text-xs font-bold text-rose-300">
              <Sparkles className="w-3.5 h-3.5 text-rose-400" />
              <span>YKS Sıfır Hata & Yapay Zeka Çözüm Merkezi</span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center space-x-2.5">
              <AlertTriangle className="w-6 h-6 text-rose-500 shrink-0 animate-pulse" />
              <span>Hata Defteri & Yanlış Tablosu</span>
            </h1>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              Deneme sınavları ve soru bankalarında yanlış yaptığınız konuları analiz edin, yapay zeka ile adım adım çözümlerini inceleyin ve tekrar ederek tam hakimiyet sağlayın.
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0 z-10">
            <button
              type="button"
              onClick={() => openAddErrorModal()}
              className="bg-gradient-to-r from-rose-600 via-purple-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white text-xs font-bold px-5 py-3 rounded-2xl transition-all shadow-xl shadow-rose-600/30 flex items-center justify-center space-x-2 cursor-pointer border border-rose-400/30 group"
            >
              <AlertTriangle className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span>+ Yeni Hata Kaydı Ekle</span>
            </button>
          </div>
        </div>
      )}

      {/* ── 4 KPI SUMMARY METRIC CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Toplam Yanlış Kaydı */}
        <div className="bg-slate-900/90 border border-slate-800 p-4.5 rounded-3xl flex flex-col justify-between shadow-xl backdrop-blur-md relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Toplam Yanlış Kaydı</span>
            <div className="w-8 h-8 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-black text-white font-mono">{topicErrors.length}</span>
              <span className="text-xs text-slate-400 font-medium">Soru</span>
            </div>
            <span className="text-[10px] bg-rose-500/15 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-full font-semibold font-mono">
              Hata Havuzu
            </span>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>Filtrelenen Soru:</span>
            <span className="text-rose-300 font-bold font-mono">{filteredErrors.length}</span>
          </div>
        </div>

        {/* Card 2: Bekleyen Tekrarlar */}
        <div className="bg-slate-900/90 border border-slate-800 p-4.5 rounded-3xl flex flex-col justify-between shadow-xl backdrop-blur-md relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Bekleyen Tekrarlar</span>
            <div className="w-8 h-8 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-amber-400" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-black text-amber-400 font-mono">
                {topicErrors.filter(e => !e.revised).length}
              </span>
              <span className="text-xs text-slate-400 font-medium">Soru</span>
            </div>
            <span className="text-[10px] bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-semibold font-mono">
              Tekrar Bekliyor
            </span>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>Tekrar Oranı:</span>
            <span className="text-amber-300 font-bold font-mono">
              %{topicErrors.length > 0 ? Math.round((topicErrors.filter(e => e.revised).length / topicErrors.length) * 100) : 0}
            </span>
          </div>
        </div>

        {/* Card 3: Tekrar Edilenler */}
        <div className="bg-slate-900/90 border border-slate-800 p-4.5 rounded-3xl flex flex-col justify-between shadow-xl backdrop-blur-md relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Tekrar Edilenler</span>
            <div className="w-8 h-8 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-black text-emerald-400 font-mono">
                {topicErrors.filter(e => e.revised).length}
              </span>
              <span className="text-xs text-slate-400 font-medium">Soru</span>
            </div>
            <span className="text-[10px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold font-mono">
              Tamamlandı
            </span>
          </div>
          <div className="mt-3 w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
              style={{ width: `${topicErrors.length > 0 ? Math.round((topicErrors.filter(e => e.revised).length / topicErrors.length) * 100) : 0}%` }} 
            />
          </div>
        </div>

        {/* Card 4: Görselli / Yapay Zekalı Sorular */}
        <div className="bg-slate-900/90 border border-slate-800 p-4.5 rounded-3xl flex flex-col justify-between shadow-xl backdrop-blur-md relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Görselli & AI Çözümlü</span>
            <div className="w-8 h-8 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
              <Brain className="w-4 h-4 text-purple-400" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-black text-purple-400 font-mono">
                {topicErrors.filter(e => e.imageUrl || e.aiAnalysis || e.aiFeedback).length}
              </span>
              <span className="text-xs text-slate-400 font-medium">Soru</span>
            </div>
            <span className="text-[10px] bg-purple-500/15 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full font-semibold font-mono">
              AI Destekli
            </span>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>Fotoğraflı Soru:</span>
            <span className="text-purple-300 font-bold font-mono">{topicErrors.filter(e => !!e.imageUrl).length}</span>
          </div>
        </div>
      </div>

      {/* ── FILTER & SORT HUB ── */}
      <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 shadow-xl space-y-4">
        
        {/* Source Filter Badge Banner */}
        {filterExamId && (() => {
          const sampleErr = topicErrors.find(e => e.examId === filterExamId);
          const sourceName = sampleErr?.publisher || 'Seçilen Kaynak';
          return (
            <div className="flex items-center justify-between bg-indigo-950/40 border border-indigo-500/30 px-4 py-2.5 rounded-2xl text-xs text-indigo-200 shadow-sm">
              <span className="font-bold flex items-center space-x-2">
                <span>📌 Özel Kaynak Filtresi Aktif:</span>
                <span className="text-indigo-300 font-mono bg-indigo-500/20 px-2.5 py-0.5 rounded-lg">{sourceName}</span>
              </span>
              <button
                type="button"
                onClick={() => setFilterExamId(null)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold px-3 py-1 rounded-xl transition-all cursor-pointer shadow-sm"
              >
                Filtreyi Temizle ({topicErrors.filter(e => e.examId === filterExamId).length} Soru)
              </button>
            </div>
          );
        })()}

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Status Filter Pills */}
          <div className="flex items-center space-x-1.5 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 shrink-0">
            <button
              type="button"
              onClick={() => { setFilterRevised('UNREVISED'); setFilterExamId(null); }}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                filterRevised === 'UNREVISED' && !filterExamId
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              ⏳ Bekleyenler ({topicErrors.filter(e => !e.revised).length})
            </button>
            <button
              type="button"
              onClick={() => { setFilterRevised('REVISED'); setFilterExamId(null); }}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                filterRevised === 'REVISED' && !filterExamId
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              ✅ Tekrar Edilenler ({topicErrors.filter(e => e.revised).length})
            </button>
            <button
              type="button"
              onClick={() => { setFilterRevised('ALL'); setFilterExamId(null); }}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                filterRevised === 'ALL' && !filterExamId
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              📋 Tümü ({topicErrors.length})
            </button>
          </div>

          {/* Select Dropdowns */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Ders:</span>
              <select
                value={filterSubject}
                onChange={(e) => { setFilterSubject(e.target.value); setFilterExamId(null); }}
                className="bg-slate-950 border border-slate-800 text-xs font-bold text-slate-200 rounded-2xl px-3 py-2 focus:outline-none focus:border-indigo-500 max-w-[180px] truncate cursor-pointer shadow-sm"
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

            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Eşleşme:</span>
              <select
                value={filterMatchStatus}
                onChange={(e) => { setFilterMatchStatus(e.target.value); setFilterExamId(null); }}
                className="bg-slate-950 border border-slate-800 text-xs font-bold text-slate-200 rounded-2xl px-3 py-2 focus:outline-none focus:border-indigo-500 cursor-pointer shadow-sm"
              >
                <option value="ALL">Tüm Kaynaklar</option>
                <option value="MATCHED">Eşleşme Olanlar</option>
                <option value="BOOK">Kitap Eşleşmeleri</option>
                <option value="EXAM">Deneme Eşleşmeleri</option>
                <option value="NOT_MATCHED">Eşleşme Olmayanlar</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Sırala:</span>
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-xs font-bold text-slate-200 rounded-2xl px-3 py-2 focus:outline-none focus:border-indigo-500 cursor-pointer shadow-sm"
              >
                <option value="NEWEST">Yeniden Eskiye</option>
                <option value="OLDEST">Eskiden Yeniye</option>
                <option value="PRIORITY_DESC">Öncelik (Yüksek - Düşük)</option>
                <option value="PRIORITY_ASC">Öncelik (Düşük - Yüksek)</option>
              </select>
            </div>
          </div>

        </div>
      </div>

      {filteredErrors.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/60 rounded-3xl border border-slate-800 space-y-3 shadow-xl">
          <div className="w-14 h-14 rounded-3xl bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto text-slate-500">
            <BookOpen className="w-7 h-7" />
          </div>
          <h3 className="text-sm font-bold text-white">Seçilen Görünümde Hata Kaydı Bulunmuyor</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Hata Defterinize henüz soru eklenmemiş veya uygulanan filtrelerle eşleşen kayıt bulunamadı.
          </p>
          <button
            type="button"
            onClick={() => openAddErrorModal()}
            className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer shadow-md mt-2"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>+ İlk Hata Kaydını Ekle</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredErrors.map((item) => {
            const isRevised = !!item.revised;
            const isFading = !!fadingOutIds[item.id];
            const reasonColor = ERROR_REASON_COLORS[item.errorReason] || '#ef4444';
            const reasonLabel = ERROR_REASON_LABELS[item.errorReason] || item.errorReason;

            return (
              <div 
                key={item.id} 
                className={`bg-slate-900/90 border border-slate-800 hover:border-indigo-500/40 rounded-3xl p-5 shadow-xl transition-all space-y-4 relative overflow-hidden backdrop-blur-md ${
                  isRevised ? 'opacity-85 border-emerald-500/30' : ''
                } ${
                  isFading ? 'opacity-30 scale-98 filter blur-[1px]' : ''
                }`}
              >
                {/* Top Row: Subject Badge, Reason, Priority & Controls */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-black text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded-lg uppercase tracking-wider">
                        {item.subject}
                      </span>
                      <span className="text-[10px] px-2.5 py-0.5 rounded-lg font-bold uppercase tracking-wider shadow-sm" style={{ backgroundColor: `${reasonColor}20`, color: reasonColor, border: `1px solid ${reasonColor}40` }}>
                        {reasonLabel}
                      </span>
                      {item.priority !== undefined && renderPriorityBar(item.priority)}
                    </div>
                    <h3 className="text-base font-extrabold text-white leading-snug tracking-tight">
                      {item.topicName}
                    </h3>
                    {item.publisher && (
                      <p className="text-xs text-slate-400 font-medium">
                        Kaynak / Yayın: <span className="text-slate-200 font-bold">{item.publisher}</span>
                      </p>
                    )}
                  </div>

                  {/* Actions: Edit & Delete */}
                  <div className="flex items-center space-x-1 shrink-0 self-end sm:self-start bg-slate-950 p-1 rounded-2xl border border-slate-800">
                    <button
                      type="button"
                      onClick={() => openAddErrorModal(item)}
                      className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-slate-900 rounded-xl transition-colors cursor-pointer"
                      title="Hata Kaydını Düzenle"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingItem({ type: 'error', id: item.id, title: `${item.subject} - ${item.topicName}` })}
                      className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded-xl transition-colors cursor-pointer"
                      title="Sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Soru Görseli Varsa: Görsel & AI Destek Araçları Panel */}
                {item.imageUrl && (
                  <div className="flex flex-col sm:flex-row items-start gap-4 bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800">
                    <div className="relative group rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 shrink-0 w-32 h-28 sm:w-40 sm:h-32 shadow-md">
                      <img 
                        src={item.imageUrl} 
                        alt={item.topicName} 
                        className="w-full h-full object-cover cursor-pointer group-hover:scale-105 transition-transform duration-300"
                        onClick={() => openImagePreview(item.imageUrl!, `${item.subject} - ${item.topicName}`)}
                      />
                      <div 
                        className="absolute inset-0 bg-slate-950/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                        onClick={() => openImagePreview(item.imageUrl!, `${item.subject} - ${item.topicName}`)}
                      >
                        <div className="bg-slate-900/90 text-white text-[10px] font-bold px-2.5 py-1 rounded-xl border border-slate-700 shadow-lg flex items-center space-x-1.5">
                          <Maximize2 className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Görseli Büyüt</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 flex-1 min-w-0 justify-center">
                      <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider flex items-center space-x-1">
                        <Sparkles className="w-3 h-3 text-purple-400" />
                        <span>Yapay Zeka Destek Araçları</span>
                      </span>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenSolveModal(item)}
                          className="px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 shadow-sm"
                        >
                          <Brain className="w-3.5 h-3.5 text-purple-400" />
                          <span>Çözüm Rehberi</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenSimilarModal(item)}
                          className="px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 shadow-sm"
                        >
                          <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Benzer Soru Oluştur</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenQuestionReport(item)}
                          className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 shadow-sm"
                        >
                          <FileText className="w-3.5 h-3.5 text-amber-400" />
                          <span>{item.aiAnalysis ? 'Soru Karnesi' : 'Soru Karnesi Oluştur'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Çözüm / Notlar */}
                {item.solutionNotes && (
                  <div className="bg-slate-950/70 border border-slate-800/80 p-3.5 rounded-2xl space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Çözüm Notları & Püf Noktaları</span>
                    <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed font-medium">{item.solutionNotes}</p>
                  </div>
                )}

                {/* Alt Aksiyon Butonları */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/60">
                  <div className="flex flex-wrap items-center gap-2">
                    {(item.aiFeedback || item.aiAnalysis) && (
                      <button
                        type="button"
                        onClick={() => setActiveAiAnalysis({
                          subject: item.subject,
                          topicName: item.topicName,
                          text: item.aiFeedback || item.aiAnalysis || ''
                        })}
                        className="px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 shadow-sm"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                        <span>Hata Analizi</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleOpenTipModal(item.subject, item.topicName)}
                      className="px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 shadow-sm"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Konu İpucu</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    disabled={revisingIds[item.id]}
                    onClick={() => handleToggleErrorRevision(item.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shadow-md ${
                      isRevised
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                        : 'bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white shadow-rose-600/20'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isRevised ? '✓ Tekrar Edildi' : 'Tekrar Ettim'}</span>
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
