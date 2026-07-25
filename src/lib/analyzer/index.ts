import type { AnalysisResult, SupportedLanguage, PatternInfo } from './types';
import { stripCommentsAndStrings } from './tokenizer';
import { detectLoops } from './loopDetector';
import { detectRecursion } from './recursionDetector';
import { detectPatterns } from './patternDetector';
import { estimateComplexity } from './complexityEstimator';
import { detectLanguage } from './language';
import { detectStdlibCallsAndImplicitLoops } from './stdlibDetector';

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
    const strippedSource = stripCommentsAndStrings(source);

    // Check for structural issues (unbalanced braces/parens = malformed code)
    if (hasStructuralIssues(strippedSource)) {
      isPartialAnalysis = true;
    }

    // Detect stdlib calls and implicit loops (use stripped source for pattern matching
    // but keep original source for position-based evidence)
    const { stdlibCalls, implicitLoops } = detectStdlibCallsAndImplicitLoops(strippedSource, detectedLanguage);
    const hasImplicitLoops = implicitLoops.length > 0;
    const hasSortCalls = stdlibCalls.some(call => call.complexity === 'O(n log n)');

    // Run loop detector (with language support and implicit loops)
    // Use strippedSource to avoid detecting loops inside comments/strings
    let loops: ReturnType<typeof detectLoops> = [];
    try {
      loops = detectLoops(strippedSource, implicitLoops, detectedLanguage);
    } catch {
      isPartialAnalysis = true;
    }

    // Detect recursion
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

    // Detect patterns
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

    // Estimate complexity
    const estimates = estimateComplexity(
      source,
      loops,
      recursion,
      patterns,
      stdlibCalls
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
