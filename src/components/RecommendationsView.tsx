import React, { useState } from 'react';
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
  Globe
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
  { subject: 'Felsefe', name: 'Can Köni', subscribersText: '98.4 B', subscribersCount: 98400, url: 'https://www.youtube.com/@CanKoni' }
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
  { value: 'Matematik', label: 'Matematik' },
  { value: 'Geometri', label: 'Geometri' },
  { value: 'Türkçe', label: 'Türkçe' },
  { value: 'Fizik', label: 'Fizik' },
  { value: 'Kimya', label: 'Kimya' },
  { value: 'Biyoloji', label: 'Biyoloji' },
  { value: 'Tarih', label: 'Tarih' },
  { value: 'Coğrafya', label: 'Coğrafya' },
  { value: 'Felsefe', label: 'Felsefe' }
];

const SUBJECT_COLORS: Record<string, { bg: string, text: string, border: string }> = {
  'Matematik': { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  'Geometri': { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  'Türkçe': { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
  'Fizik': { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/20' },
  'Kimya': { bg: 'bg-teal-500/10', text: 'text-teal-400', border: 'border-teal-500/20' },
  'Biyoloji': { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20' },
  'Tarih': { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' },
  'Coğrafya': { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20' },
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
  const [activeTab, setActiveTab] = useState<'youtube' | 'books'>('youtube');
  const [selectedSubject, setSelectedSubject] = useState<string>('Matematik');
  const [selectedExamType, setSelectedExamType] = useState<'Tümü' | 'TYT' | 'AYT'>('Tümü');
  const [showOnlyFollowed, setShowOnlyFollowed] = useState<boolean>(false);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState<boolean>(false);
  const [channelSortOrder, setChannelSortOrder] = useState<'desc' | 'asc'>('desc');
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
      const data = await res.json();
      if (data.success && data.avatarUrl) {
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
    } catch (err) {
      alert('Görsel sıkıştırılırken bir hata oluştu.');
    }
  };

  const resetBookForm = () => {
    setBookSubject('Matematik');
    setBookCategory('TYT Matematik');
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
    // Explicitly preserve or reconstruct the ID to prevent editing from creating duplicates
    let bookId = editingBook?.id;
    const isEdit = !!editingBook;
    const oldState = editingBook ? { ...editingBook } : null;

    if (editingBook && !bookId) {
      // Reconstruct ID for default book if it is somehow missing
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
        examType: book.category.includes('AYT') ? 'AYT' : 'TYT',
        notes: `Tavsiyelerden eklendi: Seviye: ${book.difficulty}. ${book.reason}`
      });
      setSuccessToast(`"${book.publisher} - ${book.name}" kaynağı başarıyla kaynaklarınıza eklendi!`);
      setTimeout(() => setSuccessToast(null), 3000);
    }
  };

  // --- Filtering & Sorting ---
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

  const displayedChannels = allChannels.filter(channel => {
    if (showOnlyFollowed) {
      return isChannelAdded(channel.name);
    } else {
      return channel.subject === selectedSubject;
    }
  }).sort((a, b) => {
    const valA = parseSubscriberTextToNumber(a.subscribersText);
    const valB = parseSubscriberTextToNumber(b.subscribersText);
    return channelSortOrder === 'desc' ? valB - valA : valA - valB;
  });

  const displayedBooks = allBooks.filter(book => {
    const bookKey = `${book.publisher} - ${book.name}`;
    const isFav = favoriteBooks.includes(bookKey);

    if (showOnlyFavorites) {
      if (!isFav) return false;
      const matchesSubject = book.subject === selectedSubject;
      if (!matchesSubject) return false;
      if (selectedExamType === 'TYT') {
        return book.category.includes('TYT');
      }
      if (selectedExamType === 'AYT') {
        return book.category.includes('AYT');
      }
      return true;
    }

    if (showOnlyFollowed) {
      return isBookAdded(book.publisher, book.name);
    } else {
      const matchesSubject = book.subject === selectedSubject;
      if (!matchesSubject) return false;
      if (selectedExamType === 'TYT') {
        return book.category.includes('TYT');
      }
      if (selectedExamType === 'AYT') {
        return book.category.includes('AYT');
      }
      return true;
    }
  }).sort((a, b) => a.difficultyValue - b.difficultyValue);

  const totalFollowedChannels = allChannels.filter(c => isChannelAdded(c.name)).length;
  const totalFollowedBooks = allBooks.filter(b => isBookAdded(b.publisher, b.name)).length;
  const totalFavoriteBooks = allBooks.filter(b => favoriteBooks.includes(`${b.publisher} - ${b.name}`)).length;

  return (
    <div className="space-y-6">
      
      {/* Toast Alert */}
      {successToast && (
        <div className="fixed top-20 right-6 z-50 animate-fade-in bg-indigo-950/90 border border-indigo-500/40 text-indigo-100 px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-2 text-xs font-semibold backdrop-blur-md">
          <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800/80 animate-fade-in">
        <div className="flex-1">
          <h1 id="recommendations-title" className="text-xl sm:text-2xl font-black text-white flex items-center space-x-2">
            <Sparkles className="w-6 h-6 text-amber-400" />
            <span>YKS Kaynak & Eğitim Tavsiyeleri</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 flex flex-col md:flex-row md:items-center justify-between gap-2">
            <span>YKS yolculuğunda hedefine en uygun ders kanallarını ve en çok tercih edilen, seviyelendirilmiş kaynak kitap önerilerini incele.</span>
            <span className="text-[10px] text-slate-500 italic shrink-0">Abone Sayısı Güncelleme: 30 Temmuz 2026</span>
          </p>
        </div>
        {isTeacher && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                resetChannelForm();
                setShowAddChannelModal(true);
              }}
              className="inline-flex items-center space-x-1.5 px-3 py-2 bg-red-600 hover:bg-red-500 text-xs font-bold text-white rounded-xl shadow-lg shadow-red-600/15 transition-all border border-red-500/40"
            >
              <Youtube className="w-4 h-4" />
              <span>YouTube Kaynağı Ekle</span>
            </button>
            <button
              onClick={() => {
                resetBookForm();
                setShowAddBookModal(true);
              }}
              className="inline-flex items-center space-x-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white rounded-xl shadow-lg shadow-indigo-600/15 transition-all border border-indigo-500/40"
            >
              <BookOpen className="w-4 h-4" />
              <span>Kitap Kaynağı Ekle</span>
            </button>
          </div>
        )}
      </div>

      {/* SEGMENT CONTROL (Top Tab Selector) */}
      <div className="grid grid-cols-2 p-1.5 bg-slate-950 rounded-2xl border border-slate-800">
        <button
          onClick={() => {
            setActiveTab('youtube');
            setShowOnlyFollowed(false);
          }}
          className={`flex items-center justify-center space-x-2 py-3 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'youtube'
              ? 'bg-red-600 border border-red-500 text-white shadow-lg shadow-red-600/10'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Youtube className={`w-4 h-4 ${activeTab === 'youtube' ? 'animate-pulse' : ''}`} />
          <span>YouTube Kanalları</span>
        </button>
        <button
          onClick={() => {
            setActiveTab('books');
            setShowOnlyFollowed(false);
          }}
          className={`flex items-center justify-center space-x-2 py-3 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'books'
              ? 'bg-indigo-600 border border-indigo-500 text-white shadow-lg shadow-indigo-600/10'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Kaynak Kitap Önerileri</span>
        </button>
      </div>

      {/* Filter and Switch Row */}
      <div className="flex flex-col gap-4 bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-2xl shadow-xl backdrop-blur-md">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <label className="block text-[10px] uppercase tracking-widest font-extrabold text-slate-400">
              Ders Seçimi
            </label>
            <span className="text-[10px] text-slate-500 font-medium">Seçili Ders: <strong className="text-white font-bold">{selectedSubject}</strong></span>
          </div>
          <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-0.5 max-w-full">
            {SUBJECTS.map((sub) => {
              const isSelected = selectedSubject === sub.value && !showOnlyFollowed;
              return (
                <button
                  key={sub.value}
                  disabled={showOnlyFollowed}
                  onClick={() => {
                    setSelectedSubject(sub.value);
                    setShowOnlyFollowed(false);
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap border cursor-pointer shrink-0 ${
                    isSelected
                      ? activeTab === 'youtube'
                        ? 'bg-red-600 border-red-400 text-white shadow-lg shadow-red-600/30 scale-[1.02]'
                        : 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-600/30 scale-[1.02]'
                      : showOnlyFollowed
                      ? 'bg-slate-950/40 border-slate-850 text-slate-600 cursor-not-allowed'
                      : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                >
                  {sub.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <label className="text-[10px] uppercase tracking-widest font-extrabold text-slate-400 shrink-0">
              Sınav Türü:
            </label>
            <div className="grid grid-cols-3 p-1 bg-slate-950 rounded-xl border border-slate-800/80 w-full sm:w-56">
              {(['Tümü', 'TYT', 'AYT'] as const).map((type) => (
                <button
                  key={type}
                  id={`exam-type-${type.toLowerCase()}-btn`}
                  disabled={showOnlyFollowed}
                  onClick={() => setSelectedExamType(type)}
                  className={`py-1.5 px-3 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    showOnlyFollowed
                      ? 'text-slate-600 cursor-not-allowed'
                      : selectedExamType === type
                        ? activeTab === 'youtube'
                          ? 'bg-red-600 text-white shadow-md shadow-red-600/10'
                          : 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
                        : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
          {activeTab === 'books' && (
            <button
              onClick={() => {
                setShowOnlyFavorites(!showOnlyFavorites);
                if (!showOnlyFavorites) {
                  setShowOnlyFollowed(false);
                }
              }}
              className={`flex-1 sm:flex-initial flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                showOnlyFavorites
                  ? 'bg-rose-600 border-rose-500 text-white font-semibold shadow-md shadow-rose-600/20'
                  : 'bg-slate-800/80 border-slate-700/60 text-slate-400 hover:text-white hover:border-slate-600'
              }`}
            >
              <Heart className={`w-4 h-4 ${showOnlyFavorites ? 'fill-current text-white animate-pulse' : 'text-rose-400'}`} />
              <span>
                Favori Listem ({totalFavoriteBooks})
              </span>
            </button>
          )}

          <button
            onClick={() => {
              setShowOnlyFollowed(!showOnlyFollowed);
              if (!showOnlyFollowed) {
                setShowOnlyFavorites(false);
              }
            }}
            className={`flex-1 sm:flex-initial flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${
              showOnlyFollowed
                ? activeTab === 'youtube'
                  ? 'bg-rose-600 border-rose-500 text-white font-semibold shadow-md shadow-rose-600/20'
                  : 'bg-indigo-600 border-indigo-500 text-white font-semibold shadow-md shadow-indigo-600/20'
                : 'bg-slate-800/80 border-slate-700/60 text-slate-400 hover:text-white hover:border-slate-600'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${showOnlyFollowed ? 'fill-current' : 'text-slate-400'}`} />
            <span>
              Sadece Takip Listem ({activeTab === 'youtube' ? totalFollowedChannels : totalFollowedBooks})
            </span>
          </button>
        </div>
      </div>
    </div>

      {/* Main Content Area */}
      <div className="space-y-4">
        {activeTab === 'youtube' ? (
          // YOUTUBE CHANNELS LIST
          displayedChannels.length > 0 ? (
            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/40">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/80 text-xs font-semibold text-slate-400">
                    <th className="py-4 px-4 w-12 text-center">#</th>
                    <th className="py-4 px-4">Ders</th>
                    <th className="py-4 px-4">Kanal Adı</th>
                    <th 
                      onClick={() => setChannelSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                      className="py-4 px-4 text-right cursor-pointer hover:text-white transition-colors select-none"
                    >
                      <div className="inline-flex items-center space-x-1 justify-end">
                        <span>Abone Sayısı</span>
                        <span className="text-[10px] text-indigo-400 font-bold">{channelSortOrder === 'desc' ? '▼' : '▲'}</span>
                      </div>
                    </th>
                    <th className="py-4 px-4 text-center">Yönlendir</th>
                    <th className="py-4 px-4 text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs text-slate-300">
                  {displayedChannels.map((channel, index) => {
                    const isAdded = isChannelAdded(channel.name);
                    const color = SUBJECT_COLORS[channel.subject] || { bg: 'bg-slate-800', text: 'text-slate-300', border: 'border-slate-700' };

                    return (
                      <tr 
                        key={`${channel.id || channel.name}-${channel.avatarUrl || ''}`}
                        className="hover:bg-slate-900/60 transition-colors group"
                      >
                        <td className="py-3.5 px-4 text-center font-bold text-slate-500">
                          {index + 1}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${color.bg} ${color.text} ${color.border}`}>
                            {channel.subject}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-white group-hover:text-red-400 transition-colors">
                          <div className="flex items-center space-x-3">
                            <a
                              href={channel.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-9 h-9 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shrink-0 relative flex items-center justify-center shadow-md group-hover:scale-105 transition-transform"
                              title={`${channel.name} kanalına git`}
                            >
                              {(() => {
                                const avatarSrc = getChannelAvatar(channel);
                                return (
                                  <div className="w-full h-full relative flex items-center justify-center">
                                    {avatarSrc ? (
                                      <img
                                        key={avatarSrc}
                                        src={avatarSrc}
                                        alt={channel.name}
                                        loading="lazy"
                                        className="w-full h-full object-cover absolute inset-0 z-10 rounded-xl"
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
                                    <div className="w-full h-full bg-gradient-to-br from-red-900/80 to-rose-950/90 flex items-center justify-center text-red-400 font-bold text-xs z-0">
                                      <Youtube className="w-4 h-4 text-red-500" />
                                    </div>
                                  </div>
                                );
                              })()}
                            </a>
                            <a
                              href={channel.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-bold text-xs text-white hover:text-red-400 transition-colors truncate"
                            >
                              {channel.name}
                            </a>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right font-medium text-slate-200">
                          <div className="inline-flex items-center space-x-1 justify-end">
                            <TrendingUp className="w-3.5 h-3.5 text-slate-500" />
                            <span>{channel.subscribersText}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <a 
                            href={channel.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all border border-slate-700/50"
                            title="Kanala Git"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            {isTeacher && (
                              <button
                                onClick={() => handleStartEditChannel(channel)}
                                className="p-2 bg-slate-800 hover:bg-amber-500/20 text-amber-400 hover:text-amber-300 border border-slate-700/60 hover:border-amber-500/30 rounded-xl transition-all"
                                title="Kanalı Düzenle"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {isTeacher && (
                              <button
                                onClick={() => {
                                  if (channel.id) {
                                    setDeletingItem({ id: channel.id, name: channel.name, type: 'channel' });
                                  }
                                }}
                                className="p-2 bg-slate-800 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-slate-700/60 hover:border-rose-500/30 rounded-xl transition-all"
                                title="Kanalı Tamamen Sil"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => handleToggleChannelFollow(channel)}
                              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all border ${
                                isAdded
                                  ? 'bg-emerald-500/10 hover:bg-rose-500/10 border-emerald-500/30 hover:border-rose-500/30 text-emerald-400 hover:text-rose-400'
                                  : 'bg-slate-800 hover:bg-red-600/10 hover:border-red-600/30 border-slate-700/60 text-slate-300 hover:text-red-400'
                              }`}
                            >
                              {isAdded ? (
                                <span className="flex items-center justify-end space-x-1">
                                  <Check className="w-3 h-3 group-hover:hidden" />
                                  <Trash2 className="w-3 h-3 hidden group-hover:inline text-rose-400" />
                                  <span className="group-hover:hidden">Takip Ediliyor</span>
                                  <span className="hidden group-hover:inline">Takipten Çıkar</span>
                                </span>
                              ) : (
                                <span className="flex items-center justify-end space-x-1">
                                  <Plus className="w-3 h-3" />
                                  <span>Takip Et</span>
                                </span>
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16 border border-dashed border-slate-800 rounded-2xl bg-slate-900/20">
              <Heart className="w-8 h-8 text-slate-600 mx-auto mb-3 animate-pulse" />
              <p className="text-sm font-semibold text-slate-400">
                {showOnlyFollowed 
                  ? 'Takip listenizde henüz tavsiye edilen kanal bulunmuyor.' 
                  : 'Seçili derste henüz kanal bulunmuyor.'}
              </p>
              {showOnlyFollowed && (
                <button 
                  onClick={() => setShowOnlyFollowed(false)}
                  className="mt-4 inline-flex items-center space-x-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 hover:text-white font-bold rounded-xl transition-all border border-slate-700/50"
                >
                  <span>Tüm Kanalları Göster</span>
                </button>
              )}
            </div>
          )
        ) : (
          // BOOKS RECOMMENDATIONS LIST
          displayedBooks.length > 0 ? (
            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/40">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/80 text-xs font-semibold text-slate-400">
                    <th className="py-4 px-4 w-12 text-center">#</th>
                    <th className="py-4 px-4">Ders / Tür</th>
                    <th className="py-4 px-4">Yayınevi</th>
                    <th className="py-4 px-4">Kaynak Adı</th>
                    <th className="py-4 px-4">Zorluk Seviyesi</th>
                    <th className="py-4 px-4">İçerik & Tercih Nedeni</th>
                    <th className="py-4 px-4 text-center">Popüler</th>
                    <th className="py-4 px-4 text-center">Favori</th>
                    <th className="py-4 px-4 text-right">Takip</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs text-slate-300">
                  {displayedBooks.map((book, index) => {
                    const isAdded = isBookAdded(book.publisher, book.name);
                    const bookKey = `${book.publisher} - ${book.name}`;
                    const isFav = favoriteBooks.includes(bookKey);
                    const color = SUBJECT_COLORS[book.subject] || { bg: 'bg-slate-800', text: 'text-slate-300', border: 'border-slate-700' };

                    return (
                      <tr 
                        key={`${book.publisher}-${book.name}-${index}`}
                        className="hover:bg-slate-900/60 transition-colors group"
                      >
                        <td className="py-3.5 px-4 text-center font-bold text-slate-500">
                          {index + 1}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col space-y-1">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border w-max ${color.bg} ${color.text} ${color.border}`}>
                              {book.subject}
                            </span>
                            <span className="text-[10px] text-slate-500 font-medium">
                              {book.category}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-white">
                          {book.publisher}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-100">
                          {book.name}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="text-amber-400 font-medium whitespace-nowrap">
                            {book.difficulty}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-400 max-w-xs leading-relaxed text-[11px]">
                          {book.reason}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {book.isPopular ? (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] font-black tracking-wider animate-pulse">
                              En Çok Tercih Edilen ⭐
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
                            className="p-1.5 rounded-xl bg-slate-800/60 hover:bg-rose-500/10 border border-slate-700/50 hover:border-rose-500/30 text-slate-400 hover:text-rose-500 transition-all inline-flex items-center justify-center"
                            title={isFav ? "Favorilerden Kaldır" : "Favorilere Ekle"}
                          >
                            <Heart className={`w-4 h-4 ${isFav ? "fill-rose-500 text-rose-500" : ""}`} />
                          </button>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            {isTeacher && (
                              <button
                                onClick={() => handleStartEditBook(book)}
                                className="p-2 bg-slate-800 hover:bg-amber-500/20 text-amber-400 hover:text-amber-300 border border-slate-700/60 hover:border-amber-500/30 rounded-xl transition-all"
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
                                className="p-2 bg-slate-800 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-slate-700/60 hover:border-rose-500/30 rounded-xl transition-all"
                                title="Kitabı Tamamen Sil"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => handleToggleBookFollow(book)}
                              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all border ${
                                isAdded
                                  ? 'bg-emerald-500/10 hover:bg-rose-500/10 border-emerald-500/30 hover:border-rose-500/30 text-emerald-400 hover:text-rose-400'
                                  : 'bg-slate-800 hover:bg-indigo-600/10 hover:border-indigo-600/30 border-slate-700/60 text-slate-300 hover:text-indigo-400'
                              }`}
                            >
                              {isAdded ? (
                                <span className="flex items-center justify-end space-x-1">
                                  <Check className="w-3 h-3 group-hover:hidden" />
                                  <Trash2 className="w-3 h-3 hidden group-hover:inline text-rose-400" />
                                  <span className="group-hover:hidden">Kaynaklarımda</span>
                                  <span className="hidden group-hover:inline">Kaynaktan Kaldır</span>
                                </span>
                              ) : (
                                <span className="flex items-center justify-end space-x-1">
                                  <Plus className="w-3 h-3" />
                                  <span>Kaynağa Ekle</span>
                                </span>
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16 border border-dashed border-slate-800 rounded-2xl bg-slate-900/20">
              <Bookmark className="w-8 h-8 text-slate-600 mx-auto mb-3 animate-pulse" />
              <p className="text-sm font-semibold text-slate-400">
                {showOnlyFollowed 
                  ? 'Takip listenizde henüz tavsiye edilen kaynak kitap bulunmuyor.' 
                  : 'Seçili derste henüz kaynak kitap önerisi bulunmuyor.'}
              </p>
              {showOnlyFollowed && (
                <button 
                  onClick={() => setShowOnlyFollowed(false)}
                  className="mt-4 inline-flex items-center space-x-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 hover:text-white font-bold rounded-xl transition-all border border-slate-700/50"
                >
                  <span>Tüm Kitapları Göster</span>
                </button>
              )}
            </div>
          )
        )}
      </div>

      {/* Smart Study Tips Card */}
      <div className="bg-gradient-to-r from-indigo-950/20 via-slate-900 to-indigo-950/20 border border-slate-800/80 p-5 rounded-2xl flex flex-col md:flex-row items-center gap-4">
        <div className={`w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 ${
          activeTab === 'youtube' 
            ? 'bg-red-500/10 border-red-500/30 text-red-400' 
            : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
        }`}>
          <Award className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-yellow-500 animate-pulse" />
            <span>{activeTab === 'youtube' ? 'Kanal Seçim Stratejisi' : 'Kaynak Kitap Seçim Stratejisi'}</span>
          </h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            {activeTab === 'youtube' ? (
              <span>Takip listesine eklediğiniz kanallar otomatik olarak <strong>YouTube Takip Listenize</strong> eklenir ve kamplarını, ders videolarını, oynatma listelerini izleme durumunuzla birlikte oradan takip edebilirsiniz!</span>
            ) : (
              <span>Önerilen kaynaklardan beğendiklerinizi <strong>"Kaynağa Ekle"</strong> butonuyla doğrudan <strong>Kaynak Takip Listesi</strong> sayfanıza ekleyebilir, ünite/test sayılarını belirleyip günlük çalışma programınızda çözüldü olarak işaretleyebilirsiniz!</span>
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
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
              <h3 className="font-bold text-white flex items-center space-x-2">
                <Youtube className="w-5 h-5 text-red-500" />
                <span>{editingChannel ? 'YouTube Kanalını Düzenle' : 'Yeni YouTube Kanal Önerisi Ekle'}</span>
              </h3>
              <button 
                onClick={() => {
                  setShowAddChannelModal(false);
                  resetChannelForm();
                }}
                className="text-slate-400 hover:text-white transition-colors text-xl font-bold"
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
                  className="w-full bg-slate-800 border border-slate-700/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500 animate-none"
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
                <div className="flex items-center space-x-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
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
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-red-950/60 hover:bg-red-900/80 text-red-300 hover:text-white rounded-lg text-xs font-bold transition-all border border-red-800/60"
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
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isUploadingAvatar}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-red-600/10 flex items-center space-x-1.5"
                >
                  {isUploadingAvatar ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Sıkıştırılıyor & Yükleniyor...</span>
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
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
              <h3 className="font-bold text-white flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-indigo-500" />
                <span>{editingBook ? 'Kaynak Kitap Önerisini Düzenle' : 'Yeni Kaynak Kitap Önerisi Ekle'}</span>
              </h3>
              <button 
                onClick={() => {
                  setShowAddBookModal(false);
                  resetBookForm();
                }}
                className="text-slate-400 hover:text-white transition-colors text-xl font-bold"
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
                    onChange={(e) => setBookSubject(e.target.value)}
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
                    placeholder="Örn: TYT Matematik"
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
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/10"
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
