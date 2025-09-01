// src/components/AdminRoute.jsx
import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { auth } from "../lib/firebase";
import { api } from "../lib/api";

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
        const email = user.email;
        const { data } = await api.get("/api/users/me", { params: { email } });
        const ok = (data?.role || sessionStorage.getItem("role")) === "admin";
        if (!cancelled) setState({ loading: false, ok, authed: true });
      } catch {
        if (!cancelled) setState({ loading: false, ok: false, authed: true });
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
