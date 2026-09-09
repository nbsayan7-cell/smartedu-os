import React, { useState, useEffect } from 'react';
import { Heart, Coffee, Play, Pause } from 'lucide-react';

export default function DigitalWellbeing() {
  const [seconds, setSeconds] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    let interval = null;
    if (isActive && seconds > 0) {
      interval = setInterval(() => setSeconds(s => s - 1), 1000);
    } else if (seconds === 0) {
      setIsActive(false);
    }
    return () => clearInterval(interval);
  }, [isActive, seconds]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progress = ((25 * 60 - seconds) / (25 * 60)) * 100;

  return (
    <div className="card p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="flex items-center space-x-3">
        <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
          <Heart className="w-4 h-4 text-rose-400" />
        </div>
        <div>
          <h4 className="text-xs font-semibold text-white">Cognitive Wellbeing</h4>
          <p className="text-2xs text-slate-500">Progress by mastery, not screen hours</p>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        {/* Mini progress ring */}
        <div className="relative w-10 h-10">
          <svg className="w-10 h-10 -rotate-90" viewBox="0 0 40 40">
            <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(244,63,94,0.1)" strokeWidth="3" />
            <circle cx="20" cy="20" r="16" fill="none" stroke="#f43f5e" strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${progress * 1.005} 100.5`}
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xs font-mono font-bold text-rose-300">{formatTime(seconds)}</span>
          </div>
        </div>

        <button onClick={() => setIsActive(!isActive)}
          className={`p-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            isActive ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25' : 'bg-rose-500/15 text-rose-400 border border-rose-500/25'
          }`}>
          {isActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
        </button>

        <button onClick={() => { setSeconds(5 * 60); setIsActive(true); }}
          className="p-2 rounded-lg bg-dark-800/60 border border-dark-700/40 text-slate-400 hover:text-amber-400 transition-colors cursor-pointer" title="5m Rest Break">
          <Coffee className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
