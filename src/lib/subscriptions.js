// src/lib/subscriptions.js
// Legacy wrapper - use SDK functions instead
import { getMySubscriptions, subscribeToService, unsubscribeFromService } from './sdk';

export async function fetchMySubscriptions() {
  try {
    return await getMySubscriptions();
  } catch (e) {
    // Be forgiving if the route is unavailable or user is unauthenticated
    const status = e?.response?.status;
    if (status === 401 || status === 403 || status === 404) return [];
    return [];
  }
}

export { subscribeToService, unsubscribeFromService };
