import React, { useEffect } from 'react';
import { MotivationToastItem } from '../../types';
import { playMotivationToastSound } from '../../utils/soundUtils';
import { X, Sparkles, Trophy, Flame, Target, BookOpen, Clock } from 'lucide-react';

interface MotivationToastProps {
  item: MotivationToastItem | null;
  soundEnabled?: boolean;
  onClose: () => void;
}

const VARIANT_STYLES = {
  emerald: {
    bg: 'from-emerald-950/95 via-slate-900/95 to-slate-950/95',
    border: 'border-emerald-500/50',
    glow: 'shadow-emerald-500/20',
    iconBg: 'bg-emerald-500/20 text-emerald-400',
    title: 'text-emerald-400',
    progress: 'bg-emerald-500'
  },
  gold: {
    bg: 'from-amber-950/95 via-slate-900/95 to-slate-950/95',
    border: 'border-amber-500/50',
    glow: 'shadow-amber-500/25',
    iconBg: 'bg-amber-500/20 text-amber-400',
    title: 'text-amber-400',
    progress: 'bg-amber-500'
  },
  cyan: {
    bg: 'from-cyan-950/95 via-slate-900/95 to-slate-950/95',
    border: 'border-cyan-500/50',
    glow: 'shadow-cyan-500/20',
    iconBg: 'bg-cyan-500/20 text-cyan-400',
    title: 'text-cyan-400',
    progress: 'bg-cyan-500'
  },
  purple: {
    bg: 'from-purple-950/95 via-slate-900/95 to-slate-950/95',
    border: 'border-purple-500/50',
    glow: 'shadow-purple-500/20',
    iconBg: 'bg-purple-500/20 text-purple-400',
    title: 'text-purple-400',
    progress: 'bg-purple-500'
  },
  amber: {
    bg: 'from-orange-950/95 via-slate-900/95 to-slate-950/95',
    border: 'border-orange-500/50',
    glow: 'shadow-orange-500/25',
    iconBg: 'bg-orange-500/20 text-orange-400',
    title: 'text-orange-400',
    progress: 'bg-orange-500'
  },
  rose: {
    bg: 'from-rose-950/95 via-slate-900/95 to-slate-950/95',
    border: 'border-rose-500/50',
    glow: 'shadow-rose-500/20',
    iconBg: 'bg-rose-500/20 text-rose-400',
    title: 'text-rose-400',
    progress: 'bg-rose-500'
  }
};

export const MotivationToast: React.FC<MotivationToastProps> = ({
  item,
  soundEnabled = true,
  onClose
}) => {
  useEffect(() => {
    if (!item) return;

    // Play subtle cheerful chime
    playMotivationToastSound(soundEnabled);

    // Auto dismiss after 5.5 seconds
    const timer = setTimeout(() => {
      onClose();
    }, 5500);

    return () => clearTimeout(timer);
  }, [item, soundEnabled, onClose]);

  if (!item) return null;

  const style = VARIANT_STYLES[item.variant || 'emerald'] || VARIANT_STYLES.emerald;

  const renderIcon = () => {
    switch (item.type) {
      case 'streak':
        return <Flame className="w-5 h-5" />;
      case 'mock':
        return <Target className="w-5 h-5" />;
      case 'topic':
        return <BookOpen className="w-5 h-5" />;
      case 'plan':
        return <Trophy className="w-5 h-5" />;
      case 'question':
        return <Sparkles className="w-5 h-5" />;
      case 'routine':
        return <Clock className="w-5 h-5" />;
      default:
        return <Sparkles className="w-5 h-5" />;
    }
  };

  return (
    <div className="fixed bottom-20 sm:bottom-6 right-3 sm:right-6 left-3 sm:left-auto z-[9990] max-w-sm w-auto sm:w-full animate-slideInRight select-none">
      <div
        className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${style.bg} border-2 ${style.border} p-4 shadow-2xl ${style.glow} backdrop-blur-xl transition-all duration-300`}
      >
        {/* Top Progress Line Animation */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-slate-800">
          <div className={`h-full ${style.progress} animate-shrinkWidth`} />
        </div>

        <div className="flex items-start gap-3.5 mt-0.5">
          {/* Icon Orb */}
          <div className={`p-2.5 rounded-xl ${style.iconBg} shrink-0 shadow-inner flex items-center justify-center`}>
            {renderIcon()}
          </div>

          {/* Message Content */}
          <div className="flex-1 min-w-0 pr-4">
            <h4 className={`text-sm font-bold ${style.title} flex items-center gap-1.5 leading-tight`}>
              {item.title}
            </h4>
            <p className="text-xs text-slate-200 mt-1 leading-relaxed font-medium">
              {item.message}
            </p>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/60 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
