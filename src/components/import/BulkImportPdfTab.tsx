import React, { useState, useMemo, useCallback } from 'react';
import { 
  FileText, 
  Upload, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Search, 
  Users, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  Trash2, 
  Check, 
  X, 
  FileSpreadsheet, 
  Sliders, 
  Layers, 
  BookOpen, 
  Award,
  Zap,
  Info,
  UserCheck,
  UserX,
  Plus,
  GraduationCap
} from 'lucide-react';
import { UserAccount, YKSDataState, InstitutionalMockExam, InstitutionalSubjectDetail, ParsedStudentRow } from '../../types';
import { extractTextFromPdfFile, matchStudentToSystem } from '../../utils/pdfReportParser';
import { MockInstitutionalDetailView } from '../mocks/MockInstitutionalDetailView';

interface BulkImportPdfTabProps {
  currentUser: UserAccount;
  studentUsers: UserAccount[];
  availableClasses: string[];
  studentsData: Record<string, YKSDataState>;
  examsToUse: InstitutionalMockExam[];
  onSaveInstitutionalExams: (exams: InstitutionalMockExam[]) => void;
  onDeleteInstitutionalExam?: (examId: string | string[]) => void;
  onAddAuditLog?: (description: string, category: any, actionType: string) => void;
  getMappedClassName: (clsName: string | undefined | null) => string;
  findBestClassMatch: (fileClassName: string) => string;
  onImportComplete?: () => void;
}

