import crypto from 'node:crypto';
import { analyzeCode, type SupportedLanguage, type AnalysisResult } from '../analyzer/index.js';

export interface ExtendedAnalysisResult extends AnalysisResult {
  analysisId: string;
  analyzedAt: string;
}

/**
 * Service to execute static complexity analysis.
 * Reuses existing analyzer engine and tags with a unique analysis ID.
 */
export function performStaticAnalysis(
  code: string,
  language?: SupportedLanguage
): ExtendedAnalysisResult {
  const result = analyzeCode(code, language);

  return {
    ...result,
    analysisId: 'anl-' + crypto.randomUUID().slice(0, 8),
    analyzedAt: new Date().toISOString(),
  };
}
