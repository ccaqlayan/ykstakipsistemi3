import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sliders, 
  X, 
  Check, 
  Eye, 
  EyeOff, 
  GripVertical, 
  ArrowUp, 
  ArrowDown, 
  RotateCcw, 
  LayoutGrid, 
  List, 
  Sparkles,
  Timer,
  Target,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  BookCheck,
  Flame,
  MessageSquareQuote,
  Play,
  Info,
  BarChart2,
  BookOpen,
  GraduationCap,
  Video,
  PieChart,
  Activity,
  Plus,
  Trash2,
  StickyNote,
  Award
} from 'lucide-react';

export interface DashboardWidgetConfig {
  id: string;
  title: string;
  description: string;
  category: 'header' | 'kpis' | 'charts' | 'content';
  visible: boolean;
  order: number;
  config?: {
    subject?: string;
    chartPeriod?: 'all' | 'last5' | 'last10';
  };
}

export const ALL_AVAILABLE_SUBJECTS = [
  'TYT Matematik',
  'TYT Türkçe',
  'Paragraf',
  'TYT Geometri',
  'TYT Fizik',
  'TYT Kimya',
  'TYT Biyoloji',
  'TYT Tarih',
  'TYT Coğrafya',
  'AYT Matematik',
  'AYT Fizik',
  'AYT Kimya',
  'AYT Biyoloji',
  'AYT Edebiyat',
  'AYT Geometri',
  'AYT Tarih-1',
  'AYT Coğrafya-1'
];

export const DEFAULT_DASHBOARD_WIDGETS: DashboardWidgetConfig[] = [
  {
    id: 'countdown',
    title: 'Sınav Geri Sayım Çubuğu',
    description: 'YKS 2027 sınavına kalan gün, ay ve detaylı süre sayacı',
    category: 'header',
    visible: true,
    order: 1
  },
  {
    id: 'target_banner',
    title: 'Hedef & Üniversite Tablosu',
    description: 'Hedef üniversite, bölüm, derece, OBP ve TYT/AYT net hedefleri',
    category: 'header',
    visible: true,
    order: 2
  },
  {
    id: 'badges_widget',
    title: 'Başarılar & Rozet Vitrini',
    description: '3D kristal başarı rozetleri, günlük çalışma serisi (streak) ve toplam XP vitrini',
    category: 'header',
    visible: true,
    order: 3
  },
  {
    id: 'quick_notes',
    title: 'Hızlı Notlarım (Not Defteri)',
    description: 'Anlık akla gelen kısa fikir ve hatırlatmaları doğrudan Firebase\'e kaydeden hızlı not paneli',
    category: 'header',
    visible: true,
    order: 4
  },
  {
    id: 'daily_routines',
    title: 'Günlük Rutin Özeti',
    description: 'Bugünün paragraf, problem, geometri ve diğer rutinlerinin hızlı takibi',
    category: 'header',
    visible: true,
    order: 5
  },
  {
    id: 'weekly_schedule',
    title: 'Haftalık Çalışma Programı Özeti',
    description: 'Haftalık ders ve konu çalışma takvimi listesi',
    category: 'header',
    visible: true,
    order: 6
  },
  {
    id: 'kpi_questions',
    title: 'Soru Hedef Başarısı Kartı',
    description: 'Günlük çözülen soru ve hedef yüzdesi göstergesi',
    category: 'kpis',
    visible: true,
    order: 7
  },
  {
    id: 'kpi_mocks',
    title: 'Son Deneme Performansı Kartı',
    description: 'Son deneme sınavındaki TYT ve AYT net özeti',
    category: 'kpis',
    visible: true,
    order: 8
  },
  {
    id: 'kpi_errors',
    title: 'Eksik Konu & Yanlış Defteri Kartı',
    description: 'Tekrar edilmeyi bekleyen yanlış soru sayıları',
    category: 'kpis',
    visible: true,
    order: 9
  },
  {
    id: 'kpi_resources',
    title: 'Kaynak Takibi Durumu Kartı',
    description: 'Soru bankaları ve konu tamamlama yüzdesi',
    category: 'kpis',
    visible: true,
    order: 10
  },
  {
    id: 'subject_progress_widget',
    title: 'Özel Ders İlerlemesi Özeti',
    description: 'Seçeceğin bir dersin (Matematik, Fizik, Türkçe vb.) müfredat ve soru çözümü başarısı',
    category: 'kpis',
    visible: true,
    order: 11,
    config: { subject: 'TYT Matematik' }
  },
  {
    id: 'mock_chart_widget',
    title: 'Deneme Net İlerleme Grafiği',
    description: 'Zamana göre TYT ve AYT deneme netlerindeki artış/azalış görsel grafiği',
    category: 'charts',
    visible: true,
    order: 12
  },
  {
    id: 'error_reasons_widget',
    title: 'Yanlış Nedenleri Analiz Grafiği',
    description: 'Hatalı soruların nedenlerine göre (Bilgi eksikliği, dikkat hatası, süre vs.) dağılımı',
    category: 'charts',
    visible: true,
    order: 13
  },
  {
    id: 'branch_exams_widget',
    title: 'Branş Denemeleri Performansı',
    description: 'Tamamlanan branş denemelerinin ders bazlı net ve süre ortalamaları',
    category: 'kpis',
    visible: true,
    order: 14
  },
  {
    id: 'past_exams_widget',
    title: 'ÖSYM Çıkmış Sorular Çözüm Özeti',
    description: 'Geçmiş yıl YKS sınav sorularını çözme ve doğru/yanlış analiz oranları',
    category: 'kpis',
    visible: true,
    order: 15
  },
  {
    id: 'video_lessons_widget',
    title: 'Video Ders & Playlist Takibi',
    description: 'YouTube video ders tamamlama oranı ve toplam izleme süreleri',
    category: 'kpis',
    visible: true,
    order: 16
  },
  {
    id: 'pomodoro_stats_widget',
    title: 'Pomodoro Odaklanma İstatistikleri',
    description: 'Haftalık ve toplam kronometreli odaklanma süresi ile seans sayıları',
    category: 'kpis',
    visible: true,
    order: 17
  },
  {
    id: 'coach_notes',
    title: 'YKS Koç Notu & AI Analizi',
    description: 'Koçun değerlendirme mesajı ve yapay zeka analiz bağlantısı',
    category: 'content',
    visible: true,
    order: 18
  },
  {
    id: 'ai_coach_summary',
    title: 'Yapay Zeka Koç Analizi Özeti',
    description: 'Yapay Zeka Koçunun oluşturduğu en son genel değerlendirme ve aksiyon planı özeti',
    category: 'content',
    visible: true,
    order: 19
  },
  {
    id: 'quick_actions',
    title: 'Hızlı İşlemler Paneli',
    description: 'Pomodoro odaklanma modu, soru ekleme ve deneme girme butonları',
    category: 'content',
    visible: true,
    order: 20
  }
];

