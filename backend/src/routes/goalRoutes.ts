import express from 'express';
import { 
  createGoalSheet, 
  addGoal, 
  submitGoalSheet, 
  getMyGoalSheets, 
  deleteGoal,
  getPendingApprovals,
  getApprovedSubordinates,
  approveGoalSheet,
  returnGoalSheet,
  updateGoal,
  pushSharedGoal,
  unlockGoalSheet,
  getSubordinates,
  deleteGoalSheet,
  getAdminRoster
} from '../controllers/goalController';
import { auth, authorize } from '../middleware/auth';

const router = express.Router();

router.use(auth);

router.get('/my-sheets', getMyGoalSheets);
router.get('/subordinates', getSubordinates);
router.post('/sheet', createGoalSheet);
router.delete('/sheet/:id', deleteGoalSheet);
router.post('/goal', addGoal);
router.put('/goal/:id', updateGoal);
router.delete('/goal/:id', deleteGoal);
router.post('/submit/:id', submitGoalSheet);

// Manager routes
router.get('/pending', getPendingApprovals);
router.get('/approved-subordinates', getApprovedSubordinates);
router.post('/approve/:id', approveGoalSheet);
router.post('/return/:id', returnGoalSheet);
router.post('/push-shared', authorize('MANAGER', 'ADMIN'), pushSharedGoal);

// Admin routes
router.get('/admin-roster', authorize('ADMIN'), getAdminRoster);
router.post('/unlock/:id', authorize('ADMIN'), unlockGoalSheet);

export default router;