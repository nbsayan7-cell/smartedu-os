import { Router } from 'express';

const router = Router();

// In-memory OTP storage for demo
const activeOtps = new Map();

// Student Profile for Parent View
const STUDENT_PROFILE = {
  name: 'Aarav Sharma',
  rollNo: '22CS104',
  institution: 'Bangalore Institute of Technology (VTU Affiliated)',
  curriculum: 'Computer Science & Engineering (Semester 4)',
  mentor: 'Prof. Ramesh Kulkarni',
  attendance: {
    overallPercentage: 94.2,
    presentDays: 45,
    absentDays: 2,
    excusedDays: 1,
    totalClasses: 48,
    recentLogins: [
      { date: '2026-03-09', time: '08:45 AM', type: 'Lab Session — C Data Structures', status: 'Present', duration: '2h 15m' },
      { date: '2026-03-08', time: '10:00 AM', type: 'Lecture — Engineering Physics', status: 'Present', duration: '1h 00m' },
      { date: '2026-03-07', time: '09:15 AM', type: 'Adaptive Practice Session', status: 'Present', duration: '1h 45m' },
      { date: '2026-03-06', time: '11:00 AM', type: 'Virtual Classroom — Algorithms', status: 'Present', duration: '1h 30m' },
      { date: '2026-03-05', time: '02:00 PM', type: 'Hands-on Project Proof Session', status: 'Present', duration: '3h 10m' },
      { date: '2026-03-04', time: '09:00 AM', type: 'Theory Lecture — OS & Hardware', status: 'Excused', duration: '0m' },
    ]
  },
  metrics: {
    studyHoursThisWeek: 28.5,
    targetHours: 25.0,
    streakDays: 14,
    questionsAttempted: 142,
    accuracyRate: 84.5,
    bktMasteryAverage: 76.8
  },
  conceptStrengths: [
    { name: 'Pointers & Dereferencing', status: 'Mastered', score: 88, category: 'green' },
    { name: 'Memory Allocation (malloc/free)', status: 'Developing', score: 68, category: 'amber' },
    { name: 'Singly & Doubly Linked Lists', status: 'Mastered', score: 92, category: 'green' },
    { name: 'Wave Optics & Diffraction', status: 'Needs Review', score: 58, category: 'rose' }
  ],
  teacherRemarks: [
    {
      date: '2026-03-08',
      teacher: 'Prof. Ramesh Kulkarni',
      subject: 'CS201 Data Structures',
      note: 'Aarav has shown remarkable persistence in Teach-Back mode. His understanding of pointer scaling in memory is solid.'
    },
    {
      date: '2026-03-01',
      teacher: 'Dr. Priya Sundaram',
      subject: 'PH101 Engineering Physics',
      note: 'Recommended spending 20 minutes reviewing central maximum diffraction width before the unit assessment.'
    }
  ]
};

/**
 * POST /api/parent/request-otp — Send passwordless OTP
 */
router.post('/request-otp', (req, res) => {
  const { phone = '9876543210' } = req.body;
  const cleanPhone = phone.replace(/[^0-9]/g, '');

  if (cleanPhone.length < 10) {
    return res.status(400).json({ error: 'Please enter a valid 10-digit mobile number' });
  }

  // Generate 6-digit OTP
  const generatedOtp = '482910'; // Deterministic for easy hackathon demo verification
  activeOtps.set(cleanPhone, {
    otp: generatedOtp,
    expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes
  });

  res.json({
    success: true,
    message: `Secure one-time passcode dispatched to +91 ******${cleanPhone.slice(-4)}`,
    demoOtp: generatedOtp,
    phone: cleanPhone
  });
});

/**
 * POST /api/parent/verify-otp — Verify OTP and return student snapshot
 */
router.post('/verify-otp', (req, res) => {
  const { phone = '9876543210', otp } = req.body;
  const cleanPhone = phone.replace(/[^0-9]/g, '');

  if (!otp) {
    return res.status(400).json({ error: 'One-time passcode is required' });
  }

  // Accept 482910 or stored OTP for demo
  const record = activeOtps.get(cleanPhone);
  if (otp === '482910' || (record && record.otp === otp)) {
    return res.json({
      success: true,
      verified: true,
      authToken: `p-jwt-${Date.now()}`,
      student: STUDENT_PROFILE
    });
  }

  res.status(401).json({ error: 'Invalid or expired OTP. Please use the demo code 482910.' });
});

/**
 * GET /api/parent/attendance — Detailed attendance data
 */
router.get('/attendance', (req, res) => {
  res.json({
    success: true,
    studentName: STUDENT_PROFILE.name,
    attendance: STUDENT_PROFILE.attendance
  });
});

/**
 * GET /api/parent/reports — Cognitive progress report
 */
router.get('/reports', (req, res) => {
  res.json({
    success: true,
    studentName: STUDENT_PROFILE.name,
    metrics: STUDENT_PROFILE.metrics,
    conceptStrengths: STUDENT_PROFILE.conceptStrengths,
    teacherRemarks: STUDENT_PROFILE.teacherRemarks
  });
});

/**
 * POST /api/parent/feedback — Send note to instructor
 */
router.post('/feedback', (req, res) => {
  const { message, teacher = 'Prof. Ramesh Kulkarni' } = req.body;
  if (!message) return res.status(400).json({ error: 'Message cannot be blank' });

  res.json({
    success: true,
    message: `Message dispatched directly to ${teacher}. You will receive an SMS acknowledgement.`
  });
});

export default router;
