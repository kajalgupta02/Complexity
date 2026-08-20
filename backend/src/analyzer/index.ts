import type { AnalysisResult, SupportedLanguage, PatternInfo } from './types';
import { stripCommentsAndStrings } from './tokenizer';
import { detectLoops } from './loopDetector';
import { detectRecursion } from './recursionDetector';
import { detectPatterns } from './patternDetector';
import { estimateComplexity } from './complexityEstimator';
import { detectLanguage } from './language';
import { detectStdlibCallsAndImplicitLoops } from './stdlibDetector';
import { buildDetailedAnalysis } from './detailedAnalyzer';

function buildEmptyDetailed(language: SupportedLanguage): ReturnType<typeof buildDetailedAnalysis> {
  return {
    programmingLanguage: language,
    highLevelSummary: 'No code has been provided yet. Paste or type some code to begin the analysis.',
    algorithmUsed: ['None'],
    stepByStepExecution: [],
    timeComplexity: { worst: 'indeterminate', average: 'indeterminate', best: 'indeterminate' },
    spaceComplexity: { auxiliary: 'indeterminate' },
    complexityDerivation: [],
    loopAnalysis: [],
    recursiveAnalysis: { hasRecursion: false },
    memoryUsage: [],
    performanceNotes: [],
    possibleOptimizations: [],
    finalResult: {
      programmingLanguage: language,
      algorithm: 'None',
      worstTime: 'indeterminate',
      averageTime: 'indeterminate',
      bestTime: 'indeterminate',
      space: 'indeterminate',
      difficulty: 'Easy',
    },
  };
}

function hasStructuralIssues(source: string): boolean {
  let braces = 0;
  let parens = 0;
  let brackets = 0;

  for (let i = 0; i < source.length; i++) {
    const c = source[i];
    if (c === '{') braces++;
    else if (c === '}') braces--;
    else if (c === '(') parens++;
    else if (c === ')') parens--;
    else if (c === '[') brackets++;
    else if (c === ']') brackets--;
  }

  return braces !== 0 || parens !== 0 || brackets !== 0;
}

export function analyzeCode(
  source: string,
  forceLanguage?: SupportedLanguage
): AnalysisResult {
  const detectedLanguage = forceLanguage || detectLanguage(source);
  let isPartialAnalysis = false;

  try {
    if (!source.trim()) {
      return {
        version: '1.3.0',
        detectedLanguage,
        isPartialAnalysis: false,
        timeComplexity: 'indeterminate',
        timeConfidence: 0,
        spaceComplexity: {
          class: 'indeterminate',
          reasoning: ['No input code provided'],
        },
        loops: [],
        recursion: {
          hasDirectRecursion: false,
          hasMutualRecursion: false,
          recursiveFunctions: [],
        },
        patterns: {
          hasLogarithmicStep: false,
          hasDivideAndConquer: false,
          hasTailRecursion: false,
          hasImplicitLoops: false,
          hasSortCalls: false,
        },
        reasoningChain: [],
        detectedPatterns: [],
        whatWouldChange: [],
        knownLimitations: [],
        error: 'Please enter some code before starting the analysis.',
        stdlibCalls: [],
        detailed: buildEmptyDetailed(detectedLanguage),
      };
    }

    const strippedSource = stripCommentsAndStrings(source);

    if (hasStructuralIssues(strippedSource)) {
      isPartialAnalysis = true;
    }

    const { stdlibCalls, implicitLoops } = detectStdlibCallsAndImplicitLoops(strippedSource, detectedLanguage);
    const hasImplicitLoops = implicitLoops.length > 0;
    const hasSortCalls = stdlibCalls.some((call: { complexity?: string }) => call.complexity === 'O(n log n)');

    let loops: ReturnType<typeof detectLoops> = [];
    try {
      loops = detectLoops(strippedSource, implicitLoops, detectedLanguage);
    } catch {
      isPartialAnalysis = true;
    }

    let recursion: ReturnType<typeof detectRecursion> = {
      hasDirectRecursion: false,
      hasMutualRecursion: false,
      recursiveFunctions: [],
    };
    try {
      recursion = detectRecursion(strippedSource);
    } catch {
      isPartialAnalysis = true;
    }

    let patterns: PatternInfo = {
      hasLogarithmicStep: false,
      hasDivideAndConquer: false,
      hasTailRecursion: false,
      hasImplicitLoops,
      hasSortCalls,
    };
    try {
      const basePatterns = detectPatterns(strippedSource, loops);
      patterns = { ...basePatterns, hasImplicitLoops, hasSortCalls };
    } catch {
      isPartialAnalysis = true;
    }

    const estimates = estimateComplexity(
      source,
      loops,
      recursion,
      patterns,
      stdlibCalls
    );

    const result: AnalysisResult = {
      ...estimates,
      detectedLanguage,
      isPartialAnalysis,
      loops,
      recursion,
      patterns,
      stdlibCalls,
      detailed: buildDetailedAnalysis(source, {
        timeComplexity: estimates.timeComplexity,
        timeConfidence: estimates.timeConfidence,
        spaceComplexity: estimates.spaceComplexity,
        loops,
        recursion,
        patterns,
        stdlibCalls,
        detectedLanguage,
      }),
    };

    if (isPartialAnalysis) {
      result.error = 'Some parts of this code appear incomplete. We can still provide a partial analysis, but the result may have lower confidence.';
      result.timeConfidence = Math.max(0, result.timeConfidence - 20);
    }

    return result;
  } catch {
    return {
      version: '1.3.0',
      detectedLanguage,
      isPartialAnalysis: true,
      timeComplexity: 'indeterminate',
      timeConfidence: 0,
      spaceComplexity: {
        class: 'indeterminate',
        reasoning: ['Error during analysis'],
      },
      loops: [],
      recursion: {
        hasDirectRecursion: false,
        hasMutualRecursion: false,
        recursiveFunctions: [],
      },
      patterns: {
        hasLogarithmicStep: false,
        hasDivideAndConquer: false,
        hasTailRecursion: false,
        hasImplicitLoops: false,
        hasSortCalls: false,
      },
      reasoningChain: [],
      detectedPatterns: [],
      whatWouldChange: [],
      knownLimitations: [],
      error: "We couldn't analyze this code. Make sure you've entered a valid code snippet and selected the correct programming language.",
      stdlibCalls: [],
      detailed: buildEmptyDetailed(detectedLanguage),
    };
  }
}

export * from './types';
export * from './tokenizer';
export * from './loopDetector';
export * from './recursionDetector';
export * from './patternDetector';
export * from './complexityEstimator';
export * from './language';
export * from './stdlibDetector';
export * from './detailedAnalyzer';
