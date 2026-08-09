import React, { useState, useEffect } from 'react';
import { getCustomLogoForUni } from '../utils/universityLogoStore';

// Official High-Resolution Verified Wikimedia / Direct Logo URLs for major Turkish Universities
const DIRECT_UNIVERSITY_LOGOS: Record<string, string> = {
  'necmettin erbakan üniversitesi': 'https://upload.wikimedia.org/wikipedia/tr/d/d7/Necmettin_Erbakan_%C3%9Cniversitesi_logosu.png',
  'necmettin erbakan': 'https://upload.wikimedia.org/wikipedia/tr/d/d7/Necmettin_Erbakan_%C3%9Cniversitesi_logosu.png',
  'istanbul teknik üniversitesi': 'https://upload.wikimedia.org/wikipedia/tr/9/90/%C4%B0T%C3%9C_logo.png',
  'itü': 'https://upload.wikimedia.org/wikipedia/tr/9/90/%C4%B0T%C3%9C_logo.png',
  'boğaziçi üniversitesi': 'https://upload.wikimedia.org/wikipedia/tr/e/e2/Bo%C4%9Fazi%C3%A7i_%C3%9Cniversitesi_Logo.png',
  'bogazici': 'https://upload.wikimedia.org/wikipedia/tr/e/e2/Bo%C4%9Fazi%C3%A7i_%C3%9Cniversitesi_Logo.png',
  'orta doğu teknik üniversitesi': 'https://upload.wikimedia.org/wikipedia/tr/b/bb/Odtu_logo.png',
  'odtü': 'https://upload.wikimedia.org/wikipedia/tr/b/bb/Odtu_logo.png',
  'ihsan doğramacı bilkent üniversitesi': 'https://upload.wikimedia.org/wikipedia/tr/f/f8/Bilkent_%C3%9Cniversitesi_Logo.png',
  'bilkent üniversitesi': 'https://upload.wikimedia.org/wikipedia/tr/f/f8/Bilkent_%C3%9Cniversitesi_Logo.png',
  'koç üniversitesi': 'https://upload.wikimedia.org/wikipedia/tr/3/30/Ko%C3%A7_%C3%9Cniversitesi_Logo.png',
  'sabancı üniversitesi': 'https://upload.wikimedia.org/wikipedia/tr/7/77/Sabanc%C3%B1_%C3%9Cniversitesi_logo.png',
  'hacettepe üniversitesi': 'https://upload.wikimedia.org/wikipedia/tr/2/23/Hacettepe_%C3%9Cniversitesi_Logo.png',
  'galatasaray üniversitesi': 'https://upload.wikimedia.org/wikipedia/tr/a/ab/Galatasaray_%C3%9Cniversitesi_logo.png',
  'yıldız teknik üniversitesi': 'https://upload.wikimedia.org/wikipedia/tr/5/52/Y%C4%B1ld%C4%B1z_Teknik_%C3%9Cniversitesi_Logo.png',
  'ytü': 'https://upload.wikimedia.org/wikipedia/tr/5/52/Y%C4%B1ld%C4%B1z_Teknik_%C3%9Cniversitesi_Logo.png',
  'marmara üniversitesi': 'https://upload.wikimedia.org/wikipedia/tr/a/a6/Marmara_%C3%9Cniversitesi_logo.png',
  'istanbul üniversitesi': 'https://upload.wikimedia.org/wikipedia/tr/1/1b/Istanbul_%C3%9Cniversitesi_Logo.png',
  'ankara üniversitesi': 'https://upload.wikimedia.org/wikipedia/tr/3/33/Ankara_%C3%9Cniversitesi_logo.png',
  'gazi üniversitesi': 'https://upload.wikimedia.org/wikipedia/tr/8/87/Gazi_%C3%9Cniversitesi_logo.png',
  'ege üniversitesi': 'https://upload.wikimedia.org/wikipedia/tr/c/c8/Ege_%C3%9Cniversitesi_logo.png',
  'dokuz eylül üniversitesi': 'https://upload.wikimedia.org/wikipedia/tr/3/3f/Dokuz_Eyl%C3%BCl_%C3%9Cniversitesi_logo.png',
  'gebze teknik üniversitesi': 'https://upload.wikimedia.org/wikipedia/tr/a/ae/Gebze_Teknik_%C3%9Cniversitesi_Logo.png',
  'bahçeşehir üniversitesi': 'https://upload.wikimedia.org/wikipedia/tr/d/d1/Bah%C3%A7e%C5%9Fehir_%C3%9Cniversitesi_logo.png',
  'kadir has üniversitesi': 'https://upload.wikimedia.org/wikipedia/tr/f/fa/Kadir_Has_%C3%9Cniversitesi_logo.png',
  'yeditepe üniversitesi': 'https://upload.wikimedia.org/wikipedia/tr/1/14/Yeditepe_%C3%9Cniversitesi_logo.png',
  'anadolu üniversitesi': 'https://upload.wikimedia.org/wikipedia/tr/0/03/Anadolu_%C3%9Cniversitesi_logo.png',
  'akdeniz üniversitesi': 'https://upload.wikimedia.org/wikipedia/tr/0/0c/Akdeniz_%C3%9Cniversitesi_logo.png',
  'atatürk üniversitesi': 'https://upload.wikimedia.org/wikipedia/tr/b/b3/Atat%C3%BCrk_%C3%9Cniversitesi_logo.png',
  'çukurova üniversitesi': 'https://upload.wikimedia.org/wikipedia/tr/0/07/Cukurova_Universitesi_logo.png',
  'erciyes üniversitesi': 'https://upload.wikimedia.org/wikipedia/tr/2/23/Erciyes_%C3%9Cniversitesi_logo.png',
  'kocaeli üniversitesi': 'https://upload.wikimedia.org/wikipedia/tr/2/29/Kocaeli_%C3%9Cniversitesi_logo.png',
  'karadeniz teknik üniversitesi': 'https://upload.wikimedia.org/wikipedia/tr/0/02/Karadeniz_Teknik_%C3%9Cniversitesi_logo.png',
  'pamukkale üniversitesi': 'https://upload.wikimedia.org/wikipedia/tr/a/a2/Pamukkale_%C3%9Cniversitesi_logo.png',
  'sakarya üniversitesi': 'https://upload.wikimedia.org/wikipedia/tr/2/27/Sakarya_%C3%9Cniversitesi_logo.png',
  'bursa uludağ üniversitesi': 'https://upload.wikimedia.org/wikipedia/tr/0/0d/Bursa_Uluda%C3%B1_%C3%9Cniversitesi_logo.png',
  'başkent üniversitesi': 'https://upload.wikimedia.org/wikipedia/tr/b/b8/Ba%C5%9Fkent_%C3%9Cniversitesi_logo.png',
  'tobb ekonomi ve teknoloji üniversitesi': 'https://upload.wikimedia.org/wikipedia/tr/0/0f/TOBB_ET%C3%9C_logo.png',
  'çankaya üniversitesi': 'https://upload.wikimedia.org/wikipedia/tr/1/17/%C3%87ankaya_%C3%9Cniversitesi_logo.png',
  'yaşar üniversitesi': 'https://upload.wikimedia.org/wikipedia/tr/7/77/Ya%C5%9Far_%C3%9Cniversitesi_logo.png',
  'izmir ekonomi üniversitesi': 'https://upload.wikimedia.org/wikipedia/tr/6/69/%C4%B0zmir_Ekonomi_%C3%9Cniversitesi_logo.png',
  'mimar sinan güzel sanatlar üniversitesi': 'https://upload.wikimedia.org/wikipedia/tr/b/b3/Mimar_Sinan_G%C3%BCzel_Sanatlar_%C3%9Cniversitesi_logo.png',
  'selçuk üniversitesi': 'https://upload.wikimedia.org/wikipedia/tr/7/7a/Sel%C3%A7uk_%C3%9Cniversitesi_logo.png',
  'sağlık bilimleri üniversitesi': 'https://upload.wikimedia.org/wikipedia/tr/e/e6/Sa%C4%9Fl%C4%B1k_Bilimleri_%C3%9Cniversitesi_logo.png',
  'türk-alman üniversitesi': 'https://upload.wikimedia.org/wikipedia/tr/b/b1/T%C3%BCrk-Alman_%C3%9Cniversitesi_logo.png',
  'mef üniversitesi': 'https://upload.wikimedia.org/wikipedia/tr/b/b8/MEF_%C3%9Cniversitesi_logo.png',
  'üsküdar üniversitesi': 'https://upload.wikimedia.org/wikipedia/tr/f/f6/%C3%9Csk%C3%BCdar_%C3%9Cniversitesi_logo.png',
  'fırat üniversitesi': 'https://upload.wikimedia.org/wikipedia/tr/e/eb/F%C4%B1rat_%C3%9Cniversitesi_logo.png',
  'inönü üniversitesi': 'https://upload.wikimedia.org/wikipedia/tr/d/d2/%C4%B0n%C3%B6n%C3%BC_%C3%9Cniversitesi_logo.png',
  'dicle üniversitesi': 'https://upload.wikimedia.org/wikipedia/tr/7/77/Dicle_%C3%9Cniversitesi_logo.png',
  'gaziantep üniversitesi': 'https://upload.wikimedia.org/wikipedia/tr/d/d5/Gaziantep_%C3%9Cniversitesi_logo.png',
  'mersin üniversitesi': 'https://upload.wikimedia.org/wikipedia/tr/2/21/Mersin_%C3%9Cniversitesi_logo.png',
  'eskişehir osmangazi üniversitesi': 'https://upload.wikimedia.org/wikipedia/tr/4/41/Eski%C5%9Fehir_Osmangazi_%C3%9Cniversitesi_logo.png',
  'süleyman demirel üniversitesi': 'https://upload.wikimedia.org/wikipedia/tr/2/2f/S%C3%BCleyman_Demirel_%C3%9Cniversitesi_logo.png',
  'trakya üniversitesi': 'https://upload.wikimedia.org/wikipedia/tr/d/d3/Trakya_%C3%9Cniversitesi_logo.png',
  'manisa celal bayar üniversitesi': 'https://upload.wikimedia.org/wikipedia/tr/6/69/Manisa_Celal_Bayar_%C3%9Cniversitesi_logo.png',
  'ondokuz mayıs üniversitesi': 'https://upload.wikimedia.org/wikipedia/tr/1/13/Ondokuz_May%C4%B1s_%C3%9Cniversitesi_logo.png',
};

