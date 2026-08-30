import { Router } from "express";
import { prisma } from "../db";
import { requireAuth, AuthedRequest } from "../middleware/auth";
import { getAAProvider } from "../integrations/aa";
import { guessCategory } from "../utils/categorize";
import { isGoogleConfigured } from "../env";
import { getAuthUrl, exchangeCodeForTokens, listRecentTransactionEmails } from "../integrations/gmail/googleClient";
import { parseReceiptEmail } from "../integrations/gmail/parser";

export const integrationsRouter = Router();
integrationsRouter.use(requireAuth);

// When the category heuristic can't confidently classify a narration/subject
// (falls back to "Others"), check whether this exact merchant has already
// been categorized for this user — manually, or from an earlier import — and
// reuse that instead. This is what makes a merchant "learned" after the
// first time it shows up, rather than re-guessed on every sync.
async function resolveCategory(userId: string, merchant: string, guess: string): Promise<string> {
  if (guess !== "Others") return guess;
  const past = await prisma.transaction.findMany({
    where: { userId, NOT: { category: "Others" } },
    select: { merchant: true, category: true },
  });
  const match = past.find((p) => p.merchant.toLowerCase() === merchant.toLowerCase());
  return match ? match.category : "Others";
}

// ---------------------------------------------------------------------------
// Bank Account Aggregator
// ---------------------------------------------------------------------------

integrationsRouter.get("/aa/status", async (req: AuthedRequest, res) => {
  const conn = await prisma.aAConnection.findUnique({ where: { userId: req.userId! } });
  res.json(conn ? { status: conn.status, provider: conn.provider, lastSyncAt: conn.lastSyncAt } : { status: "NOT_CONNECTED" });
});

async function importAAData(userId: string, consentId: string) {
  const provider = getAAProvider();
  const data = await provider.fetchData(consentId);

  const refToAccountId = new Map<string, string>();
  for (const acc of data.accounts) {
    const byExternalRef = await prisma.account.findFirst({ where: { userId, externalRef: acc.linkRefNumber } });
    // A manually-created account can already occupy this name (unique per user),
    // so link to it instead of colliding on create.
    const byName = byExternalRef ? null : await prisma.account.findUnique({ where: { userId_name: { userId, name: acc.accountName } } });
    const record =
      byExternalRef ||
      (byName
        ? await prisma.account.update({ where: { id: byName.id }, data: { provider: "AA", externalRef: acc.linkRefNumber } })
        : await prisma.account.create({
            data: {
              userId,
              name: acc.accountName,
              type: acc.fiType === "CREDIT_CARD" ? "CREDIT_CARD" : "SAVINGS",
              provider: "AA",
              externalRef: acc.linkRefNumber,
            },
          }));
    refToAccountId.set(acc.linkRefNumber, record.id);
  }

  let imported = 0;
  for (const txn of data.transactions) {
    const accountId = refToAccountId.get(txn.linkRefNumber);
    if (!accountId) continue;
    const externalId = `aa:${txn.externalId}`;
    const existing = await prisma.transaction.findFirst({ where: { userId, externalId } });
    if (existing) continue;
    await prisma.transaction.create({
      data: {
        userId,
        accountId,
        merchant: txn.narration,
        amount: txn.amount,
        category: await resolveCategory(userId, txn.narration, guessCategory(txn.narration)),
        type: txn.type === "CREDIT" ? "INCOME" : "EXPENSE",
        payment: "Bank transfer",
        date: new Date(txn.valueDate),
        source: "AA",
        recurring: false,
        externalId,
      },
    });
    imported++;
  }
  return imported;
}

integrationsRouter.post("/aa/connect", async (req: AuthedRequest, res) => {
  const userId = req.userId!;
  const provider = getAAProvider();
  const consent = await provider.createConsent(userId);

  await prisma.aAConnection.upsert({
    where: { userId },
    update: { provider: provider.name, consentHandle: consent.consentHandle, status: "PENDING" },
    create: { userId, provider: provider.name, consentHandle: consent.consentHandle, status: "PENDING" },
  });

  // The mock provider approves instantly (no real bank redirect exists), so
  // finish the flow inline for a smooth demo. The real Setu provider returns
  // an approvalUrl the frontend must open; completion happens via /aa/callback.
  if (provider.name === "mock") {
    const statusResult = await provider.getConsentStatus(consent.consentHandle);
    if (statusResult.status === "ACTIVE" && statusResult.consentId) {
      const imported = await importAAData(userId, statusResult.consentId);
      await prisma.aAConnection.update({
        where: { userId },
        data: { status: "ACTIVE", consentId: statusResult.consentId, lastSyncAt: new Date() },
      });
      return res.json({ status: "ACTIVE", imported, mock: true });
    }
  }

  res.json({ status: "PENDING", approvalUrl: consent.approvalUrl });
});

