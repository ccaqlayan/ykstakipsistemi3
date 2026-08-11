import React from 'react';
import { 
  X, 
  TrendingUp, 
  Calendar, 
  CheckSquare, 
  BookOpenCheck, 
  BarChart3, 
  Youtube, 
  Footprints, 
  Plus, 
  Bookmark, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  FileSpreadsheet, 
  BookOpen, 
  Check 
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  Cell, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend 
} from 'recharts';
import { 
  UserAccount, 
  YKSDataState, 
  AuditLogItem, 
  ClassDefinition, 
  DayOfWeek 
} from '../../types';
import { AuditLogsView } from '../AuditLogsView';
import { isUserOnline } from '../../utils/statusUtils';

const DAYS: DayOfWeek[] = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';

interface TeacherStudentInspectModalProps {
  selectedStudentUser: UserAccount | null;
  setSelectedStudentUser: (user: UserAccount | null) => void;
  inspectModalTab: 'performance' | 'planner' | 'questions' | 'resources' | 'mocks' | 'youtube' | 'audit_logs';
  setInspectModalTab: (tab: 'performance' | 'planner' | 'questions' | 'resources' | 'mocks' | 'youtube' | 'audit_logs') => void;
  studentsData: Record<string, YKSDataState>;
  teacher: UserAccount;
  editingCoachNotes: string;
  setEditingCoachNotes: (notes: string) => void;
  handleSaveCoachNotes: () => void;
  setShowSaveTemplateModal: (show: boolean) => void;
  setShowAddTaskToStudentModal: (show: boolean) => void;
  isBranchTeacher: boolean;
  handleDeleteTaskFromStudent: (studentId: string, taskId: string) => void;
  handleToggleTaskStatusFromTeacher: (studentId: string, taskId: string, currentStatus: any) => void;
  classes: ClassDefinition[];
  allUsers: UserAccount[];
  auditLogs?: AuditLogItem[];
  OfflineStatusDisplay: React.FC<{ user: UserAccount; className?: string }>;
}

