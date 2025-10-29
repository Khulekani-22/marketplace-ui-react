import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let cachedServiceAccount = undefined;

function parseJsonCandidate(candidate) {
  if (!candidate) return null;

  try {
    return JSON.parse(candidate);
  } catch (error) {
    // If it looks like base64, try decoding and parsing again
    try {
      const decoded = Buffer.from(candidate, "base64").toString("utf8");
      return JSON.parse(decoded);
    } catch {
      return null;
    }
  }
}

function normalizePrivateKey(privateKey = "") {
  if (!privateKey) return privateKey;
  return privateKey.replace(/\\n/g, "\n");
}

export function loadFirebaseServiceAccount(options = {}) {
  if (cachedServiceAccount !== undefined && options.force !== true) {
    return cachedServiceAccount;
  }

  const envJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (envJson) {
    const parsed = parseJsonCandidate(envJson);
    if (parsed && typeof parsed === "object") {
      cachedServiceAccount = {
        projectId: parsed.project_id || parsed.projectId,
        clientEmail: parsed.client_email || parsed.clientEmail,
        privateKey: normalizePrivateKey(parsed.private_key || parsed.privateKey || ""),
        raw: parsed,
      };
      return cachedServiceAccount;
    }

    console.warn("[firestore] FIREBASE_SERVICE_ACCOUNT env var present but not valid JSON/base64. Falling back to alternate secrets.");
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY || "");

  if (projectId && clientEmail && privateKey) {
    cachedServiceAccount = {
      projectId,
      clientEmail,
      privateKey,
    };
    return cachedServiceAccount;
  }

  const candidatePath = options.serviceAccountPath || process.env.FIREBASE_SA_PATH || path.resolve(__dirname, "../../serviceAccountKey.json");
  if (candidatePath && fs.existsSync(candidatePath)) {
    try {
      const json = JSON.parse(fs.readFileSync(candidatePath, "utf8"));
      cachedServiceAccount = {
        projectId: json.project_id || json.projectId,
        clientEmail: json.client_email || json.clientEmail,
        privateKey: normalizePrivateKey(json.private_key || json.privateKey || ""),
        raw: json,
      };
      return cachedServiceAccount;
    } catch (error) {
      throw new Error(`Unable to read Firebase service account from ${candidatePath}: ${error.message}`);
    }
  }

  cachedServiceAccount = null;
  return cachedServiceAccount;
}
