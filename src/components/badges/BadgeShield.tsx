import React from 'react';
import { BadgeTier } from '../../types';
import {
  BadgeRocketIcon,
  BadgeFlameIcon,
  BadgeSwordsIcon,
  BadgeShieldIcon as ShieldIconAsset,
  BadgeCrownIcon,
  BadgeTargetIcon,
  BadgeLightningIcon,
  BadgeEagleTrophyIcon,
  BadgeTrendingUpIcon,
  BadgeStarIcon,
  BadgeConstellationIcon,
  BadgeAncientBookIcon,
  BadgeGraduationIcon,
  BadgeScrollIcon,
  BadgeSproutIcon,
  BadgeGearIcon,
  BadgeHammerIcon,
  BadgeDiamondSphereIcon,
  BadgeBowArrowIcon,
  BadgeLibraryCastleIcon,
  BadgeHourglassIcon,
  BadgeLotusIcon,
  BadgeHologramGemIcon
} from './BadgeIcons';
import { Lock } from 'lucide-react';

export type BadgeIconType =
  | 'rocket'
  | 'flame'
  | 'swords'
  | 'shield'
  | 'crown'
  | 'target'
  | 'lightning'
  | 'eagle_trophy'
  | 'trending_up'
  | 'star'
  | 'constellation'
  | 'ancient_book'
  | 'graduation'
  | 'scroll'
  | 'sprout'
  | 'gear'
  | 'hammer'
  | 'diamond_sphere'
  | 'bow_arrow'
  | 'library_castle'
  | 'hourglass'
  | 'lotus'
  | 'hologram_gem';

interface BadgeShieldProps {
  iconType: BadgeIconType;
  tier: BadgeTier;
  isUnlocked?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showStars?: boolean;
  className?: string;
  animate?: boolean;
  progressPercent?: number;
  onClick?: () => void;
}

const TIER_COLORS = {
  bronze: {
    outerGradStart: '#F59E0B',
    outerGradMid: '#D97706',
    outerGradEnd: '#78350F',
    innerBgStart: '#451A03',
    innerBgEnd: '#1C1917',
    glowColor: 'rgba(217, 119, 6, 0.35)',
    ribbonBg: '#B45309',
    ribbonText: '#FEF3C7',
    stars: 1,
    label: 'Bronz I'
  },
  silver: {
    outerGradStart: '#F8FAFC',
    outerGradMid: '#94A3B8',
    outerGradEnd: '#334155',
    innerBgStart: '#1E293B',
    innerBgEnd: '#0F172A',
    glowColor: 'rgba(148, 163, 184, 0.45)',
    ribbonBg: '#475569',
    ribbonText: '#F1F5F9',
    stars: 2,
    label: 'Gümüş II'
  },
  gold: {
    outerGradStart: '#FEF08A',
    outerGradMid: '#F59E0B',
    outerGradEnd: '#78350F',
    innerBgStart: '#713F12',
    innerBgEnd: '#1E1B4B',
    glowColor: 'rgba(245, 158, 11, 0.55)',
    ribbonBg: '#D97706',
    ribbonText: '#FEF08A',
    stars: 3,
    label: 'Altın III'
  },
  platinum: {
    outerGradStart: '#E0E7FF',
    outerGradMid: '#818CF8',
    outerGradEnd: '#4338CA',
    innerBgStart: '#312E81',
    innerBgEnd: '#09090B',
    glowColor: 'rgba(99, 102, 241, 0.65)',
    ribbonBg: '#4F46E5',
    ribbonText: '#EEF2FF',
    stars: 4,
    label: 'Platin IV'
  },
  legendary: {
    outerGradStart: '#F43F5E',
    outerGradMid: '#EC4899',
    outerGradEnd: '#831843',
    innerBgStart: '#500724',
    innerBgEnd: '#020617',
    glowColor: 'rgba(236, 72, 153, 0.75)',
    ribbonBg: '#BE185D',
    ribbonText: '#FFE4E6',
    stars: 5,
    label: 'Efsanevi V'
  }
};

