import fs from "fs";
import path from "path";
import dotenv from "dotenv";
dotenv.config();

// Import both data stores
import { getData as getFirestoreData, saveData as saveFirestoreData } from './firestoreDataStore.js';

function resolveAppDataPath() {
  const envPath = process.env.APP_DATA_PATH;
  if (envPath) return path.resolve(envPath);

  const cwd = process.cwd();
  const candidates = [
    // Prefer backend/appData.json next to server.js
    path.resolve(cwd, "backend", "appData.json"),
    // If started from project root and storing in src/data
    path.resolve(cwd, "src", "data", "appData.json"),
    // If started from backend/ working dir, hop up one and into src/data
    path.resolve(cwd, "../src/data/appData.json"),
  ];
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) return p;
    } catch {}
  }
  // Default to backend/appData.json (will throw if missing; caller can create)
  return path.resolve(cwd, "backend", "appData.json");
}

const appDataPath = resolveAppDataPath();

function resolveSrcFallbackPath() {
  const cwd = process.cwd();
  const candidates = [
    path.resolve(cwd, "src", "data", "appData.json"),
    path.resolve(cwd, "../src/data/appData.json"),
  ];
  for (const p of candidates) {
    try { if (fs.existsSync(path.dirname(p))) return p; } catch {}
  }
  return null;
}
const srcFallbackPath = resolveSrcFallbackPath();

// Basic file-based datastore with in-memory caching + atomic writes
let cache = null;
let lastLoaded = 0;
const TTL_MS = 1000; // 1s cache

// Configuration to enable/disable Firestore
const USE_FIRESTORE = process.env.USE_FIRESTORE !== 'false'; // Default to true
const FIRESTORE_FALLBACK = process.env.FIRESTORE_FALLBACK !== 'false'; // Default to true

function loadFromFile() {
  const now = Date.now();
  if (cache && now - lastLoaded < TTL_MS) return cache;
  try {
    const text = fs.readFileSync(appDataPath, "utf-8");
    cache = JSON.parse(text);
    lastLoaded = now;
    return cache;
  } catch (e) {
    // Fallback to src/data/appData.json if backend file is missing or invalid
    try {
      if (srcFallbackPath && fs.existsSync(srcFallbackPath)) {
        const text2 = fs.readFileSync(srcFallbackPath, "utf-8");
        const json2 = JSON.parse(text2);
        cache = json2;
        lastLoaded = now;
        console.warn("[dataStore] Falling back to src/data/appData.json due to backend appData.json error");
        return cache;
      }
    } catch (e2) {
      // If fallback also fails, rethrow original error to surface the problem
    }
    throw e;
  }
}

function persistToFile(data) {
  const text = JSON.stringify(data, null, 2);
  // Write canonical (backend) atomically
  fs.writeFileSync(appDataPath + ".tmp", text);
  fs.renameSync(appDataPath + ".tmp", appDataPath);
  // Replicate to src fallback if configured and not same file
  try {
    if (srcFallbackPath && path.resolve(srcFallbackPath) !== path.resolve(appDataPath)) {
      fs.writeFileSync(srcFallbackPath + ".tmp", text);
      fs.renameSync(srcFallbackPath + ".tmp", srcFallbackPath);
    }
  } catch (e) {
    // non-fatal replication failure
    console.warn("[dataStore] replicate to src failed:", e?.message || e);
  }
  cache = data;
  lastLoaded = Date.now();
}

/**
 * Hybrid getData function that tries Firestore first, then falls back to file
 */
export async function getData(forceReload = false) {
  try {
    // Try Firestore first if enabled
    if (USE_FIRESTORE) {
      console.log('[dataStore] Attempting to load from Firestore...');
      const firestoreData = await getFirestoreData(forceReload);
      console.log('[dataStore] ✅ Successfully loaded from Firestore');
      return firestoreData;
    }
  } catch (error) {
    console.warn('[dataStore] ⚠️  Firestore failed:', error.message);
    
    // If Firestore is enabled but failed, and fallback is disabled, throw
    if (USE_FIRESTORE && !FIRESTORE_FALLBACK) {
      throw error;
    }
  }

  // Fall back to file system
  console.log('[dataStore] Loading from file system...');
  if (forceReload) {
    cache = null;
    lastLoaded = 0;
  }
  return loadFromFile();
}

/**
 * Hybrid saveData function that tries Firestore first, then falls back to file
 */
export async function saveData(data) {
  let firestoreSuccess = false;

  try {
    // Try Firestore first if enabled
    if (USE_FIRESTORE) {
      console.log('[dataStore] Attempting to save to Firestore...');
      await saveFirestoreData(data);
      console.log('[dataStore] ✅ Successfully saved to Firestore');
      firestoreSuccess = true;
    }
  } catch (error) {
    console.warn('[dataStore] ⚠️  Firestore save failed:', error.message);
    
    // If Firestore is enabled but failed, and fallback is disabled, throw
    if (USE_FIRESTORE && !FIRESTORE_FALLBACK) {
      throw error;
    }
  }

  // Always save to file as backup, or as primary if Firestore failed
  console.log('[dataStore] Saving to file system...');
  persistToFile(data);
  
  if (firestoreSuccess) {
    console.log('[dataStore] ✅ Data saved to both Firestore and file');
  } else {
    console.log('[dataStore] ✅ Data saved to file system');
  }
}

// Export the old sync version for backward compatibility
// This will use the cached version or load synchronously from file
export function getDataSync(forceReload = false) {
  if (forceReload) {
    cache = null;
    lastLoaded = 0;
  }
  return loadFromFile();
}

export function saveDataSync(data) {
  persistToFile(data);
}

// Configuration helpers
export function isFirestoreEnabled() {
  return USE_FIRESTORE;
}

export function enableFirestore(enable = true) {
  process.env.USE_FIRESTORE = enable ? 'true' : 'false';
}

export function enableFallback(enable = true) {
  process.env.FIRESTORE_FALLBACK = enable ? 'true' : 'false';
}