import React from 'react';
import { Bookmark, Plus, Clock, Edit, Eye, Download, Trash2 } from 'lucide-react';
import { StudyProgramTemplate, UserAccount } from '../../types';

interface TeacherTemplatesTabProps {
  programTemplates: StudyProgramTemplate[];
  setShowCreateTemplateModal: (show: boolean) => void;
  setWeeklyPreviewTemplate: (tpl: StudyProgramTemplate | null) => void;
  setSelectedTemplateToApply: (tpl: StudyProgramTemplate) => void;
  setTargetStudentIdForApply: (id: string) => void;
  studentUsers: UserAccount[];
  setShowApplyTemplateModal: (show: boolean) => void;
  onDeleteProgramTemplate: (id: string) => void;
}

export const TeacherTemplatesTab: React.FC<TeacherTemplatesTabProps> = ({
  programTemplates,
  setShowCreateTemplateModal,
  setWeeklyPreviewTemplate,
  setSelectedTemplateToApply,
  setTargetStudentIdForApply,
  studentUsers,
  setShowApplyTemplateModal,
  onDeleteProgramTemplate
}) => {
  return (
    <div className="space-y-6">
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <h2 className="text-lg font-extrabold text-white flex items-center space-x-2">
              <Bookmark className="w-5 h-5 text-fuchsia-400" />
              <span>Kayıtlı Çalışma Programı Şablonları Kütüphanesi</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Öğretmenlerin beğendiği ve kaydettiği tüm haftalık çalışma programı şablonları. Dilediğiniz şablonu herhangi bir öğrenciye tek tıkla uygulayabilirsiniz.
            </p>
          </div>

          <button
            onClick={() => setShowCreateTemplateModal(true)}
            className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white text-xs font-bold px-4 py-2.5 rounded-2xl transition-all shadow-lg shadow-fuchsia-600/30 border border-fuchsia-400/40 flex items-center space-x-2 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Sıfırdan Yeni Şablon Oluştur</span>
          </button>
        </div>

        {/* Template Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
          {programTemplates.map((tpl) => {
            return (
              <div 
                key={tpl.id}
                className="bg-slate-900/90 border border-white/10 rounded-2xl p-5 shadow-xl flex flex-col justify-between hover:border-fuchsia-500/40 transition-all space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-bold bg-fuchsia-500/20 text-fuchsia-300 px-2.5 py-1 rounded-full border border-fuchsia-500/30 uppercase tracking-wider">
                      {tpl.targetField || 'TÜMÜ'}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{tpl.items.length} Görev Maddesi</span>
                    </span>
                  </div>

                  <h3 
                    onClick={() => setWeeklyPreviewTemplate(tpl)}
                    className="text-base font-extrabold text-white tracking-tight cursor-pointer hover:text-fuchsia-300 transition-colors flex items-center justify-between group"
                    title="İsmi/Açıklamayı Düzenle ve Geniş Ekran Haftalık Önizleme Aç"
                  >
                    <span>{tpl.title}</span>
                    <Edit className="w-4 h-4 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </h3>

                  {tpl.description && (
                    <p 
                      onClick={() => setWeeklyPreviewTemplate(tpl)}
                      className="text-xs text-slate-400 leading-relaxed line-clamp-2 cursor-pointer hover:text-slate-200 transition-colors"
                      title="İsmi/Açıklamayı Düzenle ve Geniş Ekran Haftalık Önizleme Aç"
                    >
                      {tpl.description}
                    </p>
                  )}

                  <div className="text-[11px] text-slate-500">
                    Oluşturan: <strong className="text-slate-300">{tpl.createdByName || 'Rehber Koç'}</strong>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setWeeklyPreviewTemplate(tpl)}
                    className="text-xs text-fuchsia-300 hover:text-fuchsia-200 font-bold transition-colors bg-fuchsia-500/10 hover:bg-fuchsia-500/20 border border-fuchsia-500/30 px-2.5 py-1.5 rounded-xl flex items-center space-x-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Haftalık Önizle & Düzenle</span>
                  </button>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setSelectedTemplateToApply(tpl);
                        setTargetStudentIdForApply(studentUsers[0]?.id || '');
                        setShowApplyTemplateModal(true);
                      }}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-all shadow-md shadow-indigo-600/20 border border-indigo-400/30 flex items-center space-x-1"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Öğrenciye Uygula</span>
                    </button>

                    <button
                      onClick={() => {
                        if (confirm(`"${tpl.title}" şablonunu silmek istediğinizden emin misiniz?`)) {
                          onDeleteProgramTemplate(tpl.id);
                        }
                      }}
                      className="p-1.5 text-slate-500 hover:text-rose-400 bg-white/5 hover:bg-rose-500/10 rounded-xl transition-all border border-white/10"
                      title="Şablonu Sil"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
