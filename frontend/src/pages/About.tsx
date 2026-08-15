import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';

export const About: React.FC = () => {
  const pipelineSteps = [
    {
      step: '01',
      title: 'Lexical Tokenization',
      description:
        'Converts raw source code into structured tokens, stripping comments and normalizing language-specific syntax.',
      icon: '🔤',
    },
    {
      step: '02',
      title: 'Loop & Structure Analysis',
      description:
        'Tracks nested for/while loops, computes nesting depth, and identifies loop counter patterns (linear vs logarithmic).',
      icon: '🔁',
    },
    {
      step: '03',
      title: 'Recursion Detection',
      description:
        'Identifies direct and mutual recursive calls, detects branching factors, and estimates call stack depth.',
      icon: '🌀',
    },
    {
      step: '04',
      title: 'Stdlib & Pattern Matching',
      description:
        'Recognizes sort calls, hash container usage, implicit array methods (map/forEach), and known complexity patterns.',
      icon: '🧩',
    },
    {
      step: '05',
      title: 'Big-O Bounding',
      description:
        'Combines all signals into asymptotic bounds, computes confidence score, and generates step-by-step reasoning.',
      icon: '📐',
    },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#090d16] text-gray-900 dark:text-gray-100 transition-colors">
      <section className="pt-16 pb-16 border-b border-gray-200 dark:border-gray-800/80 bg-white dark:bg-[#0d121f]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold tracking-wide">
            <span>✨ How it works</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-gray-900 dark:text-white">
            Big-O analysis, instantly.
          </h1>

          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Complexity is a heuristic-based static analyzer that estimates time and space complexity
            from source code — no execution required.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Button variant="primary" asChild className="font-bold shadow-lg shadow-indigo-500/20">
              <Link to="/analyzer">Try the Analyzer →</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="py-20 max-w-5xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Principles
            </span>
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Honest estimates, not false promises
            </h2>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
              This is not a formal complexity prover. It uses well-known AST and pattern-based
              heuristics to give fast, useful estimates — perfect for interviews, code reviews,
              and learning.
            </p>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
              All analysis runs locally in your browser. Your code is never sent anywhere.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-gradient-to-br from-indigo-500/10 via-cyan-500/5 to-transparent border border-indigo-500/20 space-y-4 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-md">
                13
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">Languages Supported</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">JS/TS, Python, Java, C#, C++, Go, Rust, and more</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-600 text-white flex items-center justify-center font-bold text-lg shadow-md">
                ⚡
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">Instant Analysis</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Sub-100ms heuristic evaluation</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow-md">
                🔒
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">100% Private</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Runs entirely in your browser</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-50 dark:bg-[#070a12] border-t border-gray-200 dark:border-gray-800/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Pipeline
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white">
              5-Stage Analysis Engine
            </h2>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              How raw code becomes a Big-O estimate.
            </p>
          </div>

          <div className="space-y-6">
            {pipelineSteps.map((item) => (
              <div
                key={item.step}
                className="p-6 rounded-2xl bg-white dark:bg-[#111726] border border-gray-200 dark:border-gray-800 hover:border-indigo-500/40 transition-all flex flex-col md:flex-row items-start md:items-center gap-6 shadow-sm"
              >
                <div className="flex items-center gap-4 shrink-0">
                  <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
                    {item.step}
                  </span>
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-2xl">
                    {item.icon}
                  </div>
                </div>

                <div className="flex-1 space-y-1">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 border-t border-gray-200 dark:border-gray-800/80 bg-gray-50 dark:bg-[#0c101c] text-center">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-5">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">
            Ready to analyze some code?
          </h2>
          <div className="flex justify-center gap-4">
            <Button variant="primary" asChild className="font-bold shadow-lg shadow-indigo-500/20">
              <Link to="/analyzer">Open Analyzer</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};
export default About;
