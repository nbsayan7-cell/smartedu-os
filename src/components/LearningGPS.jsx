import React, { useState } from 'react';
import { 
  Compass, MapPin, Target, AlertCircle, ArrowRight, Clock, 
  Sparkles, RefreshCw, CheckCircle, Sliders, Zap, Route
} from 'lucide-react';

export const DAILY_PRESETS = {
  30: [
    { time: '8 min', title: 'Concept Visualization', desc: 'Step through hardware RAM cells and pointer addresses', type: 'VISUALIZE' },
    { time: '12 min', title: 'Socratic Inquiry', desc: 'Active dialogue without receiving direct answers', type: 'SOCRATIC' },
    { time: '10 min', title: 'Adaptive Practice', desc: '3 calibrated questions at latent ability boundary', type: 'PRACTICE' }
  ],
  45: [
    { time: '10 min', title: 'Memory Model Visualization', desc: 'Observe heap vs stack addresses and dereferencing', type: 'VISUALIZE' },
    { time: '15 min', title: 'Socratic Problem Solving', desc: 'Predict pointer outputs and explain mechanisms', type: 'SOCRATIC' },
    { time: '10 min', title: 'IRT Adaptive Testing', desc: '4 calibrated questions on pointer arithmetic', type: 'PRACTICE' },
    { time: '5 min', title: 'Spaced Retrieval Quiz', desc: 'Dynamic retrieval for fading memory representations', type: 'REVISION' },
    { time: '5 min', title: 'Confidence Calibration', desc: 'BKT slip/guess parameter calibration', type: 'CONFIDENCE' }
  ],
  90: [
    { time: '15 min', title: 'Deep Architecture Exploration', desc: 'Memory virtualization, alignment, and addressing', type: 'VISUALIZE' },
    { time: '20 min', title: 'Misconception Disproof', desc: 'Tackle dangling pointers, memory leaks, invalid free()', type: 'SOCRATIC' },
    { time: '15 min', title: 'High-Discrimination Set', desc: '6 challenging problems (discrimination a > 1.8)', type: 'PRACTICE' },
    { time: '30 min', title: 'Build & Prove Lab', desc: 'Implement custom memory pool slab allocator', type: 'PROVE' },
    { time: '10 min', title: 'Teach-Back Verification', desc: 'Explain concepts, AI evaluates clarity', type: 'TEACHBACK' }
  ]
};

