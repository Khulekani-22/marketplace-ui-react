// src/components/TrendingNFTsOne.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "../../lib/firebase";
import { api } from "../../lib/api";
import appData from "../../data/appData.json";
import { fetchMySubscriptions, subscribeToService, unsubscribeFromService } from "../../lib/subscriptions";

const API_BASE = "/api/lms";

// Normalize any legacy keys so the card always has the fields your UI expects
const normalize = (s) => ({
  ...s,
  vendor: s.vendor ?? s.vendorName ?? "",
  imageUrl: s.imageUrl ?? s.thumbnail ?? "",
  category: s.category ?? s.categoryId ?? "",
  rating: typeof s.rating === "number" ? s.rating : Number(s.rating || 0),
  reviews: Array.isArray(s.reviews) ? s.reviews : [],
  // default to "approved" for older data that doesn't have status
  status: (s.status ?? "approved").toString().toLowerCase(),
});

// Only show approved items to end users
const isApproved = (s) => s.status === "approved";

const TrendingNFTsOne = () => {
  const tenantId = useMemo(
    () => sessionStorage.getItem("tenantId") || "vendor",
    []
  );

  // Start with local file as an immediate render fallback (approved only)
  const baseApproved = useMemo(
    () => (appData.services || []).map(normalize).filter(isApproved),
    []
  );
  const [services, setServices] = useState(baseApproved);
  const servicesRef = useRef(baseApproved);
  const versionRef = useRef(0); // guards against stale fetch overwriting fresher state
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("All");
  const [query, setQuery] = useState("");
  const [reviews, setReviews] = useState({}); // serviceId -> { rating, comment }
  const [modal, setModal] = useState({ open: false, id: null, showAll: false, page: 0 });
  const [toast, setToast] = useState("");
  const [toastType, setToastType] = useState("success"); // success | danger
  const [busy, setBusy] = useState(false);
  const [subs, setSubs] = useState(() => new Set()); // serviceId set
  const navigate = useNavigate();

  function pickFresher(a = {}, b = {}) {
    const ca = Number(a.reviewCount || (Array.isArray(a.reviews) ? a.reviews.length : 0) || 0);
    const cb = Number(b.reviewCount || (Array.isArray(b.reviews) ? b.reviews.length : 0) || 0);
    const ta = Date.parse(a.lastReviewedAt || "") || 0;
    const tb = Date.parse(b.lastReviewedAt || "") || 0;
    if (cb > ca) return b;
    if (cb < ca) return a;
    if (tb > ta) return b;
    return a;
  }

  function mergeLists(currentList, baseList, liveList) {
    const map = new Map();
    baseList.forEach((s) => map.set(String(s.id), s));
    liveList.forEach((s) => map.set(String(s.id), s)); // live over base
    // preserve fresher review info already shown in UI
    currentList.forEach((c) => {
      const id = String(c.id);
      const existing = map.get(id) || {};
      const chosen = pickFresher(existing, c);
      // keep non-review fields from existing (live/base) but replace review fields with the fresher one
      map.set(id, {
        ...existing,
        reviews: Array.isArray(chosen.reviews) ? chosen.reviews : existing.reviews,
        reviewCount: Number(chosen.reviewCount || (Array.isArray(chosen.reviews) ? chosen.reviews.length : existing.reviewCount || 0) || 0),
        rating: typeof chosen.rating === 'number' ? chosen.rating : Number(chosen.rating || existing.rating || 0),
        lastReviewedAt: chosen.lastReviewedAt || existing.lastReviewedAt,
      });
    });
    return Array.from(map.values());
  }

  async function refreshFromLive() {
    const startVer = versionRef.current;
    const { data: live } = await api.get(`/api/lms/live`);
    const liveApproved = (live?.services || []).map(normalize).filter(isApproved);
    const merged = mergeLists(servicesRef.current ?? services, baseApproved, liveApproved);
    if (startVer === versionRef.current) setServices(merged);
  }

  // Load live data from backend; fall back silently on any error
  useEffect(() => {
    let cancelled = false;
    const startVer = versionRef.current;
    (async () => {
      try {
        const { data: live } = await api.get(`/api/lms/live`);
        const liveApproved = (live?.services || []).map(normalize).filter(isApproved);
        const merged = mergeLists(servicesRef.current ?? services, baseApproved, liveApproved);
        if (!cancelled && startVer === versionRef.current) setServices(merged);
      } catch {
        // ignore; keep bundled data
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tenantId]);

  // Load my subscriptions (if authed)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!auth.currentUser) return;
        const items = await fetchMySubscriptions();
        if (cancelled) return;
        const set = new Set(items.filter((x)=> (x.type||'service')==='service').map((x)=> String(x.serviceId)));
        setSubs(set);
      } catch {}
    })();
    return () => { cancelled = true; };
  }, []);

  async function toggleSubscribe(serviceId) {
    try {
      if (!auth.currentUser) {
        navigate('/login', { replace: true, state: { from: window.location?.pathname || '/' } });
        return;
      }
      const id = String(serviceId);
      const isSub = subs.has(id);
      if (isSub) {
        await unsubscribeFromService(id);
        setSubs((prev) => {
          const n = new Set(Array.from(prev)); n.delete(id); return n;
        });
        setToastType('success'); setToast('Unsubscribed'); setTimeout(()=>setToast(''), 2000);
      } else {
        await subscribeToService(id);
        setSubs((prev) => new Set([...Array.from(prev), id]));
        setToastType('success'); setToast('Subscribed'); setTimeout(()=>setToast(''), 2000);
      }
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || 'Failed to update subscription';
      setToastType('danger'); setToast(msg); setTimeout(()=>setToast(''), 2500);
    }
  }

  // Categories reflect whatever data we ended up with (approved only)
  const categories = useMemo(() => {
    const uniq = Array.from(
      new Set(
        services
          .map((s) => (s.category || "").trim())
          .filter(Boolean)
      )
    );
    return ["All", ...uniq];
  }, [services]);

  const filteredServices = useMemo(() => {
    const tab = activeTab.toLowerCase();
    const q = (query || "").trim().toLowerCase();
    let base = activeTab === "All"
      ? services
      : services.filter((s) => (s.category || "").trim().toLowerCase() === tab);
    if (!q) return base;
    return base.filter((s) => {
      const hay = [
        s.title || "",
        s.vendor || "",
        s.category || "",
        s.description || s.summary || "",
        Array.isArray(s.tags) ? s.tags.join(" ") : "",
      ]
        .join(" \n ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [services, activeTab, query]);

  // Keep a live ref of services to avoid stale closures during async merges
  useEffect(() => {
    servicesRef.current = services;
  }, [services]);

  // --- Reviews helpers ---
  function setField(id, k, v) {
    setReviews((prev) => ({ ...prev, [id]: { ...(prev[id] || {}), [k]: v } }));
  }
  function openReview(id) {
    setModal({ open: true, id, showAll: false, page: 0 });
    if (!reviews[id]) setReviews((p) => ({ ...p, [id]: { rating: 0, comment: "" } }));
  }
  function closeReview() {
    setModal({ open: false, id: null, showAll: false, page: 0 });
  }
  function setStar(id, n) { setField(id, "rating", n); }
  function renderStars(n) {
    const v = Number(n || 0);
    return (
      <span>
        {[1,2,3,4,5].map(i => (
          <span key={i} style={{ color: v >= i ? "#f5a623" : "#ccc", fontSize: 16 }}>★</span>
        ))}
      </span>
    );
  }
  function sortReviews(list) {
    const arr = Array.isArray(list) ? list.slice() : [];
    arr.sort((a,b) => (Date.parse(b?.createdAt||"")||0) - (Date.parse(a?.createdAt||"")||0));
    return arr;
  }
  const pageSize = 5;
  function nextPage(total) {
    const max = Math.max(0, Math.ceil(total / pageSize) - 1);
    setModal((m) => ({ ...m, page: Math.min(max, (m.page || 0) + 1) }));
  }
  function prevPage() { setModal((m) => ({ ...m, page: Math.max(0, (m.page || 0) - 1) })); }
  async function submitReview(id) {
    const r = Number(reviews[id]?.rating || 0);
    const comment = (reviews[id]?.comment || "").trim();
    if (Number.isNaN(r) || r < 1 || r > 5) {
      setToastType("danger");
      setToast("Please select a star rating (1–5).");
      setTimeout(() => setToast(""), 2500);
      return;
    }
    setBusy(true);
    try {
      const email = auth.currentUser?.email || "";
      const author = auth.currentUser?.displayName || (email ? email.split("@")[0] : "Guest");
      const svc = services.find((s) => s.id === id) || {};
      const { data } = await api.post(`/api/data/services/${encodeURIComponent(id)}/reviews`, {
        rating: r,
        comment,
        author,
        authorEmail: email,
        title: svc.title || "",
        vendor: svc.vendor || "",
        contactEmail: (svc.contactEmail || svc.email || "")
      });
      // normalize returned service and replace it
      const updated = normalize(data);
      versionRef.current += 1;
      setServices((prev) => prev.map((s) => (s.id === id ? updated : s)));
      setToastType("success");
      setToast("Review submitted. Thank you!");
      setTimeout(() => setToast(""), 2500);
      closeReview();
      // short delayed refresh to reconcile with live store (handles multi-tab updates)
      setTimeout(() => {
        refreshFromLive().catch(() => void 0);
      }, 800);
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || "Failed to submit review";
      setToastType("danger");
      setToast(msg);
      setTimeout(() => setToast(""), 2500);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="col-12">
      <div className="mb-16 mt-8 d-flex flex-wrap justify-content-between align-items-center gap-12">
        <h6 className="mb-0">All Listings</h6>
        <div className="d-flex flex-wrap align-items-center gap-12">
          <div className="position-relative">
            <input
              type="text"
              className="form-control form-control-sm rounded-3 border-1 border-neutral-300 bg-neutral-100 text-sm ps-12 pe-32 py-8"
              placeholder="Search listings by name, vendor, category…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ minWidth: 260 }}
              aria-label="Search listings"
            />
            {query && (
              <button
                type="button"
                className="btn btn-sm btn-link position-absolute end-0 top-50 translate-middle-y me-2"
                onClick={() => setQuery("")}
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>
          <ul className="nav button-tab nav-pills mb-0 gap-12" role="tablist">
          {categories.map((category) => (
            <li className="nav-item" key={category} role="presentation">
              <button
                className={`nav-link btn btn-sm rounded-pill text-neutral-500 hover-text-white bg-neutral-300 bg-hover-primary-800 rounded-pill px-20 py-6 border border-neutral-300 ${
                  activeTab === category ? "active" : ""
                }`}
                onClick={() => setActiveTab(category)}
              >
                {category}
              </button>
            </li>
          ))}
          </ul>
        </div>
      </div>

      <div className="tab-content">
        <div className="tab-pane fade show active">
          <div className="row g-3">
            {loading && (
              <div className="col-12 text-center text-secondary-light">
                Loading listings…
              </div>
            )}

            {!loading &&
              filteredServices.map((service) => (
                <div className="col-12 col-md-6 col-lg-3" key={service.id}>
                  <div className="card bg-base radius-16 overflow-hidden h-100">
                    <div className="row g-0 align-items-stretch">
                      <div className="col-auto">
                        <img
                          style={{ width: 150, height: '100%', maxHeight: 200, objectFit: 'cover' }}
                          src={service.imageUrl}
                          alt={service.title}
                          className="d-block"
                        />
                      </div>
                      <div className="col">
                        <div className="p-12 d-flex flex-column h-100">
                          <div className="d-flex align-items-start justify-content-between gap-2">
                            <h6 className="text-md fw-bold text-primary-light mb-1">{service.title}</h6>
                            <span className="text-sm fw-semibold text-primary-600">★ {Number(service.rating || 0).toFixed(1)}</span>
                          </div>
                          <div className="text-secondary small mb-2">{service.vendor}{service.category ? ` · ${service.category}` : ''}</div>
                          <div className="mt-auto d-flex align-items-center justify-content-between gap-8 flex-wrap">
                            <span className="text-sm text-secondary-light fw-medium">
                              Price: <span className="text-sm text-primary-light fw-semibold">R{Number(service.price || 0).toLocaleString()}</span>
                            </span>
                            <div className="d-flex align-items-center gap-8">
                              <button
                                type="button"
                                onClick={() => openReview(service.id)}
                                className="btn btn-sm rounded-pill border text-neutral-500 border-neutral-700 radius-8 px-12 py-6 bg-hover-primary-700 text-hover-white"
                              >
                                {(service.reviews?.length || service.reviewCount || 0) > 0 ? 'Reviews' : 'Write a review'}
                              </button>
                              <button
                                type="button"
                                className={subs.has(String(service.id)) ? "btn btn-sm rounded-pill bg-neutral-200 text-neutral-900 radius-8 px-12 py-6" : "btn btn-sm rounded-pill text-primary-50 hover-text-primary-200 bg-primary-500 bg-hover-primary-800 radius-8 px-12 py-6"}
                                onClick={() => toggleSubscribe(service.id)}
                              >
                                {subs.has(String(service.id)) ? 'Subscribed' : 'Subscribe'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

            {!loading && filteredServices.length === 0 && (
              <div className="col-12 text-center text-secondary-light">
                No services found in this category.
              </div>
            )}
          </div>
        </div>
      </div>
      {toast && (
        <div className="position-fixed top-0 end-0 p-3" style={{ zIndex: 1080 }}>
          <div className={`toast show align-items-center ${toastType === 'danger' ? 'text-bg-danger' : 'text-bg-success'} border-0`}>
            <div className="d-flex">
              <div className="toast-body">{toast}</div>
              <button type="button" className="btn-close btn-close-white me-2 m-auto" onClick={() => setToast("")}></button>
            </div>
          </div>
        </div>
      )}

      {modal.open && (
        (() => {
          const svc = services.find((s) => s.id === modal.id);
          if (!svc) return null;
          const total = Array.isArray(svc.reviews) ? svc.reviews.length : 0;
          const all = sortReviews(svc.reviews);
          const recent = all.slice(0,3);
          const start = (modal.page || 0) * pageSize;
          const page = all.slice(start, start + pageSize);
          const maxPage = Math.max(0, Math.ceil(total / pageSize) - 1);
          return (
            <div className="position-fixed top-0 start-0 w-100 h-100" style={{ background: "rgba(0,0,0,0.5)", zIndex: 1070 }} onClick={(e)=> e.target === e.currentTarget && closeReview()}>
              <div className="card" style={{ maxWidth: 520, margin: "10vh auto" }}>
                <div className="card-header d-flex align-items-center justify-content-between">
                  <h6 className="mb-0">Review: {svc.title}</h6>
                  <button className="btn btn-sm btn-outline-secondary" onClick={closeReview}>Close</button>
                </div>
                <div className="card-body">
                  {/* Context: who and which vendor */}
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <div className="text-secondary small">
                      You are reviewing as: <strong>{auth.currentUser?.email || 'Guest'}</strong>
                    </div>
                    <div className="text-secondary small">
                      Vendor: <strong>{svc.vendor || 'Unknown'}</strong>
                    </div>
                  </div>
                  {(!svc.reviews || svc.reviews.length === 0) && (
                    <div className="alert alert-info py-2">
                      {Number(svc.reviewCount || 0) > 0
                        ? `We have ${Number(svc.reviewCount)} review(s) in aggregate, but no individual reviews to display yet.`
                        : 'No reviews yet. Be the first to write one!'}
                    </div>
                  )}
                  {!modal.showAll && recent.length > 0 && (
                    <div className="mb-3">
                      <div className="fw-semibold mb-2">Recent reviews</div>
                      <div className="list-group list-group-flush">
                        {recent.map((rv, idx) => (
                          <div key={rv.id || idx} className="list-group-item px-0">
                            <div className="d-flex align-items-center justify-content-between">
                              <div className="d-flex align-items-center gap-2">
                                {renderStars(rv.rating)}
                                <span className="text-secondary small">{rv.author || rv.authorEmail || "Anonymous"}</span>
                              </div>
                              <span className="text-secondary small">{rv.createdAt ? new Date(rv.createdAt).toLocaleDateString() : ""}</span>
                            </div>
                            {rv.comment && <div className="small mt-1">{rv.comment}</div>}
                          </div>
                        ))}
                      </div>
                      {total > 3 && (
                        <button type="button" className="btn btn-sm btn-outline-secondary mt-2" onClick={() => setModal((m)=>({ ...m, showAll: true, page: 0 }))}>
                          See all reviews ({total})
                        </button>
                      )}
                    </div>
                  )}
                  {modal.showAll && (
                    <div className="mb-3">
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <div className="fw-semibold">All reviews ({total})</div>
                        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setModal((m)=>({ ...m, showAll: false, page: 0 }))}>Back</button>
                      </div>
                      <div className="list-group list-group-flush">
                        {page.map((rv, idx) => (
                          <div key={rv.id || `${idx}-${start}`} className="list-group-item px-0">
                            <div className="d-flex align-items-center justify-content-between">
                              <div className="d-flex align-items-center gap-2">
                                {renderStars(rv.rating)}
                                <span className="text-secondary small">{rv.author || rv.authorEmail || "Anonymous"}</span>
                              </div>
                              <span className="text-secondary small">{rv.createdAt ? new Date(rv.createdAt).toLocaleDateString() : ""}</span>
                            </div>
                            {rv.comment && <div className="small mt-1">{rv.comment}</div>}
                          </div>
                        ))}
                      </div>
                      <div className="d-flex align-items-center justify-content-between mt-2">
                        <span className="text-secondary small">Page {(modal.page || 0) + 1} of {maxPage + 1}</span>
                        <div className="d-flex gap-2">
                          <button className="btn btn-sm btn-outline-secondary" onClick={prevPage} disabled={(modal.page || 0) <= 0}>Prev</button>
                          <button className="btn btn-sm btn-outline-secondary" onClick={() => nextPage(total)} disabled={(modal.page || 0) >= maxPage}>Next</button>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="mb-3">
                    {[1,2,3,4,5].map((n) => (
                      <button key={n} type="button" onClick={() => setStar(svc.id, n)} className="btn btn-link p-0 me-1" aria-label={`Rate ${n} stars`}>
                        <span style={{ fontSize: 24, color: (reviews[svc.id]?.rating || 0) >= n ? "#f5a623" : "#ccc" }}>★</span>
                      </button>
                    ))}
                  </div>
                  <div className="mb-3">
                    <textarea className="form-control" rows={3} placeholder="Write a quick comment (optional)" value={reviews[svc.id]?.comment || ''} onChange={(e) => setField(svc.id, 'comment', e.target.value)} />
                  </div>
                  <button className="btn btn-primary" disabled={busy || Number(reviews[svc.id]?.rating || 0) < 1} onClick={() => submitReview(svc.id)}>
                    {busy ? 'Submitting…' : 'Submit review'}
                  </button>
                </div>
              </div>
            </div>
          );
        })()
      )}
    </div>
  );
};

export default TrendingNFTsOne;
