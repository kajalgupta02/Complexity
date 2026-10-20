import { Router, Request, Response } from 'express';
import { config } from '../config/env.js';
import { db } from '../db.js';

export const healthRouter = Router();

healthRouter.get('/', (_req: Request, res: Response) => {
  try {
    const userCountRow = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
    const snippetCountRow = db.prepare('SELECT COUNT(*) as count FROM snippets').get() as { count: number };

    res.json({
      status: 'ok',
      service: 'complexity-backend-api',
      version: '1.0.0',
      database: {
        type: 'sqlite',
        status: 'connected',
        records: {
          users: userCountRow.count,
          snippets: snippetCountRow.count,
        },
      },
      aiService: {
        provider: config.aiProvider,
        configured: config.aiProvider !== 'disabled',
        model: config.aiModel,
      },
      timestamp: new Date().toISOString(),
    });
  } catch {
    res.status(500).json({
      status: 'error',
      service: 'complexity-backend-api',
      error: 'Database health check failed.',
    });
  }
});
