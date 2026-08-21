import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  Sparkles, 
  X, 
  Send, 
  Loader2, 
  CheckCircle2, 
  ArrowRight, 
  BookOpen, 
  AlertTriangle, 
  Target, 
  Calendar, 
  Clock, 
  Layers, 
  RefreshCw, 
  Zap, 
  FileText,
  BookmarkPlus,
  BarChart2,
  ListTodo
} from 'lucide-react';
import { UserAccount } from '../../types';
import { parseUserQuickAddIntent, SmartAddParsedResult } from '../../services/geminiService';
import { formatDisplayDate } from '../../utils/dateUtils';

interface GlobalAiSmartAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: UserAccount | null;
  onDispatchAction: (
    intent: string, 
    targetTab: string, 
    fields: Record<string, any>, 
    directSave: boolean
  ) => void;
}

const EXAMPLE_PROMPTS = [
  {
    icon: '📝',
    label: '50 Soru Çözümü',
    text: 'Bugün TYT Matematikten 50 soru çözdüm 44 doğru 4 yanlış 2 boş 45 dakika sürdü'
  },
  {
    icon: '❌',
    label: 'Yanlış Soru / Hata',
    text: 'AYT Fizik Elektrostatik konusunda hata yaptım hata defterine ekleyelim'
  },
  {
    icon: '🎯',
    label: 'Branş Denemesi',
    text: '345 Yayınları TYT Türkçe branş denemesi çözdüm 35 doğru 4 yanlış 45 dakika'
  },
  {
    icon: '📅',
    label: 'Ders Planı / Görev',
    text: 'Yarın saat 14:00\'te Geometri Üçgenler tekrarı çalışması planlayalım'
  },
  {
    icon: '📊',
    label: 'Genel Deneme',
    text: 'Özdebir Türkiye Geneli TYT Denemesi netlerim: Türkçe 32, Sosyal 15, Mat 30, Fen 16'
  },
  {
    icon: '📖',
    label: 'Kaynak Kitap',
    text: 'Apotemi AYT Kimya Organik soru bankası aldım kaynaklara ekleyelim'
  },
  {
    icon: '⏱️',
    label: 'Çalışma Süresi',
    text: 'Bugün 3 saat Matematik, 1.5 saat Fizik çalıştım'
  }
];

