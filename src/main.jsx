// src/main.jsx
import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ToastContainer } from "react-toastify";

import App from "./App.jsx";
import { VendorProvider } from "./context/VendorContext";
import { MessagesProvider } from "./context/MessagesContext.tsx";
import { AuthProvider } from "./context/AuthContext.tsx";
import { QueryClient, QueryClientProvider } from "react-query";

console.log('Main.jsx is loading...');

// --- Styles (order matters: base CSS before component CSS) ---
import "bootstrap/dist/css/bootstrap.min.css";
import "quill/dist/quill.snow.css";
import "jsvectormap/dist/css/jsvectormap.css";
import "react-toastify/dist/ReactToastify.css";
import "react-modal-video/css/modal-video.min.css";
import "lightgallery/css/lightgallery.css";
import "lightgallery/css/lg-zoom.css";
import "lightgallery/css/lg-thumbnail.css";
import "./styles/dark-patch.css";
import "./styles/theme-patch.css";
import "./styles/theme-fixes.css";
import "./styles/extra.css";  
import "./styles/access-to-capital.css";
import "./styles/wallet-credits.css";


// Optional JS bundles that enhance UI components
import "bootstrap/dist/js/bootstrap.bundle.min.js";

// Initialize theme (safe if utils/theme is present)
import { applyTheme, getInitialTheme } from "./utils/theme";
try {
  applyTheme(getInitialTheme());
} catch {
  // silently ignore if theme utils are unavailable
}


const rootEl = document.getElementById("root");
if (!rootEl) {
  throw new Error("Missing #root element in index.html");
}

console.log('About to render React app...');

const queryClient = new QueryClient();

createRoot(rootEl).render(
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <ToastContainer position="top-right" autoClose={4000} newestOnTop closeOnClick pauseOnFocusLoss={false} />
      <AuthProvider>
        <VendorProvider>
          <MessagesProvider>
            <App />
          </MessagesProvider>
        </VendorProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

console.log('React app rendered');
