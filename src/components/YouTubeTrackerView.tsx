import React, { useState } from 'react';
import { 
  Youtube, 
  Plus, 
  Trash2, 
  CheckCircle, 
  ExternalLink, 
  Play, 
  Sparkles,
  Video,
  ListVideo,
  Layers,
  Loader2,
  Wand2,
  Edit3,
  Save,
  FileText,
  X,
  Eye,
  EyeOff
} from 'lucide-react';
import { YouTubeVideoItem } from '../types';
import { YKS_SUBJECTS } from '../data/initialData';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

interface YouTubeTrackerViewProps {
  videos: YouTubeVideoItem[];
  onAddVideo: (vid: Omit<YouTubeVideoItem, 'id'>) => void;
  onUpdateVideo: (vid: YouTubeVideoItem) => void;
  onDeleteVideo: (id: string) => void;
}


const RECOMMENDED_CHANNELS = [
  { subject: 'Matematik', channels: ['Eyüp B.', 'Mert Hoca', 'Bıyıklı Matematik', 'Rehber Matematik', 'Tunç Kurt', 'SML Hoca'] },
  { subject: 'Fizik', channels: ['VIP Fizik', 'Özcan Aykın', 'Ertan Sinan Şahin', 'Altuğ Güneş'] },
  { subject: 'Kimya', channels: ['Görkem Şahin', 'Ferrum', 'Kimya Adası', 'Paraksilen Kimya'] },
  { subject: 'Biyoloji', channels: ['Dr. Biyoloji', 'Biosem', 'Selin Hoca', 'Funda Mentals'] },
  { subject: 'Türkçe / Edebiyat', channels: ['Rüştü Hoca', 'Kadir Gümüş', 'Deniz Hoca', 'Aker Kartal'] },
  { subject: 'Tarih', channels: ['Ramazan Yetgin', 'Sadettin Akyayla', 'Selami Yalçın'] },
  { subject: 'Coğrafya', channels: ['Bayram Meral', 'Yavuz Tuna', 'Coğrafyanın Kodları'] }
];

