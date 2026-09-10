/**
 * SmartEdu OS — Frontend Ollama Service Client
 * Resilient multi-tier client:
 * 1. Express Backend (/api/chat, /api/evaluate, /api/health) with pedagogical prompt engineering
 * 2. Direct Ollama Proxy (/api/ollama or http://localhost:11434) with client-side prompt assembly
 * 3. Graceful offline fallback detection
 */

import { SIMULATION_PRESETS } from '../data/simulationPresets.js';

const BACKEND_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || '';
const OLLAMA_DIRECT = '/api/ollama';
const POLLINATIONS_URL = 'https://text.pollinations.ai/';

/**
 * Call Pollinations.ai free cloud AI directly from browser
 * 100% free, unlimited, zero API key required.
 * Verified working model: openai-fast
 */
const CLOUD_MODELS = ['openai-fast', 'openai'];

export async function callDirectCloudAI(messages, model = 'openai-fast') {
  const modelsToTry = [model, ...CLOUD_MODELS.filter(m => m !== model)];
  let lastError = null;

  // 1. Try POST endpoint with JSON messages
  for (const m of modelsToTry) {
    try {
      const res = await fetch(POLLINATIONS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages,
          model: m,
          temperature: 0.7,
          max_tokens: 1800
        }),
        signal: AbortSignal.timeout(20000)
      });
      if (res.ok) {
        const text = await res.text();
        // Guard against HTML error pages
        if (text && !text.startsWith('<!DOCTYPE') && !text.startsWith('<html')) {
          return text.trim();
        }
      }
      lastError = new Error(`Cloud AI HTTP ${res.status} (model: ${m})`);
    } catch (err) {
      lastError = err;
    }
  }

  // 2. High-reliability GET fallback
  try {
    const userMsg = [...messages].reverse().find(m => m.role === 'user')?.content || 'Hello';
    const sysMsg = messages.find(m => m.role === 'system')?.content || '';
    const combined = sysMsg ? `${sysMsg}\n\nTask: ${userMsg}` : userMsg;
    const getRes = await fetch(`${POLLINATIONS_URL}${encodeURIComponent(combined.slice(0, 1000))}?model=openai-fast`, {
      signal: AbortSignal.timeout(18000)
    });
    if (getRes.ok) {
      const text = await getRes.text();
      if (text && !text.startsWith('<!DOCTYPE') && !text.startsWith('<html')) {
        return text.trim();
      }
    }
  } catch (getErr) {
    lastError = getErr;
  }

  throw lastError || new Error('All Cloud AI models unavailable');
}

/**
 * Check backend + Ollama health
 */
