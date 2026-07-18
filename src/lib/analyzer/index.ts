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
        timeComplexity: 'indeterminate',
        timeConfidence: 'low',
        spaceComplexity: {
          class: 'indeterminate',
          confidence: 'low',
          notes: ['No input code provided'],
        },
        loops: [],
        recursion: {
          hasDirectRecursion: false,
          hasMutualRecursion: false,
          functionNames: [],
        },
        patterns: {
          hasLogarithmicStep: false,
          hasDivideAndConquer: false,
          hasTailRecursion: false,
        },
        reasoningSteps: ['No input code provided'],
        detectedPatterns: [],
        error: 'Please paste some code to analyze',
      };
    }

    // Preprocess source to strip comments/strings/regex
    const cleanedSource = stripCommentsAndStrings(source);

    // Run all detectors
    const loops = detectLoops(cleanedSource);
    const recursion = detectRecursion(cleanedSource);
    const patterns = detectPatterns(cleanedSource, loops);

    // Estimate complexity
    const estimates = estimateComplexity(loops, recursion, patterns);

    return {
      ...estimates,
      loops,
      recursion,
      patterns,
    };
  } catch (e) {
    return {
      timeComplexity: 'indeterminate',
      timeConfidence: 'low',
      spaceComplexity: {
        class: 'indeterminate',
        confidence: 'low',
        notes: ['Error during analysis'],
      },
      loops: [],
      recursion: {
        hasDirectRecursion: false,
        hasMutualRecursion: false,
        functionNames: [],
      },
      patterns: {
        hasLogarithmicStep: false,
        hasDivideAndConquer: false,
        hasTailRecursion: false,
      },
      reasoningSteps: ['Error during analysis'],
      detectedPatterns: [],
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
