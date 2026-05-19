"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMe = exports.login = exports.register = exports.getPublicManagers = exports.updateUserRole = exports.getAllUsers = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = __importDefault(require("../lib/prisma"));
const JWT_SECRET = process.env.JWT_SECRET || 'hackathon-secret-key';
const getAllUsers = async (req, res, next) => {
    try {
        const users = await prisma_1.default.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true
            },
            orderBy: { name: 'asc' }
        });
        res.json(users);
    }
    catch (error) {
        next(error);
    }
};
exports.getAllUsers = getAllUsers;
const updateUserRole = async (req, res, next) => {
    try {
        const { userId, role } = req.body;
        if (!['EMPLOYEE', 'MANAGER', 'ADMIN'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role' });
        }
        const updatedUser = await prisma_1.default.user.update({
            where: { id: userId },
            data: { role }
        });
        res.json(updatedUser);
    }
    catch (error) {
        next(error);
    }
};
exports.updateUserRole = updateUserRole;
const getPublicManagers = async (req, res, next) => {
    try {
        const managers = await prisma_1.default.user.findMany({
            where: {
                role: { in: ['MANAGER', 'ADMIN'] }
            },
            select: {
                id: true,
                name: true
            },
            orderBy: { name: 'asc' }
        });
        res.json(managers);
    }
    catch (error) {
        next(error);
    }
};
exports.getPublicManagers = getPublicManagers;
const register = async (req, res, next) => {
    try {
        const { email, name, password, managerId } = req.body;
        if (!password) {
            return res.status(400).json({ message: 'Password is required' });
        }
        const existingUser = await prisma_1.default.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }
        // Strict Data Normalization for Manager ID
        let finalManagerId = null;
        if (managerId && typeof managerId === 'string' && managerId !== "" && managerId !== "null" && managerId !== "undefined") {
            const managerExists = await prisma_1.default.user.findUnique({ where: { id: managerId } });
            if (managerExists) {
                finalManagerId = managerId;
            }
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const user = await prisma_1.default.user.create({
            data: {
                email,
                name,
                password: hashedPassword,
                role: 'EMPLOYEE',
                managerId: finalManagerId,
            },
        });
        res.status(201).json({ message: 'User created successfully', user: { id: user.id, email: user.email, name: user.name } });
    }
    catch (error) {
        console.error('Registration internal failure:', error);
        next(error);
    }
};
exports.register = register;
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }
        const user = await prisma_1.default.user.findUnique({
            where: { email },
            include: { manager: true }
        });
        if (!user || !user.password) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const isPasswordValid = await bcryptjs_1.default.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const token = jsonwebtoken_1.default.sign({ userId: user.id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: '1d' });
        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                managerId: user.managerId,
                managerName: user.manager?.name
            }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.login = login;
const getMe = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            include: { manager: true }
        });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            managerId: user.managerId,
            managerName: user.manager?.name
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getMe = getMe;
