import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { auth } from "../firebase.js";
import { api } from "../lib/api";
import TrendingNFTsOne from "./child/TrendingNFTsOne";

interface StartupProfile {
  id?: string;
  name?: string;
  elevatorPitch?: string;
  productsServices?: string;
  categories?: string[];
  tags?: string[];
  contactEmail?: string;
  ownerUid?: string;
}

interface VendorProfile {
  vendorId?: string;
  name?: string;
  description?: string;
  categories?: string[];
  tags?: string[];
  contactEmail?: string;
  ownerUid?: string;
}

const AccessToMarketDashboard = () => {
  const [profiles, setProfiles] = useState<{ startup: StartupProfile | null; vendor: VendorProfile | null }>({ startup: null, vendor: null });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch startup and vendor profiles for current user with timeout and retry
  useEffect(() => {
  let timeoutId: ReturnType<typeof setTimeout>;
    let abortController = new AbortController();
    
    const fetchProfiles = async (retryCount = 0) => {
      try {
        setLoading(true);
        setError(null);
        
        const user = auth.currentUser;
        if (!user) {
          setLoading(false);
          return;
        }
        
        const email = (user.email || "").toLowerCase();
        const uid = user.uid;
        let startup = null;
        let vendor = null;

        // Set a timeout for the API calls
        const timeoutPromise = new Promise((_, reject) => {
          timeoutId = setTimeout(() => {
            reject(new Error('Request timeout - API calls taking too long'));
          }, 8000); // 8 second timeout
        });

        try {
          // Startup API call with timeout
          const startupPromise = api.get("/api/data/startups", { 
            signal: abortController.signal,
            timeout: 6000 
          }).then((r) => r.data || []);
          
          const sList = await Promise.race([startupPromise, timeoutPromise]);
          startup = (sList as any[]).find((s: any) => 
            (s.ownerUid && s.ownerUid === uid) || 
            ((s.contactEmail || s.email || "").toLowerCase() === email)
          ) || null;
        } catch (err) {
          console.warn('Failed to fetch startup data:', err);
        }

        try {
          // Vendor API call with timeout  
          const vendorPromise = api.get("/api/data/vendors", { 
            signal: abortController.signal,
            timeout: 6000 
          }).then((r) => r.data || []);
          
          const vList = await Promise.race([vendorPromise, timeoutPromise]);
          vendor = (vList as any[]).find((v: any) => 
            (v.ownerUid && v.ownerUid === uid) || 
            ((v.contactEmail || v.email || "").toLowerCase() === email)
          ) || null;
        } catch (err) {
          console.warn('Failed to fetch vendor data:', err);
        }

        setProfiles({ startup, vendor });
        setLoading(false);
        
      } catch (error: any) {
        console.error('Profile fetch error:', error);
        
        if (retryCount < 2 && !abortController.signal.aborted) {
          console.log(`Retrying profile fetch (attempt ${retryCount + 1})...`);
          setTimeout(() => fetchProfiles(retryCount + 1), 2000);
        } else {
          setError(error.message || 'Failed to load profile data');
          setLoading(false);
        }
      } finally {
        if (timeoutId) clearTimeout(timeoutId);
      }
    };

    fetchProfiles();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      abortController.abort();
    };
  }, []);

  // Handle category changes from TrendingNFTsOne
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
  };

  // Handle query changes from TrendingNFTsOne  
  const handleQueryChange = (query: string) => {
    setSearchQuery(query);
  };

  return (
    <>
      <div className='row gy-4'>
        {/* Loading State */}
        {loading && (
          <div className='col-12'>
            <div className="text-center py-5">
              <div className="spinner-border text-primary mb-3" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="text-muted">Loading your personalized dashboard...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className='col-12'>
            <div className="alert alert-warning text-center">
              <i className="bi bi-exclamation-triangle me-2"></i>
              <strong>Dashboard partially unavailable:</strong> {error}
              <div className="mt-2">
                <button 
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => window.location.reload()}
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header Section */}
        <div className='col-12 d-none'>
          <div className="d-flex align-items-center justify-content-between mb-4">
            <div>
              <h2 className="h4 mb-1">Access To Market</h2>
              <p className="text-muted mb-0">
                Discover services and solutions tailored to your needs
                {!loading && profiles.startup?.name && ` for ${profiles.startup.name}`}
              </p>
            </div>
            <Link to="/marketplace" className="btn btn-outline-primary">
              Full Marketplace
            </Link>
          </div>
        </div>

        {/* Personalization Info */}
        {!loading && auth.currentUser && profiles.startup && (
          <div className='col-12'>
            <div className="alert alert-info py-2 mb-3">
              <small>
                <strong>Personalized recommendations</strong> based on your startup profile: {profiles.startup.name}
                {!profiles.startup.categories?.length && !profiles.startup.tags?.length && (
                  <span className="text-muted"> • <Link to="/profile-startup" className="text-decoration-none">Complete your profile</Link> for better matches</span>
                )}
              </small>
            </div>
          </div>
        )}

        {/* TrendingNFTsOne Component with controlled props - Always show listings, profile data is optional */}
        <div className='col-12'>
          <TrendingNFTsOne 
            query={searchQuery}
            onQueryChange={handleQueryChange}
            category={selectedCategory}
            onCategoryChange={handleCategoryChange}
            onCategoriesChange={() => {}}
          />
        </div>

        {/* Quick Actions for non-authenticated users */}
        {!auth.currentUser && (
          <div className='col-12'>
            <div className="card p-4 text-center bg-light">
              <h5>Get Personalized Recommendations</h5>
              <p className="text-muted mb-3">
                Sign in and complete your startup profile to receive tailored service recommendations.
              </p>
              <div className="d-flex gap-2 justify-content-center">
                <Link to="/login" className="btn btn-primary">Sign In</Link>
                <Link to="/signup/startup" className="btn btn-outline-primary">Create Account</Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default AccessToMarketDashboard;
