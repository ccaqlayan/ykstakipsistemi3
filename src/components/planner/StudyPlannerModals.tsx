import React from 'react';
import { 
  X, 
  Edit3, 
  Trash2, 
  Sparkles, 
  CheckCircle, 
  ListFilter, 
  BookOpen, 
  AlertTriangle, 
  History, 
  CalendarDays, 
  ChevronLeft, 
  ChevronRight, 
  RotateCcw, 
  Settings, 
  Edit2, 
  Check, 
  Plus,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { StudyPlanItem, DayOfWeek, QuestionLog, DailyStudyTimeLog } from '../../types';
import { YKS_SUBJECTS, YKS_CURRICULUM_TOPICS, DEFAULT_TASK_TYPES } from '../../data/initialData';
import { ConfirmDeleteModal } from '../ConfirmDeleteModal';
import { isSameWeekLabel, formatWeekLabelWithYear } from '../../utils/dateUtils';

export interface DailyStudyLogModalData {
  day: DayOfWeek;
  dateStr: string; // ISO format 'YYYY-MM-DD'
  displayDate: string; // '14 Ağu'
  currentMinutes: number;
  currentNotes?: string;
  isManual: boolean;
  taskMinutes: number;
}

interface StudyPlannerModalsProps {
  showAddModal: boolean;
  setShowAddModal: (show: boolean) => void;
  targetDaysForAdd: DayOfWeek[];
  setTargetDaysForAdd: React.Dispatch<React.SetStateAction<DayOfWeek[]>> | ((days: DayOfWeek[]) => void);
  subject: string;
  setSubject: (sub: string) => void;
  topic: string;
  setTopic: (top: string) => void;
  taskType: string;
  setTaskType: (type: string) => void;
  plannedMinutes: number;
  setPlannedMinutes: (mins: number) => void;
  targetQuestionCount: number | '';
  setTargetQuestionCount: (count: number | '') => void;
  notes: string;
  setNotes: (notes: string) => void;
  DAYS: DayOfWeek[];
  actualTaskTypes: string[];
  handleCreatePlan: (e: React.FormEvent) => void;
  
  editingPlan: StudyPlanItem | null;
  setEditingPlan: (plan: StudyPlanItem | null) => void;
  handleSaveEditPlan: (e: React.FormEvent) => void;
  
  completingPlan: StudyPlanItem | null;
  setCompletingPlan: (plan: StudyPlanItem | null) => void;
  completionMinutesInput: number;
  setCompletionMinutesInput: (mins: number) => void;
  showModalQuickStatus: boolean;
  setShowModalQuickStatus: (show: boolean) => void;
  completionStatusInput: 'pending' | 'in_progress' | 'completed';
  setCompletionStatusInput: (status: 'pending' | 'in_progress' | 'completed') => void;
  showModalQuickReflection: boolean;
  setShowModalQuickReflection: (show: boolean) => void;
  completionReflectionInput: string | undefined;
  setCompletionReflectionInput: (reflection: string | undefined) => void;
  handleConfirmCompletion: (e: React.FormEvent) => void;
  QUICK_REFLECTIONS: Array<{ label: string; color: string; activeColor: string; icon: string }>;
  
  deletingPlan: { id: string; title: string } | null;
  setDeletingPlan: (plan: { id: string; title: string } | null) => void;
  studyPlans: StudyPlanItem[];
  removeLinkedQuestionLog: (studyPlanId: string, planTopic?: string, planSubject?: string) => void;
  onDeletePlan: (id: string) => void;

  questionPromptPlan: StudyPlanItem | null;
  setQuestionPromptPlan: (plan: StudyPlanItem | null) => void;
  questionPromptSolvedCount: number | '';
  setQuestionPromptSolvedCount: (count: number | '') => void;
  questionPromptCorrectCount: number | '';
  setQuestionPromptCorrectCount: (count: number | '') => void;
  questionPromptWrongCount: number | '';
  setQuestionPromptWrongCount: (count: number | '') => void;
  questionPromptNotes: string;
  setQuestionPromptNotes: (notes: string) => void;
  handleConfirmQuestionPrompt: (e: React.FormEvent) => void;

  uncompleteConfirm: { plan: StudyPlanItem; targetStatus: 'pending' | 'in_progress'; linkedLogs: QuestionLog[] } | null;
  setUncompleteConfirm: (val: any) => void;
  handleConfirmUncompleteWithLogDeletion: () => void;

  showArchiveConfirm: boolean;
  setShowArchiveConfirm: (show: boolean) => void;
  archiveWeekOffset: number;
  setArchiveWeekOffset: React.Dispatch<React.SetStateAction<number>>;
  archiveChoice: 'keep_template' | 'fresh_start' | null;
  setArchiveChoice: (choice: 'keep_template' | 'fresh_start' | null) => void;
  overwriteStep: 0 | 1 | 2;
  setOverwriteStep: (step: 0 | 1 | 2) => void;
  getOffsetDate: (offsetInWeeks: number) => Date;
  getWeekLabel: (d: Date) => string;
  getOffsetBadgeText: (offset: number) => string;
  CHRONOLOGICAL_SEEDS: string[];
  executeArchiveAndReset: (choice: 'keep_template' | 'fresh_start', targetWeekLabel: string) => void;

  showTaskTypeModal: boolean;
  setShowTaskTypeModal: (show: boolean) => void;
  editingTaskTypeIndex: number | null;
  setEditingTaskTypeIndex: (idx: number | null) => void;
  editingTaskTypeValue: string;
  setEditingTaskTypeValue: (val: string) => void;
  deletingTaskTypeIndex: number | null;
  setDeletingTaskTypeIndex: (idx: number | null) => void;
  deletingStep: number;
  setDeletingStep: (step: 0 | 1 | 2) => void;
  newTaskTypeValue: string;
  setNewTaskTypeValue: (val: string) => void;
  handleAddTaskType: () => void;
  handleEditTaskType: (index: number) => void;
  handleDeleteTaskType: (index: number) => void;
  onUpdateTaskTypes?: (taskTypes: string[], actionText?: string) => void;
  handleAiSuggestTask?: () => void;
  aiSuggestLoading?: boolean;
  aiSuggestError?: string | null;
  aiSuggestReason?: string | null;
  coachDataSettings?: any;
  topicStatuses?: Record<string, 'Çalışmadım' | 'Erteledim' | 'Zor Geldi' | 'Çalıştım' | 'Uzmanlaştım'>;
  completedPastTopics?: string[];

  dailyStudyLogModalData?: DailyStudyLogModalData | null;
  setDailyStudyLogModalData?: (data: DailyStudyLogModalData | null) => void;
  handleSaveDailyStudyLogModal?: (minutes: number, notes?: string) => void;
  handleDeleteDailyStudyLogModal?: () => void;
}

export const StudyPlannerModals: React.FC<StudyPlannerModalsProps> = ({
  showAddModal,
  setShowAddModal,
  targetDaysForAdd,
  setTargetDaysForAdd,
  subject,
  setSubject,
  topic,
  setTopic,
  taskType,
  setTaskType,
  plannedMinutes,
  setPlannedMinutes,
  targetQuestionCount,
  setTargetQuestionCount,
  notes,
  setNotes,
  DAYS,
  actualTaskTypes,
  handleCreatePlan,
  editingPlan,
  setEditingPlan,
  handleSaveEditPlan,
  completingPlan,
  setCompletingPlan,
  completionMinutesInput,
  setCompletionMinutesInput,
  showModalQuickStatus,
  setShowModalQuickStatus,
  completionStatusInput,
  setCompletionStatusInput,
  showModalQuickReflection,
  setShowModalQuickReflection,
  completionReflectionInput,
  setCompletionReflectionInput,
  handleConfirmCompletion,
  QUICK_REFLECTIONS,
  deletingPlan,
  setDeletingPlan,
  studyPlans,
  removeLinkedQuestionLog,
  onDeletePlan,
  questionPromptPlan,
  setQuestionPromptPlan,
  questionPromptSolvedCount,
  setQuestionPromptSolvedCount,
  questionPromptCorrectCount,
  setQuestionPromptCorrectCount,
  questionPromptWrongCount,
  setQuestionPromptWrongCount,
  questionPromptNotes,
  setQuestionPromptNotes,
  handleConfirmQuestionPrompt,
  uncompleteConfirm,
  setUncompleteConfirm,
  handleConfirmUncompleteWithLogDeletion,
  showArchiveConfirm,
  setShowArchiveConfirm,
  archiveWeekOffset,
  setArchiveWeekOffset,
  archiveChoice,
  setArchiveChoice,
  overwriteStep,
  setOverwriteStep,
  getOffsetDate,
  getWeekLabel,
  getOffsetBadgeText,
  CHRONOLOGICAL_SEEDS,
  executeArchiveAndReset,
  showTaskTypeModal,
  setShowTaskTypeModal,
  editingTaskTypeIndex,
  setEditingTaskTypeIndex,
  editingTaskTypeValue,
  setEditingTaskTypeValue,
  deletingTaskTypeIndex,
  setDeletingTaskTypeIndex,
  deletingStep,
  setDeletingStep,
  newTaskTypeValue,
  setNewTaskTypeValue,
  handleEditTaskType,
  handleDeleteTaskType,
  handleAddTaskType,
  onUpdateTaskTypes,
  handleAiSuggestTask,
  aiSuggestLoading = false,
  aiSuggestError = null,
  aiSuggestReason = null,
  coachDataSettings,
  topicStatuses,
  completedPastTopics,
  dailyStudyLogModalData,
  setDailyStudyLogModalData,
  handleSaveDailyStudyLogModal,
  handleDeleteDailyStudyLogModal
}) => {
  const [modalHours, setModalHours] = React.useState<number>(0);
  const [modalMinutes, setModalMinutes] = React.useState<number>(0);
  const [modalNotes, setModalNotes] = React.useState<string>('');

  React.useEffect(() => {
    if (dailyStudyLogModalData) {
      const totalMins = dailyStudyLogModalData.currentMinutes > 0 
        ? dailyStudyLogModalData.currentMinutes 
        : dailyStudyLogModalData.taskMinutes > 0 
        ? dailyStudyLogModalData.taskMinutes 
        : 60;
      setModalHours(Math.floor(totalMins / 60));
      setModalMinutes(totalMins % 60);
      setModalNotes(dailyStudyLogModalData.currentNotes || '');
    }
  }, [dailyStudyLogModalData]);

  return (
    <>
      {/* MODAL 1: ADD NEW TASK */}
      {showAddModal && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowAddModal(false); }}
        >
          <div className="bg-slate-900 backdrop-blur-2xl border border-slate-700 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-white">Yeni Çalışma Görevi Ekle</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreatePlan} className="space-y-4">
              {/* 1. Ders Seçimi */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Ders Seçimi</label>
                <select
                  value={subject}
                  onChange={(e) => {
                    setSubject(e.target.value);
                    setTopic('');
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-medium focus:border-indigo-400 transition-colors"
                >
                  <option value="">Lütfen ders seçimi yapınız</option>
                  <optgroup label="TYT Dersleri">
                    {YKS_SUBJECTS.TYT.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </optgroup>
                  <optgroup label="AYT Dersleri">
                    {YKS_SUBJECTS.AYT.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* 2. Gün Seçimi (Çoklu Gün Seçici) */}
              <div className="space-y-2 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <CalendarDays className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Planlanacak Günler</span>
                  </label>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    targetDaysForAdd.length > 0
                      ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                      : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  }`}>
                    {targetDaysForAdd.length > 0 ? `${targetDaysForAdd.length} Gün Seçildi` : 'Gün Seçilmedi!'}
                  </span>
                </div>

                {/* Hızlı Seçim Butonları */}
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <span className="text-[10px] text-slate-500 font-medium mr-0.5">Hızlı Seç:</span>
                  <button
                    type="button"
                    onClick={() => setTargetDaysForAdd([...DAYS])}
                    className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-900 hover:bg-indigo-950/60 text-slate-400 hover:text-indigo-300 border border-slate-800 hover:border-indigo-500/30 transition-all cursor-pointer"
                  >
                    Tüm Hafta (7 Gün)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetDaysForAdd(['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma'])}
                    className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-900 hover:bg-indigo-950/60 text-slate-400 hover:text-indigo-300 border border-slate-800 hover:border-indigo-500/30 transition-all cursor-pointer"
                  >
                    Hafta İçi
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetDaysForAdd(['Cumartesi', 'Pazar'])}
                    className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-900 hover:bg-indigo-950/60 text-slate-400 hover:text-indigo-300 border border-slate-800 hover:border-indigo-500/30 transition-all cursor-pointer"
                  >
                    Hafta Sonu
                  </button>
                </div>

                {/* 7 Gün Butonları */}
                <div className="grid grid-cols-7 gap-1 sm:gap-1.5 pt-1">
                  {DAYS.map((d) => {
                    const isSelected = targetDaysForAdd.includes(d);
                    const shortName = d.slice(0, 3);
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setTargetDaysForAdd(targetDaysForAdd.filter((day) => day !== d));
                          } else {
                            const updated = [...targetDaysForAdd, d].sort(
                              (a, b) => DAYS.indexOf(a) - DAYS.indexOf(b)
                            );
                            setTargetDaysForAdd(updated);
                          }
                        }}
                        className={`py-2 px-0.5 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer border ${
                          isSelected
                            ? 'bg-gradient-to-b from-indigo-600 to-indigo-700 text-white border-indigo-400 shadow-md shadow-indigo-600/30 scale-[1.02]'
                            : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                        }`}
                        title={`${d} gününü ${isSelected ? 'kaldır' : 'ekle'}`}
                      >
                        <span className="text-[11px] sm:text-xs leading-none">{shortName}</span>
                        {isSelected ? (
                          <Check className="w-3 h-3 text-white stroke-[3]" />
                        ) : (
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-700 my-[3px]" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {targetDaysForAdd.length === 0 && (
                  <p className="text-[11px] text-rose-400 font-semibold flex items-center gap-1 pt-1">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>Lütfen görevin ekleneceği en az bir gün seçiniz.</span>
                  </p>
                )}
              </div>

              {!subject && (
                <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-xs text-indigo-300 font-medium">
                  💡 Devam etmek için lütfen yukarıdan bir ders seçiniz.
                </div>
              )}

              {subject && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center justify-between">
                      <span>Konu Seçimi</span>
                      <span className="text-[10px] text-slate-500 font-normal">🌟 Uzmanlaşıldı • ✅ Çalışıldı • ⚡ Zor Geldi</span>
                    </label>
                    <select
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-400 font-medium text-indigo-300"
                    >
                      <option value="">-- Konu Seçiniz --</option>
                      <option value="Genel">Genel</option>
                      <option value="Diğer">Diğer</option>
                      {(YKS_CURRICULUM_TOPICS[subject] || []).map((t) => {
                        const status = topicStatuses?.[t];
                        const isPastDone = completedPastTopics?.includes(t);
                        let badge = '';
                        if (status === 'Uzmanlaştım') {
                          badge = '🌟 ';
                        } else if (status === 'Çalıştım') {
                          badge = '✅ ';
                        } else if (status === 'Zor Geldi') {
                          badge = '⚡ ';
                        } else if (isPastDone) {
                          badge = '✅ ';
                        }
                        return (
                          <option key={t} value={t}>
                            {badge ? `${badge}${t}` : t}
                          </option>
                        );
                      })}
                    </select>
                    {topic && topic !== 'Genel' && topic !== 'Diğer' && (topicStatuses?.[topic] || completedPastTopics?.includes(topic)) && (
                      <div className="mt-1.5 flex items-center gap-1.5 text-[11px] animate-fade-in">
                        <span className="text-slate-400 font-medium">Mevcut Durum:</span>
                        {topicStatuses?.[topic] === 'Uzmanlaştım' && (
                          <span className="px-2 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 inline-flex items-center gap-1">
                            <span>🌟</span> Uzmanlaşıldı
                          </span>
                        )}
                        {topicStatuses?.[topic] === 'Çalıştım' && (
                          <span className="px-2 py-0.5 rounded-full font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 inline-flex items-center gap-1">
                            <span>✅</span> Çalışıldı
                          </span>
                        )}
                        {topicStatuses?.[topic] === 'Zor Geldi' && (
                          <span className="px-2 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 inline-flex items-center gap-1">
                            <span>⚡</span> Zor Geldi
                          </span>
                        )}
                        {!topicStatuses?.[topic] && completedPastTopics?.includes(topic) && (
                          <span className="px-2 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 inline-flex items-center gap-1">
                            <span>✅</span> Çalışıldı
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Görev Tanımı (Görev Tipi)</label>
                    <div className="flex items-center gap-2">
                      <select
                        value={taskType}
                        onChange={(e) => setTaskType(e.target.value)}
                        className={`${
                          taskType === 'Diğer' ? 'flex-1' : 'w-full'
                        } bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-bold text-amber-300 transition-all duration-200`}
                      >
                        {actualTaskTypes.map((type) => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                      {taskType === 'Diğer' && (
                        <button
                          type="button"
                          onClick={() => setShowTaskTypeModal(true)}
                          className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer shadow-sm shadow-indigo-600/20"
                        >
                          Özelleştir
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Hedeflenen Süre (Dakika)</label>
                      <input
                        type="number"
                        min="15"
                        step="15"
                        value={plannedMinutes}
                        onChange={(e) => setPlannedMinutes(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Hedef Soru Sayısı (Opsiyonel)</label>
                      <input
                        type="number"
                        min="0"
                        step="5"
                        placeholder="Ör: 40"
                        value={targetQuestionCount}
                        onChange={(e) => setTargetQuestionCount(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Notlar / Açıklamalar (Opsiyonel)</label>
                    <textarea
                      rows={2}
                      placeholder="Kaynak veya detay..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {aiSuggestReason && (
                <div className="p-3 bg-gradient-to-r from-purple-950/70 to-indigo-950/70 border border-purple-500/30 rounded-2xl text-xs space-y-1 animate-fade-in shadow-lg">
                  <div className="flex items-center space-x-1.5 font-bold text-purple-300">
                    <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
                    <span>Yapay Zeka Görev Öneri Gerekçesi</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed text-[11px]">
                    {aiSuggestReason}
                  </p>
                </div>
              )}

              {aiSuggestError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs text-rose-300 flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{aiSuggestError}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-slate-800 gap-2">
                <div>
                  {handleAiSuggestTask && (
                    <button
                      type="button"
                      onClick={handleAiSuggestTask}
                      disabled={aiSuggestLoading || coachDataSettings?.studyPlannerTask?.enabled === false}
                      title={coachDataSettings?.studyPlannerTask?.enabled === false ? "Yapay Zeka Görev Önerisi sistem ayarlarından kapatılmıştır" : "Öğrenci verilerini analiz ederek en uygun görevi önerir"}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shadow-md ${
                        coachDataSettings?.studyPlannerTask?.enabled === false
                          ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                          : aiSuggestLoading
                            ? 'bg-purple-900/60 text-purple-200 border border-purple-500/40 animate-pulse'
                            : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white border border-purple-400/30 shadow-purple-600/20'
                      }`}
                    >
                      <Sparkles className={`w-3.5 h-3.5 ${aiSuggestLoading ? 'animate-spin text-purple-300' : 'text-purple-200'}`} />
                      <span>{aiSuggestLoading ? 'Öneri Hazırlanıyor...' : 'Yapay Zeka Önersin'}</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    disabled={!subject || !topic.trim() || targetDaysForAdd.length === 0}
                    className={`text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-lg ${
                      subject && topic.trim() && targetDaysForAdd.length > 0
                        ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30 cursor-pointer'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    {targetDaysForAdd.length > 1
                      ? `Kaydet ve Ekle (${targetDaysForAdd.length} Güne)`
                      : 'Kaydet ve Ekle'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT TASK MODAL */}
      {editingPlan && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setEditingPlan(null); }}
        >
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-white flex items-center space-x-2">
                <Edit3 className="w-5 h-5 text-indigo-400" />
                <span>Görevi Düzenle</span>
              </h3>
              <button onClick={() => setEditingPlan(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditPlan} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Gün</label>
                  <select
                    value={editingPlan.day}
                    onChange={(e) => setEditingPlan({ ...editingPlan, day: e.target.value as DayOfWeek })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    {DAYS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Durum</label>
                  <select
                    value={editingPlan.status}
                    onChange={(e) => setEditingPlan({ ...editingPlan, status: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-bold text-indigo-300"
                  >
                    <option value="pending">Bekliyor</option>
                    <option value="in_progress">Devam Ediyor</option>
                    <option value="completed">Tamamlandı</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Ders</label>
                <select
                  value={editingPlan.subject}
                  onChange={(e) => setEditingPlan({ ...editingPlan, subject: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                >
                  <optgroup label="TYT Dersleri">
                    {YKS_SUBJECTS.TYT.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </optgroup>
                  <optgroup label="AYT Dersleri">
                    {YKS_SUBJECTS.AYT.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center justify-between">
                  <span>Konu Seçimi (Otomatik Liste)</span>
                  <span className="text-[10px] text-slate-500 font-normal">🌟 Uzmanlaşıldı • ✅ Çalışıldı • ⚡ Zor Geldi</span>
                </label>
                <select
                  onChange={(e) => {
                    if (e.target.value) setEditingPlan({ ...editingPlan, topic: e.target.value });
                  }}
                  value={(YKS_CURRICULUM_TOPICS[editingPlan.subject] || []).includes(editingPlan.topic) ? editingPlan.topic : ''}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-400 font-medium text-indigo-300 mb-2"
                >
                  <option value="">-- {editingPlan.subject} Konusu Seçin --</option>
                  {(YKS_CURRICULUM_TOPICS[editingPlan.subject] || []).map((t) => {
                    const status = topicStatuses?.[t];
                    const isPastDone = completedPastTopics?.includes(t);
                    let badge = '';
                    if (status === 'Uzmanlaştım') {
                      badge = '🌟 ';
                    } else if (status === 'Çalıştım') {
                      badge = '✅ ';
                    } else if (status === 'Zor Geldi') {
                      badge = '⚡ ';
                    } else if (isPastDone) {
                      badge = '✅ ';
                    }
                    return (
                      <option key={t} value={t}>
                        {badge ? `${badge}${t}` : t}
                      </option>
                    );
                  })}
                </select>

                {editingPlan.topic && (topicStatuses?.[editingPlan.topic] || completedPastTopics?.includes(editingPlan.topic)) && (
                  <div className="mb-2 flex items-center gap-1.5 text-[11px] animate-fade-in">
                    <span className="text-slate-400 font-medium">Mevcut Durum:</span>
                    {topicStatuses?.[editingPlan.topic] === 'Uzmanlaştım' && (
                      <span className="px-2 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 inline-flex items-center gap-1">
                        <span>🌟</span> Uzmanlaşıldı
                      </span>
                    )}
                    {topicStatuses?.[editingPlan.topic] === 'Çalıştım' && (
                      <span className="px-2 py-0.5 rounded-full font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 inline-flex items-center gap-1">
                        <span>✅</span> Çalışıldı
                      </span>
                    )}
                    {topicStatuses?.[editingPlan.topic] === 'Zor Geldi' && (
                      <span className="px-2 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 inline-flex items-center gap-1">
                        <span>⚡</span> Zor Geldi
                      </span>
                    )}
                    {!topicStatuses?.[editingPlan.topic] && completedPastTopics?.includes(editingPlan.topic) && (
                      <span className="px-2 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 inline-flex items-center gap-1">
                        <span>✅</span> Çalışıldı
                      </span>
                    )}
                  </div>
                )}

                <label className="block text-xs font-bold text-slate-300 mb-1">Konu / Özel Başlık</label>
                <input
                  type="text"
                  required
                  value={editingPlan.topic}
                  onChange={(e) => setEditingPlan({ ...editingPlan, topic: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Görev Tanımı (Görev Tipi)</label>
                <div className="flex items-center gap-2">
                  <select
                    value={editingPlan.taskType || actualTaskTypes[0]}
                    onChange={(e) => setEditingPlan({ ...editingPlan, taskType: e.target.value })}
                    className={`${
                      (editingPlan.taskType || actualTaskTypes[0]) === 'Diğer' ? 'flex-1' : 'w-full'
                    } bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-bold text-amber-300 transition-all duration-200`}
                  >
                    {(() => {
                      const options = [...actualTaskTypes];
                      const currentType = editingPlan.taskType;
                      if (currentType && !options.includes(currentType)) {
                        const dicerIdx = options.indexOf('Diğer');
                        if (dicerIdx !== -1) {
                          options.splice(dicerIdx, 0, currentType);
                        } else {
                          options.push(currentType);
                        }
                      }
                      return options.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ));
                    })()}
                  </select>
                  {(editingPlan.taskType || actualTaskTypes[0]) === 'Diğer' && (
                    <button
                      type="button"
                      onClick={() => setShowTaskTypeModal(true)}
                      className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer shadow-sm shadow-indigo-600/20"
                    >
                      Özelleştir
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">Hedef Süre (Dk)</label>
                  <input
                    type="number"
                    min="0"
                    step="5"
                    value={editingPlan.plannedMinutes}
                    onChange={(e) => setEditingPlan({ ...editingPlan, plannedMinutes: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">Hedef Soru</label>
                  <input
                    type="number"
                    min="0"
                    step="5"
                    placeholder="Ör: 40"
                    value={editingPlan.targetQuestionCount || ''}
                    onChange={(e) => setEditingPlan({ ...editingPlan, targetQuestionCount: e.target.value === '' ? undefined : Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">Gerçekleşen (Dk)</label>
                  <input
                    type="number"
                    min="0"
                    step="5"
                    value={editingPlan.completedMinutes}
                    onChange={(e) => setEditingPlan({ ...editingPlan, completedMinutes: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-emerald-400 font-bold focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Notlar / Açıklamalar</label>
                <textarea
                  rows={2}
                  value={editingPlan.notes || ''}
                  onChange={(e) => setEditingPlan({ ...editingPlan, notes: e.target.value })}
                  placeholder="Örn: 40 soru çözüldü, yanlış yapılan 3 soru öğretmenle incelenecek"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center space-x-1">
                  <Sparkles className="w-3.5 h-3.5 text-fuchsia-400" />
                  <span>Hızlı Değerlendirme Yorumu</span>
                </label>
                <select
                  value={editingPlan.reflection || ''}
                  onChange={(e) => setEditingPlan({ ...editingPlan, reflection: e.target.value || undefined })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none"
                >
                  <option value="" className="bg-slate-900 text-slate-400">-- Değerlendirme Yorumu Seçin --</option>
                  {QUICK_REFLECTIONS.map((chip) => (
                    <option key={chip.label} value={chip.label} className="bg-slate-900 text-white">
                      {chip.icon} {chip.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    const planToDelete = editingPlan;
                    setEditingPlan(null);
                    setDeletingPlan({ id: planToDelete.id, title: `${planToDelete.day} - ${planToDelete.subject}: ${planToDelete.topic}` });
                  }}
                  className="px-3 py-2 text-xs bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-xl border border-rose-500/30 font-bold transition-colors flex items-center space-x-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Sil</span>
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setEditingPlan(null)}
                    className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-lg"
                  >
                    Değişiklikleri Kaydet
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: COMPLETION MINUTES INPUT MODAL */}
      {completingPlan && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setCompletingPlan(null); }}
        >
          <div className="bg-slate-900 border border-emerald-500/30 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-white flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <span>Görevi Tamamla</span>
              </h3>
              <button onClick={() => setCompletingPlan(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
              <span className="text-[11px] font-bold text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded border border-indigo-500/30">
                {completingPlan.subject}
              </span>
              <div className="text-sm font-bold text-white mt-1">
                {completingPlan.topic}
              </div>
              <div className="text-xs text-slate-400 mt-0.5 font-mono">
                Hedef Süre: <strong>{completingPlan.plannedMinutes} Dakika</strong>
              </div>
            </div>

            <form onSubmit={handleConfirmCompletion} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">
                  Bu görevi kaç dakikada tamamladınız?
                </label>
                
                {/* Duration Presets */}
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {[30, 45, 60, 90].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setCompletionMinutesInput(preset)}
                      className={`py-1.5 rounded-xl text-xs font-bold transition-all border ${
                        completionMinutesInput === preset
                          ? 'bg-emerald-500/30 border-emerald-400 text-emerald-300'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {preset} dk
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    required
                    value={completionMinutesInput}
                    onChange={(e) => setCompletionMinutesInput(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-emerald-500/40 rounded-2xl px-4 py-3 text-lg font-bold text-emerald-400 focus:outline-none font-mono text-center"
                  />
                  <span className="absolute right-4 top-3.5 text-xs text-slate-400 font-bold">Dakika</span>
                </div>
              </div>

              {/* ACCORDION 1: HIZLI DURUM */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowModalQuickStatus(!showModalQuickStatus)}
                  className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white hover:border-slate-700 transition-all cursor-pointer"
                >
                  <span className="flex items-center space-x-2 min-w-0">
                    <ListFilter className="w-4 h-4 text-sky-400 shrink-0" />
                    <span className="truncate">Hızlı Durum Seçeneği</span>
                    <span className="text-[10px] text-slate-400 font-normal shrink-0">
                      ({completionStatusInput === 'completed' ? '✅ Tamam' : completionStatusInput === 'in_progress' ? '⚡ Devam' : '⏳ Bekliyor'})
                    </span>
                  </span>
                  <ChevronRight className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${showModalQuickStatus ? 'rotate-90 text-sky-400' : ''}`} />
                </button>

                <AnimatePresence>
                  {showModalQuickStatus && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="p-3 mt-1.5 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                        <label className="block text-[11px] font-semibold text-slate-400">Görevin Durumu:</label>
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            type="button"
                            onClick={() => setCompletionStatusInput('pending')}
                            className={`py-2 px-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                              completionStatusInput === 'pending'
                                ? 'bg-amber-500/30 border-amber-400 text-amber-200 shadow-md shadow-amber-500/20'
                                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                            }`}
                          >
                            ⏳ Bekliyor
                          </button>
                          <button
                            type="button"
                            onClick={() => setCompletionStatusInput('in_progress')}
                            className={`py-2 px-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                              completionStatusInput === 'in_progress'
                                ? 'bg-sky-500/30 border-sky-400 text-sky-200 shadow-md shadow-sky-500/20'
                                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                            }`}
                          >
                            ⚡ Devam
                          </button>
                          <button
                            type="button"
                            onClick={() => setCompletionStatusInput('completed')}
                            className={`py-2 px-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                              completionStatusInput === 'completed'
                                ? 'bg-emerald-500/30 border-emerald-400 text-emerald-200 shadow-md shadow-emerald-500/20'
                                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                            }`}
                          >
                            ✅ Tamam
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* ACCORDION 2: HIZLI YORUM */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowModalQuickReflection(!showModalQuickReflection)}
                  className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white hover:border-slate-700 transition-all cursor-pointer"
                >
                  <span className="flex items-center space-x-2 min-w-0">
                    <Sparkles className="w-4 h-4 text-fuchsia-400 shrink-0" />
                    <span className="truncate">Hızlı Yorum / Değerlendirme</span>
                    {completionReflectionInput && (
                      <span className="text-[10px] text-fuchsia-300 font-normal truncate max-w-[80px]">
                        ({completionReflectionInput})
                      </span>
                    )}
                  </span>
                  <ChevronRight className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${showModalQuickReflection ? 'rotate-90 text-fuchsia-400' : ''}`} />
                </button>

                <AnimatePresence>
                  {showModalQuickReflection && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="p-3 mt-1.5 bg-slate-950 border border-slate-800 rounded-2xl space-y-2.5">
                        <label className="block text-[11px] font-semibold text-slate-400">Yorum / Değerlendirme Seçin:</label>
                        <div className="flex flex-wrap gap-1.5">
                          {QUICK_REFLECTIONS.map((chip) => {
                            const isSelected = completionReflectionInput === chip.label;
                            return (
                              <button
                                key={chip.label}
                                type="button"
                                onClick={() => setCompletionReflectionInput(isSelected ? undefined : chip.label)}
                                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center space-x-1 cursor-pointer ${
                                  isSelected ? chip.activeColor : chip.color
                                }`}
                              >
                                <span>{chip.icon}</span>
                                <span>{chip.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setCompletingPlan(null)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-600/30"
                >
                  Tamamlandı Olarak İşaretle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2-Step Confirmation Modal for Study Plan Deletion */}
      <ConfirmDeleteModal
        isOpen={!!deletingPlan}
        title="Ders Planı Görevini Sil"
        itemName={deletingPlan?.title}
        onConfirm={() => {
          if (deletingPlan) {
            const planToDelete = studyPlans.find(p => p.id === deletingPlan.id);
            removeLinkedQuestionLog(deletingPlan.id, planToDelete?.topic, planToDelete?.subject);
            onDeletePlan(deletingPlan.id);
            setDeletingPlan(null);
          }
        }}
        onClose={() => setDeletingPlan(null)}
      />

      {/* MODAL 4: QUESTION TRACKER PROMPT MODAL */}
      {questionPromptPlan && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
          onClick={(e) => { if (e.target === e.currentTarget) setQuestionPromptPlan(null); }}
        >
          <div className="bg-slate-900 border border-indigo-500/30 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-white flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-indigo-400" />
                <span>Soru Takibine Eklensin mi?</span>
              </h3>
              <button 
                onClick={() => {
                  setQuestionPromptPlan(null);
                  setQuestionPromptSolvedCount('');
                  setQuestionPromptCorrectCount('');
                  setQuestionPromptWrongCount('');
                  setQuestionPromptNotes('');
                }} 
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1.5">
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-bold text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded border border-indigo-500/30">
                  {questionPromptPlan.subject}
                </span>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Görevi Tamamlandı
                </span>
              </div>
              <div className="text-sm font-bold text-white">
                {questionPromptPlan.topic}
              </div>
              <p className="text-xs text-slate-400 leading-relaxed pt-1">
                {questionPromptPlan.targetQuestionCount && questionPromptPlan.targetQuestionCount > 0 ? (
                  <>Bu çalışma için hedef soru sayısı <strong>{questionPromptPlan.targetQuestionCount}</strong> olarak belirlenmişti. Soru takibine eklenecek bilgileri gözden geçirip kaydedebilirsiniz.</>
                ) : (
                  <>Bu çalışmada çözdüğünüz soruları <strong>Soru Takibi</strong> sayfasına eklemek için detayları girebilirsiniz.</>
                )}
              </p>
            </div>

            <form onSubmit={handleConfirmQuestionPrompt} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Çözülen Soru Sayısı *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  placeholder="Örn: 40"
                  value={questionPromptSolvedCount}
                  onChange={(e) => setQuestionPromptSolvedCount(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full bg-slate-950 border border-indigo-500/40 rounded-xl px-3 py-2 text-xs font-bold text-emerald-400 focus:outline-none font-mono"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-emerald-400 mb-1">
                    Doğru Sayısı <span className="text-slate-500 font-normal">(Opsiyonel)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Örn: 35"
                    value={questionPromptCorrectCount}
                    onChange={(e) => setQuestionPromptCorrectCount(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-slate-950 border border-emerald-500/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-rose-400 mb-1">
                    Yanlış Sayısı <span className="text-slate-500 font-normal">(Opsiyonel)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Örn: 5"
                    value={questionPromptWrongCount}
                    onChange={(e) => setQuestionPromptWrongCount(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-slate-950 border border-rose-500/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Net score live preview badge */}
              {questionPromptSolvedCount !== '' && Number(questionPromptSolvedCount) > 0 && (
                <div className="bg-slate-950/80 px-3 py-2 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Hesaplanan Net:</span>
                  <span className="text-indigo-400 font-extrabold text-sm">
                    {(() => {
                      const s = Number(questionPromptSolvedCount);
                      const w = questionPromptWrongCount !== '' ? Number(questionPromptWrongCount) : 0;
                      let c = questionPromptCorrectCount !== '' ? Number(questionPromptCorrectCount) : Math.max(0, s - w);
                      if (questionPromptCorrectCount === '' && questionPromptWrongCount === '') {
                        c = s;
                      }
                      return Number((c - (w * 0.25)).toFixed(2));
                    })()} Net
                  </span>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-300">
                    Notlar / Açıklamalar <span className="text-slate-500 font-normal">(Opsiyonel)</span>
                  </label>
                  {questionPromptNotes && (
                    <button
                      type="button"
                      onClick={() => {
                        setQuestionPromptNotes('');
                      }}
                      className="text-[10px] text-slate-400 hover:text-indigo-300 transition-colors cursor-pointer font-medium"
                    >
                      Metni Temizle
                    </button>
                  )}
                </div>
                <textarea
                  rows={2}
                  placeholder="Açıklama veya not ekleyin..."
                  value={questionPromptNotes}
                  onChange={(e) => {
                    setQuestionPromptNotes(e.target.value);
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/60 transition-colors"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setQuestionPromptPlan(null);
                    setQuestionPromptSolvedCount('');
                    setQuestionPromptCorrectCount('');
                    setQuestionPromptWrongCount('');
                    setQuestionPromptNotes('');
                  }}
                  className="px-3 py-2 text-xs text-slate-400 hover:text-white font-bold transition-colors"
                >
                  Sadece Görevi Tamamla
                </button>
                <button
                  type="submit"
                  disabled={!questionPromptSolvedCount || Number(questionPromptSolvedCount) <= 0}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-600/30"
                >
                  Evet, Soru Takibine Ekle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UNCOMPLETE CONFIRMATION MODAL */}
      {uncompleteConfirm && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={(e) => { if (e.target === e.currentTarget) setUncompleteConfirm(null); }}
        >
          <div className="bg-slate-900 border border-amber-500/30 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-white flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                <span>Soru Takibi Kaydı Silinecek</span>
              </h3>
              <button 
                onClick={() => setUncompleteConfirm(null)} 
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                <span className="text-[11px] font-black text-indigo-300 bg-indigo-500/20 px-2.5 py-0.5 rounded border border-indigo-500/30">
                  {uncompleteConfirm.plan.subject}
                </span>
                <span className="text-xs font-bold text-slate-200">
                  {uncompleteConfirm.plan.topic}
                </span>
              </div>

              {uncompleteConfirm.linkedLogs.map((log) => (
                <div key={log.id} className="text-xs text-amber-300 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20 flex items-center justify-between font-mono">
                  <span className="text-slate-400 font-sans">İlişkili Soru Kaydı:</span>
                  <strong className="text-amber-300 font-extrabold">{log.solvedCount} Soru ({log.netScore} Net)</strong>
                </div>
              ))}

              <p className="text-xs text-slate-400 leading-relaxed">
                Bu görevin tamamlandı durumunu değiştirdiğinizde, Soru Takibinde kayıtlı olan yukarıdaki soru bilgisi de otomatik olarak silinecektir.
              </p>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setUncompleteConfirm(null)}
                className="px-4 py-2.5 text-xs text-slate-400 hover:text-white font-bold transition-colors rounded-xl border border-slate-800 hover:bg-slate-800 cursor-pointer"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleConfirmUncompleteWithLogDeletion}
                className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-amber-600/30 cursor-pointer"
              >
                Evet, Sil ve Durumu Değiştir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: ARCHIVE & RESET STUDY PLAN CONFIRMATION */}
      {showArchiveConfirm && (
        (() => {
          const targetWeekLabel = formatWeekLabelWithYear(getOffsetDate(archiveWeekOffset));
          const existingArchivedCount = studyPlans.filter(p => p.archived && p.weekLabel && isSameWeekLabel(p.weekLabel, targetWeekLabel)).length;
          const isAlreadyArchived = existingArchivedCount > 0 || CHRONOLOGICAL_SEEDS.some(seed => isSameWeekLabel(seed, targetWeekLabel));

          const handleInitiateChoice = (choice: 'keep_template' | 'fresh_start') => {
            setArchiveChoice(choice);
            if (isAlreadyArchived) {
              setOverwriteStep(1);
            } else {
              executeArchiveAndReset(choice, targetWeekLabel);
            }
          };

          return (
            <div 
              className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
              onClick={(e) => { 
                if (e.target === e.currentTarget) {
                  setShowArchiveConfirm(false);
                  setOverwriteStep(0);
                  setArchiveChoice(null);
                } 
              }}
            >
              <div className="bg-slate-900 border border-purple-500/30 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5">
                
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-base font-black text-white flex items-center space-x-2">
                    <History className="w-5 h-5 text-purple-400 shrink-0" />
                    <span>Haftayı Arşive Kaldır & Sıfırla</span>
                  </h3>
                  <button 
                    onClick={() => {
                      setShowArchiveConfirm(false);
                      setOverwriteStep(0);
                      setArchiveChoice(null);
                    }} 
                    className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* OVERWRITE CONFIRMATION STEP 1 */}
                {overwriteStep === 1 && (
                  <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-4 bg-amber-950/40 border border-amber-500/50 rounded-2xl space-y-2 text-xs">
                      <div className="flex items-center space-x-2 text-amber-400 font-extrabold text-sm">
                        <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400" />
                        <span>Üzerine Yazma Onayı (1 / 2)</span>
                      </div>
                      <p className="text-amber-200/90 leading-relaxed font-medium pt-1">
                        Seçtiğiniz <strong className="text-white underline">{targetWeekLabel}</strong> haftasına ait sistemde daha önce kaydedilmiş bir arşiv verisi bulunmaktadır.
                      </p>
                      <p className="text-amber-300 font-semibold pt-1">
                        Eski arşiv verisini silip, yerine bu haftanın çalışma planını kaydetmek istediğinizden emin misiniz?
                      </p>
                    </div>

                    <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800 text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          setOverwriteStep(0);
                          setArchiveChoice(null);
                        }}
                        className="px-4 py-2.5 text-slate-400 hover:text-white font-bold transition-colors rounded-xl border border-slate-800 hover:bg-slate-800 cursor-pointer"
                      >
                        İptal
                      </button>
                      <button
                        type="button"
                        onClick={() => setOverwriteStep(2)}
                        className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold transition-all rounded-xl shadow-lg shadow-amber-600/30 cursor-pointer"
                      >
                        Evet, Devam Et (2. Adım)
                      </button>
                    </div>
                  </div>
                )}

                {/* OVERWRITE CONFIRMATION STEP 2 */}
                {overwriteStep === 2 && (
                  <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-4 bg-rose-950/50 border border-rose-500/60 rounded-2xl space-y-2 text-xs">
                      <div className="flex items-center space-x-2 text-rose-400 font-extrabold text-sm">
                        <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400" />
                        <span>⚠️ SON ONAY (2 / 2) - Kalıcı İşlem</span>
                      </div>
                      <p className="text-rose-200/95 leading-relaxed font-medium pt-1">
                        <strong>DİKKAT:</strong> <strong className="text-white underline">{targetWeekLabel}</strong> haftasının eski arşiv verileri <strong>KALICI OLARAK SİLİNECEK</strong> ve geri getirilemeyecektir.
                      </p>
                      <p className="text-rose-300 font-bold pt-1">
                        Bu işlemi onaylayıp eski arşivi silerek yeni planı kaydetmek istiyor musunuz?
                      </p>
                    </div>

                    <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800 text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          setOverwriteStep(0);
                          setArchiveChoice(null);
                        }}
                        className="px-4 py-2.5 text-slate-400 hover:text-white font-bold transition-colors rounded-xl border border-slate-800 hover:bg-slate-800 cursor-pointer"
                      >
                        İptal
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (archiveChoice) {
                            executeArchiveAndReset(archiveChoice, targetWeekLabel);
                          }
                        }}
                        className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold transition-all rounded-xl shadow-lg shadow-rose-600/30 cursor-pointer"
                      >
                        Kalıcı Olarak Sil ve Üzerine Yaz
                      </button>
                    </div>
                  </div>
                )}

                {/* MAIN ARCHIVE FORM */}
                {overwriteStep === 0 && (
                  <div className="space-y-4">
                    <div className="p-3.5 bg-purple-950/20 border border-purple-500/20 rounded-2xl space-y-1 text-xs text-purple-300 leading-relaxed font-semibold">
                      <p>ℹ️ Mevcut çalışma alanınızdaki görevler belirtilen haftanın arşivine aktarılacaktır.</p>
                    </div>

                    <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                        <span className="flex items-center space-x-1.5 text-purple-400">
                          <CalendarDays className="w-4 h-4" />
                          <span>Tarih Bilgisi (Arşivlenecek Hafta)</span>
                        </span>
                        <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-purple-900/40 text-purple-300 border border-purple-700/50 font-bold">
                          {getOffsetBadgeText(archiveWeekOffset)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between bg-slate-900 border border-slate-750 p-2 rounded-xl">
                        <button
                          type="button"
                          onClick={() => setArchiveWeekOffset(prev => prev - 1)}
                          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-all cursor-pointer flex items-center space-x-1 text-xs font-bold shrink-0"
                          title="Eski Haftalara Geçiş Yap"
                        >
                          <ChevronLeft className="w-4 h-4" />
                          <span className="hidden sm:inline">Önceki Hafta</span>
                        </button>

                        <div className="text-center px-3 py-1">
                          <div className="text-sm font-black text-white tracking-wide">
                            {targetWeekLabel}
                          </div>
                          <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                            Seçilen Arşiv Haftası
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setArchiveWeekOffset(prev => prev + 1)}
                          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-all cursor-pointer flex items-center space-x-1 text-xs font-bold shrink-0"
                          title="Sonraki Haftaya Geç"
                        >
                          <span className="hidden sm:inline">Sonraki Hafta</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {isAlreadyArchived && (
                      <div className="p-3.5 bg-amber-950/40 border border-amber-500/40 rounded-2xl flex items-start space-x-3 text-amber-200 text-xs animate-in fade-in duration-200">
                        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                        <div className="space-y-0.5">
                          <div className="font-extrabold text-amber-300">
                            Seçtiğiniz haftada daha önce girilmiş veri var!
                          </div>
                          <div className="text-[11px] text-amber-200/90 leading-relaxed">
                            "{targetWeekLabel}" haftasına ait mevcut bir arşiv bulunuyor. Devam ederseniz eskisini silip üzerine yazmak için onay istenecektir.
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1 pt-1">
                      YENİ HAFTA BAŞLANGIÇ TERCİHİNİZ:
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => handleInitiateChoice('keep_template')}
                        className="p-4 bg-slate-950 hover:bg-slate-800/85 border border-indigo-500/30 hover:border-indigo-500/50 rounded-2xl text-left transition-all duration-200 group cursor-pointer"
                      >
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-2.5 group-hover:scale-110 transition-transform">
                          <RotateCcw className="w-4 h-4" />
                        </div>
                        <h4 className="text-xs font-black text-white">Plan Şablonunu Koru</h4>
                        <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                          Mevcut derslerinizi ve hedeflerinizi korur; süre ve durumları sıfırlayarak yeni haftaya hazırlar.
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleInitiateChoice('fresh_start')}
                        className="p-4 bg-slate-950 hover:bg-slate-800/85 border border-rose-500/20 hover:border-rose-500/40 rounded-2xl text-left transition-all duration-200 group cursor-pointer"
                      >
                        <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400 mb-2.5 group-hover:scale-110 transition-transform">
                          <Trash2 className="w-4 h-4" />
                        </div>
                        <h4 className="text-xs font-black text-white">Sıfırdan Başla</h4>
                        <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                          Tüm programı tamamen temizler ve sıfırdan yeni bir haftalık çalışma planı sunar.
                        </p>
                      </button>
                    </div>

                    <div className="flex items-center justify-end pt-2 border-t border-slate-800 text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          setShowArchiveConfirm(false);
                          setOverwriteStep(0);
                          setArchiveChoice(null);
                        }}
                        className="px-4 py-2.5 text-slate-400 hover:text-white font-bold transition-colors rounded-xl border border-slate-800 hover:bg-slate-800 cursor-pointer"
                      >
                        Vazgeç
                      </button>
                    </div>
                  </div>
                )}

              </div>
            </div>
          );
        })()
      )}

      {/* MODAL 6: TASK TYPES MANAGEMENT MODAL */}
      {showTaskTypeModal && (
        <div 
          className="fixed inset-0 z-[60] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={(e) => { if (e.target === e.currentTarget) setShowTaskTypeModal(false); }}
        >
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-indigo-500/10 rounded-lg text-indigo-400">
                  <Settings className="w-4 h-4" />
                </div>
                <h3 className="text-base font-black text-white">Görev Tanımları</h3>
              </div>
              <button 
                onClick={() => {
                  setShowTaskTypeModal(false);
                  setEditingTaskTypeIndex(null);
                }} 
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-400 leading-relaxed font-semibold">
              Haftalık çalışma planınızda yer alan görev tiplerini aşağıdan düzenleyebilir, yenilerini ekleyebilir veya silebilirsiniz.
            </div>

            <div className="space-y-2 max-h-[220px] overflow-y-auto custom-scrollbar pr-1">
              {actualTaskTypes.map((type, index) => {
                const isEditing = editingTaskTypeIndex === index;
                const isDeleting = deletingTaskTypeIndex === index;
                const isSystemProtected = DEFAULT_TASK_TYPES.includes(type);

                return (
                  <div 
                    key={index} 
                    className={`flex items-center justify-between p-2.5 rounded-xl transition-all gap-2 group ${
                      isDeleting 
                        ? 'bg-rose-950/20 border border-rose-800/40' 
                        : 'bg-slate-950/60 border border-slate-800 hover:border-slate-700/80'
                    }`}
                  >
                    {isDeleting ? (
                      deletingStep === 1 ? (
                        <div className="flex-1 flex items-center justify-between gap-2 animate-in fade-in duration-200">
                          <span className="text-[11px] font-bold text-rose-400">"{type}" silinsin mi?</span>
                          <div className="flex items-center space-x-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => setDeletingStep(2)}
                              className="px-2 py-1 bg-rose-600/90 hover:bg-rose-500 active:bg-rose-700 text-white rounded-lg text-[10px] font-black cursor-pointer transition-colors shadow-sm"
                            >
                              Evet
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setDeletingTaskTypeIndex(null);
                                setDeletingStep(0);
                              }}
                              className="px-2 py-1 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded-lg text-[10px] font-black cursor-pointer transition-colors"
                            >
                              İptal
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex-1 flex items-center justify-between gap-1.5 animate-in fade-in duration-200">
                          <span className="text-[9px] font-extrabold text-amber-400 leading-tight">
                            Geçmiş görevler etkilenmez. Son onay?
                          </span>
                          <div className="flex items-center space-x-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                const val = actualTaskTypes[index];
                                const updated = actualTaskTypes.filter((_, i) => i !== index);
                                if (onUpdateTaskTypes) {
                                  onUpdateTaskTypes(updated, `Özel görev tanımı silindi: ${val}`);
                                }
                                setDeletingTaskTypeIndex(null);
                                setDeletingStep(0);
                              }}
                              className="px-2 py-1 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white rounded-lg text-[10px] font-black cursor-pointer transition-colors shadow-sm"
                            >
                              Sil
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setDeletingTaskTypeIndex(null);
                                setDeletingStep(0);
                              }}
                              className="px-2 py-1 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded-lg text-[10px] font-black cursor-pointer transition-colors"
                            >
                              İptal
                            </button>
                          </div>
                        </div>
                      )
                    ) : isEditing ? (
                      <div className="flex-1 flex items-center gap-1.5">
                        <input
                          type="text"
                          value={editingTaskTypeValue}
                          onChange={(e) => setEditingTaskTypeValue(e.target.value)}
                          className="flex-1 bg-slate-900 border border-indigo-500/50 rounded-lg px-2 py-1 text-xs text-white focus:outline-none"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleEditTaskType(index);
                            if (e.key === 'Escape') setEditingTaskTypeIndex(null);
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => handleEditTaskType(index)}
                          className="p-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 rounded-lg transition-colors cursor-pointer"
                          title="Kaydet"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingTaskTypeIndex(null)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                          title="İptal"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className="text-xs font-bold text-slate-200 pl-1">{type}</span>
                        <div className="flex items-center space-x-1 shrink-0">
                          {isSystemProtected ? (
                            <span className="text-[9px] px-2 py-0.5 rounded-md bg-indigo-950/50 text-indigo-300 border border-indigo-800/40 font-bold">
                              Sistem
                            </span>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingTaskTypeIndex(index);
                                  setEditingTaskTypeValue(type);
                                }}
                                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                                title="Düzenle"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteTaskType(index)}
                                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                                title="Sil"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="border-t border-slate-800 pt-3.5 space-y-2">
              <label className="block text-xs font-bold text-slate-300">Yeni Görev Tanımı Ekle</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="örn: Kitap Okuma"
                  value={newTaskTypeValue}
                  onChange={(e) => setNewTaskTypeValue(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddTaskType();
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddTaskType}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center space-x-1 shadow-md shadow-indigo-600/10"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Ekle</span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setShowTaskTypeModal(false);
                  setEditingTaskTypeIndex(null);
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer border border-slate-700/50"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DAILY NET STUDY TIME (KRONOMETRE / SERBEST ÇALIŞMA) */}
      {dailyStudyLogModalData && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={(e) => { if (e.target === e.currentTarget && setDailyStudyLogModalData) setDailyStudyLogModalData(null); }}
        >
          <div className="bg-slate-900 backdrop-blur-2xl border border-slate-700 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Günlük Net Çalışma Süresi</h3>
                  <p className="text-xs text-indigo-300 font-semibold">
                    {dailyStudyLogModalData.day} {dailyStudyLogModalData.displayDate && `(${dailyStudyLogModalData.displayDate})`}
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setDailyStudyLogModalData && setDailyStudyLogModalData(null)} 
                className="text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Task Info & Help Tip */}
            <div className="p-3.5 bg-slate-950/80 border border-slate-800/80 rounded-2xl text-xs space-y-2">
              <div className="flex items-center justify-between text-slate-300 font-medium">
                <span>Tamamlanan Görev Süresi:</span>
                <span className="font-mono font-bold text-white bg-slate-800/80 px-2 py-0.5 rounded-lg">
                  {Math.floor(dailyStudyLogModalData.taskMinutes / 60)} sa {dailyStudyLogModalData.taskMinutes % 60} dk
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed border-t border-slate-800/60 pt-2">
                💡 Okul, dershane, kütüphane veya kendi kronometrenizle tuttuğunuz günün toplam net çalışma süresini giriniz.
              </p>
            </div>

            {/* Duration Pickers: Hours & Minutes */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Günün Net Çalışma Süresi
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 flex items-center justify-between focus-within:border-indigo-500 transition-colors">
                  <span className="text-xs font-bold text-slate-400">Saat</span>
                  <div className="flex items-center space-x-1">
                    <input
                      type="number"
                      min="0"
                      max="23"
                      value={modalHours}
                      onChange={(e) => setModalHours(Math.max(0, Math.min(23, parseInt(e.target.value) || 0)))}
                      className="w-14 bg-transparent text-right text-lg font-black text-white font-mono focus:outline-none"
                    />
                    <span className="text-xs text-slate-400 font-bold">sa</span>
                  </div>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 flex items-center justify-between focus-within:border-indigo-500 transition-colors">
                  <span className="text-xs font-bold text-slate-400">Dakika</span>
                  <div className="flex items-center space-x-1">
                    <input
                      type="number"
                      min="0"
                      max="59"
                      step="5"
                      value={modalMinutes}
                      onChange={(e) => setModalMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                      className="w-14 bg-transparent text-right text-lg font-black text-white font-mono focus:outline-none"
                    />
                    <span className="text-xs text-slate-400 font-bold">dk</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono font-bold px-1">
                <span className="text-slate-400">Toplam Dakika: {modalHours * 60 + modalMinutes} dk</span>
                <span className="text-emerald-400">{modalHours} saat {modalMinutes} dakika</span>
              </div>
            </div>

            {/* Optional Notes */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300">
                Günün Çalışma Notu <span className="text-slate-500 font-normal text-[10px]">(Opsiyonel)</span>
              </label>
              <textarea
                value={modalNotes}
                onChange={(e) => setModalNotes(e.target.value)}
                placeholder="örn: Okulda 3 saat etüt, kütüphanede soru çözümü yapıldı..."
                rows={2}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none font-medium"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800 gap-2">
              <div>
                {dailyStudyLogModalData.isManual && handleDeleteDailyStudyLogModal && (
                  <button
                    type="button"
                    onClick={() => {
                      handleDeleteDailyStudyLogModal();
                      if (setDailyStudyLogModalData) setDailyStudyLogModalData(null);
                    }}
                    className="px-3.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5"
                    title="Girdiğiniz süreyi siler ve görev süresine döner"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Sıfırla</span>
                  </button>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setDailyStudyLogModalData && setDailyStudyLogModalData(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer border border-slate-700/50"
                >
                  İptal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const totalMins = modalHours * 60 + modalMinutes;
                    if (handleSaveDailyStudyLogModal) {
                      handleSaveDailyStudyLogModal(totalMins, modalNotes.trim() || undefined);
                    }
                    if (setDailyStudyLogModalData) setDailyStudyLogModalData(null);
                  }}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/30 cursor-pointer flex items-center space-x-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Kaydet</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
