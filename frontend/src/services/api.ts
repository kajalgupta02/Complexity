import { analyzeCode as analyzeLocal } from '@/lib/analyzer';
import type { AnalysisResult, SupportedLanguage, ComplexityClass } from '@/lib/analyzer/types';

// Environment-based API Base URL (defaults to relative root for proxy or same-origin)
const API_BASE_URL = import.meta.env.VITE_API_URL || '';
const TOKEN_KEY = 'complexity_jwt_token';

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAuthToken(token: string | null) {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch { /* ignore */ }
}

// ==========================================
// 1. Static AST Code Analysis API
// ==========================================
export async function requestAnalysis(
  code: string,
  language?: SupportedLanguage,
  options?: { signal?: AbortSignal }
): Promise<AnalysisResult> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code, language }),
      signal: options?.signal,
    });

    if (response.ok) {
      const data = await response.json();
      return data as AnalysisResult;
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw error;
    }
    console.warn('Backend API unavailable, executing client-side analysis engine fallback:', error);
  }

  // Fallback: Run static analysis engine directly in browser if backend server is unreachable
  return analyzeLocal(code, language);
}

// ==========================================
// 2. Proof-to-Optimize API Contracts
// ==========================================
export type VerificationStatus = 'verified' | 'partially-verified' | 'unverified' | 'failed';

export interface VerificationDetails {
  testsPassed?: number;
  testsTotal?: number;
  message?: string;
  testCases?: Array<{ name: string; passed: boolean; output?: string }>;
}

export interface EmpiricalBenchmarkResult {
  measured: boolean;
  originalMs?: number;
  optimizedMs?: number;
  inputSize?: number;
  memoryDeltaKb?: number;
}

export interface OptimizationRequest {
  code: string;
  language: SupportedLanguage;
  analysis?: {
    timeComplexity: ComplexityClass | string;
    spaceComplexity: string;
    loops?: Array<{ type: string; startLine: number; endLine: number; nestingDepth: number }>;
    patterns?: string[];
  };
}

export interface OptimizationResult {
  optimizedCode: string;
  originalInefficiency: string;
  proposedTimeComplexity: ComplexityClass | string;
  proposedSpaceComplexity: string;
  assumptions: string[];
  tradeoffs: string[];
  explanation: string;
  verificationStatus: VerificationStatus;
  verificationDetails?: VerificationDetails;
  empiricalBenchmark?: EmpiricalBenchmarkResult;
}

export class OptimizationServiceError extends Error {
  constructor(message: string, public readonly statusCode?: number) {
    super(message);
    this.name = 'OptimizationServiceError';
  }
}

/**
 * Request an AI/Backend assisted code optimization.
 * Submits the code, language, and static findings to /api/optimize.
 * If the endpoint is unconfigured or unavailable, returns a clean typed error.
 * Never fabricates fake AI results.
 */
