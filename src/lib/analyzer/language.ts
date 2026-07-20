export type SupportedLanguage = 'javascript' | 'typescript' | 'java' | 'cpp';

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
