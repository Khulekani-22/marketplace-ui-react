// src/lib/subscriptions.js
import { api } from "./api";

export async function fetchMySubscriptions() {
  const { data } = await api.get("/api/subscriptions/my");
  return Array.isArray(data) ? data : [];
}

export async function subscribeToService(serviceId) {
  const { data } = await api.post("/api/subscriptions/service", { serviceId });
  return data;
}

export async function unsubscribeFromService(serviceId) {
  // axios allows body on DELETE via config.data
  await api.delete("/api/subscriptions/service", { data: { serviceId } });
  return true;
}

