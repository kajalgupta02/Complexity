import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'complexity-super-secure-secret-key-2026';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  userEmail?: string;
}

/**
 * Generate a signed JWT token valid for 7 days.
 */
export function signToken(payload: { id: string; email: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

/**
 * Express middleware to protect private routes.
 * Checks for `Authorization: Bearer <token>` header.
 */
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Please login.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string };
    req.userId = decoded.id;
    req.userEmail = decoded.email;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired session token.' });
  }
}

/**
 * Optional Auth middleware: extracts user if token exists, but doesn't block if missing.
 */
export function optionalAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string };
      req.userId = decoded.id;
      req.userEmail = decoded.email;
    } catch {
      // Ignore invalid token for optional auth
    }
  }
  next();
}
