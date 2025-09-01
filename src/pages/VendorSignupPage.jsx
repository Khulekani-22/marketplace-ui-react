// src/pages/VendorSignupPage.jsx
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { auth } from "../lib/firebase";
import { api } from "../lib/api";
import {
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { useVendor } from "../context/VendorContext";
import { writeAuditLog } from "../lib/audit";

const API_BASE = "/api/data/vendors"; // backend upsert endpoint

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
      const payload = {
        id: profile.id,
        name: profile.name,
        contactEmail: profile.contactEmail,
        // include fields the backend can keep
        email: profile.contactEmail,
        ownerUid: profile.id,
        phone: profile.phone || "",
        website: profile.website || "",
        kycStatus: profile.kycStatus || "pending",
        categories: profile.categories || [],
      };
      await api.post(API_BASE, payload);
      try {
        await writeAuditLog({
          action: "VENDOR_CREATE",
          userEmail: profile.contactEmail,
          targetType: "vendor",
          targetId: profile.id,
          metadata: { name: profile.name },
        });
      } catch {}
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || "Failed to save vendor profile";
      throw new Error(msg);
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
    if (!form.agree) {
      setErr("Please agree to the Terms and Privacy Policy.");
      return;
    }
    setBusy(true);
    try {
      const provider = new GoogleAuthProvider();
      const { user } = await signInWithPopup(auth, provider);

      const profile = {
        id: user.uid,
        name: form.company || user.displayName || "Vendor",
        contactEmail: (user.email || "").toLowerCase(),
        phone: form.phone,
        website: form.website,
      };

      // Keep Firebase displayName in sync with entered company
      if (form.company) {
        try { await updateProfile(user, { displayName: form.company }); } catch (_) {}
      }

      await persistVendorToBackend(profile);

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
        id: user.uid,
        name: form.company || (user.email ? user.email.split("@")[0] : "Vendor"),
        contactEmail: (user.email || form.email).toLowerCase(),
        phone: form.phone,
        website: form.website,
      };

      await persistVendorToBackend(profile);

      await finalizeAndGo();
    } catch (e) {
      const code = e?.code || "";
      if (code === "auth/email-already-in-use") {
        // If the email already exists, try signing in with the provided password
        try {
          const { user } = await signInWithEmailAndPassword(auth, form.email, form.password);

          // Keep displayName in sync if a company name was provided
          if (form.company) {
            try { await updateProfile(user, { displayName: form.company }); } catch (_) {}
          }

          const profile = {
            id: user.uid,
            name: form.company || (user.email ? user.email.split("@")[0] : "Vendor"),
            contactEmail: (user.email || form.email).toLowerCase(),
            phone: form.phone,
            website: form.website,
          };

          // Upsert vendor profile so existing users can become vendors and retain the same vendor number (uid)
          await persistVendorToBackend(profile);

          await finalizeAndGo();
        } catch (signinErr) {
          const sc = signinErr?.code || "";
          if (sc === "auth/wrong-password") {
            setErr("Email already registered. The password is incorrect. Please sign in or reset your password.");
          } else if (sc === "auth/user-disabled") {
            setErr("This account is disabled. Please contact support.");
          } else if (sc === "auth/user-not-found") {
            // Very unlikely if we got email-already-in-use, but handle just in case
            setErr("This email is registered with a different sign-in method. Try 'Continue with Google'.");
          } else {
            setErr(signinErr?.message || "Unable to sign in to existing account.");
          }
        }
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
                  minLength={8}
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
                  I agree to the <a href="/terms-condition" target="_blank" rel="noreferrer">Terms</a> and{" "}
                  <a href="/privacy" target="_blank" rel="noreferrer">Privacy Policy</a>.
                </label>
              </div>
            </div>

            <div className="d-flex gap-2 mt-3">
              <button
                className="btn rounded-pill text-primary-50 hover-text-primary-200 bg-primary-500 bg-hover-primary-800 radius-8 px-12 py-6"
                type="submit"
                disabled={busy || !form.agree || !form.company || !form.email || !form.password || form.password.length < 8}
              >
                {busy ? "Creating…" : "Create account"}
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => navigate(-1)}
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
              disabled={busy || !form.company || !form.agree}
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
