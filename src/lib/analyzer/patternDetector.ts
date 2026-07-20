import type { PatternInfo, LoopInfo } from './types';

export function detectPatterns(
  source: string,
  loops: LoopInfo[]
): Omit<PatternInfo, 'hasImplicitLoops' | 'hasSortCalls'> {
  let hasLogarithmicStep = false;
  const logStepDetails: { variable: string; operator: string; line: number }[] = [];
  let hasDivideAndConquer = false;
  let hasTailRecursion = false;

  // 1. Check for logarithmic steps in loops
  const logStepRegex = /\b([A-Za-z_$][\w$]*)\s*(\*=|\/=|>>=|<<=)\s*2\b/g;
  for (const loop of loops) {
    const loopBody = source.slice(loop.startIndex, loop.endIndex + 1);
    let match;
    while ((match = logStepRegex.exec(loopBody)) !== null) {
      hasLogarithmicStep = true;
    }
  }

  // 2. Check for divide-and-conquer recursion patterns
  const dacRegex = /\b([A-Za-z_$][\w$]*)\s*\([^)]*\/\s*2[^)]*\)\s*.*\b\1\s*\([^)]*\/\s*2[^)]*\)/s;
  if (dacRegex.test(source)) {
    hasDivideAndConquer = true;
  }

  return {
    hasLogarithmicStep,
    logStepDetails: hasLogarithmicStep ? logStepDetails : undefined,
    hasDivideAndConquer,
    hasTailRecursion,
  };
}
