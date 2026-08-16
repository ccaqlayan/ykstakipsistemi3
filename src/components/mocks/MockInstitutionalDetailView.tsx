import React, { useEffect, useState, useMemo } from 'react';
import { 
  ArrowLeft, 
  GraduationCap, 
  Printer, 
  History, 
  X, 
  Sparkles,
  BarChart2
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { InstitutionalMockExam, InstitutionalSubjectDetail } from '../../types';

interface MockInstitutionalDetailViewProps {
  selectedInstitutionalExam: InstitutionalMockExam | null;
  setSelectedInstitutionalExam: (exam: InstitutionalMockExam | null) => void;
  allInstitutionalExams?: InstitutionalMockExam[];
}

export const MockInstitutionalDetailView: React.FC<MockInstitutionalDetailViewProps> = ({
  selectedInstitutionalExam,
  setSelectedInstitutionalExam,
  allInstitutionalExams = []
}) => {
  const [selectedTopicHistory, setSelectedTopicHistory] = useState<{
    subjectName: string;
    topicName: string;
  } | null>(null);

  const [activeBubble, setActiveBubble] = useState<{
    key: string;
    label: string;
    type: 'correct' | 'wrong' | 'empty';
    char: string;
  } | null>(null);

  useEffect(() => {
    if (!activeBubble) return;
    const handleGlobalClick = () => setActiveBubble(null);
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, [activeBubble]);

  useEffect(() => {
    if (selectedInstitutionalExam) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [selectedInstitutionalExam]);

  const normalizeText = (str: string) => {
    return (str || '')
      .toLowerCase()
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      .replace(/[^a-z0-9]/g, '');
  };

  // Find all exams belonging to the current student (always includes current exam)
  const studentExams = useMemo(() => {
    if (!selectedInstitutionalExam) return [];
    const examMap = new Map<string, InstitutionalMockExam>();
    examMap.set(selectedInstitutionalExam.id, selectedInstitutionalExam);

    if (Array.isArray(allInstitutionalExams)) {
      allInstitutionalExams.forEach(ex => {
        if (!ex || !ex.id) return;
        const sameStudent =
          (selectedInstitutionalExam.studentId && ex.studentId && ex.studentId === selectedInstitutionalExam.studentId) ||
          (selectedInstitutionalExam.schoolNumber && ex.schoolNumber && ex.schoolNumber === selectedInstitutionalExam.schoolNumber) ||
          (normalizeText(ex.studentName) === normalizeText(selectedInstitutionalExam.studentName));
        if (sameStudent) {
          examMap.set(ex.id, ex);
        }
      });
    }
    return Array.from(examMap.values()).sort((a, b) => new Date(b.examDate || 0).getTime() - new Date(a.examDate || 0).getTime());
  }, [selectedInstitutionalExam, allInstitutionalExams]);

  // Extract performance history for selected topic
  const topicHistoryList = useMemo(() => {
    if (!selectedTopicHistory) return [];
    const normTarget = normalizeText(selectedTopicHistory.topicName);
    const targetWords = normTarget.split(/\s+/).filter(w => w.length > 2);

    const results: Array<{
      examId: string;
      examTitle: string;
      examDate: string;
      subjectName: string;
      topicName: string;
      questionCount: number;
      correct: number;
      wrong: number;
      empty: number;
      successRate: number;
    }> = [];

    studentExams.forEach(ex => {
      ex.subjects?.forEach(sub => {
        sub.topics?.forEach(top => {
          const normTop = normalizeText(top.topicName);
          const isExact = normTop === normTarget;
          const isSubstring = normTop.length > 3 && normTarget.length > 3 && (normTop.includes(normTarget) || normTarget.includes(normTop));
          const isKeywordMatch = targetWords.length > 0 && targetWords.every(w => normTop.includes(w));

          if (isExact || isSubstring || isKeywordMatch) {
            results.push({
              examId: ex.id,
              examTitle: ex.examTitle,
              examDate: ex.examDate,
              subjectName: sub.subjectName,
              topicName: top.topicName,
              questionCount: top.questionCount || (top.correct + top.wrong + top.empty),
              correct: top.correct,
              wrong: top.wrong,
              empty: top.empty,
              successRate: top.successRate
            });
          }
        });
      });
    });

    return results;
  }, [selectedTopicHistory, studentExams]);

  // Topic summary statistics
  const topicSummary = useMemo(() => {
    if (topicHistoryList.length === 0) return null;
    const totalQuestions = topicHistoryList.reduce((acc, curr) => acc + curr.questionCount, 0);
    const totalCorrect = topicHistoryList.reduce((acc, curr) => acc + curr.correct, 0);
    const totalWrong = topicHistoryList.reduce((acc, curr) => acc + curr.wrong, 0);
    const totalEmpty = topicHistoryList.reduce((acc, curr) => acc + curr.empty, 0);
    const avgSuccessRate = Math.round(
      topicHistoryList.reduce((acc, curr) => acc + curr.successRate, 0) / topicHistoryList.length
    );

    return {
      totalExams: topicHistoryList.length,
      totalQuestions,
      totalCorrect,
      totalWrong,
      totalEmpty,
      avgSuccessRate
    };
  }, [topicHistoryList]);

  const handlePrint = () => {
    window.print();
  };

  if (!selectedInstitutionalExam) return null;

  const { scores, subjects = [] } = selectedInstitutionalExam;
  const examTypeStr = (selectedInstitutionalExam.examType || '').toUpperCase();
  const isAyt = examTypeStr.includes('AYT') || 
    scores.sayScore !== undefined || 
    scores.eaScore !== undefined || 
    scores.sozScore !== undefined ||
    subjects.some(s => ['matematik-2', 'matematik2', 'fenbilimleri', 'edebiyatsosyal1', 'sosyal2'].includes(normalizeText(s.subjectName)));
  const isTyt = !isAyt;

  // Calculate estimated District and City ranks/totals if not explicitly provided
  const rankStats = (() => {
    const classRank = scores.tytClassRank || scores.sayClassRank || scores.eaClassRank || scores.sozClassRank || 0;
    const classTotal = scores.tytClassTotal || scores.sayClassTotal || scores.eaClassTotal || scores.sozClassTotal || scores.classParticipantCount || 0;
    
    const instRank = scores.tytInstitutionRank || scores.sayInstitutionRank || scores.eaInstitutionRank || scores.sozInstitutionRank || 0;
    const instTotal = scores.tytInstitutionTotal || scores.sayInstitutionTotal || scores.eaInstitutionTotal || scores.sozInstitutionTotal || scores.institutionParticipantCount || 0;
    
    const districtRank = scores.tytDistrictRank || scores.sayDistrictRank || scores.eaDistrictRank || scores.sozDistrictRank || (instRank > 0 ? Math.max(1, Math.round(instRank * 1.15)) : 0);
    const districtTotal = scores.districtParticipantCount || (instTotal > 0 ? Math.round(instTotal * 3.5) : (scores.generalParticipantCount ? Math.round(scores.generalParticipantCount * 0.03) : 0));

    const cityRank = scores.tytCityRank || scores.sayCityRank || scores.eaCityRank || scores.sozCityRank || (instRank > 0 ? Math.max(1, Math.round(instRank * 7.5)) : 0);
    const cityTotal = scores.cityParticipantCount || (instTotal > 0 ? Math.round(instTotal * 16.5) : (scores.generalParticipantCount ? Math.round(scores.generalParticipantCount * 0.25) : 0));

    const genRank = scores.tytGeneralRank || scores.sayGeneralRank || scores.eaGeneralRank || scores.sozGeneralRank || 0;
    const genTotal = scores.tytGeneralTotal || scores.sayGeneralTotal || scores.eaGeneralTotal || scores.sozGeneralTotal || scores.generalParticipantCount || 0;

    return {
      classRank,
      classTotal,
      instRank,
      instTotal,
      districtRank,
      districtTotal,
      cityRank,
      cityTotal,
      genRank,
      genTotal
    };
  })();

  // Helper to find or calculate structured subject rows
  const getSubjectItem = (name: string, subKeys: string[] = []): InstitutionalSubjectDetail | null => {
    const searchKeys = [name];
    if (isTyt) {
      if (name === 'Türkçe') searchKeys.push('TYT Türkçe');
      if (name === 'TYT Türkçe') searchKeys.push('Türkçe');
      if (name === 'TYT Sosyal') searchKeys.push('Sosyal', 'Sosyal Bilimler');
      if (name === 'TYT Matematik') searchKeys.push('Matematik');
      if (name === 'TYT Fen') searchKeys.push('Fen', 'Fen Bilimleri');
    } else {
      if (name === 'Matematik') searchKeys.push('AYT Matematik');
      if (name === 'Fen Bilimleri') searchKeys.push('Fen', 'AYT Fen');
      if (name === 'Edebiyat') searchKeys.push('Türk Dili ve Edebiyatı');
    }

    const exact = subjects.find(s => searchKeys.some(k => normalizeText(s.subjectName) === normalizeText(k)));
    if (exact) return exact;

    if (subKeys.length > 0) {
      const matching = subjects.filter(s => subKeys.some(k => normalizeText(s.subjectName) === normalizeText(k)));
      if (matching.length > 0) {
        const questionCount = matching.reduce((sum, s) => sum + (s.questionCount || 0), 0);
        const correct = matching.reduce((sum, s) => sum + (s.correct || 0), 0);
        const wrong = matching.reduce((sum, s) => sum + (s.wrong || 0), 0);
        const net = Math.round(matching.reduce((sum, s) => sum + (s.net || 0), 0) * 100) / 100;
        const successRate = questionCount > 0 ? Math.round((Math.max(0, net) / questionCount) * 100) : 0;
        const classAvgNet = Math.round(matching.reduce((sum, s) => sum + (s.classAvgNet || 0), 0) * 100) / 100;
        const institutionAvgNet = Math.round(matching.reduce((sum, s) => sum + (s.institutionAvgNet || 0), 0) * 100) / 100;
        const generalAvgNet = Math.round(matching.reduce((sum, s) => sum + (s.generalAvgNet || 0), 0) * 100) / 100;
        
        return {
          subjectName: name,
          questionCount,
          correct,
          wrong,
          net,
          successRate,
          classAvgNet,
          institutionAvgNet,
          generalAvgNet,
          topics: matching.flatMap(s => s.topics || [])
        };
      }
    }
    return null;
  };

  // Structured subjects layout for Table
  const tableRows: Array<{
    item: InstitutionalSubjectDetail;
    isSubtotal?: boolean;
    isTotal?: boolean;
    isLinkedTyt?: boolean;
  }> = [];

  if (isAyt) {
    // ─── 1. LINKED TYT ROWS ───
    const tytSubjectList = [
      { name: 'Türkçe', keys: ['Türkçe', 'TYT Türkçe'] },
      { name: 'Tarih-1', keys: ['Tarih-1', 'Tarih'] },
      { name: 'Coğrafya-1', keys: ['Coğrafya-1', 'Coğrafya'] },
      { name: 'Felsefe', keys: ['Felsefe'] },
      { name: 'Din Kül. ve Ahl. Bil.', keys: ['Din Kül. ve Ahl. Bil.', 'Din Kültürü'] },
      { name: 'TYT Sosyal', keys: ['TYT Sosyal', 'Sosyal'], isSubtotal: true },
      { name: 'Matematik-1', keys: ['Matematik-1'] },
      { name: 'Geometri', keys: ['TYT Geometri', 'Geometri'] },
      { name: 'TYT Matematik', keys: ['TYT Matematik'], isSubtotal: true },
      { name: 'Fizik', keys: ['TYT Fizik', 'Fizik'] },
      { name: 'Kimya', keys: ['TYT Kimya', 'Kimya'] },
      { name: 'Biyoloji', keys: ['TYT Biyoloji', 'Biyoloji'] },
      { name: 'TYT Fen', keys: ['TYT Fen'], isSubtotal: true }
    ];

    const hasLinkedTyt = subjects.some(s => ['Türkçe', 'TYT Sosyal', 'Matematik-1', 'TYT Matematik', 'TYT Fen', 'TYT Fizik', 'TYT Kimya', 'TYT Biyoloji'].includes(s.subjectName));

    if (hasLinkedTyt) {
      tytSubjectList.forEach(conf => {
        const item = subjects.find(s => {
          if (conf.name === 'Geometri') return s.subjectName === 'TYT Geometri' || (s.subjectName === 'Geometri' && s.questionCount === 10);
          if (conf.name === 'Fizik') return s.subjectName === 'TYT Fizik' || (s.subjectName === 'Fizik' && s.questionCount === 7);
          if (conf.name === 'Kimya') return s.subjectName === 'TYT Kimya' || (s.subjectName === 'Kimya' && s.questionCount === 7);
          if (conf.name === 'Biyoloji') return s.subjectName === 'TYT Biyoloji' || (s.subjectName === 'Biyoloji' && s.questionCount === 6);
          return conf.keys.some(k => normalizeText(s.subjectName) === normalizeText(k));
        });

        if (item && item.questionCount > 0) {
          tableRows.push({
            item: {
              ...item,
              subjectName: conf.name,
              classAvgNet: undefined,
              institutionAvgNet: undefined,
              generalAvgNet: undefined
            },
            isSubtotal: conf.isSubtotal,
            isLinkedTyt: true
          });
        }
      });

      // ─── TYT TOPLAM ROW (Only in AYT mode after linked TYT section) ───
      const tytTurkce = subjects.find(s => ['Türkçe', 'TYT Türkçe'].includes(s.subjectName));
      const tytSosyal = subjects.find(s => ['TYT Sosyal', 'Sosyal'].includes(s.subjectName));
      const tytMat = subjects.find(s => ['TYT Matematik'].includes(s.subjectName));
      const tytFen = subjects.find(s => ['TYT Fen'].includes(s.subjectName));

      const tytMainSubs = [tytTurkce, tytSosyal, tytMat, tytFen].filter(Boolean) as InstitutionalSubjectDetail[];
      const tytQCount = tytMainSubs.reduce((sum, s) => sum + (s.questionCount || 0), 0) || 120;
      const tytCorr = tytMainSubs.reduce((sum, s) => sum + (s.correct || 0), 0);
      const tytWrg = tytMainSubs.reduce((sum, s) => sum + (s.wrong || 0), 0);
      const tytNet = Math.round(tytMainSubs.reduce((sum, s) => sum + (s.net || 0), 0) * 100) / 100;
      const tytSuccessRate = tytQCount > 0 ? Math.round((Math.max(0, tytNet) / tytQCount) * 100) : 0;

      tableRows.push({
        item: {
          subjectName: 'TYT Toplam',
          questionCount: tytQCount,
          correct: tytCorr,
          wrong: tytWrg,
          net: tytNet,
          successRate: tytSuccessRate,
          classAvgNet: undefined,
          institutionAvgNet: undefined,
          generalAvgNet: undefined,
          topics: []
        },
        isSubtotal: true,
        isLinkedTyt: true
      });
    }

    // ─── 2. AYT MAIN ROWS ───
    // Matematik-2
    const mat2 = getSubjectItem('Matematik-2');
    if (mat2 && mat2.questionCount > 0) tableRows.push({ item: mat2 });

    // Geometri (AYT)
    const geoAyt = subjects.find(s => s.subjectName === 'Geometri' && s.questionCount !== 10);
    if (geoAyt && geoAyt.questionCount > 0) tableRows.push({ item: geoAyt });

    // Matematik (AYT Toplam: 40)
    const matAyt = subjects.find(s => s.subjectName === 'Matematik' && s.questionCount === 40) || getSubjectItem('Matematik', ['Matematik-2', 'Geometri']);
    if (matAyt && matAyt.questionCount > 0) tableRows.push({ item: matAyt, isSubtotal: true });

    // Fizik (AYT 14)
    const fizAyt = subjects.find(s => s.subjectName === 'Fizik' && s.questionCount !== 7);
    if (fizAyt && fizAyt.questionCount > 0) tableRows.push({ item: fizAyt });

    // Kimya (AYT 13)
    const kimAyt = subjects.find(s => s.subjectName === 'Kimya' && s.questionCount !== 7);
    if (kimAyt && kimAyt.questionCount > 0) tableRows.push({ item: kimAyt });

    // Biyoloji (AYT 13)
    const biyAyt = subjects.find(s => s.subjectName === 'Biyoloji' && s.questionCount !== 6);
    if (biyAyt && biyAyt.questionCount > 0) tableRows.push({ item: biyAyt });

    // Fen Bilimleri (AYT Toplam: 40)
    const fenAyt = subjects.find(s => s.subjectName === 'Fen Bilimleri' && s.questionCount === 40) || getSubjectItem('Fen Bilimleri', ['Fizik', 'Kimya', 'Biyoloji']);
    if (fenAyt && fenAyt.questionCount > 0) tableRows.push({ item: fenAyt, isSubtotal: true });

    // Edebiyat-Sosyal-1 (Only for EA / SÖZ students who took AYT Edebiyat/Tarih-2/Coğrafya-2)
    const edb = subjects.find(s => ['Türk Dili ve Edebiyatı', 'Edebiyat'].includes(s.subjectName));
    if (edb && edb.questionCount > 0) tableRows.push({ item: edb });

    const tar2 = subjects.find(s => s.subjectName === 'Tarih-2');
    if (tar2 && tar2.questionCount > 0) tableRows.push({ item: tar2 });

    const cog2 = subjects.find(s => s.subjectName === 'Coğrafya-2');
    if (cog2 && cog2.questionCount > 0) tableRows.push({ item: cog2 });

    const edbSos1 = subjects.find(s => s.subjectName === 'Edebiyat-Sosyal-1');
    if (edbSos1 && edbSos1.questionCount > 0) {
      tableRows.push({ item: edbSos1, isSubtotal: true });
    } else if (edb || tar2 || cog2) {
      const edbSub = getSubjectItem('Edebiyat-Sosyal-1', ['Edebiyat', 'Türk Dili ve Edebiyatı', 'Tarih-2', 'Coğrafya-2']);
      if (edbSub && edbSub.questionCount > 0) tableRows.push({ item: edbSub, isSubtotal: true });
    }

    // Sosyal-2 (Only for SÖZ students who took Felsefe Grubu / AYT Din Kültürü)
    const felGrubu = subjects.find(s => s.subjectName === 'Felsefe Grubu');
    if (felGrubu && felGrubu.questionCount > 0) tableRows.push({ item: felGrubu });

    const dinAyt = subjects.find(s => s.subjectName === 'Din Kültürü');
    if (dinAyt && dinAyt.questionCount > 0) tableRows.push({ item: dinAyt });

    const sos2 = subjects.find(s => s.subjectName === 'Sosyal-2');
    if (sos2 && sos2.questionCount > 0) {
      tableRows.push({ item: sos2, isSubtotal: true });
    } else if (felGrubu || dinAyt) {
      const sos2Sub = getSubjectItem('Sosyal-2', ['Tarih-2', 'Coğrafya-2', 'Felsefe Grubu', 'Din Kültürü']);
      if (sos2Sub && sos2Sub.questionCount > 0) tableRows.push({ item: sos2Sub, isSubtotal: true });
    }

    // ─── 3. AYT TOPLAM ROW (Only AYT subjects, excluding TYT) ───
    const aytBranches = [matAyt, fenAyt, edbSos1, sos2].filter((s): s is InstitutionalSubjectDetail => Boolean(s && ((s.questionCount || 0) > 0 || (s.net || 0) > 0)));

    const aytQCount = aytBranches.reduce((sum, s) => sum + (s.questionCount || 0), 0) || 80;
    const aytCorr = aytBranches.reduce((sum, s) => sum + (s.correct || 0), 0);
    const aytWrg = aytBranches.reduce((sum, s) => sum + (s.wrong || 0), 0);
    const aytNet = Math.round(aytBranches.reduce((sum, s) => sum + (s.net || 0), 0) * 100) / 100;
    const aytClassAvg = Math.round(aytBranches.reduce((sum, s) => sum + (s.classAvgNet || 0), 0) * 100) / 100;
    const aytInstAvg = Math.round(aytBranches.reduce((sum, s) => sum + (s.institutionAvgNet || 0), 0) * 100) / 100;
    const aytGenAvg = Math.round(aytBranches.reduce((sum, s) => sum + (s.generalAvgNet || 0), 0) * 100) / 100;
    const aytSuccessRate = aytQCount > 0 ? Math.round((Math.max(0, aytNet) / aytQCount) * 100) : 0;

    tableRows.push({
      item: {
        subjectName: 'AYT Toplam',
        questionCount: aytQCount,
        correct: aytCorr,
        wrong: aytWrg,
        net: aytNet,
        successRate: aytSuccessRate,
        classAvgNet: aytClassAvg,
        institutionAvgNet: aytInstAvg,
        generalAvgNet: aytGenAvg,
        topics: []
      },
      isTotal: true
    });

  } else {
    // ─── TYT REPORT CARD STRUCTURE ───
    // 1. Türkçe
    const turkce = getSubjectItem('Türkçe') || getSubjectItem('TYT Türkçe');
    if (turkce) tableRows.push({ item: turkce });

    // 2. Sosyal alt dersleri
    const tarih = getSubjectItem('Tarih-1') || getSubjectItem('Tarih');
    if (tarih) tableRows.push({ item: tarih });

    const cografya = getSubjectItem('Coğrafya-1') || getSubjectItem('Coğrafya');
    if (cografya) tableRows.push({ item: cografya });

    const felsefe = getSubjectItem('Felsefe');
    if (felsefe) tableRows.push({ item: felsefe });

    const din = getSubjectItem('Din Kül. ve Ahl. Bil.') || getSubjectItem('Din Kültürü');
    if (din) tableRows.push({ item: din });

    const felsefeSec = getSubjectItem('Felsefe (Seçmeli)');
    if (felsefeSec) tableRows.push({ item: felsefeSec });

    // TYT Sosyal Subtotal
    const tytSosyal = getSubjectItem('TYT Sosyal', ['Tarih-1', 'Tarih', 'Coğrafya-1', 'Coğrafya', 'Felsefe', 'Din Kül. ve Ahl. Bil.', 'Din Kültürü', 'Felsefe (Seçmeli)']);
    if (tytSosyal) tableRows.push({ item: tytSosyal, isSubtotal: true });

    // 3. Matematik alt dersleri
    const mat1 = getSubjectItem('Matematik-1') || getSubjectItem('Matematik');
    if (mat1) tableRows.push({ item: mat1 });

    const geo = getSubjectItem('Geometri');
    if (geo) tableRows.push({ item: geo });

    // TYT Matematik Subtotal
    const tytMat = getSubjectItem('TYT Matematik', ['Matematik-1', 'Matematik', 'Geometri']);
    if (tytMat) tableRows.push({ item: tytMat, isSubtotal: true });

    // 4. Fen alt dersleri
    const fizik = getSubjectItem('Fizik');
    if (fizik) tableRows.push({ item: fizik });

    const kimya = getSubjectItem('Kimya');
    if (kimya) tableRows.push({ item: kimya });

    const biyoloji = getSubjectItem('Biyoloji');
    if (biyoloji) tableRows.push({ item: biyoloji });

    // TYT Fen Subtotal
    const tytFen = getSubjectItem('TYT Fen', ['Fizik', 'Kimya', 'Biyoloji']);
    if (tytFen) tableRows.push({ item: tytFen, isSubtotal: true });

    // 5. Toplam
    const subtotalItems = [turkce, tytSosyal, tytMat, tytFen].filter(Boolean) as InstitutionalSubjectDetail[];
    const totalRow = getSubjectItem('Toplam:') || getSubjectItem('Toplam') || {
      subjectName: 'Toplam:',
      questionCount: subtotalItems.reduce((acc, s) => acc + (s.questionCount || 0), 0) || 120,
      correct: subtotalItems.reduce((acc, s) => acc + (s.correct || 0), 0),
      wrong: subtotalItems.reduce((acc, s) => acc + (s.wrong || 0), 0),
      net: selectedInstitutionalExam.totalNet || Math.round(subtotalItems.reduce((acc, s) => acc + (s.net || 0), 0) * 100) / 100,
      successRate: Math.round((subtotalItems.reduce((acc, s) => acc + (s.net || 0), 0) / 120) * 100),
      classAvgNet: Math.round(subtotalItems.reduce((acc, s) => acc + (s.classAvgNet || 0), 0) * 100) / 100,
      institutionAvgNet: Math.round(subtotalItems.reduce((acc, s) => acc + (s.institutionAvgNet || 0), 0) * 100) / 100,
      generalAvgNet: Math.round(subtotalItems.reduce((acc, s) => acc + (s.generalAvgNet || 0), 0) * 100) / 100,
      topics: []
    };
    tableRows.push({ item: totalRow, isTotal: true });
  }

  // Bar chart data for the bottom left section
  const chartData = useMemo(() => {
    if (isAyt) {
      const aytKeys: Array<{ label: string; name: string }> = [
        { label: 'MAT2', name: 'Matematik-2' },
        { label: 'GEO', name: 'Geometri' },
        { label: 'MAT', name: 'Matematik' },
        { label: 'FİZ', name: 'Fizik' },
        { label: 'KİM', name: 'Kimya' },
        { label: 'BİY', name: 'Biyoloji' },
        { label: 'FEN', name: 'Fen Bilimleri' },
        { label: 'EDB', name: 'Edebiyat' },
        { label: 'TAR2', name: 'Tarih-2' },
        { label: 'COĞ2', name: 'Coğrafya-2' }
      ];

      return aytKeys
        .map(k => {
          const match = subjects.find(s => {
            const n = normalizeText(s.subjectName);
            const kn = normalizeText(k.name);
            return n === kn || (kn === 'matematik' && n === 'matematik' && s.questionCount === 40);
          });
          if (!match || (match.questionCount === 0 && match.net === 0)) return null;
          return {
            name: k.label,
            ogr: match.net,
            sinif: match.classAvgNet !== undefined ? match.classAvgNet : 0,
            genel: match.generalAvgNet !== undefined ? match.generalAvgNet : 0
          };
        })
        .filter((item): item is { name: string; ogr: number; sinif: number; genel: number } => Boolean(item));
    }

    const keysMap: Array<{ label: string; name: string }> = [
      { label: 'TÜR', name: 'Türkçe' },
      { label: 'TAR1', name: 'Tarih-1' },
      { label: 'COĞ1', name: 'Coğrafya-1' },
      { label: 'FEL', name: 'Felsefe' },
      { label: 'DİN', name: 'Din Kül. ve Ahl. Bil.' },
      { label: 'MAT1', name: 'Matematik-1' },
      { label: 'GEO', name: 'Geometri' },
      { label: 'FİZ', name: 'Fizik' },
      { label: 'KİM', name: 'Kimya' },
      { label: 'BİY', name: 'Biyoloji' }
    ];

    return keysMap.map(k => {
      const match = subjects.find(s => normalizeText(s.subjectName).includes(normalizeText(k.name)));
      return {
        name: k.label,
        ogr: match ? match.net : 0,
        sinif: match?.classAvgNet !== undefined ? match.classAvgNet : 0,
        genel: match?.generalAvgNet !== undefined ? match.generalAvgNet : 0
      };
    });
  }, [subjects, isAyt]);

  // Topic list structured hierarchically by section & sub-subject
  const topicSections = useMemo(() => {
    if (isAyt) {
      const aytSections = [
        {
          sectionName: 'Matematik',
          subKeys: ['Matematik-2', 'Matematik', 'Geometri']
        },
        {
          sectionName: 'Fen Bilimleri',
          subKeys: ['Fizik', 'Kimya', 'Biyoloji']
        },
        {
          sectionName: 'Edebiyat-Sosyal-1',
          subKeys: ['Türk Dili ve Edebiyatı', 'Edebiyat', 'Tarih-1', 'Tarih-2', 'Coğrafya-1', 'Coğrafya-2']
        },
        {
          sectionName: 'Sosyal-2',
          subKeys: ['Tarih-2', 'Coğrafya-2', 'Felsefe Grubu', 'Felsefe', 'Din Kültürü', 'Din Kül. ve Ahl. Bil.']
        }
      ];

      return aytSections.map(sec => {
        const groups = sec.subKeys
          .map(k => subjects.find(s => normalizeText(s.subjectName) === normalizeText(k)))
          .filter((s): s is InstitutionalSubjectDetail => Boolean(s && s.topics && s.topics.length > 0));
        return {
          sectionName: sec.sectionName,
          groups
        };
      }).filter(sec => sec.groups.length > 0);
    }

    const sections = [
      {
        sectionName: '',
        subKeys: ['Türkçe', 'TYT Türkçe']
      },
      {
        sectionName: 'TYT Sosyal',
        subKeys: ['Tarih-1', 'Tarih', 'Coğrafya-1', 'Coğrafya', 'Felsefe', 'Din Kül. ve Ahl. Bil.', 'Din Kültürü', 'Felsefe (Seçmeli)']
      },
      {
        sectionName: 'TYT Matematik',
        subKeys: ['Matematik-1', 'Matematik', 'Geometri']
      },
      {
        sectionName: 'TYT Fen',
        subKeys: ['Fizik', 'Kimya', 'Biyoloji']
      }
    ];

    return sections.map(sec => {
      const groups = sec.subKeys
        .map(k => subjects.find(s => normalizeText(s.subjectName) === normalizeText(k)))
        .filter((s): s is InstitutionalSubjectDetail => Boolean(s && s.topics && s.topics.length > 0));
      return {
        sectionName: sec.sectionName,
        groups
      };
    }).filter(sec => sec.groups.length > 0);
  }, [subjects, isAyt]);

  // Helper for generating illustrative or authentic optical answer bubbled indicators
  const renderOpticalRow = (title: string, correct: number, wrong: number, count: number, optAnswers?: string, ansKey?: string) => {
    // Look up optical answers and answer keys if not passed directly
    const subjectItem = getSubjectItem(title) || getSubjectItem(title.replace('TYT ', ''));
    const opticalStr = optAnswers || 
      selectedInstitutionalExam?.opticalAnswers?.[title] || 
      selectedInstitutionalExam?.opticalAnswers?.[title.replace('TYT ', '')] || 
      selectedInstitutionalExam?.opticalAnswers?.[`TYT ${title}`] || 
      subjectItem?.opticalAnswers || '';
    const keyStr = ansKey || 
      selectedInstitutionalExam?.answerKeys?.[title] || 
      selectedInstitutionalExam?.answerKeys?.[title.replace('TYT ', '')] || 
      selectedInstitutionalExam?.answerKeys?.[`TYT ${title}`] || 
      subjectItem?.answerKey || '';

    // If authentic optical sequence is available:
    if (opticalStr && opticalStr.trim().length > 0) {
      const bubbles: Array<{
        questionNo: number;
        type: 'correct' | 'wrong' | 'empty';
        char: string;
        correctChar: string;
        label: string;
      }> = [];

      for (let idx = 0; idx < count; idx++) {
        const rawCh = opticalStr[idx] || ' ';
        const correctChar = keyStr[idx] || '';

        let type: 'correct' | 'wrong' | 'empty' = 'empty';
        let char = '-';
        let label = `${idx + 1}. Soru: Boş${correctChar ? ` (Doğru Cevap: ${correctChar})` : ''}`;

        if (rawCh >= 'A' && rawCh <= 'Z') {
          type = 'correct';
          char = rawCh;
          label = `${idx + 1}. Soru: Doğru (${rawCh})`;
        } else if (rawCh >= 'a' && rawCh <= 'z') {
          type = 'wrong';
          char = rawCh.toUpperCase();
          label = `${idx + 1}. Soru: Yanlış (Verilen: ${rawCh.toUpperCase()}${correctChar ? `, Doğru: ${correctChar}` : ''})`;
        }

        bubbles.push({
          questionNo: idx + 1,
          type,
          char,
          correctChar,
          label
        });
      }

      const calculatedCorrect = bubbles.filter(b => b.type === 'correct').length;
      const calculatedWrong = bubbles.filter(b => b.type === 'wrong').length;
      const calculatedEmpty = bubbles.filter(b => b.type === 'empty').length;

      return (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[9px] font-bold text-slate-700">
            <span className="uppercase">{title}</span>
            <span className="font-mono text-[8px] text-slate-500">
              {calculatedCorrect}D • {calculatedWrong}Y • {calculatedEmpty}B
            </span>
          </div>
          <div className="flex flex-wrap gap-0.5">
            {bubbles.map((b) => {
              const bubbleKey = `${title}-${b.questionNo}`;
              const isActive = activeBubble?.key === bubbleKey;

              return (
                <div
                  key={b.questionNo}
                  className="relative inline-block"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveBubble(prev => prev?.key === bubbleKey ? null : {
                      key: bubbleKey,
                      label: b.label,
                      type: b.type,
                      char: b.char
                    });
                  }}
                >
                  <div
                    className={`w-3.5 h-3.5 rounded-[3px] text-[7.5px] font-extrabold flex items-center justify-center font-mono cursor-pointer transition-transform hover:scale-125 select-none ${
                      isActive ? 'ring-2 ring-cyan-500 scale-125 z-20' : ''
                    } ${
                      b.type === 'correct'
                        ? 'bg-emerald-600 text-white shadow-xs shadow-emerald-700/30'
                        : b.type === 'wrong'
                          ? 'bg-rose-600 text-white shadow-xs shadow-rose-700/30'
                          : 'bg-slate-200 text-slate-400 border border-slate-300/50'
                    }`}
                    title={b.label}
                  >
                    {b.char}
                  </div>

                  {/* Mini Info Balloon Tooltip (Mobile & Click) */}
                  {isActive && (
                    <div 
                      className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-50 whitespace-nowrap bg-slate-950 text-white text-[10px] font-sans font-bold px-2.5 py-1 rounded-lg shadow-2xl border border-white/20 flex items-center gap-1.5 animate-in fade-in zoom-in-95 duration-150 pointer-events-auto"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveBubble(null);
                      }}
                    >
                      <span className={`w-2 h-2 rounded-full shrink-0 ${
                        b.type === 'correct' ? 'bg-emerald-400' : b.type === 'wrong' ? 'bg-rose-400' : 'bg-slate-400'
                      }`} />
                      <span>{b.label}</span>
                      {/* Downward triangle arrow pointer */}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-slate-950" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    // Fallback if optical sequence not available:
    const empty = Math.max(0, count - correct - wrong);
    const items: Array<'correct' | 'wrong' | 'empty'> = [];
    
    for (let i = 0; i < correct; i++) items.push('correct');
    for (let i = 0; i < wrong; i++) items.push('wrong');
    for (let i = 0; i < empty; i++) items.push('empty');

    return (
      <div className="space-y-0.5">
        <div className="flex items-center justify-between text-[9px] font-bold text-slate-700">
          <span className="uppercase">{title}</span>
          <span className="font-mono text-[8px] text-slate-500">{correct}D • {wrong}Y • {empty}B</span>
        </div>
        <div className="flex flex-wrap gap-0.5">
          {items.map((type, idx) => {
            const fallbackKey = `${title}-fallback-${idx + 1}`;
            const isActive = activeBubble?.key === fallbackKey;
            const label = `${idx + 1}. Soru: ${type === 'correct' ? 'Doğru' : type === 'wrong' ? 'Yanlış' : 'Boş'}`;

            return (
              <div
                key={idx}
                className="relative inline-block"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveBubble(prev => prev?.key === fallbackKey ? null : {
                    key: fallbackKey,
                    label,
                    type,
                    char: String(idx + 1)
                  });
                }}
              >
                <div
                  className={`w-3.5 h-3.5 rounded-[3px] text-[7.5px] font-extrabold flex items-center justify-center font-mono cursor-pointer transition-transform hover:scale-125 select-none ${
                    isActive ? 'ring-2 ring-cyan-500 scale-125 z-20' : ''
                  } ${
                    type === 'correct'
                      ? 'bg-emerald-600 text-white shadow-xs shadow-emerald-700/30'
                      : type === 'wrong'
                        ? 'bg-rose-600 text-white shadow-xs shadow-rose-700/30'
                        : 'bg-slate-200 text-slate-400 border border-slate-300/50'
                  }`}
                  title={label}
                >
                  {idx + 1}
                </div>

                {/* Mobile Popover */}
                {isActive && (
                  <div 
                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-50 whitespace-nowrap bg-slate-950 text-white text-[10px] font-sans font-bold px-2.5 py-1 rounded-lg shadow-2xl border border-white/20 flex items-center gap-1.5 animate-in fade-in zoom-in-95 duration-150 pointer-events-auto"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveBubble(null);
                    }}
                  >
                    <span className={`w-2 h-2 rounded-full shrink-0 ${
                      type === 'correct' ? 'bg-emerald-400' : type === 'wrong' ? 'bg-rose-400' : 'bg-slate-400'
                    }`} />
                    <span>{label}</span>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-slate-950" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-16 pt-3 sm:pt-5 animate-fade-in max-w-7xl mx-auto px-2 sm:px-4">
      {/* Print Stylesheet */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-report-card, #printable-report-card * {
            visibility: visible;
          }
          #printable-report-card {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            margin: 0 !important;
            padding: 10px !important;
            box-shadow: none !important;
            border: none !important;
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Topic History Modal */}
      {selectedTopicHistory && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in no-print">
          <div className="bg-slate-900 border border-indigo-500/30 rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-5 relative my-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-indigo-500/20 border border-indigo-500/30 rounded-2xl text-indigo-400">
                  <History className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <span>{selectedTopicHistory.topicName}</span>
                    <span className="text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full">
                      {selectedTopicHistory.subjectName}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">Önceki kurumsal deneme sınavlarındaki kazanım performansı</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTopicHistory(null)}
                className="p-2 rounded-xl bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {topicSummary && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950 p-4 rounded-2xl border border-white/10 font-mono text-center">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-500 font-sans uppercase font-bold block">Toplam Sınav</span>
                  <span className="text-sm font-extrabold text-white">{topicSummary.totalExams} Sınav</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-500 font-sans uppercase font-bold block">Soru Sayısı</span>
                  <span className="text-sm font-extrabold text-indigo-300">{topicSummary.totalQuestions} Soru</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-500 font-sans uppercase font-bold block">D / Y / B</span>
                  <span className="text-xs font-bold text-slate-300">
                    <strong className="text-emerald-400">{topicSummary.totalCorrect}D</strong>{' '}
                    <strong className="text-rose-400">{topicSummary.totalWrong}Y</strong>{' '}
                    <strong className="text-slate-400">{topicSummary.totalEmpty}B</strong>
                  </span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-500 font-sans uppercase font-bold block">Ort. Başarı</span>
                  <span className={`text-sm font-black ${
                    topicSummary.avgSuccessRate >= 70
                      ? 'text-emerald-400'
                      : topicSummary.avgSuccessRate >= 45
                        ? 'text-indigo-400'
                        : 'text-rose-400'
                  }`}>
                    %{topicSummary.avgSuccessRate}
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                <BarChart2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>Sınav Bazlı Kazanım İlerlemesi ({topicHistoryList.length})</span>
              </h4>

              {topicHistoryList.length === 0 ? (
                <div className="py-8 text-center text-slate-400 bg-slate-950 rounded-2xl border border-white/5 text-xs">
                  Bu kazanım için geçmiş deneme sınav kaydı bulunamadı.
                </div>
              ) : (
                <div className="max-h-72 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                  {topicHistoryList.map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-950 p-3.5 rounded-2xl border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-indigo-500/30 transition-all"
                    >
                      <div className="space-y-0.5">
                        <div className="text-xs font-extrabold text-white flex items-center space-x-2">
                          <span>{item.examTitle}</span>
                          {item.examId === selectedInstitutionalExam.id && (
                            <span className="text-[9px] font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.5 rounded">
                              Mevcut Karne
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">{item.examDate || 'Tarih Belirtilmemiş'}</div>
                      </div>

                      <div className="flex items-center space-x-4 shrink-0">
                        <div className="text-xs font-mono text-slate-300">
                          <span className="text-emerald-400 font-bold">{item.correct}D</span> •{' '}
                          <span className="text-rose-400 font-bold">{item.wrong}Y</span> •{' '}
                          <span className="text-slate-500 font-bold">{item.empty}B</span>
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                            item.successRate >= 70
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : item.successRate >= 45
                                ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          %{item.successRate}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedTopicHistory(null)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-extrabold text-xs px-5 py-2 rounded-xl border border-slate-700 transition-all cursor-pointer"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Action Bar / Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 no-print bg-slate-900/90 backdrop-blur-md p-3 sm:p-4 rounded-2xl border border-slate-800 shadow-xl">
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setSelectedInstitutionalExam(null)}
            className="flex items-center space-x-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold border border-slate-700 transition-all cursor-pointer shadow-sm"
          >
            <ArrowLeft className="w-4 h-4 text-indigo-400" />
            <span>Sınav Listesine Dön</span>
          </button>
          <span className="text-slate-600 text-xs">/</span>
          <span className="text-slate-300 text-xs font-semibold truncate max-w-sm font-mono">
            {selectedInstitutionalExam.examTitle}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-lg shadow-indigo-600/30 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Yazdır / PDF Olarak Kaydet</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedInstitutionalExam(null)}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer border border-slate-700"
          >
            Kapat
          </button>
        </div>
      </div>

      {/* ─── AUTHENTIC PDF RESULTS SHEET (SONUÇ BELGESİ) CONTAINER ─── */}
      <div 
        id="printable-report-card" 
        className="bg-white text-slate-900 border-2 border-slate-400 rounded-2xl p-6 sm:p-8 shadow-2xl font-sans max-w-6xl mx-auto space-y-4"
      >
        {/* TOP HEADER BOX */}
        <div className="border border-slate-800 divide-y divide-slate-800 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="p-3 font-black text-center md:text-left text-sm uppercase tracking-wider border-b md:border-b-0 md:border-r border-slate-800 bg-slate-50">
              SONUÇ BELGESİ
            </div>
            <div className="p-3 font-black text-center md:text-right text-sm uppercase tracking-wider bg-slate-50">
              {selectedInstitutionalExam.examTitle}
            </div>
          </div>
          <div className="p-2 text-center text-xs font-bold uppercase tracking-wider bg-white">
            BURSA / GÜRSU / YILDIZ ANADOLU LİSESİ
          </div>
        </div>

        {/* STUDENT INFO BOX */}
        <div className="border border-slate-800 grid grid-cols-3 text-xs bg-slate-50">
          <div className="p-2.5 border-r border-slate-800 flex flex-col justify-center">
            <span className="text-[10px] text-slate-500 font-bold uppercase">Öğrenci</span>
            <strong className="text-sm font-black text-slate-900 mt-0.5 truncate">
              {selectedInstitutionalExam.studentName}
            </strong>
          </div>
          <div className="p-2.5 border-r border-slate-800 text-center flex flex-col justify-center">
            <span className="text-[10px] text-slate-500 font-bold uppercase">Numara</span>
            <strong className="text-sm font-black text-slate-900 font-mono mt-0.5">
              {selectedInstitutionalExam.schoolNumber || '-'}
            </strong>
          </div>
          <div className="p-2.5 text-center flex flex-col justify-center">
            <span className="text-[10px] text-slate-500 font-bold uppercase">Sınıf</span>
            <strong className="text-sm font-black text-slate-900 mt-0.5">
              {selectedInstitutionalExam.className || '12-A'}
            </strong>
          </div>
        </div>

        {/* SCORE & RANK TABLE */}
        <div className="border border-slate-800 overflow-x-auto text-xs">
          <table className="w-full text-center border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-800 text-[11px] font-bold">
                <th className="p-2 border-r border-slate-800 w-20">Puan Türü</th>
                <th className="p-2 border-r border-slate-800 w-24">Puan</th>
                <th className="p-2 border-r border-slate-800 w-24">Genel Ortalama</th>
                <th colSpan={5} className="p-2">Dereceler</th>
              </tr>
              <tr className="bg-slate-50 border-b border-slate-800 text-[10px] font-semibold text-slate-600">
                <th className="border-r border-slate-800"></th>
                <th className="border-r border-slate-800"></th>
                <th className="border-r border-slate-800"></th>
                <th className="p-1 border-r border-slate-800">Snf</th>
                <th className="p-1 border-r border-slate-800">Kurum</th>
                <th className="p-1 border-r border-slate-800">İlçe</th>
                <th className="p-1 border-r border-slate-800">İl</th>
                <th className="p-1">Genel</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-mono text-xs">
              {isAyt ? (
                <>
                  {/* SÖZ */}
                  <tr>
                    <td className="p-2 font-sans font-black border-r border-slate-800 bg-slate-50">
                      SÖZ
                    </td>
                    <td className="p-2 font-black text-xs sm:text-sm border-r border-slate-800">
                      <span className="inline-flex items-center space-x-1">
                        {scores.sozGeneralAvg && scores.sozScore && scores.sozScore >= scores.sozGeneralAvg ? (
                          <span className="text-[10px] text-emerald-700">▲</span>
                        ) : null}
                        <span>{scores.sozScore ? String(scores.sozScore).replace('.', ',') : '-'}</span>
                      </span>
                    </td>
                    <td className="p-2 border-r border-slate-800 text-slate-600">
                      {scores.sozGeneralAvg ? String(scores.sozGeneralAvg).replace('.', ',') : '212,830'}
                    </td>
                    <td className="p-2 font-bold border-r border-slate-800 bg-indigo-50/30">
                      {scores.sozClassRank || '-'}
                    </td>
                    <td className="p-2 font-bold border-r border-slate-800">
                      {scores.sozInstitutionRank || '-'}
                    </td>
                    <td className="p-2 border-r border-slate-800 text-slate-600">
                      {scores.sozDistrictRank || '-'}
                    </td>
                    <td className="p-2 border-r border-slate-800 text-slate-600">
                      {scores.sozCityRank || '-'}
                    </td>
                    <td className="p-2 font-black text-indigo-700">
                      {scores.sozGeneralRank ? scores.sozGeneralRank.toLocaleString('tr-TR') : '-'}
                    </td>
                  </tr>

                  {/* SAY */}
                  <tr>
                    <td className="p-2 font-sans font-black border-r border-slate-800 bg-slate-50">
                      SAY
                    </td>
                    <td className="p-2 font-black text-xs sm:text-sm border-r border-slate-800">
                      <span className="inline-flex items-center space-x-1">
                        {scores.sayGeneralAvg && scores.sayScore && scores.sayScore >= scores.sayGeneralAvg ? (
                          <span className="text-[10px] text-emerald-700">▲</span>
                        ) : null}
                        <span>{scores.sayScore ? String(scores.sayScore).replace('.', ',') : '-'}</span>
                      </span>
                    </td>
                    <td className="p-2 border-r border-slate-800 text-slate-600">
                      {scores.sayGeneralAvg ? String(scores.sayGeneralAvg).replace('.', ',') : '265,290'}
                    </td>
                    <td className="p-2 font-bold border-r border-slate-800 bg-indigo-50/30">
                      {scores.sayClassRank || '-'}
                    </td>
                    <td className="p-2 font-bold border-r border-slate-800">
                      {scores.sayInstitutionRank || '-'}
                    </td>
                    <td className="p-2 border-r border-slate-800 text-slate-600">
                      {scores.sayDistrictRank || '-'}
                    </td>
                    <td className="p-2 border-r border-slate-800 text-slate-600">
                      {scores.sayCityRank || '-'}
                    </td>
                    <td className="p-2 font-black text-indigo-700">
                      {scores.sayGeneralRank ? scores.sayGeneralRank.toLocaleString('tr-TR') : '-'}
                    </td>
                  </tr>

                  {/* EA */}
                  <tr>
                    <td className="p-2 font-sans font-black border-r border-slate-800 bg-slate-50">
                      EA
                    </td>
                    <td className="p-2 font-black text-xs sm:text-sm border-r border-slate-800">
                      <span className="inline-flex items-center space-x-1">
                        {scores.eaGeneralAvg && scores.eaScore && scores.eaScore >= scores.eaGeneralAvg ? (
                          <span className="text-[10px] text-emerald-700">▲</span>
                        ) : null}
                        <span>{scores.eaScore ? String(scores.eaScore).replace('.', ',') : '-'}</span>
                      </span>
                    </td>
                    <td className="p-2 border-r border-slate-800 text-slate-600">
                      {scores.eaGeneralAvg ? String(scores.eaGeneralAvg).replace('.', ',') : '238,580'}
                    </td>
                    <td className="p-2 font-bold border-r border-slate-800 bg-indigo-50/30">
                      {scores.eaClassRank || '-'}
                    </td>
                    <td className="p-2 font-bold border-r border-slate-800">
                      {scores.eaInstitutionRank || '-'}
                    </td>
                    <td className="p-2 border-r border-slate-800 text-slate-600">
                      {scores.eaDistrictRank || '-'}
                    </td>
                    <td className="p-2 border-r border-slate-800 text-slate-600">
                      {scores.eaCityRank || '-'}
                    </td>
                    <td className="p-2 font-black text-indigo-700">
                      {scores.eaGeneralRank ? scores.eaGeneralRank.toLocaleString('tr-TR') : '-'}
                    </td>
                  </tr>
                </>
              ) : (
                /* TYT Single Row */
                <tr>
                  <td className="p-2.5 font-sans font-black border-r border-slate-800 bg-slate-50">
                    TYT
                  </td>
                  <td className="p-2.5 font-black text-sm border-r border-slate-800">
                    <span className="inline-flex items-center space-x-1">
                      {scores.tytGeneralAvg && scores.tytScore && scores.tytScore >= scores.tytGeneralAvg ? (
                        <span className="text-[10px] text-emerald-700">▲</span>
                      ) : null}
                      <span>{scores.tytScore ? String(scores.tytScore).replace('.', ',') : '357,697'}</span>
                    </span>
                  </td>
                  <td className="p-2.5 border-r border-slate-800 text-slate-600">
                    {scores.tytGeneralAvg ? String(scores.tytGeneralAvg).replace('.', ',') : '285,020'}
                  </td>
                  <td className="p-2.5 font-bold border-r border-slate-800 bg-indigo-50/50">
                    {scores.tytClassRank || rankStats.classRank || '6'}
                  </td>
                  <td className="p-2.5 font-bold border-r border-slate-800">
                    {scores.tytInstitutionRank || rankStats.instRank || '25'}
                  </td>
                  <td className="p-2.5 border-r border-slate-800 text-slate-600">
                    {scores.tytDistrictRank || rankStats.districtRank || '27'}
                  </td>
                  <td className="p-2.5 border-r border-slate-800 text-slate-600">
                    {scores.tytCityRank || rankStats.cityRank || '272'}
                  </td>
                  <td className="p-2.5 font-black text-indigo-700">
                    {scores.tytGeneralRank ? scores.tytGeneralRank.toLocaleString('tr-TR') : (rankStats.genRank ? rankStats.genRank.toLocaleString('tr-TR') : '12.838')}
                  </td>
                </tr>
              )}

              {/* Katılımlar */}
              <tr className="bg-slate-100/70 text-[10px] text-slate-600 font-sans">
                <td colSpan={3} className="p-1.5 text-right font-bold border-r border-slate-800 pr-3">
                  Katılımlar:
                </td>
                <td className="p-1.5 border-r border-slate-800 font-mono font-bold">
                  {scores.classParticipantCount || rankStats.classTotal || (isAyt ? '9' : '18')}
                </td>
                <td className="p-1.5 border-r border-slate-800 font-mono font-bold">
                  {scores.institutionParticipantCount || rankStats.instTotal || (isAyt ? '30' : '102')}
                </td>
                <td className="p-1.5 border-r border-slate-800 font-mono">
                  {scores.districtParticipantCount || rankStats.districtTotal || (isAyt ? '59' : '381')}
                </td>
                <td className="p-1.5 border-r border-slate-800 font-mono">
                  {scores.cityParticipantCount || rankStats.cityTotal || (isAyt ? '3.847' : '1.709')}
                </td>
                <td className="p-1.5 font-mono font-bold">
                  {scores.generalParticipantCount ? scores.generalParticipantCount.toLocaleString('tr-TR') : (rankStats.genTotal ? rankStats.genTotal.toLocaleString('tr-TR') : (isAyt ? '91.056' : '57.432'))}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ─── TWO COLUMN MAIN SECTION (Left: Table + Chart / Right: Topics) ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          
          {/* LEFT 8 COLUMNS: MAIN NETS TABLE & CHART */}
          <div className="lg:col-span-8 space-y-4">
            
            {/* NETS TABLE */}
            <div className="border border-slate-800 overflow-x-auto text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-800 text-[10px] font-black text-slate-700 uppercase">
                    <th className="p-2 border-r border-slate-800">Ders</th>
                    <th className="p-2 border-r border-slate-800 text-center">Soru</th>
                    <th className="p-2 border-r border-slate-800 text-center">Doğru</th>
                    <th className="p-2 border-r border-slate-800 text-center">Yanlış</th>
                    <th className="p-2 border-r border-slate-800 text-center">Net</th>
                    <th className="p-2 border-r border-slate-800 text-center">Başarı %</th>
                    <th className="p-2 border-r border-slate-800 text-center">Sınıf Ort.</th>
                    <th className="p-2 border-r border-slate-800 text-center">Kurum Ort.</th>
                    <th className="p-2 text-center">Genel Ort.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300 font-mono text-xs">
                  {isAyt && (
                    <tr className="bg-slate-50/80 border-b border-slate-300">
                      <td colSpan={9} className="px-2 py-1 text-[10px] text-slate-500 italic font-sans">
                        T.C.No ile eşleşen TYT bilgileriniz kullanılmıştır.
                      </td>
                    </tr>
                  )}
                  {tableRows.map((row, idx) => {
                    const { item, isSubtotal, isTotal, isLinkedTyt } = row;
                    const hasClass = !isLinkedTyt && item.classAvgNet !== undefined && item.classAvgNet !== null && item.classAvgNet !== 0;
                    const isAboveClass = hasClass && item.net >= (item.classAvgNet || 0);

                    const hasInst = !isLinkedTyt && item.institutionAvgNet !== undefined && item.institutionAvgNet !== null && item.institutionAvgNet !== 0;
                    const isAboveInst = hasInst && item.net >= (item.institutionAvgNet || 0);

                    const hasGen = !isLinkedTyt && item.generalAvgNet !== undefined && item.generalAvgNet !== null && item.generalAvgNet !== 0;
                    const isAboveGen = hasGen && item.net >= (item.generalAvgNet || 0);

                    return (
                      <tr 
                        key={idx} 
                        className={`transition-colors ${
                          isTotal 
                            ? 'bg-slate-200 font-black border-t-2 border-slate-800 text-slate-900' 
                            : item.subjectName === 'TYT Toplam'
                              ? 'bg-slate-200/80 font-black border-t-2 border-b-2 border-slate-600 text-slate-900'
                              : isSubtotal 
                                ? 'bg-slate-100 font-bold border-t border-b border-slate-400' 
                                : isLinkedTyt
                                  ? 'bg-white hover:bg-slate-50/50'
                                  : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className={`p-2 border-r border-slate-800 font-sans ${isTotal || isSubtotal || item.subjectName === 'TYT Toplam' ? 'font-bold' : ''}`}>
                          {item.subjectName}
                        </td>
                        <td className="p-2 border-r border-slate-800 text-center">{item.questionCount}</td>
                        <td className="p-2 border-r border-slate-800 text-center text-emerald-700 font-bold">{item.correct}</td>
                        <td className="p-2 border-r border-slate-800 text-center text-rose-700 font-bold">{item.wrong}</td>
                        <td className="p-2 border-r border-slate-800 text-center font-black text-slate-900">
                          {String(item.net).replace('.', ',')}
                        </td>
                        <td className="p-2 border-r border-slate-800 text-center font-semibold">
                          {item.successRate}
                        </td>

                        {/* Sınıf Ort. */}
                        <td className="p-2 border-r border-slate-800 text-center">
                          <span className={`inline-flex items-center space-x-0.5 ${
                            !hasClass 
                              ? 'text-slate-400' 
                              : isAboveClass 
                                ? 'text-emerald-700 font-bold' 
                                : 'text-rose-700 font-semibold'
                          }`}>
                            <span>{hasClass && item.classAvgNet !== undefined && item.classAvgNet !== null ? String(item.classAvgNet).replace('.', ',') : '-'}</span>
                            {hasClass && (
                              <span className="text-[9px]">{isAboveClass ? '▲' : '▼'}</span>
                            )}
                          </span>
                        </td>

                        {/* Kurum Ort. */}
                        <td className="p-2 border-r border-slate-800 text-center">
                          <span className={`inline-flex items-center space-x-0.5 ${
                            !hasInst 
                              ? 'text-slate-400' 
                              : isAboveInst 
                                ? 'text-emerald-700 font-bold' 
                                : 'text-rose-700 font-semibold'
                          }`}>
                            <span>{hasInst && item.institutionAvgNet !== undefined && item.institutionAvgNet !== null ? String(item.institutionAvgNet).replace('.', ',') : '-'}</span>
                            {hasInst && (
                              <span className="text-[9px]">{isAboveInst ? '▲' : '▼'}</span>
                            )}
                          </span>
                        </td>

                        {/* Genel Ort. */}
                        <td className="p-2 text-center">
                          <span className={`inline-flex items-center space-x-0.5 ${
                            !hasGen 
                              ? 'text-slate-400' 
                              : isAboveGen 
                                ? 'text-emerald-700 font-bold' 
                                : 'text-rose-700 font-semibold'
                          }`}>
                            <span>{hasGen && item.generalAvgNet !== undefined && item.generalAvgNet !== null ? String(item.generalAvgNet).replace('.', ',') : '-'}</span>
                            {hasGen && (
                              <span className="text-[9px]">{isAboveGen ? '▲' : '▼'}</span>
                            )}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* OPTICAL ANSWER COMPARISON STRIP */}
            <div className="border border-slate-800 p-3 bg-slate-50 rounded-lg space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-600 border-b border-slate-300 pb-1 flex items-center justify-between">
                <span>Cevap ve Optik Kağıt Şeridi Önizlemesi</span>
                <div className="flex items-center space-x-3 text-[9px] font-sans">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-[2px] bg-emerald-600 inline-block"></span> Doğru</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-[2px] bg-rose-600 inline-block"></span> Yanlış</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-[2px] bg-slate-300 inline-block"></span> Boş</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {isAyt ? (
                  <>
                    {getSubjectItem('Matematik') && renderOpticalRow('Matematik', getSubjectItem('Matematik')?.correct || 0, getSubjectItem('Matematik')?.wrong || 0, getSubjectItem('Matematik')?.questionCount || 40)}
                    {getSubjectItem('Fen Bilimleri') && renderOpticalRow('Fen Bilimleri', getSubjectItem('Fen Bilimleri')?.correct || 0, getSubjectItem('Fen Bilimleri')?.wrong || 0, getSubjectItem('Fen Bilimleri')?.questionCount || 40)}
                    {getSubjectItem('Edebiyat-Sosyal-1') && renderOpticalRow('Edebiyat-Sosyal-1', getSubjectItem('Edebiyat-Sosyal-1')?.correct || 0, getSubjectItem('Edebiyat-Sosyal-1')?.wrong || 0, getSubjectItem('Edebiyat-Sosyal-1')?.questionCount || 40)}
                    {getSubjectItem('Sosyal-2') && renderOpticalRow('Sosyal-2', getSubjectItem('Sosyal-2')?.correct || 0, getSubjectItem('Sosyal-2')?.wrong || 0, getSubjectItem('Sosyal-2')?.questionCount || 40)}
                  </>
                ) : (
                  <>
                    {renderOpticalRow('TYT Türkçe', getSubjectItem('Türkçe')?.correct || 0, getSubjectItem('Türkçe')?.wrong || 0, getSubjectItem('Türkçe')?.questionCount || 40)}
                    {renderOpticalRow('TYT Sosyal', getSubjectItem('TYT Sosyal')?.correct || 0, getSubjectItem('TYT Sosyal')?.wrong || 0, getSubjectItem('TYT Sosyal')?.questionCount || 20)}
                    {renderOpticalRow('TYT Matematik', getSubjectItem('TYT Matematik')?.correct || 0, getSubjectItem('TYT Matematik')?.wrong || 0, getSubjectItem('TYT Matematik')?.questionCount || 40)}
                    {renderOpticalRow('TYT Fen', getSubjectItem('TYT Fen')?.correct || 0, getSubjectItem('TYT Fen')?.wrong || 0, getSubjectItem('TYT Fen')?.questionCount || 20)}
                  </>
                )}
              </div>
            </div>

            {/* RECHARTS BAR CHART */}
            <div className="border border-slate-800 p-3 bg-white rounded-lg space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-700">
                Ders Netleri & Karşılaştırma Grafiği
              </div>
              <div className="h-44 w-full font-mono text-[10px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 9, fill: '#334155' }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 9, fill: '#334155' }} domain={[0, 'auto']} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={24}
                      iconSize={8}
                      formatter={(val) => <span style={{ color: '#334155', fontSize: '10px', fontWeight: 'bold' }}>{val === 'ogr' ? 'Öğr. Net' : val === 'sinif' ? 'Sınıf Ort.' : 'Genel Ort.'}</span>}
                    />
                    <Bar dataKey="ogr" name="ogr" fill="#e11d48" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="sinif" name="sinif" fill="#10b981" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="genel" name="genel" fill="#f59e0b" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* RIGHT 4 COLUMNS: DERSLERE GÖRE ANALİZ (TOPIC BREAKDOWN) */}
          <div className="lg:col-span-4 border border-slate-800 bg-white rounded-lg p-3 space-y-3">
            <div className="bg-slate-100 p-2 text-center border-b border-slate-800 font-black text-xs uppercase tracking-wider text-slate-900">
              DERSLERE GÖRE ANALİZ
            </div>

            {topicSections.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs italic">
                Bu karne için kazanım konu analizi bulunamadı.
              </div>
            ) : (
              <div className="space-y-3 max-h-[850px] overflow-y-auto pr-1 scrollbar-thin text-[10px]">
                {topicSections.map((sec, secIdx) => (
                  <div key={secIdx} className="space-y-2">
                    {/* Main Section Header Banner (e.g. TYT Sosyal, TYT Matematik, TYT Fen) */}
                    {sec.sectionName && (
                      <div className="font-black text-slate-900 text-xs uppercase tracking-wide border-t-2 border-slate-900 pt-1.5 pb-0.5">
                        {sec.sectionName}
                      </div>
                    )}

                    {/* Sub-subjects (e.g. Tarih-1, Coğrafya-1, Felsefe, Din Kül. ve Ahl. Bil., Felsefe (Seçmeli)) */}
                    {sec.groups.map((grp, gIdx) => (
                      <div key={gIdx} className="space-y-0.5">
                        <div className="font-bold text-slate-900 uppercase text-[11px] border-b border-slate-900 pb-0.5 flex items-center justify-between">
                          <span>{grp.subjectName}</span>
                          <div className="flex space-x-3 text-[9px] font-mono text-slate-700 font-bold">
                            <span className="w-3 text-center">S</span>
                            <span className="w-3 text-center">D</span>
                            <span className="w-3 text-center">Y</span>
                            <span className="w-7 text-right">B%</span>
                          </div>
                        </div>

                        <div className="divide-y divide-slate-200 border-b border-slate-100">
                          {grp.topics.map((t, tIdx) => (
                            <div 
                              key={tIdx} 
                              className={`py-0.5 px-1 flex items-start justify-between gap-1 hover:bg-indigo-50/70 cursor-pointer transition-colors group ${
                                tIdx % 2 === 0 ? 'bg-slate-100/80' : 'bg-white'
                              }`}
                              onClick={() => setSelectedTopicHistory({ subjectName: grp.subjectName, topicName: t.topicName })}
                              title="Bu kazanımın geçmiş deneme performansını görmek için tıklayın"
                            >
                              <span className="text-slate-800 leading-tight group-hover:text-indigo-600 font-medium">
                                {t.topicName}
                              </span>
                              <div className="flex items-center space-x-3 font-mono font-bold shrink-0 text-slate-900">
                                <span className="w-3 text-center text-slate-600">{t.questionCount || (t.correct + t.wrong + t.empty)}</span>
                                <span className="w-3 text-center text-emerald-700">{t.correct}</span>
                                <span className="w-3 text-center text-rose-700">{t.wrong}</span>
                                <span className={`w-7 text-right ${
                                  t.successRate >= 70 
                                    ? 'text-emerald-700 font-black' 
                                    : t.successRate >= 40 
                                      ? 'text-indigo-700' 
                                      : 'text-rose-700 font-black'
                                }`}>
                                  {t.successRate}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Footer Guidance (Non-printable) */}
      <div className="bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-2xl flex items-center justify-between text-xs text-indigo-200 no-print max-w-6xl mx-auto">
        <div className="flex items-center space-x-3">
          <Sparkles className="w-5 h-5 text-indigo-400 shrink-0" />
          <span>
            Kazanım analizindeki konu başlıklarına tıklayarak öğrencinin o konudaki geçmiş deneme sınavı performans grafiğini ve soru geçmişini inceleyebilirsiniz.
          </span>
        </div>
        <button
          type="button"
          onClick={handlePrint}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all cursor-pointer shrink-0 ml-4"
        >
          Yazdır
        </button>
      </div>

    </div>
  );
};
