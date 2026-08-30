import "express-async-errors";
import express, { NextFunction, Request, Response } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import { env } from "./env";
import { authRouter } from "./routes/auth";
import { bootstrapRouter } from "./routes/bootstrap";
import { transactionsRouter } from "./routes/transactions";
import { accountsRouter } from "./routes/accounts";
import { budgetsRouter } from "./routes/budgets";
import { goalsRouter } from "./routes/goals";
import { sharedRouter } from "./routes/shared";
import { notificationsRouter } from "./routes/notifications";
import { integrationsRouter } from "./routes/integrations";

const app = express();

// Railway/Render terminate TLS at a reverse proxy in front of this app, so
// Express needs to trust the X-Forwarded-* headers to know a request was
// actually made over HTTPS (relevant once secure cookies are in play).
app.set("trust proxy", 1);

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRouter);
app.use("/api/bootstrap", bootstrapRouter);
app.use("/api/transactions", transactionsRouter);
app.use("/api/accounts", accountsRouter);
app.use("/api/budget", budgetsRouter);
app.use("/api/goals", goalsRouter);
app.use("/api/shared", sharedRouter);
app.use("/api/notifications", notificationsRouter);
app.use("/api/integrations", integrationsRouter);

const publicDir = path.join(__dirname, "..", "public");
app.use(express.static(publicDir));

app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) return next();
  res.sendFile(path.join(publicDir, "index.html"));
});

// Catches errors thrown/rejected anywhere in a route handler (express-async-errors
// forwards async rejections here too) so one bad request returns a 500 instead
// of crashing the whole server.
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  const message = err instanceof Error ? err.message : "Internal server error";
  res.status(500).json({ error: message });
});

app.listen(env.port, () => {
  console.log(`Minto server listening on http://localhost:${env.port}`);
});
