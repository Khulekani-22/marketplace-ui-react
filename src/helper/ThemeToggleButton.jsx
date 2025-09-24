// src/helper/ThemeToggleButton.jsx
import { useEffect, useMemo, useState } from "react";
import { Icon } from "@iconify/react";
import {
  applyTheme,
  getInitialTheme,
  setTheme,
  toggleTheme,
} from "../utils/theme";

// Safe read from localStorage
function getSavedMode() {
  try {
    const v = localStorage.getItem("theme");
    return v === "light" || v === "dark" || v === "system" ? v : "system";
  } catch {
    return "system";
  }
}

// Read the currently applied (resolved) theme from <html data-theme="...">
function getResolvedTheme() {
  if (typeof document === "undefined") return "light";
  return (
    document.documentElement.getAttribute("data-theme") || getInitialTheme()
  );
}

export default function ThemeToggleButton() {
  // The user’s saved preference (may be "system")
  const [mode, setMode] = useState(getSavedMode);
  // The resolved theme that’s actually applied right now ("light" | "dark")
  const [resolved, setResolved] = useState(getResolvedTheme);

  // Ensure the correct theme is applied on first render (especially for "system")
  useEffect(() => {
    applyTheme(mode);
    setResolved(getResolvedTheme());
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Listen for theme changes broadcast by utils/theme.js and cross-tab storage changes
  useEffect(() => {
    const onThemeChange = () => setResolved(getResolvedTheme());
    const onStorage = (e) => {
      if (e.key === "theme") {
        const saved = getSavedMode();
        setMode(saved);
        // applyTheme will be called by utils/theme on system change, but make sure UI syncs:
        setResolved(getResolvedTheme());
      }
    };
    window.addEventListener("themechange", onThemeChange);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("themechange", onThemeChange);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  // Icon & label helpers
  const iconName = useMemo(
    () => (resolved === "dark" ? "solar:moon-outline" : "solar:sun-2-outline"),
    [resolved]
  );
  const label = useMemo(
    () =>
      mode === "system"
        ? `System (${resolved})`
        : resolved.charAt(0).toUpperCase() + resolved.slice(1),
    [mode, resolved]
  );

  const handleQuickToggle = () => {
    // Quick toggle cycles light/dark only (ignores "system")
    toggleTheme();
    setResolved(getResolvedTheme());
    // Also update saved mode to the new explicit theme
    const next = getResolvedTheme();
    setMode(next);
  };

  const choose = (nextMode) => {
    setMode(nextMode);
    setTheme(nextMode); // persists & applies
    setResolved(getResolvedTheme());
  };

  const isActive = (m) => mode === m;

  return (
    <div className="dropdown">
      <button
        className="has-indicator w-40-px h-40-px bg-neutral-200 rounded-circle d-flex justify-content-center align-items-center"
        type="button"
        data-bs-toggle="dropdown"
        aria-expanded="false"
        aria-label="Theme"
        title={`Theme: ${label}`}
        onClick={() => {
          // If user clicks the icon directly (not the caret), we quick-toggle.
          // Bootstrap will still open the dropdown; this keeps parity with your header UI.
          handleQuickToggle();
        }}
      >
        <Icon icon={iconName} className="text-primary-light text-xl" />
      </button>

      <ul className="dropdown-menu dropdown-menu-end to-top p-0 overflow-hidden">
        <li className="px-16 py-12 bg-primary-50">
          <div className="d-flex align-items-center justify-content-between w-100">
            <h6 className="text-lg text-primary-light fw-semibold mb-0">
              Theme
            </h6>
            <span className="text-secondary-light text-sm">{label}</span>
          </div>
        </li>

        <li>
          <button
            className={`dropdown-item d-flex align-items-center gap-2 ${
              isActive("light") ? "active" : ""
            }`}
            onClick={() => choose("light")}
          >
            <Icon icon="solar:sun-2-outline" className="text-lg" />
            <span>Light</span>
            {isActive("light") && (
              <Icon icon="mdi:check" className="ms-auto text-primary" />
            )}
          </button>
        </li>

        <li>
          <button
            className={`dropdown-item d-flex align-items-center gap-2 ${
              isActive("dark") ? "active" : ""
            }`}
            onClick={() => choose("dark")}
          >
            <Icon icon="solar:moon-outline" className="text-lg" />
            <span>Dark</span>
            {isActive("dark") && (
              <Icon icon="mdi:check" className="ms-auto text-primary" />
            )}
          </button>
        </li>

        <li>
          <button
            className={`dropdown-item d-flex align-items-center gap-2 ${
              isActive("system") ? "active" : ""
            }`}
            onClick={() => choose("system")}
          >
            <Icon icon="solar:monitor-outline" className="text-lg" />
            <span>System</span>
            {isActive("system") && (
              <Icon icon="mdi:check" className="ms-auto text-primary" />
            )}
          </button>
        </li>
      </ul>
    </div>
  );
}
