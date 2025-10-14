import { useEffect, useMemo, useState } from "react";
import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import { useNavigate, Link } from "react-router-dom";
import { auth } from "../firebase.js";
import { api } from "../lib/api";
import { writeAuditLog } from "../lib/audit";

const API_BASE = "/api/data/startups";

export default function StartupProfilePage() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const tenantId = useMemo(() => sessionStorage.getItem("tenantId") || "vendor", []);
  const [hasVendor, setHasVendor] = useState(false);

  const [form, setForm] = useState({
    id: "",
    name: "",
    elevatorPitch: "",
    productsServices: "",
    employeeCount: 0,
    contactEmail: "",
    phone: "",
    website: "",
    country: "",
    city: "",
    addressLine: "",
    categories: [],
    tags: [],
  });

  function setField(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  useEffect(() => {
    (async () => {
      setErr("");
      const user = auth.currentUser;
      const email = (user?.email || "").toLowerCase();
      if (!email) return;
      try {
        const list = await api.get(API_BASE).then((r) => r.data || []);
        const mine = list.find(
          (s) => (s.ownerUid && s.ownerUid === user.uid) || ((s.contactEmail || s.email || "").toLowerCase() === email)
        );
        if (mine) {
          setForm({
            id: mine.id || "",
            name: mine.name || "",
            elevatorPitch: mine.elevatorPitch || "",
            productsServices: mine.productsServices || "",
            employeeCount: Number(mine.employeeCount || 0),
            contactEmail: (mine.contactEmail || email).toLowerCase(),
            phone: mine.phone || "",
            website: mine.website || "",
            country: mine.country || "",
            city: mine.city || "",
            addressLine: mine.addressLine || "",
            categories: Array.isArray(mine.categories) ? mine.categories : [],
            tags: Array.isArray(mine.tags) ? mine.tags : [],
          });
        } else {
          setForm((f) => ({ ...f, contactEmail: email }));
        }
        // Also check if vendor profile already exists for this user
        try {
          const vendors = await api.get("/api/data/vendors").then((r) => r.data || []);
          const match = vendors.find(
            (v) => (v.ownerUid && v.ownerUid === user.uid) || ((v.contactEmail || v.email || "").toLowerCase() === email)
          );
          setHasVendor(!!match);
        } catch {}
      } catch (e) {
        setErr(e?.response?.data?.message || e?.message || "Failed to load startup profile");
      }
    })();
  }, [tenantId]);

  async function save(e) {
    e?.preventDefault?.();
    setBusy(true);
    setErr("");
    setOk("");
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Please sign in");
      const payload = {
        id: form.id || user.uid,
        name: form.name,
        elevatorPitch: form.elevatorPitch,
        productsServices: form.productsServices,
        employeeCount: Number(form.employeeCount || 0),
        contactEmail: (form.contactEmail || user.email || "").toLowerCase(),
        ownerUid: user.uid,
        phone: form.phone,
        website: form.website,
        country: form.country,
        city: form.city,
        addressLine: form.addressLine,
        categories: form.categories,
        tags: form.tags,
      };
      if (!payload.name) throw new Error("Business name is required");
      await api.post(API_BASE, payload);
      setOk("Saved");
      try { await writeAuditLog({ action: "STARTUP_UPDATE", userEmail: payload.contactEmail, targetType: "startup", targetId: payload.id }); } catch {}
      setForm((f) => ({ ...f, id: payload.id }));
    } catch (e) {
      setErr(e?.response?.data?.message || e?.message || "Failed to save");
    } finally {
      setBusy(false);
    }
  }

  async function createVendorFromStartup() {
    setErr("");
    setOk("");
    setBusy(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Please sign in");
      const email = (form.contactEmail || user.email || "").toLowerCase();
      const description = [form.elevatorPitch || "", form.productsServices || ""].filter(Boolean).join("\n\n");
      const payload = {
        id: user.uid,
        name: form.name,
        contactEmail: email,
        ownerUid: user.uid,
        phone: form.phone,
        website: form.website,
        description,
        country: form.country,
        city: form.city,
        addressLine: form.addressLine,
        categories: form.categories,
        tags: form.tags,
        status: "pending",
        kycStatus: "pending",
      };
      if (!payload.name) throw new Error("Business name is required to create a vendor.");
      await api.post("/api/data/vendors", payload);
      try { await writeAuditLog({ action: "VENDOR_CREATE_FROM_STARTUP", userEmail: email, targetType: "vendor", targetId: user.uid }); } catch {}
      setOk("Vendor profile created. Redirecting…");
      setHasVendor(true);
      setTimeout(() => navigate("/profile-vendor", { replace: true }), 600);
    } catch (e) {
      setErr(e?.response?.data?.message || e?.message || "Failed to create vendor from startup");
    } finally {
      setBusy(false);
    }
  }

  return (
    <MasterLayout>
      <Breadcrumb title="Startup Profile" />
      <div className="card">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <div className="small text-muted">Tenant: <code>{tenantId}</code></div>
            <div className="d-flex gap-2">
              {hasVendor ? (
                <Link to="/profile-vendor" className="btn btn-sm btn-outline-primary">Go to Vendor Profile</Link>
              ) : (
                <button type="button" className="btn btn-sm btn-primary" onClick={createVendorFromStartup} disabled={busy}>
                  {busy ? "Creating…" : "Create Vendor from Startup"}
                </button>
              )}
            </div>
          </div>
          {err && <div className="alert alert-danger">{err}</div>}
          {ok && <div className="alert alert-success">{ok}</div>}
          <form onSubmit={save} className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Business name</label>
              <input className="form-control" value={form.name} onChange={(e)=>setField("name", e.target.value)} required />
            </div>
            <div className="col-md-6">
              <label className="form-label">Website</label>
              <input className="form-control" value={form.website} onChange={(e)=>setField("website", e.target.value)} />
            </div>

            <div className="col-12">
              <label className="form-label">Elevator pitch</label>
              <textarea className="form-control" rows={3} value={form.elevatorPitch} onChange={(e)=>setField("elevatorPitch", e.target.value)} />
            </div>

            <div className="col-12">
              <label className="form-label">Products / Services</label>
              <textarea className="form-control" rows={4} value={form.productsServices} onChange={(e)=>setField("productsServices", e.target.value)} />
            </div>

            <div className="col-md-4">
              <label className="form-label">Employees</label>
              <input type="number" min={0} className="form-control" value={form.employeeCount} onChange={(e)=>setField("employeeCount", e.target.value)} />
            </div>
            <div className="col-md-4">
              <label className="form-label">Phone</label>
              <input className="form-control" value={form.phone} onChange={(e)=>setField("phone", e.target.value)} />
            </div>
            <div className="col-md-4">
              <label className="form-label">Contact email</label>
              <input type="email" className="form-control" value={form.contactEmail} onChange={(e)=>setField("contactEmail", e.target.value)} />
            </div>

            <div className="col-md-4">
              <label className="form-label">Country</label>
              <input className="form-control" value={form.country} onChange={(e)=>setField("country", e.target.value)} />
            </div>
            <div className="col-md-4">
              <label className="form-label">City</label>
              <input className="form-control" value={form.city} onChange={(e)=>setField("city", e.target.value)} />
            </div>
            <div className="col-md-4">
              <label className="form-label">Address</label>
              <input className="form-control" value={form.addressLine} onChange={(e)=>setField("addressLine", e.target.value)} />
            </div>

            <div className="col-12">
              <label className="form-label">Categories (comma separated)</label>
              <input
                className="form-control"
                value={(form.categories || []).join(", ")}
                onChange={(e)=>setField("categories", e.target.value.split(",").map((x)=>x.trim()).filter(Boolean))}
              />
            </div>
            <div className="col-12">
              <label className="form-label">Tags (comma separated)</label>
              <input
                className="form-control"
                value={(form.tags || []).join(", ")}
                onChange={(e)=>setField("tags", e.target.value.split(",").map((x)=>x.trim()).filter(Boolean))}
              />
            </div>

            <div className="col-12 d-flex gap-2">
              <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? "Saving…" : "Save profile"}</button>
            </div>
          </form>
        </div>
      </div>
    </MasterLayout>
  );
}
