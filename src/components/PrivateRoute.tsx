// src/components/PrivateRoute.jsx
import { useEffect, useRef, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { auth } from "../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

export default function PrivateRoute({ children }) {
  const [user, setUser] = useState<typeof auth.currentUser | undefined>(undefined); // undefined = loading
  const location = useLocation();

  const [lostSession, setLostSession] = useState(false);
  const prevUserRef = useRef<typeof auth.currentUser>(auth.currentUser);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      const prev = prevUserRef.current;
      let manualLogout = false;
      try { manualLogout = sessionStorage.getItem("sl_manual_logout") === "1"; } catch { manualLogout = false; }
      const justLostSession = Boolean(prev && !u && !manualLogout);
      setLostSession(justLostSession);
      if (!u) {
        try { sessionStorage.removeItem("sl_manual_logout"); } catch {}
      }
      setUser(u || null);
      prevUserRef.current = u;
    });
  }, []);

  if (user === undefined) return null; // or spinner
  return user ? children : (
    <Navigate
      to="/login"
      replace
      state={{ from: location.pathname, reason: lostSession ? "session-expired" : "auth-required" }}
    />
  );
}
