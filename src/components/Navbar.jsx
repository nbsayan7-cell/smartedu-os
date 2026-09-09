import React, { useState, useEffect, useRef } from 'react';
import { 
  Compass, Activity, BrainCircuit, Code, Briefcase, Users, 
  Wifi, WifiOff, Languages, BookOpen, ChevronDown,
  Cpu, Zap, PanelRightOpen, Moon, Settings, FileText,
  ShieldCheck, Award, Info, X, ExternalLink, UserCheck, Atom, PlayCircle
} from 'lucide-react';
import { TRANSLATIONS } from '../data/translations';

export default function Navbar({ 
  activeTab, setActiveTab, lang, setLang, 
  lowBandwidth, setLowBandwidth,
  currentCurriculum, setCurrentCurriculum,
  ollamaStatus, onToggleAIPanel,
  userRole = 'student', setUserRole
}) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  const [showSihModal, setShowSihModal] = useState(false);
  const indicatorRef = useRef(null);
  const navRef = useRef(null);

  // Dynamic Navigation Items based on User Role (Student, Teacher, Parent)
  const navItems = [
    { id: 'xray', label: t.knowledgeXRay, icon: BrainCircuit, color: 'text-xray-400', shortLabel: 'X-Ray', roles: ['student', 'teacher', 'parent'] },
    { id: 'gps', label: t.learningGPS, icon: Compass, color: 'text-gps-400', shortLabel: 'GPS', roles: ['student'] },
    { id: 'lecture', label: 'Lecture', icon: PlayCircle, color: 'text-violet-400', shortLabel: 'Lecture', roles: ['student', 'teacher'] },
    { id: 'cybersim', label: 'Cyber-MATLAB', icon: Atom, color: 'text-cyan-400', shortLabel: 'CyberSim', roles: ['student', 'teacher'] },
    { id: 'tutor', label: t.socraticCoach, icon: BookOpen, color: 'text-tutor-400', shortLabel: 'Coach', roles: ['student'] },
    { id: 'practice', label: 'Adaptive IRT', icon: Activity, color: 'text-practice-400', shortLabel: 'Practice', roles: ['student', 'teacher'] },
    { id: 'documents', label: 'Document & PDF Hub', icon: FileText, color: 'text-cyan-400', shortLabel: 'Documents', roles: ['student', 'teacher'] },
    { id: 'teachback', label: 'Teach-Back', icon: Award, color: 'text-prove-400', shortLabel: 'Teach-Back', roles: ['student'] },
    { id: 'prove', label: t.learnBuildProve, icon: Code, color: 'text-prove-400', shortLabel: 'Prove', roles: ['student'] },
    { id: 'career', label: t.careerTwin, icon: Briefcase, color: 'text-career-400', shortLabel: 'Career', roles: ['student'] },
    { id: 'teacher', label: t.teacherRadar, icon: Users, color: 'text-teacher-400', shortLabel: 'Teacher Radar', roles: ['teacher', 'student'] },
    { id: 'parent', label: 'Parent Portal', icon: ShieldCheck, color: 'text-teal-400', shortLabel: 'Parent Portal', roles: ['parent', 'student'] }
  ].filter(item => item.roles.includes(userRole));

  // Animated tab indicator
  useEffect(() => {
    if (navRef.current && indicatorRef.current) {
      const activeBtn = navRef.current.querySelector(`[data-tab="${activeTab}"]`);
      if (activeBtn) {
        const navRect = navRef.current.getBoundingClientRect();
        const btnRect = activeBtn.getBoundingClientRect();
        indicatorRef.current.style.left = `${btnRect.left - navRect.left}px`;
        indicatorRef.current.style.width = `${btnRect.width}px`;
      }
    }
  }, [activeTab, userRole]);

  const isConnected = ollamaStatus?.ollama?.connected;

  const handleRoleChange = (newRole) => {
    if (setUserRole) setUserRole(newRole);
    if (newRole === 'teacher') setActiveTab('teacher');
    else if (newRole === 'parent') setActiveTab('parent');
    else setActiveTab('xray');
  };

  return (
    <header className="sticky top-0 z-50 glass-strong">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* ── Brand & SIH Badge ── */}
          <div className="flex items-center space-x-3 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 via-violet-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
              <BrainCircuit className="w-4.5 h-4.5 text-white" />
            </div>
            <div className="hidden sm:block">
              <span className="font-display font-extrabold text-base tracking-tight text-white">
                SmartEdu<span className="text-blue-400">OS</span>
              </span>
              <span className="ml-1.5 text-2xs font-mono px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold align-middle">
                v2.0
              </span>
            </div>

            {/* SIH 26207 Badge */}
            <button
              onClick={() => setShowSihModal(true)}
              className="hidden md:flex items-center space-x-1.5 px-2 py-0.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-2xs font-mono font-semibold transition-colors cursor-pointer"
              title="Click to view SIH 26207 Architecture & Research References"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span>SIH 26207 • Confusions</span>
              <Info className="w-3 h-3 text-amber-400" />
            </button>
          </div>

          {/* ── Desktop Nav ── */}
          <nav ref={navRef} className="hidden lg:flex items-center space-x-0.5 relative px-1 py-1 rounded-xl bg-dark-800/50 border border-dark-700/50">
            {/* Sliding indicator */}
            <div 
              ref={indicatorRef}
              className="absolute bottom-1 h-[calc(100%-8px)] rounded-lg bg-dark-700/80 border border-dark-600/50 transition-all duration-300"
              style={{ transitionTimingFunction: 'cubic-bezier(0.16,1,0.3,1)' }}
            />
            
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  data-tab={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`relative z-10 flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors duration-200 cursor-pointer ${
                    isActive
                      ? `${item.color} font-semibold`
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 transition-colors ${isActive ? item.color : ''}`} />
                  <span>{item.shortLabel}</span>
                </button>
              );
            })}
          </nav>

          {/* ── Right Controls ── */}
          <div className="flex items-center space-x-2">
            {/* Role Switcher Pills (Student / Teacher / Parent) */}
            <div className="flex items-center bg-dark-800/80 border border-dark-700/70 p-0.5 rounded-lg text-2xs font-mono">
              {[
                { id: 'student', label: 'Student' },
                { id: 'teacher', label: 'Teacher' },
                { id: 'parent', label: 'Parent' }
              ].map(role => (
                <button
                  key={role.id}
                  onClick={() => handleRoleChange(role.id)}
                  className={`px-2 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                    userRole === role.id
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {role.label}
                </button>
              ))}
            </div>

            {/* AI Status */}
            <button
              onClick={onToggleAIPanel}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-dark-800/60 border border-dark-700/50 text-xs transition-colors hover:bg-dark-700/60 cursor-pointer"
              title={isConnected ? 'Ollama Connected' : 'Ollama Offline — Using local responses'}
            >
              <Cpu className="w-3.5 h-3.5 text-slate-400" />
              <div className={`status-dot ${isConnected ? 'online' : 'offline'}`} />
              <span className="hidden sm:inline text-slate-400 font-mono text-2xs">
                {isConnected ? 'AI Online' : 'Offline'}
              </span>
            </button>

            {/* Bandwidth Toggle */}
            <button
              onClick={() => setLowBandwidth(!lowBandwidth)}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                lowBandwidth
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                  : 'text-slate-400 hover:text-slate-300 border border-transparent hover:bg-dark-800'
              }`}
              title={lowBandwidth ? 'Low-Bandwidth Mode Active' : 'Toggle Low-Bandwidth Mode'}
            >
              {lowBandwidth ? <WifiOff className="w-3.5 h-3.5" /> : <Wifi className="w-3.5 h-3.5" />}
            </button>

            {/* Language */}
            <div className="relative hidden sm:block">
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value)}
                className="appearance-none bg-dark-800/60 border border-dark-700/50 rounded-lg text-2xs text-slate-300 pl-2 pr-5 py-1.5 focus:outline-none focus:border-blue-500/50 cursor-pointer"
              >
                <option value="en">EN</option>
                <option value="hi">हिं</option>
                <option value="te">తె</option>
                <option value="ta">த</option>
                <option value="mr">म</option>
                <option value="bn">বা</option>
              </select>
              <ChevronDown className="w-3 h-3 text-slate-500 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* ── Mobile Nav ── */}
        <div className="lg:hidden flex overflow-x-auto py-2 space-x-1 border-t border-dark-700/50 scrollbar-none -mx-4 px-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center space-x-1 whitespace-nowrap px-2.5 py-1.5 rounded-lg text-2xs font-medium transition-colors cursor-pointer ${
                  isActive 
                    ? `bg-dark-700 ${item.color} font-semibold border border-dark-600` 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{item.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── SIH 26207 Info & References Modal ── */}
      {showSihModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-dark-900 border border-dark-700 rounded-2xl p-6 shadow-2xl relative space-y-4">
            <button
              onClick={() => setShowSihModal(false)}
              className="absolute right-4 top-4 p-1.5 rounded-lg bg-dark-800 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-2xs font-bold">
                  Problem Statement ID: SIH 26207
                </span>
                <span className="px-2.5 py-1 rounded-md bg-blue-500/10 border border-blue-500/30 text-blue-300 font-mono text-2xs font-bold">
                  Theme: Smart Education
                </span>
              </div>
              <h2 className="text-base font-bold text-white mt-2">
                Student Innovation a concept that describes learning in digital age
              </h2>
              <p className="text-2xs text-slate-400 font-mono">Team: Confusions</p>
            </div>

            {/* 5 Conceptual Nodes from Presentation */}
            <div className="space-y-2 border-t border-b border-dark-700 py-3">
              <h3 className="text-xs font-bold text-white">5 Key Conceptual Nodes Implemented</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-2xs">
                <div className="p-2.5 rounded-xl bg-dark-800/80 border border-dark-700">
                  <strong className="text-cyan-400">1. Activity Capture:</strong> Logs real-time device inputs, session timers, and login metrics.
                </div>
                <div className="p-2.5 rounded-xl bg-dark-800/80 border border-dark-700">
                  <strong className="text-emerald-400">2. Smart Assessment:</strong> Tracks individual learning paces and 2PL IRT quiz scores.
                </div>
                <div className="p-2.5 rounded-xl bg-dark-800/80 border border-dark-700">
                  <strong className="text-amber-400">3. Central Logic Hub:</strong> Processes raw user metrics against university milestones.
                </div>
                <div className="p-2.5 rounded-xl bg-dark-800/80 border border-dark-700">
                  <strong className="text-violet-400">4. Personalization Engine:</strong> Dynamically shapes custom learning paths & micro-quizzes.
                </div>
                <div className="p-2.5 rounded-xl bg-dark-800/80 border border-dark-700 sm:col-span-2">
                  <strong className="text-rose-400">5. Ecosystem Integration:</strong> Distributes PDFs and course materials directly to live dashboards.
                </div>
              </div>
            </div>

            {/* Research Citations */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-white">Research & Official Citations (Slide 6)</h3>
              <ul className="space-y-1 text-2xs text-slate-300 font-mono">
                <li>• <strong>UNESCO</strong>: Digital Learning & Human-Centred AI in Education</li>
                <li>• <strong>DIKSHA</strong>: Government of India Digital Portal for Education</li>
                <li>• <strong>Ministry of Education</strong>: National Digital Initiatives</li>
                <li>• <strong>ScienceDirect</strong>: Personalization in Educational Systems Research</li>
                <li>• <strong>NASA POWER API</strong>: Data Access Tutorial Standards</li>
              </ul>
            </div>

            <div className="text-right pt-2">
              <button
                onClick={() => setShowSihModal(false)}
                className="btn-primary text-xs py-1.5 px-4"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
