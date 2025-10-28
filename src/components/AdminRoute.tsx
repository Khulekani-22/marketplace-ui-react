// src/components/AdminRoute.jsx
import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAppSync } from "../context/useAppSync";
import { auth } from "../firebase.js";

type AdminRouteProps = {
  children: ReactNode;
};

export default function AdminRoute({ children }: AdminRouteProps) {
  const location = useLocation();
  const { featurePrivileges = {}, role } = useAppSync();
  // For /audit-logs route, require audit-logs privilege
  const isAuditLogsRoute = location.pathname === "/audit-logs";
  const ok = isAuditLogsRoute ? !!(featurePrivileges as Record<string, boolean>)["audit-logs"] : role === "admin" || !!(featurePrivileges as Record<string, boolean>)["admin-dashboard"];
  const authed = !!auth.currentUser;

  if (!authed) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  if (!ok) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}
