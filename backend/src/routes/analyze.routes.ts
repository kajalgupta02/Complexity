import { Router, Request, Response, NextFunction } from 'express';
import { validateCodeInput } from '../middleware/validate.js';
import { performStaticAnalysis } from '../services/analysis.service.js';
import type { SupportedLanguage } from '../analyzer/index.js';

export const analyzeRouter = Router();

/**
 * POST /api/analyze
 * Analyzes submitted code using the static AST analysis engine.
 */
analyzeRouter.post(
  '/',
  validateCodeInput,
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const { code, language } = req.body;
      const result = performStaticAnalysis(code, language as SupportedLanguage);
      return res.json(result);
    } catch (error) {
      return next(error);
    }
  }
);
