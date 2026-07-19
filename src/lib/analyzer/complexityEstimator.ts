import {
  AnalysisResult,
  ComplexityClass,
  LoopInfo,
  RecursionInfo,
  PatternInfo,
  SpaceComplexityEstimate,
  ReasoningStep,
  WhatWouldChange,
} from './types';
import { getCodeSnippet } from './tokenizer';

export function estimateComplexity(
  source: string,
  loops: LoopInfo[],
  recursion: RecursionInfo,
  patterns: PatternInfo
): Omit<AnalysisResult, 'error' | 'loops' | 'recursion' | 'patterns'> {
  const reasoningChain: ReasoningStep[] = [];
  const detectedPatterns: string[] = [];
  let timeComplexity: ComplexityClass = 'O(1)';
  let timeConfidence = 100;
  const whatWouldChange: WhatWouldChange[] = [];

  // 1. Recursion analysis
  if (recursion.hasDirectRecursion || recursion.hasMutualRecursion) {
    if (recursion.hasDirectRecursion) detectedPatterns.push('direct recursion');
    if (recursion.hasMutualRecursion) detectedPatterns.push('mutual recursion');

    if (patterns.hasDivideAndConquer) {
      timeComplexity = 'O(n log n)';
      timeConfidence = 70;
      reasoningChain.push({
        id: 'recursion-divide-conquer',
        title: 'Divide-and-conquer recursion detected',
        rule: 'Recursion that splits input into halves and recurses on both → O(n log n)',
        evidence: [],
        weight: 70,
        confidenceChange: -30,
      });
    } else {
      timeComplexity = 'O(2ⁿ)';
      timeConfidence = 60;
      reasoningChain.push({
        id: 'recursion-default',
        title: 'Recursion detected (no divide-and-conquer pattern)',
        rule: 'Recursion without obvious split into subproblems → default to O(2ⁿ) (interview heuristic)',
        evidence: [],
        weight: 60,
        confidenceChange: -40,
      });
    }
  }
  // 2. Loop analysis
  else if (loops.length > 0) {
    const maxNestingDepth = Math.max(...loops.map(l => l.nestingDepth));
    detectedPatterns.push(`${loops.length} loop(s) detected`);
    if (maxNestingDepth > 0) detectedPatterns.push(`${maxNestingDepth + 1} levels of nesting`);

    // Determine complexity based on nesting and patterns
    if (maxNestingDepth >= 2) {
      if (patterns.hasLogarithmicStep) {
        timeComplexity = 'O(n log n)';
        timeConfidence = 75;
        reasoningChain.push({
          id: 'nested-loop-log-step',
          title: 'Nested loops with logarithmic step',
          rule: 'Nested loops + log step → O(n log n)',
          evidence: [],
          weight: 75,
          confidenceChange: -25,
        });
      } else if (maxNestingDepth === 2) {
        timeComplexity = 'O(n²)';
        timeConfidence = 90;
        reasoningChain.push({
          id: 'nested-loop-quadratic',
          title: 'Double nested loops detected',
          rule: 'Two nested loops → O(n²)',
          evidence: loops.filter(l => l.nestingDepth > 0).map(l => ({
            type: 'loop',
            snippet: getCodeSnippet(source, l.startIndex, l.endIndex),
            startLine: l.startLine,
            endLine: l.endLine,
          })),
          weight: 90,
          confidenceChange: -10,
        });
      } else if (maxNestingDepth >= 3) {
        timeComplexity = 'O(n³)';
        timeConfidence = 90;
        reasoningChain.push({
          id: 'nested-loop-cubic',
          title: 'Triple (or more) nested loops detected',
          rule: 'Three or more nested loops → O(n³)',
          evidence: loops.filter(l => l.nestingDepth > 1).map(l => ({
            type: 'loop',
            snippet: getCodeSnippet(source, l.startIndex, l.endIndex),
            startLine: l.startLine,
            endLine: l.endLine,
          })),
          weight: 90,
          confidenceChange: -10,
        });
      }
    } else if (patterns.hasLogarithmicStep) {
      timeComplexity = 'O(log n)';
      timeConfidence = 80;
      reasoningChain.push({
        id: 'single-loop-log-step',
        title: 'Single loop with logarithmic step',
        rule: 'Loop with i *= 2 or similar → O(log n)',
        evidence: loops.map(l => ({
          type: 'loop',
          snippet: getCodeSnippet(source, l.startIndex, l.endIndex),
          startLine: l.startLine,
          endLine: l.endLine,
        })),
        weight: 80,
        confidenceChange: -20,
      });
    } else {
      timeComplexity = 'O(n)';
      timeConfidence = 70;
      reasoningChain.push({
        id: 'single-loop-linear',
        title: 'Loop(s) without nesting or log step',
        rule: 'Sequential or single loop → O(n) (interview heuristic)',
        evidence: loops.map(l => ({
          type: 'loop',
          snippet: getCodeSnippet(source, l.startIndex, l.endIndex),
          startLine: l.startLine,
          endLine: l.endLine,
        })),
        weight: 70,
        confidenceChange: -30,
      });
    }

    // Adjust confidence for ambiguities in loops
    for (const loop of loops) {
      if (loop.hasEarlyBreak) {
        timeConfidence = Math.max(0, timeConfidence - 15);
        reasoningChain.push({
          id: `early-break-${loop.startIndex}`,
          title: 'Early exit detected in loop',
          rule: 'Early break/return in loop → complexity might be lower than estimated',
          evidence: [
            {
              type: 'code',
              snippet: getCodeSnippet(source, loop.startIndex, loop.endIndex),
              startLine: loop.startLine,
              endLine: loop.endLine,
            },
          ],
          weight: 15,
          confidenceChange: -15,
        });
        whatWouldChange.push({
          factor: `Early break/return on line ${loop.startLine}`,
          impact: 'Actual complexity could be lower than estimated',
        });
      }

      for (const fnName of loop.hasUnknownFunctionCalls) {
        timeConfidence = Math.max(0, timeConfidence - 10);
        reasoningChain.push({
          id: `unknown-fn-${fnName}-${loop.startIndex}`,
          title: `Unknown function call: ${fnName}`,
          rule: 'Function calls to non-analyzed code inside loops → complexity depends on external function',
          evidence: [],
          weight: 10,
          confidenceChange: -10,
        });
        whatWouldChange.push({
          factor: `Call to ${fnName} inside loop on line ${loop.startLine}`,
          impact: `If ${fnName} is not O(1), actual complexity could be higher than estimated`,
        });
      }
    }
  }
  // 3. No loops or recursion → O(1)
  else {
    reasoningChain.push({
      id: 'no-loops-recursion',
      title: 'No loops or recursion detected',
      rule: 'No loops or recursion → O(1)',
      evidence: [],
      weight: 100,
      confidenceChange: 0,
    });
  }

  if (patterns.hasLogarithmicStep) detectedPatterns.push('logarithmic step pattern');
  if (patterns.hasDivideAndConquer) detectedPatterns.push('divide-and-conquer pattern');

  // Space complexity estimate
  const spaceComplexity: SpaceComplexityEstimate = {
    class: 'O(1)',
    reasoning: ['Space complexity is a heuristic (not fully analyzed yet)'],
  };
  if (recursion.hasDirectRecursion || recursion.hasMutualRecursion) {
    spaceComplexity.class = 'O(n)';
    spaceComplexity.reasoning.push('Recursion stack depth → O(n) (heuristic)');
  }

  // Known limitations
  const knownLimitations = [
    'This is a heuristic-based analyzer, not a formal complexity prover',
    'Cannot analyze code inside external/unknown functions',
    'Does not account for dynamic data structures (e.g., hash tables, trees) inside loops',
    'Recursion analysis is limited to basic patterns',
  ];

  return {
    version: '1.1.0',
    timeComplexity,
    timeConfidence,
    spaceComplexity,
    reasoningChain,
    detectedPatterns,
    whatWouldChange,
    knownLimitations,
  };
}
