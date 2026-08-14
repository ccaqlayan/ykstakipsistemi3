import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

export const BadgeRocketIcon: React.FC<IconProps> = ({ className = 'w-10 h-10', size }) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} width={size} height={size}>
    <defs>
      <linearGradient id="rocketBody" x1="16" y1="16" x2="48" y2="48" gradientUnits="userSpaceOnUse">
        <stop stopColor="#F8FAFC" />
        <stop offset="0.5" stopColor="#E2E8F0" />
        <stop offset="1" stopColor="#94A3B8" />
      </linearGradient>
      <linearGradient id="rocketNose" x1="36" y1="10" x2="52" y2="26" gradientUnits="userSpaceOnUse">
        <stop stopColor="#EF4444" />
        <stop offset="1" stopColor="#991B1B" />
      </linearGradient>
      <linearGradient id="rocketFlame" x1="14" y1="46" x2="28" y2="60" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FBBF24" />
        <stop offset="0.6" stopColor="#F97316" />
        <stop offset="1" stopColor="#DC2626" />
      </linearGradient>
      <linearGradient id="rocketWindow" x1="32" y1="22" x2="44" y2="34" gradientUnits="userSpaceOnUse">
        <stop stopColor="#38BDF8" />
        <stop offset="1" stopColor="#0284C7" />
      </linearGradient>
      <linearGradient id="rocketFin" x1="20" y1="36" x2="32" y2="52" gradientUnits="userSpaceOnUse">
        <stop stopColor="#DC2626" />
        <stop offset="1" stopColor="#7F1D1D" />
      </linearGradient>
    </defs>
    {/* Exhaust Flames */}
    <path d="M12 58C14 48 20 44 24 40L24 40C20 44 16 50 12 58Z" fill="url(#rocketFlame)" opacity="0.8" />
    <path d="M18 56C19 46 25 42 28 36L28 36C25 42 22 48 18 56Z" fill="url(#rocketFlame)" />
    <path d="M8 52C16 48 20 42 22 38L18 34C14 40 10 46 8 52Z" fill="#FDE047" opacity="0.9" />
    {/* Left & Right Fins */}
    <path d="M18 36L12 46C12 46 20 48 28 46L24 38Z" fill="url(#rocketFin)" />
    <path d="M28 26L38 16C38 16 40 24 38 32L30 28Z" fill="url(#rocketFin)" />
    {/* Fuselage Body */}
    <path d="M48 16C36 18 24 30 22 42C34 40 46 28 48 16Z" fill="url(#rocketBody)" />
    {/* Nose Cone */}
    <path d="M48 16C44 14 42 12 40 8C48 10 52 12 56 16C52 20 50 24 48 16Z" fill="url(#rocketNose)" />
    {/* Window Porthole */}
    <circle cx="37" cy="27" r="5.5" fill="#1E293B" />
    <circle cx="37" cy="27" r="4" fill="url(#rocketWindow)" />
    <circle cx="35.5" cy="25.5" r="1.2" fill="#FFFFFF" opacity="0.8" />
    {/* Wings Highlight line */}
    <path d="M45 19L27 37" stroke="#CBD5E1" strokeWidth="1" strokeLinecap="round" />
  </svg>
);

export const BadgeFlameIcon: React.FC<IconProps> = ({ className = 'w-10 h-10', size }) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} width={size} height={size}>
    <defs>
      <linearGradient id="flameOuter" x1="16" y1="12" x2="48" y2="56" gradientUnits="userSpaceOnUse">
        <stop stopColor="#F97316" />
        <stop offset="0.5" stopColor="#EF4444" />
        <stop offset="1" stopColor="#B91C1C" />
      </linearGradient>
      <linearGradient id="flameInner" x1="24" y1="24" x2="40" y2="52" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FEF08A" />
        <stop offset="0.6" stopColor="#FBBF24" />
        <stop offset="1" stopColor="#F97316" />
      </linearGradient>
    </defs>
    <path d="M32 8C34 18 48 24 48 38C48 48 40.8 56 32 56C23.2 56 16 48 16 38C16 26 26 16 32 8Z" fill="url(#flameOuter)" />
    <path d="M32 20C34 26 42 30 42 40C42 46.6 37.5 52 32 52C26.5 52 22 46.6 22 40C22 32 28 26 32 20Z" fill="url(#flameInner)" />
    <path d="M32 32C33.5 36 37 38 37 43C37 46.3 34.8 49 32 49C29.2 49 27 46.3 27 43C27 38 30.5 35 32 32Z" fill="#FFFFFF" opacity="0.8" />
  </svg>
);

