export interface UndoItem {
  id: string;
  description: string;
  undoAction: () => void;
  timestamp: string;
  createdAt: number;
}

let cachedUserIp = '';
export const fetchUserIp = async (): Promise<string> => {
  if (cachedUserIp) return cachedUserIp;
  try {
    const res = await fetch('https://api.ipify.org?format=json');
    const data = await res.json();
    cachedUserIp = data.ip;
  } catch (err) {
    console.warn('Could not fetch IP address', err);
  }
  return cachedUserIp;
};

// Fetch IP on module load
fetchUserIp();

export const getCachedUserIp = (): string => cachedUserIp;

export const getDeviceType = (): 'Mobil' | 'Tablet' | 'Masaüstü' => {
  const ua = navigator.userAgent.toLowerCase();
  const isMobileUA = /iphone|ipod|android.*mobile|blackberry|iemobile|opera mini/i.test(ua);
  const isTabletUA = /ipad|android(?!.*mobile)|tablet/i.test(ua);
  
  if (isMobileUA) {
    return 'Mobil';
  } else if (isTabletUA) {
    return 'Tablet';
  } else {
    const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    if (isTouch && window.innerWidth < 1024) {
      if (window.innerWidth < 640) {
        return 'Mobil';
      }
      return 'Tablet';
    }
    return 'Masaüstü';
  }
};
