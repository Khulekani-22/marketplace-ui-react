// backend/routes/admin.js
import { Router } from "express";
import { v4 as uuid } from "uuid";
import { getData, saveData } from "../utils/dataStore.js";
import { firebaseAuthRequired } from "../middleware/authFirebase.js";
import { requireAdmin } from "../middleware/isAdmin.js";
import admin from "firebase-admin";

const router = Router();

// Middleware to ensure admin access
router.use(firebaseAuthRequired);
router.use(requireAdmin);

/**
 * POST /api/admin/wallet/add-credits
 * Add credits to a specific user's wallet
 */
router.post("/wallet/add-credits", async (req, res, next) => {
  try {
    const { userId, userEmail, amount, description, type = "admin_allocation" } = req.body;
    const adminEmail = req.user?.email;
    const tenantId = req.tenant?.id || "public";

    // Validate input
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

    // Create transaction record
    const transaction = {
      id: uuid(),
      userId,
      userEmail,
      type: "credit",
      subType: type,
      amount: creditAmount,
      description,
      adminEmail,
      tenantId,
      createdAt: new Date().toISOString()
    };

    // Update wallet and save transaction
    const result = saveData((data) => {
      // Initialize wallets array if it doesn't exist
      if (!Array.isArray(data.wallets)) {
        data.wallets = [];
      }

      // Initialize wallet transactions array if it doesn't exist
      if (!Array.isArray(data.walletTransactions)) {
        data.walletTransactions = [];
      }

      // Find or create user wallet
      let wallet = data.wallets.find(w => w.userId === userId);
      if (!wallet) {
        wallet = {
          userId,
          userEmail,
          balance: 0,
          tenantId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        data.wallets.push(wallet);
      }

      // Update wallet balance
      wallet.balance = (wallet.balance || 0) + creditAmount;
      wallet.updatedAt = new Date().toISOString();

      // Add transaction record
      data.walletTransactions.push(transaction);

      return data;
    });

    // Log the action for audit
    console.log(`💰 Admin ${adminEmail} added ${creditAmount} credits to ${userEmail} (${description})`);

    res.status(201).json({
      status: "success",
      message: `Successfully added ${creditAmount} credits to ${userEmail}`,
      transaction
    });

  } catch (error) {
    console.error("Error adding wallet credits:", error);
    next(error);
  }
});

/**
 * POST /api/admin/wallet/bulk-credits
 * Add credits to multiple users' wallets
 */
router.post("/wallet/bulk-credits", async (req, res, next) => {
  try {
    const { userIds, amount, description, type = "bulk_admin_allocation" } = req.body;
    const adminEmail = req.user?.email;
    const tenantId = req.tenant?.id || "public";

    // Validate input
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "userIds must be a non-empty array",
      });
    }

    if (!amount || !description) {
      return res.status(400).json({ status: "error", message: "Missing required fields: amount, description" });
    }

    const creditAmount = parseFloat(amount);
    if (isNaN(creditAmount) || creditAmount <= 0) {
      return res.status(400).json({ status: "error", message: "Amount must be a positive number" });
    }

    // Get composite eligible user data to validate userIds
    const data = getData();
    const eligible = collectEligibleUsers(data);
    const validUserIds = userIds.filter((id) => eligible.some((u) => u.id === id || u.uid === id));

    if (validUserIds.length === 0) {
      return res.status(400).json({ status: "error", message: "No valid user IDs found" });
    }

    const transactions = [];
    const bulkId = uuid(); // Group transactions with same bulk ID

    // Process bulk credit allocation
    saveData((data) => {
      if (!Array.isArray(data.wallets)) data.wallets = [];
      if (!Array.isArray(data.walletTransactions)) data.walletTransactions = [];

      validUserIds.forEach((userId) => {
        const user = eligible.find((u) => u.id === userId || u.uid === userId) || {};
        const userEmail = user.email || `user-${userId}`;

        const transaction = {
          id: uuid(),
          bulkId,
          userId,
          userEmail,
          type: "credit",
          subType: type,
          amount: creditAmount,
          description: `${description} (Bulk allocation)`,
          adminEmail,
          tenantId,
          createdAt: new Date().toISOString(),
        };

        let wallet = data.wallets.find((w) => w.userId === userId);
        if (!wallet) {
          wallet = {
            userId,
            userEmail,
            balance: 0,
            tenantId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          data.wallets.push(wallet);
        }
        wallet.balance = (wallet.balance || 0) + creditAmount;
        wallet.updatedAt = new Date().toISOString();

        data.walletTransactions.push(transaction);
        transactions.push(transaction);
      });

      return data;
    });

    console.log(`💰 Admin ${adminEmail} bulk added ${creditAmount} credits to ${validUserIds.length} users (${description})`);

    res.status(201).json({
      status: "success",
      message: `Successfully added ${creditAmount} credits to ${validUserIds.length} users`,
      bulkId,
      transactions,
      processedCount: validUserIds.length,
      skippedCount: userIds.length - validUserIds.length,
    });
  } catch (error) {
    console.error("Error with bulk wallet credits:", error);
    next(error);
  }
});

