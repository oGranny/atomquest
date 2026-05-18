import cron from 'node-cron';
import prisma from '../lib/prisma';
import { sendCheckInReminder } from '../lib/emailService';

const getActiveQuarter = () => {
    const month = new Date().getMonth(); // 0-11
    if (month >= 0 && month <= 2) return 'Q1'; // Jan to Mar
    if (month >= 3 && month <= 5) return 'Q2'; // Apr to Jun
    if (month >= 6 && month <= 8) return 'Q3'; // Jul to Sep
    return 'Q4'; // Oct to Dec
};

export const initReminderJob = () => {
  // Run every morning at 9:00 AM
  cron.schedule('0 9 * * *', async () => {
    console.log('Running Quarterly Check-in Reminder Job...');
    const activeQ = getActiveQuarter();

    try {
      // Find all users who have an approved goal sheet but haven't completed check-ins for the active quarter
      const usersToRemind = await prisma.user.findMany({
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
        await sendCheckInReminder(user.email, user.name, activeQ);
      }

      console.log(`Reminder job completed. Sent ${usersToRemind.length} emails.`);
    } catch (error) {
      console.error('Reminder job failed:', error);
    }
  });
};
