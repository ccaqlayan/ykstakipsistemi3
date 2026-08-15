import express from 'express';
import path from 'path';
import fs from 'fs';
import { listBackups, restoreBackup, createBackup } from '../services/updaterService';

const router = express.Router();

// Master recovery key (can be customized via environment variable)
const RECOVERY_KEY = process.env.ADMIN_RECOVERY_KEY || 'yksadmin2026!';

// Helper: check auth token or header or query parameter
function isAuthorized(req: express.Request): boolean {
  const token = req.headers['x-recovery-key'] || req.cookies?.['emergency_recovery_token'] || req.query?.key;
  return token === RECOVERY_KEY;
}

// 1. Standalone HTML View
router.get('/', (req, res) => {
  const html = `<!DOCTYPE html>
<html lang="tr" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>YKS Takip Sistemi - Acil Durum Kurtarma ve Yedek Yönetimi</title>
  <style>
    :root {
      --bg: #090d16;
      --card-bg: rgba(15, 23, 42, 0.85);
      --border: rgba(255, 255, 255, 0.12);
      --primary: #6366f1;
      --primary-hover: #4f46e5;
      --danger: #ef4444;
      --success: #10b981;
      --amber: #f59e0b;
      --text: #f8fafc;
      --text-muted: #94a3b8;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body {
      background: radial-gradient(circle at 50% 0%, #1e1b4b 0%, var(--bg) 70%);
      color: var(--text);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
    }
    .container {
      width: 100%;
      max-width: 780px;
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 1.5rem;
      padding: 2rem;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(16px);
    }
    .header {
      display: flex;
      align-items: center;
      gap: 1rem;
      border-bottom: 1px solid var(--border);
      padding-bottom: 1.25rem;
      margin-bottom: 1.5rem;
    }
    .header-icon {
      width: 48px;
      height: 48px;
      background: rgba(99, 102, 241, 0.15);
      border: 1px solid rgba(99, 102, 241, 0.3);
      border-radius: 1rem;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
    }
    h1 { font-size: 1.25rem; font-weight: 800; color: #fff; }
    p.subtitle { font-size: 0.82rem; color: var(--text-muted); margin-top: 0.25rem; }
    .alert-box {
      background: rgba(245, 158, 11, 0.1);
      border: 1px solid rgba(245, 158, 11, 0.3);
      border-radius: 0.85rem;
      padding: 0.85rem 1rem;
      font-size: 0.82rem;
      color: #fcd34d;
      margin-bottom: 1.5rem;
      line-height: 1.4;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.65rem 1.25rem;
      border-radius: 0.75rem;
      font-size: 0.82rem;
      font-weight: 700;
      cursor: pointer;
      border: 1px solid transparent;
      transition: all 0.2s ease;
      text-decoration: none;
    }
    .btn-primary { background: var(--primary); color: #fff; }
    .btn-primary:hover { background: var(--primary-hover); transform: translateY(-1px); }
    .btn-danger { background: rgba(239, 68, 68, 0.2); color: #fca5a5; border-color: rgba(239, 68, 68, 0.4); }
    .btn-danger:hover { background: rgba(239, 68, 68, 0.35); }
    .btn-secondary { background: rgba(255, 255, 255, 0.06); color: var(--text-muted); border-color: var(--border); }
    .btn-secondary:hover { background: rgba(255, 255, 255, 0.12); color: #fff; }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    input[type="password"], input[type="text"] {
      width: 100%;
      background: rgba(0, 0, 0, 0.4);
      border: 1px solid var(--border);
      border-radius: 0.75rem;
      padding: 0.75rem 1rem;
      color: #fff;
      font-size: 0.9rem;
      outline: none;
      transition: border-color 0.2s;
    }
    input:focus { border-color: var(--primary); }
    .backup-list { display: flex; flex-direction: column; gap: 0.75rem; max-height: 380px; overflow-y: auto; padding-right: 0.25rem; }
    .backup-card {
      background: rgba(0, 0, 0, 0.35);
      border: 1px solid var(--border);
      border-radius: 1rem;
      padding: 1rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      transition: border-color 0.2s;
    }
    .backup-card:hover { border-color: rgba(99, 102, 241, 0.4); }
    .badge {
      display: inline-block;
      padding: 0.2rem 0.5rem;
      border-radius: 0.4rem;
      font-size: 0.7rem;
      font-weight: 700;
      background: rgba(99, 102, 241, 0.2);
      color: #a5b4fc;
      border: 1px solid rgba(99, 102, 241, 0.3);
    }
    .badge-auto { background: rgba(245, 158, 11, 0.2); color: #fde68a; border-color: rgba(245, 158, 11, 0.3); }
    .terminal-box {
      background: #020617;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 0.85rem;
      padding: 1rem;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 0.78rem;
      color: #38bdf8;
      max-height: 220px;
      overflow-y: auto;
      margin-top: 1rem;
      white-space: pre-wrap;
      display: none;
    }
    .hidden { display: none !important; }
  </style>
</head>
<body>

  <div class="container">
    <div class="header">
      <div class="header-icon">🛡️</div>
      <div>
        <h1>YKS Takip - Bağımsız Acil Durum Kurtarma</h1>
        <p class="subtitle">Ana site açılmadığında veya çökme durumlarında doğrudan yedekten geri yükleme konsolu</p>
      </div>
    </div>

    <!-- 1. LOGIN SECTION -->
    <div id="loginSection">
      <div class="alert-box">
        ⚠️ <strong>Yönetici Doğrulaması Gereklidir:</strong> Bu sayfa sistem dosyalarına doğrudan müdahale eder. Lütfen kurtarma anahtarınızı girin.
      </div>
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        <div>
          <label style="display: block; font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.5rem;">Kurtarma Master Şifresi</label>
          <input type="password" id="recoveryPasswordInput" placeholder="Master kurtarma anahtarını girin..." />
        </div>
        <div style="display: flex; justify-content: flex-end;">
          <button class="btn btn-primary" onclick="login()">Giriş Yap ve Yedekleri Aç</button>
        </div>
        <div id="loginError" style="color: #f87171; font-size: 0.82rem; margin-top: 0.5rem;" class="hidden"></div>
      </div>
    </div>

    <!-- 2. RECOVERY DASHBOARD SECTION -->
    <div id="dashboardSection" class="hidden">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 0.5rem;">
        <div>
          <h2 style="font-size: 1rem; font-weight: 700;">Mevcut Sistem Yedekleri</h2>
          <p style="font-size: 0.75rem; color: var(--text-muted);">Geri dönmek istediğiniz yedeğin yanındaki "Geri Yükle" butonuna tıklayın.</p>
        </div>
        <div style="display: flex; gap: 0.5rem;">
          <button class="btn btn-secondary" onclick="createManualBackup()">+ Şimdi Yedek Al</button>
          <button class="btn btn-secondary" onclick="loadBackups()">🔄 Yenile</button>
        </div>
      </div>

      <div id="backupsList" class="backup-list">
        <p style="text-align: center; color: var(--text-muted); padding: 2rem;">Yedekler yükleniyor...</p>
      </div>

      <div id="terminalBox" class="terminal-box"></div>

      <div style="margin-top: 1.5rem; padding-top: 1.25rem; border-top: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between;">
        <a href="/" target="_blank" class="btn btn-secondary">🌐 Ana Sayfayı Aç (Test Et)</a>
        <button class="btn btn-danger" onclick="logout()">Çıkış Yap</button>
      </div>
    </div>
  </div>

  <script>
    let authToken = localStorage.getItem('recovery_token') || '';

    if (authToken) {
      checkAuthAndLoad();
    }

    async function login() {
      const pwd = document.getElementById('recoveryPasswordInput').value.trim();
      const errEl = document.getElementById('loginError');
      errEl.classList.add('hidden');

      if (!pwd) {
        errEl.innerText = 'Lütfen kurtarma şifresini girin.';
        errEl.classList.remove('hidden');
        return;
      }

      authToken = pwd;
      localStorage.setItem('recovery_token', pwd);
      checkAuthAndLoad();
    }

    function logout() {
      authToken = '';
      localStorage.removeItem('recovery_token');
      document.getElementById('loginSection').classList.remove('hidden');
      document.getElementById('dashboardSection').classList.add('hidden');
      document.getElementById('recoveryPasswordInput').value = '';
    }

    async function checkAuthAndLoad() {
      const errEl = document.getElementById('loginError');
      try {
        const res = await fetch('/emergency-restore/api/backups', {
          headers: { 'x-recovery-key': authToken }
        });
        if (!res.ok) {
          throw new Error('Geçersiz kurtarma anahtarı veya yetkisiz erişim.');
        }
        const data = await res.json();
        document.getElementById('loginSection').classList.add('hidden');
        document.getElementById('dashboardSection').classList.remove('hidden');
        renderBackups(data.backups || []);
      } catch (err) {
        errEl.innerText = err.message;
        errEl.classList.remove('hidden');
        document.getElementById('loginSection').classList.remove('hidden');
        document.getElementById('dashboardSection').classList.add('hidden');
      }
    }

    async function loadBackups() {
      const listEl = document.getElementById('backupsList');
      listEl.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 2rem;">Yedekler yenileniyor...</p>';
      checkAuthAndLoad();
    }

    function renderBackups(backups) {
      const listEl = document.getElementById('backupsList');
      if (!backups || backups.length === 0) {
        listEl.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 2rem;">Henüz kayıtlı sistem yedeği bulunmuyor.</p>';
        return;
      }

      listEl.innerHTML = backups.map(b => {
        const dateStr = new Date(b.createdAt).toLocaleString('tr-TR');
        return \`
          <div class="backup-card">
            <div>
              <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
                <span style="font-weight: 700; font-size: 0.85rem; color: #fff;">\${b.filename}</span>
                <span class="badge \${b.isAuto ? 'badge-auto' : ''}">\${b.isAuto ? 'Otomatik' : 'Manuel'}</span>
                <span class="badge">\${b.version}</span>
              </div>
              <p style="font-size: 0.75rem; color: var(--text-muted);">\${dateStr} • \${b.sizeFormatted}</p>
            </div>
            <div style="display: flex; gap: 0.5rem;">
              <a href="/api/system/updater/download-backup/\${b.filename}" class="btn btn-secondary" style="padding: 0.4rem 0.75rem; font-size: 0.75rem;" download>İndir</a>
              <button onclick="restore('\${b.filename}')" class="btn btn-primary" style="padding: 0.4rem 0.75rem; font-size: 0.75rem; background: #4f46e5;">Bu Yedeğe Dön</button>
            </div>
          </div>
        \`;
      }).join('');
    }

    async function createManualBackup() {
      if (!confirm('Şimdi anlık yeni bir sistem yedeği alınsın mı?')) return;
      logToTerminal('Yeni manuel yedek alınıyor...');
      try {
        const res = await fetch('/emergency-restore/api/backup-now', {
          method: 'POST',
          headers: { 'x-recovery-key': authToken }
        });
        const data = await res.json();
        if (data.success) {
          logToTerminal('✅ Manuel yedek başarıyla oluşturuldu: ' + data.backup.filename);
          loadBackups();
        } else {
          logToTerminal('❌ Hata: ' + data.error);
        }
      } catch (err) {
        logToTerminal('❌ İstek hatası: ' + err.message);
      }
    }

    async function restore(filename) {
      if (!confirm(\`DİKKAT: '\${filename}' yedeği çalışma dizinine geri yüklenecek ve sistem derlenecektir.\\n\\nDevam etmek istediğinize emin misiniz?\`)) {
        return;
      }

      logToTerminal(\`🚨 '\${filename}' yedeği geri yükleniyor, lütfen bekleyin...\`);
      
      try {
        const res = await fetch('/emergency-restore/api/restore', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-recovery-key': authToken
          },
          body: JSON.stringify({ filename })
        });
        const data = await res.json();

        if (data.success) {
          logToTerminal(\`🎉 TEBRİKLER! '\${filename}' başarıyla geri yüklendi ve sistem derlendi.\\nAna sayfayı açıp kontrol edebilirsiniz.\`);
          alert('Yedek başarıyla geri yüklendi! Ana sayfayı yenileyebilirsiniz.');
        } else {
          logToTerminal(\`❌ Geri yükleme hatası: \${data.error}\`);
          alert('Hata: ' + data.error);
        }
      } catch (err) {
        logToTerminal(\`❌ İstek hatası: \${err.message}\`);
        alert('İstek hatası: ' + err.message);
      }
    }

    function logToTerminal(msg) {
      const term = document.getElementById('terminalBox');
      term.style.display = 'block';
      const time = new Date().toLocaleTimeString('tr-TR');
      term.textContent += \`[\${time}] \${msg}\\n\`;
      term.scrollTop = term.scrollHeight;
    }
  </script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.send(html);
});

// 2. Recovery Endpoints
router.get('/api/backups', async (req, res) => {
  if (!isAuthorized(req)) {
    return res.status(401).json({ success: false, error: 'Yetkisiz erişim: Kurtarma anahtarı geçersiz.' });
  }
  const backups = await listBackups();
  return res.json({ success: true, backups });
});

router.post('/api/backup-now', async (req, res) => {
  if (!isAuthorized(req)) {
    return res.status(401).json({ success: false, error: 'Yetkisiz erişim: Kurtarma anahtarı geçersiz.' });
  }
  try {
    const backup = await createBackup('emergency_manual');
    return res.json({ success: true, backup });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/api/restore', async (req, res) => {
  if (!isAuthorized(req)) {
    return res.status(401).json({ success: false, error: 'Yetkisiz erişim: Kurtarma anahtarı geçersiz.' });
  }

  const { filename } = req.body || {};
  if (!filename) {
    return res.status(400).json({ success: false, error: 'Yedek dosya adı belirtilmedi.' });
  }

  try {
    await restoreBackup(filename);
    return res.json({ success: true, message: `'${filename}' yedeği başarıyla geri yüklendi.` });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
