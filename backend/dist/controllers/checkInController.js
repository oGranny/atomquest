"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSheetProgress = exports.updateCheckInComment = exports.addManagerComment = exports.logAchievement = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const client_1 = require("@prisma/client");
const audit_1 = require("../lib/audit");
const logAchievement = async (req, res, next) => {
    try {
        const { goalId, quarter, actualAchievement, status, achievementDate, employeeComment } = req.body;
        const userId = req.user.userId;
        const existingCheckIn = await prisma_1.default.checkIn.findFirst({ where: { goalId, quarter } });
        const checkIn = await prisma_1.default.checkIn.upsert({
            where: {
                id: existingCheckIn?.id || 'new-id'
            },
            update: {
                actualAchievement: actualAchievement || 0,
                status,
                achievementDate: achievementDate ? new Date(achievementDate) : null,
                employeeComment
            },
            create: {
                goalId,
                quarter,
                actualAchievement: actualAchievement || 0,
                status,
                achievementDate: achievementDate ? new Date(achievementDate) : null,
                employeeComment
            }
        });
        await (0, audit_1.logAudit)(userId, 'CHECK_IN', checkIn.id, 'CheckIn', `Logged ${quarter} progress for goal`);
        const goal = await prisma_1.default.goal.findUnique({ where: { id: goalId }, include: { childGoals: true } });
        if (goal && goal.isShared && goal.childGoals.length > 0) {
            for (const childGoal of goal.childGoals) {
                const existingChildCheckIn = await prisma_1.default.checkIn.findFirst({ where: { goalId: childGoal.id, quarter } });
                await prisma_1.default.checkIn.upsert({
                    where: {
                        id: existingChildCheckIn?.id || 'new-id'
                    },
                    update: {
                        actualAchievement: checkIn.actualAchievement,
                        status: checkIn.status,
                        achievementDate: checkIn.achievementDate
                    },
                    create: {
                        goalId: childGoal.id,
                        quarter,
                        actualAchievement: checkIn.actualAchievement,
                        status: checkIn.status,
                        achievementDate: checkIn.achievementDate
                    }
                });
            }
        }
        res.json(checkIn);
    }
    catch (error) {
        next(error);
    }
};
exports.logAchievement = logAchievement;
const addManagerComment = async (req, res, next) => {
    try {
        const id = req.params.id;
        const { managerComment } = req.body;
        const checkIn = await prisma_1.default.checkIn.update({
            where: { id },
            data: { managerComment }
        });
        res.json(checkIn);
    }
    catch (error) {
        next(error);
    }
};
exports.addManagerComment = addManagerComment;
const updateCheckInComment = async (req, res, next) => {
    try {
        const { goalId, quarter, managerComment } = req.body;
        const existingCheckIn = await prisma_1.default.checkIn.findFirst({
            where: { goalId, quarter }
        });
        if (!existingCheckIn) {
            return res.status(404).json({ message: 'Check-in not found for this quarter' });
        }
        const updated = await prisma_1.default.checkIn.update({
            where: { id: existingCheckIn.id },
            data: { managerComment }
        });
        res.json(updated);
    }
    catch (error) {
        next(error);
    }
};
exports.updateCheckInComment = updateCheckInComment;
const getSheetProgress = async (req, res, next) => {
    try {
        const sheetId = req.params.sheetId;
        const goals = await prisma_1.default.goal.findMany({
            where: { goalSheetId: sheetId },
            include: { checkIns: true }
        });
        const progress = goals.map(goal => {
            const latestCheckIn = goal.checkIns[goal.checkIns.length - 1];
            let score = 0;
            if (latestCheckIn) {
                score = calculateScore(goal.uom, goal.direction, goal.target, latestCheckIn.actualAchievement ?? 0, goal.deadline, latestCheckIn.achievementDate);
            }
            return {
                goalId: goal.id,
                title: goal.title,
                uom: goal.uom,
                target: goal.target,
                weightage: goal.weightage,
                actual: latestCheckIn?.actualAchievement,
                status: latestCheckIn?.status,
                score: score * 100
            };
        });
        res.json(progress);
    }
    catch (error) {
        next(error);
    }
};
exports.getSheetProgress = getSheetProgress;
const calculateScore = (uom, direction, target, actual, deadline, achievementDate) => {
    switch (uom) {
        case 'NUMERIC':
        case 'PERCENTAGE':
            if (direction === client_1.GoalDirection.HIGHER_IS_BETTER) {
                return target === 0 ? 0 : actual / target;
            }
            else {
                // PDF: Max (Lower is Better) Formula: Target / Achievement
                return actual === 0 ? 1 : target / actual;
            }
        case 'ZERO_BASED':
            // Binary Success: 100% if actual matches the target benchmark (0 or 1)
            return actual === target ? 1 : 0;
        case 'TIMELINE':
            // PDF: Date-based completion. Completion date vs Deadline.
            if (!deadline || !achievementDate)
                return 0;
            return achievementDate <= deadline ? 1 : 0;
        default:
            return 0;
    }
};
