import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'hackathon-secret-key';

export const getPublicManagers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const managers = await prisma.user.findMany({
      where: {
        role: { in: ['MANAGER', 'ADMIN'] }
      },
      select: {
        id: true,
        name: true
      },
      orderBy: { name: 'asc' }
    });
    res.json(managers);
  } catch (error) {
    next(error);
  }
};

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, name, managerId } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Strict Data Normalization for Manager ID
    let finalManagerId: string | null = null;
    
    if (managerId && typeof managerId === 'string' && managerId !== "" && managerId !== "null" && managerId !== "undefined") {
        // Verify manager existence to prevent foreign key violation
        const managerExists = await prisma.user.findUnique({ where: { id: managerId } });
        if (managerExists) {
            finalManagerId = managerId;
        } else {
            console.warn(`Attempted signup with non-existent manager ID: ${managerId}. Defaulting to null.`);
        }
    }
    
    const user = await prisma.user.create({
      data: {
        email,
        name,
        role: 'EMPLOYEE',
        managerId: finalManagerId,
      },
    });

    res.status(201).json({ message: 'User created successfully', user });
  } catch (error) {
    console.error('Registration internal failure:', error);
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;

    const user = await prisma.user.findUnique({ 
      where: { email },
      include: { manager: true }
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        managerId: user.managerId,
        managerName: user.manager?.name
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { manager: true }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      managerId: user.managerId,
      managerName: user.manager?.name
    });
  } catch (error) {
    next(error);
  }
};