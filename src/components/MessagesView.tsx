import React, { useState, useMemo, useEffect, useLayoutEffect, useRef } from 'react';
import { YildizLisesiLogo } from './YildizLisesiLogo';
import { 
  MessageSquare,
  Reply, 
  Send, 
  Search, 
  User, 
  Check, 
  CheckCheck, 
  Paperclip, 
  Trash2, 
  ShieldAlert, 
  AlertCircle,
  Clock, 
  Sparkles, 
  School, 
  GraduationCap, 
  Info, 
  X, 
  ChevronRight, 
  ChevronUp,
  Image as ImageIcon, 
  ExternalLink, 
  Lock,
  UserCheck,
  Bot,
  ArrowLeft,
  Maximize2,
  Loader2,
  UploadCloud,
  Users,
  Plus,
  MessageSquarePlus,
  Pencil
} from 'lucide-react';

// Helper function to resolve messages belonging to a given contact / channel
const getContactMessages = (contact: UserAccount, allMessages: DirectMessage[], currentUserId: string, currentUserRole: string): DirectMessage[] => {
  if (!contact || !contact.id) return [];
  
  if (contact.id === 'broadcast-all') {
    return allMessages.filter(m => {
      if (!m || !m.receiverId) return false;
      if (m.receiverId === 'broadcast-all') return true;
      if (m.receiverId === 'broadcast-students') {
        return currentUserRole === 'student' || currentUserRole === 'admin' || currentUserRole === 'school_counselor' || m.senderId === currentUserId;
      }
      if (m.receiverId === 'broadcast-teachers') {
        return currentUserRole === 'teacher' || currentUserRole === 'class_teacher' || currentUserRole === 'admin' || currentUserRole === 'school_counselor' || m.senderId === currentUserId;
      }
      if (m.receiverId === 'broadcast-counselors') {
        return currentUserRole === 'school_counselor' || currentUserRole === 'admin' || m.senderId === currentUserId;
      }
      return false;
    });
  }

  if (contact.id.startsWith('class-group-')) {
    return allMessages.filter(m => m && m.receiverId === contact.id);
  }

  return allMessages.filter(m => 
    m &&
    m.receiverId &&
    !m.receiverId.startsWith('broadcast-') &&
    !m.receiverId.startsWith('class-group-') &&
    ((m.senderId === currentUserId && m.receiverId === contact.id) ||
     (m.senderId === contact.id && m.receiverId === currentUserId))
  );
};
import { UserAccount, DirectMessage, ClassDefinition, UserRole } from '../types';
import { uploadMessageAttachment } from '../services/storageUpload';
import { isUserOnline, getUserLastSeenText, getExactLastSeenText, isStudentActive, getStatusConfig } from '../utils/statusUtils';
import { getUserColor } from '../utils/colorUtils';
import { playNotificationSound } from '../utils/soundUtils';
import { subscribeToPresence } from '../services/firebase';

// Client-side automatic image compression helper (max 1000px dimension, ~50-100KB output)
const compressImageFile = (file: File, maxDimension = 1000, quality = 0.65): Promise<{ dataUrl: string; originalKb: number; compressedKb: number }> => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Lütfen geçerli bir görsel dosyası (JPG, PNG vb.) seçin.'));
      return;
    }
    const originalKb = Math.round(file.size / 1024);
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Görsel dosyası okunamadı.'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Görsel işlenemedi.'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Sıkıştırma tuvali oluşturulamadı.'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        const compressedKb = Math.round((dataUrl.length * 3) / 4 / 1024);
        resolve({ dataUrl, originalKb, compressedKb });
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};

const isImageAttachment = (url?: string) => {
  if (!url) return false;
  if (url.startsWith('data:image/')) return true;
  if (url.startsWith('/uploads/')) return true;
  if (url.includes('firebasestorage.googleapis.com')) return true;
  return /\.(jpg|jpeg|png|webp|gif|avif)(\?.*)?$/i.test(url) || url.includes('images.unsplash.com');
};

const MessageAttachmentView: React.FC<{ url: string; onPreview: () => void }> = ({ url, onPreview }) => {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div className="rounded-xl border border-rose-500/30 bg-rose-950/40 p-2.5 text-rose-200 text-xs flex items-center space-x-2 mt-1">
        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
        <span className="font-medium text-[11px]">Görsel erişilemiyor veya silinmiş</span>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/20 bg-black/30 group/img relative mt-1 max-w-xs sm:max-w-sm">
      <img 
        src={url} 
        alt="Mesaj görseli" 
        className="max-h-56 sm:max-h-72 w-full object-cover rounded-xl cursor-pointer hover:opacity-95 transition-all"
        onClick={onPreview}
        onError={() => setHasError(true)}
      />
      <button
        type="button"
        onClick={onPreview}
        className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-slate-900/80 text-white hover:bg-slate-900 backdrop-blur-md opacity-90 sm:opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center space-x-1 text-[10px] font-semibold"
        title="Tam ekran gör"
      >
        <Maximize2 className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Büyüt</span>
      </button>
    </div>
  );
};

interface MessagesViewProps {
  currentUser: UserAccount;
  allUsers: UserAccount[];
  classes: ClassDefinition[];
  messages: DirectMessage[];
  studentsData?: Record<string, any>;
  onSendMessage: (receiverId: string, content: string, attachmentUrl?: string, replyTo?: any) => void;
  onEditMessage?: (messageId: string, newContent: string) => void;
  onDeleteMessage?: (messageId: string) => void;
  onMarkAsRead: (messageIds: string[]) => void;
}

