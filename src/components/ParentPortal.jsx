import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Smartphone, CheckCircle2, AlertTriangle, 
  Calendar, Clock, Award, BookOpen, Send, Lock, ArrowRight,
  User, Check, ChevronRight, MessageSquare, TrendingUp
} from 'lucide-react';
import { requestParentOtp, verifyParentOtp, sendParentFeedback } from '../services/ollamaService';

export default function ParentPortal() {
  const [phone, setPhone] = useState('9876543210');
  const [otp, setOtp] = useState('');
  const [otpRequested, setOtpRequested] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [demoCode, setDemoCode] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [studentData, setStudentData] = useState(null);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);

  // Auto-login for demo convenience or allow manual verification
  const handleRequestOtp = async () => {
    setOtpLoading(true);
    try {
      const res = await requestParentOtp(phone);
      setOtpRequested(true);
      setDemoCode(res.demoOtp || '482910');
      setOtp(res.demoOtp || '482910'); // prefill demo code for effortless 1-click test
    } catch (err) {
      alert('OTP Request Failed: ' + err.message);
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setOtpLoading(true);
    try {
      const res = await verifyParentOtp(phone, otp || '482910');
      setAuthenticated(true);
      setStudentData(res.student);
    } catch (err) {
      alert('Verification Failed: ' + err.message);
    } finally {
      setOtpLoading(false);
    }
  };

  const handleSendFeedback = async () => {
    if (!feedbackMsg.trim()) return;
    try {
      await sendParentFeedback(feedbackMsg, studentData?.mentor || 'Course Instructor');
      setFeedbackSent(true);
      setFeedbackMsg('');
      setTimeout(() => setFeedbackSent(false), 4000);
    } catch (err) {
      alert('Failed to send feedback: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Hero Header ── */}
      <div className="hero-practice rounded-2xl p-6 border border-dark-700/50 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-2 mb-1.5">
              <span className="text-2xs font-mono text-practice-400 uppercase tracking-wider font-semibold">
                Parent Gateway • Passwordless Secure Access
              </span>
              <span className="px-2 py-0.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 font-mono text-2xs font-semibold">
                SIH 26207 Feature
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-display font-extrabold text-white flex items-center gap-2">
              <span>Parent</span>
              <span className="text-practice-400">Portal</span>
            </h1>
            <p className="text-xs text-slate-400 max-w-xl mt-1">
              Real-time transparency into your ward's attendance, study hours, active learning streaks, and cognitive mastery model — authenticated with zero-password OTP.
            </p>
          </div>

          {authenticated && (
            <button
              onClick={() => { setAuthenticated(false); setOtpRequested(false); setOtp(''); }}
              className="btn-ghost text-xs text-slate-400 hover:text-white"
            >
              Sign Out
            </button>
          )}
        </div>
      </div>

      {/* ── Unauthenticated: OTP Login Flow ── */}
      {!authenticated ? (
        <div className="max-w-md mx-auto card-elevated p-6 space-y-5">
          <div className="text-center space-y-1">
            <div className="w-12 h-12 rounded-xl bg-practice-500/10 border border-practice-500/20 flex items-center justify-center mx-auto text-practice-400 mb-2">
              <Smartphone className="w-6 h-6" />
            </div>
            <h2 className="text-base font-bold text-white">Passwordless Parent Access</h2>
            <p className="text-2xs text-slate-400">
              Enter your registered Indian mobile number to receive a secure 6-digit access code.
            </p>
          </div>

          {!otpRequested ? (
            <div className="space-y-4">
              <div>
                <label className="text-2xs font-mono text-slate-400 block mb-1">Mobile Number (+91)</label>
                <div className="flex items-center space-x-2">
                  <span className="px-3 py-2 rounded-xl bg-dark-800 border border-dark-700 text-xs font-mono text-slate-400">
                    +91
                  </span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="98765 43210"
                    maxLength={10}
                    className="flex-1 bg-dark-800 border border-dark-700 rounded-xl px-4 py-2 text-xs text-white font-mono focus:outline-none focus:border-practice-500"
                  />
                </div>
              </div>

              <button
                onClick={handleRequestOtp}
                disabled={otpLoading || phone.length < 10}
                className="w-full btn-primary bg-gradient-to-r from-practice-500 to-practice-600 text-white shadow-glow-teal text-xs py-2.5 flex items-center justify-center space-x-2"
              >
                <span>{otpLoading ? 'Dispatching OTP...' : 'Send Secure Access Code'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-300 text-2xs font-mono flex items-center justify-between">
                <span>Demo Passcode: <strong>{demoCode}</strong></span>
                <span className="text-slate-400">Expires in 10m</span>
              </div>

              <div>
                <label className="text-2xs font-mono text-slate-400 block mb-1">6-Digit Passcode</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter 6-digit OTP"
                  maxLength={6}
                  className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-2 text-center text-base tracking-widest text-white font-mono focus:outline-none focus:border-practice-500"
                />
              </div>

              <button
                onClick={handleVerifyOtp}
                disabled={otpLoading || !otp}
                className="w-full btn-primary bg-gradient-to-r from-practice-500 to-practice-600 text-white shadow-glow-teal text-xs py-2.5 flex items-center justify-center space-x-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{otpLoading ? 'Verifying...' : 'Verify & Access Student Record'}</span>
              </button>

              <div className="text-center">
                <button
                  onClick={() => setOtpRequested(false)}
                  className="text-2xs text-slate-400 hover:text-slate-200 underline"
                >
                  Change Mobile Number
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ── Authenticated Student Record Dashboard ── */
        <div className="space-y-6 animate-fade-in">
          {/* Ward Summary Card */}
          <div className="card-elevated p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-practice-500 to-blue-600 flex items-center justify-center text-white font-bold text-base shadow-lg">
                AS
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-sm font-bold text-white">{studentData?.name}</h2>
                  <span className="px-2 py-0.5 rounded bg-dark-750 text-slate-400 border border-dark-700 font-mono text-2xs">
                    {studentData?.rollNo}
                  </span>
                </div>
                <p className="text-2xs text-slate-400 mt-0.5 font-mono">
                  {studentData?.curriculum} • {studentData?.institution}
                </p>
                <p className="text-2xs text-practice-400 mt-0.5">
                  Mentor: {studentData?.mentor}
                </p>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center space-x-4 bg-dark-850 border border-dark-700/60 px-4 py-2.5 rounded-xl font-mono text-xs">
              <div>
                <span className="text-2xs text-slate-500 block">Attendance</span>
                <span className="text-sm font-bold text-emerald-400">
                  {studentData?.attendance?.overallPercentage}%
                </span>
              </div>
              <div className="w-px h-8 bg-dark-700" />
              <div>
                <span className="text-2xs text-slate-500 block">Study Hours</span>
                <span className="text-sm font-bold text-practice-400">
                  {studentData?.metrics?.studyHoursThisWeek}h
                </span>
              </div>
              <div className="w-px h-8 bg-dark-700" />
              <div>
                <span className="text-2xs text-slate-500 block">Streak</span>
                <span className="text-sm font-bold text-amber-400">
                  🔥 {studentData?.metrics?.streakDays}d
                </span>
              </div>
            </div>
          </div>

          {/* Grid of Attendance & Progress */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Real-time Attendance Tracker */}
            <div className="card-elevated p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-dark-700">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-xs font-bold text-white">Verified Attendance Log</h3>
                </div>
                <span className="text-2xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Biometric & Session Active
                </span>
              </div>

              {/* Progress bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-2xs font-mono">
                  <span className="text-slate-400">Semester Attendance Threshold: 75%</span>
                  <span className="text-emerald-400 font-bold">{studentData?.attendance?.overallPercentage}% (Compliant)</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-dark-800 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-1000"
                    style={{ width: `${studentData?.attendance?.overallPercentage}%` }}
                  />
                </div>
                <div className="flex justify-between text-2xs text-slate-500 font-mono pt-1">
                  <span>{studentData?.attendance?.presentDays} Present</span>
                  <span>{studentData?.attendance?.excusedDays} Excused</span>
                  <span>{studentData?.attendance?.absentDays} Absent</span>
                </div>
              </div>

              {/* Recent class log */}
              <div className="space-y-2 pt-2">
                <span className="text-2xs font-mono text-slate-500 uppercase tracking-wider block">
                  Recent Classroom & Lab Sessions
                </span>
                <div className="space-y-1.5 max-h-48 overflow-y-auto scrollbar-none">
                  {studentData?.attendance?.recentLogins?.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-dark-850 border border-dark-700/60 text-2xs flex items-center justify-between font-mono"
                    >
                      <div>
                        <p className="text-slate-200 font-medium">{item.type}</p>
                        <p className="text-slate-500">{item.date} • {item.time}</p>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-0.5 rounded font-bold ${
                          item.status === 'Present'
                            ? 'bg-emerald-500/15 text-emerald-300'
                            : 'bg-amber-500/15 text-amber-300'
                        }`}>
                          {item.status}
                        </span>
                        <p className="text-slate-500 mt-0.5">{item.duration}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Cognitive Mastery & Strengths */}
            <div className="card-elevated p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-dark-700">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-practice-400" />
                  <h3 className="text-xs font-bold text-white">Cognitive Mastery Trajectory</h3>
                </div>
                <span className="text-2xs font-mono text-practice-400">BKT Model Active</span>
              </div>

              <div className="space-y-3">
                {studentData?.conceptStrengths?.map((concept, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-dark-850 border border-dark-700/60 space-y-1.5">
                    <div className="flex items-center justify-between text-2xs">
                      <span className="text-slate-200 font-semibold">{concept.name}</span>
                      <span className={`px-2 py-0.5 rounded font-mono font-bold ${
                        concept.category === 'green'
                          ? 'bg-emerald-500/15 text-emerald-300'
                          : concept.category === 'amber'
                          ? 'bg-amber-500/15 text-amber-300'
                          : 'bg-rose-500/15 text-rose-300'
                      }`}>
                        {concept.status} ({concept.score}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-dark-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          concept.category === 'green'
                            ? 'bg-emerald-400'
                            : concept.category === 'amber'
                            ? 'bg-amber-400'
                            : 'bg-rose-400'
                        }`}
                        style={{ width: `${concept.score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Instructor Remarks */}
              <div className="pt-2 border-t border-dark-700 space-y-2">
                <span className="text-2xs font-mono text-slate-500 uppercase tracking-wider block">
                  Faculty Observations
                </span>
                {studentData?.teacherRemarks?.map((rem, i) => (
                  <div key={i} className="p-3 rounded-xl bg-dark-800/60 border border-dark-700 text-2xs space-y-1">
                    <div className="flex justify-between text-slate-400 font-mono">
                      <span className="font-bold text-white">{rem.teacher}</span>
                      <span>{rem.date}</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed italic">"{rem.note}"</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Direct Parent-Teacher Communication Channel */}
          <div className="card-elevated p-5 space-y-3">
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-4 h-4 text-practice-400" />
              <h3 className="text-xs font-bold text-white">Direct Message to Faculty Mentor</h3>
            </div>
            <p className="text-2xs text-slate-400">
              Have questions regarding Aarav's academic progress or upcoming lab exams? Send a direct note to {studentData?.mentor}.
            </p>

            {feedbackSent && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2 animate-fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Message dispatched to faculty mentor. An SMS confirmation was sent to your registered number.</span>
              </div>
            )}

            <div className="flex gap-2">
              <input
                type="text"
                value={feedbackMsg}
                onChange={(e) => setFeedbackMsg(e.target.value)}
                placeholder={`Ask ${studentData?.mentor} a question regarding Aarav's progress...`}
                className="flex-1 bg-dark-800 border border-dark-700 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-practice-500"
              />
              <button
                onClick={handleSendFeedback}
                disabled={!feedbackMsg.trim()}
                className="btn-primary bg-gradient-to-r from-practice-500 to-practice-600 text-white text-xs px-4 py-2 flex items-center space-x-1.5 disabled:opacity-40 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
