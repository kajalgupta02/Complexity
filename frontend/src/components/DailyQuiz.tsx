import { useState, useMemo } from 'react';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { useToast } from './ui/Toast';
import { useAuth } from '@/context/AuthContext';
import type { QuizQuestion } from '@/types/auth';

const QUIZ_BANK: QuizQuestion[] = [
  {
    id: 'q-o1',
    question: 'What is the time complexity of a single hash map lookup (average case)?',
    options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'],
    correctIndex: 0,
    explanation: 'Hash maps use hashing + array indexing for lookups. Average case is constant O(1). Worst case with many collisions degrades to O(n), but this is rare with a good hash function.',
  },
  {
    id: 'q-log',
    question: 'A loop where i doubles each iteration (`for (let i = 1; i < n; i *= 2)`) has what complexity?',
    options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
    correctIndex: 1,
    explanation: 'The loop iterates log₂(n) times, since each step doubles the counter. This is the classic logarithmic pattern — binary search uses identical logic.',
  },
  {
    id: 'q-n2',
    question: 'What is the time complexity of two nested loops each iterating 0..n-1 with no early exit?',
    options: ['O(n)', 'O(n log n)', 'O(n²)', 'O(2ⁿ)'],
    correctIndex: 2,
    explanation: 'n iterations × n iterations = n² total iterations. This is the canonical quadratic complexity pattern (e.g. bubble sort, naive two-sum).',
  },
  {
    id: 'q-space-arr',
    question: 'Given `const dp = new Array(n).fill(0)`, what auxiliary space complexity does this introduce?',
    options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'],
    correctIndex: 2,
    explanation: 'We allocate a new linear array of exactly n elements. The space grows proportionally with n, so it is O(n) auxiliary.',
  },
  {
    id: 'q-recursive-fib',
    question: 'Naive recursive Fibonacci (`fib(n) = fib(n-1) + fib(n-2)`) has which complexity?',
    options: ['O(n)', 'O(n log n)', 'O(n²)', 'O(2ⁿ)'],
    correctIndex: 3,
    explanation: 'Each call spawns two more calls, forming a binary recursion tree of depth n. Total calls ≈ 2ⁿ. Memoized DP version drops this to O(n) time + O(n) space.',
  },
  {
    id: 'q-msort',
    question: 'What is the time & space complexity of Merge Sort?',
    options: [
      'Time: O(n log n) · Space: O(n)',
      'Time: O(n log n) · Space: O(1)',
      'Time: O(n²) · Space: O(n)',
      'Time: O(n) · Space: O(n log n)',
    ],
    correctIndex: 0,
    explanation: 'Merge Sort repeatedly splits the array in half (log n levels) and merges at each level in O(n), giving O(n log n). Because merge uses auxiliary arrays, space is O(n).',
  },
  {
    id: 'q-binary',
    question: 'Binary search on a 1,000,000 element sorted array requires roughly how many comparisons?',
    options: ['~10', '~20', '~100', '~1,000,000'],
    correctIndex: 1,
    explanation: 'log₂(1,000,000) ≈ 20. Binary search halves the search space each step — this is why O(log n) is effectively constant even for huge inputs.',
  },
  {
    id: 'q-bst',
    question: 'What is the WORST-case time complexity of searching a regular Binary Search Tree (not balanced)?',
    options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
    correctIndex: 2,
    explanation: 'If items were inserted in sorted order, a BST degenerates into a linked list, requiring O(n) traversal to find an element. Balanced BSTs (AVL / Red-Black) guarantee O(log n) by rebalancing.',
  },
  {
    id: 'q-indexof',
    question: '`.indexOf()` called inside a `for` loop over a JS array is equivalent to which nested pattern?',
    options: ['Two pointers (O(n))', 'Nested loops (O(n²))', 'Sliding window (O(n))', 'Hash lookup (O(1) avg)'],
    correctIndex: 1,
    explanation: '`.indexOf()` itself is a linear scan O(n) nested inside the outer loop. This is the #1 sneaky O(n²) trap in interviews — replace inner lookups with a Set/Map.',
  },
  {
    id: 'q-sort-limit',
    question: 'Your solution runs in O(n²) and gets a Time Limit Exceeded for n=100,000. Which is the most realistic target improvement?',
    options: [
      'O(n) or O(n log n) using a hash map / sort',
      'O(1) by removing all loops',
      'O(2ⁿ) via brute force',
      'Optimizing the inner loop constants',
    ],
    correctIndex: 0,
    explanation: '100k² = 10 billion ops → impossible in browser time (~1s budget). Changing asymptotic complexity is the only fix. Drop inner loops using a Hash Map (→ O(n)) or pre-sort + two pointers (→ O(n log n)).',
  },
];

