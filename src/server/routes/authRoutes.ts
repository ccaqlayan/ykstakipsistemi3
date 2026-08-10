import { Router } from 'express';
import { google } from 'googleapis';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { collection, getDocs, setDoc, doc } from 'firebase/firestore';
import {
  db,
  getOAuth2Client,
  JWT_SECRET,
  verificationCodes,
  codeRequestTimestamps,
  registrationRequestTimestamps,
  sendEmailHelper
} from '../config';

const router = Router();

// -------------------------------------------------------------
// Google OAuth Endpoints
// -------------------------------------------------------------
router.get('/google/url', (req, res) => {
  try {
    const oauth2Client = getOAuth2Client(req);
    const scopes = [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ];

    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: scopes
    });

    res.json({ url });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to generate auth URL' });
  }
});

router.get('/google/callback', async (req, res) => {
  const code = req.query.code as string;
  if (!code) {
    return res.status(400).send('No authorization code provided.');
  }

  try {
    const oauth2Client = getOAuth2Client(req);
    const { tokens } = await oauth2Client.getToken(code);
    
    res.cookie('g_tokens', JSON.stringify(tokens), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    res.redirect('/?oauth_success=true');
  } catch (err: any) {
    console.error('OAuth callback error:', err);
    res.redirect('/?oauth_error=' + encodeURIComponent(err.message || 'Authentication failed'));
  }
});

router.get('/google/status', async (req, res) => {
  const tokenCookie = req.cookies.g_tokens;
  if (!tokenCookie) {
    return res.json({ isConnected: false });
  }

  try {
    const tokens = JSON.parse(tokenCookie);
    const oauth2Client = getOAuth2Client(req);
    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();

    res.json({
      isConnected: true,
      email: userInfo.data.email,
      name: userInfo.data.name,
      picture: userInfo.data.picture
    });
  } catch (err) {
    res.json({ isConnected: false });
  }
});

router.post('/google/logout', (req, res) => {
  res.clearCookie('g_tokens');
  res.json({ success: true });
});

// -------------------------------------------------------------
// Application Auth Endpoints
// -------------------------------------------------------------
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'E-posta ve şifre gereklidir.' });
  }
  
  try {
    const cleanEmail = email.trim().toLowerCase();
    
    const usersSnap = await getDocs(collection(db, 'users'));
    let targetUser: any = null;
    
    usersSnap.forEach(d => {
      const u = d.data();
      if ((u.email || '').trim().toLowerCase() === cleanEmail) {
        targetUser = { id: d.id, ...u };
      }
    });
    
    if (!targetUser) {
      return res.status(401).json({ success: false, error: 'Bu e-posta adresiyle kayıtlı bir kullanıcı bulunamadı.' });
    }
    
    // Check if account is currently locked or in cooldown/lockout period
    if (targetUser.lockoutUntil) {
      const lockoutTime = new Date(targetUser.lockoutUntil).getTime();
      const now = Date.now();
      if (lockoutTime > now) {
        const remainingSeconds = Math.ceil((lockoutTime - now) / 1000);
        const remainingMinutes = Math.ceil(remainingSeconds / 60);
        return res.status(403).json({ 
          success: false, 
          isLocked: targetUser.isLocked || false,
          lockoutRemainingSeconds: remainingSeconds,
          error: targetUser.isLocked
            ? `Hesabınız 5 kez hatalı giriş nedeniyle kilitlenmiştir (${remainingMinutes} dk kaldı). Şifrenizi sıfırlayabilir veya öğretmeninizle iletişime geçebilirsiniz.`
            : `Hesabınız geçici olarak kilitlidir. Lütfen ${remainingMinutes} dakika sonra tekrar deneyin.`
        });
      }
    }

    if (targetUser.isLocked) {
      return res.status(403).json({
        success: false,
        isLocked: true,
        error: 'Hesabınız kilitlenmiştir. Lütfen şifremi unuttum sayfasından şifrenizi sıfırlayın veya öğretmeninizle iletişime geçin.'
      });
    }
    
    let isValid = false;
    if (targetUser.passwordHash) {
      isValid = await bcrypt.compare(password, targetUser.passwordHash);
    } else if (targetUser.password) {
      isValid = (targetUser.password === password);
    }
    
    if (!isValid) {
      const attempts = (targetUser.failedLoginAttempts || 0) + 1;
      let lockoutMinutes = 0;
      let isNowLocked = false;

      if (attempts === 3) {
        lockoutMinutes = 5;
      } else if (attempts === 4) {
        lockoutMinutes = 10;
      } else if (attempts >= 5) {
        lockoutMinutes = 30;
        isNowLocked = true;
      }

      const lockoutUntil = lockoutMinutes > 0 
        ? new Date(Date.now() + lockoutMinutes * 60 * 1000).toISOString()
        : null;

      const updatedFields = {
        failedLoginAttempts: attempts,
        lockoutUntil,
        isLocked: isNowLocked ? true : (targetUser.isLocked || false)
      };

      await setDoc(doc(db, 'users', targetUser.id), updatedFields, { merge: true });

      let errorMessage = `Hatalı şifre! Lütfen tekrar deneyin. (${attempts}/5)`;
      if (lockoutMinutes > 0) {
        if (isNowLocked) {
          errorMessage = `5 kez hatalı şifre girildi! Hesabınız 30 dakika süreyle kilitlenmiştir.`;
        } else {
          errorMessage = `Hatalı şifre! ${attempts}. kez yanlış girdiniz. Hesabınız ${lockoutMinutes} dakika geçici olarak kilitlendi.`;
        }
      }

      return res.status(401).json({ 
        success: false, 
        failedLoginAttempts: attempts,
        lockoutUntil,
        lockoutRemainingSeconds: lockoutMinutes * 60,
        isLocked: isNowLocked,
        error: errorMessage
      });
    }

    // Login successful -> reset attempts and lockout
    await setDoc(doc(db, 'users', targetUser.id), {
      failedLoginAttempts: 0,
      lockoutUntil: null,
      isLocked: false
    }, { merge: true });
    
    if (targetUser.role === 'student' && targetUser.status === 'pending') {
      return res.status(403).json({ success: false, error: 'Hesabınız henüz öğretmeniniz tarafından onaylanmamıştır.' });
    }
    
    const userToReturn = { 
      ...targetUser,
      failedLoginAttempts: 0,
      lockoutUntil: null,
      isLocked: false
    };
    delete userToReturn.password;
    delete userToReturn.passwordHash;
    
    const token = jwt.sign(
      { uid: targetUser.id, role: targetUser.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.cookie('session_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
    
    res.json({ success: true, user: userToReturn });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: 'Sunucu hatası oluştu.' });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('session_token');
  res.json({ success: true });
});

