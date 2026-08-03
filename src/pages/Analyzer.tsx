import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { EditorView, basicSetup } from 'codemirror';
import { EditorState, Compartment, StateEffect, StateField, RangeSet, RangeSetBuilder, type Extension } from '@codemirror/state';
import { Command } from 'cmdk';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { java } from '@codemirror/lang-java';
import { cpp } from '@codemirror/lang-cpp';
import { lineNumbers, GutterMarker, gutter, keymap } from '@codemirror/view';
import { Decoration, type DecorationSet } from '@codemirror/view';
import { oneDark } from '@codemirror/theme-one-dark';
import html2canvas from 'html2canvas';
import LZString from 'lz-string';
import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer';
import type { ViewUpdate } from '@codemirror/view';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Tooltip } from '@/components/ui/Tooltip';
import { analyzeCode, type AnalysisResult, type SupportedLanguage, type LoopInfo, type ComplexityClass } from '@/lib/analyzer';
import { useToast } from '@/components/ui/Toast';
import SampleGallery from '@/components/SampleGallery';
import type { Sample } from '@/data/samples';
import OnboardingTour from '@/components/OnboardingTour';
import ShortcutsModal from '@/components/ShortcutsModal';

const LANG_EXTENSIONS: Record<SupportedLanguage, Extension> = {
  javascript: javascript(),
  typescript: javascript({ typescript: true }),
  python: python(),
  java: java(),
  c: cpp(),
  cpp: cpp()
};

const LANG_META: Record<Language, { icon: string; label: string; accent: string }> = {
  javascript: { icon: '🟨', label: 'JavaScript', accent: 'text-yellow-600' },
  typescript: { icon: '🔷', label: 'TypeScript', accent: 'text-blue-600' },
  python:     { icon: '🐍', label: 'Python',     accent: 'text-emerald-600' },
  java:       { icon: '☕', label: 'Java',       accent: 'text-orange-600' },
  c:          { icon: 'C', label: 'C', accent: 'text-slate-600' },
  cpp:        { icon: '⚙️', label: 'C++',        accent: 'text-sky-600' },
};

type Language = SupportedLanguage;
type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'outline';
type Mode = 'single' | 'compare';
type TabSection =
  | 'overview'
  | 'algorithm'
  | 'loops'
  | 'complexity'
  | 'memory'
  | 'optimizations';

const SECTION_TABS: { id: TabSection; label: string; icon: string; hint: string }[] = [
  { id: 'overview', label: 'Breakdown', icon: '📊', hint: 'Language, summary, and algorithm' },
  { id: 'complexity', label: 'Complexity', icon: '⚡', hint: 'Time, space, and derivation' },
  { id: 'loops', label: 'Loops', icon: '🔁', hint: 'Loop and recursion details' },
  { id: 'memory', label: 'Memory', icon: '💾', hint: 'Memory and performance notes' },
  { id: 'optimizations', label: 'Optimize', icon: '🚀', hint: 'How to improve it' },
];

const FILE_NAME: Record<Language, string> = {
  javascript: 'Main.js',
  typescript: 'Main.ts',
  python: 'main.py',
  java: 'Main.java',
  c: 'main.c',
  cpp: 'main.cpp',
};

/**
 * Heuristic brace-based code formatter (prettier-lite) — works for
 * C-style brace languages (JS/TS/Java/C++). For Python, preserves existing
 * leading whitespace and only trims trailing blank lines.
 */
function formatCode(src: string, lang: Language): string {
  if (!src.trim()) return '';
  if (lang === 'python') {
    return src.replace(/\s+$/gm, '').replace(/\n{3,}/g, '\n\n').replace(/^\n+|\n+$/g, '') + '\n';
  }
  const lines = src.replace(/\r\n/g, '\n').split('\n');
  let indent = 0;
  const result: string[] = [];
  const INDENT_UNIT = '  ';
  for (let raw of lines) {
    const line = raw.trim();
    if (!line) { result.push(''); continue; }
    const opens = (line.match(/[\{\(\[]/g) || []).length;
    const closes = (line.match(/[\}\)\]]/g) || []).length;
    const startsWithClose = /^[\}\)\]]/.test(line);
    if (startsWithClose && indent > 0) indent--;
    result.push(INDENT_UNIT.repeat(Math.max(0, indent)) + line);
    indent += opens - closes;
    if (startsWithClose) {
      indent = Math.max(0, indent + 1);
      const net = opens - closes;
      indent = Math.max(0, indent - 1 + net);
    }
    indent = Math.max(0, indent);
  }
  return result.join('\n').replace(/\n{3,}/g, '\n\n').replace(/^\n+|\n+$/g, '') + '\n';
}

type SharePayload = {
  version: 1;
  mode: Mode;
  single?: {
    code: string;
    language: Language;
    result: AnalysisResult | null;
  };
  compare?: {
    leftCode: string;
    rightCode: string;
    leftLang: Language;
    rightLang: Language;
    leftResult: AnalysisResult | null;
    rightResult: AnalysisResult | null;
  };
};

interface RefactorSuggestion {
  title: string;
  explanation: string;
  code: string;
}

function encodeSharePayload(payload: SharePayload): string {
  return LZString.compressToEncodedURIComponent(JSON.stringify(payload));
}

