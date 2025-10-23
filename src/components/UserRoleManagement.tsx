
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api, bootstrapSession } from "../lib/api";
import { auth } from "../firebase.js";
import { writeAuditLog } from "../lib/audit";
import { hasFullAccess, normalizeRole } from "../utils/roles";

type FeaturePrivileges = { [key: string]: boolean };
type User = {
  email: string;
  tenantId: string;
  role: string;
};

type PlatformUser = {
  uid: string;
  email: string;
  displayName?: string;
};

// List of features that can be toggled for user access
const FEATURE_LIST = [
  { key: "dashboard", label: "Access To Market" },
  { key: "market1", label: "Full Marketplace" },
  { key: "access-capital", label: "Access to Capital" },
  { key: "listings-vendors", label: "Add Listings" },
  { key: "listings-vendors-mine", label: "My Listings" },
  { key: "profile-vendor", label: "Vendor Profile" },
  { key: "vendor-home", label: "Vendor Home" },
  { key: "profile-startup", label: "Startup Profile" },
  { key: "profile-vendor-admin", label: "Vendor Approval" },
  { key: "audit-logs", label: "Audit Logs" },
  { key: "listings-admin", label: "Listings Approval" },
  { key: "admin-users", label: "User Roles" },
  { key: "sloane-academy-admin", label: "Academy Admin" },
  { key: "admin-dashboard", label: "Admin Dashboard" },
  { key: "admin-wallet-credits", label: "Manage Wallet Credits" },
  { key: "email", label: "Message Center" },
  { key: "wallet", label: "My Wallet" },
  { key: "subscriptions", label: "My Subscriptions" },
  { key: "sloane-academy", label: "Sloane Academy" },
  { key: "support", label: "Support" },
];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [privileges, setPrivileges] = useState<Record<string, FeaturePrivileges>>({});
  const [privBusy, setPrivBusy] = useState<Record<string, boolean>>({});

  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [tenant, setTenant] = useState("");
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [tenants, setTenants] = useState<{ id: string; name: string }[]>([{ id: "vendor", name: "Vendor" }]);
  const meEmail = (auth.currentUser?.email || sessionStorage.getItem("userEmail") || "").toLowerCase();
  const [vendorByEmail, setVendorByEmail] = useState<Record<string, any>>({});
  const [vendorByOwner, setVendorByOwner] = useState<Record<string, any>>({});
  const [vendorById, setVendorById] = useState<Record<string, any>>({});

  const [trace, setTrace] = useState<Record<string, any>>({});
  const [traceBusy, setTraceBusy] = useState<Record<string, boolean>>({});
  const [syncBusy, setSyncBusy] = useState<Record<string, boolean>>({});
  const [tenantPick, setTenantPick] = useState<Record<string, string>>({});
  const [allUsers, setAllUsers] = useState<PlatformUser[]>([]);

  // Platform users search
  const [allQuery, setAllQuery] = useState("");
  const [allBusy, setAllBusy] = useState(false);
  const [allErr, setAllErr] = useState("");
  const [allNext, setAllNext] = useState("");
  const [allPageSize, setAllPageSize] = useState(100);

  const [uidLookupAvailable, setUidLookupAvailable] = useState(true);
  const [saveBusy, setSaveBusy] = useState(false);
  const [checkpointBusy, setCheckpointBusy] = useState(false);
  const autoRetryRef = useRef(false);

  const sorted = useMemo(() => {
    return [...users].sort((a, b) => (a.email || "").localeCompare(b.email || ""));
  }, [users]);

  // Search + filter
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("All"); // All | admin | partner | member

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filterRole = roleFilter === "All" ? null : normalizeRole(roleFilter);
    return sorted.filter((u: User) => {
      const roleName = normalizeRole(u.role);
      if (filterRole && roleName !== filterRole) return false;
      if (!q) return true;
      const blob = `${u.email} ${u.tenantId} ${u.role}`.toLowerCase();
      return blob.includes(q);
    });
  }, [sorted, query, roleFilter]);

  function buildUserPayload(list: any[]): User[] {
    const safe = Array.isArray(list) ? list : [];
    return safe.map((u: any) => ({
      email: (u.email || "").toLowerCase(),
      tenantId: u.tenantId === "vendor" ? "public" : u.tenantId || "public",
      role: normalizeRole(u.role),
    }));
  }
  
