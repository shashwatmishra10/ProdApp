import { guessCategory } from "../../utils/categorize";

export interface ParsedReceiptEmail {
  merchant: string;
  amount: number;
  type: "EXPENSE" | "INCOME";
  category: string;
  date: string; // YYYY-MM-DD
}

const AMOUNT_RE = /(?:₹|Rs\.?|INR)\s?([0-9][0-9,]*(?:\.[0-9]{1,2})?)/i;
const DEBIT_RE = /\b(debited|spent|paid|purchase|order\s*confirmed|payment\s*successful)\b/i;
const CREDIT_RE = /\b(credited|received|refund(ed)?|deposit(ed)?)\b/i;

function guessMerchant(from: string, subject: string): string {
  const nameMatch = from.match(/^"?([^"<]+)"?\s*</);
  const rawName = (nameMatch?.[1] || from.split("@")[0] || subject).trim();
  return rawName
    .replace(/\b(alerts?|no[-.]?reply|notifications?|team)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim() || "Unknown merchant";
}

/** Best-effort extraction of a transaction from a bank/merchant notification email.
 *  Returns null when the email doesn't look like a transaction alert at all. */
export function parseReceiptEmail(input: { subject: string; from: string; snippet: string; date: string }): ParsedReceiptEmail | null {
  const text = `${input.subject} ${input.snippet}`;
  const amountMatch = text.match(AMOUNT_RE);
  if (!amountMatch) return null;

  const amount = Number(amountMatch[1].replace(/,/g, ""));
  if (!amount || amount <= 0) return null;

  const isCredit = CREDIT_RE.test(text) && !DEBIT_RE.test(text);
  const parsedDate = new Date(input.date);
  const date = isNaN(parsedDate.getTime()) ? new Date().toISOString().slice(0, 10) : parsedDate.toISOString().slice(0, 10);

  return {
    merchant: guessMerchant(input.from, input.subject),
    amount,
    type: isCredit ? "INCOME" : "EXPENSE",
    category: isCredit ? "Others" : guessCategory(text),
    date,
  };
}
