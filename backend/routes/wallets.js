import { Router } from "express";
import { v4 as uuid } from "uuid";
import { getData, saveData } from "../utils/dataStore.js";
import { firebaseAuthRequired } from "../middleware/authFirebase.js";
import { requireAdmin, normalizeEmail, collectUsers } from "../middleware/isAdmin.js";

const router = Router();

// Apply Firebase authentication to all routes
router.use(firebaseAuthRequired);

// GET /api/wallets - Get all wallets (admin only)
router.get("/", requireAdmin, (req, res) => {
  try {
    const data = getData();
    const wallets = ensureWalletArray(data);
    
    res.json(wallets.map(wallet => ({
      userId: wallet.uid || wallet.email,
      userEmail: wallet.email,
      balance: wallet.balance || 0,
      tenantId: wallet.tenantId,
      createdAt: wallet.createdAt,
      updatedAt: wallet.updatedAt
    })));
  } catch (error) {
    console.error("Error fetching wallets:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch wallets"
    });
  }
});

const STARTING_BALANCE = 200_000;
const MAX_TRANSACTIONS = 150;
const WALLET_VERSION = 1;
const ELIGIBLE_ROLES = new Set(["vendor", "member", "startup"]);
const ELIGIBLE_TENANTS = new Set(["vendor", "basic", "startup"]);

function normalizeRole(role) {
  if (typeof role !== "string") return "member";
  const trimmed = role.trim().toLowerCase();
  return trimmed || "member";
}

function normalizeTenant(value) {
  if (!value || typeof value !== "string") return "vendor";
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return "vendor";
  if (trimmed === "public") return "vendor";
  return trimmed;
}

function eligibleForWallet(role, tenantId) {
  return ELIGIBLE_ROLES.has(normalizeRole(role)) || ELIGIBLE_TENANTS.has(normalizeTenant(tenantId));
}

function ensureWalletArray(data) {
  if (!Array.isArray(data.wallets)) {
    data.wallets = [];
  }
  return data.wallets;
}

function matchWalletIdentity(candidate, { uid, email }) {
  if (!candidate) return false;
  const emailNorm = normalizeEmail(email);
  if (uid && candidate.uid && String(candidate.uid) === String(uid)) return true;
  if (emailNorm && normalizeEmail(candidate.email) === emailNorm) return true;
  return false;
}

function walletId({ tenantId, uid, email }) {
  const tenant = normalizeTenant(tenantId || "public");
  const key = uid || email || `${tenant}-anonymous`;
  return `${tenant}:${key}`;
}

function nowIso() {
  return new Date().toISOString();
}

