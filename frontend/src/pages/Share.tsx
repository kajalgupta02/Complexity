import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import LZString from 'lz-string';
import { Button } from '@/components/ui/Button';
import { useAnalyzerWorker } from '@/hooks/useAnalyzerWorker';
import type { AnalysisResult, SupportedLanguage } from '@/lib/analyzer';
import { SEO } from '@/components/SEO';

export const Share: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { analyze, isAnalyzing } = useAnalyzerWorker();
  
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState<SupportedLanguage>('javascript');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const encoded = searchParams.get('data');
    if (!encoded) {
      setError('No shared snippet found.');
      return;
    }

    try {
      const decoded = LZString.decompressFromEncodedURIComponent(encoded);
      if (!decoded) throw new Error('Invalid format');
      const parsed = JSON.parse(decoded);
      setCode(parsed.code || '');
      setLanguage(parsed.language || 'javascript');

      analyze(parsed.code, parsed.language)
        .then(res => setResult(res))
        .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Analysis failed.'));
    } catch {
      setError('Failed to load shared snippet. The link might be broken.');
    }
  }, [searchParams, analyze]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <div>
          <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">{error}</h1>
          <Button onClick={() => navigate('/')}>Return Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#090d16] py-10 px-4 sm:px-6 text-gray-900 dark:text-gray-100">
      <SEO
        title="Shared Complexity Analysis Snippet"
        description="View shared source code snippet and its Big-O time and space complexity results."
        canonical="/share"
      />
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#111726] p-6 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800">
          <div>
            <h1 className="text-2xl font-black mb-1">Shared Snippet</h1>
            <p className="text-sm text-gray-500">Read-only view</p>
          </div>
          <Button onClick={() => navigate(`/analyzer?code=${encodeURIComponent(code)}&lang=${language}`)} variant="primary">
            Open in Analyzer
          </Button>
        </header>

        {isAnalyzing ? (
          <div className="p-12 text-center text-gray-500">Analyzing...</div>
        ) : result ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-3xl bg-gray-900 border border-gray-800 overflow-hidden relative">
              <div className="absolute top-0 right-0 px-3 py-1 bg-gray-800 text-gray-400 text-[10px] font-bold rounded-bl-lg uppercase">
                {language}
              </div>
              <pre className="text-emerald-400 font-mono text-sm overflow-x-auto">
                {code}
              </pre>
            </div>
            
            <div className="space-y-6">
              <div className="p-6 rounded-3xl bg-white dark:bg-[#111726] border border-gray-200 dark:border-gray-800 shadow-sm">
                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Complexity Result</h2>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Time Complexity</p>
                    <span className="text-2xl font-black font-mono text-indigo-600 dark:text-indigo-400">{result.timeComplexity}</span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Space Complexity</p>
                    <span className="text-2xl font-black font-mono text-cyan-600 dark:text-cyan-400">
                      {typeof result.spaceComplexity === 'string' ? result.spaceComplexity : result.spaceComplexity?.class || 'O(1)'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default Share;
