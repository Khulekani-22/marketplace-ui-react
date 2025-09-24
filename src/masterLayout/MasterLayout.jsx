// src/MasterLayout/MasterLayout.jsx
import { useEffect, useMemo, useState } from "react";
import { Icon } from "@iconify/react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import ThemeToggleButton from "../helper/ThemeToggleButton";
import { auth } from "../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { getCurrentUser } from "../lib/sdk";
import { writeAuditLog } from "../lib/audit";
import HeroBanner from "../components/HeroBanner";
import { getHeroForPath } from "../utils/heroConfig";
import AIAssistant from "../components/assistant/AIAssistant";
import { useMessages } from "../context/MessagesContext.jsx";


export default function MasterLayout({ children }) {
  return <MasterLayoutInner>{children}</MasterLayoutInner>;
}

function MasterLayoutInner({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [sidebarActive, setSidebarActive] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [openKeys, setOpenKeys] = useState({});
  const [isAdmin, setIsAdmin] = useState(() => (sessionStorage.getItem("role") === "admin"));
  const [tenantId, setTenantId] = useState(() => sessionStorage.getItem("tenantId") || "vendor");
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

  // Keep role/tenant in sync when navigating (sessionStorage as simple source of truth)
  useEffect(() => {
    const role = sessionStorage.getItem("role") || "";
    const tenant = sessionStorage.getItem("tenantId") || "vendor";
    setIsAdmin(role === "admin");
    setTenantId(tenant);
  }, [location.pathname]);

  // Resolve role/tenant for current user (on mount and on auth changes)
  useEffect(() => {
    async function refreshRole(byEmail, byUid) {
      if (!byEmail && !byUid) return;
      try {
        const params = {};
        if (byEmail) params.email = byEmail;
        if (byUid) params.uid = byUid;
        const userData = await getCurrentUser(params);
        const role = userData.role || "member";
        const tenant = userData.tenantId || "vendor";
        if (byEmail) sessionStorage.setItem("userEmail", byEmail);
        if (byUid) sessionStorage.setItem("userId", byUid);
        sessionStorage.setItem("role", role);
        sessionStorage.setItem("tenantId", tenant);
        setIsAdmin(role === "admin");
        setTenantId(tenant);
      } catch {
        // keep prior
      }
    }

    // initial
    const initialEmail = auth.currentUser?.email || sessionStorage.getItem("userEmail");
    const initialUid = auth.currentUser?.uid || sessionStorage.getItem("userId");
    if (auth.currentUser) {
      // ensure session sync on first paint
      if (auth.currentUser.email) sessionStorage.setItem("userEmail", auth.currentUser.email);
      if (auth.currentUser.uid) sessionStorage.setItem("userId", auth.currentUser.uid);
      setUser(auth.currentUser);
    }
    if (initialEmail || initialUid) refreshRole(initialEmail, initialUid);

    // subscribe to auth state changes
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u || null);
      if (u) {
        // keep UID + email in session for cross-app usage
        if (u.email) sessionStorage.setItem("userEmail", u.email);
        if (u.uid) sessionStorage.setItem("userId", u.uid);
      } else {
        // signed out in this or another tab
        sessionStorage.removeItem("userId");
        sessionStorage.removeItem("userEmail");
      }
      const email = u?.email || sessionStorage.getItem("userEmail");
      const uid = u?.uid || sessionStorage.getItem("userId");
      if (email || uid) refreshRole(email, uid);
      else {
        setIsAdmin(false);
        setTenantId("vendor");
      }
    });
    return () => unsub?.();
  }, []);

  // Load tenants list for switcher (best-effort)
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/api/tenants");
        const arr = Array.isArray(data)
          ? data.map((t) => (t?.id === "public" ? { ...t, id: "vendor", name: t?.name || "Vendor" } : t))
          : [];
        const withVendor = [{ id: "vendor", name: "Vendor" }, ...arr.filter((t) => t?.id !== "vendor")];
        setTenants(withVendor);
      } catch {
        setTenants([{ id: "vendor", name: "Vendor" }]);
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
    const userEmail = auth.currentUser?.email || sessionStorage.getItem("userEmail") || null;
    const userId = auth.currentUser?.uid || sessionStorage.getItem("userId") || null;
    try {
      await writeAuditLog({ action: "LOGOUT", userEmail, userId });
    } catch {}
    try {
      await auth.signOut?.();
    } catch {}
    sessionStorage.removeItem("tenantId");
    sessionStorage.removeItem("role");
    sessionStorage.removeItem("userEmail");
    sessionStorage.removeItem("userId");
    navigate("/login", { replace: true });
  }

  // Access flags
  const isBasic = !isAdmin && tenantId === "basic";

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

        <div className="sidebar-menu-area p-0 m-0">
          <ul className="sidebar-menu" id="sidebar-menu">
            <li>
              <NavLink to="/dashboard" className={navClass}>
                <Icon icon="material-symbols:map-outline" className="menu-icon" />
                <span>All Listings</span>
              </NavLink>
            </li>

            {!isBasic && (
              <li>
                <NavLink to="/listings-vendors" className={navClass}>
                  <Icon icon="solar:document-text-outline" className="menu-icon" />
                  <span>Add Listings</span>
                </NavLink>
              </li>
            )}

            {!isBasic && (
              <li>
                <NavLink to="/listings-vendors-mine" className={navClass}>
                  <Icon icon="mdi:view-list-outline" className="menu-icon" />
                  <span>My Listings</span>
                </NavLink>
              </li>
            )}


            {!isBasic && (
              <li>
                <NavLink to="/profile-vendor" className={navClass}>
                  <Icon icon="solar:user-linear" className="menu-icon" />
                  <span>Vendor Profile</span>
                </NavLink>
              </li>
            )}

            {!isBasic && (
              <li>
                <NavLink to="/vendor-home" className={navClass}>
                  <Icon icon="mdi:view-dashboard-outline" className="menu-icon" />
                  <span>Vendor Home</span>
                </NavLink>
              </li>
            )}

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

            {/* Messages / Message Center */}
            <li>
              <NavLink to="/email" className={navClass}>
                <Icon icon="tabler:message-check" className="menu-icon" />
                <span>Message Center</span>
              </NavLink>
            </li>

            {/* My Subscriptions (available to all signed-in users; useful for basic) */}
            <li>
              <NavLink to="/subscriptions" className={navClass}>
                <Icon icon="mdi:bell-ring-outline" className="menu-icon" />
                <span>My Subscriptions</span>
              </NavLink>
            </li>

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

                {/* Tenant badge (visible to all) */}
                <span className="badge text-bg-secondary d-none d-sm-inline">Tenant: {tenantId}</span>

                {/* Quick portal/actions from Navbar.jsx */}
                {user ? (
                  <>
                    <span className="text-muted small d-none d-md-inline">{user.email}</span>
                    
                    <button className="btn btn-sm rounded-pill btn-outline-danger" onClick={handleLogout}>Logout</button>
                  </>
                ) : (
                  <>
                    <Link
                      className="btn rounded-pill border text-neutral-500 border-neutral-700 radius-8 px-12 py-6 bg-hover-primary-700 text-hover-white"
                      to="/signup/startup"
                    >
                      Startup Sign Up
                    </Link>
                    <Link
                      className="btn rounded-pill text-primary-50 hover-text-primary-200 bg-primary-500 bg-hover-primary-800 radius-8 px-12 py-6"
                      to="/login"
                    >
                      Login
                    </Link>
                  </>
                )}


                {/* Messages */}
                <MessageBell />

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
                        <h6 className="text-lg text-primary-light fw-semibold mb-2">{user?.email || "User"}</h6>
                        <span className="text-secondary-light fw-medium text-sm">{isAdmin ? "Admin" : "Member"}</span>
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
                          <Icon icon="tabler:message-check" className="icon text-xl" /> Message Center
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
        <div className="dashboard-main-body">
          {/* Contextual hero banner (avoid duplicates via config) */}
          {(() => {
            const role = sessionStorage.getItem("role") || "member";
            const hero = getHeroForPath(location.pathname, {
              isAdmin,
              tenantId,
              role,
              authed: !!user,
            });
            if (!hero) return null;
            return (
              <div className="container py-4">
                <div className="row mb-3">
                  <HeroBanner
                    title={hero.title}
                    subtitle={hero.subtitle}
                    primary={hero.primary}
                    secondary={hero.secondary}
                  />
                </div>
              </div>
            );
          })()}

          {children}
        </div>

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
      {/* Global AI assistant (vendor + basic only) */}
      <AIAssistant isAdmin={isAdmin} tenantId={tenantId} />
    </section>
  );
}

