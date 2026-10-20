import type { AnalysisResult, SupportedLanguage } from '../analyzer/types.js';

export interface TestCaseSuggestion {
  name: string;
  inputDescription: string;
  expectedBehavior: string;
}

export interface OptimizationPromptInput {
  code: string;
  language: SupportedLanguage;
  staticAnalysis: AnalysisResult;
}

export interface OptimizationResultPayload {
  optimizedCode: string;
  originalInefficiency: string;
  proposedTimeComplexity: string;
  proposedSpaceComplexity: string;
  assumptions: string[];
  tradeoffs: string[];
  explanation: string;
  suggestedTests: TestCaseSuggestion[];
}

export interface AIProviderMetadata {
  provider: 'gemini' | 'openai' | 'mock';
  model: string;
  promptVersion: string;
}

export interface AIAdapter {
  generateOptimization(
    input: OptimizationPromptInput,
    options?: { signal?: AbortSignal }
  ): Promise<{ payload: OptimizationResultPayload; metadata: AIProviderMetadata }>;
}
