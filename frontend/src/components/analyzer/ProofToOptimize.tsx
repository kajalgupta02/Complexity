import React, { useState, useRef } from 'react';
import {
  requestOptimization,
  type OptimizationResult,
  type VerificationStatus,
  OptimizationServiceError,
} from '@/services/api';
import type { SupportedLanguage, AnalysisResult } from '@/lib/analyzer/types';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';

interface ProofToOptimizeProps {
  code: string;
  language: SupportedLanguage;
  analysis: AnalysisResult;
  onApplyOptimization: (newCode: string) => void;
}

export const ProofToOptimize: React.FC<ProofToOptimizeProps> = ({
  code,
  language,
  analysis,
  onApplyOptimization,
}) => {
  const { addToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [comparisonView, setComparisonView] = useState<'side-by-side' | 'proposed' | 'original'>('side-by-side');
  const [copied, setCopied] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleRequestOptimization = async () => {
    setIsLoading(true);
    setError(null);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const optimizationResponse = await requestOptimization(
        {
          code,
          language,
          analysis: {
            timeComplexity: analysis.timeComplexity,
            spaceComplexity:
              typeof analysis.spaceComplexity === 'string'
                ? analysis.spaceComplexity
                : analysis.spaceComplexity?.class || 'O(1)',
            loops: analysis.loops?.map((l) => ({
              type: String(l.type),
              startLine: l.startLine,
              endLine: l.endLine,
              nestingDepth: l.nestingDepth,
            })),
            patterns: analysis.detectedPatterns,
          },
        },
        { signal: controller.signal, timeoutMs: 15000 }
      );

      setResult(optimizationResponse);
      addToast('success', 'Optimization proposal generated.');
    } catch (err) {
      if (err instanceof Error && err.message.includes('cancelled')) {
        addToast('warning', 'Optimization request was cancelled.');
        return;
      }
      const message =
        err instanceof OptimizationServiceError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Optimization service request failed.';
      setError(message);
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const handleCopyCode = async () => {
    if (!result?.optimizedCode) return;
    try {
      await navigator.clipboard.writeText(result.optimizedCode);
      setCopied(true);
      addToast('success', 'Proposed code copied to clipboard.');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      addToast('warning', 'Failed to copy code to clipboard.');
    }
  };

  const handleApply = () => {
    if (!result?.optimizedCode) return;
    onApplyOptimization(result.optimizedCode);
    addToast('success', 'Applied optimized code to the editor.');
  };

  const renderVerificationBadge = (status: VerificationStatus) => {
    switch (status) {
      case 'verified':
        return (
          <Badge variant="success" size="sm" className="font-semibold gap-1">
            <span>✓</span> Verified by tests
          </Badge>
        );
      case 'partially-verified':
        return (
          <Badge variant="warning" size="sm" className="font-semibold gap-1">
            <span>⚠️</span> Partially verified
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="danger" size="sm" className="font-semibold gap-1">
            <span>✕</span> Verification failed
          </Badge>
        );
      case 'unverified':
      default:
        return (
          <Badge variant="outline" size="sm" className="font-semibold gap-1 text-slate-600 dark:text-slate-300">
            <span>ℹ️</span> Unverified (Static proposal)
          </Badge>
        );
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111726] p-5 sm:p-6 space-y-5 shadow-sm text-left">
      {/* 1. Header & Workflow Steps */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-sm font-bold">
              ⚡
            </span>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Proof-to-Optimize Engine
            </h2>
            <Badge variant="primary" size="xs">
              AI-Assisted
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Targeted code refactoring to reduce asymptotic operation count and memory bottlenecks.
          </p>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2">
          {isLoading ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              className="text-xs font-semibold text-rose-600 dark:text-rose-400 border-rose-300 dark:border-rose-900/60"
            >
              Cancel Request
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={handleRequestOptimization}
              disabled={isLoading}
              className="text-xs font-semibold shadow-sm"
              aria-label="Suggest optimization"
            >
              ✨ {result ? 'Re-generate Optimization' : 'Suggest Optimization'}
            </Button>
          )}
        </div>
      </div>

      {/* 2. Signature Workflow Indicator: DETECT -> EXPLAIN -> OPTIMIZE -> VERIFY -> COMPARE */}
      <nav aria-label="Analysis and optimization progress" className="flex items-center gap-1.5 sm:gap-2 text-[11px] font-mono overflow-x-auto py-1">
        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
          ✓ DETECT
        </span>
        <span className="text-slate-400">→</span>
        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
          ✓ EXPLAIN
        </span>
        <span className="text-slate-400">→</span>
        <span
          className={`px-2 py-0.5 rounded font-semibold flex items-center gap-1 ${
            result
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              : isLoading
                ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 animate-pulse'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
          }`}
        >
          {result ? '✓' : '3.'} OPTIMIZE
        </span>
        <span className="text-slate-400">→</span>
        <span
          className={`px-2 py-0.5 rounded font-semibold ${
            result
              ? result.verificationStatus === 'verified'
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : result.verificationStatus === 'failed'
                  ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
          }`}
        >
          4. VERIFY
        </span>
        <span className="text-slate-400">→</span>
        <span
          className={`px-2 py-0.5 rounded font-semibold ${
            result
              ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
          }`}
        >
          5. COMPARE
        </span>
      </nav>

      {/* 3. Loading State */}
      {isLoading && (
        <div role="status" aria-live="polite" className="p-6 rounded-xl border border-indigo-100 dark:border-indigo-900/40 bg-indigo-50/40 dark:bg-indigo-950/20 text-center space-y-3">
          <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-900 dark:text-white">
              Evaluating algorithmic bottlenecks and deriving optimal refactoring...
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Analyzing AST loop bounds, recursion relations, and hash table substitution patterns.
            </p>
          </div>
        </div>
      )}

      {/* 4. Error / Backend Unavailable State */}
      {error && !isLoading && (
        <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/70 dark:bg-amber-950/25 space-y-2.5">
          <div className="flex items-start gap-2.5">
            <span className="text-base text-amber-600 dark:text-amber-400 mt-0.5">⚠️</span>
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-amber-900 dark:text-amber-200">
                Optimization Service Notice
              </h3>
              <p className="text-xs text-amber-800/90 dark:text-amber-300/90 leading-relaxed">
                {error}
              </p>
            </div>
          </div>
          <div className="pl-6 pt-1 text-[11px] text-amber-700 dark:text-amber-400/80 border-t border-amber-200/60 dark:border-amber-900/40">
            <span>Note: </span>
            <span>Your static analysis and Big-O estimates remain fully functional. Once an optimization service is connected to <code className="font-mono font-bold">/api/optimize</code>, proposed code, trade-offs, and verification will be rendered here.</span>
          </div>
        </div>
      )}

      {/* 5. Results Section when optimization is available */}
      {result && !isLoading && (
        <div className="space-y-4 pt-1">
          {/* Complexity Transition Banner */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0c101c] border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Complexity Transformation
              </span>
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Time: </span>
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300 line-through mr-1.5">
                    {analysis.timeComplexity}
                  </span>
                  <span className="text-indigo-500 font-bold">→</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 ml-1.5">
                    {result.proposedTimeComplexity}
                  </span>
                </div>
                <span className="text-slate-300 dark:text-slate-700">|</span>
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Space: </span>
                  <span className="font-mono text-slate-700 dark:text-slate-300 mr-1.5">
                    {typeof analysis.spaceComplexity === 'string'
                      ? analysis.spaceComplexity
                      : analysis.spaceComplexity?.class || 'O(1)'}
                  </span>
                  <span className="text-indigo-500 font-bold">→</span>
                  <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 ml-1.5">
                    {result.proposedSpaceComplexity}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {renderVerificationBadge(result.verificationStatus)}
            </div>
          </div>

          {/* Inefficiency & Explanation */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Why the original code was inefficient
            </h3>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50/80 dark:bg-[#0c101c]/80 p-3 rounded-xl border border-slate-200/70 dark:border-slate-800/70">
              {result.originalInefficiency}
            </p>
          </div>

          {/* Trade-offs & Assumptions */}
          {(result.tradeoffs.length > 0 || result.assumptions.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {result.tradeoffs.length > 0 && (
                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#0c101c]/50 space-y-1.5">
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <span>⚖️</span> Trade-offs & Memory Impact
                  </h4>
                  <ul className="space-y-1 text-slate-600 dark:text-slate-400">
                    {result.tradeoffs.map((t, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-indigo-500 font-bold">•</span>
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.assumptions.length > 0 && (
                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#0c101c]/50 space-y-1.5">
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <span>🔍</span> Assumptions & Constraints
                  </h4>
                  <ul className="space-y-1 text-slate-600 dark:text-slate-400">
                    {result.assumptions.map((a, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-indigo-500 font-bold">•</span>
                        <span>{a}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Code Comparison Section (COMPARE) */}
          <div className="space-y-2 pt-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <span>🔄</span> Code Comparison
              </h3>

              {/* View Selector & Actions */}
              <div className="flex items-center gap-2">
                <div className="flex rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5 text-[11px] font-semibold">
                  <button
                    type="button"
                    onClick={() => setComparisonView('side-by-side')}
                    className={`px-2.5 py-1 rounded-md transition-colors ${
                      comparisonView === 'side-by-side'
                        ? 'bg-white dark:bg-[#161f36] text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                    }`}
                  >
                    Side-by-Side
                  </button>
                  <button
                    type="button"
                    onClick={() => setComparisonView('proposed')}
                    className={`px-2.5 py-1 rounded-md transition-colors ${
                      comparisonView === 'proposed'
                        ? 'bg-white dark:bg-[#161f36] text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                    }`}
                  >
                    Proposed Only
                  </button>
                  <button
                    type="button"
                    onClick={() => setComparisonView('original')}
                    className={`px-2.5 py-1 rounded-md transition-colors ${
                      comparisonView === 'original'
                        ? 'bg-white dark:bg-[#161f36] text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                    }`}
                  >
                    Original Only
                  </button>
                </div>

                <Button
                  variant="outline"
                  size="xs"
                  onClick={handleCopyCode}
                  className="text-[11px] font-semibold"
                >
                  {copied ? '✓ Copied' : '📋 Copy Code'}
                </Button>
                <Button
                  variant="primary"
                  size="xs"
                  onClick={handleApply}
                  className="text-[11px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  Apply to Editor
                </Button>
              </div>
            </div>

            {/* Code Surface */}
            <div className="rounded-xl border border-slate-800 bg-[#0d121f] overflow-hidden text-xs font-mono">
              {comparisonView === 'side-by-side' ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-800">
                  {/* Original */}
                  <div className="flex flex-col">
                    <div className="px-3 py-1.5 bg-[#090d16] border-b border-slate-800 text-[11px] font-semibold text-slate-400 flex items-center justify-between">
                      <span>Original Code ({language})</span>
                      <span className="text-rose-400">{analysis.timeComplexity}</span>
                    </div>
                    <pre className="p-3 text-slate-300 overflow-x-auto max-h-72 leading-relaxed whitespace-pre font-mono text-[11px]">
                      {code}
                    </pre>
                  </div>

                  {/* Proposed */}
                  <div className="flex flex-col bg-[#0b101c]">
                    <div className="px-3 py-1.5 bg-[#090d16] border-b border-slate-800 text-[11px] font-semibold text-emerald-400 flex items-center justify-between">
                      <span>Proposed Optimization</span>
                      <span className="text-emerald-400 font-bold">{result.proposedTimeComplexity}</span>
                    </div>
                    <pre className="p-3 text-emerald-200/90 overflow-x-auto max-h-72 leading-relaxed whitespace-pre font-mono text-[11px]">
                      {result.optimizedCode}
                    </pre>
                  </div>
                </div>
              ) : comparisonView === 'proposed' ? (
                <div className="flex flex-col">
                  <div className="px-3 py-1.5 bg-[#090d16] border-b border-slate-800 text-[11px] font-semibold text-emerald-400 flex items-center justify-between">
                    <span>Proposed Optimization ({result.proposedTimeComplexity})</span>
                    <Badge variant="success" size="xs">Recommended</Badge>
                  </div>
                  <pre className="p-3 text-emerald-200/90 overflow-x-auto max-h-72 leading-relaxed whitespace-pre font-mono text-[11px]">
                    {result.optimizedCode}
                  </pre>
                </div>
              ) : (
                <div className="flex flex-col">
                  <div className="px-3 py-1.5 bg-[#090d16] border-b border-slate-800 text-[11px] font-semibold text-slate-400 flex items-center justify-between">
                    <span>Original Code ({analysis.timeComplexity})</span>
                  </div>
                  <pre className="p-3 text-slate-300 overflow-x-auto max-h-72 leading-relaxed whitespace-pre font-mono text-[11px]">
                    {code}
                  </pre>
                </div>
              )}
            </div>
          </div>

          {/* 6. Verification & Test Evidence Disclosures */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0c101c] border border-slate-200/80 dark:border-slate-800/80 text-[11px] space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
              <span>🛡️</span>
              <span>Verification Transparency:</span>
            </div>
            {result.verificationStatus === 'verified' && result.verificationDetails ? (
              <p className="text-slate-600 dark:text-slate-400">
                Verified: Passed {result.verificationDetails.testsPassed || 0} of{' '}
                {result.verificationDetails.testsTotal || 0} correctness test cases.{' '}
                {result.verificationDetails.message || ''}
              </p>
            ) : result.verificationStatus === 'partially-verified' ? (
              <p className="text-amber-700 dark:text-amber-400">
                Partially verified: Basic syntax and input heuristics passed, but full corner-case assertions have not completed.
              </p>
            ) : result.verificationStatus === 'failed' ? (
              <p className="text-rose-700 dark:text-rose-400">
                Correctness check failed: Output did not match expected solution logic on sample inputs.
              </p>
            ) : (
              <p className="text-slate-500 dark:text-slate-400">
                This refactor was derived through static algorithm transformations. No dynamic test harness has executed against this code yet. Run tests before deploying to production.
              </p>
            )}

            {result.empiricalBenchmark?.measured ? (
              <p className="text-emerald-600 dark:text-emerald-400 font-mono">
                Real benchmark measured: {result.empiricalBenchmark.originalMs?.toFixed(2)}ms → {result.empiricalBenchmark.optimizedMs?.toFixed(2)}ms (N={result.empiricalBenchmark.inputSize})
              </p>
            ) : (
              <p className="text-slate-400 dark:text-slate-500 font-mono text-[10px]">
                Runtime benchmark: Not measured (run Empirical Benchmark tab below for live hardware measurement).
              </p>
            )}
          </div>
        </div>
      )}

      {/* Initial Empty / Prompting State */}
      {!result && !isLoading && !error && (
        <div className="p-4 rounded-xl bg-slate-50/60 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/60 flex items-center justify-between gap-3 text-xs">
          <p className="text-slate-600 dark:text-slate-400">
            Click <strong className="text-slate-900 dark:text-white">Suggest Optimization</strong> to generate an alternative algorithm with reduced time/space complexity and trade-off explanations.
          </p>
          <Button
            variant="outline"
            size="xs"
            onClick={handleRequestOptimization}
            className="shrink-0 font-semibold text-xs"
          >
            Run Optimizer
          </Button>
        </div>
      )}
    </div>
  );
};
