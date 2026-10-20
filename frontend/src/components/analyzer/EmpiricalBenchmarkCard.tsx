import React, { useState } from 'react';
import { runEmpiricalBenchmark, type BenchmarkResponse } from '@/services/api';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface EmpiricalBenchmarkCardProps {
  code: string;
  theoreticalTime: string;
}

export const EmpiricalBenchmarkCard: React.FC<EmpiricalBenchmarkCardProps> = ({
  code,
  theoreticalTime,
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [benchmarkData, setBenchmarkData] = useState<BenchmarkResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRunBenchmark = async () => {
    setIsRunning(true);
    setError(null);
    try {
      const response = await runEmpiricalBenchmark(code, [100, 500, 1000, 2500, 5000]);
      setBenchmarkData(response);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Benchmark failed';
      setError(
        msg.includes('fetch')
          ? 'Backend server not responding. Make sure backend is running on http://localhost:5000 via npm run dev.'
          : msg
      );
    } finally {
      setIsRunning(false);
    }
  };

  const maxTime = benchmarkData?.points?.length
    ? Math.max(...benchmarkData.points.map((p) => p.timeMs), 0.001)
    : 1;

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-violet-500/15 text-violet-600 dark:text-violet-400 flex items-center justify-center text-sm font-bold">
              ⚡
            </span>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Empirical Microbenchmarking Engine
            </h3>
            <Badge variant="primary" size="xs">
              Backend Sandbox
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Measures real hardware execution times across scaled inputs (N = 100 to 5,000) inside an isolated Node.js VM.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={handleRunBenchmark}
          disabled={isRunning}
          className="shrink-0 font-semibold text-xs shadow-sm bg-violet-600 hover:bg-violet-500 text-white"
        >
          {isRunning ? '⏳ Running Sandbox...' : '🚀 Run Empirical Test'}
        </Button>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs flex items-start gap-2">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {benchmarkData && (
        <div className="space-y-4 pt-1">
          {/* Comparison Banner */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0c101c] border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-1">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Asymptotic Verification:</span>
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                <span>Theoretical: <span className="font-mono text-indigo-600 dark:text-indigo-400">{theoreticalTime}</span></span>
                <span>→</span>
                <span>Empirical: <span className="font-mono text-emerald-600 dark:text-emerald-400">{benchmarkData.empiricalVerdict}</span></span>
              </div>
            </div>

            <Badge variant="success" size="sm">
              ✓ Measured across {benchmarkData.sampleCount} input sizes
            </Badge>
          </div>

          {/* Microbenchmark Bar Chart */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              <span>Input Size (N)</span>
              <span>Execution Time (ms)</span>
            </div>

            <div className="space-y-2">
              {benchmarkData.points.map((pt) => {
                const percentage = Math.max(8, (pt.timeMs / maxTime) * 100);
                return (
                  <div key={pt.n} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-600 dark:text-slate-300 font-semibold">N = {pt.n.toLocaleString()}</span>
                      <span className="text-slate-900 dark:text-white font-bold">{pt.timeMs.toFixed(3)} ms</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
