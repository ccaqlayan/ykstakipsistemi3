import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';
import { app } from './firebase';
import { compressImageFile } from '../utils/imageCompressor';

export interface UploadResult {
  url: string;
  originalKb: number;
  compressedKb: number;
}

export type StorageDeliveryMode = 'FIREBASE_DIRECT' | 'LOCAL_MIRROR';

const STORAGE_DELIVERY_MODE_KEY = 'yks_storage_delivery_mode';

let currentStorageDeliveryMode: StorageDeliveryMode = 
  (typeof window !== 'undefined' && localStorage.getItem(STORAGE_DELIVERY_MODE_KEY) as StorageDeliveryMode) || 'FIREBASE_DIRECT';

export function getStorageDeliveryMode(): StorageDeliveryMode {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_DELIVERY_MODE_KEY) as StorageDeliveryMode;
    if (saved === 'FIREBASE_DIRECT' || saved === 'LOCAL_MIRROR') {
      currentStorageDeliveryMode = saved;
    }
  }
  return currentStorageDeliveryMode;
}

export function setStorageDeliveryMode(mode: StorageDeliveryMode): void {
  currentStorageDeliveryMode = mode;
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_DELIVERY_MODE_KEY, mode);
  }
}

function getClientStorage() {
  try {
    return getStorage(app);
  } catch (e) {
    console.warn('Firebase client storage init warning:', e);
    return null;
  }
}

/**
 * Firebase Storage CDN URL'ini manuel olarak oluşturur.
 * getDownloadURL() başarısız olduğunda fallback olarak kullanılır.
 * Format: https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{encodedPath}?alt=media
 */
