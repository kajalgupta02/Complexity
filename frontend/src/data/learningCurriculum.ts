import type { LearningLesson, Badge } from '@/types/auth';

export const BADGES: Badge[] = [
  {
    id: 'first_analysis',
    name: 'Complexity Explorer',
    icon: '🔍',
    description: 'Ran your first Big-O code complexity analysis',
  },
  {
    id: 'o1_master',
    name: 'Constant Hero',
    icon: '⚡',
    description: 'Mastered O(1) constant time data structures and lookup optimization',
  },
  {
    id: 'log_wizard',
    name: 'Binary Searcher',
    icon: '🌲',
    description: 'Mastered O(log n) divide and conquer logarithmic reduction',
  },
  {
    id: 'linear_architect',
    name: 'Linear Vanguard',
    icon: '📈',
    description: 'Converted quadratic nested loops into linear O(n) passes',
  },
  {
    id: 'recursion_tamer',
    name: 'Recursion Master',
    icon: '🌀',
    description: 'Understood call stack expansion and recurrence relation solving',
  },
  {
    id: 'space_guardian',
    name: 'Memory Optimizer',
    icon: '💾',
    description: 'Mastered auxiliary space allocation and in-place mutations',
  },
  {
    id: 'quiz_champion',
    name: 'Algorithmic Scholar',
    icon: '🏆',
    description: 'Scored 100% on 3 complexity quizzes',
  },
];

