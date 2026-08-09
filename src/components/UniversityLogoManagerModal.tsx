import React, { useState, useEffect } from 'react';
import { X, Search, Image as ImageIcon, RotateCcw, Save, Check, Plus, Building2, Sparkles, AlertCircle, Link } from 'lucide-react';
import { UNIVERSITIES } from '../data/universities';
import { UniversityLogo, getDirectLogoUrl } from './UniversityLogo';
import { 
  getCustomLogosMap, 
  setCustomLogoForUni, 
  removeCustomLogoForUni 
} from '../utils/universityLogoStore';

interface UniversityLogoManagerModalProps {
  onClose: () => void;
}

export const UniversityLogoManagerModal: React.FC<UniversityLogoManagerModalProps> = ({ onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [customLogos, setCustomLogos] = useState<Record<string, string>>({});
  const [editingUni, setEditingUni] = useState<string | null>(null);
  const [inputUrl, setInputUrl] = useState('');
  const [savedSuccessKey, setSavedSuccessKey] = useState<string | null>(null);

  // New university form
  const [showAddUniForm, setShowAddUniForm] = useState(false);
  const [newUniName, setNewUniName] = useState('');
  const [newUniUrl, setNewUniUrl] = useState('');

  useEffect(() => {
    setCustomLogos(getCustomLogosMap());
  }, []);

  const handleSaveLogo = (uniName: string, url: string) => {
    if (!url.trim()) {
      removeCustomLogoForUni(uniName);
    } else {
      setCustomLogoForUni(uniName, url.trim());
    }
    setCustomLogos(getCustomLogosMap());
    setEditingUni(null);
    setInputUrl('');
    
    setSavedSuccessKey(uniName);
    setTimeout(() => setSavedSuccessKey(null), 2000);
  };

  const handleResetLogo = (uniName: string) => {
    removeCustomLogoForUni(uniName);
    setCustomLogos(getCustomLogosMap());
    if (editingUni === uniName) {
      setInputUrl('');
      setEditingUni(null);
    }
  };

  const handleAddNewUni = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUniName.trim() || !newUniUrl.trim()) return;

    setCustomLogoForUni(newUniName.trim(), newUniUrl.trim());
    setCustomLogos(getCustomLogosMap());
    setNewUniName('');
    setNewUniUrl('');
    setShowAddUniForm(false);
  };

  // Combine default universities with any custom created ones
  const allUniNames = Array.from(new Set([
    ...UNIVERSITIES,
    ...Object.keys(customLogos)
  ])).sort((a, b) => a.localeCompare(b, 'tr'));

  const filteredUniversities = allUniNames.filter(u => 
    u.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-slate-900 border border-indigo-500/30 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl relative overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-slate-900/90 relative z-10 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-2xl border border-indigo-500/30 text-indigo-400">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                Üniversite Logoları Yönetimi
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Tüm üniversitelerin resmi logolarını düzenleyin, eksik logoları güncelleyin veya özel logo bağlantıları ekleyin.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar & Search */}
        <div className="p-4 bg-slate-950/60 border-b border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Üniversite ara (örn: İTÜ, Boğaziçi...)"
              className="w-full bg-slate-900 border border-white/15 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
            />
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => setShowAddUniForm(!showAddUniForm)}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-600/20 flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Yeni Logo Ekle</span>
            </button>
          </div>
        </div>

        {/* Optional Add New University Form */}
        {showAddUniForm && (
          <form onSubmit={handleAddNewUni} className="p-4 bg-indigo-950/40 border-b border-indigo-500/30 grid grid-cols-1 sm:grid-cols-3 gap-3 animate-fade-in shrink-0">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">Üniversite Adı</label>
              <input
                type="text"
                value={newUniName}
                onChange={(e) => setNewUniName(e.target.value)}
                placeholder="Örn: Nişantaşı Üniversitesi"
                className="w-full bg-slate-900 border border-white/15 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">Logo Resim URL Adresi</label>
              <input
                type="url"
                value={newUniUrl}
                onChange={(e) => setNewUniUrl(e.target.value)}
                placeholder="https://upload.wikimedia.org/...png"
                className="w-full bg-slate-900 border border-white/15 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                required
              />
            </div>
            <div className="flex items-end space-x-2">
              <button
                type="submit"
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-all"
              >
                Kaydet
              </button>
              <button
                type="button"
                onClick={() => setShowAddUniForm(false)}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 text-xs rounded-lg hover:bg-slate-700"
              >
                İptal
              </button>
            </div>
          </form>
        )}

        {/* Table Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredUniversities.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              Aramanıza uygun üniversite bulunamadı.
            </div>
          ) : (
            <div className="divide-y divide-white/5 border border-white/10 rounded-2xl overflow-hidden bg-slate-950/40">
              <div className="bg-slate-900/80 px-4 py-3 grid grid-cols-12 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <div className="col-span-1">Logo</div>
                <div className="col-span-4">Üniversite Adı</div>
                <div className="col-span-5">Logo Kaynağı / URL</div>
                <div className="col-span-2 text-right">İşlem</div>
              </div>

              {filteredUniversities.map((uni) => {
                const isCustom = Boolean(customLogos[uni]);
                const isEditing = editingUni === uni;
                const defaultUrl = getDirectLogoUrl(uni);

                return (
                  <div 
                    key={uni}
                    className="px-4 py-3 grid grid-cols-12 items-center text-xs hover:bg-white/5 transition-colors gap-2"
                  >
                    {/* Logo Preview */}
                    <div className="col-span-1 flex items-center justify-center">
                      <UniversityLogo universityName={uni} sizeClassName="w-8 h-8" opacityClassName="opacity-100" />
                    </div>

                    {/* Uni Name */}
                    <div className="col-span-4 font-semibold text-slate-200 pr-2">
                      <div className="flex items-center space-x-2">
                        <span className="truncate">{uni}</span>
                        {isCustom && (
                          <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] px-1.5 py-0.2 rounded font-bold shrink-0">
                            Özel
                          </span>
                        )}
                        {savedSuccessKey === uni && (
                          <span className="text-emerald-400 text-[10px] font-bold flex items-center animate-fade-in">
                            <Check className="w-3 h-3 mr-0.5" /> Kaydedildi
                          </span>
                        )}
                      </div>
                    </div>

                    {/* URL / Editor */}
                    <div className="col-span-5 pr-2">
                      {isEditing ? (
                        <div className="flex items-center space-x-1.5">
                          <input
                            type="text"
                            value={inputUrl}
                            onChange={(e) => setInputUrl(e.target.value)}
                            placeholder="Yeni logo URL adresini yapıştırın..."
                            className="w-full bg-slate-900 border border-indigo-500/50 rounded-lg px-2.5 py-1 text-[11px] text-white focus:outline-none"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveLogo(uni, inputUrl)}
                            className="p-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
                            title="Kaydet"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingUni(null)}
                            className="p-1 bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
                            title="İptal"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="text-[11px] font-mono text-slate-400 truncate max-w-full flex items-center space-x-1">
                          <Link className="w-3 h-3 text-slate-500 shrink-0" />
                          <span className="truncate">
                            {customLogos[uni] || defaultUrl || 'Vikipedi Otomatik Çekim'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="col-span-2 flex items-center justify-end space-x-1.5">
                      {!isEditing && (
                        <button
                          onClick={() => {
                            setEditingUni(uni);
                            setInputUrl(customLogos[uni] || defaultUrl || '');
                          }}
                          className="px-2.5 py-1 bg-indigo-600/80 hover:bg-indigo-500 text-white font-medium text-[11px] rounded-lg transition-all"
                        >
                          Düzenle
                        </button>
                      )}

                      {isCustom && (
                        <button
                          onClick={() => handleResetLogo(uni)}
                          className="p-1 bg-rose-500/20 text-rose-300 hover:bg-rose-500 hover:text-white rounded-lg transition-colors"
                          title="Sıfırla (Varsayılana Dön)"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-white/10 bg-slate-900/90 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <div className="flex items-center space-x-1 text-slate-400">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Değişiklikler anında tüm öğrenci ve öğretmen panellerinde aktifleşir.</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
