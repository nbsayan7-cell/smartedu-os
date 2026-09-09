import React from 'react';
import { 
  X, Cpu, Database, BarChart2, Shield, GitBranch, 
  Workflow, Sparkles, Globe, MessageSquare, Search,
  Box, Activity, CheckCircle2, AlertCircle, ExternalLink
} from 'lucide-react';

const PLUGINS = [
  { 
    name: 'Ollama', icon: Cpu, category: 'LLM Engine',
    desc: 'Local large language model inference', statusKey: 'ollama',
    color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20'
  },
  { 
    name: 'RAGFlow', icon: Database, category: 'Document RAG',
    desc: 'Syllabus & textbook retrieval-augmented generation', statusKey: 'ragflow',
    color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20'
  },
  { 
    name: 'Langfuse', icon: BarChart2, category: 'Observability',
    desc: 'LLM tracing, latency metrics & cost tracking', statusKey: 'langfuse',
    color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20'
  },
  { 
    name: 'CrewAI', icon: Activity, category: 'Multi-Agent',
    desc: 'Orchestrated tutor, evaluator & mentor agent crew', statusKey: 'crewai',
    color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20'
  },
  { 
    name: 'LangGraph', icon: Workflow, category: 'Workflow',
    desc: 'Stateful learning path workflow orchestration', statusKey: 'langgraph',
    color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20'
  },
  { 
    name: 'DSPy', icon: Sparkles, category: 'Prompt Optimization',
    desc: 'Automatic prompt tuning & compilation', statusKey: 'dspy',
    color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20'
  },
  { 
    name: 'Graphiti', icon: GitBranch, category: 'Knowledge Graph',
    desc: 'Temporal knowledge graph for prerequisite DAGs', statusKey: 'graphiti',
    color: 'text-teal-400', bg: 'bg-teal-500/10', border: 'border-teal-500/20'
  },
  { 
    name: 'Giskard', icon: Shield, category: 'AI Security',
    desc: 'Bias testing, hallucination detection & safety', statusKey: 'giskard',
    color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20'
  },
  { 
    name: 'Open WebUI', icon: Globe, category: 'Chat Interface',
    desc: 'Alternative conversational AI interface', statusKey: 'openWebUI',
    color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20'
  },
  { 
    name: 'Flowise', icon: Box, category: 'Visual Builder',
    desc: 'Drag-and-drop LLM workflow designer', statusKey: 'flowise',
    color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20'
  },
  { 
    name: 'Semgrep', icon: Search, category: 'Code Security',
    desc: 'Static analysis for student code submissions', statusKey: 'semgrep',
    color: 'text-lime-400', bg: 'bg-lime-500/10', border: 'border-lime-500/20'
  },
  { 
    name: 'Lobe Chat', icon: MessageSquare, category: 'Chat Framework',
    desc: 'Modern extensible chat UI framework', statusKey: 'lobeChat',
    color: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/20'
  },
];

function getStatusBadge(status) {
  if (!status) return { text: 'Not Configured', color: 'text-slate-500', dot: 'bg-slate-600' };
  if (status === 'ready') return { text: 'Ready', color: 'text-emerald-400', dot: 'bg-emerald-400' };
  if (status === 'mock') return { text: 'Simulated', color: 'text-amber-400', dot: 'bg-amber-400' };
  if (status === 'available') return { text: 'Available', color: 'text-blue-400', dot: 'bg-blue-400' };
  return { text: status, color: 'text-slate-400', dot: 'bg-slate-500' };
}

export default function AIStatusPanel({ isOpen, onClose, healthData }) {
  const ollamaConnected = healthData?.ollama?.connected;
  const models = healthData?.ollama?.models || [];
  const plugins = healthData?.plugins || {};

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      )}

      {/* Panel */}
      <div className={`fixed top-0 right-0 z-50 h-full w-full max-w-md bg-dark-900 border-l border-dark-700 shadow-2xl transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`} style={{ transitionTimingFunction: 'cubic-bezier(0.16,1,0.3,1)' }}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-dark-700">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center space-x-2">
                <Cpu className="w-4 h-4 text-blue-400" />
                <span>AI Infrastructure</span>
              </h2>
              <p className="text-2xs text-slate-500 mt-0.5 font-mono">
                {PLUGINS.length} plugins • {models.length} models loaded
              </p>
            </div>
            <button 
              onClick={onClose} 
              className="p-1.5 rounded-lg hover:bg-dark-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Ollama Section */}
          <div className="p-4 border-b border-dark-700/60">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-white">Ollama Engine</span>
              <span className={`flex items-center space-x-1.5 text-2xs font-mono ${ollamaConnected ? 'text-emerald-400' : 'text-amber-400'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${ollamaConnected ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                <span>{ollamaConnected ? 'Connected' : 'Offline — Fallback Mode'}</span>
              </span>
            </div>
            
            {models.length > 0 ? (
              <div className="space-y-1.5">
                {models.slice(0, 4).map((m, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-dark-800 border border-dark-700/50 text-2xs">
                    <span className="text-slate-200 font-mono font-medium">{m.name}</span>
                    <span className="text-slate-500">
                      {m.size ? `${(m.size / 1e9).toFixed(1)}GB` : ''}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-2xs text-slate-500 p-2 rounded-lg bg-dark-800 border border-dark-700/50">
                {ollamaConnected ? 'No models found. Run: ollama pull llama3.1:8b' : 'Start Ollama to enable real-time AI inference'}
              </p>
            )}
          </div>

          {/* Plugin Grid */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            <span className="text-2xs text-slate-500 font-semibold uppercase tracking-wider">Plugin Ecosystem</span>
            {PLUGINS.map((plugin) => {
              const Icon = plugin.icon;
              const status = plugin.statusKey === 'ollama' 
                ? (ollamaConnected ? 'ready' : undefined) 
                : plugins[plugin.statusKey]?.status;
              const badge = getStatusBadge(status);

              return (
                <div key={plugin.name} className="p-3 rounded-xl bg-dark-800/60 border border-dark-700/40 flex items-start space-x-3 hover:border-dark-600 transition-colors">
                  <div className={`w-8 h-8 rounded-lg ${plugin.bg} ${plugin.border} border flex items-center justify-center shrink-0`}>
                    <Icon className={`w-4 h-4 ${plugin.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white">{plugin.name}</span>
                      <span className={`flex items-center space-x-1 text-2xs font-mono ${badge.color}`}>
                        <span className={`w-1 h-1 rounded-full ${badge.dot}`} />
                        <span>{badge.text}</span>
                      </span>
                    </div>
                    <p className="text-2xs text-slate-500 mt-0.5 line-clamp-1">{plugin.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-dark-700 text-center">
            <p className="text-2xs text-slate-600 font-mono">
              SmartEdu OS AI Architecture • SIH 2026
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
