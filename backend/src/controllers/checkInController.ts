import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { CheckInStatus, UoMType, GoalDirection } from '@prisma/client';
import { logAudit } from '../lib/audit';

export const logAchievement = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { goalId, quarter, actualAchievement, status, achievementDate, employeeComment } = req.body;
    const userId = (req as any).user.userId;

    const existingCheckIn = await prisma.checkIn.findFirst({ where: { goalId, quarter } });

    const checkIn = await prisma.checkIn.upsert({
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

    await logAudit(userId, 'CHECK_IN', checkIn.id, 'CheckIn', `Logged ${quarter} progress for goal`);

    const goal = await prisma.goal.findUnique({ where: { id: goalId }, include: { childGoals: true } });
    if (goal && goal.isShared && goal.childGoals.length > 0) {
      for (const childGoal of goal.childGoals) {
        const existingChildCheckIn = await prisma.checkIn.findFirst({ where: { goalId: childGoal.id, quarter } });
        await prisma.checkIn.upsert({
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
  } catch (error) {
    next(error);
  }
};

export const addManagerComment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { managerComment } = req.body;

    const checkIn = await prisma.checkIn.update({
      where: { id },
      data: { managerComment }
    });

    res.json(checkIn);
  } catch (error) {
    next(error);
  }
};

export const updateCheckInComment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { goalId, quarter, managerComment } = req.body;
    
    const existingCheckIn = await prisma.checkIn.findFirst({
        where: { goalId, quarter }
    });

    if (!existingCheckIn) {
        return res.status(404).json({ message: 'Check-in not found for this quarter' });
    }

    const updated = await prisma.checkIn.update({
        where: { id: existingCheckIn.id },
        data: { managerComment }
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

export const getSheetProgress = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sheetId = req.params.sheetId as string;
    const goals = await prisma.goal.findMany({
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
  } catch (error) {
    next(error);
  }
};

const calculateScore = (uom: UoMType, direction: GoalDirection, target: number, actual: number, deadline?: Date | null, achievementDate?: Date | null): number => {
  switch (uom) {
    case 'NUMERIC':
    case 'PERCENTAGE':
      if (direction === GoalDirection.HIGHER_IS_BETTER) {
        return target === 0 ? 0 : actual / target;
      } else {
        // PDF: Max (Lower is Better) Formula: Target / Achievement
        return actual === 0 ? 1 : target / actual;
      }
    case 'ZERO_BASED':
      // Binary Success: 100% if actual matches the target benchmark (0 or 1)
      return actual === target ? 1 : 0;
    case 'TIMELINE':
      // PDF: Date-based completion. Completion date vs Deadline.
      if (!deadline || !achievementDate) return 0;
      return achievementDate <= deadline ? 1 : 0;
    default:
      return 0;
  }
};