import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import { pinoHttp } from "pino-http";
import { rateLimit } from "express-rate-limit";
import compression from "compression";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

// ─── Trust Proxy (needed for Vercel / Railway / Render) ──────────────────────
app.set("trust proxy", 1);

// ─── Compression (gzip all responses — reduces bandwidth by ~60-70%) ─────────
app.use(compression());

// ─── Request Logging ──────────────────────────────────────────────────────────
app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req: any) {
        return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
      },
      res(res: any) {
        return { statusCode: res.statusCode };
      },
    },
  }),
);

// ─── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
  : ["http://localhost:5173", "http://localhost:3000"];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin) || allowedOrigins.includes("*")) {
        return callback(null, true);
      }
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);

// ─── Body Parsers ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));

// ─── Global Rate Limiter (prevents abuse / DDoS) ─────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,                  // 500 requests per IP per 15 min (generous for real users)
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please try again in a few minutes." },
});

// ─── Stricter limiter for auth endpoints ──────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,                   // Only 30 login/register attempts per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many auth attempts. Please wait 15 minutes." },
});

app.use("/api", globalLimiter);
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);

// ─── Cache Headers for public/static API responses ───────────────────────────
app.use("/api", (req: Request, res: Response, next: NextFunction) => {
  // Don't cache auth or mutation endpoints
  if (req.method !== "GET") {
    res.setHeader("Cache-Control", "no-store");
  } else {
    // Short cache for GET endpoints (10 seconds) — helps with burst traffic
    res.setHeader("Cache-Control", "public, max-age=10, stale-while-revalidate=20");
  }
  next();
});

// ─── Health Check (no rate limit, used by hosting platforms) ─────────────────
app.get("/health", (_req, res) => res.json({ status: "ok", ts: Date.now() }));

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use("/api", router);

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  logger.error(err, "Unhandled error");
  const status = err.status || err.statusCode || 500;
  res.status(status).json({ error: err.message || "Internal server error" });
});

export default app;
