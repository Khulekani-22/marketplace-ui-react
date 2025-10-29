// src/pages/VendorMyListings.tsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useMessages } from "../context/useMessages";
import MasterLayout from "../masterLayout/MasterLayout.jsx";
import { useVendor } from "../context/useVendor";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { fetchMyVendorListings } from "../lib/listings";

// Type definitions
interface Listing {
  id?: string;
  serviceId?: string;
  vendorId?: string;
  title: string;
  category?: string;
  price?: number;
  imageUrl?: string;
  description?: string;
  status?: string;
  listingType?: string;
}

interface Booking {
  id?: string;
  serviceId?: string;
  vendorId?: string;
  customerId?: string;
  customerName?: string;
  customerEmail?: string;
  serviceTitle?: string;
  price?: number;
  status?: string;
  scheduledDate?: string;
  scheduledSlot?: string;
  bookedAt?: string;
}

interface Vendor {
  vendorId?: string;
  id?: string;
  name?: string;
  companyName?: string;
  email?: string;
  contactEmail?: string;
  isApproved?: boolean;
  photoURL?: string;
  avatar?: string;
}

interface FeedbackState {
  open: boolean;
  listing: Listing | null;
  subject: string;
  content: string;
  sending: boolean;
  err: string | null;
  done: boolean;
}

type VendorListingsResult = { listings: Listing[]; bookings: Booking[] };

function normalizeTenant(id?: string | null) {
  if (!id) return "public";
  const v = id.toString().toLowerCase();
  return v === "vendor" ? "public" : v;
}

function makePendingKey(tenantId?: string | null, vendorHint?: string | null) {
  const tenant = normalizeTenant(tenantId || "public");
  const vendor = (vendorHint || "").trim().toLowerCase();
  if (!vendor) return null;
  return `vendor_pending_listings:${tenant}:${vendor}`;
}

function listingId(entry: any): string {
  return String(entry?.id || entry?.serviceId || "");
}

