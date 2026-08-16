import React, { useState, useMemo, useRef } from 'react';
import { 
  FileText, 
  Upload, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Search, 
  Users, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight, 
  Trash2, 
  Check, 
  X, 
  Sliders, 
  Zap, 
  UserCheck, 
  UserX, 
  GraduationCap,
  Sparkles,
  FileCode,
  ShieldCheck
} from 'lucide-react';
import { UserAccount, YKSDataState, InstitutionalMockExam, ParsedStudentRow } from '../../types';
import { parseMarkdownExamReport } from '../../utils/markdownReportParser';
import { MockInstitutionalDetailView } from '../mocks/MockInstitutionalDetailView';

interface BulkImportMarkdownTabProps {
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

export const BulkImportMarkdownTab: React.FC<BulkImportMarkdownTabProps> = ({
  currentUser,
  studentUsers,
  availableClasses,
  studentsData,
  onSaveInstitutionalExams,
  onAddAuditLog,
  getMappedClassName,
  onImportComplete
}) => {
  const [examTitle, setExamTitle] = useState('');
  const [examDate, setExamDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [examType, setExamType] = useState<'TYT' | 'AYT' | 'Ara Sınıf'>('TYT');
  
  const [isProcessing, setIsProcessing] = useState(false);
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

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle Markdown file upload
  const handleMarkdownUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setParsedRows([]);

    try {
      let combinedContent = '';
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const content = await file.text();
        combinedContent += '\n\n' + content;
      }

      if (!combinedContent.trim()) {
        throw new Error('Yüklenen Markdown dosyasının içi boş.');
      }

      // Parse deterministically in client browser (0 AI, 0 API delay)
      const parseResult = parseMarkdownExamReport(
        combinedContent,
        studentUsers,
        studentsData,
        getMappedClassName
      );

      if (parseResult.rows.length === 0) {
        throw new Error('Markdown dosyasında tanınabilir sınav sonuç belgesi veya öğrenci kaydı bulunamadı. Lütfen sonuç belgesi formatını kontrol ediniz.');
      }

      // Auto-fill Title and Type if detected and currently empty
      if (parseResult.detectedExamTitle && !examTitle.trim()) {
        setExamTitle(parseResult.detectedExamTitle);
      }
      if (parseResult.detectedExamType) {
        setExamType(parseResult.detectedExamType);
      }

      setParsedRows(parseResult.rows);
      setSuccessMessage(`${parseResult.rows.length} adet öğrenci sınav sonuç karnesi tarayıcıda anında ayrıştırıldı. Lütfen verileri kontrol ediniz.`);
    } catch (err: any) {
      console.error('Markdown parse error:', err);
      setErrorMessage(err.message || 'Markdown dosyası ayrıştırılırken bir hata oluştu.');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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
        id: `inst-md-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
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
          tytGeneralAvg: row.tytGeneralAvg,
          tytClassRank: row.tytClassRank,
          tytClassTotal: row.classParticipantCount,
          tytInstitutionRank: row.tytInstitutionRank,
          tytInstitutionTotal: row.institutionParticipantCount,
          tytDistrictRank: row.tytDistrictRank,
          tytCityRank: row.tytCityRank,
          tytGeneralRank: row.tytGeneralRank,
          tytGeneralTotal: row.generalParticipantCount,
          sayScore: row.sayScore,
          sayGeneralAvg: row.sayGeneralAvg,
          sayClassRank: row.sayClassRank,
          sayClassTotal: row.classParticipantCount,
          sayInstitutionRank: row.sayInstitutionRank,
          sayInstitutionTotal: row.institutionParticipantCount,
          sayDistrictRank: row.sayDistrictRank,
          sayCityRank: row.sayCityRank,
          sayGeneralRank: row.sayGeneralRank,
          sayGeneralTotal: row.generalParticipantCount,
          eaScore: row.eaScore,
          eaGeneralAvg: row.eaGeneralAvg,
          eaClassRank: row.eaClassRank,
          eaClassTotal: row.classParticipantCount,
          eaInstitutionRank: row.eaInstitutionRank,
          eaInstitutionTotal: row.institutionParticipantCount,
          eaDistrictRank: row.eaDistrictRank,
          eaCityRank: row.eaCityRank,
          eaGeneralRank: row.eaGeneralRank,
          eaGeneralTotal: row.generalParticipantCount,
          sozScore: row.sozScore,
          sozGeneralAvg: row.sozGeneralAvg,
          sozClassRank: row.sozClassRank,
          sozClassTotal: row.classParticipantCount,
          sozInstitutionRank: row.sozInstitutionRank,
          sozInstitutionTotal: row.institutionParticipantCount,
          sozDistrictRank: row.sozDistrictRank,
          sozCityRank: row.sozCityRank,
          sozGeneralRank: row.sozGeneralRank,
          sozGeneralTotal: row.generalParticipantCount,
          classParticipantCount: row.classParticipantCount,
          institutionParticipantCount: row.institutionParticipantCount,
          districtParticipantCount: row.districtParticipantCount,
          cityParticipantCount: row.cityParticipantCount,
          generalParticipantCount: row.generalParticipantCount,
        },
        totalNet: row.totalNet,
        opticalAnswers: row.opticalAnswers,
        answerKeys: row.answerKeys,
        subjects: row.subjects
      };
    });

    onSaveInstitutionalExams(createdExams);

    if (onAddAuditLog) {
      onAddAuditLog(
        `Markdown (.md) dosyasından "${examTitle}" sınavına ait ${createdExams.length} adet öğrenci karnesi toplu olarak aktarıldı.`,
        'exam',
        'BULK_MD_EXAM_IMPORT'
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
      
      {/* 1. MARKDOWN YÜKLEME VE SINAV AYARLARI KARTI */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-md space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-br from-cyan-600 to-blue-600 rounded-2xl text-white shadow-lg shadow-cyan-600/20 border border-cyan-400/30">
              <FileCode className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Markdown (.MD) Sınav Sonuç Belgeleri Yükleme</span>
                <span className="text-[10px] bg-cyan-500/20 text-cyan-300 font-bold px-2.5 py-0.5 rounded-full border border-cyan-500/30 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-cyan-400" />
                  <span>Anında Tarayıcıda & Sıfır Jeton</span>
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                ÇAP, Özdebir, 3D, Bilgi Sarmal vb. sınav sonuçlarının Markdown (.md) metin dosyalarını yükleyin. Yapay zekaya ihtiyaç duymadan cihazınızda anında ayrıştırılır.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-semibold">Gizlilik & Hız:</span>
            <span className="text-xs font-bold text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-xl border border-cyan-500/20 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>%100 Çevrimdışı & Güvenli</span>
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
              placeholder="Örn: ÇAP TYT 1 TÜRKİYE GENELİ" 
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-all font-semibold"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Sınav Tarihi</label>
            <input 
              type="date" 
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 transition-all font-semibold"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Sınav Türü</label>
            <select
              value={examType}
              onChange={(e) => setExamType(e.target.value as any)}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 transition-all font-semibold cursor-pointer"
            >
              <option value="TYT">TYT (Temel Yeterlilik Testi)</option>
              <option value="AYT">AYT (Alan Yeterlilik Testi)</option>
              <option value="Ara Sınıf">Ara Sınıf KDS / Deneme</option>
            </select>
          </div>
        </div>

        {/* Drag & Drop File Zone */}
        <div className="relative border-2 border-dashed border-cyan-500/40 hover:border-cyan-400/80 bg-slate-950/60 rounded-3xl p-8 text-center transition-all group">
          <input 
            ref={fileInputRef}
            type="file" 
            accept=".md,.markdown,.txt,text/markdown,text/plain"
            multiple
            disabled={isProcessing}
            onChange={handleMarkdownUpload}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
          />
          
          <div className="space-y-3 flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform shadow-inner">
              <Upload className="w-7 h-7" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                Markdown (.md / .txt) Sonuç Belgesi Dosyalarını Buraya Sürükleyin veya Seçin
              </h4>
              <p className="text-xs text-slate-400 mt-1 max-w-lg mx-auto">
                Tek bir .md dosyası (Örn: denememd.md) veya birden fazla sınıf dosyasını aynı anda yükleyebilirsiniz.
              </p>
            </div>
          </div>
        </div>

        {/* Processing Indicator */}
        {isProcessing && (
          <div className="bg-cyan-950/30 border border-cyan-500/30 rounded-2xl p-5 flex items-center space-x-3 text-xs font-bold text-cyan-200 animate-fade-in">
            <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin shrink-0" />
            <span>Markdown dosyası taranıyor ve öğrenci karneleri ayrıştırılıyor...</span>
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
            <div className="p-3.5 bg-cyan-950/20 border border-cyan-500/30 rounded-2xl">
              <span className="text-[10px] uppercase font-bold text-cyan-400">Seçili Aktarılacak</span>
              <p className="text-xl font-black text-cyan-300 mt-0.5">{stats.selected}</p>
            </div>
          </div>

          {/* Action Header & Filters */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Sınıf Filtresi */}
              <select
                value={filterClass}
                onChange={(e) => { setFilterClass(e.target.value); setCurrentPage(1); }}
                className="bg-slate-950 border border-slate-800 text-slate-200 text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-cyan-500 font-semibold cursor-pointer"
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
                className="bg-slate-950 border border-slate-800 text-slate-200 text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-cyan-500 font-semibold cursor-pointer"
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
                  className="bg-slate-950 border border-slate-800 text-white text-xs pl-8 pr-3 py-2 rounded-xl placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-40 sm:w-52"
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
                  <th className="p-3">Öğrenci (Markdown)</th>
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
                    const totalNet = row.totalNet !== undefined 
                      ? row.totalNet.toFixed(2) 
                      : (
                          (row.subjects.find(s => s.subjectName === 'Türkçe' || s.subjectName === 'TYT Türkçe')?.net || 0) +
                          (row.subjects.find(s => s.subjectName === 'TYT Sosyal')?.net || 0) +
                          (row.subjects.find(s => s.subjectName === 'TYT Matematik')?.net || 0) +
                          (row.subjects.find(s => s.subjectName === 'TYT Fen')?.net || 0)
                        ).toFixed(2);
                    const isMatched = Boolean(row.matchedStudentId);

                    return (
                      <tr 
                        key={originalIndex} 
                        className={`hover:bg-slate-900/40 transition-colors ${
                          row.isSelected ? 'bg-cyan-950/20' : ''
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="p-3 text-center">
                          <input 
                            type="checkbox"
                            checked={row.isSelected}
                            disabled={!isMatched}
                            onChange={() => handleToggleRowSelect(originalIndex)}
                            className="rounded border-slate-700 text-cyan-600 focus:ring-0 cursor-pointer disabled:opacity-30"
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
                                <span className="text-cyan-400 font-bold bg-cyan-500/10 px-1.5 py-0.5 rounded text-[10px]">TYT</span>
                                <span className="text-white font-bold">{row.tytScore.toFixed(2)}</span>
                              </div>
                              <div className="flex items-center space-x-1 text-[10px] text-slate-400">
                                {row.tytClassRank ? <span className="text-emerald-400 font-semibold">Snf: {row.tytClassRank}{row.tytClassTotal || row.classParticipantCount ? `/${row.tytClassTotal || row.classParticipantCount}` : ''}</span> : null}
                                {row.tytInstitutionRank ? <span className="text-cyan-300 font-semibold">• Kurum: {row.tytInstitutionRank}{row.tytInstitutionTotal || row.institutionParticipantCount ? `/${row.tytInstitutionTotal || row.institutionParticipantCount}` : ''}</span> : null}
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
                        <td className="p-3 font-bold text-cyan-400 font-mono text-xs text-center whitespace-nowrap">
                          {totalNet} Net
                        </td>

                        {/* Action: Karneyi Görüntüle */}
                        <td className="p-3 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setSelectedDetailRow(row)}
                            className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl transition-all flex items-center gap-1.5 text-[11px] cursor-pointer shadow-md shadow-cyan-600/30 hover:scale-[1.02] ml-auto"
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
                        ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30' 
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

      {/* 3. AUTHENTIC REPORT CARD MODAL */}
      {selectedDetailRow && (
        <div 
          className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-md flex items-start justify-center p-2 sm:p-4 md:p-6 pt-20 sm:pt-24 pb-16 overflow-y-auto animate-fade-in"
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedDetailRow(null); }}
        >
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-6xl w-full p-4 sm:p-6 shadow-2xl space-y-4 my-2 relative">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 no-print">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-slate-400">Markdown Karne Önizleme:</span>
                <span className="text-xs font-black text-cyan-300">{selectedDetailRow.fileStudentName}</span>
                <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-500/30">
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
                id: 'preview-modal-row-md',
                examTitle: examTitle || 'Deneme Sınavı',
                examDate: examDate,
                examType: examType,
                studentName: selectedDetailRow.fileStudentName,
                schoolNumber: selectedDetailRow.fileSchoolNumber,
                className: selectedDetailRow.fileClassName,
                createdAt: new Date().toISOString(),
                scores: {
                  tytScore: selectedDetailRow.tytScore,
                  sayScore: selectedDetailRow.sayScore,
                  eaScore: selectedDetailRow.eaScore,
                  sozScore: selectedDetailRow.sozScore,
                  sayClassRank: selectedDetailRow.sayClassRank,
                  sayClassTotal: selectedDetailRow.sayClassTotal,
                  sayInstitutionRank: selectedDetailRow.sayInstitutionRank,
                  sayInstitutionTotal: selectedDetailRow.sayInstitutionTotal,
                  sayGeneralRank: selectedDetailRow.sayGeneralRank,
                  sayGeneralTotal: selectedDetailRow.sayGeneralTotal,
                  eaClassRank: selectedDetailRow.eaClassRank,
                  eaClassTotal: selectedDetailRow.eaClassTotal,
                  eaInstitutionRank: selectedDetailRow.eaInstitutionRank,
                  eaInstitutionTotal: selectedDetailRow.eaInstitutionTotal,
                  eaGeneralRank: selectedDetailRow.eaGeneralRank,
                  eaGeneralTotal: selectedDetailRow.eaGeneralTotal,
                  sozClassRank: selectedDetailRow.sozClassRank,
                  sozClassTotal: selectedDetailRow.sozClassTotal,
                  sozInstitutionRank: selectedDetailRow.sozInstitutionRank,
                  sozInstitutionTotal: selectedDetailRow.sozInstitutionTotal,
                  sozGeneralRank: selectedDetailRow.sozGeneralRank,
                  sozGeneralTotal: selectedDetailRow.sozGeneralTotal,
                  tytClassRank: selectedDetailRow.tytClassRank,
                  tytClassTotal: selectedDetailRow.tytClassTotal,
                  tytInstitutionRank: selectedDetailRow.tytInstitutionRank,
                  tytInstitutionTotal: selectedDetailRow.tytInstitutionTotal,
                  tytGeneralRank: selectedDetailRow.tytGeneralRank,
                  tytGeneralTotal: selectedDetailRow.tytGeneralTotal,
                  classParticipantCount: selectedDetailRow.classParticipantCount,
                  institutionParticipantCount: selectedDetailRow.institutionParticipantCount,
                  generalParticipantCount: selectedDetailRow.generalParticipantCount
                },
                totalNet: selectedDetailRow.totalNet,
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
