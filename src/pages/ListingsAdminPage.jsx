// src/pages/ListingsAdminPage.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import appDataLocal from "../data/appData.json";
import { auth } from "../lib/firebase";

const API_BASE = "/api/lms";

// Lazy-load the banner component
const BannerInnerTwo = React.lazy(() => import("../components/child/BannerInnerTwo"));

// Local storage keys (scoped for listings)
const LS_DRAFT_KEY = "listings_admin_draft_v1";
const LS_UNDO_STACK = "listings_admin_undo_v1";
const LS_HISTORY_CACHE = "listings_admin_history_cache_v1";

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
function summarizeServices(services = []) {
  const total = services.length;
  const byStatus = services.reduce((acc, s) => {
    const k = (s.status || "unknown").toLowerCase();
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});
  const featured = services.filter((s) => !!s.isFeatured).length;
  const categories = new Set(
    services.map((s) => (s.category || "").trim()).filter(Boolean)
  ).size;
  return { total, featured, categories, byStatus };
}

// normalize a service object so the UI can rely on fields
function normalizeService(s) {
  return {
    id: s.id ?? uid(),
    title: s.title ?? "",
    category: s.category ?? "",
    vendor: s.vendor ?? s.vendorName ?? "",
    vendorId: s.vendorId ?? "",
    price: typeof s.price === "number" ? s.price : Number(s.price || 0),
    rating: typeof s.rating === "number" ? s.rating : Number(s.rating || 0),
    reviewCount:
      typeof s.reviewCount === "number"
        ? s.reviewCount
        : Number(s.reviewCount || s.reviews?.length || 0),
    imageUrl: s.imageUrl ?? s.thumbnail ?? "",
    aiHint: s.aiHint ?? "",
    listingType: s.listingType ?? "service", // "service" | "saas"
    status: s.status ?? "approved", // "approved" | "pending" | "rejected"
    isFeatured: !!s.isFeatured,
    description: s.description ?? "",
    reviews: Array.isArray(s.reviews) ? s.reviews : [],
  };
}

