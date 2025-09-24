import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { auth } from "../lib/firebase";
import { fetchMySubscriptions, subscribeToService, unsubscribeFromService } from "../lib/subscriptions";

export default function Market1() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [subs, setSubs] = useState(() => new Set());
  const navigate = useNavigate();
  const tenantId = useMemo(() => sessionStorage.getItem("tenantId") || "vendor", []);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await api.get("/api/data/services", {
      params: { q: q || undefined, page: 1, pageSize: 40, featured: "true" }
    });
    setItems(data.items || []);
    setLoading(false);
  }, [q]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    (async () => {
      try {
        if (!auth.currentUser) return;
        const items = await fetchMySubscriptions();
        const set = new Set(items.filter((x)=> (x.type||'service')==='service').map((x)=> String(x.serviceId)));
        setSubs(set);
      } catch {}
    })();
  }, [tenantId]);

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
        setSubs((prev) => { const n = new Set(Array.from(prev)); n.delete(id); return n; });
      } else {
        await subscribeToService(id);
        setSubs((prev) => new Set([...Array.from(prev), id]));
      }
    } catch {}
  }

  return (
    <div className="container py-4">
      <div className="d-flex align-items-end justify-content-between mb-3">
        <div>
          <h1 className="h4 mb-1">Featured Marketplace</h1>
          <small className="text-muted">Discover services from trusted vendors</small>
        </div>
        <div className="d-flex gap-2">
          <input className="form-control" placeholder="Search…" value={q} onChange={(e)=>setQ(e.target.value)} />
          <button className="btn btn-primary" onClick={load}>Search</button>
        </div>
      </div>

      {loading ? <p>Loading…</p> : (
        <div className="row g-3">
          {items.length === 0 && <p className="text-muted">No featured services yet.</p>}
          {items.map((s) => (
            <div key={s.id} className="col-12 col-md-6 col-lg-4">
              <div className="card h-100">
                <div className="card-body d-flex flex-column">
                  <div className="d-flex justify-content-between">
                    <h5 className="card-title">{s.title}</h5>
                    {s.isFeatured && <span className="badge text-bg-success">Featured</span>}
                  </div>
                  <div className="text-muted mb-2">{s.category} · {s.vendor}</div>
                  <p className="flex-grow-1">{s.description || "Quality service for SMMEs."}</p>
                  <div className="d-flex justify-content-between align-items-center">
                    <strong>R {Number(s.price).toLocaleString()}</strong>
                    <div className="d-flex gap-2">
                      <button className="btn btn-outline-primary btn-sm" onClick={() => alert("Checkout flow to be wired")}>
                      Select
                      </button>
                      <button className={subs.has(String(s.id)) ? "btn btn-sm btn-secondary" : "btn btn-sm btn-primary"} onClick={() => toggleSubscribe(s.id)}>
                        {subs.has(String(s.id)) ? 'Subscribed' : 'Subscribe'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
