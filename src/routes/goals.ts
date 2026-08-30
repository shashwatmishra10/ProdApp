import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { requireAuth, AuthedRequest } from "../middleware/auth";
import { serializeGoal } from "../utils/serialize";

export const goalsRouter = Router();
goalsRouter.use(requireAuth);

goalsRouter.get("/", async (req: AuthedRequest, res) => {
  const goals = await prisma.goal.findMany({ where: { userId: req.userId! }, orderBy: { id: "asc" } });
  res.json(goals.map(serializeGoal));
});

const goalSchema = z.object({
  name: z.string().min(1).max(80),
  target: z.number().positive(),
  saved: z.number().nonnegative(),
  deadline: z.string().optional().nullable(),
  icon: z.string().max(8).optional(),
});

goalsRouter.post("/", async (req: AuthedRequest, res) => {
  const parsed = goalSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message || "Invalid input" });
  const d = parsed.data;
  const goal = await prisma.goal.create({
    data: {
      userId: req.userId!, name: d.name, target: d.target, saved: d.saved,
      deadline: d.deadline ? new Date(d.deadline) : null, icon: d.icon || "🎯",
    },
  });
  res.status(201).json(serializeGoal(goal));
});

goalsRouter.put("/:id", async (req: AuthedRequest, res) => {
  const parsed = goalSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message || "Invalid input" });
  const existing = await prisma.goal.findFirst({ where: { id: req.params.id, userId: req.userId! } });
  if (!existing) return res.status(404).json({ error: "Not found" });
  const d = parsed.data;
  const goal = await prisma.goal.update({
    where: { id: existing.id },
    data: { name: d.name, target: d.target, saved: d.saved, deadline: d.deadline ? new Date(d.deadline) : null, icon: d.icon || "🎯" },
  });
  res.json(serializeGoal(goal));
});

const contributeSchema = z.object({ amount: z.number().positive() });

goalsRouter.post("/:id/contribute", async (req: AuthedRequest, res) => {
  const parsed = contributeSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid amount" });
  const existing = await prisma.goal.findFirst({ where: { id: req.params.id, userId: req.userId! } });
  if (!existing) return res.status(404).json({ error: "Not found" });
  const saved = Math.min(existing.target, existing.saved + parsed.data.amount);
  const goal = await prisma.goal.update({ where: { id: existing.id }, data: { saved } });
  res.json(serializeGoal(goal));
});

goalsRouter.delete("/:id", async (req: AuthedRequest, res) => {
  const existing = await prisma.goal.findFirst({ where: { id: req.params.id, userId: req.userId! } });
  if (!existing) return res.status(404).json({ error: "Not found" });
  await prisma.goal.delete({ where: { id: existing.id } });
  res.json({ ok: true });
});
