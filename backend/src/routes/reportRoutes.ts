import express from 'express';
import { getCompletionStats, getAuditTrail, getAchievementReport, getDepartmentalStats, getEscalationLogs, triggerManualJobs } from '../controllers/reportController';
import { auth, authorize } from '../middleware/auth';

const router = express.Router();

router.use(auth);

router.get('/completion', getCompletionStats);
router.get('/audit', getAuditTrail);
router.get('/achievement', getAchievementReport);
router.get('/departmental-stats', getDepartmentalStats);
router.get('/escalations', authorize('ADMIN'), getEscalationLogs);
router.post('/trigger-jobs', authorize('ADMIN'), triggerManualJobs);

export default router;