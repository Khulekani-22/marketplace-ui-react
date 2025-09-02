// src/pages/StartupSignupPage.jsx
import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { auth } from "../lib/firebase";
import { api } from "../lib/api";
import { createUserWithEmailAndPassword, updateProfile, signInWithEmailAndPassword } from "firebase/auth";
import { writeAuditLog } from "../lib/audit";

export default function StartupSignupPage() {
  const navigate = useNavigate();
  const { search } = useLocation();
  const nextPath = new URLSearchParams(search).get("next") || "/dashboard";

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    agree: false,
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  function setField(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function recordUserMapping(email) {
    try {
      await api.post("/api/users", { email, tenantId: "public", role: "member" });
    } catch {
      // non-fatal for UI; mapping can be created later if API offline
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErr("");
    if (!form.agree) {
      setErr("Please agree to the Terms and Privacy Policy.");
      return;
    }
    setBusy(true);
    try {
      // Try creating user; if email exists, attempt sign-in
      let user;
      try {
        const res = await createUserWithEmailAndPassword(auth, form.email, form.password);
        user = res.user;
      } catch (e) {
        if (e?.code === "auth/email-already-in-use") {
          const res = await signInWithEmailAndPassword(auth, form.email, form.password);
          user = res.user;
        } else {
          throw e;
        }
      }

      if (form.name) {
        try { await updateProfile(user, { displayName: form.name }); } catch {}
      }

      const email = (user.email || form.email).toLowerCase();
      sessionStorage.setItem("userEmail", email);
      sessionStorage.setItem("role", "member");
      sessionStorage.setItem("tenantId", "public");

      await recordUserMapping(email);
      try { await writeAuditLog({ action: "STARTUP_SIGNUP", userEmail: email, targetType: "user" }); } catch {}

      navigate(nextPath, { replace: true });
    } catch (e) {
      const code = e?.code || "";
      if (code === "auth/weak-password") setErr("Password is too weak (min 8 chars).");
      else setErr(e?.message || "Sign up failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container py-4" style={{ maxWidth: 720 }}>
      <h1 className="h3 mb-2">Join as a Startup</h1>
      <p className="text-secondary">
        Create an account to access your dashboard. You can upgrade anytime by
        signing up as a vendor to list services and gain more privileges.
      </p>

      {err && <div className="alert alert-danger">{err}</div>}

      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Your name or startup name</label>
                <input className="form-control" value={form.name} onChange={(e)=>setField("name", e.target.value)} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Email</label>
                <input type="email" className="form-control" value={form.email} onChange={(e)=>setField("email", e.target.value)} required />
              </div>
              <div className="col-md-6">
                <label className="form-label">Password</label>
                <input type="password" className="form-control" value={form.password} onChange={(e)=>setField("password", e.target.value)} required />
              </div>
              <div className="col-md-6 d-flex align-items-end">
                <div className="form-check">
                  <input id="agree" className="form-check-input" type="checkbox" checked={form.agree} onChange={(e)=>setField("agree", e.target.checked)} />
                  <label htmlFor="agree" className="form-check-label ms-2">I agree to the Terms & Privacy</label>
                </div>
              </div>
            </div>
            <div className="d-flex gap-2 mt-3">
              <button className="btn btn-primary" disabled={busy}>{busy ? "Creating…" : "Create account"}</button>
              <Link to="/signup/vendor" className="btn btn-outline-secondary">Become a Vendor</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

