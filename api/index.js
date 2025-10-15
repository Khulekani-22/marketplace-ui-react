// api/index.js - Vercel serverless function for Sloane Hub
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const FIRESTORE_BASE_URL = "https://firestore.googleapis.com/v1";
const GOOGLE_OAUTH_TOKEN_URL = "https://oauth2.googleapis.com/token";
const FIRESTORE_SCOPE = "https://www.googleapis.com/auth/datastore";

let serviceAccountCache = null;
let firestoreTokenCache = { token: null, exp: 0 };

function unwrapPrivateKey(key) {
  if (!key) return key;
  return key.replace(/\\n/g, "\n");
}

function loadServiceAccount() {
  if (serviceAccountCache) return serviceAccountCache;

  const envClientEmail = process.env.GOOGLE_CLIENT_EMAIL || process.env.FIREBASE_CLIENT_EMAIL;
  const envPrivateKey = unwrapPrivateKey(process.env.GOOGLE_PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY);
  const envProjectId = process.env.GOOGLE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  if (envClientEmail && envPrivateKey) {
    serviceAccountCache = {
      client_email: envClientEmail,
      private_key: envPrivateKey,
      project_id: envProjectId,
    };
    return serviceAccountCache;
  }

  const candidatePaths = [
    path.join(__dirname, "serviceAccountKey.json"),
    path.join(__dirname, "secrets", "sloane-hub-service-account.json"),
    path.join(__dirname, "..", "serviceAccountKey.json"),
    path.join(__dirname, "..", "secrets", "sloane-hub-service-account.json"),
    path.join(process.cwd(), "serviceAccountKey.json"),
  ];

  for (const filePath of candidatePaths) {
    try {
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, "utf8");
        serviceAccountCache = JSON.parse(raw);
        serviceAccountCache.private_key = unwrapPrivateKey(serviceAccountCache.private_key);
        return serviceAccountCache;
      }
    } catch (error) {
      console.warn(`⚠️ Failed to read service account from ${filePath}:`, error.message);
    }
  }

  return null;
}

