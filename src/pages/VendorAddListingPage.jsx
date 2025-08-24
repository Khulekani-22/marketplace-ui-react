// src/pages/VendorAddListingPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import appDataLocal from "../data/appData.json";
import { useVendor } from "../context/VendorContext";
import { auth } from "../lib/firebase";

// ✅ Correct folder case:
import MasterLayout from "../MasterLayout/MasterLayout.jsx";

const API_BASE = "/api/lms";
const OTHER = "__OTHER__";

function uid() {
  return Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
}

export default function VendorAddListingPage() {
  const navigate = useNavigate();
  const { vendor, ensureVendorId } = useVendor();

  const tenantId = useMemo(
    () => sessionStorage.getItem("tenantId") || "public",
    []
  );

  // categories from local (instant) + replace with live (when available)
  const [categories, setCategories] = useState(() => {
    const s = appDataLocal?.services || [];
    const uniq = Array.from(new Set(s.map(x => (x.category || "").trim()).filter(Boolean)));
    return uniq;
  });

  const [busy, setBusy]   = useState(false);
  const [err, setErr]     = useState("");
  const [ok, setOk]       = useState("");

  const [form, setForm] = useState({
    title: "",
    categoryChoice: "",
    categoryCustom: "",
    price: "",
    imageUrl: "",
    description: "",
    listingType: "service",
  });

  const effectiveCategory =
    form.categoryChoice === OTHER ? form.categoryCustom.trim() : form.categoryChoice.trim();

  function setField(k, v) {
    setForm(f => ({ ...f, [k]: v }));
  }

  // Ensure vendor profile exists + refresh categories from backend
  useEffect(() => {
    ensureVendorId?.();
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/live`, {
          headers: { "x-tenant-id": tenantId },
        });
        if (!res.ok) return;
        const live = await res.json();
        const list = live?.services || [];
        const uniq = Array.from(
          new Set(list.map(x => (x.category || "").trim()).filter(Boolean))
        );
        if (!cancelled && uniq.length) setCategories(uniq);
      } catch {
        // keep local fallback
      }
    })();
    return () => { cancelled = true; };
  }, [tenantId, ensureVendorId]);

  const authedEmail = auth.currentUser?.email || vendor?.email || "";

  async function handleSubmit(e) {
    e.preventDefault();
    setErr("");
    setOk("");

    if (!vendor?.vendorId) {
      setErr("Please create a vendor profile first.");
      return;
    }
    if (!form.title.trim() || !effectiveCategory) {
      setErr("Title and category are required.");
      return;
    }

    const newService = {
      id: uid(),
      title: form.title.trim(),
      category: effectiveCategory,
      vendor: vendor.name || vendor.email || "Vendor",
      vendorId: vendor.vendorId,
      price: Number(form.price || 0),
      rating: 0,
      reviewCount: 0,
      imageUrl: form.imageUrl.trim(),
      aiHint: "",
      listingType: form.listingType || "service",
      status: "pending",                 // hidden until approved
      isFeatured: false,
      description: form.description.trim(),
      reviews: [],
      contactEmail: authedEmail,
      createdAt: new Date().toISOString(),
    };

    setBusy(true);
    try {
      // load live
      const liveRes = await fetch(`${API_BASE}/live`, {
        headers: { "x-tenant-id": tenantId },
      });
      const live = liveRes.ok ? await liveRes.json() : appDataLocal;

      // append
      const next = {
        ...live,
        services: Array.isArray(live?.services) ? [...live.services, newService] : [newService],
      };

      // publish
      const idToken = await auth.currentUser?.getIdToken?.();
      const pubRes = await fetch(`${API_BASE}/publish`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": tenantId,
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
        body: JSON.stringify({ data: next }),
      });
      if (!pubRes.ok) {
        const msg = await pubRes.text();
        throw new Error(msg || `Publish failed (${pubRes.status})`);
      }

      setOk("Listing submitted! It’s now pending review by the marketplace admins.");
      setTimeout(() => navigate("/marketplace?submitted=1"), 900);
    } catch (e2) {
      setErr(e2?.message || "Failed to submit listing.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setBusy(false);
    }
  }

  // Small guard so you never get a white page while context is hydrating
  if (vendor === undefined) {
    return (
      <div className="container py-4">
        <p>Loading vendor context…</p>
      </div>
    );
  }

  const showGuard = !vendor?.vendorId;

  return (
    <MasterLayout>
      <div className="container py-4" style={{ maxWidth: 880 }}>
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h1 className="h4 mb-0">Submit a Listing</h1>
          <div className="text-muted small">
            Vendor:{" "}
            {vendor?.vendorId ? (
              <>
                <code className="me-1">{vendor.vendorId}</code>
                <span>({vendor.name || vendor.email})</span>
              </>
            ) : (
              "not set"
            )}
          </div>
        </div>

        {showGuard && (
          <div className="alert alert-warning d-flex justify-content-between align-items-center">
            <div>You need a vendor profile before submitting a listing.</div>
            <Link
              to="/signup/vendor?next=/listings-vendors"
              className="btn btn-sm btn-primary"
            >
              Create vendor profile
            </Link>
          </div>
        )}

        {err && <div className="alert alert-danger">{err}</div>}
        {ok  && <div className="alert alert-success">{ok}</div>}

        <div className="card bg-body">
          <div className="card-header bg-body-tertiary fw-semibold">Listing details</div>
          <div className="card-body">
            <form onSubmit={handleSubmit} noValidate>
              <div className="row g-3 mb-1">
                <div className="col-md-6">
                  <label className="form-label">Vendor</label>
                  <input className="form-control" value={vendor?.name || vendor?.email || ""} disabled />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Vendor ID</label>
                  <input className="form-control" value={vendor?.vendorId || ""} disabled />
                </div>
              </div>

              <div className="row g-3">
                <div className="col-md-8">
                  <label className="form-label">Title</label>
                  <input
                    className="form-control"
                    value={form.title}
                    onChange={e => setField("title", e.target.value)}
                    placeholder="e.g., Modern Logo & Brand Identity Pack"
                    required
                    disabled={showGuard}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Listing type</label>
                  <select
                    className="form-select"
                    value={form.listingType}
                    onChange={e => setField("listingType", e.target.value)}
                    disabled={showGuard}
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
                    disabled={showGuard}
                    required
                  >
                    <option value="" disabled>Pick a category</option>
                    {categories.map(c => (
                      <option key={c} value={c}>{c}</option>
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
                      onChange={e => setField("categoryCustom", e.target.value)}
                      placeholder="Type a new category"
                      disabled={showGuard}
                      required
                    />
                  </div>
                )}

                {form.categoryChoice !== OTHER && (
                  <div className="col-md-3">
                    <label className="form-label">Price (R)</label>
                    <input
                      type="number"
                      min="0"
                      className="form-control"
                      value={form.price}
                      onChange={e => setField("price", e.target.value)}
                      placeholder="e.g., 8500"
                      disabled={showGuard}
                    />
                  </div>
                )}

                <div className="col-md-3">
                  <label className="form-label">Image URL</label>
                  <input
                    className="form-control"
                    value={form.imageUrl}
                    onChange={e => setField("imageUrl", e.target.value)}
                    placeholder="https://…"
                    disabled={showGuard}
                  />
                </div>
              </div>

              <div className="mt-2">
                <label className="form-label">Description</label>
                <textarea
                  className="form-control"
                  rows={4}
                  value={form.description}
                  onChange={e => setField("description", e.target.value)}
                  placeholder="Describe what buyers get, deliverables, timelines, etc."
                  disabled={showGuard}
                />
              </div>

              {/* Preview */}
              <div className="border rounded p-2 mt-3">
                <div className="text-muted small mb-1">Card preview</div>
                <div className="d-flex align-items-center gap-2">
                  <img
                    src={form.imageUrl || "/assets/images/placeholder-4x3.png"}
                    alt=""
                    style={{ width: 120, height: 72, objectFit: "cover", borderRadius: 6 }}
                  />
                  <div>
                    <div className="fw-semibold">{form.title || "Untitled service"}</div>
                    <div className="text-muted small">{vendor?.name || vendor?.email || "Vendor"}</div>
                    <div className="small">R{Number(form.price || 0).toLocaleString()} · ★ 0.0</div>
                  </div>
                </div>
              </div>

              <div className="d-flex gap-2 mt-3">
                <button className="btn btn-primary" type="submit" disabled={busy || showGuard}>
                  {busy ? "Submitting…" : "Submit for review"}
                </button>
                <Link to="/dashboard" className="btn btn-outline-secondary">Cancel</Link>
              </div>

              <div className="form-text mt-2">
                Submissions are added as <strong>pending</strong> and become visible once approved by admins.
              </div>
            </form>
          </div>
        </div>
      </div>
    </MasterLayout>
  );
}
