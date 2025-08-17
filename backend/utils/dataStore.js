import fs from "fs";
import path from "path";
import dotenv from "dotenv";
dotenv.config();

const appDataPath = path.resolve(process.cwd(), "backend", process.env.APP_DATA_PATH || "../src/data/appData.json");

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
  fs.writeFileSync(appDataPath + ".tmp", text);
  fs.renameSync(appDataPath + ".tmp", appDataPath);
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
