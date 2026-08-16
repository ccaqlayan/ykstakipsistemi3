import { UserAccount, YKSDataState, ParsedStudentRow, InstitutionalSubjectDetail, InstitutionalTopicDetail } from '../types';
import { matchStudentToSystem, normalizeTurkishText } from './pdfReportParser';

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
  studentsData: Record<string, YKSDataState> | undefined,
  getMappedClassName: (clsName: string | undefined | null) => string
): MarkdownParseResult {
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
    className = getMappedClassName(className);

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

    const getSubject = (name: string): InstitutionalSubjectDetail => {
      let key = name.trim();
      if (key === 'Türkçe') key = 'TYT Türkçe';
      if (key === 'Sosyal' || key === 'Sosyal Bilimler') key = 'TYT Sosyal';
      if (key === 'Matematik' || key === 'Matematik-1') key = 'TYT Matematik';
      if (key === 'Fen' || key === 'Fen Bilimleri') key = 'TYT Fen';

      if (!subjectsMap.has(key)) {
        subjectsMap.set(key, {
          subjectName: key,
          questionCount: 0,
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

    // Extract subject summary rows
    const subjectLineRegex = /(Türkçe|Tarih-1|Tarih|Coğrafya-1|Coğrafya|Felsefe|Din Kül\. ve Ahl\. Bil\.|Din Kültürü|Felsefe \(Seçmeli\)|TYT Sosyal|Sosyal Bilimler|Matematik-1|Matematik|Geometri|TYT Matematik|Fizik|Kimya|Biyoloji|TYT Fen|Fen Bilimleri|Edebiyat|Toplam)\s+(\d+)?\s*(\d+)\s+(\d+)\s+([\d,.-]+)\s+(\d+)\s+([\d,.-]+)\s+([\d,.-]+)\s+([\d,.-]+)/gi;
    
    let match: RegExpExecArray | null;
    while ((match = subjectLineRegex.exec(chunk)) !== null) {
      const sName = match[1];
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

    // Extract individual topic lines
    const topicRegex = /^([A-ZÇĞİÖŞÜa-zçğıöşü0-9\s.,'’()–\/-]+?)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)$/;
    let currentTopicSubject = 'TYT Türkçe';

    for (const line of lines) {
      if (/TYT Türkçe|Türkçe/i.test(line) && /ANALİZ|S D Y B%/i.test(line)) currentTopicSubject = 'TYT Türkçe';
      else if (/Tarih-1|Tarih/i.test(line) && /S D Y B%/i.test(line)) currentTopicSubject = 'Tarih-1';
      else if (/Coğrafya-1|Coğrafya/i.test(line) && /S D Y B%/i.test(line)) currentTopicSubject = 'Coğrafya-1';
      else if (/Felsefe/i.test(line) && /S D Y B%/i.test(line)) currentTopicSubject = 'Felsefe';
      else if (/Din Kül/i.test(line) && /S D Y B%/i.test(line)) currentTopicSubject = 'Din Kül. ve Ahl. Bil.';
      else if (/Matematik-1|TYT Matematik|Matematik/i.test(line) && /ANALİZ|S D Y B%/i.test(line)) currentTopicSubject = 'TYT Matematik';
      else if (/Geometri/i.test(line) && /S D Y B%/i.test(line)) currentTopicSubject = 'Geometri';
      else if (/Fizik/i.test(line) && /S D Y B%/i.test(line)) currentTopicSubject = 'Fizik';
      else if (/Kimya/i.test(line) && /S D Y B%/i.test(line)) currentTopicSubject = 'Kimya';
      else if (/Biyoloji/i.test(line) && /S D Y B%/i.test(line)) currentTopicSubject = 'Biyoloji';

      const tm = line.match(topicRegex);
      if (tm) {
        const topicName = tm[1].trim();
        // Discard headers
        if (!/Soru|Doğru|Yanlış|Başarı|Ortalama|Cevap|Puan|Katılımlar|S D Y B%/i.test(topicName)) {
          const qCount = parseInt(tm[2], 10) || 0;
          const corr = parseInt(tm[3], 10) || 0;
          const wrg = parseInt(tm[4], 10) || 0;
          const sRate = parseInt(tm[5], 10) || 0;

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
      }
    }

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
      subjects: Array.from(subjectsMap.values())
    });
  }

  return {
    detectedExamTitle,
    detectedExamType,
    rows
  };
}
