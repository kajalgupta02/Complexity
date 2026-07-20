import type { AnalysisResult, SupportedLanguage } from './types';
import { stripCommentsAndStrings } from './tokenizer';
import { detectLoops } from './loopDetector';
import { detectRecursion } from './recursionDetector';
import { detectPatterns } from './patternDetector';
import { estimateComplexity } from './complexityEstimator';
import { detectLanguage } from './language';
import { detectStdlibCallsAndImplicitLoops } from './stdlibDetector';

/**
 * Main analysis engine entrypoint
 * @param source Source code to analyze (supports C/Java/JS-style syntax)
 * @param forceLanguage Optional, force specific language detection
 * @returns AnalysisResult with all complexity estimates and detected patterns
 */
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
        error: 'Please paste some code to analyze',
        stdlibCalls: [],
      };
    }

    // Preprocess source to strip comments/strings/regex
    const cleanedSource = stripCommentsAndStrings(source);

    // Detect stdlib calls and implicit loops
    const { stdlibCalls, implicitLoops } = detectStdlibCallsAndImplicitLoops(source, detectedLanguage);
    const hasImplicitLoops = implicitLoops.length > 0;
    const hasSortCalls = stdlibCalls.some(call => call.complexity === 'O(n log n)');

    // Run loop detector (with language support and implicit loops)
    let loops: ReturnType<typeof detectLoops> = [];
    try {
      loops = detectLoops(source, implicitLoops, detectedLanguage);
    } catch (e) {
      isPartialAnalysis = true;
    }

    // Detect recursion
    let recursion: ReturnType<typeof detectRecursion> = {
      hasDirectRecursion: false,
      hasMutualRecursion: false,
      recursiveFunctions: [],
    };
    try {
      recursion = detectRecursion(source);
    } catch (e) {
      isPartialAnalysis = true;
    }

    // Detect patterns
    let patterns: ReturnType<typeof detectPatterns> = {
      hasLogarithmicStep: false,
      hasDivideAndConquer: false,
      hasTailRecursion: false,
      hasImplicitLoops,
      hasSortCalls,
    };
    try {
      const basePatterns = detectPatterns(source, loops);
      patterns = { ...basePatterns, hasImplicitLoops, hasSortCalls };
    } catch (e) {
      isPartialAnalysis = true;
    }

    // Estimate complexity
    const estimates = estimateComplexity(
      source,
      loops,
      recursion,
      patterns,
      stdlibCalls,
      detectedLanguage
    );

    // Build final result
    const result: AnalysisResult = {
      ...estimates,
      detectedLanguage,
      isPartialAnalysis,
      loops,
      recursion,
      patterns,
      stdlibCalls,
    };

    // If partial analysis, add warning
    if (isPartialAnalysis) {
      result.error = 'Partial analysis: code appears malformed/incomplete';
      result.timeConfidence = Math.max(0, result.timeConfidence - 20);
    }

    return result;
  } catch (e) {
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
      error: e instanceof Error ? e.message : 'Unknown error',
      stdlibCalls: [],
    };
  }
}

// Export all modules for testing
export * from './types';
export * from './tokenizer';
export * from './loopDetector';
export * from './recursionDetector';
export * from './patternDetector';
export * from './complexityEstimator';
export * from './language';
export * from './stdlibDetector';
