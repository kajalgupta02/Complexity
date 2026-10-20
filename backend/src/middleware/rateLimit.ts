import { Request, Response, NextFunction } from 'express';
import { config } from '../config/env.js';

interface ClientRecord {
  timestamps: number[];
}

const clientMap = new Map<string, ClientRecord>();

// Clean up stale client entries periodically (every 10 minutes)
setInterval(() => {
  const now = Date.now();
  const cutoff = now - config.rateLimitWindowMs;
  for (const [ip, record] of clientMap.entries()) {
    const valid = record.timestamps.filter((t) => t > cutoff);
    if (valid.length === 0) {
      clientMap.delete(ip);
    } else {
      record.timestamps = valid;
    }
  }
}, 10 * 60 * 1000).unref();

/**
 * In-memory sliding window rate limiter for expensive endpoints (e.g. /api/optimize).
 * Zero external Redis or dependencies required.
 */
export function rateLimiter(
  windowMs = config.rateLimitWindowMs,
  maxRequests = config.rateLimitMaxRequests
) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Securely derive client IP from Express req.ip (which respects configured trust proxy)
    // Avoid blindly trusting unverified client-supplied X-Forwarded-For headers
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown-client';

    const now = Date.now();
    const cutoff = now - windowMs;

    let record = clientMap.get(clientIp);
    if (!record) {
      record = { timestamps: [] };
      clientMap.set(clientIp, record);
    }

    // Keep only timestamps within current window
    record.timestamps = record.timestamps.filter((t) => t > cutoff);

    if (record.timestamps.length >= maxRequests) {
      const oldest = record.timestamps[0];
      const retryAfterSec = Math.ceil((oldest + windowMs - now) / 1000);
      res.setHeader('Retry-After', Math.max(1, retryAfterSec));
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', 0);

      return res.status(429).json({
        error: `Rate limit exceeded. Maximum ${maxRequests} requests per ${windowMs / 60000} minutes. Please try again later.`,
        retryAfter: retryAfterSec,
      });
    }

    record.timestamps.push(now);
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', maxRequests - record.timestamps.length);

    next();
  };
}

/** Reset in-memory rate limiter records (useful in automated tests) */
export function resetRateLimits() {
  clientMap.clear();
}
