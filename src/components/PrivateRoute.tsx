// src/components/PrivateRoute.jsx
import { useEffect, useRef, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { auth } from "../firebase.js";
import { useAuth } from "../context/AuthContext.tsx";

export default function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  const [lostSession, setLostSession] = useState(false);
  const prevUserRef = useRef<typeof auth.currentUser>(auth.currentUser);

  useEffect(() => {
    const prev = prevUserRef.current;
    let manualLogout = false;
    try { manualLogout = sessionStorage.getItem("sl_manual_logout") === "1"; } catch { manualLogout = false; }
    const justLostSession = Boolean(prev && !user && !manualLogout);
    setLostSession(justLostSession);
    if (!user) {
      try { sessionStorage.removeItem("sl_manual_logout"); } catch {}
    }
    prevUserRef.current = user as any;
  }, [user]);

  if (loading) return null; // or spinner when auth pending
  return user ? children : (
    <Navigate
      to="/login"
      replace
      state={{ from: location.pathname, reason: lostSession ? "session-expired" : "auth-required" }}
    />
  );
}
