import { useState, useMemo } from 'react';
import { SAMPLES, COMPLEXITIES, LANGUAGES, type Sample } from '@/data/samples';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface SampleGalleryProps {
  open: boolean;
  onClose: () => void;
  onSelect: (sample: Sample) => void;
  onSelectCompare?: (sample: Sample) => void;
  compareMode?: boolean;
}

export default function SampleGallery({ open, onClose, onSelect }: SampleGalleryProps) {
  const [search, setSearch] = useState('');
  const [complexityFilter, setComplexityFilter] = useState('All');
  const [languageFilter, setLanguageFilter] = useState('all');

  const filteredSamples = useMemo(() => {
    return SAMPLES.filter((sample) => {
      const matchesSearch =
        sample.title.toLowerCase().includes(search.toLowerCase()) ||
        sample.description.toLowerCase().includes(search.toLowerCase());
      const matchesComplexity = complexityFilter === 'All' || sample.complexity === complexityFilter;
      const matchesLanguage = languageFilter === 'all' || sample.language === languageFilter;
      return matchesSearch && matchesComplexity && matchesLanguage;
    });
  }, [search, complexityFilter, languageFilter]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-4xl max-h-[90vh] flex flex-col bg-bg-secondary dark:bg-bg-secondary-dark rounded-2xl border border-text-muted/20 dark:border-text-muted-dark/20 shadow-strong">
        <div className="p-6 border-b border-text-muted/10 dark:border-text-muted-dark/10 flex items-start justify-between gap-4">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-text-primary dark:text-text-primary-dark mb-2">
              Sample Library
            </h2>
            <p className="text-sm text-text-tertiary dark:text-text-tertiary-dark">
              Choose a sample to see how complexity analysis works
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>

        <div className="p-6 border-b border-text-muted/10 dark:border-text-muted-dark/10 space-y-4">
          <input
            type="text"
            placeholder="Search samples..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-bg-tertiary dark:bg-bg-tertiary-dark text-text-primary dark:text-text-primary-dark border border-text-muted/20 dark:border-text-muted-dark/20 focus:outline-none focus:ring-2 focus:ring-accent-500"
          />
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-text-secondary dark:text-text-secondary-dark font-medium">
                Complexity:
              </span>
              {COMPLEXITIES.map((c) => (
                <Button
                  key={c}
                  size="xs"
                  variant={complexityFilter === c ? 'primary' : 'ghost'}
                  onClick={() => setComplexityFilter(c)}
                >
                  {c}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-text-secondary dark:text-text-secondary-dark font-medium">
                Language:
              </span>
              {LANGUAGES.map((lang) => (
                <Button
                  key={lang.id}
                  size="xs"
                  variant={languageFilter === lang.id ? 'primary' : 'ghost'}
                  onClick={() => setLanguageFilter(lang.id)}
                >
                  {lang.label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {filteredSamples.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-text-muted dark:text-text-muted-dark">No samples match your filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredSamples.map((sample) => (
                <Card
                  key={sample.id}
                  className="group hover:shadow-medium transition-all cursor-pointer"
                  onClick={() => onSelect(sample)}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-bold text-text-primary dark:text-text-primary-dark group-hover:text-accent-500 transition-colors">
                        {sample.title}
                      </h3>
                      <Badge size="sm" variant="primary">
                        {sample.complexity}
                      </Badge>
                    </div>
                    <p className="text-sm text-text-tertiary dark:text-text-tertiary-dark mb-3">
                      {sample.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" size="sm">
                        {sample.language}
                      </Badge>
                      <Button size="xs" variant="secondary">
                        Use Sample →
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
