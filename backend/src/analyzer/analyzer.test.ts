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

  it('should detect implicit loops (array methods)', () => {
    const code = `function processArray(arr) {
      arr.map(x => x * 2);
    }`;
    const result = analyzeCode(code);
    expect(result.patterns.hasImplicitLoops).toBe(true);
    expect(result.timeComplexity).toBe('O(n)');
  });

  it('should detect sort calls', () => {
    const code = `function sortArray(arr) {
      arr.sort();
    }`;
    const result = analyzeCode(code);
    expect(result.patterns.hasSortCalls).toBe(true);
    expect(result.timeComplexity).toBe('O(n log n)');
  });

  it('should handle malformed code gracefully (partial analysis)', () => {
    const code = `function broken() {
      for (let i = 0; i < n`;
    const result = analyzeCode(code);
    expect(result.isPartialAnalysis).toBe(true);
  });

  describe('Bisection & Logarithmic Interval Progression', () => {
    it('detects standard binary search pointer bisection as O(log n)', () => {
      const code = `function binarySearch(arr, target) {
        let left = 0, right = arr.length - 1;
        while (left <= right) {
          let mid = Math.floor((left + right) / 2);
          if (arr[mid] === target) return mid;
          if (arr[mid] < target) left = mid + 1;
          else right = mid - 1;
        }
        return -1;
      }`;
      const result = analyzeCode(code);
      expect(result.patterns.hasLogarithmicStep).toBe(true);
      expect(result.timeComplexity).toBe('O(log n)');
    });

    it('detects bitshift midpoint bisection as O(log n)', () => {
      const code = `function findBound(lo, hi) {
        while (lo < hi) {
          const mid = (lo + hi) >> 1;
          if (check(mid)) hi = mid;
          else lo = mid + 1;
        }
        return lo;
      }`;
      const result = analyzeCode(code);
      expect(result.patterns.hasLogarithmicStep).toBe(true);
      expect(result.timeComplexity).toBe('O(log n)');
    });

    it('detects subtraction midpoint low + (high - low) / 2 as O(log n)', () => {
      const code = `function search(nums, target) {
        let low = 0, high = nums.length - 1;
        while (low <= high) {
          let mid = low + Math.floor((high - low) / 2);
          if (nums[mid] === target) return mid;
          if (nums[mid] < target) low = mid + 1;
          else high = mid - 1;
        }
        return -1;
      }`;
      const result = analyzeCode(code);
      expect(result.patterns.hasLogarithmicStep).toBe(true);
      expect(result.timeComplexity).toBe('O(log n)');
    });

    it('does NOT classify loops with unrelated division as logarithmic (negative test)', () => {
      const code = `function process(arr) {
        let sum = 0;
        for (let i = 0; i < arr.length; i++) {
          const half = arr[i] / 2; // division present but loop step is linear i++
          sum += half;
        }
        return sum;
      }`;
      const result = analyzeCode(code);
      expect(result.patterns.hasLogarithmicStep).toBe(false);
      expect(result.timeComplexity).toBe('O(n)');
    });

    it('detects nested loop containing binary search as O(n log n)', () => {
      const code = `function twoSumBinarySearch(arr) {
        let count = 0;
        for (let i = 0; i < arr.length; i++) {
          let left = i + 1, right = arr.length - 1;
          while (left <= right) {
            let mid = Math.floor((left + right) / 2);
            if (arr[mid] + arr[i] === 0) { count++; break; }
            if (arr[mid] + arr[i] < 0) left = mid + 1;
            else right = mid - 1;
          }
        }
        return count;
      }`;
      const result = analyzeCode(code);
      expect(result.patterns.hasLogarithmicStep).toBe(true);
      expect(result.timeComplexity).toBe('O(n log n)');
    });
  });
});