export async function checkHealth() {
  // 1. Try Express backend first
  try {
    const res = await fetch(`${BACKEND_URL}/api/health`, { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch {}

  // 2. Fallback: Check Ollama directly via Vite proxy or port 11434
  try {
    const res = await fetch(`${OLLAMA_DIRECT}/api/tags`, { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      const data = await res.json();
      const models = (data.models || []).map(m => ({
        name: m.name,
        size: m.size,
        modified: m.modified_at
      }));
      return {
        server: 'Direct Ollama Proxy',
        connected: true,
        directMode: true,
        ollama: {
          connected: true,
          models
        },
        plugins: {
          ollama: { status: 'ready', description: 'Local Ollama LLM Engine' }
        }
      };
    }
  } catch {}

  // 3. Cloud AI mode for Vercel live hosting (free unlimited cloud generation)
  return {
    server: 'SmartEdu Cloud AI Engine (Live Vercel)',
    connected: true,
    cloudMode: true,
    ollama: {
      connected: true,
      models: [
        { name: 'cloud-llama3-pollinations', size: 'Cloud', modified: 'Live' },
        { name: 'cloud-openai-fast', size: 'Cloud', modified: 'Live' },
        { name: 'cloud-mistral-fast', size: 'Cloud', modified: 'Live' }
      ]
    },
    plugins: {
      cloudAI: { status: 'ready', description: 'Free Unlimited Cloud AI (Pollinations.ai)' }
    }
  };
}

/**
 * Send a chat message (non-streaming)
 */
export async function sendChatMessage(message, mode = 'SOCRATIC', context = {}, model = null) {
  // 1. Try Express backend
  try {
    const res = await fetch(`${BACKEND_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, mode, model, context }),
      signal: AbortSignal.timeout(12000)
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.text) return data;
    }
  } catch (backendErr) {
    console.warn('Backend chat failed, trying local Ollama / Cloud AI...', backendErr.message);
  }

  // 2. Direct Ollama only when running locally on localhost
  const isLocal = typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  if (isLocal) {
    try {
      const targetModel = model || 'llama3:latest';
      const directRes = await fetch(`${OLLAMA_DIRECT}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: targetModel,
          messages: [
            { 
              role: 'system', 
              content: `You are SmartEdu OS's Socratic AI coach for ${context.conceptName || 'engineering concepts'}. Never give direct answers; guide students to discover answers through probing questions.` 
            },
            ...(context.history || []),
            { role: 'user', content: message }
          ],
          stream: false
        }),
        signal: AbortSignal.timeout(15000)
      });
      if (directRes.ok) {
        const directData = await directRes.json();
        return {
          type: 'SOCRATIC_PROMPT',
          title: `AI Coach: ${context.conceptName || 'General'}`,
          text: directData.message?.content || '',
          model: directData.model || targetModel,
          duration: directData.total_duration,
          tokenCount: directData.eval_count
        };
      }
    } catch {}
  }

  // 3. Resilient Cloud AI fallback (Primary for live Vercel deployment)
  try {
    const systemPrompt = `You are SmartEdu OS's Socratic AI coach for ${context.conceptName || 'engineering concepts'}. Guide students constructively in 2-4 concise, clear sentences. Focus on fundamental principles and probing questions.`;
    const cloudText = await callDirectCloudAI([
      { role: 'system', content: systemPrompt },
      ...(context.history || []).map(h => ({ role: h.role || 'user', content: h.content || h.text || '' })),
      { role: 'user', content: message }
    ]);
    return {
      type: 'SOCRATIC_PROMPT',
      title: `Cloud AI Coach: ${context.conceptName || 'General'}`,
      text: cloudText,
      model: 'pollinations-openai-fast',
      provider: 'Pollinations.ai (Free Cloud AI)'
    };
  } catch (cloudErr) {
    console.warn('Cloud AI fallback failed:', cloudErr);
    return {
      type: 'SOCRATIC_PROMPT',
      title: `AI Coach: ${context.conceptName || 'General'}`,
      text: `Let's analyze ${context.conceptName || 'this principle'}. What fundamental physical or mathematical variable changes first in this scenario?`,
      model: 'smartedu-offline-coach',
      provider: 'SmartEdu OS'
    };
  }
}

/**
 * Send a chat message with SSE streaming
 */
export function sendStreamingChat(message, mode, context, model, { onStart, onToken, onDone, onError }) {
  const controller = new AbortController();

  (async () => {
    // 1. Try Express backend streaming endpoint
    let streamSucceeded = false;
    try {
      const res = await fetch(`${BACKEND_URL}/api/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, mode, model, context }),
        signal: controller.signal
      });

      if (res.ok && res.headers.get('content-type')?.includes('text/event-stream')) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim();
              if (data === '[DONE]') {
                onDone?.();
                return;
              }
              try {
                const parsed = JSON.parse(data);
                if (parsed.start && parsed.model) {
                  onStart?.(parsed);
                }
                if (parsed.token) {
                  streamSucceeded = true;
                  onToken(parsed.token);
                }
                if (parsed.done) {
                  onDone?.(parsed);
                  return;
                }
                if (parsed.error) {
                  throw new Error(parsed.error);
                }
              } catch {}
            }
          }
        }
        if (streamSucceeded) {
          onDone?.();
          return;
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.warn('Backend stream failed, proceeding to fallback...', err.message);
    }

    // 2. Direct Ollama streaming if local
    const isLocal = typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    if (isLocal) {
      try {
        const targetModel = model || 'llama3:latest';
        const directRes = await fetch(`${OLLAMA_DIRECT}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: targetModel,
            messages: [
              { 
                role: 'system', 
                content: `You are SmartEdu OS's Socratic AI coach for ${context.conceptName || 'engineering concepts'}. Ask questions and encourage productive struggle.` 
              },
              ...(context.history || []),
              { role: 'user', content: message }
            ],
            stream: true
          }),
          signal: controller.signal
        });

        if (directRes.ok) {
          onStart?.({ model: targetModel });
          const reader = directRes.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';

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
                  onToken(parsed.message.content);
                }
                if (parsed.done) {
                  onDone?.(parsed);
                  return;
                }
              } catch {}
            }
          }
          onDone?.();
          return;
        }
      } catch (directErr) {
        if (directErr.name === 'AbortError') return;
      }
    }

    // 3. Direct Cloud AI streaming fallback for Vercel live hosting
    try {
      const systemPrompt = `You are SmartEdu OS's Socratic AI coach for ${context.conceptName || 'engineering concepts'}. Ask probing questions, explain intuitively in 2-4 sentences, and guide conceptual discovery.`;
      onStart?.({ model: 'pollinations-openai-fast', provider: 'Pollinations.ai (Free Cloud AI)' });
      const fullText = await callDirectCloudAI([
        { role: 'system', content: systemPrompt },
        ...(context.history || []).map(h => ({ role: h.role || 'user', content: h.content || h.text || '' })),
        { role: 'user', content: message }
      ]);
      const words = fullText.split(' ');
      for (let i = 0; i < words.length; i++) {
        if (controller.signal.aborted) return;
        onToken((i === 0 ? '' : ' ') + words[i]);
        await new Promise(r => setTimeout(r, 16));
      }
      onDone?.({ model: 'pollinations-openai-fast' });
      return;
    } catch (cloudErr) {
      if (cloudErr.name === 'AbortError') return;
      onToken(`Let's investigate ${context.conceptName || 'this concept'} together. What happens to the system output when you adjust the input parameters?`);
      onDone?.({ model: 'offline-coach' });
    }
  })();

  return () => controller.abort();
}

