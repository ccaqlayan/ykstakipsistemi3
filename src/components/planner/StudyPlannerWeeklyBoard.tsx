import React from 'react';
import { 
  Sparkles, 
  Plus, 
  GripVertical, 
  Check, 
  CalendarDays, 
  ArrowRightLeft, 
  Copy, 
  Trash2,
  Youtube,
  ExternalLink,
  Play
} from 'lucide-react';
import { StudyPlanItem, DayOfWeek } from '../../types';
import { SubjectTheme } from '../StudyPlannerView';
import { getYouTubeThumbnailFromPlan, getYouTubeUrlFromPlan, isVideoTask, formatDurationBadge } from '../../utils/youtubeUtils';

interface StudyPlannerWeeklyBoardProps {
  activePlans: StudyPlanItem[];
  today: DayOfWeek;
  DAYS: DayOfWeek[];
  getSubjectTheme: (subject: string) => SubjectTheme;
  DAY_COLUMN_STYLES: Record<string, any>;
  dragOverDay: DayOfWeek | null;
  draggedPlanId: string | null;
  touchDraggedPlanId: string | null;
  openMoveMenuPlanId: string | null;
  setOpenMoveMenuPlanId: (id: string | null) => void;
  handleDragOver: (e: React.DragEvent, day: DayOfWeek) => void;
  handleDragLeave: (e: React.DragEvent, day: DayOfWeek) => void;
  handleDrop: (e: React.DragEvent, targetDay: DayOfWeek) => void;
  handleDragStart: (e: React.DragEvent, planId: string) => void;
  handleDragEnd: () => void;
  handleTouchStart: (e: React.TouchEvent, planId: string) => void;
  handleTouchMove: (e: React.TouchEvent) => void;
  handleTouchEnd: (e?: React.TouchEvent) => void;
  handleCheckClick: (e: React.MouseEvent, plan: StudyPlanItem) => void;
  handleQuickMoveDay: (plan: StudyPlanItem, targetDay: DayOfWeek) => void;
  handleDuplicatePlan: (e: React.MouseEvent, plan: StudyPlanItem) => void;
  openAddModal: (day?: DayOfWeek) => void;
  openAddVideoModal?: (day?: DayOfWeek) => void;
  setEditingPlan: (plan: StudyPlanItem | null) => void;
  setDeletingPlan: (plan: { id: string; title: string } | null) => void;
  touchStartRef: any;
  weekDaysMap?: Record<string, { isoDate: string; displayDate: string }>;
  isArchivedWeek?: boolean;
  isFutureWeek?: boolean;
}

