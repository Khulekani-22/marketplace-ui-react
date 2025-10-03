// Map routes to hero content. Export a resolver to keep logic centralized.

function make(title, subtitle, primary, secondary, extras = {}) {
  return { title, subtitle, primary, secondary, ...extras };
}

const HERO_IMAGES = {
  default: {
    src: "https://www.22onsloane.co/wp-content/uploads/2025/10/fashion-designer-team-and-people-with-smile-in-po-2025-04-06-08-12-04-utc-scaled.jpg",
    alt: "Business leaders collaborating around laptops",
  },
  marketplace: {
    src: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1600&q=80",
    alt: "Startup founders celebrating a new opportunity",
  },
  marketplaceVendor: {
    src: "https://www.22onsloane.co/wp-content/uploads/2025/09/happy-team-building-and-portrait-of-business-peop-2025-04-06-07-40-59-utc-scaled.jpg",
    alt: "Vendors reviewing customer insights together",
  },
  marketplaceStartup: {
    src: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1600&q=80",
    alt: "Startup team strategising next steps",
  },
  vendor: {
    src: "https://www.22onsloane.co/wp-content/uploads/2025/10/meeting-proposal-and-tablet-with-business-women-i-2025-04-05-12-14-26-utc-scaled.jpg",
    alt: "Vendor team collaborating in a shared workspace",
  },
  listing: {
    src: "https://www.22onsloane.co/wp-content/uploads/2025/10/pleased-dark-skinned-male-person-demonstrating-pap-2025-03-09-02-46-42-utc-scaled.jpg",
    alt: "Product managers planning a new listing",
  },
  profileVendor: {
    src: "https://www.22onsloane.co/wp-content/uploads/2025/09/happy-team-building-and-portrait-of-business-peop-2025-04-06-07-40-59-utc-scaled.jpg",
    alt: "Professional founder portrait session",
  },
  profileStartup: {
    src: "https://www.22onsloane.co/wp-content/uploads/2025/09/happy-team-building-and-portrait-of-business-peop-2025-04-06-07-40-59-utc-scaled.jpg",
    alt: "Startup squad aligning on growth plan",
  },
  admin: {
    src: "https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=1600&q=80",
    alt: "Administrator analysing platform dashboards",
  },
  learning: {
    src: "https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?auto=format&fit=crop&w=1600&q=80",
    alt: "Entrepreneur taking notes during an online course",
  },
  sloaneAcademy: {
    src: "https://www.22onsloane.co/wp-content/uploads/2025/09/business-people-mentor-and-applause-for-presentat-2025-04-06-05-18-45-utc-scaled.jpg",
    alt: "Facilitator applauded during a Sloane Academy session",
  },
  accessCapital: {
    src: "https://www.22onsloane.co/wp-content/uploads/2025/09/business-people-laptop-or-discussion-in-meeting-i-2025-04-06-10-32-37-utc-1-scaled.jpg",
    alt: "Founder celebrating a funding milestone",
  },
  emailCenter: {
    src: "https://www.22onsloane.co/wp-content/uploads/2025/10/woman-thinking-or-business-tablet-in-coworking-sp-2025-04-05-16-37-53-utc-scaled.jpg",
    alt: "Team coordinating messages inside Sloane Hub",
  },
  subscriptions: {
    src: "https://www.22onsloane.co/wp-content/uploads/2025/10/office-black-woman-and-smile-with-tablet-for-typi-2025-04-05-12-14-43-utc-scaled.jpg",
    alt: "Entrepreneur managing marketplace alerts",
  },
  dashboard: {
    src: "https://www.22onsloane.co/wp-content/uploads/2025/10/envato-labs-image-edit-13.png",
    alt: "Marketplace team reviewing performance metrics",
  },
  wallet: {
    src: "https://www.22onsloane.co/wp-content/uploads/2025/10/reading-phone-and-business-with-black-woman-in-ci-2025-04-05-12-15-22-utc-scaled.jpg",
    alt: "Entrepreneur managing financial transactions and payments",
  },
  support: {
    src: "https://www.22onsloane.co/wp-content/uploads/2025/10/business-people-tablet-and-men-in-city-smile-or-2025-04-05-12-14-19-utc-scaled.jpg",
    alt: "Support team helping customers with their questions",
  },
  adminListings: {
    src: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1600&q=80",
    alt: "Administrator reviewing and moderating marketplace listings",
  },
  adminAcademy: {
    src: "https://www.22onsloane.co/wp-content/uploads/2025/09/business-people-mentor-and-applause-for-presentat-2025-04-06-05-18-45-utc-scaled.jpg",
    alt: "Administrator managing Sloane Academy programs and content",
  },
  adminVendorProfile: {
    src: "https://www.22onsloane.co/wp-content/uploads/2025/10/collaboration-colleagues-and-people-with-tablet-2025-04-06-12-20-05-utc-scaled.jpg",
    alt: "Administrator reviewing vendor profile applications",
  },
  auth: {
    src: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1600&q=80",
    alt: "Founder logging back into their digital workspace",
  },
};