function decodeSharePayload(encoded: string): SharePayload | null {
  try {
    const raw = LZString.decompressFromEncodedURIComponent(encoded);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SharePayload;
    return parsed?.version === 1 ? parsed : null;
  } catch {
    return null;
  }
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function hasQuadraticOrWorseComplexity(result: AnalysisResult | null): boolean {
  if (!result) return false;
  return getComplexityRank(result.timeComplexity) >= getComplexityRank('O(n²)');
}

function buildHeuristicRefactor(source: string, language: Language, result: AnalysisResult | null): RefactorSuggestion | null {
  if (!source.trim() || !hasQuadraticOrWorseComplexity(result)) return null;

  const looksLikePairSearch = /target|sum|pair|two sum|duplicate|contains/i.test(source);
  const explanation = 'A hash-backed pass removes the nested scan and turns repeated membership checks into O(1) lookups.';

  switch (language) {
    case 'python':
      return {
        title: looksLikePairSearch ? 'Use a set to track complements' : 'Use a set to track seen values',
        explanation,
        code: formatCode(looksLikePairSearch
          ? `def has_pair_sum(nums, target):
    seen = set()
    for num in nums:
        needed = target - num
        if needed in seen:
            return True
        seen.add(num)
    return False`
          : `def has_duplicate(values):
    seen = set()
    for value in values:
        if value in seen:
            return True
        seen.add(value)
    return False`, 'python'),
      };
    case 'java':
      return {
        title: looksLikePairSearch ? 'Use HashSet complements' : 'Use HashSet membership checks',
        explanation,
        code: formatCode(looksLikePairSearch
          ? `public static boolean hasPairSum(int[] nums, int target) {
    java.util.HashSet<Integer> seen = new java.util.HashSet<>();
    for (int num : nums) {
        int needed = target - num;
        if (seen.contains(needed)) return true;
        seen.add(num);
    }
    return false;
}`
          : `public static boolean hasDuplicate(int[] values) {
    java.util.HashSet<Integer> seen = new java.util.HashSet<>();
    for (int value : values) {
        if (seen.contains(value)) return true;
        seen.add(value);
    }
    return false;
}`, 'java'),
      };
    case 'cpp':
      return {
        title: looksLikePairSearch ? 'Use an unordered_set for complements' : 'Use an unordered_set for seen values',
        explanation,
        code: formatCode(looksLikePairSearch
          ? `#include <unordered_set>
#include <vector>

bool hasPairSum(const std::vector<int>& nums, int target) {
  std::unordered_set<int> seen;
  for (int num : nums) {
    int needed = target - num;
    if (seen.count(needed)) return true;
    seen.insert(num);
  }
  return false;
}`
          : `#include <unordered_set>
#include <vector>

bool hasDuplicate(const std::vector<int>& values) {
  std::unordered_set<int> seen;
  for (int value : values) {
    if (seen.count(value)) return true;
    seen.insert(value);
  }
  return false;
}`, 'cpp'),
      };
    default:
      return {
        title: looksLikePairSearch ? 'Use a set to track complements' : 'Use a set to track seen values',
        explanation,
        code: formatCode(looksLikePairSearch
          ? `function hasPairSum(nums, target) {
  const seen = new Set();
  for (const num of nums) {
    const needed = target - num;
    if (seen.has(needed)) return true;
    seen.add(num);
  }
  return false;
}`
          : `function hasDuplicate(values) {
  const seen = new Set();
  for (const value of values) {
    if (seen.has(value)) return true;
    seen.add(value);
  }
  return false;
}`, language),
      };
  }
}

const pdfStyles = StyleSheet.create({
  page: {
    paddingTop: 28,
    paddingHorizontal: 28,
    paddingBottom: 28,
    fontSize: 10,
    color: '#0f172a',
    backgroundColor: '#ffffff',
    fontFamily: 'Helvetica',
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 9,
    color: '#475569',
    marginBottom: 14,
  },
  section: {
    marginBottom: 12,
    padding: 10,
    border: '1px solid #e2e8f0',
    borderRadius: 10,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    marginBottom: 6,
  },
  mono: {
    fontFamily: 'Courier',
    fontSize: 8.5,
    whiteSpace: 'pre-wrap',
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  column: {
    flexGrow: 1,
  },
});

function AnalysisPdfDocument({
  mode,
  code,
  language,
  result,
  leftCode,
  rightCode,
  leftLang,
  rightLang,
  leftResult,
  rightResult,
}: {
  mode: Mode;
  code?: string;
  language?: Language;
  result?: AnalysisResult | null;
  leftCode?: string;
  rightCode?: string;
  leftLang?: Language;
  rightLang?: Language;
  leftResult?: AnalysisResult | null;
  rightResult?: AnalysisResult | null;
}) {
  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <Text style={pdfStyles.title}>Big-O Analyzer Report</Text>
        <Text style={pdfStyles.subtitle}>Generated from the live analysis state in the app.</Text>
        {mode === 'single' && result && (
          <>
            <View style={pdfStyles.section}>
              <Text style={pdfStyles.sectionTitle}>Summary</Text>
              <Text>{language?.toUpperCase()} · {result.timeComplexity} · {Math.round(result.timeConfidence)}% confidence</Text>
              <Text style={{ marginTop: 6 }}>{result.detailed.highLevelSummary}</Text>
            </View>
            <View style={pdfStyles.section}>
              <Text style={pdfStyles.sectionTitle}>Snippet</Text>
              <Text style={pdfStyles.mono}>{code?.slice(0, 3200) ?? ''}</Text>
            </View>
            <View style={pdfStyles.section}>
              <Text style={pdfStyles.sectionTitle}>Optimizations</Text>
              {result.detailed.possibleOptimizations.slice(0, 5).map((item, index) => (
                <Text key={index} style={{ marginBottom: 4 }}>• {item}</Text>
              ))}
            </View>
          </>
        )}
        {mode === 'compare' && leftResult && rightResult && (
          <>
            <View style={pdfStyles.section}>
              <Text style={pdfStyles.sectionTitle}>Verdict</Text>
              <Text>{leftResult.timeComplexity} vs {rightResult.timeComplexity}</Text>
              <Text style={{ marginTop: 6 }}>Snippet A: {leftLang?.toUpperCase()} · Snippet B: {rightLang?.toUpperCase()}</Text>
            </View>
            <View style={pdfStyles.row}>
              <View style={[pdfStyles.section, pdfStyles.column]}>
                <Text style={pdfStyles.sectionTitle}>Snippet A</Text>
                <Text>{leftResult.timeComplexity} · {Math.round(leftResult.timeConfidence)}%</Text>
                <Text style={pdfStyles.mono}>{leftCode?.slice(0, 1800) ?? ''}</Text>
              </View>
              <View style={[pdfStyles.section, pdfStyles.column]}>
                <Text style={pdfStyles.sectionTitle}>Snippet B</Text>
                <Text>{rightResult.timeComplexity} · {Math.round(rightResult.timeConfidence)}%</Text>
                <Text style={pdfStyles.mono}>{rightCode?.slice(0, 1800) ?? ''}</Text>
              </View>
            </View>
          </>
        )}
      </Page>
    </Document>
  );
}

/**
 * Map a nesting depth to a Big-O label for display on loop gutter markers.
 * Falls back to the loop header type for implicit-method loops.
 */
function loopComplexityBadge(loop: LoopInfo): string {
  const depth = loop.nestingDepth;
  if (loop.hasSortCall) return depth === 0 ? 'O(n log n)' : 'O(n² log n)';
  if (depth === 0) return 'O(n)';
  if (depth === 1) return 'O(n²)';
  if (depth === 2) return 'O(n³)';
  return `O(n^${depth + 1})`;
}

/** Gutter marker widget showing an O() badge on detected loop lines. */
class LoopGutterBadge extends GutterMarker {
  constructor(readonly label: string, readonly depth: number) { super(); }
  eq(other: LoopGutterBadge) { return other.label === this.label; }
  toDOM() {
    const el = document.createElement('div');
    const tone =
      this.depth === 0 ? 'rgba(245,158,11,0.85)' :
      this.depth === 1 ? 'rgba(239,68,68,0.9)' :
      'rgba(239,68,68,0.95)';
    const bg =
      this.depth === 0 ? 'rgba(245,158,11,0.12)' :
      this.depth === 1 ? 'rgba(239,68,68,0.12)' :
      'rgba(239,68,68,0.18)';
    el.title = `Contributes ${this.label} (nesting depth ${this.depth + 1})`;
    el.textContent = this.label;
    el.style.cssText = `
      font-family: JetBrains Mono, ui-monospace, monospace;
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 0.1px;
      color: ${tone};
      background: ${bg};
      border: 1px solid ${tone.replace(/[\d.]+\)$/, '0.3)')};
      border-radius: 6px;
      padding: 1px 5px;
      line-height: 1.4;
      margin-left: -2px;
      transform: translateX(-3px);
      pointer-events: auto;
      cursor: help;
      white-space: nowrap;
      box-shadow: 0 0 0 1px rgba(255,255,255,0.03) inset;
    `;
    return el;
  }
}

const setLoopMarkersEffect = StateEffect.define<DecorationSet>();

const loopMarkersField = StateField.define<DecorationSet>({
  create() { return Decoration.none; },
  update(prev, tr) {
    for (const e of tr.effects) if (e.is(setLoopMarkersEffect)) return e.value;
    return prev.map(tr.changes);
  },
  provide: (f) => EditorView.decorations.from(f),
});

const loopBadgeGutter = gutter({
  class: 'cm-loopBadge-gutter',
  markers: (view) => {
    const decorations = view.state.field(loopMarkersField, false);
    if (!decorations) return RangeSet.empty;
    const builder = new RangeSetBuilder<GutterMarker>();
    const addedLines = new Set<number>();
    decorations.between(0, view.state.doc.length, (f: number, _t: number, d: any) => {
      const spec = d?.spec?.loopMarkerSpec;
      if (!spec) return;
      try {
        const line = view.state.doc.lineAt(f);
        if (!addedLines.has(line.number)) {
          addedLines.add(line.number);
          builder.add(line.from, line.from, new LoopGutterBadge(spec.label, spec.depth));
        }
      } catch { /* ignore */ }
    });
    return builder.finish();
  },
});

const themeLoopUnderlines = EditorView.baseTheme({
  '.cm-loopBadge-gutter': {
    width: 'auto',
    padding: '0 4px 0 2px',
    minWidth: '8px',
  },
  '.cm-activeLine cm-loopBadge-gutter': {
    background: 'transparent',
  },
  // Soft squiggly underlines + subtle highlight bg for loops contributing to complexity
  '.cm-loopHighlight-oN': {
    background: 'rgba(245, 158, 11, 0.08)',
    textDecoration: 'wavy underline rgba(245, 158, 11, 0.55)',
    textUnderlineOffset: '3px',
    textDecorationThickness: '1.5px',
  },
  '.cm-loopHighlight-oN2': {
    background: 'rgba(239, 68, 68, 0.1)',
    textDecoration: 'wavy underline rgba(239, 68, 68, 0.6)',
    textUnderlineOffset: '3px',
    textDecorationThickness: '1.5px',
  },
  '.cm-loopHighlight-oN3': {
    background: 'rgba(239, 68, 68, 0.14)',
    textDecoration: 'wavy underline rgba(239, 68, 68, 0.7)',
    textUnderlineOffset: '3px',
    textDecorationThickness: '1.8px',
  },
  '&dark .cm-loopHighlight-oN': {
    background: 'rgba(245, 158, 11, 0.09)',
  },
  '&dark .cm-loopHighlight-oN2': {
    background: 'rgba(239, 68, 68, 0.11)',
  },
  '&dark .cm-loopHighlight-oN3': {
    background: 'rgba(239, 68, 68, 0.15)',
  },
});

const getComplexityRank = (c: string): number => {
  const order = ['O(1)', 'O(log n)', 'O(√n)', 'O(n)', 'O(n log n)', 'O(n²)', 'O(n² log n)', 'O(n³)', 'O(n³ log n)', 'O(2ⁿ)'];
  const idx = order.indexOf(c);
  return idx === -1 ? 99 : idx;
};

const getComplexityColor = (complexity: string): BadgeVariant => {
  if (complexity.includes('O(1)') || complexity.includes('O(log')) return 'success';
  if (complexity.includes('O(n)') || complexity.includes('O(n log')) return 'warning';
  if (complexity.includes('O(n²)') || complexity.includes('O(n³)') || complexity.includes('O(2ⁿ')) return 'danger';
  return 'default';
};

const getGlowClass = (v: BadgeVariant): string => {
  if (v === 'success') return 'glow-success';
  if (v === 'warning') return 'glow-warning';
  if (v === 'danger') return 'glow-danger';
  if (v === 'primary') return 'glow-primary';
  return '';
};

type LineTone = 'danger' | 'success';

interface LineAnnotation {
  label: string;
  tone: LineTone;
}

function addLineAnnotation(
  annotations: Map<number, LineAnnotation[]>,
  startLine: number,
  endLine: number,
  annotation: LineAnnotation,
) {
  const start = Math.max(1, Math.min(startLine, endLine));
  const end = Math.max(start, Math.max(startLine, endLine));
  for (let line = start; line <= end; line++) {
    const existing = annotations.get(line);
    if (existing) {
      existing.push(annotation);
    } else {
      annotations.set(line, [annotation]);
    }
  }
}

function buildLineAnnotations(result: AnalysisResult | null, tone: LineTone): Map<number, LineAnnotation[]> {
  const annotations = new Map<number, LineAnnotation[]>();
  if (!result) return annotations;

  for (const loop of result.loops) {
    addLineAnnotation(annotations, loop.startLine, loop.endLine, {
      label: `${tone === 'danger' ? 'Hot loop' : 'Efficient loop'} · ${loopComplexityBadge(loop)}`,
      tone,
    });
  }

  for (const call of result.stdlibCalls) {
    const isCheap = call.complexity === 'O(1)' || call.complexity === 'O(log n)';
    if ((tone === 'danger' && !isCheap) || (tone === 'success' && isCheap)) {
      addLineAnnotation(annotations, call.startLine, call.endLine, {
        label: `${tone === 'danger' ? 'Costly' : 'Fast'} ${call.name}() · ${call.complexity}`,
        tone,
      });
    }
  }

  if (tone === 'danger') {
    for (const recursiveFn of result.recursion.recursiveFunctions) {
      for (const call of recursiveFn.calls) {
        addLineAnnotation(annotations, call.line, call.line, {
          label: `Recursive call · ${recursiveFn.name}()` ,
          tone,
        });
      }
    }
  }

  return annotations;
}

function estimateScalingLift(winner: ComplexityClass, loser: ComplexityClass): number {
  const winnerRank = getComplexityRank(winner);
  const loserRank = getComplexityRank(loser);
  if (winnerRank === 99 || loserRank === 99 || winnerRank >= loserRank) return 0;
  const gap = loserRank - winnerRank;
  const estimate = Math.min(99.8, 64 + gap * 4.4 + Math.max(0, gap - 2) * 2.2);
  return Math.round(estimate * 10) / 10;
}

function formatCompareHeader(winnerSide: 'left' | 'right' | 'tie', leftResult: AnalysisResult, rightResult: AnalysisResult) {
  if (winnerSide === 'tie') {
    return {
      title: '🏁 TIE: Snippet A and Snippet B',
      winnerLabel: 'No clear winner',
      subtitle: `${leftResult.timeComplexity} vs ${rightResult.timeComplexity}`,
      details: 'Both snippets land in the same growth class, so confidence and implementation details decide the edge.',
      accent: 'highlight',
    } as const;
  }

  const winnerLabel = winnerSide === 'left' ? 'Snippet A' : 'Snippet B';
  const loserLabel = winnerSide === 'left' ? 'Snippet B' : 'Snippet A';
  const winnerResult = winnerSide === 'left' ? leftResult : rightResult;
  const loserResult = winnerSide === 'left' ? rightResult : leftResult;
  const speedLift = estimateScalingLift(winnerResult.timeComplexity, loserResult.timeComplexity);

  return {
    title: `🏆 WINNER: ${winnerLabel}  (${winnerResult.timeComplexity} Time vs ${loserResult.timeComplexity} Time)`,
    winnerLabel,
    subtitle: `⚡ ${speedLift.toFixed(1)}% Faster scaling for large input sizes (n > 100)`,
    details: `${winnerLabel} is the better asymptotic choice here. Confidence: ${Math.round(winnerResult.timeConfidence)}% vs ${Math.round(loserResult.timeConfidence)}% for ${loserLabel}.`,
    accent: winnerSide === 'left' ? 'success' : 'primary',
  } as const;
}

function CompareLineCostPanel({
  title,
  subtitle,
  code,
  result,
  tone,
}: {
  title: string;
  subtitle: string;
  code: string;
  result: AnalysisResult | null;
  tone: LineTone;
}) {
  const lines = useMemo(() => code.replace(/\r\n/g, '\n').split('\n'), [code]);
  const annotations = useMemo(() => buildLineAnnotations(result, tone), [result, tone]);
  const hasHighlights = annotations.size > 0;
  const borderClass = tone === 'danger' ? 'border-danger-500/25' : 'border-success-500/25';
  const accentClass = tone === 'danger' ? 'from-danger-500/10 to-danger-500/0' : 'from-success-500/10 to-success-500/0';

  return (
    <Card className={`overflow-hidden ${borderClass}`}>
      <CardContent className="p-0">
        <div className={`px-3 sm:px-4 py-2.5 border-b border-text-muted/10 dark:border-text-muted-dark/10 bg-gradient-to-r ${accentClass}`}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-text-muted dark:text-text-muted-dark">{title}</p>
              <p className="text-[11px] text-text-secondary dark:text-text-secondary-dark mt-0.5">{subtitle}</p>
            </div>
            <Badge variant={tone === 'danger' ? 'danger' : 'success'} size="xs">
              {hasHighlights ? `${annotations.size} highlighted lines` : 'No hotspots detected'}
            </Badge>
          </div>
        </div>
        <div className="max-h-64 overflow-auto bg-bg-secondary/80 dark:bg-bg-secondary-dark/80">
          <div className="min-w-full">
            {lines.map((line, index) => {
              const lineNumber = index + 1;
              const lineAnnotations = annotations.get(lineNumber) ?? [];
              const primary = lineAnnotations[0];
              const isHot = lineAnnotations.length > 0;
              const rowTone = primary?.tone ?? tone;
              const rowClass = isHot
                ? rowTone === 'danger'
                  ? 'border-l-danger-500 bg-danger-500/10 text-danger-950 dark:text-danger-100'
                  : 'border-l-success-500 bg-success-500/10 text-success-950 dark:text-success-100'
                : 'border-l-transparent text-text-primary dark:text-text-primary-dark';

              return (
                <div
                  key={`${title}-${lineNumber}`}
                  className={`grid grid-cols-[3.25rem_minmax(0,1fr)] gap-3 border-l-4 px-3 py-1.5 font-mono text-[12px] leading-5 ${rowClass}`}
                >
                  <div className="text-right tabular-nums text-text-muted dark:text-text-muted-dark select-none">{lineNumber}</div>
                  <div className="min-w-0 flex items-start gap-2">
                    <span className="whitespace-pre-wrap break-words flex-1">{line || ' '}</span>
                    {primary && (
                      <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] ${rowTone === 'danger' ? 'bg-danger-500/15 text-danger-700 dark:text-danger-200' : 'bg-success-500/15 text-success-700 dark:text-success-200'}`}>
                        {primary.label}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const getCurrentTheme = () => {
  const isDark = document.documentElement.classList.contains('dark');
  if (isDark) {
    return oneDark;
  }
  return EditorView.theme({
    '&': { height: '100%', fontSize: '14px' },
    '.cm-content': { fontFamily: 'JetBrains Mono, monospace' }
  });
};

interface CodeEditorProps {
  code: string;
  setCode: (c: string) => void;
  language: Language;
  onEditorReady?: (view: EditorView) => void;
  onUserEdited?: (code: string, kind: 'input' | 'paste' | 'cut') => void;
}

interface EditorDivElement extends HTMLDivElement {
  setContent?: (text: string) => void;
}

function buildEditorExtensions(
  language: Language,
  setCode: (c: string) => void,
  onUserEdited: ((c: string, k: 'input' | 'paste' | 'cut') => void) | undefined,
  isSyncingRef: React.MutableRefObject<boolean>,
  prevCodeRef: React.MutableRefObject<string>,
): Extension[] {
  const pasteHandler = keymap.of([{
    key: 'Mod-v',
    run: () => false, // let CodeMirror default paste run; we detect paste via DOM below
  }]);
  return [
    basicSetup,
    lineNumbers(),
    loopBadgeGutter,
    loopMarkersField,
    themeLoopUnderlines,
    getCurrentTheme(),
    LANG_EXTENSIONS[language],
    EditorView.domEventHandlers({
      paste: (_e, v) => {
        setTimeout(() => {
          const next = v.state.doc.toString();
          if (!isSyncingRef.current && next !== prevCodeRef.current) {
            prevCodeRef.current = next;
            setCode(next);
            onUserEdited?.(next, 'paste');
          }
        }, 0);
        return false;
      },
      cut: (_e, v) => {
        setTimeout(() => {
          const next = v.state.doc.toString();
          if (!isSyncingRef.current && next !== prevCodeRef.current) {
            prevCodeRef.current = next;
            setCode(next);
            onUserEdited?.(next, 'cut');
          }
        }, 0);
        return false;
      },
    }),
    EditorView.updateListener.of((update: ViewUpdate) => {
      if (update.docChanged && !isSyncingRef.current) {
        const next = update.state.doc.toString();
        prevCodeRef.current = next;
        setCode(next);
        // Infer input event when user types (docChanged without paste/cut)
        if (onUserEdited) {
          const userOriginated = update.transactions.some(
            (t) => t.isUserEvent('input') || t.isUserEvent('delete') || t.isUserEvent('keyboard'),
          );
          if (userOriginated) onUserEdited(next, 'input');
        }
      }
    }),
    EditorView.theme({
      '&': { height: '100%', fontSize: '14px' },
      '.cm-content': { fontFamily: 'JetBrains Mono, monospace' },
      '.cm-gutters': {
        borderRight: '1px solid rgba(120, 130, 160, 0.12)',
      },
    }),
    pasteHandler,
  ];
}

export function applyLoopMarkers(view: EditorView | null, loops: LoopInfo[]) {
  if (!view) return;
  try {
    if (loops.length === 0) {
      view.dispatch({ effects: setLoopMarkersEffect.of(Decoration.none) });
      return;
    }
    const builder = new RangeSetBuilder<Decoration>();
    const doc = view.state.doc;
    for (const loop of loops) {
      const lineNo = Math.min(Math.max(1, loop.startLine), doc.lines);
      const line = doc.line(lineNo);
      const label = loopComplexityBadge(loop);
      const deco = Decoration.mark({
        class:
          loop.nestingDepth === 0
            ? 'cm-loopHighlight-oN'
            : loop.nestingDepth === 1
            ? 'cm-loopHighlight-oN2'
            : 'cm-loopHighlight-oN3',
        loopMarkerSpec: { label, depth: loop.nestingDepth, type: loop.type },
        inclusive: true,
        inclusiveStart: true,
        inclusiveEnd: false,
      });
      const endPos = Math.min(line.to + 1, doc.length);
      builder.add(line.from, endPos, deco);
    }
    view.dispatch({
      effects: setLoopMarkersEffect.of(builder.finish()),
    });
  } catch {
    try {
      view.dispatch({ effects: setLoopMarkersEffect.of(Decoration.none) });
    } catch { /* ignore */ }
  }
}

function CodeEditor({ code, setCode, language, onEditorReady, onUserEdited }: CodeEditorProps) {
  const editorRef = useRef<EditorDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);
  const langCompartment = useRef(new Compartment()).current;
  const isSyncingRef = useRef(false);
  const prevCodeRef = useRef(code);
  const onUserEditedRef = useRef(onUserEdited);
  onUserEditedRef.current = onUserEdited;
  const setCodeRef = useRef(setCode);
  setCodeRef.current = setCode;

  // Sync external code prop changes into CodeMirror (e.g. sample loading)
  useEffect(() => {
    if (!viewRef.current) return;
    if (isSyncingRef.current) return; // mid-sync from user typing
    if (prevCodeRef.current === code) return; // no actual change
    const current = viewRef.current.state.doc.toString();
    if (current === code) { prevCodeRef.current = code; return; }
    isSyncingRef.current = true;
    viewRef.current.dispatch({
      changes: { from: 0, to: current.length, insert: code },
    });
    prevCodeRef.current = code;
    requestAnimationFrame(() => { isSyncingRef.current = false; });
  }, [code]);

  // Reconfigure just the language extension via Compartment when `language` changes
  useEffect(() => {
    if (!viewRef.current) return;
    try {
      viewRef.current.dispatch({
        effects: langCompartment.reconfigure(LANG_EXTENSIONS[language]),
      });
    } catch {
      // Fallback: full state rebuild if reconfigure rejected
      const currentDoc = viewRef.current.state.doc.toString();
      const state = EditorState.create({
        doc: currentDoc,
        extensions: buildEditorExtensions(
          language,
          (c) => setCodeRef.current(c),
          (c, k) => onUserEditedRef.current?.(c, k),
          isSyncingRef,
          prevCodeRef,
        ),
      });
      viewRef.current.setState(state);
    }
  }, [language, langCompartment]);

  useEffect(() => {
    if (editorRef.current && !viewRef.current) {
      prevCodeRef.current = code;
      const coreExts = buildEditorExtensions(
        language,
        (c) => setCodeRef.current(c),
        (c, k) => onUserEditedRef.current?.(c, k),
        isSyncingRef,
        prevCodeRef,
      );
      const view = new EditorView({
        doc: code,
        extensions: [
          coreExts,
          langCompartment.of([]), // placeholder so reconfigure always works
        ],
        parent: editorRef.current,
      });
      viewRef.current = view;
      onEditorReady?.(view);
    }
    return () => {
      viewRef.current?.destroy();
      viewRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setContent = useCallback((text: string) => {
    if (viewRef.current) {
      isSyncingRef.current = true;
      viewRef.current.dispatch({
        changes: {
          from: 0,
          to: viewRef.current.state.doc.length,
          insert: text
        }
      });
      prevCodeRef.current = text;
      requestAnimationFrame(() => { isSyncingRef.current = false; });
    }
  }, []);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.setContent = setContent;
    }
  }, [setContent]);

  return <div ref={editorRef} className="flex-1 overflow-hidden"></div>;
}

const DEFAULT_LEFT = `function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}`;
const DEFAULT_RIGHT = `function fibonacci(n) {
  let a = 0, b = 1;
  for (let i = 0; i < n; i++) {
    const next = a + b;
    a = b; b = next;
  }
  return a;
}`;

const DIFFICULTY_COLOR: Record<string, string> = {
  Easy: 'text-success-500',
  Medium: 'text-warning-500',
  Hard: 'text-danger-500',
};

const DIFFICULTY_BG: Record<string, string> = {
  Easy: 'bg-success-500/10 border-success-500/20',
  Medium: 'bg-warning-500/10 border-warning-500/20',
  Hard: 'bg-danger-500/10 border-danger-500/20',
};

function ResultPanel({ result, analyzing, title, accent }: {
  result: AnalysisResult | null;
  analyzing: boolean;
  title?: string;
  accent?: 'success' | 'primary';
}) {
  const [section, setSection] = useState<TabSection>('overview');
  const d = result?.detailed;

  const complexityTone = (value: string) => {
    if (value.includes('O(1)') || value.includes('O(log')) return 'emerald';
    if (value.includes('O(n)') || value.includes('O(n log')) return 'indigo';
    if (value.includes('O(n²)') || value.includes('O(2ⁿ')) return 'amber';
    return 'slate';
  };

  const complexityBadge = (value: string) => {
    const tone = complexityTone(value);
    const shared = 'inline-flex items-center justify-center rounded-2xl px-4 py-2 text-sm font-black shadow-sm';
    if (tone === 'emerald') return `${shared} bg-emerald-500/15 text-emerald-600 border border-emerald-500/25`;
    if (tone === 'indigo') return `${shared} bg-indigo-500/15 text-indigo-600 border border-indigo-500/25`;
    if (tone === 'amber') return `${shared} bg-amber-500/15 text-amber-600 border border-amber-500/25`;
    return `${shared} bg-slate-500/10 text-slate-600 border border-slate-500/20`;
  };

  const chartPoints = useMemo(() => {
    const base = result?.timeComplexity ?? 'O(1)';
    const scale = ['O(1)', 'O(n)', 'O(n²)'];
    const targetIndex = scale.indexOf(base);
    const points = scale.map((value, index) => ({
      label: value,
      x: index * 33.33,
      y: index === 0 ? 82 : index === 1 ? 52 : 20,
    }));
    if (targetIndex >= 0) {
      points[targetIndex] = { ...points[targetIndex], y: targetIndex === 0 ? 82 : targetIndex === 1 ? 52 : 20 };
    }
    return points;
  }, [result?.timeComplexity]);

  if (analyzing) {
    return (
      <Card className="h-full animate-fade-in">
        <CardContent className="py-10">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-16 w-48" />
              <Skeleton className="h-10 w-20 rounded-full" />
            </div>
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!result || !d) {
    return (
      <Card className="h-full flex flex-col items-center justify-center text-center animate-fade-in overflow-hidden empty-state-glow">
        <div className="absolute inset-0 bg-grid opacity-25 pointer-events-none" />
        <CardContent className="py-10 sm:py-12 relative z-10 w-full max-w-md mx-auto">
          <div className="relative w-24 h-24 rounded-2xl bg-gradient-to-br from-accent-500 via-accent-400 to-highlight-400 flex items-center justify-center mb-6 mx-auto animate-float shadow-glow">
            <span className="text-5xl text-white font-black drop-shadow-sm">Ω</span>
            <div className="absolute -inset-2 bg-gradient-to-br from-accent-500/35 to-highlight-400/30 rounded-3xl blur-xl opacity-80 -z-10 animate-pulse" />
          </div>
          <h3 className="text-2xl font-black text-text-primary dark:text-text-primary-dark mb-2">
            {title ?? 'Paste code or try a sample'}
          </h3>
          <p className="text-sm text-text-secondary dark:text-text-secondary-dark max-w-md mb-5 leading-relaxed">
            Drop a function in the editor and hit <span className="font-semibold text-gradient-accent">Analyze This</span>. We'll crack open the loops, recursion, and complexity with a full breakdown.
          </p>

          <div className="grid grid-cols-3 gap-2 text-xs text-text-tertiary dark:text-text-tertiary-dark mb-6">
            <div className="p-2.5 rounded-xl bg-bg-tertiary/60 dark:bg-bg-tertiary-dark/60 border border-text-muted/10 dark:border-text-muted-dark/10">
              <span className="block text-lg mb-0.5">📊</span>
              <span className="font-semibold">13 sections</span>
            </div>
            <div className="p-2.5 rounded-xl bg-bg-tertiary/60 dark:bg-bg-tertiary-dark/60 border border-text-muted/10 dark:border-text-muted-dark/10">
              <span className="block text-lg mb-0.5">⚡</span>
              <span className="font-semibold">Instant</span>
            </div>
            <div className="p-2.5 rounded-xl bg-bg-tertiary/60 dark:bg-bg-tertiary-dark/60 border border-text-muted/10 dark:border-text-muted-dark/10">
              <span className="block text-lg mb-0.5">📚</span>
              <span className="font-semibold">5 langs</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 mb-5">
            <span className="text-xs font-semibold text-text-muted dark:text-text-muted-dark uppercase tracking-wider">
              Quick start
            </span>
            <div className="flex items-center gap-1.5 text-xs">
              <kbd className="px-2 py-1 rounded-lg bg-bg-tertiary dark:bg-bg-tertiary-dark border border-text-muted/20 dark:border-text-muted-dark/20 font-mono font-semibold">⌘</kbd>
              <span className="text-text-muted dark:text-text-muted-dark">+</span>
              <kbd className="px-2 py-1 rounded-lg bg-bg-tertiary dark:bg-bg-tertiary-dark border border-text-muted/20 dark:border-text-muted-dark/20 font-mono font-semibold">K</kbd>
              <span className="text-text-tertiary dark:text-text-tertiary-dark ml-1">Sample library</span>
            </div>
          </div>

          <div className="relative inline-block">
            <div className="absolute -inset-1 bg-gradient-to-r from-accent-500/40 via-highlight-400/30 to-accent-500/40 rounded-xl blur-md opacity-70 animate-pulse" />
            <span className="relative inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-accent-500/15 via-highlight-400/10 to-accent-500/15 border border-accent-500/25 text-xs font-bold text-accent-500 dark:text-accent-300">
              <span className="text-base">✨</span>
              Then click <span className="underline underline-offset-2">Analyze This</span> above
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="h-full overflow-y-auto space-y-3 pr-1 snap-results" style={{ scrollbarGutter: 'stable' }}>
      {/* ============ HERO: BIG-O + CONFIDENCE ============ */}
      <div className="relative overflow-hidden rounded-2xl border p-5 animate-bounce-in snap-result-section"
        style={{
          background: accent === 'success'
            ? 'linear-gradient(135deg, rgba(16,185,129,0.14), rgba(34,211,238,0.08))'
            : 'linear-gradient(135deg, rgba(99,102,241,0.14), rgba(34,211,238,0.08))',
          borderColor: accent === 'success' ? 'rgba(16,185,129,0.28)' : 'rgba(99,102,241,0.28)',
        }}>
        <div className="absolute -top-12 -right-12 h-36 w-36 rounded-full opacity-20 blur-3xl"
          style={{ background: accent === 'success' ? '#10b981' : '#6366f1' }}
        />
        <div className="relative grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <Badge variant="outline" size="sm" className="uppercase tracking-wider text-[10px] font-semibold">
                {d.programmingLanguage}
              </Badge>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${DIFFICULTY_BG[d.finalResult.difficulty] ?? ''} ${DIFFICULTY_COLOR[d.finalResult.difficulty] ?? ''}`}>
                {d.finalResult.difficulty}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className={complexityBadge(d.timeComplexity.worst)}>{d.timeComplexity.worst}</span>
              <span className={complexityBadge(d.spaceComplexity.auxiliary)}>{d.spaceComplexity.auxiliary}</span>
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-text-tertiary dark:text-text-tertiary-dark mb-2">
              Quick Summary
            </p>
            <p className="text-sm leading-relaxed text-text-secondary dark:text-text-secondary-dark">
              {d.highLevelSummary}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/5 p-3 dark:bg-white/5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-text-tertiary dark:text-text-tertiary-dark">
                Confidence
              </span>
              <span className="text-sm font-black text-gradient-accent">{Math.round(result.timeConfidence)}%</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-bg-tertiary dark:bg-bg-tertiary-dark">
              <div className="h-full rounded-full bg-gradient-to-r from-accent-500 via-highlight-400 to-accent-500 transition-all duration-700" style={{ width: `${result.timeConfidence}%` }} />
            </div>
            <div className="mt-3 h-24 rounded-xl bg-gradient-to-br from-accent-500/10 to-highlight-400/10 p-2">
              <svg viewBox="0 0 100 100" className="h-full w-full">
                <path d="M0 82 C20 70, 35 58, 50 52 S80 38, 100 20" stroke="rgba(99,102,241,0.9)" strokeWidth="2.5" fill="none" />
                <path d="M0 82 C20 76, 35 72, 50 60 S80 40, 100 18" stroke="rgba(16,185,129,0.8)" strokeWidth="2.5" fill="none" />
                <path d="M0 82 C20 82, 35 82, 50 78 S80 70, 100 62" stroke="rgba(239,68,68,0.8)" strokeWidth="2.5" fill="none" />
                {chartPoints.map((point, index) => (
                  <circle key={point.label} cx={point.x} cy={point.y} r="2.8" fill={index === 1 ? '#6366f1' : index === 0 ? '#10b981' : '#ef4444'} />
                ))}
              </svg>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {d.algorithmUsed.slice(0, 3).map((a) => (
                <Badge key={a} variant="primary" size="xs" className="animate-count-up">
                  {a}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ============ SECTION TABS ============ */}
      <div className="snap-result-section animate-slide-up delay-2">
        <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-text-muted/10 bg-bg-tertiary/60 p-1.5 dark:border-text-muted-dark/10 dark:bg-bg-tertiary-dark/60">
          {SECTION_TABS.map((tab) => (
            <Tooltip key={tab.id} content={tab.hint} position="bottom">
              <button
                onClick={() => setSection(tab.id)}
                className={[
                  'flex-1 min-w-[92px] rounded-lg px-3 py-2 text-[11px] font-semibold transition-all duration-200 flex items-center justify-center gap-1.5',
                  section === tab.id
                    ? 'bg-bg-secondary text-text-primary shadow-subtle dark:bg-bg-secondary-dark dark:text-text-primary-dark'
                    : 'text-text-tertiary hover:bg-bg-secondary/60 hover:text-text-primary dark:text-text-tertiary-dark dark:hover:bg-bg-secondary-dark/40 dark:hover:text-text-primary-dark',
                ].join(' ')}
              >
                <span className="text-sm">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            </Tooltip>
          ))}
        </div>
      </div>

      {/* ============ OVERVIEW ============ */}
      {section === 'overview' && (
        <div className="space-y-3 animate-slide-in-right">
          <Card className="hover-lift glow-border snap-result-section">
            <CardContent className="p-5">
              <h3 className="section-header text-sm font-bold text-text-primary dark:text-text-primary-dark mb-3">
                1. Programming Language
              </h3>
              <div className="flex items-center gap-3 flex-wrap">
                <Badge size="lg" variant="primary" className="px-5 py-2 text-sm">{d.programmingLanguage}</Badge>
                <span className="text-xs text-text-muted dark:text-text-muted-dark">
                  Detected automatically from syntax patterns
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="hover-lift glow-border snap-result-section">
            <CardContent className="p-5">
              <h3 className="section-header text-sm font-bold text-text-primary dark:text-text-primary-dark mb-3">
                2. High Level Summary
              </h3>
              <p className="text-sm text-text-secondary dark:text-text-secondary-dark leading-relaxed">
                {d.highLevelSummary}
              </p>
            </CardContent>
          </Card>

          <Card className="hover-lift glow-border snap-result-section">
            <CardContent className="p-5">
              <h3 className="section-header text-sm font-bold text-text-primary dark:text-text-primary-dark mb-3">
                3. Algorithm(s) Used
              </h3>
              <div className="flex flex-wrap gap-2">
                {d.algorithmUsed.map((algo, i) => (
                  <span
                    key={algo}
                    className={`animate-count-up delay-${Math.min(i, 10)} inline-flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm border`}
                    style={{
                      background: `linear-gradient(135deg, rgba(102,56,255,0.12), rgba(0,228,255,0.08))`,
                      borderColor: 'rgba(102,56,255,0.25)',
                      color: '#6638ff',
                    }}
                  >
                    <span>🧩</span>
                    {algo}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="hover-lift glow-border snap-result-section">
            <CardContent className="p-5">
              <h3 className="section-header text-sm font-bold text-text-primary dark:text-text-primary-dark mb-4">
                4. Step-by-Step Execution
              </h3>
              <ol className="space-y-3">
                {d.stepByStepExecution.map((s, i) => (
                  <li key={i} className={`flex gap-3 animate-slide-up delay-${Math.min(i, 10)}`}>
                    <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-accent-500 to-highlight-400 flex items-center justify-center text-white font-bold text-sm shadow-subtle">
                      {s.step}
                    </div>
                    <div className="flex-1 pt-1.5">
                      <p className="text-sm text-text-secondary dark:text-text-secondary-dark leading-relaxed">
                        {s.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>

          <Card className="hover-lift glow-border snap-result-section">
            <CardContent className="p-5">
              <h3 className="section-header text-sm font-bold text-text-primary dark:text-text-primary-dark mb-4">
                5. Formal Proof Sketch
              </h3>
              <div className="rounded-2xl border border-accent-500/20 bg-gradient-to-br from-accent-500/5 to-highlight-400/5 p-4">
                <p className="text-sm font-semibold text-text-secondary dark:text-text-secondary-dark leading-relaxed">
                  For the analyzed routine, the total work can be expressed as the outer-loop iterations multiplied by the cost of the inner operation. In asymptotic form:
                </p>
                <div className="mt-3 rounded-xl bg-bg-secondary/70 p-3 font-mono text-sm text-accent-600 dark:bg-bg-secondary-dark/70 dark:text-accent-300">
                  {d.complexityDerivation.length > 0 ? d.complexityDerivation.map((step) => step.math).filter(Boolean).slice(0, 3).join(' · ') : 'T(n) = O(n)'}
                </div>
                <p className="mt-3 text-sm text-text-secondary dark:text-text-secondary-dark leading-relaxed">
                  This gives the dominant growth term shown in the hero badge above, which is why the analyzer reports the displayed complexity.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="hover-lift glow-border snap-result-section">
            <CardContent className="p-5">
              <h3 className="section-header text-sm font-bold text-text-primary dark:text-text-primary-dark mb-4">
                13. Final Result
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { label: 'Language', value: d.finalResult.programmingLanguage, accent: false },
                  { label: 'Algorithm', value: d.finalResult.algorithm, accent: false },
                  { label: 'Worst Time', value: d.finalResult.worstTime, accent: true },
                  { label: 'Average Time', value: d.finalResult.averageTime, accent: true },
                  { label: 'Best Time', value: d.finalResult.bestTime, accent: true },
                  { label: 'Space', value: d.finalResult.space, accent: true },
                ].map((it, i) => (
                  <div
                    key={i}
                    className={`animate-count-up delay-${i} rounded-xl p-3 border ${
                      it.accent
                        ? 'bg-gradient-to-br from-accent-500/10 to-highlight-400/10 border-accent-500/20'
                        : 'bg-bg-tertiary/40 dark:bg-bg-tertiary-dark/40 border-text-muted/10 dark:border-text-muted-dark/10'
                    }`}
                  >
                    <p className="text-[10px] uppercase tracking-wider font-semibold text-text-muted dark:text-text-muted-dark mb-1">
                      {it.label}
                    </p>
                    <p className={`text-sm font-bold ${it.accent ? 'text-gradient-accent stat-number break-words' : 'text-text-primary dark:text-text-primary-dark'}`}>
                      {it.value}
                    </p>
                  </div>
                ))}
                <div className={`col-span-2 sm:col-span-3 rounded-xl p-4 border flex items-center justify-between ${DIFFICULTY_BG[d.finalResult.difficulty] ?? ''}`}>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-semibold text-text-muted dark:text-text-muted-dark mb-1">Difficulty</p>
                    <p className={`text-2xl font-black ${DIFFICULTY_COLOR[d.finalResult.difficulty] ?? ''}`}>{d.finalResult.difficulty}</p>
                  </div>
                  <div className="text-4xl animate-float">
                    {d.finalResult.difficulty === 'Easy' ? '🌱' : d.finalResult.difficulty === 'Medium' ? '🔥' : '💎'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ============ COMPLEXITY DERIVATION ============ */}
      {section === 'complexity' && (
        <div className="space-y-3 animate-slide-in-right">
          <Card className="hover-lift glow-border snap-result-section">
            <CardContent className="p-5">
              <h3 className="section-header text-sm font-bold text-text-primary dark:text-text-primary-dark mb-4">
                5. Time Complexity
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { k: 'Worst', v: d.timeComplexity.worst, tone: 'danger' as const },
                  { k: 'Average', v: d.timeComplexity.average, tone: 'warning' as const },
                  { k: 'Best', v: d.timeComplexity.best, tone: 'success' as const },
                ].map((it, i) => {
                  const tone = getComplexityColor(it.v);
                  return (
                    <div
                      key={i}
                      className={`animate-count-up delay-${i} rounded-xl p-4 text-center border bg-bg-tertiary/30 dark:bg-bg-tertiary-dark/30 border-text-muted/10 dark:border-text-muted-dark/10`}
                    >
                      <p className="text-[10px] uppercase tracking-wider font-semibold text-text-muted dark:text-text-muted-dark mb-2">
                        {it.k}
                      </p>
                      <Badge size="md" variant={tone === 'default' ? 'primary' : tone} className={`text-lg px-3 py-1.5 ${getGlowClass(tone === 'default' ? 'primary' : tone)}`}>
                        {it.v}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="hover-lift glow-border snap-result-section">
            <CardContent className="p-5">
              <h3 className="section-header text-sm font-bold text-text-primary dark:text-text-primary-dark mb-4">
                6. Space Complexity
              </h3>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="rounded-xl p-4 border bg-gradient-to-br from-highlight-400/10 to-accent-500/10 border-highlight-400/20">
                  <p className="text-[10px] uppercase tracking-wider font-semibold text-text-muted dark:text-text-muted-dark mb-2">
                    Auxiliary
                  </p>
                  <p className="text-2xl font-black text-gradient stat-number">{d.spaceComplexity.auxiliary}</p>
                </div>
                <div className="flex-1 min-w-[200px] text-xs text-text-tertiary dark:text-text-tertiary-dark leading-relaxed space-y-1">
                  {result.spaceComplexity.reasoning.map((r, i) => (
                    <p key={i} className="flex gap-2"><span className="text-accent-500">▸</span>{r}</p>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover-lift glow-border snap-result-section">
            <CardContent className="p-5">
              <h3 className="section-header text-sm font-bold text-text-primary dark:text-text-primary-dark mb-4">
                7. Complexity Derivation
              </h3>
              <ol className="space-y-3">
                {d.complexityDerivation.map((s, i) => (
                  <li
                    key={i}
                    className={`animate-slide-up delay-${Math.min(i, 10)} rounded-xl p-4 bg-bg-tertiary/40 dark:bg-bg-tertiary-dark/40 border border-text-muted/10 dark:border-text-muted-dark/10`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-gradient-to-br from-accent-500 to-highlight-400 flex items-center justify-center text-white text-xs font-bold">
                        {s.step}
                      </span>
                      <div className="flex-1 pt-0.5">
                        <p className="text-sm text-text-secondary dark:text-text-secondary-dark leading-relaxed mb-2">
                          {s.description}
                        </p>
                        {s.math && (
                          <code className="inline-block px-3 py-1.5 rounded-lg bg-bg-secondary dark:bg-bg-secondary-dark font-mono text-xs font-semibold text-accent-500 border border-accent-500/20">
                            {s.math}
                          </code>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ============ LOOPS + RECURSION ============ */}
      {section === 'loops' && (
        <div className="space-y-3 animate-slide-in-right">
          <Card className="hover-lift glow-border snap-result-section">
            <CardContent className="p-5">
              <h3 className="section-header text-sm font-bold text-text-primary dark:text-text-primary-dark mb-4">
                8. Loop Analysis
              </h3>
              {d.loopAnalysis.length === 0 ? (
                <div className="text-center py-8 text-text-tertiary dark:text-text-tertiary-dark text-sm">
                  <div className="text-4xl mb-3">✅</div>
                  <p>No explicit loops detected — the algorithm uses no iteration or relies entirely on recursion / standard library calls.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {d.loopAnalysis.map((loop, i) => (
                    <div
                      key={i}
                      className={`animate-slide-up delay-${Math.min(i, 10)} rounded-xl p-4 border`}
                      style={{
                        background: loop.nestingDepth === 0
                          ? 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(0,228,255,0.05))'
                          : loop.nestingDepth === 1
                          ? 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(245,158,11,0.04))'
                          : 'linear-gradient(135deg, rgba(239,68,68,0.10), rgba(239,68,68,0.04))',
                        borderColor: loop.nestingDepth === 0
                          ? 'rgba(16,185,129,0.25)'
                          : loop.nestingDepth === 1
                          ? 'rgba(245,158,11,0.3)'
                          : 'rgba(239,68,68,0.3)',
                      }}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="w-8 h-8 rounded-lg bg-bg-secondary dark:bg-bg-secondary-dark flex items-center justify-center text-sm font-bold shadow-subtle">
                            #{loop.loopNumber}
                          </span>
                          <div>
                            <p className="text-sm font-bold text-text-primary dark:text-text-primary-dark">{loop.purpose}</p>
                            <p className="text-[11px] text-text-muted dark:text-text-muted-dark">
                              Lines {loop.startLine}–{loop.endLine}
                              {loop.nestingDepth > 0 && ` · nested level ${loop.nestingDepth + 1}`}
                            </p>
                          </div>
                        </div>
                        <Badge
                          size="sm"
                          variant={loop.nestingDepth === 0 ? 'success' : loop.nestingDepth === 1 ? 'warning' : 'danger'}
                        >
                          {loop.contribution}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-2 text-xs text-text-secondary dark:text-text-secondary-dark">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-bg-secondary/70 dark:bg-bg-secondary-dark/70">
                          <span>🔁</span> {loop.iterations}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="hover-lift glow-border snap-result-section">
            <CardContent className="p-5">
              <h3 className="section-header text-sm font-bold text-text-primary dark:text-text-primary-dark mb-4">
                9. Recursive Analysis
              </h3>
              {!d.recursiveAnalysis.hasRecursion ? (
                <div className="text-center py-8 text-text-tertiary dark:text-text-tertiary-dark text-sm">
                  <div className="text-4xl mb-3">🔄</div>
                  <p>No recursion detected.</p>
                </div>
              ) : (
                <div className="space-y-3 text-sm">
                  {[
                    ['🎯 Base Case', d.recursiveAnalysis.baseCase],
                    ['🔗 Recursive Relation', d.recursiveAnalysis.recursiveRelation],
                    ['📏 Recursion Depth', d.recursiveAnalysis.recursionDepth],
                    ['📐 Recurrence', d.recursiveAnalysis.recurrence],
                    ['⚡ Complexity Contribution', d.recursiveAnalysis.contributionToComplexity],
                  ].map(([label, val], i) => val && (
                    <div key={i} className={`rounded-xl p-3 flex gap-3 animate-slide-up delay-${i} bg-bg-tertiary/40 dark:bg-bg-tertiary-dark/40 border border-text-muted/10 dark:border-text-muted-dark/10`}>
                      <p className="font-semibold text-text-primary dark:text-text-primary-dark whitespace-nowrap w-40 flex-shrink-0">
                        {label}
                      </p>
                      <p className="text-text-secondary dark:text-text-secondary-dark leading-relaxed">{val}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ============ MEMORY + PERF NOTES ============ */}
      {section === 'memory' && (
        <div className="space-y-3 animate-slide-in-right">
          <Card className="hover-lift glow-border snap-result-section">
            <CardContent className="p-5">
              <h3 className="section-header text-sm font-bold text-text-primary dark:text-text-primary-dark mb-4">
                10. Memory Usage
              </h3>
              {d.memoryUsage.length === 0 ? (
                <p className="text-sm text-text-tertiary dark:text-text-tertiary-dark">No major dynamic data structures detected.</p>
              ) : (
                <ul className="space-y-2">
                  {d.memoryUsage.map((m, i) => (
                    <li
                      key={i}
                      className={`rounded-xl p-3 flex items-start justify-between gap-3 animate-slide-up delay-${i} ${
                        m.affectsComplexity
                          ? 'bg-warning-500/10 border border-warning-500/20'
                          : 'bg-bg-tertiary/40 dark:bg-bg-tertiary-dark/40 border border-text-muted/10 dark:border-text-muted-dark/10'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="w-8 h-8 rounded-lg bg-bg-secondary dark:bg-bg-secondary-dark flex items-center justify-center text-sm shadow-subtle flex-shrink-0">
                          {m.type === 'Array' ? '📦'
                            : m.type === 'HashMap' ? '🗂️'
                            : m.type === 'HashSet' ? '🧺'
                            : m.type === 'Stack' || m.type === 'RecursionStack' ? '🥞'
                            : m.type === 'Queue' ? '🚶'
                            : m.type === 'Dynamic' ? '🧱'
                            : '📦'}
                        </span>
                        <div>
                          <p className="text-sm font-bold text-text-primary dark:text-text-primary-dark">{m.name}</p>
                          <p className="text-xs text-text-secondary dark:text-text-secondary-dark mt-0.5">{m.note}</p>
                        </div>
                      </div>
                      <Badge
                        size="xs"
                        variant={m.affectsComplexity ? 'warning' : 'success'}
                      >
                        {m.affectsComplexity ? 'Affects O' : 'No impact'}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card className="hover-lift glow-border snap-result-section">
            <CardContent className="p-5">
              <h3 className="section-header text-sm font-bold text-text-primary dark:text-text-primary-dark mb-4">
                11. Performance Notes
              </h3>
              {d.performanceNotes.length === 0 ? (
                <p className="text-sm text-text-tertiary dark:text-text-tertiary-dark">Clean algorithm with no noteworthy performance concerns.</p>
              ) : (
                <ul className="space-y-2">
                  {d.performanceNotes.map((n, i) => (
                    <li
                      key={i}
                      className={`rounded-xl p-3 pl-4 relative animate-slide-up delay-${i} bg-gradient-to-r from-danger-500/5 to-transparent border border-text-muted/10 dark:border-text-muted-dark/10`}
                    >
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-warning-500" />
                      <p className="pl-2 text-sm text-text-secondary dark:text-text-secondary-dark leading-relaxed">
                        {n}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ============ OPTIMIZATIONS ============ */}
      {section === 'optimizations' && (
        <div className="space-y-3 animate-slide-in-right">
          <Card className="hover-lift glow-border snap-result-section">
            <CardContent className="p-5">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-success-500 to-highlight-400 flex items-center justify-center text-2xl flex-shrink-0 shadow-glow">
                  🚀
                </div>
                <div>
                  <h3 className="text-base font-bold text-text-primary dark:text-text-primary-dark section-header">
                    12. Possible Optimizations
                  </h3>
                  <p className="text-xs text-text-tertiary dark:text-text-tertiary-dark mt-1">
                    Practical, realistic improvements you can apply today.
                  </p>
                </div>
              </div>
              <ul className="space-y-2.5">
                {d.possibleOptimizations.map((opt, i) => (
                  <li
                    key={i}
                    className={`animate-slide-up delay-${i} rounded-xl p-4 flex gap-3 border transition-all hover:border-accent-500/30 hover:bg-accent-500/5`}
                    style={{
                      background: 'linear-gradient(135deg, rgba(102,56,255,0.06), rgba(0,228,255,0.03))',
                      borderColor: 'rgba(102,56,255,0.15)',
                    }}
                  >
                    <span className="flex-shrink-0 w-8 h-8 rounded-xl bg-bg-secondary dark:bg-bg-secondary-dark flex items-center justify-center font-bold text-sm shadow-subtle">
                      {i + 1}
                    </span>
                    <p className="text-sm text-text-secondary dark:text-text-secondary-dark leading-relaxed pt-1">
                      {opt}
                    </p>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="snap-result-section">
            <CardContent className="p-5">
              <details className="group">
                <summary className="cursor-pointer text-sm font-semibold text-text-secondary dark:text-text-secondary-dark flex items-center justify-between">
                  <span>📖 What would change the verdict?</span>
                  <span className="transition-transform group-open:rotate-180">▾</span>
                </summary>
                <ul className="mt-3 space-y-2 text-xs text-text-tertiary dark:text-text-tertiary-dark">
                  {result.whatWouldChange.length === 0 ? (
                    <li>No major caveats detected for this sample.</li>
                  ) : (
                    result.whatWouldChange.map((w, i) => (
                      <li key={i} className="flex gap-2 rounded-lg p-2.5 bg-bg-tertiary/40 dark:bg-bg-tertiary-dark/40">
                        <span className="text-accent-500 font-bold flex-shrink-0">{i + 1}.</span>
                        <div>
                          <p className="font-semibold text-text-secondary dark:text-text-secondary-dark">{w.factor}</p>
                          <p>{w.impact}</p>
                        </div>
                      </li>
                    ))
                  )}
                </ul>
              </details>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default function Analyzer() {
  const [mode, setMode] = useState<Mode>('single');

  const [code, setCode] = useState<string>('');
  const [language, setLanguage] = useState<Language>('javascript');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [mainAutoDetect, setMainAutoDetect] = useState<Language | null>(null);

  const [leftCode, setLeftCode] = useState<string>(DEFAULT_LEFT);
  const [rightCode, setRightCode] = useState<string>(DEFAULT_RIGHT);
  const [leftLang, setLeftLang] = useState<Language>('javascript');
  const [rightLang, setRightLang] = useState<Language>('javascript');
  const [leftResult, setLeftResult] = useState<AnalysisResult | null>(null);
  const [rightResult, setRightResult] = useState<AnalysisResult | null>(null);
  const [leftAnalyzing, setLeftAnalyzing] = useState(false);
  const [rightAnalyzing, setRightAnalyzing] = useState(false);
  const [leftAutoDetect, setLeftAutoDetect] = useState<Language | null>(null);
  const [rightAutoDetect, setRightAutoDetect] = useState<Language | null>(null);

  const [galleryOpen, setGalleryOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [loadingCompare, setLoadingCompare] = useState(false);
  const [galleryTarget, setGalleryTarget] = useState<'main' | 'left' | 'right'>('main');
  const [showCompareHint, setShowCompareHint] = useState(false);

  const editorRef = useRef<HTMLDivElement | null>(null);
  const analyzeBtnRef = useRef<HTMLDivElement | null>(null);
  const exportReportRef = useRef<HTMLDivElement | null>(null);
  const mainEditorViewRef = useRef<EditorView | null>(null);
  const leftEditorViewRef = useRef<EditorView | null>(null);
  const rightEditorViewRef = useRef<EditorView | null>(null);

  const { addToast } = useToast();

  const dismissCompareHint = () => {
    try { localStorage.setItem('compare-hint-seen-v1', 'true'); } catch { /* ignore */ }
    setShowCompareHint(false);
  };

  const refactorSuggestion = useMemo(() => buildHeuristicRefactor(code, language, result), [code, language, result]);

  const shareCurrentAnalysis = useCallback(async () => {
    const payload: SharePayload = mode === 'single'
      ? {
          version: 1,
          mode,
          single: { code, language, result },
        }
      : {
          version: 1,
          mode,
          compare: {
            leftCode,
            rightCode,
            leftLang,
            rightLang,
            leftResult,
            rightResult,
          },
        };

    const encoded = encodeSharePayload(payload);
    const shareUrl = `${window.location.origin}${window.location.pathname}${window.location.search}#code=${encoded}`;

    try {
      await navigator.clipboard.writeText(shareUrl);
      window.history.replaceState(null, '', shareUrl);
      addToast('success', 'Share link copied');
    } catch {
      addToast('danger', 'Could not copy share link');
    }
  }, [addToast, code, language, leftCode, leftLang, leftResult, mode, rightCode, rightLang, rightResult, result]);

  const exportCurrentAnalysisAsPng = useCallback(async () => {
    if (!exportReportRef.current) {
      addToast('warning', 'Nothing to export yet');
      return;
    }

    try {
      const canvas = await html2canvas(exportReportRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
      });
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('PNG export failed');
      downloadBlob(blob, `big-o-analysis-${mode}.png`);
      addToast('success', 'PNG exported');
    } catch {
      addToast('danger', 'PNG export failed');
    }
  }, [addToast, mode]);

  const exportCurrentAnalysisAsPdf = useCallback(async () => {
    try {
      const blob = await pdf(
        <AnalysisPdfDocument
          mode={mode}
          code={code}
          language={language}
          result={result}
          leftCode={leftCode}
          rightCode={rightCode}
          leftLang={leftLang}
          rightLang={rightLang}
          leftResult={leftResult}
          rightResult={rightResult}
        />,
      ).toBlob();
      downloadBlob(blob, `big-o-analysis-${mode}.pdf`);
      addToast('success', 'PDF exported');
    } catch {
      addToast('danger', 'PDF export failed');
    }
  }, [addToast, code, language, leftCode, leftLang, leftResult, mode, rightCode, rightLang, rightResult, result]);

  const applyOptimization = useCallback(() => {
    if (!refactorSuggestion) {
      addToast('warning', 'No heuristic optimization available for this snippet');
      return;
    }

    setCode(refactorSuggestion.code);
    setShowResults(true);
    const nextResult = analyzeCode(refactorSuggestion.code, language);
    setResult(nextResult);
    setIsAnalyzing(false);
    applyLoopMarkers(mainEditorViewRef.current, nextResult.loops ?? []);
    addToast('success', 'Applied optimization');
  }, [addToast, language, refactorSuggestion]);

  const copyCode = useCallback(async (text: string, label = 'Code') => {
    try {
      await navigator.clipboard.writeText(text);
      addToast('success', `${label} copied to clipboard`);
    } catch {
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        addToast('success', `${label} copied to clipboard`);
      } catch {
        addToast('danger', 'Failed to copy');
      }
    }
  }, [addToast]);

  const clearCode = useCallback((
    setter: (s: string) => void,
    viewRef: React.MutableRefObject<EditorView | null>,
    label = 'Editor',
  ) => {
    setter('');
    if (viewRef.current) {
      try { applyLoopMarkers(viewRef.current, []); } catch { /* ignore */ }
    }
    addToast('info', `${label} cleared`);
  }, [addToast]);

  const formatAndSet = useCallback((
    src: string,
    lang: Language,
    setter: (s: string) => void,
    viewRef: React.MutableRefObject<EditorView | null>,
  ) => {
    const formatted = formatCode(src, lang);
    setter(formatted);
    try {
      if (viewRef.current) {
        viewRef.current.dispatch({
          changes: { from: 0, to: viewRef.current.state.doc.length, insert: formatted },
        });
      }
    } catch { /* ignore */ }
    addToast('success', 'Code formatted');
  }, [addToast]);

  const analyzeSingle = useCallback(() => {
    if (!code.trim()) return;
    setIsAnalyzing(true);
    setShowResults(true);
    setTimeout(() => {
      const analysisResult = analyzeCode(code, language);
      setResult(analysisResult);
      setIsAnalyzing(false);
      applyLoopMarkers(mainEditorViewRef.current, analysisResult.loops ?? []);
    }, 300);
  }, [code, language]);

  const analyzeCompare = useCallback(() => {
    setLoadingCompare(true);
    setLeftAnalyzing(true);
    setRightAnalyzing(true);
    setTimeout(() => {
      const l = analyzeCode(leftCode, leftLang);
      setLeftResult(l);
      setLeftAnalyzing(false);
      applyLoopMarkers(leftEditorViewRef.current, l.loops ?? []);
    }, 200);
    setTimeout(() => {
      const r = analyzeCode(rightCode, rightLang);
      setRightResult(r);
      setRightAnalyzing(false);
      setLoadingCompare(false);
      applyLoopMarkers(rightEditorViewRef.current, r.loops ?? []);
    }, 400);
  }, [leftCode, leftLang, rightCode, rightLang]);

  useEffect(() => {
    // First-visit compare mode hint + auto-run verdict (never shown again after dismissal)
    try {
      const compareSeen = localStorage.getItem('compare-hint-seen-v1');
      if (!compareSeen && mode === 'compare') {
        setShowCompareHint(true);
        // Auto-run once so users immediately see the 🏆 verdict
        if (!leftResult && !rightResult) {
          setTimeout(() => analyzeCompare(), 350);
        }
      }
    } catch { /* ignore */ }
  }, [mode, analyzeCompare, leftResult, rightResult]);

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, '');
    if (!hash) return;

    const params = new URLSearchParams(hash);
    const encoded = params.get('code');
    if (!encoded) return;

    const payload = decodeSharePayload(encoded);
    if (!payload) return;

    if (payload.mode === 'compare' && payload.compare) {
      setMode('compare');
      setLeftCode(payload.compare.leftCode);
      setRightCode(payload.compare.rightCode);
      setLeftLang(payload.compare.leftLang);
      setRightLang(payload.compare.rightLang);
      setLeftResult(payload.compare.leftResult ?? null);
      setRightResult(payload.compare.rightResult ?? null);
      setLoadingCompare(false);
      setLeftAnalyzing(false);
      setRightAnalyzing(false);
      setShowCompareHint(false);
    } else if (payload.single) {
      setMode('single');
      setCode(payload.single.code);
      setLanguage(payload.single.language);
      setResult(payload.single.result ?? null);
      setShowResults(true);
      setIsAnalyzing(false);
      setMainAutoDetect(null);
    }
  }, []);

  const onSelectSample = (sample: Sample) => {
    setGalleryOpen(false);
    const lang = sample.language as Language;
    if (galleryTarget === 'left') {
      setLeftLang(lang);
      setLeftCode(sample.code);
      setLeftAutoDetect(null);
      applyLoopMarkers(leftEditorViewRef.current, []);
    } else if (galleryTarget === 'right') {
      setRightLang(lang);
      setRightCode(sample.code);
      setRightAutoDetect(null);
      applyLoopMarkers(rightEditorViewRef.current, []);
    } else {
      setLanguage(lang);
      setCode(sample.code);
      setShowResults(false);
      setResult(null);
      setMainAutoDetect(null);
      applyLoopMarkers(mainEditorViewRef.current, []);
    }
    addToast('success', `Loaded "${sample.title}" sample`);
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key.toLowerCase() === 'enter') {
        e.preventDefault();
        if (mode === 'single') analyzeSingle();
        else analyzeCompare();
      } else if (meta && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandOpen(true);
      } else if (meta && e.key === '1') {
        e.preventDefault();
        setMode('single');
        addToast('info', 'Switched to Analyze mode');
      } else if (meta && e.key === '2') {
        e.preventDefault();
        setMode('compare');
        addToast('info', 'Switched to Compare mode');
      } else if (e.key === '?') {
        e.preventDefault();
        setShortcutsOpen(true);
      } else if (e.key === 'Escape') {
        setGalleryOpen(false);
        setShortcutsOpen(false);
        setCommandOpen(false);
        setShowCompareHint(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [mode, analyzeSingle, analyzeCompare, addToast]);

  const renderVerdict = useMemo(() => {
    if (!leftResult || !rightResult) return null;
    const leftRank = getComplexityRank(leftResult.timeComplexity);
    const rightRank = getComplexityRank(rightResult.timeComplexity);
    let winner: 'left' | 'right' | 'tie';
    let message: string;
    if (leftRank < rightRank) {
      winner = 'left';
      message = `Left is more efficient (${leftResult.timeComplexity} vs ${rightResult.timeComplexity})`;
    } else if (rightRank < leftRank) {
      winner = 'right';
      message = `Right is more efficient (${rightResult.timeComplexity} vs ${leftResult.timeComplexity})`;
    } else {
      if (leftResult.timeConfidence > rightResult.timeConfidence) {
        winner = 'left';
        message = `Same complexity, Left has higher confidence (${Math.round(leftResult.timeConfidence)}% vs ${Math.round(rightResult.timeConfidence)}%)`;
      } else if (rightResult.timeConfidence > leftResult.timeConfidence) {
        winner = 'right';
        message = `Same complexity, Right has higher confidence`;
      } else {
        winner = 'tie';
        message = `It's a tie! Same complexity and similar confidence scores.`;
      }
    }
    return { winner, message };
  }, [leftResult, rightResult]);

  return (
    <div className="flex flex-col h-[calc(100vh-68px)] max-w-7xl mx-auto px-3 sm:px-6 py-4 gap-4">
      {/* Compare mode first-visit teaser banner */}
      {showCompareHint && mode === 'compare' && (
        <div className="relative animate-bounce-in">
          <div className="p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-3"
            style={{
              background: 'linear-gradient(135deg, rgba(102,56,255,0.12), rgba(0,228,255,0.08))',
              borderColor: 'rgba(102,56,255,0.3)',
            }}
          >
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-500 to-highlight-400 flex items-center justify-center text-xl flex-shrink-0 shadow-glow animate-float">
                ⚔️
              </div>
              <div className="min-w-0">
                <p className="font-bold text-text-primary dark:text-text-primary-dark mb-0.5">
                  Welcome to Compare mode!
                </p>
                <p className="text-sm text-text-secondary dark:text-text-secondary-dark leading-relaxed">
                  Two pre-loaded Fibonacci examples are being analyzed side-by-side. The iterative version <span className="font-semibold text-success-500">O(n)</span> crushes the naive recursion <span className="font-semibold text-danger-500">O(2ⁿ)</span> — the winner banner now stays pinned at the top.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Tooltip content="Press ⌘/Ctrl+K for the command palette">
                <Badge size="sm" variant="primary">Tip: load your own snippets →</Badge>
              </Tooltip>
              <button
                onClick={dismissCompareHint}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted dark:text-text-muted-dark hover:text-text-primary dark:hover:text-text-primary-dark hover:bg-bg-secondary/70 dark:hover:bg-bg-secondary-dark/70 transition-colors"
                aria-label="Dismiss compare hint"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============ UNIFIED PRIMARY ACTION BAR (CONTROL STRIP) ============ */}
      <div className="control-strip p-2 sm:p-2.5 animate-fade-in">
        <div className="relative z-10 flex flex-wrap items-center gap-2 sm:gap-3">
          {/* LEFT GROUP: Mode + Language + Utilities */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <Tabs
              defaultValue={mode}
              onValueChange={(v) => setMode(v as Mode)}
              className="flex items-center"
            >
              <TabsList className="!p-1">
                <TabsTrigger value="single" className="!text-xs sm:!text-sm !px-2.5 sm:!px-3">
                  <span className="mr-1">🧠</span>
                  <span className="hidden xs:inline">Analyze</span>
                </TabsTrigger>
                <TabsTrigger value="compare" className="!text-xs sm:!text-sm !px-2.5 sm:!px-3">
                  <span className="mr-1">⚔️</span>
                  <span className="hidden xs:inline">Compare</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {mode === 'single' && (
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline text-[11px] font-semibold uppercase tracking-wider text-text-muted dark:text-text-muted-dark">
                  Lang
                </span>
                <select
                  value={language}
                  onChange={(e) => {
                    setLanguage(e.target.value as Language);
                    setMainAutoDetect(null);
                  }}
                  className="select-native select-sm !py-1.5 sm:!py-2"
                >
                  <option value="javascript">JavaScript</option>
                  <option value="typescript">TypeScript</option>
                  <option value="python">Python</option>
                  <option value="java">Java</option>
                  <option value="c">C</option>
                  <option value="cpp">C++</option>
                </select>
              </div>
            )}

            <div className="h-6 w-px bg-text-muted/20 dark:bg-text-muted-dark/20 mx-0.5 hidden sm:block" />

            <div className="flex items-center gap-1.5">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setGalleryTarget(mode === 'single' ? 'main' : 'left');
                  setGalleryOpen(true);
                }}
                id="library-step"
                className="!text-xs sm:!text-sm"
              >
                <span className="mr-1">📚</span>
                <span className="hidden sm:inline">Library</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShortcutsOpen(true)}
                title="Keyboard Shortcuts (Press ?)"
                className="!text-xs sm:!text-sm"
              >
                <span className="mr-1">⌨️</span>
                <span className="hidden sm:inline">Shortcuts</span>
              </Button>
            </div>
          </div>

          {/* RIGHT GROUP: Primary CTA */}
          <div className="flex items-center gap-2" id="analyze-button-step" ref={analyzeBtnRef}>
            <Tooltip content={mode === 'single' ? 'Press ⌘/Ctrl + Enter' : 'Press ⌘/Ctrl + Enter'} position="left">
              <Button
                size="lg"
                onClick={mode === 'single' ? analyzeSingle : analyzeCompare}
                disabled={
                  mode === 'single'
                    ? (isAnalyzing || !code.trim())
                    : (loadingCompare || !leftCode.trim() || !rightCode.trim())
                }
                className="btn-primary-cta !px-4 sm:!px-5 !py-2 sm:!py-2.5 !text-sm sm:!text-base !rounded-xl animate-glow-pulse"
              >
                {mode === 'single'
                  ? (isAnalyzing ? (
                      <><span className="animate-spin mr-1.5">⏳</span>Analyzing...</>)
                    : (
                      <><span className="mr-1">✨</span>Analyze This</>
                    ))
                  : (loadingCompare ? (
                      <><span className="animate-spin mr-1.5">🔍</span>Comparing...</>)
                    : (
                      <><span className="mr-1">⚡</span>Compare Both</>
                    ))}
              </Button>
            </Tooltip>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-text-muted/10 bg-bg-secondary/75 dark:bg-bg-secondary-dark/75 backdrop-blur px-4 py-3 shadow-subtle flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-text-muted dark:text-text-muted-dark">Production tools</p>
          <p className="text-sm text-text-secondary dark:text-text-secondary-dark mt-1">
            Share the current analysis, export it as PDF/PNG, or jump into the command palette with one shortcut.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" onClick={shareCurrentAnalysis} className="!text-xs sm:!text-sm">
            <span className="mr-1">🔗</span> Share Link
          </Button>
          <Button variant="ghost" size="sm" onClick={exportCurrentAnalysisAsPng} disabled={mode === 'single' ? !result : !(leftResult && rightResult)} className="!text-xs sm:!text-sm">
            <span className="mr-1">🖼️</span> PNG
          </Button>
          <Button variant="ghost" size="sm" onClick={exportCurrentAnalysisAsPdf} disabled={mode === 'single' ? !result : !(leftResult && rightResult)} className="!text-xs sm:!text-sm">
            <span className="mr-1">📄</span> PDF
          </Button>
          <Button variant="primary" size="sm" onClick={() => setCommandOpen(true)} className="!text-xs sm:!text-sm">
            <span className="mr-1">⌘K</span> Menu
          </Button>
        </div>
      </div>

      {mode === 'single' && refactorSuggestion && (
        <Card className="overflow-hidden border-success-500/25 bg-success-500/5 dark:bg-success-500/10 animate-bounce-in">
          <CardContent className="p-4 sm:p-5">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-success-600 dark:text-success-400">Apply Optimization</p>
                <h3 className="text-lg font-black text-text-primary dark:text-text-primary-dark mt-1">
                  {refactorSuggestion.title}
                </h3>
                <p className="text-sm text-text-secondary dark:text-text-secondary-dark mt-2 max-w-3xl">
                  {refactorSuggestion.explanation}
                </p>
              </div>
              <Button variant="success" size="sm" onClick={applyOptimization} className="shrink-0">
                Apply Optimization
              </Button>
            </div>
            <pre className="mt-4 overflow-x-auto rounded-xl border border-text-muted/10 dark:border-text-muted-dark/10 bg-bg-primary/80 dark:bg-bg-primary-dark/80 p-4 text-xs leading-relaxed text-text-primary dark:text-text-primary-dark font-mono">
              {refactorSuggestion.code}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Main Panes */}
      {mode === 'single' ? (
        <div id="reasoning-step" className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0">
          {/* Editor Card — glassmorphic container with gradient border */}
          <div className="flex flex-col overflow-hidden modern-card hover-lift">
            {/* ACTION UTILITIES BAR */}
            <div className="relative z-10 px-3 sm:px-4 py-2.5 border-b border-text-muted/10 dark:border-text-muted-dark/10 flex items-center justify-between gap-2 bg-gradient-to-r from-accent-500/8 via-transparent to-highlight-400/8">
              {/* LEFT: Language icon + filename + Auto-Detected badge */}
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-bg-tertiary/70 dark:bg-bg-tertiary-dark/70 border border-text-muted/10 dark:border-text-muted-dark/10">
                  <span className="text-sm">{LANG_META[language].icon}</span>
                  <span className="text-[11px] font-bold uppercase tracking-wide text-text-secondary dark:text-text-secondary-dark font-mono hidden sm:inline">
                    {LANG_META[language].label}
                  </span>
                </div>
                <span className="text-xs font-mono font-semibold text-text-secondary dark:text-text-secondary-dark min-w-0 truncate" title={FILE_NAME[language]}>
                  {FILE_NAME[language]}
                </span>
                {mainAutoDetect && (
                  <Tooltip content={`Switched grammar to ${LANG_META[mainAutoDetect].label} automatically`} position="bottom">
                    <Badge variant="primary" size="xs" className="animate-bounce-in !text-[10px] !px-2 !py-0.5 tracking-wide uppercase shadow-glow-primary">
                      <span className="mr-1">✨</span>Auto-Detected: {LANG_META[mainAutoDetect].label}
                    </Badge>
                  </Tooltip>
                )}
              </div>
              {/* RIGHT: Load Sample + Copy Clear Format */}
              <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                <Tooltip content="Open command palette (⌘K)" position="bottom">
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => { setGalleryTarget('main'); setGalleryOpen(true); }}
                    className="!px-2"
                  >
                    <span className="sm:hidden">📚</span>
                    <span className="hidden sm:inline">📚 Sample</span>
                  </Button>
                </Tooltip>
                <div className="h-5 w-px bg-text-muted/20 dark:bg-text-muted-dark/20 mx-0.5 hidden sm:block" />
                <Tooltip content="Copy code (⌘C)">
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => copyCode(code, LANG_META[language].label + ' code')}
                    disabled={!code.trim()}
                    className="!px-2"
                  >
                    📋<span className="hidden sm:inline ml-1">Copy</span>
                  </Button>
                </Tooltip>
                <Tooltip content="Auto-indent / Format code">
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => formatAndSet(code, language, setCode, mainEditorViewRef)}
                    disabled={!code.trim()}
                    className="!px-2"
                  >
                    ✨<span className="hidden sm:inline ml-1">Format</span>
                  </Button>
                </Tooltip>
                <Tooltip content="Clear editor">
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => clearCode(setCode, mainEditorViewRef, LANG_META[language].label + ' editor')}
                    disabled={!code.trim()}
                    className="!px-2"
                  >
                    🗑️<span className="hidden sm:inline ml-1">Clear</span>
                  </Button>
                </Tooltip>
              </div>
            </div>
            <div id="code-editor-step" className="flex flex-col flex-1 min-h-0 relative z-10" ref={editorRef}>
              <CodeEditor
                code={code}
                setCode={setCode}
                language={language}
                onEditorReady={(view) => { mainEditorViewRef.current = view; }}
                onUserEdited={(next, kind) => {
                  if (kind === 'paste' || (kind === 'input' && next.length > 30)) {
                    void next;
                    void kind;
                  }
                }}
              />
            </div>
          </div>
          {/* Results Card */}
          <div className="flex flex-col min-h-0">
            {!showResults ? (
              <ResultPanel result={null} analyzing={false} />
            ) : (
              <ResultPanel result={result} analyzing={isAnalyzing} />
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4 flex-1 min-h-0">
          {renderVerdict && leftResult && rightResult && (
            <div className="sticky top-2 z-30 animate-bounce-in">
              {(() => {
                const banner = formatCompareHeader(renderVerdict.winner, leftResult, rightResult);
                return (
                  <Card className={`overflow-hidden border-2 ${renderVerdict.winner === 'left' ? 'border-success-500/50 bg-success-500/5' : renderVerdict.winner === 'right' ? 'border-accent-500/50 bg-accent-500/5' : 'border-highlight-400/50 bg-highlight-400/5'}`}>
                    <CardContent className="p-4 sm:p-5">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div className="min-w-0">
                          <p className="text-[11px] font-black uppercase tracking-[0.28em] text-text-muted dark:text-text-muted-dark mb-2">Compare verdict</p>
                          <p className="text-xl sm:text-2xl font-black text-text-primary dark:text-text-primary-dark leading-tight">{banner.title}</p>
                          <p className="mt-1 text-sm sm:text-base text-text-secondary dark:text-text-secondary-dark">{banner.details}</p>
                        </div>
                        <div className={`rounded-2xl border px-4 py-3 text-right ${renderVerdict.winner === 'left' ? 'border-success-500/20 bg-success-500/10' : renderVerdict.winner === 'right' ? 'border-accent-500/20 bg-accent-500/10' : 'border-highlight-400/20 bg-highlight-400/10'}`}>
                          <p className="text-sm font-semibold text-text-muted dark:text-text-muted-dark uppercase tracking-[0.18em]">{banner.winnerLabel}</p>
                          <p className="text-lg sm:text-xl font-black text-text-primary dark:text-text-primary-dark">{banner.subtitle}</p>
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                        <div className="rounded-xl border border-text-muted/10 dark:border-text-muted-dark/10 bg-bg-secondary/60 dark:bg-bg-secondary-dark/60 px-3 py-2">
                          <span className="block text-text-muted dark:text-text-muted-dark uppercase tracking-[0.16em] mb-1">Winner</span>
                          <span className="font-semibold text-text-primary dark:text-text-primary-dark">{renderVerdict.winner === 'left' ? 'Snippet A' : renderVerdict.winner === 'right' ? 'Snippet B' : 'Tie'}</span>
                        </div>
                        <div className="rounded-xl border border-text-muted/10 dark:border-text-muted-dark/10 bg-bg-secondary/60 dark:bg-bg-secondary-dark/60 px-3 py-2">
                          <span className="block text-text-muted dark:text-text-muted-dark uppercase tracking-[0.16em] mb-1">Complexity gap</span>
                          <span className="font-semibold text-text-primary dark:text-text-primary-dark">{leftResult.timeComplexity} vs {rightResult.timeComplexity}</span>
                        </div>
                        <div className="rounded-xl border border-text-muted/10 dark:border-text-muted-dark/10 bg-bg-secondary/60 dark:bg-bg-secondary-dark/60 px-3 py-2">
                          <span className="block text-text-muted dark:text-text-muted-dark uppercase tracking-[0.16em] mb-1">Confidence</span>
                          <span className="font-semibold text-text-primary dark:text-text-primary-dark">{Math.round(renderVerdict.winner === 'left' ? leftResult.timeConfidence : renderVerdict.winner === 'right' ? rightResult.timeConfidence : Math.max(leftResult.timeConfidence, rightResult.timeConfidence))}%</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })()}
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_1px_minmax(0,1fr)] gap-4 flex-1 min-h-0">
            {/* LEFT — SNIPPET A */}
            <div className="flex flex-col gap-3 min-h-0">
            <Card className="border-success-500/30 overflow-hidden hover-lift glow-border">
              <CardContent className="p-0">
                {/* ACTION UTILITIES BAR: SNIPPET A */}
                <div className="px-3 sm:px-4 py-2.5 border-b border-text-muted/10 dark:border-text-muted-dark/10 flex items-center justify-between gap-2 bg-gradient-to-r from-success-500/8 via-transparent to-transparent">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Badge variant="success" size="sm">Snippet A</Badge>
                    <div className="hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-bg-tertiary/60 dark:bg-bg-tertiary-dark/60 border border-text-muted/10 dark:border-text-muted-dark/10">
                      <span className="text-xs">{LANG_META[leftLang].icon}</span>
                    </div>
                    <select
                      value={leftLang}
                      onChange={(e) => { setLeftLang(e.target.value as Language); setLeftAutoDetect(null); }}
                      className="select-native select-sm !py-1 !text-xs"
                    >
                      <option value="javascript">JS</option>
                      <option value="typescript">TS</option>
                      <option value="python">PY</option>
                      <option value="java">Java</option>
                      <option value="c">C</option>
                      <option value="cpp">C++</option>
                    </select>
                    <span className="hidden md:inline text-[11px] font-mono text-text-muted dark:text-text-muted-dark truncate">· {FILE_NAME[leftLang]}</span>
                    {leftAutoDetect && (
                      <Tooltip content={`Auto-detected ${LANG_META[leftAutoDetect].label} — grammar updated`} position="bottom">
                        <Badge variant="success" size="xs" className="animate-bounce-in !text-[9px] !px-1.5 !py-0.5 uppercase">
                          ✨ {LANG_META[leftAutoDetect].label}
                        </Badge>
                      </Tooltip>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Tooltip content="Open command palette (⌘K)" position="bottom">
                      <Button variant="ghost" size="xs" onClick={() => { setGalleryTarget('left'); setGalleryOpen(true); }} className="!px-2">📚</Button>
                    </Tooltip>
                    <Tooltip content="Copy snippet A"><Button variant="ghost" size="xs" onClick={() => copyCode(leftCode, 'Snippet A')} disabled={!leftCode.trim()} className="!px-2">📋</Button></Tooltip>
                    <Tooltip content="Format indentation"><Button variant="ghost" size="xs" onClick={() => formatAndSet(leftCode, leftLang, setLeftCode, leftEditorViewRef)} disabled={!leftCode.trim()} className="!px-2">✨</Button></Tooltip>
                    <Tooltip content="Clear snippet A"><Button variant="ghost" size="xs" onClick={() => clearCode(setLeftCode, leftEditorViewRef, 'Snippet A')} disabled={!leftCode.trim()} className="!px-2">🗑️</Button></Tooltip>
                  </div>
                </div>
                <div className="h-64 bg-bg-tertiary/20 dark:bg-bg-tertiary-dark/20 flex flex-col min-h-0">
                  <CodeEditor
                    code={leftCode}
                    setCode={setLeftCode}
                    language={leftLang}
                    onEditorReady={(view) => { leftEditorViewRef.current = view; }}
                    onUserEdited={(next, kind) => {
                      if (kind === 'paste' || (kind === 'input' && next.length > 30)) {
                        void next;
                        void kind;
                      }
                    }}
                  />
                </div>
              </CardContent>
            </Card>
            <CompareLineCostPanel
              title="Cost hotspots"
              subtitle="Red lines mark costly operations, nested loops, and expensive calls."
              code={leftCode}
              result={leftResult}
              tone="danger"
            />
            <div className="flex-1 min-h-0 overflow-hidden">
              <ResultPanel
                result={leftResult}
                analyzing={leftAnalyzing}
                title="Analyze snippet A to see results"
                accent="success"
              />
            </div>
          </div>
          <div className="hidden xl:block self-stretch w-px bg-text-muted/15 dark:bg-text-muted-dark/15 rounded-full" />
          {/* RIGHT — SNIPPET B */}
          <div className="flex flex-col gap-3 min-h-0">
            <Card className="border-accent-500/30 overflow-hidden hover-lift glow-border">
              <CardContent className="p-0">
                {/* ACTION UTILITIES BAR: SNIPPET B */}
                <div className="px-3 sm:px-4 py-2.5 border-b border-text-muted/10 dark:border-text-muted-dark/10 flex items-center justify-between gap-2 bg-gradient-to-r from-accent-500/8 via-transparent to-transparent">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Badge variant="primary" size="sm">Snippet B</Badge>
                    <div className="hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-bg-tertiary/60 dark:bg-bg-tertiary-dark/60 border border-text-muted/10 dark:border-text-muted-dark/10">
                      <span className="text-xs">{LANG_META[rightLang].icon}</span>
                    </div>
                    <select
                      value={rightLang}
                      onChange={(e) => { setRightLang(e.target.value as Language); setRightAutoDetect(null); }}
                      className="select-native select-sm !py-1 !text-xs"
                    >
                      <option value="javascript">JS</option>
                      <option value="typescript">TS</option>
                      <option value="python">PY</option>
                      <option value="java">Java</option>
                      <option value="c">C</option>
                      <option value="cpp">C++</option>
                    </select>
                    <span className="hidden md:inline text-[11px] font-mono text-text-muted dark:text-text-muted-dark truncate">· {FILE_NAME[rightLang]}</span>
                    {rightAutoDetect && (
                      <Tooltip content={`Auto-detected ${LANG_META[rightAutoDetect].label} — grammar updated`} position="bottom">
                        <Badge variant="primary" size="xs" className="animate-bounce-in !text-[9px] !px-1.5 !py-0.5 uppercase">
                          ✨ {LANG_META[rightAutoDetect].label}
                        </Badge>
                      </Tooltip>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Tooltip content="Open command palette (⌘K)" position="bottom">
                      <Button variant="ghost" size="xs" onClick={() => { setGalleryTarget('right'); setGalleryOpen(true); }} className="!px-2">📚</Button>
                    </Tooltip>
                    <Tooltip content="Copy snippet B"><Button variant="ghost" size="xs" onClick={() => copyCode(rightCode, 'Snippet B')} disabled={!rightCode.trim()} className="!px-2">📋</Button></Tooltip>
                    <Tooltip content="Format indentation"><Button variant="ghost" size="xs" onClick={() => formatAndSet(rightCode, rightLang, setRightCode, rightEditorViewRef)} disabled={!rightCode.trim()} className="!px-2">✨</Button></Tooltip>
                    <Tooltip content="Clear snippet B"><Button variant="ghost" size="xs" onClick={() => clearCode(setRightCode, rightEditorViewRef, 'Snippet B')} disabled={!rightCode.trim()} className="!px-2">🗑️</Button></Tooltip>
                  </div>
                </div>
                <div className="h-64 bg-bg-tertiary/20 dark:bg-bg-tertiary-dark/20 flex flex-col min-h-0">
                  <CodeEditor
                    code={rightCode}
                    setCode={setRightCode}
                    language={rightLang}
                    onEditorReady={(view) => { rightEditorViewRef.current = view; }}
                    onUserEdited={(next, kind) => {
                      if (kind === 'paste' || (kind === 'input' && next.length > 30)) {
                        void next;
                        void kind;
                      }
                    }}
                  />
                </div>
              </CardContent>
            </Card>
            <CompareLineCostPanel
              title="Efficiency wins"
              subtitle="Green lines mark low-cost loops, fast lookups, and tighter paths."
              code={rightCode}
              result={rightResult}
              tone="success"
            />
            <div className="flex-1 min-h-0 overflow-hidden">
              <ResultPanel
                result={rightResult}
                analyzing={rightAnalyzing}
                title="Analyze snippet B to see results"
                accent="primary"
              />
            </div>
          </div>
        </div>
        </div>
      )}

      <SampleGallery
        open={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        onSelect={onSelectSample}
      />

      <div
        ref={exportReportRef}
        aria-hidden="true"
        className="fixed -left-[12000px] top-0 w-[980px] bg-white text-slate-900 p-8"
      >
        <div className="flex items-center justify-between mb-6 border-b border-slate-200 pb-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-slate-500">Big-O Analyzer</p>
            <h2 className="text-3xl font-black mt-1">Analysis Report</h2>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">Live snapshot</p>
            <p className="text-sm font-semibold">{mode === 'single' ? 'Single snippet' : 'Compare mode'}</p>
          </div>
        </div>
        {mode === 'single' && result && (
          <div className="space-y-5">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="rounded-xl border border-slate-200 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Language</p>
                <p className="mt-1 font-bold">{language}</p>
              </div>
              <div className="rounded-xl border border-slate-200 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Time</p>
                <p className="mt-1 font-bold">{result.timeComplexity}</p>
              </div>
              <div className="rounded-xl border border-slate-200 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Confidence</p>
                <p className="mt-1 font-bold">{Math.round(result.timeConfidence)}%</p>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 p-5">
              <p className="text-sm font-bold mb-3">Summary</p>
              <p className="text-sm leading-relaxed text-slate-700">{result.detailed.highLevelSummary}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 p-5">
              <p className="text-sm font-bold mb-3">Code</p>
              <pre className="whitespace-pre-wrap text-xs leading-relaxed font-mono text-slate-800">{code}</pre>
            </div>
          </div>
        )}
        {mode === 'compare' && leftResult && rightResult && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="rounded-xl border border-slate-200 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Snippet A</p>
                <p className="mt-1 font-bold">{leftLang} · {leftResult.timeComplexity}</p>
              </div>
              <div className="rounded-xl border border-slate-200 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Snippet B</p>
                <p className="mt-1 font-bold">{rightLang} · {rightResult.timeComplexity}</p>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 p-5">
              <p className="text-sm font-bold mb-3">Snippet A</p>
              <pre className="whitespace-pre-wrap text-xs leading-relaxed font-mono text-slate-800">{leftCode}</pre>
            </div>
            <div className="rounded-2xl border border-slate-200 p-5">
              <p className="text-sm font-bold mb-3">Snippet B</p>
              <pre className="whitespace-pre-wrap text-xs leading-relaxed font-mono text-slate-800">{rightCode}</pre>
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-4 left-1/2 z-40 -translate-x-1/2 px-4 py-2 rounded-full border border-text-muted/15 bg-bg-secondary/90 dark:bg-bg-secondary-dark/90 backdrop-blur shadow-strong text-xs sm:text-sm text-text-secondary dark:text-text-secondary-dark flex items-center gap-2">
        <span className="hidden sm:inline font-semibold uppercase tracking-[0.2em] text-text-muted dark:text-text-muted-dark">HUD</span>
        <button onClick={() => setCommandOpen(true)} className="font-medium hover:text-text-primary dark:hover:text-text-primary-dark transition-colors">
          Press <kbd className="px-1.5 py-0.5 rounded bg-bg-tertiary dark:bg-bg-tertiary-dark border border-text-muted/20">⌘K</kbd> for Library
        </button>
      </div>

      <Command.Dialog open={commandOpen} onOpenChange={setCommandOpen} label="Big-O Analyzer command menu">
        <div className="fixed inset-0 z-[60] bg-black/55 backdrop-blur-sm">
          <div className="mx-auto mt-24 w-[min(92vw,720px)] overflow-hidden rounded-3xl border border-text-muted/15 bg-bg-secondary dark:bg-bg-secondary-dark shadow-strong">
            <Command className="w-full">
              <div className="border-b border-text-muted/10 px-4 py-4">
                <Command.Input
                  autoFocus
                  placeholder="Search actions..."
                  className="w-full bg-transparent text-base outline-none placeholder:text-text-muted dark:placeholder:text-text-muted-dark text-text-primary dark:text-text-primary-dark"
                />
              </div>
              <Command.List className="max-h-[60vh] overflow-y-auto p-2">
                <Command.Empty className="px-4 py-8 text-center text-sm text-text-muted dark:text-text-muted-dark">
                  No matching actions.
                </Command.Empty>
                <Command.Group heading="Quick Actions" className="px-2 pb-2 text-xs font-semibold uppercase tracking-[0.22em] text-text-muted dark:text-text-muted-dark">
                  <Command.Item
                    onSelect={() => { setGalleryTarget(mode === 'single' ? 'main' : 'left'); setGalleryOpen(true); setCommandOpen(false); }}
                    className="flex cursor-pointer items-center justify-between rounded-xl px-3 py-3 text-sm text-text-primary dark:text-text-primary-dark outline-none data-[selected=true]:bg-accent-500/10 data-[selected=true]:text-accent-600"
                  >
                    <span>Open sample library</span>
                    <span className="text-xs text-text-muted">📚</span>
                  </Command.Item>
                  <Command.Item
                    onSelect={() => { void shareCurrentAnalysis(); setCommandOpen(false); }}
                    className="flex cursor-pointer items-center justify-between rounded-xl px-3 py-3 text-sm text-text-primary dark:text-text-primary-dark outline-none data-[selected=true]:bg-accent-500/10 data-[selected=true]:text-accent-600"
                  >
                    <span>Copy share link</span>
                    <span className="text-xs text-text-muted">🔗</span>
                  </Command.Item>
                  <Command.Item
                    onSelect={() => { void exportCurrentAnalysisAsPng(); setCommandOpen(false); }}
                    className="flex cursor-pointer items-center justify-between rounded-xl px-3 py-3 text-sm text-text-primary dark:text-text-primary-dark outline-none data-[selected=true]:bg-accent-500/10 data-[selected=true]:text-accent-600"
                  >
                    <span>Export PNG report</span>
                    <span className="text-xs text-text-muted">🖼️</span>
                  </Command.Item>
                  <Command.Item
                    onSelect={() => { void exportCurrentAnalysisAsPdf(); setCommandOpen(false); }}
                    className="flex cursor-pointer items-center justify-between rounded-xl px-3 py-3 text-sm text-text-primary dark:text-text-primary-dark outline-none data-[selected=true]:bg-accent-500/10 data-[selected=true]:text-accent-600"
                  >
                    <span>Export PDF report</span>
                    <span className="text-xs text-text-muted">📄</span>
                  </Command.Item>
                  {mode === 'single' && (
                    <Command.Item
                      onSelect={() => { applyOptimization(); setCommandOpen(false); }}
                      disabled={!refactorSuggestion}
                      className="flex cursor-pointer items-center justify-between rounded-xl px-3 py-3 text-sm text-text-primary dark:text-text-primary-dark outline-none data-[selected=true]:bg-success-500/10 data-[selected=true]:text-success-600 disabled:opacity-40"
                    >
                      <span>Apply optimization</span>
                      <span className="text-xs text-text-muted">🚀</span>
                    </Command.Item>
                  )}
                  <Command.Item
                    onSelect={() => { setShortcutsOpen(true); setCommandOpen(false); }}
                    className="flex cursor-pointer items-center justify-between rounded-xl px-3 py-3 text-sm text-text-primary dark:text-text-primary-dark outline-none data-[selected=true]:bg-accent-500/10 data-[selected=true]:text-accent-600"
                  >
                    <span>Open shortcuts</span>
                    <span className="text-xs text-text-muted">⌨️</span>
                  </Command.Item>
                </Command.Group>
                <Command.Separator className="my-2 h-px bg-text-muted/10" />
                <Command.Group heading="Mode" className="px-2 pb-2 text-xs font-semibold uppercase tracking-[0.22em] text-text-muted dark:text-text-muted-dark">
                  <Command.Item
                    onSelect={() => { setMode('single'); setCommandOpen(false); }}
                    className="flex cursor-pointer items-center justify-between rounded-xl px-3 py-3 text-sm text-text-primary dark:text-text-primary-dark outline-none data-[selected=true]:bg-accent-500/10 data-[selected=true]:text-accent-600"
                  >
                    <span>Switch to Analyze</span>
                    <span className="text-xs text-text-muted">🧠</span>
                  </Command.Item>
                  <Command.Item
                    onSelect={() => { setMode('compare'); setCommandOpen(false); }}
                    className="flex cursor-pointer items-center justify-between rounded-xl px-3 py-3 text-sm text-text-primary dark:text-text-primary-dark outline-none data-[selected=true]:bg-accent-500/10 data-[selected=true]:text-accent-600"
                  >
                    <span>Switch to Compare</span>
                    <span className="text-xs text-text-muted">⚔️</span>
                  </Command.Item>
                </Command.Group>
              </Command.List>
            </Command>
          </div>
        </div>
      </Command.Dialog>

      <ShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
      <OnboardingTour />
    </div>
  );
}
