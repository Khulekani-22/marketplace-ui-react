import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import AuditLogsLayer from "../components/AuditLogsLayer";
import AuditLogDashboard, { AuditLogStats } from "../components/AuditLogDashboard";

import { useQuery } from "@tanstack/react-query";
import { Timestamp } from "firebase/firestore";
import { useMemo } from "react";
import { fetchAuditLogs } from "../lib/audit";

function normalizeMetadata(raw: any): Record<string, any> {
  if (!raw) return {};
  if (typeof raw === "object") return raw;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      return { message: raw };
    }
  }
  return {};
}

function extractTimestamp(log: any): { dateKey: string | null; millis: number | null } {
  const value = log?.timestamp ?? log?.createdAt ?? log?.metadata?.timestamp;
  if (!value) return { dateKey: null, millis: null };
  try {
    if (value instanceof Date) {
      return { dateKey: value.toISOString().slice(0, 10), millis: value.getTime() };
    }
    if (value instanceof Timestamp) {
      const date = value.toDate();
      return { dateKey: date.toISOString().slice(0, 10), millis: date.getTime() };
    }
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return { dateKey: parsed.toISOString().slice(0, 10), millis: parsed.getTime() };
    }
  } catch {
    /* ignore */
  }
  return { dateKey: null, millis: null };
}

function isErrorLog(log: any): boolean {
  if (!log) return false;
  const level = String(log.level || "").toLowerCase();
  if (level === "error" || level === "err") return true;
  const statusText = String(log.status || "").toLowerCase();
  if (statusText === "error" || statusText === "fail" || statusText === "failed") return true;
  if (String(log.action || "").toUpperCase() === "API_ERROR") return true;
  const metadata = normalizeMetadata(log.metadata);
  const possibleStatus = metadata.status ?? metadata.statusCode ?? metadata.httpStatus ?? metadata.responseStatus;
  const numericStatus = Number(possibleStatus);
  if (Number.isFinite(numericStatus) && numericStatus >= 400) return true;
  return false;
}

const AuditLogsPage = () => {
  // Fetch audit logs from Firestore
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["auditLogs"],
    queryFn: async () => await fetchAuditLogs({ limit: 1000 }),
    staleTime: 1000 * 60,
  });

  // Transform logs for dashboard
  const stats: AuditLogStats = useMemo(() => {
    if (!logs || !Array.isArray(logs)) {
      return {
        timeline: [],
        topUsers: [],
        topErrorEndpoints: [],
        totalActions: 0,
        totalErrors: 0,
        last24hActions: 0,
        apiErrorsLast24h: 0,
      };
    }

    const now = Date.now();
    const TWENTY_FOUR_HOURS = 1000 * 60 * 60 * 24;

    const timelineMap = new Map<string, { actions: number; errors: number }>();
    const userCounts = new Map<string, number>();
    const endpointCounts = new Map<string, number>();

    let totalActions = 0;
    let totalErrors = 0;
    let last24hActions = 0;
    let apiErrorsLast24h = 0;

    (logs as any[]).forEach((log: any) => {
      const metadata = normalizeMetadata(log.metadata);
      const { dateKey, millis } = extractTimestamp(log);
      if (!dateKey) return;

      const within24h = typeof millis === 'number' ? now - millis <= TWENTY_FOUR_HOURS : false;

      const timelineEntry = timelineMap.get(dateKey) || { actions: 0, errors: 0 };
      timelineEntry.actions += 1;
      totalActions += 1;
      if (within24h) last24hActions += 1;

      const errorLog = isErrorLog(log);
      if (errorLog) {
        timelineEntry.errors += 1;
        totalErrors += 1;
        if (within24h && String(log.action || '').toUpperCase() === 'API_ERROR') {
          apiErrorsLast24h += 1;
        }

        const method = metadata.method ? String(metadata.method).toUpperCase() : '';
        const endpoint = metadata.url || metadata.endpoint || metadata.path || log.targetId || 'unknown';
        const key = method ? `${method} ${endpoint}` : endpoint;
        endpointCounts.set(key, (endpointCounts.get(key) || 0) + 1);
      }

      timelineMap.set(dateKey, timelineEntry);

      const userKey =
        log.userEmail ||
        log.userId ||
        log.user ||
        metadata.userEmail ||
        metadata.uid ||
        metadata.user ||
        'unknown';
      userCounts.set(userKey, (userCounts.get(userKey) || 0) + 1);
    });

    const timeline = Array.from(timelineMap.entries())
      .map(([date, value]) => ({ date, actions: value.actions, errors: value.errors }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const topUsers = Array.from(userCounts.entries())
      .map(([user, count]) => ({ user, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const topErrorEndpoints = Array.from(endpointCounts.entries())
      .map(([endpoint, count]) => ({ endpoint, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 7);

    return {
      timeline,
      topUsers,
      topErrorEndpoints,
      totalActions,
      totalErrors,
      last24hActions,
      apiErrorsLast24h,
    };
  }, [logs]);

  return (
    <MasterLayout>
      <Breadcrumb title="Audit Logs" />
      {isLoading ? (
        <div className="alert alert-secondary mb-3" role="status">
          Loading audit dashboard…
        </div>
      ) : null}
      <AuditLogDashboard stats={stats} />
      <AuditLogsLayer />
    </MasterLayout>
  );
};

export default AuditLogsPage;