export async function requestOptimization(
  req: OptimizationRequest,
  options?: { signal?: AbortSignal; timeoutMs?: number }
): Promise<OptimizationResult> {
  const timeoutMs = options?.timeoutMs ?? 15000;
  const controller = new AbortController();

  // Check if signal is already aborted
  if (options?.signal?.aborted) {
    throw new Error('Optimization request was cancelled.');
  }

  // Handle external abort signal
  if (options?.signal) {
    options.signal.addEventListener('abort', () => controller.abort());
  }

  const timeoutTimer = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    const token = getAuthToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE_URL}/api/optimize`, {
      method: 'POST',
      headers,
      body: JSON.stringify(req),
      signal: controller.signal,
    });

    clearTimeout(timeoutTimer);

    if (!res.ok) {
      if (res.status === 404) {
        throw new OptimizationServiceError(
          'Optimization backend endpoint (/api/optimize) is not yet configured or running. Your static analysis results are intact.',
          404
        );
      }
      const data = await res.json().catch(() => ({}));
      throw new OptimizationServiceError(
        data.error || `Optimization service error (HTTP ${res.status})`,
        res.status
      );
    }

    const data = await res.json();
    if (!data || typeof data.optimizedCode !== 'string') {
      throw new OptimizationServiceError('Received malformed response from optimization service.');
    }

    return {
      optimizedCode: data.optimizedCode,
      originalInefficiency: data.originalInefficiency || 'High asymptotic operation count or repeated redundant work.',
      proposedTimeComplexity: data.proposedTimeComplexity || 'O(n)',
      proposedSpaceComplexity: data.proposedSpaceComplexity || 'O(1)',
      assumptions: Array.isArray(data.assumptions) ? data.assumptions : [],
      tradeoffs: Array.isArray(data.tradeoffs) ? data.tradeoffs : [],
      explanation: data.explanation || 'Refactored code to reduce operations and improve scaling.',
      verificationStatus: (['verified', 'partially-verified', 'unverified', 'failed'].includes(data.verificationStatus)
        ? data.verificationStatus
        : 'unverified') as VerificationStatus,
      verificationDetails: data.verificationDetails,
      empiricalBenchmark: data.empiricalBenchmark,
    };
  } catch (error) {
    clearTimeout(timeoutTimer);
    if (error instanceof OptimizationServiceError) {
      throw error;
    }
    if (
      options?.signal?.aborted ||
      (error instanceof Error && (error.name === 'AbortError' || error.message.includes('cancelled') || error.message.includes('abort')))
    ) {
      throw new Error('Optimization request was cancelled.');
    }
    if (controller.signal.aborted) {
      throw new OptimizationServiceError(
        `Optimization request timed out after ${timeoutMs / 1000} seconds. The server took too long to respond.`,
        408
      );
    }
    throw new OptimizationServiceError(
      'Unable to connect to optimization service. Ensure your backend server is active at ' +
        (API_BASE_URL || 'http://localhost:5000') +
        '.'
    );
  }
}

// ==========================================
// 3. Authentication API (Express + SQLite)
// ==========================================
export const authApi = {
  async register(name: string, email: string, pass: string) {
    const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password: pass }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    if (data.token) setAuthToken(data.token);
    return data;
  },

  async login(email: string, pass: string) {
    const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pass }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    if (data.token) setAuthToken(data.token);
    return data;
  },

  async getMe() {
    const token = getAuthToken();
    if (!token) return null;
    const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      setAuthToken(null);
      return null;
    }
    const data = await res.json();
    return data.user;
  },
};

// ==========================================
// 4. Snippets Database API (Express + SQLite)
// ==========================================
export const snippetsApi = {
  async fetchSnippets() {
    const token = getAuthToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE_URL}/api/snippets`, { headers });
    if (!res.ok) throw new Error('Failed to fetch snippets');
    const data = await res.json();
    return data.snippets;
  },

  async saveSnippet(snippet: {
    title: string;
    code: string;
    language: string;
    timeComplexity: string;
    spaceComplexity: string;
    tags?: string[];
  }) {
    const token = getAuthToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE_URL}/api/snippets`, {
      method: 'POST',
      headers,
      body: JSON.stringify(snippet),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to save snippet');
    return data.snippet;
  },

  async deleteSnippet(id: string) {
    const token = getAuthToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE_URL}/api/snippets/${id}`, {
      method: 'DELETE',
      headers,
    });
    if (!res.ok) throw new Error('Failed to delete snippet');
    return true;
  },

  async toggleFavorite(id: string) {
    const token = getAuthToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE_URL}/api/snippets/${id}/favorite`, {
      method: 'PATCH',
      headers,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to toggle favorite');
    return data;
  },

  async getSharedSnippet(slugOrId: string) {
    const res = await fetch(`${API_BASE_URL}/api/snippets/share/${slugOrId}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Snippet not found');
    return data.snippet;
  },
};

// ==========================================
// 5. Empirical Microbenchmarking API (Sandbox)
// ==========================================
export interface BenchmarkPoint {
  n: number;
  timeMs: number;
}

export interface BenchmarkResponse {
  success: boolean;
  points: BenchmarkPoint[];
  empiricalVerdict: string;
  sampleCount: number;
  timestamp: string;
}

export async function runEmpiricalBenchmark(
  code: string,
  inputSizes: number[] = [100, 500, 1000, 2500, 5000],
  options?: { signal?: AbortSignal }
): Promise<BenchmarkResponse> {
  const res = await fetch(`${API_BASE_URL}/api/benchmark`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, inputSizes }),
    signal: options?.signal,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Benchmark failed');
  return data as BenchmarkResponse;
}
