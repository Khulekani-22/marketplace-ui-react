import { useEffect, useState } from "react";
import { api } from "../lib/api";

export default function DataOverview() {
  const [stats, setStats] = useState({ total: 0, featured: 0, avg: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      // pull a large page to compute simple KPIs client-side
      const { data } = await api.get("/api/data/services", { 
        params: { page: 1, pageSize: 1000 },
        timeout: 8000 
      });
      const items = data.items || [];
      const total = data.total || items.length;
      const featured = items.filter(s => s.isFeatured).length;
      const avg = items.length ? items.reduce((a,b)=>a+Number(b.price||0),0)/items.length : 0;
      setStats({ total, featured, avg });
      setLoading(false);
    })();
  }, []);

  return (
    <div className="container py-4">
      <h1 className="h3 mb-4">Overview</h1>
      {loading ? <p>Loading…</p> : (
        <div className="row g-3">
          <div className="col-md-4">
            <div className="card">
              <div className="card-body">
                <div className="text-muted">Total Services</div>
                <div className="display-6">{stats.total}</div>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card">
              <div className="card-body">
                <div className="text-muted">Featured</div>
                <div className="display-6">{stats.featured}</div>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card">
              <div className="card-body">
                <div className="text-muted">Avg Price</div>
                <div className="display-6">R {stats.avg.toFixed(2)}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
