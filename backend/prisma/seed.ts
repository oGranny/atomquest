import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.auditLog.deleteMany();
  await prisma.checkIn.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.goalSheet.deleteMany();
  await prisma.user.deleteMany();

  // Create Admin
  const admin = await prisma.user.create({
    data: {
      email: 'admin@atomberg.com',
      name: 'Super Admin',
      role: Role.ADMIN,
    },
  });

  // Create Manager
  const manager = await prisma.user.create({
    data: {
      email: 'manager@atomberg.com',
      name: 'Team Manager',
      role: Role.MANAGER,
    },
  });

  // Create Employees
  const emp1 = await prisma.user.create({
    data: {
      email: 'emp1@atomberg.com',
      name: 'Employee One',
      role: Role.EMPLOYEE,
      managerId: manager.id,
    },
  });

  const emp2 = await prisma.user.create({
    data: {
      email: 'emp2@atomberg.com',
      name: 'Employee Two',
      role: Role.EMPLOYEE,
      managerId: manager.id,
    },
  });

  console.log('Seed completed:');
  console.log('Admin:', admin.email);
  console.log('Manager:', manager.email);
  console.log('Employee 1:', emp1.email);
  console.log('Employee 2:', emp2.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });