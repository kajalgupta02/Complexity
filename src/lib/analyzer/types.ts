export type ConfidenceLevel = 'high' | 'medium' | 'low';

export type ComplexityClass =
  | 'O(1)'
  | 'O(log n)'
  | 'O(√n)'
  | 'O(n)'
  | 'O(n log n)'
  | 'O(n²)'
  | 'O(n³)'
  | 'O(2ⁿ)'
  | 'indeterminate';

export type LoopType = 'for' | 'while' | 'do-while';

export interface LoopInfo {
  type: LoopType;
  startIndex: number;
  endIndex: number;
  headerText: string;
  nestingDepth: number; // 0-based (outermost loop has depth 0)
}

export interface RecursionInfo {
  hasDirectRecursion: boolean;
  hasMutualRecursion: boolean;
  functionNames: string[];
  callDepth?: number;
}

export interface PatternInfo {
  hasLogarithmicStep: boolean; // i *= 2, i /= 2, i >>= 1, etc.
  hasDivideAndConquer: boolean; // splits input in half and recurses twice (merge/quick sort style)
  hasTailRecursion: boolean;
}

export interface SpaceComplexityEstimate {
  class: ComplexityClass;
  confidence: ConfidenceLevel;
  notes: string[];
}

export interface AnalysisResult {
  timeComplexity: ComplexityClass;
  timeConfidence: ConfidenceLevel;
  spaceComplexity: SpaceComplexityEstimate;
  loops: LoopInfo[];
  recursion: RecursionInfo;
  patterns: PatternInfo;
  reasoningSteps: string[];
  detectedPatterns: string[];
  error?: string;
}
