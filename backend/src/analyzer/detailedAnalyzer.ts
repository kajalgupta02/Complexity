import type {
  LoopInfo,
  RecursionInfo,
  PatternInfo,
  DetailedAnalysis,
  LoopAnalysisEntry,
  MemoryUsageEntry,
  StepByStepEntry,
  ComplexityDerivationStep,
  RecursiveAnalysis,
  ComplexityClass,
  StdlibCallInfo,
} from './types';
import type { SupportedLanguage, LanguageConfig } from './language';
import { LANGUAGE_CONFIGS } from './language';

const LANGUAGE_DISPLAY_NAMES: Record<SupportedLanguage, string> = {
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  python: 'Python',
  java: 'Java',
  c: 'C',
  cpp: 'C++',
  csharp: 'C#',
  go: 'Go',
  rust: 'Rust',
  swift: 'Swift',
  kotlin: 'Kotlin',
  php: 'PHP',
  ruby: 'Ruby',
};

function getFunctionName(source: string): string {
  const match =
    source.match(/function\s+([A-Za-z_$][\w$]*)/) ||
    source.match(/def\s+([A-Za-z_][\w]*)/) ||
    source.match(/(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s+)?(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>/) ||
    source.match(/public\s+(?:static\s+)?[\w<>[\]]+\s+([A-Za-z_][\w]*)\s*\(/);
  return match ? match[1] : 'the code';
}

function summarize(source: string, loops: LoopInfo[], recursion: RecursionInfo, patterns: PatternInfo, baseComplexity: ComplexityClass): string {
  const langLines = source.split('\n').length;

  if (recursion.hasDirectRecursion || recursion.hasMutualRecursion) {
    if (patterns.hasDivideAndConquer) {
      return `Your code uses divide-and-conquer recursion. It repeatedly breaks the problem into equal halves across log n levels and performs O(n) work per level, resulting in approximately n × log n operations.`;
    }
    if (baseComplexity === 'O(2ⁿ)') {
      return `Your code uses branching recursion with multiple recursive calls per step. The number of calls doubles at each level of the recursion tree, leading to an exponential 2ⁿ growth in operations.`;
    }
    return `Your code uses recursion. Each recursive call processes a subproblem until the base case is reached, requiring work proportional to the recursion depth and branching factor.`;
  }

  if (loops.length > 0) {
    const maxDepth = Math.max(...loops.map((l) => l.nestingDepth));
    if (patterns.hasSortCalls && maxDepth >= 1) {
      return `Your code executes a built-in sort (O(n log n)) inside a loop nest of depth ${maxDepth + 1}. The sorting cost multiplies with each loop level, resulting in ${baseComplexity}.`;
    }
    if (maxDepth === 1) {
      return `Your code contains two nested loops. The inner loop runs for each iteration of the outer loop, resulting in approximately n × n operations.`;
    }
    if (maxDepth >= 2) {
      return `Your code contains ${maxDepth + 1} nested loops. Each additional loop level multiplies the number of iterations, resulting in approximately n^${maxDepth + 1} operations (${baseComplexity}).`;
    }
    if (patterns.hasLogarithmicStep) {
      return `Your code contains a loop that halves (or multiplies) the remaining search range on each step. Halving the input repeatedly takes approximately log₂(n) operations.`;
    }
    if (patterns.hasImplicitLoops) {
      return `Your code uses functional iteration helpers (such as map or forEach). Each element is processed once in sequence, resulting in approximately n operations.`;
    }
    return `Your code contains a single linear loop. It visits each element once in sequence, resulting in approximately n operations.`;
  }

  if (patterns.hasSortCalls) {
    return `Your code uses a standard-library sort operation. Typical comparison sorting requires approximately n × log n comparisons and swaps.`;
  }

  if (langLines <= 5) {
    return `Your code performs a simple constant-time operation. No loops, recursion, or dynamic data manipulations are involved, so the amount of work does not depend on input size.`;
  }

  return `Your code runs sequential statements without loops or recursive calls. Each instruction executes once, meaning work remains constant O(1) regardless of input size.`;
}

function detectAlgorithms(
  source: string,
  loops: LoopInfo[],
  recursion: RecursionInfo,
  patterns: PatternInfo,
  stdlibCalls: StdlibCallInfo[]
): string[] {
  const algos: string[] = [];

  if (recursion.hasMutualRecursion) algos.push('Mutual Recursion');
  else if (recursion.hasDirectRecursion) algos.push('Recursion');

  if (patterns.hasDivideAndConquer || (recursion.hasDirectRecursion && patterns.hasSortCalls)) {
    algos.push('Divide and Conquer');
  }

  if (
    patterns.hasLogarithmicStep &&
    loops.some((l) => /mid|middle|binary/i.test(l.headerText + l.bodyText))
  ) {
    algos.push('Binary Search');
  }

  if (patterns.hasSortCalls || stdlibCalls.some((c) => c.complexity === 'O(n log n)')) {
    algos.push('Sorting');
  }

  if (/merge\s*\(/.test(source) && /slice|copyOfRange|copyOf/.test(source)) algos.push('Merge Sort');
  if (/partition|pivot|quicksort/i.test(source)) algos.push('Quick Sort');

  if (/Map|HashMap|dict\{|HashSet|Set\(/.test(source) || /\.set\s*\(|\.get\s*\(|\.has\s*\(/.test(source)) {
    algos.push('Hashing');
  }

  if (loops.length >= 2 && patterns.hasSortCalls) algos.push('Greedy');
  if (loops.length >= 2 && Math.max(...loops.map((l) => l.nestingDepth)) >= 1) algos.push('Brute Force');

  if (/dp|memo|cache|tabul|top.?down|bottom.?up/i.test(source)) algos.push('Dynamic Programming');

  if (patterns.hasImplicitLoops) algos.push('Functional Iteration');

  if (algos.length === 0) {
    if (loops.length === 0 && !recursion.hasDirectRecursion) {
      algos.push('Custom Logic');
    } else if (loops.length > 0) {
      algos.push('Iteration');
    } else {
      algos.push('Custom Logic');
    }
  }

  return Array.from(new Set(algos));
}

function buildStepByStep(
  source: string,
  loops: LoopInfo[],
  recursion: RecursionInfo,
  patterns: PatternInfo
): StepByStepEntry[] {
  const steps: StepByStepEntry[] = [];
  const fn = getFunctionName(source);

  steps.push({
    step: 1,
    description: `Receive inputs passed to ${fn}.`,
  });

  if (recursion.hasDirectRecursion) {
    steps.push({
      step: 2,
      description: 'Check whether the base case (termination condition) has been reached.',
    });
    steps.push({
      step: 3,
      description: 'If not done yet, break the problem into one or more smaller subproblems.',
    });
    steps.push({
      step: 4,
      description: 'Recursively call the function on each subproblem.',
    });
    steps.push({
      step: 5,
      description: 'Combine the results from subproblems to form the final answer.',
    });
  } else if (loops.length > 0) {
    let stepNum = 2;
    const maxDepth = Math.max(...loops.map((l) => l.nestingDepth));
    if (patterns.hasLogarithmicStep) {
      steps.push({
        step: stepNum++,
        description: 'Initialize pointers (or bounds) that define the current search range.',
      });
      steps.push({
        step: stepNum++,
        description: 'Check the middle element and compare it with the target.',
      });
      steps.push({
        step: stepNum++,
        description: 'If matched, return the result. Otherwise, narrow the range to the left or right half.',
      });
      steps.push({
        step: stepNum++,
        description: 'Repeat until the target is found or the range is exhausted.',
      });
    } else if (maxDepth >= 1) {
      steps.push({
        step: stepNum++,
        description: `Start the outer loop, iterating over each of the ${maxDepth + 1} nested levels.`,
      });
      steps.push({
        step: stepNum++,
        description: 'For each outer iteration, the inner loop runs through its own iteration range.',
      });
      steps.push({
        step: stepNum++,
        description: 'At the innermost level, perform the core unit of work (comparison, swap, accumulation, etc.).',
      });
    } else {
      steps.push({
        step: stepNum++,
        description: 'Initialize any accumulators or pointers needed by the loop.',
      });
      steps.push({
        step: stepNum++,
        description: 'Traverse the input element by element, updating state on each iteration.',
      });
      steps.push({
        step: stepNum++,
        description: 'After the loop finishes, return the computed result.',
      });
    }
  } else {
    steps.push({
      step: 2,
      description: 'Run the sequential statements without iteration or recursion.',
    });
    steps.push({
      step: 3,
      description: 'Return the computed value once all statements complete.',
    });
  }

  return steps;
}

function deriveBestCase(base: ComplexityClass, patterns: PatternInfo, loops: LoopInfo[]): ComplexityClass {
  if (loops.some((l) => l.hasEarlyBreak)) {
    if (base === 'O(n)' || base === 'O(n log n)') return 'O(1)';
    if (base === 'O(n²)') return 'O(n)';
  }
  if (patterns.hasLogarithmicStep && base === 'O(log n)') return 'O(1)';
  return base;
}

function deriveAverageCase(base: ComplexityClass): ComplexityClass {
  return base;
}

function buildComplexityDerivation(
  baseComplexity: ComplexityClass,
  loops: LoopInfo[],
  recursion: RecursionInfo,
  patterns: PatternInfo,
  stdlibCalls: StdlibCallInfo[]
): ComplexityDerivationStep[] {
  const steps: ComplexityDerivationStep[] = [];
  let stepNum = 1;

  if (recursion.hasDirectRecursion || recursion.hasMutualRecursion) {
    steps.push({
      step: stepNum++,
      description: 'The function calls itself recursively, so work is spread across multiple stack frames.',
    });
    if (patterns.hasDivideAndConquer) {
      steps.push({
        step: stepNum++,
        description: 'Each call splits the input into roughly two equal halves.',
        math: 'split: n → n/2',
      });
      steps.push({
        step: stepNum++,
        description: 'This creates log n levels of recursion depth.',
        math: 'depth = log₂(n)',
      });
      steps.push({
        step: stepNum++,
        description: 'Every level still processes n total elements across all subproblems.',
        math: 'work per level = n',
      });
      steps.push({
        step: stepNum++,
        description: 'Multiplying depth by work per level gives the overall cost.',
        math: 'n × log n = O(n log n)',
      });
    } else {
      steps.push({
        step: stepNum++,
        description: 'Each recursive call spawns roughly two new recursive calls (no obvious split pattern).',
        math: 'branching factor ≈ 2',
      });
      steps.push({
        step: stepNum++,
        description: 'This doubles the number of calls at every level of the call tree.',
        math: '1 → 2 → 4 → 8 → 16 → …',
      });
      steps.push({
        step: stepNum++,
        description: 'After n levels the tree contains an exponential number of nodes.',
        math: 'O(2ⁿ)',
      });
    }
    return steps;
  }

  if (loops.length === 0) {
    steps.push({
      step: stepNum++,
      description: 'There are no loops and no recursive calls in the code.',
    });
    steps.push({
      step: stepNum++,
      description: 'Every statement runs at most once, independent of input size.',
    });
    steps.push({
      step: stepNum++,
      description: 'Work remains constant regardless of how large the input grows.',
      math: 'constant = O(1)',
    });
    return steps;
  }

  const sortCallsInside = loops.filter((l) => l.hasSortCall);
  if (sortCallsInside.length > 0 || stdlibCalls.some((c) => c.complexity === 'O(n log n)')) {
    const maxDepth = Math.max(...loops.map((l) => l.nestingDepth));
    steps.push({
      step: stepNum++,
      description: `A sorting step is executed inside the loop body (${maxDepth + 1} level${maxDepth > 0 ? 's' : ''} of nesting).`,
    });
    steps.push({
      step: stepNum++,
      description: 'Sorting itself takes O(n log n) comparisons and swaps.',
      math: 'sort = O(n log n)',
    });
    if (maxDepth > 0) {
      steps.push({
        step: stepNum++,
        description: `Surrounding loops multiply this cost by a factor of n^${maxDepth}.`,
        math: `n^${maxDepth} × n log n`,
      });
    }
    steps.push({
      step: stepNum++,
      description: 'Combining these terms yields the final complexity.',
      math: baseComplexity,
    });
    return steps;
  }

  const maxNesting = Math.max(...loops.map((l) => l.nestingDepth));
  if (patterns.hasLogarithmicStep) {
    steps.push({
      step: stepNum++,
      description: 'The loop advances by a multiplicative step (e.g. i *= 2) rather than simple increment.',
    });
    steps.push({
      step: stepNum++,
      description: 'This halves the remaining work on every iteration.',
      math: 'n, n/2, n/4, n/8, …',
    });
    steps.push({
      step: stepNum++,
      description: 'How many times can we halve n before hitting 1? Exactly log₂(n) times.',
      math: 'iterations = log₂(n)',
    });
    steps.push({
      step: stepNum++,
      description: 'Each iteration does constant work inside, so the total stays logarithmic.',
      math: 'log n × 1 = O(log n)',
    });
    return steps;
  }

  if (maxNesting === 0) {
    const linearLoops = loops.filter((l) => l.nestingDepth === 0).length;
    steps.push({
      step: stepNum++,
      description: `There ${linearLoops === 1 ? 'is' : 'are'} ${linearLoops} loop${linearLoops > 1 ? 's' : ''} with no nested children.`,
    });
    steps.push({
      step: stepNum++,
      description: `Each loop runs roughly n times; sequential loops add rather than multiply.`,
      math: linearLoops > 1 ? `${linearLoops} × n` : 'loop runs n times',
    });
    steps.push({
      step: stepNum++,
      description: 'Inside each iteration a constant amount of work occurs.',
      math: 'work per iteration = O(1)',
    });
    steps.push({
      step: stepNum++,
      description: 'Dropping the constant multiplier leaves a linear bound.',
      math: linearLoops > 1 ? `${linearLoops}n → O(n)` : 'n × 1 = O(n)',
    });
    return steps;
  }

  steps.push({
    step: stepNum++,
    description: `Loops are nested ${maxNesting + 1} levels deep (counting from 1).`,
  });
  for (let d = 0; d <= maxNesting; d++) {
    const count = loops.filter((l) => l.nestingDepth === d).length;
    steps.push({
      step: stepNum++,
      description: `Depth ${d + 1}: ${count} loop${count > 1 ? 's' : ''} each iterating ~n time${count > 1 ? 's' : ''}.`,
    });
  }
  const factors = Array(maxNesting + 1).fill('n').join(' × ');
  const polynomialLabel = maxNesting + 1 === 2
    ? 'O(n²)'
    : maxNesting + 1 === 3
    ? 'O(n³)'
    : maxNesting + 1 === 4
    ? 'O(n⁴)'
    : `O(n^${maxNesting + 1})`;
  steps.push({
    step: stepNum++,
    description: 'Because the loops are nested, their ranges multiply together.',
    math: factors,
  });
  steps.push({
    step: stepNum++,
    description: `Multiplying gives a polynomial of degree ${maxNesting + 1}.`,
    math: polynomialLabel,
  });

  return steps;
}

function buildLoopAnalysis(loops: LoopInfo[]): LoopAnalysisEntry[] {
  return loops.map((loop, i) => {
    const number = i + 1;
    let purpose = 'Iterate over input';
    const body = (loop.headerText + loop.bodyText).toLowerCase();
    if (/sort|swap|bubble/.test(body)) purpose = 'Perform sorting passes / swaps';
    else if (/search|target|find|indexOf/.test(body)) purpose = 'Search for a target value';
    else if (/sum|total|count|\+=/.test(body)) purpose = 'Accumulate values (sum / count)';
    else if (/pair|combin|nested|j\s*<\s*n/.test(body)) purpose = 'Visit all pairs of indices';
    else if (/binary|mid|middle/.test(body)) purpose = 'Halve the search space';
    else if (loop.hasSortCall) purpose = 'Run a sort call within a loop';
    else if (loop.nestingDepth > 0) purpose = 'Inner iteration nested within an outer loop';

    let iterations = '~n iterations';
    if (/log|mid|\*=\s*2|\/=\s*2/.test(body)) iterations = '~log n iterations';
    else if (loop.nestingDepth === 1) iterations = 'n iterations per outer step';
    else if (loop.nestingDepth === 2) iterations = 'n iterations per middle step';

    const powers = ['O(n)', 'O(n²)', 'O(n³)', 'O(n⁴)'];
    const contrib = loop.nestingDepth < powers.length
      ? powers[loop.nestingDepth] + ' factor'
      : `n^${loop.nestingDepth + 1} factor`;

    return {
      loopNumber: number,
      purpose,
      iterations,
      contribution: contrib,
      startLine: loop.startLine,
      endLine: loop.endLine,
      nestingDepth: loop.nestingDepth,
    };
  });
}

function buildRecursiveAnalysis(source: string, recursion: RecursionInfo, patterns: PatternInfo, baseComplexity: ComplexityClass): RecursiveAnalysis {
  if (!recursion.hasDirectRecursion && !recursion.hasMutualRecursion) {
    return { hasRecursion: false };
  }
  const fnNames = recursion.recursiveFunctions.map((r: { name: string }) => r.name);
  const firstFn = fnNames[0] || getFunctionName(source);

  let baseCase = 'No explicit base case detected';
  if (/n\s*<=\s*1|n\s*===\s*0|n\s*===\s*1|n\s*<\s*2/.test(source)) baseCase = `n ≤ 1 (e.g. ${firstFn}(0) or ${firstFn}(1))`;
  else if (/if.*return|base.?case/.test(source)) baseCase = 'A conditional return inside the function prevents further recursion';

  let recursiveRelation = `${firstFn}(n) calls itself on a smaller input`;
  if (recursion.hasMutualRecursion) {
    recursiveRelation = fnNames.join(' ↔ ') + ' call each other mutually';
  }

  const depth = patterns.hasDivideAndConquer ? 'log n levels' : 'Potentially n levels (branching recursion)';
  const recurrence = patterns.hasDivideAndConquer
    ? 'T(n) = 2T(n/2) + O(n) (typical divide-and-conquer)'
    : baseComplexity === 'O(2ⁿ)'
    ? 'T(n) = T(n−1) + T(n−2) + O(1) (fibonacci-style)'
    : 'T(n) depends on the exact recursive branching pattern';

  return {
    hasRecursion: true,
    baseCase,
    recursiveRelation,
    recursionDepth: depth,
    recurrence,
    contributionToComplexity: recursion.hasDirectRecursion
      ? `Each recursive call adds ${patterns.hasDivideAndConquer ? 'a divide-and-conquer factor' : 'an exponential multiplier'} to the runtime.`
      : 'Mutual recursion multiplies call counts between participating functions.',
  };
}

function buildMemoryUsage(
  source: string,
  loops: LoopInfo[],
  recursion: RecursionInfo,
  _patterns: PatternInfo,
  config: LanguageConfig,
  spaceClass: ComplexityClass
): MemoryUsageEntry[] {
  const usage: MemoryUsageEntry[] = [];

  if (recursion.hasDirectRecursion || recursion.hasMutualRecursion) {
    usage.push({
      name: 'Call stack (recursion)',
      type: 'RecursionStack',
      affectsComplexity: spaceClass !== 'O(1)',
      note: recursion.hasDirectRecursion
        ? 'Each recursive call pushes a frame; depth is bounded by recursion depth.'
        : 'Mutually recursive functions can push many frames before hitting a base case.',
    });
  }

  for (const containerType of config.hashContainerTypes) {
    const simple = containerType.split('::').pop() || containerType;
    if (new RegExp(`\\b${simple}\\b`).test(source)) {
      usage.push({
        name: simple,
        type: 'HashMap',
        affectsComplexity: false,
        note: `${simple} is used; average access is O(1) so it typically doesn't increase complexity.`,
      });
      break;
    }
  }

  if (/\barr\b|Array|vector|Vec|list\[\]|List<|\.sort\(|new Array|\[\]/.test(source)) {
    usage.push({
      name: 'Input / temporary arrays',
      type: 'Array',
      affectsComplexity: false,
      note: 'Arrays and vectors are indexed in O(1). Only copying or growing them affects space.',
    });
  }

  if (loops.length > 0) {
    usage.push({
      name: 'Loop variables / accumulators',
      type: 'Other',
      affectsComplexity: false,
      note: 'Scalars (counters, totals, pointers) take constant auxiliary space.',
    });
  }

  if (/new |malloc|alloc|push_back|append|push\s*\(/.test(source)) {
    usage.push({
      name: 'Dynamic allocations',
      type: 'Dynamic',
      affectsComplexity: /map|slice|splice|filter/.test(source),
      note: 'Look out for operations that produce fresh copies inside loops.',
    });
  }

  return usage;
}

function buildPerformanceNotes(
  loops: LoopInfo[],
  recursion: RecursionInfo,
  patterns: PatternInfo,
  stdlibCalls: StdlibCallInfo[]
): string[] {
  const notes: string[] = [];

  const maxNesting = loops.length > 0 ? Math.max(...loops.map((l) => l.nestingDepth)) : 0;
  if (maxNesting >= 1) notes.push(`Uses ${maxNesting + 1}× nested loops — runtime grows polynomially with input size.`);
  if (patterns.hasSortCalls || stdlibCalls.some((c) => c.complexity === 'O(n log n)')) {
    notes.push('Sorting dominates the runtime for large inputs.');
  }
  if (recursion.hasDirectRecursion && !patterns.hasDivideAndConquer) {
    notes.push('Branching recursion can overflow the call stack on large inputs.');
  }
  if (loops.length > 1 && maxNesting === 0) notes.push('Multiple sequential passes over the data.');
  if (loops.some((l) => l.hasEarlyBreak)) notes.push('Some loops exit early — best case can be significantly better.');
  if (loops.some((l) => l.hasUnknownFunctionCalls.length > 0)) {
    notes.push('Contains calls to functions whose inner complexity is unknown; real cost may be higher.');
  }
  if (loops.some((l) => l.hasHashContainerAccess)) {
    notes.push('Hash container access is average O(1), but worst-case collisions can degrade performance.');
  }
  if (patterns.hasImplicitLoops) notes.push('Uses implicit iteration helpers (e.g. map, forEach) — good readability, same algorithmic cost.');

  return notes;
}

function buildPossibleOptimizations(
  loops: LoopInfo[],
  recursion: RecursionInfo,
  patterns: PatternInfo,
  baseComplexity: ComplexityClass,
  timeConfidence: number
): string[] {
  const opts: string[] = [];
  const maxNesting = loops.length > 0 ? Math.max(...loops.map((l) => l.nestingDepth)) : 0;

  if (recursion.hasDirectRecursion && !patterns.hasTailRecursion && baseComplexity === 'O(2ⁿ)') {
    opts.push('Add memoization (DP top-down) or convert to iterative DP to drop exponential recursion to O(n).');
    opts.push('Improve recursion with iteration + explicit stack to reduce call-stack overhead.');
  }

  if (maxNesting >= 1 && !patterns.hasSortCalls) {
    if (/pair|combin|two.*sum|3sum|nested/i.test((loops.map(l=>l.bodyText).join('')).toLowerCase())) {
      opts.push('Replace nested pairs loop with HashMap lookup or Two Pointers: O(n²) → O(n) or O(n log n).');
    } else {
      opts.push('Consider HashMap / Two Pointers to avoid redundant nested scans.');
    }
  }

  if (maxNesting >= 1 && patterns.hasSortCalls) {
    opts.push('Sort once before the loop instead of sorting inside the loop body.');
  }

  if (patterns.hasLogarithmicStep === false && loops.length > 0 && /search|target|find|indexOf/i.test((loops.map(l=>l.headerText+l.bodyText).join('')))) {
    opts.push('If the input is (or can be) sorted, use Binary Search: O(n) → O(log n).');
  }

  if (loops.length > 1 && maxNesting === 0) {
    opts.push('Fold sequential passes into a single traversal where possible.');
  }

  if (loops.some((l) => l.bodyText.includes('.sort(') || patterns.hasSortCalls) && !recursion.hasDirectRecursion) {
    opts.push('Avoid repeatedly sorting slices; sort the full array once up-front.');
  }

  if (loops.some((l) => l.hasUnknownFunctionCalls.length > 0)) {
    opts.push('Analyze (or inline) the unknown function calls to verify they are O(1).');
  }

  if (opts.length === 0 && timeConfidence >= 85) {
    opts.push('The current implementation is already close to optimal.');
  } else if (opts.length === 0) {
    opts.push('Profile real-world data; algorithm choice may depend on input distribution.');
  }

  return opts;
}

function getDifficulty(baseComplexity: ComplexityClass, patterns: PatternInfo, recursion: RecursionInfo): 'Easy' | 'Medium' | 'Hard' {
  const hard = ['O(n³)', 'O(n³ log n)', 'O(2ⁿ)'];
  const medium = ['O(n²)', 'O(n² log n)', 'O(n log n)'];

  if (hard.includes(baseComplexity)) return 'Hard';
  if (medium.includes(baseComplexity)) {
    if (recursion.hasMutualRecursion || (recursion.hasDirectRecursion && !patterns.hasDivideAndConquer)) return 'Hard';
    return 'Medium';
  }
  if (baseComplexity === 'O(n)') {
    return patterns.hasSortCalls || recursion.hasDirectRecursion ? 'Medium' : 'Easy';
  }
  if (baseComplexity === 'O(log n)') return 'Easy';
  return 'Easy';
}

export function buildDetailedAnalysis(
  source: string,
  baseResult: {
    timeComplexity: ComplexityClass;
    timeConfidence: number;
    spaceComplexity: { class: ComplexityClass; reasoning: string[] };
    loops: LoopInfo[];
    recursion: RecursionInfo;
    patterns: PatternInfo;
    stdlibCalls: StdlibCallInfo[];
    detectedLanguage: SupportedLanguage;
  }
): DetailedAnalysis {
  const config = LANGUAGE_CONFIGS[baseResult.detectedLanguage];
  const worst = baseResult.timeComplexity;
  const avg = deriveAverageCase(worst);
  const best = deriveBestCase(worst, baseResult.patterns, baseResult.loops);
  const algoList = detectAlgorithms(source, baseResult.loops, baseResult.recursion, baseResult.patterns, baseResult.stdlibCalls);

  return {
    programmingLanguage: LANGUAGE_DISPLAY_NAMES[baseResult.detectedLanguage],
    highLevelSummary: summarize(source, baseResult.loops, baseResult.recursion, baseResult.patterns, worst),
    algorithmUsed: algoList,
    stepByStepExecution: buildStepByStep(source, baseResult.loops, baseResult.recursion, baseResult.patterns),
    timeComplexity: {
      worst,
      average: avg,
      best,
    },
    spaceComplexity: {
      auxiliary: baseResult.spaceComplexity.class,
    },
    complexityDerivation: buildComplexityDerivation(
      worst,
      baseResult.loops,
      baseResult.recursion,
      baseResult.patterns,
      baseResult.stdlibCalls
    ),
    loopAnalysis: buildLoopAnalysis(baseResult.loops),
    recursiveAnalysis: buildRecursiveAnalysis(source, baseResult.recursion, baseResult.patterns, worst),
    memoryUsage: buildMemoryUsage(source, baseResult.loops, baseResult.recursion, baseResult.patterns, config, baseResult.spaceComplexity.class),
    performanceNotes: buildPerformanceNotes(baseResult.loops, baseResult.recursion, baseResult.patterns, baseResult.stdlibCalls),
    possibleOptimizations: buildPossibleOptimizations(
      baseResult.loops,
      baseResult.recursion,
      baseResult.patterns,
      worst,
      baseResult.timeConfidence
    ),
    finalResult: {
      programmingLanguage: LANGUAGE_DISPLAY_NAMES[baseResult.detectedLanguage],
      algorithm: algoList.join(' + '),
      worstTime: worst,
      averageTime: avg,
      bestTime: best,
      space: baseResult.spaceComplexity.class,
      difficulty: getDifficulty(worst, baseResult.patterns, baseResult.recursion),
    },
  };
}
