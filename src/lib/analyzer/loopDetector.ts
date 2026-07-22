import type { LoopInfo, LoopType, SupportedLanguage } from './types';
import type { LanguageConfig } from './language';
import { findMatchingBrace, getLineNumber } from './tokenizer';
import { LANGUAGE_CONFIGS } from './language';

export function detectLoops(
  source: string,
  implicitLoops: Array<{
    type: LoopType;
    startIndex: number;
    endIndex: number;
    startLine: number;
    endLine: number;
    headerText: string;
    bodyText: string;
    methodName?: string;
  }> = [],
  language: SupportedLanguage
): LoopInfo[] {
  const config = LANGUAGE_CONFIGS[language as keyof typeof LANGUAGE_CONFIGS];
  const loops: LoopInfo[] = [];
  const len = source.length;
  const seenStartIndices = new Set<number>();

  // Step 1: Find all explicit loop candidates (for/while/do)
  for (let i = 0; i < len; i++) {
    // Check for "for ("
    if (i + 4 < len && source.slice(i, i + 4) === 'for ' && source[i + 4] === '(') {
      const loop = extractLoop(source, i, 'for', language, config);
      if (loop && !seenStartIndices.has(loop.startIndex)) {
        loops.push(loop);
        seenStartIndices.add(loop.startIndex);
      }
      continue;
    }

    // Check for "while ("
    if (i + 6 < len && source.slice(i, i + 6) === 'while ' && source[i + 6] === '(') {
      const loop = extractLoop(source, i, 'while', language, config);
      if (loop && !seenStartIndices.has(loop.startIndex)) {
        loops.push(loop);
        seenStartIndices.add(loop.startIndex);
      }
      continue;
    }

    // Check for "do " (do-while)
    if (i + 3 < len && source.slice(i, i + 3) === 'do ') {
      const loop = extractDoWhileLoop(source, i, config);
      if (loop && !seenStartIndices.has(loop.startIndex)) {
        loops.push(loop);
        seenStartIndices.add(loop.startIndex);
      }
      continue;
    }
  }

  // Step 2: Add implicit loops (from array methods like forEach, map, etc.)
  for (const implicitLoop of implicitLoops) {
    if (!seenStartIndices.has(implicitLoop.startIndex)) {
      const loop: LoopInfo = {
        ...implicitLoop,
        nestingDepth: 0,
        hasEarlyBreak: false,
        hasUnknownFunctionCalls: [],
        hasHashContainerAccess: checkForHashContainerAccess(implicitLoop.bodyText, config),
        hasSortCall: checkForSortCall(implicitLoop.bodyText, config),
      };
      loops.push(loop);
      seenStartIndices.add(implicitLoop.startIndex);
    }
  }

  // Step 3: Compute nesting depth for each loop
  for (const loop of loops) {
    let depth = 0;
    for (const other of loops) {
      if (other === loop) continue;
      if (
        other.startIndex < loop.startIndex &&
        other.endIndex > loop.endIndex
      ) {
        depth++;
      }
    }
    loop.nestingDepth = depth;
  }

  // Sort by start index
  loops.sort((a, b) => a.startIndex - b.startIndex);
  return loops;
}

