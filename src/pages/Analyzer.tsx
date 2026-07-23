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
import { analyzeCode, type AnalysisResult } from '@/lib/analyzer';

// Sample code snippets for empty state
const SAMPLES: Record<string, string> = {
  javascript: `function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}`,
  python: `def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)`,
  java: `public class Fibonacci {
    public static int fibonacci(int n) {
        if (n <= 1) return n;
        return fibonacci(n - 1) + fibonacci(n - 2);
    }
}`,
  cpp: `int fibonacci(int n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}`
};

const LANG_EXTENSIONS = {
  javascript: javascript(),
  typescript: javascript({ typescript: true }),
  java: java(),
  cpp: cpp()
};

export default function Analyzer() {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);
  const [code, setCode] = useState<string>('');
  const [language, setLanguage] = useState<'javascript' | 'typescript' | 'java' | 'cpp'>('javascript');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [showResults, setShowResults] = useState(false);

  // Get theme based on current mode
  const getCurrentTheme = () => {
    const isDark = document.documentElement.classList.contains('dark');
    if (isDark) {
      return oneDark;
    }
    // For light mode, just use basic styling
    return EditorView.theme({
      '&': { height: '100%', fontSize: '14px' },
      '.cm-content': { fontFamily: 'JetBrains Mono, monospace' }
    });
  };

  // Initialize CodeMirror
  useEffect(() => {
    if (editorRef.current && !viewRef.current) {
      viewRef.current = new EditorView({
        doc: code,
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
        ],
        parent: editorRef.current
      });
    }
    return () => {
      viewRef.current?.destroy();
      viewRef.current = null;
    };
  }, []);

  // Update editor when language/theme change
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

  // Run analysis
  const handleAnalyze = useCallback(() => {
    if (!code.trim()) return;
    setIsAnalyzing(true);
    // Add perceived-effort delay (300ms)
    setTimeout(() => {
      const analysisResult = analyzeCode(code, language);
      setResult(analysisResult);
      setShowResults(true);
      setIsAnalyzing(false);
    }, 300);
  }, [code, language]);

  // Load sample code
  const loadSample = useCallback((lang: string) => {
    setLanguage(lang as any);
    setCode(SAMPLES[lang]);
    if (viewRef.current) {
      viewRef.current.dispatch({
        changes: {
          from: 0,
          to: viewRef.current.state.doc.length,
          insert: SAMPLES[lang]
        }
      });
    }
  }, []);

  // Determine complexity badge color
  const getComplexityColor = (complexity: string) => {
    if (complexity.includes('O(1)') || complexity.includes('O(log')) return 'success';
    if (complexity.includes('O(n)') || complexity.includes('O(n log')) return 'warning';
    if (complexity.includes('O(n²)') || complexity.includes('O(n³)') || complexity.includes('O(2ⁿ')) return 'danger';
    return 'default';
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] max-w-7xl mx-auto px-4 py-4">
      {/* Top controls */}
      <div className="flex items-center justify-between mb-4 gap-4">
        <div className="flex items-center gap-3">
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
          <div className="flex items-center gap-2">
            <span className="text-sm text-text-tertiary dark:text-text-tertiary-dark">Try a sample:</span>
            <Button variant="ghost" size="sm" onClick={() => loadSample('javascript')}>JS</Button>
            <Button variant="ghost" size="sm" onClick={() => loadSample('python')}>Py</Button>
            <Button variant="ghost" size="sm" onClick={() => loadSample('java')}>Java</Button>
            <Button variant="ghost" size="sm" onClick={() => loadSample('cpp')}>C++</Button>
          </div>
        </div>
        <Button size="lg" onClick={handleAnalyze} disabled={isAnalyzing || !code.trim()}>
          {isAnalyzing ? 'Analyzing...' : 'Analyze This'}
        </Button>
      </div>

      {/* Split layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0">
        {/* Left: Code editor */}
        <div className="flex flex-col bg-bg-secondary dark:bg-bg-secondary-dark rounded-xl border border-text-muted/20 dark:border-text-muted-dark/20 overflow-hidden shadow-medium">
          <div className="px-4 py-2 border-b border-text-muted/10 dark:border-text-muted-dark/10 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-danger-500"></div>
            <div className="w-3 h-3 rounded-full bg-warning-500"></div>
            <div className="w-3 h-3 rounded-full bg-success-500"></div>
            <span className="ml-2 text-sm text-text-muted dark:text-text-muted-dark">
              editor.{language === 'javascript' ? 'js' : language === 'typescript' ? 'ts' : language === 'java' ? 'java' : 'cpp'}
            </span>
          </div>
          <div ref={editorRef} className="flex-1 overflow-hidden"></div>
        </div>

        {/* Right: Results */}
        <div className="flex flex-col min-h-0">
          {!showResults ? (
            /* Empty state */
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
                  <Button variant="secondary" onClick={() => loadSample('javascript')}>
                    Try Fibonacci
                  </Button>
                  <Button onClick={() => editorRef.current?.focus()}>
                    Paste Some Code
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : isAnalyzing ? (
            /* Loading state */
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
          ) : result ? (
            /* Results state */
            <div className="h-full overflow-y-auto">
              {/* Complexity badge */}
              <div className="bg-gradient-to-br from-accent-500/10 to-highlight-400/10 rounded-xl p-6 mb-4 border border-accent-500/20 dark:border-accent-500/20 animate-slide-up">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-text-tertiary dark:text-text-tertiary-dark mb-1">Time Complexity</p>
                    <h2 className="text-5xl font-black text-text-primary dark:text-text-primary-dark">
                      {result.timeComplexity}
                    </h2>
                    {result.timeComplexity.includes('O(2ⁿ)') && (
                      <p className="text-sm text-danger-500 mt-2">
                        Hope you weren't planning on running this at scale.
                      </p>
                    )}
                  </div>
                  <Badge size="lg" variant={getComplexityColor(result.timeComplexity) as any}>
                    {Math.round(result.timeConfidence)}% Confident
                  </Badge>
                </div>
              </div>

              {/* Confidence meter */}
              <Card className="mb-4">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-text-secondary dark:text-text-secondary-dark">
                      Confidence Score
                    </span>
                    <span className="text-lg font-bold text-accent-500">{Math.round(result.timeConfidence)}%</span>
                  </div>
                  <div className="w-full h-3 bg-bg-tertiary dark:bg-bg-tertiary-dark rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-accent-500 to-highlight-400 transition-all duration-500"
                      style={{ width: `${result.timeConfidence}%` }}
                    ></div>
                  </div>
                </CardContent>
              </Card>

              {/* Reasoning chain */}
              <div className="mb-4">
                <h3 className="text-lg font-bold text-text-primary dark:text-text-primary-dark mb-3">Reasoning</h3>
                <div className="space-y-3">
                  {result.reasoningChain.map((step, idx) => (
                    <Card key={idx} className="transition-all duration-200 hover:shadow-medium">
                      <CardContent className="py-4">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-accent-500/10 flex items-center justify-center text-accent-500 font-bold text-sm flex-shrink-0">
                            {idx + 1}
                          </div>
                          <div>
                            <h4 className="font-semibold text-text-primary dark:text-text-primary-dark mb-1">
                              {step.title}
                            </h4>
                            <p className="text-sm text-text-secondary dark:text-text-secondary-dark">{step.rule}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Loops */}
              {result.loops.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-text-primary dark:text-text-primary-dark mb-3">Loops Detected</h3>
                  <div className="space-y-3">
                    {result.loops.map((loop, idx) => (
                      <Card key={idx} className="animate-slide-up" style={{ animationDelay: `${idx * 50}ms` }}>
                        <CardContent className="py-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="inline-flex items-center gap-2">
                                <Badge variant="primary" size="sm">{loop.type}</Badge>
                                <span className="text-sm text-text-secondary dark:text-text-secondary-dark">
                                  Nesting Depth: {loop.nestingDepth + 1}
                                </span>
                              </span>
                            </div>
                            <span className="text-xs text-text-muted dark:text-text-muted-dark">
                              Lines {loop.startLine}–{loop.endLine}
                            </span>
                          </div>
                          <div className="mt-2 bg-bg-tertiary dark:bg-bg-tertiary-dark rounded-lg p-3 font-mono text-xs text-text-secondary dark:text-text-secondary-dark overflow-x-auto">
                            {loop.headerText}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
