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
 * Automatically detects and wraps un-delimited mathematical expressions with $...$
 * e.g. "f(x) = 2x^3 - 9x^2 + 12x - 1" -> "$f(x) = 2x^3 - 9x^2 + 12x - 1$"
 * e.g. "[0, 3] aralığında" -> "$[0, 3]$ aralığında"
 * e.g. "x = 1 ve x = 2" -> "$x = 1$ ve $x = 2$"
 */
const autoWrapMathExpressions = (text: string): string => {
  if (!text) return '';

  const isValidKaTeX = (str: string): boolean => {
    if (!str || str.length < 2) return false;
    try {
      katex.renderToString(str.trim(), { throwOnError: true });
      return true;
    } catch {
      return false;
    }
  };

  const tokens: Array<{ type: 'math' | 'text'; value: string }> = [];
  let remaining = text;

  // 1. Regex for already delimited math: $$...$$, $...$, \[...\], \(...\)
  const delimitedRegex = /^(\$\$[\s\S]+?\$\$|\$[^\$\n]+?\$|\\\[[\s\S]+?\\\]|\\\([^\\]+?\\\))/;

  // 2. Regex for raw LaTeX commands: \frac{a}{b}, \sqrt{x}, \int_a^b, \lim_{x \to 0}, \vec{v}, \alpha
  const rawLatexRegex = /^(\\(?:frac|sqrt|sum|int|lim|vec|alpha|beta|gamma|theta|pi|Delta|times|div|cdot|approx|equiv|le|ge|ne|pm|infty|log|ln|sin|cos|tan|cot|partial|binom)[a-zA-Z0-9_\{\}\(\)\^\+\-\*\/\s\.,\\]*)/;

  // 3. Regex for equations / functions: e.g. f(x) = 2x^3 - 9x^2 + 12x - 1 or y = 3x^2 - 4x + 1 or f'(x) = 6x^2 - 18x + 12 = 0
  const funcEqRegex = /^([a-zA-Z_](?:'{1,3}|\b)\s*(?:\([a-zA-Z0-9_\+\-\s,]+\))?\s*=\s*[-0-9a-zA-Z_\+\-\*\/\^\(\)\s\.,\\]+?)(?=[,\.]*(?:\s+(?:fonksiyon|polinom|denklem|bağıntı|eşitlik|olduğuna|için|aralığında|aralığı|eğrisi|doğrusu|kuralı|ifadesi|ise|ve\b|veya\b|olmak\b|veriliyor\b|noktası\b|şeklinde\b|değeri\b|olur\b|bulunur\b|yazılır\b)|[,\.\?!;]\s|\n|$))/i;

  // 4. Regex for expressions with exponents/subscripts: e.g. 2x^3 - 9x^2 + 12x - 1 or x^2 + y^2 = r^2
  const expExprRegex = /^([0-9a-zA-Z_\(\)\\]*(?:\^|_)\{?[0-9a-zA-Z_\+\-\*\/]+\}?(?:\s*[\+\-\*\/=]\s*[-0-9a-zA-Z_\(\)\^\/\.,\\]+)*)(?=[,\.]*(?:\s+[a-zA-ZğüşıöçİĞÜŞİÖÇ]|[,\.\?!;]\s|\n|$))/;

  // 5. Regex for mathematical intervals: e.g. [0, 3], (-1, 5], [a, b)
  const intervalRegex = /^(\[[^\]\n]+\]|\([0-9\s,\.\-+]+?\))(?=[,\.]*(?:\s*(?:aralığ|nokta|küme|için|ise|ve\b|veya\b|\n|$)))/i;

  // 6. Regex for simple equations or values: e.g. x = 1, x = -2, f(0) = -1, f(3) = 8
  const simpleEqRegex = /^([a-zA-Z_](?:'{1,3}|\b)(?:\([a-zA-Z0-9_\+\-]+\))?\s*=\s*-?\d+(?:[\.,]\d+)?)(?=[,\.]*(?:\s+[a-zA-ZğüşıöçİĞÜŞİÖÇ]|[,\.\?!;]\s|\n|$))/;

  // 7. Regex for factored equations: e.g. (x - 1)(x - 2) = 0 or (x - 2)
  const factoredRegex = /^(\((?:[a-zA-Z0-9_\+\-\*\/\^\s]+)\)(?:\((?:[a-zA-Z0-9_\+\-\*\/\^\s]+)\))*\s*(?:=\s*[-0-9a-zA-Z_\+\-\*\/\^\(\)\s\.,\\]+)?)(?=[,\.]*(?:\s+(?:ile|ve\b|veya\b|için|ise|olduğuna|kuralı|ifadesi|polinomu)|[,\.\?!;]\s|\n|$))/i;

  let maxIterations = 5000;
  while (remaining.length > 0 && maxIterations-- > 0) {
    // 1. Check delimited math
    const delimitedMatch = remaining.match(delimitedRegex);
    if (delimitedMatch) {
      tokens.push({ type: 'math', value: delimitedMatch[1] });
      remaining = remaining.slice(delimitedMatch[1].length);
      continue;
    }

    // 2. Check function equation
    const funcMatch = remaining.match(funcEqRegex);
    if (funcMatch && funcMatch[1].length > 3) {
      const trimmed = funcMatch[1].trim().replace(/[,\.]$/, '');
      if (isValidKaTeX(trimmed)) {
        tokens.push({ type: 'math', value: `$${trimmed}$` });
        remaining = remaining.slice(funcMatch[1].length);
        continue;
      }
    }

    // 3. Check exponent/subscript expression
    const expMatch = remaining.match(expExprRegex);
    if (expMatch && expMatch[1].length > 2) {
      const trimmed = expMatch[1].trim().replace(/[,\.]$/, '');
      if (isValidKaTeX(trimmed)) {
        tokens.push({ type: 'math', value: `$${trimmed}$` });
        remaining = remaining.slice(expMatch[1].length);
        continue;
      }
    }

    // 4. Check raw LaTeX commands
    const rawMatch = remaining.match(rawLatexRegex);
    if (rawMatch && rawMatch[1].length > 2) {
      const trimmed = rawMatch[1].trim().replace(/[,\.]$/, '');
      if (isValidKaTeX(trimmed)) {
        tokens.push({ type: 'math', value: `$${trimmed}$` });
        remaining = remaining.slice(rawMatch[1].length);
        continue;
      }
    }

    // 5. Check interval
    const intMatch = remaining.match(intervalRegex);
    if (intMatch && intMatch[1].length >= 4) {
      const trimmed = intMatch[1].trim().replace(/[,\.]$/, '');
      tokens.push({ type: 'math', value: `$${trimmed}$` });
      remaining = remaining.slice(intMatch[1].length);
      continue;
    }

    // 6. Check simple equation
    const simpleMatch = remaining.match(simpleEqRegex);
    if (simpleMatch && simpleMatch[1].length >= 3) {
      const trimmed = simpleMatch[1].trim().replace(/[,\.]$/, '');
      tokens.push({ type: 'math', value: `$${trimmed}$` });
      remaining = remaining.slice(simpleMatch[1].length);
      continue;
    }

    // 7. Check factored polynomial / binomial
    const factoredMatch = remaining.match(factoredRegex);
    if (factoredMatch && factoredMatch[1].length >= 3) {
      const trimmed = factoredMatch[1].trim().replace(/[,\.]$/, '');
      tokens.push({ type: 'math', value: `$${trimmed}$` });
      remaining = remaining.slice(factoredMatch[1].length);
      continue;
    }

    // Otherwise consume character as text
    if (tokens.length > 0 && tokens[tokens.length - 1].type === 'text') {
      tokens[tokens.length - 1].value += remaining[0];
    } else {
      tokens.push({ type: 'text', value: remaining[0] });
    }
    remaining = remaining.slice(1);
  }

  return tokens.map(t => t.value).join('');
};

/**
 * Parses a single text chunk that may contain inline math $...$ or \(...\)
 */
const parseInlineMathAndMarkdown = (text: string): React.ReactNode[] => {
  if (!text) return [];

  // Auto-detect and wrap un-delimited math expressions (e.g. f(x) = 2x^3 - 9x^2 + 12x - 1, [0, 3], etc.)
  const normalizedText = autoWrapMathExpressions(text);

  // Match inline math: $...$ or \(...\)
  // Non-greedy match for $...$ ensuring it's not empty and doesn't span multiple paragraphs
  const inlineMathRegex = /(\$(?:\\\$|[^\$])+?\$|\\\((?:\\\)|\s\S|[^\\])+?\\\))/g;
  const parts = normalizedText.split(inlineMathRegex);


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

interface SectionBlock {
  type: 'summary' | 'step' | 'answer' | 'tip' | 'paragraph' | 'block-math';
  title?: string;
  stepNumber?: number;
  content: string[];
}

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
      .replace(/\r\n/g, '\n');

    if (inline) {
      return (
        <span className={`latex-renderer-inline inline-flex items-center flex-wrap gap-0.5 ${className}`}>
          {parseInlineMathAndMarkdown(preprocessed)}
        </span>
      );
    }

    // Header matchers
    const isSummaryHeader = (l: string) => /^(?:#+\s*)?(?:1\.\s*)?(?:Konu Özeti|Temel Kural|Kavram Özeti|Ön Bilgi)[:\.-]?/i.test(l.trim());
    const isStepHeader = (l: string) => /^(?:#+\s*)?(?:(?:2\.\s*)?Adım\s*(\d+)[:\.-]?|(\d+)\.\s*Adım[:\.-]?|Çözüm\s*Adımı\s*(\d+)[:\.-]?|(\d+)\.\s*Durum[:\.-]?|Durum\s*(\d+)[:\.-]?|(\d+)\.\s*Aşama[:\.-]?)/i.test(l.trim());
    const isAnswerHeader = (l: string) => /^(?:#+\s*)?(?:3\.\s*)?(?:Doğru Cevap|Cevap|Sonuç)[:\.-]?/i.test(l.trim());
    const isTipHeader = (l: string) => /^(?:#+\s*)?(?:4\.\s*)?(?:İpucu(?:\s*\/\s*Pratik Taktik)?|Pratik Taktik|Taktik|Püf Noktası|Önemli Not)[:\.-]?/i.test(l.trim());

    // Group lines into logical section blocks
    const rawLines = preprocessed.split('\n');
    const blocks: SectionBlock[] = [];
    let currentBlock: SectionBlock | null = null;

    rawLines.forEach((line) => {
      const trimmed = line.trim();

      // Check for standalone display math: $$...$$ or \[...\]
      if ((trimmed.startsWith('$$') && trimmed.endsWith('$$') && trimmed.length > 3) ||
          (trimmed.startsWith('\\[') && trimmed.endsWith('\\]') && trimmed.length > 3)) {
        if (currentBlock) {
          blocks.push(currentBlock);
          currentBlock = null;
        }
        blocks.push({
          type: 'block-math',
          content: [trimmed]
        });
        return;
      }

      if (enableFormatting) {
        if (isSummaryHeader(trimmed)) {
          if (currentBlock) blocks.push(currentBlock);
          const contentAfterHeader = trimmed.replace(/^(?:#+\s*)?(?:1\.\s*)?(?:Konu Özeti|Temel Kural|Kavram Özeti|Ön Bilgi)[:\.-]?\s*/i, '').trim();
          currentBlock = {
            type: 'summary',
            title: 'Konu Özeti',
            content: contentAfterHeader ? [contentAfterHeader] : []
          };
          return;
        }

        if (isStepHeader(trimmed)) {
          if (currentBlock) blocks.push(currentBlock);
          const stepMatch = trimmed.match(/^(?:#+\s*)?(?:(?:2\.\s*)?Adım\s*(\d+)[:\.-]?|(\d+)\.\s*Adım[:\.-]?|Çözüm\s*Adımı\s*(\d+)[:\.-]?|(\d+)\.\s*Durum[:\.-]?|Durum\s*(\d+)[:\.-]?|(\d+)\.\s*Aşama[:\.-]?)/i);
          const stepNum = stepMatch ? parseInt(stepMatch[1] || stepMatch[2] || stepMatch[3] || stepMatch[4] || stepMatch[5] || stepMatch[6] || '1', 10) : undefined;
          const isDurum = /durum/i.test(trimmed);
          const titleText = isDurum ? `${stepNum || ''}. DURUM` : `${stepNum || ''}. ADIM`;
          const contentAfterHeader = trimmed.replace(/^(?:#+\s*)?(?:(?:2\.\s*)?Adım\s*\d+[:\.-]?|\d+\.\s*Adım[:\.-]?|Çözüm\s*Adımı\s*\d+[:\.-]?|\d+\.\s*Durum[:\.-]?|Durum\s*\d+[:\.-]?|\d+\.\s*Aşama[:\.-]?)\s*/i, '').trim();
          currentBlock = {
            type: 'step',
            stepNumber: stepNum,
            title: titleText,
            content: contentAfterHeader ? [contentAfterHeader] : []
          };
          return;
        }

        if (isAnswerHeader(trimmed)) {
          if (currentBlock) blocks.push(currentBlock);
          const contentAfterHeader = trimmed.replace(/^(?:#+\s*)?(?:3\.\s*)?(?:Doğru Cevap|Cevap|Sonuç)[:\.-]?\s*/i, '').trim();
          currentBlock = {
            type: 'answer',
            title: 'Doğru Cevap',
            content: contentAfterHeader ? [contentAfterHeader] : []
          };
          return;
        }

        if (isTipHeader(trimmed)) {
          if (currentBlock) blocks.push(currentBlock);
          const contentAfterHeader = trimmed.replace(/^(?:#+\s*)?(?:4\.\s*)?(?:İpucu(?:\s*\/\s*Pratik Taktik)?|Pratik Taktik|Taktik|Püf Noktası|Önemli Not)[:\.-]?\s*/i, '').trim();
          currentBlock = {
            type: 'tip',
            title: 'İpucu / Pratik Taktik',
            content: contentAfterHeader ? [contentAfterHeader] : []
          };
          return;
        }
      }

      // Normal line
      if (trimmed === '') {
        if (currentBlock && currentBlock.content.length > 0 && currentBlock.content[currentBlock.content.length - 1] !== '') {
          currentBlock.content.push('');
        }
        return;
      }

      if (currentBlock) {
        currentBlock.content.push(trimmed);
      } else {
        currentBlock = {
          type: 'paragraph',
          content: [trimmed]
        };
      }
    });

    if (currentBlock) blocks.push(currentBlock);

    // Now render each SectionBlock
    const elements: React.ReactNode[] = [];
    let elementKey = 0;

    blocks.forEach((block) => {
      // 1. Block Math
      if (block.type === 'block-math') {
        const math = block.content[0].replace(/^(\$\$|\\\[)/, '').replace(/(\$\$|\\\])$/, '');
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

      // 2. Summary Card
      if (block.type === 'summary') {
        elements.push(
          <div 
            key={`summary-${elementKey++}`}
            className="my-3 p-3.5 sm:p-4 bg-indigo-950/30 border border-indigo-500/30 rounded-2xl space-y-2 shadow-md backdrop-blur-sm"
          >
            <div className="flex items-center space-x-2 text-indigo-400 font-extrabold text-xs uppercase tracking-wider">
              <BookOpen className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>{block.title || 'Konu Özeti'}</span>
            </div>
            <div className="text-slate-200 space-y-1.5 font-medium">
              {block.content.filter(Boolean).map((line, lIdx) => (
                <p key={lIdx} className="text-xs text-indigo-200/90 leading-relaxed py-0.5">
                  {parseInlineMathAndMarkdown(line)}
                </p>
              ))}
            </div>
          </div>
        );
        return;
      }

      // 3. Step Card (⚡ 1. ADIM, ⚡ 2. ADIM...)
      if (block.type === 'step') {
        elements.push(
          <div 
            key={`step-${elementKey++}`}
            className="my-3 p-3.5 sm:p-4 bg-slate-900/90 border border-slate-800 hover:border-purple-500/40 rounded-2xl text-xs leading-relaxed shadow-sm transition-all border-l-4 border-l-purple-500 space-y-2"
          >
            {showStepNumbers && (
              <div className="flex items-center space-x-1.5 text-purple-400 font-extrabold text-xs uppercase tracking-wider">
                <Zap className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span>{block.title || `${block.stepNumber}. ADIM`}</span>
              </div>
            )}
            <div className="text-slate-200 space-y-1.5 font-medium">
              {block.content.filter(Boolean).map((line, lIdx) => {
                if (line.startsWith('- ') || line.startsWith('* ')) {
                  return (
                    <div key={lIdx} className="ml-3 pl-2 py-0.5 flex items-start space-x-2 text-xs text-slate-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5 shrink-0" />
                      <div className="flex-1">{parseInlineMathAndMarkdown(line.slice(2))}</div>
                    </div>
                  );
                }
                return (
                  <p key={lIdx} className="text-xs text-slate-200 leading-relaxed py-0.5">
                    {parseInlineMathAndMarkdown(line)}
                  </p>
                );
              })}
            </div>
          </div>
        );
        return;
      }

      // 4. Correct Answer Card
      if (block.type === 'answer') {
        elements.push(
          <div 
            key={`answer-${elementKey++}`}
            className="my-3 p-3.5 sm:p-4 bg-gradient-to-r from-emerald-950/50 via-emerald-900/30 to-slate-950/60 border-2 border-emerald-500/40 rounded-2xl flex items-start space-x-3 shadow-lg"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">Doğru Cevap</span>
              <div className="text-xs sm:text-sm font-black text-emerald-300">
                {block.content.filter(Boolean).map((line, lIdx) => (
                  <div key={lIdx}>{parseInlineMathAndMarkdown(line)}</div>
                ))}
              </div>
            </div>
          </div>
        );
        return;
      }

      // 5. Tip / Tactic Card
      if (block.type === 'tip') {
        elements.push(
          <div 
            key={`tip-${elementKey++}`}
            className="my-3 p-3.5 sm:p-4 bg-gradient-to-r from-amber-950/40 to-slate-950/60 border border-amber-500/30 rounded-2xl flex items-start space-x-3 shadow-md"
          >
            <div className="p-1.5 bg-amber-500/20 rounded-xl text-amber-400 shrink-0 mt-0.5">
              <Lightbulb className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">İpucu / Pratik Taktik</span>
              <div className="text-xs text-amber-200/90 leading-relaxed font-medium">
                {block.content.filter(Boolean).map((line, lIdx) => (
                  <p key={lIdx} className="py-0.5">{parseInlineMathAndMarkdown(line)}</p>
                ))}
              </div>
            </div>
          </div>
        );
        return;
      }

      // 6. Normal Paragraph Group
      if (block.type === 'paragraph') {
        elements.push(
          <div key={`p-group-${elementKey++}`} className="my-2 space-y-1">
            {block.content.filter(Boolean).map((line, lIdx) => {
              if (line.startsWith('- ') || line.startsWith('* ')) {
                return (
                  <div key={lIdx} className="ml-3 sm:ml-4 pl-2 py-0.5 flex items-start space-x-2 text-xs text-slate-300 leading-relaxed">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                    <div className="flex-1">{parseInlineMathAndMarkdown(line.slice(2))}</div>
                  </div>
                );
              }
              return (
                <p key={lIdx} className="text-xs text-slate-300 leading-relaxed py-0.5">
                  {parseInlineMathAndMarkdown(line)}
                </p>
              );
            })}
          </div>
        );
        return;
      }
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

