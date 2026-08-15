import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import AdmZip from 'adm-zip';
import { APP_VERSION } from '../../version';

export interface GitHubVersion {
  tag: string;
  name: string;
  commitSha: string;
  date: string;
  message: string;
  zipballUrl: string;
  isCurrent: boolean;
  author?: string;
}

export interface BackupInfo {
  filename: string;
  filepath: string;
  sizeBytes: number;
  sizeFormatted: string;
  createdAt: string;
  version: string;
  isAuto: boolean;
}

const REPO_OWNER = 'ccaqlayan';
const REPO_NAME = 'ykstakipsistemi3';
const BACKUPS_DIR = path.join(process.cwd(), 'backups');
const TEMP_DIR = path.join(process.cwd(), 'temp_updater');

// Files and folders protected from overwrite and excluded from source wipe
const PROTECTED_PATHS = [
  '.env',
  '.env.production',
  '.env.local',
  'serviceAccountKey.json',
  'firebase-admin-key.json',
  'public/uploads',
  'backups',
  'node_modules',
  '.git'
];

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function runCommand(command: string, cwd: string = process.cwd()): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    exec(command, { cwd, maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        return reject(new Error(`Komut hatası (${command}): ${stderr || stdout || error.message}`));
      }
      resolve({ stdout, stderr });
    });
  });
}

/**
 * 1. Fetch available versions and recent commits from GitHub
 */
export async function getGitHubVersions(): Promise<GitHubVersion[]> {
  const versions: GitHubVersion[] = [];
  const headers: Record<string, string> = {
    'User-Agent': 'YKS-Takip-Sistemi-Updater/1.0',
    'Accept': 'application/vnd.github.v3+json'
  };

  if (process.env.GITHUB_TOKEN) {
    headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
  }

  try {
    // 1. Fetch commits
    const commitsRes = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/commits?per_page=30`, { headers });
    let commits: any[] = [];
    if (commitsRes.ok) {
      commits = await commitsRes.json();
    }

    // 2. Fetch tags
    const tagsRes = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/tags?per_page=30`, { headers });
    let tags: any[] = [];
    if (tagsRes.ok) {
      tags = await tagsRes.json();
    }

    // Map commits into version list
    for (const c of commits) {
      const sha = (c.sha || '').substring(0, 7);
      const fullMessage = c.commit?.message || '';
      const firstLine = fullMessage.split('\n')[0];
      
      // Check if commit message contains version like "v1.6.2:" or has a git tag
      const matchedTag = tags.find((t: any) => t.commit?.sha === c.sha)?.name;
      const messageVersionMatch = firstLine.match(/^(v\d+\.\d+(\.\d+)?)/i);
      const tagLabel = matchedTag || (messageVersionMatch ? messageVersionMatch[1] : `commit-${sha}`);

      const isCurrent = tagLabel === APP_VERSION || firstLine.includes(APP_VERSION);

      versions.push({
        tag: tagLabel,
        name: firstLine,
        commitSha: sha,
        date: c.commit?.author?.date || new Date().toISOString(),
        message: fullMessage,
        zipballUrl: `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/zipball/${c.sha}`,
        isCurrent,
        author: c.commit?.author?.name || c.author?.login || 'Admin'
      });
    }
  } catch (err: any) {
    console.error('GitHub API error in getGitHubVersions:', err);
    // Return at least current version info on error
    versions.push({
      tag: APP_VERSION,
      name: `${APP_VERSION} (Mevcut Yerel Sürüm)`,
      commitSha: 'local',
      date: new Date().toISOString(),
      message: 'GitHub API erişilemedi, mevcut sürüm bilgisi gösteriliyor.',
      zipballUrl: '',
      isCurrent: true
    });
  }

  return versions;
}

/**
 * 2. Create full backup of current workspace files
 */
export async function createBackup(label?: string): Promise<BackupInfo> {
  ensureDir(BACKUPS_DIR);

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const safeLabel = (label || APP_VERSION).replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `backup_${safeLabel}_${timestamp}.zip`;
  const filepath = path.join(BACKUPS_DIR, filename);

  const zip = new AdmZip();
  const rootDir = process.cwd();

  const ignoreList = [
    'node_modules',
    'backups',
    'temp_updater',
    '.git',
    '.gemini',
    '.vscode'
  ];

  function addDirToZip(currentPath: string, zipPath: string) {
    const items = fs.readdirSync(currentPath);
    for (const item of items) {
      if (ignoreList.includes(item)) continue;

      const fullItemPath = path.join(currentPath, item);
      const relativeZipPath = zipPath ? `${zipPath}/${item}` : item;
      const stat = fs.statSync(fullItemPath);

      if (stat.isDirectory()) {
        addDirToZip(fullItemPath, relativeZipPath);
      } else {
        zip.addLocalFile(fullItemPath, zipPath);
      }
    }
  }

  addDirToZip(rootDir, '');
  zip.writeZip(filepath);

  const stat = fs.statSync(filepath);
  return {
    filename,
    filepath,
    sizeBytes: stat.size,
    sizeFormatted: formatBytes(stat.size),
    createdAt: new Date().toISOString(),
    version: APP_VERSION,
    isAuto: label?.includes('auto') || label?.includes('pre_update') || false
  };
}

