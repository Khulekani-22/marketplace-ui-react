import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadServiceAccount() {
  const envBased = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
  };
  if (envBased.projectId && envBased.clientEmail && envBased.privateKey) {
    return envBased;
  }
  // Fallback: use local serviceAccountKey.json for local dev
  const p = process.env.FIREBASE_SA_PATH || path.resolve(__dirname, "../../serviceAccountKey.json");
  if (fs.existsSync(p)) {
    try {
      const txt = fs.readFileSync(p, "utf8");
      const json = JSON.parse(txt);
      return {
        projectId: json.project_id,
        clientEmail: json.client_email,
        privateKey: json.private_key,
      };
    } catch {
      // ignore, will return null
    }
  }
  return null;
}

if (!admin.apps.length) {
  const sa = loadServiceAccount();
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
    req.user = { uid: decoded.uid, email: decoded.email, roles: decoded.roles || [] };
    console.log('🔑 Firebase Auth Success:', { uid: decoded.uid, email: decoded.email });
    next();
  } catch (e) {
    console.log('🔑 Firebase Auth Failed:', e.message);
    return res.status(401).json({ status: "error", message: "Invalid or expired token" });
  }
}
