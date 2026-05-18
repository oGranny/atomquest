import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';

const getActiveQuarter = () => {
    const month = new Date().getMonth(); // 0-11
    if (month >= 0 && month <= 2) return 'Q1'; // Jan to Mar
    if (month >= 3 && month <= 5) return 'Q2'; // Apr to Jun
    if (month >= 6 && month <= 8) return 'Q3'; // Jul to Sep
    return 'Q4'; // Oct to Dec
};

export const getAchievementReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await prisma.user.findMany({
      include: {
        goalSheets: {
          include: {
            goals: {
              include: {
                checkIns: true
              }
            }
          }
        }
      }
    });

    const report = data.flatMap(user => 
      user.goalSheets.flatMap(sheet => 
        sheet.goals.map(goal => ({
          Employee: user.name,
          Email: user.email,
          Cycle: sheet.cycleYear,
          Goal: goal.title,
          Target: goal.target,
          Weightage: goal.weightage,
          LatestActual: goal.checkIns[goal.checkIns.length - 1]?.actualAchievement || 0,
          Status: goal.checkIns[goal.checkIns.length - 1]?.status || 'NOT_STARTED'
        }))
      )
    );

    res.json(report);
  } catch (error) {
    next(error);
  }
};

export const getCompletionStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const activeQ = getActiveQuarter();
    
    // Count people who have at least one check-in for the active quarter
    const totalParticipants = await prisma.user.count({ 
      where: { role: { in: ['EMPLOYEE', 'MANAGER'] } } 
    });

    const usersWithCheckIn = await prisma.user.findMany({
        where: { role: { in: ['EMPLOYEE', 'MANAGER'] } },
        include: {
            goalSheets: {
                where: { status: 'APPROVED' },
                include: {
                    goals: {
                        include: {
                            checkIns: {
                                where: { quarter: activeQ }
                            }
                        }
                    }
                },
                take: 1,
                orderBy: { createdAt: 'desc' }
            }
        }
    });

    const checkedInCount = usersWithCheckIn.filter(user => {
        const sheet = user.goalSheets[0];
        if (!sheet) return false;
        // At least one goal must have a check-in for this quarter
        return sheet.goals.some(g => g.checkIns.length > 0);
    }).length;

    // Calculate Overall Org-wide Achievement %
    let totalScore = 0;
    let participantCount = 0;

    usersWithCheckIn.forEach(user => {
        const sheet = user.goalSheets[0];
        if (!sheet || sheet.goals.length === 0) return;
        
        participantCount++;
        let sheetScore = 0;
        sheet.goals.forEach(goal => {
            const checkIn = goal.checkIns[0]; // Filtered to activeQ already
            const score = checkIn ? calculateInternalScore(goal, checkIn) : 0;
            sheetScore += (score * (goal.weightage / 100));
        });
        totalScore += sheetScore;
    });

    const overallOrgAchievement = participantCount === 0 ? 0 : (totalScore / participantCount) * 100;

    res.json({
      totalParticipants,
      checkedInCount,
      checkInRate: totalParticipants === 0 ? 0 : (checkedInCount / totalParticipants) * 100,
      overallAchievement: overallOrgAchievement,
      activeQuarter: activeQ
    });
  } catch (error) {
    next(error);
  }
};

export const getAuditTrail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const logs = await prisma.auditLog.findMany({
      include: { user: true },
      orderBy: { timestamp: 'desc' }
    });
    res.json(logs);
  } catch (error) {
    next(error);
  }
};

export const getDepartmentalStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const participants = await prisma.user.findMany({
      where: { role: { in: ['EMPLOYEE', 'MANAGER'] } },
      include: {
        goalSheets: {
          include: {
            goals: {
              include: { checkIns: true }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    const stats = participants.map(participant => {
      const sheet = participant.goalSheets[0];
      let aggregateScore = 0;
      
      if (sheet && sheet.goals.length > 0) {
          aggregateScore = sheet.goals.reduce((sum, goal) => {
              const latest = goal.checkIns[goal.checkIns.length - 1];
              const score = latest ? calculateInternalScore(goal, latest) : 0;
              return sum + (score * (goal.weightage / 100));
          }, 0);
      }

      return {
        name: participant.name,
        department: participant.department || 'General',
        status: sheet?.status || 'NOT_STARTED',
        score: aggregateScore * 100,
        id: participant.id
      };
    });

    res.json(stats);
  } catch (error) {
    next(error);
  }
};

const calculateInternalScore = (goal: any, checkIn: any): number => {
    const actual = checkIn.actualAchievement ?? 0;
    const target = goal.target;
    switch (goal.uom) {
        case 'NUMERIC':
        case 'PERCENTAGE':
            if (goal.direction === 'HIGHER_IS_BETTER') return target === 0 ? 0 : actual / target;
            return actual === 0 ? 1 : target / actual;
        case 'ZERO_BASED':
        case 'TIMELINE':
            // These now use direct percentage achievement in check-ins
            return Math.min(100, Math.max(0, actual)) / 100;
        default: return 0;
    }
};