import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { auth } from "../lib/firebase";
import { api } from "../lib/api";
import { writeAuditLog } from "../lib/audit";
import { onIdTokenChanged } from "firebase/auth";
import appDataLocal from "../data/appData.json";
import { AppSyncContext } from "./appSyncContext";
import { toast } from "react-toastify";

const LS_APP_DATA_KEY = "sl_app_data_cache_v1";

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
  if (cached) return cached;
  return appDataLocal || null;
})();

export function AppSyncProvider({ children }) {
  const location = useLocation();
  const [appData, setAppData] = useState<any>(initialAppData);
  const [appDataLoading, setAppDataLoading] = useState(false);
  const [appDataError, setAppDataError] = useState("");
  const [role, setRole] = useState(() => sessionStorage.getItem("role") || "member");

  const normalizeTenant = useCallback((id: string | null | undefined) => {
    if (!id) return "vendor";
    return id === "public" ? "vendor" : id;
  }, []);

  const [tenantId, setTenantId] = useState(() => normalizeTenant(sessionStorage.getItem("tenantId")));
  const [lastSyncAt, setLastSyncAt] = useState(0);
  const isSyncingRef = useRef(false);

  const isAdmin = role === "admin";

  const refreshRole = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      const { data } = await api.get("/api/me", {
        suppressToast: true,
        suppressErrorLog: true,
      } as any);
      const nextRole = data?.role || "member";
      const nextTenant = normalizeTenant(data?.tenantId);
      const email = data?.email || user.email || null;
      const uid = data?.uid || user.uid || null;
      sessionStorage.setItem("role", nextRole);
      sessionStorage.setItem("tenantId", nextTenant);
      if (email) sessionStorage.setItem("userEmail", email);
      else sessionStorage.removeItem("userEmail");
      if (uid) sessionStorage.setItem("userId", uid);
      else sessionStorage.removeItem("userId");
      setRole(nextRole);
      setTenantId(nextTenant);
    } catch {
      if (!auth.currentUser) {
        sessionStorage.removeItem("role");
        sessionStorage.removeItem("tenantId");
        sessionStorage.removeItem("userEmail");
        sessionStorage.removeItem("userId");
        setRole("member");
        setTenantId("vendor");
      }
    }
  }, []);

  const refreshAppData = useCallback(async () => {
    setAppDataLoading(true);
    setAppDataError("");
    try {
      const { data } = await api.get("/api/lms/live", {
        suppressToast: true,
        suppressErrorLog: true,
      } as any);
      const next = data || null;
      setAppData(next);
      writeCachedAppData(next);
    } catch (e) {
      // API failed: best-effort fallback to cached data or bundled appData.json
      const cached = readCachedAppData();
      const fallback = cached || appDataLocal || null;
      setAppData(fallback);
      if (fallback) writeCachedAppData(fallback);
      const err: any = e;
      const isNetwork = err?.code === "ERR_NETWORK";
      if (isNetwork) {
        setAppDataError("");
      } else {
        setAppDataError(
          err?.response?.data?.message || err?.message || "Loaded local fallback app data"
        );
      }
    } finally {
      setAppDataLoading(false);
    }
  }, []);

  const syncNow = useCallback(async () => {
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;
    try {
      await refreshRole();
      await refreshAppData();
      setLastSyncAt(Date.now());
      try {
        await writeAuditLog({
          action: "PAGE_VIEW",
          userEmail: auth.currentUser?.email || sessionStorage.getItem("userEmail") || null,
          targetType: "route",
          targetId: location.pathname,
          metadata: {
            role: sessionStorage.getItem("role") || role,
            tenantId: normalizeTenant(sessionStorage.getItem("tenantId")) || tenantId,
          },
        });
      } catch {}
    } finally {
      isSyncingRef.current = false;
    }
  }, [location.pathname, refreshAppData, refreshRole, role, tenantId, normalizeTenant]);

  // Sync on route change as requested
  useEffect(() => {
    syncNow();
  }, [syncNow]);

  // Also sync immediately on sign-in (axios API-first via api client with token)
  useEffect(() => {
    const unsub = onIdTokenChanged(auth, async (user) => {
      if (user) {
        try { await syncNow(); } catch {}
      } else {
        // On sign-out: clear role/appData (UI may still use local fallback where needed)
        setRole(sessionStorage.getItem("role") || "member");
        setTenantId(normalizeTenant(sessionStorage.getItem("tenantId")));
        setAppData(null);
      }
    });
    return () => unsub();
  }, [syncNow, normalizeTenant]);

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
