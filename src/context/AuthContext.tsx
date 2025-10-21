import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { User } from "firebase/auth";
import { onAuthStateChanged, onIdTokenChanged } from "firebase/auth";
import { auth } from "../firebase.js";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  idToken: string | null;
  claims: Record<string, unknown> | null;
  refreshIdToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

const TOKEN_REFRESH_INTERVAL = 5 * 60 * 1000; // every 5 minutes

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [loading, setLoading] = useState(() => auth.currentUser == null);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [claims, setClaims] = useState<Record<string, unknown> | null>(null);
  const refreshPromiseRef = useRef<Promise<void> | null>(null);
  const tokenTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      if (nextUser) {
        try {
          const tokenResult = await nextUser.getIdTokenResult();
          setIdToken(tokenResult.token);
          setClaims(tokenResult.claims || null);
          try {
            if (nextUser.email) sessionStorage.setItem("userEmail", nextUser.email);
            else sessionStorage.removeItem("userEmail");
            sessionStorage.setItem("userId", nextUser.uid);
          } catch {
            /* storage unavailable */
          }
        } catch {
          setIdToken(null);
          setClaims(null);
        }
      } else {
        setIdToken(null);
        setClaims(null);
        try {
          sessionStorage.removeItem("userEmail");
          sessionStorage.removeItem("userId");
        } catch {
          /* storage unavailable */
        }
      }
      setLoading(false);
    });

    return () => {
      unsubAuth();
      if (tokenTimerRef.current) {
        window.clearTimeout(tokenTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!user) return;

    const scheduleRefresh = async () => {
      try {
        const tokenResult = await user.getIdTokenResult(true);
        setIdToken(tokenResult.token);
        setClaims(tokenResult.claims || null);
      } catch {
        // ignore refresh failures; auth SDK will retry later
      }
      if (tokenTimerRef.current) window.clearTimeout(tokenTimerRef.current);
      tokenTimerRef.current = window.setTimeout(scheduleRefresh, TOKEN_REFRESH_INTERVAL);
    };

    const unsub = onIdTokenChanged(auth, async (nextUser) => {
      if (nextUser) {
        try {
          const tokenResult = await nextUser.getIdTokenResult();
          setIdToken(tokenResult.token);
          setClaims(tokenResult.claims || null);
        } catch {
          setIdToken(null);
          setClaims(null);
        }
        if (tokenTimerRef.current) window.clearTimeout(tokenTimerRef.current);
        tokenTimerRef.current = window.setTimeout(scheduleRefresh, TOKEN_REFRESH_INTERVAL);
      } else {
        setIdToken(null);
        setClaims(null);
      }
    });

    tokenTimerRef.current = window.setTimeout(scheduleRefresh, TOKEN_REFRESH_INTERVAL);

    return () => {
      unsub();
      if (tokenTimerRef.current) {
        window.clearTimeout(tokenTimerRef.current);
        tokenTimerRef.current = null;
      }
    };
  }, [user]);

  const refreshIdToken = useMemo(() => {
    return async () => {
      if (!user) {
        setIdToken(null);
        setClaims(null);
        return;
      }

      if (!refreshPromiseRef.current) {
        refreshPromiseRef.current = user
          .getIdTokenResult(true)
          .then((tokenResult) => {
            setIdToken(tokenResult.token);
            setClaims(tokenResult.claims || null);
          })
          .finally(() => {
            refreshPromiseRef.current = null;
          });
      }

      await refreshPromiseRef.current;
    };
  }, [user]);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    idToken,
    claims,
    refreshIdToken,
  }), [user, loading, idToken, claims, refreshIdToken]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider />");
  return ctx;
}
