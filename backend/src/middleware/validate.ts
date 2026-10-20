import { Request, Response, NextFunction } from 'express';
import { config } from '../config/env.js';
import type { SupportedLanguage } from '../analyzer/index.js';

export const VALID_LANGUAGES = new Set<SupportedLanguage>([
  'javascript',
  'typescript',
  'java',
  'c',
  'cpp',
  'python',
  'csharp',
  'go',
  'rust',
  'swift',
  'kotlin',
  'php',
  'ruby',
]);

/**
 * Validate input payload for analysis and optimization endpoints.
 */
export function validateCodeInput(req: Request, res: Response, next: NextFunction) {
  const { code, language } = req.body || {};

  if (typeof code !== 'string') {
    return res.status(400).json({ error: 'Field "code" (string) is required.' });
  }

  if (!code.trim()) {
    return res.status(400).json({ error: 'Code submission cannot be empty or only whitespace.' });
  }

  if (code.length > config.maxCodeLength) {
    return res.status(400).json({
      error: `Submitted code exceeds maximum size limit of ${config.maxCodeLength.toLocaleString()} characters.`,
    });
  }

  if (language !== undefined && language !== null) {
    if (typeof language !== 'string' || !VALID_LANGUAGES.has(language.toLowerCase() as SupportedLanguage)) {
      return res.status(400).json({
        error: `Unsupported language "${language}". Supported languages: ${Array.from(VALID_LANGUAGES).join(', ')}.`,
      });
    }
  }

  next();
}
