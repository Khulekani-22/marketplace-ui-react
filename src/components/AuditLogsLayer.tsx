import { useCallback, useEffect, useMemo, useState } from "react";
import { Modal } from "react-bootstrap";
import { fetchAuditLogs } from "../lib/audit";
import { api } from "../lib/api";

export default function AuditLogsLayer() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [action, setAction] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [tenantId, setTenantId] = useState(() => sessionStorage.getItem("tenantId") || "vendor");
  const [tenants, setTenants] = useState([{ id: "vendor", name: "Vendor" }]);
  const [detailModal, setDetailModal] = useState<{ open: boolean; log: any | null }>({ open: false, log: null });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await api.get("/api/tenants");
        const items = Array.isArray(data) ? data : [];
        const normalized = [
          { id: "vendor", name: "Vendor" },
          ...items
            .map((t) => (typeof t === "string" ? { id: t, name: t } : { id: t?.id, name: t?.name || t?.id }))
            .map((t) => (t.id === "public" ? { ...t, id: "vendor", name: t.name || "Vendor" } : t))
        ].filter((t) => t && t.id);
        const unique = Object.values(normalized.reduce((acc, t) => { acc[t.id] = t; return acc; }, {}));
        if (mounted) setTenants(unique);
      } catch {
        if (mounted) setTenants([{ id: "vendor", name: "Vendor" }]);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const loadLogs = useCallback(
    async ({ silent }: { silent?: boolean } = {}) => {
      if (silent) setRefreshing(true);
      else setLoading(true);
      setError("");
      try {
        const items = await fetchAuditLogs({
          search: search.trim(),
          userEmail: userEmail.trim() || undefined,
          action: action.trim() || undefined,
          dateFrom: dateFrom ? new Date(dateFrom) : undefined,
          dateTo: dateTo ? new Date(dateTo) : undefined,
          limit: 250,
          tenantId,
        });
        setLogs(items);
      } catch (e: any) {
        setError(e?.message || "Failed to load audit logs");
      } finally {
        if (silent) setRefreshing(false);
        else setLoading(false);
      }
    },
    [action, dateFrom, dateTo, search, tenantId, userEmail]
  );

  useEffect(() => {
    loadLogs({ silent: false }).catch(() => void 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    // Client-side filter for extra responsiveness; server already filters
    const s = search.trim().toLowerCase();
    return logs.filter((r) => {
      if (!s) return true;
      return [r.userEmail, r.action, r.targetType, r.targetId, r.ip]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(s));
    });
  }, [logs, search]);

  const normalizeMetadata = useCallback((meta: any) => {
    if (!meta) return {};
    if (typeof meta === "object") return meta;
    if (typeof meta === "string") {
      try {
        return JSON.parse(meta);
      } catch {
        return { message: meta };
      }
    }
    return {};
  }, []);

  const isErrorLog = useCallback((log: any) => {
    if (!log) return false;
    const action = String(log.action || "").toUpperCase();
    if (action === "API_ERROR" || action === "ERROR") return true;
    const level = String(log.level || "").toLowerCase();
    if (level === "error") return true;
    const metadata = normalizeMetadata(log.metadata);
    const statusCandidate = metadata.status ?? metadata.statusCode ?? metadata.httpStatus ?? metadata.responseStatus;
    const numericStatus = Number(statusCandidate);
    if (Number.isFinite(numericStatus) && numericStatus >= 400) return true;
    const msg = String(metadata.message || metadata.error || "").toLowerCase();
    if (msg.includes("error") || msg.includes("failed") || msg.includes("exception")) return true;
    return false;
  }, [normalizeMetadata]);

  const detailMetadata = detailModal.log ? normalizeMetadata(detailModal.log.metadata) : {};
  const detailJson = detailModal.log ? JSON.stringify(detailMetadata, null, 2) : "";

  function exportCsv() {
    const header = [
      "timestamp",
      "userEmail",
      "userId",
      "action",
      "targetType",
      "targetId",
      "ip",
      "tenantId",
    ];
    const lines = [header.join(",")];
    filtered.forEach((r) => {
      const row = [
        r.timestamp ? new Date(r.timestamp).toISOString() : "",
        r.userEmail || "",
        r.userId || "",
        r.action || "",
        r.targetType || "",
        r.targetId || "",
        r.ip || "",
        r.tenantId || "",
      ];
      lines.push(row.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(","));
    });
    const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="card">
      <div className="card-body">
        <div className="d-flex flex-wrap gap-2 align-items-end mb-3">
          <div className="me-auto">
            <h5 className="mb-0">Audit Logs</h5>
            <small className="text-secondary">Centralized user activity across tenants</small>
          </div>

          <div className="d-flex flex-wrap gap-2">
            <select
              className="form-select"
              value={tenantId}
              onChange={(e) => setTenantId(e.target.value)}
              title="Tenant scope"
            >
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>{t.name || t.id}</option>
              ))}
            </select>
            <input
              className="form-control"
              placeholder="Search email, action, target"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <input
              className="form-control"
              placeholder="Filter by user email"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
            />
            <input
              className="form-control"
              placeholder="Filter by action (e.g., LOGIN, CREATE)"
              value={action}
              onChange={(e) => setAction(e.target.value)}
            />
            <input
              type="date"
              className="form-control"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              aria-label="From date"
            />
            <input
              type="date"
              className="form-control"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              aria-label="To date"
            />
            <button
              className="btn btn-secondary"
              onClick={() => loadLogs({ silent: false })}
              disabled={loading || refreshing}
            >
              {loading ? "Loading…" : "Apply"}
            </button>
            <button
              className="btn btn-outline-secondary"
              onClick={() => loadLogs({ silent: true })}
              disabled={loading || refreshing}
            >
              {refreshing ? "Refreshing…" : "Refresh"}
            </button>
            <button className="btn btn-outline-primary" onClick={exportCsv} disabled={!filtered.length}>
              Export CSV
            </button>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        {!loading && !filtered.length ? (
          <div className="text-center text-secondary py-5">No audit events found.</div>
        ) : null}

        <div className="table-responsive border rounded">
          <table className="table align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th style={{ minWidth: 160 }}>Timestamp</th>
                <th>User</th>
                <th>Action</th>
                <th>Target</th>
                <th>IP</th>
                <th>Tenant</th>
                <th style={{ minWidth: 160 }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const metadata = normalizeMetadata(r.metadata);
                const message = metadata.message || metadata.error || metadata.statusText || metadata.code || "—";
                const statusValue = metadata.status ?? metadata.statusCode ?? metadata.httpStatus ?? metadata.responseStatus;
                const method = metadata.method ? String(metadata.method).toUpperCase() : null;
                return (
                  <tr key={r.id} className={isErrorLog(r) ? "table-danger" : undefined}>
                  <td>
                    {r.timestamp ? (
                      <>
                        <div className="fw-semibold">
                          {new Date(r.timestamp).toLocaleString()}
                        </div>
                        <div className="text-secondary small">
                          {new Date(r.timestamp).toISOString()}
                        </div>
                      </>
                    ) : (
                      <span className="text-secondary">—</span>
                    )}
                  </td>
                  <td>
                    <div className="fw-semibold">{r.userEmail || r.userId || "—"}</div>
                    {r.userId && <div className="text-secondary small">{r.userId}</div>}
                  </td>
                  <td>
                    <span className="badge text-bg-secondary">{r.action || "—"}</span>
                  </td>
                  <td>
                    {r.targetType || r.targetId ? (
                      <>
                        <div className="fw-semibold">{r.targetType || "—"}</div>
                        {r.targetId && <div className="text-secondary small">{r.targetId}</div>}
                      </>
                    ) : (
                      <span className="text-secondary">—</span>
                    )}
                  </td>
                  <td>{r.ip || "—"}</td>
                  <td>{r.tenantId || "vendor"}</td>
                  <td>
                    <div className="small">
                      {method ? <span className="badge text-bg-primary me-1">{method}</span> : null}
                      {statusValue !== undefined && statusValue !== null ? (
                        <span className={`badge ${Number(statusValue) >= 400 ? 'text-bg-danger' : 'text-bg-secondary'} me-1`}>
                          {statusValue}
                        </span>
                      ) : null}
                      <span className="text-truncate d-inline-block" style={{ maxWidth: 220 }} title={message}>
                        {message}
                      </span>
                    </div>
                    <div className="mt-1">
                      <button
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => setDetailModal({ open: true, log: r })}
                      >
                        View
                      </button>
                    </div>
                  </td>
                  </tr>
                );
              })}
              {loading && (
                <tr>
                  <td colSpan={7} className="text-center text-secondary py-4">
                    Loading logs…
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>

      <Modal
        show={detailModal.open}
        onHide={() => setDetailModal({ open: false, log: null })}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Audit Log Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {detailModal.log ? (
            <>
              <div className="mb-2">
                <strong>Action:</strong> {detailModal.log.action || '—'}
              </div>
              <div className="mb-2 text-break">
                <strong>Endpoint:</strong>{' '}
                {detailMetadata.method ? `${String(detailMetadata.method).toUpperCase()} ` : ''}
                {detailMetadata.url || detailMetadata.path || detailMetadata.endpoint || detailModal.log.targetId || '—'}
              </div>
              <div className="mb-3">
                <strong>Message:</strong>{' '}
                {detailMetadata.message || detailMetadata.error || detailMetadata.statusText || '—'}
              </div>
              <pre className="bg-light p-3 rounded small mb-0" style={{ maxHeight: 400, overflow: 'auto' }}>
{detailJson}
              </pre>
            </>
          ) : (
            <div className="text-secondary">No details available.</div>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
}
