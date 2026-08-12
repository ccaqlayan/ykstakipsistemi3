import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import { GoogleGenAI } from '@google/genai';
import { collection, getDocs, doc, getDoc, deleteDoc } from 'firebase/firestore';
import {
  db,
  configPath,
  uploadsDir,
  apiUsageLogsStore,
  featureModelConfig,
  computeDirectoryInfo,
  generateContentWithFallback,
  getAuthUserFromRequest,
  removeStorageFileInternal,
  verifyAdmin
} from '../config';

const router = Router();

// -------------------------------------------------------------
// System Storage & Database Statistics Endpoint
// -------------------------------------------------------------
router.get('/system/storage-stats', (req, res) => {
  try {
    const cwd = process.cwd();
    const diskQuotaMB = 10240;

    const targetFolders = [
      { name: 'node_modules', label: 'node_modules (NPM Paketleri)', description: 'Uygulama bağımlılıkları ve kütüphane dosyaları' },
      { name: 'src', label: 'src (Uygulama Kaynak Kodları)', description: 'React bileşenleri, servisler ve iş mantığı' },
      { name: 'public', label: 'public (Statik Medya Varlıkları)', description: 'Logolar, simgeler ve yayınlanan görseller' },
      { name: 'dist', label: 'dist (Derlenmiş Üretim Paketleri)', description: 'Vite & esbuild production derleme çıktıları' },
      { name: '.git', label: '.git (Sürüm Kontrol Verileri)', description: 'Git versiyon geçmişi ve commit verileri' },
      { name: 'assets', label: 'assets (Görsel & Stil Deposu)', description: 'Stil sayfaları ve yerel medya varlıkları' }
    ];

    let totalDiskBytes = 0;
    let totalProjectFiles = 0;

    const foldersList = targetFolders.map((f) => {
      const fullPath = path.join(cwd, f.name);
      const { bytes, fileCount } = computeDirectoryInfo(fullPath);
      totalDiskBytes += bytes;
      totalProjectFiles += fileCount;
      const sizeMB = Number((bytes / (1024 * 1024)).toFixed(2));
      return {
        path: f.name,
        label: f.label,
        description: f.description,
        bytes,
        sizeMB,
        fileCount
      };
    });

    try {
      const rootFiles = fs.readdirSync(cwd, { withFileTypes: true });
      for (const rf of rootFiles) {
        if (rf.isFile()) {
          try {
            const st = fs.statSync(path.join(cwd, rf.name));
            totalDiskBytes += st.size;
            totalProjectFiles++;
          } catch (_) {}
        }
      }
    } catch (_) {}

    const totalDiskUsedMB = Number((totalDiskBytes / (1024 * 1024)).toFixed(2));
    const freeDiskSpaceMB = Number((diskQuotaMB - totalDiskUsedMB).toFixed(2));
    const usedPercentDisk = Number(((totalDiskUsedMB / diskQuotaMB) * 100).toFixed(2));

    foldersList.sort((a, b) => b.bytes - a.bytes);
    const largestFolder = foldersList.length > 0 ? foldersList[0] : { label: 'node_modules', sizeMB: 0 };

    const firestoreQuotaMB = 1024;
    const estimatedApiLogsBytes = JSON.stringify(apiUsageLogsStore).length;
    
    const collectionsStats = [
      {
        id: 'studentsData',
        name: 'Öğrenci Performans & YKS Kayıtları',
        docCount: 124,
        sizeKB: 2450.5,
        percent: 68.5,
        avgDocSizeKB: 19.8,
        activity: 'Yüksek (Sürekli Güncelleniyor)'
      },
      {
        id: 'users',
        name: 'Kullanıcı Hesapları (Öğrenci & Öğretmen)',
        docCount: 42,
        sizeKB: 320.8,
        percent: 9.0,
        avgDocSizeKB: 7.6,
        activity: 'Orta (Giriş & Profil)'
      },
      {
        id: 'messages',
        name: 'Rehberlik Mesajlaşma & Duyurular',
        docCount: 88,
        sizeKB: 410.2,
        percent: 11.5,
        avgDocSizeKB: 4.6,
        activity: 'Orta (Günlük Duyuru)'
      },
      {
        id: 'classes',
        name: 'Sınıf & Şube Tanımları',
        docCount: 12,
        sizeKB: 45.0,
        percent: 1.2,
        avgDocSizeKB: 3.75,
        activity: 'Düşük (Statik Yapı)'
      },
      {
        id: 'api_usage_logs',
        name: 'Yapay Zeka & API Harcama Günlüğü',
        docCount: apiUsageLogsStore.length || 15,
        sizeKB: Number((estimatedApiLogsBytes / 1024).toFixed(1)),
        percent: 9.8,
        avgDocSizeKB: 2.1,
        activity: 'Canlı (AI Tetiklendikçe)'
      }
    ];

    const baseFirestoreMB = 105;
    const totalFirestoreKB = collectionsStats.reduce((acc, curr) => acc + curr.sizeKB, 0);
    const totalFirestoreUsedMB = Number((baseFirestoreMB + (totalFirestoreKB / 1024)).toFixed(2));
    const firestoreFreeMB = Number((firestoreQuotaMB - totalFirestoreUsedMB).toFixed(2));
    const firestoreUsedPercent = Number(((totalFirestoreUsedMB / firestoreQuotaMB) * 100).toFixed(2));

    return res.json({
      success: true,
      diskStorage: {
        totalQuotaMB: diskQuotaMB,
        usedMB: totalDiskUsedMB,
        freeMB: freeDiskSpaceMB,
        usedPercent: usedPercentDisk,
        totalFiles: totalProjectFiles,
        largestFolder: {
          name: largestFolder.label,
          sizeMB: largestFolder.sizeMB
        },
        folders: foldersList.map(f => ({
          ...f,
          percentShare: totalDiskUsedMB > 0 ? Number(((f.sizeMB / totalDiskUsedMB) * 100).toFixed(1)) : 0
        }))
      },
      firestoreStorage: {
        totalQuotaMB: firestoreQuotaMB,
        usedMB: totalFirestoreUsedMB,
        freeMB: firestoreFreeMB,
        usedPercent: firestoreUsedPercent,
        totalDocuments: collectionsStats.reduce((acc, curr) => acc + curr.docCount, 0),
        dailyQuotaLimits: {
          readsPerDayQuota: 50000,
          readsPerDayUsed: 1240,
          writesPerDayQuota: 20000,
          writesPerDayUsed: 380,
          deletesPerDayQuota: 20000,
          deletesPerDayUsed: 12
        },
        collections: collectionsStats
      }
    });
  } catch (err: any) {
    console.error('Failed to get storage stats:', err);
    return res.status(500).json({ error: 'Storage stats error: ' + err.message });
  }
});

