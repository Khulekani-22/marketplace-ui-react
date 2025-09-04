import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import DashBoardLayerSeven from "../components/DashBoardLayerSeven";
import ReviewsWidget from "../components/ReviewsWidget";
import { useVendor } from "../context/VendorContext";
import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import { fetchMySubscriptions } from "../lib/subscriptions";
import appDataLocal from "../data/appData.json";
 


const Dashboard = () => {
  const { vendor } = useVendor?.() || { vendor: null };
  const role = typeof window !== "undefined" ? sessionStorage.getItem("role") : null;
  const isAdmin = role === "admin";
  const hasVendorProfile = !!vendor?.vendorId;
  const isApproved = !!vendor?.isApproved;
  const tenantId = useMemo(() => sessionStorage.getItem("tenantId") || "vendor", []);

  // UX data: quick stats and subscriptions preview
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mine, setMine] = useState([]);
  const [subCount, setSubCount] = useState(0);
  const [vendorStats, setVendorStats] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true); setError("");
      try {
        // Subscriptions (for any user)
        try {
          const subs = await fetchMySubscriptions();
          if (!cancelled) setSubCount(Array.isArray(subs) ? subs.length : 0);
        } catch {}

        // Vendor-specific: my listings and stats
        if (vendor?.vendorId || vendor?.email) {
          const live = await api
            .get(`/api/lms/live`)
            .then((r) => r.data)
            .catch(() => appDataLocal);
          const all = Array.isArray(live?.services) ? live.services : [];
          const vId = vendor?.vendorId || vendor?.id || "";
          const vEmail = (vendor?.email || vendor?.contactEmail || "").toLowerCase();
          const vName = (vendor?.name || "").toLowerCase();
          const mineList = all.filter((s) => {
            const sid = String(s.vendorId || "");
            const se = (s.contactEmail || s.email || "").toLowerCase();
            const sv = (s.vendor || "").toLowerCase();
            return (
              (sid && vId && sid === vId) ||
              (!sid && (sv === vName || (!!vEmail && se === vEmail)))
            );
          });
          if (!cancelled) setMine(mineList.slice(0, 5));
          try {
            const params = {
              email: (vendor?.email || vendor?.contactEmail || '').toLowerCase(),
              uid: vendor?.ownerUid || '',
              name: vendor?.name || ''
            };
            const vKey = vendor?.vendorId || vendor?.id || 'me';
            const resp = await api.get(`/api/data/vendors/${encodeURIComponent(vKey)}/stats`, { params });
            if (!cancelled) setVendorStats(resp.data || null);
          } catch {}
        } else {
          if (!cancelled) setMine([]);
          if (!cancelled) setVendorStats(null);
        }
      } catch (e) {
        if (!cancelled) setError(e?.message || 'Failed to load dashboard');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [tenantId, vendor?.vendorId, vendor?.email, vendor?.name]);

  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title='Dashboard' />

        {/* Startup upsell banner for non-admins */}
        {!isAdmin && (
          <div className="alert alert-info d-flex justify-content-between align-items-center" role="alert">
            <div>
              <strong>Welcome!</strong> You currently have startup access. {hasVendorProfile ? (
                isApproved ? "Your vendor profile is approved." : "Your vendor profile is pending approval."
              ) : (
                "Create a vendor profile to list services and unlock more features."
              )}
            </div>
            <div className="d-flex gap-2">
              {!hasVendorProfile && (
                <Link to="/signup/vendor" className="btn btn-sm btn-primary">
                  Become a Vendor
                </Link>
              )}
              {hasVendorProfile && !isApproved && (
                <Link to="/profile-vendor" className="btn btn-sm btn-outline-primary">
                  View Vendor Profile
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="row g-3 mb-3">
          <div className="col-md-4">
            <Link to="/marketplace" className="card h-100 text-decoration-none">
              <div className="card-body">
                <div className="text-secondary small">Discover</div>
                <div className="h5 mb-1">Marketplace</div>
                <div className="text-secondary small">Find and subscribe to vendor services.</div>
              </div>
            </Link>
          </div>
          <div className="col-md-4">
            <Link to="/subscriptions" className="card h-100 text-decoration-none">
              <div className="card-body">
                <div className="text-secondary small">Following</div>
                <div className="h5 mb-1">My Subscriptions</div>
                <div className="text-secondary small">{subCount} active subscription{subCount===1?"":"s"}</div>
              </div>
            </Link>
          </div>
          <div className="col-md-4">
            <Link to="/support" className="card h-100 text-decoration-none">
              <div className="card-body">
                <div className="text-secondary small">Help</div>
                <div className="h5 mb-1">Support</div>
                <div className="text-secondary small">Get assistance and resources.</div>
              </div>
            </Link>
          </div>
        </div>

        {/* Vendor snapshot */}
        {hasVendorProfile && (
          <div className="row g-3 mb-3">
            <div className="col-md-4">
              <div className="card h-100"><div className="card-body">
                <div className="text-secondary small">Listings</div>
                <div className="display-6 fw-bold">{mine.length}</div>
                <div className="text-secondary small">Recent items</div>
              </div></div>
            </div>
            <div className="col-md-4">
              <div className="card h-100"><div className="card-body">
                <div className="text-secondary small">Subscribers</div>
                <div className="display-6 fw-bold">{Number(vendorStats?.subscriptionStats?.total || 0)}</div>
                <div className="text-secondary small">Across your listings</div>
              </div></div>
            </div>
            <div className="col-md-4">
              <div className="card h-100"><div className="card-body">
                <div className="text-secondary small">MRR</div>
                <div className="display-6 fw-bold">
                  {(() => {
                    const entries = Object.entries(vendorStats?.salesTime?.monthly || {}).sort((a,b)=>a[0]>b[0]? -1:1);
                    const last = entries[0]?.[1]?.revenue || 0; return `R ${Number(last).toLocaleString()}`;
                  })()}
                </div>
                <div className="text-secondary small">Based on subscription pricing</div>
              </div></div>
            </div>
          </div>
        )}

        {/* DashBoardLayerSeven */}
        <DashBoardLayerSeven />
        <ReviewsWidget />
     </MasterLayout>
    </>
  );
};

export default Dashboard;