function round2(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

function sanitizeMetadata(meta) {
  if (!meta || typeof meta !== "object") return null;
  try {
    JSON.stringify(meta);
    return meta;
  } catch {
    return null;
  }
}

function sanitizeTransaction(entry) {
  if (!entry || typeof entry !== "object") return null;
  const amount = round2(entry.amount);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  const type = entry.type === "debit" ? "debit" : "credit";
  const description = typeof entry.description === "string" && entry.description.trim()
    ? entry.description.trim()
    : type === "credit"
    ? "Voucher credit"
    : "Voucher redemption";
  const balanceAfter = round2(entry.balanceAfter);
  const createdAt = typeof entry.createdAt === "string" && entry.createdAt ? entry.createdAt : nowIso();
  const reference = typeof entry.reference === "string" ? entry.reference : null;
  const metadata = sanitizeMetadata(entry.metadata);

  return {
    id: typeof entry.id === "string" && entry.id ? entry.id : uuid(),
    type,
    amount,
    description,
    balanceAfter,
    createdAt,
    reference,
    metadata,
  };
}

function sanitizeWallet(raw) {
  if (!raw || typeof raw !== "object") return null;
  const wallet = {
    id: raw.id || walletId({ tenantId: raw.tenantId, uid: raw.uid, email: raw.email }),
    version: Number(raw.version) || WALLET_VERSION,
    uid: raw.uid || null,
    email: raw.email || null,
    tenantId: normalizeTenant(raw.tenantId),
    role: normalizeRole(raw.role),
    balance: round2(raw.balance ?? STARTING_BALANCE),
    startingBalance: (() => {
      const parsed = Number(raw.startingBalance);
      if (!Number.isFinite(parsed)) return STARTING_BALANCE;
      return round2(Math.max(0, parsed));
    })(),
    transactions: Array.isArray(raw.transactions)
      ? raw.transactions
          .map((tx) => sanitizeTransaction(tx))
          .filter((tx) => !!tx)
          .sort((a, b) => (a.createdAt > b.createdAt ? -1 : a.createdAt < b.createdAt ? 1 : 0))
          .slice(0, MAX_TRANSACTIONS)
      : [],
    lastUpdated: typeof raw.lastUpdated === "string" && raw.lastUpdated ? raw.lastUpdated : nowIso(),
  };
  return wallet;
}

function createInitialWallet({ uid, email, role, tenantId }) {
  const createdAt = nowIso();
  const tx = {
    id: uuid(),
    type: "credit",
    amount: STARTING_BALANCE,
    description: "Initial voucher allocation",
    reference: "initial-credit",
    metadata: { reason: "auto-allocation", role: normalizeRole(role) },
    createdAt,
    balanceAfter: STARTING_BALANCE,
  };
  return {
    id: walletId({ tenantId, uid, email }),
    version: WALLET_VERSION,
    uid: uid || null,
    email: email || null,
    tenantId: normalizeTenant(tenantId),
    role: normalizeRole(role),
    balance: STARTING_BALANCE,
    startingBalance: STARTING_BALANCE,
    transactions: [tx],
    lastUpdated: createdAt,
  };
}

function createEmptyWallet({ uid, email, role, tenantId }) {
  const createdAt = nowIso();
  return {
    id: walletId({ tenantId, uid, email }),
    version: WALLET_VERSION,
    uid: uid || null,
    email: email || null,
    tenantId: normalizeTenant(tenantId),
    role: normalizeRole(role),
    balance: 0,
    startingBalance: 0,
    transactions: [],
    lastUpdated: createdAt,
  };
}

function findUserRecord(data, { email, uid }) {
  const normEmail = normalizeEmail(email);
  const rawUsers = Array.isArray(data?.users) ? data.users : [];
  const summaryUsers = collectUsers(data);
  let hit = null;
  if (uid) {
    hit = rawUsers.find((u) => (u?.uid || "") === uid);
  }
  if (!hit && normEmail) {
    hit = rawUsers.find((u) => normalizeEmail(u?.email) === normEmail);
  }
  if (!hit && normEmail) {
    hit = summaryUsers.find((u) => normalizeEmail(u?.email) === normEmail) || null;
    if (hit) {
      const raw = rawUsers.find((u) => normalizeEmail(u?.email) === normEmail);
      if (raw?.uid) hit = { ...hit, uid: raw.uid };
    }
  }
  if (!hit && normEmail) {
    hit = { email: normEmail, tenantId: "public", role: "member" };
  }
  return hit;
}

function resolveUserContext(req) {
  const email = normalizeEmail(req.user?.email);
  const uid = typeof req.user?.uid === "string" ? req.user.uid : null;
  const data = getData();
  const record = findUserRecord(data, { email, uid }) || {};
  const role = normalizeRole(record.role || req.user?.role || req.user?.roles?.[0]);
  const tenantId = normalizeTenant(record.tenantId || req.tenant?.id);
  return { email, uid, role, tenantId };
}

function ensureWallet(data, { uid, email, role, tenantId }, { initialize = true } = {}) {
  const wallets = ensureWalletArray(data);
  const id = walletId({ tenantId, uid, email });
  let idx = wallets.findIndex((w) => w && w.id === id);

  if (idx === -1) {
    const identityIdx = wallets.findIndex((w) => matchWalletIdentity(w, { uid, email }));
    if (identityIdx !== -1) {
      const migrated = sanitizeWallet({
        ...wallets[identityIdx],
        id,
        uid: uid || wallets[identityIdx]?.uid || null,
        email: email || wallets[identityIdx]?.email || null,
        tenantId: normalizeTenant(tenantId),
        role: normalizeRole(role || wallets[identityIdx]?.role),
      });
      wallets[identityIdx] = migrated;
      idx = identityIdx;
    }
  }

  if (idx === -1) {
    const created = initialize
      ? createInitialWallet({ uid, email, role, tenantId })
      : createEmptyWallet({ uid, email, role, tenantId });
    wallets.push(created);
    idx = wallets.length - 1;
  }
  const existing = sanitizeWallet({
    ...wallets[idx],
    id,
    uid: uid || wallets[idx]?.uid || null,
    email: email || wallets[idx]?.email || null,
    tenantId: normalizeTenant(tenantId),
    role: normalizeRole(role || wallets[idx]?.role),
  });
  wallets[idx] = existing;
  return { wallet: existing, index: idx, list: wallets };
}

function persistWallet(data, index, wallet) {
  const wallets = ensureWalletArray(data);
  wallets[index] = wallet;
  data.wallets = wallets;
  return wallet;
}

function applyCredit(wallet, amount, options = {}) {
  const value = round2(amount);
  if (!Number.isFinite(value) || value <= 0) {
    const err = new Error("Enter an amount greater than zero.");
    err.statusCode = 400;
    throw err;
  }
  const now = nowIso();
  const nextBalance = round2((wallet.balance || 0) + value);
  const tx = {
    id: uuid(),
    type: "credit",
    amount: value,
    description: typeof options.description === "string" && options.description.trim()
      ? options.description.trim()
      : "Voucher credit",
    reference: typeof options.reference === "string" ? options.reference : null,
    metadata: sanitizeMetadata(options.metadata),
    createdAt: now,
    balanceAfter: nextBalance,
  };
  const transactions = [tx, ...(wallet.transactions || [])].slice(0, MAX_TRANSACTIONS);
  const currentStart = Number.isFinite(wallet.startingBalance) ? wallet.startingBalance : 0;
  return {
    ...wallet,
    balance: nextBalance,
    startingBalance: currentStart > 0 ? currentStart : nextBalance,
    transactions,
    lastUpdated: now,
  };
}

function applyDebit(wallet, amount, options = {}) {
  const value = round2(amount);
  if (!Number.isFinite(value) || value <= 0) {
    const err = new Error("Enter an amount greater than zero.");
    err.statusCode = 400;
    throw err;
  }
  if (value > wallet.balance) {
    const err = new Error("Insufficient voucher balance.");
    err.statusCode = 400;
    throw err;
  }
  const now = nowIso();
  const nextBalance = round2(wallet.balance - value);
  const tx = {
    id: uuid(),
    type: "debit",
    amount: value,
    description: typeof options.description === "string" && options.description.trim()
      ? options.description.trim()
      : "Voucher redemption",
    reference: typeof options.reference === "string" ? options.reference : null,
    metadata: sanitizeMetadata(options.metadata),
    createdAt: now,
    balanceAfter: nextBalance,
  };
  const transactions = [tx, ...(wallet.transactions || [])].slice(0, MAX_TRANSACTIONS);
  return {
    ...wallet,
    balance: nextBalance,
    transactions,
    lastUpdated: now,
  };
}

function sendWalletResponse(res, { eligible, wallet }) {
  res.json({ eligible, wallet: wallet ? sanitizeWallet(wallet) : null });
}

router.get("/me", firebaseAuthRequired, (req, res) => {
  try {
    const { email, uid, role, tenantId } = resolveUserContext(req);
    const eligible = eligibleForWallet(role, tenantId);
    if (!eligible) return sendWalletResponse(res, { eligible: false, wallet: null });

    const id = walletId({ tenantId, uid, email });
    const snapshot = getData();
    const existingList = Array.isArray(snapshot?.wallets) ? snapshot.wallets : [];
    const existing = existingList.find((w) => w && w.id === id);
    if (existing) {
      return sendWalletResponse(res, { eligible: true, wallet: sanitizeWallet(existing) });
    }

    let createdWallet = null;
    saveData((draft) => {
      const { wallet, index } = ensureWallet(draft, { uid, email, role, tenantId }, { initialize: true });
      persistWallet(draft, index, wallet);
      createdWallet = wallet;
      return draft;
    });
    return sendWalletResponse(res, { eligible: true, wallet: createdWallet });
  } catch (e) {
    const status = e?.statusCode || 500;
    return res.status(status).json({ status: "error", message: e?.message || "Failed to load wallet" });
  }
});

router.post("/me/redeem", firebaseAuthRequired, (req, res) => {
  try {
    const { email, uid, role, tenantId } = resolveUserContext(req);
    console.log("[WALLET] Redeem request - User context:", { email, uid, role, tenantId });
    
    if (!eligibleForWallet(role, tenantId)) {
      console.log("[WALLET] User not eligible for wallet:", { role, tenantId });
      return res.status(403).json({ status: "error", message: "You are not eligible to use voucher credits." });
    }
    
    const amount = req.body?.amount;
    const options = {
      description: req.body?.description,
      reference: req.body?.reference,
      metadata: req.body?.metadata,
    };
    console.log("[WALLET] Redeem amount:", amount, "options:", options);

    let resultWallet = null;
    let transaction = null;
    
    saveData((draft) => {
      console.log("[WALLET] Before ensureWallet - wallets count:", draft.wallets?.length || 0);
      const { wallet, index } = ensureWallet(draft, { uid, email, role, tenantId });
      console.log("[WALLET] After ensureWallet - wallet index:", index, "wallet id:", wallet.id);
      
      const nextWallet = applyDebit(wallet, amount, options);
      transaction = nextWallet.transactions[0];
      console.log("[WALLET] After applyDebit - new balance:", nextWallet.balance, "transaction:", transaction?.id);
      
      persistWallet(draft, index, nextWallet);
      console.log("[WALLET] After persistWallet - wallets count:", draft.wallets?.length || 0);
      
      resultWallet = nextWallet;
      return draft;
    });

    console.log("[WALLET] Final result wallet balance:", resultWallet?.balance);
    return res.json({ ok: true, wallet: sanitizeWallet(resultWallet), transaction });
  } catch (e) {
    console.error("[WALLET] Redeem error:", e);
    const status = e?.statusCode || 500;
    return res.status(status).json({ status: "error", message: e?.message || "Failed to redeem credits" });
  }
});

router.post("/grant", firebaseAuthRequired, requireAdmin, (req, res) => {
  try {
    const targetEmail = normalizeEmail(req.body?.email || req.body?.targetEmail);
    const targetUid = typeof req.body?.uid === "string" && req.body.uid.trim() ? req.body.uid.trim() : null;
    const amount = req.body?.amount;
    const description = req.body?.description;
    const reference = req.body?.reference;
    const metadata = req.body?.metadata;
    const explicitTenant = req.body?.tenantId;
    const explicitRole = req.body?.role;

    if (!targetEmail && !targetUid) {
      return res.status(400).json({ status: "error", message: "Provide a target email or uid" });
    }

    const incomingData = getData();
    const record = findUserRecord(incomingData, { email: targetEmail, uid: targetUid }) || {};
    const role = normalizeRole(explicitRole || record.role || "member");
    const tenantId = normalizeTenant(explicitTenant || record.tenantId || req.tenant?.id);
    const email = targetEmail || normalizeEmail(record.email);
    const uid = targetUid || record.uid || email;

    let resultWallet = null;
    let transaction = null;
    saveData((draft) => {
      const { wallet, index } = ensureWallet(draft, { uid, email, role, tenantId }, { initialize: false });
      const nextWallet = applyCredit(wallet, amount, { description, reference, metadata });
      transaction = nextWallet.transactions[0];
      persistWallet(draft, index, nextWallet);
      resultWallet = nextWallet;
      return draft;
    });

    return res.json({ ok: true, wallet: sanitizeWallet(resultWallet), transaction });
  } catch (e) {
    const status = e?.statusCode || 500;
    return res.status(status).json({ status: "error", message: e?.message || "Failed to grant credits" });
  }
});

router.get("/admin/lookup", firebaseAuthRequired, requireAdmin, (req, res) => {
  try {
    const email = normalizeEmail(req.query?.email);
    const uid = typeof req.query?.uid === "string" && req.query.uid.trim() ? req.query.uid.trim() : null;
    if (!email && !uid) {
      return res.status(400).json({ status: "error", message: "Provide email or uid" });
    }
    const data = getData();
    const record = findUserRecord(data, { email, uid }) || {};
    const tenantId = normalizeTenant(record.tenantId || req.tenant?.id);
    const userUid = uid || record.uid || email;
    const role = normalizeRole(record.role);

    const wallets = ensureWalletArray(data);
    const id = walletId({ tenantId, uid: userUid, email: email || record.email });
    const existingIdx = wallets.findIndex((w) => w && w.id === id);
    const wallet = existingIdx >= 0 ? sanitizeWallet(wallets[existingIdx]) : null;

    return res.json({
      ok: true,
      wallet,
      context: {
        email: email || normalizeEmail(record.email),
        uid: userUid,
        tenantId,
        role,
      },
    });
  } catch (e) {
    const status = e?.statusCode || 500;
    return res.status(status).json({ status: "error", message: e?.message || "Failed to lookup wallet" });
  }
});

// GET /api/wallets/admin/transactions - Get all transactions across all wallets (admin only)
router.get("/admin/transactions", firebaseAuthRequired, requireAdmin, (req, res) => {
  try {
    const data = getData();
    const wallets = ensureWalletArray(data);
    const users = data.users || [];
    
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
          // Find user info
          const user = users.find(u => 
            u.email === wallet.email || 
            u.uid === wallet.uid ||
            normalizeEmail(u.email) === normalizeEmail(wallet.email)
          );
          
          allTransactions.push({
            ...transaction,
            userEmail: wallet.email || wallet.uid,
            userName: user?.name || user?.displayName,
            userRole: wallet.role,
            userTenant: wallet.tenantId,
            walletBalance: wallet.balance
          });
        });
      }
    });

    // Apply filters
    let filteredTransactions = allTransactions;

    if (userEmail) {
      const normalizedEmail = normalizeEmail(userEmail);
      filteredTransactions = filteredTransactions.filter(t => 
        normalizeEmail(t.userEmail).includes(normalizedEmail)
      );
    }

    if (type) {
      filteredTransactions = filteredTransactions.filter(t => t.type === type);
    }

    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      filteredTransactions = filteredTransactions.filter(t => 
        new Date(t.createdAt) >= fromDate
      );
    }

    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999); // End of day
      filteredTransactions = filteredTransactions.filter(t => 
        new Date(t.createdAt) <= toDate
      );
    }

    if (minAmount) {
      const min = Number(minAmount);
      if (Number.isFinite(min)) {
        filteredTransactions = filteredTransactions.filter(t => t.amount >= min);
      }
    }

    if (maxAmount) {
      const max = Number(maxAmount);
      if (Number.isFinite(max)) {
        filteredTransactions = filteredTransactions.filter(t => t.amount <= max);
      }
    }

    // Sort by creation date (newest first)
    filteredTransactions.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Calculate pagination
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(1000, Math.max(1, parseInt(limit) || 100));
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    
    const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);

    // Calculate summary stats
    const summary = {
      total: filteredTransactions.length,
      totalCredits: filteredTransactions
        .filter(t => t.type === 'credit')
        .reduce((sum, t) => sum + (t.amount || 0), 0),
      totalDebits: filteredTransactions
        .filter(t => t.type === 'debit')
        .reduce((sum, t) => sum + (t.amount || 0), 0),
      totalAdjustments: filteredTransactions
        .filter(t => t.type === 'adjustment')
        .reduce((sum, t) => sum + (t.amount || 0), 0),
      uniqueUsers: new Set(filteredTransactions.map(t => t.userEmail)).size,
      dateRange: {
        earliest: filteredTransactions.length > 0 ? 
          filteredTransactions[filteredTransactions.length - 1].createdAt : null,
        latest: filteredTransactions.length > 0 ? 
          filteredTransactions[0].createdAt : null
      }
    };

    res.json({
      ok: true,
      transactions: paginatedTransactions,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: filteredTransactions.length,
        pages: Math.ceil(filteredTransactions.length / limitNum),
        hasNext: endIndex < filteredTransactions.length,
        hasPrev: pageNum > 1
      },
      summary,
      filters: {
        userEmail: userEmail || null,
        type: type || null,
        dateFrom: dateFrom || null,
        dateTo: dateTo || null,
        minAmount: minAmount ? Number(minAmount) : null,
        maxAmount: maxAmount ? Number(maxAmount) : null
      }
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch transaction history"
    });
  }
});