export const BadgeSwordsIcon: React.FC<IconProps> = ({ className = 'w-10 h-10', size }) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} width={size} height={size}>
    <defs>
      <linearGradient id="swordBlade1" x1="16" y1="12" x2="48" y2="44" gradientUnits="userSpaceOnUse">
        <stop stopColor="#F8FAFC" />
        <stop offset="0.5" stopColor="#CBD5E1" />
        <stop offset="1" stopColor="#64748B" />
      </linearGradient>
      <linearGradient id="goldHilt" x1="10" y1="46" x2="24" y2="60" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FDE047" />
        <stop offset="0.7" stopColor="#EAB308" />
        <stop offset="1" stopColor="#A16207" />
      </linearGradient>
    </defs>
    {/* Sword 1: Top-Left to Bottom-Right */}
    <path d="M48 12L52 16L24 44L20 40L48 12Z" fill="url(#swordBlade1)" />
    <path d="M52 16L54 14L48 12L52 16Z" fill="#94A3B8" />
    <path d="M26 38L18 46L16 44L24 36L26 38Z" fill="url(#goldHilt)" />
    <circle cx="15" cy="49" r="3" fill="url(#goldHilt)" />
    
    {/* Sword 2: Top-Right to Bottom-Left */}
    <path d="M16 12L12 16L40 44L44 40L16 12Z" fill="url(#swordBlade1)" />
    <path d="M12 16L10 14L16 12L12 16Z" fill="#94A3B8" />
    <path d="M38 38L46 46L48 44L40 36L38 38Z" fill="url(#goldHilt)" />
    <circle cx="49" cy="49" r="3" fill="url(#goldHilt)" />

    {/* Central Gem */}
    <polygon points="32,26 35,31 32,36 29,31" fill="#38BDF8" />
  </svg>
);

export const BadgeShieldIcon: React.FC<IconProps> = ({ className = 'w-10 h-10', size }) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} width={size} height={size}>
    <defs>
      <linearGradient id="shieldRim" x1="16" y1="8" x2="48" y2="56" gradientUnits="userSpaceOnUse">
        <stop stopColor="#A855F7" />
        <stop offset="0.5" stopColor="#6366F1" />
        <stop offset="1" stopColor="#3B82F6" />
      </linearGradient>
      <linearGradient id="shieldPlate" x1="20" y1="12" x2="44" y2="52" gradientUnits="userSpaceOnUse">
        <stop stopColor="#1E1B4B" />
        <stop offset="1" stopColor="#0F172A" />
      </linearGradient>
    </defs>
    <path d="M32 10L48 16V34C48 44 41 51 32 54C23 51 16 44 16 34V16L32 10Z" fill="url(#shieldRim)" />
    <path d="M32 14L44 19V33C44 41 38.5 47 32 49.5C25.5 47 20 41 20 33V19L32 14Z" fill="url(#shieldPlate)" />
    <path d="M32 18L35 27H44L37 32L40 41L32 36L24 41L27 32L20 27H29L32 18Z" fill="#FACC15" />
  </svg>
);

export const BadgeCrownIcon: React.FC<IconProps> = ({ className = 'w-10 h-10', size }) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} width={size} height={size}>
    <defs>
      <linearGradient id="goldCrown" x1="14" y1="16" x2="50" y2="52" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FEF08A" />
        <stop offset="0.4" stopColor="#FACC15" />
        <stop offset="0.8" stopColor="#EAB308" />
        <stop offset="1" stopColor="#A16207" />
      </linearGradient>
    </defs>
    <path d="M14 46L18 22L28 34L32 16L36 34L46 22L50 46H14Z" fill="url(#goldCrown)" />
    <rect x="14" y="46" width="36" height="6" rx="2" fill="#CA8A04" />
    <circle cx="18" cy="20" r="3" fill="#EF4444" />
    <circle cx="32" cy="14" r="3.5" fill="#38BDF8" />
    <circle cx="46" cy="20" r="3" fill="#10B981" />
    <circle cx="32" cy="40" r="3" fill="#A855F7" />
  </svg>
);

