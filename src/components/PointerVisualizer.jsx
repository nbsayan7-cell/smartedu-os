import React, { useState } from 'react';
import { Play, RotateCcw, AlertOctagon, Sparkles, ArrowDown, HelpCircle } from 'lucide-react';

export default function PointerVisualizer({ onClose }) {
  const [step, setStep] = useState(1); // 1: int a, 2: int *p, 3: *p = 99, 4: p + 1
  const [errorSim, setErrorSim] = useState(null);

  const memoryCells = [
    { address: '0x7FFEE0', varName: 'score', val: step >= 3 ? 99 : 42, type: 'int (4B)', isTarget: true },
    { address: '0x7FFEE4', varName: step >= 2 ? 'ptr' : '(unallocated)', val: step >= 4 ? '0x7FFEE8' : (step >= 2 ? '0x7FFEE0' : 0), type: step >= 2 ? 'int* (8B)' : 'free', isPointer: step >= 2 },
    { address: '0x7FFEE8', varName: 'buffer[0]', val: 17, type: 'int (4B)', isNext: step >= 4 },
    { address: '0x7FFEEC', varName: 'buffer[1]', val: 34, type: 'int (4B)' }
  ];

  return (
    <div className="bg-dark-800 border border-dark-600 rounded-2xl p-6 shadow-2xl space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-dark-700">
        <div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 font-semibold border border-cyan-500/20">
            INTERACTIVE HARDWARE LAB
          </span>
          <h2 className="text-xl font-display font-extrabold text-white mt-1">
            C Memory &amp; Pointer Architecture Simulator
          </h2>
          <p className="text-xs text-slate-300">
            Understand pointers visually in RAM. See address indirection, type scaling, and dereferencing in real-time.
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-dark-700 text-slate-300 hover:text-white text-xs font-semibold"
          >
            Close Lab
          </button>
        )}
      </div>

      {/* Code Snippet & Step Tracker */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left: Code Sequence */}
        <div className="md:col-span-5 bg-dark-900 rounded-xl p-4 font-mono text-xs border border-dark-700 space-y-2 select-none">
          <p className="text-slate-500 text-[11px]">// Step-by-step memory execution</p>
          
          <div className={`p-2 rounded transition-all ${step === 1 ? 'bg-cyan-950/70 border border-cyan-500/50 text-cyan-300' : 'text-slate-400'}`}>
            <span className="text-slate-600 mr-2">1:</span>
            <span>int score = 42;</span>
          </div>

          <div className={`p-2 rounded transition-all ${step === 2 ? 'bg-cyan-950/70 border border-cyan-500/50 text-cyan-300' : 'text-slate-400'}`}>
            <span className="text-slate-600 mr-2">2:</span>
            <span>int *ptr = &amp;score;</span>
          </div>

          <div className={`p-2 rounded transition-all ${step === 3 ? 'bg-cyan-950/70 border border-cyan-500/50 text-cyan-300' : 'text-slate-400'}`}>
            <span className="text-slate-600 mr-2">3:</span>
            <span>*ptr = 99; // Dereference mutate</span>
          </div>

          <div className={`p-2 rounded transition-all ${step === 4 ? 'bg-cyan-950/70 border border-cyan-500/50 text-cyan-300' : 'text-slate-400'}`}>
            <span className="text-slate-600 mr-2">4:</span>
            <span>ptr = ptr + 1; // Scaled by 4 bytes!</span>
          </div>

          {/* Interactive Step Buttons */}
          <div className="pt-3 border-t border-dark-700 flex flex-wrap gap-2">
            <button
              onClick={() => { setStep(1); setErrorSim(null); }}
              className={`px-2.5 py-1 rounded text-xs cursor-pointer ${step === 1 ? 'bg-cyan-600 text-white' : 'bg-dark-700 text-slate-300'}`}
            >
              Step 1
            </button>
            <button
              onClick={() => { setStep(2); setErrorSim(null); }}
              className={`px-2.5 py-1 rounded text-xs cursor-pointer ${step === 2 ? 'bg-cyan-600 text-white' : 'bg-dark-700 text-slate-300'}`}
            >
              Step 2
            </button>
            <button
              onClick={() => { setStep(3); setErrorSim(null); }}
              className={`px-2.5 py-1 rounded text-xs cursor-pointer ${step === 3 ? 'bg-cyan-600 text-white' : 'bg-dark-700 text-slate-300'}`}
            >
              Step 3
            </button>
            <button
              onClick={() => { setStep(4); setErrorSim(null); }}
              className={`px-2.5 py-1 rounded text-xs cursor-pointer ${step === 4 ? 'bg-cyan-600 text-white' : 'bg-dark-700 text-slate-300'}`}
            >
              Step 4 (Arithmetic)
            </button>
          </div>

          <button
            onClick={() => setErrorSim("Segmentation Fault (SIGSEGV): Dereferenced NULL address 0x00000000!")}
            className="w-full mt-2 py-1.5 px-3 rounded-lg bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs hover:bg-rose-900/40 transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
          >
            <AlertOctagon className="w-3.5 h-3.5" />
            <span>Simulate NULL Dereference Crash</span>
          </button>
        </div>

        {/* Right: Interactive RAM Visualizer */}
        <div className="md:col-span-7 bg-dark-900 rounded-xl p-5 border border-dark-700 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 pb-2 border-b border-dark-700">
              <span>Physical RAM Address</span>
              <span>Variable Tag</span>
              <span>Memory Cell Contents</span>
            </div>

            {memoryCells.map((cell, idx) => {
              const isTargeted = step === 2 && cell.address === '0x7FFEE0';
              const isMutated = step === 3 && cell.address === '0x7FFEE0';
              const isPointedTo = step === 4 && cell.address === '0x7FFEE8';

              return (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border font-mono text-xs transition-all flex items-center justify-between ${
                    isMutated
                      ? 'bg-amber-950/40 border-amber-500/80 text-amber-200 ring-2 ring-amber-500/50'
                      : isTargeted
                      ? 'bg-cyan-950/40 border-cyan-500/80 text-cyan-200'
                      : isPointedTo
                      ? 'bg-indigo-950/40 border-indigo-500/80 text-indigo-200'
                      : 'bg-dark-800 border-dark-700 text-slate-300'
                  }`}
                >
                  <span className="font-semibold text-cyan-400">{cell.address}</span>
                  <span className="text-slate-400">{cell.varName} <span className="text-[10px] text-slate-500">({cell.type})</span></span>
                  <span className="font-bold text-white px-2 py-0.5 rounded bg-dark-900 border border-dark-600">
                    {cell.val}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Socratic Observation Prompt */}
          <div className="mt-4 p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/30 text-xs text-cyan-200 space-y-1">
            <div className="flex items-center space-x-1.5 font-bold">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Concept Doctor Insight:</span>
            </div>
            {step === 1 && <p>Variable <code>score</code> is assigned RAM cell <code>0x7FFEE0</code> holding value <code>42</code>.</p>}
            {step === 2 && <p>Pointer variable <code>ptr</code> lives at <code>0x7FFEE4</code> and stores the *hex address* <code>0x7FFEE0</code>.</p>}
            {step === 3 && <p>Executing <code>*ptr = 99</code> dereferences the pointer to write <code>99</code> into <code>score</code>'s memory cell directly!</p>}
            {step === 4 && <p>Notice: <code>ptr + 1</code> jumped by <strong>4 bytes</strong> to <code>0x7FFEE8</code>, NOT 1 byte! In C, pointer arithmetic is scaled by <code>sizeof(int)</code>.</p>}
          </div>

          {errorSim && (
            <div className="mt-2 p-2.5 rounded-lg bg-rose-500/20 border border-rose-500 text-xs text-rose-300 flex items-center space-x-2">
              <AlertOctagon className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorSim}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
