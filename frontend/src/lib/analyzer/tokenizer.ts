export interface SourcePosition {
  line: number;
  column: number;
}

export function stripCommentsAndStrings(source: string): string {
  let result = '';
  let i = 0;
  const len = source.length;

  while (i < len) {
    if (source[i] === '/' && source[i + 1] === '/') {
      i += 2;
      while (i < len && source[i] !== '\n') {
        i++;
      }
      continue;
    }

    if (source[i] === '/' && source[i + 1] === '*') {
      i += 2;
      while (i < len - 1 && !(source[i] === '*' && source[i + 1] === '/')) {
        i++;
      }
      i += 2;
      continue;
    }

    if (source[i] === '"') {
      result += '""';
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

    if (source[i] === "'") {
      result += "''";
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

    if (source[i] === '`') {
      result += '``';
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

    const isRegexStart =
      i === 0 ||
      /[\s([{;,=!<>+\-*/%^&|?]/.test(source[i - 1]);
    if (source[i] === '/' && isRegexStart) {
      result += '/ /';
      i++;
      while (i < len) {
        if (source[i] === '\\') {
          i += 2;
          continue;
        }
        if (source[i] === '/') {
          i++;
          while (i < len && /[gimsuy]/.test(source[i])) {
            i++;
          }
          break;
        }
        i++;
      }
      continue;
    }

    result += source[i];
    i++;
  }

  return result;
}

export function findMatchingBrace(source: string, openIndex: number): number {
  let depth = 1;
  for (let i = openIndex + 1; i < source.length; i++) {
    if (source[i] === '{') depth++;
    if (source[i] === '}') depth--;
    if (depth === 0) return i;
  }
  return -1;
}

export function getLineNumber(source: string, index: number): number {
  let line = 1;
  for (let i = 0; i < Math.min(index, source.length); i++) {
    if (source[i] === '\n') line++;
  }
  return line;
}

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