async function getFirestoreAccessToken() {
  const serviceAccount = loadServiceAccount();
  if (!serviceAccount) {
    throw new Error("Firestore service account credentials not configured");
  }

  const now = Math.floor(Date.now() / 1000);
  if (firestoreTokenCache.token && firestoreTokenCache.exp - 60 > now) {
    return firestoreTokenCache.token;
  }

  const privateKey = serviceAccount.private_key;
  const clientEmail = serviceAccount.client_email;

  if (!privateKey || !clientEmail) {
    throw new Error("Incomplete Firestore service account credentials");
  }

  const jwtPayload = {
    iss: clientEmail,
    sub: clientEmail,
    aud: GOOGLE_OAUTH_TOKEN_URL,
    scope: FIRESTORE_SCOPE,
    iat: now,
    exp: now + 3600,
  };

  const assertion = jwt.sign(jwtPayload, privateKey, {
    algorithm: "RS256",
    header: {
      typ: "JWT",
    },
  });

  const params = new URLSearchParams();
  params.append("grant_type", "urn:ietf:params:oauth:grant-type:jwt-bearer");
  params.append("assertion", assertion);

  const { data } = await axios.post(GOOGLE_OAUTH_TOKEN_URL, params.toString(), {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  const { access_token: accessToken, expires_in: expiresIn = 3600 } = data || {};
  if (!accessToken) {
    throw new Error("Failed to obtain Firestore access token");
  }

  firestoreTokenCache = {
    token: accessToken,
    exp: now + expiresIn,
  };

  return accessToken;
}

// Import Firestore wallet service for persistent storage
const firestoreWalletService = require("./services/firestoreWalletService");

const app = express();

/* ------------------------ Data Loading ------------------------ */
let appData = null;

function mapFirestoreDoc(doc) {
  if (!doc || !doc.fields) return null;
  return Object.entries(doc.fields).reduce((acc, [key, value]) => {
    if (!value || typeof value !== "object") return acc;
    const type = Object.keys(value)[0];
    const raw = value[type];
    switch (type) {
      case "stringValue":
        acc[key] = raw;
        break;
      case "integerValue":
        acc[key] = Number(raw);
        break;
      case "doubleValue":
      case "timestampValue":
      case "referenceValue":
        acc[key] = raw;
        break;
      case "booleanValue":
        acc[key] = Boolean(raw);
        break;
      case "nullValue":
        acc[key] = null;
        break;
      case "mapValue":
        acc[key] = mapFirestoreDoc({ fields: raw.fields || {} }) || {};
        break;
      case "arrayValue":
        acc[key] = Array.isArray(raw?.values)
          ? raw.values.map((entry) => {
              if (entry.mapValue) return mapFirestoreDoc({ fields: entry.mapValue.fields || {} });
              if (entry.stringValue !== undefined) return entry.stringValue;
              if (entry.integerValue !== undefined) return Number(entry.integerValue);
              if (entry.doubleValue !== undefined) return entry.doubleValue;
              if (entry.booleanValue !== undefined) return Boolean(entry.booleanValue);
              if (entry.nullValue !== undefined) return null;
              return entry;
            })
          : [];
        break;
      default:
        acc[key] = raw;
    }
    return acc;
  }, {});
}

function normalizeFirestoreDocument(document) {
  if (!document) return null;
  const mapped = mapFirestoreDoc(document);
  if (!mapped) return null;
  const id = document.name?.split("/")?.pop() || mapped.id;
  let tenantId = mapped.tenantId || "public";
  try {
    const nameParts = document.name?.split("/") || [];
    const tenantsIndex = nameParts.indexOf("tenants");
    if (tenantsIndex >= 0 && nameParts[tenantsIndex + 1]) {
      tenantId = nameParts[tenantsIndex + 1];
    }
  } catch {
    /* ignore */
  }
  return {
    id,
    ...mapped,
    tenantId,
  };
}

async function fetchFirestoreCollection(collectionPath, { tenantFilter } = {}) {
  const serviceAccount = loadServiceAccount();
  if (!serviceAccount) {
    throw new Error("Firestore service account not configured");
  }

  const projectId = serviceAccount.project_id || process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) {
    throw new Error("Unable to determine Firestore project id");
  }

  const accessToken = await getFirestoreAccessToken();
  const url = `${FIRESTORE_BASE_URL}/projects/${projectId}/databases/(default)/documents/${collectionPath}`;

  let documents = [];
  let pageToken;

  try {
    do {
      const params = pageToken ? { pageToken, pageSize: 300 } : { pageSize: 300 };
      const response = await axios.get(url, {
        params,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const fetched = Array.isArray(response.data.documents) ? response.data.documents : [];
      documents = documents.concat(fetched.map(normalizeFirestoreDocument).filter(Boolean));

      pageToken = response.data.nextPageToken;
    } while (pageToken);
  } catch (error) {
    const status = error?.response?.status;
    if (status === 404) {
      // Treat missing collection as empty
      return [];
    }
    console.error(`❌ Firestore fetch failed for ${collectionPath}:`, error.response?.data || error.message);
    throw error;
  }

  if (tenantFilter) {
    documents = documents.filter((doc) => {
      const docTenant = doc.tenantId || "public";
      if (!doc.tenantId) return true;
      if (tenantFilter === "public") {
        return docTenant === "public";
      }
      return docTenant === tenantFilter;
    });
  }

  return documents;
}

async function loadFirestoreAppData({ tenantId = "public" } = {}) {
  const collections = [
    "bookings",
    "cohorts",
    "events",
    "forumThreads",
    "jobs",
    "mentorshipSessions",
    "messageThreads",
    "services",
    "leads",
    "startups",
    "vendors",
    "companies",
    "profiles",
    "users",
    "tenants",
    "subscriptions",
    "wallets",
  ];

  const results = await Promise.all(
    collections.map((name) => fetchFirestoreCollection(name, { tenantFilter: tenantId }))
  );

  const data = collections.reduce((acc, name, idx) => {
    acc[name] = results[idx] || [];
    return acc;
  }, {});

  return {
    ...data,
    tenantId,
  };
}

function loadAppData() {
  try {
    // Try to load from backend/appData.json (go up one directory from api/)
    const backendPath = path.join(__dirname, '..', 'backend', 'appData.json');
    if (fs.existsSync(backendPath)) {
      const rawData = fs.readFileSync(backendPath, 'utf8');
      const data = JSON.parse(rawData);
      console.log('✅ Loaded appData from backend/appData.json');
      console.log(`📊 Data loaded: ${data.users?.length || 0} users, ${data.messageThreads?.length || 0} messages, ${data.vendors?.length || 0} vendors, ${data.startups?.length || 0} startups`);
      return data;
    }
    
    // Alternative path for development
    const altBackendPath = path.join(process.cwd(), '..', 'backend', 'appData.json');
    if (fs.existsSync(altBackendPath)) {
      const rawData = fs.readFileSync(altBackendPath, 'utf8');
      const data = JSON.parse(rawData);
      console.log('✅ Loaded appData from ../backend/appData.json');
      console.log(`📊 Data loaded: ${data.users?.length || 0} users, ${data.messageThreads?.length || 0} messages`);
      return data;
    }
    
    // Try relative to current working directory
    const cwdBackendPath = path.join(process.cwd(), 'backend', 'appData.json');
    if (fs.existsSync(cwdBackendPath)) {
      const rawData = fs.readFileSync(cwdBackendPath, 'utf8');
      const data = JSON.parse(rawData);
      console.log('✅ Loaded appData from ./backend/appData.json');
      console.log(`📊 Data loaded: ${data.users?.length || 0} users, ${data.messageThreads?.length || 0} messages`);
      return data;
    }
    
    console.warn('⚠️ No appData.json found in any location, using mock data');
    console.warn(`Tried paths: ${backendPath}, ${altBackendPath}, ${cwdBackendPath}`);
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
    users: [
      {
        uid: "duFghKRYhyRFUhlBRm66iMLKgh22",
        email: "22onsloanedigitalteam@gmail.com",
        displayName: "22 On Sloane Digital Team",
        role: "admin",
        tenantId: "public"
      },
      {
        uid: "tAsFySNxnsW4a7L43wMRVLkJAqE3",
        email: "khulekani@22onsloane.co",
        displayName: "Khulekani Magubane",
        role: "admin", 
        tenantId: "vendor"
      },
      {
        uid: "WcdBgaT4hEMXb3DScC1OE8NDKJ62",
        email: "khulekani@gecafrica.co",
        displayName: "Khulekani Magubane",
        role: "member",
        tenantId: "vendor"
      },
      {
        uid: "O8bBPBKniiWbuSBXrMgBGJMPfoO2",
        email: "zinhlesloane@gmail.com",
        displayName: "Zinhle Sloane",
        role: "member",
        tenantId: "vendor"
      },
      {
        uid: "93cUbdo4BkXnVQrXQBgJVDapYdS2",
        email: "mncubekhulekani@gmail.com",
        displayName: "Mncube Khulekani",
        role: "member",
        tenantId: "vendor"
      }
    ]
  };
}

// Data loading helper for audit data
function getAuditData() {
  try {
    const auditPath = path.join(process.cwd(), 'backend', 'auditData.json');
    if (fs.existsSync(auditPath)) {
      const rawData = fs.readFileSync(auditPath, 'utf8');
      return JSON.parse(rawData);
    }
    return [];
  } catch (error) {
    console.error('❌ Error loading audit data:', error.message);
    return [];
  }
}

// Function to save audit data
function saveAuditData(auditLogs) {
  try {
    const auditPath = path.join(process.cwd(), 'backend', 'auditData.json');
    fs.writeFileSync(auditPath, JSON.stringify(auditLogs, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Error saving audit data:', error.message);
    return false;
  }
}

// Function to save app data
function saveAppData(data) {
  // Always update in-memory cache first
  appData = data;
  
  try {
    // Primary focus: backend/appData.json (the authoritative source)
    const backendPath = path.join(process.cwd(), 'backend', 'appData.json');
    
    try {
      // Ensure directory exists
      const dir = path.dirname(backendPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // Write to backend/appData.json
      fs.writeFileSync(backendPath, JSON.stringify(data, null, 2));
      const walletCount = data.wallets?.length || 0;
      const totalTransactions = data.wallets?.reduce((sum, w) => sum + (w.transactions?.length || 0), 0) || 0;
      console.log(`✅ Successfully saved appData to ${backendPath} - ${walletCount} wallets, ${totalTransactions} transactions`);
      return true;
      
    } catch (backendError) {
      console.warn(`⚠️ Failed to save to backend directory: ${backendError.message}`);
      
      // Fallback: try alternative paths only if backend fails
      const fallbackPaths = [
        path.join(__dirname, '..', 'backend', 'appData.json'),
        path.join(process.cwd(), '..', 'backend', 'appData.json')
      ];
      
      for (const fallbackPath of fallbackPaths) {
        try {
          const dir = path.dirname(fallbackPath);
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }
          fs.writeFileSync(fallbackPath, JSON.stringify(data, null, 2));
          console.log(`✅ Fallback save successful to ${fallbackPath}`);
          return true;
        } catch (fallbackError) {
          console.warn(`⚠️ Fallback path failed ${fallbackPath}: ${fallbackError.message}`);
        }
      }
      
      // In serverless environments, file writes may fail, but data persists in memory
      console.warn('⚠️ All file saves failed - data exists in memory for this serverless instance');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Critical error in saveAppData:', error.message);
    return false;
  }
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

/* ------------------------ Real Firebase Users ------------------------ */
// Real Firebase authenticated users from your system
function getRealFirebaseUsers() {
  return [
    {
      uid: "WcdBgaT4hEMXb3DScC1OE8NDKJ62",
      email: "khulekani@gecafrica.co",
      displayName: "Khulekani Magubane",
      tenantId: "gecafrica",
      role: "admin",
      createdAt: "2025-09-05T10:00:00Z",
      lastLoginAt: "2025-09-05T10:00:00Z"
    },
    {
      uid: "O8bBPBKniiWbuSBXrMgBGJMPfoO2",
      email: "zinhlesloane@gmail.com",
      displayName: "Zinhle Sloane",
      tenantId: "sloane",
      role: "admin",
      createdAt: "2025-09-05T10:00:00Z",
      lastLoginAt: "2025-09-05T10:00:00Z"
    },
    {
      uid: "MFIzWLlhKjSDkV8FPlwXixdUCFX2",
      email: "ruthmaphosa2024@gmail.com",
      displayName: "Ruth Maphosa",
      tenantId: "public",
      role: "member",
      createdAt: "2025-08-31T10:00:00Z",
      lastLoginAt: "2025-08-31T10:00:00Z"
    },
    {
      uid: "tAsFySNxnsW4a7L43wMRVLkJAqE3",
      email: "khulekani@22onsloane.co",
      displayName: "Khulekani Magubane",
      tenantId: "22onsloane",
      role: "admin",
      createdAt: "2025-08-23T10:00:00Z",
      lastLoginAt: "2025-10-13T10:00:00Z"
    },
    {
      uid: "duFghKRYhyRFUhlBRm66iMLKgh22",
      email: "22onsloanedigitalteam@gmail.com",
      displayName: "22 On Sloane Digital Team",
      tenantId: "22onsloane",
      role: "admin",
      createdAt: "2025-08-22T10:00:00Z",
      lastLoginAt: "2025-10-09T10:00:00Z"
    },
    {
      uid: "93cUbdo4BkXnVQrXQBgJVDapYdS2",
      email: "mncubekhulekani@gmail.com",
      displayName: "Mncube Khulekani",
      tenantId: "public",
      role: "member",
      createdAt: "2025-08-16T10:00:00Z",
      lastLoginAt: "2025-10-02T10:00:00Z"
    }
  ];
}

// Combine Firebase users with backend users
function getAllUsers() {
  const firebaseUsers = getRealFirebaseUsers();
  const data = getAppData();
  const backendUsers = data.users || [];
  
  // Create a map to avoid duplicates (Firebase users take priority)
  const userMap = new Map();
  
  // Add Firebase users first (they have priority)
  firebaseUsers.forEach(user => {
    userMap.set(user.uid, user);
  });
  
  // Add backend users only if they don't exist in Firebase
  backendUsers.forEach(user => {
    if (!userMap.has(user.uid)) {
      userMap.set(user.uid, user);
    }
  });
  
  return Array.from(userMap.values());
}

// Get current authenticated user (for demo, use admin user)
function getCurrentUser() {
  // In a real app, this would extract user from JWT token or session
  // For demo purposes, use the admin user
  const firebaseUsers = getRealFirebaseUsers();
  return firebaseUsers.find(u => u.role === 'admin') || firebaseUsers[0];
}

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
  // In a real app, this would verify the Firebase token and find the user
  // For now, return the current user from our system
  const currentUser = getCurrentUser();
  
  // Format as Firebase user structure
  const firebaseUser = {
    uid: currentUser.uid,
    email: currentUser.email,
    displayName: currentUser.displayName,
    tenantId: currentUser.tenantId,
    role: currentUser.role,
    photoURL: currentUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.displayName)}&background=7c3aed&color=fff`,
    createdAt: currentUser.createdAt,
    lastLoginAt: currentUser.lastLoginAt || new Date().toISOString(),
    emailVerified: true,
    disabled: false
  };
  
  res.json(firebaseUser);
});

// Messages endpoints - Real data integration
app.get("/api/messages", (req, res) => {
  const { userId, userEmail, limit = 50, offset = 0, status, priority } = req.query;
  const data = getAppData();
  let messages = data.messageThreads || [];
  
  // Filter messages for specific user if provided
  if (userId || userEmail) {
    messages = messages.filter(msg => 
      msg.to.email === userEmail || msg.to.uid === userId ||
      msg.from.email === userEmail || msg.from.uid === userId
    );
  }
  
  // Filter by status if provided
  if (status) {
    messages = messages.filter(msg => msg.status === status);
  }
  
  // Filter by priority if provided
  if (priority) {
    messages = messages.filter(msg => msg.priority === priority);
  }
  
  // Sort messages by timestamp (newest first)
  messages.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  // Apply pagination
  const startIndex = parseInt(offset);
  const pageSize = parseInt(limit);
  const paginatedMessages = messages.slice(startIndex, startIndex + pageSize);
  
  // Calculate unread count for current user
  const unreadCount = messages.filter(msg => 
    msg.status === 'unread' && 
    (msg.to.email === userEmail || msg.to.uid === userId)
  ).length;
  
  res.json({
    messages: paginatedMessages,
    unreadCount,
    total: messages.length,
    lastUpdated: new Date().toISOString(),
    pagination: {
      limit: pageSize,
      offset: startIndex,
      hasMore: startIndex + pageSize < messages.length
    }
  });
});

app.post("/api/messages", (req, res) => {
  const { to, subject, content, priority = "normal", labels = [], cc = [], bcc = [] } = req.body;
  
  if (!to || !subject || !content) {
    return res.status(400).json({
      success: false,
      error: "Missing required fields: to, subject, content"
    });
  }
  
  const data = getAppData();
  const users = data.users || [];
  const vendors = data.vendors || [];
  const startups = data.startups || [];
  
  // Find sender (for now using first admin, in real app get from authenticated user)
  const currentUser = users.find(u => u.role === 'admin') || users[0];
  
  // Find recipient user details
  let recipientDetails = null;
  if (typeof to === 'string') {
    // Find by email or UID
    recipientDetails = users.find(u => u.email === to || u.uid === to);
    if (!recipientDetails) {
      // Check vendors
      const vendor = vendors.find(v => v.email === to || v.contactEmail === to || v.vendorId === to);
      if (vendor) {
        recipientDetails = {
          uid: vendor.vendorId || vendor.id,
          email: vendor.contactEmail || vendor.email,
          name: vendor.name || vendor.companyName,
          type: 'vendor'
        };
      }
    }
    if (!recipientDetails) {
      // Check startups
      const startup = startups.find(s => s.contactEmail === to || s.id === to);
      if (startup) {
        recipientDetails = {
          uid: startup.id,
          email: startup.contactEmail,
          name: startup.name,
          type: 'startup'
        };
      }
    }
  } else {
    recipientDetails = to;
  }
  
  if (!recipientDetails) {
    return res.status(400).json({
      success: false,
      error: "Recipient not found"
    });
  }
  
  // Create new message
  const newMessage = {
    id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    subject,
    from: {
      uid: currentUser.uid,
      email: currentUser.email,
      name: currentUser.displayName || currentUser.name || "System",
      avatar: currentUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.displayName || currentUser.email)}&background=7c3aed&color=fff`,
      type: currentUser.role || 'user'
    },
    to: {
      uid: recipientDetails.uid,
      email: recipientDetails.email,
      name: recipientDetails.name || recipientDetails.displayName || recipientDetails.email,
      avatar: recipientDetails.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(recipientDetails.name || recipientDetails.email)}&background=059669&color=fff`,
      type: recipientDetails.type || 'user'
    },
    cc: cc.map(ccEmail => {
      const ccUser = users.find(u => u.email === ccEmail) || { email: ccEmail, name: ccEmail };
      return {
        email: ccUser.email,
        name: ccUser.displayName || ccUser.name || ccUser.email
      };
    }),
    bcc: bcc.map(bccEmail => {
      const bccUser = users.find(u => u.email === bccEmail) || { email: bccEmail, name: bccEmail };
      return {
        email: bccUser.email,
        name: bccUser.displayName || bccUser.name || bccUser.email
      };
    }),
    content,
    timestamp: new Date().toISOString(),
    status: "sent",
    priority,
    labels,
    threadId: `thread-${Date.now()}`,
    attachments: [],
    metadata: {
      ipAddress: req.get('x-forwarded-for') || req.connection.remoteAddress || "127.0.0.1",
      userAgent: req.get('user-agent'),
      sentVia: "web"
    }
  };
  
  // Add message to data
  if (!data.messageThreads) {
    data.messageThreads = [];
  }
  data.messageThreads.push(newMessage);
  
  // Save to backend
  if (saveAppData(data)) {
    // Log the action
    const auditLog = {
      id: Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      action: "MESSAGE_SENT",
      userEmail: currentUser.email,
      userId: currentUser.uid,
      tenantId: currentUser.tenantId || "public",
      targetType: "message",
      targetId: newMessage.id,
      ip: req.get('x-forwarded-for') || req.connection.remoteAddress || "127.0.0.1",
      metadata: {
        recipient: recipientDetails.email,
        subject: subject,
        priority: priority
      }
    };
    
    const auditLogs = getAuditData();
    auditLogs.unshift(auditLog);
    saveAuditData(auditLogs);
    
    res.status(201).json({ 
      success: true, 
      message: "Message sent successfully",
      messageId: newMessage.id,
      data: newMessage
    });
  } else {
    res.status(500).json({
      success: false,
      error: "Failed to save message"
    });
  }
});

// Get user contacts (users, vendors, startups they can message) - MOVED UP to avoid route conflicts
app.get("/api/messages/contacts", (req, res) => {
  const { search = "", type = "all", limit = 100 } = req.query;
  
  const data = getAppData();
  const users = data.users || [];
  const vendors = data.vendors || [];
  const startups = data.startups || [];
  
  let contacts = [];
  
  // Add users
  if (type === "all" || type === "users") {
    const userContacts = users.map(user => ({
      id: user.uid,
      name: user.displayName || user.name || "Unnamed User",
      email: user.email,
      avatar: user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || user.email)}&background=7c3aed&color=fff`,
      type: "user",
      role: user.role,
      status: user.disabled ? "inactive" : "active",
      lastActivity: user.lastLoginAt || user.lastActivity
    }));
    contacts.push(...userContacts);
  }
  
  // Add vendors
  if (type === "all" || type === "vendors") {
    const vendorContacts = vendors
      .filter(vendor => vendor.contactEmail || vendor.email)
      .map(vendor => ({
        id: vendor.vendorId || vendor.id,
        name: vendor.name || vendor.companyName || "Unnamed Vendor",
        email: vendor.contactEmail || vendor.email,
        avatar: vendor.logoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(vendor.name || vendor.email)}&background=059669&color=fff`,
        type: "vendor",
        status: vendor.status || "active",
        kycStatus: vendor.kycStatus,
        lastActivity: vendor.lastUpdated
      }));
    contacts.push(...vendorContacts);
  }
  
  // Add startups
  if (type === "all" || type === "startups") {
    const startupContacts = startups
      .filter(startup => startup.contactEmail)
      .map(startup => ({
        id: startup.id,
        name: startup.name || "Unnamed Startup",
        email: startup.contactEmail,
        avatar: startup.logoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(startup.name)}&background=dc2626&color=fff`,
        type: "startup",
        industry: startup.industry,
        status: startup.status || "active",
        lastActivity: startup.lastUpdated
      }));
    contacts.push(...startupContacts);
  }
  
  // Filter by search term
  if (search) {
    const searchLower = search.toLowerCase();
    contacts = contacts.filter(contact =>
      contact.name.toLowerCase().includes(searchLower) ||
      contact.email.toLowerCase().includes(searchLower)
    );
  }
  
  // Sort by name and apply limit
  contacts.sort((a, b) => a.name.localeCompare(b.name));
  contacts = contacts.slice(0, parseInt(limit));
  
  res.json({
    success: true,
    contacts,
    total: contacts.length,
    summary: {
      users: contacts.filter(c => c.type === "user").length,
      vendors: contacts.filter(c => c.type === "vendor").length,
      startups: contacts.filter(c => c.type === "startup").length
    }
  });
});