// Debug endpoint to check wallet persistence (admin only)
router.get("/admin/debug/wallets", firebaseAuthRequired, requireAdmin, (req, res) => {
  try {
    const data = getData();
    const wallets = ensureWalletArray(data);
    return res.json({
      ok: true,
      walletsCount: wallets.length,
      firstWallet: wallets[0] || null,
      sampleWallets: wallets.slice(0, 3).map(w => ({
        email: w.email,
        balance: w.balance,
        transactionCount: w.transactions?.length || 0
      }))
    });
  } catch (e) {
    const status = e?.statusCode || 500;
    return res.status(status).json({ status: "error", message: e?.message || "Failed to debug wallets" });
  }
});

// Debug endpoint to list available routes
router.get("/admin/debug/routes", (req, res) => {
  try {
    const routes = [
      'GET /api/wallets',
      'GET /api/wallets/me',
      'POST /api/wallets/me/redeem',
      'POST /api/wallets/grant',
      'GET /api/wallets/admin/lookup',
      'GET /api/wallets/admin/transactions',
      'GET /api/wallets/admin/debug/wallets',
      'POST /api/wallets/admin/debug/test-create',
      'POST /api/wallets/admin/debug/test-transaction'
    ];
    
    return res.json({
      ok: true,
      availableRoutes: routes,
      serverTime: new Date().toISOString(),
      nodeEnv: process.env.NODE_ENV || 'development'
    });
  } catch (e) {
    return res.status(500).json({ status: "error", message: e?.message || "Failed to list routes" });
  }
});

