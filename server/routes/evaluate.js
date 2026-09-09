import { Router } from 'express';
import { generateStructuredOutput } from '../services/ollamaClient.js';
import { buildEvaluationPrompt } from '../services/promptTemplates.js';

const router = Router();

/**
 * POST /api/evaluate — Evaluate a Teach-Back explanation using AI
 */
router.post('/', async (req, res) => {
  try {
    const { explanation, conceptName = 'Pointers in C', model } = req.body;
    if (!explanation) return res.status(400).json({ error: 'Explanation text is required' });

    const systemPrompt = buildEvaluationPrompt(conceptName);
    const result = await generateStructuredOutput(model, systemPrompt, 
      `Student explanation of "${conceptName}":\n\n${explanation}`
    );

    if (result.parseError) {
      return res.json({
        totalScore: 50,
        grade: 'Developing',
        feedback: result.raw || 'AI could not parse evaluation. Please try again.',
        rubrics: [],
        aiGenerated: true
      });
    }

    res.json({ ...result, aiGenerated: true });
  } catch (err) {
    console.error('[Evaluate Error]', err.message);
    res.status(502).json({ error: 'Ollama unavailable', details: err.message, offline: true });
  }
});

export default router;
