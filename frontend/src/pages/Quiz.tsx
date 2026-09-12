import React from 'react';
import DailyQuiz from '@/components/DailyQuiz';
import { SEO } from '@/components/SEO';

const Quiz: React.FC = () => {
  return (
    <div className="page-shell text-text-primary dark:text-text-primary-dark transition-colors">
      <SEO
        title="Complexity Quiz"
        description="Test your understanding of time and space complexity with a focused Big-O quiz."
        canonical="/quiz"
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6">
        <div className="flex items-center justify-between gap-4 px-1">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-gray-900 dark:text-white">
              Complexity Quiz
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Time and space complexity assessment
            </p>
          </div>
          <span className="hidden sm:inline-flex items-center rounded-full border border-gray-200 dark:border-gray-700 px-3 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400">
            5 questions
          </span>
        </div>

        <DailyQuiz />
      </div>
    </div>
  );
};

export default Quiz;