// Get conversation between two users - MOVED UP to avoid route conflicts
app.get("/api/messages/conversation", (req, res) => {
  const { user1, user2, limit = 50, offset = 0 } = req.query;
  
  if (!user1 || !user2) {
    return res.status(400).json({
      success: false,
      error: "Both user1 and user2 parameters are required"
    });
  }
  
  const data = getAppData();
  const messages = data.messageThreads || [];
  
  // Find messages between the two users
  const conversation = messages.filter(msg => 
    (msg.from.email === user1 && msg.to.email === user2) ||
    (msg.from.email === user2 && msg.to.email === user1) ||
    (msg.from.uid === user1 && msg.to.uid === user2) ||
    (msg.from.uid === user2 && msg.to.uid === user1)
  );
  
  // Sort by timestamp
  conversation.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  
  // Apply pagination
  const startIndex = parseInt(offset);
  const pageSize = parseInt(limit);
  const paginatedConversation = conversation.slice(startIndex, startIndex + pageSize);
  
  res.json({
    success: true,
    conversation: paginatedConversation,
    total: conversation.length,
    pagination: {
      limit: pageSize,
      offset: startIndex,
      hasMore: startIndex + pageSize < conversation.length
    }
  });
});

// Send message to multiple recipients (broadcast) - MOVED UP to avoid route conflicts
app.post("/api/messages/broadcast", (req, res) => {
  const { recipients, subject, content, priority = "normal", labels = [] } = req.body;
  
  if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
    return res.status(400).json({
      success: false,
      error: "Recipients array is required and must not be empty"
    });
  }
  
  if (!subject || !content) {
    return res.status(400).json({
      success: false,
      error: "Subject and content are required"
    });
  }
  
  const data = getAppData();
  const users = data.users || [];
  const vendors = data.vendors || [];
  const startups = data.startups || [];
  
  // Find sender
  const currentUser = users.find(u => u.role === 'admin') || users[0];
  
  const sentMessages = [];
  const failedRecipients = [];
  
  for (const recipientEmail of recipients) {
    // Find recipient details
    let recipientDetails = users.find(u => u.email === recipientEmail);
    
    if (!recipientDetails) {
      const vendor = vendors.find(v => v.email === recipientEmail || v.contactEmail === recipientEmail);
      if (vendor) {
        recipientDetails = {
          uid: vendor.vendorId || vendor.id,
          email: vendor.contactEmail || vendor.email,
          name: vendor.name || vendor.companyName,
          type: 'vendor'
        };
      }
    }
    
    if (!recipientDetails) {
      const startup = startups.find(s => s.contactEmail === recipientEmail);
      if (startup) {
        recipientDetails = {
          uid: startup.id,
          email: startup.contactEmail,
          name: startup.name,
          type: 'startup'
        };
      }
    }
    
    if (!recipientDetails) {
      failedRecipients.push(recipientEmail);
      continue;
    }
    
    // Create message for this recipient
    const newMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      subject,
      from: {
        uid: currentUser.uid,
        email: currentUser.email,
        name: currentUser.displayName || currentUser.name || "System",
        avatar: currentUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.displayName || currentUser.email)}&background=7c3aed&color=fff`,
        type: currentUser.role || 'user'
      },
      to: {
        uid: recipientDetails.uid,
        email: recipientDetails.email,
        name: recipientDetails.name || recipientDetails.displayName || recipientDetails.email,
        avatar: recipientDetails.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(recipientDetails.name || recipientDetails.email)}&background=059669&color=fff`,
        type: recipientDetails.type || 'user'
      },
      content,
      timestamp: new Date().toISOString(),
      status: "sent",
      priority,
      labels: [...labels, "broadcast"],
      threadId: `thread-${Date.now()}-${recipientEmail}`,
      isBroadcast: true,
      attachments: [],
      metadata: {
        ipAddress: req.get('x-forwarded-for') || req.connection.remoteAddress || "127.0.0.1",
        userAgent: req.get('user-agent'),
        sentVia: "web",
        broadcastId: `broadcast-${Date.now()}`
      }
    };
    
    sentMessages.push(newMessage);
  }
  
  // Add all messages to data
  if (!data.messageThreads) {
    data.messageThreads = [];
  }
  data.messageThreads.push(...sentMessages);
  
  // Save updated data
  if (saveAppData(data)) {
    // Log the broadcast action
    const auditLog = {
      id: Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      action: "MESSAGE_BROADCAST",
      userEmail: currentUser.email,
      userId: currentUser.uid,
      tenantId: currentUser.tenantId || "public",
      targetType: "message",
      targetId: "broadcast",
      ip: req.get('x-forwarded-for') || req.connection.remoteAddress || "127.0.0.1",
      metadata: {
        recipientCount: sentMessages.length,
        failedCount: failedRecipients.length,
        subject: subject,
        priority: priority
      }
    };
    
    const auditLogs = getAuditData();
    auditLogs.unshift(auditLog);
    saveAuditData(auditLogs);
    
    res.status(201).json({
      success: true,
      message: `Broadcast sent to ${sentMessages.length} recipients`,
      sentCount: sentMessages.length,
      failedCount: failedRecipients.length,
      failedRecipients,
      sentMessages: sentMessages.map(msg => ({
        id: msg.id,
        recipient: msg.to.email,
        status: msg.status
      }))
    });
  } else {
    res.status(500).json({
      success: false,
      error: "Failed to save broadcast messages"
    });
  }
});

