import { compressImageFile } from '../utils/imageCompressor';

export interface UploadResult {
  url: string;
  originalKb: number;
  compressedKb: number;
}

export async function uploadProfileAvatar(file: File, userId: string): Promise<UploadResult> {
  const { dataUrl, originalKb, compressedKb } = await compressImageFile(file, 800, 0.7);
  const response = await fetch('/api/upload/photo', {
    method: 'POST',
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

export async function uploadMessageAttachment(file: File, messageId: string): Promise<UploadResult> {
  const { dataUrl, originalKb, compressedKb } = await compressImageFile(file, 1000, 0.65);
  const response = await fetch('/api/upload/photo', {
    method: 'POST',
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
  const response = await fetch('/api/upload/photo', {
    method: 'POST',
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pathOrUrl })
    });
    return response.ok;
  } catch (err) {
    console.error('File storage deletion error:', err);
    return false;
  }
}
