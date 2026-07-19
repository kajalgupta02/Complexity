import { AnalysisResult } from './types';
import { stripCommentsAndStrings } from './tokenizer';
import { detectLoops } from './loopDetector';
import { detectRecursion } from './recursionDetector';
import { detectPatterns } from './patternDetector';
import { estimateComplexity } from './complexityEstimator';

/**
 * Main analysis engine entrypoint
 * @param source Source code to analyze (supports C/Java/JS-style syntax)
 * @returns AnalysisResult with all complexity estimates and detected patterns
 */
export function analyzeCode(source: string): AnalysisResult {
  try {
    if (!source.trim()) {
      return {
        version: '1.1.0',
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
        },
        reasoningChain: [],
        detectedPatterns: [],
        whatWouldChange: [],
        knownLimitations: [],
        error: 'Please paste some code to analyze',
      };
    }

    // Preprocess source to strip comments/strings/regex
    const cleanedSource = stripCommentsAndStrings(source);

    // Run all detectors on the original source (not cleaned, for better line numbers!)
    const loops = detectLoops(source);
    const recursion = detectRecursion(source);
    const patterns = detectPatterns(source, loops);

    // Estimate complexity
    const estimates = estimateComplexity(source, loops, recursion, patterns);

    return {
      ...estimates,
      loops,
      recursion,
      patterns,
    };
  } catch (e) {
    return {
      version: '1.1.0',
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
      },
      reasoningChain: [],
      detectedPatterns: [],
      whatWouldChange: [],
      knownLimitations: [],
      error: e instanceof Error ? e.message : 'Unknown error',
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
