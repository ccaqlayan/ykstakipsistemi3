import React, { useState, useEffect } from 'react';
import { DEFAULT_MOTIVATION_MESSAGES } from '../../services/motivationEngine';
import { db, sanitizeAndPrepareForFirestore } from '../../services/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { Sparkles, Save, RotateCcw, CheckCircle2, MessageSquare, Flame, Target, Trophy, Award } from 'lucide-react';

interface MotivationMessagesTabProps {
  customMessages?: Record<string, string>;
  onMessagesSaved?: (msgs: Record<string, string>) => void;
}

export const MotivationMessagesTab: React.FC<MotivationMessagesTabProps> = ({
  customMessages,
  onMessagesSaved
}) => {
  const [messages, setMessages] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('yks_motivation_messages');
      if (saved) return { ...DEFAULT_MOTIVATION_MESSAGES, ...JSON.parse(saved) };
    } catch (e) {
      // fallback
    }
    return { ...DEFAULT_MOTIVATION_MESSAGES, ...(customMessages || {}) };
  });

  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Load from Firestore if exists
    const loadFromFirestore = async () => {
      try {
        const snap = await getDoc(doc(db, 'settings', 'motivation_messages'));
        if (snap.exists()) {
          const data = snap.data() as Record<string, string>;
          setMessages((prev) => ({ ...prev, ...data }));
          localStorage.setItem('yks_motivation_messages', JSON.stringify(data));
        }
      } catch (err) {
        console.warn('Could not load motivation messages from Firestore:', err);
      }
    };
    loadFromFirestore();
  }, []);

  const handleChange = (key: string, value: string) => {
    setMessages((prev) => ({ ...prev, [key]: value }));
  };

  const handleResetDefaults = () => {
    if (window.confirm('Tüm motivasyon mesajlarını varsayılan orijinal metinlere sıfırlamak istediğinize emin misiniz?')) {
      setMessages({ ...DEFAULT_MOTIVATION_MESSAGES });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveStatus(null);

    try {
      localStorage.setItem('yks_motivation_messages', JSON.stringify(messages));

      await setDoc(doc(db, 'settings', 'motivation_messages'), sanitizeAndPrepareForFirestore(messages), { merge: true });

      window.dispatchEvent(new Event('yks_settings_updated'));
      if (onMessagesSaved) onMessagesSaved(messages);

      setSaveStatus('Motivasyon mesajları başarıyla kaydedildi ve tüm öğrencilere güncellendi!');
      setTimeout(() => setSaveStatus(null), 4500);
    } catch (err) {
      console.error('Error saving motivation messages:', err);
      setSaveStatus('Kaydedilirken bir hata oluştu.');
    } finally {
      setIsSaving(false);
    }
  };

  const fields = [
    {
      group: '🎯 Çalışma Planı & Görevler',
      items: [
        {
          key: 'plan_completed',
          label: 'Ders / Görev Tamamlama Mesajı',
          desc: 'Kullanılabilir etiketler: {subject}, {minutes}, {count}',
          icon: Trophy
        },
        {
          key: 'all_plans_completed',
          label: 'Günün Tüm Planı Bittiğinde Çıkan Mesaj',
          desc: 'Öğrenci o günkü tüm planlarını tamamladığında tetiklenir.',
          icon: Sparkles
        }
      ]
    },
    {
      group: '📊 Deneme Sınavı Geri Bildirimleri',
      items: [
        {
          key: 'tyt_mock_increase',
          label: 'TYT Denemesi Net Artışı Mesajı',
          desc: 'Kullanılabilir etiketler: {oldNet}, {newNet}',
          icon: Target
        },
        {
          key: 'tyt_mock_decrease',
          label: 'TYT Denemesi Net Düşüşü / Zorlama Mesajı',
          desc: 'Öğrencinin neti düştüğünde moral veren destekleyici metin.',
          icon: Target
        },
        {
          key: 'ayt_mock_increase',
          label: 'AYT Denemesi Net Artışı Mesajı',
          desc: 'Kullanılabilir etiketler: {oldNet}, {newNet}',
          icon: Award
        },
        {
          key: 'ayt_mock_decrease',
          label: 'AYT Denemesi Net Düşüşü / Zorlama Mesajı',
          desc: 'AYT neti düştüğünde öğrenciyi analiz yapmaya yönlendiren metin.',
          icon: Award
        },
        {
          key: 'branch_mock_increase',
          label: 'Branş Denemesi Net Artışı Mesajı',
          desc: 'Aynı dersin önceki branş netini baz alır. Etiketler: {subject}, {oldNet}, {newNet}',
          icon: Target
        },
        {
          key: 'branch_mock_decrease',
          label: 'Branş Denemesi Net Düşüşü Mesajı',
          desc: 'Kullanılabilir etiketler: {subject}',
          icon: Target
        }
      ]
    },
    {
      group: '⭐ Konu, Soru & Seri Karşılama',
      items: [
        {
          key: 'topic_mastered',
          label: 'Konu "Uzmanlaştım" İşaretlendiğinde',
          desc: 'Kullanılabilir etiketler: {topicName}',
          icon: Sparkles
        },
        {
          key: 'question_goal_reached',
          label: 'Günlük Soru Hedefi Aşıldığında',
          desc: 'Kullanılabilir etiketler: {solved}, {correct}',
          icon: Award
        },
        {
          key: 'streak_active',
          label: 'Aktif Çalışma Serisi Hatırlatma Mesajı',
          desc: 'Kullanılabilir etiketler: {streak}',
          icon: Flame
        }
      ]
    }
  ];

  return (
    <form onSubmit={handleSave} className="space-y-6 animate-fadeIn select-none">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-indigo-950/40 border border-amber-500/30">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Öğrenci Motivasyon & Geri Bildirim Şablonları
          </div>
          <h2 className="text-lg font-extrabold text-white">
            Öğrencilere Gösterilecek Anlık Toast Mesajları
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Öğrenciler deneme girdiğinde, soru çözdüğünde veya plan bitirdiğinde ekranlarında beliren tebrik ve motivasyon cümlelerini buradan özelleştirebilirsiniz.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center gap-1.5 border border-slate-700 shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Varsayılanlara Dön
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition flex items-center gap-1.5 shadow-lg shadow-amber-500/20"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
          </button>
        </div>
      </div>

      {/* Save Success Alert */}
      {saveStatus && (
        <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4" />
          {saveStatus}
        </div>
      )}

      {/* Form Groups */}
      <div className="space-y-6">
        {fields.map((group, gIdx) => (
          <div
            key={gIdx}
            className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 shadow-lg space-y-4"
          >
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2 pb-2 border-b border-slate-800">
              {group.group}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.key} className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <Icon className="w-3.5 h-3.5 text-amber-400" />
                      {item.label}
                    </label>
                    <textarea
                      rows={2}
                      value={messages[item.key] || ''}
                      onChange={(e) => handleChange(item.key, e.target.value)}
                      className="w-full p-3 rounded-xl bg-slate-950/90 border border-slate-700 text-slate-100 text-xs focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition"
                      placeholder="Motivasyon mesajınızı yazın..."
                    />
                    <p className="text-[10px] text-slate-400 font-medium">
                      {item.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </form>
  );
};
