import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import AuditLogsLayer from "../components/AuditLogsLayer";
import AuditLogDashboard, { AuditLogStats } from "../components/AuditLogDashboard";

import { useQuery } from "@tanstack/react-query";
import { getFirestore, collection, getDocs, Timestamp } from "firebase/firestore";
import { useMemo } from "react";

const AuditLogsPage = () => {
  // Fetch audit logs from Firestore
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["auditLogs"],
    queryFn: async () => {
      const db = getFirestore();
      const snapshot = await getDocs(collection(db, "auditLogs"));
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
    staleTime: 1000 * 60,
  });

  // Transform logs for dashboard
  const stats: AuditLogStats = useMemo(() => {
    if (!logs || !Array.isArray(logs)) {
      return {
        actionsOverTime: [],
        errorRates: [],
        topUsers: [],
        totalActions: 0,
        totalErrors: 0,
        last24hActions: 0,
      };
    }
    // Group actions by date
    const actionsByDate: Record<string, number> = {};
    const errorsByDate: Record<string, number> = {};
    const userCounts: Record<string, number> = {};
    let totalActions = 0;
    let totalErrors = 0;
    let last24hActions = 0;
    const now = Date.now();
    (logs as any[]).forEach((log: any) => {
      // Assume log.timestamp is a Firestore Timestamp or ISO string
      let dateStr = "";
      let ts = log.timestamp;
      if (ts instanceof Timestamp) {
        dateStr = ts.toDate().toISOString().slice(0, 10);
        if (now - ts.toMillis() < 1000 * 60 * 60 * 24) last24hActions++;
      } else if (typeof ts === "string") {
        dateStr = ts.slice(0, 10);
        if (now - new Date(ts).getTime() < 1000 * 60 * 60 * 24) last24hActions++;
      }
      actionsByDate[dateStr] = (actionsByDate[dateStr] || 0) + 1;
      if (log.status === "error" || log.level === "error") {
        errorsByDate[dateStr] = (errorsByDate[dateStr] || 0) + 1;
        totalErrors++;
      }
      userCounts[log.user || log.actor || "unknown"] = (userCounts[log.user || log.actor || "unknown"] || 0) + 1;
      totalActions++;
    });
    // Prepare chart data
    const actionsOverTime = Object.entries(actionsByDate).map(([date, count]) => ({ date, count })).sort((a, b) => a.date.localeCompare(b.date));
    const errorRates = Object.entries(errorsByDate).map(([date, errors]) => ({ date, errors })).sort((a, b) => a.date.localeCompare(b.date));
    const topUsers = Object.entries(userCounts)
      .map(([user, count]) => ({ user, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    return {
      actionsOverTime,
      errorRates,
      topUsers,
      totalActions,
      totalErrors,
      last24hActions,
    };
  }, [logs]);

  return (
    <MasterLayout>
      <Breadcrumb title="Audit Logs" />
      <AuditLogDashboard stats={stats} />
      <AuditLogsLayer />
    </MasterLayout>
  );
};

export default AuditLogsPage;

