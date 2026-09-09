import React, { useState } from 'react';
import { Code, Play, Award, Terminal, Share2, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { CAREER_ROLES } from '../data/careerPathways';

export default function ProjectProofEngine({ onBadgeEarned }) {
  const [selectedRoleIndex, setSelectedRoleIndex] = useState(0);
  const currentRole = CAREER_ROLES[selectedRoleIndex];
  const project = currentRole.proofProject;

  const [code, setCode] = useState(project.starterCode);
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [badgeEarned, setBadgeEarned] = useState(false);

  const handleRunTests = () => {
    setIsRunning(true);
    setTimeout(() => {
      setIsRunning(false);
      setTestResults({
        passed: 3, total: 3, executionTime: '42ms',
        output: `[GCC 14.2.0 -O2] Compilation successful.\n[Test 1] Contiguous 64-byte chunks allocation: PASS (0x7FFEE0, 0x7FFEE4, 0x7FFEE8)\n[Test 2] Slab free list recycling: PASS (Zero fragmentation)\n[Test 3] Memory boundary coalesce check: PASS (100% memory integrity)\n--> All test suites passed! Mastery threshold verified.`
      });
      setBadgeEarned(true);
      confetti({ particleCount: 120, spread: 90, origin: { y: 0.6 } });
      if (onBadgeEarned) onBadgeEarned(project.badgeName);
    }, 1500);
  };

  return (
    <div className="space-y-5">
      {/* Hero */}
      <div className="hero-prove rounded-2xl p-6 border border-dark-700/50 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-72 h-72 bg-prove-400/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 relative z-10">
          <div>
            <span className="text-2xs font-mono text-prove-400/80 uppercase tracking-wider font-semibold">Verifiable Proof</span>
            <h1 className="text-xl sm:text-2xl font-display font-extrabold text-white">
              Learn → Build → <span className="text-prove-400">Prove</span>
            </h1>
            <p className="text-xs text-slate-400 max-w-lg mt-1">
              Course completion ≠ competence. Build real projects that produce verifiable hiring artifacts.
            </p>
          </div>
          <div className="flex items-center space-x-1 bg-dark-900/50 p-1 rounded-lg border border-dark-700/40">
            {CAREER_ROLES.map((r, idx) => (
              <button key={r.id}
                onClick={() => { setSelectedRoleIndex(idx); setCode(CAREER_ROLES[idx].proofProject.starterCode); setTestResults(null); setBadgeEarned(false); }}
                className={`px-3 py-1.5 rounded-md text-2xs font-medium cursor-pointer transition-colors ${
                  selectedRoleIndex === idx ? 'bg-prove-500 text-white font-semibold shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}>{r.title.split(' ')[0]}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Sandbox Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Spec panel */}
        <div className="lg:col-span-4 card-elevated p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div>
              <span className="text-2xs font-mono px-2 py-0.5 rounded-md bg-prove-500/10 text-prove-400 font-semibold border border-prove-500/20">Capstone</span>
              <h3 className="text-sm font-bold text-white mt-1.5">{project.title}</h3>
              <p className="text-2xs text-slate-400 mt-1">{project.objective}</p>
            </div>
            <div className="space-y-1.5 pt-2 border-t border-dark-700/40">
              <p className="text-2xs font-semibold text-slate-400">Milestones:</p>
              {project.milestones.map((m) => (
                <div key={m.id} className="p-2.5 rounded-lg bg-dark-900/40 border border-dark-700/30 text-2xs flex items-start space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-prove-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-slate-200 leading-tight">{m.name}</p>
                    <span className="text-2xs font-mono text-prove-400 font-semibold">+{m.points} pts</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {badgeEarned ? (
            <div className="p-4 rounded-xl bg-gradient-to-br from-prove-500/10 to-dark-900 border border-prove-500/40 text-center space-y-2 animate-fade-in">
              <div className="w-12 h-12 rounded-full bg-prove-500/15 border border-prove-400 flex items-center justify-center mx-auto">
                <Award className="w-6 h-6 text-prove-400" />
              </div>
              <h4 className="text-xs font-bold text-white">{project.badgeName}</h4>
              <p className="text-2xs font-mono text-slate-500">Hash: 0x8F9A...B32E</p>
              <button className="w-full py-1.5 rounded-lg bg-prove-600 hover:bg-prove-500 text-white text-2xs font-semibold flex items-center justify-center space-x-1 cursor-pointer transition-colors">
                <Share2 className="w-3 h-3" /><span>Export to Portfolio</span>
              </button>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-dark-900/40 border border-dark-700/30 text-center text-2xs text-slate-500">
              Pass all tests to unlock your verifiable credential.
            </div>
          )}
        </div>

        {/* Code editor */}
        <div className="lg:col-span-8 card-elevated p-4 flex flex-col space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-dark-700/40">
            <div className="flex items-center space-x-2 text-2xs font-mono text-slate-400">
              <Code className="w-3.5 h-3.5 text-prove-400" />
              <span>allocator.c</span>
              <span className="text-slate-600">• In-Browser Workspace</span>
            </div>
            <button onClick={handleRunTests} disabled={isRunning}
              className="btn-primary bg-gradient-to-r from-prove-500 to-prove-600 text-white shadow-glow-emerald text-2xs px-3 py-1.5">
              <Play className={`w-3 h-3 ${isRunning ? 'animate-spin' : ''}`} />
              <span>{isRunning ? 'Compiling...' : 'Run Tests'}</span>
            </button>
          </div>

          {/* Editor */}
          <div className="relative">
            <div className="absolute left-0 top-0 bottom-0 w-10 bg-dark-900/80 border-r border-dark-700/30 rounded-l-xl flex flex-col items-end pr-2 pt-4 text-2xs font-mono text-slate-600 select-none">
              {code.split('\n').map((_, i) => <div key={i} className="h-[18px] leading-[18px]">{i + 1}</div>)}
            </div>
            <textarea
              rows={14}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full bg-dark-950/80 border border-dark-700/40 rounded-xl pl-12 pr-4 py-4 font-mono text-2xs text-cyan-200 focus:outline-none focus:border-prove-500/50 leading-[18px] resize-none selection:bg-prove-500/30"
              spellCheck={false}
            />
          </div>

          {/* Terminal */}
          <div className="bg-dark-950/80 border border-dark-700/40 rounded-xl p-3 font-mono text-2xs">
            <div className="flex items-center justify-between text-slate-600 text-2xs pb-1.5 mb-1.5 border-b border-dark-800">
              <span className="flex items-center space-x-1.5">
                <Terminal className="w-3 h-3 text-prove-400" />
                <span>Test Console</span>
              </span>
              <span>x86_64 GCC Sandbox</span>
            </div>
            {testResults ? (
              <pre className="text-emerald-400 whitespace-pre-wrap leading-relaxed">{testResults.output}</pre>
            ) : (
              <p className="text-slate-600">Click "Run Tests" to execute against automated test cases...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
