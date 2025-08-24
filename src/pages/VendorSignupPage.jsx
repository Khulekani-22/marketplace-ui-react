// src/pages/VendorSignupPage.jsx
import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { auth } from "../lib/firebase";
import {
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { useVendor } from "../context/VendorContext";

const API_BASE = "/api/data/vendors"; // optional backend profile record

export default function VendorSignupPage() {
  const navigate = useNavigate();
  const { search } = useLocation();
  const { vendor, setVendorProfile, ensureVendorId } = useVendor();

  const nextPath = useMemo(() => {
    const p = new URLSearchParams(search).get("next");
    return p || "/listings-vendors"; // default redirect
  }, [search]);

  const [form, setForm] = useState({
    company: "",
    website: "",
    phone: "",
    email: "",
    password: "",
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

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
      // Non-blocking: ignore if the profile endpoint isn't ready yet
    }
  }

  async function finish(profile) {
    // Save to context + localStorage and go
    setVendorProfile(profile);
    ensureVendorId();
    navigate(nextPath, { replace: true });
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
        email: user.email || "",
        website: form.website || "",
        phone: form.phone || "",
        source: "google",
      };
      await persistVendorToBackend(profile);
      await finish(profile);
    } catch (e) {
      setErr(e?.message || "Google sign-in failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleEmailSignUp(e) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      const { user } = await createUserWithEmailAndPassword(
        auth,
        form.email,
        form.password
      );
      // set display name to company for convenience
      if (form.company) {
        await updateProfile(user, { displayName: form.company });
      }
      const profile = {
        vendorId: user.uid,
        id: user.uid,
        name: form.company || user.email?.split("@")[0] || "Vendor",
        email: user.email || form.email,
        website: form.website || "",
        phone: form.phone || "",
        source: "email",
      };
      await persistVendorToBackend(profile);
      await finish(profile);
    } catch (e) {
      setErr(e?.message || "Sign up failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container py-4" style={{ maxWidth: 760 }}>
      <h1 className="h3 mb-2">Become a Vendor</h1>
      <p className="text-secondary">
        Create your vendor profile to list services on the marketplace. After
        signing up you’ll be redirected to submit your first listing.
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
                  placeholder="e.g., 22 on Sloane"
                  required
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Website</label>
                <input
                  className="form-control"
                  value={form.website}
                  onChange={(e) => setField("website", e.target.value)}
                  placeholder="https://your-site.com"
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
            </div>

            <div className="d-flex gap-2 mt-3">
              <button className="btn btn-primary" type="submit" disabled={busy}>
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
              className="btn btn-outline-dark"
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
