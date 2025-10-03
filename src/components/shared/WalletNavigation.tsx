// src/components/shared/WalletNavigation.tsx
import { Link, useLocation } from "react-router-dom";
import { Icon } from "@iconify/react";
import { useAppSync } from "../../context/useAppSync";

interface WalletNavigationProps {
  compact?: boolean;
}

export default function WalletNavigation({ compact = false }: WalletNavigationProps) {
  const location = useLocation();
  const { isAdmin } = useAppSync();

  const navItems = [
    {
      path: "/dashboard",
      label: "Dashboard",
      icon: "mdi:view-dashboard",
      description: "Overview and quick actions"
    },
    {
      path: "/wallet",
      label: "My Wallet",
      icon: "mdi:wallet",
      description: "Detailed wallet view and transactions"
    }
  ];

  if (isAdmin) {
    navItems.push({
      path: "/admin/wallet-credits",
      label: "Admin Credits",
      icon: "mdi:wallet-plus",
      description: "Manage user credits and wallets"
    });
  }

  if (compact) {
    return (
      <div className="btn-group" role="group">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`btn btn-sm ${
              location.pathname === item.path 
                ? "btn-primary" 
                : "btn-outline-primary"
            }`}
            title={item.description}
          >
            <Icon icon={item.icon} className="me-1" />
            {item.label}
          </Link>
        ))}
      </div>
    );
  }

  return (
    <div className="card p-16 radius-12 mb-4">
      <h6 className="mb-3">
        <Icon icon="mdi:navigation" className="me-2" />
        Wallet Navigation
      </h6>
      <div className="d-flex flex-wrap gap-2">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`btn btn-sm ${
              location.pathname === item.path 
                ? "btn-primary" 
                : "btn-outline-primary"
            }`}
          >
            <Icon icon={item.icon} className="me-1" />
            <span>{item.label}</span>
            {!compact && (
              <div className="text-xs mt-1 opacity-75">{item.description}</div>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
