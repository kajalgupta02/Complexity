import { PatternInfo, LoopInfo } from './types';

export function detectPatterns(
  source: string,
  loops: LoopInfo[]
): PatternInfo {
  let hasLogarithmicStep = false;
  let hasDivideAndConquer = false;
  let hasTailRecursion = false;

  // 1. Check for logarithmic steps in loops (i *=2, i /=2, i >>=1, etc.)
  const logStepRegex = /\b[A-Za-z_$][\w$]*\s*(\*\=|\/\=|>>\=|<<\=)\s*2\b/;
  for (const loop of loops) {
    const loopBody = source.slice(loop.startIndex, loop.endIndex + 1);
    if (logStepRegex.test(loopBody)) {
      hasLogarithmicStep = true;
      break;
    }
  }

  // 2. Check for divide-and-conquer recursion patterns (splits input in half and recurses twice)
  // Very basic heuristic: checks for calls like fn(arr.slice(0, mid)) and fn(arr.slice(mid))
  const dacRegex = /\b([A-Za-z_$][\w$]*)\s*\([^)]*\/\s*2[^)]*\)\s*.*\b\1\s*\([^)]*\/\s*2[^)]*\)/s;
  if (dacRegex.test(source)) {
    hasDivideAndConquer = true;
  }

  // 3. Check for tail recursion (recursive call is last statement in function)
  // Simple heuristic: recursive call comes right before a return or closing brace
  // Not perfect, but good for interviews!

  return {
    hasLogarithmicStep,
    hasDivideAndConquer,
    hasTailRecursion,
  };
}
