import { Router } from 'express';
import { chatCompletion, chatCompletionStream } from '../services/ollamaClient.js';
import { buildSystemPrompt } from '../services/promptTemplates.js';

const router = Router();

/**
 * POST /api/chat — Non-streaming chat
 */
router.post('/', async (req, res) => {
  try {
    const { message, mode = 'SOCRATIC', model, context = {} } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });

    const systemPrompt = buildSystemPrompt(mode, context);
    const result = await chatCompletion(model, systemPrompt, message, {
      history: context.history || [],
      temperature: mode === 'EXAM' ? 0.3 : 0.7
    });

    res.json({
      type: mode === 'DEBUG_MISCONCEPTION' ? 'MISCONCEPTION_DIAGNOSIS' : 
            mode === 'HINT' ? 'HINT_ESCALATION' :
            mode === 'SOCRATIC' ? 'SOCRATIC_PROMPT' : 'GUIDED_RESPONSE',
      title: `AI Coach: ${context.conceptName || 'General'}`,
      text: result.content,
      model: result.model,
      duration: result.totalDuration,
      tokenCount: result.evalCount
    });
  } catch (err) {
    console.error('[Chat Error]', err.message);
    res.status(502).json({ error: 'Ollama unavailable', details: err.message, offline: true });
  }
});

/**
 * POST /api/chat/stream — SSE streaming chat
 */
router.post('/stream', async (req, res) => {
  try {
    const { message, mode = 'SOCRATIC', model, context = {} } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });

    const systemPrompt = buildSystemPrompt(mode, context);
    const { body: stream, resolvedModel } = await chatCompletionStream(model, systemPrompt, message, {
      history: context.history || [],
      temperature: mode === 'EXAM' ? 0.3 : 0.7
    });

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    // Notify client of resolved model immediately
    res.write(`data: ${JSON.stringify({ model: resolvedModel, start: true })}\n\n`);

    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const parsed = JSON.parse(line);
            if (parsed.message?.content) {
              res.write(`data: ${JSON.stringify({ token: parsed.message.content })}\n\n`);
            }
            if (parsed.done) {
              res.write(`data: ${JSON.stringify({ 
                done: true, 
                model: parsed.model || resolvedModel,
                totalDuration: parsed.total_duration,
                evalCount: parsed.eval_count
              })}\n\n`);
            }
          } catch {
            // Skip malformed lines
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    console.error('[Stream Error]', err.message);
    if (!res.headersSent) {
      res.status(502).json({ error: 'Ollama unavailable', details: err.message, offline: true });
    } else {
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      res.end();
    }
  }
});

export default router;