// Get messages for a specific thread - MOVED UP to avoid route conflicts
app.get("/api/messages/thread/:threadId", (req, res) => {
  const { threadId } = req.params;
  const { userId, userEmail } = req.query;
  
  const data = getAppData();
  const messages = data.messageThreads || [];
  
  const threadMessages = messages.filter(msg => msg.threadId === threadId);
  
  if (threadMessages.length === 0) {
    return res.status(404).json({
      success: false,
      error: "Thread not found"
    });
  }
  
  // Check if user is authorized to view this thread
  const userCanView = threadMessages.some(msg => 
    msg.to.email === userEmail || msg.to.uid === userId ||
    msg.from.email === userEmail || msg.from.uid === userId
  );
  
  if (!userCanView) {
    return res.status(403).json({
      success: false,
      error: "Not authorized to view this thread"
    });
  }
  
  // Sort by timestamp
  threadMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  
  res.json({
    success: true,
    threadId,
    messages: threadMessages,
    total: threadMessages.length
  });
});

// Mark message as read
app.put("/api/messages/:id/read", (req, res) => {
  const { id } = req.params;
  const { userId, userEmail } = req.body;
  
  const data = getAppData();
  const messages = data.messageThreads || [];
  
  const messageIndex = messages.findIndex(msg => msg.id === id);
  if (messageIndex === -1) {
    return res.status(404).json({ 
      success: false, 
      error: "Message not found" 
    });
  }
  
  const message = messages[messageIndex];
  
  // Check if user is authorized to mark this message as read
  if (message.to.email !== userEmail && message.to.uid !== userId) {
    return res.status(403).json({
      success: false,
      error: "Not authorized to mark this message as read"
    });
  }
  
  // Update message status
  messages[messageIndex].status = "read";
  messages[messageIndex].readAt = new Date().toISOString();
  
  // Save updated data
  if (saveAppData(data)) {
    // Log the action
    const auditLog = {
      id: Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      action: "MESSAGE_READ",
      userEmail: userEmail,
      userId: userId,
      tenantId: "public",
      targetType: "message",
      targetId: id,
      ip: req.get('x-forwarded-for') || req.connection.remoteAddress || "127.0.0.1",
      metadata: {
        subject: message.subject
      }
    };
    
    const auditLogs = getAuditData();
    auditLogs.unshift(auditLog);
    saveAuditData(auditLogs);
    
    res.json({ 
      success: true, 
      message: `Message ${id} marked as read`,
      data: messages[messageIndex]
    });
  } else {
    res.status(500).json({
      success: false,
      error: "Failed to update message"
    });
  }
});

// Delete message
app.delete("/api/messages/:id", (req, res) => {
  const { id } = req.params;
  const { userId, userEmail } = req.body;
  
  const data = getAppData();
  const messages = data.messageThreads || [];
  
  const messageIndex = messages.findIndex(msg => msg.id === id);
  if (messageIndex === -1) {
    return res.status(404).json({ 
      success: false, 
      error: "Message not found" 
    });
  }
  
  const message = messages[messageIndex];
  
  // Check if user is authorized to delete this message
  if (message.to.email !== userEmail && message.to.uid !== userId && 
      message.from.email !== userEmail && message.from.uid !== userId) {
    return res.status(403).json({
      success: false,
      error: "Not authorized to delete this message"
    });
  }
  
  // Remove message from array
  const deletedMessage = messages.splice(messageIndex, 1)[0];
  
  // Save updated data
  if (saveAppData(data)) {
    // Log the action
    const auditLog = {
      id: Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      action: "MESSAGE_DELETED",
      userEmail: userEmail,
      userId: userId,
      tenantId: "public",
      targetType: "message",
      targetId: id,
      ip: req.get('x-forwarded-for') || req.connection.remoteAddress || "127.0.0.1",
      metadata: {
        subject: deletedMessage.subject
      }
    };
    
    const auditLogs = getAuditData();
    auditLogs.unshift(auditLog);
    saveAuditData(auditLogs);
    
    res.json({ 
      success: true, 
      message: `Message ${id} deleted successfully`,
      deletedMessage
    });
  } else {
    res.status(500).json({
      success: false,
      error: "Failed to delete message"
    });
  }
});

// Get message by ID
app.get("/api/messages/:id", (req, res) => {
  const { id } = req.params;
  const { userId, userEmail } = req.query;
  
  const data = getAppData();
  const messages = data.messageThreads || [];
  
  const message = messages.find(msg => msg.id === id);
  if (!message) {
    return res.status(404).json({ 
      success: false, 
      error: "Message not found" 
    });
  }
  
  // Check if user is authorized to view this message
  if (message.to.email !== userEmail && message.to.uid !== userId && 
      message.from.email !== userEmail && message.from.uid !== userId) {
    return res.status(403).json({
      success: false,
      error: "Not authorized to view this message"
    });
  }
  
  res.json({
    success: true,
    message,
    threadMessages: messages.filter(msg => msg.threadId === message.threadId)
  });
});

// Get messages for a specific thread
app.get("/api/messages/thread/:threadId", (req, res) => {
  const { threadId } = req.params;
  const { userId, userEmail } = req.query;
  
  const data = getAppData();
  const messages = data.messageThreads || [];
  
  const threadMessages = messages.filter(msg => msg.threadId === threadId);
  
  if (threadMessages.length === 0) {
    return res.status(404).json({
      success: false,
      error: "Thread not found"
    });
  }
  
  // Check if user is authorized to view this thread
  const userCanView = threadMessages.some(msg => 
    msg.to.email === userEmail || msg.to.uid === userId ||
    msg.from.email === userEmail || msg.from.uid === userId
  );
  
  if (!userCanView) {
    return res.status(403).json({
      success: false,
      error: "Not authorized to view this thread"
    });
  }
  
  // Sort by timestamp
  threadMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  
  res.json({
    success: true,
    threadId,
    messages: threadMessages,
    total: threadMessages.length
  });
});

