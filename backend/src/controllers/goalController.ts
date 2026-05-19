import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { GoalSheetStatus, UoMType, GoalDirection, Role } from '@prisma/client';
import { logAudit } from '../lib/audit';
import { sendSubmissionEmail, sendApprovalEmail, sendRejectionEmail } from '../lib/emailService';

export const createGoalSheet = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.userId;
    const { cycleYear } = req.body;

    const existingSheet = await prisma.goalSheet.findFirst({
      where: { userId, cycleYear, status: { not: GoalSheetStatus.RETURNED } }
    });

    if (existingSheet) {
        if (existingSheet.status === GoalSheetStatus.DRAFT) {
            return res.json(existingSheet);
        }
        return res.status(400).json({ message: 'Active goal sheet already exists for this cycle' });
    }

    const goalSheet = await prisma.goalSheet.create({
      data: {
        userId,
        cycleYear,
        status: GoalSheetStatus.DRAFT
      }
    });

    res.status(201).json(goalSheet);
  } catch (error) {
    next(error);
  }
};

export const addGoal = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { goalSheetId, thrustArea, title, description, uom, direction, target, weightage, deadline } = req.body;

    const goalSheet = await prisma.goalSheet.findUnique({
      where: { id: goalSheetId },
      include: { 
        goals: {
          orderBy: { createdAt: 'asc' }
        } 
      }
    });

    if (!goalSheet) return res.status(404).json({ message: 'Goal sheet not found' });
    if (goalSheet.status !== GoalSheetStatus.DRAFT && goalSheet.status !== GoalSheetStatus.RETURNED) {
      return res.status(400).json({ message: 'Cannot edit goals in current status' });
    }

    if (goalSheet.goals.length >= 8) {
      return res.status(400).json({ message: 'Maximum 8 goals allowed' });
    }
    if (weightage < 10) {
      return res.status(400).json({ message: 'Minimum weightage per goal is 10%' });
    }

    const goal = await prisma.goal.create({
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
  } catch (error) {
    next(error);
  }
};

export const submitGoalSheet = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;

    const goalSheet = await prisma.goalSheet.findUnique({
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

    if (!goalSheet) return res.status(404).json({ message: 'Goal sheet not found' });
    
    const totalWeightage = goalSheet.goals.reduce((sum: number, g: any) => sum + g.weightage, 0);
    if (totalWeightage !== 100) {
      return res.status(400).json({ message: `Total weightage must be 100% (currently ${totalWeightage}%)` });
    }

    const updatedSheet = await prisma.goalSheet.update({
      where: { id },
      data: { status: GoalSheetStatus.SUBMITTED }
    });

    // Trigger Email to Manager and Employee
    if (goalSheet.user.manager?.email) {
        sendSubmissionEmail(goalSheet.user.manager.email, goalSheet.user.email, goalSheet.user.name).catch(console.error);
    }

    res.json(updatedSheet);
  } catch (error) {
    next(error);
  }
};

export const getMyGoalSheets = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.userId;
    const sheets = await prisma.goalSheet.findMany({
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
  } catch (error) {
    next(error);
  }
};

export const deleteGoal = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const goal = await prisma.goal.findUnique({
      where: { id },
      include: { goalSheet: true }
    });

    if (!goal) return res.status(404).json({ message: 'Goal not found' });
    if (goal.goalSheet.status !== GoalSheetStatus.DRAFT && goal.goalSheet.status !== GoalSheetStatus.RETURNED) {
      return res.status(400).json({ message: 'Cannot delete goal in current status' });
    }

    await prisma.goal.delete({ where: { id } });
    res.json({ message: 'Goal deleted' });
  } catch (error) {
    next(error);
  }
};

export const deleteGoalSheet = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const goalSheet = await prisma.goalSheet.findUnique({
      where: { id }
    });

    if (!goalSheet) return res.status(404).json({ message: 'Goal sheet not found' });
    if (goalSheet.status !== GoalSheetStatus.DRAFT && goalSheet.status !== GoalSheetStatus.RETURNED) {
      return res.status(400).json({ message: 'Cannot delete goal sheet in current status' });
    }

    await prisma.goal.deleteMany({ where: { goalSheetId: id } });
    await prisma.goalSheet.delete({ where: { id } });
    
    res.json({ message: 'Goal sheet and associated goals deleted' });
  } catch (error) {
    next(error);
  }
};

