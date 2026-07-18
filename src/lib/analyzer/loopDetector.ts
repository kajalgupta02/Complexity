import { LoopInfo, LoopType } from './types';
import { findMatchingBrace } from './tokenizer';

export function detectLoops(source: string): LoopInfo[] {
  const loops: LoopInfo[] = [];
  const len = source.length;

  // Step 1: Find all loop candidates (for/while/do)
  const seenStartIndices = new Set<number>();
  for (let i = 0; i < len; i++) {

    // Check for "for ("
    if (i + 4 < len && source.slice(i, i + 4) === 'for ' && source[i + 4] === '(') {
      const loop = extractLoop(source, i, 'for');
      if (loop && !seenStartIndices.has(loop.startIndex)) {
        loops.push(loop);
        seenStartIndices.add(loop.startIndex);
      }
      continue;
    }

    // Check for "while ("
    if (i + 6 < len && source.slice(i, i + 6) === 'while ' && source[i + 6] === '(') {
      const loop = extractLoop(source, i, 'while');
      if (loop && !seenStartIndices.has(loop.startIndex)) {
        loops.push(loop);
        seenStartIndices.add(loop.startIndex);
      }
      continue;
    }

    // Check for "do " (do-while)
    if (i + 3 < len && source.slice(i, i + 3) === 'do ') {
      const loop = extractDoWhileLoop(source, i);
      if (loop && !seenStartIndices.has(loop.startIndex)) {
        loops.push(loop);
        seenStartIndices.add(loop.startIndex);
      }
      continue;
    }
  }

  // Step 2: Compute nesting depth for each loop
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
  type: LoopType
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
  
  // Step 2: Now look for '{' or ';' after closeParenIndex
  const searchStart = closeParenIndex + 1;
  let braceIndex = source.indexOf('{', searchStart);
  let semiIndex = source.indexOf(';', searchStart);
  let endIndex = -1;
  let headerText = '';

  if (braceIndex !== -1 && (semiIndex === -1 || braceIndex < semiIndex)) {
    const closeBrace = findMatchingBrace(source, braceIndex);
    if (closeBrace !== -1) {
      endIndex = closeBrace;
      headerText = source.slice(startIndex, braceIndex).trim();
    }
  }

  // Fallback if no braces found
  if (endIndex === -1) {
    endIndex = semiIndex !== -1 ? semiIndex : Math.min(startIndex + 240, source.length - 1);
    headerText = source.slice(startIndex, endIndex).trim();
  }

  return {
    type,
    startIndex,
    endIndex,
    headerText,
    nestingDepth: 0,
  };
}

function extractDoWhileLoop(source: string, startIndex: number): LoopInfo | null {
  let braceIndex = source.indexOf('{', startIndex);
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
  return {
    type: 'do-while',
    startIndex,
    endIndex,
    headerText,
    nestingDepth: 0,
  };
}
