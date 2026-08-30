import { prisma } from "../db";

const DEFAULT_CATEGORY_BUDGETS: Record<string, number> = {
  Food: 5000,
  Travel: 4000,
  Shopping: 5000,
  Groceries: 4500,
  Subscriptions: 1500,
  Bills: 2500,
  Rent: 12000,
  Entertainment: 2000,
  Health: 2500,
  Education: 2000,
  Others: 1500,
};

function currentMonthKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** Creates the baseline records every new user needs: a cash account, a starter
 *  budget, and default notification preferences. Called once at signup. */
export async function provisionNewUser(userId: string) {
  await prisma.account.create({
    data: { userId, name: "Cash", type: "CASH", provider: "MANUAL", balance: 0 },
  });
  await prisma.budget.create({
    data: {
      userId,
      month: currentMonthKey(),
      total: 30000,
      categories: JSON.stringify(DEFAULT_CATEGORY_BUDGETS),
      rollover: true,
    },
  });
  await prisma.notificationSettings.create({ data: { userId } });
}
