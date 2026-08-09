import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Plus,
  Search,
  ChevronDown,
  ChevronRight,
  GripVertical,
  BookOpen,
  Check,
  FileText,
  Video,
  Edit3,
  Trash2,
  Bookmark,
  MousePointer,
  ListPlus,
  Sparkles,
  ArrowLeft,
  Clock,
  School,
  Tag
} from 'lucide-react';
import { DayOfWeek, FieldType, StudyProgramTemplate, StudyProgramTemplateItem } from '../types';
import { YKS_CURRICULUM_TOPICS, DEFAULT_TASK_TYPES } from '../data/initialData';

const ALL_SUBJECT_LIST = Object.keys(YKS_CURRICULUM_TOPICS);

interface TemplateFullBuilderViewProps {
  teacherName: string;
  onSave: (template: Omit<StudyProgramTemplate, 'id' | 'createdAt'>) => void;
  onClose: () => void;
}

const WEEKDAYS: DayOfWeek[] = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma'];
const WEEKENDS: DayOfWeek[] = ['Cumartesi', 'Pazar'];

const TASK_TYPE_CONFIG: Record<string, { icon: React.FC<{ className?: string }>; color: string; bg: string; border: string }> = {
  'Test Çözme': { icon: FileText, color: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-500/30' },
  'Deneme Çözme': { icon: Sparkles, color: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/30' },
  'Video İzleme': { icon: Video, color: 'text-rose-400', bg: 'bg-rose-500/20', border: 'border-rose-500/30' },
  'Konu Çalışma': { icon: BookOpen, color: 'text-amber-400', bg: 'bg-amber-500/20', border: 'border-amber-500/30' },
};

export const TemplateFullBuilderView: React.FC<TemplateFullBuilderViewProps> = ({
  teacherName,
  onSave,
  onClose
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetField, setTargetField] = useState<FieldType | 'TÜMÜ'>('TÜMÜ');
  const [builderMode, setBuilderMode] = useState<'drag' | 'manual'>('drag');

  // Items in template
  const [items, setItems] = useState<Array<StudyProgramTemplateItem & { id: string }>>([]);

  // Search & Accordion state for left sidebar
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSubjects, setExpandedSubjects] = useState<Record<string, boolean>>({}); // All collapsed by default
  const [examCategory, setExamCategory] = useState<'HEPSİ' | 'TYT' | 'AYT'>('HEPSİ');

  // Click-to-add mode state (disabled by default as requested)
  const [isClickToAddActive, setIsClickToAddActive] = useState<boolean>(false);

  // Selected active day for quick click-to-add
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('Pazartesi');

  // Drag state
  const [dragOverDay, setDragOverDay] = useState<DayOfWeek | null>(null);
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);

  // Editing item modal/inline state
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editSubject, setEditSubject] = useState('');
  const [editTopic, setEditTopic] = useState('');
  const [editTaskType, setEditTaskType] = useState('Konu Çalışma');
  const [editMinutes, setEditMinutes] = useState(60);
  const [editDay, setEditDay] = useState<DayOfWeek>('Pazartesi');

  // Manual mode state
  const [manualDay, setManualDay] = useState<DayOfWeek>('Pazartesi');
  const [manualSubject, setManualSubject] = useState<string>(ALL_SUBJECT_LIST[0] || 'TYT Matematik');
  const [manualTopic, setManualTopic] = useState<string>('');
  const [manualTaskType, setManualTaskType] = useState<string>(DEFAULT_TASK_TYPES[0] || 'Test Çözme');
  const [manualMinutes, setManualMinutes] = useState<number>(60);
  const [manualNotes, setManualNotes] = useState<string>('');

  const toggleSubject = (subj: string) => {
    setExpandedSubjects(prev => ({ ...prev, [subj]: !prev[subj] }));
  };

  const handleAddItem = (day: DayOfWeek, subject: string, topic: string, taskType: string = 'Konu Çalışma', plannedMinutes: number = 45) => {
    const newItem = {
      id: `tpl-item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      day,
      subject,
      topic,
      taskType,
      plannedMinutes
    };
    setItems(prev => [...prev, newItem]);
  };

  const handleRemoveItem = (id: string) => {
    setItems(prev => prev.filter(it => it.id !== id));
  };

  const handleStartEditItem = (item: StudyProgramTemplateItem & { id: string }) => {
    setEditingItemId(item.id);
    setEditSubject(item.subject);
    setEditTopic(item.topic);
    setEditTaskType(item.taskType || 'Konu Çalışma');
    setEditMinutes(item.plannedMinutes || 45);
    setEditDay(item.day);
  };

  const handleSaveEditItem = () => {
    if (!editingItemId || !editTopic.trim()) return;
    setItems(prev => prev.map(it => {
      if (it.id === editingItemId) {
        return {
          ...it,
          day: editDay,
          subject: editSubject,
          topic: editTopic.trim(),
          taskType: editTaskType,
          plannedMinutes: Number(editMinutes) || 45
        };
      }
      return it;
    }));
    setEditingItemId(null);
  };

  // Drag & Drop handlers
  const handleDragStartTopic = (e: React.DragEvent, subject: string, topic: string) => {
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'subject_topic',
      subject,
      topic
    }));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDragStartTaskType = (e: React.DragEvent, taskType: string) => {
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'task_type',
      taskType
    }));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDragOverDay = (e: React.DragEvent, day: DayOfWeek) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    if (dragOverDay !== day) setDragOverDay(day);
  };

  const handleDragLeaveDay = () => {
    setDragOverDay(null);
  };

  const handleDropOnDay = (e: React.DragEvent, day: DayOfWeek) => {
    e.preventDefault();
    setDragOverDay(null);
    try {
      const dataRaw = e.dataTransfer.getData('application/json');
      if (!dataRaw) return;
      const data = JSON.parse(dataRaw);

      if (data.type === 'subject_topic') {
        handleAddItem(day, data.subject, data.topic, 'Konu Çalışma', 45);
      } else if (data.type === 'task_type') {
        // If dropped on day, attach taskType to the last added item on that day or create dummy
        const dayItems = items.filter(it => it.day === day);
        if (dayItems.length > 0) {
          const lastItem = dayItems[dayItems.length - 1];
          setItems(prev => prev.map(it => it.id === lastItem.id ? { ...it, taskType: data.taskType } : it));
        } else {
          handleAddItem(day, 'Genel Çalışma', 'Günlük Görev', data.taskType, 45);
        }
      }
    } catch (err) {
      console.error('Drop error:', err);
    }
  };

  const handleDropOnItem = (e: React.DragEvent, itemId: string) => {
    e.stopPropagation();
    e.preventDefault();
    setHoveredItemId(null);
    try {
      const dataRaw = e.dataTransfer.getData('application/json');
      if (!dataRaw) return;
      const data = JSON.parse(dataRaw);

      if (data.type === 'task_type') {
        setItems(prev => prev.map(it => it.id === itemId ? { ...it, taskType: data.taskType } : it));
      } else if (data.type === 'subject_topic') {
        // Find target item's day and insert there
        const targetItem = items.find(it => it.id === itemId);
        if (targetItem) {
          handleAddItem(targetItem.day, data.subject, data.topic, 'Konu Çalışma', 45);
        }
      }
    } catch (err) {
      console.error('Drop item error:', err);
    }
  };

  const handleSaveTemplate = () => {
    if (!title.trim()) {
      alert('Lütfen şablon için bir başlık giriniz.');
      return;
    }
    if (items.length === 0) {
      alert('Lütfen şablona en az bir ders/görev maddesi ekleyiniz.');
      return;
    }

    onSave({
      title: (title || '').trim(),
      description: (description || '').trim() || undefined,
      targetField,
      createdByName: teacherName,
      items: items.map(({ id, ...rest }) => rest)
    });
  };

  // Manual Form Submit
  const handleManualAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTopic.trim()) {
      alert('Lütfen bir konu veya detay yazın.');
      return;
    }
    handleAddItem(manualDay, manualSubject, manualTopic.trim(), manualTaskType, manualMinutes);
    setManualTopic('');
    setManualNotes('');
  };

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  return createPortal(
    <div className="fixed inset-0 z-[99999] bg-slate-950 text-slate-100 flex flex-col overflow-hidden font-sans">
      {/* HEADER BAR */}
      <header className="bg-slate-900/90 border-b border-white/10 px-6 py-3 flex items-center justify-between shrink-0 shadow-xl">
        <div className="flex items-center space-x-4">
          <button
            onClick={onClose}
            className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center space-x-1.5 text-xs font-bold text-slate-300 hover:text-white transition-all"
            title="Geri Dön ve Çık"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Geri Dön</span>
          </button>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-fuchsia-600/20 border border-fuchsia-500/40 text-fuchsia-300 flex items-center justify-center shadow-lg shadow-fuchsia-600/20">
              <Bookmark className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-white tracking-wide flex items-center space-x-2">
                <span>Sürükle & Bırak Program Oluşturucu</span>
              </h1>
              <p className="text-[11px] text-slate-400">
                <span className="text-fuchsia-300 font-semibold">{teacherName}</span> tarafından şablon kütüphanesine kaydedilecek
              </p>
            </div>
          </div>
        </div>

        {/* MODE SWITCHER & SAVE ACTIONS */}
        <div className="flex items-center space-x-3">
          <div className="bg-slate-950 p-1 rounded-2xl border border-white/10 flex items-center space-x-1">
            <button
              onClick={() => setBuilderMode('drag')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                builderMode === 'drag'
                  ? 'bg-fuchsia-600 text-white shadow-md shadow-fuchsia-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <MousePointer className="w-3.5 h-3.5" />
              <span>Sürükle & Bırak</span>
            </button>
            <button
              onClick={() => setBuilderMode('manual')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                builderMode === 'manual'
                  ? 'bg-fuchsia-600 text-white shadow-md shadow-fuchsia-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ListPlus className="w-3.5 h-3.5" />
              <span>Manuel Form</span>
            </button>
          </div>

          <button
            onClick={handleSaveTemplate}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs px-5 py-2.5 rounded-2xl transition-all shadow-lg shadow-emerald-600/30 border border-emerald-400/40 flex items-center space-x-2"
          >
            <Check className="w-4 h-4" />
            <span>Programı Kaydet ({items.length})</span>
          </button>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/5 hover:bg-rose-500/20 hover:text-rose-300 border border-white/10 flex items-center justify-center text-slate-400 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* TOP CONFIGURATION BAR */}
      <div className="bg-slate-900/50 border-b border-white/10 px-6 py-3 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between shrink-0">
        <div className="flex-1 flex flex-col sm:flex-row gap-3">
          <div className="flex-1 min-w-[240px]">
            <input
              type="text"
              required
              placeholder="Şablon İsmi (Ör: 12. Sınıf Sayısal Şampiyon Haftası)..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-950 border border-fuchsia-500/30 rounded-xl px-4 py-2 text-white font-bold text-sm placeholder:text-slate-500 focus:outline-none focus:border-fuchsia-400"
            />
          </div>
          <div className="w-full sm:w-48">
            <select
              value={targetField}
              onChange={(e) => setTargetField(e.target.value as any)}
              className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-fuchsia-300 font-bold text-xs focus:outline-none"
            >
              <option value="TÜMÜ">Tüm Alanlar (TÜMÜ)</option>
              <option value="SAY">SAY (Sayısal)</option>
              <option value="EA">EA (Eşit Ağırlık)</option>
              <option value="SÖZ">SÖZ (Sözel)</option>
              <option value="DİL">DİL (Yabancı Dil)</option>
            </select>
          </div>
        </div>

        <div className="flex-1 max-w-xl">
          <input
            type="text"
            placeholder="Şablon Açıklaması ve rehberlik tavsiyesi (Ör: Her gün 2 saat matematik çözümü)..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-slate-300 text-xs focus:outline-none"
          />
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANEL (DRAG DRIVERS) */}
        {builderMode === 'drag' && (
          <aside className="w-80 border-r border-white/10 bg-slate-900/70 flex flex-col shrink-0 overflow-hidden">
            {/* Search & Category Filter */}
            <div className="p-3 border-b border-white/10 shrink-0 space-y-2.5">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="İçerik ara (ders, konu)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-fuchsia-400"
                />
              </div>

              {/* TYT / AYT Category Tabs */}
              <div className="flex bg-slate-950 p-1 rounded-xl border border-white/10 text-[10px] sm:text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setExamCategory('HEPSİ')}
                  className={`flex-1 py-1.5 px-1 rounded-lg transition-all text-center ${
                    examCategory === 'HEPSİ'
                      ? 'bg-fuchsia-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Tüm Dersler
                </button>
                <button
                  type="button"
                  onClick={() => setExamCategory('TYT')}
                  className={`flex-1 py-1.5 px-1 rounded-lg transition-all text-center ${
                    examCategory === 'TYT'
                      ? 'bg-fuchsia-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Tüm TYT Dersleri
                </button>
                <button
                  type="button"
                  onClick={() => setExamCategory('AYT')}
                  className={`flex-1 py-1.5 px-1 rounded-lg transition-all text-center ${
                    examCategory === 'AYT'
                      ? 'bg-fuchsia-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Tüm AYT Dersleri
                </button>
              </div>

              {/* Click-to-add toggle */}
              <div className="bg-slate-950/80 p-2 rounded-xl border border-white/10 flex flex-col space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <MousePointer className="w-3.5 h-3.5 text-fuchsia-400" />
                    <span className="text-[11px] font-bold text-slate-300">Tıkla & Ekle Modu</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsClickToAddActive(!isClickToAddActive)}
                    className={`px-2.5 py-0.5 rounded-md text-[10px] font-extrabold transition-all border ${
                      isClickToAddActive
                        ? 'bg-fuchsia-600 text-white border-fuchsia-400 shadow-sm shadow-fuchsia-600/30'
                        : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
                    }`}
                  >
                    {isClickToAddActive ? 'AÇIK' : 'KAPALI'}
                  </button>
                </div>

                {isClickToAddActive ? (
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-white/5">
                    <span>Hedef Gün:</span>
                    <select
                      value={selectedDay}
                      onChange={(e) => setSelectedDay(e.target.value as DayOfWeek)}
                      className="bg-slate-900 border border-white/10 rounded px-1.5 py-0.5 text-fuchsia-300 font-bold focus:outline-none"
                    >
                      {WEEKDAYS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                      {WEEKENDS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-500 italic">
                    Varsayılan: Sürükle & bırak aktif. Tıklayarak eklemek için açabilirsiniz.
                  </p>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              {/* SECTION 1: GÖREV TÜRLERİ (TASK TYPES) */}
              <div>
                <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-300 mb-2">
                  <Tag className="w-3.5 h-3.5 text-fuchsia-400" />
                  <span>Görev Türleri</span>
                  <span className="text-[10px] text-slate-500 font-normal ml-auto">(Sürükle & Bırak)</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {DEFAULT_TASK_TYPES.map((type) => {
                    const cfg = TASK_TYPE_CONFIG[type] || { icon: FileText, color: 'text-purple-400', bg: 'bg-purple-500/20', border: 'border-purple-500/30' };
                    const Icon = cfg.icon;
                    return (
                      <div
                        key={type}
                        draggable
                        onDragStart={(e) => handleDragStartTaskType(e, type)}
                        onClick={() => {
                          if (!isClickToAddActive) return;
                          const dayItems = items.filter(it => it.day === selectedDay);
                          if (dayItems.length > 0) {
                            const last = dayItems[dayItems.length - 1];
                            setItems(prev => prev.map(it => it.id === last.id ? { ...it, taskType: type } : it));
                          } else {
                            handleAddItem(selectedDay, 'Genel Çalışma', 'Günlük Görev', type, 45);
                          }
                        }}
                        className={`p-2 rounded-xl border ${cfg.bg} ${cfg.border} hover:border-fuchsia-400 transition-all cursor-grab active:cursor-grabbing flex items-center space-x-2 select-none group shadow-sm`}
                        title={`"${type}" türünü güne sürükleyin${isClickToAddActive ? ` veya tıkla (${selectedDay})` : ''}`}
                      >
                        <Icon className={`w-3.5 h-3.5 ${cfg.color} shrink-0`} />
                        <span className="text-[11px] font-bold text-slate-200 truncate group-hover:text-white">{type}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SECTION 2: DERSLER VE KONULAR */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300 pb-1 border-b border-white/10">
                  <div className="flex items-center space-x-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-fuchsia-400" />
                    <span>Dersler & Konular</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-normal">YKS Müfredatı</span>
                </div>

                <div className="space-y-1.5">
                  {Object.entries(YKS_CURRICULUM_TOPICS).map(([subject, topics]) => {
                    // Category filter
                    if (examCategory === 'TYT' && !subject.startsWith('TYT') && subject.startsWith('AYT')) {
                      return null;
                    }
                    if (examCategory === 'AYT' && !subject.startsWith('AYT') && subject.startsWith('TYT')) {
                      return null;
                    }

                    const filteredTopics = topics.filter(t => !(searchTerm || '').trim() || t.toLowerCase().includes((searchTerm || '').toLowerCase()) || subject.toLowerCase().includes((searchTerm || '').toLowerCase()));
                    if ((searchTerm || '').trim() && filteredTopics.length === 0 && !subject.toLowerCase().includes((searchTerm || '').toLowerCase())) {
                      return null;
                    }

                    // Collapsed by default unless toggled or user actively searching
                    const isExpanded = !!expandedSubjects[subject] || (!!(searchTerm || '').trim() && filteredTopics.length > 0);

                    return (
                      <div key={subject} className="bg-slate-950/80 rounded-2xl border border-white/10 overflow-hidden">
                        {/* Subject Header */}
                        <div
                          onClick={() => toggleSubject(subject)}
                          className="px-3 py-2 flex items-center justify-between hover:bg-white/5 cursor-pointer select-none transition-colors"
                        >
                          <div className="flex items-center space-x-2 min-w-0">
                            <GripVertical className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                            <span className="text-xs font-bold text-fuchsia-300 truncate">{subject}</span>
                          </div>
                          <div className="flex items-center space-x-1 shrink-0">
                            <span className="text-[10px] bg-white/5 text-slate-400 font-mono px-1.5 py-0.5 rounded">
                              {topics.length}
                            </span>
                            {isExpanded ? (
                              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                            )}
                          </div>
                        </div>

                        {/* Topics List */}
                        {isExpanded && (
                          <div className="px-2 pb-2 pt-1 space-y-1 border-t border-white/5 bg-slate-900/40">
                            {filteredTopics.map((topic) => (
                              <div
                                key={topic}
                                draggable
                                onDragStart={(e) => handleDragStartTopic(e, subject, topic)}
                                onClick={() => {
                                  if (isClickToAddActive) {
                                    handleAddItem(selectedDay, subject, topic, 'Konu Çalışma', 45);
                                  }
                                }}
                                className="p-2 rounded-xl bg-white/5 hover:bg-fuchsia-600/20 border border-white/5 hover:border-fuchsia-500/40 transition-all cursor-grab active:cursor-grabbing flex items-center justify-between group select-none text-xs"
                                title={isClickToAddActive ? `Tıklayarak ${selectedDay} gününe ekle` : 'Sürükleyip takvime bırakın'}
                              >
                                <div className="flex items-center space-x-2 min-w-0">
                                  <div className="w-1.5 h-1.5 rounded-full bg-fuchsia-400 group-hover:scale-125 transition-transform shrink-0" />
                                  <span className="text-[11px] font-medium text-slate-200 group-hover:text-white truncate">
                                    {topic}
                                  </span>
                                </div>
                                {isClickToAddActive ? (
                                  <Plus className="w-3.5 h-3.5 text-fuchsia-300 shrink-0" />
                                ) : (
                                  <GripVertical className="w-3 h-3 text-slate-600 group-hover:text-slate-400 shrink-0" />
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Sidebar Footer Hint */}
            <div className="p-3 bg-slate-950 border-t border-white/10 text-[11px] text-slate-400 flex items-center space-x-2 shrink-0">
              <Sparkles className="w-4 h-4 text-fuchsia-400 shrink-0" />
              <span>Ders veya konuyu sağdaki haftalık gün kutularına sürükleyin.</span>
            </div>
          </aside>
        )}

        {/* RIGHT BOARD (WEEKLY GRID) */}
        <main className="flex-1 bg-slate-950/80 p-4 md:p-6 overflow-y-auto space-y-6">
          {/* MANUAL FORM MODE VIEW */}
          {builderMode === 'manual' && (
            <div className="bg-slate-900/90 border border-fuchsia-500/30 p-5 rounded-3xl space-y-4 max-w-4xl mx-auto shadow-2xl">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2 border-b border-white/10 pb-3">
                <ListPlus className="w-4 h-4 text-fuchsia-400" />
                <span>Manuel Görev Ekleme Formu</span>
              </h3>

              <form onSubmit={handleManualAddSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Hedef Gün</label>
                    <select
                      value={manualDay}
                      onChange={(e) => setManualDay(e.target.value as DayOfWeek)}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white font-bold focus:outline-none"
                    >
                      {WEEKDAYS.map(d => <option key={d} value={d}>{d}</option>)}
                      {WEEKENDS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Ders</label>
                    <select
                      value={manualSubject}
                      onChange={(e) => {
                        setManualSubject(e.target.value);
                        setManualTopic('');
                      }}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-fuchsia-300 font-bold focus:outline-none"
                    >
                      <optgroup label="Tüm TYT Dersleri">
                        {ALL_SUBJECT_LIST.filter(s => s.startsWith('TYT')).map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </optgroup>
                      <optgroup label="Tüm AYT Dersleri">
                        {ALL_SUBJECT_LIST.filter(s => s.startsWith('AYT')).map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </optgroup>
                      <optgroup label="Diğer Modüller">
                        {ALL_SUBJECT_LIST.filter(s => !s.startsWith('TYT') && !s.startsWith('AYT')).map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </optgroup>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Görev Türü</label>
                    <select
                      value={manualTaskType}
                      onChange={(e) => setManualTaskType(e.target.value)}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-amber-300 font-bold focus:outline-none"
                    >
                      {DEFAULT_TASK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Planlanan Süre</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        min={15}
                        step={15}
                        value={manualMinutes}
                        onChange={(e) => setManualMinutes(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white font-mono font-bold focus:outline-none"
                      />
                      <span className="text-slate-400 font-bold">dk</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-slate-300 font-semibold">Konu / Detay</label>
                  <select
                    value={(YKS_CURRICULUM_TOPICS[manualSubject] || []).includes(manualTopic) ? manualTopic : ''}
                    onChange={(e) => { if (e.target.value) setManualTopic(e.target.value); }}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-indigo-300 font-medium focus:outline-none"
                  >
                    <option value="">-- Müfredattan Konu Seç --</option>
                    {(YKS_CURRICULUM_TOPICS[manualSubject] || []).map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>

                  <input
                    type="text"
                    required
                    placeholder="Konu başlığı veya özel açıklama..."
                    value={manualTopic}
                    onChange={(e) => setManualTopic(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-fuchsia-400"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold px-6 py-2.5 rounded-xl transition-all shadow-lg shadow-fuchsia-600/30 flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Şablona Ekle</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TWO ROW GRID LAYOUT FOR DAYS */}
          <div className="space-y-6">
            {/* ROW 1: HAFTAİÇİ (5 Columns) */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center space-x-2">
                  <School className="w-4 h-4 text-fuchsia-400" />
                  <span>Haftaiçi Günleri</span>
                </span>
                <span className="text-[11px] text-slate-500">Pazartesi — Cuma</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {WEEKDAYS.map((day) => {
                  const dayItems = items.filter(it => it.day === day);
                  const isDragOver = dragOverDay === day;
                  const totalMins = dayItems.reduce((acc, curr) => acc + (curr.plannedMinutes || 0), 0);

                  return (
                    <div
                      key={day}
                      onDragOver={(e) => handleDragOverDay(e, day)}
                      onDragLeave={handleDragLeaveDay}
                      onDrop={(e) => handleDropOnDay(e, day)}
                      className={`rounded-2xl border transition-all min-h-[220px] flex flex-col p-3 ${
                        isDragOver
                          ? 'bg-fuchsia-950/40 border-fuchsia-400 shadow-xl shadow-fuchsia-600/20 scale-[1.02]'
                          : 'bg-slate-900/80 border-white/10 hover:border-fuchsia-500/30'
                      }`}
                    >
                      {/* Day Header */}
                      <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2.5 shrink-0">
                        <span className="text-xs font-bold text-white flex items-center space-x-1.5">
                          <span>{day}</span>
                        </span>
                        <div className="flex items-center space-x-1 text-[10px]">
                          <span className="bg-fuchsia-500/20 text-fuchsia-300 px-2 py-0.5 rounded-md font-mono font-bold border border-fuchsia-500/30">
                            {totalMins} dk
                          </span>
                        </div>
                      </div>

                      {/* Day Content */}
                      <div className="flex-1 space-y-2 overflow-y-auto max-h-[360px] pr-0.5">
                        {dayItems.length === 0 ? (
                          <div className="h-full min-h-[140px] flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-xl p-3 text-center group cursor-pointer hover:border-fuchsia-500/40 transition-colors">
                            <Plus className="w-5 h-5 text-slate-600 group-hover:text-fuchsia-400 mb-1 transition-colors" />
                            <p className="text-[11px] text-slate-500 group-hover:text-slate-300 font-medium">
                              İçerik sürükle ve buraya bırak
                            </p>
                          </div>
                        ) : (
                          dayItems.map((item) => {
                            const isEditingThis = editingItemId === item.id;
                            const taskCfg = TASK_TYPE_CONFIG[item.taskType || 'Konu Çalışma'] || TASK_TYPE_CONFIG['Konu Çalışma'];

                            if (isEditingThis) {
                              return (
                                <div key={item.id} className="bg-fuchsia-950/60 border border-fuchsia-500/60 rounded-xl p-2.5 space-y-2 text-xs shadow-xl">
                                  <div className="flex items-center justify-between pb-1 border-b border-fuchsia-500/30">
                                    <span className="text-[10px] font-bold text-fuchsia-300">Görevi Düzenle</span>
                                    <button onClick={() => setEditingItemId(null)} className="text-slate-400 hover:text-white">
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>

                                  <input
                                    type="text"
                                    value={editSubject}
                                    onChange={(e) => setEditSubject(e.target.value)}
                                    className="w-full bg-slate-950 border border-white/10 rounded px-2 py-1 text-white text-xs font-bold"
                                  />

                                  <input
                                    type="text"
                                    value={editTopic}
                                    onChange={(e) => setEditTopic(e.target.value)}
                                    className="w-full bg-slate-950 border border-white/10 rounded px-2 py-1 text-white text-xs"
                                  />

                                  <div className="grid grid-cols-2 gap-1.5">
                                    <select
                                      value={editTaskType}
                                      onChange={(e) => setEditTaskType(e.target.value)}
                                      className="bg-slate-950 border border-white/10 rounded px-1.5 py-1 text-amber-300 text-[10px] font-bold"
                                    >
                                      {DEFAULT_TASK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>

                                    <div className="flex items-center space-x-1">
                                      <input
                                        type="number"
                                        min={10}
                                        step={5}
                                        value={editMinutes}
                                        onChange={(e) => setEditMinutes(Number(e.target.value))}
                                        className="w-full bg-slate-950 border border-white/10 rounded px-1.5 py-1 text-white text-[10px] font-mono"
                                      />
                                      <span className="text-[10px] text-slate-400">dk</span>
                                    </div>
                                  </div>

                                  <div className="flex justify-end space-x-1 pt-1">
                                    <button
                                      type="button"
                                      onClick={handleSaveEditItem}
                                      className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold px-2.5 py-1 text-[10px] rounded"
                                    >
                                      Kaydet
                                    </button>
                                  </div>
                                </div>
                              );
                            }

                            return (
                              <div
                                key={item.id}
                                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setHoveredItemId(item.id); }}
                                onDragLeave={() => setHoveredItemId(null)}
                                onDrop={(e) => handleDropOnItem(e, item.id)}
                                className={`bg-slate-950/90 border rounded-xl p-2.5 space-y-1.5 shadow-md relative group transition-all ${
                                  hoveredItemId === item.id
                                    ? 'border-fuchsia-400 ring-2 ring-fuchsia-500/20'
                                    : 'border-white/10 hover:border-fuchsia-500/40'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-1">
                                  <div className="flex items-center space-x-1 min-w-0">
                                    <span className="text-[10px] font-bold text-fuchsia-300 bg-fuchsia-500/20 px-1.5 py-0.5 rounded border border-fuchsia-500/30 truncate">
                                      {item.subject}
                                    </span>
                                  </div>

                                  {/* Action Buttons: 50% opacity, icon-only with hover title */}
                                  <div className="flex items-center space-x-1 shrink-0">
                                    <span className="text-[10px] font-mono text-slate-400 bg-white/5 px-1.5 py-0.5 rounded">
                                      {item.plannedMinutes} dk
                                    </span>
                                    <button
                                      onClick={() => handleStartEditItem(item)}
                                      className="text-slate-400 hover:text-fuchsia-300 p-1 transition-all rounded bg-slate-900 hover:bg-fuchsia-950 border border-white/5 hover:border-fuchsia-500/30 opacity-50 hover:opacity-100"
                                      title="Görevi Düzenle"
                                    >
                                      <Edit3 className="w-3 h-3 text-fuchsia-400" />
                                    </button>
                                    <button
                                      onClick={() => handleRemoveItem(item.id)}
                                      className="text-slate-400 hover:text-rose-400 p-1 transition-all rounded bg-slate-900 hover:bg-rose-950 border border-white/5 hover:border-rose-500/30 opacity-50 hover:opacity-100"
                                      title="Görevi Sil"
                                    >
                                      <Trash2 className="w-3 h-3 text-rose-400" />
                                    </button>
                                  </div>
                                </div>

                                <p className="text-xs font-semibold text-white leading-snug">
                                  {item.topic}
                                </p>

                                {item.taskType && (
                                  <div className="flex items-center space-x-1 pt-0.5">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${taskCfg.bg} ${taskCfg.color} ${taskCfg.border}`}>
                                      {item.taskType}
                                    </span>
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

            {/* ROW 2: HAFTASONU (2 Columns Across) */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  <span>Haftasonu Günleri</span>
                </span>
                <span className="text-[11px] text-slate-500">Cumartesi — Pazar</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {WEEKENDS.map((day) => {
                  const dayItems = items.filter(it => it.day === day);
                  const isDragOver = dragOverDay === day;
                  const totalMins = dayItems.reduce((acc, curr) => acc + (curr.plannedMinutes || 0), 0);

                  return (
                    <div
                      key={day}
                      onDragOver={(e) => handleDragOverDay(e, day)}
                      onDragLeave={handleDragLeaveDay}
                      onDrop={(e) => handleDropOnDay(e, day)}
                      className={`rounded-2xl border transition-all min-h-[200px] flex flex-col p-4 ${
                        isDragOver
                          ? 'bg-fuchsia-950/40 border-fuchsia-400 shadow-xl shadow-fuchsia-600/20 scale-[1.01]'
                          : 'bg-slate-900/80 border-white/10 hover:border-fuchsia-500/30'
                      }`}
                    >
                      {/* Day Header */}
                      <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3 shrink-0">
                        <span className="text-xs font-bold text-white flex items-center space-x-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-400" />
                          <span>{day}</span>
                        </span>
                        <div className="flex items-center space-x-2 text-[11px]">
                          <span className="text-slate-400">{dayItems.length} Görev</span>
                          <span className="bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-md font-mono font-bold border border-emerald-500/30">
                            {totalMins} dk
                          </span>
                        </div>
                      </div>

                      {/* Day Content */}
                      <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[360px]">
                        {dayItems.length === 0 ? (
                          <div className="h-full min-h-[120px] flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-xl p-4 text-center group cursor-pointer hover:border-fuchsia-500/40 transition-colors">
                            <Plus className="w-6 h-6 text-slate-600 group-hover:text-fuchsia-400 mb-1 transition-colors" />
                            <p className="text-xs text-slate-500 group-hover:text-slate-300 font-medium">
                              İçerik sürükle ve buraya bırak
                            </p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {dayItems.map((item) => {
                              const isEditingThis = editingItemId === item.id;
                              const taskCfg = TASK_TYPE_CONFIG[item.taskType || 'Konu Çalışma'] || TASK_TYPE_CONFIG['Konu Çalışma'];

                              if (isEditingThis) {
                                return (
                                  <div key={item.id} className="col-span-full bg-fuchsia-950/60 border border-fuchsia-500/60 rounded-xl p-3 space-y-2 text-xs">
                                    <div className="flex items-center justify-between pb-1 border-b border-fuchsia-500/30">
                                      <span className="text-[10px] font-bold text-fuchsia-300">Görevi Düzenle</span>
                                      <button onClick={() => setEditingItemId(null)} className="text-slate-400 hover:text-white">
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                      <input
                                        type="text"
                                        value={editSubject}
                                        onChange={(e) => setEditSubject(e.target.value)}
                                        className="bg-slate-950 border border-white/10 rounded px-2 py-1 text-white text-xs font-bold"
                                      />
                                      <input
                                        type="text"
                                        value={editTopic}
                                        onChange={(e) => setEditTopic(e.target.value)}
                                        className="bg-slate-950 border border-white/10 rounded px-2 py-1 text-white text-xs"
                                      />
                                    </div>

                                    <div className="flex justify-end pt-1">
                                      <button
                                        type="button"
                                        onClick={handleSaveEditItem}
                                        className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold px-3 py-1 text-[10px] rounded"
                                      >
                                        Kaydet
                                      </button>
                                    </div>
                                  </div>
                                );
                              }

                              return (
                                <div
                                  key={item.id}
                                  onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setHoveredItemId(item.id); }}
                                  onDragLeave={() => setHoveredItemId(null)}
                                  onDrop={(e) => handleDropOnItem(e, item.id)}
                                  className={`bg-slate-950/90 border rounded-xl p-3 space-y-1.5 shadow-md relative group transition-all ${
                                    hoveredItemId === item.id
                                      ? 'border-fuchsia-400 ring-2 ring-fuchsia-500/20'
                                      : 'border-white/10 hover:border-fuchsia-500/40'
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-1">
                                    <span className="text-[10px] font-bold text-fuchsia-300 bg-fuchsia-500/20 px-1.5 py-0.5 rounded border border-fuchsia-500/30 truncate">
                                      {item.subject}
                                    </span>

                                    <div className="flex items-center space-x-1 shrink-0">
                                      <span className="text-[10px] font-mono text-slate-400 bg-white/5 px-1.5 py-0.5 rounded">
                                        {item.plannedMinutes} dk
                                      </span>
                                      <button
                                        onClick={() => handleStartEditItem(item)}
                                        className="text-slate-400 hover:text-fuchsia-300 p-1 transition-all rounded bg-slate-900 hover:bg-fuchsia-950 border border-white/5 hover:border-fuchsia-500/30 opacity-50 hover:opacity-100"
                                        title="Görevi Düzenle"
                                      >
                                        <Edit3 className="w-3 h-3 text-fuchsia-400" />
                                      </button>
                                      <button
                                        onClick={() => handleRemoveItem(item.id)}
                                        className="text-slate-400 hover:text-rose-400 p-1 transition-all rounded bg-slate-900 hover:bg-rose-950 border border-white/5 hover:border-rose-500/30 opacity-50 hover:opacity-100"
                                        title="Görevi Sil"
                                      >
                                        <Trash2 className="w-3 h-3 text-rose-400" />
                                      </button>
                                    </div>
                                  </div>

                                  <p className="text-xs font-semibold text-white leading-snug">
                                    {item.topic}
                                  </p>

                                  {item.taskType && (
                                    <div className="flex items-center space-x-1 pt-0.5">
                                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${taskCfg.bg} ${taskCfg.color} ${taskCfg.border}`}>
                                        {item.taskType}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>,
    document.body
  );
};
