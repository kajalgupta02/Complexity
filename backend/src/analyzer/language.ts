export type SupportedLanguage =
  | 'javascript'
  | 'typescript'
  | 'java'
  | 'c'
  | 'cpp'
  | 'python'
  | 'csharp'
  | 'go'
  | 'rust'
  | 'swift'
  | 'kotlin'
  | 'php'
  | 'ruby';

export interface LanguageConfig {
  language: SupportedLanguage;
  name: string;
  fileExtensions: string[];
  implicitLoopMethods: string[];
  sortMethods: string[];
  hashContainerTypes: string[];
  knownComplexityCalls: Record<string, string>;
}

export const LANGUAGE_CONFIGS: Record<SupportedLanguage, LanguageConfig> = {
  javascript: {
    language: 'javascript',
    name: 'JavaScript',
    fileExtensions: ['.js', '.jsx'],
    implicitLoopMethods: ['forEach', 'map', 'filter', 'reduce', 'reduceRight', 'every', 'some', 'find', 'findIndex', 'flat', 'flatMap'],
    sortMethods: ['sort'],
    hashContainerTypes: ['Map', 'Set', 'WeakMap', 'WeakSet', 'Object'],
    knownComplexityCalls: {
      'Array.prototype.includes': 'O(n)',
      'Array.prototype.indexOf': 'O(n)',
      'Array.prototype.lastIndexOf': 'O(n)',
    },
  },
  typescript: {
    language: 'typescript',
    name: 'TypeScript',
    fileExtensions: ['.ts', '.tsx'],
    implicitLoopMethods: ['forEach', 'map', 'filter', 'reduce', 'reduceRight', 'every', 'some', 'find', 'findIndex', 'flat', 'flatMap'],
    sortMethods: ['sort'],
    hashContainerTypes: ['Map', 'Set', 'WeakMap', 'WeakSet', 'Object', 'Record'],
    knownComplexityCalls: {
      'Array.prototype.includes': 'O(n)',
      'Array.prototype.indexOf': 'O(n)',
      'Array.prototype.lastIndexOf': 'O(n)',
    },
  },
  csharp: {
    language: 'csharp',
    name: 'C#',
    fileExtensions: ['.cs'],
    implicitLoopMethods: ['ForEach', 'Select', 'Where', 'SelectMany', 'Aggregate', 'All', 'Any', 'OrderBy', 'GroupBy'],
    sortMethods: ['Array.Sort', 'Sort', 'OrderBy', 'OrderByDescending'],
    hashContainerTypes: ['Dictionary', 'HashSet', 'Hashtable', 'SortedDictionary', 'SortedSet', 'ConcurrentDictionary', 'Lookup'],
    knownComplexityCalls: {
      'Enumerable.Contains': 'O(n)',
      'List.Contains': 'O(n)',
      'Enumerable.Any': 'O(n)',
      'Enumerable.Where': 'O(n)',
      'Enumerable.Select': 'O(n)',
      'Enumerable.OrderBy': 'O(n log n)',
      'Enumerable.GroupBy': 'O(n)',
    },
  },
  go: {
    language: 'go',
    name: 'Go',
    fileExtensions: ['.go'],
    implicitLoopMethods: [],
    sortMethods: ['sort.Slice', 'sort.Ints', 'sort.Strings', 'sort.Float64s', 'sort.Sort'],
    hashContainerTypes: ['map'],
    knownComplexityCalls: {},
  },
  rust: {
    language: 'rust',
    name: 'Rust',
    fileExtensions: ['.rs'],
    implicitLoopMethods: ['for_each', 'map', 'filter', 'filter_map', 'fold', 'reduce', 'any', 'all', 'find', 'find_map', 'flat_map'],
    sortMethods: ['sort', 'sort_by', 'sort_by_key', 'sort_unstable'],
    hashContainerTypes: ['HashMap', 'HashSet', 'BTreeMap', 'BTreeSet', 'IndexMap'],
    knownComplexityCalls: {
      'Vec::contains': 'O(n)',
      'Slice::contains': 'O(n)',
      'Iterator::collect': 'O(n)',
    },
  },
  swift: {
    language: 'swift',
    name: 'Swift',
    fileExtensions: ['.swift'],
    implicitLoopMethods: ['forEach', 'map', 'filter', 'reduce', 'compactMap', 'flatMap', 'allSatisfy', 'contains(where:)'],
    sortMethods: ['sort', 'sorted', 'sort(by:)', 'sorted(by:)'],
    hashContainerTypes: ['Dictionary', 'Set'],
    knownComplexityCalls: {},
  },
  kotlin: {
    language: 'kotlin',
    name: 'Kotlin',
    fileExtensions: ['.kt', '.kts'],
    implicitLoopMethods: ['forEach', 'map', 'filter', 'fold', 'reduce', 'onEach', 'any', 'all', 'find', 'flatMap', 'associate'],
    sortMethods: ['sort', 'sorted', 'sortBy', 'sortedBy', 'sortDescending', 'sortedDescending'],
    hashContainerTypes: ['HashMap', 'HashSet', 'LinkedHashMap', 'LinkedHashSet', 'TreeMap', 'TreeSet', 'mutableMapOf', 'mapOf'],
    knownComplexityCalls: {},
  },
  php: {
    language: 'php',
    name: 'PHP',
    fileExtensions: ['.php'],
    implicitLoopMethods: ['array_map', 'array_filter', 'array_reduce', 'array_walk'],
    sortMethods: ['sort', 'rsort', 'asort', 'arsort', 'ksort', 'krsort', 'usort', 'array_multisort'],
    hashContainerTypes: [],
    knownComplexityCalls: {
      'in_array': 'O(n)',
      'array_search': 'O(n)',
      'count': 'O(1)',
    },
  },
  ruby: {
    language: 'ruby',
    name: 'Ruby',
    fileExtensions: ['.rb'],
    implicitLoopMethods: ['each', 'map', 'collect', 'select', 'filter', 'reduce', 'inject', 'any?', 'all?', 'find', 'detect', 'flat_map'],
    sortMethods: ['sort', 'sort_by', 'sort!', 'sort_by!'],
    hashContainerTypes: ['Hash', 'Set'],
    knownComplexityCalls: {
      'Array#include?': 'O(n)',
      'Enumerable#include?': 'O(n)',
    },
  },
  python: {
    language: 'python',
    name: 'Python',
    fileExtensions: ['.py'],
    implicitLoopMethods: [],
    sortMethods: ['.sort', 'sorted'],
    hashContainerTypes: ['dict', 'set', 'frozenset', 'defaultdict', 'OrderedDict'],
    knownComplexityCalls: {
      'list.index': 'O(n)',
      'list.count': 'O(n)',
      'bisect.bisect': 'O(log n)',
      'bisect.bisect_left': 'O(log n)',
      'bisect.bisect_right': 'O(log n)',
    },
  },
  java: {
    language: 'java',
    name: 'Java',
    fileExtensions: ['.java'],
    implicitLoopMethods: [],
    sortMethods: ['Collections.sort', 'Arrays.sort', 'List.sort'],
    hashContainerTypes: ['HashMap', 'HashSet', 'Hashtable', 'LinkedHashMap', 'LinkedHashSet', 'TreeMap', 'TreeSet', 'ConcurrentHashMap'],
    knownComplexityCalls: {
      'Collections.binarySearch': 'O(log n)',
      'Arrays.binarySearch': 'O(log n)',
    },
  },
  c: {
    language: 'c',
    name: 'C',
    fileExtensions: ['.c', '.h'],
    implicitLoopMethods: [],
    sortMethods: ['qsort'],
    hashContainerTypes: [],
    knownComplexityCalls: {
      'qsort': 'O(n log n)',
    },
  },
  cpp: {
    language: 'cpp',
    name: 'C++',
    fileExtensions: ['.cpp', '.cc', '.cxx', '.hpp', '.h'],
    implicitLoopMethods: [],
    sortMethods: ['std::sort', 'sort'],
    hashContainerTypes: ['std::unordered_map', 'unordered_map', 'std::unordered_set', 'unordered_set', 'std::map', 'std::set', 'map', 'set'],
    knownComplexityCalls: {
      'std::binary_search': 'O(log n)',
      'binary_search': 'O(log n)',
      'std::lower_bound': 'O(log n)',
      'lower_bound': 'O(log n)',
      'std::upper_bound': 'O(log n)',
      'upper_bound': 'O(log n)',
    },
  },
};

