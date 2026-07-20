import type { SupportedLanguage, LanguageConfig } from './language';
import type { StdlibCallInfo, LoopInfo, LoopType } from './types';
import { getLineNumber } from './tokenizer';
import { findMatchingBrace } from './tokenizer';
import { LANGUAGE_CONFIGS } from './language';

export interface StdlibDetectionResult {
  stdlibCalls: StdlibCallInfo[];
  implicitLoops: Array<{
    type: LoopType;
    startIndex: number;
    endIndex: number;
    startLine: number;
    endLine: number;
    headerText: string;
    bodyText: string;
    methodName: string;
  }>;
}

export function detectStdlibCallsAndImplicitLoops(
  source: string,
  language: SupportedLanguage
): StdlibDetectionResult {
  const config = LANGUAGE_CONFIGS[language];
  const stdlibCalls: StdlibCallInfo[] = [];
  const implicitLoops: StdlibDetectionResult['implicitLoops'] = [];
  const seenIndices = new Set<string>();

  // Step 1: Detect implicit loop methods (forEach, map, etc.)
  for (const method of config.implicitLoopMethods) {
    const regex = new RegExp(String.raw`\b${method}\s*\(`, 'g');
    let match;
    while ((match = regex.exec(source)) !== null) {
      const startIndex = match.index;
      const openParenIndex = match.index + method.length;
      const closeParenIndex = findMatchingParen(source, openParenIndex);
      if (closeParenIndex === -1) continue;

      // Find end of method call (include any braces for callback functions)
      let endIndex = closeParenIndex;
      const braceIndex = source.indexOf('{', openParenIndex);
      if (braceIndex !== -1 && braceIndex < closeParenIndex + 20) {
        const closeBrace = findMatchingBrace(source, braceIndex);
        if (closeBrace !== -1) {
          endIndex = closeBrace;
        }
      }

      const key = `${startIndex}-${method}`;
      if (!seenIndices.has(key)) {
        seenIndices.add(key);
        implicitLoops.push({
          type: 'implicit-method',
          startIndex,
          endIndex,
          startLine: getLineNumber(source, startIndex),
          endLine: getLineNumber(source, endIndex),
          headerText: source.slice(startIndex, openParenIndex + 1),
          bodyText: source.slice(openParenIndex + 1, endIndex).trim(),
          methodName: method,
        });
      }
    }
  }

  // Step 2: Detect sort calls
  for (const sortMethod of config.sortMethods) {
    const regex = new RegExp(
      sortMethod.includes('.')
        ? String.raw`\b${sortMethod.replace(/\./g, '\\.')}\s*\(`
        : String.raw`\b${sortMethod}\s*\(`,
      'g'
    );
    let match;
    while ((match = regex.exec(source)) !== null) {
      const startIndex = match.index;
      const openParenIndex = match.index + sortMethod.length;
      const closeParenIndex = findMatchingParen(source, openParenIndex);
      if (closeParenIndex === -1) continue;

      const key = `${startIndex}-${sortMethod}`;
      if (!seenIndices.has(key)) {
        seenIndices.add(key);
        stdlibCalls.push({
          name: sortMethod,
          complexity: 'O(n log n)',
          startIndex,
          endIndex: closeParenIndex,
          startLine: getLineNumber(source, startIndex),
          endLine: getLineNumber(source, closeParenIndex),
        });
      }
    }
  }

  // Step 3: Detect other known complexity calls
  for (const [callName, complexity] of Object.entries(config.knownComplexityCalls)) {
    const regex = new RegExp(String.raw`\b${callName.replace(/\./g, '\\.')}\s*\(`, 'g');
    let match;
    while ((match = regex.exec(source)) !== null) {
      const startIndex = match.index;
      const openParenIndex = match.index + callName.length;
      const closeParenIndex = findMatchingParen(source, openParenIndex);
      if (closeParenIndex === -1) continue;

      const key = `${startIndex}-${callName}`;
      if (!seenIndices.has(key)) {
        seenIndices.add(key);
        stdlibCalls.push({
          name: callName,
          complexity: complexity as any,
          startIndex,
          endIndex: closeParenIndex,
          startLine: getLineNumber(source, startIndex),
          endLine: getLineNumber(source, closeParenIndex),
        });
      }
    }
  }

  return {
    stdlibCalls: stdlibCalls.sort((a, b) => a.startIndex - b.startIndex),
    implicitLoops: implicitLoops.sort((a, b) => a.startIndex - b.startIndex),
  };
}

export function findMatchingParen(source: string, openParenIndex: number): number {
  if (source[openParenIndex] !== '(') return -1;
  let depth = 1;
  for (let i = openParenIndex + 1; i < source.length; i++) {
    if (source[i] === '(') depth++;
    if (source[i] === ')') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}
