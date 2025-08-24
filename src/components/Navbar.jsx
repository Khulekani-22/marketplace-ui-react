import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { auth } from "../lib/firebase";
import { onIdTokenChanged, signOut } from "firebase/auth";

// inside Navbar / MasterLayout toggle handler
import { toggleTheme } from "../utils/theme";

function ThemeToggleButton() {
  const [theme, setTheme] = useState(localStorage.getItem("ui_theme") || "light");
  return (
    <button onClick={() => setTheme(toggleTheme())} aria-label="Toggle theme">
      {theme === "dark" ? "🌙" : "☀️"}
    </button>
  );
}


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
    <nav className="navbar navbar-expand-lg px-3 shadow-sm">
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
