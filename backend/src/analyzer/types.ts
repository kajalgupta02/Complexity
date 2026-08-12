import type { SupportedLanguage } from './language';
export type { SupportedLanguage } from './language';

export type ComplexityClass =
  | 'O(1)'
  | 'O(log n)'
  | 'O(√n)'
  | 'O(n)'
  | 'O(n log n)'
  | 'O(n²)'
  | 'O(n² log n)'
  | 'O(n³)'
  | 'O(n³ log n)'
  | 'O(2ⁿ)'
  | 'indeterminate';

export type LoopType =
  | 'for'
  | 'while'
  | 'do-while'
  | 'for-of'
  | 'for-in'
  | 'range-for' // C++ range-based for
  | 'enhanced-for' // Java enhanced for
  | 'implicit-method'; // array methods like forEach, map, etc.

export interface StdlibCallInfo {
  name: string;
  complexity: ComplexityClass;
  startIndex: number;
  endIndex: number;
  startLine: number;
  endLine: number;
}

export interface LoopInfo {
  type: LoopType;
  startIndex: number;
  endIndex: number;
  startLine: number;
  endLine: number;
  headerText: string;
  bodyText: string;
  nestingDepth: number;
  hasEarlyBreak: boolean;
  hasUnknownFunctionCalls: string[]; // names of functions called inside loop
  hasHashContainerAccess: boolean;
  hasSortCall: boolean;
}

export interface RecursionInfo {
  hasDirectRecursion: boolean;
  hasMutualRecursion: boolean;
  recursiveFunctions: Array<{
    name: string;
    calls: Array<{
      name: string;
      line: number;
    }>;
  }>;
}

export interface PatternInfo {
  hasLogarithmicStep: boolean;
  logStepDetails?: { variable: string; operator: string; line: number }[];
  hasDivideAndConquer: boolean;
  hasTailRecursion: boolean;
  hasImplicitLoops: boolean;
  hasSortCalls: boolean;
}

export interface SpaceComplexityEstimate {
  class: ComplexityClass;
  reasoning: string[];
}

export interface ReasoningStep {
  id: string;
  title: string;
  rule: string;
  evidence: {
    type: 'code' | 'loop' | 'recursion' | 'pattern' | 'stdlib-call';
    snippet: string;
    startLine?: number;
    endLine?: number;
  }[];
  weight: number; // 0-100, how much this step contributes to the verdict
  confidenceChange: number; // +/- to overall confidence
}

export interface WhatWouldChange {
  factor: string;
  impact: string;
  evidence?: string;
}

// Detailed Analysis Sections

export interface LoopAnalysisEntry {
  loopNumber: number;
  purpose: string;
  iterations: string;
  contribution: string;
  startLine: number;
  endLine: number;
  nestingDepth: number;
}

export interface RecursiveAnalysis {
  hasRecursion: boolean;
  baseCase?: string;
  recursiveRelation?: string;
  recursionDepth?: string;
  recurrence?: string;
  contributionToComplexity?: string;
}

export interface MemoryUsageEntry {
  name: string;
  type: 'Array' | 'HashMap' | 'HashSet' | 'Stack' | 'Queue' | 'RecursionStack' | 'Dynamic' | 'Other';
  affectsComplexity: boolean;
  note: string;
}

export interface StepByStepEntry {
  step: number;
  description: string;
}

export interface ComplexityDerivationStep {
  step: number;
  description: string;
  math?: string;
}

export interface DetailedAnalysis {
  programmingLanguage: string;
  highLevelSummary: string;
  algorithmUsed: string[];
  stepByStepExecution: StepByStepEntry[];
  timeComplexity: {
    worst: ComplexityClass;
    average: ComplexityClass;
    best: ComplexityClass;
  };
  spaceComplexity: {
    auxiliary: ComplexityClass;
    total?: ComplexityClass;
  };
  complexityDerivation: ComplexityDerivationStep[];
  loopAnalysis: LoopAnalysisEntry[];
  recursiveAnalysis: RecursiveAnalysis;
  memoryUsage: MemoryUsageEntry[];
  performanceNotes: string[];
  possibleOptimizations: string[];
  finalResult: {
    programmingLanguage: string;
    algorithm: string;
    worstTime: ComplexityClass;
    averageTime: ComplexityClass;
    bestTime: ComplexityClass;
    space: ComplexityClass;
    difficulty: 'Easy' | 'Medium' | 'Hard';
  };
}

export interface AnalysisResult {
  version: string;
  detectedLanguage: SupportedLanguage;
  isPartialAnalysis: boolean;
  timeComplexity: ComplexityClass;
  timeConfidence: number; // 0-100
  spaceComplexity: SpaceComplexityEstimate;
  loops: LoopInfo[];
  recursion: RecursionInfo;
  patterns: PatternInfo;
  reasoningChain: ReasoningStep[];
  detectedPatterns: string[];
  whatWouldChange: WhatWouldChange[];
  knownLimitations: string[];
  error?: string;
  stdlibCalls: StdlibCallInfo[];
  detailed: DetailedAnalysis;
}
