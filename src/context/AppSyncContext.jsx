import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { auth } from "../lib/firebase";
import { api } from "../lib/api";
import { writeAuditLog } from "../lib/audit";

const AppSyncContext = createContext({
  appData: null,
  appDataLoading: false,
  appDataError: "",
  role: "member",
  tenantId: "vendor",
  isAdmin: false,
  lastSyncAt: 0,
  syncNow: async () => {},
});

export function useAppSync() {
  return useContext(AppSyncContext);
}

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
    } catch (_) {
      // keep prior role/tenant
    }
  }, []);

  const refreshAppData = useCallback(async () => {
    setAppDataLoading(true);
    setAppDataError("");
    try {
      // Request a fresh token (cached if still valid)
      if (auth.currentUser?.getIdToken) await auth.currentUser.getIdToken();
      const { data } = await api.get("/api/lms/live");
      setAppData(data || null);
    } catch (e) {
      setAppData(null);
      setAppDataError(e?.response?.data?.message || e?.message || "Failed to load app data");
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
  }, [refreshRole, refreshAppData]);

  // Sync on route change as requested
  useEffect(() => {
    syncNow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const value = useMemo(
    () => ({ appData, appDataLoading, appDataError, role, tenantId, isAdmin, lastSyncAt, syncNow }),
    [appData, appDataLoading, appDataError, role, tenantId, isAdmin, lastSyncAt, syncNow]
  );

  return <AppSyncContext.Provider value={value}>{children}</AppSyncContext.Provider>;
}
