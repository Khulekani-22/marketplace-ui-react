// src/pages/VendorSignupPage.jsx
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { auth } from "../lib/firebase";
import {
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { useVendor } from "../context/VendorContext";

const API_BASE = "/api/data/vendors"; // optional: backend upsert; non-blocking

export default function VendorSignupPage() {
  const navigate = useNavigate();
  const { search } = useLocation();
  const { vendor, ensureVendorId, refresh } = useVendor();

  const nextPath = useMemo(() => {
    const p = new URLSearchParams(search).get("next");
    return p || "/profile-vendor";
  }, [search]);

  const [form, setForm] = useState({
    company: "",
    website: "",
    phone: "",
    email: "",
    password: "",
    agree: false,
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    // Pre-fill email if already signed in
    if (auth.currentUser?.email) {
      setForm((f) => ({ ...f, email: auth.currentUser.email }));
    }
  }, []);

  function setField(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function persistVendorToBackend(profile) {
    try {
      await fetch(API_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
    } catch {
      // Non-blocking: ignore if endpoint isn't ready yet
    }
  }

  async function finalizeAndGo() {
    try {
      // Force a fresh hydrate just in case
      await refresh?.();
      await ensureVendorId?.();
    } finally {
      navigate(nextPath, { replace: true });
    }
  }

  async function handleGoogle() {
    setErr("");
    setBusy(true);
    try {
      const provider = new GoogleAuthProvider();
      const { user } = await signInWithPopup(auth, provider);

      const profile = {
        vendorId: user.uid,
        id: user.uid,
        name: form.company || user.displayName || "Vendor",
        email: (user.email || "").toLowerCase(),
        ownerUid: user.uid,
        website: form.website || "",
        phone: form.phone || "",
        source: "google",
      };

      // Optional best-effort upsert
      persistVendorToBackend(profile);

      await finalizeAndGo();
    } catch (e) {
      // Friendly error messages
      const code = e?.code || "";
      if (code === "auth/popup-closed-by-user") {
        setErr("Google sign-in was closed before completing.");
      } else {
        setErr(e?.message || "Google sign-in failed");
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleEmailSignUp(e) {
    e.preventDefault();
    setErr("");
    if (!form.agree) {
      setErr("Please agree to the Terms and Privacy Policy.");
      return;
    }
    setBusy(true);
    try {
      const { user } = await createUserWithEmailAndPassword(
        auth,
        form.email,
        form.password
      );

      if (form.company) {
        await updateProfile(user, { displayName: form.company });
      }

      const profile = {
        vendorId: user.uid,
        id: user.uid,
        name: form.company || (user.email ? user.email.split("@")[0] : "Vendor"),
        email: (user.email || form.email).toLowerCase(),
        ownerUid: user.uid,
        website: form.website || "",
        phone: form.phone || "",
        source: "email",
      };

      // Optional best-effort upsert
      persistVendorToBackend(profile);

      await finalizeAndGo();
    } catch (e) {
      const code = e?.code || "";
      if (code === "auth/email-already-in-use") {
        setErr(
          "This email is already registered. Please sign in instead, or use 'Continue with Google' if you created the account that way."
        );
      } else if (code === "auth/weak-password") {
        setErr("Password is too weak. Please use at least 8 characters.");
      } else {
        setErr(e?.message || "Sign up failed");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container py-4" style={{ maxWidth: 760 }}>
      <h1 className="h3 mb-2">Become a Vendor</h1>
      <p className="text-secondary">
        Create your vendor profile to list services on the marketplace. After
        signing up you’ll be redirected to your vendor workspace.
      </p>

      {err && <div className="alert alert-danger">{err}</div>}

      <div className="card mb-3">
        <div className="card-header fw-semibold">Vendor details</div>
        <div className="card-body">
          <form onSubmit={handleEmailSignUp}>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Company / Brand</label>
                <input
                  className="form-control"
                  value={form.company}
                  onChange={(e) => setField("company", e.target.value)}
                  placeholder="e.g., 22 On Sloane"
                  required
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Website</label>
                <input
                  className="form-control"
                  value={form.website}
                  onChange={(e) => setField("website", e.target.value)}
                  placeholder="https://your-site.co.za"
                />
              </div>

              <div className="col-md-6">
                <label className="form-label">Work Email</label>
                <input
                  type="email"
                  className="form-control"
                  value={form.email}
                  onChange={(e) => setField("email", e.target.value)}
                  placeholder="name@company.com"
                  required
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Phone</label>
                <input
                  className="form-control"
                  value={form.phone}
                  onChange={(e) => setField("phone", e.target.value)}
                  placeholder="+27 …"
                />
              </div>

              <div className="col-md-6">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  className="form-control"
                  value={form.password}
                  onChange={(e) => setField("password", e.target.value)}
                  placeholder="Minimum 8 characters"
                  required
                />
              </div>

              <div className="col-12 d-flex align-items-center gap-2 mt-2">
                <input
                  id="agree"
                  type="checkbox"
                  className="form-check-input"
                  checked={form.agree}
                  onChange={(e) => setField("agree", !!e.target.checked)}
                />
                <label htmlFor="agree" className="form-check-label">
                  I agree to the <a href="/terms" target="_blank" rel="noreferrer">Terms</a> and{" "}
                  <a href="/privacy" target="_blank" rel="noreferrer">Privacy Policy</a>.
                </label>
              </div>
            </div>

            <div className="d-flex gap-2 mt-3">
              <button className="btn rounded-pill text-primary-50 hover-text-primary-200 bg-primary-500 bg-hover-primary-800 radius-8 px-12 py-6" type="submit" disabled={busy}>
                {busy ? "Creating…" : "Create account"}
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => window.history.back()}
              >
                Cancel
              </button>
            </div>
          </form>

          <div className="text-center my-3 text-muted">or</div>

          <div className="d-grid">
            <button
              className="btn rounded-pill text-primary-50 hover-text-primary-200 bg-primary-500 bg-hover-primary-800 radius-8 px-12 py-6"
              onClick={handleGoogle}
              disabled={busy}
              title="Continue with Google"
            >
              {busy ? "Please wait…" : "Continue with Google"}
            </button>
          </div>
        </div>
      </div>

      {vendor?.vendorId && (
        <div className="alert alert-info">
          Signed in as <strong>{vendor.name || vendor.email}</strong>. Vendor ID:{" "}
          <code>{vendor.vendorId}</code>
        </div>
      )}
    </div>
  );
}
