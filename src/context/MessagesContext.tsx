import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import { api } from "../lib/api";
import { publishWithVerifyAndFallback, getLive } from "../lib/lmsClient";
import { MessagesContext } from "./messagesContext";

export function MessagesProvider({ children }) {
  const [threads, setThreads] = useState(() => {
    try {
      const cached = JSON.parse(localStorage.getItem("sl_messages_cache_v1") || "null");
      return Array.isArray(cached) ? cached : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const pollRef = useRef(null);
  const autosyncRef = useRef(null);
  const syncingRef = useRef(false);

  const syncMessagesToLive = useCallback(
    async (latestThreads?: any[]) => {
      try {
        const tenantId = (typeof window !== 'undefined' ? sessionStorage.getItem('tenantId') : null) || 'vendor';
        const live = await getLive({ tenantId });
        const next = { ...live, messageThreads: Array.isArray(latestThreads) ? latestThreads : threads };
        await publishWithVerifyAndFallback(next, { tenantId });
        return true;
      } catch {
        return false;
      }
    },
    [threads]
  );

  const refresh = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const { data } = await api.get(`/api/messages`, { params: { t: Date.now() } });
      const items = Array.isArray(data?.items) ? data.items : [];
      setThreads(items);
      try { localStorage.setItem("sl_messages_cache_v1", JSON.stringify(items)); } catch {}
    } catch (e) {
      setError(e?.message || "Failed to load messages");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    refresh().finally(() => setLoading(false));
    // soft poll every 30s
    pollRef.current = setInterval(refresh, 30000);
    // auto-sync messages to LIVE every 5 minutes
    autosyncRef.current = setInterval(async () => {
      if (syncingRef.current) return;
      try {
        syncingRef.current = true;
        const ok = await syncMessagesToLive();
        if (ok) {
          try { localStorage.setItem('sl_messages_last_sync', new Date().toISOString()); } catch {}
        }
      } finally {
        syncingRef.current = false;
      }
    }, 300000);
    return () => {
      clearInterval(pollRef.current);
      clearInterval(autosyncRef.current);
    };
  }, [refresh, syncMessagesToLive]);

  const unreadCount = useMemo(() => threads.filter((t) => !t.read).length, [threads]);
  const latestFive = useMemo(() => threads.slice(0, 5), [threads]);

  const markRead = useCallback(async (threadId: string, read = true) => {
    try {
      await api.post(`/api/messages/read`, { threadId, read });
      setThreads((arr) => arr.map((t) => (t.id === threadId ? { ...t, read } : t)));
    } catch {
      // ignore; UI will retry on next refresh
    }
  }, []);

  const reply = useCallback(
    async (threadId: string, content: string) => {
      await api.post(`/api/messages/reply`, { threadId, content });
      await refresh();
      await syncMessagesToLive();
    },
    [refresh, syncMessagesToLive]
  );

  const value = useMemo(
    () => ({ threads, unreadCount, latestFive, loading, error, refresh, markRead, reply, syncMessagesToLive }),
    [threads, unreadCount, latestFive, loading, error, refresh, markRead, reply, syncMessagesToLive]
  );

  useEffect(() => {
    if (!error) return;
    try {
      toast.error(error, { toastId: "messages" });
    } catch {}
  }, [error]);

  return <MessagesContext.Provider value={value}>{children}</MessagesContext.Provider>;
}
