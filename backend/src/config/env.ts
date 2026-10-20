import 'dotenv/config';

export interface AppConfig {
  port: number;
  nodeEnv: string;
  corsOrigin: string;
  trustProxy: boolean | number | string;
  aiProvider: 'gemini' | 'openai' | 'disabled';
  geminiApiKey?: string;
  openaiApiKey?: string;
  aiModel: string;
  aiTimeoutMs: number;
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
  maxCodeLength: number;
}

function parseTrustProxy(val?: string): boolean | number | string {
  if (!val) return 'loopback';
  if (val.toLowerCase() === 'true') return true;
  if (val.toLowerCase() === 'false') return false;
  const num = Number(val);
  if (!isNaN(num)) return num;
  return val;
}

export const config: AppConfig = {
  port: Number(process.env.PORT) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  trustProxy: parseTrustProxy(process.env.TRUST_PROXY),
  aiProvider:
    (process.env.AI_PROVIDER as 'gemini' | 'openai') ||
    (process.env.GEMINI_API_KEY ? 'gemini' : process.env.OPENAI_API_KEY ? 'openai' : 'disabled'),
  geminiApiKey: process.env.GEMINI_API_KEY,
  openaiApiKey: process.env.OPENAI_API_KEY,
  aiModel:
    process.env.AI_MODEL || (process.env.OPENAI_API_KEY ? 'gpt-4o-mini' : 'gemini-1.5-flash'),
  aiTimeoutMs: Number(process.env.AI_TIMEOUT_MS) || 15000,
  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  rateLimitMaxRequests: Number(process.env.RATE_LIMIT_MAX) || 30, // 30 requests per window
  maxCodeLength: Number(process.env.MAX_CODE_LENGTH) || 50000, // 50,000 characters
};
