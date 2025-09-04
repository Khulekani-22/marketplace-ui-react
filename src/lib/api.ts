// src/lib/api.ts
import axios from "axios";
import { auth } from "../lib/firebase";
import { onIdTokenChanged } from "firebase/auth";

let token: string | null = null;
onIdTokenChanged(auth, async (user) => {
  token = user ? await user.getIdToken() : null;
});

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
});

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
