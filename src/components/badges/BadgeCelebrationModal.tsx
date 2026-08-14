import React, { useEffect, useRef } from 'react';
import { BadgeDefinition } from '../../services/motivationEngine';
import { BadgeShield } from './BadgeShield';
import { playAchievementSound } from '../../utils/soundUtils';
import { Sparkles, Trophy, X, Award } from 'lucide-react';

interface BadgeCelebrationModalProps {
  badge: BadgeDefinition | null;
  soundEnabled?: boolean;
  onClose: () => void;
  onOpenShowcase?: () => void;
}

export const BadgeCelebrationModal: React.FC<BadgeCelebrationModalProps> = ({
  badge,
  soundEnabled = true,
  onClose,
  onOpenShowcase
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!badge) return;

    // Play achievement fanfare
    playAchievementSound(soundEnabled);

    // Confetti Canvas Animation
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      color: string;
      size: number;
      rotation: number;
      vRot: number;
      alpha: number;
    }> = [];

    const colors = ['#F59E0B', '#EF4444', '#3B82F6', '#10B981', '#EC4899', '#8B5CF6', '#FBBF24'];

    for (let i = 0; i < 90; i++) {
      particles.push({
        x: canvas.width / 2 + (Math.random() - 0.5) * 100,
        y: canvas.height / 2 - 50,
        vx: (Math.random() - 0.5) * 16,
        vy: -Math.random() * 14 - 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 4,
        rotation: Math.random() * 360,
        vRot: (Math.random() - 0.5) * 10,
        alpha: 1
      });
    }

    let animationFrameId: number;
    let frameCount = 0;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      frameCount++;

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.35; // gravity
        p.vx *= 0.98;
        p.rotation += p.vRot;

        if (frameCount > 60) {
          p.alpha = Math.max(0, p.alpha - 0.015);
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      });

      if (frameCount < 160) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [badge, soundEnabled]);

  if (!badge) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn select-none">
      {/* Background Canvas for Confetti */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-10" />

      {/* Modal Dialog Card */}
      <div className="relative z-20 w-full max-w-md bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 border-2 border-amber-500/50 rounded-3xl p-6 md:p-8 text-center shadow-[0_0_50px_rgba(245,158,11,0.3)] transform transition-all animate-scaleUp">
        {/* Close Icon Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/80 hover:bg-slate-700 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Tag */}
        <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-black tracking-wider uppercase mb-5 shadow-inner">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          YENİ ROZET AÇILDI!
        </div>

        {/* 3D Shield Hero with Aura Glow */}
        <div className="relative my-4 flex items-center justify-center">
          <div className="absolute w-40 h-40 rounded-full bg-amber-500/20 blur-2xl -z-10 animate-pulse" />
          <BadgeShield
            iconType={badge.iconType}
            tier={badge.tier}
            isUnlocked={true}
            size="xl"
            animate={false}
          />
        </div>

        {/* Badge Title & Tier */}
        <h2 className="text-2xl md:text-3xl font-extrabold text-white mt-4 tracking-tight drop-shadow-md">
          {badge.name}
        </h2>
        <div className="flex items-center justify-center gap-2 mt-2">
          <span className="px-2.5 py-0.5 rounded-md bg-slate-800/90 border border-slate-700 text-xs font-semibold text-slate-300 flex items-center gap-1">
            <Award className="w-3 h-3 text-amber-400" />
            {badge.tier.toUpperCase()} KADEMESİ
          </span>
          <span className="px-2.5 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/40 text-xs font-bold text-amber-300 flex items-center gap-1">
            <Trophy className="w-3 h-3" />
            +{badge.xpReward} XP
          </span>
        </div>

        {/* Description */}
        <p className="text-sm text-slate-300 mt-4 leading-relaxed bg-slate-800/50 p-3.5 rounded-xl border border-slate-700/60">
          {badge.description}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 mt-6">
          {onOpenShowcase && (
            <button
              onClick={() => {
                onClose();
                onOpenShowcase();
              }}
              className="w-full sm:w-1/2 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold border border-slate-600 transition flex items-center justify-center gap-2 shadow-sm"
            >
              <Trophy className="w-4 h-4 text-amber-400" />
              Rozetlerim
            </button>
          )}
          <button
            onClick={onClose}
            className={`w-full ${
              onOpenShowcase ? 'sm:w-1/2' : 'w-full'
            } py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-sm tracking-wide transition shadow-lg shadow-orange-500/30 flex items-center justify-center gap-2`}
          >
            Harika, Devam Et!
          </button>
        </div>
      </div>
    </div>
  );
};
