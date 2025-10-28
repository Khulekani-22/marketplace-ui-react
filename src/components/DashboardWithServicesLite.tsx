import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useAppSync } from "../context/useAppSync";

// Normalize service data
const normalize = (service = {}) => {
  const ratingNum = typeof service.rating === "number"
    ? service.rating
    : Number(service.rating || 0);

  const priceNum = Math.max(0, Number(service.price || 0));

  const statusStr = (service.status ?? "approved").toString().toLowerCase();

  return {
    ...service,
    id: service.id, // keep as-is; we'll filter falsy IDs later
    title: service.title || "Untitled",
    vendor: service.vendor ?? service.vendorName ?? "Unknown",
    imageUrl: service.imageUrl ?? service.thumbnail ?? "",
    category: service.category ?? service.categoryId ?? "",
    rating: Number.isFinite(ratingNum) ? ratingNum : 0,
    price: Number.isFinite(priceNum) ? priceNum : 0,
    status: statusStr,
  };
};

const DashboardWithServicesLite = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { appData } = useAppSync();

  useEffect(() => {
    const ac = new AbortController();
    let mounted = true;

    const load = async () => {
      try {
        setLoading(true);

        // Try API first
        const { data } = await api.get("/api/data/services", {
          params: { page: 1, pageSize: 12 },
          suppressToast: true,
          suppressErrorLog: true,
          timeout: 8000,
          signal: ac.signal, // axios supports AbortController in recent versions
        });

        const items = Array.isArray(data?.items) ? data.items : [];
        const approved = items
          .map(normalize)
          .filter(s => s.status === "approved" && s.id) // ensure stable key
          .slice(0, 12);

        if (mounted) setServices(approved);
      } catch (error) {
        if (ac.signal.aborted) return;
        console.warn("[Dashboard] API failed, using appData fallback", error?.message);

        // Fallback to appData
        const fallback = Array.isArray(appData?.services) ? appData.services : [];
        const approved = fallback
          .map(normalize)
          .filter(s => s.status === "approved" && s.id)
          .slice(0, 12);

        if (mounted) setServices(approved);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();

    return () => {
      mounted = false;
      ac.abort();
    };
    // We intentionally run this ONCE on mount. If you want it to refresh when appData changes,
    // add `appData` to the deps array.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleViewAll = () => {
    navigate("/marketplace");
  };

  const handleViewDetails = (serviceId) => {
    navigate(`/marketplace-details?id=${serviceId}`);
  };

  return (
    <div className="dashboard-body">
      {/* Quick Actions */}
      <div className="row gy-4 mb-4">
        <div className="col-md-4">
          <Link to="/vendor-my-listings" className="card text-decoration-none h-100 hover-shadow">
            <div className="card-body text-center p-4">
              <div className="mb-3">
                <i className="ph ph-briefcase" style={{ fontSize: "3rem" }} />
              </div>
              <h5 className="mb-2">My Listings</h5>
              <p className="text-secondary mb-0 small">Manage your services and offerings</p>
            </div>
          </Link>
        </div>

        <div className="col-md-4">
          <Link to="/marketplace" className="card text-decoration-none h-100 hover-shadow">
            <div className="card-body text-center p-4">
              <div className="mb-3">
                <i className="ph ph-storefront" style={{ fontSize: "3rem" }} />
              </div>
              <h5 className="mb-2">Browse Services</h5>
              <p className="text-secondary mb-0 small">Explore marketplace offerings</p>
            </div>
          </Link>
        </div>

        <div className="col-md-4">
          <Link to="/wallet" className="card text-decoration-none h-100 hover-shadow">
            <div className="card-body text-center p-4">
              <div className="mb-3">
                <i className="ph ph-wallet" style={{ fontSize: "3rem" }} />
              </div>
              <h5 className="mb-2">My Wallet</h5>
              <p className="text-secondary mb-0 small">Manage your credits</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Featured Services Section */}
      <div className="row gy-4 mb-4">
        <div className="col-12">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Featured Services</h5>
              <button className="btn btn-primary btn-sm" onClick={handleViewAll}>
                View All Services
              </button>
            </div>
            <div className="card-body">
              {loading && (
                <div className="text-center py-5 text-secondary">
                  <div className="spinner-border mb-3" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <div>Loading services...</div>
                </div>
              )}

              {!loading && services.length === 0 && (
                <div className="text-center py-5">
                  <i className="ph ph-storefront mb-3" style={{ fontSize: "3rem", color: "#ccc" }} />
                  <p className="text-secondary">No services available yet.</p>
                  <Link to="/marketplace" className="btn btn-primary">
                    Explore Marketplace
                  </Link>
                </div>
              )}

              {!loading && services.length > 0 && (
                <>
                  <div className="row g-3">
                    {services.map((service) => (
                      <div className="col-12 col-md-6 col-lg-4" key={service.id}>
                        <div className="card h-100 border hover-shadow" style={{ cursor: "pointer" }}>
                          <div className="card-body p-3">
                            <div className="row g-2">
                              <div className="col-4">
                                <img
                                  src={service.imageUrl}
                                  alt={service.title}
                                  className="img-fluid rounded"
                                  style={{ maxHeight: "80px", objectFit: "cover", width: "100%" }}
                                  onError={(e) => {
                                    if (e.currentTarget.src.includes("via.placeholder.com")) return;
                                    e.currentTarget.src =
                                      "https://via.placeholder.com/150?text=No+Image";
                                  }}
                                />
                              </div>
                              <div className="col-8">
                                <h6 className="mb-1 text-truncate">{service.title}</h6>
                                <p className="text-muted small mb-2 text-truncate">
                                  {service.vendor}
                                  {service.category && <span className="ms-1">| {service.category}</span>}
                                </p>
                                <div className="d-flex align-items-center justify-content-between">
                                  <div className="d-flex align-items-center gap-1">
                                    <span className="text-warning">★</span>
                                    <small>{Number(service.rating).toFixed(1)}</small>
                                  </div>
                                  {Number(service.price) > 0 && (
                                    <small className="text-primary fw-semibold">
                                      R {Number(service.price).toLocaleString()}
                                    </small>
                                  )}
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => handleViewDetails(service.id)}
                              className="btn btn-sm btn-primary w-100 mt-2"
                            >
                              View Details
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* View All Button at bottom */}
                  <div className="row mt-4">
                    <div className="col-12 text-center">
                      <button className="btn btn-lg btn-primary" onClick={handleViewAll}>
                        <i className="ph ph-arrow-right me-2" />
                        View All Services in Marketplace
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardWithServicesLite;
