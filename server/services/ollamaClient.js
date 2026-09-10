/**
 * Ollama API Client — SmartEdu OS Backend
 * Handles both streaming (SSE) and non-streaming requests to local Ollama.
 * Auto-detects installed models and resolves optimal defaults.
 * 
 * 3-Tier AI Fallback Chain:
 * 1. Local Ollama (fastest, private, zero cost)
 * 2. Pollinations.ai (free cloud, unlimited, no API key)
 * 3. Graceful offline fallback
 */

const OLLAMA_BASE = process.env.OLLAMA_URL || 'http://localhost:11434';
const POLLINATIONS_URL = 'https://text.pollinations.ai/';

let cachedModels = null;
let lastModelCheck = 0;

/**
 * Check if Ollama is reachable and list available models
 */
export async function checkOllamaHealth() {
  try {
    const res = await fetch(`${OLLAMA_BASE}/api/tags`, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return { connected: false, models: [] };
    const data = await res.json();
    const models = (data.models || []).map(m => ({
      name: m.name,
      size: m.size,
      modified: m.modified_at
    }));
    cachedModels = models;
    lastModelCheck = Date.now();
    return { connected: true, models };
  } catch {
    return { connected: false, models: [] };
  }
}

/**
 * Get available models, caching for 10 seconds
 */
export async function getAvailableModels() {
  const now = Date.now();
  if (cachedModels && (now - lastModelCheck < 10000)) {
    return cachedModels;
  }
  const health = await checkOllamaHealth();
  return health.models || [];
}

/**
 * Resolve the best model to use:
 * 1. Exact match with requested model
 * 2. Prefix/substring match with requested model
 * 3. Priority fallback from installed models (llama3, llama3.1, mistral, phi3, etc.)
 * 4. First available installed model
 */
export async function resolveModel(requestedModel) {
  const models = await getAvailableModels();
  const modelNames = models.map(m => m.name);

  if (requestedModel) {
    if (modelNames.includes(requestedModel)) return requestedModel;
    const match = modelNames.find(n => n.startsWith(requestedModel) || n.includes(requestedModel));
    if (match) return match;
  }

  // Preferred educational / general reasoning models
  const preferred = [
    'llama3:latest',
    'llama3',
    'llama3.1:8b',
    'llama3.1:latest',
    'llama3.1',
    'mistral:latest',
    'mistral',
    'phi3:latest',
    'phi3',
    'gemma2:latest',
    'gemma2',
    'qwen2.5:latest',
    'moondream:latest'
  ];

  for (const pref of preferred) {
    if (modelNames.includes(pref)) return pref;
    const partial = modelNames.find(n => n.startsWith(pref));
    if (partial) return partial;
  }

  if (modelNames.length > 0) return modelNames[0];

  return requestedModel || 'llama3:latest';
}

// ═══════════════════════════════════════════════════════════════════
// Pollinations.ai — FREE UNLIMITED Cloud AI (No API Key Required)
// ═══════════════════════════════════════════════════════════════════

/**
 * Call Pollinations.ai free cloud API (OpenAI-compatible format)
 * Completely free, no API key, unlimited tokens.
 * Retries with model fallback chain: openai → openai-fast → openai-large
 */
const CLOUD_MODELS = ['openai-fast', 'openai'];

async function pollinationsChat(messages, options = {}) {
  const requestedModel = options.model || 'openai-fast';
  const modelsToTry = [requestedModel, ...CLOUD_MODELS.filter(m => m !== requestedModel)];
  let lastError = null;

  for (const m of modelsToTry) {
    try {
      const res = await fetch(POLLINATIONS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages,
          model: m,
          temperature: options.temperature ?? 0.7,
          max_tokens: options.max_tokens ?? 1024
        }),
        signal: AbortSignal.timeout(options.timeout ?? 8000)
      });

      if (res.ok) {
        const text = await res.text();
        if (text && !text.startsWith('<!DOCTYPE') && !text.startsWith('<html')) {
          return {
            content: text.trim(),
            model: `pollinations-${m}`,
            provider: 'pollinations.ai (free unlimited)'
          };
        }
      }
      lastError = new Error(`Pollinations.ai HTTP ${res.status} (model: ${m})`);
    } catch (err) {
      lastError = err;
    }
  }

  // Fast GET fallback
  try {
    const userMsg = [...messages].reverse().find(m => m.role === 'user')?.content || 'Hello';
    const sysMsg = messages.find(m => m.role === 'system')?.content || '';
    const combined = sysMsg ? `${sysMsg}\n\nTask: ${userMsg}` : userMsg;
    const getRes = await fetch(`${POLLINATIONS_URL}${encodeURIComponent(combined.slice(0, 1000))}?model=openai-fast`, {
      signal: AbortSignal.timeout(8000)
    });
    if (getRes.ok) {
      const text = await getRes.text();
      if (text && !text.startsWith('<!DOCTYPE') && !text.startsWith('<html')) {
        return {
          content: text.trim(),
          model: 'pollinations-openai-fast',
          provider: 'pollinations.ai (free unlimited)'
        };
      }
    }
  } catch (getErr) {
    lastError = getErr;
  }

  throw lastError || new Error('All Pollinations.ai models unavailable');
}

