import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { requireAuth, AuthedRequest } from "../middleware/auth";

export const budgetsRouter = Router();
budgetsRouter.use(requireAuth);

budgetsRouter.get("/", async (req: AuthedRequest, res) => {
  const budget = await prisma.budget.findUnique({ where: { userId: req.userId! } });
  if (!budget) return res.json(null);
  res.json({ ...budget, categories: JSON.parse(budget.categories) });
});

const updateSchema = z.object({
  total: z.number().nonnegative(),
  categories: z.record(z.string(), z.number().nonnegative()),
  rollover: z.boolean(),
});

budgetsRouter.put("/", async (req: AuthedRequest, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message || "Invalid input" });
  const { total, categories, rollover } = parsed.data;

  const d = new Date();
  const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

  const budget = await prisma.budget.upsert({
    where: { userId: req.userId! },
    update: { total, categories: JSON.stringify(categories), rollover },
    create: { userId: req.userId!, month, total, categories: JSON.stringify(categories), rollover },
  });
  res.json({ ...budget, categories: JSON.parse(budget.categories) });
});
