import React, { useState, useMemo } from 'react';
import { 
  Sparkles, 
  Youtube, 
  Plus, 
  Check, 
  ExternalLink, 
  Award, 
  Heart, 
  TrendingUp, 
  Trash2, 
  BookOpen, 
  Bookmark, 
  Pencil, 
  Upload, 
  Loader2, 
  Globe,
  Search,
  LayoutGrid,
  List,
  Star,
  Flame,
  X,
  Filter,
  SlidersHorizontal,
  Layers,
  ArrowUpDown,
  BookMarked
} from 'lucide-react';
import { YouTubeVideoItem, ResourceItem, UserAccount, RecommendedChannel, RecommendedBook } from '../types';
import { RECOMMENDED_BOOKS } from '../data/books';
import { saveRecommendationToFirestore, deleteRecommendationFromFirestore } from '../services/firebase';
import { uploadChannelAvatar } from '../services/storageUpload';
import { compressImageFile } from '../utils/imageCompressor';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

interface RecommendationsViewProps {
  onAddVideo: (vid: Omit<YouTubeVideoItem, 'id'>) => void;
  onAddResource: (res: Omit<ResourceItem, 'id'>) => void;
  onDeleteVideo?: (id: string) => void;
  onDeleteResource?: (id: string) => void;
  trackedVideos: YouTubeVideoItem[];
  trackedResources: ResourceItem[];
  favoriteBooks?: string[];
  onToggleFavoriteBook?: (bookKey: string) => void;
  currentUser?: UserAccount | null;
  customRecommendations?: {
    channels: RecommendedChannel[];
    books: RecommendedBook[];
  };
  onAddAuditLog?: (
    description: string,
    category: any,
    actionType: string,
    undoFn?: () => void,
    targetUserId?: string,
    targetUserName?: string,
    metadata?: any
  ) => void;
}

const RECOMMENDED_CHANNELS: RecommendedChannel[] = [
  // Matematik
  { subject: 'Matematik', name: 'Sml Hoca Matematik', subscribersText: '462 B', subscribersCount: 462000, url: 'https://www.youtube.com/@smlhocamatematik' },
  { subject: 'Matematik', name: 'Eyüp B. Matematik Geometri', subscribersText: '925 B', subscribersCount: 925000, url: 'https://www.youtube.com/@eyupb' },
  { subject: 'Matematik', name: 'Bıyıklı Matematik', subscribersText: '1.1 Mn', subscribersCount: 1100000, url: 'https://www.youtube.com/@biyiklimatematik' },
  { subject: 'Matematik', name: 'Mert Hoca', subscribersText: '1.62 Mn', subscribersCount: 1620000, url: 'https://www.youtube.com/@MertHoca' },
  { subject: 'Matematik', name: 'Matematiğin Güler Yüzü', subscribersText: '1.35 Mn', subscribersCount: 1350000, url: 'https://www.youtube.com/@matematiginguleryuzu' },
  { subject: 'Matematik', name: 'Rehber Matematik', subscribersText: '2.63 Mn', subscribersCount: 2630000, url: 'https://www.youtube.com/@RehberMatematik' },
  { subject: 'Matematik', name: 'İlyas Güneş', subscribersText: '452 B', subscribersCount: 452000, url: 'https://www.youtube.com/@ilyasgunes' },
  { subject: 'Matematik', name: 'Atölye Matematik', subscribersText: '125 B', subscribersCount: 125000, url: 'https://www.youtube.com/@atolyematematik' },
  { subject: 'Matematik', name: 'Şenol Hoca', subscribersText: '2.05 Mn', subscribersCount: 2050000, url: 'https://www.youtube.com/@senolhoca' },
  { subject: 'Matematik', name: 'Tunç Kurt', subscribersText: '1.02 Mn', subscribersCount: 1020000, url: 'https://www.youtube.com/@TuncKurtMatematik' },
  { subject: 'Matematik', name: 'Soner Akıncı MATEMATİK', subscribersText: '210 B', subscribersCount: 210000, url: 'https://www.youtube.com/@sonerakinci' },
  { subject: 'Matematik', name: 'Matemetri', subscribersText: '18.5 B', subscribersCount: 18500, url: 'https://www.youtube.com/@matemetri' },
  { subject: 'Matematik', name: 'Matematiğin Kader Hocası', subscribersText: '245 B', subscribersCount: 245000, url: 'https://www.youtube.com/@matematiginkaderhocasi' },
  { subject: 'Matematik', name: 'Matematiğin Fatihi', subscribersText: '212 B', subscribersCount: 212000, url: 'https://www.youtube.com/@matematiginfatihi' },
  { subject: 'Matematik', name: 'Anıl Hoca İle Matematik', subscribersText: '230 B', subscribersCount: 230000, url: 'https://www.youtube.com/@anilhocailematematik' },
  { subject: 'Matematik', name: 'Şükrü Akkoyun Matematik', subscribersText: '248 B', subscribersCount: 248000, url: 'https://www.youtube.com/@SukruAkkoyunMatematik' },
  { subject: 'Matematik', name: 'Mesut Hocam', subscribersText: '24.5 B', subscribersCount: 24500, url: 'https://www.youtube.com/@mesuthocam' },
  { subject: 'Matematik', name: 'Hocalara Geldik', subscribersText: '1.48 Mn', subscribersCount: 1480000, url: 'https://www.youtube.com/@HocalaraGeldik' },

  // Geometri
  { subject: 'Geometri', name: 'Kenan Kara', subscribersText: '810 B', subscribersCount: 810000, url: 'https://www.youtube.com/@kenankarailegeometri' },
  { subject: 'Geometri', name: 'Eyüp B. Matematik Geometri', subscribersText: '925 B', subscribersCount: 925000, url: 'https://www.youtube.com/@eyupb' },
  { subject: 'Geometri', name: 'Nurtaç Hoca', subscribersText: '340 B', subscribersCount: 340000, url: 'https://www.youtube.com/@nurtachoca' },
  { subject: 'Geometri', name: 'Merkeze Teğet', subscribersText: '420 B', subscribersCount: 420000, url: 'https://www.youtube.com/@MerkezeTeget' },
  { subject: 'Geometri', name: 'Engin Hoca', subscribersText: '12.5 B', subscribersCount: 12500, url: 'https://www.youtube.com/@EnginHoca' },
  { subject: 'Geometri', name: 'Şenol Hoca', subscribersText: '2.05 Mn', subscribersCount: 2050000, url: 'https://www.youtube.com/@senolhoca' },
  { subject: 'Geometri', name: 'Rehber Matematik', subscribersText: '2.63 Mn', subscribersCount: 2630000, url: 'https://www.youtube.com/@RehberMatematik' },
  { subject: 'Geometri', name: 'Hocalara Geldik', subscribersText: '1.48 Mn', subscribersCount: 1480000, url: 'https://www.youtube.com/@HocalaraGeldik' },

  // Türkçe
  { subject: 'Türkçe', name: 'Rüştü Hoca İle Türkçe', subscribersText: '2.45 Mn', subscribersCount: 2450000, url: 'https://www.youtube.com/@RustuHoca' },
  { subject: 'Türkçe', name: 'Kadir Gümüş', subscribersText: '1.25 Mn', subscribersCount: 1250000, url: 'https://www.youtube.com/@KadirGumus' },
  { subject: 'Türkçe', name: 'Türkçenin Matematiği', subscribersText: '780 B', subscribersCount: 780000, url: 'https://www.youtube.com/@TurkceninMatematigi' },
  { subject: 'Türkçe', name: 'Nazlı Hoca\'m', subscribersText: '145 B', subscribersCount: 145000, url: 'https://www.youtube.com/@NazliHocam' },
  { subject: 'Türkçe', name: 'Onur Soğuk', subscribersText: '15.4 B', subscribersCount: 15400, url: 'https://www.youtube.com/@onursoguk' },

  // Fizik
  { subject: 'Fizik', name: 'VİP Fizik', subscribersText: '1.35 Mn', subscribersCount: 1350000, url: 'https://www.youtube.com/@vipfizik' },
  { subject: 'Fizik', name: 'Umut Öncül Akademi', subscribersText: '460 B', subscribersCount: 460000, url: 'https://www.youtube.com/@umutoncul' },
  { subject: 'Fizik', name: 'Tayfun Hocam', subscribersText: '18.2 B', subscribersCount: 18200, url: 'https://www.youtube.com/@TayfunHocam' },
  { subject: 'Fizik', name: 'Özcan Aykın', subscribersText: '780 B', subscribersCount: 780000, url: 'https://www.youtube.com/@ozcanaykin' },
  { subject: 'Fizik', name: 'Altuğ Güneş', subscribersText: '610 B', subscribersCount: 610000, url: 'https://www.youtube.com/@altuggunes' },
  { subject: 'Fizik', name: 'Fizikle Barış', subscribersText: '680 B', subscribersCount: 680000, url: 'https://www.youtube.com/@fiziklebaris' },
  { subject: 'Fizik', name: 'Entropi [Dursun İşler]', subscribersText: '52 B', subscribersCount: 52000, url: 'https://www.youtube.com/@EntropiFizik' },
  { subject: 'Fizik', name: 'Fizikfinito', subscribersText: '890 B', subscribersCount: 890000, url: 'https://www.youtube.com/@fizikfinito' },
  { subject: 'Fizik', name: 'Ertan Sinan Şahin', subscribersText: '710 B', subscribersCount: 710000, url: 'https://www.youtube.com/@ertansinansahin' },
  { subject: 'Fizik', name: 'Fiziklen', subscribersText: '38.5 B', subscribersCount: 38500, url: 'https://www.youtube.com/@fiziklen' },

  // Kimya
  { subject: 'Kimya', name: 'Kimya Adası', subscribersText: '740 B', subscribersCount: 740000, url: 'https://www.youtube.com/@kimyaadasi' },
  { subject: 'Kimya', name: 'Bizim Hocalar', subscribersText: '240 B', subscribersCount: 240000, url: 'https://www.youtube.com/@BizimHocalar' },
  { subject: 'Kimya', name: 'Görkem Şahin', subscribersText: '250 B', subscribersCount: 250000, url: 'https://www.youtube.com/@gorkemsahin' },
  { subject: 'Kimya', name: 'Kimya Özel', subscribersText: '210 B', subscribersCount: 210000, url: 'https://www.youtube.com/@KimyaOzel' },
  { subject: 'Kimya', name: 'Kimya Köyü', subscribersText: '35.4 B', subscribersCount: 35400, url: 'https://www.youtube.com/@kimyakoyu' },
  { subject: 'Kimya', name: 'Kimya Hocam', subscribersText: '112 B', subscribersCount: 112000, url: 'https://www.youtube.com/@kimyahocam' },
  { subject: 'Kimya', name: 'Bizim Kimyamız', subscribersText: '52.4 B', subscribersCount: 52400, url: 'https://www.youtube.com/@bizimkimyamiz' },
  { subject: 'Kimya', name: 'e-Kimya', subscribersText: '78.5 B', subscribersCount: 78500, url: 'https://www.youtube.com/@e-kimya' },
  { subject: 'Kimya', name: 'Levent Özdede ile Kimya', subscribersText: '142 B', subscribersCount: 142000, url: 'https://www.youtube.com/@LeventOzdedeileKimya' },
  { subject: 'Kimya', name: 'Paraksilen Kimya', subscribersText: '165 B', subscribersCount: 165000, url: 'https://www.youtube.com/@paraksilenkimya' },

  // Biyoloji
  { subject: 'Biyoloji', name: 'Fundamentals', subscribersText: '510 B', subscribersCount: 510000, url: 'https://www.youtube.com/@FundamentalsBiyoloji' },
  { subject: 'Biyoloji', name: 'Barış Hoca Biyoloji', subscribersText: '940 B', subscribersCount: 940000, url: 'https://www.youtube.com/@barishocabiyoloji' },
  { subject: 'Biyoloji', name: 'Dilek Kuvvet', subscribersText: '18.5 B', subscribersCount: 18500, url: 'https://www.youtube.com/@dilekkuvvet' },
  { subject: 'Biyoloji', name: 'Betül Biyoloji', subscribersText: '530 B', subscribersCount: 530000, url: 'https://www.youtube.com/@betulbiyoloji' },
  { subject: 'Biyoloji', name: 'Biosem', subscribersText: '1.15 Mn', subscribersCount: 1150000, url: 'https://www.youtube.com/@biosem' },
  { subject: 'Biyoloji', name: 'Damla Hoca Biyoloji', subscribersText: '54.2 B', subscribersCount: 54200, url: 'https://www.youtube.com/@damlahocabiyoloji' },
  { subject: 'Biyoloji', name: 'Hacettepeli Hoca', subscribersText: '72.5 B', subscribersCount: 72500, url: 'https://www.youtube.com/@hacettepelihoca' },
  { subject: 'Biyoloji', name: 'Selin Hoca Biyoloji', subscribersText: '740 B', subscribersCount: 740000, url: 'https://www.youtube.com/@selinhoca' },
  { subject: 'Biyoloji', name: 'Senin Biyolojin', subscribersText: '380 B', subscribersCount: 380000, url: 'https://www.youtube.com/@SeninBiyolojin' },
  { subject: 'Biyoloji', name: 'Bekir Avşar', subscribersText: '580 B', subscribersCount: 580000, url: 'https://www.youtube.com/@BekirAvsar' },
  { subject: 'Biyoloji', name: 'Seda Hoca Biyoloji', subscribersText: '68.2 B', subscribersCount: 68200, url: 'https://www.youtube.com/@sedahocabiyoloji' },

  // Tarih
  { subject: 'Tarih', name: 'Benim Hocam (Ramazan Yetgin)', subscribersText: '4.12 Mn', subscribersCount: 4120000, url: 'https://www.youtube.com/@BenimHocam' },
  { subject: 'Tarih', name: 'Sadettin Akyayla', subscribersText: '210 B', subscribersCount: 210000, url: 'https://www.youtube.com/@sadettinakyayla' },
  { subject: 'Tarih', name: 'Sosyal Hocam', subscribersText: '240 B', subscribersCount: 240000, url: 'https://www.youtube.com/@sosyalhocam' },
  { subject: 'Tarih', name: 'Onur Gece', subscribersText: '86.5 B', subscribersCount: 86500, url: 'https://www.youtube.com/@onurgece' },

  // Coğrafya
  { subject: 'Coğrafya', name: 'Coğrafya Cepte', subscribersText: '165 B', subscribersCount: 165000, url: 'https://www.youtube.com/@cografyacepte' },
  { subject: 'Coğrafya', name: 'Benim Hocam (Bayram Meral)', subscribersText: '4.12 Mn', subscribersCount: 4120000, url: 'https://www.youtube.com/@BenimHocam' },
  { subject: 'Coğrafya', name: 'Coğrafyanın kodları', subscribersText: '1.28 Mn', subscribersCount: 1280000, url: 'https://www.youtube.com/@CografyaninKodlari' },
  { subject: 'Coğrafya', name: 'Yavuz Tuna', subscribersText: '450 B', subscribersCount: 450000, url: 'https://www.youtube.com/@YavuzTuna' },

  // Felsefe
  { subject: 'Felsefe', name: 'Can Köni', subscribersText: '98.4 B', subscribersCount: 98400, url: 'https://www.youtube.com/@CanKoni' },

  // Dil (YDT)
  { subject: 'Dil', name: 'Akın Dil Eğitim', subscribersText: '105 B', subscribersCount: 105000, url: 'https://www.youtube.com/@AkinDilEgitim' },
  { subject: 'Dil', name: 'Çağdaş\'ın İngilizce Dil Okulu', subscribersText: '102 B', subscribersCount: 102000, url: 'https://www.youtube.com/@CagdasinIngilizceDilOkulu' },
  { subject: 'Dil', name: 'MODADİL', subscribersText: '55.1 B', subscribersCount: 55100, url: 'https://www.youtube.com/@MODADIL' },
  { subject: 'Dil', name: 'Berk Hoca', subscribersText: '44.8 B', subscribersCount: 44800, url: 'https://www.youtube.com/@berkhocaydt' },
  { subject: 'Dil', name: 'Dilci Burak Hoca', subscribersText: '9.9 B', subscribersCount: 9900, url: 'https://www.youtube.com/@dilciburakhoca' },
  { subject: 'Dil', name: 'Şahan Hoca', subscribersText: '2.1 B', subscribersCount: 2100, url: 'https://www.youtube.com/@sahanydt' }
];