export default function ListingsAdminPage() {
  const tenantId = useMemo(
    () => sessionStorage.getItem("tenantId") || "public",
    []
  );

  // Working copy of FULL appData (we only edit services visually)
  const [data, setData] = useState(() => {
    const draft = safeParse(localStorage.getItem(LS_DRAFT_KEY));
    return draft ?? appDataLocal;
  });
  const services = useMemo(
    () => (data?.services || []).map(normalizeService),
    [data]
  );
  const startups = data?.startups || [];

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

  // Filters / selection
  const allCategories = useMemo(() => {
    const uniq = Array.from(
      new Set(
        services.map((s) => (s.category || "").trim()).filter(Boolean)
      )
    );
    return ["All", ...uniq];
  }, [services]);
  const [category, setCategory] = useState("All");
  const [status, setStatus] = useState("All"); // All | approved | pending | rejected
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(services[0]?.id || "");

  const filtered = useMemo(() => {
    return services.filter((s) => {
      if (category !== "All" && (s.category || "").trim() !== category) {
        return false;
      }
      if (status !== "All" && (s.status || "").toLowerCase() !== status) {
        return false;
      }
      if (
        search &&
        !`${s.title} ${s.vendor} ${s.category}`
          .toLowerCase()
          .includes(search.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [services, category, status, search]);

  const selected = useMemo(
    () => services.find((s) => s.id === selectedId),
    [services, selectedId]
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

  function updateService(patch) {
    if (!selected) return;
    const next = deepClone(data);
    const idx = next.services.findIndex((x) => x.id === selected.id);
    if (idx >= 0) {
      next.services[idx] = { ...normalizeService(next.services[idx]), ...patch };
      doSetData(next);
    }
  }

  function addService() {
    const title = prompt("Service title?");
    if (!title) return;
    const next = deepClone(data);
    const newId =
      Math.max(
        0,
        ...next.services
          .map((s) => Number(s.id))
          .filter((n) => !Number.isNaN(n))
      ) + 1;
    next.services.push(
      normalizeService({
        id: String(newId),
        title,
        vendor: "",
        vendorId: "",
        category: "",
        price: 0,
        rating: 0,
        reviewCount: 0,
        imageUrl: "",
        listingType: "service",
        status: "approved",
        isFeatured: false,
        description: "",
        aiHint: "",
        reviews: [],
      })
    );
    doSetData(next);
    setSelectedId(String(newId));
  }

  function duplicateService() {
    if (!selected) return;
    const next = deepClone(data);
    const copy = deepClone(selected);
    copy.id = uid();
    copy.title = `${copy.title} (Copy)`;
    next.services.push(copy);
    doSetData(next);
    setSelectedId(copy.id);
  }

  function deleteService() {
    if (!selected) return;
    if (!window.confirm(`Delete "${selected.title}"?`)) return;
    const next = deepClone(data);
    next.services = next.services.filter((s) => s.id !== selected.id);
    doSetData(next);
    setSelectedId(next.services[0]?.id || "");
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
        const idToken = await auth.currentUser?.getIdToken?.();
        const res = await fetch(`${API_BASE}/live`, {
          headers: {
            "x-tenant-id": tenantId,
            ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
          },
        });
        if (res.ok) {
          const live = await res.json();
          setData(live);
          setText(JSON.stringify(live, null, 2));
          localStorage.setItem(LS_DRAFT_KEY, JSON.stringify(live));
          setSelectedId(live?.services?.[0]?.id || "");
        }
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
      toastOK("Published listings to live");
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
        body: JSON.stringify({ message: message || "", data }),
      });
      if (!res.ok) throw new Error(await res.text());
      toastOK("Checkpoint saved");
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
        headers: {
          "x-tenant-id": tenantId,
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
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
        headers: {
          "x-tenant-id": tenantId,
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
      });
      if (!res.ok) throw new Error(await res.text());
      toastOK("Cleared history");
      await refreshHistory();
    } catch (e) {
      setErr(e.message || "Failed to clear");
    }
  }

  // Import / Export of full working appData
  async function handleImport(ev) {
    const file = ev.target.files?.[0];
    if (!file) return;
    try {
      const txt = await file.text();
      const json = JSON.parse(txt);
      doSetData(json);
      toastOK("Imported JSON into working copy");
    } catch {
      setErr("Invalid JSON file");
    } finally {
      ev.target.value = "";
    }
  }
  function handleExport() {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.download = `appData-working-${Date.now()}.json`;
    a.href = url;
    a.click();
    URL.revokeObjectURL(url);
  }

  const stats = summarizeServices(services);

  return (
    <div className="container py-4">
      {/* Lazy banner (keeps admin bundle lean) */}
      <React.Suspense fallback={null}>
        <div className="row mb-3">
          <BannerInnerTwo />
        </div>
      </React.Suspense>

<div className="row g-3 mb-3">
  <div className="col-md-3 col-sm-6">
    <div className="card px-24 py-16 shadow-none radius-12 border h-100 bg-gradient-start-5 bg-animated-gradient text-center p-3">
      <i className="bi bi-bag-check text-primary fs-3 mb-2"></i>
      <h6 className="fw-bold mb-0">{stats.total}</h6>
      <small className="text-muted">Services</small>
    </div>
  </div>

  <div className="col-md-3 col-sm-6">
    <div className="card px-24 py-16 shadow-none radius-12 border h-100 bg-gradient-start-5 text-center p-3">
      <i className="bi bi-grid text-success fs-3 mb-2"></i>
      <h6 className="fw-bold mb-0">{stats.categories}</h6>
      <small className="text-muted">Categories</small>
    </div>
  </div>

  <div className="col-md-3 col-sm-6">
    <div className="card px-24 py-16 shadow-none radius-12 border h-100 bg-gradient-start-5 text-center p-3">
      <i className="bi bi-star-fill text-warning fs-3 mb-2"></i>
      <h6 className="fw-bold mb-0">{stats.featured}</h6>
      <small className="text-muted">Featured</small>
    </div>
  </div>

{/* Status Breakdown (improved) */}
<div className="col-md-3 col-sm-6">
  <div className="card px-24 py-16 shadow-none radius-12 border h-100 bg-gradient-start-5 p-3">
    <div className="d-flex align-items-center justify-content-between mb-2">
      <div className="d-flex align-items-center gap-2">
        <i className="bi bi-flag text-danger fs-4" aria-hidden="true"></i>
        <div className="fw-semibold">Status</div>
      </div>
      {/* total count across all statuses */}
      <span className="badge text-bg-light">
        {Object.values(stats.byStatus || {}).reduce((a, v) => a + v, 0)} total
      </span>
    </div>

    {/* stacked progress showing proportions */}
    {(() => {
      const mapColor = (k) =>
        k === "approved" ? "success" :
        k === "pending"  ? "warning" :
        k === "rejected" ? "danger"  : "secondary";

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
                  aria-label={`${k} ${pct}%`}
                  aria-valuenow={pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  title={`${k}: ${v} (${pct}%)`}
                />
              );
            })}
          </div>

          {/* chips/legend */}
          <div className="d-flex flex-wrap gap-2 mt-3">
            {entries.length ? entries.map(([k, v]) => (
              <span
                key={k}
                className={`d-inline-flex align-items-center gap-2 px-2 py-1 rounded-pill border border-${mapColor(k)} text-${mapColor(k)} bg-${mapColor(k)}-subtle small`}
                title={`${k}: ${v}`}
                aria-label={`${k}: ${v}`}
              >
                <i
                  className={`bi ${k === "approved" ? "bi-check-circle" :
                               k === "pending"  ? "bi-hourglass-split" :
                               k === "rejected" ? "bi-x-octagon" : "bi-dot"} `}
                  aria-hidden="true"
                />
                <span className="text-capitalize">{k}</span>
                <span className="badge text-bg-light">{v}</span>
              </span>
            )) : (
              <span className="text-muted small">No status data</span>
            )}
          </div>

          {/* headline figure: approved % */}
          <div className="d-flex justify-content-between align-items-center mt-3">
            <small className="text-muted">Total Approved: </small>
            <span className="fw-semibold">
              {total ? Math.round(((stats.byStatus?.approved ?? 0) / total) * 100) : 0}%
            </span>
          </div>
        </>
      );
    })()}
  </div>
</div>

</div>


     

      <div className="pt-4 d-flex gap-2 mb-3">
        <label className="btn btn-light mb-0 d-none">
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

      {/* Compact checkpoint bar */}
      <CheckpointBar
        onSave={saveCheckpoint}
        onClear={clearHistory}
        onUndo={undo}
        disabled={busy}
      />

      <div className="d-flex gap-3">
        {/* Left: editor */}
        <div className="flex-grow-1">
          <ul className="nav nav-tabs mb-3">
            <li className="nav-item">
              <button
                className={`nav-link ${tab === "visual" ? "active" : ""}`}
                onClick={() => setTab("visual")}
              >
                Visual editor
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${tab === "json" ? "active" : ""}`}
                onClick={() => setTab("json")}
              >
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
            <ServicesEditor
              services={services}
              startups={startups}
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
              addService={addService}
              duplicateService={duplicateService}
              deleteService={deleteService}
              updateService={updateService}
            />
          )}
        </div>

        {/* Right: server version history */}
        <div style={{ width: 380 }}>
          <VersionHistory items={history} onRestore={restoreCheckpoint} />
        </div>
      </div>
    </div>
  );
}

/* -------------------------------- Subcomponents ------------------------------- */

function CheckpointBar({ onSave, onClear, onUndo, disabled }) {
  const [msg, setMsg] = useState("");
  return (
    <div className="d-flex align-items-center gap-2 mb-3">
      <input
        className="form-control"
        placeholder="Checkpoint message (e.g. 'Tweaked pricing & featured items')"
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

function ServicesEditor(props) {
  const {
    services,
    startups,
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
    addService,
    duplicateService,
    deleteService,
    updateService,
  } = props;

  const vendorOptions = useMemo(
    () =>
      startups.map((s) => ({
        id: s.id,
        name: s.name,
      })),
    [startups]
  );

  return (
    <div className="card">
      <div className="card-header d-flex justify-content-between">
        <span className="fw-semibold">Visual editor</span>
        <span className="text-muted small">CRUD for services (listings)</span>
      </div>
      <div className="card-body">
        {/* Filters */}
        <div className="row g-2 align-items-end mb-3">
          <div className="col-12 col-md-3">
            <label className="form-label">Category</label>
            <select
              className="form-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {allCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="col-12 col-md-3">
            <label className="form-label">Status</label>
            <select
              className="form-select"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {["All", "approved", "pending", "rejected"].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="col">
            <label className="form-label">Search</label>
            <input
              className="form-control"
              placeholder="Title, vendor, category…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="col-auto">
            <button
              className="btn rounded-pill text-primary-50 hover-text-primary-200 bg-primary-500 bg-hover-primary-800 radius-8 px-12 py-6 w-100"
              onClick={addService}
            >
              + Add service
            </button>
          </div>
          <div className="col-auto">
            <button
              className="btn rounded-pill border text-neutral-500 border-neutral-700 radius-8 px-12 py-6 bg-hover-primary-700 text-hover-white w-100"
              onClick={duplicateService}
              disabled={!selected}
            >
              Duplicate
            </button>
          </div>
          <div className="col-auto">
            <button
              className="btn btn-danger-500 rounded-pill border text-neutral-500 border-neutral-700 radius-8 px-12 py-6 bg-hover-danger-700 text-hover-white w-100"
              onClick={deleteService}
              disabled={!selected}
            >
              Delete
            </button>
          </div>
        </div>

        <div className="row">
          {/* List */}
          <div className="col-4">
            <div className="list-group mb-2" style={{ maxHeight: 420, overflow: "auto" }}>
              {filtered.map((s) => (
                <button
                  key={s.id}
                  className={
                    "list-group-item list-group-item-action d-flex justify-content-between align-items-center " +
                    (selectedId === s.id ? "active" : "")
                  }
                  onClick={() => setSelectedId(s.id)}
                >
                  <span className="text-truncate">{s.title}</span>
                  <span className="badge bg-light text-dark">{s.category || "—"}</span>
                </button>
              ))}
              {!filtered.length && (
                <div className="text-muted small p-2">No services match your filters.</div>
              )}
            </div>
            <div className="small text-muted">
              Showing {filtered.length} of {services.length}
            </div>
          </div>

        {/* Editor */}
          <div className="col">
            {selected ? (
              <>
                <div className="mb-3">
                  <label className="form-label">Title</label>
                  <input
                    className="form-control"
                    value={selected.title}
                    onChange={(e) => updateService({ title: e.target.value })}
                  />
                </div>

                <div className="row g-3">
                  <div className="col-md-4">
                    <label className="form-label">Category</label>
                    <input
                      className="form-control"
                      value={selected.category || ""}
                      onChange={(e) => updateService({ category: e.target.value })}
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Listing type</label>
                    <select
                      className="form-select"
                      value={selected.listingType || "service"}
                      onChange={(e) => updateService({ listingType: e.target.value })}
                    >
                      <option value="service">Service</option>
                      <option value="saas">SaaS</option>
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Status</label>
                    <select
                      className="form-select"
                      value={selected.status || "approved"}
                      onChange={(e) => updateService({ status: e.target.value })}
                    >
                      <option value="approved">approved</option>
                      <option value="pending">pending</option>
                      <option value="rejected">rejected</option>
                    </select>
                  </div>
                </div>

                <div className="row g-3 mt-1">
                  <div className="col-md-4">
                    <label className="form-label">Vendor</label>
                    <input
                      className="form-control"
                      list="vendorList"
                      value={selected.vendor || ""}
                      onChange={(e) => updateService({ vendor: e.target.value })}
                    />
                    <datalist id="vendorList">
                      {vendorOptions.map((v) => (
                        <option key={v.id} value={v.name} />
                      ))}
                    </datalist>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Vendor ID</label>
                    <input
                      className="form-control"
                      value={selected.vendorId || ""}
                      onChange={(e) => updateService({ vendorId: e.target.value })}
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">AI hint (optional)</label>
                    <input
                      className="form-control"
                      value={selected.aiHint || ""}
                      onChange={(e) => updateService({ aiHint: e.target.value })}
                    />
                  </div>
                </div>

                <div className="row g-3 mt-1">
                  <div className="col-md-4">
                    <label className="form-label">Price (R)</label>
                    <input
                      type="number"
                      min="0"
                      className="form-control"
                      value={Number(selected.price || 0)}
                      onChange={(e) => updateService({ price: Number(e.target.value || 0) })}
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Rating (0–5)</label>
                    <input
                      type="number"
                      min="0"
                      max="5"
                      step="0.1"
                      className="form-control"
                      value={Number(selected.rating || 0)}
                      onChange={(e) => updateService({ rating: Number(e.target.value || 0) })}
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Review count</label>
                    <input
                      type="number"
                      min="0"
                      className="form-control"
                      value={Number(selected.reviewCount || 0)}
                      onChange={(e) =>
                        updateService({ reviewCount: Number(e.target.value || 0) })
                      }
                    />
                  </div>
                </div>

                <div className="row g-3 mt-1">
                  <div className="col-md-8">
                    <label className="form-label">Image URL</label>
                    <input
                      className="form-control"
                      value={selected.imageUrl || ""}
                      onChange={(e) => updateService({ imageUrl: e.target.value })}
                    />
                  </div>
                  <div className="col-md-4 d-flex align-items-end gap-3">
                    <div className="form-check">
                      <input
                        id="isFeatured"
                        type="checkbox"
                        className="form-check-input"
                        checked={!!selected.isFeatured}
                        onChange={(e) => updateService({ isFeatured: !!e.target.checked })}
                      />
                      <label htmlFor="isFeatured" className="form-check-label">
                        Featured
                      </label>
                    </div>
                  </div>
                </div>

                <div className="mb-3 mt-2">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    rows={4}
                    value={selected.description || ""}
                    onChange={(e) => updateService({ description: e.target.value })}
                  />
                </div>

                {/* Preview */}
                <div className="border rounded p-2">
                  <div className="text-muted small mb-1">Card preview</div>
                  <div className="d-flex align-items-center gap-2">
                    <img
                      src={selected.imageUrl || "/assets/images/placeholder-4x3.png"}
                      alt=""
                      style={{ width: 120, height: 72, objectFit: "cover", borderRadius: 6 }}
                    />
                    <div>
                      <div className="fw-semibold">{selected.title || "Untitled service"}</div>
                      <div className="text-muted small">{selected.vendor || "Vendor"}</div>
                      <div className="small">
                        R{Number(selected.price || 0).toLocaleString()} · ★{" "}
                        {Number(selected.rating || 0).toFixed(1)}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-muted mt-2">Select a service to edit details.</div>
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

