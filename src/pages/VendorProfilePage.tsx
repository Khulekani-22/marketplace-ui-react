import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import MasterLayout from "../masterLayout/MasterLayout.jsx";
import { useVendor } from "../context/useVendor";
import { auth } from "../firebase.js";
import { api } from "../lib/api";
import { writeAuditLog } from "../lib/audit";
import { hasFullAccess } from "../utils/roles";

const API_BASE = "/api/lms";

/* ------------------------------ local storage ------------------------------ */
const LS_DRAFT_KEY = "vendor_profile_working_v1";
const LS_UNDO_KEY = "vendor_profile_undo_v1";
const LS_HISTORY_CACHE = "vendor_profile_history_cache_v1";

/* --------------------------------- helpers -------------------------------- */
function safeParse(x) {
  try {
    return typeof x === "string" ? JSON.parse(x) : x;
  } catch {
    return null;
  }
}
function deepClone(x) {
  return JSON.parse(JSON.stringify(x));
}
function uid() {
  return Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
}
function human(ts) {
  const d = new Date(ts);
  return isNaN(d) ? "—" : d.toLocaleString();
}

function pickVendorPayload(v) {
  // Sync with backend VendorSchema
  const email = (v?.contactEmail || v?.email || "").toLowerCase();
  return {
    id: String(v?.vendorId || v?.id || ""),
    name: v?.name || "",
    contactEmail: email,
    ownerUid: v?.ownerUid || "",
    phone: v?.phone || "",
    website: v?.website || "",
    description: v?.description || "",
    logoUrl: v?.logoUrl || v?.logo || "",
    bannerUrl: v?.bannerUrl || "",
    country: v?.country || "",
    city: v?.city || "",
    addressLine: v?.addressLine || "",
    socials: {
      twitter: v?.socials?.twitter || "",
      linkedin: v?.socials?.linkedin || "",
      facebook: v?.socials?.facebook || "",
      instagram: v?.socials?.instagram || "",
      youtube: v?.socials?.youtube || "",
      github: v?.socials?.github || "",
    },
    categories: Array.isArray(v?.categories) ? v.categories : [],
    tags: Array.isArray(v?.tags) ? v.tags : [],
    foundedYear: v?.foundedYear || "",
    teamSize: v?.teamSize || "",
    registrationNo: v?.registrationNo || "",
    status: (v?.status || "pending").toLowerCase(),
    kycStatus: v?.kycStatus || "pending",
  };
}

function normalizeVendor(v, fb = {}) {
  const email = (v?.email || v?.contactEmail || fb.email || "").toLowerCase();
  const socials = v?.socials ?? {};
  return {
    id: String(v?.id ?? v?.vendorId ?? fb.vendorId ?? uid()),
    vendorId: String(v?.vendorId ?? v?.id ?? fb.vendorId ?? ""),
    name: v?.name ?? v?.companyName ?? v?.vendor ?? fb.name ?? "",
    contactEmail: email,
    ownerUid: v?.ownerUid ?? v?.uid ?? fb.uid ?? "",
    website: v?.website ?? "",
    phone: v?.phone ?? "",
    country: v?.country ?? "",
    city: v?.city ?? "",
    addressLine: v?.addressLine ?? "",
    logoUrl: v?.logoUrl ?? v?.logo ?? "",
    bannerUrl: v?.bannerUrl ?? "",
    description: v?.description ?? "",
    categories: Array.isArray(v?.categories) ? v.categories : [],
    tags: Array.isArray(v?.tags) ? v.tags : [],
    foundedYear: v?.foundedYear ?? "",
    teamSize: v?.teamSize ?? "",
    registrationNo: v?.registrationNo ?? "",
    status: (v?.status || "pending").toLowerCase(),
    socials: {
      twitter: socials.twitter ?? "",
      linkedin: socials.linkedin ?? "",
      facebook: socials.facebook ?? "",
      instagram: socials.instagram ?? "",
      youtube: socials.youtube ?? "",
      github: socials.github ?? "",
    },
    lastUpdated: v?.lastUpdated ?? "",
  };
}