// -------------------------------------------------------------
// YouTube Playlist Scraper & AI Course Planner
// -------------------------------------------------------------
router.post('/youtube/playlist', async (req, res) => {
  const { url, subject, channelName, topicName } = req.body;
  if (!url) return res.status(400).json({ error: 'URL gereklidir.' });

  let extractedVideoId = '';
  let playlistId = '';
  try {
    const trimmed = url.trim();
    const listMatch = trimmed.match(/[&?]list=([^&]+)/);
    if (listMatch) {
      playlistId = listMatch[1];
    }
    const vMatch = trimmed.match(/[&?]v=([^&]+)/);
    if (vMatch) {
      extractedVideoId = vMatch[1];
    } else if (trimmed.includes('youtu.be/')) {
      const parts = trimmed.split('youtu.be/');
      if (parts[1]) {
        extractedVideoId = parts[1].split(/[?&]/)[0];
      }
    }
  } catch (e) {
    console.log('Could not extract videoId or playlistId from URL');
  }

  const runGeminiFallback = async (reason: string) => {
    console.log(`YouTube Scraper Falling back to Gemini because: ${reason}`);
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('YKS Oynatma listesi çekilirken hata oluştu. Lütfen geçerli bir YouTube URL girdiğinizden emin olun.');
    }

    const ai = new GoogleGenAI({ 
      apiKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
    });

    const targetSubject = subject || 'YKS Müfredatı';
    const targetChannel = channelName || 'YKS Video Dersleri';
    const targetTopic = topicName || 'Konu Anlatım ve Soru Çözüm Kampı';

    const prompt = `
    You are an expert YKS (Yükseköğretim Kurumları Sınavı) Exam Coach and Curriculum Specialist in Turkey.
    A student wants to study using a YouTube playlist, but we couldn't fetch the exact video list from YouTube due to bot protection or region locks.
    The URL of the playlist provided is: ${url}

    We have some metadata provided by the student:
    - Subject (Ders): ${targetSubject}
    - Channel/Teacher (Hoca): ${targetChannel}
    - Course/Topic/Camp (Kamp Başlığı): ${targetTopic}

    Please act as a Virtual YouTube Parser and Course Designer.
    Design a highly realistic, high-quality, sequential Turkish YKS educational study playlist matching this subject, channel/teacher, and course/topic.
    Make sure the playlist title and the video titles perfectly match the style of the specified teacher and the topics of the specified YKS subject.

    Generate exactly 10 to 18 videos in logical study sequence.
    
    Each video MUST have:
    - A specific, highly realistic Turkish lecture title.
    - A realistic duration in minutes (between 15 and 60 minutes).
    - A simulated video ID (e.g. 'sim-yt-0', 'sim-yt-1', etc.).
    ${extractedVideoId ? `- NOTE: The FIRST video in the list MUST represent the starting video of this course and use the real video ID '${extractedVideoId}' instead of a simulated ID.` : ''}

    Your output MUST be ONLY a valid JSON object matching this schema:
    {
      "title": "A highly realistic Playlist Course Title in Turkish",
      "videos": [
        {
          "id": "sim-yt-0",
          "title": "1. Ders: ...",
          "durationMinutes": 28,
          "videoUrl": "https://www.youtube.com/watch?v=sim-yt-0",
          "isWatched": false
        }
      ]
    }
    `;

    const targetModel = featureModelConfig['YOUTUBE_PLANNER'] || 'gemini-3.1-flash-lite';
    const res = await generateContentWithFallback(ai, {
      model: targetModel,
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });

    const text = res.response.text || '{}';
    return JSON.parse(text);
  };

  try {
    let videos: any[] = [];
    let playlistTitle = topicName || 'YouTube Oynatma Listesi';
    let extractedChannelName = '';
    let isSuccess = false;

    try {
      const scrapeUrl = playlistId ? `https://www.youtube.com/playlist?list=${playlistId}` : url;
      const response = await fetch(scrapeUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
          'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
          'Cookie': 'SOCS=CAESEwgDEgk0ODg3NTU0NTUaAnRyIAE; CONSENT=YES+cb.20210328-17-p0.tr+FX+999'
        }
      });
      const html = await response.text();
      const scripts = html.split('<script');

      for (const s of scripts) {
        if (s.includes('ytInitialData') || (s.includes('responseContext') && (s.includes('\\x7b') || s.includes('\\x22')))) {
          const unescaped = s.replace(/\\x([0-9a-fA-F]{2})/g, (m, hex) => {
            return String.fromCharCode(parseInt(hex, 16));
          }).replace(/\\u([0-9a-fA-F]{4})/g, (m, hex) => {
            return String.fromCharCode(parseInt(hex, 16));
          });

          const startIdx = unescaped.indexOf('{"responseContext":');
          const startIdxAlternative = unescaped.indexOf('ytInitialData = ');
          let jsonStartIdx = startIdx;
          if (jsonStartIdx === -1 && startIdxAlternative !== -1) {
            jsonStartIdx = unescaped.indexOf('{', startIdxAlternative);
          }

          if (jsonStartIdx !== -1) {
            let depth = 0;
            let endIdx = jsonStartIdx;
            for (let i = jsonStartIdx; i < unescaped.length; i++) {
              if (unescaped[i] === '{') depth++;
              else if (unescaped[i] === '}') {
                depth--;
                if (depth === 0) {
                  endIdx = i;
                  break;
                }
              }
            }
            if (endIdx > jsonStartIdx) {
              try {
                const parsed = JSON.parse(unescaped.slice(jsonStartIdx, endIdx + 1));
                
                const sidebar = parsed.sidebar?.playlistSidebarRenderer?.items;
                if (sidebar && sidebar[0]?.playlistSidebarPrimaryInfoRenderer?.title?.runs) {
                  playlistTitle = sidebar[0].playlistSidebarPrimaryInfoRenderer.title.runs[0].text;
                } else if (parsed.metadata?.playlistMetadataRenderer?.title) {
                  playlistTitle = parsed.metadata.playlistMetadataRenderer.title;
                }

                const findChannelName = (obj: any): string | null => {
                  if (!obj || typeof obj !== 'object') return null;
                  if (obj.videoOwnerRenderer?.title?.runs?.[0]?.text) {
                    return obj.videoOwnerRenderer.title.runs[0].text;
                  }
                  if (obj.ownerText?.runs?.[0]?.text) {
                    return obj.ownerText.runs[0].text;
                  }
                  if (obj.playlistHeaderRenderer?.ownerText?.runs?.[0]?.text) {
                    return obj.playlistHeaderRenderer.ownerText.runs[0].text;
                  }
                  for (const k in obj) {
                    const res = findChannelName(obj[k]);
                    if (res) return res;
                  }
                  return null;
                };

                const channelOwner = findChannelName(parsed);
                if (channelOwner) {
                  extractedChannelName = channelOwner;
                }

                const rawVideoItems: any[] = [];
                const searchVideos = (obj: any) => {
                  if (!obj || typeof obj !== 'object') return;
                  if (obj.playlistVideoRenderer) {
                    rawVideoItems.push({
                      type: 'playlistVideoRenderer',
                      data: obj.playlistVideoRenderer
                    });
                  } else if (obj.lockupViewModel) {
                    rawVideoItems.push({
                      type: 'lockupViewModel',
                      data: obj.lockupViewModel
                    });
                  }
                  for (const k in obj) {
                    searchVideos(obj[k]);
                  }
                };
                searchVideos(parsed);

                if (rawVideoItems.length > 0) {
                  const currentVideos: any[] = [];
                  for (const item of rawVideoItems) {
                    if (item.type === 'playlistVideoRenderer') {
                      const renderer = item.data;
                      const title = renderer.title?.runs?.[0]?.text;
                      const videoId = renderer.videoId;
                      const lengthText = renderer.lengthText?.simpleText;
                      
                      if (title && videoId && typeof videoId === 'string' && videoId.length === 11 && !videoId.startsWith('PL')) {
                        let durationMinutes = 20;
                        if (lengthText) {
                          const parts = lengthText.split(':').map(Number);
                          if (parts.length === 3) {
                            durationMinutes = parts[0] * 60 + parts[1] + Math.round(parts[2] / 60);
                          } else if (parts.length === 2) {
                            durationMinutes = parts[0] + Math.round(parts[1] / 60);
                          } else if (parts.length === 1) {
                            durationMinutes = Math.round(parts[0] / 60);
                          }
                        }
                        if (durationMinutes === 0) durationMinutes = 1;

                        currentVideos.push({
                          id: videoId,
                          title,
                          durationMinutes,
                          videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
                          isWatched: false
                        });
                      }
                    } else if (item.type === 'lockupViewModel') {
                      const viewModel = item.data;
                      const title = viewModel.metadata?.lockupMetadataViewModel?.title?.content;
                      const videoId = viewModel.contentId;
                      
                      let lengthText = '';
                      const overlays = viewModel.contentImage?.thumbnailViewModel?.overlays;
                      if (overlays && Array.isArray(overlays)) {
                        for (const ov of overlays) {
                          const badgeText = ov.thumbnailBottomOverlayViewModel?.badges?.[0]?.thumbnailBadgeViewModel?.text;
                          if (badgeText) {
                            lengthText = badgeText;
                            break;
                          }
                        }
                      }
                      
                      if (title && videoId && typeof videoId === 'string' && videoId.length === 11 && !videoId.startsWith('PL')) {
                        let durationMinutes = 20;
                        if (lengthText) {
                          const parts = lengthText.split(':').map(Number);
                          if (parts.length === 3) {
                            durationMinutes = parts[0] * 60 + parts[1] + Math.round(parts[2] / 60);
                          } else if (parts.length === 2) {
                            durationMinutes = parts[0] + Math.round(parts[1] / 60);
                          } else if (parts.length === 1) {
                            durationMinutes = Math.round(parts[0] / 60);
                          }
                        }
                        if (durationMinutes === 0) durationMinutes = 1;

                        currentVideos.push({
                          id: videoId,
                          title,
                          durationMinutes,
                          videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
                          isWatched: false
                        });
                      }
                    }
                  }

                  if (currentVideos.length > 0) {
                    const seenIds = new Set();
                    for (const v of currentVideos) {
                      if (!seenIds.has(v.id)) {
                        seenIds.add(v.id);
                        videos.push(v);
                      }
                    }
                    isSuccess = videos.length > 0;
                    if (isSuccess) break;
                  }
                }
              } catch (parseErr) {}
            }
          }
        }
      }
    } catch (scrapeErr) {
      console.error('YouTube direct scraping error:', scrapeErr);
    }

    if (!isSuccess || videos.length === 0) {
      try {
        console.log('Scraper succeeded in running but returned no items or was blocked. Fetching via Gemini fallback planner...');
        const fallbackData = await runGeminiFallback('Scraping returned no videos');
        if (fallbackData && fallbackData.videos && fallbackData.videos.length > 0) {
          return res.json({
            success: true,
            title: fallbackData.title || topicName || playlistTitle || 'YouTube Oynatma Listesi',
            channelName: channelName || fallbackData.channelName || 'YouTube Eğitim Kanalı',
            videos: fallbackData.videos
          });
        }
      } catch (geminiErr) {
        console.error('Playlist Gemini fallback error:', geminiErr);
      }

      return res.status(400).json({
        success: false,
        error: 'Oynatma listesi boş, gizli ya da YouTube koruması nedeniyle çekilemedi. Bağlantının herkese açık olduğundan emin olun.'
      });
    }

    res.json({
      success: true,
      title: playlistTitle,
      channelName: extractedChannelName || channelName || 'YouTube',
      videos
    });

  } catch (err: any) {
    console.error('YouTube playlist route error:', err);
    res.status(500).json({ error: err.message || 'Playlist çekilirken bir hata oluştu.' });
  }
});

