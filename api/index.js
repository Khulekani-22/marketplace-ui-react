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

// My vendor services endpoint
app.get("/api/data/services/mine", (req, res) => {
  const data = getAppData();
  const services = data.services || [];
  const vendors = data.vendors || [];
  const bookings = data.bookings || [];
  
  // In a real app, this would filter by authenticated user's vendor ID
  // For now, find services from the first vendor or filter by a common vendor ID
  const firstVendor = vendors[0];
  const vendorId = firstVendor?.id || firstVendor?.vendorId || "tAsFySNxnsW4a7L43wMRVLkJAqE3";
  
  // Filter services by this vendor
  const myServices = services.filter(service => 
    service.vendorId === vendorId || 
    service.vendor === firstVendor?.name ||
    service.contactEmail === firstVendor?.contactEmail
  );
  
  // Get bookings for these services
  const myServiceIds = myServices.map(s => s.id);
  const myBookings = bookings.filter(booking => 
    myServiceIds.includes(booking.serviceId)
  );
  
  res.json({
    listings: myServices,
    bookings: myBookings,
    vendor: firstVendor,
    tenantId: firstVendor?.tenantId || "public",
    total: myServices.length
  });
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

// My subscriptions endpoint
app.get("/api/subscriptions/my", (req, res) => {
  const data = getAppData();
  const bookings = data.bookings || [];
  
  // In a real app, this would filter by authenticated user
  // For now, return all bookings as user's subscriptions
  const userSubscriptions = bookings.map(booking => ({
    ...booking,
    subscriptionId: booking.id,
    status: booking.status || 'active',
    startDate: booking.bookedAt,
    nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
  }));
  
  res.json(userSubscriptions);
});

// Subscribe to service endpoint
app.post("/api/subscriptions/service", (req, res) => {
  const { serviceId, planId, billingFrequency } = req.body;
  
  // Mock subscription creation
  const subscription = {
    id: Date.now().toString(),
    serviceId,
    planId: planId || 'basic',
    billingFrequency: billingFrequency || 'monthly',
    status: 'active',
    startDate: new Date().toISOString(),
    nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString()
  };
  
  res.json({ success: true, subscription });
});

// Cancel subscription endpoint
app.put("/api/subscriptions/service/cancel", (req, res) => {
  const { serviceId } = req.body;
  
  // Mock subscription cancellation
  res.json({ 
    success: true, 
    message: "Subscription cancelled successfully",
    serviceId,
    cancelledAt: new Date().toISOString()
  });
});

// Get service subscription details
app.get("/api/subscriptions/service/:serviceId", (req, res) => {
  const { serviceId } = req.params;
  const data = getAppData();
  const services = data.services || [];
  const bookings = data.bookings || [];
  
  const service = services.find(s => s.id === serviceId);
  const serviceBookings = bookings.filter(b => b.serviceId === serviceId);
  
  if (!service) {
    return res.status(404).json({ error: "Service not found" });
  }
  
  res.json({
    service,
    subscriptions: serviceBookings,
    totalSubscribers: serviceBookings.length,
    activeSubscriptions: serviceBookings.filter(b => b.status === 'completed' || b.status === 'active').length
  });
});

// Assistant endpoint
app.post("/api/assistant/chat", (req, res) => {
  res.json({ 
    response: "Hello! This is a mock response from the assistant API.",
    timestamp: new Date().toISOString()
  });
});

// Admin wallet endpoints
app.get("/api/admin/wallet/users", (req, res) => {
  const data = getAppData();
  const users = data.users || [];
  
  // Only return actual users from data.users array, not composite list
  // The platform users are handled separately via /api/users/all
  const usersWithWallets = users.map(user => ({
    id: user.uid || user.id,
    uid: user.uid || user.id,
    name: user.name || user.displayName || "Unnamed User",
    email: user.email,
    role: user.role || "member",
    tenantId: user.tenantId || "public",
    createdAt: user.createdAt || new Date().toISOString(),
    lastActivity: user.lastActivity || user.lastLoginAt || user.updatedAt || new Date().toISOString(),
    walletBalance: 0, // Mock wallet balance - in real implementation would query wallets
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || user.email)}&background=7c3aed&color=fff`
  }));
  
  // Sort by wallet balance then name
  usersWithWallets.sort((a, b) => 
    b.walletBalance !== a.walletBalance ? 
    b.walletBalance - a.walletBalance : 
    a.name.localeCompare(b.name)
  );
  
  res.json({
    status: "success",
    users: usersWithWallets,
    summary: {
      totalUsers: usersWithWallets.length,
      usersWithCredits: usersWithWallets.filter(u => u.walletBalance > 0).length,
      totalCreditsAllocated: usersWithWallets.reduce((sum, u) => sum + (u.walletBalance || 0), 0)
    }
  });
});

app.post("/api/admin/wallet/add-credits", (req, res) => {
  const { userId, userEmail, amount, description } = req.body;
  
  if (!userId || !userEmail || !amount || !description) {
    return res.status(400).json({
      status: "error",
      message: "Missing required fields: userId, userEmail, amount, description"
    });
  }
  
  const creditAmount = parseFloat(amount);
  if (isNaN(creditAmount) || creditAmount <= 0) {
    return res.status(400).json({
      status: "error", 
      message: "Amount must be a positive number"
    });
  }
  
  // Mock transaction creation
  const transaction = {
    id: Date.now().toString(),
    userId,
    userEmail,
    type: "credit",
    amount: creditAmount,
    description,
    adminEmail: "admin@example.com",
    createdAt: new Date().toISOString()
  };
  
  res.status(201).json({
    status: "success",
    message: `Successfully added ${creditAmount} credits to ${userEmail}`,
    transaction
  });
});

app.post("/api/admin/wallet/bulk-credits", (req, res) => {
  const { userIds, amount, description } = req.body;
  
  if (!Array.isArray(userIds) || userIds.length === 0) {
    return res.status(400).json({
      status: "error",
      message: "userIds must be a non-empty array"
    });
  }
  
  if (!amount || !description) {
    return res.status(400).json({
      status: "error",
      message: "Missing required fields: amount, description"
    });
  }
  
  const creditAmount = parseFloat(amount);
  if (isNaN(creditAmount) || creditAmount <= 0) {
    return res.status(400).json({
      status: "error",
      message: "Amount must be a positive number"
    });
  }
  
  // Mock bulk transaction creation
  const transactions = userIds.map(userId => ({
    id: `${Date.now()}-${userId}`,
    userId,
    type: "credit",
    amount: creditAmount,
    description: `${description} (Bulk allocation)`,
    adminEmail: "admin@example.com",
    createdAt: new Date().toISOString()
  }));
  
  res.status(201).json({
    status: "success",
    message: `Successfully added ${creditAmount} credits to ${userIds.length} users`,
    transactions,
    processedCount: userIds.length
  });
});

app.post("/api/admin/wallet/normalize-appdata", (req, res) => {
  // Mock data normalization
  res.json({
    status: "success",
    message: "App data normalized successfully"
  });
});

app.post("/api/admin/wallet/sync-firebase-users", (req, res) => {
  // Mock Firebase user sync
  res.json({
    status: "success", 
    message: "Firebase users synced successfully",
    syncedCount: 0
  });
});

app.get("/api/admin/wallet/summary", (req, res) => {
  const data = getAppData();
  const users = data.users || [];
  
  res.json({
    status: "success",
    summary: {
      totalUsers: users.length,
      totalCreditsAllocated: 0,
      usersWithCredits: 0,
      usersWithoutCredits: users.length,
      totalTransactions: 0,
      creditsAllocatedToday: 0,
      recentTransactions: []
    }
  });
});

app.get("/api/admin/wallet/transactions", (req, res) => {
  const { limit = 100, offset = 0 } = req.query;
  
  res.json({
    status: "success",
    transactions: [],
    total: 0,
    limit: parseInt(limit),
    offset: parseInt(offset)
  });
});

// Users/all endpoint for Firebase user search
app.get("/api/users/all", (req, res) => {
  const { search = "", pageSize = 100 } = req.query;
  const data = getAppData();
  const users = data.users || [];
  
  // Filter users based on search term
  let filteredUsers = users;
  if (search) {
    const searchLower = search.toLowerCase();
    filteredUsers = users.filter(user => 
      (user.email && user.email.toLowerCase().includes(searchLower)) ||
      (user.name && user.name.toLowerCase().includes(searchLower)) ||
      (user.displayName && user.displayName.toLowerCase().includes(searchLower))
    );
  }
  
  // Apply pagination
  const limit = parseInt(pageSize);
  const paginatedUsers = filteredUsers.slice(0, limit);
  
  res.json({
    items: paginatedUsers.map(user => ({
      uid: user.uid || user.id,
      email: user.email,
      displayName: user.name || user.displayName || null,
      photoURL: user.avatar || user.photoURL || null,
      emailVerified: true,
      disabled: false,
      metadata: {
        creationTime: user.createdAt || new Date().toISOString(),
        lastSignInTime: user.lastActivity || user.lastLoginAt || new Date().toISOString()
      },
      providerData: [{
        providerId: "password",
        uid: user.email,
        email: user.email,
        displayName: user.name || user.displayName || null
      }]
    })),
    nextPageToken: filteredUsers.length > limit ? "has-more" : null
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
      "/api/data/services", "/api/data/services/mine", "/api/data/vendors", "/api/data/startups",
      "/api/data/vendors/:id/stats", "/api/users", "/api/users/all", "/api/admin/stats", 
      "/api/subscriptions", "/api/subscriptions/my", "/api/subscriptions/service",
      "/api/subscriptions/service/cancel", "/api/subscriptions/service/:id",
      "/api/assistant/chat", "/api/admin/wallet/users", "/api/admin/wallet/add-credits",
      "/api/admin/wallet/bulk-credits", "/api/admin/wallet/normalize-appdata",
      "/api/admin/wallet/sync-firebase-users", "/api/admin/wallet/summary",
      "/api/admin/wallet/transactions"
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
        "/api/data/services", "/api/data/services/mine", "/api/data/vendors", "/api/data/startups",
        "/api/data/vendors/:id/stats", "/api/users", "/api/users/all", "/api/admin/stats",
        "/api/subscriptions", "/api/subscriptions/my", "/api/subscriptions/service",
        "/api/subscriptions/service/cancel", "/api/subscriptions/service/:id",
        "/api/assistant/chat", "/api/admin/wallet/users", "/api/admin/wallet/add-credits",
        "/api/admin/wallet/bulk-credits", "/api/admin/wallet/normalize-appdata",
        "/api/admin/wallet/sync-firebase-users", "/api/admin/wallet/summary",
        "/api/admin/wallet/transactions"
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
