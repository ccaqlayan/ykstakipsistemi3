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
  EyeOff,
  Clock,
  CheckSquare,
  Search,
  Award,
  Tv,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  CheckCheck,
  RotateCcw
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

// Helper: Extract YouTube Video ID from any YouTube URL
const extractYouTubeVideoId = (url?: string): string | null => {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|playlist\?list=.*[&?]v=))([\w-]{11})/);
  if (match && match[1]) return match[1];
  const matchV = url.match(/[?&]v=([\w-]{11})/);
  if (matchV && matchV[1]) return matchV[1];
  const matchShort = url.match(/youtu\.be\/([\w-]{11})/);
  if (matchShort && matchShort[1]) return matchShort[1];
  return null;
};

// Helper: Generate YouTube Thumbnail URL
const getYouTubeThumbnail = (videoUrl?: string, firstSubVideoUrl?: string): string | null => {
  const id = extractYouTubeVideoId(videoUrl) || extractYouTubeVideoId(firstSubVideoUrl);
  return id ? `https://i.ytimg.com/vi/${id}/mqdefault.jpg` : null;
};

interface PlaylistSubVideosListProps {
  playlistId: string;
  videos: Array<{
    id: string;
    title: string;
    videoUrl?: string;
    durationMinutes?: number;
    isWatched?: boolean;
  }>;
  onToggleWatch: (idx: number, subVid: any) => void;
}

