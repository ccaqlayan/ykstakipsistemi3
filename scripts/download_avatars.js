import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const avatarsDir = path.resolve(__dirname, '../public/uploads/avatars/youtube');
if (!fs.existsSync(avatarsDir)) {
  fs.mkdirSync(avatarsDir, { recursive: true });
}

// Remove old loose files in public/uploads/avatars root if any exist
const parentDir = path.resolve(__dirname, '../public/uploads/avatars');
if (fs.existsSync(parentDir)) {
  const files = fs.readdirSync(parentDir);
  for (const f of files) {
    const fullP = path.join(parentDir, f);
    if (fs.statSync(fullP).isFile()) {
      try { fs.unlinkSync(fullP); } catch(e) {}
    }
  }
}

const RECOMMENDED_CHANNELS = [
  // Matematik
  { subject: 'Matematik', name: 'Sml Hoca Matematik', url: 'https://www.youtube.com/@smlhocamatematik' },
  { subject: 'Matematik', name: 'Eyüp B. Matematik Geometri', url: 'https://www.youtube.com/@eyupb' },
  { subject: 'Matematik', name: 'Bıyıklı Matematik', url: 'https://www.youtube.com/@biyiklimatematik' },
  { subject: 'Matematik', name: 'Mert Hoca', url: 'https://www.youtube.com/@MertHoca' },
  { subject: 'Matematik', name: 'Matematiğin Güler Yüzü', url: 'https://www.youtube.com/@matematiginguleryuzu' },
  { subject: 'Matematik', name: 'Rehber Matematik', url: 'https://www.youtube.com/@RehberMatematik' },
  { subject: 'Matematik', name: 'İlyas Güneş', url: 'https://www.youtube.com/@ilyasgunes' },
  { subject: 'Matematik', name: 'Atölye Matematik', url: 'https://www.youtube.com/@atolyematematik' },
  { subject: 'Matematik', name: 'Şenol Hoca', url: 'https://www.youtube.com/@senolhoca' },
  { subject: 'Matematik', name: 'Tunç Kurt', url: 'https://www.youtube.com/@TuncKurtMatematik' },
  { subject: 'Matematik', name: 'Soner Akıncı MATEMATİK', url: 'https://www.youtube.com/@sonerakinci' },
  { subject: 'Matematik', name: 'Matemetri', url: 'https://www.youtube.com/@matemetri' },
  { subject: 'Matematik', name: 'Matematiğin Kader Hocası', url: 'https://www.youtube.com/@matematiginkaderhocasi' },
  { subject: 'Matematik', name: 'Matematiğin Fatihi', url: 'https://www.youtube.com/@matematiginfatihi' },
  { subject: 'Matematik', name: 'Anıl Hoca İle Matematik', url: 'https://www.youtube.com/@anilhocailematematik' },
  { subject: 'Matematik', name: 'Şükrü Akkoyun Matematik', url: 'https://www.youtube.com/@SukruAkkoyunMatematik' },
  { subject: 'Matematik', name: 'Mesut Hocam', url: 'https://www.youtube.com/@mesuthocam' },
  { subject: 'Matematik', name: 'Hocalara Geldik', url: 'https://www.youtube.com/@HocalaraGeldik' },

  // Geometri
  { subject: 'Geometri', name: 'Kenan Kara', url: 'https://www.youtube.com/@kenankarailegeometri' },
  { subject: 'Geometri', name: 'Nurtaç Hoca', url: 'https://www.youtube.com/@nurtachoca' },
  { subject: 'Geometri', name: 'Merkeze Teğet', url: 'https://www.youtube.com/@MerkezeTeget' },
  { subject: 'Geometri', name: 'Engin Hoca', url: 'https://www.youtube.com/@EnginHoca' },

  // Türkçe
  { subject: 'Türkçe', name: 'Rüştü Hoca İle Türkçe', url: 'https://www.youtube.com/@RustuHoca' },
  { subject: 'Türkçe', name: 'Kadir Gümüş', url: 'https://www.youtube.com/@KadirGumus' },
  { subject: 'Türkçe', name: 'Türkçenin Matematiği', url: 'https://www.youtube.com/@TurkceninMatematigi' },
  { subject: 'Türkçe', name: 'Nazlı Hoca\'m', url: 'https://www.youtube.com/@NazliHocam' },
  { subject: 'Türkçe', name: 'Onur Soğuk', url: 'https://www.youtube.com/@onursoguk' },

  // Fizik
  { subject: 'Fizik', name: 'VİP Fizik', url: 'https://www.youtube.com/@vipfizik' },
  { subject: 'Fizik', name: 'Umut Öncül Akademi', url: 'https://www.youtube.com/@umutoncul' },
  { subject: 'Fizik', name: 'Tayfun Hocam', url: 'https://www.youtube.com/@TayfunHocam' },
  { subject: 'Fizik', name: 'Özcan Aykın', url: 'https://www.youtube.com/@ozcanaykin' },
  { subject: 'Fizik', name: 'Altuğ Güneş', url: 'https://www.youtube.com/@altuggunes' },
  { subject: 'Fizik', name: 'Fizikle Barış', url: 'https://www.youtube.com/@fiziklebaris' },
  { subject: 'Fizik', name: 'Entropi [Dursun İşler]', url: 'https://www.youtube.com/@EntropiFizik' },
  { subject: 'Fizik', name: 'Fizikfinito', url: 'https://www.youtube.com/@fizikfinito' },
  { subject: 'Fizik', name: 'Ertan Sinan Şahin', url: 'https://www.youtube.com/@ertansinansahin' },
  { subject: 'Fizik', name: 'Fiziklen', url: 'https://www.youtube.com/@fiziklen' },

  // Kimya
  { subject: 'Kimya', name: 'Kimya Adası', url: 'https://www.youtube.com/@kimyaadasi' },
  { subject: 'Kimya', name: 'Bizim Hocalar', url: 'https://www.youtube.com/@BizimHocalar' },
  { subject: 'Kimya', name: 'Görkem Şahin', url: 'https://www.youtube.com/@gorkemsahin' },
  { subject: 'Kimya', name: 'Kimya Özel', url: 'https://www.youtube.com/@KimyaOzel' },
  { subject: 'Kimya', name: 'Kimya Köyü', url: 'https://www.youtube.com/@kimyakoyu' },
  { subject: 'Kimya', name: 'Kimya Hocam', url: 'https://www.youtube.com/@kimyahocam' },
  { subject: 'Kimya', name: 'Bizim Kimyamız', url: 'https://www.youtube.com/@bizimkimyamiz' },
  { subject: 'Kimya', name: 'e-Kimya', url: 'https://www.youtube.com/@e-kimya' },
  { subject: 'Kimya', name: 'Levent Özdede ile Kimya', url: 'https://www.youtube.com/@LeventOzdedeileKimya' },
  { subject: 'Kimya', name: 'Paraksilen Kimya', url: 'https://www.youtube.com/@paraksilenkimya' },

  // Biyoloji
  { subject: 'Biyoloji', name: 'Fundamentals', url: 'https://www.youtube.com/@FundamentalsBiyoloji' },
  { subject: 'Biyoloji', name: 'Barış Hoca Biyoloji', url: 'https://www.youtube.com/@barishocabiyoloji' },
  { subject: 'Biyoloji', name: 'Dilek Kuvvet', url: 'https://www.youtube.com/@dilekkuvvet' },
  { subject: 'Biyoloji', name: 'Betül Biyoloji', url: 'https://www.youtube.com/@betulbiyoloji' },
  { subject: 'Biyoloji', name: 'Biosem', url: 'https://www.youtube.com/@biosem' },
  { subject: 'Biyoloji', name: 'Damla Hoca Biyoloji', url: 'https://www.youtube.com/@damlahocabiyoloji' },
  { subject: 'Biyoloji', name: 'Hacettepeli Hoca', url: 'https://www.youtube.com/@hacettepelihoca' },
  { subject: 'Biyoloji', name: 'Selin Hoca Biyoloji', url: 'https://www.youtube.com/@selinhoca' },
  { subject: 'Biyoloji', name: 'Senin Biyolojin', url: 'https://www.youtube.com/@SeninBiyolojin' },
  { subject: 'Biyoloji', name: 'Bekir Avşar', url: 'https://www.youtube.com/@BekirAvsar' },
  { subject: 'Biyoloji', name: 'Seda Hoca Biyoloji', url: 'https://www.youtube.com/@sedahocabiyoloji' },

  // Tarih
  { subject: 'Tarih', name: 'Benim Hocam (Ramazan Yetgin)', url: 'https://www.youtube.com/@BenimHocam' },
  { subject: 'Tarih', name: 'Sadettin Akyayla', url: 'https://www.youtube.com/@sadettinakyayla' },
  { subject: 'Tarih', name: 'Sosyal Hocam', url: 'https://www.youtube.com/@sosyalhocam' },
  { subject: 'Tarih', name: 'Onur Gece', url: 'https://www.youtube.com/@onurgece' },

  // Coğrafya
  { subject: 'Coğrafya', name: 'Coğrafya Cepte', url: 'https://www.youtube.com/@cografyacepte' },
  { subject: 'Coğrafya', name: 'Benim Hocam (Bayram Meral)', url: 'https://www.youtube.com/@BenimHocam' },
  { subject: 'Coğrafya', name: 'Coğrafyanın kodları', url: 'https://www.youtube.com/@CografyaninKodlari' },
  { subject: 'Coğrafya', name: 'Yavuz Tuna', url: 'https://www.youtube.com/@YavuzTuna' },

  // Felsefe
  { subject: 'Felsefe', name: 'Can Köni', url: 'https://www.youtube.com/@CanKoni' }
];

