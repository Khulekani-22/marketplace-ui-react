// src/lib/api.ts
import axios from "axios";
import { auth } from "../lib/firebase";
import { onIdTokenChanged } from "firebase/auth";

function computeApiBases(): string[] {
  const envUrl = (import.meta as any).env?.VITE_API_URL as string | undefined;
  if (envUrl) return [envUrl];
  const host = typeof window !== "undefined" ? window.location.hostname : "localhost";
  const protocol = typeof window !== "undefined" ? window.location.protocol : "http:";
  const make = (port: number) => `${protocol}//${host}:${port}`;
  // Match JS client order: 5001, 5055, 5000
  return [make(5001), make(5055), make(5000)];
}


let token: string | null = null;
let tokenTimestamp: number | null = null;
const TOKEN_REFRESH_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

import type { User } from "firebase/auth";
import type { InternalAxiosRequestConfig, AxiosError } from "axios";
onIdTokenChanged(auth, async (user: User | null) => {
  if (user) {
    token = await user.getIdToken();
    tokenTimestamp = Date.now();
  } else {
    token = null;
    tokenTimestamp = null;
  }
});

const CANDIDATES = computeApiBases();
let candidateIndex = 0;
export const api = axios.create({ baseURL: CANDIDATES[candidateIndex] });

function mapTenantOut(id: string | null | undefined) {
  return id === "vendor" ? "public" : id;
}

api.interceptors.request.use(async (cfg: InternalAxiosRequestConfig) => {
  // Refresh token if older than threshold
  const user = auth.currentUser;
  if (user) {
    const now = Date.now();
    if (!tokenTimestamp || !token || (now - tokenTimestamp > TOKEN_REFRESH_THRESHOLD_MS)) {
      token = await user.getIdToken(true); // force refresh
      tokenTimestamp = now;
    }
    if (!cfg.headers) cfg.headers = {} as any;
    cfg.headers.Authorization = `Bearer ${token}`;
  }
  const ss = sessionStorage.getItem("tenantId") || "vendor";
  const headerTenant = (cfg.headers as any)["x-tenant-id"] || ss;
  (cfg.headers as any)["x-tenant-id"] = mapTenantOut(String(headerTenant));
  // Light shim for common payload keys
  const anyCfg: any = cfg as any;
  if (anyCfg.data && typeof anyCfg.data === "object") {
    if (typeof anyCfg.data.tenantId === "string") anyCfg.data.tenantId = mapTenantOut(anyCfg.data.tenantId);
    if (typeof anyCfg.data.newTenantId === "string") anyCfg.data.newTenantId = mapTenantOut(anyCfg.data.newTenantId);
  }
  if (anyCfg.params && typeof anyCfg.params === "object") {
    if (typeof anyCfg.params.tenantId === "string") anyCfg.params.tenantId = mapTenantOut(anyCfg.params.tenantId);
    if (typeof anyCfg.params.newTenantId === "string") anyCfg.params.newTenantId = mapTenantOut(anyCfg.params.newTenantId);
  }
  return cfg;
});

api.interceptors.response.use(undefined, async (error: AxiosError) => {
  const original: any = error.config || {};
  const status = error.response?.status as number | undefined;
  const isNetworkError = !error.response || error.code === "ERR_NETWORK";
  const isServerError = typeof status === "number" && status >= 500;

  // Handle 401/403: force refresh and retry once
  if ((status === 401 || status === 403) && !original._retriedAuth) {
    original._retriedAuth = true;
    const user = auth.currentUser;
    if (user) {
      try {
        token = await user.getIdToken(true); // force refresh
        tokenTimestamp = Date.now();
        original.headers = original.headers || {};
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      } catch (e) {
        // fall through to sign out
      }
    }
    // Clear local auth state and surface sign-out flow
    if (typeof window !== "undefined") {
      try {
        sessionStorage.clear();
        localStorage.clear();
      } catch {}
      // Optionally, redirect to sign-in page or show a sign-out UI
      window.location.assign("/login");
    }
    return Promise.reject(error);
  }

  if (isNetworkError || isServerError) {
    const attempts = Number(original._switchAttempts || 0);
    if (attempts < CANDIDATES.length - 1) {
      original._switchAttempts = attempts + 1;
      candidateIndex = Math.min(candidateIndex + 1, CANDIDATES.length - 1);
      const nextBase = CANDIDATES[candidateIndex];
      (api.defaults as any).baseURL = nextBase;
      original.baseURL = nextBase;
      return api(original);
    }
  }
  throw error;
});
