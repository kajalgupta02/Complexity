import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { INTERVIEW_PROBLEMS, type InterviewProblem } from '@/data/interviewProblems';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { SEO } from '@/components/SEO';

export const Interview: React.FC = () => {
  const navigate = useNavigate();
  const { analysisHistory } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedList, setSelectedList] = useState<'All' | 'Blind 75' | 'NeetCode 150'>('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'All' | 'Easy' | 'Medium' | 'Hard'>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<'All' | 'Optimal' | 'Attempted' | 'Unattempted'>('All');

  // Attempted & Optimal Sets
  const attemptedMap = useMemo(() => {
    const map = new Map<string, { attempts: number; isOptimal: boolean }>();
    INTERVIEW_PROBLEMS.forEach((prob) => {
      const analyses = analysisHistory.filter((h) => h.linkedProblemId === prob.id);
      if (analyses.length > 0) {
        const isOptimal = analyses.some(
          (h) => h.timeComplexity.trim().toLowerCase() === prob.expectedTime.trim().toLowerCase()
        );
        map.set(prob.id, { attempts: analyses.length, isOptimal });
      }
    });
    return map;
  }, [analysisHistory]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    INTERVIEW_PROBLEMS.forEach((p) => set.add(p.category));
    return ['All', ...Array.from(set).sort()];
  }, []);

  // Filtered problems
  const filteredProblems = useMemo(() => {
    return INTERVIEW_PROBLEMS.filter((prob) => {
      // List filter
      if (selectedList !== 'All' && prob.list !== selectedList) return false;
      // Difficulty filter
      if (selectedDifficulty !== 'All' && prob.difficulty !== selectedDifficulty) return false;
      // Category filter
      if (selectedCategory !== 'All' && prob.category !== selectedCategory) return false;
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          prob.title.toLowerCase().includes(q) ||
          prob.category.toLowerCase().includes(q) ||
          prob.expectedTime.toLowerCase().includes(q);
        if (!matches) return false;
      }
      // Status filter
      if (selectedStatus !== 'All') {
        const state = attemptedMap.get(prob.id);
        if (selectedStatus === 'Optimal' && !state?.isOptimal) return false;
        if (selectedStatus === 'Attempted' && (!state || state.isOptimal)) return false;
        if (selectedStatus === 'Unattempted' && state) return false;
      }
      return true;
    });
  }, [selectedList, selectedDifficulty, selectedCategory, searchQuery, selectedStatus, attemptedMap]);

  // Overall Statistics
  const blind75 = INTERVIEW_PROBLEMS.filter((p) => p.list === 'Blind 75');
  const neetcode150 = INTERVIEW_PROBLEMS.filter((p) => p.list === 'NeetCode 150');

  const blind75Optimal = blind75.filter((p) => attemptedMap.get(p.id)?.isOptimal).length;
  const neetcode150Optimal = neetcode150.filter((p) => attemptedMap.get(p.id)?.isOptimal).length;

  const totalOptimal = Array.from(attemptedMap.values()).filter((v) => v.isOptimal).length;
  const totalAttempted = attemptedMap.size;

  const handleSolveInAnalyzer = (problem: InterviewProblem) => {
    navigate(`/analyzer?problem=${problem.id}`);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#090d16] text-gray-900 dark:text-gray-100 transition-colors py-10 px-4 sm:px-6">
      <SEO
        title="Coding Interview Problem Tracker (Blind 75 & NeetCode 150)"
        description="Track your algorithmic solutions and Big-O efficiency for Blind 75 and NeetCode 150 interview problems. Verify optimal time and space complexity."
        canonical="/interview"
      />

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Page Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold mb-2">
              <span>🎯 Real-World Interview Preparation</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">
              Interview Problem Tracker
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Verify your solutions against theoretical optimal Big-O bounds for the most common FAANG coding questions.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/analyzer')}
              className="font-bold shadow-md shadow-indigo-500/20"
            >
              ⚡ Open Analyzer
            </Button>
          </div>
        </header>

        {/* Progress Cards Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Total Optimal */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#111726] border border-gray-200 dark:border-gray-800 shadow-sm space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Optimal Solutions
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-gray-900 dark:text-white">{totalOptimal}</span>
              <span className="text-xs text-gray-500 font-semibold">/ {INTERVIEW_PROBLEMS.length} total</span>
            </div>
            <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2 mt-2">
              <div
                className="bg-emerald-500 h-2 rounded-full transition-all"
                style={{ width: `${Math.max(2, (totalOptimal / INTERVIEW_PROBLEMS.length) * 100)}%` }}
              />
            </div>
          </div>

          {/* Card 2: Attempted Problems */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#111726] border border-gray-200 dark:border-gray-800 shadow-sm space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Total Attempted
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-gray-900 dark:text-white">{totalAttempted}</span>
              <span className="text-xs text-gray-500 font-semibold">/ {INTERVIEW_PROBLEMS.length} total</span>
            </div>
            <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2 mt-2">
              <div
                className="bg-indigo-500 h-2 rounded-full transition-all"
                style={{ width: `${Math.max(2, (totalAttempted / INTERVIEW_PROBLEMS.length) * 100)}%` }}
              />
            </div>
          </div>

          {/* Card 3: Blind 75 */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#111726] border border-gray-200 dark:border-gray-800 shadow-sm space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Blind 75 Mastered
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-gray-900 dark:text-white">{blind75Optimal}</span>
              <span className="text-xs text-gray-500 font-semibold">/ {blind75.length} problems</span>
            </div>
            <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2 mt-2">
              <div
                className="bg-indigo-500 h-2 rounded-full transition-all"
                style={{ width: `${Math.max(2, (blind75Optimal / Math.max(1, blind75.length)) * 100)}%` }}
              />
            </div>
          </div>

          {/* Card 4: NeetCode 150 */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#111726] border border-gray-200 dark:border-gray-800 shadow-sm space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
              NeetCode 150 Mastered
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-gray-900 dark:text-white">{neetcode150Optimal}</span>
              <span className="text-xs text-gray-500 font-semibold">/ {neetcode150.length} problems</span>
            </div>
            <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2 mt-2">
              <div
                className="bg-cyan-500 h-2 rounded-full transition-all"
                style={{ width: `${Math.max(2, (neetcode150Optimal / Math.max(1, neetcode150.length)) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#111726] border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {/* Search input */}
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search problem title, pattern, or complexity (e.g. Two Sum, O(n), Hash Map)..."
                aria-label="Search problems"
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-gray-50 dark:bg-[#090d16] border border-gray-200 dark:border-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <span className="absolute left-3.5 top-3 text-gray-400">🔍</span>
            </div>

            {/* List selector pill tabs */}
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-gray-100 dark:bg-[#090d16] border border-gray-200/80 dark:border-gray-800 self-start md:self-auto overflow-x-auto">
              {(['All', 'Blind 75', 'NeetCode 150'] as const).map((list) => (
                <button
                  key={list}
                  onClick={() => setSelectedList(list)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
                    selectedList === list
                      ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {list}
                </button>
              ))}
            </div>
          </div>

          {/* Sub Filters: Difficulty, Category, Status */}
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-100 dark:border-gray-800/80 text-xs">
            {/* Category Dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="text-gray-400 font-medium">Category:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                aria-label="Filter by category"
                className="bg-gray-50 dark:bg-[#090d16] border border-gray-200 dark:border-gray-800 rounded-xl px-2.5 py-1 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Difficulty Dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="text-gray-400 font-medium">Difficulty:</span>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value as any)}
                aria-label="Filter by difficulty"
                className="bg-gray-50 dark:bg-[#090d16] border border-gray-200 dark:border-gray-800 rounded-xl px-2.5 py-1 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="All">All Difficulties</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>

            {/* Status Dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="text-gray-400 font-medium">Status:</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as any)}
                aria-label="Filter by status"
                className="bg-gray-50 dark:bg-[#090d16] border border-gray-200 dark:border-gray-800 rounded-xl px-2.5 py-1 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="All">All Statuses</option>
                <option value="Optimal">Optimal Only</option>
                <option value="Attempted">Attempted (Suboptimal)</option>
                <option value="Unattempted">Not Attempted</option>
              </select>
            </div>

            <span className="ml-auto text-gray-400 font-mono text-[11px]">
              Showing {filteredProblems.length} of {INTERVIEW_PROBLEMS.length} problems
            </span>
          </div>
        </div>

        {/* Problems List / Table */}
        <div className="bg-white dark:bg-[#111726] rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden divide-y divide-gray-100 dark:divide-gray-800/80">
          {filteredProblems.length > 0 ? (
            filteredProblems.map((prob) => {
              const state = attemptedMap.get(prob.id);
              const isOptimal = state?.isOptimal;
              const isAttempted = !!state;

              return (
                <div
                  key={prob.id}
                  className="p-5 sm:p-6 hover:bg-gray-50/80 dark:hover:bg-gray-850/40 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant={
                          prob.difficulty === 'Easy'
                            ? 'success'
                            : prob.difficulty === 'Medium'
                            ? 'warning'
                            : 'danger'
                        }
                        size="xs"
                      >
                        {prob.difficulty}
                      </Badge>
                      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800/80 px-2 py-0.5 rounded-md">
                        {prob.category}
                      </span>
                      <span className="text-[11px] font-mono text-indigo-500 dark:text-indigo-400 font-bold">
                        {prob.list}
                      </span>
                    </div>

                    <h2 className="text-base font-bold text-gray-900 dark:text-white leading-tight">
                      {prob.title}
                    </h2>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 sm:gap-6 self-start md:self-auto">
                    {/* Expected Complexities */}
                    <div className="text-right">
                      <p className="text-[10px] uppercase font-bold text-gray-400">Expected Time · Space</p>
                      <p className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {prob.expectedTime} · {prob.expectedSpace}
                      </p>
                    </div>

                    <div className="w-px h-8 bg-gray-200 dark:bg-gray-800 hidden sm:block" />

                    {/* Status Badge */}
                    <div className="w-28 text-center">
                      {isOptimal ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-xl">
                          ✓ Optimal
                        </span>
                      ) : isAttempted ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-xl">
                          ⚠ Attempted
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-xs font-medium text-gray-400 dark:text-gray-500 px-2.5 py-1">
                          Not Solved
                        </span>
                      )}
                    </div>

                    {/* Action button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSolveInAnalyzer(prob)}
                      className="text-xs font-bold"
                    >
                      <span>⚡ Solve</span>
                    </Button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-12 text-center text-gray-500 space-y-2">
              <p className="text-base font-bold">No problems found matching your filters.</p>
              <p className="text-xs">Try searching for a different keyword or resetting your filters.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Interview;
