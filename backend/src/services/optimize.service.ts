import { performStaticAnalysis } from './analysis.service.js';
import { ProductionAIAdapter } from '../ai/adapter.js';
import type { AIAdapter } from '../ai/types.js';
import type { SupportedLanguage } from '../analyzer/types.js';

export type VerificationStatus = 'verified' | 'partially-verified' | 'unverified' | 'failed';

export interface OptimizationResponse {
  optimizedCode: string;
  originalInefficiency: string;
  proposedTimeComplexity: string;
  proposedSpaceComplexity: string;
  assumptions: string[];
  tradeoffs: string[];
  explanation: string;
  verificationStatus: VerificationStatus;
  verificationDetails: {
    message: string;
    testCases: Array<{
      name: string;
      inputDescription: string;
      expectedBehavior: string;
    }>;
  };
  empiricalBenchmark: {
    measured: boolean;
    note: string;
  };
  metadata: {
    provider: string;
    model: string;
    promptVersion: string;
    authoritativeTimeComplexity: string;
    authoritativeSpaceComplexity: string;
  };
}

export class OptimizationService {
  constructor(private readonly aiAdapter: AIAdapter = new ProductionAIAdapter()) {}

  /**
   * Executes the authoritative optimization workflow:
   * 1. Re-runs authoritative static analysis on server (never blindly trust client claims).
   * 2. Builds bounded prompt.
   * 3. Calls AI adapter with timeout and retry.
   * 4. Returns strictly typed response with honest verification status.
   */
  async generateOptimization(
    code: string,
    language: SupportedLanguage,
    options?: { signal?: AbortSignal }
  ): Promise<OptimizationResponse> {
    // 1. Authoritative server-side static analysis
    const authoritativeAnalysis = performStaticAnalysis(code, language);

    // 2. Invoke AI adapter
    const { payload, metadata } = await this.aiAdapter.generateOptimization(
      {
        code,
        language,
        staticAnalysis: authoritativeAnalysis,
      },
      options
    );

    // 3. Assemble response adhering to truth-in-verification rules
    return {
      optimizedCode: payload.optimizedCode,
      originalInefficiency: payload.originalInefficiency,
      proposedTimeComplexity: payload.proposedTimeComplexity,
      proposedSpaceComplexity: payload.proposedSpaceComplexity,
      assumptions: payload.assumptions,
      tradeoffs: payload.tradeoffs,
      explanation: payload.explanation,
      verificationStatus: 'unverified',
      verificationDetails: {
        message:
          'Static algorithmic proposal. Code has not been executed against a dynamic containerized test runner. Verify against suggested test cases prior to production use.',
        testCases: payload.suggestedTests,
      },
      empiricalBenchmark: {
        measured: false,
        note: 'Hardware runtime measurements are not inferred from Big-O notation. Use the Empirical Sandbox to run hardware benchmarks.',
      },
      metadata: {
        provider: metadata.provider,
        model: metadata.model,
        promptVersion: metadata.promptVersion,
        authoritativeTimeComplexity: authoritativeAnalysis.timeComplexity,
        authoritativeSpaceComplexity:
          typeof authoritativeAnalysis.spaceComplexity === 'string'
            ? authoritativeAnalysis.spaceComplexity
            : authoritativeAnalysis.spaceComplexity.class,
      },
    };
  }
}

export const defaultOptimizationService = new OptimizationService();
