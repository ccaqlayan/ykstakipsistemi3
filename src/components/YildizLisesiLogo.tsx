import React from 'react';

interface YildizLisesiLogoProps {
  className?: string;
}

export const YildizLisesiLogo: React.FC<YildizLisesiLogoProps> = ({ className = 'w-10 h-10' }) => {
  return (
    <svg
      viewBox="0 0 400 400"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id="blueBgGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#1e40af" />
          <stop offset="60%" stopColor="#1e3a8a" />
          <stop offset="100%" stopColor="#0f172a" />
        </radialGradient>
        
        <linearGradient id="goldStarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fde047" />
          <stop offset="40%" stopColor="#eab308" />
          <stop offset="100%" stopColor="#ca8a04" />
        </linearGradient>

        <linearGradient id="swooshGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#e2e8f0" stopOpacity="0.8" />
        </linearGradient>

        <filter id="logoShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#000" floodOpacity="0.4" />
        </filter>
      </defs>

      {/* Outer Red Ring */}
      <circle cx="200" cy="200" r="190" fill="#dc2626" />
      <circle cx="200" cy="200" r="184" fill="#ffffff" />
      <circle cx="200" cy="200" r="180" fill="#1d4ed8" />
      <circle cx="200" cy="200" r="176" fill="#ffffff" />

      {/* Curved Text Path for "GÜRSU" (Top) */}
      <path id="textPathTop" d="M 70 200 A 130 130 0 0 1 330 200" fill="none" />
      {/* Curved Text Path for "YILDIZ ANADOLU LİSESİ" (Bottom) */}
      <path id="textPathBottom" d="M 345 200 A 145 145 0 0 1 55 200" fill="none" />

      {/* Top Text */}
      <text fill="#1e3a8a" fontSize="32" fontWeight="900" fontFamily="sans-serif" letterSpacing="4">
        <textPath href="#textPathTop" startOffset="50%" textAnchor="middle">
          GÜRSU
        </textPath>
      </text>

      {/* Bottom Text */}
      <text fill="#1e3a8a" fontSize="24" fontWeight="800" fontFamily="sans-serif" letterSpacing="2">
        <textPath href="#textPathBottom" startOffset="50%" textAnchor="middle">
          YILDIZ ANADOLU LİSESİ
        </textPath>
      </text>

      {/* Inner Blue Circle */}
      <circle cx="200" cy="200" r="125" fill="#ca8a04" />
      <circle cx="200" cy="200" r="122" fill="#ffffff" />
      <circle cx="200" cy="200" r="118" fill="url(#blueBgGrad)" />

      {/* Little Stars in Blue Sky */}
      <path d="M 200 68 L 202 73 L 207 75 L 202 77 L 200 82 L 198 77 L 193 75 L 198 73 Z" fill="#ffffff" opacity="0.9" />
      <path d="M 178 88 L 179 92 L 183 93 L 179 94 L 178 98 L 177 94 L 173 93 L 177 92 Z" fill="#ffffff" opacity="0.8" />
      <path d="M 222 88 L 223 92 L 227 93 L 223 94 L 222 98 L 221 94 L 217 93 L 221 92 Z" fill="#ffffff" opacity="0.8" />
      <path d="M 235 110 L 236 113 L 239 114 L 236 115 L 235 118 L 234 115 L 231 114 L 234 113 Z" fill="#ffffff" opacity="0.7" />
      <path d="M 165 110 L 166 113 L 169 114 L 166 115 L 165 118 L 164 115 L 161 114 L 164 113 Z" fill="#ffffff" opacity="0.7" />

      {/* Large Glowing Gold Star */}
      <polygon
        points="200,105 224,162 284,162 235,198 254,258 200,222 146,258 165,198 116,162 176,162"
        fill="url(#goldStarGrad)"
        filter="url(#logoShadow)"
      />

      {/* Orbit Swoosh Line around Star */}
      <path
        d="M 125 120 C 150 180, 240 250, 285 240 C 295 238, 260 215, 200 170 C 160 140, 135 125, 125 120 Z"
        fill="url(#swooshGrad)"
      />

      {/* Foundation Year Text: "1988" */}
      <text
        x="200"
        y="292"
        textAnchor="middle"
        fill="#ffffff"
        fontSize="24"
        fontWeight="800"
        fontFamily="sans-serif"
        letterSpacing="2"
      >
        1988
      </text>
    </svg>
  );
};
