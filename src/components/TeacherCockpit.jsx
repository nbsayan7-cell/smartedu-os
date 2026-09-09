import React, { useState, useEffect } from 'react';
import { 
  Users, AlertTriangle, TrendingDown, Stethoscope, Lightbulb, 
  BarChart2, FileText, Sparkles, CheckCircle2, Play, 
  Calendar, Check, Send, Download, Cpu
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { fetchDocuments, generateQuizFromDocument } from '../services/ollamaService';

export default function TeacherCockpit({ onNavigateTo }) {
  const [activeTab, setActiveTab] = useState('misconceptions');
  const [documents, setDocuments] = useState([]);
  const [selectedDocId, setSelectedDocId] = useState('');
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [deployed, setDeployed] = useState(false);

  const cohortStats = {
    totalStudents: 68, avgMastery: 58, atRiskCount: 14,
    bottleneckTopic: 'Pointers & Dereferencing', misconceptionPct: 62,
    cohortAttendance: 91.8
  };

  useEffect(() => {
    fetchDocuments().then(data => {
      const docs = data.documents || [];
      setDocuments(docs);
      if (docs.length > 0) setSelectedDocId(docs[0].id);
    });
  }, []);

  const handleGenerateClassQuiz = async () => {
    if (!selectedDocId) return;
    setGeneratingQuiz(true);
    setDeployed(false);

    try {
      const res = await generateQuizFromDocument(selectedDocId, 3);
      setGeneratedQuestions(res.questions || []);
      confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
    } catch (err) {
      alert('Quiz generation failed: ' + err.message);
    } finally {
      setGeneratingQuiz(false);
    }
  };

  const handleDeploySprint = () => {
    setDeployed(true);
    setTimeout(() => setDeployed(false), 5000);
  };

  const commonMisconceptions = [
    { topic: 'Pointers in C', misconception: 'Pointer arithmetic increments hex address by 1 byte instead of sizeof(type)', affectedStudents: 42, severity: 'Critical', suggestedIntervention: 'Demonstrate hardware RAM visualizer with 4-byte integer boundary stepping.' },
    { topic: 'Single-Slit Optics', misconception: 'Confusing central diffraction maximum (m=0) with double-slit interference minima', affectedStudents: 29, severity: 'High', suggestedIntervention: 'Run interactive wave sinc² superposition simulator.' },
    { topic: 'Dynamic Memory', misconception: 'Assuming free(ptr) zeroes memory contents immediately', affectedStudents: 26, severity: 'Medium', suggestedIntervention: 'Live terminal demonstration of dangling pointer exploit.' }
  ];

  const atRiskStudents = [
    { name: 'Aarav Patel', roll: '21CS014', mastery: '34%', blockedBy: 'Memory Architecture', phi: '28%', attendance: '88%' },
    { name: 'Priya Sharma', roll: '21CS042', mastery: '38%', blockedBy: 'Pointer Indirection', phi: '35%', attendance: '92%' },
    { name: 'Kavita Nair', roll: '21CS061', mastery: '41%', blockedBy: 'Variable Data Widths', phi: '40%', attendance: '85%' }
  ];

  const metrics = [
    { label: 'Class Mastery', value: `${cohortStats.avgMastery}%`, sub: 'BKT Calibrated', icon: BarChart2, color: 'text-teacher-400' },
    { label: 'At-Risk', value: `${cohortStats.atRiskCount}`, sub: 'Prereq blocked', icon: AlertTriangle, color: 'text-rose-400' },
    { label: 'Attendance', value: `${cohortStats.cohortAttendance}%`, sub: 'Verified Logins', icon: Calendar, color: 'text-emerald-400' },
    { label: 'Misconception', value: `${cohortStats.misconceptionPct}%`, sub: 'High-confidence errors', icon: TrendingDown, color: 'text-violet-400' },
  ];

  return (
    <div className="space-y-5">
      {/* Hero */}
      <div className="hero-teacher rounded-2xl p-6 border border-dark-700/50 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-teacher-400/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-2 mb-1.5">
              <span className="text-2xs font-mono text-teacher-400/80 uppercase tracking-wider font-semibold">
                Educator Diagnostic & Workflow Hub
              </span>
              <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-mono text-2xs font-semibold">
                SIH 26207 Feature
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-display font-extrabold text-white">
              Teacher <span className="text-teacher-400">Cockpit</span>
            </h1>
            <p className="text-xs text-slate-400 max-w-lg mt-1">
              Automated quiz creation, instant AI grading, and cognitive bottleneck diagnosis without surveillance.
            </p>
          </div>
          <div className="bg-dark-900/50 border border-dark-700/40 px-4 py-2.5 rounded-xl font-mono text-xs">
            <p className="text-2xs text-slate-500">Cohort Active</p>
            <p className="text-xs font-bold text-white">CS201 Sec B • {cohortStats.totalStudents} Students</p>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {metrics.map((m, i) => {
          const Icon = m.icon;
          return (
            <div key={i} className="card p-4 animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xs text-slate-500">{m.label}</span>
                <Icon className={`w-3.5 h-3.5 ${m.color}`} />
              </div>
              <p className="text-lg font-extrabold font-mono text-white">{m.value}</p>
              <p className="text-2xs text-slate-600 mt-0.5">{m.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Sub-nav Tabs */}
      <div className="flex space-x-2 border-b border-dark-800 pb-2">
        {[
          { id: 'misconceptions', label: 'Misconception Radar' },
          { id: 'auto-quiz', label: 'Automated Quiz Creator (AI)' },
          { id: 'at-risk', label: 'At-Risk & Attendance' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === tab.id
                ? 'bg-teacher-500/20 text-teacher-300 border border-teacher-500/40'
                : 'text-slate-400 hover:text-white hover:bg-dark-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab 1: Misconception Radar ── */}
      {activeTab === 'misconceptions' && (
        <div className="card-elevated p-5 space-y-3 animate-fade-in">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <Stethoscope className="w-4 h-4 text-teacher-400" />
            <span>Misconception Heatmap</span>
          </h3>

          <div className="space-y-2.5">
            {commonMisconceptions.map((m, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-dark-900/40 border border-dark-700/30 hover:border-teacher-500/30 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-white">{m.topic}</span>
                    <span className={`text-2xs font-mono px-1.5 py-0.5 rounded font-semibold ${
                      m.severity === 'Critical' ? 'bg-rose-500/15 text-rose-300 border border-rose-500/20' : 'bg-amber-500/15 text-amber-300 border border-amber-500/20'
                    }`}>{m.severity} • {m.affectedStudents} affected</span>
                  </div>
                  <p className="text-2xs text-slate-400"><strong className="text-slate-500">Flaw:</strong> {m.misconception}</p>
                  <p className="text-2xs text-teacher-300 flex items-center space-x-1 pt-0.5">
                    <Lightbulb className="w-3 h-3 text-teacher-400 shrink-0" />
                    <span><strong>Action:</strong> {m.suggestedIntervention}</span>
                  </p>
                </div>
                <button 
                  onClick={handleDeploySprint}
                  className="btn-primary bg-gradient-to-r from-teacher-500 to-teacher-600 text-white shadow-glow-indigo shrink-0 text-2xs px-3 py-1.5 cursor-pointer"
                >
                  <span>Send Adaptive Sprint</span>
                </button>
              </div>
            ))}
          </div>

          {deployed && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Remediation micro-quiz pushed to 42 affected students' dashboards!</span>
            </div>
          )}
        </div>
      )}

      {/* ── Tab 2: Automated Quiz Creator (From Uploaded Document) ── */}
      {activeTab === 'auto-quiz' && (
        <div className="card-elevated p-5 space-y-4 animate-fade-in">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-teacher-400" />
              <span>Automated 2PL-IRT Quiz Creator from Course Materials</span>
            </h3>
            <p className="text-2xs text-slate-400 mt-0.5">
              Select an uploaded PDF syllabus or textbook to automatically generate university-grade adaptive quizzes using Ollama.
            </p>
          </div>

          {/* Doc selector */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <select
              value={selectedDocId}
              onChange={(e) => setSelectedDocId(e.target.value)}
              className="flex-1 bg-dark-800 border border-dark-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teacher-500"
            >
              {documents.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title} ({d.originalName})
                </option>
              ))}
            </select>

            <button
              onClick={handleGenerateClassQuiz}
              disabled={generatingQuiz || !selectedDocId}
              className="btn-primary bg-gradient-to-r from-teacher-500 to-teacher-600 text-white shadow-glow-indigo text-xs py-2 px-4 flex items-center justify-center space-x-2 shrink-0 cursor-pointer disabled:opacity-50"
            >
              <Cpu className={`w-3.5 h-3.5 ${generatingQuiz ? 'animate-spin' : ''}`} />
              <span>{generatingQuiz ? 'Ollama Generating Quiz...' : 'Generate 2PL-IRT Quiz'}</span>
            </button>
          </div>

          {/* Generated Questions Preview */}
          {generatedQuestions.length > 0 && (
            <div className="space-y-3 pt-3 border-t border-dark-700">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">
                  Generated Questions ({generatedQuestions.length})
                </span>
                <button
                  onClick={handleDeploySprint}
                  className="btn-primary bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-3 py-1.5 flex items-center space-x-1.5 cursor-pointer"
                >
                  <Send className="w-3 h-3" />
                  <span>Publish to Class</span>
                </button>
              </div>

              <div className="space-y-3">
                {generatedQuestions.map((q, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-dark-850 border border-dark-700/60 text-xs space-y-2">
                    <p className="font-semibold text-slate-200">
                      Q{idx + 1}: {q.question}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-2xs">
                      {q.options?.map((opt, oIdx) => (
                        <div
                          key={oIdx}
                          className={`p-2 rounded-lg border ${
                            oIdx === q.correctIndex
                              ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200 font-semibold'
                              : 'bg-dark-800 border-dark-700 text-slate-400'
                          }`}
                        >
                          <strong>{String.fromCharCode(65 + oIdx)}.</strong> {opt}
                        </div>
                      ))}
                    </div>
                    <p className="text-2xs text-slate-500 font-mono pt-1">
                      b (Difficulty): {q.difficulty} • a (Discrimination): {q.discrimination} • {q.misconceptionNote}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Tab 3: At-Risk Students & Attendance ── */}
      {activeTab === 'at-risk' && (
        <div className="card-elevated p-5 space-y-3 animate-fade-in">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <Users className="w-4 h-4 text-teacher-400" />
            <span>Students Requiring Academic Intervention</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-2xs text-slate-500 uppercase tracking-wider font-mono border-b border-dark-700/60">
                <tr>
                  <th className="py-2.5 px-3">Student Name</th>
                  <th className="py-2.5 px-3">Roll No</th>
                  <th className="py-2.5 px-3">Mastery</th>
                  <th className="py-2.5 px-3">Attendance</th>
                  <th className="py-2.5 px-3">Root Blocked Concept</th>
                  <th className="py-2.5 px-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-800 text-slate-300 font-mono text-2xs">
                {atRiskStudents.map((s, i) => (
                  <tr key={i} className="hover:bg-dark-800/40 transition-colors">
                    <td className="py-3 px-3 font-sans font-medium text-white">{s.name}</td>
                    <td className="py-3 px-3 text-slate-500">{s.roll}</td>
                    <td className="py-3 px-3 text-rose-400 font-bold">{s.mastery}</td>
                    <td className="py-3 px-3 text-emerald-400">{s.attendance}</td>
                    <td className="py-3 px-3 text-amber-300 font-sans">{s.blockedBy}</td>
                    <td className="py-3 px-3">
                      <button 
                        onClick={() => alert(`Assigned targeted review on ${s.blockedBy} to ${s.name}`)}
                        className="px-2 py-1 rounded bg-dark-700 hover:bg-teacher-600 text-slate-200 hover:text-white transition-colors cursor-pointer"
                      >
                        Assign Mentor
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
