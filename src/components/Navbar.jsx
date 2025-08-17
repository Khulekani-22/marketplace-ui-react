import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { auth } from "../lib/firebase";
import { onIdTokenChanged, signOut } from "firebase/auth";

export default function Navbar() {
  const [user, setUser] = useState(null);
  const loc = useLocation();

  useEffect(() => onIdTokenChanged(auth, setUser), []);

  async function logout() {
    await signOut(auth);
    sessionStorage.removeItem("tenantId");
  }

  const tenantId = sessionStorage.getItem("tenantId") || "public";

  return (
    <nav className="navbar navbar-expand-lg bg-light px-3 shadow-sm">
      <Link className="navbar-brand" to="/">Sloane Hub</Link>
      <div className="ms-auto d-flex gap-2 align-items-center">
        <span className="badge text-bg-secondary">Tenant: {tenantId}</span>
        {user ? (
          <>
            <span className="text-muted small d-none d-md-inline">{user.email}</span>
            <Link className={`btn btn-sm ${loc.pathname==="/dashboard"?"btn-secondary":"btn-outline-secondary"}`} to="/dashboard">Dashboard</Link>
            <button className="btn btn-sm btn-outline-danger" onClick={logout}>Logout</button>
          </>
        ) : (
          <Link className="btn btn-sm btn-primary" to="/login">Login</Link>
        )}
      </div>
    </nav>
  );
}
