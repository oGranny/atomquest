"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateGoal = exports.getAdminRoster = exports.unlockGoalSheet = exports.pushSharedGoal = exports.getSubordinates = exports.getApprovedSubordinates = exports.returnGoalSheet = exports.approveGoalSheet = exports.getPendingApprovals = exports.deleteGoalSheet = exports.deleteGoal = exports.getMyGoalSheets = exports.submitGoalSheet = exports.addGoal = exports.createGoalSheet = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const client_1 = require("@prisma/client");
const audit_1 = require("../lib/audit");
const emailService_1 = require("../lib/emailService");
const createGoalSheet = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { cycleYear } = req.body;
        const existingSheet = await prisma_1.default.goalSheet.findFirst({
            where: { userId, cycleYear, status: { not: client_1.GoalSheetStatus.RETURNED } }
        });
        if (existingSheet && existingSheet.status !== client_1.GoalSheetStatus.DRAFT) {
            return res.status(400).json({ message: 'Active goal sheet already exists for this cycle' });
        }
        const goalSheet = await prisma_1.default.goalSheet.create({
            data: {
                userId,
                cycleYear,
                status: client_1.GoalSheetStatus.DRAFT
            }
        });
        res.status(201).json(goalSheet);
    }
    catch (error) {
        next(error);
    }
};
exports.createGoalSheet = createGoalSheet;
const addGoal = async (req, res, next) => {
    try {
        const { goalSheetId, thrustArea, title, description, uom, direction, target, weightage, deadline } = req.body;
        const goalSheet = await prisma_1.default.goalSheet.findUnique({
            where: { id: goalSheetId },
            include: {
                goals: {
                    orderBy: { createdAt: 'asc' }
                }
            }
        });
        if (!goalSheet)
            return res.status(404).json({ message: 'Goal sheet not found' });
        if (goalSheet.status !== client_1.GoalSheetStatus.DRAFT && goalSheet.status !== client_1.GoalSheetStatus.RETURNED) {
            return res.status(400).json({ message: 'Cannot edit goals in current status' });
        }
        if (goalSheet.goals.length >= 8) {
            return res.status(400).json({ message: 'Maximum 8 goals allowed' });
        }
        if (weightage < 10) {
            return res.status(400).json({ message: 'Minimum weightage per goal is 10%' });
        }
        const goal = await prisma_1.default.goal.create({
            data: {
                goalSheet: { connect: { id: goalSheetId } },
                thrustArea,
                title,
                description,
                uom,
                direction: direction || 'HIGHER_IS_BETTER',
                target: target || 0,
                weightage,
                deadline: deadline ? new Date(deadline) : null
            }
        });
        res.status(201).json(goal);
    }
    catch (error) {
        next(error);
    }
};
exports.addGoal = addGoal;
const submitGoalSheet = async (req, res, next) => {
    try {
        const id = req.params.id;
        const goalSheet = await prisma_1.default.goalSheet.findUnique({
            where: { id },
            include: {
                user: {
                    include: { manager: true }
                },
                goals: {
                    orderBy: { createdAt: 'asc' }
                }
            }
        });
        if (!goalSheet)
            return res.status(404).json({ message: 'Goal sheet not found' });
        const totalWeightage = goalSheet.goals.reduce((sum, g) => sum + g.weightage, 0);
        if (totalWeightage !== 100) {
            return res.status(400).json({ message: `Total weightage must be 100% (currently ${totalWeightage}%)` });
        }
        const updatedSheet = await prisma_1.default.goalSheet.update({
            where: { id },
            data: { status: client_1.GoalSheetStatus.SUBMITTED }
        });
        // Trigger Email to Manager
        if (goalSheet.user.manager?.email) {
            (0, emailService_1.sendSubmissionEmail)(goalSheet.user.manager.email, goalSheet.user.name, id).catch(console.error);
        }
        res.json(updatedSheet);
    }
    catch (error) {
        next(error);
    }
};
exports.submitGoalSheet = submitGoalSheet;
const getMyGoalSheets = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const sheets = await prisma_1.default.goalSheet.findMany({
            where: { userId },
            include: {
                goals: {
                    include: { checkIns: true },
                    orderBy: { createdAt: 'asc' }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(sheets);
    }
    catch (error) {
        next(error);
    }
};
exports.getMyGoalSheets = getMyGoalSheets;
const deleteGoal = async (req, res, next) => {
    try {
        const id = req.params.id;
        const goal = await prisma_1.default.goal.findUnique({
            where: { id },
            include: { goalSheet: true }
        });
        if (!goal)
            return res.status(404).json({ message: 'Goal not found' });
        if (goal.goalSheet.status !== client_1.GoalSheetStatus.DRAFT && goal.goalSheet.status !== client_1.GoalSheetStatus.RETURNED) {
            return res.status(400).json({ message: 'Cannot delete goal in current status' });
        }
        await prisma_1.default.goal.delete({ where: { id } });
        res.json({ message: 'Goal deleted' });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteGoal = deleteGoal;
const deleteGoalSheet = async (req, res, next) => {
    try {
        const id = req.params.id;
        const goalSheet = await prisma_1.default.goalSheet.findUnique({
            where: { id }
        });
        if (!goalSheet)
            return res.status(404).json({ message: 'Goal sheet not found' });
        if (goalSheet.status !== client_1.GoalSheetStatus.DRAFT && goalSheet.status !== client_1.GoalSheetStatus.RETURNED) {
            return res.status(400).json({ message: 'Cannot delete goal sheet in current status' });
        }
        await prisma_1.default.goal.deleteMany({ where: { goalSheetId: id } });
        await prisma_1.default.goalSheet.delete({ where: { id } });
        res.json({ message: 'Goal sheet and associated goals deleted' });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteGoalSheet = deleteGoalSheet;
const getPendingApprovals = async (req, res, next) => {
    try {
        const user = req.user;
        const where = { status: client_1.GoalSheetStatus.SUBMITTED };
        if (user.role !== client_1.Role.ADMIN) {
            where.user = { managerId: user.userId };
        }
        const pendingSheets = await prisma_1.default.goalSheet.findMany({
            where,
            include: {
                user: true,
                goals: {
                    include: { checkIns: true },
                    orderBy: { createdAt: 'asc' }
                }
            }
        });
        res.json(pendingSheets);
    }
    catch (error) {
        next(error);
    }
};
exports.getPendingApprovals = getPendingApprovals;
const approveGoalSheet = async (req, res, next) => {
    try {
        const id = req.params.id;
        const userId = req.user.userId;
        const goalSheet = await prisma_1.default.goalSheet.findUnique({
            where: { id },
            include: { user: true }
        });
        const updatedSheet = await prisma_1.default.goalSheet.update({
            where: { id },
            data: { status: client_1.GoalSheetStatus.APPROVED }
        });
        await (0, audit_1.logAudit)(userId, 'APPROVE', id, 'GoalSheet', 'Manager/Admin approved goal sheet');
        // Trigger Email to Employee
        if (goalSheet?.user.email) {
            (0, emailService_1.sendApprovalEmail)(goalSheet.user.email, goalSheet.user.name).catch(console.error);
        }
        res.json(updatedSheet);
    }
    catch (error) {
        next(error);
    }
};
exports.approveGoalSheet = approveGoalSheet;
const returnGoalSheet = async (req, res, next) => {
    try {
        const id = req.params.id;
        const { revisionComment } = req.body;
        const goalSheet = await prisma_1.default.goalSheet.findUnique({
            where: { id },
            include: { user: true }
        });
        const updatedSheet = await prisma_1.default.goalSheet.update({
            where: { id },
            data: {
                status: client_1.GoalSheetStatus.RETURNED,
                revisionComment: revisionComment || null
            }
        });
        // Trigger Email to Employee
        if (goalSheet?.user.email) {
            (0, emailService_1.sendRejectionEmail)(goalSheet.user.email, goalSheet.user.name, revisionComment || 'No specific comments provided.').catch(console.error);
        }
        res.json(updatedSheet);
    }
    catch (error) {
        next(error);
    }
};
exports.returnGoalSheet = returnGoalSheet;
const getApprovedSubordinates = async (req, res, next) => {
    try {
        const user = req.user;
        const where = { status: client_1.GoalSheetStatus.APPROVED };
        if (user.role !== client_1.Role.ADMIN) {
            where.user = { managerId: user.userId };
        }
        const sheets = await prisma_1.default.goalSheet.findMany({
            where,
            include: {
                user: true,
                goals: {
                    include: { checkIns: true },
                    orderBy: { createdAt: 'asc' }
                }
            }
        });
        res.json(sheets);
    }
    catch (error) {
        next(error);
    }
};
exports.getApprovedSubordinates = getApprovedSubordinates;
const getSubordinates = async (req, res, next) => {
    try {
        const user = req.user;
        const where = {};
        if (user.role !== client_1.Role.ADMIN) {
            where.managerId = user.userId;
        }
        else {
            where.id = { not: user.userId };
        }
        const subordinates = await prisma_1.default.user.findMany({
            where,
            select: { id: true, name: true, email: true }
        });
        res.json(subordinates);
    }
    catch (error) {
        next(error);
    }
};
exports.getSubordinates = getSubordinates;
const pushSharedGoal = async (req, res, next) => {
    try {
        const { employeeIds, thrustArea, title, description, uom, target, weightage, cycleYear, deadline } = req.body;
        for (const empId of employeeIds) {
            const sheet = await prisma_1.default.goalSheet.findFirst({
                where: { userId: empId, cycleYear, status: { not: client_1.GoalSheetStatus.APPROVED } }
            });
            if (sheet) {
                await prisma_1.default.goal.create({
                    data: {
                        goalSheet: { connect: { id: sheet.id } },
                        thrustArea,
                        title,
                        description,
                        uom,
                        target: target || 0,
                        weightage,
                        isShared: true,
                        deadline: deadline ? new Date(deadline) : null
                    }
                });
            }
        }
        res.json({ message: 'Shared goal pushed successfully' });
    }
    catch (error) {
        next(error);
    }
};
exports.pushSharedGoal = pushSharedGoal;
const unlockGoalSheet = async (req, res, next) => {
    try {
        const id = req.params.id;
        const userId = req.user.userId;
        const updatedSheet = await prisma_1.default.goalSheet.update({
            where: { id },
            data: { status: client_1.GoalSheetStatus.DRAFT }
        });
        await (0, audit_1.logAudit)(userId, 'UNLOCK', id, 'GoalSheet', 'Admin unlocked goal sheet for editing');
        res.json(updatedSheet);
    }
    catch (error) {
        next(error);
    }
};
exports.unlockGoalSheet = unlockGoalSheet;
const getAdminRoster = async (req, res, next) => {
    try {
        const sheets = await prisma_1.default.goalSheet.findMany({
            include: {
                user: true,
                goals: {
                    include: { checkIns: true },
                    orderBy: { createdAt: 'asc' }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(sheets);
    }
    catch (error) {
        next(error);
    }
};
exports.getAdminRoster = getAdminRoster;
const updateGoal = async (req, res, next) => {
    try {
        const id = req.params.id;
        const { thrustArea, title, description, uom, direction, target, weightage, deadline } = req.body;
        const goal = await prisma_1.default.goal.findUnique({
            where: { id },
            include: { goalSheet: true }
        });
        if (!goal)
            return res.status(404).json({ message: 'Goal not found' });
        const userRole = req.user.role;
        if (userRole === 'MANAGER' && goal.goalSheet.status !== client_1.GoalSheetStatus.SUBMITTED) {
            return res.status(400).json({ message: 'Can only edit submitted goals' });
        }
        if (userRole === 'EMPLOYEE' && goal.goalSheet.status !== client_1.GoalSheetStatus.DRAFT && goal.goalSheet.status !== client_1.GoalSheetStatus.RETURNED) {
            return res.status(400).json({ message: 'Cannot edit goals in current status' });
        }
        const updatedGoal = await prisma_1.default.goal.update({
            where: { id },
            data: {
                thrustArea,
                title,
                description,
                uom,
                direction: direction || goal.direction,
                target: target || 0,
                weightage,
                deadline: deadline ? new Date(deadline) : (deadline === null ? null : goal.deadline)
            }
        });
        if (goal.goalSheet.status === client_1.GoalSheetStatus.APPROVED) {
            const userId = req.user.userId;
            await (0, audit_1.logAudit)(userId, 'UPDATE_AFTER_LOCK', id, 'Goal', `Updated goal after approval: ${title}`);
        }
        res.json(updatedGoal);
    }
    catch (error) {
        next(error);
    }
};
exports.updateGoal = updateGoal;
