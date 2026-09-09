import React from 'react';
import { WifiOff, Database, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';

export default function OfflineModeBar({ lowBandwidth }) {
  if (!lowBandwidth) return null;

  return (
    <div className="bg-amber-950/70 border-b border-amber-500/40 px-4 py-2 text-xs text-amber-200">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 font-mono">
        <div className="flex items-center space-x-2">
          <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong>Rural / Low-Bandwidth Mode Active:</strong> Heavy streaming video disabled. Graph DAG, text prompts, and interactive SVGs compressed.
          </span>
        </div>

        <div className="flex items-center space-x-4 text-[11px]">
          <span className="flex items-center space-x-1 text-emerald-300">
            <Database className="w-3.5 h-3.5" />
            <span>Local Cache Synced (2.4 MB)</span>
          </span>
          <span className="flex items-center space-x-1 text-amber-300">
            <Zap className="w-3.5 h-3.5" />
            <span>92% Data Saved</span>
          </span>
        </div>
      </div>
    </div>
  );
}