const renderMessageContent = (content: string) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = content.split(urlRegex);
  
  return parts.map((part, index) => {
    if (part.match(urlRegex)) {
      return (
        <a 
          key={index} 
          href={part} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-emerald-300 hover:text-emerald-200 underline break-all font-medium transition-colors"
        >
          {part}
        </a>
      );
    }
    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
};

export const MessagesView: React.FC<MessagesViewProps> = ({
  currentUser,
  allUsers,
  classes,
  messages,
  studentsData,
  onSendMessage,
  onEditMessage,
  onDeleteMessage,
  onMarkAsRead
}) => {
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [messageText, setMessageText] = useState('');
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);
  const [attachmentUrlInput, setAttachmentUrlInput] = useState('');
  const [selectedImagePreview, setSelectedImagePreview] = useState<string | null>(null);
  const [isCompressingImage, setIsCompressingImage] = useState<boolean>(false);
  const [compressionInfo, setCompressionInfo] = useState<{ originalKb: number; compressedKb: number } | null>(null);
  const [previewImageModalUrl, setPreviewImageModalUrl] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [activeMobileScreen, setActiveMobileScreen] = useState<'contacts' | 'chat'>('contacts');
  const [activeReadTimeMessageId, setActiveReadTimeMessageId] = useState<string | null>(null);
  const [readReceiptModalMsg, setReadReceiptModalMsg] = useState<DirectMessage | null>(null);
  const [readReceiptTab, setReadReceiptTab] = useState<'read' | 'unread'>('read');
  const [replyingToMsg, setReplyingToMsg] = useState<DirectMessage | null>(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  const [swipeState, setSwipeState] = useState<{ id: string; startX: number; currentX: number } | null>(null);
  const [visibleMessageCount, setVisibleMessageCount] = useState<number>(20);
  const [showExactLastSeen, setShowExactLastSeen] = useState<boolean>(false);
  const [presenceMap, setPresenceMap] = useState<Record<string, { isOnline: boolean; lastActiveAt: string }>>({});
  const [showNewChatModal, setShowNewChatModal] = useState<boolean>(false);
  const [newChatSearch, setNewChatSearch] = useState<string>('');
  const [newChatCategory, setNewChatCategory] = useState<'all' | 'students' | 'teachers' | 'counselors' | 'groups'>('all');
  const [now, setNow] = useState<number>(Date.now());
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContentText, setEditContentText] = useState<string>('');
  const [deletingConfirmMsgId, setDeletingConfirmMsgId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  const getMessageTimestampMs = (msg: DirectMessage | null | undefined): number => {
    if (!msg) return 0;
    if (typeof msg.timestampMs === 'number' && !isNaN(msg.timestampMs) && msg.timestampMs > 0) {
      return msg.timestampMs;
    }
    if (msg.id && typeof msg.id === 'string') {
      const match = msg.id.match(/msg-(\d+)/);
      if (match && match[1]) {
        const parsed = Number(match[1]);
        if (!isNaN(parsed) && parsed > 1000000000000) {
          return parsed;
        }
      }
    }
    if (msg.timestamp) {
      const formatted = msg.timestamp.includes('T') ? msg.timestamp : msg.timestamp.replace(' ', 'T');
      const parsed = new Date(formatted).getTime();
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
    return 0;
  };

  const canEditOrDeleteMessage = (msg: DirectMessage) => {
    if (!msg || msg.senderId !== currentUser.id || msg.isDeleted) return false;
    const msgTimeMs = getMessageTimestampMs(msg);
    if (!msgTimeMs) return true;
    const elapsed = now - msgTimeMs;
    return elapsed >= -10000 && elapsed <= 60000; // 60 seconds (1 minute)
  };

  useEffect(() => {
    const unsubscribe = subscribeToPresence((map) => setPresenceMap(map));
    return () => unsubscribe();
  }, []);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const prevScrollHeightRef = useRef<number>(0);
  const prevScrollTopRef = useRef<number>(0);
  const isLoadingMoreRef = useRef<boolean>(false);
  const isInitialContactLoadRef = useRef<boolean>(true);
  const prevMessageCountRef = useRef<number>(messages.length);

  const formatTime = (timestamp: string) => {
    if (!timestamp) return '';
    const parts = timestamp.split(' ');
    if (parts.length > 1) {
      return parts[1];
    }
    return '';
  };

  const formatShortDate = (timestamp: string) => {
    if (!timestamp) return '';
    const parts = timestamp.split(' ');
    if (parts.length === 0) return '';
    const dateParts = parts[0].split('-');
    if (dateParts.length !== 3) return parts[0];
    const day = parseInt(dateParts[2], 10);
    const month = parseInt(dateParts[1], 10);
    const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
    return `${day} ${months[month - 1]}`;
  };

  const formatReadTimeLabel = (msg: DirectMessage, isGroupChat: boolean = false) => {
    if (isGroupChat) {
      if (msg.readBy && msg.readBy.length > 0) {
        return `${msg.readBy.length} kişi okudu`;
      }
      return msg.isDelivered ? 'İletildi' : 'Gönderildi';
    }

    if (msg.isRead) {
      const raw = msg.readAt || msg.timestamp;
      if (!raw) return 'Okundu';
      
      // Format e.g. "2026-07-29 17:10" -> "29.07.2026 17:10"
      if (raw.includes('-')) {
        const parts = raw.split(' ');
        if (parts.length === 2) {
          const [datePart, timePart] = parts;
          const datePieces = datePart.split('-');
          if (datePieces.length === 3) {
            const [y, m, d] = datePieces;
            return `Okundu: ${d}.${m}.${y} ${timePart}`;
          }
        }
      }
      return `Okundu: ${raw}`;
    }
    if (msg.isDelivered) {
      return 'İletildi (Hesaba ulaştı)';
    }
    return 'Gönderildi (Sunucuya ulaştı)';
  };

  const allUsersWithPresence = useMemo(() => {
    return allUsers.map(u => ({
      ...u,
      isOnline: presenceMap[u.id]?.isOnline ?? false,
      lastActiveAt: presenceMap[u.id]?.lastActiveAt ?? u.lastActiveAt
    }));
  }, [allUsers, presenceMap]);

  // 1. Calculate allowed contacts strictly based on role and assignment rules
  const allowedContacts = useMemo(() => {
    const activeUsers = allUsersWithPresence.filter(u => u.id !== currentUser.id && u.status !== 'pending' && u.status !== 'rejected');
    
    let groupContacts: UserAccount[] = [];

    // 0. Site-wide broadcast announcement group contact
    if (currentUser.role === 'admin' || currentUser.role === 'school_counselor') {
      groupContacts.push({
        id: 'broadcast-all',
        name: '📢 Sistem Duyuruları',
        email: 'Okul tarafından yapılan bilgilendirme mesajlarıdır',
        password: '',
        role: 'admin',
        title: 'Okul tarafından yapılan bilgilendirme mesajlarıdır',
      });
    } else {
      groupContacts.push({
        id: 'broadcast-all',
        name: '📢 Sistem Duyuruları',
        email: 'Okul tarafından yapılan bilgilendirme mesajlarıdır',
        password: '',
        role: 'admin',
        title: 'Okul tarafından yapılan bilgilendirme mesajlarıdır',
      });
    }

    if (currentUser.role === 'student' && currentUser.className) {
      const classDef = classes.find(c => c.name === currentUser.className);
      if (classDef) {
        groupContacts.push({
          id: `class-group-${classDef.id}`,
          name: `${classDef.name} Sınıf Grubu`,
          email: `Grup Mesajı`,
          password: '',
          role: 'student', // fake, but needed for type
          className: classDef.name,
          title: 'Sınıf Grubu',
        });
      }
    } else if (currentUser.role === 'class_teacher' || currentUser.role === 'teacher') {
      const teacherAssignedClasses = currentUser.assignedClassNames || [];
      classes.forEach(c => {
        if (teacherAssignedClasses.includes(c.name) || c.assignedTeacherIds.includes(currentUser.id)) {
          groupContacts.push({
            id: `class-group-${c.id}`,
            name: `${c.name} Sınıf Grubu`,
            email: `Grup Mesajı`,
            password: '',
            role: 'teacher', // fake
            className: c.name,
            title: 'Sınıf Grubu',
          });
        }
      });
    } else if (currentUser.role === 'school_counselor' || currentUser.role === 'admin') {
       classes.forEach(c => {
          groupContacts.push({
            id: `class-group-${c.id}`,
            name: `${c.name} Sınıf Grubu`,
            email: `Grup Mesajı`,
            password: '',
            role: 'school_counselor', // fake
            className: c.name,
            title: 'Sınıf Grubu',
          });
       });
    }

    let userContacts: UserAccount[] = [];

    if (currentUser.role === 'student') {
      const studentClassName = currentUser.className;

      userContacts = activeUsers.filter(u => {
        // Rule A: Okul Rehber Öğretmeni (school_counselor) or Admin
        if (u.role === 'school_counselor' || u.role === 'admin') {
          return true;
        }

        // Rule B: Sınıf Rehber Öğretmeni (class_teacher or teacher) assigned to student's class
        if (u.role === 'class_teacher' || u.role === 'teacher') {
          const teachesInAssigned = u.assignedClassNames?.includes(studentClassName || '');
          const classDef = classes.find(c => c.name === studentClassName);
          const teachesInClassDef = classDef?.assignedTeacherIds.includes(u.id);
          return teachesInAssigned || teachesInClassDef;
        }

        // Rule C: Same class students (Sınıf arkadaşları)
        if (u.role === 'student' && studentClassName && u.className === studentClassName) {
          return true;
        }

        return false;
      });
    } else if (currentUser.role === 'class_teacher' || currentUser.role === 'teacher') {
      const teacherAssignedClasses = currentUser.assignedClassNames || [];

      userContacts = activeUsers.filter(u => {
        // Can message school counselor or Admin
        if (u.role === 'school_counselor' || u.role === 'admin') return true;

        // Can message students in their assigned classes
        if (u.role === 'student') {
          const isAssignedByName = teacherAssignedClasses.includes(u.className || '');
          const classDef = classes.find(c => c.name === u.className);
          const isAssignedByClassDef = classDef?.assignedTeacherIds.includes(currentUser.id);
          return isAssignedByName || isAssignedByClassDef;
        }

        // Can message other teachers
        if (u.role === 'class_teacher' || u.role === 'teacher') return true;

        return false;
      });
    } else if (currentUser.role === 'school_counselor' || currentUser.role === 'admin') {
      // Counselor & Admin can message ALL active users registered on the site
      userContacts = activeUsers;
    }

    return [...groupContacts, ...userContacts];
  }, [currentUser, allUsersWithPresence, classes]);

  // 2. Sort allowed contacts:
  // - "📢 Sistem Duyuruları" (broadcast-all) ALWAYS pinned at index 0 (top of contacts list)
  // - Contacts with unread messages next
  // - Contacts with latest messages next
  // - Alphabetical fallback
  const sortedAllowedContacts = useMemo(() => {
    const broadcastContact = allowedContacts.find(c => c.id === 'broadcast-all');
    const otherContacts = allowedContacts.filter(c => c.id !== 'broadcast-all');

    otherContacts.sort((a, b) => {
      const msgsA = getContactMessages(a, messages, currentUser.id, currentUser.role);
      const msgsB = getContactMessages(b, messages, currentUser.id, currentUser.role);

      const unreadA = msgsA.filter(m => 
        m.senderId !== currentUser.id && 
        ((a.id?.startsWith('class-group-') || a.id?.startsWith('broadcast-') || a.id === 'broadcast-all')
          ? (!m.readBy || !m.readBy.some(r => r.userId === currentUser.id)) 
          : !m.isRead)
      ).length;

      const unreadB = msgsB.filter(m => 
        m.senderId !== currentUser.id && 
        ((b.id?.startsWith('class-group-') || b.id?.startsWith('broadcast-') || b.id === 'broadcast-all')
          ? (!m.readBy || !m.readBy.some(r => r.userId === currentUser.id)) 
          : !m.isRead)
      ).length;

      if (unreadA > 0 && unreadB === 0) return -1;
      if (unreadB > 0 && unreadA === 0) return 1;

      const lastMsgA = msgsA.length > 0 ? msgsA[msgsA.length - 1] : null;
      const lastMsgB = msgsB.length > 0 ? msgsB[msgsB.length - 1] : null;

      if (lastMsgA && lastMsgB) {
        return new Date(lastMsgB.timestamp).getTime() - new Date(lastMsgA.timestamp).getTime();
      }
      if (lastMsgA && !lastMsgB) return -1;
      if (!lastMsgA && lastMsgB) return 1;

      return a.name.localeCompare(b.name, 'tr');
    });

    return broadcastContact ? [broadcastContact, ...otherContacts] : otherContacts;
  }, [allowedContacts, messages, currentUser.id, currentUser.role]);

  // Filter contacts for main sidebar:
  // - Show broadcast-all ALWAYS at the top
  // - Show selectedContactId if explicitly chosen
  // - Hide contacts with 0 messages ("henüz mesaj yok")
  const filteredContacts = useMemo(() => {
    return sortedAllowedContacts.filter(c => {
      const isBroadcast = c.id === 'broadcast-all';
      const isSelected = selectedContactId === c.id;
      const contactMsgs = getContactMessages(c, messages, currentUser.id, currentUser.role);
      const hasMessages = contactMsgs.length > 0;

      // Do NOT show "henüz mesaj yok" contacts in main active contacts list
      if (!isBroadcast && !isSelected && !hasMessages) {
        return false;
      }

      const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (c.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (c.className || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!matchesSearch) return false;

      if (activeFilter === 'counselor') return c.role === 'school_counselor';
      if (activeFilter === 'class_teacher') return c.role === 'class_teacher' || c.role === 'teacher';
      
      if (activeFilter !== 'all') {
        return c.role === 'student' && c.className === activeFilter;
      }

      return true;
    });
  }, [sortedAllowedContacts, messages, currentUser.id, currentUser.role, searchTerm, activeFilter, selectedContactId]);

  // Set default selected contact to top contact in filteredContacts if not explicitly selected or missing
  useEffect(() => {
    if (filteredContacts.length > 0) {
      const exists = filteredContacts.some(c => c.id === selectedContactId);
      if (!selectedContactId || !exists) {
        setSelectedContactId(filteredContacts[0].id);
      }
    }
  }, [filteredContacts, selectedContactId]);

  const activeContact = sortedAllowedContacts.find(u => u.id === selectedContactId) || null;

  // Contacts available in "Yeni Mesaj Gönder" modal (all allowed contacts)
  const modalAvailableContacts = useMemo(() => {
    return allowedContacts.filter(c => {
      if (c.id === 'broadcast-all') return false; // Broadcast channel is pinned at top of main sidebar

      const matchesSearch = c.name.toLowerCase().includes(newChatSearch.toLowerCase()) || 
                            (c.title || '').toLowerCase().includes(newChatSearch.toLowerCase()) ||
                            (c.className || '').toLowerCase().includes(newChatSearch.toLowerCase());
      if (!matchesSearch) return false;

      if (newChatCategory === 'students') return c.role === 'student';
      if (newChatCategory === 'teachers') return c.role === 'teacher' || c.role === 'class_teacher';
      if (newChatCategory === 'counselors') return c.role === 'school_counselor' || c.role === 'admin';
      if (newChatCategory === 'groups') return c.id?.startsWith('class-group-');

      return true;
    });
  }, [allowedContacts, newChatSearch, newChatCategory]);

  // Reset message count & scroll flag when active contact changes
  useEffect(() => {
    setVisibleMessageCount(20);
    isInitialContactLoadRef.current = true;
  }, [selectedContactId]);

  // Messages between current user and active contact
  const conversationMessages = useMemo(() => {
    if (!activeContact) return [];
    const filtered = getContactMessages(activeContact, messages, currentUser.id, currentUser.role);

    // Deduplicate by msg.id to ensure React unique key warnings are never triggered
    const seen = new Set<string>();
    return filtered.filter(m => {
      if (!m.id) return true;
      if (seen.has(m.id)) {
        return false;
      }
      seen.add(m.id);
      return true;
    });
  }, [messages, currentUser.id, currentUser.role, activeContact]);

  // Sliced messages for incremental load (last 5 messages initially)
  const displayedMessages = useMemo(() => {
    if (conversationMessages.length <= visibleMessageCount) {
      return conversationMessages;
    }
    return conversationMessages.slice(conversationMessages.length - visibleMessageCount);
  }, [conversationMessages, visibleMessageCount]);

  const hasMoreMessages = conversationMessages.length > displayedMessages.length;
  const remainingCount = conversationMessages.length - displayedMessages.length;

  // Function to load 5 more older messages
  const handleLoadMore = () => {
    if (!hasMoreMessages) return;
    if (chatContainerRef.current) {
      prevScrollHeightRef.current = chatContainerRef.current.scrollHeight;
      prevScrollTopRef.current = chatContainerRef.current.scrollTop;
      isLoadingMoreRef.current = true;
    }
    setVisibleMessageCount(prev => prev + 20);
  };

  // Detect scrolling near top to load older messages automatically
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (target.scrollTop <= 30 && hasMoreMessages && !isLoadingMoreRef.current) {
      handleLoadMore();
    }
  };

  // Preserve scroll position when loading older messages at the top
  useLayoutEffect(() => {
    if (isLoadingMoreRef.current && chatContainerRef.current) {
      const newScrollHeight = chatContainerRef.current.scrollHeight;
      const diff = newScrollHeight - prevScrollHeightRef.current;
      chatContainerRef.current.scrollTop = prevScrollTopRef.current + diff;
      isLoadingMoreRef.current = false;
    }
  }, [displayedMessages]);

  // Auto-mark unread messages as read when opening active contact chat
  const markedAsReadRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!activeContact) return;
    const unreadReceivedIds = conversationMessages
      .filter(m => 
        m.senderId !== currentUser.id && 
        ((activeContact.id?.startsWith('class-group-') || activeContact.id?.startsWith('broadcast-') || activeContact.id === 'broadcast-all')
          ? (!m.readBy || !m.readBy.some(r => r.userId === currentUser.id))
          : !m.isRead) && 
        !markedAsReadRef.current.has(m.id)
      )
      .map(m => m.id);

    if (unreadReceivedIds.length > 0) {
      unreadReceivedIds.forEach(id => markedAsReadRef.current.add(id));
      onMarkAsRead(unreadReceivedIds);
    }
  }, [activeContact, conversationMessages, currentUser.id, onMarkAsRead]);

  // Play sound for new incoming messages globally on this view
  useEffect(() => {
    if (messages.length > prevMessageCountRef.current) {
      const newMessages = messages.slice(prevMessageCountRef.current);
      const hasNewIncoming = newMessages.some(m => m.senderId !== currentUser.id && (m.receiverId === currentUser.id || m.receiverId?.startsWith('class-group-') || m.receiverId?.startsWith('broadcast-')));
      
      if (hasNewIncoming && currentUser.soundEnabled !== false) {
        playNotificationSound();
      }
    }
    prevMessageCountRef.current = messages.length;
  }, [messages, currentUser.id, currentUser.soundEnabled]);

  // Auto scroll to bottom of chat when switching contacts or receiving/sending new messages
  useEffect(() => {
    if (!activeContact) return;
    if (isInitialContactLoadRef.current) {
      const timer = setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
        isInitialContactLoadRef.current = false;
      }, 50);
      return () => clearTimeout(timer);
    } else if (!isLoadingMoreRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedContactId, conversationMessages.length]);

  const scrollToMessage = (targetId: string) => {
    if (!targetId) return;

    const targetIdx = conversationMessages.findIndex(m => m.id === targetId);
    if (targetIdx !== -1) {
      const countFromEnd = conversationMessages.length - targetIdx;
      if (countFromEnd > visibleMessageCount) {
        setVisibleMessageCount(countFromEnd + 10);
      }
    }

    setTimeout(() => {
      const targetElement = document.getElementById(`msg-bubble-${targetId}`);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setHighlightedMessageId(targetId);
        setTimeout(() => {
          setHighlightedMessageId(null);
        }, 1000);
      }
    }, 120);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsCompressingImage(true);
      const tempMsgId = 'msg-' + Date.now() + '-' + Math.floor(Math.random() * 100000);
      const uploadRes = await uploadMessageAttachment(file, tempMsgId);
      setSelectedImagePreview(uploadRes.url);
      setCompressionInfo({ originalKb: uploadRes.originalKb, compressedKb: uploadRes.compressedKb });
      setShowAttachmentModal(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      alert(err.message || 'Görsel yüklenirken bir hata oluştu.');
    } finally {
      setIsCompressingImage(false);
    }
  };

  const handleSend = (textToSend?: string, urlToSend?: string) => {
    const text = (textToSend || messageText).trim();
    const attachment = urlToSend || selectedImagePreview || attachmentUrlInput.trim() || undefined;

    if ((!text && !attachment) || !activeContact) return;
    if (activeContact.id === 'broadcast-all' || activeContact.id?.startsWith('broadcast-')) {
      return;
    }

    let replyToData = undefined;
    if (replyingToMsg) {
      replyToData = {
        id: replyingToMsg.id,
        senderName: replyingToMsg.senderName,
        content: replyingToMsg.content,
        attachmentUrl: replyingToMsg.attachmentUrl
      };
    }

    onSendMessage(activeContact.id, text, attachment, replyToData);
    setMessageText('');
    setAttachmentUrlInput('');
    setSelectedImagePreview(null);
    setCompressionInfo(null);
    setShowAttachmentModal(false);
    setReplyingToMsg(null);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const getRoleBadge = (user: UserAccount) => {
    if (user.id === 'broadcast-all' || user.id?.startsWith('broadcast-')) {
      return null;
    }
    if (user.role === 'school_counselor') {
      return (
        <span className="text-slate-400 text-[10px] flex items-center space-x-1 shrink-0">
          <School className="w-3 h-3" />
          <span>Okul Rehber Öğretmeni</span>
        </span>
      );
    }
    if (user.role === 'class_teacher' || user.role === 'teacher') {
      return (
        <span className="text-slate-400 text-[10px] flex items-center space-x-1 shrink-0">
          <UserCheck className="w-3 h-3" />
          <span>Sınıf Rehber Öğretmeni</span>
        </span>
      );
    }
    if (user.role === 'admin') {
      return (
        <span className="text-slate-400 text-[10px] flex items-center space-x-1 shrink-0">
          <School className="w-3 h-3" />
          <span>Okul Yönetimi</span>
        </span>
      );
    }
    return (
      <span className="text-slate-400 text-[10px] flex items-center space-x-1 shrink-0">
        <GraduationCap className="w-3 h-3" />
        <span>Öğrenci ({user.className || 'Sınıf Belirtilmemiş'})</span>
      </span>
    );
  };

  return (
    <div className="space-y-3 sm:space-y-4 max-w-7xl mx-auto">
      
      {/* Top Banner & Title */}
      <div className="bg-slate-800 border border-slate-700/80 rounded-2xl p-3 sm:p-4 shadow-md relative ">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 opacity-10 pointer-events-none">
          <MessageSquare className="w-32 h-32 text-indigo-300" />
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 relative z-10">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="p-2 rounded-xl bg-slate-700 border border-slate-600 text-indigo-300 shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-sm sm:text-base font-bold text-white tracking-tight truncate">
                  Rehberlik & Öğretmen Mesajlaşma Hattı
                </h1>
                <span className="text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 px-2.5 py-0.5 rounded-full shrink-0">
                  Canlı İletişim
                </span>
              </div>
              <p className="text-xs text-slate-200 font-medium truncate mt-0.5">
                {currentUser.role === 'student' 
                  ? 'Atanmış Sınıf Rehber Öğretmeniniz ve Okul Rehberlik Danışmanınız ile güvenli mesajlaşma' 
                  : 'Öğrencileriniz ve rehberlik kadrosu ile anlık birebir görüşme platformu'}
              </p>
            </div>
          </div>

          {/* Authorization Notice Card for Students */}
          {currentUser.role === 'student' && (
            <div className="flex items-center space-x-2 bg-slate-900/90 border border-slate-700 rounded-xl px-3 py-1.5 shrink-0">
              <Lock className="w-3.5 h-3.5 text-indigo-300 shrink-0" />
              <p className="text-xs text-slate-200 font-medium">
                <strong className="text-white font-bold">Yetkili Erişim:</strong> Sadece tanımlı rehber kadronuz listelenir.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Main Container: Left Sidebar Contacts + Right Active Chat */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT PANEL: Contacts List */}
        <div className={`lg:col-span-4 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-xl flex-col h-[650px] relative overflow-hidden ${
          activeMobileScreen === 'chat' ? 'hidden lg:flex' : 'flex'
        }`}>
          
          {/* Contacts Header & Search */}
          <div className="p-4 border-b border-slate-800 space-y-3 bg-slate-950/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-indigo-400" />
                <h2 className="text-sm font-bold text-white">İletişim Kişileri ({filteredContacts.length})</h2>
              </div>
              <span className="text-[11px] font-semibold text-slate-400">
                {currentUser.role === 'student' ? 'Öğretmenleriniz' : 'Atanmış Kişiler'}
              </span>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="İsim veya sınıfa göre ara..."
                className="w-full bg-slate-900 border border-slate-700/80 focus:border-indigo-500 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 outline-none transition-all"
              />
            </div>

            {/* Filter Pills (For Teachers or School Counselor) */}
            {currentUser.role !== 'student' && (
              <div className="flex items-center space-x-1.5 overflow-x-auto scrollbar-none pb-1">
                <button
                  onClick={() => setActiveFilter('all')}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all border ${
                    activeFilter === 'all'
                      ? 'bg-indigo-600 text-white border-indigo-400 shadow-md'
                      : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                >
                  Tümü
                </button>
                <button
                  onClick={() => setActiveFilter('counselor')}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all border ${
                    activeFilter === 'counselor'
                      ? 'bg-purple-600 text-white border-purple-400 shadow-md'
                      : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                >
                  Okul Rehberliği
                </button>
                {/* Class Filters */}
                {(currentUser.role === 'school_counselor' ? classes.map(c => c.name) : (currentUser.assignedClassNames || [])).map(className => (
                  <button
                    key={className}
                    onClick={() => setActiveFilter(className)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all border ${
                      activeFilter === className
                        ? 'bg-emerald-600 text-white border-emerald-400 shadow-md'
                        : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white'
                    }`}
                  >
                    {className}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Contacts List Scrollable */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/50 p-2 space-y-1 pb-16">
            {filteredContacts.length === 0 ? (
              <div className="text-center py-12 px-4 space-y-3">
                <ShieldAlert className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="text-xs font-semibold text-slate-400">
                  Arama kriterlerinize uyan iletişim kişisi bulunamadı.
                </p>
              </div>
            ) : (
              filteredContacts.map(contact => {
                const isSelected = selectedContactId === contact.id;

                // Find last message
                const contactMsgs = getContactMessages(contact, messages, currentUser.id, currentUser.role);
                const lastMsg = contactMsgs.length > 0 ? contactMsgs[contactMsgs.length - 1] : null;

                // Unread count
                const unreadCount = contactMsgs.filter(m => 
                  m.senderId !== currentUser.id && 
                  ((contact.id?.startsWith('class-group-') || contact.id?.startsWith('broadcast-'))
                    ? (!m.readBy || !m.readBy.some(r => r.userId === currentUser.id)) 
                    : !m.isRead)
                ).length;

                return (
                  <button
                    key={contact.id}
                    onClick={() => {
                      setSelectedContactId(contact.id);
                      setActiveMobileScreen('chat');
                    }}
                    className={`w-full text-left p-3 rounded-2xl transition-all flex items-center space-x-3 relative border hover:scale-[1.02] ${
                      isSelected
                        ? 'bg-slate-800/80 border-indigo-500/50 shadow-md text-white'
                        : 'bg-slate-900/60 hover:bg-slate-800 border-white/5 shadow-sm text-slate-300'
                    }`}
                  >
                    {/* Contact Avatar & Online Status */}
                    <div className="relative shrink-0">
                      {contact.id === 'broadcast-all' || contact.id?.startsWith('broadcast-') ? (
                        <div className="w-11 h-11 rounded-2xl bg-slate-950 border border-amber-500/30 p-1 shadow-md flex items-center justify-center shrink-0 overflow-hidden">
                          <YildizLisesiLogo className="w-full h-full object-contain" />
                        </div>
                      ) : contact.id?.startsWith('class-group-') ? (
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-md">
                          <Users className="w-5 h-5" />
                        </div>
                      ) : contact.avatarUrl ? (
                        <img 
                          src={contact.avatarUrl} 
                          alt={contact.name} 
                          className="w-11 h-11 rounded-2xl object-cover border border-slate-700" 
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center text-sm shadow-md">
                          {contact.name.charAt(0)}
                        </div>
                      )}
                      {!contact.id?.startsWith('class-group-') && !contact.id?.startsWith('broadcast-') && isUserOnline(contact) && (
                        <span className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900 absolute -bottom-0.5 -right-0.5 shadow-sm" title="Çevrimiçi" />
                      )}
                      {!contact.id?.startsWith('class-group-') && !contact.id?.startsWith('broadcast-') && contact.role === 'student' && (
                        <span 
                          className={`w-2.5 h-2.5 rounded-full border-2 border-slate-900 absolute -top-0.5 -right-0.5 shadow-sm ${
                            isStudentActive(contact.id, studentsData?.[contact.id]) ? 'bg-emerald-500' : 'bg-slate-500'
                          }`}
                          title={isStudentActive(contact.id, studentsData?.[contact.id]) ? 'Aktif Öğrenci' : 'Pasif Öğrenci'}
                        />
                      )}
                    </div>

                    {/* Contact Info & Preview */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between space-x-2">
                        <span className="text-xs font-bold text-white truncate">
                          {contact.name}
                        </span>
                        {lastMsg && (
                          <span className="text-[10px] text-slate-400 font-mono shrink-0">
                            {lastMsg.timestamp.split(' ')[1] || lastMsg.timestamp}
                          </span>
                        )}
                      </div>

                      <div className="mt-0.5">
                        {getRoleBadge(contact)}
                      </div>

                      <p className="text-[11px] text-slate-400 truncate mt-1">
                        {lastMsg ? (
                          lastMsg.senderId === currentUser.id ? `Siz: ${lastMsg.content}` : lastMsg.content
                        ) : (
                          <span className="italic text-slate-500">Henüz mesaj yok</span>
                        )}
                      </p>
                    </div>

                    {/* Unread Badge */}
                    {unreadCount > 0 && (
                      <span className="bg-rose-500 text-white font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center shrink-0 shadow-lg shadow-rose-500/30 animate-pulse">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Floating Action Button (FAB) - Plus Icon for New Message (Only visible on contacts panel) */}
          <button
            type="button"
            onClick={() => setShowNewChatModal(true)}
            className="absolute bottom-4 right-4 z-20 w-12 h-12 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold rounded-full shadow-xl shadow-indigo-600/40 hover:scale-110 active:scale-95 transition-all flex items-center justify-center border border-indigo-400/30 cursor-pointer group"
            title="Yeni Mesaj Gönder"
          >
            <Plus className="w-6 h-6 text-white group-hover:rotate-90 transition-transform duration-300" />
          </button>
        </div>

        {/* RIGHT PANEL: Active Chat Room */}
        <div className={`lg:col-span-8 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl flex-col h-[650px]  ${
          activeMobileScreen === 'contacts' ? 'hidden lg:flex' : 'flex'
        }`}>
          
          {activeContact ? (() => {
            const isBroadcastChannel = activeContact.id === 'broadcast-all' || activeContact.id?.startsWith('broadcast-');
            return (
            <>
              {/* Active Chat Header */}
              <div className="p-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
                <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
                  
                  {/* Mobile Back Button to Contacts */}
                  <button
                    onClick={() => setActiveMobileScreen('contacts')}
                    className="lg:hidden px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 hover:text-white font-bold text-xs flex items-center space-x-1 shrink-0 transition-all"
                    title="Kişi Listesine Dön"
                  >
                    <ArrowLeft className="w-4 h-4 text-indigo-300" />
                    <span>Kişiler</span>
                  </button>

                  <div className="relative shrink-0">
                    {activeContact.id === 'broadcast-all' || activeContact.id?.startsWith('broadcast-') ? (
                      <div className="w-11 h-11 rounded-2xl bg-slate-950 border border-amber-500/40 p-1 shadow-md flex items-center justify-center shrink-0 overflow-hidden">
                        <YildizLisesiLogo className="w-full h-full object-contain" />
                      </div>
                    ) : activeContact.id?.startsWith('class-group-') ? (
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold flex items-center justify-center text-sm">
                        <Users className="w-5 h-5" />
                      </div>
                    ) : activeContact.avatarUrl ? (
                      <img 
                        src={activeContact.avatarUrl} 
                        alt={activeContact.name} 
                        className="w-11 h-11 rounded-2xl object-cover border border-indigo-500/40" 
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white font-bold flex items-center justify-center text-sm">
                        {activeContact.name.charAt(0)}
                      </div>
                    )}
                    {!activeContact.id?.startsWith('class-group-') && !activeContact.id?.startsWith('broadcast-') && isUserOnline(activeContact) && (
                      <span className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-950 absolute -bottom-0.5 -right-0.5" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-sm font-bold text-white truncate">{activeContact.name}</h3>
                      {getRoleBadge(activeContact)}
                    </div>
                    <div className="flex items-center space-x-2 text-[11px] text-slate-400 mt-0.5">
                      {!activeContact.id?.startsWith('class-group-') && !activeContact.id?.startsWith('broadcast-') && activeContact.id !== 'broadcast-all' && (
                        <>
                          {isUserOnline(activeContact) ? (
                            <>
                              <span className="text-emerald-400 font-semibold">● Çevrimiçi</span>
                              <span>•</span>
                            </>
                          ) : (
                            <>
                              <span 
                                className={`text-slate-400 ${currentUser.role === 'teacher' ? 'cursor-pointer hover:text-slate-200 transition-colors' : ''}`}
                                onClick={() => {
                                  if (currentUser.role === 'teacher') {
                                    setShowExactLastSeen(!showExactLastSeen);
                                  }
                                }}
                                title={currentUser.role === 'teacher' ? "Kesin son görülme zamanını gör" : ""}
                              >
                                {showExactLastSeen && currentUser.role === 'teacher' 
                                  ? getExactLastSeenText(activeContact) 
                                  : getUserLastSeenText(activeContact)
                                }
                              </span>
                              <span>•</span>
                            </>
                          )}
                        </>
                      )}
                      <span className="truncate">{activeContact.title || activeContact.email}</span>
                    </div>
                  </div>
                </div>

                {/* Quick Info / Security Badge */}
                <div className="hidden sm:flex items-center space-x-2 bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-2xl">
                  <Lock className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-[11px] text-slate-300 font-medium">Uçtan Uca Kurumsal Güvenlik</span>
                </div>
              </div>

              {/* Chat Messages History Container */}
              <div 
                ref={chatContainerRef} 
                onScroll={handleScroll} 
                className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col bg-slate-950/40 scrollbar-thin"
              >
                {/* Load More Button / Indicator at Top if there are older messages */}
                {hasMoreMessages ? (
                  <div className="text-center my-2">
                    <button
                      type="button"
                      onClick={handleLoadMore}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-slate-800/90 hover:bg-indigo-900/80 border border-slate-700/80 hover:border-indigo-500/60 text-indigo-300 text-xs font-semibold shadow-md transition-all cursor-pointer group"
                    >
                      <ChevronUp className="w-3.5 h-3.5 text-indigo-400 group-hover:-translate-y-0.5 transition-transform" />
                      <span>Daha eski mesajları yükle ({remainingCount} mesaj kaldı)</span>
                    </button>
                  </div>
                ) : (
                  /* Information Card at Start of Chat when all messages loaded */
                  <div className="bg-slate-800 border border-slate-700 rounded-2xl p-3.5 text-center max-w-md mx-auto space-y-1 my-2 shadow-sm">
                    <div className="w-7 h-7 rounded-full bg-slate-700 text-indigo-300 flex items-center justify-center mx-auto mb-1 border border-slate-600">
                      <ShieldAlert className="w-3.5 h-3.5" />
                    </div>
                    <h4 className="text-xs font-bold text-white">Güvenli Rehberlik İletişimi</h4>
                    <p className="text-xs text-slate-200 font-medium leading-relaxed">
                      Bu sohbet penceresinde yapılan tüm yazışmalar YKS Koçluk ve Rehberlik Servisi takibindedir.
                    </p>
                  </div>
                )}

                {conversationMessages.length === 0 ? (
                  <div className="text-center py-12 space-y-3">
                    <MessageSquare className="w-12 h-12 text-slate-700 mx-auto" />
                    <p className="text-xs font-semibold text-slate-400">
                      Henüz mesaj yok. Aşağıdaki mesaj kutusunu kullanarak sohbeti başlatabilirsiniz.
                    </p>
                  </div>
                ) : (
                  displayedMessages.map((msg, idx) => {
                    const isMine = msg.senderId === currentUser.id;
                    const isGroupChat = activeContact.id?.startsWith('class-group-') || activeContact.id?.startsWith('broadcast-') || activeContact.id === 'broadcast-all';

                    const prevMsg = idx > 0 ? displayedMessages[idx - 1] : null;
                    const nextMsg = idx < displayedMessages.length - 1 ? displayedMessages[idx + 1] : null;

                    const isPrevSameSender = prevMsg && prevMsg.senderId === msg.senderId && formatShortDate(prevMsg.timestamp) === formatShortDate(msg.timestamp);
                    const isNextSameSender = nextMsg && nextMsg.senderId === msg.senderId && formatShortDate(msg.timestamp) === formatShortDate(nextMsg.timestamp);

                    const showSenderInfo = !isPrevSameSender;
                    const isHighlighted = highlightedMessageId === msg.id;

                    const isSwiping = swipeState?.id === msg.id;
                    const swipeX = isSwiping ? swipeState.currentX - swipeState.startX : 0;
                    // Limit swipe to right direction and max 60px
                    const boundedSwipeX = Math.max(0, Math.min(swipeX, 60));

                    return (
                      <div 
                        key={msg.id || idx}
                        className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} ${isNextSameSender ? 'mb-0.5' : 'mb-3'} group relative `}
                        onTouchStart={(e) => setSwipeState({ id: msg.id, startX: e.touches[0].clientX, currentX: e.touches[0].clientX })}
                        onTouchMove={(e) => {
                          if (swipeState?.id === msg.id) {
                            setSwipeState({ ...swipeState, currentX: e.touches[0].clientX });
                          }
                        }}
                        onTouchEnd={() => {
                          if (isSwiping && boundedSwipeX > 40) {
                            setReplyingToMsg(msg);
                            if (textareaRef.current) textareaRef.current.focus();
                          }
                          setSwipeState(null);
                        }}
                      >
                        {/* Reply Indicator (Left Side behind message) */}
                        <div 
                          className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center justify-center bg-indigo-600/80 rounded-full w-8 h-8 transition-opacity"
                          style={{
                            opacity: boundedSwipeX / 60,
                            transform: `translate(${boundedSwipeX - 40}px, -50%)`
                          }}
                        >
                          <Reply className="w-4 h-4 text-white" />
                        </div>

                        <div 
                          className="w-full flex flex-col transition-transform duration-75"
                          style={{
                            transform: isSwiping ? `translateX(${boundedSwipeX}px)` : 'translateX(0px)',
                            transition: isSwiping ? 'none' : 'transform 0.2s ease-out',
                            alignItems: isMine ? 'flex-end' : 'flex-start'
                          }}
                        >
                        {showSenderInfo && (
                          <div className={`flex items-center space-x-2 mb-1 ${isMine ? 'pr-1' : 'pl-1'}`}>
                            <span className={`text-[10px] font-semibold ${!isMine && isGroupChat ? getUserColor(msg.senderId) : 'text-slate-400'}`}>
                              {isMine ? 'Siz' : msg.senderName}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {formatShortDate(msg.timestamp)}
                            </span>
                          </div>
                        )}

                        <div 
                          id={`msg-bubble-${msg.id}`}
                          className={`relative max-w-[85%] sm:max-w-[75%] px-3 py-2 text-xs sm:text-sm shadow-sm transition-all duration-500 flex flex-col ${
                            isHighlighted 
                              ? 'ring-2 ring-indigo-400/50 bg-indigo-500/20 shadow-lg shadow-indigo-500/20 z-10 scale-[1.01]' 
                              : ''
                          } ${
                            isMine
                              ? `sent-message-bubble bg-gradient-to-r from-indigo-600 to-purple-600 text-white border border-indigo-400/30 ${!isPrevSameSender ? 'rounded-tr-none' : 'rounded-tr-md'} ${isNextSameSender ? 'rounded-br-md' : ''} rounded-2xl`
                              : `received-message-bubble bg-slate-800 border border-slate-700 text-slate-100 ${!isPrevSameSender ? 'rounded-tl-none' : 'rounded-tl-md'} ${isNextSameSender ? 'rounded-bl-md' : ''} rounded-2xl`
                          }`}
                        >
                          
                          {/* Quoted Message */}
                          {msg.replyTo && (
                            <div 
                              className="mb-1.5 p-2 rounded-lg bg-black/30 border-l-2 border-indigo-400 text-[10px] sm:text-xs cursor-pointer opacity-90 hover:opacity-100 hover:bg-black/40 transition-all flex flex-col group/quote"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (msg.replyTo?.id) {
                                  scrollToMessage(msg.replyTo.id);
                                }
                              }}
                              title="Alıntı yapılan mesaja git"
                            >
                              <div className="flex items-center justify-between space-x-1 mb-0.5">
                                <span className="font-bold text-indigo-300">
                                  {msg.replyTo.senderName}
                                </span>
                                <span className="text-[9px] text-indigo-300/70 group-hover/quote:underline font-mono">
                                  Mesaja git &rarr;
                                </span>
                              </div>
                              <span className="line-clamp-2 text-white/80">
                                {msg.replyTo.content || (msg.replyTo.attachmentUrl ? 'Görsel / Dosya' : '')}
                              </span>
                            </div>
                          )}

                          {/* Message Content */}
                          <div className="flex flex-col min-w-[3rem]">
                            {msg.isDeleted ? (
                              <div className="flex flex-col space-y-1 py-1">
                                <div className="flex items-center space-x-1.5 text-slate-300/80 italic text-xs">
                                  <Trash2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  <span>Bu mesaj kullanıcı tarafından silindi</span>
                                </div>
                                {currentUser?.role === 'admin' && msg.originalContent && (
                                  <div className="text-[10px] text-amber-300/90 font-mono not-italic bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20 max-w-md break-words">
                                    <span className="font-bold text-amber-400">🔍 Admin Görünümü (Silinen Mesaj):</span> "{msg.originalContent}"
                                  </div>
                                )}
                              </div>
                            ) : editingMessageId === msg.id ? (
                              <div className="flex flex-col space-y-2 w-full min-w-[200px] sm:min-w-[260px] py-1">
                                <textarea
                                  value={editContentText}
                                  onChange={(e) => setEditContentText(e.target.value)}
                                  className="w-full bg-black/40 border border-indigo-300/50 rounded-xl p-2 text-xs sm:text-sm text-white outline-none resize-none focus:ring-1 focus:ring-indigo-300"
                                  rows={2}
                                  autoFocus
                                />
                                <div className="flex items-center justify-end space-x-2">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingMessageId(null);
                                      setEditContentText('');
                                    }}
                                    className="px-2.5 py-1 text-[11px] font-medium text-slate-200 hover:text-white rounded-lg bg-white/10 transition-colors"
                                  >
                                    İptal
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (!editContentText.trim()) return;
                                      if (!canEditOrDeleteMessage(msg)) {
                                        setEditingMessageId(null);
                                        return;
                                      }
                                      if (onEditMessage) {
                                        onEditMessage(msg.id, editContentText.trim());
                                      }
                                      setEditingMessageId(null);
                                      setEditContentText('');
                                    }}
                                    className="px-2.5 py-1 text-[11px] font-bold text-white rounded-lg bg-indigo-600 hover:bg-indigo-500 shadow-sm transition-colors"
                                  >
                                    Kaydet
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <p className="whitespace-pre-wrap leading-relaxed break-words">{renderMessageContent(msg.content)}</p>

                                {/* Attachment Link or Image Preview */}
                                {msg.attachmentUrl && (
                                  <div className="mt-2.5 pt-2 border-t border-white/20">
                                    {isImageAttachment(msg.attachmentUrl) ? (
                                      <MessageAttachmentView 
                                        url={msg.attachmentUrl} 
                                        onPreview={() => setPreviewImageModalUrl(msg.attachmentUrl)} 
                                      />
                                    ) : (
                                      <div className="flex items-center space-x-2">
                                        <ExternalLink className="w-3.5 h-3.5 text-indigo-200 shrink-0" />
                                        <a 
                                          href={msg.attachmentUrl} 
                                          target="_blank" 
                                          rel="noreferrer"
                                          className="text-[11px] underline font-semibold text-indigo-100 hover:text-white truncate"
                                        >
                                          {msg.attachmentUrl}
                                        </a>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </>
                            )}

                            {/* Message Footer: Read ticks & Read Time Tooltip */}
                            <div className="flex items-center justify-end space-x-1 mt-1 -mb-0.5 float-right">
                              {!isBroadcastChannel && !msg.isDeleted && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setReplyingToMsg(msg);
                                    if (textareaRef.current) textareaRef.current.focus();
                                  }}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-white/10 rounded mr-0.5"
                                  title="Yanıtla"
                                >
                                  <Reply className="w-3 h-3 text-white/70" />
                                </button>
                              )}

                              {/* 1-Minute Edit & Delete Buttons for sent message */}
                              {isMine && !msg.isDeleted && canEditOrDeleteMessage(msg) && (
                                <>
                                  {deletingConfirmMsgId === msg.id ? (
                                    <span className="inline-flex items-center space-x-1.5 bg-red-950/90 border border-red-500/50 px-2 py-0.5 rounded-lg text-white mr-1 shadow-sm animate-fadeIn">
                                      <span className="text-[10px] font-medium text-red-100">Silinsin mi?</span>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (onDeleteMessage) {
                                            onDeleteMessage(msg.id);
                                          }
                                          setDeletingConfirmMsgId(null);
                                        }}
                                        className="px-1.5 py-0.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded text-[9px] shadow-sm transition-colors"
                                      >
                                        Evet
                                      </button>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setDeletingConfirmMsgId(null);
                                        }}
                                        className="px-1.5 py-0.5 bg-white/20 hover:bg-white/30 text-white rounded text-[9px] transition-colors"
                                      >
                                        İptal
                                      </button>
                                    </span>
                                  ) : (
                                    <>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (!canEditOrDeleteMessage(msg)) return;
                                          setEditingMessageId(msg.id);
                                          setEditContentText(msg.content);
                                        }}
                                        className="opacity-50 sm:opacity-10 hover:opacity-100 sm:group-hover:opacity-100 transition-opacity p-0.5 hover:bg-white/10 rounded mr-0.5 text-indigo-200 hover:text-white"
                                        title="Mesajı Düzenle (1 dk içerisinde)"
                                      >
                                        <Pencil className="w-3 h-3" />
                                      </button>

                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (!canEditOrDeleteMessage(msg)) return;
                                          setDeletingConfirmMsgId(msg.id);
                                        }}
                                        className="opacity-50 sm:opacity-10 hover:opacity-100 sm:group-hover:opacity-100 transition-opacity p-0.5 hover:bg-white/10 rounded mr-1 text-red-300 hover:text-red-100"
                                        title="Mesajı Sil (1 dk içerisinde)"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </>
                                  )}
                                </>
                              )}

                              {/* Timestamp or Edited Badge */}
                              {msg.isEdited && !msg.isDeleted ? (
                                <span className="text-[9px] font-medium text-indigo-200/90 italic mr-1">
                                  düzenlendi: {msg.editedAt || formatTime(msg.timestamp)}
                                </span>
                              ) : (
                                <span className="text-[9px] font-mono text-white/70">
                                  {formatTime(msg.timestamp)}
                                </span>
                              )}
                              {isMine && (
                                <div className="relative flex items-center">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (isGroupChat) {
                                        setReadReceiptModalMsg(msg);
                                      } else {
                                        setActiveReadTimeMessageId(prev => prev === msg.id ? null : msg.id);
                                      }
                                    }}
                                    className="group/read relative flex items-center space-x-1 focus:outline-none cursor-pointer rounded px-1 py-0.5 hover:bg-white/10 transition-colors"
                                    title={formatReadTimeLabel(msg, isGroupChat)}
                                  >
                                    {/* Floating Read Time Tooltip / Popup Badge */}
                                    <div className={`absolute bottom-full right-0 mb-1.5 px-2.5 py-1 rounded-xl bg-slate-900 border border-sky-400/50 text-sky-200 text-[10px] font-semibold whitespace-nowrap shadow-xl backdrop-blur-md transition-all z-20 pointer-events-none ${
                                      activeReadTimeMessageId === msg.id 
                                        ? 'flex opacity-100 scale-100' 
                                        : 'hidden group-hover/read:flex opacity-0 group-hover/read:opacity-100 scale-95 group-hover/read:scale-100'
                                    }`}>
                                      <div className="flex items-center space-x-1.5">
                                        <Clock className="w-3 h-3 text-sky-400 shrink-0 animate-pulse" />
                                        <span>{formatReadTimeLabel(msg, isGroupChat)}</span>
                                      </div>
                                      {/* Arrow */}
                                      <div className="absolute -bottom-1 right-2 w-2 h-2 bg-slate-900 border-r border-b border-sky-400/50 rotate-45" />
                                    </div>

                                    {msg.isRead ? (
                                      /* Okundu: Renkli Mavi Çift Tık */
                                      <div className="flex items-center text-sky-300 group-hover/read:text-sky-200 transition-colors">
                                        <CheckCheck className="w-3.5 h-3.5 text-sky-300" />
                                      </div>
                                    ) : msg.isDelivered ? (
                                      /* İletildi (Hesaba Ulaştı): Gri Çift Tık */
                                      <div className="flex items-center text-slate-300 group-hover/read:text-white transition-colors">
                                        <CheckCheck className="w-3.5 h-3.5 text-slate-300" />
                                      </div>
                                    ) : (
                                      /* Gönderildi: Gri Tek Tık */
                                      <div className="flex items-center text-slate-400 group-hover/read:text-slate-200 transition-colors">
                                        <Check className="w-3.5 h-3.5 text-slate-400" />
                                      </div>
                                    )}
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

                            {/* Replying To Preview Bar */}
              {replyingToMsg && (
                <div className="px-4 py-2 flex items-center justify-between space-x-3 bg-slate-900/90 border-t border-slate-800 border-l-4 border-l-indigo-500">
                  <div className="flex-1 min-w-0 flex flex-col justify-center space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <Reply className="w-3.5 h-3.5 text-indigo-400" />
                      <span className="text-xs font-bold text-indigo-400">
                        {replyingToMsg.senderId === currentUser.id ? 'Kendinize yanıt veriyorsunuz' : `${replyingToMsg.senderName} kişisine yanıt veriyorsunuz`}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 truncate pr-4">
                      {replyingToMsg.content || (replyingToMsg.attachmentUrl ? 'Görsel / Dosya' : '')}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setReplyingToMsg(null)}
                    className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors shrink-0"
                    title="Alıntıyı iptal et"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Selected Compressed Image Preview Bar */}
              {selectedImagePreview && (
                <div className="px-3.5 py-2 flex items-center justify-between space-x-3 bg-slate-900/90 border-t border-slate-800">
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="relative group rounded-lg  border border-indigo-500/50 w-12 h-12 shrink-0 bg-slate-950">
                      <img src={selectedImagePreview} alt="Sıkıştırılmış görsel" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedImagePreview(null);
                          setCompressionInfo(null);
                        }}
                        className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-slate-900/90 text-white hover:bg-red-600 transition-colors"
                        title="Görseli kaldır"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="flex-1 min-w-0 text-xs space-y-0.5">
                      <span className="text-indigo-300 font-bold flex items-center space-x-1 truncate">
                        <span>⚡ Fotoğraf Eklendi (Sıkıştırıldı)</span>
                      </span>
                      {compressionInfo && (
                        <p className="text-[10px] text-slate-400 font-mono">
                          {compressionInfo.originalKb} KB &rarr; <span className="text-emerald-400 font-bold">{compressionInfo.compressedKb} KB</span>
                          {compressionInfo.originalKb > compressionInfo.compressedKb ? (
                            <span className="text-emerald-400/90 ml-1">
                              (%{Math.max(0, Math.round((1 - compressionInfo.compressedKb / compressionInfo.originalKb) * 100))} Tasarruf)
                            </span>
                          ) : (
                            <span className="text-emerald-400/90 ml-1"> (Optimize Edildi)</span>
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedImagePreview(null);
                      setCompressionInfo(null);
                    }}
                    className="text-xs text-slate-400 hover:text-red-400 underline shrink-0 font-medium"
                  >
                    Kaldır
                  </button>
                </div>
              )}

              {/* Message Input Controls */}
              {isBroadcastChannel ? (
                <div className="p-4 border-t border-slate-800 bg-slate-950/90 text-center text-xs text-slate-400 font-medium flex items-center justify-center space-x-2 rounded-b-3xl">
                  <ShieldAlert className="w-4.5 h-4.5 text-amber-400/90 shrink-0" />
                  <span>Bu kanal sadece bilgilendirme amaçlıdır. Sistem duyurularına mesaj gönderilemez.</span>
                </div>
              ) : (
                <div className="p-3.5 border-t border-slate-800 bg-slate-950 flex items-center space-x-2">
                  
                  {/* Hidden File Input for Image Selection */}
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    accept="image/*" 
                    onChange={handleFileSelect} 
                    className="hidden" 
                  />

                  {/* Direct Image Upload Button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isCompressingImage}
                    title="Fotoğraf Yükle (Otomatik Sıkıştırma)"
                    className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500 text-indigo-400 hover:text-indigo-300 transition-all shrink-0 relative disabled:opacity-50"
                  >
                    {isCompressingImage ? (
                      <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                    ) : (
                      <ImageIcon className="w-4 h-4" />
                    )}
                  </button>

                  {/* Text Area Input */}
                  <textarea
                    ref={textareaRef}
                    value={messageText}
                    onChange={(e) => {
                      setMessageText(e.target.value);
                      if (textareaRef.current) {
                        textareaRef.current.style.height = 'auto';
                        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder={
                      selectedImagePreview 
                        ? "Açıklama ekleyin (isteğe bağlı) ve Gönder'e basın..."
                        : `${activeContact.name} kişisine mesaj yazın... (Enter ile gönder)`
                    }
                    rows={1}
                    className="flex-1 bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 outline-none transition-all resize-none max-h-[120px] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                    style={{ minHeight: '40px', overflowY: 'auto' }}
                  />

                  {/* Send Button */}
                  <button
                    type="button"
                    onClick={() => handleSend()}
                    disabled={(!messageText.trim() && !selectedImagePreview) || isCompressingImage}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs sm:text-sm flex items-center space-x-2 shadow-lg shadow-indigo-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0"
                  >
                    <span>Gönder</span>
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
            );
          })() : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
              <MessageSquare className="w-16 h-16 text-slate-700" />
              <h3 className="text-base font-bold text-white">Sohbet Başlatmak İçin Bir İletişim Kişisi Seçin</h3>
              <p className="text-xs text-slate-400 max-w-sm">
                Sol listeden mesajlaşmak istediğiniz öğretmeninizi veya öğrencinizi seçebilirsiniz.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Attachment Modal (Photo or Link) */}
      {showAttachmentModal && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowAttachmentModal(false); }}
        >
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Paperclip className="w-4 h-4 text-indigo-400" />
                <span>Fotoğraf veya Doküman Ekle</span>
              </h3>
              <button 
                onClick={() => setShowAttachmentModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Option 1: Direct Photo Upload with Compression */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto">
                <UploadCloud className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-bold text-white">Fotoğraf Yükle (Otomatik Sıkıştırma)</h4>
              <p className="text-[11px] text-slate-400">
                Görseller cihazınızda otomatik olarak ~50-100KB boyutuna sıkıştırılır ve doğrudan mesaja eklenir.
              </p>
              <button
                type="button"
                onClick={() => {
                  fileInputRef.current?.click();
                }}
                disabled={isCompressingImage}
                className="w-full py-2 px-3 rounded-xl bg-indigo-600/90 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors flex items-center justify-center space-x-2"
              >
                {isCompressingImage ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sıkıştırılıyor...</span>
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-4 h-4" />
                    <span>Cihazdan Fotoğraf Seç</span>
                  </>
                )}
              </button>
            </div>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-800"></div>
              <span className="flex-shrink mx-3 text-[10px] text-slate-500 font-bold uppercase tracking-wider">veya</span>
              <div className="flex-grow border-t border-slate-800"></div>
            </div>

            {/* Option 2: External Link */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 block">
                Bağlantı / Doküman URL Adresi (Google Drive, PDF vb.)
              </label>
              <input
                type="url"
                value={attachmentUrlInput}
                onChange={(e) => setAttachmentUrlInput(e.target.value)}
                placeholder="https://..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-1 border-t border-slate-800/80">
              <button
                onClick={() => setShowAttachmentModal(false)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300 hover:bg-slate-700"
              >
                İptal
              </button>
              <button
                onClick={() => {
                  if (attachmentUrlInput.trim()) {
                    handleSend(messageText || 'Ek doküman paylaşıldı:', attachmentUrlInput.trim());
                  }
                }}
                disabled={!attachmentUrlInput.trim()}
                className="px-4 py-1.5 rounded-xl bg-indigo-600 text-xs font-bold text-white hover:bg-indigo-500 disabled:opacity-50"
              >
                Link Ekle ve Gönder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Full Screen Image Preview */}
      {previewImageModalUrl && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setPreviewImageModalUrl(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center p-2" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setPreviewImageModalUrl(null)}
              className="absolute -top-12 right-0 text-white hover:text-indigo-300 p-2 rounded-full bg-slate-800/80 hover:bg-slate-800 backdrop-blur-md transition-colors cursor-pointer"
              title="Kapat"
            >
              <X className="w-6 h-6" />
            </button>
            <img 
              src={previewImageModalUrl} 
              alt="Görsel Detayı" 
              className="max-w-full max-h-[82vh] object-contain rounded-2xl shadow-2xl border border-slate-700/80"
            />
          </div>
        </div>
      )}

      {/* Modal: Group Chat Read Receipts */}
      {readReceiptModalMsg && (() => {
        const readByList = readReceiptModalMsg.readBy || [];
        const readUserIds = new Set(readByList.map(r => r.userId));

        let groupMembers: UserAccount[] = [];

        if (readReceiptModalMsg.receiverId?.startsWith('broadcast-') || readReceiptModalMsg.receiverId === 'broadcast-all') {
          groupMembers = allUsers.filter(u => {
            if (u.id === readReceiptModalMsg.senderId) return false;
            if (u.status === 'pending' || u.status === 'rejected') return false;
            if (readReceiptModalMsg.receiverId === 'broadcast-all') return true;
            if (readReceiptModalMsg.receiverId === 'broadcast-students') return u.role === 'student' || u.role === 'admin';
            if (readReceiptModalMsg.receiverId === 'broadcast-teachers') return u.role === 'teacher' || u.role === 'class_teacher' || u.role === 'admin';
            if (readReceiptModalMsg.receiverId === 'broadcast-counselors') return u.role === 'school_counselor' || u.role === 'admin';
            return false;
          });
        } else if (readReceiptModalMsg.receiverId?.startsWith('class-group-')) {
          const classId = readReceiptModalMsg.receiverId.replace('class-group-', '');
          const classDef = classes.find(c => c.id === classId);

          groupMembers = allUsers.filter(u => {
            if (u.id === readReceiptModalMsg.senderId) return false;
            if (u.status === 'pending' || u.status === 'rejected') return false;

            const isClassStudent = classDef ? u.className === classDef.name : false;
            const isClassTeacher = classDef ? (classDef.assignedTeacherIds?.includes(u.id) || u.assignedClassNames?.includes(classDef.name)) : false;
            const isCounselorOrAdmin = u.role === 'school_counselor' || u.role === 'admin';

            return isClassStudent || isClassTeacher || isCounselorOrAdmin;
          });
        } else {
          const receiver = allUsers.find(u => u.id === readReceiptModalMsg.receiverId);
          if (receiver && receiver.id !== readReceiptModalMsg.senderId) {
            groupMembers = [receiver];
          }
        }

        const unreadList = groupMembers.filter(u => !readUserIds.has(u.id));

        return (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => {
              setReadReceiptModalMsg(null);
              setReadReceiptTab('read');
            }}
          >
            <div 
              className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
                <div className="flex items-center space-x-2">
                  <CheckCheck className="w-5 h-5 text-sky-400" />
                  <h3 className="text-sm font-bold text-white">Mesaj Bilgisi</h3>
                </div>
                <button
                  onClick={() => {
                    setReadReceiptModalMsg(null);
                    setReadReceiptTab('read');
                  }}
                  className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-slate-800 bg-slate-950/30">
                <button
                  type="button"
                  onClick={() => setReadReceiptTab('read')}
                  className={`flex-1 py-2.5 px-3 text-xs font-bold transition-all border-b-2 flex items-center justify-center space-x-1.5 cursor-pointer ${
                    readReceiptTab === 'read'
                      ? 'border-sky-400 text-sky-400 bg-sky-500/10'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <CheckCheck className="w-4 h-4" />
                  <span>Okuyanlar ({readByList.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setReadReceiptTab('unread')}
                  className={`flex-1 py-2.5 px-3 text-xs font-bold transition-all border-b-2 flex items-center justify-center space-x-1.5 cursor-pointer ${
                    readReceiptTab === 'unread'
                      ? 'border-amber-400 text-amber-400 bg-amber-500/10'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  <span>Okumayanlar ({unreadList.length})</span>
                </button>
              </div>

              {/* List Content */}
              <div className="p-4 max-h-80 overflow-y-auto space-y-3 custom-scrollbar min-h-[160px]">
                {readReceiptTab === 'read' ? (
                  readByList.length === 0 ? (
                    <div className="text-center py-8 space-y-1">
                      <Clock className="w-8 h-8 text-slate-600 mx-auto" />
                      <p className="text-xs text-slate-400 italic">Mesaj henüz kimse tarafından okunmadı.</p>
                    </div>
                  ) : (
                    readByList.map(receipt => {
                      const reader = allUsers.find(u => u.id === receipt.userId);
                      if (!reader) return null;
                      
                      let timeStr = receipt.readAt;
                      if (timeStr) {
                        const parts = timeStr.split(' ');
                        if (parts.length === 2) {
                          const dateParts = parts[0].split('-');
                          if (dateParts.length === 3) {
                             timeStr = `${dateParts[2]}.${dateParts[1]}.${dateParts[0]} ${parts[1]}`;
                          }
                        }
                      }

                      return (
                        <div key={receipt.userId} className="flex items-center justify-between bg-slate-800/50 p-3 rounded-2xl border border-white/5">
                          <div className="flex items-center space-x-3">
                            <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold text-xs shrink-0 overflow-hidden">
                              {reader.avatarUrl ? (
                                <img src={reader.avatarUrl} alt={reader.name} className="w-full h-full object-cover" />
                              ) : reader.name.charAt(0)}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-white">{reader.name}</span>
                              <span className="text-[10px] text-slate-400">{reader.title || reader.role}</span>
                            </div>
                          </div>
                          <div className="text-[10px] text-sky-300 font-mono text-right shrink-0">
                            {timeStr}
                          </div>
                        </div>
                      );
                    })
                  )
                ) : (
                  unreadList.length === 0 ? (
                    <div className="text-center py-8 space-y-1">
                      <CheckCheck className="w-8 h-8 text-emerald-400 mx-auto" />
                      <p className="text-xs text-emerald-300 font-semibold">Tüm grup üyeleri bu mesajı okudu!</p>
                    </div>
                  ) : (
                    unreadList.map(member => (
                      <div key={member.id} className="flex items-center justify-between bg-slate-800/40 p-3 rounded-2xl border border-white/5">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-full bg-slate-700/80 flex items-center justify-center text-white font-bold text-xs shrink-0 overflow-hidden">
                            {member.avatarUrl ? (
                              <img src={member.avatarUrl} alt={member.name} className="w-full h-full object-cover" />
                            ) : member.name.charAt(0)}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-200">{member.name}</span>
                            <span className="text-[10px] text-slate-400">{member.title || member.role}</span>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] font-medium text-amber-300 shrink-0">
                          Henüz okumadı
                        </span>
                      </div>
                    ))
                  )
                )}
              </div>

              {/* Bottom Footer toggle bar */}
              <div className="p-3 border-t border-slate-800 bg-slate-950/70 text-center">
                <button
                  type="button"
                  onClick={() => setReadReceiptTab(prev => prev === 'read' ? 'unread' : 'read')}
                  className="w-full py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition-all flex items-center justify-center space-x-2 cursor-pointer"
                >
                  {readReceiptTab === 'read' ? (
                    <>
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>Okumayanlar ({unreadList.length} kişi) &rarr;</span>
                    </>
                  ) : (
                    <>
                      <CheckCheck className="w-3.5 h-3.5 text-sky-400" />
                      <span>Okuyanlar ({readByList.length} kişi) &rarr;</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          </div>
        );
      })()}

      {/* New Chat Selection Modal */}
      {showNewChatModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <MessageSquarePlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white">Yeni Mesaj Gönder</h3>
                  <p className="text-[11px] text-slate-400">Sohbet başlatmak istediğiniz kişiyi veya grubu seçin</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowNewChatModal(false)}
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Search & Category Filter */}
            <div className="p-4 border-b border-slate-800/80 bg-slate-900/50 space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={newChatSearch}
                  onChange={(e) => setNewChatSearch(e.target.value)}
                  placeholder="İsim, unvan veya sınıf ile ara..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
                  autoFocus
                />
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-[11px] no-scrollbar">
                <button
                  type="button"
                  onClick={() => setNewChatCategory('all')}
                  className={`px-3 py-1 rounded-xl whitespace-nowrap font-semibold transition-all cursor-pointer ${
                    newChatCategory === 'all'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Tümü ({allowedContacts.filter(c => c.id !== 'broadcast-all').length})
                </button>
                <button
                  type="button"
                  onClick={() => setNewChatCategory('students')}
                  className={`px-3 py-1 rounded-xl whitespace-nowrap font-semibold transition-all cursor-pointer ${
                    newChatCategory === 'students'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Öğrenciler
                </button>
                <button
                  type="button"
                  onClick={() => setNewChatCategory('teachers')}
                  className={`px-3 py-1 rounded-xl whitespace-nowrap font-semibold transition-all cursor-pointer ${
                    newChatCategory === 'teachers'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Öğretmenler
                </button>
                <button
                  type="button"
                  onClick={() => setNewChatCategory('counselors')}
                  className={`px-3 py-1 rounded-xl whitespace-nowrap font-semibold transition-all cursor-pointer ${
                    newChatCategory === 'counselors'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Rehberlik / Yönetim
                </button>
                <button
                  type="button"
                  onClick={() => setNewChatCategory('groups')}
                  className={`px-3 py-1 rounded-xl whitespace-nowrap font-semibold transition-all cursor-pointer ${
                    newChatCategory === 'groups'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Sınıf Grupları
                </button>
              </div>
            </div>

            {/* Modal Contact List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1 divide-y divide-slate-800/40">
              {modalAvailableContacts.length === 0 ? (
                <div className="text-center py-10 px-4 space-y-2">
                  <ShieldAlert className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-xs font-medium text-slate-400">Aradığınız kriterlere uygun iletişim kişisi bulunamadı.</p>
                </div>
              ) : (
                modalAvailableContacts.map(contact => {
                  const contactMsgs = getContactMessages(contact, messages, currentUser.id, currentUser.role);
                  const hasExistingChat = contactMsgs.length > 0;

                  return (
                    <button
                      key={contact.id}
                      type="button"
                      onClick={() => {
                        setSelectedContactId(contact.id);
                        setActiveMobileScreen('chat');
                        setShowNewChatModal(false);
                        setNewChatSearch('');
                      }}
                      className="w-full text-left p-3 rounded-2xl hover:bg-slate-800/80 transition-all flex items-center space-x-3 group border border-transparent hover:border-slate-700/60 cursor-pointer"
                    >
                      <div className="relative shrink-0">
                        {contact.id === 'broadcast-all' || contact.id?.startsWith('broadcast-') ? (
                          <div className="w-10 h-10 rounded-2xl bg-slate-950 border border-amber-500/30 p-1 shadow-md flex items-center justify-center shrink-0 overflow-hidden">
                            <YildizLisesiLogo className="w-full h-full object-contain" />
                          </div>
                        ) : contact.id?.startsWith('class-group-') ? (
                          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold flex items-center justify-center text-xs shadow-md">
                            <Users className="w-5 h-5" />
                          </div>
                        ) : contact.avatarUrl ? (
                          <img 
                            src={contact.avatarUrl} 
                            alt={contact.name} 
                            className="w-10 h-10 rounded-2xl object-cover border border-slate-700" 
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center text-xs shadow-md">
                            {contact.name.charAt(0)}
                          </div>
                        )}
                        {!contact.id?.startsWith('class-group-') && !contact.id?.startsWith('broadcast-') && isUserOnline(contact) && (
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-slate-900 absolute -bottom-0.5 -right-0.5 shadow-sm" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between space-x-2">
                          <span className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors truncate">
                            {contact.name}
                          </span>
                          {hasExistingChat ? (
                            <span className="text-[10px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full shrink-0 font-medium">
                              Sohbet Var
                            </span>
                          ) : (
                            <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full shrink-0 font-medium">
                              + Yeni Sohbet
                            </span>
                          )}
                        </div>
                        <div className="mt-0.5 flex items-center space-x-2">
                          {getRoleBadge(contact)}
                          <span className="text-[10px] text-slate-400 truncate">{contact.title || contact.email}</span>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
