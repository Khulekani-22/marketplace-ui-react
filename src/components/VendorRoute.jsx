// src/components/VendorRoute.jsx
import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { auth } from "../lib/firebase";
import { getCurrentUser } from "../lib/sdk";

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
        // Best-effort authoritative check
        const userData = await getCurrentUser({ email: user.email });
        const role = userData.role || ssRole || "member";
        const tenantId = userData.tenantId || ssTenant || "vendor";
        const isAdmin = role === "admin";
        const isBasic = !isAdmin && tenantId === "basic";
        if (!cancelled) setState({ loading: false, allowed: isAdmin || !isBasic, authed: true });
      } catch {
        // Fallback to sessionStorage
        const isAdmin = ssRole === "admin";
        const isBasic = !isAdmin && ssTenant === "basic";
        if (!cancelled) setState({ loading: false, allowed: isAdmin || !isBasic, authed: true });
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
