import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import type { Auth, Unsubscribe, User } from "firebase/auth";
import { initializeFirebase } from "../utils/lazyFirebase.js";
import { writeAuditLog } from "../lib/audit";


export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const authRef = useRef<Auth | null>(null);
  const loc = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
  let unsub: Unsubscribe | undefined;
    let mounted = true;

    (async () => {
      try {
  const { auth } = (await initializeFirebase()) as { auth: Auth };
  authRef.current = auth;
  const { onIdTokenChanged } = await import("firebase/auth");
        if (!mounted) return;
  unsub = onIdTokenChanged(auth, (nextUser) => setUser(nextUser));
      } catch (error) {
        console.error("[Navbar] Failed to attach auth listener:", error);
        if (mounted) setUser(null);
      }
    })();

    return () => {
      mounted = false;
      if (typeof unsub === "function") {
        try { unsub(); } catch {}
      }
    };
  }, []);

  async function logout() {
    let authInstance = authRef.current;
    if (!authInstance) {
      try {
  const { auth } = (await initializeFirebase()) as { auth: Auth };
  authRef.current = auth;
        authInstance = auth;
      } catch (error) {
        console.error("[Navbar] Failed to load Firebase for logout:", error);
      }
    }

    let storedEmail = null;
    try {
      storedEmail = sessionStorage.getItem("userEmail");
    } catch {
      /* storage unavailable */
    }

  const userEmail = user?.email ?? authInstance?.currentUser?.email ?? storedEmail ?? undefined;

  try { await writeAuditLog({ action: "LOGOUT", userEmail }); } catch {}

    if (authInstance) {
      try {
        const { signOut } = await import("firebase/auth");
        await signOut(authInstance);
      } catch (error) {
        console.error("[Navbar] Failed to sign out:", error);
      }
    }

    try {
      sessionStorage.removeItem("tenantId");
      sessionStorage.removeItem("role");
  sessionStorage.removeItem("userEmail");
  sessionStorage.removeItem("userId");
    } catch {
      /* storage unavailable */
    }

    navigate("/login", { replace: true });
  }

  const tenantId = sessionStorage.getItem("tenantId") || "vendor";

  return (
    <nav className="navbar navbar-expand-lg px-3 shadow-sm">
      <div className="ms-auto d-flex gap-2 align-items-center">
        <span className="badge text-bg-secondary">Tenant: {tenantId}</span>
        {user ? (
          <>
            <span className="text-muted small d-none d-md-inline">{user?.email}</span>
            <Link className={`btn rounded-pill btn-sm ${loc.pathname==="/listings-admin"?"btn-secondary":"btn-outline-secondary"}`} to="/listings-admin">Admin Portal</Link>
            <Link className={`btn rounded-pill btn-sm ${loc.pathname==="/dashboard"?"btn-secondary":"btn-outline-secondary"}`} to="/dashboard">Vendor Portal</Link>
            <Link className={`btn rounded-pill btn-sm ${loc.pathname==="/signup/vendor"?"btn-secondary":"btn-outline-secondary"}`} to="/signup/vendor">Vendor Sign Up</Link>
            <button className="btn btn-sm rounded-pill btn-outline-danger" onClick={logout}>Logout</button>
          </>
        ) : (
          <>
            <Link className="btn rounded-pill border text-neutral-500 border-neutral-700 radius-8 px-12 py-6 bg-hover-primary-700 text-hover-white" to="/signup/startup">Startup Sign Up</Link>
            <Link className="btn rounded-pill text-primary-50 hover-text-primary-200 bg-primary-500 bg-hover-primary-800 radius-8 px-12 py-6 flex-grow-1" to="/login">Login</Link>
          </>
        )}
      </div>
    </nav>
  );
}
