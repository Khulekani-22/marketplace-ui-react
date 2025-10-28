// src/App.jsx - SIMPLIFIED FOR TESTING
import React, { Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import RouteScrollToTop from "./helper/RouteScrollToTop";
import { AppSyncProvider } from "./context/AppSyncContext.tsx";

// Shell / guards
import ErrorBoundary from "./components/ErrorBoundary.tsx";
import PrivateRoute from "./components/PrivateRoute.tsx";
import AdminRoute from "./components/AdminRoute.tsx";
import LoginForm from "./components/LoginForm.tsx";
import { WalletProvider } from "./context/WalletContext.tsx";

import { lazyWithRetry } from "./utils/lazyWithRetry";

// --- Lazy pages ---
const Dashboard = lazyWithRetry(() => import("./pages/Dashboard.tsx"));
const AdminWalletCreditsPage = React.lazy(() => import("./pages/AdminWalletCreditsPage.tsx"));

function Fallback() {
  return (
    <div className="container py-4">
      <p>Loading…</p>
    </div>
  );
}

function App() {
  return (
    <>
      <RouteScrollToTop />
      <ErrorBoundary>
        <Suspense fallback={<Fallback />}>
          <AppSyncProvider>
            <WalletProvider>
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

                {/* admin routes */}
                <Route
                  path="/admin/wallet-credits"
                  element={
                    <AdminRoute>
                      <AdminWalletCreditsPage />
                    </AdminRoute>
                  }
                />

                {/* 404 */}
                <Route path="*" element={<div>404 Not Found</div>} />
              </Routes>
            </WalletProvider>
          </AppSyncProvider>
        </Suspense>
      </ErrorBoundary>
    </>
  );
}

export default App;
