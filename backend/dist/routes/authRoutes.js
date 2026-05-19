"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authController_1 = require("../controllers/authController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.post('/register', authController_1.register);
router.post('/login', authController_1.login);
router.get('/managers', authController_1.getPublicManagers);
router.get('/all-users', auth_1.auth, (0, auth_1.authorize)('ADMIN'), authController_1.getAllUsers);
router.put('/update-role', auth_1.auth, (0, auth_1.authorize)('ADMIN'), authController_1.updateUserRole);
router.get('/me', auth_1.auth, authController_1.getMe);
exports.default = router;
