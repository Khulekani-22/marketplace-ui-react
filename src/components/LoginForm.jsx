import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  onIdTokenChanged,
} from "firebase/auth";
import { auth } from "../lib/firebase"; // <-- from your earlier firebase.ts
// Optional: if you created an axios instance that injects the token, import it:
// import { api } from "../lib/api";

const google = new GoogleAuthProvider();

function mapFirebaseError(code) {
  switch (code) {
    case "auth/invalid-email": return "Please enter a valid email address.";
    case "auth/missing-password": return "Password is required.";
    case "auth/invalid-credential":
    case "auth/wrong-password": return "Incorrect email or password.";
    case "auth/user-not-found": return "No account found with that email.";
    case "auth/popup-closed-by-user": return "Sign-in popup was closed.";
    case "auth/network-request-failed": return "Network error. Check your connection.";
    default: return "Sign-in failed. Please try again.";
  }
}

/**
 * Props:
 * - redirectTo: default path after login (if no return URL present)
 * - afterLogin: optional callback({ uid, email, tenantId, idToken })
 * - showTenant: boolean to render tenant selector (default true)
 */

export default function LoginForm({ redirectTo = "/index-7", afterLogin, showTenant = true }) {
  const nav = useNavigate();
  const location = useLocation();

  // return URL support: e.g. navigate("/login", { state: { from: "/account" } })
  const returnTo = useMemo(() => {
    const q = new URLSearchParams(location.search);
    return location.state?.from || q.get("returnTo") || redirectTo;
  }, [location, redirectTo]);

  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [tenantId, setTenantId] = useState(() => sessionStorage.getItem("tenantId") || "public");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);

  // Keep a friendly “you’re signed in” hint and auto-redirect
  useEffect(() => {
    const unsub = onIdTokenChanged(auth, async (user) => {
      if (user) {
        const idToken = await user.getIdToken();
        // Optionally call a sanity endpoint:
        // await api.get("/api/me", { headers: { "x-tenant-id": tenantId } });
        const payload = { uid: user.uid, email: user.email, tenantId, idToken };
        if (afterLogin) afterLogin(payload);
        // Save non-sensitive tenant context (safe to store)
        sessionStorage.setItem("tenantId", tenantId);
        nav(returnTo, { replace: true });
      }
    });
    return () => unsub();
  }, [afterLogin, nav, returnTo, tenantId]);

  async function doEmailLogin(e) {
    e.preventDefault();
    setErr(null); setMsg(null);
    if (!email || !pass) {
      setErr("Email and password are required.");
      return;
    }
    setBusy(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), pass);
      // onIdTokenChanged above will handle redirect & callback
    } catch (ex) {
      setErr(mapFirebaseError(ex.code));
    } finally {
      setBusy(false);
    }
  }

  async function doGoogleLogin() {
    setErr(null); setMsg(null);
    setBusy(true);
    try {
      await signInWithPopup(auth, google);
      // onIdTokenChanged handles the rest
    } catch (ex) {
      setErr(mapFirebaseError(ex.code));
    } finally {
      setBusy(false);
    }
  }

  async function doResetPassword() {
    setErr(null); setMsg(null);
    if (!email) {
      setErr("Enter your email to receive a reset link.");
      return;
    }
    setBusy(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setMsg("Password reset email sent. Please check your inbox.");
    } catch (ex) {
      setErr(mapFirebaseError(ex.code));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container my-4" style={{ maxWidth: 480 }}>
      <div className="card shadow-sm">
        <div className="card-body p-4">
          <h1 className="h4 mb-3">Sign in</h1>

          {showTenant && (
            <div className="mb-3">
              <label htmlFor="tenantId" className="form-label">Tenant</label>
              <select
                id="tenantId"
                className="form-select"
                value={tenantId}
                onChange={(e) => setTenantId(e.target.value)}
                aria-describedby="tenantHelp"
              >
                <option value="public">public</option>
                {/* Add your real tenants here, or fetch dynamically */}
                {/* <option value="sloane">sloane</option> */}
              </select>
              <div id="tenantHelp" className="form-text">
                Requests include <code>x-tenant-id</code> for multi-tenant scoping.
              </div>
            </div>
          )}

          {err && <div className="alert alert-danger py-2">{err}</div>}
          {msg && <div className="alert alert-success py-2">{msg}</div>}

          <form onSubmit={doEmailLogin} noValidate>
            <div className="mb-3">
              <label htmlFor="email" className="form-label">Email address</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="mb-2">
              <label htmlFor="password" className="form-label">Password</label>
              <div className="input-group">
                <input
                  id="password"
                  type={showPass ? "text" : "password"}
                  autoComplete="current-password"
                  className="form-control"
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  required
                  minLength={8}
                  aria-describedby="passwordHelp"
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setShowPass(!showPass)}
                  aria-label={showPass ? "Hide password" : "Show password"}
                >
                  {showPass ? "Hide" : "Show"}
                </button>
              </div>
              <div id="passwordHelp" className="form-text">
                Minimum 8 characters.
              </div>
            </div>

            <div className="d-grid gap-2 mt-3">
              <button className="btn btn-primary" type="submit" disabled={busy}>
                {busy ? "Signing in..." : "Sign in"}
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={doGoogleLogin}
                disabled={busy}
              >
                Continue with Google
              </button>
            </div>
          </form>

          <div className="d-flex justify-content-between align-items-center mt-3">
            <button
              type="button"
              className="btn btn-link p-0"
              onClick={doResetPassword}
              disabled={busy}
            >
              Forgot password?
            </button>
            <small className="text-muted">
              By signing in you accept our Terms & Privacy.
            </small>
          </div>
        </div>
      </div>

    //  <p className="text-center text-muted mt-3" style={{ fontSize: 12 }}>
    //    JWT is issued by Firebase after sign-in and attached via your Axios interceptor.
      </p>
    </div>
  );
}
