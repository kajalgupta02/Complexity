import { RecursionInfo } from './types';
import { findMatchingBrace } from './tokenizer';

interface FunctionInfo {
  name: string;
  bodyStart: number;
  bodyEnd: number;
  calls: string[]; // functions called inside this function's body
}

export function detectRecursion(source: string): RecursionInfo {
  // Step 1: Extract all function definitions and their calls
  const functions = extractFunctions(source);

  // Step 2: Check for direct recursion
  const directRecursiveFunctions: Array<{ name: string; calls: Array<{ name: string; line: number }> }> = [];
  for (const fn of functions) {
    if (fn.calls.includes(fn.name)) {
      directRecursiveFunctions.push({ name: fn.name, calls: [] });
    }
  }

  // Step 3: Check for mutual recursion using graph cycle detection
  const hasMutualRecursion = hasCycleInFunctionGraph(functions);

  return {
    hasDirectRecursion: directRecursiveFunctions.length > 0,
    hasMutualRecursion,
    recursiveFunctions: directRecursiveFunctions,
  };
}

function extractFunctions(source: string): FunctionInfo[] {
  const functions: FunctionInfo[] = [];
  const keywordSet = new Set([
    'if', 'for', 'while', 'switch', 'catch', 'do', 'return', 'throw',
    'else', 'try', 'finally', 'new', 'typeof', 'void', 'instanceof', 'in'
  ]);

  // Regex to match function declarations: "function name(...) {"
  const fnRegex = /\bfunction\s+([A-Za-z_$][\w$]*)\s*\(/g;
  let match;

  while ((match = fnRegex.exec(source)) !== null) {
    const name = match[1];
    if (keywordSet.has(name)) continue;

    // Find opening brace of function body
    const braceIndex = source.indexOf('{', match.index);
    if (braceIndex === -1) continue;

    const closeBrace = findMatchingBrace(source, braceIndex);
    if (closeBrace === -1) continue;

    const body = source.slice(braceIndex + 1, closeBrace);
    const calls = extractCalls(body, keywordSet);

    functions.push({
      name,
      bodyStart: braceIndex + 1,
      bodyEnd: closeBrace,
      calls,
    });
  }

  return functions;
}

function extractCalls(body: string, keywordSet: Set<string>): string[] {
  const calls: string[] = [];
  const callRegex = /\b([A-Za-z_$][\w$]*)\s*\(/g;
  let match;

  while ((match = callRegex.exec(body)) !== null) {
    const name = match[1];
    if (!keywordSet.has(name)) {
      calls.push(name);
    }
  }

  return calls;
}

function hasCycleInFunctionGraph(functions: FunctionInfo[]): boolean {
  const graph: Record<string, string[]> = {};
  for (const fn of functions) {
    graph[fn.name] = fn.calls.filter(call =>
      functions.some(f => f.name === call)
    );
  }

  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function dfs(node: string): boolean {
    if (recursionStack.has(node)) return true;
    if (visited.has(node)) return false;

    visited.add(node);
    recursionStack.add(node);

    for (const neighbor of graph[node] || []) {
      if (dfs(neighbor)) return true;
    }

    recursionStack.delete(node);
    return false;
  }

  for (const fn of functions) {
    if (!visited.has(fn.name) && dfs(fn.name)) {
      return true;
    }
  }

  return false;
}