export const getPendingApprovals = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    
    const where: any = { status: GoalSheetStatus.SUBMITTED };
    
    if (user.role !== Role.ADMIN) {
      where.user = { managerId: user.userId };
    }

    const pendingSheets = await prisma.goalSheet.findMany({
      where: {
          ...where,
          goals: { some: {} }
      },
      include: {
        user: true,
        goals: {
          include: { checkIns: true },
          orderBy: { createdAt: 'asc' }
        }
      }
    });
    res.json(pendingSheets);
  } catch (error) {
    next(error);
  }
};

export const approveGoalSheet = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const managerEmail = (req as any).user.email;
    const userId = (req as any).user.userId;

    const goalSheet = await prisma.goalSheet.findUnique({
        where: { id },
        include: { user: true }
    });

    const updatedSheet = await prisma.goalSheet.update({
      where: { id },
      data: { status: GoalSheetStatus.APPROVED }
    });

    await logAudit(userId, 'APPROVE', id, 'GoalSheet', 'Manager/Admin approved goal sheet');

    // Trigger Email to Employee and Manager
    if (goalSheet?.user.email) {
        sendApprovalEmail(goalSheet.user.email, managerEmail || 'manager@atomberg.com', goalSheet.user.name).catch(console.error);
    }

    res.json(updatedSheet);
  } catch (error) {
    next(error);
  }
};

export const returnGoalSheet = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const managerEmail = (req as any).user.email;
    const { revisionComment } = req.body;
    
    const goalSheet = await prisma.goalSheet.findUnique({
        where: { id },
        include: { user: true }
    });

    const updatedSheet = await prisma.goalSheet.update({
      where: { id },
      data: { 
        status: GoalSheetStatus.RETURNED,
        revisionComment: revisionComment || null
      }
    });

    // Trigger Email to Employee and Manager
    if (goalSheet?.user.email) {
        sendRejectionEmail(goalSheet.user.email, managerEmail || 'manager@atomberg.com', goalSheet.user.name, revisionComment || 'No specific comments provided.').catch(console.error);
    }

    res.json(updatedSheet);
  } catch (error) {
    next(error);
  }
};

export const getApprovedSubordinates = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    
    const where: any = { status: GoalSheetStatus.APPROVED };
    
    if (user.role !== Role.ADMIN) {
      where.user = { managerId: user.userId };
    }

    const sheets = await prisma.goalSheet.findMany({
      where: {
          ...where,
          goals: { some: {} }
      },
      include: {
        user: true,
        goals: {
          include: { checkIns: true },
          orderBy: { createdAt: 'asc' }
        }
      }
    });
    res.json(sheets);
  } catch (error) {
    next(error);
  }
};

export const getSubordinates = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    
    const where: any = {};
    
    if (user.role !== Role.ADMIN) {
      where.managerId = user.userId;
    } else {
      where.id = { not: user.userId };
    }

    const subordinates = await prisma.user.findMany({
      where,
      select: { id: true, name: true, email: true }
    });
    res.json(subordinates);
  } catch (error) {
    next(error);
  }
};

