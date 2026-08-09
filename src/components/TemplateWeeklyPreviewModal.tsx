import React, { useState } from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  Plus, 
  Trash2, 
  Save, 
  Edit3, 
  Check, 
  GripVertical,
  Download,
  Sparkles,
  BookOpen
} from 'lucide-react';
import { StudyProgramTemplate, StudyProgramTemplateItem, DayOfWeek } from '../types';

interface TemplateWeeklyPreviewModalProps {
  template: StudyProgramTemplate;
  onClose: () => void;
  onSave: (updatedTemplate: StudyProgramTemplate) => void;
  onApplyToStudent?: (template: StudyProgramTemplate) => void;
}

const DAYS_OF_WEEK = [
  'Pazartesi',
  'Salı',
  'Çarşamba',
  'Perşembe',
  'Cuma',
  'Cumartesi',
  'Pazar'
];

export const TemplateWeeklyPreviewModal: React.FC<TemplateWeeklyPreviewModalProps> = ({
  template,
  onClose,
  onSave,
  onApplyToStudent
}) => {
  const [editedTitle, setEditedTitle] = useState(template.title);
  const [editedDesc, setEditedDesc] = useState(template.description || '');
  const [editedField, setEditedField] = useState(template.targetField || 'TÜMÜ');
  
  // Local state for items array with unique temporary ids for UI handling
  const [items, setItems] = useState<StudyProgramTemplateItem[]>(
    template.items.map((it, idx) => ({ ...it, id: (it as any).id || `tpl-item-${Date.now()}-${idx}` }))
  );

  const [isEditingHeader, setIsEditingHeader] = useState(false);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);

  // New task inline form state per day
  const [activeNewTaskDay, setActiveNewTaskDay] = useState<string | null>(null);
  const [newTaskSubject, setNewTaskSubject] = useState('Matematik');
  const [newTaskTopic, setNewTaskTopic] = useState('');
  const [newTaskMinutes, setNewTaskMinutes] = useState(60);
  const [newTaskNotes, setNewTaskNotes] = useState('');

  // Editing existing task item state
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editSubject, setEditSubject] = useState<string>('Matematik');
  const [editTopic, setEditTopic] = useState<string>('');
  const [editMinutes, setEditMinutes] = useState<number>(60);
  const [editNotes, setEditNotes] = useState<string>('');
  const [editDay, setEditDay] = useState<DayOfWeek>('Pazartesi');

  const handleStartEditTask = (item: StudyProgramTemplateItem) => {
    const itemId = (item as any).id;
    setEditingItemId(itemId);
    setEditSubject(item.subject);
    setEditTopic(item.topic);
    setEditMinutes(item.plannedMinutes || 45);
    setEditNotes(item.notes || '');
    setEditDay(item.day);
  };

  const handleSaveEditTask = () => {
    if (!editingItemId || !editTopic.trim()) return;

    setItems((prev) =>
      prev.map((it) => {
        if ((it as any).id === editingItemId) {
          return {
            ...it,
            subject: editSubject,
            topic: editTopic.trim(),
            plannedMinutes: Number(editMinutes) || 45,
            notes: editNotes.trim() || undefined,
            day: editDay as DayOfWeek
          };
        }
        return it;
      })
    );

    setEditingItemId(null);
  };

  // Save changes to parent
  const handleSaveChanges = () => {
    const updated: StudyProgramTemplate = {
      ...template,
      title: (editedTitle || '').trim() || 'Adsız Şablon',
      description: (editedDesc || '').trim(),
      targetField: editedField,
      items: items.map(item => ({
        day: item.day,
        subject: item.subject,
        topic: item.topic,
        plannedMinutes: item.plannedMinutes,
        notes: item.notes
      }))
    };
    onSave(updated);
    onClose();
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    e.dataTransfer.setData('text/plain', itemId);
    setDraggedItemId(itemId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetDay: string) => {
    e.preventDefault();
    const itemId = e.dataTransfer.getData('text/plain') || draggedItemId;
    if (!itemId) return;

    setItems((prev) =>
      prev.map((item) => ((item as any).id === itemId ? { ...item, day: targetDay as DayOfWeek } : item))
    );
    setDraggedItemId(null);
  };

  // Add task to day
  const handleAddNewTask = (day: DayOfWeek | string) => {
    if (!newTaskTopic.trim()) return;

    const newItem: StudyProgramTemplateItem = {
      day: day as DayOfWeek,
      subject: newTaskSubject,
      topic: newTaskTopic.trim(),
      plannedMinutes: Number(newTaskMinutes) || 45,
      notes: newTaskNotes.trim() || undefined
    };
    (newItem as any).id = `tpl-item-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

    setItems((prev) => [...prev, newItem]);
    setNewTaskTopic('');
    setNewTaskNotes('');
    setActiveNewTaskDay(null);
  };

  // Remove item
  const handleRemoveTask = (itemId: string) => {
    setItems((prev) => prev.filter((it) => (it as any).id !== itemId));
  };

  // Move item up/down within same day or change day
  const handleMoveDay = (itemId: string, newDay: string) => {
    setItems((prev) =>
      prev.map((item) => ((item as any).id === itemId ? { ...item, day: newDay as DayOfWeek } : item))
    );
  };

  // Total weekly statistics
  const totalMinutes = items.reduce((acc, curr) => acc + (curr.plannedMinutes || 0), 0);
  const totalHours = (totalMinutes / 60).toFixed(1);

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-slate-900/95 backdrop-blur-2xl border border-white/15 rounded-3xl max-w-7xl w-full p-5 sm:p-8 shadow-2xl flex flex-col max-h-[92vh] space-y-5 my-auto animate-in zoom-in-95 duration-200">
        
        {/* Header Section with Title, Description & Action Buttons */}
        <div className="flex flex-col md:flex-row md:items-start justify-between border-b border-white/10 pb-5 gap-4 shrink-0">
          
          <div className="flex-1 space-y-2">
            {isEditingHeader ? (
              <div className="space-y-3 bg-white/5 p-4 rounded-2xl border border-white/10">
                <div className="flex items-center space-x-3">
                  <input
                    type="text"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    placeholder="Şablon İsmi"
                    className="flex-1 bg-slate-950 border border-fuchsia-500/50 rounded-xl px-3 py-2 text-base font-bold text-white focus:outline-none"
                    autoFocus
                  />
                  <select
                    value={editedField}
                    onChange={(e) => setEditedField(e.target.value as any)}
                    className="bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-fuchsia-300 focus:outline-none"
                  >
                    <option value="TÜMÜ">Tüm Alanlar</option>
                    <option value="SAY">SAY (Sayısal)</option>
                    <option value="EA">EA (Eşit Ağırlık)</option>
                    <option value="SÖZ">SÖZ (Sözel)</option>
                    <option value="DİL">DİL (Yabancı Dil)</option>
                  </select>
                </div>

                <textarea
                  rows={2}
                  value={editedDesc}
                  onChange={(e) => setEditedDesc(e.target.value)}
                  placeholder="Şablon Açıklaması ve rehberlik notları..."
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />

                <div className="flex justify-end">
                  <button
                    onClick={() => setIsEditingHeader(false)}
                    className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white text-xs font-bold px-4 py-1.5 rounded-xl transition-all flex items-center space-x-1"
                  >
                    <Check className="w-4 h-4" />
                    <span>Başlık Bilgilerini Onayla</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="group cursor-pointer" onClick={() => setIsEditingHeader(true)}>
                <div className="flex items-center space-x-3">
                  <span className="text-xs font-bold bg-fuchsia-500/20 text-fuchsia-300 px-3 py-1 rounded-full border border-fuchsia-500/30 uppercase tracking-wider">
                    {editedField}
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-white group-hover:text-fuchsia-300 transition-colors flex items-center space-x-2">
                    <span>{editedTitle || 'Adsız Şablon'}</span>
                    <Edit3 className="w-4 h-4 opacity-0 group-hover:opacity-100 text-slate-400 transition-opacity" />
                  </h2>
                </div>
                
                <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl leading-relaxed">
                  {editedDesc || 'Açıklama yok. Düzenlemek için tıklayın.'}
                </p>
                <div className="text-[11px] text-slate-500 mt-1 flex items-center space-x-3">
                  <span>💡 Düzenlemek için başlığa veya açıklamaya tıklayın.</span>
                  <span>•</span>
                  <span>Görevleri sürükleyip bırakarak günleri değiştirebilirsiniz.</span>
                </div>
              </div>
            )}
          </div>

          {/* Stats & Actions */}
          <div className="flex items-center space-x-3 shrink-0 self-end md:self-start">
            <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-2 text-right">
              <span className="text-[10px] text-slate-400 block font-semibold uppercase">Toplam Ders Süresi</span>
              <div className="text-sm font-extrabold text-fuchsia-300 font-mono">
                {totalHours} Saat ({totalMinutes} dk)
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-all"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* 7-Day Weekly Grid Container */}
        <div className="flex-1 overflow-y-auto pr-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 min-h-[450px]">
            {DAYS_OF_WEEK.map((dayName) => {
              const dayItems = items.filter((item) => item.day === dayName);
              const dayMinutes = dayItems.reduce((acc, curr) => acc + (curr.plannedMinutes || 0), 0);
              const isAddingNew = activeNewTaskDay === dayName;

              return (
                <div
                  key={dayName}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, dayName)}
                  className={`bg-slate-950/70 border rounded-2xl p-3 flex flex-col justify-between transition-all ${
                    draggedItemId ? 'border-dashed border-fuchsia-500/50 bg-fuchsia-950/10' : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  {/* Day Header */}
                  <div className="space-y-1 pb-2 border-b border-white/10">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-white flex items-center space-x-1.5">
                        <Calendar className="w-3.5 h-3.5 text-fuchsia-400" />
                        <span>{dayName}</span>
                      </h3>
                      <span className="text-[10px] font-mono font-semibold text-slate-400 bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
                        {dayItems.length} Görev
                      </span>
                    </div>

                    <div className="text-[10px] text-fuchsia-300 font-mono font-medium">
                      Toplam {dayMinutes} dk
                    </div>
                  </div>

                  {/* Task Items List */}
                  <div className="flex-1 space-y-2 py-2 overflow-y-auto max-h-[360px] scrollbar-thin">
                    {dayItems.length === 0 ? (
                      <div className="h-24 flex flex-col items-center justify-center text-center p-2 border border-dashed border-white/10 rounded-xl text-slate-500 text-[11px]">
                        <span>Sürükleyip bırakın veya görev ekleyin</span>
                      </div>
                    ) : (
                      dayItems.map((item) => {
                        const itemId = (item as any).id;
                        const isEditingThis = editingItemId === itemId;

                        if (isEditingThis) {
                          return (
                            <div key={itemId} className="bg-fuchsia-950/40 border border-fuchsia-500/50 rounded-xl p-2.5 space-y-2 text-xs shadow-lg">
                              <div className="flex items-center justify-between pb-1 border-b border-fuchsia-500/20">
                                <span className="text-[10px] font-bold text-fuchsia-300">Görevi Düzenle</span>
                                <button onClick={() => setEditingItemId(null)} className="text-slate-400 hover:text-white p-0.5">
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              <select
                                value={editSubject}
                                onChange={(e) => setEditSubject(e.target.value)}
                                className="w-full bg-slate-950 border border-white/10 rounded-lg px-2 py-1 text-white text-xs font-semibold focus:outline-none focus:border-fuchsia-400"
                              >
                                <option value="Matematik">Matematik</option>
                                <option value="Geometri">Geometri</option>
                                <option value="Fizik">Fizik</option>
                                <option value="Kimya">Kimya</option>
                                <option value="Biyoloji">Biyoloji</option>
                                <option value="Türkçe / Edebiyat">Türkçe / Edebiyat</option>
                                <option value="Tarih">Tarih</option>
                                <option value="Coğrafya">Coğrafya</option>
                                <option value="Felsefe">Felsefe</option>
                                <option value="Din Kültürü">Din Kültürü</option>
                                <option value="İngilizce">İngilizce</option>
                                <option value="Genel Deneme">Genel Deneme</option>
                                <option value="Branş Denemesi">Branş Denemesi</option>
                                <option value="Soru Çözümü / Etüt">Soru Çözümü / Etüt</option>
                              </select>

                              <input
                                type="text"
                                placeholder="Konu / Detay"
                                value={editTopic}
                                onChange={(e) => setEditTopic(e.target.value)}
                                className="w-full bg-slate-950 border border-white/10 rounded-lg px-2 py-1 text-white text-xs focus:outline-none focus:border-fuchsia-400"
                              />

                              <div className="flex items-center space-x-2">
                                <input
                                  type="number"
                                  min={5}
                                  step={5}
                                  value={editMinutes}
                                  onChange={(e) => setEditMinutes(Number(e.target.value))}
                                  className="w-16 bg-slate-950 border border-white/10 rounded-lg px-2 py-1 text-white text-xs font-mono focus:outline-none focus:border-fuchsia-400"
                                />
                                <span className="text-[10px] text-slate-400">dk</span>

                                <select
                                  value={editDay}
                                  onChange={(e) => setEditDay(e.target.value as DayOfWeek)}
                                  className="bg-slate-950 text-[10px] text-slate-300 rounded-lg border border-white/10 px-1.5 py-1 focus:outline-none ml-auto"
                                >
                                  {DAYS_OF_WEEK.map((d) => (
                                    <option key={d} value={d}>{d}</option>
                                  ))}
                                </select>
                              </div>

                              <input
                                type="text"
                                placeholder="Notlar (İsteğe bağlı)"
                                value={editNotes}
                                onChange={(e) => setEditNotes(e.target.value)}
                                className="w-full bg-slate-950 border border-white/10 rounded-lg px-2 py-1 text-slate-300 text-[11px] focus:outline-none"
                              />

                              <div className="flex justify-end space-x-1.5 pt-1">
                                <button
                                  type="button"
                                  onClick={() => setEditingItemId(null)}
                                  className="px-2 py-1 text-[10px] text-slate-400 hover:text-white"
                                >
                                  İptal
                                </button>
                                <button
                                  type="button"
                                  onClick={handleSaveEditTask}
                                  className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold px-3 py-1 text-[10px] rounded-lg transition-all flex items-center space-x-1 shadow-md shadow-fuchsia-600/30"
                                >
                                  <Check className="w-3 h-3" />
                                  <span>Kaydet</span>
                                </button>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div
                            key={itemId}
                            draggable
                            onDragStart={(e) => handleDragStart(e, itemId)}
                            className="bg-slate-900/90 hover:bg-slate-800 border border-white/10 rounded-xl p-2.5 space-y-1.5 shadow-md cursor-grab active:cursor-grabbing group transition-all hover:border-fuchsia-500/40 relative"
                          >
                            <div className="flex items-start justify-between gap-1">
                              <div className="flex items-center space-x-1 min-w-0">
                                <GripVertical className="w-3.5 h-3.5 text-slate-500 group-hover:text-fuchsia-400 shrink-0" />
                                <span className="text-[11px] font-bold text-fuchsia-300 bg-fuchsia-500/20 px-1.5 py-0.5 rounded border border-fuchsia-500/30 truncate">
                                  {item.subject}
                                </span>
                              </div>

                              <div className="flex items-center space-x-1 shrink-0">
                                <span className="text-[10px] font-mono text-slate-300 bg-white/5 px-1.5 py-0.5 rounded mr-0.5">
                                  {item.plannedMinutes} dk
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStartEditTask(item);
                                  }}
                                  className="text-slate-400 hover:text-fuchsia-300 p-1 transition-all rounded bg-slate-950/60 hover:bg-fuchsia-950/60 border border-white/5 hover:border-fuchsia-500/30 opacity-50 hover:opacity-100"
                                  title="Görevi Düzenle"
                                >
                                  <Edit3 className="w-3 h-3 text-fuchsia-400" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveTask(itemId);
                                  }}
                                  className="text-slate-400 hover:text-rose-400 p-1 transition-all rounded bg-slate-950/60 hover:bg-rose-950/60 border border-white/5 hover:border-rose-500/30 opacity-50 hover:opacity-100"
                                  title="Görevi Sil"
                                >
                                  <Trash2 className="w-3 h-3 text-rose-400" />
                                </button>
                              </div>
                            </div>

                            <p className="text-xs font-semibold text-white pl-4 leading-tight">
                              {item.topic}
                            </p>

                            {item.notes && (
                              <p className="text-[10px] text-slate-400 italic pl-4">
                                {item.notes}
                              </p>
                            )}

                            {/* Mobile move helper */}
                            <div className="pt-1 flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <select
                                value={item.day}
                                onChange={(e) => handleMoveDay(itemId, e.target.value)}
                                className="bg-slate-950 text-[9px] text-slate-300 rounded border border-white/10 px-1 py-0.5 focus:outline-none"
                              >
                                {DAYS_OF_WEEK.map((d) => (
                                  <option key={d} value={d}>{d}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        );
                      })
                    )}

                    {/* Quick Add Form inside Day */}
                    {isAddingNew && (
                      <div className="bg-fuchsia-950/40 border border-fuchsia-500/40 rounded-xl p-2.5 space-y-2 text-xs">
                        <select
                          value={newTaskSubject}
                          onChange={(e) => setNewTaskSubject(e.target.value)}
                          className="w-full bg-slate-950 border border-white/10 rounded-lg px-2 py-1 text-white text-xs font-semibold focus:outline-none"
                        >
                          <option value="Matematik">Matematik</option>
                          <option value="Geometri">Geometri</option>
                          <option value="Fizik">Fizik</option>
                          <option value="Kimya">Kimya</option>
                          <option value="Biyoloji">Biyoloji</option>
                          <option value="Türkçe / Edebiyat">Türkçe / Edebiyat</option>
                          <option value="Tarih">Tarih</option>
                          <option value="Coğrafya">Coğrafya</option>
                          <option value="Felsefe">Felsefe</option>
                          <option value="Din Kültürü">Din Kültürü</option>
                          <option value="İngilizce">İngilizce</option>
                          <option value="Genel Deneme">Genel Deneme</option>
                        </select>

                        <input
                          type="text"
                          placeholder="Konu adı veya Görev detayı"
                          value={newTaskTopic}
                          onChange={(e) => setNewTaskTopic(e.target.value)}
                          className="w-full bg-slate-950 border border-white/10 rounded-lg px-2 py-1 text-white text-xs focus:outline-none"
                        />

                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            min={10}
                            step={5}
                            value={newTaskMinutes}
                            onChange={(e) => setNewTaskMinutes(Number(e.target.value))}
                            className="w-20 bg-slate-950 border border-white/10 rounded-lg px-2 py-1 text-white text-xs font-mono focus:outline-none"
                          />
                          <span className="text-[10px] text-slate-400">dakika</span>
                        </div>

                        <div className="flex justify-end space-x-1.5 pt-1">
                          <button
                            onClick={() => setActiveNewTaskDay(null)}
                            className="px-2 py-1 text-[10px] text-slate-400 hover:text-white"
                          >
                            İptal
                          </button>
                          <button
                            onClick={() => handleAddNewTask(dayName)}
                            className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold px-3 py-1 text-[10px] rounded-lg transition-all"
                          >
                            Ekle
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Add Button at bottom of day column */}
                  {!isAddingNew && (
                    <button
                      onClick={() => {
                        setActiveNewTaskDay(dayName);
                        setNewTaskTopic('');
                      }}
                      className="w-full mt-2 py-1.5 bg-white/5 hover:bg-fuchsia-600/20 text-slate-400 hover:text-fuchsia-200 border border-dashed border-white/10 hover:border-fuchsia-500/40 rounded-xl text-[11px] font-semibold transition-all flex items-center justify-center space-x-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{dayName}'ye Görev Ekle</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer Bar */}
        <div className="border-t border-white/10 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-400 flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-fuchsia-400" />
            <span>Yapılan tüm sürükle-bırak ve metin düzenlemeleri "Şablonu Kaydet" butonuna basınca güncellenir.</span>
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
            {onApplyToStudent && (
              <button
                type="button"
                onClick={() => {
                  const currentUpdated: StudyProgramTemplate = {
                    ...template,
                    title: (editedTitle || '').trim() || 'Adsız Şablon',
                    description: (editedDesc || '').trim(),
                    targetField: editedField,
                    items: items.map(item => ({
                      day: item.day,
                      subject: item.subject,
                      topic: item.topic,
                      plannedMinutes: item.plannedMinutes,
                      notes: item.notes
                    }))
                  };
                  onApplyToStudent(currentUpdated);
                }}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all border border-indigo-400/30 flex items-center space-x-2 shadow-lg shadow-indigo-600/20"
              >
                <Download className="w-4 h-4" />
                <span>Öğrenciye Uygula</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleSaveChanges}
              className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all border border-fuchsia-400/40 flex items-center space-x-2 shadow-lg shadow-fuchsia-600/30"
            >
              <Save className="w-4 h-4" />
              <span>Değişiklikleri Kaydet</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
