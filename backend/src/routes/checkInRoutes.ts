import express from 'express';
import { logAchievement, addManagerComment, getSheetProgress, updateCheckInComment } from '../controllers/checkInController';
import { auth, authorize } from '../middleware/auth';

const router = express.Router();

router.use(auth);

router.post('/log', logAchievement);
router.get('/progress/:sheetId', getSheetProgress);
router.put('/comment/:id', authorize('MANAGER', 'ADMIN'), addManagerComment);
router.put('/quarterly-feedback', authorize('MANAGER', 'ADMIN'), updateCheckInComment);

export default router;