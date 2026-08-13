import React, { useState, useEffect } from 'react';
import { 
  X, 
  BookOpen, 
  Camera, 
  UploadCloud, 
  Maximize2, 
  Loader2, 
  Image as ImageIcon, 
  AlertTriangle, 
  Sparkles, 
  Target, 
  Brain, 
  HelpCircle, 
  ChevronRight, 
  Zap,
  Eye,
  EyeOff,
  FileText
} from 'lucide-react';
import { BranchExam, TopicErrorItem, ErrorReason, GeneralMockExam, ResourceItem } from '../../types';
import { ConfirmDeleteModal } from '../ConfirmDeleteModal';

interface BranchModalsProps {
  // Error Modal
  showAddErrorModal: boolean;
  setShowAddErrorModal: (show: boolean) => void;
  editingError: TopicErrorItem | null;
  setEditingError: (err: TopicErrorItem | null) => void;
  errorSubject: string;
  setErrorSubject: (sub: string) => void;
  topicName: string;
  setTopicName: (name: string) => void;
  isCustomTopic: boolean;
  setIsCustomTopic: (custom: boolean) => void;
  errorPublisher: string;
  setErrorPublisher: (pub: string) => void;
  selectedExamRef: string;
  setSelectedExamRef: (ref: string) => void;
  errorReason: ErrorReason;
  setErrorReason: (reason: ErrorReason) => void;
  priority: number;
  setPriority: (pri: number) => void;
  solutionNotes: string;
  setSolutionNotes: (notes: string) => void;
  isAnalyzing: boolean;
  aiFeedback: string | null;
  setAiFeedback: (feedback: string | null) => void;
  aiSuccess: boolean;
  aiButtonFaded: boolean;
  errorImageUrl: string | null;
  setErrorImageUrl: (url: string | null) => void;
  isCompressingImage: boolean;
  imageStats: { originalKb: number; compressedKb: number } | null;
  imageError: string | null;
  handleCreateTopicError: (e: React.FormEvent) => void;
  handleAIAnalyzeError: () => void;
  handleImageSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleRemoveImage: () => void;

  branchExams: BranchExam[];
  resources: ResourceItem[];
  last3GeneralMocks: GeneralMockExam[];
  YKS_CURRICULUM_TOPICS: Record<string, string[]>;
  ERROR_REASON_LABELS: Record<string, string>;

  // Branch Exam Modal
  showAddExamModal: boolean;
  setShowAddExamModal: (show: boolean) => void;
  editingExam: BranchExam | null;
  setEditingExam: (exam: BranchExam | null) => void;
  examDate: string;
  setExamDate: (date: string) => void;
  examType: 'TYT' | 'AYT';
  setExamType: (type: 'TYT' | 'AYT') => void;
  examSubject: string;
  setExamSubject: (sub: string) => void;
  publisher: string;
  setPublisher: (pub: string) => void;
  correct: string;
  setCorrect: (val: string) => void;
  wrong: string;
  setWrong: (val: string) => void;
  empty: string;
  setEmpty: (val: string) => void;
  durationMinutes: string;
  setDurationMinutes: (val: string) => void;
  examNotes: string;
  setExamNotes: (notes: string) => void;
  isAnalyzed: boolean;
  setIsAnalyzed: (analyzed: boolean) => void;
  handleCreateBranchExam: (e: React.FormEvent) => void;
  YKS_SUBJECTS: Record<string, string[]>;

  // Delete Confirm Modal
  deletingItem: { type: 'error' | 'exam'; id: string; title: string } | null;
  setDeletingItem: (item: { type: 'error' | 'exam'; id: string; title: string } | null) => void;
  handleConfirmDelete: () => void;

  // AI Topic Tip Modal
  activeTipTopic: { subject: string; topicName: string } | null;
  setActiveTipTopic: (topic: { subject: string; topicName: string } | null) => void;
  tipLoading: boolean;
  topicTipData: { summary: string; mistakes: Array<{ mistake: string; correction: string }>; tips: string[] } | null;
  tipError: string | null;
  handleFetchTopicTips: (subject: string, topicName: string) => void;

  // Image Preview & AI Solvers
  solveSolution: string | null;
  setSolveSolution: (val: string | null) => void;
  solveLoading: boolean;
  solveError: string | null;
  similarLoading: boolean;
  similarQuestionsList: any[];
  similarError: string | null;
  activeSimilarIdx: number;
  setActiveSimilarIdx: (val: number) => void;
  aiModalTab: 'solution' | 'similar' | 'report';
  setAiModalTab: (val: 'solution' | 'similar' | 'report') => void;
  previewImage: { url: string; title: string } | null;
  setPreviewImage: (val: { url: string; title: string } | null) => void;
  handleSolveQuestion: (imgUrl: string, titleStr: string) => void;
  handleGenerateSimilarQuestions: (imgUrl: string, titleStr: string) => void;
  handleOpenQuestionReport: (errorItem: TopicErrorItem) => void;
  handleGenerateQuestionReport: (errorItem: TopicErrorItem) => void;
  handleFetchFullPhotoAnalysis: (errorItem: TopicErrorItem, targetTab: 'solution' | 'similar' | 'report') => void;
  reportLoading: boolean;
  reportText: string | null;
  reportError: string | null;

