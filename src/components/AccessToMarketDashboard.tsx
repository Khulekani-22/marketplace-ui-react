import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { auth } from "../lib/firebase";
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
  const [availableCategories, setAvailableCategories] = useState<string[]>(["All"]);

  const tenantHeader = useMemo(() => sessionStorage.getItem("tenantId") || "vendor", []);

  // Fetch startup and vendor profiles for current user
  useEffect(() => {
    (async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;
        const email = (user.email || "").toLowerCase();
        const uid = user.uid;
        let startup = null;
        let vendor = null;
        try {
          const sList = await api.get("/api/data/startups").then((r) => r.data || []);
          startup = sList.find((s: any) => (s.ownerUid && s.ownerUid === uid) || ((s.contactEmail || s.email || "").toLowerCase() === email)) || null;
        } catch {}
        try {
          const vList = await api.get("/api/data/vendors").then((r) => r.data || []);
          vendor = vList.find((v: any) => (v.ownerUid && v.ownerUid === uid) || ((v.contactEmail || v.email || "").toLowerCase() === email)) || null;
        } catch {}
        setProfiles({ startup, vendor });
      } catch {}
    })();
  }, []);

  // Handle category changes from TrendingNFTsOne
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
  };

  // Handle query changes from TrendingNFTsOne  
  const handleQueryChange = (query: string) => {
    setSearchQuery(query);
  };

  // Handle categories list update from TrendingNFTsOne
  const handleCategoriesChange = (categories: string[]) => {
    setAvailableCategories(categories);
  };

  return (
    <>
      <div className='row gy-4'>
        {/* Header Section */}
        <div className='col-12'>
          <div className="d-flex align-items-center justify-content-between mb-4">
            <div>
              <h2 className="h4 mb-1">Access To Market</h2>
              <p className="text-muted mb-0">
                Discover services and solutions tailored to your needs
                {profiles.startup?.name && ` for ${profiles.startup.name}`}
              </p>
            </div>
            <Link to="/marketplace" className="btn btn-outline-primary">
              Full Marketplace
            </Link>
          </div>
        </div>

        {/* Personalization Info */}
        {auth.currentUser && profiles.startup && (
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

        {/* TrendingNFTsOne Component with controlled props */}
        <div className='col-12'>
          <TrendingNFTsOne 
            query={searchQuery}
            onQueryChange={handleQueryChange}
            category={selectedCategory}
            onCategoryChange={handleCategoryChange}
            onCategoriesChange={handleCategoriesChange}
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
