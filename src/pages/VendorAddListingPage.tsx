
// src/pages/VendorAddListingPage.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import MasterLayout from "../MasterLayout/MasterLayout.jsx";
import { useVendor } from "../context/useVendor";
import { useAppSync } from "../context/useAppSync";
import { api } from "../lib/api";
import { auth } from "../lib/firebase";
import appDataLocal from "../data/appData.json";

const API_BASE = "/api/lms";
const OTHER = "__OTHER__";

/* -------------------------------- helpers -------------------------------- */
function uid() {
  return Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
}
function safeParse(x) {
  try {
    return typeof x === "string" ? JSON.parse(x) : x;
  } catch {
    return null;
  }
}
function normalizeService(s) {
  return {
    id: s?.id ?? uid(),
    title: s?.title ?? "",
    category: s?.category ?? "",
    vendor: s?.vendor ?? "",
    vendorId: s?.vendorId ?? "",
    contactEmail: (s?.contactEmail || s?.email || "").toLowerCase(),
    ownerUid: s?.ownerUid ?? s?.ownerId ?? "",
    ownerEmail: (s?.ownerEmail || s?.contactEmail || s?.email || "").toLowerCase(),
    price: Number(s?.price || 0),
    rating: Number(s?.rating || 0),
    reviewCount:
      typeof s?.reviewCount === "number"
        ? s.reviewCount
        : Number(s?.reviewCount || s?.reviews?.length || 0),
    imageUrl: s?.imageUrl ?? "",
    aiHint: s?.aiHint ?? "",
    listingType: s?.listingType ?? "service",
    status: s?.status ?? "pending",
    isFeatured: !!s?.isFeatured,
    description: s?.description ?? "",
    reviews: Array.isArray(s?.reviews) ? s.reviews : [],
    tags: Array.isArray(s?.tags) ? s.tags : [],
    source: s?.source ?? "",
    clonedFrom: s?.clonedFrom ?? "",
    tenantId: s?.tenantId ?? "public",
    createdAt: s?.createdAt ?? s?.created_at ?? new Date().toISOString(),
  };
}
function normalizeVendor(v, fb = {}) {
  const email = (v?.email || v?.contactEmail || fb.email || "").toLowerCase();
  return {
    id: String(v?.id ?? v?.vendorId ?? fb.vendorId ?? ""),
    vendorId: String(v?.vendorId ?? v?.id ?? fb.vendorId ?? ""),
    name: v?.name ?? v?.companyName ?? v?.vendor ?? fb.name ?? "",
    contactEmail: email,
    ownerUid: v?.ownerUid ?? v?.uid ?? fb.uid ?? "",
    status: (v?.status || "active").toLowerCase(), // <<— include status
  };
}
function findVendorInLive(live, fb) {
  if (!live) return null;
  const email = (fb?.email || "").toLowerCase();
  const pools = [
    Array.isArray(live.startups) && live.startups,
    Array.isArray(live.vendors) && live.vendors,
    Array.isArray(live.companies) && live.companies,
    Array.isArray(live.profiles) && live.profiles,
  ].filter(Boolean);
  for (const arr of pools) {
    const hit = arr.find(
      (v) =>
        (v?.ownerUid && v.ownerUid === fb?.uid) ||
        (v?.email && v.email.toLowerCase() === email) ||
        (v?.contactEmail && v.contactEmail.toLowerCase() === email) ||
        (fb?.vendorId &&
          (String(v?.vendorId) === String(fb.vendorId) ||
            String(v?.id) === String(fb.vendorId)))
    );
    if (hit) return normalizeVendor(hit, fb);
  }
  return null;
}

