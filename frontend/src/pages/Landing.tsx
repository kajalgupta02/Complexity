import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';

const ALL_LANGS = [
  { label: 'JavaScript', icon: '🟨' },
  { label: 'TypeScript', icon: '🔷' },
  { label: 'Python', icon: '🐍' },
  { label: 'Java', icon: '☕' },
  { label: 'C#', icon: '🟣' },
  { label: 'C++', icon: '⚙️' },
  { label: 'Go', icon: '🐹' },
  { label: 'Rust', icon: '🦀' },
  { label: 'C', icon: '🇨' },
  { label: 'Swift', icon: '🍎' },
  { label: 'Kotlin', icon: '🟪' },
  { label: 'PHP', icon: '🐘' },
  { label: 'Ruby', icon: '💎' },
];

export const Landing: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#090d16] text-gray-900 dark:text-gray-100 transition-colors selection:bg-indigo-500 selection:text-white">
      <div className="relative isolate overflow-hidden">
        <div className="absolute -top-40 left-1/2 -z-10 -translate-x-1/2 blur-3xl opacity-30 dark:opacity-25 pointer-events-none">
          <div
            className="aspect-[1155/678] w-[72.1875rem] bg-gradient-to-tr from-indigo-500 via-cyan-400 to-indigo-800"
            style={{
              clipPath:
                'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
            }}
          />
        </div>

        <section className="pt-16 pb-16 sm:pt-24 sm:pb-24 max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center space-y-6">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-semibold tracking-wide animate-fade-in">
              <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
              Static Big-O analyzer · no code execution
            </span>

            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-gray-900 dark:text-white leading-[1.05]">
              Paste any code.{' '}
              <span className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 bg-clip-text text-transparent">
                See time & space complexity.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 leading-relaxed font-normal max-w-2xl mx-auto">
              Instantly derive Big-O bounds from your source code using heuristic analysis.
              Auto-detects 13 languages, flags complexity-driving patterns, and runs
              entirely in your browser.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <Button
                variant="primary"
                size="lg"
                onClick={() => navigate('/analyzer')}
                className="shadow-xl shadow-indigo-500/25 px-8 py-3.5 text-base font-bold group"
              >
                <span>Start Analyzing</span>
                <span className="ml-2 group-hover:translate-x-1 transition-transform inline-block">→</span>
              </Button>
            </div>

            <div className="pt-8">
              <p className="text-[11px] uppercase tracking-widest font-bold text-gray-400 dark:text-gray-500 mb-3">
                13 supported languages
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {ALL_LANGS.map((l) => (
                  <span
                    key={l.label}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/70 dark:bg-[#111726]/70 border border-gray-200/70 dark:border-gray-800 text-xs font-medium text-gray-700 dark:text-gray-300 shadow-sm"
                  >
                    <span className="text-sm">{l.icon}</span>
                    {l.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>

      <section id="how-it-works" className="py-16 sm:py-20 border-t border-gray-200/80 dark:border-gray-800/80 bg-white dark:bg-[#0c101c]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              How it works
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
              Three steps to Big-O
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              { step: 1, title: 'Paste your code', body: 'Drop in any function, class, or full program. Language is detected automatically.', icon: '📋' },
              { step: 2, title: 'Click Analyze', body: 'The engine parses loop nests, recursion, stdlib calls, and branching patterns.', icon: '⚡' },
              { step: 3, title: 'Get T & S bounds', body: 'See time & space complexity with detailed reasoning and confidence score.', icon: '📊' },
            ].map((s) => (
              <div
                key={s.step}
                className="p-6 rounded-2xl bg-[#f8fafc] dark:bg-[#111726] border border-gray-200 dark:border-gray-800"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xl">
                    {s.icon}
                  </div>
                  <span className="text-xs font-black tracking-widest text-gray-400">
                    STEP {s.step}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-1.5">
                  {s.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {s.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 border-t border-gray-200/80 dark:border-gray-800/80 bg-[#f8fafc] dark:bg-[#090d16]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="p-6 rounded-2xl bg-white dark:bg-[#111726] border border-gray-200 dark:border-gray-800">
              <div className="text-2xl mb-3">⏱️</div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                Time Complexity
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                Worst-case asymptotic runtime with confidence score. Detects for / while loops,
                recursive calls, implicit iteration (map / forEach), and stdlib sort costs.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-white dark:bg-[#111726] border border-gray-200 dark:border-gray-800">
              <div className="text-2xl mb-3">💾</div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                Space Complexity
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                Auxiliary memory footprint — separates heap allocations from
                recursive call-stack frames.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 bg-gradient-to-br from-indigo-900 via-indigo-950 to-gray-950 text-white relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6 relative z-10">
          <h2 className="text-2xl sm:text-5xl font-black tracking-tight">
            Stop guessing about complexity.
          </h2>
          <p className="text-base sm:text-lg text-indigo-200/90 max-w-xl mx-auto">
            Paste any snippet, click analyze, and know your bounds.
          </p>
          <div>
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate('/analyzer')}
              className="px-10 py-4 text-base font-black shadow-2xl shadow-indigo-500/40"
            >
              Open the Analyzer
              <span className="ml-2 inline-block">→</span>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;
