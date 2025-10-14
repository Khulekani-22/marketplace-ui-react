import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import { useCallback, useEffect, useMemo, useState } from "react";
import { auth } from "../firebase.js";
import { useAppSync } from "../context/useAppSync";
import { fetchMySubscriptions, unsubscribeFromService } from "../lib/subscriptions";
import { api } from "../lib/api";

// Type definitions
interface Service {
  id: string | number;
  title?: string;
  description?: string;
  price?: number;
  rating?: number;
  category?: string;
  vendor?: string;
  imageUrl?: string;
}

interface LoadOptions {
  silent?: boolean;
  signal?: AbortSignal;
}

interface BusyMap {
  [key: string]: boolean;
}

export default function MySubscriptionsPage() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Service[]>([]); // services enriched
  const [err, setErr] = useState("");
  const [busyMap, setBusyMap] = useState<BusyMap>({}); // serviceId -> boolean
  const [refreshing, setRefreshing] = useState(false);
  const tenantId = useMemo(() => sessionStorage.getItem("tenantId") || "vendor", []);
  const { appData } = useAppSync();

  const fallbackServices = useMemo(
    () => (Array.isArray((appData as any)?.services) ? (appData as any).services : []),
    [appData]
  );

  const fetchSubscribedServices = useCallback(
    async (serviceIds: Set<string>) => {
      if (!serviceIds.size) return [] as Service[];

      const pageSize = Math.max(50, Math.min(500, serviceIds.size * 3));
      try {
        const { data } = await api.get("/api/data/services", {
          params: { page: 1, pageSize },
          suppressToast: true,
          suppressErrorLog: true,
        } as any);
        const remoteItems = Array.isArray(data?.items) ? data.items : [];
        const matched = remoteItems.filter((svc: any) => serviceIds.has(String(svc?.id ?? "")));
        const remoteIds = new Set(matched.map((svc: any) => String(svc?.id ?? "")));

        if (remoteIds.size !== serviceIds.size && fallbackServices.length) {
          const missingIds = [...serviceIds].filter((id) => !remoteIds.has(id));
          if (missingIds.length) {
            const fallbackMatches = fallbackServices.filter((svc: any) =>
              missingIds.includes(String(svc?.id ?? ""))
            );
            if (fallbackMatches.length) {
              return [...matched, ...fallbackMatches] as Service[];
            }
          }
        }

        return matched as Service[];
      } catch (error) {
        console.warn("Failed to fetch services from API; using appData fallback", error);
        if (fallbackServices.length) {
          return fallbackServices.filter((svc: any) =>
            serviceIds.has(String(svc?.id ?? ""))
          ) as Service[];
        }
        throw error;
      }
    },
    [fallbackServices]
  );

  // Debug function to test API connection
  const testApiConnection = useCallback(async () => {
    try {
      console.log('🔗 Testing API connection...');
      console.log('🔗 Current API base URL:', api.defaults.baseURL);
      
      const response = await api.get('/api/health');
      console.log('✅ API health check passed:', response.data);
      
      if (auth.currentUser) {
        console.log('🔐 Testing authenticated endpoint...');
        const subsResponse = await api.get('/api/subscriptions/my');
        console.log('✅ Subscriptions endpoint test:', subsResponse.data);
      }
    } catch (e: any) {
      console.error('❌ API connection test failed:', e);
      console.error('❌ Error details:', e?.response?.data);
    }
  }, []);

  useEffect(() => {
    // Test API connection on component mount
    testApiConnection();
  }, [testApiConnection]);

  const loadSubscriptions = useCallback(
    async (options: LoadOptions = {}) => {
      const { silent, signal } = options;
      if (silent) setRefreshing(true);
      else setLoading(true);
      setErr("");
      try {
        if (!auth.currentUser) {
          console.log('🔐 No authenticated user found');
          if (!signal?.aborted) setItems([]);
          return;
        }
        
        console.log('📡 Fetching subscriptions for user:', auth.currentUser.email);
        const subs = await fetchMySubscriptions();
        console.log('📋 Raw subscriptions from API:', subs);

        const idSet = new Set(
          subs
            .filter((x: any) => (x.type || "service") === "service" && x.serviceId != null)
            .map((x: any) => String(x.serviceId))
        );
        console.log('🔍 Service IDs from subscriptions:', Array.from(idSet));

        const matchedServices = await fetchSubscribedServices(idSet);
        console.log('✅ Matched services:', matchedServices.length, matchedServices.map((s: any) => ({ id: s.id, title: s.title })));

        if (!signal?.aborted) setItems(matchedServices);
      } catch (e: any) {
        console.error('❌ Failed to load subscriptions:', e);
        if (!signal?.aborted) setErr(e?.message || "Failed to load subscriptions");
      } finally {
        const aborted = signal?.aborted;
        if (!aborted) {
          if (silent) setRefreshing(false);
          else setLoading(false);
        }
      }
    },
    [fetchSubscribedServices]
  );

  useEffect(() => {
    const controller = new AbortController();
    loadSubscriptions({ silent: false, signal: controller.signal });
    return () => {
      controller.abort();
    };
  }, [loadSubscriptions, tenantId]);

  async function handleUnsubscribe(id: string | number) {
    const key = String(id);
    console.log('🔄 Starting unsubscribe process for service:', key);
    console.log('🔄 Current user:', auth.currentUser?.email);
    console.log('🔄 Current tenant:', tenantId);
    
    setBusyMap((m) => ({ ...m, [key]: true }));
    try {
      // First, let's fetch current subscriptions to see what we have
      console.log('🔍 Fetching current subscriptions before unsubscribe...');
      const currentSubs = await fetchMySubscriptions();
      console.log('📋 Current subscriptions:', currentSubs);
      
      const targetSub = currentSubs.find((sub: any) => String(sub.serviceId) === key);
      console.log('🎯 Target subscription to cancel:', targetSub);
      
      if (!targetSub) {
        console.log('⚠️ No subscription found in cache for service:', key);
        // If no subscription in cache, just remove from UI - it's likely already cancelled
        setItems((prev) => prev.filter((s) => String(s.id) !== key));
        alert(`✅ Service ${key} removed from your subscriptions (was already cancelled)`);
        return;
      }
      
      console.log('📡 Calling unsubscribeFromService API...');
      try {
        const result = await unsubscribeFromService(key);
        console.log('✅ Unsubscribe API success:', result);
        alert(`✅ Successfully unsubscribed from service ${key}`);
      } catch (apiError: any) {
        // If we get 404, it means the subscription doesn't exist in backend
        // but exists in frontend cache - this is a sync issue
        if (apiError?.response?.status === 404) {
          console.log('⚠️ Backend says subscription not found (404) - treating as already cancelled');
          alert(`✅ Service ${key} removed from your subscriptions (was already cancelled on server)`);
        } else {
          // Re-throw for other errors
          throw apiError;
        }
      }
      
      // Remove from UI state after successful API call OR 404 (already cancelled)
      setItems((prev) => {
        const filtered = prev.filter((s) => String(s.id) !== key);
        console.log('📝 Updated items count:', filtered.length);
        return filtered;
      });
      
      // Also force remove from local cache to prevent reappearing
      // This ensures the subscription won't come back during refresh
      console.log('�️ Clearing subscription from local cache...');
      try {
        // Clear the specific subscription from localStorage cache
        const cacheKey = `sl_subscriptions_cache_v1:${auth.currentUser?.uid || auth.currentUser?.email}`;
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const subscriptions = JSON.parse(cached);
          const filteredSubs = subscriptions.filter((sub: any) => String(sub.serviceId) !== key);
          localStorage.setItem(cacheKey, JSON.stringify(filteredSubs));
          console.log('🗑️ Removed subscription from cache, remaining:', filteredSubs.length);
        }
      } catch (e) {
        console.log('⚠️ Failed to update cache:', e);
      }
      
      // Skip the automatic refresh since we already cleaned up locally
      console.log('✅ Unsubscribe completed - skipping refresh to prevent reappearing');
      
    } catch (e: any) {
      console.error('❌ Failed to unsubscribe:', e);
      console.error('❌ Error response:', e?.response);
      console.error('❌ Error data:', e?.response?.data);
      console.error('❌ Error status:', e?.response?.status);
      
      const errorMessage = e?.response?.data?.message || e?.message || "Failed to unsubscribe";
      alert(`❌ Unsubscribe failed for service ${key}: ${errorMessage}`);
    } finally {
      setBusyMap((m) => ({ ...m, [key]: false }));
      console.log('🏁 Unsubscribe process completed for service:', key);
    }
  }

  return (
    <MasterLayout>
      <Breadcrumb title="My Subscriptions" />
      <div className="card">
        <div className="card-header border-bottom py-16 px-24 d-flex align-items-center justify-content-between gap-3 flex-wrap">
          <h6 className="mb-0">Active Subscriptions</h6>
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm"
            onClick={() => loadSubscriptions({ silent: true })}
            disabled={loading || refreshing}
          >
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
        </div>
        <div className="card-body">
          {err && <div className="alert alert-danger">{err}</div>}
          {loading ? (
            <div>Loading…</div>
          ) : (
            <div className="row g-3">
              {items.length === 0 && (
                <div className="col-12 text-secondary">No subscriptions yet.</div>
              )}
              {items.map((s) => (
                <div className="col-12 col-md-6 col-lg-4" key={String(s.id)}>
                  <div className="card h-100">
                    <img src={s.imageUrl || '/assets/images/services/placeholder.png'} className="card-img-top" alt={s.title || 'Listing'} style={{ maxHeight: 160, objectFit: 'cover' }} />
                    <div className="card-body d-flex flex-column">
                      <div className="d-flex justify-content-between align-items-start">
                        <h6 className="card-title mb-1">{s.title || 'Listing'}</h6>
                        <button type="button" className="btn btn-sm btn-outline-secondary" title="Notifications (soon)" disabled>
                          <i className="ri-notification-3-line" />
                        </button>
                      </div>
                      <div className="text-muted small mb-2">{s.category || 'General'} · {s.vendor || ''}</div>
                      {s.description && <p className="flex-grow-1 text-secondary small">{s.description.slice(0, 140)}{s.description.length > 140 ? '…' : ''}</p>}
                      <div className="d-flex justify-content-between align-items-center mt-auto">
                        <strong>R {Number(s.price || 0).toLocaleString()}</strong>
                        <div className="d-flex gap-2">
                          <span className="badge bg-neutral-200 text-neutral-900">★ {Number(s.rating || 0).toFixed(1)}</span>
                          <button className="btn btn-sm btn-outline-danger" onClick={() => handleUnsubscribe(s.id)} disabled={!!busyMap[String(s.id)]}>
                            {busyMap[String(s.id)] ? 'Removing…' : 'Unsubscribe'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </MasterLayout>
  );
}
