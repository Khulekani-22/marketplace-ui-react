// src/MasterLayout/MasterLayout.jsx
import { useEffect, useMemo, useState } from "react";
import { Icon } from "@iconify/react";
import { Link, NavLink, useLocation } from "react-router-dom";
import ThemeToggleButton from "../helper/ThemeToggleButton";

const DROPDOWNS = [
  {
    key: "maturity",
    icon: "mdi:chart-timeline-variant",
    label: "Startup Maturity",
    items: [
      { to: "/maturity/brl", label: "BRL", dotClass: "text-primary-600" },
      { to: "/maturity/trl", label: "TRL", dotClass: "text-warning-main" },
      { to: "/maturity/credit", label: "Credit Scoring", dotClass: "text-success-main" },
    ],
  },
  {
    key: "bplan",
    icon: "mdi:file-document-edit-outline",
    label: "Business Plan",
    items: [
      { to: "/business-plan/generate", label: "Generate", dotClass: "text-primary-600" },
      { to: "/business-plan/history", label: "History", dotClass: "text-warning-main" },
    ],
  },
];

export default function MasterLayout({ children }) {
  const location = useLocation();
  const [sidebarActive, setSidebarActive] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  // Which dropdowns are open
  const [openKeys, setOpenKeys] = useState({});

  // Auto-open the dropdown that contains the current route
  useEffect(() => {
    const next = {};
    DROPDOWNS.forEach((dd) => {
      next[dd.key] = dd.items.some((i) => location.pathname.startsWith(i.to));
    });
    setOpenKeys((prev) => ({ ...prev, ...next }));
    // Close mobile menu after navigation
    setMobileMenu(false);
  }, [location.pathname]);

  const toggleDropdown = (key) => {
    setOpenKeys((prev) => {
      // Collapse others so only one is open, UX like your original
      const collapsed = Object.fromEntries(Object.keys(prev).map((k) => [k, false]));
      return { ...collapsed, [key]: !prev[key] };
    });
  };

  const navClass = ({ isActive }) => (isActive ? "active-page" : "");

  const submenuMaxHeight = (isOpen, count) =>
    isOpen ? { maxHeight: `${Math.max(48, count * 44)}px` } : { maxHeight: "0px" };

  const overlayClass = useMemo(() => (mobileMenu ? "overlay active" : "overlay"), [mobileMenu]);
  const sidebarClass = useMemo(() => {
    if (sidebarActive) return "sidebar active";
    if (mobileMenu) return "sidebar sidebar-open";
    return "sidebar";
  }, [sidebarActive, mobileMenu]);

  return (
    <section className={overlayClass}>
      {/* Sidebar */}
      <aside className={sidebarClass} aria-label="Main sidebar">
        <button
          onClick={() => setMobileMenu(false)}
          type="button"
          className="sidebar-close-btn"
          aria-label="Close sidebar"
        >
          <Icon icon="radix-icons:cross-2" />
        </button>

        <div>
          <Link to="/" className="sidebar-logo" aria-label="Go to home">
            <img src="assets/images/logo-22.png" alt="logo" className="light-logo" />
            <img src="assets/images/logo-22-light.png" alt="logo" className="dark-logo" />
            <img src="assets/images/logo-mark.png" alt="logo mark" className="logo-icon" />
          </Link>
        </div>

        <div className="sidebar-menu-area">
          <ul className="sidebar-menu" id="sidebar-menu">
            <li>
              <NavLink to="/dashboard" className={navClass}>
                <Icon icon="solar:home-smile-angle-outline" className="menu-icon" />
                <span>Dashboard</span>
              </NavLink>
            </li>

            <li>
              <NavLink to="/listings-vendors" className={navClass}>
                <Icon icon="mdi:view-list-outline" className="menu-icon" />
                <span>Listings</span>
              </NavLink>
            </li>

            <li>
              <NavLink to="/sloane-academy" className={navClass}>
                <Icon icon="mdi:school-outline" className="menu-icon" />
                <span>Sloane Academy</span>
              </NavLink>
            </li>

            {/* Dropdowns */}
            {DROPDOWNS.map((dd) => {
              const isOpen = !!openKeys[dd.key];
              return (
                <li key={dd.key} className={`dropdown ${isOpen ? "open" : ""}`}>
                  {/* Use button to avoid routing to "#" which can cause SPA quirks */}
                  <button
                    type="button"
                    className="w-100 text-start d-flex align-items-center gap-2 px-0 border-0 bg-transparent"
                    onClick={() => toggleDropdown(dd.key)}
                    aria-expanded={isOpen}
                    aria-controls={`submenu-${dd.key}`}
                  >
                    <Icon icon={dd.icon} className="menu-icon" />
                    <span className="flex-grow-1">{dd.label}</span>
                    <Icon
                      icon={isOpen ? "mdi:chevron-up" : "mdi:chevron-down"}
                      className="ms-auto"
                    />
                  </button>

                  <ul
                    id={`submenu-${dd.key}`}
                    className="sidebar-submenu"
                    style={submenuMaxHeight(isOpen, dd.items.length)}
                  >
                    {dd.items.map((it) => (
                      <li key={it.to}>
                        <NavLink to={it.to} className={navClass}>
                          <i className={`ri-circle-fill circle-icon ${it.dotClass} w-auto`} />
                          {it.label}
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                </li>
              );
            })}

            <li>
              <NavLink to="/profile" className={navClass}>
                <Icon icon="solar:user-linear" className="menu-icon" />
                <span>My Profile</span>
              </NavLink>
            </li>

            <li>
              <NavLink to="/support" className={navClass}>
                <Icon icon="mdi:headset" className="menu-icon" />
                <span>Support</span>
              </NavLink>
            </li>
          </ul>
        </div>
      </aside>

      {/* Main */}
      <main className={sidebarActive ? "dashboard-main active" : "dashboard-main"}>
        {/* Top bar */}
        <div className="navbar-header">
          <div className="row align-items-center justify-content-between">
            <div className="col-auto">
              <div className="d-flex flex-wrap align-items-center gap-4">
                <button
                  type="button"
                  className="sidebar-toggle"
                  onClick={() => setSidebarActive((v) => !v)}
                  aria-label="Toggle sidebar"
                >
                  {sidebarActive ? (
                    <Icon icon="iconoir:arrow-right" className="icon text-2xl non-active" />
                  ) : (
                    <Icon icon="heroicons:bars-3-solid" className="icon text-2xl non-active" />
                  )}
                </button>

                <button
                  onClick={() => setMobileMenu(true)}
                  type="button"
                  className="sidebar-mobile-toggle"
                  aria-label="Open mobile menu"
                >
                  <Icon icon="heroicons:bars-3-solid" className="icon" />
                </button>

                <form className="navbar-search" role="search" onSubmit={(e) => e.preventDefault()}>
                  <input type="text" name="search" placeholder="Search" aria-label="Search" />
                  <Icon icon="ion:search-outline" className="icon" />
                </form>
              </div>
            </div>

            <div className="col-auto">
              <div className="d-flex flex-wrap align-items-center gap-3">
                {/* Theme toggle */}
                <ThemeToggleButton />

                {/* Language */}
                <div className="dropdown d-none d-sm-inline-block">
                  <button
                    className="has-indicator w-40-px h-40-px bg-neutral-200 rounded-circle d-flex justify-content-center align-items-center"
                    type="button"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                    aria-label="Change language"
                  >
                    <img
                      src="assets/images/lang-flag.png"
                      alt="language"
                      className="w-24 h-24 object-fit-cover rounded-circle"
                    />
                  </button>
                  <div className="dropdown-menu to-top dropdown-menu-sm">
                    <div className="py-12 px-16 radius-8 bg-primary-50 mb-16 d-flex align-items-center justify-content-between gap-2">
                      <div>
                        <h6 className="text-lg text-primary-light fw-semibold mb-0">
                          Choose Your Language
                        </h6>
                      </div>
                    </div>
                    <div className="max-h-400-px overflow-y-auto scroll-sm pe-8">
                      {[
                        { id: "english", img: "flag1.png", label: "English" },
                        { id: "japan", img: "flag2.png", label: "Japan" },
                        { id: "france", img: "flag3.png", label: "France" },
                        { id: "germany", img: "flag4.png", label: "Germany" },
                        { id: "korea", img: "flag5.png", label: "South Korea" },
                        { id: "bangladesh", img: "flag6.png", label: "Bangladesh" },
                        { id: "india", img: "flag7.png", label: "India" },
                        { id: "canada", img: "flag8.png", label: "Canada" },
                      ].map((opt) => (
                        <div
                          key={opt.id}
                          className="form-check style-check d-flex align-items-center justify-content-between mb-16"
                        >
                          <label
                            className="form-check-label line-height-1 fw-medium text-secondary-light"
                            htmlFor={opt.id}
                          >
                            <span className="text-black hover-bg-transparent hover-text-primary d-flex align-items-center gap-3">
                              <img
                                src={`assets/images/flags/${opt.img}`}
                                alt={opt.label}
                                className="w-36-px h-36-px bg-success-subtle text-success-main rounded-circle flex-shrink-0"
                              />
                              <span className="text-md fw-semibold mb-0">{opt.label}</span>
                            </span>
                          </label>
                          <input className="form-check-input" type="radio" name="lang" id={opt.id} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="dropdown">
                  <button
                    className="has-indicator w-40-px h-40-px bg-neutral-200 rounded-circle d-flex justify-content-center align-items-center"
                    type="button"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                    aria-label="Open messages"
                  >
                    <Icon icon="mage:email" className="text-primary-light text-xl" />
                  </button>
                  <div className="dropdown-menu to-top dropdown-menu-lg p-0">
                    <div className="m-16 py-12 px-16 radius-8 bg-primary-50 mb-16 d-flex align-items-center justify-content-between gap-2">
                      <div>
                        <h6 className="text-lg text-primary-light fw-semibold mb-0">Message</h6>
                      </div>
                      <span className="text-primary-600 fw-semibold text-lg w-40-px h-40-px rounded-circle bg-base d-flex justify-content-center align-items-center">
                        05
                      </span>
                    </div>
                    {/* … keep your message items here … */}
                    <div className="text-center py-12 px-16">
                      <Link to="#" className="text-primary-600 fw-semibold text-md">
                        See All Message
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Notifications */}
                <div className="dropdown">
                  <button
                    className="has-indicator w-40-px h-40-px bg-neutral-200 rounded-circle d-flex justify-content-center align-items-center"
                    type="button"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                    aria-label="Open notifications"
                  >
                    <Icon icon="iconoir:bell" className="text-primary-light text-xl" />
                  </button>
                  <div className="dropdown-menu to-top dropdown-menu-lg p-0">
                    <div className="m-16 py-12 px-16 radius-8 bg-primary-50 mb-16 d-flex align-items-center justify-content-between gap-2">
                      <div>
                        <h6 className="text-lg text-primary-light fw-semibold mb-0">
                          Notifications
                        </h6>
                      </div>
                      <span className="text-primary-600 fw-semibold text-lg w-40-px h-40-px rounded-circle bg-base d-flex justify-content-center align-items-center">
                        05
                      </span>
                    </div>
                    {/* … keep your notification items here … */}
                    <div className="text-center py-12 px-16">
                      <Link to="#" className="text-primary-600 fw-semibold text-md">
                        See All Notification
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Profile */}
                <div className="dropdown">
                  <button
                    className="d-flex justify-content-center align-items-center rounded-circle"
                    type="button"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                    aria-label="Open profile menu"
                  >
                    <img
                      src="assets/images/user.png"
                      alt="user"
                      className="w-40-px h-40-px object-fit-cover rounded-circle"
                    />
                  </button>
                  <div className="dropdown-menu to-top dropdown-menu-sm">
                    <div className="py-12 px-16 radius-8 bg-primary-50 mb-16 d-flex align-items-center justify-content-between gap-2">
                      <div>
                        <h6 className="text-lg text-primary-light fw-semibold mb-2">Shaidul Islam</h6>
                        <span className="text-secondary-light fw-medium text-sm">Admin</span>
                      </div>
                      <button type="button" className="hover-text-danger" aria-label="Close">
                        <Icon icon="radix-icons:cross-1" className="icon text-xl" />
                      </button>
                    </div>
                    <ul className="to-top-list">
                      <li>
                        <Link
                          className="dropdown-item text-black px-0 py-8 hover-bg-transparent hover-text-primary d-flex align-items-center gap-3"
                          to="/view-profile"
                        >
                          <Icon icon="solar:user-linear" className="icon text-xl" /> My Profile
                        </Link>
                      </li>
                      <li>
                        <Link
                          className="dropdown-item text-black px-0 py-8 hover-bg-transparent hover-text-primary d-flex align-items-center gap-3"
                          to="/email"
                        >
                          <Icon icon="tabler:message-check" className="icon text-xl" /> Inbox
                        </Link>
                      </li>
                      <li>
                        <Link
                          className="dropdown-item text-black px-0 py-8 hover-bg-transparent hover-text-primary d-flex align-items-center gap-3"
                          to="/company"
                        >
                          <Icon icon="icon-park-outline:setting-two" className="icon text-xl" />
                          Setting
                        </Link>
                      </li>
                      <li>
                        <Link
                          className="dropdown-item text-black px-0 py-8 hover-bg-transparent hover-text-danger d-flex align-items-center gap-3"
                          to="#"
                        >
                          <Icon icon="lucide:power" className="icon text-xl" /> Log Out
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
                {/* /Profile */}
              </div>
            </div>
          </div>
        </div>

        {/* Page body */}
        <div className="dashboard-main-body">{children}</div>

        {/* Footer */}
        <footer className="d-footer">
          <div className="row align-items-center justify-content-between">
            <div className="col-auto">
              <p className="mb-0">© 2025 WowDash. All Rights Reserved.</p>
            </div>
            <div className="col-auto">
              <p className="mb-0">
                Made by <span className="text-primary-600">wowtheme7</span>
              </p>
            </div>
          </div>
        </footer>
      </main>
    </section>
  );
}
