import { UNIVERSITIES } from '../data/universities';

const LOCAL_STORAGE_KEY = 'yks_custom_university_logos';

export const getCustomLogosMap = (): Record<string, string> => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load custom university logos from localStorage:', err);
    return {};
  }
};

export const getCustomLogoForUni = (uniName: string): string | null => {
  if (!uniName) return null;
  const map = getCustomLogosMap();
  const clean = uniName.trim().toLowerCase();

  // Direct match
  for (const [key, url] of Object.entries(map)) {
    if (key.trim().toLowerCase() === clean && url) {
      return url;
    }
  }

  // Substring match
  for (const [key, url] of Object.entries(map)) {
    const keyClean = key.trim().toLowerCase();
    if ((clean.includes(keyClean) || keyClean.includes(clean)) && url) {
      return url;
    }
  }

  return null;
};

export const setCustomLogoForUni = (uniName: string, logoUrl: string) => {
  if (!uniName) return;
  const map = getCustomLogosMap();
  map[uniName.trim()] = logoUrl.trim();
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(map));
    window.dispatchEvent(new CustomEvent('custom_university_logos_updated'));
  } catch (err) {
    console.error('Failed to save custom university logo:', err);
  }
};

export const removeCustomLogoForUni = (uniName: string) => {
  if (!uniName) return;
  const map = getCustomLogosMap();
  const clean = uniName.trim().toLowerCase();
  
  let keyToDelete: string | null = null;
  for (const key of Object.keys(map)) {
    if (key.trim().toLowerCase() === clean) {
      keyToDelete = key;
      break;
    }
  }

  if (keyToDelete) {
    delete map[keyToDelete];
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(map));
      window.dispatchEvent(new CustomEvent('custom_university_logos_updated'));
    } catch (err) {
      console.error('Failed to remove custom university logo:', err);
    }
  }
};
