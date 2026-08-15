import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
import { createServer as createViteServer } from 'vite';
import { getDocs, collection, doc, setDoc } from 'firebase/firestore';

import {
  PORT,
  configPath,
  uploadsDir,
  db,
  initFirebaseAndLogs
} from './src/server/config';

import authRoutes from './src/server/routes/authRoutes';
import sheetsRoutes from './src/server/routes/sheetsRoutes';
import geminiRoutes from './src/server/routes/geminiRoutes';
import systemRoutes from './src/server/routes/systemRoutes';
import updaterRoutes from './src/server/routes/updaterRoutes';
import emergencyRecoveryRoute from './src/server/routes/emergencyRecoveryRoute';

const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());
app.use('/uploads', express.static(uploadsDir));

// Mount Modular API Routers
app.use('/api/auth', authRoutes);
app.use('/api/sheets', sheetsRoutes);
app.use('/api/gemini', geminiRoutes);
app.use('/api/system/updater', updaterRoutes);
app.use('/emergency-restore', emergencyRecoveryRoute);
app.use('/api', systemRoutes);

// Fallback for /uploads/* when files are missing on local disk after server restart: fetch from Firebase Storage
app.get('/uploads/*', async (req, res, next) => {
  try {
    const relPath = req.params[0];
    if (!relPath) return res.status(404).send('File not found');

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
          const file = bucket.file(relPath);

          const [exists] = await file.exists();
          if (exists) {
            const [buffer] = await file.download();
            const localFilePath = path.join(uploadsDir, relPath);
            const localSubDir = path.dirname(localFilePath);
            if (!fs.existsSync(localSubDir)) {
              fs.mkdirSync(localSubDir, { recursive: true });
            }
            fs.writeFileSync(localFilePath, buffer);

            const [metadata] = await file.getMetadata();
            if (metadata && metadata.contentType) {
              res.setHeader('Content-Type', metadata.contentType);
            }
            return res.send(buffer);
          }
        }
      } catch (fbErr: any) {
        console.warn('Firebase Storage restore fallback warning:', fbErr.message);
      }
    }

    return res.status(404).send('File not found');
  } catch (err) {
    return next();
  }
});

// PWA Logo and Manifest Endpoints
app.get('/logo.svg', (req, res) => {
  res.setHeader('Content-Type', 'image/svg+xml');
  res.send(`<?xml version="1.0" encoding="utf-8"?>
<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="blueBgGrad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#1e40af" />
      <stop offset="60%" stop-color="#1e3a8a" />
      <stop offset="100%" stop-color="#0f172a" />
    </radialGradient>
    <linearGradient id="goldStarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fde047" />
      <stop offset="40%" stop-color="#eab308" />
      <stop offset="100%" stop-color="#ca8a04" />
    </linearGradient>
    <linearGradient id="swooshGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.95" />
      <stop offset="100%" stop-color="#e2e8f0" stop-opacity="0.8" />
    </linearGradient>
    <filter id="logoShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000" flood-opacity="0.4" />
    </filter>
  </defs>
  <circle cx="200" cy="200" r="190" fill="#dc2626" />
  <circle cx="200" cy="200" r="184" fill="#ffffff" />
  <circle cx="200" cy="200" r="180" fill="#1d4ed8" />
  <circle cx="200" cy="200" r="176" fill="#ffffff" />
  <path id="textPathTop" d="M 70 200 A 130 130 0 0 1 330 200" fill="none" />
  <path id="textPathBottom" d="M 345 200 A 145 145 0 0 1 55 200" fill="none" />
  <text fill="#1e3a8a" font-size="32" font-weight="900" font-family="sans-serif" letter-spacing="4">
    <textPath href="#textPathTop" startOffset="50%" text-anchor="middle">GÜRSU</textPath>
  </text>
  <text fill="#1e3a8a" font-size="24" font-weight="800" font-family="sans-serif" letter-spacing="2">
    <textPath href="#textPathBottom" startOffset="50%" text-anchor="middle">YILDIZ ANADOLU LİSESİ</textPath>
  </text>
  <circle cx="200" cy="200" r="125" fill="#ca8a04" />
  <circle cx="200" cy="200" r="122" fill="#ffffff" />
  <circle cx="200" cy="200" r="118" fill="url(#blueBgGrad)" />
  <path d="M 200 68 L 202 73 L 207 75 L 202 77 L 200 82 L 198 77 L 193 75 L 198 73 Z" fill="#ffffff" opacity="0.9" />
  <path d="M 178 88 L 179 92 L 183 93 L 179 94 L 178 98 L 177 94 L 173 93 L 177 92 Z" fill="#ffffff" opacity="0.8" />
  <path d="M 222 88 L 223 92 L 227 93 L 223 94 L 222 98 L 221 94 L 217 93 L 221 92 Z" fill="#ffffff" opacity="0.8" />
  <path d="M 235 110 L 236 113 L 239 114 L 236 115 L 235 118 L 234 115 L 231 114 L 234 113 Z" fill="#ffffff" opacity="0.7" />
  <path d="M 165 110 L 166 113 L 169 114 L 166 115 L 165 118 L 164 115 L 161 114 L 164 113 Z" fill="#ffffff" opacity="0.7" />
  <polygon points="200,105 224,162 284,162 235,198 254,258 200,222 146,258 165,198 116,162 176,162" fill="url(#goldStarGrad)" filter="url(#logoShadow)" />
  <path d="M 125 120 C 150 180, 240 250, 285 240 C 295 238, 260 215, 200 170 C 160 140, 135 125, 125 120 Z" fill="url(#swooshGrad)" />
  <text x="200" y="292" text-anchor="middle" fill="#ffffff" font-size="24" font-weight="800" font-family="sans-serif" letter-spacing="2">1988</text>
</svg>`);
});

app.get('/manifest.json', (req, res) => {
  res.json({
    short_name: "YKS Takip",
    name: "YKS Takip Sistemi - Yıldız Anadolu Lisesi",
    icons: [
      {
        src: "/logo.svg",
        type: "image/svg+xml",
        sizes: "any",
        purpose: "any"
      },
      {
        src: "/logo.svg",
        type: "image/svg+xml",
        sizes: "192x192 512x512",
        purpose: "maskable"
      }
    ],
    start_url: "/",
    background_color: "#0f172a",
    theme_color: "#4f46e5",
    display: "standalone",
    orientation: "any"
  });
});

async function startServer() {
  setTimeout(async () => {
    try {
      if (db) {
        console.log('Running automatic password migration...');
        const usersSnap = await getDocs(collection(db, 'users'));
        let count = 0;
        for (const docSnap of usersSnap.docs) {
          const u = docSnap.data();
          if (u.password && !u.passwordHash) {
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(u.password, salt);
            await setDoc(doc(db, 'users', docSnap.id), { ...u, passwordHash: hash, password: null });
            count++;
          }
        }
        console.log(`Password migration finished. Migrated ${count} users.`);
      }
    } catch(err) {
      console.error('Password migration error:', err);
    }
  }, 5000);

  initFirebaseAndLogs().catch(err => {
    console.error('Failed to initialize Firebase background job:', err);
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const portNum = Number(PORT) || 3000;
  app.listen(portNum, '0.0.0.0', () => {
    console.log(`YKS Takip Sistemi Sunucusu http://0.0.0.0:${portNum} adresinde çalışıyor`);
  });
}

startServer();
