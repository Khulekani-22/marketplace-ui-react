// src/components/AdminRoute.jsx
import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { auth } from "../lib/firebase";
import { api } from "../lib/api";
import { hasFullAccess, normalizeRole } from "../utils/roles";

export default function AdminRoute({ children }) {
  const [state, setState] = useState({ loading: true, ok: false, authed: false });
  const location = useLocation();

  useEffect(() => {
    let cancelled = false;
    async function check() {
      const user = auth.currentUser;
      if (!user) {
        setState({ loading: false, ok: false, authed: false });
        return;
      }
      try {
        const { data } = await api.get("/api/me");
        const role = normalizeRole(data?.role || sessionStorage.getItem("role"));
        const tenant = data?.tenantId || sessionStorage.getItem("tenantId") || "vendor";
        const email = data?.email || user.email || null;
        const uid = data?.uid || user.uid || null;
        sessionStorage.setItem("role", role);
        sessionStorage.setItem("tenantId", tenant);
        if (email) sessionStorage.setItem("userEmail", email);
        else sessionStorage.removeItem("userEmail");
        if (uid) sessionStorage.setItem("userId", uid);
        else sessionStorage.removeItem("userId");
        const ok = hasFullAccess(role);
        if (!cancelled) setState({ loading: false, ok, authed: true });
      } catch {
        const authed = !!auth.currentUser;
        if (!cancelled) setState({ loading: false, ok: false, authed });
      }
    }
    check();
    return () => {
      cancelled = true;
    };
  }, [location.pathname]);

  if (state.loading) return null; // or spinner
  if (!state.authed) return (
    <Navigate to="/login" replace state={{ from: location.pathname }} />
  );
  return state.ok ? children : <Navigate to="/dashboard" replace />;
}
