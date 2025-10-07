// api/backend.js - Vercel serverless function that runs the full backend
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");
const fs = require("fs");

const app = express();

/* ------------------------ Core security & parsing ------------------------ */
app.use(helmet());
app.use(express.json({ limit: "20mb" }));

// CORS configuration
const DEFAULT_ORIGINS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173", 
  "https://marketplace-ui-react-vcl-main-oct.vercel.app",
  "http://localhost:3000",
  "http://localhost:4173",
  "http://localhost:4174",
  "http://localhost:5055"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (DEFAULT_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all for development
    }
  },
  credentials: true,
}));

app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

/* ------------------------ Data Store Simulation ------------------------ */
// Since we can't easily read files in serverless, we'll use mock data
const mockData = {
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
  wallets: [],
  users: [
    {
      uid: "backend-user-1",
      email: "22onsloanedigitalteam@gmail.com",
      role: "admin",
      tenantId: "admin",
      displayName: "Admin User",
      createdAt: new Date().toISOString()
    }
  ]
};

/* ------------------------ Backend API Routes ------------------------ */

// Health check
app.get("/health", (req, res) => {
  res.json({ 
    status: "ok", 
    service: "full-backend",
    port: "serverless",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development"
  });
});

// LMS endpoints
app.get("/lms/live", (req, res) => {
  res.json(mockData);
});

app.put("/lms/publish", (req, res) => {
  // In real backend, this would save to file
  res.json({ ok: true, message: "Data published successfully (mock)" });
});

app.get("/lms/checkpoints", (req, res) => {
  res.json({ items: [] });
});

app.post("/lms/checkpoints", (req, res) => {
  const id = Date.now().toString();
  res.json({ 
    ok: true, 
    id, 
    ts: Date.now(), 
    counts: { 
      cohorts: mockData.cohorts.length,
      courses: 0, 
      lessons: 0 
    } 
  });
});

// Data services
app.get("/data/services", (req, res) => {
  res.json({ 
    services: mockData.services, 
    total: mockData.services.length 
  });
});

app.post("/data/services", (req, res) => {
  const service = {
    id: Date.now().toString(),
    ...req.body,
    createdAt: new Date().toISOString()
  };
  mockData.services.push(service);
  res.status(201).json(service);
});

app.get("/data/vendors", (req, res) => {
  res.json({ vendors: [], total: 0 });
});

app.get("/data/startups", (req, res) => {
  res.json({ 
    startups: mockData.startups, 
    total: mockData.startups.length 
  });
});

// Tenants
app.get("/tenants", (req, res) => {
  res.json([
    { id: "vendor", name: "Vendor", type: "vendor", active: true },
    { id: "startup", name: "Startup", type: "startup", active: true },
    { id: "admin", name: "Admin", type: "admin", active: true }
  ]);
});

// Users with CRUD operations
app.get("/users", (req, res) => {
  res.json({ 
    users: mockData.users, 
    total: mockData.users.length 
  });
});

app.post("/users", (req, res) => {
  const user = {
    uid: Date.now().toString(),
    ...req.body,
    createdAt: new Date().toISOString()
  };
  mockData.users.push(user);
  res.status(201).json(user);
});

app.get("/users/:id", (req, res) => {
  const user = mockData.users.find(u => u.uid === req.params.id);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  res.json(user);
});

// Admin endpoints
app.get("/admin/stats", (req, res) => {
  res.json({ 
    totalUsers: mockData.users.length, 
    totalServices: mockData.services.length, 
    totalRevenue: 0,
    activeUsers: mockData.users.filter(u => u.active !== false).length,
    totalStartups: mockData.startups.length
  });
});

// Audit logs
app.get("/audit-logs", (req, res) => {
  res.json({ logs: [], total: 0 });
});

app.post("/audit-logs", (req, res) => {
  const logEntry = {
    id: Date.now().toString(),
    ...req.body,
    timestamp: new Date().toISOString()
  };
  res.json({ success: true, logId: logEntry.id, entry: logEntry });
});

// Subscriptions
app.get("/subscriptions", (req, res) => {
  res.json({ subscriptions: [], total: 0 });
});

app.post("/subscriptions", (req, res) => {
  const subscription = {
    id: Date.now().toString(),
    ...req.body,
    createdAt: new Date().toISOString()
  };
  res.status(201).json(subscription);
});

// Assistant/AI endpoints
app.post("/assistant/chat", (req, res) => {
  const { message, context } = req.body;
  res.json({ 
    response: `Backend AI Assistant received: "${message}". This is a mock response.`,
    timestamp: new Date().toISOString(),
    conversationId: Date.now().toString()
  });
});

// Messages/Communication
app.get("/messages", (req, res) => {
  res.json({
    messages: mockData.messageThreads,
    unreadCount: 0,
    lastUpdated: new Date().toISOString()
  });
});

app.post("/messages", (req, res) => {
  const message = {
    id: Date.now().toString(),
    ...req.body,
    timestamp: new Date().toISOString()
  };
  mockData.messageThreads.push(message);
  res.json({ success: true, message: "Message sent", data: message });
});

// Wallets/Financial
app.get("/wallets/me", (req, res) => {
  res.json({
    id: "wallet-backend",
    userId: "backend-user",
    balance: 100.00,
    currency: "USD",
    transactions: [],
    lastUpdated: new Date().toISOString()
  });
});

app.post("/wallets/transaction", (req, res) => {
  const transaction = {
    id: Date.now().toString(),
    ...req.body,
    timestamp: new Date().toISOString(),
    status: "completed"
  };
  res.json({ 
    success: true, 
    transactionId: transaction.id,
    transaction 
  });
});

app.get("/wallets", (req, res) => {
  res.json({
    wallets: mockData.wallets,
    total: mockData.wallets.length
  });
});

// Root backend route - only for /backend/ not all routes
app.get("/", (req, res) => {
  res.json({ 
    message: "Sloane Hub Backend API (Serverless)",
    version: "1.0.0",
    status: "running",
    timestamp: new Date().toISOString(),
    availableEndpoints: [
      "/health", "/lms/live", "/lms/publish", "/lms/checkpoints",
      "/data/services", "/data/vendors", "/data/startups",
      "/tenants", "/users", "/admin/stats",
      "/audit-logs", "/subscriptions", "/assistant/chat",
      "/messages", "/wallets/me", "/wallets"
    ]
  });
});

// Don't use catch-all that could interfere with frontend routing

// Error handler
app.use((err, req, res, next) => {
  console.error("Backend API Error:", err);
  res.status(err.status || 500).json({ 
    status: "error", 
    message: err.message || "Backend server error",
    timestamp: new Date().toISOString()
  });
});

// Export for Vercel serverless functions
module.exports = function handler(req, res) {
  return app(req, res);
};

module.exports.app = app;
