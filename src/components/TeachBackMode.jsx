import React, { useState } from 'react';
import { Mic, MicOff, Sparkles, CheckCircle2, AlertCircle, Award, RefreshCw, Cpu } from 'lucide-react';
import confetti from 'canvas-confetti';
import { evaluateTeachBack } from '../services/aiTutorEngine';
import { evaluateExplanation } from '../services/ollamaService';

export default function TeachBackMode({ currentConcept, onComplete, ollamaStatus }) {
  const [explanation, setExplanation] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState(null);

  const conceptId = currentConcept?.id || 'c_pointers';
  const conceptName = currentConcept?.name || 'Pointers in C';
  const isOnline = ollamaStatus?.ollama?.connected;
  const activeModel = ollamaStatus?.ollama?.models?.[0]?.name || 'llama3:latest';

  const handleToggleVoice = () => {
    if (!isRecording) {
      setIsRecording(true);
      setTimeout(() => {
        setExplanation(
          "A pointer is a variable that stores the physical memory address of another variable in RAM. When we declare int *p = &a, p holds the hex address of a. To change the value inside a, we dereference it using *p = 50. In C, pointer arithmetic scales by the sizeof the data type, so adding 1 jumps by 4 bytes for an integer."
        );
        setIsRecording(false);
      }, 2500);
    } else {
      setIsRecording(false);
    }
  };

  const handleEvaluate = async () => {
    if (!explanation.trim()) return;
    setIsEvaluating(true);

    if (isOnline) {
      try {
        const result = await evaluateExplanation(explanation, conceptName, activeModel);
        setEvaluation(result);
        if (result.totalScore >= 75) {
          confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
          if (onComplete) onComplete(result.totalScore);
        }
      } catch (err) {
        console.warn('Ollama evaluation failed, falling back to local heuristic:', err);
        const res = evaluateTeachBack(explanation, conceptId);
        setEvaluation(res);
        if (res.totalScore >= 75 && onComplete) onComplete(res.totalScore);
      }
    } else {
      const res = evaluateTeachBack(explanation, conceptId);
      setEvaluation(res);
      if (res.totalScore >= 75) {
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
        if (onComplete) onComplete(res.totalScore);
      }
    }
    setIsEvaluating(false);
  };

  return (
    <div className="space-y-5">
      {/* Hero */}
      <div className="hero-prove rounded-2xl p-6 border border-dark-700/50 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-prove-400/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-2 mb-1.5">
              <span className="text-2xs font-mono text-prove-400/80 uppercase tracking-wider font-semibold">Feynman Verification</span>
              <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-2xs font-mono ${
                isOnline ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                <span>{isOnline ? `Ollama Active (${activeModel})` : 'Offline Heuristic'}</span>
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-display font-extrabold text-white">
              Teach-Back <span className="text-prove-400">Mode</span>
            </h1>
            <p className="text-xs text-slate-400 max-w-lg mt-1">
              If you can't explain it simply, you haven't truly mastered it. Ollama evaluates your mental model against university rubrics.
            </p>
          </div>
          <button onClick={handleToggleVoice}
            className={`btn-primary shrink-0 ${isRecording ? 'bg-rose-600 text-white animate-pulse' : 'btn-ghost'}`}>
            {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5 text-prove-400" />}
            <span>{isRecording ? 'Listening...' : 'Voice Mode'}</span>
          </button>
        </div>
      </div>

      {/* Input */}
      <div className="card-elevated p-5 space-y-4">
        <label className="text-xs font-semibold text-slate-300 block">
          Explain: <span className="text-prove-400 font-mono">{conceptName}</span>
        </label>
        <textarea
          rows={5}
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          placeholder="Explain how this concept works in your own words..."
          className="w-full bg-dark-900/50 border border-dark-700/40 rounded-xl p-4 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-prove-500/50 font-sans leading-relaxed resize-none transition-colors"
        />
        <div className="flex items-center justify-between">
          <button onClick={() => setExplanation(
            "A pointer stores the memory address of another variable in RAM. We use & to get the address and * to dereference it. Pointer arithmetic increases by the sizeof the data type."
          )} className="text-2xs text-prove-400 hover:underline cursor-pointer">
            Insert Sample Explanation
          </button>
          <button onClick={handleEvaluate} disabled={!explanation.trim() || isEvaluating}
            className="btn-primary bg-gradient-to-r from-prove-500 to-prove-600 text-white shadow-glow-emerald disabled:opacity-50">
            {isEvaluating ? <><Sparkles className="w-3.5 h-3.5 animate-spin" /><span>Ollama Evaluating...</span></> : <><Sparkles className="w-3.5 h-3.5" /><span>Evaluate with Ollama</span></>}
          </button>
        </div>
      </div>

      {/* Results */}
      {evaluation && (
        <div className="card-elevated p-5 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-dark-700/40">
            <div className="flex items-center space-x-2">
              <Award className="w-5 h-5 text-gps-400" />
              <span className="text-sm font-bold text-white">
                Score: <span className="text-prove-400 font-mono">{evaluation.totalScore}/100</span>
                <span className="text-slate-400 ml-2 text-xs">({evaluation.grade})</span>
              </span>
            </div>
            {evaluation.aiGenerated && (
              <span className="text-2xs font-mono text-prove-400 bg-prove-500/10 px-2 py-0.5 rounded border border-prove-500/20 flex items-center space-x-1">
                <Cpu className="w-3 h-3 text-prove-400" />
                <span>Ollama {evaluation.model || activeModel}</span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">{evaluation.feedback}</p>
          {evaluation.rubrics && evaluation.rubrics.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {evaluation.rubrics.map((r, i) => (
                <div key={i} className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
                  r.passed ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200' : 'bg-dark-800/40 border-dark-700/40 text-slate-400'
                }`}>
                  <div className="flex items-center space-x-2">
                    {r.passed ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 text-slate-500 shrink-0" />}
                    <span className="text-2xs">{r.name}</span>
                  </div>
                  <span className="font-mono text-2xs font-bold">{r.passed ? `+${r.weight}` : '0'}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
