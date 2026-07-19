import { describe, it, expect } from 'vitest';
import { analyzeCode } from './index';

describe('analyzeCode', () => {
  it('should handle empty input', () => {
    const result = analyzeCode('');
    expect(result.error).toBeDefined();
    expect(result.timeComplexity).toBe('indeterminate');
  });

  it('should return O(1) for simple code with no loops/recursion', () => {
    const code = 'function add(a, b) { return a + b; }';
    const result = analyzeCode(code);
    expect(result.timeComplexity).toBe('O(1)');
    expect(result.timeConfidence).toBe(100);
  });

  it('should return O(n) for single loop', () => {
    const code = `function sum(n) {
      let total = 0;
      for (let i = 0; i < n; i++) {
        total += i;
      }
      return total;
    }`;
    const result = analyzeCode(code);
    expect(result.timeComplexity).toBe('O(n)');
  });

  it('should return O(n²) for nested loops', () => {
    const code = `function countPairs(n) {
      let pairs = 0;
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          pairs++;
        }
      }
      return pairs;
    }`;
    const result = analyzeCode(code);
    expect(result.timeComplexity).toBe('O(n²)');
    expect(result.timeConfidence).toBeGreaterThan(0);
  });

  it('should return O(n³) for triple nested loops', () => {
    const code = `function tripleLoop(n) {
      let count = 0;
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          for (let k = 0; k < n; k++) {
            count++;
          }
        }
      }
      return count;
    }`;
    const result = analyzeCode(code);
    expect(result.timeComplexity).toBe('O(n³)');
  });

  it('should detect logarithmic step pattern', () => {
    const code = `function logLoop(n) {
      let i = 1;
      while (i < n) {
        i *= 2;
      }
    }`;
    const result = analyzeCode(code);
    expect(result.patterns.hasLogarithmicStep).toBe(true);
    expect(result.timeComplexity).toBe('O(log n)');
  });

  it('should detect direct recursion', () => {
    const code = `function factorial(n) {
      if (n <= 1) return 1;
      return n * factorial(n - 1);
    }`;
    const result = analyzeCode(code);
    expect(result.recursion.hasDirectRecursion).toBe(true);
  });

  it('should detect mutual recursion', () => {
    const code = `function isEven(n) {
      if (n === 0) return true;
      return isOdd(n - 1);
    }
    function isOdd(n) {
      if (n === 0) return false;
      return isEven(n - 1);
    }`;
    const result = analyzeCode(code);
    expect(result.recursion.hasMutualRecursion).toBe(true);
  });

  it('should ignore comments and strings', () => {
    const code = `function test() {
      // This is a for loop in a comment: for (let i = 0; i < 10; i++) {}
      const s = "for (let j = 0; j < 5; j++) {";
      return 42;
    }`;
    const result = analyzeCode(code);
    expect(result.loops.length).toBe(0);
  });
});
