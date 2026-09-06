import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { LEARNING_LESSONS } from '@/data/learningCurriculum';
import type { LearningLesson } from '@/types/auth';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { SEO } from '@/components/SEO';

export const Learn: React.FC = () => {
  const { addToast } = useToast();
  const [selectedLesson, setSelectedLesson] = useState<LearningLesson | null>(LEARNING_LESSONS[0]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  // Quiz state
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);

  const categories = ['All', 'Fundamentals', 'Time Complexity', 'Space Complexity'];

  const filteredLessons = selectedCategory === 'All'
    ? LEARNING_LESSONS
    : LEARNING_LESSONS.filter((l) => l.category === selectedCategory);

  const handleSelectLesson = (lesson: LearningLesson) => {
    setSelectedLesson(lesson);
    setQuizAnswers({});
    setQuizSubmitted(false);
  };

  const handleSelectOption = (questionId: string, optionIdx: number) => {
    if (quizSubmitted) return;
    setQuizAnswers((prev) => ({ ...prev, [questionId]: optionIdx }));
  };

  const handleSubmitQuiz = () => {
    if (!selectedLesson) return;
    
    // Validate that all questions were answered
    const unanswered = selectedLesson.quiz.some((q) => quizAnswers[q.id] === undefined);
    if (unanswered) {
      addToast('warning', 'Please select an answer for each question before submitting.');
      return;
    }

    setQuizSubmitted(true);

    // Calculate score
    let correctCount = 0;
    selectedLesson.quiz.forEach((q) => {
      if (quizAnswers[q.id] === q.correctIndex) {
        correctCount++;
      }
    });

    const scorePercent = Math.round((correctCount / selectedLesson.quiz.length) * 100);

    if (scorePercent >= 70) {
      addToast('success', `Great work — you scored ${scorePercent}%.`);
    } else {
      addToast('warning', `You scored ${scorePercent}%. Review the theory and try again!`);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#090d16] text-gray-900 dark:text-gray-100 transition-colors py-10">
      <SEO
        title="Learn Time & Space Complexity"
        description="Clear, practical guides to Big-O notation with examples, explanations, and self-check questions."
        canonical="/learn"
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10">
        {/* Header */}
        <div className="rounded-3xl bg-white dark:bg-[#111726] border border-gray-200 dark:border-gray-800 p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold">
                <span>Big-O learning guide</span>
              </div>
              <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">
                Learn complexity, one idea at a time
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                Choose a topic, read the plain-English explanation, study the example, and use the self-check to reinforce it.
              </p>
              <Button variant="primary" size="sm" asChild className="mt-3">
                <Link to="/quiz">Take the full quiz →</Link>
              </Button>
            </div>

            <div className="rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 p-5">
              <h2 className="text-sm font-bold text-indigo-950 dark:text-indigo-100">A simple way to use this page</h2>
              <ol className="mt-3 space-y-2 text-xs leading-relaxed text-indigo-900 dark:text-indigo-200 list-decimal list-inside">
                <li>Start with Fundamentals if Big-O is new to you.</li>
                <li>Match the explanation to the code example.</li>
                <li>Try the self-check, then test the code in the analyzer.</li>
              </ol>
            </div>
          </div>

        </div>

        {/* Main Content Layout: Left Sidebar Lessons List + Right Lesson Detail */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Lessons List Column */}
          <div className="lg:col-span-4 lg:sticky lg:top-20 lg:self-start space-y-4">
            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-1.5 p-1 bg-white dark:bg-[#111726] border border-gray-200 dark:border-gray-800 rounded-2xl">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                    selectedCategory === cat
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Lesson Cards */}
            <div className="space-y-2.5">
              {filteredLessons.map((lesson) => {
                const isSelected = selectedLesson?.id === lesson.id;
                return (
                  <button
                    key={lesson.id}
                    onClick={() => handleSelectLesson(lesson)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all ${
                      isSelected
                        ? 'bg-white dark:bg-[#111726] border-indigo-500 ring-2 ring-indigo-500/20 shadow-md'
                        : 'bg-white/70 dark:bg-[#111726]/60 border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-md">
                        {lesson.complexity}
                      </span>
                      <span className="text-[11px] text-gray-400 font-medium">
                        {lesson.estimatedMinutes} min
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white leading-snug">
                      {lesson.title}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                      {lesson.description}
                    </p>
                  </button>
                );
              })}
            </div>

          </div>

          {/* Right Lesson Detail Column */}
          <div className="lg:col-span-8 lg:sticky lg:top-20 lg:h-[calc(100vh-6rem)]">
            {selectedLesson ? (
              <div
                key={selectedLesson.id}
                className="rounded-3xl bg-white dark:bg-[#111726] border border-gray-200 dark:border-gray-800 p-6 sm:p-8 shadow-sm space-y-8 lg:h-full lg:overflow-y-auto"
              >
                {/* Header */}
                <div className="space-y-3 pb-6 border-b border-gray-100 dark:border-gray-800/80">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-600 text-white">
                        {selectedLesson.complexity}
                      </span>
                      <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                        {selectedLesson.difficulty}
                      </span>
                      <span className="text-xs text-gray-500">
                        ⏱ {selectedLesson.estimatedMinutes} min read
                      </span>
                    </div>

                    <Button variant="ghost" size="sm" asChild className="text-xs font-semibold">
                      <Link
                        to={`/analyzer?code=${encodeURIComponent(selectedLesson.codeExample.code)}&lang=${selectedLesson.codeExample.language}`}
                      >
                        <span>⚡ Test in Analyzer →</span>
                      </Link>
                    </Button>
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">
                    {selectedLesson.title}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    {selectedLesson.description}
                  </p>
                </div>

                {/* 1. What It Means & Real-world Analogy */}
                <div className="space-y-4">
                  <div className="p-5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                      <span>📖</span> 1. What It Means
                    </h3>
                    <p className="text-sm text-indigo-950 dark:text-indigo-200 leading-relaxed font-medium">
                      {selectedLesson.whatItMeans}
                    </p>
                  </div>

                  {selectedLesson.simpleExample && (
                    <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 space-y-1">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                        <span>💡</span> 2. Simple Example / Analogy
                      </h4>
                      <p className="text-xs sm:text-sm text-amber-900 dark:text-amber-200 leading-relaxed">
                        {selectedLesson.simpleExample}
                      </p>
                    </div>
                  )}
                </div>

                {/* 3. Code Example & Interactive Demonstration */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                      <span>💻</span> 3. Code Example
                    </h3>
                    <span className="text-xs font-mono text-gray-400 capitalize">
                      {selectedLesson.codeExample.language}
                    </span>
                  </div>

                  <div className="rounded-2xl bg-gray-900 text-gray-100 p-4 font-mono text-xs overflow-x-auto border border-gray-800 shadow-inner">
                    <pre className="text-emerald-400 font-mono">
                      {selectedLesson.codeExample.code}
                    </pre>
                  </div>

                  <p className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-[#0c101c] p-3.5 rounded-2xl border border-gray-200 dark:border-gray-800 leading-relaxed">
                    💡 {selectedLesson.codeExample.explanation}
                  </p>
                </div>

                {/* 4. Why It Has That Complexity */}
                <div className="p-4 rounded-2xl bg-cyan-50/50 dark:bg-cyan-950/20 border border-cyan-100 dark:border-cyan-900/30 space-y-1.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-700 dark:text-cyan-400 flex items-center gap-1.5">
                    <span>📐</span> 4. Why It Has That Complexity
                  </h3>
                  <p className="text-xs sm:text-sm text-cyan-950 dark:text-cyan-200 leading-relaxed">
                    {selectedLesson.whyItHasThatComplexity}
                  </p>
                </div>

                {/* Where it is commonly seen */}
                {selectedLesson.whereCommonlySeen && selectedLesson.whereCommonlySeen.length > 0 && (
                  <div className="space-y-2.5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                      <span>🌐</span> Where You Will See It
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {selectedLesson.whereCommonlySeen.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl bg-gray-50 dark:bg-[#0c101c] border border-gray-200/80 dark:border-gray-800 text-xs text-gray-700 dark:text-gray-300 font-medium flex items-center gap-2"
                        >
                          <span className="text-indigo-500 font-bold">▸</span>
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Practical tip */}
                {selectedLesson.interviewTip && (
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50/70 via-teal-50/40 to-white dark:from-emerald-950/20 dark:via-teal-950/10 dark:to-[#111726] border border-emerald-200/60 dark:border-emerald-800/40 space-y-1">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                      <span>🎯</span> Practical Tip
                    </h3>
                    <p className="text-xs sm:text-sm text-emerald-950 dark:text-emerald-200 leading-relaxed font-medium">
                      {selectedLesson.interviewTip}
                    </p>
                  </div>
                )}

                {/* Key Takeaways */}
                <div className="space-y-2.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Remember This
                  </h3>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {selectedLesson.keyTakeaways.map((item, idx) => (
                      <li
                        key={idx}
                        className="p-3 rounded-xl bg-gray-50 dark:bg-[#0c101c] border border-gray-200/80 dark:border-gray-800 text-gray-700 dark:text-gray-300 font-medium flex items-center gap-2"
                      >
                        <span className="text-emerald-500 font-bold">✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Interactive Quiz */}
                <div className="pt-6 border-t border-gray-100 dark:border-gray-800/80 space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-black text-gray-900 dark:text-white">
                        Check Your Understanding
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        This is just for practice. Submit to see the correct answers and explanations.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {selectedLesson.quiz.map((q, qIndex) => {
                      const selectedOpt = quizAnswers[q.id];
                      return (
                        <div
                          key={q.id}
                          className="p-5 rounded-2xl bg-gray-50 dark:bg-[#0c101c] border border-gray-200 dark:border-gray-800 space-y-3"
                        >
                          <p className="text-sm font-bold text-gray-900 dark:text-white">
                            {qIndex + 1}. {q.question}
                          </p>

                          <div className="space-y-2">
                            {q.options.map((opt, optIndex) => {
                              let optStyles =
                                'bg-white dark:bg-[#111726] border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-indigo-500/50';

                              if (selectedOpt === optIndex) {
                                optStyles =
                                  'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-500 text-indigo-600 dark:text-indigo-400 font-semibold';
                              }

                              if (quizSubmitted) {
                                if (optIndex === q.correctIndex) {
                                  optStyles =
                                    'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold';
                                } else if (selectedOpt === optIndex && optIndex !== q.correctIndex) {
                                  optStyles =
                                    'bg-red-500/10 border-red-500 text-red-600 dark:text-red-400 font-bold';
                                }
                              }

                              return (
                                <button
                                  key={optIndex}
                                  type="button"
                                  onClick={() => handleSelectOption(q.id, optIndex)}
                                  disabled={quizSubmitted}
                                  className={`w-full text-left px-4 py-2.5 rounded-xl border text-xs transition-all flex items-center justify-between ${optStyles}`}
                                >
                                  <span>{opt}</span>
                                  {quizSubmitted && optIndex === q.correctIndex && (
                                    <span className="text-emerald-500 font-bold">✓ Correct</span>
                                  )}
                                </button>
                              );
                            })}
                          </div>

                          {quizSubmitted && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 pt-1 leading-relaxed">
                              📖 <span className="font-semibold text-gray-700 dark:text-gray-300">Explanation:</span>{' '}
                              {q.explanation}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <Button
                      variant="primary"
                      onClick={handleSubmitQuiz}
                      disabled={quizSubmitted}
                      className="font-bold shadow-md"
                    >
                      {quizSubmitted ? 'Answers Shown' : 'Show Answers'}
                    </Button>

                    {quizSubmitted && (
                      <button
                        type="button"
                        onClick={() => {
                          setQuizSubmitted(false);
                          setQuizAnswers({});
                        }}
                        className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                      >
                        Retake Quiz ↺
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center rounded-3xl bg-white dark:bg-[#111726] border border-gray-200 dark:border-gray-800">
                <p className="text-gray-500">Select a lesson to begin learning.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default Learn;
