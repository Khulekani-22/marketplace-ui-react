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
  const [vendorByEmail, setVendorByEmail] = useState({});
  const [vendorByOwner, setVendorByOwner] = useState({});
  const [vendorById, setVendorById] = useState({});
  const [trace, setTrace] = useState({}); // email -> { uid, viaEmail, viaUid, viaId }
  const [traceBusy, setTraceBusy] = useState({}); // email -> boolean
  const [syncBusy, setSyncBusy] = useState({}); // email -> boolean
  // Platform users search
  const [allQuery, setAllQuery] = useState("");
  const [allUsers, setAllUsers] = useState([]);
  const [allBusy, setAllBusy] = useState(false);
  const [allErr, setAllErr] = useState("");
  const [allNext, setAllNext] = useState("");
  const [allPageSize, setAllPageSize] = useState(100);
  const [tenantPick, setTenantPick] = useState({}); // email -> tenantId

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
      // Also fetch vendors in current tenant to know who already has a vendor profile
      try {
        const vendors = await api.get("/api/data/vendors").then((r) => r.data || []);
        const mEmail = {}, mOwner = {}, mId = {};
        vendors.forEach((v) => {
          const e = (v.contactEmail || v.email || "").toLowerCase();
          const ouid = v.ownerUid || "";
          const id1 = String(v.id || "");
          const id2 = String(v.vendorId || "");
          if (e) mEmail[e] = v;
          if (ouid) mOwner[ouid] = v;
          if (id1) mId[id1] = v;
          if (id2) mId[id2] = v;
        });
        setVendorByEmail(mEmail);
        setVendorByOwner(mOwner);
        setVendorById(mId);
      } catch {}
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

  async function createVendorFromUser(u) {
    setError(""); setOk("");
    try {
      // Lookup Firebase UID for this email (admin-only), then create vendor linked to that UID
      let ownerUid = "";
      try {
        const { data } = await api.get("/api/users/lookup", { params: { email: u.email } });
        ownerUid = data?.uid || "";
      } catch (_) {
        ownerUid = ""; // fallback to email-only match
      }
      const name = (u.email || "").split("@")[0] || "Vendor";
      const payload = {
        id: ownerUid || undefined,
        name,
        contactEmail: u.email,
        ownerUid: ownerUid || undefined,
        status: "pending",
        kycStatus: "pending",
        categories: [],
        tags: [],
      };
      await api.post("/api/data/vendors", payload);
      setVendorByEmail((prev) => ({ ...prev, [u.email]: true }));
      setOk(`Created vendor profile for ${u.email}`);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Failed to create vendor profile");
    }
  }

  async function syncFirebaseUid(u) {
    const key = (u.email || "").toLowerCase();
    setSyncBusy((prev) => ({ ...prev, [key]: true }));
    setError(""); setOk("");
    try {
      // 1) Lookup Firebase UID
      let uid = "";
      try {
        const { data } = await api.get("/api/users/lookup", { params: { email: key } });
        uid = data?.uid || "";
      } catch (e) {
        setError("Could not find Firebase UID for this email");
        return;
      }

      // 2) Persist UID on users mapping so future reads know it
      await api.post("/api/users", { email: key, tenantId: u.tenantId || "public", role: u.role || "member", uid });

      // 3) Upsert ownerUid on vendor: try current tenant, else search all tenants and update where found,
      // else create minimal vendor in current tenant
      let updatedSomewhere = false;
      const v = vendorByEmail[key];
      if (v) {
        const vid = String(v.id || v.vendorId || "");
        if (vid) {
          try { await api.put(`/api/data/vendors/${encodeURIComponent(vid)}`, { ownerUid: uid }); updatedSomewhere = true; } catch {}
        }
      } else {
        // Search across tenants to update existing vendor there
        try {
          const tenantsResp = await api.get('/api/tenants');
          const tenantList = Array.isArray(tenantsResp.data) ? tenantsResp.data : [];
          const ids = tenantList.map((t) => (typeof t === 'string' ? t : t?.id)).filter(Boolean);
          const allTenantIds = Array.from(new Set(['public', ...ids]));
          for (const tId of allTenantIds) {
            try {
              const { data: vRows } = await api.get('/api/data/vendors', { headers: { 'x-tenant-id': tId } });
              const match = Array.isArray(vRows) ? vRows.find((x)=> (x.contactEmail || x.email || '').toLowerCase() === key) : null;
              if (match) {
                const vid2 = String(match.id || match.vendorId || '');
                if (vid2) {
                  await api.put(`/api/data/vendors/${encodeURIComponent(vid2)}`, { ownerUid: uid }, { headers: { 'x-tenant-id': tId } });
                  updatedSomewhere = true;
                  break;
                }
              }
            } catch {}
          }
        } catch {}
      }
      if (!updatedSomewhere) {
        // Create minimal vendor in current tenant with this UID
        const name = key.split("@")[0] || "Vendor";
        try {
          await api.post(`/api/data/vendors`, { name, contactEmail: key, ownerUid: uid, status: "pending", kycStatus: "pending", categories: [] });
        } catch {}
      }

      // 4) Refresh vendor maps
      await refresh();
      setOk(`Synced Firebase UID for ${key}`);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Failed to sync UID");
    } finally {
      setSyncBusy((prev) => ({ ...prev, [key]: false }));
    }
  }

  function buildVendorMaps(list) {
    const byEmail = {}, byOwner = {}, byId = {};
    (list || []).forEach((v) => {
      const e = (v.contactEmail || v.email || "").toLowerCase();
      const ouid = v.ownerUid || "";
      const id1 = String(v.id || "");
      const id2 = String(v.vendorId || "");
      if (e) byEmail[e] = v;
      if (ouid) byOwner[ouid] = v;
      if (id1) byId[id1] = v;
      if (id2) byId[id2] = v;
    });
    return { byEmail, byOwner, byId };
  }

  async function traceVendor(u) {
    const key = (u.email || "").toLowerCase();
    setTraceBusy((prev) => ({ ...prev, [key]: true }));
    try {
      // Start with current-tenant vendor maps
      let viaEmail = vendorByEmail[key] || null;
      let uid = "";
      let viaUid = null;
      let viaId = null;

      // Attempt Firebase UID lookup (admin-only route); ignore errors
      try {
        const { data } = await api.get("/api/users/lookup", { params: { email: key } });
        uid = data?.uid || "";
      } catch {}

      if (uid) {
        viaUid = vendorByOwner[uid] || null;
        viaId = vendorById[uid] || null;
      }

      // If nothing found in current tenant, sweep across all tenants
      if (!viaEmail && !viaUid && !viaId) {
        try {
          // Fetch tenants list and query vendors for each tenant id
          const tenantsResp = await api.get('/api/tenants');
          const tenantList = Array.isArray(tenantsResp.data) ? tenantsResp.data : [];
          const ids = tenantList.map((t) => (typeof t === 'string' ? t : t?.id)).filter(Boolean);
          const all = [];
          // Always include public as well
          const allTenantIds = Array.from(new Set(['public', ...ids]));
          for (const tId of allTenantIds) {
            try {
              const { data: vRows } = await api.get('/api/data/vendors', { headers: { 'x-tenant-id': tId } });
              if (Array.isArray(vRows)) all.push(...vRows.map((v)=> ({ ...v, _tenantId: v.tenantId || tId })));
            } catch {}
          }
          const maps = buildVendorMaps(all);
          viaEmail = maps.byEmail[key] || null;
          if (uid) {
            viaUid = maps.byOwner[uid] || viaUid;
            viaId = maps.byId[uid] || viaId;
          }
        } catch {}
      }

      setTrace((prev) => ({ ...prev, [key]: { uid, viaEmail, viaUid, viaId } }));
    } finally {
      setTraceBusy((prev) => ({ ...prev, [key]: false }));
    }
  }

  async function searchAllUsers(reset = true) {
    setAllErr("");
    setAllBusy(true);
    try {
      const params = { search: allQuery, pageSize: allPageSize };
      if (!reset && allNext) params.pageToken = allNext;
      const { data } = await api.get("/api/users/all", { params });
      const items = Array.isArray(data?.items) ? data.items : [];
      setAllUsers((prev) => (reset ? items : [...prev, ...items]));
      setAllNext(data?.nextPageToken || "");
    } catch (e) {
      setAllErr(e?.response?.data?.message || e?.message || "Failed to search platform users");
    } finally {
      setAllBusy(false);
    }
  }

  // Auto-load all users on mount
  useEffect(() => {
    searchAllUsers(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function grantAdmin(email) {
    const t = tenantPick[email] || "public";
    try {
      await saveUser({ email, tenantId: t, role: "admin" });
      // reflect in main users table
      setUsers((prev) => {
        const hit = prev.find((x) => x.email === email);
        if (hit) return prev.map((x) => (x.email === email ? { ...x, role: "admin", tenantId: t } : x));
        return [...prev, { email, role: "admin", tenantId: t }];
      });
      setOk(`${email} granted admin (${t})`);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Failed to grant admin");
    }
  }

  function isAdminEmail(email) {
    const e = (email || '').toLowerCase();
    return users.some((u) => u.email === e && (u.role || 'member') === 'admin');
  }

  async function revokeAdmin(email) {
    const existing = users.find((u) => u.email === (email || '').toLowerCase());
    const t = existing?.tenantId || tenantPick[email] || 'public';
    try {
      await saveUser({ email, tenantId: t, role: 'member' });
      setUsers((prev) => prev.map((x) => (x.email === email ? { ...x, role: 'member' } : x)));
      setOk(`${email} admin revoked`);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Failed to revoke admin');
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
                <th>Vendor</th>
                <th style={{minWidth:320}}>Actions / Trace</th>
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
                    {vendorByEmail[u.email] ? (
                      <span className="badge bg-primary-subtle text-primary-700">Has vendor</span>
                    ) : (
                      <span className="badge bg-neutral-200 text-neutral-900">No vendor</span>
                    )}
                    {trace[u.email] && (
                      <div className="small text-secondary mt-1">
                {trace[u.email].uid ? (
                  <>
                    <div>uid: <code>{trace[u.email].uid}</code></div>
                    <div>
                      by email: {trace[u.email].viaEmail ? (
                        <>
                          <code>{String(trace[u.email].viaEmail.contactEmail || trace[u.email].viaEmail.email || "")}</code>
                          {" "}(vendorId: <code>{String(trace[u.email].viaEmail.id || trace[u.email].viaEmail.vendorId)}</code>, tenant: <code>{String(trace[u.email].viaEmail.tenantId || trace[u.email].viaEmail._tenantId || 'public')}</code>)
                        </>
                      ) : (
                        "—"
                      )}
                    </div>
                    <div>
                      by ownerUid: {trace[u.email].viaUid ? (
                        <>
                          <code>{String(trace[u.email].viaUid.ownerUid || "")}</code>{" "}
                          (vendorId: <code>{String(trace[u.email].viaUid.id || trace[u.email].viaUid.vendorId)}</code>, tenant: <code>{String(trace[u.email].viaUid.tenantId || trace[u.email].viaUid._tenantId || 'public')}</code>)
                        </>
                      ) : (
                        "—"
                      )}
                    </div>
                    <div>
                      by id==uid: {trace[u.email].viaId ? (
                        <>
                          <code>{String(trace[u.email].viaId.id || trace[u.email].viaId.vendorId)}</code>{" "}
                          (tenant: <code>{String(trace[u.email].viaId.tenantId || trace[u.email].viaId._tenantId || 'public')}</code>)
                        </>
                      ) : (
                        "—"
                      )}
                    </div>
                  </>
                ) : (
                          <div>uid: — (lookup requires admin + Firebase link)</div>
                        )}
                      </div>
                    )}
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
                      {!vendorByEmail[u.email] && (
                        <button
                          type="button"
                          className="btn btn-outline-primary btn-sm"
                          onClick={()=>createVendorFromUser(u)}
                          title="Create vendor profile for this user"
                        >
                          Create Vendor
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm"
                        onClick={()=>traceVendor(u)}
                        disabled={!!traceBusy[u.email]}
                        title="Trace vendor status via email, UID, or vendor id"
                      >
                        {traceBusy[u.email] ? 'Tracing…' : 'Trace'}
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-primary btn-sm"
                        onClick={()=>syncFirebaseUid(u)}
                        disabled={!!syncBusy[u.email]}
                        title="Lookup Firebase UID and link it to this user's vendor"
                      >
                        {syncBusy[u.email] ? 'Syncing…' : 'Sync UID'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Admin onboarding: search platform users */}
        <div className="mt-24">
          <h6 className="mb-2">Onboard Admins</h6>
          <div className="d-flex flex-wrap align-items-end gap-2 mb-2">
            <div>
              <label className="form-label text-sm">Search users</label>
              <input className="form-control" placeholder="Search by email or name" value={allQuery} onChange={(e)=>setAllQuery(e.target.value)} />
            </div>
            <button className="btn btn-outline-secondary" onClick={searchAllUsers} disabled={allBusy}>{allBusy ? 'Searching…' : 'Search'}</button>
            {allErr && <div className="text-danger small">{allErr}</div>}
          </div>
          <div className="table-responsive scroll-sm">
            <table className="table bordered-table sm-table mb-0 align-middle">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Name</th>
                  <th>UID</th>
                  <th>Tenant</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {allBusy && (
                  <tr><td colSpan={5}>Loading…</td></tr>
                )}
                {!allBusy && allUsers.length === 0 && (
                  <tr><td colSpan={5}>No results</td></tr>
                )}
                {!allBusy && allUsers.map((r) => (
                  <tr key={r.uid}>
                    <td>{r.email}</td>
                    <td>{r.displayName || '—'}</td>
                    <td><code>{r.uid}</code></td>
                    <td>
                      <select
                        className="form-select form-select-sm w-auto bg-base border text-secondary-light rounded-pill"
                        value={tenantPick[r.email] || 'public'}
                        onChange={(e)=>setTenantPick((prev)=>({ ...prev, [r.email]: e.target.value }))}
                      >
                        {tenants.map((t)=> (
                          <option key={t.id} value={t.id}>{t.name || t.id}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      {isAdminEmail(r.email) ? (
                        <button className="btn btn-sm btn-outline-danger" onClick={()=>revokeAdmin((r.email || '').toLowerCase())}>
                          Revoke Admin
                        </button>
                      ) : (
                        <button className="btn btn-sm btn-outline-success" onClick={()=>grantAdmin((r.email || '').toLowerCase())}>
                          Grant Admin
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="d-flex align-items-center justify-content-between mt-2">
              <div className="text-secondary small">Showing {allUsers.length} user(s)</div>
              <div className="d-flex align-items-center gap-2">
                <label className="text-sm">Page size</label>
                <select className="form-select form-select-sm w-auto" value={allPageSize} onChange={(e)=>setAllPageSize(Number(e.target.value)||100)}>
                  {[50,100,200,500,1000].map(n=> <option key={n} value={n}>{n}</option>)}
                </select>
                <button className="btn btn-sm btn-outline-secondary" onClick={()=>searchAllUsers(true)} disabled={allBusy}>Refresh</button>
                <button className="btn btn-sm btn-outline-primary" onClick={()=>searchAllUsers(false)} disabled={allBusy || !allNext}>{allBusy ? 'Loading…' : (allNext ? 'Load more' : 'End')}</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
