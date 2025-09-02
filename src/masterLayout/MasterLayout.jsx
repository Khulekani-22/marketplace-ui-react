// src/MasterLayout/MasterLayout.jsx
import { useEffect, useMemo, useState } from "react";
import { Icon } from "@iconify/react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import ThemeToggleButton from "../helper/ThemeToggleButton";
import { auth } from "../lib/firebase";
import { api } from "../lib/api";
import { writeAuditLog } from "../lib/audit";


export default function MasterLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarActive, setSidebarActive] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [openKeys, setOpenKeys] = useState({});
  const [isAdmin, setIsAdmin] = useState(() => (sessionStorage.getItem("role") === "admin"));
  const [tenantId, setTenantId] = useState(() => sessionStorage.getItem("tenantId") || "public");
  const [tenants, setTenants] = useState([]);

  // Auto-open dropdown containing current route + close mobile on route change


  const toggleDropdown = (key) => {
    setOpenKeys((prev) => {
      const collapsed = Object.fromEntries(Object.keys({ ...prev, ...Object.fromEntries(DROPDOWNS.map(d => [d.key,false])) }).map((k) => [k, false]));
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

  // Resolve role/tenant for current user (best-effort)
  useEffect(() => {
    const u = auth.currentUser;
    const email = u?.email || sessionStorage.getItem("userEmail");
    if (!email) return;
    (async () => {
      try {
        const { data } = await api.get("/api/users/me", { params: { email } });
        const role = data?.role || "member";
        const tenantId = data?.tenantId || "public";
        sessionStorage.setItem("userEmail", email);
        sessionStorage.setItem("role", role);
        sessionStorage.setItem("tenantId", tenantId);
        setIsAdmin(role === "admin");
        setTenantId(tenantId);
      } catch {}
    })();
  }, []);

  // Load tenants list for switcher (best-effort)
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/api/tenants");
        const arr = Array.isArray(data) ? data : [];
        const withPublic = [{ id: "public", name: "Public" }, ...arr.filter((t) => t?.id !== "public")];
        setTenants(withPublic);
      } catch {
        setTenants([{ id: "public", name: "Public" }]);
      }
    })();
  }, []);

  const handleTenantChange = (e) => {
    const next = e.target.value;
    setTenantId(next);
    sessionStorage.setItem("tenantId", next);
  };

  async function handleLogout(e) {
    e?.preventDefault?.();
    const userEmail = auth.currentUser?.email || null;
    try {
      await writeAuditLog({ action: "LOGOUT", userEmail });
    } catch {}
    try {
      await auth.signOut?.();
    } catch {}
    sessionStorage.removeItem("tenantId");
    sessionStorage.removeItem("role");
    sessionStorage.removeItem("userEmail");
    navigate("/login", { replace: true });
  }

  return (
    <section className={overlayClass} onClick={(e) => e.target.classList?.contains("overlay") && setMobileMenu(false)}>
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
                <Icon icon="material-symbols:map-outline" className="menu-icon" />
                <span>All Listings</span>
              </NavLink>
            </li>

            <li>
              <NavLink to="/listings-vendors" className={navClass}>
                <Icon icon="solar:document-text-outline" className="menu-icon" />
                <span>Add Listings</span>
              </NavLink>
            </li>

             <li>
              <NavLink to="/listings-vendors-mine" className={navClass}>
                <Icon icon="mdi:view-list-outline" className="menu-icon" />
                <span>My Listings</span>
              </NavLink>
            </li>


            <li>
              <NavLink to="/profile-vendor" className={navClass}>
                <Icon icon="solar:user-linear" className="menu-icon" />
                <span>My Profile</span>
              </NavLink>
            </li>

            <li>
              <NavLink to="/profile-startup" className={navClass}>
                <Icon icon="mdi:account-box-outline" className="menu-icon" />
                <span>Startup Profile</span>
              </NavLink>
            </li>

         

            

            {isAdmin && (
              <>
                <hr></hr>
                {/* Admin */}
                <li>
                  <NavLink to="/profile-vendor-admin" className={navClass}>
                    <Icon icon="ri-user-settings-line" className="menu-icon" />
                    <span>Vendor Approval</span>
                  </NavLink>
                </li>

                <li>
                  <NavLink to="/audit-logs" className={navClass}>
                    <Icon icon="mdi:clipboard-text-clock-outline" className="menu-icon" />
                    <span>Audit Logs</span>
                  </NavLink>
                </li>

                <li>
                  <NavLink to="/listings-admin" className={navClass}>
                    <Icon icon="mdi:view-list-outline" className="menu-icon" />
                    <span>Listings Approval</span>
                  </NavLink>
                </li>

                <li>
                  <NavLink to="/admin/users" className={navClass}>
                    <Icon icon="mdi:account-cog-outline" className="menu-icon" />
                    <span>User Roles</span>
                  </NavLink>
                </li>
              </>
            )}


            <hr></hr>

            <li>
              <NavLink to="/sloane-academy" className={navClass}>
                <Icon icon="mdi:school-outline" className="menu-icon" />
                <span>Sloane Academy</span>
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
                        <h6 className="text-lg text-primary-light fw-semibold mb-0">Choose Your Language</h6>
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
                    {/* … your message items … */}
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
                        <h6 className="text-lg text-primary-light fw-semibold mb-0">Notifications</h6>
                      </div>
                      <span className="text-primary-600 fw-semibold text-lg w-40-px h-40-px rounded-circle bg-base d-flex justify-content-center align-items-center">
                        05
                      </span>
                    </div>
                    {/* … your notification items … */}
                    <div className="text-center py-12 px-16">
                      <Link to="#" className="text-primary-600 fw-semibold text-md">
                        See All Notification
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Admin indicator + tenant switcher */}
                {isAdmin && (
                  <div className="d-flex align-items-center gap-2">
                    <span className="badge bg-success-focus text-success-700">Admin</span>
                    <label className="text-sm text-secondary-light">Tenant</label>
                    <select
                      className="form-select form-select-sm w-auto bg-base border text-secondary-light rounded-pill"
                      value={tenantId}
                      onChange={handleTenantChange}
                    >
                      {tenants.map((t) => (
                        <option key={t.id} value={t.id}>{t.name || t.id}</option>
                      ))}
                    </select>
                  </div>
                )}

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
                          to="/profile-vendor"
                        >
                          <Icon icon="solar:user-linear" className="icon text-xl" />{" "}
                          My Profile
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
                          onClick={handleLogout}
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
              <p className="mb-0">© 2025, 22 On Sloane Capital. All Rights Reserved.</p>
            </div>
            <div className="col-auto">
              <p className="mb-0">
                Developed by <span className="text-primary-600">22 On Sloane</span>
              </p>
            </div>
          </div>
        </footer>
      </main>
    </section>
  );
}
