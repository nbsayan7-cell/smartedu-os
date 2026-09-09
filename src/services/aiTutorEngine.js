/**
 * SmartEdu OS Socratic AI Learning Coach Engine
 * 10-Mode pedagogical tutor with hint escalation, anti-cheating guards,
 * and Concept Doctor misconception diagnosis.
 */

export const TUTOR_MODES = [
  { id: 'SOCRATIC', label: 'Socratic Guide', icon: 'HelpCircle', desc: 'Prompts with inquiry rather than giving direct answers' },
  { id: 'TEACH', label: 'Calibrated Teach', icon: 'BookOpen', desc: 'Scaffolded explanation adapted to your current mastery level' },
  { id: 'HINT', label: 'Hint Escalator', icon: 'Compass', desc: '4-level progressive hints (gentle nudge to structural clue)' },
  { id: 'DEBUG_MISCONCEPTION', label: 'Concept Doctor', icon: 'Stethoscope', desc: 'Diagnoses mental model flaws causing repeated errors' },
  { id: 'PRACTICE', label: 'Adaptive Practice', icon: 'Target', desc: 'Calibrated problems at your latent ability boundary' },
  { id: 'EXAM', label: 'Exam Simulator', icon: 'Clock', desc: 'Timed, unassisted university exam simulation' },
  { id: 'REVISION', label: 'Spaced Retrieval', icon: 'RotateCcw', desc: 'Active recall prompts targeting fading concepts' },
  { id: 'PROJECT_MENTOR', label: 'Project Mentor', icon: 'Code', desc: 'Step-by-step milestone guidance on building real projects' },
  { id: 'INTERVIEW_COACH', label: 'Tech Interview', icon: 'Briefcase', desc: 'FAANG/Product company verbal and algorithmic inquiry' },
  { id: 'REFLECTION', label: 'Teach-Back / Feynman', icon: 'Sparkles', desc: 'Explain in your own words; AI evaluates clarity and gaps' }
];

export const HINT_LEVELS = [
  { level: 1, name: 'Conceptual Nudge', desc: 'Points your attention to the core principle' },
  { level: 2, name: 'Analogous Clue', desc: 'Relates the problem to physical memory or wave optics analogy' },
  { level: 3, name: 'Structural Skeleton', desc: 'Provides the logical formula or code scaffolding' },
  { level: 4, name: 'Counterexample Disproof', desc: 'Shows why the common wrong approach fails with proof' }
];

/**
 * Checks for direct answer seeking (anti-cheating guard)
 */
export function detectAnswerSeeking(query) {
  const normalized = query.toLowerCase();
  const directTriggers = [
    'give me the answer',
    'just write the code',
    'give me code',
    'tell me the solution',
    'solve this for me',
    'what is the answer'
  ];
  return directTriggers.some(t => normalized.includes(t));
}

/**
 * Generates pedagogical Socratic responses for engineering concepts
 */
