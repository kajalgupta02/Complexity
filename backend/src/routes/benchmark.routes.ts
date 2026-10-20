import { Router, Request, Response } from 'express';

export const benchmarkRouter = Router();

/**
 * Status Check for Dynamic Benchmark Sandbox
 * GET /api/benchmark/status
 */
benchmarkRouter.get('/status', (_req: Request, res: Response) => {
  return res.json({
    sandboxConfigured: false,
    status: 'unavailable',
    message:
      'Server-side hardware execution sandbox is not configured. Static AST analysis remains fully operational.',
  });
});

/**
 * Empirical Benchmarking Endpoint
 * POST /api/benchmark
 *
 * SECURITY NOTICE:
 * Arbitrary user-submitted code is NOT executed inside this Node.js process.
 * Standard `node:vm` is not an isolated security boundary and permits sandbox escapes.
 * Dynamic benchmarking requires a dedicated containerized hypervisor sandbox (e.g. gVisor / Firecracker).
 * Until such infrastructure is deployed, this endpoint safely refuses execution.
 */
benchmarkRouter.post('/', (_req: Request, res: Response) => {
  return res.status(501).json({
    success: false,
    error:
      'Server-side arbitrary code benchmarking is disabled for security. Dynamic microbenchmarking requires a hardware-isolated container sandbox (e.g. gVisor, Firecracker), which is not configured in this environment.',
    code: 'BENCHMARK_EXECUTION_UNAVAILABLE',
    sandboxConfigured: false,
  });
});
