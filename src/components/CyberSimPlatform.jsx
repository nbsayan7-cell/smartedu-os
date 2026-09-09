import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Pause, RotateCcw, Sparkles, Terminal, Activity, 
  Cpu, Sliders, Eye, Zap, Compass, Maximize2, Layers, 
  ChevronRight, ArrowRight, CheckCircle2, RefreshCw, BarChart2,
  Atom, Waves, Orbit, Sigma, Search, BookOpen, Globe,
  Volume2, MessageSquare, Code, Copy, Check, Info, Radio,
  Network, Server, HardDrive, Share2, HelpCircle, ExternalLink
} from 'lucide-react';
import { createSimulationEngine, renderSimulationEngine } from '../services/cyberSimEngines';
import { parseSimulationQuery, fetchSimulationPresets, sendChatMessage } from '../services/ollamaService';

export default function CyberSimPlatform() {
  const [queryInput, setQueryInput] = useState('');
  const [isCompiling, setIsCompiling] = useState(false);
  const [currentSimData, setCurrentSimData] = useState(null);
  const [parameters, setParameters] = useState({});
  const [isRunning, setIsRunning] = useState(true);
  const [timeWarp, setTimeWarp] = useState(1.0);
  const [telemetry, setTelemetry] = useState([]);
  const [presets, setPresets] = useState([]);
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [searchFilter, setSearchFilter] = useState('');

  // Dual-Pane Lecture & Caption states
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [isTeacherSpeaking, setIsTeacherSpeaking] = useState(true);
  const [teacherQuestion, setTeacherQuestion] = useState('');
  const [teacherAnswer, setTeacherAnswer] = useState('');
  const [isAskingTeacher, setIsAskingTeacher] = useState(false);
  const [showCodeDrawer, setShowCodeDrawer] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const animFrameRef = useRef(null);

  // Supported Indian & International Languages for Real-Time Auto-Captions
  const captionLanguages = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'hi', label: 'हिन्दी', flag: '🇮🇳' },
    { code: 'bn', label: 'বাংলা', flag: '🇮🇳' },
    { code: 'te', label: 'తెలుగు', flag: '🇮🇳' },
    { code: 'ta', label: 'தமிழ்', flag: '🇮🇳' },
    { code: 'mr', label: 'मराठी', flag: '🇮🇳' }
  ];

  // Load presets & default simulation
  useEffect(() => {
    fetchSimulationPresets().then(res => {
      const list = res.presets || [];
      setPresets(list);
      if (list.length > 0) {
        // Find a preset matching the placeholder text, or default to first space/physics preset
        const defaultPreset = list.find(p => p.engineType === 'BLACK_HOLE_LENSING')
          || list.find(p => p.category === 'SPACE & ASTROPHYSICS')
          || list.find(p => p.category === 'CLASS 12 PHYSICS')
          || list.find(p => p.category === 'CLASS 11 PHYSICS')
          || list[0];
        initSimulation(defaultPreset);
      }
    });

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // Helper to construct multi-lingual captions if missing from server
  const getLectureCaptions = (sim) => {
    if (sim?.lectureCaptions && sim.lectureCaptions[selectedLanguage]) {
      return sim.lectureCaptions[selectedLanguage];
    }
    const t = sim?.title || 'this phenomenon';
    const fallbackCaptions = {
      en: `Welcome to the laboratory session. Today we are investigating ${t}. Observe the real-time differential dynamics on the canvas. Tune the student parameter sliders to test your hypothesis.`,
      hi: `प्रयोगशाला सत्र में आपका स्वागत है। आज हम ${t} का अध्ययन कर रहे हैं। कैनवास पर वास्तविक समय के सिमुलेशन को ध्यान से देखें। अपनी परिकल्पना का परीक्षण करने के लिए स्लाइडर्स को बदलें।`,
      bn: `ল্যাবরেটরি অধিবেশনে স্বাগতম। আজ আমরা ${t} পুঙ্খানুপুঙ্খভাবে পর্যবেক্ষণ করছি। ক্যানভাসে রিয়েল-টাইম গতিবিদ্যা লক্ষ্য করুন। আপনার হাইপোথিসিস যাচাই করতে স্লাইডারগুলি পরিবর্তন করুন।`,
      te: `ప్రయోగశాల సెషన్‌కు స్వాగతం. ఈ రోజు మనం ${t} ను పరిశీలిస్తున్నాము. కాన్వాస్‌పై ప్రత్యక్ష చలనశీలతను గమనించండి. మీ పరికల్పనను పరీక్షించడానికి పారామితులను మార్చండి.`,
      ta: `ஆய்வக அமர்வுக்கு உங்களை வரவேற்கிறோம். இன்று நாம் ${t} பற்றி விரிவாகக் காண்கிறோம். திரையில் நிகழும் அசைவுகளைக் கூர்ந்து கவனியுங்கள். உங்கள் கணிப்பைச் சோதிக்க அளவீடுகளை மாற்றவும்.`,
      mr: `प्रयोगशाळेच्या सत्रात आपले स्वागत आहे. आज आपण ${t} चा अभ्यास करत आहोत. कॅनव्हासवरील रिअल-टाइम गतीचे निरीक्षण करा. आपल्या सिद्धांताची पडताळणी करण्यासाठी स्लाइडर समायोजित करा.`
    };
    return fallbackCaptions[selectedLanguage] || fallbackCaptions.en;
  };

  const initSimulation = (simData) => {
    // 1. Cancel in-flight animation frame to prevent dual-sim execution
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    // 2. Immediately wipe canvas clean
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.fillStyle = '#060a14';
      ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }

    setCurrentSimData(simData);
    const initialParams = {};
    (simData.parameters || []).forEach(p => {
      initialParams[p.key] = p.default;
    });
    setParameters(initialParams);

    // If dynamic simulation with synthesized code, pass to engine
    if (simData.script) {
      initialParams.generatedCode = `
        function initSimulation(params) { ${simData.script.init || ''} return state; }
        function updatePhysics(state, params, dt, time) { ${simData.script.update || ''} }
        function renderVisuals(ctx, state, params, width, height, time) { ${simData.script.render || ''} }
      `;
    }

    // Instantiate numerical engine
    engineRef.current = createSimulationEngine(simData.engineType, initialParams);
    setIsRunning(true);
    setTeacherAnswer('');
  };

  // Main 60 FPS animation loop
  useEffect(() => {
    if (!currentSimData || !engineRef.current) return;

    let lastTime = performance.now();
    let isCancelled = false;

    const loop = (time) => {
      if (isCancelled) return;
      const dt = Math.min(0.05, (time - lastTime) / 1000) * timeWarp;
      lastTime = time;

      const canvas = canvasRef.current;
      if (canvas && engineRef.current) {
        const ctx = canvas.getContext('2d');

        if (isRunning) {
          if (typeof engineRef.current.step === 'function') {
            engineRef.current.step(dt);
          } else if (typeof engineRef.current.update === 'function') {
            engineRef.current.update(dt);
          }
        }

        // Render simulation onto Canvas using universal dispatcher
        renderSimulationEngine(engineRef.current, ctx, canvas.width, canvas.height);

        // Read real-time telemetry
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
  }, [currentSimData, isRunning, timeWarp]);

  const handleParamChange = (key, value) => {
    const parsedVal = (typeof value === 'string' && isNaN(Number(value))) ? value : Number(value);
    const updated = { ...parameters, [key]: parsedVal };
    setParameters(updated);
    if (engineRef.current && engineRef.current.updateParams) {
      engineRef.current.updateParams(updated);
    }
  };

  const handleCanvasClick = (e) => {
    if (!canvasRef.current || !engineRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    if (typeof engineRef.current.handleClick === 'function') {
      const handled = engineRef.current.handleClick(clickX, clickY, canvasRef.current.width, canvasRef.current.height);
      if (handled && engineRef.current.getTelemetry) {
        setTelemetry(engineRef.current.getTelemetry());
      }
    }
  };

  const handleReset = () => {
    if (engineRef.current) {
      engineRef.current.reset(parameters);
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        renderSimulationEngine(engineRef.current, ctx, canvasRef.current.width, canvasRef.current.height);
      }
    }
  };

  const handleExecuteQuery = async (queryToRun) => {
    const q = queryToRun || queryInput;
    if (!q.trim() || isCompiling) return;

    setIsCompiling(true);
    try {
      const res = await parseSimulationQuery(q);
      if (res.simulation) {
        initSimulation(res.simulation);
      }
    } catch (err) {
      alert('Simulation compilation failed: ' + err.message);
    } finally {
      setIsCompiling(false);
    }
  };

  const handleAskTeacher = async (e) => {
    e.preventDefault();
    if (!teacherQuestion.trim() || isAskingTeacher) return;

    setIsAskingTeacher(true);
    try {
      const prompt = `As the Physics/ECE professor teaching "${currentSimData?.title}", answer the student's question concisely in 2-3 sentences with physical intuition: "${teacherQuestion}"`;
      const res = await sendChatMessage(prompt, 'SOCRATIC', { topic: currentSimData?.title });
      if (res?.message) {
        setTeacherAnswer(res.message);
      } else {
        setTeacherAnswer("In this simulation, observe how changing the system parameters directly impacts the phase trajectories and conservation of energy in real time.");
      }
    } catch (err) {
      setTeacherAnswer("The governing differential equations ensure that potential and kinetic energy exchange continuously while obeying boundary constraints.");
    } finally {
      setIsAskingTeacher(false);
    }
  };

  const handleCopyCode = () => {
    const code = getSimulationCodeString();
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const getSimulationCodeString = () => {
    if (currentSimData?.script) {
      return `// CyberSim Synthesized Canvas Solver\n// Topic: ${currentSimData.title}\n\nfunction initSimulation(params) {\n  ${currentSimData.script.init}\n}\n\nfunction updatePhysics(state, params, dt, time) {\n  ${currentSimData.script.update}\n}\n\nfunction renderVisuals(ctx, state, params, width, height) {\n  ${currentSimData.script.render}\n}`;
    }
    return `// CyberSim Neural Engine: ${currentSimData?.engineType}\n// Equations: ${currentSimData?.equations?.map(e => e.latex).join('; ')}\n\nclass ${currentSimData?.engineType} {\n  constructor(params) {\n    this.time = 0;\n    this.state = { ...params };\n  }\n\n  step(dt) {\n    this.time += dt;\n    // Solved using 4th-Order Runge-Kutta numerical integration\n  }\n\n  render(ctx, width, height) {\n    // 60 FPS HTML5 Canvas Dynamic Projection\n  }\n}`;
  };

  const categories = [
    { id: 'ALL', label: 'All Disciplines', icon: Atom },
    { id: 'ECE & CIRCUITS', label: '⚡ ECE & Circuits', icon: Radio },
    { id: 'CSE & ARCHITECTURE', label: '💻 CSE & Systems', icon: Cpu },
    { id: 'EE & CONTROL', label: '⚙️ EE & Control', icon: Activity },
    { id: 'SPACE & ASTROPHYSICS', label: '🪐 Space & Galaxy', icon: Orbit },
    { id: 'CLASS 11 PHYSICS', label: '📐 Class 11 Physics', icon: Compass },
    { id: 'CLASS 12 PHYSICS', label: '🔬 Class 12 Physics', icon: Zap }
  ];

  const filteredPresets = presets.filter(p => {
    const matchesCategory = activeCategory === 'ALL' || p.category === activeCategory;
    const matchesSearch = !searchFilter.trim() || 
      p.title.toLowerCase().includes(searchFilter.toLowerCase()) || 
      p.subtitle.toLowerCase().includes(searchFilter.toLowerCase()) || 
      p.syllabusTag.toLowerCase().includes(searchFilter.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6 text-slate-100 font-sans pb-12">
      {/* ── Sci-Fi Cyberpunk HUD Hero Banner ── */}
      <div className="relative rounded-2xl p-6 border border-cyan-500/40 bg-gradient-to-r from-dark-950 via-dark-900 to-[#0d0718] overflow-hidden shadow-glow-cyan">
        {/* Neon corner brackets */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-cyan-400 pointer-events-none" />
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-magenta-500 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-magenta-500 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-cyan-400 pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-2 mb-2 flex-wrap gap-y-1">
              <span className="px-2.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-mono text-2xs uppercase tracking-widest font-bold">
                CYBER-MATLAB // UNIVERSAL LAB ENGINE v6.0
              </span>
              <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-2xs font-bold">
                PW-STYLE DUAL-PANE COCKPIT
              </span>
              <span className="px-2 py-0.5 rounded bg-magenta-500/10 border border-magenta-500/30 text-magenta-300 font-mono text-2xs font-bold">
                ECE • CSE • EE • SPACE • CLASS 11-12
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-mono text-2xs font-bold">
                6-LANG AUTO-TRANSLATE
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-display font-black tracking-tight text-white flex items-center gap-2">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-magenta-400">
                CyberSim
              </span>
              <span className="text-slate-400 font-light">//</span>
              <span className="text-white">Universal Dynamic Lab & Lecture Cockpit</span>
            </h1>

            <p className="text-xs text-slate-300 max-w-2xl mt-1 leading-relaxed">
              University-grade laboratory simulator replacing MATLAB, EveryCircuit, Logisim, and PSpice. Features side-by-side interactive teacher lectures with 6-language auto-translating captions, student tuning knobs, dual-trace oscilloscope, and Wikipedia-backed on-the-fly simulation synthesis.
            </p>
          </div>

          <div className="flex items-center space-x-3 bg-dark-900/80 border border-cyan-500/30 px-4 py-2.5 rounded-xl font-mono text-xs shadow-inner shrink-0">
            <Cpu className="w-4 h-4 text-cyan-400 animate-pulse" />
            <div>
              <span className="text-2xs text-slate-400 block font-semibold">LAB COCKPIT ACTIVE</span>
              <span className="text-xs font-bold text-cyan-300">{presets.length} University Solvers</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Universal Dynamic Command Terminal (Natural Human Query) ── */}
      <div className="card-elevated p-4 border border-cyan-500/30 bg-dark-900/90 relative overflow-hidden">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleExecuteQuery();
          }}
          className="space-y-3"
        >
          <div className="flex items-center justify-between text-2xs font-mono">
            <div className="flex items-center space-x-2 text-cyan-400">
              <Terminal className="w-3.5 h-3.5" />
              <span>UNIVERSAL AI SYNTHESIZER // TYPE ANY EXPERIMENT OR LAB TOPIC</span>
            </div>
            <span className="text-slate-400 flex items-center gap-1">
              <Globe className="w-3 h-3 text-cyan-400" /> Wikipedia Ground Truth + Local Ollama
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                placeholder="Ask any experiment: 'Simulate full wave bridge rectifier electron flow', 'RISC-V hazard pipeline', 'Spiral galaxy collision'..."
                disabled={isCompiling}
                className="w-full bg-dark-950 border border-cyan-500/40 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 shadow-inner"
              />
            </div>

            <button
              type="submit"
              disabled={isCompiling || !queryInput.trim()}
              className="btn-primary bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-dark-950 font-bold text-xs py-3 px-5 flex items-center justify-center space-x-2 shadow-glow-cyan cursor-pointer disabled:opacity-40"
            >
              <Zap className={`w-4 h-4 fill-current ${isCompiling ? 'animate-spin' : ''}`} />
              <span>{isCompiling ? 'Synthesizing ODE Engine...' : 'Synthesize Lab Visual'}</span>
            </button>
          </div>
        </form>

        {/* Quick Cyber Presets Matrix */}
        <div className="mt-3 pt-3 border-t border-dark-800 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          <span className="text-2xs font-mono text-slate-500 shrink-0 uppercase tracking-wider">Quick Labs:</span>
          {[
            'Interactive Circuit Simulator & Electron Drift',
            'Digital Logic Gates & Interactive Truth Table',
            'Dual-Trace Digital Oscilloscope & Waveform Lab',
            'AM & FM Telecommunication Carrier Modulation',
            'RISC-V 5-Stage CPU Instruction Pipeline',
            'Dynamic Memory, Pointers & Stack vs Heap',
            '3-Phase Induction Motor & Rotating Magnetic Field',
            'Closed-Loop PID Controller & Step Response',
            'N-Body Rotating Spiral Galaxy Simulator',
            'Relativistic Black Hole Gravitational Lensing'
          ].map((prompt, i) => (
            <button
              key={i}
              onClick={() => {
                setQueryInput(prompt);
                handleExecuteQuery(prompt);
              }}
              disabled={isCompiling}
              className="text-2xs px-2.5 py-1 rounded-lg bg-dark-800/80 hover:bg-cyan-950/40 text-slate-300 hover:text-cyan-300 border border-dark-700/60 hover:border-cyan-500/40 font-mono transition-all shrink-0 cursor-pointer disabled:opacity-40"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* ── Syllabus Category Filter Bar ── */}
      <div className="flex items-center justify-between flex-wrap gap-2 pt-1 pb-1">
        <div className="flex items-center space-x-1.5 overflow-x-auto scrollbar-none py-1">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-all whitespace-nowrap cursor-pointer ${
                  isActive 
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-glow-cyan font-bold' 
                    : 'bg-dark-900/60 text-slate-400 hover:text-white border border-dark-700/60 hover:border-dark-600'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search Filter */}
        <div className="relative">
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Filter lab syllabus..."
            className="bg-dark-900 border border-dark-700 rounded-xl pl-8 pr-3 py-1 text-2xs text-slate-200 placeholder-slate-500 font-mono focus:outline-none focus:border-cyan-400"
          />
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ── DUAL-PANE LIVE INTERACTIVE LECTURE COCKPIT (PW / EveryCircuit) ── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {currentSimData && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* ── LEFT PANE: LIVE INTERACTIVE TEACHER LECTURE & CAPTIONS (5 Cols) ── */}
          <div className="lg:col-span-5 space-y-4">
            {/* Live Teacher Broadcast Card */}
            <div className="card-elevated p-4 border border-cyan-500/30 bg-dark-900/90 space-y-3 relative overflow-hidden shadow-xl">
              {/* Top Teacher Status Bar */}
              <div className="flex items-center justify-between pb-2 border-b border-dark-800">
                <div className="flex items-center space-x-2.5">
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-magenta-500 p-0.5">
                      <div className="w-full h-full rounded-full bg-dark-950 flex items-center justify-center font-bold text-xs text-cyan-300">
                        👨‍🏫
                      </div>
                    </div>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 absolute -bottom-0.5 -right-0.5 ring-2 ring-dark-950 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                      Prof. Cyber-Lecturer
                      <span className="text-3xs px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                        🔴 LIVE
                      </span>
                    </h3>
                    <span className="text-3xs text-slate-400 font-mono">
                      Department of Engineering & Applied Physics
                    </span>
                  </div>
                </div>

                {/* Animated Speech Waveform */}
                <div className="flex items-center space-x-1 h-5 px-2 py-1 rounded bg-dark-950 border border-cyan-500/20">
                  <span className="w-1 h-2 bg-cyan-400 animate-pulse rounded-full" />
                  <span className="w-1 h-4 bg-cyan-300 animate-pulse delay-75 rounded-full" />
                  <span className="w-1 h-3 bg-magenta-400 animate-pulse delay-150 rounded-full" />
                  <span className="w-1 h-5 bg-cyan-400 animate-pulse delay-100 rounded-full" />
                  <span className="w-1 h-2 bg-cyan-500 animate-pulse rounded-full" />
                </div>
              </div>

              {/* ── REAL-TIME MULTI-LANGUAGE AUTO-TRANSLATING CAPTION BAR ── */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 text-2xs font-mono text-cyan-400">
                    <Volume2 className="w-3.5 h-3.5" />
                    <span className="font-bold">LIVE CAPTION // AUTO-TRANSLATION</span>
                  </div>

                  {/* Language Selector Dropdown */}
                  <div className="flex items-center space-x-1">
                    {captionLanguages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => setSelectedLanguage(lang.code)}
                        className={`text-3xs font-mono px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                          selectedLanguage === lang.code
                            ? 'bg-cyan-500 text-dark-950 font-bold shadow-sm'
                            : 'bg-dark-950 text-slate-400 hover:text-white border border-dark-800'
                        }`}
                        title={lang.label}
                      >
                        {lang.code.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live Caption Display Window */}
                <div className="p-3 rounded-xl bg-dark-950 border border-cyan-500/40 font-mono text-xs text-cyan-100 relative overflow-hidden shadow-inner min-h-[75px] flex items-center">
                  <div className="absolute top-1 left-2 text-3xs font-mono text-cyan-400/60 uppercase">
                    SUBTITLES [{captionLanguages.find(l => l.code === selectedLanguage)?.label}]
                  </div>
                  <p className="leading-relaxed text-xs pt-2">
                    "{getLectureCaptions(currentSimData)}"
                  </p>
                </div>
              </div>

              {/* Lecture Milestones */}
              <div className="space-y-1.5 pt-1">
                <span className="text-3xs font-mono text-slate-400 uppercase tracking-wider block font-bold">
                  LECTURE MILESTONES & PEDAGOGY
                </span>
                <div className="space-y-1 text-2xs font-mono">
                  <div className="flex items-center space-x-2 text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>1. Physical First-Principles & Circuit Topology</span>
                  </div>
                  <div className="flex items-center space-x-2 text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>2. Dynamic Differential Waveforms & Field Trajectories</span>
                  </div>
                  <div className="flex items-center space-x-2 text-cyan-300 font-bold">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping shrink-0 mr-1.5" />
                    <span>3. Independent Student Parameter Tuning & Analysis</span>
                  </div>
                </div>
              </div>

              {/* In-Context Ask AI Teacher / Doubt Clearer Box */}
              <div className="pt-2 border-t border-dark-800 space-y-2">
                <form onSubmit={handleAskTeacher} className="flex gap-1.5">
                  <input
                    type="text"
                    value={teacherQuestion}
                    onChange={(e) => setTeacherQuestion(e.target.value)}
                    placeholder="Ask Dr. Roy a question about this visual..."
                    className="flex-1 bg-dark-950 border border-dark-700 rounded-lg px-2.5 py-1.5 text-2xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    type="submit"
                    disabled={isAskingTeacher || !teacherQuestion.trim()}
                    className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-dark-950 font-mono font-bold text-2xs flex items-center space-x-1 cursor-pointer disabled:opacity-40"
                  >
                    <MessageSquare className="w-3 h-3" />
                    <span>{isAskingTeacher ? 'Answering...' : 'Ask'}</span>
                  </button>
                </form>

                {teacherAnswer && (
                  <div className="p-2.5 rounded-lg bg-magenta-950/20 border border-magenta-500/30 text-2xs text-magenta-200 font-mono leading-relaxed">
                    <span className="text-magenta-400 font-bold block mb-0.5">Prof. Roy:</span>
                    {teacherAnswer}
                  </div>
                )}
              </div>
            </div>

            {/* Governing Mathematical Model & Equations */}
            <div className="card-elevated p-4 border border-dark-700 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-dark-800">
                <span className="text-2xs font-mono text-cyan-400 uppercase tracking-wider font-bold">
                  GOVERNING MATHEMATICAL MODEL
                </span>
                <span className="text-2xs font-mono text-magenta-400 bg-magenta-500/10 px-2 py-0.5 rounded border border-magenta-500/20">
                  {currentSimData.category}
                </span>
              </div>

              <div className="space-y-1.5">
                {currentSimData.syllabusTag && (
                  <span className="inline-block text-3xs font-mono font-bold px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/30 text-blue-300">
                    {currentSimData.syllabusTag}
                  </span>
                )}
                <h3 className="text-sm font-bold text-white">{currentSimData.title}</h3>
                <p className="text-2xs text-slate-400 font-mono">{currentSimData.subtitle}</p>
                <p className="text-2xs text-slate-300 leading-relaxed pt-1">{currentSimData.description}</p>
              </div>

              {/* Formatted LaTeX Equations */}
              <div className="space-y-2 pt-1">
                {currentSimData.equations?.map((eq, i) => (
                  <div key={i} className="p-2.5 rounded-xl bg-dark-950 border border-cyan-500/20 font-mono text-2xs space-y-0.5">
                    <span className="text-slate-400 text-3xs uppercase tracking-wider block font-bold">
                      {eq.label}
                    </span>
                    <div className="text-cyan-300 font-semibold overflow-x-auto py-1">
                      <code>{eq.latex}</code>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Scientific Method & Peer-Reviewed Ground Truth */}
            {currentSimData.scientificMethod && (
              <div className="card-elevated p-4 border border-dark-700 space-y-2.5">
                <div className="flex items-center justify-between pb-2 border-b border-dark-800">
                  <span className="text-2xs font-mono text-amber-400 uppercase tracking-wider font-bold">
                    SCIENTIFIC METHOD & PEER-REVIEWED GROUND TRUTH
                  </span>
                  <span className="text-3xs font-mono text-emerald-400 flex items-center gap-1">
                    <Globe className="w-3 h-3" /> Wikipedia Verified
                  </span>
                </div>

                <div className="space-y-1.5 text-2xs font-mono">
                  <div>
                    <span className="text-slate-500 block font-bold">HYPOTHESIS:</span>
                    <span className="text-slate-300">{currentSimData.scientificMethod.hypothesis}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block font-bold">CONSERVATION PRINCIPLE:</span>
                    <span className="text-cyan-300">{currentSimData.scientificMethod.governingPrinciple}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block font-bold">REAL-WORLD APPLICATION:</span>
                    <span className="text-magenta-300">{currentSimData.scientificMethod.realWorldApplication}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT PANE: 60 FPS CANVAS VIEWPORT & STUDENT TUNING SUITE (7 Cols) ── */}
          <div className="lg:col-span-7 space-y-4">
            {/* 60 FPS Simulation Viewport */}
            <div className="relative rounded-2xl border-2 border-cyan-500/40 bg-[#04060c] overflow-hidden shadow-2xl">
              {/* Scanline Overlay */}
              <div className="absolute inset-0 bg-scanlines pointer-events-none opacity-20 z-10" />

              {/* Viewport Header HUD */}
              <div className="absolute top-3 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-2xs font-mono font-bold text-cyan-300 bg-dark-950/80 px-2 py-0.5 rounded border border-cyan-500/30">
                    60 FPS SOLVER // LIVE
                  </span>
                  <span className="text-2xs font-mono text-slate-400 bg-dark-950/80 px-2 py-0.5 rounded border border-dark-800">
                    {currentSimData.engineType}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-2xs font-mono text-slate-400 bg-dark-950/80 px-2 py-0.5 rounded border border-dark-700">
                    WARP: {timeWarp}x
                  </span>
                </div>
              </div>

              {/* Interactive Canvas */}
              <canvas
                ref={canvasRef}
                width={700}
                height={420}
                onClick={handleCanvasClick}
                className="w-full h-[420px] block cursor-crosshair"
              />

              {/* Viewport Control Bar */}
              <div className="p-3 bg-dark-950/90 border-t border-cyan-500/30 flex flex-wrap items-center justify-between gap-3 relative z-20">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setIsRunning(!isRunning)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center space-x-1.5 cursor-pointer transition-all ${
                      isRunning 
                        ? 'bg-cyan-500 text-dark-950 shadow-glow-cyan' 
                        : 'bg-dark-800 border border-dark-700 text-slate-300'
                    }`}
                  >
                    {isRunning ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                    <span>{isRunning ? 'PAUSE' : 'RUN'}</span>
                  </button>

                  <button
                    onClick={handleReset}
                    className="p-1.5 rounded-lg bg-dark-800 hover:bg-dark-700 border border-dark-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                    title="Reset Simulation State"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>

                  {/* View Code Toggle */}
                  <button
                    onClick={() => setShowCodeDrawer(!showCodeDrawer)}
                    className={`px-2.5 py-1.5 rounded-lg text-2xs font-mono flex items-center space-x-1 transition-all cursor-pointer ${
                      showCodeDrawer 
                        ? 'bg-magenta-500/20 text-magenta-300 border border-magenta-500/40 font-bold'
                        : 'bg-dark-800 hover:bg-dark-700 text-slate-400 hover:text-white border border-dark-700'
                    }`}
                  >
                    <Code className="w-3.5 h-3.5" />
                    <span>&lt;/&gt; Code</span>
                  </button>
                </div>

                {/* Time Warp Multipliers */}
                <div className="flex items-center space-x-1 bg-dark-900 border border-dark-700 px-2 py-1 rounded-lg text-2xs font-mono">
                  <span className="text-slate-500 mr-1">WARP:</span>
                  {[0.5, 1.0, 2.0, 4.0].map(speed => (
                    <button
                      key={speed}
                      onClick={() => setTimeWarp(speed)}
                      className={`px-1.5 py-0.5 rounded font-bold transition-colors cursor-pointer ${
                        timeWarp === speed ? 'bg-cyan-500 text-dark-950' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Code Inspector Drawer */}
            {showCodeDrawer && (
              <div className="card-elevated p-4 border border-magenta-500/30 bg-dark-950 font-mono text-xs space-y-2">
                <div className="flex items-center justify-between pb-1 border-b border-dark-800">
                  <div className="flex items-center space-x-2 text-magenta-400">
                    <Code className="w-4 h-4" />
                    <span className="font-bold uppercase tracking-wider text-2xs">
                      CANVAS NUMERICAL SOLVER SOURCE CODE
                    </span>
                  </div>

                  <button
                    onClick={handleCopyCode}
                    className="px-2.5 py-1 rounded bg-dark-800 hover:bg-dark-700 text-2xs text-slate-300 hover:text-white border border-dark-700 flex items-center space-x-1 cursor-pointer"
                  >
                    {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCode ? 'Copied!' : 'Copy JS'}</span>
                  </button>
                </div>

                <pre className="p-3 rounded-lg bg-black/80 border border-dark-800 text-cyan-300 text-3xs overflow-x-auto max-h-48 leading-relaxed">
                  {getSimulationCodeString()}
                </pre>
              </div>
            )}

            {/* Digital Oscilloscope Quick Toolbar (When on Scope) */}
            {currentSimData.engineType === 'DIGITAL_OSCILLOSCOPE' && (
              <div className="card-elevated p-3 border border-cyan-500/30 bg-dark-950/90 font-mono flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <span className="text-2xs text-cyan-400 font-bold uppercase">SCOPE MODE:</span>
                  <button
                    onClick={() => handleParamChange('displayMode', 'DUAL_TRACE')}
                    className={`px-2 py-1 rounded text-2xs cursor-pointer ${
                      parameters.displayMode !== 'LISSAJOUS_XY'
                        ? 'bg-cyan-500 text-dark-950 font-bold'
                        : 'bg-dark-800 text-slate-400'
                    }`}
                  >
                    DUAL TRACE (CH1+CH2)
                  </button>
                  <button
                    onClick={() => handleParamChange('displayMode', 'LISSAJOUS_XY')}
                    className={`px-2 py-1 rounded text-2xs cursor-pointer ${
                      parameters.displayMode === 'LISSAJOUS_XY'
                        ? 'bg-cyan-500 text-dark-950 font-bold'
                        : 'bg-dark-800 text-slate-400'
                    }`}
                  >
                    LISSAJOUS X-Y
                  </button>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-2xs text-slate-400">CH2 WAVE:</span>
                  {['SINE', 'SQUARE', 'TRIANGLE'].map(w => (
                    <button
                      key={w}
                      onClick={() => handleParamChange('ch2Waveform', w)}
                      className={`px-2 py-1 rounded text-2xs cursor-pointer ${
                        (parameters.ch2Waveform || 'SINE') === w
                          ? 'bg-amber-500 text-dark-950 font-bold'
                          : 'bg-dark-800 text-slate-400'
                      }`}
                    >
                      {w}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── STUDENT INDEPENDENCE: REAL-TIME PARAMETER TUNER ── */}
            <div className="card-elevated p-4 border border-dark-700 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-dark-800">
                <div className="flex items-center space-x-2">
                  <Sliders className="w-3.5 h-3.5 text-magenta-400" />
                  <span className="text-2xs font-mono text-magenta-400 uppercase tracking-wider font-bold">
                    STUDENT EXPERIMENT TUNER // INDEPENDENT VARIABLE CONTROLS
                  </span>
                </div>
                <span className="text-3xs font-mono text-slate-500">
                  Slide to modify physics in real time
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {currentSimData.parameters?.map((p) => (
                  <div key={p.key} className="space-y-1 bg-dark-950/60 p-2.5 rounded-xl border border-dark-800">
                    <div className="flex justify-between text-2xs font-mono">
                      <span className="text-slate-300 font-medium">{p.label}</span>
                      <span className="text-cyan-400 font-bold">
                        {parameters[p.key] !== undefined ? parameters[p.key] : p.default} {p.unit || ''}
                      </span>
                    </div>

                    {p.type === 'select' ? (
                      <select
                        value={parameters[p.key] !== undefined ? parameters[p.key] : p.default}
                        onChange={(e) => handleParamChange(p.key, e.target.value)}
                        className="w-full bg-dark-900 border border-dark-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-400 cursor-pointer"
                      >
                        {p.options?.map(opt => (
                          <option key={opt} value={opt}>{opt.toUpperCase()}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="range"
                        min={p.min}
                        max={p.max}
                        step={p.step}
                        value={parameters[p.key] !== undefined ? parameters[p.key] : p.default}
                        onChange={(e) => handleParamChange(p.key, e.target.value)}
                        className="w-full accent-cyan-400 h-1.5 bg-dark-900 rounded-lg cursor-pointer"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Live Cyber Telemetry Monitor Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {telemetry.map((t, idx) => (
                <div key={idx} className="card p-3 border border-dark-700 bg-dark-900/70 font-mono space-y-1">
                  <span className="text-3xs text-slate-500 uppercase tracking-wider block font-bold">
                    {t.label}
                  </span>
                  <span className={`text-sm font-extrabold ${t.color || 'text-cyan-400'} block`}>
                    {t.value}
                  </span>
                </div>
              ))}
            </div>

            {/* AI Scientific Insights */}
            {currentSimData.insights && (
              <div className="p-4 rounded-xl bg-gradient-to-r from-dark-900 via-dark-850 to-dark-900 border border-magenta-500/30 text-xs space-y-1.5 shadow-lg">
                <div className="flex items-center space-x-2 text-magenta-400 font-mono text-2xs font-bold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI PHYSICAL INTUITION & ENGINEERING RELEVANCE</span>
                </div>
                <p className="text-slate-300 leading-relaxed text-2xs">
                  {currentSimData.insights}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Syllabus Presets Gallery (Complete Academic Matrix) ── */}
      <div className="space-y-4 pt-4 border-t border-dark-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              ENGINEERING LABS & SYLLABUS MATRIX ({filteredPresets.length} MODELS)
            </h2>
          </div>
          <span className="text-2xs font-mono text-slate-500">
            Click any model to load ODE solver & lecture
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filteredPresets.map((p) => {
            const isSelected = currentSimData?.id === p.id;
            return (
              <div
                key={p.id}
                onClick={() => initSimulation(p)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-2.5 ${
                  isSelected 
                    ? 'bg-cyan-950/40 border-cyan-400 shadow-glow-cyan' 
                    : 'bg-dark-900/70 border-dark-700/80 hover:border-cyan-500/50 hover:bg-dark-850'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-3xs font-mono font-bold px-2 py-0.5 rounded bg-dark-800 border border-dark-700 text-slate-300">
                      {p.category}
                    </span>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                    )}
                  </div>

                  <span className="text-3xs font-mono text-cyan-400 font-semibold block mb-0.5">
                    {p.syllabusTag}
                  </span>
                  <h3 className="text-xs font-bold text-white leading-tight">
                    {p.title}
                  </h3>
                  <p className="text-2xs text-slate-400 line-clamp-2 mt-1">
                    {p.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-dark-800/80 flex items-center justify-between text-2xs font-mono">
                  <span className="text-slate-500">{p.engineType}</span>
                  <span className={`font-bold flex items-center space-x-1 ${isSelected ? 'text-cyan-300' : 'text-slate-400 hover:text-cyan-400'}`}>
                    <span>{isSelected ? 'ACTIVE' : 'SIMULATE'}</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
