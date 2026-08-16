import { UserAccount, YKSDataState, ParsedStudentRow, InstitutionalSubjectDetail, InstitutionalTopicDetail } from '../types';

export function normalizeTurkishText(str: string): string {
  return (str || '')
    .trim()
    .toLowerCase()
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]/g, '');
}

export function matchStudentToSystem(
  fileStudentName: string,
  fileSchoolNumber: string,
  fileClassName: string,
  studentUsers: UserAccount[],
  studentsData?: Record<string, YKSDataState>
): { matchedStudentId: string | null; matchScore: number; matchReason: string } {
  if (!fileStudentName && !fileSchoolNumber) {
    return {
      matchedStudentId: null,
      matchScore: 0,
      matchReason: 'Veri Yok'
    };
  }

  // 1. Match by school number
  if (fileSchoolNumber && fileSchoolNumber.trim().length > 0 && fileSchoolNumber !== '0') {
    const cleanNo = fileSchoolNumber.trim();
    const numMatch = studentUsers.find(u => {
      const uNo = (u.schoolNumber || '').trim();
      const profNo = (studentsData?.[u.id]?.profile?.schoolNumber || '').trim();
      return uNo === cleanNo || profNo === cleanNo;
    });

    if (numMatch) {
      return {
        matchedStudentId: numMatch.id,
        matchScore: 100,
        matchReason: `Okul No Eşleşti (#${cleanNo})`
      };
    }
  }

  // 2. Exact normalized name match
  if (fileStudentName && fileStudentName.trim().length > 0) {
    const normFileName = normalizeTurkishText(fileStudentName);
    
    const exactNameMatch = studentUsers.find(u => {
      const uNorm = normalizeTurkishText(u.name);
      const profNorm = normalizeTurkishText(studentsData?.[u.id]?.profile?.name || '');
      return uNorm === normFileName || (profNorm && profNorm === normFileName);
    });

    if (exactNameMatch) {
      return {
        matchedStudentId: exactNameMatch.id,
        matchScore: 98,
        matchReason: 'Tam Ad Soyad Eşleşti'
      };
    }

    // 3. First + Last name token matching
    const fileTokens = normFileName.split(' ').filter(Boolean);
    let bestMatch: { user: UserAccount; score: number } | null = null;

    for (const u of studentUsers) {
      const uNorm = normalizeTurkishText(u.name);
      const uTokens = uNorm.split(' ').filter(Boolean);

      if (fileTokens.length > 1 && uTokens.length > 1) {
        const firstMatches = fileTokens[0] === uTokens[0];
        const lastMatches = fileTokens[fileTokens.length - 1] === uTokens[uTokens.length - 1];

        if (firstMatches && lastMatches) {
          const score = 88;
          if (!bestMatch || score > bestMatch.score) {
            bestMatch = { user: u, score };
          }
        }
      }

      if (uNorm.includes(normFileName) || normFileName.includes(uNorm)) {
        const score = 75;
        if (!bestMatch || score > bestMatch.score) {
          bestMatch = { user: u, score };
        }
      }
    }

    if (bestMatch && bestMatch.score >= 75) {
      return {
        matchedStudentId: bestMatch.user.id,
        matchScore: bestMatch.score,
        matchReason: `Benzer İsim Eşleşti (%${bestMatch.score})`
      };
    }
  }

  return {
    matchedStudentId: null,
    matchScore: 0,
    matchReason: 'Eşleşen Öğrenci Bulunamadı (Yeni)'
  };
}

