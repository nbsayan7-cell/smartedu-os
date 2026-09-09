import React, { useState } from 'react';
import { Target, CheckCircle2, XCircle, ArrowRight, Sparkles, TrendingUp, Stethoscope, Eye } from 'lucide-react';
import { updateBKT, updateTheta, calculate2PLProbability } from '../services/bktEngine';

export default function AdaptivePractice({ currentConcept, masteryState, onMasteryUpdate, onOpenVisualizer, onNavigateTo }) {
  const node = currentConcept || {
    id: 'c_pointers', name: 'Pointers & Dereferencing in C',
    diagnosticQuestion: {
      question: 'Given: int a = 20; int *p = &a; *p = 50; What is the value of variable a?',
      options: ['20', '50', 'Address of a in RAM', 'Segmentation fault crash'],
      correctIndex: 1, difficulty: 0.2, discrimination: 1.8,
      misconceptionNote: 'Dereferencing *p = 50 writes directly to the memory address stored in p, mutating variable a.'
    }
  };

  const q = node.diagnosticQuestion;
  const [selectedOpt, setSelectedOpt] = useState(null);
  const [confidence, setConfidence] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [bktResult, setBktResult] = useState(null);
  const [theta, setTheta] = useState(-0.25);

  const currentPL = (masteryState[node.id]?.mastery ?? node.initialMastery ?? 40) / 100;

  const handleSubmit = () => {
    if (selectedOpt === null) return;
    const isCorrect = selectedOpt === q.correctIndex;
    const result = updateBKT(currentPL, isCorrect, confidence);
    const newTheta = updateTheta(theta, isCorrect, q.difficulty, q.discrimination);
    setBktResult(result);
    setTheta(newTheta);
    setSubmitted(true);
    if (onMasteryUpdate) onMasteryUpdate(node.id, result.newMastery);
  };

  const handleNext = () => { setSelectedOpt(null); setSubmitted(false); setBktResult(null); };

  return (
    <div className="space-y-5">
      {/* ── Hero ── */}
      <div className="hero-practice rounded-2xl p-6 border border-dark-700/50 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-practice-400/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div>
            <span className="text-2xs font-mono text-practice-400/80 uppercase tracking-wider font-semibold">Cognitive Psychometrics</span>
            <h1 className="text-xl sm:text-2xl font-display font-extrabold text-white">
              Adaptive <span className="text-practice-400">Practice</span>
            </h1>
            <p className="text-xs text-slate-400 max-w-lg mt-1">
              Questions adapt to your latent ability boundary (θ). BKT state updates in real-time.
            </p>
          </div>

          {/* Live psychometrics */}
          <div className="flex items-center space-x-4 bg-dark-900/60 border border-dark-700/40 px-4 py-2.5 rounded-xl font-mono text-xs">
            <div>
              <p className="text-2xs text-slate-500">θ (Ability)</p>
              <p className="text-sm font-bold text-practice-400">{theta >= 0 ? `+${theta}` : theta}</p>
            </div>
            <div className="w-px h-8 bg-dark-700/50" />
            <div>
              <p className="text-2xs text-slate-500">P(L_t)</p>
              <p className="text-sm font-bold text-emerald-400">{Math.round(currentPL * 100)}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Question Card ── */}
      <div className="card-elevated p-6 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-dark-700/40 text-xs font-mono">
          <div className="flex items-center space-x-2">
            <Target className="w-4 h-4 text-practice-400" />
            <span className="text-white font-semibold">{node.name}</span>
          </div>
          <div className="flex items-center space-x-3 text-slate-500 text-2xs">
            <span>b: <code className="text-practice-300 font-bold">{q.difficulty}</code></span>
            <span>a: <code className="text-practice-300 font-bold">{q.discrimination}</code></span>
          </div>
        </div>

        <div className="text-sm font-semibold text-white leading-relaxed">{q.question}</div>

        {/* Options */}
        <div className="grid grid-cols-1 gap-2.5">
          {q.options.map((opt, idx) => {
            const isSelected = selectedOpt === idx;
            const isCorrect = idx === q.correctIndex;
            let style = 'border-dark-700/50 bg-dark-900/40 hover:border-practice-500/30 text-slate-200';
            if (submitted) {
              if (isCorrect) style = 'border-emerald-500/60 bg-emerald-950/25 text-emerald-200 ring-1 ring-emerald-500/40';
              else if (isSelected) style = 'border-rose-500/60 bg-rose-950/25 text-rose-200 ring-1 ring-rose-500/40';
            } else if (isSelected) {
              style = 'border-practice-500/60 bg-practice-glow text-practice-200 ring-1 ring-practice-500/40';
            }
            return (
              <button key={idx} disabled={submitted} onClick={() => setSelectedOpt(idx)}
                className={`p-3.5 rounded-xl border text-left text-xs font-medium transition-all cursor-pointer flex items-center justify-between ${style}`}>
                <div className="flex items-center space-x-3">
                  <span className="w-6 h-6 rounded-md bg-dark-800/60 border border-dark-700/50 flex items-center justify-center font-mono font-bold text-2xs text-slate-400">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span>{opt}</span>
                </div>
                {submitted && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                {submitted && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-rose-400" />}
              </button>
            );
          })}
        </div>

        {/* Confidence */}
        {!submitted && (
          <div className="pt-3 border-t border-dark-700/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-2xs text-slate-400 flex items-center space-x-1.5">
              <Sparkles className="w-3 h-3 text-practice-400" />
              <span>Confidence (calibrates slip/guess):</span>
            </span>
            <div className="flex items-center space-x-1.5">
              {[{ val: 0, label: 'Guessing' }, { val: 1, label: 'Medium' }, { val: 2, label: 'Certain' }].map(c => (
                <button key={c.val} onClick={() => setConfidence(c.val)}
                  className={`px-3 py-1.5 rounded-lg text-2xs font-medium cursor-pointer transition-colors ${
                    confidence === c.val ? 'bg-practice-500 text-white font-semibold' : 'bg-dark-800/60 text-slate-400 hover:bg-dark-700'
                  }`}>{c.label}</button>
              ))}
            </div>
          </div>
        )}

        {/* Submit / Results */}
        {!submitted ? (
          <button onClick={handleSubmit} disabled={selectedOpt === null}
            className={`w-full btn-primary ${selectedOpt !== null ? 'bg-gradient-to-r from-practice-500 to-practice-600 text-white shadow-glow-teal' : 'bg-dark-700 text-slate-500 cursor-not-allowed'}`}>
            <span>Submit & Update Mastery Model</span>
          </button>
        ) : (
          <div className="space-y-3 animate-fade-in">
            <div className={`p-4 rounded-xl border text-xs leading-relaxed ${
              bktResult.isMisconception ? 'bg-rose-950/25 border-rose-500/40 text-rose-200'
                : selectedOpt === q.correctIndex ? 'bg-emerald-950/25 border-emerald-500/40 text-emerald-200'
                : 'bg-amber-950/25 border-amber-500/40 text-amber-200'
            }`}>
              <div className="flex items-center justify-between pb-2 border-b border-white/10 font-semibold mb-2 text-2xs">
                <span className="flex items-center space-x-1.5 font-mono">
                  {bktResult.isMisconception ? <Stethoscope className="w-3.5 h-3.5 text-rose-400" /> : <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />}
                  <span>{bktResult.isMisconception ? 'Misconception Flagged' : 'Bayesian Update Complete'}</span>
                </span>
                <span className="font-mono">Δ {bktResult.cognitiveDelta >= 0 ? `+${bktResult.cognitiveDelta}%` : `${bktResult.cognitiveDelta}%`}</span>
              </div>
              <p>{q.misconceptionNote}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={handleNext} className="flex-1 btn-primary bg-gradient-to-r from-practice-500 to-practice-600 text-white shadow-glow-teal">
                <span>Continue</span><ArrowRight className="w-3.5 h-3.5" />
              </button>
              {onNavigateTo && (
                <button 
                  onClick={() => onNavigateTo('tutor')} 
                  className="btn-ghost text-tutor-300 hover:text-white border border-tutor-500/30 bg-tutor-500/10 flex items-center space-x-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-tutor-400" />
                  <span>Ask AI Coach</span>
                </button>
              )}
              <button onClick={onOpenVisualizer} className="btn-ghost">
                <Eye className="w-3.5 h-3.5" /><span>Visualize</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
