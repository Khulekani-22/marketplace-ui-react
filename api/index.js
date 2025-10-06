// api/index.js - Vercel serverless function
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();

/* ------------------------ Core security & parsing ------------------------ */
app.use(helmet());
app.use(express.json({ limit: "20mb" }));

// CORS configuration for Vercel
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);
      
      // Allow any *.vercel.app domain
      if (origin.endsWith('.vercel.app')) {
        return callback(null, true);
      }
      
      // Allow localhost for development
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return callback(null, true);
      }
      
      return callback(null, true); // Temporarily allow all for testing
    },
    credentials: true,
  })
);

app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

/* --------------------------------- Basic Routes --------------------------------- */
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development"
  });
});

app.get("/api/me", (req, res) => {
  res.json({
    message: "Authentication endpoint - Firebase integration needed",
    timestamp: new Date().toISOString()
  });
});

/* --------------------------------- 404 ----------------------------------- */
app.use((req, res) => {
  res.status(404).json({ 
    status: "error", 
    message: "Route not found",
    path: req.path
  });
});

/* ------------------------------ Error handler ---------------------------- */
app.use((err, req, res, next) => {
  console.error("API Error:", err);
  res
    .status(err.status || 500)
    .json({ status: "error", message: err.message || "Server error" });
});

// Export for Vercel
export default app;