router.post('/register', async (req, res) => {
  const { id, ...userData } = req.body;
  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(userData.password, salt);
    
    const newUser = { ...userData, passwordHash: hash };
    delete newUser.password;
    
    await setDoc(doc(db, 'users', id), newUser);
    res.json({ success: true, user: newUser });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Kayıt başarısız.' });
  }
});

router.post('/register-limit-check', (req, res) => {
  const ip = (req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || '127.0.0.1').split(',')[0].trim();
  
  const now = Date.now();
  const oneDayAgo = now - 24 * 60 * 60 * 1000;
  
  const previousTimestamps = registrationRequestTimestamps.get(ip) || [];
  const recentTimestamps = previousTimestamps.filter(t => t > oneDayAgo);
  
  if (recentTimestamps.length >= 3) {
    return res.status(429).json({
      success: false,
      error: 'Aynı cihazdan en fazla 3 hesap talebinde bulunabilirsiniz. Fazlası için sınıf rehber öğretmeniniz ile iletişime geçiniz.'
    });
  }
  
  recentTimestamps.push(now);
  registrationRequestTimestamps.set(ip, recentTimestamps);
  
  return res.json({ success: true });
});

router.post('/migrate-passwords', async (req, res) => {
  try {
    const usersSnap = await getDocs(collection(db, 'users'));
    let migratedCount = 0;
    
    for (const userDoc of usersSnap.docs) {
      const u = userDoc.data();
      if (u.password && !u.passwordHash) {
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(u.password, salt);
        
        await setDoc(doc(db, 'users', userDoc.id), {
          ...u,
          passwordHash: hash,
          password: null
        });
        migratedCount++;
      }
    }
    
    res.json({ success: true, message: `${migratedCount} şifre güvenli hash formatına (bcrypt) geçirildi.` });
  } catch (error) {
    console.error('Migration error:', error);
    res.status(500).json({ success: false, error: 'Migration başarısız oldu.' });
  }
});

router.post('/reset-password', async (req, res) => {
  const { email, newPassword } = req.body;
  try {
    const usersSnap = await getDocs(collection(db, 'users'));
    let targetUser: any = null;
    
    usersSnap.forEach(d => {
      const u = d.data();
      if ((u.email || '').trim().toLowerCase() === (email || '').trim().toLowerCase()) {
        targetUser = { id: d.id, ...u };
      }
    });
    
    if (!targetUser) return res.status(404).json({ success: false });
    
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPassword, salt);
    
    await setDoc(doc(db, 'users', targetUser.id), {
      ...targetUser,
      passwordHash: hash,
      password: null,
      failedLoginAttempts: 0,
      lockoutUntil: null,
      isLocked: false
    });
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

router.post('/unlock-user', async (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ success: false, error: 'Kullanıcı ID gereklidir.' });
  }

  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
      failedLoginAttempts: 0,
      lockoutUntil: null,
      isLocked: false
    }, { merge: true });

    res.json({ success: true, message: 'Kullanıcı hesabı ve kilidi başarıyla açıldı.' });
  } catch (err) {
    console.error('Error unlocking user account:', err);
    res.status(500).json({ success: false, error: 'Hesap kilidi açılırken hata oluştu.' });
  }
});

