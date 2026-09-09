import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Navbar from './components/Navbar';
import KnowledgeXRay from './components/KnowledgeXRay';
import LearningGPS from './components/LearningGPS';
import SocraticTutor from './components/SocraticTutor';
import AdaptivePractice from './components/AdaptivePractice';
import PointerVisualizer from './components/PointerVisualizer';
import DiffractionVisualizer from './components/DiffractionVisualizer';
import TeachBackMode from './components/TeachBackMode';
import ProjectProofEngine from './components/ProjectProofEngine';
import CareerSkillTwin from './components/CareerSkillTwin';
import TeacherCockpit from './components/TeacherCockpit';
import DigitalWellbeing from './components/DigitalWellbeing';
import OfflineModeBar from './components/OfflineModeBar';
import AIStatusPanel from './components/AIStatusPanel';
import DocumentUploadHub from './components/DocumentUploadHub';
import ParentPortal from './components/ParentPortal';
import CyberSimPlatform from './components/CyberSimPlatform';
import LecturePlayer from './components/LecturePlayer';
import { checkHealth, logActivityEvent } from './services/ollamaService';

import { KNOWLEDGE_GRAPH_DATA } from './data/knowledgeGraphData';
import { TRANSLATIONS } from './data/translations';
import { X, Activity, ShieldCheck, User, Users } from 'lucide-react';

const PAGE_VARIANTS = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2 } }
};

