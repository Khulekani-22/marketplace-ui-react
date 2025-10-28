import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { auth } from "../firebase.js";
import { fetchMySubscriptions, subscribeToService, unsubscribeFromService } from "../lib/subscriptions";
import { useWallet } from "../hook/useWalletAxios";

const creditsFormatter = new Intl.NumberFormat("en-ZA");

interface PurchaseState {
  open: boolean;
  service: any | null;
  working: boolean;
  error: string;
  success: string;
}

function parsePrice(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (value === null || value === undefined) return 0;
  const text = String(value);
  const numeric = Number(text.replace(/[^0-9.]/g, ""));
  return Number.isFinite(numeric) ? numeric : 0;
}

function formatCredits(amount: number) {
  return creditsFormatter.format(Math.round(amount));
}

export default function Market1() {
  const [items, setItems] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [subs, setSubs] = useState<Set<string>>(() => new Set());
  const [purchase, setPurchase] = useState<PurchaseState>({ open: false, service: null, working: false, error: "", success: "" });
  const [redeemed, setRedeemed] = useState<Set<string>>(() => new Set());
  const navigate = useNavigate();
  const tenantId = useMemo(() => sessionStorage.getItem("tenantId") || "vendor", []);
  const { wallet, loading: walletLoading, eligible: walletEligible, redeemCredits } = useWallet();

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await api.get("/api/data/services", {
      params: { q: q || undefined, page: 1, pageSize: 40, featured: "true" },
    });
    setItems(Array.isArray(data.items) ? data.items : []);
    setLoading(false);
  }, [q]);

  // FIX: Use ref flag to prevent infinite loop
  // Previously: useEffect with [load] dependency caused infinite re-renders
  const loadedRef = useRef(false);
  useEffect(() => {
    if (!loadedRef.current) {
      loadedRef.current = true;
      load();
    }
  }, []); // Empty array - load only once on mount

  useEffect(() => {
    (async () => {
      try {
        if (!auth.currentUser) return;
        const current = await fetchMySubscriptions();
        const set = new Set(
          current
            .filter((x) => (x.type || "service") === "service")
            .map((x) => String(x.serviceId))
        );
        setSubs(set);
      } catch {}
    })();
  }, [tenantId]);

  useEffect(() => {
    if (!purchase.open || typeof document === "undefined") return;
    const { body } = document;
    if (!body) return;
    body.classList.add("modal-open");
    return () => body.classList.remove("modal-open");
  }, [purchase.open]);

  async function toggleSubscribe(serviceId: unknown) {
    try {
      if (!auth.currentUser) {
        navigate("/login", { replace: true, state: { from: window.location?.pathname || "/" } });
        return;
      }
      const id = String(serviceId);
      const isSub = subs.has(id);
      if (isSub) {
        await unsubscribeFromService(id);
        setSubs((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      } else {
        await subscribeToService(id);
        setSubs((prev) => {
          const next = new Set(prev);
          next.add(id);
          return next;
        });
      }
    } catch {}
  }

  function handleSelect(service: any) {
    if (!auth.currentUser) {
      navigate("/login", { replace: true, state: { from: window.location?.pathname || "/" } });
      return;
    }
    setPurchase({
      open: true,
      service,
      working: false,
      error: walletEligible ? "" : "My Wallet is only available to startup, vendor, and admin accounts.",
      success: "",
    });
  }

  function closePurchase() {
    setPurchase({ open: false, service: null, working: false, error: "", success: "" });
  }

  async function confirmPurchase() {
    const service = purchase.service;
    if (!service) return;
    if (!walletEligible) {
      setPurchase((prev) => ({ ...prev, error: "Your account does not have voucher access yet." }));
      return;
    }
    if (!wallet) {
      setPurchase((prev) => ({ ...prev, error: "We could not load your wallet. Please try again." }));
      return;
    }

    const amount = parsePrice(service.price);
    if (amount <= 0) {
      setPurchase((prev) => ({ ...prev, success: "This listing does not require voucher credits.", error: "" }));
      return;
    }
    if (!wallet || wallet.balance < amount) {
      setPurchase((prev) => ({ ...prev, error: "You do not have enough voucher credits for this listing." }));
      return;
    }

    setPurchase((prev) => ({ ...prev, working: true, error: "", success: "" }));
    try {
      const result = await redeemCredits(amount, {
        description: `Listing purchase: ${service.title || "Marketplace service"}`,
        reference: `listing-${service.id || "unknown"}`,
        metadata: {
          serviceId: service.id || null,
          vendor: service.vendor || null,
          category: service.category || null,
        },
      });

      if (!result.success) {
        setPurchase((prev) => ({ ...prev, working: false, error: result.error || "Unable to redeem vouchers." }));
        return;
      }

      setRedeemed((prev) => {
        const next = new Set(prev);
        next.add(String(service.id));
        return next;
      });

      setPurchase((prev) => ({
        ...prev,
        working: false,
        error: "",
        success: `Voucher applied! Remaining balance: ${formatCredits(result.wallet?.balance || 0)} credits.`,
      }));
    } catch (error) {
      setPurchase((prev) => ({ ...prev, working: false, error: "Unable to redeem vouchers." }));
    }
  }

  function renderPurchaseModal() {
    if (!purchase.open || !purchase.service) return null;
    const service = purchase.service;
    const price = parsePrice(service.price);
    const balance = wallet?.balance ?? 0;
    const shortfall = Math.max(0, price - balance);
    const confirmDisabled =
      purchase.working || walletLoading || !walletEligible || !wallet || price <= 0 || balance < price;

    return (
      <>
        <div className='modal fade show d-block' tabIndex={-1} role='dialog' aria-modal='true'>
          <div className='modal-dialog modal-dialog-centered'>
            <div className='modal-content'>
              <div className='modal-header'>
                <h5 className='modal-title'>Redeem voucher credits</h5>
                <button type='button' className='btn-close' aria-label='Close' onClick={closePurchase}></button>
              </div>
              <div className='modal-body'>
                <h6 className='mb-1'>{service.title}</h6>
                <p className='text-muted mb-3'>{service.description || "Marketplace listing"}</p>
                <dl className='row mb-0'>
                  <dt className='col-6'>Listing price</dt>
                  <dd className='col-6 text-end'>R {formatCredits(price)}</dd>
                  <dt className='col-6'>Wallet balance</dt>
                  <dd className='col-6 text-end'>R {formatCredits(balance)}</dd>
                  <dt className='col-6'>After redeeming</dt>
                  <dd className='col-6 text-end'>R {formatCredits(Math.max(0, balance - price))}</dd>
                </dl>
                {!walletEligible && (
                  <div className='alert alert-warning mt-3 mb-0'>My Wallet is only available to startup, vendor, and admin accounts.</div>
                )}
                {walletEligible && wallet && shortfall > 0 && (
                  <div className='alert alert-warning mt-3 mb-0'>
                    You need an additional {formatCredits(shortfall)} credits to redeem this listing.
                  </div>
                )}
                {purchase.error && (
                  <div className='alert alert-danger mt-3 mb-0'>{purchase.error}</div>
                )}
                {purchase.success && (
                  <div className='alert alert-success mt-3 mb-0'>{purchase.success}</div>
                )}
              </div>
              <div className='modal-footer d-flex justify-content-between'>
                <button type='button' className='btn btn-outline-secondary' onClick={closePurchase} disabled={purchase.working}>
                  Close
                </button>
                <button
                  type='button'
                  className='btn btn-primary'
                  onClick={() => void confirmPurchase()}
                  disabled={confirmDisabled}
                >
                  {purchase.working ? "Processing…" : "Redeem now"}
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className='modal-backdrop fade show'></div>
      </>
    );
  }

  return (
    <div className='container py-4'>
      <div className='d-flex align-items-end justify-content-between mb-3'>
        <div>
          <h1 className='h4 mb-1'>Featured Marketplace</h1>
          <small className='text-muted'>Discover services from trusted vendors</small>
        </div>
        <div className='d-flex gap-2'>
          <input className='form-control' placeholder='Search…' value={q} onChange={(e) => setQ(e.target.value)} />
          <button className='btn btn-primary' onClick={load}>
            Search
          </button>
        </div>
      </div>

      {walletEligible && wallet && (
        <div className='alert alert-primary d-flex justify-content-between align-items-center'>
          <span>
            <strong>My Wallet:</strong> {formatCredits(wallet.balance)} credits available.
          </span>
          <button className='btn btn-sm btn-outline-light' onClick={() => navigate("/wallet")}>
            View wallet
          </button>
        </div>
      )}

      {loading ? (
        <p>Loading…</p>
      ) : (
        <div className='row g-3'>
          {items.length === 0 && <p className='text-muted'>No featured services yet.</p>}
          {items.map((s) => {
            const price = parsePrice(s.price);
            const id = String(s.id);
            const isRedeemed = redeemed.has(id);
            const isSubscribed = subs.has(id);
            const balance = wallet?.balance ?? 0;
            const insufficient = walletEligible && wallet && price > balance;
            const redeemLabel = isRedeemed ? "Redeemed" : walletEligible ? "Redeem" : "Select";
            const redeemClass = isRedeemed ? "btn btn-success btn-sm" : "btn btn-outline-primary btn-sm";

            return (
              <div key={id} className='col-12 col-md-6 col-lg-4'>
                <div className='card h-100'>
                  <div className='card-body d-flex flex-column'>
                    <div className='d-flex justify-content-between align-items-start gap-2'>
                      <h5 className='card-title mb-0'>{s.title}</h5>
                      {s.isFeatured && <span className='badge text-bg-success'>Featured</span>}
                    </div>
                    <div className='text-muted mb-2'>{s.category} · {s.vendor}</div>
                    <p className='flex-grow-1'>{s.description || "Quality service for SMMEs."}</p>
                    <div className='d-flex flex-column gap-2'>
                      <strong>R {formatCredits(price)}</strong>
                      {walletEligible && wallet && (
                        <small className={insufficient ? "text-danger" : "text-success"}>
                          {insufficient
                            ? `Short by ${formatCredits(price - balance)} credits`
                            : "Covered by your voucher balance"}
                        </small>
                      )}
                      <div className='d-flex justify-content-between align-items-center'>
                        <button
                          className={redeemClass}
                          onClick={() => handleSelect(s)}
                          disabled={walletLoading || isRedeemed}
                        >
                          {walletLoading ? "Checking wallet…" : redeemLabel}
                        </button>
                        <button
                          className={isSubscribed ? "btn btn-sm btn-secondary" : "btn btn-sm btn-primary"}
                          onClick={() => toggleSubscribe(s.id)}
                        >
                          {isSubscribed ? "Subscribed" : "Subscribe"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {renderPurchaseModal()}
    </div>
  );
}
