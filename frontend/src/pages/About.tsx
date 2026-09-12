import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { SEO } from '@/components/SEO';

export const About: React.FC = () => {
  const pipelineSteps = [
    {
      step: '01',
      title: 'Lexical Tokenization & Normalization',
      description:
        'Normalizes source code across 13 programming languages, strips comments and string literals, and categorizes syntax structures.',
      icon: '🔤',
    },
    {
      step: '02',
      title: 'Loop & Nesting Depth Detection',
      description:
        'Tracks for, while, and implicit iterations (such as map/forEach), measures loop nesting levels, and detects step patterns (linear vs logarithmic).',
      icon: '🔁',
    },
    {
      step: '03',
      title: 'Recursion & Call Stack Modeling',
      description:
        'Detects self-referential function calls, calculates branching factors (e.g. divide-and-conquer vs exponential branching), and models call-stack depth.',
      icon: '🌀',
    },
    {
      step: '04',
      title: 'Built-in Methods & Pattern Recognition',
      description:
        'Identifies standard library sort calls (O(n log n)), hash tables and sets (O(1) average lookup), dynamic allocations, and array methods.',
      icon: '🧩',
    },
    {
      step: '05',
      title: 'Big-O Bounding & Mathematical Derivation',
      description:
        'Combines all structural signals into Time and Space Complexity bounds, generates confidence scores, and produces step-by-step mathematical reasoning.',
      icon: '📐',
    },
  ];

  const faqs = [
    {
      q: 'Does Complexity execute or run my code?',
      a: 'No. Complexity performs purely static heuristic analysis in your browser. Your code is never executed, compiled, or uploaded to any server.',
    },
    {
      q: 'Is the Big-O result a formal mathematical proof?',
      a: 'Complexity uses static pattern heuristics rather than a formal theorem prover. It provides fast, accurate estimates for standard algorithms, course exercises, and interview problems.',
    },
    {
      q: 'Why does Complexity focus on worst-case bounds?',
      a: 'In computer science and technical interviews, Big-O notation typically represents the upper bound (worst-case scenario) to ensure an algorithm performs within predictable limits.',
    },
    {
      q: 'What 13 programming languages are supported?',
      a: 'JavaScript, TypeScript, Python, Java, C, C++, C#, Go, Rust, Swift, Kotlin, PHP, and Ruby. The analyzer detects your language automatically or lets you select it manually.',
    },
  ];

  return (
    <div className="page-shell text-text-primary dark:text-text-primary-dark transition-colors">
      <SEO
        title="About the Static Analysis Engine & Big-O Methodology"
        description="Learn how Complexity's static AST analysis pipeline calculates Big-O time and space bounds across 13 programming languages without code execution."
        canonical="/about"
      />
      {/* HERO SECTION */}
      <section className="relative overflow-hidden border-b border-gray-200 dark:border-gray-800/80 bg-white dark:bg-[#0d121f]">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_78%_18%,rgba(99,102,241,0.16),transparent_28%),radial-gradient(circle_at_18%_0%,rgba(6,182,212,0.08),transparent_25%)]" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
          <div className="grid lg:grid-cols-[1.05fr_0.95fr] items-center gap-12">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold tracking-wide">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Architecture & Principles
              </div>
              <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.02] text-gray-900 dark:text-white">
                See the thinking behind every <span className="text-indigo-500">Big-O result.</span>
              </h1>
              <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 max-w-xl leading-relaxed">
                Complexity turns source code into understandable time and space bounds using private, client-side static analysis.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Button variant="primary" asChild className="font-bold shadow-lg shadow-indigo-500/20">
                  <Link to="/analyzer">Open Analyzer <span aria-hidden="true">→</span></Link>
                </Button>
                <Button variant="secondary" asChild className="font-semibold">
                  <Link to="/learn">Explore Learning</Link>
                </Button>
              </div>
            </div>

            <div className="relative rounded-3xl border border-indigo-200/70 dark:border-indigo-900/60 bg-gray-950 p-5 shadow-2xl shadow-indigo-950/20">
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                </div>
                <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-gray-500">analysis pipeline</span>
              </div>
              <div className="space-y-3 py-5 font-mono text-xs">
                {['Tokenize source', 'Detect loops & recursion', 'Model memory growth', 'Derive complexity bounds'].map((step, index) => (
                  <div key={step} className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-300">{index + 1}</span>
                    <span className="text-gray-300">{step}</span>
                    <span className="ml-auto text-emerald-400">done</span>
                  </div>
                ))}
              </div>
              <div className="flex items-end justify-between rounded-2xl bg-white/5 p-4">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-gray-500">worst-case time</p>
                  <p className="mt-1 text-2xl font-black text-white">O(n log n)</p>
                </div>
                <span className="rounded-lg bg-emerald-400/10 px-2 py-1 text-[10px] font-bold text-emerald-300">84% confidence</span>
              </div>
            </div>
          </div>

          <div className="mt-14 grid grid-cols-2 md:grid-cols-4 divide-x divide-gray-200 dark:divide-gray-800 border-y border-gray-200 dark:border-gray-800">
            {[
              ['13', 'languages supported'],
              ['100%', 'client-side privacy'],
              ['5', 'analysis stages'],
              ['0', 'code execution required'],
            ].map(([value, label]) => (
              <div key={label} className="px-4 py-5 first:pl-0 last:pr-0">
                <p className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">{value}</p>
                <p className="mt-1 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CORE PRINCIPLES */}
      <section className="py-20 max-w-5xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-5">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Guiding Principles
            </span>
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Educational, Honest, and 100% Private
            </h2>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
              Complexity is designed to demystify algorithmic efficiency for students, interview candidates, and software engineers.
              Instead of giving you a bare Big-O label, it breaks down the exact loop multipliers, recursive branches, and data structure operations that create that bound.
            </p>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
              All analysis executes client-side in your browser. Your source code is never sent across the network or stored on remote servers.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-gradient-to-br from-indigo-500/10 via-cyan-500/5 to-transparent border border-indigo-500/20 space-y-5 shadow-lg">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-lg shadow-md shrink-0">
                13
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">Supported Languages</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  JavaScript, TypeScript, Python, Java, C#, C++, Go, Rust, C, Swift, Kotlin, PHP, Ruby
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-2xl bg-cyan-600 text-white flex items-center justify-center font-bold text-lg shadow-md shrink-0">
                ⚡
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">Static Heuristic Engine</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Instant AST pattern inspection without code execution
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow-md shrink-0">
                🔒
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">100% In-Browser Privacy</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Your code stays in your browser and is never uploaded
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5-STAGE ANALYSIS PIPELINE */}
      <section className="py-20 bg-gray-50 dark:bg-[#070a12] border-t border-gray-200 dark:border-gray-800/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Pipeline
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white">
              5-Stage Heuristic Analysis Pipeline
            </h2>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              How raw source code is transformed into clear Big-O bounds and educational derivations.
            </p>
          </div>

          <div className="space-y-4">
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
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
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

      {/* FREQUENTLY ASKED QUESTIONS */}
      <section className="py-20 max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            FAQ
          </span>
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">
            Frequently Asked Questions
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Common questions about how Complexity evaluates algorithmic bounds.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="p-6 rounded-2xl bg-white dark:bg-[#111726] border border-gray-200 dark:border-gray-800 space-y-2"
            >
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-start gap-2">
                <span className="text-indigo-600 dark:text-indigo-400">Q.</span>
                <span>{faq.q}</span>
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed pl-5">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section className="py-16 border-t border-gray-200 dark:border-gray-800/80 bg-gray-50 dark:bg-[#0c101c] text-center">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-5">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">
            Ready to analyze an algorithm?
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
            Paste any code snippet and explore its time complexity, auxiliary space, and mathematical breakdown.
          </p>
          <div className="flex justify-center gap-4">
            <Button variant="primary" asChild className="font-bold shadow-lg shadow-indigo-500/20">
              <Link to="/analyzer">Open Complexity Analyzer →</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
