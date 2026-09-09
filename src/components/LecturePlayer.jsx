import React, { useState, useEffect, useRef } from 'react';
import {
  Play, Pause, SkipForward, SkipBack, Maximize2, Volume2, VolumeX,
  Sparkles, MessageSquare, BookOpen, Globe, ChevronRight, FileText,
  Zap, Atom, Radio, Cpu, Activity, Clock, Users, Send, Copy,
  Check, Code, RefreshCw, Eye, Layers, ArrowRight, PenLine
} from 'lucide-react';
import { createSimulationEngine, renderSimulationEngine } from '../services/cyberSimEngines';
import { fetchSimulationPresets, sendChatMessage } from '../services/ollamaService';

// ═══════════════════════════════════════════════════════════════════
// PRE-BUILT LECTURE-SIMULATION PAIRS
// ═══════════════════════════════════════════════════════════════════
const LECTURE_PLAYLIST = [
  {
    id: 'lec-circuit-basics',
    title: 'AC/DC Circuits & Bridge Rectifiers',
    subject: 'ECE',
    duration: '42:15',
    chapter: 'Unit 2: Analog Electronics',
    thumbnail: '⚡',
    videoUrl: 'https://www.youtube.com/embed/VtVDi0n3h3I',
    simulationEngine: 'CIRCUIT_EVERYCIRCUIT',
    description: 'Deep-dive into full-wave bridge rectifiers, smoothing capacitors, and ripple voltage analysis.',
    color: 'from-cyan-500 to-blue-600'
  },
  {
    id: 'lec-logic-gates',
    title: 'Digital Logic Gates & Boolean Algebra',
    subject: 'CSE / ECE',
    duration: '38:00',
    chapter: 'Unit 1: Digital Systems',
    thumbnail: '🔲',
    videoUrl: 'https://www.youtube.com/embed/JQBRzsPhw2w',
    simulationEngine: 'DIGITAL_LOGIC_LAB',
    description: 'Interactive truth tables, AND/OR/NOT/XOR gates, De Morgan theorems with live circuit simulation.',
    color: 'from-emerald-500 to-teal-600'
  },
  {
    id: 'lec-pendulum-chaos',
    title: 'Double Pendulum & Chaotic Motion',
    subject: 'Physics',
    duration: '35:20',
    chapter: 'Unit 5: Nonlinear Dynamics',
    thumbnail: '🔄',
    videoUrl: 'https://www.youtube.com/embed/d0Z8wLLPNE0',
    simulationEngine: 'DOUBLE_PENDULUM',
    description: 'Exploring deterministic chaos through coupled pendulums, Lyapunov exponents, and phase space.',
    color: 'from-violet-500 to-purple-600'
  },
  {
    id: 'lec-wave-optics',
    title: 'Wave Optics & Diffraction Patterns',
    subject: 'Class 12 Physics',
    duration: '45:10',
    chapter: 'Unit 10: Wave Optics',
    thumbnail: '🌊',
    videoUrl: 'https://www.youtube.com/embed/Iuv6hY6zsd0',
    simulationEngine: 'WAVE_DIFFRACTION',
    description: 'Single-slit and double-slit diffraction, Huygens principle, and interference fringes.',
    color: 'from-amber-500 to-orange-600'
  },
  {
    id: 'lec-galaxy-sim',
    title: 'Spiral Galaxy Dynamics & N-Body Gravity',
    subject: 'Astrophysics',
    duration: '50:30',
    chapter: 'Unit 8: Gravitation & Orbits',
    thumbnail: '🌌',
    videoUrl: 'https://www.youtube.com/embed/Bcz4vGwap2o',
    simulationEngine: 'GALAXY_N_BODY',
    description: 'Logarithmic spiral arms, dark matter halos, and N-body gravitational perturbation.',
    color: 'from-pink-500 to-rose-600'
  },
  {
    id: 'lec-opamp-circuits',
    title: 'Op-Amp Inverting Amplifiers & Feedback',
    subject: 'ECE Lab',
    duration: '40:00',
    chapter: 'Unit 4: Linear Integrated Circuits',
    thumbnail: '📐',
    videoUrl: 'https://www.youtube.com/embed/7FYHt5X322w',
    simulationEngine: 'OPAMP_INVERTING',
    description: 'Virtual ground approximation, feedback resistors Rf/Rin, gain scaling and dual-trace scope analysis.',
    color: 'from-cyan-400 to-teal-600'
  },
  {
    id: 'lec-555-timer',
    title: '555 Timer IC Astable Multivibrators',
    subject: 'ECE / IoT',
    duration: '36:45',
    chapter: 'Unit 6: Pulse & Switching Circuits',
    thumbnail: '⏱️',
    videoUrl: 'https://www.youtube.com/embed/kRlSFm519Bo',
    simulationEngine: 'TIMER_555',
    description: 'Capacitor charging curves between 1/3 and 2/3 Vcc, duty cycle calculation, and clock generation.',
    color: 'from-yellow-500 to-amber-600'
  },
  {
    id: 'lec-full-adder',
    title: 'ALU Architecture & 4-Bit Ripple Adders',
    subject: 'CSE Architecture',
    duration: '44:00',
    chapter: 'Unit 3: Computer Organization',
    thumbnail: '🔢',
    videoUrl: 'https://www.youtube.com/embed/wvJc9CZcvBc',
    simulationEngine: 'FULL_ADDER',
    description: 'Binary arithmetic, half adders, full adder slices, carry propagation ripples and overflow flags.',
    color: 'from-emerald-400 to-green-600'
  }
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
  const [activeLecture, setActiveLecture] = useState(LECTURE_PLAYLIST[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const [selectedLang, setSelectedLang] = useState('en');
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState('');
  const [doubtInput, setDoubtInput] = useState('');
  const [doubtAnswer, setDoubtAnswer] = useState('');
  const [isAskingDoubt, setIsAskingDoubt] = useState(false);
  const [activeBottomTab, setActiveBottomTab] = useState('captions');

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

  // Initialize simulation and start animation loop whenever activeLecture or presets changes
  useEffect(() => {
    if (!activeLecture) return;

    // 1. Immediately cancel in-flight animation frame to prevent dual-sim execution
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    // 2. Immediately blank out canvas with dark background
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.fillStyle = '#060a14';
      ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }

    // 3. Resolve parameters and instantiate engine
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

    // 4. Start clean 60 FPS animation loop
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

        // Universal clean render dispatcher — clears canvas every frame & centers properly
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

  const handleParamChange = (key, value) => {
    const updated = { ...parameters, [key]: Number(value) };
    setParameters(updated);
    if (engineRef.current?.updateParams) {
      engineRef.current.updateParams(updated);
    }
  };

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

  const handleAskDoubt = async (e) => {
    e.preventDefault();
    if (!doubtInput.trim() || isAskingDoubt) return;
    setIsAskingDoubt(true);
    try {
      const prompt = `You are a professor teaching "${activeLecture.title}" (${activeLecture.subject}). Answer this student doubt in 2-3 concise sentences: "${doubtInput}"`;
      const res = await sendChatMessage(prompt, 'SOCRATIC', { topic: activeLecture.title });
      setDoubtAnswer(res?.text || res?.message || 'The simulation demonstrates the physical principle visually. Observe how the parameters interact to produce the observed behavior.');
    } catch {
      setDoubtAnswer('Focus on how the governing equations drive the real-time simulation. Try adjusting the parameters to test your hypothesis.');
    } finally {
      setIsAskingDoubt(false);
      setDoubtInput('');
    }
  };

  const activePreset = presets.find(p => p.engineType === activeLecture.simulationEngine);
  const currentCaption = captionTranslations[selectedLang]?.(activeLecture.title) || captionTranslations.en(activeLecture.title);

  return (
    <div className="space-y-4 text-slate-100 font-sans pb-12">
      {/* ── Hero Banner ── */}
      <div className="relative rounded-2xl p-5 border border-violet-500/40 bg-gradient-to-r from-dark-950 via-[#0f0520] to-dark-900 overflow-hidden shadow-glow-magenta">
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-violet-400 pointer-events-none" />
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-cyan-500 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-cyan-500 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-violet-400 pointer-events-none" />

        <div className="flex items-center justify-between relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded bg-violet-500/15 border border-violet-500/30 text-violet-300 font-mono text-2xs uppercase tracking-widest font-bold">
                INTERACTIVE LECTURE COCKPIT
              </span>
              <span className="px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-mono text-2xs font-bold">
                PW • UNACADEMY STYLE
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-mono text-2xs font-bold">
                LIVE SIM SYNC
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-display font-black tracking-tight text-white">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-300 to-cyan-400">
                Lecture
              </span>
              <span className="text-slate-400 font-light mx-2">//</span>
              <span className="text-white">Video + Live Simulation</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              Watch lectures with synchronized real-time simulations. AI doubt solver, 6-language captions, and student-controlled parameter tuning.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-dark-900/80 border border-violet-500/30 px-4 py-2.5 rounded-xl font-mono text-xs shadow-inner shrink-0">
            <Eye className="w-4 h-4 text-violet-400 animate-pulse" />
            <div>
              <span className="text-2xs text-slate-400 block font-semibold">NOW PLAYING</span>
              <span className="text-xs font-bold text-violet-300 truncate max-w-[140px] block">{activeLecture.subject}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN SPLIT-SCREEN: Video (Left 60%) + Simulation (Right 40%) ── */}
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
            {/* Overlay gradient */}
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-dark-950/80 to-transparent pointer-events-none" />
          </div>

          {/* Lecture Info Card */}
          <div className="card-elevated p-4 border border-slate-700/50">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-white leading-tight">{activeLecture.title}</h2>
                <p className="text-xs text-slate-400 mt-1">{activeLecture.description}</p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded bg-violet-500/15 border border-violet-500/30 text-violet-300 text-2xs font-mono font-bold">{activeLecture.subject}</span>
                  <span className="px-2 py-0.5 rounded bg-slate-700/50 text-slate-300 text-2xs font-mono">{activeLecture.chapter}</span>
                  <span className="flex items-center gap-1 text-2xs text-slate-500"><Clock className="w-3 h-3" />{activeLecture.duration}</span>
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
              <span className="text-2xs font-mono text-slate-500">{activeLecture.simulationEngine}</span>
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
            <div className="flex items-center gap-2 px-3 py-2 bg-dark-900/90 border-t border-cyan-500/20">
              <button
                onClick={() => setIsSimRunning(!isSimRunning)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-bold hover:bg-cyan-500/20 transition-colors"
              >
                {isSimRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                {isSimRunning ? 'PAUSE' : 'PLAY'}
              </button>
              <button
                onClick={() => engineRef.current?.reset?.(parameters)}
                className="p-1.5 rounded-lg bg-dark-800/50 border border-dark-700/50 text-slate-400 hover:text-cyan-300 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Parameter Sliders */}
          {activePreset?.parameters?.length > 0 && (
            <div className="card-elevated p-3 border border-slate-700/50 space-y-3">
              <div className="flex items-center gap-2 text-xs font-mono text-cyan-300 font-bold">
                <Zap className="w-3.5 h-3.5" />
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

      {/* ── BOTTOM DOCK: Captions / AI Doubt Solver / Notes ── */}
      <div className="card-elevated border border-slate-700/50 overflow-hidden">
        {/* Tab Bar */}
        <div className="flex items-center border-b border-slate-700/30 bg-dark-900/80">
          {[
            { id: 'captions', label: 'Live Captions', icon: Globe },
            { id: 'doubt', label: 'AI Doubt Solver', icon: MessageSquare },
            { id: 'notes', label: 'My Notes', icon: PenLine }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveBottomTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-mono font-bold transition-all border-b-2 ${
                activeBottomTab === tab.id
                  ? 'text-violet-300 border-violet-400 bg-violet-500/5'
                  : 'text-slate-500 border-transparent hover:text-slate-300'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-4">
          {activeBottomTab === 'captions' && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Volume2 className="w-4 h-4 text-violet-400" />
                <span className="text-xs font-mono text-violet-300 font-bold">LIVE CAPTION // AUTO-TRANSLATION</span>
                <div className="flex items-center gap-1 ml-auto">
                  {captionLanguages.map(lang => (
                    <button
                      key={lang.code}
                      onClick={() => setSelectedLang(lang.code)}
                      className={`px-2 py-1 rounded text-2xs font-mono font-bold transition-all ${
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
              <div className="p-3 rounded-lg bg-dark-800/50 border border-dark-700/30 font-mono text-xs text-slate-200 leading-relaxed">
                <span className="text-violet-400 font-bold">SUBTITLES [{selectedLang.toUpperCase()}]</span>
                <br />
                "{currentCaption}"
              </div>
            </div>
          )}

          {activeBottomTab === 'doubt' && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-mono text-amber-300 font-bold">AI DOUBT SOLVER // POWERED BY OLLAMA + POLLINATIONS.AI (FREE UNLIMITED)</span>
              </div>
              {doubtAnswer && (
                <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 mb-3">
                  <div className="text-2xs text-emerald-400 font-mono font-bold mb-1">🎓 PROFESSOR'S RESPONSE</div>
                  <p className="text-xs text-slate-200 leading-relaxed">{doubtAnswer}</p>
                </div>
              )}
              <form onSubmit={handleAskDoubt} className="flex gap-2">
                <input
                  type="text"
                  value={doubtInput}
                  onChange={(e) => setDoubtInput(e.target.value)}
                  placeholder={`Ask a doubt about "${activeLecture.title}"...`}
                  className="flex-1 px-3 py-2 rounded-lg bg-dark-800/50 border border-dark-700/50 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-violet-500/50"
                />
                <button
                  type="submit"
                  disabled={isAskingDoubt || !doubtInput.trim()}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 hover:shadow-lg hover:shadow-violet-500/20 transition-all"
                >
                  {isAskingDoubt ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  Ask
                </button>
              </form>
            </div>
          )}

          {activeBottomTab === 'notes' && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <PenLine className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-mono text-cyan-300 font-bold">PERSONAL NOTES — {activeLecture.title}</span>
              </div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Type your lecture notes here... They'll be preserved for this session."
                className="w-full h-32 px-3 py-2 rounded-lg bg-dark-800/50 border border-dark-700/50 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-cyan-500/50 resize-none"
              />
            </div>
          )}
        </div>
      </div>

      {/* ── LECTURE PLAYLIST CAROUSEL ── */}
      <div className="card-elevated p-4 border border-slate-700/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-violet-400" />
            <span className="text-xs font-mono text-violet-300 font-bold uppercase tracking-wider">Lecture Playlist — Click to load video + simulation</span>
          </div>
          <span className="text-2xs text-slate-500 font-mono">{LECTURE_PLAYLIST.length} lectures available</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {LECTURE_PLAYLIST.map(lecture => {
            const isActive = activeLecture.id === lecture.id;
            return (
              <button
                key={lecture.id}
                onClick={() => {
                  setActiveLecture(lecture);
                  setDoubtAnswer('');
                }}
                className={`group relative p-3 rounded-xl border text-left transition-all duration-300 ${
                  isActive
                    ? 'border-violet-500/50 bg-violet-500/10 shadow-lg shadow-violet-500/10'
                    : 'border-dark-700/50 bg-dark-800/30 hover:border-slate-600/50 hover:bg-dark-800/60'
                }`}
              >
                {/* Thumbnail */}
                <div className={`w-full h-20 rounded-lg bg-gradient-to-br ${lecture.color} flex items-center justify-center text-3xl mb-2.5 shadow-inner`}>
                  {lecture.thumbnail}
                </div>

                <h3 className={`text-xs font-bold leading-tight mb-1 ${isActive ? 'text-violet-200' : 'text-slate-200 group-hover:text-white'}`}>
                  {lecture.title}
                </h3>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-2xs font-mono text-slate-500">{lecture.subject}</span>
                  <span className="text-2xs font-mono text-slate-600">{lecture.duration}</span>
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
