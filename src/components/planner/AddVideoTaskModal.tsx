import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Youtube, 
  Plus, 
  CheckCircle, 
  ListVideo, 
  Video, 
  Clock, 
  Search, 
  Wand2, 
  Loader2, 
  Check, 
  ExternalLink,
  Layers,
  Sparkles,
  Filter,
  PlayCircle,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  CheckCheck,
  RotateCcw
} from 'lucide-react';
import { StudyPlanItem, DayOfWeek, YouTubeVideoItem } from '../../types';
import { YKS_SUBJECTS } from '../../data/initialData';

interface AddVideoTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  youtubeVideos: YouTubeVideoItem[];
  defaultDay: DayOfWeek;
  DAYS: DayOfWeek[];
  onAddPlan: (plan: Omit<StudyPlanItem, 'id'>) => void;
  weekLabel: string;
}

const formatDuration = (totalMinutes?: number): string => {
  if (!totalMinutes || totalMinutes <= 0) return '0 dk';
  const hours = Math.floor(totalMinutes / 60);
  const mins = Math.round(totalMinutes % 60);
  if (hours > 0) {
    if (mins > 0) {
      return `${hours}sa ${mins}dk`;
    }
    return `${hours}sa`;
  }
  return `${mins}dk`;
};

const extractYouTubeVideoId = (url?: string): string | null => {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|playlist\?list=.*[&?]v=))([\w-]{11})/);
  if (match && match[1]) return match[1];
  const matchV = textMatch(url);
  if (matchV) return matchV;
  return null;
};

const textMatch = (url: string): string | null => {
  const matchV = url.match(/[?&]v=([\w-]{11})/);
  return matchV && matchV[1] ? matchV[1] : null;
};

const getYouTubeThumbnail = (videoUrl?: string, firstSubVideoUrl?: string): string | null => {
  const id = extractYouTubeVideoId(videoUrl) || extractYouTubeVideoId(firstSubVideoUrl);
  return id ? `https://i.ytimg.com/vi/${id}/mqdefault.jpg` : null;
};

