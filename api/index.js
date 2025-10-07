// api/index.js - Vercel serverless function for Sloane Hub
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
require("dotenv").config();

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
      if (origin && origin.endsWith('.vercel.app')) {
        return callback(null, true);
      }
      
      // Allow localhost for development
      if (origin && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
        return callback(null, true);
      }
      
      // Allow all origins for now during debugging
      return callback(null, true);
    },
    credentials: true,
  })
);

app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

/* ------------------------ Mock Data for Testing ------------------------ */
const mockUser = {
  uid: "test-user-id",
  email: "22onsloanedigitalteam@gmail.com",
  role: "member",
  tenantId: "vendor"
};

const mockWallet = {
  id: "wallet-1",
  userId: mockUser.uid,
  balance: 100.00,
  currency: "USD",
  transactions: []
};

const mockMessages = {
  messages: [],
  unreadCount: 0,
  lastUpdated: new Date().toISOString()
};

const mockTenants = [
  { id: "vendor", name: "Vendor", type: "vendor" },
  { id: "startup", name: "Startup", type: "startup" },
  { id: "admin", name: "Admin", type: "admin" }
];

const mockLmsData = {
  cohorts: [],
  bookings: [],
  events: [],
  forumThreads: [],
  jobs: [],
  mentorshipSessions: [],
  messageThreads: [],
  services: [],
  leads: [],
  startups: [],
  wallets: [mockWallet],
  users: [mockUser]
};

/* ------------------------ API Routes ------------------------ */

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    message: "Sloane Hub API is running on Vercel",
    environment: process.env.NODE_ENV || "development"
  });
});

// User authentication endpoint
app.get("/api/me", (req, res) => {
  // In a real app, this would verify the Firebase token
  res.json(mockUser);
});

// Messages endpoints
app.get("/api/messages", (req, res) => {
  res.json(mockMessages);
});

app.post("/api/messages", (req, res) => {
  res.json({ success: true, message: "Message sent" });
});

// LMS endpoints
app.get("/api/lms/live", (req, res) => {
  res.json(mockLmsData);
});

app.put("/api/lms/publish", (req, res) => {
  res.json({ ok: true, message: "Data published successfully" });
});

app.get("/api/lms/checkpoints", (req, res) => {
  res.json({ items: [] });
});

app.post("/api/lms/checkpoints", (req, res) => {
  const id = Date.now().toString();
  res.json({ ok: true, id, ts: Date.now(), counts: { cohorts: 0, courses: 0, lessons: 0 } });
});

// Tenants endpoint
app.get("/api/tenants", (req, res) => {
  res.json(mockTenants);
});

// Wallet endpoints
app.get("/api/wallets/me", (req, res) => {
  res.json(mockWallet);
});

app.post("/api/wallets/transaction", (req, res) => {
  res.json({ success: true, transactionId: Date.now().toString() });
});

// Audit logs endpoint
app.post("/api/audit-logs", (req, res) => {
  // Mock audit log creation
  res.json({ success: true, logId: Date.now().toString() });
});

app.get("/api/audit-logs", (req, res) => {
  res.json({ logs: [], total: 0 });
});

// Data services endpoints
app.get("/api/data/services", (req, res) => {
  res.json({ services: [], total: 0 });
});

app.get("/api/data/vendors", (req, res) => {
  res.json({ vendors: [], total: 0 });
});

app.get("/api/data/vendors/:id/stats", (req, res) => {
  res.json({
    listingStats: { total: 0, byStatus: {} },
    reviewStats: { totalReviews: 0, avgRating: 0 },
    subscription: { plan: "Free", status: "active" },
    subscriptionStats: { byService: {} },
    salesTime: { monthly: {}, quarterly: {}, annual: {} }
  });
});

app.get("/api/data/startups", (req, res) => {
  res.json({ startups: [], total: 0 });
});

// Users endpoint
app.get("/api/users", (req, res) => {
  res.json({ users: [mockUser], total: 1 });
});

// Admin endpoints
app.get("/api/admin/stats", (req, res) => {
  res.json({ 
    totalUsers: 1, 
    totalServices: 0, 
    totalRevenue: 0,
    activeUsers: 1 
  });
});

// Subscriptions endpoint
app.get("/api/subscriptions", (req, res) => {
  res.json({ subscriptions: [], total: 0 });
});

// Assistant endpoint
app.post("/api/assistant/chat", (req, res) => {
  res.json({ 
    response: "Hello! This is a mock response from the assistant API.",
    timestamp: new Date().toISOString()
  });
});

// Test endpoint
app.get("/api/test", (req, res) => {
  res.json({ 
    message: "Hello from Vercel API",
    env: process.env.NODE_ENV || "development",
    origin: req.get("origin") || "no origin",
    userAgent: req.get("user-agent") || "no user agent",
    timestamp: new Date().toISOString(),
    availableEndpoints: [
      "/api/health", "/api/me", "/api/messages", "/api/lms/live",
      "/api/tenants", "/api/wallets/me", "/api/audit-logs",
      "/api/data/services", "/api/data/vendors", "/api/data/startups",
      "/api/users", "/api/admin/stats", "/api/subscriptions",
      "/api/assistant/chat"
    ]
  });
});

// Only handle root API requests, not all root requests
app.get("/api", (req, res) => {
  res.json({ 
    message: "Sloane Hub API Root",
    version: "1.0.0",
    status: "running",
    timestamp: new Date().toISOString()
  });
});

// Catch-all for unmatched API routes
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    res.status(404).json({ 
      error: "API endpoint not found",
      path: req.path,
      method: req.method,
      message: "This endpoint is not implemented yet",
      availableEndpoints: [
        "/api/health", "/api/me", "/api/messages", "/api/lms/live",
        "/api/tenants", "/api/wallets/me", "/api/audit-logs",
        "/api/data/services", "/api/data/vendors", "/api/data/startups",
        "/api/data/vendors/:id/stats", "/api/users", "/api/admin/stats",
        "/api/subscriptions", "/api/assistant/chat"
      ]
    });
  } else {
    next();
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error("API Error:", err);
  res
    .status(err.status || 500)
    .json({ 
      status: "error", 
      message: err.message || "Server error",
      timestamp: new Date().toISOString()
    });
});

// Export for Vercel serverless functions
module.exports = function handler(req, res) {
  return app(req, res);
};

// Also export the app for local testing
module.exports.app = app;
