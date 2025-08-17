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

api.interceptors.request.use((cfg) => {
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  cfg.headers["x-tenant-id"] = sessionStorage.getItem("tenantId") || "public";
  return cfg;
});