function MessageBell() {
  const { unreadCount, latestFive } = useMessages();
  return (
    <div className="dropdown">
      <button
        className="has-indicator w-40-px h-40-px bg-neutral-200 rounded-circle d-flex justify-content-center align-items-center position-relative"
        type="button"
        data-bs-toggle="dropdown"
        aria-expanded="false"
        aria-label="Open messages"
      >
        <Icon icon="mage:email" className="text-primary-light text-xl" />
        {unreadCount > 0 && (
          <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
            {Math.min(99, unreadCount)}
          </span>
        )}
      </button>
      <div className="dropdown-menu to-top dropdown-menu-lg p-0">
        <div className="m-16 py-12 px-16 radius-8 bg-primary-50 mb-16 d-flex align-items-center justify-content-between gap-2">
          <div>
            <h6 className="text-lg text-primary-light fw-semibold mb-0">Messages</h6>
          </div>
          <span className="text-primary-600 fw-semibold text-lg w-40-px h-40-px rounded-circle bg-base d-flex justify-content-center align-items-center">
            {unreadCount}
          </span>
        </div>
        <div className="list-group list-group-flush px-2">
          {latestFive.length === 0 && (
            <div className="text-center text-muted small py-2">No messages</div>
          )}
          {latestFive.map((t) => (
            <Link key={t.id} className="list-group-item list-group-item-action d-flex align-items-start gap-2" to={`/view-details?tid=${encodeURIComponent(t.id)}`}>
              <div className={`badge ${t.read ? 'text-bg-light' : 'text-bg-primary'}`} style={{ alignSelf: 'center' }}>
                {t.read ? 'read' : 'new'}
              </div>
              <div>
                <div className="fw-semibold text-truncate" style={{ maxWidth: 260 }}>{t.subject || 'Message'}</div>
                <div className="small text-muted text-truncate" style={{ maxWidth: 260 }}>{t.lastMessage?.snippet || t.messages?.[t.messages?.length-1]?.content || ''}</div>
              </div>
            </Link>
          ))}
        </div>
        <div className="text-center py-12 px-16">
          <Link to="/email" className="text-primary-600 fw-semibold text-md">
            See all messages
          </Link>
        </div>
      </div>
    </div>
  );
}