export const pushSharedGoal = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { employeeIds, thrustArea, title, description, uom, target, weightage, cycleYear, deadline } = req.body;
    const managerId = (req as any).user.userId;
    
    // 1. Find or create the Manager's own sheet to hold the Master Goal
    let managerSheet = await prisma.goalSheet.findFirst({
      where: { userId: managerId, cycleYear }
    });

    if (!managerSheet) {
        managerSheet = await prisma.goalSheet.create({
            data: {
                userId: managerId,
                cycleYear,
                status: GoalSheetStatus.DRAFT
            }
        });
    }

    // 2. Create the Master Shared Goal on the Manager's sheet
    const masterGoal = await prisma.goal.create({
      data: {
        goalSheet: { connect: { id: managerSheet.id } },
        thrustArea,
        title,
        description,
        uom,
        target: target || 0,
        weightage: 10, // Base weightage for the master
        isShared: true,
        deadline: deadline ? new Date(deadline) : null
      }
    });

    for (const empId of employeeIds) {
      // Find any sheet for the employee in this cycle
      let sheet = await prisma.goalSheet.findFirst({
        where: { userId: empId, cycleYear }
      });

      if (!sheet) {
          sheet = await prisma.goalSheet.create({
              data: {
                  userId: empId,
                  cycleYear,
                  status: GoalSheetStatus.DRAFT
              }
          });
      } else if (sheet.status === GoalSheetStatus.APPROVED || sheet.status === GoalSheetStatus.SUBMITTED) {
          sheet = await prisma.goalSheet.update({
              where: { id: sheet.id },
              data: { status: GoalSheetStatus.DRAFT }
          });
          const userId = (req as any).user.userId;
          await logAudit(userId, 'UNLOCK', sheet.id, 'GoalSheet', 'Admin/Manager unlocked goal sheet to push shared goal');
      }

      await prisma.goal.create({
        data: {
          goalSheet: { connect: { id: sheet.id } },
          thrustArea,
          title,
          description,
          uom,
          target: target || 0,
          weightage,
          isShared: true,
          parentGoal: { connect: { id: masterGoal.id } }, // LINK TO PARENT MASTER GOAL
          deadline: deadline ? new Date(deadline) : null
        }
      });
    }

    res.json({ message: 'Shared goal pushed successfully' });
  } catch (error) {
    next(error);
  }
};

export const unlockGoalSheet = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const userId = (req as any).user.userId;

    const updatedSheet = await prisma.goalSheet.update({
      where: { id },
      data: { status: GoalSheetStatus.DRAFT }
    });

    await logAudit(userId, 'UNLOCK', id, 'GoalSheet', 'Admin unlocked goal sheet for editing');

    res.json(updatedSheet);
  } catch (error) {
    next(error);
  }
};

export const getAdminRoster = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sheets = await prisma.goalSheet.findMany({
      where: {
          goals: { some: {} }
      },
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
  } catch (error) {
    next(error);
  }
};

export const updateGoal = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { thrustArea, title, description, uom, direction, target, weightage, deadline } = req.body;

    const goal = await prisma.goal.findUnique({
      where: { id },
      include: { goalSheet: true }
    });

    if (!goal) return res.status(404).json({ message: 'Goal not found' });
    
    const userRole = (req as any).user.role;
    const isOwnSheet = goal.goalSheet.userId === (req as any).user.userId;
    
    // Security rules:
    // If not admin, and it's their own sheet, it must be DRAFT or RETURNED
    // If it's a manager editing someone else's sheet, it must be SUBMITTED
    if (userRole !== 'ADMIN') {
        if (isOwnSheet && goal.goalSheet.status !== GoalSheetStatus.DRAFT && goal.goalSheet.status !== GoalSheetStatus.RETURNED) {
             return res.status(400).json({ message: 'Cannot edit goals in current status' });
        } else if (!isOwnSheet && goal.goalSheet.status !== GoalSheetStatus.SUBMITTED) {
             return res.status(400).json({ message: 'Can only edit submitted goals' });
        }
    }

    const updatedGoal = await prisma.goal.update({
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

    // CASCADE UPDATE TO CHILDREN if this goal is a master shared goal
    if (goal.isShared && !goal.parentGoalId) {
        await prisma.goal.updateMany({
            where: { parentGoalId: id },
            data: {
                thrustArea, 
                title, 
                description, 
                uom, 
                direction: direction || goal.direction,
                target: target || 0, 
                // Weightage is intentionally NOT updated, children manage their own weightage
                deadline: deadline ? new Date(deadline) : (deadline === null ? null : goal.deadline)
            }
        });
    }

    if (goal.goalSheet.status === GoalSheetStatus.APPROVED) {
        const userId = (req as any).user.userId;
        await logAudit(userId, 'UPDATE_AFTER_LOCK', id, 'Goal', `Updated goal after approval: ${title}`);
    }

    res.json(updatedGoal);
  } catch (error) {
    next(error);
  }
};