// Debug endpoint to manually test wallet creation (admin only)
router.post("/admin/debug/test-create", firebaseAuthRequired, requireAdmin, (req, res) => {
  try {
    const { email, uid, role, tenantId } = req.body;
    if (!email && !uid) {
      return res.status(400).json({ status: "error", message: "Provide email or uid" });
    }

    let createdWallet = null;
    saveData((draft) => {
      const { wallet, index } = ensureWallet(draft, {
        uid: uid || email,
        email: normalizeEmail(email),
        role: normalizeRole(role || "member"),
        tenantId: normalizeTenant(tenantId || "public")
      }, { initialize: true });
      persistWallet(draft, index, wallet);
      createdWallet = wallet;
      return draft;
    });

    return res.json({
      ok: true,
      wallet: sanitizeWallet(createdWallet),
      message: "Test wallet created successfully"
    });
  } catch (e) {
    const status = e?.statusCode || 500;
    return res.status(status).json({ status: "error", message: e?.message || "Failed to create test wallet" });
  }
});

// Debug endpoint to manually test wallet transaction (admin only)
router.post("/admin/debug/test-transaction", firebaseAuthRequired, requireAdmin, (req, res) => {
  try {
    const { email, uid, amount, description } = req.body;
    if (!email && !uid) {
      return res.status(400).json({ status: "error", message: "Provide email or uid" });
    }

    const transactionAmount = Number(amount) || 100;
    let resultWallet = null;
    let transaction = null;

    saveData((draft) => {
      const { wallet, index } = ensureWallet(draft, {
        uid: uid || email,
        email: normalizeEmail(email),
        role: normalizeRole("member"),
        tenantId: normalizeTenant("public")
      }, { initialize: true });

      const nextWallet = applyDebit(wallet, transactionAmount, {
        description: description || "Test wallet debit transaction",
        reference: "debug-test"
      });
      
      transaction = nextWallet.transactions[0];
      persistWallet(draft, index, nextWallet);
      resultWallet = nextWallet;
      return draft;
    });

    return res.json({
      ok: true,
      wallet: sanitizeWallet(resultWallet),
      transaction,
      message: `Test transaction of ${transactionAmount} credits successfully processed`
    });
  } catch (e) {
    const status = e?.statusCode || 500;
    return res.status(status).json({ status: "error", message: e?.message || "Failed to process test transaction" });
  }
});

export default router;
