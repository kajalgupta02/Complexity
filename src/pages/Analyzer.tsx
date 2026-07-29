import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { EditorView, basicSetup } from 'codemirror';
import { EditorState, type Extension } from '@codemirror/state';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { java } from '@codemirror/lang-java';
import { cpp } from '@codemirror/lang-cpp';
import { lineNumbers } from '@codemirror/view';
import { oneDark } from '@codemirror/theme-one-dark';
import type { ViewUpdate } from '@codemirror/view';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Tooltip } from '@/components/ui/Tooltip';
import { analyzeCode, type AnalysisResult, type SupportedLanguage } from '@/lib/analyzer';
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
  cpp: cpp()
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
  { id: 'overview', label: 'Overview', icon: '📊', hint: 'Language, Summary, Algorithm' },
  { id: 'algorithm', label: 'Execution', icon: '🧠', hint: 'Step-by-step walkthrough' },
  { id: 'complexity', label: 'Complexity', icon: '⚡', hint: 'Time/Space + Derivation' },
  { id: 'loops', label: 'Loops & Recursion', icon: '🔁', hint: 'Detailed loop breakdown' },
  { id: 'memory', label: 'Memory & Perf', icon: '💾', hint: 'Memory usage & notes' },
  { id: 'optimizations', label: 'Optimizations', icon: '🚀', hint: 'How to make it faster' },
];

const FILE_EXT: Record<Language, string> = {
  javascript: 'js',
  typescript: 'ts',
  python: 'py',
  java: 'java',
  cpp: 'cpp',
};

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
}

interface EditorDivElement extends HTMLDivElement {
  setContent?: (text: string) => void;
}

