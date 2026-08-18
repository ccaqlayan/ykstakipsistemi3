import React, { useState, useEffect } from 'react';
import { getWeekLabel, normalizeWeekLabel, parseWeekStartTimestamp } from '../utils/dateUtils';
import { 
  CheckCircle2, 
  Trash2, 
  Plus, 
  Check, 
  Flame, 
  TrendingUp, 
  Clock,
  RotateCcw,
  Target,
  Sparkles,
  Award,
  Edit2,
  X,
  Save,
  Calendar,
  BarChart3,
  History,
  ChevronRight,
  Info,
  CalendarDays,
  AlertTriangle,
  ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import { YKSDataState, RoutineItem } from '../types';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

interface RoutinesViewProps {
  state: YKSDataState;
  onUpdateRoutines: (updatedRoutines: RoutineItem[], actionText?: string) => void;
}

export const RoutinesView: React.FC<RoutinesViewProps> = ({
  state,
  onUpdateRoutines
}) => {
  const DEFAULT_ROUTINES: RoutineItem[] = [
    { id: 'rot-1', title: 'Paragraf Çözümü', target: '20 Soru', completedDays: [] },
    { id: 'rot-2', title: 'Problem Çözümü', target: '15 Soru', completedDays: [] },
    { id: 'rot-3', title: 'Geometri Rutini', target: '10 Soru', completedDays: [] }
  ];

  const routines = state.routines && state.routines.length > 0 ? state.routines : DEFAULT_ROUTINES;
  const activeRoutines = routines.filter(r => !r.isDeleted);

  const [activeSubTab, setActiveSubTab] = useState<'tracker' | 'history'>('tracker');
  const [newRoutineTitle, setNewRoutineTitle] = useState('');
  const [newRoutineTarget, setNewRoutineTarget] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [archiveWeekOffset, setArchiveWeekOffset] = useState<number>(-1);
  const [archiveChoice, setArchiveChoice] = useState<'keep_template' | 'fresh_start' | null>(null);
  const [overwriteStep, setOverwriteStep] = useState<0 | 1 | 2>(0);

  // Smooth scroll to top whenever routine sub-tab changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.documentElement.scrollTo({ top: 0, behavior: 'smooth' });
    document.body.scrollTo({ top: 0, behavior: 'smooth' });
    const mainElem = document.querySelector('main');
    if (mainElem) {
      mainElem.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activeSubTab]);

  const getOffsetDate = (offsetInWeeks: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetInWeeks * 7);
    return d;
  };

  const getOffsetBadgeText = (offset: number) => {
    if (offset === 0) return 'Bu Hafta (Mevcut Hafta)';
    if (offset === -1) return 'Geçen Hafta (1 Hafta Önce)';
    if (offset === -2) return '2 Hafta Önce';
    if (offset < -2) return `${Math.abs(offset)} Hafta Önce`;
    if (offset === 1) return 'Gelecek Hafta (1 Hafta Sonra)';
    return `${offset} Hafta Sonra`;
  };

  const [editingRoutineId, setEditingRoutineId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editTarget, setEditTarget] = useState('');
  const [deletingRoutine, setDeletingRoutine] = useState<{ id: string; title: string } | null>(null);

  const DAYS_OF_WEEK = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];

  const CHRONOLOGICAL_SEEDS = ['6 - 12 Temmuz', '13 - 19 Temmuz', '20 - 26 Temmuz'];

  const getRoutineHistory = (routine: RoutineItem): { weekLabel: string; completedDays: string[] }[] => {
    const defaultHistory: { weekLabel: string; completedDays: string[] }[] = [];
    
    const titleLower = routine.title.toLowerCase();
    const isParagraf = titleLower.includes('paragraf') || routine.id === 'rot-1';
    const isProblem = titleLower.includes('problem') || routine.id === 'rot-2';
    const isGeometri = titleLower.includes('geometri') || routine.id === 'rot-3';
    
    if (isParagraf) {
      defaultHistory.push(
        { weekLabel: '6 - 12 Temmuz', completedDays: ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma'] },
        { weekLabel: '13 - 19 Temmuz', completedDays: ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'] },
        { weekLabel: '20 - 26 Temmuz', completedDays: ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'] }
      );
    } else if (isProblem) {
      defaultHistory.push(
        { weekLabel: '6 - 12 Temmuz', completedDays: ['Pazartesi', 'Salı', 'Perşembe', 'Cuma'] },
        { weekLabel: '13 - 19 Temmuz', completedDays: ['Pazartesi', 'Çarşamba', 'Cuma', 'Pazar'] },
        { weekLabel: '20 - 26 Temmuz', completedDays: ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma'] }
      );
    } else if (isGeometri) {
      defaultHistory.push(
        { weekLabel: '6 - 12 Temmuz', completedDays: ['Salı', 'Perşembe', 'Cumartesi'] },
        { weekLabel: '13 - 19 Temmuz', completedDays: ['Salı', 'Perşembe', 'Cumartesi', 'Pazar'] },
        { weekLabel: '20 - 26 Temmuz', completedDays: ['Pazartesi', 'Çarşamba', 'Cuma'] }
      );
    } else {
      defaultHistory.push(
        { weekLabel: '6 - 12 Temmuz', completedDays: ['Pazartesi', 'Çarşamba', 'Cuma'] },
        { weekLabel: '13 - 19 Temmuz', completedDays: ['Salı', 'Perşembe', 'Cumartesi'] },
        { weekLabel: '20 - 26 Temmuz', completedDays: ['Pazartesi', 'Çarşamba', 'Cuma', 'Pazar'] }
      );
    }
    
    const realHistory = (routine.history || []).map(h => ({ ...h, weekLabel: normalizeWeekLabel(h.weekLabel) }));
    const realLabels = new Set(realHistory.map(h => h.weekLabel));
    const filteredDefault = defaultHistory.filter(d => !realLabels.has(d.weekLabel));
    
    return [...filteredDefault, ...realHistory];
  };

  const getOrderedWeeks = () => {
    const rawLabels = [
      ...routines.flatMap(r => (r.history || []).map(h => h.weekLabel)),
      ...CHRONOLOGICAL_SEEDS
    ];
    const normalized = rawLabels.filter(Boolean).map(l => normalizeWeekLabel(l));
    const unique = Array.from(new Set(normalized));
    unique.sort((a, b) => parseWeekStartTimestamp(a) - parseWeekStartTimestamp(b));
    return unique;
  };

  const orderedWeeks = getOrderedWeeks();

  const getWeeklyStats = () => {
    return orderedWeeks.map(weekLabel => {
      let completed = 0;
      let total = 0;
      
      routines.forEach(r => {
        const historyForRoutine = getRoutineHistory(r);
        const entry = historyForRoutine.find(h => h.weekLabel === weekLabel);
        if (entry) {
          completed += entry.completedDays.length;
        }
        total += 7;
      });
      
      const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
      
      return {
        name: weekLabel,
        'Uyum Oranı (%)': rate,
        'Tamamlanan': completed,
        'Toplam': total
      };
    });
  };

  const getRoutineComplianceStats = () => {
    return activeRoutines.map(r => {
      const historyForRoutine = getRoutineHistory(r);
      let completed = 0;
      let total = 0;
      
      historyForRoutine.forEach(h => {
        completed += h.completedDays.length;
        total += 7;
      });
      
      const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
      
      return {
        name: r.title,
        'Uyum (%)': rate,
        completed,
        total
      };
    });
  };

  const [selectedHistoryWeek, setSelectedHistoryWeek] = useState<string>('');

  // Fallback to latest week if selected is invalid
  const activeHistoryWeek = selectedHistoryWeek || orderedWeeks[orderedWeeks.length - 1] || '20 - 26 Temmuz';

  const getTurkishDayName = (): string => {
    const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
    const todayIndex = new Date().getDay();
    return days[todayIndex];
  };

  const todayDayName = getTurkishDayName();

  // Statistics
  const overallTotalCheckboxes = activeRoutines.length * 7;
  const overallCompletedCheckboxes = activeRoutines.reduce((acc, r) => acc + (r.completedDays?.length || 0), 0);
  const overallPercent = overallTotalCheckboxes > 0 ? Math.round((overallCompletedCheckboxes / overallTotalCheckboxes) * 100) : 0;

  // Day based completions
  const dayCompletions = DAYS_OF_WEEK.map(day => {
    const count = activeRoutines.filter(r => r.completedDays?.includes(day)).length;
    return { day, count };
  });

  const handleToggleRoutineDay = (routineId: string, dayName: string) => {
    let targetRoutine = routines.find(r => r.id === routineId);
    let actionText = '';

    const updated = routines.map(r => {
      if (r.id === routineId) {
        const completed = r.completedDays || [];
        const isCompleted = completed.includes(dayName);

        if (isCompleted) {
          actionText = `"${r.title}" rutini (${dayName}) için tamamlanmadı olarak işaretlendi.`;
        } else {
          actionText = `"${r.title}" rutini (${dayName}) için tamamlandı olarak işaretlendi.`;
        }

        return {
          ...r,
          completedDays: isCompleted 
            ? completed.filter(d => d !== dayName)
            : [...completed, dayName]
        };
      }
      return r;
    });
    onUpdateRoutines(updated, actionText);
  };

  const handleAddRoutine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoutineTitle.trim()) return;

    const newRoutine: RoutineItem = {
      id: 'routine-' + Date.now(),
      title: newRoutineTitle.trim(),
      target: newRoutineTarget.trim() || undefined,
      completedDays: []
    };

    onUpdateRoutines([...routines, newRoutine], `"${newRoutine.title}" adında yeni bir rutin eklendi.`);
    setNewRoutineTitle('');
    setNewRoutineTarget('');
  };

  const handleDeleteRoutine = (id: string) => {
    const targetRoutine = routines.find(r => r.id === id);
    if (targetRoutine) {
      setDeletingRoutine({ id: targetRoutine.id, title: targetRoutine.title });
    }
  };

  const handleStartEdit = (routine: RoutineItem) => {
    setEditingRoutineId(routine.id);
    setEditTitle(routine.title);
    setEditTarget(routine.target || '');
  };

  const handleSaveEdit = () => {
    if (!editTitle.trim()) return;
    const updated = routines.map(r => {
      if (r.id === editingRoutineId) {
        return {
          ...r,
          title: editTitle.trim(),
          target: editTarget.trim() || undefined
        };
      }
      return r;
    });
    onUpdateRoutines(updated, `"${editTitle.trim()}" rutini güncellendi.`);
    setEditingRoutineId(null);
  };

  const handleCancelEdit = () => {
    setEditingRoutineId(null);
  };

  const handleResetAllRoutines = () => {
    setArchiveWeekOffset(-1);
    setOverwriteStep(0);
    setArchiveChoice(null);
    setShowArchiveConfirm(true);
  };

  const executeArchiveAndReset = (choice: 'keep_template' | 'fresh_start', targetWeek: string) => {
    const updated = routines.map(r => {
      const currentHistory = r.history || [];
      // Remove any existing entry for the same week label to avoid duplicates
      const filteredHistory = currentHistory.filter(h => normalizeWeekLabel(h.weekLabel) !== normalizeWeekLabel(targetWeek));
      
      const newHistoryEntry = {
        weekLabel: targetWeek,
        completedDays: r.completedDays || []
      };
      
      return {
        ...r,
        completedDays: [], // Clear active days
        history: [...filteredHistory, newHistoryEntry] // Append new archive
      };
    });
    
    let finalRoutines = updated;
    if (choice === 'fresh_start') {
      finalRoutines = DEFAULT_ROUTINES.map(defR => {
        const match = updated.find(u => u.title === defR.title || u.id === defR.id);
        return {
          ...defR,
          history: match ? match.history : []
        };
      });
    }

    onUpdateRoutines(finalRoutines, `Bu haftaki rutin ilerlemesi ("${targetWeek}") geçmişe arşivlendi ve yeni hafta başlatıldı.`);
    setShowArchiveConfirm(false);
    setOverwriteStep(0);
    setArchiveChoice(null);
    
    // Automatically switch to history subtab so they can see their archived week immediately!
    setActiveSubTab('history');
    setSelectedHistoryWeek(targetWeek);
  };

  const handleOnlyReset = () => {
    const reset = routines.map(r => ({ ...r, completedDays: [] }));
    onUpdateRoutines(reset, 'Haftalık rutin işaretlemeleri arşivlenmeden sıfırlandı.');
    setShowArchiveConfirm(false);
    setOverwriteStep(0);
    setArchiveChoice(null);
  };

  const handleCancelReset = () => {
    setShowArchiveConfirm(false);
    setOverwriteStep(0);
    setArchiveChoice(null);
  };

  return (
    <>
      <div className="space-y-8 pb-10" id="routines-view-root">
      
      {/* Top Level Sub-Tabs & Actions Wrapper */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800/80 gap-4 pb-0.5 px-2">
        {/* Left Side: Tab triggers */}
        <div className="flex gap-6">
          <button
            onClick={() => setActiveSubTab('tracker')}
            className={`pb-3.5 text-xs md:text-sm font-black tracking-tight relative transition-all cursor-pointer ${
              activeSubTab === 'tracker'
                ? 'text-white font-black'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center space-x-2">
              <CalendarDays className="w-4 h-4 text-emerald-400" />
              <span>Aktif Takip Panosu</span>
            </div>
            {activeSubTab === 'tracker' && (
              <motion.div
                layoutId="activeSubTabUnderline"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500"
              />
            )}
          </button>
          <button
            onClick={() => setActiveSubTab('history')}
            className={`pb-3.5 text-xs md:text-sm font-black tracking-tight relative transition-all cursor-pointer ${
              activeSubTab === 'history'
                ? 'text-white font-black'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center space-x-2">
              <History className="w-4 h-4 text-indigo-400" />
              <span>Rutin Geçmişim & Analiz</span>
            </div>
            {activeSubTab === 'history' && (
              <motion.div
                layoutId="activeSubTabUnderline"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500"
              />
            )}
          </button>
        </div>

        {/* Right Side: Archive Week Button */}
        <div className="flex items-center shrink-0 pb-1.5 sm:pb-0">
          <button
            onClick={handleResetAllRoutines}
            className="inline-flex items-center space-x-1.5 px-4 py-3 bg-slate-900/60 hover:bg-purple-500/10 text-slate-300 hover:text-purple-400 border border-slate-800 hover:border-purple-500/30 rounded-2xl text-xs font-bold transition-all shadow-lg active:scale-95 shrink-0 cursor-pointer"
            title="Mevcut rutin haftasını arşive kaldırıp yeni hafta başlatır"
          >
            <History className="w-4 h-4 text-purple-400" />
            <span>Haftayı Arşive Kaldır</span>
          </button>
        </div>
      </div>
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-2">
        <div>
          <div className="inline-flex items-center space-x-1.5 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full text-xs font-semibold text-emerald-400 mb-3 animate-pulse">
            <Flame className="w-3.5 h-3.5" />
            <span>Süreklilik Başarı Getirir</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Rutinlerim ve Alışkanlık Takibi</h1>
          <p className="text-xs md:text-sm text-slate-400 mt-2 max-w-2xl">
            YKS sürecinde her gün çözülmesi gereken paragraf, problem ve geometri gibi rutinlerinizi gün gün işaretleyin. Haftalık ilerlemenizi takip ederek çalışma alışkanlığı kazanın.
          </p>
        </div>
      </div>

      {activeSubTab === 'tracker' ? (
        <>
          {/* Main Content Area - Tracker Table */}
      <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <Award className="w-5.5 h-5.5 text-indigo-400" />
              <span>Rutin Çalışma Takip Panosu</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Bu haftaki rutin çalışma hedeflerinizi ekleyin, düzenleyin ve her gün tamamladıkça tikleyin.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className={`inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-lg active:scale-95 shrink-0 cursor-pointer border ${
              showAddForm 
                ? 'bg-slate-850 hover:bg-slate-800 text-slate-200 border-slate-700' 
                : 'bg-indigo-600 hover:bg-indigo-500 text-white border-transparent'
            }`}
          >
            {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            <span>{showAddForm ? 'Ekleme Bölümünü Gizle' : 'Yeni Rutin Tanımla'}</span>
          </button>
        </div>

        {/* Add Routine Section with Slide Down Animation */}
        <AnimatePresence initial={false}>
          {showAddForm && (
            <motion.div
              initial={{ height: 0, opacity: 0, marginBottom: 0 }}
              animate={{ height: 'auto', opacity: 1, marginBottom: 28 }}
              exit={{ height: 0, opacity: 0, marginBottom: 0 }}
              transition={{ duration: 0.35, ease: 'easeInOut' }}
              className="overflow-hidden border-b border-slate-800/50 pb-6"
            >
              {/* Add Routine Form */}
              <form onSubmit={handleAddRoutine} className="p-5 rounded-2xl border border-slate-800 bg-slate-950/30 flex flex-col lg:flex-row items-center gap-4 relative z-10">
                <div className="text-xs font-bold text-indigo-300 shrink-0 uppercase tracking-wider font-mono flex items-center space-x-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span>Yeni Rutin Tanımla:</span>
                </div>
                
                <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3.5 flex-1">
                  <input
                    type="text"
                    placeholder="Rutin Adı (Örn: Paragraf Çözümü)"
                    value={newRoutineTitle}
                    onChange={(e) => setNewRoutineTitle(e.target.value)}
                    className="bg-slate-950 border border-slate-800 text-slate-200 rounded-2xl px-4 py-3.5 sm:py-2.5 text-sm sm:text-xs focus:outline-none focus:border-indigo-500 placeholder:text-slate-600 transition-all min-h-[48px] sm:min-h-0"
                    required
                  />
                  
                  <input
                    type="text"
                    placeholder="Günlük Hedef (Örn: 20 Soru, 15dk)"
                    value={newRoutineTarget}
                    onChange={(e) => setNewRoutineTarget(e.target.value)}
                    className="bg-slate-950 border border-slate-800 text-slate-200 rounded-2xl px-4 py-3.5 sm:py-2.5 text-sm sm:text-xs focus:outline-none focus:border-indigo-500 placeholder:text-slate-600 transition-all min-h-[48px] sm:min-h-0"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full lg:w-auto bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm sm:text-xs px-6 py-3.5 sm:py-3 rounded-2xl transition-all shadow-lg hover:shadow-indigo-600/10 active:scale-95 shrink-0 flex items-center justify-center space-x-1.5 cursor-pointer min-h-[48px] sm:min-h-0"
                >
                  <Plus className="w-4.5 h-4.5" />
                  <span>Rutini Kaydet</span>
                </button>
              </form>

              {/* Quick Suggestion Chips */}
              <div className="mt-5 flex flex-wrap items-center gap-2 text-xs">
                <span className="text-slate-500 font-medium">💡 Hazır Rutin Şablonları:</span>
                {[
                  { title: 'Paragraf Çözümü', target: '20 Soru' },
                  { title: 'Problem Çözümü', target: '15 Soru' },
                  { title: 'Geometri Rutini', target: '10 Soru' },
                  { title: 'Türkçe Branş Denemesi', target: '1 Adet' },
                  { title: 'Tarih Soru Pratiği', target: '15 Soru' },
                  { title: 'İngilizce Kelime Ezberi', target: '10 Kelime' },
                  { title: 'Edebiyat Yazar-Eser Kartları', target: '15 Kart' },
                  { title: 'Fizik Formül Tekrarı', target: '10dk' }
                ].map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setNewRoutineTitle(preset.title);
                      setNewRoutineTarget(preset.target);
                    }}
                    className="bg-slate-950 hover:bg-indigo-600/10 hover:text-indigo-300 border border-slate-800/80 hover:border-indigo-500/30 text-slate-400 px-3 py-1.5 rounded-xl transition-all font-medium cursor-pointer"
                  >
                    + {preset.title} ({preset.target})
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Desktop View Table */}
        <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-800/60 bg-slate-950/40">
          <table className="w-full border-collapse text-left text-xs text-slate-300">
            <thead>
              <tr className="bg-slate-900/60 border-b border-slate-800/80 text-slate-400 font-semibold text-[11px] tracking-wider uppercase font-mono">
                <th className="px-4 py-3.5 min-w-[180px]">Rutin</th>
                {DAYS_OF_WEEK.map(day => (
                  <th key={day} className="px-2 py-3.5 text-center min-w-[55px]">
                    <span className={day === todayDayName ? 'text-indigo-400 font-bold underline decoration-indigo-500/50 underline-offset-4' : ''}>
                      {day}
                    </span>
                  </th>
                ))}
                <th className="px-3 py-3.5 text-center min-w-[100px]">Tamamlama Oranı</th>
                <th className="px-3 py-3.5 text-center min-w-[70px]">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {activeRoutines.map((r) => {
                const completedCount = r.completedDays?.length || 0;
                const percent = Math.round((completedCount / 7) * 100);
                const isEditing = editingRoutineId === r.id;

                return (
                  <tr key={r.id} className="hover:bg-white/[0.01] transition-colors group">
                    <td className="px-4 py-3.5">
                      {isEditing ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            placeholder="Rutin Adı"
                            className="w-full bg-slate-900 border border-indigo-500/50 text-white text-sm font-bold rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-400"
                          />
                          <input
                            type="text"
                            value={editTarget}
                            onChange={(e) => setEditTarget(e.target.value)}
                            placeholder="Hedef (Örn: 20 Soru)"
                            className="w-full bg-slate-900 border border-slate-700 text-slate-300 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-400"
                          />
                        </div>
                      ) : (
                        <>
                          <div className="font-bold text-white text-sm">{r.title}</div>
                          {r.target && (
                            <div className="text-[11px] text-slate-400 mt-1 flex items-center space-x-1">
                              <span className="bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 text-indigo-300 font-mono font-medium">
                                Hedef: {r.target}
                              </span>
                            </div>
                          )}
                        </>
                      )}
                    </td>
                    
                    {DAYS_OF_WEEK.map(day => {
                      const isCompleted = r.completedDays?.includes(day);
                      return (
                        <td key={day} className="px-2 py-3.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleRoutineDay(r.id, day)}
                            disabled={isEditing}
                            className={`w-7 h-7 rounded-full inline-flex items-center justify-center border transition-all hover:scale-110 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 disabled:active:scale-100 ${
                              isCompleted 
                                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' 
                                : day === todayDayName
                                ? 'bg-indigo-500/5 border-indigo-500/30 text-slate-500 hover:border-indigo-400/50 hover:text-indigo-300'
                                : 'bg-slate-900/50 border-slate-800 text-slate-600 hover:border-slate-700 hover:text-slate-400'
                            }`}
                          >
                            <Check className={`w-3.5 h-3.5 ${isCompleted ? 'opacity-100 scale-100' : 'opacity-10 scale-75 group-hover:opacity-30'} transition-all`} />
                          </button>
                        </td>
                      );
                    })}

                    <td className="px-3 py-3.5">
                      <div className="flex flex-col items-center justify-center space-y-1.5">
                        <span className="font-bold text-slate-200 font-mono text-[11px]">{completedCount}/7 Gün (%{percent})</span>
                        <div className="w-16 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-300 ${
                              percent === 100 ? 'bg-emerald-500' : percent >= 50 ? 'bg-indigo-500' : percent > 0 ? 'bg-amber-500' : 'bg-slate-700'
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="px-3 py-3.5 text-center">
                      {isEditing ? (
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            type="button"
                            onClick={handleSaveEdit}
                            className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-500/20 transition-all"
                            title="Kaydet"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-300 hover:bg-slate-800 transition-all"
                            title="İptal"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(r)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all"
                            title="Rutini Düzenle"
                          >
                            <Edit2 className="w-4.5 h-4.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteRoutine(r.id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                            title="Rutini Sil"
                          >
                            <Trash2 className="w-4.5 h-4.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}

              {activeRoutines.length === 0 && (
                <tr>
                  <td colSpan={10} className="text-center py-8 text-slate-500 italic">
                    Henüz hiçbir rutin eklemediniz. Aşağıdaki formdan yeni bir tane ekleyebilirsiniz!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View Card List */}
        <div className="block md:hidden space-y-4">
          {activeRoutines.map((r) => {
            const completedCount = r.completedDays?.length || 0;
            const percent = Math.round((completedCount / 7) * 100);
            const isEditing = editingRoutineId === r.id;

            return (
              <div key={r.id} className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-4 space-y-4">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1">
                    {isEditing ? (
                      <div className="space-y-2 w-full">
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          placeholder="Rutin Adı"
                          className="w-full bg-slate-900 border border-indigo-500/50 text-white text-sm font-bold rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-400"
                        />
                        <input
                          type="text"
                          value={editTarget}
                          onChange={(e) => setEditTarget(e.target.value)}
                          placeholder="Hedef (Örn: 20 Soru)"
                          className="w-full bg-slate-900 border border-slate-700 text-slate-300 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-400"
                        />
                      </div>
                    ) : (
                      <>
                        <h3 className="text-sm font-bold text-white">{r.title}</h3>
                        {r.target && (
                          <span className="inline-block bg-indigo-500/10 text-indigo-300 text-[10px] font-bold px-2 py-0.5 rounded border border-indigo-500/20 mt-1">
                            Hedef: {r.target}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                  
                  {isEditing ? (
                    <div className="flex items-center space-x-1 shrink-0">
                      <button
                        type="button"
                        onClick={handleSaveEdit}
                        className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-500/20 transition-all"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-300 hover:bg-slate-800 transition-all"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(r)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteRoutine(r.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Week Checklist */}
                <div className="grid grid-cols-7 gap-1.5 pt-2 border-t border-slate-900">
                  {DAYS_OF_WEEK.map(day => {
                    const isCompleted = r.completedDays?.includes(day);
                    const isToday = day === todayDayName;
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => handleToggleRoutineDay(r.id, day)}
                        disabled={isEditing}
                        className={`py-2.5 min-h-[50px] rounded-xl border flex flex-col items-center justify-center space-y-1 transition-all active:scale-90 disabled:opacity-50 cursor-pointer ${
                          isCompleted 
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-sm shadow-emerald-500/20' 
                            : isToday
                            ? 'bg-indigo-500/15 border-indigo-500/50 text-indigo-300 ring-1 ring-indigo-400/30'
                            : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        <span className="text-[9px] font-extrabold uppercase tracking-tight">{day.substring(0, 3)}</span>
                        <Check className={`w-3.5 h-3.5 stroke-[2.5] ${isCompleted ? 'opacity-100' : 'opacity-20'}`} />
                      </button>
                    );
                  })}
                </div>

                {/* Progress bar */}
                <div className="flex items-center justify-between text-xs pt-2 font-mono">
                  <span className="text-slate-400">Haftalık Tamamlama:</span>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-white">{completedCount}/7 Gün</span>
                    <span className="text-indigo-400">%{percent}</span>
                  </div>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-300 ${
                      percent === 100 ? 'bg-emerald-500' : percent >= 50 ? 'bg-indigo-500' : percent > 0 ? 'bg-amber-500' : 'bg-slate-700'
                    }`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Statistics Section */}
      <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center space-x-2">
              <TrendingUp className="w-6 h-6 text-emerald-400" />
              <span>Haftalık İstatistikler</span>
            </h2>
            <p className="text-xs md:text-sm text-slate-400 mt-2 max-w-2xl">
              Rutinlerinize ne kadar sadık kaldığınızı gün gün görün. Daha istikrarlı bir çalışma için bu verileri inceleyin.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-2xl flex items-center space-x-4 min-w-[180px]">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Haftalık İlerleme</div>
                <div className="text-xl font-black text-white font-mono mt-0.5">%{overallPercent}</div>
                <div className="text-[10px] text-slate-400 mt-0.5 font-mono">{overallCompletedCheckboxes}/{overallTotalCheckboxes} Tik</div>
              </div>
            </div>
          </div>
        </div>

        {/* Day-by-Day Simple Progress Tracker Map */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mt-8 pt-6 border-t border-slate-800/60 relative z-10">
          {DAYS_OF_WEEK.map(day => {
            const dayStat = dayCompletions.find(d => d.day === day);
            const count = dayStat?.count || 0;
            const total = routines.length;
            const percent = total > 0 ? Math.round((count / total) * 100) : 0;
            const isToday = day === todayDayName;

            return (
              <div 
                key={day} 
                className={`p-3.5 rounded-2xl border transition-all text-center flex flex-col justify-between ${
                  isToday 
                    ? 'bg-indigo-600/15 border-indigo-500/40 shadow-lg shadow-indigo-500/5' 
                    : 'bg-slate-950/30 border-slate-850'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[11px] font-bold ${isToday ? 'text-indigo-400' : 'text-slate-400'}`}>
                    {day}
                  </span>
                  {isToday && (
                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping shrink-0" />
                  )}
                </div>
                
                <div className="my-3">
                  <div className="text-lg font-black text-white font-mono">{count}<span className="text-xs text-slate-500 font-normal">/{total}</span></div>
                  <div className="text-[10px] text-slate-400 font-semibold mt-0.5 font-mono">%{percent} Başarı</div>
                </div>

                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-300 ${
                      percent === 100 ? 'bg-emerald-500' : percent >= 50 ? 'bg-indigo-500' : percent > 0 ? 'bg-amber-500' : 'bg-slate-700'
                    }`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  ) : (
    <div className="space-y-8">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-slate-900/90 border border-slate-800/80 rounded-3xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <TrendingUp className="w-16 h-16 text-emerald-400" />
          </div>
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Genel Uyum Ortalaması</div>
          <div className="text-3xl font-black text-white font-mono mt-1">
            %{Math.round(
              getWeeklyStats().reduce((acc, w) => acc + w['Uyum Oranı (%)'], 0) / (orderedWeeks.length || 1)
            )}
          </div>
          <p className="text-xs text-slate-400 mt-2 flex items-center space-x-1">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>Tüm haftaların genel ortalama başarısı</span>
          </p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800/80 rounded-3xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Award className="w-16 h-16 text-indigo-400" />
          </div>
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">En İstikrarlı Rutin</div>
          <div className="text-sm font-bold text-white mt-2 truncate">
            {
              getRoutineComplianceStats().reduce((prev, current) => 
                (prev['Uyum (%)'] > current['Uyum (%)']) ? prev : current, 
                { name: 'Bulunamadı', 'Uyum (%)': 0 }
              ).name
            }
          </div>
          <p className="text-xs text-indigo-300 font-semibold mt-1 font-mono">
            Uyum Oranı: %{
              getRoutineComplianceStats().reduce((prev, current) => 
                (prev['Uyum (%)'] > current['Uyum (%)']) ? prev : current, 
                { name: '', 'Uyum (%)': 0 }
              )['Uyum (%)']
            }
          </p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800/80 rounded-3xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Calendar className="w-16 h-16 text-amber-400" />
          </div>
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Arşivlenen Hafta Sayısı</div>
          <div className="text-3xl font-black text-white font-mono mt-1">
            {orderedWeeks.length} <span className="text-xs font-normal text-slate-400">Hafta</span>
          </div>
          <p className="text-xs text-slate-400 mt-2 flex items-center space-x-1">
            <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>Düzenli veri biriktirme geçmişi</span>
          </p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Compliance Over Time */}
        <div className="bg-slate-900/90 border border-slate-800/80 rounded-3xl p-5 md:p-6 shadow-xl">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2 mb-4">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span>Haftalık Uyum Eğrisi (%)</span>
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={getWeeklyStats()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorUyum" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.4} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }}
                  labelStyle={{ color: '#94a3b8', fontWeight: 'bold', fontSize: '11px' }}
                  itemStyle={{ color: '#818cf8', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="Uyum Oranı (%)" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorUyum)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Routine-Specific Performance */}
        <div className="bg-slate-900/90 border border-slate-800/80 rounded-3xl p-5 md:p-6 shadow-xl">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2 mb-4">
            <BarChart3 className="w-4 h-4 text-indigo-400" />
            <span>Rutin Bazlı Genel İstikrar Oranı (%)</span>
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={getRoutineComplianceStats()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.4} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }}
                  labelStyle={{ color: '#94a3b8', fontWeight: 'bold', fontSize: '11px' }}
                  itemStyle={{ color: '#34d399', fontSize: '12px' }}
                />
                <Bar dataKey="Uyum (%)" fill="#4f46e5" radius={[8, 8, 0, 0]} maxBarSize={45} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Interactive Past Weeks Breakdown Grid */}
      <div className="bg-slate-900/90 border border-slate-800/80 rounded-3xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-5 mb-6 gap-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-indigo-400" />
              <span>Geçmiş Haftalar Detaylı Kayıt Defteri</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Sol taraftan dilediğiniz haftayı seçerek o haftanın detaylı gün gün tamamlanma tablosunu inceleyin.
            </p>
          </div>
          
          {/* Dropdown for quick week selection on all views */}
          <div className="flex items-center space-x-2 shrink-0">
            <span className="text-xs text-slate-400 font-semibold">İncelenen Hafta:</span>
            <select
              value={activeHistoryWeek}
              onChange={(e) => setSelectedHistoryWeek(e.target.value)}
              className="bg-slate-950 border border-slate-800 hover:border-indigo-500/50 text-slate-200 text-xs font-bold rounded-xl px-3 py-2 focus:outline-none transition-all cursor-pointer"
            >
              {orderedWeeks.slice().reverse().map(week => (
                <option key={week} value={week}>{week}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Side: Week Buttons list (visible on desktop) */}
          <div className="hidden lg:block lg:col-span-4 space-y-2">
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2 px-2">Kayıtlı Tüm Haftalar</div>
            <div className="space-y-1.5 max-h-[360px] overflow-y-auto pr-1">
              {orderedWeeks.slice().reverse().map((week) => {
                const isSelected = activeHistoryWeek === week;
                // Compute compliance rate for badge
                let completed = 0;
                let total = 0;
                routines.forEach(r => {
                  const entry = getRoutineHistory(r).find(h => h.weekLabel === week);
                  if (entry) completed += entry.completedDays.length;
                  total += 7;
                });
                const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

                return (
                  <button
                    key={week}
                    onClick={() => setSelectedHistoryWeek(week)}
                    className={`w-full text-left px-4 py-3.5 rounded-2xl border transition-all flex items-center justify-between group cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600/15 border-indigo-500/50 text-white shadow-lg shadow-indigo-600/5'
                        : 'bg-slate-950/20 border-slate-850 hover:bg-slate-950/40 text-slate-400 hover:text-slate-200 hover:border-slate-800'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <div className={`w-2 h-2 rounded-full transition-all ${isSelected ? 'bg-indigo-400 scale-125' : 'bg-slate-600 group-hover:bg-slate-500'}`} />
                      <span className="text-xs font-bold">{week}</span>
                    </div>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                      rate >= 80 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      rate >= 50 ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                      'bg-slate-800 text-slate-400'
                    }`}>
                      %{rate} Başarı
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Side: Read-Only Grid of selected week */}
          <div className="lg:col-span-8 bg-slate-950/40 border border-slate-850 rounded-2xl p-5 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-900 pb-4">
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Detaylı İnceleme</span>
                <h4 className="text-sm font-black text-white mt-0.5">{activeHistoryWeek} Detayları</h4>
              </div>
              
              {/* General motivational badge */}
              <div className="text-right">
                {(() => {
                  let completed = 0;
                  let total = 0;
                  routines.forEach(r => {
                    const entry = getRoutineHistory(r).find(h => h.weekLabel === activeHistoryWeek);
                    if (entry) completed += entry.completedDays.length;
                    total += 7;
                  });
                  const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
                  return (
                    <span className={`text-xs font-bold px-3 py-1.5 rounded-xl ${
                      rate >= 80 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      rate >= 50 ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                      'bg-slate-850 text-slate-400 border border-slate-800'
                    }`}>
                      Haftalık Skor: %{rate}
                    </span>
                  );
                })()}
              </div>
            </div>

            {/* Motivational Quote banner */}
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800/80 text-xs text-slate-300 leading-relaxed flex items-start space-x-2.5">
              <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                {(() => {
                  let completed = 0;
                  let total = 0;
                  routines.forEach(r => {
                    const entry = getRoutineHistory(r).find(h => h.weekLabel === activeHistoryWeek);
                    if (entry) completed += entry.completedDays.length;
                    total += 7;
                  });
                  const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
                  
                  if (rate === 100) return "🏅 Efsanevi hafta! Tüm hedeflerine fire vermeden ulaştın. Kusursuz istikrar!";
                  if (rate >= 70) return "🌟 Harika istikrar! Haftayı çok verimli ve disiplinli tamamladın.";
                  if (rate >= 40) return "👍 Güzel deneme! Rutinlerine büyük oranda sadık kaldın, bir sonraki hafta daha iyisini yapabilirsin.";
                  return "💪 Rutinler alışkanlık yaratır. Kendine inan ve pes etmeden küçük adımlarla yeni haftaya odaklan.";
                })()}
              </div>
            </div>

            {/* Grid list of routines in selected week */}
            <div className="space-y-4">
              {routines.filter(r => {
                const entry = getRoutineHistory(r).find(h => h.weekLabel === activeHistoryWeek);
                return !!entry || (!r.isDeleted && activeHistoryWeek === getWeekLabel());
              }).map((r) => {
                const entry = getRoutineHistory(r).find(h => h.weekLabel === activeHistoryWeek);
                const completedDays = entry ? entry.completedDays : [];
                const count = completedDays.length;
                const percent = Math.round((count / 7) * 100);

                return (
                  <div key={r.id} className="bg-slate-900/40 border border-slate-850 rounded-xl p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center space-x-2">
                          <h5 className="text-xs font-bold text-white">{r.title}</h5>
                          {r.isDeleted && (
                            <span className="text-[9px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-1.5 py-0.5 rounded font-medium">
                              Silinmiş Rutin
                            </span>
                          )}
                        </div>
                        {r.target && (
                          <span className="inline-block text-[10px] text-slate-500 mt-0.5 font-semibold">Hedef: {r.target}</span>
                        )}
                      </div>
                      <div className="text-right font-mono text-[11px]">
                        <span className="font-bold text-slate-300">{count}/7 Gün</span>
                        <span className="text-indigo-400 ml-1.5 font-bold">%{percent}</span>
                      </div>
                    </div>

                    {/* Read-only Days Dots Grid */}
                    <div className="grid grid-cols-7 gap-1.5 pt-1.5">
                      {DAYS_OF_WEEK.map(day => {
                        const isCompleted = completedDays.includes(day);
                        return (
                          <div
                            key={day}
                            title={`${day}: ${isCompleted ? 'Tamamlandı' : 'Tamamlanmadı'}`}
                            className={`py-2 rounded-lg border text-center flex flex-col items-center justify-center space-y-0.5 select-none transition-all ${
                              isCompleted
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                : 'bg-slate-900/30 border-slate-850/40 text-slate-600'
                            }`}
                          >
                            <span className="text-[7px] font-bold uppercase">{day.substring(0, 3)}</span>
                            <Check className={`w-2.5 h-2.5 ${isCompleted ? 'opacity-100' : 'opacity-0'}`} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )}

</div>

      {/* Double Confirmation Modal for Resetting Routines */}
      <AnimatePresence>
        {showArchiveConfirm && (
          (() => {
            const targetWeekLabel = getWeekLabel(getOffsetDate(archiveWeekOffset));
            
            // Check if there is already an archive with this weekLabel in any routine's history
            const isAlreadyArchived = routines.some(r => 
              (r.history || []).some(h => normalizeWeekLabel(h.weekLabel) === normalizeWeekLabel(targetWeekLabel))
            ) || CHRONOLOGICAL_SEEDS.includes(targetWeekLabel);

            const handleInitiateChoice = (choice: 'keep_template' | 'fresh_start') => {
              setArchiveChoice(choice);
              if (isAlreadyArchived) {
                setOverwriteStep(1); // Trigger 1st confirmation step
              } else {
                executeArchiveAndReset(choice, targetWeekLabel);
              }
            };

            return (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 z-50 animate-fade-in"
                onClick={handleCancelReset}
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                  className="bg-slate-900 border border-purple-500/30 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-5 relative overflow-hidden modal-dialog-card my-auto max-h-[92vh] overflow-y-auto custom-scrollbar"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Glow accent */}
                  <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />

                  {/* Header */}
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h3 className="text-base font-black text-white flex items-center space-x-2">
                      <History className="w-5 h-5 text-purple-400 shrink-0" />
                      <span>Haftayı Arşive Kaldır & Sıfırla</span>
                    </h3>
                    <button 
                      onClick={handleCancelReset} 
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
                          Seçtiğiniz <strong className="text-white underline">{targetWeekLabel}</strong> haftasına ait rutinlerinizde daha önce kaydedilmiş bir arşiv verisi bulunmaktadır.
                        </p>
                        <p className="text-amber-300 font-semibold pt-1">
                          Eski arşiv verisini silip, yerine bu haftanın rutin takip verilerini kaydetmek istediğinizden emin misiniz?
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

                  {/* OVERWRITE CONFIRMATION STEP 2 (FINAL DOUBLE CONFIRMATION) */}
                  {overwriteStep === 2 && (
                    <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                      <div className="p-4 bg-rose-950/50 border border-rose-500/60 rounded-2xl space-y-2 text-xs">
                        <div className="flex items-center space-x-2 text-rose-400 font-extrabold text-sm">
                          <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400" />
                          <span>⚠️ SON ONAY (2 / 2) - Kalıcı İşlem</span>
                        </div>
                        <p className="text-rose-200/95 leading-relaxed font-medium pt-1">
                          <strong>DİKKAT:</strong> <strong className="text-white underline">{targetWeekLabel}</strong> haftasının eski rutin arşiv verileri <strong>KALICI OLARAK SİLİNECEK</strong> ve geri getirilemeyecektir.
                        </p>
                        <p className="text-rose-300 font-bold pt-1">
                          Bu işlemi onaylayıp eski arşivi silerek yeni rutin planını kaydetmek istiyor musunuz?
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

                  {/* MAIN ARCHIVE FORM (When overwriteStep === 0) */}
                  {overwriteStep === 0 && (
                    <div className="space-y-4">
                      <div className="p-3.5 bg-purple-950/20 border border-purple-500/20 rounded-2xl space-y-1 text-xs text-purple-300 leading-relaxed font-semibold">
                        <p>ℹ️ Mevcut rutin işaretlemeleriniz belirtilen haftanın arşivine aktarılacaktır.</p>
                      </div>

                      {/* SECTION: TARİH BİLGİSİ (WEEK SELECTOR) */}
                      <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-3">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                          <span className="flex items-center space-x-1.5 text-purple-400">
                            <CalendarDays className="w-4 h-4" />
                            <span>Tarih Bilgisi (Arşivlenecek Hafta)</span>
                          </span>
                          <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-purple-900/40 text-purple-300 border border-purple-700/50 font-bold font-sans">
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

                      {/* ALREADY ARCHIVED WARNING BADGE */}
                      {isAlreadyArchived && (
                        <div className="p-3.5 bg-amber-950/40 border border-amber-500/40 rounded-2xl flex items-start space-x-3 text-amber-200 text-xs animate-in fade-in duration-200">
                          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                          <div className="space-y-0.5">
                            <div className="font-extrabold text-amber-300">
                              Seçtiğiniz haftada daha önce girilmiş veri var!
                            </div>
                            <div className="text-[11px] text-amber-200/90 leading-relaxed">
                              "{targetWeekLabel}" haftasına ait mevcut bir rutin arşivi bulunuyor. Devam ederseniz eskisini silip üzerine yazmak için onay istenecektir.
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1 pt-1">
                        YENİ HAFTA BAŞLANGIÇ TERCİHİNİZ:
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {/* Option A: Keep Template */}
                        <button
                          type="button"
                          onClick={() => handleInitiateChoice('keep_template')}
                          className="p-4 bg-slate-950 hover:bg-slate-800/85 border border-indigo-500/30 hover:border-indigo-500/50 rounded-2xl text-left transition-all duration-200 group cursor-pointer"
                        >
                          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-2.5 group-hover:scale-110 transition-transform">
                            <RotateCcw className="w-4 h-4" />
                          </div>
                          <h4 className="text-xs font-black text-white">Rutin Şablonunu Koru</h4>
                          <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                            Mevcut tanımlı rutinlerinizi korur; sadece bu haftaki işaretlemeleri sıfırlayarak yeni haftaya hazırlar.
                          </p>
                        </button>

                        {/* Option B: Fresh Start */}
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
                            Tüm özel rutinlerinizi temizler ve sıfırdan varsayılan şablon rutinler ile yeni bir başlangıç sunar.
                          </p>
                        </button>
                      </div>

                      {/* Reset without archiving option */}
                      <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <button
                          type="button"
                          onClick={handleOnlyReset}
                          className="text-rose-400 hover:text-rose-300 text-xs font-bold transition-colors cursor-pointer py-1.5 px-2.5 hover:bg-rose-500/5 rounded-lg border border-transparent hover:border-rose-500/20"
                          title="Haftayı arşive kaydetmeden doğrudan sıfırla"
                        >
                          Arşivlemeden Sadece Sıfırla
                        </button>

                        <button
                          type="button"
                          onClick={handleCancelReset}
                          className="px-4 py-2.5 text-slate-400 hover:text-white font-bold transition-colors rounded-xl border border-slate-800 hover:bg-slate-800 cursor-pointer text-xs w-full sm:w-auto"
                        >
                          Vazgeç
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              </motion.div>
            );
          })()
        )}
      </AnimatePresence>

      {/* Double Confirmation Modal for Routine Deletion */}
      <ConfirmDeleteModal
        isOpen={!!deletingRoutine}
        title="Rutini Sil"
        itemName={deletingRoutine?.title}
        onConfirm={() => {
          if (deletingRoutine) {
            const updated = routines.map(r => r.id === deletingRoutine.id ? { ...r, isDeleted: true } : r);
            onUpdateRoutines(
              updated,
              `"${deletingRoutine.title}" rutini silindi.`
            );
            setDeletingRoutine(null);
          }
        }}
        onClose={() => setDeletingRoutine(null)}
      />
    </>
  );
};

