// src/components/TrendingNFTsOne.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { auth } from "../../firebase.js";
import { api } from "../../lib/api";
import { useAppSync } from "../../context/useAppSync";
import { useWallet } from "../../hook/useWalletAxios";
import { fetchMySubscriptions, subscribeToService, unsubscribeFromService } from "../../lib/subscriptions";

// Normalize any legacy keys so the card always has the fields your UI expects
const normalize = (s) => ({
  ...s,
  vendor: s.vendor ?? s.vendorName ?? "",
  imageUrl: s.imageUrl ?? s.thumbnail ?? "",
  category: s.category ?? s.categoryId ?? "",
  rating: typeof s.rating === "number" ? s.rating : Number(s.rating || 0),
  reviews: Array.isArray(s.reviews) ? s.reviews : [],
  // default to "approved" for older data that doesn't have status
  status: (s.status ?? "approved").toString().toLowerCase(),
});

// Only show approved items to end users
const isApproved = (s) => s.status === "approved";

const SERVICE_DAY_START = 8;
const SERVICE_DAY_END = 17;

function formatHourLabel(hour) {
  const normalized = ((hour + 11) % 12) + 1;
  const period = hour >= 12 ? "PM" : "AM";
  return `${normalized}:00 ${period}`;
}

function createHourlySlots(start = SERVICE_DAY_START, end = SERVICE_DAY_END) {
  const slots = [];
  for (let h = start; h < end; h += 1) {
    const next = h + 1;
    const value = `${String(h).padStart(2, "0")}:00`;
    slots.push({ value, label: `${formatHourLabel(h)} – ${formatHourLabel(next)}` });
  }
  return slots;
}

function isServiceListing(service = {}) {
  const type = (service.listingType || service.type || "").toString().toLowerCase();
  return type === "service" || type === "services";
}

