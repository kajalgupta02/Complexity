import { useState, useEffect, useRef, useCallback } from 'react';
import { EditorView, basicSetup } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { java } from '@codemirror/lang-java';
import { cpp } from '@codemirror/lang-cpp';
import { lineNumbers } from '@codemirror/view';
import { oneDark } from '@codemirror/theme-one-dark';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { analyzeCode, type AnalysisResult } from '@/lib/analyzer';
import { useToast } from '@/components/ui/Toast';
import SampleGallery from '@/components/SampleGallery';
import type { Sample } from '@/data/samples';
import OnboardingTour from '@/components/OnboardingTour';
import ShortcutsModal from '@/components/ShortcutsModal';

const LANG_EXTENSIONS = {
  javascript: javascript(),
  typescript: javascript({ typescript: true }),
  java: java(),
  cpp: cpp()
};

type Language = 'javascript' | 'typescript' | 'java' | 'cpp';

const getComplexityRank = (c: string): number => {
  const order = ['O(1)', 'O(log n)', 'O(√n)', 'O(n)', 'O(n log n)', 'O(n²)', 'O(n² log n)', 'O(n³)', 'O(n³ log n)', 'O(2ⁿ)'];
  const idx = order.indexOf(c);
  return idx === -1 ? 99 : idx;
};

