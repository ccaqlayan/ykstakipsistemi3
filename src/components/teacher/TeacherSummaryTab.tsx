import React from 'react';
import { 
  Users, 
  BookOpen, 
  Clock, 
  CheckCircle2, 
  Building2, 
  Plus, 
  GraduationCap, 
  ChevronRight
} from 'lucide-react';
import { UserAccount } from '../../types';

export interface ClassSummaryItem {
  className: string;
  registeredCount: number;
  activeCount: number;
  activePercent: number;
  avgTYT: number | string;
  avgAYT: number | string;
  totalQuestions: number;
}


interface TeacherSummaryTabProps {
  assignedStudentsList: UserAccount[];
  activeStudentCountOverall: number;
  totalWeeklyQuestions: number;
  weeklyStudyHours: number;
  planCompletionRate: number;
  totalCompletedPlans: number;
  totalPlansCount: number;
  classSummaries: ClassSummaryItem[];
  setShowCreateClassModal: (show: boolean) => void;
  setSelectedClassFilter: (className: string) => void;
  setActiveTeacherView: (view: 'summary' | 'students' | 'teachers' | 'templates') => void;
}

export const TeacherSummaryTab: React.FC<TeacherSummaryTabProps> = ({
  assignedStudentsList,
  activeStudentCountOverall,
  totalWeeklyQuestions,
  weeklyStudyHours,
  planCompletionRate,
  totalCompletedPlans,
  totalPlansCount,
  classSummaries,
  setShowCreateClassModal,
  setSelectedClassFilter,
  setActiveTeacherView
}) => {
  return (
    <div className="space-y-6">
      
      {/* Weekly Executive Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1: Total & Active Students */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Toplam & Aktif Öğrenci</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white font-mono flex items-baseline space-x-2">
            <span>{assignedStudentsList.length}</span>
            <span className="text-xs font-medium text-emerald-400">({activeStudentCountOverall} Aktif)</span>
          </div>
          <div className="w-full bg-white/10 h-1.5 rounded-full mt-2 overflow-hidden">
            <div 
              className="bg-emerald-400 h-full rounded-full transition-all duration-500" 
              style={{ width: `${assignedStudentsList.length > 0 ? (activeStudentCountOverall / assignedStudentsList.length) * 100 : 0}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-400 mt-1.5 flex justify-between">
            <span>Aktiflik Oranı:</span>
            <span className="font-bold text-emerald-400">%{assignedStudentsList.length > 0 ? Math.round((activeStudentCountOverall / assignedStudentsList.length) * 100) : 0}</span>
          </p>
        </div>

        {/* Metric 2: Weekly Solved Questions */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Toplam Çözülen Soru</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-300 font-mono">{totalWeeklyQuestions.toLocaleString()} <span className="text-xs text-slate-400 font-normal">Soru</span></div>
          <p className="text-[10px] text-slate-400 mt-2">Atanmış tüm öğrencilerin soru toplamı</p>
        </div>

        {/* Metric 3: Weekly Study Hours */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Çalışma Programı Süresi</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-300 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-300 font-mono">{weeklyStudyHours} <span className="text-xs text-slate-400 font-normal">Saat</span></div>
          <p className="text-[10px] text-slate-400 mt-2">Tamamlanan çalışma programı saati</p>
        </div>

        {/* Metric 4: Program Completion Rate */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Program Uyum Oranı</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">%{planCompletionRate}</div>
          <p className="text-[10px] text-slate-400 mt-2">{totalCompletedPlans} / {totalPlansCount} Görev tamamlandı</p>
        </div>

      </div>

      {/* Section: Rectangular Class Cards (Sınıf Kutuları) */}
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <Building2 className="w-5 h-5 text-indigo-400" />
              <span>Sınıflarınız ve Öğrenci Durumu ({classSummaries.length} Sınıf)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Her bir sınıfın kayıtlı öğrenci sayısı ve aktif sistemi kullanan öğrenci sayısı. Detaylar ve öğrenci listesi için sınıfa tıklayın.
            </p>
          </div>
          <button
            onClick={() => setShowCreateClassModal(true)}
            className="bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 text-xs font-bold px-3 py-2 rounded-xl transition-all flex items-center space-x-1.5 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 text-indigo-400" />
            <span>Yeni Sınıf Ekle</span>
          </button>
        </div>

        {classSummaries.length === 0 ? (
          <div className="text-center py-12 bg-slate-950/40 rounded-2xl border border-dashed border-slate-800">
            <Building2 className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-400 font-medium">Henüz atanmış veya tanımlı sınıf bulunmuyor.</p>
            <button
              onClick={() => setShowCreateClassModal(true)}
              className="mt-3 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl"
            >
              Sınıf Eklemek İçin Tıklayın
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {classSummaries.map((cls) => (
              <div
                key={cls.className}
                onClick={() => {
                  setSelectedClassFilter(cls.className);
                  setActiveTeacherView('students');
                }}
                className="bg-slate-950/80 hover:bg-slate-800/90 border border-slate-800 hover:border-indigo-500/60 rounded-2xl p-5 shadow-xl transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  {/* Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 flex items-center justify-center font-bold">
                        <GraduationCap className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors flex items-center space-x-1.5">
                          <span>{cls.className}</span>
                        </h3>
                        <span className="text-[11px] text-slate-400">Atanmış Sınıf</span>
                      </div>
                    </div>
                    <span className="text-[11px] bg-indigo-500/10 text-indigo-300 font-semibold px-2.5 py-1 rounded-lg border border-indigo-500/20">
                      {cls.registeredCount} Öğrenci
                    </span>
                  </div>

                  {/* Main Numbers Breakdown Box */}
                  <div className="grid grid-cols-2 gap-3 my-3 bg-slate-900/90 p-3.5 rounded-xl border border-slate-800">
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Kayıtlı Öğrenci</span>
                      <div className="text-xl font-black text-white font-mono mt-0.5">{cls.registeredCount} <span className="text-xs text-slate-400 font-normal">Kişi</span></div>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center space-x-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block"></span>
                        <span>Aktif Kullanıcı</span>
                      </span>
                      <div className="text-xl font-black text-emerald-400 font-mono mt-0.5">{cls.activeCount} <span className="text-xs text-slate-400 font-normal">Kişi</span></div>
                    </div>
                  </div>

                  {/* Active Usage Progress Bar */}
                  <div className="space-y-1 mb-4">
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Sistem Aktif Kullanım Oranı:</span>
                      <span className="font-bold text-emerald-400 font-mono">%{cls.activePercent}</span>
                    </div>
                    <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                      <div 
                        className="bg-emerald-400 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${cls.activePercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Academic Quick Stats */}
                  <div className="space-y-1.5 border-t border-slate-800/80 pt-3 text-xs">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400">TYT Net Ortalaması:</span>
                      <span className="font-bold text-emerald-400 font-mono">{cls.avgTYT} Net</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400">AYT Net Ortalaması:</span>
                      <span className="font-bold text-purple-300 font-mono">{cls.avgAYT} Net</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400">Toplam Çözülen Soru:</span>
                      <span className="font-bold text-amber-300 font-mono">{cls.totalQuestions.toLocaleString()} Soru</span>
                    </div>
                  </div>
                </div>

                {/* Action Link Footer */}
                <div className="mt-4 pt-3 border-t border-slate-800/90 flex items-center justify-between text-xs font-bold text-indigo-400 group-hover:text-indigo-300 transition-colors">
                  <span>Öğrenci Yönetim & Takip Sayfasına Git</span>
                  <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