export default function LearningGPS({ curriculumData, masteryState, onNavigateTo, onOpenVisualizer }) {
  const [dailyMinutes, setDailyMinutes] = useState(45);
  const [examDaysLeft, setExamDaysLeft] = useState(38);
  const [isRebalancing, setIsRebalancing] = useState(false);
  const [rebalanceNotification, setRebalanceNotification] = useState(null);

  const planSteps = DAILY_PRESETS[dailyMinutes] || DAILY_PRESETS[45];

  const handleSimulateMissedDay = () => {
    setIsRebalancing(true);
    setTimeout(() => {
      setExamDaysLeft(prev => Math.max(1, prev - 2));
      setRebalanceNotification("Smart Rebalancer: 2 missed days detected. Critical path compressed by 18% via topological pruning instead of doubling study hours.");
      setIsRebalancing(false);
    }, 1000);
  };

  const navCoords = [
    { icon: MapPin, label: 'WHERE AM I?', value: '54%', sub: 'Latent ability θ = -0.25', color: 'text-gps-400', bg: 'bg-gps-500/8', border: 'border-gps-500/20', progress: 54 },
    { icon: Target, label: 'WHERE TO GO?', value: `${examDaysLeft}d`, sub: 'Goal: >85% in CS201', color: 'text-emerald-400', bg: 'bg-emerald-500/8', border: 'border-emerald-500/20', progress: Math.max(10, 100 - examDaysLeft * 2) },
    { icon: AlertCircle, label: 'BLOCKING ME?', value: '38%', sub: 'Pointers → blocks Linked Lists', color: 'text-rose-400', bg: 'bg-rose-500/8', border: 'border-rose-500/20', progress: 38 },
    { icon: Route, label: 'NEXT ACTION?', value: `${dailyMinutes}m`, sub: 'Fix Pointers in 3 sprints', color: 'text-amber-400', bg: 'bg-amber-500/8', border: 'border-amber-500/20', progress: 70 },
  ];

  const stepActions = {
    VISUALIZE: { label: 'Launch', onClick: onOpenVisualizer, style: 'bg-gradient-to-r from-gps-500 to-gps-600 text-dark-900 shadow-glow-amber' },
    SOCRATIC: { label: 'Open Chat', onClick: () => onNavigateTo('tutor'), style: 'btn-ghost' },
    PRACTICE: { label: 'Start', onClick: () => onNavigateTo('practice'), style: 'btn-ghost' },
    PROVE: { label: 'Build', onClick: () => onNavigateTo('prove'), style: 'bg-gradient-to-r from-prove-500 to-prove-600 text-white shadow-glow-emerald' },
    REVISION: { label: 'Review', onClick: () => {}, style: 'btn-ghost' },
    TEACHBACK: { label: 'Explain', onClick: () => onNavigateTo('teachback'), style: 'btn-ghost' },
    CONFIDENCE: null,
  };

  return (
    <div className="space-y-5">
      {/* ── Hero ── */}
      <div className="hero-gps rounded-2xl p-6 border border-dark-700/50 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-72 h-72 bg-gps-400/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 relative z-10">
          <div>
            <span className="text-2xs font-mono text-gps-400/80 uppercase tracking-wider font-semibold">Dynamic Routing</span>
            <h1 className="text-xl sm:text-2xl font-display font-extrabold text-white">
              Learning <span className="text-gps-400">GPS</span>
            </h1>
            <p className="text-xs text-slate-400 max-w-lg mt-1">
              Solves four navigational coordinates: where you are, where to go, what's blocking you, and today's prescription.
            </p>
          </div>
          <button
            onClick={handleSimulateMissedDay}
            disabled={isRebalancing}
            className="btn-ghost shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-gps-400 ${isRebalancing ? 'animate-spin' : ''}`} />
            <span>Simulate Missed Days</span>
          </button>
        </div>
        {rebalanceNotification && (
          <div className="mt-4 p-3 rounded-xl bg-gps-500/8 border border-gps-500/20 flex items-start space-x-2 text-xs text-gps-300 animate-fade-in">
            <Sparkles className="w-4 h-4 text-gps-400 shrink-0 mt-0.5" />
            <p>{rebalanceNotification}</p>
          </div>
        )}
      </div>

      {/* ── Navigation Coordinates ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {navCoords.map((coord, i) => {
          const Icon = coord.icon;
          return (
            <div key={i} className={`card p-4 relative overflow-hidden`}>
              <div className="flex items-center space-x-1.5 mb-2">
                <Icon className={`w-3.5 h-3.5 ${coord.color}`} />
                <span className={`text-2xs font-mono font-semibold ${coord.color} uppercase tracking-wider`}>{coord.label}</span>
              </div>
              <p className="text-lg font-extrabold text-white font-mono">{coord.value}</p>
              <p className="text-2xs text-slate-500 mt-0.5 line-clamp-1">{coord.sub}</p>
              <div className="w-full bg-dark-900/50 rounded-full h-1 mt-3 overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-700 ${
                  coord.color.includes('rose') ? 'bg-rose-400' : 
                  coord.color.includes('emerald') ? 'bg-emerald-400' :
                  coord.color.includes('amber') ? 'bg-amber-400' : 'bg-gps-400'
                }`} style={{ width: `${coord.progress}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Daily Sprint Plan ── */}
      <div className="card-elevated p-5 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-dark-700/40">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Clock className="w-4 h-4 text-gps-400" />
              <span>Daily Study Prescription</span>
            </h3>
            <p className="text-2xs text-slate-500 mt-0.5">Evidence-based spaced retrieval (no marathon cramming)</p>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="text-2xs text-slate-500 mr-1 font-mono">Budget:</span>
            {[30, 45, 90].map((mins) => (
              <button
                key={mins}
                onClick={() => setDailyMinutes(mins)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                  dailyMinutes === mins
                    ? 'bg-gps-500 text-dark-900 shadow-md'
                    : 'bg-dark-800/60 text-slate-400 hover:bg-dark-700'
                }`}
              >
                {mins}m
              </button>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div className="relative pl-6">
          {/* Vertical line */}
          <div className="absolute left-[11px] top-2 bottom-2 w-px bg-gradient-to-b from-gps-500/40 via-gps-500/20 to-transparent" />

          <div className="space-y-3">
            {planSteps.map((step, idx) => {
              const action = stepActions[step.type];
              return (
                <div key={idx} className="relative flex items-start gap-4 group">
                  {/* Timeline dot */}
                  <div className="absolute -left-6 top-3 w-[22px] flex justify-center">
                    <div className={`w-2.5 h-2.5 rounded-full border-2 ${
                      idx === 0 ? 'border-gps-400 bg-gps-400/30' : 'border-dark-500 bg-dark-800'
                    } group-hover:border-gps-400 transition-colors`} />
                  </div>

                  <div className="flex-1 p-3.5 rounded-xl bg-dark-900/40 border border-dark-700/30 hover:border-gps-500/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="text-xs font-semibold text-white group-hover:text-gps-300 transition-colors">{step.title}</h4>
                        <span className="text-2xs font-mono font-semibold px-1.5 py-0.5 rounded bg-gps-500/10 text-gps-400 border border-gps-500/20">{step.time}</span>
                      </div>
                      <p className="text-2xs text-slate-500 mt-0.5">{step.desc}</p>
                    </div>
                    {action ? (
                      <button onClick={action.onClick} className={`btn-primary ${action.style} shrink-0 text-2xs px-3 py-1.5`}>
                        <span>{action.label}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    ) : step.type === 'CONFIDENCE' ? (
                      <span className="text-2xs font-mono text-emerald-400 flex items-center space-x-1">
                        <CheckCircle className="w-3 h-3" />
                        <span>Auto-Calibrated</span>
                      </span>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
