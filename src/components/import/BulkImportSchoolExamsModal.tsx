import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Upload, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  Download, 
  ArrowRight, 
  Users, 
  GraduationCap, 
  Check, 
  Trash2, 
  Building2,
  HelpCircle,
  FileText
} from 'lucide-react';
import { SchoolExam, UserAccount, YKSDataState } from '../../types';

interface ParsedExamRow {
  id: string;
  studentNameRaw: string;
  schoolNumberRaw: string;
  classNameRaw: string;
  matchedStudentId: string | null;
  matchedStudentName: string | null;
  matchedClassName: string | null;
  subject: string;
  semester: 1 | 2;
  examNumber: 1 | 2;
  score: number;
  classAverage: number;
  examDate: string;
  notes?: string;
  status: 'valid' | 'warning' | 'error';
  statusMessage?: string;
  isSelected: boolean;
}

interface BulkImportSchoolExamsModalProps {
  isOpen: boolean;
  onClose: () => void;
  allUsers: UserAccount[];
  classes: { id: string; name: string }[];
  onApplyBulkSchoolExams: (updates: { studentId: string; exams: SchoolExam[] }[]) => void;
}

export const BulkImportSchoolExamsModal: React.FC<BulkImportSchoolExamsModalProps> = ({
  isOpen,
  onClose,
  allUsers,
  classes,
  onApplyBulkSchoolExams
}) => {
  const [activeInputMode, setActiveInputMode] = useState<'file' | 'paste'>('file');
  const [pastedText, setPastedText] = useState('');
  const [parsedRows, setParsedRows] = useState<ParsedExamRow[]>([]);
  const [defaultSemester, setDefaultSemester] = useState<1 | 2>(1);
  const [defaultExamNumber, setDefaultExamNumber] = useState<1 | 2>(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const studentsList = allUsers.filter(u => u.role === 'student');

  // Match raw student name/number with existing system students
  const matchStudent = (nameRaw: string, numberRaw: string, classRaw?: string): UserAccount | undefined => {
    const cleanNum = (numberRaw || '').trim().toLowerCase();
    const cleanName = (nameRaw || '').trim().toLowerCase().replace(/[\s\-_]+/g, ' ');
    const cleanClass = (classRaw || '').trim().toLowerCase();

    // 1. Try school number match
    if (cleanNum) {
      const byNum = studentsList.find(s => (s.schoolNumber || '').trim().toLowerCase() === cleanNum);
      if (byNum) return byNum;
    }

    // 2. Try exact name match in the same class
    if (cleanClass) {
      const byNameAndClass = studentsList.find(s => 
        (s.name || '').trim().toLowerCase() === cleanName && 
        (s.className || '').trim().toLowerCase().includes(cleanClass)
      );
      if (byNameAndClass) return byNameAndClass;
    }

    // 3. Try exact name match
    const byName = studentsList.find(s => (s.name || '').trim().toLowerCase() === cleanName);
    if (byName) return byName;

    // 4. Try fuzzy name match (first and last name)
    const byFuzzyName = studentsList.find(s => {
      const sName = (s.name || '').trim().toLowerCase();
      return cleanName.includes(sName) || sName.includes(cleanName);
    });

    return byFuzzyName;
  };

  const parseCsvOrText = (rawContent: string) => {
    if (!rawContent || !rawContent.trim()) return;

    const lines = rawContent.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length === 0) return;

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const newRows: ParsedExamRow[] = [];

    // Check if line 0 is a header
    const firstLine = lines[0].toLowerCase();
    const startIndex = (firstLine.includes('öğrenci') || firstLine.includes('ad') || firstLine.includes('not') || firstLine.includes('ders')) ? 1 : 0;

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];
      // Delimiter could be comma, semicolon or tab
      let parts = line.split('\t');
      if (parts.length < 3) parts = line.split(';');
      if (parts.length < 3) parts = line.split(',');

      if (parts.length < 2) continue;

      const trimmedParts = parts.map(p => p.trim().replace(/^["']|["']$/g, ''));

      let schoolNumberRaw = '';
      let studentNameRaw = '';
      let classNameRaw = '';
      let subject = 'Matematik';
      let semester: 1 | 2 = defaultSemester;
      let examNumber: 1 | 2 = defaultExamNumber;
      let score = 0;
      let classAverage = 70;

      if (trimmedParts.length >= 8) {
        schoolNumberRaw = trimmedParts[0];
        studentNameRaw = trimmedParts[1];
        classNameRaw = trimmedParts[2];
        subject = trimmedParts[3] || 'Matematik';
        semester = trimmedParts[4] === '2' ? 2 : 1;
        examNumber = trimmedParts[5] === '2' ? 2 : 1;
        score = parseFloat(trimmedParts[6].replace(',', '.')) || 0;
        classAverage = parseFloat(trimmedParts[7].replace(',', '.')) || 70;
      } else if (trimmedParts.length >= 6) {
        schoolNumberRaw = trimmedParts[0];
        studentNameRaw = trimmedParts[1];
        subject = trimmedParts[2] || 'Matematik';
        semester = trimmedParts[3] === '2' ? 2 : defaultSemester;
        score = parseFloat(trimmedParts[4].replace(',', '.')) || 0;
        classAverage = parseFloat(trimmedParts[5].replace(',', '.')) || 70;
      } else if (trimmedParts.length >= 4) {
        studentNameRaw = trimmedParts[0];
        subject = trimmedParts[1] || 'Matematik';
        score = parseFloat(trimmedParts[2].replace(',', '.')) || 0;
        classAverage = parseFloat(trimmedParts[3].replace(',', '.')) || 70;
      } else if (trimmedParts.length >= 3) {
        studentNameRaw = trimmedParts[0];
        subject = trimmedParts[1] || 'Matematik';
        score = parseFloat(trimmedParts[2].replace(',', '.')) || 0;
      }

      const matched = matchStudent(studentNameRaw, schoolNumberRaw, classNameRaw);

      let status: 'valid' | 'warning' | 'error' = 'valid';
      let statusMessage = 'Eşleşti';

      if (!matched) {
        status = 'error';
        statusMessage = 'Öğrenci sistemde bulunamadı';
      } else if (score < 0 || score > 100 || isNaN(score)) {
        status = 'warning';
        statusMessage = 'Not 0-100 aralığı dışında';
      }

      newRows.push({
        id: `parsed-${Date.now()}-${i}`,
        studentNameRaw: studentNameRaw || (matched ? matched.name : 'Bilinmeyen'),
        schoolNumberRaw: schoolNumberRaw || (matched ? matched.schoolNumber || '' : ''),
        classNameRaw: classNameRaw || (matched ? matched.className || '' : ''),
        matchedStudentId: matched ? matched.id : null,
        matchedStudentName: matched ? matched.name : null,
        matchedClassName: matched ? matched.className || null : null,
        subject,
        semester,
        examNumber,
        score: Math.min(100, Math.max(0, score)),
        classAverage: Math.min(100, Math.max(0, classAverage)),
        examDate: todayStr,
        status,
        statusMessage,
        isSelected: status !== 'error'
      });
    }

    setParsedRows(newRows);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          parseCsvOrText(text);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleApplyImport = () => {
    const validSelected = parsedRows.filter(r => r.isSelected && r.matchedStudentId);
    if (validSelected.length === 0) return;

    setIsProcessing(true);

    const studentMap: Record<string, SchoolExam[]> = {};

    validSelected.forEach(row => {
      if (!row.matchedStudentId) return;
      if (!studentMap[row.matchedStudentId]) {
        studentMap[row.matchedStudentId] = [];
      }

      studentMap[row.matchedStudentId].push({
        id: `exam-import-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        semester: row.semester,
        examNumber: row.examNumber,
        subject: row.subject,
        score: row.score,
        classAverage: row.classAverage,
        date: row.examDate,
        notes: row.notes || 'E-Okul Not Çizelgesi Toplu Aktarımı'
      });
    });

    const updates = Object.entries(studentMap).map(([studentId, exams]) => ({
      studentId,
      exams
    }));

    onApplyBulkSchoolExams(updates);

    setIsProcessing(false);
    setSuccessMessage(`${validSelected.length} adet okul yazılı sınav notu başarıyla öğrencilere aktarıldı!`);
    setTimeout(() => {
      setSuccessMessage(null);
      onClose();
    }, 1800);
  };

  const handleDownloadSampleTemplate = () => {
    const sampleContent = 
`Okul No\tÖğrenci Ad Soyad\tSınıf\tDers\tDönem\tSınav No\tNot\tSınıf Ortalaması
101\tEren Aydın\t9-A (Maarif)\tTürk Dili ve Edebiyatı\t1\t1\t92\t76.5
101\tEren Aydın\t9-A (Maarif)\tMatematik\t1\t1\t95\t70.0
102\tSelin Yılmaz\t10-A (Maarif)\tMatematik\t1\t1\t88\t68.5
103\tKerem Yıldız\t11-A SAY\tFizik\t1\t1\t84\t65.0
104\tAhmet Yılmaz\t12-A SAY\tMatematik\t1\t1\t96\t74.0`;

    const blob = new Blob([sampleContent], { type: 'text/tab-separated-values;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'e_okul_yazili_not_sablonu.tsv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200 font-sans">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white flex items-center space-x-2">
                <span>E-Okul / Excel Toplu Yazılı Notu İçe Aktar</span>
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-mono">
                  MEB & Maarif Uyumlu
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                E-Okul not çizelgesi veya Excel dosyasını yükleyerek tüm şubelerin yazılı sınav notlarını tek tıkla işleyin.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 custom-scrollbar">

          {/* Success Banner */}
          {successMessage && (
            <div className="p-4 bg-emerald-500/20 border border-emerald-500/30 rounded-2xl flex items-center space-x-3 text-emerald-300 animate-in slide-in-from-top duration-300">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
              <span className="text-xs font-bold">{successMessage}</span>
            </div>
          )}

          {/* Quick Info & Template Download */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-indigo-950/40 border border-indigo-500/20 rounded-2xl gap-3">
            <div className="flex items-center space-x-2.5">
              <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
              <span className="text-xs text-slate-300 font-medium">
                Öğrenciler isim veya okul numarasına göre otomatik eşleştirilir.
              </span>
            </div>
            <button
              onClick={handleDownloadSampleTemplate}
              className="px-3 py-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 text-xs font-bold rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Örnek E-Okul Şablonu (.tsv)</span>
            </button>
          </div>

          {/* Input Method Selector */}
          <div className="flex space-x-2 border-b border-slate-800 pb-3">
            <button
              onClick={() => setActiveInputMode('file')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
                activeInputMode === 'file'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Excel / CSV / TSV Dosyası Yükle</span>
            </button>
            <button
              onClick={() => setActiveInputMode('paste')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
                activeInputMode === 'paste'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Metin / Tablo Yapıştır</span>
            </button>
          </div>

          {/* Input Area */}
          {activeInputMode === 'file' ? (
            <label className="border-2 border-dashed border-slate-700 hover:border-indigo-500/60 bg-slate-950/40 hover:bg-slate-950/70 rounded-3xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all space-y-3 group">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 group-hover:scale-110 flex items-center justify-center text-indigo-400 transition-all">
                <Upload className="w-6 h-6" />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-white">E-Okul Not Çizelgesi veya Not Dosyasını Buraya Bırakın</p>
                <p className="text-xs text-slate-400 mt-1">.csv, .tsv, .txt formatları desteklenir</p>
              </div>
              <input
                type="file"
                accept=".csv,.tsv,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          ) : (
            <div className="space-y-2">
              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder={`E-Okul'dan veya Excel tablosundan kopyaladığınız satırları buraya yapıştırın:\nÖrnek:\nEren Aydın\tMatematik\t95\t70\nSelin Yılmaz\tFizik\t88\t68`}
                className="w-full h-32 bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/60 resize-none"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => parseCsvOrText(pastedText)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center space-x-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Tabloyu Ayrıştır ve İncele</span>
                </button>
              </div>
            </div>
          )}

          {/* Parsed Rows Table */}
          {parsedRows.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-white">
                    Ayrıştırılan Not Kayıtları ({parsedRows.filter(r => r.isSelected).length}/{parsedRows.length} Seçili)
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setParsedRows(prev => prev.map(r => ({ ...r, isSelected: true })))}
                    className="text-[11px] font-semibold text-indigo-300 hover:underline"
                  >
                    Tümünü Seç
                  </button>
                  <span className="text-slate-600">•</span>
                  <button
                    type="button"
                    onClick={() => setParsedRows([])}
                    className="text-[11px] font-semibold text-rose-400 hover:underline"
                  >
                    Temizle
                  </button>
                </div>
              </div>

              <div className="border border-slate-800 rounded-2xl overflow-hidden max-h-64 overflow-y-auto custom-scrollbar">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 sticky top-0">
                    <tr>
                      <th className="p-3 w-8">
                        <input
                          type="checkbox"
                          checked={parsedRows.length > 0 && parsedRows.every(r => r.isSelected)}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setParsedRows(prev => prev.map(r => ({ ...r, isSelected: checked })));
                          }}
                          className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0"
                        />
                      </th>
                      <th className="p-3">Öğrenci (Eşleşen)</th>
                      <th className="p-3">Şube</th>
                      <th className="p-3">Ders</th>
                      <th className="p-3">Dönem / Sınav</th>
                      <th className="p-3">Not</th>
                      <th className="p-3">Sınıf Ort.</th>
                      <th className="p-3">Durum</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-sans">
                    {parsedRows.map((row) => (
                      <tr 
                        key={row.id} 
                        className={`hover:bg-slate-800/30 transition-colors ${
                          !row.matchedStudentId ? 'bg-rose-500/5' : ''
                        }`}
                      >
                        <td className="p-3">
                          <input
                            type="checkbox"
                            checked={row.isSelected}
                            disabled={!row.matchedStudentId}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setParsedRows(prev => prev.map(r => r.id === row.id ? { ...r, isSelected: checked } : r));
                            }}
                            className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0"
                          />
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-white">{row.matchedStudentName || row.studentNameRaw}</div>
                          {row.schoolNumberRaw && (
                            <div className="text-[10px] text-slate-400">No: {row.schoolNumberRaw}</div>
                          )}
                        </td>
                        <td className="p-3 text-slate-300">
                          <span className="px-2 py-0.5 bg-slate-800 rounded-lg text-[10px] font-semibold">
                            {row.matchedClassName || row.classNameRaw || 'Belirtilmedi'}
                          </span>
                        </td>
                        <td className="p-3 font-semibold text-indigo-300">{row.subject}</td>
                        <td className="p-3 text-slate-400 text-[11px]">
                          {row.semester}. Dönem • {row.examNumber}. Yazılı
                        </td>
                        <td className="p-3 font-mono font-bold text-emerald-400">
                          {row.score}
                        </td>
                        <td className="p-3 font-mono text-slate-400 text-[11px]">
                          {row.classAverage}
                        </td>
                        <td className="p-3">
                          {row.status === 'valid' ? (
                            <span className="inline-flex items-center space-x-1 text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-semibold">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Hazır</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 text-[10px] text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full font-semibold" title={row.statusMessage}>
                              <AlertTriangle className="w-3 h-3" />
                              <span>{row.statusMessage}</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            {parsedRows.filter(r => r.isSelected && r.matchedStudentId).length} öğrenci sınav notu işlenecek.
          </div>
          <div className="flex space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              Vazgeç
            </button>
            <button
              onClick={handleApplyImport}
              disabled={isProcessing || parsedRows.filter(r => r.isSelected && r.matchedStudentId).length === 0}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/30 flex items-center space-x-2 cursor-pointer disabled:cursor-not-allowed"
            >
              <Check className="w-4 h-4" />
              <span>{isProcessing ? 'İşleniyor...' : 'Seçilen Notları Öğrencilere Aktar'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
};
