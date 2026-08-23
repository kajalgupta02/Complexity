import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { INTERVIEW_PROBLEMS } from '@/data/interviewProblems';

export const Interview: React.FC = () => {
  const { analysisHistory } = useAuth();

  // Calculate progress
  const attemptedProblemIds = new Set(
    analysisHistory
      .filter((h) => h.linkedProblemId)
      .map((h) => h.linkedProblemId as string)
  );

  const blind75 = INTERVIEW_PROBLEMS.filter(p => p.list === 'Blind 75');
  const neetcode150 = INTERVIEW_PROBLEMS.filter(p => p.list === 'NeetCode 150');

  const blind75Attempted = blind75.filter(p => attemptedProblemIds.has(p.id)).length;
  const neetcode150Attempted = neetcode150.filter(p => attemptedProblemIds.has(p.id)).length;

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#090d16] py-10 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="mb-8">
          <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
            <span>🎯</span> Interview Tracker
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Track your progress through popular interview problem lists by analyzing your solutions.
          </p>
        </header>

        {/* Progress Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 bg-white dark:bg-[#111726] rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm">
            <h2 className="text-xl font-bold mb-4">Blind 75 Progress</h2>
            <div className="flex justify-between text-sm font-semibold mb-2">
              <span>{blind75Attempted} Attempted</span>
              <span>{blind75.length} Total</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-3">
              <div
                className="bg-indigo-500 h-3 rounded-full transition-all"
                style={{ width: `${Math.max(2, (blind75Attempted / Math.max(1, blind75.length)) * 100)}%` }}
              ></div>
            </div>
          </div>

          <div className="p-6 bg-white dark:bg-[#111726] rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm">
            <h2 className="text-xl font-bold mb-4">NeetCode 150 Progress</h2>
            <div className="flex justify-between text-sm font-semibold mb-2">
              <span>{neetcode150Attempted} Attempted</span>
              <span>{neetcode150.length} Total</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-3">
              <div
                className="bg-emerald-500 h-3 rounded-full transition-all"
                style={{ width: `${Math.max(2, (neetcode150Attempted / Math.max(1, neetcode150.length)) * 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Problem List */}
        <div className="bg-white dark:bg-[#111726] rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-800">
            <h2 className="text-lg font-bold">Problems</h2>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800/60">
            {INTERVIEW_PROBLEMS.map(problem => {
              const isAttempted = attemptedProblemIds.has(problem.id);
              // Find the best analysis for this problem
              const analyses = analysisHistory.filter(h => h.linkedProblemId === problem.id);
              const isOptimal = analyses.some(h => h.timeComplexity === problem.expectedTime);

              return (
                <div key={problem.id} className="p-4 sm:p-6 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${
                        problem.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-600' :
                        problem.difficulty === 'Medium' ? 'bg-amber-500/10 text-amber-600' :
                        'bg-red-500/10 text-red-600'
                      }`}>
                        {problem.difficulty}
                      </span>
                      <span className="text-xs font-semibold text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-md">
                        {problem.category}
                      </span>
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-white">
                      {problem.title}
                    </h3>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs font-mono text-gray-500 mb-0.5">Expected</p>
                      <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{problem.expectedTime}</p>
                    </div>
                    <div className="w-px h-8 bg-gray-200 dark:bg-gray-700"></div>
                    <div className="w-28 text-center">
                      {isOptimal ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-lg">
                          <span>✓</span> Optimal
                        </span>
                      ) : isAttempted ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-2 py-1 rounded-lg">
                          <span>⚠</span> Attempted
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-400 dark:text-gray-500">
                          Not Attempted
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Interview;