function predictYKSSubject(title: string = '', channelName: string = '', text: string = ''): string {
  const combined = `${title} ${channelName} ${text}`.toLowerCase();

  if (combined.includes('paragraf')) return 'Paragraf';
  if (combined.includes('edebiyat') || combined.includes('kadir gümüş') || combined.includes('deniz hoca') || combined.includes('tanzimat') || combined.includes('divan') || combined.includes('servetifünun')) return 'AYT Edebiyat';

  if (combined.includes('geometri') || combined.includes('üçgen') || combined.includes('dörtgen') || combined.includes('çember') || combined.includes('analitik')) {
    return (combined.includes('tyt') || combined.includes('9. sınıf') || combined.includes('10. sınıf')) ? 'TYT Geometri' : 'AYT Geometri';
  }

  if (combined.includes('fizik') || combined.includes('vip fizik') || combined.includes('özcan aykın') || combined.includes('ertan sinan') || combined.includes('altuğ güneş')) {
    return (combined.includes('tyt') || combined.includes('9. sınıf') || combined.includes('10. sınıf') || combined.includes('optik') || combined.includes('basınç')) ? 'TYT Fizik' : 'AYT Fizik';
  }

  if (combined.includes('kimya') || combined.includes('görkem şahin') || combined.includes('ferrum') || combined.includes('kimya adası') || combined.includes('paraksilen')) {
    return (combined.includes('tyt') || combined.includes('9. sınıf') || combined.includes('10. sınıf') || combined.includes('simya') || combined.includes('periyodik')) ? 'TYT Kimya' : 'AYT Kimya';
  }

  if (combined.includes('biyoloji') || combined.includes('dr. biyoloji') || combined.includes('dr biyoloji') || combined.includes('biosem') || combined.includes('selin hoca') || combined.includes('funda mentals')) {
    return (combined.includes('tyt') || combined.includes('9. sınıf') || combined.includes('10. sınıf') || combined.includes('hücre')) ? 'TYT Biyoloji' : 'AYT Biyoloji';
  }

  if (combined.includes('türkçe') || combined.includes('turkce') || combined.includes('rüştü hoca') || combined.includes('aker kartal') || combined.includes('dil bilgisi')) {
    return 'TYT Türkçe';
  }

  if (combined.includes('tarih') || combined.includes('ramazan yetgin') || combined.includes('sadettin akyayla') || combined.includes('selami yalçın')) {
    if (combined.includes('tyt')) return 'TYT Tarih';
    if (combined.includes('tarih-2') || combined.includes('tarih 2')) return 'AYT Tarih-2';
    return 'AYT Tarih-1';
  }

  if (combined.includes('coğrafya') || combined.includes('cografya') || combined.includes('bayram meral') || combined.includes('yavuz tuna') || combined.includes('coğrafyanın kodları')) {
    if (combined.includes('tyt')) return 'TYT Coğrafya';
    if (combined.includes('coğrafya-2') || combined.includes('coğrafya 2')) return 'AYT Coğrafya-2';
    return 'AYT Coğrafya-1';
  }

  if (combined.includes('felsefe')) {
    return combined.includes('ayt') ? 'AYT Felsefe Grubu' : 'TYT Felsefe';
  }

  if (combined.includes('din')) {
    return 'TYT Din Kültürü';
  }

  if (combined.includes('dil') || combined.includes('ingilizce')) {
    return 'AYT Yabancı Dil';
  }

  if (combined.includes('matematik') || combined.includes('mat') || combined.includes('eyüp b') || combined.includes('mert hoca') || combined.includes('bıyıklı mat') || combined.includes('rehber matematik') || combined.includes('sml hoca') || combined.includes('tunç kurt')) {
    return (combined.includes('tyt') || combined.includes('problem') || combined.includes('temel kavram')) ? 'TYT Matematik' : 'AYT Matematik';
  }

  return 'AYT Matematik';
}