// Helper: define default feature access by role
function getDefaultRoleAccess(role: string, featureKey: string): boolean {
  const normalized = typeof role === 'string' ? role.toLowerCase() : '';
  if (normalized === 'admin') return true;
  if (normalized === 'vendor') {
    const vendorDefaults = [
      'dashboard', 'market1', 'listings-vendors', 'listings-vendors-mine', 'profile-vendor', 'vendor-home', 'wallet', 'subscriptions', 'email', 'support'
    ];
    return vendorDefaults.includes(featureKey);
  }
  if (normalized === 'startup') {
    const startupDefaults = [
      'dashboard', 'market1', 'profile-startup', 'wallet', 'subscriptions', 'email', 'support'
    ];
    return startupDefaults.includes(featureKey);
  }
  return false;
}
// Helper: define default feature access by role

  async function refresh() {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/api/users");
      const list = Array.isArray(data) ? data : [];
      // Show startups, vendors, and admin users from all-contacts
      const contactsResp = await api.get("/api/users/all-contacts");
      type Contact = {
        email: string;
        name?: string;
        role?: string;
        type?: string;
        tenantId?: string;
      };
      const contacts: Contact[] = Array.isArray(contactsResp.data?.items) ? contactsResp.data.items : [];
      const filtered = contacts.filter((u: Contact) => {
        const role = (u.role || '').toLowerCase();
        return u.type === "startup" || u.type === "vendor" || role === "admin";
      });
      setUsers(
        filtered.map((u: Contact) => ({
          email: (u.email || "").toLowerCase(),
          tenantId: !u.tenantId || u.tenantId === "public" ? "vendor" : u.tenantId,
          role: u.role || (u.type === "startup" ? "startup" : u.type === "vendor" ? "vendor" : "admin"),
        }))
      );
      // Batch fetch feature privileges for all users
      const emails = list.map((u) => (u.email || "").toLowerCase()).filter(Boolean);
      try {
        const { data } = await api.post("/api/users/batch-privileges", { emails });
        if (data && typeof data.privileges === "object") {
          setPrivileges(data.privileges);
        }
      } catch {
        // fallback: set empty privileges for all
        setPrivileges((prev) => {
          const out = { ...prev };
          emails.forEach((e) => { out[e] = {}; });
          return out;
        });
      }

      // Also fetch vendors in current tenant to know who already has a vendor profile
      try {
        const vendors = await api.get("/api/data/vendors").then((r) => r.data || []);
        const mEmail: Record<string, any> = {},
          mOwner: Record<string, any> = {},
          mId: Record<string, any> = {};
        vendors.forEach((v: any) => {
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
      } catch {
        // ignore vendor fetch error
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  // Update feature privilege for a user (moved OUT of refresh, correct scope)
  async function updateFeaturePrivilege(email: string, featureKey: string, value: boolean) {
    setPrivBusy((prev) => ({ ...prev, [email]: true }));
    try {
      const current = privileges[email] || {};
      const next = { ...current, [featureKey]: value };
      await api.patch(`/api/users/${encodeURIComponent(email)}/privileges`, { featurePrivileges: next });
      setPrivileges((prev) => ({ ...prev, [email]: next }));
    } catch {
      // keep silent; UI remains unchanged if backend fails next tick
    } finally {
      setPrivBusy((prev) => ({ ...prev, [email]: false }));
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  // Probe Firebase Admin availability for UID lookup (admin-only endpoint)
  useEffect(() => {
    (async () => {
      try {
        if (!meEmail) return;
        await api.get("/api/users/lookup", { params: { email: meEmail } });
        setUidLookupAvailable(true);
      } catch {
        setUidLookupAvailable(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load tenants for dropdown
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/api/tenants");
        const arr = Array.isArray(data) ? data : [];
        const normalized = [
          { id: "vendor", name: "Vendor" },
          ...arr
            .map((t: any) => (typeof t === "string" ? { id: t, name: t } : { id: t?.id, name: t?.name || t?.id }))
            .map((t: any) => (t.id === "public" ? { ...t, id: "vendor", name: t.name || "Vendor" } : t)),
        ].filter((t: any) => t && t.id);
        // Dedup by id
        const map = new Map<string, { id: string; name: string }>();
        normalized.forEach((t: any) => map.set(t.id, t));
        setTenants(Array.from(map.values()));
      } catch {
        setTenants([{ id: "vendor", name: "Vendor" }]);
      }
    })();
  }, []);

  async function handleUpgrade(e: any) {
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
      const me =
        (window?.localStorage && window.localStorage.getItem("userEmail")) ||
        window?.sessionStorage?.getItem("userEmail");
      if (me && me.toLowerCase() === em.toLowerCase()) {
        sessionStorage.setItem("tenantId", tn);
        sessionStorage.setItem("role", "admin");
      }
      await refresh();
    } catch (e2: any) {
      setError(e2?.response?.data?.message || e2?.message || "Upgrade failed");
    }
  }

  async function saveUser({
    email,
    tenantId,
    role,
  }: {
    email: string;
    tenantId: string;
    role: string;
  }) {
    const payloadTenant = tenantId === "vendor" ? "public" : tenantId;
    const normalizedRole = normalizeRole(role);
    await api.post("/api/users", { email, tenantId: payloadTenant, role: normalizedRole });
    // If the current signed-in user was updated, sync session hints
    if (email.toLowerCase() === meEmail) {
      sessionStorage.setItem("tenantId", tenantId);
      sessionStorage.setItem("role", normalizedRole);
    }
  }

  async function toggleAdmin(u: User) {
    setError("");
    setOk("");
    const current = normalizeRole(u.role);
    const nextRole = current === "admin" ? "member" : "admin";
    try {
      await saveUser({ email: u.email, tenantId: u.tenantId || "vendor", role: nextRole });
      setUsers((prev) => prev.map((x) => (x.email === u.email ? { ...x, role: nextRole } : x)));
      setOk(`${u.email} is now ${nextRole}`);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Failed to update role");
    }
  }

  async function togglePartner(u: User) {
    setError("");
    setOk("");
    const current = normalizeRole(u.role);
    const nextRole = current === "partner" ? "member" : "partner";
    try {
      await saveUser({ email: u.email, tenantId: u.tenantId || "vendor", role: nextRole });
      setUsers((prev) => prev.map((x) => (x.email === u.email ? { ...x, role: nextRole } : x)));
      setOk(`${u.email} is now ${nextRole}`);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Failed to update role");
    }
  }

  async function changeTenant(u: User, nextTenant: string) {
    setError("");
    setOk("");
    try {
      await saveUser({ email: u.email, tenantId: nextTenant, role: u.role || "member" });
      setUsers((prev) => prev.map((x) => (x.email === u.email ? { ...x, tenantId: nextTenant } : x)));
      setOk(`${u.email} moved to ${nextTenant}`);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Failed to change tenant");
    }
  }

  async function removeUser(u: User) {
    setError("");
    setOk("");
    const key = (u.email || "").toLowerCase();
    if (!key) return;
    if (!window.confirm(`Delete user ${key}? This removes their account and role mapping but keeps listings.`)) return;
    try {
      await api.delete("/api/users", { data: { email: key } });
      setUsers((prev) => prev.filter((x) => (x.email || "").toLowerCase() !== key));
      setOk(`Deleted ${key}`);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Failed to delete user");
    }
  }

  async function createVendorFromUser(u: User) {
    setError("");
    setOk("");
    try {
      // Lookup Firebase UID for this email (admin-only), then create vendor linked to that UID
      let ownerUid = "";
      try {
        const { data } = await api.get("/api/users/lookup", { params: { email: u.email } });
        ownerUid = data?.uid || "";
      } catch {
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
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Failed to create vendor profile");
    }
  }

  async function syncFirebaseUid(u: User, opts: { doRefresh?: boolean } = {}) {
    const key = (u.email || "").toLowerCase();
    setSyncBusy((prev) => ({ ...prev, [key]: true }));
    setError("");
    setOk("");
    try {
      // 1) Lookup Firebase UID
      let uid = "";
      try {
        const { data } = await api.get("/api/users/lookup", { params: { email: key } });
        uid = data?.uid || "";
      } catch {
        setError("Could not find Firebase UID for this email");
        return;
      }

      // 2) Persist UID on users mapping so future reads know it
      await api.post("/api/users", { email: key, tenantId: u.tenantId || "vendor", role: u.role || "member", uid });

      // 3) Upsert ownerUid on vendor across tenants
      let updatedSomewhere = false;
      const v = vendorByEmail[key] as any;
      if (v) {
        const vid = String(v.id || v.vendorId || "");
        if (vid) {
          try {
            await api.put(`/api/data/vendors/${encodeURIComponent(vid)}`, { ownerUid: uid });
            updatedSomewhere = true;
          } catch {}
        }
      } else {
        try {
          const tenantsResp = await api.get("/api/tenants");
          const tenantList = Array.isArray(tenantsResp.data) ? tenantsResp.data : [];
          const ids = tenantList.map((t: any) => (typeof t === "string" ? t : t?.id)).filter(Boolean) as string[];
          const allTenantIds = Array.from(new Set(["vendor", ...ids]));
          for (const tId of allTenantIds) {
            try {
              const { data: vRows } = await api.get("/api/data/vendors", { headers: { "x-tenant-id": tId } });
              const match = Array.isArray(vRows)
                ? vRows.find((x: any) => (x.contactEmail || x.email || "").toLowerCase() === key)
                : null;
              if (match) {
                const vid2 = String(match.id || match.vendorId || "");
                if (vid2) {
                  await api.put(
                    `/api/data/vendors/${encodeURIComponent(vid2)}`,
                    { ownerUid: uid },
                    { headers: { "x-tenant-id": tId } }
                  );
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
          await api.post(`/api/data/vendors`, {
            name,
            contactEmail: key,
            ownerUid: uid,
            status: "pending",
            kycStatus: "pending",
            categories: [],
          });
        } catch {}
      }

      // 4) Refresh vendor maps
      if (opts.doRefresh !== false) await refresh();
      setOk(`Synced Firebase UID for ${key}`);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Failed to sync UID");
    } finally {
      setSyncBusy((prev) => ({ ...prev, [key]: false }));
    }
  }

  function buildVendorMaps(list: any[]): {
    byEmail: Record<string, any>;
    byOwner: Record<string, any>;
    byId: Record<string, any>;
  } {
    const byEmail: Record<string, any> = {},
      byOwner: Record<string, any> = {},
      byId: Record<string, any> = {};
    (list || []).forEach((v: any) => {
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

  async function traceVendor(u: User) {
    const key = (u.email || "").toLowerCase();
    setTraceBusy((prev) => ({ ...prev, [key]: true }));
    try {
      // Start with current-tenant vendor maps
      let viaEmail = (vendorByEmail[key] as any) || null;
      let uid = "";
      let viaUid: any = null;
      let viaId: any = null;

      // Attempt Firebase UID lookup (admin-only route); ignore errors
      try {
        const { data } = await api.get("/api/users/lookup", { params: { email: key } });
        uid = data?.uid || "";
      } catch {}

      if (uid) {
        viaUid = (vendorByOwner[uid] as any) || null;
        viaId = (vendorById[uid] as any) || null;
      }

      // If nothing found in current tenant, sweep across all tenants
      if (!viaEmail && !viaUid && !viaId) {
        try {
          const tenantsResp = await api.get("/api/tenants");
          const tenantList = Array.isArray(tenantsResp.data) ? tenantsResp.data : [];
          const ids = tenantList.map((t: any) => (typeof t === "string" ? t : t?.id)).filter(Boolean) as string[];
          const all: any[] = [];
          const allTenantIds = Array.from(new Set(["vendor", ...ids]));
          for (const tId of allTenantIds) {
            try {
              const { data: vRows } = await api.get("/api/data/vendors", { headers: { "x-tenant-id": tId } });
              if (Array.isArray(vRows))
                all.push(...vRows.map((v: any) => ({ ...v, _tenantId: v.tenantId || tId })));
            } catch {}
          }
          const maps = buildVendorMaps(all);
          viaEmail = (maps.byEmail[key] as any) || null;
          if (uid) {
            viaUid = maps.byOwner[uid] as any || viaUid;
            viaId = maps.byId[uid] as any || viaId;
          }
        } catch {}
      }

      setTrace((prev) => ({ ...prev, [key]: { uid, viaEmail, viaUid, viaId } }));
    } finally {
      setTraceBusy((prev) => ({ ...prev, [key]: false }));
    }
  }

  const searchAllUsers = useCallback(
    async (reset = true) => {
      setAllErr("");
      setAllBusy(true);
      try {
        const params: Record<string, any> = { search: allQuery, pageSize: allPageSize };
        if (!reset && allNext) params.pageToken = allNext;
        const { data } = await api.get("/api/users/all", { params });
        const items: PlatformUser[] = Array.isArray(data?.items) ? data.items : [];
        setAllUsers((prev) => (reset ? items : [...prev, ...items]));
        setAllNext(data?.nextPageToken || "");
      } catch (e: any) {
        const status = e?.response?.status;
        if (status === 401 || status === 403) {
          try {
            await bootstrapSession();
            const params: Record<string, any> = { search: allQuery, pageSize: allPageSize };
            if (!reset && allNext) params.pageToken = allNext;
            const { data } = await api.get("/api/users/all", { params });
            const items: PlatformUser[] = Array.isArray(data?.items) ? data.items : [];
            setAllUsers((prev) => (reset ? items : [...prev, ...items]));
            setAllNext(data?.nextPageToken || "");
            setAllErr("");
            return;
          } catch (e2: any) {
            setAllErr(e2?.response?.data?.message || e2?.message || "Failed to search platform users");
          }
        } else {
          setAllErr(e?.response?.data?.message || e?.message || "Failed to search platform users");
        }
      } finally {
        setAllBusy(false);
      }
    },
    [allQuery, allPageSize, allNext]
  );

  // Auto-load platform users on mount
  const autoLoadedRef = useRef(false);
  useEffect(() => {
    if (autoLoadedRef.current) return;
    autoLoadedRef.current = true;
    let alive = true;
    (async () => {
      try {
        await bootstrapSession();
        if (!alive) return;
        await searchAllUsers(true);
      } catch {
        // ignore; button remains available to retry
      }
    })();
    return () => {
      alive = false;
    };
  }, [searchAllUsers]);

  // Fallback: if nothing loaded shortly after mount, retry once
  useEffect(() => {
    if (autoRetryRef.current) return;
    if (!allBusy && Array.isArray(allUsers) && allUsers.length === 0) {
      const id = setTimeout(() => {
        autoRetryRef.current = true;
        searchAllUsers(true);
      }, 800);
      return () => clearTimeout(id);
    }
  }, [allBusy, allUsers, searchAllUsers]);

  async function grantRole(email: string, role: string) {
    const t = tenantPick[email] || "vendor";
    const nextRole = normalizeRole(role);
    try {
      await saveUser({ email, tenantId: t, role: nextRole });
      setUsers((prev) => {
        const hit = prev.find((x) => x.email === email);
        if (hit) return prev.map((x) => (x.email === email ? { ...x, role: nextRole, tenantId: t } : x));
        return [...prev, { email, role: nextRole, tenantId: t }];
      });
      setOk(`${email} granted ${nextRole} (${t})`);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || `Failed to grant ${nextRole}`);
    }
  }

  async function grantAdmin(email: string) {
    await grantRole(email, "admin");
  }

  async function grantPartner(email: string) {
    await grantRole(email, "partner");
  }

  function hasFullAccessEmail(email: string) {
    const e = (email || "").toLowerCase();
    return users.some((u) => u.email === e && hasFullAccess(u.role));
  }

  function getUserRole(email: string) {
    const e = (email || "").toLowerCase();
    const hit = users.find((u) => u.email === e);
    return normalizeRole(hit?.role);
  }

  async function revokeFullAccess(email: string) {
    const existing = users.find((u) => u.email === (email || "").toLowerCase());
    const t = existing?.tenantId || tenantPick[email] || "vendor";
    try {
      await saveUser({ email, tenantId: t, role: "member" });
      setUsers((prev) => prev.map((x) => (x.email === email ? { ...x, role: "member" } : x)));
      setOk(`${email} access revoked`);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Failed to revoke admin");
    }
  }

  // Save all current changes to backend/appData.json by publishing live data with updated users
  async function saveAllChanges() {
    setError("");
    setOk("");
    setSaveBusy(true);
    try {
      // 1) Load current live appData
      const live = await api.get("/api/lms/live").then((r) => r.data || {});

      // 2) Merge normalized users from current UI state
      const normUsers = buildUserPayload(users);
      const merged = { ...live, users: normUsers };

      // 3) Persist users mapping directly, then publish merged payload for other LMS consumers
      await api.put("/api/users/bulk", { users: normUsers });
      await api.put("/api/lms/publish", { data: merged });
      try {
        await writeAuditLog({
          action: "USERS_SAVE_ALL",
          userEmail: auth.currentUser?.email || undefined,
          targetType: "appData",
          targetId: "users",
          metadata: { count: normUsers.length },
        });
      } catch {}
      setOk("All changes saved to appData.json");
      await refresh();
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Failed to save changes");
    } finally {
      setSaveBusy(false);
    }
  }

  async function saveCheckpoint() {
    setError("");
    setOk("");
    setCheckpointBusy(true);
    try {
      const live = await api.get("/api/lms/live").then((r) => r.data || {});
      const normUsers = buildUserPayload(users);
      const merged = { ...live, users: normUsers };
      await api.put("/api/users/bulk", { users: normUsers });
      await api.post("/api/lms/checkpoints", { message: "User Roles checkpoint", data: merged });
      try {
        await writeAuditLog({
          action: "USERS_CHECKPOINT",
          userEmail: auth.currentUser?.email || undefined,
          targetType: "appData",
          targetId: "users",
          metadata: { count: normUsers.length },
        });
      } catch {}
      setOk("Checkpoint saved");
      await refresh();
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Failed to save checkpoint");
    } finally {
      setCheckpointBusy(false);
    }
  }

  return (
    <>
      <div className="card h-100 p-0 radius-12 overflow-hidden">
        <div className="card-header border-bottom bg-base py-16 px-24 d-flex align-items-center justify-content-between gap-3 flex-wrap">
          <h6 className="mb-0">Upgrade Public Tenant to Private Admin</h6>
        </div>
        <div className="card-body p-24">
          <form onSubmit={handleUpgrade} className="row g-3 align-items-end mb-24">
            <div className="col-sm-5">
              <label className="form-label text-sm">User Email</label>
              <input
                type="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                required
              />
            </div>
            <div className="col-sm-5">
              <label className="form-label text-sm">New Tenant ID (private)</label>
              <input
                type="text"
                className="form-control"
                value={tenant}
                onChange={(e) => setTenant(e.target.value)}
                placeholder="acme-inc"
                required
              />
            </div>
            <div className="col-sm-2">
              <button type="submit" className="btn btn-primary w-100">
                Upgrade
              </button>
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
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <div>
                <label className="form-label text-sm">Role</label>
                <select className="form-select" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                  <option>All</option>
                  <option>admin</option>
                  <option>partner</option>
                  <option>member</option>
                </select>
              </div>
              <div className="align-self-end mb-1 d-flex gap-2">
                <button
                  className="btn btn-outline-secondary"
                  onClick={saveCheckpoint}
                  disabled={checkpointBusy || saveBusy}
                  title="Create a checkpoint containing the current user role assignments"
                >
                  {checkpointBusy ? "Saving…" : "Save Checkpoint"}
                </button>
                <button
                  className="btn btn-primary"
                  onClick={saveAllChanges}
                  disabled={saveBusy || checkpointBusy}
                  title="Publish all user role/tenant mappings to live appData.json"
                >
                  {saveBusy ? "Saving…" : "Save All Changes"}
                </button>
              </div>
            </div>
          </div>

          <div className="table-responsive scroll-sm">
            <table className="table bordered-table sm-table mb-0 align-middle">
              <thead>
                <tr>
                  <th>Email</th>
                  <th style={{ minWidth: 160 }}>Tenant</th>
                  <th>Role</th>
                  <th>Vendor</th>
                  <th style={{ minWidth: 320 }}>Actions / Trace</th>
                  <th style={{ minWidth: 320 }}>Feature Access</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={6}>Loading…</td>
                  </tr>
                )}
                {!loading && visible.length === 0 && (
                  <tr>
                    <td colSpan={6}>No users match your filters.</td>
                  </tr>
                )}
                {!loading &&
                  visible.map((u) => {
                    const roleName = normalizeRole(u.role);
                    const isAdminRole = roleName === "admin";
                    const isPartnerRole = roleName === "partner";
                    const roleBadgeClass = isAdminRole
                      ? "badge bg-success-focus text-success-700"
                      : isPartnerRole
                      ? "badge bg-primary-subtle text-primary-700"
                      : "badge bg-neutral-200 text-neutral-900";
                    return (
                      <tr key={u.email}>
                        <td>{u.email}</td>
                        <td>
                          <select
                            className="form-select form-select-sm w-auto bg-base border text-secondary-light rounded-pill"
                            value={u.tenantId || "vendor"}
                            onChange={(e) => changeTenant(u, e.target.value)}
                            title="Switch tenant"
                          >
                            {tenants.map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.name || t.id}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <span className={roleBadgeClass}>{roleName}</span>
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
                                  <div>
                                    uid: <code>{trace[u.email].uid}</code>
                                  </div>
                                  <div>
                                    by email:{" "}
                                    {trace[u.email].viaEmail ? (
                                      <>
                                        <code>
                                          {String(
                                            trace[u.email].viaEmail.contactEmail ||
                                              trace[u.email].viaEmail.email ||
                                              ""
                                          )}
                                        </code>{" "}
                                        (vendorId:{" "}
                                        <code>
                                          {String(trace[u.email].viaEmail.id || trace[u.email].viaEmail.vendorId)}
                                        </code>
                                        , tenant:{" "}
                                        <code>
                                          {String(
                                            trace[u.email].viaEmail.tenantId ||
                                              trace[u.email].viaEmail._tenantId ||
                                              "vendor"
                                          )}
                                        </code>
                                        )
                                      </>
                                    ) : (
                                      "—"
                                    )}
                                  </div>
                                  <div>
                                    by ownerUid:{" "}
                                    {trace[u.email].viaUid ? (
                                      <>
                                        <code>{String(trace[u.email].viaUid.ownerUid || "")}</code> (vendorId:{" "}
                                        <code>
                                          {String(trace[u.email].viaUid.id || trace[u.email].viaUid.vendorId)}
                                        </code>
                                        , tenant:{" "}
                                        <code>
                                          {String(
                                            trace[u.email].viaUid.tenantId ||
                                              trace[u.email].viaUid._tenantId ||
                                              "vendor"
                                          )}
                                        </code>
                                        )
                                      </>
                                    ) : (
                                      "—"
                                    )}
                                  </div>
                                  <div>
                                    by id==uid:{" "}
                                    {trace[u.email].viaId ? (
                                      <>
                                        <code>{String(trace[u.email].viaId.id || trace[u.email].viaId.vendorId)}</code>{" "}
                                        (tenant:{" "}
                                        <code>
                                          {String(
                                            trace[u.email].viaId.tenantId ||
                                              trace[u.email].viaId._tenantId ||
                                              "vendor"
                                          )}
                                        </code>
                                        )
                                      </>
                                    ) : (
                                      "—"
                                    )}
                                  </div>
                                </>
                              ) : (
                                <div>
                                  <span className="me-1">uid:</span>
                                  <span className="text-secondary">—</span>
                                  <div className="text-secondary small mt-1">
                                    {uidLookupAvailable ? (
                                      <>UID not linked. Use “Sync UID” to fetch from Firebase.</>
                                    ) : (
                                      <>UID lookup not available on this server.</>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                        <td>
                          <div className="d-flex gap-2">
                            <button
                              type="button"
                              className={isAdminRole ? "btn btn-outline-danger btn-sm" : "btn btn-outline-success btn-sm"}
                              onClick={() => toggleAdmin(u)}
                              title={isAdminRole ? "Revoke admin" : "Grant admin"}
                            >
                              {isAdminRole ? "Revoke Admin" : "Make Admin"}
                            </button>
                            <button
                              type="button"
                              className={
                                isPartnerRole ? "btn btn-outline-danger btn-sm" : "btn btn-outline-primary btn-sm"
                              }
                              onClick={() => togglePartner(u)}
                              title={isPartnerRole ? "Revoke partner" : "Grant partner"}
                            >
                              {isPartnerRole ? "Revoke Partner" : "Make Partner"}
                            </button>
                            {!vendorByEmail[u.email] && (
                              <button
                                type="button"
                                className="btn btn-outline-primary btn-sm"
                                onClick={() => createVendorFromUser(u)}
                                title="Create vendor profile for this user"
                              >
                                Create Vendor
                              </button>
                            )}
                            <button
                              type="button"
                              className="btn btn-outline-secondary btn-sm"
                              onClick={() => traceVendor(u)}
                              disabled={!!traceBusy[u.email]}
                              title="Trace vendor status via email, UID, or vendor id"
                            >
                              {traceBusy[u.email] ? "Tracing…" : "Trace"}
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline-primary btn-sm"
                              onClick={() => syncFirebaseUid(u)}
                              disabled={!!syncBusy[u.email] || !uidLookupAvailable}
                              title={
                                uidLookupAvailable
                                  ? "Lookup Firebase UID and link it to this user's vendor"
                                  : "UID lookup is not available on this server"
                              }
                            >
                              {syncBusy[u.email] ? "Syncing…" : "Sync UID"}
                            </button>

                            <button
                              type="button"
                              className="btn btn-outline-danger btn-sm"
                              onClick={() => removeUser(u)}
                              title="Delete user from Firebase and remove role mapping (keeps listings)"
                              disabled={(auth.currentUser?.email || "").toLowerCase() === (u.email || "").toLowerCase()}
                            >
                              Delete User
                            </button>
                          </div>
                        </td>
                        {/* Feature toggles moved to matrix table below */}
                      </tr>
                    );
                  })}
              </tbody>
            </table>
        {/* Feature Access Matrix Table */}
        <div className="mt-32">
          <h6 className="mb-2">Feature Access Matrix</h6>
          <div className="table-responsive scroll-sm">
            <table className="table bordered-table sm-table mb-0 align-middle">
              <thead>
                <tr>
                  <th>Email</th>
                  {FEATURE_LIST.map((f) => (
                    <th key={f.key} style={{minWidth:120}}>{f.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visible.map((u) => (
                  <tr key={u.email}>
                    <td>{u.email}</td>
                    {FEATURE_LIST.map((f) => (
                      <td key={f.key} className="text-center">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          checked={
                            typeof privileges[u.email]?.[f.key] === 'boolean'
                              ? privileges[u.email][f.key]
                              : getDefaultRoleAccess(u.role, f.key)
                          }
                          disabled={!!privBusy[u.email]}
                          onChange={(e) => updateFeaturePrivilege(u.email, f.key, e.target.checked)}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
          </div>

          {/* Admin onboarding: search platform users */}
          <div className="mt-24">
            <h6 className="mb-2">Onboard Admins</h6>
            <div className="d-flex flex-wrap align-items-end gap-2 mb-2">
              <div>
                <label className="form-label text-sm">Search users</label>
                <input
                  className="form-control"
                  placeholder="Search by email or name"
                  value={allQuery}
                  onChange={(e) => setAllQuery(e.target.value)}
                />
              </div>
              <button className="btn btn-outline-secondary" onClick={() => searchAllUsers(true)} disabled={allBusy}>
                {allBusy ? "Searching…" : "Search"}
              </button>
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
                    <tr>
                      <td colSpan={5}>Loading…</td>
                    </tr>
                  )}
                  {!allBusy && allUsers.length === 0 && (
                    <tr>
                      <td colSpan={5}>No results</td>
                    </tr>
                  )}
                  {!allBusy &&
                    allUsers.map((r) => (
                      <tr key={r.uid}>
                        <td>{r.email}</td>
                        <td>{r.displayName || "—"}</td>
                        <td>
                          <code>{r.uid}</code>
                        </td>
                        <td>
                          {(() => {
                            const key = (r.email || "").toLowerCase();
                            const currentTenant = tenantPick[key] || "vendor";
                            return (
                              <select
                                className="form-select form-select-sm w-auto bg-base border text-secondary-light rounded-pill"
                                value={currentTenant}
                                onChange={(e) => setTenantPick((prev) => ({ ...prev, [key]: e.target.value }))}
                              >
                                {tenants.map((t) => (
                                  <option key={t.id} value={t.id}>
                                    {t.name || t.id}
                                  </option>
                                ))}
                              </select>
                            );
                          })()}
                        </td>
                        <td>
                          <div className="d-flex flex-wrap gap-2">
                            <button
                              className="btn btn-sm btn-outline-success"
                              onClick={() => grantAdmin((r.email || "").toLowerCase())}
                              disabled={getUserRole(r.email) === "admin"}
                            >
                              Grant Admin
                            </button>
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => grantPartner((r.email || "").toLowerCase())}
                              disabled={getUserRole(r.email) === "partner"}
                            >
                              Grant Partner
                            </button>
                            {hasFullAccessEmail(r.email) && (
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => revokeFullAccess((r.email || "").toLowerCase())}
                              >
                                Revoke Access
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
              <div className="d-flex align-items-center justify-content-between mt-2">
                <div className="text-secondary small">Showing {allUsers.length} user(s)</div>
                <div className="d-flex align-items-center gap-2">
                  <label className="text-sm">Page size</label>
                  <select
                    className="form-select form-select-sm w-auto"
                    value={allPageSize}
                    onChange={(e) => setAllPageSize(Number(e.target.value) || 100)}
                  >
                    {[50, 100, 200, 500, 1000].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                  <button className="btn btn-sm btn-outline-secondary" onClick={() => searchAllUsers(true)} disabled={allBusy}>
                    Refresh
                  </button>
                  <button
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => searchAllUsers(false)}
                    disabled={allBusy || !allNext}
                  >
                    {allBusy ? "Loading…" : allNext ? "Load more" : "End"}
                  </button>
                </div>
              </div>
            </div>
          </div>
          {/* end onboarding */}
        </div>
      </div>
    </>
  );
}
