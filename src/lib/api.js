// src/lib/api.js
import axios from "axios";
import { auth } from "./firebase";

// Prefer port 5000; if unreachable, automatically fall back to 5001.
function computeApiBases() {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) return [envUrl];
  const host = typeof window !== "undefined" ? window.location.hostname : "localhost";
  const protocol = typeof window !== "undefined" ? window.location.protocol : "http:";
  const make = (port) => `${protocol}//${host}:${port}`;
  // Prefer typical backend ports first: 5000, then 5001, 5500; include 5055 as a legacy fallback
  return [make(5000), make(5001), make(5500), make(5055)];
}

const CANDIDATES = computeApiBases();
let candidateIndex = 0;
let currentBase = CANDIDATES[candidateIndex];

export const api = axios.create({ baseURL: currentBase });

function mapTenantOut(id) {
  return id === "vendor" ? "public" : id;
}

function shimTenantInPayload(payload) {
  if (!payload || typeof payload !== "object") return payload;
  try {
    if (typeof payload.tenantId === "string") payload.tenantId = mapTenantOut(payload.tenantId);
    if (typeof payload.newTenantId === "string") payload.newTenantId = mapTenantOut(payload.newTenantId);
  } catch {}
  return payload;
}

api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    // use a fresh token each request; SDK refreshes under the hood
    const tok = await user.getIdToken();
    config.headers.Authorization = `Bearer ${tok}`;
  }
  const tenantId = sessionStorage.getItem("tenantId") || "vendor";
  // Always ensure the backend receives legacy-compatible tenant id
  const headerTenant = config.headers["x-tenant-id"] || tenantId;
  config.headers["x-tenant-id"] = mapTenantOut(headerTenant);

  // Shim common payload shapes that include tenant identifiers
  if (config.data && typeof config.data === "object") config.data = shimTenantInPayload(config.data);
  if (config.params && typeof config.params === "object") config.params = shimTenantInPayload(config.params);
  return config;
});

api.interceptors.response.use(null, async (error) => {
  const original = error.config || {};

  // Handle auth refresh
  if (error.response?.status === 401 && !original._retriedAuth) {
    original._retriedAuth = true;
    await auth.currentUser?.getIdToken(true);
    return api(original);
  }

  // Fallback policy: only on network errors or 5xx (not on 4xx other than 401 handled above)
  const status = error.response?.status;
  const isNetworkError = !error.response || error.code === "ERR_NETWORK";
  const isServerError = typeof status === 'number' && status >= 500;
  const shouldFallback = isNetworkError || isServerError;
  if (shouldFallback && CANDIDATES.length > 1) {
    const attempts = Number(original._switchAttempts || 0);
    if (attempts < CANDIDATES.length - 1) {
      original._switchAttempts = attempts + 1;
      const nextIndex = Math.min(candidateIndex + 1, CANDIDATES.length - 1);
      const nextBase = CANDIDATES[nextIndex];
      candidateIndex = nextIndex;
      currentBase = nextBase;
      api.defaults.baseURL = nextBase;
      original.baseURL = nextBase;
      return api(original);
    }
    // Exhausted fallbacks: reset to first candidate and try once
    if (!original._resetOnce) {
      original._resetOnce = true;
      candidateIndex = 0;
      currentBase = CANDIDATES[0];
      api.defaults.baseURL = currentBase;
      original.baseURL = currentBase;
      original._switchAttempts = 0;
      return api(original);
    }
  }

  throw error;
});
