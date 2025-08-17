import { useEffect, useState } from "react";
import { api } from "../lib/api";

export default function AllDataTable() {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data } = await api.get("/api/data/services", { params: { q, page: 1, pageSize: 100 } });
    setRows(data.items || []);
    setLoading(false);
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  return (
    <div className="container py-4">
      <div className="d-flex align-items-end justify-content-between mb-3">
        <div>
          <h1 className="h4 mb-1">All Services</h1>
          <small className="text-muted">Filter & explore</small>
        </div>
        <div className="d-flex gap-2">
          <input className="form-control" placeholder="Search…" value={q} onChange={(e)=>setQ(e.target.value)} />
          <button className="btn btn-primary" onClick={load}>Search</button>
        </div>
      </div>

      <div className="card">
        <div className="table-responsive">
          <table className="table align-middle mb-0">
            <thead>
              <tr>
                <th>Title</th>
                <th style={{width:140}}>Price</th>
                <th>Category</th>
                <th>Vendor</th>
                <th style={{width:110}}>Featured</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center py-4">Loading…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-4 text-muted">No results</td></tr>
              ) : rows.map((s)=>(
                <tr key={s.id}>
                  <td>{s.title}</td>
                  <td>R {Number(s.price).toLocaleString()}</td>
                  <td>{s.category}</td>
                  <td>{s.vendor}</td>
                  <td>{s.isFeatured ? <span className="badge text-bg-success">Yes</span> : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
