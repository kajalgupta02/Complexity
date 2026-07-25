export type SupportedLanguage = 'javascript' | 'typescript' | 'java' | 'cpp' | 'python';

export interface LanguageConfig {
  language: SupportedLanguage;
  name: string;
  fileExtensions: string[];
  implicitLoopMethods: string[]; // e.g., forEach, map, reduce, etc.
  sortMethods: string[]; // e.g., sort, Collections.sort, std::sort
  hashContainerTypes: string[]; // e.g., Map, Set, HashMap, HashSet, unordered_map, unordered_set
  knownComplexityCalls: Record<string, string>; // e.g., binary_search => O(log n)
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

/**
 * Best-effort language auto-detection based on source code content
 */
export function detectLanguage(source: string): SupportedLanguage {
  // Heuristic: check for TypeScript-specific syntax first
  if (
    /:\s*(string|number|boolean|void|any|never|unknown)\b/.test(source) ||
    /\binterface\s+\w+\s*\{/.test(source) ||
    /\btype\s+\w+\s*=/.test(source)
  ) {
    return 'typescript';
  }
  // Python-specific: def, import with "import x from y" style, indentation patterns, etc.
  if (
    /^\s*def\s+\w+\s*\(/m.test(source) ||
    /\bimport\s+(?:\w+\s*,\s*)*\w+\s*(?:$|\n)/m.test(source) && !/from\s+['"]/.test(source) ||
    /\bprint\s*\(/.test(source) ||
    /\belif\s+/.test(source) ||
    /\bNone\b/.test(source) ||
    /\bTrue\b|\bFalse\b/.test(source) && !/true\b|false\b/.test(source.toLowerCase().replace(/:/g, ''))
  ) {
    return 'python';
  }
  // Java-specific: public class, System.out.println, etc.
  if (
    /\bpublic\s+class\s+\w+/.test(source) ||
    /\bSystem\.out\./.test(source) ||
    /\bextends\s+\w+/.test(source)
  ) {
    return 'java';
  }
  // C++-specific: #include, std::, namespace, etc.
  if (
    /#include\s*<\w+>/.test(source) ||
    /\bstd::\w+/.test(source) ||
    /\bnamespace\s+\w+/.test(source) ||
    /\btemplate\s*<.*>/.test(source)
  ) {
    return 'cpp';
  }
  // Default to JavaScript
  return 'javascript';
}
