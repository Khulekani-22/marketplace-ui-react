import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import healthRouter from "./routes/health.js";
import servicesRouter from "./routes/services.js";
import vendorsRouter from "./routes/vendors.js";
import tenantsRouter from "./routes/tenants.js";
import { tenantContext } from "./middleware/tenantContext.js";
import { jwtAuthOptional } from "./middleware/authJWT.js";
import { firebaseAuthRequired } from "./middleware/authFirebase.js";


app.get("/api/me", firebaseAuthRequired, (req, res) => res.json(req.user));


dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(express.json({ limit: "1mb" }));
app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(",") ?? "*",
    credentials: true,
  })
);
app.use(
  morgan(process.env.NODE_ENV === "production" ? "combined" : "dev")
);

// Attach tenant and (optional) user to each request
app.use(tenantContext);
app.use(jwtAuthOptional);

// Routes
app.use("/api/health", healthRouter);
app.use("/api/data/services", servicesRouter);
app.use("/api/data/vendors", vendorsRouter);
app.use("/api/tenants", tenantsRouter);

// 404 fallback
app.use((req, res) => {
  res.status(404).json({ status: "error", message: "Route not found" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("API Error:", err);
  res
    .status(err.status || 500)
    .json({ status: "error", message: err.message || "Server error" });
});

app.listen(PORT, () => {
  console.log(`SCDM backend running on http://localhost:${PORT}`);
});
