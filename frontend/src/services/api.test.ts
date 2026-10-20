import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  requestAnalysis,
  requestOptimization,
  runEmpiricalBenchmark,
  OptimizationServiceError,
  type OptimizationRequest,
} from './api';

describe('Frontend API Service Layer', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe('requestAnalysis', () => {
    it('returns remote analysis result when backend responds successfully', async () => {
      const mockResult = {
        version: '1.0',
        detectedLanguage: 'javascript',
        timeComplexity: 'O(n)',
        timeConfidence: 95,
        spaceComplexity: { class: 'O(1)', reasoning: [] },
        loops: [],
        recursion: { hasDirectRecursion: false, hasMutualRecursion: false, recursiveFunctions: [] },
        patterns: { hasLogarithmicStep: false, hasDivideAndConquer: false, hasTailRecursion: false, hasImplicitLoops: false, hasSortCalls: false },
        reasoningChain: [],
        detectedPatterns: [],
        whatWouldChange: [],
        knownLimitations: [],
        stdlibCalls: [],
        detailed: {
          highLevelSummary: 'Linear scan',
          algorithmUsed: [],
          stepByStepExecution: [],
          timeComplexity: { worst: 'O(n)', average: 'O(n)', best: 'O(1)' },
          spaceComplexity: { auxiliary: 'O(1)' },
          complexityDerivation: [],
          loopAnalysis: [],
          recursiveAnalysis: { hasRecursion: false },
          memoryUsage: [],
          performanceNotes: [],
          possibleOptimizations: [],
          finalResult: {
            programmingLanguage: 'javascript',
            algorithm: 'Linear',
            worstTime: 'O(n)',
            averageTime: 'O(n)',
            bestTime: 'O(1)',
            space: 'O(1)',
            difficulty: 'Easy',
          },
        },
      };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResult,
      } as unknown as Response);

      const result = await requestAnalysis('function test(n) { for(let i=0; i<n; i++) {} }', 'javascript');
      expect(result.timeComplexity).toBe('O(n)');
      expect(globalThis.fetch).toHaveBeenCalledWith('/api/analyze', expect.any(Object));
    });

    it('falls back to client-side static engine when backend is offline without throwing', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error (Failed to fetch)'));

      const code = 'function add(a, b) { return a + b; }';
      const result = await requestAnalysis(code, 'javascript');

      expect(result).toBeDefined();
      expect(result.timeComplexity).toBe('O(1)');
      expect(result.timeConfidence).toBe(100);
    });
  });

  describe('requestOptimization', () => {
    const sampleReq: OptimizationRequest = {
      code: 'function twoSum(nums, target) { for (let i=0; i<nums.length; i++) for (let j=i+1; j<nums.length; j++) if (nums[i]+nums[j]===target) return [i,j]; }',
      language: 'javascript',
      analysis: {
        timeComplexity: 'O(n²)',
        spaceComplexity: 'O(1)',
      },
    };

    it('successfully processes valid optimization response with verification status', async () => {
      const mockSuccessResponse = {
        optimizedCode: 'function twoSum(nums, target) { const map = new Map(); for (let i=0; i<nums.length; i++) { const diff = target - nums[i]; if (map.has(diff)) return [map.get(diff), i]; map.set(nums[i], i); } }',
        originalInefficiency: 'Nested loop compares every pair in O(n²) time.',
        proposedTimeComplexity: 'O(n)',
        proposedSpaceComplexity: 'O(n)',
        assumptions: ['Numbers fit into standard memory'],
        tradeoffs: ['Uses O(n) auxiliary memory for hash map'],
        explanation: 'Replaced nested search with constant-time hash map lookups.',
        verificationStatus: 'verified',
        verificationDetails: { testsPassed: 5, testsTotal: 5, message: 'All assertions passed' },
      };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockSuccessResponse,
      } as unknown as Response);

      const result = await requestOptimization(sampleReq);

      expect(result.optimizedCode).toContain('new Map()');
      expect(result.proposedTimeComplexity).toBe('O(n)');
      expect(result.verificationStatus).toBe('verified');
      expect(result.tradeoffs).toHaveLength(1);
    });

    it('throws descriptive OptimizationServiceError when endpoint returns 404', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Not Found' }),
      } as unknown as Response);

      await expect(requestOptimization(sampleReq)).rejects.toThrow(OptimizationServiceError);
      await expect(requestOptimization(sampleReq)).rejects.toThrow(
        /Optimization backend endpoint \(\/api\/optimize\) is not yet configured/
      );
    });

    it('throws error when server returns malformed payload missing optimizedCode', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ proposedTimeComplexity: 'O(n)' }), // missing optimizedCode
      } as unknown as Response);

      await expect(requestOptimization(sampleReq)).rejects.toThrow(
        /Received malformed response from optimization service/
      );
    });

    it('handles request cancellation via AbortSignal without crashing', async () => {
      const controller = new AbortController();
      controller.abort();

      await expect(requestOptimization(sampleReq, { signal: controller.signal })).rejects.toThrow(
        /Optimization request was cancelled/
      );
    });

    it('ensures failed optimization requests do NOT break static analysis functionality', async () => {
      // Simulate backend optimization service failure
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Connection refused'));

      let optError: Error | null = null;
      try {
        await requestOptimization(sampleReq);
      } catch (e) {
        optError = e as Error;
      }
      expect(optError).toBeInstanceOf(OptimizationServiceError);

      // Now verify that static analysis still runs independently and accurately
      const code = `function sum(n) {
        let total = 0;
        for (let i = 0; i < n; i++) {
          total += i;
        }
        return total;
      }`;
      const staticResult = await requestAnalysis(code, 'javascript');
      expect(staticResult.timeComplexity).toBe('O(n)');
    });
  });

  describe('runEmpiricalBenchmark', () => {
    it('returns benchmark points when endpoint succeeds', async () => {
      const mockBenchmark = {
        success: true,
        points: [
          { n: 100, timeMs: 0.05 },
          { n: 500, timeMs: 0.12 },
          { n: 1000, timeMs: 0.22 },
        ],
        empiricalVerdict: 'O(n)',
        sampleCount: 3,
        timestamp: new Date().toISOString(),
      };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockBenchmark,
      } as unknown as Response);

      const res = await runEmpiricalBenchmark('function f(arr) {}', [100, 500, 1000]);
      expect(res.points).toHaveLength(3);
      expect(res.empiricalVerdict).toBe('O(n)');
    });

    it('throws descriptive error when benchmark request fails', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'Sandbox execution timed out' }),
      } as unknown as Response);

      await expect(runEmpiricalBenchmark('while(true){}')).rejects.toThrow('Sandbox execution timed out');
    });
  });
});
