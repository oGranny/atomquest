import express from 'express';
import { getGoalDistribution, getQuarterlyTrends, getManagerEffectiveness } from '../controllers/analyticsController';
import { auth, authorize } from '../middleware/auth';

const router = express.Router();

router.use(auth);
router.use(authorize('ADMIN', 'MANAGER'));

router.get('/distribution', getGoalDistribution);
router.get('/trends', getQuarterlyTrends);
router.get('/managers', getManagerEffectiveness);

export default router;