const PlaylistSubVideosList: React.FC<PlaylistSubVideosListProps> = ({
  playlistId,
  videos,
  onToggleWatch
}) => {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const targetRef = React.useRef<HTMLDivElement | null>(null);

  // Target index: first unwatched video, or last video if all watched
  let targetIdx = videos.findIndex(v => !v.isWatched);
  if (targetIdx === -1 && videos.length > 0) {
    targetIdx = videos.length - 1;
  }

  // Scroll anchor index: show the video right BEFORE targetIdx (previously watched video)
  // so both the previously watched video and next target video are visible together
  const scrollAnchorIdx = targetIdx > 0 ? targetIdx - 1 : 0;

  React.useEffect(() => {
    if (containerRef.current && targetRef.current) {
      const container = containerRef.current;
      const element = targetRef.current;
      const containerTop = container.getBoundingClientRect().top;
      const elementTop = element.getBoundingClientRect().top;
      const relativeTop = elementTop - containerTop + container.scrollTop;

      container.scrollTo({
        top: Math.max(0, relativeTop - 10),
        behavior: 'smooth'
      });
    }
  }, [playlistId, targetIdx]);

  let firstUnwatchedFound = false;

  return (
    <div 
      ref={containerRef}
      className="max-h-60 overflow-y-auto custom-scrollbar pr-1 space-y-1.5 bg-slate-950 p-2.5 rounded-2xl border border-slate-850"
    >
      {videos.map((subVid, idx) => {
        const isNextTarget = !subVid.isWatched && !firstUnwatchedFound;
        if (isNextTarget) firstUnwatchedFound = true;

        const isScrollAnchor = idx === scrollAnchorIdx;

        return (
          <div
            key={subVid.id || idx}
            ref={isScrollAnchor ? targetRef : null}
            className={`flex items-center justify-between p-2 rounded-xl transition-all group border ${
              isNextTarget
                ? 'bg-amber-950/40 border-amber-500/60 text-amber-200 shadow-md ring-1 ring-amber-500/30'
                : subVid.isWatched
                ? 'bg-slate-900/40 border-slate-850 opacity-75'
                : 'bg-slate-900/70 border-slate-800 hover:bg-slate-850'
            }`}
          >
            <div className="flex items-center space-x-2 min-w-0 pr-2">
              <span className={`text-[10px] font-bold w-5 shrink-0 ${isNextTarget ? 'text-amber-400 font-black' : 'text-slate-500'}`}>
                {idx + 1}.
              </span>
              <a
                href={subVid.videoUrl || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className={`text-xs font-semibold truncate transition-colors ${
                  subVid.isWatched 
                    ? 'text-slate-500 line-through' 
                    : isNextTarget 
                    ? 'text-amber-200 font-bold group-hover:text-amber-100' 
                    : 'text-slate-200 group-hover:text-red-400'
                }`}
              >
                {subVid.title}
              </a>

              {isNextTarget && (
                <span className="text-[9px] font-extrabold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-md border border-amber-400/40 flex items-center space-x-1 shrink-0 animate-pulse shadow-sm">
                  <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                  <span>🎯 SIRADAKİ</span>
                </span>
              )}
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              {(subVid.durationMinutes || 0) > 0 && (
                <span className="text-[10px] font-mono text-slate-400">{formatDuration(subVid.durationMinutes || 0)}</span>
              )}
              <button
                type="button"
                onClick={() => onToggleWatch(idx, subVid)}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  subVid.isWatched 
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                    : isNextTarget
                    ? 'bg-amber-500/30 text-amber-300 border border-amber-500/50 hover:bg-amber-500/40 shadow-sm'
                    : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
                title={subVid.isWatched ? 'İzlendi' : 'İzlendi olarak işaretle'}
              >
                <CheckCircle className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
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

  // Expanded Playlist Cards map: videoId -> boolean
  const [expandedPlaylists, setExpandedPlaylists] = useState<Record<string, boolean>>({});

  // Inline Card Editing State
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [editingTopicName, setEditingTopicName] = useState<string>('');
  const [editingChannelName, setEditingChannelName] = useState<string>('');
  const [editingSubject, setEditingSubject] = useState<string>('');
  const [editingNotesText, setEditingNotesText] = useState<string>('');

  // Inline Note Only Editing State
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [inlineNotesText, setInlineNotesText] = useState<string>('');

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
      videos.forEach((v) => {
        if (isPlaylistItem(v)) {
          allOpen[v.id] = true;
        }
      });
      setExpandedPlaylists(allOpen);
    }
  };

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
    setEditingSubject(vid.subject || YKS_SUBJECTS.AYT[0]);
    setEditingNotesText(vid.notes || '');
  };

  const handleSaveCard = (vid: YouTubeVideoItem) => {
    onUpdateVideo({
      ...vid,
      subject: editingSubject || vid.subject,
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
  const [subject, setSubject] = useState('');
  const [channelName, setChannelName] = useState('');
  const [topicName, setTopicName] = useState('');
  const [playlistTitle, setPlaylistTitle] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [notes, setNotes] = useState('');

  const resetForm = () => {
    setSubject('');
    setChannelName('');
    setTopicName('');
    setPlaylistTitle('');
    setVideoUrl('');
    setNotes('');
    setShowAddModal(false);
  };

  const predictSubjectClient = (t: string, c: string, u: string): string => {
    const combined = `${t} ${c} ${u}`.toLowerCase();

    if (combined.includes('paragraf')) return 'Paragraf';
    if (combined.includes('edebiyat') || combined.includes('kadir gümüş') || combined.includes('deniz hoca') || combined.includes('tanzimat') || combined.includes('divan') || combined.includes('servetifünun')) return 'AYT Edebiyat';

    if (combined.includes('geometri') || combined.includes('üçgen') || combined.includes('dörtgen') || combined.includes('çember') || combined.includes('analitik')) {
      return (combined.includes('tyt') || combined.includes('9. sınıf') || combined.includes('10. sınıf')) ? 'TYT Geometri' : 'AYT Geometri';
    }

    if (combined.includes('fizik') || combined.includes('vip fizik') || combined.includes('özcan aykın') || combined.includes('ertan sinan') || combined.includes('altuğ güneş')) {
      return (combined.includes('tyt') || combined.includes('9. sınıf') || combined.includes('10. sınıf') || combined.includes('optik') || combined.includes('basınç')) ? 'TYT Fizik' : 'AYT Fizik';
    }

    if (combined.includes('kimya') || combined.includes('görkem şahin') || combined.includes('ferrum') || combined.includes('kimya adası') || combined.includes('paraksilen')) {
      return (combined.includes('tyt') || combined.includes('9. sınıf') || combined.includes('10. sınıf') || combined.includes('simya') || combined.includes('periyodik')) ? 'TYT Kimya' : 'AYT Kimya';
    }

    if (combined.includes('biyoloji') || combined.includes('dr. biyoloji') || combined.includes('dr biyoloji') || combined.includes('biosem') || combined.includes('selin hoca') || combined.includes('funda mentals')) {
      return (combined.includes('tyt') || combined.includes('9. sınıf') || combined.includes('10. sınıf') || combined.includes('hücre')) ? 'TYT Biyoloji' : 'AYT Biyoloji';
    }

    if (combined.includes('türkçe') || combined.includes('turkce') || combined.includes('rüştü hoca') || combined.includes('aker kartal') || combined.includes('dil bilgisi')) {
      return 'TYT Türkçe';
    }

    if (combined.includes('tarih') || combined.includes('ramazan yetgin') || combined.includes('sadettin akyayla') || combined.includes('selami yalçın')) {
      if (combined.includes('tyt')) return 'TYT Tarih';
      if (combined.includes('tarih-2') || combined.includes('tarih 2')) return 'AYT Tarih-2';
      return 'AYT Tarih-1';
    }

    if (combined.includes('coğrafya') || combined.includes('cografya') || combined.includes('bayram meral') || combined.includes('yavuz tuna') || combined.includes('coğrafyanın kodları')) {
      if (combined.includes('tyt')) return 'TYT Coğrafya';
      if (combined.includes('coğrafya-2') || combined.includes('coğrafya 2')) return 'AYT Coğrafya-2';
      return 'AYT Coğrafya-1';
    }

    if (combined.includes('felsefe')) {
      return combined.includes('ayt') ? 'AYT Felsefe Grubu' : 'TYT Felsefe';
    }

    if (combined.includes('din')) {
      return 'TYT Din Kültürü';
    }

    if (combined.includes('dil') || combined.includes('ingilizce')) {
      return 'AYT Yabancı Dil';
    }

    if (combined.includes('matematik') || combined.includes('mat') || combined.includes('eyüp b') || combined.includes('mert hoca') || combined.includes('bıyıklı mat') || combined.includes('rehber matematik') || combined.includes('sml hoca') || combined.includes('tunç kurt')) {
      return (combined.includes('tyt') || combined.includes('problem') || combined.includes('temel kavram')) ? 'TYT Matematik' : 'AYT Matematik';
    }

    return 'AYT Matematik';
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
        
        const predictedSubject = predictSubjectClient(data.title || '', data.channelName || '', videoUrl.trim() + ' ' + (data.subject || ''));
        setSubject(predictedSubject);
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
    const finalSubject = subject || predictSubjectClient(topicName, channelName, trimmedUrl);

    if (isPlaylistUrl) {
      setIsLoadingPlaylist(true);
      try {
        const res = await fetch('/api/youtube/playlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            url: trimmedUrl,
            subject: finalSubject,
            channelName: channelName.trim(),
            topicName: topicName.trim()
          })
        });
        const data = await res.json();
        
        if (data.success) {
           onAddVideo({
             subject: finalSubject,
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
       let finalChannel = channelName.trim();
       let finalTopic = topicName.trim();
       let finalNotes = notes.trim();

       if (trimmedUrl && (!finalChannel || !finalTopic)) {
         setIsLoadingInfo(true);
         try {
           const res = await fetch('/api/youtube/video-info', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ url: trimmedUrl, subject: finalSubject })
           });
           const data = await res.json();
           if (data.success) {
             if (!finalChannel && data.channelName) finalChannel = data.channelName;
             if (!finalTopic && data.title) finalTopic = data.title;
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

  const isPlaylistItem = (v: YouTubeVideoItem) => {
    if (v.playlistVideos && v.playlistVideos.length === 1) {
      return false;
    }
    return Boolean(
      v.isPlaylist || 
      (v.playlistVideos && v.playlistVideos.length > 1) || 
      (v.playlistTitle && v.playlistTitle.trim().length > 0)
    );
  };

  // Aggregated KPI Stats
  const totalCount = videos.length;
  const singleCount = videos.filter(v => !isPlaylistItem(v)).length;
  const playlistCount = videos.filter(v => isPlaylistItem(v)).length;

  const totalWatchedCount = videos.filter(v => {
    if (isPlaylistItem(v) && v.playlistVideos && v.playlistVideos.length > 0) {
      return v.playlistVideos.every(sub => sub.isWatched);
    }
    return v.isWatched;
  }).length;

  const totalWatchedMinutes = videos.reduce((acc, v) => {
    if (isPlaylistItem(v) && v.playlistVideos) {
      return acc + v.playlistVideos.filter(sub => sub.isWatched).reduce((sum, sub) => sum + (sub.durationMinutes || 0), 0);
    }
    return acc + (v.isWatched ? (v.durationMinutes || 0) : 0);
  }, 0);

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
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* ── 1. STUNNING YOUTUBE HERO BANNER ── */}
      <div className="relative overflow-hidden bg-gradient-to-r from-red-950 via-slate-900 to-red-950 border border-red-500/20 rounded-3xl p-6 shadow-2xl backdrop-blur-xl">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-red-600/20 border border-red-500/30 text-red-300 text-xs font-bold uppercase tracking-wider">
              <Youtube className="w-3.5 h-3.5 text-red-400" />
              <span>Görsel YouTube Ders & Kamp Takip Paneli</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              <Tv className="w-8 h-8 text-red-500 shrink-0" />
              <span>YouTube Video & Playlist Takibi</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Video veya kamp bağlantılarını ekleyin. Kapak fotoğraflarını (thumbnail) canlı görüntüleyin, izlediğiniz dersleri tek tıkla işaretleyin ve izleme sürelerinizi otomatik takip edin.
            </p>
          </div>

          {/* Quick Action & Main Tabs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 w-full lg:w-auto">
            <div className="bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800 flex items-center space-x-1">
              <button
                type="button"
                onClick={() => setActiveTab('my_list')}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
                  activeTab === 'my_list'
                    ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Video className="w-3.5 h-3.5" />
                <span>Video Listem</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('recommendations')}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
                  activeTab === 'recommendations'
                    ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                <span>Derece Kanalları</span>
              </button>
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              id="add-youtube-video-btn"
              className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs sm:text-sm px-5 py-3 rounded-2xl shadow-xl shadow-red-600/25 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center space-x-2 border border-red-400/30 cursor-pointer"
            >
              <Plus className="w-5 h-5" />
              <span>Video / Playlist Ekle</span>
            </button>
          </div>
        </div>

        {/* Top Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/10">
          <div className="bg-slate-950/60 p-3 rounded-2xl border border-white/5 flex items-center space-x-3">
            <div className="p-2 bg-red-600/20 text-red-400 rounded-xl">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Toplam Kayıt</span>
              <span className="text-sm font-extrabold text-white font-mono">{totalCount} Adet</span>
            </div>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-2xl border border-white/5 flex items-center space-x-3">
            <div className="p-2 bg-amber-600/20 text-amber-400 rounded-xl">
              <ListVideo className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Oynatma Listeleri</span>
              <span className="text-sm font-extrabold text-amber-300 font-mono">{playlistCount} Kamp</span>
            </div>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-2xl border border-white/5 flex items-center space-x-3">
            <div className="p-2 bg-emerald-600/20 text-emerald-400 rounded-xl">
              <CheckCircle className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tamamlanan</span>
              <span className="text-sm font-extrabold text-emerald-300 font-mono">{totalWatchedCount} / {totalCount}</span>
            </div>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-2xl border border-white/5 flex items-center space-x-3">
            <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-xl">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">İzleme Süresi</span>
              <span className="text-sm font-extrabold text-indigo-300 font-mono">{formatDuration(totalWatchedMinutes)}</span>
            </div>
          </div>
        </div>
      </div>

      {activeTab === 'my_list' && (
        <>
          {/* ── 2. FILTER & CONTROLS BAR ── */}
          {videos.length > 0 && (
            <div className="space-y-3 bg-slate-900/90 border border-slate-800 p-4 rounded-3xl shadow-xl backdrop-blur-md">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                <span className="text-xs font-extrabold text-slate-300 flex items-center space-x-2">
                  <Search className="w-4 h-4 text-red-400" />
                  <span>Filtrele ve İncele:</span>
                </span>
                
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setContentTypeFilter('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 border cursor-pointer ${
                      contentTypeFilter === 'all'
                        ? 'bg-red-600 border-red-500 text-white shadow-md shadow-red-600/20'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Tümü ({totalCount})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setContentTypeFilter('single')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 border cursor-pointer ${
                      contentTypeFilter === 'single'
                        ? 'bg-red-600 border-red-500 text-white shadow-md shadow-red-600/20'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    <Video className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span>Tek Videolar ({singleCount})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setContentTypeFilter('playlist')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 border cursor-pointer ${
                      contentTypeFilter === 'playlist'
                        ? 'bg-red-600 border-red-500 text-white shadow-md shadow-red-600/20'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    <ListVideo className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Playlists ({playlistCount})</span>
                  </button>

                  {playlistCount > 0 && (
                    <button
                      type="button"
                      onClick={toggleAllPlaylists}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 border cursor-pointer ${
                        isAnyPlaylistExpanded
                          ? 'bg-amber-600/20 border-amber-500/40 text-amber-300 hover:bg-amber-600/30'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-amber-300 hover:border-amber-500/30'
                      }`}
                      title={isAnyPlaylistExpanded ? 'Tüm Kamp Listelerini Kapat' : 'Tüm Kamp Listelerini Aç'}
                    >
                      <ChevronsUpDown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>{isAnyPlaylistExpanded ? 'Tüm Listeleri Kapat' : 'Tüm Listeleri Aç'}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setHideWatched(!hideWatched)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 border cursor-pointer ${
                      hideWatched
                        ? 'bg-emerald-600 border-emerald-500 text-white shadow-md shadow-emerald-600/20'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    {hideWatched ? <Eye className="w-3.5 h-3.5 text-white shrink-0" /> : <EyeOff className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                    <span>{hideWatched ? 'İzlenenler Gizli' : 'İzlenenleri Gizle'}</span>
                  </button>
                </div>
              </div>

              {/* Subject Chips */}
              <div className="flex flex-wrap gap-1.5 items-center">
                <span className="text-[11px] font-bold text-slate-400 mr-1.5 uppercase tracking-wider">Ders:</span>
                {subjectsList.map((sub) => (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => setSelectedSubjectFilter(sub)}
                    className={`text-xs px-3 py-1 rounded-xl border transition-all font-bold cursor-pointer ${
                      selectedSubjectFilter === sub
                        ? 'bg-red-950/80 border-red-500/80 text-red-300 shadow-md shadow-red-950/50'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── 3. VISUAL YOUTUBE CARDS LIST ── */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-extrabold text-white flex items-center space-x-2">
                <Tv className="w-4 h-4 text-red-400" />
                <span>Kayıtlı Ders Videolarınız</span>
              </h2>
              <span className="text-xs font-mono font-bold text-slate-400 bg-slate-900 border border-slate-800 px-2.5 py-0.5 rounded-lg">
                {filteredVideos.length} / {videos.length} Liste
              </span>
            </div>

            {filteredVideos.length === 0 ? (
              <div className="text-center py-12 bg-slate-900/60 border border-dashed border-slate-800 rounded-3xl space-y-3 p-6">
                <div className="w-14 h-14 mx-auto rounded-full bg-red-600/10 border border-red-500/20 flex items-center justify-center text-red-400">
                  <Youtube className="w-7 h-7" />
                </div>
                <h3 className="text-sm font-bold text-white">Video Kaydı Bulunamadı</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  {videos.length === 0
                    ? 'Henüz YouTube ders kaydı eklemediniz. Yukarıdaki "+ Video / Playlist Ekle" butonuna basarak kamp veya tekil ders videolarınızı kaydedebilirsiniz.'
                    : 'Seçili filtrelere uygun video veya playlist bulunmuyor.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredVideos.map((vid) => {
                  const isPlaylist = isPlaylistItem(vid);
                  const firstSubUrl = vid.playlistVideos?.[0]?.videoUrl;
                  const thumbnailUrl = getYouTubeThumbnail(vid.videoUrl, firstSubUrl);

                  const totalDuration = isPlaylist && vid.playlistVideos ? vid.playlistVideos.reduce((acc, v) => acc + (v.durationMinutes || 0), 0) : (vid.durationMinutes || 0);
                  const watchedDuration = isPlaylist && vid.playlistVideos ? vid.playlistVideos.filter(v => v.isWatched).reduce((acc, v) => acc + (v.durationMinutes || 0), 0) : (vid.isWatched ? (vid.durationMinutes || 0) : 0);
                  const remainingDuration = totalDuration - watchedDuration;
                  
                  const isFullyWatched = isPlaylist && vid.playlistVideos ? vid.playlistVideos.length > 0 && vid.playlistVideos.every(v => v.isWatched) : vid.isWatched;

                  const totalVideosCount = isPlaylist && vid.playlistVideos ? vid.playlistVideos.length : 1;
                  const watchedVideosCount = isPlaylist && vid.playlistVideos ? vid.playlistVideos.filter(v => v.isWatched).length : (vid.isWatched ? 1 : 0);
                  const progressPct = Math.round((watchedVideosCount / (totalVideosCount || 1)) * 100);

                  const isEditingThisCard = editingCardId === vid.id;
                  const isExpanded = Boolean(expandedPlaylists[vid.id]); // default collapsed for playlists

                  return (
                    <div
                      key={vid.id}
                      className={`p-4 sm:p-5 rounded-3xl border transition-all space-y-4 shadow-xl backdrop-blur-md ${
                        isFullyWatched
                          ? 'bg-slate-950/70 border-slate-800/80 opacity-85'
                          : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row items-start gap-4">
                        
                        {/* 🎬 16:9 YouTube Thumbnail Card */}
                        <div className="relative w-full sm:w-60 h-36 shrink-0 rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-lg group">
                          {thumbnailUrl ? (
                            <img
                              src={thumbnailUrl}
                              alt={vid.topicName}
                              referrerPolicy="no-referrer"
                              className="relative z-10 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              onError={(e) => {
                                const imgEl = e.currentTarget;
                                if (imgEl.src.includes('mqdefault')) {
                                  imgEl.src = imgEl.src.replace('mqdefault', 'hqdefault');
                                } else if (imgEl.src.includes('i.ytimg.com')) {
                                  imgEl.src = imgEl.src.replace('i.ytimg.com', 'img.youtube.com');
                                } else {
                                  imgEl.style.display = 'none';
                                }
                              }}
                            />
                          ) : null}

                          {/* Fallback Graphic if no image */}
                          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-red-950/80 flex flex-col items-center justify-center p-3 text-center z-0">
                            <Youtube className="w-10 h-10 text-red-500 opacity-60 mb-1" />
                            <span className="text-[10px] font-bold text-slate-400 line-clamp-1">{vid.channelName}</span>
                          </div>

                          {/* 20% Soft Vignette Gradient */}
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/20 via-transparent to-transparent pointer-events-none z-20" />

                          {/* Top-Left Watch Status Glass Badge */}
                          <div className="absolute top-2.5 left-2.5 z-30">
                            {isFullyWatched ? (
                              <span className="bg-emerald-500/90 text-white backdrop-blur-md border border-emerald-400/40 text-[10px] font-black px-2.5 py-1 rounded-xl flex items-center space-x-1 shadow-lg">
                                <CheckCircle className="w-3 h-3 text-white" />
                                <span>Tamamlandı</span>
                              </span>
                            ) : isPlaylist && watchedVideosCount > 0 ? (
                              <span className="bg-amber-500/90 text-slate-950 backdrop-blur-md border border-amber-400/40 text-[10px] font-black px-2.5 py-1 rounded-xl flex items-center space-x-1 shadow-lg">
                                <span>%{progressPct} İzlendi</span>
                              </span>
                            ) : (
                              <span className="bg-red-600/90 text-white backdrop-blur-md border border-red-400/40 text-[10px] font-black px-2.5 py-1 rounded-xl flex items-center space-x-1 shadow-lg">
                                <span>İzlenecek</span>
                              </span>
                            )}
                          </div>

                          {/* Bottom-Right Duration / Video Count Badge */}
                          <div className="absolute bottom-2.5 right-2.5 z-30 bg-slate-950/90 text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded-lg border border-white/10 shadow-md flex items-center space-x-1">
                            {isPlaylist ? (
                              <>
                                <ListVideo className="w-3 h-3 text-amber-400" />
                                <span>{totalVideosCount} Video</span>
                              </>
                            ) : (
                              <>
                                <Clock className="w-3 h-3 text-red-400" />
                                <span>{totalDuration > 0 ? formatDuration(totalDuration) : 'Video'}</span>
                              </>
                            )}
                          </div>

                          {/* Center Play Overlay on Hover */}
                          {vid.videoUrl && (
                            <a
                              href={vid.videoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-40"
                              title="YouTube'da İzle"
                            >
                              <div className="p-3 bg-red-600 hover:bg-red-500 text-white rounded-full shadow-2xl scale-90 group-hover:scale-100 transition-all">
                                <Play className="w-6 h-6 fill-current ml-0.5" />
                              </div>
                            </a>
                          )}
                        </div>

                        {/* 📝 Card Info Section */}
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="text-[10px] font-black text-red-400 bg-red-500/10 px-2.5 py-0.5 rounded-lg border border-red-500/20 uppercase tracking-wider">
                                  {vid.subject}
                                </span>
                                {isPlaylist && (
                                  <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
                                    Oynatma Listesi
                                  </span>
                                )}
                              </div>

                              {!isEditingThisCard && (
                                <h3 className={`text-base font-extrabold text-white mt-1.5 tracking-tight ${isFullyWatched && !isPlaylist ? 'line-through text-slate-400' : ''}`}>
                                  {vid.videoUrl ? (
                                    <a
                                      href={vid.videoUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="hover:text-red-400 hover:underline inline-flex items-center gap-1.5 transition-colors group cursor-pointer"
                                    >
                                      <span>{vid.topicName}</span>
                                      <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-red-400 inline shrink-0" />
                                    </a>
                                  ) : (
                                    <span>{vid.topicName}</span>
                                  )}
                                </h3>
                              )}
                            </div>

                            {/* Action Buttons Top */}
                            <div className="flex items-center space-x-1 shrink-0">
                              {!isEditingThisCard && (
                                <button
                                  type="button"
                                  onClick={() => handleStartEditCard(vid)}
                                  className="text-slate-400 hover:text-amber-300 p-2 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
                                  title="Düzenle"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => setDeletingVideo({ id: vid.id, title: `${vid.channelName} - ${vid.topicName}` })}
                                className="text-slate-400 hover:text-rose-400 p-2 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
                                title="Sil"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Card Edit Mode Form */}
                          {isEditingThisCard ? (
                            <div className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-amber-500/40 my-2">
                              <div>
                                <label className="block text-xs font-bold text-amber-300 mb-1">Ders & Konu Başlığı</label>
                                <input
                                  type="text"
                                  value={editingTopicName}
                                  onChange={(e) => setEditingTopicName(e.target.value)}
                                  className="w-full bg-slate-900 border border-slate-700 focus:border-amber-400 text-white text-xs rounded-xl px-3 py-2 outline-none font-medium"
                                />
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                <div>
                                  <label className="block text-xs font-bold text-amber-300 mb-1">İlişkili Ders</label>
                                  <select
                                    value={editingSubject}
                                    onChange={(e) => setEditingSubject(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 focus:border-amber-400 text-white text-xs rounded-xl px-3 py-2 outline-none font-medium cursor-pointer"
                                  >
                                    {YKS_SUBJECTS.AYT.concat(YKS_SUBJECTS.TYT).map((s) => (
                                      <option key={s} value={s}>{s}</option>
                                    ))}
                                  </select>
                                </div>

                                <div>
                                  <label className="block text-xs font-bold text-amber-300 mb-1">Kanal / Hoca Adı</label>
                                  <input
                                    type="text"
                                    value={editingChannelName}
                                    onChange={(e) => setEditingChannelName(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 focus:border-amber-400 text-white text-xs rounded-xl px-3 py-2 outline-none font-medium"
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="block text-xs font-bold text-amber-300 mb-1">Açıklama / Notlar</label>
                                <textarea
                                  rows={2}
                                  value={editingNotesText}
                                  onChange={(e) => setEditingNotesText(e.target.value)}
                                  placeholder="Video açıklaması, özel notlar, soru tipleri vb."
                                  className="w-full bg-slate-900 border border-slate-700 focus:border-amber-400 text-white text-xs rounded-xl p-3 outline-none resize-y font-medium"
                                />
                              </div>
                              <div className="flex justify-end space-x-2 pt-1">
                                <button
                                  type="button"
                                  onClick={handleCancelEditCard}
                                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
                                >
                                  Vazgeç
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSaveCard(vid)}
                                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl flex items-center space-x-1 cursor-pointer shadow-md"
                                >
                                  <Save className="w-3.5 h-3.5" />
                                  <span>Kaydet</span>
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <p className="text-xs text-slate-300 font-medium flex items-center space-x-1.5">
                                <span className="text-slate-500 font-normal">Kanal / Hoca:</span>
                                <span className="text-white font-bold flex items-center space-x-1">
                                  <span>{vid.channelName}</span>
                                  <CheckCircle className="w-3.5 h-3.5 text-red-500 shrink-0 inline" />
                                </span>
                              </p>

                              {vid.playlistTitle && vid.playlistTitle !== vid.topicName && (
                                <p className="text-xs text-slate-400 italic">Kamp: {vid.playlistTitle}</p>
                              )}
                            </>
                          )}

                          {/* Progress & Duration Details */}
                          <div className="pt-1 space-y-2">
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                              <span className="bg-slate-950 px-3 py-1 rounded-xl text-slate-300 border border-slate-800 font-semibold">
                                Videolar: <strong className={watchedVideosCount === totalVideosCount ? 'text-emerald-400' : 'text-slate-100'}>{watchedVideosCount} / {totalVideosCount}</strong>
                              </span>

                              {totalDuration > 0 && (
                                <span className="bg-slate-950 px-3 py-1 rounded-xl text-slate-300 border border-slate-800 font-medium">
                                  Süre: <strong className="text-amber-300 font-mono">{formatDuration(totalDuration)}</strong>
                                  {watchedDuration > 0 && <span className="text-emerald-400 font-mono"> (İzlenen: {formatDuration(watchedDuration)})</span>}
                                </span>
                              )}
                            </div>

                            {/* Playlist Progress Bar */}
                            {isPlaylist && (
                              <div className="space-y-1 pt-1">
                                <div className="flex items-center justify-between text-[11px] font-bold">
                                  <span className="text-slate-400">Kamp İlerleme Durumu:</span>
                                  <span className={watchedVideosCount === totalVideosCount ? 'text-emerald-400 font-mono' : 'text-amber-400 font-mono'}>
                                    %{progressPct}
                                  </span>
                                </div>
                                <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                                  <div 
                                    className={`h-full transition-all duration-300 ${
                                      watchedVideosCount === totalVideosCount 
                                        ? 'bg-emerald-500' 
                                        : 'bg-gradient-to-r from-red-600 via-rose-500 to-amber-500'
                                    }`} 
                                    style={{ width: `${Math.min(100, Math.max(0, progressPct))}%` }} 
                                  />
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Toggle Watched Status Button */}
                          {!isEditingThisCard && !isPlaylist && (
                            <div className="pt-2 flex items-center justify-between border-t border-slate-800/80">
                              <button
                                type="button"
                                onClick={() => {
                                  onUpdateVideo({ ...vid, isWatched: !vid.isWatched });
                                }}
                                className={`flex items-center space-x-2 px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                                  vid.isWatched
                                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30'
                                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
                                }`}
                              >
                                <CheckCircle className={`w-4 h-4 ${vid.isWatched ? 'text-emerald-400' : 'text-slate-500'}`} />
                                <span>{vid.isWatched ? 'Tamamlandı (İzlendi)' : 'İzlendi Olarak İşaretle'}</span>
                              </button>

                              {vid.videoUrl && (
                                <a
                                  href={vid.videoUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-red-400 hover:text-red-300 font-bold flex items-center space-x-1"
                                >
                                  <Play className="w-3.5 h-3.5 fill-current" />
                                  <span>İzle</span>
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Display Notes / Description block */}
                      {!isEditingThisCard && (
                        <div className="mt-2 pt-2 border-t border-slate-800/80">
                          {editingNotesId === vid.id ? (
                            <div className="flex items-center gap-2 bg-slate-950 p-2.5 rounded-2xl border border-amber-500/50">
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
                                className="flex-1 bg-transparent text-xs text-white focus:outline-none px-2 py-1 font-medium"
                                placeholder="Açıklama veya özel not yazın..."
                                autoFocus
                              />
                              <button
                                type="button"
                                onClick={() => handleSaveInlineNotes(vid)}
                                className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-all shrink-0 cursor-pointer"
                              >
                                Kaydet
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingNotesId(null)}
                                className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium px-3 py-1.5 rounded-xl transition-all shrink-0 cursor-pointer"
                              >
                                İptal
                              </button>
                            </div>
                          ) : vid.notes ? (
                            <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-850 flex items-start justify-between gap-2">
                              <div className="flex items-start space-x-2 min-w-0">
                                <FileText className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                                <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed font-medium">
                                  {vid.notes}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleStartEditNotes(vid)}
                                className="text-slate-400 hover:text-amber-300 p-1 shrink-0 transition-colors flex items-center space-x-1 text-[11px] font-bold cursor-pointer"
                                title="Açıklamayı Düzenle"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Düzenle</span>
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleStartEditNotes(vid)}
                              className="text-[11px] text-slate-400 hover:text-amber-300 border border-dashed border-slate-800 hover:border-amber-500/40 px-3 py-1.5 rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer font-semibold"
                            >
                              <Plus className="w-3.5 h-3.5 text-amber-400" />
                              <span>Açıklama / Not Ekle</span>
                            </button>
                          )}
                        </div>
                      )}

                      {/* 📋 Playlist Sub-Videos Nested List (Collapsible) */}
                      {isPlaylist && vid.playlistVideos && vid.playlistVideos.length > 0 && (() => {
                        const nextVideo = vid.playlistVideos.find(v => !v.isWatched);
                        const nextVideoIndex = nextVideo ? vid.playlistVideos.indexOf(nextVideo) + 1 : null;

                        return (
                          <div className="mt-3 pt-3 border-t border-slate-800/80">
                            {/* Collapsible Accordion Header / Trigger Bar */}
                            <div 
                              onClick={() => toggleExpandPlaylist(vid.id)}
                              className={`w-full p-3 sm:p-3.5 rounded-2xl border transition-all cursor-pointer select-none group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                                isExpanded
                                  ? 'bg-slate-950/90 border-amber-500/40 shadow-md ring-1 ring-amber-500/20'
                                  : 'bg-slate-950/60 hover:bg-slate-950 border-slate-800/90 hover:border-amber-500/40 shadow-inner'
                              }`}
                            >
                              <div className="flex items-center space-x-3 min-w-0">
                                <div className={`p-2 rounded-xl transition-all shrink-0 ${
                                  isExpanded
                                    ? 'bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/30'
                                    : 'bg-slate-900 text-slate-400 group-hover:text-amber-400 group-hover:bg-amber-500/10'
                                }`}>
                                  <ListVideo className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-xs font-bold text-white group-hover:text-amber-200 transition-colors">
                                      Kamp İçeriği ({vid.playlistVideos.length} Video)
                                    </span>
                                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${
                                      watchedVideosCount === totalVideosCount
                                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                        : 'bg-slate-900 border-slate-800 text-slate-400'
                                    }`}>
                                      {watchedVideosCount}/{totalVideosCount} İzlendi
                                    </span>
                                  </div>

                                  {/* If collapsed and there is a next unwatched video, show context preview */}
                                  {!isExpanded && nextVideo && (
                                    <div className="flex items-center space-x-1.5 mt-1 text-[11px] text-amber-300/90 truncate">
                                      <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
                                      <span className="font-semibold text-slate-400">Sıradaki:</span>
                                      <span className="font-medium text-slate-200 truncate">{nextVideoIndex}. {nextVideo.title}</span>
                                    </div>
                                  )}

                                  {!isExpanded && !nextVideo && totalVideosCount > 0 && (
                                    <div className="flex items-center space-x-1.5 mt-1 text-[11px] text-emerald-400 font-semibold">
                                      <CheckCircle className="w-3 h-3 text-emerald-400 shrink-0" />
                                      <span>Tüm kamp dersleri başarıyla tamamlandı! ✨</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                                <span className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all flex items-center space-x-1.5 ${
                                  isExpanded
                                    ? 'bg-amber-600 text-white border-amber-500 shadow-md shadow-amber-600/30'
                                    : 'bg-slate-900 group-hover:bg-amber-500/20 text-slate-300 group-hover:text-amber-300 border-slate-800 group-hover:border-amber-500/40'
                                }`}>
                                  <span>{isExpanded ? 'Listeyi Gizle' : 'Videoları İncele'}</span>
                                  {isExpanded ? (
                                    <ChevronUp className="w-3.5 h-3.5 transition-transform" />
                                  ) : (
                                    <ChevronDown className="w-3.5 h-3.5 transition-transform group-hover:translate-y-0.5" />
                                  )}
                                </span>
                              </div>
                            </div>

                            {/* Expanded Playlist Drawer */}
                            {isExpanded && (
                              <div className="mt-2 space-y-2 animate-fade-in">
                                {/* Quick drawer toolbar */}
                                <div className="flex flex-wrap items-center justify-between gap-2 px-1 py-1 text-xs">
                                  <div className="flex items-center space-x-2 text-slate-400 text-[11px]">
                                    <span>Kalan: <strong className="text-amber-300 font-bold">{totalVideosCount - watchedVideosCount} Video</strong></span>
                                    {remainingDuration > 0 && (
                                      <span>• Kalan Süre: <strong className="text-slate-200 font-mono">{formatDuration(remainingDuration)}</strong></span>
                                    )}
                                  </div>

                                  <div className="flex items-center space-x-1.5">
                                    {watchedVideosCount < totalVideosCount && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const newPlaylist = vid.playlistVideos!.map(v => ({ ...v, isWatched: true }));
                                          onUpdateVideo({ ...vid, playlistVideos: newPlaylist, isWatched: true });
                                        }}
                                        className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-emerald-950/60 text-slate-400 hover:text-emerald-300 border border-slate-800 hover:border-emerald-500/40 text-[10px] font-bold transition-all flex items-center space-x-1 cursor-pointer"
                                        title="Listedeki tüm videoları izlendi olarak işaretle"
                                      >
                                        <CheckCheck className="w-3 h-3 text-emerald-400" />
                                        <span>Tümünü İzlendi Yap</span>
                                      </button>
                                    )}

                                    {watchedVideosCount > 0 && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const newPlaylist = vid.playlistVideos!.map(v => ({ ...v, isWatched: false }));
                                          onUpdateVideo({ ...vid, playlistVideos: newPlaylist, isWatched: false });
                                        }}
                                        className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800 text-[10px] font-bold transition-all flex items-center space-x-1 cursor-pointer"
                                        title="Listedeki tüm izlendi işaretlerini sıfırla"
                                      >
                                        <RotateCcw className="w-3 h-3 text-slate-400" />
                                        <span>Sıfırla</span>
                                      </button>
                                    )}
                                  </div>
                                </div>

                                <PlaylistSubVideosList
                                  playlistId={vid.id}
                                  videos={vid.playlistVideos}
                                  onToggleWatch={(idx, subVid) => {
                                    const newPlaylist = [...vid.playlistVideos!];
                                    newPlaylist[idx] = { ...subVid, isWatched: !subVid.isWatched };
                                    const allWatched = newPlaylist.every(v => v.isWatched);
                                    onUpdateVideo({ ...vid, playlistVideos: newPlaylist, isWatched: allWatched });
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* ── 4. DERECE ÖĞRENCİ KANAL TAVSİYELERİ TAB ── */}
      {activeTab === 'recommendations' && (
        <div className="space-y-5 bg-slate-900/90 border border-slate-800 p-6 rounded-3xl shadow-xl backdrop-blur-md">
          <div className="space-y-1">
            <h2 className="text-base font-extrabold text-white flex items-center space-x-2">
              <Award className="w-5 h-5 text-amber-400" />
              <span>YKS Derece Öğrencileri & Koçluk YouTube Kanal Önerileri</span>
            </h2>
            <p className="text-xs text-slate-400">
              YKS hazırlığında binlerce derece öğrencisi tarafından en çok önerilen kaliteli ve ücretsiz YouTube kanalları.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {RECOMMENDED_CHANNELS.map((item, idx) => (
              <div key={idx} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                  <span className="text-xs font-black text-red-400 uppercase tracking-wider">{item.subject}</span>
                  <span className="text-[10px] font-bold text-slate-500">{item.channels.length} Kanal</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {item.channels.map((chan, cIdx) => (
                    <a
                      key={cIdx}
                      href={`https://www.youtube.com/results?search_query=${encodeURIComponent(chan + ' ' + item.subject)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-slate-900 hover:bg-red-950/60 text-slate-200 hover:text-red-300 border border-slate-800 hover:border-red-500/40 px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer group"
                    >
                      <Youtube className="w-3.5 h-3.5 text-red-500 group-hover:scale-110 transition-transform" />
                      <span>{chan}</span>
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 5. MODAL: ADD YOUTUBE VIDEO OR PLAYLIST ── */}
      {showAddModal && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-fade-in"
          onClick={(e) => { if (e.target === e.currentTarget) setShowAddModal(false); }}
        >
          <div className="bg-slate-900/95 border border-red-500/30 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto custom-scrollbar relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-br from-red-600 to-rose-600 text-white rounded-2xl shadow-lg shadow-red-600/30">
                  <Youtube className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white tracking-tight">Yeni YouTube Ders Kaydı Ekle</h3>
                  <p className="text-xs text-slate-400 font-medium">Video veya oynatma listesi URL'sini yapıştırın</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white p-2 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              
              {/* YouTube URL Input & Auto Fetch */}
              <div className="bg-slate-950/80 p-4 rounded-2xl border border-red-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-red-400">YouTube Video / Playlist URL *</label>
                  {videoUrl.trim() && (
                    <button
                      type="button"
                      onClick={handleFetchAutoInfo}
                      disabled={isLoadingInfo}
                      className="text-[11px] font-bold text-amber-300 hover:text-amber-200 bg-amber-500/20 hover:bg-amber-500/30 px-2.5 py-1 rounded-xl border border-amber-500/40 transition-all flex items-center space-x-1 cursor-pointer"
                    >
                      {isLoadingInfo ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Çekiliyor...</span>
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-3.5 h-3.5 text-amber-400" />
                          <span>Otomatik Doldur</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
                <input
                  type="url"
                  required
                  placeholder="https://www.youtube.com/watch?v=... veya playlist URL"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 focus:border-red-500 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none font-medium shadow-inner"
                />
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  💡 <strong>Otomatik Çözümleme:</strong> Linki yapıştırdığınızda video başlığı, kanal adı ve oynatma listesindeki tüm videolar otomatik çekilir.
                </p>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>İlişkili Ders</span>
                  <span className="text-[10px] text-amber-400 font-normal">✨ Otomatik Doldur ile belirlenebilir</span>
                </label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-red-500 font-bold cursor-pointer shadow-inner"
                >
                  <option value="">Ders Seçiniz (Veya Otomatik Doldur'a Basın)...</option>
                  <optgroup label="AYT Dersleri">
                    {YKS_SUBJECTS.AYT.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </optgroup>
                  <optgroup label="TYT Dersleri">
                    {YKS_SUBJECTS.TYT.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* Optional Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Kanal / Hoca Adı</label>
                  <input
                    type="text"
                    placeholder="Ör: Eyüp B. Matematik veya VIP Fizik"
                    value={channelName}
                    onChange={(e) => setChannelName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500 font-medium shadow-inner"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Ders & Konu Başlığı</label>
                  <input
                    type="text"
                    placeholder="Ör: Türev Kampı 1. Video"
                    value={topicName}
                    onChange={(e) => setTopicName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500 font-medium shadow-inner"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Oynatma Listesi / Kamp Adı (Opsiyonel)</label>
                <input
                  type="text"
                  placeholder="Ör: 2026 AYT Matematik Derece Kampı"
                  value={playlistTitle}
                  onChange={(e) => setPlaylistTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500 font-medium shadow-inner"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Notlar / Taktikler (Opsiyonel)</label>
                <input
                  type="text"
                  placeholder="Ör: Soru tipi dakikası 14:20"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500 font-medium shadow-inner"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isLoadingPlaylist || isLoadingInfo}
                  className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold px-6 py-2.5 rounded-2xl transition-all shadow-lg shadow-red-600/30 cursor-pointer border border-red-400/30 disabled:opacity-50 flex items-center space-x-2"
                >
                  {(isLoadingPlaylist || isLoadingInfo) && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>
                    {isLoadingPlaylist
                      ? 'Playlist Aktarılıyor...'
                      : isLoadingInfo
                      ? 'Bilgiler Çekiliyor...'
                      : 'Kaydet & Ekle'}
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
