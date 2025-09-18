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
onIdTokenChanged(auth, async (user) => {
  token = user ? await user.getIdToken() : null;
});

const CANDIDATES = computeApiBases();
let candidateIndex = 0;
export const api = axios.create({ baseURL: CANDIDATES[candidateIndex] });

function mapTenantOut(id: string | null | undefined) {
  return id === "vendor" ? "public" : id;
}

api.interceptors.request.use((cfg) => {
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
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

api.interceptors.response.use(undefined, async (error) => {
  const original: any = error.config || {};
  const status = error.response?.status as number | undefined;
  const isNetworkError = !error.response || error.code === "ERR_NETWORK";
  const isServerError = typeof status === "number" && status >= 500;
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