const getComplexityColor = (complexity: string) => {
  if (complexity.includes('O(1)') || complexity.includes('O(log')) return 'success';
  if (complexity.includes('O(n)') || complexity.includes('O(n log')) return 'warning';
  if (complexity.includes('O(n²)') || complexity.includes('O(n³)') || complexity.includes('O(2ⁿ')) return 'danger';
  return 'default';
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

function CodeEditor({ code, setCode, language, onEditorReady }: CodeEditorProps) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);
  const codeRef = useRef(code);
  codeRef.current = code;
  const langRef = useRef(language);
  langRef.current = language;

  useEffect(() => {
    if (editorRef.current && !viewRef.current) {
      const view = new EditorView({
        doc: codeRef.current,
        extensions: [
          basicSetup,
          lineNumbers(),
          getCurrentTheme(),
          LANG_EXTENSIONS[langRef.current],
          EditorView.updateListener.of((update: any) => {
            if (update.docChanged) {
              setCode(update.state.doc.toString());
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
  }, []);

  useEffect(() => {
    if (viewRef.current) {
      const state = EditorState.create({
        doc: viewRef.current.state.doc.toString(),
        extensions: [
          basicSetup,
          lineNumbers(),
          getCurrentTheme(),
          LANG_EXTENSIONS[language],
          EditorView.updateListener.of((update: any) => {
            if (update.docChanged) {
              setCode(update.state.doc.toString());
            }
          }),
          EditorView.theme({
            '&': { height: '100%', fontSize: '14px' },
            '.cm-content': { fontFamily: 'JetBrains Mono, monospace' }
          })
        ]
      });
      viewRef.current.setState(state);
    }
  }, [language]);

  const setContent = useCallback((text: string) => {
    if (viewRef.current) {
      viewRef.current.dispatch({
        changes: {
          from: 0,
          to: viewRef.current.state.doc.length,
          insert: text
        }
      });
    }
  }, []);

  (editorRef as any).current = { ...editorRef.current, setContent } as any;
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

export default function Analyzer() {
  const [mode, setMode] = useState<'single' | 'compare'>('single');

  // Single mode state
  const [code, setCode] = useState<string>('');
  const [language, setLanguage] = useState<Language>('javascript');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [showResults, setShowResults] = useState(false);

  // Compare mode state
  const [leftCode, setLeftCode] = useState<string>(DEFAULT_LEFT);
  const [rightCode, setRightCode] = useState<string>(DEFAULT_RIGHT);
  const [leftLang, setLeftLang] = useState<Language>('javascript');
  const [rightLang, setRightLang] = useState<Language>('javascript');
  const [leftResult, setLeftResult] = useState<AnalysisResult | null>(null);
  const [rightResult, setRightResult] = useState<AnalysisResult | null>(null);
  const [leftReady, setLeftReady] = useState(false);
  const [rightReady, setRightReady] = useState(false);
  const [leftAnalyzing, setLeftAnalyzing] = useState(false);
  const [rightAnalyzing, setRightAnalyzing] = useState(false);

  // Modals
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [loadingCompare, setLoadingCompare] = useState(false);
  const [galleryTarget, setGalleryTarget] = useState<'main' | 'left' | 'right'>('main');

  const editorRef = useRef<HTMLDivElement | null>(null);
  const analyzeBtnRef = useRef<HTMLDivElement | null>(null);

  const { addToast } = useToast();

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

  const onSelectSample = (sample: Sample) => {
    setGalleryOpen(false);
    if (galleryTarget === 'left') {
      setLeftLang(sample.language);
      setLeftCode(sample.code);
    } else if (galleryTarget === 'right') {
      setRightLang(sample.language);
      setRightCode(sample.code);
    } else {
      setLanguage(sample.language);
      setCode(sample.code);
      setShowResults(false);
      setResult(null);
    }
    addToast('success', `Loaded "${sample.title}" sample`);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key.toLowerCase() === 'enter') {
        e.preventDefault();
        if (mode === 'single') analyzeSingle();
        else analyzeCompare();
      } else if (meta && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setGalleryOpen(true);
      } else if (e.key === '?') {
        e.preventDefault();
        setShortcutsOpen(true);
      } else if (e.key === 'Escape') {
        setGalleryOpen(false);
        setShortcutsOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [mode, analyzeSingle, analyzeCompare]);

  const renderResults = (r: AnalysisResult | null, analyzing: boolean) => {
    if (analyzing) {
      return (
        <Card className="h-full animate-fade-in">
          <CardContent className="py-10">
            <div className="space-y-4">
              <Skeleton className="h-16 w-48" />
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          </CardContent>
        </Card>
      );
    }
    if (!r) return null;
    return (
      <div className="h-full overflow-y-auto space-y-3">
        <div className="bg-gradient-to-br from-accent-500/10 to-highlight-400/10 rounded-xl p-5 border border-accent-500/20 dark:border-accent-500/20 animate-slide-up">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-text-tertiary dark:text-text-tertiary-dark mb-1">Time Complexity</p>
              <h2 className="text-4xl font-black text-text-primary dark:text-text-primary-dark">
                {r.timeComplexity}
              </h2>
            </div>
            <Badge size="md" variant={getComplexityColor(r.timeComplexity) as any}>
              {Math.round(r.timeConfidence)}%
            </Badge>
          </div>
        </div>
        <Card>
          <CardContent className="py-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-text-secondary dark:text-text-secondary-dark">Confidence</span>
              <span className="text-sm font-bold text-accent-500">{Math.round(r.timeConfidence)}%</span>
            </div>
            <div className="w-full h-2.5 bg-bg-tertiary dark:bg-bg-tertiary-dark rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-accent-500 to-highlight-400 transition-all duration-500"
                style={{ width: `${r.timeConfidence}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>
        <div>
          <h3 className="text-sm font-bold text-text-primary dark:text-text-primary-dark mb-2">Reasoning</h3>
          <div className="space-y-2">
            {r.reasoningChain.slice(0, 3).map((step, idx) => (
              <Card key={idx} className="hover:shadow-medium transition-all">
                <CardContent className="py-2.5 px-3">
                  <div className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-accent-500/10 flex items-center justify-center text-accent-500 font-bold text-xs flex-shrink-0 mt-0.5">
                      {idx + 1}
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-text-primary dark:text-text-primary-dark mb-0.5">
                        {step.title}
                      </h4>
                      <p className="text-xs text-text-secondary dark:text-text-secondary-dark opacity-80">{step.rule}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderVerdict = () => {
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
      winner = 'tie';
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
    return (
      <Card className={`border-2 animate-slide-up ${
        winner === 'left'
          ? 'border-success-500/50 bg-success-500/5'
          : winner === 'right'
          ? 'border-success-500/50 bg-success-500/5'
          : 'border-highlight-400/50 bg-highlight-400/5'
      }`}>
        <CardContent className="py-5 text-center">
          <div className="text-4xl mb-2">
            {winner === 'tie' ? '🤝' : '🏆'}
          </div>
          <p className="text-xl font-bold text-text-primary dark:text-text-primary-dark mb-1">
            {winner === 'tie' ? 'It\'s a Tie!' : winner === 'left' ? 'Left Side Wins!' : 'Right Side Wins!'}
          </p>
          <p className="text-sm text-text-secondary dark:text-text-secondary-dark">
            {message}
          </p>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] max-w-7xl mx-auto px-4 py-4 gap-4">
      {/* Top Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <Tabs
            defaultValue={mode}
            onValueChange={(v) => setMode(v as any)}
            className="flex items-center"
          >
            <TabsList>
              <TabsTrigger value="single">Analyze</TabsTrigger>
              <TabsTrigger value="compare">Compare</TabsTrigger>
            </TabsList>
          </Tabs>
          {mode === 'single' && (
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as any)}
              className="bg-bg-secondary dark:bg-bg-secondary-dark text-text-primary dark:text-text-primary-dark border border-text-muted/30 dark:border-text-muted-dark/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
            >
              <option value="javascript">JavaScript</option>
              <option value="typescript">TypeScript</option>
              <option value="java">Java</option>
              <option value="cpp">C++</option>
            </select>
          )}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setGalleryTarget(mode === 'single' ? 'main' : 'left');
              setGalleryOpen(true);
            }}
            id="library-step"
          >
            📚 Library
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShortcutsOpen(true)}
            title="Keyboard Shortcuts"
          >
            ⌨️ Shortcuts
          </Button>
        </div>
        <div id="analyze-button-step" ref={analyzeBtnRef}>
          <Button
            size="lg"
            onClick={mode === 'single' ? analyzeSingle : analyzeCompare}
            disabled={
              mode === 'single'
                ? (isAnalyzing || !code.trim())
                : (loadingCompare || !leftCode.trim() || !rightCode.trim())
            }
          >
            {mode === 'single'
              ? (isAnalyzing ? 'Analyzing...' : 'Analyze This')
              : (loadingCompare ? 'Comparing...' : 'Compare Both')}
          </Button>
        </div>
      </div>

      {/* Main Panes */}
      {mode === 'single' ? (
        <div id="reasoning-step" className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0">
          <div className="flex flex-col bg-bg-secondary dark:bg-bg-secondary-dark rounded-xl border border-text-muted/20 dark:border-text-muted-dark/20 overflow-hidden shadow-medium">
            <div className="px-4 py-2 border-b border-text-muted/10 dark:border-text-muted-dark/10 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-danger-500"></div>
                <div className="w-3 h-3 rounded-full bg-warning-500"></div>
                <div className="w-3 h-3 rounded-full bg-success-500"></div>
                <span className="ml-2 text-sm text-text-muted dark:text-text-muted-dark">
                  editor.{language === 'javascript' ? 'js' : language === 'typescript' ? 'ts' : language === 'java' ? 'java' : 'cpp'}
                </span>
              </div>
              {galleryTarget === 'main' && (
                <Button variant="ghost" size="xs" onClick={() => { setGalleryTarget('main'); setGalleryOpen(true); }}>
                  Load Sample
                </Button>
              )}
            </div>
            <div id="code-editor-step" className="flex flex-col flex-1 min-h-0" ref={editorRef}>
              <CodeEditor code={code} setCode={setCode} language={language} />
            </div>
          </div>
          <div className="flex flex-col min-h-0">
            {!showResults ? (
              <Card className="h-full flex flex-col items-center justify-center text-center animate-fade-in">
                <CardContent className="py-12">
                  <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-accent-500 to-highlight-400 flex items-center justify-center mb-6">
                    <span className="text-5xl text-white font-bold">Ω</span>
                  </div>
                  <h3 className="text-2xl font-bold text-text-primary dark:text-text-primary-dark mb-3">
                    Paste code or try a sample
                  </h3>
                  <p className="text-text-tertiary dark:text-text-tertiary-dark max-w-md mb-6">
                    Let's see how efficient your code is. We'll break down loops, recursion, and complexity in seconds.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <Button variant="secondary" onClick={() => { setLanguage('javascript'); setCode(DEFAULT_LEFT); }}>
                      Try Fibonacci
                    </Button>
                    <Button onClick={() => { setGalleryTarget('main'); setGalleryOpen(true); }}>
                      Browse Samples
                    </Button>
                  </div>
                  <p className="mt-6 text-xs text-text-muted dark:text-text-muted-dark">
                    Tip: Press <kbd className="px-1.5 py-0.5 rounded bg-bg-tertiary dark:bg-bg-tertiary-dark border border-text-muted/20 mx-1">⌘K</kbd> for the sample library
                  </p>
                </CardContent>
              </Card>
            ) : (
              renderResults(result, isAnalyzing)
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0">
          <div className="flex flex-col gap-3 min-h-0">
            <Card className="border-success-500/30 overflow-hidden">
              <CardContent className="p-0">
                <div className="px-4 py-2 border-b border-text-muted/10 dark:border-text-muted-dark/10 flex items-center justify-between gap-2 bg-success-500/5">
                  <div className="flex items-center gap-2">
                    <Badge variant="success" size="sm">Snippet A</Badge>
                    <select
                      value={leftLang}
                      onChange={(e) => setLeftLang(e.target.value as any)}
                      className="bg-bg-secondary dark:bg-bg-secondary-dark text-text-primary dark:text-text-primary-dark border border-text-muted/30 dark:border-text-muted-dark/30 rounded-md px-2 py-1 text-xs focus:outline-none"
                    >
                      <option value="javascript">JS</option>
                      <option value="typescript">TS</option>
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
              {leftResult || leftAnalyzing ? renderResults(leftResult, leftAnalyzing) : (
                <Card className="h-full">
                  <CardContent className="h-full flex items-center justify-center text-center">
                    <p className="text-sm text-text-muted dark:text-text-muted-dark">
                      Run "Compare Both" to analyze this snippet
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-3 min-h-0">
            <Card className="border-accent-500/30 overflow-hidden">
              <CardContent className="p-0">
                <div className="px-4 py-2 border-b border-text-muted/10 dark:border-text-muted-dark/10 flex items-center justify-between gap-2 bg-accent-500/5">
                  <div className="flex items-center gap-2">
                    <Badge variant="primary" size="sm">Snippet B</Badge>
                    <select
                      value={rightLang}
                      onChange={(e) => setRightLang(e.target.value as any)}
                      className="bg-bg-secondary dark:bg-bg-secondary-dark text-text-primary dark:text-text-primary-dark border border-text-muted/30 dark:border-text-muted-dark/30 rounded-md px-2 py-1 text-xs focus:outline-none"
                    >
                      <option value="javascript">JS</option>
                      <option value="typescript">TS</option>
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
              {rightResult || rightAnalyzing ? renderResults(rightResult, rightAnalyzing) : (
                <Card className="h-full">
                  <CardContent className="h-full flex items-center justify-center text-center">
                    <p className="text-sm text-text-muted dark:text-text-muted-dark">
                      Run "Compare Both" to analyze this snippet
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
            {(leftResult && rightResult) && (
              <div className="animate-fade-in">
                {renderVerdict()}
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
