import { Router } from "express";
import { prisma } from "../db";
import { requireAuth, AuthedRequest } from "../middleware/auth";

export const accountsRouter = Router();
accountsRouter.use(requireAuth);

accountsRouter.get("/", async (req: AuthedRequest, res) => {
  const accounts = await prisma.account.findMany({ where: { userId: req.userId! }, orderBy: { createdAt: "asc" } });
  res.json(accounts.map((a) => ({
    id: a.id, name: a.name, type: a.type, provider: a.provider, balance: a.balance, currency: a.currency,
  })));
});

accountsRouter.get("/:id/transactions", async (req: AuthedRequest, res) => {
  const account = await prisma.account.findFirst({ where: { id: req.params.id, userId: req.userId! } });
  if (!account) return res.status(404).json({ error: "Not found" });
  const txns = await prisma.transaction.findMany({
    where: { userId: req.userId!, accountId: account.id },
    orderBy: { date: "desc" },
  });
  res.json(txns);
});
