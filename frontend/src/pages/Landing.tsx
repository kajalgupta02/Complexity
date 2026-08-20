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

const TARGET_AUDIENCES = [
  {
    icon: '🎓',
    title: 'DSA & CS Students',
    description:
      'Learn how loop nests, recursive call stacks, and data structures translate into Big-O bounds with clear step-by-step math.',
  },
  {
    icon: '💼',
    title: 'Interview Candidates',
    description:
      'Check algorithmic efficiency before technical interviews, spot hidden quadratic pitfalls, and discover optimization strategies.',
  },
  {
    icon: '💻',
    title: 'Software Engineers',
    description:
      'Quickly estimate asymptotic performance of functions and pull requests without setting up runtime benchmarks.',
  },
  {
    icon: '🌱',
    title: 'Beginners in Big-O',
    description:
      'Understand the "why" behind time and space complexity with simple, jargon-free explanations and visual loop markers.',
  },
];

const HOW_IT_WORKS_STEPS = [
  {
    step: 1,
    title: 'Paste or write your code',
    description:
      'Drop in any function, algorithm, or snippet. The analyzer automatically detects your language across 13 options.',
    icon: '📋',
  },
  {
    step: 2,
    title: 'Analyze Complexity',
    description:
      'The static engine inspects loop structures, recursion branching, and standard library methods — without running your code.',
    icon: '⚡',
  },
  {
    step: 3,
    title: 'Understand Time & Space bounds',
    description:
      'Explore estimated Big-O bounds, confidence score, mathematical derivations, and practical tips to speed up your code.',
    icon: '📊',
  },
];