export default function App() {
  const [activeTab, setActiveTab] = useState('xray');
  const [userRole, setUserRole] = useState('student'); // 'student' | 'teacher' | 'parent'
  const [lang, setLang] = useState('en');
  const [lowBandwidth, setLowBandwidth] = useState(false);
  const [currentCurriculum, setCurrentCurriculum] = useState('cs_c_dsa');
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [ollamaStatus, setOllamaStatus] = useState(null);
  const [sessionMinutes, setSessionMinutes] = useState(1);

  const currData = KNOWLEDGE_GRAPH_DATA[currentCurriculum] || KNOWLEDGE_GRAPH_DATA.cs_c_dsa;

  const [masteryState, setMasteryState] = useState(() => {
    const initial = {};
    currData.nodes.forEach(n => {
      initial[n.id] = { mastery: n.initialMastery, status: n.category };
    });
    return initial;
  });

  const [currentConcept, setCurrentConcept] = useState(
    currData.nodes.find(n => n.id.includes('pointer') || n.id.includes('diffraction')) || currData.nodes[2]
  );
  const [showVisualizer, setShowVisualizer] = useState(false);
  const [earnedBadges, setEarnedBadges] = useState([]);

  // Check Ollama health on mount and periodically
  useEffect(() => {
    const check = async () => {
      const health = await checkHealth();
      setOllamaStatus(health);
    };
    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, []);

  // Activity Capture timer: track session minutes
  useEffect(() => {
    const timer = setInterval(() => {
      setSessionMinutes(m => m + 1);
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Log navigation activity
  useEffect(() => {
    logActivityEvent('NAVIGATION', `Switched to ${activeTab} (${userRole})`, { activeTab, userRole });
  }, [activeTab, userRole]);

  const handleMasteryUpdate = useCallback((conceptId, newMastery) => {
    setMasteryState(prev => ({
      ...prev,
      [conceptId]: { ...prev[conceptId], mastery: newMastery }
    }));
  }, []);

  const handleSelectConcept = useCallback((node) => {
    setCurrentConcept(node);
    logActivityEvent('CONCEPT_SELECT', `Selected concept: ${node.name}`, { conceptId: node.id });
  }, []);

  const handleStartDiagnostic = useCallback((node) => {
    setCurrentConcept(node);
    setActiveTab('practice');
  }, []);

  const handleBadgeEarned = useCallback((badgeName) => {
    setEarnedBadges(prev => prev.includes(badgeName) ? prev : [...prev, badgeName]);
  }, []);

  const handleCurriculumChange = useCallback((curr) => {
    setCurrentCurriculum(curr);
    const data = KNOWLEDGE_GRAPH_DATA[curr];
    if (data?.nodes) {
      const initial = {};
      data.nodes.forEach(n => { initial[n.id] = { mastery: n.initialMastery, status: n.category }; });
      setMasteryState(initial);
      setCurrentConcept(data.nodes[2] || data.nodes[0]);
    }
  }, []);

  const navigateTo = useCallback((tab) => {
    setActiveTab(tab);
    setShowVisualizer(false);
  }, []);

  return (
    <div className="min-h-screen bg-dark-950 text-slate-100 flex flex-col font-sans">
      <OfflineModeBar lowBandwidth={lowBandwidth} />
      
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => { setActiveTab(tab); setShowVisualizer(false); }}
        lang={lang}
        setLang={setLang}
        lowBandwidth={lowBandwidth}
        setLowBandwidth={setLowBandwidth}
        currentCurriculum={currentCurriculum}
        setCurrentCurriculum={handleCurriculumChange}
        ollamaStatus={ollamaStatus}
        onToggleAIPanel={() => setShowAIPanel(true)}
        userRole={userRole}
        setUserRole={setUserRole}
      />

      {/* ── Curriculum & Conceptual Node Status Bar ── */}
      <div className="border-b border-dark-800 bg-dark-950">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-2xs text-slate-500 font-mono uppercase tracking-wider">Curriculum</span>
            <select 
              value={currentCurriculum}
              onChange={(e) => handleCurriculumChange(e.target.value)}
              className="bg-dark-800/50 border border-dark-700/50 rounded-lg text-xs font-medium text-slate-300 py-1 px-2.5 focus:outline-none focus:border-blue-500/50 cursor-pointer"
            >
              <option value="cs_c_dsa">CS201: C & Data Structures</option>
              <option value="eng_physics">PH101: Engineering Physics</option>
            </select>

            <span className="hidden sm:inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-dark-850 border border-dark-700/60 text-2xs font-mono text-slate-400">
              <span className="capitalize text-blue-400 font-semibold">{userRole}</span> Mode
            </span>
          </div>

          <div className="flex items-center space-x-4 text-2xs text-slate-600 font-mono">
            {/* Activity Capture Node Indicator */}
            <span className="hidden md:flex items-center space-x-1 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Activity Capture: {sessionMinutes}m logged</span>
            </span>
            <span className="hidden md:inline">•</span>
            <span>{currData.nodes.length} concepts</span>
            <span>•</span>
            <span className="text-slate-400">SIH 26207 • Confusions</span>
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${activeTab}-${userRole}`}
            variants={PAGE_VARIANTS}
            initial="initial"
            animate="animate"
            exit="exit"
            className="space-y-6"
          >
            {activeTab === 'xray' && (
              <KnowledgeXRay
                curriculumData={currData}
                masteryState={masteryState}
                onSelectConcept={handleSelectConcept}
                onStartDiagnostic={handleStartDiagnostic}
                onNavigateTo={navigateTo}
              />
            )}

            {activeTab === 'gps' && (
              <LearningGPS
                curriculumData={currData}
                masteryState={masteryState}
                onNavigateTo={navigateTo}
                onOpenVisualizer={() => setShowVisualizer(true)}
              />
            )}

            {/* PW / Unacademy-Style Video Lecture Interface */}
            {activeTab === 'lecture' && (
              <LecturePlayer />
            )}

            {/* Cyber-MATLAB Sci-Fi Physics & Math Simulation Platform */}
            {activeTab === 'cybersim' && (
              <CyberSimPlatform
                onNavigateTo={navigateTo}
                currentCurriculum={currentCurriculum}
              />
            )}

            {activeTab === 'tutor' && (
              <SocraticTutor
                currentConcept={currentConcept}
                onOpenVisualizer={() => setShowVisualizer(true)}
                onNavigateTo={navigateTo}
                ollamaStatus={ollamaStatus}
              />
            )}

            {activeTab === 'practice' && (
              <AdaptivePractice
                currentConcept={currentConcept}
                masteryState={masteryState}
                onMasteryUpdate={handleMasteryUpdate}
                onOpenVisualizer={() => setShowVisualizer(true)}
                onNavigateTo={navigateTo}
              />
            )}

            {/* Document & PDF Hub (Digital Classroom / Resource Sharing) */}
            {activeTab === 'documents' && (
              <DocumentUploadHub
                onNavigateTo={navigateTo}
                currentCurriculum={currentCurriculum}
              />
            )}

            {/* Parent Portal with Secure OTP Authentication */}
            {activeTab === 'parent' && (
              <ParentPortal />
            )}

            {activeTab === 'teachback' && (
              <TeachBackMode
                currentConcept={currentConcept}
                ollamaStatus={ollamaStatus}
                onComplete={(score) => {
                  if (currentConcept) {
                    handleMasteryUpdate(currentConcept.id, Math.min(100, (masteryState[currentConcept.id]?.mastery || 40) + 25));
                  }
                }}
              />
            )}

            {activeTab === 'prove' && (
              <ProjectProofEngine onBadgeEarned={handleBadgeEarned} />
            )}

            {activeTab === 'career' && (
              <CareerSkillTwin
                masteryState={masteryState}
                onNavigateTo={navigateTo}
              />
            )}

            {activeTab === 'teacher' && (
              <TeacherCockpit onNavigateTo={navigateTo} />
            )}
          </motion.div>
        </AnimatePresence>

        <div className="mt-8">
          <DigitalWellbeing />
        </div>
      </main>

      {/* ── Visualizer Modal ── */}
      <AnimatePresence>
        {showVisualizer && (
          <motion.div 
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="w-full max-w-5xl my-auto relative"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <button
                onClick={() => setShowVisualizer(false)}
                className="absolute right-4 top-4 z-10 w-8 h-8 rounded-lg bg-dark-700 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer border border-dark-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              {currentCurriculum === 'cs_c_dsa' ? (
                <PointerVisualizer onClose={() => setShowVisualizer(false)} />
              ) : (
                <DiffractionVisualizer onClose={() => setShowVisualizer(false)} />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── AI Status Panel ── */}
      <AIStatusPanel 
        isOpen={showAIPanel} 
        onClose={() => setShowAIPanel(false)} 
        healthData={ollamaStatus}
      />

      {/* ── Footer ── */}
      <footer className="border-t border-dark-800 bg-dark-950 py-6 text-center">
        <div className="max-w-[1400px] mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-2xs text-slate-600">
            <span className="font-semibold text-slate-500">SmartEdu OS</span> — SIH 26207 Personal Learning & Skill-Mastery Platform (Team Confusions)
          </p>
          <p className="text-2xs text-slate-700 font-mono">
            UNESCO Guidelines Compliant • DIKSHA Portal Mapping • 2PL-IRT + BKT • Local Ollama LLM
          </p>
        </div>
      </footer>
    </div>
  );
}
