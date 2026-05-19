import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanup() {
  console.log('Starting cleanup...');
  const emp = await prisma.user.findUnique({ where: { email: 'emp1@atomberg.com' } });
  if (!emp) return console.log('Emp1 not found');

  const sheets = await prisma.goalSheet.findMany({
    where: { userId: emp.id, cycleYear: 2026 },
    include: { goals: true }
  });
  
  let deletedCount = 0;
  for (const sheet of sheets) {
    if (sheet.goals.length === 1 && sheet.goals[0].isShared) {
      await prisma.goal.deleteMany({ where: { goalSheetId: sheet.id } });
      await prisma.goalSheet.delete({ where: { id: sheet.id } });
      deletedCount++;
    }
  }
  console.log('Deleted ' + deletedCount + ' malformed sheets for Emp1.');
}

cleanup()
  .catch(console.error)
  .finally(() => prisma.$disconnect());