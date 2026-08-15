import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { LEARNING_LESSONS, BADGES } from '@/data/learningCurriculum';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'saved';

  const {
    user,
    isAuthenticated,
    savedAnalyses,
    analysisHistory,
    learningProgress,
    deleteSavedAnalysis,
    toggleFavorite,
    loginAsGuest,
  } = useAuth();

  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<'saved' | 'mastery' | 'history'>(
    initialTab === 'history' ? 'history' : initialTab === 'mastery' ? 'mastery' : 'saved'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [langFilter, setLangFilter] = useState('All');
  const [complexityFilter, setComplexityFilter] = useState('All');

  const handleOpenSnippet = (code: string, language: string) => {
    // Navigate to Analyzer and pass the code and language
    navigate(`/analyzer?code=${encodeURIComponent(code)}&lang=${language}`);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    addToast('success', 'Code copied to clipboard!');
  };

  const handleDelete = (id: string, title: string) => {
    deleteSavedAnalysis(id);
    addToast('info', `Removed "${title}" from saved library.`);
  };

  // Filter saved snippets
  const filteredSaved = savedAnalyses.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesLang = langFilter === 'All' || item.language === langFilter.toLowerCase();
    const matchesComplexity =
      complexityFilter === 'All' || item.timeComplexity === complexityFilter;

    return matchesSearch && matchesLang && matchesComplexity;
  });

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#090d16] text-gray-900 dark:text-gray-100 transition-colors py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
        {/* User Profile Card */}
        <div className="rounded-3xl bg-white dark:bg-[#111726] border border-gray-200 dark:border-gray-800 p-6 sm:p-8 shadow-sm">
          {isAuthenticated && user ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-500/30 bg-indigo-100 dark:bg-indigo-950 shadow-md"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white">
                      {user.name}
                    </h1>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">
                      {user.plan} Tier
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {user.email} • Joined {user.joinedDate}
                  </p>
                  <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mt-1">
                    {user.role}
                  </p>
                </div>
              </div>

              {/* Badges / Stats counter */}
              <div className="flex items-center gap-3 bg-gray-50 dark:bg-[#0c101c] p-3 rounded-2xl border border-gray-200 dark:border-gray-800">
                <div className="text-center px-3">
                  <p className="text-[11px] font-bold text-gray-500">Level</p>
                  <p className="text-lg font-black text-indigo-600 dark:text-indigo-400">
                    Lvl {user.level}
                  </p>
                </div>
                <div className="w-px h-7 bg-gray-200 dark:bg-gray-800" />
                <div className="text-center px-3">
                  <p className="text-[11px] font-bold text-gray-500">Total XP</p>
                  <p className="text-lg font-black text-indigo-600 dark:text-indigo-400">
                    ⚡ {learningProgress.totalXp}
                  </p>
                </div>
                <div className="w-px h-7 bg-gray-200 dark:bg-gray-800" />
                <div className="text-center px-3">
                  <p className="text-[11px] font-bold text-gray-500">Streak</p>
                  <p className="text-lg font-black text-amber-500">
                    🔥 {learningProgress.streakDays}d
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
              <div className="space-y-1">
                <h1 className="text-2xl font-black text-gray-900 dark:text-white">
                  Developer Dashboard & Storage
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  You are currently exploring as a guest. Try demo mode to view pre-saved snippets and learning telemetry.
                </p>
              </div>
              <Button
                variant="primary"
                onClick={loginAsGuest}
                className="font-bold shadow-md shrink-0"
              >
                <span>⚡ Load Demo Engineer Profile</span>
              </Button>
            </div>
          )}
        </div>

        {/* Dashboard Tabs Header */}
        <div className="flex border-b border-gray-200 dark:border-gray-800">
          <button
            onClick={() => setActiveTab('saved')}
            className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'saved'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <span>📁 Saved Code Snippets</span>
            <span className="px-2 py-0.5 rounded-full text-xs bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              {savedAnalyses.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('mastery')}
            className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'mastery'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <span>🏆 Learning Mastery & Badges</span>
            <span className="px-2 py-0.5 rounded-full text-xs bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              {learningProgress.earnedBadgeIds.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'history'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <span>⏱ Recent History</span>
            <span className="px-2 py-0.5 rounded-full text-xs bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
              {analysisHistory.length}
            </span>
          </button>
        </div>

        {/* TAB 1: SAVED ANALYSES */}
        {activeTab === 'saved' && (
          <div className="space-y-6">
            {/* Filter Bar */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="w-full md:w-80">
                <input
                  type="text"
                  placeholder="Search saved snippets by title, tag, or code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-white dark:bg-[#111726] border border-gray-200 dark:border-gray-800 text-xs sm:text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                <select
                  value={langFilter}
                  onChange={(e) => setLangFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-white dark:bg-[#111726] border border-gray-200 dark:border-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-300 focus:outline-none"
                >
                  <option value="All">All Languages</option>
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                  <option value="java">Java</option>
                  <option value="cpp">C++</option>
                </select>

                <select
                  value={complexityFilter}
                  onChange={(e) => setComplexityFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-white dark:bg-[#111726] border border-gray-200 dark:border-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-300 focus:outline-none"
                >
                  <option value="All">All Complexities</option>
                  <option value="O(1)">O(1)</option>
                  <option value="O(log n)">O(log n)</option>
                  <option value="O(n)">O(n)</option>
                  <option value="O(n log n)">O(n log n)</option>
                  <option value="O(n²)">O(n²)</option>
                  <option value="O(2ⁿ)">O(2ⁿ)</option>
                </select>

                <Button variant="primary" size="sm" asChild className="font-bold shadow-sm">
                  <Link to="/analyzer">+ Analyze New Snippet</Link>
                </Button>
              </div>
            </div>

            {/* Saved Cards Grid */}
            {filteredSaved.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSaved.map((item) => (
                  <div
                    key={item.id}
                    className="p-5 rounded-3xl bg-white dark:bg-[#111726] border border-gray-200 dark:border-gray-800 hover:border-indigo-500/50 shadow-sm flex flex-col justify-between space-y-4 transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                          {item.language}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => toggleFavorite(item.id)}
                            className={`text-sm p-1 hover:scale-110 transition-transform ${
                              item.isFavorite ? 'text-amber-500' : 'text-gray-300 dark:text-gray-600'
                            }`}
                            title={item.isFavorite ? 'Remove favorite' : 'Add to favorites'}
                          >
                            ★
                          </button>
                          <button
                            onClick={() => handleDelete(item.id, item.title)}
                            className="text-xs text-gray-400 hover:text-red-500 p-1 transition-colors"
                            title="Delete snippet"
                          >
                            ✕
                          </button>
                        </div>
                      </div>

                      <h3 className="text-base font-bold text-gray-900 dark:text-white leading-snug">
                        {item.title}
                      </h3>

                      <div className="flex items-center gap-2 mt-2">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                          {item.timeComplexity} Time
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                          {item.spaceComplexity} Space
                        </span>
                      </div>

                      {/* Code preview block */}
                      <div className="mt-3 p-3 rounded-xl bg-gray-900 text-gray-100 font-mono text-[11px] max-h-28 overflow-hidden relative">
                        <pre className="text-emerald-400 font-mono">{item.code}</pre>
                        <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-gray-900 to-transparent pointer-events-none" />
                      </div>

                      {item.notes && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 italic line-clamp-2">
                          📝 {item.notes}
                        </p>
                      )}

                      {/* Tags */}
                      {item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {item.tags.map((tag, tIdx) => (
                            <span
                              key={tIdx}
                              className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="pt-3 border-t border-gray-100 dark:border-gray-800/80 flex items-center justify-between">
                      <button
                        onClick={() => handleCopyCode(item.code)}
                        className="text-xs text-gray-500 hover:text-gray-900 dark:hover:text-white font-medium"
                      >
                        📋 Copy Code
                      </button>
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => handleOpenSnippet(item.code, item.language)}
                        className="font-bold text-indigo-600 dark:text-indigo-400"
                      >
                        Open in Analyzer →
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center rounded-3xl bg-white dark:bg-[#111726] border border-gray-200 dark:border-gray-800 space-y-3">
                <p className="text-base font-bold text-gray-700 dark:text-gray-300">
                  No saved code snippets match your filter.
                </p>
                <p className="text-xs text-gray-500">
                  Save snippets directly from the live analyzer to build your algorithmic portfolio.
                </p>
                <Button variant="primary" asChild className="mt-2">
                  <Link to="/analyzer">Go to Live Analyzer</Link>
                </Button>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: LEARNING MASTERY & BADGES */}
        {activeTab === 'mastery' && (
          <div className="space-y-8">
            {/* Badges Grid */}
            <div className="rounded-3xl bg-white dark:bg-[#111726] border border-gray-200 dark:border-gray-800 p-6 sm:p-8 space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Earned Achievement Badges
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Complete quizzes and optimize algorithms to unlock special engineering credentials.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {BADGES.map((b) => {
                  const unlocked = learningProgress.earnedBadgeIds.includes(b.id);
                  return (
                    <div
                      key={b.id}
                      className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                        unlocked
                          ? 'border-indigo-500/40 bg-indigo-500/10 shadow-sm'
                          : 'border-gray-200 dark:border-gray-800 opacity-40 grayscale'
                      }`}
                    >
                      <div>
                        <span className="text-3xl mb-2 block">{b.icon}</span>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                          {b.name}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                          {b.description}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-gray-200/60 dark:border-gray-800/80">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider ${
                            unlocked
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-gray-400'
                          }`}
                        >
                          {unlocked ? '✓ Unlocked' : '🔒 Locked'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Completed Lessons Checklist */}
            <div className="rounded-3xl bg-white dark:bg-[#111726] border border-gray-200 dark:border-gray-800 p-6 sm:p-8 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Completed Learning Modules
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Your interactive course track and quiz scores.
                  </p>
                </div>
                <Button variant="secondary" size="sm" asChild>
                  <Link to="/learn">Go to Learning Hub</Link>
                </Button>
              </div>

              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {LEARNING_LESSONS.map((lesson) => {
                  const isDone = learningProgress.completedLessonIds.includes(lesson.id);
                  const score = learningProgress.quizScores[lesson.id];
                  return (
                    <div
                      key={lesson.id}
                      className="py-3.5 flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            isDone
                              ? 'bg-emerald-500 text-white'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                          }`}
                        >
                          {isDone ? '✓' : '•'}
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {lesson.title}
                          </p>
                          <span className="text-[10px] text-gray-500 font-mono">
                            {lesson.complexity}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {isDone && score !== undefined && (
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                            Score: {score}%
                          </span>
                        )}
                        <Button variant="ghost" size="xs" asChild>
                          <Link to="/learn">Review</Link>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: RECENT ANALYSIS HISTORY */}
        {activeTab === 'history' && (
          <div className="rounded-3xl bg-white dark:bg-[#111726] border border-gray-200 dark:border-gray-800 p-6 sm:p-8 space-y-6 shadow-sm">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Recent Analysis Logs
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Automatically stored history of algorithms analyzed on this machine.
              </p>
            </div>

            {analysisHistory.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="border-b border-gray-200 dark:border-gray-800 text-gray-500 text-[11px] uppercase font-bold">
                    <tr>
                      <th className="py-3 px-4">Snippet Summary</th>
                      <th className="py-3 px-4">Language</th>
                      <th className="py-3 px-4">Time Complexity</th>
                      <th className="py-3 px-4">Space Complexity</th>
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800/80">
                    {analysisHistory.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                        <td className="py-3 px-4 font-mono font-medium text-gray-900 dark:text-white">
                          {item.summary}
                        </td>
                        <td className="py-3 px-4 capitalize text-gray-500">{item.language}</td>
                        <td className="py-3 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                          {item.timeComplexity}
                        </td>
                        <td className="py-3 px-4 font-mono text-cyan-600 dark:text-cyan-400">
                          {item.spaceComplexity}
                        </td>
                        <td className="py-3 px-4 text-xs text-gray-400">
                          {new Date(item.timestamp).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => handleOpenSnippet(item.code, item.language)}
                            className="font-bold text-indigo-600 dark:text-indigo-400"
                          >
                            Re-analyze
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500 text-xs">
                No recent analyses logged yet. Run code in the Live Analyzer to populate this log.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
export default Dashboard;
