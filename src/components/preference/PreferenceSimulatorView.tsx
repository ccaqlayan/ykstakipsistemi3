import React, { useState, useMemo } from 'react';
import { 
  Compass, 
  Search, 
  Filter, 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Printer, 
  Share2, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle, 
  Building2, 
  MapPin, 
  GraduationCap, 
  Award, 
  TrendingUp, 
  Sliders,
  Check,
  RotateCcw
} from 'lucide-react';
import { UserAccount, YKSDataState } from '../../types';
import { YOK_ATLAS_PROGRAMS, UniversityProgram } from '../../data/yokAtlasPrograms';
import { getGradeLevel, isEarlyHighSchool } from '../../utils/gradeUtils';

interface PreferenceSimulatorViewProps {
  student: UserAccount;
  studentData: YKSDataState;
  currentUser?: UserAccount;
  onSavePreferences?: (preferenceIds: string[]) => void;
}

export const PreferenceSimulatorView: React.FC<PreferenceSimulatorViewProps> = ({
  student,
  studentData,
  currentUser,
  onSavePreferences
}) => {
  const gradeLevel = getGradeLevel(student.className);
  const isEarly = isEarlyHighSchool(gradeLevel);

  // Field selection
  const [selectedField, setSelectedField] = useState<'SAY' | 'EA' | 'SÖZ' | 'DİL'>(
    (studentData.profile?.targetField as any) || 'SAY'
  );

  // Estimated student metrics
  const [tytNet, setTytNet] = useState<number>(() => {
    const mocks = studentData.generalMocks || [];
    if (mocks.length > 0) {
      const last = mocks[mocks.length - 1];
      return Math.round(last.tyt?.totalNet || 85);
    }
    return 85;
  });

  const [aytNet, setAytNet] = useState<number>(() => {
    const mocks = studentData.generalMocks || [];
    if (mocks.length > 0) {
      const last = mocks[mocks.length - 1];
      return Math.round(last.ayt?.totalNet || 55);
    }
    return 55;
  });

  const [obpScore, setObpScore] = useState<number>(studentData.profile?.schoolGpaTarget || 88);

  // Calculated Placement Score & Estimated Rank
  const { placementScore, estimatedRank } = useMemo(() => {
    // Standard YKS formula estimation
    // Base: 100 + (TYT * 1.32) + (AYT * 3.0) + (OBP * 0.6)
    const base = 100;
    const tytWeight = 1.33;
    const aytWeight = selectedField === 'DİL' ? 2.8 : 3.0;
    const obpWeight = 0.6; // 0.12 * 5 = 0.6

    const score = Math.round((base + (tytNet * tytWeight) + (aytNet * aytWeight) + (obpScore * obpWeight)) * 10) / 10;

    // Rank estimation curve
    let rank = 100000;
    if (score >= 530) rank = Math.round(50 + (550 - score) * 35);
    else if (score >= 500) rank = Math.round(750 + (530 - score) * 75);
    else if (score >= 460) rank = Math.round(3000 + (500 - score) * 250);
    else if (score >= 420) rank = Math.round(13000 + (460 - score) * 450);
    else if (score >= 380) rank = Math.round(31000 + (420 - score) * 850);
    else if (score >= 340) rank = Math.round(65000 + (380 - score) * 1500);
    else rank = Math.round(125000 + (340 - score) * 2500);

    return {
      placementScore: Math.min(560, Math.max(150, score)),
      estimatedRank: Math.max(1, rank)
    };
  }, [tytNet, aytNet, obpScore, selectedField]);

  // Selected 24 Preferences
  const [selectedPreferenceIds, setSelectedPreferenceIds] = useState<string[]>([
    'say-5',
    'say-6',
    'say-9',
    'say-11',
    'say-12'
  ]);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'Devlet' | 'Vakıf'>('ALL');
  const [rankBandFilter, setRankBandFilter] = useState<'ALL' | 'SAFE' | 'IDEAL' | 'DREAM'>('ALL');

  // Filtered program catalogue
  const filteredCatalogue = useMemo(() => {
    return YOK_ATLAS_PROGRAMS.filter(p => {
      if (p.field !== selectedField) return false;
      if (cityFilter !== 'ALL' && p.city !== cityFilter) return false;
      if (typeFilter !== 'ALL' && p.type !== typeFilter) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const match = 
          p.university.toLowerCase().includes(q) ||
          p.department.toLowerCase().includes(q) ||
          p.faculty.toLowerCase().includes(q) ||
          p.city.toLowerCase().includes(q);
        if (!match) return false;
      }

      if (rankBandFilter !== 'ALL') {
        const ratio = p.lastMinRank2025 / estimatedRank;
        if (rankBandFilter === 'SAFE' && ratio <= 1.25) return false;
        if (rankBandFilter === 'IDEAL' && (ratio < 0.8 || ratio > 1.25)) return false;
        if (rankBandFilter === 'DREAM' && ratio >= 0.8) return false;
      }

      return true;
    });
  }, [selectedField, cityFilter, typeFilter, searchTerm, rankBandFilter, estimatedRank]);

  // Selected preference objects
  const myPreferences = useMemo(() => {
    return selectedPreferenceIds
      .map(id => YOK_ATLAS_PROGRAMS.find(p => p.id === id))
      .filter((p): p is UniversityProgram => p !== undefined);
  }, [selectedPreferenceIds]);

  // Preference list health analysis
  const listHealth = useMemo(() => {
    let dreamCount = 0;
    let idealCount = 0;
    let safeCount = 0;

    myPreferences.forEach(p => {
      const ratio = p.lastMinRank2025 / estimatedRank;
      if (ratio < 0.8) dreamCount++;
      else if (ratio <= 1.25) idealCount++;
      else safeCount++;
    });

    const total = myPreferences.length;
    return {
      total,
      dreamCount,
      idealCount,
      safeCount,
      isBalanced: total >= 3 && safeCount > 0 && idealCount > 0
    };
  }, [myPreferences, estimatedRank]);

  // Handlers
  const handleAddPreference = (id: string) => {
    if (selectedPreferenceIds.includes(id)) return;
    if (selectedPreferenceIds.length >= 24) {
      alert('ÖSYM kuralları gereğince en fazla 24 tercih eklenebilir.');
      return;
    }
    const updated = [...selectedPreferenceIds, id];
    setSelectedPreferenceIds(updated);
    if (onSavePreferences) onSavePreferences(updated);
  };

  const handleRemovePreference = (id: string) => {
    const updated = selectedPreferenceIds.filter(item => item !== id);
    setSelectedPreferenceIds(updated);
    if (onSavePreferences) onSavePreferences(updated);
  };

  const handleMovePreference = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= selectedPreferenceIds.length) return;

    const list = [...selectedPreferenceIds];
    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;
    setSelectedPreferenceIds(list);
    if (onSavePreferences) onSavePreferences(list);
  };

  const getPreferenceStatusBadge = (programRank: number) => {
    const ratio = programRank / estimatedRank;
    if (ratio < 0.8) {
      return {
        label: 'Hedef / Sürpriz',
        color: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
        desc: 'Sıralamanızın üzerinde, yüksek hedef.'
      };
    } else if (ratio <= 1.25) {
      return {
        label: 'İdeal / Dengeli',
        color: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        desc: 'Sıralamanıza çok yakın, kazanma şansı dengeli.'
      };
    } else {
      return {
        label: 'Güvenli / Garanti',
        color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        desc: 'Sıralamanızın altında, yerleşme olasılığı yüksek.'
      };
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    let msg = `🎓 *${student.name} - YKS 2026 Tercih Listesi Simülasyonu*\n` +
      `📌 *Alan:* ${selectedField} | *Tahmini Yerleştirme Puanı:* ${placementScore} | *Tahmini Sıra:* ${estimatedRank.toLocaleString('tr-TR')}\n\n` +
      `📋 *24 Tercih Listesi (${myPreferences.length} Tercih):*\n`;

    myPreferences.forEach((p, idx) => {
      const badge = getPreferenceStatusBadge(p.lastMinRank2025);
      msg += `${idx + 1}. ${p.university} - ${p.department} (${p.city})\n   └ Taban Sıra: ${p.lastMinRank2025.toLocaleString('tr-TR')} [${badge.label}]\n`;
    });

    msg += `\n_Gürsu Yıldız Anadolu Lisesi Akıllı Tercih Robotu_`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12 font-sans max-w-7xl mx-auto">
      
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-gradient-to-br from-indigo-500/15 to-purple-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start sm:items-center space-x-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              <Compass className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-400 mb-1">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>YÖK Atlas 2026 & Akıllı YKS Tercih Robotu</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white">
                Üniversite Tercih Simülatörü (24 Tercih)
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                TYT/AYT netlerinize ve OBP puanınıza göre güncel taban sıralamalarıyla 24'lü tercih listenizi oluşturun.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handlePrint}
              className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-2xl border border-slate-700 transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-slate-400" />
              <span>Yazdır / PDF</span>
            </button>
            <button
              onClick={handleShareWhatsApp}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-2xl shadow-lg shadow-emerald-600/30 transition-all flex items-center space-x-1.5 cursor-pointer active:scale-95"
            >
              <Share2 className="w-4 h-4" />
              <span>WhatsApp ile Paylaş</span>
            </button>
          </div>
        </div>

        {/* Score & Rank Estimator Control Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800">
          
          {/* Alan Seçimi */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 block">Puan Türü / Alan:</label>
            <div className="grid grid-cols-4 gap-1.5 bg-slate-950 p-1 rounded-2xl border border-slate-800">
              {(['SAY', 'EA', 'SÖZ', 'DİL'] as const).map((field) => (
                <button
                  key={field}
                  onClick={() => setSelectedField(field)}
                  className={`py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${
                    selectedField === field 
                      ? 'bg-indigo-600 text-white shadow-md' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {field}
                </button>
              ))}
            </div>
          </div>

          {/* TYT & AYT Netleri */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px] font-bold text-slate-400">
              <span>TYT Neti (120):</span>
              <span className="text-amber-400 font-mono">{tytNet} Net</span>
            </div>
            <input
              type="range"
              min="20"
              max="120"
              step="1"
              value={tytNet}
              onChange={(e) => setTytNet(Number(e.target.value))}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px] font-bold text-slate-400">
              <span>AYT Neti (80):</span>
              <span className="text-indigo-400 font-mono">{aytNet} Net</span>
            </div>
            <input
              type="range"
              min="5"
              max="80"
              step="1"
              value={aytNet}
              onChange={(e) => setAytNet(Number(e.target.value))}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>

          {/* Hesaplanan Tahmini Sıralama Kartı */}
          <div className="bg-gradient-to-br from-indigo-950/80 to-purple-950/80 border border-indigo-500/40 p-3 rounded-2xl flex items-center justify-between">
            <div>
              <div className="text-[10px] text-indigo-300 font-bold uppercase">Tahmini Başarı Sırası</div>
              <div className="text-xl font-black text-white font-mono">
                {estimatedRank.toLocaleString('tr-TR')}
              </div>
              <div className="text-[10px] text-slate-400">
                Puan: <strong className="text-emerald-400 font-mono">{placementScore}</strong>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-black">
              #{selectedField}
            </div>
          </div>

        </div>
      </div>

      {/* Main Grid: Left (Catalogue) - Right (My 24 Choices) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left 7 Cols: YÖK Atlas Üniversite ve Bölüm Kataloğu */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Filters Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Üniversite veya bölüm ara (Örn: Bilgisayar, Hukuk, Tıp, ODTÜ)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <select
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-2xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="ALL">Tüm Şehirler</option>
                <option value="İstanbul">İstanbul</option>
                <option value="Ankara">Ankara</option>
                <option value="İzmir">İzmir</option>
                <option value="Bursa">Bursa</option>
              </select>

              <select
                value={rankBandFilter}
                onChange={(e) => setRankBandFilter(e.target.value as any)}
                className="bg-slate-950 border border-slate-800 rounded-2xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="ALL">Tüm Sıralama Bantları</option>
                <option value="SAFE">🟢 Sadece Güvenli</option>
                <option value="IDEAL">🟡 Sadece İdeal / Dengeli</option>
                <option value="DREAM">🔴 Sadece Hedef / Sürpriz</option>
              </select>
            </div>
          </div>

          {/* Program Cards List */}
          <div className="space-y-3">
            {filteredCatalogue.length === 0 ? (
              <div className="text-center py-12 bg-slate-900/60 rounded-3xl border border-dashed border-slate-800 text-slate-400 text-xs">
                Arama kriterlerinize uygun üniversite programı bulunamadı.
              </div>
            ) : (
              filteredCatalogue.map((p) => {
                const isAdded = selectedPreferenceIds.includes(p.id);
                const badge = getPreferenceStatusBadge(p.lastMinRank2025);

                return (
                  <div
                    key={p.id}
                    className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-3xl p-4 sm:p-5 transition-all shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-black text-white">{p.university}</span>
                        <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-bold">
                          {p.city}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${badge.color}`}>
                          {badge.label}
                        </span>
                      </div>

                      <div className="text-sm font-bold text-indigo-300">
                        {p.department} <span className="text-xs text-slate-400 font-normal">({p.faculty})</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                        <span>Dil: <strong className="text-slate-200">{p.language}</strong></span>
                        <span>•</span>
                        <span>Burs: <strong className="text-slate-200">{p.scholarship}</strong></span>
                        <span>•</span>
                        <span>2025 Taban: <strong className="text-emerald-400 font-mono">{p.lastMinRank2025.toLocaleString('tr-TR')}</strong></span>
                      </div>
                    </div>

                    <button
                      onClick={() => isAdded ? handleRemovePreference(p.id) : handleAddPreference(p.id)}
                      className={`px-4 py-2 text-xs font-bold rounded-2xl transition-all flex items-center space-x-1.5 cursor-pointer shrink-0 ${
                        isAdded
                          ? 'bg-rose-950 text-rose-300 border border-rose-800 hover:bg-rose-900'
                          : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md active:scale-95'
                      }`}
                    >
                      {isAdded ? (
                        <>
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Listeden Çıkar</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>Tercihe Ekle</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })
            )}
          </div>

        </div>

        {/* Right 5 Cols: My 24 Choices List (Tercih Sepeti) */}
        <div className="lg:col-span-5 space-y-4">
          
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4 sticky top-6">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-black text-white flex items-center space-x-2">
                  <span>ÖSYM Tercih Listem</span>
                  <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 text-xs font-mono rounded-full">
                    {myPreferences.length} / 24
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Tercihlerinizi sıralamak için yukarı/aşağı okları kullanın.
                </p>
              </div>

              {myPreferences.length > 0 && (
                <button
                  onClick={() => setSelectedPreferenceIds([])}
                  className="text-[11px] text-slate-400 hover:text-rose-400 transition-colors flex items-center space-x-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Temizle</span>
                </button>
              )}
            </div>

            {/* List Health Meter */}
            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-850 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-bold text-slate-300">Tercih Dağılım Analizi:</span>
                <span className={listHealth.isBalanced ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                  {listHealth.isBalanced ? '✨ Dengeli & Sağlıklı Liste' : '⚠️ Daha Çok Güvenli Tercih Ekleyin'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-1 text-center text-[10px]">
                <div className="bg-rose-950/40 border border-rose-800/40 p-1 rounded-lg text-rose-300">
                  🔴 {listHealth.dreamCount} Hedef
                </div>
                <div className="bg-amber-950/40 border border-amber-800/40 p-1 rounded-lg text-amber-300">
                  🟡 {listHealth.idealCount} İdeal
                </div>
                <div className="bg-emerald-950/40 border border-emerald-800/40 p-1 rounded-lg text-emerald-300">
                  🟢 {listHealth.safeCount} Güvenli
                </div>
              </div>
            </div>

            {/* Reorderable Preference Items */}
            <div className="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar pr-1">
              {myPreferences.length === 0 ? (
                <div className="text-center py-10 bg-slate-950/40 rounded-2xl border border-dashed border-slate-800 text-slate-400 text-xs">
                  Sol taraftaki katalogdan üniversite ve bölüm seçerek 24 tercih listenizi oluşturmaya başlayın.
                </div>
              ) : (
                myPreferences.map((p, idx) => {
                  const badge = getPreferenceStatusBadge(p.lastMinRank2025);

                  return (
                    <div
                      key={p.id}
                      className="bg-slate-950 border border-slate-850 p-3 rounded-2xl flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <div className="w-6 h-6 rounded-xl bg-indigo-600/30 text-indigo-300 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                          {idx + 1}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-white truncate">{p.university}</div>
                          <div className="text-slate-400 text-[11px] truncate">{p.department}</div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            Taban: {p.lastMinRank2025.toLocaleString('tr-TR')} • <span className={badge.color.split(' ')[1]}>{badge.label}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1 shrink-0">
                        <button
                          disabled={idx === 0}
                          onClick={() => handleMovePreference(idx, 'up')}
                          className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg disabled:opacity-30 cursor-pointer"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          disabled={idx === myPreferences.length - 1}
                          onClick={() => handleMovePreference(idx, 'down')}
                          className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg disabled:opacity-30 cursor-pointer"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleRemovePreference(p.id)}
                          className="p-1 hover:bg-rose-950 text-slate-400 hover:text-rose-400 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