export function detectLanguage(source: string): SupportedLanguage {
  const trimmed = source.trim();

  if (!trimmed) {
    return 'javascript';
  }

  // --- TYPE: C# / .NET (check BEFORE generic Java/TypeScript) ---
  if (
    /\busing\s+System[\.;]/.test(source) ||
    /\busing\s+System\.Collections\.Generic/.test(source) ||
    /\bnamespace\s+\w+(?:\.\w+)+\s*\{/.test(source) ||
    /\bIEnumerator\b|\bIEnumerable<|\bIList<|\bList<|\bDictionary<|\bHashSet<|\bTask<|Action<|Func<|=>\s*(?!function)/.test(source) ||
    /\bpublic\s+partial\s+class\b|\bstatic\s+void\s+Main\s*\(\s*string\[\]\s+\w+\s*\)/.test(source) ||
    /\bConsole\.(Write|WriteLine|ReadLine)\b/.test(source)
  ) {
    return 'csharp';
  }

  // --- TYPE: PHP ---
  if (/^<\?php/i.test(source) || /\$\w+\s*=/.test(source) && /\becho\s+/.test(source)) {
    return 'php';
  }

  // --- TYPE: TypeScript (check BEFORE JS) ---
  if (
    /:\s*(string|number|boolean|void|any|never|unknown)\b/.test(source) ||
    /\binterface\s+\w+\s*\{/.test(source) ||
    /\btype\s+\w+\s*=/.test(source)
  ) {
    return 'typescript';
  }

  // --- TYPE: Kotlin ---
  if (
    /\bpackage\s+\w+(?:\.\w+)+\s*$/.test(source) && !/;/.test(source.split('\n').find((l) => /\bpackage\s+/.test(l)) || '') ||
    /\bfun\s+\w*\s*\(/.test(source) && /:\s*(Int|String|Boolean|Double|Float|Long|Short|Byte|Char|Unit|List<|Map<|Set<)/.test(source) &&
      !/\binterface\s+\w+\s*\{/.test(source) &&
      !/\btype\s+\w+\s*=/.test(source) ||
    /\bval\s+\w+\s*:\s*(Int|String|Boolean|Double|Float|Long|List|Map|Set)/.test(source) ||
    /\bvararg\b|\bcompanion\s+object\b|\bdata\s+class\s+\w+/.test(source)
  ) {
    return 'kotlin';
  }

  // --- TYPE: Swift ---
  if (
    /\bimport\s+(Foundation|UIKit|SwiftUI|Combine|CoreData|Dispatch)\b/.test(source) ||
    /\bfunc\s+\w+\s*\([^)]*\)\s*(?:->\s*\w+)?\s*\{/.test(source) &&
      !/\bfunction\b/.test(source) &&
      !/\bfun\s/.test(source) &&
      !/\bfn\s/.test(source) ||
    /\blet\s+\w+\s*:\s*(Int|String|Bool|Double|Float|CGFloat|Array<|Dictionary<|Set<)/.test(source) ||
    /\bvar\s+\w+\s*:\s*(Int|String|Bool|Double|Float|Array<|Dictionary<)\s*=\s*/.test(source) &&
      !/\bvar\s+\w+\s*:\s*(string|number|boolean|any|void)\b/.test(source) ||
    /\bguard\s+let\b|\bif\s+let\b|\bif\s+case\b|\bswitch\s+\w+\s*\{/.test(source)
  ) {
    return 'swift';
  }

  // --- TYPE: Go ---
  if (
    /^package\s+\w+/m.test(source) && /\bimport\s+/.test(source) && /"[^"]+"/.test(source) ||
    /\bfunc\s+(?:\w+\s+)?\w*\s*\([^)]*\)\s*\{/.test(source) && !/function/.test(source) && !/\bfun\s/.test(source) && !/\bfn\s/.test(source) ||
    /\bvar\s+\w+\s+(?:int|string|bool|float64|float32|error|interface\{\}|struct)\b/.test(source) &&
      !/\bvar\s+\w+\s*:\s*(string|number|boolean|any)/.test(source) ||
    /\bgoroutine\b|\bchan\s+\w+|\bdefer\b|\bgo\s+\w/.test(source)
  ) {
    return 'go';
  }

  // --- TYPE: Rust ---
  if (
    /\bfn\s+main\s*\(\s*\)/.test(source) ||
    /\bfn\s+\w+\s*\([^)]*\)\s*(?:->\s*[A-Za-z_][\w<> ,&]*)?\s*\{/.test(source) && !/\bfunction/.test(source) && !/\bfunc\b/.test(source) && !/\bfun\b/.test(source) ||
    /\blet\s+mut\b|\blet\s+\w+\s*:\s*(i32|u32|i64|u64|f32|f64|bool|str|String|Vec<|HashMap<|Option<|Result<)/.test(source) ||
    /\buse\s+std::\w+|\bimpl\s+\w+\s+for\s+\w+|\bimpl\s+\w+\s*\{|\benum\s+\w+\s*\{/.test(source)
  ) {
    return 'rust';
  }

  // --- TYPE: Ruby ---
  if (
    /^\s*def\s+\w+/m.test(source) && !/def\s+__/.test(source) ||
    (/\bclass\s+\w+(?:\s*<\s*\w+)?\s*$/.test(source) && !(source.split('class ')[1] || '').includes('{')) ||
    /^\s*require\s+['"]\w+['"]/m.test(source) ||
    /\bputs\s+|\bp\s+['"(]|\b@\w+\b.*=|@@\w+\s*=|\bmodule\s+\w+\s*$|\bclass\s+<<\s+self/.test(source) ||
    /\.each\s+(?:do\b|\{)|\.map\s*(&:\w+)|\.select\s*\{|\.reduce\s*\(/.test(source)
  ) {
    return 'ruby';
  }

  // --- TYPE: Python ---
  if (
    /^\s*def\s+\w+\s*\(/m.test(source) ||
    /\bprint\s*\(/.test(source) ||
    /\belif\s+/.test(source) ||
    /\bNone\b/.test(source) ||
    /\bTrue\b|\bFalse\b/.test(source)
  ) {
    return 'python';
  }

  // --- TYPE: Java ---
  if (
    /\bpublic\s+class\s+\w+/.test(source) ||
    /\bSystem\.out\./.test(source) ||
    /\bimport\s+java\./.test(source) ||
    /\bextends\s+\w+/.test(source)
  ) {
    return 'java';
  }

  // --- TYPE: C ---
  if (
    /\b#include\s*<stdio\.h>/.test(source) ||
    (/\b#include\s*<stdlib\.h>/.test(source) && !/\bcout\b|\bstd::/.test(source)) ||
    (/\bint\s+main\s*\([^)]*\)\s*\{/.test(source) && !/return\s+0\s*;\s*\}\s*$/.test(source.split(/\bint\s+main/).slice(-1)[0]))
  ) {
    return 'c';
  }

  // --- TYPE: C++ ---
  if (
    /#include\s*<\w+>/.test(source) ||
    /\bstd::\w+/.test(source) ||
    /\bnamespace\s+\w+/.test(source) ||
    /\btemplate\s*<.*>/.test(source)
  ) {
    return 'cpp';
  }

  return 'javascript';
}
