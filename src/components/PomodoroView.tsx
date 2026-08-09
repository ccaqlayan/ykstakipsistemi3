import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Clock, 
  CheckCircle2, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  Flame, 
  Award, 
  BookOpen, 
  Coffee, 
  Target,
  ChevronRight,
  Zap,
  Check,
  SlidersHorizontal,
  History,
  Settings,
  Trash2,
  Calendar,
  BarChart2,
  Sun,
  Maximize,
  Minimize
} from 'lucide-react';
import { StudyPlanItem, RoutineItem, DayOfWeek } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface PomodoroViewProps {
  studyPlans: StudyPlanItem[];
  routines?: RoutineItem[];
  onUpdatePlan: (plan: StudyPlanItem) => void;
  onZenModeChange?: (isZen: boolean) => void;
}

type PomodoroMode = 'work' | 'short_break' | 'long_break';

export interface PomodoroHistoryEntry {
  id: string;
  timestamp: number;
  durationSeconds: number;
  mode: string;
  planId?: string;
  planTitle?: string;
}

export const PomodoroView: React.FC<PomodoroViewProps> = ({
  studyPlans,
  routines = [],
  onUpdatePlan,
  onZenModeChange
}) => {
  const [activeMainTab, setActiveMainTab] = useState<'timer' | 'settings' | 'history'>('timer');
  const [historyPage, setHistoryPage] = useState<number>(1);
  const [history, setHistory] = useState<PomodoroHistoryEntry[]>(() => {
    const saved = localStorage.getItem('yks_pomodoro_history');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return []; }
    }
    return [];
  });

  // Timer settings (in seconds)
  const [workDuration, setWorkDuration] = useState<number>(25 * 60);
  const [shortBreakDuration, setShortBreakDuration] = useState<number>(5 * 60);
  const [longBreakDuration, setLongBreakDuration] = useState<number>(15 * 60);

  const [timerMode, setTimerMode] = useState<PomodoroMode>('work');
  const [secondsLeft, setSecondsLeft] = useState<number>(25 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('yks_pomodoro_sound_enabled');
    return saved !== 'false';
  });
  const [wakeLockEnabled, setWakeLockEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('yks_pomodoro_wake_lock_enabled');
    return saved !== 'false';
  });
  const [ambientSound, setAmbientSound] = useState<'none' | 'focus_pink' | 'focus_white' | 'rain' | 'youtube'>(() => {
    const saved = localStorage.getItem('yks_pomodoro_ambient_sound');
    return (saved as any) || 'none';
  });

  // Ringtone Settings
  const [ringtoneType, setRingtoneType] = useState<'melody' | 'bell' | 'digital' | 'buzzer' | 'retro'>(() => {
    const saved = localStorage.getItem('yks_pomodoro_ringtone_type');
    return (saved as any) || 'melody';
  });
  const [ringtoneVolume, setRingtoneVolume] = useState<number>(() => {
    const saved = localStorage.getItem('yks_pomodoro_ringtone_volume');
    return saved ? parseInt(saved, 10) : 80;
  });

  // YouTube Background Sound Settings
  const [youtubeUrl, setYoutubeUrl] = useState<string>(() => {
    const saved = localStorage.getItem('yks_pomodoro_youtube_url');
    return saved || 'https://www.youtube.com/watch?v=-ORVafHfB8Y';
  });
  const [youtubeVideoId, setYoutubeVideoId] = useState<string | null>(null);

  // Manual / Custom Time State
  const [showCustom, setShowCustom] = useState<boolean>(false);
  const [customWorkInput, setCustomWorkInput] = useState<number>(30);
  const [customBreakInput, setCustomBreakInput] = useState<number>(5);

  // Selected study task
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');

  // Daily stats
  const completedSessionsCount = history.filter(h => h.mode === 'work' && new Date(h.timestamp).toDateString() === new Date().toDateString()).length;

  const activePlan = studyPlans.find((p) => p.id === selectedPlanId);
  const activeRoutine = routines.find((r) => r.id === selectedPlanId);
  const activeTitle = activePlan ? `${activePlan.subject}: ${activePlan.topic}` : activeRoutine ? `Rutin: ${activeRoutine.title}` : undefined;

  // Refs to prevent interval teardown and capture latest state/callbacks
  const endTimeRef = useRef<number | null>(null);
  const activePlanRef = useRef(activePlan);
  activePlanRef.current = activePlan;
  
  const activeTitleRef = useRef(activeTitle);
  activeTitleRef.current = activeTitle;

  const selectedPlanIdRef = useRef(selectedPlanId);
  selectedPlanIdRef.current = selectedPlanId;

  const onUpdatePlanRef = useRef(onUpdatePlan);
  onUpdatePlanRef.current = onUpdatePlan;

  const timerModeRef = useRef(timerMode);
  timerModeRef.current = timerMode;

  const workDurationRef = useRef(workDuration);
  workDurationRef.current = workDuration;

  const shortBreakDurationRef = useRef(shortBreakDuration);
  shortBreakDurationRef.current = shortBreakDuration;

  const longBreakDurationRef = useRef(longBreakDuration);
  longBreakDurationRef.current = longBreakDuration;

  const completedSessionsCountRef = useRef(completedSessionsCount);
  completedSessionsCountRef.current = completedSessionsCount;

  const soundEnabledRef = useRef(soundEnabled);
  soundEnabledRef.current = soundEnabled;

  const wakeLockEnabledRef = useRef(wakeLockEnabled);
  wakeLockEnabledRef.current = wakeLockEnabled;

  const ringtoneTypeRef = useRef(ringtoneType);
  ringtoneTypeRef.current = ringtoneType;

  const ringtoneVolumeRef = useRef(ringtoneVolume);
  ringtoneVolumeRef.current = ringtoneVolume;

  const [zenMode, setZenMode] = useState<boolean>(false);

  useEffect(() => {
    if (onZenModeChange) {
      onZenModeChange(zenMode);
    }
  }, [zenMode, onZenModeChange]);

  // Audio Context Web Audio Synthesizer for Beep & Ambient Noise
  const audioCtxRef = useRef<AudioContext | null>(null);
  const noiseNodeRef = useRef<AudioNode | null>(null);

  // Extract YouTube ID on startup or when YouTube url/ambient changes
  const extractYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  useEffect(() => {
    const id = extractYouTubeId(youtubeUrl);
    setYoutubeVideoId(id);
  }, [youtubeUrl]);

  // Persist toggles & inputs
  useEffect(() => {
    localStorage.setItem('yks_pomodoro_sound_enabled', String(soundEnabled));
  }, [soundEnabled]);

  useEffect(() => {
    localStorage.setItem('yks_pomodoro_wake_lock_enabled', String(wakeLockEnabled));
  }, [wakeLockEnabled]);

  useEffect(() => {
    localStorage.setItem('yks_pomodoro_ambient_sound', ambientSound);
  }, [ambientSound]);

  useEffect(() => {
    localStorage.setItem('yks_pomodoro_ringtone_type', ringtoneType);
  }, [ringtoneType]);

  useEffect(() => {
    localStorage.setItem('yks_pomodoro_ringtone_volume', String(ringtoneVolume));
  }, [ringtoneVolume]);

  useEffect(() => {
    localStorage.setItem('yks_pomodoro_youtube_url', youtubeUrl);
  }, [youtubeUrl]);

  // Toggle synthesized ambient noise generator
  const toggleAmbientSound = (type: 'none' | 'focus_pink' | 'focus_white' | 'rain' | 'youtube') => {
    setAmbientSound(type);
    
    // Stop existing noise
    if (noiseNodeRef.current) {
      try {
        (noiseNodeRef.current as any).stop?.();
        noiseNodeRef.current.disconnect();
      } catch (e) {}
      noiseNodeRef.current = null;
    }

    if (type === 'none' || type === 'youtube') return;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;

      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);

      if (type === 'focus_pink') {
        // Pink / Soft Noise formula (warm/deep focus)
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          b3 = 0.86650 * b3 + white * 0.3104856;
          b4 = 0.55000 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.0168980;
          output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.02;
          b6 = white * 0.115926;
        }
      } else if (type === 'focus_white') {
        // Crisp White Noise
        for (let i = 0; i < bufferSize; i++) {
          output[i] = (Math.random() * 2 - 1) * 0.015;
        }
      } else if (type === 'rain') {
        // Soft rain simulation filtered brownian noise
        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          output[i] = (lastOut + (0.02 * white)) / 1.02;
          lastOut = output[i];
          output[i] *= 0.15; // lower gain
        }
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = buffer;
      whiteNoise.loop = true;
      whiteNoise.connect(ctx.destination);
      whiteNoise.start();
      noiseNodeRef.current = whiteNoise as any;
    } catch (e) {
      console.log('Ambient sound error', e);
    }
  };

  const playChime = () => {
    if (!soundEnabledRef.current) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      const vol = (ringtoneVolumeRef.current || 80) / 100; // volume multiplier
      const selectedRingtone = ringtoneTypeRef.current || 'melody';

      if (selectedRingtone === 'melody') {
        // Play 3 pleasant melody notes (C5, E5, G5)
        const notes = [523.25, 659.25, 783.99];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.15);
          gain.gain.setValueAtTime(0.25 * vol, ctx.currentTime + idx * 0.15); // boosted base gain
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.15 + 0.4);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + idx * 0.15);
          osc.stop(ctx.currentTime + idx * 0.15 + 0.5);
        });
      } else if (selectedRingtone === 'bell') {
        // High-pitched crystal clear bell strike
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 1.2);
        gain.gain.setValueAtTime(0.5 * vol, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 1.6);
      } else if (selectedRingtone === 'digital') {
        // Triple high-pitched digital beeps (like digital clock)
        const notes = [1200, 1200, 1200];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.2);
          gain.gain.setValueAtTime(0.15 * vol, ctx.currentTime + idx * 0.2);
          gain.gain.setValueAtTime(0.001, ctx.currentTime + idx * 0.2 + 0.12);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + idx * 0.2);
          osc.stop(ctx.currentTime + idx * 0.2 + 0.15);
        });
      } else if (selectedRingtone === 'buzzer') {
        // Alarm clock buzzer sound
        [0, 0.4].forEach((delay) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(150, ctx.currentTime + delay);
          gain.gain.setValueAtTime(0.3 * vol, ctx.currentTime + delay);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.25);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + delay);
          osc.stop(ctx.currentTime + delay + 0.3);
        });
      } else if (selectedRingtone === 'retro') {
        // Retro coin / Level up chime
        const frequencies = [587.33, 880];
        frequencies.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);
          gain.gain.setValueAtTime(0.35 * vol, ctx.currentTime + idx * 0.12);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.12 + 0.25);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + idx * 0.12);
          osc.stop(ctx.currentTime + idx * 0.12 + 0.3);
        });
      }
    } catch (e) {
      console.log('Audio error:', e);
    }
  };

  // Session completion handler
  const handleSessionComplete = (): number => {
    playChime();

    const currentMode = timerModeRef.current;
    const currentCompletedCount = completedSessionsCountRef.current;
    const currentWorkDur = workDurationRef.current;
    const currentShortDur = shortBreakDurationRef.current;
    const currentLongDur = longBreakDurationRef.current;
    const currentPlan = activePlanRef.current;
    const currentTitle = activeTitleRef.current;
    const currentPlanId = selectedPlanIdRef.current;

    let nextSeconds = currentWorkDur;

    if (currentMode === 'work') {
      const newCount = currentCompletedCount + 1;

      const newHistoryEntry: PomodoroHistoryEntry = {
        id: `pomodoro-${Date.now()}`,
        timestamp: Date.now(),
        durationSeconds: currentWorkDur,
        mode: 'work',
        planId: currentPlanId,
        planTitle: currentTitle
      };
      setHistory(prev => {
        const next = [newHistoryEntry, ...prev];
        localStorage.setItem('yks_pomodoro_history', JSON.stringify(next));
        return next;
      });

      if (currentPlan) {
        const addedMins = Math.round(currentWorkDur / 60);
        const newCompletedMins = currentPlan.completedMinutes + addedMins;
        onUpdatePlanRef.current({
          ...currentPlan,
          completedMinutes: newCompletedMins,
          status: newCompletedMins >= currentPlan.plannedMinutes ? 'completed' : 'in_progress'
        });
      }

      if (newCount % 4 === 0) {
        setTimerMode('long_break');
        nextSeconds = currentLongDur;
        setSecondsLeft(currentLongDur);
      } else {
        setTimerMode('short_break');
        nextSeconds = currentShortDur;
        setSecondsLeft(currentShortDur);
      }
    } else {
      setTimerMode('work');
      nextSeconds = currentWorkDur;
      setSecondsLeft(currentWorkDur);
    }

    return nextSeconds;
  };

  // Wake lock ref to prevent screen from sleeping on mobile
  const wakeLockRef = useRef<any>(null);

  // Accurate Real-Time Timer Engine using Date.now() delta
  useEffect(() => {
    if (!isRunning) {
      endTimeRef.current = null;
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(console.error);
        wakeLockRef.current = null;
      }
      return;
    }

    // Request wake lock when timer starts
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        }
      } catch (err) {
        console.log('Wake Lock request failed:', err);
      }
    };
    
    if (!wakeLockRef.current && wakeLockEnabledRef.current) {
      requestWakeLock();
    }

    if (!endTimeRef.current) {
      endTimeRef.current = Date.now() + secondsLeft * 1000;
    }

    const interval = setInterval(() => {
      if (!endTimeRef.current) return;
      const now = Date.now();
      const diffMs = endTimeRef.current - now;

      if (diffMs <= 0) {
        // Automatically transition to the next session & set new target endTime
        const nextSecs = handleSessionComplete();
        endTimeRef.current = Date.now() + nextSecs * 1000;
      } else {
        const remainingSecs = Math.ceil(diffMs / 1000);
        setSecondsLeft((prev) => {
          if (prev !== remainingSecs) {
            return remainingSecs;
          }
          return prev;
        });
      }
    }, 200);

    return () => clearInterval(interval);
  }, [isRunning]);

  // Update browser tab title with remaining time when running
  useEffect(() => {
    if (isRunning) {
      const m = Math.floor(secondsLeft / 60);
      const s = secondsLeft % 60;
      const formatted = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
      const modeText = timerMode === 'work' ? 'Ders' : 'Mola';
      document.title = `(${formatted}) ${modeText} - YKS Pomodoro`;
    } else {
      document.title = 'YKS Hazırlık Takip Sistemi';
    }
    return () => {
      document.title = 'YKS Hazırlık Takip Sistemi';
    };
  }, [isRunning, secondsLeft, timerMode]);

  // Mode Switcher Handler
  const handleSwitchMode = (mode: PomodoroMode) => {
    setIsRunning(false);
    setTimerMode(mode);
    if (mode === 'work') setSecondsLeft(workDuration);
    else if (mode === 'short_break') setSecondsLeft(shortBreakDuration);
    else setSecondsLeft(longBreakDuration);
  };

  // Quick Preset Setter
  const setPreset = (workMins: number, breakMins: number) => {
    setIsRunning(false);
    const wSecs = workMins * 60;
    const bSecs = breakMins * 60;
    const lSecs = (breakMins * 3) * 60; // Long break is typically 3x short break
    setWorkDuration(wSecs);
    setShortBreakDuration(bSecs);
    setLongBreakDuration(lSecs);
    setTimerMode('work');
    setSecondsLeft(wSecs);
  };

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Calculate ring progress percentage
  const currentTotalDuration = timerMode === 'work' ? workDuration : timerMode === 'short_break' ? shortBreakDuration : longBreakDuration;
  const progressPercent = currentTotalDuration > 0 ? ((currentTotalDuration - secondsLeft) / currentTotalDuration) * 100 : 0;

  const daysInTurkish: DayOfWeek[] = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
  const todayName = daysInTurkish[new Date().getDay()];

  // Unfinished plans for today
  const pendingPlans = studyPlans.filter((p) => p.status !== 'completed' && p.day === todayName);
  const pendingRoutines = routines.filter((r) => !r.completedDays.includes(todayName));

  return (
    <div className={zenMode ? 'fixed inset-0 z-50 bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 animate-in fade-in duration-300 overflow-hidden' : 'space-y-6 animate-in fade-in duration-200'}>
      
      {/* Top Banner */}
      {!zenMode && (
      <div className="bg-gradient-to-r from-indigo-900/60 via-slate-900/80 to-purple-900/60 border border-indigo-500/30 rounded-3xl p-6 md:p-8 backdrop-blur-xl relative overflow-hidden shadow-2xl">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col relative z-10 space-y-2">
          <div className="flex items-center space-x-2 text-indigo-400 font-bold text-xs uppercase tracking-widest">
            <Clock className="w-4 h-4 text-indigo-400" />
            <span>Odağını Artır & Zamanı Yönet</span>
          </div>
          
          <div className="flex flex-wrap md:flex-nowrap items-center justify-between gap-3 w-full">
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2 w-full md:w-auto">
              Pomodoro<span className="hidden md:inline"> & Odak Sayacı</span>
              
              {/* Mobile Only Badge & Sound */}
              <div className="md:hidden flex items-center ml-auto gap-2">
                <span className="text-[10px] font-bold px-2 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full flex items-center gap-1">
                  <Flame className="w-3 h-3 fill-amber-400 text-amber-400" />
                  {completedSessionsCount} Seans <Check className="w-3 h-3 ml-0.5" />
                </span>
                
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`p-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center ${
                    soundEnabled ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-900 text-slate-400'
                  }`}
                >
                  {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>
              </div>

              {/* Desktop Only Badge */}
              <span className="hidden md:flex text-xs font-bold px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full items-center gap-1">
                <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                {completedSessionsCount} Seans Tamamlandı
              </span>
            </h1>

            {/* Desktop Quick Sound Toggle */}
            <div className="hidden md:flex items-center space-x-2 bg-slate-950/60 p-1.5 rounded-2xl border border-slate-800 ml-auto">
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
                  soundEnabled ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
                title="Ses Efekti"
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                <span>{soundEnabled ? 'Zil Açık' : 'Sessiz'}</span>
              </button>
            </div>
          </div>

          <p className="hidden md:block text-slate-300 text-xs md:text-sm mt-1 max-w-2xl leading-relaxed">
            25 dakikalık yüksek odaklı çalışma periyotlarıyla YKS hazırlığında zihnini taze tut. Ders kartını seç, sayacı başlat ve molanı ver.
          </p>
        </div>
      </div>
      )}

      {/* Outer Tabs */}
      {!zenMode && (
      <div className="flex items-center p-1.5 bg-slate-950/80 border border-slate-800 rounded-2xl w-full max-w-xl mx-auto shadow-lg">
        <button
          onClick={() => setActiveMainTab('timer')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center space-x-2 ${
            activeMainTab === 'timer'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Sayaç</span>
        </button>
        <button
          onClick={() => setActiveMainTab('settings')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center space-x-2 ${
            activeMainTab === 'settings'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Ayarlar</span>
        </button>
        <button
          onClick={() => setActiveMainTab('history')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center space-x-2 ${
            activeMainTab === 'history'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Geçmiş</span>
        </button>
      </div>
      )}

      {/* Main Container */}
      <div className="w-full">
        
        {/* TIMER TAB */}
        {activeMainTab === 'timer' && (
          <div className={`grid grid-cols-1 ${zenMode ? 'w-full max-w-2xl mx-auto' : 'lg:grid-cols-3'} gap-6`}>
            <div className={`${zenMode ? 'bg-transparent border-none shadow-none' : 'lg:col-span-2 bg-slate-900/80 border border-slate-800 shadow-2xl'} rounded-3xl p-6 md:p-10 backdrop-blur-md flex flex-col items-center justify-center relative overflow-hidden text-center space-y-8 transition-all w-full`}>
          
          {/* Mode Tabs Switcher */}
          {!zenMode && (
          <div className="flex items-center p-1.5 bg-slate-950/80 border border-slate-800 rounded-2xl max-w-md w-full">
            <button
              onClick={() => handleSwitchMode('work')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
                timerMode === 'work'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Zap className="w-4 h-4 text-indigo-300" />
              <span>Ders Çalışma <span className="hidden md:inline">({Math.round(workDuration / 60)} Dk)</span></span>
            </button>
            <button
              onClick={() => handleSwitchMode('short_break')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
                timerMode === 'short_break'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Coffee className="w-4 h-4 text-emerald-300" />
              <span>Kısa Mola <span className="hidden md:inline">({Math.round(shortBreakDuration / 60)} Dk)</span></span>
            </button>
            <button
              onClick={() => handleSwitchMode('long_break')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
                timerMode === 'long_break'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-4 h-4 text-purple-300" />
              <span>Uzun Mola <span className="hidden md:inline">({Math.round(longBreakDuration / 60)} Dk)</span></span>
            </button>
          </div>
          )}

          {/* Task Link Selector */}
          {!zenMode && (
          <div className="w-full max-w-lg space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-center space-x-1.5">
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
              <span>Odaklanılacak Ders Görevi Seçimi:</span>
            </label>
            <select
              value={selectedPlanId}
              onChange={(e) => setSelectedPlanId(e.target.value)}
              className="w-full bg-slate-950 border-2 border-indigo-500/30 focus:border-indigo-400 text-white text-xs md:text-sm font-bold rounded-2xl px-4 py-3 outline-none transition-all shadow-inner text-center"
            >
              <option value="" className="text-slate-400">--- Görev Seçmeden Serbest Çalış ---</option>
              {pendingPlans.length > 0 && (
                <optgroup label={`Bugünün Ders Görevleri (${todayName})`} className="text-indigo-300 bg-slate-950">
                  {pendingPlans.map((plan) => (
                    <option key={plan.id} value={plan.id} className="text-white bg-slate-900 font-semibold">
                      {plan.subject}: {plan.topic} ({plan.completedMinutes}/{plan.plannedMinutes} dk)
                    </option>
                  ))}
                </optgroup>
              )}
              {pendingRoutines.length > 0 && (
                <optgroup label={`Bugünün Rutinleri (${todayName})`} className="text-amber-300 bg-slate-950">
                  {pendingRoutines.map((routine) => (
                    <option key={routine.id} value={routine.id} className="text-white bg-slate-900 font-semibold">
                      {routine.title}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>
          )}

          {/* CIRCULAR TIMER DISPLAY */}
          <div className="relative w-64 h-64 sm:w-80 sm:h-80 flex items-center justify-center my-4 group">
            
            {/* SVG Circular Progress Ring */}
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="44"
                className={`fill-none ${zenMode ? 'stroke-slate-800' : 'stroke-slate-950'}`}
                strokeWidth="6"
              />
              <circle
                cx="50"
                cy="50"
                r="44"
                className={`fill-none transition-all duration-1000 ${
                  timerMode === 'work' ? 'stroke-indigo-500' : timerMode === 'short_break' ? 'stroke-emerald-400' : 'stroke-purple-400'
                }`}
                strokeWidth="6"
                strokeDasharray="276.46"
                strokeDashoffset={276.46 - (276.46 * progressPercent) / 100}
                strokeLinecap="round"
              />
            </svg>

            {/* Inner Clock Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center space-y-2">
              <span className={`text-5xl sm:text-6xl font-black font-mono tracking-wider ${
                timerMode === 'work' ? 'text-white' : timerMode === 'short_break' ? 'text-emerald-300' : 'text-purple-300'
              }`}>
                {formatTime(secondsLeft)}
              </span>
              
              <div className="flex items-center space-x-2">
                <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                  timerMode === 'work' 
                    ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' 
                    : timerMode === 'short_break'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                }`}>
                  {timerMode === 'work' ? '🔥 YKS DERS SEANSI' : timerMode === 'short_break' ? '☕ DİNLENME MOLASI' : '🌟 UZUN DİNLENME'}
                </span>
              </div>

              {activePlan && (
                <div className="text-xs font-bold text-amber-300 truncate max-w-[200px] px-2 bg-slate-950/80 py-1 rounded-lg border border-amber-500/30 mt-1">
                  {activePlan.subject}: {activePlan.topic}
                </div>
              )}
            </div>

          </div>

          {/* CONTROL BUTTONS */}
          <div className="flex flex-row items-center justify-between w-full pt-2">
            <div className="flex justify-start flex-none">
              <button
                onClick={() => setZenMode(!zenMode)}
                className={`p-4 bg-slate-950 hover:bg-slate-800 text-slate-300 rounded-2xl border border-slate-800 transition-all hover:text-amber-400 ${zenMode ? 'text-amber-400 border-amber-500/30' : ''}`}
                title={zenMode ? "Tam ekrandan çık" : "Tam ekran sayaç"}
              >
                {zenMode ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
              </button>
            </div>

            <div className="flex items-center justify-center space-x-2 sm:space-x-4 flex-1 ml-4 mr-10 sm:mr-0 sm:ml-0">
              <button
                onClick={() => setIsRunning(!isRunning)}
                className={`px-6 sm:px-8 py-4 rounded-2xl text-sm sm:text-base font-black transition-all shadow-xl flex items-center justify-center space-x-2 sm:space-x-3 transform active:scale-95 flex-1 max-w-[200px] ${
                  isRunning
                    ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30'
                    : timerMode === 'work'
                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/40'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/40'
                }`}
              >
                {isRunning ? (
                  <>
                    <Pause className="w-5 h-5 sm:w-6 sm:h-6 fill-white" />
                    <span>DURAKLAT</span>
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-white ml-1" />
                    <span>BAŞLAT</span>
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  setIsRunning(false);
                  if (timerMode === 'work') setSecondsLeft(workDuration);
                  else if (timerMode === 'short_break') setSecondsLeft(shortBreakDuration);
                  else setSecondsLeft(longBreakDuration);
                }}
                className="p-4 bg-slate-950 hover:bg-slate-800 text-slate-300 rounded-2xl border border-slate-800 transition-all hover:text-white flex-none"
                title="Yeniden Başlat"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>
            
            <div className="hidden sm:block flex-none w-[56px]"></div> {/* Spacer for balancing on desktop */}
          </div>

          {/* Quick Presets Bar */}
          {!zenMode && (
          <div className="w-full space-y-3 pt-4 border-t border-slate-800/80">
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="text-xs text-slate-400 font-bold mr-1">Hızlı Zaman Modları:</span>
              <button
                onClick={() => { setPreset(25, 5); setShowCustom(false); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                  workDuration === 25 * 60 && shortBreakDuration === 5 * 60 && !showCustom
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/20'
                    : 'bg-slate-950 hover:bg-indigo-950 text-indigo-300 border-indigo-500/30'
                }`}
              >
                25 Dk Çalış / 5 Dk Mola
              </button>
              <button
                onClick={() => { setPreset(45, 10); setShowCustom(false); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                  workDuration === 45 * 60 && shortBreakDuration === 10 * 60 && !showCustom
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/20'
                    : 'bg-slate-950 hover:bg-indigo-950 text-indigo-300 border-indigo-500/30'
                }`}
              >
                45 Dk Çalış / 10 Dk Mola
              </button>
              <button
                onClick={() => { setPreset(50, 10); setShowCustom(false); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                  workDuration === 50 * 60 && shortBreakDuration === 10 * 60 && !showCustom
                    ? 'bg-purple-600 border-purple-500 text-white shadow-md shadow-purple-600/20'
                    : 'bg-slate-950 hover:bg-purple-950 text-purple-300 border-purple-500/30'
                }`}
              >
                50 Dk Blok Ders
              </button>
              <button
                onClick={() => setShowCustom(!showCustom)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center space-x-1.5 ${
                  showCustom
                    ? 'bg-amber-600 border-amber-500 text-white shadow-md shadow-amber-600/20'
                    : 'bg-slate-950 hover:bg-amber-950 text-amber-300 border-amber-500/30'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Diğer (Manuel Süre)</span>
              </button>
            </div>

            {/* Custom Manual Input Panel */}
            {showCustom && (
              <div className="bg-slate-950/90 border border-amber-500/40 rounded-2xl p-4 max-w-md mx-auto space-y-3 animate-in fade-in duration-150">
                <div className="text-xs font-bold text-amber-300 flex items-center justify-between">
                  <span className="flex items-center space-x-1.5">
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span>Özel Çalışma & Mola Süresi Belirle</span>
                  </span>
                  <span className="text-[10px] text-slate-400">Dakika cinsinden girin</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-left">
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Çalışma Süresi (Dk)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="240"
                      value={customWorkInput}
                      onChange={(e) => setCustomWorkInput(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full bg-slate-900 border border-slate-700 focus:border-amber-400 text-white font-bold text-sm rounded-xl px-3 py-2 outline-none text-center"
                    />
                  </div>
                  <div className="text-left">
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Mola Süresi (Dk)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="120"
                      value={customBreakInput}
                      onChange={(e) => setCustomBreakInput(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full bg-slate-900 border border-slate-700 focus:border-amber-400 text-white font-bold text-sm rounded-xl px-3 py-2 outline-none text-center"
                    />
                  </div>
                </div>
                <button
                  onClick={() => setPreset(customWorkInput, customBreakInput)}
                  className="w-full py-2.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center space-x-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Süreleri Kaydet ve Uygula ({customWorkInput} Dk Çalış / {customBreakInput} Dk Mola)</span>
                </button>
              </div>
            )}
          </div>
          )}

        </div>

        {/* Right 1 Col: Just Today's Stats for Timer Tab */}
        {!zenMode && (
        <div className="space-y-6">
          {/* Today's Pomodoro Stats Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 backdrop-blur-md shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-white flex items-center space-x-2">
                <Target className="w-4 h-4 text-amber-400" />
                <span>Bugünün Pomodoro Hedefi</span>
              </h3>
              <span className="text-xs font-extrabold text-amber-300 font-mono">
                {completedSessionsCount * 25} Dk Odak
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => {
                const isDone = completedSessionsCount >= num;
                return (
                  <div
                    key={num}
                    className={`p-3 rounded-2xl border text-center transition-all ${
                      isDone
                        ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-md shadow-amber-500/10'
                        : 'bg-slate-950 border-slate-800 text-slate-600'
                    }`}
                  >
                    <div className="text-xs font-mono font-bold"># {num}</div>
                    <div className="text-[10px] mt-0.5">
                      {isDone ? '🍅 Tamam' : 'Bekliyor'}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 text-xs text-slate-300 leading-relaxed italic">
              "Başarı, her gün tekrarlanan küçük disiplinli adımların toplamıdır."
            </div>

            {/* Today's Session History */}
            {history.filter(h => new Date(h.timestamp).toDateString() === new Date().toDateString()).length > 0 && (
              <div className="pt-4 mt-4 border-t border-slate-800/50 space-y-2">
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Bugünkü Seansların</h4>
                {history.filter(h => new Date(h.timestamp).toDateString() === new Date().toDateString()).map(entry => (
                  <div key={entry.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/50 border border-slate-800/50">
                    <div className="flex items-center space-x-2">
                      <div className={`w-6 h-6 rounded-md flex items-center justify-center ${entry.mode === 'work' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                        {entry.mode === 'work' ? <Zap className="w-3 h-3" /> : <Coffee className="w-3 h-3" />}
                      </div>
                      <div>
                        <div className="text-[11px] font-bold text-slate-200">
                          {entry.mode === 'work' ? 'Odak' : 'Mola'} • {Math.round(entry.durationSeconds / 60)} Dk
                        </div>
                        {entry.planTitle && (
                          <div className="text-[9px] text-slate-500 truncate max-w-[140px] sm:max-w-[200px]">
                            {entry.planTitle}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {new Date(entry.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pomodoro Technique Info Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 backdrop-blur-md shadow-xl space-y-4">
            <h3 className="text-sm font-black text-white flex items-center space-x-2">
              <BookOpen className="w-4 h-4 text-indigo-400" />
              <span>Pomodoro Tekniği Nedir?</span>
            </h3>
            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <p>
                Pomodoro tekniği, odaklanmayı artırmak ve zihinsel yorgunluğu azaltmak için kullanılan bir zaman yönetimi yöntemidir.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0" />
                  <span><strong>1. Seans (25 Dk):</strong> Hiçbir şeye dikkatini dağıtmadan sadece göreve odaklan.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                  <span><strong>2. Kısa Mola (5 Dk):</strong> Masadan kalk, su iç, gerin. Ekrana bakma.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                  <span><strong>3. Tekrarla:</strong> Toplam 4 çalışma seansını (4 Pomodoro) tamamla.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 flex-shrink-0" />
                  <span><strong>4. Uzun Mola (15-30 Dk):</strong> 4 seans bittikten sonra zihnini tamamen dinlendirmek için uzun mola ver.</span>
                </li>
              </ul>
              <div className="p-3 mt-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-300">
                💡 <strong>İpucu:</strong> Kendini hazır hissediyorsan süreleri "50 Dk Odak / 10 Dk Mola" şeklinde de ayarlayabilirsin.
              </div>
            </div>
          </div>
        </div>
        )}
        </div>
        )}

        {/* SETTINGS TAB */}
        {activeMainTab === 'settings' && (
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Pomodoro Sound & Volume Settings Card */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 backdrop-blur-md shadow-xl space-y-4">
              <h3 className="text-sm font-black text-white flex items-center space-x-2">
                <Volume2 className="w-4 h-4 text-indigo-400" />
                <span>Pomodoro Zil & Şiddet Ayarları</span>
              </h3>
              
              <div className="space-y-3">
                {/* Ringtone Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wide">
                    Zil Sesi Seçeneği
                  </label>
                  <select
                    value={ringtoneType}
                    onChange={(e) => setRingtoneType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500/80 text-white text-xs font-bold rounded-xl px-3 py-2.5 outline-none transition-all"
                  >
                    <option value="melody">Modern Melodi (C5-E5-G5)</option>
                    <option value="bell">Doğal Çan / Ding</option>
                    <option value="digital">Dijital Kol Saati</option>
                  <option value="buzzer">Klasik Buzzer / Vızıldak</option>
                  <option value="retro">Retro Atari Level-Up</option>
                </select>
              </div>

              {/* Volume Slider & Play Preview Button */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide">
                    Zil Ses Şiddeti (%{ringtoneVolume})
                  </label>
                  <button
                    onClick={playChime}
                    className="text-[10px] px-2.5 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 font-black rounded-lg border border-indigo-500/20 transition-all flex items-center space-x-1"
                    title="Seçilen zili test et"
                  >
                    <span>🔊 Dinle / Dene</span>
                  </button>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="5"
                  value={ringtoneVolume}
                  onChange={(e) => setRingtoneVolume(parseInt(e.target.value, 10))}
                  className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-950 rounded-lg appearance-none"
                />
              </div>

              {/* Screen Wake Lock */}
              <div className="pt-3 border-t border-slate-800/80">
                <div className="flex items-center justify-between">
                  <div className="pr-4">
                    <label className="text-sm font-bold text-white mb-0.5 flex items-center space-x-2 cursor-pointer" onClick={() => setWakeLockEnabled(!wakeLockEnabled)}>
                      <Sun className="w-4 h-4 text-amber-400" />
                      <span>Ekran Uyanıklık Kilidi</span>
                    </label>
                    <p className="text-[10px] text-slate-400 mt-1 leading-tight">
                      Pomodoro sayacı çalışırken mobil cihazınızın ekranının kararmasını ve kapanmasını engeller. (Sadece desteklenen tarayıcılarda çalışır)
                    </p>
                  </div>
                  <button
                    onClick={() => setWakeLockEnabled(!wakeLockEnabled)}
                    className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${
                      wakeLockEnabled ? 'bg-indigo-600' : 'bg-slate-700'
                    }`}
                  >
                    <div
                      className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${
                        wakeLockEnabled ? 'transform translate-x-6' : ''
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Ambient Sound Synthesizer Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 backdrop-blur-md shadow-xl space-y-4">
            <h3 className="text-sm font-black text-white flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>Odak Odası Arka Plan Sesleri</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Dış gürültüyü engellemek ve odaklanmanı zirveye taşımak için sentezlenmiş rahatlatıcı sesleri veya sevdiğin YouTube odak videolarını aç.
            </p>

            <div className="space-y-2">
              <button
                onClick={() => toggleAmbientSound('none')}
                className={`w-full p-3 rounded-2xl border text-xs font-bold flex items-center justify-between transition-all ${
                  ambientSound === 'none'
                    ? 'bg-slate-950 border-indigo-500/50 text-white'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <span>Kapalı (Sessiz Ortam)</span>
                {ambientSound === 'none' && <Check className="w-4 h-4 text-indigo-400" />}
              </button>

              <button
                onClick={() => toggleAmbientSound('focus_white')}
                className={`w-full p-3 rounded-2xl border text-xs font-bold flex items-center justify-between transition-all ${
                  ambientSound === 'focus_white'
                    ? 'bg-indigo-950/60 border-indigo-500 text-indigo-300'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Zap className="w-4 h-4 text-indigo-400" />
                  <span>Sentezlenmiş Beyaz Gürültü (White Noise)</span>
                </div>
                {ambientSound === 'focus_white' && <Check className="w-4 h-4 text-indigo-400" />}
              </button>

              <button
                onClick={() => toggleAmbientSound('focus_pink')}
                className={`w-full p-3 rounded-2xl border text-xs font-bold flex items-center justify-between transition-all ${
                  ambientSound === 'focus_pink'
                    ? 'bg-indigo-950/40 border-indigo-500/60 text-indigo-300'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-teal-400" />
                  <span>Derin Odak Sesi (Pembe Gürültü)</span>
                </div>
                {ambientSound === 'focus_pink' && <Check className="w-4 h-4 text-teal-400" />}
              </button>

              <button
                onClick={() => toggleAmbientSound('rain')}
                className={`w-full p-3 rounded-2xl border text-xs font-bold flex items-center justify-between transition-all ${
                  ambientSound === 'rain'
                    ? 'bg-purple-950/60 border-purple-500 text-purple-300'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Coffee className="w-4 h-4 text-purple-400" />
                  <span>Yumuşak Yağmur Sesi Simülatörü</span>
                </div>
                {ambientSound === 'rain' && <Check className="w-4 h-4 text-purple-400" />}
              </button>

              <button
                onClick={() => toggleAmbientSound('youtube')}
                className={`w-full p-3 rounded-2xl border text-xs font-bold flex items-center justify-between transition-all ${
                  ambientSound === 'youtube'
                    ? 'bg-amber-950/50 border-amber-500 text-amber-300'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span>YouTube Arka Plan Ses Döngüsü</span>
                </div>
                {ambientSound === 'youtube' && <Check className="w-4 h-4 text-amber-400" />}
              </button>
            </div>

            {/* YouTube Player Panel */}
            {ambientSound === 'youtube' && (
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3 animate-in fade-in duration-200">
                <div className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>Döngülenecek YouTube Video Linki</span>
                  {youtubeVideoId && <span className="text-[10px] text-emerald-400">● Oynatılıyor</span>}
                </div>

                <div className="space-y-2">
                  <input
                    type="text"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 text-white font-mono text-[11px] rounded-xl px-3 py-2 outline-none"
                  />
                  <p className="text-[10px] text-slate-500 leading-relaxed italic">
                    İstediğin herhangi bir kütüphane, yağmur veya beyaz gürültü odak videosunun linkini yapıştırabilirsin.
                  </p>
                </div>

                {/* Built-in high quality presets */}
                <div className="space-y-1.5 pt-1.5 border-t border-slate-900">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Önerilen Döngü Hazır Sesleri</span>
                  <div className="grid grid-cols-1 gap-1.5">
                    <button
                      onClick={() => setYoutubeUrl('https://www.youtube.com/watch?v=-ORVafHfB8Y')}
                      className={`text-left text-[11px] p-1.5 rounded-lg border transition-all ${
                        youtubeUrl.includes('-ORVafHfB8Y')
                          ? 'bg-indigo-950/40 border-indigo-500/50 text-indigo-300 font-bold'
                          : 'bg-slate-900 border-slate-800 hover:text-white text-slate-400'
                      }`}
                    >
                      🔊 10 Saat Kesintisiz Beyaz Gürültü (White Noise)
                    </button>
                    <button
                      onClick={() => setYoutubeUrl('https://www.youtube.com/watch?v=hBGb0-68M8M')}
                      className={`text-left text-[11px] p-1.5 rounded-lg border transition-all ${
                        youtubeUrl.includes('hBGb0-68M8M')
                          ? 'bg-indigo-950/40 border-indigo-500/50 text-indigo-300 font-bold'
                          : 'bg-slate-900 border-slate-800 hover:text-white text-slate-400'
                      }`}
                    >
                      📖 Kütüphane Ambiyansı (Odak & Ders Çalışma)
                    </button>
                    <button
                      onClick={() => setYoutubeUrl('https://www.youtube.com/watch?v=c0_ejQQcrwI')}
                      className={`text-left text-[11px] p-1.5 rounded-lg border transition-all ${
                        youtubeUrl.includes('c0_ejQQcrwI')
                          ? 'bg-indigo-950/40 border-indigo-500/50 text-indigo-300 font-bold'
                          : 'bg-slate-900 border-slate-800 hover:text-white text-slate-400'
                      }`}
                    >
                      ☕ Yağmurlu Kafe & Kahve Dükkanı Ambiyansı
                    </button>
                  </div>
                </div>

                {/* Hidden YouTube Loop Iframe Player */}
                {youtubeVideoId && (
                  <div className="hidden" style={{ width: 0, height: 0, pointerEvents: 'none' }}>
                    <iframe
                      width="1"
                      height="1"
                      src={`https://www.youtube.com/embed/${youtubeVideoId}?autoplay=1&loop=1&playlist=${youtubeVideoId}&controls=0`}
                      title="YouTube Ambient Loop Audio"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        )}

        {/* HISTORY TAB */}
        {activeMainTab === 'history' && (
          <div className="max-w-4xl mx-auto space-y-6">
            
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 backdrop-blur-md shadow-xl flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-400 mb-1">Bugün</div>
                  <div className="text-xl font-black text-white">
                    {Math.round(history.filter(h => new Date(h.timestamp).toDateString() === new Date().toDateString()).reduce((acc, curr) => acc + curr.durationSeconds, 0) / 60)} Dk
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <Flame className="w-5 h-5" />
                </div>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 backdrop-blur-md shadow-xl flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-400 mb-1">Bu Hafta</div>
                  <div className="text-xl font-black text-white">
                    {Math.round(history.filter(h => {
                      const d = new Date(h.timestamp);
                      const now = new Date();
                      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                      return d >= weekAgo;
                    }).reduce((acc, curr) => acc + curr.durationSeconds, 0) / 60)} Dk
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Award className="w-5 h-5" />
                </div>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 backdrop-blur-md shadow-xl flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-400 mb-1">Bu Ay</div>
                  <div className="text-xl font-black text-white">
                    {Math.round(history.filter(h => {
                      const d = new Date(h.timestamp);
                      const now = new Date();
                      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                    }).reduce((acc, curr) => acc + curr.durationSeconds, 0) / 60)} Dk
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Target className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Chart Card */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 backdrop-blur-md shadow-xl">
              <h3 className="text-sm font-black text-white flex items-center space-x-2 mb-6">
                <BarChart2 className="w-4 h-4 text-indigo-400" />
                <span>Geçmiş Odaklanma Analizi (Son 7 Gün)</span>
              </h3>
              
              <div className="h-64 w-full">
                {history.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                    Henüz kayıtlı pomodoro geçmişi bulunmuyor.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={(() => {
                        const days = [...Array(7)].map((_, i) => {
                          const d = new Date();
                          d.setDate(d.getDate() - i);
                          return {
                            dateStr: d.toISOString().split('T')[0],
                            display: d.toLocaleDateString('tr-TR', { weekday: 'short' }),
                            totalSeconds: 0
                          };
                        }).reverse();
                        
                        history.forEach(entry => {
                          const entryDateStr = new Date(entry.timestamp).toISOString().split('T')[0];
                          const dayObj = days.find(d => d.dateStr === entryDateStr);
                          if (dayObj) {
                            dayObj.totalSeconds += entry.durationSeconds;
                          }
                        });
                        
                        return days.map(d => ({
                          name: d.display,
                          minutes: Math.round(d.totalSeconds / 60)
                        }));
                      })()}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                        itemStyle={{ color: '#818cf8' }}
                        formatter={(value: number) => [`${value} Dakika`, 'Odak']}
                      />
                      <Bar dataKey="minutes" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={40}>
                        {
                          [...Array(7)].map((_, index) => (
                            <Cell key={`cell-${index}`} fill={index === 6 ? '#818cf8' : '#4f46e5'} />
                          ))
                        }
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* List Card */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 backdrop-blur-md shadow-xl">
              <h3 className="text-sm font-black text-white flex items-center space-x-2 mb-4">
                <History className="w-4 h-4 text-amber-400" />
                <span>Geçmiş Pomodoro Seansları</span>
              </h3>

              {history.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">
                  Kayıtlı veri bulunamadı.
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    {history.slice((historyPage - 1) * 10, historyPage * 10).map((entry) => (
                      <div key={entry.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-colors">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${entry.mode === 'work' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                            {entry.mode === 'work' ? <Zap className="w-4 h-4" /> : <Coffee className="w-4 h-4" />}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-white flex items-center space-x-2">
                              <span>{entry.mode === 'work' ? 'Çalışma (Odak)' : 'Mola'}</span>
                              <span className="text-slate-500 font-normal text-xs">• {Math.round(entry.durationSeconds / 60)} Dk</span>
                            </div>
                            <div className="text-xs text-slate-400 mt-0.5 flex items-center space-x-2">
                              <Calendar className="w-3 h-3" />
                              <span>{new Date(entry.timestamp).toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                              {entry.planTitle && (
                                <>
                                  <span>•</span>
                                  <span className="text-indigo-300 truncate max-w-[150px] sm:max-w-[200px]">{entry.planTitle}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            if(confirm('Bu kaydı silmek istediğinize emin misiniz?')) {
                              setHistory(prev => {
                                const next = prev.filter(h => h.id !== entry.id);
                                localStorage.setItem('yks_pomodoro_history', JSON.stringify(next));
                                return next;
                              });
                            }
                          }}
                          className="p-2 text-slate-500 hover:text-rose-400 bg-white/5 hover:bg-rose-500/10 rounded-lg transition-all"
                          title="Kaydı Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {Math.ceil(history.length / 10) > 1 && (
                    <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                      <button
                        disabled={historyPage === 1}
                        onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white disabled:opacity-50 text-xs font-bold transition-colors"
                      >
                        Önceki
                      </button>
                      <span className="text-xs text-slate-400">
                        Sayfa {historyPage} / {Math.ceil(history.length / 10)}
                      </span>
                      <button
                        disabled={historyPage >= Math.ceil(history.length / 10)}
                        onClick={() => setHistoryPage(p => p + 1)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white disabled:opacity-50 text-xs font-bold transition-colors"
                      >
                        Sonraki
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
