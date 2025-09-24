// src/pages/Dashboard.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../lib/api";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

/** Small helpers */
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const numberOrNull = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

export default function Dashboard() {
  // identity
  const [me, setMe] = useState(null);

  // filters
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [featured, setFeatured] = useState("any"); // any|true|false
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  // paging
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // data
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  // modal state (create service)
  const modalRef = useRef(null);
  const [newSvc, setNewSvc] = useState({
    title: "",
    price: "",
    category: "",
    vendor: "",
    isFeatured: false,
  });

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / pageSize)),
    [total, pageSize]
  );

  const tenantId = useMemo(
    () => sessionStorage.getItem("tenantId") || "vendor",
    []
  );

  useEffect(() => {
    // identity
    (async () => {
      try {
        const { data } = await api.get("/api/me");
        setMe(data);
      } catch {
        // not logged in? this page should be wrapped by PrivateRoute, but guard anyway
        setMe(null);
      }
    })();
  }, []);

  // fetch services when filters change
  useEffect(() => {
    let ignore = false;

    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const params = {
          q: q || undefined,
          category: category || undefined,
          page,
          pageSize,
        };
        if (featured !== "any") params.featured = String(featured === "true");
        const min = numberOrNull(minPrice);
        const max = numberOrNull(maxPrice);
        if (min !== null) params.minPrice = min;
        if (max !== null) params.maxPrice = max;

        const { data } = await api.get("/api/data/services", { params });
        if (!ignore) {
          setRows(data.items || []);
          setTotal(data.total || 0);
        }
      } catch (e) {
        if (!ignore) setErr(e?.response?.data?.message || e.message);
      } finally {
        if (!ignore) setLoading(false);
      }
    })();

    return () => {
      ignore = true;
    };
  }, [q, category, featured, minPrice, maxPrice, page, pageSize]);

  // derive categories from loaded data (simple UX improv)
  const categories = useMemo(() => {
    const set = new Set();
    rows.forEach((r) => r.category && set.add(r.category));
    return Array.from(set).sort();
  }, [rows]);

  function resetFilters() {
    setQ("");
    setCategory("");
    setFeatured("any");
    setMinPrice("");
    setMaxPrice("");
    setPage(1);
  }

  function viewAll() {
    setQ("");
    setCategory("");
    setFeatured("any");
    setMinPrice("");
    setMaxPrice("");
    setPageSize(100); // quick “view all”
    setPage(1);
  }

  /** Bootstrap Modal helpers */
  function openCreateModal() {
    if (!window.bootstrap) {
      toast.error("Bootstrap JS not loaded");
      return;
    }
    const modal = new window.bootstrap.Modal(modalRef.current);
    modal.show();
  }
  function closeCreateModal() {
    if (!window.bootstrap) return;
    const instance = window.bootstrap.Modal.getInstance(modalRef.current);
    instance?.hide();
  }

  async function submitCreate(e) {
    e.preventDefault();
    try {
      if (!newSvc.title || !newSvc.category || !newSvc.vendor) {
        toast.warn("Title, Category and Vendor are required.");
        return;
      }
      const priceNum = Number(newSvc.price);
      if (!Number.isFinite(priceNum) || priceNum < 0) {
        toast.warn("Price must be a valid non-negative number.");
        return;
      }
      await api.post("/api/data/services", {
        title: newSvc.title.trim(),
        price: priceNum,
        category: newSvc.category.trim(),
        vendor: newSvc.vendor.trim(),
        isFeatured: !!newSvc.isFeatured,
      });
      toast.success("Service created.");
      closeCreateModal();
      setNewSvc({ title: "", price: "", category: "", vendor: "", isFeatured: false });
      // refresh list
      setPage(1);
      // trigger effect by slight state change
      setQ((s) => s + "");
    } catch (e) {
      toast.error(e?.response?.data?.message || e.message || "Failed to create service.");
    }
  }

  return (
    <div className="container py-4">
      <ToastContainer position="top-right" autoClose={2500} />

      <header className="d-flex flex-wrap justify-content-between align-items-center mb-3">
        <div>
          <h1 className="h3 mb-0">Dashboard</h1>
          <small className="text-muted">
            Tenant: <code>{tenantId}</code>
            {me?.email ? <> · Signed in as <strong>{me.email}</strong></> : null}
          </small>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary btn-sm" onClick={resetFilters}>
            Reset filters
          </button>
          <button className="btn btn-outline-primary btn-sm" onClick={viewAll}>
            View all
          </button>
          <button className="btn btn-primary btn-sm" onClick={openCreateModal}>
            + New Service
          </button>
        </div>
      </header>

      {/* Filters */}
      <section className="card mb-3">
        <div className="card-body">
          <form
            className="row g-3"
            onSubmit={(e) => {
              e.preventDefault();
              setPage(1);
            }}
            aria-label="Service filters"
          >
            <div className="col-md-4">
              <label htmlFor="q" className="form-label">Search</label>
              <input
                id="q"
                className="form-control"
                placeholder="Title, category, vendor, tag..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <div className="col-md-3">
              <label htmlFor="category" className="form-label">Category</label>
              <input
                id="category"
                className="form-control"
                placeholder="e.g. Design"
                list="catlist"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
              <datalist id="catlist">
                {categories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
            <div className="col-md-2">
              <label htmlFor="featured" className="form-label">Featured</label>
              <select
                id="featured"
                className="form-select"
                value={featured}
                onChange={(e) => setFeatured(e.target.value)}
              >
                <option value="any">Any</option>
                <option value="true">Featured</option>
                <option value="false">Not featured</option>
              </select>
            </div>
            <div className="col-md-1">
              <label htmlFor="minPrice" className="form-label">Min</label>
              <input
                id="minPrice"
                type="number"
                min="0"
                className="form-control"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
              />
            </div>
            <div className="col-md-1">
              <label htmlFor="maxPrice" className="form-label">Max</label>
              <input
                id="maxPrice"
                type="number"
                min="0"
                className="form-control"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
            </div>
            <div className="col-md-1">
              <label htmlFor="pageSize" className="form-label">Page</label>
              <select
                id="pageSize"
                className="form-select"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
              >
                {[10, 20, 50, 100].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          </form>
        </div>
      </section>

      {/* Results */}
      <section aria-live="polite" aria-busy={loading}>
        <div className="card">
          <div className="card-body table-responsive">
            {err && (
              <div className="alert alert-danger mb-3" role="alert">
                {err}
              </div>
            )}
            <table className="table align-middle">
              <caption className="text-muted">
                {loading ? "Loading…" : `${total} result${total === 1 ? "" : "s"}`}
              </caption>
              <thead>
                <tr>
                  <th scope="col">Title</th>
                  <th scope="col" style={{width: 120}}>Price</th>
                  <th scope="col">Category</th>
                  <th scope="col">Vendor</th>
                  <th scope="col" style={{width: 110}}>Featured</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && !loading ? (
                  <tr><td colSpan={5} className="text-center text-muted py-4">No services found.</td></tr>
                ) : (
                  rows.map((s) => (
                    <tr key={s.id}>
                      <td>{s.title}</td>
                      <td>R {Number(s.price).toLocaleString()}</td>
                      <td>{s.category}</td>
                      <td>{s.vendor}</td>
                      <td>
                        {s.isFeatured ? (
                          <span className="badge text-bg-success">Featured</span>
                        ) : (
                          <span className="badge text-bg-secondary">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* pagination */}
            <nav className="d-flex justify-content-between align-items-center">
              <div className="small text-muted">
                Page {page} of {totalPages}
              </div>
              <ul className="pagination mb-0">
                <li className={`page-item ${page <= 1 ? "disabled" : ""}`}>
                  <button className="page-link" onClick={() => setPage(clamp(page - 1, 1, totalPages))}>
                    Prev
                  </button>
                </li>
                <li className={`page-item ${page >= totalPages ? "disabled" : ""}`}>
                  <button className="page-link" onClick={() => setPage(clamp(page + 1, 1, totalPages))}>
                    Next
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </section>

      {/* Create Service Modal */}
      <div className="modal fade" tabIndex="-1" ref={modalRef} aria-labelledby="createServiceTitle" aria-hidden="true">
        <div className="modal-dialog modal-dialog-scrollable">
          <div className="modal-content">
            <form onSubmit={submitCreate}>
              <div className="modal-header">
                <h5 id="createServiceTitle" className="modal-title">Create Service</h5>
                <button type="button" className="btn-close" onClick={closeCreateModal} aria-label="Close"></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label" htmlFor="svcTitle">Title</label>
                  <input id="svcTitle" className="form-control" value={newSvc.title}
                    onChange={(e) => setNewSvc({ ...newSvc, title: e.target.value })} required />
                </div>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label" htmlFor="svcCategory">Category</label>
                    <input id="svcCategory" className="form-control" value={newSvc.category}
                      onChange={(e) => setNewSvc({ ...newSvc, category: e.target.value })} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label" htmlFor="svcVendor">Vendor</label>
                    <input id="svcVendor" className="form-control" value={newSvc.vendor}
                      onChange={(e) => setNewSvc({ ...newSvc, vendor: e.target.value })} required />
                  </div>
                </div>
                <div className="row g-3 mt-1">
                  <div className="col-md-6">
                    <label className="form-label" htmlFor="svcPrice">Price (R)</label>
                    <input id="svcPrice" type="number" min="0" className="form-control" value={newSvc.price}
                      onChange={(e) => setNewSvc({ ...newSvc, price: e.target.value })} required />
                  </div>
                  <div className="col-md-6 d-flex align-items-end">
                    <div className="form-check">
                      <input id="svcFeatured" className="form-check-input" type="checkbox"
                        checked={newSvc.isFeatured}
                        onChange={(e) => setNewSvc({ ...newSvc, isFeatured: e.target.checked })} />
                      <label className="form-check-label" htmlFor="svcFeatured">Featured</label>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline-secondary" onClick={closeCreateModal}>Cancel</button>
                <button className="btn btn-primary" type="submit">Create</button>
              </div>
            </form>
          </div>
        </div>
      </div>
      
    </div>
  );
}
