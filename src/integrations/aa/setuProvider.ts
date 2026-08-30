import { env } from "../../env";
import { AAConsentResult, AAConsentStatusResult, AADataFetchResult, AAProvider } from "./types";

/**
 * Real Account Aggregator client for Setu's FIU sandbox/production API.
 * Endpoint shapes follow Setu's documented AA data flow:
 *   1. POST /consents            -> create a consent request, get a consentHandle + redirect/approvalUrl
 *   2. GET  /consents/{handle}   -> poll consent status until ACTIVE (user approved in their AA app)
 *   3. POST /sessions            -> start a FI data session for an ACTIVE consent
 *   4. GET  /sessions/{id}       -> poll until COMPLETED, then read decrypted FI data
 *
 * Verify exact request/response fields against the current Setu AA API reference
 * (https://docs.setu.co/data/account-aggregator) before going live — FIU sandbox
 * contracts are versioned and can change. This class is wired for that flow and
 * only activates when AA_PROVIDER=setu plus AA_CLIENT_ID/AA_CLIENT_SECRET are set.
 */
export class SetuAAProvider implements AAProvider {
  readonly name = "setu";

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${env.aa.baseUrl}${path}`, {
      ...init,
      headers: {
        "content-type": "application/json",
        "x-client-id": env.aa.clientId,
        "x-client-secret": env.aa.clientSecret,
        ...(init?.headers || {}),
      },
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Setu AA request failed (${res.status} ${path}): ${body}`);
    }
    return res.json() as Promise<T>;
  }

  async createConsent(userId: string): Promise<AAConsentResult> {
    const body = await this.request<{ id: string; url: string }>("/consents", {
      method: "POST",
      body: JSON.stringify({
        consentDuration: { unit: "MONTH", value: "12" },
        context: [{ key: "userId", value: userId }],
        fetchType: "PERIODIC",
        vua: `${userId}@minto`,
        dataRange: { from: new Date(Date.now() - 90 * 24 * 3600 * 1000).toISOString(), to: new Date().toISOString() },
        consentTypes: ["TRANSACTIONS", "PROFILE"],
        fiTypes: ["DEPOSIT", "CREDIT_CARD"],
        redirectUrl: env.aa.redirectUrl,
      }),
    });
    return { consentHandle: body.id, approvalUrl: body.url };
  }

  async getConsentStatus(consentHandle: string): Promise<AAConsentStatusResult> {
    const body = await this.request<{ status: string; consentId?: string }>(`/consents/${consentHandle}`);
    const status = body.status.toUpperCase();
    if (status === "ACTIVE") return { status: "ACTIVE", consentId: body.consentId };
    if (status === "REJECTED") return { status: "REJECTED" };
    if (status === "REVOKED") return { status: "REVOKED" };
    return { status: "PENDING" };
  }

  async fetchData(consentId: string): Promise<AADataFetchResult> {
    const session = await this.request<{ id: string }>("/sessions", {
      method: "POST",
      body: JSON.stringify({ consentId, dataRange: { from: new Date(Date.now() - 90 * 24 * 3600 * 1000).toISOString(), to: new Date().toISOString() }, format: "json" }),
    });

    for (let attempt = 0; attempt < 10; attempt++) {
      const status = await this.request<{ status: string; accounts?: any[] }>(`/sessions/${session.id}`);
      if (status.status === "COMPLETED") {
        const accounts = status.accounts || [];
        return {
          accounts: accounts.map((a) => ({
            linkRefNumber: a.linkRefNumber,
            fiType: a.fiType === "CREDIT_CARD" ? "CREDIT_CARD" : "DEPOSIT",
            maskedAccNumber: a.maskedAccNumber,
            accountName: a.accountName || a.fipName || "Bank account",
            bank: a.fipName || "Bank",
          })),
          transactions: accounts.flatMap((a) =>
            (a.transactions?.txn || []).map((t: any) => ({
              externalId: t.txnId || `${a.linkRefNumber}-${t.valueDate}-${t.amount}`,
              linkRefNumber: a.linkRefNumber,
              narration: t.narration || "Bank transaction",
              amount: Number(t.amount),
              type: t.type === "CREDIT" ? "CREDIT" : "DEBIT",
              valueDate: (t.valueDate || "").slice(0, 10),
            }))
          ),
        };
      }
      await new Promise((r) => setTimeout(r, 1500));
    }
    throw new Error("Setu AA data session did not complete in time");
  }
}
