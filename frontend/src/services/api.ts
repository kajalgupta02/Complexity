import { analyzeCode as analyzeLocal } from '@/lib/analyzer';
import type { AnalysisResult, SupportedLanguage } from '@/lib/analyzer/types';

export async function requestAnalysis(
  code: string,
  language?: SupportedLanguage
): Promise<AnalysisResult> {
  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code, language }),
    });

    if (response.ok) {
      const data = await response.json();
      return data as AnalysisResult;
    }
  } catch (error) {
    console.warn('Backend API unavailable, executing client-side analysis engine fallback:', error);
  }

  // Fallback: Run static analysis engine directly in browser if backend server is unreachable
  return analyzeLocal(code, language);
}
