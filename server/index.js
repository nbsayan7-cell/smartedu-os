/**
 * SmartEdu OS — Backend API Server
 * Bridges the React frontend to Ollama, Document Processing, and the SIH 26207 Ecosystem.
 * 
 * Run: node server/index.js
 * Default port: 3001
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import chatRouter from './routes/chat.js';
import evaluateRouter from './routes/evaluate.js';
import healthRouter from './routes/health.js';
import documentsRouter from './routes/documents.js';
import parentRouter from './routes/parent.js';
import activityRouter from './routes/activity.js';
import simulateRouter from './routes/simulate.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware — open CORS for Vercel, cloud hosting, and local development
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static uploads folder
app.use('/uploads', express.static(path.join(process.cwd(), 'server', 'uploads')));

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.path !== '/api/health' && req.path !== '/api/activity/stats') {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} → ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// Routes
app.use('/api/chat', chatRouter);
app.use('/api/evaluate', evaluateRouter);
app.use('/api/health', healthRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/parent', parentRouter);
app.use('/api/activity', activityRouter);
app.use('/api/simulate', simulateRouter);

// Root health ping
app.get('/', (req, res) => {
  res.json({
    name: 'SmartEdu OS API Server',
    theme: 'SIH 26207 (Smart Education)',
    status: 'online',
    timestamp: new Date().toISOString()
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log('');
    console.log('╔═════════════════════════════════════════════════════╗');
    console.log('║   SmartEdu OS — SIH 26207 AI Backend Server         ║');
    console.log(`║   Running on http://localhost:${PORT}                   ║`);
    console.log('║   Endpoints: /api/documents, /api/parent, /api/chat ║');
    console.log('║   Ollama endpoint: localhost:11434                   ║');
    console.log('╚═════════════════════════════════════════════════════╝');
    console.log('');
  });
}

export default app;