const defaultChannelsWithIds: RecommendedChannel[] = RECOMMENDED_CHANNELS.map(ch => ({
  ...ch,
  id: `def-chan-${ch.subject.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${ch.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`
}));

const defaultBooksWithIds: RecommendedBook[] = RECOMMENDED_BOOKS.map(bk => ({
  ...bk,
  id: `def-book-${bk.category.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${bk.publisher.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${bk.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`
}));

const SUBJECTS = [
  { value: 'Matematik', label: 'Matematik', emoji: '📐' },
  { value: 'Geometri', label: 'Geometri', emoji: '📏' },
  { value: 'Türkçe', label: 'Türkçe', emoji: '📖' },
  { value: 'Fizik', label: 'Fizik', emoji: '⚡' },
  { value: 'Kimya', label: 'Kimya', emoji: '🧪' },
  { value: 'Biyoloji', label: 'Biyoloji', emoji: '🧬' },
  { value: 'Tarih', label: 'Tarih', emoji: '🏛️' },
  { value: 'Coğrafya', label: 'Coğrafya', emoji: '🌍' },
  { value: 'Felsefe', label: 'Felsefe', emoji: '🧠' },
  { value: 'Dil', label: 'Dil (YDT)', emoji: '🌐' }
];

const SUBJECT_COLORS: Record<string, { bg: string, text: string, border: string, glow: string }> = {
  'Matematik': { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30', glow: 'shadow-blue-500/10' },
  'Geometri': { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30', glow: 'shadow-emerald-500/10' },
  'Türkçe': { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30', glow: 'shadow-amber-500/10' },
  'Fizik': { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/30', glow: 'shadow-indigo-500/10' },
  'Kimya': { bg: 'bg-teal-500/10', text: 'text-teal-400', border: 'border-teal-500/30', glow: 'shadow-teal-500/10' },
  'Biyoloji': { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30', glow: 'shadow-rose-500/10' },
  'Tarih': { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30', glow: 'shadow-orange-500/10' },
  'Coğrafya': { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/30', glow: 'shadow-cyan-500/10' },
  'Felsefe': { bg: 'bg-violet-500/10', text: 'text-violet-400', border: 'border-violet-500/30', glow: 'shadow-violet-500/10' },
  'Dil': { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30', glow: 'shadow-purple-500/10' },
};

const getChannelAvatar = (channel: RecommendedChannel): string => {
  if (channel.avatarUrl) return channel.avatarUrl;
  if (channel.url) {
    const handleMatch = channel.url.match(/@([\w.-]+)/);
    let slug = '';
    if (handleMatch && handleMatch[1]) {
      slug = handleMatch[1].toLowerCase().replace(/[^a-z0-9]/g, '_');
    } else {
      slug = (channel.name || 'chan').toLowerCase().replace(/[^a-z0-9]/g, '_');
    }
    return `/uploads/avatars/youtube/${slug}.jpg`;
  }
  return '';
};

export const RecommendationsView: React.FC<RecommendationsViewProps> = ({
  onAddVideo,
  onAddResource,
  onDeleteVideo,
  onDeleteResource,
  trackedVideos,
  trackedResources,
  favoriteBooks = [],
  onToggleFavoriteBook,
  currentUser,
  customRecommendations = { channels: [], books: [] },
  onAddAuditLog
}) => {
  const [activeTab, setActiveTab] = useState<'youtube' | 'books'>('books');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [selectedSubject, setSelectedSubject] = useState<string>('Matematik');
  const [selectedExamType, setSelectedExamType] = useState<'Tümü' | 'TYT' | 'AYT'>('Tümü');
  const [selectedCategory, setSelectedCategory] = useState<string>('Tümü');
  const [difficultyFilter, setDifficultyFilter] = useState<number | 'all'>('all');
  const [showOnlyPopular, setShowOnlyPopular] = useState<boolean>(false);
  const [showOnlyFollowed, setShowOnlyFollowed] = useState<boolean>(false);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [channelSortOrder, setChannelSortOrder] = useState<'desc' | 'asc'>('desc');
  const [bookSortOrder, setBookSortOrder] = useState<'difficulty_asc' | 'difficulty_desc' | 'popular' | 'publisher'>('difficulty_asc');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  React.useEffect(() => {
    fetch('/api/youtube/sync-avatars', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        channels: RECOMMENDED_CHANNELS.map(c => ({ url: c.url, name: c.name }))
      })
    }).catch(() => {});
  }, []);

  // --- Teacher Add/Edit Resource Modals ---
  const [showAddChannelModal, setShowAddChannelModal] = useState(false);
  const [showAddBookModal, setShowAddBookModal] = useState(false);
  const [editingChannel, setEditingChannel] = useState<RecommendedChannel | null>(null);
  const [editingBook, setEditingBook] = useState<RecommendedBook | null>(null);
  const [deletingItem, setDeletingItem] = useState<{ id: string; name: string; type: 'channel' | 'book' } | null>(null);
  const [unfollowBookItem, setUnfollowBookItem] = useState<{ id: string; name: string } | null>(null);
  const [unfollowChannelItem, setUnfollowChannelItem] = useState<{ id: string; name: string } | null>(null);

  // Channel Form Fields
  const [channelSubject, setChannelSubject] = useState('Matematik');
  const [channelName, setChannelName] = useState('');
  const [channelSubscribersText, setChannelSubscribersText] = useState('');
  const [channelUrl, setChannelUrl] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [avatarCompressionStats, setAvatarCompressionStats] = useState<{ originalKb: number; compressedKb: number } | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isFetchingApiAvatar, setIsFetchingApiAvatar] = useState(false);

  // Book Form Fields
  const [bookSubject, setBookSubject] = useState('Matematik');
  const [bookCategory, setBookCategory] = useState('TYT Matematik');
  const [bookPublisher, setBookPublisher] = useState('');
  const [bookName, setBookName] = useState('');
  const [bookDifficulty, setBookDifficulty] = useState('⭐⭐⭐☆☆ (Orta)');
  const [bookDifficultyValue, setBookDifficultyValue] = useState<number>(3);
  const [bookReason, setBookReason] = useState('');
  const [bookIsPopular, setBookIsPopular] = useState(false);

  const resetChannelForm = () => {
    setChannelSubject('Matematik');
    setChannelName('');
    setChannelSubscribersText('');
    setChannelUrl('');
    setAvatarFile(null);
    setAvatarPreviewUrl(null);
    setAvatarCompressionStats(null);
    setIsUploadingAvatar(false);
    setIsFetchingApiAvatar(false);
    setEditingChannel(null);
  };

  const handleFetchAvatarFromApi = async () => {
    if (!channelUrl) {
      alert('Lütfen önce YouTube URL adresini giriniz.');
      return;
    }
    setIsFetchingApiAvatar(true);
    try {
      const res = await fetch('/api/youtube/sync-channel-avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: channelUrl, name: channelName })
      });

      const responseText = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error(`Sunucudan geçersiz yanıt alındı (Status: ${res.status}).`);
      }

      if (res.ok && data.success && data.avatarUrl) {
        setAvatarPreviewUrl(data.avatarUrl);
        setSuccessToast('Kanal fotoğrafı YouTube API servisinden başarıyla çekildi!');
        setTimeout(() => setSuccessToast(null), 3000);
      } else {
        alert('YouTube API servisinden fotoğraf çekilemedi: ' + (data.error || 'Görsel bulunamadı'));
      }
    } catch (e: any) {
      alert('API bağlantı hatası: ' + e.message);
    } finally {
      setIsFetchingApiAvatar(false);
    }
  };

  const handleAvatarFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFile(file, 120, 0.60);
      setAvatarFile(file);
      setAvatarPreviewUrl(compressed.dataUrl);
      setAvatarCompressionStats({
        originalKb: compressed.originalKb,
        compressedKb: compressed.compressedKb
      });
    } catch {
      alert('Görsel sıkıştırılırken bir hata oluştu.');
    }
  };

  const resetBookForm = () => {
    const defaultSub = selectedSubject || 'Matematik';
    setBookSubject(defaultSub);
    if (defaultSub === 'Dil') {
      setBookCategory('Kelime');
    } else if (defaultSub === 'Türkçe') {
      setBookCategory('TYT Türkçe');
    } else {
      setBookCategory(`TYT ${defaultSub}`);
    }
    setBookPublisher('');
    setBookName('');
    setBookDifficulty('⭐⭐⭐☆☆ (Orta)');
    setBookDifficultyValue(3);
    setBookReason('');
    setBookIsPopular(false);
    setEditingBook(null);
  };

  const handleStartEditChannel = (channel: RecommendedChannel) => {
    setEditingChannel(channel);
    setChannelSubject(channel.subject || 'Matematik');
    setChannelName(channel.name || '');
    setChannelSubscribersText(channel.subscribersText || '');
    setChannelUrl(channel.url || '');
    setAvatarFile(null);
    setAvatarCompressionStats(null);
    setAvatarPreviewUrl(channel.avatarUrl || getChannelAvatar(channel));
    setShowAddChannelModal(true);
  };

  const handleStartEditBook = (book: RecommendedBook) => {
    setEditingBook(book);
    setBookSubject(book.subject || 'Matematik');
    setBookCategory(book.category || 'TYT Matematik');
    setBookPublisher(book.publisher || '');
    setBookName(book.name || '');
    setBookDifficulty(book.difficulty || '⭐⭐⭐☆☆ (Orta)');
    setBookDifficultyValue(book.difficultyValue || 3);
    setBookReason(book.reason || '');
    setBookIsPopular(!!book.isPopular);
    setShowAddBookModal(true);
  };

  const handleChannelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let chanId = editingChannel?.id;
    const isEdit = !!editingChannel;
    const oldState = editingChannel ? { ...editingChannel } : null;

    if (editingChannel && !chanId) {
      const safeSubject = (editingChannel.subject || 'Matematik').toLowerCase().replace(/[^a-z0-9]/g, '-');
      const safeName = (editingChannel.name || '').toLowerCase().replace(/[^a-z0-9]/g, '-');
      chanId = `def-chan-${safeSubject}-${safeName}`;
    } else if (!editingChannel) {
      chanId = 'rec-chan-' + Date.now();
    }

    let syncedAvatarUrl = '';
    if (avatarFile) {
      try {
        setIsUploadingAvatar(true);
        const uploadRes = await uploadChannelAvatar(avatarFile, channelUrl, channelName);
        syncedAvatarUrl = `${uploadRes.url}?t=${Date.now()}`;
      } catch (err: any) {
        console.error('Channel custom avatar upload error:', err);
      } finally {
        setIsUploadingAvatar(false);
      }
    }

    if (!syncedAvatarUrl) {
      try {
        const syncRes = await fetch('/api/youtube/sync-channel-avatar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: channelUrl, name: channelName })
        });
        const syncData = await syncRes.json();
        if (syncData.success && syncData.avatarUrl) {
          syncedAvatarUrl = syncData.avatarUrl;
        }
      } catch (e) {
        console.log('Channel avatar sync error on submit:', e);
      }
    }

    const newChan = {
      ...(chanId ? { id: chanId } : {}),
      type: 'channel',
      subject: channelSubject,
      name: channelName,
      subscribersText: channelSubscribersText,
      subscribersCount: 0,
      url: channelUrl,
      ...(syncedAvatarUrl ? { avatarUrl: syncedAvatarUrl } : {})
    };

    const addedId = chanId;
    await saveRecommendationToFirestore(newChan);

    if (onAddAuditLog) {
      if (isEdit) {
        onAddAuditLog(
          `${currentUser?.name || 'Kullanıcı'}, "${channelName}" adlı YouTube kanalı tavsiyesini güncelledi.`,
          'management',
          'EDIT_REC_CHANNEL',
          async () => {
            if (oldState) {
              await saveRecommendationToFirestore(oldState);
            } else {
              await deleteRecommendationFromFirestore(addedId);
            }
          }
        );
      } else {
        onAddAuditLog(
          `${currentUser?.name || 'Kullanıcı'}, "${channelName}" adlı yeni bir YouTube kanalı tavsiyesi ekledi.`,
          'management',
          'ADD_REC_CHANNEL',
          async () => {
            await deleteRecommendationFromFirestore(addedId);
          }
        );
      }
    }

    setSuccessToast(editingChannel ? `"${channelName}" kanalı güncellendi!` : `"${channelName}" kanalı tavsiyelere eklendi!`);
    setShowAddChannelModal(false);
    resetChannelForm();
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const handleBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let bookId = editingBook?.id;
    const isEdit = !!editingBook;
    const oldState = editingBook ? { ...editingBook } : null;

    if (editingBook && !bookId) {
      const safeCategory = (editingBook.category || 'Konu Anlatımı').toLowerCase().replace(/[^a-z0-9]/g, '-');
      const safePublisher = (editingBook.publisher || '').toLowerCase().replace(/[^a-z0-9]/g, '-');
      const safeName = (editingBook.name || '').toLowerCase().replace(/[^a-z0-9]/g, '-');
      bookId = `def-book-${safeCategory}-${safePublisher}-${safeName}`;
    } else if (!editingBook) {
      bookId = 'rec-book-' + Date.now();
    }

    const newBook = {
      ...(bookId ? { id: bookId } : {}),
      type: 'book',
      subject: bookSubject,
      category: bookCategory,
      publisher: bookPublisher,
      name: bookName,
      difficulty: bookDifficulty,
      difficultyValue: bookDifficultyValue,
      reason: bookReason,
      isPopular: bookIsPopular
    };

    const addedId = bookId;
    await saveRecommendationToFirestore(newBook);

    if (onAddAuditLog) {
      if (isEdit) {
        onAddAuditLog(
          `${currentUser?.name || 'Kullanıcı'}, "${bookPublisher} - ${bookName}" adlı kaynak kitap tavsiyesini güncelledi.`,
          'management',
          'EDIT_REC_BOOK',
          async () => {
            if (oldState) {
              await saveRecommendationToFirestore(oldState);
            } else {
              await deleteRecommendationFromFirestore(addedId);
            }
          }
        );
      } else {
        onAddAuditLog(
          `${currentUser?.name || 'Kullanıcı'}, "${bookPublisher} - ${bookName}" adlı yeni bir kaynak kitap tavsiyesi ekledi.`,
          'management',
          'ADD_REC_BOOK',
          async () => {
            await deleteRecommendationFromFirestore(addedId);
          }
        );
      }
    }

    setSuccessToast(editingBook ? `"${bookPublisher} - ${bookName}" kitabı güncellendi!` : `"${bookPublisher} - ${bookName}" kitabı tavsiyelere eklendi!`);
    setShowAddBookModal(false);
    resetBookForm();
    setTimeout(() => setSuccessToast(null), 3500);
  };

  const isTeacher = currentUser?.role === 'teacher' || currentUser?.role === 'class_teacher' || currentUser?.role === 'school_counselor' || currentUser?.role === 'admin';

  // --- YouTube Follow Logic ---
  const isChannelAdded = (channelName: string) => {
    return trackedVideos.some(
      v => v.channelName.localeCompare(channelName, 'tr', { sensitivity: 'base' }) === 0
    );
  };

  const getTrackedVideo = (channelName: string) => {
    return trackedVideos.find(
      v => v.channelName.localeCompare(channelName, 'tr', { sensitivity: 'base' }) === 0
    );
  };

  const handleToggleChannelFollow = (channel: RecommendedChannel) => {
    const tracked = getTrackedVideo(channel.name);
    if (tracked) {
      if (onDeleteVideo) {
        setUnfollowChannelItem({ id: tracked.id, name: channel.name });
      } else {
        setSuccessToast(`"${channel.name}" zaten takip listenizde ekli!`);
        setTimeout(() => setSuccessToast(null), 3000);
      }
    } else {
      onAddVideo({
        subject: channel.subject,
        channelName: channel.name,
        topicName: `${channel.subject} Konu Anlatım Serisi`,
        playlistTitle: `${channel.name} Genel Kampı`,
        videoUrl: channel.url,
        isWatched: false,
        notes: `${channel.name} önerilen ${channel.subject} kanalı.`
      });
      setSuccessToast(`"${channel.name}" kanalı başarıyla takip listenize eklendi!`);
      setTimeout(() => setSuccessToast(null), 3000);
    }
  };

  // --- Books Follow Logic ---
  const isBookAdded = (publisher: string, bookTitle: string) => {
    return trackedResources.some(
      r => r.publisher.localeCompare(publisher, 'tr', { sensitivity: 'base' }) === 0 && r.bookTitle.localeCompare(bookTitle, 'tr', { sensitivity: 'base' }) === 0
    );
  };

  const getTrackedBook = (publisher: string, bookTitle: string) => {
    return trackedResources.find(
      r => r.publisher.localeCompare(publisher, 'tr', { sensitivity: 'base' }) === 0 && r.bookTitle.localeCompare(bookTitle, 'tr', { sensitivity: 'base' }) === 0
    );
  };

  const handleToggleBookFollow = (book: RecommendedBook) => {
    const tracked = getTrackedBook(book.publisher, book.name);
    if (tracked) {
      if (onDeleteResource) {
        setUnfollowBookItem({ id: tracked.id, name: `${book.publisher} - ${book.name}` });
      } else {
        setSuccessToast(`"${book.publisher} - ${book.name}" zaten takip listenizde ekli!`);
        setTimeout(() => setSuccessToast(null), 3000);
      }
    } else {
      onAddResource({
        subject: book.subject,
        bookTitle: book.name,
        publisher: book.publisher,
        totalUnits: 10,
        completedUnits: 0,
        status: 'not_started',
        examType: (book.category.includes('AYT') || book.category.includes('YDT') || book.subject === 'Dil') ? (book.subject === 'Dil' ? 'YDT' : 'AYT') : 'TYT',
        notes: `Tavsiyelerden eklendi: Seviye: ${book.difficulty}. ${book.reason}`
      });
      setSuccessToast(`"${book.publisher} - ${book.name}" kaynağı başarıyla kaynaklarınıza eklendi!`);
      setTimeout(() => setSuccessToast(null), 3000);
    }
  };

  // --- Master Lists Composition ---
  const customChannelMap = new Map((customRecommendations?.channels || []).map(ch => [ch.id, ch]));
  const allChannels = [
    ...defaultChannelsWithIds.map(ch => {
      const custom = ch.id ? customChannelMap.get(ch.id) : null;
      if (custom) {
        return { ...ch, ...custom, isCustom: true };
      }
      return ch;
    }).filter(ch => !ch.isDeleted),
    ...(customRecommendations?.channels || [])
      .filter(ch => ch.id && !ch.id.startsWith('def-chan-') && !ch.isDeleted)
      .map(ch => ({ ...ch, isCustom: true }))
  ];

  const customBookMap = new Map((customRecommendations?.books || []).map(bk => [bk.id, bk]));
  const allBooks = [
    ...defaultBooksWithIds.map(bk => {
      const custom = bk.id ? customBookMap.get(bk.id) : null;
      if (custom) {
        return { ...bk, ...custom, isCustom: true };
      }
      return bk;
    }).filter(bk => !bk.isDeleted),
    ...(customRecommendations?.books || [])
      .filter(bk => bk.id && !bk.id.startsWith('def-book-') && !bk.isDeleted)
      .map(bk => ({ ...bk, isCustom: true }))
  ];

  const parseSubscriberTextToNumber = (text: string): number => {
    if (!text) return 0;
    const clean = text.trim().toLowerCase();
    let multiplier = 1;
    if (clean.includes('mn') || clean.includes('milyon') || clean.includes('m')) {
      multiplier = 1000000;
    } else if (clean.includes('b') || clean.includes('bin') || clean.includes('k')) {
      multiplier = 1000;
    }
    const numStr = clean.replace(/[^0-9,.]/g, '').replace(',', '.');
    const num = parseFloat(numStr) || 0;
    return num * multiplier;
  };

  // --- Dynamic Sub-Categories for the active subject ---
  const availableCategoriesForSubject = useMemo(() => {
    const cats = new Set<string>();
    allBooks
      .filter(b => b.subject === selectedSubject)
      .forEach(b => {
        if (b.category && b.category.trim()) cats.add(b.category.trim());
      });
    return Array.from(cats);
  }, [allBooks, selectedSubject]);

  // Reset category filter when subject changes
  React.useEffect(() => {
    setSelectedCategory('Tümü');
  }, [selectedSubject]);

  // --- Filtered Display Lists ---
  const displayedChannels = useMemo(() => {
    return allChannels.filter(channel => {
      const isAdded = isChannelAdded(channel.name);

      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchName = channel.name.toLowerCase().includes(q);
        const matchSub = channel.subject.toLowerCase().includes(q);
        if (!matchName && !matchSub) return false;
      }

      if (showOnlyFollowed) {
        return isAdded;
      }

      if (!searchQuery.trim()) {
        if (channel.subject !== selectedSubject) return false;
      }

      return true;
    }).sort((a, b) => {
      const valA = parseSubscriberTextToNumber(a.subscribersText);
      const valB = parseSubscriberTextToNumber(b.subscribersText);
      return channelSortOrder === 'desc' ? valB - valA : valA - valB;
    });
  }, [allChannels, selectedSubject, showOnlyFollowed, searchQuery, channelSortOrder, trackedVideos]);

  const displayedBooks = useMemo(() => {
    return allBooks.filter(book => {
      const bookKey = `${book.publisher} - ${book.name}`;
      const isFav = favoriteBooks.includes(bookKey);
      const isAdded = isBookAdded(book.publisher, book.name);

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchName = book.name.toLowerCase().includes(q);
        const matchPub = book.publisher.toLowerCase().includes(q);
        const matchSub = book.subject.toLowerCase().includes(q);
        const matchCat = (book.category || '').toLowerCase().includes(q);
        const matchReason = (book.reason || '').toLowerCase().includes(q);
        if (!matchName && !matchPub && !matchSub && !matchCat && !matchReason) {
          return false;
        }
      }

      // Quick views
      if (showOnlyFavorites && !isFav) return false;
      if (showOnlyFollowed && !isAdded) return false;

      // Subject Filter (only enforced if not searching globally or when showOnlyFollowed is inactive)
      if (!showOnlyFollowed && !showOnlyFavorites && !searchQuery.trim()) {
        if (book.subject !== selectedSubject) return false;
      } else if (!searchQuery.trim() && (showOnlyFollowed || showOnlyFavorites)) {
        if (selectedSubject && book.subject !== selectedSubject) return false;
      }

      // Category / Type filter
      if (selectedCategory !== 'Tümü' && book.category !== selectedCategory) {
        return false;
      }

      // Exam Type filter (TYT vs AYT/YDT)
      if (selectedExamType === 'TYT') {
        const isTyt = book.category.includes('TYT') || ['Kelime', 'Gramer', 'Skills', 'Okuma'].includes(book.category);
        if (!isTyt) return false;
      } else if (selectedExamType === 'AYT') {
        const isAytOrDil = book.category.includes('AYT') || book.category.includes('YDT') || book.subject === 'Dil';
        if (!isAytOrDil) return false;
      }

      // Difficulty level filter
      if (difficultyFilter !== 'all') {
        if (difficultyFilter === 1 && book.difficultyValue > 2) return false;
        if (difficultyFilter === 3 && book.difficultyValue !== 3) return false;
        if (difficultyFilter === 5 && book.difficultyValue < 4) return false;
      }

      // Popular filter
      if (showOnlyPopular && !book.isPopular) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      if (bookSortOrder === 'difficulty_asc') return a.difficultyValue - b.difficultyValue;
      if (bookSortOrder === 'difficulty_desc') return b.difficultyValue - a.difficultyValue;
      if (bookSortOrder === 'popular') return (b.isPopular ? 1 : 0) - (a.isPopular ? 1 : 0);
      if (bookSortOrder === 'publisher') return a.publisher.localeCompare(b.publisher, 'tr');
      return a.difficultyValue - b.difficultyValue;
    });
  }, [
    allBooks, 
    selectedSubject, 
    selectedCategory, 
    selectedExamType, 
    difficultyFilter, 
    showOnlyPopular, 
    showOnlyFollowed, 
    showOnlyFavorites, 
    searchQuery, 
    bookSortOrder, 
    favoriteBooks, 
    trackedResources
  ]);

  const totalFollowedChannels = allChannels.filter(c => isChannelAdded(c.name)).length;
  const totalFollowedBooks = allBooks.filter(b => isBookAdded(b.publisher, b.name)).length;
  const totalFavoriteBooks = allBooks.filter(b => favoriteBooks.includes(`${b.publisher} - ${b.name}`)).length;

  const renderDifficultyBadge = (difficultyValue: number, text?: string) => {
    let colorClass = 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    let label = text || 'Orta Seviye';

    if (difficultyValue <= 1) {
      colorClass = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    } else if (difficultyValue === 2) {
      colorClass = 'bg-teal-500/15 text-teal-300 border-teal-500/30';
    } else if (difficultyValue === 3) {
      colorClass = 'bg-amber-500/15 text-amber-300 border-amber-500/30';
    } else if (difficultyValue === 4) {
      colorClass = 'bg-orange-500/15 text-orange-400 border-orange-500/30';
    } else if (difficultyValue >= 5) {
      colorClass = 'bg-rose-500/15 text-rose-400 border-rose-500/30';
    }

    return (
      <div className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${colorClass}`}>
        <div className="flex items-center space-x-0.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`w-3 h-3 ${star <= difficultyValue ? 'fill-current' : 'opacity-20'}`}
            />
          ))}
        </div>
        <span className="ml-1 text-[10px]">{label}</span>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      
      {/* Toast Alert */}
      {successToast && (
        <div className="fixed top-20 right-6 z-50 animate-fade-in bg-slate-900/95 border border-purple-500/50 text-purple-100 px-4 py-3 rounded-2xl shadow-2xl flex items-center space-x-2.5 text-xs font-semibold backdrop-blur-xl ring-1 ring-purple-500/20">
          <Sparkles className="w-4 h-4 text-amber-400 animate-pulse shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* HERO HEADER & QUICK KPI STATS */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 border border-slate-800 p-6 sm:p-7 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-8 w-48 h-48 bg-indigo-600/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[11px] font-bold">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>YKS Derece Tavsiyeleri & İçerik Rehberi</span>
            </div>
            <h1 id="recommendations-title" className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
              <span>YKS Kaynak & Eğitim Tavsiyeleri</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Hedefine en uygun YouTube eğitim kanallarını ve seviyelendirilmiş, popüler YKS kaynak kitap önerilerini keşfet; tek tıkla çalışma listene ekle.
            </p>
          </div>

          {/* Quick Action Buttons for Teachers */}
          {isTeacher && (
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                onClick={() => {
                  resetChannelForm();
                  setShowAddChannelModal(true);
                }}
                className="inline-flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-xs font-bold text-white rounded-xl shadow-lg shadow-red-600/20 transition-all border border-red-500/40 cursor-pointer"
              >
                <Youtube className="w-4 h-4" />
                <span>YouTube Kanalı Ekle</span>
              </button>
              <button
                onClick={() => {
                  resetBookForm();
                  setShowAddBookModal(true);
                }}
                className="inline-flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-xs font-bold text-white rounded-xl shadow-lg shadow-indigo-600/20 transition-all border border-indigo-500/40 cursor-pointer"
              >
                <BookOpen className="w-4 h-4" />
                <span>Kaynak Kitap Ekle</span>
              </button>
            </div>
          )}
        </div>

        {/* KPI COUNTERS BAR */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800/80">
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3.5 flex items-center space-x-3 hover:border-slate-700 transition-all">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-medium block">Katalogdaki Kitaplar</span>
              <span className="text-lg font-black text-white font-mono">{allBooks.length} <span className="text-xs font-normal text-slate-500">Kitap</span></span>
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3.5 flex items-center space-x-3 hover:border-slate-700 transition-all">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 shrink-0">
              <Youtube className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-medium block">Önerilen Kanallar</span>
              <span className="text-lg font-black text-white font-mono">{allChannels.length} <span className="text-xs font-normal text-slate-500">Kanal</span></span>
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3.5 flex items-center space-x-3 hover:border-slate-700 transition-all">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
              <Heart className="w-5 h-5 fill-rose-500/20" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-medium block">Favori Kitaplarım</span>
              <span className="text-lg font-black text-white font-mono">{totalFavoriteBooks} <span className="text-xs font-normal text-slate-500">Favori</span></span>
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3.5 flex items-center space-x-3 hover:border-slate-700 transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <Bookmark className="w-5 h-5 fill-emerald-500/20" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-medium block">Takip Ettiğim</span>
              <span className="text-lg font-black text-white font-mono">{totalFollowedBooks + totalFollowedChannels} <span className="text-xs font-normal text-slate-500">İçerik</span></span>
            </div>
          </div>
        </div>
      </div>

      {/* SEGMENT CONTROL (Top Tab Selector) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-1.5 bg-slate-950 rounded-2xl border border-slate-800 shadow-xl">
        <div className="flex w-full sm:w-auto gap-1.5 p-0.5 bg-slate-900/60 rounded-xl border border-slate-800/80">
          <button
            onClick={() => {
              setActiveTab('books');
              setShowOnlyFollowed(false);
            }}
            className={`flex-1 sm:flex-initial flex items-center justify-center space-x-2 py-2.5 px-5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'books'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Kaynak Kitap Önerileri</span>
            <span className="text-[10px] bg-indigo-950/80 text-indigo-200 border border-indigo-500/30 px-2 py-0.5 rounded-full font-mono font-bold">
              {allBooks.length}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab('youtube');
              setShowOnlyFollowed(false);
            }}
            className={`flex-1 sm:flex-initial flex items-center justify-center space-x-2 py-2.5 px-5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'youtube'
                ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg shadow-red-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Youtube className="w-4 h-4" />
            <span>YouTube Kanalları</span>
            <span className="text-[10px] bg-red-950/80 text-red-200 border border-red-500/30 px-2 py-0.5 rounded-full font-mono font-bold">
              {allChannels.length}
            </span>
          </button>
        </div>

        {/* View Switcher: Grid vs Table */}
        <div className="flex items-center gap-1 self-end sm:self-center bg-slate-900/60 p-1 rounded-xl border border-slate-800/80">
          <button
            onClick={() => setViewMode('grid')}
            title="Kart (Grid) Görünümü"
            className={`p-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
              viewMode === 'grid'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span className="hidden sm:inline">Kartlar</span>
          </button>
          <button
            onClick={() => setViewMode('table')}
            title="Tablo (Liste) Görünümü"
            className={`p-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
              viewMode === 'table'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <List className="w-4 h-4" />
            <span className="hidden sm:inline">Tablo</span>
          </button>
        </div>
      </div>

      {/* FILTER & SEARCH CONTROL STATION */}
      <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-3xl shadow-xl backdrop-blur-md space-y-4">
        
        {/* Search Bar & Primary Toggles */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={activeTab === 'books' ? "Kitap adı, yayınevi veya konu ara (Örn: Reader at Work, Bilgi Sarmal, Dil)..." : "YouTube kanal adı veya ders ara..."}
              className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-2xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white rounded-md"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
            {activeTab === 'books' && (
              <button
                onClick={() => {
                  setShowOnlyFavorites(!showOnlyFavorites);
                  if (!showOnlyFavorites) setShowOnlyFollowed(false);
                }}
                className={`flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                  showOnlyFavorites
                    ? 'bg-rose-600 border-rose-500 text-white shadow-md shadow-rose-600/20'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${showOnlyFavorites ? 'fill-current text-white' : 'text-rose-400'}`} />
                <span>Favorilerim ({totalFavoriteBooks})</span>
              </button>
            )}

            <button
              onClick={() => {
                setShowOnlyFollowed(!showOnlyFollowed);
                if (!showOnlyFollowed) setShowOnlyFavorites(false);
              }}
              className={`flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                showOnlyFollowed
                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${showOnlyFollowed ? 'fill-current text-white' : 'text-indigo-400'}`} />
              <span>Takip Listem ({activeTab === 'youtube' ? totalFollowedChannels : totalFollowedBooks})</span>
            </button>
          </div>
        </div>

        {/* Subject Picker - Responsive Grid (No horizontal scrollbar) */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 flex items-center gap-1.5">
              <Layers className="w-3 h-3 text-purple-400" />
              <span>Ders Seçimi</span>
            </span>
            <span className="text-[11px] text-purple-300 font-bold">
              {selectedSubject} ({activeTab === 'books' ? allBooks.filter(b => b.subject === selectedSubject).length : allChannels.filter(c => c.subject === selectedSubject).length} Kaynak)
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 w-full">
            {SUBJECTS.map((sub) => {
              const isSelected = selectedSubject === sub.value && !showOnlyFollowed;
              const subCount = activeTab === 'books' 
                ? allBooks.filter(b => b.subject === sub.value).length 
                : allChannels.filter(c => c.subject === sub.value).length;

              return (
                <button
                  key={sub.value}
                  onClick={() => {
                    setSelectedSubject(sub.value);
                    setShowOnlyFollowed(false);
                  }}
                  className={`w-full py-2.5 px-3 rounded-2xl text-xs font-bold transition-all border cursor-pointer flex items-center justify-between space-x-2 ${
                    isSelected
                      ? activeTab === 'youtube'
                        ? 'bg-gradient-to-r from-red-600 to-rose-600 border-red-400 text-white shadow-lg shadow-red-600/30 scale-[1.02]'
                        : 'bg-gradient-to-r from-indigo-600 to-purple-600 border-indigo-400 text-white shadow-lg shadow-indigo-600/30 scale-[1.02]'
                      : 'bg-slate-950 border-slate-800/80 text-slate-400 hover:text-white hover:border-slate-700 hover:bg-slate-900'
                  }`}
                  title={`${sub.label} (${subCount} kaynak)`}
                >
                  <div className="flex items-center space-x-2 truncate">
                    <span className="shrink-0 text-sm">{sub.emoji}</span>
                    <span className="truncate">{sub.label}</span>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono shrink-0 font-bold ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-900 text-slate-400 border border-slate-800'
                  }`}>
                    {subCount}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sub-Filters for Books & Sort Options */}
        {activeTab === 'books' && (
          <div className="pt-3 border-t border-slate-800/80 space-y-3">
            
            {/* Dynamic Sub-Category Tabs (e.g. Kelime, Gramer, Skills, Okuma, Deneme) - Wrapped without scrollbar */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] uppercase font-extrabold text-slate-400 shrink-0 flex items-center gap-1 mr-1">
                <Filter className="w-3 h-3 text-indigo-400" />
                <span>Kategori:</span>
              </span>
              <button
                onClick={() => setSelectedCategory('Tümü')}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer border ${
                  selectedCategory === 'Tümü'
                    ? 'bg-purple-600 border-purple-500 text-white shadow-md'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Tümü
              </button>
              {availableCategoriesForSubject.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer border ${
                    selectedCategory === cat
                      ? 'bg-purple-600 border-purple-500 text-white shadow-md'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Level, Popularity and Sort Filters row */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-slate-800/50">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setShowOnlyPopular(!showOnlyPopular)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all border cursor-pointer flex items-center space-x-1.5 ${
                    showOnlyPopular
                      ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-md shadow-amber-500/10'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  <span>En Çok Tercih Edilenler</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={difficultyFilter}
                  onChange={(e) => setDifficultyFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                  className="bg-slate-950 border border-slate-800 text-slate-300 text-[11px] font-bold rounded-xl px-3 py-1.5 focus:outline-none focus:border-purple-500 cursor-pointer"
                >
                  <option value="all">Tüm Zorluk Seviyeleri</option>
                  <option value="1">⭐ Kolay (Seviye 1-2)</option>
                  <option value="3">⭐⭐⭐ Orta (Seviye 3)</option>
                  <option value="5">⭐⭐⭐⭐⭐ Zor (Seviye 4-5)</option>
                </select>

                <select
                  value={bookSortOrder}
                  onChange={(e) => setBookSortOrder(e.target.value as any)}
                  className="bg-slate-950 border border-slate-800 text-slate-300 text-[11px] font-bold rounded-xl px-3 py-1.5 focus:outline-none focus:border-purple-500 cursor-pointer"
                >
                  <option value="difficulty_asc">Sırala: Kolaydan Zora</option>
                  <option value="difficulty_desc">Sırala: Zordan Kolaya</option>
                  <option value="popular">Sırala: Popülerlik</option>
                  <option value="publisher">Sırala: Yayınevi (A-Z)</option>
                </select>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="space-y-4">
        {activeTab === 'youtube' ? (
          // ==================== YOUTUBE CHANNELS ====================
          displayedChannels.length > 0 ? (
            viewMode === 'grid' ? (
              // GRID CARD VIEW (YOUTUBE)
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayedChannels.map((channel, idx) => {
                  const isAdded = isChannelAdded(channel.name);
                  const color = SUBJECT_COLORS[channel.subject] || { bg: 'bg-slate-800', text: 'text-slate-300', border: 'border-slate-700', glow: '' };
                  const avatarSrc = getChannelAvatar(channel);

                  return (
                    <div
                      key={`${channel.id || channel.name}-${idx}`}
                      className="group relative bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-red-500/40 rounded-3xl p-5 shadow-xl transition-all duration-300 hover:shadow-2xl hover:shadow-red-500/10 flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-[10px] font-bold border ${color.bg} ${color.text} ${color.border}`}>
                            {channel.subject}
                          </span>

                          <div className="flex items-center space-x-1">
                            {isTeacher && (
                              <button
                                onClick={() => handleStartEditChannel(channel)}
                                className="p-1.5 bg-slate-950 hover:bg-amber-500/20 text-amber-400 hover:text-amber-300 border border-slate-800 rounded-lg transition-all"
                                title="Kanalı Düzenle"
                              >
                                <Pencil className="w-3 h-3" />
                              </button>
                            )}
                            {isTeacher && (
                              <button
                                onClick={() => {
                                  if (channel.id) {
                                    setDeletingItem({ id: channel.id, name: channel.name, type: 'channel' });
                                  }
                                }}
                                className="p-1.5 bg-slate-950 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-slate-800 rounded-lg transition-all"
                                title="Kanalı Sil"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Channel Avatar & Info */}
                        <div className="flex items-center space-x-3.5">
                          <a
                            href={channel.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shrink-0 relative flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform"
                          >
                            {avatarSrc ? (
                              <img
                                src={avatarSrc}
                                alt={channel.name}
                                loading="lazy"
                                className="w-full h-full object-cover absolute inset-0 z-10 rounded-2xl"
                                onError={(e) => {
                                  const target = e.currentTarget as HTMLImageElement;
                                  const urlPath = target.src.split('?')[0];
                                  if (urlPath.endsWith('.jpg')) {
                                    target.src = urlPath.replace('.jpg', '.svg') + '?t=' + Date.now();
                                  } else if (!target.src.includes('/api/youtube/avatar')) {
                                    target.src = `/api/youtube/avatar?url=${encodeURIComponent(channel.url)}&name=${encodeURIComponent(channel.name)}&t=${Date.now()}`;
                                  } else {
                                    target.style.display = 'none';
                                  }
                                }}
                              />
                            ) : null}
                            <div className="w-full h-full bg-gradient-to-br from-red-950 to-slate-950 flex items-center justify-center text-red-500 z-0">
                              <Youtube className="w-6 h-6" />
                            </div>
                          </a>

                          <div className="min-w-0 flex-1">
                            <a
                              href={channel.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-bold text-sm text-white hover:text-red-400 transition-colors block truncate"
                            >
                              {channel.name}
                            </a>
                            <div className="inline-flex items-center space-x-1 text-slate-400 text-xs font-semibold mt-1">
                              <TrendingUp className="w-3.5 h-3.5 text-red-400" />
                              <span>{channel.subscribersText} Abone</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Action Bar */}
                      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                        <a
                          href={channel.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center space-x-1 px-3 py-2 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-bold border border-slate-800 transition-all cursor-pointer"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-red-400" />
                          <span>Kanala Git</span>
                        </a>

                        <button
                          onClick={() => handleToggleChannelFollow(channel)}
                          className={`flex-1 flex items-center justify-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                            isAdded
                              ? 'bg-emerald-500/10 hover:bg-rose-500/15 border-emerald-500/30 hover:border-rose-500/40 text-emerald-400 hover:text-rose-400'
                              : 'bg-red-600 hover:bg-red-500 border-red-500 text-white shadow-md shadow-red-600/20'
                          }`}
                        >
                          {isAdded ? (
                            <>
                              <Check className="w-3.5 h-3.5 group-hover:hidden" />
                              <Trash2 className="w-3.5 h-3.5 hidden group-hover:inline text-rose-400" />
                              <span className="group-hover:hidden">Takip Ediliyor</span>
                              <span className="hidden group-hover:inline">Takipten Çıkar</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5" />
                              <span>Takip Listeme Ekle</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              // TABLE VIEW (YOUTUBE)
              <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-900/60 shadow-xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/80 text-xs font-bold text-slate-400">
                      <th className="py-4 px-4 w-12 text-center">#</th>
                      <th className="py-4 px-4">Ders</th>
                      <th className="py-4 px-4">Kanal Adı</th>
                      <th 
                        onClick={() => setChannelSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                        className="py-4 px-4 text-right cursor-pointer hover:text-white transition-colors select-none"
                      >
                        <div className="inline-flex items-center space-x-1 justify-end">
                          <span>Abone Sayısı</span>
                          <ArrowUpDown className="w-3 h-3 text-red-400" />
                        </div>
                      </th>
                      <th className="py-4 px-4 text-center">Yönlendir</th>
                      <th className="py-4 px-4 text-right">İşlem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-xs text-slate-300">
                    {displayedChannels.map((channel, index) => {
                      const isAdded = isChannelAdded(channel.name);
                      const color = SUBJECT_COLORS[channel.subject] || { bg: 'bg-slate-800', text: 'text-slate-300', border: 'border-slate-700', glow: '' };
                      const avatarSrc = getChannelAvatar(channel);

                      return (
                        <tr key={`${channel.id || channel.name}-${index}`} className="hover:bg-slate-900 transition-colors group">
                          <td className="py-3.5 px-4 text-center font-bold text-slate-500">{index + 1}</td>
                          <td className="py-3.5 px-4">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${color.bg} ${color.text} ${color.border}`}>
                              {channel.subject}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-white">
                            <div className="flex items-center space-x-3">
                              <a href={channel.url} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shrink-0 relative flex items-center justify-center">
                                {avatarSrc && <img src={avatarSrc} alt={channel.name} className="w-full h-full object-cover" />}
                              </a>
                              <a href={channel.url} target="_blank" rel="noopener noreferrer" className="font-bold text-xs text-white hover:text-red-400 transition-colors">
                                {channel.name}
                              </a>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-right font-medium text-slate-200">
                            <div className="inline-flex items-center space-x-1">
                              <TrendingUp className="w-3.5 h-3.5 text-red-400" />
                              <span>{channel.subscribersText}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <a href={channel.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white transition-all border border-slate-800">
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              {isTeacher && (
                                <button onClick={() => handleStartEditChannel(channel)} className="p-1.5 bg-slate-950 hover:bg-amber-500/20 text-amber-400 border border-slate-800 rounded-lg">
                                  <Pencil className="w-3 h-3" />
                                </button>
                              )}
                              {isTeacher && (
                                <button onClick={() => { if (channel.id) setDeletingItem({ id: channel.id, name: channel.name, type: 'channel' }); }} className="p-1.5 bg-slate-950 hover:bg-rose-500/20 text-rose-400 border border-slate-800 rounded-lg">
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                              <button
                                onClick={() => handleToggleChannelFollow(channel)}
                                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all border cursor-pointer ${
                                  isAdded
                                    ? 'bg-emerald-500/10 hover:bg-rose-500/10 border-emerald-500/30 text-emerald-400 hover:text-rose-400'
                                    : 'bg-red-600 hover:bg-red-500 text-white border-red-500'
                                }`}
                              >
                                {isAdded ? 'Takip Ediliyor' : 'Takip Et'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            <div className="text-center py-16 border border-dashed border-slate-800 rounded-3xl bg-slate-900/30 space-y-3">
              <Youtube className="w-10 h-10 text-slate-600 mx-auto animate-pulse" />
              <p className="text-sm font-bold text-slate-300">Aramanıza veya filtrelerinize uygun kanal bulunamadı.</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setShowOnlyFollowed(false);
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs text-white font-bold rounded-xl transition-all cursor-pointer"
              >
                Filtreleri Temizle
              </button>
            </div>
          )
        ) : (
          // ==================== BOOKS RECOMMENDATIONS ====================
          displayedBooks.length > 0 ? (
            viewMode === 'grid' ? (
              // GRID CARD VIEW (BOOKS)
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayedBooks.map((book, index) => {
                  const isAdded = isBookAdded(book.publisher, book.name);
                  const bookKey = `${book.publisher} - ${book.name}`;
                  const isFav = favoriteBooks.includes(bookKey);
                  const color = SUBJECT_COLORS[book.subject] || { bg: 'bg-slate-800', text: 'text-slate-300', border: 'border-slate-700', glow: '' };

                  return (
                    <div
                      key={`${book.publisher}-${book.name}-${index}`}
                      className="group relative bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/40 rounded-3xl p-5 shadow-xl transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/10 flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-3">
                        {/* Badges Row */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-[10px] font-bold border ${color.bg} ${color.text} ${color.border}`}>
                              {book.subject}
                            </span>
                            <span className="text-[10px] bg-slate-950 text-slate-300 border border-slate-800 px-2 py-0.5 rounded-lg font-semibold">
                              {book.category}
                            </span>
                            {book.isPopular && (
                              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-black animate-pulse">
                                <Flame className="w-3 h-3 text-amber-400" />
                                <span>Popüler</span>
                              </span>
                            )}
                          </div>

                          {/* Top Action Heart & Admin Tools */}
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => {
                                if (onToggleFavoriteBook) {
                                  onToggleFavoriteBook(bookKey);
                                  setSuccessToast(isFav ? `"${book.publisher} - ${book.name}" favorilerden çıkarıldı.` : `"${book.publisher} - ${book.name}" favorilere eklendi!`);
                                  setTimeout(() => setSuccessToast(null), 3000);
                                }
                              }}
                              className={`p-2 rounded-xl transition-all cursor-pointer border ${
                                isFav
                                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                                  : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-rose-400 hover:border-rose-500/30'
                              }`}
                              title={isFav ? "Favorilerden Çıkar" : "Favorilere Ekle"}
                            >
                              <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}`} />
                            </button>

                            {isTeacher && (
                              <button
                                onClick={() => handleStartEditBook(book)}
                                className="p-2 bg-slate-950 hover:bg-amber-500/20 text-amber-400 border border-slate-800 rounded-xl transition-all"
                                title="Kitabı Düzenle"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {isTeacher && (
                              <button
                                onClick={() => {
                                  if (book.id) {
                                    setDeletingItem({ id: book.id, name: `${book.publisher} - ${book.name}`, type: 'book' });
                                  }
                                }}
                                className="p-2 bg-slate-950 hover:bg-rose-500/20 text-rose-400 border border-slate-800 rounded-xl transition-all"
                                title="Kitabı Sil"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Publisher & Book Name */}
                        <div>
                          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 font-mono block">
                            {book.publisher}
                          </span>
                          <h3 className="text-base font-black text-white group-hover:text-indigo-300 transition-colors mt-0.5">
                            {book.name}
                          </h3>
                        </div>

                        {/* Difficulty Level Bar */}
                        <div className="space-y-1 bg-slate-950/70 p-2.5 rounded-2xl border border-slate-800/80">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-400 font-medium">Zorluk Seviyesi:</span>
                            {renderDifficultyBadge(book.difficultyValue, book.difficulty)}
                          </div>
                        </div>

                        {/* Reason / Advice Notes */}
                        {book.reason && (
                          <p className="text-xs text-slate-300/90 leading-relaxed bg-slate-950/40 p-3 rounded-2xl border border-slate-800/50 line-clamp-3">
                            "{book.reason}"
                          </p>
                        )}
                      </div>

                      {/* CTA Button: Add to Resource Tracker */}
                      <div className="pt-3 border-t border-slate-800/80">
                        <button
                          onClick={() => handleToggleBookFollow(book)}
                          className={`w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                            isAdded
                              ? 'bg-emerald-500/15 hover:bg-rose-500/15 border-emerald-500/40 hover:border-rose-500/40 text-emerald-300 hover:text-rose-300'
                              : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white border-indigo-500/50 shadow-lg shadow-indigo-600/20'
                          }`}
                        >
                          {isAdded ? (
                            <>
                              <Check className="w-4 h-4" />
                              <span>Kaynaklarımda Ekli (Kaldır)</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-4 h-4" />
                              <span>Kaynaklarıma Ekle</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              // TABLE VIEW (BOOKS)
              <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-900/60 shadow-xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/80 text-xs font-bold text-slate-400">
                      <th className="py-4 px-4 w-12 text-center">#</th>
                      <th className="py-4 px-4">Ders / Tür</th>
                      <th className="py-4 px-4">Yayınevi</th>
                      <th className="py-4 px-4">Kaynak Adı</th>
                      <th className="py-4 px-4">Zorluk</th>
                      <th className="py-4 px-4">İçerik & Tavsiye</th>
                      <th className="py-4 px-4 text-center">Popüler</th>
                      <th className="py-4 px-4 text-center">Favori</th>
                      <th className="py-4 px-4 text-right">İşlem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-xs text-slate-300">
                    {displayedBooks.map((book, index) => {
                      const isAdded = isBookAdded(book.publisher, book.name);
                      const bookKey = `${book.publisher} - ${book.name}`;
                      const isFav = favoriteBooks.includes(bookKey);
                      const color = SUBJECT_COLORS[book.subject] || { bg: 'bg-slate-800', text: 'text-slate-300', border: 'border-slate-700', glow: '' };

                      return (
                        <tr key={`${book.publisher}-${book.name}-${index}`} className="hover:bg-slate-900 transition-colors group">
                          <td className="py-3.5 px-4 text-center font-bold text-slate-500">{index + 1}</td>
                          <td className="py-3.5 px-4">
                            <div className="flex flex-col space-y-1">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border w-max ${color.bg} ${color.text} ${color.border}`}>
                                {book.subject}
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium">{book.category}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-white">{book.publisher}</td>
                          <td className="py-3.5 px-4 font-semibold text-slate-100">{book.name}</td>
                          <td className="py-3.5 px-4">{renderDifficultyBadge(book.difficultyValue, book.difficulty)}</td>
                          <td className="py-3.5 px-4 text-slate-400 max-w-xs leading-relaxed text-[11px]">{book.reason}</td>
                          <td className="py-3.5 px-4 text-center">
                            {book.isPopular ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[9px] font-black animate-pulse">
                                ⭐ Popüler
                              </span>
                            ) : (
                              <span className="text-slate-600">-</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <button
                              onClick={() => {
                                if (onToggleFavoriteBook) {
                                  onToggleFavoriteBook(bookKey);
                                  setSuccessToast(isFav ? `"${book.publisher} - ${book.name}" favorilerden çıkarıldı.` : `"${book.publisher} - ${book.name}" favorilere eklendi!`);
                                  setTimeout(() => setSuccessToast(null), 3000);
                                }
                              }}
                              className={`p-1.5 rounded-xl transition-all cursor-pointer border ${
                                isFav ? 'bg-rose-500/20 border-rose-500/40 text-rose-400' : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-rose-400'
                              }`}
                            >
                              <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}`} />
                            </button>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              {isTeacher && (
                                <button onClick={() => handleStartEditBook(book)} className="p-1.5 bg-slate-950 hover:bg-amber-500/20 text-amber-400 border border-slate-800 rounded-lg">
                                  <Pencil className="w-3 h-3" />
                                </button>
                              )}
                              {isTeacher && (
                                <button onClick={() => { if (book.id) setDeletingItem({ id: book.id, name: `${book.publisher} - ${book.name}`, type: 'book' }); }} className="p-1.5 bg-slate-950 hover:bg-rose-500/20 text-rose-400 border border-slate-800 rounded-lg">
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                              <button
                                onClick={() => handleToggleBookFollow(book)}
                                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all border cursor-pointer ${
                                  isAdded
                                    ? 'bg-emerald-500/10 hover:bg-rose-500/10 border-emerald-500/30 text-emerald-400 hover:text-rose-400'
                                    : 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-500'
                                }`}
                              >
                                {isAdded ? 'Kaynaklarımda' : 'Kaynağa Ekle'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            <div className="text-center py-16 border border-dashed border-slate-800 rounded-3xl bg-slate-900/30 space-y-3">
              <BookMarked className="w-10 h-10 text-slate-600 mx-auto animate-pulse" />
              <p className="text-sm font-bold text-slate-300">Aramanıza veya filtrelerinize uygun kaynak kitap bulunamadı.</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('Tümü');
                  setDifficultyFilter('all');
                  setShowOnlyPopular(false);
                  setShowOnlyFollowed(false);
                  setShowOnlyFavorites(false);
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs text-white font-bold rounded-xl transition-all cursor-pointer"
              >
                Tüm Filtreleri Temizle
              </button>
            </div>
          )
        )}
      </div>

      {/* SMART STUDY TIPS CARD */}
      <div className="bg-gradient-to-r from-purple-950/20 via-slate-900 to-indigo-950/20 border border-slate-800 p-5 sm:p-6 rounded-3xl flex flex-col md:flex-row items-center gap-4 shadow-xl">
        <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 ${
          activeTab === 'youtube' 
            ? 'bg-red-500/10 border-red-500/30 text-red-400' 
            : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
        }`}>
          <Award className="w-6 h-6" />
        </div>
        <div className="space-y-1 text-center md:text-left">
          <h4 className="text-sm font-bold text-white flex items-center justify-center md:justify-start gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>{activeTab === 'youtube' ? 'YouTube Kanal Takip Stratejisi' : 'Kaynak Kitap ve Çalışma Takip Entegrasyonu'}</span>
          </h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            {activeTab === 'youtube' ? (
              <span>Takip listesine eklediğiniz kanallar otomatik olarak <strong>YouTube Takip Listenize</strong> eklenir; kampları ve ders videolarını izleme durumunuzla birlikte oradan takip edebilirsiniz.</span>
            ) : (
              <span>Önerilen kaynakları <strong>"Kaynaklarıma Ekle"</strong> butonuyla doğrudan <strong>Kaynak Takip Listesi</strong> sayfanıza aktarabilir, ünite/test sayılarını belirleyip günlük çalışma programınızda çözüldü olarak işaretleyebilirsiniz.</span>
            )}
          </p>
        </div>
      </div>

      {/* Add YouTube Channel Modal */}
      {showAddChannelModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in"
          onClick={(e) => { if (e.target === e.currentTarget) { setShowAddChannelModal(false); setEditingChannel(null); } }}
        >
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
              <h3 className="font-bold text-white flex items-center space-x-2 text-sm">
                <Youtube className="w-5 h-5 text-red-500" />
                <span>{editingChannel ? 'YouTube Kanalını Düzenle' : 'Yeni YouTube Kanal Önerisi Ekle'}</span>
              </h3>
              <button 
                onClick={() => {
                  setShowAddChannelModal(false);
                  resetChannelForm();
                }}
                className="text-slate-400 hover:text-white transition-colors text-xl font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleChannelSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Ders</label>
                <select
                  value={channelSubject}
                  onChange={(e) => setChannelSubject(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                >
                  {SUBJECTS.map(sub => (
                    <option key={sub.value} value={sub.value}>{sub.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Kanal Adı</label>
                <input
                  type="text"
                  required
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value)}
                  placeholder="Örn: Benim Hocam"
                  className="w-full bg-slate-800 border border-slate-700/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Abone Sayısı Metni</label>
                <input
                  type="text"
                  required
                  value={channelSubscribersText}
                  onChange={(e) => setChannelSubscribersText(e.target.value)}
                  placeholder="Örn: 1.2 Mn veya 450 B"
                  className="w-full bg-slate-800 border border-slate-700/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">YouTube URL</label>
                <input
                  type="url"
                  required
                  value={channelUrl}
                  onChange={(e) => setChannelUrl(e.target.value)}
                  placeholder="https://www.youtube.com/@..."
                  className="w-full bg-slate-800 border border-slate-700/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Kanal Logosu / Fotoğrafı (Opsiyonel)</label>
                <div className="flex items-center space-x-3 bg-slate-950 p-3 rounded-2xl border border-slate-800">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-900 border border-slate-700 shrink-0 flex items-center justify-center relative">
                    {avatarPreviewUrl ? (
                      <img 
                        src={avatarPreviewUrl} 
                        alt="Kanal Görseli" 
                        className="w-full h-full object-cover" 
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : null}
                    <div className="w-full h-full bg-slate-900 flex items-center justify-center text-red-500 absolute inset-0 z-0">
                      <Youtube className="w-6 h-6 text-red-500" />
                    </div>
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="file"
                        accept="image/*"
                        id="channel-avatar-input"
                        onChange={handleAvatarFileSelect}
                        className="hidden"
                      />
                      <label
                        htmlFor="channel-avatar-input"
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer border border-slate-700"
                      >
                        <Upload className="w-3.5 h-3.5 text-red-400" />
                        <span>{avatarFile ? 'Görseli Değiştir' : 'Özel Fotoğraf Yükle'}</span>
                      </label>
                      <button
                        type="button"
                        disabled={isFetchingApiAvatar}
                        onClick={handleFetchAvatarFromApi}
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-red-950/60 hover:bg-red-900/80 text-red-300 hover:text-white rounded-lg text-xs font-bold transition-all border border-red-800/60 cursor-pointer"
                        title="YouTube kanal sayfasından / API servisinden resmi profil resmini çeker"
                      >
                        {isFetchingApiAvatar ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-red-400" />
                        ) : (
                          <Globe className="w-3.5 h-3.5 text-red-400" />
                        )}
                        <span>{isFetchingApiAvatar ? 'Çekiliyor...' : 'YouTube\'dan Çek (API)'}</span>
                      </button>
                    </div>
                    {avatarCompressionStats ? (
                      <p className="text-[10px] text-emerald-400 font-bold">
                        ⚡ Sıkıştırıldı: ~{avatarCompressionStats.compressedKb} KB <span className="text-slate-500 font-normal">(Orijinal: {avatarCompressionStats.originalKb} KB)</span>
                      </p>
                    ) : (
                      <p className="text-[10px] text-slate-500">
                        Fotoğraflar YouTube API veya özel dosya ile yüklenebilir.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  disabled={isUploadingAvatar}
                  onClick={() => {
                    setShowAddChannelModal(false);
                    resetChannelForm();
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isUploadingAvatar}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-red-600/10 flex items-center space-x-1.5 cursor-pointer"
                >
                  {isUploadingAvatar ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Yükleniyor...</span>
                    </>
                  ) : (
                    <span>{editingChannel ? 'Değişiklikleri Kaydet' : 'Kanalı Ekle'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Resource Book Modal */}
      {showAddBookModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in"
          onClick={(e) => { if (e.target === e.currentTarget) { setShowAddBookModal(false); setEditingBook(null); } }}
        >
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
              <h3 className="font-bold text-white flex items-center space-x-2 text-sm">
                <BookOpen className="w-5 h-5 text-indigo-500" />
                <span>{editingBook ? 'Kaynak Kitap Önerisini Düzenle' : 'Yeni Kaynak Kitap Önerisi Ekle'}</span>
              </h3>
              <button 
                onClick={() => {
                  setShowAddBookModal(false);
                  resetBookForm();
                }}
                className="text-slate-400 hover:text-white transition-colors text-xl font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleBookSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Ders</label>
                  <select
                    value={bookSubject}
                    onChange={(e) => {
                      const val = e.target.value;
                      setBookSubject(val);
                      if (!editingBook) {
                        if (val === 'Dil') setBookCategory('Kelime');
                        else if (val === 'Türkçe') setBookCategory('TYT Türkçe');
                        else setBookCategory(`TYT ${val}`);
                      }
                    }}
                    className="w-full bg-slate-800 border border-slate-700/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    {SUBJECTS.map(sub => (
                      <option key={sub.value} value={sub.value}>{sub.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Sınav / Kategori</label>
                  <input
                    type="text"
                    required
                    value={bookCategory}
                    onChange={(e) => setBookCategory(e.target.value)}
                    placeholder="Örn: Kelime, Gramer, Skills, Okuma, Deneme, TYT vb."
                    className="w-full bg-slate-800 border border-slate-700/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Yayınevi</label>
                <input
                  type="text"
                  required
                  value={bookPublisher}
                  onChange={(e) => setBookPublisher(e.target.value)}
                  placeholder="Örn: Bilgi Sarmal, 3D"
                  className="w-full bg-slate-800 border border-slate-700/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Kaynak Adı</label>
                <input
                  type="text"
                  required
                  value={bookName}
                  onChange={(e) => setBookName(e.target.value)}
                  placeholder="Örn: TYT Matematik Soru Bankası"
                  className="w-full bg-slate-800 border border-slate-700/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Zorluk Seviyesi</label>
                  <select
                    value={bookDifficulty}
                    onChange={(e) => {
                      const val = e.target.value;
                      setBookDifficulty(val);
                      let score = 3;
                      if (val.includes('Kolay-Orta')) score = 2;
                      else if (val.includes('Kolay')) score = 1;
                      else if (val.includes('Orta-Zor')) score = 4;
                      else if (val.includes('Zor')) score = 5;
                      setBookDifficultyValue(score);
                    }}
                    className="w-full bg-slate-800 border border-slate-700/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="⭐☆☆☆☆ (Kolay)">⭐☆☆☆☆ (Kolay)</option>
                    <option value="⭐⭐☆☆☆ (Kolay-Orta)">⭐⭐☆☆☆ (Kolay-Orta)</option>
                    <option value="⭐⭐⭐☆☆ (Orta)">⭐⭐⭐☆☆ (Orta)</option>
                    <option value="⭐⭐⭐⭐☆ (Orta-Zor)">⭐⭐⭐⭐☆ (Orta-Zor)</option>
                    <option value="⭐⭐⭐⭐⭐ (Zor)">⭐⭐⭐⭐⭐ (Zor)</option>
                  </select>
                </div>
                <div className="flex items-center h-full pt-6">
                  <label className="flex items-center space-x-2 cursor-pointer text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={bookIsPopular}
                      onChange={(e) => setBookIsPopular(e.target.checked)}
                      className="rounded border-slate-700 text-indigo-600 bg-slate-800 focus:ring-indigo-500"
                    />
                    <span>Popüler mi?</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Tercih Nedeni</label>
                <textarea
                  required
                  value={bookReason}
                  onChange={(e) => setBookReason(e.target.value)}
                  placeholder="Neden tavsiye ediliyor..."
                  rows={3}
                  className="w-full bg-slate-800 border border-slate-700/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddBookModal(false);
                    resetBookForm();
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/10 cursor-pointer"
                >
                  {editingBook ? 'Değişiklikleri Kaydet' : 'Kitabı Ekle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2-Step Confirmation Modal for Recommendations Deletion */}
      <ConfirmDeleteModal
        isOpen={!!deletingItem}
        title={deletingItem?.type === 'channel' ? "Tavsiye Kanalı Sil" : "Tavsiye Kitabı Sil"}
        itemName={deletingItem?.name}
        onConfirm={async () => {
          if (deletingItem) {
            const id = deletingItem.id;
            const type = deletingItem.type;
            const name = deletingItem.name;
            const isDefault = id.startsWith('def-chan-') || id.startsWith('def-book-');
            let oldState: any = null;

            if (isDefault) {
              if (type === 'channel') {
                oldState = defaultChannelsWithIds.find(c => c.id === id);
              } else {
                oldState = defaultBooksWithIds.find(b => b.id === id);
              }
            } else {
              if (type === 'channel') {
                oldState = (customRecommendations?.channels || []).find(c => c.id === id);
              } else {
                oldState = (customRecommendations?.books || []).find(b => b.id === id);
              }
            }

            if (isDefault) {
              if (type === 'channel') {
                if (oldState) {
                  await saveRecommendationToFirestore({
                    ...oldState,
                    id,
                    type: 'channel',
                    isDeleted: true
                  });
                }
              } else {
                if (oldState) {
                  await saveRecommendationToFirestore({
                    ...oldState,
                    id,
                    type: 'book',
                    isDeleted: true
                  });
                }
              }
            } else {
              await deleteRecommendationFromFirestore(id);
            }

            if (onAddAuditLog) {
              onAddAuditLog(
                `${currentUser?.name || 'Kullanıcı'}, "${name}" adlı ${type === 'channel' ? 'YouTube kanalı' : 'kaynak kitap'} tavsiyesini sildi.`,
                'management',
                type === 'channel' ? 'DELETE_REC_CHANNEL' : 'DELETE_REC_BOOK',
                async () => {
                  if (isDefault) {
                    if (oldState) {
                      await saveRecommendationToFirestore({
                        ...oldState,
                        type,
                        isDeleted: false
                      });
                    }
                  } else {
                    if (oldState) {
                      await saveRecommendationToFirestore(oldState);
                    }
                  }
                }
              );
            }

            setSuccessToast(type === 'channel' 
              ? `"${name}" kanalı tavsiyelerden kaldırıldı.`
              : `"${name}" kitabı tavsiyelerden kaldırıldı.`
            );
            setTimeout(() => setSuccessToast(null), 3000);
            setDeletingItem(null);
          }
        }}
        onClose={() => setDeletingItem(null)}
      />

      {/* 2-Step Confirmation Modal for Unfollowing Book from Recommendations */}
      <ConfirmDeleteModal
        isOpen={!!unfollowBookItem}
        title="Kaynaklarımdan Kaldır"
        itemName={unfollowBookItem?.name}
        onConfirm={() => {
          if (unfollowBookItem && onDeleteResource) {
            onDeleteResource(unfollowBookItem.id);
            setSuccessToast(`"${unfollowBookItem.name}" kaynak takip listenizden çıkarıldı.`);
            setTimeout(() => setSuccessToast(null), 3000);
            setUnfollowBookItem(null);
          }
        }}
        onClose={() => setUnfollowBookItem(null)}
      />

      {/* 2-Step Confirmation Modal for Unfollowing Channel from Recommendations */}
      <ConfirmDeleteModal
        isOpen={!!unfollowChannelItem}
        title="Takip Listesinden Kaldır"
        itemName={unfollowChannelItem?.name}
        onConfirm={() => {
          if (unfollowChannelItem && onDeleteVideo) {
            onDeleteVideo(unfollowChannelItem.id);
            setSuccessToast(`"${unfollowChannelItem.name}" kanalı takip listenizden çıkarıldı.`);
            setTimeout(() => setSuccessToast(null), 3000);
            setUnfollowChannelItem(null);
          }
        }}
        onClose={() => setUnfollowChannelItem(null)}
      />

    </div>
  );
};