/* --------------------------------- page --------------------------------- */
export default function VendorAddListingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { vendor: ctxVendor, ensureVendorId, refresh } = useVendor();
  const { syncNow: syncAppData } = useAppSync();

  const tenantId = useMemo(
    () => sessionStorage.getItem("tenantId") || "vendor",
    []
  );
  const isAdmin = sessionStorage.getItem("role") === "admin";

  // Full LIVE appData working copy on this page as well
  const [data, setData] = useState(appDataLocal);
  const [history, setHistory] = useState(() => (isAdmin ? [] : []));

  // categories derived from working copy
  const categories = useMemo(() => {
    const s = data?.services || [];
    return Array.from(
      new Set(s.map((x) => (x.category || "").trim()).filter(Boolean))
    );
  }, [data]);

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  // Prefill / duplicate support
  const prefillJson = useMemo(() => {
    const raw = searchParams.get("prefill");
    return raw ? safeParse(decodeURIComponent(raw)) : null;
  }, [searchParams]);
  const [dupSource, setDupSource] = useState(null);

  // Load LIVE + history (match ListingsAdminPage network pattern)
  useEffect(() => {
    let alive = true;
    (async () => {
      await ensureVendorId();
      try {
        let base = appDataLocal;
        try {
          const { data: live } = await api.get(`${API_BASE}/live`, {
            headers: {
              "x-tenant-id": tenantId,
              "cache-control": "no-cache",
            },
          });
          if (live) {
            base = live;
            const fromId = searchParams.get("from");
            if (fromId) {
              const found = live?.services?.find((s) => String(s.id) === String(fromId));
              if (found) setDupSource(found);
            }
          }
        } catch {
          // keep local fallback
        }

        try {
          const { data: vendorList } = await api.get(`/api/data/vendors`);
          const arr = Array.isArray(vendorList) ? vendorList : [];
          const draft = JSON.parse(JSON.stringify(base));
          draft.startups = Array.isArray(draft.startups) ? draft.startups : [];
          arr.forEach((v) => {
            const email = (v.email || v.contactEmail || "").toLowerCase();
            const id = String(v.vendorId || v.id || email || "");
            const idx = draft.startups.findIndex((x) => String(x.vendorId || x.id) === id);
            const merged = {
              ...(draft.startups[idx] || {}),
              ...v,
              vendorId: id,
              id,
            };
            if (idx >= 0) draft.startups[idx] = merged;
            else draft.startups.push(merged);
          });
          base = draft;
        } catch {
          // ignore vendor merge errors
        }

        if (alive) setData(base);

        if (isAdmin) {
          try {
            const { data: hx } = await api.get(`${API_BASE}/checkpoints`, {
              headers: {
                "x-tenant-id": tenantId,
                "cache-control": "no-cache",
              },
            });
            const items = Array.isArray(hx?.items) ? hx.items : [];
            if (alive) setHistory(items);
          } catch {
            if (alive) setHistory([]);
          }
        }
      } catch {
        // fall back to local
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId, isAdmin]);

  // Detect vendor from LIVE working copy
  const detectedVendor = useMemo(() => {
    const fb = {
      uid: auth.currentUser?.uid,
      email: auth.currentUser?.email || ctxVendor?.email || "",
      name: auth.currentUser?.displayName || ctxVendor?.name || "",
      vendorId: ctxVendor?.vendorId || "",
    };
    return (
      findVendorInLive(data, fb) ||
      normalizeVendor({}, fb) // stub if not found yet
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, ctxVendor?.vendorId, auth.currentUser?.uid, auth.currentUser?.email]);

  useEffect(() => {
    if (!ctxVendor?.vendorId && detectedVendor?.vendorId) {
      refresh?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detectedVendor?.vendorId]);

  const vStatus = (detectedVendor?.status || "").toLowerCase();
  const isApproved = vStatus === "active"; // Admin approval sets status=active
  const isSuspended = vStatus === "suspended";

  // Form state (seeded by duplicate or prefill)
  const seed = useMemo(() => {
    if (dupSource) return normalizeService(dupSource);
    if (prefillJson) return normalizeService(prefillJson);
    return normalizeService({});
  }, [dupSource, prefillJson]);

  const [form, setForm] = useState({
    title: seed.title || "",
    categoryChoice: seed.category || "",
    categoryCustom: "",
    price: seed.price ? String(seed.price) : "",
    imageUrl: seed.imageUrl || "",
    description: seed.description || "",
    listingType: seed.listingType || "service",
  });

  useEffect(() => {
    setForm((f) => ({
      ...f,
      title: dupSource ? `${seed.title} (Copy)` : seed.title || f.title,
      categoryChoice: seed.category || f.categoryChoice,
      price: seed.price ? String(seed.price) : f.price,
      imageUrl: seed.imageUrl || f.imageUrl,
      description: seed.description || f.description,
      listingType: seed.listingType || f.listingType,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dupSource?.id]);

  function setField(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  const effectiveCategory =
    form.categoryChoice === OTHER
      ? form.categoryCustom.trim()
      : (form.categoryChoice || "").trim();

  const contactEmail =
    (detectedVendor?.contactEmail || "").toLowerCase() ||
    (auth.currentUser?.email || "").toLowerCase();

  // Guards
  const showGuard = !detectedVendor?.vendorId;
  const blocked = showGuard || isSuspended || !isApproved;

  // Redirect non-approved vendors to complete their profile/await approval
  useEffect(() => {
    if (!auth.currentUser) return;
    if (showGuard || !isApproved) {
      const next = encodeURIComponent(window.location.pathname + window.location.search);
      navigate(`/profile-vendor?next=${next}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showGuard, isApproved]);

  /* ------------------------------- submit -------------------------------- */
  async function handleSubmit(e) {
    e.preventDefault();
    setErr("");
    setOk("");

    if (showGuard) {
      setErr("Please create your vendor profile before submitting a listing.");
      return;
    }
    if (!isApproved) {
      setErr("Your vendor account is not yet approved. Please complete your profile and wait for admin approval.");
      return;
    }
    if (isSuspended) {
      setErr("Your vendor account is suspended. You cannot submit listings. Please contact support.");
      return;
    }
    if (!form.title.trim() || !effectiveCategory) {
      setErr("Title and category are required.");
      return;
    }

    // Double-check latest vendor status on server just before submit
    let liveForCheck = data;
    try {
      const { data: liveData } = await api.get(`${API_BASE}/live`, {
        headers: {
          "x-tenant-id": tenantId,
          "cache-control": "no-cache",
        },
      });
      if (liveData) liveForCheck = liveData;
    } catch {
      liveForCheck = data;
    }

    const fb = {
      uid: auth.currentUser?.uid,
      email: auth.currentUser?.email || ctxVendor?.email || "",
      name: auth.currentUser?.displayName || ctxVendor?.name || "",
      vendorId: detectedVendor?.vendorId || ctxVendor?.vendorId || "",
    };
    const latestVendor = findVendorInLive(liveForCheck, fb) || detectedVendor;
    if ((latestVendor?.status || "").toLowerCase() === "suspended") {
      setErr("Your vendor account is suspended. You cannot submit listings. Please contact support.");
      return;
    }

    const newService = normalizeService({
      id: uid(),
      title: form.title.trim(),
      category: effectiveCategory,
      vendor: latestVendor.name || latestVendor.contactEmail || "Vendor",
      vendorId: latestVendor.vendorId,
      contactEmail,
      ownerUid: auth.currentUser?.uid || latestVendor.ownerUid || "",
      ownerEmail: contactEmail,
      price: Number(form.price || 0),
      rating: 0,
      reviewCount: 0,
      imageUrl: (form.imageUrl || "").trim(),
      listingType: form.listingType || "service",
      status: "pending",
      isFeatured: false,
      description: (form.description || "").trim(),
      reviews: [],
      createdAt: new Date().toISOString(),
      ...(dupSource ? { source: "duplicate", clonedFrom: dupSource.id } : {}),
      ...(prefillJson && !dupSource ? { source: "prefill" } : {}),
    });

    setBusy(true);
    try {
      const payload = {
        ...newService,
        tenantId,
        tags: Array.isArray(newService?.tags) ? newService.tags : [],
      };

      const { data: created } = await api.post(
        `/api/data/services`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            "x-tenant-id": tenantId,
          },
        }
      );

      const saved = normalizeService(created || payload);

      try {
        const { data: liveData } = await api.get(`${API_BASE}/live`, {
          headers: {
            "x-tenant-id": tenantId,
            "cache-control": "no-cache",
          },
        });
        const liveDoc =
          liveData && typeof liveData === "object" && (liveData as any).data
            ? (liveData as any).data
            : liveData;
        if (liveDoc && typeof liveDoc === "object" && !Array.isArray(liveDoc)) {
          setData(liveDoc);
        } else {
          setData((prev) => {
            const prevDoc = prev && typeof prev === "object" ? { ...prev } : {};
            const services = Array.isArray(prevDoc.services) ? prevDoc.services : [];
            return { ...prevDoc, services: [...services, saved] };
          });
        }
      } catch {
        setData((prev) => {
          const prevDoc = prev && typeof prev === "object" ? { ...prev } : {};
          const services = Array.isArray(prevDoc.services) ? prevDoc.services : [];
          return { ...prevDoc, services: [...services, saved] };
        });
      }

      try {
        await syncAppData?.();
      } catch {}

      setOk(
        "Listing submitted! It’s now pending review by the marketplace admins."
      );
      setTimeout(
        () =>
          navigate("/listings-vendors-mine", {
            replace: true,
            state: { newListing: saved },
          }),
        850
      );
    } catch (e2) {
      setErr(e2?.message || "Failed to submit listing.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setBusy(false);
    }
  }

  /* ---------------------------------- UI --------------------------------- */
  return (
    <MasterLayout activeRoute="/listings-vendors" pageTitle="Submit a Listing">
      <div className="container py-4" style={{ maxWidth: 880 }}>
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h1 className="h4 mb-0">Submit a Listing</h1>
          <div className="text-muted small">
            Vendor:{" "}
            {detectedVendor?.vendorId ? (
              <>
                <code className="me-1">{detectedVendor.vendorId}</code>
                <span>
                  ({detectedVendor.name || detectedVendor.contactEmail})
                </span>
                {isSuspended && (
                  <span className="badge text-bg-danger ms-2">suspended</span>
                )}
              </>
            ) : (
              "not set"
            )}
          </div>
        </div>

        {showGuard && (
          <div className="alert alert-warning d-flex justify-content-between align-items-center">
            <div>
              You need a vendor profile before submitting a listing.
            </div>
            <Link to="/signup/vendor?next=/listings-vendors" className="btn btn-sm btn-primary">
              Create vendor profile
            </Link>
          </div>
        )}

        {!showGuard && isSuspended && (
          <div className="alert alert-danger">
            Your vendor account is <strong>suspended</strong>. You cannot submit
            listings. Please contact support if you think this is an error.
          </div>
        )}

        {dupSource && (
          <div className="alert alert-info">
            Duplicating from <strong>{dupSource.title}</strong>. Adjust fields
            and submit to create a new <strong>pending</strong> listing.
          </div>
        )}
        {prefillJson && !dupSource && (
          <div className="alert alert-info">
            Form prefilled. Review and submit to create a{" "}
            <strong>pending</strong> listing.
          </div>
        )}

        {err && <div className="alert alert-danger">{err}</div>}
        {ok && <div className="alert alert-success">{ok}</div>}

        <div className="card bg-body">
          <div className="card-header bg-body-tertiary fw-semibold">
            Listing details
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit} noValidate>
              {/* Vendor identity (read-only) */}
              <div className="row g-3 mb-1">
                <div className="col-md-6">
                  <label className="form-label">Vendor</label>
                  <input
                    className="form-control"
                    value={
                      detectedVendor?.name ||
                      detectedVendor?.contactEmail ||
                      ""
                    }
                    disabled
                    aria-readonly="true"
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Vendor ID</label>
                  <input
                    className="form-control"
                    value={detectedVendor?.vendorId || ""}
                    disabled
                    aria-readonly="true"
                  />
                </div>
              </div>

              <div className="row g-3">
                <div className="col-md-8">
                  <label className="form-label">Title</label>
                  <input
                    className="form-control"
                    value={form.title}
                    onChange={(e) => setField("title", e.target.value)}
                    placeholder="e.g., Modern Logo & Brand Identity Pack"
                    required
                    disabled={blocked}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Listing type</label>
                  <select
                    className="form-select"
                    value={form.listingType}
                    onChange={(e) => setField("listingType", e.target.value)}
                    disabled={blocked}
                  >
                    <option value="service">Service</option>
                    <option value="saas">SaaS</option>
                  </select>
                </div>
              </div>

              <div className="row g-3 mt-1">
                <div className="col-md-6">
                  <label className="form-label">Category</label>
                  <select
                    className="form-select"
                    value={form.categoryChoice}
                    onChange={(e) => setField("categoryChoice", e.target.value)}
                    disabled={blocked}
                    required
                  >
                    <option value="" disabled>
                      Pick a category
                    </option>
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                    <option value={OTHER}>Other…</option>
                  </select>
                </div>

                {form.categoryChoice === OTHER && (
                  <div className="col-md-6">
                    <label className="form-label">Custom category</label>
                    <input
                      className="form-control"
                      value={form.categoryCustom}
                      onChange={(e) =>
                        setField("categoryCustom", e.target.value)
                      }
                      placeholder="Type a new category"
                      disabled={blocked}
                      required
                    />
                  </div>
                )}

                <div className="col-md-3">
                  <label className="form-label">Price (R)</label>
                  <input
                    type="number"
                    min="0"
                    className="form-control"
                    value={form.price}
                    onChange={(e) => setField("price", e.target.value)}
                    placeholder="e.g., 8500"
                    disabled={blocked}
                  />
                </div>

                <div className="col-md-3">
                  <label className="form-label">Image URL</label>
                  <input
                    className="form-control"
                    value={form.imageUrl}
                    onChange={(e) => setField("imageUrl", e.target.value)}
                    placeholder="https://…"
                    disabled={blocked}
                  />
                </div>
              </div>

              <div className="mt-2">
                <label className="form-label">Description</label>
                <textarea
                  className="form-control"
                  rows={4}
                  value={form.description}
                  onChange={(e) => setField("description", e.target.value)}
                  placeholder="Describe what buyers get, deliverables, timelines, etc."
                  disabled={blocked}
                />
              </div>

              {/* Preview */}
              <div className="border rounded p-2 mt-3">
                <div className="text-muted small mb-1">Card preview</div>
                <div className="d-flex align-items-center gap-2">
                  <img
                    src={form.imageUrl || "/assets/images/placeholder-4x3.png"}
                    alt=""
                    style={{
                      width: 120,
                      height: 72,
                      objectFit: "cover",
                      borderRadius: 6,
                    }}
                  />
                  <div>
                    <div className="fw-semibold">
                      {form.title || "Untitled service"}
                    </div>
                    <div className="text-muted small">
                      {detectedVendor?.name ||
                        detectedVendor?.contactEmail ||
                        "Vendor"}
                    </div>
                    <div className="small">
                      R{Number(form.price || 0).toLocaleString()} · ★ 0.0
                    </div>
                  </div>
                </div>
              </div>

              <div className="d-flex gap-2 mt-3">
                <button
                  className="btn rounded-pill text-primary-50 hover-text-primary-200 bg-primary-500 bg-hover-primary-800 radius-8 px-12 py-6"
                  type="submit"
                  disabled={busy || blocked}
                >
                  {busy ? "Submitting…" : "Submit for review"}
                </button>
                <Link
                  to="/listings-vendors-mine"
                  className="btn btn-outline-secondary"
                >
                  Cancel
                </Link>
              </div>

              <div className="form-text mt-2">
                Submissions are added as <strong>pending</strong> and become
                visible once approved by admins.
              </div>
            </form>
          </div>
        </div>

        {isAdmin && (
          <div className="card mt-3">
            <div className="card-header d-flex justify-content-between align-items-center">
              <span>Recent checkpoints</span>
              <span className="text-muted small">Latest snapshots</span>
            </div>
            <div className="list-group list-group-flush">
              {!history?.length && (
                <div className="list-group-item text-muted small">
                  No checkpoints yet.
                </div>
              )}
              {history?.slice(0, 4).map((ck) => (
                <div key={ck.id} className="list-group-item d-flex justify-content-between align-items-center">
                  <div>
                    <div className="fw-semibold">{ck.message || "(no message)"}</div>
                    <div className="text-muted small">
                      {new Date(ck.ts).toLocaleString()}
                    </div>
                  </div>
                  <a
                    className="btn btn-sm btn-outline-secondary"
                    href={`${API_BASE}/checkpoints/${ck.id}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Download
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </MasterLayout>
  );
}
