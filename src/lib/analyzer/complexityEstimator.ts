import {
  AnalysisResult,
  ComplexityClass,
  ConfidenceLevel,
  LoopInfo,
  RecursionInfo,
  PatternInfo,
  SpaceComplexityEstimate,
} from './types';

export function estimateComplexity(
  loops: LoopInfo[],
  recursion: RecursionInfo,
  patterns: PatternInfo
): Omit<AnalysisResult, 'error' | 'loops' | 'recursion' | 'patterns'> {
  const reasoningSteps: string[] = [];
  const detectedPatterns: string[] = [];

  // ------------------------------
  // Step 1: Time Complexity Rules
  // ------------------------------
  let timeComplexity: ComplexityClass = 'O(1)';
  let timeConfidence: ConfidenceLevel = 'high';

  // Case A: Recursion
  if (recursion.hasDirectRecursion || recursion.hasMutualRecursion) {
    if (recursion.hasDirectRecursion) detectedPatterns.push('direct recursion');
    if (recursion.hasMutualRecursion) detectedPatterns.push('mutual recursion');

    if (patterns.hasDivideAndConquer) {
      timeComplexity = 'O(n log n)';
      timeConfidence = 'medium';
      reasoningSteps.push('Recursion with divide-and-conquer pattern → O(n log n)');
    } else {
      timeComplexity = 'O(2ⁿ)';
      timeConfidence = 'medium';
      reasoningSteps.push('Recursion detected (no divide-and-conquer pattern) → default O(2ⁿ) (heuristic)');
    }
  }
  // Case B: Loops
  else if (loops.length > 0) {
    const maxNestingDepth = Math.max(...loops.map(l => l.nestingDepth));
    detectedPatterns.push(`${loops.length} loop(s) detected`);
    if (maxNestingDepth > 0) detectedPatterns.push(`${maxNestingDepth + 1} levels of nesting`);

    // Determine based on nesting and log steps
    if (maxNestingDepth >= 1) { // Since nestingDepth 1 means 2 levels (loop inside another loop)
      if (patterns.hasLogarithmicStep) {
        timeComplexity = 'O(n log n)';
        timeConfidence = 'medium';
        reasoningSteps.push(`Nested loops (depth ${maxNestingDepth + 1}) + logarithmic step → O(n log n)`);
      } else if (maxNestingDepth === 1) {
        timeComplexity = 'O(n²)';
        timeConfidence = 'high';
        reasoningSteps.push(`Nested loops (depth 2) → O(n²)`);
      } else if (maxNestingDepth >= 2) {
        timeComplexity = 'O(n³)';
        timeConfidence = 'high';
        reasoningSteps.push(`Nested loops (depth ≥3) → O(n³)`);
      }
    } else if (patterns.hasLogarithmicStep) {
      timeComplexity = 'O(log n)';
      timeConfidence = 'medium';
      reasoningSteps.push('Single loop + logarithmic step → O(log n)');
    } else {
      timeComplexity = 'O(n)';
      timeConfidence = 'low';
      reasoningSteps.push('No nested loops, no log step → O(n) (heuristic for sequential loops)');
    }
  }
  // Case C: No loops, no recursion
  else {
    timeComplexity = 'O(1)';
    timeConfidence = 'high';
    reasoningSteps.push('No loops or recursion → O(1)');
  }

  // ------------------------------
  // Step 2: Space Complexity Rules
  // ------------------------------
  const spaceNotes: string[] = [];
  let spaceComplexity: ComplexityClass = 'O(1)';
  let spaceConfidence: ConfidenceLevel = 'high';

  if (recursion.hasDirectRecursion || recursion.hasMutualRecursion) {
    // Recursion stack depth (heuristic: assume depth proportional to n unless DAC)
    if (patterns.hasDivideAndConquer) {
      spaceComplexity = 'O(log n)';
      spaceNotes.push('Divide-and-conquer recursion stack depth → O(log n)');
    } else {
      spaceComplexity = 'O(n)';
      spaceNotes.push('Recursion stack depth heuristic → O(n)');
    }
    spaceConfidence = 'low';
  }

  const spaceEstimate: SpaceComplexityEstimate = {
    class: spaceComplexity,
    confidence: spaceConfidence,
    notes: spaceNotes,
  };

  if (patterns.hasLogarithmicStep) detectedPatterns.push('logarithmic step pattern (i *= 2, etc.)');
  if (patterns.hasDivideAndConquer) detectedPatterns.push('divide-and-conquer pattern');

  return {
    timeComplexity,
    timeConfidence,
    spaceComplexity: spaceEstimate,
    reasoningSteps,
    detectedPatterns,
  };
}
