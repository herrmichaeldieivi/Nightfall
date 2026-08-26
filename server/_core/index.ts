import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { COOKIE_NAME } from "@shared/const";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerGmailRoutes } from "../gmailRoutes";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createDeadlineAlertsForSchedule } from "../db";
import { runUniversityRequirementsWatchForSchedule } from "../requirementsWatchRunner";
import { createContext } from "./context";
import { authenticateRequest, createSessionToken, loginUser, registerUser } from "./auth";
import { requestEmailCode, verifyEmailCode } from "../emailVerification";
import { findOrCreateGoogleUser } from "../db";
import { ENV } from "./env";
import { getSessionCookieOptions } from "./cookies";
import { serveStatic, setupVite } from "./vite";

function requireCronSecret(req: express.Request): boolean {
  const provided = req.header("x-cron-secret") ?? req.query.secret;
  return typeof provided === "string" && provided.length > 0 && provided === ENV.cronSecret;
}

async function deadlineNudgeHandler(req: express.Request, res: express.Response) {
  if (!requireCronSecret(req)) return res.status(403).json({ error: "cron-only" });
  try {
    const taskUid = typeof req.query.taskUid === "string" ? req.query.taskUid : "";
    if (!taskUid) return res.status(400).json({ error: "taskUid required" });
    const result = await createDeadlineAlertsForSchedule(taskUid);
    return res.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message, context: { url: req.originalUrl }, timestamp: new Date().toISOString() });
  }
}

async function universityRequirementsHandler(req: express.Request, res: express.Response) {
  if (!requireCronSecret(req)) return res.status(403).json({ error: "cron-only" });
  try {
    const taskUid = typeof req.query.taskUid === "string" ? req.query.taskUid : "";
    if (!taskUid) return res.status(400).json({ error: "taskUid required" });
    const result = await runUniversityRequirementsWatchForSchedule(taskUid);
    return res.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message, context: { url: req.originalUrl }, timestamp: new Date().toISOString() });
  }
}