integrationsRouter.get("/aa/callback", async (req: AuthedRequest, res) => {
  const userId = req.userId!;
  const conn = await prisma.aAConnection.findUnique({ where: { userId } });
  if (!conn?.consentHandle) return res.redirect("/?aa=error");

  const provider = getAAProvider();
  const statusResult = await provider.getConsentStatus(conn.consentHandle);

  if (statusResult.status === "ACTIVE" && statusResult.consentId) {
    await importAAData(userId, statusResult.consentId);
    await prisma.aAConnection.update({
      where: { userId },
      data: { status: "ACTIVE", consentId: statusResult.consentId, lastSyncAt: new Date() },
    });
    return res.redirect("/?aa=connected");
  }
  await prisma.aAConnection.update({ where: { userId }, data: { status: statusResult.status } });
  res.redirect(`/?aa=${statusResult.status.toLowerCase()}`);
});

integrationsRouter.post("/aa/sync", async (req: AuthedRequest, res) => {
  const userId = req.userId!;
  const conn = await prisma.aAConnection.findUnique({ where: { userId } });
  if (!conn || conn.status !== "ACTIVE" || !conn.consentId) {
    return res.status(400).json({ error: "No active bank connection. Connect your bank first." });
  }
  const imported = await importAAData(userId, conn.consentId);
  await prisma.aAConnection.update({ where: { userId }, data: { lastSyncAt: new Date() } });
  res.json({ imported });
});

integrationsRouter.post("/aa/disconnect", async (req: AuthedRequest, res) => {
  await prisma.aAConnection.updateMany({ where: { userId: req.userId! }, data: { status: "REVOKED" } });
  res.json({ ok: true });
});

// ---------------------------------------------------------------------------
// Gmail receipt capture
// ---------------------------------------------------------------------------

integrationsRouter.get("/gmail/status", async (req: AuthedRequest, res) => {
  const conn = await prisma.gmailConnection.findUnique({ where: { userId: req.userId! } });
  res.json({
    configured: isGoogleConfigured,
    status: conn?.status || "DISCONNECTED",
    email: conn?.email || null,
    lastSyncAt: conn?.lastSyncAt || null,
  });
});

integrationsRouter.get("/gmail/connect", (req: AuthedRequest, res) => {
  if (!isGoogleConfigured) {
    return res.status(400).json({ error: "Gmail integration is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET." });
  }
  // `state` carries the userId back through Google's redirect. Good enough for
  // this MVP since the callback still requires a code exchange to do anything;
  // swap for a signed/expiring token before production use.
  const url = getAuthUrl(req.userId!);
  res.json({ url });
});

integrationsRouter.get("/gmail/callback", async (req: AuthedRequest, res) => {
  // Trust the authenticated session for which account to attach tokens to,
  // rather than the `state` query param, so a tampered redirect can't link
  // Gmail access to a different user than the one who started the flow.
  const code = String(req.query.code || "");
  const userId = req.userId!;
  if (!code) return res.redirect("/?gmail=error");

  try {
    const tokens = await exchangeCodeForTokens(code);
    await prisma.gmailConnection.upsert({
      where: { userId },
      update: {
        accessToken: tokens.access_token || undefined,
        refreshToken: tokens.refresh_token || undefined,
        tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        status: "CONNECTED",
      },
      create: {
        userId,
        accessToken: tokens.access_token || undefined,
        refreshToken: tokens.refresh_token || undefined,
        tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        status: "CONNECTED",
      },
    });
    res.redirect("/?gmail=connected");
  } catch (err) {
    console.error("Gmail OAuth callback failed", err);
    res.redirect("/?gmail=error");
  }
});

integrationsRouter.post("/gmail/sync", async (req: AuthedRequest, res) => {
  const userId = req.userId!;
  const conn = await prisma.gmailConnection.findUnique({ where: { userId } });
  if (!conn || conn.status !== "CONNECTED" || !conn.accessToken) {
    return res.status(400).json({ error: "Gmail is not connected." });
  }

  const messages = await listRecentTransactionEmails(conn.accessToken, conn.refreshToken);
  const cashAccount = await prisma.account.upsert({
    where: { userId_name: { userId, name: "Cash" } },
    update: {},
    create: { userId, name: "Cash", type: "CASH", provider: "MANUAL" },
  });

  let imported = 0;
  for (const msg of messages) {
    const parsed = parseReceiptEmail(msg);
    if (!parsed) continue;
    const externalId = `gmail:${msg.id}`;
    const existing = await prisma.transaction.findFirst({ where: { userId, externalId } });
    if (existing) continue;
    await prisma.transaction.create({
      data: {
        userId,
        accountId: cashAccount.id,
        merchant: parsed.merchant,
        amount: parsed.amount,
        category: await resolveCategory(userId, parsed.merchant, parsed.category),
        type: parsed.type,
        payment: "UPI",
        date: new Date(parsed.date),
        source: "GMAIL",
        recurring: false,
        externalId,
      },
    });
    imported++;
  }

  await prisma.gmailConnection.update({ where: { userId }, data: { lastSyncAt: new Date() } });
  res.json({ imported, scanned: messages.length });
});

integrationsRouter.post("/gmail/disconnect", async (req: AuthedRequest, res) => {
  await prisma.gmailConnection.updateMany({ where: { userId: req.userId! }, data: { status: "DISCONNECTED", accessToken: null, refreshToken: null } });
  res.json({ ok: true });
});