  // AI Support Center
  activeSupportItem: any;
  setActiveSupportItem: (val: any) => void;
  activeSupportTab: 'menu' | 'feedback' | 'analysis';
  setActiveSupportTab: (val: 'menu' | 'feedback' | 'analysis') => void;
  supportFeedbackLoading: boolean;
  supportFeedbackError: string | null;
  supportFeedbackText: string | null;
  supportAnalysisLoading: boolean;
  supportAnalysisError: string | null;
  supportAnalysisText: string | null;
  handleSupportGetFeedback: (item: any) => void;
  handleSupportGetAnalysis: (item: any) => void;
  formatAnalysisTable: (text: string) => React.ReactNode;
  setReturnToSupportItem: (item: any) => void;
  openImagePreview: (url: string, title: string) => void;
  topicErrors: TopicErrorItem[];
}

export const BranchModals: React.FC<BranchModalsProps> = ({
  showAddErrorModal,
  setShowAddErrorModal,
  editingError,
  setEditingError,
  errorSubject,
  setErrorSubject,
  topicName,
  setTopicName,
  isCustomTopic,
  setIsCustomTopic,
  errorPublisher,
  setErrorPublisher,
  selectedExamRef,
  setSelectedExamRef,
  errorReason,
  setErrorReason,
  priority,
  setPriority,
  solutionNotes,
  setSolutionNotes,
  isAnalyzing,
  aiFeedback,
  setAiFeedback,
  aiSuccess,
  aiButtonFaded,
  errorImageUrl,
  setErrorImageUrl,
  isCompressingImage,
  imageStats,
  imageError,
  handleCreateTopicError,
  handleAIAnalyzeError,
  handleImageSelect,
  handleRemoveImage,
  branchExams,
  resources,
  last3GeneralMocks,
  YKS_CURRICULUM_TOPICS,
  ERROR_REASON_LABELS,

  showAddExamModal,
  setShowAddExamModal,
  editingExam,
  setEditingExam,
  examDate,
  setExamDate,
  examType,
  setExamType,
  examSubject,
  setExamSubject,
  publisher,
  setPublisher,
  correct,
  setCorrect,
  wrong,
  setWrong,
  empty,
  setEmpty,
  durationMinutes,
  setDurationMinutes,
  examNotes,
  setExamNotes,
  isAnalyzed,
  setIsAnalyzed,
  handleCreateBranchExam,
  YKS_SUBJECTS,

  deletingItem,
  setDeletingItem,
  handleConfirmDelete,

  activeTipTopic,
  setActiveTipTopic,
  tipLoading,
  topicTipData,
  tipError,
  handleFetchTopicTips,

  solveSolution,
  setSolveSolution,
  solveLoading,
  solveError,
  similarLoading,
  similarQuestionsList,
  similarError,
  activeSimilarIdx,
  setActiveSimilarIdx,
  aiModalTab,
  setAiModalTab,
  previewImage,
  setPreviewImage,
  handleSolveQuestion,
  handleGenerateSimilarQuestions,
  handleOpenQuestionReport,
  handleGenerateQuestionReport,
  reportLoading,
  reportText,
  reportError,

  activeSupportItem,
  setActiveSupportItem,
  activeSupportTab,
  setActiveSupportTab,
  supportFeedbackLoading,
  supportFeedbackError,
  supportFeedbackText,
  supportAnalysisLoading,
  supportAnalysisError,
  supportAnalysisText,
  handleSupportGetFeedback,
  handleSupportGetAnalysis,
  formatAnalysisTable,
  setReturnToSupportItem,
  openImagePreview,
  topicErrors,
}) => {
  const isEditingError = editingError !== null;
  const isEditingExam = editingExam !== null;
  const [showSolutionMap, setShowSolutionMap] = useState<Record<number, boolean>>({});

  useEffect(() => {
    setShowSolutionMap({});
  }, [previewImage]);

  // Normalize image URL: strip query params for comparison
  const normalizeUrl = (url: string) => url ? url.split('?')[0] : '';

  const getMatchingErrorItem = () => {
    if (!previewImage) return null;
    const previewNorm = normalizeUrl(previewImage.url);
    return (topicErrors || []).find(e => {
      if (!e.imageUrl) return false;
      // Try exact match first, then normalized (without query params), then title match
      return e.imageUrl === previewImage.url
        || normalizeUrl(e.imageUrl) === previewNorm
        || `${e.subject} - ${e.topicName}` === previewImage.title;
    }) || null;
  };

  const triggerFullPhotoAnalysis = (targetTab: 'solution' | 'similar' | 'report') => {
    const matchingError = getMatchingErrorItem();
    if (matchingError && handleFetchFullPhotoAnalysis) {
      handleFetchFullPhotoAnalysis(matchingError, targetTab);
    } else if (previewImage && handleFetchFullPhotoAnalysis) {
      // Build a synthetic error item from previewImage metadata so full analysis still runs
      const [subject, ...topicParts] = previewImage.title.split(' - ');
      const syntheticError = {
        id: `preview-${Date.now()}`,
        imageUrl: previewImage.url,
        subject: subject || '',
        topicName: topicParts.join(' - ') || '',
        errorReason: 'wrong' as any,
        publisher: '',
        revised: false,
        priority: 'medium' as any,
      };
      handleFetchFullPhotoAnalysis(syntheticError as any, targetTab);
    } else if (previewImage) {
      if (targetTab === 'solution') handleSolveQuestion(previewImage.url, previewImage.title);
      else if (targetTab === 'similar') handleGenerateSimilarQuestions(previewImage.url, previewImage.title);
    }
  };

  const formatSolutionText = (text: string) => {
    if (!text) return null;
    let formattedText = text
      .replace(/([^\n])\s*(Adım \d+[:\.-])/gi, '$1\n\n$2')
      .replace(/([^\n])\s*(\d+\.\s+)/g, '$1\n$2')
      .replace(/([^\n])\s*([A-E]\)\s+)/g, '$1\n$2')
      .replace(/([^\n])\s*(Çözüm[:\.-])/gi, '$1\n\n$2')
      .replace(/([^\n])\s*(Doğru Cevap[:\.-])/gi, '$1\n\n$2')
      .replace(/([^\n])\s*(Sonuç[:\.-])/gi, '$1\n\n$2');

    return formattedText.split('\n').map((line, idx) => {
      let cleaned = line
        .replace(/\$\$/g, '')
        .replace(/\$/g, '')
        .replace(/\\implies/g, ' ➔ ')
        .replace(/\\cdot/g, ' · ')
        .replace(/\\equiv/g, ' ≡ ')
        .replace(/\\approx/g, ' ≈ ')
        .replace(/\\ne/g, ' ≠ ')
        .replace(/\\le/g, ' ≤ ')
        .replace(/\\ge/g, ' ≥ ')
        .replace(/\\infty/g, ' ∞ ')
        .replace(/\\pm/g, ' ± ')
        .replace(/\\times/g, ' × ')
        .replace(/\\div/g, ' ÷ ')
        .replace(/\\alpha/g, 'α')
        .replace(/\\beta/g, 'β')
        .replace(/\\theta/g, 'θ')
        .replace(/\\pi/g, 'π')
        .replace(/\\sqrt\{([^}]+)\}/g, 'kök($1)')
        .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1 / $2)')
        .replace(/\\Delta/g, 'Δ');

      const parts = cleaned.split('**');
      const elements = parts.map((part, i) => {
        if (i % 2 === 1) {
          return <strong key={i} className="text-amber-300 font-bold">{part}</strong>;
        }
        return part;
      });

      if (cleaned.trim().startsWith('- ') || cleaned.trim().startsWith('* ')) {
        return (
          <li key={idx} className="ml-4 list-disc text-slate-300 pl-1 py-0.5 text-xs leading-relaxed">
            {elements}
          </li>
        );
      }
      if (cleaned.trim().match(/^\d+\./) || cleaned.trim().toLowerCase().startsWith('adım ')) {
        return (
          <div key={idx} className="text-xs text-slate-200 pl-3 font-semibold leading-relaxed my-2 border-l-2 border-emerald-400 py-1 bg-emerald-950/30 rounded-r-lg space-y-1">
            {elements}
          </div>
        );
      }
      if (cleaned.trim() === '') {
        return <div key={idx} className="h-2" />;
      }
      return (
        <p key={idx} className="text-xs text-slate-300 leading-relaxed font-normal py-0.5">
          {elements}
        </p>
      );
    });
  };

  return (
    <>
      {/* Modal: Add/Edit Topic Error */}
      {showAddErrorModal && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) { setShowAddErrorModal(false); setEditingError(null); } }}
        >
          {(() => {
            const showStep2 = isEditingError || errorSubject !== '';
            const showStep3 = isEditingError || (showStep2 && topicName.trim() !== '');
            const showStep4 = isEditingError || (showStep3 && Boolean(errorReason));
            const showPrioritySection = isEditingError || !!aiFeedback || Boolean(errorReason);
            const isFormValid = errorPublisher.trim() !== '' && errorSubject !== '' && topicName.trim() !== '' && Boolean(errorReason);

            const matchingBooks = resources.filter(r => r.subject === errorSubject);
            const matchingBranchExams = branchExams.filter(b => b.subject === errorSubject);

            return (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-5 md:p-6 shadow-2xl space-y-3 max-h-[90vh] overflow-y-auto animate-fade-in">
                <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                  <h3 className="text-sm md:text-base font-bold text-white flex items-center space-x-1.5">
                    <BookOpen className="w-4 h-4 text-rose-400" />
                    <span>{isEditingError ? 'Hata Kaydını Düzenle' : 'Hata Defterine Ekle'}</span>
                  </h3>
                  <button 
                    type="button" 
                    onClick={() => { setShowAddErrorModal(false); setEditingError(null); }}
                    className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleCreateTopicError} className="space-y-3">
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 mb-1">Ders Seçimi</label>
                        <select
                          required
                          value={errorSubject}
                          onChange={(e) => {
                            const sub = e.target.value;
                            setErrorSubject(sub);
                            setTopicName('');
                            setIsCustomTopic(false);
                            setErrorReason('' as any);
                            setSelectedExamRef('other');
                            setErrorPublisher('');
                          }}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium cursor-pointer transition-colors"
                        >
                          <option value="">Seçiniz...</option>
                          {Object.entries(YKS_SUBJECTS).flatMap(([type, subs]) => 
                            subs.map(s => <option key={`${type}-${s}`} value={s}>{s}</option>)
                          )}
                        </select>
                      </div>

                      {errorSubject && (
                        <div>
                          <label className="block text-[11px] font-bold text-slate-300 mb-1">Kaynak / Yayın Adı</label>
                          <select
                            value={selectedExamRef}
                            onChange={(e) => {
                              const val = e.target.value;
                              setSelectedExamRef(val);
                              if (val === 'other') {
                                setErrorPublisher('');
                              } else {
                                const selectedOpt = e.target.options[e.target.selectedIndex];
                                const pubName = selectedOpt.getAttribute('data-publisher') || '';
                                setErrorPublisher(pubName);
                              }
                            }}
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium cursor-pointer transition-colors mb-1.5"
                          >
                            <option value="other">Diğer / Manuel Giriş Yap</option>

                            {matchingBooks.length > 0 && (
                              <optgroup label="Soru Bankalarım">
                                {matchingBooks.map(b => (
                                  <option key={b.id} value={`book:${b.id}`} data-publisher={`${b.publisher} (${b.bookTitle})`}>
                                    📖 {b.publisher} - {b.bookTitle}
                                  </option>
                                ))}
                              </optgroup>
                            )}

                            {matchingBranchExams.length > 0 && (
                              <optgroup label="Branş Denemelerim">
                                {matchingBranchExams.map(b => (
                                  <option key={b.id} value={`branch:${b.id}`} data-publisher={b.publisher || `${b.subject} Branş Denemesi`}>
                                    🎯 {b.date} - {b.publisher || b.subject} ({b.net} Net)
                                  </option>
                                ))}
                              </optgroup>
                            )}

                            {last3GeneralMocks.length > 0 && (
                              <optgroup label="Genel Denemelerim (Son 3)">
                                {last3GeneralMocks.map(m => (
                                  <option key={m.id} value={`general:${m.id}`} data-publisher={m.title}>
                                    🏆 {m.date} - {m.title}
                                  </option>
                                ))}
                              </optgroup>
                            )}
                          </select>

                          {selectedExamRef === 'other' && (
                            <input
                              type="text"
                              required
                              placeholder="Ör: 3D Yayınları Soru Bankası"
                              value={errorPublisher}
                              onChange={(e) => setErrorPublisher(e.target.value)}
                              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium transition-colors"
                            />
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {showStep2 && (
                    <div className="pt-2 border-t border-slate-800/60 animate-fade-in space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-[11px] font-bold text-slate-300">Konu İsmi</label>
                        <button
                          type="button"
                          onClick={() => { setIsCustomTopic(!isCustomTopic); setTopicName(''); }}
                          className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer underline"
                        >
                          {isCustomTopic ? 'Listeden Seç' : '+ Farklı Konu Gir'}
                        </button>
                      </div>

                      {!isCustomTopic && YKS_CURRICULUM_TOPICS[errorSubject] ? (
                        <select
                          required
                          value={topicName}
                          onChange={(e) => setTopicName(e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium cursor-pointer transition-colors"
                        >
                          <option value="">Konu Seçin...</option>
                          {YKS_CURRICULUM_TOPICS[errorSubject].map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          required
                          placeholder="Ör: Paragrafta Anlatım Akışı"
                          value={topicName}
                          onChange={(e) => setTopicName(e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium transition-colors"
                        />
                      )}
                    </div>
                  )}

                  {showStep3 && (
                    <div className="pt-2 border-t border-slate-800/60 animate-fade-in space-y-2">
                      <label className="block text-[11px] font-bold text-slate-300">Hata Nedeni</label>
                      <div className="grid grid-cols-2 gap-1.5">
                        {Object.entries(ERROR_REASON_LABELS).map(([key, label]) => {
                          const isSelected = errorReason === key;
                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() => {
                                setErrorReason(key as ErrorReason);
                                let defaultPriority = 5;
                                if (key === 'bilgi_eksigi') defaultPriority = 9;
                                else if (key === 'soru_kokunu_yanlis_okuma') defaultPriority = 7;
                                else if (key === 'iki_sik_arasinda') defaultPriority = 6;
                                else if (key === 'zaman_yetmedi') defaultPriority = 5;
                                else if (key === 'dikkat_hatasi') defaultPriority = 4;
                                setPriority(defaultPriority);
                              }}
                              className={`p-2 rounded-xl text-[11px] font-bold text-left transition-all cursor-pointer border ${
                                isSelected
                                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-sm'
                                  : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:text-white hover:bg-slate-800'
                              }`}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {showStep4 && (
                    <div className="pt-2 border-t border-slate-800/60 animate-fade-in space-y-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 mb-1">
                          📸 Soru Fotoğrafı Yükle <span className="text-[10px] text-slate-500 font-normal">(İsteğe Bağlı)</span>
                        </label>

                        {errorImageUrl ? (
                          <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-slate-950 p-2 flex items-center justify-between">
                            <div className="flex items-center space-x-3 min-w-0">
                              <img src={errorImageUrl} alt="Soru Önizleme" className="w-12 h-12 object-cover rounded-lg border border-slate-800 shrink-0" />
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-emerald-400 flex items-center space-x-1">
                                  <span>Yüklendi</span>
                                </p>
                                {imageStats && (
                                  <p className="text-[10px] text-slate-400 font-mono">
                                    {imageStats.compressedKb} KB <span className="text-emerald-400 font-bold">(-%{Math.round((1 - imageStats.compressedKb / imageStats.originalKb) * 100)})</span>
                                  </p>
                                )}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={handleRemoveImage}
                              className="p-1.5 bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0"
                            >
                              Kaldır
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col sm:flex-row items-center gap-2">
                            <label className="flex-1 w-full flex items-center justify-center space-x-2 bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 hover:border-indigo-500/50 rounded-xl px-3 py-2 text-xs font-bold transition-all cursor-pointer">
                              {isCompressingImage ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                                  <span>Sıkıştırılıyor...</span>
                                </>
                              ) : (
                                <>
                                  <UploadCloud className="w-4 h-4 text-indigo-400" />
                                  <span>Görsel Yükle</span>
                                </>
                              )}
                              <input
                                type="file"
                                accept="image/*"
                                disabled={isCompressingImage}
                                onChange={handleImageSelect}
                                className="hidden"
                              />
                            </label>
                          </div>
                        )}
                        {imageError && <p className="text-[10px] text-rose-400 font-medium mt-1">{imageError}</p>}
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-[11px] font-bold text-slate-300">
                            Çözüm Notları / Yapay Zeka Analizi
                          </label>
                          <button
                            type="button"
                            disabled={isAnalyzing || !topicName.trim()}
                            onClick={handleAIAnalyzeError}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center space-x-1 border ${
                              aiButtonFaded
                                ? 'bg-slate-800 text-slate-400 border-slate-700 cursor-not-allowed opacity-60'
                                : 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-400/40 cursor-pointer shadow-sm'
                            }`}
                          >
                            {isAnalyzing ? (
                              <>
                                <Loader2 className="w-3 h-3 animate-spin" />
                                <span>Analiz Ediliyor...</span>
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-3 h-3 text-indigo-200" />
                                <span>Yapay Zeka Analizi Al</span>
                              </>
                            )}
                          </button>
                        </div>

                        <textarea
                          rows={3}
                          placeholder="Çözüm notlarınızı girin veya yapay zeka analizini kullanın..."
                          value={solutionNotes}
                          onChange={(e) => setSolutionNotes(e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium transition-colors"
                        />

                        {aiFeedback && (
                          <div className="p-3 bg-indigo-950/50 border border-indigo-500/30 rounded-xl space-y-1.5 text-xs animate-fade-in">
                            <div className="flex items-center space-x-1.5 font-bold text-indigo-300">
                              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                              <span>Yapay Zeka Analiz Değerlendirmesi</span>
                            </div>
                            <p className="text-slate-300 text-[11.5px] leading-relaxed whitespace-pre-line font-normal">{aiFeedback}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {showPrioritySection && (
                    <div className="pt-2 border-t border-slate-800/60 animate-fade-in space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-[11px] font-bold text-slate-300">Öncelik Derecesi (1-10)</label>
                        <span className="text-xs font-mono font-bold text-indigo-400">{priority} / 10</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={priority}
                        onChange={(e) => setPriority(Number(e.target.value))}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => { setShowAddErrorModal(false); setEditingError(null); }}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      İptal
                    </button>
                    <button
                      type="submit"
                      disabled={!isFormValid}
                      className={`px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isFormValid
                          ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/30'
                          : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                      }`}
                    >
                      {isEditingError ? 'Kaydı Güncelle' : 'Hata Defterine Kaydet'}
                    </button>
                  </div>
                </form>
              </div>
            );
          })()}
        </div>
      )}

      {/* Modal: Add/Edit Branch Exam */}
      {showAddExamModal && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
          onClick={(e) => { if (e.target === e.currentTarget) { setShowAddExamModal(false); setEditingExam(null); } }}
        >
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-fade-in my-8 relative overflow-hidden">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {isEditingExam ? 'Branş Denemesini Düzenle' : 'Yeni Branş Denemesi Gir'}
                  </h3>
                  <p className="text-xs text-slate-400">Deneme sonuçlarını ve detaylarını sisteme kaydedin</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => { setShowAddExamModal(false); setEditingExam(null); }}
                className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBranchExam} className="space-y-4">
              
              {/* Live Net Preview Card */}
              {(() => {
                const c = Number(correct.toString().replace(',', '.')) || 0;
                const w = Number(wrong.toString().replace(',', '.')) || 0;
                const calcNet = Math.max(0, c - w * 0.25);
                return (
                  <div className="bg-gradient-to-r from-indigo-950/50 via-purple-950/30 to-slate-950 p-4 rounded-2xl border border-indigo-500/20 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">Otomatik Hesaplanan Net</span>
                      <h4 className="text-xs text-slate-300 font-medium">Doğru: <strong className="text-emerald-400 font-mono">{c}</strong> | Yanlış: <strong className="text-rose-400 font-mono">{w}</strong></h4>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black text-indigo-300 font-mono">{calcNet.toFixed(2).replace('.', ',')}</span>
                      <span className="text-[10px] text-slate-400 block font-mono">Net</span>
                    </div>
                  </div>
                );
              })()}

              {/* Sınav Türü Pills & Tarih */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Sınav Türü</label>
                  <div className="flex items-center bg-slate-950 p-1 rounded-2xl border border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        setExamType('TYT');
                        setExamSubject(YKS_SUBJECTS.TYT[0]);
                      }}
                      className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        examType === 'TYT'
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      TYT
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setExamType('AYT');
                        setExamSubject(YKS_SUBJECTS.AYT[0]);
                      }}
                      className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        examType === 'AYT'
                          ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      AYT
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Tarih</label>
                  <input
                    type="date"
                    required
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              {/* Ders & Yayın Evi */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Ders Seçimi</label>
                  <select
                    value={examSubject}
                    onChange={(e) => setExamSubject(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer transition-colors"
                  >
                    {YKS_SUBJECTS[examType].map((sub) => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Yayın Evi / Yayın Adı</label>
                  <input
                    type="text"
                    required
                    placeholder="Ör: Bilgi Sarmal 15'li Deneme #3"
                    value={publisher}
                    onChange={(e) => setPublisher(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              {/* Doğru / Yanlış / Boş / Süre Grid */}
              <div className="grid grid-cols-4 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-emerald-400 mb-1 text-center">Doğru</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="0"
                    value={correct}
                    onChange={(e) => setCorrect(e.target.value)}
                    className="w-full bg-slate-950 border border-emerald-500/30 focus:border-emerald-500 rounded-2xl px-2 py-2 text-xs text-center font-mono font-bold text-emerald-400 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-rose-400 mb-1 text-center">Yanlış</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="0"
                    value={wrong}
                    onChange={(e) => setWrong(e.target.value)}
                    className="w-full bg-slate-950 border border-rose-500/30 focus:border-rose-500 rounded-2xl px-2 py-2 text-xs text-center font-mono font-bold text-rose-400 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1 text-center">Boş</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="0"
                    value={empty}
                    onChange={(e) => setEmpty(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-slate-600 rounded-2xl px-2 py-2 text-xs text-center font-mono font-semibold text-slate-300 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-amber-400 mb-1 text-center">Süre (dk)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="45"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(e.target.value)}
                    className="w-full bg-slate-950 border border-amber-500/30 focus:border-amber-500 rounded-2xl px-2 py-2 text-xs text-center font-mono font-bold text-amber-300 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Deneme Notu / Açıklama (Not Girişi) */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center space-x-1.5">
                  <FileText className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Hızlı Not / Açıklama (İsteğe Bağlı)</span>
                </label>
                <input
                  type="text"
                  placeholder="Ör: Trigonometri soruları zordu, süre yetti."
                  value={examNotes}
                  onChange={(e) => setExamNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              {/* Analiz Edildi Checkbox */}
              <div 
                onClick={() => setIsAnalyzed(!isAnalyzed)}
                className="flex items-center space-x-3 p-3 bg-slate-950/80 rounded-2xl border border-slate-800 cursor-pointer hover:border-slate-700 transition-all select-none"
              >
                <input
                  type="checkbox"
                  checked={isAnalyzed}
                  onChange={() => {}} // handled by parent onClick
                  className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0 cursor-pointer"
                />
                <div>
                  <span className="text-xs font-bold text-slate-200 block">Yanlışlar Analiz Edildi mi?</span>
                  <span className="text-[10px] text-slate-400 block">Eğer kontrol edilip hata defterine işlendiyse işaretleyin</span>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => { setShowAddExamModal(false); setEditingExam(null); }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-2xl text-xs font-bold transition-all cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-bold transition-all cursor-pointer shadow-lg shadow-indigo-600/30 flex items-center space-x-1.5"
                >
                  <Target className="w-4 h-4" />
                  <span>{isEditingExam ? 'Denemeyi Güncelle' : 'Denemeyi Kaydet'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDeleteModal
        isOpen={deletingItem !== null}
        title={deletingItem?.type === 'error' ? 'Hata Kaydını Sil' : 'Branş Denemesini Sil'}
        itemName={deletingItem?.title}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeletingItem(null)}
      />

      {/* Modal: AI Tip Modal */}
      {activeTipTopic && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setActiveTipTopic(null); }}
        >
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-5 md:p-6 shadow-2xl space-y-4 animate-fade-in max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">{activeTipTopic.topicName}</h3>
                  <p className="text-[10px] text-indigo-400 font-bold uppercase">{activeTipTopic.subject} - Sık Yapılan Hatalar & Tüyolar</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setActiveTipTopic(null)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {tipLoading ? (
              <div className="py-12 text-center space-y-3">
                <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
                <p className="text-xs text-slate-300 font-semibold">Yapay zeka tüyoları hazırlanıyor...</p>
              </div>
            ) : tipError ? (
              <div className="py-8 text-center space-y-3">
                <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto" />
                <p className="text-xs text-rose-400 font-semibold">{tipError}</p>
                <button
                  onClick={() => handleFetchTopicTips(activeTipTopic.subject, activeTipTopic.topicName)}
                  className="px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold"
                >
                  Yeniden Dene
                </button>
              </div>
            ) : topicTipData ? (
              <div className="space-y-4 text-xs">
                {topicTipData.summary && (
                  <div className="bg-indigo-950/40 border border-indigo-500/30 p-3 rounded-xl text-indigo-200 leading-relaxed">
                    {topicTipData.summary}
                  </div>
                )}

                {topicTipData.mistakes.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-bold text-rose-400 flex items-center space-x-1 text-xs">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Sık Yapılan Hatalar & Doğruları</span>
                    </h4>
                    <div className="space-y-2">
                      {topicTipData.mistakes.map((m, idx) => (
                        <div key={idx} className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                          <p className="text-rose-400 font-semibold">❌ {m.mistake}</p>
                          <p className="text-emerald-400 font-semibold">✅ {m.correction}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {topicTipData.tips.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-bold text-amber-400 flex items-center space-x-1 text-xs">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Hayati İpuçları</span>
                    </h4>
                    <ul className="space-y-1.5">
                      {topicTipData.tips.map((t, idx) => (
                        <li key={idx} className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-slate-300 flex items-start space-x-2">
                          <span className="text-amber-400 font-bold">•</span>
                          <span>{t}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : null}

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setActiveTipTopic(null)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Anladım, Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 2: GÖRSEL SAKLAMA & YAPAY ZEKA ÇÖZÜM MODALI ── */}
      {previewImage && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 z-50 overflow-y-auto animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl space-y-4 my-auto relative max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white truncate max-w-xs sm:max-w-md">
                    {previewImage.title}
                  </h3>
                  <p className="text-[11px] text-slate-400">Yapay zeka destekli soru analiz ve çözüm merkezi</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-all cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 min-h-0 overflow-y-auto">
              {/* Sol Taraf: Görsel */}
              <div className="bg-slate-950 p-2.5 rounded-2xl border border-slate-800 flex flex-col items-center justify-center min-h-[250px] relative overflow-hidden group">
                <img
                  src={previewImage.url}
                  alt={previewImage.title}
                  className="max-h-[60vh] md:max-h-full w-auto object-contain rounded-xl"
                />
                <a
                  href={previewImage.url}
                  target="_blank"
                  rel="noreferrer"
                  className="absolute bottom-3 right-3 px-2.5 py-1 bg-slate-900/80 hover:bg-slate-900 text-slate-300 hover:text-white border border-slate-700/60 rounded-lg text-[10px] font-semibold transition-all flex items-center space-x-1"
                >
                  <Maximize2 className="w-3 h-3" />
                  <span>Tam Boyut Gör</span>
                </a>
              </div>

              {/* Sağ Taraf: Yapay Zeka Özellikleri (Çözüm, Benzer Soru, Soru Karnesi) */}
              <div className="flex flex-col space-y-3 min-h-0">
                {/* Sekme Seçici: Soru Çözümü & Benzer Sorular & Soru Karnesi */}
                <div className="flex items-center space-x-1.5 border-b border-slate-800 pb-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setAiModalTab('solution');
                      triggerFullPhotoAnalysis('solution');
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                      aiModalTab === 'solution'
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    <Brain className="w-3.5 h-3.5" />
                    <span>Soru Çözümü</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAiModalTab('similar');
                      triggerFullPhotoAnalysis('similar');
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                      aiModalTab === 'similar'
                        ? 'bg-cyan-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Benzer Sorular ({similarQuestionsList.length}/3)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAiModalTab('report');
                      triggerFullPhotoAnalysis('report');
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                      aiModalTab === 'report'
                        ? 'bg-amber-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Soru Karnesi</span>
                  </button>
                </div>

                {/* TAB 1: Soru Çözümü */}
                {aiModalTab === 'solution' && (
                  <div className="flex-1 flex flex-col space-y-2 min-h-0">
                    <div className="flex items-center justify-between pb-1">
                      <span className="text-[11px] font-semibold text-slate-400">Görsel Soru Çözüm Rehberi</span>
                      {solveSolution && (
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                          Çözüldü
                        </span>
                      )}
                    </div>

                    {solveLoading ? (
                      <div className="py-12 text-center space-y-3 my-auto">
                        <Loader2 className="w-8 h-8 text-purple-400 animate-spin mx-auto" />
                        <p className="text-xs text-slate-300 font-semibold">Soru yapay zeka tarafından adım adım çözülüyor...</p>
                      </div>
                    ) : solveError ? (
                      <div className="p-3 bg-rose-950/30 border border-rose-800/50 rounded-xl space-y-2 text-center my-auto">
                        <p className="text-xs text-rose-400 font-medium">{solveError}</p>
                        <button
                          type="button"
                          onClick={() => triggerFullPhotoAnalysis('solution')}
                          className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg transition-all cursor-pointer"
                        >
                          Yeniden Deneyin
                        </button>
                      </div>
                    ) : solveSolution ? (
                      <div className="space-y-2 overflow-y-auto pr-1 max-h-[45vh] flex-1">
                        {formatSolutionText(solveSolution)}
                      </div>
                    ) : (
                      <div className="py-8 text-center space-y-3 my-auto">
                        <Brain className="w-10 h-10 text-purple-400/50 mx-auto" />
                        <p className="text-xs text-slate-400">Bu sorunun henüz adım adım yapay zeka çözümü üretilmedi.</p>
                        <button
                          type="button"
                          onClick={() => triggerFullPhotoAnalysis('solution')}
                          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-purple-600/20 transition-all cursor-pointer inline-flex items-center space-x-1.5"
                        >
                          <Sparkles className="w-4 h-4 text-purple-200" />
                          <span>Yapay Zeka Çözümünü Al</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: Benzer Sorular */}
                {aiModalTab === 'similar' && (
                  <div className="flex-1 flex flex-col space-y-3 min-h-0">
                    {/* Üretilmiş Soru Seçici & Yeni Soru Üret Butonu */}
                    <div className="flex items-center justify-between gap-2 shrink-0">
                      {similarQuestionsList.length > 0 ? (
                        <div className="flex items-center space-x-1 overflow-x-auto">
                          {similarQuestionsList.map((_, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setActiveSimilarIdx(idx)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                                activeSimilarIdx === idx
                                  ? 'bg-cyan-600 text-white border border-cyan-400/40 shadow-sm'
                                  : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
                              }`}
                            >
                              Soru {idx + 1}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[11px] font-semibold text-slate-400">Benzer Soru Paneli</span>
                      )}

                      {similarQuestionsList.length < 3 && (
                        <button
                          type="button"
                          disabled={similarLoading}
                          onClick={() => triggerFullPhotoAnalysis('similar')}
                          className="px-2.5 py-1 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 disabled:opacity-50 text-white text-[11px] font-bold rounded-lg transition-all cursor-pointer flex items-center space-x-1 shrink-0 ml-auto"
                        >
                          {similarLoading ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin" />
                              <span>Üretiliyor...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3 h-3 text-cyan-200" />
                              <span>{similarQuestionsList.length > 0 ? `+ Yeni Soru (${similarQuestionsList.length}/3)` : 'Benzer Soru Üret'}</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    {/* Soru İçeriği & Gizli Çözüm Alanı */}
                    {similarLoading && similarQuestionsList.length === 0 ? (
                      <div className="py-12 text-center space-y-3 my-auto">
                        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
                        <p className="text-xs text-slate-300 font-semibold">Yapay zeka benzer özgün soru üretiyor...</p>
                      </div>
                    ) : similarError ? (
                      <div className="p-3 bg-rose-950/30 border border-rose-800/50 rounded-xl space-y-2 text-center my-auto">
                        <p className="text-xs text-rose-400 font-medium">{similarError}</p>
                        {similarQuestionsList.length < 3 && (
                          <button
                            type="button"
                            onClick={() => triggerFullPhotoAnalysis('similar')}
                            className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg transition-all cursor-pointer"
                          >
                            Yeniden Deneyin
                          </button>
                        )}
                      </div>
                    ) : similarQuestionsList.length > 0 && similarQuestionsList[activeSimilarIdx] ? (
                      (() => {
                        const activeQ = similarQuestionsList[activeSimilarIdx];
                        const isSolutionVisible = !!showSolutionMap[activeSimilarIdx];

                        return (
                          <div className="space-y-3 overflow-y-auto pr-1 max-h-[45vh] flex-1">
                            {/* Soru Metni */}
                            <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl space-y-2">
                              <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block">Özgün Benzer Soru #{activeSimilarIdx + 1}</span>
                              <div className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed font-medium">
                                {activeQ.question}
                              </div>
                            </div>

                            {/* Çözüm ve Doğru Cevap Alanı (Gizlenebilir) */}
                            <div className="bg-slate-900/80 border border-slate-800/80 p-3.5 rounded-xl space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Çözüm & Doğru Cevap</span>
                                <button
                                  type="button"
                                  onClick={() => setShowSolutionMap(prev => ({ ...prev, [activeSimilarIdx]: !isSolutionVisible }))}
                                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer flex items-center space-x-1.5"
                                >
                                  {isSolutionVisible ? (
                                    <>
                                      <EyeOff className="w-3.5 h-3.5 text-rose-400" />
                                      <span>Çözümü Gizle</span>
                                    </>
                                  ) : (
                                    <>
                                      <Eye className="w-3.5 h-3.5 text-emerald-400" />
                                      <span>Çözümü Gör</span>
                                    </>
                                  )}
                                </button>
                              </div>

                              {isSolutionVisible ? (
                                <div className="space-y-2 pt-1 animate-fade-in border-t border-slate-800/80">
                                  {activeQ.correctAnswer && (
                                    <div className="inline-block bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-1 rounded-lg text-xs font-bold">
                                      ✅ {activeQ.correctAnswer}
                                    </div>
                                  )}
                                  <div className="text-xs text-slate-300 leading-relaxed pt-1">
                                    {formatSolutionText(activeQ.solution)}
                                  </div>
                                </div>
                              ) : (
                                <p className="text-[11px] text-slate-500 italic py-1">
                                  Soruyu kendiniz çözmeyi deneyin. Cevabı ve açıklamalı çözümü görmek için "Çözümü Gör" butonuna tıklayabilirsiniz.
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })()
                    ) : (
                      <div className="py-8 text-center space-y-3 my-auto">
                        <HelpCircle className="w-10 h-10 text-cyan-400/50 mx-auto" />
                        <p className="text-xs text-slate-400">Bu soru için henüz benzer özgün soru üretilmedi.</p>
                        <button
                          type="button"
                          disabled={similarLoading}
                          onClick={() => triggerFullPhotoAnalysis('similar')}
                          className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-cyan-600/20 transition-all cursor-pointer inline-flex items-center space-x-1.5"
                        >
                          <Sparkles className="w-4 h-4 text-cyan-200" />
                          <span>Benzer Soru Oluştur (1/3)</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 3: Soru Karnesi */}
                {aiModalTab === 'report' && (
                  <div className="flex-1 flex flex-col space-y-2 min-h-0">
                    <div className="flex items-center justify-between pb-1">
                      <span className="text-[11px] font-semibold text-slate-400">Detaylı Soru Karnesi & Çeldirici Analizi</span>
                      {reportText && (
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                          Kayıtlı
                        </span>
                      )}
                    </div>

                    {reportLoading ? (
                      <div className="py-12 text-center space-y-3 my-auto">
                        <Loader2 className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
                        <p className="text-xs text-slate-300 font-semibold">Soru karnesi ve detaylı çeldirici analizi hazırlanıyor...</p>
                      </div>
                    ) : reportError ? (
                      <div className="p-3 bg-rose-950/30 border border-rose-800/50 rounded-xl space-y-2 text-center my-auto">
                        <p className="text-xs text-rose-400 font-medium">{reportError}</p>
                        <button
                          type="button"
                          onClick={() => triggerFullPhotoAnalysis('report')}
                          className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-lg transition-all cursor-pointer"
                        >
                          Yeniden Deneyin
                        </button>
                      </div>
                    ) : reportText ? (
                      <div className="space-y-2 overflow-y-auto pr-1 max-h-[45vh] flex-1">
                        {formatAnalysisTable(reportText)}
                      </div>
                    ) : (
                      <div className="py-8 text-center space-y-3 my-auto">
                        <FileText className="w-10 h-10 text-amber-400/50 mx-auto" />
                        <p className="text-xs text-slate-400">Bu sorunun henüz detaylı soru karnesi ve çeldirici analizi oluşturulmadı.</p>
                        <button
                          type="button"
                          onClick={() => triggerFullPhotoAnalysis('report')}
                          className="px-4 py-2 bg-gradient-to-r from-amber-600 to-indigo-600 hover:from-amber-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-amber-600/20 transition-all cursor-pointer inline-flex items-center space-x-1.5"
                        >
                          <Sparkles className="w-4 h-4 text-amber-200" />
                          <span>Soru Karnesi Oluştur</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
