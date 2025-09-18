// src/lib/subscriptions.js
import { api } from "./api";

export async function fetchMySubscriptions() {
  try {
    const { data } = await api.get("/api/subscriptions/my");
    return Array.isArray(data) ? data : [];
  } catch (e) {
    // Be forgiving if the route is unavailable or user is unauthenticated
    const status = e?.response?.status;
    if (status === 401 || status === 403 || status === 404) return [];
    return [];
  }
}

export async function subscribeToService(serviceId) {
  const { data } = await api.post("/api/subscriptions/service", { serviceId });
  return data;
}

export async function unsubscribeFromService(serviceId) {
  // Soft cancel to preserve history in analytics
  await api.put("/api/subscriptions/service/cancel", { serviceId });
  return true;
}
