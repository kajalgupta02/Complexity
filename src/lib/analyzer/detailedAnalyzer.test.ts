import { describe, expect, it } from 'vitest';
import { buildDetailedAnalysis } from './detailedAnalyzer';
import type { LoopInfo } from './types';

describe('buildDetailedAnalysis', () => {
  it('describes quadratic nested loops clearly', () => {
    const loops: LoopInfo[] = [
      {
        type: 'for',
        startIndex: 0,
        endIndex: 20,
        startLine: 1,
        endLine: 4,
        headerText: 'for (let i = 0; i < n; i++)',
        bodyText: 'for (let j = 0; j < n; j++) { sum++; }',
        nestingDepth: 1,
        hasEarlyBreak: false,
        hasUnknownFunctionCalls: [],
        hasHashContainerAccess: false,
        hasSortCall: false,
      },
    ];

    const analysis = buildDetailedAnalysis('function foo(n) { for (let i = 0; i < n; i++) { for (let j = 0; j < n; j++) { sum++; } } }', {
      timeComplexity: 'O(n²)',
      timeConfidence: 90,
      spaceComplexity: { class: 'O(1)', reasoning: [] },
      loops,
      recursion: {
        hasDirectRecursion: false,
        hasMutualRecursion: false,
        recursiveFunctions: [],
      },
      patterns: {
        hasLogarithmicStep: false,
        hasDivideAndConquer: false,
        hasTailRecursion: false,
        hasImplicitLoops: false,
        hasSortCalls: false,
      },
      stdlibCalls: [],
      detectedLanguage: 'javascript',
    });

    expect(analysis.highLevelSummary).toMatch(/quadratic|nested/i);
    expect(analysis.complexityDerivation.some((step) => step.math === 'O(n²)')).toBe(true);
  });
});
