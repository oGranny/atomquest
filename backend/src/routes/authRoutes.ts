import express from 'express';
import { login, register, getMe, getPublicManagers } from '../controllers/authController';
import { auth } from '../middleware/auth';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/managers', getPublicManagers);
router.get('/me', auth, getMe);

export default router;