// Clean and normalize name for search matching
const normalizeName = (name: string): string => {
  return name.toLowerCase().trim();
};

export const getDirectLogoUrl = (uniName: string): string | null => {
  if (!uniName) return null;
  const clean = normalizeName(uniName);

  if (DIRECT_UNIVERSITY_LOGOS[clean]) {
    return DIRECT_UNIVERSITY_LOGOS[clean];
  }

  for (const [key, url] of Object.entries(DIRECT_UNIVERSITY_LOGOS)) {
    if (clean.includes(key) || key.includes(clean)) {
      return url;
    }
  }

  return null;
};

export const getUniversityInitials = (uniName: string): string => {
  if (!uniName) return 'İTÜ';
  const clean = uniName.trim();
  
  if (clean.toLowerCase().includes('necmettin erbakan')) return 'NEÜ';
  if (clean.toLowerCase().includes('istanbul teknik') || clean.toLowerCase().includes('itü')) return 'İTÜ';
  if (clean.toLowerCase().includes('boğaziçi')) return 'BOUN';
  if (clean.toLowerCase().includes('orta doğu') || clean.toLowerCase().includes('odtü')) return 'ODTÜ';
  if (clean.toLowerCase().includes('yıldız teknik') || clean.toLowerCase().includes('ytü')) return 'YTÜ';
  if (clean.toLowerCase().includes('bilkent')) return 'BİLKENT';
  if (clean.toLowerCase().includes('hacettepe')) return 'HU';
  if (clean.toLowerCase().includes('galatasaray')) return 'GSÜ';
  if (clean.toLowerCase().includes('marmara')) return 'MÜ';
  if (clean.toLowerCase().includes('gazi')) return 'GAZİ';
  if (clean.toLowerCase().includes('ege')) return 'EGE';

  const words = clean.split(/\s+/).filter(w => !['üniversitesi', 'universitesi', 've'].includes(w.toLowerCase()));
  if (words.length >= 2) {
    return words.map(w => w[0]?.toUpperCase()).join('');
  }
  return clean.substring(0, 3).toUpperCase();
};

