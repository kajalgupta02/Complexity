import express from 'express';
import cors from 'cors';
import { analyzeCode, SupportedLanguage } from './analyzer/index.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '2mb' }));

// Health Check Endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'big-o-analyzer-backend',
    timestamp: new Date().toISOString()
  });
});

// Code Analysis Endpoint
app.post('/api/analyze', (req, res) => {
  try {
    const { code, language } = req.body || {};
    if (typeof code !== 'string') {
      return res.status(400).json({ error: 'Field "code" (string) is required' });
    }

    const result = analyzeCode(code, language as SupportedLanguage);
    return res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Analysis failed';
    return res.status(500).json({ error: message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Big-O Analyzer Backend API running at http://localhost:${PORT}`);
});
