import { Icon } from "@iconify/react/dist/iconify.js";
import { Link } from "react-router-dom";
import { useState, useMemo, useEffect } from "react";
import { useMessages } from "../context/MessagesContext.jsx";
import { useVendor } from "../context/VendorContext.jsx";
import appDataLocal from "../data/appData.json";
import { api } from "../lib/api";

const EmailLayer = () => {
  const { threads, unreadCount, markRead, refresh } = useMessages();
  const { vendor } = useVendor();
  const [search, setSearch] = useState("");
  const [compose, setCompose] = useState({ open: false, mode: vendor?.vendorId ? "vendor_admin" : "vendor_subscriber", serviceId: "", subject: "", content: "", sending: false, err: null, ok: false, subscriberEmail: "" });
  const [myListings, setMyListings] = useState([]);
  const [mySubs, setMySubs] = useState([]);
  const [subsSuggest, setSubsSuggest] = useState({ q: "", page: 1, pageSize: 10, total: 0, items: [], loading: false });
  const tenantId = (typeof window !== 'undefined' ? sessionStorage.getItem('tenantId') : null) || 'vendor';

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return threads;
    return threads.filter((t) => {
      const subject = (t.subject || "").toLowerCase();
      const snippet = (t.lastMessage?.snippet || "").toLowerCase();
      return subject.includes(q) || snippet.includes(q);
    });
  }, [threads, search]);

  const allRead = unreadCount === 0;
  const handleMarkAllRead = async () => {
    await Promise.all(threads.filter((t) => !t.read).map((t) => markRead(t.id, true)));
  };

  function openCompose() {
    setCompose((c) => ({ ...c, open: true }));
  }
  function closeCompose() {
    setCompose({ open: false, mode: vendor?.vendorId ? "vendor_admin" : "vendor_subscriber", serviceId: "", subject: "", content: "", sending: false, err: null, ok: false });
  }
  async function loadLists() {
    try {
      const res = await fetch(`/api/lms/live`, { headers: { 'x-tenant-id': tenantId } });
      const live = res.ok ? await res.json() : appDataLocal;
      const services = Array.isArray(live?.services) ? live.services : [];
      // Vendor listings
      if (vendor?.vendorId) {
        const mine = services.filter((s) => String(s.vendorId || "") === String(vendor.vendorId));
        setMyListings(mine.map((s) => ({ id: s.id, title: s.title })));
      } else {
        setMyListings([]);
      }
      // Subscriptions for current user -> resolve titles
      try {
        const subs = await api.get(`/api/subscriptions/my`).then((r) => Array.isArray(r.data) ? r.data : []);
        const withTitles = subs.map((s) => ({ ...s, title: (services.find((x) => String(x.id) === String(s.serviceId))?.title) || s.serviceId }));
        setMySubs(withTitles);
      } catch {
        setMySubs([]);
      }
    } catch {
      setMyListings([]);
      setMySubs([]);
    }
  }
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
      setSubsSuggest((s) => ({ ...s, loading: false, items: [], total: 0 }));
    }
  }
  useEffect(() => {
    if (compose.open) loadLists();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [compose.open, vendor?.vendorId, tenantId]);
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
      await refresh();
      setTimeout(() => closeCompose(), 1200);
    } catch (e) {
      setCompose((c) => ({ ...c, sending: false, err: e?.response?.data?.message || e?.message || 'Failed to send' }));
    }
  }

  return (
    <>
    <div className='row gy-4'>
      <div className='col-xxl-3'>
        <div className='card h-100 p-0'>
          <div className='card-body p-24'>
            <div className='mt-16'>
              <button type='button' className='btn btn-primary btn-sm w-100 mb-3 d-flex align-items-center gap-2' onClick={openCompose}>
                <Icon icon='fa6-regular:square-plus' className='icon text-lg line-height-1' />
                Compose
              </button>
              <ul>
                <li className='item-active mb-4'>
                  <Link to='/email' className='bg-hover-primary-50 px-12 py-8 w-100 radius-8 text-secondary-light'>
                    <span className='d-flex align-items-center gap-10 justify-content-between w-100'>
                      <span className='d-flex align-items-center gap-10'>
                        <span className='icon text-xxl line-height-1 d-flex'>
                          <Icon icon='uil:envelope' className='icon line-height-1' />
                        </span>
                        <span className='fw-semibold'>Inbox</span>
                      </span>
                      <span className='fw-medium'>{threads.length}</span>
                    </span>
                  </Link>
                </li>
                <li className='mb-4'>
                  <Link to='/email' className='bg-hover-primary-50 px-12 py-8 w-100 radius-8 text-secondary-light'>
                    <span className='d-flex align-items-center gap-10 justify-content-between w-100'>
                      <span className='d-flex align-items-center gap-10'>
                        <span className='icon text-xxl line-height-1 d-flex'>
                          <Icon icon='ph:star-bold' className='icon line-height-1' />
                        </span>
                        <span className='fw-semibold'>Unread</span>
                      </span>
                      <span className='fw-medium'>{unreadCount}</span>
                    </span>
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      <div className='col-xxl-9'>
        <div className='card h-100 p-0 email-card'>
          <div className='card-header border-bottom bg-base py-16 px-24'>
            <div className='d-flex flex-wrap align-items-center justify-content-between gap-4'>
              <div className='d-flex align-items-center gap-3'>
                <button type='button' className='btn btn-sm btn-outline-secondary' onClick={refresh}>
                  <Icon icon='tabler:reload' className='me-1' /> Refresh
                </button>
                <button type='button' className='btn btn-sm btn-outline-secondary' onClick={handleMarkAllRead} disabled={allRead}>
                  <Icon icon='gravity-ui:envelope-open' className='me-1' /> Mark all as read
                </button>
              </div>
              <form className='navbar-search d-flex' onSubmit={(e) => e.preventDefault()}>
                <input type='text' className='bg-base h-40-px w-auto' name='search' placeholder='Search' value={search} onChange={(e) => setSearch(e.target.value)} />
                <Icon icon='ion:search-outline' className='icon' />
              </form>
            </div>
          </div>
          <div className='card-body p-0'>
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
                <li className='px-24 py-16 text-muted'>No messages</li>
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
                  {vendor?.vendorId && <option value='vendor_admin'>Ask Admin about my listing</option>}
                  <option value='vendor_subscriber'>Message Vendor about a subscribed listing</option>
                  {vendor?.vendorId && <option value='vendor_to_subscriber'>Message a subscriber of my listing</option>}
                </select>
              </div>
              {compose.mode === 'vendor_admin' && vendor?.vendorId && (
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
              {compose.mode === 'vendor_subscriber' && (
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
              {compose.mode === 'vendor_to_subscriber' && (
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
