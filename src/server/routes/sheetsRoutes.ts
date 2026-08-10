import { Router } from 'express';
import { google } from 'googleapis';
import { getOAuth2Client } from '../config';

const router = Router();

router.post('/create', async (req, res) => {
  const tokenCookie = req.cookies.g_tokens;
  if (!tokenCookie) {
    return res.status(401).json({ error: 'Google hesabınız henüz bağlı değil.' });
  }

  try {
    const tokens = JSON.parse(tokenCookie);
    const oauth2Client = getOAuth2Client(req);
    oauth2Client.setCredentials(tokens);

    const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

    const response = await sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title: `YKS Takip Sistemi 2026 - ${req.body.studentName || 'Öğrenci Tablosu'}`
        },
        sheets: [
          { properties: { title: 'Çalışma Planı' } },
          { properties: { title: 'Soru Takibi' } },
          { properties: { title: 'Genel Deneme Analizi' } },
          { properties: { title: 'Yanlış Tablosu' } },
          { properties: { title: 'Kaynak ve Çıkmış Sorular' } }
        ]
      }
    });

    const spreadsheetId = response.data.spreadsheetId;
    const spreadsheetUrl = response.data.spreadsheetUrl;

    res.json({
      success: true,
      spreadsheetId,
      spreadsheetUrl
    });
  } catch (err: any) {
    console.error('Error creating sheet:', err);
    res.status(500).json({ error: err.message || 'Google Sheet oluşturulamadı.' });
  }
});

router.post('/sync-to', async (req, res) => {
  const tokenCookie = req.cookies.g_tokens;
  const { spreadsheetId, state } = req.body;

  if (!tokenCookie) {
    return res.status(401).json({ error: 'Google bağlantısı bulunamadı.' });
  }
  if (!spreadsheetId) {
    return res.status(400).json({ error: 'Spreadsheet ID gereklidir.' });
  }

  try {
    const tokens = JSON.parse(tokenCookie);
    const oauth2Client = getOAuth2Client(req);
    oauth2Client.setCredentials(tokens);

    const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

    const studyPlanRows = [
      ['Gün', 'Ders', 'Konu', 'Planlanan (Dk)', 'Tamamlanan (Dk)', 'Durum', 'Notlar'],
      ...(state.studyPlans || []).map((p: any) => [
        p.day, p.subject, p.topic, p.plannedMinutes, p.completedMinutes, p.status, p.notes || ''
      ])
    ];

    const questionLogRows = [
      ['Tarih', 'Sınav Türü', 'Ders', 'Hedef', 'Çözülen', 'Doğru', 'Yanlış', 'Boş', 'Net Score'],
      ...(state.questionLogs || []).map((q: any) => [
        q.date, q.examType, q.subject, q.targetCount, q.solvedCount, q.correctCount, q.wrongCount, q.emptyCount, q.netScore
      ])
    ];

    const mockRows = [
      ['Tarih', 'Deneme Adı / Yayınevi', 'TYT Türkçe', 'TYT Mat', 'TYT Sosyal', 'TYT Fen', 'TYT Toplam Net', 'AYT Mat', 'AYT Fen', 'AYT Toplam Net', 'Tahmini Sıralama'],
      ...(state.generalMocks || []).map((m: any) => [
        m.date, m.title, m.tyt.turkce, m.tyt.mat, m.tyt.sosyal, m.tyt.fen, m.tyt.totalNet, m.ayt.mat, m.ayt.fen, m.ayt.totalNet, m.estimatedRank || ''
      ])
    ];

    const errorRows = [
      ['Tarih', 'Sınav Türü', 'Ders', 'Konu Adı', 'Yayınevi', 'Hata Nedeni', 'Öncelik', 'Tekrar Edildi mi?'],
      ...(state.topicErrors || []).map((e: any) => [
        e.date, e.examType, e.subject, e.topicName, e.publisher || '', e.errorReason, e.priority, e.revised ? 'Evet' : 'Hayır'
      ])
    ];

    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId,
      requestBody: {
        valueInputOption: 'USER_ENTERED',
        data: [
          { range: "'Çalışma Planı'!A1", values: studyPlanRows },
          { range: "'Soru Takibi'!A1", values: questionLogRows },
          { range: "'Genel Deneme Analizi'!A1", values: mockRows },
          { range: "'Yanlış Tablosu'!A1", values: errorRows }
        ]
      }
    });

    res.json({ success: true, syncedAt: new Date().toISOString() });
  } catch (err: any) {
    console.error('Error syncing to sheet:', err);
    res.status(500).json({ error: err.message || 'Veriler Google Sheets\'e aktarılamadı.' });
  }
});

export default router;
