import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";

export default function UserRoleManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [tenant, setTenant] = useState("");
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  const sorted = useMemo(() => {
    return [...users].sort((a, b) => (a.email || "").localeCompare(b.email || ""));
  }, [users]);

  async function refresh() {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/api/users");
      setUsers(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleUpgrade(e) {
    e.preventDefault();
    setError("");
    setOk("");
    const em = email.trim();
    const tn = tenant.trim();
    if (!em || !tn) {
      setError("Email and new tenant id are required");
      return;
    }
    try {
      await api.post("/api/users/upgrade", { email: em, newTenantId: tn });
      setOk("Upgraded successfully");
      // Make current session reflect admin if upgrading current user
      const me = (window?.localStorage && window.localStorage.getItem("userEmail")) || window?.sessionStorage?.getItem("userEmail");
      if (me && me.toLowerCase() === em.toLowerCase()) {
        sessionStorage.setItem("tenantId", tn);
        sessionStorage.setItem("role", "admin");
      }
      await refresh();
    } catch (e2) {
      setError(e2?.response?.data?.message || e2?.message || "Upgrade failed");
    }
  }

  return (
    <div className="card h-100 p-0 radius-12 overflow-hidden">
      <div className="card-header border-bottom bg-base py-16 px-24 d-flex align-items-center justify-content-between gap-3 flex-wrap">
        <h6 className="mb-0">Upgrade Public Tenant to Private Admin</h6>
      </div>
      <div className="card-body p-24">
        <form onSubmit={handleUpgrade} className="row g-3 align-items-end mb-24">
          <div className="col-sm-5">
            <label className="form-label text-sm">User Email</label>
            <input type="email" className="form-control" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="user@example.com" required />
          </div>
          <div className="col-sm-5">
            <label className="form-label text-sm">New Tenant ID (private)</label>
            <input type="text" className="form-control" value={tenant} onChange={(e)=>setTenant(e.target.value)} placeholder="acme-inc" required />
          </div>
          <div className="col-sm-2">
            <button type="submit" className="btn btn-primary w-100">Upgrade</button>
          </div>
        </form>
        {error && <div className="alert alert-danger py-8 px-12 mb-16">{error}</div>}
        {ok && <div className="alert alert-success py-8 px-12 mb-16">{ok}</div>}

        <div className="table-responsive scroll-sm">
          <table className="table bordered-table sm-table mb-0">
            <thead>
              <tr>
                <th>Email</th>
                <th>Tenant</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={3}>Loading…</td></tr>
              )}
              {!loading && sorted.length === 0 && (
                <tr><td colSpan={3}>No users yet.</td></tr>
              )}
              {!loading && sorted.map((u) => (
                <tr key={u.email}>
                  <td>{u.email}</td>
                  <td><span className="badge bg-neutral-200 text-neutral-900">{u.tenantId || "public"}</span></td>
                  <td><span className={u.role === 'admin' ? 'badge bg-success-focus text-success-700' : 'badge bg-neutral-200 text-neutral-900'}>{u.role || 'member'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

