// src/pages/VendorMyListings.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMessages } from "../context/MessagesContext.jsx";
import MasterLayout from "../masterLayout/MasterLayout.jsx";
import { useVendor } from "../context/VendorContext";
import appDataLocal from "../data/appData.json";
import { api } from "../lib/api";

const API_BASE = "/api/lms";

function StatusChip({ s }) {
  const k = (s || "unknown").toLowerCase();
  const map = {
    approved: "success",
    pending: "warning",
    rejected: "danger",
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
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState({ open: false, listing: null, subject: "", content: "", sending: false, err: null, done: false });

  // Redirect vendors who are not yet approved to their profile page
  useEffect(() => {
    if (!vendor) return;
    if (!vendor.isApproved) {
      const next = encodeURIComponent("/listings-vendors-mine");
      navigate(`/profile-vendor?next=${next}`, { replace: true });
    }
  }, [vendor, navigate]);

  // load live listings and filter to this vendor
  useEffect(() => {
    ensureVendorId();
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/live`, {
          headers: { "x-tenant-id": tenantId },
        });
        const live = res.ok ? await res.json() : appDataLocal;
        const all = Array.isArray(live?.services) ? live.services : [];
        const my = all.filter(
          (s) =>
            (s.vendorId && vendor?.vendorId && s.vendorId === vendor.vendorId) ||
            (!s.vendorId &&
              (s.vendor?.toLowerCase() === (vendor?.name || "").toLowerCase() ||
                s.contactEmail?.toLowerCase() === (vendor?.email || "").toLowerCase()))
        );
        if (!cancelled) setItems(my);
      } catch {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tenantId, vendor, ensureVendorId]);

  const counts = useMemo(() => {
    const c = { approved: 0, pending: 0, rejected: 0 };
    items.forEach((i) => (c[(i.status || "pending").toLowerCase()] ||= 0, c[(i.status || "pending").toLowerCase()]++));
    return c;
  }, [items]);

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
                      <th style={{ width: 220 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((i) => (
                      <tr key={i.id}>
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
                    ))}
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