export const TeacherStudentInspectModal: React.FC<TeacherStudentInspectModalProps> = ({
  selectedStudentUser,
  setSelectedStudentUser,
  inspectModalTab,
  setInspectModalTab,
  studentsData,
  teacher,
  editingCoachNotes,
  setEditingCoachNotes,
  handleSaveCoachNotes,
  setShowSaveTemplateModal,
  setShowAddTaskToStudentModal,
  isBranchTeacher,
  handleDeleteTaskFromStudent,
  handleToggleTaskStatusFromTeacher,
  classes,
  allUsers,
  auditLogs = [],
  OfflineStatusDisplay
}) => {
  if (!selectedStudentUser) return null;

  return (
    <div 
      onClick={() => setSelectedStudentUser(null)}
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900/95 backdrop-blur-2xl border border-white/15 rounded-3xl max-w-6xl w-full p-5 sm:p-8 shadow-2xl space-y-5 my-6 max-h-[92vh] overflow-y-auto"
      >
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <img 
                src={selectedStudentUser.avatarUrl || DEFAULT_AVATAR} 
                alt={selectedStudentUser.name}
                className="w-14 h-14 rounded-2xl object-cover border-2 border-indigo-500/40 shadow-lg"
              />
              <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-900 ${
                isUserOnline(selectedStudentUser) ? 'bg-emerald-500' : 'bg-slate-500'
              }`} />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="bg-indigo-500/20 text-indigo-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-indigo-500/30">
                  {selectedStudentUser.className || '12-A SAY'}
                </span>
                {isUserOnline(selectedStudentUser) ? (
                  <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-1"></span>
                    <span>Çevrimiçi</span>
                  </span>
                ) : (
                  <OfflineStatusDisplay user={selectedStudentUser} className="text-[11px] text-slate-400 font-medium px-2 py-0.5 rounded-full bg-white/5 border border-white/5 hover:bg-white/10 transition-colors" />
                )}
              </div>
              <h2 className="text-xl font-extrabold text-white mt-1">
                {selectedStudentUser.name}
              </h2>
            </div>
          </div>

          <button 
            onClick={() => setSelectedStudentUser(null)}
            className="text-slate-400 hover:text-white p-2 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors shrink-0"
            title="Kapat (Dışarıya da tıklayabilirsiniz)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-tabs in Inspect Modal */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:flex lg:flex-wrap gap-2 pb-3 border-b border-white/10">
          <button
            onClick={() => setInspectModalTab('performance')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center sm:justify-start space-x-1.5 ${
              inspectModalTab === 'performance'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 border border-indigo-400/40'
                : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border border-white/10'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-indigo-300 shrink-0" />
            <span className="truncate">Performans & Koçluk</span>
          </button>

          <button
            onClick={() => setInspectModalTab('planner')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center sm:justify-start space-x-1.5 ${
              inspectModalTab === 'planner'
                ? 'bg-fuchsia-600 text-white shadow-lg shadow-fuchsia-600/30 border border-fuchsia-400/40'
                : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border border-white/10'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-fuchsia-300 shrink-0" />
            <span className="truncate">Çalışma Planı</span>
          </button>

          <button
            onClick={() => setInspectModalTab('questions')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center sm:justify-start space-x-1.5 ${
              inspectModalTab === 'questions'
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30 border border-amber-400/40'
                : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border border-white/10'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            <span className="truncate">Soru Takibi</span>
          </button>

          <button
            onClick={() => setInspectModalTab('resources')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center sm:justify-start space-x-1.5 ${
              inspectModalTab === 'resources'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 border border-emerald-400/40'
                : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border border-white/10'
            }`}
          >
            <BookOpenCheck className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
            <span className="truncate">Kaynak Takibi</span>
          </button>

          <button
            onClick={() => setInspectModalTab('mocks')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center sm:justify-start space-x-1.5 ${
              inspectModalTab === 'mocks'
                ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/30 border border-sky-400/40'
                : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border border-white/10'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-sky-300 shrink-0" />
            <span className="truncate">Deneme Takibi</span>
          </button>

          <button
            onClick={() => setInspectModalTab('youtube')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center sm:justify-start space-x-1.5 ${
              inspectModalTab === 'youtube'
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30 border border-rose-400/40'
                : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border border-white/10'
            }`}
          >
            <Youtube className="w-3.5 h-3.5 text-rose-300 shrink-0" />
            <span className="truncate">YouTube Takibi</span>
          </button>

          <button
            onClick={() => setInspectModalTab('audit_logs')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center sm:justify-start space-x-1.5 col-span-2 sm:col-span-1 ${
              inspectModalTab === 'audit_logs'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30 border border-purple-400/40'
                : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border border-white/10'
            }`}
          >
            <Footprints className="w-3.5 h-3.5 text-purple-300 shrink-0" />
            <span className="truncate">Ayak İzi</span>
          </button>
        </div>

        {/* TAB 1: PERFORMANCE & COACHING */}
        {inspectModalTab === 'performance' && (
          <div className="space-y-6">
            {(() => {
              const stData = studentsData[selectedStudentUser.id];
              const profile = stData?.profile;
              const mocks = stData?.generalMocks || [];
              const branchExams = stData?.branchExams || [];
              const questionLogs = stData?.questionLogs || [];
              const plans = stData?.studyPlans || [];
              const topicErrors = stData?.topicErrors || [];
              const unresolvedErrs = topicErrors.filter(e => !e.revised);

              const totalSolved = questionLogs.reduce((sum, q) => sum + (q.solvedCount || 0), 0);
              const totalCorrect = questionLogs.reduce((sum, q) => sum + (q.correctCount || 0), 0);
              const totalWrong = questionLogs.reduce((sum, q) => sum + (q.wrongCount || 0), 0);
              const accuracyPct = totalSolved > 0 ? Math.round((totalCorrect / totalSolved) * 100) : 0;

              const subjectMap: Record<string, { solved: number; correct: number; wrong: number }> = {};
              questionLogs.forEach(q => {
                const subj = q.subject || 'Diğer';
                if (!subjectMap[subj]) {
                  subjectMap[subj] = { solved: 0, correct: 0, wrong: 0 };
                }
                subjectMap[subj].solved += (q.solvedCount || 0);
                subjectMap[subj].correct += (q.correctCount || 0);
                subjectMap[subj].wrong += (q.wrongCount || 0);
              });

              const teacherSubj = (teacher.role === 'teacher' && teacher.subject) ? teacher.subject.toLowerCase() : '';
              const subjectData = Object.entries(subjectMap).map(([subject, stats]) => ({
                subject,
                count: stats.solved,
                correct: stats.correct,
                wrong: stats.wrong,
                accuracy: stats.solved > 0 ? Math.round((stats.correct / stats.solved) * 100) : 0
              })).sort((a, b) => {
                if (teacherSubj) {
                  const aMatch = a.subject.toLowerCase().includes(teacherSubj) || teacherSubj.includes(a.subject.toLowerCase());
                  const bMatch = b.subject.toLowerCase().includes(teacherSubj) || teacherSubj.includes(b.subject.toLowerCase());
                  if (aMatch && !bMatch) return -1;
                  if (!aMatch && bMatch) return 1;
                }
                return b.count - a.count;
              });

              const dateMap: Record<string, { date: string; solved: number; correct: number }> = {};
              questionLogs.forEach(q => {
                const d = q.date || 'Tarihsiz';
                if (!dateMap[d]) {
                  dateMap[d] = { date: d, solved: 0, correct: 0 };
                }
                dateMap[d].solved += (q.solvedCount || 0);
                dateMap[d].correct += (q.correctCount || 0);
              });
              const questionTrendData = Object.values(dateMap).sort((a, b) => a.date.localeCompare(b.date));

              const mockChartData = mocks.map((m, idx) => ({
                name: m.title ? (m.title.length > 14 ? m.title.substring(0, 14) + '...' : m.title) : `Deneme ${idx + 1}`,
                TYT: m.tyt?.totalNet || 0,
                AYT: m.ayt?.totalNet || 0,
                date: m.date
              }));

              const completedPlans = plans.filter(p => p.status === 'completed');
              const inProgressPlans = plans.filter(p => p.status === 'in_progress');
              const pendingPlans = plans.filter(p => p.status === 'pending');
              const totalPlannedMins = plans.reduce((acc, p) => acc + (p.plannedMinutes || 0), 0);
              const totalCompletedMins = plans.reduce((acc, p) => acc + (p.completedMinutes || 0), 0);

              return (
                <>
                  {/* Target Profile Summary */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white/5 p-4 rounded-2xl border border-white/10 text-xs">
                    <div>
                      <span className="text-slate-400 block font-semibold">Hedef Üniversite / Bölüm</span>
                      <strong className="text-white font-black text-sm">{profile?.targetUniversity || 'Belirtilmedi'}</strong>
                      <div className="text-indigo-300 font-bold">{profile?.targetDepartment} ({profile?.targetField})</div>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-semibold">Hedef Derece Sıralama</span>
                      <strong className="text-amber-300 font-black text-base">{profile?.targetRank ? `#${profile.targetRank.toLocaleString()}` : '-'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-semibold">Hedef Sınav Netleri</span>
                      <div className="font-mono text-emerald-400 font-bold text-sm">TYT: {profile?.targetTYTNet || 0} Net • AYT: {profile?.targetAYTNet || 0} Net</div>
                    </div>
                  </div>

                  {/* Quick Summary KPI Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-slate-900/90 p-4 rounded-2xl border border-indigo-500/30 space-y-1">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Toplam Soru</span>
                      <div className="text-2xl font-black text-indigo-400 font-mono">{totalSolved.toLocaleString()}</div>
                      <span className="text-[10px] text-slate-400 font-semibold">{totalCorrect} D / {totalWrong} Y</span>
                    </div>

                    <div className="bg-slate-900/90 p-4 rounded-2xl border border-emerald-500/30 space-y-1">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Doğruluk Oranı</span>
                      <div className="text-2xl font-black text-emerald-400 font-mono">%{accuracyPct}</div>
                      <span className="text-[10px] text-emerald-400/80 font-semibold">{totalCorrect} Soru Başarılı</span>
                    </div>

                    <div className="bg-slate-900/90 p-4 rounded-2xl border border-purple-500/30 space-y-1">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Denemeler</span>
                      <div className="text-2xl font-black text-purple-400 font-mono">{mocks.length + branchExams.length}</div>
                      <span className="text-[10px] text-slate-400 font-semibold">{mocks.length} Genel / {branchExams.length} Branş</span>
                    </div>

                    <div className="bg-slate-900/90 p-4 rounded-2xl border border-amber-500/30 space-y-1">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Çözülmeyen Hata</span>
                      <div className="text-2xl font-black text-amber-400 font-mono">{unresolvedErrs.length}</div>
                      <span className="text-[10px] text-amber-400/80 font-semibold">Konu Tekrarı Bekliyor</span>
                    </div>
                  </div>

                  {/* Coach Notes Input */}
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-200">Rehberlik & Koç Değerlendirme Notu</label>
                      <button
                        onClick={handleSaveCoachNotes}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl transition-all shadow-md"
                      >
                        Notu Kaydet
                      </button>
                    </div>
                    <textarea
                      rows={3}
                      value={editingCoachNotes}
                      onChange={(e) => setEditingCoachNotes(e.target.value)}
                      placeholder="Öğrencinin haftalık durumuna özel motivasyon veya rehberlik tavsiyelerinizi girin..."
                      className="w-full bg-slate-950/80 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  {/* Charts Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Mock Exam Trend */}
                    <div className="bg-slate-950/80 p-4 rounded-2xl border border-white/10 space-y-3">
                      <h3 className="text-xs font-bold text-white">Deneme Net Gelişim Trendi</h3>
                      {mockChartData.length === 0 ? (
                        <p className="text-xs text-slate-400 italic py-8 text-center">Henüz deneme kaydı yok.</p>
                      ) : (
                        <div className="h-56 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={mockChartData}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                              <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} />
                              <YAxis stroke="#94a3b8" fontSize={10} domain={[0, 120]} />
                              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }} />
                              <Legend wrapperStyle={{ fontSize: '11px' }} />
                              <Line type="monotone" dataKey="TYT" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 3 }} />
                              <Line type="monotone" dataKey="AYT" stroke="#34d399" strokeWidth={2.5} dot={{ r: 3 }} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </div>

                    {/* Question Trend */}
                    <div className="bg-slate-950/80 p-4 rounded-2xl border border-white/10 space-y-3">
                      <h3 className="text-xs font-bold text-white">Günlük Soru Çözüm Grafiği</h3>
                      {questionTrendData.length === 0 ? (
                        <p className="text-xs text-slate-400 italic py-8 text-center">Henüz soru çözüm kaydı yok.</p>
                      ) : (
                        <div className="h-56 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={questionTrendData}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                              <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} />
                              <YAxis stroke="#94a3b8" fontSize={10} />
                              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }} />
                              <Bar dataKey="solved" name="Çözülen Soru" fill="#818cf8" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {/* TAB 2: STUDY PLANNER */}
        {inspectModalTab === 'planner' && (
          <div className="space-y-6">
            {(() => {
              const stData = studentsData[selectedStudentUser.id];
              const plans = stData?.studyPlans || [];

              return (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/5 p-4 rounded-2xl border border-white/10">
                    <div>
                      <h3 className="text-sm font-bold text-white">Haftalık Çalışma Programı Yönetimi</h3>
                      <p className="text-xs text-slate-400 mt-0.5">Öğrenciye özel ders ve görev atayabilir, hazır şablon uygulayabilirsiniz.</p>
                    </div>

                    {!isBranchTeacher && (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setShowSaveTemplateModal(true)}
                          className="bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 font-bold text-xs px-3 py-2 rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer"
                        >
                          <Bookmark className="w-3.5 h-3.5" />
                          <span>Şablon Olarak Kaydet</span>
                        </button>
                        <button
                          onClick={() => setShowAddTaskToStudentModal(true)}
                          className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all shadow-md shadow-fuchsia-600/20 flex items-center space-x-1.5 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Yeni Görev Ekle</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {plans.length === 0 ? (
                    <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl space-y-2">
                      <Calendar className="w-8 h-8 text-slate-500 mx-auto" />
                      <p className="text-xs text-slate-400">Bu öğrencinin haftalık planında kayıtlı görev bulunmuyor.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {DAYS.map(day => {
                        const dayPlans = plans.filter(p => p.day === day);
                        if (dayPlans.length === 0) return null;

                        return (
                          <div key={day} className="bg-slate-950/80 border border-white/10 rounded-2xl p-4 space-y-2.5">
                            <div className="flex items-center justify-between border-b border-white/10 pb-2">
                              <span className="text-xs font-black text-fuchsia-400 uppercase tracking-wider">{day}</span>
                              <span className="text-[10px] text-slate-400 font-mono font-semibold">{dayPlans.length} Görev</span>
                            </div>

                            <div className="space-y-2">
                              {dayPlans.map(task => (
                                <div key={task.id} className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center justify-between gap-3 text-xs">
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center space-x-2">
                                      <span className="font-bold text-indigo-300">{task.subject}:</span>
                                      <span className="text-white font-medium truncate">{task.topic}</span>
                                    </div>
                                    <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                                      {task.plannedMinutes} Dk • {task.taskType || 'Konu Çalışması'}
                                    </div>
                                  </div>

                                  <div className="flex items-center space-x-1.5 shrink-0">
                                    <button
                                      onClick={() => handleToggleTaskStatusFromTeacher(selectedStudentUser.id, task.id, task.status)}
                                      className={`p-1.5 rounded-lg border transition-all ${
                                        task.status === 'completed'
                                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                          : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
                                      }`}
                                      title={task.status === 'completed' ? 'Tamamlandı işaretli' : 'Tamamlandı olarak işaretle'}
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                    </button>

                                    {!isBranchTeacher && (
                                      <button
                                        onClick={() => handleDeleteTaskFromStudent(selectedStudentUser.id, task.id)}
                                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                                        title="Görevi Sil"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* TAB 3: QUESTIONS */}
        {inspectModalTab === 'questions' && (
          <div className="space-y-6">
            {(() => {
              const stData = studentsData[selectedStudentUser.id];
              const logs = stData?.questionLogs || [];
              const teacherSubj = (teacher.role === 'teacher' && teacher.subject) ? teacher.subject.toLowerCase() : '';
              const sortedLogs = [...logs].sort((a, b) => {
                if (teacherSubj) {
                  const aMatch = (a.subject || '').toLowerCase().includes(teacherSubj) || teacherSubj.includes((a.subject || '').toLowerCase());
                  const bMatch = (b.subject || '').toLowerCase().includes(teacherSubj) || teacherSubj.includes((b.subject || '').toLowerCase());
                  if (aMatch && !bMatch) return -1;
                  if (!aMatch && bMatch) return 1;
                }
                return 0;
              });

              return (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                    <CheckSquare className="w-4 h-4 text-amber-400" />
                    <span>Öğrencinin Soru Çözüm Kayıtları ({logs.length})</span>
                  </h3>

                  {sortedLogs.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-8 text-center">Soru çözme kaydı bulunmuyor.</p>
                  ) : (
                    <div className="overflow-x-auto rounded-2xl border border-white/10">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-white/10 text-slate-300 font-bold">
                          <tr>
                            <th className="p-3">Tarih</th>
                            <th className="p-3">Ders & Konu</th>
                            <th className="p-3 text-center">Çözülen</th>
                            <th className="p-3 text-center text-emerald-400">Doğru</th>
                            <th className="p-3 text-center text-rose-400">Yanlış</th>
                            <th className="p-3 text-center text-slate-400">Boş</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10 text-slate-200 font-mono">
                          {sortedLogs.map((log) => {
                            const isMyBranch = teacherSubj && (log.subject || '').toLowerCase().includes(teacherSubj);
                            return (
                              <tr key={log.id} className={isMyBranch ? 'bg-amber-500/10 border-l-4 border-l-amber-400 hover:bg-amber-500/15' : 'hover:bg-white/5'}>
                                <td className="p-3 text-slate-400">{log.date}</td>
                                <td className="p-3 font-bold text-white flex items-center gap-1.5">
                                  <span>{log.subject}</span>
                                  {isMyBranch && <span className="text-[9px] bg-amber-500/30 text-amber-200 px-1.5 py-0.5 rounded border border-amber-400/40">Branşınız ⭐</span>}
                                  <span className="text-slate-400 font-normal">({log.topic})</span>
                                </td>
                                <td className="p-3 text-center font-bold text-indigo-300">{log.solvedCount}</td>
                                <td className="p-3 text-center text-emerald-400 font-bold">{log.correctCount}</td>
                                <td className="p-3 text-center text-rose-400 font-bold">{log.wrongCount}</td>
                                <td className="p-3 text-center text-slate-400">{log.emptyCount || 0}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* TAB 4: RESOURCES */}
        {inspectModalTab === 'resources' && (
          <div className="space-y-6">
            {(() => {
              const stData = studentsData[selectedStudentUser.id];
              const resources = stData?.resourceTrackers || [];

              return (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                    <BookOpenCheck className="w-4 h-4 text-emerald-400" />
                    <span>Kaynak ve Soru Bankası Takibi ({resources.length})</span>
                  </h3>

                  {resources.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-8 text-center">Kayıtlı soru bankası/kaynak bulunmuyor.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {resources.map((res) => {
                        const pct = res.totalTestCount > 0 ? Math.round((res.completedTestCount / res.totalTestCount) * 100) : 0;

                        return (
                          <div key={res.id} className="bg-slate-950/80 border border-white/10 rounded-2xl p-4 space-y-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <span className="text-[10px] font-bold bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30">
                                  {res.subject} • {res.publisher}
                                </span>
                                <h4 className="text-sm font-bold text-white mt-1">{res.bookName}</h4>
                              </div>
                              <span className="text-xs font-mono font-bold text-emerald-400">%{pct}</span>
                            </div>

                            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                              <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${pct}%` }} />
                            </div>

                            <div className="text-[11px] text-slate-400 font-mono flex justify-between">
                              <span>Bitirilen: {res.completedTestCount} / {res.totalTestCount} Test</span>
                              <span>{res.status === 'completed' ? '✅ Bitti' : '⏳ Devam Ediyor'}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* TAB 5: MOCKS */}
        {inspectModalTab === 'mocks' && (
          <div className="space-y-6">
            {(() => {
              const stData = studentsData[selectedStudentUser.id];
              const mocks = stData?.generalMocks || [];
              const branchExams = stData?.branchExams || [];
              const topicErrors = stData?.topicErrors || [];

              return (
                <div className="space-y-6">
                  {/* General Mocks */}
                  <div className="bg-slate-950/80 p-5 rounded-2xl border border-white/10 space-y-3">
                    <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                      <BarChart3 className="w-4 h-4 text-sky-400" />
                      <span>Genel Deneme Sınavı Netleri ({mocks.length})</span>
                    </h3>

                    {mocks.length === 0 ? (
                      <p className="text-xs text-slate-400 italic py-4 text-center">Genel deneme kaydı bulunmuyor.</p>
                    ) : (
                      <div className="overflow-x-auto rounded-xl border border-white/10">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-white/10 text-slate-300 font-bold">
                            <tr>
                              <th className="p-3">Tarih</th>
                              <th className="p-3">Deneme Başlığı</th>
                              <th className="p-3 text-center text-indigo-400 font-bold">TYT Net</th>
                              <th className="p-3 text-center text-emerald-400 font-bold">AYT Net</th>
                              <th className="p-3 text-center text-amber-400">Sıralama</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/10 text-slate-200 font-mono">
                            {mocks.map((m) => (
                              <tr key={m.id} className="hover:bg-white/5">
                                <td className="p-3 text-slate-400">{m.date}</td>
                                <td className="p-3 font-bold text-white">{m.title}</td>
                                <td className="p-3 text-center text-indigo-400 font-bold">{m.tyt?.totalNet} Net</td>
                                <td className="p-3 text-center text-emerald-400 font-bold">{m.ayt?.totalNet} Net</td>
                                <td className="p-3 text-center text-amber-400 font-bold">{m.estimatedRank ? `#${m.estimatedRank}` : '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Branch Exams */}
                  <div className="bg-slate-950/80 p-5 rounded-2xl border border-white/10 space-y-3">
                    <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                      <BarChart3 className="w-4 h-4 text-purple-400" />
                      <span>Branş Denemeleri ({branchExams.length})</span>
                    </h3>

                    {branchExams.length === 0 ? (
                      <p className="text-xs text-slate-400 italic py-4 text-center">Branş denemesi kaydı bulunmuyor.</p>
                    ) : (
                      <div className="overflow-x-auto rounded-xl border border-white/10">
                        {(() => {
                          const teacherSubj = (teacher.role === 'teacher' && teacher.subject) ? teacher.subject.toLowerCase() : '';
                          const sortedBranchExams = [...branchExams].sort((a, b) => {
                            if (teacherSubj) {
                              const aMatch = (a.subject || '').toLowerCase().includes(teacherSubj) || teacherSubj.includes((a.subject || '').toLowerCase());
                              const bMatch = (b.subject || '').toLowerCase().includes(teacherSubj) || teacherSubj.includes((b.subject || '').toLowerCase());
                              if (aMatch && !bMatch) return -1;
                              if (!aMatch && bMatch) return 1;
                            }
                            return 0;
                          });

                          return (
                            <table className="w-full text-left text-xs">
                              <thead className="bg-white/10 text-slate-300 font-bold">
                                <tr>
                                  <th className="p-3">Tarih</th>
                                  <th className="p-3">Ders & Yayınevi</th>
                                  <th className="p-3 text-center text-emerald-400">Doğru</th>
                                  <th className="p-3 text-center text-rose-400">Yanlış</th>
                                  <th className="p-3 text-center text-slate-400">Boş</th>
                                  <th className="p-3 text-center text-indigo-400 font-bold">Net</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-white/10 text-slate-200 font-mono">
                                {sortedBranchExams.map((ex) => {
                                  const isMyBranch = teacherSubj && (ex.subject || '').toLowerCase().includes(teacherSubj);
                                  return (
                                    <tr key={ex.id} className={isMyBranch ? 'bg-amber-500/10 border-l-4 border-l-amber-400 hover:bg-amber-500/15' : 'hover:bg-white/5'}>
                                      <td className="p-3 text-slate-400">{ex.date}</td>
                                      <td className="p-3 font-bold text-white flex items-center gap-1.5">
                                        <span>{ex.subject}</span>
                                        {isMyBranch && <span className="text-[9px] bg-amber-500/30 text-amber-200 px-1.5 py-0.5 rounded border border-amber-400/40">Branşınız ⭐</span>}
                                        <span className="text-slate-400 font-normal">({ex.publisher})</span>
                                      </td>
                                      <td className="p-3 text-center text-emerald-400 font-bold">{ex.correct}</td>
                                      <td className="p-3 text-center text-rose-400 font-bold">{ex.wrong}</td>
                                      <td className="p-3 text-center text-slate-400">{ex.empty}</td>
                                      <td className="p-3 text-center text-indigo-400 font-bold">{ex.net} Net</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* TAB 6: YOUTUBE */}
        {inspectModalTab === 'youtube' && (
          <div className="space-y-6">
            {(() => {
              const stData = studentsData[selectedStudentUser.id];
              const youtubeVideos = stData?.youtubeVideos || [];
              const totalVideos = youtubeVideos.length;
              const watchedCount = youtubeVideos.filter(v => v.isWatched).length;

              return (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                      <span className="text-xs text-slate-400 font-semibold block">Takip Edilen Ders / Playlist</span>
                      <span className="text-2xl font-black text-rose-400 font-mono mt-1 block">{totalVideos} <span className="text-xs font-normal text-slate-400">İçerik</span></span>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                      <span className="text-xs text-slate-400 font-semibold block">İzlenen / Tamamlanan</span>
                      <span className="text-2xl font-black text-emerald-400 font-mono mt-1 block">{watchedCount} <span className="text-xs font-normal text-slate-400">Video</span></span>
                    </div>
                  </div>

                  <div className="bg-slate-950/80 p-5 rounded-2xl border border-white/10 space-y-3">
                    <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                      <Youtube className="w-4 h-4 text-rose-400" />
                      <span>Öğrencinin Takip Ettiği YouTube Ders Kanal ve Videoları</span>
                    </h3>

                    {youtubeVideos.length === 0 ? (
                      <div className="text-center py-8 text-slate-400 text-xs italic border border-dashed border-white/10 rounded-xl">
                        Öğrenci henüz YouTube ders takibi eklememiş.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {youtubeVideos.map((vid) => (
                          <div key={vid.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2">
                            <div className="flex justify-between items-start">
                              <div>
                                <span className="text-[10px] font-bold bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded border border-rose-500/30">
                                  {vid.subject} • {vid.channelName}
                                </span>
                                <h4 className="text-sm font-bold text-white mt-1">{vid.topicName}</h4>
                              </div>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                vid.isWatched ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              }`}>
                                {vid.isWatched ? '✅ İzlendi' : '⏳ İzlenecek'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* TAB 7: AUDIT LOGS */}
        {inspectModalTab === 'audit_logs' && (
          <AuditLogsView
            currentUser={selectedStudentUser}
            auditLogs={auditLogs.filter(
              l => l.actorId === selectedStudentUser.id || l.targetUserId === selectedStudentUser.id
            )}
            classes={classes}
            studentsData={studentsData}
            allUsers={allUsers}
          />
        )}

      </div>
    </div>
  );
};
