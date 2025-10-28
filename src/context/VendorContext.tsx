// src/context/VendorContext.jsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import { api } from "../lib/api";
import { initializeFirebase } from "../utils/lazyFirebase.js";
import { VendorContext } from "./vendorContextBase";

const API_BASE = "/api/lms";
const LS_PREFIX = "vendor_profile_v3"; // bump key to invalidate any old cache

function lsKey(tenant, uid) {
  return `${LS_PREFIX}:${tenant}:${uid}`;
}
function safeParse(s) {
  try { return typeof s === "string" ? JSON.parse(s) : s; } catch { return null; }
}

function normalizeVendor(v, fb = {}) {
  const status = (v?.status || v?.approvalStatus || "").toLowerCase();
  const kyc = (v?.kycStatus || "").toLowerCase();
  const isApproved = status === "active" || kyc === "approved";
  return {
    vendorId: v?.vendorId ?? v?.id ?? "",
    id: v?.id ?? v?.vendorId ?? "",
    name: v?.name ?? v?.vendor ?? fb.name ?? "",
    email: (v?.email ?? v?.contactEmail ?? fb.email ?? "").toLowerCase(),
    ownerUid: v?.ownerUid ?? v?.uid ?? fb.uid ?? "",
    phone: v?.phone ?? "",
    website: v?.website ?? v?.url ?? "",
    logo: v?.logo ?? v?.imageUrl ?? "",
    address: v?.address ?? "",
    createdAt: v?.createdAt ?? null,
    status,
    kycStatus: kyc,
    isApproved,
  };
}

function findVendorInLive(live, user) {
  if (!live) return null;
  const email = (user?.email || "").toLowerCase();
  const pools = [
    Array.isArray(live.vendors) && live.vendors,
    Array.isArray(live.startups) && live.startups,
    Array.isArray(live.companies) && live.companies,
    Array.isArray(live.profiles) && live.profiles,
  ].filter(Boolean);

  for (const arr of pools) {
    const hit = arr.find(
      (v) =>
        (v?.ownerUid && v.ownerUid === user?.uid) ||
        (v?.email && v.email.toLowerCase() === email) ||
        (Array.isArray(v?.members) && v.members.some((m) => (m?.email || "").toLowerCase() === email))
    );
    if (hit) return normalizeVendor(hit, { uid: user?.uid, email, name: user?.displayName });
  }
  return null;
}


