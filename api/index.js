// api/index.js - Vercel serverless function entry point
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Import your existing routes
import healthRouter from "../backend/routes/health.js";
import servicesRouter from "../backend/routes/services.js";
import vendorsRouter from "../backend/routes/vendors.js";
import startupsRouter from "../backend/routes/startups.js";
import tenantsRouter from "../backend/routes/tenants.js";
import subscriptionsRouter from "../backend/routes/subscriptions.js";
import usersRouter from "../backend/routes/users.js";
import adminRouter from "../backend/routes/admin.js";
import auditLogsRouter from "../backend/routes/auditLogs.js";
import assistantRouter from "../backend/routes/assistant.js";
import messagesRouter from "../backend/routes/messages.js";
import walletsRouter from "../backend/routes/wallets.js";
import lmsRouter from "../backend/routes/lms.js";
import { tenantContext } from "../backend/middleware/tenantContext.js";
import { jwtAuthOptional } from "../backend/middleware/authJWT.js";
import { firebaseAuthRequired } from "../backend/middleware/authFirebase.js";
import { requireAdmin } from "../backend/middleware/isAdmin.js";
import { auditMutations } from "../backend/middleware/audit.js";
import { getData } from "../backend/utils/dataStore.js";

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

/* ------------------------ Core security & parsing ------------------------ */
app.use(helmet());
app.use(express.json({ limit: "20mb" }));

// CORS configuration for Vercel
const DEFAULT_ORIGINS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://marketplace-ui-react-vcl-6oct2025-4.vercel.app",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];

const ENV_ORIGINS = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const ALLOW_ORIGINS = Array.from(new Set([...ENV_ORIGINS, ...DEFAULT_ORIGINS]));

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);
      
      if (ALLOW_ORIGINS.includes(origin)) {
        return callback(null, true);
      }
      
      // Allow any *.vercel.app domain
      if (origin.endsWith('.vercel.app')) {
        return callback(null, true);
      }
      
      // Allow localhost for development
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return callback(null, true);
      }
      
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

/* -------- Attach tenant and (optional) user to each request globally ----- */
app.use(tenantContext);
app.use(jwtAuthOptional);
app.use(auditMutations);

/* -------------------------- Authenticated identity ---------------------- */
app.get("/api/me", firebaseAuthRequired, (req, res) => {
  try {
    const data = getData();
    const users = Array.isArray(data?.users) ? data.users : [];
    const userEmail = req.user.email?.toLowerCase();
    
    let userRole = "member";
    let userTenantId = "vendor";
    
    const foundUser = users.find(u => u?.email?.toLowerCase() === userEmail);
    if (foundUser) {
      userRole = foundUser.role || "member";
      userTenantId = foundUser.tenantId || "vendor";
    }
    
    if (userTenantId === "public") userTenantId = "vendor";
    
    console.log("📋 /api/me - User lookup:", {
      email: userEmail,
      foundInDB: !!foundUser,
      role: userRole,
      tenantId: userTenantId,
      foundUserData: foundUser,
      requestTenant: req.tenant?.id
    });
    
    res.json({
      uid: req.user.uid,
      email: req.user.email,
      role: userRole,
      tenantId: userTenantId
    });
  } catch (error) {
    console.error("❌ /api/me error:", error);
    res.status(500).json({ 
      status: "error", 
      message: "Failed to get user info" 
    });
  }
});

/* --------------------------------- Routes --------------------------------- */
app.use("/api/health", healthRouter);
app.use("/api/lms", lmsRouter);
app.use("/api/data/services", servicesRouter);
app.use("/api/data/vendors", vendorsRouter);
app.use("/api/data/startups", startupsRouter);
app.use("/api/tenants", tenantsRouter);
app.use("/api/users", usersRouter);
app.use("/api/admin", adminRouter);
app.use("/api/audit-logs", auditLogsRouter);
app.use("/api/subscriptions", subscriptionsRouter);
app.use("/api/assistant", assistantRouter);
app.use("/api/messages", messagesRouter);
app.use("/api/wallets", walletsRouter);

/* --------------------------------- 404 ----------------------------------- */
app.use((req, res) => {
  res.status(404).json({ status: "error", message: "Route not found" });
});

/* ------------------------------ Error handler ---------------------------- */
app.use((err, req, res, next) => {
  console.error("API Error:", err);
  res
    .status(err.status || 500)
    .json({ status: "error", message: err.message || "Server error" });
});

// Export the Express app for Vercel
export default app;
