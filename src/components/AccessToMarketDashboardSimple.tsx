import { Link } from "react-router-dom";

const AccessToMarketDashboardSimple = () => {
  return (
    <div className="dashboard-body">
      {/* Welcome Header */}
      <div className="row gy-4 mb-4">
        <div className="col-12">
          <div className="card">
            <div className="card-body p-4">
              <h3 className="mb-2">🎉 Welcome to the Marketplace!</h3>
              <p className="text-secondary mb-0">
                Your dashboard is loading. Browse our services and connect with vendors.
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
          <Link to="/startup-profiles" className="card text-decoration-none h-100 hover-shadow">
            <div className="card-body text-center p-4">
              <div className="mb-3">
                <i className="ph ph-rocket-launch" style={{ fontSize: '3rem', color: '#F59E0B' }}></i>
              </div>
              <h5 className="mb-2">Startup Directory</h5>
              <p className="text-secondary mb-0 small">View ecosystem startups</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Info Card */}
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
                <Link to="/marketplace" className="btn btn-primary me-2">
                  Explore Marketplace
                </Link>
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

export default AccessToMarketDashboardSimple;
