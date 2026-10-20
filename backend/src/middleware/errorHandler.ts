import { Request, Response, NextFunction } from 'express';
import { config } from '../config/env.js';

export interface AppError extends Error {
  statusCode?: number;
}

export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
) {
  const statusCode = err.statusCode || 500;
  const isProduction = config.nodeEnv === 'production';

  // Log error safely without exposing raw tokens or secrets
  console.error(`[API Error ${statusCode}]:`, err.message);

  res.status(statusCode).json({
    error: err.message || 'An internal server error occurred.',
    ...(isProduction ? {} : { stack: err.stack }),
  });
}
