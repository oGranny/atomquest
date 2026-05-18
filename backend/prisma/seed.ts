import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.auditLog.deleteMany();
  await prisma.checkIn.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.goalSheet.deleteMany();
  await prisma.user.deleteMany();

  const hashedPassword = await bcrypt.hash('password123', 10);

  // Create Admin
  const admin = await prisma.user.create({
    data: {
      email: 'admin@atomberg.com',
      name: 'Super Admin',
      password: hashedPassword,
      role: Role.ADMIN,
    },
  });

  // Create Manager
  const manager = await prisma.user.create({
    data: {
      email: 'manager@atomberg.com',
      name: 'Team Manager',
      password: hashedPassword,
      role: Role.MANAGER,
    },
  });

  // Create Employees
  const emp1 = await prisma.user.create({
    data: {
      email: 'emp1@atomberg.com',
      name: 'Employee One',
      password: hashedPassword,
      role: Role.EMPLOYEE,
      managerId: manager.id,
    },
  });

  const emp2 = await prisma.user.create({
    data: {
      email: 'emp2@atomberg.com',
      name: 'Employee Two',
      password: hashedPassword,
      role: Role.EMPLOYEE,
      managerId: manager.id,
    },
  });

  console.log('Seed completed:');
  console.log('Admin:', admin.email);
  console.log('Manager:', manager.email);
  console.log('Employee 1:', emp1.email);
  console.log('Employee 2:', emp2.email);

  // Default Escalation Rules
  await prisma.escalationRule.deleteMany();
  await prisma.escalationRule.createMany({
    data: [
      {
        name: 'Submission Grace Period',
        trigger: 'SUBMISSION_OVERDUE',
        daysThreshold: 7,
        level: 'EMPLOYEE'
      },
      {
        name: 'Manager Review Timeout',
        trigger: 'APPROVAL_OVERDUE',
        daysThreshold: 3,
        level: 'MANAGER'
      },
      {
        name: 'Check-in Enforcement',
        trigger: 'CHECKIN_OVERDUE',
        daysThreshold: 15,
        level: 'MANAGER'
      }
    ]
  });

  console.log('Default Password for all users: password123');
  console.log('Default Escalation Rules created.');
  }

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });