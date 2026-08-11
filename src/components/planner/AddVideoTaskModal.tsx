import React, { useState } from 'react';
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
  Sparkles
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

const extractYouTubeVideoId = (url?: string): string | null => {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|playlist\?list=.*[&?]v=))([\w-]{11})/);
  if (match && match[1]) return match[1];
  const matchV = url.match(/[?&]v=([\w-]{11})/);
  if (matchV && matchV[1]) return matchV[1];
  return null;
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
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedItems, setSelectedItems] = useState<Record<string, { subject: string; title: string; channelName: string; videoUrl: string; duration?: number }>>({});

  // Tab 2 (Manual / Link) states
  const [videoUrl, setVideoUrl] = useState('');
  const [topicName, setTopicName] = useState('');
  const [channelName, setChannelName] = useState('');
  const [manualSubject, setManualSubject] = useState('');
  const [isLoadingInfo, setIsLoadingInfo] = useState(false);

  if (!isOpen) return null;

  const subjectsList = ['Tümü', ...Array.from(new Set(youtubeVideos.map(v => v.subject)))];

  const filteredVideos = youtubeVideos.filter(v => {
    const matchesSubject = subjectFilter === 'Tümü' || v.subject === subjectFilter;
    const matchesSearch = !searchQuery.trim() || 
      v.topicName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      v.channelName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.playlistTitle && v.playlistTitle.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSubject && matchesSearch;
  });

  const toggleSelectItem = (key: string, itemData: { subject: string; title: string; channelName: string; videoUrl: string; duration?: number }) => {
    setSelectedItems(prev => {
      const next = { ...prev };
      if (next[key]) {
        delete next[key];
      } else {
        next[key] = itemData;
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
        targetMinutes: item.duration && item.duration > 0 ? item.duration : (targetMinutes || 45),
        isCompleted: false,
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
      targetMinutes: Number(targetMinutes) || 45,
      isCompleted: false,
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

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-slate-900/95 border border-red-500/30 rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto custom-scrollbar relative">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-br from-red-600 to-rose-600 text-white rounded-2xl shadow-lg shadow-red-600/30">
              <Youtube className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white tracking-tight">Plana YouTube Video Görevi Ekle</h3>
              <p className="text-xs text-slate-400 font-medium">Haftalık ders programınıza izleme görevi atayın</p>
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
            <label className="block text-xs font-bold text-slate-300 mb-1">Hedef İzleme Süresi (Dakika)</label>
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
            
            {/* Search & Subject Filter */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Video veya kanal adı ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white outline-none focus:border-red-500 font-medium"
                />
              </div>
              <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-0.5">
                {subjectsList.map(sub => (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => setSubjectFilter(sub)}
                    className={`text-[11px] px-2.5 py-1.5 rounded-lg border font-bold whitespace-nowrap cursor-pointer transition-all ${
                      subjectFilter === sub
                        ? 'bg-red-950 border-red-500 text-red-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            </div>

            {/* Videos List */}
            <div className="max-h-72 overflow-y-auto custom-scrollbar space-y-2.5 pr-1">
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
                  const isPlaylist = Boolean(vid.isPlaylist || (vid.playlistVideos && vid.playlistVideos.length > 1));
                  const firstSubUrl = vid.playlistVideos?.[0]?.videoUrl;
                  const thumb = getYouTubeThumbnail(vid.videoUrl, firstSubUrl);
                  const isMainSelected = Boolean(selectedItems[`main-${vid.id}`]);

                  return (
                    <div 
                      key={vid.id}
                      className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-2 hover:border-slate-700 transition-all"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center space-x-3 min-w-0">
                          {/* Thumbnail */}
                          <div className="w-20 h-12 shrink-0 rounded-xl overflow-hidden bg-slate-900 border border-slate-800 relative">
                            {thumb ? (
                              <img src={thumb} alt={vid.topicName} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-red-950/40 text-red-400">
                                <Youtube className="w-5 h-5" />
                              </div>
                            )}
                          </div>

                          {/* Info */}
                          <div className="min-w-0">
                            <span className="text-[9px] font-black text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20 uppercase tracking-wider">
                              {vid.subject}
                            </span>
                            <h4 className="text-xs font-bold text-white truncate mt-0.5">{vid.topicName}</h4>
                            <p className="text-[10px] text-slate-400 truncate">{vid.channelName}</p>
                          </div>
                        </div>

                        {/* Select Button for Main Video */}
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
                                ? 'bg-emerald-600 text-white shadow-md'
                                : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>{isMainSelected ? 'Seçildi' : 'Seç'}</span>
                          </button>
                        )}
                      </div>

                      {/* Sub-videos Checklist for Playlists */}
                      {isPlaylist && vid.playlistVideos && vid.playlistVideos.length > 0 && (
                        <div className="pt-2 border-t border-slate-900 space-y-1.5 pl-2">
                          <span className="text-[10px] font-bold text-amber-400 flex items-center space-x-1">
                            <ListVideo className="w-3 h-3" />
                            <span>Kamp Videolarından Seç:</span>
                          </span>
                          <div className="max-h-36 overflow-y-auto custom-scrollbar space-y-1 pr-1">
                            {vid.playlistVideos.map((sub, idx) => {
                              const subKey = `sub-${vid.id}-${sub.id}`;
                              const isSubSelected = Boolean(selectedItems[subKey]);

                              return (
                                <div 
                                  key={sub.id}
                                  onClick={() => toggleSelectItem(subKey, {
                                    subject: vid.subject,
                                    title: `${sub.title}`,
                                    channelName: vid.channelName,
                                    videoUrl: sub.videoUrl || vid.videoUrl || '',
                                    duration: sub.durationMinutes
                                  })}
                                  className={`flex items-center justify-between p-2 rounded-xl text-xs cursor-pointer border transition-all ${
                                    isSubSelected
                                      ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300 font-bold'
                                      : 'bg-slate-900/60 border-slate-850 text-slate-300 hover:bg-slate-900'
                                  }`}
                                >
                                  <span className="truncate pr-2">{idx + 1}. {sub.title}</span>
                                  <div className="flex items-center space-x-2 shrink-0">
                                    {sub.durationMinutes > 0 && (
                                      <span className="text-[10px] font-mono text-slate-400">{sub.durationMinutes} dk</span>
                                    )}
                                    <div className={`w-4 h-4 rounded-md flex items-center justify-center ${isSubSelected ? 'bg-emerald-500 text-slate-950' : 'border border-slate-700'}`}>
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
                  );
                })
              )}
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <span className="text-xs font-bold text-slate-400">
                Seçilen: <strong className="text-emerald-400">{selectedCount} Video</strong>
              </span>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white"
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
                className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white"
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
};