const formatDuration = (totalMinutes: number): string => {
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

export const YouTubeTrackerView: React.FC<YouTubeTrackerViewProps> = ({
  videos,
  onAddVideo,
  onUpdateVideo,
  onDeleteVideo
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [deletingVideo, setDeletingVideo] = useState<{ id: string; title: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'my_list' | 'recommendations'>('my_list');
  const [isLoadingPlaylist, setIsLoadingPlaylist] = useState(false);
  const [isLoadingInfo, setIsLoadingInfo] = useState(false);
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('Tümü');
  const [contentTypeFilter, setContentTypeFilter] = useState<'all' | 'single' | 'playlist'>('all');
  const [hideWatched, setHideWatched] = useState(false);

  // Inline Card Editing State (Topic Name, Channel Name, Notes/Description)
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [editingTopicName, setEditingTopicName] = useState<string>('');
  const [editingChannelName, setEditingChannelName] = useState<string>('');
  const [editingNotesText, setEditingNotesText] = useState<string>('');

  // Inline Note Only Editing State
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [inlineNotesText, setInlineNotesText] = useState<string>('');

  const handleStartEditNotes = (vid: YouTubeVideoItem) => {
    setEditingNotesId(vid.id);
    setInlineNotesText(vid.notes || '');
  };

  const handleSaveInlineNotes = (vid: YouTubeVideoItem) => {
    onUpdateVideo({
      ...vid,
      notes: inlineNotesText.trim()
    });
    setEditingNotesId(null);
  };

  const handleStartEditCard = (vid: YouTubeVideoItem) => {
    setEditingCardId(vid.id);
    setEditingTopicName(vid.topicName || '');
    setEditingChannelName(vid.channelName || '');
    setEditingNotesText(vid.notes || '');
  };

  const handleSaveCard = (vid: YouTubeVideoItem) => {
    onUpdateVideo({
      ...vid,
      topicName: editingTopicName.trim() || vid.topicName,
      channelName: editingChannelName.trim() || vid.channelName,
      notes: editingNotesText.trim()
    });
    setEditingCardId(null);
  };

  const handleCancelEditCard = () => {
    setEditingCardId(null);
  };

  // Form State
  const [subject, setSubject] = useState(YKS_SUBJECTS.AYT[0]);
  const [channelName, setChannelName] = useState('');
  const [topicName, setTopicName] = useState('');
  const [playlistTitle, setPlaylistTitle] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [notes, setNotes] = useState('');

  const resetForm = () => {
    setChannelName('');
    setTopicName('');
    setPlaylistTitle('');
    setVideoUrl('');
    setNotes('');
    setShowAddModal(false);
  };

  const handleFetchAutoInfo = async () => {
    if (!videoUrl.trim()) {
      alert('Lütfen önce geçerli bir YouTube video bağlantısı girin.');
      return;
    }

    setIsLoadingInfo(true);
    try {
      const res = await fetch('/api/youtube/video-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: videoUrl.trim(), subject })
      });
      const data = await res.json();
      if (data.success) {
        if (data.channelName) setChannelName(data.channelName);
        if (data.title) setTopicName(data.title);
        if (data.subject) setSubject(data.subject);
      } else {
        alert('Video bilgileri çekilemedi: ' + (data.error || 'Bilinmeyen hata'));
      }
    } catch (err) {
      alert('Video bilgileri çekilirken sunucu bağlantı hatası oluştu.');
    } finally {
      setIsLoadingInfo(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoadingPlaylist || isLoadingInfo) return;

    const trimmedUrl = videoUrl.trim();
    const isPlaylistUrl = trimmedUrl && (trimmedUrl.includes('list=') || trimmedUrl.includes('playlist?list='));

    if (isPlaylistUrl) {
      setIsLoadingPlaylist(true);
      try {
        const res = await fetch('/api/youtube/playlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            url: trimmedUrl,
            subject,
            channelName: channelName.trim(),
            topicName: topicName.trim()
          })
        });
        const data = await res.json();
        
        if (data.success) {
           onAddVideo({
             subject,
             channelName: data.channelName || channelName.trim() || 'YouTube',
             topicName: topicName.trim() || data.title,
             playlistTitle: data.title,
             videoUrl: trimmedUrl,
             isPlaylist: true,
             playlistVideos: data.videos,
             isWatched: false,
             notes
           });
           resetForm();
        } else {
           alert('Playlist çekilirken hata: ' + (data.error || 'Bilinmeyen hata'));
        }
      } catch (err) {
        alert('Playlist çekilirken bağlantı hatası oluştu.');
      } finally {
        setIsLoadingPlaylist(false);
      }
    } else {
       // Single video entry or manual entry
       let finalChannel = channelName.trim();
       let finalTopic = topicName.trim();
       let finalNotes = notes.trim();
       let finalSubject = subject;

       // If video URL is provided and (channelName or topicName is empty), auto-fetch metadata
       if (trimmedUrl && (!finalChannel || !finalTopic)) {
         setIsLoadingInfo(true);
         try {
           const res = await fetch('/api/youtube/video-info', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ url: trimmedUrl, subject })
           });
           const data = await res.json();
           if (data.success) {
             if (!finalChannel && data.channelName) finalChannel = data.channelName;
             if (!finalTopic && data.title) finalTopic = data.title;
             if (data.subject) finalSubject = data.subject;
           }
         } catch (err) {
           console.error('Auto video info fetch error:', err);
         } finally {
           setIsLoadingInfo(false);
         }
       }

       if (!finalChannel) finalChannel = 'YouTube';
       if (!finalTopic) finalTopic = 'Ders Videosu';

       onAddVideo({
         subject: finalSubject,
         channelName: finalChannel,
         topicName: finalTopic,
         playlistTitle,
         videoUrl: trimmedUrl,
         isWatched: false,
         notes: finalNotes
       });
       resetForm();
    }
  };

  // Helper to determine if an item is a playlist vs single video
  const isPlaylistItem = (v: YouTubeVideoItem) => {
    // A playlist must have more than 1 video to be treated as a playlist.
    // If it has exactly 1 video, it's treated as a single video.
    if (v.playlistVideos && v.playlistVideos.length === 1) {
      return false;
    }
    
    // Check if it's structurally a playlist
    const hasPlaylistStructure = Boolean(
      v.isPlaylist || 
      (v.playlistVideos && v.playlistVideos.length > 1) || 
      (v.playlistTitle && v.playlistTitle.trim().length > 0)
    );

    return hasPlaylistStructure;
  };

  // Counts for filters
  const totalCount = videos.length;
  const singleCount = videos.filter(v => !isPlaylistItem(v)).length;
  const playlistCount = videos.filter(v => isPlaylistItem(v)).length;

  // Subject Filter calculations
  const subjectsList = ['Tümü', ...Array.from(new Set(videos.map((v) => v.subject)))];

  const filteredVideos = videos.filter((v) => {
    const matchesSubject = selectedSubjectFilter === 'Tümü' || v.subject === selectedSubjectFilter;
    const isPlaylist = isPlaylistItem(v);

    const isFullyWatched = isPlaylist && v.playlistVideos && v.playlistVideos.length > 0
      ? v.playlistVideos.every(sub => sub.isWatched)
      : v.isWatched;

    if (hideWatched && isFullyWatched) {
      return false;
    }

    if (contentTypeFilter === 'single') {
      return matchesSubject && !isPlaylist;
    }
    if (contentTypeFilter === 'playlist') {
      return matchesSubject && isPlaylist;
    }
    return matchesSubject;
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center space-x-2">
            <Youtube className="w-5 h-5 text-red-500" />
            <span>YouTube Video Ders & Oynatma Listesi Takibi</span>
          </h1>
          <p className="text-xs text-slate-400 leading-relaxed max-w-3xl mt-1.5">
            Ekleme yaparken YouTube video veya oynatma listesi bağlantısını (URL) girmeniz yeterlidir. Tekil videoların kanal, başlık ve ders bilgileri <strong>linkten otomatik olarak çözümlenir</strong>; oynatma listelerinin içerisindeki tüm videolar ise <strong>otomatik olarak listenize aktarılır</strong>, böylece her bir videoyu tek tek takip edebilirsiniz.
          </p>
        </div>

        <div>
          <button
            onClick={() => setShowAddModal(true)}
            id="add-youtube-video-btn"
            className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-red-600/20 flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Video / Playlist Ekle</span>
          </button>
        </div>
      </div>

      {/* Filter Bar: Single Video vs Playlist & Subject Filter */}
      {videos.length > 0 && (
        <div className="space-y-3 bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
          {/* Content Type Filters (Tek Video vs Playlist) */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-300">İçerik Türü:</span>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setContentTypeFilter('all')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 border ${
                  contentTypeFilter === 'all'
                    ? 'bg-red-600 border-red-500 text-white shadow-md shadow-red-600/20'
                    : 'bg-slate-800/80 border-slate-700/60 text-slate-400 hover:text-white hover:border-slate-600'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Tüm İçerikler</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${contentTypeFilter === 'all' ? 'bg-black/30 text-white' : 'bg-slate-900/80 text-slate-400'}`}>
                  {totalCount}
                </span>
              </button>

              <button
                onClick={() => setContentTypeFilter('single')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 border ${
                  contentTypeFilter === 'single'
                    ? 'bg-red-600 border-red-500 text-white shadow-md shadow-red-600/20'
                    : 'bg-slate-800/80 border-slate-700/60 text-slate-400 hover:text-white hover:border-slate-600'
                }`}
              >
                <Video className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>Tek Videolar</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${contentTypeFilter === 'single' ? 'bg-black/30 text-white' : 'bg-slate-900/80 text-slate-400'}`}>
                  {singleCount}
                </span>
              </button>

              <button
                onClick={() => setContentTypeFilter('playlist')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 border ${
                  contentTypeFilter === 'playlist'
                    ? 'bg-red-600 border-red-500 text-white shadow-md shadow-red-600/20'
                    : 'bg-slate-800/80 border-slate-700/60 text-slate-400 hover:text-white hover:border-slate-600'
                }`}
              >
                <ListVideo className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Oynatma Listeleri (Playlist)</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${contentTypeFilter === 'playlist' ? 'bg-black/30 text-white' : 'bg-slate-900/80 text-slate-400'}`}>
                  {playlistCount}
                </span>
              </button>

              <button
                onClick={() => setHideWatched(!hideWatched)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 border ${
                  hideWatched
                    ? 'bg-emerald-600 border-emerald-500 text-white shadow-md shadow-emerald-600/20'
                    : 'bg-slate-800/80 border-slate-700/60 text-slate-400 hover:text-white hover:border-slate-600'
                }`}
              >
                {hideWatched ? <Eye className="w-3.5 h-3.5 text-white shrink-0" /> : <EyeOff className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                <span>{hideWatched ? 'İzlenenler Gizli' : 'İzlenenleri Gizle'}</span>
              </button>
            </div>
          </div>

          {/* Ders Bazlı Filtreleme Barı */}
          <div className="flex flex-wrap gap-2 items-center pt-1">
            <span className="text-xs font-semibold text-slate-400 mr-2">Ders Filtresi:</span>
            <div className="flex flex-wrap gap-1.5">
              {subjectsList.map((sub) => (
                <button
                  key={sub}
                  onClick={() => setSelectedSubjectFilter(sub)}
                  className={`text-xs px-3 py-1 rounded-lg border transition-all font-medium ${
                    selectedSubjectFilter === sub
                      ? 'bg-slate-800 border-red-500 text-red-400 font-semibold'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Videos List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
        <h2 className="text-sm font-bold text-white flex items-center justify-between">
          <span>İzlenen ve Planlanan Ders Videoları</span>
          <span className="text-xs font-normal text-slate-400">
            {filteredVideos.length} / {videos.length} Gösteriliyor
          </span>
        </h2>

        {filteredVideos.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-slate-800 rounded-xl">
            <p className="text-xs text-slate-400">
              {videos.length === 0
                ? 'Henüz YouTube ders kaydı bulunmuyor.'
                : 'Bu derse ait kayıtlı video/playlist bulunmuyor.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredVideos.map((vid) => {
              const isPlaylist = isPlaylistItem(vid);
              const totalDuration = isPlaylist && vid.playlistVideos ? vid.playlistVideos.reduce((acc, v) => acc + (v.durationMinutes || 0), 0) : (vid.durationMinutes || 0);
              const watchedDuration = isPlaylist && vid.playlistVideos ? vid.playlistVideos.filter(v => v.isWatched).reduce((acc, v) => acc + (v.durationMinutes || 0), 0) : (vid.isWatched ? (vid.durationMinutes || 0) : 0);
              const remainingDuration = totalDuration - watchedDuration;
              
              const isFullyWatched = isPlaylist && vid.playlistVideos ? vid.playlistVideos.length > 0 && vid.playlistVideos.every(v => v.isWatched) : vid.isWatched;

              // Video count calculations (e.g. 5/12)
              const totalVideosCount = isPlaylist && vid.playlistVideos ? vid.playlistVideos.length : 1;
              const watchedVideosCount = isPlaylist && vid.playlistVideos ? vid.playlistVideos.filter(v => v.isWatched).length : (vid.isWatched ? 1 : 0);

              const isEditingThisCard = editingCardId === vid.id;

              return (
              <div
                key={vid.id}
                className={`p-4 rounded-xl border transition-all space-y-3 ${
                  isFullyWatched
                    ? 'bg-slate-950/60 border-slate-800 opacity-80'
                    : 'bg-slate-800/60 border-slate-700/60 hover:border-slate-600'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0 pr-2">
                    <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                      {vid.subject}
                    </span>

                    {isEditingThisCard ? (
                      <div className="mt-2 space-y-2 bg-slate-950 p-3 rounded-xl border border-amber-500/40">
                        <div>
                          <label className="block text-[11px] font-bold text-amber-300 mb-1">Ders & Konu Başlığı</label>
                          <input
                            type="text"
                            value={editingTopicName}
                            onChange={(e) => setEditingTopicName(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 focus:border-amber-400 text-white text-xs rounded-lg px-2.5 py-1.5 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-amber-300 mb-1">Kanal / Hoca Adı</label>
                          <input
                            type="text"
                            value={editingChannelName}
                            onChange={(e) => setEditingChannelName(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 focus:border-amber-400 text-white text-xs rounded-lg px-2.5 py-1.5 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-amber-300 mb-1">Açıklama / Notlar</label>
                          <textarea
                            rows={2}
                            value={editingNotesText}
                            onChange={(e) => setEditingNotesText(e.target.value)}
                            placeholder="Video açıklaması, özel notlar, soru tipleri vb."
                            className="w-full bg-slate-900 border border-slate-700 focus:border-amber-400 text-white text-xs rounded-lg p-2.5 outline-none resize-y"
                          />
                        </div>
                        <div className="flex justify-end space-x-2 pt-1">
                          <button
                            type="button"
                            onClick={handleCancelEditCard}
                            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg"
                          >
                            Vazgeç
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveCard(vid)}
                            className="px-3.5 py-1 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-lg flex items-center space-x-1"
                          >
                            <Save className="w-3.5 h-3.5" />
                            <span>Kaydet</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <h3 className={`text-base font-bold text-white mt-1 ${isFullyWatched && !isPlaylist ? 'line-through text-slate-400' : ''}`}>
                          {vid.videoUrl ? (
                            <a
                              href={vid.videoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:text-red-400 hover:underline inline-flex items-center gap-1.5 transition-colors group cursor-pointer"
                            >
                              <span>{vid.topicName} {isPlaylist ? '(Oynatma Listesi)' : ''}</span>
                              <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-red-400 inline shrink-0" />
                            </a>
                          ) : (
                            <span>{vid.topicName} {isPlaylist ? '(Oynatma Listesi)' : ''}</span>
                          )}
                        </h3>
                        
                        <p className="text-xs text-slate-400 mt-1">
                          Kanal: <span className="font-semibold text-slate-200">{vid.channelName}</span>
                        </p>
 
                        {vid.playlistTitle && (
                          <p className="text-xs text-slate-400 mt-0.5">{vid.playlistTitle}</p>
                        )}
                      </>
                    )}
 
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                      <span className="bg-slate-900 px-2.5 py-1 rounded text-slate-300 text-xs border border-slate-800 font-medium">
                        Videolar: <strong className={watchedVideosCount === totalVideosCount ? 'text-emerald-400' : 'text-slate-200'}>{watchedVideosCount}/{totalVideosCount}</strong>
                      </span>
                      {isPlaylist && (
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-slate-400 font-medium whitespace-nowrap">
                            ({Math.round((watchedVideosCount / (totalVideosCount || 1)) * 100)}% izlendi)
                          </span>
                          <div className="w-20 sm:w-28 bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800 shrink-0">
                            <div 
                              className={`h-full transition-all duration-300 ${
                                watchedVideosCount === totalVideosCount 
                                  ? 'bg-emerald-500' 
                                  : 'bg-gradient-to-r from-red-500 to-amber-500'
                              }`} 
                              style={{ width: `${Math.min(100, Math.max(0, Math.round((watchedVideosCount / (totalVideosCount || 1)) * 100)))}%` }} 
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {totalDuration > 0 && (
                      <p className="text-xs text-slate-400 mt-1.5">
                        Süre: <strong className="text-slate-300">{formatDuration(totalDuration)}</strong> 
                        {watchedDuration > 0 && <span> • İzlenen: <strong className="text-emerald-400">{formatDuration(watchedDuration)}</strong></span>}
                        {remainingDuration > 0 && <span> • Kalan: <strong className="text-amber-400">{formatDuration(remainingDuration)}</strong></span>}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center space-x-1 shrink-0">
                    {!isEditingThisCard && (
                      <button
                        onClick={() => handleStartEditCard(vid)}
                        className="text-slate-400 hover:text-amber-300 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                        title="Başlık, Kanal ve Notu Düzenle"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => setDeletingVideo({ id: vid.id, title: `${vid.channelName} - ${vid.topicName}` })}
                      className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                      title="Sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Display Notes / Description if not currently editing */}
                {!isEditingThisCard && (
                  <div className="mt-2">
                    {editingNotesId === vid.id ? (
                      <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-xl border border-amber-500/50">
                        <input
                          type="text"
                          value={inlineNotesText}
                          onChange={(e) => setInlineNotesText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleSaveInlineNotes(vid);
                            } else if (e.key === 'Escape') {
                              setEditingNotesId(null);
                            }
                          }}
                          className="flex-1 bg-transparent text-xs text-white focus:outline-none px-2 py-1"
                          placeholder="Açıklama veya özel not yazın..."
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveInlineNotes(vid)}
                          className="bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all shrink-0 cursor-pointer"
                        >
                          Kaydet
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingNotesId(null)}
                          className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium px-2.5 py-1.5 rounded-lg transition-all shrink-0 cursor-pointer"
                        >
                          İptal
                        </button>
                      </div>
                    ) : vid.notes ? (
                      <div className="group/note relative bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex items-start justify-between gap-2">
                        <div className="flex items-start space-x-2 min-w-0">
                          <FileText className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                          <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                            {vid.notes}
                          </p>
                        </div>
                        <button
                          onClick={() => handleStartEditNotes(vid)}
                          className="text-slate-500 hover:text-amber-300 p-1 shrink-0 transition-colors flex items-center space-x-1 text-[11px] font-medium cursor-pointer"
                          title="Açıklamayı Düzenle"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Açıklamayı Düzenle</span>
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleStartEditNotes(vid)}
                        className="text-[11px] text-slate-400 hover:text-amber-300 border border-dashed border-slate-800 hover:border-amber-500/40 px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 cursor-pointer"
                      >
                        <Plus className="w-3 h-3 text-amber-400" />
                        <span>Açıklama / Not Ekle</span>
                      </button>
                    )}
                  </div>
                )}

                {isPlaylist && vid.playlistVideos && vid.playlistVideos.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-700 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 pr-1 space-y-1">
                    {vid.playlistVideos.map((subVid, idx) => (
                      <div key={subVid.id} className="flex items-center justify-between p-2 rounded bg-slate-900/50 hover:bg-slate-800/80 transition-colors group">
                        <div className="flex items-center space-x-2 truncate pr-2">
                          <span className="text-[10px] text-slate-500 w-4">{idx + 1}.</span>
                          <a href={subVid.videoUrl} target="_blank" rel="noopener noreferrer" className={`text-xs truncate transition-colors ${subVid.isWatched ? 'text-slate-500 line-through' : 'text-slate-300 group-hover:text-red-400'}`}>
                            {subVid.title}
                          </a>
                        </div>
                        <div className="flex items-center space-x-2 shrink-0">
                          {subVid.durationMinutes > 0 && (
                            <span className="text-[10px] text-slate-500">{formatDuration(subVid.durationMinutes)}</span>
                          )}
                          <button
                            onClick={() => {
                              const newPlaylist = [...vid.playlistVideos];
                              newPlaylist[idx] = { ...subVid, isWatched: !subVid.isWatched };
                              const allWatched = newPlaylist.every(v => v.isWatched);
                              onUpdateVideo({ ...vid, playlistVideos: newPlaylist, isWatched: allWatched });
                            }}
                            className={`p-1 rounded-md transition-colors ${subVid.isWatched ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'}`}
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {!isPlaylist && (
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                    {vid.videoUrl ? (
                      <a
                        href={vid.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-red-400 hover:text-red-300 font-medium flex items-center space-x-1"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>Videoya Git</span>
                      </a>
                    ) : (
                      <span className="text-[10px] text-slate-500">Link eklenmedi</span>
                    )}

                    <button
                      onClick={() => {
                        const newWatched = !vid.isWatched;
                        if (vid.playlistVideos && vid.playlistVideos.length === 1) {
                          const updatedPlaylistVideos = [{ ...vid.playlistVideos[0], isWatched: newWatched }];
                          onUpdateVideo({
                            ...vid,
                            isWatched: newWatched,
                            playlistVideos: updatedPlaylistVideos
                          });
                        } else {
                          onUpdateVideo({ ...vid, isWatched: newWatched });
                        }
                      }}
                      className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        vid.isWatched
                          ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                          : 'bg-slate-700/50 text-slate-300 hover:text-white hover:bg-slate-600/50'
                      }`}
                    >
                      <CheckCircle className={`w-4 h-4 ${vid.isWatched ? 'text-emerald-400' : ''}`} />
                      <span>{vid.isWatched ? 'İzlendi' : 'İzlenecek'}</span>
                    </button>
                  </div>
                )}
              </div>
            );
            })}
          </div>
        )}
      </div>

      {/* Modal: Add Video */}
      {showAddModal && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowAddModal(false); }}
        >
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Yeni YouTube Ders Kaydı Ekle</h3>

            <form onSubmit={handleCreate} className="space-y-4">
              {/* YouTube URL input first for quick auto-fill */}
              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-red-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-red-400">YouTube Video veya Playlist URL</label>
                  {videoUrl.trim() && (
                    <button
                      type="button"
                      onClick={handleFetchAutoInfo}
                      disabled={isLoadingInfo}
                      className="text-[11px] font-bold text-amber-300 hover:text-amber-200 bg-amber-500/20 hover:bg-amber-500/30 px-2.5 py-1 rounded-lg border border-amber-500/40 transition-all flex items-center space-x-1"
                    >
                      {isLoadingInfo ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Çekiliyor...</span>
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-3 h-3 text-amber-400" />
                          <span>Otomatik Doldur</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
                <input
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=... veya playlist URL"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 focus:border-red-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  💡 <strong>Hızlı Ekleme:</strong> Sadece link yapıştırıp "Kaydet" veya "Otomatik Doldur"a basarsanız video başlığı, hoca/kanal adı ve açıklama otomatik çekilir.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Kanal / Hoca Adı (Opsiyonel)</label>
                <input
                  type="text"
                  placeholder="Ör: Eyüp B. Matematik veya VIP Fizik"
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Ders & Konu Başlığı (Opsiyonel)</label>
                <input
                  type="text"
                  placeholder="Ör: Türev Kampı 1. Video (Türev Kavramı)"
                  value={topicName}
                  onChange={(e) => setTopicName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">İlişkili Ders</label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                >
                  {YKS_SUBJECTS.AYT.concat(YKS_SUBJECTS.TYT).map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Oynatma Listesi / Kamp Adı (Opsiyonel)</label>
                <input
                  type="text"
                  placeholder="Ör: 2026 AYT Matematik Derece Kampı"
                  value={playlistTitle}
                  onChange={(e) => setPlaylistTitle(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Notlar / Taktikler (Opsiyonel)</label>
                <input
                  type="text"
                  placeholder="Ör: Özel soru tipleri dakikası 14:20"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isLoadingPlaylist || isLoadingInfo}
                  className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-5 py-2 rounded-xl transition-all shadow-md flex items-center space-x-2 disabled:opacity-50"
                >
                  {(isLoadingPlaylist || isLoadingInfo) && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>
                    {isLoadingPlaylist
                      ? 'Oynatma Listesi Çekiliyor...'
                      : isLoadingInfo
                      ? 'Video Bilgileri Alınıyor...'
                      : 'Kaydet'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2-Step Confirmation Modal for YouTube Video Deletion */}
      <ConfirmDeleteModal
        isOpen={!!deletingVideo}
        title="YouTube Ders Kaydını Sil"
        itemName={deletingVideo?.title}
        onConfirm={() => {
          if (deletingVideo) {
            onDeleteVideo(deletingVideo.id);
            setDeletingVideo(null);
          }
        }}
        onClose={() => setDeletingVideo(null)}
      />

    </div>
  );
};
