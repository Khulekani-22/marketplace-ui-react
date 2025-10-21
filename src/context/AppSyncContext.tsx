import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { auth } from "../firebase.js";
import { api } from "../lib/api";
import { writeAuditLog } from "../lib/audit";
import { onIdTokenChanged } from "firebase/auth";
import { AppSyncContext } from "./appSyncContext";
import { toast } from "react-toastify";
import { hasFullAccess, normalizeRole } from "../utils/roles";

const LS_APP_DATA_KEY = "sl_app_data_cache_v1";
const SYNC_FRESHNESS_MS = 60 * 1000; // 1 minute cache window

function safeParse(raw: string | null) {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed ? parsed : null;
  } catch {
    return null;
  }
}

function readCachedAppData() {
  if (typeof window === "undefined") return null;
  try {
    return safeParse(window.localStorage.getItem(LS_APP_DATA_KEY));
  } catch {
    return null;
  }
}

function writeCachedAppData(payload: unknown) {
  if (typeof window === "undefined") return;
  try {
    if (!payload) {
      window.localStorage.removeItem(LS_APP_DATA_KEY);
      return;
    }
    window.localStorage.setItem(LS_APP_DATA_KEY, JSON.stringify(payload));
  } catch {
    // Best-effort cache; ignore quota errors
  }
}

const initialAppData = (() => {
  const cached = readCachedAppData();
  return cached || null; // Use cached data only, no local JSON fallback
})();

