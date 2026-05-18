import cron from 'node-cron';
import prisma from '../lib/prisma';
import { sendEscalationEmail } from '../lib/emailService';
import { EscalationTrigger, EscalationLevel, GoalSheetStatus } from '@prisma/client';

const getActiveQuarter = () => {
    const month = new Date().getMonth();
    if (month >= 0 && month <= 2) return 'Q1';
    if (month >= 3 && month <= 5) return 'Q2';
    if (month >= 6 && month <= 8) return 'Q3';
    return 'Q4';
};

export const runEscalationJob = async () => {
  console.log('Initiating Organizational Escalation Engine...');
  let totalTriggered = 0;
  
  try {
    const rules = await prisma.escalationRule.findMany({ where: { isActive: true } });

    for (const rule of rules) {
      if (rule.trigger === EscalationTrigger.SUBMISSION_OVERDUE) {
        totalTriggered += await processSubmissionEscalation(rule);
      } else if (rule.trigger === EscalationTrigger.APPROVAL_OVERDUE) {
        totalTriggered += await processApprovalEscalation(rule);
      } else if (rule.trigger === EscalationTrigger.CHECKIN_OVERDUE) {
        await processCheckInEscalation(rule);
      }
    }

    console.log(`Escalation cycle completed. Total new escalations: ${totalTriggered}`);
    return { count: totalTriggered };
  } catch (error) {
    console.error('Escalation job failed:', error);
    throw error;
  }
};

export const initEscalationJob = () => {
  // Run every night at 12:00 AM
  cron.schedule('0 0 * * *', async () => {
    await runEscalationJob();
  });
};

async function processSubmissionEscalation(rule: any): Promise<number> {
  let count = 0;
  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() - rule.daysThreshold);

  // Find users with DRAFT or RETURNED sheets older than threshold
  const overdueSheets = await prisma.goalSheet.findMany({
    where: {
      status: { in: [GoalSheetStatus.DRAFT, GoalSheetStatus.RETURNED] },
      createdAt: { lt: thresholdDate }
    },
    include: { user: { include: { manager: true } } }
  });

  for (const sheet of overdueSheets) {
    const triggered = await triggerEscalation(rule, sheet.id, 'GoalSheet', sheet.user, 'Goal Submission');
    if (triggered) count++;
  }
  return count;
}

async function processApprovalEscalation(rule: any): Promise<number> {
    let count = 0;
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - rule.daysThreshold);
  
    // Find sheets in SUBMITTED status longer than threshold
    const overdueApprovals = await prisma.goalSheet.findMany({
      where: {
        status: GoalSheetStatus.SUBMITTED,
        updatedAt: { lt: thresholdDate }
      },
      include: { user: { include: { manager: true } } }
    });
  
    for (const sheet of overdueApprovals) {
      const triggered = await triggerEscalation(rule, sheet.id, 'GoalSheet', sheet.user, 'Goal Approval');
      if (triggered) count++;
    }
    return count;
}

async function processCheckInEscalation(rule: any) {
    const activeQ = getActiveQuarter();
}

async function triggerEscalation(rule: any, entityId: string, entityType: string, user: any, taskType: string): Promise<boolean> {
    const existingLog = await prisma.escalationLog.findFirst({
        where: { entityId, ruleId: rule.id, status: 'ACTIVE' }
    });

    if (!existingLog) {
        const log = await prisma.escalationLog.create({
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
        let targetEmails: string[] = [user.email];
        if (rule.level === EscalationLevel.MANAGER && user.manager?.email) {
            targetEmails.push(user.manager.email);
        } else if (rule.level === EscalationLevel.SKIP_LEVEL) {
            // Find skip-level manager (manager of the manager)
            if (user.managerId) {
                const manager = await prisma.user.findUnique({ 
                    where: { id: user.managerId },
                    include: { manager: true }
                });
                if (manager?.manager?.email) targetEmails.push(manager.manager.email);
            }
        }

        const delayDays = rule.daysThreshold;
        const subject = `SYSTEM ESCALATION: Overdue ${taskType} for ${user.name}`;
        
        await sendEscalationEmail(targetEmails, subject, user.name, taskType, delayDays, rule.level);
        console.log(`Escalation Level ${rule.level} triggered for ${user.email} (${taskType})`);
        return true;
    }
    return false;
}
