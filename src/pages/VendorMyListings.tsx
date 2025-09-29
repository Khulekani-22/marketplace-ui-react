// src/pages/VendorMyListings.jsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useMessages } from "../context/useMessages";
import MasterLayout from "../masterLayout/MasterLayout.jsx";
import { useVendor } from "../context/useVendor";
import { useAppSync } from "../context/useAppSync";
import { api } from "../lib/api";
import { fetchMyVendorListings } from "../lib/listings";
import appDataLocal from "../data/appData.json";

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

function listingId(entry) {
  return String(entry?.id || entry?.serviceId || "");
}

function parsePending(raw) {
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function tenantMatches(entryTenant?: string | null, currentTenant?: string | null) {
  const entry = normalizeTenant(entryTenant);
  const current = normalizeTenant(currentTenant);
  if (entry === current) return true;
  if (entry === "public") return true;
  if (current === "public") return true;
  return false;
}

function StatusChip({ s }) {
  const k = (s || "unknown").toLowerCase();
  const map = {
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
  const { vendor, ensureVendorId, loading: vendorLoading } = useVendor();
  const { refresh: refreshMessages, syncMessagesToLive } = useMessages();
  const { appData, appDataLoading } = useAppSync();
  const tenantId = useMemo(() => sessionStorage.getItem("tenantId") || "vendor", []);

  const [items, setItems] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [err, setErr] = useState("");
  const [feedback, setFeedback] = useState({ open: false, listing: null, subject: "", content: "", sending: false, err: null, done: false });
  const pendingKey = useMemo(
    () => makePendingKey(tenantId, vendor?.vendorId || vendor?.email || vendor?.id || ""),
    [tenantId, vendor?.vendorId, vendor?.email, vendor?.id]
  );
  const [pendingLocal, setPendingLocal] = useState([]);

  const newListingFromNav = (location.state as any)?.newListing;

  const persistPending = useCallback(
    (listings) => {
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
    setItems((prev) => {
      if (!prev) return [newListingFromNav];
      const exists = prev.some((i) => String(i?.id || i?.serviceId) === newId);
      if (exists) return prev;
      return [newListingFromNav, ...prev];
    });
    persistPending([
      newListingFromNav,
      ...pendingLocal.filter(
        (i) => String(i?.id || i?.serviceId || "") !== newId
      ),
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
    (listings) => {
      const base = Array.isArray(listings) ? [...listings] : [];
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
        const remaining = [];
        pendingLocal.forEach((entry) => {
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

  // Redirect vendors who are not yet approved to their profile page
  useEffect(() => {
    if (!vendor) return;
    if (!vendor.isApproved) {
      const next = encodeURIComponent("/listings-vendors-mine");
      navigate(`/profile-vendor?next=${next}`, { replace: true });
    }
  }, [vendor, navigate]);

  function unwrapAppData(candidate: any) {
    let cursor = candidate;
    const guard = new Set();
    while (cursor && typeof cursor === "object" && !Array.isArray(cursor?.services)) {
      if (guard.has(cursor)) break;
      guard.add(cursor);
      if (Array.isArray(cursor?.data?.services)) {
        cursor = cursor.data;
        continue;
      }
      if (Array.isArray(cursor?.payload?.services)) {
        cursor = cursor.payload;
        continue;
      }
      if (Array.isArray(cursor?.appData?.services)) {
        cursor = cursor.appData;
        continue;
      }
      break;
    }
    return cursor && typeof cursor === "object" ? cursor : null;
  }

  const deriveFallbackData = useCallback(
    (activeVendor: any) => {
      if (!activeVendor) return { listings: [], bookings: [] };
      const liveDoc = unwrapAppData(appData) || unwrapAppData(appDataLocal) || appDataLocal;
      const tenantKey = normalizeTenant(tenantId);
      const all = Array.isArray(liveDoc?.services) ? liveDoc.services : [];
      const allBookingsRaw = Array.isArray(liveDoc?.bookings) ? liveDoc.bookings : [];
      const scopedBookings = allBookingsRaw.filter((b) => tenantMatches(b?.tenantId, tenantKey));
      const vendorId = String(activeVendor?.vendorId || "");
      const email = String(activeVendor?.email || activeVendor?.contactEmail || "").toLowerCase();
      const name = String(activeVendor?.name || activeVendor?.companyName || "").toLowerCase();
      const mine = all.filter((s) => {
        const sameTenant = tenantMatches(s?.tenantId, tenantKey);
        if (!sameTenant) return false;
        const sid = String(s.vendorId || "");
        const svcEmail = String(s.contactEmail || s.email || "").toLowerCase();
        const svcName = String(s.vendor || "").toLowerCase();
        return (
          (sid && vendorId && sid === vendorId) ||
          (!sid && ((svcName && svcName === name) || (email && svcEmail === email)))
        );
      });

      const idSet = new Set(
        mine
          .flatMap((s) => [String(s.id || ""), String(s.serviceId || ""), String(s.vendorId || "")])
          .filter(Boolean)
      );
      const bookingsForVendor = scopedBookings.filter((b) => {
        const sid = String(b.serviceId || "");
        const vendorMatch = vendorId && String(b.vendorId || "") === vendorId;
        const emailMatch = email && String(b.vendorEmail || "").toLowerCase() === email;
        const nameMatch = name && String(b.vendorName || "").toLowerCase() === name;
        return idSet.has(sid) || vendorMatch || emailMatch || nameMatch;
      });

      return { listings: mine, bookings: bookingsForVendor };
    },
    [appData, tenantId]
  );

  const loadListings = useCallback(
    async ({ signal, silent }: { signal?: AbortSignal; silent?: boolean } = {}) => {
      const markBusy = (val: boolean) => {
        if (silent) setRefreshing(val);
        else setLoading(val);
      };

      markBusy(true);
      setErr("");

      let activeVendorRef = vendor;
      try {
        if (signal?.aborted) return;
        if (vendorLoading && !vendor) return;

        if (!vendor) {
          setItems([]);
          setBookings([]);
          return;
        }

        const ensured = ensureVendorId ? await ensureVendorId() : vendor;
        if (signal?.aborted) return;
        activeVendorRef = ensured || vendor;
        if (!activeVendorRef) {
          setItems([]);
          setBookings([]);
          return;
        }

        const { listings, bookings } = await fetchMyVendorListings({ signal });
        if (signal?.aborted) return;
        const normalizedListings = Array.isArray(listings) ? listings : [];
        const normalizedBookings = Array.isArray(bookings) ? bookings : [];
        const mergedListings = mergeLocalListings(normalizedListings);
        if (!mergedListings.length) {
          const fallback = deriveFallbackData(activeVendorRef);
          if (fallback.listings.length) {
            const mergedFallback = mergeLocalListings(fallback.listings);
            setItems(mergedFallback);
            setBookings(fallback.bookings);
            if (!silent) {
              setErr("Showing cached listings until the live catalog updates.");
            }
          } else {
            setItems(mergedListings);
            setBookings([]);
          }
        } else {
          setItems(mergedListings);
          setBookings(normalizedBookings);
        }
      } catch (e: any) {
        if (signal?.aborted) return;
        const code = e?.code;
        if (code === "ERR_NETWORK") {
          const fallback = deriveFallbackData(activeVendorRef);
          const mergedFallback = mergeLocalListings(fallback.listings);
          setItems(mergedFallback);
          setBookings(fallback.bookings);
          setErr("Showing cached data while the network is unavailable.");
        } else {
          setErr(e?.response?.data?.message || e?.message || "Failed to load listings");
          setItems(mergeLocalListings([]));
          setBookings([]);
        }
      } finally {
        markBusy(false);
      }
    },
    [deriveFallbackData, ensureVendorId, mergeLocalListings, vendor, vendorLoading]
  );

  useEffect(() => {
    const controller = new AbortController();
    loadListings({ signal: controller.signal });
    return () => {
      controller.abort();
    };
  }, [loadListings]);

  const handleRefresh = useCallback(async () => {
    setErr("");
    await loadListings({ silent: true });
  }, [loadListings]);

  const counts = useMemo(() => {
    const c = { approved: 0, pending: 0, rejected: 0 };
    items.forEach((i) => (c[(i.status || "pending").toLowerCase()] ||= 0, c[(i.status || "pending").toLowerCase()]++));
    return c;
  }, [items]);

  const bookingsByService = useMemo(() => {
    const map: Record<string, number> = {};
    bookings.forEach((b) => {
      const sid = String(b.serviceId || "");
      if (!sid) return;
      map[sid] = (map[sid] || 0) + 1;
    });
    return map;
  }, [bookings]);

  const serviceLookup = useMemo(() => {
    const map: Record<string, any> = {};
    items.forEach((s) => {
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
    const list = bookings.map((b) => ({ ...b }));
    list.sort((a, b) => {
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

  function handleDuplicate(i) {
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

  function openFeedback(i) {
    const subj = `Feedback request: ${i.title}`;
    const body = `Hello Admin\n\nMy listing "${i.title}" (ID: ${i.id}) was ${String(i.status || 'rejected')}. Could you please share more details on what needs to be corrected so I can resubmit?\n\nThank you!`;
    setFeedback({ open: true, listing: i, subject: subj, content: body, sending: false, err: null, done: false });
  }
  function closeFeedback() {
    setFeedback({ open: false, listing: null, subject: "", content: "", sending: false, err: null, done: false });
  }
  async function sendFeedback(e) {
    e?.preventDefault?.();
    if (!feedback.listing || !feedback.content.trim()) return;
    setFeedback((f) => ({ ...f, sending: true, err: null }));
    try {
      await api.post(`/api/messages`, {
        listingId: feedback.listing.id,
        listingTitle: feedback.listing.title,
        vendorId: vendor?.vendorId || "",
        vendorEmail: vendor?.email || "",
        subject: feedback.subject,
        content: feedback.content,
      });
      setFeedback((f) => ({ ...f, sending: false, done: true }));
      try { await refreshMessages({ force: true }); await syncMessagesToLive(); } catch {}
      setTimeout(() => closeFeedback(), 1200);
    } catch (e) {
      setFeedback((f) => ({ ...f, sending: false, err: e?.response?.data?.message || e?.message || "Failed to send" }));
    }
  }

  return (
    <MasterLayout activeRoute="/listings-vendors-mine" pageTitle="My listings">
      <div className="container py-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h1 className="h4 mb-0">My listings</h1>
          <div className="d-flex gap-2">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={handleRefresh}
              disabled={loading || refreshing || appDataLoading}
            >
              {refreshing || appDataLoading ? "Refreshing…" : "Refresh"}
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
                    {items.map((i, idx) => {
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
                            to={`/marketplace-details?id=${encodeURIComponent(i.id)}`}
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
                    {bookingsSorted.map((b, idx) => {
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
        {feedback.open && feedback.listing && (
          <div className="position-fixed top-0 start-0 w-100 h-100" style={{ background: "rgba(0,0,0,0.5)", zIndex: 1070 }} onClick={(e) => e.target === e.currentTarget && closeFeedback()}>
            <div className="card" style={{ maxWidth: 560, margin: "10vh auto" }}>
              <div className="card-header d-flex align-items-center justify-content-between">
                <h6 className="mb-0">Message Admin about: {feedback.listing.title}</h6>
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
                    <div className="text-secondary small mt-1">Sent as {vendor?.email || "you"}</div>
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
