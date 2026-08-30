import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { requireAuth, AuthedRequest } from "../middleware/auth";

export const notificationsRouter = Router();
notificationsRouter.use(requireAuth);

notificationsRouter.get("/", async (req: AuthedRequest, res) => {
  const settings = await prisma.notificationSettings.upsert({
    where: { userId: req.userId! },
    update: {},
    create: { userId: req.userId! },
  });
  res.json(settings);
});

const patchSchema = z.object({
  lowBalance: z.boolean().optional(),
  budgetAlert: z.boolean().optional(),
  recurring: z.boolean().optional(),
  unusual: z.boolean().optional(),
  settlement: z.boolean().optional(),
  sync: z.boolean().optional(),
});

notificationsRouter.patch("/", async (req: AuthedRequest, res) => {
  const parsed = patchSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input" });
  const settings = await prisma.notificationSettings.upsert({
    where: { userId: req.userId! },
    update: parsed.data,
    create: { userId: req.userId!, ...parsed.data },
  });
  res.json(settings);
});