router.post('/send-code', async (req, res) => {
  const { email } = req.body;
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'E-posta adresi gereklidir.' });
  }

  const cleanEmail = email.trim().toLowerCase();

  const now = Date.now();
  const oneDayAgo = now - 24 * 60 * 60 * 1000;
  const previousTimestamps = codeRequestTimestamps.get(cleanEmail) || [];
  const recentTimestamps = previousTimestamps.filter(t => t > oneDayAgo);

  if (recentTimestamps.length >= 3) {
    return res.status(429).json({
      error: 'Güvenliğiniz için günlük şifre sıfırlama onay kodu sınırına (3 kez) ulaştınız. Lütfen sınıf öğretmeninizle iletişime geçin.'
    });
  }

  recentTimestamps.push(now);
  codeRequestTimestamps.set(cleanEmail, recentTimestamps);
  
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = now + 10 * 60 * 1000;

  verificationCodes.set(cleanEmail, { code, expiresAt });

  const emailHtml = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: 0 auto; padding: 25px; border: 1px solid #e0e0e0; border-radius: 16px; background-color: #ffffff; color: #333333;">
      <h2 style="color: #4f46e5; margin-top: 0; font-size: 20px; font-weight: 800; text-align: center; border-bottom: 2px solid #f3f4f6; padding-bottom: 15px;">YKS Takip Sistemi Güvenlik</h2>
      <p style="font-size: 14px; line-height: 1.6; color: #4b5563;">Merhaba,</p>
      <p style="font-size: 14px; line-height: 1.6; color: #4b5563;">Hesabınızın şifresini sıfırlamak için bir talepte bulundunuz. Şifre sıfırlama işlemini tamamlamak için aşağıdaki 6 haneli onay kodunu kullanın:</p>
      
      <div style="margin: 25px 0; padding: 15px; background-color: #f5f3ff; border: 1px solid #ddd6fe; border-radius: 12px; text-align: center;">
        <span style="display: block; font-size: 10px; text-transform: uppercase; letter-spacing: 1.5px; color: #6d28d9; font-weight: bold; margin-bottom: 5px;">Şifre Sıfırlama Onay Kodu</span>
        <strong style="font-size: 32px; font-family: monospace; letter-spacing: 5px; color: #4f46e5; font-weight: 900;">${code}</strong>
      </div>
      
      <p style="font-size: 12px; line-height: 1.6; color: #ef4444; font-weight: 600;">⚠️ Dikkat: Bu kod 10 dakika süreyle geçerlidir. Eğer bu talebi siz yapmadıysanız, lütfen bu e-postayı dikkate almayın ve şifrenizin güvende olduğundan emin olun.</p>
      <hr style="border: 0; border-top: 1px solid #f3f4f6; margin: 20px 0;" />
      <p style="font-size: 11px; text-align: center; color: #9ca3af; margin-bottom: 0;">Bu e-posta otomatik olarak gönderilmiştir. Lütfen yanıtlamayınız.</p>
    </div>
  `;

  const emailResult = await sendEmailHelper(cleanEmail, 'YKS Takip Sistemi - Şifre Sıfırlama Onay Kodu', emailHtml);

  console.log('\n==================================================');
  console.log('[YKS TAKIP GUVENLIK] ŞİFRE SIFIRLAMA TALEBİ');
  console.log(`Kullanıcı E-Posta: ${cleanEmail}`);
  console.log(`Onay Kodu       : ${code}`);
  console.log(`Süre            : 10 Dakika`);
  console.log(`Gönderim Sonucu : ${emailResult.success ? `BAŞARILI (${emailResult.method})` : `BAŞARISIZ (${emailResult.error})`}`);
  if (!emailResult.success) {
    console.log('[GELİŞTİRİCİ NOTU] E-posta servis sağlayıcısı yapılandırılmadığı veya hata verdiği için onay kodunu buradan kopyalayarak tarayıcıda kullanabilirsiniz.');
  }
  console.log('==================================================\n');

  if (emailResult.success) {
    return res.json({ success: true, devMode: false });
  } else {
    return res.json({ 
      success: true, 
      devMode: true,
      info: 'E-posta servisleri bağlı olmadığı için güvenlik kodu sunucu konsoluna yazdırıldı.' 
    });
  }
});

router.post('/verify-code', (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) {
    return res.status(400).json({ error: 'E-posta adresi ve onay kodu gereklidir.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const record = verificationCodes.get(cleanEmail);

  if (!record) {
    return res.status(400).json({ error: 'Bu e-posta adresi için aktif bir onay kodu bulunmuyor. Lütfen tekrar kod talep edin.' });
  }

  if (Date.now() > record.expiresAt) {
    verificationCodes.delete(cleanEmail);
    return res.status(400).json({ error: 'Onay kodunun süresi dolmuş (10 dakika). Lütfen yeni bir kod talep edin.' });
  }

  if (record.code !== code.trim()) {
    return res.status(400).json({ error: 'Girdiğiniz onay kodu yanlış! Lütfen tekrar kontrol edin.' });
  }

  verificationCodes.delete(cleanEmail);
  return res.json({ success: true });
});

export default router;
