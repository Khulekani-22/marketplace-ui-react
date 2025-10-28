// src/App.jsx
import React, { Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import RouteScrollToTop from "./helper/RouteScrollToTop";
import ErrorBoundary from "./components/ErrorBoundary.tsx";
import { AppSyncProvider } from "./context/AppSyncContext.tsx";
import { WalletProvider } from "./context/WalletContext.tsx";
import { NotificationsProvider } from "./context/NotificationsContext";
import LoginForm from "./components/LoginForm.tsx";
import PrivateRoute from "./components/PrivateRoute.tsx";
import AdminRoute from "./components/AdminRoute.tsx";
import VendorRoute from "./components/VendorRoute.tsx";

// React Query
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
const queryClient = new QueryClient();

// ============================================================================
// CLEANED UP: Only importing pages actually used in navigation and routes
// Removed 102 unused demo pages (UI components, charts, AI generators, etc.)
// See UNUSED_PAGES_CLEANUP.md for details
// ============================================================================

// Core Application Pages
const Dashboard = React.lazy(() => import("./pages/Dashboard.tsx"));
const DashboardDebug = React.lazy(() => import("./pages/DashboardDebug.tsx"));
const LandingPage = React.lazy(() => import("./pages/LandingPage.tsx"));
const ErrorPage = React.lazy(() => import("./pages/ErrorPage.tsx"));
const EmailPage = React.lazy(() => import("./pages/EmailPage.tsx"));
const NotificationPage = React.lazy(() => import("./pages/NotificationPage.tsx"));
const WalletPage = React.lazy(() => import("./pages/WalletPage.tsx"));

// Marketplace & Services
const Market1 = React.lazy(() => import("./pages/Market1.tsx"));
const MarketplacePage = React.lazy(() => import("./pages/MarketplacePage.tsx"));
const MarketplaceDetailsPage = React.lazy(() => import("./pages/MarketplaceDetailsPage.tsx"));

// Features
const MentorshipPage = React.lazy(() => import("./pages/MentorshipPage.tsx"));
const AccessToCapitalPage = React.lazy(() => import("./pages/AccessToCapitalPage.tsx"));
const MySubscriptionsPage = React.lazy(() => import("./pages/MySubscriptionsPage.tsx"));
const LmsPage = React.lazy(() => import("./pages/LmsPage.tsx"));
const LmsAdminPage = React.lazy(() => import("./pages/LmsAdminPage.tsx"));
const SloaneAcademyPage = React.lazy(() => import("./pages/SloaneAcademyPage.tsx"));
const SloaneAcademyAdminPage = React.lazy(() => import("./pages/SloaneAcademyAdminPage.tsx"));

// Vendor Pages
const VendorDashboardPage = React.lazy(() => import("./pages/VendorDashboardPage.tsx"));
const VendorAddListingPage = React.lazy(() => import("./pages/VendorAddListingPage.tsx"));
const VendorMyListings = React.lazy(() => import("./pages/VendorMyListings.tsx"));
const VendorProfilePage = React.lazy(() => import("./pages/VendorProfilePage.tsx"));
const VendorSignupPage = React.lazy(() => import("./pages/VendorSignupPage.tsx"));

// Startup Pages
const StartupProfilePage = React.lazy(() => import("./pages/StartupProfilePage.tsx"));
const StartupSignupPage = React.lazy(() => import("./pages/StartupSignupPage.tsx"));

// Admin Pages
const AuditLogsPage = React.lazy(() => import("./pages/AuditLogsPage.tsx"));
const UserRoleManagementPage = React.lazy(() => import("./pages/UserRoleManagementPage.tsx"));
const ListingsAdminPage = React.lazy(() => import("./pages/ListingsAdminPage.tsx"));
const VendorsAdminPage = React.lazy(() => import("./pages/VendorsAdminPage.tsx"));
const AdminWalletCreditsPage = React.lazy(() => import("./pages/AdminWalletCreditsPage.tsx"));
const AdminRtoRpoPage = React.lazy(() => import("./pages/AdminRtoRpoPage.jsx"));

// Data/Overview Pages
const DataOverview = React.lazy(() => import("./pages/DataOverview.tsx"));
const AllDataTable = React.lazy(() => import("./pages/AllDataTable.tsx"));

// OAuth
const OAuthConsent = React.lazy(() => import("./components/OAuth/OAuthConsent.jsx"));

function Fallback() {
  return (
    <div className="container py-4">
      <p>Loading…</p>
    </div>
  );
}

function App() {
  console.log("🎯 App component is rendering...");

  return (
    <QueryClientProvider client={queryClient}>
      <RouteScrollToTop />
      <ErrorBoundary>
        <Suspense fallback={<Fallback />}>
          <AppSyncProvider>
            <WalletProvider>
              <NotificationsProvider>
                <Routes>
                  {/* ============================================ */}
                  {/* CLEANED UP ROUTES - Only essential pages    */}
                  {/* Removed 70+ demo/unused routes             */}
                  {/* ============================================ */}

                  {/* Auth */}
                  <Route path="/login" element={<LoginForm />} />

                  {/* Core Pages */}
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/dashboard-debug" element={<DashboardDebug />} />
                  <Route path="/notification" element={<NotificationPage />} />
                  <Route path="/wallet" element={<WalletPage />} />
                  <Route
                    path="/email"
                    element={
                      <PrivateRoute>
                        <EmailPage />
                      </PrivateRoute>
                    }
                  />

                  {/* Marketplace & Services */}
                  <Route path="/market1" element={<Market1 />} />
                  <Route path="/marketplace" element={<MarketplacePage />} />
                  <Route path="/marketplace-details" element={<MarketplaceDetailsPage />} />

                  {/* Features */}
                  <Route path="/mentorship" element={<MentorshipPage />} />
                  <Route path="/access-capital" element={<AccessToCapitalPage />} />
                  <Route
                    path="/subscriptions"
                    element={
                      <PrivateRoute>
                        <MySubscriptionsPage />
                      </PrivateRoute>
                    }
                  />
                  <Route path="/lms" element={<LmsPage />} />
                  <Route
                    path="/lms-admin"
                    element={
                      <PrivateRoute>
                        <LmsAdminPage />
                      </PrivateRoute>
                    }
                  />
                  <Route path="/sloane-academy" element={<SloaneAcademyPage />} />
                  <Route
                    path="/sloane-academy-admin"
                    element={
                      <AdminRoute>
                        <SloaneAcademyAdminPage />
                      </AdminRoute>
                    }
                  />

                  {/* Vendor Pages */}
                  <Route path="/signup/vendor" element={<VendorSignupPage />} />
                  <Route
                    path="/vendor-home"
                    element={
                      <VendorRoute>
                        <Suspense fallback={<Fallback />}>
                          <VendorDashboardPage />
                        </Suspense>
                      </VendorRoute>
                    }
                  />
                  <Route
                    path="/listings-vendors"
                    element={
                      <VendorRoute>
                        <VendorAddListingPage />
                      </VendorRoute>
                    }
                  />
                  <Route
                    path="/listings-vendors-mine"
                    element={
                      <VendorRoute>
                        <VendorMyListings />
                      </VendorRoute>
                    }
                  />
                  <Route
                    path="/profile-vendor"
                    element={
                      <VendorRoute>
                        <VendorProfilePage />
                      </VendorRoute>
                    }
                  />

                  {/* Startup Pages */}
                  <Route path="/signup/startup" element={<StartupSignupPage />} />
                  <Route path="/profile-startup" element={<StartupProfilePage />} />

                  {/* Admin Pages */}
                  <Route
                    path="/audit-logs"
                    element={
                      <AdminRoute>
                        <AuditLogsPage />
                      </AdminRoute>
                    }
                  />
                  <Route
                    path="/admin/users"
                    element={
                      <AdminRoute>
                        <UserRoleManagementPage />
                      </AdminRoute>
                    }
                  />
                  <Route
                    path="/listings-admin"
                    element={
                      <AdminRoute>
                        <ListingsAdminPage />
                      </AdminRoute>
                    }
                  />
                  <Route
                    path="/profile-vendor-admin"
                    element={
                      <AdminRoute>
                        <VendorsAdminPage />
                      </AdminRoute>
                    }
                  />
                  <Route
                    path="/admin/wallet-credits"
                    element={
                      <AdminRoute>
                        <AdminWalletCreditsPage />
                      </AdminRoute>
                    }
                  />
                  <Route
                    path="/admin/rto-rpo"
                    element={
                      <AdminRoute>
                        <AdminRtoRpoPage />
                      </AdminRoute>
                    }
                  />
                  <Route
                    path="/admin/dashboard"
                    element={
                      <AdminRoute>
                        <Dashboard />
                      </AdminRoute>
                    }
                  />

                  {/* Data/Overview Pages */}
                  <Route path="/overview" element={<DataOverview />} />
                  <Route path="/data" element={<AllDataTable />} />

                  {/* OAuth */}
                  <Route path="/oauth/authorize" element={<OAuthConsent />} />

                  {/* Legacy redirects */}
                  <Route path="/index-7" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/profile" element={<Navigate to="/profile-vendor" replace />} />

                  {/* 404 */}
                  <Route path="*" element={<ErrorPage />} />
                </Routes>
              </NotificationsProvider>
            </WalletProvider>
          </AppSyncProvider>
        </Suspense>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}

export default App;
