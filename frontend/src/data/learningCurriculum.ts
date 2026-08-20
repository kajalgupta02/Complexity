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
    title: 'Foundations of Big-O Notation',
    slug: 'asymptotic-notation-foundations',
    category: 'Fundamentals',
    difficulty: 'Beginner',
    complexity: 'Theory',
    estimatedMinutes: 6,
    xpReward: 100,
    description: 'Understand how Big-O describes algorithmic growth rates and why constants and minor terms drop.',
    whatItMeans: 'Big-O notation is a standardized way to describe how the execution time or memory of a program scales as the input size n becomes very large.',
    simpleExample: 'If a rocket travels to Mars, the weight of the astronaut’s keychain doesn’t matter. In Big-O, we only care about the dominant factor that drives the workload.',
    codeExample: {
      language: 'javascript',
      code: `// T(n) = 3n + 5 operations -> O(n)
function findTarget(arr, target) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === target) {
      return i; // Found target
    }
  }
  return -1; // Not found
}`,
      explanation: 'Even though there are constant setup steps, the loop runs up to n times. For large inputs, n dominates everything else.',
    },
    whyItHasThatComplexity: 'Because constants and lower-order terms (like +5 or a coefficient of 3) become negligible when n is in the millions. We simplify 3n + 5 to O(n).',
    whereCommonlySeen: [
      'Comparing sorting and searching algorithms',
      'Technical interview problem constraints',
      'API scaling and database query optimization',
    ],
    interviewTip: 'Always state the worst-case time complexity first, then mention best or average cases if asked by your interviewer.',
    theory: [
      'Big-O notation describes the upper bound (worst-case scenario) of an algorithm’s time or memory growth as the input size n approaches infinity.',
      'Constants and low-order terms are ignored because for huge inputs (e.g., n = 1,000,000), 5n + 100 is fundamentally driven by n.',
      'Big-Omega (Ω) describes the lower bound (best-case), while Big-Theta (Θ) gives a tight bound where best and worst asymptotic curves match.',
    ],
    keyTakeaways: [
      'Big-O = Worst-case upper bound',
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
    title: 'Constant Time O(1) & Direct Lookups',
    slug: 'constant-time-direct-addressing',
    category: 'Time Complexity',
    difficulty: 'Beginner',
    complexity: 'O(1)',
    estimatedMinutes: 5,
    xpReward: 120,
    description: 'Learn how direct memory indexing and hash table lookups execute in fixed time regardless of dataset size.',
    whatItMeans: 'The execution time does not depend on the input size. Whether your dataset contains 10 items or 10,000,000 items, the operation takes the exact same amount of time.',
    simpleExample: 'Looking at the page number written in the corner of an open book. It takes one glance regardless of whether the book has 50 pages or 1,000 pages.',
    codeExample: {
      language: 'javascript',
      code: `// O(1) Time | O(1) Space
function getFirstElement(arr) {
  return arr[0]; // Instant index access
}

// O(1) Time Average
function isUserLoggedIn(userMap, userId) {
  return userMap.has(userId); // Hash table lookup
}`,
      explanation: 'Accessing arr[0] or looking up a key in a Map jumps directly to the memory address in a single step without looping through other elements.',
    },
    whyItHasThatComplexity: 'There are no loops or recursive calls that grow with n. The computer computes the target memory address directly in one calculation.',
    whereCommonlySeen: [
      'Array indexing (arr[i])',
      'Hash Map and Hash Set lookups (map.get(key))',
      'Pushing or popping from a stack (arr.push(), arr.pop())',
      'Basic arithmetic and bitwise checks',
    ],
    interviewTip: 'Using a Hash Map to convert an O(n) search into an O(1) lookup is the #1 most common optimization technique in coding interviews.',
    theory: [
      'An algorithm runs in O(1) constant time if execution time does not depend on the input size n.',
      'Array index indexing arr[i] calculates the memory address directly: BaseAddress + (i * ElementSize) in one clock cycle.',
      'Hash table lookups average O(1) using hash functions to jump directly to memory buckets.',
    ],
    keyTakeaways: [
      'Array random access and hash map lookups are O(1) average time',
      'No loops or recursive calls that scale with input size',
      'Constant time is the gold standard of algorithmic efficiency',
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
    title: 'Logarithmic Time O(log n) & Binary Search',
    slug: 'logarithmic-time-binary-search',
    category: 'Time Complexity',
    difficulty: 'Intermediate',
    complexity: 'O(log n)',
    estimatedMinutes: 8,
    xpReward: 150,
    description: 'Master how binary search and divide-and-conquer strategies cut problem sizes in half at each step.',
    whatItMeans: 'The number of operations grows by only one extra step every time the input size doubles. It is extremely fast and scalable for massive datasets.',
    simpleExample: 'Guessing a number between 1 and 100 with "higher/lower" hints. By guessing 50 first, you immediately eliminate 50 wrong numbers in a single question.',
    codeExample: {
      language: 'javascript',
      code: `// O(log n) Time | O(1) Space
function binarySearch(sortedArr, target) {
  let low = 0;
  let high = sortedArr.length - 1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (sortedArr[mid] === target) return mid;
    if (sortedArr[mid] < target) low = mid + 1; // Discard left half
    else high = mid - 1; // Discard right half
  }
  return -1;
}`,
      explanation: 'At every iteration of the loop, the remaining search space is divided by 2. For an array of 1,000,000 items, it takes at most ~20 comparisons.',
    },
    whyItHasThatComplexity: 'Because halving the input repeatedly until reaching 1 takes log₂(n) steps. For example, 16 → 8 → 4 → 2 → 1 is 4 steps (since 2⁴ = 16).',
    whereCommonlySeen: [
      'Binary Search on sorted collections',
      'Balanced Binary Search Trees (AVL, Red-Black Trees)',
      'Divide-and-conquer problem reduction',
    ],
    interviewTip: 'Whenever an interview question mentions a sorted array and asks for an efficient search, immediately consider Binary Search O(log n).',
    theory: [
      'Logarithmic algorithms reduce the remaining input size by a constant factor (typically 2) at every iteration.',
      'If you have 1,000,000 items, log₂(1,000,000) is only ~20 operations! If you double to 2,000,000 items, it only takes 21 operations.',
      'Whenever a loop step multiplies or divides the loop counter (e.g. i *= 2 or n = Math.floor(n / 2)), the complexity is O(log n).',
    ],
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
    title: 'Linear Time O(n) & Single Passes',
    slug: 'linear-time-two-pointers',
    category: 'Time Complexity',
    difficulty: 'Intermediate',
    complexity: 'O(n)',
    estimatedMinutes: 7,
    xpReward: 140,
    description: 'Learn how single-pass scans and two-pointer techniques process data in direct linear proportion to n.',
    whatItMeans: 'The amount of work grows in direct proportion to the size of the input. If the input size doubles, the execution time roughly doubles.',
    simpleExample: 'Reading a book page by page: if the book has 300 pages, you turn the page 300 times.',
    codeExample: {
      language: 'javascript',
      code: `// O(n) Time | O(1) Space
function printAllElements(arr) {
  for (let i = 0; i < arr.length; i++) {
    console.log(arr[i]);
  }
}

// O(n) Time - Finding Maximum
function findMax(arr) {
  let max = arr[0];
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] > max) max = arr[i];
  }
  return max;
}`,
      explanation: 'The loop runs approximately n times, visiting each element once in sequence, so the time complexity is O(n).',
    },
    whyItHasThatComplexity: 'Because there is a single loop that iterates once for every item in the input array of length n.',
    whereCommonlySeen: [
      'Single for / while loops over arrays or strings',
      'Linear search for an unsorted element',
      'Counting elements or summing values in an array',
      'Sliding window and two-pointer algorithms',
    ],
    interviewTip: 'When optimizing an algorithm from O(n²), aiming for a single linear O(n) pass with a Hash Map is often the intended interview solution.',
    theory: [
      'O(n) time means runtime grows directly in proportion to input size: doubling n doubles the execution time.',
      'Single loops over arrays, linked list traversals, and string scans are classic O(n) structures.',
      'The two-pointer technique allows searching pairs in sorted arrays in O(n) time instead of the naive nested loop O(n²).',
    ],
    keyTakeaways: [
      'Single loops over collections run in O(n) linear time',
      'Two pointers in sorted arrays reduce quadratic searches O(n²) to linear O(n)',
      'Linear time algorithms process large real-time datasets easily',
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
    description: 'Discover why comparison-based sorting takes O(n log n) time and how Merge Sort and Quick Sort work.',
    whatItMeans: 'The algorithm breaks the problem down into log n levels of recursion, and performs O(n) work across each level. It is slightly slower than linear O(n), but vastly faster than quadratic O(n²).',
    simpleExample: 'Organizing a deck of cards by repeatedly splitting the deck in half, sorting the small piles, and merging them back together.',
    codeExample: {
      language: 'javascript',
      code: `// O(n log n) Time | O(n) Space
function mergeSort(arr) {
  if (arr.length <= 1) return arr;
  const mid = Math.floor(arr.length / 2);
  const left = mergeSort(arr.slice(0, mid)); // log n levels
  const right = mergeSort(arr.slice(mid));
  return merge(left, right); // O(n) work per level
}`,
      explanation: 'The array is split in half across log₂(n) levels. At every level, merging the elements back together takes O(n) comparisons. Total time = n × log n.',
    },
    whyItHasThatComplexity: 'Because there are log n levels of recursion (due to halving), and at each level, a total of n items are inspected and merged.',
    whereCommonlySeen: [
      'Standard library sorting algorithms (Array.prototype.sort, Python sorted())',
      'Merge Sort, Quick Sort (average case), Heap Sort',
      'Divide-and-conquer tree algorithms',
    ],
    interviewTip: 'Remember that any general comparison-based sort has a theoretical lower bound of O(n log n). You cannot sort arbitrary items faster without special assumptions (like Counting Sort).',
    theory: [
      'O(n log n) algorithms typically divide the input into log(n) tree levels, performing O(n) work across each level.',
      'By information theory, any comparison-based sort must make at least log₂(n!) ≈ n log₂(n) comparisons in the worst case.',
      'Merge Sort guarantees O(n log n) worst-case time by recursively splitting arrays in half and merging sorted sub-arrays in O(n).',
    ],
    keyTakeaways: [
      'Comparison-based sorting has a mathematical lower bound of Ω(n log n)',
      'Merge Sort achieves O(n log n) guaranteed time with O(n) auxiliary space',
      'Built-in sort functions in JavaScript, Python, Java, and C++ are O(n log n)',
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
    title: 'Quadratic Time O(n²) & Nested Loops',
    slug: 'quadratic-time-nested-loops',
    category: 'Time Complexity',
    difficulty: 'Intermediate',
    complexity: 'O(n²)',
    estimatedMinutes: 8,
    xpReward: 150,
    description: 'Learn why nested loops cause quadratic growth and how to optimize them using Hash Maps.',
    whatItMeans: 'The execution time grows proportionally to the square of the input size. If the input size doubles, the work increases by 4 times (2² = 4).',
    simpleExample: 'Shaking hands with everyone in a room of n people. If there are 10 people, there are 45 handshakes. If there are 100 people, there are 4,950 handshakes!',
    codeExample: {
      language: 'javascript',
      code: `// SLOW: O(n²) Time - Two Nested Loops
function hasDuplicateNaive(arr) {
  for (let i = 0; i < arr.length; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      if (arr[i] === arr[j]) return true; // n × n checks
    }
  }
  return false;
}

// OPTIMIZED: O(n) Time | O(n) Space - Hash Set
function hasDuplicateOptimized(arr) {
  const seen = new Set();
  for (const item of arr) {
    if (seen.has(item)) return true; // O(1) check
    seen.add(item);
  }
  return false;
}`,
      explanation: 'The naive version has an inner loop that runs for each iteration of the outer loop, resulting in approximately n × n operations. The optimized version uses a Set to finish in O(n) time.',
    },
    whyItHasThatComplexity: 'Your code contains two nested loops. The inner loop executes n times for each of the n iterations of the outer loop, yielding n × n = n² operations.',
    whereCommonlySeen: [
      'Naive bubble sort, selection sort, and insertion sort',
      'Nested loops comparing every pair of items in an array',
      '2D grid / matrix traversals of size n × n',
    ],
    interviewTip: 'When an interviewer sees two nested loops, their first question will almost always be: "Can you optimize this using extra space?"',
    theory: [
      'Quadratic time O(n²) occurs when an algorithm performs an inner loop of size n for every element of an outer loop of size n.',
      'If n = 1,000, n² = 1,000,000 operations. If n = 100,000, n² = 10,000,000,000 operations (often causing browser tab freezes or server timeouts).',
      'Most O(n²) lookups can be refactored to O(n) time by trading memory for speed with a Hash Set or Hash Map.',
    ],
    keyTakeaways: [
      'Two nested loops dependent on input length yield O(n²)',
      'Use a Hash Map / Set to trade O(n) space for O(n) time',
      'Refactoring O(n²) to O(n) can turn a 10-second delay into a 2-millisecond response',
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
    title: 'Space Complexity: Auxiliary Heap vs Call Stack',
    slug: 'space-complexity-memory-profiling',
    category: 'Space Complexity',
    difficulty: 'Advanced',
    complexity: 'Memory',
    estimatedMinutes: 10,
    xpReward: 180,
    description: 'Learn how to calculate auxiliary memory, account for recursive stack frames, and optimize memory usage.',
    whatItMeans: 'Space complexity describes how much additional memory (RAM) an algorithm allocates as the input size n increases.',
    simpleExample: 'Making a photocopy of a 500-page book requires 500 blank sheets of paper (O(n) extra space). Reading the book with a bookmark requires just 1 bookmark (O(1) extra space).',
    codeExample: {
      language: 'javascript',
      code: `// O(n) Auxiliary Space on Call Stack
function recursiveSum(n) {
  if (n <= 1) return 1;
  return n + recursiveSum(n - 1); // n recursive stack frames
}

// O(1) Auxiliary Space - In-place accumulator
function iterativeSum(n) {
  let total = 0; // Only 1 variable allocated
  for (let i = 1; i <= n; i++) total += i;
  return total;
}`,
      explanation: 'The recursive function creates n call stack frames in memory before returning, consuming O(n) space. The iterative function uses a single variable in O(1) constant space.',
    },
    whyItHasThatComplexity: 'Because each recursive function call allocates a new stack frame containing local variables and return addresses until the base case is reached.',
    whereCommonlySeen: [
      'Creating auxiliary arrays, maps, or trees',
      'Recursive algorithms that build deep call stacks (DFS, QuickSort)',
      'Dynamic Programming tables (2D grid vs 1D array optimization)',
    ],
    interviewTip: 'Always clarify whether the interviewer is asking for total space (including the input data) or auxiliary space (only the extra memory your algorithm creates).',
    theory: [
      'Total Space Complexity = Input Space + Auxiliary Space (extra memory allocated by the algorithm).',
      'When analyzing an algorithm, computer scientists focus primarily on Auxiliary Space.',
      'Every recursive call adds a stack frame to the CPU call stack containing function parameters and local variables.',
      'A recursive function with depth d uses at least O(d) call stack space, which can trigger "Maximum call stack size exceeded" (stack overflow).',
    ],
    keyTakeaways: [
      'Auxiliary space measures extra memory beyond the input itself',
      'Recursion depth directly consumes CPU stack memory: depth d -> O(d) space',
      'Iterative loops or in-place mutations preserve O(1) constant memory',
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