const INTENT_BADGES: Record<string, { label: string; color: string; icon: any }> = {
  QUESTION_LOG: { label: 'Soru Çözüm Kaydı', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40', icon: CheckCircle2 },
  TOPIC_ERROR: { label: 'Hata Defteri Kaydı', color: 'bg-rose-500/20 text-rose-300 border-rose-500/40', icon: AlertTriangle },
  BRANCH_EXAM: { label: 'Branş Denemesi', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40', icon: Target },
  GENERAL_MOCK: { label: 'Genel Kurumsal Deneme', color: 'bg-purple-500/20 text-purple-300 border-purple-500/40', icon: BarChart2 },
  STUDY_PLAN: { label: 'Ders Çalışma Programı', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40', icon: Calendar },
  STUDY_SESSION: { label: 'Ders Çalışma Süresi', color: 'bg-sky-500/20 text-sky-300 border-sky-500/40', icon: Clock },
  RESOURCE_BOOK: { label: 'Kaynak Kitap Takibi', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40', icon: BookOpen },
  ROUTINE: { label: 'Günlük Rutin & Alışkanlık', color: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/40', icon: ListTodo },
};

export const GlobalAiSmartAddModal: React.FC<GlobalAiSmartAddModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onDispatchAction
}) => {
  const [prompt, setPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedResult, setParsedResult] = useState<SmartAddParsedResult | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPrompt('');
      setError(null);
      setParsedResult(null);
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    setParsedResult(null);

    try {
      const response = await parseUserQuickAddIntent(prompt, currentUser);
      if (response && response.data) {
        setParsedResult(response.data);
      } else {
        throw new Error('Yapay zeka yanıtı anlaşılamadı.');
      }
    } catch (err: any) {
      console.error('Smart add parsing error:', err);
      setError(err?.message || 'Yapay zeka cümlenizi ayrıştırırken bir hata oluştu. Lütfen tekrar deneyiniz.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleApplyExample = (text: string) => {
    setPrompt(text);
    textareaRef.current?.focus();
  };

  const handleDispatch = (directSave: boolean) => {
    if (!parsedResult) return;
    onDispatchAction(
      parsedResult.intent,
      parsedResult.targetTab,
      parsedResult.fields || {},
      directSave
    );
    onClose();
  };

  const badgeInfo = parsedResult?.intent ? INTENT_BADGES[parsedResult.intent] || {
    label: parsedResult.intent,
    color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
    icon: Sparkles
  } : null;

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div 
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Üst Başlık & Gradient Işıltı */}
        <div className="relative p-5 sm:p-6 border-b border-slate-800 bg-gradient-to-r from-indigo-950/60 via-purple-950/40 to-slate-900 flex items-center justify-between">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 shrink-0 animate-pulse">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                  Yapay Zeka ile Akıllı Hızlı Ekle
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-[10px] font-extrabold text-indigo-300 uppercase tracking-widest hidden sm:inline-block">
                  Sihirli Asistan
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate">
                Ne yaptığınızı tek cümleyle söyleyin, ilgili ekleme penceresine otomatik yönlendirelim.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/80 transition-colors cursor-pointer shrink-0"
            title="Kapat (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Gövdesi */}
        <div className="p-5 sm:p-6 overflow-y-auto custom-scrollbar space-y-5">
          
          {/* Giriş Formu (Textarea & Gönder) */}
          <form onSubmit={handleSubmit} className="space-y-2">
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={3}
                placeholder="Örnek: Bugün TYT Matematik 50 soru çözdüm 42 doğru 5 yanlış 45 dakika sürdü / AYT Fizik elektrostatik konusunda hata yaptım ekleyelim / 345 TYT Türkçe branş denemesi 35 D 4 Y..."
                className="w-full bg-slate-950/80 border-2 border-indigo-500/30 focus:border-indigo-400 rounded-2xl p-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all resize-none shadow-inner"
                disabled={isLoading}
              />
              
              <div className="absolute right-3 bottom-3 flex items-center space-x-2">
                <span className="text-[10px] text-slate-500 font-mono hidden sm:inline-block">
                  Enter ↵ ile gönder
                </span>
                <button
                  type="submit"
                  disabled={!prompt.trim() || isLoading}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-500/20 transition-all flex items-center space-x-1.5 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Analiz Ediliyor...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Analiz Et</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Hızlı Örnek Şablon Hapları */}
            <div className="space-y-1.5 pt-1">
              <div className="text-[11px] font-bold text-slate-400 flex items-center space-x-1">
                <span>💡 Fikir Veren Örnek Kalıplar (Tıklayıp Deneyin):</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {EXAMPLE_PROMPTS.map((ex, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyExample(ex.text)}
                    className="px-2.5 py-1 bg-slate-800/80 hover:bg-indigo-950/60 border border-slate-700 hover:border-indigo-500/40 rounded-xl text-[11px] text-slate-300 hover:text-white transition-all flex items-center space-x-1 cursor-pointer"
                  >
                    <span>{ex.icon}</span>
                    <span>{ex.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </form>

          {/* Hata Bildirimi */}
          {error && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-start space-x-2.5 text-xs text-rose-300">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <strong className="font-bold">Ayrıştırma Hatası</strong>
                <p>{error}</p>
              </div>
            </div>
          )}

          {/* Yükleme Durumu */}
          {isLoading && (
            <div className="p-8 bg-slate-950/40 border border-slate-800 rounded-2xl flex flex-col items-center justify-center space-y-3 text-center animate-fade-in">
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
                <Sparkles className="w-5 h-5 text-indigo-400 absolute inset-0 m-auto animate-pulse" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-slate-200">Cümleniz Yapay Zeka ile Çözümleniyor</h4>
                <p className="text-[11px] text-slate-500">Ders, konu, soru sayıları, süre ve ilgili modül tespit ediliyor...</p>
              </div>
            </div>
          )}

          {/* 🌟 AYRIŞTIRILAN VERİ ÖNİZLEME KARTI */}
          {parsedResult && !isLoading && (
            <div className="p-4 sm:p-5 bg-gradient-to-b from-indigo-950/30 to-slate-950 border border-indigo-500/40 rounded-2xl space-y-4 animate-fade-in shadow-xl">
              
              {/* Kart Üst Bilgisi */}
              <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                    {badgeInfo && (
                      <span className={`px-2.5 py-0.5 rounded-full border text-[11px] font-bold flex items-center space-x-1 ${badgeInfo.color}`}>
                        <badgeInfo.icon className="w-3 h-3" />
                        <span>{badgeInfo.label}</span>
                      </span>
                    )}
                    <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      🎯 %{Math.round((parsedResult.confidence || 0.95) * 100)} Doğruluk
                    </span>
                  </div>
                  <h4 className="text-sm sm:text-base font-black text-white tracking-tight">
                    {parsedResult.summary}
                  </h4>
                  {parsedResult.explanation && (
                    <p className="text-xs text-slate-400">
                      {parsedResult.explanation}
                    </p>
                  )}
                </div>
              </div>

              {/* Doldurulacak Alanlar Izgarası */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                {parsedResult.fields?.mockTitle && (
                  <div className="p-2 bg-slate-900/90 border border-slate-800 rounded-xl space-y-0.5 col-span-2 sm:col-span-3">
                    <span className="text-[10px] text-slate-500 font-semibold block">Deneme Sınavı Adı</span>
                    <strong className="text-purple-300 font-bold block truncate">{parsedResult.fields.mockTitle}</strong>
                  </div>
                )}

                {parsedResult.fields?.tytNets && (
                  <div className="p-2 bg-slate-900/90 border border-slate-800 rounded-xl space-y-0.5 col-span-2 sm:col-span-3">
                    <span className="text-[10px] text-slate-500 font-semibold block">TYT Netleri</span>
                    <div className="flex flex-wrap items-center gap-2 text-xs font-bold pt-0.5">
                      {parsedResult.fields.tytNets.turkce !== undefined && (
                        <span className="bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-lg border border-rose-500/30">
                          Türkçe: {parsedResult.fields.tytNets.turkce}
                        </span>
                      )}
                      {parsedResult.fields.tytNets.matematik !== undefined && (
                        <span className="bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-lg border border-indigo-500/30">
                          Mat: {parsedResult.fields.tytNets.matematik}
                        </span>
                      )}
                      {parsedResult.fields.tytNets.sosyal !== undefined && (
                        <span className="bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-lg border border-amber-500/30">
                          Sosyal: {parsedResult.fields.tytNets.sosyal}
                        </span>
                      )}
                      {parsedResult.fields.tytNets.fen !== undefined && (
                        <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-lg border border-emerald-500/30">
                          Fen: {parsedResult.fields.tytNets.fen}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {parsedResult.fields?.aytNets && (
                  <div className="p-2 bg-slate-900/90 border border-slate-800 rounded-xl space-y-0.5 col-span-2 sm:col-span-3">
                    <span className="text-[10px] text-slate-500 font-semibold block">AYT Netleri</span>
                    <div className="flex flex-wrap items-center gap-2 text-xs font-bold pt-0.5">
                      {parsedResult.fields.aytNets.matematik !== undefined && (
                        <span className="bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-lg border border-indigo-500/30">
                          Mat: {parsedResult.fields.aytNets.matematik}
                        </span>
                      )}
                      {parsedResult.fields.aytNets.fen !== undefined && (
                        <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-lg border border-emerald-500/30">
                          Fen: {parsedResult.fields.aytNets.fen}
                        </span>
                      )}
                      {(parsedResult.fields.aytNets.edebiyatSos1 !== undefined || parsedResult.fields.aytNets.edebiyat !== undefined) && (
                        <span className="bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-lg border border-rose-500/30">
                          Edebiyat: {parsedResult.fields.aytNets.edebiyatSos1 ?? parsedResult.fields.aytNets.edebiyat}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {parsedResult.fields?.subject && (
                  <div className="p-2 bg-slate-900/90 border border-slate-800 rounded-xl space-y-0.5">
                    <span className="text-[10px] text-slate-500 font-semibold block">Ders</span>
                    <strong className="text-indigo-300 font-bold block truncate">{parsedResult.fields.subject}</strong>
                  </div>
                )}

                {parsedResult.fields?.topicName && (
                  <div className="p-2 bg-slate-900/90 border border-slate-800 rounded-xl space-y-0.5">
                    <span className="text-[10px] text-slate-500 font-semibold block">Konu</span>
                    <strong className="text-slate-200 font-bold block truncate">{parsedResult.fields.topicName}</strong>
                  </div>
                )}

                {parsedResult.fields?.publisher && !parsedResult.fields?.mockTitle && (
                  <div className="p-2 bg-slate-900/90 border border-slate-800 rounded-xl space-y-0.5">
                    <span className="text-[10px] text-slate-500 font-semibold block">Yayın / Kaynak</span>
                    <strong className="text-slate-200 font-bold block truncate">{parsedResult.fields.publisher}</strong>
                  </div>
                )}

                {typeof parsedResult.fields?.totalQuestions === 'number' && (
                  <div className="p-2 bg-slate-900/90 border border-slate-800 rounded-xl space-y-0.5">
                    <span className="text-[10px] text-slate-500 font-semibold block">Toplam Soru</span>
                    <strong className="text-white font-bold block">{parsedResult.fields.totalQuestions} Soru</strong>
                  </div>
                )}

                {(typeof parsedResult.fields?.correct === 'number' || typeof parsedResult.fields?.wrong === 'number') && (
                  <div className="p-2 bg-slate-900/90 border border-slate-800 rounded-xl space-y-0.5">
                    <span className="text-[10px] text-slate-500 font-semibold block">Doğru / Yanlış / Boş</span>
                    <div className="font-bold flex items-center space-x-1.5 text-[11px]">
                      <span className="text-emerald-400">{parsedResult.fields.correct ?? 0}D</span>
                      <span className="text-rose-400">{parsedResult.fields.wrong ?? 0}Y</span>
                      <span className="text-slate-400">{parsedResult.fields.empty ?? 0}B</span>
                    </div>
                  </div>
                )}

                {typeof parsedResult.fields?.net === 'number' && (
                  <div className="p-2 bg-slate-900/90 border border-slate-800 rounded-xl space-y-0.5">
                    <span className="text-[10px] text-slate-500 font-semibold block">Hesaplanan Net</span>
                    <strong className="text-emerald-300 font-bold block">{parsedResult.fields.net} Net</strong>
                  </div>
                )}

                {typeof parsedResult.fields?.durationMinutes === 'number' && (
                  <div className="p-2 bg-slate-900/90 border border-slate-800 rounded-xl space-y-0.5">
                    <span className="text-[10px] text-slate-500 font-semibold block">Çözüm Süresi</span>
                    <strong className="text-amber-300 font-bold block">{parsedResult.fields.durationMinutes} Dakika</strong>
                  </div>
                )}

                {parsedResult.fields?.date && (
                  <div className="p-2 bg-slate-900/90 border border-slate-800 rounded-xl space-y-0.5">
                    <span className="text-[10px] text-slate-500 font-semibold block">Tarih</span>
                    <strong className="text-slate-200 font-bold block">{formatDisplayDate(parsedResult.fields.date)}</strong>
                  </div>
                )}

                {parsedResult.fields?.errorReason && (
                  <div className="p-2 bg-slate-900/90 border border-slate-800 rounded-xl space-y-0.5">
                    <span className="text-[10px] text-slate-500 font-semibold block">Hata Nedeni</span>
                    <strong className="text-rose-300 font-bold block truncate">{parsedResult.fields.errorReason}</strong>
                  </div>
                )}
              </div>

              {/* Aksiyon Butonları (Yönlendir & Doldur / Doğrudan Kaydet) */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setParsedResult(null)}
                  className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Farklı Bir Cümle Yaz</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDispatch(false)}
                  className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-black shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <span>🚀 İlgili Pencereye Aktar (Eksikleri Tamamla)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

            </div>
          )}

        </div>

        {/* Modal Alt Bilgi */}
        <div className="p-3 bg-slate-950 border-t border-slate-800/80 text-[11px] text-slate-500 text-center flex items-center justify-between px-6">
          <div className="flex items-center space-x-1">
            <Sparkles className="w-3 h-3 text-indigo-400" />
            <span>Gemini 2.5 Niyet & Varlık Ayrıştırıcı</span>
          </div>
          <span className="font-mono text-[10px]">YKS Takip Sistemi v1.9.90</span>
        </div>

      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};
