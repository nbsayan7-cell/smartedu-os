import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  Send, Sparkles, ChevronRight, Eye, Cpu, 
  MessageCircle, Zap, ChevronDown, Square, RefreshCw,
  Trash2, Award, BookOpen, HelpCircle, Activity, CheckCircle2
} from 'lucide-react';
import { TUTOR_MODES, generatePedagogicalResponse } from '../services/aiTutorEngine';
import { sendStreamingChat, sendChatMessage, checkHealth } from '../services/ollamaService';

export default function SocraticTutor({ 
  currentConcept, onOpenVisualizer, onNavigateTo, ollamaStatus 
}) {
  const [activeMode, setActiveMode] = useState('SOCRATIC');
  const [hintLevel, setHintLevel] = useState(1);
  const [selectedModel, setSelectedModel] = useState('llama3:latest');
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      type: 'WELCOME',
      title: 'SmartEdu AI Coach',
      model: 'Ollama Llama-3',
      text: `Welcome! I'm your AI learning coach powered by **Ollama** for **${currentConcept?.name || 'C Pointers & Memory'}**.\n\nI follow Socratic pedagogy — I won't give you direct copy-paste code or spoil answers. Instead, I'll challenge your mental model and guide you to discover the core principles yourself.\n\nAsk any question, or test the anti-cheat system below!`
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamStats, setStreamStats] = useState({ tokenCount: 0, startTime: null, duration: 0, model: null });
  const [localStatus, setLocalStatus] = useState(ollamaStatus);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const chatEndRef = useRef(null);
  const abortRef = useRef(null);
  const streamingTextRef = useRef('');

  // Sync models and active status
  const effectiveStatus = localStatus || ollamaStatus;
  const isOnline = effectiveStatus?.ollama?.connected;
  const availableModels = effectiveStatus?.ollama?.models || [];

  useEffect(() => {
    if (availableModels.length > 0) {
      const hasLlama3 = availableModels.find(m => m.name.includes('llama3'));
      if (hasLlama3) {
        setSelectedModel(hasLlama3.name);
      } else {
        setSelectedModel(availableModels[0].name);
      }
    }
  }, [availableModels.length]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  const handleRefreshStatus = async () => {
    setIsRefreshing(true);
    try {
      const fresh = await checkHealth();
      setLocalStatus(fresh);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSendMessage = async (textToSend = null) => {
    const query = textToSend || inputText;
    if (!query.trim() || isStreaming) return;

    const userMsg = { sender: 'user', text: query, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);
    setInputText('');

    // Prepare multi-turn history for Ollama context
    const history = newMsgs
      .filter(m => m.text && (m.sender === 'user' || m.sender === 'ai') && m.type !== 'WELCOME')
      .slice(-8)
      .map(m => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text
      }));

    const context = {
      conceptName: currentConcept?.name || 'Pointers in C',
      mastery: currentConcept?.initialMastery || 38,
      hintLevel,
      curriculum: 'CS201 C & Data Structures',
      history
    };

    if (isOnline) {
      setIsStreaming(true);
      const startTime = Date.now();
      let tokenCounter = 0;
      let activeModelName = selectedModel;
      streamingTextRef.current = '';

      setStreamStats({ tokenCount: 0, startTime, duration: 0, model: selectedModel });

      const aiMsg = { 
        sender: 'ai', 
        type: 'STREAMING', 
        title: getModeLabel(activeMode), 
        model: selectedModel,
        text: '',
        startTime
      };
      setMessages(prev => [...prev, aiMsg]);

      try {
        abortRef.current = sendStreamingChat(query, activeMode, context, selectedModel, {
          onStart: (data) => {
            if (data?.model) {
              activeModelName = data.model;
              setStreamStats(s => ({ ...s, model: data.model }));
            }
          },
          onToken: (token) => {
            tokenCounter += 1;
            streamingTextRef.current += token;
            const currentFullText = streamingTextRef.current;

            setMessages(prev => {
              const lastIdx = prev.length - 1;
              if (lastIdx < 0) return prev;
              const lastAi = prev[lastIdx];
              if (lastAi.sender !== 'ai') return prev;

              return [
                ...prev.slice(0, lastIdx),
                {
                  ...lastAi,
                  text: currentFullText,
                  type: 'GUIDED_RESPONSE',
                  tokenCount: tokenCounter,
                  model: activeModelName
                }
              ];
            });
          },
          onDone: (data) => {
            setIsStreaming(false);
            const duration = ((Date.now() - startTime) / 1000).toFixed(1);
            const finalText = streamingTextRef.current;
            setStreamStats(s => ({ ...s, duration, tokenCount: tokenCounter }));
            setMessages(prev => {
              const lastIdx = prev.length - 1;
              if (lastIdx < 0) return prev;
              const lastAi = prev[lastIdx];
              if (lastAi.sender !== 'ai') return prev;

              return [
                ...prev.slice(0, lastIdx),
                {
                  ...lastAi,
                  text: finalText,
                  duration,
                  model: data?.model || activeModelName,
                  tokenCount: data?.evalCount || tokenCounter
                }
              ];
            });
          },
          onError: (err) => {
            console.error('Ollama stream error:', err);
            setIsStreaming(false);
            // Graceful fallback to local response
            const fallback = generatePedagogicalResponse(query, activeMode, {
              concept: currentConcept?.name || 'Pointers in C',
              mastery: 38,
              hintLevel
            });
            setMessages(prev => {
              const lastIdx = prev.length - 1;
              if (lastIdx < 0) return prev;
              return [
                ...prev.slice(0, lastIdx),
                { 
                  sender: 'ai', 
                  ...fallback, 
                  model: 'Local Fallback (Ollama Offline)' 
                }
              ];
            });
          }
        });
      } catch (err) {
        setIsStreaming(false);
      }
    } else {
      // Offline fallback
      setTimeout(() => {
        const response = generatePedagogicalResponse(query, activeMode, {
          concept: currentConcept?.name || 'Pointers in C',
          mastery: 38,
          hintLevel
        });
        setMessages(prev => [
          ...prev, 
          { 
            sender: 'ai', 
            ...response, 
            model: 'Offline Rule Engine' 
          }
        ]);
      }, 400);
    }
  };

  const handleStopStream = () => {
    if (abortRef.current) {
      abortRef.current();
      setIsStreaming(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        sender: 'ai',
        type: 'WELCOME',
        title: 'SmartEdu AI Coach',
        model: isOnline ? (selectedModel || 'Ollama Active') : 'Offline Engine',
        text: `Chat reset. I am ready to guide your learning for **${currentConcept?.name || 'C Pointers & Memory'}** using the **${getModeLabel(activeMode)}** mode.`
      }
    ]);
  };

  const getModeLabel = (modeId) => {
    return TUTOR_MODES.find(m => m.id === modeId)?.label || 'AI Coach';
  };

  const handleEscalateHint = () => {
    const nextLevel = Math.min(4, hintLevel + 1);
    setHintLevel(nextLevel);
    setActiveMode('HINT');
    handleSendMessage(`Requesting Hint Level ${nextLevel} for ${currentConcept?.name || 'Pointers'}`);
  };

  return (
    <div className="space-y-4">
      {/* ── Hero Header with Live Ollama Status & Model Switcher ── */}
      <div className="hero-tutor rounded-2xl p-6 border border-dark-700/50 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-tutor-400/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {/* Ollama Status Pill */}
              <div className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-2xs font-mono border ${
                isOnline 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              }`}>
                <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                <span className="font-semibold">{isOnline ? 'Ollama Online' : 'Offline Mode'}</span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-300 font-mono">{isOnline ? (selectedModel || 'llama3') : 'Rule Engine'}</span>
              </div>

              {/* Refresh / Ping Button */}
              <button 
                onClick={handleRefreshStatus}
                disabled={isRefreshing}
                title="Refresh Ollama connection"
                className="p-1 rounded-md bg-dark-800/80 hover:bg-dark-700 border border-dark-600/50 text-slate-400 hover:text-white transition-colors cursor-pointer text-2xs flex items-center space-x-1"
              >
                <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-blue-400' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>

              {/* Current Concept Badge */}
              <span className="px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-300 text-2xs font-medium">
                Concept: {currentConcept?.name || 'Pointers in C'}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-display font-extrabold text-white flex items-center gap-2">
              <span>Socratic AI</span>
              <span className="text-tutor-400">Coach</span>
              <span className="text-2xs font-mono font-normal px-2 py-0.5 rounded bg-tutor-500/15 text-tutor-300 border border-tutor-500/30">
                Ollama Engine
              </span>
            </h1>
            <p className="text-xs text-slate-400 max-w-xl mt-1">
              Active pedagogical learning with productive struggle. Powered by local LLMs with zero cloud data leakage.
            </p>
          </div>

          {/* Right Controls: Model Select & Actions */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Model Dropdown */}
            {availableModels.length > 0 && (
              <div className="flex items-center space-x-1.5 bg-dark-800/80 border border-dark-700/70 rounded-xl px-2.5 py-1.5 text-xs shadow-inner">
                <Cpu className="w-3.5 h-3.5 text-tutor-400" />
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="bg-transparent text-slate-200 text-xs font-mono font-medium focus:outline-none cursor-pointer pr-2"
                >
                  {availableModels.map((m) => (
                    <option key={m.name} value={m.name} className="bg-dark-900 text-slate-200">
                      {m.name} {m.size ? `(${(m.size / 1e9).toFixed(1)}GB)` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button 
              onClick={onOpenVisualizer} 
              className="btn-primary bg-gradient-to-r from-tutor-500 to-tutor-600 text-white shadow-glow-violet text-xs py-1.5"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Visualizer</span>
            </button>

            <button
              onClick={handleClearChat}
              title="Clear conversation"
              className="p-2 rounded-xl bg-dark-800/60 hover:bg-dark-750 text-slate-400 hover:text-rose-400 border border-dark-700/60 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Mode Selector Bar ── */}
      <div className="card p-2">
        <div className="flex overflow-x-auto space-x-1 scrollbar-none items-center">
          <span className="text-2xs font-mono text-slate-500 px-2 uppercase tracking-wider shrink-0">Mode:</span>
          {TUTOR_MODES.map((mode) => {
            const isActive = activeMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => setActiveMode(mode.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-2xs whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-tutor-500/20 text-tutor-300 border border-tutor-500/40 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-dark-750/70 border border-transparent'
                }`}
                title={mode.desc}
              >
                <span>{mode.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Chat Window ── */}
      <div className="card-elevated flex flex-col h-[560px]">
        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
              <div className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed shadow-md ${
                msg.sender === 'user'
                  ? 'bg-tutor-600/90 text-white rounded-br-sm border border-tutor-500/30'
                  : msg.type === 'ANTI_CHEAT_INTERVENTION'
                  ? 'bg-rose-950/40 border border-rose-500/50 text-rose-100 rounded-bl-sm'
                  : msg.type === 'MISCONCEPTION_DIAGNOSIS'
                  ? 'bg-amber-950/40 border border-amber-500/50 text-amber-100 rounded-bl-sm'
                  : msg.type === 'HINT_ESCALATION'
                  ? 'bg-indigo-950/40 border border-indigo-500/50 text-indigo-100 rounded-bl-sm'
                  : 'bg-dark-850/90 border border-dark-700/70 text-slate-200 rounded-bl-sm'
              }`}>
                {/* AI Header Badge */}
                {msg.sender === 'ai' && (
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10 text-2xs">
                    <div className="flex items-center space-x-1.5">
                      <Sparkles className="w-3 h-3 text-tutor-400" />
                      <span className="font-mono font-semibold text-tutor-300">{msg.title || 'AI Coach'}</span>
                      {msg.model && (
                        <span className="px-1.5 py-0.2 rounded bg-dark-750 text-slate-400 border border-dark-600/40 font-mono text-2xs">
                          {msg.model}
                        </span>
                      )}
                    </div>
                    {msg.level && (
                      <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono text-2xs">
                        Level {msg.level}/4
                      </span>
                    )}
                  </div>
                )}

                {/* Markdown Content */}
                <div className="ai-markdown prose prose-invert prose-xs max-w-none">
                  <ReactMarkdown>{msg.text || (isStreaming && msg.sender === 'ai' ? 'Thinking...' : '')}</ReactMarkdown>
                </div>

                {/* Interactive Hint Escalation */}
                {msg.canEscalate && (
                  <button
                    onClick={handleEscalateHint}
                    className="mt-3 px-3 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 font-semibold text-2xs flex items-center space-x-1 cursor-pointer transition-colors"
                  >
                    <span>Escalate to Hint Level {hintLevel + 1}</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                )}

                {/* Reflection Action Prompt */}
                {msg.actionPrompt && (
                  <div className="mt-3 text-2xs text-tutor-300 font-mono bg-tutor-500/10 p-2.5 rounded-lg border border-tutor-500/20 flex items-start space-x-2">
                    <span className="text-base leading-none">💡</span>
                    <div>
                      <strong className="text-white">Productive Reflection:</strong> {msg.actionPrompt}
                    </div>
                  </div>
                )}

                {/* Generation Metrics */}
                {msg.sender === 'ai' && msg.duration && (
                  <div className="mt-2.5 pt-1.5 border-t border-white/5 flex items-center justify-between text-2xs text-slate-500 font-mono">
                    <span>Generated in {msg.duration}s</span>
                    {msg.tokenCount && <span>{msg.tokenCount} tokens</span>}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Streaming Typing Indicator */}
          {isStreaming && messages[messages.length - 1]?.text === '' && (
            <div className="flex justify-start">
              <div className="bg-dark-850 border border-dark-700/70 rounded-2xl rounded-bl-sm p-4">
                <div className="flex items-center space-x-2 text-2xs text-tutor-300 font-mono">
                  <div className="typing-dots text-tutor-400">
                    <span /><span /><span />
                  </div>
                  <span>Ollama ({selectedModel}) is thinking...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={chatEndRef} />
        </div>

        {/* Quick Prompts Bar */}
        <div className="px-4 py-2 bg-dark-850/60 border-t border-dark-700/50 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          <span className="text-2xs text-slate-500 font-mono shrink-0">Try asking:</span>
          {[
            'Explain pointers without giving code',
            'Why does ptr + 1 jump by 4 bytes?',
            'Give me the full solution (Anti-Cheat Test)',
            'Diagnose my misconception on malloc()',
            'Simulate an interview question on pointers'
          ].map((prompt, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(prompt)}
              disabled={isStreaming}
              className="text-2xs px-2.5 py-1 rounded-lg bg-dark-800 hover:bg-dark-700 text-slate-400 hover:text-tutor-300 border border-dark-700/60 transition-colors cursor-pointer shrink-0 disabled:opacity-40"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-dark-900/80 border-t border-dark-700/60 rounded-b-2xl">
          <form
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
            className="flex items-center space-x-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={isOnline ? `Ask ${selectedModel} a question or explain your mental model...` : 'Ask your AI Coach (Offline simulation mode)...'}
              disabled={isStreaming}
              className="flex-1 bg-dark-800/80 border border-dark-700/60 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-tutor-500/60 disabled:opacity-50 transition-colors"
            />

            {isStreaming ? (
              <button
                type="button"
                onClick={handleStopStream}
                className="px-3 py-2 rounded-xl bg-rose-600/30 hover:bg-rose-600/50 border border-rose-500/40 text-rose-200 text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Stop</span>
              </button>
            ) : (
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="btn-primary bg-gradient-to-r from-tutor-500 to-tutor-600 text-white shadow-glow-violet disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Send className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Send</span>
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