export const LEARNING_LESSONS: LearningLesson[] = [
  {
    id: 'lesson-1',
    title: 'Foundations of Asymptotic Notation',
    slug: 'asymptotic-notation-foundations',
    category: 'Fundamentals',
    difficulty: 'Beginner',
    complexity: 'Theory',
    estimatedMinutes: 6,
    xpReward: 100,
    description: 'Understand the mathematical basis of Big-O, Big-Omega (Ω), and Big-Theta (Θ) notations and why constants drop.',
    theory: [
      'Big-O notation describes the upper bound (worst-case scenario) of an algorithm’s time or memory growth as the input size n approaches infinity.',
      'Constants and low-order terms are ignored because for huge inputs (e.g., n = 1,000,000), 5n + 100 is fundamentally driven by n.',
      'Big-Omega (Ω) describes the lower bound (best-case), while Big-Theta (Θ) gives a tight bound where best and worst asymptotic curves match.',
    ],
    codeExample: {
      language: 'javascript',
      code: `// T(n) = 3n + 5 operations -> O(n)
function findTarget(arr, target) {
  for (let i = 0; i < arr.length; i++) { // n steps
    if (arr[i] === target) {
      return i; // Best case: index 0 -> Ω(1)
    }
  }
  return -1; // Worst case: target absent -> O(n)
}`,
      explanation: 'In this linear search, the best-case time is Ω(1) if target is at index 0, but the worst-case upper bound is O(n) if the element is not found.',
    },
    keyTakeaways: [
      'Big-O = Worst-case upper bound f(n) ≤ c · g(n) for n ≥ n₀',
      'Drop coefficients: O(2n) and O(100n) both simplify to O(n)',
      'Drop lower order terms: O(n² + 5n + 10) simplifies to O(n²)',
    ],
    quiz: [
      {
        id: 'q1-1',
        question: 'What is the simplified Big-O complexity of an algorithm that performs 12n² + 450n + 9999 operations?',
        options: ['O(n)', 'O(n²)', 'O(n³)', 'O(12n²)'],
        correctIndex: 1,
        explanation: 'In asymptotic analysis, coefficients and non-dominant terms are dropped, leaving O(n²).',
      },
      {
        id: 'q1-2',
        question: 'Which notation describes the tightest asymptotic bound where upper and lower growth rates coincide?',
        options: ['Big-O (O)', 'Big-Omega (Ω)', 'Big-Theta (Θ)', 'Little-o (o)'],
        correctIndex: 2,
        explanation: 'Big-Theta (Θ) represents an asymptotically tight bound where both upper (O) and lower (Ω) bounds match.',
      },
    ],
  },
  {
    id: 'lesson-2',
    title: 'Constant Time O(1) & Direct Addressing',
    slug: 'constant-time-direct-addressing',
    category: 'Time Complexity',
    difficulty: 'Beginner',
    complexity: 'O(1)',
    estimatedMinutes: 5,
    xpReward: 120,
    description: 'Learn how direct memory addressing, hash map key lookups, and fixed arithmetic run in true constant time regardless of dataset size.',
    theory: [
      'An algorithm runs in O(1) constant time if execution time does not depend on the input size n.',
      'Array index indexing arr[i] calculates the memory address directly: BaseAddress + (i * ElementSize) in one clock cycle.',
      'Hash table lookups average O(1) using hash functions to jump directly to memory buckets.',
    ],
    codeExample: {
      language: 'javascript',
      code: `// O(1) Time | O(1) Space
function isEven(num) {
  return (num & 1) === 0;
}

// O(1) Time Average
function getCachedUser(userMap, userId) {
  return userMap.get(userId) ?? null;
}`,
      explanation: 'Both bitwise parity check and Map lookup complete in bounded single-digit instructions irrespective of whether there are 10 or 10,000,000 users.',
    },
    keyTakeaways: [
      'Array random access and hash map lookups are O(1) average time',
      'No loops or recursive calls that grow with input size',
      'Constant time is the gold standard for performance engineering',
    ],
    quiz: [
      {
        id: 'q2-1',
        question: 'Why is accessing arr[42] in a fixed-size array an O(1) operation?',
        options: [
          'The CPU iterates 42 times quickly',
          'The memory location is computed mathematically via offset in a single step',
          'Arrays are automatically cached in RAM',
          'It depends on the total length of the array',
        ],
        correctIndex: 1,
        explanation: 'Arrays use contiguous memory. Accessing index i uses direct pointer arithmetic: base + i * size.',
      },
    ],
  },
  {
    id: 'lesson-3',
    title: 'Logarithmic Time O(log n) & Halving Search Spaces',
    slug: 'logarithmic-time-binary-search',
    category: 'Time Complexity',
    difficulty: 'Intermediate',
    complexity: 'O(log n)',
    estimatedMinutes: 8,
    xpReward: 150,
    description: 'Master how binary search, balanced binary search trees (AVL/Red-Black), and bit shifts halve the problem size at each step.',
    theory: [
      'Logarithmic algorithms reduce the remaining input size by a constant factor (typically 2) at every iteration.',
      'If you have 1,000,000 items, log₂(1,000,000) is only ~20 operations! If you double to 2,000,000 items, it only takes 21 operations.',
      'Whenever a loop step multiplies or divides the loop counter (e.g. i *= 2 or n = Math.floor(n / 2)), the complexity is O(log n).',
    ],
    codeExample: {
      language: 'javascript',
      code: `// O(log n) Time | O(1) Space
function binarySearch(sortedArr, target) {
  let low = 0;
  let high = sortedArr.length - 1;
  
  while (low <= high) {
    const mid = (low + high) >> 1; // Divide remaining space by 2
    if (sortedArr[mid] === target) return mid;
    if (sortedArr[mid] < target) low = mid + 1;
    else high = mid - 1;
  }
  return -1;
}`,
      explanation: 'Each comparison eliminates 50% of the remaining search candidates, leading to k = log₂(n) maximum iterations.',
    },
    keyTakeaways: [
      'Binary Search requires sorted collections',
      'Loop counters multiplying or dividing (i *= 2, i /= 2) take O(log n) steps',
      'Extremely scalable: handles billions of items in fewer than 35 operations',
    ],
    quiz: [
      {
        id: 'q3-1',
        question: 'Approximately how many steps does binary search take in the worst case for a sorted array of 1,048,576 (2²⁰) elements?',
        options: ['1,048,576 steps', '524,288 steps', '20 steps', '100 steps'],
        correctIndex: 2,
        explanation: 'log₂(2²⁰) = 20 steps. Each step cuts the problem in half.',
      },
    ],
  },
  {
    id: 'lesson-4',
    title: 'Linear Time O(n) & The Two-Pointer Technique',
    slug: 'linear-time-two-pointers',
    category: 'Time Complexity',
    difficulty: 'Intermediate',
    complexity: 'O(n)',
    estimatedMinutes: 7,
    xpReward: 140,
    description: 'Learn how single-pass scans, sliding windows, and two-pointer strategies process data in exact linear proportion to n.',
    theory: [
      'O(n) time means runtime grows directly in proportion to input size: doubling n doubles the execution time.',
      'Single loops over arrays, linked list traversals, and string scans are classic O(n) structures.',
      'The two-pointer technique allows searching pairs in sorted arrays in O(n) time instead of the naive nested loop O(n²).',
    ],
    codeExample: {
      language: 'javascript',
      code: `// O(n) Time | O(1) Space - Two Pointers
function twoSumSorted(arr, target) {
  let left = 0;
  let right = arr.length - 1;
  
  while (left < right) {
    const sum = arr[left] + arr[right];
    if (sum === target) return [left, right];
    if (sum < target) left++;
    else right--;
  }
  return null;
}`,
      explanation: 'At each step, either left increases or right decreases. The pointers meet after at most n total steps, avoiding nested loops.',
    },
    keyTakeaways: [
      'Two pointers in sorted arrays reduce quadratic searches O(n²) to linear O(n)',
      'Sliding windows maintain a moving range in O(n) amortized time',
      'Linear time algorithms process modern real-time streaming data effortlessly',
    ],
    quiz: [
      {
        id: 'q4-1',
        question: 'If an algorithm processes an array with a sliding window where the right pointer moves n times and the left pointer moves at most n times total, what is the time complexity?',
        options: ['O(n²)', 'O(n)', 'O(log n)', 'O(2n²)'],
        correctIndex: 1,
        explanation: 'Even though there are two pointers, each element is visited at most twice, resulting in 2n operations -> O(n).',
      },
    ],
  },
  {
    id: 'lesson-5',
    title: 'Linearithmic Time O(n log n) & Efficient Sorting',
    slug: 'linearithmic-time-sorting',
    category: 'Time Complexity',
    difficulty: 'Intermediate',
    complexity: 'O(n log n)',
    estimatedMinutes: 9,
    xpReward: 160,
    description: 'Discover the theoretical lower bound for comparison-based sorting: Merge Sort, Heap Sort, and Quick Sort.',
    theory: [
      'O(n log n) algorithms typically divide the input into log(n) tree levels, performing O(n) work across each level.',
      'By information theory, any comparison-based sort must make at least log₂(n!) ≈ n log₂(n) comparisons in the worst case.',
      'Merge Sort guarantees O(n log n) worst-case time by recursively splitting arrays in half and merging sorted sub-arrays in O(n).',
    ],
    codeExample: {
      language: 'javascript',
      code: `// O(n log n) Time | O(n) Auxiliary Space
function mergeSort(arr) {
  if (arr.length <= 1) return arr;
  const mid = Math.floor(arr.length / 2);
  const left = mergeSort(arr.slice(0, mid));
  const right = mergeSort(arr.slice(mid));
  return merge(left, right); // Linear O(n) merge
}`,
      explanation: 'The recursion tree has log₂(n) levels of depth. At each level, merging elements takes O(n) work. Total time = n · log₂(n).',
    },
    keyTakeaways: [
      'Comparison-based sorting has a mathematical lower bound of Ω(n log n)',
      'Merge Sort achieves O(n log n) guaranteed time with O(n) auxiliary space',
      'TimSort (used in Python and JavaScript V8) combines MergeSort and InsertionSort',
    ],
    quiz: [
      {
        id: 'q5-1',
        question: 'What makes Merge Sort achieve O(n log n) time complexity?',
        options: [
          'It uses a hash table for instant indexing',
          'The recursion tree has log(n) depth and each level performs O(n) merge work',
          'It iterates through the array only once',
          'It avoids any array allocations',
        ],
        correctIndex: 1,
        explanation: 'Splitting produces log₂(n) levels, and merging sorted halves at each level takes linear O(n) time.',
      },
    ],
  },
  {
    id: 'lesson-6',
    title: 'Quadratic O(n²) & How to Refactor Nested Loops',
    slug: 'quadratic-time-nested-loops',
    category: 'Time Complexity',
    difficulty: 'Intermediate',
    complexity: 'O(n²)',
    estimatedMinutes: 8,
    xpReward: 150,
    description: 'Identify accidental quadratic bottlenecks and learn how to replace nested loops with Hash Maps to achieve 100x speedups.',
    theory: [
      'Quadratic time O(n²) occurs when an algorithm performs an inner loop of size n for every element of an outer loop of size n.',
      'If n = 1,000, n² = 1,000,000 operations. If n = 100,000, n² = 10,000,000,000 operations (often causing browser tab freezes or server timeouts).',
      'Most O(n²) lookups can be refactored to O(n) time by trading memory for speed with a Hash Set or Hash Map.',
    ],
    codeExample: {
      language: 'javascript',
      code: `// SLOW: O(n²) Time
function hasDuplicateNaive(arr) {
  for (let i = 0; i < arr.length; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      if (arr[i] === arr[j]) return true;
    }
  }
  return false;
}

// FAST OPTIMIZED: O(n) Time | O(n) Space
function hasDuplicateOptimized(arr) {
  const seen = new Set();
  for (const item of arr) {
    if (seen.has(item)) return true;
    seen.add(item);
  }
  return false;
}`,
      explanation: 'The optimized version replaces the inner scan with an O(1) hash set lookup, reducing total runtime from O(n²) to O(n).',
    },
    keyTakeaways: [
      'Nested loops dependent on input length yield O(n²)',
      'Use a Hash Map / Set to trade O(n) space for O(n) time',
      'Refactoring O(n²) to O(n) turns 10-second queries into 2-millisecond responses',
    ],
    quiz: [
      {
        id: 'q6-1',
        question: 'Why does using a HashSet reduce duplicate detection from O(n²) to O(n)?',
        options: [
          'It sorts the elements automatically',
          'It replaces an O(n) inner linear search with an average O(1) hash lookup',
          'It runs on multiple CPU cores',
          'It compresses the array size',
        ],
        correctIndex: 1,
        explanation: 'Checking seen.has(x) is O(1) average time, turning n × n steps into n × 1 steps = O(n).',
      },
    ],
  },
  {
    id: 'lesson-7',
    title: 'Space Complexity: Auxiliary Heap vs Call Stack Frames',
    slug: 'space-complexity-memory-profiling',
    category: 'Space Complexity',
    difficulty: 'Advanced',
    complexity: 'Memory',
    estimatedMinutes: 10,
    xpReward: 180,
    description: 'Learn how to calculate total space vs auxiliary space, account for recursive stack frames, and optimize memory footprints.',
    theory: [
      'Total Space Complexity = Input Space + Auxiliary Space (extra memory allocated by the algorithm).',
      'When analyzing an algorithm, computer scientists focus primarily on Auxiliary Space.',
      'Every recursive call adds a stack frame to the CPU call stack containing function parameters and local variables.',
      'A recursive function with depth d uses at least O(d) call stack space, which can trigger "Maximum call stack size exceeded" (stack overflow).',
    ],
    codeExample: {
      language: 'javascript',
      code: `// O(n) Space on Call Stack
function recursiveSum(n) {
  if (n <= 1) return 1;
  return n + recursiveSum(n - 1); // Depth is n frames
}

// O(1) Space - Iterative in-place accumulator
function iterativeSum(n) {
  let total = 0; // Only one variable allocated
  for (let i = 1; i <= n; i++) total += i;
  return total;
}`,
      explanation: 'The recursive version creates n stack frames, consuming O(n) memory. The iterative version uses a single loop counter in O(1) memory.',
    },
    keyTakeaways: [
      'Auxiliary space measures extra memory beyond the input itself',
      'Recursion depth directly consumes CPU stack memory: depth d -> O(d) space',
      'Tail call optimization or iterative conversion preserves O(1) memory',
    ],
    quiz: [
      {
        id: 'q7-1',
        question: 'What is the auxiliary space complexity of standard recursive tree traversal on a balanced binary tree of n nodes with height log₂(n)?',
        options: ['O(n)', 'O(log n)', 'O(1)', 'O(n²)'],
        correctIndex: 1,
        explanation: 'The maximum simultaneous call stack depth equals the height of the tree, which is O(log n) for a balanced tree.',
      },
    ],
  },
];
