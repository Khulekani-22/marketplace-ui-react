// src/lib/subscriptions.ts
import { api } from "./api";
import { auth } from "./firebase";

const LS_SUBS_KEY = "sl_subscriptions_cache_v1";

type Subscription = Record<string, any> & {
  id?: string;
  type?: string;
  serviceId?: string | number;
  email?: string;
  tenantId?: string;
  canceledAt?: string | null;
};

function createSubscriptionKey(entry: Subscription | null | undefined) {
  if (!entry || typeof entry !== "object") return "";
  const type = (entry.type || "service").toString();
  const email = (entry.email || "").toLowerCase();
  const serviceId = entry.serviceId != null ? String(entry.serviceId) : "";
  return `${type}::${email}::${serviceId}`;
}

function sortSubscriptions(list: Subscription[]) {
  return [...list].sort((a, b) => {
    const ta = Date.parse(a?.createdAt || "") || 0;
    const tb = Date.parse(b?.createdAt || "") || 0;
    return tb - ta;
  });
}

function mergeSubscriptions(primary: Subscription[], secondary: Subscription[]) {
  if (!secondary?.length) return primary;
  const map = new Map<string, Subscription>();
  primary.forEach((item) => {
    const key = createSubscriptionKey(item);
    if (!key) return;
    map.set(key, item);
  });
  secondary.forEach((item) => {
    const key = createSubscriptionKey(item);
    if (!key || map.has(key)) return;
    map.set(key, item);
  });
  return Array.from(map.values());
}

function safeParse(raw: string | null): Subscription[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getIdentityKey() {
  if (typeof window === "undefined") return null;
  try {
    const user = auth.currentUser;
    const email = (user?.email || window.sessionStorage.getItem("userEmail") || "").toLowerCase();
    const uid = user?.uid || window.sessionStorage.getItem("userId") || "";
    if (!email && !uid) return null;
    return `${LS_SUBS_KEY}:${uid || email}`;
  } catch {
    return null;
  }
}

function readCache(key: string | null): Subscription[] {
  if (!key || typeof window === "undefined") return [];
  try {
    return safeParse(window.localStorage.getItem(key));
  } catch {
    return [];
  }
}

function writeCache(key: string | null, items: Subscription[]) {
  if (!key || typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(items));
  } catch {
    // ignore quota errors
  }
}

function clearCache(key: string | null) {
  if (!key || typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

function normalizeSubscription(entry: any): Subscription | null {
  if (!entry || typeof entry !== "object") return null;
  const copy: Subscription = { ...entry };
  copy.type = (copy.type || "service").toString();
  if (copy.email) copy.email = copy.email.toLowerCase();
  copy.serviceId = copy.serviceId != null ? String(copy.serviceId) : copy.serviceId;
  copy.tenantId = (copy.tenantId || "public").toString();
  return copy;
}

function upsertCache(key: string | null, entry: any) {
  const normalized = normalizeSubscription(entry);
  if (!key || !normalized) return;
  const items = readCache(key);
  const email = (normalized.email || "").toLowerCase();
  const serviceId = String(normalized.serviceId || "");
  const type = normalized.type || "service";
  const idx = items.findIndex((item) => {
    const itemEmail = (item.email || "").toLowerCase();
    const itemService = String(item.serviceId || "");
    const itemType = item.type || "service";
    return itemEmail === email && itemService === serviceId && itemType === type;
  });
  if (idx >= 0) {
    items[idx] = { ...items[idx], ...normalized, canceledAt: undefined };
  } else {
    items.push(normalized);
  }
  writeCache(key, items);
}

function removeFromCache(key: string | null, serviceId: string | number) {
  if (!key) return;
  const id = String(serviceId || "");
  const items = readCache(key).filter((item) => String(item.serviceId || "") !== id);
  writeCache(key, items);
}

export async function fetchMySubscriptions() {
  const cacheKey = getIdentityKey();
  const cached = readCache(cacheKey);
  try {
    const { data } = await api.get("/api/subscriptions/my");
    const rawList = Array.isArray(data) ? data : [];
    const normalized = rawList.map(normalizeSubscription).filter(Boolean) as Subscription[];
    const merged = mergeSubscriptions(normalized, cached);
    const ordered = sortSubscriptions(merged);
    if (cacheKey) writeCache(cacheKey, ordered);
    return ordered;
  } catch (e: any) {
    const status = e?.response?.status;
    if (status === 401 || status === 403 || status === 404) {
      clearCache(cacheKey);
      return [];
    }
    if (cached.length) return sortSubscriptions(cached);
    return [];
  }
}

export async function subscribeToService(serviceId: string | number, details: Record<string, any> = {}) {
  const payload = { serviceId, ...details };
  const { data } = await api.post("/api/subscriptions/service", payload);
  const cacheKey = getIdentityKey();
  upsertCache(cacheKey, data || { serviceId, ...details, type: "service" });
  return data;
}

export async function unsubscribeFromService(serviceId: string | number) {
  await api.put("/api/subscriptions/service/cancel", { serviceId });
  const cacheKey = getIdentityKey();
  removeFromCache(cacheKey, serviceId);
  return true;
}
