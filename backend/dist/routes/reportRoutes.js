"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const reportController_1 = require("../controllers/reportController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.use(auth_1.auth);
router.get('/completion', reportController_1.getCompletionStats);
router.get('/audit', reportController_1.getAuditTrail);
router.get('/achievement', reportController_1.getAchievementReport);
router.get('/departmental-stats', reportController_1.getDepartmentalStats);
router.get('/escalations', (0, auth_1.authorize)('ADMIN'), reportController_1.getEscalationLogs);
router.post('/trigger-jobs', (0, auth_1.authorize)('ADMIN'), reportController_1.triggerManualJobs);
exports.default = router;
