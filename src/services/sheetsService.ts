import { YKSDataState } from '../types';

export async function checkGoogleAuthStatus() {
  try {
    const res = await fetch('/api/auth/google/status');
    if (!res.ok) return { isConnected: false };
    return await res.json();
  } catch (err) {
    return { isConnected: false };
  }
}

export async function startGoogleAuthFlow() {
  try {
    const res = await fetch('/api/auth/google/url');
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      alert('Google yetkilendirme bağlantısı alınamadı.');
    }
  } catch (err) {
    alert('Google giriş hatası: ' + err);
  }
}

export async function createYKSGoogleSheet(studentName: string) {
  const res = await fetch('/api/sheets/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ studentName })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Sheet oluşturulamadı.');
  }
  return await res.json();
}

export async function syncDataToGoogleSheet(spreadsheetId: string, state: YKSDataState) {
  const res = await fetch('/api/sheets/sync-to', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ spreadsheetId, state })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Senkronizasyon başarısız.');
  }
  return await res.json();
}

export async function logoutGoogleAuth() {
  await fetch('/api/auth/google/logout', { method: 'POST' });
}