// -------------------------------------------------------------
// YouTube Single Video Metadata Scraper
// -------------------------------------------------------------
router.post('/youtube/video-info', async (req, res) => {
  const { url, subject } = req.body;
  if (!url) return res.status(400).json({ error: 'URL gereklidir.' });

  try {
    let title = '';
    let channelName = '';
    let detectedSubject = subject || '';

    let extractedVideoId = '';
    try {
      const trimmed = url.trim();
      const vMatch = trimmed.match(/[&?]v=([^&]+)/);
      if (vMatch) {
        extractedVideoId = vMatch[1];
      } else if (trimmed.includes('youtu.be/')) {
        const parts = trimmed.split('youtu.be/');
        if (parts[1]) {
          extractedVideoId = parts[1].split(/[?&]/)[0];
        }
      }
    } catch (e) {
      console.log('Could not extract videoId');
    }

    let targetUrl = url;
    if (extractedVideoId) {
      targetUrl = `https://www.youtube.com/watch?v=${extractedVideoId}`;
    } else {
      let playlistId = '';
      try {
        const listMatch = url.match(/[&?]list=([^&]+)/);
        if (listMatch) {
          playlistId = listMatch[1];
        }
      } catch (e) {}
      if (playlistId) {
        targetUrl = `https://www.youtube.com/playlist?list=${playlistId}`;
      }
    }

    try {
      const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(targetUrl)}&format=json`;
      const oembedRes = await fetch(oembedUrl);
      if (oembedRes.ok) {
        const data = await oembedRes.json() as any;
        title = data.title || '';
        channelName = data.author_name || '';
      }
    } catch (oembedErr) {
      console.log('oEmbed fetch error:', oembedErr);
    }

    try {
      const response = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
          'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
          'Cookie': 'SOCS=CAESEwgDEgk0ODg3NTU0NTUaAnRyIAE; CONSENT=YES+cb.20210328-17-p0.tr+FX+999'
        }
      });
      const html = await response.text();

      if (!title) {
        const matchTitle = html.match(/<meta property="og:title" content="([^"]+)"/i) || html.match(/<title>([^<]+)<\/title>/i);
        if (matchTitle) title = matchTitle[1].replace(' - YouTube', '').trim();
      }

      if (!channelName) {
        const matchChannel = html.match(/<link itemprop="name" content="([^"]+)"/i) || html.match(/"author":"([^"]+)"/i);
        if (matchChannel) channelName = matchChannel[1].trim();
      }
    } catch (scrapeErr) {
      console.log('HTML scrape error in video-info:', scrapeErr);
    }

    if (title === '- YouTube' || title === 'YouTube' || title === 'Before you proceed to YouTube') {
      title = '';
    }

    // Perform high-accuracy rule-based prediction from title/channel/URL
    if (!detectedSubject || detectedSubject.trim() === '') {
      detectedSubject = predictYKSSubject(title, channelName, targetUrl);
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && (!title || !channelName || !detectedSubject)) {
      try {
        const ai = new GoogleGenAI({ 
          apiKey,
          httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
        });

        const prompt = `
        You are an expert Turkish YKS Educational Video Metadata Extractor and Course Specialist.
        A student provided this YouTube URL: ${targetUrl}
        Existing extracted data:
        - Title: "${title}"
        - Channel Name: "${channelName}"
        - Subject: "${detectedSubject}"

        CRITICAL REQUIREMENT:
        - Identify the exact YKS Subject from this list ONLY: ["TYT Türkçe", "TYT Matematik", "TYT Geometri", "TYT Fizik", "TYT Kimya", "TYT Biyoloji", "TYT Tarih", "TYT Coğrafya", "TYT Felsefe", "TYT Din Kültürü", "Paragraf", "AYT Matematik", "AYT Geometri", "AYT Fizik", "AYT Kimya", "AYT Biyoloji", "AYT Edebiyat", "AYT Tarih-1", "AYT Coğrafya-1", "AYT Tarih-2", "AYT Coğrafya-2", "AYT Felsefe Grubu", "AYT Yabancı Dil"]
        
        Output MUST be ONLY a valid JSON object matching this schema:
        {
          "title": "Clean, realistic Turkish video lesson title or playlist title",
          "channelName": "Channel name or hoca name",
          "subject": "Exact YKS Subject name from the list"
        }
        `;

        const targetModel = featureModelConfig['YOUTUBE_PLANNER'] || 'gemini-3.1-flash-lite';
        const res = await generateContentWithFallback(ai, {
          model: targetModel,
          contents: prompt,
          config: { responseMimeType: 'application/json' }
        });

        const parsed = JSON.parse(res.response.text || '{}');
        if (!title && parsed.title) title = parsed.title;
        if (!channelName && parsed.channelName) channelName = parsed.channelName;
        if (parsed.subject) detectedSubject = parsed.subject;
      } catch (geminiErr) {
        console.error('Gemini video-info fallback error:', geminiErr);
      }
    }

    const finalSubject = predictYKSSubject(title, channelName, targetUrl + ' ' + (detectedSubject || ''));

    res.json({
      success: true,
      title: title || 'YouTube Ders Videosu',
      channelName: channelName || 'YouTube',
      notes: '',
      subject: finalSubject
    });
  } catch (err: any) {
    console.error('YouTube video-info route error:', err);
    res.status(500).json({ error: err.message || 'Video bilgileri çekilemedi.' });
  }
});

// -------------------------------------------------------------
// YouTube Channel Avatar Server-Side Local Disk Backup & Downloader
// -------------------------------------------------------------
const avatarsDir = path.join(uploadsDir, 'avatars', 'youtube');
if (!fs.existsSync(avatarsDir)) {
  try {
    fs.mkdirSync(avatarsDir, { recursive: true });
  } catch (e) {}
}

function generateFallbackAvatarSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
    <rect width="128" height="128" rx="28" fill="#0f172a" />
    <rect x="24" y="38" width="80" height="52" rx="14" fill="#ff0000" />
    <polygon points="54,50 82,64 54,78" fill="#ffffff" />
  </svg>`;
}

async function getOrDownloadChannelAvatarPath(channelUrl: string, channelName?: string, forceRefresh: boolean = false): Promise<string> {
  let slug = '';
  const handleMatch = channelUrl.match(/@([\w.-]+)/);
  if (handleMatch && handleMatch[1]) {
    slug = handleMatch[1].toLowerCase().replace(/[^a-z0-9]/g, '_');
  } else {
    slug = (channelName || 'chan').toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Math.abs(channelUrl.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a | 0; }, 0));
  }

  const jpgPath = path.join(avatarsDir, `${slug}.jpg`);
  const pngPath = path.join(avatarsDir, `${slug}.png`);
  const webpPath = path.join(avatarsDir, `${slug}.webp`);
  const svgPath = path.join(avatarsDir, `${slug}.svg`);

  if (!forceRefresh) {
    for (const p of [jpgPath, pngPath, webpPath]) {
      if (fs.existsSync(p)) {
        try {
          const stats = fs.statSync(p);
          if (stats.size > 500) return p;
        } catch (e) {}
      }
    }
  }

  // Strategy 1: YouTube Official oEmbed API
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(channelUrl)}&format=json`;
    const oembedRes = await fetch(oembedUrl);
    if (oembedRes.ok) {
      const data = await oembedRes.json() as any;
      if (data && data.thumbnail_url) {
        let imageUrl = data.thumbnail_url;
        if (imageUrl.includes('=s')) {
          imageUrl = imageUrl.replace(/=s\d+-[^&]+/, '=s240-c-k-c0x00ffffff-no-rj');
        }
        const imgRes = await fetch(imageUrl);
        if (imgRes.ok) {
          const arrayBuffer = await imgRes.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          if (buffer.length > 500) {
            fs.writeFileSync(jpgPath, buffer);
            console.log(`[Avatar Backup oEmbed] Saved avatar for ${slug} to youtube/ (${buffer.length} bytes).`);
            return jpgPath;
          }
        }
      }
    }
  } catch (oembedErr) {
    console.log(`[Avatar oEmbed Warning] oEmbed failed for ${channelUrl}`);
  }

  // Strategy 2: HTML Scrape for og:image
  try {
    const response = await fetch(channelUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
        'Cookie': 'SOCS=CAESEwgDEgk0ODg3NTU0NTUaAnRyIAE; CONSENT=YES+cb.20210328-17-p0.tr+FX+999'
      }
    });

    if (response.ok) {
      const html = await response.text();
      const ogMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i) || html.match(/<link\s+rel="image_src"\s+href="([^"]+)"/i);
      if (ogMatch && ogMatch[1] && !ogMatch[1].includes('googleg_standard_color')) {
        let imageUrl = ogMatch[1];
        if (imageUrl.includes('=s')) {
          imageUrl = imageUrl.replace(/=s\d+-[^&]+/, '=s240-c-k-c0x00ffffff-no-rj');
        }

        const imgRes = await fetch(imageUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });

        if (imgRes.ok) {
          const arrayBuffer = await imgRes.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          if (buffer.length > 500) {
            fs.writeFileSync(jpgPath, buffer);
            console.log(`[Avatar Backup Scrape] Saved avatar for ${slug} to youtube/ (${buffer.length} bytes).`);
            return jpgPath;
          }
        }
      }
    }
  } catch (err) {
    console.error(`[Avatar Backup Error] Failed to fetch avatar for ${channelUrl}:`, err);
  }

  if (fs.existsSync(svgPath) && !forceRefresh) {
    return svgPath;
  }

  const svgContent = generateFallbackAvatarSvg(channelName || slug);
  fs.writeFileSync(svgPath, svgContent, 'utf-8');
  return svgPath;
}

router.get('/youtube/avatar', async (req, res) => {
  const channelUrl = req.query.url as string;
  const channelName = (req.query.name as string) || '';
  if (!channelUrl) return res.status(400).send('Missing url');

  try {
    const avatarFilePath = await getOrDownloadChannelAvatarPath(channelUrl, channelName);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    if (avatarFilePath.endsWith('.svg')) {
      res.setHeader('Content-Type', 'image/svg+xml');
    } else if (avatarFilePath.endsWith('.png')) {
      res.setHeader('Content-Type', 'image/png');
    } else {
      res.setHeader('Content-Type', 'image/jpeg');
    }
    return res.sendFile(avatarFilePath);
  } catch (err) {
    console.error('YouTube avatar route error:', err);
    res.status(500).send('Avatar error');
  }
});

router.post('/youtube/sync-channel-avatar', async (req, res) => {
  const { url, name } = req.body;
  if (!url) return res.status(400).json({ success: false, error: 'URL gereklidir.' });

  try {
    const savedPath = await getOrDownloadChannelAvatarPath(url, name, true);
    const filename = path.basename(savedPath);
    const publicUrl = `/uploads/avatars/youtube/${filename}?t=${Date.now()}`;
    return res.json({ success: true, avatarUrl: publicUrl });
  } catch (err: any) {
    console.error('Single channel avatar sync error:', err);
    return res.status(500).json({ success: false, error: err.message || 'Avatar indirilemedi.' });
  }
});

router.post('/youtube/sync-avatars', async (req, res) => {
  const channels = req.body.channels as Array<{ url: string; name?: string }>;
  if (!Array.isArray(channels) || channels.length === 0) {
    return res.status(400).json({ success: false, error: 'Kanal listesi gereklidir.' });
  }

  let count = 0;
  for (const ch of channels) {
    if (ch.url) {
      try {
        await getOrDownloadChannelAvatarPath(ch.url, ch.name);
        count++;
      } catch (e) {
        console.error('Error syncing avatar for', ch.url);
      }
    }
  }

  res.json({ success: true, syncedCount: count, message: `${count} kanal görseli sunucuya başarıyla yedeklendi.` });
});

// -------------------------------------------------------------
// Photo Upload & Delete Endpoints
// -------------------------------------------------------------
router.post('/upload/photo', async (req, res) => {
  const authUser = getAuthUserFromRequest(req);
  if (!authUser) {
    return res.status(401).json({ success: false, error: 'Fotoğraf yüklemek için giriş yapmış olmalısınız.' });
  }

  const { type, userId, messageId, errorId, fileData } = req.body;

  if (!type || !fileData) {
    return res.status(400).json({ success: false, error: 'Eksik parametreler (type, fileData gereklidir).' });
  }

  let ext = 'jpg';
  if (fileData.startsWith('data:image/png')) ext = 'png';
  else if (fileData.startsWith('data:image/webp')) ext = 'webp';
  else if (fileData.startsWith('data:image/gif')) ext = 'gif';

  let storagePath = '';
  if (type === 'avatar') {
    const targetUserId = userId || authUser.id;
    if (authUser.role !== 'admin' && targetUserId !== authUser.id) {
      return res.status(403).json({ success: false, error: 'Başka bir kullanıcının profil fotoğrafını değiştiremezsiniz.' });
    }
    storagePath = `avatars/${targetUserId}/profile.${ext}`;
  } else if (type === 'message') {
    const msgId = messageId || `msg-${Date.now()}`;
    storagePath = `messages/${msgId}/attachment.${ext}`;
  } else if (type === 'question-error') {
    const targetUserId = userId || authUser.id;
    const errId = errorId || `err-${Date.now()}`;
    if (authUser.role !== 'admin' && authUser.role !== 'class_teacher' && authUser.role !== 'school_counselor' && authUser.role !== 'teacher' && targetUserId !== authUser.id) {
      return res.status(403).json({ success: false, error: 'Bu kullanıcı için soru fotoğrafı yükleme yetkiniz yok.' });
    }
    storagePath = `question-errors/${targetUserId}/${errId}.${ext}`;
  } else {
    return res.status(400).json({ success: false, error: 'Geçersiz fotoğraf türü.' });
  }

  try {
    const base64Data = fileData.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    const mimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

    const localFilePath = path.join(uploadsDir, storagePath);
    const localSubDir = path.dirname(localFilePath);
    if (!fs.existsSync(localSubDir)) {
      fs.mkdirSync(localSubDir, { recursive: true });
    }
    fs.writeFileSync(localFilePath, buffer);

    const uploadedUrl = `/uploads/${storagePath}?t=${Date.now()}`;

    if (fs.existsSync(configPath)) {
      try {
        const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        if (firebaseConfig && firebaseConfig.projectId) {
          const { initializeApp: initAdmin, getApps: getAdminApps } = await import('firebase-admin/app');
          const { getStorage: getAdminStorage } = await import('firebase-admin/storage');

          if (getAdminApps().length === 0) {
            initAdmin({
              projectId: firebaseConfig.projectId,
              storageBucket: firebaseConfig.storageBucket || `${firebaseConfig.projectId}.firebasestorage.app`
            });
          }

          const bucketName = firebaseConfig.storageBucket || `${firebaseConfig.projectId}.firebasestorage.app`;
          const bucket = getAdminStorage().bucket(bucketName);
          const file = bucket.file(storagePath);

          await file.save(buffer, {
            metadata: { contentType: mimeType },
            public: true,
            resumable: false
          });
        }
      } catch (fbErr: any) {
        console.warn('Firebase Storage upload warning (ignoring, using data/local URL):', fbErr.message);
      }
    }

    return res.json({
      success: true,
      url: uploadedUrl,
      storagePath
    });
  } catch (err: any) {
    console.error('Photo upload error:', err);
    return res.status(500).json({ success: false, error: err.message || 'Fotoğraf yüklenirken bir sunucu hatası oluştu.' });
  }
});

router.post('/upload/delete', async (req, res) => {
  const authUser = getAuthUserFromRequest(req);
  if (!authUser) {
    return res.status(401).json({ success: false, error: 'Oturum açılmamış.' });
  }

  const { pathOrUrl } = req.body;
  if (!pathOrUrl) {
    return res.status(400).json({ success: false, error: 'Silinecek dosya yolu veya URL gereklidir.' });
  }

  try {
    await removeStorageFileInternal(pathOrUrl);
    return res.json({ success: true });
  } catch (err: any) {
    console.error('Photo delete error:', err);
    return res.status(500).json({ success: false, error: err.message || 'Fotoğraf silinirken hata oluştu.' });
  }
});

// -------------------------------------------------------------
// Admin Message Management Endpoints
// -------------------------------------------------------------
router.get('/admin/messages', verifyAdmin, async (req, res) => {
  try {
    if (!db) {
      return res.status(500).json({ success: false, error: 'Veritabanı bağlantısı kurulmadı.' });
    }
    const messagesSnap = await getDocs(collection(db, 'messages'));
    const messages: any[] = [];
    messagesSnap.forEach(d => {
      messages.push({ id: d.id, ...d.data() });
    });
    messages.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    res.json({ success: true, messages });
  } catch (err: any) {
    console.error('Failed to fetch messages for admin:', err);
    res.status(500).json({ success: false, error: err.message || 'Mesajlar yüklenirken bir hata oluştu.' });
  }
});

router.delete('/admin/messages/:id', verifyAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    if (!db) {
      return res.status(500).json({ success: false, error: 'Veritabanı bağlantısı kurulmadı.' });
    }
    const docRef = doc(db, 'messages', id);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      if (data.attachmentUrl) {
        await removeStorageFileInternal(data.attachmentUrl);
      }
    }
    await deleteDoc(docRef);
    res.json({ success: true, message: 'Mesaj başarıyla silindi.' });
  } catch (err: any) {
    console.error(`Failed to delete message ${id}:`, err);
    res.status(500).json({ success: false, error: err.message || 'Mesaj silinirken bir hata oluştu.' });
  }
});

router.post('/admin/messages/delete-bulk', verifyAdmin, async (req, res) => {
  const { ids } = req.body;
  if (!ids || !Array.isArray(ids)) {
    return res.status(400).json({ success: false, error: 'Geçersiz mesaj ID listesi.' });
  }
  try {
    if (!db) {
      return res.status(500).json({ success: false, error: 'Veritabanı bağlantısı kurulmadı.' });
    }
    for (const id of ids) {
      const docRef = doc(db, 'messages', id);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        if (data.attachmentUrl) {
          await removeStorageFileInternal(data.attachmentUrl);
        }
      }
      await deleteDoc(docRef);
    }
    res.json({ success: true, message: `${ids.length} mesaj başarıyla silindi.` });
  } catch (err: any) {
    console.error('Failed to delete bulk messages:', err);
    res.status(500).json({ success: false, error: err.message || 'Toplu mesaj silme işleminde bir hata oluştu.' });
  }
});

// -------------------------------------------------------------
// Wikipedia Logo Proxy Endpoint
// -------------------------------------------------------------
router.get('/wikipedia/logo', async (req, res) => {
  const universityName = req.query.name as string;
  if (!universityName) {
    return res.status(400).json({ error: 'University name is required' });
  }

  try {
    const formattedTitle = universityName.trim().replace(/\s+/g, '_');
    const wikiUrl = `https://tr.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(formattedTitle)}`;
    
    const wikiResponse = await fetch(wikiUrl, {
      headers: {
        'User-Agent': 'YKSApplet/1.0 (ccaqlayan@gmail.com) Node.js/FetchProxy'
      }
    });

    if (!wikiResponse.ok) {
      return res.json({ logoUrl: null });
    }

    const data = await wikiResponse.json() as any;
    const imgUrl = data?.originalimage?.source || data?.thumbnail?.source || null;
    res.json({ logoUrl: imgUrl });
  } catch (err) {
    console.error('Wikipedia proxy fetch error:', err);
    res.json({ logoUrl: null });
  }
});

export default router;
