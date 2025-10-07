// api/index.js - Vercel serverless function for Sloane Hub
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const app = express();

/* ------------------------ Data Loading ------------------------ */
let appData = null;

function loadAppData() {
  try {
    // Try to load from backend/appData.json
    const backendPath = path.join(process.cwd(), 'backend', 'appData.json');
    if (fs.existsSync(backendPath)) {
      const rawData = fs.readFileSync(backendPath, 'utf8');
      appData = JSON.parse(rawData);
      console.log('✅ Loaded appData from backend/appData.json');
      return appData;
    }
    
    // Fallback to src/data/appData.json
    const srcPath = path.join(process.cwd(), 'src', 'data', 'appData.json');
    if (fs.existsSync(srcPath)) {
      const rawData = fs.readFileSync(srcPath, 'utf8');
      appData = JSON.parse(rawData);
      console.log('✅ Loaded appData from src/data/appData.json (fallback)');
      return appData;
    }
    
    console.warn('⚠️ No appData.json found, using mock data');
    return getMockData();
  } catch (error) {
    console.error('❌ Error loading appData:', error.message);
    return getMockData();
  }
}

function getMockData() {
  return {
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
    vendors: [],
    wallets: [],
    users: [{
      uid: "test-user-id",
      email: "22onsloanedigitalteam@gmail.com",
      role: "member",
      tenantId: "vendor"
    }]
  };
}

function getAppData() {
  if (!appData) {
    appData = loadAppData();
  }
  return appData;
}

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

/* ------------------------ Mock Data for Compatibility ------------------------ */
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

const mockTenants = [
  { id: "vendor", name: "Vendor", type: "vendor" },
  { id: "startup", name: "Startup", type: "startup" },
  { id: "admin", name: "Admin", type: "admin" }
];

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
  const data = getAppData();
  const users = data.users || [];
  
  // In a real app, this would verify the Firebase token and find the user
  // For now, return the first admin user or mock user
  const adminUser = users.find(u => u.role === 'admin') || users[0] || mockUser;
  res.json(adminUser);
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
  const data = getAppData();
  res.json(data);
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
  const data = getAppData();
  const tenants = data.tenants || mockTenants;
  res.json(tenants);
});

// Wallet endpoints
app.get("/api/wallets/me", (req, res) => {
  const data = getAppData();
  const wallets = data.wallets || [];
  const userWallet = wallets.find(w => w.userId === mockUser.uid) || mockWallet;
  res.json(userWallet);
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
  const data = getAppData();
  const services = data.services || [];
  res.json({ services, total: services.length });
});

app.get("/api/data/vendors", (req, res) => {
  const data = getAppData();
  const vendors = data.vendors || [];
  res.json({ vendors, total: vendors.length });
});

app.get("/api/data/vendors/:id/stats", (req, res) => {
  const data = getAppData();
  const vendors = data.vendors || [];
  const services = data.services || [];
  const bookings = data.bookings || [];
  
  const vendorId = req.params.id;
  const vendor = vendors.find(v => v.id === vendorId || v.vendorId === vendorId);
  
  // Calculate stats from real data
  const vendorServices = services.filter(s => s.vendorId === vendorId || s.vendor === vendorId);
  const vendorBookings = bookings.filter(b => b.vendorId === vendorId);
  
  const listingStats = {
    total: vendorServices.length,
    byStatus: vendorServices.reduce((acc, service) => {
      const status = service.status || 'active';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {})
  };
  
  const reviewStats = {
    totalReviews: vendorServices.reduce((total, service) => {
      return total + (service.reviewCount || (service.reviews ? service.reviews.length : 0));
    }, 0),
    avgRating: vendorServices.length > 0 ? 
      vendorServices.reduce((sum, service) => sum + (service.rating || 0), 0) / vendorServices.length : 0
  };
  
  const subscriptionStats = {
    byService: vendorServices.reduce((acc, service) => {
      acc[service.id] = vendorBookings.filter(b => b.serviceId === service.id).length;
      return acc;
    }, {})
  };
  
  res.json({
    listingStats,
    reviewStats,
    subscription: { plan: vendor?.subscriptionPlan || "Free", status: vendor?.status || "active" },
    subscriptionStats,
    salesTime: { monthly: {}, quarterly: {}, annual: {} }
  });
});

app.get("/api/data/startups", (req, res) => {
  const data = getAppData();
  const startups = data.startups || [];
  res.json({ startups, total: startups.length });
});

// Users endpoint
app.get("/api/users", (req, res) => {
  const data = getAppData();
  const users = data.users || [mockUser];
  res.json({ users, total: users.length });
});

// Admin endpoints
app.get("/api/admin/stats", (req, res) => {
  const data = getAppData();
  const users = data.users || [];
  const services = data.services || [];
  const startups = data.startups || [];
  const bookings = data.bookings || [];
  
  const totalRevenue = bookings.reduce((sum, booking) => sum + (booking.price || 0), 0);
  
  res.json({ 
    totalUsers: users.length, 
    totalServices: services.length, 
    totalRevenue,
    activeUsers: users.filter(u => u.active !== false).length,
    totalStartups: startups.length
  });
});

// Subscriptions endpoint
app.get("/api/subscriptions", (req, res) => {
  const data = getAppData();
  const bookings = data.bookings || [];
  res.json({ subscriptions: bookings, total: bookings.length });
});

// Assistant endpoint
app.post("/api/assistant/chat", (req, res) => {
  res.json({ 
    response: "Hello! This is a mock response from the assistant API.",
    timestamp: new Date().toISOString()
  });
});

// Messages endpoints
app.get("/api/messages", (req, res) => {
  const data = getAppData();
  const messages = data.messageThreads || [];
  res.json({
    messages,
    unreadCount: 0,
    lastUpdated: new Date().toISOString()
  });
});

app.post("/api/messages", (req, res) => {
  res.json({ success: true, message: "Message sent" });
});

// Test endpoint
app.get("/api/test", (req, res) => {
  const data = getAppData();
  res.json({ 
    message: "Hello from Vercel API",
    env: process.env.NODE_ENV || "development",
    origin: req.get("origin") || "no origin",
    userAgent: req.get("user-agent") || "no user agent",
    timestamp: new Date().toISOString(),
    dataStatus: data ? 'loaded' : 'mock',
    dataStats: {
      services: (data.services || []).length,
      vendors: (data.vendors || []).length,
      startups: (data.startups || []).length,
      users: (data.users || []).length
    },
    availableEndpoints: [
      "/api/health", "/api/me", "/api/messages", "/api/lms/live",
      "/api/tenants", "/api/wallets/me", "/api/audit-logs",
      "/api/data/services", "/api/data/vendors", "/api/data/startups",
      "/api/data/vendors/:id/stats", "/api/users", "/api/admin/stats", 
      "/api/subscriptions", "/api/assistant/chat"
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
