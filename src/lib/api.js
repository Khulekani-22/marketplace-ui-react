// src/lib/api.js
import axios from "axios";
import { auth } from "./firebase";

// In-memory session derived from the API (authoritative)
let SESSION = {
  email: null,
  uid: null,
  role: "member",
  tenantId: null,
  allowedTenants: [],
};

// Prefer port 5000; if unreachable, automatically fall back to 5001.
function computeApiBases() {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) return [envUrl];
  const host = typeof window !== "undefined" ? window.location.hostname : "localhost";
  const protocol = typeof window !== "undefined" ? window.location.protocol : "http:";
  const make = (port) => `${protocol}//${host}:${port}`;
  // Prefer ports in this order: 5001, 5055, then 5000 (per environment requirement)
  return [make(5001), make(5055), make(5000)];
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

function requestId() {
  try { return crypto.randomUUID(); } catch { /* older browsers */ }
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`;
}

// Public helpers: prefer server-derived session over client hints
export function getSession() {
  const ssTenant = SESSION.tenantId || sessionStorage.getItem("tenantId") || "vendor";
  const role = SESSION.role || sessionStorage.getItem("role") || "member";
  return { ...SESSION, tenantId: ssTenant, role };
}

export async function bootstrapSession() {
  try {
    // Use either Firebase identity (via Authorization header) or fallback to email/uid in storage
    const meHint = {};
    const ssEmail = sessionStorage.getItem("userEmail");
    const ssUid = sessionStorage.getItem("userId");
    if (ssEmail) meHint.email = ssEmail;
    if (ssUid) meHint.uid = ssUid;
    const { data } = await api.get("/api/users/me", { params: meHint });
    const role = data?.role || "member";
    const tenantId = data?.tenantId || "vendor";
    SESSION = {
      email: (auth.currentUser?.email || sessionStorage.getItem("userEmail") || null),
      uid: (auth.currentUser?.uid || sessionStorage.getItem("userId") || null),
      role,
      tenantId,
      allowedTenants: data?.allowedTenants || [tenantId].filter(Boolean),
    };
    // Mirror to sessionStorage for UI gating only (not as an authority)
    sessionStorage.setItem("role", role);
    sessionStorage.setItem("tenantId", tenantId);
    return getSession();
  } catch {
    // leave SESSION as-is; fall back to existing storage hints
    return getSession();
  }
}

api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    // use a fresh token each request; SDK refreshes under the hood
    const tok = await user.getIdToken();
    config.headers.Authorization = `Bearer ${tok}`;
  }
  // Prefer server-derived tenant if present; else storage hint
  const tenantId = (SESSION.tenantId || sessionStorage.getItem("tenantId") || "vendor");
  // Always ensure the backend receives legacy-compatible tenant id
  const headerTenant = config.headers["x-tenant-id"] || tenantId;
  config.headers["x-tenant-id"] = mapTenantOut(headerTenant);
  // Attach a correlation id and basic client info for accounting
  config.headers["x-request-id"] = requestId();
  try { config.headers["x-client-path"] = window.location.pathname; } catch {}

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

  // Normalize 403 with a helpful message
  if (error.response?.status === 403) {
    const msg = error?.response?.data?.message || "Forbidden";
    return Promise.reject(Object.assign(error, { message: msg }));
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

// Eagerly bootstrap session on import (best-effort). Consumers may also call manually.
// Do not await to avoid blocking early renders.
bootstrapSession().catch(() => void 0);
