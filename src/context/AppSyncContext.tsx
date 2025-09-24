import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { auth } from "../lib/firebase";
import { api } from "../lib/api";
import { writeAuditLog } from "../lib/audit";
import { onIdTokenChanged } from "firebase/auth";
import appDataLocal from "../data/appData.json";
import { AppSyncContext } from "./appSyncContext";
import { toast } from "react-toastify";

export function AppSyncProvider({ children }) {
  const location = useLocation();
  const [appData, setAppData] = useState(null);
  const [appDataLoading, setAppDataLoading] = useState(false);
  const [appDataError, setAppDataError] = useState("");
  const [role, setRole] = useState(() => sessionStorage.getItem("role") || "member");
  const [tenantId, setTenantId] = useState(() => sessionStorage.getItem("tenantId") || "vendor");
  const [lastSyncAt, setLastSyncAt] = useState(0);
  const isSyncingRef = useRef(false);

  const isAdmin = role === "admin";

  const refreshRole = useCallback(async () => {
    const email = auth.currentUser?.email || sessionStorage.getItem("userEmail") || "";
    const uid = auth.currentUser?.uid || sessionStorage.getItem("userId") || "";
    if (!email && !uid) return;
    try {
      const params = {};
      if (email) params.email = email;
      if (uid) params.uid = uid;
      const { data } = await api.get("/api/users/me", { params });
      const nextRole = data?.role || "member";
      const nextTenant = data?.tenantId || "vendor";
      sessionStorage.setItem("role", nextRole);
      sessionStorage.setItem("tenantId", nextTenant);
      setRole(nextRole);
      setTenantId(nextTenant);
    } catch {
      // keep prior role/tenant
    }
  }, []);

  const refreshAppData = useCallback(async () => {
    setAppDataLoading(true);
    setAppDataError("");
    try {
      const { data } = await api.get("/api/lms/live");
      setAppData(data || null);
    } catch (e) {
      // API failed: best-effort fallback to local bundled appData.json
      setAppData(appDataLocal || null);
      setAppDataError(
        e?.response?.data?.message || e?.message || "Loaded local fallback app data"
      );
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
          metadata: { role: sessionStorage.getItem("role") || role, tenantId: sessionStorage.getItem("tenantId") || tenantId },
        });
      } catch {}
    } finally {
      isSyncingRef.current = false;
    }
  }, [location.pathname, refreshAppData, refreshRole, role, tenantId]);

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
        setTenantId(sessionStorage.getItem("tenantId") || "vendor");
        setAppData(null);
      }
    });
    return () => unsub();
  }, [syncNow]);

  const value = useMemo(
    () => ({ appData, appDataLoading, appDataError, role, tenantId, isAdmin, lastSyncAt, syncNow }),
    [appData, appDataLoading, appDataError, role, tenantId, isAdmin, lastSyncAt, syncNow]
  );

  useEffect(() => {
    if (!appDataError) return;
    try {
      toast.error(appDataError, { toastId: "app-sync" });
    } catch {}
  }, [appDataError]);

  return <AppSyncContext.Provider value={value}>{children}</AppSyncContext.Provider>;
}