export const AddVideoTaskModal: React.FC<AddVideoTaskModalProps> = ({
  isOpen,
  onClose,
  youtubeVideos,
  defaultDay,
  DAYS,
  onAddPlan,
  weekLabel
}) => {
  const [activeTab, setActiveTab] = useState<'tracker' | 'manual'>('tracker');
  const [targetDay, setTargetDay] = useState<DayOfWeek>(defaultDay);
  const [targetMinutes, setTargetMinutes] = useState<number>(45);

  // Tab 1 (Tracker Selection) states
  const [subjectFilter, setSubjectFilter] = useState<string>('Tümü');
  const [watchStatusFilter, setWatchStatusFilter] = useState<'all' | 'unwatched' | 'watched'>('unwatched');
  const [contentTypeFilter, setContentTypeFilter] = useState<'all' | 'single' | 'playlist'>('all');
  const [selectedItems, setSelectedItems] = useState<Record<string, { subject: string; title: string; channelName: string; videoUrl: string; duration?: number }>>({});
  const [expandedPlaylists, setExpandedPlaylists] = useState<Record<string, boolean>>({});

  // Tab 2 (Manual / Link) states
  const [videoUrl, setVideoUrl] = useState('');
  const [topicName, setTopicName] = useState('');
  const [channelName, setChannelName] = useState('');
  const [manualSubject, setManualSubject] = useState('');
  const [isLoadingInfo, setIsLoadingInfo] = useState(false);

  if (!isOpen) return null;

  const toggleExpandPlaylist = (id: string) => {
    setExpandedPlaylists(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const isAnyPlaylistExpanded = Object.values(expandedPlaylists).some(Boolean);

  const toggleAllPlaylists = () => {
    if (isAnyPlaylistExpanded) {
      setExpandedPlaylists({});
    } else {
      const allOpen: Record<string, boolean> = {};
      youtubeVideos.forEach(v => {
        if (v.isPlaylist || (v.playlistVideos && v.playlistVideos.length > 1)) {
          allOpen[v.id] = true;
        }
      });
      setExpandedPlaylists(allOpen);
    }
  };

  const isPlaylistItem = (v: YouTubeVideoItem) => {
    return Boolean(v.isPlaylist || (v.playlistVideos && v.playlistVideos.length > 1));
  };

  const singleCount = youtubeVideos.filter(v => !isPlaylistItem(v)).length;
  const playlistCount = youtubeVideos.filter(v => isPlaylistItem(v)).length;

  const subjectsList = ['Tümü', ...Array.from(new Set(youtubeVideos.map(v => v.subject)))];

  const filteredVideos = youtubeVideos.filter(v => {
    const isPlaylist = isPlaylistItem(v);
    const matchesSubject = subjectFilter === 'Tümü' || v.subject === subjectFilter;
    
    let matchesWatchStatus = true;
    if (watchStatusFilter === 'unwatched') {
      if (isPlaylist && v.playlistVideos) {
        matchesWatchStatus = v.playlistVideos.some(s => !s.isWatched);
      } else {
        matchesWatchStatus = !v.isWatched;
      }
    } else if (watchStatusFilter === 'watched') {
      if (isPlaylist && v.playlistVideos) {
        matchesWatchStatus = v.playlistVideos.every(s => s.isWatched);
      } else {
        matchesWatchStatus = v.isWatched;
      }
    }

    let matchesContentType = true;
    if (contentTypeFilter === 'single') {
      matchesContentType = !isPlaylist;
    } else if (contentTypeFilter === 'playlist') {
      matchesContentType = isPlaylist;
    }

    return matchesSubject && matchesWatchStatus && matchesContentType;
  });

  const toggleSelectItem = (key: string, itemData: { subject: string; title: string; channelName: string; videoUrl: string; duration?: number }) => {
    setSelectedItems(prev => {
      const next = { ...prev };
      if (next[key]) {
        delete next[key];
        const remaining = Object.values(next);
        if (remaining.length === 1 && remaining[0].duration && remaining[0].duration > 0) {
          setTargetMinutes(remaining[0].duration);
        }
      } else {
        next[key] = itemData;
        // Auto-fill target duration if the selected video has a duration
        if (itemData.duration && itemData.duration > 0) {
          setTargetMinutes(itemData.duration);
        }
      }
      return next;
    });
  };

  const handleAddSelectedFromTracker = (e: React.FormEvent) => {
    e.preventDefault();
    const items = Object.values(selectedItems);
    if (items.length === 0) {
      alert('Lütfen önce plana eklemek istediğiniz en az 1 video veya ders seçin.');
      return;
    }

    items.forEach(item => {
      onAddPlan({
        subject: item.subject || 'AYT Matematik',
        topic: `[Video] ${item.title} (${item.channelName})`,
        taskType: 'Video İzleme',
        day: targetDay,
        plannedMinutes: item.duration && item.duration > 0 ? item.duration : (targetMinutes || 45),
        completedMinutes: 0,
        status: 'pending',
        weekLabel,
        notes: item.videoUrl || ''
      });
    });

    setSelectedItems({});
    onClose();
  };

  const handleFetchAutoInfo = async () => {
    if (!videoUrl.trim()) {
      alert('Lütfen geçerli bir YouTube URL bağlantısı girin.');
      return;
    }
    setIsLoadingInfo(true);
    try {
      const res = await fetch('/api/youtube/video-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: videoUrl.trim() })
      });
      const data = await res.json();
      if (data.success) {
        if (data.title) setTopicName(data.title);
        if (data.channelName) setChannelName(data.channelName);
        if (data.subject) setManualSubject(data.subject);
        if (data.durationMinutes && data.durationMinutes > 0) setTargetMinutes(data.durationMinutes);
      } else {
        alert('Video bilgisi çekilemedi: ' + (data.error || 'Bilinmeyen hata'));
      }
    } catch (err) {
      alert('Video bilgisi çekilirken sunucu bağlantı hatası.');
    } finally {
      setIsLoadingInfo(false);
    }
  };

  const handleAddManual = (e: React.FormEvent) => {
    e.preventDefault();
    const finalSubject = manualSubject || 'AYT Matematik';
    const finalTopic = topicName.trim() || 'YouTube Ders Videosu';
    const finalChannel = channelName.trim() || 'YouTube';

    onAddPlan({
      subject: finalSubject,
      topic: `[Video] ${finalTopic} (${finalChannel})`,
      taskType: 'Video İzleme',
      day: targetDay,
      plannedMinutes: Number(targetMinutes) || 45,
      completedMinutes: 0,
      status: 'pending',
      weekLabel,
      notes: videoUrl.trim() || ''
    });

    setVideoUrl('');
    setTopicName('');
    setChannelName('');
    setManualSubject('');
    onClose();
  };

  const selectedCount = Object.keys(selectedItems).length;
  const totalSelectedMinutes = Object.values(selectedItems).reduce((acc, item) => {
    return acc + (item.duration && item.duration > 0 ? item.duration : (targetMinutes || 45));
  }, 0);

  const modalContent = (
    <div 
      className="fixed inset-0 z-[100] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-slate-900/95 border border-red-500/30 rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto custom-scrollbar relative my-auto modal-dialog-card">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-br from-red-600 to-rose-600 text-white rounded-2xl shadow-lg shadow-red-600/30">
              <Youtube className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white tracking-tight">Plana YouTube Video Görevi Ekle</h3>
              <p className="text-xs text-slate-400 font-medium">Sıradaki ders videolarınızı çalışma programınıza ekleyin</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="bg-slate-950 p-1.5 rounded-2xl border border-slate-800 flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setActiveTab('tracker')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-2 ${
              activeTab === 'tracker'
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/25'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ListVideo className="w-4 h-4" />
            <span>Kayıtlı Ders Takibimden Seç</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-2 ${
              activeTab === 'manual'
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/25'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Wand2 className="w-4 h-4" />
            <span>Link / Manuel İle Ekle</span>
          </button>
        </div>

        {/* Common Day & Duration Selector Bar */}
        <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Görevin Ekleneceği Gün</label>
            <select
              value={targetDay}
              onChange={(e) => setTargetDay(e.target.value as DayOfWeek)}
              className="w-full bg-slate-900 border border-slate-700 focus:border-red-500 rounded-xl px-3 py-2 text-xs text-white font-bold outline-none cursor-pointer"
            >
              {DAYS.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Varsayılan Süre (Dakika)</label>
            <input
              type="number"
              min={5}
              max={300}
              value={targetMinutes}
              onChange={(e) => setTargetMinutes(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 focus:border-red-500 rounded-xl px-3 py-2 text-xs text-white font-bold outline-none"
            />
          </div>
        </div>

        {/* TAB 1: TRACKER SELECTION */}
        {activeTab === 'tracker' && (
          <form onSubmit={handleAddSelectedFromTracker} className="space-y-4">
            
            {/* Filter & Controls Bar */}
            <div className="space-y-2.5 bg-slate-950/90 p-3.5 rounded-2xl border border-slate-800">
              
              {/* Row 1: Content Type & Expand All / Collapse All */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-850">
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setContentTypeFilter('all')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 border cursor-pointer ${
                      contentTypeFilter === 'all'
                        ? 'bg-red-600 border-red-500 text-white shadow-sm'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Layers className="w-3 h-3" />
                    <span>Tümü ({youtubeVideos.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setContentTypeFilter('single')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 border cursor-pointer ${
                      contentTypeFilter === 'single'
                        ? 'bg-red-600 border-red-500 text-white shadow-sm'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Video className="w-3 h-3 text-rose-400" />
                    <span>Tekil Videolar ({singleCount})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setContentTypeFilter('playlist')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 border cursor-pointer ${
                      contentTypeFilter === 'playlist'
                        ? 'bg-red-600 border-red-500 text-white shadow-sm'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <ListVideo className="w-3 h-3 text-amber-400" />
                    <span>Kamplar ({playlistCount})</span>
                  </button>
                </div>

                {playlistCount > 0 && (
                  <button
                    type="button"
                    onClick={toggleAllPlaylists}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 border cursor-pointer ${
                      isAnyPlaylistExpanded
                        ? 'bg-amber-600/20 border-amber-500/40 text-amber-300 hover:bg-amber-600/30'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-amber-300 hover:border-amber-500/30'
                    }`}
                    title={isAnyPlaylistExpanded ? 'Tüm Kamp Listelerini Kapat' : 'Tüm Kamp Listelerini Aç'}
                  >
                    <ChevronsUpDown className="w-3 h-3 text-amber-400 shrink-0" />
                    <span>{isAnyPlaylistExpanded ? 'Tümünü Kapat' : 'Tümünü Aç'}</span>
                  </button>
                )}
              </div>

              {/* Row 2: Watch Status Filter Row */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center space-x-1.5 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
                  <span className="text-[11px] font-bold text-slate-400 px-1.5 flex items-center space-x-1 shrink-0">
                    <Filter className="w-3 h-3 text-red-400" />
                    <span>Durum:</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setWatchStatusFilter('unwatched')}
                    className={`text-[11px] px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                      watchStatusFilter === 'unwatched'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    🎯 Sıradaki İzlenecekler
                  </button>
                  <button
                    type="button"
                    onClick={() => setWatchStatusFilter('watched')}
                    className={`text-[11px] px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                      watchStatusFilter === 'watched'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    ✅ İzlendi Olanlar
                  </button>
                  <button
                    type="button"
                    onClick={() => setWatchStatusFilter('all')}
                    className={`text-[11px] px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                      watchStatusFilter === 'all'
                        ? 'bg-red-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Tümü
                  </button>
                </div>
              </div>

              {/* Row 3: Ders Seçim Filtreleri (Pencereye Tam Sığan ve Katlanan Görünüm) */}
              <div className="pt-2 border-t border-slate-850 flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-bold text-slate-400 mr-1 uppercase tracking-wider flex items-center space-x-1 shrink-0">
                  <span>Ders:</span>
                </span>
                {subjectsList.map(sub => (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => setSubjectFilter(sub)}
                    className={`text-[11px] px-2.5 py-1 rounded-lg border font-bold transition-all cursor-pointer ${
                      subjectFilter === sub
                        ? 'bg-red-950 border-red-500 text-red-300 shadow-sm'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            </div>

            {/* Videos List */}
            <div className="max-h-80 overflow-y-auto custom-scrollbar space-y-3 pr-1">
              {filteredVideos.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-slate-800 rounded-2xl p-4 space-y-2">
                  <Video className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-400 font-medium">
                    {youtubeVideos.length === 0
                      ? 'Henüz YouTube Ders Takip listenize video eklenmemiş.'
                      : 'Arama ve filtrenize uygun video bulunamadı.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('manual')}
                    className="text-xs text-red-400 hover:text-red-300 font-bold underline cursor-pointer"
                  >
                    "Link / Manuel Ekle" sekmesine geçin ➔
                  </button>
                </div>
              ) : (
                filteredVideos.map(vid => {
                  const isPlaylist = isPlaylistItem(vid);
                  const firstSubUrl = vid.playlistVideos?.[0]?.videoUrl;
                  const thumb = getYouTubeThumbnail(vid.videoUrl, firstSubUrl);
                  const isMainSelected = Boolean(selectedItems[`main-${vid.id}`]);

                  // Playlist metrics
                  const totalSubCount = vid.playlistVideos?.length || 0;
                  const watchedSubCount = vid.playlistVideos?.filter(s => s.isWatched).length || 0;
                  const progressPct = totalSubCount > 0 ? Math.round((watchedSubCount / totalSubCount) * 100) : 0;
                  const nextVideo = vid.playlistVideos?.find(s => !s.isWatched);
                  const nextVideoIdx = nextVideo && vid.playlistVideos ? vid.playlistVideos.indexOf(nextVideo) + 1 : null;
                  const remainingDuration = isPlaylist && vid.playlistVideos
                    ? vid.playlistVideos.filter(s => !s.isWatched).reduce((acc, s) => acc + (s.durationMinutes || 0), 0)
                    : 0;

                  const isExpanded = Boolean(expandedPlaylists[vid.id]);

                  // How many subvideos are currently selected for plan from this playlist
                  const selectedSubCount = isPlaylist && vid.playlistVideos
                    ? vid.playlistVideos.filter(s => Boolean(selectedItems[`sub-${vid.id}-${s.id}`])).length
                    : 0;

                  return (
                    <div 
                      key={vid.id}
                      className="bg-slate-950/90 p-3.5 rounded-2xl border border-slate-800 space-y-3 hover:border-slate-700 transition-all shadow-md"
                    >
                      {/* Top Video Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start space-x-3 min-w-0 flex-1">
                          {/* Thumbnail */}
                          <div className="w-24 h-14 shrink-0 rounded-xl overflow-hidden bg-slate-900 border border-slate-800 relative group">
                            {thumb ? (
                              <img src={thumb} alt={vid.topicName} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-red-950/40 text-red-400">
                                <Youtube className="w-5 h-5" />
                              </div>
                            )}
                            
                            {/* Duration / Video Count Badge */}
                            <div className="absolute bottom-1 right-1 bg-slate-950/90 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold text-white border border-white/10">
                              {isPlaylist ? `${totalSubCount} Video` : formatDuration(vid.durationMinutes)}
                            </div>
                          </div>

                          {/* Info */}
                          <div className="min-w-0 space-y-1 flex-1">
                            <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                              <span className="text-[9px] font-black text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20 uppercase tracking-wider">
                                {vid.subject}
                              </span>

                              {isPlaylist && (
                                <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                                  Oynatma Listesi
                                </span>
                              )}

                              {/* Watch Status Badge */}
                              {vid.isWatched || (isPlaylist && watchedSubCount === totalSubCount && totalSubCount > 0) ? (
                                <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 flex items-center space-x-1">
                                  <CheckCircle className="w-2.5 h-2.5" />
                                  <span>Tamamlandı</span>
                                </span>
                              ) : isPlaylist ? (
                                <span className="text-[9px] font-bold text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                                  {watchedSubCount}/{totalSubCount} İzlendi (%{progressPct})
                                </span>
                              ) : (
                                <span className="text-[9px] font-black text-amber-300 bg-amber-500/15 px-1.5 py-0.5 rounded border border-amber-400/30">
                                  🎯 Sıradaki İzlenecek
                                </span>
                              )}
                            </div>

                            <h4 className="text-xs font-bold text-white truncate">{vid.topicName}</h4>
                            <p className="text-[11px] text-slate-400 truncate flex items-center space-x-1">
                              <span>{vid.channelName}</span>
                              {vid.playlistTitle && vid.playlistTitle !== vid.topicName && (
                                <span className="text-slate-500 italic truncate">• {vid.playlistTitle}</span>
                              )}
                            </p>
                          </div>
                        </div>

                        {/* Select Button for Main Video (Single items only) */}
                        {!isPlaylist && (
                          <button
                            type="button"
                            onClick={() => toggleSelectItem(`main-${vid.id}`, {
                              subject: vid.subject,
                              title: vid.topicName,
                              channelName: vid.channelName,
                              videoUrl: vid.videoUrl || '',
                              duration: vid.durationMinutes
                            })}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1 shrink-0 cursor-pointer ${
                              isMainSelected
                                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                                : vid.isWatched
                                ? 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                                : 'bg-red-600 hover:bg-red-500 text-white border border-red-500/40 shadow-sm'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>{isMainSelected ? 'Seçildi' : 'Plana Seç'}</span>
                          </button>
                        )}
                      </div>

                      {/* 📋 Playlist Collapsible Section */}
                      {isPlaylist && vid.playlistVideos && vid.playlistVideos.length > 0 && (
                        <div className="pt-2 border-t border-slate-850 space-y-2">
                          
                          {/* Accordion Trigger Banner */}
                          <div 
                            onClick={() => toggleExpandPlaylist(vid.id)}
                            className={`w-full p-2.5 sm:p-3 rounded-xl border transition-all cursor-pointer select-none group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 ${
                              isExpanded
                                ? 'bg-slate-900 border-amber-500/40 ring-1 ring-amber-500/20'
                                : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800 hover:border-amber-500/30'
                            }`}
                          >
                            <div className="flex items-center space-x-2.5 min-w-0">
                              <div className={`p-1.5 rounded-lg transition-all shrink-0 ${
                                isExpanded
                                  ? 'bg-amber-500/20 text-amber-400'
                                  : 'bg-slate-950 text-slate-400 group-hover:text-amber-400'
                              }`}>
                                <ListVideo className="w-3.5 h-3.5" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center space-x-2">
                                  <span className="text-xs font-bold text-white group-hover:text-amber-200">
                                    Kamp İçeriği ({vid.playlistVideos.length} Video)
                                  </span>
                                  {selectedSubCount > 0 && (
                                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                      {selectedSubCount} Seçildi
                                    </span>
                                  )}
                                </div>

                                {/* Contextual Next Video Preview when Collapsed */}
                                {!isExpanded && nextVideo && (
                                  <div className="flex items-center space-x-1.5 mt-0.5 text-[11px] text-amber-300/90 truncate">
                                    <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
                                    <span className="font-semibold text-slate-400">Sıradaki:</span>
                                    <span className="font-medium text-slate-200 truncate">{nextVideoIdx}. {nextVideo.title}</span>
                                    {nextVideo.durationMinutes ? (
                                      <span className="text-slate-400 font-mono">({nextVideo.durationMinutes} dk)</span>
                                    ) : null}
                                  </div>
                                )}

                                {!isExpanded && !nextVideo && totalSubCount > 0 && (
                                  <div className="flex items-center space-x-1 mt-0.5 text-[11px] text-emerald-400 font-semibold">
                                    <CheckCircle className="w-3 h-3 text-emerald-400 shrink-0" />
                                    <span>Tüm kamp dersleri tamamlandı! ✨</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Trigger Actions */}
                            <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                              {/* Quick Select Next Video when Collapsed */}
                              {!isExpanded && nextVideo && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const nextKey = `sub-${vid.id}-${nextVideo.id}`;
                                    toggleSelectItem(nextKey, {
                                      subject: vid.subject,
                                      title: nextVideo.title,
                                      channelName: vid.channelName,
                                      videoUrl: nextVideo.videoUrl || vid.videoUrl || '',
                                      duration: nextVideo.durationMinutes
                                    });
                                  }}
                                  className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all flex items-center space-x-1 cursor-pointer ${
                                    selectedItems[`sub-${vid.id}-${nextVideo.id}`]
                                      ? 'bg-emerald-600 text-white border-emerald-500'
                                      : 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                                  }`}
                                  title="Sıradaki dersi doğrudan plana seç"
                                >
                                  {selectedItems[`sub-${vid.id}-${nextVideo.id}`] ? (
                                    <>
                                      <Check className="w-3 h-3" />
                                      <span>Sıradaki Seçildi</span>
                                    </>
                                  ) : (
                                    <>
                                      <Sparkles className="w-3 h-3 text-amber-400" />
                                      <span>Sıradakini Seç</span>
                                    </>
                                  )}
                                </button>
                              )}

                              <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all flex items-center space-x-1 ${
                                isExpanded
                                  ? 'bg-amber-600 text-white border-amber-500'
                                  : 'bg-slate-950 text-slate-300 border-slate-800 group-hover:border-amber-500/40'
                              }`}>
                                <span>{isExpanded ? 'Gizle' : 'Videoları İncele'}</span>
                                {isExpanded ? (
                                  <ChevronUp className="w-3 h-3" />
                                ) : (
                                  <ChevronDown className="w-3 h-3" />
                                )}
                              </span>
                            </div>
                          </div>

                          {/* Expanded Checklist Drawer */}
                          {isExpanded && (
                            <div className="space-y-2 animate-fade-in pt-1">
                              {/* Sub-videos Toolbar */}
                              <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-[11px]">
                                <div className="flex items-center space-x-2 text-slate-400">
                                  <span>Kalan: <strong className="text-amber-300 font-bold">{totalSubCount - watchedSubCount} Video</strong></span>
                                  {remainingDuration > 0 && (
                                    <span>• Kalan Süre: <strong className="text-slate-200 font-mono">{formatDuration(remainingDuration)}</strong></span>
                                  )}
                                </div>

                                <div className="flex items-center space-x-1.5">
                                  {nextVideo && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const nextKey = `sub-${vid.id}-${nextVideo.id}`;
                                        toggleSelectItem(nextKey, {
                                          subject: vid.subject,
                                          title: nextVideo.title,
                                          channelName: vid.channelName,
                                          videoUrl: nextVideo.videoUrl || vid.videoUrl || '',
                                          duration: nextVideo.durationMinutes
                                        });
                                      }}
                                      className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all border cursor-pointer ${
                                        selectedItems[`sub-${vid.id}-${nextVideo.id}`]
                                          ? 'bg-emerald-600 text-white border-emerald-500'
                                          : 'bg-amber-500/20 text-amber-300 border-amber-500/30 hover:bg-amber-500/30'
                                      }`}
                                    >
                                      🎯 Sıradakini Seç
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedItems(prev => {
                                        const next = { ...prev };
                                        vid.playlistVideos!.forEach(s => {
                                          const subKey = `sub-${vid.id}-${s.id}`;
                                          next[subKey] = {
                                            subject: vid.subject,
                                            title: s.title,
                                            channelName: vid.channelName,
                                            videoUrl: s.videoUrl || vid.videoUrl || '',
                                            duration: s.durationMinutes
                                          };
                                        });
                                        return next;
                                      });
                                    }}
                                    className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-[10px] font-semibold cursor-pointer"
                                  >
                                    Tümünü Seç
                                  </button>

                                  {selectedSubCount > 0 && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedItems(prev => {
                                          const next = { ...prev };
                                          vid.playlistVideos!.forEach(s => {
                                            delete next[`sub-${vid.id}-${s.id}`];
                                          });
                                          return next;
                                        });
                                      }}
                                      className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 text-[10px] font-semibold cursor-pointer"
                                    >
                                      Seçimi Kaldır
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* Checklist Items Container */}
                              <div className="max-h-52 overflow-y-auto custom-scrollbar space-y-1.5 pr-1 bg-slate-950 p-2 rounded-xl border border-slate-850">
                                {vid.playlistVideos.map((sub, idx) => {
                                  const subKey = `sub-${vid.id}-${sub.id}`;
                                  const isSubSelected = Boolean(selectedItems[subKey]);
                                  const isNextTarget = nextVideo && nextVideo.id === sub.id;

                                  return (
                                    <div 
                                      key={sub.id || idx}
                                      onClick={() => toggleSelectItem(subKey, {
                                        subject: vid.subject,
                                        title: `${sub.title}`,
                                        channelName: vid.channelName,
                                        videoUrl: sub.videoUrl || vid.videoUrl || '',
                                        duration: sub.durationMinutes
                                      })}
                                      className={`flex items-center justify-between p-2 rounded-xl text-xs cursor-pointer border transition-all ${
                                        isSubSelected
                                          ? 'bg-emerald-950/70 border-emerald-500/60 text-emerald-200 font-bold shadow-sm'
                                          : isNextTarget
                                          ? 'bg-amber-950/40 border-amber-500/40 text-amber-200 font-bold shadow-sm'
                                          : sub.isWatched
                                          ? 'bg-slate-900/40 border-slate-850 text-slate-400 opacity-75'
                                          : 'bg-slate-900/70 border-slate-800 text-slate-200 hover:bg-slate-850'
                                      }`}
                                    >
                                      <div className="flex items-center space-x-2 truncate pr-2">
                                        <span className="text-[10px] font-bold text-slate-500 w-5 shrink-0">{idx + 1}.</span>
                                        <span className="truncate">{sub.title}</span>
                                        {sub.isWatched ? (
                                          <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20 shrink-0">
                                            ✓ İzlendi
                                          </span>
                                        ) : isNextTarget ? (
                                          <span className="text-[9px] font-extrabold text-amber-300 bg-amber-500/20 px-1.5 py-0.2 rounded border border-amber-400/40 shrink-0 animate-pulse">
                                            🎯 Sıradaki
                                          </span>
                                        ) : null}
                                      </div>

                                      <div className="flex items-center space-x-2 shrink-0">
                                        {sub.durationMinutes && sub.durationMinutes > 0 ? (
                                          <span className="text-[10px] font-mono text-slate-400">{formatDuration(sub.durationMinutes)}</span>
                                        ) : null}
                                        <div className={`w-4 h-4 rounded-md flex items-center justify-center transition-all ${
                                          isSubSelected 
                                            ? 'bg-emerald-500 text-slate-950 font-bold shadow' 
                                            : 'border border-slate-700 bg-slate-950'
                                        }`}>
                                          {isSubSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom Actions Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800">
              <div className="flex items-center space-x-2 text-xs">
                <span className="font-bold text-slate-400">
                  Seçilen: <strong className="text-emerald-400">{selectedCount} Video</strong>
                </span>
                {totalSelectedMinutes > 0 && (
                  <span className="text-slate-500">
                    • Toplam Süre: <strong className="text-amber-300 font-mono">{formatDuration(totalSelectedMinutes)}</strong>
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={selectedCount === 0}
                  className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold px-5 py-2.5 rounded-2xl shadow-lg shadow-red-600/30 transition-all border border-red-400/30 disabled:opacity-50 cursor-pointer flex items-center space-x-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Plana Aktar ({selectedCount})</span>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* TAB 2: MANUAL / LINK INPUT */}
        {activeTab === 'manual' && (
          <form onSubmit={handleAddManual} className="space-y-4">
            
            <div className="bg-slate-950 p-4 rounded-2xl border border-red-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-red-400">YouTube Video / Playlist URL (Opsiyonel)</label>
                {videoUrl.trim() && (
                  <button
                    type="button"
                    onClick={handleFetchAutoInfo}
                    disabled={isLoadingInfo}
                    className="text-[11px] font-bold text-amber-300 hover:text-amber-200 bg-amber-500/20 hover:bg-amber-500/30 px-2.5 py-1 rounded-xl border border-amber-500/40 transition-all flex items-center space-x-1 cursor-pointer"
                  >
                    {isLoadingInfo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5 text-amber-400" />}
                    <span>Otomatik Doldur</span>
                  </button>
                )}
              </div>
              <input
                type="url"
                placeholder="https://www.youtube.com/watch?v=..."
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 focus:border-red-500 rounded-xl px-3.5 py-2 text-xs text-white outline-none font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">İlişkili Ders *</label>
              <select
                required
                value={manualSubject}
                onChange={(e) => setManualSubject(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white font-bold outline-none cursor-pointer focus:border-red-500"
              >
                <option value="">Ders Seçiniz...</option>
                <optgroup label="AYT Dersleri">
                  {YKS_SUBJECTS.AYT.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </optgroup>
                <optgroup label="TYT Dersleri">
                  {YKS_SUBJECTS.TYT.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </optgroup>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Video / Konu Başlığı *</label>
                <input
                  type="text"
                  required
                  placeholder="Ör: Türev 1. Video (Türev Tanımı)"
                  value={topicName}
                  onChange={(e) => setTopicName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white outline-none font-medium focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Kanal / Hoca Adı</label>
                <input
                  type="text"
                  placeholder="Ör: Eyüp B. Matematik"
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white outline-none font-medium focus:border-red-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white cursor-pointer"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={isLoadingInfo}
                className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold px-5 py-2.5 rounded-2xl shadow-lg shadow-red-600/30 transition-all border border-red-400/30 cursor-pointer flex items-center space-x-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Görev Olarak Plana Ekle</span>
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};