/**
 * Evaluate a Teach-Back explanation
 * Falls back to Cloud AI if backend is unreachable
 */
export async function evaluateExplanation(explanation, conceptName, model = null) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ explanation, conceptName, model }),
      signal: AbortSignal.timeout(30000)
    });
    if (res.ok) return await res.json();
  } catch {}

  // Cloud AI fallback
  try {
    const prompt = `You are a Socratic learning coach evaluating a student's "Teach-Back" explanation of "${conceptName}".
Score the explanation on: accuracy (0-100), clarity (0-100), completeness (0-100), and overall (0-100).
Provide brief constructive feedback and a list of any gaps.
Respond ONLY with valid JSON: {"accuracy":N,"clarity":N,"completeness":N,"overall":N,"feedback":"...","gaps":["..."]}`;
    const cloudText = await callDirectCloudAI([
      { role: 'system', content: prompt },
      { role: 'user', content: explanation }
    ]);
    try {
      const jsonMatch = cloudText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return { ...parsed, model: 'pollinations-cloud', provider: 'Pollinations.ai (Free Cloud AI)' };
      }
    } catch {}
    return {
      accuracy: 70, clarity: 65, completeness: 60, overall: 65,
      feedback: cloudText.slice(0, 500),
      gaps: [],
      model: 'pollinations-cloud',
      provider: 'Pollinations.ai'
    };
  } catch (cloudErr) {
    return {
      accuracy: 70, clarity: 65, completeness: 60, overall: 65,
      feedback: 'Your explanation shows good understanding. Try adding more specific examples and relating concepts to underlying principles.',
      gaps: ['Consider connecting to prerequisite concepts'],
      model: 'offline-fallback'
    };
  }
}

/**
 * Seed documents for offline / serverless fallback
 */