function parsePending(raw: any): any[] {
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function StatusChip({ s }: { s?: string }) {
  const k = (s || "unknown").toLowerCase();
  const map: Record<string, string> = {
    approved: "success",
    pending: "warning",
    rejected: "danger",
    scheduled: "info",
    completed: "success",
    canceled: "secondary",
    unknown: "secondary",
  };
  return (
    <span className={`badge text-bg-${map[k] || "secondary"}`}>{k}</span>
  );
}

export default function VendorMyListings() {
  const navigate = useNavigate();
  const location = useLocation();
  const navListingRef = useRef<any>(null);
  const { vendor } = useVendor();
  const { refresh: refreshMessages, syncMessagesToLive, activate: activateMessages, activated: messagesActivated } = useMessages() as any;
  const tenantId = useMemo(() => sessionStorage.getItem("tenantId") || "vendor", []);

  const [refreshing, setRefreshing] = useState(false);
  const [err, setErr] = useState("");
  const [feedback, setFeedback] = useState<FeedbackState>({ 
    open: false, 
    listing: null, 
    subject: "", 
    content: "", 
    sending: false, 
    err: null, 
    done: false 
  });
  const activeVendor = useMemo(() => (vendor ? (vendor as Vendor) : null), [vendor]);

  const pendingKey = useMemo(
    () => makePendingKey(tenantId, activeVendor?.vendorId || activeVendor?.email || activeVendor?.id || ""),
    [tenantId, activeVendor]
  );
  const [pendingLocal, setPendingLocal] = useState<Listing[]>([]);

  useEffect(() => {
    if (!messagesActivated) {
      activateMessages({ silent: true, force: true }).catch(() => void 0);
    }
  }, [activateMessages, messagesActivated]);

  const newListingFromNav = (location.state as any)?.newListing;

  const persistPending = useCallback(
    (listings: Listing[]) => {
      setPendingLocal(listings);
      if (!pendingKey) return;
      if (!listings.length) {
        localStorage.removeItem(pendingKey);
        return;
      }
      try {
        localStorage.setItem(pendingKey, JSON.stringify(listings));
      } catch {
        /* ignore quota */
      }
    },
    [pendingKey]
  );

  useEffect(() => {
    if (!pendingKey) {
      setPendingLocal([]);
      return;
    }
    try {
      const existing = parsePending(localStorage.getItem(pendingKey));
      setPendingLocal(existing);
    } catch {
      setPendingLocal([]);
    }
  }, [pendingKey]);

  useEffect(() => {
    if (!newListingFromNav) return;
    navListingRef.current = newListingFromNav;
    const newId = String(newListingFromNav?.id || newListingFromNav?.serviceId || "");
    persistPending([
      newListingFromNav,
      ...pendingLocal.filter((i: Listing) => String(i?.id || i?.serviceId || "") !== newId),
    ]);
    setErr("");
    navigate(
      {
        pathname: location.pathname,
        search: location.search,
      },
      { replace: true, state: {} }
    );
  }, [newListingFromNav, navigate, location.pathname, location.search, persistPending, pendingLocal]);

  const mergeLocalListings = useCallback(
    (listings: Listing[]): Listing[] => {
      const base: Listing[] = Array.isArray(listings) ? [...listings] : [];
      const seen = new Set(base.map(listingId).filter(Boolean));

      const navListing = navListingRef.current;
      if (navListing) {
        const navId = listingId(navListing);
        if (navId && !seen.has(navId)) {
          base.unshift(navListing);
          seen.add(navId);
        } else {
          navListingRef.current = null;
        }
      }

      if (pendingLocal.length) {
        const remaining: Listing[] = [];
        pendingLocal.forEach((entry: Listing) => {
          const pid = listingId(entry);
          if (!pid) return;
          if (seen.has(pid)) {
            return;
          }
          seen.add(pid);
          base.unshift(entry);
          remaining.push(entry);
        });
        if (remaining.length !== pendingLocal.length) {
          persistPending(remaining);
        }
      }

      return base;
    },
    [pendingLocal, persistPending]
  );

  // Redirect vendors who have not completed a vendor profile yet
  useEffect(() => {
    if (!vendor) return;
    const v = vendor as Vendor;
    const hasVendorId = Boolean(v.vendorId || v.id);
    if (!hasVendorId) {
      const next = encodeURIComponent("/listings-vendors-mine");
      navigate(`/profile-vendor?next=${next}`, { replace: true });
    }
  }, [vendor, navigate]);

  // React Query: fetch listings and bookings
  const vendorKey = useMemo(() => {
    if (!activeVendor) return "";
    return activeVendor.vendorId || activeVendor.email || activeVendor.id || "";
  }, [activeVendor]);

  const vendorListingsQuery = useQuery<VendorListingsResult, Error>({
    queryKey: ["vendorListings", vendorKey, tenantId],
    queryFn: async ({ signal }) => {
      if (!activeVendor) {
        return { listings: [], bookings: [] };
      }
      // Only fetch required fields
      const { listings, bookings } = await fetchMyVendorListings({ signal });
      const normalizedListings = Array.isArray(listings) ? listings : [];
      const normalizedBookings = Array.isArray(bookings) ? bookings : [];
      return {
        listings: mergeLocalListings(normalizedListings),
        bookings: normalizedBookings,
      };
    },
    enabled: !!activeVendor,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  const { data: rawData, error: queryError, isLoading, refetch } = vendorListingsQuery;

  useEffect(() => {
    if (!queryError) return;
    setErr(queryError.message || "Failed to load listings");
  }, [queryError]);

  useEffect(() => {
    if (queryError) return;
    if (isLoading) return;
    if (rawData) {
      setErr("");
    }
  }, [queryError, isLoading, rawData]);

  const data = rawData as VendorListingsResult | undefined;
  const listingsData = data?.listings;
  const bookingsData = data?.bookings;

  const items: Listing[] = useMemo(
    () => (Array.isArray(listingsData) ? listingsData : []),
    [listingsData]
  );
  const bookings: Booking[] = useMemo(
    () => (Array.isArray(bookingsData) ? bookingsData : []),
    [bookingsData]
  );
  const loading = isLoading;

  const handleRefresh = useCallback(async () => {
    setErr("");
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { approved: 0, pending: 0, rejected: 0 };
    items.forEach((i: Listing) => {
      const status = (i.status || "pending").toLowerCase();
      c[status] = (c[status] || 0) + 1;
    });
    return c;
  }, [items]);

  const bookingsByService = useMemo(() => {
    const map: Record<string, number> = {};
    bookings.forEach((b: Booking) => {
      const sid = String(b.serviceId || "");
      if (!sid) return;
      map[sid] = (map[sid] || 0) + 1;
    });
    return map;
  }, [bookings]);

  const serviceLookup = useMemo(() => {
    const map: Record<string, Listing> = {};
    items.forEach((s: Listing) => {
      const keys = [String(s.id || ""), String(s.serviceId || ""), String(s.vendorId || "")].filter(Boolean);
      keys.forEach((k) => {
        map[k] = s;
      });
    });
    return map;
  }, [items]);

  function formatHourLabel(hour: number) {
    const normalized = ((hour + 11) % 12) + 1;
    const period = hour >= 12 ? "PM" : "AM";
    return `${normalized}:00 ${period}`;
  }

  function formatSlot(slot?: string) {
    if (!slot) return "";
    const [hStr] = slot.split(":");
    const start = Number(hStr);
    if (Number.isNaN(start)) return slot;
    return `${formatHourLabel(start)} – ${formatHourLabel(start + 1)}`;
  }

  function parseBookingDate(booking: any) {
    if (booking?.scheduledDate) {
      const slot = booking.scheduledSlot || "00:00";
      const iso = `${booking.scheduledDate}T${slot.length === 5 ? slot : `${slot}:00`}`;
      const dt = new Date(iso);
      if (!Number.isNaN(dt.getTime())) return dt;
    }
    if (booking?.bookedAt) {
      const dt = new Date(booking.bookedAt);
      if (!Number.isNaN(dt.getTime())) return dt;
    }
    return null;
  }

  const bookingsSorted = useMemo(() => {
    const list: Booking[] = bookings.map((b: Booking) => ({ ...b }));
    list.sort((a: Booking, b: Booking) => {
      const da = parseBookingDate(a)?.getTime() ?? 0;
      const db = parseBookingDate(b)?.getTime() ?? 0;
      return da - db;
    });
    return list;
  }, [bookings]);

  function formatBookingDate(dt: Date | null) {
    if (!dt) return { date: "—", time: "" };
    return {
      date: dt.toLocaleDateString(),
      time: dt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
    };
  }

  function handleDuplicate(i: Listing) {
    // Prefill the vendor form from this listing
    const prefill = encodeURIComponent(
      JSON.stringify({
        title: i.title,
        category: i.category,
        price: i.price,
        imageUrl: i.imageUrl,
        description: i.description,
        listingType: i.listingType || "service",
      })
    );
    navigate(`/listings-vendors?prefill=${prefill}`);
  }

  function openFeedback(i: Listing) {
    const subj = `Feedback request: ${i.title}`;
    const body = `Hello Admin\n\nMy listing "${i.title}" (ID: ${i.id}) was ${String(i.status || "rejected")}. Could you please share more details on what needs to be corrected so I can resubmit?\n\nThank you!`;
    setFeedback({ open: true, listing: i, subject: subj, content: body, sending: false, err: null, done: false });
  }
  
  function openGeneralFeedback() {
    const subj = `General inquiry from ${(vendor as Vendor)?.name || (vendor as Vendor)?.companyName || "vendor"}`;
    const body = "Hello Admin\n\nI have a question/concern regarding my vendor account or listings.\n\n[Please describe your question or concern here]\n\nThank you for your assistance!";
    setFeedback({ open: true, listing: null, subject: subj, content: body, sending: false, err: null, done: false });
  }
  
  function closeFeedback() {
    setFeedback({ open: false, listing: null, subject: "", content: "", sending: false, err: null, done: false });
  }
  async function sendFeedback(e: any) {
    e?.preventDefault?.();
    if (!feedback.content.trim()) return;
    setFeedback((f) => ({ ...f, sending: true, err: null }));
    try {
      // Prepare message data in the format expected by the backend routes
      const messageData: any = {
        listingId: feedback.listing ? (feedback.listing as any).id || "general" : "general-admin-message",
        listingTitle: feedback.listing ? (feedback.listing as any).title || "General Feedback" : "General Admin Message",
        vendorId: (vendor as any)?.vendorId || (vendor as any)?.id || "",
        vendorEmail: (vendor as any)?.email || (vendor as any)?.contactEmail || "",
        subject: feedback.subject,
        content: feedback.content
      };
      
      await api.post(`/api/messages`, messageData);
      setFeedback((f) => ({ ...f, sending: false, done: true }));
      try {
        await activateMessages({ silent: true, force: true }).catch(() => void 0);
        await (refreshMessages as any)({ force: true }); 
        await (syncMessagesToLive as any)(); 
      } catch {}
      setTimeout(() => closeFeedback(), 1200);
    } catch (e: any) {
      setFeedback((f) => ({ ...f, sending: false, err: e?.response?.data?.message || e?.message || "Failed to send" }));
    }
  }

  return (
    <MasterLayout>
      <div className="container py-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h1 className="h4 mb-0">My listings</h1>
          <div className="d-flex gap-2">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={handleRefresh}
              disabled={loading || refreshing}
            >
              {refreshing ? "Refreshing…" : "Refresh"}
            </button>
            <button
              type="button"
              className="btn btn-outline-primary"
              onClick={() => openGeneralFeedback()}
              title="Contact admin about any questions or concerns"
            >
              <i className="bi bi-envelope me-1"></i>
              Message Admin
            </button>
            <Link to="/listings-vendors" className="btn btn-primary">
              + Submit new listing
            </Link>
          </div>
        </div>

        <div className="d-flex gap-2 flex-wrap mb-3">
          <span className="badge text-bg-success">Approved: {counts.approved}</span>
          <span className="badge text-bg-warning">Pending: {counts.pending}</span>
          <span className="badge text-bg-danger">Rejected: {counts.rejected}</span>
          <span className="badge text-bg-secondary">Total: {items.length}</span>
        </div>

        <div className="card">
          <div className="card-body">
            {err && <div className="alert alert-danger">{err}</div>}
            {loading && <div className="text-muted">Loading…</div>}

            {!loading && !items.length && (
              <div className="text-muted">
                You haven’t submitted any listings yet.{" "}
                <Link to="/listings-vendors">Create your first one.</Link>
              </div>
            )}

            {!loading && !!items.length && (
              <div className="table-responsive">
                <table className="table align-middle">
                  <thead>
                    <tr>
                      <th style={{ width: 72 }}></th>
                      <th>Title</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Status</th>
                      <th>Bookings</th>
                      <th style={{ width: 220 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((i: Listing, idx: number) => {
                      const serviceKey = String(i.id || i.serviceId || i.vendorId || "");
                      return (
                      <tr key={serviceKey || idx}>
                        <td>
                          <img
                            src={i.imageUrl || "/assets/images/placeholder-4x3.png"}
                            alt=""
                            style={{ width: 64, height: 40, objectFit: "cover", borderRadius: 6 }}
                          />
                        </td>
                        <td className="fw-semibold">{i.title}</td>
                        <td>{i.category || "—"}</td>
                        <td>R{Number(i.price || 0).toLocaleString()}</td>
                        <td><StatusChip s={i.status} /></td>
                        <td>{bookingsByService[serviceKey] || 0}</td>
                        <td className="d-flex gap-2">
                          {/* If you have a details page, point to it here */}
                          <Link
                            className="btn btn-outline-secondary btn-sm"
                            to={`/marketplace-details?id=${encodeURIComponent(i.id || "")}`}
                          >
                            View
                          </Link>
                          <button
                            className="btn btn-outline-primary btn-sm"
                            onClick={() => handleDuplicate(i)}
                          >
                            Duplicate & edit
                          </button>
                          {String(i.status || "").toLowerCase() === "rejected" && (
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => openFeedback(i)}
                              title="Ask admin why this was rejected"
                            >
                              Message Admin
                            </button>
                          )}
                          {/* You can add “withdraw” for pending later; it needs a safe server API */}
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
        <div className="card mt-4">
          <div className="card-header d-flex justify-content-between align-items-center">
            <h6 className="mb-0">Bookings</h6>
            <span className="badge text-bg-secondary">Total: {bookings.length}</span>
          </div>
          <div className="card-body">
            {!bookings.length && <div className="text-muted">No bookings yet. Once customers reserve sessions, they will appear here.</div>}
            {!!bookings.length && (
              <div className="table-responsive">
                <table className="table align-middle">
                  <thead>
                    <tr>
                      <th>Service</th>
                      <th>Customer</th>
                      <th>Scheduled</th>
                      <th>Status</th>
                      <th className="text-end">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookingsSorted.map((b: Booking, idx: number) => {
                      const dt = parseBookingDate(b);
                      const { date, time } = formatBookingDate(dt);
                      const slotLabel = formatSlot(b.scheduledSlot);
                      const service = serviceLookup[String(b.serviceId || "")];
                      const title = b.serviceTitle || service?.title || "Unknown service";
                      const price = Number(b.price || service?.price || 0) || 0;
                      const key = String(
                        b.id ||
                        [b.serviceId, b.customerId, b.scheduledDate, b.scheduledSlot, b.bookedAt]
                          .filter(Boolean)
                          .join("-") ||
                        idx
                      );
                      return (
                        <tr key={key}>
                          <td>
                            <div className="d-flex flex-column">
                              <span className="fw-semibold">{title}</span>
                              {service?.id && (
                                <Link className="small" to={`/marketplace-details?id=${encodeURIComponent(service.id)}`}>Open listing</Link>
                              )}
                            </div>
                          </td>
                          <td>
                            <div className="small text-muted">{b.customerName || b.customerEmail || "—"}</div>
                          </td>
                          <td>
                            <div className="d-flex flex-column small">
                              <span>{date}</span>
                              <span>{slotLabel || time}</span>
                            </div>
                          </td>
                          <td><StatusChip s={b.status || "pending"} /></td>
                          <td className="text-end">R{price.toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
        {feedback.open && (
          <div className="position-fixed top-0 start-0 w-100 h-100" style={{ background: "rgba(0,0,0,0.5)", zIndex: 1070 }} onClick={(e) => e.target === e.currentTarget && closeFeedback()}>
            <div className="card" style={{ maxWidth: 560, margin: "10vh auto" }}>
              <div className="card-header d-flex align-items-center justify-content-between">
                <h6 className="mb-0">
                  {feedback.listing 
                    ? `Message Admin about: ${feedback.listing.title}`
                    : "Message Admin"
                  }
                </h6>
                <button className="btn btn-sm btn-outline-secondary" onClick={closeFeedback}>Close</button>
              </div>
              <form onSubmit={sendFeedback}>
                <div className="card-body">
                  {feedback.err && <div className="alert alert-danger py-2 mb-2">{feedback.err}</div>}
                  {feedback.done && <div className="alert alert-success py-2 mb-2">Sent</div>}
                  <div className="mb-2">
                    <label className="form-label">Subject</label>
                    <input className="form-control" value={feedback.subject} onChange={(e) => setFeedback((f)=>({ ...f, subject: e.target.value }))} />
                  </div>
                  <div className="mb-2">
                    <label className="form-label">Message</label>
                    <textarea className="form-control" rows={6} value={feedback.content} onChange={(e) => setFeedback((f)=>({ ...f, content: e.target.value }))} />
                    <div className="text-secondary small mt-1">Sent as {(vendor as Vendor)?.email || "you"}</div>
                  </div>
                </div>
                <div className="card-footer d-flex justify-content-end gap-2">
                  <button type="button" className="btn btn-outline-secondary" onClick={closeFeedback} disabled={feedback.sending}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={feedback.sending || !feedback.content.trim()}>{feedback.sending ? 'Sending…' : 'Send'}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </MasterLayout>
  );
}
