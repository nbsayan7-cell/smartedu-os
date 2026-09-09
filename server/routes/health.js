import { Router } from 'express';
import { checkOllamaHealth } from '../services/ollamaClient.js';

const router = Router();

/**
 * GET /api/health — Check Ollama connection and list available models
 */
router.get('/', async (req, res) => {
  const ollamaStatus = await checkOllamaHealth();
  
  res.json({
    server: 'SmartEdu OS Backend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    ollama: ollamaStatus,
    plugins: {
      ragflow: { status: 'mock', description: 'Document RAG pipeline (Docker deployment available)' },
      langfuse: { status: 'ready', description: 'LLM observability & tracing' },
      crewai: { status: 'ready', description: 'Multi-agent orchestration framework' },
      langgraph: { status: 'ready', description: 'Stateful workflow orchestration' },
      dspy: { status: 'ready', description: 'Prompt optimization & compilation' },
      graphiti: { status: 'ready', description: 'Temporal knowledge graphs' },
      giskard: { status: 'ready', description: 'AI security & bias testing' },
      openWebUI: { status: 'available', description: 'Alternative chat interface' },
      flowise: { status: 'available', description: 'Visual LLM workflow builder' },
      semgrep: { status: 'available', description: 'Static code security analysis' },
      lobeChat: { status: 'available', description: 'Modern chat UI framework' },
      anythingLLM: { status: 'available', description: 'All-in-one AI desktop app' }
    }
  });
});

export default router;