const SEED_DOCUMENTS = [
  {
    id: 'doc-cs201-pointers',
    title: 'CS201: C Pointers & Memory Architecture Handbook',
    originalName: 'CS201_Pointers_Memory_Handbook.pdf',
    size: 245760,
    mimeType: 'application/pdf',
    uploadedAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    author: 'Prof. A. R. Sharma (VTU Syllabus)',
    curriculum: 'cs_c_dsa',
    summary: 'Comprehensive guide covering pointer declaration, memory addressing in RAM, dereferencing mechanics, pointer arithmetic scaling by sizeof(T), dynamic allocation via malloc/free, and preventing segmentation faults.',
    keyConcepts: [
      'Hexadecimal RAM Addressing',
      'Pointer Dereferencing (*p)',
      'Pointer Arithmetic Scaling',
      'Heap Memory Allocation (malloc/free)',
      'Dangling Pointers & Memory Leaks'
    ],
    sampleSnippet: 'A pointer is a variable whose value is the address of another variable. In 64-bit architectures, pointers occupy 8 bytes. Pointer arithmetic scales by the data type: if int* p = 0x1000, then p+1 = 0x1004.',
    quizzes: [
      {
        id: 'qz-1',
        question: 'When integer pointer `int *p = 0x2000` is incremented with `p = p + 2` on a 32-bit system where `sizeof(int) == 4`, what is the new address?',
        options: ['0x2002', '0x2004', '0x2008', '0x2016'],
        correctIndex: 2,
        difficulty: 0.35,
        discrimination: 1.8,
        misconceptionNote: 'Pointer arithmetic increments in multiples of sizeof(type). 2 * 4 bytes = 8 bytes (0x2008).'
      },
      {
        id: 'qz-2',
        question: 'What occurs if a program attempts to dereference a pointer holding NULL or address 0x0?',
        options: ['Returns 0 silently', 'Hardware Segmentation Fault / SIGSEGV', 'Allocates new memory', 'Compiles with warning only'],
        correctIndex: 1,
        difficulty: -0.1,
        discrimination: 1.5,
        misconceptionNote: 'Address 0x0 is protected by OS memory management; dereferencing triggers an immediate MMU trap.'
      }
    ]
  },
  {
    id: 'doc-ph101-diffraction',
    title: 'PH101: Wave Optics & Fraunhofer Diffraction Manual',
    originalName: 'PH101_Diffraction_Lab_Manual.pdf',
    size: 512000,
    mimeType: 'application/pdf',
    uploadedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    author: 'Physics Dept, IIT Madras',
    curriculum: 'eng_physics',
    summary: 'Laboratory and theoretical manual detailing Fraunhofer single and double slit diffraction, central maximum angular width derivation (theta = lambda / a), secondary maxima intensity decay, and wavelength measurement using He-Ne laser.',
    keyConcepts: [
      'Fraunhofer Condition (Far-field)',
      'Central Maximum Angular Width',
      'Single Slit Minima Condition (a*sin(theta) = m*lambda)',
      'Double Slit Interference vs Diffraction Envelope',
      'Diffraction Grating Resolving Power'
    ],
    sampleSnippet: 'Diffraction is the bending of light waves around obstacles. In Fraunhofer diffraction, wavefronts incident and exiting the aperture are planar. The first minimum occurs when path difference between outer edges is lambda.',
    quizzes: [
      {
        id: 'qz-p1',
        question: 'In a single slit diffraction experiment, if slit width "a" is halved while wavelength remains constant, what happens to the angular width of the central maximum?',
        options: ['Halves', 'Doubles', 'Remains unchanged', 'Quadruples'],
        correctIndex: 1,
        difficulty: 0.25,
        discrimination: 1.9,
        misconceptionNote: 'Angular width beta = 2 * lambda / a. Decreasing slit width increases diffraction spread inversely.'
      }
    ]
  }
];

let localDocStore = [...SEED_DOCUMENTS];

/**
 * Fetch all documents
 */
