"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initEscalationJob = exports.runEscalationJob = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const prisma_1 = __importDefault(require("../lib/prisma"));
const emailService_1 = require("../lib/emailService");
const client_1 = require("@prisma/client");
const getActiveQuarter = () => {
    const month = new Date().getMonth();
    if (month >= 0 && month <= 2)
        return 'Q1';
    if (month >= 3 && month <= 5)
        return 'Q2';
    if (month >= 6 && month <= 8)
        return 'Q3';
    return 'Q4';
};
const runEscalationJob = async () => {
    console.log('Initiating Organizational Escalation Engine...');
    let totalTriggered = 0;
    try {
        const rules = await prisma_1.default.escalationRule.findMany({ where: { isActive: true } });
        for (const rule of rules) {
            if (rule.trigger === client_1.EscalationTrigger.SUBMISSION_OVERDUE) {
                totalTriggered += await processSubmissionEscalation(rule);
            }
            else if (rule.trigger === client_1.EscalationTrigger.APPROVAL_OVERDUE) {
                totalTriggered += await processApprovalEscalation(rule);
            }
            else if (rule.trigger === client_1.EscalationTrigger.CHECKIN_OVERDUE) {
                await processCheckInEscalation(rule);
            }
        }
        console.log(`Escalation cycle completed. Total new escalations: ${totalTriggered}`);
        return { count: totalTriggered };
    }
    catch (error) {
        console.error('Escalation job failed:', error);
        throw error;
    }
};
exports.runEscalationJob = runEscalationJob;
const initEscalationJob = () => {
    // Run every night at 12:00 AM
    node_cron_1.default.schedule('0 0 * * *', async () => {
        await (0, exports.runEscalationJob)();
    });
};
exports.initEscalationJob = initEscalationJob;
async function processSubmissionEscalation(rule) {
    let count = 0;
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - rule.daysThreshold);
    // Find users with DRAFT or RETURNED sheets older than threshold
    const overdueSheets = await prisma_1.default.goalSheet.findMany({
        where: {
            status: { in: [client_1.GoalSheetStatus.DRAFT, client_1.GoalSheetStatus.RETURNED] },
            createdAt: { lt: thresholdDate }
        },
        include: { user: { include: { manager: true } } }
    });
    for (const sheet of overdueSheets) {
        const triggered = await triggerEscalation(rule, sheet.id, 'GoalSheet', sheet.user, 'Goal Submission');
        if (triggered)
            count++;
    }
    return count;
}
async function processApprovalEscalation(rule) {
    let count = 0;
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - rule.daysThreshold);
    // Find sheets in SUBMITTED status longer than threshold
    const overdueApprovals = await prisma_1.default.goalSheet.findMany({
        where: {
            status: client_1.GoalSheetStatus.SUBMITTED,
            updatedAt: { lt: thresholdDate }
        },
        include: { user: { include: { manager: true } } }
    });
    for (const sheet of overdueApprovals) {
        const triggered = await triggerEscalation(rule, sheet.id, 'GoalSheet', sheet.user, 'Goal Approval');
        if (triggered)
            count++;
    }
    return count;
}
async function processCheckInEscalation(rule) {
    const activeQ = getActiveQuarter();
}
async function triggerEscalation(rule, entityId, entityType, user, taskType) {
    const existingLog = await prisma_1.default.escalationLog.findFirst({
        where: { entityId, ruleId: rule.id, status: 'ACTIVE' }
    });
    if (!existingLog) {
        const log = await prisma_1.default.escalationLog.create({
            data: {
                ruleId: rule.id,
                entityId,
                entityType,
                currentLevel: rule.level,
                userId: user.id,
                status: 'ACTIVE'
            }
        });
        // Determine target email based on level
        let targetEmails = [user.email];
        if (rule.level === client_1.EscalationLevel.MANAGER && user.manager?.email) {
            targetEmails.push(user.manager.email);
        }
        else if (rule.level === client_1.EscalationLevel.SKIP_LEVEL) {
            // Find skip-level manager (manager of the manager)
            if (user.managerId) {
                const manager = await prisma_1.default.user.findUnique({
                    where: { id: user.managerId },
                    include: { manager: true }
                });
                if (manager?.manager?.email)
                    targetEmails.push(manager.manager.email);
            }
        }
        const delayDays = rule.daysThreshold;
        const subject = `SYSTEM ESCALATION: Overdue ${taskType} for ${user.name}`;
        await (0, emailService_1.sendEscalationEmail)(targetEmails, subject, user.name, taskType, delayDays, rule.level);
        console.log(`Escalation Level ${rule.level} triggered for ${user.email} (${taskType})`);
        return true;
    }
    return false;
}
