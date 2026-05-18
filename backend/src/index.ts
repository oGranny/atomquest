import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

import { errorHandler } from './middleware/error';
import authRoutes from './routes/authRoutes';
import goalRoutes from './routes/goalRoutes';
import checkInRoutes from './routes/checkInRoutes';
import reportRoutes from './routes/reportRoutes';
import { initReminderJob } from './jobs/reminderJob';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'AtomQuest API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/checkins', checkInRoutes);
app.use('/api/reports', reportRoutes);

app.use(errorHandler);

// Initialize background jobs
initReminderJob();

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});