interface UniversityLogoProps {
  universityName?: string;
  sizeClassName?: string;
  opacityClassName?: string;
  className?: string;
}

export const UniversityLogo: React.FC<UniversityLogoProps> = ({ 
  universityName, 
  sizeClassName = "w-8 h-8",
  opacityClassName = "opacity-90 hover:opacity-100",
  className = ""
}) => {
  const [customLogoUrl, setCustomLogoUrl] = useState<string | null>(null);
  const [wikiLogoUrl, setWikiLogoUrl] = useState<string | null>(null);
  const [currentSourceIndex, setCurrentSourceIndex] = useState(0);
  const [hasFailedAll, setHasFailedAll] = useState(false);

  const loadCustomAndWikiLogos = () => {
    setCurrentSourceIndex(0);
    setHasFailedAll(false);

    if (!universityName) return;

    // 1. Check custom logo from store
    const custom = getCustomLogoForUni(universityName);
    setCustomLogoUrl(custom);

    // 2. Fetch logo dynamically from Turkish Wikipedia API via backend proxy
    fetch(`/api/wikipedia/logo?name=${encodeURIComponent(universityName)}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.logoUrl) {
          setWikiLogoUrl(data.logoUrl);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadCustomAndWikiLogos();

    // Listen for custom logo update events from the logo editor modal
    const handleUpdate = () => {
      loadCustomAndWikiLogos();
    };

    window.addEventListener('custom_university_logos_updated', handleUpdate);
    return () => {
      window.removeEventListener('custom_university_logos_updated', handleUpdate);
    };
  }, [universityName]);

  // Build ordered sources array
  const sources: string[] = [];

  // #1 Custom user/teacher override URL
  if (customLogoUrl) {
    sources.push(customLogoUrl);
  }

  // #2 Direct mapped Wikipedia logo
  const directLogo = getDirectLogoUrl(universityName || '');
  if (directLogo && !sources.includes(directLogo)) {
    sources.push(directLogo);
  }

  // #3 Dynamic Wikipedia summary image
  if (wikiLogoUrl && !sources.includes(wikiLogoUrl)) {
    sources.push(wikiLogoUrl);
  }

  const handleImageError = () => {
    if (currentSourceIndex < sources.length - 1) {
      setCurrentSourceIndex(prev => prev + 1);
    } else {
      setHasFailedAll(true);
    }
  };

  if (!hasFailedAll && sources.length > 0 && currentSourceIndex < sources.length) {
    return (
      <img
        key={`${universityName}-${sources[currentSourceIndex]}-${currentSourceIndex}`}
        src={sources[currentSourceIndex]}
        alt={universityName || 'Hedef Üniversite'}
        referrerPolicy="no-referrer"
        className={`${sizeClassName} object-contain ${opacityClassName} shrink-0 filter drop-shadow-md rounded-sm transition-all ${className}`}
        onError={handleImageError}
      />
    );
  }

  // Fallback badge with university initials if all image attempts fail
  const initials = getUniversityInitials(universityName || '');

  return (
    <div 
      className={`${sizeClassName} rounded-lg bg-gradient-to-br from-indigo-600 to-slate-800 border border-indigo-400/50 flex items-center justify-center shrink-0 ${opacityClassName} transition-opacity shadow-sm ${className}`}
      title={universityName || 'Hedef Üniversite'}
    >
      <span className="text-[10px] font-extrabold text-white tracking-wider font-mono">
        {initials}
      </span>
    </div>
  );
};
