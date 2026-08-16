import React from 'react';
import { Eye, ArrowLeft, Lock } from 'lucide-react';
import { UserAccount } from '../types';
import { DEFAULT_AVATAR } from '../data/initialData';

interface StudentPreviewBannerProps {
  student: UserAccount;
  onExitPreview: () => void;
}

export const StudentPreviewBanner: React.FC<StudentPreviewBannerProps> = ({
  student,
  onExitPreview
}) => {
  return (
    <div className="sticky top-0 z-50 w-full bg-gradient-to-r from-amber-600 via-indigo-700 to-purple-800 text-white shadow-2xl border-b border-amber-300/40 backdrop-blur-xl animate-fadeIn font-sans">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3 flex flex-col md:flex-row items-center justify-between gap-3">
        
        {/* Left Side: Live Badge, Avatar, Student Identity */}
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <div className="relative shrink-0">
            <img
              src={student.avatarUrl || DEFAULT_AVATAR}
              alt={student.name}
              className="w-10 h-10 rounded-xl object-cover border-2 border-white/40 shadow-md"
            />
            <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-400 border-2 border-slate-950 animate-ping" />
            <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-400 border-2 border-slate-950 shadow-sm" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-2 flex-wrap">
              <span className="bg-amber-400/20 text-amber-200 border border-amber-300/40 text-[10px] sm:text-xs font-black px-2 py-0.5 rounded-md uppercase tracking-wider flex items-center space-x-1 shadow-sm">
                <Eye className="w-3 h-3 text-amber-300 animate-pulse" />
                <span>Öğrenci Gözünden Önizleme</span>
              </span>
              <span className="bg-white/20 text-white text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-md border border-white/20">
                {student.className || '12-A'}
              </span>
            </div>
            <h2 className="text-xs sm:text-sm font-extrabold text-white truncate drop-shadow-sm mt-0.5">
              {student.name}
            </h2>
          </div>
        </div>

        {/* Center: Informative Security & Read-Only Strip */}
        <div className="hidden lg:flex items-center space-x-2 text-xs font-medium text-amber-100/90 bg-black/20 px-3.5 py-1.5 rounded-xl border border-white/10 shrink-0">
          <Lock className="w-3.5 h-3.5 text-amber-300 shrink-0" />
          <span>
            <strong>Salt Okunur Mod:</strong> Özel mesajlar gizlidir; yeni veri ekleme, düzenleme ve silme yapılamaz.
          </span>
        </div>

        {/* Right Side: Return to Teacher Panel Button */}
        <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
          <button
            onClick={onExitPreview}
            id="exit-student-preview-btn"
            className="w-full sm:w-auto bg-white hover:bg-slate-100 text-indigo-950 font-black text-xs sm:text-sm px-4 py-2 rounded-xl transition-all shadow-lg hover:shadow-white/20 flex items-center justify-center space-x-2 border border-white/80 cursor-pointer active:scale-95 shrink-0"
            title="Öğretmen / Rehberlik Paneline Geri Dön"
          >
            <ArrowLeft className="w-4 h-4 text-indigo-700" />
            <span>Öğretmen Paneline Geri Dön</span>
          </button>
        </div>
      </div>
    </div>
  );
};
