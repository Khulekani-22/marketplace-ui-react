import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { auth } from "../lib/firebase";
import { onIdTokenChanged, signOut } from "firebase/auth";
import { writeAuditLog } from "../lib/audit";


export default function Navbar() {
  const [user, setUser] = useState(null);
  const loc = useLocation();
  const navigate = useNavigate();

  useEffect(() => onIdTokenChanged(auth, setUser), []);

  async function logout() {
    const userEmail = auth.currentUser?.email || null;
    try { await writeAuditLog({ action: "LOGOUT", userEmail }); } catch {}
    await signOut(auth);
    sessionStorage.removeItem("tenantId");
    sessionStorage.removeItem("role");
    sessionStorage.removeItem("userEmail");
    navigate("/login", { replace: true });
  }

  const tenantId = sessionStorage.getItem("tenantId") || "vendor";

  return (
    <nav className="navbar navbar-expand-lg px-3 shadow-sm">
      <div className="ms-auto d-flex gap-2 align-items-center">
        <span className="badge text-bg-secondary">Tenant: {tenantId}</span>
        {user ? (
          <>
            <span className="text-muted small d-none d-md-inline">{user.email}</span>
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
