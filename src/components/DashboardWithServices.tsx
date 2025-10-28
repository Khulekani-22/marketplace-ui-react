import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import TrendingNFTsOne from "./child/TrendingNFTsOne";

const DashboardWithServices = () => {
  const [showAllServices, setShowAllServices] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [categories, setCategories] = useState<string[]>([]);
  const navigate = useNavigate();

  const handleViewAll = () => {
    // Navigate to marketplace with all services
    navigate("/marketplace");
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
              {!showAllServices && (
                <button 
                  className="btn btn-primary btn-sm"
                  onClick={handleViewAll}
                >
                  View All Services
                </button>
              )}
            </div>
            <div className="card-body">
              {/* TrendingNFTsOne with limit of 12 when not showing all */}
              <DashboardServicesWrapper 
                showAll={showAllServices}
                query={query}
                onQueryChange={setQuery}
                category={category}
                onCategoryChange={setCategory}
                onCategoriesChange={setCategories}
              />
              
              {/* View All Button at bottom of services */}
              {!showAllServices && (
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
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Getting Started Info Card - Only show when not viewing all services */}
      {!showAllServices && (
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
      )}
    </div>
  );
};

// Wrapper component to handle service display logic
const DashboardServicesWrapper = ({ 
  showAll, 
  query, 
  onQueryChange, 
  category, 
  onCategoryChange, 
  onCategoriesChange 
}: { 
  showAll: boolean; 
  query: string;
  onQueryChange: (q: string) => void;
  category: string;
  onCategoryChange: (c: string) => void;
  onCategoriesChange: (cats: string[]) => void;
}) => {
  // This component wraps TrendingNFTsOne but limits display to 12 unless showAll is true
  return (
    <div className="dashboard-services-wrapper">
      <TrendingNFTsOne 
        query={query}
        onQueryChange={onQueryChange}
        category={category}
        onCategoryChange={onCategoryChange}
        onCategoriesChange={onCategoriesChange}
      />
      <style>{`
        /* Hide search and filter controls on dashboard */
        .dashboard-services-wrapper .mb-16.mt-8 {
          display: none !important;
        }
        
        /* Limit to first 12 services on dashboard */
        .dashboard-services-wrapper .tab-content .row.g-3 > div:nth-child(n+13) {
          display: none !important;
        }
        
        /* Hide loading text after content loads */
        .dashboard-services-wrapper .tab-pane .col-12.text-center {
          margin-bottom: 1rem;
        }
      `}</style>
    </div>
  );
};

export default DashboardWithServices;
