import React from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { AnalysisResult, LoopInfo } from '@/lib/analyzer';
import type { InterviewProblem } from '@/data/interviewProblems';

interface AnalysisResultsProps {
  result: AnalysisResult;
  linkedProblem?: InterviewProblem | null;
  onSaveToDashboard?: () => void;
  onShare?: () => void;
  onExportPDF?: () => void;
  onExportPNG?: () => void;
  onHighlightLoop?: (loop: LoopInfo) => void;
}

export const AnalysisResults: React.FC<AnalysisResultsProps> = ({
  result,
  linkedProblem,
  onSaveToDashboard,
  onShare,
  onExportPDF,
  onExportPNG,
  onHighlightLoop,
}) => {
  const spaceComplexityDisplay =
    typeof result.spaceComplexity === 'string'
      ? result.spaceComplexity
      : result.spaceComplexity?.class || 'O(1)';

  const loopComplexityBadge = (loop: LoopInfo) => {
    if (loop.hasSortCall) return 'O(n log n)';
    if (loop.nestingDepth === 0) return 'O(n)';
    if (loop.nestingDepth === 1) return 'O(n²)';
    if (loop.nestingDepth >= 2) return `O(n^${loop.nestingDepth + 1})`;
    return 'O(n)';
  };

  // Check if expected vs actual comparison applies
  const isOptimal = linkedProblem
    ? result.timeComplexity.trim().toLowerCase() === linkedProblem.expectedTime.trim().toLowerCase()
    : null;

  const confidenceLabel = result.timeConfidence >= 80
    ? 'High confidence'
    : result.timeConfidence >= 60
      ? 'Moderate confidence'
      : 'Low confidence';

  const confidenceColor = result.timeConfidence >= 80
    ? 'bg-emerald-500'
    : result.timeConfidence >= 60
      ? 'bg-amber-500'
      : 'bg-red-500';

  return (
    <div className="space-y-6 text-left">
      {/* 1. Main Complexity Cards & Comparison Banner */}
      <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#111726] border border-gray-200 dark:border-gray-800 shadow-sm space-y-6">
        {/* Linked Problem Optimal vs Suboptimal Alert */}
        {linkedProblem && (
          <div
            className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              isOptimal
                ? 'bg-emerald-50/70 dark:bg-emerald-950/25 border-emerald-200 dark:border-emerald-800/40 text-emerald-900 dark:text-emerald-200'
                : 'bg-amber-50/70 dark:bg-amber-950/25 border-amber-200 dark:border-amber-800/40 text-amber-900 dark:text-amber-200'
            }`}
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-lg">{isOptimal ? '🎯' : '⚠️'}</span>
                <span className="font-bold text-sm">
                  {linkedProblem.title} ({linkedProblem.list})
                </span>
                <Badge variant={isOptimal ? 'success' : 'warning'} size="xs">
                  {isOptimal ? 'Optimal Solution' : 'Suboptimal Solution'}
                </Badge>
              </div>
              <p className="text-xs opacity-90">
                Expected: <strong className="font-mono">{linkedProblem.expectedTime}</strong> time ·{' '}
                <strong className="font-mono">{linkedProblem.expectedSpace}</strong> space.
                {isOptimal
                  ? ' Excellent work! Your solution achieves the theoretical target complexity.'
                  : ' Your code is currently slower or uses more memory than the optimal pattern.'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-white/80 dark:bg-black/40 border border-current font-mono">
                Actual: {result.timeComplexity}
              </span>
            </div>
          </div>
        )}

        {/* Verdict Big-O Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Time Complexity */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50/80 via-white to-indigo-50/30 dark:from-indigo-950/30 dark:via-[#0e1424] dark:to-[#090d16] border border-indigo-100 dark:border-indigo-900/40 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Time Complexity
              </span>
              <Badge variant="primary" size="sm">
                Worst Case
              </Badge>
            </div>
            <div className="font-mono font-black text-2xl sm:text-3xl text-gray-900 dark:text-white tracking-tight">
              {result.timeComplexity}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-snug">
              {result.detailed?.highLevelSummary || 'Growth rate of execution operations relative to input size.'}
            </p>
          </div>

          {/* Space Complexity */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-cyan-50/80 via-white to-cyan-50/30 dark:from-cyan-950/30 dark:via-[#0e1424] dark:to-[#090d16] border border-cyan-100 dark:border-cyan-900/40 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                Space Complexity
              </span>
              <Badge variant="primary" size="sm">
                Auxiliary
              </Badge>
            </div>
            <div className="font-mono font-black text-2xl sm:text-3xl text-gray-900 dark:text-white tracking-tight">
              {spaceComplexityDisplay}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-snug">
              Additional memory allocated during execution on heap and call stack.
            </p>
          </div>
        </div>

        {/* Quick action buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
          <div className="flex flex-wrap items-center gap-2">
            {onSaveToDashboard && (
              <Button variant="outline" size="sm" onClick={onSaveToDashboard} className="text-xs font-semibold">
                💾 Save Snippet
              </Button>
            )}
            {onShare && (
              <Button variant="outline" size="sm" onClick={onShare} className="text-xs font-semibold">
                🔗 Share Link
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {onExportPDF && (
              <Button variant="ghost" size="sm" onClick={onExportPDF} className="text-xs font-semibold">
                📄 Export PDF
              </Button>
            )}
            {onExportPNG && (
              <Button variant="ghost" size="sm" onClick={onExportPNG} className="text-xs font-semibold">
                🖼️ Image
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Explainability & Confidence */}
      <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#111726] border border-gray-200 dark:border-gray-800 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 flex items-center justify-center text-sm">
                ✓
              </span>
              Analysis Confidence
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              A static estimate based on the structures and patterns detected in your code.
            </p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-lg font-black text-gray-900 dark:text-white">{result.timeConfidence}%</p>
            <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">{confidenceLabel}</p>
          </div>
        </div>

        <div>
          <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${confidenceColor}`}
              style={{ width: `${Math.max(0, Math.min(100, result.timeConfidence))}%` }}
            />
          </div>
          {result.isPartialAnalysis && (
            <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">
              This code appears incomplete, so the confidence score has been reduced.
            </p>
          )}
        </div>

        {result.detectedPatterns.length > 0 && (
          <div>
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
              Detected signals
            </h3>
            <div className="flex flex-wrap gap-2">
              {result.detectedPatterns.map((pattern) => (
                <span
                  key={pattern}
                  className="px-2.5 py-1 rounded-lg bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-900/50 text-xs font-medium text-cyan-800 dark:text-cyan-300"
                >
                  {pattern}
                </span>
              ))}
            </div>
          </div>
        )}

        {result.reasoningChain.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {result.reasoningChain.slice(0, 4).map((reasoning) => (
              <div
                key={reasoning.id}
                className="p-3.5 rounded-2xl bg-gray-50 dark:bg-[#0c101c] border border-gray-200 dark:border-gray-800"
              >
                <div className="flex items-center justify-between gap-3 mb-1">
                  <p className="text-xs font-bold text-gray-800 dark:text-gray-200">{reasoning.title}</p>
                  <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">
                    {reasoning.confidenceChange >= 0 ? '+' : ''}{reasoning.confidenceChange}%
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{reasoning.rule}</p>
              </div>
            ))}
          </div>
        )}

        {result.knownLimitations.length > 0 && (
          <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40">
            <h3 className="text-xs font-bold text-amber-800 dark:text-amber-300 mb-1">Keep in mind</h3>
            <ul className="space-y-1">
              {result.knownLimitations.slice(0, 3).map((limitation) => (
                <li key={limitation} className="text-xs text-amber-900/80 dark:text-amber-200/80 leading-relaxed">
                  • {limitation}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* 3. Step-by-Step Mathematical Derivation */}
      {result.detailed?.complexityDerivation && result.detailed.complexityDerivation.length > 0 && (
        <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#111726] border border-gray-200 dark:border-gray-800 shadow-sm space-y-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-sm">
                  📐
                </span>
                How We Calculated It
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Step-by-step mathematical reasoning that led to the <span className="font-mono font-bold">Big-O</span> verdict.
              </p>
            </div>
            <Badge variant="primary" size="sm">
              Verdict: {result.timeComplexity}
            </Badge>
          </div>

          {/* Derivation Steps */}
          <ol className="space-y-3">
            {result.detailed.complexityDerivation.map((s, i) => (
              <li
                key={i}
                className="flex gap-3.5 p-3.5 rounded-2xl bg-gradient-to-br from-indigo-50/50 to-cyan-50/30 dark:from-indigo-950/20 dark:to-cyan-950/10 border border-indigo-100 dark:border-indigo-900/30"
              >
                <span className="flex-shrink-0 w-6 h-6 rounded-lg bg-white dark:bg-black/40 border border-indigo-200 dark:border-indigo-800 font-bold text-xs text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  {s.step}
                </span>
                <div className="flex-1 space-y-1.5">
                  <p className="text-xs sm:text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
                    {s.description}
                  </p>
                  {s.math && (
                    <code className="inline-block px-2.5 py-1 rounded-lg bg-white dark:bg-black/40 border border-indigo-200/60 dark:border-indigo-800/40 font-mono text-xs font-bold text-indigo-700 dark:text-indigo-300">
                      {s.math}
                    </code>
                  )}
                </div>
              </li>
            ))}
          </ol>

          {/* Breakdown Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
            <div className="p-3 rounded-2xl bg-red-50/70 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40">
              <p className="text-[9px] font-bold uppercase tracking-wider text-red-500/80 mb-1">Worst Case</p>
              <p className="font-mono font-black text-red-700 dark:text-red-300 text-sm sm:text-base">
                {result.detailed.timeComplexity?.worst ?? result.timeComplexity}
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40">
              <p className="text-[9px] font-bold uppercase tracking-wider text-amber-500/80 mb-1">Average Case</p>
              <p className="font-mono font-black text-amber-700 dark:text-amber-300 text-sm sm:text-base">
                {result.detailed.timeComplexity?.average ?? result.timeComplexity}
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40">
              <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-500/80 mb-1">Best Case</p>
              <p className="font-mono font-black text-emerald-700 dark:text-emerald-300 text-sm sm:text-base">
                {result.detailed.timeComplexity?.best ?? 'O(1)'}
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-cyan-50/70 dark:bg-cyan-950/20 border border-cyan-100 dark:border-cyan-900/40">
              <p className="text-[9px] font-bold uppercase tracking-wider text-cyan-500/80 mb-1">Auxiliary Space</p>
              <p className="font-mono font-black text-cyan-700 dark:text-cyan-300 text-sm sm:text-base">
                {result.detailed.spaceComplexity?.auxiliary ?? spaceComplexityDisplay}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 3. Loop Breakdown Table */}
      {result.loops && result.loops.length > 0 && (
        <div className="p-6 rounded-3xl bg-white dark:bg-[#111726] border border-gray-200 dark:border-gray-800 shadow-sm space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Complexity-Driving Loops ({result.loops.length})
          </h3>
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden divide-y divide-gray-200 dark:divide-gray-800 text-xs">
            {result.loops.map((loop, idx) => (
              <div
                key={idx}
                onClick={() => onHighlightLoop && onHighlightLoop(loop)}
                className="flex items-center justify-between gap-3 px-4 py-3 bg-gray-50/60 dark:bg-[#0c101c]/60 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-mono font-bold text-[10px]">
                    {String(loop.type || 'loop').toUpperCase()}
                  </span>
                  <span className="font-mono text-gray-700 dark:text-gray-200">
                    Line {loop.startLine}–{loop.endLine}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    (Nesting Depth: {loop.nestingDepth + 1})
                  </span>
                </div>
                <span className="font-mono font-bold px-2.5 py-0.5 rounded-md text-[11px] bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  {loopComplexityBadge(loop)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Optimization Suggestions */}
      {result.detailed?.possibleOptimizations && result.detailed.possibleOptimizations.length > 0 && (
        <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-50 via-white to-cyan-50 dark:from-emerald-950/20 dark:via-[#111726] dark:to-cyan-950/20 border border-emerald-200/70 dark:border-emerald-800/30 shadow-sm space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-xl shadow-md shadow-emerald-500/30 flex-shrink-0">
                🚀
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-gray-900 dark:text-white">
                  Optimization Suggestions
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Actionable techniques to reduce operations and improve your Big-O bounds.
                </p>
              </div>
            </div>
            <Badge variant="success" size="sm">
              {result.detailed.possibleOptimizations.length} idea{result.detailed.possibleOptimizations.length > 1 ? 's' : ''}
            </Badge>
          </div>

          <ol className="space-y-2.5">
            {result.detailed.possibleOptimizations.map((opt, i) => (
              <li
                key={i}
                className="flex gap-3 p-3.5 rounded-2xl bg-white/80 dark:bg-black/35 border border-gray-100 dark:border-gray-800/60"
              >
                <span className="flex-shrink-0 w-6 h-6 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-black text-xs flex items-center justify-center">
                  {i + 1}
                </span>
                <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed pt-0.5">
                  {opt}
                </p>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* 5. Auxiliary Memory Breakdown */}
      {result.detailed?.memoryUsage && result.detailed.memoryUsage.length > 0 && (
        <div className="p-6 rounded-3xl bg-white dark:bg-[#111726] border border-gray-200 dark:border-gray-800 shadow-sm space-y-3">
          <h3 className="text-sm font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 flex items-center justify-center text-sm">
              💾
            </span>
            Auxiliary Memory Breakdown
          </h3>
          <ul className="space-y-2">
            {result.detailed.memoryUsage.map((m, i) => (
              <li
                key={i}
                className="flex items-center justify-between gap-3 p-3 rounded-xl border border-gray-200/70 dark:border-gray-800/60 bg-gray-50/60 dark:bg-[#0c101c]/60"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-8 h-8 rounded-lg bg-white dark:bg-black/30 border border-gray-200 dark:border-gray-700/60 flex items-center justify-center text-base flex-shrink-0">
                    {m.type === 'Array' ? '📦' : m.type === 'HashMap' ? '🗂️' : m.type === 'Stack' ? '🥞' : '🧱'}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-gray-800 dark:text-gray-200">{m.name}</p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{m.note}</p>
                  </div>
                </div>
                <Badge variant={m.affectsComplexity ? 'warning' : 'success'} size="xs">
                  {m.affectsComplexity ? 'Affects O' : 'Constant'}
                </Badge>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default AnalysisResults;
