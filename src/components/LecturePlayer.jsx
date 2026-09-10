import React, { useState, useEffect, useRef } from 'react';
import {
  Play, Pause, SkipForward, SkipBack, Maximize2, Volume2, VolumeX,
  Sparkles, MessageSquare, BookOpen, Globe, ChevronRight, FileText,
  Zap, Atom, Radio, Cpu, Activity, Clock, Users, Send, Copy,
  Check, Code, RefreshCw, Eye, Layers, ArrowRight, PenLine,
  Youtube, Search, CheckCircle2, HelpCircle, Award, ExternalLink
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { createSimulationEngine, renderSimulationEngine } from '../services/cyberSimEngines';
import { fetchSimulationPresets, sendChatMessage } from '../services/ollamaService';
import { fetchYouTubeMetadata, analyzeYouTubeLectureWithAI, extractYouTubeId } from '../services/youtubeService';

// ═══════════════════════════════════════════════════════════════════
// PRE-BUILT VERIFIED EDUCATIONAL LECTURE PLAYLIST
// ═══════════════════════════════════════════════════════════════════
const INITIAL_PLAYLIST = [
  {
    id: 'lec-circuit-basics',
    title: 'AC/DC Circuits & Bridge Rectifiers',
    subject: 'ECE / Physics',
    duration: '12:40',
    chapter: 'Unit 2: Analog Electronics',
    thumbnail: '⚡',
    videoUrl: 'https://www.youtube.com/embed/sI5Ftm1-jik',
    watchUrl: 'https://www.youtube.com/watch?v=sI5Ftm1-jik',
    simulationEngine: 'CIRCUIT_EVERYCIRCUIT',
    description: 'Deep-dive into full-wave bridge rectifiers, smoothing capacitors, and ripple voltage analysis with ElectroBOOM.',
    color: 'from-cyan-500 to-blue-600',
    summary: 'Full-wave bridge rectification converts alternating sinusoidal current (AC) into pulsating direct current (DC). A smoothing filter capacitor charges to peak voltage Vp and discharges through load resistor RL during diode reverse-bias periods, drastically reducing output voltage ripple.',
    keyConcepts: ['Bridge Rectifier Topology', 'Diode Forward Drop & PIV', 'RC Smoothing Filter', 'Peak-to-Peak Ripple Voltage'],
    equations: [
      { label: 'DC Output Voltage', formula: 'V_{\\text{dc}} \\approx V_{\\text{peak}} - 2V_D' },
      { label: 'Voltage Ripple', formula: 'V_{\\text{ripple}} \\approx \\frac{I_{\\text{load}}}{2 f C}' }
    ],
    quiz: [
      {
        question: 'Why are four diodes arranged in a bridge configuration rather than a single diode?',
        options: [
          'To conduct current during both positive and negative AC half-cycles (Full-Wave)',
          'To double the input alternating frequency without rectification',
          'To eliminate the need for any load resistor in the circuit',
          'To ground the circuit during reverse breakdown'
        ],
        correctIndex: 0,
        explanation: 'Full-wave bridge rectification conducts during both halves of the AC wave, doubling efficiency and halving the ripple period.'
      },
      {
        question: 'What happens to the DC ripple voltage when filter capacitance C is increased?',
        options: [
          'Ripple voltage decreases, resulting in smoother DC',
          'Ripple voltage increases exponentially',
          'Output voltage drops to zero',
          'Diode conduction angle becomes 180 degrees'
        ],
        correctIndex: 0,
        explanation: 'Larger capacitance stores more charge between AC peaks, sustaining the output voltage and reducing ripple.'
      },
      {
        question: 'What is the peak inverse voltage (PIV) across non-conducting diodes in a bridge rectifier?',
        options: ['Vpeak', '2 * Vpeak', 'Vpeak / 2', 'Zero'],
        correctIndex: 0,
        explanation: 'In a bridge rectifier, the PIV across reverse-biased diodes is approximately Vpeak.'
      }
    ]
  },
  {
    id: 'lec-logic-gates',
    title: 'Digital Logic Gates & Boolean Algebra',
    subject: 'CSE / ECE',
    duration: '16:40',
    chapter: 'Unit 1: Digital Systems',
    thumbnail: '🔲',
    videoUrl: 'https://www.youtube.com/embed/JQBRzsPhw2w',
    watchUrl: 'https://www.youtube.com/watch?v=JQBRzsPhw2w',
    simulationEngine: 'DIGITAL_LOGIC_LAB',
    description: 'Interactive truth tables, AND/OR/NOT/XOR gates, De Morgan theorems with live circuit simulation.',
    color: 'from-emerald-500 to-teal-600',
    summary: 'Binary logic gates implement Boolean functions using electronic transistors as digital switches. Universal gates (NAND, NOR) can synthesize any digital architecture, from multiplexers to arithmetic logic units.',
    keyConcepts: ['Boolean Algebraic Axioms', 'Universal NAND/NOR Gates', 'Truth Table Verification', 'Propagation Gate Delay'],
    equations: [
      { label: 'De Morgan Law I', formula: '\\overline{A \\cdot B} = \\overline{A} + \\overline{B}' },
      { label: 'De Morgan Law II', formula: '\\overline{A + B} = \\overline{A} \\cdot \\overline{B}' }
    ]
  },
  {
    id: 'lec-pendulum-chaos',
    title: 'Double Pendulum & Chaotic Motion',
    subject: 'Physics',
    duration: '10:15',
    chapter: 'Unit 5: Nonlinear Dynamics',
    thumbnail: '🔄',
    videoUrl: 'https://www.youtube.com/embed/d0Z8wLLPNE0',
    watchUrl: 'https://www.youtube.com/watch?v=d0Z8wLLPNE0',
    simulationEngine: 'DOUBLE_PENDULUM',
    description: 'Exploring deterministic chaos through coupled pendulums, Lyapunov exponents, and phase space trajectories.',
    color: 'from-violet-500 to-purple-600',
    summary: 'A coupled double pendulum exhibits extreme sensitivity to initial conditions (the butterfly effect). While governed by deterministic Lagrangian equations of motion, its long-term trajectory is mathematically unpredictable.',
    keyConcepts: ['Deterministic Chaos', 'Lagrangian Mechanics', 'Lyapunov Exponent', 'Phase Space Trajectory'],
    equations: [
      { label: 'Lagrangian L', formula: 'L = T - V = \\frac{1}{2}(m_1+m_2)l_1^2\\dot{\\theta}_1^2 + ...' },
      { label: 'Lyapunov Divergence', formula: '|\\delta \\mathbf{Z}(t)| \\approx e^{\\lambda t} |\\delta \\mathbf{Z}_0|' }
    ]
  },
  {
    id: 'lec-wave-optics',
    title: 'Wave Optics & Double Slit Experiment',
    subject: 'Class 12 Physics',
    duration: '7:40',
    chapter: 'Unit 10: Wave Optics',
    thumbnail: '🌊',
    videoUrl: 'https://www.youtube.com/embed/Iuv6hY6zsd0',
    watchUrl: 'https://www.youtube.com/watch?v=Iuv6hY6zsd0',
    simulationEngine: 'WAVE_DIFFRACTION',
    description: 'Young double-slit interference, Huygens wavelets, path differences, and destructive/constructive fringes.',
    color: 'from-amber-500 to-orange-600',
    summary: 'Coherent wavefronts incident on two narrow slits act as secondary spherical wavelet emitters according to Huygens Principle. Path differences produce constructive bright fringes when path difference is an integer multiple of wavelength.',
    keyConcepts: ['Wave Interference', 'Huygens Wavelets', 'Fringe Width (beta = lambda*D/d)', 'Constructive vs Destructive Interference'],
    equations: [
      { label: 'Path Difference', formula: '\\Delta x = d \\sin\\theta \\approx d \\frac{y}{D}' },
      { label: 'Fringe Width', formula: '\\beta = \\frac{\\lambda D}{d}' }
    ]
  },
  {
    id: 'lec-galaxy-sim',
    title: 'Spiral Galaxy Dynamics & N-Body Collisions',
    subject: 'Astrophysics',
    duration: '3:20',
    chapter: 'Unit 8: Gravitation & Orbits',
    thumbnail: '🌌',
    videoUrl: 'https://www.youtube.com/embed/mo-egAEjlpI',
    watchUrl: 'https://www.youtube.com/watch?v=mo-egAEjlpI',
    simulationEngine: 'GALAXY_N_BODY',
    description: 'Supercomputer simulation of colliding spiral galaxies, tidal tails, and N-body gravitational dynamics.',
    color: 'from-pink-500 to-rose-600',
    summary: 'Gravitational interactions during galaxy collisions create dramatic tidal tails and compression shocks in interstellar gas clouds, solved numerically via N-body gravitational integration.',
    keyConcepts: ['N-Body Gravitation', 'Tidal Friction', 'Orbital Angular Momentum', 'Dark Matter Halos'],
    equations: [
      { label: 'Gravitational Force', formula: '\\mathbf{F}_i = \\sum_{j \\neq i} G \\frac{m_i m_j}{(r_{ij}^2 + \\epsilon^2)^{3/2}} \\mathbf{r}_{ij}' }
    ]
  },
  {
    id: 'lec-opamp-circuits',
    title: 'Op-Amp Inverting & Non-Inverting Amplifiers',
    subject: 'ECE Lab',
    duration: '8:40',
    chapter: 'Unit 4: Linear Integrated Circuits',
    thumbnail: '📐',
    videoUrl: 'https://www.youtube.com/embed/EOZyofNXWXc',
    watchUrl: 'https://www.youtube.com/watch?v=EOZyofNXWXc',
    simulationEngine: 'OPAMP_INVERTING',
    description: 'Virtual ground, feedback resistors Rf/Rin, gain equations, and operational amplifier fundamentals.',
    color: 'from-cyan-400 to-teal-600',
    summary: 'Operational amplifiers with negative feedback maintain a virtual short between inverting and non-inverting terminals, yielding precise, temperature-stable voltage gain set entirely by external resistor ratios.',
    keyConcepts: ['Virtual Ground Principle', 'Negative Feedback Loop', 'Closed-Loop Voltage Gain', 'Gain-Bandwidth Product'],
    equations: [
      { label: 'Inverting Gain', formula: 'A_v = -\\frac{R_f}{R_{in}}' },
      { label: 'Non-Inverting Gain', formula: 'A_v = 1 + \\frac{R_f}{R_1}' }
    ]
  },
  {
    id: 'lec-555-timer',
    title: '555 Timer IC Astable Multivibrator Clock',
    subject: 'ECE / IoT',
    duration: '17:35',
    chapter: 'Unit 6: Pulse & Switching Circuits',
    thumbnail: '⏱️',
    videoUrl: 'https://www.youtube.com/embed/kRlSFm519Bo',
    watchUrl: 'https://www.youtube.com/watch?v=kRlSFm519Bo',
    simulationEngine: 'TIMER_555',
    description: 'Capacitor charging curves between 1/3 and 2/3 Vcc, duty cycle calculation, and clock pulse generation.',
    color: 'from-yellow-500 to-amber-600',
    summary: 'The 555 Timer IC generates continuous square wave clock pulses in astable mode by cycling capacitor voltage between 1/3 Vcc and 2/3 Vcc via internal comparator voltage dividers.',
    keyConcepts: ['Astable Multivibrator', 'Comparator Thresholds (1/3 & 2/3 Vcc)', 'Duty Cycle Control', 'RC Timing Constant'],
    equations: [
      { label: 'Frequency', formula: 'f = \\frac{1.44}{(R_1 + 2R_2) C}' },
      { label: 'Duty Cycle', formula: 'D = \\frac{R_1 + R_2}{R_1 + 2R_2} \\times 100\\%' }
    ]
  },
  {
    id: 'lec-full-adder',
    title: 'ALU Architecture & 4-Bit Ripple Adders',
    subject: 'CSE Architecture',
    duration: '16:10',
    chapter: 'Unit 3: Computer Organization',
    thumbnail: '🔢',
    videoUrl: 'https://www.youtube.com/embed/wvJc9CZcvBc',
    watchUrl: 'https://www.youtube.com/watch?v=wvJc9CZcvBc',
    simulationEngine: 'FULL_ADDER',
    description: 'Binary arithmetic logic units, XOR sum gates, carry-lookahead vs ripple carry propagation.',
    color: 'from-emerald-400 to-green-600',
    summary: 'Full adders combine half-adder sum (XOR) and carry (AND/OR) gates to compute the binary addition of three 1-bit inputs. Cascaded in series, they form the cornerstone of arithmetic logic units (ALUs).',
    keyConcepts: ['Binary Half & Full Adders', 'XOR Parity Generator', 'Ripple Carry Delay', 'ALU Status Flags'],
    equations: [
      { label: 'Sum S', formula: 'S = A \\oplus B \\oplus C_{in}' },
      { label: 'Carry Out', formula: 'C_{out} = (A \\cdot B) + (C_{in} \\cdot (A \\oplus B))' }
    ]
  }
];

const SAMPLE_PRESETS = [
  { label: '⚡ Bridge Rectifier (ElectroBOOM)', url: 'https://www.youtube.com/watch?v=sI5Ftm1-jik' },
  { label: '🌊 Double Slit Wave (Veritasium)', url: 'https://www.youtube.com/watch?v=Iuv6hY6zsd0' },
  { label: '🔄 Chaotic Pendulum (Physics)', url: 'https://www.youtube.com/watch?v=d0Z8wLLPNE0' },
  { label: '⏱️ 555 Timer Clock (Electronics)', url: 'https://www.youtube.com/watch?v=kRlSFm519Bo' },
  { label: '🔲 Logic Gates (CrashCourse)', url: 'https://www.youtube.com/watch?v=JQBRzsPhw2w' }
];

const captionLanguages = [
  { code: 'en', label: 'EN', flag: '🇬🇧' },
  { code: 'hi', label: 'HI', flag: '🇮🇳' },
  { code: 'bn', label: 'BN', flag: '🇮🇳' },
  { code: 'te', label: 'TE', flag: '🇮🇳' },
  { code: 'ta', label: 'TA', flag: '🇮🇳' },
  { code: 'mr', label: 'MR', flag: '🇮🇳' }
];

const captionTranslations = {
  en: (title) => `Welcome to this lecture on ${title}. Pay close attention to the synchronized simulation on your right. You can independently tune parameters to explore the physics.`,
  hi: (title) => `${title} पर इस व्याख्यान में आपका स्वागत है। दाईं ओर सिंक्रोनाइज़्ड सिमुलेशन पर ध्यान दें। आप स्वतंत्र रूप से पैरामीटर बदल सकते हैं।`,
  bn: (title) => `${title} সম্পর্কে এই লেকচারে আপনাকে স্বাগতম। ডানদিকের সিমুলেশনের দিকে মনোযোগ দিন। আপনি স্বাধীনভাবে প্যারামিটার পরিবর্তন করতে পারেন।`,
  te: (title) => `${title} గురించి ఈ ఉపన్యాసానికి స్వాగతం। కుడి వైపున సింక్రొనైజ్ చేసిన సిమ్యులేషన్‌ను గమనించండి।`,
  ta: (title) => `${title} பற்றிய இந்த விரிவுரைக்கு வரவேற்கிறோம்। வலது பக்க உருவகப்படுத்தலை கவனியுங்கள்।`,
  mr: (title) => `${title} वरील या व्याख्यानात आपले स्वागत आहे। उजव्या बाजूच्या सिम्युलेशनकडे लक्ष द्या।`
};

export default function LecturePlayer() {
  const [playlist, setPlaylist] = useState(INITIAL_PLAYLIST);
  const [activeLecture, setActiveLecture] = useState(INITIAL_PLAYLIST[0]);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [selectedLang, setSelectedLang] = useState('en');
  const [notes, setNotes] = useState('');
  const [doubtInput, setDoubtInput] = useState('');
  const [doubtAnswer, setDoubtAnswer] = useState('');
  const [isAskingDoubt, setIsAskingDoubt] = useState(false);
  const [activeBottomTab, setActiveBottomTab] = useState('summary');

  // YouTube Fetch & AI Analysis state
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [isFetchingVideo, setIsFetchingVideo] = useState(false);
  const [fetchProgress, setFetchProgress] = useState('');
  const [fetchError, setFetchError] = useState('');

  // Interactive Quiz state for active lecture
  const [selectedQuizAnswers, setSelectedQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(null);

  // Simulation state
  const [parameters, setParameters] = useState({});
  const [telemetry, setTelemetry] = useState([]);
  const [isSimRunning, setIsSimRunning] = useState(true);
  const [presets, setPresets] = useState([]);

  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const animFrameRef = useRef(null);
  const iframeRef = useRef(null);

  // Load presets
  useEffect(() => {
    fetchSimulationPresets().then(res => {
      setPresets(res.presets || []);
    });
  }, []);

  // Reset quiz state on lecture change
  useEffect(() => {
    setSelectedQuizAnswers({});
    setQuizSubmitted(false);
    setQuizScore(null);
    setDoubtAnswer('');
  }, [activeLecture.id]);

  // Initialize simulation and start animation loop whenever activeLecture or presets changes
  useEffect(() => {
    if (!activeLecture) return;

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.fillStyle = '#060a14';
      ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }

    const preset = presets.find(p => p.engineType === activeLecture.simulationEngine);
    const params = {};
    if (preset?.parameters) {
      preset.parameters.forEach(p => {
        params[p.key] = p.default;
      });
    }
    setParameters(params);
    engineRef.current = createSimulationEngine(activeLecture.simulationEngine, params);
    setIsSimRunning(true);

    let lastTime = performance.now();
    let isCancelled = false;

    const loop = (time) => {
      if (isCancelled) return;
      const dt = Math.min(0.05, (time - lastTime) / 1000);
      lastTime = time;

      const canvas = canvasRef.current;
      if (canvas && engineRef.current) {
        const ctx = canvas.getContext('2d');

        if (isSimRunning) {
          if (typeof engineRef.current.step === 'function') {
            engineRef.current.step(dt);
          } else if (typeof engineRef.current.update === 'function') {
            engineRef.current.update(dt);
          }
        }

        renderSimulationEngine(engineRef.current, ctx, canvas.width, canvas.height);

        if (typeof engineRef.current.getTelemetry === 'function') {
          setTelemetry(engineRef.current.getTelemetry());
        }
      }
      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      isCancelled = true;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    };
  }, [activeLecture, isSimRunning, presets]);

  // Parameter change handler
  const handleParamChange = (key, value) => {
    const updated = { ...parameters, [key]: Number(value) };
    setParameters(updated);
    if (engineRef.current?.updateParams) {
      engineRef.current.updateParams(updated);
    }
  };

  // Canvas click handler
  const handleCanvasClick = (e) => {
    if (!canvasRef.current || !engineRef.current?.handleClick) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    engineRef.current.handleClick(
      (e.clientX - rect.left) * scaleX,
      (e.clientY - rect.top) * scaleY,
      canvasRef.current.width,
      canvasRef.current.height
    );
  };

  // YouTube Fetch & AI Analysis Handler
  const handleFetchYouTube = async (urlToFetch = customUrlInput) => {
    const target = urlToFetch.trim();
    if (!target) {
      setFetchError('Please enter a YouTube video URL or ID');
      return;
    }

    setFetchError('');
    setIsFetchingVideo(true);
    setFetchProgress('Fetching YouTube video details & oEmbed metadata...');

    try {
      // Step 1: Fetch Video Metadata
      const meta = await fetchYouTubeMetadata(target);
      setFetchProgress(`Fetched "${meta.title}". Running AI curriculum analysis...`);

      // Step 2: Run AI Analysis
      const analyzedLecture = await analyzeYouTubeLectureWithAI(meta);
      setFetchProgress('Synchronizing 60 FPS numerical simulation engine...');

      // Step 3: Set as active lecture and prepend to playlist
      setActiveLecture(analyzedLecture);
      setPlaylist(prev => {
        const exists = prev.find(p => p.id === analyzedLecture.id);
        return exists ? [analyzedLecture, ...prev.filter(p => p.id !== analyzedLecture.id)] : [analyzedLecture, ...prev];
      });

      setCustomUrlInput('');
      setFetchProgress('');
      setActiveBottomTab('summary');

      // Trigger celebratory particle animation
      confetti({ particleCount: 60, spread: 60, origin: { y: 0.7 } });
    } catch (err) {
      console.error('YouTube Fetch Error:', err);
      setFetchError(err.message || 'Failed to fetch YouTube video. Please verify the URL.');
      setFetchProgress('');
    } finally {
      setIsFetchingVideo(false);
    }
  };

  // Socratic Doubt Solver
  const handleAskDoubt = async (e) => {
    e.preventDefault();
    if (!doubtInput.trim() || isAskingDoubt) return;
    setIsAskingDoubt(true);
    try {
      const prompt = `You are a STEM professor teaching "${activeLecture.title}" (${activeLecture.subject}). Answer this student doubt constructively in 2-3 concise sentences: "${doubtInput}"`;
      const res = await sendChatMessage(prompt, 'SOCRATIC', { topic: activeLecture.title });
      setDoubtAnswer(res?.text || res?.message || 'The simulation demonstrates this physical principle visually. Observe how adjusting the parameters changes the system output.');
    } catch {
      setDoubtAnswer('Focus on how the governing equations drive the real-time simulation. Try adjusting the parameters to test your hypothesis.');
    } finally {
      setIsAskingDoubt(false);
      setDoubtInput('');
    }
  };

  // Quiz submission handler
  const handleQuizAnswerSelect = (qIndex, optIndex) => {
    if (quizSubmitted) return;
    setSelectedQuizAnswers(prev => ({ ...prev, [qIndex]: optIndex }));
  };

  const handleSubmitQuiz = () => {
    const questions = activeLecture.quiz || [];
    if (questions.length === 0) return;

    let correct = 0;
    questions.forEach((q, idx) => {
      if (selectedQuizAnswers[idx] === q.correctIndex) {
        correct += 1;
      }
    });

    const score = { correct, total: questions.length, percent: Math.round((correct / questions.length) * 100) };
    setQuizScore(score);
    setQuizSubmitted(true);

    if (score.percent >= 66) {
      confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 } });
    }
  };

  const activePreset = presets.find(p => p.engineType === activeLecture.simulationEngine);
  const currentCaption = activeLecture.captions?.[selectedLang] ||
    captionTranslations[selectedLang]?.(activeLecture.title) ||
    captionTranslations.en(activeLecture.title);

  return (
    <div className="space-y-4 text-slate-100 font-sans pb-12">
      {/* ── Top Cyber Hero Banner ── */}
      <div className="relative rounded-2xl p-5 border border-violet-500/40 bg-gradient-to-r from-dark-950 via-[#0f0520] to-dark-900 overflow-hidden shadow-glow-magenta">
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-violet-400 pointer-events-none" />
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-cyan-500 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-cyan-500 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-violet-400 pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded bg-violet-500/15 border border-violet-500/30 text-violet-300 font-mono text-2xs uppercase tracking-widest font-bold">
                INTERACTIVE LECTURE COCKPIT
              </span>
              <span className="px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-mono text-2xs font-bold flex items-center gap-1">
                <Youtube className="w-3 h-3 text-red-400" /> ANY YOUTUBE LECTURE
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-mono text-2xs font-bold">
                60 FPS LIVE SIM SYNC
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-display font-black tracking-tight text-white">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-300 to-cyan-400">
                Lecture
              </span>
              <span className="text-slate-400 font-light mx-2">//</span>
              <span className="text-white">Video + Real-Time Simulation Engine</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Paste ANY educational YouTube link to analyze with AI, auto-sync with interactive 60 FPS physics simulations, generate multi-language captions, and solve doubts in real time.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-dark-900/80 border border-violet-500/30 px-4 py-2.5 rounded-xl font-mono text-xs shadow-inner shrink-0">
            <Eye className="w-4 h-4 text-violet-400 animate-pulse" />
            <div>
              <span className="text-2xs text-slate-400 block font-semibold">NOW PLAYING</span>
              <span className="text-xs font-bold text-violet-300 truncate max-w-[170px] block">{activeLecture.title}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── YouTube Video Fetcher & AI Analyzer Input Bar ── */}
      <div className="card-elevated p-4 border border-cyan-500/40 bg-gradient-to-r from-dark-950 via-[#07131e] to-dark-900 rounded-2xl shadow-lg">
        <div className="flex items-center gap-2 mb-2.5">
          <Youtube className="w-4 h-4 text-red-500 animate-pulse" />
          <span className="text-xs font-mono font-bold text-cyan-300 uppercase tracking-wider">
            Fetch & Analyze Any YouTube Video with AI
          </span>
          <span className="text-2xs text-slate-500 font-mono ml-auto hidden sm:inline">
            Paste link • AI Extracts Physics • Auto-Matches 60 FPS Sim
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={customUrlInput}
              onChange={(e) => setCustomUrlInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleFetchYouTube()}
              placeholder="Paste YouTube Video URL (e.g. https://www.youtube.com/watch?v=sI5Ftm1-jik or youtu.be/...)"
              className="w-full px-4 py-2.5 rounded-xl bg-dark-900/90 border border-slate-700/60 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/40 transition-all"
            />
            {customUrlInput && (
              <button
                onClick={() => setCustomUrlInput('')}
                className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          <button
            onClick={() => handleFetchYouTube()}
            disabled={isFetchingVideo || !customUrlInput.trim()}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-mono font-bold flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer shrink-0"
          >
            {isFetchingVideo ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>Analyzing Video...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-yellow-300" />
                <span>Fetch & AI Analyze</span>
              </>
            )}
          </button>
        </div>

        {/* Progress or Error message */}
        {fetchProgress && (
          <div className="mt-2.5 flex items-center gap-2 text-2xs font-mono text-cyan-300 bg-cyan-500/10 border border-cyan-500/30 px-3 py-1.5 rounded-lg">
            <RefreshCw className="w-3 h-3 animate-spin" />
            <span>{fetchProgress}</span>
          </div>
        )}

        {fetchError && (
          <div className="mt-2.5 text-2xs font-mono text-rose-400 bg-rose-500/10 border border-rose-500/30 px-3 py-1.5 rounded-lg">
            ⚠️ {fetchError}
          </div>
        )}

        {/* Quick Sample Presets */}
        <div className="mt-3 flex items-center gap-2 flex-wrap">
          <span className="text-2xs text-slate-500 font-mono">Quick Try:</span>
          {SAMPLE_PRESETS.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => {
                setCustomUrlInput(preset.url);
                handleFetchYouTube(preset.url);
              }}
              disabled={isFetchingVideo}
              className="text-2xs font-mono px-2 py-1 rounded-md bg-dark-800/80 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-200 border border-slate-700/50 hover:border-cyan-500/40 transition-colors cursor-pointer"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── MAIN SPLIT-SCREEN: Video (Left 60%) + Live Simulation (Right 40%) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* LEFT PANE — Video Player */}
        <div className="lg:col-span-3 space-y-3">
          <div className="relative rounded-xl overflow-hidden border border-slate-700/50 bg-black aspect-video shadow-2xl shadow-violet-500/10">
            <iframe
              ref={iframeRef}
              src={`${activeLecture.videoUrl}?autoplay=0&rel=0&modestbranding=1`}
              title={activeLecture.title}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>

          {/* Lecture Info Card */}
          <div className="card-elevated p-4 border border-slate-700/50">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-base font-bold text-white leading-tight">{activeLecture.title}</h2>
                  {activeLecture.isCustom && (
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono text-2xs font-bold">
                      AI ANALYZED
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-1">{activeLecture.description || activeLecture.summary}</p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded bg-violet-500/15 border border-violet-500/30 text-violet-300 text-2xs font-mono font-bold">
                    {activeLecture.subject}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-700/50 text-slate-300 text-2xs font-mono">
                    {activeLecture.chapter}
                  </span>
                  {activeLecture.duration && (
                    <span className="flex items-center gap-1 text-2xs text-slate-500 font-mono">
                      <Clock className="w-3 h-3" />{activeLecture.duration}
                    </span>
                  )}
                  {activeLecture.watchUrl && (
                    <a
                      href={activeLecture.watchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-2xs text-cyan-400 hover:underline font-mono ml-auto"
                    >
                      <ExternalLink className="w-3 h-3" /> Open on YouTube
                    </a>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {[0.5, 1.0, 1.5, 2.0].map(speed => (
                  <button
                    key={speed}
                    onClick={() => setPlaybackSpeed(speed)}
                    className={`px-2 py-1 rounded text-2xs font-mono font-bold transition-all ${
                      playbackSpeed === speed
                        ? 'bg-violet-500/30 text-violet-300 border border-violet-500/50'
                        : 'bg-dark-800/50 text-slate-500 hover:text-slate-300 border border-dark-700/50'
                    }`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANE — Synchronized Simulation */}
        <div className="lg:col-span-2 space-y-3">
          <div className="relative rounded-xl border border-cyan-500/30 bg-dark-950 overflow-hidden shadow-2xl shadow-cyan-500/10">
            {/* Simulation Header */}
            <div className="flex items-center justify-between px-3 py-2 bg-dark-900/90 border-b border-cyan-500/20">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-2xs font-mono text-cyan-300 font-bold">60 FPS SOLVER // LIVE</span>
              </div>
              <span className="text-2xs font-mono text-slate-400 truncate max-w-[180px]">
                {activeLecture.simulationEngine}
              </span>
            </div>

            {/* Canvas */}
            <canvas
              ref={canvasRef}
              width={700}
              height={420}
              className="w-full cursor-crosshair"
              onClick={handleCanvasClick}
            />

            {/* Sim Controls */}
            <div className="flex items-center justify-between px-3 py-2 bg-dark-900/90 border-t border-cyan-500/20">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsSimRunning(!isSimRunning)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-bold hover:bg-cyan-500/20 transition-colors cursor-pointer"
                >
                  {isSimRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  {isSimRunning ? 'PAUSE' : 'PLAY'}
                </button>
                <button
                  onClick={() => engineRef.current?.reset?.(parameters)}
                  className="p-1.5 rounded-lg bg-dark-800/50 border border-dark-700/50 text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
                  title="Reset Simulation State"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>

              {activeLecture.simulationReason && (
                <span className="text-3xs font-mono text-slate-500 truncate max-w-[180px]" title={activeLecture.simulationReason}>
                  {activeLecture.simulationReason}
                </span>
              )}
            </div>
          </div>

          {/* Parameter Sliders */}
          {activePreset?.parameters?.length > 0 && (
            <div className="card-elevated p-3 border border-slate-700/50 space-y-3">
              <div className="flex items-center gap-2 text-xs font-mono text-cyan-300 font-bold">
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                STUDENT PARAMETER TUNER
              </div>
              <div className="grid grid-cols-1 gap-2.5">
                {activePreset.parameters.filter(p => p.type !== 'select').slice(0, 4).map(p => (
                  <div key={p.key}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-2xs text-slate-400 font-mono">{p.label}</span>
                      <span className="text-2xs font-bold text-cyan-300 font-mono">{parameters[p.key] ?? p.default} {p.unit}</span>
                    </div>
                    <input
                      type="range"
                      min={p.min}
                      max={p.max}
                      step={p.step}
                      value={parameters[p.key] ?? p.default}
                      onChange={(e) => handleParamChange(p.key, e.target.value)}
                      className="w-full h-1.5 rounded-full bg-dark-700 appearance-none cursor-pointer accent-cyan-400"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Telemetry */}
          {telemetry.length > 0 && (
            <div className="card-elevated p-3 border border-slate-700/50">
              <div className="grid grid-cols-2 gap-2">
                {telemetry.slice(0, 4).map((t, i) => (
                  <div key={i} className="p-2 rounded-lg bg-dark-800/50 border border-dark-700/30">
                    <div className="text-2xs text-slate-500 font-mono mb-0.5">{t.label}</div>
                    <div className={`text-xs font-bold font-mono ${t.color || 'text-cyan-400'} truncate`}>{t.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── BOTTOM DOCK: AI Summary / AI Quiz / AI Doubt Solver / Captions / Notes ── */}
      <div className="card-elevated border border-slate-700/50 overflow-hidden rounded-2xl">
        {/* Tab Bar */}
        <div className="flex items-center border-b border-slate-700/30 bg-dark-900/80 overflow-x-auto">
          {[
            { id: 'summary', label: 'AI Concept Analysis & Formulas', icon: Sparkles },
            { id: 'quiz', label: 'Interactive Review Quiz', icon: HelpCircle },
            { id: 'doubt', label: 'AI Doubt Solver', icon: MessageSquare },
            { id: 'captions', label: 'Live Multilingual Captions', icon: Globe },
            { id: 'notes', label: 'My Lecture Notes', icon: PenLine }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveBottomTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-xs font-mono font-bold transition-all border-b-2 whitespace-nowrap cursor-pointer ${
                activeBottomTab === tab.id
                  ? 'text-cyan-300 border-cyan-400 bg-cyan-500/5'
                  : 'text-slate-400 border-transparent hover:text-slate-200'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-5">
          {/* TAB 1: AI Concept Summary & Formulas */}
          {activeBottomTab === 'summary' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-mono text-cyan-300 font-bold uppercase tracking-wider">
                    AI Pedagogical Analysis — {activeLecture.title}
                  </span>
                </div>
                {activeLecture.modelUsed && (
                  <span className="text-2xs font-mono text-slate-500">
                    Engine: {activeLecture.modelUsed}
                  </span>
                )}
              </div>

              <div className="p-4 rounded-xl bg-dark-800/60 border border-slate-700/40 text-xs text-slate-200 leading-relaxed">
                <span className="text-cyan-400 font-bold block mb-1 font-mono">EXECUTIVE SYNOPSIS</span>
                {activeLecture.summary || activeLecture.description}
              </div>

              {/* Key Concepts Grid */}
              {activeLecture.keyConcepts?.length > 0 && (
                <div>
                  <span className="text-2xs font-mono text-slate-400 uppercase tracking-wider block mb-2 font-bold">
                    Identified Syllabus Concepts
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                    {activeLecture.keyConcepts.map((concept, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-dark-850 border border-dark-700/60 flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="text-xs font-mono text-slate-200 truncate">{concept}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Governing Equations */}
              {activeLecture.equations?.length > 0 && (
                <div>
                  <span className="text-2xs font-mono text-slate-400 uppercase tracking-wider block mb-2 font-bold">
                    Mathematical & Physical Governing Laws
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {activeLecture.equations.map((eq, idx) => (
                      <div key={idx} className="p-3 rounded-lg bg-dark-850 border border-cyan-500/20 font-mono">
                        <span className="text-2xs text-cyan-400 block mb-1 font-semibold">{eq.label}</span>
                        <code className="text-xs text-amber-200 block bg-dark-900 px-2 py-1 rounded">
                          {eq.formula || eq.latex}
                        </code>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Interactive Review Quiz */}
          {activeBottomTab === 'quiz' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-mono text-amber-300 font-bold uppercase tracking-wider">
                    Lecture Knowledge Check — 3 Conceptual Questions
                  </span>
                </div>
                {quizScore && (
                  <span className="text-xs font-mono font-bold text-emerald-400 px-3 py-1 rounded bg-emerald-500/10 border border-emerald-500/30">
                    Score: {quizScore.correct}/{quizScore.total} ({quizScore.percent}%)
                  </span>
                )}
              </div>

              {(!activeLecture.quiz || activeLecture.quiz.length === 0) ? (
                <div className="text-center py-6 text-slate-500 font-mono text-xs">
                  No review questions available for this lecture.
                </div>
              ) : (
                <div className="space-y-4">
                  {activeLecture.quiz.map((q, qIdx) => {
                    const selected = selectedQuizAnswers[qIdx];
                    const isAnswered = selected !== undefined;
                    return (
                      <div key={qIdx} className="p-4 rounded-xl bg-dark-850 border border-slate-700/50 space-y-3">
                        <div className="flex items-start gap-2">
                          <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded">
                            Q{qIdx + 1}
                          </span>
                          <p className="text-xs font-semibold text-slate-100">{q.question}</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {q.options.map((opt, optIdx) => {
                            let style = 'bg-dark-800/80 border-slate-700/60 text-slate-300 hover:border-slate-500';
                            if (quizSubmitted) {
                              if (optIdx === q.correctIndex) {
                                style = 'bg-emerald-500/20 border-emerald-500 text-emerald-200 font-bold';
                              } else if (selected === optIdx) {
                                style = 'bg-rose-500/20 border-rose-500 text-rose-300';
                              }
                            } else if (selected === optIdx) {
                              style = 'bg-cyan-500/20 border-cyan-400 text-cyan-200 font-bold';
                            }

                            return (
                              <button
                                key={optIdx}
                                onClick={() => handleQuizAnswerSelect(qIdx, optIdx)}
                                disabled={quizSubmitted}
                                className={`text-left p-2.5 rounded-lg border text-xs font-mono transition-all cursor-pointer ${style}`}
                              >
                                <span className="text-slate-500 mr-2 font-bold">{String.fromCharCode(65 + optIdx)}.</span>
                                {opt}
                              </button>
                            );
                          })}
                        </div>

                        {quizSubmitted && q.explanation && (
                          <div className="p-2.5 rounded-lg bg-dark-900 border border-cyan-500/20 text-2xs font-mono text-cyan-300">
                            💡 <strong>Explanation:</strong> {q.explanation}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  <div className="flex items-center gap-3 pt-2">
                    {!quizSubmitted ? (
                      <button
                        onClick={handleSubmitQuiz}
                        disabled={Object.keys(selectedQuizAnswers).length === 0}
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-mono font-bold disabled:opacity-50 transition-all cursor-pointer shadow-lg shadow-emerald-600/20"
                      >
                        Submit Answers
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedQuizAnswers({});
                          setQuizSubmitted(false);
                          setQuizScore(null);
                        }}
                        className="px-4 py-2 rounded-xl bg-dark-800 hover:bg-dark-700 text-slate-300 text-xs font-mono font-bold border border-slate-600 transition-colors cursor-pointer"
                      >
                        Retake Quiz
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: AI Doubt Solver */}
          {activeBottomTab === 'doubt' && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-mono text-amber-300 font-bold">
                  AI SOCRATIC DOUBT SOLVER // ZERO API KEY REQUIRED
                </span>
              </div>
              {doubtAnswer && (
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 mb-3">
                  <div className="text-2xs text-emerald-400 font-mono font-bold mb-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> PROFESSOR'S SOCRATIC GUIDANCE
                  </div>
                  <p className="text-xs text-slate-100 leading-relaxed">{doubtAnswer}</p>
                </div>
              )}
              <form onSubmit={handleAskDoubt} className="flex gap-2">
                <input
                  type="text"
                  value={doubtInput}
                  onChange={(e) => setDoubtInput(e.target.value)}
                  placeholder={`Ask a conceptual doubt about "${activeLecture.title}"...`}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-dark-800/80 border border-slate-700/60 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-violet-400"
                />
                <button
                  type="submit"
                  disabled={isAskingDoubt || !doubtInput.trim()}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white text-xs font-bold font-mono flex items-center gap-1.5 disabled:opacity-50 hover:shadow-lg hover:shadow-violet-500/20 transition-all cursor-pointer"
                >
                  {isAskingDoubt ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  Ask
                </button>
              </form>
            </div>
          )}

          {/* TAB 4: Live Captions */}
          {activeBottomTab === 'captions' && (
            <div>
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <Volume2 className="w-4 h-4 text-violet-400" />
                <span className="text-xs font-mono text-violet-300 font-bold">
                  MULTI-LANGUAGE TEACHER SUBTITLES (6 LANGUAGES)
                </span>
                <div className="flex items-center gap-1 ml-auto flex-wrap">
                  {captionLanguages.map(lang => (
                    <button
                      key={lang.code}
                      onClick={() => setSelectedLang(lang.code)}
                      className={`px-2.5 py-1 rounded text-2xs font-mono font-bold transition-all cursor-pointer ${
                        selectedLang === lang.code
                          ? 'bg-violet-500/30 text-violet-300 border border-violet-500/50'
                          : 'bg-dark-800/50 text-slate-500 hover:text-slate-300 border border-dark-700/50'
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-dark-800/60 border border-slate-700/40 font-mono text-xs text-slate-200 leading-relaxed">
                <span className="text-violet-400 font-bold block mb-1">
                  SUBTITLES [{selectedLang.toUpperCase()}]
                </span>
                "{currentCaption}"
              </div>
            </div>
          )}

          {/* TAB 5: My Notes */}
          {activeBottomTab === 'notes' && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <PenLine className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-mono text-cyan-300 font-bold">
                  SESSION LECTURE NOTES — {activeLecture.title}
                </span>
              </div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Write down your key observations, mathematical formulas, and simulation insights here..."
                className="w-full h-36 px-4 py-3 rounded-xl bg-dark-800/80 border border-slate-700/60 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-cyan-400 resize-none"
              />
            </div>
          )}
        </div>
      </div>

      {/* ── LECTURE PLAYLIST CAROUSEL ── */}
      <div className="card-elevated p-4 border border-slate-700/50 rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-violet-400" />
            <span className="text-xs font-mono text-violet-300 font-bold uppercase tracking-wider">
              Lecture Playlist — Click to load video + 60 FPS numerical simulation
            </span>
          </div>
          <span className="text-2xs text-slate-500 font-mono">{playlist.length} lectures available</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {playlist.map(lecture => {
            const isActive = activeLecture.id === lecture.id;
            return (
              <button
                key={lecture.id}
                onClick={() => {
                  setActiveLecture(lecture);
                  setDoubtAnswer('');
                }}
                className={`group relative p-3 rounded-xl border text-left transition-all duration-300 cursor-pointer ${
                  isActive
                    ? 'border-violet-500/50 bg-violet-500/10 shadow-lg shadow-violet-500/10'
                    : 'border-dark-700/50 bg-dark-800/30 hover:border-slate-600/50 hover:bg-dark-800/60'
                }`}
              >
                {/* Thumbnail */}
                {lecture.thumbnailUrl ? (
                  <div className="w-full h-24 rounded-lg overflow-hidden mb-2.5 bg-black relative">
                    <img src={lecture.thumbnailUrl} alt={lecture.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    {lecture.isCustom && (
                      <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-amber-500/80 text-black font-mono text-3xs font-bold">
                        CUSTOM
                      </span>
                    )}
                  </div>
                ) : (
                  <div className={`w-full h-20 rounded-lg bg-gradient-to-br ${lecture.color || 'from-violet-600 to-indigo-700'} flex items-center justify-center text-3xl mb-2.5 shadow-inner`}>
                    {lecture.thumbnail}
                  </div>
                )}

                <h3 className={`text-xs font-bold leading-tight mb-1 line-clamp-2 ${isActive ? 'text-violet-200' : 'text-slate-200 group-hover:text-white'}`}>
                  {lecture.title}
                </h3>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-2xs font-mono text-slate-400">{lecture.subject}</span>
                  {lecture.duration && (
                    <span className="text-2xs font-mono text-slate-500">{lecture.duration}</span>
                  )}
                </div>

                {isActive && (
                  <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