const SIZE_MAP = {
  sm: { width: 68, height: 78, iconSize: 28, ribbonHeight: 14, fontSize: '9px' },
  md: { width: 96, height: 110, iconSize: 42, ribbonHeight: 18, fontSize: '11px' },
  lg: { width: 128, height: 146, iconSize: 58, ribbonHeight: 22, fontSize: '12px' },
  xl: { width: 160, height: 182, iconSize: 76, ribbonHeight: 26, fontSize: '14px' }
};

export const BadgeShield: React.FC<BadgeShieldProps> = ({
  iconType,
  tier,
  isUnlocked = true,
  size = 'md',
  showStars = true,
  className = '',
  animate = false,
  progressPercent,
  onClick
}) => {
  const tierConfig = TIER_COLORS[tier] || TIER_COLORS.bronze;
  const dimensions = SIZE_MAP[size] || SIZE_MAP.md;

  const renderHeroIcon = () => {
    const iconProps = { className: 'w-full h-full drop-shadow-md' };
    switch (iconType) {
      case 'rocket':
        return <BadgeRocketIcon {...iconProps} />;
      case 'flame':
        return <BadgeFlameIcon {...iconProps} />;
      case 'swords':
        return <BadgeSwordsIcon {...iconProps} />;
      case 'shield':
        return <ShieldIconAsset {...iconProps} />;
      case 'crown':
        return <BadgeCrownIcon {...iconProps} />;
      case 'target':
        return <BadgeTargetIcon {...iconProps} />;
      case 'lightning':
        return <BadgeLightningIcon {...iconProps} />;
      case 'eagle_trophy':
        return <BadgeEagleTrophyIcon {...iconProps} />;
      case 'trending_up':
        return <BadgeTrendingUpIcon {...iconProps} />;
      case 'star':
        return <BadgeStarIcon {...iconProps} />;
      case 'constellation':
        return <BadgeConstellationIcon {...iconProps} />;
      case 'ancient_book':
        return <BadgeAncientBookIcon {...iconProps} />;
      case 'graduation':
        return <BadgeGraduationIcon {...iconProps} />;
      case 'scroll':
        return <BadgeScrollIcon {...iconProps} />;
      case 'sprout':
        return <BadgeSproutIcon {...iconProps} />;
      case 'gear':
        return <BadgeGearIcon {...iconProps} />;
      case 'hammer':
        return <BadgeHammerIcon {...iconProps} />;
      case 'diamond_sphere':
        return <BadgeDiamondSphereIcon {...iconProps} />;
      case 'bow_arrow':
        return <BadgeBowArrowIcon {...iconProps} />;
      case 'library_castle':
        return <BadgeLibraryCastleIcon {...iconProps} />;
      case 'hourglass':
        return <BadgeHourglassIcon {...iconProps} />;
      case 'lotus':
        return <BadgeLotusIcon {...iconProps} />;
      case 'hologram_gem':
        return <BadgeHologramGemIcon {...iconProps} />;
      default:
        return <BadgeStarIcon {...iconProps} />;
    }
  };

  const shieldGradientId = `shieldGrad_${tier}_${iconType}_${size}_${isUnlocked ? '1' : '0'}`;
  const innerGradientId = `innerGrad_${tier}_${iconType}_${size}_${isUnlocked ? '1' : '0'}`;

  return (
    <div
      onClick={onClick}
      className={`relative inline-flex flex-col items-center justify-center select-none group transition-transform duration-300 ${
        onClick ? 'cursor-pointer hover:scale-105 active:scale-95' : ''
      } ${animate ? 'animate-bounce' : ''} ${className}`}
      style={{ width: dimensions.width, height: dimensions.height }}
    >
      {/* 3D SVG Shield Base */}
      <svg
        viewBox="0 0 100 115"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-xl"
        style={{
          filter: isUnlocked
            ? `drop-shadow(0 8px 16px ${tierConfig.glowColor})`
            : 'drop-shadow(0 4px 6px rgba(0,0,0,0.4))'
        }}
      >
        <defs>
          <linearGradient id={shieldGradientId} x1="10" y1="5" x2="90" y2="105" gradientUnits="userSpaceOnUse">
            {isUnlocked ? (
              <>
                <stop stopColor={tierConfig.outerGradStart} />
                <stop offset="0.5" stopColor={tierConfig.outerGradMid} />
                <stop offset="1" stopColor={tierConfig.outerGradEnd} />
              </>
            ) : (
              <>
                <stop stopColor="#475569" />
                <stop offset="0.5" stopColor="#334155" />
                <stop offset="1" stopColor="#1E293B" />
              </>
            )}
          </linearGradient>

          <linearGradient id={innerGradientId} x1="20" y1="12" x2="80" y2="92" gradientUnits="userSpaceOnUse">
            {isUnlocked ? (
              <>
                <stop stopColor={tierConfig.innerBgStart} />
                <stop offset="1" stopColor={tierConfig.innerBgEnd} />
              </>
            ) : (
              <>
                <stop stopColor="#1E293B" />
                <stop offset="1" stopColor="#0F172A" />
              </>
            )}
          </linearGradient>
        </defs>

        {/* Outer 3D Beveled Shield */}
        <polygon
          points="50,4 92,18 92,62 50,98 8,62 8,18"
          fill={`url(#${shieldGradientId})`}
          stroke={isUnlocked ? '#FFFFFF' : '#64748B'}
          strokeWidth={isUnlocked ? '1.5' : '1'}
          strokeOpacity={isUnlocked ? '0.6' : '0.3'}
        />

        {/* Facet Light Accent Lines */}
        {isUnlocked && (
          <>
            <polygon points="50,4 92,18 50,14" fill="#FFFFFF" fillOpacity="0.25" />
            <polygon points="8,18 50,4 50,14" fill="#FFFFFF" fillOpacity="0.12" />
            <line x1="50" y1="4" x2="50" y2="98" stroke="#FFFFFF" strokeWidth="1" strokeOpacity="0.15" />
          </>
        )}

        {/* Inner Crystal Recessed Shield */}
        <polygon
          points="50,12 84,23 84,58 50,88 16,58 16,23"
          fill={`url(#${innerGradientId})`}
          stroke={isUnlocked ? tierConfig.outerGradStart : '#334155'}
          strokeWidth="1.5"
          strokeOpacity="0.4"
        />

        {/* Bottom Tier Ribbon Banner */}
        {showStars && (
          <g transform="translate(0, 80)">
            <path
              d="M18 10L26 4H74L82 10L78 20L50 24L22 20L18 10Z"
              fill={isUnlocked ? tierConfig.ribbonBg : '#1E293B'}
              stroke={isUnlocked ? tierConfig.outerGradStart : '#475569'}
              strokeWidth="1"
            />
            {/* Stars rendering */}
            {isUnlocked ? (
              <text
                x="50"
                y="16"
                textAnchor="middle"
                fill={tierConfig.ribbonText}
                fontSize="11"
                fontWeight="bold"
                letterSpacing="1"
              >
                {'★'.repeat(tierConfig.stars)}
              </text>
            ) : (
              <text
                x="50"
                y="16"
                textAnchor="middle"
                fill="#94A3B8"
                fontSize="9"
                fontWeight="600"
              >
                KİLİTLİ
              </text>
            )}
          </g>
        )}
      </svg>

      {/* Center Icon or Lock Overlay */}
      <div
        className="absolute flex items-center justify-center"
        style={{
          width: dimensions.iconSize,
          height: dimensions.iconSize,
          top: '22%'
        }}
      >
        {isUnlocked ? (
          <div className="w-full h-full flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
            {renderHeroIcon()}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-slate-800/90 border border-slate-600/80 flex items-center justify-center text-slate-400 shadow-inner">
              <Lock className="w-4 h-4 text-slate-400" />
            </div>
          </div>
        )}
      </div>

      {/* Progress percentage pill if locked and progress given */}
      {!isUnlocked && progressPercent !== undefined && progressPercent > 0 && (
        <div className="absolute -bottom-1 px-1.5 py-0.5 rounded-full bg-slate-900/95 border border-amber-500/40 text-[9px] font-bold text-amber-400 shadow-lg tracking-tight">
          %{Math.round(progressPercent)}
        </div>
      )}
    </div>
  );
};
