import { describe, it, expect } from 'vitest';
import { analyzeCode } from './index';

describe('analyzeCode', () => {
  it('should analyze simple O(1) code', () => {
    const code = 'function add(a, b) { return a + b; }';
    const result = analyzeCode(code);
    expect(result.timeComplexity).toBe('O(1)');
  });

  it('should analyze O(n) single loop', () => {
    const code = 'function loop(n) { for(let i=0; i<n; i++) { console.log(i); } }';
    const result = analyzeCode(code);
    expect(result.timeComplexity).toBe('O(n)');
  });

  it('should analyze O(n²) nested loop', () => {
    const code = 'function nested(n) { for(let i=0; i<n; i++) { for(let j=0; j<n; j++) { console.log(i, j); } } }';
    const result = analyzeCode(code);
    expect(result.timeComplexity).toBe('O(n²)');
  });

  it('should analyze O(log n) logarithmic loop', () => {
    const code = 'function logLoop(n) { for(let i=1; i<n; i*=2) { console.log(i); } }';
    const result = analyzeCode(code);
    expect(result.timeComplexity).toBe('O(log n)');
  });

  it('should analyze O(n log n) loop with sort', () => {
    const code = 'function sortLoop(arr) { arr.sort(); for(let i=0; i<arr.length; i++) { console.log(arr[i]); } }';
    const result = analyzeCode(code);
    expect(result.timeComplexity).toBe('O(n log n)');
  });
});
