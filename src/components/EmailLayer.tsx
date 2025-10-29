// @ts-nocheck
import { Icon } from "@iconify/react/dist/iconify.js";
import { Link } from "react-router-dom";
import { useState, useMemo, useEffect, useCallback } from "react";
import { useMessages } from "../context/useMessages";
import { useVendor } from "../context/useVendor";
import { api } from "../lib/api";
import { useAppSync } from "../context/useAppSync";
import { auth } from "../firebase.js";
import { fetchMyVendorListings } from "../lib/listings";
import { hasFullAccess, normalizeRole } from "../utils/roles";

function normalizeTenant(id?: string | null) {
  if (!id) return "public";
  const v = id.toString().toLowerCase();
  return v === "vendor" ? "public" : v;
}

function makePendingKey(tenantId?: string | null, vendorHint?: string | null) {
  const tenant = normalizeTenant(tenantId);
  const vendor = (vendorHint || "").trim().toLowerCase();
  if (!vendor) return null;
  return `vendor_pending_listings:${tenant}:${vendor}`;
}

function listingId(entry: any) {
  return String(entry?.id || entry?.serviceId || entry?.listingId || "");
}

function parsePending(raw: unknown) {
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

const EmailLayer = () => {
  const messagesContext = useMessages() as any;
  const {
    threads = [],
    unreadCount = 0,
    markRead = () => {},
    refresh = () => Promise.resolve(),
    loading = false,
    refreshing = false,
    error = null,
    syncMessagesToLive = () => Promise.resolve(false),
    activate: activateMessages = () => Promise.resolve(false),
    activated = false,
  } = messagesContext || {};
  
  const vendorContext = useVendor() as any;
  const { vendor = null } = vendorContext || {};
  const [search, setSearch] = useState("");
  const [folder, setFolder] = useState("inbox"); // inbox | sent
  // Role selection for viewing/sending context
  const sessionRole = normalizeRole((typeof window !== 'undefined' ? sessionStorage.getItem('role') : null) || 'member');
  const [viewAs, setViewAs] = useState(() => {
    const saved = (typeof window !== 'undefined' ? sessionStorage.getItem('messageViewAs') : null) || '';
    if (saved) return saved;
    if (hasFullAccess(sessionRole)) return vendor?.vendorId ? 'vendor' : 'admin';
    return vendor?.vendorId ? 'vendor' : 'user';
  });
  const [compose, setCompose] = useState({ open: false, mode: vendor?.vendorId ? "vendor_admin" : "vendor_subscriber", serviceId: "", subject: "", content: "", sending: false, err: null, ok: false, subscriberEmail: "" });
  const [myListings, setMyListings] = useState([]);
  const [mySubs, setMySubs] = useState([]);
  const [subsSuggest, setSubsSuggest] = useState({ q: "", page: 1, pageSize: 10, total: 0, items: [], loading: false });
  const tenantId = (typeof window !== 'undefined' ? sessionStorage.getItem('tenantId') : null) || 'vendor';
  const { appData } = useAppSync();
  const tenantKey = useMemo(() => (tenantId === 'vendor' ? 'public' : tenantId).toString().toLowerCase(), [tenantId]);
  const pendingKey = useMemo(
    () => makePendingKey(tenantId, vendor?.vendorId || vendor?.email || vendor?.id || ''),
    [tenantId, vendor?.vendorId, vendor?.email, vendor?.id]
  );
  const [pendingLocal, setPendingLocal] = useState<any[]>([]);

  useEffect(() => {
    if (!activated) {
      activateMessages({ force: true }).catch(() => void 0);
    }
  }, [activateMessages, activated]);

  useEffect(() => {
    if (!pendingKey) {
      setPendingLocal([]);
      return;
    }
    if (typeof window === 'undefined') {
      setPendingLocal([]);
      return;
    }
    try {
      const stored = window.localStorage.getItem(pendingKey);
      setPendingLocal(parsePending(stored));
    } catch {
      setPendingLocal([]);
    }
  }, [pendingKey]);

  const mergePendingListings = useCallback(
    (listings: any[]) => {
      const base = Array.isArray(listings) ? [...listings] : [];
      const seen = new Set(base.map((item) => listingId(item)).filter(Boolean) as string[]);
      pendingLocal.forEach((entry) => {
        const id = listingId(entry);
        if (!id || seen.has(id)) return;
        seen.add(id);
        base.unshift(entry);
      });
      return base;
    },
    [pendingLocal]
  );

  const userEmail = (auth.currentUser?.email || sessionStorage.getItem('userEmail') || "").toLowerCase();
  const role = sessionRole;
  const isAdmin = hasFullAccess(role);
  const canSync = isAdmin || !!vendor?.vendorId;
  const myVendorId = vendor?.vendorId || vendor?.id || '';
  const mySenderIds = useMemo(() => {
    const ids = [];
    if (viewAs === 'user') {
      if (userEmail) ids.push(`user:${userEmail}`);
    } else if (viewAs === 'vendor') {
      if (myVendorId) ids.push(`vendor:${String(myVendorId).toLowerCase()}`);
      if (userEmail) ids.push(`vendor:${userEmail}`); // legacy vendor keyed by email
    } else if (viewAs === 'admin') {
      ids.push('admin');
      if (userEmail) ids.push(`admin:${userEmail}`);
    }
    return ids;
  }, [viewAs, userEmail, myVendorId]);

  const sentThreads = useMemo(() => {
    return threads.filter((t) => Array.isArray(t?.messages) && t.messages.some((m) => mySenderIds.includes(String(m.senderId || '').toLowerCase())));
  }, [threads, mySenderIds]);
  const inboxThreads = useMemo(() => {
    return threads.filter((t) => Array.isArray(t?.messages) && t.messages.some((m) => !mySenderIds.includes(String(m.senderId || '').toLowerCase())));
  }, [threads, mySenderIds]);
  const sentCount = sentThreads.length;
  const inboxCount = inboxThreads.length;

  // Show all threads in Message Center inbox to avoid over-filtering by role identity.
  const baseList = folder === 'sent' ? sentThreads : threads;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return baseList;
    return baseList.filter((t) => {
      const subject = (t.subject || "").toLowerCase();
      const snippet = (t.lastMessage?.snippet || "").toLowerCase();
      return subject.includes(q) || snippet.includes(q);
    });
  }, [baseList, search]);

  const allRead = unreadCount === 0;
  const handleMarkAllRead = async () => {
    await Promise.all(threads.filter((t) => !t.read).map((t) => markRead(t.id, true)));
  };

  // Manual sync state
  const [syncBusy, setSyncBusy] = useState(false);
  const [syncOk, setSyncOk] = useState(false);
  const [syncErr, setSyncErr] = useState("");
  const [lastSync, setLastSync] = useState(() => {
    try { return localStorage.getItem('sl_messages_last_sync') || ""; } catch { return ""; }
  });

  // Debug logging to see button state
  console.log('EmailLayer Button Debug:', { 
    loading, 
    refreshing, 
    syncBusy, 
    'full-refresh-disabled': loading || refreshing || syncBusy,
    'quick-refresh-disabled': loading || refreshing,
    messagesContext: !!messagesContext,
    contextValues: messagesContext
  });

  async function handleSyncNow() {
    if (!canSync) {
      setSyncErr('Vendor or admin access required to sync.');
      setTimeout(() => setSyncErr(''), 2500);
      return;
    }
    setSyncBusy(true); setSyncErr(""); setSyncOk(false);
    try {
      const ok = await syncMessagesToLive();
      if (!ok) throw new Error("Sync did not complete");
      const ts = new Date().toISOString();
      try { localStorage.setItem('sl_messages_last_sync', ts); } catch {}
      setLastSync(ts);
      setSyncOk(true);
      setTimeout(() => setSyncOk(false), 1500);
    } catch (e: any) {
      setSyncErr(e?.message || "Sync failed");
      setTimeout(() => setSyncErr(""), 2500);
    } finally {
      setSyncBusy(false);
    }
  }

  // Enhanced full refresh that clears cache and forces reload from backend
  async function handleFullRefresh() {
    try {
      // Clear message cache first
      try {
        localStorage.removeItem('sl_messages_cache_v1');
      } catch {}
      
      // Force refresh with cache bypass
      await refresh({ silent: false, force: true });
      
      // Also trigger a sync to ensure we have latest data
      if (canSync) {
        try {
          await syncMessagesToLive();
        } catch (e) {
          console.warn('Sync during full refresh failed:', e);
        }
      }
    } catch (e: any) {
      console.error('Full refresh failed:', e);
    }
  }

  // Persist role selection and adjust compose defaults
  useEffect(() => {
    try { sessionStorage.setItem('messageViewAs', viewAs); } catch {}
    setCompose((c) => ({
      ...c,
      mode: viewAs === 'vendor' ? 'vendor_admin' : 'vendor_subscriber',
      serviceId: '',
      subscriberEmail: ''
    }));
  }, [viewAs]);

  function openCompose() {
    setCompose((c) => ({ ...c, open: true }));
  }
  function closeCompose() {
    setCompose({ open: false, mode: vendor?.vendorId ? "vendor_admin" : "vendor_subscriber", serviceId: "", subject: "", content: "", sending: false, err: null, ok: false });
  }
  async function loadLists() {
    try {
      const live = appData || { startups: [], vendors: [], companies: [], services: [] };
      const services = Array.isArray(live?.services) ? live.services : [];

      let apiListings: any[] = [];
      try {
        const { listings } = await fetchMyVendorListings();
        apiListings = Array.isArray(listings) ? listings : [];
      } catch {
        apiListings = [];
      }

      const vendorIdCanonical = vendor?.vendorId ? String(vendor.vendorId) : (vendor?.id ? String(vendor.id) : "");
      const vendorEmailLower = (vendor?.email || vendor?.contactEmail || "").toLowerCase();

      const fallbackListings = services.filter((s) => {
        const serviceVendorId = String(s.vendorId || "");
        const serviceEmail = (s.contactEmail || s.email || "").toLowerCase();
        return (
          (vendorIdCanonical && serviceVendorId === vendorIdCanonical) ||
          (vendorEmailLower && serviceEmail === vendorEmailLower)
        );
      });

      const mergedMap = new Map<string, any>();
      [...apiListings, ...fallbackListings].forEach((item) => {
        const id = listingId(item);
        if (!id) return;
        if (mergedMap.has(id)) {
          mergedMap.set(id, { ...mergedMap.get(id), ...item });
        } else {
          mergedMap.set(id, item);
        }
      });

      const mergedListings = mergePendingListings(Array.from(mergedMap.values()));
      const listingOptions = mergedListings.reduce(
        (acc, item) => {
          const id = listingId(item);
          if (!id) return acc;
          const title = item?.title || item?.name || item?.listingTitle || "Untitled listing";
          acc.push({ id, title });
          return acc;
        },
        [] as Array<{ id: string; title: string }>
      );
      setMyListings(listingOptions);

      try {
        const subs = await api.get(`/api/subscriptions/my`).then((r) => (Array.isArray(r.data) ? r.data : []));
        const withTitles = subs.map((s) => ({
          ...s,
          title:
            listingOptions.find((x) => String(x.id) === String(s.serviceId))?.title ||
            (services.find((x) => String(x.id) === String(s.serviceId))?.title) ||
            s.serviceId,
        }));
        setMySubs(withTitles);
      } catch (err) {
        const code = (err as any)?.code;
        if (code === "ERR_NETWORK") {
          const tenantKeyLocal = (tenantId === 'vendor' ? 'public' : tenantId).toString().toLowerCase();
          const fallbackSubs = Array.isArray(live?.subscriptions) ? live.subscriptions : [];
          const owned = fallbackSubs.filter((s) => {
            const sameTenant = ((s?.tenantId ?? 'public').toString().toLowerCase()) === tenantKeyLocal;
            const email = (s?.email || '').toLowerCase();
            return sameTenant && email === userEmail;
          });
          const withTitles = owned.map((s) => ({
            ...s,
            title:
              listingOptions.find((x) => String(x.id) === String(s.serviceId))?.title ||
              (services.find((x) => String(x.id) === String(s.serviceId))?.title) ||
              s.serviceId,
          }));
          setMySubs(withTitles);
        } else {
          setMySubs([]);
        }
      }
    } catch {
      setMyListings([]);
      setMySubs([]);
    }
  }
  const fallbackSubscribersForService = useCallback(
    (serviceId, q = '', page = 1, pageSize = 10) => {
      if (!serviceId) return { items: [], total: 0 };
      const live = appData || { startups: [], vendors: [], companies: [], services: [], subscriptions: [] };
      const raw = Array.isArray(live?.subscriptions) ? live.subscriptions : [];
      const normalizedVendorId = vendor?.vendorId ? String(vendor.vendorId).toLowerCase() : '';
      const search = (q || '').trim().toLowerCase();
      const eligible = raw.filter((s) => {
        const sameTenant = ((s?.tenantId ?? 'public').toString().toLowerCase()) === tenantKey;
        const matchesService = String(s?.serviceId || '') === String(serviceId);
        const matchesVendor = normalizedVendorId ? String(s?.vendorId || '').toLowerCase() === normalizedVendorId : true;
        return sameTenant && matchesService && matchesVendor;
      });
      const filtered = search
        ? eligible.filter((s) => (s?.email || '').toLowerCase().includes(search))
        : eligible;
      const total = filtered.length;
      const start = Math.max(0, (Number(page) - 1) * Number(pageSize));
      const end = start + Number(pageSize);
      const items = filtered.slice(start, end).map((s) => ({
        id: s.id || `${s.serviceId}-${s.email}`,
        email: s.email,
        tenantId: s.tenantId,
        serviceId: s.serviceId,
      }));
      return { items, total };
    },
    [appData, tenantKey, vendor]
  );

  async function loadSubscribers(serviceId, q = subsSuggest.q, page = subsSuggest.page, pageSize = subsSuggest.pageSize) {
    try {
      setSubsSuggest((s) => ({ ...s, loading: true }));
      const { data } = await api.get(`/api/subscriptions/service/${encodeURIComponent(serviceId)}`, { params: { q, page, pageSize } });
      const pageNum = Number(data?.page || page);
      const ps = Number(data?.pageSize || pageSize);
      const total = Number(data?.total || 0);
      const items = Array.isArray(data?.items) ? data.items : [];
      setSubsSuggest({ q, page: pageNum, pageSize: ps, total, items, loading: false });
    } catch {
      const fallback = fallbackSubscribersForService(serviceId, q, page, pageSize);
      setSubsSuggest((s) => (
        fallback.total > 0
          ? { q, page, pageSize, total: fallback.total, items: fallback.items, loading: false }
          : { ...s, q, page, pageSize, loading: false }
      ));
    }
  }
  useEffect(() => {
    if (compose.open) loadLists();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [compose.open, vendor?.vendorId, vendor?.email, vendor?.id, tenantId, mergePendingListings, appData, userEmail]);
  useEffect(() => {
    if (compose.open && compose.mode === 'vendor_to_subscriber' && compose.serviceId) loadSubscribers(compose.serviceId, subsSuggest.q, 1, subsSuggest.pageSize);
    else setSubsSuggest({ q: "", page: 1, pageSize: 10, total: 0, items: [], loading: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [compose.open, compose.mode, compose.serviceId]);

  async function sendCompose(e) {
    e?.preventDefault?.();
    if (!compose.serviceId || !compose.content.trim()) return;
    setCompose((c) => ({ ...c, sending: true, err: null, ok: false }));
    try {
      const type = compose.mode === 'vendor_admin' ? 'vendor_admin' : (compose.mode === 'vendor_to_subscriber' ? 'vendor_to_subscriber' : 'vendor_subscriber');
      const payload = {
        type,
        serviceId: compose.serviceId,
        listingId: compose.serviceId,
        subject: compose.subject,
        content: compose.content,
        subscriberEmail: compose.mode === 'vendor_to_subscriber' ? compose.subscriberEmail : undefined,
      };
      await api.post(`/api/messages/compose`, payload);
      setCompose((c) => ({ ...c, sending: false, ok: true }));
      await refresh({ force: true });
      try { await syncMessagesToLive(); } catch {}
      setTimeout(() => closeCompose(), 1200);
    } catch (e) {
      const status = e?.response?.status;
      const msg = e?.response?.data?.message || e?.message || 'Failed to send';
      const extra = status === 401 ? ' Please sign in to send messages.' : '';
      setCompose((c) => ({ ...c, sending: false, err: msg + extra }));
    }
  }

  return (
    <>
    <div className='row gy-4'>
      <div className='col-xxl-3'>
        <div className='card h-100 p-0'>
          <div className='card-body p-24'>
            <div className='mt-16'>
              <button type='button' className='btn btn-primary btn-sm w-100 mb-3 d-flex align-items-center gap-2' onClick={openCompose} disabled={viewAs === 'admin'}>
                <Icon icon='fa6-regular:square-plus' className='icon text-lg line-height-1' />
                Compose
              </button>
              <ul>
                <li className='item-active mb-4'>
                  <button type='button' onClick={() => setFolder('inbox')} className={`bg-hover-primary-50 px-12 py-8 w-100 radius-8 text-start ${folder==='inbox' ? 'text-primary-600 fw-semibold' : 'text-secondary-light'}`}>
                    <span className='d-flex align-items-center gap-10 justify-content-between w-100'>
                      <span className='d-flex align-items-center gap-10'>
                        <span className='icon text-xxl line-height-1 d-flex'>
                          <Icon icon='uil:envelope' className='icon line-height-1' />
                        </span>
                        <span className='fw-semibold'>Message Center</span>
                      </span>
                      <span className='fw-medium'>{inboxCount}</span>
                    </span>
                  </button>
                </li>
                <li className='mb-4'>
                  <button type='button' onClick={() => setFolder('sent')} className={`bg-hover-primary-50 px-12 py-8 w-100 radius-8 text-start ${folder==='sent' ? 'text-primary-600 fw-semibold' : 'text-secondary-light'}`}>
                    <span className='d-flex align-items-center gap-10 justify-content-between w-100'>
                      <span className='d-flex align-items-center gap-10'>
                        <span className='icon text-xxl line-height-1 d-flex'>
                          <Icon icon='ion:paper-plane-outline' className='icon line-height-1' />
                        </span>
                        <span className='fw-semibold'>Sent</span>
                      </span>
                      <span className='fw-medium'>{sentCount}</span>
                    </span>
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      <div className='col-xxl-9'>
        <div className='card h-100 p-0 email-card'>
          <div className='card-header border-bottom bg-base py-16 px-24'>
            {/* Sync Status Banner */}
            {(syncOk || syncErr || lastSync) && (
              <div className={`alert ${syncOk ? 'alert-success' : syncErr ? 'alert-danger' : 'alert-info'} py-2 mb-3`}>
                <div className="d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-2">
                    <Icon icon={syncOk ? 'mdi:check-circle' : syncErr ? 'mdi:alert-circle' : 'mdi:information'} />
                    <span>
                      {syncOk && 'Messages synced successfully'}
                      {syncErr && `Sync error: ${syncErr}`}
                      {!syncOk && !syncErr && lastSync && `Last sync: ${new Date(lastSync).toLocaleString()}`}
                    </span>
                  </div>
                  {lastSync && (
                    <small className="text-muted">
                      {new Date(lastSync).toLocaleString()}
                    </small>
                  )}
                </div>
              </div>
            )}
            
            {error && (
              <div className="alert alert-warning py-2 mb-3">
                <div className="d-flex align-items-center gap-2">
                  <Icon icon="mdi:alert" />
                  <span>{error}</span>
                </div>
              </div>
            )}
            
            <div className='d-flex flex-wrap align-items-center justify-content-between gap-4'>
              <div className='d-flex align-items-center gap-3'>
                <button
                  type='button'
                  className='btn btn-sm btn-outline-primary'
                  onClick={handleFullRefresh}
                  disabled={loading || refreshing || syncBusy}
                  title='Clear cache and reload all messages from backend appData.json'
                >
                  <Icon icon='tabler:reload' className='me-1' />
                  {refreshing ? 'Refreshing…' : 'Full Refresh'}
                </button>
                <button
                  type='button'
                  className='btn btn-sm btn-outline-secondary'
                  onClick={() => {
                    void refresh({ silent: true, force: true });
                  }}
                  disabled={loading || refreshing}
                >
                  <Icon icon='mdi:refresh' className='me-1' />
                  {refreshing ? 'Refreshing…' : 'Quick Refresh'}
                </button>
                <button type='button' className='btn btn-sm btn-outline-secondary' onClick={handleMarkAllRead} disabled={allRead}>
                  <Icon icon='gravity-ui:envelope-open' className='me-1' /> Mark all as read
                </button>
                <button
                  type='button'
                  className='btn btn-sm btn-outline-secondary'
                  onClick={handleSyncNow}
                  disabled={syncBusy || !canSync}
                  title={canSync ? 'Write messages to server appData.json' : 'Vendor or admin access required'}
                >
                  <Icon icon='mdi:cloud-upload-outline' className='me-1' /> {syncBusy ? 'Syncing…' : 'Sync Now'}
                </button>
                {lastSync && !syncOk && !syncErr && (
                  <small className="text-muted">
                    Last: {new Date(lastSync).toLocaleString()}
                  </small>
                )}
                <div className='d-flex align-items-center gap-2'>
                  <label className='form-label mb-0 small text-muted'>View as</label>
                  <select className='form-select form-select-sm' value={viewAs} onChange={(e)=>setViewAs(e.target.value)}>
                    <option value='user'>Startup</option>
                    {vendor?.vendorId && (<option value='vendor'>Vendor</option>)}
                    {hasFullAccess(role) && (<option value='admin'>Admin</option>)}
                  </select>
                </div>
              </div>
              <div className='d-flex align-items-center gap-3'>
                <form className='navbar-search d-flex' onSubmit={(e) => e.preventDefault()}>
                  <input type='text' className='bg-base h-40-px w-auto' name='search' placeholder='Search' value={search} onChange={(e) => setSearch(e.target.value)} />
                  <Icon icon='ion:search-outline' className='icon' />
                </form>
                <div className='small text-muted'>
                  {syncErr ? (<span className='text-danger'>{syncErr}</span>) : syncOk ? (<span className='text-success'>Synced</span>) : (lastSync ? `Last sync: ${new Date(lastSync).toLocaleString()}` : '')}
                </div>
              </div>
            </div>
          </div>
          <div className='card-body p-0'>
            {error && (
              <div className='alert alert-danger rounded-0 border-bottom mb-0'>
                {error}
              </div>
            )}
            <ul className='overflow-x-auto'>
              {filtered.map((t) => (
                <li key={t.id} className={`email-item px-24 py-16 d-flex gap-4 align-items-center border-bottom cursor-pointer bg-hover-neutral-200 min-w-max-content ${t.read ? '' : 'bg-primary-50'}`}>
                  <Link to={`/view-details?tid=${encodeURIComponent(t.id)}`} className='text-primary-light fw-medium text-md text-line-1 w-190-px'>
                    {t.subject || 'Message'}
                  </Link>
                  <Link to={`/view-details?tid=${encodeURIComponent(t.id)}`} className='text-primary-light fw-medium mb-0 text-line-1 max-w-740-px'>
                    {t.lastMessage?.snippet || t.messages?.[t.messages?.length-1]?.content || ''}
                  </Link>
                  <span className='text-primary-light fw-medium min-w-max-content ms-auto'>
                    {t.lastMessage?.date ? new Date(t.lastMessage.date).toLocaleString() : ''}
                  </span>
                </li>
              ))}
              {filtered.length === 0 && (
                <li className='px-24 py-16 text-muted'>
                  {folder === 'sent' ? 'No sent messages for this role; try switching “View as”.' : 'No messages yet. Try switching “View as” or start a conversation.'}
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
    {compose.open && (
      <div className='position-fixed top-0 start-0 w-100 h-100' style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1070 }} onClick={(e) => e.target === e.currentTarget && closeCompose()}>
        <div className='card' style={{ maxWidth: 640, margin: '8vh auto' }}>
          <div className='card-header d-flex align-items-center justify-content-between'>
            <h6 className='mb-0'>Compose message</h6>
            <button className='btn btn-sm btn-outline-secondary' onClick={closeCompose}>Close</button>
          </div>
          <form onSubmit={sendCompose}>
            <div className='card-body'>
              {compose.err && <div className='alert alert-danger py-2 mb-2'>{compose.err}</div>}
              {compose.ok && <div className='alert alert-success py-2 mb-2'>Sent</div>}
              <div className='mb-2'>
                <label className='form-label'>Type</label>
                <select className='form-select' value={compose.mode} onChange={(e) => setCompose((c) => ({ ...c, mode: e.target.value, serviceId: '', subscriberEmail: '' }))}>
                  {viewAs === 'vendor' && vendor?.vendorId && <option value='vendor_admin'>Ask Admin about my listing</option>}
                  {viewAs === 'user' && <option value='vendor_subscriber'>Message Vendor about a subscribed listing</option>}
                  {viewAs === 'vendor' && vendor?.vendorId && <option value='vendor_to_subscriber'>Message a subscriber of my listing</option>}
                </select>
              </div>
              {compose.mode === 'vendor_admin' && viewAs === 'vendor' && vendor?.vendorId && (
                <div className='mb-2'>
                  <label className='form-label'>Select one of my listings</label>
                  <select className='form-select' value={compose.serviceId} onChange={(e) => setCompose((c) => ({ ...c, serviceId: e.target.value }))}>
                    <option value=''>Select…</option>
                    {myListings.map((s) => (
                      <option key={s.id} value={s.id}>{s.title}</option>
                    ))}
                  </select>
                </div>
              )}
              {compose.mode === 'vendor_subscriber' && viewAs === 'user' && (
                <div className='mb-2'>
                  <label className='form-label'>Select one of my subscriptions</label>
                  <select className='form-select' value={compose.serviceId} onChange={(e) => setCompose((c) => ({ ...c, serviceId: e.target.value }))}>
                    <option value=''>Select…</option>
                    {mySubs.map((s) => (
                      <option key={s.id} value={s.serviceId}>{s.title}</option>
                    ))}
                  </select>
                </div>
              )}
              {compose.mode === 'vendor_to_subscriber' && viewAs === 'vendor' && (
                <>
                  <div className='mb-2'>
                    <label className='form-label'>Select my listing</label>
                    <select className='form-select' value={compose.serviceId} onChange={(e) => setCompose((c) => ({ ...c, serviceId: e.target.value, subscriberEmail: '' }))}>
                      <option value=''>Select…</option>
                      {myListings.map((s) => (
                        <option key={s.id} value={s.id}>{s.title}</option>
                      ))}
                    </select>
                  </div>
                  <div className='mb-2'>
                    <label className='form-label'>To (subscriber email)</label>
                    <input
                      className='form-control'
                      value={compose.subscriberEmail}
                      onChange={(e) => {
                        const v = e.target.value;
                        setCompose((c) => ({ ...c, subscriberEmail: v }));
                        // live filter suggestions by q
                        setSubsSuggest((s) => ({ ...s, q: v, page: 1 }));
                      }}
                      placeholder='Type to search subscribers'
                      disabled={!compose.serviceId}
                    />
                    {compose.serviceId && (
                      <div className='border rounded mt-2 p-2 bg-base'>
                        <div className='d-flex justify-content-between align-items-center mb-2'>
                          <div className='small text-secondary'>Suggestions</div>
                          <div className='small text-secondary'>
                            {subsSuggest.loading ? 'Loading…' : `${subsSuggest.total} total`}
                          </div>
                        </div>
                        <div className='list-group list-group-flush' style={{ maxHeight: 160, overflowY: 'auto' }}>
                          {subsSuggest.items.map((u) => (
                            <button type='button' key={u.id} className='list-group-item list-group-item-action py-1' onClick={() => setCompose((c) => ({ ...c, subscriberEmail: u.email }))}>
                              {u.email}
                            </button>
                          ))}
                          {!subsSuggest.loading && subsSuggest.items.length === 0 && (
                            <div className='text-muted small px-2 py-1'>No matches</div>
                          )}
                        </div>
                        <div className='d-flex justify-content-between align-items-center mt-2'>
                          <button type='button' className='btn btn-sm btn-outline-secondary' disabled={subsSuggest.page <= 1 || subsSuggest.loading} onClick={() => loadSubscribers(compose.serviceId, subsSuggest.q, Math.max(1, subsSuggest.page - 1), subsSuggest.pageSize)}>Prev</button>
                          <span className='small text-secondary'>Page {subsSuggest.page} of {Math.max(1, Math.ceil((subsSuggest.total || 0) / (subsSuggest.pageSize || 10)))}</span>
                          <button type='button' className='btn btn-sm btn-outline-secondary' disabled={subsSuggest.loading || subsSuggest.page >= Math.ceil((subsSuggest.total || 0) / (subsSuggest.pageSize || 10))} onClick={() => loadSubscribers(compose.serviceId, subsSuggest.q, subsSuggest.page + 1, subsSuggest.pageSize)}>Next</button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
              <div className='mb-2'>
                <label className='form-label'>Subject (optional)</label>
                <input className='form-control' value={compose.subject} onChange={(e) => setCompose((c) => ({ ...c, subject: e.target.value }))} />
              </div>
              <div className='mb-2'>
                <label className='form-label'>Message</label>
                <textarea rows={6} className='form-control' value={compose.content} onChange={(e) => setCompose((c) => ({ ...c, content: e.target.value }))} />
              </div>
            </div>
            <div className='card-footer d-flex justify-content-end gap-2'>
              <button type='button' className='btn btn-outline-secondary' onClick={closeCompose} disabled={compose.sending}>Cancel</button>
              <button type='submit' className='btn btn-primary' disabled={compose.sending || !compose.serviceId || !compose.content.trim() || (compose.mode==='vendor_to_subscriber' && !compose.subscriberEmail)}>{compose.sending ? 'Sending…' : 'Send'}</button>
            </div>
          </form>
        </div>
      </div>
    )}
    </>
  );
};

export default EmailLayer;
