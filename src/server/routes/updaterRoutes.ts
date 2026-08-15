import express from 'express';
import path from 'path';
import fs from 'fs';
import { 
  getGitHubVersions, 
  createBackup, 
  listBackups, 
  deleteBackup, 
  restoreBackup, 
  updateToVersion 
} from '../services/updaterService';

const router = express.Router();

// Memory store for active update progress and logs
let activeUpdateLogs: string[] = [];
let isUpdating = false;

// 1. Get available GitHub versions & commits
router.get('/versions', async (req, res) => {
  try {
    const versions = await getGitHubVersions();
    return res.json({ success: true, versions });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 2. List backups
router.get('/backups', async (req, res) => {
  try {
    const backups = await listBackups();
    return res.json({ success: true, backups });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Create immediate manual backup
router.post('/backup-now', async (req, res) => {
  try {
    const label = req.body?.label || 'manual';
    const backup = await createBackup(label);
    return res.json({ success: true, backup });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Download a backup file
router.get('/download-backup/:filename', async (req, res) => {
  const filename = path.basename(req.params.filename);
  const filepath = path.join(process.cwd(), 'backups', filename);

  if (!fs.existsSync(filepath)) {
    try {
      const { downloadBackupFromCloud } = await import('../services/updaterService');
      await downloadBackupFromCloud(filename, filepath);
    } catch (e) {
      // cloud download error
    }
  }

  if (!fs.existsSync(filepath)) {
    return res.status(404).send('Yedek dosyası bulunamadı');
  }

  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Type', 'application/zip');
  return res.sendFile(filepath);
});

// 5. Delete backup
router.delete('/backups/:filename', async (req, res) => {
  try {
    const success = await deleteBackup(req.params.filename);
    return res.json({ success });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Restore backup
router.post('/restore', async (req, res) => {
  if (isUpdating) {
    return res.status(400).json({ success: false, error: 'Şu anda bir güncelleme veya geri yükleme işlemi sürüyor.' });
  }

  const filename = req.body?.filename;
  if (!filename) {
    return res.status(400).json({ success: false, error: 'Yedek dosya adı belirtilmedi.' });
  }

  isUpdating = true;
  activeUpdateLogs = [`[${new Date().toLocaleTimeString('tr-TR')}] '${filename}' yedeğini geri yükleme başlatıldı...`];

  try {
    await restoreBackup(filename, (msg) => {
      activeUpdateLogs.push(`[${new Date().toLocaleTimeString('tr-TR')}] ${msg}`);
    });
    isUpdating = false;
    return res.json({ success: true, message: 'Yedek başarıyla geri yüklendi.' });
  } catch (err: any) {
    isUpdating = false;
    return res.status(500).json({ success: false, error: err.message, logs: activeUpdateLogs });
  }
});

// 7. Update to version with progress logging
router.post('/update', async (req, res) => {
  if (isUpdating) {
    return res.status(400).json({ success: false, error: 'Zaten devam eden bir güncelleme işlemi var.' });
  }

  const { tag, commitSha, zipballUrl } = req.body || {};
  if (!tag && !commitSha && !zipballUrl) {
    return res.status(400).json({ success: false, error: 'Hedef sürüm veya commit belirtilmedi.' });
  }

  isUpdating = true;
  activeUpdateLogs = [`[${new Date().toLocaleTimeString('tr-TR')}] 🚀 Sürüm güncelleme başlatıldı: ${tag || commitSha}`];

  // Run in background / respond with start
  updateToVersion({ tag, commitSha, zipballUrl }, (msg) => {
    activeUpdateLogs.push(`[${new Date().toLocaleTimeString('tr-TR')}] ${msg}`);
  }).then((result) => {
    isUpdating = false;
  }).catch((err) => {
    isUpdating = false;
  });

  return res.json({ success: true, message: 'Güncelleme işlemi başlatıldı.', isUpdating: true });
});

// 8. Stream/Poll update logs
router.get('/status', (req, res) => {
  return res.json({
    isUpdating,
    logs: activeUpdateLogs
  });
});

export default router;
