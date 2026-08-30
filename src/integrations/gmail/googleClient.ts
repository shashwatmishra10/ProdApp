import { google } from "googleapis";
import { env, isGoogleConfigured } from "../../env";

const SCOPES = ["https://www.googleapis.com/auth/gmail.readonly", "openid", "email"];

export function assertGoogleConfigured() {
  if (!isGoogleConfigured) {
    throw new Error("Gmail integration is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to enable it.");
  }
}

export function buildOAuthClient() {
  assertGoogleConfigured();
  return new google.auth.OAuth2(env.google.clientId, env.google.clientSecret, env.google.redirectUrl);
}

/** Builds the URL Minto sends the user to so they can grant read-only Gmail access. */
export function getAuthUrl(state: string): string {
  const client = buildOAuthClient();
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
    state,
  });
}

export async function exchangeCodeForTokens(code: string) {
  const client = buildOAuthClient();
  const { tokens } = await client.getToken(code);
  return tokens;
}

export function gmailClientFor(accessToken: string, refreshToken: string | null) {
  const client = buildOAuthClient();
  client.setCredentials({ access_token: accessToken, refresh_token: refreshToken || undefined });
  return google.gmail({ version: "v1", auth: client });
}

/** Common Indian bank/merchant senders and subject keywords that carry transaction alerts. */
const SEARCH_QUERY =
  '(from:(alerts.*bank OR *bank.co.in OR *bank.com OR hdfcbank OR icicibank OR axisbank OR swiggy OR zomato OR amazon OR uber) OR subject:(debited OR credited OR "transaction alert" OR "payment successful" OR "order confirmed")) newer_than:30d';

export async function listRecentTransactionEmails(accessToken: string, refreshToken: string | null) {
  const gmail = gmailClientFor(accessToken, refreshToken);
  const list = await gmail.users.messages.list({ userId: "me", q: SEARCH_QUERY, maxResults: 25 });
  const ids = list.data.messages || [];

  const messages = await Promise.all(
    ids.map(async (m) => {
      const msg = await gmail.users.messages.get({ userId: "me", id: m.id!, format: "metadata", metadataHeaders: ["Subject", "From", "Date"] });
      const headers = msg.data.payload?.headers || [];
      const get = (name: string) => headers.find((h) => h.name === name)?.value || "";
      return {
        id: msg.data.id!,
        subject: get("Subject"),
        from: get("From"),
        date: get("Date"),
        snippet: msg.data.snippet || "",
      };
    })
  );
  return messages;
}