function heroImage(key) {
  const base = HERO_IMAGES[key] || HERO_IMAGES.default;
  return { ...base };
}

function heroKicker(icon, value, label) {
  return { icon, value, label };
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
  {
    test: /^\/?dashboard$/,
    hero: (ctx) => {
      const state = classify(ctx);
      if (state.isAdmin) {
        return make(
          "Admin Command Center",
          "Review platform health, audit activity, and resolve moderation tasks.",
          { to: "/listings-admin", label: "Open Admin Console", icon: "mdi:shield-check-outline" },
          { to: "/admin/users", label: "Manage Users", icon: "mdi:account-cog-outline" },
          {
            kicker: heroKicker("mdi:view-dashboard-outline", "Admin", "Operational insights refreshed daily."),
            image: heroImage("dashboard"),
          }
        );
      }
      if (state.isVendor) {
        return make(
          "Unlocking Growth",
          "Find the right software or services for your business, all in one place.",
          { to: "/listings-vendors", label: "Add Listings", icon: "mdi:store-outline" },
          { to: "/listings-vendors-mine", label: "My Listings", icon: "mdi:view-list-outline" },
          {
            kicker: heroKicker("mdi:chart-line", "Access To Market", "| Logged in as: Vendor"),
            image: heroImage("dashboard"),
          }
        );
      }
      if (state.isBasic) {
        return make(
          "Startup Dashboard",
          "Review recommendations, manage subscriptions, and prep investor outreach.",
          { to: "/marketplace", label: "Discover Vendors", icon: "mdi:rocket-launch-outline" },
          { to: "/access-capital", label: "Access Capital", icon: "mdi:finance" },
          {
            kicker: heroKicker("mdi:view-dashboard-outline", "Startup", "Curated actions for your growth."),
            image: heroImage("dashboard"),
          }
        );
      }
      const primary = state.authed
        ? { to: "/marketplace", label: "Explore Marketplace", icon: "mdi:store-outline" }
        : { to: "/login", label: "Sign In", icon: "mdi:login" };
      const secondary = state.authed
        ? { to: "/subscriptions", label: "Manage Subscriptions", icon: "mdi:bell-ring-outline" }
        : { to: "/signup/startup", label: "Create Account", icon: "mdi:account-plus-outline" };
      return make(
        "Sloane Hub Dashboard",
        "Monitor marketplace activity and learning progress across the platform.",
        primary,
        secondary,
        {
          kicker: heroKicker("mdi:view-dashboard-outline", "Workspace", "Always-on insights for your team."),
          image: heroImage("dashboard"),
        }
      );
    },
  },
  { test: /^\/?listings-admin$/, hero: (ctx) => {
      const state = classify(ctx);
      if (state.isAdmin) {
        return make(
          "Admin: Listings Management",
          "Review, approve, and moderate marketplace listings for quality and compliance.",
          { to: "/listings-admin", label: "Review Listings", icon: "mdi:clipboard-check-outline" },
          { to: "/admin/users", label: "Manage Users", icon: "mdi:account-cog-outline" },
          {
            kicker: heroKicker("mdi:shield-check-outline", "Moderation", "Ensure marketplace quality and safety."),
            image: heroImage("adminListings"),
          }
        );
      }
      return make(
        "Access Restricted",
        "This area is restricted to platform administrators.",
        { to: "/dashboard", label: "Back to Dashboard", icon: "mdi:home-outline" },
        { to: "/login", label: "Sign In", icon: "mdi:login" },
        {
          kicker: heroKicker("mdi:lock-outline", "Admin Only", "Contact support for access requests."),
          image: heroImage("admin"),
        }
      );
    }
  },
  { test: /^\/?profile-vendor-admin$/, hero: (ctx) => {
      const state = classify(ctx);
      if (state.isAdmin) {
        return make(
          "Admin: Vendor Profile Management",
          "Review vendor applications, verify credentials, and manage vendor status.",
          { to: "/profile-vendor-admin", label: "Review Profiles", icon: "mdi:account-check-outline" },
          { to: "/listings-admin", label: "Listings Admin", icon: "mdi:clipboard-list-outline" },
          {
            kicker: heroKicker("mdi:shield-account-outline", "Verification", "Maintain vendor quality standards."),
            image: heroImage("adminVendorProfile"),
          }
        );
      }
      return make(
        "Access Restricted",
        "This area is restricted to platform administrators.",
        { to: "/dashboard", label: "Back to Dashboard", icon: "mdi:home-outline" },
        { to: "/login", label: "Sign In", icon: "mdi:login" },
        {
          kicker: heroKicker("mdi:lock-outline", "Admin Only", "Contact support for access requests."),
          image: heroImage("admin"),
        }
      );
    }
  },
  {
    test: /^\/?access-capital$/,
    hero: (ctx) => {
      const { authed } = classify(ctx);
      return make(
        "Funding Hub",
        "Identify aligned investors, log outreach, and keep your funding pipeline organised.",
        authed
          ? { to: "/access-capital#pipeline", label: "View Pipeline", icon: "mdi:clipboard-list-outline" }
          : { to: "/login", label: "Sign In to Track Deals", icon: "mdi:login" },
        authed
          ? { to: "/email", label: "Contact Investors", icon: "mdi:email-send-outline" }
          : { to: "/signup/startup", label: "Join Sloane Hub", icon: "mdi:account-plus-outline" },
        {
          kicker: heroKicker("mdi:cash-fast", "Capital", "Unlock warm intros from the Sloane network."),
          image: heroImage("accessCapital"),
        }
      );
    },
  },
  {
    test: /^\/?email$/,
    hero: (ctx) => {
      const { authed } = classify(ctx);
      return make(
        "Message Center",
        "Centralise investor updates, vendor notes, and team intros in one inbox.",
        authed
          ? { to: "/email?compose=1", label: "Compose Message", icon: "mdi:email-edit-outline" }
          : { to: "/login", label: "Sign In", icon: "mdi:login" },
        authed
          ? { to: "/subscriptions", label: "Manage Alerts", icon: "mdi:bell-ring-outline" }
          : { to: "/signup/startup", label: "Join Sloane Hub", icon: "mdi:account-plus-outline" },
        {
          kicker: heroKicker("mdi:email-outline", "Inbox", "Stay on top of partner communication."),
          image: heroImage("emailCenter"),
        }
      );
    },
  },
  {
    test: /^\/?wallet$/,
    hero: (ctx) => {
      const { authed, isAdmin, isVendor, isBasic } = classify(ctx);
      if (!authed) {
        return make(
          "Digital Wallet",
          "Sign in to manage your payments, transactions, and financial activity.",
          { to: "/login", label: "Sign In", icon: "mdi:login" },
          { to: "/signup/startup", label: "Create Account", icon: "mdi:account-plus-outline" },
          {
            kicker: heroKicker("mdi:wallet-outline", "Secure", "Encrypted payments backed by industry standards."),
            image: heroImage("wallet"),
          }
        );
      }
      if (isAdmin) {
        return make(
          "Admin: Financial Overview",
          "Monitor platform transactions, fees, and vendor payouts.",
          { to: "/wallet#transactions", label: "View Transactions", icon: "mdi:bank-transfer-outline" },
          { to: "/wallet#analytics", label: "Financial Analytics", icon: "mdi:chart-line" },
          {
            kicker: heroKicker("mdi:finance", "Admin", "Platform financial health and compliance."),
            image: heroImage("wallet"),
          }
        );
      }
      if (isVendor) {
        return make(
          "Vendor Wallet",
          "Track earnings, manage payouts, and monitor transaction history.",
          { to: "/wallet#earnings", label: "View Earnings", icon: "mdi:cash-fast" },
          { to: "/wallet#payouts", label: "Request Payout", icon: "mdi:bank-transfer-out" },
          {
            kicker: heroKicker("mdi:trending-up", "Revenue", "Track your marketplace performance."),
            image: heroImage("wallet"),
          }
        );
      }
      return make(
        "Startup Wallet",
        "Manage payments to vendors, track spending, and review transaction history.",
        { to: "/wallet#payments", label: "Payment History", icon: "mdi:credit-card-outline" },
        { to: "/wallet#subscriptions", label: "Manage Subscriptions", icon: "mdi:bell-ring-outline" },
        {
          kicker: heroKicker("mdi:account-cash-outline", "Payments", "Streamlined vendor payments and tracking."),
          image: heroImage("wallet"),
        }
      );
    },
  },
  {
    test: /^\/?support$/,
    hero: (ctx) => {
      const { authed } = classify(ctx);
      return make(
        "Support Center",
        "Get help with your account, troubleshoot issues, and access documentation.",
        { to: "/support#faq", label: "Browse FAQ", icon: "mdi:help-circle-outline" },
        authed
          ? { to: "/support#tickets", label: "My Support Tickets", icon: "mdi:ticket-outline" }
          : { to: "/login", label: "Sign In for Support", icon: "mdi:login" },
        {
          kicker: heroKicker("mdi:lifebuoy", "Help", "Expert support when you need it most."),
          image: heroImage("support"),
        }
      );
    },
  },
  {
    test: /^\/?subscriptions$/,
    hero: (ctx) => {
      const state = classify(ctx);
      const primary = state.isVendor
        ? { to: "/listings-vendors", label: "Manage Listings", icon: "mdi:store-outline" }
        : { to: "/marketplace", label: "Discover Services", icon: "mdi:store-search-outline" };
      const secondary = state.authed
        ? { to: "/subscriptions", label: "Refresh", icon: "mdi:refresh" }
        : { to: "/login", label: "Sign In", icon: "mdi:login" };
      return make(
        "My Subscriptions",
        "Manage vendor updates, saved services, and upcoming sessions.",
        primary,
        secondary,
        {
          kicker: heroKicker("mdi:bell-ring-outline", "Alerts", "Stay notified when vendors update offerings."),
          image: heroImage("subscriptions"),
        }
      );
    },
  },

  // Marketplace
  {
    test: /^\/?marketplace$/,
    hero: (ctx) => {
      const { isVendor, isBasic, authed } = classify(ctx);
      if (isVendor) {
        return make(
          "Marketplace: Discover Services",
          "Showcase your offerings and connect with startups across Africa.",
          { to: "/listings-vendors", label: "List a Service" },
          { to: "/listings-vendors-mine", label: "My Listings" },
          {
            kicker: heroKicker("mdi:handshake-outline", "Vendor", "leads ready for outreach this week."),
            image: heroImage("marketplaceVendor"),
          }
        );
      }
      if (isBasic) {
        return make(
          "Explore Trusted Vendors",
          "Find vetted partners to accelerate your startup’s growth.",
          { to: "/marketplace", label: "Browse Market" },
          { to: "/signup/vendor", label: "Become a Vendor" },
          {
            kicker: heroKicker("mdi:rocket-launch-outline", "Startup", "matches waiting in your market feed."),
            image: heroImage("marketplaceStartup"),
          }
        );
      }
      return make(
        "Marketplace: Discover Services",
        "Browse vetted SMME services across Africa and connect with trusted vendors.",
        { to: "/marketplace", label: "Browse Market" },
        { to: authed ? "/subscriptions" : "/signup/startup", label: authed ? "My Subscriptions" : "Join Now" },
        {
          kicker: heroKicker("mdi:compass-outline", "Marketplace", "connects you to trusted vendors across Africa."),
          image: heroImage("marketplace"),
        }
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
          { to: "/marketplace", label: "Back to Market" },
          {
            kicker: heroKicker("mdi:clipboard-text-outline", "Listing", "insights to increase conversions."),
            image: heroImage("listing"),
          }
        );
      }
      if (isBasic) {
        return make(
          "Listing Details",
          "Evaluate services, compare options, and engage with confidence.",
          { to: "/marketplace", label: "Back to Market" },
          { to: "/email", label: "Contact Vendor" },
          {
            kicker: heroKicker("mdi:playlist-check", "Shortlist", "Compare offers before you engage."),
            image: heroImage("marketplaceStartup"),
          }
        );
      }
      return make(
        "Listing Details",
        "Review service details, pricing and vendor information before engaging.",
        { to: "/marketplace", label: "Back to Market" },
        { to: "/email", label: "Contact Vendor" },
        {
          kicker: heroKicker("mdi:card-text", "Details", "Review scope, pricing, and track records."),
          image: heroImage("marketplace"),
        }
      );
    },
  },

  // Vendor portal
  {
    test: /^\/?vendor-home$/,
    hero: make(
      "Vendor Portal",
      "Manage your learning, listings, engagement with clients and more.",
      { to: "/listings-vendors", label: "Submit Listings" },
      { to: "/listings-vendors-mine", label: "My Listings" },
      {
        kicker: heroKicker("mdi:home-city-outline", "Vendor HQ", "| Monitor learning, performance, and reviews."),
        image: heroImage("vendor"),
      }
    ),
  },
  {
    test: /^\/?listings-vendors$/,
    hero: make(
      "Vendor New Listing",
      "Draft locally, submit to our review team, and check your catalogue.",
      { to: "/listings-vendors-mine", label: "My Listings" },
      { to: "/vendor-home", label: "Vendor Home" },
      {
        kicker: heroKicker("mdi:cloud-upload-outline", "Upload Your Listings", "| Add rich detail to stand out in search."),
        image: heroImage("listing"),
      }
    ),
  },
  {
    test: /^\/?listings-vendors-mine$/,
    hero: make(
      "Vendor Listings",
      "Track status, edit content, and highlight featured services.",
      { to: "/listings-vendors", label: "Add New Listing" },
      { to: "/vendor-home", label: "Vendor Home" },
      {
        kicker: heroKicker("mdi:briefcase-variant-outline", "Your Catalogue", " | Manage your listings and get support."),
        image: heroImage("listing"),
      }
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
          { to: "/vendor-home", label: "Vendor Home" },
          {
            kicker: heroKicker("mdi:shield-check-outline", "Credibility", "Complete your story to convert faster."),
            image: heroImage("profileVendor"),
          }
        );
      }
      if (isBasic || authed) {
        return make(
          "Startup Profile",
          "Complete your startup profile to get better vendor matches.",
          { to: "/profile-startup", label: "Edit Profile" },
          { to: "/marketplace", label: "Find Vendors" },
          {
            kicker: heroKicker("mdi:chart-timeline-variant", "Growth", "Share traction to power smarter matching."),
            image: heroImage("profileStartup"),
          }
        );
      }
      return make(
        "Profile",
        "Sign in to manage your profile and preferences.",
        { to: "/login", label: "Login" },
        { to: "/signup/startup", label: "Sign Up" },
        {
          kicker: heroKicker("mdi:account-arrow-right-outline", "Members", "Sign in to unlock personalised recommendations."),
          image: heroImage("auth"),
        }
      );
    },
  },

  // Admin portal (dedicated pages already have bespoke banners; these are fallbacks)
  {
    test: /^\/?admin\/users$/,
    hero: make(
      "Admin: User Roles",
      "Manage access across vendors, startups, and administrators.",
      { to: "/admin/users", label: "Manage Users", icon: "mdi:account-cog-outline" },
      { to: "/listings-admin", label: "Listings Admin", icon: "mdi:clipboard-list-outline" },
      {
        kicker: heroKicker("mdi:shield-account-outline", "Governance", "Keep roles, access, and safety compliant."),
        image: heroImage("admin"),
      }
    ),
  },

  // Profiles and accounts
  {
    test: /^\/?profile-startup$/,
    hero: make(
      "Startup Profile",
      "Tell vendors what you need; discover solutions tailored to your goals.",
      { to: "/marketplace", label: "Find Vendors" },
      { to: "/profile-startup", label: "Edit Profile" },
      {
        kicker: heroKicker("mdi:target-account", "Matching", "Complete data for sharper, AI-assisted recommendations."),
        image: heroImage("profileStartup"),
      }
    ),
  },
  {
    test: /^\/?signup\/vendor$/,
    hero: make(
      "Become a Vendor",
      "Join the GEN Africa marketplace and reach startups across the continent.",
      { to: "/signup/vendor", label: "Vendor Sign Up" },
      { to: "/login", label: "Login" },
      {
        kicker: heroKicker("mdi:account-plus-outline", "Vendors", "Join the continent's largest SMME network."),
        image: heroImage("vendor"),
      }
    ),
  },
  {
    test: /^\/?signup\/startup$/,
    hero: make(
      "Join as a Startup",
      "Access curated vendors and accelerate your growth.",
      { to: "/signup/startup", label: "Startup Sign Up" },
      { to: "/login", label: "Login" },
      {
        kicker: heroKicker("mdi:rocket-launch-outline", "Startups", "Unlock curated services, mentors, and funding."),
        image: heroImage("marketplaceStartup"),
      }
    ),
  },
  {
    test: /^\/?login$/,
    hero: make(
      "Welcome Back",
      "Sign in to manage your listings, profiles, and subscriptions.",
      { to: "/login", label: "Login" },
      { to: "/signup/startup", label: "Sign Up" },
      {
        kicker: heroKicker("mdi:lock-check-outline", "Welcome", "Secure access backed by 22 On Sloane."),
        image: heroImage("auth"),
      }
    ),
  },

  // Learning
  {
    test: /^\/?sloane-academy-admin$/,
    hero: (ctx) => {
      const state = classify(ctx);
      if (state.isAdmin) {
        return make(
          "Admin: Sloane Academy Management",
          "Manage courses, track learner progress, and curate educational content.",
          { to: "/sloane-academy-admin#courses", label: "Manage Courses", icon: "mdi:school-outline" },
          { to: "/sloane-academy-admin#analytics", label: "Learning Analytics", icon: "mdi:chart-box-outline" },
          {
            kicker: heroKicker("mdi:book-education-outline", "Education", "Empower African entrepreneurs through learning."),
            image: heroImage("adminAcademy"),
          }
        );
      }
      return make(
        "Access Restricted",
        "This area is restricted to platform administrators.",
        { to: "/sloane-academy", label: "Browse Courses", icon: "mdi:school-outline" },
        { to: "/login", label: "Sign In", icon: "mdi:login" },
        {
          kicker: heroKicker("mdi:lock-outline", "Admin Only", "Contact support for access requests."),
          image: heroImage("admin"),
        }
      );
    },
  },
  {
    test: /^\/?sloane-academy(?:$|\/.+)?$/,
    hero: () =>
      make(
        "Sloane Academy",
        "Reach expert-led programmes, track your progress, and unlock partner resources.",
        { to: "/sloane-academy#sloane-cohort-selector", label: "Browse programmes" },
        { to: "/sloane-academy#sloane-progress", label: "View my progress" },
        {
          kicker: heroKicker("mdi:school-outline", "Academy", "Curated learning journeys for African operators."),
          image: heroImage("sloaneAcademy"),
        }
      ),
  },
  {
    test: /^\/?lms(?:$|\/.+)/,
    hero: (ctx) => {
      const { authed, isBasic } = classify(ctx);
      return make(
        "Sloane Academy",
        "Upskill with practical courses for startups and vendors.",
        { to: "/lms", label: "Explore Courses" },
        { to: authed ? (isBasic ? "/signup/vendor" : "/subscriptions") : "/login", label: authed ? (isBasic ? "Become a Vendor" : "My Subscriptions") : "Login" },
        {
          kicker: heroKicker("mdi:school-outline", "Courses", "Fresh micro-lessons drop every week."),
          image: heroImage("learning"),
        }
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
          { to: "/admin/users", label: "Manage Users" },
          {
            kicker: heroKicker("mdi:shield-account-outline", "Admin", "Oversee health, compliance, and engagement."),
            image: heroImage("admin"),
          }
        );
      }
      if (isVendor) {
        return make(
          "Welcome, Vendor",
          "Reach startups across Africa through the GEN Africa marketplace.",
          { to: "/listings-vendors", label: "Add Listing" },
          { to: "/listings-vendors-mine", label: "My Listings" },
          {
            kicker: heroKicker("mdi:storefront-outline", "Vendor", "Show up where buyers are actively searching."),
            image: heroImage("vendor"),
          }
        );
      }
      if (isBasic) {
        return make(
          "Welcome, Startup",
          "Discover solutions, track opportunities, and learn with Sloane Academy.",
          { to: "/marketplace", label: "Find Vendors" },
          { to: "/signup/vendor", label: "Become a Vendor" },
          {
            kicker: heroKicker("mdi:rocket-launch-outline", "Startup", "Discover trusted services and funding."),
            image: heroImage("marketplaceStartup"),
          }
        );
      }
      return make(
        "Discover The African SMME Marketplace",
        "Access the AfCFTA SMME marketplace backed by GEN Africa for safety and convenience.",
        { to: "/marketplace", label: "Browse Listings" },
        { to: authed ? "/subscriptions" : "/faq", label: authed ? "My Subscriptions" : "Get Help" },
        {
          kicker: heroKicker("mdi:earth", "Africa", "Entrepreneurs building the continent's future."),
          image: heroImage("default"),
        }
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
