import React, { useState } from 'react';
import { 
  Calendar, 
  Plus, 
  Edit3, 
  Copy, 
  Trash2, 
  Check, 
  Clock, 
  BookOpen, 
  ChevronDown, 
  Sparkles, 
  Edit2,
  Youtube 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { StudyPlanItem, DayOfWeek, QuestionLog } from '../../types';
import { SubjectTheme } from '../StudyPlannerView';

interface StudyPlannerDailyViewProps {
  activePlans: StudyPlanItem[];
  selectedDay: DayOfWeek;
  getSubjectTheme: (subject: string) => SubjectTheme;
  openAddModal: (day?: DayOfWeek) => void;
  openAddVideoModal?: (day?: DayOfWeek) => void;
  setEditingPlan: (plan: StudyPlanItem | null) => void;
  setDeletingPlan: (plan: { id: string; title: string } | null) => void;
  onUpdatePlan: (plan: StudyPlanItem) => void;
  handleCheckClick: (e: React.MouseEvent, plan: StudyPlanItem) => void;
  handleDuplicatePlan: (e: React.MouseEvent, plan: StudyPlanItem) => void;
  QUICK_REFLECTIONS: Array<{ label: string; color: string; activeColor: string; icon: string }>;
  processQuestionLogOnComplete: (plan: StudyPlanItem) => void;
  getLinkedQuestionLogs: (studyPlanId: string, planTopic?: string, planSubject?: string) => QuestionLog[];
  removeLinkedQuestionLog: (studyPlanId: string, planTopic?: string, planSubject?: string) => void;
  setUncompleteConfirm: (data: { plan: StudyPlanItem; targetStatus: 'pending' | 'in_progress'; linkedLogs: QuestionLog[] } | null) => void;
  isArchivedWeek?: boolean;
}

export const StudyPlannerDailyView: React.FC<StudyPlannerDailyViewProps> = ({
  activePlans,
  selectedDay,
  getSubjectTheme,
  openAddModal,
  openAddVideoModal,
  setEditingPlan,
  setDeletingPlan,
  onUpdatePlan,
  handleCheckClick,
  handleDuplicatePlan,
  QUICK_REFLECTIONS,
  processQuestionLogOnComplete,
  getLinkedQuestionLogs,
  removeLinkedQuestionLog,
  setUncompleteConfirm,
  isArchivedWeek = false
}) => {
  const [expandedQuickControls, setExpandedQuickControls] = useState<Record<string, boolean>>({});

  const dayPlans = activePlans.filter(p => p.day === selectedDay);

  return (
    <div className="space-y-6">
      {/* Plan List for Selected Day */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 space-y-5 backdrop-blur-md shadow-2xl">
        <div className="flex flex-row items-start justify-between pb-3.5 sm:pb-4 border-b border-slate-800 gap-2 sm:gap-4">
          <div className="min-w-0 flex-1 pr-1 sm:pr-0">
            <h2 className="text-xs sm:text-lg font-black text-white flex items-center space-x-1.5 sm:space-x-2.5 min-w-0">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400 shrink-0" />
              <span className="truncate">{selectedDay} Günü Detaylı Ders Planı</span>
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-400 mt-1 leading-relaxed">
              Görevlerin durumunu tek tıkla değiştirebilir, gerçekleşen sürenizi girebilir ve hızlı değerlendirme yorumları ekleyebilirsiniz.
            </p>
          </div>

          <div className="flex flex-col items-end shrink-0 gap-1.5 sm:flex-row sm:items-center sm:gap-3 self-start">
            <span className="inline-flex items-center justify-center text-[10px] sm:text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg sm:rounded-full border border-indigo-500/30 font-semibold leading-tight shrink-0 whitespace-nowrap">
              <span className="font-bold mr-1">{dayPlans.length}</span> Görev
            </span>

            {!isArchivedWeek && (
              <div className="flex items-center space-x-2">
                {openAddVideoModal && (
                  <button
                    onClick={() => openAddVideoModal(selectedDay)}
                    className="text-[11px] sm:text-xs bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl transition-all font-bold flex items-center space-x-1 sm:space-x-1.5 shadow-lg shadow-red-600/30 border border-red-400/30 shrink-0 cursor-pointer whitespace-nowrap"
                  >
                    <Youtube className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                    <span>Video Ekle</span>
                  </button>
                )}
                <button
                  onClick={() => openAddModal(selectedDay)}
                  className="text-[11px] sm:text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-xl transition-all font-bold flex items-center space-x-1 sm:space-x-1.5 shadow-lg shadow-indigo-600/30 border border-indigo-400/30 shrink-0 cursor-pointer whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                  <span>Görev Ekle</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {dayPlans.length === 0 ? (
          <div className="text-center py-14 border-2 border-dashed border-slate-800 rounded-2xl bg-slate-950/40">
            <Calendar className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-300 font-bold">Bu gün için henüz bir ders görevi planlanmadı.</p>
            {!isArchivedWeek && (
              <div className="mt-4 flex items-center justify-center gap-2">
                {openAddVideoModal && (
                  <button
                    onClick={() => openAddVideoModal(selectedDay)}
                    className="text-xs bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white px-3.5 py-2 rounded-xl font-bold transition-all shadow-md flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Youtube className="w-4 h-4" />
                    <span>Video Ekle</span>
                  </button>
                )}
                <button
                  onClick={() => openAddModal(selectedDay)}
                  className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl font-bold transition-all shadow-md"
                >
                  + {selectedDay} Gününe Görev Ekle
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {dayPlans.map((plan) => {
              const subjectTheme = getSubjectTheme(plan.subject);
              return (
                <div
                  key={plan.id}
                  className={`p-5 rounded-2xl border transition-all space-y-4 relative ${subjectTheme.cardBorderClass} ${
                    plan.status === 'completed'
                      ? 'bg-slate-950/70 border-emerald-500/30 shadow-md shadow-emerald-950/10'
                      : plan.status === 'in_progress'
                      ? 'bg-slate-950 border-sky-500/40 shadow-lg shadow-sky-950/20 ring-1 ring-sky-500/20'
                      : 'bg-slate-950 border-slate-800 hover:border-indigo-500/40 shadow-md'
                  }`}
                >
                  {/* Top-Right Edit & Delete & Check Actions */}
                  <div className="absolute top-4 right-4 flex flex-col items-center gap-2 z-10">
                    {!isArchivedWeek && (
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => setEditingPlan(plan)}
                          className="p-1.5 bg-slate-900/90 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-all border border-slate-800/80 opacity-50 hover:opacity-100 cursor-pointer shadow-sm"
                          title="Görevi Düzenle"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDuplicatePlan(e, plan)}
                          className="p-1.5 bg-slate-900/90 hover:bg-slate-800 text-slate-400 hover:text-indigo-400 rounded-xl transition-all border border-slate-800/80 opacity-50 hover:opacity-100 cursor-pointer shadow-sm"
                          title="Görevi Kopyala"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingPlan({ id: plan.id, title: `${plan.day} - ${plan.subject}: ${plan.topic}` })}
                          className="p-1.5 bg-slate-900/90 hover:bg-slate-800 text-slate-400 hover:text-rose-400 rounded-xl transition-all border border-slate-800/80 opacity-50 hover:opacity-100 cursor-pointer shadow-sm"
                          title="Sil"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {isArchivedWeek ? (
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border shadow-sm ${
                        plan.status === 'completed'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : plan.status === 'in_progress'
                          ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      }`}>
                        {plan.status === 'completed' ? '✅ Tamamlandı' : plan.status === 'in_progress' ? '⚡ Devam Ediyor' : '⏳ Bekliyor'}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => handleCheckClick(e, plan)}
                        className={`flex items-center justify-center w-7 h-7 rounded-full border transition-all cursor-pointer shrink-0 shadow-md ${
                          plan.status === 'completed'
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 hover:bg-emerald-500/30 shadow-emerald-500/10'
                            : 'bg-slate-950/60 text-slate-500 border-slate-800 hover:text-emerald-400 hover:border-emerald-500/40 hover:bg-emerald-500/5'
                        }`}
                        title={plan.status === 'completed' ? 'Görevi Tamamlanmadı Olarak İşaretle' : 'Görevi Tamamlandı Olarak İşaretle'}
                      >
                        <Check className={`w-4 h-4 ${plan.status === 'completed' ? 'stroke-[3]' : 'stroke-[2]'}`} />
                      </button>
                    )}
                  </div>

                  {/* Header Row: Subject, Topic & Time */}
                  <div className="flex flex-col gap-3 pb-3 border-b border-slate-800/80 pr-16 sm:pr-20">
                    <div className="space-y-1.5 w-full">
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <span className={`text-xs font-black px-2.5 py-0.5 rounded-md border ${subjectTheme.badgeClass}`}>
                          {plan.subject}
                        </span>
                        {plan.taskType && (
                          <span className="text-xs font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-md border border-amber-500/30">
                            {plan.taskType}
                          </span>
                        )}
                      </div>
                      <h3 className={`text-base font-extrabold text-white ${plan.status === 'completed' ? 'line-through text-slate-400 font-medium' : ''} break-words`}>
                        {plan.topic}
                      </h3>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs font-mono bg-slate-900/90 px-4 py-2.5 rounded-xl border border-slate-800 w-full sm:w-auto self-start">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span className="text-slate-400">
                          Hedef Süre: <strong className="text-slate-200">{plan.plannedMinutes} dk</strong>
                        </span>
                      </div>
                      <span className="text-slate-700 font-bold">|</span>
                      <div className="flex items-center space-x-2">
                        <BookOpen className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="text-slate-400">
                          Hedef Soru: <strong className={plan.targetQuestionCount ? "text-emerald-400" : "text-slate-500"}>
                            {plan.targetQuestionCount ? `${plan.targetQuestionCount} Soru` : '-'}
                          </strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Status & Quick Reflection Dropdowns */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setExpandedQuickControls(prev => ({ ...prev, [plan.id]: !prev[plan.id] }))}
                      className="w-full flex items-center justify-between text-xs text-slate-400 hover:text-indigo-300 py-1.5 px-3 rounded-xl bg-slate-950/60 hover:bg-slate-900 border border-slate-800/80 transition-all cursor-pointer"
                    >
                      <span className="flex items-center font-bold text-[11px] sm:text-xs text-slate-300">
                        <span>Hızlı Durum & Yorum Seçenekleri</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold flex items-center space-x-1">
                        <span>{expandedQuickControls[plan.id] ? 'Gizle' : 'Göster'}</span>
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${expandedQuickControls[plan.id] ? 'rotate-180 text-indigo-400' : ''}`} />
                      </span>
                    </button>

                    <AnimatePresence>
                      {expandedQuickControls[plan.id] && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 mt-2 border-t border-slate-800/80">
                            {/* Hızlı Durum Açılır Menü */}
                            <div className="flex items-center space-x-2">
                              <span className="text-xs font-bold text-slate-400 shrink-0">Hızlı Durum:</span>
                              <select
                                disabled={isArchivedWeek}
                                value={plan.status}
                                onChange={(e) => {
                                  if (isArchivedWeek) return;
                                  const newStatus = e.target.value as 'pending' | 'in_progress' | 'completed';
                                  if (newStatus === 'completed' && plan.status !== 'completed') {
                                    const updatedPlan: StudyPlanItem = {
                                      ...plan,
                                      status: 'completed',
                                      completedMinutes: plan.completedMinutes || plan.plannedMinutes || 60,
                                      reflection: plan.reflection || 'Çalıştım'
                                    };
                                    onUpdatePlan(updatedPlan);
                                    processQuestionLogOnComplete(updatedPlan);
                                  } else if (plan.status === 'completed' && newStatus !== 'completed') {
                                    const linked = getLinkedQuestionLogs(plan.id, plan.topic, plan.subject);
                                    if (linked.length > 0) {
                                      setUncompleteConfirm({
                                        plan,
                                        targetStatus: newStatus,
                                        linkedLogs: linked
                                      });
                                    } else {
                                      removeLinkedQuestionLog(plan.id, plan.topic, plan.subject);
                                      onUpdatePlan({
                                        ...plan,
                                        status: newStatus,
                                        completedMinutes: newStatus === 'pending' ? 0 : plan.completedMinutes
                                      });
                                    }
                                  } else {
                                    onUpdatePlan({
                                      ...plan,
                                      status: newStatus,
                                      completedMinutes: newStatus === 'pending' ? 0 : plan.completedMinutes
                                    });
                                  }
                                }}
                                className={`text-xs font-bold px-3 py-1.5 rounded-xl border focus:outline-none transition-all ${
                                  isArchivedWeek ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'
                                } ${
                                  plan.status === 'completed'
                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                    : plan.status === 'in_progress'
                                    ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                }`}
                              >
                                <option value="pending" className="bg-slate-900 text-amber-300">⏳ Bekliyor</option>
                                <option value="in_progress" className="bg-slate-900 text-sky-300">⚡ Devam Ediyor</option>
                                <option value="completed" className="bg-slate-900 text-emerald-300">✅ Tamamladı</option>
                              </select>
                            </div>

                            {/* Hızlı Yorum Açılır Menü */}
                            <div className="flex items-center space-x-2">
                              <span className="text-xs font-bold text-slate-400 shrink-0 flex items-center space-x-1">
                                <Sparkles className="w-3.5 h-3.5 text-fuchsia-400" />
                                <span>Hızlı Yorum:</span>
                              </span>
                              <select
                                disabled={isArchivedWeek}
                                value={plan.reflection || ''}
                                onChange={(e) => {
                                  if (isArchivedWeek) return;
                                  onUpdatePlan({
                                    ...plan,
                                    reflection: e.target.value || undefined
                                  });
                                }}
                                className={`text-xs font-bold px-3 py-1.5 rounded-xl border focus:outline-none transition-all ${
                                  isArchivedWeek ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'
                                } ${
                                  plan.reflection
                                    ? 'bg-fuchsia-500/20 text-fuchsia-200 border-fuchsia-500/40'
                                    : 'bg-slate-900 text-slate-400 border-slate-800'
                                }`}
                              >
                                <option value="" className="bg-slate-900 text-slate-400">-- Yorum Yok --</option>
                                {QUICK_REFLECTIONS.map((chip) => (
                                  <option key={chip.label} value={chip.label} className="bg-slate-900 text-white">
                                    {chip.icon} {chip.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Notes / Custom Comment Display & Inline Editing */}
                  <div className="pt-2 border-t border-slate-800/40">
                    {inlineEditingNotesPlanId === plan.id ? (
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-slate-950/80 p-2.5 rounded-xl border border-indigo-500/30">
                        <input
                          type="text"
                          value={inlineNotesText}
                          onChange={(e) => setInlineNotesText(e.target.value)}
                          placeholder="Not veya detaylı yorumunuzu yazın..."
                          className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              onUpdatePlan({
                                ...plan,
                                notes: inlineNotesText.trim() || undefined
                              });
                              setInlineEditingNotesPlanId(null);
                            } else if (e.key === 'Escape') {
                              setInlineEditingNotesPlanId(null);
                            }
                          }}
                        />
                        <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                          <button
                            onClick={() => {
                              onUpdatePlan({
                                ...plan,
                                notes: inlineNotesText.trim() || undefined
                              });
                              setInlineEditingNotesPlanId(null);
                            }}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer"
                          >
                            <Check className="w-3 h-3" />
                            <span>Kaydet</span>
                          </button>
                          <button
                            onClick={() => setInlineEditingNotesPlanId(null)}
                            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                          >
                            İptal
                          </button>
                        </div>
                      </div>
                    ) : plan.notes ? (
                      <div className="flex items-center justify-between bg-slate-900/90 px-3 py-2 rounded-xl border border-slate-800 text-xs text-slate-300">
                        <div className="flex items-center space-x-2">
                          <span className="text-indigo-400 font-bold">Not:</span>
                          <span className="italic">{plan.notes}</span>
                        </div>
                        <button
                          onClick={() => {
                            setInlineEditingNotesPlanId(plan.id);
                            setInlineNotesText(plan.notes || '');
                          }}
                          className="text-slate-400 hover:text-indigo-300 opacity-60 hover:opacity-100 transition-opacity ml-2 cursor-pointer p-1 rounded hover:bg-slate-800"
                          title="Notu Düzenle"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setInlineEditingNotesPlanId(plan.id);
                          setInlineNotesText('');
                        }}
                        className="text-xs text-slate-500 hover:text-indigo-400 transition-colors flex items-center space-x-1 font-medium cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Not veya Detaylı Yorum Ekleyin...</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
