import React, { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ProofToOptimize } from './ProofToOptimize';
import { EmpiricalBenchmarkCard } from './EmpiricalBenchmarkCard';
import type { AnalysisResult, LoopInfo, SupportedLanguage } from '@/lib/analyzer';
import type { InterviewProblem } from '@/data/interviewProblems';

interface AnalysisResultsProps {
  result: AnalysisResult;
  linkedProblem?: InterviewProblem | null;
  code?: string;
  language?: SupportedLanguage;
  onSaveToDashboard?: () => void;
  onShare?: () => void;
  onExportPDF?: () => void;
  onExportPNG?: () => void;
  onHighlightLoop?: (loop: LoopInfo) => void;
  onApplyOptimization?: (newCode: string) => void;
}

export const AnalysisResults: React.FC<AnalysisResultsProps> = ({
  result,
  linkedProblem,
  code = '',
  language = 'javascript',
  onSaveToDashboard,
  onShare,
  onExportPDF,
  onExportPNG,
  onHighlightLoop,
  onApplyOptimization,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'optimize' | 'benchmark'>('overview');

  const spaceComplexityDisplay =
    typeof result.spaceComplexity === 'string'
      ? result.spaceComplexity
      : result.spaceComplexity?.class || 'O(1)';

  const isIndeterminate =
    result.timeComplexity === 'indeterminate' ||
    result.timeComplexity.toLowerCase().includes('unknown');

  const isOptimal = linkedProblem
    ? result.timeComplexity.trim().toLowerCase() === linkedProblem.expectedTime.trim().toLowerCase()
    : null;

  const loopComplexityBadge = (loop: LoopInfo) => {
    if (loop.hasSortCall) return 'O(n log n)';
    if (loop.nestingDepth === 0) return 'O(n)';
    if (loop.nestingDepth === 1) return 'O(n²)';
    if (loop.nestingDepth >= 2) return `O(n^${loop.nestingDepth + 1})`;
    return 'O(n)';
  };

  return (
    <div className="space-y-4 text-left">
      {/* 1. Primary Verdict Bar — High Information Density */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        {/* Linked Problem Optimal Status */}
        {linkedProblem && (
          <div
            className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
              isOptimal
                ? 'bg-emerald-50/80 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40 text-emerald-900 dark:text-emerald-200'
                : 'bg-amber-50/80 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/40 text-amber-900 dark:text-amber-200'
            }`}
          >
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span>{isOptimal ? '🎯' : '⚠️'}</span>
                <span className="font-bold">
                  {linkedProblem.title} ({linkedProblem.list})
                </span>
                <Badge variant={isOptimal ? 'success' : 'warning'} size="xs">
                  {isOptimal ? 'Optimal' : 'Suboptimal'}
                </Badge>
              </div>
              <p className="text-[11px] opacity-90">
                Target: <span className="font-mono font-bold">{linkedProblem.expectedTime}</span> time ·{' '}
                <span className="font-mono font-bold">{linkedProblem.expectedSpace}</span> space.
              </p>
            </div>
            <span className="font-mono font-bold px-2.5 py-1 rounded-lg bg-white/80 dark:bg-black/40 border border-current self-start sm:self-auto">
              Current: {result.timeComplexity}
            </span>
          </div>
        )}

        {/* Complexity Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Time Complexity */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#0c101c] space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Time Complexity
              </span>
              <span className="text-[10px] font-semibold text-slate-400">Worst-Case</span>
            </div>
            <div className="font-mono font-bold text-2xl text-slate-900 dark:text-white">
              {isIndeterminate ? (
                <span className="text-amber-600 dark:text-amber-400 text-lg">Uncertain / Dynamic</span>
              ) : (
                result.timeComplexity
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
              {isIndeterminate
                ? 'Could not be statically bounded with high certainty.'
                : result.detailed?.highLevelSummary || 'Growth of basic operations relative to input size.'}
            </p>
          </div>

          {/* Auxiliary Space Complexity */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#0c101c] space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Auxiliary Space
              </span>
              <span className="text-[10px] font-semibold text-slate-400">Memory</span>
            </div>
            <div className="font-mono font-bold text-2xl text-slate-900 dark:text-white">
              {spaceComplexityDisplay}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
              Auxiliary stack/heap memory allocated beyond input storage.
            </p>
          </div>

          {/* Engine Confidence & Reliability */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#0c101c] space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Engine Confidence
              </span>
              <span className="text-[10px] font-semibold text-slate-400">AST Heuristic</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-mono font-bold text-2xl text-slate-900 dark:text-white">
                {result.timeConfidence}%
              </span>
              <Badge
                variant={
                  result.timeConfidence >= 80 ? 'success' : result.timeConfidence >= 60 ? 'warning' : 'danger'
                }
                size="xs"
              >
                {result.timeConfidence >= 80 ? 'High' : result.timeConfidence >= 60 ? 'Moderate' : 'Low'}
              </Badge>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {result.isPartialAnalysis
                ? 'Reduced: Code appears partial or uses dynamic runtime branching.'
                : 'Derived from lexical structures, loop depths, and call graphs.'}
            </p>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex flex-wrap items-center gap-2">
            {onSaveToDashboard && (
              <Button variant="outline" size="xs" onClick={onSaveToDashboard} className="font-semibold text-xs">
                💾 Save Snippet
              </Button>
            )}
            {onShare && (
              <Button variant="outline" size="xs" onClick={onShare} className="font-semibold text-xs">
                🔗 Share Link
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {onExportPDF && (
              <Button variant="ghost" size="xs" onClick={onExportPDF} className="font-semibold text-xs">
                📄 Export PDF
              </Button>
            )}
            {onExportPNG && (
              <Button variant="ghost" size="xs" onClick={onExportPNG} className="font-semibold text-xs">
                🖼️ Image
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Section Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'overview'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <span>📊 Findings & Derivation</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('optimize')}
          className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'optimize'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30'
          }`}
        >
          <span>✨ Proof-to-Optimize</span>
          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('benchmark')}
          className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'benchmark'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <span>⚡ Empirical Benchmark</span>
        </button>
      </div>

      {/* 3. TAB 1: Findings & Derivation */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* Detected Loop Bottlenecks Table */}
          {result.loops && result.loops.length > 0 && (
            <div className="p-5 rounded-2xl bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Identified Iteration Bottlenecks ({result.loops.length})
                </h3>
                <span className="text-[11px] text-slate-400">Click row to highlight loop</span>
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                {result.loops.map((loop, idx) => (
                  <div
                    key={idx}
                    onClick={() => onHighlightLoop && onHighlightLoop(loop)}
                    className="flex items-center justify-between gap-3 px-4 py-2.5 bg-slate-50/50 dark:bg-[#0c101c]/50 hover:bg-indigo-50/60 dark:hover:bg-indigo-950/30 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-mono font-bold text-[10px]">
                        {String(loop.type || 'loop').toUpperCase()}
                      </span>
                      <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                        Lines {loop.startLine}–{loop.endLine}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        (Depth: {loop.nestingDepth + 1}{loop.hasEarlyBreak ? ' · Early Break' : ''})
                      </span>
                    </div>
                    <span className="font-mono font-bold px-2 py-0.5 rounded-md text-[11px] bg-slate-200/70 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                      {loopComplexityBadge(loop)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mathematical Derivation Steps */}
          {result.detailed?.complexityDerivation && result.detailed.complexityDerivation.length > 0 && (
            <div className="p-5 rounded-2xl bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Derivation Steps & Algorithmic Rationale
                </h3>
                <span className="font-mono text-xs font-bold text-slate-600 dark:text-slate-300">
                  Verdict: {result.timeComplexity}
                </span>
              </div>

              <ol className="space-y-2">
                {result.detailed.complexityDerivation.map((s, i) => (
                  <li
                    key={i}
                    className="flex gap-3 p-3 rounded-xl bg-slate-50 dark:bg-[#0c101c] border border-slate-200/70 dark:border-slate-800/70 text-xs"
                  >
                    <span className="flex-shrink-0 w-5 h-5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold text-[11px] flex items-center justify-center">
                      {s.step}
                    </span>
                    <div className="space-y-1">
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                        {s.description}
                      </p>
                      {s.math && (
                        <code className="inline-block px-2 py-0.5 rounded bg-white dark:bg-black/40 border border-slate-200 dark:border-slate-800 font-mono text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                          {s.math}
                        </code>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Reasoning & Detected Patterns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {result.detectedPatterns.length > 0 && (
              <div className="p-4 rounded-2xl bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 space-y-2">
                <h4 className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px]">
                  Detected Patterns
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {result.detectedPatterns.map((p) => (
                    <span
                      key={p}
                      className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[11px]"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Known Engine Limitations (Transparent Disclosures) */}
            <div className="p-4 rounded-2xl bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 space-y-2">
              <h4 className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <span>⚠️</span> Scope & Known Limitations
              </h4>
              <ul className="space-y-1 text-slate-500 dark:text-slate-400 text-[11px]">
                {result.knownLimitations.length > 0 ? (
                  result.knownLimitations.slice(0, 3).map((lim, i) => (
                    <li key={i} className="flex items-start gap-1">
                      <span>•</span>
                      <span>{lim}</span>
                    </li>
                  ))
                ) : (
                  <li>• Static analysis cannot predict input-dependent early returns or amortized cache costs.</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* 4. TAB 2: Proof-to-Optimize */}
      {activeTab === 'optimize' && (
        <ProofToOptimize
          code={code}
          language={language}
          analysis={result}
          onApplyOptimization={(newCode) => {
            if (onApplyOptimization) {
              onApplyOptimization(newCode);
            }
          }}
        />
      )}

      {/* 5. TAB 3: Empirical Sandbox Benchmark */}
      {activeTab === 'benchmark' && (
        <div className="space-y-3">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0c101c] border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
            <strong>Theoretical vs Empirical Distinction:</strong> Static analysis calculates worst-case asymptotic bounds ($O$). The Empirical Sandbox executes the code on actual hardware with increasing input sizes ($N$) to observe real millisecond scaling.
          </div>
          {code && (
            <EmpiricalBenchmarkCard code={code} theoreticalTime={result.timeComplexity} />
          )}
        </div>
      )}
    </div>
  );
};

export default AnalysisResults;
