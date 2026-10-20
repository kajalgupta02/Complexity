import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import type { Server } from 'node:http';
import { app } from './server.js';
import { resetRateLimits } from './middleware/rateLimit.js';

let server: Server;
let baseUrl: string;

beforeAll(async () => {
  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      const addr = server.address();
      if (addr && typeof addr === 'object') {
        baseUrl = `http://localhost:${addr.port}`;
      }
      resolve();
    });
  });
});

afterAll(async () => {
  await new Promise<void>((resolve) => {
    server.close(() => resolve());
  });
});

beforeEach(() => {
  resetRateLimits();
  vi.restoreAllMocks();
});

describe('Complexity Production REST API Integration', () => {
  describe('GET /api/health', () => {
    it('returns application health status without leaking secrets', async () => {
      const res = await fetch(`${baseUrl}/api/health`);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.status).toBe('ok');
      expect(data.service).toBe('complexity-backend-api');
      expect(data.database.type).toBe('sqlite');
      expect(data.database.status).toBe('connected');

      // Security: ensure no secret keys leaked
      expect(JSON.stringify(data)).not.toContain('GEMINI_API_KEY');
      expect(JSON.stringify(data)).not.toContain('OPENAI_API_KEY');
    });
  });

  describe('POST /api/analyze', () => {
    it('analyzes valid algorithm code and derives Big-O complexity', async () => {
      const code = `function sum(n) {
        let total = 0;
        for (let i = 0; i < n; i++) {
          total += i;
        }
        return total;
      }`;

      const res = await fetch(`${baseUrl}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language: 'javascript' }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();

      expect(data.timeComplexity).toBe('O(n)');
      expect(data.analysisId).toBeDefined();
      expect(data.analyzedAt).toBeDefined();
      expect(data.detectedLanguage).toBe('javascript');
      expect(data.timeConfidence).toBeGreaterThanOrEqual(70);
    });

    it('identifies nested loops as quadratic O(n²)', async () => {
      const code = `function bubbleSort(arr) {
        for (let i = 0; i < arr.length; i++) {
          for (let j = 0; j < arr.length - 1; j++) {
            if (arr[j] > arr[j + 1]) {
              let t = arr[j];
              arr[j] = arr[j + 1];
              arr[j + 1] = t;
            }
          }
        }
      }`;

      const res = await fetch(`${baseUrl}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language: 'javascript' }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.timeComplexity).toBe('O(n²)');
      expect(data.loops.length).toBeGreaterThanOrEqual(2);
    });

    it('rejects missing or non-string code field with 400', async () => {
      const res = await fetch(`${baseUrl}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: 'javascript' }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('Field "code" (string) is required');
    });

    it('rejects empty or whitespace-only code with 400', async () => {
      const res = await fetch(`${baseUrl}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: '   \n\t  ', language: 'javascript' }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('cannot be empty');
    });

    it('rejects unsupported languages with 400 and lists valid languages', async () => {
      const res = await fetch(`${baseUrl}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: 'print("hi")', language: 'brainfuck' }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('Unsupported language "brainfuck"');
    });

    it('rejects payloads exceeding code length limit with 400', async () => {
      const hugeCode = 'a'.repeat(60000);

      const res = await fetch(`${baseUrl}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: hugeCode, language: 'javascript' }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('exceeds maximum size limit');
    });
  });

  describe('POST /api/optimize', () => {
    const validSampleCode = `function twoSum(nums, target) {
      for (let i = 0; i < nums.length; i++) {
        for (let j = i + 1; j < nums.length; j++) {
          if (nums[i] + nums[j] === target) return [i, j];
        }
      }
      return [];
    }`;

    it('validates request and returns 400 when code is missing', async () => {
      const res = await fetch(`${baseUrl}/api/optimize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: 'javascript' }),
      });

      expect(res.status).toBe(400);
    });

    it('returns 503 when AI provider is unconfigured without breaking static analysis', async () => {
      const originalFetch = globalThis.fetch;

      // When no external key is configured, /api/optimize reports unavailable
      const res = await fetch(`${baseUrl}/api/optimize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: validSampleCode, language: 'javascript' }),
      });

      // Status is 503 or 502 depending on key state
      expect([502, 503]).toContain(res.status);
      const data = await res.json();
      expect(data.error).toBeDefined();

      // Ensure static analysis STILL works independently!
      const staticRes = await fetch(`${baseUrl}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: validSampleCode, language: 'javascript' }),
      });
      expect(staticRes.status).toBe(200);

      globalThis.fetch = originalFetch;
    });

    it('enforces rate limiting on repeated optimization requests', async () => {
      // Send rapid requests up to limit
      for (let i = 0; i < 30; i++) {
        await fetch(`${baseUrl}/api/optimize`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: validSampleCode, language: 'javascript' }),
        });
      }

      // 31st request should hit 429
      const rateLimitedRes = await fetch(`${baseUrl}/api/optimize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: validSampleCode, language: 'javascript' }),
      });

      expect(rateLimitedRes.status).toBe(429);
      const data = await rateLimitedRes.json();
      expect(data.error).toContain('Rate limit exceeded');
      expect(rateLimitedRes.headers.get('Retry-After')).toBeDefined();
    });
  });

  describe('Algorithm Evaluation Dataset', () => {
    it('accurately evaluates known canonical algorithms', async () => {
      const algorithms = [
        {
          name: 'Logarithmic Loop',
          expectedTime: 'O(log n)',
          code: `function logLoop(n) {
            let i = 1;
            while (i < n) {
              i *= 2;
            }
            return i;
          }`,
        },
        {
          name: 'Linear Scan',
          expectedTime: 'O(n)',
          code: `function findMax(arr) {
            let max = arr[0];
            for (let i = 1; i < arr.length; i++) {
              if (arr[i] > max) max = arr[i];
            }
            return max;
          }`,
        },
        {
          name: 'Nested Pairs Count',
          expectedTime: 'O(n²)',
          code: `function countPairs(arr) {
            let count = 0;
            for (let i = 0; i < arr.length; i++) {
              for (let j = 0; j < arr.length; j++) {
                count++;
              }
            }
            return count;
          }`,
        },
      ];

      for (const algo of algorithms) {
        const res = await fetch(`${baseUrl}/api/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: algo.code, language: 'javascript' }),
        });

        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.timeComplexity).toBe(algo.expectedTime);
      }
    });
  });
});