function buildFirebaseStorageCDNUrl(storagePath: string): string | null {
  try {
    const storage = getClientStorage();
    if (!storage) return null;
    // Firebase app config'den bucket'i çıkar
    const appConfig = (app as any).options;
    const bucket = appConfig?.storageBucket;
    if (!bucket) return null;
    const encodedPath = encodeURIComponent(storagePath).replace(/%2F/g, '%2F');
    return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodedPath}?alt=media`;
  } catch (e) {
    return null;
  }
}

export async function uploadProfileAvatar(file: File, userId: string): Promise<UploadResult> {
  const { dataUrl, originalKb, compressedKb } = await compressImageFile(file, 800, 0.7);
  let ext = 'jpg';
  if (dataUrl.startsWith('data:image/png')) ext = 'png';
  else if (dataUrl.startsWith('data:image/webp')) ext = 'webp';

  const storagePath = `avatars/${userId}/profile.${ext}`;
  const serverCachedUrl = `/uploads/${storagePath}?t=${Date.now()}`;
  let finalUrl = serverCachedUrl;
  const isDirect = getStorageDeliveryMode() === 'FIREBASE_DIRECT';

  // 1. Direct Firebase Storage Upload (Kalıcı Bulut Yedeği)
  try {
    const storage = getClientStorage();
    if (storage) {
      const storageRef = ref(storage, storagePath);
      await uploadString(storageRef, dataUrl, 'data_url');
      if (isDirect) {
        try {
          const directUrl = await getDownloadURL(storageRef);
          if (directUrl) {
            finalUrl = directUrl;
          }
        } catch (urlErr) {
          // getDownloadURL başarısız: manuel CDN URL oluştur
          const cdnUrl = buildFirebaseStorageCDNUrl(storagePath);
          if (cdnUrl) {
            finalUrl = cdnUrl;
            console.info('[Storage] getDownloadURL failed, using manual CDN URL for avatar.');
          } else {
            console.warn('Could not get Firebase direct URL, fallback to cached:', urlErr);
          }
        }
      }
    }
  } catch (clientErr) {
    if (isDirect) {
      // Upload başarısız ama isDirect: yine de manuel CDN URL üreterek kaydet
      const cdnUrl = buildFirebaseStorageCDNUrl(storagePath);
      if (cdnUrl) finalUrl = cdnUrl;
    }
    console.warn('Direct Firebase Storage upload fallback to server:', clientErr);
  }

  // 2. Sunucuya da kopyala (Eğer LOCAL_MIRROR modundaysa veya directUrl alınamadıysa)
  if (!isDirect || finalUrl === serverCachedUrl) {
    try {
      await fetch('/api/upload/photo', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'avatar',
          userId,
          fileData: dataUrl,
          fileName: file.name
        })
      });
    } catch (err) {
      console.warn('Server mirror upload warning:', err);
    }
  }

  return { url: finalUrl, originalKb, compressedKb };
}

export async function uploadChannelAvatar(file: File, channelUrl: string, channelName: string): Promise<UploadResult> {
  const { dataUrl, originalKb, compressedKb } = await compressImageFile(file, 120, 0.60);
  let ext = 'jpg';
  if (dataUrl.startsWith('data:image/png')) ext = 'png';
  else if (dataUrl.startsWith('data:image/webp')) ext = 'webp';

  const handleMatch = channelUrl.match(/@([\w.-]+)/);
  let slug = '';
  if (handleMatch && handleMatch[1]) {
    slug = handleMatch[1].toLowerCase().replace(/[^a-z0-9]/g, '_');
  } else {
    slug = (channelName || 'chan').toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Math.abs(channelUrl.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a | 0; }, 0));
  }
  const storagePath = `avatars/youtube/${slug}.${ext}`;
  const serverCachedUrl = `/uploads/${storagePath}?t=${Date.now()}`;
  let finalUrl = serverCachedUrl;
  const isDirect = getStorageDeliveryMode() === 'FIREBASE_DIRECT';

  // Try direct Firebase Storage
  try {
    const storage = getClientStorage();
    if (storage) {
      const storageRef = ref(storage, storagePath);
      await uploadString(storageRef, dataUrl, 'data_url');
      if (isDirect) {
        try {
          const directUrl = await getDownloadURL(storageRef);
          if (directUrl) {
            finalUrl = directUrl;
          }
        } catch (urlErr) {
          const cdnUrl = buildFirebaseStorageCDNUrl(storagePath);
          if (cdnUrl) {
            finalUrl = cdnUrl;
            console.info('[Storage] getDownloadURL failed, using manual CDN URL for youtube avatar.');
          } else {
            console.warn('Could not get Firebase direct YouTube URL, fallback:', urlErr);
          }
        }
      }
    }
  } catch (err) {
    if (isDirect) {
      const cdnUrl = buildFirebaseStorageCDNUrl(storagePath);
      if (cdnUrl) finalUrl = cdnUrl;
    }
    console.warn('Direct YouTube avatar upload fallback to server:', err);
  }

  if (!isDirect || finalUrl === serverCachedUrl) {
    try {
      await fetch('/api/upload/photo', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'youtube-avatar',
          channelUrl,
          channelName,
          fileData: dataUrl,
          fileName: file.name
        })
      });
    } catch (err) {}
  }

  return { url: finalUrl, originalKb, compressedKb };
}

export async function uploadMessageAttachment(file: File, messageId: string): Promise<UploadResult> {
  const { dataUrl, originalKb, compressedKb } = await compressImageFile(file, 1000, 0.65);
  let ext = 'jpg';
  if (dataUrl.startsWith('data:image/png')) ext = 'png';
  else if (dataUrl.startsWith('data:image/webp')) ext = 'webp';

  const storagePath = `messages/${messageId}/attachment.${ext}`;
  const serverCachedUrl = `/uploads/${storagePath}?t=${Date.now()}`;
  let finalUrl = serverCachedUrl;
  const isDirect = getStorageDeliveryMode() === 'FIREBASE_DIRECT';

  try {
    const storage = getClientStorage();
    if (storage) {
      const storageRef = ref(storage, storagePath);
      await uploadString(storageRef, dataUrl, 'data_url');
      if (isDirect) {
        try {
          const directUrl = await getDownloadURL(storageRef);
          if (directUrl) {
            finalUrl = directUrl;
          }
        } catch (urlErr) {
          const cdnUrl = buildFirebaseStorageCDNUrl(storagePath);
          if (cdnUrl) {
            finalUrl = cdnUrl;
            console.info('[Storage] getDownloadURL failed, using manual CDN URL for message attachment.');
          } else {
            console.warn('Could not get Firebase direct attachment URL, fallback:', urlErr);
          }
        }
      }
    }
  } catch (err) {
    if (isDirect) {
      const cdnUrl = buildFirebaseStorageCDNUrl(storagePath);
      if (cdnUrl) finalUrl = cdnUrl;
    }
    console.warn('Direct message attachment upload fallback to server:', err);
  }

  if (!isDirect || finalUrl === serverCachedUrl) {
    try {
      await fetch('/api/upload/photo', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'message',
          messageId,
          fileData: dataUrl,
          fileName: file.name
        })
      });
    } catch (err) {}
  }

  return { url: finalUrl, originalKb, compressedKb };
}

export async function uploadQuestionErrorImage(file: File, userId: string, errorId: string): Promise<UploadResult> {
  const { dataUrl, originalKb, compressedKb } = await compressImageFile(file, 1000, 0.65);
  let ext = 'jpg';
  if (dataUrl.startsWith('data:image/png')) ext = 'png';
  else if (dataUrl.startsWith('data:image/webp')) ext = 'webp';

  const storagePath = `question-errors/${userId}/${errorId || Date.now()}.${ext}`;
  const serverCachedUrl = `/uploads/${storagePath}?t=${Date.now()}`;
  let finalUrl = serverCachedUrl;
  const isDirect = getStorageDeliveryMode() === 'FIREBASE_DIRECT';

  try {
    const storage = getClientStorage();
    if (storage) {
      const storageRef = ref(storage, storagePath);
      await uploadString(storageRef, dataUrl, 'data_url');
      if (isDirect) {
        try {
          const directUrl = await getDownloadURL(storageRef);
          if (directUrl) {
            finalUrl = directUrl;
          }
        } catch (urlErr) {
          // getDownloadURL başarısız: Firebase Storage CDN URL'ini manuel oluştur
          const cdnUrl = buildFirebaseStorageCDNUrl(storagePath);
          if (cdnUrl) {
            finalUrl = cdnUrl;
            console.info('[Storage] getDownloadURL failed, using manual CDN URL for question error image.');
          } else {
            console.warn('Could not get Firebase direct question error URL, fallback:', urlErr);
          }
        }
      }
    }
  } catch (err) {
    if (isDirect) {
      // Firebase upload bile başarısız oldu: en azından CDN URL oluşturmayı dene
      const cdnUrl = buildFirebaseStorageCDNUrl(storagePath);
      if (cdnUrl) finalUrl = cdnUrl;
    }
    console.warn('Direct question error upload fallback to server:', err);
  }

  if (!isDirect || finalUrl === serverCachedUrl) {
    try {
      await fetch('/api/upload/photo', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'question-error',
          userId,
          errorId,
          fileData: dataUrl,
          fileName: file.name
        })
      });
    } catch (err) {}
  }

  return { url: finalUrl, originalKb, compressedKb };
}

export async function deleteStorageFile(pathOrUrl: string): Promise<boolean> {
  if (!pathOrUrl) return false;
  // If it's an external URL like unsplash or placeholder, don't attempt storage delete
  if (pathOrUrl.includes('images.unsplash.com') || pathOrUrl.startsWith('http://') === false && pathOrUrl.startsWith('https://') === false && pathOrUrl.startsWith('/uploads/') === false) {
    return false;
  }

  try {
    const response = await fetch('/api/upload/delete', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pathOrUrl })
    });
    return response.ok;
  } catch (err) {
    console.error('File storage deletion error:', err);
    return false;
  }
}