function generateSvgAvatar() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
    <rect width="128" height="128" rx="28" fill="#0f172a" />
    <rect x="24" y="38" width="80" height="52" rx="14" fill="#ff0000" />
    <polygon points="54,50 82,64 54,78" fill="#ffffff" />
  </svg>`;
}

async function downloadAvatar(channel) {
  const handleMatch = channel.url.match(/@([\w.-]+)/);
  const handle = handleMatch ? handleMatch[1].toLowerCase() : channel.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const slug = handle.replace(/[^a-z0-9]/g, '_');
  const jpgPath = path.join(avatarsDir, `${slug}.jpg`);
  const svgPath = path.join(avatarsDir, `${slug}.svg`);

  console.log(`Processing: ${channel.name} (@${handle})...`);

  // Try oEmbed API
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(channel.url)}&format=json`;
    const res = await fetch(oembedUrl);
    if (res.ok) {
      const data = await res.json();
      if (data && data.thumbnail_url) {
        let imgUrl = data.thumbnail_url.replace(/=s\d+-[^&]+/, '=s240-c-k-c0x00ffffff-no-rj');
        const imgRes = await fetch(imgUrl);
        if (imgRes.ok) {
          const buffer = Buffer.from(await imgRes.arrayBuffer());
          if (buffer.length > 500) {
            fs.writeFileSync(jpgPath, buffer);
            console.log(`  ✓ Saved JPG via oEmbed (${buffer.length} bytes) to youtube/`);
            return;
          }
        }
      }
    }
  } catch (e) {
    console.log(`  oEmbed failed for ${channel.name}`);
  }

  // Try scraping
  try {
    const pageRes = await fetch(channel.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
        'Cookie': 'SOCS=CAESEwgDEgk0ODg3NTU0NTUaAnRyIAE; CONSENT=YES+cb.20210328-17-p0.tr+FX+999'
      }
    });

    if (pageRes.ok) {
      const html = await pageRes.text();
      const match = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i) || html.match(/<link\s+rel="image_src"\s+href="([^"]+)"/i);
      if (match && match[1] && !match[1].includes('googleg_standard_color')) {
        let imgUrl = match[1].replace(/=s\d+-[^&]+/, '=s240-c-k-c0x00ffffff-no-rj');
        const imgRes = await fetch(imgUrl);
        if (imgRes.ok) {
          const buffer = Buffer.from(await imgRes.arrayBuffer());
          if (buffer.length > 500) {
            fs.writeFileSync(jpgPath, buffer);
            console.log(`  ✓ Saved JPG via Scrape (${buffer.length} bytes) to youtube/`);
            return;
          }
        }
      }
    }
  } catch (e) {
    console.log(`  Scrape failed for ${channel.name}`);
  }

  // Save SVG Fallback
  fs.writeFileSync(svgPath, generateSvgAvatar(channel.name), 'utf-8');
  console.log(`  ✓ Saved SVG Fallback to youtube/`);
}

async function run() {
  for (const ch of RECOMMENDED_CHANNELS) {
    await downloadAvatar(ch);
  }
  console.log('Finished downloading all channel avatars into youtube/ folder!');
}

run();
