import React, { useState } from 'react';
import { X, Target, GraduationCap, Award, Sparkles, Check, Building2, BookOpen, Layers, User, Calculator } from 'lucide-react';
import { StudentProfile, FieldType } from '../types';
import { UNIVERSITIES } from '../data/universities';
import { DEPARTMENTS } from '../data/departments';
import { UniversityLogo } from './UniversityLogo';
import { GradeLevel, isEarlyHighSchool, getGradeDisplayName } from '../utils/gradeUtils';

interface TargetModalProps {
  profile: StudentProfile;
  gradeLevel?: GradeLevel;
  onSave: (updatedProfile: StudentProfile) => void;
  onClose: () => void;
  onOpenFullProfile?: () => void;
}

const toTurkishLowerCase = (str: string) => {
  return str.replace(/I/g, 'ı').replace(/İ/g, 'i').toLowerCase();
};

export const TargetModal: React.FC<TargetModalProps> = ({
  profile,
  gradeLevel,
  onSave,
  onClose,
  onOpenFullProfile
}) => {
  const isEarly = isEarlyHighSchool(gradeLevel);

  const [targetField, setTargetField] = useState<FieldType>(profile?.targetField || 'SAY');
  const [targetUniversity, setTargetUniversity] = useState(profile?.targetUniversity || '');
  const [targetDepartment, setTargetDepartment] = useState(profile?.targetDepartment || '');
  const [targetRank, setTargetRank] = useState<string>(
    profile?.targetRank === 0 || !profile?.targetRank ? '' : profile.targetRank.toString()
  );
  const [targetTYTNet, setTargetTYTNet] = useState<string>(
    profile?.targetTYTNet === 0 || !profile?.targetTYTNet ? '' : profile.targetTYTNet.toString()
  );
  const [targetAYTNet, setTargetAYTNet] = useState<string>(
    profile?.targetAYTNet === 0 || !profile?.targetAYTNet ? '' : profile.targetAYTNet.toString()
  );
  const [targetYDTNet, setTargetYDTNet] = useState<string>(
    profile?.targetYDTNet === 0 || !profile?.targetYDTNet 
      ? (profile?.targetAYTNet?.toString() || '') 
      : profile.targetYDTNet.toString()
  );
  const [targetLanguage, setTargetLanguage] = useState<string>(profile?.targetLanguage || 'İngilizce');
  const [highSchoolGpa, setHighSchoolGpa] = useState<string>(
    profile?.schoolGpaTarget?.toString() || profile?.highSchoolGpa?.toString() || '90'
  );

  const [showUniSuggestions, setShowUniSuggestions] = useState(false);
  const [showDeptSuggestions, setShowDeptSuggestions] = useState(false);

  const filteredUniversities = targetUniversity.trim()
    ? UNIVERSITIES.filter(u => toTurkishLowerCase(u).includes(toTurkishLowerCase(targetUniversity))).slice(0, 8)
    : UNIVERSITIES.slice(0, 8);

  const filteredDepartments = targetDepartment.trim()
    ? DEPARTMENTS.filter(d => toTurkishLowerCase(d).includes(toTurkishLowerCase(targetDepartment))).slice(0, 8)
    : DEPARTMENTS.slice(0, 8);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const obpNum = parseFloat(highSchoolGpa) || 0;

    if (isEarly) {
      const updatedProfile: StudentProfile = {
        ...profile,
        name: profile?.name || 'Öğrenci',
        highSchool: profile?.highSchool || 'Anadolu Lisesi',
        targetField: undefined,
        targetUniversity: '',
        targetDepartment: '',
        targetRank: 0,
        targetTYTNet: 0,
        targetAYTNet: 0,
        targetYDTNet: undefined,
        coachName: profile?.coachName || 'Rehberlik Servisi',
        coachNotes: profile?.coachNotes || '',
        schoolGpaTarget: obpNum > 0 ? obpNum : 90,
        highSchoolGpa: obpNum > 0 ? obpNum : (profile?.highSchoolGpa || 85)
      };
      onSave(updatedProfile);
      onClose();
      return;
    }

    const rankNum = parseInt(targetRank) || 0;
    const tytNum = parseFloat(targetTYTNet) || 0;
    const aytNum = targetField === 'DİL' 
      ? (parseFloat(targetYDTNet) || parseFloat(targetAYTNet) || 0)
      : (parseFloat(targetAYTNet) || 0);
    const ydtNum = targetField === 'DİL' 
      ? (parseFloat(targetYDTNet) || parseFloat(targetAYTNet) || 0)
      : undefined;

    const updatedProfile: StudentProfile = {
      ...profile,
      name: profile?.name || 'Öğrenci',
      highSchool: profile?.highSchool || 'Anadolu Lisesi',
      targetField,
      targetUniversity: targetUniversity.trim(),
      targetDepartment: targetDepartment.trim(),
      targetRank: rankNum,
      targetTYTNet: tytNum,
      targetAYTNet: aytNum,
      targetYDTNet: ydtNum,
      targetLanguage: targetField === 'DİL' ? targetLanguage : undefined,
      coachName: profile?.coachName || 'Rehberlik Servisi',
      coachNotes: profile?.coachNotes || '',
      schoolGpaTarget: obpNum > 0 ? obpNum : undefined,
      highSchoolGpa: obpNum > 0 ? obpNum : (profile?.highSchoolGpa || 85)
    };

    onSave(updatedProfile);
    onClose();
  };

  const currentGpaNum = parseFloat(highSchoolGpa) || 90;
  const earlyObpBoost = Math.round(currentGpaNum * 5 * 0.12 * 10) / 10;

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 animate-fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-indigo-500/30 rounded-3xl max-w-xl w-full p-5 sm:p-8 shadow-2xl relative overflow-hidden my-auto max-h-[92vh] overflow-y-auto custom-scrollbar modal-dialog-card">
        {/* Glow Accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-5 border-b border-white/10 relative z-10 mb-6">
          <div className="flex items-center space-x-3">
            <div className={`p-3 rounded-2xl border shadow-inner ${isEarly ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' : 'bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border-indigo-500/30 text-indigo-400'}`}>
              {isEarly ? <Award className="w-6 h-6" /> : <Target className="w-6 h-6" />}
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                {isEarly ? `${getGradeDisplayName(gradeLevel)} OBP Başarı Hedefi` : 'Hedef & Derece Bilgilerini Güncelle'}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {isEarly ? 'Yıl sonu karne başarı notu ve OBP hedefinizi güncelleyin.' : 'Üniversite, bölüm, hedef netler, sıralama ve OBP bilgilerinizi düzenleyin.'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
          
          {isEarly ? (
            /* ── 9 & 10. SINIFLAR İÇİN SADECE OBP VE YIL SONU BAŞARI HEDEFİ ── */
            <div className="space-y-4 animate-fade-in">
              <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-2xl p-4 space-y-3">
                <div className="flex items-center space-x-2.5 text-emerald-400">
                  <Calculator className="w-5 h-5" />
                  <h3 className="text-sm font-bold text-white">Yıl Sonu Karne & OBP Hedefi</h3>
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Hedef Yıl Sonu Başarı Puanı (0 - 100) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="50"
                    max="100"
                    required
                    value={highSchoolGpa}
                    onChange={(e) => setHighSchoolGpa(e.target.value)}
                    placeholder="Örn: 92.5"
                    className="w-full bg-slate-950 border border-emerald-500/40 rounded-xl px-4 py-3 text-base text-emerald-300 font-mono font-bold focus:outline-none focus:border-emerald-400 transition-all"
                  />
                </div>

                <div className="bg-slate-950/80 rounded-xl p-3 border border-emerald-500/20 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-300">YKS Diploma Katkısı:</span>
                  <span className="text-emerald-400 font-bold text-sm">+{earlyObpBoost} Puan (0.12 × OBP)</span>
                </div>
              </div>

              <div className="bg-indigo-950/30 border border-indigo-500/25 rounded-2xl p-4 text-xs text-indigo-200 flex items-start space-x-3">
                <Sparkles className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong className="text-white block mb-1">Ara Sınıf Rehberlik Notu:</strong>
                  9 ve 10. sınıflarda YKS alan (Sayısal/EA/Sözel/Dil) ve üniversite tercihi yapılmaz. Lise diploma notu (OBP) YKS yerleştirmesine %12 doğrudan etki eder. Bu kademede en önemli önceliğiniz okul yazılı notlarınızı yüksek tutmaktır.
                </div>
              </div>
            </div>
          ) : (
            /* ── 11, 12 VE MEZUN KADEMELERİ İÇİN YKS HEDEF & ALAN FORMU ── */
            <>
              {/* Target Field Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Alan Türü</span>
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['SAY', 'EA', 'SÖZ', 'DİL'] as FieldType[]).map((fieldType) => (
                    <button
                      key={fieldType}
                      type="button"
                      onClick={() => setTargetField(fieldType)}
                      className={`py-2.5 px-3 rounded-xl font-bold text-xs transition-all border ${
                        targetField === fieldType
                          ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-600/30 scale-[1.02]'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {fieldType}
                    </button>
                  ))}
                </div>
              </div>

              {/* Target University */}
              <div className="relative">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span className="flex items-center space-x-1.5">
                    <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Hedef Üniversite</span>
                  </span>
                  {targetUniversity && (
                    <span className="text-[10px] text-indigo-300 font-mono font-medium">Önizleme logosu sağda</span>
                  )}
                </label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={targetUniversity}
                    onChange={(e) => {
                      setTargetUniversity(e.target.value);
                      setShowUniSuggestions(true);
                    }}
                    onFocus={() => setShowUniSuggestions(true)}
                    placeholder="Örn: İstanbul Teknik Üniversitesi"
                    className="w-full bg-slate-950/80 border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 pr-12 transition-all"
                  />
                  <div className="absolute right-3 flex items-center pointer-events-none">
                    <UniversityLogo universityName={targetUniversity} sizeClassName="w-6 h-6" />
                  </div>
                </div>

                {/* University Suggestions List */}
                {showUniSuggestions && filteredUniversities.length > 0 && (
                  <div className="absolute z-30 left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-h-48 overflow-y-auto">
                    {filteredUniversities.map((uni) => (
                      <button
                        key={uni}
                        type="button"
                        onClick={() => {
                          setTargetUniversity(uni);
                          setShowUniSuggestions(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs text-slate-200 hover:bg-indigo-600/30 hover:text-white transition-colors border-b border-white/5 last:border-0"
                      >
                        <UniversityLogo universityName={uni} sizeClassName="w-5 h-5" />
                        <span>{uni}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Target Department */}
              <div className="relative">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center space-x-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-purple-400" />
                  <span>Hedef Bölüm / Program</span>
                </label>
                <input
                  type="text"
                  value={targetDepartment}
                  onChange={(e) => {
                    setTargetDepartment(e.target.value);
                    setShowDeptSuggestions(true);
                  }}
                  onFocus={() => setShowDeptSuggestions(true)}
                  placeholder="Örn: Bilgisayar Mühendisliği"
                  className="w-full bg-slate-950/80 border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-all"
                />

                {/* Department Suggestions List */}
                {showDeptSuggestions && filteredDepartments.length > 0 && (
                  <div className="absolute z-30 left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-h-48 overflow-y-auto">
                    {filteredDepartments.map((dept) => (
                      <button
                        key={dept}
                        type="button"
                        onClick={() => {
                          setTargetDepartment(dept);
                          setShowDeptSuggestions(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs text-slate-200 hover:bg-purple-600/30 hover:text-white transition-colors border-b border-white/5 last:border-0"
                      >
                        {dept}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Target Rank & High School GPA (OBP) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center space-x-1.5">
                    <Award className="w-3.5 h-3.5 text-amber-400" />
                    <span>Hedef Sıralama</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={targetRank}
                    onChange={(e) => setTargetRank(e.target.value.replace(/^0+(?=\d)/, ''))}
                    placeholder="Örn: 5000"
                    className="w-full bg-slate-950/80 border border-white/15 rounded-xl px-4 py-3 text-sm text-white font-mono font-bold placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center space-x-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-blue-400" />
                    <span>Lise OBP (Ortalama)</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="50"
                    max="100"
                    value={highSchoolGpa}
                    onChange={(e) => setHighSchoolGpa(e.target.value)}
                    placeholder="Örn: 88.5"
                    className="w-full bg-slate-950/80 border border-white/15 rounded-xl px-4 py-3 text-sm text-white font-mono font-bold placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              {/* Target Nets Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Hedef TYT Net</span>
                  </label>
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    max="120"
                    value={targetTYTNet}
                    onChange={(e) => setTargetTYTNet(e.target.value.replace(/^0+(?=\d)/, ''))}
                    placeholder="Örn: 95"
                    className="w-full bg-slate-950/80 border border-white/15 rounded-xl px-4 py-3 text-sm text-white font-mono font-bold placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
                  />
                </div>

                {targetField === 'DİL' ? (
                  <div>
                    <label className="block text-xs font-bold text-sky-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                      <span className="flex items-center space-x-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                        <span>Hedef YDT Net</span>
                      </span>
                      <span className="text-[10px] text-sky-500 font-mono">/ 80</span>
                    </label>
                    <input
                      type="number"
                      step="0.25"
                      min="0"
                      max="80"
                      value={targetYDTNet}
                      onChange={(e) => setTargetYDTNet(e.target.value.replace(/^0+(?=\d)/, ''))}
                      placeholder="Örn: 75"
                      className="w-full bg-sky-950/30 border border-sky-500/40 rounded-xl px-4 py-3 text-sm text-sky-300 font-mono font-bold placeholder-sky-600 focus:outline-none focus:border-sky-400 transition-all"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center space-x-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Hedef AYT Net</span>
                    </label>
                    <input
                      type="number"
                      step="0.25"
                      min="0"
                      max="80"
                      value={targetAYTNet}
                      onChange={(e) => setTargetAYTNet(e.target.value.replace(/^0+(?=\d)/, ''))}
                      placeholder="Örn: 68"
                      className="w-full bg-slate-950/80 border border-white/15 rounded-xl px-4 py-3 text-sm text-white font-mono font-bold placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all"
                    />
                  </div>
                )}
              </div>

              {/* DİL Öğrencisine Özel Sınav Dili Seçimi */}
              {targetField === 'DİL' && (
                <div className="bg-sky-950/30 border border-sky-500/25 rounded-2xl p-3.5 flex items-center justify-between gap-3 animate-fade-in">
                  <div className="flex items-center space-x-2.5">
                    <span className="text-xl">🌐</span>
                    <div>
                      <div className="text-xs font-bold text-sky-200">YDT Sınav Yabancı Dili</div>
                      <div className="text-[10px] text-sky-400/80">YKS YDT oturumunda gireceğiniz dil</div>
                    </div>
                  </div>
                  <select
                    value={targetLanguage}
                    onChange={(e) => setTargetLanguage(e.target.value)}
                    className="bg-slate-950 border border-sky-500/40 text-sky-300 text-xs font-bold rounded-xl px-3 py-2 focus:outline-none focus:border-sky-400 cursor-pointer"
                  >
                    <option value="İngilizce">İngilizce</option>
                    <option value="Almanca">Almanca</option>
                    <option value="Fransızca">Fransızca</option>
                    <option value="Arapça">Arapça</option>
                    <option value="Rusça">Rusça</option>
                  </select>
                </div>
              )}
            </>
          )}

          {/* Separate Full Profile Edit Note/Link */}
          {onOpenFullProfile && (
            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
              <span className="text-slate-400">Profil fotoğrafı, ad soyad, lise vb. için:</span>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenFullProfile();
                }}
                className="text-indigo-400 hover:text-indigo-300 font-bold underline flex items-center space-x-1 transition-colors"
              >
                <User className="w-3.5 h-3.5" />
                <span>Profil Sayfasına Git →</span>
              </button>
            </div>
          )}

          {/* Modal Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-white/15 text-slate-300 hover:text-white hover:bg-white/10 text-xs font-semibold transition-all"
            >
              İptal
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs flex items-center space-x-2 transition-all shadow-lg shadow-indigo-600/30"
            >
              <Check className="w-4 h-4" />
              <span>{isEarly ? 'OBP Hedefini Kaydet' : 'Hedefleri Kaydet'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
