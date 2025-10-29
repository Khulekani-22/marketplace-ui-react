// @ts-nocheck
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import { api } from "../lib/api";
import { getLive } from "../lib/lmsClient";
import { MessagesContext } from "./messagesContext";
import { auth } from "../firebase.js";
import { onIdTokenChanged } from "firebase/auth";
import { hasFullAccess } from "../utils/roles";

const STORAGE_KEY = "sl_messages_cache_v1";

const readCachedThreads = () => {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY) || "null";
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const persistCachedThreads = (items: any[]) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {}
};

const AUTO_POLL_INTERVAL_MS = 2 * 60 * 1000; // Poll every 2 minutes
const MIN_REFRESH_INTERVAL_MS = 30 * 1000; // Require 30s gap between non-forced refreshes
const TENANT_WATCH_INTERVAL_MS = 1000;
const VENDOR_PROFILE_KEY = "vendor_profile_v3";
const ACTIVATION_STORAGE_KEY = "sl_messages_activated";

const normalize = (value?: string | null) =>
  typeof value === "string" ? value.trim().toLowerCase() : "";

const mapTenantOut = (id: string) => (id === "vendor" ? "public" : id);

const resolveTenantId = () => (typeof window !== "undefined" ? sessionStorage.getItem("tenantId") : null) || "vendor";

type Identity = {
  email: string;
  uid: string;
  role: string;
  vendorId: string;
  vendorEmail: string;
};

const canAccessThread = (thread: any, identity: Identity) => {
  if (!thread) return false;
  const { email, role, vendorId, vendorEmail } = identity;
  const ctx = thread?.context || {};
  const pid: string[] = Array.isArray(thread?.participantIds) ? thread.participantIds : [];
  const vendorCtxId = normalize(ctx.vendorId);
  const vendorCtxEmail = normalize(ctx.vendorEmail);

  const vendorMatch = (candidate?: string | null) => {
    const id = normalize(candidate);
    if (!id) return false;
    return (
      pid.some((p) => normalize(p) === `vendor:${id}`) ||
      vendorCtxId === id
    );
  };

  const isVendorParticipant =
    vendorMatch(vendorId) ||
    vendorMatch(email) ||
    vendorCtxEmail === email ||
    (vendorEmail && (vendorCtxEmail === vendorEmail || vendorMatch(vendorEmail)));

  const subscriberEmail = normalize(ctx.subscriberEmail);
  const isSubscriber =
    !!email &&
    (subscriberEmail === email || pid.some((p) => normalize(p) === `user:${email}`));

  if (hasFullAccess(role)) {
    const ctxAdminEmail = normalize(ctx.adminEmail);
    const adminParticipant =
      (!ctxAdminEmail && pid.some((p) => normalize(p) === "admin")) ||
      (!!email && (ctxAdminEmail === email || pid.some((p) => normalize(p) === `admin:${email}`)));
    const subscriberThread = ctx.type === "listing-subscriber";
    const vendorOrSubscriber = isVendorParticipant || isSubscriber;
    return adminParticipant || subscriberThread || vendorOrSubscriber;
  }

  if (ctx.type === "listing-feedback") return isVendorParticipant;
  if (ctx.type === "listing-subscriber") return isVendorParticipant || isSubscriber;
  return isVendorParticipant || isSubscriber;
};

const sortThreads = (items: any[]) => {
  return [...items].sort((a, b) => {
    const latest = (thread: any) => {
      const last = thread?.lastMessage?.date || thread?.messages?.[thread?.messages?.length - 1]?.date;
      return last ? new Date(last).getTime() : 0;
    };
    return latest(b) - latest(a);
  });
};

const filterThreadsForIdentity = (doc: any, tenantId: string, identity: Identity) => {
  const tenantKey = mapTenantOut(tenantId);
  const raw = Array.isArray(doc?.messageThreads) ? doc.messageThreads : [];
  const scoped = raw.filter((t) => (t?.tenantId || "public") === tenantKey);
  const accessible = scoped.filter((t) => canAccessThread(t, identity));
  return sortThreads(accessible).map((t) => ({ ...t }));
};

const fallbackThreadsForTenant = () => {
  // Return empty array instead of using local JSON
  return [];
};

