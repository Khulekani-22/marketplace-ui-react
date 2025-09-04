import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import DashBoardLayerSeven from "../components/DashBoardLayerSeven";
import ReviewsWidget from "../components/ReviewsWidget";
import { useVendor } from "../context/VendorContext";
import { Link } from "react-router-dom";
 


const Dashboard = () => {
  const { vendor } = useVendor?.() || { vendor: null };
  const role = typeof window !== "undefined" ? sessionStorage.getItem("role") : null;
  const isAdmin = role === "admin";
  const hasVendorProfile = !!vendor?.vendorId;
  const isApproved = !!vendor?.isApproved;

  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title='Vendor' />

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

        {/* DashBoardLayerSeven */}
        <DashBoardLayerSeven />
        <ReviewsWidget />
      </MasterLayout>
    </>
  );
};

export default Dashboard;