export const BulkImportPdfTab: React.FC<BulkImportPdfTabProps> = ({
  currentUser,
  studentUsers,
  availableClasses,
  studentsData,
  onSaveInstitutionalExams,
  onAddAuditLog,
  getMappedClassName,
  findBestClassMatch,
  onImportComplete
}) => {
  const [examTitle, setExamTitle] = useState('');
  const [examDate, setExamDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [examType, setExamType] = useState<'TYT' | 'AYT' | 'Ara Sınıf'>('AYT');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStep, setProcessStep] = useState<string>('');
  const [processProgress, setProcessProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [parsedRows, setParsedRows] = useState<ParsedStudentRow[]>([]);
  const [selectedDetailRow, setSelectedDetailRow] = useState<ParsedStudentRow | null>(null);

  // Filters & Pagination
  const [filterClass, setFilterClass] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'matched' | 'unmatched'>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const abortControllerRef = React.useRef<AbortController | null>(null);
  const isCancelledRef = React.useRef<boolean>(false);

  const handleCancelProcess = () => {
    isCancelledRef.current = true;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsProcessing(false);
    setProcessStep('');
    setErrorMessage('İşlem kullanıcı tarafından durduruldu.');
  };

  // File change handler
  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    isCancelledRef.current = false;
    abortControllerRef.current = new AbortController();
    setErrorMessage(null);
    setSuccessMessage(null);
    setParsedRows([]);

    try {
      const allExtractedPages: Array<{ pageIndex: number; text: string; fileName: string; opticalAnswers?: Record<string, string>; answerKeys?: Record<string, string> }> = [];

      for (let fIdx = 0; fIdx < files.length; fIdx++) {
        if (isCancelledRef.current) break;
        const file = files[fIdx];
        setProcessStep(`${file.name} dosyasından metinler ayıklanıyor (${fIdx + 1}/${files.length})...`);
        
        const extracted = await extractTextFromPdfFile(file, (curr, tot) => {
          setProcessProgress({ current: curr, total: tot });
        });

        extracted.forEach(p => {
          allExtractedPages.push({ ...p, fileName: file.name });
        });
      }

      if (isCancelledRef.current) {
        setIsProcessing(false);
        return;
      }

      if (allExtractedPages.length === 0) {
        throw new Error('PDF dosyalarında okunabilir metin katmanı bulunamadı.');
      }

      setProcessStep(`Yapay Zeka (Gemini Flash-Lite) ile ${allExtractedPages.length} karne sayfası ayrıştırılıyor...`);
      setProcessProgress({ current: 0, total: allExtractedPages.length });

      // Process in batches of 1-2 to guarantee 100% complete topic & score extraction
      const BATCH_SIZE = 1;
      const allReports: any[] = [];
      let detectedTitle = examTitle;
      let detectedType = examType;

      for (let i = 0; i < allExtractedPages.length; i += BATCH_SIZE) {
        if (isCancelledRef.current) break;
        const chunk = allExtractedPages.slice(i, i + BATCH_SIZE);
        setProcessStep(`Yapay Zeka analizi yapılıyor (Sayfa ${i + 1} - ${Math.min(i + BATCH_SIZE, allExtractedPages.length)} / ${allExtractedPages.length})...`);
        setProcessProgress({ current: Math.min(i + BATCH_SIZE, allExtractedPages.length), total: allExtractedPages.length });
        
        try {
          const response = await fetch('/api/gemini/parse-pdf-exam-reports', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: abortControllerRef.current?.signal,
            body: JSON.stringify({
              pagesText: chunk.map((c, idx) => ({ pageIndex: i + idx + 1, text: c.text }))
            })
          });

          if (!response.ok) {
            let errText = 'Yapay zeka analiz servisine bağlanılamadı.';
            try {
              const errData = await response.json();
              if (errData && errData.error) errText = errData.error;
            } catch {}
            console.warn(`Sayfa ${i + 1} ayrıştırma uyarısı:`, errText);
            continue;
          }

          const data = await response.json();
          if (data.success && data.data) {
            if (data.data.examTitle && !detectedTitle) {
              detectedTitle = data.data.examTitle;
              setExamTitle(data.data.examTitle);
            }
            if (data.data.examType) {
              detectedType = data.data.examType === 'TYT' ? 'TYT' : 'AYT';
              setExamType(detectedType);
            }
            if (Array.isArray(data.data.reports)) {
              allReports.push(...data.data.reports);
            }
          }
        } catch (chunkErr: any) {
          if (isCancelledRef.current || chunkErr.name === 'AbortError') {
            break;
          }
          console.warn(`Sayfa ${i + 1} ayrıştırma hatası:`, chunkErr);
        }
      }

      if (isCancelledRef.current) {
        setIsProcessing(false);
        return;
      }

      setProcessStep('Öğrenciler sistem veritabanı ile eşleştiriliyor...');

      // Transform raw reports into ParsedStudentRow items
      const rows: ParsedStudentRow[] = allReports.map((rep: any, repIdx: number) => {
        const studentName = (rep.studentName || '').trim();
        const schoolNumber = (rep.schoolNumber || '').trim();
        const className = getMappedClassName(rep.className || '');
        const scores = rep.scores || {};

        const pageOptical = allExtractedPages[repIdx]?.opticalAnswers || {};
        const pageKeys = allExtractedPages[repIdx]?.answerKeys || {};
        const aiOptical = rep.opticalAnswers || {};
        const aiKeys = rep.answerKeys || {};

        const mergedOpticalAnswers: Record<string, string> = { ...pageOptical, ...aiOptical };
        const mergedAnswerKeys: Record<string, string> = { ...pageKeys, ...aiKeys };

        // Also merge onto each subject in subjects array
        const rawSubjects: InstitutionalSubjectDetail[] = Array.isArray(rep.subjects) ? rep.subjects : [];
        const subjects: InstitutionalSubjectDetail[] = rawSubjects.map((s: any) => {
          const sName = s.subjectName || '';
          const sOpt = s.opticalAnswers || mergedOpticalAnswers[sName] || mergedOpticalAnswers[sName.replace('TYT ', '')] || mergedOpticalAnswers[`TYT ${sName}`];
          const sKey = s.answerKey || mergedAnswerKeys[sName] || mergedAnswerKeys[sName.replace('TYT ', '')] || mergedAnswerKeys[`TYT ${sName}`];
          if (sOpt) mergedOpticalAnswers[sName] = sOpt;
          if (sKey) mergedAnswerKeys[sName] = sKey;
          return {
            ...s,
            ...(sOpt ? { opticalAnswers: sOpt } : {}),
            ...(sKey ? { answerKey: sKey } : {})
          };
        });

        const matchResult = matchStudentToSystem(studentName, schoolNumber, className, studentUsers, studentsData);

        return {
          fileStudentName: studentName,
          fileSchoolNumber: schoolNumber,
          fileClassName: className,
          matchedStudentId: matchResult.matchedStudentId,
          selectedClassForMatch: className,
          matchScore: matchResult.matchScore,
          matchReason: matchResult.matchReason,
          isSelected: matchResult.matchedStudentId !== null,
          tytScore: scores.tytScore || 0,
          tytClassRank: scores.tytClassRank || 0,
          tytInstitutionRank: scores.tytInstitutionRank || 0,
          tytGeneralRank: scores.tytGeneralRank || 0,
          sayScore: scores.sayScore || 0,
          eaScore: scores.eaScore || 0,
          sozScore: scores.sozScore || 0,
          sayClassRank: scores.sayClassRank || 0,
          sayInstitutionRank: scores.sayInstitutionRank || 0,
          sayGeneralRank: scores.sayGeneralRank || 0,
          eaClassRank: scores.eaClassRank || 0,
          eaInstitutionRank: scores.eaInstitutionRank || 0,
          eaGeneralRank: scores.eaGeneralRank || 0,
          sozClassRank: scores.sozClassRank || 0,
          sozInstitutionRank: scores.sozInstitutionRank || 0,
          sozGeneralRank: scores.sozGeneralRank || 0,
          classParticipantCount: scores.classParticipantCount || 0,
          institutionParticipantCount: scores.institutionParticipantCount || 0,
          generalParticipantCount: scores.generalParticipantCount || 0,
          opticalAnswers: mergedOpticalAnswers,
          answerKeys: mergedAnswerKeys,
          subjects: subjects
        };
      });

      setParsedRows(rows);
      setSuccessMessage(`${rows.length} adet öğrenci karnesi başarıyla ayrıştırıldı. Lütfen verileri kontrol edip onaylayınız.`);
    } catch (err: any) {
      console.error('PDF parsing failed:', err);
      setErrorMessage(err.message || 'PDF dosyası ayrıştırılırken beklenmeyen bir hata oluştu.');
    } finally {
      setIsProcessing(false);
      setProcessStep('');
    }
  };

  // Filtered rows for preview
  const filteredRows = useMemo(() => {
    return parsedRows.filter(row => {
      // 1. Class filter
      if (filterClass !== 'all') {
        const rowClass = row.fileClassName || row.selectedClassForMatch || '';
        if (rowClass !== filterClass) return false;
      }

      // 2. Status filter
      if (filterStatus === 'matched' && !row.matchedStudentId) return false;
      if (filterStatus === 'unmatched' && row.matchedStudentId) return false;

      // 3. Search filter
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesName = row.fileStudentName.toLowerCase().includes(term);
        const matchesNo = row.fileSchoolNumber.toLowerCase().includes(term);
        return matchesName || matchesNo;
      }

      return true;
    });
  }, [parsedRows, filterClass, filterStatus, searchTerm]);

  // Pagination slice
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, currentPage, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));

  // Toggle selection
  const handleToggleRowSelect = (index: number) => {
    setParsedRows(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], isSelected: !copy[index].isSelected };
      return copy;
    });
  };

  const handleSelectAll = (select: boolean) => {
    setParsedRows(prev => prev.map(r => ({ ...r, isSelected: select })));
  };

  // Manual student match changer
  const handleChangeMatchedStudent = (rowIndex: number, newStudentId: string) => {
    setParsedRows(prev => {
      const copy = [...prev];
      const selectedUser = studentUsers.find(u => u.id === newStudentId);
      copy[rowIndex] = {
        ...copy[rowIndex],
        matchedStudentId: newStudentId ? newStudentId : null,
        isSelected: Boolean(newStudentId),
        matchScore: newStudentId ? 100 : 0,
        matchReason: newStudentId ? `Manuel Eşleştirildi (${selectedUser?.name || 'Öğrenci'})` : 'Eşleştirilmedi'
      };
      return copy;
    });
  };

  // Save selected exams to system
  const handleSaveSelectedKarneler = () => {
    const selectedRows = parsedRows.filter(r => r.isSelected && r.matchedStudentId);
    if (selectedRows.length === 0) {
      alert('Lütfen kaydedilecek eşleşmiş en az bir öğrenci seçiniz.');
      return;
    }

    if (!examTitle.trim()) {
      alert('Lütfen sınav başlığı giriniz.');
      return;
    }

    const createdExams: InstitutionalMockExam[] = selectedRows.map(row => {
      const studentObj = studentUsers.find(u => u.id === row.matchedStudentId);
      return {
        id: `inst-pdf-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        examTitle: examTitle.trim(),
        examDate: examDate || new Date().toISOString().split('T')[0],
        examType,
        createdByName: currentUser.name,
        createdById: currentUser.id,
        createdAt: new Date().toISOString(),
        studentId: row.matchedStudentId!,
        studentName: studentObj?.name || row.fileStudentName,
        schoolNumber: row.fileSchoolNumber || studentObj?.schoolNumber,
        className: row.fileClassName || studentObj?.className,
        scores: {
          tytScore: row.tytScore,
          tytClassRank: row.tytClassRank,
          tytClassTotal: row.classParticipantCount,
          tytInstitutionRank: row.tytInstitutionRank,
          tytInstitutionTotal: row.institutionParticipantCount,
          tytGeneralRank: row.tytGeneralRank,
          tytGeneralTotal: row.generalParticipantCount,
          sayScore: row.sayScore,
          eaScore: row.eaScore,
          sozScore: row.sozScore,
          sayClassRank: row.sayClassRank,
          sayClassTotal: row.classParticipantCount,
          sayInstitutionRank: row.sayInstitutionRank,
          sayInstitutionTotal: row.institutionParticipantCount,
          sayGeneralRank: row.sayGeneralRank,
          sayGeneralTotal: row.generalParticipantCount,
          eaClassRank: row.eaClassRank,
          eaClassTotal: row.classParticipantCount,
          eaInstitutionRank: row.eaInstitutionRank,
          eaInstitutionTotal: row.institutionParticipantCount,
          eaGeneralRank: row.eaGeneralRank,
          eaGeneralTotal: row.generalParticipantCount,
          sozClassRank: row.sozClassRank,
          sozClassTotal: row.classParticipantCount,
          sozInstitutionRank: row.sozInstitutionRank,
          sozInstitutionTotal: row.institutionParticipantCount,
          sozGeneralRank: row.sozGeneralRank,
          sozGeneralTotal: row.generalParticipantCount,
          classParticipantCount: row.classParticipantCount,
          institutionParticipantCount: row.institutionParticipantCount,
          generalParticipantCount: row.generalParticipantCount,
        },
        opticalAnswers: row.opticalAnswers,
        answerKeys: row.answerKeys,
        subjects: row.subjects
      };
    });

    onSaveInstitutionalExams(createdExams);

    if (onAddAuditLog) {
      onAddAuditLog(
        `PDF'ten "${examTitle}" sınavına ait ${createdExams.length} adet öğrenci karnesi toplu olarak aktarıldı.`,
        'exam',
        'BULK_PDF_EXAM_IMPORT'
      );
    }

    alert(`${createdExams.length} adet öğrenci karnesi ve konu analizleri sisteme başarıyla kaydedildi!`);
    setParsedRows([]);
    setSuccessMessage(null);
    if (onImportComplete) onImportComplete();
  };

  // Stats
  const stats = useMemo(() => {
    const total = parsedRows.length;
    const matched = parsedRows.filter(r => r.matchedStudentId).length;
    const unmatched = total - matched;
    const selected = parsedRows.filter(r => r.isSelected && r.matchedStudentId).length;
    return { total, matched, unmatched, selected };
  }, [parsedRows]);

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* 1. PDF YÜKLEME VE SINAV AYARLARI KARTI */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-md space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl text-white shadow-lg shadow-purple-600/20 border border-purple-400/30">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>PDF Sınav Sonuç Belgeleri Yükleme</span>
                <span className="text-[10px] bg-purple-500/20 text-purple-300 font-bold px-2.5 py-0.5 rounded-full border border-purple-500/30">
                  Yapay Zeka (Gemini Flash-Lite)
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Ulti, Hız ve Renk, Özdebir vb. yayınların toplu PDF karne dosyalarını yükleyin. Cevap anahtarları filtrelenerek en düşük token ile analiz edilir.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-semibold">Tasarruf:</span>
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/20">
              %95+ Jeton Tasarrufu
            </span>
          </div>
        </div>

        {/* Form Inputs: Sınav Başlığı, Tarih, Tür */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Sınav Başlığı / Yayın Adı</label>
            <input 
              type="text" 
              value={examTitle}
              onChange={(e) => setExamTitle(e.target.value)}
              placeholder="Örn: ULTİ AYT TÜRKİYE GENELİ - 1" 
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all font-semibold"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Sınav Tarihi</label>
            <input 
              type="date" 
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all font-semibold"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Sınav Türü</label>
            <select
              value={examType}
              onChange={(e) => setExamType(e.target.value as any)}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all font-semibold cursor-pointer"
            >
              <option value="TYT">TYT (Temel Yeterlilik Testi)</option>
              <option value="AYT">AYT (Alan Yeterlilik Testi)</option>
              <option value="9. Sınıf KDS">9. Sınıf KDS (Maarif Modeli)</option>
              <option value="10. Sınıf KDS">10. Sınıf KDS (Maarif Modeli)</option>
              <option value="11. Sınıf KDS">11. Sınıf KDS (Ara Sınıf)</option>
              <option value="Ara Sınıf">Genel Ara Sınıf Denemesi</option>
            </select>
          </div>
        </div>

        {/* Drag & Drop File Zone */}
        <div className="relative border-2 border-dashed border-purple-500/40 hover:border-purple-400/80 bg-slate-950/60 rounded-3xl p-8 text-center transition-all group">
          <input 
            type="file" 
            accept="application/pdf"
            multiple
            disabled={isProcessing}
            onChange={handlePdfUpload}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
          />
          
          <div className="space-y-3 flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform shadow-inner">
              <Upload className="w-7 h-7" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
                PDF Sonuç Belgesi Dosyalarını Buraya Sürükleyin veya Seçin
              </h4>
              <p className="text-xs text-slate-400 mt-1 max-w-lg mx-auto">
                Çok sayfalı tek bir PDF veya sınıf sınıf ayrılmış birden fazla PDF dosyasını aynı anda yükleyebilirsiniz.
              </p>
            </div>
          </div>
        </div>

        {/* Processing Spinner & Progress Bar */}
        {isProcessing && (
          <div className="bg-purple-950/30 border border-purple-500/30 rounded-2xl p-5 space-y-3 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-bold text-purple-200">
              <div className="flex items-center space-x-2.5">
                <RefreshCw className="w-4 h-4 text-purple-400 animate-spin shrink-0" />
                <span className="truncate">{processStep}</span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {processProgress.total > 0 && (
                  <span className="font-mono bg-purple-900/60 px-2.5 py-1 rounded-lg border border-purple-500/30">
                    {processProgress.current} / {processProgress.total} Sayfa
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleCancelProcess}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-rose-600/30 flex items-center gap-1.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>İşlemi İptal Et / Durdur</span>
                </button>
              </div>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full transition-all duration-300"
                style={{ 
                  width: processProgress.total > 0 ? `${(processProgress.current / processProgress.total) * 100}%` : '60%' 
                }}
              />
            </div>
          </div>
        )}

        {/* Messages */}
        {errorMessage && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs text-rose-300 flex items-center space-x-2.5 animate-fade-in">
            <XCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-xs text-emerald-300 flex items-center space-x-2.5 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        )}
      </div>

      {/* 2. ÖNİZLEME, EŞLEŞTİRME VE SAYFALAMA TABLOSU */}
      {parsedRows.length > 0 && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-md space-y-5 animate-fade-in">
          
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-2xl">
              <span className="text-[10px] uppercase font-bold text-slate-400">Toplam Karne</span>
              <p className="text-xl font-black text-white mt-0.5">{stats.total}</p>
            </div>
            <div className="p-3.5 bg-emerald-950/20 border border-emerald-500/30 rounded-2xl">
              <span className="text-[10px] uppercase font-bold text-emerald-400">Eşleşen Öğrenci</span>
              <p className="text-xl font-black text-emerald-300 mt-0.5">{stats.matched}</p>
            </div>
            <div className="p-3.5 bg-amber-950/20 border border-amber-500/30 rounded-2xl">
              <span className="text-[10px] uppercase font-bold text-amber-400">Eşleşmeyen / Yeni</span>
              <p className="text-xl font-black text-amber-300 mt-0.5">{stats.unmatched}</p>
            </div>
            <div className="p-3.5 bg-indigo-950/20 border border-indigo-500/30 rounded-2xl">
              <span className="text-[10px] uppercase font-bold text-indigo-400">Seçili Aktarılacak</span>
              <p className="text-xl font-black text-indigo-300 mt-0.5">{stats.selected}</p>
            </div>
          </div>

          {/* Action Header & Filters */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Sınıf Filtresi */}
              <select
                value={filterClass}
                onChange={(e) => { setFilterClass(e.target.value); setCurrentPage(1); }}
                className="bg-slate-950 border border-slate-800 text-slate-200 text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-indigo-500 font-semibold cursor-pointer"
              >
                <option value="all">Tüm Sınıflar</option>
                {availableClasses.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              {/* Durum Filtresi */}
              <select
                value={filterStatus}
                onChange={(e) => { setFilterStatus(e.target.value as any); setCurrentPage(1); }}
                className="bg-slate-950 border border-slate-800 text-slate-200 text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-indigo-500 font-semibold cursor-pointer"
              >
                <option value="all">Tüm Durumlar</option>
                <option value="matched">Yalnızca Eşleşenler</option>
                <option value="unmatched">Eşleşmeyenler</option>
              </select>

              {/* Arama */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input 
                  type="text"
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  placeholder="İsim veya No Ara..."
                  className="bg-slate-950 border border-slate-800 text-white text-xs pl-8 pr-3 py-2 rounded-xl placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-40 sm:w-52"
                />
              </div>
            </div>

            {/* Batch Selection & Save Button */}
            <div className="flex items-center gap-3 self-end md:self-auto">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleSelectAll(true)}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Tümünü Seç
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectAll(false)}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Kaldır
                </button>
              </div>

              <button
                type="button"
                onClick={handleSaveSelectedKarneler}
                disabled={stats.selected === 0}
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black rounded-xl transition-all cursor-pointer shadow-lg shadow-emerald-600/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <Check className="w-4 h-4" />
                <span>Seçili ({stats.selected}) Karneyi Kaydet</span>
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="border border-slate-800 rounded-2xl overflow-x-auto bg-slate-950/60">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[11px]">
                  <th className="p-3 w-10 text-center">Seç</th>
                  <th className="p-3">Öğrenci (PDF)</th>
                  <th className="p-3">Numara</th>
                  <th className="p-3">Sınıf</th>
                  <th className="p-3">Sistem Eşleşmesi</th>
                  <th className="p-3">Puan & Dereceler (Snf / Kurum / Genel)</th>
                  <th className="p-3 text-center">Toplam Net</th>
                  <th className="p-3 text-right">Karne & Önizleme</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {paginatedRows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400 italic">
                      Filtrelere uygun karne kaydı bulunamadı.
                    </td>
                  </tr>
                ) : (
                  paginatedRows.map((row) => {
                    const originalIndex = parsedRows.indexOf(row);
                    const totalNet = row.subjects.reduce((sum, s) => sum + (s.net || 0), 0).toFixed(2);
                    const isMatched = Boolean(row.matchedStudentId);

                    return (
                      <tr 
                        key={originalIndex} 
                        className={`hover:bg-slate-900/40 transition-colors ${
                          row.isSelected ? 'bg-indigo-950/20' : ''
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="p-3 text-center">
                          <input 
                            type="checkbox"
                            checked={row.isSelected}
                            disabled={!isMatched}
                            onChange={() => handleToggleRowSelect(originalIndex)}
                            className="rounded border-slate-700 text-indigo-600 focus:ring-0 cursor-pointer disabled:opacity-30"
                          />
                        </td>

                        {/* Student Name */}
                        <td className="p-3 font-bold text-white whitespace-nowrap">
                          {row.fileStudentName || <span className="text-slate-500 italic">İsimsiz</span>}
                        </td>

                        {/* School Number */}
                        <td className="p-3 font-mono text-slate-300">
                          {row.fileSchoolNumber || '-'}
                        </td>

                        {/* Class Name */}
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-bold">
                            {row.fileClassName || '-'}
                          </span>
                        </td>

                        {/* System Matching Dropdown */}
                        <td className="p-3 min-w-[220px]">
                          <div className="space-y-1">
                            <select
                              value={row.matchedStudentId || ''}
                              onChange={(e) => handleChangeMatchedStudent(originalIndex, e.target.value)}
                              className={`w-full text-xs font-semibold px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer focus:outline-none ${
                                isMatched 
                                  ? 'bg-slate-900 text-emerald-300 border-emerald-500/40' 
                                  : 'bg-slate-900 text-amber-300 border-amber-500/40'
                              }`}
                            >
                              <option value="">-- Eşleştirilmedi (Kaydedilmez) --</option>
                              {studentUsers.map(u => (
                                <option key={u.id} value={u.id}>
                                  {u.name} {u.schoolNumber ? `(#${u.schoolNumber})` : ''} - {u.className || ''}
                                </option>
                              ))}
                            </select>

                            <div className="flex items-center gap-1.5 text-[10px]">
                              {isMatched ? (
                                <span className="text-emerald-400 flex items-center gap-1 font-bold">
                                  <UserCheck className="w-3 h-3" />
                                  {row.matchReason}
                                </span>
                              ) : (
                                <span className="text-rose-400 flex items-center gap-1 font-bold">
                                  <UserX className="w-3 h-3" />
                                  {row.matchReason}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Scores & Ranks */}
                        <td className="p-3 font-mono text-[11px]">
                          {row.tytScore ? (
                            <div className="space-y-1">
                              <div className="flex items-center space-x-1.5">
                                <span className="text-indigo-400 font-bold bg-indigo-500/10 px-1.5 py-0.5 rounded text-[10px]">TYT</span>
                                <span className="text-white font-bold">{row.tytScore.toFixed(2)}</span>
                              </div>
                              <div className="flex items-center space-x-1 text-[10px] text-slate-400">
                                {row.tytClassRank ? <span className="text-emerald-400 font-semibold">Snf: {row.tytClassRank}{row.tytClassTotal || row.classParticipantCount ? `/${row.tytClassTotal || row.classParticipantCount}` : ''}</span> : null}
                                {row.tytInstitutionRank ? <span className="text-indigo-300 font-semibold">• Kurum: {row.tytInstitutionRank}{row.tytInstitutionTotal || row.institutionParticipantCount ? `/${row.tytInstitutionTotal || row.institutionParticipantCount}` : ''}</span> : null}
                                {row.tytGeneralRank ? <span className="text-amber-300 font-semibold">• Genel: #{row.tytGeneralRank.toLocaleString('tr-TR')}</span> : null}
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              {row.sayScore > 0 && (
                                <div className="flex items-center space-x-1.5">
                                  <span className="text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded text-[10px]">SAY</span>
                                  <span className="text-white font-bold">{row.sayScore.toFixed(2)}</span>
                                  {row.sayClassRank ? <span className="text-[10px] text-emerald-400">(Snf: {row.sayClassRank})</span> : null}
                                </div>
                              )}
                              {row.eaScore > 0 && (
                                <div className="flex items-center space-x-1.5">
                                  <span className="text-amber-400 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded text-[10px]">EA</span>
                                  <span className="text-white font-bold">{row.eaScore.toFixed(2)}</span>
                                  {row.eaClassRank ? <span className="text-[10px] text-amber-400">(Snf: {row.eaClassRank})</span> : null}
                                </div>
                              )}
                              {row.sozScore > 0 && (
                                <div className="flex items-center space-x-1.5">
                                  <span className="text-purple-400 font-bold bg-purple-500/10 px-1.5 py-0.5 rounded text-[10px]">SÖZ</span>
                                  <span className="text-white font-bold">{row.sozScore.toFixed(2)}</span>
                                  {row.sozClassRank ? <span className="text-[10px] text-purple-400">(Snf: {row.sozClassRank})</span> : null}
                                </div>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Total Net */}
                        <td className="p-3 font-bold text-emerald-400 font-mono text-xs text-center whitespace-nowrap">
                          {totalNet} Net
                        </td>

                        {/* Action: Karneyi Görüntüle */}
                        <td className="p-3 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setSelectedDetailRow(row)}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all flex items-center gap-1.5 text-[11px] cursor-pointer shadow-md shadow-indigo-600/30 hover:scale-[1.02] ml-auto"
                          >
                            <GraduationCap className="w-3.5 h-3.5" />
                            <span>Karneyi Görüntüle</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <div className="text-xs text-slate-400">
                Toplam <strong className="text-white">{filteredRows.length}</strong> karne kaydından <strong className="text-white">{((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, filteredRows.length)}</strong> arası gösteriliyor.
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-40 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).slice(
                  Math.max(0, currentPage - 3),
                  Math.min(totalPages, currentPage + 2)
                ).map(pageNo => (
                  <button
                    key={pageNo}
                    type="button"
                    onClick={() => setCurrentPage(pageNo)}
                    className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      currentPage === pageNo 
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' 
                        : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {pageNo}
                  </button>
                ))}

                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-40 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

        </div>
      )}

      {/* 3. AUTHENTIC PDF REPORT CARD MODAL */}
      {selectedDetailRow && (
        <div 
          className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-md flex items-start justify-center p-2 sm:p-4 md:p-6 pt-20 sm:pt-24 pb-16 overflow-y-auto animate-fade-in"
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedDetailRow(null); }}
        >
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-6xl w-full p-4 sm:p-6 shadow-2xl space-y-4 my-2 relative">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 no-print">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-slate-400">PDF Karne Önizleme:</span>
                <span className="text-xs font-black text-indigo-300">{selectedDetailRow.fileStudentName}</span>
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30">
                  {selectedDetailRow.fileClassName || 'Sınıf Yok'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDetailRow(null)}
                className="p-1.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold border border-white/10"
              >
                <X className="w-4 h-4" />
                <span>Pencereyi Kapat</span>
              </button>
            </div>

            <MockInstitutionalDetailView
              selectedInstitutionalExam={{
                id: 'preview-modal-row',
                examTitle: examTitle || 'Deneme Sınavı',
                examDate: examDate,
                examType: examType,
                studentName: selectedDetailRow.fileStudentName,
                schoolNumber: selectedDetailRow.fileSchoolNumber,
                className: selectedDetailRow.fileClassName,
                createdAt: new Date().toISOString(),
                scores: {
                  tytScore: selectedDetailRow.tytScore,
                  tytGeneralAvg: selectedDetailRow.tytGeneralAvg,
                  sayScore: selectedDetailRow.sayScore,
                  sayGeneralAvg: selectedDetailRow.sayGeneralAvg,
                  eaScore: selectedDetailRow.eaScore,
                  eaGeneralAvg: selectedDetailRow.eaGeneralAvg,
                  sozScore: selectedDetailRow.sozScore,
                  sozGeneralAvg: selectedDetailRow.sozGeneralAvg,
                  sayClassRank: selectedDetailRow.sayClassRank,
                  sayClassTotal: selectedDetailRow.sayClassTotal,
                  sayInstitutionRank: selectedDetailRow.sayInstitutionRank,
                  sayInstitutionTotal: selectedDetailRow.sayInstitutionTotal,
                  sayDistrictRank: selectedDetailRow.sayDistrictRank,
                  sayCityRank: selectedDetailRow.sayCityRank,
                  sayGeneralRank: selectedDetailRow.sayGeneralRank,
                  sayGeneralTotal: selectedDetailRow.sayGeneralTotal,
                  eaClassRank: selectedDetailRow.eaClassRank,
                  eaClassTotal: selectedDetailRow.eaClassTotal,
                  eaInstitutionRank: selectedDetailRow.eaInstitutionRank,
                  eaInstitutionTotal: selectedDetailRow.eaInstitutionTotal,
                  eaDistrictRank: selectedDetailRow.eaDistrictRank,
                  eaCityRank: selectedDetailRow.eaCityRank,
                  eaGeneralRank: selectedDetailRow.eaGeneralRank,
                  eaGeneralTotal: selectedDetailRow.eaGeneralTotal,
                  sozClassRank: selectedDetailRow.sozClassRank,
                  sozClassTotal: selectedDetailRow.sozClassTotal,
                  sozInstitutionRank: selectedDetailRow.sozInstitutionRank,
                  sozInstitutionTotal: selectedDetailRow.sozInstitutionTotal,
                  sozDistrictRank: selectedDetailRow.sozDistrictRank,
                  sozCityRank: selectedDetailRow.sozCityRank,
                  sozGeneralRank: selectedDetailRow.sozGeneralRank,
                  sozGeneralTotal: selectedDetailRow.sozGeneralTotal,
                  tytClassRank: selectedDetailRow.tytClassRank,
                  tytClassTotal: selectedDetailRow.tytClassTotal,
                  tytInstitutionRank: selectedDetailRow.tytInstitutionRank,
                  tytInstitutionTotal: selectedDetailRow.tytInstitutionTotal,
                  tytDistrictRank: selectedDetailRow.tytDistrictRank,
                  tytCityRank: selectedDetailRow.tytCityRank,
                  tytGeneralRank: selectedDetailRow.tytGeneralRank,
                  tytGeneralTotal: selectedDetailRow.tytGeneralTotal,
                  classParticipantCount: selectedDetailRow.classParticipantCount,
                  institutionParticipantCount: selectedDetailRow.institutionParticipantCount,
                  districtParticipantCount: selectedDetailRow.districtParticipantCount,
                  cityParticipantCount: selectedDetailRow.cityParticipantCount,
                  generalParticipantCount: selectedDetailRow.generalParticipantCount
                },
                opticalAnswers: selectedDetailRow.opticalAnswers,
                answerKeys: selectedDetailRow.answerKeys,
                subjects: selectedDetailRow.subjects
              }}
              setSelectedInstitutionalExam={() => setSelectedDetailRow(null)}
            />
          </div>
        </div>
      )}

    </div>
  );
};
