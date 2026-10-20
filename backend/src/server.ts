import express from 'express';
import cors from 'cors';
import { config } from './config/env.js';
import { initDatabase } from './db.js';
import { healthRouter } from './routes/health.routes.js';
import { analyzeRouter } from './routes/analyze.routes.js';
import { optimizeRouter } from './routes/optimize.routes.js';
import { authRouter } from './routes/auth.routes.js';
import { snippetsRouter } from './routes/snippets.routes.js';
import { benchmarkRouter } from './routes/benchmark.routes.js';
import { errorHandler } from './middleware/errorHandler.js';

export const app = express();

// Initialize database tables & seed data on server boot
initDatabase();

// 1. Trust Proxy Configuration
// Configures reverse proxy topology safely to derive true client IPs for rate limiting
if (config.trustProxy !== false) {
  app.set('trust proxy', config.trustProxy);
}

// 2. Multi-Origin CORS Configuration
// Parse configured origins safely (comma-separated list or single origin)
const configuredOrigins = config.corsOrigin
  .split(',')
  .map((o) => o.trim())
  .filter((o) => o.length > 0);

// In development, ensure standard local development origins are included
if (config.nodeEnv !== 'production') {
  if (!configuredOrigins.includes('http://localhost:3000')) {
    configuredOrigins.push('http://localhost:3000');
  }
  if (!configuredOrigins.includes('http://127.0.0.1:3000')) {
    configuredOrigins.push('http://127.0.0.1:3000');
  }
}

app.use(
  cors({
    origin: (requestOrigin, callback) => {
      // Allow non-browser requests (e.g. mobile apps, curl, server-to-server)
      if (!requestOrigin) return callback(null, true);

      // If wildcard is configured, allow requesting origin with credentials
      if (configuredOrigins.includes('*') || configuredOrigins.includes(requestOrigin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked: Origin "${requestOrigin}" is not allowed.`));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '100kb' }));

// Route Mounts
app.use('/api/health', healthRouter);
app.use('/api/analyze', analyzeRouter);
app.use('/api/optimize', optimizeRouter);
app.use('/api/auth', authRouter);
app.use('/api/snippets', snippetsRouter);
app.use('/api/benchmark', benchmarkRouter);

// Centralized Error Handler (must be registered after all routes)
app.use(errorHandler);

// Start server if executed directly
if (process.env.NODE_ENV !== 'test') {
  app.listen(config.port, () => {
    console.log(`🚀 Complexity Production API running at http://localhost:${config.port}`);
    console.log(`📡 AI Optimization Provider: ${config.aiProvider.toUpperCase()} (${config.aiModel})`);
    console.log(
      `🔒 Rate limiting active on /api/optimize (${config.rateLimitMaxRequests} req / ${config.rateLimitWindowMs / 60000}m)`
    );
  });
}