function setSessionCookie(res: express.Response, token: string) {
  res.cookie(COOKIE_NAME, token, { ...getSessionCookieOptions(), maxAge: ENV.sessionDurationMs });
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Security headers: HSTS, nosniff, frame protection, referrer policy.
  app.use(helmet({ contentSecurityPolicy: process.env.NODE_ENV === "production" ? undefined : false }));

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { error: "Too many attempts. Try again in 15 minutes." },
  });
  app.post("/api/auth/login", authLimiter);
  app.post("/api/auth/register", authLimiter);

  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerGmailRoutes(app);

  // Locally-stored student/admin uploads. Private: requires a session, and
  // users may only read their own subtree; admin intake files are admin-only.
  const { storageRead, uploadsDir } = await import("../storage");
  const path = await import("path");
  app.get("/files/*", async (req, res) => {
    try {
      const user = await authenticateRequest(req);
      const key = decodeURIComponent(req.path.replace(/^\/files\//, "")).replace(/\.\./g, "_");
      if (key.startsWith("students/")) {
        const ownerId = Number(key.split("/")[1]);
        if (user.role !== "admin" && ownerId !== user.id) return res.status(403).json({ error: "Forbidden" });
      } else if (key.startsWith("admin-intake/")) {
        if (user.role !== "admin") return res.status(403).json({ error: "Forbidden" });
      } else {
        return res.status(404).json({ error: "Not found" });
      }
      const file = await storageRead(key);
      if (!file) return res.status(404).json({ error: "Not found" });
      return res.sendFile(path.resolve(uploadsDir(), key));
    } catch {
      return res.status(401).json({ error: "Sign in to access your documents." });
    }
  });

  // Self-hosted credential auth. Registration and sign-in are gated by
  // #163/#164: a time-limited code must be requested for the email, verified,
  // and the resulting unlock token presented — acting as both an ownership
  // check and a rate-limit gate.
  app.post("/api/auth/request-code", authLimiter, async (req, res) => {
    try {
      const result = await requestEmailCode(req.body?.email ?? "");
      return res.json({ success: true, expiresAt: result.expiresAt.toISOString() });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not send the verification code.";
      return res.status(400).json({ error: message });
    }
  });

  app.post("/api/auth/verify-code", authLimiter, async (req, res) => {
    try {
      const result = await verifyEmailCode(req.body?.email ?? "", req.body?.code ?? "");
      return res.json({ success: true, unlockToken: result.unlockToken });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Verification failed.";
      return res.status(400).json({ error: message });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const user = await registerUser({ email: req.body?.email ?? "", name: req.body?.name ?? "", password: req.body?.password ?? "", unlockToken: req.body?.unlockToken ?? "" });
      if (!user) throw new Error("Could not create the account.");
      setSessionCookie(res, await createSessionToken(user));
      return res.json({ success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Registration failed.";
      return res.status(400).json({ error: message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const user = await loginUser({ email: req.body?.email ?? "", password: req.body?.password ?? "", unlockToken: req.body?.unlockToken ?? "" });
      setSessionCookie(res, await createSessionToken(user));
      return res.json({ success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Sign-in failed.";
      return res.status(401).json({ error: message });
    }
  });

  // Google OIDC sign-in. No SDK: the token endpoint is called over TLS and
  // the id_token subject is trusted from that direct server-to-server call.
  const googleConfig = () => ({ clientId: process.env.GOOGLE_CLIENT_ID ?? "", clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "" });
  app.get("/api/auth/google", async (req, res) => {
    const { clientId } = googleConfig();
    if (!clientId) return res.status(500).send("Google sign-in is not configured.");
    const nonce = Math.random().toString(36).slice(2) + Date.now().toString(36);
    res.cookie("google_auth_nonce", nonce, { httpOnly: true, secure: true, sameSite: "lax" as const, path: "/", maxAge: 10 * 60 * 1000 });
    const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("redirect_uri", `${req.protocol}://${req.get("host")}/api/auth/google/callback`);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", "openid email profile");
    url.searchParams.set("state", nonce);
    return res.redirect(url.toString());
  });

  app.get("/api/auth/google/callback", async (req, res) => {
    try {
      const { clientId, clientSecret } = googleConfig();
      const code = typeof req.query.code === "string" ? req.query.code : "";
      const state = typeof req.query.state === "string" ? req.query.state : "";
      const expectedNonce = (req.headers.cookie ?? "").split(";").map((p) => p.trim()).find((p) => p.startsWith("google_auth_nonce="))?.slice("google_auth_nonce=".length);
      res.clearCookie("google_auth_nonce", { path: "/" });
      if (!clientId || !clientSecret || !code || !state || !expectedNonce || state !== expectedNonce) return res.status(403).send("Invalid Google sign-in attempt.");
      const redirectUri = `${req.protocol}://${req.get("host")}/api/auth/google/callback`;
      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, grant_type: "authorization_code" }) });
      if (!tokenResponse.ok) return res.status(403).send("Google sign-in failed.");
      const tokens = (await tokenResponse.json()) as { id_token?: string };
      if (!tokens.id_token) return res.status(403).send("Google sign-in failed.");
      const claims = JSON.parse(Buffer.from(tokens.id_token.split(".")[1], "base64url").toString()) as { sub?: string; email?: string; name?: string };
      if (!claims.sub || !claims.email) return res.status(403).send("Google account did not share an email.");
      const user = await findOrCreateGoogleUser({ googleId: claims.sub, email: claims.email, name: claims.name ?? null });
      if (!user) throw new Error("user unavailable");
      setSessionCookie(res, await createSessionToken(user));
      return res.redirect("/dashboard");
    } catch (error) {
      console.error("[Auth] Google sign-in failed:", error);
      return res.status(403).send("Google sign-in failed.");
    }
  });

  app.post("/api/scheduled/deadline-nudges", deadlineNudgeHandler);
  app.post("/api/scheduled/university-requirements", universityRequirementsHandler);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const probe = net.createServer();
    probe.listen(port, () => {
      probe.close(() => resolve(true));
    });
    probe.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

startServer().catch(console.error);