/**
 * 3. List existing backups
 */
export function listBackups(): BackupInfo[] {
  ensureDir(BACKUPS_DIR);
  const files = fs.readdirSync(BACKUPS_DIR);
  const backups: BackupInfo[] = [];

  for (const file of files) {
    if (!file.endsWith('.zip')) continue;
    const filepath = path.join(BACKUPS_DIR, file);
    try {
      const stat = fs.statSync(filepath);
      const versionMatch = file.match(/backup_([^_]+)_/);
      const version = versionMatch ? versionMatch[1] : 'Bilinmiyor';

      backups.push({
        filename: file,
        filepath,
        sizeBytes: stat.size,
        sizeFormatted: formatBytes(stat.size),
        createdAt: stat.birthtime.toISOString(),
        version,
        isAuto: file.includes('auto') || file.includes('pre_update')
      });
    } catch (e) {
      console.warn('Backup file stat error:', e);
    }
  }

  // Sort newest first
  return backups.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * 4. Delete backup file safely
 */
export function deleteBackup(filename: string): boolean {
  const safeFilename = path.basename(filename);
  const filepath = path.join(BACKUPS_DIR, safeFilename);
  if (fs.existsSync(filepath)) {
    fs.unlinkSync(filepath);
    return true;
  }
  return false;
}

/**
 * 5. Restore a backup zip archive
 */
export async function restoreBackup(filename: string, log?: (msg: string) => void): Promise<void> {
  const sendLog = log || console.log;
  const safeFilename = path.basename(filename);
  const filepath = path.join(BACKUPS_DIR, safeFilename);

  if (!fs.existsSync(filepath)) {
    throw new Error(`Yedek dosyası bulunamadı: ${safeFilename}`);
  }

  sendLog(`[1/4] '${safeFilename}' yedeği okunuyor ve doğrulanıyor...`);
  const zip = new AdmZip(filepath);
  const rootDir = process.cwd();

  sendLog(`[2/4] Yedek içeriği çalışma dizinine aktarılıyor (Korumalı dosyalar muhafaza ediliyor)...`);
  
  // Extract all entries safely
  const zipEntries = zip.getEntries();
  for (const entry of zipEntries) {
    if (entry.isDirectory) continue;
    const entryPath = entry.entryName.replace(/\\/g, '/');

    // Skip protected paths
    const isProtected = PROTECTED_PATHS.some(p => entryPath === p || entryPath.startsWith(`${p}/`));
    if (isProtected) {
      continue;
    }

    const targetFilePath = path.join(rootDir, entry.entryName);
    const targetDirPath = path.dirname(targetFilePath);
    ensureDir(targetDirPath);
    fs.writeFileSync(targetFilePath, entry.getData());
  }

  sendLog(`[3/4] Proje yeniden derleniyor ('npm run build')...`);
  try {
    await runCommand('npm run build', rootDir);
    sendLog(`[4/4] Geri yükleme ve derleme başarıyla tamamlandı!`);
  } catch (buildErr: any) {
    sendLog(`[UYARI] Derleme uyarısı: ${buildErr.message}. Mevcut dosyalar geri yüklendi.`);
  }
}

/**
 * 6. Update system to a specified GitHub commit/tag version with Auto-Rollback on failure
 */
export async function updateToVersion(
  targetVersion: { tag?: string; commitSha?: string; zipballUrl?: string },
  log: (msg: string) => void
): Promise<{ success: boolean; message: string; backupFilename: string }> {
  const sendLog = log;
  const rootDir = process.cwd();
  let backupInfo: BackupInfo | null = null;

  try {
    // ADIM 1: Otomatik Yedek Al
    sendLog(`[1/6] 🛡️ Güvenlik Yedeği: Mevcut '${APP_VERSION}' sürümü yedekleniyor...`);
    backupInfo = await createBackup(`pre_update_from_${APP_VERSION}`);
    sendLog(`[1/6] ✅ Yedek oluşturuldu: ${backupInfo.filename} (${backupInfo.sizeFormatted})`);

    // ADIM 2: GitHub Paketini İndir
    const commitOrTag = targetVersion.commitSha || targetVersion.tag || 'main';
    const downloadUrl = targetVersion.zipballUrl || `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/zipball/${commitOrTag}`;
    
    sendLog(`[2/6] 📥 İndirme: GitHub'dan '${targetVersion.tag || commitOrTag}' sürüm paketi indiriliyor...`);
    
    ensureDir(TEMP_DIR);
    const zipPath = path.join(TEMP_DIR, `download_${commitOrTag}.zip`);

    const headers: Record<string, string> = {
      'User-Agent': 'YKS-Takip-Sistemi-Updater/1.0'
    };
    if (process.env.GITHUB_TOKEN) {
      headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
    }

    const response = await fetch(downloadUrl, { headers });
    if (!response.ok) {
      throw new Error(`GitHub paket indirme başarısız (HTTP ${response.status}): ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    fs.writeFileSync(zipPath, Buffer.from(arrayBuffer));
    sendLog(`[2/6] ✅ Paket indirildi (${formatBytes(arrayBuffer.byteLength)})`);

    // ADIM 3: Geçici Klasöre Aç
    sendLog(`[3/6] 📦 Arşiv Açma: İndirilen paket geçici dizine açılıyor...`);
    const downloadZip = new AdmZip(zipPath);
    const extractDir = path.join(TEMP_DIR, `extracted_${commitOrTag}`);
    ensureDir(extractDir);
    downloadZip.extractAllTo(extractDir, true);

    // GitHub zipball archives put files inside a root folder like "ccaqlayan-ykstakipsistemi3-5f77d52/"
    const extractedFolders = fs.readdirSync(extractDir);
    const innerRoot = extractedFolders.length === 1 && fs.statSync(path.join(extractDir, extractedFolders[0])).isDirectory()
      ? path.join(extractDir, extractedFolders[0])
      : extractDir;

    sendLog(`[3/6] ✅ Arşiv açıldı.`);

    // ADIM 4: Dosyaları Çalışma Dizinine Kopyala (Korumalı dosyalar korunur)
    sendLog(`[4/6] 🔄 Dosya Güncelleme: Yeni kaynak kodlar çalışma dizinine aktarılıyor...`);

    function copyDirRecursive(src: string, dest: string, relativeBase: string = '') {
      const items = fs.readdirSync(src);
      for (const item of items) {
        const srcItemPath = path.join(src, item);
        const destItemPath = path.join(dest, item);
        const relPath = relativeBase ? `${relativeBase}/${item}` : item;

        // Skip protected items
        const isProtected = PROTECTED_PATHS.some(p => relPath === p || relPath.startsWith(`${p}/`));
        if (isProtected) {
          continue;
        }

        const stat = fs.statSync(srcItemPath);
        if (stat.isDirectory()) {
          ensureDir(destItemPath);
          copyDirRecursive(srcItemPath, destItemPath, relPath);
        } else {
          ensureDir(path.dirname(destItemPath));
          fs.copyFileSync(srcItemPath, destItemPath);
        }
      }
    }

    copyDirRecursive(innerRoot, rootDir);
    sendLog(`[4/6] ✅ Dosyalar güncellendi (.env ve /uploads korundu).`);

    // ADIM 5: Bağımlılıkları Doğrula (npm install)
    sendLog(`[5/6] ⚙️ Bağımlılıklar: Paketler kontrol ediliyor...`);
    try {
      await runCommand('npm install --prefer-offline --no-audit', rootDir);
      sendLog(`[5/6] ✅ Paket bağımlılıkları güncel.`);
    } catch (npmErr: any) {
      sendLog(`[5/6] ⚠️ 'npm install' uyarısı: ${npmErr.message}. Derleme adımına geçiliyor.`);
    }

    // ADIM 6: Derleme (npm run build)
    sendLog(`[6/6] 🚀 Derleme & Doğrulama: Proje derleniyor ('npm run build')...`);
    try {
      await runCommand('npm run build', rootDir);
      sendLog(`[6/6] ✅ Derleme başarıyla tamamlandı (Vite + Server bundle OK).`);
    } catch (buildError: any) {
      // DERLEME HATASI -> OTOMATİK ROLLBACK!
      sendLog(`[HATA] ❌ Yeni sürüm derleme hatası verdi: ${buildError.message}`);
      sendLog(`[ROLLBACK] 🚨 Otomatik Geri Alma Başlatılıyor: Sistem önceki yedek '${backupInfo.filename}' sürümüne döndürülüyor...`);
      
      await restoreBackup(backupInfo.filename, sendLog);
      
      sendLog(`[ROLLBACK] ✅ Otomatik geri alma tamamlandı! Sistem çökmeden önceki kararlı durumuna geri getirildi.`);
      throw new Error(`Güncelleme derleme hatası nedeniyle iptal edildi ve önceki yedeğe otomatik dönüldü: ${buildError.message}`);
    }

    // Temizlik
    try {
      if (fs.existsSync(TEMP_DIR)) {
        fs.rmSync(TEMP_DIR, { recursive: true, force: true });
      }
    } catch (cleanErr) {
      // ignore
    }

    sendLog(`🎉 TEBRİKLER! Sistem başarıyla '${targetVersion.tag || commitOrTag}' sürümüne güncellendi.`);
    return {
      success: true,
      message: `Sistem başarıyla '${targetVersion.tag || commitOrTag}' sürümüne güncellendi.`,
      backupFilename: backupInfo.filename
    };

  } catch (err: any) {
    sendLog(`❌ Güncelleme sırasında hata oluştu: ${err.message}`);
    throw err;
  }
}
