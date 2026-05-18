"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const goalController_1 = require("../controllers/goalController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.use(auth_1.auth);
router.get('/my-sheets', goalController_1.getMyGoalSheets);
router.get('/subordinates', goalController_1.getSubordinates);
router.post('/sheet', goalController_1.createGoalSheet);
router.delete('/sheet/:id', goalController_1.deleteGoalSheet);
router.post('/goal', goalController_1.addGoal);
router.put('/goal/:id', goalController_1.updateGoal);
router.delete('/goal/:id', goalController_1.deleteGoal);
router.post('/submit/:id', goalController_1.submitGoalSheet);
// Manager routes
router.get('/pending', goalController_1.getPendingApprovals);
router.get('/approved-subordinates', goalController_1.getApprovedSubordinates);
router.post('/approve/:id', goalController_1.approveGoalSheet);
router.post('/return/:id', goalController_1.returnGoalSheet);
router.post('/push-shared', (0, auth_1.authorize)('MANAGER', 'ADMIN'), goalController_1.pushSharedGoal);
// Admin routes
router.get('/admin-roster', (0, auth_1.authorize)('ADMIN'), goalController_1.getAdminRoster);
router.post('/unlock/:id', (0, auth_1.authorize)('ADMIN'), goalController_1.unlockGoalSheet);
exports.default = router;
