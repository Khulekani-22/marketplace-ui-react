import admin from "firebase-admin";
import { loadFirebaseServiceAccount } from "../utils/loadFirebaseServiceAccount.js";

if (!admin.apps.length) {
  const sa = loadFirebaseServiceAccount();
  if (sa) {
    admin.initializeApp({ credential: admin.credential.cert(sa) });
  } else {
    // As a last resort, initialize without credentials to avoid crash in dev
    // Note: verifyIdToken will fail; routes using firebaseAuthRequired will 401
    admin.initializeApp();
  }
}

export async function firebaseAuthRequired(req, res, next) {
  const h = req.header("Authorization") || "";
  const m = h.match(/^Bearer (.+)$/);
  console.log('🔑 Firebase Auth Check:', { 
    path: req.path, 
    method: req.method, 
    hasAuth: !!h, 
    tokenLength: m ? m[1].length : 0 
  });
  if (!m) return res.status(401).json({ status: "error", message: "Missing bearer token" });
  try {
    const decoded = await admin.auth().verifyIdToken(m[1]);
    // Attach basic user info
    req.user = { uid: decoded.uid, email: decoded.email, roles: decoded.roles || [] };
    // Restore admin/role info from database
    try {
      const { getData } = await import("../utils/hybridDataStore.js");
      const data = await getData();
      const users = Array.isArray(data.users) ? data.users : [];
      const email = (decoded.email || "").toLowerCase();
      const found = users.find(u => (u.email || "").toLowerCase() === email);
      if (found) {
        req.user.role = found.role || "member";
        if (req.user.role === "admin") req.user.isAdmin = true;
        if (found.claims && typeof found.claims === "object") req.user.claims = found.claims;
      }
    } catch (e2) {
      console.warn("[firebaseAuthRequired] Could not restore admin/role info:", e2.message);
    }
    console.log('🔑 Firebase Auth Success:', { uid: decoded.uid, email: decoded.email, role: req.user.role, isAdmin: req.user.isAdmin });
    next();
  } catch (e) {
    console.log('🔑 Firebase Auth Failed:', e.message);
    return res.status(401).json({ status: "error", message: "Invalid or expired token" });
  }
}