export const BadgeTargetIcon: React.FC<IconProps> = ({ className = 'w-10 h-10', size }) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} width={size} height={size}>
    <circle cx="32" cy="32" r="22" stroke="#EF4444" strokeWidth="3" fill="#FEF2F2" fillOpacity="0.1" />
    <circle cx="32" cy="32" r="15" stroke="#FFFFFF" strokeWidth="2.5" />
    <circle cx="32" cy="32" r="8" fill="#EF4444" />
    <circle cx="32" cy="32" r="3" fill="#FEF08A" />
    <line x1="32" y1="6" x2="32" y2="16" stroke="#EF4444" strokeWidth="3" strokeLinecap="round" />
    <line x1="32" y1="48" x2="32" y2="58" stroke="#EF4444" strokeWidth="3" strokeLinecap="round" />
    <line x1="6" y1="32" x2="16" y2="32" stroke="#EF4444" strokeWidth="3" strokeLinecap="round" />
    <line x1="48" y1="32" x2="58" y2="32" stroke="#EF4444" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

export const BadgeLightningIcon: React.FC<IconProps> = ({ className = 'w-10 h-10', size }) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} width={size} height={size}>
    <defs>
      <linearGradient id="electricBolt" x1="20" y1="8" x2="44" y2="56" gradientUnits="userSpaceOnUse">
        <stop stopColor="#67E8F9" />
        <stop offset="0.5" stopColor="#06B6D4" />
        <stop offset="1" stopColor="#0284C7" />
      </linearGradient>
    </defs>
    <polygon points="34,8 18,34 30,34 26,56 46,26 34,26" fill="url(#electricBolt)" stroke="#E0F2FE" strokeWidth="1.5" />
  </svg>
);

export const BadgeEagleTrophyIcon: React.FC<IconProps> = ({ className = 'w-10 h-10', size }) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} width={size} height={size}>
    <defs>
      <linearGradient id="trophyGold" x1="16" y1="12" x2="48" y2="52" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FEF08A" />
        <stop offset="0.6" stopColor="#EAB308" />
        <stop offset="1" stopColor="#854D0E" />
      </linearGradient>
    </defs>
    {/* Eagle Wings */}
    <path d="M32 18C26 12 14 14 10 22C18 22 24 26 28 32C30 26 32 20 32 18Z" fill="#FACC15" />
    <path d="M32 18C38 12 50 14 54 22C46 22 40 26 36 32C34 26 32 20 32 18Z" fill="#EAB308" />
    {/* Trophy Cup */}
    <path d="M22 28H42V38C42 44 37 48 32 48C27 44 22 44 22 38V28Z" fill="url(#trophyGold)" />
    <path d="M22 30H16C16 36 20 40 24 40V37C21 37 18 34 18 30Z" fill="url(#trophyGold)" />
    <path d="M42 30H48C48 36 44 40 40 40V37C43 37 46 34 46 30Z" fill="url(#trophyGold)" />
    <rect x="26" y="48" width="12" height="4" fill="#A16207" />
    <rect x="22" y="52" width="20" height="4" rx="1" fill="#713F12" />
  </svg>
);

export const BadgeTrendingUpIcon: React.FC<IconProps> = ({ className = 'w-10 h-10', size }) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} width={size} height={size}>
    <defs>
      <linearGradient id="trendGreen" x1="12" y1="48" x2="52" y2="16" gradientUnits="userSpaceOnUse">
        <stop stopColor="#34D399" />
        <stop offset="1" stopColor="#059669" />
      </linearGradient>
    </defs>
    <rect x="14" y="40" width="8" height="14" rx="2" fill="#10B981" opacity="0.6" />
    <rect x="26" y="30" width="8" height="24" rx="2" fill="#10B981" opacity="0.8" />
    <rect x="38" y="20" width="8" height="34" rx="2" fill="#10B981" />
    <path d="M16 36L28 24L38 30L50 14" stroke="#FDE047" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    <polyline points="42,14 50,14 50,22" stroke="#FDE047" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const BadgeStarIcon: React.FC<IconProps> = ({ className = 'w-10 h-10', size }) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} width={size} height={size}>
    <defs>
      <linearGradient id="starAmber" x1="16" y1="12" x2="48" y2="52" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FDE047" />
        <stop offset="0.6" stopColor="#F59E0B" />
        <stop offset="1" stopColor="#D97706" />
      </linearGradient>
    </defs>
    <polygon points="32,10 38,24 53,26 42,37 45,52 32,44 19,52 22,37 11,26 26,24" fill="url(#starAmber)" stroke="#FFFBEB" strokeWidth="1" />
  </svg>
);