const resolveIdentity = (tenantId: string): Identity => {
  const email = normalize(auth.currentUser?.email || (typeof window !== "undefined" ? sessionStorage.getItem("userEmail") : ""));
  const uid = auth.currentUser?.uid || (typeof window !== "undefined" ? sessionStorage.getItem("userId") : "");
  const rawRole = (typeof window !== "undefined" ? sessionStorage.getItem("role") : null) || "member";
  const role = normalize(rawRole) || "member";
  let vendorProfile: any = null;
  if (typeof window !== "undefined" && uid) {
    try {
      const key = `${VENDOR_PROFILE_KEY}:${tenantId}:${uid}`;
      const raw = localStorage.getItem(key);
      if (raw) vendorProfile = JSON.parse(raw);
    } catch {
      vendorProfile = null;
    }
  }
  const vendorId = normalize(vendorProfile?.vendorId || vendorProfile?.id);
  const vendorEmail = normalize(vendorProfile?.email || vendorProfile?.contactEmail);
  return {
    email,
    uid,
    role,
    vendorId,
    vendorEmail,
  };
};

export function MessagesProvider({ children }) {
  const [threads, setThreads] = useState(() => readCachedThreads());
  const [activated, setActivated] = useState(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem(ACTIVATION_STORAGE_KEY) === "1";
  });
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const pollRef = useRef(null);
  const autosyncRef = useRef(null);
  const syncingRef = useRef(false);
  const threadsRef = useRef(threads);
  const refreshSeq = useRef(0);
  const authUidRef = useRef<string | null>(auth.currentUser?.uid || null);
  const tenantWatchRef = useRef(resolveTenantId());
  const visibilityRef = useRef(typeof document === "undefined" ? true : !document.hidden);
  const lastRefreshTimeRef = useRef(0);
  const activatedRef = useRef(activated);
  const skipInitialActivationEffectRef = useRef(false);

  useEffect(() => {
    threadsRef.current = threads;
  }, [threads]);

  useEffect(() => {
    activatedRef.current = activated;
  }, [activated]);

  const syncMessagesToLive = useCallback(async () => {
    const tenantId = resolveTenantId();
    const identity = resolveIdentity(tenantId);

    const applyThreads = (items: any[]) => {
      setThreads(items);
      threadsRef.current = items;
      persistCachedThreads(items);
    };

    try {
      const liveEnvelope = await getLive({ tenantId: mapTenantOut(tenantId) });
      const liveDoc =
        liveEnvelope && typeof liveEnvelope === "object"
          ? (liveEnvelope.data && typeof liveEnvelope.data === "object" ? liveEnvelope.data : liveEnvelope)
          : {};
      const items = filterThreadsForIdentity(liveDoc, tenantId, identity);
      applyThreads(items);
      setError(null);
      return true;
    } catch {
      // fall through to local fallback
    }

    // Return from cache only, no bundled JSON fallback
    return threadsRef.current.length > 0;
  }, []);

  const refreshImpl = useCallback(
    async ({
      silent,
      force,
      allowColdStart,
    }: { silent?: boolean; force?: boolean; allowColdStart?: boolean } = {}) => {
      if (!allowColdStart && !activatedRef.current) {
        return false;
      }

      const effectiveForce = !!force;
      const now = Date.now();

      if (!effectiveForce) {
        if (!visibilityRef.current) {
          return false;
        }
        if (now - lastRefreshTimeRef.current < MIN_REFRESH_INTERVAL_MS) {
          return false;
        }
      }

      lastRefreshTimeRef.current = now;
      const seq = ++refreshSeq.current;
      setError(null);
      if (silent) setRefreshing(true);
      else setLoading(true);

      const tenantId = resolveTenantId();

      try {
        const params = { t: Date.now(), ...(effectiveForce ? { force: "1" } : {}) };
        const config = effectiveForce
          ? { params, headers: { "x-message-refresh": "manual" }, timeout: 8000 }
          : { params, timeout: 8000 };
        const { data } = await api.get(`/api/messages`, config);
        const items = Array.isArray(data?.items) ? data.items : [];
        if (refreshSeq.current !== seq) return false;
        setThreads(items);
        persistCachedThreads(items);
        lastRefreshTimeRef.current = Date.now();
        return true;
      } catch (e) {
        if (refreshSeq.current !== seq) return false;
        const code = (e as any)?.code;
        const restoreFallbackThreads = () => {
          if (threadsRef.current?.length) return true;
          const cached = readCachedThreads();
          if (cached.length) {
            setThreads(cached);
            return true;
          }
          const fallback = fallbackThreadsForTenant(tenantId);
          if (fallback.length) {
            setThreads(fallback);
            persistCachedThreads(fallback);
            return true;
          }
          return false;
        };

        if (code === "ERR_NETWORK") {
          const restored = restoreFallbackThreads();
          setError(
            restored
              ? "Showing cached messages while the network is unavailable."
              : "Showing an empty inbox while the network is unavailable."
          );
        } else {
          const restored = restoreFallbackThreads();
          setError(
            restored
              ? "Showing cached messages while the messaging service responds."
              : (e as any)?.message || "Failed to load messages"
          );
        }
        if (!effectiveForce) {
          lastRefreshTimeRef.current = 0;
        }
        return false;
      } finally {
        if (refreshSeq.current === seq) {
          if (silent) setRefreshing(false);
          else setLoading(false);
        }
      }
    },
    []
  );

  const refresh = useCallback(
    (options: { silent?: boolean; force?: boolean } = {}) => {
      if (!activatedRef.current) {
        return Promise.resolve(false);
      }
      return refreshImpl(options);
    },
    [refreshImpl]
  );

  const activate = useCallback(
    async ({ force = true, silent = false }: { force?: boolean; silent?: boolean } = {}) => {
      if (!activatedRef.current) {
        activatedRef.current = true;
        skipInitialActivationEffectRef.current = true;
        setActivated(true);
        try {
          sessionStorage.setItem(ACTIVATION_STORAGE_KEY, "1");
        } catch {}
      }
      return refreshImpl({ force, silent, allowColdStart: true });
    },
    [refreshImpl]
  );

    useEffect(() => {
      if (typeof document === "undefined" || typeof document.addEventListener !== "function") {
        visibilityRef.current = true;
        return;
      }
      visibilityRef.current = !document.hidden;
      const handleVisibility = () => {
        visibilityRef.current = !document.hidden;
        if (!document.hidden && activatedRef.current) {
          refresh({ silent: true, force: true }).catch(() => void 0);
        }
      };
      document.addEventListener("visibilitychange", handleVisibility);
      return () => document.removeEventListener("visibilitychange", handleVisibility);
    }, [refresh]);

  useEffect(() => {
    if (!activated) return;

    if (skipInitialActivationEffectRef.current) {
      skipInitialActivationEffectRef.current = false;
    } else {
      refreshImpl().catch(() => void 0);
    }

    pollRef.current = setInterval(() => {
      if (!visibilityRef.current) return;
      refreshImpl({ silent: true }).catch(() => void 0);
    }, AUTO_POLL_INTERVAL_MS);

    autosyncRef.current = setInterval(async () => {
      if (!visibilityRef.current) return;
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
  }, [activated, refreshImpl, syncMessagesToLive]);

  useEffect(() => {
    if (!activated) return;
    const unsub = onIdTokenChanged(auth, (user) => {
      const uid = user?.uid || null;
      if (authUidRef.current === uid) return;
      authUidRef.current = uid;
      if (!uid) return;
      refresh({ force: true, silent: true }).catch(() => void 0);
    });
    return () => unsub?.();
  }, [activated, refresh]);

  useEffect(() => {
    if (!activated) return;
    const watcher = setInterval(() => {
      if (!visibilityRef.current) return;
      const nextTenant = resolveTenantId();
      if (tenantWatchRef.current === nextTenant) return;
      tenantWatchRef.current = nextTenant;
      refresh({ force: true, silent: true }).catch(() => void 0);
    }, TENANT_WATCH_INTERVAL_MS);
    return () => clearInterval(watcher);
  }, [activated, refresh]);

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
      await refresh({ silent: true, force: true });
      await syncMessagesToLive();
    },
    [refresh, syncMessagesToLive]
  );

  const value = useMemo(
    () => ({
      threads,
      unreadCount,
      latestFive,
      loading,
      refreshing,
      error,
      refresh,
      markRead,
      reply,
      syncMessagesToLive,
      activate,
      activated,
    }),
    [threads, unreadCount, latestFive, loading, refreshing, error, refresh, markRead, reply, syncMessagesToLive, activate, activated]
  );

  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => {
      try {
        toast.error(error, { toastId: "messages" });
      } catch {}
    }, 1000);
    return () => clearTimeout(timer);
  }, [error]);

  return <MessagesContext.Provider value={value}>{children}</MessagesContext.Provider>;
}
