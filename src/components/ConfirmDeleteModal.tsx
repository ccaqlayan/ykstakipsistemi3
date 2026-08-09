import React, { useState, useEffect } from 'react';
import { AlertTriangle, Trash2, ShieldAlert, X } from 'lucide-react';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  title?: string;
  itemName?: string;
  onConfirm: () => void;
  onClose: () => void;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  title = "Öğeyi Sil",
  itemName,
  onConfirm,
  onClose
}) => {
  const [step, setStep] = useState<1 | 2>(1);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleNextStep = () => {
    setStep(2);
  };

  const handleFinalConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            {step === 1 ? (
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            ) : (
              <ShieldAlert className="w-5 h-5 text-rose-500 animate-pulse" />
            )}
            <h3 className="text-sm font-bold text-white">
              {title} - <span className={step === 1 ? "text-amber-400" : "text-rose-400"}>Onay Adımı ({step} / 2)</span>
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Step 1 */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="bg-amber-500/10 border border-amber-500/20 p-3.5 rounded-xl space-y-1">
              <p className="text-xs font-bold text-amber-300">1. Onay Gerekli</p>
              <p className="text-xs text-slate-300 leading-relaxed">
                {itemName ? (
                  <>
                    <strong className="text-white font-semibold">"{itemName}"</strong> adlı kaydı silmek istediğinize emin misiniz?
                  </>
                ) : (
                  "Bu kaydı silmek istediğinize emin misiniz?"
                )}
              </p>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white font-medium rounded-xl hover:bg-slate-800 transition-colors"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleNextStep}
                className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-md flex items-center space-x-1"
              >
                <span>Devam Et (2. Onay)</span>
                <span>→</span>
              </button>
            </div>
          </div>
        )}

        {/* Content Step 2 */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="bg-rose-500/10 border border-rose-500/30 p-3.5 rounded-xl space-y-2">
              <div className="flex items-center space-x-1.5 text-rose-400 font-extrabold text-xs">
                <ShieldAlert className="w-4 h-4" />
                <span>SON ONAY: İşlem Geri Alınamaz!</span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed">
                {itemName ? (
                  <>
                    <strong className="text-white">"{itemName}"</strong> kalıcı olarak silinecektir. Bu veriyi daha sonra geri getiremezsiniz.
                  </>
                ) : (
                  "Bu kayıt kalıcı olarak silinecektir. Silme işlemini son kez onaylıyor musunuz?"
                )}
              </p>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white font-medium rounded-xl hover:bg-slate-800 transition-colors"
              >
                İptal Et
              </button>
              <button
                type="button"
                onClick={handleFinalConfirm}
                className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-black px-4 py-2 rounded-xl transition-all shadow-lg shadow-rose-600/30 flex items-center space-x-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>KESİNLİKLE SİL</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