/**
 * GET /api/admin/wallet/transactions
 * Get wallet transaction history (admin view)
 */
router.get("/wallet/transactions", (req, res) => {
  try {
    const { userId, limit = 100, offset = 0 } = req.query;
    const data = getData();
    const transactions = Array.isArray(data.walletTransactions) ? data.walletTransactions : [];

    let filtered = transactions;

    // Filter by user if specified
    if (userId) {
      filtered = filtered.filter(t => t.userId === userId);
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Apply pagination
    const start = parseInt(offset);
    const end = start + parseInt(limit);
    const paginatedTransactions = filtered.slice(start, end);

    res.json({
      status: "success",
      transactions: paginatedTransactions,
      total: filtered.length,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

  } catch (error) {
    console.error("Error getting wallet transactions:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to retrieve wallet transactions"
    });
  }
});

/**
 * GET /api/admin/wallet/summary
 * Get wallet summary statistics for admin dashboard
 */
router.get("/wallet/summary", (req, res) => {
  try {
    const data = getData();
    const wallets = Array.isArray(data.wallets) ? data.wallets : [];
    const transactions = Array.isArray(data.walletTransactions) ? data.walletTransactions : [];

    const summary = {
      totalUsers: wallets.length,
      totalCreditsAllocated: wallets.reduce((sum, w) => sum + (w.balance || 0), 0),
      usersWithCredits: wallets.filter(w => (w.balance || 0) > 0).length,
      usersWithoutCredits: wallets.filter(w => (w.balance || 0) === 0).length,
      totalTransactions: transactions.length,
      creditsAllocatedToday: transactions
        .filter(t => {
          const today = new Date().toISOString().split('T')[0];
          const transactionDate = t.createdAt.split('T')[0];
          return transactionDate === today && t.type === "credit";
        })
        .reduce((sum, t) => sum + (t.amount || 0), 0),
      recentTransactions: transactions
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10)
    };

    res.json({
      status: "success",
      summary
    });

  } catch (error) {
    console.error("Error getting wallet summary:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to retrieve wallet summary"
    });
  }
});

/**
 * Get users with their wallet information
 * GET /api/admin/wallet/users
 */