export function VendorProvider({ children }) {
  const tenantId = useMemo(() => sessionStorage.getItem("tenantId") || "vendor", []);
  const [authUser, setAuthUser] = useState(null);
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // prevent races when user flips quickly
  const loadSeq = useRef(0);

  const clearAllVendorCaches = () => {
    Object.keys(localStorage).forEach((k) => {
      if (k.startsWith(`${LS_PREFIX}:`)) localStorage.removeItem(k);
    });
  };

  const fetchLive = useCallback(async () => {
    try {
      // Timeout helper
      const timeout = (ms: number) => new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), ms)
      );
      
      const fetchWithTimeout = (promise: Promise<any>, ms: number) =>
        Promise.race([promise, timeout(ms)]);
      
      // Fetch vendors and startups from working endpoints with 8-second timeout
      // Load first 12 items only for fast initial page load (pagination strategy)
      const [vendorsRes, startupsRes] = await Promise.all([
        fetchWithTimeout(
          api.get("/api/data/vendors", { 
            params: { page: 1, pageSize: 12 },
            headers: { "x-tenant-id": tenantId, "cache-control": "no-cache" },
            suppressToast: true,
            suppressErrorLog: true,
            timeout: 8000, // 8 second axios timeout
          } as any),
          9000 // 9 second Promise timeout
        ).catch((e) => {
          console.warn('[VendorContext] Vendors API failed:', e?.message || e);
          return { data: { items: [] } };
        }),
        fetchWithTimeout(
          api.get("/api/data/startups", {
            params: { page: 1, pageSize: 12 },
            headers: { "x-tenant-id": tenantId, "cache-control": "no-cache" },
            suppressToast: true,
            suppressErrorLog: true,
            timeout: 8000,
          } as any),
          9000
        ).catch((e) => {
          console.warn('[VendorContext] Startups API failed:', e?.message || e);
          return { data: { items: [] } };
        }),
      ]);
      
      return {
        vendors: Array.isArray(vendorsRes.data?.items) ? vendorsRes.data.items : [],
        startups: Array.isArray(startupsRes.data?.items) ? startupsRes.data.items : [],
        companies: [], // Empty array for compatibility
        profiles: [], // Empty array for compatibility
      };
    } catch (e) {
      console.warn('[VendorContext] Failed to fetch live data:', e);
      return { vendors: [], startups: [], companies: [], profiles: [] };
    }
  }, [tenantId]);

  const fetchVendorsApi = useCallback(async () => {
    try {
      const arr = await api.get(`/api/data/vendors`, { timeout: 8000 }).then((r) => r.data || []);
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  }, []);

  const hydrateForUser = useCallback(async (user) => {
    setError(null);
    setLoading(true);

    if (!user) {
      setAuthUser(null);
      setVendor(null);
      clearAllVendorCaches();
      setLoading(false);
      return;
    }

    setAuthUser(user);
    const key = lsKey(tenantId, user.uid);

    // 1) show cached immediately (if any) to avoid flashes
    const cached = safeParse(localStorage.getItem(key));
    if (cached) setVendor(cached);

    const seq = ++loadSeq.current;

    try {
      // 2) pull fresh profile from live and augment with API vendors
      const live = await fetchLive();
      const apiVendors = await fetchVendorsApi();
      if (Array.isArray(apiVendors) && apiVendors.length) {
        live.startups = Array.isArray(live.startups) ? live.startups : [];
        apiVendors.forEach((v) => {
          const email = (v.email || v.contactEmail || "").toLowerCase();
          const id = String(v.vendorId || v.id || email || "");
          const idx = live.startups.findIndex((x) => String(x.vendorId || x.id) === id);
          const merged = { ...(live.startups[idx] || {}), ...v, vendorId: id, id };
          if (idx >= 0) live.startups[idx] = merged; else live.startups.push(merged);
        });
      }
      if (seq !== loadSeq.current) return; // abandoned
      const found = findVendorInLive(live, user);

      // 3) if nothing in DB yet, provide a minimal stub (no vendorId)
      const finalVendor =
        found ||
        normalizeVendor({}, { uid: user.uid, email: user.email || "", name: user.displayName || "" });

      localStorage.setItem(key, JSON.stringify(finalVendor));
      setVendor(finalVendor);
    } catch (e) {
      if (seq !== loadSeq.current) return;
      setError(e?.message || "Failed to load vendor profile");
      // keep whatever we have (cached or null)
    } finally {
      if (seq === loadSeq.current) setLoading(false);
    }
  }, [fetchLive, fetchVendorsApi, tenantId]);

  useEffect(() => {
    let unsub: (() => void) | null = null;
    let mounted = true;

    const setupAuthListener = async () => {
      try {
        const { auth } = await initializeFirebase();
        const { onIdTokenChanged } = await import('firebase/auth');
        
        if (!mounted) return;
        
        unsub = onIdTokenChanged(auth, (user) => {
          hydrateForUser(user);
        });
      } catch (error) {
        console.error('[VendorContext] Failed to setup auth listener:', error);
      }
    };

    setupAuthListener();

    return () => {
      mounted = false;
      if (unsub) unsub();
    };
  }, [hydrateForUser]);

  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => {
      try {
        toast.error(error, { toastId: "vendor-profile" });
      } catch {}
    }, 1000);
    return () => clearTimeout(timer);
  }, [error]);

  const value = useMemo(
    () => ({
      authUser,
      vendor,
      loading,
      error,
      refresh: async () => {
        if (authUser) await hydrateForUser(authUser);
      },
      ensureVendorId: async () => {
        if (!authUser) return null;
        if (vendor?.vendorId) return vendor;

        // Re-hydrate once
        await hydrateForUser(authUser);
        if (vendor?.vendorId) return vendor;

        // Attempt to create a minimal vendor profile for this user, then hydrate again
        try {
          const email = (authUser.email || "").toLowerCase();
          const name = authUser.displayName || (email ? email.split("@")[0] : "Vendor");
          if (!email) return null; // cannot create without email
          await api.post(`/api/data/vendors`, {
            id: authUser.uid,
            name,
            contactEmail: email,
            ownerUid: authUser.uid,
            status: "pending",
            kycStatus: "pending",
            categories: [],
          });
          await hydrateForUser(authUser);
        } catch {
          // swallow; caller may show UI to complete profile
        }
        return vendor?.vendorId ? vendor : null;
      },
      signOutAndClear: async () => {
        try {
          const { auth } = await initializeFirebase();
          const { signOut } = await import('firebase/auth');
          await signOut(auth);
        } catch (error) {
          console.error('[VendorContext] Failed to sign out:', error);
        } finally {
          clearAllVendorCaches();
          setVendor(null);
          setAuthUser(null);
        }
      },
    }),
    [authUser, vendor, loading, error, hydrateForUser]
  );

  return <VendorContext.Provider value={value}>{children}</VendorContext.Provider>;
}
