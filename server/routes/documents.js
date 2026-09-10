import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { createRequire } from 'module';
import { chatCompletion, generateStructuredOutput, resolveModel } from '../services/ollamaClient.js';

const require = createRequire(import.meta.url);
const router = Router();

// Ensure uploads folder exists safely (safe on read-only serverless environments like Vercel)
const uploadsDir = process.env.VERCEL
  ? path.join(os.tmpdir(), 'smartedu-uploads')
  : path.join(process.cwd(), 'server', 'uploads');

try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
} catch (err) {
  console.warn('[Storage] Could not create uploads directory:', err.message);
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e6);
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${uniqueSuffix}-${safeName}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 30 * 1024 * 1024 } // 30MB
});

// In-memory document database pre-seeded with curriculum textbooks
let documentsStore = [
  {
    id: 'doc-cs201-pointers',
    title: 'CS201: C Pointers & Memory Architecture Handbook',
    originalName: 'CS201_Pointers_Memory_Handbook.pdf',
    filename: 'seed_pointers_handbook.pdf',
    size: 245760, // 240 KB
    mimeType: 'application/pdf',
    uploadedAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
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
    filename: 'seed_diffraction_manual.pdf',
    size: 512000, // 500 KB
    mimeType: 'application/pdf',
    uploadedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
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
  },
  {
    id: 'doc-sih-spec',
    title: 'SIH 26207: Confusions Digital Learning System Architecture',
    originalName: 'SIH2026_Architecture_Spec.md',
    filename: 'seed_sih_spec.md',
    size: 64200,
    mimeType: 'text/markdown',
    uploadedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    author: 'Team Confusions (SIH 26207)',
    curriculum: 'cs_c_dsa',
    summary: 'Technical architecture specification outlining Activity Capture, Smart Assessment, Central Logic Hub, Role-Based Portals (Student, Teacher, Parent via OTP), and offline-first edge AI deployment.',
    keyConcepts: [
      'Activity Capture & Device Inputs',
      'Smart Assessment with 2PL IRT',
      'Central Logic Hub Workflow',
      'Role-Based Portals (Student/Teacher/Parent)',
      'Offline Resilience & Zero API Costs'
    ],
    sampleSnippet: 'The LEARN-SYNC-AI architecture decouples heavy LLM orchestration into isolated backend workers while providing ultra-lightweight client interfaces capable of offline micro-quizzing.',
    quizzes: []
  }
];

/**
 * Helper to extract text from buffer based on mimetype
 */
async function extractTextFromBuffer(buffer, mimeType, originalName) {
  const ext = path.extname(originalName).toLowerCase();
  
  if (mimeType === 'application/pdf' || ext === '.pdf') {
    try {
      const pdfModule = require('pdf-parse');
      const PDFParse = pdfModule.PDFParse || pdfModule;
      if (typeof PDFParse === 'function') {
        const parser = new PDFParse({ data: buffer });
        await parser.load();
        const text = await parser.getText();
        if (text && text.trim().length > 20) return text;
      }
    } catch (e) {
      console.warn('[PDF Extract Warning]', e.message);
    }
  }

  // Plain text / Markdown / Code / JSON
  try {
    return buffer.toString('utf-8');
  } catch {
    return 'Binary document content';
  }
}

/**
 * GET /api/documents — List all uploaded study documents
 */
router.get('/', (req, res) => {
  res.json({
    count: documentsStore.length,
    documents: documentsStore.map(doc => ({
      id: doc.id,
      title: doc.title,
      originalName: doc.originalName,
      size: doc.size,
      mimeType: doc.mimeType,
      uploadedAt: doc.uploadedAt,
      author: doc.author,
      curriculum: doc.curriculum,
      summary: doc.summary,
      keyConcepts: doc.keyConcepts,
      quizCount: (doc.quizzes || []).length
    }))
  });
});

/**
 * GET /api/documents/:id — Get document details with text snippet and quizzes
 */
router.get('/:id', (req, res) => {
  const doc = documentsStore.find(d => d.id === req.params.id);
  if (!doc) return res.status(404).json({ error: 'Document not found' });
  res.json(doc);
});

