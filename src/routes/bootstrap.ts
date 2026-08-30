import { Router } from "express";
import { prisma } from "../db";
import { requireAuth, AuthedRequest } from "../middleware/auth";
import { serializeGoal, serializeSharedGroup, serializeTransaction } from "../utils/serialize";

export const bootstrapRouter = Router();
bootstrapRouter.use(requireAuth);

// One aggregate call so the frontend can render the whole app after a single round trip.
bootstrapRouter.get("/", async (req: AuthedRequest, res) => {
  const userId = req.userId!;

  const [user, transactions, accounts, budget, goals, sharedGroups, notificationSettings, aaConnection, gmailConnection] =
    await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.transaction.findMany({ where: { userId }, include: { account: true }, orderBy: { date: "desc" } }),
      prisma.account.findMany({ where: { userId }, orderBy: { createdAt: "asc" } }),
      prisma.budget.findUnique({ where: { userId } }),
      prisma.goal.findMany({ where: { userId } }),
      prisma.sharedGroup.findMany({ where: { userId }, include: { participants: true }, orderBy: { date: "desc" } }),
      prisma.notificationSettings.upsert({ where: { userId }, update: {}, create: { userId } }),
      prisma.aAConnection.findUnique({ where: { userId } }),
      prisma.gmailConnection.findUnique({ where: { userId } }),
    ]);

  res.json({
    user: user ? { id: user.id, name: user.name, email: user.email } : null,
    transactions: transactions.map(serializeTransaction),
    accounts: accounts.map((a) => ({ id: a.id, name: a.name, type: a.type, provider: a.provider, balance: a.balance })),
    budget: budget ? { total: budget.total, categories: JSON.parse(budget.categories), rollover: budget.rollover } : null,
    goals: goals.map(serializeGoal),
    sharedGroups: sharedGroups.map(serializeSharedGroup),
    notificationSettings,
    integrations: {
      aa: aaConnection ? { status: aaConnection.status, provider: aaConnection.provider, lastSyncAt: aaConnection.lastSyncAt } : { status: "NOT_CONNECTED" },
      gmail: gmailConnection ? { status: gmailConnection.status, email: gmailConnection.email, lastSyncAt: gmailConnection.lastSyncAt } : { status: "DISCONNECTED" },
    },
  });
});
