import React, { useState } from 'react';
import { Briefcase, ArrowRight, DollarSign, TrendingUp } from 'lucide-react';
import { CAREER_ROLES } from '../data/careerPathways';

function RadarChart({ skills, masteryState }) {
  const cx = 120, cy = 120, r = 90;
  const n = skills.length;
  if (n < 3) return null;

  const angleStep = (2 * Math.PI) / n;
  const levels = [0.25, 0.5, 0.75, 1.0];

  const getPoint = (index, ratio) => ({
    x: cx + r * ratio * Math.cos(angleStep * index - Math.PI / 2),
    y: cy + r * ratio * Math.sin(angleStep * index - Math.PI / 2)
  });

  const studentPoints = skills.map((skill, i) => {
    const mastery = (masteryState[skill.academicSource]?.mastery ?? 45) / 100;
    return getPoint(i, Math.min(1, mastery));
  });

  const requiredPoints = skills.map((skill, i) => {
    return getPoint(i, skill.requiredLevel / 100);
  });

  return (
    <svg viewBox="0 0 240 240" className="w-full max-w-[220px] mx-auto">
      {/* Grid circles */}
      {levels.map(l => (
        <polygon key={l}
          points={skills.map((_, i) => { const p = getPoint(i, l); return `${p.x},${p.y}`; }).join(' ')}
          fill="none" stroke="rgba(99,102,241,0.1)" strokeWidth="0.5"
        />
      ))}
      {/* Axis lines */}
      {skills.map((_, i) => {
        const p = getPoint(i, 1);
        return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="rgba(99,102,241,0.1)" strokeWidth="0.5" />;
      })}
      {/* Required area */}
      <polygon
        points={requiredPoints.map(p => `${p.x},${p.y}`).join(' ')}
        fill="rgba(244,63,94,0.06)" stroke="rgba(244,63,94,0.3)" strokeWidth="1" strokeDasharray="3 2"
      />
      {/* Student area */}
      <polygon
        points={studentPoints.map(p => `${p.x},${p.y}`).join(' ')}
        fill="rgba(59,130,246,0.12)" stroke="#3b82f6" strokeWidth="1.5"
      />
      {/* Data points */}
      {studentPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill="#3b82f6" stroke="#0d1117" strokeWidth="1.5" />
      ))}
      {/* Labels */}
      {skills.map((skill, i) => {
        const p = getPoint(i, 1.18);
        return (
          <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="central"
            className="fill-slate-500 text-[7px] font-mono">{skill.name.split(' ')[0]}</text>
        );
      })}
    </svg>
  );
}

