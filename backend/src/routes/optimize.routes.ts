import { Router, Request, Response, NextFunction } from 'express';
import { validateCodeInput } from '../middleware/validate.js';
import { rateLimiter } from '../middleware/rateLimit.js';
import { defaultOptimizationService } from '../services/optimize.service.js';
import { AIProviderUnavailableError, AIProviderRequestError } from '../ai/adapter.js';
import { MalformedAIResponseError } from '../ai/validator.js';
import type { SupportedLanguage } from '../analyzer/index.js';

export const optimizeRouter = Router();

/**
 * POST /api/optimize
 * Generates an AI-assisted optimization proposal with authoritative AST grounding
 * and honest verification statuses.
 */
optimizeRouter.post(
  '/',
  rateLimiter(),
  validateCodeInput,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { code, language } = req.body;

      const result = await defaultOptimizationService.generateOptimization(
        code,
        language as SupportedLanguage
      );

      return res.json(result);
    } catch (error) {
      if (error instanceof AIProviderUnavailableError) {
        return res.status(503).json({
          error: error.message,
          code: 'AI_PROVIDER_UNAVAILABLE',
        });
      }

      if (error instanceof AIProviderRequestError) {
        return res.status(error.statusCode || 502).json({
          error: `Upstream AI provider error: ${error.message}`,
          code: 'UPSTREAM_AI_ERROR',
        });
      }

      if (error instanceof MalformedAIResponseError) {
        return res.status(502).json({
          error: `AI provider generated an unparseable response: ${error.message}`,
          code: 'MALFORMED_AI_OUTPUT',
        });
      }

      return next(error);
    }
  }
);
