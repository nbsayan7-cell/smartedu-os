import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, FileText, Sparkles, BrainCircuit, CheckCircle2, 
  Trash2, HelpCircle, MessageSquare, Download, Play, 
  ArrowRight, FileCode, BookOpen, AlertCircle, RefreshCw,
  Plus, Check, X, Eye, Cpu
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
  fetchDocuments, uploadDocument, generateQuizFromDocument, 
  chatWithDocument, deleteDocument 
} from '../services/ollamaService';

export default function DocumentUploadHub({ onNavigateTo, currentCurriculum }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [activeQuizDoc, setActiveQuizDoc] = useState(null);
  const [activeChatDoc, setActiveChatDoc] = useState(null);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Quiz taking state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [quizScore, setQuizScore] = useState(null);

  // Chat with doc state
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    loadDocs();
  }, []);

  const loadDocs = async () => {
    setLoading(true);
    try {
      const data = await fetchDocuments();
      setDocuments(data.documents || []);
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file) => {
    if (!file) return;
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
      formData.append('curriculum', currentCurriculum || 'cs_c_dsa');

      await uploadDocument(formData);
      await loadDocs();
    } catch (err) {
      alert('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleGenerateQuiz = async (doc) => {
    setGeneratingQuiz(doc.id);
    try {
      const res = await generateQuizFromDocument(doc.id, 3);
      await loadDocs();
      // Open quiz viewer
      handleStartQuiz({ ...doc, quizzes: [...(doc.quizzes || []), ...(res.questions || [])] });
    } catch (err) {
      alert('Quiz generation failed: ' + err.message);
    } finally {
      setGeneratingQuiz(false);
    }
  };

  const handleStartQuiz = (doc) => {
    setActiveQuizDoc(doc);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setQuizScore(null);
  };

  const handleAnswerSelect = (optIndex) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [currentQuestionIndex]: optIndex
    }));
  };

  const handleSubmitQuiz = () => {
    const quizzes = activeQuizDoc.quizzes || [];
    let correctCount = 0;
    quizzes.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctIndex) {
        correctCount += 1;
      }
    });

    const percentage = Math.round((correctCount / quizzes.length) * 100);
    setQuizScore({ correctCount, total: quizzes.length, percentage });

    if (percentage >= 70) {
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    }
  };

  const handleOpenDocChat = (doc) => {
    setActiveChatDoc(doc);
    setChatMessages([
      {
        sender: 'ai',
        text: `Hello! I am your AI Coach grounded in **${doc.title}**.\n\nAsk me anything about the key concepts covered in this document, such as: ${(doc.keyConcepts || []).slice(0, 3).join(', ')}.`
      }
    ]);
  };

  const handleSendDocChat = async () => {
    if (!chatInput.trim() || chatLoading || !activeChatDoc) return;
    const q = chatInput;
    setChatInput('');

    const newMsgs = [...chatMessages, { sender: 'user', text: q }];
    setChatMessages(newMsgs);
    setChatLoading(true);

    try {
      const res = await chatWithDocument(activeChatDoc.id, q);
      setChatMessages([...newMsgs, { sender: 'ai', text: res.text, model: res.model }]);
    } catch (err) {
      setChatMessages([
        ...newMsgs,
        { sender: 'ai', text: `Failed to generate response: ${err.message}. Please verify the Ollama backend is running.` }
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleDelete = async (docId) => {
    if (confirm('Are you sure you want to delete this document?')) {
      await deleteDocument(docId);
      await loadDocs();
      if (activeQuizDoc?.id === docId) setActiveQuizDoc(null);
      if (activeChatDoc?.id === docId) setActiveChatDoc(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Hero Header ── */}
      <div className="hero-gps rounded-2xl p-6 border border-dark-700/50 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-2 mb-1.5">
              <span className="text-2xs font-mono text-cyan-400 uppercase tracking-wider font-semibold">
                Digital Classroom • Resource Sharing Hub
              </span>
              <span className="px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 font-mono text-2xs font-semibold">
                SIH 26207 Feature
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-display font-extrabold text-white flex items-center gap-2">
              <span>Document & Syllabus</span>
              <span className="text-cyan-400">Hub</span>
            </h1>
            <p className="text-xs text-slate-400 max-w-xl mt-1">
              Upload course PDFs, lecture slides, and notes. Ollama automatically extracts key concepts, generates adaptive 2PL-IRT quizzes, and enables document-grounded Socratic inquiry.
            </p>
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="btn-primary bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-glow-cyan text-xs py-2 px-4 flex items-center space-x-2 cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>{uploading ? 'Processing with AI...' : 'Upload Document'}</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
            accept=".pdf,.txt,.md,.docx,.c,.py,.cpp,.js,.json"
            className="hidden"
          />
        </div>
      </div>

      {/* ── Drag & Drop Upload Zone ── */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${
          dragActive
            ? 'border-cyan-400 bg-cyan-950/20'
            : 'border-dark-700/70 hover:border-dark-600 bg-dark-850/40 hover:bg-dark-850/70'
        }`}
      >
        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Upload className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-200">
              Drag and drop your course materials here, or <span className="text-cyan-400 underline">browse files</span>
            </p>
            <p className="text-2xs text-slate-500 mt-0.5 font-mono">
              Supports PDF, Markdown, TXT, Word (.docx), C/C++/Python code • Auto-parsed by Ollama
            </p>
          </div>
        </div>
      </div>

      {/* ── Uploaded Documents Grid ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center space-x-2">
            <BookOpen className="w-4 h-4 text-cyan-400" />
            <span>Knowledge Resources & Textbooks</span>
            <span className="text-2xs font-mono text-slate-500">({documents.length} loaded)</span>
          </h2>
          <button
            onClick={loadDocs}
            className="p-1.5 rounded-lg bg-dark-800 hover:bg-dark-700 border border-dark-700 text-slate-400 hover:text-white transition-colors cursor-pointer text-2xs flex items-center space-x-1"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500 font-mono">
            Loading document repository...
          </div>
        ) : documents.length === 0 ? (
          <div className="card p-8 text-center text-xs text-slate-400">
            No documents uploaded yet. Upload a syllabus or lecture PDF above to get started!
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="card-elevated p-5 flex flex-col justify-between space-y-4 hover:border-cyan-500/30 transition-all group"
              >
                <div>
                  {/* Top badges */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                        {doc.mimeType?.includes('pdf') ? <FileText className="w-4 h-4" /> : <FileCode className="w-4 h-4" />}
                      </span>
                      <div>
                        <h3 className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-1">
                          {doc.title}
                        </h3>
                        <p className="text-2xs text-slate-500 font-mono">
                          {doc.originalName} • {(doc.size / 1024).toFixed(0)} KB
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDelete(doc.id)}
                      title="Delete document"
                      className="p-1.5 rounded-lg hover:bg-rose-950/30 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Summary */}
                  <p className="text-2xs text-slate-300 line-clamp-2 leading-relaxed mb-3">
                    {doc.summary}
                  </p>

                  {/* Key concepts */}
                  {doc.keyConcepts && doc.keyConcepts.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {doc.keyConcepts.slice(0, 4).map((concept, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-dark-800 border border-dark-700/60 text-slate-400 text-2xs font-mono"
                        >
                          {concept}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="pt-3 border-t border-dark-700/50 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2 text-2xs text-slate-400 font-mono">
                    <span className="flex items-center space-x-1">
                      <BrainCircuit className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{doc.quizCount || 0} Quizzes</span>
                    </span>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    {/* Ask AI Coach button */}
                    <button
                      onClick={() => handleOpenDocChat(doc)}
                      className="px-2.5 py-1.5 rounded-lg bg-dark-800 hover:bg-dark-700 text-slate-300 hover:text-white border border-dark-700 text-2xs font-medium flex items-center space-x-1 transition-colors cursor-pointer"
                    >
                      <MessageSquare className="w-3 h-3 text-cyan-400" />
                      <span>Ask AI</span>
                    </button>

                    {/* Generate Quiz / Take Quiz button */}
                    {doc.quizCount > 0 ? (
                      <button
                        onClick={() => handleStartQuiz(doc)}
                        className="px-2.5 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-2xs font-semibold flex items-center space-x-1 transition-colors cursor-pointer"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Take Quiz</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleGenerateQuiz(doc)}
                        disabled={generatingQuiz === doc.id}
                        className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-2xs font-semibold flex items-center space-x-1 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <Sparkles className={`w-3 h-3 ${generatingQuiz === doc.id ? 'animate-spin' : ''}`} />
                        <span>{generatingQuiz === doc.id ? 'Generating...' : 'Gen Quiz'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Quiz Modal ── */}
      {activeQuizDoc && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-dark-900 border border-dark-700 rounded-2xl p-6 shadow-2xl relative">
            <button
              onClick={() => setActiveQuizDoc(null)}
              className="absolute right-4 top-4 p-1.5 rounded-lg bg-dark-800 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Quiz Header */}
            <div className="mb-4">
              <span className="text-2xs font-mono text-cyan-400 uppercase tracking-wider">
                Document Generated Quiz • 2PL-IRT Adaptive
              </span>
              <h3 className="text-base font-bold text-white mt-0.5">{activeQuizDoc.title}</h3>
              <p className="text-2xs text-slate-400">
                Question {currentQuestionIndex + 1} of {(activeQuizDoc.quizzes || []).length}
              </p>
            </div>

            {/* Quiz Body */}
            {quizScore ? (
              <div className="py-6 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto text-cyan-400">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white">Quiz Completed!</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    You scored <strong className="text-cyan-400">{quizScore.correctCount}</strong> out of{' '}
                    <strong>{quizScore.total}</strong> ({quizScore.percentage}%)
                  </p>
                </div>
                <div className="flex justify-center gap-2 pt-2">
                  <button
                    onClick={() => {
                      setQuizScore(null);
                      setCurrentQuestionIndex(0);
                      setSelectedAnswers({});
                    }}
                    className="btn-ghost text-xs"
                  >
                    Retake Quiz
                  </button>
                  <button onClick={() => setActiveQuizDoc(null)} className="btn-primary text-xs">
                    Done
                  </button>
                </div>
              </div>
            ) : (
              activeQuizDoc.quizzes && activeQuizDoc.quizzes[currentQuestionIndex] && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-dark-800 border border-dark-700/60 text-xs text-slate-200 leading-relaxed font-medium">
                    {activeQuizDoc.quizzes[currentQuestionIndex].question}
                  </div>

                  {/* Options */}
                  <div className="space-y-2">
                    {activeQuizDoc.quizzes[currentQuestionIndex].options?.map((opt, oIdx) => {
                      const isSelected = selectedAnswers[currentQuestionIndex] === oIdx;
                      return (
                        <button
                          key={oIdx}
                          onClick={() => handleAnswerSelect(oIdx)}
                          className={`w-full p-3 rounded-xl border text-xs text-left transition-all flex items-center space-x-3 cursor-pointer ${
                            isSelected
                              ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-200 font-semibold'
                              : 'bg-dark-850/80 border-dark-700/50 hover:bg-dark-800 text-slate-300'
                          }`}
                        >
                          <span
                            className={`w-6 h-6 rounded-lg flex items-center justify-center text-2xs font-mono font-bold shrink-0 ${
                              isSelected
                                ? 'bg-cyan-500 text-dark-950'
                                : 'bg-dark-750 text-slate-400 border border-dark-700'
                            }`}
                          >
                            {String.fromCharCode(65 + oIdx)}
                          </span>
                          <span className="flex-1">{opt}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Navigation Buttons */}
                  <div className="flex items-center justify-between pt-3 border-t border-dark-700">
                    <button
                      onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                      disabled={currentQuestionIndex === 0}
                      className="btn-ghost text-xs disabled:opacity-30"
                    >
                      Previous
                    </button>

                    {currentQuestionIndex < activeQuizDoc.quizzes.length - 1 ? (
                      <button
                        onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
                        className="btn-primary bg-cyan-600 hover:bg-cyan-500 text-white text-xs"
                      >
                        <span>Next</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        onClick={handleSubmitQuiz}
                        disabled={selectedAnswers[currentQuestionIndex] === undefined}
                        className="btn-primary bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xs disabled:opacity-40"
                      >
                        Submit & Grade
                      </button>
                    )}
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* ── Document Socratic Chat Drawer / Modal ── */}
      {activeChatDoc && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-dark-900 border border-dark-700 rounded-2xl flex flex-col h-[580px] shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-dark-700 flex items-center justify-between bg-dark-850">
              <div className="flex items-center space-x-2">
                <Cpu className="w-4 h-4 text-cyan-400" />
                <div>
                  <h3 className="text-xs font-bold text-white">{activeChatDoc.title}</h3>
                  <p className="text-2xs text-slate-400 font-mono">Grounded Ollama Coach</p>
                </div>
              </div>
              <button
                onClick={() => setActiveChatDoc(null)}
                className="p-1 rounded-lg hover:bg-dark-750 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-cyan-600 text-white rounded-br-sm'
                        : 'bg-dark-800 border border-dark-700/60 text-slate-200 rounded-bl-sm'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                    {msg.model && (
                      <span className="block mt-1.5 text-2xs text-slate-500 font-mono">
                        via {msg.model}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-dark-800 border border-dark-700 p-3 rounded-2xl text-2xs text-cyan-300 font-mono">
                    Consulting document with Ollama...
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input */}
            <div className="p-3 border-t border-dark-700 bg-dark-850">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendDocChat();
                }}
                className="flex items-center space-x-2"
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={`Ask a question grounded in ${activeChatDoc.title}...`}
                  disabled={chatLoading}
                  className="flex-1 bg-dark-800 border border-dark-700 rounded-xl px-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="submit"
                  disabled={chatLoading || !chatInput.trim()}
                  className="btn-primary bg-cyan-600 hover:bg-cyan-500 text-white text-xs px-3 py-2 disabled:opacity-40"
                >
                  Send
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
