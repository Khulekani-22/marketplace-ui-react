import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { onIdTokenChanged, type User } from "firebase/auth";
import { isAxiosError } from "axios";
import { auth } from "../lib/firebase";
import { api } from "../lib/api";
import { useAppSync } from "./useAppSync";
import { normalizeRole } from "../utils/roles";

const STARTING_BALANCE = 200_000;
const MAX_TRANSACTIONS = 150;
const ELIGIBLE_ROLES = new Set(["vendor", "member", "startup"]);
const ELIGIBLE_TENANTS = new Set(["vendor", "basic", "startup"]);

export type WalletTransactionType = "credit" | "debit";

export interface WalletTransaction {
  id: string;
  type: WalletTransactionType;
  amount: number;
  description: string;
  reference?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  balanceAfter: number;
}

export interface WalletRecord {
  id: string;
  version: number;
  uid: string | null;
  email: string | null;
  tenantId: string;
  role: string;
  balance: number;
  startingBalance: number;
  transactions: WalletTransaction[];
  lastUpdated: string;
}

export interface RedeemOptions {
  description?: string;
  reference?: string;
  metadata?: Record<string, unknown>;
}

export interface GrantCreditPayload extends RedeemOptions {
  amount: number;
  email?: string;
  uid?: string;
  tenantId?: string;
  role?: string;
}

export interface WalletOperationResult {
  ok: boolean;
  error?: string;
  wallet?: WalletRecord | null;
  transaction?: WalletTransaction | null;
}

export interface WalletContextValue {
  loading: boolean;
  eligible: boolean;
  wallet: WalletRecord | null;
  refresh: () => Promise<void>;
  redeemCredits: (amount: number, options?: RedeemOptions) => Promise<WalletOperationResult>;
  grantCredits: (payload: GrantCreditPayload) => Promise<WalletOperationResult>;
}

export const WalletContext = createContext<WalletContextValue | undefined>(undefined);

function normalizeTenant(value?: string | null): string {
  if (!value) return "vendor";
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return "vendor";
  if (trimmed === "public") return "vendor";
  return trimmed;
}

function normalizeEmail(value?: string | null) {
  return (value || "").toString().trim().toLowerCase();
}

function round2(value: unknown) {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return Math.round(num * 100) / 100;
}

function sanitizeTransaction(entry: any): WalletTransaction | null {
  if (!entry || typeof entry !== "object") return null;
  const amount = round2(entry.amount);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  const type: WalletTransactionType = entry.type === "debit" ? "debit" : "credit";
  const description = typeof entry.description === "string" && entry.description.trim()
    ? entry.description.trim()
    : type === "credit"
    ? "Voucher credit"
    : "Voucher redemption";
  const balanceAfter = round2(entry.balanceAfter);
  const createdAt = typeof entry.createdAt === "string" && entry.createdAt ? entry.createdAt : new Date().toISOString();
  const reference = typeof entry.reference === "string" ? entry.reference : null;
  const metadata = entry.metadata && typeof entry.metadata === "object" ? entry.metadata : null;
  return {
    id: typeof entry.id === "string" && entry.id ? entry.id : crypto.randomUUID?.() ?? `tx_${Date.now().toString(36)}`,
    type,
    amount,
    description,
    reference,
    metadata,
    createdAt,
    balanceAfter,
  };
}

function sanitizeWallet(raw: any): WalletRecord | null {
  if (!raw || typeof raw !== "object") return null;
  const transactions = Array.isArray(raw.transactions)
    ? raw.transactions
        .map((tx) => sanitizeTransaction(tx))
        .filter((tx): tx is WalletTransaction => !!tx)
        .sort((a, b) => (a.createdAt > b.createdAt ? -1 : a.createdAt < b.createdAt ? 1 : 0))
        .slice(0, MAX_TRANSACTIONS)
    : [];
  const startingRaw = Number(raw.startingBalance);
  const startingBalance = Number.isFinite(startingRaw) ? round2(Math.max(0, startingRaw)) : STARTING_BALANCE;
  return {
    id: typeof raw.id === "string" && raw.id ? raw.id : "",
    version: Number(raw.version) || 1,
    uid: typeof raw.uid === "string" ? raw.uid : null,
    email: typeof raw.email === "string" ? raw.email : null,
    tenantId: normalizeTenant(raw.tenantId),
    role: normalizeRole(raw.role),
    balance: round2(raw.balance ?? STARTING_BALANCE),
    startingBalance,
    transactions,
    lastUpdated: typeof raw.lastUpdated === "string" && raw.lastUpdated ? raw.lastUpdated : new Date().toISOString(),
  };
}

