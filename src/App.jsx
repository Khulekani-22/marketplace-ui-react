// src/App.jsx
import React, { Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import RouteScrollToTop from "./helper/RouteScrollToTop";
import { AppSyncProvider } from "./context/AppSyncContext.tsx";

// Shell / guards
import ErrorBoundary from "./components/ErrorBoundary.tsx";
import PrivateRoute from "./components/PrivateRoute.tsx";
import AdminRoute from "./components/AdminRoute.tsx";
import VendorRoute from "./components/VendorRoute.tsx";
import LoginForm from "./components/LoginForm.tsx";
import VendorSignupPage from "./pages/VendorSignupPage.tsx";

import { lazyWithRetry } from "./utils/lazyWithRetry";

// --- Lazy pages ---
const Dashboard = lazyWithRetry(() => import("./pages/Dashboard.tsx"));
const LandingPage = React.lazy(() => import("./pages/LandingPage.tsx"));
const HomePageTwo = React.lazy(() => import("./pages/HomePageTwo.tsx"));
const HomePageThree = React.lazy(() => import("./pages/HomePageThree.tsx"));
const HomePageFour = React.lazy(() => import("./pages/HomePageFour.tsx"));
const HomePageFive = React.lazy(() => import("./pages/HomePageFive.tsx"));
const HomePageSix = React.lazy(() => import("./pages/HomePageSix.tsx"));
// NOTE: /index-7 route is not mounted; we redirect below
const HomePageEight = React.lazy(() => import("./pages/HomePageEight.tsx"));
const HomePageNine = React.lazy(() => import("./pages/HomePageNine.tsx"));
const HomePageTen = React.lazy(() => import("./pages/HomePageTen.tsx"));
const HomePageEleven = React.lazy(() => import("./pages/HomePageEleven.tsx"));

const EmailPage = React.lazy(() => import("./pages/EmailPage.tsx"));
const AddUserPage = React.lazy(() => import("./pages/AddUserPage.tsx"));
const AlertPage = React.lazy(() => import("./pages/AlertPage.tsx"));
const AssignRolePage = React.lazy(() => import("./pages/AssignRolePage.tsx"));
const AvatarPage = React.lazy(() => import("./pages/AvatarPage.tsx"));
const BadgesPage = React.lazy(() => import("./pages/BadgesPage.tsx"));
const ButtonPage = React.lazy(() => import("./pages/ButtonPage.tsx"));
const CalendarMainPage = React.lazy(() => import("./pages/CalendarMainPage.tsx"));
const CardPage = React.lazy(() => import("./pages/CardPage.tsx"));
const CarouselPage = React.lazy(() => import("./pages/CarouselPage.tsx"));
const ChatMessagePage = React.lazy(() => import("./pages/ChatMessagePage.tsx"));
const ChatProfilePage = React.lazy(() => import("./pages/ChatProfilePage.tsx"));
const CodeGeneratorNewPage = React.lazy(() => import("./pages/CodeGeneratorNewPage.tsx"));
const CodeGeneratorPage = React.lazy(() => import("./pages/CodeGeneratorPage.tsx"));
const ColorsPage = React.lazy(() => import("./pages/ColorsPage.tsx"));
const ColumnChartPage = React.lazy(() => import("./pages/ColumnChartPage.tsx"));
const CompanyPage = React.lazy(() => import("./pages/CompanyPage.tsx"));
const CurrenciesPage = React.lazy(() => import("./pages/CurrenciesPage.tsx"));
const DropdownPage = React.lazy(() => import("./pages/DropdownPage.tsx"));
const ErrorPage = React.lazy(() => import("./pages/ErrorPage.tsx"));
const FaqPage = React.lazy(() => import("./pages/FaqPage.tsx"));
const ForgotPasswordPage = React.lazy(() => import("./pages/ForgotPasswordPage.tsx"));
const FormLayoutPage = React.lazy(() => import("./pages/FormLayoutPage.tsx"));
const FormValidationPage = React.lazy(() => import("./pages/FormValidationPage.tsx"));
const FormPage = React.lazy(() => import("./pages/FormPage.tsx"));
const GalleryPage = React.lazy(() => import("./pages/GalleryPage.tsx"));
const ImageGeneratorPage = React.lazy(() => import("./pages/ImageGeneratorPage.tsx"));
const ImageUploadPage = React.lazy(() => import("./pages/ImageUploadPage.tsx"));
const InvoiceAddPage = React.lazy(() => import("./pages/InvoiceAddPage.tsx"));
const InvoiceEditPage = React.lazy(() => import("./pages/InvoiceEditPage.tsx"));
const InvoiceListPage = React.lazy(() => import("./pages/InvoiceListPage.tsx"));
const InvoicePreviewPage = React.lazy(() => import("./pages/InvoicePreviewPage.tsx"));
const KanbanPage = React.lazy(() => import("./pages/KanbanPage.tsx"));
const LanguagePage = React.lazy(() => import("./pages/LanguagePage.tsx"));
const LineChartPage = React.lazy(() => import("./pages/LineChartPage.tsx"));
const ListPage = React.lazy(() => import("./pages/ListPage.tsx"));
const MarketplaceDetailsPage = React.lazy(() => import("./pages/MarketplaceDetailsPage.tsx"));
const MarketplacePage = React.lazy(() => import("./pages/MarketplacePage.tsx"));
const NotificationAlertPage = React.lazy(() => import("./pages/NotificationAlertPage.tsx"));
const NotificationPage = React.lazy(() => import("./pages/NotificationPage.tsx"));
const PaginationPage = React.lazy(() => import("./pages/PaginationPage.tsx"));
const PaymentGatewayPage = React.lazy(() => import("./pages/PaymentGatewayPage.tsx"));
const PieChartPage = React.lazy(() => import("./pages/PieChartPage.tsx"));
const PortfolioPage = React.lazy(() => import("./pages/PortfolioPage.tsx"));
const PricingPage = React.lazy(() => import("./pages/PricingPage.tsx"));
const ProgressPage = React.lazy(() => import("./pages/ProgressPage.tsx"));
const RadioPage = React.lazy(() => import("./pages/RadioPage.tsx"));
const RoleAccessPage = React.lazy(() => import("./pages/RoleAccessPage.tsx"));
const SignInPage = React.lazy(() => import("./pages/SignInPage.tsx"));
const SignUpPage = React.lazy(() => import("./pages/SignUpPage.tsx"));
const StartupSignupPage = React.lazy(() => import("./pages/StartupSignupPage.tsx"));
const StarRatingPage = React.lazy(() => import("./pages/StarRatingPage.tsx"));
const StarredPage = React.lazy(() => import("./pages/StarredPage.tsx"));
const SwitchPage = React.lazy(() => import("./pages/SwitchPage.tsx"));
const TableBasicPage = React.lazy(() => import("./pages/TableBasicPage.tsx"));
const TableDataPage = React.lazy(() => import("./pages/TableDataPage.tsx"));
const TabsPage = React.lazy(() => import("./pages/TabsPage.tsx"));
const TagsPage = React.lazy(() => import("./pages/TagsPage.tsx"));
const TermsConditionPage = React.lazy(() => import("./pages/TermsConditionPage.tsx"));
const TextGeneratorNewPage = React.lazy(() => import("./pages/TextGeneratorNewPage.tsx"));
const TextGeneratorPage = React.lazy(() => import("./pages/TextGeneratorPage.tsx"));
const ThemePage = React.lazy(() => import("./pages/ThemePage.tsx"));
const TooltipPage = React.lazy(() => import("./pages/TooltipPage.tsx"));
const TypographyPage = React.lazy(() => import("./pages/TypographyPage.tsx"));
const UsersGridPage = React.lazy(() => import("./pages/UsersGridPage.tsx"));
const UsersListPage = React.lazy(() => import("./pages/UsersListPage.tsx"));
const ViewDetailsPage = React.lazy(() => import("./pages/ViewDetailsPage.tsx"));
const VideoGeneratorPage = React.lazy(() => import("./pages/VideoGeneratorPage.tsx"));
const VideosPage = React.lazy(() => import("./pages/VideosPage.tsx"));
const ViewProfilePage = React.lazy(() => import("./pages/ViewProfilePage.tsx"));
const VoiceGeneratorPage = React.lazy(() => import("./pages/VoiceGeneratorPage.tsx"));
const WalletPage = React.lazy(() => import("./pages/WalletPage.tsx"));
const WidgetsPage = React.lazy(() => import("./pages/WidgetsPage.tsx"));
const WizardPage = React.lazy(() => import("./pages/WizardPage.tsx"));
const AuditLogsPage = React.lazy(() => import("./pages/AuditLogsPage.tsx"));
const UserRoleManagementPage = React.lazy(() => import("./pages/UserRoleManagementPage.tsx"));
const MySubscriptionsPage = React.lazy(() => import("./pages/MySubscriptionsPage.tsx"));

// data views (these were missing before)
const AllDataTable = React.lazy(() => import("./pages/AllDataTable.tsx"));
const DataOverview = React.lazy(() => import("./pages/DataOverview.tsx"));
const Market1 = React.lazy(() => import("./pages/Market1.tsx"));

// features
const LmsPage = React.lazy(() => import("./pages/LmsPage.tsx"));
const LmsAdminPage = React.lazy(() => import("./pages/LmsAdminPage.tsx"));
const ListingsAdminPage = React.lazy(() => import("./pages/ListingsAdminPage.tsx"));
const VendorAddListingPage = React.lazy(() => import("./pages/VendorAddListingPage.tsx"));
const VendorMyListings = React.lazy(() => import("./pages/VendorMyListings.tsx"));
const VendorProfilePage = React.lazy(() => import("./pages/VendorProfilePage.tsx"));
const VendorsAdminPage = React.lazy(() => import("./pages/VendorsAdminPage.tsx"));
const StartupProfilePage = React.lazy(() => import("./pages/StartupProfilePage.tsx"));
const VendorDashboardPage = React.lazy(() => import("./pages/VendorDashboardPage.tsx"));



function Fallback() {
  return (
    <div className="container py-4">
      <p>Loading…</p>
    </div>
  );
}

export default function App() {
  return (
    <>
      <RouteScrollToTop />
      <ErrorBoundary>
        <Suspense fallback={<Fallback />}>
          <AppSyncProvider>
          <Routes>
            {/* auth */}
            <Route path="/login" element={<LoginForm />} />

            {/* protected */}
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/lms-admin"
              element={
                <PrivateRoute>
                  <LmsAdminPage />
                </PrivateRoute>
              }
            />

            {/* public homes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/index-2" element={<HomePageTwo />} />
            <Route path="/index-3" element={<HomePageThree />} />
            <Route path="/index-4" element={<HomePageFour />} />
            <Route path="/index-5" element={<HomePageFive />} />
            <Route path="/index-6" element={<HomePageSix />} />
            {/* /index-7 redirects */}
            <Route path="/index-8" element={<HomePageEight />} />
            <Route path="/index-9" element={<HomePageNine />} />
            <Route path="/index-10" element={<HomePageTen />} />
            <Route path="/index-11" element={<HomePageEleven />} />

            {/* SL samples */}
            <Route path="/add-user" element={<AddUserPage />} />
            <Route path="/alert" element={<AlertPage />} />
            <Route path="/assign-role" element={<AssignRolePage />} />
            <Route path="/avatar" element={<AvatarPage />} />
            <Route path="/badges" element={<BadgesPage />} />
            <Route path="/button" element={<ButtonPage />} />
            <Route path="/calendar-main" element={<CalendarMainPage />} />
            <Route path="/calendar" element={<CalendarMainPage />} />
            <Route path="/card" element={<CardPage />} />
            <Route path="/carousel" element={<CarouselPage />} />
            <Route path="/chat-message" element={<ChatMessagePage />} />
            <Route path="/chat-profile" element={<ChatProfilePage />} />
            <Route path="/code-generator" element={<CodeGeneratorPage />} />
            <Route path="/code-generator-new" element={<CodeGeneratorNewPage />} />
            <Route path="/colors" element={<ColorsPage />} />
            <Route path="/column-chart" element={<ColumnChartPage />} />
            <Route path="/company" element={<CompanyPage />} />
            <Route path="/currencies" element={<CurrenciesPage />} />
            <Route path="/dropdown" element={<DropdownPage />} />
            <Route
              path="/email"
              element={
                <PrivateRoute>
                  <EmailPage />
                </PrivateRoute>
              }
            />
            <Route path="/faq" element={<FaqPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/form-layout" element={<FormLayoutPage />} />
            <Route path="/form-validation" element={<FormValidationPage />} />
            <Route path="/form" element={<FormPage />} />
            <Route path="/gallery" element={<GalleryPage />} />
            <Route path="/image-generator" element={<ImageGeneratorPage />} />
            <Route path="/image-upload" element={<ImageUploadPage />} />
            <Route path="/invoice-add" element={<InvoiceAddPage />} />
            <Route path="/invoice-edit" element={<InvoiceEditPage />} />
            <Route path="/invoice-list" element={<InvoiceListPage />} />
            <Route path="/invoice-preview" element={<InvoicePreviewPage />} />
            <Route path="/kanban" element={<KanbanPage />} />
            <Route path="/language" element={<LanguagePage />} />
            <Route path="/line-chart" element={<LineChartPage />} />
            <Route path="/list" element={<ListPage />} />
            <Route path="/marketplace-details" element={<MarketplaceDetailsPage />} />
            <Route path="/marketplace" element={<MarketplacePage />} />
            <Route
              path="/subscriptions"
              element={
                <PrivateRoute>
                  <MySubscriptionsPage />
                </PrivateRoute>
              }
            />
            <Route path="/notification-alert" element={<NotificationAlertPage />} />
            <Route path="/notification" element={<NotificationPage />} />
            <Route path="/pagination" element={<PaginationPage />} />
            <Route path="/payment-gateway" element={<PaymentGatewayPage />} />
            <Route path="/pie-chart" element={<PieChartPage />} />
            <Route path="/portfolio" element={<PortfolioPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/progress" element={<ProgressPage />} />
            <Route path="/radio" element={<RadioPage />} />
            <Route path="/role-access" element={<RoleAccessPage />} />
            <Route path="/sign-in" element={<SignInPage />} />
            <Route path="/sign-up" element={<SignUpPage />} />
            <Route path="/signup/startup" element={<StartupSignupPage />} />
            <Route path="/star-rating" element={<StarRatingPage />} />
            <Route path="/starred" element={<StarredPage />} />
            <Route path="/switch" element={<SwitchPage />} />
            <Route path="/table-basic" element={<TableBasicPage />} />
            <Route path="/table-data" element={<TableDataPage />} />
            <Route path="/tabs" element={<TabsPage />} />
            <Route path="/tags" element={<TagsPage />} />
            <Route path="/terms-condition" element={<TermsConditionPage />} />
            <Route path="/text-generator-new" element={<TextGeneratorNewPage />} />
            <Route path="/text-generator" element={<TextGeneratorPage />} />
            <Route path="/theme" element={<ThemePage />} />
            <Route path="/tooltip" element={<TooltipPage />} />
            <Route path="/typography" element={<TypographyPage />} />
            <Route path="/users-grid" element={<UsersGridPage />} />
            <Route path="/users-list" element={<UsersListPage />} />
            <Route
              path="/view-details"
              element={
                <PrivateRoute>
                  <ViewDetailsPage />
                </PrivateRoute>
              }
            />
            <Route path="/video-generator" element={<VideoGeneratorPage />} />
            <Route path="/videos" element={<VideosPage />} />
            <Route path="/view-profile" element={<ViewProfilePage />} />
            <Route path="/voice-generator" element={<VoiceGeneratorPage />} />
            <Route path="/wallet" element={<WalletPage />} />
            <Route path="/widgets" element={<WidgetsPage />} />
            <Route path="/wizard" element={<WizardPage />} />
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

            {/* data + features */}
            <Route path="/overview" element={<DataOverview />} />
            <Route path="/data" element={<AllDataTable />} />
            <Route path="/market1" element={<Market1 />} />
            <Route path="/lms" element={<LmsPage />} />
            <Route
              path="/listings-admin"
              element={
                <AdminRoute>
                  <ListingsAdminPage />
                </AdminRoute>
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
            <Route path="/signup/vendor" element={<VendorSignupPage />} />
            <Route path="/profile-startup" element={<StartupProfilePage />} />
            <Route
              path="/vendor-home"
              element={
                <VendorRoute>
                  <VendorDashboardPage />
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
            <Route
              path="/profile-vendor-admin"
              element={
                <AdminRoute>
                  <VendorsAdminPage />
                </AdminRoute>
              }
            />



            {/* legacy -> dashboard */}
            <Route path="/index-7" element={<Navigate to="/dashboard" replace />} />
            <Route path="/profile" element={<Navigate to="/profile-vendor" replace />} />
            

            {/* 404 */}
            <Route path="*" element={<ErrorPage />} />
          </Routes>
          </AppSyncProvider>
        </Suspense>
      </ErrorBoundary>
    </>
  );
}
