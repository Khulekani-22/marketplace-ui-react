// src/lib/api.js
import axios, { isAxiosError, type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { toast } from "react-toastify";
import { auth } from "./firebase";

// In-memory session derived from the API (authoritative)
interface Session {
  email: string | null;
  uid: string | null;
  role: string;
  tenantId: string | null;
  allowedTenants: string[];
}
let SESSION: Session = {
  email: null,
  uid: null,
  role: "member",
  tenantId: null,
  allowedTenants: [],
};

// Prefer backend dev ports 5500 first (current backend), then others
function computeApiBases(): string[] {
  const envUrl = (import.meta as any).env?.VITE_API_URL as string | undefined;
  if (envUrl) return [envUrl];
  const host = typeof window !== "undefined" ? window.location.hostname : "localhost";
  const protocol = typeof window !== "undefined" ? window.location.protocol : "http:";
  const make = (port: number) => `${protocol}//${host}:${port}`;
  return [make(5500), make(5055), make(5000), make(5001)];
}

const CANDIDATES = computeApiBases();
let candidateIndex = 0;
let currentBase = CANDIDATES[candidateIndex];

type ApiRequestConfig = InternalAxiosRequestConfig & {
  suppressToast?: boolean;
  suppressErrorLog?: boolean;
  errorMessageOverride?: string;
  _errorNotified?: boolean;
  _retriedAuth?: boolean;
  _switchAttempts?: number;
  _resetOnce?: boolean;
  _delayedRetry?: boolean;
};

export const api = axios.create({ baseURL: currentBase });

function combineUrl(base?: string, url?: string) {
  if (!url) return base || "";
  if (!base || url.startsWith("http")) return url;
  const baseClean = base.replace(/\/+$/, "");
  const urlClean = url.replace(/^\/+/, "");
  return `${baseClean}/${urlClean}`;
}

function extractMessage(error: AxiosError, override?: string) {
  const responseData: any = error.response?.data;
  if (responseData) {
    if (typeof responseData === "string" && responseData.trim()) return responseData.trim();
    if (typeof responseData.message === "string" && responseData.message.trim()) return responseData.message.trim();
    if (Array.isArray(responseData.errors)) {
      const joined = responseData.errors.filter(Boolean).join(", ");
      if (joined) return joined;
    }
  }
  if (error.code === "ERR_NETWORK") return "Network error. Check your connection and try again.";
  const status = error.response?.status;
  if (status === 401) return "Your session has expired. Please sign in again.";
  if (status === 403) return "You do not have permission to complete this action.";
  if (status === 404) return "The requested resource could not be found.";
  if (status && status >= 500) return `Server error (${status}). Please try again shortly.`;
  return override || error.message || "Unexpected error. Please try again.";
}

function reportApiError(error: AxiosError) {
  const config = (error.config || {}) as ApiRequestConfig;
  if (config._errorNotified) return;
  if (axios.isCancel(error)) return;
  config._errorNotified = true;

  const message = extractMessage(error, config.errorMessageOverride);
  if (!error.message || error.message.startsWith("Request failed")) {
    try {
      (error as any).message = message;
    } catch {
      /* ignore assignment failures */
    }
  }
  const method = (config?.method || "get").toUpperCase();
  const fullUrl = combineUrl(config.baseURL || api.defaults.baseURL || currentBase, config.url);
  const status = error.response?.status;
  const codeSuffix = status
    ? ` (HTTP ${status})`
    : error.code
    ? ` (${error.code})`
    : "";

  if (!config.suppressErrorLog) {
    const context = {
      status,
      code: error.code,
      method,
      url: fullUrl,
      response: error.response?.data,
    };
    console.error("[API] Request failed", context, error);
  }

  if (!config.suppressToast) {
    const toastId = `${method}:${fullUrl}:${status || error.code || "err"}`;
    try {
      setTimeout(() => {
        try {
          toast.error(`${message}${codeSuffix}`, { toastId });
        } catch {
          /* noop: toast unavailable (e.g., during SSR) */
        }
      }, 1000);
    } catch {
      /* noop */
    }
  }
}

function mapTenantOut(id: string | null | undefined): string | null | undefined {
  return id === "vendor" ? "public" : id;
}

function mapTenantIn(id: string | null | undefined): string {
  if (!id) return "vendor";
  return id === "public" ? "vendor" : id;
}

function shimTenantInPayload<T extends Record<string, any>>(payload: T): T {
  if (!payload || typeof payload !== "object") return payload;
  try {
    if (typeof (payload as any).tenantId === "string") (payload as any).tenantId = mapTenantOut((payload as any).tenantId);
    if (typeof (payload as any).newTenantId === "string") (payload as any).newTenantId = mapTenantOut((payload as any).newTenantId);
  } catch {}
  return payload;
}

function requestId() {
  try { return crypto.randomUUID(); } catch { /* older browsers */ }
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Public helpers: prefer server-derived session over client hints
export function getSession(): Session {
  const ssTenantRaw = SESSION.tenantId || sessionStorage.getItem("tenantId") || "vendor";
  const tenantId = mapTenantIn(ssTenantRaw);
  const role = SESSION.role || sessionStorage.getItem("role") || "member";
  return { ...SESSION, tenantId, role };
}

export async function bootstrapSession(): Promise<Session> {
  try {
    const { data } = await api.get<any>("/api/me");
    const role = data?.role || "member";
    const tenantId = mapTenantIn(data?.tenantId);
    const email = data?.email || auth.currentUser?.email || sessionStorage.getItem("userEmail") || null;
    const uid = data?.uid || auth.currentUser?.uid || sessionStorage.getItem("userId") || null;
    SESSION = {
      email,
      uid,
      role,
      tenantId,
      allowedTenants:
        Array.isArray(data?.allowedTenants)
          ? (data.allowedTenants as string[]).map((t) => mapTenantIn(t))
          : [tenantId].filter(Boolean),
    };
    // Mirror to sessionStorage for UI gating only (not as an authority)
    sessionStorage.setItem("role", role);
    sessionStorage.setItem("tenantId", tenantId);
    if (email) sessionStorage.setItem("userEmail", email);
    if (uid) sessionStorage.setItem("userId", uid);
    return getSession();
  } catch {
    // leave SESSION as-is; fall back to existing storage hints
    if (!auth.currentUser) {
      sessionStorage.removeItem("userEmail");
      sessionStorage.removeItem("userId");
      sessionStorage.removeItem("tenantId");
      sessionStorage.removeItem("role");
      try {
        if (typeof window !== "undefined" && window.location.pathname !== "/login") {
          window.location.replace("/login");
        }
      } catch {}
    }
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
  if (!isAxiosError(error)) {
    throw error;
  }

  const original = (error.config || {}) as ApiRequestConfig;
  const method = (original?.method || "get").toLowerCase();

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

  if (!original._delayedRetry && method === "get") {
    original._delayedRetry = true;
    await delay(1000);
    return api(original);
  }

  reportApiError(error);
  throw error;
});

// Eagerly bootstrap session on import (best-effort). Consumers may also call manually.
// Do not await to avoid blocking early renders.
bootstrapSession().catch(() => void 0);