interface DashboardCustomizeModalProps {
  widgets: DashboardWidgetConfig[];
  onSave: (updatedWidgets: DashboardWidgetConfig[]) => void;
  onReset: () => void;
  onClose: () => void;
}

export const DashboardCustomizeModal: React.FC<DashboardCustomizeModalProps> = ({
  widgets,
  onSave,
  onReset,
  onClose
}) => {
  const [localWidgets, setLocalWidgets] = useState<DashboardWidgetConfig[]>(() => {
    const sorted = [...widgets].sort((a, b) => a.order - b.order);
    return sorted;
  });

  const [filterCategory, setFilterCategory] = useState<'all' | 'header' | 'kpis' | 'charts' | 'content'>('all');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [lastMovedId, setLastMovedId] = useState<string | null>(null);

  const getWidgetIcon = (id: string) => {
    if (id === 'subject_progress_widget' || id.startsWith('subject_progress')) {
      return <BookOpen className="w-5 h-5 text-cyan-400" />;
    }
    switch (id) {
      case 'countdown': return <Timer className="w-5 h-5 text-emerald-400" />;
      case 'target_banner': return <Target className="w-5 h-5 text-indigo-400" />;
      case 'badges_widget': return <Award className="w-5 h-5 text-amber-400" />;
      case 'daily_routines': return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
      case 'kpi_questions': return <CheckCircle2 className="w-5 h-5 text-indigo-400" />;
      case 'kpi_mocks': return <TrendingUp className="w-5 h-5 text-emerald-400" />;
      case 'kpi_errors': return <AlertTriangle className="w-5 h-5 text-rose-400" />;
      case 'kpi_resources': return <BookCheck className="w-5 h-5 text-amber-400" />;
      case 'mock_chart_widget': return <BarChart2 className="w-5 h-5 text-indigo-400" />;
      case 'error_reasons_widget': return <PieChart className="w-5 h-5 text-rose-400" />;
      case 'branch_exams_widget': return <Activity className="w-5 h-5 text-emerald-400" />;
      case 'past_exams_widget': return <GraduationCap className="w-5 h-5 text-amber-400" />;
      case 'video_lessons_widget': return <Video className="w-5 h-5 text-purple-400" />;
      case 'pomodoro_stats_widget': return <Activity className="w-5 h-5 text-indigo-400" />;
      case 'weekly_schedule': return <Flame className="w-5 h-5 text-indigo-400" />;
      case 'coach_notes': return <MessageSquareQuote className="w-5 h-5 text-purple-400" />;
      case 'ai_coach_summary': return <Sparkles className="w-5 h-5 text-purple-400" />;
      case 'quick_actions': return <Play className="w-5 h-5 text-indigo-400" />;
      case 'quick_notes': return <StickyNote className="w-5 h-5 text-amber-400" />;
      default: return <Sparkles className="w-5 h-5 text-indigo-400" />;
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'header':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">Üst Modüller</span>;
      case 'kpis':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">Performans Kartları</span>;
      case 'charts':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">Grafik & Analiz</span>;
      case 'content':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/20">Alt Paneller</span>;
      default:
        return null;
    }
  };

  const toggleVisibility = (id: string) => {
    setLocalWidgets(prev =>
      prev.map(w => (w.id === id ? { ...w, visible: !w.visible } : w))
    );
  };

  const toggleAllVisibility = (visible: boolean) => {
    setLocalWidgets(prev => prev.map(w => ({ ...w, visible })));
  };

  const handleAddSubjectProgressWidget = () => {
    const currentSubjects = localWidgets
      .filter(w => w.id === 'subject_progress_widget' || w.id.startsWith('subject_progress'))
      .map(w => w.config?.subject);
    const unused = ALL_AVAILABLE_SUBJECTS.find(s => !currentSubjects.includes(s)) || 'AYT Fizik';
    const newId = `subject_progress_${Date.now()}`;
    const newWidget: DashboardWidgetConfig = {
      id: newId,
      title: `${unused} İlerlemesi`,
      description: `${unused} dersinin müfredat ve soru çözümü başarı durumu`,
      category: 'kpis',
      visible: true,
      order: localWidgets.length + 1,
      config: { subject: unused }
    };
    setLocalWidgets(prev => [...prev, newWidget]);
  };

  const handleRemoveSubjectWidget = (id: string) => {
    setLocalWidgets(prev => prev.filter(w => w.id !== id));
  };

  const updateWidgetConfig = (id: string, newConfig: Record<string, any>) => {
    setLocalWidgets(prev =>
      prev.map(w => {
        if (w.id === id) {
          const updatedSubject = newConfig.subject || w.config?.subject;
          const isSubj = w.id === 'subject_progress_widget' || w.id.startsWith('subject_progress');
          return {
            ...w,
            title: isSubj && updatedSubject ? `${updatedSubject} İlerlemesi` : w.title,
            description: isSubj && updatedSubject ? `${updatedSubject} dersinin müfredat ve soru çözümü başarı durumu` : w.description,
            config: { ...w.config, ...newConfig }
          };
        }
        return w;
      })
    );
  };

  const moveWidget = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= localWidgets.length) return;

    const updated = [...localWidgets];
    const movedItem = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = movedItem;

    const reordered = updated.map((w, idx) => ({ ...w, order: idx + 1 }));
    setLocalWidgets(reordered);
    setLastMovedId(movedItem.id);

    setTimeout(() => {
      setLastMovedId(prev => (prev === movedItem.id ? null : prev));
    }, 1000);
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const updated = [...localWidgets];
    const draggedItem = updated[draggedIndex];
    updated.splice(draggedIndex, 1);
    updated.splice(index, 0, draggedItem);

    const reordered = updated.map((w, idx) => ({ ...w, order: idx + 1 }));
    setDraggedIndex(index);
    setLocalWidgets(reordered);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleSave = () => {
    onSave(localWidgets);
    onClose();
  };

  const handleResetLocal = () => {
    onReset();
    onClose();
  };

  const filteredWidgets = localWidgets.filter(w => {
    if (filterCategory === 'all') return true;
    return w.category === filterCategory;
  });

  const visibleCount = localWidgets.filter(w => w.visible).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-indigo-500/30 rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden relative">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shadow-inner">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-xl font-bold text-white flex items-center space-x-2">
                <span>Genel Özet Sayfasını Özelleştir</span>
                <span className="text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2.5 py-0.5 rounded-full font-mono">
                  {visibleCount}/{localWidgets.length} Aktif
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Görmek istediğin özellikleri seç, sıralamasını sürükleyerek düzenle ve ders grafiklerini kişiselleştir.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Controls Bar: Category Filters & View Toggle */}
        <div className="px-4 py-3 sm:px-6 bg-slate-950/60 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Category Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => setFilterCategory('all')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
                filterCategory === 'all'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-800/70 text-slate-400 hover:text-white'
              }`}
            >
              Tümü ({localWidgets.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterCategory('header')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
                filterCategory === 'header'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-800/70 text-slate-400 hover:text-white'
              }`}
            >
              Üst Modüller
            </button>
            <button
              type="button"
              onClick={() => setFilterCategory('kpis')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
                filterCategory === 'kpis'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-800/70 text-slate-400 hover:text-white'
              }`}
            >
              Performans
            </button>
            <button
              type="button"
              onClick={() => setFilterCategory('charts')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
                filterCategory === 'charts'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-800/70 text-slate-400 hover:text-white'
              }`}
            >
              Grafik & Analiz
            </button>
            <button
              type="button"
              onClick={() => setFilterCategory('content')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
                filterCategory === 'content'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-800/70 text-slate-400 hover:text-white'
              }`}
            >
              Alt Paneller
            </button>
          </div>

          {/* View Mode Switcher & Quick Actions */}
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleAddSubjectProgressWidget}
              className="text-xs bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-200 border border-cyan-400/40 px-3 py-1.5 rounded-xl font-bold transition-all flex items-center space-x-1.5 cursor-pointer shadow-md shadow-cyan-600/20"
              title="Birden fazla ders için ilerleme kutucuğu ekle"
            >
              <Plus className="w-3.5 h-3.5 text-cyan-300 stroke-[3]" />
              <span>+ Ders Kutucuğu Ekle</span>
            </button>

            <button
              type="button"
              onClick={() => toggleAllVisibility(visibleCount !== localWidgets.length)}
              className="text-xs bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 px-2.5 py-1.5 rounded-xl transition-all font-semibold flex items-center space-x-1 cursor-pointer"
            >
              {visibleCount === localWidgets.length ? (
                <>
                  <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                  <span className="hidden xs:inline">Tümünü Gizle</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="hidden xs:inline">Tümünü Göster</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Modal Body: Standard List View */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-3 custom-scrollbar">
          
          <div className="bg-indigo-500/10 border border-indigo-500/20 p-3 rounded-2xl flex items-center space-x-2.5 text-xs text-indigo-200 mb-2">
            <Info className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>
              <strong>Kişiselleştirme İpucu:</strong> İstediğin özelliği açıp kapatabilir, sürükleyerek sırasını değiştirebilir veya özel ders kartlarında ilgili dersi doğrudan seçebilirsin.
            </span>
          </div>

          <motion.div layout className="space-y-2">
            <AnimatePresence initial={false}>
              {filteredWidgets.map((widget) => {
                const globalIndex = localWidgets.findIndex(w => w.id === widget.id);
                const isDragging = draggedIndex === globalIndex;
                const isJustMoved = lastMovedId === widget.id;

                return (
                  <motion.div
                    layout
                    key={widget.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ 
                      opacity: 1, 
                      y: 0,
                      scale: isJustMoved ? 1.015 : 1
                    }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{
                      layout: { type: 'spring', stiffness: 400, damping: 30 },
                      scale: { duration: 0.25 }
                    }}
                    draggable
                    onDragStart={(e) => handleDragStart(e as any, globalIndex)}
                    onDragOver={(e) => handleDragOver(e as any, globalIndex)}
                    onDragEnd={handleDragEnd}
                    className={`p-3 sm:p-3.5 rounded-2xl border transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isJustMoved 
                        ? 'bg-slate-850 border-indigo-400 ring-2 ring-indigo-500/50 shadow-xl shadow-indigo-500/20 z-10'
                        : widget.visible
                        ? 'bg-slate-900/90 border-slate-800 hover:border-indigo-500/50'
                        : 'bg-slate-950/40 border-slate-900 opacity-60'
                    } ${isDragging ? 'border-2 border-dashed border-indigo-500 bg-indigo-950/30' : ''}`}
                  >
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      {/* Drag Handle */}
                      <div 
                        className="p-1 text-slate-500 hover:text-slate-300 cursor-grab active:cursor-grabbing rounded-lg hover:bg-slate-800 transition-colors shrink-0"
                        title="Sürükle"
                      >
                        <GripVertical className="w-4 h-4" />
                      </div>

                      {/* Index Number */}
                      <span className="text-xs font-mono font-bold text-slate-500 w-5 text-center shrink-0">
                        {globalIndex + 1}.
                      </span>

                      {/* Icon */}
                      <div className="w-8 h-8 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center shrink-0">
                        {getWidgetIcon(widget.id)}
                      </div>

                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="text-xs sm:text-sm font-bold text-white truncate">
                            {widget.title}
                          </h3>
                          {getCategoryBadge(widget.category)}
                          {isJustMoved && (
                            <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-bold px-1.5 py-0.5 rounded border border-indigo-500/30 animate-pulse">
                              Taşındı ✨
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          {widget.description}
                        </p>
                      </div>
                    </div>

                    {/* Inline subject selection if widget is subject_progress */}
                    {(widget.id === 'subject_progress_widget' || widget.id.startsWith('subject_progress')) && (
                      <div className="flex items-center space-x-2 shrink-0 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800">
                        <span className="text-[10px] text-slate-400 font-semibold pl-1">Ders:</span>
                        <select
                          value={widget.config?.subject || 'TYT Matematik'}
                          onChange={(e) => updateWidgetConfig(widget.id, { subject: e.target.value })}
                          className="bg-slate-900 text-indigo-300 font-bold border border-indigo-500/30 rounded-lg px-2 py-0.5 text-xs focus:outline-none focus:border-indigo-400 cursor-pointer"
                        >
                          {ALL_AVAILABLE_SUBJECTS.map(subj => (
                            <option key={subj} value={subj}>{subj}</option>
                          ))}
                        </select>
                        {widget.id !== 'subject_progress_widget' && (
                          <button
                            type="button"
                            onClick={() => handleRemoveSubjectWidget(widget.id)}
                            className="p-1 text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 rounded-lg border border-rose-500/30 transition-all cursor-pointer"
                            title="Bu ders kutucuğunu sil"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}

                    {/* Actions & Switch */}
                    <div className="flex items-center justify-end space-x-2 shrink-0">
                      <div className="flex items-center space-x-1">
                        <motion.button
                          whileTap={{ scale: 0.8 }}
                          type="button"
                          onClick={() => moveWidget(globalIndex, 'up')}
                          disabled={globalIndex === 0}
                          className="p-1.5 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 hover:bg-indigo-600/30 hover:border-indigo-500/40 disabled:opacity-30 disabled:pointer-events-none rounded-lg border border-slate-700/60 transition-colors cursor-pointer"
                          title="Yukarı Taşı"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </motion.button>
                        <motion.button
                          whileTap={{ scale: 0.8 }}
                          type="button"
                          onClick={() => moveWidget(globalIndex, 'down')}
                          disabled={globalIndex === localWidgets.length - 1}
                          className="p-1.5 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 hover:bg-indigo-600/30 hover:border-indigo-500/40 disabled:opacity-30 disabled:pointer-events-none rounded-lg border border-slate-700/60 transition-colors cursor-pointer"
                          title="Aşağı Taşı"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </motion.button>
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleVisibility(widget.id)}
                        className={`px-3 py-1.5 rounded-xl border font-semibold text-xs transition-all cursor-pointer flex items-center space-x-1.5 ${
                          widget.visible
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30'
                            : 'bg-slate-800 text-slate-500 border-slate-700 hover:bg-slate-750'
                        }`}
                      >
                        {widget.visible ? (
                          <>
                            <Eye className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Açık</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Kapalı</span>
                          </>
                        )}
                      </button>
                    </div>

                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-6 border-t border-slate-800 bg-slate-900/90 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={handleResetLocal}
            className="text-xs text-rose-300 hover:text-rose-200 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 px-3.5 py-2 rounded-xl font-semibold flex items-center space-x-1.5 transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Varsayılana Sıfırla</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 px-4 py-2 rounded-xl font-semibold transition-all cursor-pointer"
            >
              İptal
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="text-xs text-white bg-indigo-600 hover:bg-indigo-500 border border-indigo-400/40 px-5 py-2 rounded-xl font-bold transition-all shadow-lg shadow-indigo-600/30 flex items-center space-x-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Düzenlemeyi Kaydet</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