function formatBookingDate(dateString) {
  if (!dateString) return "";
  try {
    const date = new Date(`${dateString}T00:00:00`);
    if (Number.isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString();
  } catch {
    return dateString;
  }
}

const creditsFormatter = new Intl.NumberFormat("en-ZA");
function formatCredits(amount) {
  const value = Number(amount) || 0;
  return creditsFormatter.format(Math.round(value));
}

const TrendingNFTsOne = ({
  query: controlledQuery,
  onQueryChange,
  category: controlledCategory,
  onCategoryChange,
  onCategoriesChange,
}) => {
  const tenantId = useMemo(
    () => sessionStorage.getItem("tenantId") || "vendor",
    []
  );

  // Start with empty array, will load from API
  const baseApproved = useMemo(() => [], []);
  const [services, setServices] = useState(baseApproved);
  const servicesRef = useRef(baseApproved);
  const versionRef = useRef(0); // guards against stale fetch overwriting fresher state
  const [loading, setLoading] = useState(true);
  // Category filter (controlled or internal)
  const [internalActiveTab, setInternalActiveTab] = useState("All");
  const activeTab = controlledCategory ?? internalActiveTab;
  const setActiveTab = onCategoryChange ?? setInternalActiveTab;
  // Allow parent to control the search query; fall back to local state
  const [internalQuery, setInternalQuery] = useState("");
  const query = controlledQuery ?? internalQuery;
  const setQuery = onQueryChange ?? setInternalQuery;
  const [reviews, setReviews] = useState({}); // serviceId -> { rating, comment }
  const [modal, setModal] = useState({ open: false, id: null, showAll: false, page: 0 });
  const [detailsModal, setDetailsModal] = useState({ open: false, id: null });
  const [toast, setToast] = useState("");
  const [toastType, setToastType] = useState("success"); // success | danger
  const [busy, setBusy] = useState(false);
  const [subs, setSubs] = useState(() => new Set()); // serviceId set
  const [bookings, setBookings] = useState({}); // serviceId -> { date, slot }
  const [bookingModal, setBookingModal] = useState({ open: false, id: null, date: "", slot: "", error: "" });
  const [bookingBusy, setBookingBusy] = useState(false);
  const navigate = useNavigate();
  const { appData } = useAppSync();
  const { wallet, eligible: walletEligible, redeemCredits, loading: walletLoading, refresh } = useWallet();
  const bookingSlots = useMemo(() => createHourlySlots(), []);
  const slotLabelMap = useMemo(() => {
    const map = {};
    bookingSlots.forEach((slot) => {
      map[slot.value] = slot.label;
    });
    return map;
  }, [bookingSlots]);

  function pickFresher(a = {}, b = {}) {
    const ca = Number(a.reviewCount || (Array.isArray(a.reviews) ? a.reviews.length : 0) || 0);
    const cb = Number(b.reviewCount || (Array.isArray(b.reviews) ? b.reviews.length : 0) || 0);
    const ta = Date.parse(a.lastReviewedAt || "") || 0;
    const tb = Date.parse(b.lastReviewedAt || "") || 0;
    if (cb > ca) return b;
    if (cb < ca) return a;
    if (tb > ta) return b;
    return a;
  }

  function mergeLists(currentList, baseList, liveList) {
    const map = new Map();
    baseList.forEach((s) => map.set(String(s.id), s));
    liveList.forEach((s) => map.set(String(s.id), s)); // live over base
    // preserve fresher review info already shown in UI
    currentList.forEach((c) => {
      const id = String(c.id);
      const existing = map.get(id) || {};
      const chosen = pickFresher(existing, c);
      // keep non-review fields from existing (live/base) but replace review fields with the fresher one
      map.set(id, {
        ...existing,
        reviews: Array.isArray(chosen.reviews) ? chosen.reviews : existing.reviews,
        reviewCount: Number(chosen.reviewCount || (Array.isArray(chosen.reviews) ? chosen.reviews.length : existing.reviewCount || 0) || 0),
        rating: typeof chosen.rating === 'number' ? chosen.rating : Number(chosen.rating || existing.rating || 0),
        lastReviewedAt: chosen.lastReviewedAt || existing.lastReviewedAt,
      });
    });
    return Array.from(map.values());
  }

  async function refreshFromLive() {
    const liveApproved = (appData?.services || []).map(normalize).filter(isApproved);
    const merged = mergeLists(servicesRef.current ?? services, baseApproved, liveApproved);
    setServices(merged);
  }

  // Load live data from backend; fall back silently on any error
  useEffect(() => {
    const liveApproved = (appData?.services || []).map(normalize).filter(isApproved);
    const merged = mergeLists(servicesRef.current ?? services, baseApproved, liveApproved);
    setServices(merged);
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId, appData]);

  // Load my subscriptions (if authed)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!auth.currentUser) return;
        const items = await fetchMySubscriptions();
        if (cancelled) return;
        const bookingMap = {};
        const set = new Set(
          items
            .filter((x) => (x.type || 'service') === 'service')
            .map((x) => {
              const id = String(x.serviceId);
              if (x.scheduledDate || x.scheduledSlot) {
                bookingMap[id] = { date: x.scheduledDate || '', slot: x.scheduledSlot || '' };
              }
              return id;
            })
        );
        setSubs(set);
        setBookings(bookingMap);
      } catch {}
    })();
    return () => { cancelled = true; };
  }, []);

  async function toggleSubscribe(serviceId, options = {}) {
    const { bookable = false } = options;
    try {
      if (!auth.currentUser) {
        navigate('/login', { replace: true, state: { from: window.location?.pathname || '/' } });
        return;
      }

      const id = String(serviceId);
      const isSub = subs.has(id);
      if (isSub) {
        await unsubscribeFromService(id);
        setSubs((prev) => {
          const n = new Set(Array.from(prev));
          n.delete(id);
          return n;
        });
        setBookings((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
        setToastType('success');
        setToast(bookable ? 'Booking cancelled' : 'Unsubscribed');
        setTimeout(() => setToast(''), 2000);
        return;
      }

      const list = servicesRef.current || services;
      const service = (list || []).find((entry) => String(entry.id) === id) || null;
      const price = Number(service?.price || 0) || 0;

      if (!bookable && price > 0) {
        if (walletLoading) {
          setToastType('danger');
          setToast('Checking wallet, please try again in a moment.');
          setTimeout(() => setToast(''), 2500);
          return;
        }
        if (!walletEligible) {
          setToastType('danger');
          setToast('My Wallet is only available to startup and vendor accounts.');
          setTimeout(() => setToast(''), 2500);
          return;
        }
        if (!wallet) {
          setToastType('danger');
          setToast('We could not load your wallet. Please try again.');
          setTimeout(() => setToast(''), 2500);
          return;
        }
        if (wallet.balance < price) {
          const shortfall = price - wallet.balance;
          setToastType('danger');
          setToast(`You need ${formatCredits(shortfall)} more credits to subscribe to this listing.`);
          setTimeout(() => setToast(''), 3000);
          return;
        }
      }

      await subscribeToService(id, service ? { price: service.price } : {});

      if (!bookable && price > 0) {
        const result = await redeemCredits(price, {
          description: `Listing subscription: ${service?.title || 'Marketplace service'}`,
          reference: `listing-${service?.id || 'unknown'}`,
          metadata: {
            serviceId: service?.id || null,
            vendor: service?.vendor || null,
            category: service?.category || null,
            source: 'dashboard-trending',
          },
        });
        if (!result.success) {
          await unsubscribeFromService(id);
          setToastType('danger');
          setToast(result.error || 'Unable to redeem wallet credits; subscription canceled.');
          setTimeout(() => setToast(''), 3000);
          return;
        }
        // Refresh wallet to ensure UI shows updated balance
        setTimeout(() => refresh().catch(() => void 0), 100);
        setToastType('success');
        setToast(`Voucher applied! Remaining balance: ${formatCredits(result.wallet?.balance || 0)} credits.`);
      } else {
        setToastType('success');
        setToast(bookable ? 'Booking confirmed' : 'Subscribed');
      }

      setSubs((prev) => new Set([...Array.from(prev), id]));
      setTimeout(() => setToast(''), 2500);
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || 'Failed to update subscription';
      setToastType('danger');
      setToast(msg);
      setTimeout(() => setToast(''), 2500);
    }
  }

  // Categories reflect whatever data we ended up with (approved only)
  const categories = useMemo(() => {
    const uniq = Array.from(
      new Set(
        services
          .map((s) => (s.category || "").trim())
          .filter(Boolean)
      )
    );
    return ["All", ...uniq];
  }, [services]);

  // Bubble up categories to parent when available
  useEffect(() => {
    try {
      if (typeof onCategoriesChange === 'function') onCategoriesChange(categories);
    } catch {}
  }, [categories, onCategoriesChange]);

  const filteredServices = useMemo(() => {
    const tab = activeTab.toLowerCase();
    const q = (query || "").trim().toLowerCase();
    let base = activeTab === "All"
      ? services
      : services.filter((s) => (s.category || "").trim().toLowerCase() === tab);
    if (!q) return base;
    return base.filter((s) => {
      const hay = [
        s.title || "",
        s.vendor || "",
        s.category || "",
        s.description || s.summary || "",
        Array.isArray(s.tags) ? s.tags.join(" ") : "",
      ]
        .join(" \n ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [services, activeTab, query]);

  // Keep a live ref of services to avoid stale closures during async merges
  useEffect(() => {
    servicesRef.current = services;
  }, [services]);

  // --- Reviews helpers ---
  function setField(id, k, v) {
    setReviews((prev) => ({ ...prev, [id]: { ...(prev[id] || {}), [k]: v } }));
  }
  function openReview(id) {
    setModal({ open: true, id, showAll: false, page: 0 });
    if (!reviews[id]) setReviews((p) => ({ ...p, [id]: { rating: 0, comment: "" } }));
  }
  function closeReview() {
    setModal({ open: false, id: null, showAll: false, page: 0 });
  }
  function openDetails(id) {
    setDetailsModal({ open: true, id });
  }
  function closeDetails() {
    setDetailsModal({ open: false, id: null });
  }
  function openBooking(service) {
    if (!auth.currentUser) {
      navigate('/login', { replace: true, state: { from: window.location?.pathname || '/' } });
      return;
    }
    const id = service?.id;
    const existing = bookings[String(id)] || {};
    setBookingModal({ open: true, id, date: existing.date || '', slot: existing.slot || '', error: '' });
  }
  function closeBooking() {
    setBookingModal({ open: false, id: null, date: '', slot: '', error: '' });
  }
  function setBookingField(field, value) {
    setBookingModal((prev) => ({ ...prev, [field]: value, error: field === 'date' || field === 'slot' ? '' : prev.error }));
  }
  async function confirmBooking() {
    const { id, date, slot } = bookingModal;
    if (!id) return;
    if (!date) {
      setBookingModal((prev) => ({ ...prev, error: 'Please choose a date.' }));
      return;
    }
    if (!slot) {
      setBookingModal((prev) => ({ ...prev, error: 'Please choose a time slot.' }));
      return;
    }

    const list = servicesRef.current || services;
    const service = (list || []).find((entry) => String(entry.id) === String(id)) || null;
    const price = Number(service?.price || 0) || 0;

    if (price > 0) {
      if (walletLoading) {
        setBookingModal((prev) => ({ ...prev, error: 'Checking wallet, please try again in a moment.' }));
        return;
      }
      if (!walletEligible) {
        setBookingModal((prev) => ({ ...prev, error: 'My Wallet is only available to startup and vendor accounts.' }));
        return;
      }
      if (!wallet) {
        setBookingModal((prev) => ({ ...prev, error: 'We could not load your wallet. Please try again.' }));
        return;
      }
      if (wallet.balance < price) {
        const shortfall = price - wallet.balance;
        setBookingModal((prev) => ({ ...prev, error: `You need ${formatCredits(shortfall)} more credits to book this session.` }));
        return;
      }
    }

    setBookingBusy(true);
    try {
      const payload = { scheduledDate: date, scheduledSlot: slot };
      await subscribeToService(String(id), payload);
      if (price > 0) {
        const result = await redeemCredits(price, {
          description: `Listing booking: ${service?.title || 'Marketplace service'}`,
          reference: `listing-${service?.id || 'unknown'}`,
          metadata: {
            serviceId: service?.id || null,
            vendor: service?.vendor || null,
            category: service?.category || null,
            scheduledDate: date,
            scheduledSlot: slot,
            source: 'dashboard-trending-booking',
          },
        });
        if (!result.success) {
          await unsubscribeFromService(String(id));
          setBookingModal((prev) => ({ ...prev, error: result.error || 'Unable to redeem wallet credits; booking canceled.' }));
          return;
        }
        // Refresh wallet to ensure UI shows updated balance
        setTimeout(() => refresh().catch(() => void 0), 100);
        setToastType('success');
        setToast(`Voucher applied! Remaining balance: ${formatCredits(result.wallet?.balance || 0)} credits.`);
      } else {
        setToastType('success');
        setToast(`Session booked for ${formatBookingDate(date)} at ${slotLabelMap[slot] || slot}.`);
      }
      setSubs((prev) => new Set([...Array.from(prev), String(id)]));
      setBookings((prev) => ({ ...prev, [String(id)]: { date, slot } }));
      setTimeout(() => setToast(''), 2500);
      closeBooking();
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || 'Failed to book session';
      setBookingModal((prev) => ({ ...prev, error: msg }));
    } finally {
      setBookingBusy(false);
    }
  }
  function setStar(id, n) { setField(id, "rating", n); }
  function renderStars(n) {
    const v = Number(n || 0);
    return (
      <span>
        {[1,2,3,4,5].map(i => (
          <span key={i} style={{ color: v >= i ? "#f5a623" : "#ccc", fontSize: 16 }}>★</span>
        ))}
      </span>
    );
  }
  function sortReviews(list) {
    const arr = Array.isArray(list) ? list.slice() : [];
    arr.sort((a,b) => (Date.parse(b?.createdAt||"")||0) - (Date.parse(a?.createdAt||"")||0));
    return arr;
  }
  const pageSize = 5;
  function nextPage(total) {
    const max = Math.max(0, Math.ceil(total / pageSize) - 1);
    setModal((m) => ({ ...m, page: Math.min(max, (m.page || 0) + 1) }));
  }
  function prevPage() { setModal((m) => ({ ...m, page: Math.max(0, (m.page || 0) - 1) })); }
  async function submitReview(id) {
    const r = Number(reviews[id]?.rating || 0);
    const comment = (reviews[id]?.comment || "").trim();
    if (Number.isNaN(r) || r < 1 || r > 5) {
      setToastType("danger");
      setToast("Please select a star rating (1–5).");
      setTimeout(() => setToast(""), 2500);
      return;
    }
    setBusy(true);
    try {
      const email = auth.currentUser?.email || "";
      const author = auth.currentUser?.displayName || (email ? email.split("@")[0] : "Guest");
      const svc = services.find((s) => s.id === id) || {};
      const { data } = await api.post(`/api/data/services/${encodeURIComponent(id)}/reviews`, {
        rating: r,
        comment,
        author,
        authorEmail: email,
        title: svc.title || "",
        vendor: svc.vendor || "",
        contactEmail: (svc.contactEmail || svc.email || "")
      });
      // normalize returned service and replace it
      const updated = normalize(data);
      versionRef.current += 1;
      setServices((prev) => prev.map((s) => (s.id === id ? updated : s)));
      setToastType("success");
      setToast("Review submitted. Thank you!");
      setTimeout(() => setToast(""), 2500);
      closeReview();
      // short delayed refresh to reconcile with live store (handles multi-tab updates)
      setTimeout(() => {
        refreshFromLive().catch(() => void 0);
      }, 800);
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || "Failed to submit review";
      setToastType("danger");
      setToast(msg);
      setTimeout(() => setToast(""), 2500);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="col-12">
      <div className="mb-16 mt-8 d-flex flex-wrap justify-content-between align-items-center gap-12">
        <h6 className="mb-0">All Listings</h6>
        <div className="d-flex flex-wrap align-items-center gap-12">
          <div className="position-relative">
            <input
              type="text"
              className="form-control form-control-sm rounded-3 border-1 border-neutral-300 bg-neutral-100 text-sm ps-12 pe-32 py-8"
              placeholder="Search listings by name, vendor, category…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ minWidth: 260 }}
              aria-label="Search listings"
            />
            {query && (
              <button
                type="button"
                className="btn btn-sm btn-link position-absolute end-0 top-50 translate-middle-y me-2"
                onClick={() => setQuery("")}
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>
          <ul className="nav button-tab nav-pills mb-0 gap-12 text-neutral-500" role="tablist">
          {categories.map((category) => (
            <li className="nav-item text-neutral-500" key={category} role="presentation">
              <button
                className={`nav-link btn btn-sm rounded-pill text-neutral-500 hover-text-white bg-hover-primary-800 px-20 py-6 border border-neutral-300 ${
                  activeTab === category
                    ? "active bg-primary-400 text-white border-primary-400"
                    : "bg-neutral-50"
                }`}
                onClick={() => setActiveTab(category)}
              >
                {category}
              </button>
            </li>
          ))}
          </ul>
        </div>
      </div>

      {walletLoading && (
        <div className="alert alert-secondary mb-3" role="status">
          Loading wallet balance…
        </div>
      )}

      {walletEligible && wallet && !walletLoading && (
        <div className="alert alert-primary d-flex flex-wrap align-items-center justify-content-between mb-3" role="status">
          <div className="d-flex flex-column">
            <strong>Wallet balance:</strong>
            <span className="fs-6">R {formatCredits(wallet.balance)} credits available</span>
            <small className="text-secondary">Marketplace subscriptions automatically draw from your credits.</small>
          </div>
          <div className="d-flex gap-2 mt-2 mt-md-0">
            <Link to="/wallet" className="btn btn-sm btn-outline-secondary">View wallet</Link>
            <button
              type="button"
              className="btn btn-sm btn-outline-primary"
              onClick={() => refresh().catch(() => void 0)}
              disabled={walletLoading}
            >
              Refresh balance
            </button>
          </div>
        </div>
      )}
      {!walletEligible && auth.currentUser && (
        <div className="alert alert-warning mb-3" role="alert">
          My Wallet credits are reserved for startup and vendor profiles. Contact your programme manager if you need access.
        </div>
      )}

      <div className="tab-content">
        <div className="tab-pane fade show active">
          <div className="row g-3">
            {loading && (
              <div className="col-12 text-center text-secondary-light">
                Loading listings…
              </div>
            )}

            {!loading &&
              filteredServices.map((service) => {
                const rating = Number(service.rating || 0);
                const reviewsCount = Number(service.reviewCount || (Array.isArray(service.reviews) ? service.reviews.length : 0) || 0);
                const id = String(service.id);
                const isSub = subs.has(id);
                const bookable = isServiceListing(service);
                const bookingInfo = bookings[id];
                const price = Number(service.price || 0) || 0;
                const walletBalance = wallet?.balance ?? 0;
                const hasWallet = walletEligible && wallet;
                const shortfall = hasWallet ? Math.max(0, price - walletBalance) : 0;
                const disableSubscription =
                  !bookable && !isSub && price > 0 && (!walletEligible || !wallet || wallet.balance < price);
                return (
                  <div className="col-12 col-md-6 col-lg-4" key={service.id}>
                    <article
                      className="card p-1 h-100"
                      tabIndex={0}
                      aria-label={`${service.title || 'Listing'} card`}
                      style={{ fontSize: '0.8rem' }}
                    >
                      <div className="row g-1 align-items-start">
                        <div className="col-4 d-flex align-items-center justify-content-center">
                          <button
                            type="button"
                            className="btn p-0 border-0 bg-transparent"
                            onClick={() => openDetails(service.id)}
                            aria-label={`View details for ${service.title || 'listing'}`}
                          >
                            <img
                              src={service.imageUrl}
                              alt={service.title || 'Listing image'}
                              className="img-fluid rounded"
                              style={{ maxHeight: '6.8rem', objectFit: 'contain' }}
                            />
                          </button>
                        </div>

                        <div className="col-8 d-flex flex-column">
                          <div className="d-flex justify-content-between align-items-start">
                            <div>
                              <button
                                type="button"
                                className="btn btn-link text-neutral-800  hover-text-primary-200 p-0 fw-medium text-start"
                                style={{ fontSize: '1.1rem', lineHeight: 1.2, textDecoration: 'none' }}
                                onClick={() => openDetails(service.id)}
                                aria-label={`Open details for ${service.title || 'listing'}`}
                              >
                                {service.title}
                              </button>
                              <div className="text-muted small " style={{ fontSize: '0.74rem' }}>
                                {service.vendor || 'Unknown'}
                                {service.category ? <span><span className="mx-1">|</span>{service.category}</span> : null}
                              </div>
                              {price > 0 && (
                                <div className="d-flex align-items-center justify-content-between text-xs mt-1" style={{ fontSize: '0.72rem' }}>
                                  <span className="fw-semibold text-neutral-800">R {formatCredits(price)}</span>
                                  {hasWallet ? (
                                    <span className={shortfall > 0 ? 'text-danger' : 'text-success'}>
                                      {shortfall > 0
                                        ? `Short by ${formatCredits(shortfall)} credits`
                                        : 'Covered by wallet'}
                                    </span>
                                  ) : (
                                    <span className="text-secondary">Wallet required</span>
                                  )}
                                </div>
                              )}
                              {bookable && bookingInfo && (
                                <div className="text-success small mt-1" style={{ fontSize: '0.7rem' }}>
                                  Next session: {formatBookingDate(bookingInfo.date)}
                                  {bookingInfo.slot ? <span className="ms-1">· {slotLabelMap[bookingInfo.slot] || bookingInfo.slot}</span> : null}
                                </div>
                              )}
                            </div>
                            <div className="d-flex flex-column gap-1 pt-1">
                              <button
                                type="button"
                                className={isSub ? "btn btn-sm rounded-pill text-primary-50 hover-text-primary-400 bg-primary-500 bg-hover-primary-800 radius-8 px-12 py-6" : "btn btn-sm  rounded-pill text-primary-50 hover-text-primary-400 bg-primary-500 bg-hover-primary-800 radius-8 px-12 py-6"}
                                style={{ fontSize: '0.74rem', padding: '0.2rem 0.45rem' }}
                                onClick={() => {
                                  if (bookable) {
                                    openBooking(service);
                                  } else {
                                    toggleSubscribe(service.id);
                                  }
                                }}
                                disabled={disableSubscription}
                              >
                                {bookable ? (isSub ? 'Reschedule' : 'Book session') : (isSub ? 'Subscribed' : 'Subscribe')}
                              </button>
                              {bookable && isSub && (
                                <button
                                  type="button"
                                  className="btn btn-sm rounded-pill border text-neutral-500 border-neutral-700 radius-8 px-12 py-6 bg-hover-primary-700 text-hover-white"
                                  style={{ fontSize: '0.74rem', padding: '0.2rem 0.45rem' }}
                                  onClick={() => toggleSubscribe(service.id, { bookable: true })}
                                >
                                  Cancel booking
                                </button>
                              )}
                              <button
                                type="button"
                                className="btn rounded-pill border text-neutral-500 border-neutral-700 radius-8 px-12 py-6 bg-hover-primary-700 text-hover-white"
                                style={{ fontSize: '0.74rem', padding: '0.2rem 0.45rem' }}
                                onClick={() => openReview(service.id)}
                              >
                                {reviewsCount > 0 ? 'Review' : 'Write review'}
                              </button>
                            </div>
                          </div>

                          <div className="d-flex align-items-center small" style={{ fontSize: '0.74rem' }}>
                            <svg className="me-1" width="12" height="12" fill="currentColor" viewBox="0 0 24 24" role="img" aria-label="rating star">
                              <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                            </svg>
                            <span className="me-1">{rating.toFixed(1)}</span>
                            <span className="text-muted">({reviewsCount} {reviewsCount === 1 ? 'rating' : 'ratings'})</span>
                          </div>
                        </div>
                      </div>
                    </article>
                  </div>
                );
              })}

            {!loading && filteredServices.length === 0 && (
              <div className="col-12 text-center text-secondary-light">
                No services found in this category.
              </div>
            )}
          </div>
        </div>
      </div>
      {toast && (
        <div className="position-fixed top-0 end-0 p-3" style={{ zIndex: 1080 }}>
          <div className={`toast show align-items-center ${toastType === 'danger' ? 'text-bg-danger' : 'text-bg-success'} border-0`}>
            <div className="d-flex">
              <div className="toast-body">{toast}</div>
              <button type="button" className="btn-close btn-close-white me-2 m-auto" onClick={() => setToast("")}></button>
            </div>
          </div>
        </div>
      )}

      {bookingModal.open && (() => {
        const svc = services.find((s) => s.id === bookingModal.id);
        if (!svc) return null;
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        const minDate = `${yyyy}-${mm}-${dd}`;
        const baseId = String(bookingModal.id ?? '');
        const dateInputId = `booking-date-${baseId}`;
        const slotInputId = `booking-slot-${baseId}`;
        return (
          <div
            className="position-fixed top-0 start-0 w-100 h-100"
            style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1076 }}
            onClick={(e) => {
              if (e.target === e.currentTarget) closeBooking();
            }}
          >
            <div className="card shadow-lg" style={{ maxWidth: 560, margin: '10vh auto', maxHeight: '80vh', overflowY: 'auto' }}>
              <div className="card-header d-flex align-items-center justify-content-between">
                <h6 className="mb-0">Book session: {svc.title}</h6>
                <button type="button" className="btn btn-sm btn-outline-secondary" onClick={closeBooking}>
                  Close
                </button>
              </div>
              <div className="card-body">
                <div className="text-secondary small mb-3">
                  One-hour slots available between 8:00 AM and 5:00 PM.
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-semibold" htmlFor={dateInputId}>Choose a date</label>
                  <input
                    id={dateInputId}
                    type="date"
                    className="form-control"
                    value={bookingModal.date}
                    min={minDate}
                    onChange={(e) => setBookingField('date', e.target.value)}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-semibold" htmlFor={slotInputId}>Choose a time slot</label>
                  <select
                    id={slotInputId}
                    className="form-select"
                    value={bookingModal.slot}
                    onChange={(e) => setBookingField('slot', e.target.value)}
                  >
                    <option value="">Select a slot</option>
                    {bookingSlots.map((slot) => (
                      <option key={slot.value} value={slot.value}>{slot.label}</option>
                    ))}
                  </select>
                </div>
                {bookingModal.error && (
                  <div className="alert alert-danger py-2" role="alert">
                    {bookingModal.error}
                  </div>
                )}
                <div className="d-flex justify-content-end gap-2">
                  <button type="button" className="btn btn-outline-secondary" onClick={closeBooking} disabled={bookingBusy}>
                    Close
                  </button>
                  <button type="button" className="btn btn-primary" onClick={confirmBooking} disabled={bookingBusy}>
                    {bookingBusy ? 'Booking…' : 'Confirm booking'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {detailsModal.open && (() => {
        const svc = services.find((s) => s.id === detailsModal.id);
        if (!svc) return null;
        const tags = Array.isArray(svc.tags) ? svc.tags.filter(Boolean) : [];
        const description = svc.description || svc.summary || '';
        const hasPrice = typeof svc.price === 'number' && !Number.isNaN(Number(svc.price));
        const formattedPrice = hasPrice ? Intl.NumberFormat(undefined, { style: 'currency', currency: svc.currency || 'USD', maximumFractionDigits: 0 }).format(Number(svc.price)) : '';
        return (
          <div
            className="position-fixed top-0 start-0 w-100 h-100"
            style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1075 }}
            onClick={(e) => {
              if (e.target === e.currentTarget) closeDetails();
            }}
          >
            <div className="card shadow-lg" style={{ maxWidth: 640, margin: '10vh auto', maxHeight: '80vh', overflowY: 'auto' }}>
              <div className="card-header d-flex align-items-center justify-content-between">
                <h6 className="mb-0">Listing details</h6>
                <button type="button" className="btn btn-sm btn-outline-secondary" onClick={closeDetails}>
                  Close
                </button>
              </div>
              <div className="card-body">
                <div className="d-flex flex-column flex-md-row gap-3 mb-3">
                  {svc.imageUrl ? (
                    <div className="flex-shrink-0 text-center">
                      <img
                        src={svc.imageUrl}
                        alt={svc.title || 'Listing image'}
                        className="img-fluid rounded"
                        style={{ maxWidth: '12rem', objectFit: 'cover' }}
                      />
                    </div>
                  ) : null}
                  <div className="flex-grow-1">
                    <h5 className="mb-1">{svc.title || 'Untitled listing'}</h5>
                    <div className="text-muted small mb-2">
                      {svc.vendor || 'Unknown vendor'}
                      {svc.category ? <span><span className="mx-1">|</span>{svc.category}</span> : null}
                    </div>
                    <div className="d-flex flex-wrap align-items-center gap-2 small">
                      <span className="badge bg-primary-600 text-white">Rating {Number(svc.rating || 0).toFixed(1)}</span>
                      <span className="text-secondary">{Number(svc.reviewCount || (Array.isArray(svc.reviews) ? svc.reviews.length : 0))} review(s)</span>
                      {hasPrice && (
                        <span className="badge bg-neutral-200 text-dark">{formattedPrice}</span>
                      )}
                    </div>
                  </div>
                </div>
                {description && (
                  <div className="mb-3">
                    <h6 className="fw-semibold">Overview</h6>
                    <p className="mb-0 text-break" style={{ whiteSpace: 'pre-wrap' }}>{description}</p>
                  </div>
                )}
                {tags.length > 0 && (
                  <div className="mb-3">
                    <h6 className="fw-semibold">Tags</h6>
                    <div className="d-flex flex-wrap gap-2">
                      {tags.map((tag, idx) => (
                        <span key={`${detailsModal.id}-${idx}`} className="badge bg-neutral-200 text-dark">{tag}</span>
                      ))}
                    </div>
                  </div>
                )}
                {(svc.contactEmail || svc.website || svc.contactPhone) && (
                  <div className="mb-2">
                    <h6 className="fw-semibold">Contact</h6>
                    <ul className="mb-0 ps-3 small">
                      {svc.contactEmail && <li>Email: <a href={`mailto:${svc.contactEmail}`}>{svc.contactEmail}</a></li>}
                      {svc.contactPhone && <li>Phone: {svc.contactPhone}</li>}
                      {svc.website && <li>Website: <a href={svc.website} target="_blank" rel="noreferrer">{svc.website}</a></li>}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {modal.open && (
        (() => {
          const svc = services.find((s) => s.id === modal.id);
          if (!svc) return null;
          const total = Array.isArray(svc.reviews) ? svc.reviews.length : 0;
          const all = sortReviews(svc.reviews);
          const recent = all.slice(0,3);
          const start = (modal.page || 0) * pageSize;
          const page = all.slice(start, start + pageSize);
          const maxPage = Math.max(0, Math.ceil(total / pageSize) - 1);
          return (
            <div className="position-fixed top-0 start-0 w-100 h-100" style={{ background: "rgba(0,0,0,0.5)", zIndex: 1070 }} onClick={(e)=> e.target === e.currentTarget && closeReview()}>
              <div className="card" style={{ maxWidth: 520, margin: "10vh auto" }}>
                <div className="card-header d-flex align-items-center justify-content-between">
                  <h6 className="mb-0">Review: {svc.title}</h6>
                  <button className="btn btn-sm btn-outline-secondary" onClick={closeReview}>Close</button>
                </div>
                <div className="card-body">
                  {/* Context: who and which vendor */}
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <div className="text-secondary small">
                      You are reviewing as: <strong>{auth.currentUser?.email || 'Guest'}</strong>
                    </div>
                    <div className="text-secondary small">
                      Vendor: <strong>{svc.vendor || 'Unknown'}</strong>
                    </div>
                  </div>
                  {(!svc.reviews || svc.reviews.length === 0) && (
                    <div className="alert alert-info py-2">
                      {Number(svc.reviewCount || 0) > 0
                        ? `We have ${Number(svc.reviewCount)} review(s) in aggregate, but no individual reviews to display yet.`
                        : 'No reviews yet. Be the first to write one!'}
                    </div>
                  )}
                  {!modal.showAll && recent.length > 0 && (
                    <div className="mb-3">
                      <div className="fw-semibold mb-2">Recent reviews</div>
                      <div className="list-group list-group-flush">
                        {recent.map((rv, idx) => (
                          <div key={rv.id || idx} className="list-group-item px-0">
                            <div className="d-flex align-items-center justify-content-between">
                              <div className="d-flex align-items-center gap-2">
                                {renderStars(rv.rating)}
                                <span className="text-secondary small">{rv.author || rv.authorEmail || "Anonymous"}</span>
                              </div>
                              <span className="text-secondary small">{rv.createdAt ? new Date(rv.createdAt).toLocaleDateString() : ""}</span>
                            </div>
                            {rv.comment && <div className="small mt-1">{rv.comment}</div>}
                          </div>
                        ))}
                      </div>
                      {total > 3 && (
                        <button type="button" className="btn btn-sm btn-outline-secondary mt-2" onClick={() => setModal((m)=>({ ...m, showAll: true, page: 0 }))}>
                          See all reviews ({total})
                        </button>
                      )}
                    </div>
                  )}
                  {modal.showAll && (
                    <div className="mb-3">
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <div className="fw-semibold">All reviews ({total})</div>
                        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setModal((m)=>({ ...m, showAll: false, page: 0 }))}>Back</button>
                      </div>
                      <div className="list-group list-group-flush">
                        {page.map((rv, idx) => (
                          <div key={rv.id || `${idx}-${start}`} className="list-group-item px-0">
                            <div className="d-flex align-items-center justify-content-between">
                              <div className="d-flex align-items-center gap-2">
                                {renderStars(rv.rating)}
                                <span className="text-secondary small">{rv.author || rv.authorEmail || "Anonymous"}</span>
                              </div>
                              <span className="text-secondary small">{rv.createdAt ? new Date(rv.createdAt).toLocaleDateString() : ""}</span>
                            </div>
                            {rv.comment && <div className="small mt-1">{rv.comment}</div>}
                          </div>
                        ))}
                      </div>
                      <div className="d-flex align-items-center justify-content-between mt-2">
                        <span className="text-secondary small">Page {(modal.page || 0) + 1} of {maxPage + 1}</span>
                        <div className="d-flex gap-2">
                          <button className="btn btn-sm btn-outline-secondary" onClick={prevPage} disabled={(modal.page || 0) <= 0}>Prev</button>
                          <button className="btn btn-sm btn-outline-secondary" onClick={() => nextPage(total)} disabled={(modal.page || 0) >= maxPage}>Next</button>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="mb-3">
                    {[1,2,3,4,5].map((n) => (
                      <button key={n} type="button" onClick={() => setStar(svc.id, n)} className="btn btn-link p-0 me-1" aria-label={`Rate ${n} stars`}>
                        <span style={{ fontSize: 24, color: (reviews[svc.id]?.rating || 0) >= n ? "#f5a623" : "#ccc" }}>★</span>
                      </button>
                    ))}
                  </div>
                  <div className="mb-3">
                    <textarea className="form-control" rows={3} placeholder="Write a quick comment (optional)" value={reviews[svc.id]?.comment || ''} onChange={(e) => setField(svc.id, 'comment', e.target.value)} />
                  </div>
                  <button className="btn btn-primary" disabled={busy || Number(reviews[svc.id]?.rating || 0) < 1} onClick={() => submitReview(svc.id)}>
                    {busy ? 'Submitting…' : 'Submit review'}
                  </button>
                </div>
              </div>
            </div>
          );
        })()
      )}
    </div>
  );
};

export default TrendingNFTsOne;
