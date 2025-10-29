// src/components/shared/AdminWalletManager.tsx
import { useState, FormEvent, useEffect } from "react";
import { Icon } from "@iconify/react";
import { api } from "../../lib/api";
import { formatCredits } from "./WalletComponents";
import type { WalletRecord, WalletContextValue } from "../../context/WalletContext";

interface AdminWalletManagerProps {
  grantCredits?: WalletContextValue["grantCredits"];
  onRefresh?: () => Promise<void>;
  compact?: boolean;
  showUserLookup?: boolean;
  selectedUserEmail?: string;
  // eslint-disable-next-line no-unused-vars
  onEmailChange?: (payload: { email: string }) => void;
}

function resolveErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as any;
    const data = axiosError.response?.data as any;
    if (typeof data === "string" && data.trim()) return data.trim();
    if (data && typeof data.message === "string" && data.message.trim()) return data.message.trim();
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export default function AdminWalletManager({ 
  grantCredits, 
  onRefresh, 
  compact = false,
  showUserLookup = true,
  selectedUserEmail = "",
  onEmailChange
}: AdminWalletManagerProps) {
  const [email, setEmail] = useState(selectedUserEmail);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [working, setWorking] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "danger" | ""; message: string }>({ type: "", message: "" });
  const [preview, setPreview] = useState<WalletRecord | null>(null);
  const [lookupState, setLookupState] = useState<{ loading: boolean; error: string }>({ loading: false, error: "" });

  const normalizedEmail = email.trim().toLowerCase();

  // Update email when selectedUserEmail prop changes
  useEffect(() => {
    if (selectedUserEmail && selectedUserEmail !== email) {
      setEmail(selectedUserEmail);
      setFeedback({ type: "", message: "" });
      setPreview(null);
      setLookupState({ loading: false, error: "" });
    }
  }, [selectedUserEmail, email]);

  const handleEmailChange = (newEmail: string) => {
    setEmail(newEmail);
    if (onEmailChange) {
      onEmailChange({ email: newEmail });
    }
  };

  const handleLookup = async () => {
    if (!normalizedEmail || !showUserLookup) {
      setLookupState({ loading: false, error: "Enter an email to preview a wallet." });
      setPreview(null);
      return;
    }
    setLookupState({ loading: true, error: "" });

    try {
      const { data } = await api.get<{ wallet: WalletRecord | null }>("/api/wallets/admin/lookup", {
        params: { email: normalizedEmail },
        suppressToast: true,
        suppressErrorLog: true,
      } as any);
      const next = data?.wallet ? (data.wallet as WalletRecord) : null;
      setPreview(next);
      setLookupState({ loading: false, error: next ? "" : "No wallet exists yet for that user." });
    } catch (error) {
      setPreview(null);
      setLookupState({ loading: false, error: resolveErrorMessage(error, "Unable to fetch wallet details.") });
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFeedback({ type: "", message: "" });
    if (!normalizedEmail) {
      setFeedback({ type: "danger", message: "Enter the recipient's email address." });
      return;
    }
    const parsedAmount = Number(amount.replace(/[^0-9.]/g, ""));
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setFeedback({ type: "danger", message: "Enter a valid credit amount." });
      return;
    }
    
    if (!grantCredits) {
      setFeedback({ type: "danger", message: "Grant credits function not available." });
      return;
    }

    setWorking(true);
    try {
      const result = await grantCredits({
        email: normalizedEmail,
        amount: parsedAmount,
        description: note ? `Admin credit: ${note.trim()}` : "Admin credit",
        metadata: { source: "admin-grant", note: note.trim() || undefined },
      });

      if (!result.ok) {
        setFeedback({ type: "danger", message: result.error || "Unable to grant credits." });
        return;
      }

      setAmount("");
      setNote("");
      setFeedback({
        type: "success",
        message: `Granted ${formatCredits(parsedAmount)} credits. New balance: ${formatCredits(result.wallet?.balance || 0)} credits.`,
      });
      setPreview(result.wallet || null);
      setLookupState({ loading: false, error: "" });
      if (onRefresh) await onRefresh();
    } catch (error) {
      setFeedback({ type: "danger", message: resolveErrorMessage(error, "Unable to grant credits.") });
    } finally {
      setWorking(false);
    }
  };

  const clearForm = () => {
    setEmail("");
    setAmount("");
    setNote("");
    setFeedback({ type: "", message: "" });
    setPreview(null);
    setLookupState({ loading: false, error: "" });
  };

  return (
    <div className={`card ${compact ? 'p-16' : 'p-24'} radius-12 d-flex flex-column gap-3`}>
      <div className="d-flex align-items-center justify-content-between">
        <h5 className="mb-0">
          <Icon icon="mdi:wallet-plus" className="text-xl text-primary-600 me-2" />
          Grant Credits
        </h5>
        <span className="badge text-bg-light text-secondary-emphasis">Admin</span>
      </div>
      <p className="text-secondary-light mb-0">Send voucher credits to any account. Wallets are created automatically if they do not exist.</p>
      
      <form className={`row g-3 ${compact ? 'g-2' : 'g-3'}`} onSubmit={handleSubmit}>
        <div className={compact ? 'col-12' : 'col-12 col-md-5'}>
          <label className="form-label text-sm text-secondary-light">User Email</label>
          <input
            type="email"
            className="form-control"
            value={email}
            onChange={(e) => handleEmailChange(e.target.value)}
            placeholder="user@example.com"
            autoComplete="off"
            required
          />
        </div>
        <div className={compact ? 'col-6' : 'col-12 col-md-3'}>
          <label className="form-label text-sm text-secondary-light">Credit Amount</label>
          <div className="input-group">
            <span className="input-group-text">R</span>
            <input
              type="text"
              className="form-control"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputMode="decimal"
              placeholder="e.g. 5000"
              required
            />
          </div>
        </div>
        <div className={compact ? 'col-6' : 'col-12 col-md-4'}>
          <label className="form-label text-sm text-secondary-light">Notes (optional)</label>
          <input
            type="text"
            className="form-control"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Reason or reference"
            maxLength={120}
          />
        </div>
        <div className="col-12 d-flex flex-wrap gap-2">
          <button type="submit" className="btn btn-primary btn-sm" disabled={working}>
            {working ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Granting...
              </>
            ) : (
              <>
                <Icon icon="mdi:plus-circle" className="me-1" />
                Grant Credits
              </>
            )}
          </button>
          {showUserLookup && (
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              onClick={handleLookup}
              disabled={lookupState.loading || !normalizedEmail}
            >
              {lookupState.loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Loading...
                </>
              ) : (
                <>
                  <Icon icon="mdi:magnify" className="me-1" />
                  Preview Wallet
                </>
              )}
            </button>
          )}
          <button 
            type="button" 
            className="btn btn-outline-secondary btn-sm" 
            onClick={clearForm} 
            disabled={working || lookupState.loading}
          >
            <Icon icon="mdi:refresh" className="me-1" />
            Clear
          </button>
        </div>
      </form>

      {feedback.message && (
        <div className={`alert alert-${feedback.type || "info"} mb-0`}>
          <Icon icon={feedback.type === "success" ? "mdi:check-circle" : "mdi:alert-circle"} className="me-2" />
          {feedback.message}
        </div>
      )}
      
      {lookupState.error && !feedback.message && (
        <div className="alert alert-warning mb-0">
          <Icon icon="mdi:information" className="me-2" />
          {lookupState.error}
        </div>
      )}

      {preview && showUserLookup && (
        <div className="border border-dashed rounded-3 p-16 bg-neutral-50">
          <h6 className="mb-2">
            <Icon icon="mdi:account-cash" className="me-2" />
            Wallet Preview
          </h6>
          <div className="d-flex flex-wrap gap-3 text-sm">
            <span>
              <strong>Email:</strong> {preview.email || normalizedEmail}
            </span>
            <span>
              <strong>Tenant:</strong> {preview.tenantId}
            </span>
            <span>
              <strong>Balance:</strong> R {formatCredits(preview.balance)}
            </span>
            <span>
              <strong>Transactions:</strong> {preview.transactions?.length || 0}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
