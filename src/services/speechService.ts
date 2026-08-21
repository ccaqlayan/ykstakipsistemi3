/**
 * speechService.ts
 * Web Speech API (window.speechSynthesis) tabanlı sesli koçluk servisi.
 * AI yanıtlarını, analiz raporlarını ve reçeteleri doğal Türkçe diksiyonla okur.
 */

export interface SpeechOptions {
  id?: string;
  rate?: number; // 0.8 - 1.5 (Varsayılan: 1.0)
  pitch?: number; // 0.8 - 1.2 (Varsayılan: 1.0)
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: any) => void;
}

// ─── TARAYICI DESTEK KONTROLÜ ─────────────────────────────────────────────

export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}

// ─── MARKDOWN & METİN TEMİZLEME ────────────────────────────────────────────

/**
 * AI tarafından üretilen Markdown formatındaki yanıtları ses motorunun
 * takılmadan ve imla sembollerini okumadan akıcı seslendirmesi için temizler.
 */
export function cleanMarkdownForSpeech(markdown: string): string {
  if (!markdown) return '';

  let text = markdown;

  // 1. Kod bloklarını ve tablo çizgilerini temizle
  text = text.replace(/```[\s\S]*?```/g, ' Kod bloğu atlandı. ');
  text = text.replace(/`([^`]+)`/g, '$1');
  text = text.replace(/\|/g, ' ');
  text = text.replace(/[-]{3,}/g, ' ');

  // 2. Linkleri temizle: [metin](url) -> metin
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

  // 3. Başlık işaretlerini (#, ##, ###) kaldır
  text = text.replace(/#{1,6}\s+/g, '');

  // 4. Kalın ve italik işaretlerini kaldır (**kalın**, *italik*, __kalın__, _italik_)
  text = text.replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, '$1');

  // 5. Liste işaretlerini (- , * , 1. , [x], [ ]) kaldır
  text = text.replace(/^\s*[-*+]\s+/gm, '');
  text = text.replace(/^\s*\d+\.\s+/gm, '');
  text = text.replace(/\[[ xX]\]/g, '');

  // 6. Sık kullanılan sembolleri Türkçeleştir / sadeleştir
  text = text.replace(/&/g, ' ve ');
  text = text.replace(/%/g, ' yüzde ');
  text = text.replace(/\+/g, ' artı ');
  text = text.replace(/=/g, ' eşittir ');
  text = text.replace(/~/g, ' ');
  text = text.replace(/>/g, ' ');
  text = text.replace(/</g, ' ');

  // 7. Emojileri temizle / seyrelt (ses motorları bazen emoji isimlerini harf harf okuyabilir)
  text = text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, ' ');

  // 8. Çoklu boşluk ve satır sonlarını normalize et
  text = text.replace(/\n{2,}/g, '. ');
  text = text.replace(/\n/g, ' ');
  text = text.replace(/\s{2,}/g, ' ');

  return text.trim();
}

/**
 * Uzun metinleri cümle sonlarına göre parçalara böler.
 * Chrome ve Android tarayıcılarında 15 saniyeden uzun süren seslendirmelerin
 * aniden kesilmesini önler.
 */
export function splitIntoSentences(text: string, maxChunkLength: number = 160): string[] {
  if (!text) return [];

  // Cümle bitiş işaretlerine göre böl (. ! ? ;)
  const rawSentences = text.match(/[^.!?;\n]+[.!?;\n]+|[^.!?;\n]+$/g) || [text];
  const chunks: string[] = [];

  let currentChunk = '';

  for (const sentence of rawSentences) {
    const trimmed = sentence.trim();
    if (!trimmed) continue;

    if (currentChunk.length + trimmed.length <= maxChunkLength) {
      currentChunk = currentChunk ? `${currentChunk} ${trimmed}` : trimmed;
    } else {
      if (currentChunk) chunks.push(currentChunk);
      
      if (trimmed.length > maxChunkLength) {
        // Cümle çok uzunsa virgüllere göre böl
        const subParts = trimmed.split(/,\s*/);
        let subChunk = '';
        for (const part of subParts) {
          if (subChunk.length + part.length <= maxChunkLength) {
            subChunk = subChunk ? `${subChunk}, ${part}` : part;
          } else {
            if (subChunk) chunks.push(subChunk);
            subChunk = part;
          }
        }
        if (subChunk) chunks.push(subChunk);
        currentChunk = '';
      } else {
        currentChunk = trimmed;
      }
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks.filter(c => c.trim().length > 0);
}

// ─── SES SENTEZLEME YÖNETİCİSİ ─────────────────────────────────────────────

class SpeechManager {
  private activeId: string | null = null;
  private isSpeakingState = false;
  private isPausedState = false;
  private currentChunks: string[] = [];
  private currentChunkIndex = 0;
  private currentOptions: SpeechOptions = {};
  private activeUtterance: SpeechSynthesisUtterance | null = null;
  private turkishVoice: SpeechSynthesisVoice | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.initVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => this.initVoices();
      }
    }
  }

  private initVoices() {
    if (!isSpeechSynthesisSupported()) return;
    const voices = window.speechSynthesis.getVoices();
    // Türkçe sesleri ara (Google Türkçe, Microsoft Tolga/Emel vb.)
    const trVoices = voices.filter(v => v.lang.toLowerCase().startsWith('tr') || v.lang.toLowerCase().includes('turkish'));
    if (trVoices.length > 0) {
      // Doğal/kaliteli Türkçe sesleri öncelikle seç
      this.turkishVoice = trVoices.find(v => v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Tolga') || v.name.includes('Emel')) || trVoices[0];
    }
  }

  public getActiveId(): string | null {
    return this.activeId;
  }

  public isSpeaking(): boolean {
    return this.isSpeakingState;
  }

  public isPaused(): boolean {
    return this.isPausedState;
  }

  public stop() {
    if (!isSpeechSynthesisSupported()) return;
    
    this.currentChunks = [];
    this.currentChunkIndex = 0;
    this.isSpeakingState = false;
    this.isPausedState = false;
    const prevId = this.activeId;
    this.activeId = null;

    try {
      window.speechSynthesis.cancel();
    } catch {}

    if (this.currentOptions.onEnd) {
      this.currentOptions.onEnd();
    }
    this.currentOptions = {};
    return prevId;
  }

  public pause() {
    if (!isSpeechSynthesisSupported() || !this.isSpeakingState) return;
    try {
      window.speechSynthesis.pause();
      this.isPausedState = true;
    } catch {}
  }

  public resume() {
    if (!isSpeechSynthesisSupported() || !this.isPausedState) return;
    try {
      window.speechSynthesis.resume();
      this.isPausedState = false;
    } catch {}
  }

  public speak(text: string, options: SpeechOptions = {}) {
    if (!isSpeechSynthesisSupported()) {
      if (options.onError) options.onError(new Error('Tarayıcınız ses sentezleme (Web Speech API) özelliğini desteklemiyor.'));
      return;
    }

    // Halihazırda çalan varsa durdur
    this.stop();

    const cleanedText = cleanMarkdownForSpeech(text);
    if (!cleanedText) return;

    this.activeId = options.id || 'default';
    this.currentOptions = options;
    this.currentChunks = splitIntoSentences(cleanedText);
    this.currentChunkIndex = 0;
    this.isSpeakingState = true;
    this.isPausedState = false;

    if (this.currentOptions.onStart) {
      this.currentOptions.onStart();
    }

    this.playNextChunk();
  }

  private playNextChunk() {
    if (!this.isSpeakingState || this.currentChunkIndex >= this.currentChunks.length) {
      this.isSpeakingState = false;
      this.activeId = null;
      if (this.currentOptions.onEnd) {
        this.currentOptions.onEnd();
      }
      return;
    }

    const chunk = this.currentChunks[this.currentChunkIndex];
    const utterance = new SpeechSynthesisUtterance(chunk);

    utterance.lang = 'tr-TR';
    if (this.turkishVoice) {
      utterance.voice = this.turkishVoice;
    }

    utterance.rate = this.currentOptions.rate || 1.0;
    utterance.pitch = this.currentOptions.pitch || 1.0;

    utterance.onend = () => {
      this.currentChunkIndex++;
      this.playNextChunk();
    };

    utterance.onerror = (event) => {
      // 'interrupted' veya 'canceled' genellikle kullanıcı durdurduğunda oluşur
      if (event.error !== 'interrupted' && event.error !== 'canceled') {
        console.warn('SpeechSynthesis error:', event);
        if (this.currentOptions.onError) {
          this.currentOptions.onError(event);
        }
      }
      this.isSpeakingState = false;
      this.activeId = null;
    };

    this.activeUtterance = utterance;

    try {
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error('Speech speak error:', err);
      this.isSpeakingState = false;
      this.activeId = null;
      if (this.currentOptions.onError) this.currentOptions.onError(err);
    }
  }
}

// Singleton servis örneği
export const speechService = new SpeechManager();
