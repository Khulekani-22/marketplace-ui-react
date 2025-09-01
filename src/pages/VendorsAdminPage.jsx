// src/pages/VendorsAdminPage.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import appDataLocal from "../data/appData.json";
import { api } from "../lib/api";
import { auth } from "../lib/firebase";
import MasterLayout from "../masterLayout/MasterLayout";
import { writeAuditLog } from "../lib/audit";

const API_BASE = "/api/lms";

// Lazy-load the banner to keep initial bundle lean
const BannerInnerTwo = React.lazy(() => import("../components/child/BannerInnerTwo"));

// Local storage keys (scoped for vendors)
const LS_DRAFT_KEY = "vendors_admin_draft_v1";
const LS_UNDO_STACK = "vendors_admin_undo_v1";
const LS_HISTORY_CACHE = "vendors_admin_history_cache_v1";

/* --------------------------------- helpers --------------------------------- */
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
  return d.toLocaleString();
}

function normalizeVendor(v) {
  const email = (v?.email || v?.contactEmail || "").toLowerCase();
  const socials = v?.socials ?? {};
  const id = String(v?.vendorId ?? v?.id ?? v?.uid ?? email ?? uid());
  const cats = Array.isArray(v?.categories)
    ? v.categories
    : typeof v?.categories === "string"
    ? v.categories.split(",").map((x) => x.trim()).filter(Boolean)
    : [];
  const tags = Array.isArray(v?.tags)
    ? v.tags
    : typeof v?.tags === "string"
    ? v.tags.split(",").map((x) => x.trim()).filter(Boolean)
    : [];
  return {
    id,
    vendorId: id,
    name: v?.name ?? v?.companyName ?? v?.vendor ?? "",
    companyName: v?.companyName ?? v?.name ?? "",
    contactEmail: email,
    email,
    ownerUid: v?.ownerUid ?? v?.uid ?? "",
    website: v?.website ?? "",
    phone: v?.phone ?? "",
    country: v?.country ?? "",
    city: v?.city ?? "",
    addressLine: v?.addressLine ?? "",
    logoUrl: v?.logoUrl ?? v?.logo ?? "",
    bannerUrl: v?.bannerUrl ?? "",
    description: v?.description ?? "",
    categories: cats,
    tags,
    foundedYear: v?.foundedYear ?? "",
    teamSize: v?.teamSize ?? "",
    registrationNo: v?.registrationNo ?? "",
    status: (v?.status || "pending").toLowerCase(), // "active" | "pending" | "suspended"
    socials: {
      twitter: socials.twitter ?? "",
      linkedin: socials.linkedin ?? "",
      facebook: socials.facebook ?? "",
      instagram: socials.instagram ?? "",
      youtube: socials.youtube ?? "",
      github: socials.github ?? "",
    },
    lastUpdated: v?.lastUpdated ?? "",
    raw: v,
  };
}

function summarizeVendors(vendors = []) {
  const total = vendors.length;
  const byStatus = vendors.reduce((acc, v) => {
    const k = (v.status || "unknown").toLowerCase();
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});
  const categories = new Set(
    vendors.flatMap((v) => (Array.isArray(v.categories) ? v.categories : [])).map((x) => (x || "").trim()).filter(Boolean)
  ).size;
  return { total, categories, byStatus };
}

function pickVendorPayload(v) {
  const email = (v?.contactEmail || v?.email || "").toLowerCase();
  return {
    id: String(v?.vendorId || v?.id || ""),
    name: v?.name || v?.companyName || "",
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
    kycStatus: (v?.status || "pending") === "active" ? "approved" : (v?.kycStatus || "pending"),
  };
}

