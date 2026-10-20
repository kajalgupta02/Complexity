import type { OptimizationResultPayload, TestCaseSuggestion } from './types.js';

export class MalformedAIResponseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MalformedAIResponseError';
  }
}

/**
 * Clean and validate raw LLM text into a strictly typed OptimizationResultPayload.
 */
export function validateAndParseAIResponse(rawText: string): OptimizationResultPayload {
  if (typeof rawText !== 'string' || !rawText.trim()) {
    throw new MalformedAIResponseError('AI provider returned an empty response.');
  }

  // Strip potential Markdown fences if the model emitted them
  let cleaned = rawText.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    throw new MalformedAIResponseError(
      `Failed to parse AI output as JSON: ${err instanceof Error ? err.message : 'Invalid syntax'}`
    );
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new MalformedAIResponseError('AI response must be a JSON object.');
  }

  const obj = parsed as Record<string, unknown>;

  // 1. Validate optimizedCode
  if (typeof obj.optimizedCode !== 'string' || !obj.optimizedCode.trim()) {
    throw new MalformedAIResponseError('Field "optimizedCode" (non-empty string) is required.');
  }

  // 2. Validate originalInefficiency
  if (typeof obj.originalInefficiency !== 'string' || !obj.originalInefficiency.trim()) {
    throw new MalformedAIResponseError('Field "originalInefficiency" (non-empty string) is required.');
  }

  // 3. Validate proposed complexities
  if (typeof obj.proposedTimeComplexity !== 'string' || !obj.proposedTimeComplexity.trim()) {
    throw new MalformedAIResponseError('Field "proposedTimeComplexity" (string) is required.');
  }
  if (typeof obj.proposedSpaceComplexity !== 'string' || !obj.proposedSpaceComplexity.trim()) {
    throw new MalformedAIResponseError('Field "proposedSpaceComplexity" (string) is required.');
  }

  // 4. Validate assumptions & tradeoffs arrays
  const assumptions = Array.isArray(obj.assumptions)
    ? obj.assumptions.filter((a): a is string => typeof a === 'string')
    : [];

  const tradeoffs = Array.isArray(obj.tradeoffs)
    ? obj.tradeoffs.filter((t): t is string => typeof t === 'string')
    : [];

  // 5. Validate explanation
  const explanation = typeof obj.explanation === 'string' && obj.explanation.trim()
    ? obj.explanation
    : 'Proposed alternative implementation to improve asymptotic scalability.';

  // 6. Validate suggestedTests
  const suggestedTests: TestCaseSuggestion[] = [];
  if (Array.isArray(obj.suggestedTests)) {
    for (const test of obj.suggestedTests) {
      if (test && typeof test === 'object') {
        const t = test as Record<string, unknown>;
        if (typeof t.name === 'string') {
          suggestedTests.push({
            name: t.name,
            inputDescription: typeof t.inputDescription === 'string' ? t.inputDescription : '',
            expectedBehavior: typeof t.expectedBehavior === 'string' ? t.expectedBehavior : '',
          });
        }
      }
    }
  }

  return {
    optimizedCode: obj.optimizedCode,
    originalInefficiency: obj.originalInefficiency,
    proposedTimeComplexity: obj.proposedTimeComplexity,
    proposedSpaceComplexity: obj.proposedSpaceComplexity,
    assumptions,
    tradeoffs,
    explanation,
    suggestedTests,
  };
}
