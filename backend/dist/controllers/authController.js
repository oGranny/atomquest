"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMe = exports.login = exports.register = exports.getPublicManagers = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = __importDefault(require("../lib/prisma"));
const JWT_SECRET = process.env.JWT_SECRET || 'hackathon-secret-key';
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
        const { email, password, name, role, managerId } = req.body;
        const existingUser = await prisma_1.default.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }
        const user = await prisma_1.default.user.create({
            data: {
                email,
                name,
                role: 'EMPLOYEE',
                managerId: managerId && managerId !== "" ? managerId : null,
            },
        });
        res.status(201).json({ message: 'User created successfully', user });
    }
    catch (error) {
        next(error);
    }
};
exports.register = register;
const login = async (req, res, next) => {
    try {
        const { email } = req.body;
        const user = await prisma_1.default.user.findUnique({
            where: { email },
            include: { manager: true }
        });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const token = jsonwebtoken_1.default.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
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
