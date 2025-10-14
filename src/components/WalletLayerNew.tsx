import { Icon } from "@iconify/react/dist/iconify.js";
import { useState, type FormEvent } from "react";
import { useWallet } from "../hook/useWalletAxios";
import { useAppSync } from "../context/useAppSync";
import { WalletSummaryCard, TransactionTable, formatCredits } from "./shared/WalletComponents";
import AdminWalletManager from "./shared/AdminWalletManager";

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

      if (!result.success) {
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

  return (
    <div className='row gy-4'>
      {/* Wallet Summary */}
      <div className='col-12 col-lg-8'>
        <WalletSummaryCard
          wallet={wallet}
          loading={loading}
          eligible={eligible}
          onRefresh={refresh}
          showActions={false}
        />
      </div>

      {/* Manual Transaction Entry */}
      <div className='col-12 col-lg-4'>
        <div className='card p-24 radius-12 h-100'>
          <h5 className='mb-3'>
            <Icon icon='mdi:receipt-text-plus' className='text-xl text-primary-600 me-2' />
            Record Usage
          </h5>
          <p className='text-secondary-light mb-3'>
            Manually record voucher usage for offline transactions or services not yet integrated with the marketplace.
          </p>
          
          {eligible && wallet && (
            <form onSubmit={onSubmit}>
              <div className='mb-3'>
                <label className='form-label text-sm text-secondary-light'>Amount</label>
                <div className='input-group'>
                  <span className='input-group-text'>R</span>
                  <input
                    type='text'
                    className='form-control'
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder='e.g. 150'
                    disabled={submitting}
                  />
                </div>
              </div>
              <div className='mb-3'>
                <label className='form-label text-sm text-secondary-light'>Description (optional)</label>
                <input
                  type='text'
                  className='form-control'
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder='What was this used for?'
                  disabled={submitting}
                />
              </div>
              <button 
                type='submit' 
                className='btn btn-primary w-100'
                disabled={submitting || !amount}
              >
                {submitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Recording...
                  </>
                ) : (
                  <>
                    <Icon icon='mdi:plus-circle' className='me-2' />
                    Record Usage
                  </>
                )}
              </button>
            </form>
          )}

          {feedback.message && (
            <div className={`alert alert-${feedback.type || "info"} mt-3 mb-0`}>
              <Icon icon={feedback.type === "success" ? "mdi:check-circle" : "mdi:alert-circle"} className="me-2" />
              {feedback.message}
            </div>
          )}
        </div>
      </div>

      {/* Transaction History */}
      {wallet && (
        <div className='col-12'>
          <div className='card p-24 radius-12'>
            <h5 className='mb-3'>
              <Icon icon='mdi:history' className='text-xl text-primary-600 me-2' />
              Transaction History
            </h5>
            <TransactionTable transactions={wallet.transactions || []} />
          </div>
        </div>
      )}

      {/* Admin Tools */}
      {isAdmin && (
        <div className='col-12'>
          <AdminWalletManager
            grantCredits={async (payload) => {
              const result = await grantCredits(
                payload.email || '',
                payload.amount,
                payload.description,
                { metadata: payload.metadata || undefined, reference: payload.reference }
              );
              return { ok: result.success, error: result.error, wallet: result.wallet };
            }}
            onRefresh={async () => refresh()}
            compact={false}
            showUserLookup={true}
          />
        </div>
      )}
    </div>
  );
}