export default function CareerSkillTwin({ masteryState, onNavigateTo }) {
  const [selectedRole, setSelectedRole] = useState(CAREER_ROLES[0]);

  const calculateRoleMatch = (role) => {
    let total = 0;
    role.requiredSkills.forEach(skill => {
      const score = masteryState[skill.academicSource]?.mastery ?? 45;
      total += Math.min(1.0, score / skill.requiredLevel) * 100;
    });
    return Math.round(total / role.requiredSkills.length);
  };

  const matchPercent = calculateRoleMatch(selectedRole);

  return (
    <div className="space-y-5">
      {/* Hero */}
      <div className="hero-career rounded-2xl p-6 border border-dark-700/50 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-career-400/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div>
            <span className="text-2xs font-mono text-career-400/80 uppercase tracking-wider font-semibold">Industry Alignment</span>
            <h1 className="text-xl sm:text-2xl font-display font-extrabold text-white">
              Career Skill <span className="text-career-400">Twin</span>
            </h1>
            <p className="text-xs text-slate-400 max-w-lg mt-1">
              Connects coursework directly to high-paying engineering roles. See how mastery unlocks job competencies.
            </p>
          </div>
          <div className="flex items-center space-x-2 bg-dark-900/50 border border-dark-700/40 px-4 py-2.5 rounded-xl font-mono text-xs">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <div>
              <p className="text-2xs text-slate-500">Target</p>
              <p className="text-xs font-bold text-emerald-300">{selectedRole.targetSalaries}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Role Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {CAREER_ROLES.map((role) => {
          const match = calculateRoleMatch(role);
          const isSelected = selectedRole.id === role.id;
          return (
            <button key={role.id} onClick={() => setSelectedRole(role)}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer space-y-3 ${
                isSelected
                  ? 'bg-career-glow border-career-500/60 shadow-glow-rose ring-1 ring-career-500/20'
                  : 'card-interactive'
              }`}>
              <div className="flex items-center justify-between">
                <span className="text-2xs font-mono px-1.5 py-0.5 rounded bg-dark-900/50 text-slate-400 font-semibold border border-dark-700/40">{role.primaryLanguage}</span>
                <span className="text-xs font-mono font-bold text-career-400">{match}%</span>
              </div>
              <h3 className="text-xs font-bold text-white">{role.title}</h3>
              <p className="text-2xs text-slate-500 line-clamp-2">{role.description}</p>
              <div className="w-full bg-dark-900/50 rounded-full h-1 overflow-hidden">
                <div className="bg-career-400 h-full rounded-full transition-all duration-500" style={{ width: `${match}%` }} />
              </div>
            </button>
          );
        })}
      </div>

      {/* Skill Breakdown */}
      <div className="card-elevated p-5 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-dark-700/40">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Briefcase className="w-4 h-4 text-career-400" />
              <span>{selectedRole.title} — Competencies</span>
            </h3>
            <p className="text-2xs text-slate-500 mt-0.5">Mapped to syllabus modules</p>
          </div>
          <span className="text-2xs font-mono text-career-400 font-semibold bg-career-500/10 px-2.5 py-1 rounded-lg border border-career-500/20">
            Demand: {selectedRole.demandLevel}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Radar */}
          <div className="lg:col-span-4 flex items-center justify-center p-4">
            <RadarChart skills={selectedRole.requiredSkills} masteryState={masteryState} />
          </div>

          {/* Skill list */}
          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-3">
            {selectedRole.requiredSkills.map((skill, idx) => {
              const studentMastery = masteryState[skill.academicSource]?.mastery ?? 45;
              const isQualified = studentMastery >= skill.requiredLevel;
              return (
                <div key={idx} className="p-3.5 rounded-xl bg-dark-900/40 border border-dark-700/30 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-xs font-semibold text-white">{skill.name}</h4>
                      <p className="text-2xs font-mono text-slate-500 mt-0.5">{skill.academicSource}</p>
                    </div>
                    <span className={`text-2xs font-mono font-bold ${isQualified ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {studentMastery}/{skill.requiredLevel}%
                    </span>
                  </div>
                  <div className="w-full bg-dark-800/50 rounded-full h-1 overflow-hidden">
                    <div className={`h-full rounded-full ${isQualified ? 'bg-emerald-400' : 'bg-amber-400'}`}
                      style={{ width: `${Math.min(100, (studentMastery / skill.requiredLevel) * 100)}%` }} />
                  </div>
                  <div className="flex items-center justify-between text-2xs">
                    <span className={isQualified ? 'text-emerald-300' : 'text-amber-300'}>
                      {isQualified ? '✓ Met' : `↑ Need +${skill.requiredLevel - studentMastery}%`}
                    </span>
                    {!isQualified && (
                      <button onClick={() => onNavigateTo('gps')} className="text-career-400 hover:underline cursor-pointer">Add to GPS →</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Capstone */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-prove-500/8 via-dark-900/50 to-dark-900/50 border border-prove-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-2xs font-mono px-2 py-0.5 rounded bg-prove-500/15 text-prove-300 font-semibold">Capstone</span>
            <h4 className="text-xs font-bold text-white mt-1">{selectedRole.proofProject.title}</h4>
            <p className="text-2xs text-slate-400 mt-0.5">Proves <strong>{selectedRole.proofProject.badgeName}</strong></p>
          </div>
          <button onClick={() => onNavigateTo('prove')} className="btn-primary bg-gradient-to-r from-prove-500 to-prove-600 text-white shadow-glow-emerald shrink-0">
            <span>Project Lab</span><ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
