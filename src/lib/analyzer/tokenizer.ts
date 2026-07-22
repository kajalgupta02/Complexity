export interface SourcePosition {
  line: number;
  column: number;
}

/**
 * Preprocessor that safely removes comments, strings, and regex literals
 * to avoid false positives in analysis (e.g., a "for" inside a string won't be counted)
 *
 * Tradeoff: This is still a heuristic, not a full parser, but handles
 * most edge cases (escaped quotes, nested template literals, regex flags, etc.)
 */
export function stripCommentsAndStrings(source: string): string {
  let result = '';
  let i = 0;
  const len = source.length;

  while (i < len) {
    // 1. Check for line comment (//)
    if (source[i] === '/' && source[i + 1] === '/') {
      i += 2;
      while (i < len && source[i] !== '\n') {
        i++;
      }
      continue;
    }

    // 2. Check for block comment (/* ... */)
    if (source[i] === '/' && source[i + 1] === '*') {
      i += 2;
      while (i < len - 1 && !(source[i] === '*' && source[i + 1] === '/')) {
        i++;
      }
      i += 2;
      continue;
    }

    // 3. Check for double-quoted string
    if (source[i] === '"') {
      result += '""'; // Replace with placeholder to preserve token positions
      i++;
      while (i < len) {
        if (source[i] === '\\') {
          i += 2;
          continue;
        }
        if (source[i] === '"') {
          i++;
          break;
        }
        i++;
      }
      continue;
    }

    // 4. Check for single-quoted string
    if (source[i] === "'") {
      result += "''"; // Replace with placeholder
      i++;
      while (i < len) {
        if (source[i] === '\\') {
          i += 2;
          continue;
        }
        if (source[i] === "'") {
          i++;
          break;
        }
        i++;
      }
      continue;
    }

    // 5. Check for template literal (supports nested ${} expressions)
    if (source[i] === '`') {
      result += '``'; // Replace with placeholder
      i++;
      let depth = 1;
      while (i < len && depth > 0) {
        if (source[i] === '\\') {
          i += 2;
          continue;
        }
        if (source[i] === '`') {
          depth--;
          i++;
          continue;
        }
        // Nested ${} expressions
        if (source[i] === '$' && source[i + 1] === '{') {
          depth++;
          i += 2;
          continue;
        }
        if (source[i] === '}') {
          depth--;
          i++;
          continue;
        }
        i++;
      }
      continue;
    }

    // 6. Check for regex literal (simple heuristic to avoid most false positives)
    // Regex can start after certain characters (operators, whitespace, (, [, {, ;, , =, !, <, >, +, -, *, /, %, ^, &, |, ?)
    const isRegexStart =
      i === 0 ||
      /[\s([{;,=!<>+\-*/%^&|?]/.test(source[i - 1]);
    if (source[i] === '/' && isRegexStart) {
      result += '/ /'; // Replace with placeholder
      i++;
      while (i < len) {
        if (source[i] === '\\') {
          i += 2;
          continue;
        }
        if (source[i] === '/') {
          i++;
          // Skip regex flags
          while (i < len && /[gimsuy]/.test(source[i])) {
            i++;
          }
          break;
        }
        i++;
      }
      continue;
    }

    // 7. Otherwise, add character to result
    result += source[i];
    i++;
  }

  return result;
}

// Helper to find matching closing brace given an opening brace index
export function findMatchingBrace(source: string, openIndex: number): number {
  let depth = 1;
  for (let i = openIndex + 1; i < source.length; i++) {
    if (source[i] === '{') depth++;
    if (source[i] === '}') depth--;
    if (depth === 0) return i;
  }
  return -1; // No matching brace found (syntax error)
}

// Helper to calculate line number from a character index in the source string
export function getLineNumber(source: string, index: number): number {
  let line = 1;
  for (let i = 0; i < Math.min(index, source.length); i++) {
    if (source[i] === '\n') line++;
  }
  return line;
}

// Helper to extract a snippet of code around a given index (for evidence)
export function getCodeSnippet(
  source: string,
  startIndex: number,
  endIndex: number,
  contextLines = 1
): string {
  const lines = source.split('\n');
  const startLine = getLineNumber(source, startIndex);
  const endLine = getLineNumber(source, endIndex);
  const snippetStart = Math.max(0, startLine - contextLines - 1);
  const snippetEnd = Math.min(lines.length, endLine + contextLines);
  return lines.slice(snippetStart, snippetEnd).join('\n');
}
