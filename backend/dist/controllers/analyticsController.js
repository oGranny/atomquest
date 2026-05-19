"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getManagerEffectiveness = exports.getQuarterlyTrends = exports.getGoalDistribution = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const client_1 = require("@prisma/client");
const getGoalDistribution = async (req, res, next) => {
    try {
        const goals = await prisma_1.default.goal.findMany({
            include: { goalSheet: true }
        });
        const thrustAreaBreakdown = {};
        const uomBreakdown = {};
        const statusBreakdown = {};
        goals.forEach(goal => {
            thrustAreaBreakdown[goal.thrustArea] = (thrustAreaBreakdown[goal.thrustArea] || 0) + 1;
            uomBreakdown[goal.uom] = (uomBreakdown[goal.uom] || 0) + 1;
            statusBreakdown[goal.goalSheet.status] = (statusBreakdown[goal.goalSheet.status] || 0) + 1;
        });
        res.json({
            thrustAreas: thrustAreaBreakdown,
            uomTypes: uomBreakdown,
            statuses: statusBreakdown,
            totalGoals: goals.length
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getGoalDistribution = getGoalDistribution;
const getQuarterlyTrends = async (req, res, next) => {
    try {
        const activeSheets = await prisma_1.default.goalSheet.findMany({
            where: { status: 'APPROVED' },
            include: {
                goals: {
                    include: { checkIns: true }
                }
            }
        });
        const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
        const trendData = quarters.map(q => {
            let totalQScore = 0;
            let activeParticipants = 0;
            activeSheets.forEach(sheet => {
                if (sheet.goals.length === 0)
                    return;
                activeParticipants++;
                let sheetScore = 0;
                sheet.goals.forEach(goal => {
                    const checkIn = goal.checkIns.find(c => c.quarter === q);
                    const score = checkIn ? calculateScore(goal, checkIn) : 0;
                    sheetScore += (score * (goal.weightage / 100));
                });
                totalQScore += sheetScore;
            });
            return {
                quarter: q,
                score: activeParticipants === 0 ? 0 : (totalQScore / activeParticipants) * 100
            };
        });
        res.json(trendData);
    }
    catch (error) {
        next(error);
    }
};
exports.getQuarterlyTrends = getQuarterlyTrends;
const getManagerEffectiveness = async (req, res, next) => {
    try {
        const managers = await prisma_1.default.user.findMany({
            where: { role: client_1.Role.MANAGER },
            include: {
                subordinates: {
                    include: {
                        goalSheets: {
                            include: {
                                goals: {
                                    include: { checkIns: true }
                                }
                            }
                        }
                    }
                }
            }
        });
        const leaderboard = managers.map(manager => {
            let totalCheckIns = 0;
            let commentedCheckIns = 0;
            manager.subordinates.forEach(sub => {
                sub.goalSheets.forEach(sheet => {
                    sheet.goals.forEach(goal => {
                        goal.checkIns.forEach(ci => {
                            totalCheckIns++;
                            if (ci.managerComment)
                                commentedCheckIns++;
                        });
                    });
                });
            });
            return {
                id: manager.id,
                name: manager.name,
                email: manager.email,
                totalSubordinates: manager.subordinates.length,
                auditRate: totalCheckIns === 0 ? 0 : (commentedCheckIns / totalCheckIns) * 100
            };
        });
        res.json(leaderboard.sort((a, b) => b.auditRate - a.auditRate));
    }
    catch (error) {
        next(error);
    }
};
exports.getManagerEffectiveness = getManagerEffectiveness;
const calculateScore = (goal, checkIn) => {
    const actual = checkIn.actualAchievement ?? 0;
    const target = goal.target;
    switch (goal.uom) {
        case 'NUMERIC':
        case 'PERCENTAGE':
            if (goal.direction === 'HIGHER_IS_BETTER')
                return target === 0 ? 0 : actual / target;
            return actual === 0 ? 1 : target / actual;
        case 'ZERO_BASED':
        case 'TIMELINE':
            return Math.min(100, Math.max(0, actual)) / 100;
        default: return 0;
    }
};
