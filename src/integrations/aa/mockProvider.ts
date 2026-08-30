import { AAConsentResult, AAConsentStatusResult, AADataFetchResult, AAProvider } from "./types";

const pendingConsents = new Map<string, string>(); // consentHandle -> userId

/**
 * Simulated Account Aggregator provider used automatically when no real AA
 * credentials are configured (AA_PROVIDER=mock, the default). It mimics the
 * real consent lifecycle (PENDING -> ACTIVE) and returns clearly-labeled
 * simulated bank data so the rest of the app (imports, dedupe, sync status)
 * can be exercised end-to-end before a real Setu sandbox key is available.
 */
export class MockAAProvider implements AAProvider {
  readonly name = "mock";

  async createConsent(userId: string): Promise<AAConsentResult> {
    const consentHandle = `mock-consent-${Date.now()}`;
    pendingConsents.set(consentHandle, userId);
    // No real bank redirect exists in mock mode; the frontend treats this as
    // "instantly approvable" and calls the callback endpoint directly.
    return { consentHandle, approvalUrl: `/api/integrations/aa/callback?consentHandle=${consentHandle}&mock=1` };
  }

  async getConsentStatus(consentHandle: string): Promise<AAConsentStatusResult> {
    if (!pendingConsents.has(consentHandle)) return { status: "PENDING" };
    return { status: "ACTIVE", consentId: consentHandle };
  }

  async fetchData(consentId: string): Promise<AADataFetchResult> {
    const today = new Date();
    const daysAgo = (n: number) => new Date(today.getTime() - n * 24 * 3600 * 1000).toISOString().slice(0, 10);

    return {
      accounts: [
        { linkRefNumber: "mock-hdfc-001", fiType: "DEPOSIT", maskedAccNumber: "XXXX4821", accountName: "HDFC Savings", bank: "HDFC Bank" },
        { linkRefNumber: "mock-icici-001", fiType: "DEPOSIT", maskedAccNumber: "XXXX9033", accountName: "ICICI Savings", bank: "ICICI Bank" },
      ],
      transactions: [
        { externalId: `${consentId}-t1`, linkRefNumber: "mock-hdfc-001", narration: "ATM Withdrawal", amount: 2000, type: "DEBIT", valueDate: daysAgo(2) },
        { externalId: `${consentId}-t2`, linkRefNumber: "mock-hdfc-001", narration: "IMPS/UPI-Grocery Store", amount: 845, type: "DEBIT", valueDate: daysAgo(1) },
        { externalId: `${consentId}-t3`, linkRefNumber: "mock-icici-001", narration: "Interest Credit", amount: 210, type: "CREDIT", valueDate: daysAgo(5) },
      ],
    };
  }
}