/* --------------------------------- page --------------------------------- */
export default function VendorsAdminPage() {
  const tenantId = useMemo(() => sessionStorage.getItem("tenantId") || "public", []);

  // Working copy of FULL appData (we edit startups/vendors here)
  const [data, setData] = useState(() => {
    const draft = safeParse(localStorage.getItem(LS_DRAFT_KEY));
    return draft ?? appDataLocal;
  });

  const vendors = useMemo(() => {
    const pools = [
      Array.isArray(data?.startups) && data.startups,
      Array.isArray(data?.vendors) && data.vendors,
      Array.isArray(data?.companies) && data.companies,
    ].filter(Boolean);
    // Deduplicate by vendorId/email
    const map = new Map();
    pools.flat().forEach((v) => {
      const n = normalizeVendor(v);
      const key = n.vendorId || n.email || n.id;
      if (!map.has(key)) map.set(key, n);
    });
    return Array.from(map.values());
  }, [data]);

  // Derived: category options
  const allCategories = useMemo(() => {
    const uniq = new Set();
    vendors.forEach((v) => (v.categories || []).forEach((c) => c && uniq.add(c)));
    return ["All", ...Array.from(uniq)];
  }, [vendors]);

  const stats = useMemo(() => summarizeVendors(vendors), [vendors]);

  // JSON editor (full appData)
  const [text, setText] = useState(() => JSON.stringify(data, null, 2));
  const [tab, setTab] = useState("visual"); // "visual" | "json"

  // UI state
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);
  const [err, setErr] = useState(null);

  // Undo stack (local only)
  const undoRef = useRef([]);

  // Version history (server)
  const [history, setHistory] = useState(() => {
    const cache = safeParse(localStorage.getItem(LS_HISTORY_CACHE));
    return cache ?? [];
  });

  async function migrateStartups() {
    setErr(null);
    setBusy(true);
    try {
      const res = await api.post(`/api/data/vendors/migrate-startups`).then((r) => r.data || {});
      toastOK(
        `Migrated startups → vendors (scanned: ${res.scanned ?? 0}, created: ${res.created ?? 0}, updated: ${res.updated ?? 0})`
      );
      try {
        await writeAuditLog({
          action: "VENDORS_MIGRATE",
          userEmail: auth.currentUser?.email,
          targetType: "vendors",
          targetId: "migration",
          metadata: res,
        });
      } catch {}
      // Reload base from LMS, then merge API vendors
      let base = appDataLocal;
      try {
        const idToken = await auth.currentUser?.getIdToken?.();
        const liveRes = await fetch(`${API_BASE}/live`, {
          headers: { "x-tenant-id": tenantId, ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}) },
        });
        if (liveRes.ok) base = await liveRes.json();
      } catch {}
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
      setData(base);
      setText(JSON.stringify(base, null, 2));
      localStorage.setItem(LS_DRAFT_KEY, JSON.stringify(base));
      await refreshHistory();
    } catch (e) {
      setErr(e?.response?.data?.message || e?.message || "Migration failed");
    } finally {
      setBusy(false);
    }
  }

  // Filters / selection
  const [status, setStatus] = useState("All"); // All | active | pending | suspended
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(vendors[0]?.vendorId || "");

  const filtered = useMemo(() => {
    return vendors.filter((v) => {
      if (status !== "All" && (v.status || "").toLowerCase() !== status) return false;
      if (category !== "All" && !v.categories?.includes(category)) return false;
      if (search) {
        const blob = `${v.name} ${v.companyName} ${v.email} ${v.vendorId} ${v.city} ${v.country}`.toLowerCase();
        if (!blob.includes(search.toLowerCase())) return false;
      }
      return true;
    });
  }, [vendors, status, category, search]);

  const selected = useMemo(
    () => vendors.find((v) => v.vendorId === selectedId),
    [vendors, selectedId]
  );

  function toastOK(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  function pushUndo(prevAppData) {
    const stack = safeParse(localStorage.getItem(LS_UNDO_STACK)) ?? [];
    stack.unshift(prevAppData);
    const trimmed = stack.slice(0, 10);
    localStorage.setItem(LS_UNDO_STACK, JSON.stringify(trimmed));
    undoRef.current = trimmed;
  }

  function doSetData(next) {
    pushUndo(data);
    setData(next);
    setText(JSON.stringify(next, null, 2));
    localStorage.setItem(LS_DRAFT_KEY, JSON.stringify(next));
  }

  function updateVendor(patch) {
    if (!selected) return;
    const next = deepClone(data);
    const pools = ["startups", "vendors", "companies"];
    let updated = false;
    for (const key of pools) {
      if (!Array.isArray(next[key])) continue;
      const idx = next[key].findIndex(
        (x) =>
          String(x.vendorId ?? x.id ?? x.uid) === selected.vendorId ||
          (x.email && x.email.toLowerCase() === selected.email)
      );
      if (idx >= 0) {
        next[key][idx] = { ...next[key][idx], ...patch, vendorId: selected.vendorId, id: selected.vendorId };
        updated = true;
      }
    }
    // If not found in any pool, upsert into startups
    if (!updated) {
      next.startups = Array.isArray(next.startups) ? next.startups : [];
      next.startups.push({ ...selected.raw, ...patch, vendorId: selected.vendorId, id: selected.vendorId });
    }
    doSetData(next);

    try {
      const prevStatus = selected.status;
      if (typeof patch.status !== "undefined" && patch.status !== prevStatus) {
        writeAuditLog({
          action: "VENDOR_STATUS_CHANGE",
          userEmail: auth.currentUser?.email,
          targetType: "vendor",
          targetId: selected.vendorId,
          metadata: { from: prevStatus, to: patch.status, email: selected.email },
        });
      } else {
        writeAuditLog({
          action: "VENDOR_UPDATE",
          userEmail: auth.currentUser?.email,
          targetType: "vendor",
          targetId: selected.vendorId,
          metadata: { patch, email: selected.email },
        });
      }
    } catch {}

    // Persist core vendor fields via API (axios client includes auth)
    const payload = pickVendorPayload({ ...selected, ...patch });
    if (payload.name && payload.contactEmail && payload.id) {
      // Guard: require sign-in for writes
      if (!auth.currentUser) {
        setErr("Please sign in to save vendor changes.");
        return;
      }
      (async () => {
        try {
          await api.put(`/api/data/vendors/${encodeURIComponent(payload.id)}`, payload);
          toastOK("Saved to API");
        } catch (e) {
          const status = e?.response?.status;
          const message = e?.response?.data?.message || e?.message || "Failed to save vendor to API";
          if (status === 404 || status === 400) {
            // Create if not found (or invalid state) in current tenant
            try {
              await api.post(`/api/data/vendors`, payload);
              toastOK("Created vendor in API");
              return;
            } catch (e2) {
              const m2 = e2?.response?.data?.message || e2?.message || message;
              setErr(m2);
              return;
            }
          }
          setErr(message);
        }
      })();
    }
  }

  function addVendor() {
    const name = prompt("Vendor/company name?");
    if (!name) return;
    const vid = uid();
    const next = deepClone(data);
    next.startups = Array.isArray(next.startups) ? next.startups : [];
    next.startups.push(
      normalizeVendor({
        id: vid,
        vendorId: vid,
        name,
        companyName: name,
        status: "pending",
        email: "",
      })
    );
    doSetData(next);
    setSelectedId(vid);
    try {
      writeAuditLog({
        action: "VENDOR_CREATE",
        userEmail: auth.currentUser?.email,
        targetType: "vendor",
        targetId: vid,
        metadata: { name },
      });
    } catch {}
  }

  function duplicateVendor() {
    if (!selected) return;
    const vid = uid();
    const copy = deepClone(selected);
    copy.vendorId = vid;
    copy.id = vid;
    copy.name = `${copy.name || copy.companyName || "Vendor"} (Copy)`;
    const next = deepClone(data);
    next.startups = Array.isArray(next.startups) ? next.startups : [];
    next.startups.push(copy);
    doSetData(next);
    setSelectedId(vid);
    try {
      writeAuditLog({
        action: "VENDOR_DUPLICATE",
        userEmail: auth.currentUser?.email,
        targetType: "vendor",
        targetId: vid,
        metadata: { sourceId: selected.vendorId },
      });
    } catch {}
  }

  function deleteVendor() {
    if (!selected) return;
    if (!window.confirm(`Delete "${selected.name || selected.companyName || selected.email}"?`)) return;
    const next = deepClone(data);
    ["startups", "vendors", "companies"].forEach((key) => {
      if (Array.isArray(next[key])) {
        next[key] = next[key].filter(
          (x) =>
            String(x.vendorId ?? x.id ?? x.uid) !== selected.vendorId &&
            (x.email || "").toLowerCase() !== selected.email
        );
      }
    });
    doSetData(next);
    setSelectedId(next?.startups?.[0]?.vendorId || "");
  }

  function undo() {
    const stack =
      undoRef.current.length > 0
        ? undoRef.current
        : safeParse(localStorage.getItem(LS_UNDO_STACK)) ?? [];
    if (!stack.length) return;
    const prev = stack.shift();
    undoRef.current = stack;
    localStorage.setItem(LS_UNDO_STACK, JSON.stringify(stack));
    setData(prev);
    setText(JSON.stringify(prev, null, 2));
  }

  // --------- Backend I/O ----------
  useEffect(() => {
    (async () => {
      setBusy(true);
      try {
        // Start with LMS live (if available), else local
        let base = appDataLocal;
        try {
          const idToken = await auth.currentUser?.getIdToken?.();
          const res = await fetch(`${API_BASE}/live`, {
            headers: {
              "x-tenant-id": tenantId,
              ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
            },
          });
          if (res.ok) base = await res.json();
        } catch {}

        // Merge vendors from API into working copy
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

        setData(base);
        setText(JSON.stringify(base, null, 2));
        localStorage.setItem(LS_DRAFT_KEY, JSON.stringify(base));
        const first = base?.startups?.[0] || base?.vendors?.[0] || base?.companies?.[0];
        setSelectedId(String(first?.vendorId ?? first?.id ?? "") || "");
        await refreshHistory();
      } catch {
        // stay with local fallback
      } finally {
        setBusy(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function refreshHistory() {
    try {
      const idToken = await auth.currentUser?.getIdToken?.();
      const hx = await fetch(`${API_BASE}/checkpoints`, {
        headers: {
          "x-tenant-id": tenantId,
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
      }).then((r) => (r.ok ? r.json() : { items: [] }));
      const items = hx.items ?? [];
      setHistory(items);
      localStorage.setItem(LS_HISTORY_CACHE, JSON.stringify(items.slice(0, 2)));
    } catch {
      // ignore
    }
  }

  async function handlePublish() {
    setErr(null);
    setBusy(true);
    try {
      const idToken = await auth.currentUser?.getIdToken?.();
      const res = await fetch(`${API_BASE}/publish`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": tenantId,
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
        body: JSON.stringify({ data }),
      });
      if (!res.ok) throw new Error(await res.text());
      toastOK("Published vendor directory to live");
      try {
        await writeAuditLog({
          action: "VENDORS_PUBLISH",
          userEmail: auth.currentUser?.email,
          targetType: "appData",
          targetId: "vendors",
          metadata: { count: vendors.length },
        });
      } catch {}
      await refreshHistory();
    } catch (e) {
      setErr(e.message || "Publish failed");
    } finally {
      setBusy(false);
    }
  }

  async function saveCheckpoint(message) {
    try {
      const idToken = await auth.currentUser?.getIdToken?.();
      const res = await fetch(`${API_BASE}/checkpoints`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": tenantId,
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
        body: JSON.stringify({ message: message || "Vendor admin update", data }),
      });
      if (!res.ok) throw new Error(await res.text());
      toastOK("Checkpoint saved");
      try {
        await writeAuditLog({
          action: "VENDORS_CHECKPOINT",
          userEmail: auth.currentUser?.email,
          targetType: "vendors",
          targetId: "checkpoint",
          metadata: { message: message || "" },
        });
      } catch {}
      await refreshHistory();
    } catch (e) {
      setErr(e.message || "Failed to save checkpoint");
    }
  }

  async function restoreCheckpoint(id) {
    if (!window.confirm("Restore this snapshot to LIVE appData.json?")) return;
    try {
      const idToken = await auth.currentUser?.getIdToken?.();
      const res = await fetch(`${API_BASE}/restore/${id}`, {
        method: "POST",
        headers: { "x-tenant-id": tenantId, ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}) },
      });
      if (!res.ok) throw new Error(await res.text());
      toastOK("Restored snapshot");
      await refreshHistory();
      const live = await fetch(`${API_BASE}/live`).then((r) => r.json());
      doSetData(live);
    } catch (e) {
      setErr(e.message || "Restore failed");
    }
  }

  async function clearHistory() {
    if (!window.confirm("Delete ALL checkpoints on the server?")) return;
    try {
      const idToken = await auth.currentUser?.getIdToken?.();
      const res = await fetch(`${API_BASE}/checkpoints`, {
        method: "DELETE",
        headers: { "x-tenant-id": tenantId, ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}) },
      });
      if (!res.ok) throw new Error(await res.text());
      toastOK("Cleared history");
      try {
        await writeAuditLog({
          action: "VENDORS_HISTORY_CLEAR",
          userEmail: auth.currentUser?.email,
          targetType: "vendors",
          targetId: "history",
        });
      } catch {}
      await refreshHistory();
    } catch (e) {
      setErr(e.message || "Failed to clear");
    }
  }

  // Import / Export (full working appData)
  function handleExport() {
    try {
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json;charset=utf-8",
      });
      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      const ts = new Date().toISOString().replace(/[:.]/g, "-");
      a.download = `appData-${tenantId}-${ts}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(href);
      toastOK("Exported current working copy");
    } catch (err) {
      setErr("Export failed: " + (err?.message || "unknown error"));
    }
  }

  function validateAppData(j) {
    if (!j || typeof j !== "object") return "File is not valid JSON.";
    if (!Array.isArray(j.startups) && !Array.isArray(j.vendors) && !Array.isArray(j.companies)) {
      return "JSON should include vendors in startups[] or vendors[].";
    }
    return null;
  }

  async function handleImport(e) {
    setErr(null);
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const j = safeParse(text);
      const problem = validateAppData(j);
      if (problem) {
        setErr(problem);
        return;
      }
      doSetData(j);
      const first = j?.startups?.[0] || j?.vendors?.[0] || j?.companies?.[0];
      setSelectedId(String(first?.vendorId ?? first?.id ?? "") || "");
      toastOK(`Imported ${file.name}`);
    } catch (err) {
      setErr("Import failed: " + (err?.message || "unknown error"));
    } finally {
      e.target.value = "";
    }
  }

  /* ------------------------------ UI components ----------------------------- */
  return (
    <MasterLayout>
      <div className="container py-4">
      <React.Suspense fallback={null}>
        <div className="row mb-3">
          <BannerInnerTwo />
        </div>
      </React.Suspense>

      {/* Top stats */}
      <div className="row g-3 mb-3">
        <div className="col-md-3 col-sm-6">
          <div className="card px-24 py-16 shadow-none radius-12 border h-100 bg-gradient-start-5 bg-animated-gradient text-center p-3">
            <i className="bi bi-people text-primary fs-3 mb-2" />
            <h6 className="fw-bold mb-0">{stats.total}</h6>
            <small className="text-muted">Vendors</small>
          </div>
        </div>
        <div className="col-md-3 col-sm-6">
          <div className="card px-24 py-16 shadow-none radius-12 border h-100 text-center p-3">
            <i className="bi bi-grid text-success fs-3 mb-2" />
            <h6 className="fw-bold mb-0">{stats.categories}</h6>
            <small className="text-muted">Categories</small>
          </div>
        </div>
        <div className="col-md-6 col-sm-12">
          <div className="card px-24 py-16 shadow-none radius-12 border h-100 p-3">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-flag text-danger fs-4" />
                <div className="fw-semibold">Status</div>
              </div>
              <span className="badge text-bg-light">
                {Object.values(stats.byStatus || {}).reduce((a, v) => a + v, 0)} total
              </span>
            </div>
            {(() => {
              const mapColor = (k) =>
                k === "active" ? "success" : k === "pending" ? "warning" : k === "suspended" ? "danger" : "secondary";
              const entries = Object.entries(stats.byStatus || {});
              const total = entries.reduce((a, [, v]) => a + v, 0);
              return (
                <>
                  <div className="progress" style={{ height: 10 }} aria-label="Status proportions">
                    {entries.map(([k, v]) => {
                      const pct = total ? Math.round((v / total) * 100) : 0;
                      return (
                        <div
                          key={k}
                          className={`progress-bar bg-${mapColor(k)}`}
                          role="progressbar"
                          style={{ width: `${pct}%` }}
                          aria-valuenow={pct}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          title={`${k}: ${v} (${pct}%)`}
                        />
                      );
                    })}
                  </div>
                  <div className="d-flex flex-wrap gap-2 mt-3">
                    {entries.map(([k, v]) => (
                      <span
                        key={k}
                        className={`d-inline-flex align-items-center gap-2 px-2 py-1 rounded-pill border border-${mapColor(
                          k
                        )} text-${mapColor(k)} bg-${mapColor(k)}-subtle small`}
                      >
                        <i
                          className={`bi ${
                            k === "active" ? "bi-check-circle" : k === "pending" ? "bi-hourglass-split" : "bi-pause-circle"
                          }`}
                        />
                        <span className="text-capitalize">{k}</span>
                        <span className="badge text-bg-light">{v}</span>
                      </span>
                    ))}
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="pt-4 d-flex gap-2 mb-3">
        <label className="btn btn-light mb-0">
          Import JSON
          <input type="file" accept="application/json" hidden onChange={handleImport} />
        </label>
        <button
          className="btn rounded-pill border text-neutral-500 border-neutral-700 radius-8 px-12 py-6 bg-hover-primary-700 text-hover-white"
          onClick={handleExport}
        >
          Export Current
        </button>
        <button
          className="btn btn-outline-warning"
          onClick={() => {
            if (busy) return;
            const ok = window.confirm(
              "This will convert all items under 'startups' into 'vendors' (idempotent) and clear startups. Proceed?"
            );
            if (ok) migrateStartups();
          }}
          disabled={busy}
          title="Convert all startups to vendors and upsert into vendor directory"
        >
          Migrate startups → vendors
        </button>
        <button
          className="btn rounded-pill text-primary-50 hover-text-primary-200 bg-primary-500 bg-hover-primary-800 radius-8 px-12 py-6"
          onClick={handlePublish}
          disabled={busy}
          title="Write working copy to live appData.json on the server"
        >
          {busy ? "Publishing…" : "Publish to live"}
        </button>
      </div>

      {/* Alerts */}
      {toast && <div className="alert alert-success py-2">{toast}</div>}
      {err && <div className="alert alert-danger py-2">{err}</div>}

      {/* Checkpoint bar */}
      <CheckpointBar onSave={saveCheckpoint} onClear={clearHistory} onUndo={undo} disabled={busy} />

      <div className="d-flex gap-3">
        {/* Left: editor */}
        <div className="flex-grow-1">
          <ul className="nav nav-tabs mb-3">
            <li className="nav-item">
              <button className={`nav-link ${tab === "visual" ? "active" : ""}`} onClick={() => setTab("visual")}>
                Visual editor
              </button>
            </li>
            <li className="nav-item">
              <button className={`nav-link ${tab === "json" ? "active" : ""}`} onClick={() => setTab("json")}>
                JSON editor
              </button>
            </li>
          </ul>

          {tab === "json" ? (
            <JsonEditor
              text={text}
              setText={setText}
              onApply={() => {
                const j = safeParse(text);
                if (!j) {
                  setErr("Invalid JSON");
                  return;
                }
                doSetData(j);
                toastOK("Applied JSON to working copy");
              }}
            />
          ) : (
            <VendorsEditor
              vendors={vendors}
              category={category}
              setCategory={setCategory}
              status={status}
              setStatus={setStatus}
              allCategories={allCategories}
              search={search}
              setSearch={setSearch}
              filtered={filtered}
              selectedId={selectedId}
              setSelectedId={setSelectedId}
              selected={selected}
              addVendor={addVendor}
              duplicateVendor={duplicateVendor}
              deleteVendor={deleteVendor}
              updateVendor={updateVendor}
              doSetData={doSetData}
              data={data}
            />
          )}
        </div>

        {/* Right: server version history */}
        <div style={{ width: 380 }}>
          <VersionHistory items={history} onRestore={restoreCheckpoint} />
        </div>
      </div>
      </div>
    </MasterLayout>
  );
}

/* -------------------------------- Subcomponents ------------------------------- */

function CheckpointBar({ onSave, onClear, onUndo, disabled }) {
  const [msg, setMsg] = useState("");
  return (
    <div className="d-flex align-items-center gap-2 mb-3">
      <input
        className="form-control"
        placeholder="Checkpoint message (e.g. 'Approved vendors batch #3')"
        value={msg}
        onChange={(e) => setMsg(e.target.value)}
      />
      <button
        className="btn btn-sm rounded-pill text-primary-50 hover-text-primary-200 bg-primary-500 bg-hover-primary-800 radius-8 px-12 py-6"
        onClick={() => onSave(msg)}
        disabled={disabled}
      >
        Save checkpoint
      </button>
      <button
        className="btn btn-sm rounded-pill border text-neutral-500 border-neutral-700 radius-8 px-12 py-6 bg-hover-danger-700 text-hover-white"
        onClick={onClear}
      >
        Clear history
      </button>
      <button className="btn btn-outline-secondary" onClick={onUndo}>
        Undo
      </button>
    </div>
  );
}

function JsonEditor({ text, setText, onApply }) {
  return (
    <div className="card">
      <div className="card-header fw-semibold">Working copy (JSON)</div>
      <div className="card-body">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={22}
          spellCheck={false}
          className="form-control font-monospace"
        />
        <div className="d-flex justify-content-between mt-2">
          <small className="text-muted">
            Tip: Press <kbd>⌘/Ctrl</kbd>+<kbd>A</kbd> then <kbd>⌘/Ctrl</kbd>+<kbd>C</kbd> to copy.
          </small>
          <button className="btn btn-outline-primary" onClick={onApply}>
            Apply JSON
          </button>
        </div>
      </div>
    </div>
  );
}

function VendorsEditor(props) {
  const {
    vendors,
    category,
    setCategory,
    status,
    setStatus,
    allCategories,
    search,
    setSearch,
    filtered,
    selectedId,
    setSelectedId,
    selected,
    addVendor,
    duplicateVendor,
    deleteVendor,
    updateVendor,
    doSetData,
    data,
  } = props;

  // Quick actions
  function setStatusQuick(s) {
    if (!selected) return;
    updateVendor({ status: s, lastUpdated: new Date().toISOString() });
  }

  // Propagate name to listings that share vendorId/email
  function propagateNameToListings() {
    if (!selected) return;
    const vid = selected.vendorId;
    const email = (selected.email || selected.contactEmail || "").toLowerCase();
    const next = deepClone(data);
    next.services = Array.isArray(next.services) ? next.services : [];
    next.services = next.services.map((svc) => {
      const matchesId = String(svc.vendorId || "") === String(vid);
      const matchesEmail = (svc.contactEmail || "").toLowerCase() === email;
      return matchesId || matchesEmail ? { ...svc, vendor: selected.name || selected.companyName || "" } : svc;
    });
    doSetData(next);
  }

  return (
    <div className="card">
      <div className="card-header d-flex justify-content-between align-items-center">
        <span className="fw-semibold">Vendor approvals</span>
        <span className="text-muted small">CRUD for vendor directory</span>
      </div>
      <div className="card-body">
        {/* Filters */}
        <div className="row g-2 align-items-end mb-3">
          <div className="col-12 col-md-3">
            <label className="form-label">Status</label>
            <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}>
              {["All", "active", "pending", "suspended"].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="col-12 col-md-3">
            <label className="form-label">Category</label>
            <select className="form-select" value={category} onChange={(e) => setCategory(e.target.value)}>
              {allCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="col">
            <label className="form-label">Search</label>
            <input
              className="form-control"
              placeholder="Name, email, vendorId, city, country…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="col-auto">
            <button
              className="btn rounded-pill text-primary-50 hover-text-primary-200 bg-primary-500 bg-hover-primary-800 radius-8 px-12 py-6 w-100"
              onClick={addVendor}
            >
              + Add vendor
            </button>
          </div>
          <div className="col-auto">
            <button
              className="btn rounded-pill border text-neutral-500 border-neutral-700 radius-8 px-12 py-6 bg-hover-primary-700 text-hover-white w-100"
              onClick={duplicateVendor}
              disabled={!selected}
            >
              Duplicate
            </button>
          </div>
          <div className="col-auto">
            <button
              className="btn btn-danger-500 rounded-pill border text-neutral-500 border-neutral-700 radius-8 px-12 py-6 bg-hover-danger-700 text-hover-white w-100"
              onClick={deleteVendor}
              disabled={!selected}
            >
              Delete
            </button>
          </div>
        </div>

        <div className="row">
          {/* List */}
          <div className="col-4">
            <div className="list-group mb-2" style={{ maxHeight: 480, overflow: "auto" }}>
              {filtered.map((v) => (
                <button
                  key={v.vendorId}
                  className={
                    "list-group-item list-group-item-action d-flex justify-content-between align-items-center " +
                    (selectedId === v.vendorId ? "active" : "")
                  }
                  onClick={() => setSelectedId(v.vendorId)}
                  title={v.email || ""}
                >
                  <span className="text-truncate">
                    {v.name || v.companyName || "(unnamed)"}
                    <span className="text-muted"> · </span>
                    <span className="text-truncate">{v.email || "—"}</span>
                  </span>
                  <span
                    className={
                      "badge text-uppercase " +
                      (v.status === "active"
                        ? "text-bg-success"
                        : v.status === "pending"
                        ? "text-bg-warning"
                        : "text-bg-danger")
                    }
                  >
                    {v.status || "—"}
                  </span>
                </button>
              ))}
              {!filtered.length && <div className="text-muted small p-2">No vendors match your filters.</div>}
            </div>
            <div className="small text-muted">Showing {filtered.length} of {vendors.length}</div>
          </div>

          {/* Editor */}
          <div className="col">
            {!selected ? (
              <div className="text-muted mt-2">Select a vendor to review.</div>
            ) : (
              <>
                <div className="row g-3">
                  <div className="col-md-8">
                    <label className="form-label">Company / Vendor name</label>
                    <input
                      className="form-control"
                      value={selected.name || ""}
                      onChange={(e) => updateVendor({ name: e.target.value })}
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Contact email</label>
                    <input
                      className="form-control"
                      value={selected.email || ""}
                      onChange={(e) => updateVendor({ email: e.target.value.toLowerCase(), contactEmail: e.target.value.toLowerCase() })}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Website</label>
                    <input
                      className="form-control"
                      value={selected.website || ""}
                      onChange={(e) => updateVendor({ website: e.target.value })}
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Phone</label>
                    <input
                      className="form-control"
                      value={selected.phone || ""}
                      onChange={(e) => updateVendor({ phone: e.target.value })}
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Founded (year)</label>
                    <input
                      className="form-control"
                      value={selected.foundedYear || ""}
                      onChange={(e) => updateVendor({ foundedYear: e.target.value })}
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label">Country</label>
                    <input
                      className="form-control"
                      value={selected.country || ""}
                      onChange={(e) => updateVendor({ country: e.target.value })}
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">City</label>
                    <input
                      className="form-control"
                      value={selected.city || ""}
                      onChange={(e) => updateVendor({ city: e.target.value })}
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Team size</label>
                    <input
                      className="form-control"
                      value={selected.teamSize || ""}
                      onChange={(e) => updateVendor({ teamSize: e.target.value })}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Logo URL</label>
                    <input
                      className="form-control"
                      value={selected.logoUrl || ""}
                      onChange={(e) => updateVendor({ logoUrl: e.target.value })}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Banner URL</label>
                    <input
                      className="form-control"
                      value={selected.bannerUrl || ""}
                      onChange={(e) => updateVendor({ bannerUrl: e.target.value })}
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label">Description</label>
                    <textarea
                      className="form-control"
                      rows={4}
                      value={selected.description || ""}
                      onChange={(e) => updateVendor({ description: e.target.value })}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Categories (comma-separated)</label>
                    <input
                      className="form-control"
                      value={(selected.categories || []).join(", ")}
                      onChange={(e) =>
                        updateVendor({
                          categories: e.target.value.split(",").map((x) => x.trim()).filter(Boolean),
                        })
                      }
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Tags (comma-separated)</label>
                    <input
                      className="form-control"
                      value={(selected.tags || []).join(", ")}
                      onChange={(e) =>
                        updateVendor({
                          tags: e.target.value.split(",").map((x) => x.trim()).filter(Boolean),
                        })
                      }
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Status</label>
                    <select
                      className="form-select"
                      value={selected.status || "pending"}
                      onChange={(e) => setStatusQuick(e.target.value)}
                    >
                      <option value="active">active</option>
                      <option value="pending">pending</option>
                      <option value="suspended">suspended</option>
                    </select>
                  </div>
                  <div className="col-md-6 d-flex align-items-end gap-2">
                    <button className="btn btn-success" type="button" onClick={() => setStatusQuick("active")}>
                      Approve
                    </button>
                    <button className="btn btn-warning" type="button" onClick={() => setStatusQuick("pending")}>
                      Mark pending
                    </button>
                    <button className="btn btn-danger" type="button" onClick={() => setStatusQuick("suspended")}>
                      Suspend
                    </button>
                  </div>

                  {/* Preview & actions */}
                  <div className="col-12">
                    <div className="border rounded p-2">
                      <div className="text-muted small mb-1">Profile preview</div>
                      <div className="d-flex align-items-center gap-3">
                        <img
                          src={selected.logoUrl || "/assets/images/placeholder-1x1.png"}
                          alt="logo"
                          style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 8 }}
                        />
                        <div>
                          <div className="fw-semibold">{selected.name || "Vendor"}</div>
                          <div className="text-muted small">{selected.email || "email"}</div>
                          <div className="small">
                            {selected.website ? (
                              <a href={selected.website} target="_blank" rel="noreferrer">
                                {selected.website}
                              </a>
                            ) : (
                              "website"
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="d-flex gap-2 mt-3">
                        <a
                          className="btn btn-outline-primary"
                          href={`/profile-vendor?vendorId=${encodeURIComponent(selected.vendorId)}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open profile
                        </a>
                        <button className="btn btn-outline-secondary" type="button" onClick={propagateNameToListings}>
                          Propagate name to listings
                        </button>
                      </div>
                    </div>
                    {selected.lastUpdated && (
                      <div className="form-text mt-1">Last updated: {human(selected.lastUpdated)}</div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function VersionHistory({ items, onRestore }) {
  return (
    <div className="card">
      <div className="card-header fw-semibold d-flex justify-content-between">
        <span>Version history</span>
        <span className="text-muted small">Latest checkpoints</span>
      </div>
      <div className="list-group list-group-flush">
        {!items?.length && (
          <div className="list-group-item text-muted small">
            No checkpoints yet.
            <div className="mt-1">Offline cache keeps the two most recent checkpoints.</div>
          </div>
        )}
        {items?.map((ck) => (
          <div key={ck.id} className="list-group-item">
            <div className="d-flex justify-content-between">
              <div>
                <div className="fw-semibold">{ck.message || "(no message)"}</div>
                <div className="text-muted small">{human(ck.ts)}</div>
                <div className="text-muted small">
                  Δ Cohorts: {ck.delta?.cohorts >= 0 ? "+" : ""}
                  {ck.delta?.cohorts ?? 0} · Δ Courses: {ck.delta?.courses >= 0 ? "+" : ""}
                  {ck.delta?.courses ?? 0} · Δ Lessons: {ck.delta?.lessons >= 0 ? "+" : ""}
                  {ck.delta?.lessons ?? 0}
                </div>
              </div>
              <div className="d-flex align-items-start gap-2">
                <button
                  className="btn btn rounded-pill text-primary-50 hover-text-primary-200 bg-primary-500 bg-hover-primary-800 radius-8 px-12 py-6 btn-sm"
                  title="Restore snapshot to LIVE"
                  onClick={() => onRestore(ck.id)}
                >
                  Restore
                </button>
                <a
                  className="btn btn-outline-secondary btn-sm"
                  title="Download snapshot JSON"
                  href={`${API_BASE}/checkpoints/${ck.id}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Download
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
