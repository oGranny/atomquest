import express from 'express';
import { login, register, getMe, getPublicManagers, getAllUsers, updateUserRole } from '../controllers/authController';
import { auth, authorize } from '../middleware/auth';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/managers', getPublicManagers);
router.get('/all-users', auth, authorize('ADMIN'), getAllUsers);
router.put('/update-role', auth, authorize('ADMIN'), updateUserRole);
router.get('/me', auth, getMe);

export default router;