function findVendorInLive(live, fb) {
  if (!live) return null;
  const email = (fb?.email || "").toLowerCase();
  const pools = [
    Array.isArray(live.startups) && live.startups,   // primary directory
    Array.isArray(live.vendors) && live.vendors,     // optional alt key
    Array.isArray(live.companies) && live.companies, // legacy
    Array.isArray(live.profiles) && live.profiles,   // legacy
  ].filter(Boolean);

  for (const arr of pools) {
    const hit = arr.find(
      (v) =>
        (v?.ownerUid && v.ownerUid === fb?.uid) ||
        (v?.email && String(v.email).toLowerCase() === email) ||
        (v?.contactEmail && String(v.contactEmail).toLowerCase() === email) ||
        (fb?.vendorId &&
          (String(v?.vendorId) === String(fb.vendorId) ||
            String(v?.id) === String(fb.vendorId)))
    );
    if (hit) return normalizeVendor(hit, fb);
  }
  return null;
}

/* -------------------------------- component -------------------------------- */
export default function VendorProfilePage() {
  const { vendor: ctxVendor, ensureVendorId, refresh } = useVendor();
  const tenantId = useMemo(
    () => sessionStorage.getItem("tenantId") || "vendor",
    []
  );

  // Full LIVE appData working copy (same pattern as ListingsAdminPage)
  const [data, setData] = useState(() => {
    const draft = safeParse(localStorage.getItem(LS_DRAFT_KEY));
    return draft ?? { startups: [], vendors: [], companies: [], services: [] }; // Empty structure instead of appDataLocal
  });

  const isAdmin = hasFullAccess(sessionStorage.getItem("role"));

  const [history, setHistory] = useState(() => {
    if (!isAdmin) return [];
    const cache = safeParse(localStorage.getItem(LS_HISTORY_CACHE));
    return cache ?? [];
  });

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [message, setMessage] = useState("");
  const [propagateName, setPropagateName] = useState(true);

  // Simple undo for whole appData working copy
  const undoRef = useRef([]);

  const pushUndo = useCallback((snapshot) => {
    const stack = [snapshot, ...(undoRef.current || [])].slice(0, 10);
    undoRef.current = stack;
    localStorage.setItem(LS_UNDO_KEY, JSON.stringify(stack));
  }, []);

  const undo = useCallback(() => {
    const stack =
      undoRef.current?.length
        ? undoRef.current
        : safeParse(localStorage.getItem(LS_UNDO_KEY)) ?? [];
    if (!stack.length) return;
    const prev = stack.shift();
    undoRef.current = stack;
    localStorage.setItem(LS_UNDO_KEY, JSON.stringify(stack));
    setData(prev);
    localStorage.setItem(LS_DRAFT_KEY, JSON.stringify(prev));
  }, []);

  const doSetData = useCallback(
    (next) => {
      setData((prev) => {
        pushUndo(prev);
        localStorage.setItem(LS_DRAFT_KEY, JSON.stringify(next));
        return next;
      });
    },
    [pushUndo]
  );

  const refreshHistory = useCallback(async () => {
    if (!isAdmin) {
      setHistory([]);
      return;
    }
    try {
      const { data: hx } = await api.get(`${API_BASE}/checkpoints`, {
        headers: {
          "x-tenant-id": tenantId,
          "cache-control": "no-cache",
        },
      });
      const items = Array.isArray(hx?.items) ? hx.items : [];
      setHistory(items);
      localStorage.setItem(LS_HISTORY_CACHE, JSON.stringify(items.slice(0, 2)));
    } catch {
      // ignore
    }
  }, [isAdmin, tenantId]);

  // Load LIVE + recent checkpoints on mount (same headers/flow as ListingsAdminPage)
  useEffect(() => {
    let alive = true;
    (async () => {
      setBusy(true);
      try {
        await ensureVendorId();
        // Start with LMS live if available
        let base = { startups: [], vendors: [], companies: [], services: [] }; // Empty structure instead of appDataLocal
        try {
          const { data: live } = await api.get(`${API_BASE}/live`, {
            headers: {
              "x-tenant-id": tenantId,
              "cache-control": "no-cache",
            },
          });
          if (alive && live) base = live;
        } catch {}

        // Merge API vendors
        try {
          const list = await api.get(`/api/data/vendors`).then((r) => r.data || []);
          const draft = deepClone(base);
          draft.startups = Array.isArray(draft.startups) ? draft.startups : [];
          list.forEach((v) => {
            const n = normalizeVendor(v);
            const idx = draft.startups.findIndex((x) => String(x.vendorId || x.id) === n.vendorId);
            if (idx >= 0) draft.startups[idx] = { ...draft.startups[idx], ...n };
            else draft.startups.push(n);
          });
          base = draft;
        } catch {}

        doSetData(base);
        if (isAdmin) await refreshHistory();
      } catch {
        // keep local fallback
      } finally {
        alive && setBusy(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [tenantId, isAdmin, ensureVendorId, doSetData, refreshHistory]);

  // Detect the current signed-in vendor from LIVE appData
  const detectedVendor = useMemo(() => {
    const fb = {
      uid: auth.currentUser?.uid,
      email: auth.currentUser?.email || ctxVendor?.email || "",
      name: auth.currentUser?.displayName || ctxVendor?.name || "",
      vendorId: ctxVendor?.vendorId || "",
    };
    return findVendorInLive(data, fb) || normalizeVendor({}, fb);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, ctxVendor?.vendorId, auth.currentUser?.uid, auth.currentUser?.email]);

  // Form state follows detected vendor
  const [form, setForm] = useState(() => detectedVendor);
  useEffect(() => {
    setForm(detectedVendor);
  }, [detectedVendor]);

  const showGuard = !auth.currentUser;

  // Approval state derived from detected vendor
  const vStatus = (detectedVendor?.status || "").toLowerCase();
  const kyc = (detectedVendor?.kycStatus || "").toLowerCase();
  const isApproved = vStatus === "active" || kyc === "approved";
  const isPending = vStatus === "pending" || kyc === "pending";
  const isSuspended = vStatus === "suspended" || kyc === "rejected";

  function setField(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }
  function setSocial(k, v) {
    setForm((f) => ({ ...f, socials: { ...f.socials, [k]: v } }));
  }

  async function saveCheckpoint(messageText) {
    if (!isAdmin) {
      setErr("Only administrators can save checkpoints.");
      return;
    }
    try {
      await api.post(
        `${API_BASE}/checkpoints`,
        {
          message: messageText || "Vendor profile update",
          data,
        },
        {
          headers: {
            "Content-Type": "application/json",
            "x-tenant-id": tenantId,
          },
        }
      );
      setOk("Checkpoint saved");
      await refreshHistory();
      setMessage("");
    } catch (e) {
      setErr(e?.message || "Failed to save checkpoint");
    }
  }

  async function handleSave() {
    setErr("");
    setOk("");
    if (showGuard) {
      setErr("You need to sign in first.");
      return;
    }
    if (!form.name.trim()) {
      setErr("Vendor name is required.");
      return;
    }

    // Merge into working copy (same idea as ListingsAdminPage -> mutate `data` then publish)
    const prev = deepClone(data);
    pushUndo(prev);

    const next = deepClone(data);
    next.startups = Array.isArray(next.startups) ? next.startups : [];

    const vid = String(
      form.vendorId ||
        form.id ||
        ctxVendor?.vendorId ||
        auth.currentUser?.uid ||
        uid()
    );
    const email =
      (form.contactEmail || auth.currentUser?.email || "").toLowerCase();

    const merged = {
      ...form,
      id: vid,
      vendorId: vid,
      ownerUid: auth.currentUser?.uid || form.ownerUid || "",
      contactEmail: email,
      email,
      lastUpdated: new Date().toISOString(),
    };

    const idx = next.startups.findIndex(
      (s) =>
        String(s.vendorId) === vid ||
        String(s.id) === vid ||
        (s.email && String(s.email).toLowerCase() === email)
    );
    if (idx >= 0) next.startups[idx] = { ...next.startups[idx], ...merged };
    else next.startups.push(merged);

    // Optional: propagate vendor display name onto existing listings
    if (propagateName && Array.isArray(next.services)) {
      next.services = next.services.map((svc) =>
        String(svc.vendorId || "") === vid
          ? { ...svc, vendor: merged.name }
          : svc
      );
    }

    // 1) API-first: upsert to vendors API (axios adds token + tenant header)
    try {
      setBusy(true);
      const payload = pickVendorPayload(merged);
      if (payload.id) await api.put(`/api/data/vendors/${encodeURIComponent(payload.id)}`, payload);
      else await api.post(`/api/data/vendors`, payload);

      try {
        await writeAuditLog({
          action: "VENDOR_UPSERT",
          userEmail: auth.currentUser?.email,
          targetType: "vendor",
          targetId: vid,
          metadata: { name: merged.name },
        });
      } catch {}

      // 2) Update local working copy immediately
      doSetData(next);

      setOk("Profile saved to live.");
      await refresh?.();
      await refreshHistory();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setErr(e?.message || "Save failed");
      doSetData(prev);
    } finally {
      setBusy(false);
    }
  }

  // Quick import from Startup profile (if the user previously created one)
  async function importFromStartup() {
    setErr("");
    setOk("");
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Please sign in");
      const email = (user.email || "").toLowerCase();
      const startups = await api.get(`/api/data/startups`).then((r) => r.data || []);
      const mine = startups.find((s) => (s.ownerUid && s.ownerUid === user.uid) || ((s.contactEmail || s.email || "").toLowerCase() === email));
      if (!mine) {
        setErr("No startup profile found to import.");
        return;
      }
      const desc = [mine.elevatorPitch || "", mine.productsServices || ""].filter(Boolean).join("\n\n");
      const next = {
        ...form,
        name: form.name || mine.name || "",
        description: form.description || desc,
        contactEmail: (form.contactEmail || mine.contactEmail || email).toLowerCase(),
        phone: form.phone || mine.phone || "",
        website: form.website || mine.website || "",
        country: form.country || mine.country || "",
        city: form.city || mine.city || "",
        addressLine: form.addressLine || mine.addressLine || "",
        categories: form.categories?.length ? form.categories : Array.isArray(mine.categories) ? mine.categories : [],
        tags: form.tags?.length ? form.tags : Array.isArray(mine.tags) ? mine.tags : [],
        teamSize: form.teamSize || String(mine.employeeCount || ""),
      };
      setForm(next);
      setOk("Imported details from your Startup profile. Review and Save changes.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setErr(e?.response?.data?.message || e?.message || "Import failed");
    }
  }

  /* ----------------------------------- UI ---------------------------------- */
  return (
    <MasterLayout>
      <div className="container py-4" style={{ maxWidth: 980 }}>
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div>
            <h1 className="h4 mb-0">
              My Vendor Profile
              
            </h1>
            <div className="text-muted small">
              Signed in as{" "}
              <strong>
                {detectedVendor.name ||
                  auth.currentUser?.displayName ||
                  "Vendor"}
              </strong>{" "}
              · {detectedVendor.contactEmail || auth.currentUser?.email || "email not set"}
              <span
                className={`badge ms-2 text-bg-${
                  isApproved ? "success" : isSuspended ? "danger" : "warning"
                }`}
              >
                {isApproved ? "Approved" : isSuspended ? "Suspended" : "Pending"}
              </span>
            </div>
            <div className="text-muted small">
              Vendor ID:{" "}
              {detectedVendor.vendorId ? (
                <code>{detectedVendor.vendorId}</code>
              ) : (
                "pending"
              )}
            </div>
            {isApproved && (
              <div className="alert alert-success mt-3 mb-0">
                Your vendor account is approved. You can now submit listings to the marketplace.
                <div className="mt-2 d-flex gap-2">
                  <a className="btn btn-primary btn-sm" href="/listings-vendors">+ Submit new listing</a>
                  <a className="btn btn-outline-secondary btn-sm" href="/listings-vendors-mine">View my listings</a>
                </div>
              </div>
            )}
            {isPending && (
              <div className="alert alert-warning mt-3 mb-0">
                Your vendor account is pending approval. Please complete your profile details and wait for an admin to approve your account. You’ll be able to submit listings once approved.
              </div>
            )}
            {isSuspended && (
              <div className="alert alert-danger mt-3 mb-0">
                Your vendor account is suspended. You cannot submit listings. Please contact support if you believe this is an error.
              </div>
            )}
          </div>
          <div className="d-flex flex-wrap gap-2">
            <button
              className="btn btn-outline-secondary"
              onClick={undo}
              disabled={busy}
            >
              Undo
            </button>
            <button
              className="btn rounded-pill text-primary-50 hover-text-primary-200 bg-primary-500 bg-hover-primary-800 radius-8 px-12 py-6"
              onClick={handleSave}
              disabled={busy || showGuard}
              title="Save changes to live"
            >
              {busy ? "Saving…" : "Save changes"}
            </button>
          </div>
        </div>

        {showGuard && (
          <div className="alert alert-warning">
            Please sign in to manage your vendor profile.
          </div>
        )}
        {err && <div className="alert alert-danger">{err}</div>}
        {ok && <div className="alert alert-success">{ok}</div>}

        <div className="row g-3">
          {/* Left: form */}
          <div className="col-lg-8">
            <div className="d-flex justify-content-end mb-2">
              <button className="btn btn-sm btn-outline-secondary" onClick={importFromStartup} disabled={busy || showGuard} title="Import company details from your Startup profile">
                Import from Startup Profile
              </button>
            </div>
            <div className="card">
              <div className="card-header fw-semibold">Company details</div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-md-8">
                    <label className="form-label">Company / Vendor name</label>
                    <input
                      className="form-control"
                      value={form.name}
                      onChange={(e) => setField("name", e.target.value)}
                      placeholder="e.g., Acme Studio"
                      disabled={showGuard}
                      required
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Contact email</label>
                    <input
                      className="form-control"
                      value={form.contactEmail}
                      onChange={(e) =>
                        setField("contactEmail", e.target.value.toLowerCase())
                      }
                      placeholder="you@company.com"
                      disabled={showGuard}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Website</label>
                    <input
                      className="form-control"
                      value={form.website}
                      onChange={(e) => setField("website", e.target.value)}
                      placeholder="https://…"
                      disabled={showGuard}
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Phone</label>
                    <input
                      className="form-control"
                      value={form.phone}
                      onChange={(e) => setField("phone", e.target.value)}
                      placeholder="+27…"
                      disabled={showGuard}
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Founded (year)</label>
                    <input
                      className="form-control"
                      value={form.foundedYear}
                      onChange={(e) => setField("foundedYear", e.target.value)}
                      placeholder="2021"
                      disabled={showGuard}
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label">Country</label>
                    <input
                      className="form-control"
                      value={form.country}
                      onChange={(e) => setField("country", e.target.value)}
                      placeholder="South Africa"
                      disabled={showGuard}
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">City</label>
                    <input
                      className="form-control"
                      value={form.city}
                      onChange={(e) => setField("city", e.target.value)}
                      placeholder="Cape Town"
                      disabled={showGuard}
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Team size</label>
                    <input
                      className="form-control"
                      value={form.teamSize}
                      onChange={(e) => setField("teamSize", e.target.value)}
                      placeholder="1–10"
                      disabled={showGuard}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Company reg. number</label>
                    <input
                      className="form-control"
                      value={form.registrationNo}
                      onChange={(e) => setField("registrationNo", e.target.value)}
                      placeholder="(optional)"
                      disabled={showGuard}
                    />
                  </div>
                  <div className="col-md-6 d-none">
                    <label className="form-label">Status</label>
                    <select
                      className="form-select"
                      value={form.status}
                      onChange={(e) => setField("status", e.target.value)}
                      disabled={showGuard}
                    >
                      <option value="active">active</option>
                      <option value="pending">pending</option>
                      <option value="suspended">suspended</option>
                    </select>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Logo URL</label>
                    <input
                      className="form-control"
                      value={form.logoUrl}
                      onChange={(e) => setField("logoUrl", e.target.value)}
                      placeholder="https://…"
                      disabled={showGuard}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Banner URL</label>
                    <input
                      className="form-control"
                      value={form.bannerUrl}
                      onChange={(e) => setField("bannerUrl", e.target.value)}
                      placeholder="https://…"
                      disabled={showGuard}
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label">Description</label>
                    <textarea
                      className="form-control"
                      rows={4}
                      value={form.description}
                      onChange={(e) => setField("description", e.target.value)}
                      placeholder="Tell buyers what you do, problems you solve, and why you're different."
                      disabled={showGuard}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Categories (comma-separated)</label>
                    <input
                      className="form-control"
                      value={form.categories.join(", ")}
                      onChange={(e) =>
                        setField(
                          "categories",
                          e.target.value
                            .split(",")
                            .map((x) => x.trim())
                            .filter(Boolean)
                        )
                      }
                      placeholder="Design, Branding"
                      disabled={showGuard}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Tags (comma-separated)</label>
                    <input
                      className="form-control"
                      value={form.tags.join(", ")}
                      onChange={(e) =>
                        setField(
                          "tags",
                          e.target.value
                            .split(",")
                            .map((x) => x.trim())
                            .filter(Boolean)
                        )
                      }
                      placeholder="logos, identity, saas"
                      disabled={showGuard}
                    />
                  </div>

                  {/* Socials */}
                  <div className="col-12">
                    <div className="row g-3">
                      {[
                        ["twitter", "Twitter"],
                        ["linkedin", "LinkedIn"],
                        ["facebook", "Facebook"],
                        ["instagram", "Instagram"],
                        ["youtube", "YouTube"],
                        ["github", "GitHub"],
                      ].map(([k, label]) => (
                        <div className="col-md-6" key={k}>
                          <label className="form-label">{label}</label>
                          <input
                            className="form-control"
                            value={form.socials[k]}
                            onChange={(e) => setSocial(k, e.target.value)}
                            placeholder={`https://${k}.com/...`}
                            disabled={showGuard}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Options */}
                  <div className="col-12 d-flex align-items-center gap-2">
                    <input
                      id="propagateName"
                      type="checkbox"
                      className="form-check-input"
                      checked={propagateName}
                      onChange={(e) => setPropagateName(!!e.target.checked)}
                      disabled={showGuard}
                    />
                    <label htmlFor="propagateName" className="form-check-label">
                      Update my display name on all existing listings
                    </label>
                  </div>

                  <div className="col-12 d-flex gap-2 mt-2">
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={undo}
                      disabled={busy}
                    >
                      Undo
                    </button>
                    <button
                      type="button"
                      className="btn rounded-pill text-primary-50 hover-text-primary-200 bg-primary-500 bg-hover-primary-800 radius-8 px-12 py-6"
                      onClick={handleSave}
                      disabled={busy || showGuard}
                    >
                      {busy ? "Saving…" : "Save changes"}
                    </button>
                  </div>

                  {form.lastUpdated && (
                    <div className="form-text mt-1">
                      Last updated: {human(form.lastUpdated)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right: preview + checkpoints */}
          <div className="col-lg-4">
            {/* Preview card */}
            <div className="card mb-3">
              <div className="card-header fw-semibold">Preview</div>
              <div className="card-body">
                <div className="d-flex align-items-center gap-3">
                  <img
                    src={form.logoUrl || "/assets/images/placeholder-1x1.png"}
                    alt="logo"
                    style={{
                      width: 64,
                      height: 64,
                      objectFit: "cover",
                      borderRadius: 8,
                    }}
                  />
                  <div>
                    <div className="fw-semibold">{form.name || "Vendor"}</div>
                    <div className="text-muted small">
                      {form.contactEmail || auth.currentUser?.email || "email"}
                    </div>
                    <div className="small">
                      {form.website ? (
                        <a href={form.website} target="_blank" rel="noreferrer">
                          {form.website}
                        </a>
                      ) : (
                        "website"
                      )}
                    </div>
                  </div>
                </div>
                {form.bannerUrl && (
                  <div className="mt-3">
                    <img
                      src={form.bannerUrl}
                      alt="banner"
                      className="w-100"
                      style={{ maxHeight: 140, objectFit: "cover", borderRadius: 8 }}
                    />
                  </div>
                )}
                <div className="mt-3 small text-muted">
                  Categories: {form.categories.join(", ") || "—"}
                  <br />
                  Tags: {form.tags.join(", ") || "—"}
                </div>
              </div>
            </div>

            {/* Checkpoints - admin only */}
            {isAdmin && (
              <div className="card">
                <div className="card-header fw-semibold d-flex align-items-center justify-content-between">
                  <span>Version control</span>
                </div>
                <div className="card-body">
                  <div className="d-flex gap-2 mb-2">
                    <input
                      className="form-control"
                      placeholder="Checkpoint message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                    />
                    <button
                      className="btn btn-outline-primary"
                      onClick={() => saveCheckpoint(message)}
                      disabled={busy || showGuard}
                    >
                      Save checkpoint
                    </button>
                  </div>

                  <div className="list-group list-group-flush">
                    {!history?.length && (
                      <div className="text-muted small">
                        No checkpoints yet. Create one after saving changes.
                      </div>
                    )}
                    {history?.slice(0, 6).map((ck) => (
                      <div key={ck.id} className="list-group-item">
                        <div className="fw-semibold">
                          {ck.message || "(no message)"}
                        </div>
                        <div className="text-muted small">{human(ck.ts)}</div>
                        <div className="d-flex gap-2 mt-1">
                          <a
                            className="btn btn-sm btn-outline-secondary"
                            href={`${API_BASE}/checkpoints/${ck.id}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Download snapshot
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="form-text mt-2">
                    Checkpoints snapshot the whole marketplace data (including
                    your profile) on the server.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </MasterLayout>
  );
}
