// src/pages/VendorMyListings.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import MasterLayout from "../masterLayout/MasterLayout.jsx";
import { useVendor } from "../context/VendorContext";
import appDataLocal from "../data/appData.json";

const API_BASE = "/api/lms";

function StatusChip({ s }) {
  const k = (s || "unknown").toLowerCase();
  const map = {
    approved: "success",
    pending: "warning",
    rejected: "danger",
    unknown: "secondary",
  };
  return (
    <span className={`badge text-bg-${map[k] || "secondary"}`}>{k}</span>
  );
}

export default function VendorMyListings() {
  const navigate = useNavigate();
  const { vendor, ensureVendorId } = useVendor();
  const tenantId = useMemo(
    () => sessionStorage.getItem("tenantId") || "public",
    []
  );

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // load live listings and filter to this vendor
  useEffect(() => {
    ensureVendorId();
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/live`, {
          headers: { "x-tenant-id": tenantId },
        });
        const live = res.ok ? await res.json() : appDataLocal;
        const all = Array.isArray(live?.services) ? live.services : [];
        const my = all.filter(
          (s) =>
            (s.vendorId && vendor?.vendorId && s.vendorId === vendor.vendorId) ||
            (!s.vendorId &&
              (s.vendor?.toLowerCase() === (vendor?.name || "").toLowerCase() ||
                s.contactEmail?.toLowerCase() === (vendor?.email || "").toLowerCase()))
        );
        if (!cancelled) setItems(my);
      } catch {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tenantId, vendor, ensureVendorId]);

  const counts = useMemo(() => {
    const c = { approved: 0, pending: 0, rejected: 0 };
    items.forEach((i) => (c[(i.status || "pending").toLowerCase()] ||= 0, c[(i.status || "pending").toLowerCase()]++));
    return c;
  }, [items]);

  function handleDuplicate(i) {
    // Prefill the vendor form from this listing
    const prefill = encodeURIComponent(
      JSON.stringify({
        title: i.title,
        category: i.category,
        price: i.price,
        imageUrl: i.imageUrl,
        description: i.description,
        listingType: i.listingType || "service",
      })
    );
    navigate(`/listings-vendors?prefill=${prefill}`);
  }

  return (
    <MasterLayout activeRoute="/listings-vendors-mine" pageTitle="My listings">
      <div className="container py-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h1 className="h4 mb-0">My listings</h1>
          <div className="d-flex gap-2">
            <Link to="/listings-vendors" className="btn btn-primary">
              + Submit new listing
            </Link>
          </div>
        </div>

        <div className="d-flex gap-2 flex-wrap mb-3">
          <span className="badge text-bg-success">Approved: {counts.approved}</span>
          <span className="badge text-bg-warning">Pending: {counts.pending}</span>
          <span className="badge text-bg-danger">Rejected: {counts.rejected}</span>
          <span className="badge text-bg-secondary">Total: {items.length}</span>
        </div>

        <div className="card">
          <div className="card-body">
            {loading && <div className="text-muted">Loading…</div>}

            {!loading && !items.length && (
              <div className="text-muted">
                You haven’t submitted any listings yet.{" "}
                <Link to="/listings-vendors">Create your first one.</Link>
              </div>
            )}

            {!loading && !!items.length && (
              <div className="table-responsive">
                <table className="table align-middle">
                  <thead>
                    <tr>
                      <th style={{ width: 72 }}></th>
                      <th>Title</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Status</th>
                      <th style={{ width: 220 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((i) => (
                      <tr key={i.id}>
                        <td>
                          <img
                            src={i.imageUrl || "/assets/images/placeholder-4x3.png"}
                            alt=""
                            style={{ width: 64, height: 40, objectFit: "cover", borderRadius: 6 }}
                          />
                        </td>
                        <td className="fw-semibold">{i.title}</td>
                        <td>{i.category || "—"}</td>
                        <td>R{Number(i.price || 0).toLocaleString()}</td>
                        <td><StatusChip s={i.status} /></td>
                        <td className="d-flex gap-2">
                          {/* If you have a details page, point to it here */}
                          <Link
                            className="btn btn-outline-secondary btn-sm"
                            to={`/marketplace-details?id=${encodeURIComponent(i.id)}`}
                          >
                            View
                          </Link>
                          <button
                            className="btn btn-outline-primary btn-sm"
                            onClick={() => handleDuplicate(i)}
                          >
                            Duplicate & edit
                          </button>
                          {/* You can add “withdraw” for pending later; it needs a safe server API */}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </MasterLayout>
  );
}
