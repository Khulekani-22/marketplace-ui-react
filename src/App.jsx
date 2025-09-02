// src/App.jsx
import React, { Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import RouteScrollToTop from "./helper/RouteScrollToTop";

// Shell / guards
import Navbar from "./components/Navbar.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import PrivateRoute from "./components/PrivateRoute.jsx";
import AdminRoute from "./components/AdminRoute.jsx";
import LoginForm from "./components/LoginForm.jsx";
import VendorSignupPage from "./pages/VendorSignupPage.jsx";

import { lazyWithRetry } from "./utils/lazyWithRetry";

// --- Lazy pages ---
const Dashboard = lazyWithRetry(() => import("./pages/Dashboard.jsx"));
const HomePageOne = React.lazy(() => import("./pages/HomePageOne.jsx"));
const HomePageTwo = React.lazy(() => import("./pages/HomePageTwo.jsx"));
const HomePageThree = React.lazy(() => import("./pages/HomePageThree.jsx"));
const HomePageFour = React.lazy(() => import("./pages/HomePageFour.jsx"));
const HomePageFive = React.lazy(() => import("./pages/HomePageFive.jsx"));
const HomePageSix = React.lazy(() => import("./pages/HomePageSix.jsx"));
// NOTE: /index-7 route is not mounted; we redirect below
const HomePageEight = React.lazy(() => import("./pages/HomePageEight.jsx"));
const HomePageNine = React.lazy(() => import("./pages/HomePageNine.jsx"));
const HomePageTen = React.lazy(() => import("./pages/HomePageTen.jsx"));
const HomePageEleven = React.lazy(() => import("./pages/HomePageEleven.jsx"));

const EmailPage = React.lazy(() => import("./pages/EmailPage.jsx"));
const AddUserPage = React.lazy(() => import("./pages/AddUserPage.jsx"));
const AlertPage = React.lazy(() => import("./pages/AlertPage.jsx"));
const AssignRolePage = React.lazy(() => import("./pages/AssignRolePage.jsx"));
const AvatarPage = React.lazy(() => import("./pages/AvatarPage.jsx"));
const BadgesPage = React.lazy(() => import("./pages/BadgesPage.jsx"));
const ButtonPage = React.lazy(() => import("./pages/ButtonPage.jsx"));
const CalendarMainPage = React.lazy(() => import("./pages/CalendarMainPage.jsx"));
const CardPage = React.lazy(() => import("./pages/CardPage.jsx"));
const CarouselPage = React.lazy(() => import("./pages/CarouselPage.jsx"));
const ChatMessagePage = React.lazy(() => import("./pages/ChatMessagePage.jsx"));
const ChatProfilePage = React.lazy(() => import("./pages/ChatProfilePage.jsx"));
const CodeGeneratorNewPage = React.lazy(() => import("./pages/CodeGeneratorNewPage.jsx"));
const CodeGeneratorPage = React.lazy(() => import("./pages/CodeGeneratorPage.jsx"));
const ColorsPage = React.lazy(() => import("./pages/ColorsPage.jsx"));
const ColumnChartPage = React.lazy(() => import("./pages/ColumnChartPage.jsx"));
const CompanyPage = React.lazy(() => import("./pages/CompanyPage.jsx"));
const CurrenciesPage = React.lazy(() => import("./pages/CurrenciesPage.jsx"));
const DropdownPage = React.lazy(() => import("./pages/DropdownPage.jsx"));
const ErrorPage = React.lazy(() => import("./pages/ErrorPage.jsx"));
const FaqPage = React.lazy(() => import("./pages/FaqPage.jsx"));
const ForgotPasswordPage = React.lazy(() => import("./pages/ForgotPasswordPage.jsx"));
const FormLayoutPage = React.lazy(() => import("./pages/FormLayoutPage.jsx"));
const FormValidationPage = React.lazy(() => import("./pages/FormValidationPage.jsx"));
const FormPage = React.lazy(() => import("./pages/FormPage.jsx"));
const GalleryPage = React.lazy(() => import("./pages/GalleryPage.jsx"));
const ImageGeneratorPage = React.lazy(() => import("./pages/ImageGeneratorPage.jsx"));
const ImageUploadPage = React.lazy(() => import("./pages/ImageUploadPage.jsx"));
const InvoiceAddPage = React.lazy(() => import("./pages/InvoiceAddPage.jsx"));
const InvoiceEditPage = React.lazy(() => import("./pages/InvoiceEditPage.jsx"));
const InvoiceListPage = React.lazy(() => import("./pages/InvoiceListPage.jsx"));
const InvoicePreviewPage = React.lazy(() => import("./pages/InvoicePreviewPage.jsx"));
const KanbanPage = React.lazy(() => import("./pages/KanbanPage.jsx"));
const LanguagePage = React.lazy(() => import("./pages/LanguagePage.jsx"));
const LineChartPage = React.lazy(() => import("./pages/LineChartPage.jsx"));
const ListPage = React.lazy(() => import("./pages/ListPage.jsx"));
const MarketplaceDetailsPage = React.lazy(() => import("./pages/MarketplaceDetailsPage.jsx"));
const MarketplacePage = React.lazy(() => import("./pages/MarketplacePage.jsx"));
const NotificationAlertPage = React.lazy(() => import("./pages/NotificationAlertPage.jsx"));
const NotificationPage = React.lazy(() => import("./pages/NotificationPage.jsx"));
const PaginationPage = React.lazy(() => import("./pages/PaginationPage.jsx"));
const PaymentGatewayPage = React.lazy(() => import("./pages/PaymentGatewayPage.jsx"));
const PieChartPage = React.lazy(() => import("./pages/PieChartPage.jsx"));
const PortfolioPage = React.lazy(() => import("./pages/PortfolioPage.jsx"));
const PricingPage = React.lazy(() => import("./pages/PricingPage.jsx"));
const ProgressPage = React.lazy(() => import("./pages/ProgressPage.jsx"));
const RadioPage = React.lazy(() => import("./pages/RadioPage.jsx"));
const RoleAccessPage = React.lazy(() => import("./pages/RoleAccessPage.jsx"));
const SignInPage = React.lazy(() => import("./pages/SignInPage.jsx"));
const SignUpPage = React.lazy(() => import("./pages/SignUpPage.jsx"));
const StartupSignupPage = React.lazy(() => import("./pages/StartupSignupPage.jsx"));
const StarRatingPage = React.lazy(() => import("./pages/StarRatingPage.jsx"));
const StarredPage = React.lazy(() => import("./pages/StarredPage.jsx"));
const SwitchPage = React.lazy(() => import("./pages/SwitchPage.jsx"));
const TableBasicPage = React.lazy(() => import("./pages/TableBasicPage.jsx"));
const TableDataPage = React.lazy(() => import("./pages/TableDataPage.jsx"));
const TabsPage = React.lazy(() => import("./pages/TabsPage.jsx"));
const TagsPage = React.lazy(() => import("./pages/TagsPage.jsx"));
const TermsConditionPage = React.lazy(() => import("./pages/TermsConditionPage.jsx"));
const TextGeneratorNewPage = React.lazy(() => import("./pages/TextGeneratorNewPage.jsx"));
const TextGeneratorPage = React.lazy(() => import("./pages/TextGeneratorPage.jsx"));
const ThemePage = React.lazy(() => import("./pages/ThemePage.jsx"));
const TooltipPage = React.lazy(() => import("./pages/TooltipPage.jsx"));
const TypographyPage = React.lazy(() => import("./pages/TypographyPage.jsx"));
const UsersGridPage = React.lazy(() => import("./pages/UsersGridPage.jsx"));
const UsersListPage = React.lazy(() => import("./pages/UsersListPage.jsx"));
const ViewDetailsPage = React.lazy(() => import("./pages/ViewDetailsPage.jsx"));
const VideoGeneratorPage = React.lazy(() => import("./pages/VideoGeneratorPage.jsx"));
const VideosPage = React.lazy(() => import("./pages/VideosPage.jsx"));
const ViewProfilePage = React.lazy(() => import("./pages/ViewProfilePage.jsx"));
const VoiceGeneratorPage = React.lazy(() => import("./pages/VoiceGeneratorPage.jsx"));
const WalletPage = React.lazy(() => import("./pages/WalletPage.jsx"));
const WidgetsPage = React.lazy(() => import("./pages/WidgetsPage.jsx"));
const WizardPage = React.lazy(() => import("./pages/WizardPage.jsx"));
const AuditLogsPage = React.lazy(() => import("./pages/AuditLogsPage.jsx"));
const UserRoleManagementPage = React.lazy(() => import("./pages/UserRoleManagementPage.jsx"));

// data views (these were missing before)
const AllDataTable = React.lazy(() => import("./pages/AllDataTable.jsx"));
const DataOverview = React.lazy(() => import("./pages/DataOverview.jsx"));
const Market1 = React.lazy(() => import("./pages/Market1.jsx"));

// features
const LmsPage = React.lazy(() => import("./pages/LmsPage.jsx"));
const LmsAdminPage = React.lazy(() => import("./pages/LmsAdminPage.jsx"));
const ListingsAdminPage = React.lazy(() => import("./pages/ListingsAdminPage.jsx"));
const VendorAddListingPage = React.lazy(() => import("./pages/VendorAddListingPage.jsx"));
const VendorMyListings = React.lazy(() => import("./pages/VendorMyListings.jsx"));
const VendorProfilePage = React.lazy(() => import("./pages/VendorProfilePage.jsx"));
const VendorsAdminPage = React.lazy(() => import("./pages/VendorsAdminPage.jsx"));
const StartupProfilePage = React.lazy(() => import("./pages/StartupProfilePage.jsx"));



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
      <Navbar />
      <ErrorBoundary>
        <Suspense fallback={<Fallback />}>
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
            <Route path="/" element={<HomePageOne />} />
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
            <Route path="/email" element={<EmailPage />} />
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
            <Route path="/view-details" element={<ViewDetailsPage />} />
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
            <Route path="/listings-vendors" element={<VendorAddListingPage />} />
            <Route path="/signup/vendor" element={<VendorSignupPage />} />
            <Route path="/profile-startup" element={<StartupProfilePage />} />
            <Route path="/listings-vendors-mine" element={<VendorMyListings />} />
            <Route path="/profile-vendor" element={<VendorProfilePage />} />
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
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/profile" element={<Navigate to="/profile-vendor" replace />} />
            

            {/* 404 */}
            <Route path="*" element={<ErrorPage />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </>
  );
}