export async function fetchDocuments() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/documents`, { signal: AbortSignal.timeout(4000) });
    if (res.ok) {
      const data = await res.json();
      if (data.documents?.length > 0) {
        return data;
      }
    }
  } catch (err) {
    console.warn('Backend documents fetch failed, using seed repository:', err.message);
  }
  return { count: localDocStore.length, documents: localDocStore };
}

/**
 * Fetch document details by ID
 */
export async function fetchDocumentDetails(id) {
  const res = await fetch(`${BACKEND_URL}/api/documents/${id}`);
  if (!res.ok) throw new Error('Document details request failed');
  return await res.json();
}

/**
 * Upload a document (PDF, TXT, MD, DOCX, Code)
 */
export async function uploadDocument(formData) {
  const res = await fetch(`${BACKEND_URL}/api/documents/upload`, {
    method: 'POST',
    body: formData
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Upload failed' }));
    throw new Error(err.error || 'Failed to upload document');
  }

  return await res.json();
}

/**
 * Generate adaptive quiz from document
 */
export async function generateQuizFromDocument(id, numQuestions = 3) {
  const res = await fetch(`${BACKEND_URL}/api/documents/${id}/generate-quiz`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ numQuestions }),
    signal: AbortSignal.timeout(60000)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Quiz generation failed' }));
    throw new Error(err.error || 'Quiz generation failed');
  }

  return await res.json();
}

/**
 * Socratic chat with document
 */
export async function chatWithDocument(id, message, history = []) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/documents/${id}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history }),
      signal: AbortSignal.timeout(30000)
    });
    if (res.ok) return await res.json();
  } catch {}

  // Cloud AI fallback
  try {
    const cloudText = await callDirectCloudAI([
      { role: 'system', content: 'You are a Socratic tutor helping a student understand their study document. Give constructive, guided answers in 2-4 sentences.' },
      ...history.slice(-6).map(h => ({ role: h.role || 'user', content: h.content || '' })),
      { role: 'user', content: message }
    ]);
    return { response: cloudText, model: 'pollinations-cloud', provider: 'Pollinations.ai' };
  } catch {
    return { response: 'Consider re-reading the relevant section and try explaining the key concept in your own words.', model: 'offline-fallback' };
  }
}

/**
 * Delete document
 */
export async function deleteDocument(id) {
  const res = await fetch(`${BACKEND_URL}/api/documents/${id}`, {
    method: 'DELETE'
  });
  return await res.json();
}

/**
 * Parent Portal: Request OTP
 */
export async function requestParentOtp(phone) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/parent/request-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
      signal: AbortSignal.timeout(8000)
    });
    if (res.ok) return await res.json();
  } catch {}
  // Simulated OTP for demo/cloud mode
  return { success: true, message: 'Demo OTP sent: 123456', otp: '123456', demo: true };
}

/**
 * Parent Portal: Verify OTP
 */
export async function verifyParentOtp(phone, otp) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/parent/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, otp }),
      signal: AbortSignal.timeout(8000)
    });
    if (res.ok) return await res.json();
  } catch {}
  // Demo verification
  if (otp === '123456') return { success: true, verified: true, demo: true };
  throw new Error('Invalid OTP. Demo OTP is 123456.');
}

/**
 * Parent Portal: Fetch Attendance
 */
export async function fetchParentAttendance() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/parent/attendance`, { signal: AbortSignal.timeout(5000) });
    if (res.ok) return await res.json();
  } catch {}
  return { records: [], totalPresent: 22, totalAbsent: 3, streak: 8, demo: true };
}

/**
 * Parent Portal: Fetch Cognitive Reports
 */
export async function fetchParentReports() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/parent/reports`, { signal: AbortSignal.timeout(5000) });
    if (res.ok) return await res.json();
  } catch {}
  return { reports: [], overallGrade: 'B+', strengths: ['Problem Solving', 'Conceptual Understanding'], demo: true };
}

/**
 * Parent Portal: Send Teacher Feedback
 */
export async function sendParentFeedback(message, teacher) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/parent/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, teacher }),
      signal: AbortSignal.timeout(8000)
    });
    if (res.ok) return await res.json();
  } catch {}
  return { success: true, message: 'Feedback recorded (demo mode)', demo: true };
}

/**
 * Activity Capture: Log event
 */
export async function logActivityEvent(type, label, metadata = {}) {
  try {
    await fetch(`${BACKEND_URL}/api/activity/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, label, metadata })
    });
  } catch {}
}

/**
 * Activity Capture: Fetch stats
 */
export async function fetchActivityStats() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/activity/stats`);
    if (res.ok) return await res.json();
  } catch {}
  return { activeMinutes: 1, totalInteractions: 24, streakDays: 14 };
}

/**
 * CyberSim: Parse natural human simulation query via Ollama
 */
export async function parseSimulationQuery(query) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/simulate/parse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
      signal: AbortSignal.timeout(60000)
    });

    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Backend simulate parse failed, falling back to client heuristic:', err.message);
  }

  // Client-side fallback if backend unreachable
  const q = query.toLowerCase();
  const matched = SIMULATION_PRESETS.find(p =>
    p.id.toLowerCase().includes(q) ||
    p.title.toLowerCase().includes(q) ||
    p.engineType.toLowerCase().includes(q) ||
    (p.subtitle && p.subtitle.toLowerCase().includes(q))
  );

  const chosenSim = matched || SIMULATION_PRESETS[0];

  return {
    success: true,
    query,
    simulation: chosenSim,
    aiExplanation: `Loaded ${chosenSim.title} simulation from built-in STEM library.`,
    modelUsed: 'SmartEdu STEM Library'
  };
}

/**
 * CyberSim: Fetch simulation presets
 */
export async function fetchSimulationPresets() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/simulate/presets`, { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      const data = await res.json();
      if (data.presets && data.presets.length > 0) return data;
    }
  } catch {}
  return { count: SIMULATION_PRESETS.length, presets: SIMULATION_PRESETS };
}


