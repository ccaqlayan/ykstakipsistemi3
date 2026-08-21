import React, { useState, useRef } from 'react';
import { 
  X, User, GraduationCap, Target, Upload, Link, Trash2, Camera, Check, 
  Shield, Mail, Phone, Building2, Key, Eye, EyeOff, Lock, ChevronDown, 
  ChevronUp, AlertCircle, CheckCircle2, Bell, BellOff, Crop, Loader2
} from 'lucide-react';
import { UserAccount, StudentProfile, FieldType } from '../types';
import { UNIVERSITIES } from '../data/universities';
import { DEPARTMENTS } from '../data/departments';
import { uploadProfileAvatar } from '../services/storageUpload';
import { ImageCropperModal } from './common/ImageCropperModal';
import { getGradeLevel, isEarlyHighSchool } from '../utils/gradeUtils';

interface ProfileModalProps {
  currentUser: UserAccount;
  profile?: StudentProfile;
  onSave: (updatedUser: UserAccount, updatedStudentProfile?: StudentProfile) => void;
  onClose: () => void;
}

const PRESET_AVATARS = [
  { id: 'av-1', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=250&auto=format&fit=crop&q=80', label: 'Öğrenci 1' },
  { id: 'av-2', url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=250&auto=format&fit=crop&q=80', label: 'Öğrenci 2' },
  { id: 'av-3', url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=250&auto=format&fit=crop&q=80', label: 'Öğrenci 3' },
  { id: 'av-4', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=250&auto=format&fit=crop&q=80', label: 'Öğrenci 4' },
  { id: 'av-5', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=250&auto=format&fit=crop&q=80', label: 'Öğretmen 1' },
  { id: 'av-6', url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=250&auto=format&fit=crop&q=80', label: 'Öğretmen 2' },
  { id: 'av-7', url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=250&auto=format&fit=crop&q=80', label: 'Öğretmen 3' },
  { id: 'av-8', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=250&auto=format&fit=crop&q=80', label: 'Öğretmen 4' }
];

const toTurkishLowerCase = (str: string) => {
  return str.replace(/I/g, 'ı').replace(/İ/g, 'i').toLowerCase();
};

// Client-side automatic image compression helper (max 1000px dimension, ~50-100KB output)
const compressImageFile = (file: File, maxDimension = 1000, quality = 0.65): Promise<{ dataUrl: string; originalKb: number; compressedKb: number }> => {
  return new Promise((resolve) => {
    const originalKb = Math.round(file.size / 1024);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
        }

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        const compressedKb = Math.round((dataUrl.length * 3) / 4 / 1024);
        resolve({ dataUrl, originalKb, compressedKb });
      };
      if (typeof event.target?.result === 'string') {
        img.src = event.target.result;
      }
    };
    reader.readAsDataURL(file);
  });
};

export const ProfileModal: React.FC<ProfileModalProps> = ({
  currentUser,
  profile,
  onSave,
  onClose
}) => {
  const isTeacher = currentUser.role === 'class_teacher' || currentUser.role === 'school_counselor' || currentUser.role === 'teacher';
  const gradeLevel = getGradeLevel(currentUser.className);
  const isEarly = isEarlyHighSchool(gradeLevel);

  // Basic info states
  const [name, setName] = useState(currentUser.name || profile?.name || '');
  const [email, setEmail] = useState(currentUser.email || '');
  const [phone, setPhone] = useState(currentUser.phone || profile?.phone || '');
  const [prepSchool, setPrepSchool] = useState(currentUser.prepSchool || profile?.prepSchool || '');
  const [title, setTitle] = useState(currentUser.title || (currentUser.role === 'school_counselor' ? 'Okul Rehberlik Uzmanı' : 'Sınıf Öğretmeni'));
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatarUrl || profile?.avatarUrl || '');

  // Compression Info state
  const [compressionInfo, setCompressionInfo] = useState<{ originalKb: number; compressedKb: number } | null>(null);

  // Avatar Cropper & Upload state
  const [selectedRawFile, setSelectedRawFile] = useState<File | null>(null);
  const [showCropperModal, setShowCropperModal] = useState<boolean>(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState<boolean>(false);

  // Avatar toggle state (hidden by default)
  const [showAvatarOptions, setShowAvatarOptions] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);

  // Student specific target states
  const [schoolNumber, setSchoolNumber] = useState(currentUser.schoolNumber || profile?.schoolNumber || '');
  const [highSchool, setHighSchool] = useState(() => localStorage.getItem('school_name') || profile?.highSchool || 'Yıldız Anadolu Lisesi');
  const [targetField, setTargetField] = useState<FieldType>(profile?.targetField || 'SAY');
  const [targetUniversity, setTargetUniversity] = useState(profile?.targetUniversity || 'İstanbul Teknik Üniversitesi (İTÜ)');
  const [showUniSuggestions, setShowUniSuggestions] = useState(false);
  const [targetDepartment, setTargetDepartment] = useState(profile?.targetDepartment || 'Bilgisayar Mühendisliği');
  const [showDeptSuggestions, setShowDeptSuggestions] = useState(false);
  const [targetRank, setTargetRank] = useState<string>(profile?.targetRank === 0 ? '' : (profile?.targetRank?.toString() || ''));
  const [targetTYTNet, setTargetTYTNet] = useState<string>(profile?.targetTYTNet === 0 ? '' : (profile?.targetTYTNet?.toString() || ''));
  const [targetAYTNet, setTargetAYTNet] = useState<string>(profile?.targetAYTNet === 0 ? '' : (profile?.targetAYTNet?.toString() || ''));
  const [targetYDTNet, setTargetYDTNet] = useState<string>(profile?.targetYDTNet === 0 ? '' : (profile?.targetYDTNet?.toString() || profile?.targetAYTNet?.toString() || ''));
  const [targetLanguage, setTargetLanguage] = useState<string>(profile?.targetLanguage || 'İngilizce');
  const [highSchoolGpa, setHighSchoolGpa] = useState<string>(profile?.highSchoolGpa?.toString() || '85');

  // Password change state
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [activePassword, setActivePassword] = useState(currentUser.password || '123456');
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [passError, setPassError] = useState<string | null>(null);
  const [passSuccess, setPassSuccess] = useState<string | null>(null);

  // Sound notification state
  const [soundEnabled, setSoundEnabled] = useState<boolean>(currentUser.soundEnabled ?? true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredUniversities = (targetUniversity || '').trim().length >= 2
    ? UNIVERSITIES.filter(u => toTurkishLowerCase(u).includes(toTurkishLowerCase(targetUniversity || ''))).slice(0, 8)
    : [];

  const filteredDepartments = (targetDepartment || '').trim().length >= 2
    ? DEPARTMENTS.filter(d => toTurkishLowerCase(d).includes(toTurkishLowerCase(targetDepartment || ''))).slice(0, 8)
    : [];

  // File upload handler with interactive mobile cropper & compression
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      alert('Seçtiğiniz görsel 15MB sınırını aşıyor. Lütfen daha küçük bir fotoğraf yükleyin.');
      return;
    }

    setSelectedRawFile(file);
    setShowCropperModal(true);
    if (e.target) e.target.value = '';
  };

  const processAndUploadAvatar = async (fileToUpload: File) => {
    setIsUploadingAvatar(true);
    try {
      const uploadRes = await uploadProfileAvatar(fileToUpload, currentUser.id);
      setAvatarUrl(uploadRes.url);
      setCompressionInfo({ originalKb: uploadRes.originalKb, compressedKb: uploadRes.compressedKb });
    } catch (err: any) {
      console.error('Profil fotoğrafı yükleme hatası:', err);
      alert(err.message || 'Profil fotoğrafı yüklenirken bir sorun oluştu.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleCropComplete = async (croppedFile: File) => {
    setShowCropperModal(false);
    await processAndUploadAvatar(croppedFile);
  };

  const handleUseOriginal = async (originalFile: File) => {
    setShowCropperModal(false);
    await processAndUploadAvatar(originalFile);
  };

  const handleReCrop = () => {
    if (selectedRawFile || avatarUrl) {
      setShowCropperModal(true);
    }
  };

  const handleApplyUrl = () => {
    if (urlInput.trim()) {
      setAvatarUrl(urlInput.trim());
      setCompressionInfo(null);
      setUrlInput('');
      setShowUrlInput(false);
    }
  };

  const handleApplyPasswordChange = () => {
    setPassError(null);
    setPassSuccess(null);

    const isMinLength = newPasswordInput.length >= 6;
    const hasLetter = /[a-zA-ZğüşıöçĞÜŞİÖÇ]/.test(newPasswordInput);
    const hasNumber = /[0-9]/.test(newPasswordInput);

    if (!currentPasswordInput) {
      setPassError('Lütfen mevcut şifrenizi girin.');
      return;
    }

    if (currentPasswordInput !== activePassword) {
      setPassError('Mevcut şifreniz hatalı! Lütfen kontrol ediniz.');
      return;
    }

    if (!isMinLength) {
      setPassError('Yeni şifreniz en az 6 karakter olmalıdır.');
      return;
    }

    if (!hasLetter) {
      setPassError('Yeni şifreniz en az bir harf içermelidir.');
      return;
    }

    if (!hasNumber) {
      setPassError('Yeni şifreniz en az bir rakam (0-9) içermelidir.');
      return;
    }

    if (newPasswordInput !== confirmPasswordInput) {
      setPassError('Yeni şifreler birbiriyle eşleşmiyor.');
      return;
    }

    setActivePassword(newPasswordInput);
    setPassSuccess('Şifreniz güncellendi! Profilinizi kaydettiğinizde yeni şifreniz aktif olacaktır.');
    setCurrentPasswordInput('');
    setNewPasswordInput('');
    setConfirmPasswordInput('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const updatedUser: UserAccount = {
      ...currentUser,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      prepSchool: prepSchool.trim(),
      schoolNumber: schoolNumber.trim(),
      password: activePassword,
      title: title.trim(),
      avatarUrl: avatarUrl.trim(),
      soundEnabled
    };

    let updatedStudentProfile: StudentProfile | undefined;
    if (!isTeacher) {
      updatedStudentProfile = {
        name: (name || '').trim(),
        highSchool: (highSchool || '').trim(),
        className: currentUser.className,
        targetField: isEarly ? undefined : targetField,
        targetUniversity: isEarly ? '' : (targetUniversity || '').trim(),
        targetDepartment: isEarly ? '' : (targetDepartment || '').trim(),
        targetRank: isEarly ? 0 : (Number(targetRank) || 0),
        targetTYTNet: isEarly ? 0 : (Number(targetTYTNet) || 0),
        targetAYTNet: isEarly ? 0 : (targetField === 'DİL' ? (Number(targetYDTNet) || Number(targetAYTNet) || 0) : (Number(targetAYTNet) || 0)),
        targetYDTNet: isEarly ? undefined : (targetField === 'DİL' ? (Number(targetYDTNet) || Number(targetAYTNet) || 0) : undefined),
        targetLanguage: isEarly ? undefined : (targetField === 'DİL' ? targetLanguage : undefined),
        coachName: profile?.coachName || 'Rehberlik Servisi',
        coachNotes: profile?.coachNotes || '',
        avatarUrl: avatarUrl.trim(),
        highSchoolGpa: Number(highSchoolGpa) || profile?.highSchoolGpa || 85,
        phone: phone.trim(),
        prepSchool: prepSchool.trim(),
        schoolNumber: schoolNumber.trim()
      };
    }

    onSave(updatedUser, updatedStudentProfile);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-slate-900/95 backdrop-blur-2xl border border-indigo-500/30 rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto custom-scrollbar modal-dialog-card">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center space-x-3">
            <div className={`p-2.5 rounded-2xl border ${isTeacher ? 'bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/30' : 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'}`}>
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {isTeacher ? 'Öğretmen Profilini Düzenle' : 'Profil Bilgileri & Hedefler'}
              </h2>
              <p className="text-xs text-slate-400">
                Kişisel bilgilerinizi, iletişim tercihlerinizi ve hesabınızı güncelleyin
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Avatar / Profil Fotoğrafı Section */}
          <div className="bg-white/5 border border-white/10 p-4 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3.5">
                <div className={`w-14 h-14 rounded-2xl overflow-hidden border-2 flex items-center justify-center shadow-lg shrink-0 ${isTeacher ? 'border-fuchsia-500/50 bg-fuchsia-950/50' : 'border-indigo-500/50 bg-indigo-950/50'}`}>
                  {avatarUrl ? (
                    <img 
                      src={avatarUrl} 
                      alt="Profil Fotoğrafı" 
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : null}
                  {(!avatarUrl) && (
                    <div className="text-xl font-black text-white uppercase">
                      {name ? name.charAt(0) : 'Y'}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{name || 'Kullanıcı'}</h3>
                  <p className="text-xs text-slate-400">{email || currentUser.email}</p>
                  <span className={`inline-block mt-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${
                    isTeacher 
                      ? 'bg-fuchsia-500/10 text-fuchsia-300 border-fuchsia-500/30' 
                      : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'
                  }`}>
                    {isTeacher ? (title || 'Öğretmen') : (currentUser.className || '12-A SAY')}
                  </span>
                </div>
              </div>

              {/* Değiştir Toggle Button */}
              <button
                type="button"
                onClick={() => setShowAvatarOptions(!showAvatarOptions)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 border shadow-sm ${
                  showAvatarOptions 
                    ? 'bg-slate-800 text-slate-200 border-slate-700' 
                    : 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40 hover:bg-indigo-600/30'
                }`}
              >
                <Camera className="w-4 h-4" />
                <span>Fotoğraf Değiştir</span>
                {showAvatarOptions ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Avatar Options (Collapsible) */}
            {showAvatarOptions && (
              <div className="pt-3 border-t border-white/10 space-y-3 animate-fadeIn">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      disabled={isUploadingAvatar}
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition-all flex items-center space-x-1.5 shadow-md cursor-pointer"
                    >
                      {isUploadingAvatar ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                          <span>Yükleniyor...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-3.5 h-3.5" />
                          <span>Cihazdan Yükle</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowUrlInput(!showUrlInput)}
                      className="bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all flex items-center space-x-1.5 border border-white/10 cursor-pointer"
                    >
                      <Link className="w-3.5 h-3.5" />
                      <span>URL ile Ekle</span>
                    </button>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    {avatarUrl && (
                      <button
                        type="button"
                        onClick={handleReCrop}
                        className="text-[11px] text-indigo-300 hover:text-indigo-200 flex items-center space-x-1 font-semibold px-2 py-1 bg-indigo-500/15 border border-indigo-500/30 rounded-lg cursor-pointer transition-all"
                        title="Fotoğrafı yeniden kırp ve ayarla"
                      >
                        <Crop className="w-3 h-3 text-indigo-400" />
                        <span>Yeniden Kırp</span>
                      </button>
                    )}

                    {avatarUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          setAvatarUrl('');
                          setCompressionInfo(null);
                          setSelectedRawFile(null);
                        }}
                        className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center space-x-1 font-semibold px-2 py-1 bg-rose-500/10 border border-rose-500/20 rounded-lg cursor-pointer transition-all"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Kaldır</span>
                      </button>
                    )}
                  </div>
                </div>

                {compressionInfo && (
                  <div className="text-[10px] text-emerald-300 font-medium bg-emerald-500/10 border border-emerald-500/25 px-3 py-1.5 rounded-xl flex items-center justify-between gap-2 animate-pulse">
                    <div className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Fotoğraf başarıyla sıkıştırıldı!</span>
                    </div>
                    <div className="font-mono">
                      <span className="line-through text-slate-500 mr-1.5">{compressionInfo.originalKb} KB</span>
                      <strong className="text-emerald-400">{compressionInfo.compressedKb} KB</strong>
                      {compressionInfo.originalKb > compressionInfo.compressedKb ? (
                        <span className="text-emerald-500/80 ml-1">
                          (%{Math.max(0, Math.round((1 - compressionInfo.compressedKb / compressionInfo.originalKb) * 100))} Tasarruf)
                        </span>
                      ) : (
                        <span className="text-emerald-500/80 ml-1">(Optimize Edildi)</span>
                      )}
                    </div>
                  </div>
                )}

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />

                {/* URL Input Bar */}
                {showUrlInput && (
                  <div className="flex items-center space-x-2 pt-2 border-t border-white/10">
                    <input
                      type="url"
                      placeholder="https://gorsel-linki.com/fotograf.jpg"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      className="flex-1 bg-slate-950 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-400"
                    />
                    <button
                      type="button"
                      onClick={handleApplyUrl}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl"
                    >
                      Ekle
                    </button>
                  </div>
                )}

                {/* Preset Avatars Selection */}
                <div className="pt-2">
                  <span className="block text-[11px] font-semibold text-slate-400 mb-2">veya Hazır Avatarlardan Seçin:</span>
                  <div className="grid grid-cols-8 gap-2">
                    {PRESET_AVATARS.map((preset) => {
                      const isSelected = avatarUrl === preset.url;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => {
                            setAvatarUrl(preset.url);
                            setCompressionInfo(null);
                          }}
                          className={`relative rounded-xl overflow-hidden aspect-square border-2 transition-all group ${
                            isSelected ? 'border-indigo-400 ring-2 ring-indigo-500/50 scale-105' : 'border-white/10 hover:border-white/40'
                          }`}
                        >
                          <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                          {isSelected && (
                            <div className="absolute inset-0 bg-indigo-600/40 flex items-center justify-center">
                              <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* General & Contact Info Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
              <User className="w-3.5 h-3.5 text-indigo-400" />
              <span>Kişisel & İletişim Bilgileri</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Ad Soyad</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3.5 py-3 sm:py-2 text-sm sm:text-xs text-white focus:outline-none focus:border-indigo-400 min-h-[48px] sm:min-h-0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">E-posta Adresi</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 sm:top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3.5 py-3 sm:py-2 text-sm sm:text-xs text-white focus:outline-none focus:border-indigo-400 min-h-[48px] sm:min-h-0"
                  />
                </div>
              </div>

              {/* Phone Field */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Telefon Numarası</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 sm:top-2.5" />
                  <input
                    type="tel"
                    placeholder="05xx xxx xx xx"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3.5 py-3 sm:py-2 text-sm sm:text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-400 min-h-[48px] sm:min-h-0"
                  />
                </div>
              </div>

              {/* Prep School / Course Field */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Dershane / Özel Kurs (Varsa)</label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 sm:top-2.5" />
                  <input
                    type="text"
                    placeholder="Ör: Final Akademi / Birey / Yok"
                    value={prepSchool}
                    onChange={(e) => setPrepSchool(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3.5 py-3 sm:py-2 text-sm sm:text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-400 min-h-[48px] sm:min-h-0"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Teacher specific title field */}
          {isTeacher && (
            <div className="pt-2 border-t border-white/10">
              <label className="block text-xs font-semibold text-slate-300 mb-1">Öğretmen / Rehberlik Unvanı</label>
              <div className="relative">
                <Shield className="w-4 h-4 text-fuchsia-400 absolute left-3 top-3.5 sm:top-2.5" />
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ör: YKS Rehber Öğretmeni, Psikolojik Danışman"
                  className="w-full bg-white/5 border border-fuchsia-500/30 rounded-xl pl-9 pr-3.5 py-3 sm:py-2 text-sm sm:text-xs text-white focus:outline-none focus:border-fuchsia-400 min-h-[48px] sm:min-h-0"
                />
              </div>
            </div>
          )}

          {/* Student specific target fields */}
          {/* Student specific target fields */}
          {!isTeacher && (
            <div className="space-y-3 pt-2 border-t border-white/10">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                <Target className="w-3.5 h-3.5 text-indigo-400" />
                <span>{isEarly ? 'Okul & Başarı Bilgileri' : 'YKS Hedef ve Okul Bilgileri'}</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Okul Numarası (Okul No)</label>
                  <input
                    type="text"
                    placeholder="Ör: 528"
                    value={schoolNumber}
                    onChange={(e) => setSchoolNumber(e.target.value)}
                    className="w-full bg-white/5 border border-indigo-500/30 rounded-xl px-3.5 py-3 sm:py-2 text-sm sm:text-xs text-white focus:outline-none focus:border-indigo-400 font-mono font-bold min-h-[48px] sm:min-h-0"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Okul Adı</label>
                  <input
                    type="text"
                    value={highSchool}
                    onChange={(e) => setHighSchool(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-3 sm:py-2 text-sm sm:text-xs text-white focus:outline-none focus:border-indigo-400 min-h-[48px] sm:min-h-0"
                  />
                </div>

                {isEarly && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Hedef Yıl Sonu Başarı Puanı (OBP)</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="Ör: 90.0"
                      value={highSchoolGpa}
                      onChange={(e) => setHighSchoolGpa(e.target.value)}
                      className="w-full bg-white/5 border border-emerald-500/30 rounded-xl px-3.5 py-3 sm:py-2 text-sm sm:text-xs text-emerald-300 font-bold focus:outline-none focus:border-emerald-400 min-h-[48px] sm:min-h-0 font-mono"
                    />
                  </div>
                )}

                {!isEarly && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Hazırlık Alanı</label>
                      <select
                        value={targetField}
                        onChange={(e) => setTargetField(e.target.value as FieldType)}
                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-3 sm:py-2 text-sm sm:text-xs text-white focus:outline-none font-bold text-indigo-400 min-h-[48px] sm:min-h-0 cursor-pointer"
                      >
                        <option value="SAY">Sayısal (SAY)</option>
                        <option value="EA">Eşit Ağırlık (EA)</option>
                        <option value="SÖZ">Sözel (SÖZ)</option>
                        <option value="DİL">Dil (DİL)</option>
                      </select>
                    </div>

                    {/* Target University */}
                    <div className="relative">
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Hedef Üniversite</label>
                      <input
                        type="text"
                        value={targetUniversity}
                        onChange={(e) => {
                          setTargetUniversity(e.target.value);
                          setShowUniSuggestions(true);
                        }}
                        onFocus={() => setShowUniSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowUniSuggestions(false), 200)}
                        placeholder="Ör: İstanbul Teknik Üniversitesi"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-3 sm:py-2 text-sm sm:text-xs text-white focus:outline-none focus:border-indigo-400 min-h-[48px] sm:min-h-0"
                      />
                      {showUniSuggestions && filteredUniversities.length > 0 && (
                        <div className="absolute z-20 left-0 right-0 mt-1 bg-slate-900 border border-indigo-500/30 rounded-xl shadow-2xl max-h-40 overflow-y-auto">
                          {filteredUniversities.map((uni, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onMouseDown={() => {
                                setTargetUniversity(uni);
                                setShowUniSuggestions(false);
                              }}
                              className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-indigo-600/30 hover:text-white transition-colors border-b border-white/5 last:border-0"
                            >
                              {uni}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Target Department */}
                    <div className="relative">
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Hedef Bölüm</label>
                      <input
                        type="text"
                        value={targetDepartment}
                        onChange={(e) => {
                          setTargetDepartment(e.target.value);
                          setShowDeptSuggestions(true);
                        }}
                        onFocus={() => setShowDeptSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowDeptSuggestions(false), 200)}
                        placeholder="Ör: Bilgisayar Mühendisliği"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-3 sm:py-2 text-sm sm:text-xs text-white focus:outline-none focus:border-indigo-400 min-h-[48px] sm:min-h-0"
                      />
                      {showDeptSuggestions && filteredDepartments.length > 0 && (
                        <div className="absolute z-20 left-0 right-0 mt-1 bg-slate-900 border border-indigo-500/30 rounded-xl shadow-2xl max-h-40 overflow-y-auto">
                          {filteredDepartments.map((dept, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onMouseDown={() => {
                                setTargetDepartment(dept);
                                setShowDeptSuggestions(false);
                              }}
                              className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-indigo-600/30 hover:text-white transition-colors border-b border-white/5 last:border-0"
                            >
                              {dept}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Ara Sınıf Bilgilendirme Notu */}
              {isEarly && (
                <div className="bg-indigo-950/30 border border-indigo-500/25 rounded-2xl p-3.5 text-xs text-indigo-200 flex items-start space-x-2.5">
                  <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white">Ara Sınıf Odak Bilgisi:</strong> 9 ve 10. sınıflarda YKS alan ve üniversite seçimi yerine MEB Maarif müfredatındaki okul yazılıları, düzenli konu tekrarları ve yıl sonu OBP puanı hedeflenir. Alan seçimi 11. sınıfa geçerken yapılacaktır.
                  </div>
                </div>
              )}

              {/* Target Nets & Rank (Sadece 11, 12 ve Mezun Kademelerinde) */}
              {!isEarly && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Hedef Sıralama</label>
                    <input
                      type="number"
                      placeholder="Ör: 5000"
                      value={targetRank}
                      onChange={(e) => setTargetRank(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-3 sm:py-2 text-sm sm:text-xs text-white focus:outline-none focus:border-indigo-400 min-h-[48px] sm:min-h-0 text-center font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Hedef TYT Net</label>
                    <input
                      type="number"
                      placeholder="Ör: 100"
                      value={targetTYTNet}
                      onChange={(e) => setTargetTYTNet(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-3 sm:py-2 text-sm sm:text-xs text-white focus:outline-none focus:border-indigo-400 min-h-[48px] sm:min-h-0 text-center font-mono font-bold"
                    />
                  </div>
                  {targetField === 'DİL' ? (
                    <div>
                      <label className="block text-[11px] font-semibold text-sky-400 mb-1 flex items-center justify-between">
                        <span>Hedef YDT Net</span>
                        <span className="text-[9px] text-sky-500 font-mono">/ 80</span>
                      </label>
                      <input
                        type="number"
                        max="80"
                        placeholder="Ör: 75"
                        value={targetYDTNet}
                        onChange={(e) => setTargetYDTNet(e.target.value)}
                        className="w-full bg-sky-950/20 border border-sky-500/40 rounded-xl px-3 py-3 sm:py-2 text-sm sm:text-xs text-sky-300 focus:outline-none focus:border-sky-400 min-h-[48px] sm:min-h-0 text-center font-mono font-bold"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">Hedef AYT Net</label>
                      <input
                        type="number"
                        placeholder="Ör: 70"
                        value={targetAYTNet}
                        onChange={(e) => setTargetAYTNet(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-3 sm:py-2 text-sm sm:text-xs text-white focus:outline-none focus:border-indigo-400 min-h-[48px] sm:min-h-0 text-center font-mono font-bold"
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">OBP (Lise Ort.)</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="Ör: 88.5"
                      value={highSchoolGpa}
                      onChange={(e) => setHighSchoolGpa(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-3 sm:py-2 text-sm sm:text-xs text-white focus:outline-none focus:border-indigo-400 min-h-[48px] sm:min-h-0 text-center font-mono font-bold"
                    />
                  </div>
                </div>
              )}

              {/* DİL Öğrencisine Özel Sınav Dili Seçimi (Diğer alanlarda tamamen gizli) */}
              {!isEarly && targetField === 'DİL' && (
                <div className="bg-sky-950/30 border border-sky-500/25 rounded-2xl p-3 flex items-center justify-between gap-3 animate-fade-in">
                  <div className="flex items-center space-x-2">
                    <span className="text-base">🌐</span>
                    <div>
                      <div className="text-xs font-bold text-sky-200">YDT Sınav Yabancı Dili</div>
                      <div className="text-[10px] text-sky-400/80">YKS Yabancı Dil Testinde gireceğiniz dil</div>
                    </div>
                  </div>
                  <select
                    value={targetLanguage}
                    onChange={(e) => setTargetLanguage(e.target.value)}
                    className="bg-slate-950 border border-sky-500/40 text-sky-300 text-xs font-bold rounded-xl px-3 py-1.5 focus:outline-none focus:border-sky-400 cursor-pointer"
                  >
                    <option value="İngilizce">İngilizce</option>
                    <option value="Almanca">Almanca</option>
                    <option value="Fransızca">Fransızca</option>
                    <option value="Arapça">Arapça</option>
                    <option value="Rusça">Rusça</option>
                  </select>
                </div>
              )}
            </div>
          )}

          {/* App Settings Section */}
          <div className="space-y-3 pt-2 border-t border-white/10">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
              <Bell className="w-3.5 h-3.5 text-indigo-400" />
              <span>Uygulama Ayarları</span>
            </h3>
            
            <div className="bg-slate-950/60 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-xl border transition-colors ${soundEnabled ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-800 text-slate-400 border-white/5'}`}>
                  {soundEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Mesaj Bildirim Sesi</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Yeni bir mesaj geldiğinde sesli bildirim alırsınız.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  soundEnabled ? 'bg-emerald-500' : 'bg-slate-700'
                }`}
              >
                <span className="sr-only">Sesli bildirimleri aç/kapat</span>
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    soundEnabled ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Password Change Section */}
          <div className="bg-slate-950/60 border border-white/10 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Giriş Şifresi İşlemleri</h4>
                  <p className="text-[11px] text-slate-400">Giriş yaparken kullandığınız şifreyi değiştirin</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowPasswordSection(!showPasswordSection);
                  setPassError(null);
                  setPassSuccess(null);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 border shadow-sm ${
                  showPasswordSection
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-white/10 text-slate-200 border-white/10 hover:bg-white/15'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{showPasswordSection ? 'Şifre Formunu Kapat' : 'Şifre Değiştir'}</span>
                {showPasswordSection ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            {showPasswordSection && (() => {
              const isMinLength = newPasswordInput.length >= 6;
              const hasLetter = /[a-zA-ZğüşıöçĞÜŞİÖÇ]/.test(newPasswordInput);
              const hasNumber = /[0-9]/.test(newPasswordInput);
              const isConfirmEntered = confirmPasswordInput.length > 0;
              const isMatching = isConfirmEntered && newPasswordInput === confirmPasswordInput;
              const isAllValid = isMinLength && hasLetter && hasNumber && isMatching;

              return (
                <div className="pt-3 border-t border-white/10 space-y-3 animate-fadeIn">
                  {passError && (
                    <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-2.5 flex items-center space-x-2 text-rose-300 text-xs">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                      <span>{passError}</span>
                    </div>
                  )}

                  {passSuccess && (
                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-2.5 flex items-center space-x-2 text-emerald-300 text-xs">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                      <span>{passSuccess}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">Mevcut Şifre</label>
                      <div className="relative">
                        <input
                          type={showCurrentPass ? 'text' : 'password'}
                          placeholder="Eski şifreniz"
                          value={currentPasswordInput}
                          onChange={(e) => setCurrentPasswordInput(e.target.value)}
                          className="w-full bg-slate-900 border border-white/10 rounded-xl pl-3 pr-8 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPass(!showCurrentPass)}
                          className="absolute right-2.5 top-2 text-slate-400 hover:text-white"
                        >
                          {showCurrentPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">Yeni Şifre</label>
                      <div className="relative">
                        <input
                          type={showNewPass ? 'text' : 'password'}
                          placeholder="Harf + Rakam (En az 6 karktr)"
                          value={newPasswordInput}
                          onChange={(e) => setNewPasswordInput(e.target.value)}
                          className={`w-full bg-slate-900 border rounded-xl pl-3 pr-8 py-1.5 text-xs text-white focus:outline-none transition-colors ${
                            newPasswordInput.length > 0
                              ? (isMinLength && hasLetter && hasNumber ? 'border-emerald-500/60' : 'border-amber-500/60')
                              : 'border-white/10 focus:border-amber-400'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPass(!showNewPass)}
                          className="absolute right-2.5 top-2 text-slate-400 hover:text-white"
                        >
                          {showNewPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">Yeni Şifre (Tekrar)</label>
                      <input
                        type="password"
                        placeholder="Yeni şifrenizi doğrulayın"
                        value={confirmPasswordInput}
                        onChange={(e) => setConfirmPasswordInput(e.target.value)}
                        className={`w-full bg-slate-900 border rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none transition-colors ${
                          isConfirmEntered
                            ? (isMatching ? 'border-emerald-500/60' : 'border-rose-500/60')
                            : 'border-white/10 focus:border-amber-400'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Real-time criteria verification badges */}
                  <div className="bg-slate-900/80 border border-white/5 rounded-xl p-3 space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Anlık Şifre Kriterleri Kontrolü:</span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                      {/* Criteria 1: Min 6 characters */}
                      <div className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg border font-medium transition-all ${
                        isMinLength 
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' 
                          : 'bg-white/5 text-slate-400 border-white/5'
                      }`}>
                        {isMinLength ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <div className="w-2 h-2 rounded-full bg-slate-600 shrink-0" />}
                        <span>En az 6 karakter</span>
                      </div>

                      {/* Criteria 2: Has Letter */}
                      <div className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg border font-medium transition-all ${
                        hasLetter 
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' 
                          : 'bg-white/5 text-slate-400 border-white/5'
                      }`}>
                        {hasLetter ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <div className="w-2 h-2 rounded-full bg-slate-600 shrink-0" />}
                        <span>En az 1 harf</span>
                      </div>

                      {/* Criteria 3: Has Number */}
                      <div className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg border font-medium transition-all ${
                        hasNumber 
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' 
                          : 'bg-white/5 text-slate-400 border-white/5'
                      }`}>
                        {hasNumber ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <div className="w-2 h-2 rounded-full bg-slate-600 shrink-0" />}
                        <span>En az 1 rakam</span>
                      </div>

                      {/* Criteria 4: Matching */}
                      <div className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg border font-medium transition-all ${
                        isMatching 
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' 
                          : (isConfirmEntered ? 'bg-rose-500/15 text-rose-300 border-rose-500/30' : 'bg-white/5 text-slate-400 border-white/5')
                      }`}>
                        {isMatching ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        ) : isConfirmEntered ? (
                          <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-slate-600 shrink-0" />
                        )}
                        <span>Şifreler eşleşiyor</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={handleApplyPasswordChange}
                      disabled={!isAllValid && newPasswordInput.length > 0}
                      className={`text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-md flex items-center space-x-1.5 ${
                        isAllValid || newPasswordInput.length === 0
                          ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/30'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-70'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Şifreyi Güncelle</span>
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-3 sm:py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors min-h-[44px] sm:min-h-0 flex items-center justify-center cursor-pointer"
            >
              İptal
            </button>
            <button
              type="submit"
              className={`text-white text-xs font-bold px-6 py-3.5 sm:py-2.5 rounded-xl transition-all shadow-lg min-h-[48px] sm:min-h-0 flex items-center justify-center cursor-pointer active:scale-[0.98] ${
                isTeacher 
                  ? 'bg-fuchsia-600 hover:bg-fuchsia-500 shadow-fuchsia-600/30 border border-fuchsia-400/40' 
                  : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30 border border-indigo-400/40'
              }`}
            >
              Kaydet ve Güncelle
            </button>
          </div>

        </form>
      </div>

      {/* ✂️ Profil Fotoğrafı Kırpma Modalı */}
      <ImageCropperModal
        isOpen={showCropperModal}
        imageFile={selectedRawFile}
        imageUrl={!selectedRawFile && avatarUrl ? avatarUrl : undefined}
        onClose={() => setShowCropperModal(false)}
        onCropComplete={handleCropComplete}
        onUseOriginal={selectedRawFile ? handleUseOriginal : undefined}
        title="Profil Fotoğrafını Kırp"
        subtitle="Yüz veya portre alanını parmağınızla/farenizle seçip kırpın."
        initialAspectRatio={1}
      />
    </div>
  );
};
