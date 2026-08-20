import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';

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
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#090d16] text-gray-900 dark:text-gray-100 transition-colors">
      {/* HERO SECTION */}
      <section className="pt-16 pb-16 border-b border-gray-200 dark:border-gray-800/80 bg-white dark:bg-[#0d121f]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold tracking-wide">
            <span>✨ Architecture & Principles</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-gray-900 dark:text-white">
            How Complexity Works
          </h1>

          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Complexity is a client-side static analyzer that estimates Time (Big-O) and Space Complexity from source code without running your code.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Button variant="primary" asChild className="font-bold shadow-lg shadow-indigo-500/20">
              <Link to="/analyzer">Open Complexity Analyzer →</Link>
            </Button>
            <Button variant="secondary" asChild className="font-semibold">
              <Link to="/learn">Explore Learning Modules</Link>
            </Button>
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
