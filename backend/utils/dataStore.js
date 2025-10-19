import fs from "fs";
import path from "path";
import dotenv from "dotenv";
dotenv.config();
import { firestore } from "../services/firestore.js";

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

const APPDATA_COLLECTION = "appData";
const APPDATA_DOC = "singleton";

// Loads the app data from Firestore
async function load() {
  const doc = await firestore.collection(APPDATA_COLLECTION).doc(APPDATA_DOC).get();
  if (!doc.exists) {
    return {};
  }
  return doc.data();
}

// Persists the app data to Firestore

async function persist(data) {
  await firestore.collection(APPDATA_COLLECTION).doc(APPDATA_DOC).set(data);
}

export { load, persist };

// getDataSync is now async, but kept for compatibility
export async function getDataSync(forceReload = false) {
  // forceReload is ignored; Firestore always loads fresh
  return await load();
}

export async function saveData(mutatorFn) {
  // Try to import and use hybrid data store
  try {
    const { getData: getHybridData, saveData: saveHybridData } = await import('./hybridDataStore.js');
    const data = await getHybridData();
    const updated = mutatorFn(structuredClone(data));
    await saveHybridData(updated);
    return updated;
  } catch (error) {
    console.warn('[dataStore] Hybrid store unavailable, using file fallback:', error.message);
    // Fallback to original file-based implementation
    const data = load();
    const updated = mutatorFn(structuredClone(data));
    persist(updated);
    return updated;
  }
}

// Keep the original sync version for backward compatibility
export function saveDataSync(mutatorFn) {
  const data = load();
  const updated = mutatorFn(structuredClone(data));
  persist(updated);
  return updated;
}