export const BadgeConstellationIcon: React.FC<IconProps> = ({ className = 'w-10 h-10', size }) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} width={size} height={size}>
    <path d="M18 36L32 16L46 36L32 48L18 36Z" stroke="#93C5FD" strokeWidth="2" strokeDasharray="3 3" opacity="0.7" />
    <circle cx="32" cy="16" r="6" fill="#FACC15" />
    <circle cx="18" cy="36" r="5" fill="#38BDF8" />
    <circle cx="46" cy="36" r="5" fill="#C084FC" />
    <circle cx="32" cy="48" r="4" fill="#34D399" />
  </svg>
);

export const BadgeAncientBookIcon: React.FC<IconProps> = ({ className = 'w-10 h-10', size }) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} width={size} height={size}>
    <defs>
      <linearGradient id="bookCover" x1="14" y1="14" x2="50" y2="50" gradientUnits="userSpaceOnUse">
        <stop stopColor="#BE185D" />
        <stop offset="0.7" stopColor="#881337" />
        <stop offset="1" stopColor="#4C0519" />
      </linearGradient>
    </defs>
    <path d="M14 16C14 16 22 14 32 18C42 14 50 16 50 16V46C50 46 42 44 32 48C22 44 14 46 14 46V16Z" fill="url(#bookCover)" />
    <path d="M16 18C16 18 23 16 32 20C41 16 48 18 48 18V44C48 44 41 42 32 46C23 42 16 44 16 44V18Z" fill="#FDF4FF" fillOpacity="0.9" />
    <line x1="32" y1="20" x2="32" y2="46" stroke="#9D174D" strokeWidth="2" />
    <polygon points="32,24 35,28 32,32 29,28" fill="#F59E0B" />
  </svg>
);

export const BadgeGraduationIcon: React.FC<IconProps> = ({ className = 'w-10 h-10', size }) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} width={size} height={size}>
    <defs>
      <linearGradient id="capGold" x1="16" y1="16" x2="48" y2="48" gradientUnits="userSpaceOnUse">
        <stop stopColor="#1E3A8A" />
        <stop offset="1" stopColor="#172554" />
      </linearGradient>
    </defs>
    <polygon points="32,14 54,24 32,34 10,24" fill="url(#capGold)" stroke="#60A5FA" strokeWidth="1.5" />
    <path d="M18 28V40C18 45 24 48 32 48C40 48 46 45 46 40V28" fill="url(#capGold)" opacity="0.95" />
    <path d="M48 27V42" stroke="#FACC15" strokeWidth="2.5" strokeLinecap="round" />
    <circle cx="48" cy="44" r="2.5" fill="#FACC15" />
  </svg>
);

export const BadgeScrollIcon: React.FC<IconProps> = ({ className = 'w-10 h-10', size }) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} width={size} height={size}>
    <path d="M18 16C18 13 22 13 24 16H46C48 13 52 13 52 16V46C52 49 48 49 46 46H24C22 49 18 49 18 46V16Z" fill="#FEF3C7" stroke="#D97706" strokeWidth="2" />
    <line x1="26" y1="24" x2="44" y2="24" stroke="#92400E" strokeWidth="2" strokeLinecap="round" />
    <line x1="26" y1="31" x2="44" y2="31" stroke="#92400E" strokeWidth="2" strokeLinecap="round" />
    <line x1="26" y1="38" x2="36" y2="38" stroke="#92400E" strokeWidth="2" strokeLinecap="round" />
    <circle cx="42" cy="40" r="4.5" fill="#DC2626" />
  </svg>
);

