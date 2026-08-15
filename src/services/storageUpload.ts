import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';
import { app } from './firebase';
import { compressImageFile } from '../utils/imageCompressor';

export interface UploadResult {
  url: string;
  originalKb: number;
  compressedKb: number;
}

function getClientStorage() {
  try {
    return getStorage(app);
  } catch (e) {
    console.warn('Firebase client storage init warning:', e);
    return null;
  }
}

export async function uploadProfileAvatar(file: File, userId: string): Promise<UploadResult> {
  const { dataUrl, originalKb, compressedKb } = await compressImageFile(file, 800, 0.7);
  let ext = 'jpg';
  if (dataUrl.startsWith('data:image/png')) ext = 'png';
  else if (dataUrl.startsWith('data:image/webp')) ext = 'webp';

  // 1. Try Direct Firebase Storage Client Upload
  try {
    const storage = getClientStorage();
    if (storage) {
      const storagePath = `avatars/${userId}/profile.${ext}`;
      const storageRef = ref(storage, storagePath);
      await uploadString(storageRef, dataUrl, 'data_url');
      const downloadUrl = await getDownloadURL(storageRef);

      // Mirror to local server in background (fire-and-forget)
      fetch('/api/upload/photo', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'avatar',
          userId,
          fileData: dataUrl,
          fileName: file.name
        })
      }).catch(() => {});

      return { url: downloadUrl, originalKb, compressedKb };
    }
  } catch (clientErr) {
    console.warn('Direct Firebase Storage upload fallback to server:', clientErr);
  }

  // 2. Fallback to Server API Upload
  const response = await fetch('/api/upload/photo', {
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

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || 'Profil fotoğrafı yüklenirken bir hata oluştu.');
  }

  const data = await response.json();
  return { url: data.url, originalKb, compressedKb };
}

export async function uploadChannelAvatar(file: File, channelUrl: string, channelName: string): Promise<UploadResult> {
  const { dataUrl, originalKb, compressedKb } = await compressImageFile(file, 120, 0.60);
  let ext = 'jpg';
  if (dataUrl.startsWith('data:image/png')) ext = 'png';
  else if (dataUrl.startsWith('data:image/webp')) ext = 'webp';

  // Try direct Firebase Storage
  try {
    const storage = getClientStorage();
    if (storage) {
      const handleMatch = channelUrl.match(/@([\w.-]+)/);
      let slug = '';
      if (handleMatch && handleMatch[1]) {
        slug = handleMatch[1].toLowerCase().replace(/[^a-z0-9]/g, '_');
      } else {
        slug = (channelName || 'chan').toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Math.abs(channelUrl.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a | 0; }, 0));
      }
      const storagePath = `avatars/youtube/${slug}.${ext}`;
      const storageRef = ref(storage, storagePath);
      await uploadString(storageRef, dataUrl, 'data_url');
      const downloadUrl = await getDownloadURL(storageRef);

      fetch('/api/upload/photo', {
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
      }).catch(() => {});

      return { url: downloadUrl, originalKb, compressedKb };
    }
  } catch (err) {
    console.warn('Direct YouTube avatar upload fallback to server:', err);
  }

  const response = await fetch('/api/upload/photo', {
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

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || 'Kanal görseli yüklenirken bir hata oluştu.');
  }

  const data = await response.json();
  return { url: data.url, originalKb, compressedKb };
}

export async function uploadMessageAttachment(file: File, messageId: string): Promise<UploadResult> {
  const { dataUrl, originalKb, compressedKb } = await compressImageFile(file, 1000, 0.65);
  let ext = 'jpg';
  if (dataUrl.startsWith('data:image/png')) ext = 'png';
  else if (dataUrl.startsWith('data:image/webp')) ext = 'webp';

  try {
    const storage = getClientStorage();
    if (storage) {
      const storagePath = `messages/${messageId}/attachment.${ext}`;
      const storageRef = ref(storage, storagePath);
      await uploadString(storageRef, dataUrl, 'data_url');
      const downloadUrl = await getDownloadURL(storageRef);

      fetch('/api/upload/photo', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'message',
          messageId,
          fileData: dataUrl,
          fileName: file.name
        })
      }).catch(() => {});

      return { url: downloadUrl, originalKb, compressedKb };
    }
  } catch (err) {
    console.warn('Direct message attachment upload fallback to server:', err);
  }

  const response = await fetch('/api/upload/photo', {
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

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || 'Mesaj görseli yüklenirken bir hata oluştu.');
  }

  const data = await response.json();
  return { url: data.url, originalKb, compressedKb };
}

export async function uploadQuestionErrorImage(file: File, userId: string, errorId: string): Promise<UploadResult> {
  const { dataUrl, originalKb, compressedKb } = await compressImageFile(file, 1000, 0.65);
  let ext = 'jpg';
  if (dataUrl.startsWith('data:image/png')) ext = 'png';
  else if (dataUrl.startsWith('data:image/webp')) ext = 'webp';

  try {
    const storage = getClientStorage();
    if (storage) {
      const storagePath = `question-errors/${userId}/${errorId || Date.now()}.${ext}`;
      const storageRef = ref(storage, storagePath);
      await uploadString(storageRef, dataUrl, 'data_url');
      const downloadUrl = await getDownloadURL(storageRef);

      fetch('/api/upload/photo', {
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
      }).catch(() => {});

      return { url: downloadUrl, originalKb, compressedKb };
    }
  } catch (err) {
    console.warn('Direct question error upload fallback to server:', err);
  }

  const response = await fetch('/api/upload/photo', {
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

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || 'Soru fotoğrafı yüklenirken bir hata oluştu.');
  }

  const data = await response.json();
  return { url: data.url, originalKb, compressedKb };
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