router.get("/wallet/users", (req, res) => {
  try {
    const data = getData();
    const wallets = Array.isArray(data.wallets) ? data.wallets : [];

    // Build composite eligible user list
    const baseUsers = collectEligibleUsers(data);

    const usersWithWallets = baseUsers.map((user) => {
      const wallet = wallets.find((w) => w.userId === user.id || w.userId === user.uid || w.userEmail === user.email);
      return {
        id: user.id,
        uid: user.uid,
        name: user.name,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
        walletBalance: wallet ? Number(wallet.balance || 0) : 0,
        lastActivity: user.lastLoginAt || user.updatedAt || user.lastUpdated || user.createdAt || new Date().toISOString(),
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || user.email)}&background=7c3aed&color=fff`,
      };
    });

    usersWithWallets.sort((a, b) => (b.walletBalance !== a.walletBalance ? b.walletBalance - a.walletBalance : a.name.localeCompare(b.name)));

    res.json({
      status: "success",
      users: usersWithWallets,
      summary: {
        totalUsers: usersWithWallets.length,
        usersWithCredits: usersWithWallets.filter((u) => u.walletBalance > 0).length,
        totalCreditsAllocated: usersWithWallets.reduce((sum, u) => sum + (Number(u.walletBalance) || 0), 0),
      },
    });
  } catch (error) {
    console.error("Error getting users with wallets:", error);
    res.status(500).json({ status: "error", message: "Failed to retrieve users with wallet information" });
  }
});

/**
 * POST /api/admin/wallet/normalize-appdata
 * Normalize appData so vendor/startup owners are represented in data.users and wallets link by ownerUid
 */
router.post("/wallet/normalize-appdata", async (req, res, next) => {
  try {
    const result = saveData((data) => {
      data.users = Array.isArray(data.users) ? data.users : [];
      data.vendors = Array.isArray(data.vendors) ? data.vendors : [];
      data.startups = Array.isArray(data.startups) ? data.startups : [];
      data.wallets = Array.isArray(data.wallets) ? data.wallets : [];

      const byUid = new Map();
      const byEmail = new Map();
      // seed existing users
      for (const u of data.users) {
        const uid = (u.uid || u.id || "").toString();
        const email = (u.email || "").toLowerCase();
        if (uid) byUid.set(uid, u);
        if (email) byEmail.set(email, u);
      }

      function upsertUser({ uid, email, name, role, tenantId }) {
        const keyUser = (uid && byUid.get(uid)) || (email && byEmail.get(email)) || null;
        const id = uid || email || name || "";
        const patch = {
          id: keyUser?.id || id,
          uid: uid || keyUser?.uid || null,
          email: email || keyUser?.email || null,
          displayName: name || keyUser?.displayName || null,
          role: (role || keyUser?.role || "member").toLowerCase(),
          tenantId: (tenantId || keyUser?.tenantId || "vendor").toLowerCase(),
        };
        if (keyUser) {
          Object.assign(keyUser, patch);
          return keyUser;
        }
        data.users.push(patch);
        if (patch.uid) byUid.set(patch.uid, patch);
        if (patch.email) byEmail.set(patch.email, patch);
        return patch;
      }

      // Vendors -> vendor role, tenant = vendor (unless specified)
      for (const v of data.vendors) {
        const uid = v.ownerUid || null;
        const email = (v.contactEmail || v.email || "").toLowerCase();
        const name = v.name || v.companyName || email.split("@")[0] || "";
        const tenant = (v.tenantId || v.raw?.tenantId || "vendor").toLowerCase();
        upsertUser({ uid, email, name, role: "vendor", tenantId: tenant === "public" ? "vendor" : tenant });
      }

      // Startups -> startup role, tenant = basic (unless specified)
      for (const s of data.startups) {
        const uid = s.ownerUid || s.uid || null;
        const email = (s.contactEmail || s.email || "").toLowerCase();
        const name = s.name || s.companyName || email.split("@")[0] || "";
        const tenant = (s.tenantId || "basic").toLowerCase();
        upsertUser({ uid, email, name, role: "startup", tenantId: tenant });
      }

      // Align wallets: prefer ownerUid (user.uid) as userId; fallback to email
      for (const w of data.wallets) {
        const byId = w.userId ? byUid.get(String(w.userId)) : null;
        if (byId) continue; // already good
        const email = (w.userEmail || "").toLowerCase();
        const user = (email && byEmail.get(email)) || null;
        if (user && user.uid) {
          w.userId = user.uid; // align to uid
          w.userEmail = user.email || w.userEmail || null;
        } else if (user) {
          w.userId = user.id || w.userId; // use id/email if no uid
          w.userEmail = user.email || w.userEmail || null;
        }
      }

      return data;
    });

    res.json({ ok: true, users: (result.users || []).length, wallets: (result.wallets || []).length });
  } catch (error) {
    console.error("normalize-appdata failed:", error);
    next(error);
  }
});

/**
 * POST /api/admin/wallet/sync-firebase-users
 * Sync Firebase Auth users into appData.users so admins can allocate credits.
 * Promotes specific emails to vendor role by default.
 */
router.post("/wallet/sync-firebase-users", async (req, res, next) => {
  try {
    const promote = new Set(
      (Array.isArray(req.body?.promoteVendors) ? req.body.promoteVendors : [
        "mncubekhulekani@gmail.com",
        "ruthmaphosa2024@gmail.com",
        "zinhlesloane@gmail.com",
        "khulekani@gecafrica.co",
        "22onsloanedigitalteam@gmail.com",
        "khulekani@22onsloane.co",
      ]).map((e) => String(e || "").toLowerCase())
    );
    const defaultRole = String(req.body?.defaultRole || "member").toLowerCase();
    const defaultTenant = String(req.body?.defaultTenant || "vendor").toLowerCase();

    // Fetch all Firebase users (paged)
    const collected = [];
    let pageToken = undefined;
    do {
      const resp = await admin.auth().listUsers(1000, pageToken);
      for (const u of resp.users || []) {
        collected.push({ uid: u.uid, email: (u.email || "").toLowerCase(), displayName: u.displayName || "" });
      }
      pageToken = resp.pageToken;
    } while (pageToken);

    const updated = saveData((data) => {
      const list = Array.isArray(data.users) ? data.users : [];
      const byEmail = new Map(list.map((u) => [String((u.email || "").toLowerCase()), u]));

      for (const u of collected) {
        if (!u.email) continue;
        const existing = byEmail.get(u.email);
        const role = promote.has(u.email) ? "vendor" : (existing?.role || defaultRole);
        const tenantId = promote.has(u.email) ? "vendor" : (existing?.tenantId || defaultTenant);
        const payload = { email: u.email, uid: u.uid, role, tenantId };
        if (existing) {
          Object.assign(existing, payload);
        } else {
          list.push(payload);
          byEmail.set(u.email, payload);
        }
      }

      data.users = list;
      return data;
    });

    res.json({ ok: true, users: updated.users?.length || 0, synced: collected.length });
  } catch (error) {
    console.error("sync-firebase-users failed:", error);
    next(error);
  }
});

/**
 * Collect eligible users from appData.json (users, vendors, startups)
 */
const normalize = (v) => (v || "").toString().trim();
const normLower = (v) => normalize(v).toLowerCase();

function collectEligibleUsers(data) {
  const list = [];
  const seen = new Set(); // dedupe by email or id

  function push(u) {
    const id = normalize(u.id || u.uid || u.email || "");
    const email = normLower(u.email || u.contactEmail || "");
    const key = id || email;
    if (!key) return;
    if (seen.has(key)) return;
    seen.add(key);
    const name =
      u.displayName ||
      u.name ||
      u.companyName ||
      u.raw?.name ||
      (email ? email.split("@")[0] : "") ||
      "Unknown User";
    const role = normLower(u.role || (u.vendorId || u.companyName ? "vendor" : "member") || "member");
    const tRaw = normLower(u.tenantId || u.raw?.tenantId || "");
    const tenantId = tRaw && tRaw !== "public" ? tRaw : "vendor"; // align with wallet eligibility
    list.push({ id, uid: u.uid || u.ownerUid || null, email, name, role, tenantId });
  }

  // Top-level users
  if (Array.isArray(data.users)) {
    data.users.forEach((u) => push(u || {}));
  }
  // Vendors -> treat owner as eligible vendor user
  if (Array.isArray(data.vendors)) {
    data.vendors.forEach((v) =>
      push({
        id: v.ownerUid || v.id || v.contactEmail,
        uid: v.ownerUid,
        email: v.contactEmail || v.email,
        name: v.name || v.companyName,
        role: "vendor",
        tenantId: v.tenantId || v.raw?.tenantId || "vendor",
      })
    );
  }
  // Startups (legacy) -> treat as member/basic
  if (Array.isArray(data.startups)) {
    data.startups.forEach((s) =>
      push({
        id: s.ownerUid || s.uid || s.id || s.email,
        uid: s.ownerUid || s.uid,
        email: s.contactEmail || s.email,
        name: s.name || s.companyName || s.displayName,
        role: s.role || "startup",
        tenantId: s.tenantId || "basic",
      })
    );
  }

  return list;
}

export default router;