export const BadgeSproutIcon: React.FC<IconProps> = ({ className = 'w-10 h-10', size }) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} width={size} height={size}>
    <defs>
      <linearGradient id="sproutGrad" x1="16" y1="16" x2="48" y2="48" gradientUnits="userSpaceOnUse">
        <stop stopColor="#4ADE80" />
        <stop offset="1" stopColor="#16A34A" />
      </linearGradient>
    </defs>
    <path d="M32 50V30" stroke="#15803D" strokeWidth="4" strokeLinecap="round" />
    <path d="M32 30C32 20 44 14 48 20C48 30 38 34 32 30Z" fill="url(#sproutGrad)" />
    <path d="M32 36C32 28 22 22 18 28C18 36 26 40 32 36Z" fill="url(#sproutGrad)" />
    <circle cx="32" cy="50" r="4" fill="#78350F" />
  </svg>
);

export const BadgeGearIcon: React.FC<IconProps> = ({ className = 'w-10 h-10', size }) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} width={size} height={size}>
    <defs>
      <linearGradient id="gearMetal" x1="16" y1="16" x2="48" y2="48" gradientUnits="userSpaceOnUse">
        <stop stopColor="#94A3B8" />
        <stop offset="0.6" stopColor="#64748B" />
        <stop offset="1" stopColor="#334155" />
      </linearGradient>
    </defs>
    <circle cx="32" cy="32" r="16" fill="url(#gearMetal)" />
    <circle cx="32" cy="32" r="7" fill="#0F172A" />
    <path d="M32 10V16M32 48V54M10 32H16M48 32H54M16.5 16.5L20.5 20.5M43.5 43.5L47.5 47.5M16.5 47.5L20.5 43.5M43.5 20.5L47.5 16.5" stroke="url(#gearMetal)" strokeWidth="5" strokeLinecap="round" />
    <path d="M42 22L22 42" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

export const BadgeHammerIcon: React.FC<IconProps> = ({ className = 'w-10 h-10', size }) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} width={size} height={size}>
    <rect x="28" y="24" width="8" height="30" rx="2" fill="#78350F" />
    <rect x="18" y="14" width="28" height="14" rx="3" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="1.5" />
    <polygon points="32,20 34,26 30,26" fill="#F59E0B" />
  </svg>
);

export const BadgeDiamondSphereIcon: React.FC<IconProps> = ({ className = 'w-10 h-10', size }) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} width={size} height={size}>
    <defs>
      <linearGradient id="diamondGrad" x1="14" y1="14" x2="50" y2="50" gradientUnits="userSpaceOnUse">
        <stop stopColor="#A5F3FC" />
        <stop offset="0.5" stopColor="#38BDF8" />
        <stop offset="1" stopColor="#0284C7" />
      </linearGradient>
    </defs>
    <polygon points="32,10 50,22 50,42 32,54 14,42 14,22" fill="url(#diamondGrad)" stroke="#E0F2FE" strokeWidth="1.5" />
    <line x1="32" y1="10" x2="32" y2="54" stroke="#E0F2FE" strokeWidth="1" opacity="0.6" />
    <line x1="14" y1="22" x2="50" y2="42" stroke="#E0F2FE" strokeWidth="1" opacity="0.6" />
    <line x1="14" y1="42" x2="50" y2="22" stroke="#E0F2FE" strokeWidth="1" opacity="0.6" />
    <circle cx="32" cy="32" r="3" fill="#FFFFFF" />
  </svg>
);

export const BadgeBowArrowIcon: React.FC<IconProps> = ({ className = 'w-10 h-10', size }) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} width={size} height={size}>
    <path d="M16 48C16 48 20 20 48 16" stroke="#9A3412" strokeWidth="3.5" strokeLinecap="round" />
    <line x1="16" y1="48" x2="48" y2="16" stroke="#FEF08A" strokeWidth="1.5" strokeDasharray="2 2" />
    <line x1="20" y1="44" x2="48" y2="16" stroke="#EAB308" strokeWidth="3" strokeLinecap="round" />
    <polygon points="48,16 42,18 46,22" fill="#DC2626" />
  </svg>
);

