import { Icon } from "@iconify/react/dist/iconify.js";
import { isAxiosError } from "axios";
import { useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useWallet } from "../context/useWallet";
import { useAppSync } from "../context/useAppSync";
import { api } from "../lib/api";
import type { WalletContextValue, WalletRecord } from "../context/WalletContext";

const numberFormatter = new Intl.NumberFormat("en-ZA");
const dateFormatter = new Intl.DateTimeFormat("en-ZA", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatCredits(value: number | undefined | null) {
  const amount = Number(value) || 0;
  return numberFormatter.format(Math.round(amount));
}

function resolveErrorMessage(error: unknown, fallback: string) {
  if (isAxiosError(error)) {
    const data = error.response?.data as any;
    if (typeof data === "string" && data.trim()) return data.trim();
    if (data && typeof data.message === "string" && data.message.trim()) return data.message.trim();
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export default function WalletLayer() {
  const { loading, eligible, wallet, redeemCredits, grantCredits, refresh } = useWallet();
  const { isAdmin } = useAppSync();
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [feedback, setFeedback] = useState<{ type: "success" | "danger" | "info" | ""; message: string }>({
    type: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const spent = useMemo(() => {
    if (!wallet) return 0;
    return Math.max(0, Math.round((wallet.startingBalance - wallet.balance) * 100) / 100);
  }, [wallet]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!wallet) return;
    setFeedback({ type: "", message: "" });

    const parsedAmount = Number(amount.replace(/[^0-9.]/g, ""));
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setFeedback({ type: "danger", message: "Enter a valid voucher amount to record." });
      return;
    }

    setSubmitting(true);
    try {
      const result = await redeemCredits(parsedAmount, {
        description: note ? `Manual redemption: ${note.trim()}` : "Manual voucher redemption",
        metadata: { source: "my-wallet", note: note.trim() || undefined },
        reference: "manual-redemption",
      });

      if (!result.ok) {
        setFeedback({ type: "danger", message: result.error || "Unable to record voucher usage." });
        return;
      }

      setAmount("");
      setNote("");
      setFeedback({
        type: "success",
        message: `Voucher usage recorded. Remaining balance: ${formatCredits(result.wallet?.balance)} credits.`,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const renderTransactions = () => {
    if (!wallet) return null;
    const transactions = wallet.transactions || [];
    if (!transactions.length) {
      return <p className='text-secondary-light mb-0'>No voucher activity yet. Purchases using the marketplace will appear here.</p>;
    }

    return (
      <div className='table-responsive'>
        <table className='table bordered-table mb-0'>
          <thead>
            <tr>
              <th scope='col'>Date</th>
              <th scope='col'>Description</th>
              <th scope='col'>Type</th>
              <th scope='col' className='text-end'>Amount</th>
              <th scope='col' className='text-end'>Balance</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => {
              const badgeClass = tx.type === "credit" ? "bg-success-focus text-success-600" : "bg-warning-focus text-warning-600";
              const formattedDate = safeFormatDate(tx.createdAt);
              return (
                <tr key={tx.id}>
                  <td>{formattedDate}</td>
                  <td>{tx.description}</td>
                  <td>
                    <span className={`badge ${badgeClass} text-uppercase`}>{tx.type}</span>
                  </td>
                  <td className='text-end'>{tx.type === "debit" ? "-" : "+"}{formatCredits(tx.amount)}</td>
                  <td className='text-end'>{formatCredits(tx.balanceAfter)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  if (loading) {
    return (
      <div className='card p-24 radius-12'>
        <div className='d-flex align-items-center gap-2'>
          <span className='spinner-border spinner-border-sm text-primary' role='status' aria-hidden='true'></span>
          <span>Loading your voucher wallet…</span>
        </div>
      </div>
    );
  }

  if (!eligible) {
    return (
      <div className='card p-24 radius-12'>
        <div className='d-flex flex-column gap-2'>
          <Icon icon='mdi:shield-alert-outline' className='text-2xl text-warning-600' />
          <h5 className='mb-8'>My Wallet is only available to startup and vendor accounts.</h5>
          <p className='text-secondary-light mb-8'>Switch to your startup or vendor profile, or contact the marketplace team if you think this is a mistake.</p>
          <Link to='/support' className='btn btn-outline-primary btn-sm align-self-start'>Contact Support</Link>
        </div>
      </div>
    );
  }

  if (!wallet) {
    return (
      <div className='card p-24 radius-12'>
        <p className='mb-0'>We could not load your voucher wallet. Please refresh and try again.</p>
      </div>
    );
  }

  return (
    <div className='row gy-4'>
      <div className='col-12 col-xl-4'>
        <div className='card h-100 p-24 radius-12 d-flex flex-column gap-3'>
          <div className='d-flex align-items-center justify-content-between'>
            <h5 className='mb-0'>Voucher Summary</h5>
            <Icon icon='mdi:wallet-giftcard' className='text-2xl text-primary-600' />
          </div>
          <div className='bg-primary-50 p-16 radius-12'>
            <span className='text-sm text-secondary-light d-block mb-2'>Available credits</span>
            <h3 className='mb-0'>{formatCredits(wallet.balance)} credits</h3>
          </div>
          <div className='d-flex flex-column gap-2'>
            <SummaryRow label='Initial allocation' value={`${formatCredits(wallet.startingBalance)} credits`} icon='mdi:rocket-launch-outline' />
            <SummaryRow label='Credits used to date' value={`${formatCredits(spent)} credits`} icon='mdi:chart-line' />
            <SummaryRow label='Last activity' value={safeFormatDate(wallet.lastUpdated)} icon='mdi:clock-outline' />
          </div>
          <div className='mt-auto pt-3'>
            <Link to='/market1' className='btn btn-primary w-100 d-flex justify-content-center align-items-center gap-2'>
              <Icon icon='mdi:shopping-outline' className='text-xl' />
              Browse Listings
            </Link>
          </div>
          <small className='text-secondary-light'>Use your voucher credits to unlock services from approved marketplace vendors. Credits are automatically applied during checkout.</small>
        </div>
      </div>

      <div className='col-12 col-xl-8 d-flex flex-column gap-3'>
        <div className='card p-24 radius-12'>
          <div className='d-flex align-items-center justify-content-between mb-3'>
            <h5 className='mb-0'>Record manual usage</h5>
            <span className='badge text-bg-light text-secondary-emphasis'>Optional</span>
          </div>
          <p className='text-secondary-light'>Marketplace purchases automatically use your voucher wallet. Record additional voucher usage here if you redeemed credits with the team offline.</p>
          <form className='row g-3' onSubmit={onSubmit}>
            <div className='col-12 col-md-4'>
              <label className='form-label text-sm text-secondary-light'>Voucher amount</label>
              <div className='input-group'>
                <span className='input-group-text'>R</span>
                <input
                  type='text'
                  className='form-control'
                  inputMode='decimal'
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder='e.g. 2 500'
                  disabled={submitting}
                  aria-label='Voucher amount'
                />
              </div>
            </div>
            <div className='col-12 col-md-8'>
              <label className='form-label text-sm text-secondary-light'>Purpose / notes</label>
              <input
                type='text'
                className='form-control'
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder='Listing reference or comment (optional)'
                maxLength={120}
                disabled={submitting}
                aria-label='Voucher notes'
              />
            </div>
            <div className='col-12 d-flex gap-2'>
              <button type='submit' className='btn btn-primary btn-sm' disabled={submitting}>
                {submitting ? "Recording…" : "Record usage"}
              </button>
              <button type='button' className='btn btn-outline-secondary btn-sm' disabled={submitting || (!amount && !note)} onClick={() => { setAmount(""); setNote(""); setFeedback({ type: "", message: "" }); }}>
                Clear
              </button>
            </div>
            {feedback.message && (
              <div className='col-12'>
                <div className={`alert alert-${feedback.type || "info"} mb-0`}>{feedback.message}</div>
              </div>
            )}
          </form>
        </div>

        <div className='card p-24 radius-12 flex-grow-1 d-flex flex-column'>
          <div className='d-flex align-items-center justify-content-between mb-3'>
            <h5 className='mb-0'>Voucher activity</h5>
            <span className='text-secondary-light text-sm'>Showing up to {(wallet.transactions?.length || 0)} recent entries</span>
          </div>
          <div className='flex-grow-1'>{renderTransactions()}</div>
        </div>
      </div>

      {isAdmin && (
        <div className='col-12'>
          <AdminWalletManager grantCredits={grantCredits} refresh={refresh} />
        </div>
      )}
    </div>
  );
}

function AdminWalletManager({ grantCredits, refresh }: { grantCredits: WalletContextValue["grantCredits"]; refresh: () => Promise<void> }) {
  const [email, setEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [working, setWorking] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "danger" | ""; message: string }>({ type: "", message: "" });
  const [preview, setPreview] = useState<WalletRecord | null>(null);
  const [lookupState, setLookupState] = useState<{ loading: boolean; error: string }>({ loading: false, error: "" });

  const normalizedEmail = email.trim().toLowerCase();

  const handleLookup = async () => {
    if (!normalizedEmail) {
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
      await refresh();
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
    <div className='card p-24 radius-12 d-flex flex-column gap-3'>
      <div className='d-flex align-items-center justify-content-between'>
        <h5 className='mb-0'>Grant credits to a user</h5>
        <span className='badge text-bg-light text-secondary-emphasis'>Admin</span>
      </div>
      <p className='text-secondary-light mb-0'>Send voucher credits to any account. Wallets are created automatically if they do not exist.</p>
      <form className='row g-3' onSubmit={handleSubmit}>
        <div className='col-12 col-md-5'>
          <label className='form-label text-sm text-secondary-light'>User email</label>
          <input
            type='email'
            className='form-control'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder='user@example.com'
            autoComplete='off'
            required
          />
        </div>
        <div className='col-12 col-md-3'>
          <label className='form-label text-sm text-secondary-light'>Credit amount</label>
          <div className='input-group'>
            <span className='input-group-text'>R</span>
            <input
              type='text'
              className='form-control'
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputMode='decimal'
              placeholder='e.g. 5000'
              required
            />
          </div>
        </div>
        <div className='col-12 col-md-4'>
          <label className='form-label text-sm text-secondary-light'>Notes (optional)</label>
          <input
            type='text'
            className='form-control'
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder='Reason or listing reference'
            maxLength={120}
          />
        </div>
        <div className='col-12 d-flex flex-wrap gap-2'>
          <button type='submit' className='btn btn-primary btn-sm' disabled={working}>
            {working ? "Granting…" : "Grant credits"}
          </button>
          <button
            type='button'
            className='btn btn-outline-secondary btn-sm'
            onClick={handleLookup}
            disabled={lookupState.loading || !normalizedEmail}
          >
            {lookupState.loading ? "Loading…" : "Preview wallet"}
          </button>
          <button type='button' className='btn btn-outline-secondary btn-sm' onClick={clearForm} disabled={working || lookupState.loading}>
            Clear
          </button>
        </div>
      </form>
      {feedback.message && <div className={`alert alert-${feedback.type || "info"} mb-0`}>{feedback.message}</div>}
      {lookupState.error && !feedback.message && <div className='alert alert-warning mb-0'>{lookupState.error}</div>}
      {preview && (
        <div className='border border-dashed rounded-3 p-16 bg-neutral-50'>
          <h6 className='mb-2'>Latest wallet snapshot</h6>
          <div className='d-flex flex-wrap gap-3 text-sm'>
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

function SummaryRow({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className='d-flex align-items-center gap-3'>
      <div className='p-10 bg-neutral-100 rounded-circle d-flex align-items-center justify-content-center'>
        <Icon icon={icon} className='text-lg text-primary-600' />
      </div>
      <div className='flex-grow-1'>
        <span className='text-xs text-secondary-light d-block'>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function safeFormatDate(input?: string | null) {
  if (!input) return "--";
  try {
    return dateFormatter.format(new Date(input));
  } catch {
    return input;
  }
}
