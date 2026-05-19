"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const analyticsController_1 = require("../controllers/analyticsController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.use(auth_1.auth);
router.use((0, auth_1.authorize)('ADMIN', 'MANAGER'));
router.get('/distribution', analyticsController_1.getGoalDistribution);
router.get('/trends', analyticsController_1.getQuarterlyTrends);
router.get('/managers', analyticsController_1.getManagerEffectiveness);
exports.default = router;
