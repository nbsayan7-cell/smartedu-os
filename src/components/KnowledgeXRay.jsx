import React, { useState } from 'react';
import { 
  AlertTriangle, CheckCircle2, Upload, Sparkles, ArrowRight, 
  Stethoscope, ChevronRight, Filter, Zap, TrendingUp
} from 'lucide-react';
import { SAMPLE_SYLLABI } from '../data/curriculumSyllabi';
import { 
  getPrerequisiteAncestors, findPrerequisiteBottlenecks, calculatePrerequisiteHealth 
} from '../services/graphAlgorithms';

export default function KnowledgeXRay({ 
  curriculumData, masteryState, onSelectConcept, onStartDiagnostic, onNavigateTo 
}) {
  const [selectedNodeId, setSelectedNodeId] = useState('c_pointers');
  const [isUploading, setIsUploading] = useState(false);
  const [activeFilter, setActiveFilter] = useState('ALL');

  const nodes = curriculumData.nodes || [];
  const selectedNode = nodes.find(n => n.id === selectedNodeId) || nodes[0];
  const bottlenecks = findPrerequisiteBottlenecks(nodes, masteryState);
  const prereqHealth = selectedNode ? calculatePrerequisiteHealth(selectedNode.id, nodes, masteryState) : { healthIndex: 100, isBlocked: false };

  const getNodeStatus = (node) => {
    const mastery = masteryState[node.id]?.mastery ?? node.initialMastery ?? 0;
    const health = calculatePrerequisiteHealth(node.id, nodes, masteryState);
    if (health.isBlocked && mastery < 50) return 'BLOCKED';
    if (mastery >= 75) return 'MASTERED';
    if (mastery < 50) return 'BOTTLENECK';
    return 'IN_PROGRESS';
  };

  const filteredNodes = nodes.filter(n => {
    if (activeFilter === 'ALL') return true;
    return getNodeStatus(n) === activeFilter;
  });

  const handleSyllabusUpload = () => {
    setIsUploading(true);
    setTimeout(() => setIsUploading(false), 1200);
  };

  const overallMastery = Math.round(
    nodes.reduce((sum, n) => sum + (masteryState[n.id]?.mastery ?? n.initialMastery ?? 0), 0) / nodes.length
  );

  return (
    <div className="space-y-5">
      {/* ── Hero ── */}
      <div className="hero-xray rounded-2xl p-6 border border-dark-700/50 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-xray-400/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-2xs font-mono text-xray-400/80 uppercase tracking-wider font-semibold">Prerequisite Engine</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-display font-extrabold text-white">
              Knowledge <span className="text-xray-400">X-Ray</span>
            </h1>
            <p className="text-xs text-slate-400 max-w-lg mt-1">
              Maps syllabus into an explicit prerequisite DAG, surfacing hidden root-causes behind exam failures.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {/* Overall Progress Ring */}
            <div className="relative w-14 h-14 shrink-0">
              <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                <circle cx="28" cy="28" r="24" fill="none" stroke="rgba(59,130,246,0.1)" strokeWidth="4" />
                <circle cx="28" cy="28" r="24" fill="none" stroke="#3b82f6" strokeWidth="4" 
                  strokeLinecap="round"
                  strokeDasharray={`${overallMastery * 1.508} 150.8`}
                  className="transition-all duration-700"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-mono font-bold text-xray-400">{overallMastery}%</span>
              </div>
            </div>

            <button
              onClick={handleSyllabusUpload}
              disabled={isUploading}
              className="btn-primary bg-gradient-to-r from-xray-500 to-xray-600 text-white shadow-glow-blue"
            >
              {isUploading ? (
                <><Sparkles className="w-3.5 h-3.5 animate-spin" /><span>Parsing...</span></>
              ) : (
                <><Upload className="w-3.5 h-3.5" /><span>Upload Syllabus</span></>
              )}
            </button>
          </div>
        </div>

        {/* Bottleneck alert */}
        {bottlenecks.length > 0 && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/8 border border-rose-500/25 flex items-center justify-between text-xs text-rose-300">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>
                <strong>{bottlenecks[0].name}</strong> ({bottlenecks[0].currentMastery}%) blocks {bottlenecks[0].dependentsCount} topics
              </span>
            </div>
            <button
              onClick={() => { setSelectedNodeId(bottlenecks[0].id); onSelectConcept(bottlenecks[0]); }}
              className="px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-200 font-semibold shrink-0 cursor-pointer text-2xs ml-2 transition-colors"
            >
              Inspect
            </button>
          </div>
        )}
      </div>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Graph Canvas */}
        <div className="lg:col-span-8 card-elevated p-4 flex flex-col">
          <div className="flex items-center justify-between mb-3 pb-3 border-b border-dark-700/50">
            <div>
              <h3 className="text-xs font-semibold text-white">Concept DAG</h3>
              <p className="text-2xs text-slate-500 mt-0.5">{nodes.length} nodes • Click to inspect</p>
            </div>
            <div className="flex items-center space-x-1">
              {['ALL', 'BOTTLENECK', 'IN_PROGRESS', 'MASTERED'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-2 py-1 rounded-md text-2xs font-medium transition-colors cursor-pointer ${
                    activeFilter === filter
                      ? 'bg-xray-500/15 text-xray-300 border border-xray-500/30'
                      : 'text-slate-500 hover:text-slate-300 bg-dark-800/40'
                  }`}
                >
                  {filter === 'ALL' ? 'All' : filter === 'BOTTLENECK' ? 'Gaps' : filter === 'IN_PROGRESS' ? 'Active' : 'Done'}
                </button>
              ))}
            </div>
          </div>

          {/* Graph */}
          <div className="relative w-full h-[400px] bg-dark-900/50 rounded-xl border border-dark-700/40 overflow-hidden select-none">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#3b82f6_0.5px,transparent_0.5px)] [background-size:20px_20px]" />

            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <defs>
                <marker id="arrow" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#3b82f6" opacity="0.6" />
                </marker>
                <marker id="arrow-red" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#f43f5e" opacity="0.6" />
                </marker>
              </defs>
              {nodes.map(node => 
                node.prerequisites?.map(prereqId => {
                  const prereqNode = nodes.find(n => n.id === prereqId);
                  if (!prereqNode) return null;
                  const isBlocked = (masteryState[prereqId]?.mastery ?? prereqNode.initialMastery) < 50;
                  return (
                    <line key={`${prereqId}-${node.id}`}
                      x1={prereqNode.x + 80} y1={prereqNode.y + 25}
                      x2={node.x + 10} y2={node.y + 25}
                      stroke={isBlocked ? '#f43f5e' : '#3b82f6'}
                      strokeWidth={isBlocked ? 1.5 : 1}
                      strokeDasharray={isBlocked ? '4 3' : 'none'}
                      markerEnd={isBlocked ? 'url(#arrow-red)' : 'url(#arrow)'}
                      opacity={0.5}
                    />
                  );
                })
              )}
            </svg>

            {filteredNodes.map(node => {
              const mastery = masteryState[node.id]?.mastery ?? node.initialMastery ?? 0;
              const status = getNodeStatus(node);
              const isSelected = selectedNodeId === node.id;

              const statusStyles = {
                BOTTLENECK: 'border-rose-500/60 bg-rose-950/30 text-rose-300',
                MASTERED: 'border-emerald-500/60 bg-emerald-950/30 text-emerald-300',
                BLOCKED: 'border-amber-500/50 bg-amber-950/25 text-amber-300',
                IN_PROGRESS: 'border-xray-500/50 bg-xray-glow text-xray-300',
              };

              return (
                <div
                  key={node.id}
                  onClick={() => { setSelectedNodeId(node.id); onSelectConcept(node); }}
                  style={{ left: `${node.x}px`, top: `${node.y}px` }}
                  className={`absolute z-10 w-40 p-2.5 rounded-xl border backdrop-blur-sm cursor-pointer 
                    transition-all duration-200 hover:scale-[1.03] hover:shadow-elevation-2
                    ${statusStyles[status] || statusStyles.IN_PROGRESS}
                    ${isSelected ? 'ring-2 ring-xray-400/60 shadow-glow-blue' : ''}
                    ${status === 'BOTTLENECK' ? 'animate-glow-pulse' : ''}
                  `}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-2xs font-mono px-1.5 py-0.5 rounded bg-black/30 font-semibold">{node.category}</span>
                    <span className="text-2xs font-mono font-bold">{mastery}%</span>
                  </div>
                  <p className="text-2xs font-semibold text-white line-clamp-1">{node.name}</p>
                  <div className="w-full bg-dark-900/60 rounded-full h-1 mt-1.5 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${
                        mastery >= 75 ? 'bg-emerald-400' : mastery < 50 ? 'bg-rose-400' : 'bg-xray-400'
                      }`}
                      style={{ width: `${mastery}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 pt-3 text-2xs text-slate-500">
            {[
              { color: 'bg-emerald-400', label: 'Mastered ≥75%' },
              { color: 'bg-xray-400', label: 'In Progress' },
              { color: 'bg-rose-400', label: 'Bottleneck <50%' },
              { color: 'bg-amber-400', label: 'Blocked' },
            ].map(item => (
              <span key={item.label} className="flex items-center space-x-1.5">
                <span className={`w-2 h-2 rounded-full ${item.color}`} />
                <span>{item.label}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Detail Panel */}
        {selectedNode && (
          <div className="lg:col-span-4 card-elevated p-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-2xs font-mono px-2 py-0.5 rounded-md bg-xray-500/10 text-xray-400 font-semibold border border-xray-500/20">
                    {selectedNode.category}
                  </span>
                  <h3 className="text-sm font-bold text-white mt-1.5">{selectedNode.name}</h3>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-extrabold text-xray-400 font-mono">
                    {masteryState[selectedNode.id]?.mastery ?? selectedNode.initialMastery}%
                  </span>
                  <p className="text-2xs text-slate-500">Mastery</p>
                </div>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed bg-dark-900/40 p-3 rounded-xl border border-dark-700/40">
                {selectedNode.summary}
              </p>

              {/* Health */}
              <div className="p-3 rounded-xl bg-dark-900/40 border border-dark-700/40 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center space-x-1.5">
                    <Stethoscope className="w-3.5 h-3.5 text-xray-400" />
                    <span>Prereq Health</span>
                  </span>
                  <span className={`font-mono font-bold ${prereqHealth.healthIndex >= 70 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {prereqHealth.healthIndex}%
                  </span>
                </div>
                {prereqHealth.isBlocked && (
                  <div className="p-2 rounded-lg bg-rose-500/8 border border-rose-500/20 text-2xs text-rose-300">
                    ⚠️ Gaps: {prereqHealth.weakPrereqs.map(p => `${p.name} (${p.mastery}%)`).join(', ')}
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-xl bg-dark-900/40 border border-dark-700/40 text-center">
                  <p className="text-2xs text-slate-500">Exam Weight</p>
                  <p className="text-sm font-bold text-white mt-0.5">{selectedNode.examWeight}%</p>
                </div>
                <div className="p-2.5 rounded-xl bg-dark-900/40 border border-dark-700/40 text-center">
                  <p className="text-2xs text-slate-500">Industry Need</p>
                  <p className="text-sm font-bold text-emerald-400 mt-0.5">Critical</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-4 mt-4 border-t border-dark-700/40">
              <button
                onClick={() => onStartDiagnostic(selectedNode)}
                className="w-full btn-primary bg-gradient-to-r from-xray-500 to-xray-600 text-white shadow-glow-blue"
              >
                <span>Quick Diagnostic</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onNavigateTo('tutor')}
                className="w-full btn-ghost"
              >
                <span>Socratic Coach</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
