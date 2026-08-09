import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Trash2, 
  Search, 
  MessageSquare, 
  CheckSquare, 
  Square, 
  User, 
  Image as ImageIcon, 
  AlertCircle, 
  CheckCircle2, 
  X, 
  Clock,
  ArrowRight,
  ShieldAlert,
  Loader2,
  Calendar,
  Send,
  Megaphone,
  Users,
  Paperclip,
  GraduationCap,
  School,
  UploadCloud
} from 'lucide-react';
import { DirectMessage, UserAccount } from '../types';
import { uploadMessageAttachment } from '../services/storageUpload';

interface AdminMessageManagementProps {
  currentUser?: UserAccount;
  users?: UserAccount[];
  onSendMessage?: (receiverId: string, content: string, attachmentUrl?: string) => void;
}

export const AdminMessageManagement: React.FC<AdminMessageManagementProps> = ({
  currentUser,
  users = [],
  onSendMessage
}) => {
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  // Search and Filter State
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [roleFilter, setRoleFilter] = useState<string>('ALL'); // ALL, student, teacher, school_counselor, etc.
  const [hasAttachmentFilter, setHasAttachmentFilter] = useState<boolean>(false);

  // Broadcast Modal State
  const [showBroadcastModal, setShowBroadcastModal] = useState<boolean>(false);
  const [broadcastTarget, setBroadcastTarget] = useState<string>('broadcast-all');
  const [broadcastContent, setBroadcastContent] = useState<string>('');
  const [broadcastAttachmentUrl, setBroadcastAttachmentUrl] = useState<string>('');
  const [isUploadingBroadcastImage, setIsUploadingBroadcastImage] = useState<boolean>(false);
  const [sendingBroadcast, setSendingBroadcast] = useState<boolean>(false);
  const broadcastFileInputRef = useRef<HTMLInputElement>(null);

  // Deletion Confirmation Modal State
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    type: 'single' | 'bulk';
    targetId?: string;
  }>({
    isOpen: false,
    type: 'single'
  });

  // Preview Image Modal State
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  // Fetch all messages
  const fetchMessages = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/messages');
      const data = await res.json();
      if (data.success) {
        setMessages(data.messages || []);
      } else {
        setError(data.error || 'Mesajlar saptanırken bir hata oluştu.');
      }
    } catch (err: any) {
      console.error('Failed to fetch messages:', err);
      setError('Sistem bağlantı hatası: Mesajlar sunucudan yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  // Show a status notification with auto-dismiss
  const showNotification = (msg: string, isSuccess = true) => {
    if (isSuccess) {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(null), 4000);
    } else {
      setError(msg);
      setTimeout(() => setError(null), 5000);
    }
  };

  // Broadcast Image File Upload
  const handleBroadcastImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showNotification('Lütfen sadece resim dosyası seçin (JPG, PNG vb.)', false);
      return;
    }

    setIsUploadingBroadcastImage(true);
    try {
      const tempId = 'broadcast-img-' + Date.now();
      const uploadedUrl = await uploadMessageAttachment(file, tempId);
      setBroadcastAttachmentUrl(uploadedUrl);
      showNotification('Görsel eki eklendi.');
    } catch (err: any) {
      console.error('Failed to upload image:', err);
      showNotification('Görsel yüklenirken hata oluştu.', false);
    } finally {
      setIsUploadingBroadcastImage(false);
    }
  };

  // Handle Send Broadcast Message
  const handleSendBroadcast = async () => {
    if (!broadcastContent.trim() && !broadcastAttachmentUrl) {
      showNotification('Lütfen bir mesaj içeriği veya resim eki girin.', false);
      return;
    }

    setSendingBroadcast(true);
    try {
      if (onSendMessage) {
        onSendMessage(broadcastTarget, broadcastContent.trim(), broadcastAttachmentUrl || undefined);
        
        let targetLabel = 'Tüm Kayıtlı Kullanıcılara';
        if (broadcastTarget === 'broadcast-students') targetLabel = 'Tüm Öğrencilere';
        if (broadcastTarget === 'broadcast-teachers') targetLabel = 'Tüm Öğretmenlere';
        if (broadcastTarget === 'broadcast-counselors') targetLabel = 'Tüm Rehber Öğretmenlere';
        if (!broadcastTarget.startsWith('broadcast-')) {
          const u = users.find(usr => usr.id === broadcastTarget);
          if (u) targetLabel = `${u.name} Kullanıcısına`;
        }

        showNotification(`📢 Mesaj ${targetLabel} başarıyla gönderildi ve duyuru listesine eklendi!`);
        setBroadcastContent('');
        setBroadcastAttachmentUrl('');
        setShowBroadcastModal(false);

        setTimeout(() => fetchMessages(), 1000);
      } else {
        showNotification('Mesaj gönderme fonksiyonu tanımlı değil.', false);
      }
    } catch (err: any) {
      console.error('Broadcast failed:', err);
      showNotification('Mesaj gönderilirken bir sistem hatası oluştu.', false);
    } finally {
      setSendingBroadcast(false);
    }
  };

  // Handle single message delete
  const handleDeleteSingle = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/messages/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setMessages(prev => prev.filter(m => m.id !== id));
        setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
        showNotification('Mesaj ve ekli dosyası Firestore\'dan kalıcı olarak silindi.');
      } else {
        showNotification(data.error || 'Mesaj silinemedi.', false);
      }
    } catch (err) {
      console.error('Error deleting message:', err);
      showNotification('Ağ hatası nedeniyle mesaj silinemedi.', false);
    }
  };

  // Handle bulk delete
  const handleDeleteBulk = async () => {
    if (selectedIds.length === 0) return;
    try {
      const res = await fetch('/api/admin/messages/delete-bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ids: selectedIds })
      });
      const data = await res.json();
      if (data.success) {
        setMessages(prev => prev.filter(m => !selectedIds.includes(m.id)));
        showNotification(`${selectedIds.length} adet mesaj ve ilişkili dosyaları tamamen silindi.`);
        setSelectedIds([]);
      } else {
        showNotification(data.error || 'Toplu silme başarısız.', false);
      }
    } catch (err) {
      console.error('Error in bulk delete:', err);
      showNotification('Ağ hatası nedeniyle toplu silme işlemi tamamlanamadı.', false);
    }
  };

  // Execute Deletion after confirmation
  const confirmDeletion = () => {
    if (deleteModal.type === 'single' && deleteModal.targetId) {
      handleDeleteSingle(deleteModal.targetId);
    } else if (deleteModal.type === 'bulk') {
      handleDeleteBulk();
    }
    setDeleteModal({ isOpen: false, type: 'single' });
  };

  // Select / Deselect All visible messages
  const handleSelectAll = (visibleMessages: DirectMessage[]) => {
    const visibleIds = visibleMessages.map(m => m.id);
    const allSelected = visibleIds.every(id => selectedIds.includes(id));
    
    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !visibleIds.includes(id)));
    } else {
      const uniqueNewIds = Array.from(new Set([...selectedIds, ...visibleIds]));
      setSelectedIds(uniqueNewIds);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Filtering Logic
  const filteredMessages = useMemo(() => {
    const rawFiltered = messages.filter(msg => {
      const searchLower = searchTerm.toLowerCase();
      const contentMatch = (msg.content || '').toLowerCase().includes(searchLower);
      const senderMatch = (msg.senderName || '').toLowerCase().includes(searchLower);
      const receiverMatch = (msg.receiverName || '').toLowerCase().includes(searchLower);
      
      const roleMatch = roleFilter === 'ALL' || 
                        msg.senderRole === roleFilter || 
                        msg.receiverRole === roleFilter;

      const attachmentMatch = !hasAttachmentFilter || !!msg.attachmentUrl;

      return (contentMatch || senderMatch || receiverMatch) && roleMatch && attachmentMatch;
    });

    const seen = new Set<string>();
    return rawFiltered.filter(msg => {
      if (!msg.id) return true;
      if (seen.has(msg.id)) return false;
      seen.add(msg.id);
      return true;
    });
  }, [messages, searchTerm, roleFilter, hasAttachmentFilter]);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
      case 'school_counselor':
        return 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
      case 'class_teacher':
      case 'teacher':
        return 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20';
      case 'student':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      default:
        return 'bg-slate-800 text-slate-400 border border-slate-700';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Admin';
      case 'school_counselor': return 'Rehber Öğretmen';
      case 'class_teacher': return 'Sınıf Öğretmeni';
      case 'teacher': return 'Branş Öğretmeni';
      case 'student': return 'Öğrenci';
      default: return role || 'Kullanıcı';
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleString('tr-TR', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (_) {
      return isoString;
    }
  };

  return (
    <div className="space-y-6">
      {/* STATUS NOTIFICATIONS */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center justify-between animate-fade-in shadow-lg">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center justify-between animate-fade-in shadow-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* DASHBOARD TOP CONTROL BAR */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-md space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-indigo-400" />
              <span>Sistem Mesaj Trafiği & Dosya Yönetimi</span>
            </h3>
            <p className="text-xs text-slate-400">
              Sistemdeki tüm özel mesajları, gönderilen resimli dokümanları denetleyin ve eski / gereksiz dosyaları temizleyin.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowBroadcastModal(true)}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-indigo-600/20 border border-indigo-500/30 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Megaphone className="w-4 h-4 text-amber-300" />
              <span>📢 Herkese Mesaj Gönder (Toplu Duyuru)</span>
            </button>

            {selectedIds.length > 0 && (
              <button
                onClick={() => setDeleteModal({ isOpen: true, type: 'bulk' })}
                className="px-4 py-2.5 bg-rose-600/95 hover:bg-rose-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-rose-600/20 border border-rose-500/30 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Seçilenleri Sil ({selectedIds.length})</span>
              </button>
            )}

            <button
              onClick={fetchMessages}
              disabled={loading}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-900 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition-all flex items-center gap-2 cursor-pointer"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              <span>Yenile</span>
            </button>
          </div>
        </div>

        {/* SEARCH AND FILTERS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2">
          {/* Search Input */}
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Mesaj içeriği, gönderen veya alıcı adı ara..."
              className="w-full bg-slate-950 text-white placeholder-slate-500 text-xs pl-9 pr-4 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500 transition-all"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Role Filter */}
          <div className="md:col-span-3">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full bg-slate-950 text-slate-300 text-xs px-3 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500 transition-all cursor-pointer font-medium"
            >
              <option value="ALL">Tüm Rolleri Göster</option>
              <option value="student">Sadece Öğrenciler</option>
              <option value="school_counselor">Sadece Rehberlik</option>
              <option value="teacher">Sadece Branş Öğretmenleri</option>
              <option value="class_teacher">Sadece Sınıf Öğretmenleri</option>
            </select>
          </div>

          {/* Attachment Toggle Filter */}
          <div className="md:col-span-4 flex items-center">
            <button
              onClick={() => setHasAttachmentFilter(prev => !prev)}
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                hasAttachmentFilter
                  ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/50 shadow-md shadow-indigo-500/5'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-indigo-400" />
                <span>Sadece Fotoğraflı / Ekli Mesajlar</span>
              </div>
              <div className={`w-2.5 h-2.5 rounded-full ${hasAttachmentFilter ? 'bg-indigo-400' : 'bg-slate-800'}`} />
            </button>
          </div>
        </div>
      </div>

      {/* MESSAGES LIST TABLE */}
      {loading ? (
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-16 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
          <p className="text-slate-400 text-xs font-semibold">Tüm sistem veritabanı taranıyor, lütfen bekleyin...</p>
        </div>
      ) : filteredMessages.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-12 text-center space-y-3">
          <div className="w-12 h-12 bg-slate-800/50 rounded-2xl flex items-center justify-center text-slate-500 mx-auto">
            <MessageSquare className="w-6 h-6" />
          </div>
          <h4 className="font-bold text-white text-sm">Hiç Mesaj Bulunmadı</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {searchTerm || roleFilter !== 'ALL' || hasAttachmentFilter
              ? 'Aradığınız kriterlere uygun herhangi bir mesaj eşleşmedi. Filtreleri temizlemeyi deneyin.'
              : 'Veritabanında henüz kayıtlı bir sohbet mesajı bulunmuyor.'}
          </p>
          {(searchTerm || roleFilter !== 'ALL' || hasAttachmentFilter) && (
            <button
              onClick={() => {
                setSearchTerm('');
                setRoleFilter('ALL');
                setHasAttachmentFilter(false);
              }}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer inline-block"
            >
              Filtreleri Sıfırla
            </button>
          )}
        </div>
      ) : (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
          {/* Header Row */}
          <div className="bg-slate-950/70 border-b border-slate-800/80 px-6 py-4 flex items-center justify-between text-xs font-extrabold text-slate-400 select-none">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => handleSelectAll(filteredMessages)}
                className="text-slate-500 hover:text-white transition-colors cursor-pointer"
                title="Tümünü Seç / Kaldır"
              >
                {filteredMessages.every(m => selectedIds.includes(m.id)) ? (
                  <CheckSquare className="w-4 h-4 text-indigo-500" />
                ) : (
                  <Square className="w-4 h-4" />
                )}
              </button>
              <span>GÖNDEREN / ALICI</span>
            </div>
            <div className="hidden md:block">İÇERİK</div>
            <div className="flex items-center space-x-8">
              <span>TARİH</span>
              <span className="w-8"></span>
            </div>
          </div>

          {/* List Rows */}
          <div className="divide-y divide-slate-800/50">
            {filteredMessages.map(msg => {
              const isSelected = selectedIds.includes(msg.id);
              return (
                <div 
                  key={msg.id}
                  className={`px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
                    isSelected ? 'bg-indigo-600/5' : 'hover:bg-slate-800/20'
                  }`}
                >
                  {/* Sender / Receiver Card Column */}
                  <div className="flex items-start space-x-3 md:w-1/4 shrink-0">
                    <button
                      onClick={() => handleToggleSelect(msg.id)}
                      className="text-slate-500 hover:text-white transition-colors cursor-pointer mt-1"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-indigo-500" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                    
                    <div className="space-y-2">
                      {/* Sender */}
                      <div className="flex items-center space-x-1.5">
                        <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full shrink-0" title="Gönderen" />
                        <span className="font-bold text-white text-xs truncate max-w-[140px]" title={msg.senderName}>
                          {msg.senderName}
                        </span>
                        <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${getRoleBadge(msg.senderRole)}`}>
                          {getRoleLabel(msg.senderRole)}
                        </span>
                      </div>

                      {/* Direction Icon */}
                      <div className="pl-4 text-slate-600">
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>

                      {/* Receiver */}
                      <div className="flex items-center space-x-1.5">
                        <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full shrink-0" title="Alıcı" />
                        <span className="font-bold text-slate-300 text-xs truncate max-w-[140px]" title={msg.receiverName}>
                          {msg.receiverName}
                        </span>
                        <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${getRoleBadge(msg.receiverRole)}`}>
                          {getRoleLabel(msg.receiverRole)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Message Content Column */}
                  <div className="flex-1 min-w-0 space-y-2">
                    {/* Reply Context */}
                    {msg.replyTo && (
                      <div className="bg-slate-950/60 border-l-2 border-slate-600 p-2 rounded-r-lg max-w-xl text-[10px] text-slate-400 space-y-0.5">
                        <span className="font-bold text-slate-300">{msg.replyTo.senderName} yanıtlandı:</span>
                        <p className="truncate">{msg.replyTo.content || (msg.replyTo.attachmentUrl ? '📁 Görsel / Ek' : '')}</p>
                      </div>
                    )}

                    {/* Message content */}
                    <div className="text-xs text-slate-200 break-words leading-relaxed max-w-2xl font-medium">
                      {msg.content || <span className="text-slate-500 italic">Mesaj içeriği bulunmuyor</span>}
                    </div>

                    {/* Image Attachment (Thumb) */}
                    {msg.attachmentUrl && (
                      <div className="inline-flex flex-col space-y-1">
                        <div 
                          onClick={() => setPreviewImageUrl(msg.attachmentUrl!)}
                          className="group relative w-24 h-24 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden cursor-pointer shadow-md hover:border-indigo-500/50 transition-all"
                        >
                          {msg.attachmentUrl.startsWith('data:image') || msg.attachmentUrl.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i) ? (
                            <img 
                              src={msg.attachmentUrl} 
                              alt="Ek" 
                              className="w-full h-full object-cover transition-transform group-hover:scale-105" 
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center p-2 bg-slate-950 text-slate-500 text-[10px] text-center font-bold">
                              <ImageIcon className="w-6 h-6 text-indigo-400 mb-1" />
                              <span className="truncate w-full">Resim Ek</span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-bold transition-opacity">
                            Büyüt
                          </div>
                        </div>
                        <span className="text-[9px] text-indigo-400 font-bold flex items-center gap-1">
                          <ImageIcon className="w-3 h-3" /> Resim yüklü (+Silinecek)
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Date and Actions Column */}
                  <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center gap-4 shrink-0 md:w-48 text-right self-stretch md:self-auto border-t md:border-t-0 border-slate-800/40 pt-3 md:pt-0">
                    <div className="flex items-center space-x-1 text-slate-400 font-semibold text-[10px] font-mono">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>{formatDate(msg.timestamp)}</span>
                    </div>

                    <button
                      onClick={() => setDeleteModal({ isOpen: true, type: 'single', targetId: msg.id })}
                      className="p-2 bg-slate-950 hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 rounded-xl border border-slate-800 hover:border-rose-500/30 transition-all cursor-pointer"
                      title="Mesajı Sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer Info Row */}
          <div className="bg-slate-950/40 px-6 py-3 border-t border-slate-800 text-[10px] text-slate-400 font-medium flex items-center justify-between">
            <span>Toplam {filteredMessages.length} mesaj listelendi.</span>
            {selectedIds.length > 0 && (
              <span className="text-indigo-400 font-bold font-mono">{selectedIds.length} mesaj seçili.</span>
            )}
          </div>
        </div>
      )}

      {/* CONFIRMATION DELETION MODAL */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50 animate-fade-in backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative space-y-5 animate-scale-in">
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-rose-500/20 text-rose-400 rounded-2xl border border-rose-500/30 shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-white text-base">Silme İşlemini Onaylayın</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {deleteModal.type === 'single'
                    ? 'Bu mesajı veritabanından kalıcı olarak silmek istediğinize emin misiniz? Eğer mesajda ekli bir fotoğraf bulunuyorsa o da kalıcı olarak silinecektir.'
                    : `Seçilen ${selectedIds.length} adet mesajı ve bu mesajlara bağlı olan tüm fotoğrafları veritabanından tamamen silmek istediğinize emin misiniz?`}
                </p>
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 mt-3 text-[11px] text-rose-300 font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>Bu işlem geri alınamaz ve Firestore veritabanından tamamen temizlenir.</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setDeleteModal({ isOpen: false, type: 'single' })}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl border border-slate-700 transition-colors cursor-pointer"
              >
                Vazgeç
              </button>
              <button
                onClick={confirmDeletion}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold rounded-xl shadow-lg shadow-rose-600/20 transition-colors cursor-pointer flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Kalıcı Olarak Sil</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BROADCAST / TOPLU MESAJ GÖNDERME MODALI */}
      {showBroadcastModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-fade-in backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl relative space-y-5 animate-scale-in max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-2xl border border-indigo-500/30">
                  <Megaphone className="w-6 h-6 text-indigo-400 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-black text-white text-base">Toplu Duyuru & Herkese Mesaj Gönder</h3>
                  <p className="text-xs text-slate-400">
                    Sitede kayıtlı tüm kullanıcılara veya belirli bir gruba toplu mesaj yayınlayın.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowBroadcastModal(false)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-indigo-400" />
                <span>Hedef Alıcı Kitle:</span>
              </label>
              <select
                value={broadcastTarget}
                onChange={(e) => setBroadcastTarget(e.target.value)}
                className="w-full bg-slate-950 text-white text-xs px-3.5 py-3 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500 font-bold transition-all cursor-pointer"
              >
                <option value="broadcast-all">🌐 Tüm Kayıtlı Kullanıcılar (Toplu Duyuru)</option>
                <option value="broadcast-students">🎓 Tüm Öğrenciler</option>
                <option value="broadcast-teachers">👨‍🏫 Tüm Öğretmenler</option>
                <option value="broadcast-counselors">🧠 Tüm Rehber Öğretmenler</option>
                {users.length > 0 && (
                  <optgroup label="Tekil Kullanıcı Seçin">
                    {users.map(u => (
                      <option key={u.id} value={u.id}>
                        👤 {u.name} ({u.role === 'student' ? 'Öğrenci' : u.role === 'teacher' ? 'Öğretmen' : u.role === 'school_counselor' ? 'Rehberlik' : 'Admin'}) - {u.email}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
              <p className="text-[11px] text-slate-400 italic">
                {broadcastTarget === 'broadcast-all' && 'Gönderilen duyuru kayıtlı TÜM kullanıcıların mesaj kutusuna ve sistem duyuru kanalına anında ulaşır.'}
                {broadcastTarget === 'broadcast-students' && 'Sadece kayıtlı tüm öğrencilerin mesaj kutusuna iletilir.'}
                {broadcastTarget === 'broadcast-teachers' && 'Sadece tüm öğretmen ve sınıf öğretmenlerinin mesaj kutusuna iletilir.'}
                {broadcastTarget === 'broadcast-counselors' && 'Sadece rehber öğretmenlerin mesaj kutusuna iletilir.'}
              </p>
            </div>

            {/* Content Input */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                <span>Mesaj / Duyuru Metni:</span>
              </label>
              <textarea
                value={broadcastContent}
                onChange={(e) => setBroadcastContent(e.target.value)}
                placeholder="Toplu duyurunuzu veya mesajınızı buraya detaylı şekilde yazın..."
                rows={5}
                className="w-full bg-slate-950 text-white placeholder-slate-500 text-xs p-3.5 rounded-2xl border border-slate-800 focus:outline-none focus:border-indigo-500 transition-all resize-none leading-relaxed"
              />
            </div>

            {/* Optional Image Attachment */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-amber-400" />
                <span>Görsel / Afiş Eki (İsteğe Bağlı):</span>
              </label>
              
              {broadcastAttachmentUrl ? (
                <div className="relative group rounded-2xl border border-slate-800 bg-slate-950 p-2 flex items-center space-x-3">
                  <img 
                    src={broadcastAttachmentUrl} 
                    alt="Ek Önizleme" 
                    className="w-16 h-16 object-cover rounded-xl border border-slate-800"
                  />
                  <div className="flex-1 overflow-hidden">
                    <span className="text-xs font-bold text-white block truncate">Resim Eki eklendi</span>
                    <span className="text-[10px] text-emerald-400 font-semibold block">Yayına hazır</span>
                  </div>
                  <button
                    onClick={() => setBroadcastAttachmentUrl('')}
                    className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div>
                  <input
                    type="file"
                    ref={broadcastFileInputRef}
                    onChange={handleBroadcastImageUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => broadcastFileInputRef.current?.click()}
                    disabled={isUploadingBroadcastImage}
                    className="w-full py-3 px-4 bg-slate-950 hover:bg-slate-800 border border-dashed border-slate-700 hover:border-indigo-500 rounded-2xl text-xs font-bold text-slate-300 hover:text-white transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isUploadingBroadcastImage ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                        <span>Görsel Yükleniyor...</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-4 h-4 text-indigo-400" />
                        <span>Resim / Afiş Dosyası Yükle</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowBroadcastModal(false)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl border border-slate-700 transition-colors cursor-pointer"
              >
                İptal
              </button>
              <button
                onClick={handleSendBroadcast}
                disabled={sendingBroadcast || isUploadingBroadcastImage || (!broadcastContent.trim() && !broadcastAttachmentUrl)}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs font-extrabold rounded-xl shadow-lg shadow-indigo-600/30 transition-all cursor-pointer flex items-center gap-2"
              >
                {sendingBroadcast ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Gönderiliyor...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>📢 Duyuruyu Gönder</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FULL RES IMAGE PREVIEW MODAL */}
      {previewImageUrl && (
        <div 
          onClick={() => setPreviewImageUrl(null)}
          className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50 cursor-zoom-out animate-fade-in"
        >
          <div className="absolute top-4 right-4">
            <button className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all">
              <X className="w-5 h-5" />
            </button>
          </div>
          <img 
            src={previewImageUrl} 
            alt="Detaylı Önizleme" 
            className="max-h-[85vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl animate-scale-in border border-white/10"
            onClick={(e) => e.stopPropagation()}
            referrerPolicy="no-referrer"
          />
        </div>
      )}
    </div>
  );
};
