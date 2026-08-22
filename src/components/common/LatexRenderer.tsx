import React, { useMemo } from 'react';
import katex from 'katex';
import { Sparkles, CheckCircle2, BookOpen, Lightbulb, ArrowRight, Zap } from 'lucide-react';

interface LatexRendererProps {
  content: string;
  className?: string;
  inline?: boolean;
  enableFormatting?: boolean;
  showStepNumbers?: boolean;
}

/**
 * Safely renders LaTeX equations using KaTeX.
 * Handles both block ($$, \[\]) and inline ($, \(\)) math formulas.
 */
const renderKatexSafe = (mathStr: string, displayMode: boolean = false): string => {
  try {
    return katex.renderToString(mathStr.trim(), {
      throwOnError: false,
      displayMode,
      output: 'htmlAndMathml'
    });
  } catch {
    return `<span class="text-amber-300 font-mono">${mathStr}</span>`;
  }
};

/**
 * Parses a single text chunk that may contain inline math $...$ or \(...\)
 */
const parseInlineMathAndMarkdown = (text: string): React.ReactNode[] => {
  if (!text) return [];

  // Match inline math: $...$ or \(...\)
  // Non-greedy match for $...$ ensuring it's not empty and doesn't span multiple paragraphs
  const inlineMathRegex = /(\$(?:\\\$|[^\$])+?\$|\\\((?:\\\)|\s\S|[^\\])+?\\\))/g;
  const parts = text.split(inlineMathRegex);

  return parts.map((part, index) => {
    if (!part) return null;

    // Check if part is $...$ or \(...\)
    if (part.startsWith('$') && part.endsWith('$') && part.length > 1) {
      const math = part.slice(1, -1);
      const html = renderKatexSafe(math, false);
      return (
        <span 
          key={`math-${index}`} 
          className="inline-latex px-0.5" 
          dangerouslySetInnerHTML={{ __html: html }} 
        />
      );
    }

    if (part.startsWith('\\(') && part.endsWith('\\)') && part.length > 3) {
      const math = part.slice(2, -2);
      const html = renderKatexSafe(math, false);
      return (
        <span 
          key={`math-${index}`} 
          className="inline-latex px-0.5" 
          dangerouslySetInnerHTML={{ __html: html }} 
        />
      );
    }

    // Check for raw unquoted LaTeX math commands (like \frac{a}{b} or \sqrt{x}) if not surrounded by $
    if (/\\(frac|sqrt|cdot|times|implies|approx|le|ge|ne|int|sum|lim|Delta|alpha|beta|theta|pi)\b/.test(part) && !part.includes('<span')) {
      // If the whole part is a math formula
      if (/^(\s*\\(?:frac|sqrt|sum|int|lim|vec)[^{]*\{[^}]*\}.*|\s*[\w\d\s\+\-\=\/\*\\_]+)$/.test(part) && (part.includes('\\frac') || part.includes('\\sqrt') || part.includes('\\int'))) {
        const html = renderKatexSafe(part, false);
        return (
          <span 
            key={`raw-math-${index}`} 
            className="inline-latex px-0.5" 
            dangerouslySetInnerHTML={{ __html: html }} 
          />
        );
      }
    }

    // Process markdown **bold**
    const boldParts = part.split(/(\*\*[^\*]+?\*\*)/g);
    return (
      <React.Fragment key={`text-${index}`}>
        {boldParts.map((bPart, bIdx) => {
          if (bPart.startsWith('**') && bPart.endsWith('**') && bPart.length > 4) {
            const boldText = bPart.slice(2, -2);
            return (
              <strong key={bIdx} className="text-amber-300 font-extrabold tracking-wide">
                {boldText}
              </strong>
            );
          }
          return bPart;
        })}
      </React.Fragment>
    );
  });
};

