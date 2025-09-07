import { Router } from "express";
import z from "zod";

const router = Router();

const RESTRICTED_KEYWORDS = [
  "admin", "admin portal", "user roles", "roles", "audit logs", "approval",
  "listings approval", "vendor approval", "superadmin", "moderation",
  "/listings-admin", "/admin/users", "/audit-logs", "/profile-vendor-admin",
];

const Body = z.object({
  question: z.string().min(2).max(1000),
  tenantId: z.string().optional(),
  isAdmin: z.boolean().optional(),
  userEmail: z.string().email().optional(),
});

function mentionsRestricted(q = "") {
  const text = (q || "").toLowerCase();
  return RESTRICTED_KEYWORDS.some((k) => text.includes(k));
}

function buildSystemPrompt() {
  return [
    // Role and scope
    "You are Sloane Assistant for the Sloane Marketplace UI.",
    "Answer only questions about vendor and basic tenant features.",
    "Refuse admin/restricted topics (admin portal, user roles, approvals, audit logs) with a brief explanation.",

    // UI surface and naming
    "Use the exact UI labels users see (not internal route paths).",
    "Key pages in the sidebar: ‘All Listings’, ‘Add Listings’, ‘My Listings’, ‘Vendor Profile’, ‘Vendor Home’, ‘Startup Profile’, ‘My Subscriptions’, ‘Sloane Academy’, ‘Support’.",
    "Top bar: search field, theme toggle, user menu, and tenant indicator (Admins also see a tenant selector).",

    // Tenant/roles
    "Default tenant is ‘Vendor’. Internally ‘vendor’ maps to ‘public’; do not mention ‘public’ to users.",
    "Admins can switch tenants via the top bar selector, but this assistant should not instruct on admin-only operations.",

    // Common task flows (summarize succinctly)
    "Add Listings: open ‘Add Listings’, enter title/description/category/pricing/contact, then submit. Later edit in ‘My Listings’.",
    "Manage Listings: open ‘My Listings’, use the action menu to edit details or change visibility.",
    "Vendor Profile: open ‘Vendor Profile’ to update company name, bio, logo, categories, and links.",
    "Startup Profile: open ‘Startup Profile’ to edit organization details and preferences.",
    "Search: use the search bar; optionally mention applying filters like category or price if relevant.",
    "Subscriptions: open ‘My Subscriptions’ to follow listings/categories or unsubscribe.",
    "Sloane Academy: open ‘Sloane Academy’ to browse and take learning modules.",
    "Support: open ‘Support’ to read FAQs or submit a ticket.",

    // Style & safety
    "Style: concise (2–4 sentences), actionable, step-by-step when asked ‘how to’.",
    "Avoid code, secrets, or implementation details. Don’t mention environment variables or API keys.",
    "If information is unknown, say so briefly and suggest the closest relevant page or action.",
  ].join(" \n");
}

function nodeFetchJson(url, opts) {
  // Prefer global fetch if available
  if (typeof fetch === "function") {
    return fetch(url, opts).then((r) => r.json());
  }
  // Fallback minimal https implementation
  return new Promise(async (resolve, reject) => {
    try {
      const httpsMod = await import("node:https");
      const urlMod = await import("node:url");
      const u = new urlMod.URL(url);
      const req = httpsMod.request(
        {
          method: opts?.method || "GET",
          hostname: u.hostname,
          path: u.pathname + u.search,
          headers: opts?.headers || {},
        },
        (res) => {
          let data = "";
          res.on("data", (chunk) => (data += chunk));
          res.on("end", () => {
            try { resolve(JSON.parse(data)); } catch (e) { resolve({ error: { message: String(e) }, raw: data }); }
          });
        }
      );
      req.on("error", reject);
      if (opts?.body) req.write(opts.body);
      req.end();
    } catch (e) {
      reject(e);
    }
  });
}

router.post("/ask", async (req, res) => {
  const parsed = Body.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid request" });
  const { question, tenantId, isAdmin } = parsed.data;

  if (mentionsRestricted(question)) {
    return res.json({
      type: "refusal",
      text:
        "This topic is restricted to admins or elevated roles. I can help with vendor and basic tenant features like Add Listings, My Listings, Vendor/Startup Profile, Subscriptions, Academy, Support, and Search.",
    });
  }

  const allowedTenants = new Set(["vendor", "basic", "public", ""]);
  if (!isAdmin && !allowedTenants.has((tenantId || "").toLowerCase())) {
    return res.json({
      type: "refusal",
      text: "Assistant is limited to vendor and basic tenant features.",
    });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      error: "Assistant unavailable: missing OPENAI_API_KEY on server.",
    });
  }

  const system = buildSystemPrompt();
  const user = question;

  try {
    const payload = {
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.2,
      max_tokens: 300,
    };

    const data = await nodeFetchJson("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const text = data?.choices?.[0]?.message?.content || "Sorry, I couldn’t generate a response.";
    return res.json({ type: "answer", text });
  } catch (e) {
    return res.status(502).json({ error: "Upstream assistant error", detail: String(e) });
  }
});

export default router;
