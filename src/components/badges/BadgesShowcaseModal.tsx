import React, { useState } from 'react';
import { YKSDataState, BadgeCategory } from '../../types';
import { BADGE_DEFINITIONS, BadgeDefinition, evaluateBadges } from '../../services/motivationEngine';
import { BadgeShield } from './BadgeShield';
import { Trophy, X, Flame, Sparkles, Filter, CheckCircle2, Lock, Award, Zap } from 'lucide-react';

interface BadgesShowcaseModalProps {
  studentData: YKSDataState;
  studentName?: string;
  isReadOnly?: boolean; // For teacher inspect mode
  onClose: () => void;
}

export const BadgesShowcaseModal: React.FC<BadgesShowcaseModalProps> = ({
  studentData,
  studentName,
  isReadOnly = false,
  onClose
}) => {
  const [activeCategory, setActiveCategory] = useState<BadgeCategory | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [selectedBadge, setSelectedBadge] = useState<BadgeDefinition | null>(null);

  const { allEarnedBadges, stats, totalXp } = evaluateBadges(studentData);
  const earnedKeysSet = new Set(allEarnedBadges.map(b => b.key));

  const totalBadgesCount = BADGE_DEFINITIONS.length;
  const earnedCount = allEarnedBadges.length;
  const progressPercent = Math.round((earnedCount / totalBadgesCount) * 100);

  const categories: Array<{ id: BadgeCategory | 'all'; label: string; icon: any }> = [
    { id: 'all', label: 'Tüm Rozetler', icon: Trophy },
    { id: 'streak', label: '🔥 Seri', icon: Flame },
    { id: 'mock', label: '🚀 Deneme', icon: Award },
    { id: 'topic', label: '🗺️ Konu', icon: Sparkles },
    { id: 'question', label: '🏹 Soru', icon: Zap },
    { id: 'resource', label: '📚 Kaynak', icon: Award },
    { id: 'routine', label: '⏳ Odaklanma', icon: Sparkles }
  ];

  const filteredBadges = BADGE_DEFINITIONS.filter(b => {
    if (activeCategory !== 'all' && b.category !== activeCategory) return false;
    const isUnlocked = earnedKeysSet.has(b.key);
    if (filterStatus === 'unlocked' && !isUnlocked) return false;
    if (filterStatus === 'locked' && isUnlocked) return false;
    return true;
  });

  return (
    <div className="fixed inset-0 z-[9995] flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-fadeIn select-none">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-gradient-to-b from-slate-900 via-slate-900/98 to-slate-950 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="relative p-5 sm:p-6 border-b border-slate-800 bg-gradient-to-r from-amber-950/40 via-slate-900 to-indigo-950/40">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/80 hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pr-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1.5">
                <Trophy className="w-3.5 h-3.5" />
                {isReadOnly ? `${studentName || 'Öğrenci'} Başarı Albümü` : 'YKS Başarı & Rütbe Albümü'}
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {isReadOnly ? `${studentName || 'Öğrencinin'} Rozetleri` : 'Kazanılan Rozetler & Rütbeler'}
              </h2>
            </div>

            {/* Quick Summary KPIs */}
            <div className="flex items-center gap-3">
              <div className="px-3.5 py-2 rounded-2xl bg-slate-800/90 border border-slate-700/80 text-center">
                <div className="text-xs text-slate-400 font-medium">Toplam XP</div>
                <div className="text-base font-extrabold text-amber-400 flex items-center justify-center gap-1">
                  <Zap className="w-4 h-4 fill-amber-400 text-amber-400" />
                  {totalXp.toLocaleString('tr-TR')}
                </div>
              </div>

              <div className="px-3.5 py-2 rounded-2xl bg-slate-800/90 border border-slate-700/80 text-center">
                <div className="text-xs text-slate-400 font-medium">Aktif Seri</div>
                <div className="text-base font-extrabold text-orange-400 flex items-center justify-center gap-1">
                  <Flame className="w-4 h-4 fill-orange-500 text-orange-500" />
                  {stats.currentStreak} Gün
                </div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs font-bold mb-1">
              <span className="text-slate-300">
                Rozet Koleksiyonu: <span className="text-amber-400">{earnedCount}</span> / {totalBadgesCount}
              </span>
              <span className="text-amber-400">%{progressPercent} Tamamlandı</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden p-0.5 border border-slate-700">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-500 transition-all duration-500 shadow-sm"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Category & Status Filter Tabs */}
        <div className="px-5 py-3 border-b border-slate-800/80 bg-slate-900/60 flex flex-wrap items-center justify-between gap-2">
          {/* Categories */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-none">
            {categories.map((c) => {
              const isActive = activeCategory === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setActiveCategory(c.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80'
                  }`}
                >
                  {c.label}
                </button>
              );
            })}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-slate-800/90 p-1 rounded-xl border border-slate-700/70 text-xs">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                filterStatus === 'all' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Tümü ({BADGE_DEFINITIONS.length})
            </button>
            <button
              onClick={() => setFilterStatus('unlocked')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                filterStatus === 'unlocked' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Kazanılan ({earnedCount})
            </button>
            <button
              onClick={() => setFilterStatus('locked')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                filterStatus === 'locked' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Kilitli ({totalBadgesCount - earnedCount})
            </button>
          </div>
        </div>

        {/* Badges Grid Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
          {filteredBadges.map((badge) => {
            const isUnlocked = earnedKeysSet.has(badge.key);
            const progress = badge.calcProgress(studentData, stats);
            const earnedInfo = allEarnedBadges.find((b) => b.key === badge.key);

            return (
              <div
                key={badge.key}
                onClick={() => setSelectedBadge(badge)}
                className={`relative flex flex-col items-center justify-between p-3.5 sm:p-4 rounded-2xl border transition-all duration-300 cursor-pointer ${
                  isUnlocked
                    ? 'bg-gradient-to-b from-slate-800/80 via-slate-900/90 to-slate-950 border-slate-700/80 hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-500/10 hover:-translate-y-1'
                    : 'bg-slate-900/40 border-slate-800/70 opacity-75 hover:opacity-100 hover:border-slate-700'
                }`}
              >
                {/* Status Indicator Pill */}
                <div className="w-full flex items-center justify-between mb-1.5 text-[10px]">
                  <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-400 font-semibold uppercase tracking-wider">
                    {badge.tier}
                  </span>
                  {isUnlocked ? (
                    <span className="flex items-center gap-1 text-emerald-400 font-bold">
                      <CheckCircle2 className="w-3 h-3" />
                      Açıldı
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-slate-500 font-semibold">
                      <Lock className="w-3 h-3" />
                      Kilitli
                    </span>
                  )}
                </div>

                {/* 3D Shield Badge */}
                <div className="my-2">
                  <BadgeShield
                    iconType={badge.iconType}
                    tier={badge.tier}
                    isUnlocked={isUnlocked}
                    size="md"
                    progressPercent={!isUnlocked ? progress.percent : undefined}
                  />
                </div>

                {/* Badge Title & Short Detail */}
                <div className="text-center w-full mt-1">
                  <h4 className="text-xs sm:text-sm font-extrabold text-white line-clamp-1">
                    {badge.name}
                  </h4>
                  <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 leading-snug">
                    {badge.description}
                  </p>
                </div>

                {/* Progress or Earned Date Bar */}
                <div className="w-full mt-3 pt-2 border-t border-slate-800/80 text-[10px]">
                  {isUnlocked ? (
                    <div className="flex items-center justify-between text-amber-400/90 font-bold">
                      <span>+{badge.xpReward} XP</span>
                      <span className="text-slate-400 font-normal">
                        {earnedInfo?.earnedAt ? new Date(earnedInfo.earnedAt).toLocaleDateString('tr-TR') : 'Kazanıldı'}
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-slate-400 font-medium">
                        <span>{progress.label}</span>
                        <span className="font-bold text-amber-400">%{Math.round(progress.percent)}</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-amber-500/80 transition-all duration-300"
                          style={{ width: `${Math.min(100, Math.max(5, progress.percent))}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Single Badge Detail Inspector Modal */}
        {selectedBadge && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
            <div className="relative w-full max-w-sm bg-slate-900 border border-slate-700 rounded-3xl p-6 text-center shadow-2xl animate-scaleUp">
              <button
                onClick={() => setSelectedBadge(null)}
                className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-full bg-slate-800 hover:bg-slate-700 transition"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="my-2 flex items-center justify-center">
                <BadgeShield
                  iconType={selectedBadge.iconType}
                  tier={selectedBadge.tier}
                  isUnlocked={earnedKeysSet.has(selectedBadge.key)}
                  size="lg"
                />
              </div>

              <h3 className="text-xl font-extrabold text-white mt-3">{selectedBadge.name}</h3>
              <div className="inline-flex items-center gap-2 mt-1">
                <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300">
                  {selectedBadge.tier.toUpperCase()} KADEMESİ
                </span>
                <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-xs font-bold text-amber-400">
                  +{selectedBadge.xpReward} XP
                </span>
              </div>

              <p className="text-xs text-slate-300 mt-3 p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 leading-relaxed">
                {selectedBadge.description}
              </p>

              <div className="mt-4 pt-3 border-t border-slate-800 text-xs">
                {earnedKeysSet.has(selectedBadge.key) ? (
                  <div className="text-emerald-400 font-bold flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    Bu rozet başarıyla açıldı!
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-slate-300 font-medium">
                      <span>İlerleme: {selectedBadge.calcProgress(studentData, stats).label}</span>
                      <span className="text-amber-400 font-bold">
                        %{Math.round(selectedBadge.calcProgress(studentData, stats).percent)}
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-amber-500"
                        style={{ width: `${selectedBadge.calcProgress(studentData, stats).percent}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => setSelectedBadge(null)}
                className="w-full mt-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition"
              >
                Kapat
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
