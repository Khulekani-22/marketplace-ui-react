import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import { useEffect, useMemo, useState } from "react";
import { auth } from "../lib/firebase";
import { useAppSync } from "../context/AppSyncContext.jsx";
import { fetchMySubscriptions, unsubscribeFromService } from "../lib/subscriptions";

export default function MySubscriptionsPage() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]); // services enriched
  const [err, setErr] = useState("");
  const [busyMap, setBusyMap] = useState({}); // serviceId -> boolean
  const tenantId = useMemo(() => sessionStorage.getItem("tenantId") || "vendor", []);
  const { appData } = useAppSync();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setErr("");
      try {
        if (!auth.currentUser) {
          setItems([]);
          setLoading(false);
          return;
        }
        const subs = await fetchMySubscriptions();
        const ids = new Set(subs.filter((x)=> (x.type||'service')==='service').map((x)=> String(x.serviceId)));

        const services = Array.isArray(appData?.services) ? appData.services : [];
        const selected = services.filter((s) => ids.has(String(s.id)));
        if (!cancelled) setItems(selected);
      } catch (e) {
        if (!cancelled) setErr(e?.message || "Failed to load subscriptions");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [tenantId]);

  async function handleUnsubscribe(id) {
    const key = String(id);
    setBusyMap((m) => ({ ...m, [key]: true }));
    try {
      await unsubscribeFromService(key);
      setItems((prev) => prev.filter((s) => String(s.id) !== key));
    } catch (e) {
      alert(e?.response?.data?.message || e?.message || "Failed to unsubscribe");
    } finally {
      setBusyMap((m) => ({ ...m, [key]: false }));
    }
  }

  return (
    <MasterLayout>
      <Breadcrumb title="My Subscriptions" />
      <div className="card">
        <div className="card-body">
          {err && <div className="alert alert-danger">{err}</div>}
          {loading ? (
            <div>Loading…</div>
          ) : (
            <div className="row g-3">
              {items.length === 0 && (
                <div className="col-12 text-secondary">No subscriptions yet.</div>
              )}
              {items.map((s) => (
                <div className="col-12 col-md-6 col-lg-4" key={String(s.id)}>
                  <div className="card h-100">
                    <img src={s.imageUrl || '/assets/images/services/placeholder.png'} className="card-img-top" alt={s.title || 'Listing'} style={{ maxHeight: 160, objectFit: 'cover' }} />
                    <div className="card-body d-flex flex-column">
                      <div className="d-flex justify-content-between align-items-start">
                        <h6 className="card-title mb-1">{s.title || 'Listing'}</h6>
                        <button type="button" className="btn btn-sm btn-outline-secondary" title="Notifications (soon)" disabled>
                          <i className="ri-notification-3-line" />
                        </button>
                      </div>
                      <div className="text-muted small mb-2">{s.category || 'General'} · {s.vendor || ''}</div>
                      {s.description && <p className="flex-grow-1 text-secondary small">{s.description.slice(0, 140)}{s.description.length > 140 ? '…' : ''}</p>}
                      <div className="d-flex justify-content-between align-items-center mt-auto">
                        <strong>R {Number(s.price || 0).toLocaleString()}</strong>
                        <div className="d-flex gap-2">
                          <span className="badge bg-neutral-200 text-neutral-900">★ {Number(s.rating || 0).toFixed(1)}</span>
                          <button className="btn btn-sm btn-outline-danger" onClick={() => handleUnsubscribe(s.id)} disabled={!!busyMap[String(s.id)]}>
                            {busyMap[String(s.id)] ? 'Removing…' : 'Unsubscribe'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </MasterLayout>
  );
}