/**
 * Call Pollinations.ai for structured JSON output
 */
async function pollinationsStructuredOutput(systemPrompt, userMessage) {
  const result = await pollinationsChat([
    { role: 'system', content: systemPrompt + '\n\nYou MUST respond ONLY with valid JSON. No markdown, no explanations.' },
    { role: 'user', content: userMessage }
  ], { temperature: 0.3, timeout: 10000 });

  const parsed = extractJson(result.content);
  if (parsed) {
    return { ...parsed, model: 'pollinations-openai-fast', provider: 'pollinations.ai' };
  }
  return { raw: result.content, parseError: true, model: 'pollinations-openai-fast' };
}


// ═══════════════════════════════════════════════════════════════════
// Chat Completion with 3-Tier Fallback
// ═══════════════════════════════════════════════════════════════════

/**
 * Non-streaming chat completion — 3-tier: Ollama → Pollinations → offline
 */
export async function chatCompletion(model, systemPrompt, userMessage, options = {}) {
  // Tier 1: Try local Ollama only if NOT running in serverless cloud (Vercel)
  if (!process.env.VERCEL) {
    try {
      const activeModel = await resolveModel(model);
      const res = await fetch(`${OLLAMA_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: activeModel,
          messages: [
            { role: 'system', content: systemPrompt },
            ...(options.history || []),
            { role: 'user', content: userMessage }
          ],
          stream: false,
          options: {
            temperature: options.temperature ?? 0.7,
            top_p: options.top_p ?? 0.9,
            num_predict: options.max_tokens ?? 1024
          }
        }),
        signal: AbortSignal.timeout(3000)
      });

      if (res.ok) {
        const data = await res.json();
        return {
          content: data.message?.content || '',
          model: data.model || activeModel,
          totalDuration: data.total_duration,
          evalCount: data.eval_count,
          provider: 'ollama-local'
        };
      }
    } catch (ollamaErr) {
      console.warn('[Ollama Chat] Unavailable, falling back to Pollinations.ai:', ollamaErr.message);
    }
  }

  // Tier 2: Try Pollinations.ai free cloud
  try {
    const messages = [
      { role: 'system', content: systemPrompt },
      ...(options.history || []),
      { role: 'user', content: userMessage }
    ];
    const result = await pollinationsChat(messages, {
      temperature: options.temperature ?? 0.7,
      max_tokens: options.max_tokens ?? 1024,
      timeout: 8000
    });
    return {
      content: result.content,
      model: result.model,
      provider: result.provider
    };
  } catch (pollErr) {
    console.warn('[Pollinations.ai] Also unavailable:', pollErr.message);
  }

  // Tier 3: Return helpful fallback pedagogical response rather than throwing 500
  return {
    content: `That's an insightful question. In engineering and scientific principles, observe how varying the primary parameters impacts the observed physical state. What specific variable do you think dominates the behavior?`,
    model: 'smartedu-socratic-heuristic',
    provider: 'SmartEdu OS'
  };
}

/**
 * Streaming chat completion — Ollama primary, Pollinations non-streaming fallback
 */
export async function chatCompletionStream(model, systemPrompt, userMessage, options = {}) {
  // Tier 1: Try Ollama streaming
  try {
    const activeModel = await resolveModel(model);
    const res = await fetch(`${OLLAMA_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: activeModel,
        messages: [
          { role: 'system', content: systemPrompt },
          ...(options.history || []),
          { role: 'user', content: userMessage }
        ],
        stream: true,
        options: {
          temperature: options.temperature ?? 0.7,
          top_p: options.top_p ?? 0.9,
          num_predict: options.max_tokens ?? 1024
        }
      }),
      signal: AbortSignal.timeout(120000)
    });

    if (res.ok) {
      return { body: res.body, resolvedModel: activeModel, provider: 'ollama-local' };
    }
  } catch (ollamaErr) {
    console.warn('[Ollama Stream] Unavailable, falling back to Pollinations.ai:', ollamaErr.message);
  }

  // Tier 2: Pollinations fallback (non-streaming, simulated as single SSE event)
  try {
    const messages = [
      { role: 'system', content: systemPrompt },
      ...(options.history || []),
      { role: 'user', content: userMessage }
    ];
    const result = await pollinationsChat(messages, {
      temperature: options.temperature ?? 0.7,
      max_tokens: options.max_tokens ?? 1024
    });

    // Create a synthetic ReadableStream that emits the full response as one Ollama-format JSON line
    const syntheticPayload = JSON.stringify({
      message: { role: 'assistant', content: result.content },
      done: true
    }) + '\n';
    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(syntheticPayload));
        controller.close();
      }
    });

    return { body: readableStream, resolvedModel: 'pollinations-openai-fast', provider: 'pollinations.ai' };
  } catch (pollErr) {
    console.warn('[Pollinations.ai Stream] Also unavailable:', pollErr.message);
  }

  throw new Error('All AI providers unavailable for streaming');
}

/**
 * Extract JSON safely from model response
 */
function extractJson(raw) {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {}

  const cleaned = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {}

  const firstBrace = raw.indexOf('{');
  const lastBrace = raw.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    try {
      return JSON.parse(raw.substring(firstBrace, lastBrace + 1));
    } catch {}
  }
  return null;
}

/**
 * Generate structured JSON output — 3-tier: Ollama → Pollinations → error
 */
export async function generateStructuredOutput(model, systemPrompt, userMessage) {
  // Tier 1: Try Ollama
  try {
    const activeModel = await resolveModel(model);
    const res = await fetch(`${OLLAMA_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: activeModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        stream: false,
        format: 'json',
        options: {
          temperature: 0.3,
          num_predict: 2048
        }
      }),
      signal: AbortSignal.timeout(60000)
    });

    if (res.ok) {
      const data = await res.json();
      const raw = data.message?.content || '';
      const parsed = extractJson(raw);
      if (parsed) {
        return { ...parsed, model: activeModel, provider: 'ollama-local' };
      }
      return { raw, parseError: true, model: activeModel };
    }
  } catch (ollamaErr) {
    console.warn('[Ollama Structured] Unavailable, trying Pollinations.ai:', ollamaErr.message);
  }

  // Tier 2: Pollinations.ai free cloud
  try {
    console.log('[Pollinations.ai] Generating structured JSON via free cloud AI...');
    return await pollinationsStructuredOutput(systemPrompt, userMessage);
  } catch (pollErr) {
    console.warn('[Pollinations.ai Structured] Also failed:', pollErr.message);
  }

  throw new Error('All AI providers unavailable for structured output');
}