export const BadgeLibraryCastleIcon: React.FC<IconProps> = ({ className = 'w-10 h-10', size }) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} width={size} height={size}>
    <defs>
      <linearGradient id="castleGrad" x1="16" y1="16" x2="48" y2="52" gradientUnits="userSpaceOnUse">
        <stop stopColor="#C084FC" />
        <stop offset="0.7" stopColor="#7E22CE" />
        <stop offset="1" stopColor="#581C87" />
      </linearGradient>
    </defs>
    <rect x="20" y="24" width="24" height="28" rx="2" fill="url(#castleGrad)" />
    <rect x="14" y="28" width="8" height="24" fill="url(#castleGrad)" />
    <rect x="42" y="28" width="8" height="24" fill="url(#castleGrad)" />
    <polygon points="14,28 18,20 22,28" fill="#FACC15" />
    <polygon points="42,28 46,20 50,28" fill="#FACC15" />
    <polygon points="26,24 32,14 38,24" fill="#FACC15" />
    <path d="M28 52V42C28 40 30 38 32 38C34 38 36 40 36 42V52H28Z" fill="#FDE047" />
  </svg>
);

export const BadgeHourglassIcon: React.FC<IconProps> = ({ className = 'w-10 h-10', size }) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} width={size} height={size}>
    <defs>
      <linearGradient id="glassFrame" x1="16" y1="12" x2="48" y2="52" gradientUnits="userSpaceOnUse">
        <stop stopColor="#38BDF8" />
        <stop offset="1" stopColor="#0369A1" />
      </linearGradient>
    </defs>
    <rect x="18" y="12" width="28" height="5" rx="1.5" fill="url(#glassFrame)" />
    <rect x="18" y="47" width="28" height="5" rx="1.5" fill="url(#glassFrame)" />
    <path d="M22 17L32 32L42 17H22Z" fill="#E0F2FE" fillOpacity="0.4" stroke="#7DD3FC" strokeWidth="1" />
    <path d="M22 47L32 32L42 47H22Z" fill="#E0F2FE" fillOpacity="0.4" stroke="#7DD3FC" strokeWidth="1" />
    <path d="M26 47L32 38L38 47H26Z" fill="#FACC15" />
    <circle cx="32" cy="32" r="1.5" fill="#FACC15" />
  </svg>
);

export const BadgeLotusIcon: React.FC<IconProps> = ({ className = 'w-10 h-10', size }) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} width={size} height={size}>
    <defs>
      <linearGradient id="lotusPink" x1="16" y1="20" x2="48" y2="52" gradientUnits="userSpaceOnUse">
        <stop stopColor="#F472B6" />
        <stop offset="0.7" stopColor="#DB2777" />
        <stop offset="1" stopColor="#831843" />
      </linearGradient>
    </defs>
    <path d="M32 18C32 28 42 36 48 42C38 46 26 46 16 42C22 36 32 28 32 18Z" fill="url(#lotusPink)" />
    <path d="M32 22C32 30 38 38 42 42C36 44 28 44 22 42C26 38 32 30 32 22Z" fill="#FDF2F8" />
    <circle cx="32" cy="34" r="3.5" fill="#FACC15" />
  </svg>
);

export const BadgeHologramGemIcon: React.FC<IconProps> = ({ className = 'w-10 h-10', size }) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} width={size} height={size}>
    <defs>
      <linearGradient id="holoRainbow" x1="12" y1="12" x2="52" y2="52" gradientUnits="userSpaceOnUse">
        <stop stopColor="#EC4899" />
        <stop offset="0.3" stopColor="#A855F7" />
        <stop offset="0.6" stopColor="#3B82F6" />
        <stop offset="1" stopColor="#10B981" />
      </linearGradient>
    </defs>
    <polygon points="22,14 42,14 54,26 32,54 10,26" fill="url(#holoRainbow)" stroke="#FFFFFF" strokeWidth="1.5" />
    <line x1="22" y1="14" x2="32" y2="54" stroke="#FFFFFF" strokeWidth="1" opacity="0.6" />
    <line x1="42" y1="14" x2="32" y2="54" stroke="#FFFFFF" strokeWidth="1" opacity="0.6" />
    <line x1="10" y1="26" x2="54" y2="26" stroke="#FFFFFF" strokeWidth="1" opacity="0.6" />
  </svg>
);