export function generatePedagogicalResponse(query, mode, context = {}) {
  const { concept = 'Pointers in C', mastery = 38, hintLevel = 1 } = context;
  const isDirect = detectAnswerSeeking(query);

  if (isDirect) {
    return {
      type: 'ANTI_CHEAT_INTERVENTION',
      title: 'Active Learning Guard Activated',
      text: `In SmartEdu OS, we believe in **productive struggle** — simply reading the solution creates an illusion of competence! \n\nLet's break down **${concept}** step-by-step. Before writing any syntax: where does an integer value actually exist in hardware memory when your program runs?`,
      actionPrompt: 'What does the & operator return in C?'
    };
  }

  // Pre-configured intelligent responses for the two exemplar curricula
  if (concept.toLowerCase().includes('pointer') || query.toLowerCase().includes('pointer')) {
    if (mode === 'SOCRATIC') {
      return {
        type: 'SOCRATIC_PROMPT',
        title: 'Socratic Inquiry: Memory Architecture',
        text: `To understand pointers intuitively, let's step into the computer's RAM.\n\nSuppose we declare \`int score = 95;\`. The compiler assigns \`score\` a memory cell (say address \`0x7FFEE4\`).\n\nIf \`score\` stores \`95\`, what type of data would need to be stored to hold that memory address \`0x7FFEE4\` itself?`,
        followUpQuestion: 'Can an ordinary integer hold a memory address safely on a 64-bit machine?'
      };
    }

    if (mode === 'DEBUG_MISCONCEPTION') {
      return {
        type: 'MISCONCEPTION_DIAGNOSIS',
        title: 'Concept Doctor: Pointer Arithmetic Misconception Detected',
        text: `**Observed Error:** Adding 1 to a pointer (e.g., \`p + 1\`) is often thought to add 1 byte to the hex address.\n\n**The Reality:** In C, pointer arithmetic is **scaled by the size of the underlying data type** (\`sizeof(*p)\`). For a 4-byte \`int*\`, if \`p = 0x1000\`, then \`p + 1\` is **\`0x1004\`**, NOT \`0x1001\`!`,
        remediationPath: 'Review Prerequisite: Variable Data Widths & Memory Alignment'
      };
    }

    if (mode === 'HINT') {
      const hint = HINT_LEVELS.find(h => h.level === hintLevel) || HINT_LEVELS[0];
      const hintTexts = {
        1: `**Hint Level 1 (Nudge):** Remember that a pointer does not contain the data itself; it only stores the *location* (address) of where that data lives.`,
        2: `**Hint Level 2 (Analogy):** Think of a house and its street address. Changing the house number written on a piece of paper does NOT remodel the house!`,
        3: `**Hint Level 3 (Structure):** In C syntax: \`int *ptr = &val;\` means \`ptr\` holds the address of \`val\`. To access or modify the house inside, dereference it with \`*ptr\`.`,
        4: `**Hint Level 4 (Worked Counterexample):** If you write \`ptr = 50;\` instead of \`*ptr = 50;\`, you are overwriting the memory address pointing to RAM address 50 (which will cause a Segmentation Fault crash!).`
      };
      return {
        type: 'HINT_ESCALATION',
        level: hint.level,
        title: hint.name,
        text: hintTexts[hint.level],
        canEscalate: hint.level < 4
      };
    }
  }

  if (concept.toLowerCase().includes('diffraction') || query.toLowerCase().includes('diffraction')) {
    if (mode === 'SOCRATIC') {
      return {
        type: 'SOCRATIC_PROMPT',
        title: 'Socratic Inquiry: Huygens Secondary Wavelets',
        text: `When plane waves encounter a narrow slit of width $a$, why doesn't the light merely pass through as a crisp straight geometric shadow?\n\nAccording to Huygens' Principle, every point on the wavefront inside the slit acts as a source of what?`,
        followUpQuestion: 'How does the ratio of wavelength λ to slit width a govern the spread?'
      };
    }

    if (mode === 'DEBUG_MISCONCEPTION') {
      return {
        type: 'MISCONCEPTION_DIAGNOSIS',
        title: 'Concept Doctor: Diffraction vs Interference Confusion',
        text: `**Common Confusion:** Treating diffraction minima and Young's double-slit interference minima as identical.\n\n**The Reality:** In single-slit diffraction, destructive interference occurs when $a \\sin \\theta = m\\lambda$ ($m = \\pm 1, \\pm 2$). Note that $m = 0$ is the **Central Maximum**, NOT a minimum!`,
        remediationPath: 'Review Prerequisite: Path Difference in Wave Superposition'
      };
    }
  }

  // Default fallback generator
  return {
    type: 'GUIDED_RESPONSE',
    title: `${TUTOR_MODES.find(m => m.id === mode)?.label || 'AI Coach'}: ${concept}`,
    text: `Let's examine **${concept}** (Current Mastery: ${mastery}%).\n\nKey question to reflect upon: What is the fundamental physical or computational constraint that makes this concept necessary in engineering systems?`,
    actionPrompt: 'Type your explanation below or switch to Teach-Back Mode to speak your answer.'
  };
}

/**
 * Evaluates student "Teach-Back" (Feynman Technique) submission
 */
export function evaluateTeachBack(explanationText, conceptId) {
  const text = explanationText.toLowerCase();
  let score = 0;
  const rubrics = [];

  if (conceptId === 'c_pointers') {
    const hasAddress = text.includes('address') || text.includes('location') || text.includes('memory');
    const hasDereference = text.includes('dereference') || text.includes('*') || text.includes('value at');
    const hasTypes = text.includes('type') || text.includes('byte') || text.includes('sizeof');
    const hasCaveat = text.includes('null') || text.includes('segfault') || text.includes('invalid');

    rubrics.push({ name: 'Memory Location Understanding', passed: hasAddress, weight: 30 });
    rubrics.push({ name: 'Indirection / Dereferencing Mechanism', passed: hasDereference, weight: 30 });
    rubrics.push({ name: 'Type Scaling / Byte Width Awareness', passed: hasTypes, weight: 20 });
    rubrics.push({ name: 'Safety & Edge Cases (NULL / Bounds)', passed: hasCaveat, weight: 20 });
  } else {
    // Wave optics diffraction
    const hasWave = text.includes('wave') || text.includes('huygens') || text.includes('secondary');
    const hasSuperposition = text.includes('superposition') || text.includes('interference') || text.includes('path difference');
    const hasFormula = text.includes('sin') || text.includes('lambda') || text.includes('slit width') || text.includes('ratio');
    const hasPattern = text.includes('central') || text.includes('maxima') || text.includes('intensity');

    rubrics.push({ name: 'Huygens Wavelet Formulation', passed: hasWave, weight: 30 });
    rubrics.push({ name: 'Destructive Interference Superposition', passed: hasSuperposition, weight: 30 });
    rubrics.push({ name: 'Wavelength-to-Aperture Ratio', passed: hasFormula, weight: 20 });
    rubrics.push({ name: 'Intensity Distribution Profile', passed: hasPattern, weight: 20 });
  }

  rubrics.forEach(r => {
    if (r.passed) score += r.weight;
  });

  return {
    totalScore: score,
    grade: score >= 80 ? 'Mastery Verified' : score >= 50 ? 'Developing' : 'Conceptual Gaps Found',
    rubrics,
    feedback: score >= 80 
      ? 'Outstanding! You explained both the underlying physical/computational mechanism and the boundary behavior.'
      : 'Good attempt. To achieve full mastery, ensure you explicitly address memory scaling and invalid dereferencing edge cases.'
  };
}
