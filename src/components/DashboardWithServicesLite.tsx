import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useAppSync } from "../context/useAppSync";

// Normalize service data
const normalize = (service = {}) => {
  return {
    ...service,
    id: service.id,
    title: service.title || "Untitled",
    vendor: service.vendor ?? service.vendorName ?? "Unknown",
    imageUrl: service.imageUrl ?? service.thumbnail ?? "",
    category: service.category ?? service.categoryId ?? "",
    rating: typeof service.rating === "number" ? service.rating : Number(service.rating || 0),
    price: Math.max(0, Number(service.price || 0)),
    status: (service.status ?? "approved").toString().toLowerCase(),
  };
};

const DashboardWithServicesLite = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { appData } = useAppSync();

  // Load services ONCE on mount
  const loadServices = useCallback(async () => {
    try {
      setLoading(true);
      
      // Try API first
      const { data } = await api.get('/api/data/services', {
        params: { page: 1, pageSize: 12 },
        suppressToast: true,
        suppressErrorLog: true,
        timeout: 8000,
      });
      
      const items = Array.isArray(data?.items) ? data.items : [];
      const approved = items
        .map(normalize)
        .filter(s => s.status === "approved")
        .slice(0, 12);
      
      setServices(approved);
    } catch (error) {
      console.warn('[Dashboard] API failed, using appData fallback', error?.message);
      
      // Fallback to appData
      const fallback = Array.isArray(appData?.services) ? appData.services : [];
      const approved = fallback
        .map(normalize)
        .filter(s => s.status === "approved")
        .slice(0, 12);
      
      setServices(approved);
    } finally {
      setLoading(false);
    }
  }, []); // No dependencies - load only once!

  // FIX: Remove loadServices from dependency array to prevent infinite loop
  // Even though loadServices has empty deps, including it here causes re-render cycles
  useEffect(() => {
    loadServices();
  }, []); // Empty array - load only once on mount

  const handleViewAll = () => {
    navigate("/marketplace");
  };

  const handleViewDetails = (serviceId: string) => {
    navigate(`/marketplace-details?id=${serviceId}`);
  };

  return (
    <div className="dashboard-body">
      {/* Welcome Header */}
      <div className="row gy-4 mb-4">
        <div className="col-12">
          <div className="card">
            <div className="card-body p-4">
              <h3 className="mb-2">🎉 Welcome to the Marketplace!</h3>
              <p className="text-secondary mb-0">
                Browse our featured services below or explore the full marketplace.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="row gy-4 mb-4">
        <div className="col-md-4">
          <Link to="/vendor-my-listings" className="card text-decoration-none h-100 hover-shadow">
            <div className="card-body text-center p-4">
              <div className="mb-3">
                <i className="ph ph-briefcase" style={{ fontSize: '3rem', color: '#487FFF' }}></i>
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
                <i className="ph ph-storefront" style={{ fontSize: '3rem', color: '#10B981' }}></i>
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
                <i className="ph ph-wallet" style={{ fontSize: '3rem', color: '#F59E0B' }}></i>
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
              <button 
                className="btn btn-primary btn-sm"
                onClick={handleViewAll}
              >
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
                  <i className="ph ph-storefront mb-3" style={{ fontSize: '3rem', color: '#ccc' }}></i>
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
                        <div className="card h-100 border hover-shadow" style={{ cursor: 'pointer' }}>
                          <div className="card-body p-3">
                            <div className="row g-2">
                              <div className="col-4">
                                <img
                                  src={service.imageUrl}
                                  alt={service.title}
                                  className="img-fluid rounded"
                                  style={{ maxHeight: '80px', objectFit: 'cover', width: '100%' }}
                                  onError={(e) => {
                                    e.currentTarget.src = 'https://via.placeholder.com/150?text=No+Image';
                                  }}
                                />
                              </div>
                              <div className="col-8">
                                <h6 className="mb-1 text-truncate">{service.title}</h6>
                                <p className="text-muted small mb-2 text-truncate">
                                  {service.vendor}
                                  {service.category && (
                                    <span className="ms-1">| {service.category}</span>
                                  )}
                                </p>
                                <div className="d-flex align-items-center justify-content-between">
                                  <div className="d-flex align-items-center gap-1">
                                    <span className="text-warning">★</span>
                                    <small>{service.rating.toFixed(1)}</small>
                                  </div>
                                  {service.price > 0 && (
                                    <small className="text-primary fw-semibold">
                                      R {service.price.toLocaleString()}
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
                      <button 
                        className="btn btn-lg btn-primary"
                        onClick={handleViewAll}
                      >
                        <i className="ph ph-arrow-right me-2"></i>
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

      {/* Getting Started Info Card */}
      <div className="row gy-4">
        <div className="col-12">
          <div className="card border-primary">
            <div className="card-body p-4">
              <h5 className="mb-3">✨ Getting Started</h5>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <h6>📝 Create Listings</h6>
                  <p className="text-secondary small mb-0">
                    Add your services to reach potential clients in the marketplace.
                  </p>
                </div>
                <div className="col-md-6 mb-3">
                  <h6>🔍 Discover Services</h6>
                  <p className="text-secondary small mb-0">
                    Browse offerings from vendors across various categories.
                  </p>
                </div>
                <div className="col-md-6 mb-3">
                  <h6>🤝 Connect</h6>
                  <p className="text-secondary small mb-0">
                    Network with startups and vendors in our ecosystem.
                  </p>
                </div>
                <div className="col-md-6 mb-3">
                  <h6>💼 Manage</h6>
                  <p className="text-secondary small mb-0">
                    Track your listings, subscriptions, and marketplace activity.
                  </p>
                </div>
              </div>
              <div className="mt-3">
                <button 
                  onClick={handleViewAll}
                  className="btn btn-primary me-2"
                >
                  View All Services
                </button>
                <Link to="/vendor-my-listings" className="btn btn-outline-primary">
                  Manage Listings
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardWithServicesLite;
