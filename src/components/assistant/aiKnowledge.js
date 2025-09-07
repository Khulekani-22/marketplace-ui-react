// Simple knowledge base and guardrails for the in-app assistant.
// Scope: vendor and basic tenant only. Excludes admin and restricted areas.

const RESTRICTED_KEYWORDS = [
  // Admin areas
  "admin", "admin portal", "user roles", "roles", "audit logs", "approval",
  "listings approval", "vendor approval", "superadmin", "moderation",
  // Sensitive ops
  "delete user", "elevate", "privilege", "permission", "billing", "payout",
  // Internal routes markers
  "/listings-admin", "/admin/users", "/audit-logs", "/profile-vendor-admin",
];

const TOPICS = [
  {
    id: "add-listing",
    match: ["add listing", "submit listing", "create listing", "new listing", "vendor listing"],
    answer:
      "Vendors can add listings from ‘Add Listings’. Fill in the title, description, category, pricing and contact details, then submit. You can edit later from ‘My Listings’.",
  },
  {
    id: "my-listings",
    match: ["my listings", "manage listings", "edit listing", "update listing", "draft"],
    answer: "Open 'My Listings' to view, edit, or unpublish your vendor listings. Use the action menu on each row to edit details or change visibility.",
  },
  {
    id: "vendor-profile",
    match: ["vendor profile", "company profile", "profile vendor", "business profile"],
    answer:
      "Go to ‘Vendor Profile’ to update company name, bio, logo, categories, and contact links. Changes reflect on your public vendor page.",
  },
  {
    id: "vendor-home",
    match: ["vendor home", "dashboard", "vendor dashboard"],
    answer:
      "The Vendor Home highlights shortcuts to create or manage listings, shows quick stats, and links to your profile and support resources.",
  },
  {
    id: "startup-profile",
    match: ["startup profile", "tenant profile", "basic profile"],
    answer:
      "In ‘Startup Profile’, basic tenants can maintain organization details and preferences. Use this to keep your discovery profile up to date.",
  },
  {
    id: "subscriptions",
    match: ["subscriptions", "follow", "alerts", "notifications", "subscribe"],
    answer:
      "‘My Subscriptions’ lets you follow listings or categories and receive updates. You can unsubscribe at any time from the same page.",
  },
  {
    id: "academy",
    match: ["sloane academy", "academy", "training", "learn"],
    answer:
      "Visit ‘Sloane Academy’ for learning modules and resources. Browse courses and track your progress from the academy page.",
  },
  {
    id: "support",
    match: ["support", "help", "contact", "assist"],
    answer:
      "For help, go to ‘Support’. You can browse FAQs or submit a ticket if you need further assistance.",
  },
  {
    id: "search",
    match: ["search", "find", "filter", "browse"],
    answer:
      "Use the search bar to find listings by keyword. Apply filters such as category or price to narrow down results.",
  },
  {
    id: "tenant-switch",
    match: ["tenant", "switch tenant", "change tenant", "select tenant"],
    answer:
      "Admins can switch the active tenant using the tenant selector in the top bar. Basic tenants and vendors typically operate under the default ‘vendor’ tenant.",
  },
];

function normalize(text = "") {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

export function classifyScope(question, { isAdmin, tenantId }) {
  const q = normalize(question);
  // If user is not admin, any admin-related question is restricted
  const mentionsRestricted = RESTRICTED_KEYWORDS.some((k) => q.includes(k));
  if (mentionsRestricted) {
    return { allowed: false, reason: "This topic is restricted to admins or elevated roles." };
  }
  // Assistant is limited to vendor and basic tenant topics
  const allowedTenants = new Set(["vendor", "basic", "public", ""]);
  if (!allowedTenants.has((tenantId || "").toLowerCase()) && !isAdmin) {
    return { allowed: false, reason: "Assistant is limited to vendor and basic tenant features." };
  }
  return { allowed: true };
}

export function findAnswer(question) {
  const q = normalize(question);
  for (const topic of TOPICS) {
    if (topic.match.some((m) => q.includes(m))) {
      return topic.answer;
    }
  }
  return null;
}

export function answerQuestion(question, context = {}) {
  const scope = classifyScope(question, context);
  if (!scope.allowed) {
    return {
      type: "refusal",
      text:
        scope.reason +
        " I can help with vendor and basic tenant features like: Add Listings, My Listings, Vendor Profile, Startup Profile, Subscriptions, Sloane Academy, Support, and Search.",
    };
  }
  const found = findAnswer(question);
  if (found) {
    return { type: "answer", text: found };
  }
  return {
    type: "fallback",
    text:
      "I couldn’t find a direct match. I can help with vendor and basic tenant features such as adding or managing listings, updating profiles, using subscriptions, academy, support, and search. Please rephrase or include specific feature names.",
  };
}

export const assistantSuggestions = [
  "How do I add a listing?",
  "Where can I edit my listings?",
  "How do I update my vendor profile?",
  "What is Sloane Academy?",
  "How do I manage subscriptions?",
  "How do I contact support?",
];
