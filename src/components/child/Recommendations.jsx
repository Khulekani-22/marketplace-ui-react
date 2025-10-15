import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { auth } from "../../firebase.js";
import { api } from "../../lib/api";
import { useAppSync } from "../../context/useAppSync";
import { useWallet } from "../../hook/useWalletAxios";
import { fetchMySubscriptions, subscribeToService, unsubscribeFromService } from "../../lib/subscriptions";

// Normalize service objects to a consistent shape
function normalizeService(s) {
  return {
    ...s,
    id: String(s.id || s.serviceId || s.vendorId || ""),
    title: s.title || s.name || "Untitled",
    vendor: s.vendor || s.vendorName || "",
    imageUrl: s.imageUrl || s.thumbnail || "",
    category: s.category || s.categoryId || "",
    rating: typeof s.rating === "number" ? s.rating : Number(s.rating || 0),
    reviews: Array.isArray(s.reviews) ? s.reviews : [],
    reviewCount: typeof s.reviewCount === "number" ? s.reviewCount : Number(s.reviewCount || (Array.isArray(s.reviews) ? s.reviews.length : 0) || 0),
    status: (s.status ?? "approved").toString().toLowerCase(),
    contactEmail: (s.contactEmail || s.email || "").toLowerCase(),
    tags: Array.isArray(s.tags) ? s.tags : [],
    description: s.description || s.summary || "",
    price: Number(s.price || 0) || 0,
  };
}
const isApproved = (s) => s.status === "approved";

const creditsFormatter = new Intl.NumberFormat("en-ZA");
function formatCredits(amount) {
  const value = Number(amount) || 0;
  return creditsFormatter.format(Math.round(value));
}

