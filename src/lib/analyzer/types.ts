import type { SupportedLanguage } from './language';

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
}
