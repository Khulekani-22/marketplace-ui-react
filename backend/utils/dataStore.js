import fs from "fs";
import path from "path";
import dotenv from "dotenv";
dotenv.config();

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

function load() {
  const now = Date.now();
  if (cache && now - lastLoaded < TTL_MS) return cache;
  const text = fs.readFileSync(appDataPath, "utf-8");
  cache = JSON.parse(text);
  lastLoaded = now;
  return cache;
}

function persist(data) {
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

export function getData() {
  return load(); // { services:[], vendors:[], tenants:[], ... }
}

export function saveData(mutatorFn) {
  const data = load();
  const updated = mutatorFn(structuredClone(data));
  persist(updated);
  return updated;
}