export const StudyPlannerWeeklyBoard: React.FC<StudyPlannerWeeklyBoardProps> = ({
  activePlans,
  today,
  DAYS,
  getSubjectTheme,
  DAY_COLUMN_STYLES,
  dragOverDay,
  draggedPlanId,
  touchDraggedPlanId,
  openMoveMenuPlanId,
  setOpenMoveMenuPlanId,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  handleDragStart,
  handleDragEnd,
  handleTouchStart,
  handleTouchMove,
  handleTouchEnd,
  handleCheckClick,
  handleQuickMoveDay,
  handleDuplicatePlan,
  openAddModal,
  openAddVideoModal,
  setEditingPlan,
  setDeletingPlan,
  touchStartRef,
  weekDaysMap,
  isArchivedWeek = false,
  isFutureWeek = false
}) => {
  return (
    <div className="space-y-4">
      {isArchivedWeek && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between text-xs text-amber-300">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span><strong>Geçmiş Hafta Arşivi:</strong> Şu an geçmiş bir haftanın kaydını görüntülüyorsunuz. Tamamlanan dersler veritabanında saklanmıştır.</span>
          </div>
        </div>
      )}

      {isFutureWeek && (
        <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl flex items-center justify-between text-xs text-indigo-300">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
            <span><strong>Gelecek Hafta Planı:</strong> Bu hafta için ders ve hedef planlaması yapıyorsunuz. Haftası geldiğinde otomatik aktifleşecektir.</span>
          </div>
        </div>
      )}

      {!isArchivedWeek && !isFutureWeek && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-400 bg-slate-900/40 p-3 rounded-2xl border border-slate-800">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
            <span><strong>Sürükle & Bırak İpucu:</strong> Herhangi bir görevi basılı tutarak başka bir günün sütununa sürükleyin. Sürüklediğinizde hedef sütun mor renkle parlayacaktır.</span>
          </div>
        </div>
      )}


      {/* Drag and Drop Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-10 gap-3.5">
        {DAYS.map((day) => {
          const dayPlans = activePlans.filter((p) => p.day === day);
          const completedCount = dayPlans.filter((p) => p.status === 'completed').length;
          const isDragTarget = dragOverDay === day;
          const isWeekend = day === 'Cumartesi' || day === 'Pazar';
          const dayStyle = DAY_COLUMN_STYLES[day];
          const isToday = day === today && !isArchivedWeek && !isFutureWeek;

          return (
            <div
              key={day}
              data-day-column={day}
              onDragOver={(e) => handleDragOver(e, day)}
              onDragLeave={(e) => handleDragLeave(e, day)}
              onDrop={(e) => handleDrop(e, day)}
              className={`flex flex-col rounded-2xl border transition-all duration-200 min-h-[420px] relative overflow-hidden day-column-${dayStyle?.dayClassKey || 'day'} ${
                isWeekend ? 'lg:col-span-5' : 'lg:col-span-2'
              } ${
                isDragTarget
                  ? 'bg-indigo-950/80 border-indigo-500 border-2 shadow-2xl shadow-indigo-500/30 scale-[1.02] z-10'
                  : `${dayStyle?.bg || ''} ${dayStyle?.border || ''}`
              }`}
            >
              {/* Accent Colored Line at the Top of Day Column */}
              <div className={`h-1.5 w-full ${dayStyle?.accentBar || ''}`} />

              {/* Column Header */}
              <div className={`p-3.5 border-b flex items-center justify-between day-header-${dayStyle?.dayClassKey || 'day'} ${
                isDragTarget ? 'bg-indigo-900/90 border-indigo-500/60' : (dayStyle?.headerBg || '')
              }`}>
                <div className="flex flex-col gap-0.5">
                  <h3 className={`text-base sm:text-lg font-black tracking-wider uppercase day-title-text flex items-center gap-1.5 ${
                    isToday ? 'text-white' : (dayStyle?.titleColor || '')
                  }`}>
                    <span>{day.toUpperCase()}</span>
                    {weekDaysMap && weekDaysMap[day] && (
                      <span className="text-xs font-semibold opacity-75 lowercase tracking-normal">
                        ({weekDaysMap[day].displayDate})
                      </span>
                    )}
                  </h3>
                  <div className="text-[11px] font-semibold flex items-center space-x-2 mt-0.5">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold day-header-badge ${dayStyle?.badgeBg || ''}`}>
                      {completedCount}/{dayPlans.length} Görev Bitti
                    </span>
                    {isToday && (
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-indigo-500 text-white uppercase tracking-wider shadow-sm animate-pulse shrink-0">
                        BUGÜN
                      </span>
                    )}
                  </div>
                </div>

                {!isArchivedWeek && (
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => openAddModal(day)}
                      className={`p-1.5 rounded-xl transition-all border shadow-sm day-header-add-btn ${
                        isToday
                          ? 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-400'
                          : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-700/60'
                      }`}
                      title={`${day} gününe görev ekle`}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Drag Target Banner when hovering */}
              {isDragTarget && !isArchivedWeek && (
                <div className="m-2 p-2 bg-indigo-500/30 border border-indigo-400/60 rounded-xl text-[11px] font-bold text-indigo-100 text-center animate-pulse">
                  📥 {day.toUpperCase()} Gününe Bırak
                </div>
              )}

              {/* Tasks List inside Day Column */}
              <div className="p-2.5 flex-1 space-y-2.5">
                {dayPlans.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center p-4 border border-dashed border-slate-800 rounded-xl text-center text-[11px] text-slate-500">
                    <span>Görev yok</span>
                    {!isArchivedWeek && (
                      <div className="flex items-center justify-center mt-2">
                        <button
                          onClick={() => openAddModal(day)}
                          className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300"
                        >
                          + Görev Ekle
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  dayPlans.map((plan) => {
                    const isBeingDragged = draggedPlanId === plan.id;
                    const subjectTheme = getSubjectTheme(plan.subject);

                    return (
                      <div
                        key={plan.id}
                        draggable={!isArchivedWeek}
                        onDragStart={(e) => !isArchivedWeek && handleDragStart(e, plan.id)}
                        onDragEnd={handleDragEnd}
                        onTouchStart={(e) => !isArchivedWeek && handleTouchStart(e, plan.id)}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                        onTouchCancel={handleTouchEnd}
                        onContextMenu={(e) => e.preventDefault()}
                        onClick={(e) => {
                          if (isArchivedWeek) return;
                          if (touchStartRef.current?.moved) {
                            e.preventDefault();
                            e.stopPropagation();
                            return;
                          }
                          setEditingPlan(plan);
                        }}
                        className={`group p-3 rounded-xl border transition-all relative select-none ${
                          isArchivedWeek 
                            ? 'cursor-default' 
                            : 'cursor-grab active:cursor-grabbing'
                        } ${
                          touchDraggedPlanId === plan.id 
                            ? 'touch-none opacity-80 shadow-indigo-500/30 shadow-xl scale-[1.03] border-indigo-500/80 bg-slate-900' 
                            : 'touch-pan-y'
                        } ${subjectTheme.cardBorderClass} ${
                          isBeingDragged
                            ? 'opacity-40 scale-95 border-dashed border-indigo-400'
                            : plan.status === 'completed'
                            ? 'bg-emerald-950/20 border-emerald-500/30 text-slate-300'
                            : 'bg-slate-950 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'
                        }`}
                      >
                        {/* Drag Grip Handle */}
                        <div className="flex items-start justify-between gap-1.5 mb-1.5">
                          <div className="flex items-center space-x-1 flex-wrap gap-y-1">
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded border truncate max-w-[120px] ${subjectTheme.badgeClass}`}>
                              {plan.subject}
                            </span>
                            {plan.taskType && (
                              <span className="text-[10px] font-bold text-amber-300 bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/30">
                                {plan.taskType}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            {!isArchivedWeek && (
                              <GripVertical className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 flex-shrink-0" />
                            )}

                            {isArchivedWeek ? (
                              <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold ${
                                plan.status === 'completed'
                                  ? 'bg-emerald-500 text-white'
                                  : 'bg-slate-800 text-slate-500 border border-slate-700'
                              }`}>
                                {plan.status === 'completed' ? <Check className="w-3 h-3 stroke-[3]" /> : '•'}
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => handleCheckClick(e, plan)}
                                className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${
                                  plan.status === 'completed'
                                    ? 'bg-emerald-500 text-white'
                                    : 'border border-slate-700 hover:border-emerald-400 text-transparent hover:text-emerald-400/40'
                                }`}
                                title={plan.status === 'completed' ? 'Tamamlanmadı yap' : 'Tamamla ve Süre Gir'}
                              >
                                <Check className="w-3 h-3 stroke-[3]" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Topic Title */}
                        <h4 className={`text-xs font-bold leading-snug ${
                          plan.status === 'completed' ? 'line-through text-slate-400 font-normal' : 'text-white'
                        }`}>
                          {plan.topic}
                        </h4>

                        {/* YouTube Video Thumbnail & Link Preview */}
                        {(() => {
                          const thumbUrl = getYouTubeThumbnailFromPlan(plan);
                          const ytUrl = getYouTubeUrlFromPlan(plan);
                          if (!thumbUrl && !ytUrl) return null;

                          return (
                            <div className="mt-2 relative rounded-xl overflow-hidden border border-red-500/30 group/yt bg-slate-950">
                              {thumbUrl ? (
                                <a
                                  href={ytUrl || '#'}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="block relative aspect-video w-full"
                                  title="YouTube'da İzle"
                                >
                                  <img
                                    src={thumbUrl}
                                    alt={plan.topic}
                                    referrerPolicy="no-referrer"
                                    className="w-full h-full object-cover group-hover/yt:scale-105 transition-transform duration-300"
                                  />
                                  <div className="absolute inset-0 bg-black/20 group-hover/yt:bg-black/40 transition-colors flex items-center justify-center">
                                    <div className="w-7 h-7 bg-red-600 group-hover/yt:bg-red-500 text-white rounded-full shadow-md scale-90 group-hover/yt:scale-100 transition-all flex items-center justify-center">
                                      <Play className="w-3.5 h-3.5 text-white fill-white ml-0.5" />
                                    </div>
                                  </div>
                                  {plan.plannedMinutes && plan.plannedMinutes > 0 ? (
                                    <div className="absolute bottom-1 right-1 bg-black/85 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded font-mono shadow-md border border-white/10 pointer-events-none">
                                      {formatDurationBadge(plan.plannedMinutes)}
                                    </div>
                                  ) : null}
                                </a>
                              ) : ytUrl ? (
                                <a
                                  href={ytUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="p-1.5 text-[10px] font-bold text-red-400 hover:text-red-300 flex items-center justify-between bg-red-500/10 hover:bg-red-500/20 transition-all"
                                >
                                  <div className="flex items-center space-x-1 truncate">
                                    <Youtube className="w-3 h-3 text-red-500 shrink-0" />
                                    <span className="truncate">Videoyu İzle</span>
                                  </div>
                                  <ExternalLink className="w-3 h-3 shrink-0 ml-1" />
                                </a>
                              ) : null}
                            </div>
                          );
                        })()}

                        {/* Target Duration & Question Count ONLY (Hidden for Video tasks) */}
                        {!isVideoTask(plan) && (
                          <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 pt-1.5 border-t border-slate-800/80 font-mono">
                            <span>Hedef: <strong className="text-slate-200">{plan.plannedMinutes}dk</strong></span>
                            {plan.targetQuestionCount ? (
                              <span className="text-emerald-400 font-bold">({plan.targetQuestionCount} Soru)</span>
                            ) : (
                              <span className="text-slate-600 font-medium">(- Soru)</span>
                            )}
                          </div>
                        )}

                        {isArchivedWeek ? (
                          <div className="mt-2 pt-1.5 flex items-center justify-between text-[10px] border-t border-slate-800/80">
                            <span className={plan.status === 'completed' ? 'text-emerald-400 font-bold flex items-center gap-1' : 'text-slate-500 font-medium'}>
                              {plan.status === 'completed' ? '✅ Tamamlandı' : '⏳ Tamamlanmadı'}
                            </span>
                            <span className="text-slate-300 font-mono font-semibold">
                              {plan.completedMinutes ? `${plan.completedMinutes} dk` : `${plan.plannedMinutes} dk`}
                            </span>
                          </div>
                        ) : (
                          /* Quick Day Shift Popover Button (For Touch/Click Convenience) */
                          <div className="mt-2 pt-1 flex items-center justify-between opacity-90 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                            <div className="relative">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenMoveMenuPlanId(openMoveMenuPlanId === plan.id ? null : plan.id);
                                }}
                                className={`p-1.5 rounded-lg border transition-all cursor-pointer flex items-center justify-center ${
                                  openMoveMenuPlanId === plan.id
                                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                                    : 'bg-slate-900/90 text-slate-300 hover:text-indigo-300 hover:bg-slate-800 border-slate-800'
                                }`}
                                title="Günü Değiştir"
                              >
                                <CalendarDays className="w-3.5 h-3.5 text-indigo-400" />
                              </button>

                              {openMoveMenuPlanId === plan.id && (
                                <div className="absolute left-0 bottom-full mb-1.5 z-40 w-36 bg-slate-900 border border-slate-700/90 rounded-xl shadow-2xl p-1.5 space-y-0.5 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-md">
                                  <div className="text-[9px] font-extrabold text-indigo-400 px-2 py-1 uppercase tracking-wider border-b border-slate-800 mb-1 flex items-center justify-between">
                                    <span>Günü Seçin</span>
                                    <ArrowRightLeft className="w-2.5 h-2.5 text-indigo-400" />
                                  </div>
                                  {DAYS.map((d) => (
                                    <button
                                      key={d}
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleQuickMoveDay(plan, d);
                                        setOpenMoveMenuPlanId(null);
                                      }}
                                      className={`w-full text-left text-[11px] font-semibold px-2 py-1 rounded-lg transition-colors flex items-center justify-between cursor-pointer ${
                                        plan.day === d
                                          ? 'bg-indigo-600 text-white font-bold shadow-sm'
                                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                      }`}
                                    >
                                      <span>{d}</span>
                                      {plan.day === d && <Check className="w-3 h-3 stroke-[3]" />}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>

                            <div className="flex items-center space-x-1">
                              <button
                                type="button"
                                onClick={(e) => handleDuplicatePlan(e, plan)}
                                className="text-[10px] text-slate-500 hover:text-indigo-400 p-0.5 rounded transition-colors cursor-pointer"
                                title="Görevi Kopyala"
                              >
                                <Copy className="w-3 h-3" />
                              </button>

                              <button
                                type="button"
                                onClick={() => setDeletingPlan({ id: plan.id, title: `${plan.day} - ${plan.subject}: ${plan.topic}` })}
                                className="text-[10px] text-slate-500 hover:text-rose-400 p-0.5 cursor-pointer"
                                title="Sil"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        )}

                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
