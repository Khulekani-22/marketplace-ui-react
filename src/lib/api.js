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
  // Prefer 5000, then 5001, then stable 5500 as third fallback
  return [make(5000), make(5001), make(5500)];
}

const CANDIDATES = computeApiBases();
let candidateIndex = 0;
let currentBase = CANDIDATES[candidateIndex];

export const api = axios.create({ baseURL: currentBase });

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
  const original = error.config || {};

  // Handle auth refresh
  if (error.response?.status === 401 && !original._retriedAuth) {
    original._retriedAuth = true;
    await auth.currentUser?.getIdToken(true);
    return api(original);
  }

  // Fallback policy: on network errors OR 4xx/5xx (except 401 already handled), try next base
  const status = error.response?.status;
  const isNetworkError = !error.response || error.code === "ERR_NETWORK";
  const shouldFallback = isNetworkError || (status && status !== 401);
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
  }

  throw error;
});
