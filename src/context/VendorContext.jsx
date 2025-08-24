// src/context/VendorContext.jsx
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { onIdTokenChanged, signOut } from "firebase/auth";
import { auth } from "../lib/firebase";

const API_BASE = "/api/lms";
const LS_PREFIX = "vendor_profile_v3"; // bump key to invalidate any old cache

function lsKey(tenant, uid) {
  return `${LS_PREFIX}:${tenant}:${uid}`;
}
function safeParse(s) {
  try { return typeof s === "string" ? JSON.parse(s) : s; } catch { return null; }
}

function normalizeVendor(v, fb = {}) {
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

const VendorContext = createContext(null);

export function VendorProvider({ children }) {
  const tenantId = useMemo(() => sessionStorage.getItem("tenantId") || "public", []);
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

  async function fetchLive() {
    const res = await fetch(`${API_BASE}/live`, {
      headers: { "x-tenant-id": tenantId, "cache-control": "no-cache" },
    });
    return res.ok ? res.json() : {};
  }

  async function hydrateForUser(user) {
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
      // 2) pull fresh profile from live
      const live = await fetchLive();
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
  }

  useEffect(() => {
    // fires on sign-in, sign-out, and token refresh
    const unsub = onIdTokenChanged(auth, (user) => {
      hydrateForUser(user);
    });
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId]);

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
        // if we already have a vendorId, return
        if (vendor?.vendorId) return vendor;

        // re-fetch; if still missing, the UI can gate actions until profile is created
        await hydrateForUser(authUser);
        return vendor?.vendorId ? vendor : null;
      },
      signOutAndClear: async () => {
        try {
          await signOut(auth);
        } finally {
          clearAllVendorCaches();
          setVendor(null);
          setAuthUser(null);
        }
      },
    }),
    [authUser, vendor, loading, error]
  );

  return <VendorContext.Provider value={value}>{children}</VendorContext.Provider>;
}

export function useVendor() {
  const ctx = useContext(VendorContext);
  if (!ctx) throw new Error("useVendor must be used inside <VendorProvider />");
  return ctx;
}
