"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const error_1 = require("./middleware/error");
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const goalRoutes_1 = __importDefault(require("./routes/goalRoutes"));
const checkInRoutes_1 = __importDefault(require("./routes/checkInRoutes"));
const reportRoutes_1 = __importDefault(require("./routes/reportRoutes"));
const reminderJob_1 = require("./jobs/reminderJob");
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 5000;
app.use((0, cors_1.default)());
app.use((0, helmet_1.default)());
app.use((0, morgan_1.default)('dev'));
app.use(express_1.default.json());
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'AtomQuest API is running' });
});
app.use('/api/auth', authRoutes_1.default);
app.use('/api/goals', goalRoutes_1.default);
app.use('/api/checkins', checkInRoutes_1.default);
app.use('/api/reports', reportRoutes_1.default);
app.use(error_1.errorHandler);
// Initialize background jobs
(0, reminderJob_1.initReminderJob)();
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
