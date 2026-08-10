import React, { useState, useCallback } from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  Upload, 
  FileText, 
  Users, 
  RefreshCw, 
  FileSpreadsheet, 
  XCircle 
} from 'lucide-react';
import { ParsedStudentRow, UserAccount, YKSDataState, InstitutionalSubjectDetail, InstitutionalMockExam } from '../../types';
import { DuplicateConfirmModal } from './BulkImportModals';

interface BulkImportCsvTabProps {
  currentUser: UserAccount;
  studentUsers: UserAccount[];
  availableClasses: string[];
  studentsData: Record<string, YKSDataState>;
  examsToUse: InstitutionalMockExam[];
  onSaveInstitutionalExams: (exams: InstitutionalMockExam[]) => void;
  onDeleteInstitutionalExam?: (examId: string | string[]) => void;
  onAddAuditLog?: (message: string, type: 'exam' | 'system' | 'user' | 'target', entityId?: string) => void;
  getMappedClassName: (clsName: string | undefined | null) => string;
  findBestClassMatch: (fileClassName: string) => string;
  onImportComplete: () => void;
}

export const BulkImportCsvTab: React.FC<BulkImportCsvTabProps> = ({
  currentUser,
  studentUsers,
  availableClasses,
  studentsData,
  examsToUse,
  onSaveInstitutionalExams,
  onDeleteInstitutionalExam,
  onAddAuditLog,
  getMappedClassName,
  findBestClassMatch,
  onImportComplete
}) => {
  const [examTitle, setExamTitle] = useState('');
  const [examDate, setExamDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [examType, setExamType] = useState<'TYT' | 'AYT' | 'Ara Sınıf'>('TYT');
  const [rawText, setRawText] = useState('');
  const [parsedRows, setParsedRows] = useState<ParsedStudentRow[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [importSuccessMessage, setImportSuccessMessage] = useState<string | null>(null);
  const [activeClassTab, setActiveClassTab] = useState<string>('all');

  const [duplicateWarning, setDuplicateWarning] = useState<{
    examTitle: string;
    existingExams: InstitutionalMockExam[];
    pendingRows: ParsedStudentRow[];
  } | null>(null);

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

  const parseNum = (val: string | undefined): number => {
    if (!val) return 0;
    const num = parseFloat(String(val).replace(',', '.').replace(/[^0-9.-]/g, ''));
    return isNaN(num) ? 0 : num;
  };

  const parseNumOpt = (val: string | undefined): number | undefined => {
    if (!val) return undefined;
    const num = parseFloat(String(val).replace(',', '.').replace(/[^0-9.-]/g, ''));
    return isNaN(num) ? undefined : num;
  };

  const getStudentsForClass = (selectedClass?: string) => {
    if (!selectedClass || selectedClass === 'all') {
      return studentUsers;
    }
    return studentUsers.filter(st => {
      const stClass = st.className || studentsData[st.id]?.profile?.className || '';
      return getMappedClassName(stClass) === selectedClass || stClass === selectedClass;
    });
  };

  const importedClassesTabs = React.useMemo(() => {
    const classSet = new Set<string>();
    parsedRows.forEach(r => {
      const fileCls = getMappedClassName(r.fileClassName);
      if (fileCls) classSet.add(fileCls);
      if (r.selectedClassForMatch && r.selectedClassForMatch !== 'all') {
        classSet.add(getMappedClassName(r.selectedClassForMatch));
      }
      if (r.matchedStudentId) {
        const u = studentUsers.find(st => st.id === r.matchedStudentId);
        const c = u?.className || studentsData[r.matchedStudentId]?.profile?.className;
        if (c) classSet.add(getMappedClassName(c));
      }
    });
    return Array.from(classSet).sort();
  }, [parsedRows, studentUsers, studentsData, getMappedClassName]);

  const isRowInActiveTabForCls = (row: ParsedStudentRow, targetCls: string) => {
    if (targetCls === 'all') return true;
    if (getMappedClassName(row.fileClassName) === targetCls) return true;
    if (getMappedClassName(row.selectedClassForMatch) === targetCls) return true;
    if (row.matchedStudentId) {
      const u = studentUsers.find(st => st.id === row.matchedStudentId);
      const c = u?.className || studentsData[row.matchedStudentId]?.profile?.className;
      if (getMappedClassName(c) === targetCls) return true;
    }
    return false;
  };

  const findBestStudentMatch = (fileStudentName: string, fileSchoolNumber: string, fileClassName: string) => {
    const normFileName = normalizeText(fileStudentName);
    const normFileNum = (fileSchoolNumber || '').trim();
    const mappedClass = findBestClassMatch(fileClassName);
    const normFileClass = normalizeText(mappedClass !== 'all' ? mappedClass : fileClassName);

    let bestUser: UserAccount | null = null;
    let bestScore = 0;
    let reason = 'Eşleşme Bulunamadı';

    for (const student of studentUsers) {
      const studentProfile = studentsData[student.id]?.profile;
      const studentNum = (student.schoolNumber || studentProfile?.schoolNumber || '').trim();
      const normStudentName = normalizeText(student.name);
      const normStudentClass = normalizeText(student.className || studentProfile?.className || '');

      if (normFileNum && studentNum && normFileNum === studentNum && normFileName === normStudentName) {
        return { studentId: student.id, score: 100, reason: 'Tam Eşleşme (Okul No + Ad Soyad)' };
      }
      if (normFileNum && studentNum && normFileNum === studentNum) {
        if (85 > bestScore) {
          bestScore = 90;
          bestUser = student;
          reason = `Okul No Eşleşti (#${studentNum})`;
        }
      }
      if (normFileName === normStudentName && normFileClass && normStudentClass && normFileClass === normStudentClass) {
        if (95 > bestScore) {
          bestScore = 95;
          bestUser = student;
          reason = 'Ad Soyad + Sınıf Eşleşti';
        }
      }
      if (normFileName === normStudentName) {
        if (80 > bestScore) {
          bestScore = 80;
          bestUser = student;
          reason = 'Ad Soyad Eşleşti';
        }
      }
      if (normFileName.length > 3 && (normStudentName.includes(normFileName) || normFileName.includes(normStudentName))) {
        if (65 > bestScore) {
          bestScore = 65;
          bestUser = student;
          reason = 'Benzer İsim Tahmini';
        }
      }
    }

    return {
      studentId: bestUser ? bestUser.id : null,
      score: bestScore,
      reason: bestUser ? reason : 'Eşleşme Bulunamadı'
    };
  };

  const parseRankAndTotalVal = (val: string | undefined): { rank: number; total?: number } => {
    if (!val) return { rank: 0 };
    const str = String(val).trim();
    if (str.includes('/')) {
      const parts = str.split('/');
      const rank = parseInt(parts[0].replace(/[^0-9]/g, '')) || 0;
      const total = parseInt(parts[1].replace(/[^0-9]/g, '')) || undefined;
      return { rank, total };
    }
    const rank = parseInt(str.replace(/[^0-9]/g, '')) || 0;
    return { rank };
  };

  const parseDelimitedText = (text: string) => {
    setIsParsing(true);
    setImportSuccessMessage(null);

    setTimeout(() => {
      try {
        const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
        if (lines.length < 2) {
          setParsedRows([]);
          setIsParsing(false);
          return;
        }

        const firstLine = lines[0];
        let delimiter = ';';
        if (firstLine.includes(';')) delimiter = ';';
        else if (firstLine.includes('\t')) delimiter = '\t';
        else if (firstLine.includes(',')) delimiter = ',';

        const headers = firstLine.split(delimiter).map(h => h.trim());
        const normHeaders = headers.map(h => normalizeText(h));

        const nameIdx = normHeaders.findIndex(h => h.includes('ogrenci') || h.includes('ad') || h.includes('isim'));
        const numIdx = normHeaders.findIndex(h => h.includes('okul') || h.includes('numara') || h === 'no' || h.endsWith('no'));
        const classIdx = normHeaders.findIndex(h => h === 'sinif' || h === 'sube' || h.startsWith('sinif') || h.startsWith('sube'));

        const sayScoreIdx = normHeaders.findIndex(h => h.includes('saypuan'));
        const eaScoreIdx = normHeaders.findIndex(h => h.includes('eapuan'));
        const sozScoreIdx = normHeaders.findIndex(h => h.includes('sozpuan'));

        const sayClassRankIdx = normHeaders.findIndex(h => h.includes('saysinifsira') || h.includes('sayssira') || h.includes('sinifsira'));
        const sayInstRankIdx = normHeaders.findIndex(h => h.includes('saykurumsira') || h.includes('sayksira') || h.includes('kurumsira'));
        const sayGenRankIdx = normHeaders.findIndex(h => h.includes('saygenelsira') || h.includes('saygsira') || h.includes('genelsira'));

        const classTotalIdx = normHeaders.findIndex(h => h.includes('sinifkatilim') || h.includes('siniftoplam') || h.includes('katilimsinif'));
        const instTotalIdx = normHeaders.findIndex(h => h.includes('kurumkatilim') || h.includes('kurumtoplam') || h.includes('katilimkurum'));
        const genTotalIdx = normHeaders.findIndex(h => h.includes('genelkatilim') || h.includes('geneltoplam') || h.includes('katilimlar') || h.includes('katilimgenel'));

        const subjectIdx = normHeaders.findIndex(h => h.includes('dersadi') || (h.includes('ders') && !h.includes('soru') && !h.includes('dogru') && !h.includes('yanlis') && !h.includes('net') && !h.includes('basari') && !h.includes('ort')));
        const subQuestIdx = normHeaders.findIndex(h => h.includes('derssoru'));
        const subCorrectIdx = normHeaders.findIndex(h => h.includes('dersdogru'));
        const subWrongIdx = normHeaders.findIndex(h => h.includes('dersyanlis'));
        const subNetIdx = normHeaders.findIndex(h => h.includes('dersnet'));
        const subSuccessIdx = normHeaders.findIndex(h => h.includes('dersbasari'));

        const subClassAvgIdx = normHeaders.findIndex(h => h.includes('derssinifort'));
        const subInstAvgIdx = normHeaders.findIndex(h => h.includes('derskurumort'));
        const subGenAvgIdx = normHeaders.findIndex(h => h.includes('dersgenelort'));

        const topicNameIdx = normHeaders.findIndex(h => h.includes('konu') || h.includes('kazanim'));
        const topicQuestIdx = normHeaders.findIndex(h => h.includes('konusoru'));
        const topicCorrectIdx = normHeaders.findIndex(h => h.includes('konudogru'));
        const topicWrongIdx = normHeaders.findIndex(h => h.includes('konuyanlis'));
        const topicEmptyIdx = normHeaders.findIndex(h => h.includes('konubos'));
        const topicSuccessIdx = normHeaders.findIndex(h => h.includes('konubasari'));

        const studentMap = new Map<string, any>();
        const classStudentCountMap = new Map<string, Set<string>>();

        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(delimiter).map(c => c.trim());
          if (cols.length < 2) continue;

          const studentName = (cols[nameIdx !== -1 ? nameIdx : 0] || 'Öğrenci').replace(/['"]/g, '');
          const schoolNumber = numIdx !== -1 ? cols[numIdx] || '' : '';
          const className = classIdx !== -1 ? cols[classIdx] || '' : '';

          const key = `${studentName}_${schoolNumber}_${className}`;

          if (!classStudentCountMap.has(className)) {
            classStudentCountMap.set(className, new Set());
          }
          classStudentCountMap.get(className)?.add(key);

          if (!studentMap.has(key)) {
            const parsedSayClassRank = sayClassRankIdx !== -1 ? parseRankAndTotalVal(cols[sayClassRankIdx]) : { rank: 0 };
            const parsedSayInstRank = sayInstRankIdx !== -1 ? parseRankAndTotalVal(cols[sayInstRankIdx]) : { rank: 0 };
            const parsedSayGenRank = sayGenRankIdx !== -1 ? parseRankAndTotalVal(cols[sayGenRankIdx]) : { rank: 0 };

            const explicitClassTotal = classTotalIdx !== -1 ? parseInt(cols[classTotalIdx]) || undefined : undefined;
            const explicitInstTotal = instTotalIdx !== -1 ? parseInt(cols[instTotalIdx]) || undefined : undefined;
            const explicitGenTotal = genTotalIdx !== -1 ? parseInt(cols[genTotalIdx]) || undefined : undefined;

            studentMap.set(key, {
              fileStudentName: studentName,
              fileSchoolNumber: schoolNumber,
              fileClassName: className,
              sayScore: sayScoreIdx !== -1 ? parseNum(cols[sayScoreIdx]) : 0,
              eaScore: eaScoreIdx !== -1 ? parseNum(cols[eaScoreIdx]) : 0,
              sozScore: sozScoreIdx !== -1 ? parseNum(cols[sozScoreIdx]) : 0,
              sayClassRank: parsedSayClassRank.rank,
              sayClassTotal: parsedSayClassRank.total || explicitClassTotal,
              sayInstitutionRank: parsedSayInstRank.rank,
              sayInstitutionTotal: parsedSayInstRank.total || explicitInstTotal,
              sayGeneralRank: parsedSayGenRank.rank,
              sayGeneralTotal: parsedSayGenRank.total || explicitGenTotal,
              eaClassRank: 0,
              eaInstitutionRank: 0,
              eaGeneralRank: 0,
              sozClassRank: 0,
              sozInstitutionRank: 0,
              sozGeneralRank: 0,
              subjectsMap: new Map<string, any>()
            });
          }

          const stObj = studentMap.get(key);
          const subjectName = subjectIdx !== -1 ? cols[subjectIdx] || 'Genel Ders' : 'Türkçe';

          const subCorrect = subCorrectIdx !== -1 ? parseInt(cols[subCorrectIdx]) || 0 : 0;
          const subWrong = subWrongIdx !== -1 ? parseInt(cols[subWrongIdx]) || 0 : 0;
          const subQuest = subQuestIdx !== -1 ? parseInt(cols[subQuestIdx]) || 40 : 40;
          const subNetParsed = subNetIdx !== -1 ? parseNumOpt(cols[subNetIdx]) : undefined;
          const subSuccess = subSuccessIdx !== -1 ? parseNum(cols[subSuccessIdx]) : 0;
          const classAvg = subClassAvgIdx !== -1 ? parseNumOpt(cols[subClassAvgIdx]) : undefined;
          const instAvg = subInstAvgIdx !== -1 ? parseNumOpt(cols[subInstAvgIdx]) : undefined;
          const genAvg = subGenAvgIdx !== -1 ? parseNumOpt(cols[subGenAvgIdx]) : undefined;

          if (!stObj.subjectsMap.has(subjectName)) {
            stObj.subjectsMap.set(subjectName, {
              subjectName,
              questionCount: subQuest,
              correct: subCorrect,
              wrong: subWrong,
              net: subNetParsed,
              successRate: subSuccess,
              classAvgNet: classAvg,
              institutionAvgNet: instAvg,
              generalAvgNet: genAvg,
              topics: []
            });
          } else {
            const existingSub = stObj.subjectsMap.get(subjectName);
            if (subCorrect > 0) existingSub.correct = Math.max(existingSub.correct, subCorrect);
            if (subWrong > 0) existingSub.wrong = Math.max(existingSub.wrong, subWrong);
            if (subQuest > 0) existingSub.questionCount = Math.max(existingSub.questionCount, subQuest);
            if (classAvg !== undefined) existingSub.classAvgNet = classAvg;
            if (instAvg !== undefined) existingSub.institutionAvgNet = instAvg;
            if (genAvg !== undefined) existingSub.generalAvgNet = genAvg;
          }

          const subjObj = stObj.subjectsMap.get(subjectName);
          const topicName = topicNameIdx !== -1 ? cols[topicNameIdx] : null;

          if (topicName && topicName.length > 0) {
            const topicQuest = topicQuestIdx !== -1 ? parseInt(cols[topicQuestIdx]) || 0 : 0;
            const topicCorr = topicCorrectIdx !== -1 ? parseInt(cols[topicCorrectIdx]) || 0 : 0;
            const topicWrng = topicWrongIdx !== -1 ? parseInt(cols[topicWrongIdx]) || 0 : 0;
            const topicEmp = topicEmptyIdx !== -1 ? parseInt(cols[topicEmptyIdx]) || 0 : 0;
            const topicSucc = topicSuccessIdx !== -1 ? parseNum(cols[topicSuccessIdx]) : 0;

            const topicNet = Number((topicCorr - topicWrng * 0.25).toFixed(2));
            const calcTopicSucc = topicQuest > 0 ? Number(((Math.max(0, topicNet) / topicQuest) * 100).toFixed(1)) : topicSucc;

            subjObj.topics.push({
              topicName,
              questionCount: topicQuest,
              correct: topicCorr,
              wrong: topicWrng,
              empty: topicEmp,
              successRate: calcTopicSucc > 0 ? calcTopicSucc : topicSucc
            });
          }
        }

        const totalStudentsInFile = studentMap.size;
        const result: ParsedStudentRow[] = [];

        studentMap.forEach((st) => {
          const matchRes = findBestStudentMatch(st.fileStudentName, st.fileSchoolNumber, st.fileClassName);
          const subjects: InstitutionalSubjectDetail[] = [];

          st.subjectsMap.forEach((subj: any) => {
            if (subj.topics && subj.topics.length > 0) {
              const topicTotalCorr = subj.topics.reduce((acc: number, t: any) => acc + (t.correct || 0), 0);
              const topicTotalWrng = subj.topics.reduce((acc: number, t: any) => acc + (t.wrong || 0), 0);
              const topicTotalQuest = subj.topics.reduce((acc: number, t: any) => acc + (t.questionCount || 0), 0);

              if (subj.correct === 0 && subj.wrong === 0 && (topicTotalCorr > 0 || topicTotalWrng > 0)) {
                subj.correct = topicTotalCorr;
                subj.wrong = topicTotalWrng;
                if (topicTotalQuest > 0) subj.questionCount = topicTotalQuest;
              }
            }

            const calculatedNet = Number(((subj.correct || 0) - (subj.wrong || 0) * 0.25).toFixed(2));
            subj.net = (subj.correct > 0 || subj.wrong > 0 || subj.net === undefined)
              ? calculatedNet
              : subj.net;

            if (subj.questionCount > 0) {
              subj.successRate = Number((Math.max(0, subj.net / subj.questionCount) * 100).toFixed(1));
            }

            subjects.push({
              ...subj,
              topics: subj.topics
            });
          });

          const matchedUser = matchRes.studentId ? studentUsers.find(u => u.id === matchRes.studentId) : undefined;
          let rowClassMatch = 'all';
          if (matchedUser) {
            rowClassMatch = matchedUser.className || studentsData[matchedUser.id]?.profile?.className || 'all';
          }
          if (!rowClassMatch || rowClassMatch === 'all') {
            rowClassMatch = findBestClassMatch(st.fileClassName);
          }

          const calculatedClassTotal = st.sayClassTotal || classStudentCountMap.get(st.fileClassName)?.size || 0;
          const calculatedInstTotal = st.sayInstitutionTotal || totalStudentsInFile || 0;
          const calculatedGenTotal = st.sayGeneralTotal || 0;

          result.push({
            fileStudentName: st.fileStudentName,
            fileSchoolNumber: st.fileSchoolNumber,
            fileClassName: st.fileClassName,
            matchedStudentId: matchRes.studentId,
            selectedClassForMatch: rowClassMatch,
            matchScore: matchRes.score,
            matchReason: matchRes.reason,
            isSelected: true,
            sayScore: st.sayScore,
            eaScore: st.eaScore,
            sozScore: st.sozScore,
            sayClassRank: st.sayClassRank,
            sayClassTotal: calculatedClassTotal,
            sayInstitutionRank: st.sayInstitutionRank,
            sayInstitutionTotal: calculatedInstTotal,
            sayGeneralRank: st.sayGeneralRank,
            sayGeneralTotal: calculatedGenTotal,
            eaClassRank: st.eaClassRank,
            eaClassTotal: calculatedClassTotal,
            eaInstitutionRank: st.eaInstitutionRank,
            eaInstitutionTotal: calculatedInstTotal,
            eaGeneralRank: st.eaGeneralRank,
            eaGeneralTotal: calculatedGenTotal,
            sozClassRank: st.sozClassRank,
            sozClassTotal: calculatedClassTotal,
            sozInstitutionRank: st.sozInstitutionRank,
            sozInstitutionTotal: calculatedInstTotal,
            sozGeneralRank: st.sozGeneralRank,
            sozGeneralTotal: calculatedGenTotal,
            subjects
          });
        });

        setParsedRows(result);
      } catch (err) {
        console.error("Parse error:", err);
      } finally {
        setIsParsing(false);
      }
    }, 200);
  };

  const extractExamTitleFromFilename = (filename: string): string => {
    if (!filename) return '';
    let name = filename.replace(/\.[^/.]+$/, '');
    name = name.replace(/[_-]*(Sinav|Sınav)[_-]*(Sonuc|Sonuç)[_-]*(Analiz[iı]?)?$/i, '');
    name = name.replace(/[_-]*(Sonuc|Sonuç)[_-]*(Analiz[iı]?)?$/i, '');
    name = name.replace(/[_-]*(Sinav|Sınav)$/i, '');
    name = name.replace(/[_-]*(Analiz[iı]?)$/i, '');
    name = name.replace(/_/g, ' ');
    return name.replace(/\s+/g, ' ').trim();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const autoDetectedTitle = extractExamTitleFromFilename(file.name);
    if (autoDetectedTitle) setExamTitle(autoDetectedTitle);

    const lowerFileName = file.name.toLowerCase();
    if (lowerFileName.includes('tyt')) setExamType('TYT');
    else if (lowerFileName.includes('ayt')) setExamType('AYT');
    else if (lowerFileName.includes('lgs') || lowerFileName.includes('ara')) setExamType('Ara Sınıf');

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setRawText(content);
        parseDelimitedText(content);
      }
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleRowClassChange = (rowIndex: number, newClass: string) => {
    setParsedRows(prev => {
      const updated = [...prev];
      const row = { ...updated[rowIndex] };
      row.selectedClassForMatch = newClass;

      if (row.matchedStudentId) {
        const matchedUser = studentUsers.find(u => u.id === row.matchedStudentId);
        const userClass = matchedUser?.className || studentsData[row.matchedStudentId]?.profile?.className || '';
        
        if (newClass !== 'all' && userClass !== newClass) {
          const studentsInNewClass = getStudentsForClass(newClass);
          const autoMatchInNewClass = studentsInNewClass.find(u => 
            normalizeText(u.name) === normalizeText(row.fileStudentName) ||
            (row.fileSchoolNumber && u.schoolNumber === row.fileSchoolNumber)
          );

          if (autoMatchInNewClass) {
            row.matchedStudentId = autoMatchInNewClass.id;
            row.matchScore = 85;
            row.matchReason = `Sınıfta Eşleşti (${newClass})`;
            row.isSelected = true;
          } else {
            row.matchedStudentId = null;
            row.matchScore = 0;
            row.matchReason = 'Yeni Sınıfta Seçilmedi';
            row.isSelected = false;
          }
        }
      } else if (newClass !== 'all') {
        const studentsInNewClass = getStudentsForClass(newClass);
        const autoMatchInNewClass = studentsInNewClass.find(u => 
          normalizeText(u.name) === normalizeText(row.fileStudentName) ||
          (row.fileSchoolNumber && u.schoolNumber === row.fileSchoolNumber)
        );
        if (autoMatchInNewClass) {
          row.matchedStudentId = autoMatchInNewClass.id;
          row.matchScore = 85;
          row.matchReason = `Sınıfta Eşleşti (${newClass})`;
          row.isSelected = true;
        }
      }

      updated[rowIndex] = row;
      return updated;
    });
  };

  const handleManualMatchChange = (rowIndex: number, studentId: string) => {
    setParsedRows(prev => {
      const updated = [...prev];
      if (studentId === 'none') {
        updated[rowIndex].matchedStudentId = null;
        updated[rowIndex].matchScore = 0;
        updated[rowIndex].matchReason = 'Eşleştirilmedi';
        updated[rowIndex].isSelected = false;
      } else {
        const found = studentUsers.find(u => u.id === studentId);
        updated[rowIndex].matchedStudentId = studentId;
        updated[rowIndex].matchScore = 100;
        updated[rowIndex].matchReason = found ? `Manuel Seçildi (${found.name})` : 'Manuel Seçildi';
        updated[rowIndex].isSelected = true;
        
        const foundClass = found?.className || studentsData[studentId]?.profile?.className;
        if (foundClass) {
          updated[rowIndex].selectedClassForMatch = foundClass;
        }
      }
      return updated;
    });
  };

  const executeSaveImport = (selectedRows: ParsedStudentRow[], isOverwriting = false, deletedCount = 0) => {
    const now = new Date().toISOString();
    const createdExams: InstitutionalMockExam[] = selectedRows.map(row => {
      const targetUser = row.matchedStudentId ? studentUsers.find(u => u.id === row.matchedStudentId) : null;
      const studentName = targetUser?.name || row.fileStudentName;
      const schoolNumber = targetUser?.schoolNumber || row.fileSchoolNumber;
      const rawClass = row.selectedClassForMatch !== 'all'
        ? row.selectedClassForMatch
        : (targetUser?.className || row.fileClassName);
      const className = getMappedClassName(rawClass);

      return {
        id: `inst-exam-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        examTitle,
        examDate,
        examType,
        createdByName: currentUser?.name || 'Rehberlik Servisi',
        createdById: currentUser?.id,
        createdAt: now,
        studentId: row.matchedStudentId || undefined,
        studentName,
        schoolNumber,
        className,
        scores: {
          sayScore: row.sayScore,
          eaScore: row.eaScore,
          sozScore: row.sozScore,
          sayClassRank: row.sayClassRank,
          sayClassTotal: row.sayClassTotal,
          sayInstitutionRank: row.sayInstitutionRank,
          sayInstitutionTotal: row.sayInstitutionTotal,
          sayGeneralRank: row.sayGeneralRank,
          sayGeneralTotal: row.sayGeneralTotal,
          eaClassRank: row.eaClassRank,
          eaClassTotal: row.eaClassTotal,
          eaInstitutionRank: row.eaInstitutionRank,
          eaInstitutionTotal: row.eaInstitutionTotal,
          eaGeneralRank: row.eaGeneralRank,
          eaGeneralTotal: row.eaGeneralTotal,
          sozClassRank: row.sozClassRank,
          sozClassTotal: row.sozClassTotal,
          sozInstitutionRank: row.sozInstitutionRank,
          sozInstitutionTotal: row.sozInstitutionTotal,
          sozGeneralRank: row.sozGeneralRank,
          sozGeneralTotal: row.sozGeneralTotal,
          classParticipantCount: row.sayClassTotal,
          institutionParticipantCount: row.sayInstitutionTotal,
          generalParticipantCount: row.sayGeneralTotal
        },
        subjects: row.subjects
      };
    });

    onSaveInstitutionalExams(createdExams);
    
    const matchedSaved = createdExams.filter(e => e.studentId).length;
    const unmatchedSaved = createdExams.filter(e => !e.studentId).length;

    if (onAddAuditLog) {
      onAddAuditLog(
        `Toplu Kurumsal Deneme Girişi Yapıldı: "${examTitle}" (${createdExams.length} kayıt eklendi; ${matchedSaved} eşleşmiş, ${unmatchedSaved} eşleşmemiş${isOverwriting ? `; ${deletedCount} eski kayıt silindi` : ''}).`,
        'exam',
        'bulk_exam_import'
      );
    }

    setImportSuccessMessage(
      `${createdExams.length} adet deneme sonucu kaydedildi! ${isOverwriting ? `(${deletedCount} eski kayıt yenisiyle değiştirildi).` : `(${matchedSaved} eşleşmiş öğrenci profiline aktarıldı, ${unmatchedSaved} eşleşmemiş olarak kaydedildi).`}`
    );
    setParsedRows([]);
    setRawText('');
    setDuplicateWarning(null);
    onImportComplete();
  };

  const handleConfirmAndSaveImport = () => {
    const selectedRows = parsedRows.filter(r => r.isSelected);
    if (selectedRows.length === 0) {
      alert("Lütfen en az bir öğrenci sonucu seçiniz.");
      return;
    }

    const normTitle = (examTitle || '').trim().toLowerCase();
    const existingDuplicates = examsToUse.filter(
      e => (e.examTitle || '').trim().toLowerCase() === normTitle
    );

    if (existingDuplicates.length > 0) {
      setDuplicateWarning({
        examTitle,
        existingExams: existingDuplicates,
        pendingRows: selectedRows
      });
      return;
    }

    executeSaveImport(selectedRows);
  };

  const handleOverwriteDuplicateExams = () => {
    if (!duplicateWarning) return;
    const { existingExams, pendingRows } = duplicateWarning;
    const existingIds = existingExams.map(e => e.id);

    if (onDeleteInstitutionalExam && existingIds.length > 0) {
      onDeleteInstitutionalExam(existingIds);
    }

    executeSaveImport(pendingRows, true, existingIds.length);
  };

  return (
    <div className="space-y-6 w-full animate-fade-in">
      {duplicateWarning && (
        <DuplicateConfirmModal
          examTitle={duplicateWarning.examTitle}
          existingCount={duplicateWarning.existingExams.length}
          onClose={() => setDuplicateWarning(null)}
          onOverwrite={handleOverwriteDuplicateExams}
        />
      )}

      {/* Guide Banner */}
      <div className="bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-emerald-500/10 border border-amber-500/30 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white">PDF / Okulizyon Deneme Karnelerini Otomatik Yükleme Rehberi</h3>
              <p className="text-xs text-amber-300">3 adımda toplu sınav sonuçlarınızı sisteme aktarın</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-950/80 border border-white/10 rounded-xl p-4 space-y-2 flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-indigo-400 uppercase tracking-wider bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                  1. ADIM
                </span>
                <span className="text-[10px] text-slate-400 font-bold">PDF İndir</span>
              </div>
              <h4 className="text-xs font-bold text-white">Kurum Sonuç PDF'ini İndirin</h4>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Okulizyon veya ölçme değerlendirme sisteminizden sınavın <strong className="text-white font-bold">Toplu Kurum Konu Analizli Sonuç PDF'ini</strong> bilgisayarınıza indirin.
              </p>
            </div>
          </div>

          <div className="bg-slate-950/80 border border-amber-500/30 rounded-xl p-4 space-y-2 flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-amber-400 uppercase tracking-wider bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  2. ADIM
                </span>
                <span className="text-[10px] text-slate-400 font-bold">Gemini Gem</span>
              </div>
              <h4 className="text-xs font-bold text-white">PDF'i CSV'ye Dönüştürün</h4>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Aşağıdaki Gem linkine tıklayın. Açılan Gemini sohbetinde <strong className="text-amber-300 font-bold">(+)</strong> butonuna basıp PDF'i ekleyin ve mesaj yazmadan gönderin.
              </p>
            </div>
            <a
              href="https://gemini.google.com/gem/1CtMzVvvkHYkNY7YoKtiT5GTv4UFFj_VM?usp=sharing"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center justify-center space-x-1.5 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-bold transition-all w-full text-center"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Gemini Dönüştürücü Gem'i Aç</span>
            </a>
          </div>

          <div className="bg-slate-950/80 border border-white/10 rounded-xl p-4 space-y-2 flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-wider bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  3. ADIM
                </span>
                <span className="text-[10px] text-slate-400 font-bold">CSV Yükleme</span>
              </div>
              <h4 className="text-xs font-bold text-white">CSV Dosyasını Yükleyin</h4>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Gemini'den aldığınız <strong className="text-emerald-300 font-bold">.csv</strong> uzantılı dosyayı sağ taraftaki <strong className="text-white font-bold">"Excel / CSV Yükle"</strong> butonuna basarak seçin ve sisteme aktarın.
              </p>
            </div>
            <div className="mt-2 flex items-center justify-center space-x-1.5 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 py-1.5 rounded-lg text-center">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Yüklemeye Hazırsınız</span>
            </div>
          </div>
        </div>
      </div>

      {/* Exam Metadata & Upload Form */}
      <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center space-x-2 text-white font-extrabold text-sm">
            <FileText className="w-4 h-4 text-indigo-400" />
            <span>Deneme Sınavı Bilgileri</span>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">
            Yüklenen sınav bilgilerini tanımlayın
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
          <div className="md:col-span-6">
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Deneme Adı & Yayın
            </label>
            <input
              type="text"
              value={examTitle}
              onChange={(e) => {
                const val = e.target.value;
                setExamTitle(val);
                const upper = val.toUpperCase();
                if (upper.includes('AYT')) setExamType('AYT');
                else if (upper.includes('TYT')) setExamType('TYT');
                else if (upper.includes('LGS') || upper.includes('ARA')) setExamType('Ara Sınıf');
              }}
              placeholder="Ör: BILGI_SARMAL_AYT_TG_4"
              className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Sınav Türü
            </label>
            <select
              value={examType}
              onChange={(e) => setExamType(e.target.value as 'TYT' | 'AYT' | 'Ara Sınıf')}
              className="w-full bg-slate-950 border border-white/10 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-bold"
            >
              <option value="TYT">TYT</option>
              <option value="AYT">AYT</option>
              <option value="Ara Sınıf">Ara Sınıf</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Sınav Tarihi
            </label>
            <input
              type="date"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              className="w-full bg-slate-950 border border-white/10 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium [color-scheme:dark]"
            />
          </div>

          <div className="md:col-span-2">
            <label className="cursor-pointer bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-400/30 rounded-xl px-3 py-2 flex items-center justify-center space-x-1.5 text-xs font-bold shadow-lg shadow-indigo-600/20 transition-all text-center w-full">
              <Upload className="w-3.5 h-3.5" />
              <span>Excel/CSV Yükle</span>
              <input
                type="file"
                accept=".csv,.txt,.tsv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Matching Table */}
      <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-5 space-y-4 w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Users className="w-4 h-4 text-indigo-400" />
              <span>Eşleşen & Eşleşmeyen Öğrenci Listesi ({parsedRows.length})</span>
            </h3>
            <p className="text-xs text-slate-400">
              Eşleşenler doğrudan öğrenciye atanır. Eşleşmeyenler 'Eşleşmemiş Karneler' olarak kaydedilir.
            </p>
          </div>

          {parsedRows.length > 0 && (
            <div className="flex items-center space-x-2">
              <div className="hidden md:flex items-center space-x-1.5 text-[11px] text-slate-400 mr-2">
                <button
                  type="button"
                  onClick={() => setParsedRows(prev => prev.map(r => ({ ...r, isSelected: true })))}
                  className="hover:text-indigo-300 underline"
                >
                  Tümünü Seç
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => setParsedRows(prev => prev.map(r => ({ ...r, isSelected: !!r.matchedStudentId })))}
                  className="hover:text-indigo-300 underline"
                >
                  Yalnızca Eşleşenleri Seç
                </button>
              </div>
              <button
                onClick={handleConfirmAndSaveImport}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/30 flex items-center justify-center space-x-2 transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Seçilen Sonuçları Sisteme İşle ({parsedRows.filter(r => r.isSelected).length})</span>
              </button>
            </div>
          )}
        </div>

        {/* Class Filter Tabs */}
        {parsedRows.length > 0 && !isParsing && (
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 border-b border-white/10 scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveClassTab('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center space-x-1.5 ${
                activeClassTab === 'all'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <span>Tüm Sınıflar</span>
              <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-black/30 text-white/90">
                {parsedRows.length}
              </span>
            </button>

            {importedClassesTabs.map(cls => {
              const count = parsedRows.filter(r => isRowInActiveTabForCls(r, cls)).length;
              return (
                <button
                  key={cls}
                  type="button"
                  onClick={() => setActiveClassTab(cls)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center space-x-1.5 ${
                    activeClassTab === cls
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <span>{cls}</span>
                  <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-black/30 text-white/90">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Table Body */}
        {isParsing ? (
          <div className="py-12 text-center text-slate-400 space-y-3">
            <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
            <p className="text-xs font-semibold">Excel verileri işleniyor ve öğrenciler eşleştiriliyor...</p>
          </div>
        ) : parsedRows.length === 0 ? (
          <div className="py-16 text-center text-slate-400 space-y-3 border-2 border-dashed border-white/10 rounded-xl">
            <FileSpreadsheet className="w-12 h-12 text-slate-600 mx-auto" />
            <div className="space-y-1">
              <p className="text-sm font-bold text-slate-300">Henüz Veri Yüklenmedi</p>
              <p className="text-xs max-w-md mx-auto text-slate-500">
                Yukarıdaki panelden bir Excel/CSV dosyası seçerek yükleme işlemini başlatın.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-white/10 w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-white/10">
                  <th className="p-3 w-10 text-center">Seç</th>
                  <th className="p-3 whitespace-nowrap">Dosyadaki Öğrenci</th>
                  <th className="p-3 whitespace-nowrap">Okul No</th>
                  <th className="p-3 whitespace-nowrap">Dosya Sınıfı</th>
                  <th className="p-3 whitespace-nowrap">1. Sınıf Seçimi</th>
                  <th className="p-3 whitespace-nowrap">2. Sistem Hesabı Eşleşmesi</th>
                  <th className="p-3 text-center whitespace-nowrap">Eşleşme Oranı</th>
                  <th className="p-3 text-right whitespace-nowrap">Ders Sayısı</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs text-slate-300">
                {parsedRows
                  .map((row, originalIdx) => ({ row, originalIdx }))
                  .filter(({ row }) => isRowInActiveTabForCls(row, activeClassTab))
                  .map(({ row, originalIdx: idx }) => {
                    const filteredStudents = getStudentsForClass(row.selectedClassForMatch);

                    return (
                      <tr key={idx} className="hover:bg-white/5 transition-colors">
                        <td className="p-3 text-center">
                          <input
                            type="checkbox"
                            checked={row.isSelected}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setParsedRows(prev => {
                                const u = [...prev];
                                u[idx].isSelected = checked;
                                return u;
                              });
                            }}
                            className="w-4 h-4 rounded bg-slate-950 border-white/20 text-indigo-600 focus:ring-indigo-500"
                          />
                        </td>
                        <td className="p-3 font-semibold text-white whitespace-nowrap">
                          {row.fileStudentName}
                        </td>
                        <td className="p-3 font-mono text-indigo-300 whitespace-nowrap">
                          {row.fileSchoolNumber || '-'}
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          <span className="px-2.5 py-1 rounded-md bg-white/5 text-slate-300 border border-white/10 font-medium text-xs whitespace-nowrap inline-block">
                            {row.fileClassName || '-'}
                          </span>
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          <select
                            value={row.selectedClassForMatch || 'all'}
                            onChange={(e) => handleRowClassChange(idx, e.target.value)}
                            className="bg-slate-950 border border-white/15 rounded-lg px-2.5 py-1.5 text-xs font-medium text-indigo-300 focus:outline-none focus:border-indigo-500 whitespace-nowrap"
                          >
                            <option value="all">Tüm Sınıflar ({studentUsers.length})</option>
                            {availableClasses.map(cls => (
                              <option key={cls} value={cls}>
                                {cls} ({getStudentsForClass(cls).length})
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="p-3 min-w-[220px]">
                          <select
                            value={row.matchedStudentId || 'none'}
                            onChange={(e) => handleManualMatchChange(idx, e.target.value)}
                            className={`w-full bg-slate-950 border rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none ${
                              row.matchedStudentId 
                                ? 'border-emerald-500/40 text-emerald-300' 
                                : 'border-rose-500/40 text-rose-300'
                            }`}
                          >
                            <option value="none">-- Öğrenci Seçin --</option>
                            {filteredStudents.map(st => (
                              <option key={st.id} value={st.id}>
                                {st.name} {st.schoolNumber ? `(#${st.schoolNumber})` : ''}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="p-3 text-center">
                          {row.matchScore >= 90 ? (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>%{row.matchScore}</span>
                            </span>
                          ) : row.matchScore >= 60 ? (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                              <span>%{row.matchScore}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                              <XCircle className="w-3 h-3" />
                              <span>Eşleşmedi</span>
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right font-bold text-slate-400">
                          {row.subjects.length} Ders
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
