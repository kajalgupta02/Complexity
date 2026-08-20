import { useState, useMemo } from 'react';
import { SAMPLES, COMPLEXITIES, LANGUAGES, type Sample } from '@/data/samples';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface SampleGalleryProps {
  open: boolean;
  onClose: () => void;
  onSelect: (sample: Sample) => void;
}

export default function SampleGallery({ open, onClose, onSelect }: SampleGalleryProps) {
  const [search, setSearch] = useState('');
  const [complexityFilter, setComplexityFilter] = useState('All');
  const [languageFilter, setLanguageFilter] = useState('all');

  const filteredSamples = useMemo(() => {
    return SAMPLES.filter((sample) => {
      const matchesSearch =
        sample.title.toLowerCase().includes(search.toLowerCase()) ||
        sample.description.toLowerCase().includes(search.toLowerCase()) ||
        sample.complexity.toLowerCase().includes(search.toLowerCase());
      const matchesComplexity = complexityFilter === 'All' || sample.complexity === complexityFilter;
      const matchesLanguage = languageFilter === 'all' || sample.language === languageFilter;
      return matchesSearch && matchesComplexity && matchesLanguage;
    });
  }, [search, complexityFilter, languageFilter]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl max-h-[90vh] flex flex-col bg-white dark:bg-[#111726] rounded-3xl border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex items-start justify-between gap-4 bg-gray-50/50 dark:bg-gray-900/40">
          <div className="flex-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold mb-1.5">
              💡 Preset Algorithms
            </div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white">
              Algorithm Sample Library
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Select a pre-built algorithm to see how Complexity analyzes its time and space bounds.
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="rounded-xl">
            ✕ Close
          </Button>
        </div>

        {/* Filters */}
        <div className="p-5 border-b border-gray-200 dark:border-gray-800 space-y-3.5 bg-white dark:bg-[#111726]">
          <input
            type="text"
            placeholder="Search samples by name, keyword, or Big-O (e.g. Binary Search, O(n²), hash map)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/80 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 placeholder-gray-400"
          />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Complexity Filter */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-gray-500 dark:text-gray-400 font-semibold mr-1">
                Complexity:
              </span>
              {COMPLEXITIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setComplexityFilter(c)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-colors ${
                    complexityFilter === c
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            {/* Language Filter */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-gray-500 dark:text-gray-400 font-semibold mr-1">
                Language:
              </span>
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.id}
                  type="button"
                  onClick={() => setLanguageFilter(lang.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    languageFilter === lang.id
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Samples List */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 bg-gray-50/40 dark:bg-[#0c101c]/40">
          {filteredSamples.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <p className="text-3xl">🔍</p>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                No samples match your search criteria.
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Try adjusting your search query or reset the complexity and language filters.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredSamples.map((sample) => (
                <div
                  key={sample.id}
                  className="p-5 rounded-2xl bg-white dark:bg-[#111726] border border-gray-200 dark:border-gray-800 hover:border-indigo-500/50 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-3 group"
                  onClick={() => {
                    onSelect(sample);
                    onClose();
                  }}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {sample.title}
                      </h3>
                      <span className="font-mono font-bold text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                        {sample.complexity}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                      {sample.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800/80">
                    <Badge variant="outline" size="xs" className="uppercase font-mono tracking-wider">
                      {sample.language}
                    </Badge>
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-1">
                      Load Sample Code <span>→</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