function extractErrorMessage(error: unknown, fallback: string) {
  if (isAxiosError(error)) {
    const data = error.response?.data as any;
    if (typeof data === "string" && data.trim()) return data.trim();
    if (data && typeof data.message === "string" && data.message.trim()) return data.message.trim();
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const { tenantId: tenantRaw, role: roleRaw } = useAppSync();
  const [authUser, setAuthUser] = useState<User | null>(() => auth.currentUser);
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState<WalletRecord | null>(null);
  const [eligibleState, setEligibleState] = useState(false);

  const normalizedRole = useMemo(() => normalizeRole(roleRaw), [roleRaw]);
  const normalizedTenant = useMemo(() => normalizeTenant(tenantRaw), [tenantRaw]);
  const userEmail = useMemo(() => normalizeEmail(authUser?.email), [authUser?.email]);

  const locallyEligible = useMemo(() => {
    if (!authUser) return false;
    return ELIGIBLE_ROLES.has(normalizedRole) || ELIGIBLE_TENANTS.has(normalizedTenant);
  }, [authUser, normalizedRole, normalizedTenant]);

  useEffect(() => {
    const unsub = onIdTokenChanged(auth, (user) => {
      setAuthUser(user || null);
    });
    return () => unsub?.();
  }, []);

  const refresh = useCallback(async () => {
    if (!authUser || !locallyEligible) {
      setEligibleState(false);
      setWallet(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.get<{ eligible: boolean; wallet: unknown }>("/api/wallets/me", {
        suppressToast: true,
        suppressErrorLog: true,
      } as any);
      const remoteEligible = Boolean(data?.eligible);
      const nextWallet = remoteEligible ? sanitizeWallet(data?.wallet) : null;
      setEligibleState(locallyEligible && remoteEligible);
      setWallet(nextWallet);
    } catch (error) {
      setEligibleState(locallyEligible);
    } finally {
      setLoading(false);
    }
  }, [authUser, locallyEligible]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const redeemCredits = useCallback(
    async (amount: number, options: RedeemOptions = {}): Promise<WalletOperationResult> => {
      if (!locallyEligible) {
        return { ok: false, error: "You are not eligible to use voucher credits." };
      }
      const value = round2(amount);
      if (!Number.isFinite(value) || value <= 0) {
        return { ok: false, error: "Enter an amount greater than zero." };
      }
      try {
        const { data } = await api.post<{ wallet: unknown; transaction?: WalletTransaction }>(
          "/api/wallets/me/redeem",
          {
            amount: value,
            description: options.description,
            reference: options.reference,
            metadata: options.metadata,
          },
          { suppressToast: true } as any
        );
        const nextWallet = sanitizeWallet(data?.wallet) ?? null;
        if (nextWallet) setWallet(nextWallet);
        return {
          ok: true,
          wallet: nextWallet,
          transaction: data?.transaction || nextWallet?.transactions?.[0] || null,
        };
      } catch (error) {
        return { ok: false, error: extractErrorMessage(error, "Unable to redeem credits.") };
      }
    },
    [locallyEligible]
  );

  const grantCredits = useCallback(
    async (payload: GrantCreditPayload): Promise<WalletOperationResult> => {
      const value = round2(payload?.amount);
      if (!Number.isFinite(value) || value <= 0) {
        return { ok: false, error: "Enter an amount greater than zero." };
      }
      try {
        const { data } = await api.post<{ wallet: unknown; transaction?: WalletTransaction }>(
          "/api/wallets/grant",
          {
            amount: value,
            email: payload.email,
            uid: payload.uid,
            tenantId: payload.tenantId,
            role: payload.role,
            description: payload.description,
            reference: payload.reference,
            metadata: payload.metadata,
          },
          { suppressToast: true } as any
        );
        const nextWallet = sanitizeWallet(data?.wallet) ?? null;
        if (nextWallet && nextWallet.email && normalizeEmail(nextWallet.email) === userEmail) {
          setWallet(nextWallet);
          setEligibleState(true);
        }
        return {
          ok: true,
          wallet: nextWallet,
          transaction: data?.transaction || nextWallet?.transactions?.[0] || null,
        };
      } catch (error) {
        return { ok: false, error: extractErrorMessage(error, "Unable to grant credits.") };
      }
    },
    [userEmail]
  );

  const contextValue = useMemo<WalletContextValue>(
    () => ({
      loading,
      eligible: eligibleState,
      wallet,
      refresh,
      redeemCredits,
      grantCredits,
    }),
    [loading, eligibleState, wallet, refresh, redeemCredits, grantCredits]
  );

  return <WalletContext.Provider value={contextValue}>{children}</WalletContext.Provider>;
}

