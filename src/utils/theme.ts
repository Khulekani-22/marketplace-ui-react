// src/utils/theme.ts
export function getInitialTheme() {
  return localStorage.getItem("ui_theme") || "light";
}

export function applyTheme(theme: "light" | "dark") {
  const root = document.documentElement; // <html>
  root.setAttribute("data-bs-theme", theme);   // ← Bootstrap 5.3 native
  root.classList.toggle("dark", theme === "dark"); // keep if any custom CSS expects `.dark`
  localStorage.setItem("ui_theme", theme);
}

export function toggleTheme() {
  const next = (localStorage.getItem("ui_theme") || "light") === "dark" ? "light" : "dark";
  applyTheme(next);
  return next;
}
