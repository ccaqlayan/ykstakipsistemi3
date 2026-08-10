import React from 'react';
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
  Zap 
} from 'lucide-react';
import { BranchExam, TopicErrorItem, ErrorReason, GeneralMockExam, ResourceItem } from '../../types';
import { ConfirmDeleteModal } from '../ConfirmDeleteModal';

interface BranchModalsProps {
  // Error Modal
  showAddErrorModal: boolean;
  setShowAddErrorModal: (val: boolean) => void;
  editingError: TopicErrorItem | null;
  setEditingError: (val: TopicErrorItem | null) => void;
  errorSubject: string;
  setErrorSubject: (val: string) => void;
  topicName: string;
  setTopicName: (val: string) => void;
  isCustomTopic: boolean;
  setIsCustomTopic: (val: boolean) => void;
  errorPublisher: string;
  setErrorPublisher: (val: string) => void;
  selectedExamRef: string;
  setSelectedExamRef: (val: string) => void;
  errorReason: ErrorReason;
  setErrorReason: (val: ErrorReason) => void;
  priority: string | number;
  setPriority: (val: string | number) => void;
  solutionNotes: string;
  setSolutionNotes: (val: string) => void;
  isAnalyzing: boolean;
  aiFeedback: string;
  setAiFeedback: (val: string) => void;
  aiSuccess: boolean;
  aiButtonFaded: boolean;
  errorImageUrl: string;
  setErrorImageUrl: (val: string) => void;
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

  // Exam Modal
  showAddExamModal: boolean;
  setShowAddExamModal: (val: boolean) => void;
  editingExam: BranchExam | null;
  setEditingExam: (val: BranchExam | null) => void;
  examDate: string;
  setExamDate: (val: string) => void;
  examType: 'TYT' | 'AYT';
  setExamType: (val: 'TYT' | 'AYT') => void;
  examSubject: string;
  setExamSubject: (val: string) => void;
  publisher: string;
  setPublisher: (val: string) => void;
  correct: number | string;
  setCorrect: (val: number | string) => void;
  wrong: number | string;
  setWrong: (val: number | string) => void;
  empty: number | string;
  setEmpty: (val: number | string) => void;
  durationMinutes: number | string;
  setDurationMinutes: (val: number | string) => void;
  isAnalyzed: boolean;
  setIsAnalyzed: (val: boolean) => void;
  handleCreateBranchExam: (e: React.FormEvent) => void;
  YKS_SUBJECTS: Record<string, string[]>;

  // Delete Modal
  deletingItem: { type: 'error' | 'exam'; id: string; title: string } | null;
  setDeletingItem: (item: { type: 'error' | 'exam'; id: string; title: string } | null) => void;
  handleConfirmDelete: () => void;

  // AI Tip Modal
  activeTipTopic: { subject: string; topicName: string } | null;
  setActiveTipTopic: (val: { subject: string; topicName: string } | null) => void;
  tipLoading: boolean;
  topicTipData: { mistakes: { mistake: string; correction: string }[]; tips: string[]; summary?: string } | null;
  tipError: string | null;
  handleFetchTopicTips: (subject: string, topicName: string) => void;

  // AI Solution & Similar Modal
  solveSolution: string | null;
  setSolveSolution: (val: string | null) => void;
  solveLoading: boolean;
  solveError: string | null;
  similarLoading: boolean;
  similarQuestionsList: any[];
  similarError: string | null;
  activeSimilarIdx: number;
  setActiveSimilarIdx: (val: number) => void;
  aiModalTab: 'solution' | 'similar';
  setAiModalTab: (val: 'solution' | 'similar') => void;
  previewImage: { url: string; title: string } | null;
  setPreviewImage: (val: { url: string; title: string } | null) => void;
  handleSolveQuestion: (imgUrl: string, titleStr: string) => void;
  handleGenerateSimilarQuestions: (imgUrl: string, titleStr: string) => void;

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
            const showPrioritySection = isEditingError || !!aiFeedback;
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
                    className="text-slate-400 hover:text-white transition-colors"
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
                              onClick={() => setErrorReason(key as ErrorReason)}
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

                      <div>
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
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) { setShowAddExamModal(false); setEditingExam(null); } }}
        >
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 md:p-6 shadow-2xl space-y-4 animate-fade-in">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm md:text-base font-bold text-white flex items-center space-x-1.5">
                <Target className="w-4 h-4 text-indigo-400" />
                <span>{isEditingExam ? 'Branş Denemesini Düzenle' : 'Yeni Branş Denemesi Gir'}</span>
              </h3>
              <button 
                type="button" 
                onClick={() => { setShowAddExamModal(false); setEditingExam(null); }}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBranchExam} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Tarih</label>
                  <input
                    type="date"
                    required
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Sınav Türü</label>
                  <select
                    value={examType}
                    onChange={(e) => {
                      const t = e.target.value as 'TYT' | 'AYT';
                      setExamType(t);
                      setExamSubject(YKS_SUBJECTS[t][0]);
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="TYT">TYT</option>
                    <option value="AYT">AYT</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Ders</label>
                  <select
                    value={examSubject}
                    onChange={(e) => setExamSubject(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    {YKS_SUBJECTS[examType].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Yayınevi / Yayın Adı</label>
                  <input
                    type="text"
                    required
                    placeholder="Ör: 3D Yayınları Deneme #4"
                    value={publisher}
                    onChange={(e) => setPublisher(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-emerald-400 mb-1">Doğru</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="0"
                    value={correct}
                    onChange={(e) => setCorrect(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-rose-400 mb-1">Yanlış</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="0"
                    value={wrong}
                    onChange={(e) => setWrong(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Boş</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="0"
                    value={empty}
                    onChange={(e) => setEmpty(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Çözüm Süresi (Dakika)</label>
                <input
                  type="number"
                  min="0"
                  placeholder="Ör: 45"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="isAnalyzedCheck"
                  checked={isAnalyzed}
                  onChange={(e) => setIsAnalyzed(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0 cursor-pointer"
                />
                <label htmlFor="isAnalyzedCheck" className="text-xs text-slate-300 cursor-pointer select-none font-medium">
                  Yanlışlar analiz edildi ve hata defterine işlendi
                </label>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => { setShowAddExamModal(false); setEditingExam(null); }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md shadow-indigo-600/30"
                >
                  {isEditingExam ? 'Denemeyi Güncelle' : 'Denemeyi Kaydet'}
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
                className="text-slate-400 hover:text-white transition-colors"
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

      {/* Modal: Image Preview */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setPreviewImage(null); }}
        >
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full p-4 shadow-2xl space-y-3 animate-fade-in relative flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 shrink-0">
              <h3 className="text-xs sm:text-sm font-bold text-white truncate max-w-[80%]">{previewImage.title}</h3>
              <button 
                type="button" 
                onClick={() => setPreviewImage(null)}
                className="text-slate-400 hover:text-white transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-auto flex items-center justify-center bg-slate-950 rounded-xl p-2">
              <img src={previewImage.url} alt={previewImage.title} className="max-w-full max-h-[75vh] object-contain rounded-lg" />
            </div>
          </div>
        </div>
      )}
    </>
  );
};
