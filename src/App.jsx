// src/App.jsx
import React, { Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import RouteScrollToTop from "./helper/RouteScrollToTop";

// session UI / guards
import Navbar from "./components/Navbar.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import PrivateRoute from "./components/PrivateRoute.jsx";
import LoginForm from "./components/LoginForm.jsx";
import { lazyWithRetry } from "./utils/lazyWithRetry";

// lazy pages
const Dashboard = lazyWithRetry(() => import("./pages/Dashboard.jsx"));
const HomePageOne = React.lazy(() => import("./pages/HomePageOne"));
const HomePageTwo = React.lazy(() => import("./pages/HomePageTwo"));
const HomePageThree = React.lazy(() => import("./pages/HomePageThree"));
const HomePageFour = React.lazy(() => import("./pages/HomePageFour"));
const HomePageFive = React.lazy(() => import("./pages/HomePageFive"));
const HomePageSix = React.lazy(() => import("./pages/HomePageSix"));
const HomePageSeven = React.lazy(() => import("./pages/HomePageSeven"));
const HomePageEight = React.lazy(() => import("./pages/HomePageEight"));
const HomePageNine = React.lazy(() => import("./pages/HomePageNine"));
const HomePageTen = React.lazy(() => import("./pages/HomePageTen"));
const HomePageEleven = React.lazy(() => import("./pages/HomePageEleven"));

const EmailPage = React.lazy(() => import("./pages/EmailPage"));
const AddUserPage = React.lazy(() => import("./pages/AddUserPage"));
const AlertPage = React.lazy(() => import("./pages/AlertPage"));
const AssignRolePage = React.lazy(() => import("./pages/AssignRolePage"));
const AvatarPage = React.lazy(() => import("./pages/AvatarPage"));
const BadgesPage = React.lazy(() => import("./pages/BadgesPage"));
const ButtonPage = React.lazy(() => import("./pages/ButtonPage"));
const CalendarMainPage = React.lazy(() => import("./pages/CalendarMainPage"));
const CardPage = React.lazy(() => import("./pages/CardPage"));
const CarouselPage = React.lazy(() => import("./pages/CarouselPage"));
const ChatMessagePage = React.lazy(() => import("./pages/ChatMessagePage"));
const ChatProfilePage = React.lazy(() => import("./pages/ChatProfilePage"));
const CodeGeneratorNewPage = React.lazy(() => import("./pages/CodeGeneratorNewPage"));
const CodeGeneratorPage = React.lazy(() => import("./pages/CodeGeneratorPage"));
const ColorsPage = React.lazy(() => import("./pages/ColorsPage"));
const ColumnChartPage = React.lazy(() => import("./pages/ColumnChartPage"));
const CompanyPage = React.lazy(() => import("./pages/CompanyPage"));
const CurrenciesPage = React.lazy(() => import("./pages/CurrenciesPage"));
const DropdownPage = React.lazy(() => import("./pages/DropdownPage"));
const ErrorPage = React.lazy(() => import("./pages/ErrorPage"));
const FaqPage = React.lazy(() => import("./pages/FaqPage"));
const ForgotPasswordPage = React.lazy(() => import("./pages/ForgotPasswordPage"));
const FormLayoutPage = React.lazy(() => import("./pages/FormLayoutPage"));
const FormValidationPage = React.lazy(() => import("./pages/FormValidationPage"));
const FormPage = React.lazy(() => import("./pages/FormPage"));
const GalleryPage = React.lazy(() => import("./pages/GalleryPage"));
const ImageGeneratorPage = React.lazy(() => import("./pages/ImageGeneratorPage"));
const ImageUploadPage = React.lazy(() => import("./pages/ImageUploadPage"));
const InvoiceAddPage = React.lazy(() => import("./pages/InvoiceAddPage"));
const InvoiceEditPage = React.lazy(() => import("./pages/InvoiceEditPage"));
const InvoiceListPage = React.lazy(() => import("./pages/InvoiceListPage"));
const InvoicePreviewPage = React.lazy(() => import("./pages/InvoicePreviewPage"));
const KanbanPage = React.lazy(() => import("./pages/KanbanPage"));
const LanguagePage = React.lazy(() => import("./pages/LanguagePage"));
const LineChartPage = React.lazy(() => import("./pages/LineChartPage"));
const ListPage = React.lazy(() => import("./pages/ListPage"));
const MarketplaceDetailsPage = React.lazy(() => import("./pages/MarketplaceDetailsPage"));
const MarketplacePage = React.lazy(() => import("./pages/MarketplacePage"));
const NotificationAlertPage = React.lazy(() => import("./pages/NotificationAlertPage"));
const NotificationPage = React.lazy(() => import("./pages/NotificationPage"));
const PaginationPage = React.lazy(() => import("./pages/PaginationPage"));
const PaymentGatewayPage = React.lazy(() => import("./pages/PaymentGatewayPage"));
const PieChartPage = React.lazy(() => import("./pages/PieChartPage"));
const PortfolioPage = React.lazy(() => import("./pages/PortfolioPage"));
const PricingPage = React.lazy(() => import("./pages/PricingPage"));
const ProgressPage = React.lazy(() => import("./pages/ProgressPage"));
const RadioPage = React.lazy(() => import("./pages/RadioPage"));
const RoleAccessPage = React.lazy(() => import("./pages/RoleAccessPage"));
const SignInPage = React.lazy(() => import("./pages/SignInPage"));
const SignUpPage = React.lazy(() => import("./pages/SignUpPage"));
const StarRatingPage = React.lazy(() => import("./pages/StarRatingPage"));
const StarredPage = React.lazy(() => import("./pages/StarredPage"));
const SwitchPage = React.lazy(() => import("./pages/SwitchPage"));
const TableBasicPage = React.lazy(() => import("./pages/TableBasicPage"));
const TableDataPage = React.lazy(() => import("./pages/TableDataPage"));
const TabsPage = React.lazy(() => import("./pages/TabsPage"));
const TagsPage = React.lazy(() => import("./pages/TagsPage"));
const TermsConditionPage = React.lazy(() => import("./pages/TermsConditionPage"));
const TextGeneratorNewPage = React.lazy(() => import("./pages/TextGeneratorNewPage"));
const TextGeneratorPage = React.lazy(() => import("./pages/TextGeneratorPage"));
const ThemePage = React.lazy(() => import("./pages/ThemePage"));
const TooltipPage = React.lazy(() => import("./pages/TooltipPage"));
const TypographyPage = React.lazy(() => import("./pages/TypographyPage"));
const UsersGridPage = React.lazy(() => import("./pages/UsersGridPage"));
const UsersListPage = React.lazy(() => import("./pages/UsersListPage"));
const ViewDetailsPage = React.lazy(() => import("./pages/ViewDetailsPage"));
const VideoGeneratorPage = React.lazy(() => import("./pages/VideoGeneratorPage"));
const VideosPage = React.lazy(() => import("./pages/VideosPage"));
const ViewProfilePage = React.lazy(() => import("./pages/ViewProfilePage"));
const VoiceGeneratorPage = React.lazy(() => import("./pages/VoiceGeneratorPage"));
const WalletPage = React.lazy(() => import("./pages/WalletPage"));
const WidgetsPage = React.lazy(() => import("./pages/WidgetsPage"));
const WizardPage = React.lazy(() => import("./pages/WizardPage"));

// new data pages (lazy)
const AllDataTable = React.lazy(() => import("./pages/AllDataTable"));
const DataOverview = React.lazy(() => import("./pages/DataOverview"));
const Market1 = React.lazy(() => import("./pages/Market1"));

const LmsPage = React.lazy(() => import("./pages/LmsPage.jsx"));
const LmsAdminPage = React.lazy(() => import("./pages/LmsAdminPage.jsx"));
// ...






function Fallback() {
  return (
    <div className="container py-4">
      <p>Loading…</p>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
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

            {/* public */}
            <Route path="/" element={<HomePageOne />} />
            <Route path="/index-2" element={<HomePageTwo />} />
            <Route path="/index-3" element={<HomePageThree />} />
            <Route path="/index-4" element={<HomePageFour />} />
            <Route path="/index-5" element={<HomePageFive />} />
            <Route path="/index-6" element={<HomePageSix />} />
            <Route path="/index-7" element={<HomePageSeven />} />
            <Route path="/index-8" element={<HomePageEight />} />
            <Route path="/index-9" element={<HomePageNine />} />
            <Route path="/index-10" element={<HomePageTen />} />
            <Route path="/index-11" element={<HomePageEleven />} />

            {/* SL */}
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

            {/* new data views */}
            <Route path="/overview" element={<DataOverview />} />
            <Route path="/data" element={<AllDataTable />} />
            <Route path="/market1" element={<Market1 />} />
            <Route path="/lms" element={<LmsPage />} />


            {/* optional: legacy theme path to dashboard */}
            <Route path="/index-7" element={<Navigate to="/dashboard" replace />} />

            {/* 404 */}
            <Route path="*" element={<ErrorPage />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
