import admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
    }),
  });
}

export async function firebaseAuthRequired(req, res, next) {
  const h = req.header("Authorization") || "";
  const m = h.match(/^Bearer (.+)$/);
  if (!m) return res.status(401).json({ status: "error", message: "Missing bearer token" });
  try {
    const decoded = await admin.auth().verifyIdToken(m[1]);
    req.user = { uid: decoded.uid, email: decoded.email, roles: decoded.roles || [] };
    next();
  } catch (e) {
    return res.status(401).json({ status: "error", message: "Invalid or expired token" });
  }
}
