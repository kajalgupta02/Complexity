import type { PatternInfo, LoopInfo } from './types';

export function detectPatterns(
  source: string,
  loops: LoopInfo[]
): Omit<PatternInfo, 'hasImplicitLoops' | 'hasSortCalls'> {
  let hasLogarithmicStep = false;
  const logStepDetails: { variable: string; operator: string; line: number }[] = [];
  let hasDivideAndConquer = false;
  const hasTailRecursion = false;

  const logStepRegex = /\b([A-Za-z_$][\w$]*)\s*(\*=|\/=|>>=|<<=)\s*2\b/g;
  for (const loop of loops) {
    const loopBody = source.slice(loop.startIndex, loop.endIndex + 1);
    while (logStepRegex.exec(loopBody) !== null) {
      hasLogarithmicStep = true;
    }
  }

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