export default function Recommendations() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subs, setSubs] = useState(() => new Set()); // my subscriptions (service ids)
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState("");
  const [profiles, setProfiles] = useState({ startup: null, vendor: null });
  const navigate = useNavigate();
  const mountedRef = useRef(true);
  const liveDataRef = useRef(null); // latest appData snapshot
  const { appData } = useAppSync();
  const { wallet, eligible: walletEligible, redeemCredits, loading: walletLoading } = useWallet();

  const tenantHeader = useMemo(() => sessionStorage.getItem("tenantId") || "vendor", []);
  const tenantId = tenantHeader === "vendor" ? "public" : tenantHeader;

  // Fetch live services + subscriptions (for ranking) and my subscriptions
  useEffect(() => {
    mountedRef.current = true;
    (async () => {
      setErr("");
      try {
        const live = appData || {};
        liveDataRef.current = live;
        const liveServices = Array.isArray(live.services) ? live.services : [];
        const normalized = liveServices.map(normalizeService).filter(isApproved);

        // Use live data directly
        if (mountedRef.current) setServices(normalized);

        // Load my subscriptions if logged in
        if (auth.currentUser) {
          try {
            const items = await fetchMySubscriptions();
            if (mountedRef.current) {
              const set = new Set(items.filter((x) => (x.type || "service") === "service").map((x) => String(x.serviceId)));
              setSubs(set);
            }
          } catch {}
        }
      } catch (e) {
        setErr(e?.message || "");
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    })();
    return () => {
      mountedRef.current = false;
    };
  }, [appData]);

  // Fetch startup and vendor profiles for current user to build interests
  useEffect(() => {
    (async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;
        const email = (user.email || "").toLowerCase();
        const uid = user.uid;
        let startup = null;
        let vendor = null;
        try {
          const sList = await api.get("/api/data/startups").then((r) => r.data || []);
          startup = sList.find((s) => (s.ownerUid && s.ownerUid === uid) || ((s.contactEmail || s.email || "").toLowerCase() === email)) || null;
        } catch {}
        try {
          const vList = await api.get("/api/data/vendors").then((r) => r.data || []);
          vendor = vList.find((v) => (v.ownerUid && v.ownerUid === uid) || ((v.contactEmail || v.email || "").toLowerCase() === email)) || null;
        } catch {}
        setProfiles({ startup, vendor });
      } catch {}
    })();
  }, []);

  // Build interest keywords from profiles
  const interests = useMemo(() => {
    const keys = new Set();
    const addAll = (arr) => {
      (arr || []).forEach((x) => {
        const t = (x || "").toString().trim().toLowerCase();
        if (t) keys.add(t);
      });
    };
    const addText = (txt) => {
      (txt || "")
        .toLowerCase()
        .split(/[^a-z0-9+#]+/g)
        .filter((w) => w.length >= 3)
        .slice(0, 30)
        .forEach((w) => keys.add(w));
    };
    if (profiles.startup) {
      addAll(profiles.startup.categories);
      addAll(profiles.startup.tags);
      addText(profiles.startup.productsServices);
      addText(profiles.startup.elevatorPitch);
    }
    if (profiles.vendor) {
      addAll(profiles.vendor.categories);
      addAll(profiles.vendor.tags);
      addText(profiles.vendor.description);
    }
    return keys;
  }, [profiles.startup, profiles.vendor]);

  // Helper to compute subscriber counts per service from live data in window.appData (if available)
  const subsByService = useMemo(() => {
    const live = liveDataRef.current;
    const src = (live && Array.isArray(live.subscriptions)) ? live.subscriptions : [];
    const out = {};
    src.forEach((x) => {
      const tid = (x.tenantId ?? "public");
      if (tid !== tenantId) return;
      const sid = String(x.serviceId || "");
      if (!sid) return;
      out[sid] = (out[sid] || 0) + 1;
    });
    return out;
  }, [tenantId]);

  const rankTopReviews = useCallback((list) => {
    const arr = list.slice();
    arr.sort((a, b) => {
      const ar = Number(a.rating || 0);
      const br = Number(b.rating || 0);
      if (br !== ar) return br - ar;
      const ac = Number(a.reviewCount || 0);
      const bc = Number(b.reviewCount || 0);
      return bc - ac;
    });
    return arr;
  }, []);

  const rankTopSubscribers = useCallback((list) => {
    const arr = list.slice();
    arr.sort((a, b) => {
      const av = Number(subsByService[String(a.id)] || 0);
      const bv = Number(subsByService[String(b.id)] || 0);
      if (bv !== av) return bv - av;
      // tie-breaker by reviews
      const ac = Number(a.reviewCount || 0);
      const bc = Number(b.reviewCount || 0);
      return bc - ac;
    });
    return arr;
  }, [subsByService]);

  const personalizedScore = useCallback((s, myEmail) => {
    let score = 0;
    const title = (s.title || "").toLowerCase();
    const desc = (s.description || "").toLowerCase();
    const cat = (s.category || "").toLowerCase();
    const tags = Array.isArray(s.tags) ? s.tags.map((t) => String(t).toLowerCase()) : [];
    // avoid recommending own listings
    if (myEmail && s.contactEmail && s.contactEmail === myEmail) return -Infinity;
    if (interests.has(cat)) score += 5;
    tags.forEach((t) => { if (interests.has(t)) score += 2; });
    // lightweight text match
    let hits = 0;
    interests.forEach((w) => {
      if (!w || w.length < 3 || hits > 8) return;
      if (title.includes(w) || desc.includes(w)) { score += 1; hits += 1; }
    });
    // popularity nudges
    score += Math.min(5, Number(s.rating || 0));
    score += Math.min(5, Math.floor((Number(s.reviewCount || 0)) / 25));
    score += Math.min(5, Math.floor((Number(subsByService[String(s.id)] || 0)) / 5));
    return score;
  }, [interests, subsByService]);

  const picks = useMemo(() => {
    const list = services;
    if (!list.length) return { byReviews: null, bySubs: null, personal: null };
    const byReviews = rankTopReviews(list)[0] || null;
    const bySubs = rankTopSubscribers(list).find((s) => !byReviews || s.id !== byReviews.id) || rankTopSubscribers(list)[0] || null;
    const myEmail = (auth.currentUser?.email || "").toLowerCase();
    const rankedPersonal = list
      .map((s) => ({ s, score: personalizedScore(s, myEmail) }))
      .filter((x) => Number.isFinite(x.score))
      .sort((a, b) => b.score - a.score)
      .map((x) => x.s);
    const personal = rankedPersonal.find((s) => (!byReviews || s.id !== byReviews.id) && (!bySubs || s.id !== bySubs.id)) || rankedPersonal[0] || null;
    return { byReviews, bySubs, personal };
  }, [services, rankTopReviews, rankTopSubscribers, personalizedScore]);

  async function toggleSubscribe(serviceId) {
    try {
      if (!auth.currentUser) {
        navigate('/login', { replace: true, state: { from: window.location?.pathname || '/' } });
        return;
      }
      setErr("");
      setSuccess("");
      const id = String(serviceId);
      const isSub = subs.has(id);
      if (isSub) {
        await unsubscribeFromService(id);
        setSubs((prev) => { const n = new Set(prev); n.delete(id); return n; });
        setSuccess("Subscription canceled.");
        return;
      }

      const service = services.find((item) => String(item.id) === id) || null;
      const price = Number(service?.price || 0) || 0;

      if (price > 0) {
        if (walletLoading) {
          setErr("Checking wallet, please try again in a moment.");
          return;
        }
        if (!walletEligible) {
          setErr("My Wallet is only available to startup, vendor, and admin accounts.");
          return;
        }
        if (!wallet) {
          setErr("We could not load your wallet. Please try again.");
          return;
        }
        if (wallet.balance < price) {
          const shortfall = price - wallet.balance;
          setErr(`You need ${formatCredits(shortfall)} more credits to subscribe to this listing.`);
          return;
        }
      }

      await subscribeToService(id, service ? { price: service.price } : {});

      if (price > 0) {
        const result = await redeemCredits(price, {
          description: `Listing subscription: ${service?.title || "Marketplace service"}`,
          reference: `listing-${service?.id || "unknown"}`,
          metadata: {
            serviceId: service?.id || null,
            vendor: service?.vendor || null,
            category: service?.category || null,
            source: "dashboard-recommendations",
          },
        });
        if (!result.ok) {
          await unsubscribeFromService(id);
          setErr(result.error || "Unable to redeem wallet credits; subscription canceled.");
          return;
        }
        setSuccess(`Voucher applied! Remaining balance: ${formatCredits(result.wallet?.balance || 0)} credits.`);
      } else {
        setSuccess("Subscription added.");
      }

      setSubs((prev) => new Set([...prev, id]));
    } catch (error) {
      setErr("Unable to update subscription right now. Please try again.");
    }
  }

  function renderCard(s, label, badgeClass = "bg-primary-600") {
    if (!s) return null;
    const rating = Number(s.rating || 0);
    const reviewsCount = Number(s.reviewCount || (Array.isArray(s.reviews) ? s.reviews.length : 0) || 0);
    const subCount = Number(subsByService[String(s.id)] || 0);
    const isSub = subs.has(String(s.id));
    return (
      <div className="col-12 col-md-4" key={`${label}-${s.id}`}>
        <article className="card h-100 p-2">
          <div className="position-relative">
            {s.imageUrl ? (
              <img src={s.imageUrl} alt={s.title} className="w-100 rounded-3 object-fit-cover" style={{ maxHeight: 140 }} />
            ) : (
              <div className="bg-neutral-200 w-100 rounded-3 d-flex align-items-center justify-content-center" style={{ height: 140 }}>
                <span className="text-secondary">No image</span>
              </div>
            )}
            <span className={`badge position-absolute top-0 start-0 m-2 ${badgeClass}`}>{label}</span>
          </div>
          <div className="p-2">
            <div className="d-flex align-items-center justify-content-between">
              <h6 className="mb-1 me-2 text-truncate" title={s.title}>{s.title}</h6>
            </div>
            <div className="text-secondary small mb-2">{s.vendor || "Vendor"} • {s.category || "General"}</div>
            <div className="d-flex align-items-center justify-content-between small mb-2">
              <div>
                <span className="me-1">{"★".repeat(Math.round(rating))}{"☆".repeat(5 - Math.round(rating))}</span>
                <span className="text-muted">({reviewsCount})</span>
              </div>
              <div className="text-muted">{subCount} subs</div>
            </div>
            <div className="d-flex gap-2">
              <button className={isSub ? "btn btn-sm rounded-pill border text-neutral-500 border-neutral-700 radius-8 px-12 py-6 bg-hover-primary-700 text-hover-white" : "btn btn-sm btn-primary"} onClick={() => toggleSubscribe(s.id)}>
                {isSub ? "Subscribed" : "Subscribe"}
              </button>
              <Link to="/marketplace" className="btn btn-sm btn-outline-secondary">Open Market</Link>
            </div>
          </div>
        </article>
      </div>
    );
  }

  if (!auth.currentUser) return null; // show only for logged-in users

  return (
    <div className="col-12">
      <div className="card p-3">
        <div className="d-flex align-items-center justify-content-between mb-2">
          <h6 className="mb-0">Recommended for You</h6>
          {loading && <span className="text-secondary small">Loading…</span>}
        </div>
        {success && <div className="alert alert-success py-2 mb-2">{success}</div>}
        {err && <div className="alert alert-warning py-2 mb-2">{err}</div>}
        <div className="row g-3">
          {renderCard(picks.byReviews, "Top Reviews", "bg-success-600")}
          {renderCard(picks.bySubs, "Most Subscribed", "bg-warning-600")}
          {renderCard(picks.personal, "Best Match", "bg-primary-600")}
        </div>
      </div>
    </div>
  );
}
