import React from 'react';
import { Sparkles, Edit3 } from 'lucide-react';
import { StudentProfile } from '../../types';
import { UniversityLogo } from '../UniversityLogo';

interface DashboardTargetBannerProps {
  profile: StudentProfile;
  latestTYTNet: number;
  latestAYTNet: number;
  onOpenTargetModal: () => void;
}

export const DashboardTargetBanner: React.FC<DashboardTargetBannerProps> = ({
  profile,
  latestTYTNet,
  latestAYTNet,
  onOpenTargetModal
}) => {
  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 shadow-2xl relative overflow-hidden">
      <div className="absolute -top-10 -right-10 w-80 h-80 bg-gradient-to-br from-indigo-500/20 to-fuchsia-500/20 rounded-full blur-3xl pointer-events-none" />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-6 relative z-10">
        <div>
          <div className="flex items-center space-x-1.5 sm:space-x-2 text-indigo-300 text-[10px] sm:text-xs font-semibold uppercase tracking-wider mb-0.5 sm:mb-1">
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-400" />
            <span>YKS Derece Hedef Tablosu</span>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-3 my-0.5 sm:my-1">
            <UniversityLogo 
              universityName={profile.targetUniversity} 
              sizeClassName="w-6 h-6 sm:w-10 sm:h-10 shrink-0" 
              opacityClassName="opacity-90 hover:opacity-100" 
            />
            <h1 className="text-lg sm:text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-300 tracking-tight target-uni-title">
              {profile.targetUniversity || 'Üniversite Hedefi'}
            </h1>
          </div>
          <p className="text-slate-300 text-[10px] sm:text-sm mt-0.5 sm:mt-1 flex items-center flex-nowrap whitespace-nowrap overflow-hidden gap-1 sm:gap-2">
            <span className="truncate">{profile.targetDepartment || 'Bölüm Hedefi'}</span>
            <span className="shrink-0">•</span>
            <span className="text-emerald-400 font-semibold font-mono shrink-0">
              Hedef Sıralama: {profile.targetRank && profile.targetRank > 0 ? `#${profile.targetRank.toLocaleString('tr-TR')}` : 'Belirlenmedi'}
            </span>
            {profile.targetField && (
              <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-md font-bold font-mono shrink-0">
                {profile.targetField}
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center justify-between sm:justify-start gap-2 sm:gap-4 bg-white/10 backdrop-blur-md p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border border-white/15 shadow-inner">
          <div className="text-center px-1.5 sm:px-3 border-r border-white/15">
            <div className="text-[10px] sm:text-xs text-slate-300">Hedef TYT</div>
            <div className="text-base sm:text-xl font-bold text-indigo-400 font-mono">{profile.targetTYTNet ?? 0}</div>
            <div className="text-[9px] sm:text-[10px] text-slate-400 mt-0.5">Mevcut: <span className="text-white font-semibold">{latestTYTNet}</span></div>
          </div>

          <div className="text-center px-1.5 sm:px-3 border-r border-white/15">
            <div className="text-[10px] sm:text-xs text-slate-300">
              {profile.targetField === 'DİL' || (profile.targetField as string) === 'DIL' ? 'Hedef YDT' : 'Hedef AYT'}
            </div>
            <div className="text-base sm:text-xl font-bold text-emerald-400 font-mono">
              {(profile.targetField === 'DİL' || (profile.targetField as string) === 'DIL') 
                ? (profile.targetYDTNet ?? profile.targetAYTNet ?? 0) 
                : (profile.targetAYTNet ?? 0)}
            </div>
            <div className="text-[9px] sm:text-[10px] text-slate-400 mt-0.5">Mevcut: <span className="text-white font-semibold">{latestAYTNet}</span></div>
          </div>

          <div className="text-center px-1.5 sm:px-3">
            <div className="text-[10px] sm:text-xs text-slate-300">OBP</div>
            <div className="text-base sm:text-xl font-bold text-amber-400 font-mono">{profile.highSchoolGpa || '85.0'}</div>
            <div className="text-[9px] sm:text-[10px] text-slate-400 mt-0.5">Diploma</div>
          </div>

          <button
            type="button"
            onClick={onOpenTargetModal}
            className="ml-1 sm:ml-2 bg-indigo-600/80 hover:bg-indigo-500 border border-indigo-400/40 text-white text-[10px] sm:text-xs px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl font-semibold transition-all shadow-lg shadow-indigo-600/20 flex items-center space-x-1 cursor-pointer shrink-0"
          >
            <Edit3 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span>Düzenle</span>
          </button>
        </div>
      </div>
    </div>
  );
};
