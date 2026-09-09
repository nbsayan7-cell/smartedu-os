import { Router } from 'express';

const router = Router();

// In-memory activity log store
const activityLogs = [
  { id: 'act-1', timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), type: 'NAVIGATE', label: 'Accessed Knowledge X-Ray graph', metadata: { curriculum: 'cs_c_dsa' } },
  { id: 'act-2', timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(), type: 'TUTOR_QUERY', label: 'Consulted Socratic Coach on Pointers', metadata: { mode: 'SOCRATIC', tokens: 200 } },
  { id: 'act-3', timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), type: 'PRACTICE_SUBMIT', label: 'Completed Adaptive Question on Dereferencing', metadata: { correct: true, delta: '+14%' } }
];

let sessionStartTime = Date.now();
let totalInteractions = 24;

/**
 * POST /api/activity/log — Log an activity event
 */
router.post('/log', (req, res) => {
  const { type = 'USER_INTERACTION', label = 'User action', metadata = {} } = req.body;
  
  totalInteractions += 1;
  const newLog = {
    id: `act-${Date.now()}`,
    timestamp: new Date().toISOString(),
    type,
    label,
    metadata
  };

  activityLogs.unshift(newLog);
  if (activityLogs.length > 50) activityLogs.pop();

  res.json({ success: true, logged: newLog, totalInteractions });
});

/**
 * GET /api/activity/stats — Return aggregated activity capture metrics
 */
router.get('/stats', (req, res) => {
  const activeMinutes = Math.max(1, Math.round((Date.now() - sessionStartTime) / (1000 * 60)));

  res.json({
    activeMinutes,
    totalInteractions,
    streakDays: 14,
    deviceInputsLogged: totalInteractions * 3,
    recentEvents: activityLogs.slice(0, 10),
    centralLogicStatus: 'Active & Calibrated'
  });
});

export default router;
