"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const checkInController_1 = require("../controllers/checkInController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.use(auth_1.auth);
router.post('/log', checkInController_1.logAchievement);
router.get('/progress/:sheetId', checkInController_1.getSheetProgress);
router.put('/comment/:id', (0, auth_1.authorize)('MANAGER', 'ADMIN'), checkInController_1.addManagerComment);
router.put('/quarterly-feedback', (0, auth_1.authorize)('MANAGER', 'ADMIN'), checkInController_1.updateCheckInComment);
exports.default = router;
