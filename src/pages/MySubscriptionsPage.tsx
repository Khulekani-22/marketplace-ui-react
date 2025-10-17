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

interface Booking {
  id: string;
  serviceId: string;
  serviceTitle: string;
  vendorName?: string;
  scheduledDate?: string;
  scheduledSlot?: string;
  status?: string;
  price?: number;
  bookedAt?: string;
  imageUrl?: string;
}

interface Subscription {
  id: string;
  serviceId: string;
  type?: string;
  createdAt?: string;
  canceledAt?: string | null;
  scheduledDate?: string;
  scheduledSlot?: string;
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
  const [bookings, setBookings] = useState<Booking[]>([]); // bookings
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]); // raw subscriptions
  const [activeTab, setActiveTab] = useState<"subscriptions" | "bookings">("subscriptions");
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
          if (!signal?.aborted) {
            setItems([]);
            setBookings([]);
            setSubscriptions([]);
          }
          return;
        }
        
        console.log('📡 Fetching subscriptions and bookings for user:', auth.currentUser.email);
        
        // Fetch subscriptions
        const subs = await fetchMySubscriptions();
        console.log('📋 Raw subscriptions from API:', subs);
        
        // Store raw subscriptions
        if (!signal?.aborted) setSubscriptions(subs as Subscription[]);

        // Extract service IDs from subscriptions
        const idSet = new Set(
          subs
            .filter((x: any) => (x.type || "service") === "service" && x.serviceId != null)
            .map((x: any) => String(x.serviceId))
        );
        console.log('🔍 Service IDs from subscriptions:', Array.from(idSet));

        // Fetch service details for subscriptions
        const matchedServices = await fetchSubscribedServices(idSet);
        console.log('✅ Matched services:', matchedServices.length, matchedServices.map((s: any) => ({ id: s.id, title: s.title })));

        // Fetch bookings
        let fetchedBookings: Booking[] = [];
        try {
          const { data: bookingsData } = await api.get("/api/subscriptions/bookings/mine", {
            suppressToast: true,
            suppressErrorLog: true,
          } as any);
          
          if (Array.isArray(bookingsData?.bookings)) {
            fetchedBookings = bookingsData.bookings.map((b: any) => ({
              id: b.id || '',
              serviceId: String(b.serviceId || ''),
              serviceTitle: b.serviceTitle || 'Unknown Service',
              vendorName: b.vendorName || b.vendor || '',
              scheduledDate: b.scheduledDate || '',
              scheduledSlot: b.scheduledSlot || '',
              status: b.status || 'scheduled',
              price: Number(b.price || 0),
              bookedAt: b.bookedAt || b.createdAt || '',
              imageUrl: b.imageUrl || '',
            }));
            console.log('📅 Fetched bookings:', fetchedBookings.length);
          }
        } catch (bookingError) {
          console.warn('⚠️ Failed to fetch bookings:', bookingError);
          // Continue even if bookings fail
        }

        if (!signal?.aborted) {
          setItems(matchedServices);
          setBookings(fetchedBookings);
        }
      } catch (e: any) {
        console.error('❌ Failed to load data:', e);
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

  // Format date and time for display
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const formatSlot = (slot: string) => {
    if (!slot) return '';
    // Convert 24hr format to 12hr (e.g., "14:00" -> "2:00 PM")
    const [hour] = slot.split(':');
    const h = parseInt(hour, 10);
    const period = h >= 12 ? 'PM' : 'AM';
    const displayHour = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${displayHour}:00 ${period}`;
  };

  const getStatusBadgeClass = (status: string = 'scheduled') => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-success-600';
      case 'scheduled':
        return 'bg-primary-600';
      case 'canceled':
      case 'cancelled':
        return 'bg-danger-600';
      default:
        return 'bg-secondary-600';
    }
  };

  return (
    <MasterLayout>
      <Breadcrumb title="My Subscriptions & Bookings" />
      
      <div className="card">
        <div className="card-header border-bottom py-16 px-24">
          <div className="d-flex align-items-center justify-content-between gap-3 flex-wrap">
            <div className="d-flex gap-2">
              <button
                type="button"
                className={`btn btn-sm ${activeTab === 'subscriptions' ? 'btn-primary-600' : 'btn-outline-primary'}`}
                onClick={() => setActiveTab('subscriptions')}
              >
                <i className="ri-shopping-cart-line me-1"></i>
                Subscriptions ({items.length})
              </button>
              <button
                type="button"
                className={`btn btn-sm ${activeTab === 'bookings' ? 'btn-primary-600' : 'btn-outline-primary'}`}
                onClick={() => setActiveTab('bookings')}
              >
                <i className="ri-calendar-check-line me-1"></i>
                Bookings ({bookings.length})
              </button>
            </div>
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              onClick={() => loadSubscriptions({ silent: true })}
              disabled={loading || refreshing}
            >
              {refreshing ? (
                <>
                  <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                  Refreshing…
                </>
              ) : (
                <>
                  <i className="ri-refresh-line me-1"></i>
                  Refresh
                </>
              )}
            </button>
          </div>
        </div>

        <div className="card-body">
          {err && <div className="alert alert-danger alert-dismissible fade show" role="alert">
            <i className="ri-error-warning-line me-2"></i>
            {err}
            <button type="button" className="btn-close" onClick={() => setErr('')} aria-label="Close"></button>
          </div>}

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary-600" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="text-secondary mt-3">Loading your {activeTab}...</p>
            </div>
          ) : (
            <>
              {/* Subscriptions Tab */}
              {activeTab === 'subscriptions' && (
                <div className="row g-3">
                  {items.length === 0 && (
                    <div className="col-12 text-center py-5">
                      <i className="ri-shopping-cart-line display-4 text-secondary mb-3"></i>
                      <h5 className="text-secondary">No active subscriptions</h5>
                      <p className="text-muted">Browse the marketplace to subscribe to services</p>
                      <a href="/dashboard" className="btn btn-primary-600 mt-2">
                        <i className="ri-store-2-line me-1"></i>
                        Browse Marketplace
                      </a>
                    </div>
                  )}
                  {items.map((s) => {
                    const sub = subscriptions.find((sub) => String(sub.serviceId) === String(s.id));
                    const hasSchedule = sub?.scheduledDate && sub?.scheduledSlot;
                    
                    return (
                      <div className="col-12 col-md-6 col-lg-4" key={String(s.id)}>
                        <div className="card h-100 shadow-sm hover-shadow">
                          {s.imageUrl && (
                            <img 
                              src={s.imageUrl} 
                              className="card-img-top" 
                              alt={s.title || 'Listing'} 
                              style={{ height: 180, objectFit: 'cover' }} 
                            />
                          )}
                          <div className="card-body d-flex flex-column">
                            <h6 className="card-title mb-2">{s.title || 'Listing'}</h6>
                            <div className="text-muted small mb-2">
                              <i className="ri-building-line me-1"></i>
                              {s.vendor || 'Unknown Vendor'}
                            </div>
                            <div className="text-muted small mb-2">
                              <i className="ri-price-tag-3-line me-1"></i>
                              {s.category || 'General'}
                            </div>
                            {s.description && (
                              <p className="flex-grow-1 text-secondary small mb-3">
                                {s.description.slice(0, 120)}{s.description.length > 120 ? '…' : ''}
                              </p>
                            )}
                            {hasSchedule && (
                              <div className="alert alert-info alert-sm p-2 mb-3">
                                <i className="ri-calendar-line me-1"></i>
                                <small>
                                  <strong>Next Session:</strong><br />
                                  {formatDate(sub.scheduledDate!)} at {formatSlot(sub.scheduledSlot!)}
                                </small>
                              </div>
                            )}
                            <div className="d-flex justify-content-between align-items-center mt-auto pt-2 border-top">
                              <div>
                                <strong className="text-primary-600">R {Number(s.price || 0).toLocaleString()}</strong>
                                {s.rating && (
                                  <div className="small text-muted">
                                    <i className="ri-star-fill text-warning"></i>
                                    {Number(s.rating).toFixed(1)}
                                  </div>
                                )}
                              </div>
                              <button 
                                className="btn btn-sm btn-outline-danger" 
                                onClick={() => handleUnsubscribe(s.id)} 
                                disabled={!!busyMap[String(s.id)]}
                              >
                                {busyMap[String(s.id)] ? (
                                  <>
                                    <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                                    Removing…
                                  </>
                                ) : (
                                  <>
                                    <i className="ri-close-circle-line me-1"></i>
                                    Unsubscribe
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Bookings Tab */}
              {activeTab === 'bookings' && (
                <div className="row g-3">
                  {bookings.length === 0 && (
                    <div className="col-12 text-center py-5">
                      <i className="ri-calendar-check-line display-4 text-secondary mb-3"></i>
                      <h5 className="text-secondary">No bookings found</h5>
                      <p className="text-muted">Book service sessions to see them here</p>
                      <a href="/dashboard" className="btn btn-primary-600 mt-2">
                        <i className="ri-calendar-event-line me-1"></i>
                        Book a Session
                      </a>
                    </div>
                  )}
                  {bookings.map((booking) => (
                    <div className="col-12 col-md-6 col-lg-4" key={booking.id}>
                      <div className="card h-100 shadow-sm hover-shadow">
                        <div className="card-body">
                          <div className="d-flex justify-content-between align-items-start mb-3">
                            <h6 className="card-title mb-0">{booking.serviceTitle}</h6>
                            <span className={`badge ${getStatusBadgeClass(booking.status)}`}>
                              {booking.status || 'Scheduled'}
                            </span>
                          </div>
                          
                          {booking.vendorName && (
                            <div className="text-muted small mb-2">
                              <i className="ri-building-line me-1"></i>
                              {booking.vendorName}
                            </div>
                          )}
                          
                          {booking.scheduledDate && (
                            <div className="mb-2">
                              <div className="d-flex align-items-center text-primary-600 mb-1">
                                <i className="ri-calendar-event-fill me-2"></i>
                                <strong>{formatDate(booking.scheduledDate)}</strong>
                              </div>
                              {booking.scheduledSlot && (
                                <div className="d-flex align-items-center text-muted ms-4">
                                  <i className="ri-time-line me-2"></i>
                                  {formatSlot(booking.scheduledSlot)}
                                </div>
                              )}
                            </div>
                          )}
                          
                          {booking.price && booking.price > 0 && (
                            <div className="mb-2">
                              <i className="ri-money-dollar-circle-line me-1"></i>
                              <strong>R {Number(booking.price || 0).toLocaleString()}</strong>
                            </div>
                          )}
                          
                          {booking.bookedAt && (
                            <div className="text-muted small">
                              <i className="ri-calendar-check-line me-1"></i>
                              Booked on {formatDate(booking.bookedAt)}
                            </div>
                          )}
                          
                          <div className="mt-3 pt-3 border-top">
                            <div className="d-flex gap-2">
                              <button 
                                className="btn btn-sm btn-outline-primary flex-grow-1"
                                onClick={() => window.location.href = `/marketplace-details?id=${booking.serviceId}`}
                              >
                                <i className="ri-eye-line me-1"></i>
                                View Service
                              </button>
                              {booking.status?.toLowerCase() === 'scheduled' && (
                                <button 
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => handleUnsubscribe(booking.serviceId)}
                                  disabled={!!busyMap[booking.serviceId]}
                                  title="Cancel booking"
                                >
                                  <i className="ri-close-line"></i>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </MasterLayout>
  );
}
