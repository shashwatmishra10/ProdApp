import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { requireAuth, AuthedRequest } from "../middleware/auth";
import { serializeSharedGroup } from "../utils/serialize";

export const sharedRouter = Router();
sharedRouter.use(requireAuth);

sharedRouter.get("/", async (req: AuthedRequest, res) => {
  const groups = await prisma.sharedGroup.findMany({
    where: { userId: req.userId! },
    include: { participants: true },
    orderBy: { date: "desc" },
  });
  res.json(groups.map(serializeSharedGroup));
});

const participantSchema = z.object({ name: z.string().min(1), share: z.number().nonnegative(), paid: z.number().nonnegative(), settled: z.boolean() });
const createSchema = z.object({
  name: z.string().min(1).max(100),
  date: z.string().min(1),
  participants: z.array(participantSchema).min(1),
});

sharedRouter.post("/", async (req: AuthedRequest, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message || "Invalid input" });
  const d = parsed.data;
  const group = await prisma.sharedGroup.create({
    data: {
      userId: req.userId!, name: d.name, date: new Date(d.date), status: "OPEN",
      participants: { create: d.participants },
    },
    include: { participants: true },
  });
  res.status(201).json(serializeSharedGroup(group));
});

sharedRouter.post("/:id/settle", async (req: AuthedRequest, res) => {
  const group = await prisma.sharedGroup.findFirst({ where: { id: req.params.id, userId: req.userId! }, include: { participants: true } });
  if (!group) return res.status(404).json({ error: "Not found" });
  await prisma.sharedParticipant.updateMany({ where: { groupId: group.id, NOT: { name: "You" } }, data: { settled: true } });
  const updated = await prisma.sharedGroup.update({
    where: { id: group.id }, data: { status: "SETTLED" }, include: { participants: true },
  });
  res.json(serializeSharedGroup(updated));
});