function useDailyQuiz(dateKey = new Date().toISOString().slice(0, 10)) {
  return useMemo(() => {
    const seeded = Array.from(QUIZ_BANK);
    let seed = 0;
    for (let i = 0; i < dateKey.length; i++) seed = (seed * 31 + dateKey.charCodeAt(i)) >>> 0;
    for (let i = seeded.length - 1; i > 0; i--) {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      const j = seed % (i + 1);
      [seeded[i], seeded[j]] = [seeded[j], seeded[i]];
    }
    return seeded.slice(0, 5);
  }, [dateKey]);
}

const STORAGE_KEY = 'daily-quiz-progress-v2';

export const DailyQuiz: React.FC = () => {
  const todayQuiz = useDailyQuiz();
  const { addToast } = useToast();
  const { addXp, isAuthenticated, user } = useAuth();
  const quizStorageKey = `${STORAGE_KEY}:${user?.id ?? 'anonymous'}`;

  const [current, setCurrent] = useState(0);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(() => {
    try {
      const saved = localStorage.getItem(quizStorageKey);
      if (!saved) return { answered: 0, correct: 0, finished: false, date: new Date().toISOString().slice(0, 10) };
      const parsed = JSON.parse(saved);
      return parsed.date === new Date().toISOString().slice(0, 10)
        ? parsed
        : { answered: 0, correct: 0, finished: false, date: new Date().toISOString().slice(0, 10) };
    } catch {
      return { answered: 0, correct: 0, finished: false, date: new Date().toISOString().slice(0, 10) };
    }
  });

  const persist = (next: typeof score) => {
    try { localStorage.setItem(quizStorageKey, JSON.stringify(next)); } catch { /* ignore */ }
    setScore(next);
  };

  const q = todayQuiz[current];

  const handleAnswer = (idx: number) => {
    if (revealed) return;
    setSelectedIdx(idx);
    setRevealed(true);
    const correct = idx === q.correctIndex;
    const next = {
      ...score,
      answered: score.answered + 1,
      correct: score.correct + (correct ? 1 : 0),
      date: new Date().toISOString().slice(0, 10),
    };
    if (correct && isAuthenticated) addXp(5);
    persist(next);
    if (correct) addToast('success', '+5 XP — correct answer!');
  };

  const nextQuestion = () => {
    if (current + 1 >= todayQuiz.length) {
      const finishedScore = { ...score, finished: true };
      persist(finishedScore);
      const pct = Math.round((finishedScore.correct / Math.max(1, finishedScore.answered)) * 100);
      if (pct >= 80 && isAuthenticated) {
        addXp(15);
        addToast('success', `🎉 Daily Mastery Bonus +15 XP! Score ${pct}%.`);
      } else {
        addToast('info', `Daily quiz done! ${finishedScore.correct}/${finishedScore.answered} (${pct}%)`);
      }
      setCurrent(todayQuiz.length);
    } else {
      setCurrent(current + 1);
      setSelectedIdx(null);
      setRevealed(false);
    }
  };

  const reset = () => {
    const fresh = { answered: 0, correct: 0, finished: false, date: new Date().toISOString().slice(0, 10) };
    persist(fresh);
    setCurrent(0);
    setSelectedIdx(null);
    setRevealed(false);
  };

  const percent = Math.round((score.correct / Math.max(1, score.answered)) * 100);
  const pctAll = Math.round((score.correct / todayQuiz.length) * 100);

  if (score.finished || current >= todayQuiz.length) {
    return (
      <div className="rounded-3xl bg-gradient-to-br from-indigo-500/10 via-white to-cyan-500/10 dark:from-indigo-950/30 dark:via-[#111726] dark:to-cyan-950/20 border border-indigo-200/60 dark:border-indigo-900/40 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-2 mb-2">
              <Badge variant="primary" size="sm">Today's Challenge</Badge>
              <Badge variant={pctAll >= 80 ? 'success' : pctAll >= 60 ? 'warning' : 'danger'} size="sm">
                Score {pctAll}%
              </Badge>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">
              Daily Quiz Complete!
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              You got <span className="font-bold text-indigo-600 dark:text-indigo-400">{score.correct}/{todayQuiz.length}</span> correct. Come back tomorrow for 5 fresh questions!
            </p>
          </div>
          <div className="flex flex-col items-center bg-white dark:bg-black/30 border border-gray-200 dark:border-gray-700/60 rounded-2xl p-4 min-w-[120px]">
            <p className="text-[10px] uppercase font-bold tracking-wider text-gray-500 mb-1">Accuracy</p>
            <p className="text-3xl font-black text-indigo-600 dark:text-indigo-400">{pctAll}%</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={reset}>🔁 Practice again</Button>
          <Button variant="primary" size="sm" onClick={() => (window.location.href = '/learn')}>📚 Open Lessons</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl bg-white dark:bg-[#111726] border border-gray-200 dark:border-gray-800 p-5 sm:p-7 shadow-sm space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="warning" size="sm">🔥 Daily Quiz</Badge>
            <span className="text-xs text-gray-500 dark:text-gray-400">Question {current + 1} of {todayQuiz.length}</span>
          </div>
          <h3 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white">
            {q.question}
          </h3>
        </div>
        <div className="flex items-center gap-3 text-xs font-semibold">
          <div className="px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-800/70 text-gray-700 dark:text-gray-300">
            Score: {score.correct}/{score.answered} ({percent}%)
          </div>
        </div>
      </div>

      <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-cyan-500 transition-all"
          style={{ width: `${((current) / todayQuiz.length) * 100}%` }}
        />
      </div>

      <div className="grid gap-2.5 sm:grid-cols-2">
        {q.options.map((opt, idx) => {
          const isCorrect = revealed && idx === q.correctIndex;
          const isWrong = revealed && selectedIdx === idx && idx !== q.correctIndex;
          return (
            <button
              key={idx}
              onClick={() => handleAnswer(idx)}
              disabled={revealed}
              className={[
                'text-left rounded-2xl px-4 py-3.5 border-2 text-sm font-medium transition-all',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60',
                revealed
                  ? (isCorrect
                      ? 'border-emerald-500/70 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300'
                      : isWrong
                      ? 'border-red-500/70 bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-300'
                      : 'border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 opacity-60')
                  : (selectedIdx === idx
                      ? 'border-indigo-500 bg-indigo-500/5 text-indigo-700 dark:text-indigo-300'
                      : 'border-gray-200 dark:border-gray-700/70 hover:border-indigo-400/60 hover:bg-indigo-50/40 dark:hover:bg-indigo-500/5 text-gray-800 dark:text-gray-200'),
              ].join(' ')}
            >
              <span className="inline-block w-7 h-7 mr-3 rounded-lg text-center leading-7 font-bold bg-white dark:bg-black/30 border border-gray-200 dark:border-gray-700/60 text-gray-700 dark:text-gray-300">
                {String.fromCharCode(65 + idx)}
              </span>
              {opt}
              {isCorrect && <span className="float-right font-bold">✓</span>}
              {isWrong && <span className="float-right font-bold">✗</span>}
            </button>
          );
        })}
      </div>

      {revealed && (
        <div className="rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/25 border border-indigo-200/60 dark:border-indigo-900/40 p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white font-bold flex-shrink-0">
              !
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-1">Why</p>
              <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
                {q.explanation}
              </p>
            </div>
          </div>
        </div>
      )}

      {revealed && (
        <div className="flex justify-end">
          <Button variant="primary" onClick={nextQuestion}>
            {current + 1 >= todayQuiz.length ? 'Finish Quiz →' : 'Next Question →'}
          </Button>
        </div>
      )}
    </div>
  );
};

export default DailyQuiz;
