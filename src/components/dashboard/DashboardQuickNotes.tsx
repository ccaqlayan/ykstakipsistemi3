import React, { useState } from 'react';
import { StickyNote, Plus, X, Pin, PinOff, Edit2, Trash2, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { QuickNote } from '../../types';

interface DashboardQuickNotesProps {
  quickNotes: QuickNote[];
  onUpdateQuickNotes?: (notes: QuickNote[], actionText?: string) => void;
}

export const DashboardQuickNotes: React.FC<DashboardQuickNotesProps> = ({
  quickNotes = [],
  onUpdateQuickNotes
}) => {
  const [newNoteText, setNewNoteText] = useState('');
  const [newNoteColor, setNewNoteColor] = useState<'amber' | 'emerald' | 'sky' | 'rose' | 'purple' | 'slate'>('amber');
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);

  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editNoteText, setEditNoteText] = useState('');
  const [editNoteColor, setEditNoteColor] = useState<'amber' | 'emerald' | 'sky' | 'rose' | 'purple' | 'slate'>('amber');

  const [draggedNoteId, setDraggedNoteId] = useState<string | null>(null);
  const [dragOverNoteId, setDragOverNoteId] = useState<string | null>(null);

  const notesList = [...(quickNotes || [])].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    const orderA = typeof a.order === 'number' ? a.order : 0;
    const orderB = typeof b.order === 'number' ? b.order : 0;
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    return b.id.localeCompare(a.id);
  });

  const handleAddNote = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newNoteText.trim()) return;

    const now = new Date();
    const dateStr = now.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const minOrder = quickNotes?.reduce((min, n) => (typeof n.order === 'number' && n.order < min) ? n.order : min, 0) || 0;

    const newNote: QuickNote = {
      id: 'note-' + Date.now(),
      text: newNoteText.trim(),
      createdAt: dateStr,
      color: newNoteColor,
      isPinned: false,
      order: minOrder - 1
    };

    const updated = [newNote, ...(quickNotes || [])];
    if (onUpdateQuickNotes) {
      onUpdateQuickNotes(updated, 'Yeni hızlı not eklendi.');
    }
    setNewNoteText('');
    setShowNoteForm(false);
  };

  const handleDeleteNote = (id: string) => {
    const updated = (quickNotes || []).filter(n => n.id !== id);
    if (onUpdateQuickNotes) {
      onUpdateQuickNotes(updated, 'Hızlı not silindi.');
    }
  };

  const handleTogglePin = (id: string) => {
    const updated = (quickNotes || []).map(n => n.id === id ? { ...n, isPinned: !n.isPinned } : n);
    if (onUpdateQuickNotes) {
      onUpdateQuickNotes(updated, 'Not iğne durumu değiştirildi.');
    }
  };

  const handleEditNote = (note: QuickNote) => {
    setEditingNoteId(note.id);
    setEditNoteText(note.text);
    setEditNoteColor(note.color || 'amber');
  };

  const handleSaveEdit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editingNoteId || !editNoteText.trim()) return;

    const updated = (quickNotes || []).map(n => 
      n.id === editingNoteId 
        ? { ...n, text: editNoteText.trim(), color: editNoteColor }
        : n
    );
    
    if (onUpdateQuickNotes) {
      onUpdateQuickNotes(updated, 'Not güncellendi.');
    }
    setEditingNoteId(null);
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedNoteId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedNoteId === id) return;
    setDragOverNoteId(id);
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    setDragOverNoteId(null);
    
    if (!draggedNoteId || draggedNoteId === targetId) {
      setDraggedNoteId(null);
      return;
    }
    
    const currentIndex = notesList.findIndex(n => n.id === draggedNoteId);
    const targetIndex = notesList.findIndex(n => n.id === targetId);
    
    if (currentIndex === -1 || targetIndex === -1) return;
    
    const newNotesList = [...notesList];
    const [movedItem] = newNotesList.splice(currentIndex, 1);
    
    const targetItem = notesList[targetIndex];
    movedItem.isPinned = targetItem?.isPinned ?? movedItem.isPinned;
    
    newNotesList.splice(targetIndex, 0, movedItem);
    
    const updatedNotesList = newNotesList.map((note, index) => ({
      ...note,
      order: index
    }));
    
    if (onUpdateQuickNotes) {
      onUpdateQuickNotes(updatedNotesList, 'Not sıralaması güncellendi.');
    }
    setDraggedNoteId(null);
  };

  const getColorStyles = (color: string = 'amber', isPinned: boolean = false) => {
    switch (color) {
      case 'emerald':
        return {
          bg: isPinned
            ? 'bg-emerald-900/80 border border-emerald-400 shadow-lg shadow-emerald-950/60'
            : 'bg-emerald-950/40 border border-emerald-500/30 hover:border-emerald-500/60 shadow-sm shadow-emerald-950/30',
          editBg: 'bg-emerald-950/60 border border-emerald-500/60 backdrop-blur-md shadow-lg shadow-emerald-950/50',
          textareaBg: 'bg-emerald-950/70 border border-emerald-500/40 text-emerald-100 placeholder-emerald-300/40 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/50',
          badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
          dot: 'bg-emerald-400',
          pinText: 'text-emerald-300',
          pinBg: 'bg-emerald-500/25 border border-emerald-400/40'
        };
      case 'sky':
        return {
          bg: isPinned
            ? 'bg-sky-900/80 border border-sky-400 shadow-lg shadow-sky-950/60'
            : 'bg-sky-950/40 border border-sky-500/30 hover:border-sky-500/60 shadow-sm shadow-sky-950/30',
          editBg: 'bg-sky-950/60 border border-sky-500/60 backdrop-blur-md shadow-lg shadow-sky-950/50',
          textareaBg: 'bg-sky-950/70 border border-sky-500/40 text-sky-100 placeholder-sky-300/40 focus:border-sky-400 focus:ring-1 focus:ring-sky-400/50',
          badge: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
          dot: 'bg-sky-400',
          pinText: 'text-sky-300',
          pinBg: 'bg-sky-500/25 border border-sky-400/40'
        };
      case 'rose':
        return {
          bg: isPinned
            ? 'bg-rose-900/80 border border-rose-400 shadow-lg shadow-rose-950/60'
            : 'bg-rose-950/40 border border-rose-500/30 hover:border-rose-500/60 shadow-sm shadow-rose-950/30',
          editBg: 'bg-rose-950/60 border border-rose-500/60 backdrop-blur-md shadow-lg shadow-rose-950/50',
          textareaBg: 'bg-rose-950/70 border border-rose-500/40 text-rose-100 placeholder-rose-300/40 focus:border-rose-400 focus:ring-1 focus:ring-rose-400/50',
          badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
          dot: 'bg-rose-400',
          pinText: 'text-rose-300',
          pinBg: 'bg-rose-500/25 border border-rose-400/40'
        };
      case 'purple':
        return {
          bg: isPinned
            ? 'bg-purple-900/80 border border-purple-400 shadow-lg shadow-purple-950/60'
            : 'bg-purple-950/40 border border-purple-500/30 hover:border-purple-500/60 shadow-sm shadow-purple-950/30',
          editBg: 'bg-purple-950/60 border border-purple-500/60 backdrop-blur-md shadow-lg shadow-purple-950/50',
          textareaBg: 'bg-purple-950/70 border border-purple-500/40 text-purple-100 placeholder-purple-300/40 focus:border-purple-400 focus:ring-1 focus:ring-purple-400/50',
          badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
          dot: 'bg-purple-400',
          pinText: 'text-purple-300',
          pinBg: 'bg-purple-500/25 border border-purple-400/40'
        };
      case 'slate':
        return {
          bg: isPinned
            ? 'bg-slate-800/90 border border-slate-300 shadow-lg shadow-slate-950/60'
            : 'bg-slate-900/60 border border-slate-700/50 hover:border-slate-600 shadow-sm shadow-slate-950/30',
          editBg: 'bg-slate-900/70 border border-slate-600/70 backdrop-blur-md shadow-lg shadow-slate-950/50',
          textareaBg: 'bg-slate-950/70 border border-slate-600/40 text-slate-100 placeholder-slate-400/40 focus:border-slate-300 focus:ring-1 focus:ring-slate-300/50',
          badge: 'bg-slate-800 text-slate-300 border-slate-700',
          dot: 'bg-slate-300',
          pinText: 'text-slate-200',
          pinBg: 'bg-slate-700/50 border border-slate-400/40'
        };
      case 'amber':
      default:
        return {
          bg: isPinned
            ? 'bg-amber-900/80 border border-amber-400 shadow-lg shadow-amber-950/60'
            : 'bg-amber-950/40 border border-amber-500/30 hover:border-amber-500/60 shadow-sm shadow-amber-950/30',
          editBg: 'bg-amber-950/60 border border-amber-500/60 backdrop-blur-md shadow-lg shadow-amber-950/50',
          textareaBg: 'bg-amber-950/70 border border-amber-500/40 text-amber-100 placeholder-amber-300/40 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50',
          badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
          dot: 'bg-amber-400',
          pinText: 'text-amber-300',
          pinBg: 'bg-amber-500/25 border border-amber-400/40'
        };
    }
  };

  return (
    <div className="bg-slate-900/90 backdrop-blur-xl border border-amber-500/30 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden flex flex-col justify-between space-y-4">
      <div className="absolute -right-12 -top-12 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center space-x-2.5">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-inner shrink-0">
            <StickyNote className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm sm:text-base font-bold text-white">Hızlı Notlarım</h3>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                {notesList.length} Not
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowNoteForm(prev => !prev)}
          className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shadow-md shrink-0 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700"
        >
          {showNoteForm ? (
            <>
              <X className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Vazgeç</span>
            </>
          ) : (
            <>
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Not Ekle</span>
            </>
          )}
        </button>
      </div>

      {/* Note Input Box */}
      <div 
        className={`transition-all duration-300 ease-in-out relative z-10 ${
          showNoteForm 
            ? 'max-h-96 opacity-100 mb-2' 
            : 'max-h-0 opacity-0 overflow-hidden pointer-events-none'
        }`}
      >
        <form onSubmit={handleAddNote} className="bg-slate-950/80 p-4 rounded-2xl border border-amber-500/40 space-y-3 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400 flex items-center space-x-1">
              <Plus className="w-3.5 h-3.5" />
              <span>Yeni Hızlı Not Ekleyin</span>
            </span>

            {/* Color Selector Dots */}
            <div className="flex items-center space-x-1.5 bg-slate-900 p-1 rounded-lg border border-slate-800">
              {(['amber', 'emerald', 'sky', 'rose', 'purple', 'slate'] as const).map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setNewNoteColor(color)}
                  className={`w-4 h-4 rounded-full transition-transform cursor-pointer ${
                    color === 'amber' ? 'bg-amber-400' :
                    color === 'emerald' ? 'bg-emerald-400' :
                    color === 'sky' ? 'bg-sky-400' :
                    color === 'rose' ? 'bg-rose-400' :
                    color === 'purple' ? 'bg-purple-400' : 'bg-slate-400'
                  } ${newNoteColor === color ? 'scale-125 ring-2 ring-white shadow-md' : 'opacity-60 hover:opacity-100'}`}
                  title={`${color} rengi seç`}
                />
              ))}
            </div>
          </div>

          <textarea
            rows={3}
            value={newNoteText}
            onChange={(e) => setNewNoteText(e.target.value)}
            placeholder="Hatırlamak istediğiniz bir ders konusu, parola, hedef veya kısa not yazın..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 transition-colors font-sans resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                handleAddNote(e);
              }
            }}
          />

          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] text-slate-400">İpucu: (Ctrl + Enter ile hızlı kaydedin)</span>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setShowNoteForm(false)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={!newNoteText.trim()}
                className="px-4 py-1.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-amber-500/20 cursor-pointer"
              >
                Kaydet
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Notes Cards Container */}
      <div className="relative z-10">
        <AnimatePresence mode="popLayout">
          {notesList.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
              {notesList.map((note) => {
                const styles = getColorStyles(note.color, note.isPinned);
                const isEditing = editingNoteId === note.id;

                return (
                  <motion.div
                    key={note.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ 
                      opacity: draggedNoteId === note.id ? 0.4 : 1, 
                      scale: dragOverNoteId === note.id ? 1.03 : 1 
                    }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                    draggable={!isEditing}
                    onDragStart={(e) => handleDragStart(e as any, note.id)}
                    onDragOver={(e) => handleDragOver(e as any, note.id)}
                    onDrop={(e) => handleDrop(e as any, note.id)}
                    onDragEnd={() => {
                      setDraggedNoteId(null);
                      setDragOverNoteId(null);
                    }}
                    className={`rounded-2xl p-4 transition-all duration-200 relative group flex flex-col justify-between cursor-grab active:cursor-grabbing ${
                      isEditing ? styles.editBg : styles.bg
                    } ${dragOverNoteId === note.id ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-900' : ''}`}
                  >
                    {isEditing ? (
                      /* Edit Mode Form */
                      <form onSubmit={handleSaveEdit} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-white flex items-center space-x-1">
                            <Edit2 className="w-3 h-3 text-amber-400" />
                            <span>Notu Düzenle</span>
                          </span>
                          
                          {/* Color Selector for Edit Mode */}
                          <div className="flex items-center space-x-1.5 bg-slate-900/80 p-1 rounded-lg border border-slate-700/60">
                            {(['amber', 'emerald', 'sky', 'rose', 'purple', 'slate'] as const).map(color => (
                              <button
                                key={color}
                                type="button"
                                onClick={() => setEditNoteColor(color)}
                                className={`w-3.5 h-3.5 rounded-full transition-transform cursor-pointer ${
                                  color === 'amber' ? 'bg-amber-400' :
                                  color === 'emerald' ? 'bg-emerald-400' :
                                  color === 'sky' ? 'bg-sky-400' :
                                  color === 'rose' ? 'bg-rose-400' :
                                  color === 'purple' ? 'bg-purple-400' : 'bg-slate-400'
                                } ${editNoteColor === color ? 'scale-125 ring-2 ring-white shadow-md' : 'opacity-60 hover:opacity-100'}`}
                              />
                            ))}
                          </div>
                        </div>

                        <textarea
                          rows={3}
                          value={editNoteText}
                          onChange={(e) => setEditNoteText(e.target.value)}
                          className={`w-full rounded-xl p-2.5 text-xs focus:outline-none transition-colors font-sans resize-none ${styles.textareaBg}`}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                              handleSaveEdit(e);
                            }
                          }}
                        />

                        <div className="flex items-center justify-end space-x-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setEditingNoteId(null)}
                            className="px-2.5 py-1 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-900/60 hover:bg-slate-800 border border-slate-700 transition-colors cursor-pointer"
                          >
                            İptal
                          </button>
                          <button
                            type="submit"
                            disabled={!editNoteText.trim()}
                            className="px-3 py-1 rounded-lg text-xs font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 disabled:opacity-40 transition-all flex items-center space-x-1 cursor-pointer shadow-md"
                          >
                            <Check className="w-3 h-3 stroke-[3]" />
                            <span>Kaydet</span>
                          </button>
                        </div>
                      </form>
                    ) : (
                      /* Display Mode */
                      <>
                        <div>
                          {/* Card Top Actions */}
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-1.5">
                              <span className={`w-2 h-2 rounded-full ${styles.dot}`} />
                              <span className="text-[10px] text-slate-400 font-mono font-medium">
                                {note.createdAt || 'Bugün'}
                              </span>
                            </div>

                            <div className="flex items-center space-x-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                type="button"
                                onClick={() => handleTogglePin(note.id)}
                                title={note.isPinned ? 'İğneyi Kaldır' : 'Başa İğnele'}
                                className={`p-1 rounded-lg transition-colors cursor-pointer ${
                                  note.isPinned 
                                    ? `${styles.pinBg} ${styles.pinText}` 
                                    : 'hover:bg-slate-800/80 text-slate-400 hover:text-slate-200'
                                }`}
                              >
                                {note.isPinned ? (
                                  <PinOff className="w-3.5 h-3.5" />
                                ) : (
                                  <Pin className="w-3.5 h-3.5" />
                                )}
                              </button>

                              <button
                                type="button"
                                onClick={() => handleEditNote(note)}
                                title="Notu Düzenle"
                                className="p-1 rounded-lg hover:bg-slate-800/80 text-slate-400 hover:text-amber-300 transition-colors cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  if (deletingNoteId === note.id) {
                                    handleDeleteNote(note.id);
                                    setDeletingNoteId(null);
                                  } else {
                                    setDeletingNoteId(note.id);
                                    setTimeout(() => setDeletingNoteId(null), 3000);
                                  }
                                }}
                                title={deletingNoteId === note.id ? 'Emin misiniz? Silmek için tekrar basın.' : 'Notu Sil'}
                                className={`p-1 rounded-lg transition-colors cursor-pointer ${
                                  deletingNoteId === note.id
                                    ? 'bg-rose-500/30 text-rose-300 border border-rose-500/40 animate-pulse'
                                    : 'hover:bg-rose-500/20 text-slate-400 hover:text-rose-400'
                                }`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Note Text */}
                          <p className="text-xs text-slate-200 leading-relaxed font-sans whitespace-pre-wrap break-words">
                            {note.text}
                          </p>
                        </div>

                        {/* Pinned Tag */}
                        {note.isPinned && (
                          <div className="mt-3 pt-2 border-t border-slate-700/40 flex items-center justify-between text-[9.5px]">
                            <span className={`font-semibold flex items-center space-x-1 ${styles.pinText}`}>
                              <Pin className="w-3 h-3 rotate-45 inline" />
                              <span>Sabitlendi</span>
                            </span>
                          </div>
                        )}
                      </>
                    )}
                  </motion.div>
                );
              })}
            </div>
          ) : (
            /* Empty State */
            <div className="text-center py-8 px-4 bg-slate-950/40 rounded-2xl border border-dashed border-slate-800 space-y-2">
              <div className="w-10 h-10 mx-auto rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                <StickyNote className="w-5 h-5" />
              </div>
              <p className="text-xs text-slate-400 font-medium">Henüz hızlı bir not almadın.</p>
              <p className="text-[10px] text-slate-500">
                Akla gelen hedeflerini veya kısa hatırlatmalarını buraya yazarak doğrudan kaydedebilirsin.
              </p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
