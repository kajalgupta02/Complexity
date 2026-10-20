import type { PatternInfo, LoopInfo } from './types.js';

/**
 * Detects algorithmic patterns including logarithmic iteration steps,
 * bisection intervals (binary search), and divide-and-conquer recurrence patterns.
 */
export function detectPatterns(
  source: string,
  loops: LoopInfo[]
): Omit<PatternInfo, 'hasImplicitLoops' | 'hasSortCalls'> {
  let hasLogarithmicStep = false;
  const logStepDetails: { variable: string; operator: string; line: number }[] = [];
  let hasDivideAndConquer = false;
  const hasTailRecursion = false;

  // 1. Direct variable halving or doubling via compound assignment
  // e.g. i *= 2, i /= 2, i >>= 1, i <<= 1
  const compoundLogRegex = /\b([A-Za-z_$][\w$]*)\s*(\*=|\/=|>>=|<<=)\s*(?:2|1)\b/g;

  // e.g. i = i / 2, i = i * 2, i = i >> 1, i = Math.floor(i / 2), i = int(i / 2), i = i // 2
  const explicitHalvingRegex =
    /\b([A-Za-z_$][\w$]*)\s*=\s*(?:Math\.(?:floor|trunc|round)\s*\(\s*|int\s*\(\s*|parseInt\s*\(\s*)?\1\s*(?:\/|\/\/|>>|\*|<<)\s*(?:2|1)\b/g;

  for (const loop of loops) {
    const loopBody = source.slice(loop.startIndex, loop.endIndex + 1);

    // Check compound step
    let match: RegExpExecArray | null;
    while ((match = compoundLogRegex.exec(loopBody)) !== null) {
      hasLogarithmicStep = true;
      logStepDetails.push({
        variable: match[1],
        operator: match[2],
        line: loop.startLine,
      });
    }

    // Check explicit single-variable halving
    while ((match = explicitHalvingRegex.exec(loopBody)) !== null) {
      hasLogarithmicStep = true;
      logStepDetails.push({
        variable: match[1],
        operator: 'halving/doubling',
        line: loop.startLine,
      });
    }

    // 2. Two-pointer bisection interval progression (Binary Search pattern)
    // Checks if loop condition bounds two pointers (e.g. left <= right, low < high, lo <= hi)
    // and loop body bisects the interval and updates at least one boundary pointer to the midpoint.
    if (detectBisectionInterval(loop, loopBody)) {
      hasLogarithmicStep = true;
      logStepDetails.push({
        variable: 'bisection_interval',
        operator: 'interval_halving',
        line: loop.startLine,
      });
    }
  }

  // Divide-and-conquer recurrence detection (two or more recursive calls dividing input size)
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

/**
 * Accurately detects whether a loop implements interval bisection (e.g. binary search).
 * Requires:
 * 1. Loop header comparing two boundary variables: e.g. `p1 <= p2`, `p1 < p2`, `p2 >= p1`, `p2 > p1`.
 * 2. Loop body computing midpoint derived from p1 and p2: e.g. `mid = (p1 + p2) / 2` or `p1 + (p2 - p1) / 2`.
 * 3. Loop body updating at least one of the boundary variables to or past mid: `p1 = mid + 1` / `p2 = mid - 1` / `p1 = mid` / `p2 = mid`.
 */
function detectBisectionInterval(loop: LoopInfo, loopBody: string): boolean {
  const header = loop.headerText;
  if (!header) return false;

  // Extract pointer variables from loop condition
  // Matches expressions like while (left <= right), while (low < high), for (; lo <= hi; )
  const conditionMatch = header.match(
    /\(\s*.*?(?:;\s*)?([A-Za-z_$][\w$]*)\s*(<=?|<|>=?|>)\s*([A-Za-z_$][\w$]*)/
  );

  if (!conditionMatch) return false;

  const rawP1 = conditionMatch[1];
  const operator = conditionMatch[2];
  const rawP2 = conditionMatch[3];

  // Disregard if either operand is a numeric literal or constant
  if (/^\d+$/.test(rawP1) || /^\d+$/.test(rawP2)) return false;

  // Determine low/left pointer and high/right pointer
  const isLess = operator.startsWith('<');
  const lowVar = isLess ? rawP1 : rawP2;
  const highVar = isLess ? rawP2 : rawP1;

  if (lowVar === highVar) return false;

  // Check each statement in the loop body to identify a midpoint variable assignment
  const statements = loopBody.split(/[;\n]/);
  let foundMidVar: string | null = null;

  for (const stmt of statements) {
    const assignMatch = stmt.match(/\b([A-Za-z_$][\w$]*)\s*=\s*(.+)/);
    if (!assignMatch) continue;
    const varName = assignMatch[1];
    const expr = assignMatch[2];

    // Must reference both low and high variables
    const hasBoth =
      new RegExp(`\\b${lowVar}\\b`).test(expr) &&
      new RegExp(`\\b${highVar}\\b`).test(expr);

    // Must perform division or bit-shift halving
    const hasHalving = /(?:\/|\/\/|>>|>>>)\s*(?:2|1)\b/.test(expr);

    if (hasBoth && hasHalving) {
      foundMidVar = varName;
      break;
    }
  }

  if (!foundMidVar) return false;

  // Verify that the loop body actually updates lowVar or highVar based on foundMidVar
  // e.g. low = mid + 1, low = mid, high = mid - 1, high = mid
  const updateRegex = new RegExp(
    `(?:\\b${lowVar}\\s*=\\s*.*\\b${foundMidVar}\\b|\\b${highVar}\\s*=\\s*.*\\b${foundMidVar}\\b)`
  );

  return updateRegex.test(loopBody);
}
