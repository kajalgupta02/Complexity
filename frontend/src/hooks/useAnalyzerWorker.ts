import { useState, useCallback, useRef, useEffect } from 'react';
import type { SupportedLanguage, AnalysisResult } from '../lib/analyzer';

interface UseAnalyzerWorkerResult {
  analyze: (code: string, language: SupportedLanguage) => Promise<AnalysisResult>;
  isAnalyzing: boolean;
  cancel: () => void;
}

export function useAnalyzerWorker(timeoutMs = 5000): UseAnalyzerWorkerResult {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const workerRef = useRef<Worker | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize worker
  useEffect(() => {
    workerRef.current = new Worker(new URL('../lib/worker/analyzer.worker.ts', import.meta.url), { type: 'module' });
    return () => {
      workerRef.current?.terminate();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const cancel = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = new Worker(new URL('../lib/worker/analyzer.worker.ts', import.meta.url), { type: 'module' });
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsAnalyzing(false);
  }, []);

  const analyze = useCallback(
    (code: string, language: SupportedLanguage): Promise<AnalysisResult> => {
      return new Promise((resolve, reject) => {
        if (!workerRef.current) {
          reject(new Error('Worker not initialized'));
          return;
        }

        setIsAnalyzing(true);
        const id = Math.random().toString(36).substring(7);

        const handleMessage = (e: MessageEvent) => {
          if (e.data.id === id) {
            cleanup();
            if (e.data.success) {
              resolve(e.data.result);
            } else {
              reject(new Error(e.data.error));
            }
          }
        };

        const cleanup = () => {
          workerRef.current?.removeEventListener('message', handleMessage);
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
          setIsAnalyzing(false);
        };

        workerRef.current.addEventListener('message', handleMessage);

        workerRef.current.postMessage({ id, code, language });

        timeoutRef.current = setTimeout(() => {
          cleanup();
          cancel(); // Recreate worker since it's hung
          reject(new Error(`Analysis timed out after ${timeoutMs / 1000} seconds. The code may be too large or complex to analyze safely.`));
        }, timeoutMs);
      });
    },
    [timeoutMs, cancel]
  );

  return { analyze, isAnalyzing, cancel };
}
