import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { requireAuth, AuthedRequest } from "../middleware/auth";
import { serializeTransaction } from "../utils/serialize";
import { isSmtpConfigured } from "../env";
import { sendCsvEmail } from "../integrations/email/mailer";

export const transactionsRouter = Router();
transactionsRouter.use(requireAuth);

transactionsRouter.get("/", async (req: AuthedRequest, res) => {
  const txns = await prisma.transaction.findMany({
    where: { userId: req.userId! },
    include: { account: true },
    orderBy: { date: "desc" },
  });
  res.json(txns.map(serializeTransaction));
});

const createSchema = z.object({
  merchant: z.string().min(1).max(120),
  amount: z.number().positive(),
  category: z.string().min(1).max(60),
  type: z.enum(["EXPENSE", "INCOME", "TRANSFER", "REFUND"]),
  payment: z.string().min(1).max(40),
  date: z.string().min(1),
  account: z.string().min(1).max(80),
  toAccount: z.string().max(80).optional(),
  notes: z.string().max(500).optional(),
  recurring: z.boolean().optional(),
});

async function findOrCreateAccount(userId: string, name: string) {
  const existing = await prisma.account.findUnique({ where: { userId_name: { userId, name } } });
  if (existing) return existing;
  const type = /credit/i.test(name) ? "CREDIT_CARD" : name === "Cash" ? "CASH" : "SAVINGS";
  return prisma.account.create({ data: { userId, name, type, provider: "MANUAL" } });
}

transactionsRouter.post("/", async (req: AuthedRequest, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message || "Invalid input" });
  const data = parsed.data;
  const userId = req.userId!;

  if (data.type === "TRANSFER") {
    if (!data.toAccount) return res.status(400).json({ error: "toAccount is required for transfers" });
    const fromAccount = await findOrCreateAccount(userId, data.account);
    const toAccount = await findOrCreateAccount(userId, data.toAccount);
    const [out, into] = await prisma.$transaction([
      prisma.transaction.create({
        data: {
          userId, accountId: fromAccount.id, merchant: data.merchant, amount: data.amount,
          category: data.category, type: "TRANSFER", payment: data.payment, date: new Date(data.date),
          source: "MANUAL", notes: data.notes, recurring: Boolean(data.recurring), transferSide: "OUT",
        },
        include: { account: true },
      }),
      prisma.transaction.create({
        data: {
          userId, accountId: toAccount.id, merchant: data.merchant, amount: data.amount,
          category: data.category, type: "TRANSFER", payment: data.payment, date: new Date(data.date),
          source: "MANUAL", notes: data.notes, recurring: Boolean(data.recurring), transferSide: "IN",
        },
        include: { account: true },
      }),
    ]);
    return res.status(201).json([serializeTransaction(out), serializeTransaction(into)]);
  }

  const account = await findOrCreateAccount(userId, data.account);
  const txn = await prisma.transaction.create({
    data: {
      userId, accountId: account.id, merchant: data.merchant, amount: data.amount,
      category: data.category, type: data.type, payment: data.payment, date: new Date(data.date),
      source: "MANUAL", notes: data.notes, recurring: Boolean(data.recurring),
    },
    include: { account: true },
  });
  res.status(201).json(serializeTransaction(txn));
});

transactionsRouter.delete("/:id", async (req: AuthedRequest, res) => {
  const txn = await prisma.transaction.findFirst({ where: { id: req.params.id, userId: req.userId! } });
  if (!txn) return res.status(404).json({ error: "Not found" });
  await prisma.transaction.delete({ where: { id: txn.id } });
  res.json({ ok: true });
});

const emailExportSchema = z.object({
  email: z.string().email(),
  csv: z.string().min(1).max(2_000_000),
});

// The CSV is built client-side from the user's own already-fetched transactions
// (respecting whatever filters they had applied) and emailed as-is — no phone
// screen has to render or download a file, which nobody does from a phone anyway.
transactionsRouter.post("/email-export", async (req: AuthedRequest, res) => {
  if (!isSmtpConfigured) return res.status(400).json({ error: "Email delivery is not configured yet." });
  const parsed = emailExportSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message || "Invalid input" });
  const filename = `minto-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
  await sendCsvEmail(parsed.data.email, parsed.data.csv, filename);
  res.json({ ok: true });
});
