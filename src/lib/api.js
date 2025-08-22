// src/lib/api.js
import axios from "axios";
import { auth } from "./firebase";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
});

api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    // use a fresh token each request; SDK refreshes under the hood
    const tok = await user.getIdToken();
    config.headers.Authorization = `Bearer ${tok}`;
  }
  const tenantId = sessionStorage.getItem("tenantId") || "public";
  config.headers["x-tenant-id"] = tenantId;
  return config;
});

api.interceptors.response.use(null, async (error) => {
  const original = error.config;
  if (error.response?.status === 401 && !original._retried) {
    original._retried = true;
    await auth.currentUser?.getIdToken(true);
    return api(original);
  }
  throw error;
});
