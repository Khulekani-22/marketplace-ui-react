import { useEffect, useMemo, useRef, useState } from "react";
import appDataLocal from "../data/appData.json";
import { auth } from "../lib/firebase";
import { api } from "../lib/api";
import { Link } from "react-router-dom";

export default function ReviewsWidget() {
  const tenantId = useMemo(() => sessionStorage.getItem("tenantId") || "public", []);
  const [services, setServices] = useState([]);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [reviews, setReviews] = useState({}); // serviceId -> { rating, comment }
  const versionRef = useRef(0);
  const [modal, setModal] = useState({ open: false, id: null, showAll: false, page: 0 });
  const [toast, setToast] = useState("");

  useEffect(() => {
    const startVer = versionRef.current;
    (async () => {
      try {
        const { data: live } = await api.get(`/api/lms/live`);
        const items = Array.isArray(live?.services) ? live.services.slice(0, 8) : [];
        if (startVer === versionRef.current) setServices(items);
      } catch (e) {
        setErr(e?.message || "Failed to load listings");
      }
    })();
  }, [tenantId]);

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
  function setStar(id, n) {
    setField(id, "rating", n);
  }
  async function submitReview(id) {
    const r = Number(reviews[id]?.rating || 0);
    const comment = (reviews[id]?.comment || "").trim();
    if (Number.isNaN(r) || r < 1 || r > 5) {
      setErr("Please select a star rating (1–5).");
      return;
    }
    setBusy(true);
    setErr("");
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
      // Replace with fresh service from server so recent reviews display immediately
      versionRef.current += 1;
      setServices((prev) => prev.map((s) => (s.id === id ? data : s)));
      setToast("Review submitted. Thank you!");
      setTimeout(() => setToast(""), 2500);
      closeReview();
    } catch (e) {
      setErr(e?.response?.data?.message || e?.message || "Failed to submit review");
    } finally {
      setBusy(false);
    }
  }

  const active = services.find((s) => s.id === modal.id) || null;
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
  function lastThreeReviews(svc) {
    const arr = Array.isArray(svc?.reviews) ? svc.reviews.slice() : [];
    // Sort by createdAt desc if available, else keep original order
    arr.sort((a,b) => {
      const ta = Date.parse(a?.createdAt || "") || 0;
      const tb = Date.parse(b?.createdAt || "") || 0;
      return tb - ta;
    });
    return arr.slice(0, 3);
  }
  function allReviewsSorted(svc) {
    const arr = Array.isArray(svc?.reviews) ? svc.reviews.slice() : [];
    arr.sort((a,b) => {
      const ta = Date.parse(a?.createdAt || "") || 0;
      const tb = Date.parse(b?.createdAt || "") || 0;
      return tb - ta;
    });
    return arr;
  }
  const pageSize = 5;
  function nextPage(total) {
    const max = Math.max(0, Math.ceil(total / pageSize) - 1);
    setModal((m) => ({ ...m, page: Math.min(max, (m.page || 0) + 1) }));
  }
  function prevPage() {
    setModal((m) => ({ ...m, page: Math.max(0, (m.page || 0) - 1) }));
  }

  return (
    <>
      {toast && (
        <div className="position-fixed top-0 end-0 p-3" style={{ zIndex: 1080 }}>
          <div className="toast show align-items-center text-bg-success border-0">
            <div className="d-flex">
              <div className="toast-body">{toast}</div>
              <button type="button" className="btn-close btn-close-white me-2 m-auto" onClick={() => setToast("")}></button>
            </div>
          </div>
        </div>
      )}

      <div className="card mt-3">
        <div className="card-header d-flex align-items-center justify-content-between">
          <h6 className="mb-0">Browse Listings</h6>
          <Link to="/marketplace" className="btn btn-sm btn-outline-secondary">See marketplace</Link>
        </div>
        <div className="card-body">
          {err && <div className="alert alert-danger">{err}</div>}
          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Rating</th>
                  <th>Reviews</th>
                  <th style={{ width: 120 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {services.map((s) => (
                  <tr key={s.id}>
                    <td className="fw-semibold">{s.title}</td>
                    <td>{s.category || '-'}</td>
                    <td>{Number(s.rating || 0).toFixed(1)}★</td>
                    <td>{Number(s.reviewCount || (Array.isArray(s.reviews) ? s.reviews.length : 0) || 0)}</td>
                    <td>
                      <button className="btn btn-sm btn-primary" onClick={() => openReview(s.id)}>
                        {Number(s.reviewCount || (Array.isArray(s.reviews) ? s.reviews.length : 0) || 0) > 0 ? 'Review' : 'Write a review'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {modal.open && active && (
        <div className="position-fixed top-0 start-0 w-100 h-100" style={{ background: "rgba(0,0,0,0.5)", zIndex: 1070 }} onClick={(e) => e.target === e.currentTarget && closeReview()}>
          <div className="card" style={{ maxWidth: 520, margin: "10vh auto" }}>
            <div className="card-header d-flex align-items-center justify-content-between">
              <h6 className="mb-0">Review: {active.title}</h6>
              <button className="btn btn-sm btn-outline-secondary" onClick={closeReview}>Close</button>
            </div>
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <div className="text-secondary small">
                  You are reviewing as: <strong>{auth.currentUser?.email || 'Guest'}</strong>
                </div>
                <div className="text-secondary small">
                  Vendor: <strong>{active.vendor || 'Unknown'}</strong>
                </div>
              </div>
              {(!active.reviews || active.reviews.length === 0) && (
                <div className="alert alert-info py-2">
                  {Number(active.reviewCount || 0) > 0
                    ? `We have ${Number(active.reviewCount)} review(s) in aggregate, but no individual reviews to display yet.`
                    : 'No reviews yet. Be the first to write one!'}
                </div>
              )}
              {/* Reviews: recent or all */}
              {(!modal.showAll && lastThreeReviews(active).length > 0) && (
                <div className="mb-3">
                  <div className="fw-semibold mb-2">Recent reviews</div>
                  <div className="list-group list-group-flush">
                    {lastThreeReviews(active).map((rv, idx) => (
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
                  {Array.isArray(active?.reviews) && active.reviews.length > 3 && (
                    <button type="button" className="btn btn-sm btn-outline-secondary mt-2" onClick={() => setModal((m)=>({ ...m, showAll: true, page: 0 }))}>
                      See all reviews ({active.reviews.length})
                    </button>
                  )}
                </div>
              )}
              {modal.showAll && (
                <div className="mb-3">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <div className="fw-semibold">All reviews ({Array.isArray(active?.reviews) ? active.reviews.length : 0})</div>
                    <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setModal((m)=>({ ...m, showAll: false, page: 0 }))}>Back</button>
                  </div>
                  <div className="list-group list-group-flush">
                    {(() => {
                      const arr = allReviewsSorted(active);
                      const start = (modal.page || 0) * pageSize;
                      const slice = arr.slice(start, start + pageSize);
                      return slice.map((rv, idx) => (
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
                      ));
                    })()}
                  </div>
                  {(() => {
                    const total = Array.isArray(active?.reviews) ? active.reviews.length : 0;
                    const maxPage = Math.max(0, Math.ceil(total / pageSize) - 1);
                    return (
                      <div className="d-flex align-items-center justify-content-between mt-2">
                        <span className="text-secondary small">Page {(modal.page || 0) + 1} of {maxPage + 1}</span>
                        <div className="d-flex gap-2">
                          <button className="btn btn-sm btn-outline-secondary" onClick={prevPage} disabled={(modal.page || 0) <= 0}>Prev</button>
                          <button className="btn btn-sm btn-outline-secondary" onClick={() => nextPage(total)} disabled={(modal.page || 0) >= maxPage}>Next</button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
              <div className="mb-3">
                {[1,2,3,4,5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setStar(active.id, n)}
                    className="btn btn-link p-0 me-1"
                    aria-label={`Rate ${n} stars`}
                  >
                    <span style={{ fontSize: 24, color: (reviews[active.id]?.rating || 0) >= n ? "#f5a623" : "#ccc" }}>★</span>
                  </button>
                ))}
              </div>
              <div className="mb-3">
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="Write a quick comment (optional)"
                  value={reviews[active.id]?.comment || ''}
                  onChange={(e) => setField(active.id, 'comment', e.target.value)}
                />
              </div>
              <button className="btn btn-primary" disabled={busy || Number(reviews[active.id]?.rating || 0) < 1} onClick={() => submitReview(active.id)}>
                {busy ? 'Submitting…' : 'Submit review'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
