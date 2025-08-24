
// src/utils/theme.js

// Lightweight theme helper: persists to localStorage, updates <html> attributes,
// keeps a "system" option, and emits a "themechange" event that charts/maps can listen to.

const STORAGE_KEY = "theme"; // "light" | "dark" | "system"
const THEME_ATTR = "data-theme"; // set on <html>
const DARK_CLASS = "dark"; // optional class for libs that key off .dark

const mql =
  typeof window !== "undefined" && window.matchMedia
    ? window.matchMedia("(prefers-color-scheme: dark)")
    : null;

function getStoredMode() {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === "light" || v === "dark" || v === "system" ? v : null;
  } catch {
    return null;
  }
}

export function getSystemTheme() {
  return mql && mql.matches ? "dark" : "light";
}

// Returns "light" or "dark" for initial paint.
// If user saved "system" (or nothing), we resolve to current OS theme.
export function getInitialTheme() {
  const stored = getStoredMode();
  if (stored === "light" || stored === "dark") return stored;
  return getSystemTheme();
}

// Apply a theme immediately. Accepts "light" | "dark" | "system".
export function applyTheme(mode) {
  const theme = mode === "system" ? getSystemTheme() : mode;
  const html = document.documentElement;

  // Attribute + class (useful for Tailwind/DaisyUI/your CSS)
  html.setAttribute(THEME_ATTR, theme);
  html.classList.toggle(DARK_CLASS, theme === "dark");

  // Keep the color-scheme meta up-to-date for native form controls/scrollbars
  try {
    let meta = document.querySelector('meta[name="color-scheme"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "color-scheme");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", theme === "dark" ? "dark light" : "light dark");
  } catch {
    /* noop */
  }

  // Broadcast for listeners (e.g., re-theming charts)
  try {
    window.dispatchEvent(new CustomEvent("themechange", { detail: { theme } }));
  } catch {
    /* noop */
  }

  return theme;
}

// Persist and apply. Accepts "light" | "dark" | "system".
export function setTheme(mode) {
  const valid =
    mode === "light" || mode === "dark" || mode === "system" ? mode : "light";
  try {
    localStorage.setItem(STORAGE_KEY, valid);
  } catch {
    /* noop */
  }
  return applyTheme(valid);
}

// Simple toggle between light/dark (ignores "system").
export function toggleTheme() {
  const current =
    document.documentElement.getAttribute(THEME_ATTR) || getInitialTheme();
  const next = current === "dark" ? "light" : "dark";
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    /* noop */
  }
  return applyTheme(next);
}

// Current theme (resolved, not "system").
export function getCurrentTheme() {
  return (
    document.documentElement.getAttribute(THEME_ATTR) || getInitialTheme()
  );
}

// Subscribe to theme changes. Returns an unsubscribe function.
export function onThemeChange(handler) {
  const fn = (e) => handler(e?.detail?.theme || getCurrentTheme());
  window.addEventListener("themechange", fn);
  return () => window.removeEventListener("themechange", fn);
}

// If user prefers "system" (or nothing stored), react to OS changes live.
try {
  const handleSystem = () => {
    const stored = getStoredMode();
    if (stored === "system" || !stored) applyTheme("system");
  };
  if (mql?.addEventListener) {
    mql.addEventListener("change", handleSystem);
  } else if (mql?.addListener) {
    // Safari
    mql.addListener(handleSystem);
  }
} catch {
  /* noop */
}

export const __THEME_DEBUG__ = {
  STORAGE_KEY,
  THEME_ATTR,
  getStoredMode,
};

