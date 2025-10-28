// src/components/LoginForm.jsx
import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  onIdTokenChanged,
} from "firebase/auth";
import { auth } from "../firebase.js";
import { bootstrapSession } from "../lib/api";
import { hasFullAccess } from "../utils/roles";
import { VendorContext } from "../context/vendorContextBase";
import { writeAuditLog } from "../lib/audit";

type VendorContextValue = {
  refresh?: () => Promise<void>;
} | null;

type FirebaseErrorLike = {
  code?: string;
};

const google = new GoogleAuthProvider();

function mapFirebaseError(code: string | undefined) {
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
 * - afterLogin: optional callback({ uid, email, tenantId })
 * - showTenant: boolean to render tenant selector (default true)
 */
type AfterLoginPayload = { uid: string; email: string | null; tenantId: string };
// eslint-disable-next-line no-unused-vars
type AfterLoginHandler = (payload: AfterLoginPayload) => Promise<void> | void;

type LoginFormProps = {
  redirectTo?: string;
  afterLogin?: AfterLoginHandler;
  showTenant?: boolean;
};

export default function LoginForm({
  redirectTo = "/index-7",
  afterLogin,
  showTenant = true,
}: LoginFormProps) {

  const nav = useNavigate();
  const location = useLocation();
  const vendorCtx = useContext(VendorContext) as VendorContextValue;
  const refreshVendor = vendorCtx?.refresh;

  // return URL support: /login?returnTo=/somewhere or navigate("/login", { state: { from: "/somewhere" }})
  const returnTo = useMemo(() => {
    const q = new URLSearchParams(location.search);
    return location.state?.from || q.get("returnTo") || redirectTo;
  }, [location, redirectTo]);

  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [tenantId, setTenantId] = useState(
    () => sessionStorage.getItem("tenantId") || "vendor"
  );
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    const reason = location.state?.reason as string | undefined;
    if (reason === "session-expired") {
      setErr("Your session expired. Please sign in again.");
      setMsg(null);
    } else if (reason === "auth-required") {
      setMsg("Please sign in to continue.");
      setErr(null);
    }
  }, [location.state?.reason]);

  // Prevent double-redirects on token refreshes
  const navigatedRef = useRef(false);

  useEffect(() => {
    const unsub = onIdTokenChanged(auth, async (user) => {
      if (!user) {
        navigatedRef.current = false; // allow redirect next time user signs in
        return;
      }

      // Persist tenant choice for downstream interceptors/session helpers
      sessionStorage.setItem("tenantId", tenantId);
      try {
        // Ensure VendorContext picks up the just-logged-in user immediately when available
        await refreshVendor?.();
      } catch {
        // ignore – VendorProvider will still refresh on its own
      }

      if (!navigatedRef.current) {
        navigatedRef.current = true;
        if (afterLogin) {
          try {
            await afterLogin({ uid: user.uid, email: user.email, tenantId });
          } catch {
            // swallow afterLogin errors so navigation still occurs
          }
        }
        // Resolve role/tenant from API, then redirect admins to admin portal
        let nextPath = returnTo;
        try {
          const sess = await bootstrapSession();
          if (hasFullAccess(sess?.role)) {
            nextPath = "/listings-admin"; // default admin landing
          }
        } catch { /* ignore and use returnTo */ }
        nav(nextPath, { replace: true });
      }
    });

    return () => unsub();
  }, [afterLogin, nav, returnTo, tenantId, refreshVendor]);

  async function doEmailLogin(e: React.FormEvent<HTMLFormElement>) {
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
      try { await writeAuditLog({ action: "LOGIN", userEmail: email.trim() }); } catch {}
      // onIdTokenChanged will handle refresh + redirect
    } catch (ex: unknown) {
      setErr(mapFirebaseError((ex as FirebaseErrorLike)?.code));
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
      try {
        await writeAuditLog({
          action: "LOGIN_GOOGLE",
          userEmail: auth.currentUser?.email ?? undefined,
        });
      } catch {}
      // onIdTokenChanged will handle refresh + redirect
    } catch (ex: unknown) {
      setErr(mapFirebaseError((ex as FirebaseErrorLike)?.code));
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
    } catch (ex: unknown) {
      setErr(mapFirebaseError((ex as FirebaseErrorLike)?.code));
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
                <option value="vendor">vendor</option>
                {/* Add more tenants here if needed */}
              </select>
              <div id="tenantHelp" className="form-text">
                Kindly select tenancy type or programme / cohort name.
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
              <button className="btn rounded-pill border text-neutral-500 border-neutral-700 radius-8 px-12 py-6 bg-hover-primary-700 text-hover-white" type="submit" disabled={busy}>
                {busy ? "Signing in..." : "Sign in"}
              </button>
              <button
                type="button"
                className="btn rounded-pill text-primary-50 hover-text-primary-200 bg-primary-500 bg-hover-primary-800 radius-8 px-12 py-6"
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
