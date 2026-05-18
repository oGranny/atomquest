import prisma from '../lib/prisma';

export const logAudit = async (
  userId: string,
  action: string,
  entityId: string,
  entityType: string,
  details?: string
) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entityId,
        entityType,
        details,
      },
    });
  } catch (error) {
    console.error('Failed to log audit:', error);
  }
};