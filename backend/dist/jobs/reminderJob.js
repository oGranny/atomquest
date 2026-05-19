"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initReminderJob = exports.runReminderJob = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const prisma_1 = __importDefault(require("../lib/prisma"));
const emailService_1 = require("../lib/emailService");
const getActiveQuarter = () => {
    const month = new Date().getMonth(); // 0-11
    if (month >= 0 && month <= 2)
        return 'Q1'; // Jan to Mar
    if (month >= 3 && month <= 5)
        return 'Q2'; // Apr to Jun
    if (month >= 6 && month <= 8)
        return 'Q3'; // Jul to Sep
    return 'Q4'; // Oct to Dec
};
const runReminderJob = async () => {
    console.log('Running Quarterly Check-in Reminder Job...');
    const activeQ = getActiveQuarter();
    try {
        // Find all users who have an approved goal sheet but haven't completed check-ins for the active quarter
        const usersToRemind = await prisma_1.default.user.findMany({
            where: {
                role: { in: ['EMPLOYEE', 'MANAGER'] },
                goalSheets: {
                    some: {
                        status: 'APPROVED',
                        goals: {
                            some: {
                                checkIns: {
                                    none: {
                                        quarter: activeQ,
                                        status: 'COMPLETED'
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });
        for (const user of usersToRemind) {
            console.log(`Sending reminder to ${user.email} for ${activeQ}`);
            await (0, emailService_1.sendCheckInReminder)(user.email, user.name, activeQ);
        }
        console.log(`Reminder job completed. Sent ${usersToRemind.length} emails.`);
        return { count: usersToRemind.length, quarter: activeQ };
    }
    catch (error) {
        console.error('Reminder job failed:', error);
        throw error;
    }
};
exports.runReminderJob = runReminderJob;
const initReminderJob = () => {
    // Run every morning at 9:00 AM
    node_cron_1.default.schedule('0 9 * * *', async () => {
        await (0, exports.runReminderJob)();
    });
};
exports.initReminderJob = initReminderJob;
