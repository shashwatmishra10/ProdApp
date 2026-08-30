export interface AALinkedAccount {
  linkRefNumber: string;
  fiType: "DEPOSIT" | "CREDIT_CARD";
  maskedAccNumber: string;
  accountName: string;
  bank: string;
}

export interface AAFetchedTransaction {
  externalId: string;
  linkRefNumber: string;
  narration: string;
  amount: number;
  type: "CREDIT" | "DEBIT";
  valueDate: string; // YYYY-MM-DD
}

export interface AAConsentResult {
  consentHandle: string;
  /** URL the end user should be sent to in order to approve the consent in their AA app. */
  approvalUrl: string;
}

export interface AAConsentStatusResult {
  status: "PENDING" | "ACTIVE" | "REJECTED" | "REVOKED";
  consentId?: string;
}

export interface AADataFetchResult {
  accounts: AALinkedAccount[];
  transactions: AAFetchedTransaction[];
}

/**
 * Contract for a Bank Account Aggregator provider (India's RBI-regulated AA
 * framework: an FIU like Minto requests a user's consent, the user approves
 * it in their AA app, then the FIU pulls FI (financial information) data for
 * the approved accounts). Implementations: SetuAAProvider (real) and
 * MockAAProvider (simulated, used automatically without real credentials).
 */
export interface AAProvider {
  readonly name: string;
  createConsent(userId: string): Promise<AAConsentResult>;
  getConsentStatus(consentHandle: string): Promise<AAConsentStatusResult>;
  fetchData(consentId: string): Promise<AADataFetchResult>;
}
