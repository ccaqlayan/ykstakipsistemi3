const http = require('http');

const payload = JSON.stringify({
  studentName: 'Ahmet Yılmaz',
  targetField: 'SAY',
  targetGoal: 'Hacettepe Tıp Fakültesi (#3.500)',
  weekLabel: '17 Ağu - 23 Ağu',
  weeklyStats: {
    totalSolved: 1250,
    targetSolved: 1500,
    completionRate: 83,
    totalStudyHours: '32.5',
    mistakeCount: 38,
    pekiştirilenHataCount: 22
  },
  subjectBreakdown: [
    { subject: 'TYT Matematik', solved: 400, correct: 360, wrong: 40, accuracy: 90 },
    { subject: 'AYT Fizik', solved: 250, correct: 190, wrong: 60, accuracy: 76 },
    { subject: 'TYT Türkçe', solved: 300, correct: 270, wrong: 30, accuracy: 90 }
  ],
  latestMocks: [
    { title: 'Özdebir TYT-1', date: '2026-08-20', tytNet: 98.5, aytNet: 0, ydtNet: 0 },
    { title: '3D AYT Deneme 1', date: '2026-08-18', tytNet: 0, aytNet: 64.75, ydtNet: 0 }
  ],
  topMistakeTopics: [
    { subject: 'AYT Fizik', topic: 'Elektrostatik & Manyetizma', count: 8 },
    { subject: 'AYT Matematik', topic: 'Trigonometri', count: 5 }
  ],
  userName: 'Ahmet Yılmaz',
  userRole: 'student'
});

const req = http.request(
  {
    hostname: '127.0.0.1',
    port: 3000,
    path: '/api/gemini/generate-weekly-report-card',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    }
  },
  (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    res.on('end', () => {
      console.log('STATUS:', res.statusCode);
      try {
        const json = JSON.parse(data);
        console.log('RESPONSE SUCCESS:', json.success);
        console.log('HEADLINE:', json.data?.headline);
        console.log('RANK BAND:', json.data?.estimatedRankBand);
        console.log('STRENGTHS COUNT:', json.data?.topStrengths?.length);
        console.log('FOCUS AREAS COUNT:', json.data?.criticalFocusAreas?.length);
        console.log('STRATEGIES:', json.data?.goldenActionStrategies);
      } catch (e) {
        console.log('RAW BODY:', data);
      }
    });
  }
);

req.on('error', (err) => {
  console.error('Request failed:', err.message);
});

req.write(payload);
req.end();
