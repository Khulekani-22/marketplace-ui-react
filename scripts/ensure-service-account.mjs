import { promises as fs } from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();
const destination = path.join(projectRoot, 'serviceAccountKey.json');

async function writeIfChanged(curr) {
  try {
    const existing = await fs.readFile(destination, 'utf8');
    if (existing.trim() === curr.trim()) return false;
  } catch {
    /* file missing */
  }
  await fs.writeFile(destination, curr, { encoding: 'utf8', mode: 0o600 });
  return true;
}

async function ensureServiceAccount() {
  const jsonBlob = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (jsonBlob) {
    try {
      const parsed = JSON.parse(jsonBlob);
      const normalized = JSON.stringify(parsed, null, 2);
      const updated = await writeIfChanged(normalized + '\n');
      if (updated) {
        console.log('[ensure-service-account] Wrote serviceAccountKey.json from FIREBASE_SERVICE_ACCOUNT_JSON');
      }
      return;
    } catch (error) {
      console.error('[ensure-service-account] FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON');
      throw error;
    }
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;
  if (projectId && clientEmail && privateKeyRaw) {
    const privateKey = privateKeyRaw.replace(/\\n/g, '\n');
    const payload = {
      type: 'service_account',
      project_id: projectId,
      client_email: clientEmail,
      private_key: privateKey,
      token_uri: 'https://oauth2.googleapis.com/token',
    };
    const normalized = JSON.stringify(payload, null, 2);
    const updated = await writeIfChanged(normalized + '\n');
    if (updated) {
      console.log('[ensure-service-account] Wrote serviceAccountKey.json from FIREBASE_* env vars');
    }
    return;
  }

  // nothing to do; keep any existing file for local dev
}

ensureServiceAccount().catch((error) => {
  console.error('[ensure-service-account] Failed to prepare service account file:', error);
  process.exit(1);
});
