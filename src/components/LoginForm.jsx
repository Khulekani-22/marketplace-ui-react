// src/components/LoginForm.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  onIdTokenChanged,
} from "firebase/auth";
import { auth } from "../lib/firebase";
import { useVendor } from "../context/VendorContext";

const google = new GoogleAuthProvider();

function mapFirebaseError(code) {
  switch (code) {
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/missing-password":
      return "Password is required.";
    case "auth/invalid-credential":
    case "auth/wrong-password":
      return "Incorrect email or password.";
    case "auth/user-not-found":
      return "No account found with that email.";
    case "auth/popup-closed-by-user":
      return "Sign-in popup was closed.";
    case "auth/network-request-failed":
      return "Network error. Check your connection.";
    default:
      return "Sign-in failed. Please try again.";
  }
}

/**
 * Props:
 * - redirectTo: default path after login (if no return URL present)
 * - afterLogin: optional callback({ uid, email, tenantId, idToken })
 * - showTenant: boolean to render tenant selector (default true)
 */
export default function LoginForm({
  redirectTo = "/index-7",
  afterLogin,
  showTenant = true,
}) {
  const nav = useNavigate();
  const location = useLocation();
  const { refresh } = useVendor();

  // return URL support: /login?returnTo=/somewhere or navigate("/login", { state: { from: "/somewhere" }})
  const returnTo = useMemo(() => {
    const q = new URLSearchParams(location.search);
    return location.state?.from || q.get("returnTo") || redirectTo;
  }, [location, redirectTo]);

  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [tenantId, setTenantId] = useState(
    () => sessionStorage.getItem("tenantId") || "public"
  );
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);

  // Prevent double-redirects on token refreshes
  const navigatedRef = useRef(false);

  useEffect(() => {
    const unsub = onIdTokenChanged(auth, async (user) => {
      if (!user) {
        navigatedRef.current = false; // allow redirect next time user signs in
        return;
      }

      // Get a fresh token and force vendor re-hydration for the new user
      const idToken = await user.getIdToken(/* forceRefresh */ true);
      sessionStorage.setItem("tenantId", tenantId);
      try {
        // Ensure VendorContext picks up the just-logged-in user immediately
        await refresh?.();
      } catch {
        // ignore – VendorProvider will still refresh on its own
      }

      if (!navigatedRef.current) {
        navigatedRef.current = true;
        if (afterLogin) {
          try {
            await afterLogin({ uid: user.uid, email: user.email, tenantId, idToken });
          } catch {
            // swallow afterLogin errors so navigation still occurs
          }
        }
        nav(returnTo, { replace: true });
      }
    });

    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [afterLogin, nav, returnTo, tenantId, refresh]);

  async function doEmailLogin(e) {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    if (!email || !pass) {
      setErr("Email and password are required.");
      return;
    }
    setBusy(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), pass);
      // onIdTokenChanged will handle refresh + redirect
    } catch (ex) {
      setErr(mapFirebaseError(ex?.code));
    } finally {
      setBusy(false);
    }
  }

  async function doGoogleLogin() {
    setErr(null);
    setMsg(null);
    setBusy(true);
    try {
      await signInWithPopup(auth, google);
      // onIdTokenChanged will handle refresh + redirect
    } catch (ex) {
      setErr(mapFirebaseError(ex?.code));
    } finally {
      setBusy(false);
    }
  }

  async function doResetPassword() {
    setErr(null);
    setMsg(null);
    if (!email) {
      setErr("Enter your email to receive a reset link.");
      return;
    }
    setBusy(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setMsg("Password reset email sent. Please check your inbox.");
    } catch (ex) {
      setErr(mapFirebaseError(ex?.code));
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
              <label htmlFor="tenantId" className="form-label">
                Tenant
              </label>
              <select
                id="tenantId"
                className="form-select"
                value={tenantId}
                onChange={(e) => setTenantId(e.target.value)}
                aria-describedby="tenantHelp"
              >
                <option value="public">public</option>
                {/* Add more tenants here if needed */}
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
              <label htmlFor="email" className="form-label">
                Email address
              </label>
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
              <label htmlFor="password" className="form-label">
                Password
              </label>
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
              By signing in you accept our Terms &amp; Privacy.
            </small>
          </div>
        </div>
      </div>
    </div>
  );
}
