// src/pages/VendorMyListings.jsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMessages } from "../context/useMessages";
import MasterLayout from "../masterLayout/MasterLayout.jsx";
import { useVendor } from "../context/useVendor";
import appDataLocal from "../data/appData.json";
import { api } from "../lib/api";

const API_BASE = "/api/lms";

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
  const { vendor, ensureVendorId } = useVendor();
  const { refresh: refreshMessages, syncMessagesToLive } = useMessages();
  const tenantId = useMemo(
    () => sessionStorage.getItem("tenantId") || "vendor",
    []
  );

  const [items, setItems] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [err, setErr] = useState("");
  const [feedback, setFeedback] = useState({ open: false, listing: null, subject: "", content: "", sending: false, err: null, done: false });

  // Redirect vendors who are not yet approved to their profile page
  useEffect(() => {
    if (!vendor) return;
    if (!vendor.isApproved) {
      const next = encodeURIComponent("/listings-vendors-mine");
      navigate(`/profile-vendor?next=${next}`, { replace: true });
    }
  }, [vendor, navigate]);

  const loadListings = useCallback(
    async ({ silent, signal }: { silent?: boolean; signal?: AbortSignal } = {}) => {
      if (silent) setRefreshing(true);
      else setLoading(true);
      setErr("");
      try {
        const ensured = ensureVendorId ? await ensureVendorId() : vendor;
        const activeVendor = ensured || vendor;
        if (!activeVendor) {
          if (!signal?.aborted) setItems([]);
          return;
        }

        const { data } = await api.get(`${API_BASE}/live`, {
          headers: { "x-tenant-id": tenantId },
          suppressToast: true,
          suppressErrorLog: true,
        } as any);
        const livePayload = data && typeof data === "object" ? data : {};
        const liveRaw = livePayload && typeof livePayload.data === "object" ? livePayload.data : livePayload;
        const live = liveRaw && typeof liveRaw === "object" && Object.keys(liveRaw).length > 0 ? liveRaw : appDataLocal;
        const tenantKey = tenantId === "vendor" ? "public" : tenantId;
        const all = Array.isArray(live?.services) ? live.services : [];
        const allBookingsRaw = Array.isArray(live?.bookings) ? live.bookings : [];
        const scopedBookings = allBookingsRaw.filter((b) => (b.tenantId ?? "public") === tenantKey);
        const vendorId = activeVendor.vendorId || "";
        const email = (activeVendor.email || "").toLowerCase();
        const name = (activeVendor.name || "").toLowerCase();
        const my = all.filter((s) => {
          const sameTenant = (s.tenantId ?? "public") === tenantKey;
          if (!sameTenant) return false;
          return (
            (s.vendorId && vendorId && String(s.vendorId) === String(vendorId)) ||
            (!s.vendorId &&
              (String(s.vendor || "").toLowerCase() === name ||
                String(s.contactEmail || "").toLowerCase() === email))
          );
        });
        if (!signal?.aborted) {
          setItems(my);
          const idSet = new Set(
            my.flatMap((s) => [String(s.id || ""), String(s.serviceId || ""), String(s.vendorId || "")]).filter(Boolean)
          );
          const bookingsForVendor = scopedBookings.filter((b) => {
            const sid = String(b.serviceId || "");
            const vendorMatch = vendorId && String(b.vendorId || "") === String(vendorId);
            const emailMatch = email && String(b.vendorEmail || "").toLowerCase() === email;
            const nameMatch = name && String(b.vendorName || "").toLowerCase() === name;
            return idSet.has(sid) || vendorMatch || emailMatch || nameMatch;
          });
          setBookings(bookingsForVendor);
        }
      } catch (e: any) {
        if (!signal?.aborted) {
          setErr(e?.message || "Failed to load listings");
          setItems([]);
          setBookings([]);
        }
      } finally {
        if (signal?.aborted) return;
        if (silent) setRefreshing(false);
        else setLoading(false);
      }
    },
    [tenantId, vendor, ensureVendorId]
  );

  // load live listings and filter to this vendor
  useEffect(() => {
    const controller = new AbortController();
    loadListings({ silent: false, signal: controller.signal });
    return () => controller.abort();
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
      try { await refreshMessages(); await syncMessagesToLive(); } catch {}
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
              onClick={() => loadListings({ silent: true })}
              disabled={loading || refreshing}
            >
              {refreshing ? "Refreshing…" : "Refresh"}
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
