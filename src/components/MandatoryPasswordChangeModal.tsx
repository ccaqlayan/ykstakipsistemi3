import React, { useState } from 'react';
import { Lock, ShieldCheck, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { UserAccount } from '../types';

interface MandatoryPasswordChangeModalProps {
  currentUser: UserAccount;
  onPasswordChanged: (updatedUser: UserAccount) => void;
}

export const MandatoryPasswordChangeModal: React.FC<MandatoryPasswordChangeModalProps> = ({
  currentUser,
  onPasswordChanged
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!currentPassword.trim()) {
      setErrorMessage('Lütfen mevcut (eski) şifrenizi giriniz.');
      return;
    }

    if (!newPassword.trim() || newPassword.trim().length < 6) {
      setErrorMessage('Yeni şifreniz en az 6 karakter olmalıdır.');
      return;
    }

    if (newPassword.trim() !== confirmPassword.trim()) {
      setErrorMessage('Girdiğiniz yeni şifreler birbiriyle eşleşmiyor.');
      return;
    }

    if (currentPassword.trim() === newPassword.trim()) {
      setErrorMessage('Yeni şifreniz eski şifreniz ile aynı olamaz.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/auth/change-password-mandatory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          currentPassword: currentPassword.trim(),
          newPassword: newPassword.trim()
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Şifre değiştirme işlemi başarısız.');
        setIsSubmitting(false);
        return;
      }

      setSuccessMessage('Şifreniz başarıyla değiştirildi! Uygulamaya yönlendiriliyorsunuz...');
      setTimeout(() => {
        onPasswordChanged(data.user || { ...currentUser, mustChangePassword: false });
      }, 1000);
    } catch (err) {
      setErrorMessage('Sunucuya bağlanılırken hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-slate-900/95 border border-amber-500/40 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center space-x-3 pb-3 border-b border-white/10">
          <div className="p-3 bg-amber-500/20 text-amber-400 rounded-2xl border border-amber-500/30 shrink-0">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-1.5">
              <span>İlk Giriş Şifre Değişimi</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Güvenliğiniz için lütfen ilk şifrenizi güncelleyin.
            </p>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-amber-500/10 border border-amber-500/25 rounded-2xl p-3.5 text-xs text-amber-200 leading-relaxed">
          <strong>Sayın {currentUser.name},</strong> hesabınızın güvenliğini sağlamak için yöneticiniz/öğretmeniniz tarafından tanımlanan geçici şifrenizi yeni ve kişisel bir şifre ile değiştirmeniz gerekmektedir.
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-200 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-200 text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Mevcut (Eski) Şifreniz
            </label>
            <input
              type="password"
              required
              placeholder="Size tanımlanan mevcut şifre..."
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Yeni Şifreniz (En az 6 karakter)
            </label>
            <input
              type="password"
              required
              minLength={6}
              placeholder="Yeni şifrenizi girin..."
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400 font-mono font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Yeni Şifreniz (Tekrar)
            </label>
            <input
              type="password"
              required
              minLength={6}
              placeholder="Yeni şifrenizi tekrar girin..."
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400 font-mono font-bold"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-amber-600/30 border border-amber-400/40 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
          >
            <span>Şifremi Güncelle ve Devam Et</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

      </div>
    </div>
  );
};