export const LatexRenderer: React.FC<LatexRendererProps> = ({
  content,
  className = '',
  inline = false,
  enableFormatting = true,
  showStepNumbers = true
}) => {
  const renderedElements = useMemo(() => {
    if (!content) return null;

    // Normalize text line breaks and double escapes
    const preprocessed = content
      .replace(/\\r\\n/g, '\n')
      .replace(/\\n/g, '\n')
      .replace(/\r\n/g, '\n')
      // Ensure double line breaks before standard solution section headers if squashed
      .replace(/([^\n])\s*(Adım \d+[:\.-])/gi, '$1\n\n$2')
      .replace(/([^\n])\s*(\d+\.\s+Adım[:\.-])/gi, '$1\n\n$2')
      .replace(/([^\n])\s*(Konu Özeti[:\.-])/gi, '$1\n\n$2')
      .replace(/([^\n])\s*(Doğru Cevap[:\.-])/gi, '$1\n\n$2')
      .replace(/([^\n])\s*(Pratik Taktik[:\.-]|İpucu[:\.-])/gi, '$1\n\n$2')
      .replace(/([^\n])\s*(Çözüm[:\.-])/gi, '$1\n\n$2')
      .replace(/([^\n])\s*(Sonuç[:\.-])/gi, '$1\n\n$2');

    if (inline) {
      return (
        <span className={`latex-renderer-inline inline-flex items-center flex-wrap gap-0.5 ${className}`}>
          {parseInlineMathAndMarkdown(preprocessed)}
        </span>
      );
    }

    // Split content by block math ($$...$$ or \[...\])
    const blockMathRegex = /(\$\$(?:\\\$|[^\$])+?\$\$|\\\[(?:\\\]|\s\S|[^\\])+?\\\])/g;
    const segments = preprocessed.split(blockMathRegex);

    const elements: React.ReactNode[] = [];
    let elementKey = 0;

    segments.forEach((segment) => {
      if (!segment) return;

      // 1. Is this a display / block math segment? ($$...$$ or \[...\])
      if (segment.startsWith('$$') && segment.endsWith('$$') && segment.length > 3) {
        const math = segment.slice(2, -2);
        const html = renderKatexSafe(math, true);
        elements.push(
          <div 
            key={`block-math-${elementKey++}`}
            className="my-3 py-2.5 px-4 bg-slate-950/80 rounded-2xl border border-indigo-500/20 overflow-x-auto text-center font-sans shadow-inner scrollbar-thin"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        );
        return;
      }

      if (segment.startsWith('\\[') && segment.endsWith('\\]') && segment.length > 3) {
        const math = segment.slice(2, -2);
        const html = renderKatexSafe(math, true);
        elements.push(
          <div 
            key={`block-math-${elementKey++}`}
            className="my-3 py-2.5 px-4 bg-slate-950/80 rounded-2xl border border-indigo-500/20 overflow-x-auto text-center font-sans shadow-inner scrollbar-thin"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        );
        return;
      }

      // 2. Normal text lines processing
      const lines = segment.split('\n');
      lines.forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed) {
          elements.push(<div key={`blank-${elementKey++}`} className="h-1.5" />);
          return;
        }

        const lower = trimmed.toLowerCase();

        // ─── Özel Formatlanmış Bloklar (EnableFormatting aktifse) ───
        if (enableFormatting) {
          // A) KONU ÖZETİ / TEMEL FORMÜL KARTI
          if (lower.startsWith('konu özeti') || lower.startsWith('1. konu özeti') || lower.startsWith('## konu özeti')) {
            const cleanTitle = trimmed.replace(/^#+\s*/, '');
            elements.push(
              <div 
                key={`summary-${elementKey++}`}
                className="my-2.5 p-3 sm:p-4 bg-indigo-950/30 border border-indigo-500/30 rounded-2xl space-y-1.5 shadow-md backdrop-blur-sm"
              >
                <div className="flex items-center space-x-2 text-indigo-400 font-extrabold text-xs uppercase tracking-wider">
                  <BookOpen className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>{parseInlineMathAndMarkdown(cleanTitle)}</span>
                </div>
              </div>
            );
            return;
          }

          // B) DOĞRU CEVAP KARTI
          if (lower.startsWith('doğru cevap') || lower.startsWith('3. doğru cevap') || lower.startsWith('cevap:')) {
            elements.push(
              <div 
                key={`answer-${elementKey++}`}
                className="my-2.5 p-3 sm:p-3.5 bg-gradient-to-r from-emerald-950/50 via-emerald-900/30 to-slate-950/60 border-2 border-emerald-500/40 rounded-2xl flex items-center space-x-3 shadow-lg"
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="text-xs sm:text-sm font-black text-emerald-300">
                  {parseInlineMathAndMarkdown(trimmed)}
                </div>
              </div>
            );
            return;
          }

          // C) PRATİK TAKTİK / İPUCU KARTI
          if (lower.startsWith('ipucu') || lower.startsWith('4. ipucu') || lower.startsWith('pratik taktik') || lower.startsWith('taktik:')) {
            elements.push(
              <div 
                key={`tip-${elementKey++}`}
                className="my-2.5 p-3 sm:p-3.5 bg-gradient-to-r from-amber-950/40 to-slate-950/60 border border-amber-500/30 rounded-2xl flex items-start space-x-2.5 shadow-md"
              >
                <div className="p-1 bg-amber-500/20 rounded-lg text-amber-400 shrink-0 mt-0.5">
                  <Lightbulb className="w-4 h-4" />
                </div>
                <div className="text-xs text-amber-200/90 leading-relaxed">
                  {parseInlineMathAndMarkdown(trimmed)}
                </div>
              </div>
            );
            return;
          }

          // D) ÇÖZÜM ADIMLARI (Adım 1, 1. Adım, 2. Adım...)
          const stepMatch = trimmed.match(/^(?:(?:2\.\s*)?Adım\s*(\d+)[:\.-]?|(\d+)\.\s*Adım[:\.-]?)/i);
          if (stepMatch || (trimmed.startsWith('Adım ') || (lower.startsWith('çözüm:') && !lower.includes('rehberi')))) {
            const stepNum = stepMatch ? (stepMatch[1] || stepMatch[2]) : null;
            elements.push(
              <div 
                key={`step-${elementKey++}`}
                className="my-2 p-3 sm:p-3.5 bg-slate-900/90 border border-slate-800 hover:border-purple-500/30 rounded-2xl text-xs text-slate-200 leading-relaxed shadow-sm transition-all border-l-4 border-l-purple-500"
              >
                {stepNum && showStepNumbers && (
                  <div className="flex items-center space-x-1.5 text-purple-400 font-extrabold text-[11px] mb-1">
                    <Zap className="w-3 h-3 text-purple-400" />
                    <span>{stepNum}. ADIM</span>
                  </div>
                )}
                <div className="text-slate-200">
                  {parseInlineMathAndMarkdown(trimmed)}
                </div>
              </div>
            );
            return;
          }

          // E) LİSTE MADDELERİ (- veya *)
          if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            const listContent = trimmed.slice(2);
            elements.push(
              <div 
                key={`list-${elementKey++}`}
                className="ml-3 sm:ml-4 pl-2 py-1 flex items-start space-x-2 text-xs text-slate-300 leading-relaxed"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                <div className="flex-1">
                  {parseInlineMathAndMarkdown(listContent)}
                </div>
              </div>
            );
            return;
          }
        }

        // F) STANDART PARAGRAF
        elements.push(
          <p key={`p-${elementKey++}`} className="text-xs text-slate-300 leading-relaxed py-0.5">
            {parseInlineMathAndMarkdown(trimmed)}
          </p>
        );
      });
    });

    return elements;
  }, [content, className, inline, enableFormatting, showStepNumbers]);

  if (!content) return null;

  return (
    <div className={`latex-content-container space-y-1 ${className}`}>
      {renderedElements}
    </div>
  );
};
