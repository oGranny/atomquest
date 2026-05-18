import express from 'express';
import { getAchievementReport, getCompletionStats, getAuditTrail, getDepartmentalStats } from '../controllers/reportController';
import { auth, authorize } from '../middleware/auth';

const router = express.Router();

router.use(auth, authorize('ADMIN'));

router.get('/achievement', getAchievementReport);
router.get('/completion', getCompletionStats);
router.get('/audit', getAuditTrail);
router.get('/departmental-stats', getDepartmentalStats);

export default router;