export const Landing: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#090d16] text-gray-900 dark:text-gray-100 transition-colors selection:bg-indigo-500 selection:text-white">
      {/* HERO SECTION */}
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
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-semibold tracking-wide animate-fade-in">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              100% Private Client-Side Static Analysis · No Code Execution
            </span>

            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-gray-900 dark:text-white leading-[1.08]">
              Analyze Your Code.{' '}
              <span className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 bg-clip-text text-transparent">
                Understand Its Complexity.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 leading-relaxed font-normal max-w-2xl mx-auto">
              Paste your code and get an estimated Time and Space Complexity using static analysis — without executing your code.
              Analyzes loops, recursion, and built-in methods across 13 programming languages directly in your browser.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <Button
                variant="primary"
                size="lg"
                onClick={() => navigate('/analyzer')}
                className="shadow-xl shadow-indigo-500/25 px-8 py-3.5 text-base font-bold group"
              >
                <span>Analyze Complexity</span>
                <span className="ml-2 group-hover:translate-x-1 transition-transform inline-block">→</span>
              </Button>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => navigate('/learn')}
                className="px-6 py-3.5 text-base font-semibold"
              >
                <span>Learn Big-O Concepts</span>
              </Button>
            </div>

            {/* PRIVACY GUARANTEE PILL */}
            <div className="pt-2">
              <p className="text-xs text-gray-500 dark:text-gray-400 inline-flex items-center gap-1.5 bg-gray-100/80 dark:bg-gray-800/60 px-3.5 py-1.5 rounded-full border border-gray-200/60 dark:border-gray-700/60">
                <span>🔒</span> Your code is analyzed directly in your browser and is not uploaded for analysis.
              </p>
            </div>

            {/* 13 SUPPORTED LANGUAGES */}
            <div className="pt-8">
              <p className="text-[11px] uppercase tracking-widest font-bold text-gray-400 dark:text-gray-500 mb-3">
                13 Supported Programming Languages
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {ALL_LANGS.map((l) => (
                  <span
                    key={l.label}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/80 dark:bg-[#111726]/80 border border-gray-200/80 dark:border-gray-800 text-xs font-medium text-gray-700 dark:text-gray-300 shadow-sm"
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

      {/* WHO IS IT FOR? SECTION */}
      <section className="py-16 sm:py-20 border-t border-gray-200/80 dark:border-gray-800/80 bg-white dark:bg-[#0c101c]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Target Audience
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
              Who is Complexity built for?
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
              Whether you are preparing for coding interviews, taking data structure courses, or reviewing code, Complexity gives you intuitive insights.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {TARGET_AUDIENCES.map((item, idx) => (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-[#f8fafc] dark:bg-[#111726] border border-gray-200 dark:border-gray-800 flex flex-col justify-between space-y-3 hover:border-indigo-500/40 transition-colors"
              >
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xl">
                    {item.icon}
                  </div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    {item.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS: THREE STEPS */}
      <section id="how-it-works" className="py-16 sm:py-20 border-t border-gray-200/80 dark:border-gray-800/80 bg-[#f8fafc] dark:bg-[#090d16]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Simple Workflow
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
              Three steps to Big-O clarity
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
              Get an instant breakdown without installing compilers, configuring environments, or executing code.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {HOW_IT_WORKS_STEPS.map((s) => (
              <div
                key={s.step}
                className="p-6 rounded-2xl bg-white dark:bg-[#111726] border border-gray-200 dark:border-gray-800 shadow-sm relative"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xl">
                    {s.icon}
                  </div>
                  <span className="text-xs font-black tracking-widest text-indigo-600 dark:text-indigo-400">
                    STEP {s.step}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-1.5">
                  {s.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {s.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TIME VS SPACE COMPLEXITY FEATURE CARDS */}
      <section className="py-16 sm:py-20 border-t border-gray-200/80 dark:border-gray-800/80 bg-white dark:bg-[#0c101c]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Core Analysis
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
              What does Complexity evaluate?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-7 rounded-3xl bg-[#f8fafc] dark:bg-[#111726] border border-gray-200 dark:border-gray-800 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-2xl">
                ⏱️
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Time Complexity (Big-O)
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                Estimates how the algorithm’s execution time scales as input size <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">n</span> grows.
                Detects single loops, nested loops, logarithmic halving (e.g. binary search), recursion branching, and standard library sorting operations.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-mono font-bold">O(1)</span>
                <span className="px-2.5 py-1 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-xs font-mono font-bold">O(log n)</span>
                <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-mono font-bold">O(n)</span>
                <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-mono font-bold">O(n log n)</span>
                <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-mono font-bold">O(n²)</span>
                <span className="px-2.5 py-1 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-mono font-bold">O(2ⁿ)</span>
              </div>
            </div>

            <div className="p-7 rounded-3xl bg-[#f8fafc] dark:bg-[#111726] border border-gray-200 dark:border-gray-800 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center text-2xl">
                💾
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Space Complexity (Auxiliary Memory)
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                Measures the additional memory allocated by the algorithm during execution, excluding the input itself.
                Distinguishes between dynamic heap allocations (like lists and hash tables) and recursive call stack frames.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">O(1) In-Place</span>
                <span className="px-2.5 py-1 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-xs font-semibold">Recursion Call Stack</span>
                <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-semibold">Dynamic Data Structures</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BOTTOM CTA BANNER */}
      <section className="py-16 sm:py-20 bg-gradient-to-br from-indigo-900 via-indigo-950 to-gray-950 text-white relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6 relative z-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold tracking-wider uppercase">
            ⚡ Ready to analyze?
          </span>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Analyze Your Code. Understand Its Complexity.
          </h2>
          <p className="text-base sm:text-lg text-indigo-200/90 max-w-xl mx-auto leading-relaxed">
            Paste any algorithm, click Analyze Complexity, and get instant Big-O bounds and educational derivations in seconds.
          </p>
          <div className="pt-2">
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate('/analyzer')}
              className="px-10 py-4 text-base font-black shadow-2xl shadow-indigo-500/40"
            >
              <span>Open Complexity Analyzer</span>
              <span className="ml-2 inline-block">→</span>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;