function extractLoop(
  source: string,
  startIndex: number,
  baseType: LoopType,
  language: SupportedLanguage,
  config: LanguageConfig
): LoopInfo | null {
  // Step 1: Find closing ')' of the loop condition
  const openParenIndex = source.indexOf('(', startIndex);
  if (openParenIndex === -1) return null;

  // Find matching ')' for the '('
  let parenDepth = 1;
  let closeParenIndex = -1;
  for (let i = openParenIndex + 1; i < source.length; i++) {
    if (source[i] === '(') parenDepth++;
    if (source[i] === ')') parenDepth--;
    if (parenDepth === 0) {
      closeParenIndex = i;
      break;
    }
  }
  if (closeParenIndex === -1) return null;

  // Determine loop type based on content inside parentheses
  const insideParens = source.slice(openParenIndex + 1, closeParenIndex);
  let actualType: LoopType = baseType;
  if (insideParens.includes(' of ')) {
    actualType = 'for-of';
  } else if (insideParens.includes(' in ')) {
    actualType = 'for-in';
  } else if (insideParens.includes(':') && language === 'cpp') {
    actualType = 'range-for';
  } else if (insideParens.includes(':') && language === 'java') {
    actualType = 'enhanced-for';
  }

  // Step 2: Now look for '{' or ';' after closeParenIndex
  const searchStart = closeParenIndex + 1;
  const braceIndex = source.indexOf('{', searchStart);
  const semiIndex = source.indexOf(';', searchStart);
  let endIndex = -1;
  let headerText = '';
  let bodyText = '';

  if (braceIndex !== -1 && (semiIndex === -1 || braceIndex < semiIndex)) {
    const closeBrace = findMatchingBrace(source, braceIndex);
    if (closeBrace !== -1) {
      endIndex = closeBrace;
      headerText = source.slice(startIndex, braceIndex).trim();
      bodyText = source.slice(braceIndex + 1, closeBrace).trim();
    }
  }

  // Fallback if no braces found
  if (endIndex === -1) {
    endIndex = semiIndex !== -1 ? semiIndex : Math.min(startIndex + 240, source.length - 1);
    headerText = source.slice(startIndex, endIndex).trim();
    bodyText = '';
  }

  // Step 3: Analyze loop body
  const hasEarlyBreak = /\b(break|return|throw)\b/.test(bodyText);
  const functionCallMatches = bodyText.match(/\b([A-Za-z_$][\w$]*)\s*\(/g) || [];
  const hasUnknownFunctionCalls: string[] = functionCallMatches
    .map(match => match.slice(0, -1).trim())
    .filter(name => !['if', 'for', 'while', 'switch', 'catch', 'do', 'return', 'throw', 'else', 'try', 'finally', 'new', 'typeof', 'void', 'instanceof', 'in'].includes(name));

  return {
    type: actualType,
    startIndex,
    endIndex,
    startLine: getLineNumber(source, startIndex),
    endLine: getLineNumber(source, endIndex),
    headerText,
    bodyText,
    nestingDepth: 0,
    hasEarlyBreak,
    hasUnknownFunctionCalls,
    hasHashContainerAccess: checkForHashContainerAccess(bodyText, config),
    hasSortCall: checkForSortCall(bodyText, config),
  };
}

function extractDoWhileLoop(
  source: string,
  startIndex: number,
  config: LanguageConfig
): LoopInfo | null {
  const braceIndex = source.indexOf('{', startIndex);
  if (braceIndex === -1) return null;

  const closeBrace = findMatchingBrace(source, braceIndex);
  if (closeBrace === -1) return null;

  // Now find trailing "while"
  const whileAfter = source.indexOf('while', closeBrace);
  let endIndex = closeBrace;
  if (whileAfter !== -1) {
    const semiAfterWhile = source.indexOf(';', whileAfter);
    endIndex = semiAfterWhile !== -1 ? semiAfterWhile : closeBrace;
  }

  const headerText = source.slice(startIndex, braceIndex).trim();
  const bodyText = source.slice(braceIndex + 1, closeBrace).trim();

  // Step 3: Analyze loop body
  const hasEarlyBreak = /\b(break|return|throw)\b/.test(bodyText);
  const functionCallMatches = bodyText.match(/\b([A-Za-z_$][\w$]*)\s*\(/g) || [];
  const hasUnknownFunctionCalls: string[] = functionCallMatches
    .map(match => match.slice(0, -1).trim())
    .filter(name => !['if', 'for', 'while', 'switch', 'catch', 'do', 'return', 'throw', 'else', 'try', 'finally', 'new', 'typeof', 'void', 'instanceof', 'in'].includes(name));

  return {
    type: 'do-while',
    startIndex,
    endIndex,
    startLine: getLineNumber(source, startIndex),
    endLine: getLineNumber(source, endIndex),
    headerText,
    bodyText,
    nestingDepth: 0,
    hasEarlyBreak,
    hasUnknownFunctionCalls,
    hasHashContainerAccess: checkForHashContainerAccess(bodyText, config),
    hasSortCall: checkForSortCall(bodyText, config),
  };
}

function checkForHashContainerAccess(bodyText: string, config: LanguageConfig): boolean {
  for (const containerType of config.hashContainerTypes) {
    if (containerType.includes('::')) {
      const simpleName = containerType.split('::').pop();
      if (simpleName && new RegExp(String.raw`\b${simpleName}\b`).test(bodyText)) {
        return true;
      }
    } else if (new RegExp(String.raw`\b${containerType}\b`).test(bodyText)) {
      return true;
    }
    // Check for get()/put()/[] access for hash containers
    if (
      /\.\s*get\s*\(/.test(bodyText) ||
      /\.\s*put\s*\(/.test(bodyText) ||
      /\[\s*[^\]]+\s*\]/.test(bodyText)
    ) {
      return true;
    }
  }
  return false;
}

function checkForSortCall(bodyText: string, config: LanguageConfig): boolean {
  for (const sortMethod of config.sortMethods) {
    if (sortMethod.includes('.')) {
      const parts = sortMethod.split('.');
      const lastPart = parts.pop();
      if (lastPart && new RegExp(String.raw`\b${lastPart}\s*\(`).test(bodyText)) {
        return true;
      }
    } else if (new RegExp(String.raw`\b${sortMethod}\s*\(`).test(bodyText)) {
      return true;
    }
  }
  return false;
}
