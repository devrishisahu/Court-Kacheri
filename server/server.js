import express from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import path from "path";
import fs from "fs";
import http from "http";
import { fileURLToPath } from "url";
import "dotenv/config";

import validateEnv from "./config/validateEnv.js";
import connectDB from "./config/db.js";
import logger from "./config/logger.js";
import errorHandler from "./middleware/errorHandler.js";
import compression from "compression";
import { apiLimiter } from "./middleware/rateLimiter.js";
import { initSocket } from "./config/socket.js";

// Route imports
import authRoutes from "./routes/authRoutes.js";
import firmRoutes from "./routes/firmRoutes.js";
import clientRoutes from "./routes/clientRoutes.js";
import caseRoutes from "./routes/caseRoutes.js";
import documentRoutes from "./routes/documentRoutes.js";
import deadlineRoutes from "./routes/deadlineRoutes.js";
import timeEntryRoutes from "./routes/timeEntryRoutes.js";
import billingRoutes from "./routes/billingRoutes.js";
import superAdminRoutes from "./routes/superAdminRoutes.js";
import publicRoutes from "./routes/publicRoutes.js";
import meetingRoutes from "./routes/meetingRoutes.js";

// ─── Validate environment variables ──────────────────────────────────
validateEnv();

// ─── ESM __dirname polyfill ──────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Initialise Express & HTTP Server ──────────────────────────────────
const app = express();
const httpServer = http.createServer(app);

// ✅ IMPORTANT (Render fix)
app.set("trust proxy", 1);

// ─── Initialise Socket.io ──────────────────────────────────────────────
initSocket(httpServer);

// // ─── CORS Configuration (MUST be before helmet & rate limiter) ───────
// const corsOptions = {
//   origin: process.env.CORS_ORIGIN === '*'
//     ? '*'
//     : process.env.CORS_ORIGIN.split(',').map((o) => o.trim()),
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization'],
//   credentials: true,
//   maxAge: 86400, // 24 hours preflight cache
// };
// app.use(cors(corsOptions));

// ─── CORS (simplified for monolith) ──────────────────
app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);

// ─── Security Middleware ──────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginOpenerPolicy: false,
  }),
);
app.use(compression());
app.use(apiLimiter); // Global rate limiter

// ─── Body Parsers ─────────────────────────────────────────────────────
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// ─── HTTP Request Logging ─────────────────────────────────────────────
const morganFormat = process.env.NODE_ENV === "production" ? "combined" : "dev";
app.use(morgan(morganFormat, { stream: logger.stream }));

// ─── Ensure folders ──────────────────────────────────
["uploads", "logs"].forEach((dir) => {
  const dirPath = path.join(__dirname, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
});

// Serve uploaded files securely via routes instead of statically
// REMOVED: app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── API Routes ───────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/firms", firmRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/cases", caseRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/deadlines", deadlineRoutes);
app.use("/api/time-entries", timeEntryRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/admin", superAdminRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/meetings", meetingRoutes);

// ─── Health Check ─────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({
    success: true,
    message: "Court-Kacheri API is running 🚀",
    version: "2.0.0",
  });
});

// ─── Serve Frontend in Production ──────────────────────────────────────
if (process.env.NODE_ENV === "production") {
  const clientDistPath = path.join(__dirname, "..", "client", "dist");

  if (fs.existsSync(clientDistPath)) {
    // Serve static files from the React app
    app.use(express.static(clientDistPath));

    // Handle any request that doesn't match the ones above (SPA routing)
    app.get("*", (req, res, next) => {
      if (req.originalUrl.startsWith("/api")) return next();
      res.sendFile(path.join(clientDistPath, "index.html"));
    });
  } else {
    logger.warn("⚠️ Client dist not found. Frontend not served.");
  }
}

// ─── 404 Handler ──────────────────────────────────────────────────────
app.use((req, res) => {
  if (req.originalUrl.startsWith("/api")) {
    return res
      .status(404)
      .json({
        success: false,
        message: `API route ${req.originalUrl} not found`,
      });
  }
  // If not production or frontend missing, this 404 will trigger
  res.status(404).send("Not Found");
});

// ─── Global Error Handler ─────────────────────────────────────────────
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  httpServer.listen(PORT, () => {
    logger.info(
      `🚀 Court-Kacheri server running on port ${PORT} [${process.env.NODE_ENV}]`,
    );
  });
});
