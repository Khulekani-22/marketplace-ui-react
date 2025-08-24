import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../lib/firebase";

const STORAGE_KEY = "vendor_profile_v1";

const VendorCtx = createContext(null);

export function VendorProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  const [vendor, setVendor] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || null; }
    catch { return null; }
  });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
      setUser(u || null);
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  function saveVendor(next) {
    setVendor(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
  }

  function clearVendor() {
    setVendor(null);
    localStorage.removeItem(STORAGE_KEY);
  }

  // Ensure we at least have a vendorId in memory (does NOT auto-create a profile)
  function ensureVendorId() {
    return !!(vendor?.vendorId);
  }

  const value = useMemo(() => ({
    user,
    authReady,
    vendor,
    saveVendor,
    clearVendor,
    ensureVendorId,
  }), [user, authReady, vendor]);

  return <VendorCtx.Provider value={value}>{children}</VendorCtx.Provider>;
}

export function useVendor() {
  const ctx = useContext(VendorCtx);
  if (!ctx) throw new Error("useVendor must be used inside <VendorProvider>");
  return ctx;
}