function CodeEditor({ code, setCode, language, onEditorReady }: CodeEditorProps) {
  const editorRef = useRef<EditorDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);
  const langRef = useRef(language);
  langRef.current = language;
  const isSyncingRef = useRef(false);
  const prevCodeRef = useRef(code);

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

  useEffect(() => {
    if (editorRef.current && !viewRef.current) {
      prevCodeRef.current = code;
      const view = new EditorView({
        doc: code,
        extensions: [
          basicSetup,
          lineNumbers(),
          getCurrentTheme(),
          LANG_EXTENSIONS[langRef.current],
          EditorView.updateListener.of((update: ViewUpdate) => {
            if (update.docChanged && !isSyncingRef.current) {
              const next = update.state.doc.toString();
              prevCodeRef.current = next;
              setCode(next);
            }
          }),
          EditorView.theme({
            '&': { height: '100%', fontSize: '14px' },
            '.cm-content': { fontFamily: 'JetBrains Mono, monospace' }
          })
        ],
        parent: editorRef.current
      });
      viewRef.current = view;
      onEditorReady?.(view);
    }
    return () => {
      viewRef.current?.destroy();
      viewRef.current = null;
    };
  }, [onEditorReady, setCode, code]);

  useEffect(() => {
    if (!viewRef.current) return;
    const currentDoc = viewRef.current.state.doc.toString();
    const state = EditorState.create({
      doc: currentDoc,
      extensions: [
        basicSetup,
        lineNumbers(),
        getCurrentTheme(),
        LANG_EXTENSIONS[language],
        EditorView.updateListener.of((update: ViewUpdate) => {
          if (update.docChanged && !isSyncingRef.current) {
            const next = update.state.doc.toString();
            prevCodeRef.current = next;
            setCode(next);
          }
        }),
        EditorView.theme({
          '&': { height: '100%', fontSize: '14px' },
          '.cm-content': { fontFamily: 'JetBrains Mono, monospace' }
        })
      ]
    });
    viewRef.current.setState(state);
  }, [language, setCode]);

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

  const variant = getComplexityColor(d.finalResult.worstTime);
  const glow = getGlowClass(variant);

  return (
    <div className="h-full overflow-y-auto space-y-3 pr-1 snap-results" style={{ scrollbarGutter: 'stable' }}>
      {/* ============ HERO: BIG-O + CONFIDENCE ============ */}
      <div
        className="relative overflow-hidden rounded-2xl p-6 border animate-bounce-in snap-result-section"
        style={{
          background: accent === 'success'
            ? 'linear-gradient(135deg, rgba(16,185,129,0.14), rgba(34,211,238,0.09))'
            : 'linear-gradient(135deg, rgba(99,102,241,0.14), rgba(34,211,238,0.09))',
          borderColor: accent === 'success' ? 'rgba(16,185,129,0.32)' : 'rgba(99,102,241,0.32)',
        }}
      >
        <div className="absolute -top-16 -right-16 w-60 h-60 rounded-full opacity-25 blur-3xl"
          style={{ background: accent === 'success' ? '#10b981' : '#6366f1' }}
        />
        <div className="relative flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" size="sm" className="uppercase tracking-wider text-[10px] font-semibold">
                {d.programmingLanguage}
              </Badge>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${DIFFICULTY_BG[d.finalResult.difficulty] ?? ''} ${DIFFICULTY_COLOR[d.finalResult.difficulty] ?? ''}`}>
                {d.finalResult.difficulty}
              </span>
            </div>
            <p className="text-xs text-text-tertiary dark:text-text-tertiary-dark mb-1 font-medium uppercase tracking-wide">
              Time Complexity
            </p>
            <h2 className="text-4xl sm:text-5xl font-black text-gradient stat-number tracking-tight">
              {d.timeComplexity.worst}
            </h2>
            <p className="mt-2 text-sm text-text-secondary dark:text-text-secondary-dark leading-relaxed max-w-xl">
              {d.highLevelSummary}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Tooltip content={`Confidence score: ${Math.round(result.timeConfidence)}%`}>
              <Badge size="md" variant={variant} className={`text-base px-4 py-1.5 ${glow} animate-count-up`}>
                {Math.round(result.timeConfidence)}%
              </Badge>
            </Tooltip>
            <div className="flex flex-wrap gap-1.5 justify-end max-w-[220px]">
              {d.algorithmUsed.slice(0, 3).map((a) => (
                <Badge key={a} variant="primary" size="xs" className="animate-count-up">
                  {a}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ============ CONFIDENCE BAR ============ */}
      <Card className="snap-result-section animate-slide-up delay-1">
        <CardContent className="py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-text-secondary dark:text-text-secondary-dark">Confidence</span>
            <span className="text-sm font-bold text-gradient-accent stat-number">{Math.round(result.timeConfidence)}%</span>
          </div>
          <div className="w-full h-2.5 bg-bg-tertiary dark:bg-bg-tertiary-dark rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-accent-500 via-highlight-400 to-accent-500 transition-all duration-700 ease-out progress-shine animate-gradient"
              style={{ width: `${result.timeConfidence}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* ============ SECTION TABS ============ */}
      <div className="snap-result-section animate-slide-up delay-2">
        <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-xl bg-bg-tertiary/60 dark:bg-bg-tertiary-dark/60 border border-text-muted/10 dark:border-text-muted-dark/10">
          {SECTION_TABS.map((tab) => (
            <Tooltip key={tab.id} content={tab.hint} position="bottom">
              <button
                onClick={() => setSection(tab.id)}
                className={[
                  'flex-1 min-w-[90px] px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-200',
                  section === tab.id
                    ? 'bg-bg-secondary dark:bg-bg-secondary-dark text-text-primary dark:text-text-primary-dark shadow-subtle scale-[1.01]'
                    : 'text-text-tertiary dark:text-text-tertiary-dark hover:text-text-primary dark:hover:text-text-primary-dark hover:bg-bg-secondary/60 dark:hover:bg-bg-secondary-dark/40',
                ].join(' ')}
              >
                <span className="text-sm">{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
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

      {/* ============ STEP-BY-STEP ============ */}
      {section === 'algorithm' && (
        <div className="space-y-3 animate-slide-in-right">
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

  const [leftCode, setLeftCode] = useState<string>(DEFAULT_LEFT);
  const [rightCode, setRightCode] = useState<string>(DEFAULT_RIGHT);
  const [leftLang, setLeftLang] = useState<Language>('javascript');
  const [rightLang, setRightLang] = useState<Language>('javascript');
  const [leftResult, setLeftResult] = useState<AnalysisResult | null>(null);
  const [rightResult, setRightResult] = useState<AnalysisResult | null>(null);
  const [leftAnalyzing, setLeftAnalyzing] = useState(false);
  const [rightAnalyzing, setRightAnalyzing] = useState(false);

  const [galleryOpen, setGalleryOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [loadingCompare, setLoadingCompare] = useState(false);
  const [galleryTarget, setGalleryTarget] = useState<'main' | 'left' | 'right'>('main');
  const [showCompareHint, setShowCompareHint] = useState(false);

  const editorRef = useRef<HTMLDivElement | null>(null);
  const analyzeBtnRef = useRef<HTMLDivElement | null>(null);

  const { addToast } = useToast();

  const dismissCompareHint = () => {
    try { localStorage.setItem('compare-hint-seen-v1', 'true'); } catch { /* ignore */ }
    setShowCompareHint(false);
  };

  const analyzeSingle = useCallback(() => {
    if (!code.trim()) return;
    setIsAnalyzing(true);
    setShowResults(true);
    setTimeout(() => {
      const analysisResult = analyzeCode(code, language);
      setResult(analysisResult);
      setIsAnalyzing(false);
    }, 300);
  }, [code, language]);

  const analyzeCompare = useCallback(() => {
    setLoadingCompare(true);
    setLeftAnalyzing(true);
    setRightAnalyzing(true);
    setTimeout(() => {
      setLeftResult(analyzeCode(leftCode, leftLang));
      setLeftAnalyzing(false);
    }, 200);
    setTimeout(() => {
      setRightResult(analyzeCode(rightCode, rightLang));
      setRightAnalyzing(false);
      setLoadingCompare(false);
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

  const onSelectSample = (sample: Sample) => {
    setGalleryOpen(false);
    const lang = sample.language as Language;
    if (galleryTarget === 'left') {
      setLeftLang(lang);
      setLeftCode(sample.code);
    } else if (galleryTarget === 'right') {
      setRightLang(lang);
      setRightCode(sample.code);
    } else {
      setLanguage(lang);
      setCode(sample.code);
      setShowResults(false);
      setResult(null);
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
        setGalleryTarget(mode === 'single' ? 'main' : 'left');
        setGalleryOpen(true);
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
                  Two pre-loaded Fibonacci examples are being analyzed side-by-side. The iterative version <span className="font-semibold text-success-500">O(n)</span> crushes the naive recursion <span className="font-semibold text-danger-500">O(2ⁿ)</span> — watch for the winner card below.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Tooltip content="Press ⌘/Ctrl+K to swap with library samples">
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
                  onChange={(e) => setLanguage(e.target.value as Language)}
                  className="select-native select-sm !py-1.5 sm:!py-2"
                >
                  <option value="javascript">JavaScript</option>
                  <option value="typescript">TypeScript</option>
                  <option value="python">Python</option>
                  <option value="java">Java</option>
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

      {/* Main Panes */}
      {mode === 'single' ? (
        <div id="reasoning-step" className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0">
          {/* Editor Card — glassmorphic container with gradient border */}
          <div className="flex flex-col overflow-hidden modern-card hover-lift">
            <div className="relative z-10 px-4 py-2.5 border-b border-text-muted/10 dark:border-text-muted-dark/10 flex items-center justify-between gap-2 bg-gradient-to-r from-accent-500/8 via-transparent to-highlight-400/8">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-danger-500 shadow-[0_0_6px_rgba(239,68,68,0.55)]"></div>
                  <div className="w-3 h-3 rounded-full bg-warning-500 shadow-[0_0_6px_rgba(245,158,11,0.55)]"></div>
                  <div className="w-3 h-3 rounded-full bg-success-500 shadow-[0_0_6px_rgba(16,185,129,0.55)]"></div>
                </div>
                <span className="ml-2 text-xs font-mono text-text-muted dark:text-text-muted-dark bg-bg-tertiary/60 dark:bg-bg-tertiary-dark/60 border border-text-muted/10 dark:border-text-muted-dark/10 px-2 py-0.5 rounded-md">
                  editor.{FILE_EXT[language]}
                </span>
              </div>
              {galleryTarget === 'main' && (
                <Button variant="ghost" size="xs" onClick={() => { setGalleryTarget('main'); setGalleryOpen(true); }}>
                  Load Sample
                </Button>
              )}
            </div>
            <div id="code-editor-step" className="flex flex-col flex-1 min-h-0 relative z-10" ref={editorRef}>
              <CodeEditor code={code} setCode={setCode} language={language} />
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0">
          {/* LEFT */}
          <div className="flex flex-col gap-3 min-h-0">
            <Card className="border-success-500/30 overflow-hidden hover-lift glow-border">
              <CardContent className="p-0">
                <div className="px-4 py-2.5 border-b border-text-muted/10 dark:border-text-muted-dark/10 flex items-center justify-between gap-2 bg-gradient-to-r from-success-500/8 via-transparent to-transparent">
                  <div className="flex items-center gap-2">
                    <Badge variant="success" size="sm">Snippet A</Badge>
                    <select
                      value={leftLang}
                      onChange={(e) => setLeftLang(e.target.value as Language)}
                      className="bg-bg-secondary dark:bg-bg-secondary-dark text-text-primary dark:text-text-primary-dark border border-text-muted/30 dark:border-text-muted-dark/30 rounded-md px-2 py-1 text-xs focus:outline-none hover:border-accent-500/40 transition-all"
                    >
                      <option value="javascript">JS</option>
                      <option value="typescript">TS</option>
                      <option value="python">PY</option>
                      <option value="java">Java</option>
                      <option value="cpp">C++</option>
                    </select>
                  </div>
                  <Button variant="ghost" size="xs" onClick={() => { setGalleryTarget('left'); setGalleryOpen(true); }}>
                    Load Sample
                  </Button>
                </div>
                <div className="h-64 bg-bg-tertiary/20 dark:bg-bg-tertiary-dark/20 flex flex-col min-h-0">
                  <CodeEditor code={leftCode} setCode={setLeftCode} language={leftLang} />
                </div>
              </CardContent>
            </Card>
            <div className="flex-1 min-h-0 overflow-hidden">
              <ResultPanel
                result={leftResult}
                analyzing={leftAnalyzing}
                title="Analyze snippet A to see results"
                accent="success"
              />
            </div>
          </div>
          {/* RIGHT */}
          <div className="flex flex-col gap-3 min-h-0">
            <Card className="border-accent-500/30 overflow-hidden hover-lift glow-border">
              <CardContent className="p-0">
                <div className="px-4 py-2.5 border-b border-text-muted/10 dark:border-text-muted-dark/10 flex items-center justify-between gap-2 bg-gradient-to-r from-accent-500/8 via-transparent to-transparent">
                  <div className="flex items-center gap-2">
                    <Badge variant="primary" size="sm">Snippet B</Badge>
                    <select
                      value={rightLang}
                      onChange={(e) => setRightLang(e.target.value as Language)}
                      className="bg-bg-secondary dark:bg-bg-secondary-dark text-text-primary dark:text-text-primary-dark border border-text-muted/30 dark:border-text-muted-dark/30 rounded-md px-2 py-1 text-xs focus:outline-none hover:border-accent-500/40 transition-all"
                    >
                      <option value="javascript">JS</option>
                      <option value="typescript">TS</option>
                      <option value="python">PY</option>
                      <option value="java">Java</option>
                      <option value="cpp">C++</option>
                    </select>
                  </div>
                  <Button variant="ghost" size="xs" onClick={() => { setGalleryTarget('right'); setGalleryOpen(true); }}>
                    Load Sample
                  </Button>
                </div>
                <div className="h-64 bg-bg-tertiary/20 dark:bg-bg-tertiary-dark/20 flex flex-col min-h-0">
                  <CodeEditor code={rightCode} setCode={setRightCode} language={rightLang} />
                </div>
              </CardContent>
            </Card>
            <div className="flex-1 min-h-0 overflow-hidden">
              <ResultPanel
                result={rightResult}
                analyzing={rightAnalyzing}
                title="Analyze snippet B to see results"
                accent="primary"
              />
            </div>
            {renderVerdict && (leftResult && rightResult) && (
              <div className="animate-bounce-in">
                <Card className={`border-2 ${
                  renderVerdict.winner === 'left'
                    ? 'border-success-500/50 bg-success-500/5'
                    : renderVerdict.winner === 'right'
                    ? 'border-accent-500/50 bg-accent-500/5'
                    : 'border-highlight-400/50 bg-highlight-400/5'
                }`}>
                  <CardContent className="py-5 text-center">
                    <div className="text-5xl mb-3 animate-wiggle">
                      {renderVerdict.winner === 'tie' ? '🤝' : '🏆'}
                    </div>
                    <p className="text-xl font-black text-text-primary dark:text-text-primary-dark mb-2">
                      {renderVerdict.winner === 'tie' ? "It's a Tie!" : renderVerdict.winner === 'left' ? 'Snippet A Wins!' : 'Snippet B Wins!'}
                    </p>
                    <p className="text-sm text-text-secondary dark:text-text-secondary-dark max-w-md mx-auto leading-relaxed">
                      {renderVerdict.message}
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      )}

      <SampleGallery
        open={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        onSelect={onSelectSample}
      />
      <ShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
      <OnboardingTour />
    </div>
  );
}
