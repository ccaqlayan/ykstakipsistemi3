import React, { useState } from 'react';
import { Bookmark, Plus, Clock, Edit, Eye, Download, Trash2, Users, Check, Sparkles, X } from 'lucide-react';
import { StudyProgramTemplate, UserAccount, ClassDefinition } from '../../types';
import { GradeLevel, getGradeLevel } from '../../utils/gradeUtils';

interface TeacherTemplatesTabProps {
  programTemplates: StudyProgramTemplate[];
  setShowCreateTemplateModal: (show: boolean) => void;
  setWeeklyPreviewTemplate: (tpl: StudyProgramTemplate | null) => void;
  setSelectedTemplateToApply: (tpl: StudyProgramTemplate) => void;
  setTargetStudentIdForApply: (id: string) => void;
  studentUsers: UserAccount[];
  classes?: ClassDefinition[];
  allUsers?: UserAccount[];
  setShowApplyTemplateModal: (show: boolean) => void;
  onDeleteProgramTemplate: (id: string) => void;
  onApplyTemplateToClass?: (className: string, templateId: string, mode: 'overwrite' | 'merge') => void;
}

export const TeacherTemplatesTab: React.FC<TeacherTemplatesTabProps> = ({
  programTemplates,
  setShowCreateTemplateModal,
  setWeeklyPreviewTemplate,
  setSelectedTemplateToApply,
  setTargetStudentIdForApply,
  studentUsers,
  classes = [],
  allUsers = [],
  setShowApplyTemplateModal,
  onDeleteProgramTemplate,
  onApplyTemplateToClass
}) => {
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<'ALL' | GradeLevel>('ALL');
  const [bulkClassApplyModal, setBulkClassApplyModal] = useState<{
    template: StudyProgramTemplate;
    selectedClassName: string;
    mode: 'overwrite' | 'merge';
  } | null>(null);

  const filteredTemplates = programTemplates.filter(tpl => {
    if (selectedGradeFilter === 'ALL') return true;
    if (tpl.gradeLevel) return tpl.gradeLevel === selectedGradeFilter;
    // Fallback detection from title
    const t = tpl.title.toLowerCase();
    if (selectedGradeFilter === '9' && (t.includes('9.') || t.includes('9.sınıf') || t.includes('9-'))) return true;
    if (selectedGradeFilter === '10' && (t.includes('10.') || t.includes('10.sınıf') || t.includes('10-'))) return true;
    if (selectedGradeFilter === '11' && (t.includes('11.') || t.includes('11.sınıf') || t.includes('11-'))) return true;
    if (selectedGradeFilter === '12' && (t.includes('12.') || t.includes('12.sınıf') || t.includes('tyt') || t.includes('ayt'))) return true;
    if (selectedGradeFilter === 'mezun' && (t.includes('mezun') || t.includes('derece'))) return true;
    return false;
  });

  const getTemplateBadge = (tpl: StudyProgramTemplate) => {
    const gl = tpl.gradeLevel;
    if (gl === '9') return { text: '9. Sınıf • Maarif', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' };
    if (gl === '10') return { text: '10. Sınıf • Maarif', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' };
    if (gl === '11') return { text: `11. Sınıf • ${tpl.targetField || 'Alan'}`, color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' };
    if (gl === '12') return { text: `12. Sınıf • ${tpl.targetField || 'YKS'}`, color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
    if (gl === 'mezun') return { text: `Mezun • ${tpl.targetField || 'YKS'}`, color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
    return { text: tpl.targetField || 'TÜMÜ', color: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30' };
  };

  const getTargetClassStudents = (className: string) => {
    return allUsers.filter(u => u.role === 'student' && u.className === className);
  };

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
              MEB Maarif Modeli ara sınıf ve YKS maratonu için kayıtlı haftalık programlar. Şablonları tek tek öğrencilere veya bir sınıf şubesine toplu olarak uygulayabilirsiniz.
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

        {/* Kademe Hızlı Filtre Barı */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {[
            { id: 'ALL', label: 'Tüm Şablonlar', count: programTemplates.length },
            { id: '9', label: '9. Sınıf (Maarif)', count: programTemplates.filter(t => t.gradeLevel === '9' || t.title.includes('9.')).length },
            { id: '10', label: '10. Sınıf (Maarif)', count: programTemplates.filter(t => t.gradeLevel === '10' || t.title.includes('10.')).length },
            { id: '11', label: '11. Sınıf (Alan)', count: programTemplates.filter(t => t.gradeLevel === '11' || t.title.includes('11.')).length },
            { id: '12', label: '12. Sınıf (YKS)', count: programTemplates.filter(t => t.gradeLevel === '12' || t.title.includes('12.') || t.title.includes('TYT') || t.title.includes('AYT')).length },
            { id: 'mezun', label: 'Mezun', count: programTemplates.filter(t => t.gradeLevel === 'mezun' || t.title.includes('Mezun')).length },
          ].map(f => {
            const isSelected = selectedGradeFilter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setSelectedGradeFilter(f.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center space-x-1.5 ${
                  isSelected
                    ? 'bg-fuchsia-600/25 text-fuchsia-300 border-fuchsia-500/50 shadow-sm'
                    : 'bg-white/5 text-slate-400 border-white/5 hover:text-white hover:bg-white/10'
                }`}
              >
                <span>{f.label}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/10">{f.count}</span>
              </button>
            );
          })}
        </div>

        {/* Template Cards Grid */}
        {filteredTemplates.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-white/10 rounded-2xl text-slate-400 text-xs">
            Bu kademe kategorisinde henüz kayıtlı program şablonu bulunmuyor.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
            {filteredTemplates.map((tpl) => {
              const badge = getTemplateBadge(tpl);

              return (
                <div 
                  key={tpl.id}
                  className="bg-slate-900/90 border border-white/10 rounded-2xl p-5 shadow-xl flex flex-col justify-between hover:border-fuchsia-500/40 transition-all space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border tracking-wide ${badge.color}`}>
                        {badge.text}
                      </span>
                      <span className="text-[10px] text-slate-400 flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{tpl.items.length} Görev Maddesi</span>
                      </span>
                    </div>

                    <h3 
                      onClick={() => setWeeklyPreviewTemplate(tpl)}
                      className="text-sm font-extrabold text-white tracking-tight cursor-pointer hover:text-fuchsia-300 transition-colors flex items-center justify-between group"
                      title="İsmi/Açıklamayı Düzenle ve Geniş Ekran Haftalık Önizleme Aç"
                    >
                      <span className="line-clamp-2">{tpl.title}</span>
                      <Edit className="w-3.5 h-3.5 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-1" />
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

                  <div className="pt-2 border-t border-white/10 flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-2">
                      <button
                        onClick={() => setWeeklyPreviewTemplate(tpl)}
                        className="text-xs text-fuchsia-300 hover:text-fuchsia-200 font-bold transition-colors bg-fuchsia-500/10 hover:bg-fuchsia-500/20 border border-fuchsia-500/30 px-2.5 py-1.5 rounded-xl flex items-center space-x-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Önizle</span>
                      </button>

                      <div className="flex items-center space-x-1.5">
                        {/* Single Student Apply */}
                        <button
                          onClick={() => {
                            setSelectedTemplateToApply(tpl);
                            setTargetStudentIdForApply(studentUsers[0]?.id || '');
                            setShowApplyTemplateModal(true);
                          }}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-2.5 py-1.5 rounded-xl transition-all shadow-sm border border-indigo-400/30 flex items-center space-x-1"
                          title="Seçilen tek bir öğrenciye uygula"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Öğrenciye</span>
                        </button>

                        {/* Bulk Class Apply */}
                        {classes.length > 0 && onApplyTemplateToClass && (
                          <button
                            onClick={() => {
                              const defaultClass = classes.find(c => (c.gradeLevel || getGradeLevel(c.name)) === tpl.gradeLevel)?.name || classes[0]?.name || '';
                              setBulkClassApplyModal({
                                template: tpl,
                                selectedClassName: defaultClass,
                                mode: 'overwrite'
                              });
                            }}
                            className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-2.5 py-1.5 rounded-xl transition-all shadow-sm border border-purple-400/30 flex items-center space-x-1"
                            title="Tüm sınıf şubesine toplu olarak uygula"
                          >
                            <Users className="w-3.5 h-3.5" />
                            <span>Şubeye</span>
                          </button>
                        )}

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
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL: BULK APPLY TEMPLATE TO CLASS */}
      {bulkClassApplyModal && (
        <div 
          className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={(e) => { if (e.target === e.currentTarget) setBulkClassApplyModal(null); }}
        >
          <div className="bg-slate-900 border border-purple-500/30 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Users className="w-5 h-5 text-purple-400" />
                <span>Sınıf Şubesine Toplu Program Ata</span>
              </h3>
              <button
                onClick={() => setBulkClassApplyModal(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg bg-white/5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-2xl space-y-1">
              <span className="text-xs text-purple-300 font-bold block">Uygulanacak Şablon:</span>
              <p className="text-sm font-extrabold text-white">{bulkClassApplyModal.template.title}</p>
              <p className="text-xs text-slate-400">{bulkClassApplyModal.template.items.length} adet haftalık görev maddesi</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Hedef Sınıf Şubesi:
                </label>
                <select
                  value={bulkClassApplyModal.selectedClassName}
                  onChange={(e) => setBulkClassApplyModal({ ...bulkClassApplyModal, selectedClassName: e.target.value })}
                  className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2.5 text-white font-bold text-xs focus:outline-none focus:border-purple-400"
                >
                  <optgroup label="🎓 9. Sınıflar (Maarif Modeli)">
                    {classes.filter(c => (c.gradeLevel || getGradeLevel(c.name)) === '9').map(c => (
                      <option key={c.id} value={c.name}>{c.name} Şubesi ({getTargetClassStudents(c.name).length} Öğrenci)</option>
                    ))}
                  </optgroup>
                  <optgroup label="🎓 10. Sınıflar (Maarif Modeli)">
                    {classes.filter(c => (c.gradeLevel || getGradeLevel(c.name)) === '10').map(c => (
                      <option key={c.id} value={c.name}>{c.name} Şubesi ({getTargetClassStudents(c.name).length} Öğrenci)</option>
                    ))}
                  </optgroup>
                  <optgroup label="📘 11. Sınıflar (Alan & YKS)">
                    {classes.filter(c => (c.gradeLevel || getGradeLevel(c.name)) === '11').map(c => (
                      <option key={c.id} value={c.name}>{c.name} Şubesi ({getTargetClassStudents(c.name).length} Öğrenci)</option>
                    ))}
                  </optgroup>
                  <optgroup label="🎯 12. Sınıflar (YKS Maratonu)">
                    {classes.filter(c => (c.gradeLevel || getGradeLevel(c.name)) === '12').map(c => (
                      <option key={c.id} value={c.name}>{c.name} Şubesi ({getTargetClassStudents(c.name).length} Öğrenci)</option>
                    ))}
                  </optgroup>
                  <optgroup label="🏆 Mezun Grupları">
                    {classes.filter(c => (c.gradeLevel || getGradeLevel(c.name)) === 'mezun').map(c => (
                      <option key={c.id} value={c.name}>{c.name} Şubesi ({getTargetClassStudents(c.name).length} Öğrenci)</option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* Number of target students summary */}
              {(() => {
                const targetStudentsCount = getTargetClassStudents(bulkClassApplyModal.selectedClassName).length;
                return (
                  <div className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl text-xs">
                    <span className="text-slate-400">Şubedeki Kayıtlı Öğrenci Sayısı:</span>
                    <span className="font-mono font-bold text-emerald-400">{targetStudentsCount} Öğrenci</span>
                  </div>
                );
              })()}

              {/* Mode Selection */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Uygulama Yöntemi:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setBulkClassApplyModal({ ...bulkClassApplyModal, mode: 'overwrite' })}
                    className={`p-3 rounded-xl border text-left transition-all text-xs flex flex-col justify-between ${
                      bulkClassApplyModal.mode === 'overwrite'
                        ? 'bg-purple-600/20 border-purple-400 text-white shadow-md'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="font-bold block text-purple-300">Üzerine Yaz</span>
                    <span className="text-[10px] text-slate-400 mt-1">Öğrencilerin eski haftalık programını temizleyip bu şablonu uygular (Önerilen).</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBulkClassApplyModal({ ...bulkClassApplyModal, mode: 'merge' })}
                    className={`p-3 rounded-xl border text-left transition-all text-xs flex flex-col justify-between ${
                      bulkClassApplyModal.mode === 'merge'
                        ? 'bg-purple-600/20 border-purple-400 text-white shadow-md'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="font-bold block text-indigo-300">Mevcutla Birleştir</span>
                    <span className="text-[10px] text-slate-400 mt-1">Öğrencilerin mevcut görevlerinin üzerine bu şablonu ekler.</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-white/10 flex items-center justify-end space-x-2">
              <button
                onClick={() => setBulkClassApplyModal(null)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold transition-all"
              >
                İptal
              </button>
              <button
                onClick={() => {
                  if (onApplyTemplateToClass && bulkClassApplyModal.selectedClassName) {
                    onApplyTemplateToClass(
                      bulkClassApplyModal.selectedClassName,
                      bulkClassApplyModal.template.id,
                      bulkClassApplyModal.mode
                    );
                    alert(`"${bulkClassApplyModal.template.title}" şablonu "${bulkClassApplyModal.selectedClassName}" şubesine başarıyla uygulandı!`);
                    setBulkClassApplyModal(null);
                  }
                }}
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-lg shadow-purple-600/30 flex items-center space-x-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Şubeye Programı Tanımla</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

