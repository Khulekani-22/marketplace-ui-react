import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { api } from "../lib/api";

const MessagesContext = createContext(null);

export function MessagesProvider({ children }) {
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const pollRef = useRef(null);

  async function refresh() {
    setError(null);
    setLoading(true);
    try {
      // cache-bust param to avoid any intermediate caching proxies
      const { data } = await api.get(`/api/messages`, { params: { t: Date.now() } });
      const items = Array.isArray(data?.items) ? data.items : [];
      setThreads(items);
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
    return () => clearInterval(pollRef.current);
  }, []);

  const unreadCount = useMemo(() => threads.filter((t) => !t.read).length, [threads]);
  const latestFive = useMemo(() => threads.slice(0, 5), [threads]);

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
  }

  const value = useMemo(
    () => ({ threads, unreadCount, latestFive, loading, error, refresh, markRead, reply }),
    [threads, unreadCount, latestFive, loading, error]
  );

  return <MessagesContext.Provider value={value}>{children}</MessagesContext.Provider>;
}

export function useMessages() {
  const ctx = useContext(MessagesContext);
  if (!ctx) throw new Error("useMessages must be used inside <MessagesProvider />");
  return ctx;
}
