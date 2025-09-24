import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { api } from "../lib/api";
import { publishWithVerifyAndFallback, getLive } from "../lib/lmsClient";
import { auth } from "../lib/firebase";

const MessagesContext = createContext(null);

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

  async function refresh() {
    setError(null);
    setLoading(true);
    try {
      // cache-bust param to avoid any intermediate caching proxies
      const { data } = await api.get(`/api/messages`, { params: { t: Date.now() } });
      const items = Array.isArray(data?.items) ? data.items : [];
      setThreads(items);
      try { localStorage.setItem("sl_messages_cache_v1", JSON.stringify(items)); } catch {}
    } catch (e) {
      setError(e?.message || "Failed to load messages");
    } finally {
      setLoading(false);
    }
  }

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
  }, []);

  const unreadCount = useMemo(() => threads.filter((t) => !t.read).length, [threads]);
  const latestFive = useMemo(() => threads.slice(0, 5), [threads]);

  async function syncMessagesToLive(latestThreads) {
    try {
      const tenantId = (typeof window !== 'undefined' ? sessionStorage.getItem('tenantId') : null) || 'vendor';
      const idToken = await auth.currentUser?.getIdToken?.();
      // 1) read live
      const live = await getLive({ tenantId, idToken });
      // 2) merge messageThreads
      const next = { ...live, messageThreads: Array.isArray(latestThreads) ? latestThreads : threads };
      // 3) publish with verification + fallback
      await publishWithVerifyAndFallback(next, { tenantId, idToken });
      return true;
    } catch {
      // non-fatal; UI remains consistent locally
      return false;
    }
  }

  async function markRead(threadId, read = true) {
    try {
      await api.post(`/api/messages/read`, { threadId, read });
      setThreads((arr) => arr.map((t) => (t.id === threadId ? { ...t, read } : t)));
    } catch (e) {
      // ignore; UI will retry on next refresh
    }
  }

  async function reply(threadId, content) {
    await api.post(`/api/messages/reply`, { threadId, content });
    await refresh();
    // best-effort: sync to backend appData.json
    await syncMessagesToLive();
  }

  const value = useMemo(
    () => ({ threads, unreadCount, latestFive, loading, error, refresh, markRead, reply, syncMessagesToLive }),
    [threads, unreadCount, latestFive, loading, error]
  );

  return <MessagesContext.Provider value={value}>{children}</MessagesContext.Provider>;
}

export function useMessages() {
  const ctx = useContext(MessagesContext);
  if (!ctx) throw new Error("useMessages must be used inside <MessagesProvider />");
  return ctx;
}
