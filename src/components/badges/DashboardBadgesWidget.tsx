import React, { useState } from 'react';
import { YKSDataState } from '../../types';
import { BADGE_DEFINITIONS, evaluateBadges } from '../../services/motivationEngine';
import { BadgeShield } from './BadgeShield';
import { BadgesShowcaseModal } from './BadgesShowcaseModal';
import { Trophy, Flame, ChevronRight, Zap, Sparkles } from 'lucide-react';

interface DashboardBadgesWidgetProps {
  studentData: YKSDataState;
  studentName?: string;
}

export const DashboardBadgesWidget: React.FC<DashboardBadgesWidgetProps> = ({
  studentData,
  studentName
}) => {
  const [showModal, setShowModal] = useState(false);

  const { allEarnedBadges, stats, totalXp } = evaluateBadges(studentData);
  const earnedCount = allEarnedBadges.length;
  const totalCount = BADGE_DEFINITIONS.length;

  // Get up to 3 most recently earned badges, or top priority starter badges if none earned
  const displayBadges = allEarnedBadges.length > 0
    ? allEarnedBadges
        .slice(-3)
        .reverse()
        .map((b) => BADGE_DEFINITIONS.find((def) => def.key === b.key))
        .filter((b): b is typeof BADGE_DEFINITIONS[0] => !!b)
    : BADGE_DEFINITIONS.slice(0, 3); // Preview starters

  return (
    <>
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 border border-slate-800/80 p-5 shadow-xl transition-all duration-300 hover:border-amber-500/30 select-none">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 right-1/4 w-48 h-24 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Widget Header */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-400/30">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                Başarılar & Rozetler
                <span className="text-[11px] font-semibold text-amber-400/90 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30">
                  {earnedCount}/{totalCount}
                </span>
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                {totalXp > 0 ? `${totalXp.toLocaleString('tr-TR')} XP Başarı Puanı` : 'YKS Görevlerini Tamamla ve Rozetleri Kazan'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="group flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-amber-500 hover:text-slate-950 text-slate-300 text-xs font-bold transition border border-slate-700/80 shadow-sm"
          >
            <span>Tümünü Gör</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* Content Row: Streak Card + Badge Previews */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-center">
          {/* Left: Active Streak Card */}
          <div className="sm:col-span-5 flex items-center gap-3.5 p-3.5 rounded-2xl bg-gradient-to-r from-orange-950/40 via-slate-900 to-amber-950/30 border border-orange-500/30 shadow-inner">
            <div className="relative p-2.5 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-lg shadow-orange-500/30 flex items-center justify-center shrink-0">
              <Flame className="w-6 h-6 animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] text-orange-400 font-bold uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Çalışma Serisi
              </div>
              <div className="text-lg font-black text-white leading-tight">
                {stats.currentStreak > 0 ? `${stats.currentStreak} Gün Kesintisiz!` : 'Bugün Başla!'}
              </div>
              <div className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
                {stats.longestStreak > 0 ? `En Uzun Rekor: ${stats.longestStreak} Gün` : 'İlk gününü kaydet'}
              </div>
            </div>
          </div>

          {/* Right: Badge Showcase Items */}
          <div className="sm:col-span-7 flex items-center justify-around sm:justify-end gap-2 sm:gap-4 p-2 rounded-2xl bg-slate-900/50 border border-slate-800/60">
            {displayBadges.map((badge) => {
              const isUnlocked = allEarnedBadges.some((b) => b.key === badge.key);
              return (
                <div
                  key={badge.key}
                  onClick={() => setShowModal(true)}
                  className="flex flex-col items-center cursor-pointer group"
                  title={`${badge.name} (${badge.tier.toUpperCase()})`}
                >
                  <BadgeShield
                    iconType={badge.iconType}
                    tier={badge.tier}
                    isUnlocked={isUnlocked}
                    size="sm"
                  />
                  <span className="text-[10px] font-bold text-slate-300 group-hover:text-amber-400 transition-colors line-clamp-1 mt-1 text-center max-w-[70px]">
                    {badge.name.split(' ')[1] || badge.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Full Collection Modal */}
      {showModal && (
        <BadgesShowcaseModal
          studentData={studentData}
          studentName={studentName}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
};