/**
 * POST /api/documents/upload — Upload document (PDF, TXT, MD, DOCX, Code)
 */
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const file = req.file;
    const fileBuffer = fs.readFileSync(file.path);
    const extractedText = await extractTextFromBuffer(fileBuffer, file.mimetype, file.originalname);

    const docId = `doc-${Date.now()}-${Math.round(Math.random() * 1000)}`;
    const title = req.body.title || file.originalname.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
    const curriculum = req.body.curriculum || 'cs_c_dsa';

    // Auto-summarize & extract concepts using Ollama if available
    let summary = `Document containing ${extractedText.split(/\s+/).length} words across technical engineering concepts.`;
    let keyConcepts = ['Core Principle', 'Implementation Syntax', 'Edge Cases', 'Practical Application'];

    try {
      const activeModel = await resolveModel('llama3:latest');
      const textSample = extractedText.slice(0, 3000); // 3000 chars for fast inference

      const prompt = `Analyze this educational engineering document extract and return a JSON object with:
{
  "summary": "2-3 sentence clear summary of the core concepts covered",
  "keyConcepts": ["Concept 1", "Concept 2", "Concept 3", "Concept 4"]
}

Document extract:
"""${textSample}"""

Return valid JSON ONLY.`;

      const analysis = await generateStructuredOutput(activeModel, 'You are an educational document analyzer.', prompt);
      if (analysis && analysis.summary) {
        summary = analysis.summary;
      }
      if (analysis && Array.isArray(analysis.keyConcepts) && analysis.keyConcepts.length > 0) {
        keyConcepts = analysis.keyConcepts;
      }
    } catch (aiErr) {
      console.warn('[Doc AI Analysis]', 'Using rule-based extraction:', aiErr.message);
      // Heuristic extraction
      const lines = extractedText.split('\n').filter(l => l.trim().length > 0);
      if (lines.length > 0) {
        summary = lines.slice(0, 3).join(' ').slice(0, 240) + '...';
      }
      // Extract headers
      const headers = extractedText.match(/^(?:#+|\d+\.)\s+(.+)$/gm);
      if (headers && headers.length > 0) {
        keyConcepts = headers.slice(0, 5).map(h => h.replace(/^(?:#+|\d+\.)\s+/, '').trim());
      }
    }

    const newDoc = {
      id: docId,
      title,
      originalName: file.originalname,
      filename: file.filename,
      size: file.size,
      mimeType: file.mimetype,
      uploadedAt: new Date().toISOString(),
      author: req.body.author || 'User Upload',
      curriculum,
      summary,
      keyConcepts,
      sampleSnippet: extractedText.slice(0, 800),
      rawText: extractedText.slice(0, 15000), // store up to 15k chars for RAG
      quizzes: []
    };

    documentsStore.unshift(newDoc);

    res.status(201).json({
      success: true,
      message: 'Document uploaded and analyzed successfully',
      document: {
        id: newDoc.id,
        title: newDoc.title,
        originalName: newDoc.originalName,
        size: newDoc.size,
        mimeType: newDoc.mimeType,
        uploadedAt: newDoc.uploadedAt,
        summary: newDoc.summary,
        keyConcepts: newDoc.keyConcepts,
        quizCount: 0
      }
    });
  } catch (err) {
    console.error('[Upload Error]', err);
    res.status(500).json({ error: 'Failed to process document', details: err.message });
  }
});

/**
 * POST /api/documents/:id/generate-quiz — Auto-generate 2PL-IRT multiple-choice quiz from document
 */
router.post('/:id/generate-quiz', async (req, res) => {
  try {
    const doc = documentsStore.find(d => d.id === req.params.id);
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    const numQuestions = parseInt(req.body.numQuestions || 3);
    const contentToQuiz = doc.rawText || doc.sampleSnippet || doc.summary;

    let generatedQuestions = [];

    try {
      const activeModel = await resolveModel('llama3:latest');
      const prompt = `Based strictly on the following educational text from "${doc.title}", generate ${numQuestions} multiple choice questions formatted for engineering students.

Each question MUST include:
- A clear question testing understanding (not simple recall)
- Exactly 4 options (A, B, C, D)
- The 0-based correctIndex (0 for A, 1 for B, 2 for C, 3 for D)
- difficulty parameter between -1.0 (easy) and +1.5 (hard)
- discrimination parameter between 1.0 and 2.5
- misconceptionNote explaining why the incorrect options are tempting and why the correct one is right.

Source Text:
"""${contentToQuiz.slice(0, 4000)}"""

Return JSON format ONLY:
{
  "questions": [
    {
      "question": "...",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "difficulty": 0.2,
      "discrimination": 1.7,
      "misconceptionNote": "..."
    }
  ]
}`;

      const aiResponse = await generateStructuredOutput(
        activeModel,
        'You are a university psychometrician creating adaptive exam questions following 2PL IRT standards.',
        prompt
      );

      if (aiResponse && Array.isArray(aiResponse.questions) && aiResponse.questions.length > 0) {
        generatedQuestions = aiResponse.questions.map((q, idx) => ({
          id: `qz-gen-${Date.now()}-${idx}`,
          question: q.question,
          options: q.options || ['Option A', 'Option B', 'Option C', 'Option D'],
          correctIndex: typeof q.correctIndex === 'number' ? q.correctIndex : 0,
          difficulty: q.difficulty || 0.1,
          discrimination: q.discrimination || 1.6,
          misconceptionNote: q.misconceptionNote || 'Analyze the underlying conceptual mechanism.'
        }));
      }
    } catch (aiErr) {
      console.warn('[AI Quiz Gen]', 'Falling back to heuristic quiz generation:', aiErr.message);
    }

    // Heuristic fallback if AI generation didn't produce questions
    if (generatedQuestions.length === 0) {
      generatedQuestions = [
        {
          id: `qz-fallback-1-${Date.now()}`,
          question: `According to ${doc.title}, what is the foundational principle of ${doc.keyConcepts?.[0] || 'the core mechanism'}?`,
          options: [
            'Direct memory mutation with sequential cache indexing',
            'Scalable abstraction that encapsulates state updates',
            'Hardware-level clock cycle dependency',
            'Independent non-deterministic execution'
          ],
          correctIndex: 1,
          difficulty: 0.1,
          discrimination: 1.5,
          misconceptionNote: 'Educational literature emphasizes proper abstraction boundaries over low-level cache indexing.'
        },
        {
          id: `qz-fallback-2-${Date.now()}`,
          question: `Which common misconception is associated with ${doc.keyConcepts?.[1] || 'state management'}?`,
          options: [
            'Assuming linear execution without considering data type scaling',
            'Expecting zero runtime overhead on hardware registers',
            'Ignoring memory layout and variable byte widths',
            'All of the above'
          ],
          correctIndex: 3,
          difficulty: 0.3,
          discrimination: 1.8,
          misconceptionNote: 'Students frequently ignore byte-width scaling and compiler padding rules.'
        }
      ];
    }

    // Append to document
    doc.quizzes = [...(doc.quizzes || []), ...generatedQuestions];

    res.json({
      success: true,
      message: `Generated ${generatedQuestions.length} questions from ${doc.title}`,
      documentId: doc.id,
      questions: generatedQuestions,
      totalQuizzes: doc.quizzes.length
    });
  } catch (err) {
    console.error('[Quiz Gen Error]', err);
    res.status(500).json({ error: 'Quiz generation failed', details: err.message });
  }
});

/**
 * POST /api/documents/:id/chat — Grounded Socratic chat with uploaded document
 */
router.post('/:id/chat', async (req, res) => {
  try {
    const doc = documentsStore.find(d => d.id === req.params.id);
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    const { message, history = [] } = req.body;
    if (!message) return res.status(400).json({ error: 'Message required' });

    const activeModel = await resolveModel('llama3:latest');
    const systemPrompt = `You are SmartEdu OS's Socratic AI coach for the document "${doc.title}".
DOCUMENT CONTEXT:
Summary: ${doc.summary}
Key Concepts: ${(doc.keyConcepts || []).join(', ')}
Excerpt: ${(doc.rawText || doc.sampleSnippet || '').slice(0, 3000)}

PEDAGOGICAL INSTRUCTIONS:
- Answer the student's question based strictly on this document.
- Use Socratic guidance: ask probing questions that guide the student to understand the text.
- Do NOT simply output whole answers or homework solutions.
- Highlight specific sections or concepts from "${doc.title}".`;

    const result = await chatCompletion(activeModel, systemPrompt, message, { history });

    res.json({
      title: `AI Coach: ${doc.title}`,
      text: result.content,
      model: result.model,
      documentId: doc.id
    });
  } catch (err) {
    console.error('[Doc Chat Error]', err);
    res.status(502).json({ error: 'Document chat failed', details: err.message });
  }
});

/**
 * DELETE /api/documents/:id — Delete document
 */
router.delete('/:id', (req, res) => {
  const index = documentsStore.findIndex(d => d.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Document not found' });

  const doc = documentsStore[index];
  documentsStore.splice(index, 1);

  // Clean file from disk if not a seed file
  if (doc.filename && !doc.filename.startsWith('seed_')) {
    const filePath = path.join(uploadsDir, doc.filename);
    if (fs.existsSync(filePath)) {
      try { fs.unlinkSync(filePath); } catch {}
    }
  }

  res.json({ success: true, message: 'Document deleted successfully' });
});

export default router;