export function AppSyncProvider({ children }) {
  const location = useLocation();
  const [appData, setAppData] = useState<any>(initialAppData);
  const [appDataLoading, setAppDataLoading] = useState(() => !initialAppData);
  const [appDataError, setAppDataError] = useState("");
  const [role, setRole] = useState(() => normalizeRole(sessionStorage.getItem("role")));

  const normalizeTenant = useCallback((id: string | null | undefined) => {
    if (!id) return "vendor";
    return id === "public" ? "vendor" : id;
  }, []);

  const [tenantId, setTenantId] = useState(() => normalizeTenant(sessionStorage.getItem("tenantId")));
  const [lastSyncAt, setLastSyncAt] = useState(0);
  const isSyncingRef = useRef(false);
  const syncPromiseRef = useRef<Promise<void> | null>(null);
  const lastSyncRef = useRef(0);

  const isAdmin = hasFullAccess(role);

  const refreshRole = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      const { data } = await api.get("/api/me", {
        suppressToast: true,
        suppressErrorLog: true,
      } as any);
      const nextRole = normalizeRole(data?.role);
      const nextTenant = normalizeTenant(data?.tenantId);
      const email = data?.email || user.email || null;
      const uid = data?.uid || user.uid || null;
      try {
        sessionStorage.setItem("role", nextRole);
        sessionStorage.setItem("tenantId", nextTenant);
        if (email) sessionStorage.setItem("userEmail", email);
        else sessionStorage.removeItem("userEmail");
        if (uid) sessionStorage.setItem("userId", uid);
        else sessionStorage.removeItem("userId");
      } catch {
        /* storage unavailable */
      }
      setRole(nextRole);
      setTenantId(nextTenant);
    } catch {
      if (!auth.currentUser) {
        try {
          sessionStorage.removeItem("role");
          sessionStorage.removeItem("tenantId");
          sessionStorage.removeItem("userEmail");
          sessionStorage.removeItem("userId");
        } catch {
          /* storage unavailable */
        }
        setRole("member");
        setTenantId("vendor");
      }
    }
  }, [normalizeTenant]);

  const refreshAppData = useCallback(async () => {
    try {
      const { data } = await api.get("/api/lms/live", {
        suppressToast: true,
        suppressErrorLog: true,
      } as any);
      const next = data || null;
      setAppData(next);
      writeCachedAppData(next);
      setAppDataError("");
      return true;
    } catch (e) {
      const err: any = e;
      const cached = readCachedAppData();
      setAppData((prev) => {
        if (prev) return prev;
        if (cached) return cached;
        return null;
      });
      if (cached) {
        console.warn('[AppSync] Using cached data, API unavailable');
      } else {
        console.error('[AppSync] No data available - API failed and no cache');
      }
      const isNetwork = err?.code === "ERR_NETWORK";
      if (!isNetwork) {
        setAppDataError(
          err?.response?.data?.message || err?.message || "Failed to load app data from API"
        );
      }
      return false;
    }
  }, []);

  const syncNow = useCallback(
    async (options: { force?: boolean; background?: boolean; reason?: string; targetPath?: string } = {}) => {
      const { force = false, background = false, targetPath, reason } = options;

      const now = Date.now();
      const age = now - lastSyncRef.current;
      if (!force && appData && age < SYNC_FRESHNESS_MS) {
        return syncPromiseRef.current ?? Promise.resolve();
      }

      if (isSyncingRef.current && syncPromiseRef.current) {
        return syncPromiseRef.current;
      }

      const shouldShowLoading = !background || !appData;
      if (shouldShowLoading) setAppDataLoading(true);
      if (!background) setAppDataError("");
      isSyncingRef.current = true;

      const job = (async () => {
        try {
          await Promise.all([refreshRole(), refreshAppData()]);
          const stamp = Date.now();
          lastSyncRef.current = stamp;
          setLastSyncAt(stamp);
          try {
            const storedRole = (() => {
              try { return sessionStorage.getItem("role"); } catch { return null; }
            })();
            const storedTenant = (() => {
              try { return sessionStorage.getItem("tenantId"); } catch { return null; }
            })();
            const storedEmail = (() => {
              try { return sessionStorage.getItem("userEmail"); } catch { return null; }
            })();
            await writeAuditLog({
              action: "PAGE_VIEW",
              userEmail: auth.currentUser?.email || storedEmail || null,
              targetType: "route",
              targetId: targetPath || location.pathname,
              metadata: {
                role: storedRole || role,
                tenantId: normalizeTenant(storedTenant) || tenantId,
                reason: reason || "auto",
              },
            });
          } catch {}
        } finally {
          isSyncingRef.current = false;
          if (shouldShowLoading) setAppDataLoading(false);
          syncPromiseRef.current = null;
        }
      })();

      syncPromiseRef.current = job;
      return job;
    },
    [appData, location.pathname, normalizeTenant, refreshAppData, refreshRole, role, tenantId]
  );

  // Sync on route change with background refresh when data already cached
  useEffect(() => {
    syncNow({ background: Boolean(appData), reason: "route-change" });
  }, [location.pathname, appData, syncNow]);

  // Also sync immediately on sign-in (axios API-first via api client with token)
  useEffect(() => {
    const unsub = onIdTokenChanged(auth, async (user) => {
      if (user) {
        try { await syncNow({ force: true, reason: "auth-change" }); } catch {}
      } else {
        // On sign-out: clear role/appData (UI may still use local fallback where needed)
        setRole(sessionStorage.getItem("role") || "member");
        setTenantId(normalizeTenant(sessionStorage.getItem("tenantId")));
        setAppData(null);
        setAppDataLoading(() => !initialAppData);
        setAppDataError("");
        setLastSyncAt(0);
        lastSyncRef.current = 0;
        syncPromiseRef.current = null;
      }
    });
    return () => unsub();
  }, [syncNow, normalizeTenant]);

  useEffect(() => {
    lastSyncRef.current = lastSyncAt;
  }, [lastSyncAt]);

  const value = useMemo(
    () => ({ appData, appDataLoading, appDataError, role, tenantId, isAdmin, lastSyncAt, syncNow }),
    [appData, appDataLoading, appDataError, role, tenantId, isAdmin, lastSyncAt, syncNow]
  );

  useEffect(() => {
    if (!appDataError) return;
    const timer = setTimeout(() => {
      try {
        toast.error(appDataError, { toastId: "app-sync" });
      } catch {}
    }, 1000);
    return () => clearTimeout(timer);
  }, [appDataError]);

  return <AppSyncContext.Provider value={value}>{children}</AppSyncContext.Provider>;
}
