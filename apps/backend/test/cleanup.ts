import { PrismaService } from './../src/prisma/prisma.service.js';

/**
 * Removes every test user whose email contains `emailFragment`, together with
 * everything hanging off them (expenses, refresh tokens, their Households).
 */
export async function deleteTestUsers(prisma: PrismaService, emailFragment: string) {
  const userWhere = { email: { contains: emailFragment } };
  const households = await prisma.household.findMany({
    where: { members: { some: { user: userWhere } } },
    select: { id: true },
  });
  const householdIds = households.map((household) => household.id);

  await prisma.expense.deleteMany({ where: { user: userWhere } });
  await prisma.expense.deleteMany({ where: { householdCategory: { householdId: { in: householdIds } } } });
  await prisma.householdExpenseCategory.deleteMany({ where: { householdId: { in: householdIds } } });
  await prisma.refreshToken.deleteMany({ where: { user: userWhere } });
  await prisma.householdMember.deleteMany({ where: { householdId: { in: householdIds } } });
  await prisma.household.deleteMany({ where: { id: { in: householdIds } } });
  await prisma.user.deleteMany({ where: userWhere });
}
