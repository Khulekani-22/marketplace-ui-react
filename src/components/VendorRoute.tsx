// src/components/VendorRoute.jsx
import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { auth } from "../lib/firebase";
import { api } from "../lib/api";

// Allows access only if the user is authenticated AND not a "basic" tenant
// Admins are always allowed.
export default function VendorRoute({ children }) {
  const [state, setState] = useState({ loading: true, allowed: false, authed: false });
  const location = useLocation();

  useEffect(() => {
    let cancelled = false;
    async function check() {
      const user = auth.currentUser;
      if (!user) {
        if (!cancelled) setState({ loading: false, allowed: false, authed: false });
        return;
      }

      const ssRole = sessionStorage.getItem("role");
      const ssTenant = sessionStorage.getItem("tenantId");

      // If we already know admin from sessionStorage, allow immediately
      if (ssRole === "admin") {
        if (!cancelled) setState({ loading: false, allowed: true, authed: true });
        return;
      }

      try {
        const { data } = await api.get("/api/me");
        const role = data?.role || ssRole || "member";
        const tenantId = data?.tenantId || ssTenant || "vendor";
        const email = data?.email || user.email || null;
        const uid = data?.uid || user.uid || null;
        sessionStorage.setItem("role", role);
        sessionStorage.setItem("tenantId", tenantId);
        if (email) sessionStorage.setItem("userEmail", email);
        else sessionStorage.removeItem("userEmail");
        if (uid) sessionStorage.setItem("userId", uid);
        else sessionStorage.removeItem("userId");
        const isAdmin = role === "admin";
        const isBasic = !isAdmin && tenantId === "basic";
        if (!cancelled) setState({ loading: false, allowed: isAdmin || !isBasic, authed: true });
      } catch {
        const fallbackRole = sessionStorage.getItem("role") || ssRole || "member";
        const fallbackTenant = sessionStorage.getItem("tenantId") || ssTenant || "vendor";
        const isAdmin = fallbackRole === "admin";
        const isBasic = !isAdmin && fallbackTenant === "basic";
        const authed = !!auth.currentUser;
        if (!cancelled) setState({ loading: false, allowed: isAdmin || !isBasic, authed });
      }
    }
    check();
    return () => { cancelled = true; };
  }, [location.pathname]);

  if (state.loading) return null;
  if (!state.authed) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return state.allowed ? children : <Navigate to="/profile-startup" replace />;
}