// Reply to a message (adds to existing thread)
app.post("/api/messages/:id/reply", (req, res) => {
  const { id } = req.params;
  const { content, priority = "normal", labels = [] } = req.body;
  
  if (!content) {
    return res.status(400).json({
      success: false,
      error: "Content is required"
    });
  }
  
  const data = getAppData();
  const messages = data.messageThreads || [];
  const users = data.users || [];
  
  const originalMessage = messages.find(msg => msg.id === id);
  if (!originalMessage) {
    return res.status(404).json({
      success: false,
      error: "Original message not found"
    });
  }
  
  // Find current user (in real app, get from authenticated user)
  const currentUser = users.find(u => u.role === 'admin') || users[0];
  
  // Create reply message
  const replyMessage = {
    id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    subject: `Re: ${originalMessage.subject}`,
    from: {
      uid: currentUser.uid,
      email: currentUser.email,
      name: currentUser.displayName || currentUser.name || "System",
      avatar: currentUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.displayName || currentUser.email)}&background=7c3aed&color=fff`,
      type: currentUser.role || 'user'
    },
    to: originalMessage.from, // Reply to the sender
    content,
    timestamp: new Date().toISOString(),
    status: "sent",
    priority,
    labels,
    threadId: originalMessage.threadId, // Same thread
    parentMessageId: id,
    attachments: [],
    metadata: {
      ipAddress: req.get('x-forwarded-for') || req.connection.remoteAddress || "127.0.0.1",
      userAgent: req.get('user-agent'),
      sentVia: "web"
    }
  };
  
  // Add reply to messages
  messages.push(replyMessage);
  
  // Save updated data
  if (saveAppData(data)) {
    // Log the action
    const auditLog = {
      id: Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      action: "MESSAGE_REPLY",
      userEmail: currentUser.email,
      userId: currentUser.uid,
      tenantId: currentUser.tenantId || "public",
      targetType: "message",
      targetId: replyMessage.id,
      ip: req.get('x-forwarded-for') || req.connection.remoteAddress || "127.0.0.1",
      metadata: {
        originalMessageId: id,
        threadId: originalMessage.threadId,
        recipient: originalMessage.from.email
      }
    };
    
    const auditLogs = getAuditData();
    auditLogs.unshift(auditLog);
    saveAuditData(auditLogs);
    
    res.status(201).json({
      success: true,
      message: "Reply sent successfully",
      messageId: replyMessage.id,
      data: replyMessage
    });
  } else {
    res.status(500).json({
      success: false,
      error: "Failed to save reply"
    });
  }
});

// Admin: Get all messages with filtering
app.get("/api/admin/messages", (req, res) => {
  const { 
    limit = 100, 
    offset = 0, 
    status, 
    priority, 
    fromDate, 
    toDate, 
    fromUser, 
    toUser,
    search
  } = req.query;
  
  const data = getAppData();
  let messages = data.messageThreads || [];
  
  // Apply filters
  if (status) {
    messages = messages.filter(msg => msg.status === status);
  }
  
  if (priority) {
    messages = messages.filter(msg => msg.priority === priority);
  }
  
  if (fromDate) {
    messages = messages.filter(msg => new Date(msg.timestamp) >= new Date(fromDate));
  }
  
  if (toDate) {
    messages = messages.filter(msg => new Date(msg.timestamp) <= new Date(toDate));
  }
  
  if (fromUser) {
    messages = messages.filter(msg => 
      msg.from.email === fromUser || msg.from.uid === fromUser
    );
  }
  
  if (toUser) {
    messages = messages.filter(msg => 
      msg.to.email === toUser || msg.to.uid === toUser
    );
  }
  
  if (search) {
    const searchLower = search.toLowerCase();
    messages = messages.filter(msg =>
      msg.subject.toLowerCase().includes(searchLower) ||
      msg.content.toLowerCase().includes(searchLower) ||
      msg.from.name.toLowerCase().includes(searchLower) ||
      msg.to.name.toLowerCase().includes(searchLower)
    );
  }
  
  // Sort by timestamp (newest first)
  messages.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  // Apply pagination
  const startIndex = parseInt(offset);
  const pageSize = parseInt(limit);
  const paginatedMessages = messages.slice(startIndex, startIndex + pageSize);
  
  // Generate summary statistics
  const summary = {
    totalMessages: messages.length,
    unreadMessages: messages.filter(msg => msg.status === 'unread').length,
    highPriorityMessages: messages.filter(msg => msg.priority === 'high').length,
    todayMessages: messages.filter(msg => {
      const today = new Date();
      const msgDate = new Date(msg.timestamp);
      return msgDate.toDateString() === today.toDateString();
    }).length,
    messagesByStatus: {
      sent: messages.filter(msg => msg.status === 'sent').length,
      read: messages.filter(msg => msg.status === 'read').length,
      unread: messages.filter(msg => msg.status === 'unread').length
    },
    messagesByPriority: {
      high: messages.filter(msg => msg.priority === 'high').length,
      normal: messages.filter(msg => msg.priority === 'normal').length,
      low: messages.filter(msg => msg.priority === 'low').length
    }
  };
  
  res.json({
    success: true,
    messages: paginatedMessages,
    total: messages.length,
    summary,
    pagination: {
      limit: pageSize,
      offset: startIndex,
      hasMore: startIndex + pageSize < messages.length
    }
  });
});

// Admin: Send system announcement
app.post("/api/admin/messages/announcement", (req, res) => {
  const { subject, content, priority = "normal", targetAudience = "all" } = req.body;
  
  if (!subject || !content) {
    return res.status(400).json({
      success: false,
      error: "Subject and content are required"
    });
  }
  
  const data = getAppData();
  const users = data.users || [];
  const vendors = data.vendors || [];
  const startups = data.startups || [];
  
  let recipients = [];
  
  // Determine recipients based on target audience
  switch (targetAudience) {
    case "users":
      recipients = users.map(u => u.email).filter(Boolean);
      break;
    case "vendors":
      recipients = vendors.map(v => v.contactEmail || v.email).filter(Boolean);
      break;
    case "startups":
      recipients = startups.map(s => s.contactEmail).filter(Boolean);
      break;
    case "admins":
      recipients = users.filter(u => u.role === 'admin').map(u => u.email);
      break;
    case "all":
    default:
      recipients = [
        ...users.map(u => u.email),
        ...vendors.map(v => v.contactEmail || v.email),
        ...startups.map(s => s.contactEmail)
      ].filter(Boolean);
  }
  
  const systemUser = {
    uid: "system",
    email: "system@22onsloane.co",
    name: "System Announcement",
    avatar: "https://ui-avatars.com/api/?name=System&background=dc2626&color=fff",
    type: "system"
  };
  
  const sentMessages = [];
  
  for (const recipientEmail of recipients) {
    const newMessage = {
      id: `announcement-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      subject: `[ANNOUNCEMENT] ${subject}`,
      from: systemUser,
      to: {
        email: recipientEmail,
        name: recipientEmail,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(recipientEmail)}&background=7c3aed&color=fff`
      },
      content,
      timestamp: new Date().toISOString(),
      status: "sent",
      priority,
      labels: ["announcement", "system", targetAudience],
      threadId: `announcement-${Date.now()}-${recipientEmail}`,
      isAnnouncement: true,
      attachments: [],
      metadata: {
        sentVia: "admin-panel",
        targetAudience,
        announcementId: `ann-${Date.now()}`
      }
    };
    
    sentMessages.push(newMessage);
  }
  
  // Add all messages to data
  if (!data.messageThreads) {
    data.messageThreads = [];
  }
  data.messageThreads.push(...sentMessages);
  
  // Save updated data
  if (saveAppData(data)) {
    // Log the announcement
    const auditLog = {
      id: Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      action: "SYSTEM_ANNOUNCEMENT",
      userEmail: "system@22onsloane.co",
      userId: "system",
      tenantId: "public",
      targetType: "announcement",
      targetId: "system-announcement",
      ip: req.get('x-forwarded-for') || req.connection.remoteAddress || "127.0.0.1",
      metadata: {
        recipientCount: sentMessages.length,
        targetAudience,
        subject: subject,
        priority: priority
      }
    };
    
    const auditLogs = getAuditData();
    auditLogs.unshift(auditLog);
    saveAuditData(auditLogs);
    
    res.status(201).json({
      success: true,
      message: `System announcement sent to ${sentMessages.length} recipients`,
      recipientCount: sentMessages.length,
      targetAudience,
      announcementId: `ann-${Date.now()}`
    });
  } else {
    res.status(500).json({
      success: false,
      error: "Failed to save announcement"
    });
  }
});

// LMS endpoints
app.get("/api/lms/live", async (req, res) => {
  const tenantId = (req.headers["x-tenant-id"] || "public").toString();
  try {
    const data = await loadFirestoreAppData({ tenantId });
    res.json(data);
  } catch (error) {
    console.error("[LMS] Firestore live fetch failed:", error.message);
    try {
      const fallback = getAppData();
      res.json(fallback);
    } catch (fallbackError) {
      res.status(500).json({
        error: "Failed to load live LMS data",
        details: fallbackError.message || error.message,
      });
    }
  }
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
app.get("/api/wallets", (req, res) => {
  const data = getAppData();
  const wallets = data.wallets || [];
  
  res.json({
    ok: true,
    wallets: wallets.map(wallet => ({
      id: wallet.id,
      userId: wallet.userId || wallet.uid,
      userEmail: wallet.email || wallet.userEmail,
      balance: wallet.balance || 0,
      currency: wallet.currency || "USD",
      tenantId: wallet.tenantId || "vendor",
      role: wallet.role || "member",
      createdAt: wallet.createdAt,
      lastUpdated: wallet.lastUpdated,
      transactions: wallet.transactions || []
    })),
    total: wallets.length
  });
});

app.get("/api/wallets/me", async (req, res) => {
  try {
    const currentUser = getCurrentUser();
    
    // Try to get wallet from Firestore first
    let userWallet = await firestoreWalletService.getWallet(currentUser.uid);
    
    // If no wallet in Firestore, create a new one
    if (!userWallet) {
      userWallet = {
        id: `wallet_${currentUser.uid}_persistent`,
        userId: currentUser.uid,
        email: currentUser.email,
        displayName: currentUser.displayName,
        balance: 0,
        totalEarned: 0,
        totalSpent: 0,
        transactions: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: "active"
      };
      
      await firestoreWalletService.saveWallet(userWallet);
      console.log(`✅ Created new Firestore wallet for user: ${currentUser.uid}`);
    }

    return res.json(userWallet);
  } catch (error) {
    console.error('❌ Error in /api/wallets/me:', error);
    
    // Fallback to file-based storage if Firestore fails
    try {
      const currentUser = getCurrentUser();
      const data = getAppData();
      const wallets = data.wallets || [];
      
      let userWallet = wallets.find(w => w.userId === currentUser.uid);
      if (!userWallet) {
        userWallet = {
          id: `wallet_${currentUser.uid}_${Date.now()}`,
          userId: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName,
          balance: 0,
          totalEarned: 0,
          totalSpent: 0,
          transactions: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: "active"
        };
        data.wallets.push(userWallet);
        saveAppData(data);
      }
      
      return res.json(userWallet);
    } catch (fallbackError) {
      console.error('❌ Fallback also failed:', fallbackError);
      return res.status(500).json({
        status: "error",
        message: "Could not load wallet",
        error: error.message
      });
    }
  }
});

app.post("/api/wallets/me/redeem", async (req, res) => {
  try {
    const { amount, description, reference, metadata } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({
        status: "error",
        message: "Amount must be greater than zero"
      });
    }

    const currentUser = getCurrentUser();

    // Try Firestore first
    try {
      // Get or create wallet in Firestore
      let userWallet = await firestoreWalletService.getWallet(currentUser.uid);
      
      if (!userWallet) {
        userWallet = {
          id: `wallet_${currentUser.uid}_persistent`,
          userId: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName,
          balance: 0,
          totalEarned: 0,
          totalSpent: 0,
          transactions: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: "active"
        };
        
        await firestoreWalletService.saveWallet(userWallet);
        console.log(`✅ Created Firestore wallet for: ${currentUser.uid}`);
      }

      // Create debit transaction in Firestore
      const transaction = {
        id: Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9),
        userId: currentUser.uid,
        userEmail: currentUser.email,
        type: "debit",
        amount: parseFloat(amount),
        description: description || "Voucher redemption",
        reference: reference || null,
        metadata: metadata || null,
        createdAt: new Date().toISOString(),
        balanceAfter: Math.max(0, (userWallet.balance || 0) - parseFloat(amount))
      };

      // Add transaction to Firestore (this will also update wallet totals)
      await firestoreWalletService.addTransaction(currentUser.uid, transaction);
      
      // Get updated wallet with new transaction
      userWallet = await firestoreWalletService.getWallet(currentUser.uid);
      
      console.log(`🔥 Firestore redemption successful: ${amount} debited from ${currentUser.email}`);
      
      return res.json({
        ok: true,
        wallet: userWallet,
        transaction: transaction,
        source: "firestore"
      });

    } catch (firestoreError) {
      console.warn('⚠️ Firestore failed, falling back to file system:', firestoreError.message);
      
      // Fallback to file-based storage
      const data = getAppData();
      data.wallets = data.wallets || [];
      
      // Find or create user wallet
      let userWallet = data.wallets.find(w => w.userId === currentUser.uid);
      if (!userWallet) {
        userWallet = {
          id: `wallet_${currentUser.uid}_${Date.now()}`,
          userId: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName,
          balance: 0,
          totalEarned: 0,
          totalSpent: 0,
          transactions: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: "active"
        };
        data.wallets.push(userWallet);
      }
      
      // Create transaction
      const transaction = {
        id: Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9),
        userId: currentUser.uid,
        userEmail: currentUser.email,
        type: "debit",
        amount: parseFloat(amount),
        description: description || "Voucher redemption",
        reference: reference || null,
        metadata: metadata || null,
        createdAt: new Date().toISOString(),
        balanceAfter: Math.max(0, (userWallet.balance || 0) - parseFloat(amount))
      };

      // Update wallet
      userWallet.balance = transaction.balanceAfter;
      userWallet.totalSpent = (userWallet.totalSpent || 0) + parseFloat(amount);
      userWallet.transactions = userWallet.transactions || [];
      userWallet.transactions.unshift(transaction);
      userWallet.updatedAt = new Date().toISOString();

      // Update in-memory cache
      appData = data;
      
      // Save to persistent storage
      if (saveAppData(data)) {
        console.log('✅ Fallback: Redemption transaction saved to backend/appData.json');
      } else {
        console.warn('⚠️ File system save failed - transaction exists in memory for this session');
      }
      
      return res.json({
        ok: true,
        wallet: userWallet,
        transaction: transaction,
        source: "filesystem"
      });
    }

  } catch (error) {
    console.error('❌ Redeem endpoint error:', error);
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
      error: error.message
    });
  }
});

app.post("/api/wallets/grant", async (req, res) => {
  try {
    const { amount, email, description, reference, metadata } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({
        status: "error",
        message: "Amount must be greater than zero"
      });
    }

    if (!email) {
      return res.status(400).json({
        status: "error",
        message: "Email is required"
      });
    }

    // Find the target user by email from Firebase users
    const firebaseUsers = getRealFirebaseUsers();
    const targetUser = firebaseUsers.find(u => u.email?.toLowerCase() === email.toLowerCase());
    
    if (!targetUser) {
      return res.status(404).json({
        ok: false,
        error: `User with email ${email} not found in Firebase users`
      });
    }

    // Try Firestore first
    try {
      // Get or create wallet in Firestore
      let targetWallet = await firestoreWalletService.getWallet(targetUser.uid);
      
      if (!targetWallet) {
        targetWallet = {
          id: `wallet_${targetUser.uid}_persistent`,
          userId: targetUser.uid,
          email: targetUser.email,
          displayName: targetUser.displayName,
          balance: 0,
          totalEarned: 0,
          totalSpent: 0,
          transactions: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: "active"
        };
        
        await firestoreWalletService.saveWallet(targetWallet);
        console.log(`✅ Created Firestore wallet for: ${targetUser.uid}`);
      }

      // Create and add transaction in Firestore
      const transaction = {
        id: Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9),
        userId: targetUser.uid,
        userEmail: targetUser.email,
        type: "credit",
        amount: parseFloat(amount),
        description: description || "Admin credit grant",
        reference: reference || null,
        metadata: metadata || null,
        createdAt: new Date().toISOString(),
        balanceAfter: (targetWallet.balance || 0) + parseFloat(amount)
      };

      // Add transaction to Firestore (this will also update wallet totals)
      await firestoreWalletService.addTransaction(targetUser.uid, transaction);
      
      // Get updated wallet with new transaction
      targetWallet = await firestoreWalletService.getWallet(targetUser.uid);
      
      console.log(`🔥 Firestore grant successful: ${amount} credits to ${email}`);
      
      return res.json({
        ok: true,
        wallet: targetWallet,
        transaction: transaction,
        source: "firestore"
      });

    } catch (firestoreError) {
      console.warn('⚠️ Firestore failed, falling back to file system:', firestoreError.message);
      
      // Fallback to file-based storage
      const data = getAppData();
      data.wallets = data.wallets || [];
      
      // Find or create target user wallet using Firebase UID
      let targetWallet = data.wallets.find(w => w.userId === targetUser.uid);
      
      if (!targetWallet) {
        targetWallet = {
          id: `wallet_${targetUser.uid}_${Date.now()}`,
          userId: targetUser.uid,
          email: targetUser.email,
          displayName: targetUser.displayName,
          balance: 0,
          totalEarned: 0,
          totalSpent: 0,
          transactions: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: "active"
        };
        data.wallets.push(targetWallet);
      }
      
      // Create transaction
      const transaction = {
        id: Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9),
        userId: targetUser.uid,
        userEmail: targetUser.email,
        type: "credit",
        amount: parseFloat(amount),
        description: description || "Admin credit grant",
        reference: reference || null,
        metadata: metadata || null,
        createdAt: new Date().toISOString(),
        balanceAfter: (targetWallet.balance || 0) + parseFloat(amount)
      };

      // Update wallet
      targetWallet.balance = transaction.balanceAfter;
      targetWallet.totalEarned = (targetWallet.totalEarned || 0) + parseFloat(amount);
      targetWallet.transactions = targetWallet.transactions || [];
      targetWallet.transactions.unshift(transaction);
      targetWallet.updatedAt = new Date().toISOString();

      // Update in-memory cache
      appData = data;
      
      // Save to persistent storage
      if (saveAppData(data)) {
        console.log('✅ Fallback: Grant transaction saved to backend/appData.json');
      } else {
        console.warn('⚠️ File system save failed - transaction exists in memory for this session');
      }
      
      return res.json({
        ok: true,
        wallet: targetWallet,
        transaction: transaction,
        source: "filesystem"
      });
    }

  } catch (error) {
    console.error('❌ Grant endpoint error:', error);
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
      error: error.message
    });
  }
});

app.post("/api/wallets/transaction", (req, res) => {
  res.json({ success: true, transactionId: Date.now().toString() });
});

// Additional wallet admin endpoints (matching frontend expectations)
app.get("/api/wallets/admin/transactions", (req, res) => {
  const data = getAppData();
  const wallets = data.wallets || [];
  
  // Extract query parameters for filtering
  const {
    userEmail,
    type,
    dateFrom,
    dateTo,
    minAmount,
    maxAmount,
    page = 1,
    limit = 100
  } = req.query;

  // Collect all transactions from all wallets
  let allTransactions = [];
  
  wallets.forEach(wallet => {
    if (wallet && wallet.transactions && Array.isArray(wallet.transactions)) {
      wallet.transactions.forEach(transaction => {
        // Add user info to each transaction
        allTransactions.push({
          ...transaction,
          userEmail: wallet.email || wallet.userEmail,
          userName: wallet.displayName || wallet.email,
          walletId: wallet.id
        });
      });
    }
  });

  // Apply filters
  if (userEmail) {
    const emailLower = userEmail.toLowerCase();
    allTransactions = allTransactions.filter(t => 
      t.userEmail?.toLowerCase().includes(emailLower)
    );
  }
  
  if (type && type !== 'all') {
    allTransactions = allTransactions.filter(t => t.type === type);
  }
  
  if (dateFrom) {
    const fromDate = new Date(dateFrom);
    allTransactions = allTransactions.filter(t => 
      new Date(t.createdAt) >= fromDate
    );
  }
  
  if (dateTo) {
    const toDate = new Date(dateTo);
    allTransactions = allTransactions.filter(t => 
      new Date(t.createdAt) <= toDate
    );
  }
  
  if (minAmount) {
    allTransactions = allTransactions.filter(t => 
      (t.amount || 0) >= parseFloat(minAmount)
    );
  }
  
  if (maxAmount) {
    allTransactions = allTransactions.filter(t => 
      (t.amount || 0) <= parseFloat(maxAmount)
    );
  }

  // Sort by date (newest first)
  allTransactions.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Apply pagination
  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 100;
  const offset = (pageNum - 1) * limitNum;
  const paginatedTransactions = allTransactions.slice(offset, offset + limitNum);

  res.json({
    ok: true,
    transactions: paginatedTransactions,
    total: allTransactions.length,
    page: pageNum,
    limit: limitNum,
    hasMore: offset + limitNum < allTransactions.length
  });
});

app.get("/api/wallets/admin/lookup", (req, res) => {
  const { email } = req.query;
  
  if (!email) {
    return res.status(400).json({ 
      status: "error", 
      message: "Email parameter is required" 
    });
  }

  const data = getAppData();
  const wallets = data.wallets || [];
  const users = data.users || [];
  
  // Find wallet by email
  const emailLower = email.toLowerCase();
  const wallet = wallets.find(w => 
    w.email?.toLowerCase() === emailLower || 
    w.userEmail?.toLowerCase() === emailLower
  );
  
  // Find user info
  const user = users.find(u => u.email?.toLowerCase() === emailLower);
  
  if (wallet) {
    res.json({
      ok: true,
      wallet: {
        ...wallet,
        displayName: user?.displayName || wallet.displayName || wallet.email,
        role: user?.role || wallet.role || "member",
        tenantId: user?.tenantId || wallet.tenantId || "vendor"
      }
    });
  } else {
    res.json({
      ok: true,
      wallet: null,
      message: "No wallet found for this user"
    });
  }
});

app.get("/api/wallets/admin/debug/wallets", (req, res) => {
  const data = getAppData();
  const wallets = data.wallets || [];
  
  res.json({
    ok: true,
    walletsCount: wallets.length,
    firstWallet: wallets[0] || null,
    sampleWallets: wallets.slice(0, 3).map(w => ({
      email: w.email || w.userEmail,
      balance: w.balance || 0,
      transactionCount: w.transactions?.length || 0,
      id: w.id
    }))
  });
});

// Audit logs endpoints
app.post("/api/audit-logs", (req, res) => {
  const { action, userEmail, userId, targetType, targetId, metadata } = req.body;
  
  // Create new audit log entry
  const auditLog = {
    id: Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9),
    timestamp: new Date().toISOString(),
    action: action || "UNKNOWN_ACTION",
    userEmail: userEmail || null,
    userId: userId || null,
    tenantId: "public", // Default tenant
    targetType: targetType || "unknown",
    targetId: targetId || null,
    ip: req.get('x-forwarded-for') || req.connection.remoteAddress || "127.0.0.1",
    metadata: metadata || {}
  };
  
  // Get existing audit data and add new log
  const auditLogs = getAuditData();
  auditLogs.unshift(auditLog); // Add to beginning for latest first
  
  // Save updated audit data
  if (saveAuditData(auditLogs)) {
    res.status(201).json({ success: true, logId: auditLog.id, log: auditLog });
  } else {
    res.status(500).json({ success: false, error: "Failed to save audit log" });
  }
});

app.get("/api/audit-logs", (req, res) => {
  const { 
    limit = 50, 
    offset = 0, 
    userEmail, 
    action, 
    targetType, 
    startDate, 
    endDate 
  } = req.query;
  
  let auditLogs = getAuditData();
  
  // Apply filters
  if (userEmail) {
    auditLogs = auditLogs.filter(log => 
      log.userEmail && log.userEmail.toLowerCase().includes(userEmail.toLowerCase())
    );
  }
  
  if (action) {
    auditLogs = auditLogs.filter(log => 
      log.action && log.action.toLowerCase().includes(action.toLowerCase())
    );
  }
  
  if (targetType) {
    auditLogs = auditLogs.filter(log => log.targetType === targetType);
  }
  
  if (startDate) {
    auditLogs = auditLogs.filter(log => 
      new Date(log.timestamp) >= new Date(startDate)
    );
  }
  
  if (endDate) {
    auditLogs = auditLogs.filter(log => 
      new Date(log.timestamp) <= new Date(endDate)
    );
  }
  
  // Sort by timestamp (newest first)
  auditLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  // Apply pagination
  const total = auditLogs.length;
  const startIndex = parseInt(offset);
  const pageSize = parseInt(limit);
  const paginatedLogs = auditLogs.slice(startIndex, startIndex + pageSize);
  
  // Generate summary statistics
  const summary = {
    totalLogs: total,
    uniqueUsers: [...new Set(auditLogs.map(log => log.userEmail).filter(Boolean))].length,
    topActions: getTopActions(auditLogs),
    recentActivity: auditLogs.slice(0, 10).map(log => ({
      timestamp: log.timestamp,
      action: log.action,
      userEmail: log.userEmail
    }))
  };
  
  res.json({ 
    logs: paginatedLogs, 
    total,
    summary,
    pagination: {
      limit: pageSize,
      offset: startIndex,
      hasMore: startIndex + pageSize < total
    }
  });
});

// Helper function to get top actions
function getTopActions(logs) {
  const actionCounts = {};
  logs.forEach(log => {
    actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
  });
  
  return Object.entries(actionCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([action, count]) => ({ action, count }));
}

// Data services endpoints
app.get("/api/data/services", async (req, res) => {
  const tenantId = (req.headers["x-tenant-id"] || "public").toString();
  try {
    const services = await fetchFirestoreCollection("services", { tenantFilter: tenantId });
    res.json({ services, total: services.length });
  } catch (error) {
    console.error("/api/data/services Firestore fallback:", error.message);
    try {
      const data = getAppData();
      const services = (data.services || []).filter((service) => {
        const docTenant = service.tenantId || "public";
        if (!service.tenantId) return true;
        if (tenantId === "public") return docTenant === "public";
        return docTenant === tenantId;
      });
      res.json({ services, total: services.length, source: "file" });
    } catch (fallbackError) {
      res.status(500).json({ error: "Failed to load services", details: fallbackError.message || error.message });
    }
  }
});

// My vendor services endpoint
app.get("/api/data/services/mine", async (req, res) => {
  const tenantId = (req.headers["x-tenant-id"] || "public").toString();
  try {
    const [services, vendors, bookings] = await Promise.all([
      fetchFirestoreCollection("services", { tenantFilter: tenantId }),
      fetchFirestoreCollection("vendors", { tenantFilter: tenantId }),
      fetchFirestoreCollection("bookings", { tenantFilter: tenantId }),
    ]);

    const firstVendor = vendors[0];
    const vendorId = firstVendor?.vendorId || firstVendor?.id;

    const myServices = vendorId
      ? services.filter((service) =>
          service.vendorId === vendorId ||
          service.vendor === firstVendor?.name ||
          (service.contactEmail || "").toLowerCase() === (firstVendor?.contactEmail || "").toLowerCase()
        )
      : services;

    const serviceIds = new Set(myServices.map((s) => s.id));
    const myBookings = bookings.filter((booking) => serviceIds.has(booking.serviceId));

    res.json({
      listings: myServices,
      bookings: myBookings,
      vendor: firstVendor || null,
      tenantId: firstVendor?.tenantId || tenantId,
      total: myServices.length,
    });
  } catch (error) {
    console.error("/api/data/services/mine Firestore fallback:", error.message);
    try {
      const data = getAppData();
      const services = data.services || [];
      const vendors = data.vendors || [];
      const bookings = data.bookings || [];
      const firstVendor = vendors[0];
      const vendorId = firstVendor?.id || firstVendor?.vendorId || "";
      const myServices = vendorId
        ? services.filter((service) =>
            service.vendorId === vendorId ||
            service.vendor === firstVendor?.name ||
            service.contactEmail === firstVendor?.contactEmail
          )
        : services;
      const myServiceIds = new Set(myServices.map((s) => s.id));
      const myBookings = bookings.filter((booking) => myServiceIds.has(booking.serviceId));
      res.json({
        listings: myServices,
        bookings: myBookings,
        vendor: firstVendor,
        tenantId: firstVendor?.tenantId || "public",
        total: myServices.length,
        source: "file",
      });
    } catch (fallbackError) {
      res.status(500).json({
        error: "Failed to load vendor services",
        details: fallbackError.message || error.message,
      });
    }
  }
});

app.get("/api/data/vendors", async (req, res) => {
  const tenantId = (req.headers["x-tenant-id"] || "public").toString();
  try {
    const vendors = await fetchFirestoreCollection("vendors", { tenantFilter: tenantId });
    res.json({ vendors, total: vendors.length });
  } catch (error) {
    console.error("/api/data/vendors Firestore fallback:", error.message);
    try {
      const data = getAppData();
      const all = data.vendors || [];
      const filtered = all.filter((v) => {
        const docTenant = v.tenantId || "public";
        if (tenantId === "public") return !v.tenantId || docTenant === "public";
        return docTenant === tenantId;
      });
      res.json({ vendors: filtered, total: filtered.length, source: "file" });
    } catch (fallbackError) {
      res.status(500).json({ error: "Failed to load vendors", details: fallbackError.message || error.message });
    }
  }
});

app.get("/api/data/vendors/:id/stats", async (req, res) => {
  const tenantId = (req.headers["x-tenant-id"] || "public").toString();
  const vendorId = req.params.id;
  try {
    const [vendors, services, bookings] = await Promise.all([
      fetchFirestoreCollection("vendors", { tenantFilter: tenantId }),
      fetchFirestoreCollection("services", { tenantFilter: tenantId }),
      fetchFirestoreCollection("bookings", { tenantFilter: tenantId }),
    ]);

    const vendor = vendors.find((v) => v.id === vendorId || v.vendorId === vendorId);
    const vendorServices = services.filter((s) => s.vendorId === vendorId || s.vendor === vendorId);
    const vendorBookings = bookings.filter((b) => b.vendorId === vendorId || b.serviceVendorId === vendorId);

    const listingStats = {
      total: vendorServices.length,
      byStatus: vendorServices.reduce((acc, service) => {
        const status = (service.status || "active").toLowerCase();
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {}),
    };

    const reviewStats = {
      totalReviews: vendorServices.reduce((total, service) => {
        if (Array.isArray(service.reviews)) return total + service.reviews.length;
        if (typeof service.reviewCount === "number") return total + service.reviewCount;
        return total;
      }, 0),
      avgRating:
        vendorServices.length > 0
          ? vendorServices.reduce((sum, service) => sum + (Number(service.rating) || 0), 0) / vendorServices.length
          : 0,
    };

    const subscriptionStats = {
      byService: vendorServices.reduce((acc, service) => {
        const count = vendorBookings.filter((b) => b.serviceId === service.id).length;
        acc[service.id] = count;
        return acc;
      }, {}),
    };

    res.json({
      listingStats,
      reviewStats,
      subscription: { plan: vendor?.subscriptionPlan || "Free", status: vendor?.status || "active" },
      subscriptionStats,
      salesTime: { monthly: {}, quarterly: {}, annual: {} },
    });
  } catch (error) {
    console.error(`/api/data/vendors/${vendorId}/stats Firestore fallback:`, error.message);
    try {
      const data = getAppData();
      const vendors = data.vendors || [];
      const services = data.services || [];
      const bookings = data.bookings || [];
      const vendor = vendors.find((v) => v.id === vendorId || v.vendorId === vendorId);
      const vendorServices = services.filter((s) => s.vendorId === vendorId || s.vendor === vendorId);
      const vendorBookings = bookings.filter((b) => b.vendorId === vendorId);
      const listingStats = {
        total: vendorServices.length,
        byStatus: vendorServices.reduce((acc, service) => {
          const status = service.status || "active";
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {}),
      };
      const reviewStats = {
        totalReviews: vendorServices.reduce((total, service) => {
          return total + (service.reviewCount || (service.reviews ? service.reviews.length : 0));
        }, 0),
        avgRating:
          vendorServices.length > 0
            ? vendorServices.reduce((sum, service) => sum + (service.rating || 0), 0) / vendorServices.length
            : 0,
      };
      const subscriptionStats = {
        byService: vendorServices.reduce((acc, service) => {
          acc[service.id] = vendorBookings.filter((b) => b.serviceId === service.id).length;
          return acc;
        }, {}),
      };
      res.json({
        listingStats,
        reviewStats,
        subscription: { plan: vendor?.subscriptionPlan || "Free", status: vendor?.status || "active" },
        subscriptionStats,
        salesTime: { monthly: {}, quarterly: {}, annual: {} },
        source: "file",
      });
    } catch (fallbackError) {
      res.status(500).json({
        error: "Failed to compute vendor stats",
        details: fallbackError.message || error.message,
      });
    }
  }
});

app.get("/api/data/startups", (req, res) => {
  const data = getAppData();
  const startups = data.startups || [];
  res.json({ startups, total: startups.length });
});

// Users endpoint
app.get("/api/users", (req, res) => {
  const users = getAllUsers();
  res.json({ users, total: users.length });
});

// Update user role/tenant (grant admin functionality)
app.post("/api/users", (req, res) => {
  try {
    const { email, tenantId = "public", role = "member", uid = "" } = req.body || {};
    
    if (!email) {
      return res.status(400).json({ error: "Missing email" });
    }
    
    const normalizedEmail = email.trim().toLowerCase();
    
    // Load current data
    let data = getAppData();
    const users = Array.isArray(data.users) ? [...data.users] : [];
    
    // Find existing user or create new one
    const existingIndex = users.findIndex(u => 
      (u.email || "").toLowerCase() === normalizedEmail
    );
    
    const updatedUser = {
      email: normalizedEmail,
      tenantId,
      role,
      ...(uid ? { uid } : {}),
      ...(existingIndex >= 0 ? users[existingIndex] : {}),
      // Override with new values
      email: normalizedEmail,
      tenantId,
      role
    };
    
    if (existingIndex >= 0) {
      users[existingIndex] = updatedUser;
    } else {
      users.push(updatedUser);
    }
    
    // Update the data
    data.users = users;
    
    // In a real application, you would save this to a database
    // For now, just return success
    console.log(`✅ Updated user: ${normalizedEmail} -> role: ${role}, tenant: ${tenantId}`);
    
    res.json({ ok: true, users: data.users });
  } catch (error) {
    console.error("❌ Error updating user:", error);
    res.status(500).json({ error: "Failed to update user" });
  }
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

app.get("/api/admin/users", (req, res) => {
  const data = getAppData();
  const users = data.users || [];
  const startups = data.startups || [];
  const vendors = data.vendors || [];
  
  // Transform users with additional admin info
  const adminUsers = users.map(user => ({
    id: user.uid || user.id,
    uid: user.uid || user.id,
    name: user.name || user.displayName || "Unnamed User",
    email: user.email,
    role: user.role || "member",
    tenantId: user.tenantId || "public",
    status: user.disabled ? "disabled" : "active",
    emailVerified: user.emailVerified !== false,
    createdAt: user.createdAt || new Date().toISOString(),
    lastLoginAt: user.lastLoginAt || user.lastActivity || new Date().toISOString(),
    photoURL: user.photoURL || user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || user.email)}&background=7c3aed&color=fff`,
    metadata: {
      totalBookings: 0, // Could be calculated from bookings data
      totalSpent: 0,    // Could be calculated from bookings data
      isVendor: vendors.some(v => v.email === user.email || v.userId === user.uid),
      isStartupOwner: startups.some(s => s.email === user.email || s.userId === user.uid)
    }
  }));
  
  res.json({
    status: "success",
    users: adminUsers,
    total: adminUsers.length,
    summary: {
      totalUsers: adminUsers.length,
      activeUsers: adminUsers.filter(u => u.status === "active").length,
      adminUsers: adminUsers.filter(u => u.role === "admin").length,
      vendorUsers: adminUsers.filter(u => u.metadata.isVendor).length,
      startupUsers: adminUsers.filter(u => u.metadata.isStartupOwner).length
    }
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
  const wallets = data.wallets || [];
  
  // Only return users who actually have wallet records or have been granted credits
  // This separates true "local wallet users" from general platform users
  let localWalletUsers = [];
  
  // Check if any users have actual wallet data
  if (wallets.length > 0) {
    // Filter to users who have actual wallet records
    localWalletUsers = users.filter(user => 
      wallets.some(wallet => wallet.userId === user.uid || wallet.userId === user.id)
    ).map(user => {
      const userWallet = wallets.find(w => w.userId === user.uid || w.userId === user.id);
      return {
        id: user.uid || user.id,
        uid: user.uid || user.id,
        name: user.name || user.displayName || "Unnamed User",
        email: user.email,
        role: user.role || "member",
        tenantId: user.tenantId || "public",
        createdAt: user.createdAt || new Date().toISOString(),
        lastActivity: user.lastActivity || user.lastLoginAt || user.updatedAt || new Date().toISOString(),
        walletBalance: userWallet?.balance || 0,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || user.email)}&background=7c3aed&color=fff`
      };
    });
  } else {
    // No wallet data exists yet - return empty list for local wallet users
    // This makes it clear this section is for users with actual wallet activity
    localWalletUsers = [];
  }
  
  // Sort by wallet balance then name
  localWalletUsers.sort((a, b) => 
    b.walletBalance !== a.walletBalance ? 
    b.walletBalance - a.walletBalance : 
    a.name.localeCompare(b.name)
  );
  
  res.json({
    status: "success",
    users: localWalletUsers,
    summary: {
      totalUsers: localWalletUsers.length,
      usersWithCredits: localWalletUsers.filter(u => u.walletBalance > 0).length,
      totalCreditsAllocated: localWalletUsers.reduce((sum, u) => sum + (u.walletBalance || 0), 0)
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
  try {
    const { promoteVendors = [], defaultRole = "member", defaultTenant = "public" } = req.body;
    
    const data = getAppData();
    if (!data.wallets) {
      data.wallets = [];
    }
    
    // Get all users (Firebase + backend combined)
    const allUsers = getAllUsers();
    let syncedCount = 0;
    let existingCount = 0;
    let errorCount = 0;
    const errors = [];
    
    // Sync each user - create wallet if doesn't exist
    allUsers.forEach(user => {
      try {
        // Check if user already has a wallet
        const existingWallet = data.wallets.find(w => w.userId === user.uid);
        
        if (!existingWallet) {
          // Create new wallet for user
          const newWallet = {
            id: `wallet_${user.uid}_${Date.now()}`,
            userId: user.uid,
            email: user.email,
            displayName: user.displayName,
            balance: 0,
            totalEarned: 0,
            totalSpent: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: "active"
          };
          
          data.wallets.push(newWallet);
          syncedCount++;
        } else {
          existingCount++;
        }
      } catch (userError) {
        errorCount++;
        errors.push(`${user.email}: ${userError.message}`);
      }
    });
    
    // Save updated data (gracefully handle file system issues in serverless)
    try {
      saveAppData(data);
    } catch (saveError) {
      console.warn('Could not persist data to file system (serverless environment):', saveError.message);
    }
    
    // Create informative message
    let message;
    if (syncedCount > 0) {
      message = `Successfully synced ${syncedCount} new users`;
    } else if (existingCount > 0) {
      message = `All ${existingCount} users already have wallets - sync complete`;
    } else {
      message = "No users found to sync";
    }
    
    if (errorCount > 0) {
      message += ` (${errorCount} errors)`;
    }
    
    res.json({
      status: "success", 
      message: message,
      synced: syncedCount,
      existing: existingCount,
      errors: errorCount,
      total: allUsers.length,
      details: errorCount > 0 ? errors : undefined
    });
    
  } catch (error) {
    console.error('Error syncing Firebase users:', error);
    res.status(500).json({
      status: "error",
      message: "Failed to sync Firebase users",
      error: error.message
    });
  }
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

// Users/all endpoint - combines Firebase users with backend data
app.get("/api/users/all", (req, res) => {
  const { search = "", pageSize = 100 } = req.query;
  
  // Get combined users from Firebase and backend
  const allUsers = getAllUsers();
  
  // Convert to Firebase-compatible format for frontend
  const firebaseUsers = allUsers.map(user => ({
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'User')}&background=7c3aed&color=fff`,
    emailVerified: true,
    disabled: false,
    metadata: {
      creationTime: user.createdAt || "2025-01-01T00:00:00Z",
      lastSignInTime: user.lastLoginAt || "2025-01-01T00:00:00Z"
    },
    providerData: [{
      providerId: "password",
      uid: user.email,
      email: user.email,
      displayName: user.displayName
    }],
    tenantId: user.tenantId || "public",
    role: user.role || "member"
  }));
  
  // Filter users based on search term
  let filteredUsers = firebaseUsers;
  if (search) {
    const searchLower = search.toLowerCase();
    filteredUsers = firebaseUsers.filter(user => 
      (user.email && user.email.toLowerCase().includes(searchLower)) ||
      (user.displayName && user.displayName.toLowerCase().includes(searchLower))
    );
  }
  
  // Apply pagination
  const limit = parseInt(pageSize);
  const paginatedUsers = filteredUsers.slice(0, limit);
  
  res.json({
    items: paginatedUsers,
    nextPageToken: filteredUsers.length > limit ? "has-more" : null
  });
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
      "/api/health", "/api/me", "/api/messages", "/api/messages/:id", "/api/messages/:id/read", 
      "/api/messages/:id/reply", "/api/messages/thread/:threadId", "/api/messages/conversation",
      "/api/messages/broadcast", "/api/messages/contacts", "/api/admin/messages", 
      "/api/admin/messages/announcement", "/api/lms/live", "/api/tenants", 
      "/api/wallets", "/api/wallets/me", "/api/wallets/me/redeem", "/api/wallets/grant",
      "/api/wallets/admin/transactions", "/api/wallets/admin/lookup", "/api/wallets/admin/debug/wallets",
      "/api/audit-logs", "/api/data/services", "/api/data/services/mine", "/api/data/vendors", 
      "/api/data/startups", "/api/data/vendors/:id/stats", "/api/users", "/api/users/all", 
      "/api/admin/stats", "/api/admin/users", "/api/subscriptions", "/api/subscriptions/my", 
      "/api/subscriptions/service", "/api/subscriptions/service/cancel", "/api/subscriptions/service/:id",
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
        "/api/health", "/api/me", "/api/messages", "/api/messages/:id", "/api/messages/:id/read", 
        "/api/messages/:id/reply", "/api/messages/thread/:threadId", "/api/messages/conversation",
        "/api/messages/broadcast", "/api/messages/contacts", "/api/admin/messages", 
        "/api/admin/messages/announcement", "/api/lms/live", "/api/tenants", 
        "/api/wallets", "/api/wallets/me", "/api/wallets/me/redeem", "/api/wallets/grant",
        "/api/wallets/admin/transactions", "/api/wallets/admin/lookup", "/api/wallets/admin/debug/wallets",
        "/api/audit-logs", "/api/data/services", "/api/data/services/mine", "/api/data/vendors", 
        "/api/data/startups", "/api/data/vendors/:id/stats", "/api/users", "/api/users/all", 
        "/api/admin/stats", "/api/admin/users", "/api/subscriptions", "/api/subscriptions/my", 
        "/api/subscriptions/service", "/api/subscriptions/service/cancel", "/api/subscriptions/service/:id",
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

// Admin endpoint to persist current wallet state to backend file
app.post("/api/admin/wallet/persist-to-backend", (req, res) => {
  try {
    const data = getAppData();
    const wallets = data.wallets || [];
    
    if (wallets.length === 0) {
      return res.json({
        status: "info",
        message: "No wallets to persist",
        wallets: []
      });
    }
    
    // This endpoint helps administrators manually update the backend file
    // by providing the current wallet state that can be copied to the source
    res.json({
      status: "success",
      message: `Current wallet state for ${wallets.length} wallets`,
      instructions: "Copy this wallet data to backend/appData.json and redeploy to make it persistent",
      walletsJson: wallets,
      totalWallets: wallets.length,
      note: "In serverless environments, runtime changes cannot be automatically persisted to source files"
    });
  } catch (error) {
    console.error('Error in persist-to-backend:', error);
    res.status(500).json({
      status: "error",
      message: "Failed to generate persistence data",
      error: error.message
    });
  }
});

// Also export the app for local testing
module.exports.app = app;

// Start server if running directly (not in Vercel)
if (require.main === module) {
  const PORT = process.env.PORT || 5500;
  const server = app.listen(PORT, () => {
    const actualPort = server.address().port;
    console.log(`🚀 Sloane Hub API server running on port ${actualPort}`);
    console.log(`📡 Server URL: http://localhost:${actualPort}`);
    console.log(`📊 Health check: http://localhost:${actualPort}/api/health`);
    console.log(`💬 Messages API: http://localhost:${actualPort}/api/messages`);
    console.log(`👥 Users API: http://localhost:${actualPort}/api/users/all`);
    console.log(`⚙️  Admin API: http://localhost:${actualPort}/api/admin/stats`);
    console.log(`✅ API server running on http://localhost:${actualPort}`);
  });
}
