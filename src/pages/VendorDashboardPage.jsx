import React, { useEffect, useMemo, useState } from "react";
import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import { useVendor } from "../context/VendorContext";
import { api } from "../lib/api";
import { Link } from "react-router-dom";
import appDataLocal from "../data/appData.json";

export default function VendorDashboardPage() {
  const { vendor } = useVendor?.() || { vendor: null };
  const vendorId = vendor?.vendorId || vendor?.id || vendor?.ownerUid || vendor?.email || "me";
  const tenantId = useMemo(() => sessionStorage.getItem("tenantId") || "vendor", []);
  const [stats, setStats] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [myListings, setMyListings] = useState([]);
  const [subByService, setSubByService] = useState({});
  const [salesTime, setSalesTime] = useState({ monthly: {}, quarterly: {}, annual: {} });

  useEffect(() => {
    (async () => {
      setErr("");
      if (!vendor) return;
      setLoading(true);
      try {
        const live = await api
          .get(`/api/lms/live`)
          .then((r) => r.data)
          .catch(() => appDataLocal);
        const all = Array.isArray(live?.services) ? live.services : [];
        const vId = vendor?.vendorId || vendor?.id || "";
        const vEmail = (vendor?.email || vendor?.contactEmail || "").toLowerCase();
        const vName = (vendor?.name || "").toLowerCase();
        const mine = all.filter((s) => {
          const sid = String(s.vendorId || "");
          const se = (s.contactEmail || s.email || "").toLowerCase();
          const sv = (s.vendor || "").toLowerCase();
          return (
            (sid && vId && sid === vId) ||
            (!sid && (sv === vName || (!!vEmail && se === vEmail)))
          );
        });
        setMyListings(mine);

        const byStatus = mine.reduce((acc, s) => {
          const k = (s.status || "approved").toLowerCase();
          acc[k] = (acc[k] || 0) + 1;
          return acc;
        }, {});
        const totalReviews = mine.reduce((n, s) => n + (Number(s.reviewCount || (Array.isArray(s.reviews) ? s.reviews.length : 0)) || 0), 0);
        const ratings = mine.map((s) => Number(s.rating || 0)).filter((x) => !Number.isNaN(x));
        const avgRating = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
        setStats({
          listingStats: { total: mine.length, byStatus },
          reviewStats: { totalReviews, avgRating },
          subscription: { plan: vendor?.subscriptionPlan || "Free", status: (vendor?.status || vendor?.kycStatus || "pending").toLowerCase() },
        });

        // Fetch server-side analytics for this vendor (subs + time buckets)
        try {
          const params = {
            email: (vendor?.email || vendor?.contactEmail || '').toLowerCase(),
            uid: vendor?.ownerUid || '',
            name: vendor?.name || ''
          };
          const vId = vendor?.vendorId || vendor?.id || 'me';
          const resp = await api.get(`/api/data/vendors/${encodeURIComponent(vId)}/stats`, { params });
          const s = resp.data || {};
          setSubByService(s?.subscriptionStats?.byService || {});
          setSalesTime(s?.salesTime || { monthly: {}, quarterly: {}, annual: {} });
        } catch (e) {
          // non-fatal
        }
      } catch (e) {
        setErr(e?.message || "Failed to load vendor listings");
      } finally {
        setLoading(false);
      }
    })();
  }, [tenantId, vendor?.vendorId, vendor?.email, vendor?.name]);

  const listTotals = stats?.listingStats?.byStatus || {};
  const totalListings = stats?.listingStats?.total || 0;
  const totalReviews = stats?.reviewStats?.totalReviews || 0;
  const avgRating = Number(stats?.reviewStats?.avgRating || 0).toFixed(1);
  const plan = stats?.subscription?.plan || "Free";
  const subStatus = stats?.subscription?.status || "pending";

  return (
    <MasterLayout>
      <Breadcrumb title="Vendor Home" />

      {!vendorId && (
        <div className="alert alert-warning">
          You don't have a vendor profile yet. Create one to access your dashboard.
          <div className="mt-2">
            <Link to="/signup/vendor" className="btn btn-sm btn-primary">Become a Vendor</Link>
            <Link to="/profile-startup" className="btn btn-sm btn-outline-secondary ms-2">Startup Profile</Link>
          </div>
        </div>
      )}

      {err && <div className="alert alert-danger">{err}</div>}

      <div className="row g-3">
        {/* Listings card */}
        <div className="col-md-4">
          <div className="card h-100">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <h6 className="mb-0">Listings</h6>
                <Link to="/listings-vendors-mine" className="btn btn-sm btn-outline-primary">View</Link>
              </div>
              <div className="display-6 fw-bold mt-2">{totalListings}</div>
              <div className="mt-2 text-secondary small">
                <span className="me-3">Approved: <strong>{listTotals.approved || 0}</strong></span>
                <span className="me-3">Pending: <strong>{listTotals.pending || 0}</strong></span>
                <span>Rejected: <strong>{listTotals.rejected || 0}</strong></span>
              </div>
              <div className="mt-3 d-flex gap-2">
                <Link to="/listings-vendors" className="btn btn-sm btn-primary">Create listing</Link>
                <Link to="/profile-vendor" className="btn btn-sm btn-outline-secondary">Edit profile</Link>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews card */}
        <div className="col-md-4">
          <div className="card h-100">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <h6 className="mb-0">Reviews</h6>
                <span className="badge bg-primary-subtle text-primary-700">Avg {avgRating}★</span>
              </div>
              <div className="display-6 fw-bold mt-2">{totalReviews}</div>
              <div className="mt-2 text-secondary small">Total review count across your listings.</div>
            </div>
          </div>
        </div>

        {/* Subscription card */}
        <div className="col-md-4">
          <div className="card h-100">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <h6 className="mb-0">Subscription</h6>
                <span className={`badge text-bg-${subStatus === 'active' ? 'success' : subStatus === 'pending' ? 'warning' : 'secondary'}`}>{subStatus}</span>
              </div>
              <div className="display-6 fw-bold mt-2">{plan}</div>
              <div className="mt-2 text-secondary small">Upgrade coming soon.</div>
            </div>
          </div>
        </div>
      </div>

      {/* My Listings */}
      <div className="card mt-3">
        <div className="card-header d-flex align-items-center justify-content-between">
          <h6 className="mb-0">My Listings</h6>
          <Link to="/listings-vendors-mine" className="btn btn-sm btn-outline-secondary">See all</Link>
        </div>
        <div className="card-body">
          {!loading && myListings.length === 0 && (
            <div className="text-secondary">No listings yet. Create your first one.</div>
          )}
          {loading && <div className="text-secondary">Loading listings…</div>}
          {!loading && myListings.length > 0 && (
            <div className="table-responsive">
              <table className="table mb-0 align-middle">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Status</th>
                    <th>Category</th>
                    <th>Rating</th>
                    <th>Reviews</th>
                    <th>Subscribers</th>
                  </tr>
                </thead>
                <tbody>
                  {myListings.slice(0, 6).map((s) => (
                    <tr key={s.id}>
                      <td>{s.title || 'Untitled'}</td>
                      <td><span className="badge text-bg-light text-capitalize">{(s.status || 'approved').toLowerCase()}</span></td>
                      <td>{s.category || '—'}</td>
                      <td>{Number(s.rating || 0).toFixed(1)}★</td>
                      <td>{Number(s.reviewCount || (Array.isArray(s.reviews) ? s.reviews.length : 0) || 0)}</td>
                      <td>{Number(subByService[String(s.id)] || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Sales Analytics (based on subscriptions pricing) */}
      <div className="row g-3 mt-3">
        <div className="col-md-6">
          <div className="card h-100">
            <div className="card-body">
              <h6 className="mb-2">Monthly Sales</h6>
              <div className="table-responsive">
                <table className="table table-sm mb-0">
                  <thead><tr><th>Month</th><th className="text-end">Orders</th><th className="text-end">Revenue (R)</th></tr></thead>
                  <tbody>
                    {Object.entries(salesTime.monthly || {})
                      .sort((a,b)=> a[0] < b[0] ? 1 : -1)
                      .slice(0, 6)
                      .map(([k,v]) => (
                        <tr key={k}><td>{k}</td><td className="text-end">{v.count||0}</td><td className="text-end">{Number(v.revenue||0).toLocaleString()}</td></tr>
                      ))}
                    {Object.keys(salesTime.monthly || {}).length === 0 && (
                      <tr><td colSpan={3} className="text-secondary">No completed sales yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card h-100">
            <div className="card-body">
              <h6 className="mb-2">Quarterly Sales</h6>
              <ul className="list-unstyled mb-0">
                {Object.entries(salesTime.quarterly || {})
                  .sort((a,b)=> a[0] < b[0] ? 1 : -1)
                  .slice(0, 4)
                  .map(([k,v]) => (
                    <li key={k} className="d-flex justify-content-between"><span>{k}</span><span>R {Number(v.revenue||0).toLocaleString()}</span></li>
                  ))}
                {Object.keys(salesTime.quarterly || {}).length === 0 && (
                  <li className="text-secondary">No data</li>
                )}
              </ul>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card h-100">
            <div className="card-body">
              <h6 className="mb-2">Annual Sales</h6>
              <ul className="list-unstyled mb-0">
                {Object.entries(salesTime.annual || {})
                  .sort((a,b)=> a[0] < b[0] ? 1 : -1)
                  .slice(0, 3)
                  .map(([k,v]) => (
                    <li key={k} className="d-flex justify-content-between"><span>{k}</span><span>R {Number(v.revenue||0).toLocaleString()}</span></li>
                  ))}
                {Object.keys(salesTime.annual || {}).length === 0 && (
                  <li className="text-secondary">No data</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Loading indicator */}
      {loading && <div className="text-secondary mt-3">Loading stats…</div>}
    </MasterLayout>
  );
}
