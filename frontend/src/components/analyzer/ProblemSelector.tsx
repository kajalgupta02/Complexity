import React from 'react';
import { INTERVIEW_PROBLEMS, type InterviewProblem } from '@/data/interviewProblems';

interface ProblemSelectorProps {
  selectedProblemId: string | null;
  onSelect: (problem: InterviewProblem | null) => void;
}

export const ProblemSelector: React.FC<ProblemSelectorProps> = ({ selectedProblemId, onSelect }) => {
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="problem-select" className="text-xs font-semibold text-gray-500 dark:text-gray-400 hidden sm:inline">
        Link Problem:
      </label>
      <select
        id="problem-select"
        value={selectedProblemId || ''}
        onChange={(e) => {
          const val = e.target.value;
          if (!val) {
            onSelect(null);
          } else {
            const prob = INTERVIEW_PROBLEMS.find((p) => p.id === val);
            onSelect(prob || null);
          }
        }}
        className="px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer max-w-[200px] truncate"
      >
        <option value="">None (Freeplay)</option>
        {INTERVIEW_PROBLEMS.map((p) => (
          <option key={p.id} value={p.id}>
            [{p.list}] {p.title}
          </option>
        ))}
      </select>
    </div>
  );
};