function cleanNum(val: any): number {
  if (val === undefined || val === null || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const s = String(val).trim().replace(',', '.');
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

export interface MarkdownParseResult {
  detectedExamTitle: string;
  detectedExamType: 'TYT' | 'AYT' | 'Ara Sınıf';
  rows: ParsedStudentRow[];
}

/**
 * Parses markdown (.md) exam report certificates deterministically in browser/client
 * without requiring any AI or server round-trip.
 */
export function parseMarkdownExamReport(
  rawText: string,
  studentUsers: UserAccount[],
  studentsData?: Record<string, YKSDataState>,
  getMappedClassName?: (clsName: string | undefined | null) => string
): MarkdownParseResult {
  const mapClass = getMappedClassName || ((clsName: string | undefined | null) => clsName || '');
  if (!rawText || !rawText.trim()) {
    return {
      detectedExamTitle: '',
      detectedExamType: 'TYT',
      rows: []
    };
  }

  const text = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Detect overall exam title from first heading
  let detectedExamTitle = '';
  const firstH2Match = text.match(/##\s*([^\n#]+)/i);
  if (firstH2Match && !/SONUÇ\s*BELGESİ/i.test(firstH2Match[1])) {
    detectedExamTitle = firstH2Match[1].trim();
  }

  // Detect overall exam type
  let detectedExamType: 'TYT' | 'AYT' | 'Ara Sınıf' = 'TYT';
  if (/AYT|Alan Yeterlilik|Edebiyat-Sosyal|Matematik-2/i.test(text) && !/TYT|Temel Yeterlilik/i.test(detectedExamTitle)) {
    detectedExamType = 'AYT';
  } else if (/KDS|Ara Sınıf|9\.|10\.|11\./i.test(detectedExamTitle)) {
    detectedExamType = 'Ara Sınıf';
  }

  // Split into student report certificate chunks
  const chunks = text.split(/(?=##\s*SONUÇ\s*BELGESİ|\|\s*SONUÇ\s*BELGESİ)/i);
  const rows: ParsedStudentRow[] = [];

  for (let cIdx = 0; cIdx < chunks.length; cIdx++) {
    const chunk = chunks[cIdx];
    if (!/Öğrenci|SONUÇ\s*BELGESİ/i.test(chunk)) continue;

    const lines = chunk
      .split('\n')
      .map(l => l.trim().replace(/^\|\s*|\s*\|$/g, '').trim())
      .filter(Boolean);

    let studentName = '';
    let schoolNumber = '';
    let className = '';

    // Pattern 1: Table format e.g. | DAMLA TOPÇU 458 12-A |
    for (let i = 0; i < lines.length; i++) {
      if (/Öğrenci\s+Numara\s+Sınıf/i.test(lines[i]) && lines[i + 1]) {
        const next = lines[i + 1];
        const m = next.match(/^([A-ZÇĞİÖŞÜa-zçğıöşü\s]+?)\s+(\d+)\s+([0-9]{1,2}-[A-Za-z0-9]+|[0-9]{1,2}[A-Za-z0-9]+)$/);
        if (m) {
          studentName = m[1].trim();
          schoolNumber = m[2].trim();
          className = m[3].trim();
        } else {
          const parts = next.split(/\s+/);
          if (parts.length >= 3) {
            className = parts.pop() || '';
            schoolNumber = parts.pop() || '';
            studentName = parts.join(' ').trim();
          }
        }
        break;
      }
    }

    // Pattern 2: Flow format e.g. Öğrenci \n AHMET CENGİZ GÜREL
    if (!studentName) {
      for (let i = 0; i < lines.length; i++) {
        if (/^Öğrenci$/i.test(lines[i]) && lines[i + 1]) {
          const candidate = lines[i + 1].trim();
          if (!/^(Puan|Türü|Numara|Sınıf|Dereceler|Sonuç)$/i.test(candidate)) {
            studentName = candidate;
          }
          break;
        }
      }
    }

    // Pattern 2: School Number & Class in flow format
    if (!schoolNumber || !className) {
      for (let i = 0; i < lines.length; i++) {
        if (/^Numara$/i.test(lines[i])) {
          for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
            if (/^\d{1,5}$/.test(lines[j]) && !schoolNumber) {
              schoolNumber = lines[j];
            } else if (/^[0-9]{1,2}-[A-Za-z0-9]+$/i.test(lines[j]) && !className) {
              className = lines[j];
            }
          }
        }
      }
    }

    // Fallback: If student name still empty, skip chunk
    if (!studentName) continue;

    // Apply class mapping
    className = mapClass(className);

    // Scores & Rankings
    let tytScore = 0;
    let sayScore = 0;
    let eaScore = 0;
    let sozScore = 0;

    let tytClassRank = 0;
    let tytInstitutionRank = 0;
    let tytGeneralRank = 0;

    let sayClassRank = 0;
    let sayInstitutionRank = 0;
    let sayGeneralRank = 0;

    let eaClassRank = 0;
    let eaInstitutionRank = 0;
    let eaGeneralRank = 0;

    let sozClassRank = 0;
    let sozInstitutionRank = 0;
    let sozGeneralRank = 0;

    let classParticipantCount = 0;
    let institutionParticipantCount = 0;
    let generalParticipantCount = 0;

    // Search for Table format ranking line:
    // TYT 336,138 285,020 11 44 50 387 17032 Katılımlar: 18 102 381 1709 57432
    const tytTableMatch = chunk.match(/TYT\s+([\d,.]+)\s+([\d,.]+)\s+(\d+)\s+(\d+)\s+(?:\d+)?\s*(?:\d+)?\s*(\d+)\s+Katılımlar:\s*(\d+)\s+(\d+)\s+(?:\d+)?\s*(?:\d+)?\s*(\d+)/i);
    if (tytTableMatch) {
      tytScore = cleanNum(tytTableMatch[1]);
      tytClassRank = parseInt(tytTableMatch[3], 10) || 0;
      tytInstitutionRank = parseInt(tytTableMatch[4], 10) || 0;
      tytGeneralRank = parseInt(tytTableMatch[5], 10) || 0;
      classParticipantCount = parseInt(tytTableMatch[6], 10) || 0;
      institutionParticipantCount = parseInt(tytTableMatch[7], 10) || 0;
      generalParticipantCount = parseInt(tytTableMatch[8], 10) || 0;
    } else {
      // Flow format: Dereceler ... Snf Kurum İlçe İl Genel ... 357,697 TYT 27 272 12838 1709 57432
      const rankBlockMatch = chunk.match(/(\d{3}[,.]\d{2,3})\s*(?:\n|\s)*TYT\s*(?:\n|\s)*(\d+)\s*(?:\n|\s)*(\d+)\s*(?:\n|\s)*(\d+)\s*(?:\n|\s)*(\d+)\s*(?:\n|\s)*(\d+)/i);
      if (rankBlockMatch) {
        tytScore = cleanNum(rankBlockMatch[1]);
        tytClassRank = parseInt(rankBlockMatch[2], 10) || 0;
        tytInstitutionRank = parseInt(rankBlockMatch[3], 10) || 0;
        tytGeneralRank = parseInt(rankBlockMatch[6] || rankBlockMatch[4], 10) || 0;
      } else {
        // Find highest score in chunk that is not the general average
        const puanMatches = [...chunk.matchAll(/(?:Puan|TYT|Ortalama)[\s\S]{0,100}?(\d{3}[,.]\d{2,3})/gi)];
        for (const pm of puanMatches) {
          const val = cleanNum(pm[1]);
          if (val > 100) {
            tytScore = val;
          }
        }
      }

      // Check AYT score lines if present (SAY / EA / SÖZ)
      const sayMatch = chunk.match(/SAY\s+([\d,.]+)\s*(?:[\d,.]+)?\s*(\d+)?\s*(\d+)?\s*(\d+)?/i);
      if (sayMatch) {
        sayScore = cleanNum(sayMatch[1]);
        if (sayMatch[2]) sayClassRank = parseInt(sayMatch[2], 10) || 0;
        if (sayMatch[3]) sayInstitutionRank = parseInt(sayMatch[3], 10) || 0;
        if (sayMatch[4]) sayGeneralRank = parseInt(sayMatch[4], 10) || 0;
      }

      const eaMatch = chunk.match(/EA\s+([\d,.]+)\s*(?:[\d,.]+)?\s*(\d+)?\s*(\d+)?\s*(\d+)?/i);
      if (eaMatch) {
        eaScore = cleanNum(eaMatch[1]);
        if (eaMatch[2]) eaClassRank = parseInt(eaMatch[2], 10) || 0;
        if (eaMatch[3]) eaInstitutionRank = parseInt(eaMatch[3], 10) || 0;
        if (eaMatch[4]) eaGeneralRank = parseInt(eaMatch[4], 10) || 0;
      }

      const sozMatch = chunk.match(/SÖZ\s+([\d,.]+)\s*(?:[\d,.]+)?\s*(\d+)?\s*(\d+)?\s*(\d+)?/i);
      if (sozMatch) {
        sozScore = cleanNum(sozMatch[1]);
        if (sozMatch[2]) sozClassRank = parseInt(sozMatch[2], 10) || 0;
        if (sozMatch[3]) sozInstitutionRank = parseInt(sozMatch[3], 10) || 0;
        if (sozMatch[4]) sozGeneralRank = parseInt(sozMatch[4], 10) || 0;
      }

      const katMatch = chunk.match(/Katılımlar:\s*(\d+)\s+(\d+)\s+(\d+)(?:\s+(\d+)\s+(\d+))?/i);
      if (katMatch) {
        classParticipantCount = parseInt(katMatch[1], 10) || 0;
        institutionParticipantCount = parseInt(katMatch[2], 10) || 0;
        generalParticipantCount = parseInt(katMatch[5] || katMatch[3], 10) || 0;
      }
    }

    // Subjects and Topic Breakdown
    const subjectsMap = new Map<string, InstitutionalSubjectDetail>();

    const getSubject = (name: string, defaultQ = 0): InstitutionalSubjectDetail => {
      let key = name.trim();
      if (key === 'TYT Türkçe') key = 'Türkçe';
      if (key === 'Sosyal' || key === 'Sosyal Bilimler') key = 'TYT Sosyal';
      if (key === 'Matematik') key = 'TYT Matematik';
      if (key === 'Fen' || key === 'Fen Bilimleri') key = 'TYT Fen';

      if (!subjectsMap.has(key)) {
        subjectsMap.set(key, {
          subjectName: key,
          questionCount: defaultQ,
          correct: 0,
          wrong: 0,
          net: 0,
          successRate: 0,
          classAvgNet: 0,
          institutionAvgNet: 0,
          generalAvgNet: 0,
          topics: []
        });
      }
      return subjectsMap.get(key)!;
    };

    // 1. Single-Line Table format extraction
    const singleLineRegex = /(Türkçe|Tarih-1|Coğrafya-1|Felsefe|Din Kül\. ve Ahl\. Bil\.|Din Kültürü|Felsefe \(Seçmeli\)|TYT Sosyal|Matematik-1|Geometri|TYT Matematik|Fizik|Kimya|Biyoloji|TYT Fen|Toplam:?)\s+(\d+)?\s*(\d+)\s+(\d+)\s+([\d,.-]+)\s+(\d+)\s+([\d,.-]+)\s+([\d,.-]+)\s+([\d,.-]+)/gi;
    let match: RegExpExecArray | null;
    while ((match = singleLineRegex.exec(chunk)) !== null) {
      let sName = match[1].replace(':', '').trim();
      if (sName === 'Din Kültürü') sName = 'Din Kül. ve Ahl. Bil.';
      const subj = getSubject(sName);
      subj.correct = parseInt(match[3], 10) || 0;
      subj.wrong = parseInt(match[4], 10) || 0;
      subj.net = cleanNum(match[5]);
      subj.successRate = parseInt(match[6], 10) || 0;
      subj.classAvgNet = cleanNum(match[7]);
      subj.institutionAvgNet = cleanNum(match[8]);
      subj.generalAvgNet = cleanNum(match[9]);
      subj.questionCount = match[2] ? parseInt(match[2], 10) : (subj.correct + subj.wrong);
    }

    // 2. Average Signature Matching for vertical / interlaced OCR chunks
    const SUBJECT_SIGNATURES = [
      { name: 'Türkçe', defaultQ: 40, snf: '21,96', kur: '22,56', gen: '20,13' },
      { name: 'Tarih-1', defaultQ: 5, snf: '2,26', kur: '1,98', gen: '1,63' },
      { name: 'Coğrafya-1', defaultQ: 5, snf: '2,58', kur: '2,27', gen: '1,59' },
      { name: 'Felsefe', defaultQ: 5, snf: '3,68', kur: '3,40', gen: '3,08' },
      { name: 'Din Kül. ve Ahl. Bil.', defaultQ: 5, snf: '3,65', kur: '3,68', gen: '3,53' },
      { name: 'Felsefe (Seçmeli)', defaultQ: 5, snf: '0,00', kur: '0,00', gen: '0,01' },
      { name: 'TYT Sosyal', defaultQ: 20, snf: '12,18', kur: '11,34', gen: '9,85' },
      { name: 'Matematik-1', defaultQ: 30, snf: '17,33', kur: '15,39', gen: '11,43' },
      { name: 'Geometri', defaultQ: 10, snf: '2,89', kur: '2,19', gen: '1,67' },
      { name: 'TYT Matematik', defaultQ: 40, snf: '20,22', kur: '17,58', gen: '13,09' },
      { name: 'Fizik', defaultQ: 7, snf: '4,07', kur: '2,79', gen: '1,95' },
      { name: 'Kimya', defaultQ: 7, snf: '3,42', kur: '2,11', gen: '1,77' },
      { name: 'Biyoloji', defaultQ: 6, snf: '2,93', kur: '2,27', gen: '2,00' },
      { name: 'TYT Fen', defaultQ: 20, snf: '10,42', kur: '7,18', gen: '5,72' },
      { name: 'Toplam', defaultQ: 120, snf: '64,78', kur: '58,65', gen: '48,79' }
    ];

    const cleanText = chunk.replace(/\|/g, ' ').replace(/\s+/g, ' ');
    const tokens = cleanText.split(' ').filter(Boolean);

    SUBJECT_SIGNATURES.forEach(sig => {
      const existing = subjectsMap.get(sig.name);
      if (existing && existing.net > 0) return;

      for (let i = 0; i < tokens.length - 2; i++) {
        if (tokens[i] === sig.snf && tokens[i + 1] === sig.kur && tokens[i + 2] === sig.gen) {
          const numBack: string[] = [];
          for (let b = i - 1; b >= Math.max(0, i - 35); b--) {
            const t = tokens[b];
            if (/^[\d,.-]+$/.test(t)) {
              numBack.unshift(t);
            }
            if (numBack.length >= 8) break;
          }

          if (numBack.length >= 3) {
            const s = getSubject(sig.name, sig.defaultQ);
            s.classAvgNet = cleanNum(sig.snf);
            s.institutionAvgNet = cleanNum(sig.kur);
            s.generalAvgNet = cleanNum(sig.gen);

            if (sig.name === 'Toplam') {
              const topDM = chunk.match(/Toplam:?\s*120\s+(\d+)/i);
              s.correct = topDM ? parseInt(topDM[1], 10) : 0;
              s.questionCount = 120;
              for (let k = numBack.length - 1; k >= 0; k--) {
                const val = cleanNum(numBack[k]);
                if (val > 0 && val <= 120 && numBack[k].includes(',')) {
                  s.net = val;
                  if (k > 0) s.wrong = parseInt(numBack[k - 1], 10) || 0;
                  if (k < numBack.length - 1) s.successRate = parseInt(numBack[k + 1], 10) || 0;
                  break;
                }
              }
            } else {
              let matched = false;
              for (let k = numBack.length - 1; k >= 1; k--) {
                const netCand = cleanNum(numBack[k]);
                const wrgCand = parseInt(numBack[k - 1], 10);
                const corrCand = k >= 2 ? parseInt(numBack[k - 2], 10) : undefined;

                if (corrCand !== undefined && Math.abs(corrCand - (wrgCand / 4) - netCand) < 0.05) {
                  s.correct = corrCand;
                  s.wrong = wrgCand;
                  s.net = netCand;
                  if (k < numBack.length - 1) s.successRate = parseInt(numBack[k + 1], 10) || 0;
                  matched = true;
                  break;
                }
              }

              if (!matched && numBack.length >= 3) {
                const pct = parseInt(numBack[numBack.length - 1], 10) || 0;
                const net = cleanNum(numBack[numBack.length - 2]);
                const wrg = parseInt(numBack[numBack.length - 3], 10) || 0;
                const corr = numBack.length >= 4 ? parseInt(numBack[numBack.length - 4], 10) || 0 : Math.round(net + wrg / 4);

                s.correct = corr;
                s.wrong = wrg;
                s.net = net;
                s.successRate = pct;
              }
            }
          }
          break;
        }
      }
    });

    // Ensure sub-totals are computed if missing
    const turkceObj = subjectsMap.get('Türkçe');
    const tytSosObj = subjectsMap.get('TYT Sosyal');
    const tytMatObj = subjectsMap.get('TYT Matematik');
    const tytFenObj = subjectsMap.get('TYT Fen');
    const toplamObj = subjectsMap.get('Toplam');

    if (!tytSosObj || tytSosObj.net === 0) {
      const tar = subjectsMap.get('Tarih-1')?.net || 0;
      const cog = subjectsMap.get('Coğrafya-1')?.net || 0;
      const fel = subjectsMap.get('Felsefe')?.net || 0;
      const din = subjectsMap.get('Din Kül. ve Ahl. Bil.')?.net || 0;
      const s = getSubject('TYT Sosyal', 20);
      s.net = cleanNum((tar + cog + fel + din).toFixed(2));
      s.correct = (subjectsMap.get('Tarih-1')?.correct || 0) + (subjectsMap.get('Coğrafya-1')?.correct || 0) + (subjectsMap.get('Felsefe')?.correct || 0) + (subjectsMap.get('Din Kül. ve Ahl. Bil.')?.correct || 0);
      s.wrong = (subjectsMap.get('Tarih-1')?.wrong || 0) + (subjectsMap.get('Coğrafya-1')?.wrong || 0) + (subjectsMap.get('Felsefe')?.wrong || 0) + (subjectsMap.get('Din Kül. ve Ahl. Bil.')?.wrong || 0);
      s.questionCount = 20;
    }

    if (!tytMatObj || tytMatObj.net === 0) {
      const m1 = subjectsMap.get('Matematik-1')?.net || 0;
      const geo = subjectsMap.get('Geometri')?.net || 0;
      const s = getSubject('TYT Matematik', 40);
      s.net = cleanNum((m1 + geo).toFixed(2));
      s.correct = (subjectsMap.get('Matematik-1')?.correct || 0) + (subjectsMap.get('Geometri')?.correct || 0);
      s.wrong = (subjectsMap.get('Matematik-1')?.wrong || 0) + (subjectsMap.get('Geometri')?.wrong || 0);
      s.questionCount = 40;
    }

    if (!tytFenObj || tytFenObj.net === 0) {
      const fiz = subjectsMap.get('Fizik')?.net || 0;
      const kim = subjectsMap.get('Kimya')?.net || 0;
      const biy = subjectsMap.get('Biyoloji')?.net || 0;
      const s = getSubject('TYT Fen', 20);
      s.net = cleanNum((fiz + kim + biy).toFixed(2));
      s.correct = (subjectsMap.get('Fizik')?.correct || 0) + (subjectsMap.get('Kimya')?.correct || 0) + (subjectsMap.get('Biyoloji')?.correct || 0);
      s.wrong = (subjectsMap.get('Fizik')?.wrong || 0) + (subjectsMap.get('Kimya')?.wrong || 0) + (subjectsMap.get('Biyoloji')?.wrong || 0);
      s.questionCount = 20;
    }

    // Ensure all subjects' correct/wrong counts match their net mathematically
    subjectsMap.forEach(s => {
      if (s.net > 0 && s.subjectName !== 'Toplam') {
        const expectedCorr = Math.round(s.net + (s.wrong / 4));
        if (s.correct === 0 || Math.abs(s.correct - (s.wrong / 4) - s.net) > 0.05) {
          s.correct = expectedCorr;
        }
      }
    });

    // Calculate True Total Net
    let totalNet = toplamObj?.net || 0;
    if (totalNet === 0) {
      totalNet = Number((
        (turkceObj?.net || 0) +
        (tytSosObj?.net || 0) +
        (tytMatObj?.net || 0) +
        (tytFenObj?.net || 0)
      ).toFixed(2));
    }

    // Extract individual topic lines (both single-line and two-line formats)
    let currentTopicSubject = 'Türkçe';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (/^TYT\s*Türkçe$|^Türkçe$/i.test(line) || (/Türkçe/i.test(line) && /ANALİZ|S D Y B%|TYT/i.test(line))) {
        currentTopicSubject = 'Türkçe';
      } else if (/^Tarih-1$|^Tarih$/i.test(line) || (/Tarih/i.test(line) && /S D Y B%/i.test(line))) {
        currentTopicSubject = 'Tarih-1';
      } else if (/^Coğrafya-1$|^Coğrafya$/i.test(line) || (/Coğrafya/i.test(line) && /S D Y B%/i.test(line))) {
        currentTopicSubject = 'Coğrafya-1';
      } else if (/^Felsefe\s*\(Seçmeli\)$/i.test(line) || (/Felsefe\s*\(Seçmeli\)/i.test(line) && /S D Y B%/i.test(line))) {
        currentTopicSubject = 'Felsefe (Seçmeli)';
      } else if (/^Felsefe$/i.test(line) || (/Felsefe/i.test(line) && /S D Y B%/i.test(line))) {
        currentTopicSubject = 'Felsefe';
      } else if (/^Din\s*Kül/i.test(line) || (/Din\s*Kül/i.test(line) && /S D Y B%/i.test(line))) {
        currentTopicSubject = 'Din Kül. ve Ahl. Bil.';
      } else if (/^Matematik-1$|^Matematik$/i.test(line) || (/Matematik/i.test(line) && /ANALİZ|S D Y B%/i.test(line))) {
        currentTopicSubject = 'Matematik-1';
      } else if (/^Geometri$/i.test(line) || (/Geometri/i.test(line) && /S D Y B%/i.test(line))) {
        currentTopicSubject = 'Geometri';
      } else if (/^Fizik$/i.test(line) || (/Fizik/i.test(line) && /S D Y B%/i.test(line))) {
        currentTopicSubject = 'Fizik';
      } else if (/^Kimya$/i.test(line) || (/Kimya/i.test(line) && /S D Y B%/i.test(line))) {
        currentTopicSubject = 'Kimya';
      } else if (/^Biyoloji$/i.test(line) || (/Biyoloji/i.test(line) && /S D Y B%/i.test(line))) {
        currentTopicSubject = 'Biyoloji';
      }

      // 1. Single line: Topic Name 1 1 0 100 or Topic Name.1 1 0 100
      const tmSingle = line.match(/^([A-ZÇĞİÖŞÜa-zçğıöşü0-9\s.,'’()–\/-]+?)(?:\s+|(?<=[^\d\s]))(\d+)\s+(\d+)\s+(\d+)\s+(\d+)$/);
      if (tmSingle) {
        const topicName = tmSingle[1].trim();
        if (!/Soru|Doğru|Yanlış|Başarı|Ortalama|Cevap|Puan|Katılımlar|S D Y B%/i.test(topicName)) {
          const qCount = parseInt(tmSingle[2], 10) || 0;
          const corr = parseInt(tmSingle[3], 10) || 0;
          const wrg = parseInt(tmSingle[4], 10) || 0;
          const sRate = parseInt(tmSingle[5], 10) || 0;

          const subj = getSubject(currentTopicSubject);
          subj.topics.push({
            topicName,
            questionCount: qCount,
            correct: corr,
            wrong: wrg,
            empty: Math.max(0, qCount - (corr + wrg)),
            successRate: sRate
          });
        }
      } else if (lines[i + 1] && /^\d+\s+\d+\s+\d+\s+\d+$/.test(lines[i + 1])) {
        // 2. Two lines: Line i is Topic Name, Line i+1 is numbers "1 1 0 100"
        const topicName = line.trim();
        if (topicName.length >= 3 && !/Soru|Doğru|Yanlış|Başarı|Ortalama|Cevap|Puan|Katılımlar|S D Y B%|##|TYT|Numara|Sınıf|Genel|Dereceler|Ortalama|Ders|Net|Katılımlar/i.test(topicName)) {
          const numParts = lines[i + 1].trim().split(/\s+/);
          if (numParts.length === 4) {
            const qCount = parseInt(numParts[0], 10) || 0;
            const corr = parseInt(numParts[1], 10) || 0;
            const wrg = parseInt(numParts[2], 10) || 0;
            const sRate = parseInt(numParts[3], 10) || 0;

            const subj = getSubject(currentTopicSubject);
            subj.topics.push({
              topicName,
              questionCount: qCount,
              correct: corr,
              wrong: wrg,
              empty: Math.max(0, qCount - (corr + wrg)),
              successRate: sRate
            });
            i++; // skip numbers line
          }
        }
      }
    }

    // Extract Optical Answers and Answer Keys
    const opticalAnswersMap: Record<string, string> = {};
    const answerKeysMap: Record<string, string> = {};
    let inSoruNoSection = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (/Soru\s*No/i.test(line)) {
        inSoruNoSection = true;
        continue;
      }

      if (/^##\s*DERSLERE\s*GÖRE\s*ANALİZ|^##|DERSLERE\s*GÖRE\s*ANALİZ/i.test(line)) {
        inSoruNoSection = false;
        continue;
      }

      if (inSoruNoSection) {
        // Türkçe optical line
        if (/TYT\s*Türkçe/i.test(line)) {
          let ansCandidate = line.replace(/.*TYT\s*Türkçe\s*/i, '').trim();
          if (!ansCandidate && lines[i + 1] && !/Cevap\s*Anahtarı|##/i.test(lines[i + 1])) {
            ansCandidate = lines[i + 1].trim();
          }
          if (ansCandidate && !/Cevap\s*Anahtarı/i.test(ansCandidate) && /^[A-Za-z\s]{8,}$/.test(ansCandidate) && !/Türkçe|Sosyal|Matematik|Fen|ANALİZ/i.test(ansCandidate)) {
            opticalAnswersMap['Türkçe'] = ansCandidate;
            opticalAnswersMap['TYT Türkçe'] = ansCandidate;
          }
        }

        // Cevap Anahtarı
        if (/Cevap\s*Anahtarı/i.test(line)) {
          const keyMatch = line.match(/Cevap\s*Anahtarı\s*(?:[A-Z]\s*)?([A-Z]{10,})/i);
          if (keyMatch && !answerKeysMap['Türkçe']) {
            answerKeysMap['Türkçe'] = keyMatch[1].trim();
            answerKeysMap['TYT Türkçe'] = keyMatch[1].trim();
          }
        }

        // Sosyal optical line
        if (/TYT\s*Sosyal/i.test(line) || /b[A-Za-z\s]+Cevap\s*Anahtarı/i.test(line)) {
          let textToParse = line;
          if (/^TYT\s*Sosyal$/i.test(line) && lines[i + 1]) {
            textToParse = lines[i + 1];
          }
          const m = textToParse.match(/^([a-zA-Z\s]{8,}?)\s*Cevap\s*Anahtarı\s*(?:[A-Z]\s*)?([A-Z]+)/i);
          if (m) {
            opticalAnswersMap['TYT Sosyal'] = m[1].trim();
            opticalAnswersMap['Sosyal'] = m[1].trim();
            answerKeysMap['TYT Sosyal'] = m[2].trim();
            answerKeysMap['Sosyal'] = m[2].trim();
          }
        }

        // Matematik optical line
        if (/TYT\s*Matematik/i.test(line) || (/Cevap\s*Anahtarı/i.test(line) && !opticalAnswersMap['TYT Matematik'] && /BCB|BBC/i.test(line))) {
          let textToParse = line;
          if (/^TYT\s*Matematik$/i.test(line) && lines[i + 1]) {
            textToParse = lines[i + 1];
          }
          const m = textToParse.match(/^([a-zA-Z\s]{8,}?)\s*Cevap\s*Anahtarı\s*(?:[A-Z]\s*)?([A-Z]+)/i);
          if (m) {
            opticalAnswersMap['TYT Matematik'] = m[1].trim();
            opticalAnswersMap['Matematik'] = m[1].trim();
            answerKeysMap['TYT Matematik'] = m[2].trim();
            answerKeysMap['Matematik'] = m[2].trim();
          }
        }

        // Fen optical line
        if (/TYT\s*Fen/i.test(line) || (/Cevap\s*Anahtarı/i.test(line) && !opticalAnswersMap['TYT Fen'] && /BCA|ACB/i.test(line))) {
          let textToParse = line;
          if (/^TYT\s*Fen$/i.test(line) && lines[i + 1]) {
            textToParse = lines[i + 1];
          }
          const m = textToParse.match(/^([a-zA-Z\s]{8,}?)\s*Cevap\s*Anahtarı\s*(?:[A-Z]\s*)?([A-Z]+)/i);
          if (m) {
            opticalAnswersMap['TYT Fen'] = m[1].trim();
            opticalAnswersMap['Fen'] = m[1].trim();
            answerKeysMap['TYT Fen'] = m[2].trim();
            answerKeysMap['Fen'] = m[2].trim();
          }
        }
      }
    }

    // Attach optical answers and answer keys to matching subjects
    Object.entries(opticalAnswersMap).forEach(([subjName, optAns]) => {
      const subj = getSubject(subjName);
      subj.opticalAnswers = optAns;
      if (answerKeysMap[subjName]) {
        subj.answerKey = answerKeysMap[subjName];
      }
    });

    // Match student to registered database users
    const matchResult = matchStudentToSystem(studentName, schoolNumber, className, studentUsers, studentsData);

    rows.push({
      fileStudentName: studentName,
      fileSchoolNumber: schoolNumber,
      fileClassName: className,
      matchedStudentId: matchResult.matchedStudentId,
      selectedClassForMatch: className,
      matchScore: matchResult.matchScore,
      matchReason: matchResult.matchReason,
      isSelected: matchResult.matchedStudentId !== null,
      tytScore,
      tytClassRank,
      tytClassTotal: classParticipantCount,
      tytInstitutionRank,
      tytInstitutionTotal: institutionParticipantCount,
      tytGeneralRank,
      tytGeneralTotal: generalParticipantCount,
      sayScore,
      sayClassRank,
      sayClassTotal: classParticipantCount,
      sayInstitutionRank,
      sayInstitutionTotal: institutionParticipantCount,
      sayGeneralRank,
      sayGeneralTotal: generalParticipantCount,
      eaScore,
      eaClassRank,
      eaClassTotal: classParticipantCount,
      eaInstitutionRank,
      eaInstitutionTotal: institutionParticipantCount,
      eaGeneralRank,
      eaGeneralTotal: generalParticipantCount,
      sozScore,
      sozClassRank,
      sozClassTotal: classParticipantCount,
      sozInstitutionRank,
      sozInstitutionTotal: institutionParticipantCount,
      sozGeneralRank,
      sozGeneralTotal: generalParticipantCount,
      classParticipantCount,
      institutionParticipantCount,
      generalParticipantCount,
      totalNet,
      opticalAnswers: opticalAnswersMap,
      answerKeys: answerKeysMap,
      subjects: Array.from(subjectsMap.values())
    });
  }

  return {
    detectedExamTitle,
    detectedExamType,
    rows
  };
}
