// Map routes to hero content. Export a resolver to keep logic centralized.

function make(title, subtitle, primary, secondary) {
  return { title, subtitle, primary, secondary };
}

function classify(ctx = {}) {
  const authed = !!ctx.authed;
  const isAdmin = !!ctx.isAdmin;
  const tenantId = ctx.tenantId || "vendor";
  const isBasic = !isAdmin && tenantId === "basic" && authed;
  const isVendor = !isAdmin && tenantId !== "basic" && authed;
  return { authed, isAdmin, isBasic, isVendor, tenantId };
}

// Rules are evaluated in order; first match wins.
const RULES = [
  // Avoid duplicates on pages that already include a banner
  { test: /^\/?dashboard$/, hero: null },
  { test: /^\/?listings-admin$/, hero: null },
  { test: /^\/?profile-vendor-admin$/, hero: null },

  // Marketplace
  {
    test: /^\/?marketplace$/,
    hero: (ctx) => {
      const { isAdmin, isVendor, isBasic, authed } = classify(ctx);
      if (isVendor) {
        return make(
          "Marketplace: Discover Services",
          "Showcase your offerings and connect with startups across Africa.",
          { to: "/listings-vendors", label: "List a Service" },
          { to: "/listings-vendors-mine", label: "My Listings" }
        );
      }
      if (isBasic) {
        return make(
          "Explore Trusted Vendors",
          "Find vetted partners to accelerate your startup’s growth.",
          { to: "/marketplace", label: "Browse Market" },
          { to: "/signup/vendor", label: "Become a Vendor" }
        );
      }
      return make(
        "Marketplace: Discover Services",
        "Browse vetted SMME services across Africa and connect with trusted vendors.",
        { to: "/marketplace", label: "Browse Market" },
        { to: authed ? "/subscriptions" : "/signup/startup", label: authed ? "My Subscriptions" : "Join Now" }
      );
    },
  },
  {
    test: /^\/?marketplace-details/,
    hero: (ctx) => {
      const { isVendor, isBasic } = classify(ctx);
      if (isVendor) {
        return make(
          "Listing Details",
          "Keep listings accurate and compelling to increase conversions.",
          { to: "/listings-vendors-mine", label: "Edit My Listings" },
          { to: "/marketplace", label: "Back to Market" }
        );
      }
      if (isBasic) {
        return make(
          "Listing Details",
          "Evaluate services, compare options, and engage with confidence.",
          { to: "/marketplace", label: "Back to Market" },
          { to: "/email", label: "Contact Vendor" }
        );
      }
      return make(
        "Listing Details",
        "Review service details, pricing and vendor information before engaging.",
        { to: "/marketplace", label: "Back to Market" },
        { to: "/email", label: "Contact Vendor" }
      );
    },
  },

  // Vendor portal
  {
    test: /^\/?vendor-home$/,
    hero: make(
      "Vendor Portal",
      "Manage your store, listings, and engagement with startups.",
      { to: "/listings-vendors", label: "Submit Listings" },
      { to: "/listings-vendors-mine", label: "My Listings" }
    ),
  },
  {
    test: /^\/?listings-vendors$/,
    hero: make(
      "Vendor: Submit Listings",
      "Draft locally, save checkpoints to the server, and publish when ready.",
      { to: "/listings-vendors-mine", label: "My Listings" },
      { to: "/vendor-home", label: "Vendor Home" }
    ),
  },
  {
    test: /^\/?listings-vendors-mine$/,
    hero: make(
      "Vendor: My Listings",
      "Track status, edit content, and highlight featured services.",
      { to: "/listings-vendors", label: "Add New Listing" },
      { to: "/vendor-home", label: "Vendor Home" }
    ),
  },
  {
    test: /^\/?profile-vendor$/,
    hero: (ctx) => {
      const { authed, isVendor, isBasic } = classify(ctx);
      if (isVendor) {
        return make(
          "Vendor Profile",
          "Keep your company profile current to build trust with buyers.",
          { to: "/profile-vendor", label: "Edit Profile" },
          { to: "/vendor-home", label: "Vendor Home" }
        );
      }
      if (isBasic || authed) {
        return make(
          "Startup Profile",
          "Complete your startup profile to get better vendor matches.",
          { to: "/profile-startup", label: "Edit Profile" },
          { to: "/marketplace", label: "Find Vendors" }
        );
      }
      return make(
        "Profile",
        "Sign in to manage your profile and preferences.",
        { to: "/login", label: "Login" },
        { to: "/signup/startup", label: "Sign Up" }
      );
    },
  },

  // Admin portal (dedicated pages already have bespoke banners; these are fallbacks)
  {
    test: /^\/?admin\/users$/,
    hero: make(
      "Admin: User Roles",
      "Manage access across vendors, startups, and administrators.",
      { to: "/admin/users", label: "Manage Users" },
      { to: "/listings-admin", label: "Listings Admin" }
    ),
  },

  // Profiles and accounts
  {
    test: /^\/?profile-startup$/,
    hero: make(
      "Startup Profile",
      "Tell vendors what you need; discover solutions tailored to your goals.",
      { to: "/marketplace", label: "Find Vendors" },
      { to: "/profile-startup", label: "Edit Profile" }
    ),
  },
  {
    test: /^\/?signup\/vendor$/,
    hero: make(
      "Become a Vendor",
      "Join the GEN Africa marketplace and reach startups across the continent.",
      { to: "/signup/vendor", label: "Vendor Sign Up" },
      { to: "/login", label: "Login" }
    ),
  },
  {
    test: /^\/?signup\/startup$/,
    hero: make(
      "Join as a Startup",
      "Access curated vendors and accelerate your growth.",
      { to: "/signup/startup", label: "Startup Sign Up" },
      { to: "/login", label: "Login" }
    ),
  },
  {
    test: /^\/?login$/,
    hero: make(
      "Welcome Back",
      "Sign in to manage your listings, profiles, and subscriptions.",
      { to: "/login", label: "Login" },
      { to: "/signup/startup", label: "Sign Up" }
    ),
  },

  // Learning
  {
    test: /^\/?lms(?:$|\/.+)/,
    hero: (ctx) => {
      const { authed, isBasic } = classify(ctx);
      return make(
        "Sloane Academy",
        "Upskill with practical courses for startups and vendors.",
        { to: "/lms", label: "Explore Courses" },
        { to: authed ? (isBasic ? "/signup/vendor" : "/subscriptions") : "/login", label: authed ? (isBasic ? "Become a Vendor" : "My Subscriptions") : "Login" }
      );
    },
  },

  // Default catch-all
  {
    test: /.*/,
    hero: (ctx) => {
      const { isAdmin, isVendor, isBasic, authed } = classify(ctx);
      if (isAdmin) {
        return make(
          "Admin Console",
          "Oversee users, vendors, and marketplace quality.",
          { to: "/listings-admin", label: "Listings Admin" },
          { to: "/admin/users", label: "Manage Users" }
        );
      }
      if (isVendor) {
        return make(
          "Welcome, Vendor",
          "Reach startups across Africa through the GEN Africa marketplace.",
          { to: "/listings-vendors", label: "Add Listing" },
          { to: "/listings-vendors-mine", label: "My Listings" }
        );
      }
      if (isBasic) {
        return make(
          "Welcome, Startup",
          "Discover solutions, track opportunities, and learn with Sloane Academy.",
          { to: "/marketplace", label: "Find Vendors" },
          { to: "/signup/vendor", label: "Become a Vendor" }
        );
      }
      return make(
        "Discover The African SMME Marketplace",
        "Access the AfCFTA SMME marketplace backed by GEN Africa for safety and convenience.",
        { to: "/marketplace", label: "Browse Listings" },
        { to: authed ? "/subscriptions" : "/faq", label: authed ? "My Subscriptions" : "Get Help" }
      );
    },
  },
];

export function getHeroForPath(pathname, ctx) {
  const path = String(pathname || "").replace(/^\//, "");
  for (const rule of RULES) {
    if (rule.test.test(path)) {
      const h = rule.hero;
      if (h == null) return null;
      return typeof h === "function" ? h(ctx) : h;
    }
  }
  return null;
}
