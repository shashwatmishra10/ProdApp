import "dotenv/config";

function bool(v: string | undefined, fallback: boolean): boolean {
  if (v === undefined) return fallback;
  return v === "true" || v === "1";
}

export const env = {
  port: Number(process.env.PORT || 4000),
  nodeEnv: process.env.NODE_ENV || "development",
  jwtSecret: process.env.JWT_SECRET || "dev-only-insecure-secret-change-me",
  databaseUrl: process.env.DATABASE_URL || "file:./prisma/dev.db",

  aa: {
    provider: (process.env.AA_PROVIDER || "mock").toLowerCase(),
    clientId: process.env.AA_CLIENT_ID || "",
    clientSecret: process.env.AA_CLIENT_SECRET || "",
    baseUrl: process.env.AA_BASE_URL || "https://fiu-sandbox.setu.co",
    redirectUrl: process.env.AA_REDIRECT_URL || "http://localhost:4000/api/integrations/aa/callback",
  },

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    redirectUrl: process.env.GOOGLE_REDIRECT_URL || "http://localhost:4000/api/integrations/gmail/callback",
  },
};

export const isAAConfigured = Boolean(env.aa.clientId && env.aa.clientSecret && env.aa.provider === "setu");
export const isGoogleConfigured = Boolean(env.google.clientId && env.google.clientSecret);
