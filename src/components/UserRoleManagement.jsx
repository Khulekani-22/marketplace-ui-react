import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import { auth } from "../lib/firebase";

export default function UserRoleManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [tenant, setTenant] = useState("");
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [tenants, setTenants] = useState([{ id: "public", name: "Public" }]);
  const meEmail = (auth.currentUser?.email || sessionStorage.getItem("userEmail") || "").toLowerCase();

  const sorted = useMemo(() => {
    return [...users].sort((a, b) => (a.email || "").localeCompare(b.email || ""));
  }, [users]);

  // Search + filter
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("All"); // All | admin | member
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sorted.filter((u) => {
      if (roleFilter !== "All" && (u.role || "member") !== roleFilter) return false;
      if (!q) return true;
      const blob = `${u.email} ${u.tenantId} ${u.role}`.toLowerCase();
      return blob.includes(q);
    });
  }, [sorted, query, roleFilter]);

  async function refresh() {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/api/users");
      const list = Array.isArray(data) ? data : [];
      // Basic normalization
      setUsers(list.map((u) => ({ email: (u.email || "").toLowerCase(), tenantId: u.tenantId || "public", role: u.role || "member" })));
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  // Load tenants for dropdown
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/api/tenants");
        const arr = Array.isArray(data) ? data : [];
        const normalized = [
          { id: "public", name: "Public" },
          ...arr.map((t) => (typeof t === "string" ? { id: t, name: t } : { id: t?.id, name: t?.name || t?.id }))
        ].filter((t) => t && t.id);
        // Dedup by id
        const map = new Map();
        normalized.forEach((t) => map.set(t.id, t));
        setTenants(Array.from(map.values()));
      } catch {
        setTenants([{ id: "public", name: "Public" }]);
      }
    })();
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

  async function saveUser({ email, tenantId, role }) {
    await api.post("/api/users", { email, tenantId, role });
    // If the current signed-in user was updated, sync session hints
    if (email.toLowerCase() === meEmail) {
      sessionStorage.setItem("tenantId", tenantId);
      sessionStorage.setItem("role", role);
    }
  }

  async function toggleAdmin(u) {
    setError(""); setOk("");
    const nextRole = (u.role === "admin" ? "member" : "admin");
    try {
      await saveUser({ email: u.email, tenantId: u.tenantId || "public", role: nextRole });
      setUsers((prev) => prev.map((x) => (x.email === u.email ? { ...x, role: nextRole } : x)));
      setOk(`${u.email} is now ${nextRole}`);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Failed to update role");
    }
  }

  async function changeTenant(u, nextTenant) {
    setError(""); setOk("");
    try {
      await saveUser({ email: u.email, tenantId: nextTenant, role: u.role || "member" });
      setUsers((prev) => prev.map((x) => (x.email === u.email ? { ...x, tenantId: nextTenant } : x)));
      setOk(`${u.email} moved to ${nextTenant}`);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Failed to change tenant");
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

        <div className="d-flex flex-wrap align-items-end justify-content-between gap-2 mb-3">
          <div className="d-flex align-items-end gap-2 flex-wrap">
            <div>
              <label className="form-label text-sm">Search</label>
              <input
                className="form-control"
                placeholder="Filter by email, tenant, role"
                value={query}
                onChange={(e)=>setQuery(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label text-sm">Role</label>
              <select
                className="form-select"
                value={roleFilter}
                onChange={(e)=>setRoleFilter(e.target.value)}
              >
                <option>All</option>
                <option>admin</option>
                <option>member</option>
              </select>
            </div>
          </div>
        </div>

        <div className="table-responsive scroll-sm">
          <table className="table bordered-table sm-table mb-0 align-middle">
            <thead>
              <tr>
                <th>Email</th>
                <th style={{minWidth:160}}>Tenant</th>
                <th>Role</th>
                <th style={{width:220}}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={4}>Loading…</td></tr>
              )}
              {!loading && visible.length === 0 && (
                <tr><td colSpan={4}>No users match your filters.</td></tr>
              )}
              {!loading && visible.map((u) => (
                <tr key={u.email}>
                  <td>{u.email}</td>
                  <td>
                    <select
                      className="form-select form-select-sm w-auto bg-base border text-secondary-light rounded-pill"
                      value={u.tenantId || "public"}
                      onChange={(e)=>changeTenant(u, e.target.value)}
                      title="Switch tenant"
                    >
                      {tenants.map((t)=> (
                        <option key={t.id} value={t.id}>{t.name || t.id}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <span className={u.role === 'admin' ? 'badge bg-success-focus text-success-700' : 'badge bg-neutral-200 text-neutral-900'}>{u.role || 'member'}</span>
                  </td>
                  <td>
                    <div className="d-flex gap-2">
                      <button
                        type="button"
                        className={u.role === 'admin' ? 'btn btn-outline-danger btn-sm' : 'btn btn-outline-success btn-sm'}
                        onClick={()=>toggleAdmin(u)}
                        title={u.role === 'admin' ? 'Revoke admin' : 'Grant admin'}
                      >
                        {u.role === 'admin' ? 'Revoke Admin' : 'Make Admin'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
